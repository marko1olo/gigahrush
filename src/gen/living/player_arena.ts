import { Entity, EntityType, AIGoal, MonsterKind, RoomType, Tex, GameState, WorldEvent } from '../../core/types';
import { World } from '../../core/world';
import { findClearArea, protectRoom, stampRoom } from '../shared';
import { publishEvent, registerWorldEventObserver } from '../../systems/events';
import { registerZoneContent } from './zone_content';
import { gaussianLevel, randomRPG, scaleMonsterSpeed, scaleMonsterHp } from '../../systems/rpg';
import { isPlayerEntity } from '../../systems/player_actor';
import { playRouteCueTone, playSoundAt } from '../../systems/audio';
import { MONSTERS } from '../../entities/monster';
import { Spr } from '../../render/sprite_index';

const ROOM_W = 19;
const ROOM_H = 19;
const MAX_WAVES = 10;
const WAVE_INTERVAL_TICKS = 15 * 60; // 15 seconds at 60 fps
const EVENT_TAG = 'player_arena_event';

export const PLAYER_ARENA_HOSTILE_CAP = 15;

interface ArenaSite {
  x: number;
  y: number;
  roomId: number;
  wave: number;
  timer: number;
  hostileIds: number[];
  completed: boolean;
  spawned: boolean;
  zoneId: number;
}

let activeWorld: World | null = null;
let activeEntities: Entity[] | null = null;
let arenaSite: ArenaSite | null = null;

registerWorldEventObserver((state, event) => {
    if (event.tags.includes(EVENT_TAG)) return;
    const site = arenaSite;
    const world = activeWorld;
    const entities = activeEntities;
    if (!site || !world || !entities || state.currentFloor !== event.floor) return;

    if (event.type === 'samosbor_warning' && event.tags.includes('player_arena_enter') && event.roomId === site.roomId) {
       // start wave logic
       site.spawned = true;
       site.timer = WAVE_INTERVAL_TICKS;
       publishArenaMessage(state, site, event, `Арена: Волна 1 началась!`);
       spawnArenaWave(state, world, entities, site, event);
    }

    if ((event.type === 'death_seen') && event.targetId !== undefined) {
        if (!site.hostileIds.includes(event.targetId)) return;
        const idx = site.hostileIds.indexOf(event.targetId);
        if (idx !== -1) site.hostileIds.splice(idx, 1);

        if (site.hostileIds.length === 0 && site.wave >= MAX_WAVES && !site.completed) {
            completeArena(state, world, entities, site, event);
        }
    }


    if (state.tick % 60 === 0 && site.spawned && !site.completed && site.wave < MAX_WAVES) {
        let allDead = true;
        for (let i = 0; i < site.hostileIds.length; i++) {
           let foundAlive = false;
           for (const entity of entities) {
              if (entity.id === site.hostileIds[i] && entity.alive) { foundAlive = true; break; }
           }
           if (foundAlive) { allDead = false; break; }
        }

        if (allDead) {
            if (site.timer > 0) site.timer -= 60;
            else {
                site.wave++;
                site.timer = WAVE_INTERVAL_TICKS;
                publishArenaMessage(state, site, event, `Арена: Волна ${site.wave} началась!`);
                spawnArenaWave(state, world, entities, site, event);
            }
        }
    }

});

function spawnArenaWave(_state: GameState, world: World, entities: Entity[], site: ArenaSite, _source: WorldEvent): void {
  const player = findPlayer(entities);
  let toSpawn = site.wave + 1; // +1 mob per wave
  let monsterKind = MonsterKind.SBORKA;

  if (site.wave >= 2) monsterKind = MonsterKind.TVAR;
  if (site.wave >= 3) monsterKind = MonsterKind.BETONNIK;
  if (site.wave >= 5) monsterKind = MonsterKind.POLZUN;
  if (site.wave >= 7) monsterKind = MonsterKind.NIGHTMARE;
  if (site.wave >= 9) monsterKind = MonsterKind.MATKA;

  for(let i = 0; i < toSpawn; i++) {
       if (site.hostileIds.length >= PLAYER_ARENA_HOSTILE_CAP) break;
       const nextId = { v: nextEntityId(entities) };
       const dx = 2 + Math.floor(Math.random() * (ROOM_W - 4));
       const dy = 2 + Math.floor(Math.random() * (ROOM_H - 4));
       const entity = createArenaMonster(world, site, nextId, monsterKind, dx, dy, player ?? undefined);
       entities.push(entity);
       site.hostileIds.push(entity.id);
  }
}

function createArenaMonster(
  _world: World,
  site: ArenaSite,
  nextId: { v: number },
  kind: MonsterKind,
  dx: number,
  dy: number,
  target?: Entity,
): Entity {
  const x = site.x + dx + 0.5;
  const y = site.y + dy + 0.5;
  const def = MONSTERS[kind];
  const rpg = randomRPG(gaussianLevel(site.wave + 2, 1.5));

  return {
    id: nextId.v++,
    type: EntityType.MONSTER,
    x,
    y,
    angle: Math.random() * Math.PI * 2,
    pitch: 0,
    alive: true,
    speed: scaleMonsterSpeed(def.speed, 0.5),
    sprite: def.sprite,
    hp: scaleMonsterHp(def.hp, 0.5),
    maxHp: scaleMonsterHp(def.hp, 0.5),
    ai: {
      goal: target ? AIGoal.HUNT : AIGoal.IDLE,
      tx: Math.floor(target?.x ?? x),
      ty: Math.floor(target?.y ?? y),
      path: [],
      pi: 0,
      stuck: 0,
      timer: 0,
    },
    inventory: [],
    monsterKind: kind,
    rpg,
  };
}

function completeArena(state: GameState, _world: World, entities: Entity[], site: ArenaSite, source: WorldEvent): void {
   site.completed = true;
   publishArenaMessage(state, site, source, `Арена пройдена!`);

   const cx = site.x + Math.floor(ROOM_W / 2);
   const cy = site.y + Math.floor(ROOM_H / 2);

   entities.push({
    id: nextEntityId(entities),
    type: EntityType.ITEM_DROP,
    x: cx + 0.5,
    y: cy + 0.5,
    angle: 0,
    pitch: 0,
    alive: true,
    speed: 0,
    sprite: Spr.ITEM_DROP,
    inventory: [
      { defId: 'ammo_energy', count: 5 },
      { defId: 'ration', count: 2 },
      { defId: 'medkit', count: 1 },
    ],
  });
}

function publishArenaMessage(state: GameState, site: ArenaSite, source: WorldEvent, msg: string) {
    if (typeof globalThis.AudioContext !== 'undefined') {
        playSoundAt(() => playRouteCueTone(site.roomId * 111, 1), site.x, site.y);
    }
    publishEvent(state, {
    type: 'samosbor_warning',
    floor: state.currentFloor,
    zoneId: site.zoneId,
    roomId: site.roomId,
    x: site.x,
    y: site.y,
    actorId: source.actorId,
    actorName: source.actorName,
    actorFaction: source.actorFaction,
    severity: 3,
    privacy: 'local',
    tags: [EVENT_TAG, 'player_arena', 'combat'],
    data: { warning: msg },
  });
}

registerZoneContent(99, 'Player Arena', (world, nextRoomId, entities, _nextId, zoneCx, zoneCy) => {
    const area = findClearArea(world, zoneCx, zoneCy, ROOM_W, ROOM_H, 10, 80);
    if (!area) return { nextRoomId };

    const room = stampRoom(world, nextRoomId, RoomType.COMMON, area.x, area.y, ROOM_W, ROOM_H, -1);
    room.name = 'Арена Игрока';
    protectRoom(world, room.x, room.y, room.w, room.h, Tex.CONCRETE, Tex.F_CONCRETE);

    // Add door logic
    const cx = room.x + Math.floor(ROOM_W / 2);
    const cy = room.y + Math.floor(ROOM_H / 2);

    const zoneId = world.zoneMap[world.idx(cx, cy)];

    arenaSite = {
        x: room.x,
        y: room.y,
        roomId: room.id,
        wave: 0,
        timer: 0,
        hostileIds: [],
        completed: false,
        spawned: false,
        zoneId: zoneId
    };
    activeWorld = world;
    activeEntities = entities;

    return { nextRoomId: nextRoomId + 1 };
});

function nextEntityId(entities: readonly Entity[]): number {
  let id = 1;
  for (const entity of entities) id = Math.max(id, entity.id + 1);
  return id;
}

function findPlayer(entities: readonly Entity[]): Entity | null {
  for (const entity of entities) {
    if (isPlayerEntity(entity) && entity.alive) return entity;
  }
  return null;
}
