/* ── Filtronos: local filter/water sabotage cache ─────────────── */

import {
  AIGoal, Cell, ContainerKind, EntityType, Faction, Feature, FloorLevel, MonsterKind, Occupation,
  RoomType, Tex, msg,
  type Entity, type GameState, type Room, type WorldContainer, type WorldEvent, type WorldEventType,
} from '../../core/types';
import { MONSTERS } from '../../entities/monster';
import { Spr, monsterSpr } from '../../render/sprite_index';
import { publishEvent, registerWorldEventObserver } from '../../systems/events';
import { randomRPG, scaleMonsterHp, scaleMonsterSpeed } from '../../systems/rpg';
import {
  type MaintContentCtx, dropItems, findMaintArea, setFeature, stampMaintRoom,
} from './content_helpers';

const MODULE_TAG = 'monster_08_filtronos';
const EVENT_TAG = 'filtronos_event';
const CACHE_TAG = 'filtronos_cache';
const THREAT_NAME = 'Фильтронос';
const CLEAN_TO_CONTAMINATED: Record<string, string> = {
  gasmask_filter: 'filter_layer',
  filtered_water: 'metal_water',
  water: 'metal_water',
};

interface FiltronosContext {
  worldContainerId: number;
  roomId: number;
  monsterId: number;
  world: MaintContentCtx['world'];
  entities: Entity[];
  protected: boolean;
  distracted: boolean;
  recovered: boolean;
  contaminated: boolean;
}

const contexts: FiltronosContext[] = [];

function pushHud(state: GameState, text: string, color: string): void {
  state.msgs.push(msg(text, state.time, color));
}

function eventType(phase: 'protected' | 'distracted' | 'contaminated' | 'recovered'): WorldEventType {
  return `monster_filtronos_${phase}` as WorldEventType;
}

function findContextByContainer(event: WorldEvent): FiltronosContext | undefined {
  if (event.containerId === undefined) return undefined;
  for (let i = contexts.length - 1; i >= 0; i--) {
    const ctx = contexts[i];
    if (ctx.worldContainerId === event.containerId && ctx.roomId === event.roomId) return ctx;
  }
  return undefined;
}

function findContextByMonster(event: WorldEvent): FiltronosContext | undefined {
  const id = event.targetId ?? event.actorId;
  if (id === undefined) return undefined;
  for (let i = contexts.length - 1; i >= 0; i--) {
    if (contexts[i].monsterId === id) return contexts[i];
  }
  return undefined;
}

function contextContainer(ctx: FiltronosContext): WorldContainer | undefined {
  return ctx.world.containerById.get(ctx.worldContainerId);
}

function addContainerTag(container: WorldContainer, tag: string): void {
  if (!container.tags.includes(tag)) container.tags.push(tag);
}

function threatAlive(ctx: FiltronosContext): boolean {
  const monster = ctx.entities.find(e => e.id === ctx.monsterId);
  return !!monster?.alive && (monster.hp ?? 1) > 0;
}

function hasModuleContainerTag(event: WorldEvent): boolean {
  if (event.tags.includes(MODULE_TAG)) return true;
  const tags = event.data?.containerTags;
  return Array.isArray(tags) && tags.includes(MODULE_TAG);
}

function publishFiltronosEvent(
  state: GameState,
  ctx: FiltronosContext,
  source: WorldEvent,
  phase: 'protected' | 'distracted' | 'contaminated' | 'recovered',
  text: string,
  severity: 3 | 4,
  data: Record<string, unknown> = {},
): void {
  const container = contextContainer(ctx);
  publishEvent(state, {
    type: eventType(phase),
    floor: FloorLevel.MAINTENANCE,
    zoneId: source.zoneId ?? container?.zoneId,
    roomId: ctx.roomId,
    x: source.x ?? container?.x,
    y: source.y ?? container?.y,
    actorId: source.actorId,
    actorName: source.actorName,
    actorFaction: source.actorFaction,
    targetId: ctx.monsterId,
    targetName: THREAT_NAME,
    itemId: source.itemId,
    itemName: source.itemName,
    itemCount: source.itemCount,
    containerId: ctx.worldContainerId,
    containerFaction: container?.faction,
    monsterKind: MonsterKind.POLZUN,
    severity,
    privacy: 'local',
    tags: [EVENT_TAG, MODULE_TAG, 'monster', 'filter', 'smog', 'resource_sabotage', phase, 'water'],
    data: {
      sourceEventId: source.id,
      containerName: container?.name,
      roomName: ctx.world.rooms[ctx.roomId]?.name,
      protected: ctx.protected,
      distracted: ctx.distracted,
      recovered: ctx.recovered,
      contaminated: ctx.contaminated,
      ...data,
    },
  });
  pushHud(state, text, severity >= 4 ? '#fc8' : '#8cf');
}

function contaminateContainer(container: WorldContainer): number {
  let changed = 0;
  for (const item of container.inventory) {
    const contaminated = CLEAN_TO_CONTAMINATED[item.defId];
    if (!contaminated) continue;
    item.defId = contaminated;
    changed += item.count;
  }
  addContainerTag(container, 'contaminated');
  return changed;
}

function addRecoveredTrace(container: WorldContainer): boolean {
  const hasTrace = container.inventory.some(item => item.defId === 'filter_layer' || item.defId === 'gasmask_filter');
  if (hasTrace || container.inventory.length >= container.capacitySlots) return false;
  container.inventory.push({ defId: 'filter_layer', count: 1 });
  return true;
}

function protectCache(state: GameState, ctx: FiltronosContext, event: WorldEvent, method: string): void {
  const container = contextContainer(ctx);
  if (!container || ctx.contaminated || ctx.protected) return;
  ctx.protected = true;
  addContainerTag(container, 'protected');
  publishFiltronosEvent(
    state,
    ctx,
    event,
    'protected',
    method === 'sealant_tube'
      ? 'Герметик схватил фильтр-ящик: Фильтронос сосёт воздух мимо запасов.'
      : 'Запасной фильтр закрыл щель: чистый ящик можно брать после боя.',
    3,
    { method },
  );
}

function distractThreat(state: GameState, ctx: FiltronosContext, event: WorldEvent, method: string): void {
  const container = contextContainer(ctx);
  if (!container || ctx.contaminated || ctx.distracted) return;
  ctx.distracted = true;
  addContainerTag(container, 'distracted');
  publishFiltronosEvent(
    state,
    ctx,
    event,
    'distracted',
    'Фильтронос ушёл носом в говнячный дым. Фильтры можно вытаскивать быстро.',
    3,
    { method },
  );
}

function contaminateIfUnguarded(state: GameState, ctx: FiltronosContext, event: WorldEvent): void {
  if (ctx.contaminated || ctx.protected || ctx.distracted || ctx.recovered || !threatAlive(ctx)) return;
  const container = contextContainer(ctx);
  if (!container) return;
  ctx.contaminated = true;
  const changed = contaminateContainer(container);
  publishFiltronosEvent(
    state,
    ctx,
    event,
    'contaminated',
    changed > 0
      ? 'Фильтронос втянул чистый воздух из ящика. Вода отдала металлом, фильтр осыпался.'
      : 'Фильтронос захрипел у пустого ящика: чистых запасов там уже не осталось.',
    4,
    { changedStacks: changed },
  );
}

function recoverCache(state: GameState, ctx: FiltronosContext, event: WorldEvent): void {
  if (ctx.recovered) return;
  const container = contextContainer(ctx);
  if (!container) return;
  ctx.recovered = true;
  addContainerTag(container, 'recovered');
  const traceAdded = addRecoveredTrace(container);
  publishFiltronosEvent(
    state,
    ctx,
    event,
    'recovered',
    ctx.contaminated
      ? 'Фильтронос добит. Из носовой сетки сняли один пригодный фильтрующий слой.'
      : 'Фильтронос добит до вскрытия ящика. Запас фильтров остался сухим.',
    ctx.contaminated ? 4 : 3,
    { traceAdded },
  );
}

function handleContainerEvent(state: GameState, event: WorldEvent): void {
  if (event.type !== 'container_opened' && event.type !== 'item_stolen' && event.type !== 'item_deposited') return;
  if (!hasModuleContainerTag(event)) return;
  const ctx = findContextByContainer(event);
  if (!ctx) return;

  if (event.type === 'item_deposited') {
    if (event.itemId === 'sealant_tube' || event.itemId === 'gasmask_filter') {
      protectCache(state, ctx, event, event.itemId);
    } else if (event.itemId === 'govnyak_bad_batch' || event.itemId === 'govnyak_roll' || event.itemId === 'govnyak_brick') {
      distractThreat(state, ctx, event, event.itemId);
    }
    return;
  }

  contaminateIfUnguarded(state, ctx, event);
}

function handleBaitEvent(state: GameState, event: WorldEvent): void {
  if (event.type !== 'monster_bait_attracted' && event.type !== 'monster_bait_consumed') return;
  if (event.itemId !== 'govnyak_bad_batch' && event.itemId !== 'govnyak_roll' && event.itemId !== 'govnyak_brick') return;
  if (event.actorName !== THREAT_NAME) return;
  const ctx = findContextByMonster(event);
  if (!ctx) return;
  distractThreat(state, ctx, event, event.type);
}

function handleKillEvent(state: GameState, event: WorldEvent): void {
  if (event.type !== 'player_kill_monster' || event.monsterKind !== MonsterKind.POLZUN) return;
  if (event.targetName !== THREAT_NAME) return;
  const ctx = findContextByMonster(event);
  if (!ctx) return;
  recoverCache(state, ctx, event);
}

function handleFiltronosEvents(state: GameState, event: WorldEvent): void {
  if (event.tags.includes(EVENT_TAG)) return;
  handleContainerEvent(state, event);
  handleBaitEvent(state, event);
  handleKillEvent(state, event);
}

registerWorldEventObserver(handleFiltronosEvents);

function nextContainerId(ctx: MaintContentCtx): number {
  let id = ctx.world.containers.length + 1;
  while (ctx.world.containerById.has(id) || ctx.world.containers.some(c => c.id === id)) id++;
  return id;
}

function dropAt(ctx: MaintContentCtx, x: number, y: number, defId: string, count = 1, data?: unknown): void {
  const ci = ctx.world.idx(x, y);
  if (ctx.world.cells[ci] !== Cell.FLOOR && ctx.world.cells[ci] !== Cell.WATER) return;
  ctx.entities.push({
    id: ctx.nextId.v++, type: EntityType.ITEM_DROP,
    x: x + 0.5, y: y + 0.5, angle: 0, pitch: 0,
    alive: true, speed: 0, sprite: Spr.ITEM_DROP,
    inventory: [{ defId, count, data }],
  });
}

function spawnKeeper(ctx: MaintContentCtx, room: Room): Entity {
  const keeper: Entity = {
    id: ctx.nextId.v++, type: EntityType.NPC,
    x: room.x + 3.5, y: room.y + room.h - 2.5,
    angle: 0, pitch: 0,
    alive: true, speed: 0.95, sprite: Occupation.LOCKSMITH,
    name: 'Матвей Фильтровой',
    needs: { food: 68, water: 42, sleep: 35, pee: 20, poo: 8 },
    hp: 105, maxHp: 105, money: 44,
    ai: { goal: AIGoal.IDLE, tx: 0, ty: 0, path: [], pi: 0, stuck: 0, timer: 0 },
    inventory: [{ defId: 'sealant_tube', count: 1 }, { defId: 'water_coupon', count: 1 }],
    faction: Faction.LIQUIDATOR,
    occupation: Occupation.LOCKSMITH,
    questId: -1,
  };
  ctx.entities.push(keeper);
  return keeper;
}

function spawnFiltronos(ctx: MaintContentCtx, room: Room): number {
  const x = room.x + room.w - 4;
  const y = room.y + room.h - 3;
  const ci = ctx.world.idx(x, y);
  const zoneLevel = ctx.world.zones[ctx.world.zoneMap[ci]]?.level ?? 5;
  const def = MONSTERS[MonsterKind.POLZUN];
  const hp = Math.max(110, Math.round(scaleMonsterHp(def.hp, zoneLevel) * 0.72));
  const monster: Entity = {
    id: ctx.nextId.v++, type: EntityType.MONSTER,
    x: x + 0.5, y: y + 0.5,
    angle: Math.PI, pitch: 0,
    alive: true,
    speed: scaleMonsterSpeed(def.speed, zoneLevel) * 0.86,
    sprite: monsterSpr(MonsterKind.POLZUN),
    name: THREAT_NAME,
    hp, maxHp: hp,
    monsterKind: MonsterKind.POLZUN,
    attackCd: 0,
    ai: { goal: AIGoal.WANDER, tx: room.x + Math.floor(room.w / 2), ty: room.y + 3, path: [], pi: 0, stuck: 0, timer: 0 },
    rpg: randomRPG(zoneLevel),
    spriteScale: 0.9,
  };
  ctx.entities.push(monster);
  return monster.id;
}

function addFilterContainer(ctx: MaintContentCtx, room: Room, owner: Entity): number {
  const x = ctx.world.wrap(room.x + Math.floor(room.w / 2));
  const y = ctx.world.wrap(room.y + 2);
  const container: WorldContainer = {
    id: nextContainerId(ctx),
    x,
    y,
    floor: FloorLevel.MAINTENANCE,
    roomId: room.id,
    zoneId: ctx.world.zoneMap[ctx.world.idx(x, y)],
    kind: ContainerKind.MEDICAL_CABINET,
    name: 'Фильтр-ящик с сухой пломбой',
    inventory: [
      { defId: 'gasmask_filter', count: 1 },
      { defId: 'filter_layer', count: 3 },
      { defId: 'filtered_water', count: 2 },
      { defId: 'filter_receipt', count: 1 },
    ],
    capacitySlots: 8,
    ownerNpcId: owner.id,
    ownerName: owner.name,
    faction: Faction.LIQUIDATOR,
    access: 'owner',
    discovered: true,
    tags: [MODULE_TAG, CACHE_TAG, 'filter', 'smog', 'resource_sabotage', 'water', 'warning'],
  };
  ctx.world.addContainer(container);
  return container.id;
}

function decorateCache(ctx: MaintContentCtx, room: Room): void {
  for (let dx = 2; dx < room.w - 2; dx += 3) setFeature(ctx.world, room.x + dx, room.y + 1, Feature.SHELF);
  setFeature(ctx.world, room.x + Math.floor(room.w / 2), room.y + 2, Feature.APPARATUS);
  setFeature(ctx.world, room.x + 2, room.y + 2, Feature.SINK);
  setFeature(ctx.world, room.x + room.w - 3, room.y + 2, Feature.LAMP);
  setFeature(ctx.world, room.x + 4, room.y + room.h - 3, Feature.DESK);
  setFeature(ctx.world, room.x + 5, room.y + room.h - 3, Feature.CHAIR);

  const cx = room.x + Math.floor(room.w / 2);
  const cy = room.y + 3;
  ctx.world.stamp(cx, cy, 0.5, 0.5, 2.6, 0.65, room.id * 701 + 8, 122, 118, 96);
  ctx.world.stamp(cx - 3, cy + 2, 0.4, 0.35, 1.2, 0.55, room.id * 701 + 19, 170, 170, 145);
  ctx.world.stamp(room.x + room.w - 4, room.y + room.h - 3, 0.45, 0.55, 1.8, 0.68, room.id * 701 + 31, 74, 64, 50);
  for (let dy = 1; dy < room.h - 1; dy++) {
    for (let dx = 1; dx < room.w - 1; dx++) {
      const ci = ctx.world.idx(room.x + dx, room.y + dy);
      if (((dx + dy + room.id) % 5) === 0 && ctx.world.fog[ci] < 34) ctx.world.fog[ci] = 34;
    }
  }
  ctx.world.markFogDirty();
}

export function generateFiltronos(ctx: MaintContentCtx): void {
  const cx = Math.floor(ctx.spawnX);
  const cy = Math.floor(ctx.spawnY);
  const pos = findMaintArea(ctx.world, cx, cy, 18, 10, 72, 190);
  const room = stampMaintRoom(
    ctx.world, ctx.world.rooms.length, RoomType.STORAGE,
    pos.x, pos.y, 16, 8,
    'Фильтровый кэш: сухой нос',
    Tex.PIPE, Tex.F_TILE,
  );

  decorateCache(ctx, room);
  const keeper = spawnKeeper(ctx, room);
  const containerId = addFilterContainer(ctx, room, keeper);
  const monsterId = spawnFiltronos(ctx, room);

  dropItems(ctx, room, ['sealant_tube', 'govnyak_bad_batch', 'cloth_roll']);
  dropAt(ctx, room.x + 2, room.y + room.h - 2, 'note', 1,
    'Памятка фильтрового кэша: если ящик дышит внутрь, сначала герметик на щель или говняк в сторону. Живой Фильтронос портит только этот запас.');

  contexts.push({
    worldContainerId: containerId,
    roomId: room.id,
    monsterId,
    world: ctx.world,
    entities: ctx.entities,
    protected: false,
    distracted: false,
    recovered: false,
    contaminated: false,
  });
  if (contexts.length > 16) contexts.splice(0, contexts.length - 16);
}
