/* ── Fixed-route rail trains for metro floors and anomalies ───── */

import {
  EntityType,
  Faction,
  W,
  msg,
  type Entity,
  type GameState,
  type RailTrain,
  type RailTrainTrack,
  type WorldEventSeverity,
} from '../core/types';
import { World } from '../core/world';
import { Spr } from '../render/sprite_index';
import { publishEvent } from './events';

const SEGMENT_STRIDE = 2;
const BOARD_DIST2 = 3.2 * 3.2;
const TRAIN_LOOK_DIST2 = 4.8 * 4.8;
const CONTACT_DIST2 = 0.72 * 0.72;
const WARN_DIST2 = 5.0 * 5.0;

export interface RailTrainSpawnOptions {
  id: string;
  label: string;
  speed: number;
  length: number;
  initialOffset?: number;
  direction?: 1 | -1;
  stopSeconds?: number;
}

function wrapOffset(track: RailTrainTrack, offset: number): number {
  const n = track.cells.length;
  if (n <= 0) return 0;
  return ((offset % n) + n) % n;
}

function offsetIndex(track: RailTrainTrack, offset: number): number {
  return Math.floor(wrapOffset(track, offset)) % track.cells.length;
}

function trackById(world: World, trackId: string): RailTrainTrack | undefined {
  return world.railTracks.find(track => track.id === trackId);
}

function trainStopped(train: RailTrain, state: GameState): boolean {
  return train.stopUntil < 0 || state.time <= train.stopUntil;
}

function entityById(entities: Entity[], id: number): Entity | undefined {
  for (const e of entities) if (e.id === id) return e;
  return undefined;
}

function cellCenter(ci: number): { x: number; y: number } {
  return { x: ci % W, y: (ci / W) | 0 };
}

function trainCellAt(track: RailTrainTrack, train: RailTrain, segment: number): number {
  const offset = train.offset - segment * SEGMENT_STRIDE * train.direction;
  return track.cells[offsetIndex(track, offset)];
}

function crossedStation(track: RailTrainTrack, from: number, to: number, station: number, direction: 1 | -1): boolean {
  const n = track.cells.length;
  if (n <= 0) return false;
  if (direction > 0) {
    const travel = (to - from + n) % n;
    const target = (station - from + n) % n;
    return target > 0.01 && target <= travel + 0.01;
  }
  const travel = (from - to + n) % n;
  const target = (from - station + n) % n;
  return target > 0.01 && target <= travel + 0.01;
}

function nearestPlatformCell(world: World, track: RailTrainTrack, x: number, y: number, maxDist2: number): number {
  let best = -1;
  let bestD2 = maxDist2;
  for (const ci of track.platformCells) {
    const p = cellCenter(ci);
    const d2 = world.dist2(x, y, p.x + 0.5, p.y + 0.5);
    if (d2 < bestD2) {
      bestD2 = d2;
      best = ci;
    }
  }
  return best;
}

function trainDistance2(world: World, track: RailTrainTrack, train: RailTrain, x: number, y: number): number {
  let best = Infinity;
  for (let i = 0; i < train.length; i++) {
    const p = cellCenter(trainCellAt(track, train, i));
    const d2 = world.dist2(x, y, p.x + 0.5, p.y + 0.5);
    if (d2 < best) best = d2;
  }
  return best;
}

function publishRailEvent(
  world: World,
  state: GameState,
  actor: Entity,
  train: RailTrain,
  type: 'rail_train_boarded' | 'rail_train_exited' | 'rail_train_crush',
  severity: WorldEventSeverity,
  tags: string[],
  extra: Record<string, unknown> = {},
): void {
  const ci = world.idx(Math.floor(actor.x), Math.floor(actor.y));
  publishEvent(state, {
    type,
    zoneId: world.zoneMap[ci],
    roomId: world.roomMap[ci],
    x: actor.x,
    y: actor.y,
    actorId: actor.id,
    actorName: actor.name ?? (actor.type === EntityType.PLAYER ? 'Вы' : 'цель'),
    actorFaction: actor.faction,
    severity,
    privacy: 'local',
    tags: ['rail', 'train', 'metro', train.id, train.trackId, ...tags],
    data: {
      trainId: train.id,
      trainLabel: train.label,
      trackId: train.trackId,
      ...extra,
    },
  });
}

function positionTrainEntities(world: World, entities: Entity[], track: RailTrainTrack, train: RailTrain, trainIndex: number): void {
  for (let i = 0; i < train.entityIds.length; i++) {
    const entity = entityById(entities, train.entityIds[i]);
    if (!entity) continue;
    const ci = trainCellAt(track, train, i);
    const p = cellCenter(ci);
    entity.x = p.x + 0.5;
    entity.y = p.y + 0.5;
    entity.angle = 0;
    entity.alive = true;
    world.railTrainCells.set(ci, trainIndex);
    const fillOffset = train.offset - (i * SEGMENT_STRIDE + 1) * train.direction;
    world.railTrainCells.set(track.cells[offsetIndex(track, fillOffset)], trainIndex);
  }
}

function bindPassenger(player: Entity, track: RailTrainTrack, train: RailTrain): void {
  const ci = trainCellAt(track, train, Math.max(0, Math.min(train.length - 1, train.passengerSeat)));
  const p = cellCenter(ci);
  player.x = p.x + 0.5;
  player.y = p.y + 0.5;
}

function stopTrain(train: RailTrain, station: number, state: GameState, world: World, track: RailTrainTrack, player: Entity): void {
  train.offset = station;
  train.lastStopOffset = station;
  train.stopUntil = state.time + train.stopSeconds;
  if (state.time >= train.nextDoorMsgAt && trainDistance2(world, track, train, player.x, player.y) < 16 * 16) {
    train.nextDoorMsgAt = state.time + 6;
    state.msgs.push(msg(`${train.label}: двери открыты, можно сесть или выйти.`, state.time, '#6cf'));
  }
}

function updateTrainMotion(world: World, track: RailTrainTrack, train: RailTrain, state: GameState, player: Entity, dt: number): void {
  if (train.stopUntil < 0) {
    const station = track.stationOffsets[0] ?? offsetIndex(track, train.offset);
    stopTrain(train, station, state, world, track, player);
    return;
  }
  if (state.time <= train.stopUntil) return;

  const from = wrapOffset(track, train.offset);
  let to = wrapOffset(track, train.offset + train.speed * train.direction * dt);
  for (const station of track.stationOffsets) {
    if (station === train.lastStopOffset && Math.abs(from - station) < 2) continue;
    if (crossedStation(track, from, to, station, train.direction)) {
      to = station;
      stopTrain(train, station, state, world, track, player);
      break;
    }
  }
  train.offset = to;
}

function damageEntity(world: World, victim: Entity, train: RailTrain, state: GameState): void {
  if (victim.type === EntityType.ITEM_DROP || victim.type === EntityType.PROJECTILE) return;
  const amount = victim.type === EntityType.PLAYER ? 38 : 260;
  if (victim.hp !== undefined) {
    victim.hp = Math.max(0, victim.hp - amount);
    if (victim.hp <= 0) victim.alive = false;
  } else {
    victim.alive = false;
  }
  publishRailEvent(world, state, victim, train, 'rail_train_crush', victim.type === EntityType.PLAYER ? 5 : 4, ['crush'], {
    damage: amount,
    killed: !victim.alive,
  });
}

function updateTrainCollisions(world: World, entities: Entity[], player: Entity, state: GameState): void {
  if (world.railTrainCells.size === 0) return;
  for (const entity of entities) {
    if (!entity.alive) continue;
    const ci = world.idx(Math.floor(entity.x), Math.floor(entity.y));
    const trainIndex = world.railTrainCells.get(ci);
    if (trainIndex === undefined) {
      if (entity.id === player.id) {
        for (const train of world.railTrains) {
          const track = trackById(world, train.trackId);
          if (!track || trainStopped(train, state) || train.passengerId === player.id) continue;
          if (state.time >= train.nextWarnAt && trainDistance2(world, track, train, player.x, player.y) < WARN_DIST2) {
            train.nextWarnAt = state.time + 4;
            state.msgs.push(msg('Рельсы дрожат: поезд близко. Платформа безопаснее пути.', state.time, '#fa4'));
          }
        }
      }
      continue;
    }

    const train = world.railTrains[trainIndex];
    const track = train ? trackById(world, train.trackId) : undefined;
    if (!train || !track || trainStopped(train, state) || train.passengerId === entity.id) continue;
    if (trainDistance2(world, track, train, entity.x, entity.y) > CONTACT_DIST2) continue;
    if (entity.id === player.id && state.time < train.nextCrushAt) continue;
    if (entity.id === player.id) {
      train.nextCrushAt = state.time + 0.85;
      state.msgs.push(msg(`${train.label} ударил по костям: -38 HP.`, state.time, '#f66'));
    }
    damageEntity(world, entity, train, state);
  }
}

function boardableTrain(world: World, player: Entity, state: GameState, lookX: number, lookY: number): RailTrain | undefined {
  for (const train of world.railTrains) {
    const track = trackById(world, train.trackId);
    if (!track || !trainStopped(train, state)) continue;
    if (nearestPlatformCell(world, track, player.x, player.y, BOARD_DIST2) < 0) continue;
    if (trainDistance2(world, track, train, lookX, lookY) > TRAIN_LOOK_DIST2) continue;
    return train;
  }
  return undefined;
}

export function addRailTrainRoute(
  world: World,
  entities: Entity[],
  nextId: { v: number },
  track: RailTrainTrack,
  opts: RailTrainSpawnOptions,
): RailTrain | null {
  if (track.cells.length < Math.max(12, opts.length * SEGMENT_STRIDE + 2)) return null;
  world.railTracks.push(track);

  const train: RailTrain = {
    id: opts.id,
    label: opts.label,
    trackId: track.id,
    offset: wrapOffset(track, opts.initialOffset ?? track.stationOffsets[0] ?? 0),
    speed: opts.speed,
    length: opts.length,
    direction: opts.direction ?? 1,
    stopSeconds: opts.stopSeconds ?? 4,
    stopUntil: -1,
    passengerId: -1,
    passengerSeat: Math.max(1, Math.floor(opts.length * 0.42)),
    entityIds: [],
    lastStopOffset: -1,
    nextWarnAt: 0,
    nextCrushAt: 0,
    nextDoorMsgAt: 0,
  };

  for (let i = 0; i < train.length; i++) {
    const id = nextId.v++;
    train.entityIds.push(id);
    entities.push({
      id,
      type: EntityType.ITEM_DROP,
      x: 0,
      y: 0,
      angle: 0,
      pitch: 0,
      alive: true,
      speed: 0,
      sprite: Spr.TRAIN_CAR,
      spriteScale: i === 0 ? 1.85 : 1.55,
      spriteZ: 0,
      name: i === 0 ? opts.label : `${opts.label} вагон`,
      faction: Faction.WILD,
      inventory: [],
    });
  }

  world.railTrains.push(train);
  positionTrainEntities(world, entities, track, train, world.railTrains.length - 1);
  return train;
}

export function isRidingRailTrain(world: World, player: Entity): boolean {
  return world.railTrains.some(train => train.passengerId === player.id);
}

export function railTrainInteractionTargetId(
  world: World,
  player: Entity,
  state: GameState,
  lookX: number,
  lookY: number,
): number | null {
  const riding = world.railTrains.find(train => train.passengerId === player.id);
  if (riding) return 940000 + world.railTrains.indexOf(riding);
  const train = boardableTrain(world, player, state, lookX, lookY);
  return train ? 930000 + world.railTrains.indexOf(train) : null;
}

export function tryUseRailTrain(
  world: World,
  player: Entity,
  state: GameState,
  lookX: number,
  lookY: number,
): boolean {
  const riding = world.railTrains.find(train => train.passengerId === player.id);
  if (riding) {
    const track = trackById(world, riding.trackId);
    if (!track || !trainStopped(riding, state)) {
      state.msgs.push(msg('Двери поезда закрыты. Сойти можно на следующей платформе.', state.time, '#888'));
      return true;
    }
    const exit = nearestPlatformCell(world, track, player.x, player.y, 8 * 8);
    if (exit < 0) {
      state.msgs.push(msg('За дверью нет платформы. Поезд держит маршрут дальше.', state.time, '#888'));
      return true;
    }
    const p = cellCenter(exit);
    player.x = p.x + 0.5;
    player.y = p.y + 0.5;
    riding.passengerId = -1;
    state.msgs.push(msg(`${riding.label}: вы вышли на платформу.`, state.time, '#8cf'));
    publishRailEvent(world, state, player, riding, 'rail_train_exited', 3, ['exit']);
    return true;
  }

  const train = boardableTrain(world, player, state, lookX, lookY);
  if (!train) return false;
  train.passengerId = player.id;
  train.passengerSeat = Math.max(1, Math.floor(train.length * 0.42));
  const track = trackById(world, train.trackId);
  if (track) bindPassenger(player, track, train);
  state.msgs.push(msg(`${train.label}: двери закрылись, маршрут пошел.`, state.time, '#6cf'));
  publishRailEvent(world, state, player, train, 'rail_train_boarded', 3, ['board']);
  return true;
}

export function updateRailTrains(world: World, entities: Entity[], player: Entity, state: GameState, dt: number): void {
  if (world.railTrains.length === 0) return;
  world.railTrainCells.clear();
  for (let i = 0; i < world.railTrains.length; i++) {
    const train = world.railTrains[i];
    const track = trackById(world, train.trackId);
    if (!track || track.cells.length === 0) continue;
    updateTrainMotion(world, track, train, state, player, dt);
    positionTrainEntities(world, entities, track, train, i);
    if (train.passengerId === player.id) bindPassenger(player, track, train);
  }
  updateTrainCollisions(world, entities, player, state);
}
