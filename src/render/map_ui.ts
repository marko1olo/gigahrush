/* ── Map rendering (minimap, full map) ────────────────────────── */

import {
  type Entity, type GameState, type Quest, EntityType, Cell, RoomType, W, QuestType,
  LiftDirection, MonsterKind, FloorLevel, ZoneFaction,
} from '../core/types';
import { SURFACE_FLAG_CHALK_MAP, World } from '../core/world';
import {
  isQuestTargetOnCurrentFloor,
  questRouteFloor,
  questTargetLiftDirection,
  resolveQuestTargetRoom,
} from '../systems/contracts';
import { getActiveQuest, npcQuestMarkerState } from '../systems/quests';
import { isHostile } from '../systems/factions';
import { territoryOwnerAtIndex } from '../systems/territory';
import { ENTITY_MASK_ITEM_DROP, ENTITY_MASK_VISIBLE, getEntityIndex } from '../systems/entity_index';
import { isMapCellExplored, mapExplorationVersion } from '../systems/map_exploration';
import { FRIENDLY_RELATION_THRESHOLD, getNpcPlayerRelation } from '../systems/npc_relations';
import { controlHint, menuCloseHint } from '../systems/controls';
import {
  MAP_COLOR_MODES,
  type MapColorMode,
  mapColorMode,
  mapLegendRowAt,
  mapLegendRowCount,
  mapLegendToggleEnabled,
} from '../systems/ui_orchestrator';
import { type UiRect } from './ui_layout';
import { isPlayerEntity } from '../systems/player_actor';
import { fitTextStable } from './ui_text';

const MAP_SIZE = 80;
type QuestKind = 'plot' | 'side' | 'system';
type MapMarkerStyle = { stroke: string; fill: string };

const activeKillKinds = new Set<MonsterKind>();
const activeKillNpcIds = new Set<number>();
const activeKillPlotNpcIds = new Set<string>();
const activeTargetRoomTypes = new Map<RoomType, QuestKind>();
const activeTargetRooms = new Map<number, QuestKind>();
const activeFetchItems = new Map<string, QuestKind>();
const drawnTargetRooms = new Set<number>();
let activeKillAnyMonster = false;
const MAX_CONCRETE_QUEST_ROOM_MARKERS = 8;
const mapEntityQuery: Entity[] = [];
const activeQuestItemQuery: Entity[] = [];
const MAP_MINIMAP_ENTITY_DOT_BUDGET = 220;
const MAP_FULL_ENTITY_DOT_BUDGET = 900;
const MAP_ENTITY_QUERY_BUDGET_MULT = 3;
const MAP_ACTIVE_QUEST_ITEM_QUERY_CAP = 96;
const MAP_CROWD_BIN_HASH_CAP = 2048;
const MAP_CROWD_EMPTY_KEY = -1;
const MAP_CROWD_GROUP_FRIENDLY_NPC = 0;
const MAP_CROWD_GROUP_NEUTRAL_NPC = 1;
const MAP_CROWD_GROUP_HOSTILE_NPC = 2;
const MAP_CROWD_GROUP_MONSTER = 3;
const MAP_CROWD_GROUP_ITEM = 4;
const MAP_AUTHORED_IDLE_NPC_MARKER = { stroke: '#064225', fill: '#35d072' };
const MAP_AUTHORED_ACTIVE_NPC_MARKER = { stroke: '#8a5c00', fill: '#ffd21f' };
const MAP_PROCEDURAL_NPC_MARKER = { stroke: '#04375c', fill: '#49b8ff' };
const MAP_UNEXPLORED_FADE_RADIUS = 3;
const MAP_LABEL_ROOM_CAP = 56;
const MAP_LABEL_NPC_CAP = 80;
const MAP_OVERVIEW_SIZE = W;
const mapCrowdHashKeys = new Int32Array(MAP_CROWD_BIN_HASH_CAP);
const mapCrowdHashBins = new Int16Array(MAP_CROWD_BIN_HASH_CAP);
const mapCrowdX = new Float32Array(MAP_FULL_ENTITY_DOT_BUDGET);
const mapCrowdY = new Float32Array(MAP_FULL_ENTITY_DOT_BUDGET);
const mapCrowdTotal = new Uint16Array(MAP_FULL_ENTITY_DOT_BUDGET);
const mapCrowdNpc = new Uint16Array(MAP_FULL_ENTITY_DOT_BUDGET);
const mapCrowdNeutralNpc = new Uint16Array(MAP_FULL_ENTITY_DOT_BUDGET);
const mapCrowdHostileNpc = new Uint16Array(MAP_FULL_ENTITY_DOT_BUDGET);
const mapCrowdMonster = new Uint16Array(MAP_FULL_ENTITY_DOT_BUDGET);
const mapCrowdItem = new Uint16Array(MAP_FULL_ENTITY_DOT_BUDGET);
let mapCrowdBinCount = 0;
let mapCrowdBinLimit = MAP_MINIMAP_ENTITY_DOT_BUDGET;
let mapExploredGrid = new Uint8Array(0);
let mapExploredGridW = 0;
let mapExploredGridH = 0;
mapCrowdHashKeys.fill(MAP_CROWD_EMPTY_KEY);

interface MapRasterBuffer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  imageData: ImageData;
}

const mapRasterBuffers = new Map<number, MapRasterBuffer>();
const mapLiftX: number[] = [];
const mapLiftY: number[] = [];
const mapLiftUp: number[] = [];
const mapLiftQuest: number[] = [];

const QUEST_KIND_PRIORITY: Record<QuestKind, number> = { plot: 3, side: 2, system: 1 };
const QUEST_MARKERS: Record<QuestKind, MapMarkerStyle> = {
  plot: { stroke: '#0b5570', fill: '#6cf' },
  side: { stroke: '#704060', fill: '#f7a7d8' },
  system: { stroke: '#76631a', fill: '#ffd35f' },
};
const MAP_KILL_TARGET_MARKER: MapMarkerStyle = { stroke: '#600', fill: '#f44' };
const MAP_FOG_RGB = [80, 20, 120] as const;
const ROOM_TYPE_RGB: Record<RoomType, [number, number, number]> = {
  [RoomType.LIVING]: [68, 68, 102],
  [RoomType.KITCHEN]: [85, 85, 68],
  [RoomType.BATHROOM]: [68, 85, 85],
  [RoomType.STORAGE]: [85, 68, 51],
  [RoomType.MEDICAL]: [68, 102, 102],
  [RoomType.COMMON]: [68, 68, 68],
  [RoomType.PRODUCTION]: [85, 85, 68],
  [RoomType.CORRIDOR]: [50, 54, 58],
  [RoomType.SMOKING]: [78, 76, 64],
  [RoomType.OFFICE]: [74, 72, 92],
  [RoomType.HQ]: [86, 72, 96],
};

const TERRITORY_RGB: Record<ZoneFaction, [number, number, number]> = {
  [ZoneFaction.CITIZEN]: [74, 190, 145],
  [ZoneFaction.LIQUIDATOR]: [91, 158, 238],
  [ZoneFaction.CULTIST]: [188, 89, 255],
  [ZoneFaction.SAMOSBOR]: [230, 78, 92],
  [ZoneFaction.WILD]: [224, 167, 69],
  [ZoneFaction.SCIENTIST]: [103, 216, 232],
};

const TERRITORY_NAMES: Record<ZoneFaction, string> = {
  [ZoneFaction.CITIZEN]: 'Граждане',
  [ZoneFaction.LIQUIDATOR]: 'Ликвидаторы',
  [ZoneFaction.CULTIST]: 'Культ',
  [ZoneFaction.SAMOSBOR]: 'Самосбор',
  [ZoneFaction.WILD]: 'Дикие',
  [ZoneFaction.SCIENTIST]: 'Учёные',
};

interface FloorOverviewCache {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  imageData: ImageData;
  signature: string;
}

const floorOverviewCache = new WeakMap<World, FloorOverviewCache>();

function routeFloor(q: Quest): FloorLevel | undefined {
  return questRouteFloor(q);
}

function dimRgb(rgb: readonly [number, number, number], factor: number): [number, number, number] {
  return [
    Math.round(rgb[0] * factor),
    Math.round(rgb[1] * factor),
    Math.round(rgb[2] * factor),
  ];
}

function roomTypeRgb(type: RoomType | undefined): [number, number, number] {
  return type === undefined ? [51, 51, 51] : ROOM_TYPE_RGB[type] ?? [51, 51, 51];
}

function territoryRgb(owner: number | undefined, factor = 0.62): [number, number, number] {
  const rgb = TERRITORY_RGB[owner as ZoneFaction] ?? TERRITORY_RGB[ZoneFaction.CITIZEN];
  return dimRgb(rgb, factor);
}

function shortMapLabel(text: string, max = 22): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, Math.max(1, max - 1))}.`;
}

export function mapEntityDotBudget(mapW: number, mapH: number, radius: number): number {
  if (radius <= 48 || mapW <= 180 || mapH <= 180) return MAP_MINIMAP_ENTITY_DOT_BUDGET;
  const areaBudget = Math.floor((mapW * mapH) / 1800);
  return Math.max(MAP_MINIMAP_ENTITY_DOT_BUDGET, Math.min(MAP_FULL_ENTITY_DOT_BUDGET, areaBudget));
}

function mapEntityQueryBudget(mapW: number, mapH: number, radius: number): number {
  return mapEntityDotBudget(mapW, mapH, radius) * MAP_ENTITY_QUERY_BUDGET_MULT;
}

function mapCrowdBinPixels(mapW: number, mapH: number): number {
  return mapW <= 180 || mapH <= 180 ? 4 : 5;
}

function resetMapCrowdBins(limit: number): void {
  mapCrowdBinCount = 0;
  mapCrowdBinLimit = Math.max(0, Math.min(MAP_FULL_ENTITY_DOT_BUDGET, limit));
  mapCrowdHashKeys.fill(MAP_CROWD_EMPTY_KEY);
}

function mapCrowdBinForKey(key: number): number {
  let slot = (Math.imul(key, 0x9e3779b1) >>> 0) & (MAP_CROWD_BIN_HASH_CAP - 1);
  for (let probe = 0; probe < MAP_CROWD_BIN_HASH_CAP; probe++) {
    const existing = mapCrowdHashKeys[slot];
    if (existing === key) return mapCrowdHashBins[slot];
    if (existing === MAP_CROWD_EMPTY_KEY) {
      if (mapCrowdBinCount >= mapCrowdBinLimit) return -1;
      const bin = mapCrowdBinCount++;
      mapCrowdHashKeys[slot] = key;
      mapCrowdHashBins[slot] = bin;
      mapCrowdX[bin] = 0;
      mapCrowdY[bin] = 0;
      mapCrowdTotal[bin] = 0;
      mapCrowdNpc[bin] = 0;
      mapCrowdNeutralNpc[bin] = 0;
      mapCrowdHostileNpc[bin] = 0;
      mapCrowdMonster[bin] = 0;
      mapCrowdItem[bin] = 0;
      return bin;
    }
    slot = (slot + 1) & (MAP_CROWD_BIN_HASH_CAP - 1);
  }
  return -1;
}

function mapEntityCrowdGroup(e: Entity, player: Entity): number {
  if (e.type === EntityType.MONSTER) return MAP_CROWD_GROUP_MONSTER;
  if (e.type === EntityType.ITEM_DROP || e.type === EntityType.PROJECTILE) return MAP_CROWD_GROUP_ITEM;
  if (e.type === EntityType.BILLBOARD) return -1;
  if (e.type !== EntityType.NPC) return -1;
  if (isHostile(e, player)) return MAP_CROWD_GROUP_HOSTILE_NPC;
  if (getNpcPlayerRelation(e) < FRIENDLY_RELATION_THRESHOLD) {
    return MAP_CROWD_GROUP_NEUTRAL_NPC;
  }
  return MAP_CROWD_GROUP_FRIENDLY_NPC;
}

function addMapCrowdDot(x: number, y: number, key: number, group: number): void {
  const bin = mapCrowdBinForKey(key);
  if (bin < 0) return;
  mapCrowdX[bin] += x;
  mapCrowdY[bin] += y;
  mapCrowdTotal[bin]++;
  if (group === MAP_CROWD_GROUP_MONSTER) mapCrowdMonster[bin]++;
  else if (group === MAP_CROWD_GROUP_HOSTILE_NPC) mapCrowdHostileNpc[bin]++;
  else if (group === MAP_CROWD_GROUP_NEUTRAL_NPC) mapCrowdNeutralNpc[bin]++;
  else if (group === MAP_CROWD_GROUP_ITEM) mapCrowdItem[bin]++;
  else mapCrowdNpc[bin]++;
}

function mapCrowdColor(bin: number): string {
  if (mapCrowdMonster[bin] > 0) return '#e33';
  if (mapCrowdHostileNpc[bin] > 0) return '#e44';
  if (mapCrowdNeutralNpc[bin] > 0) return '#fc4';
  if (mapCrowdNpc[bin] > 0) return '#35d072';
  return '#dd4';
}

function drawMapCrowdBins(ctx: CanvasRenderingContext2D, mapW: number, mapH: number): void {
  const compact = mapW <= 180 || mapH <= 180;
  for (let i = 0; i < mapCrowdBinCount; i++) {
    const total = mapCrowdTotal[i];
    if (total <= 0) continue;
    const x = mapCrowdX[i] / total;
    const y = mapCrowdY[i] / total;
    const size = total === 1 ? 3 : Math.min(compact ? 6 : 8, 3 + Math.floor(Math.log2(total)));
    ctx.fillStyle = mapCrowdColor(i);
    ctx.globalAlpha = total === 1 ? 1 : Math.min(0.92, 0.58 + total * 0.025);
    ctx.fillRect(Math.round(x - size * 0.5), Math.round(y - size * 0.5), size, size);
    if (total >= 8 && !compact) {
      ctx.strokeStyle = 'rgba(255,255,255,0.28)';
      ctx.lineWidth = 1;
      ctx.strokeRect(Math.round(x - size * 0.5) + 0.5, Math.round(y - size * 0.5) + 0.5, size - 1, size - 1);
    }
  }
  ctx.globalAlpha = 1;
}

function questKind(q: Quest): QuestKind {
  if (q.plotStepIndex !== undefined) return 'plot';
  if (q.sideQuestId !== undefined) return 'side';
  return 'system';
}

function mergeQuestKind(current: QuestKind | undefined, next: QuestKind): QuestKind {
  return current && QUEST_KIND_PRIORITY[current] >= QUEST_KIND_PRIORITY[next] ? current : next;
}

function setMarkerKind<K>(map: Map<K, QuestKind>, key: K, kind: QuestKind): void {
  map.set(key, mergeQuestKind(map.get(key), kind));
}

function clearActiveQuestMarkers(): void {
  activeKillKinds.clear();
  activeKillNpcIds.clear();
  activeKillPlotNpcIds.clear();
  activeTargetRoomTypes.clear();
  activeTargetRooms.clear();
  activeFetchItems.clear();
  activeKillAnyMonster = false;
}

function registerActiveKillTarget(q: Quest): void {
  if (q.targetMonsterKind !== undefined) activeKillKinds.add(q.targetMonsterKind);
  else if (q.targetNpcId === undefined && q.targetPlotNpcId === undefined) activeKillAnyMonster = true;
  if (q.targetNpcId !== undefined) activeKillNpcIds.add(q.targetNpcId);
  if (q.targetPlotNpcId !== undefined) activeKillPlotNpcIds.add(q.targetPlotNpcId);
}

function hasActiveKillTargets(): boolean {
  return activeKillAnyMonster || activeKillKinds.size > 0 || activeKillNpcIds.size > 0 || activeKillPlotNpcIds.size > 0;
}

function isActiveKillQuestTarget(e: Entity): boolean {
  if (e.type === EntityType.MONSTER) {
    return activeKillAnyMonster || (e.monsterKind !== undefined && activeKillKinds.has(e.monsterKind));
  }
  if (e.type === EntityType.NPC) {
    return activeKillNpcIds.has(e.id) || (e.plotNpcId !== undefined && activeKillPlotNpcIds.has(e.plotNpcId));
  }
  return false;
}

function questTargetVisibleOnMap(q: Quest, currentFloor: FloorLevel | undefined, state: GameState | undefined): boolean {
  if (state) return isQuestTargetOnCurrentFloor(q, state);
  const floor = routeFloor(q);
  return floor === undefined || floor === currentFloor;
}

function activeVisitLiftDirection(
  quests: Quest[] | undefined,
  currentFloor: FloorLevel | undefined,
  state: GameState | undefined,
): LiftDirection | undefined {
  if (!quests || currentFloor === undefined) return undefined;
  for (const q of quests) {
    const floor = routeFloor(q);
    if (q.done || floor === undefined) continue;
    if (state) {
      const dir = questTargetLiftDirection(q, state);
      if (dir !== undefined) return dir;
      continue;
    }
    if (floor === currentFloor) continue;
    return floor > currentFloor ? LiftDirection.DOWN : LiftDirection.UP;
  }
  return undefined;
}

function drawQuestDiamond(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  sz: number, sw: number,
  stroke: string, fill: string,
): void {
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y - sz);
  ctx.lineTo(x + sw, y);
  ctx.lineTo(x, y + sz);
  ctx.lineTo(x - sw, y);
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawMapMarker(ctx: CanvasRenderingContext2D, x: number, y: number, sz: number, sw: number, marker: MapMarkerStyle): void {
  drawQuestDiamond(ctx, x, y, sz, sw, marker.stroke, marker.fill);
}

function drawQuestMarker(ctx: CanvasRenderingContext2D, x: number, y: number, sz: number, sw: number, kind: QuestKind): void {
  drawMapMarker(ctx, x, y, sz, sw, QUEST_MARKERS[kind]);
}

function drawKillTargetMarker(ctx: CanvasRenderingContext2D, x: number, y: number, sz: number, sw: number): void {
  drawMapMarker(ctx, x, y, sz, sw, MAP_KILL_TARGET_MARKER);
}

interface QuestMapTargetPoint {
  x: number;
  y: number;
}

function roomCenterPoint(room: { x: number; y: number; w: number; h: number }): QuestMapTargetPoint {
  return { x: room.x + room.w * 0.5, y: room.y + room.h * 0.5 };
}

function entityPoint(e: Entity | undefined): QuestMapTargetPoint | undefined {
  return e?.alive ? { x: e.x, y: e.y } : undefined;
}

function nearestActorPoint(
  world: World,
  player: Entity,
  matches: (e: Entity) => boolean,
): QuestMapTargetPoint | undefined {
  let best: Entity | undefined;
  let bestD2 = Infinity;
  for (const e of getEntityIndex().actors) {
    if (!e.alive || !matches(e)) continue;
    const d2 = world.dist2(player.x, player.y, e.x, e.y);
    if (d2 < bestD2) {
      best = e;
      bestD2 = d2;
    }
  }
  return entityPoint(best);
}

function liveQuestNpcPoint(q: Quest, world: World, player: Entity): QuestMapTargetPoint | undefined {
  const index = getEntityIndex();
  if (q.targetNpcId !== undefined) {
    const byId = entityPoint(index.byId.get(q.targetNpcId));
    if (byId) return byId;
  }
  if (!q.targetPlotNpcId) return undefined;
  return nearestActorPoint(world, player, e => e.type === EntityType.NPC && e.plotNpcId === q.targetPlotNpcId);
}

function liveQuestKillPoint(q: Quest, world: World, player: Entity): QuestMapTargetPoint | undefined {
  const npcPoint = liveQuestNpcPoint(q, world, player);
  if (npcPoint) return npcPoint;
  return nearestActorPoint(world, player, e => (
    e.type === EntityType.MONSTER &&
    (q.targetMonsterKind === undefined || e.monsterKind === q.targetMonsterKind)
  ));
}

function liveQuestFetchItemPoint(q: Quest, world: World, player: Entity): QuestMapTargetPoint | undefined {
  if (!q.targetItem) return undefined;
  getEntityIndex().queryRadiusCapped(
    player.x,
    player.y,
    W,
    activeQuestItemQuery,
    ENTITY_MASK_ITEM_DROP,
    MAP_ACTIVE_QUEST_ITEM_QUERY_CAP,
  );
  let best: Entity | undefined;
  let bestD2 = Infinity;
  for (const e of activeQuestItemQuery) {
    if (!e.alive || !e.inventory?.some(slot => slot.defId === q.targetItem)) continue;
    const d2 = world.dist2(player.x, player.y, e.x, e.y);
    if (d2 < bestD2) {
      best = e;
      bestD2 = d2;
    }
  }
  return entityPoint(best);
}

function activeQuestMapTargetPoint(world: World, player: Entity, state: GameState | undefined): QuestMapTargetPoint | undefined {
  if (!state) return undefined;
  const q = getActiveQuest(state);
  if (!q || !isQuestTargetOnCurrentFloor(q, state)) return undefined;

  if (q.type === QuestType.TALK) {
    const talkPoint = liveQuestNpcPoint(q, world, player);
    if (talkPoint) return talkPoint;
  }
  if (q.type === QuestType.KILL) {
    const killPoint = liveQuestKillPoint(q, world, player);
    if (killPoint) return killPoint;
  }

  const roomTarget = resolveQuestTargetRoom(world, q, player);
  if (roomTarget) return roomCenterPoint(roomTarget.room);

  if (q.type === QuestType.FETCH) return liveQuestFetchItemPoint(q, world, player);
  return undefined;
}

function drawActiveQuestDirectionArrow(
  ctx: CanvasRenderingContext2D,
  world: World,
  player: Entity,
  state: GameState | undefined,
  pcx: number,
  pcy: number,
  cellW: number,
  cellH: number,
): void {
  if (state?.mapMode !== 2) return;
  const target = activeQuestMapTargetPoint(world, player, state);
  if (!target) return;

  const dx = world.delta(player.x, target.x) * cellW;
  const dy = world.delta(player.y, target.y) * cellH;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return;

  const ux = dx / dist;
  const uy = dy / dist;
  const cell = Math.max(1, Math.hypot(cellW, cellH) / Math.SQRT2);
  const handLen = Math.max(8, 4 * cell);
  const x1 = pcx + ux * handLen;
  const y1 = pcy + uy * handLen;
  const head = Math.max(3, Math.min(5, handLen * 0.28));
  const wing = Math.max(2, Math.min(3, handLen * 0.18));
  const px = -uy;
  const py = ux;

  ctx.save();
  ctx.strokeStyle = '#ffd21f';
  ctx.fillStyle = '#ffd21f';
  ctx.lineWidth = Math.max(1.5, Math.min(2.5, cell * 0.45));
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(255,210,31,0.45)';
  ctx.shadowBlur = Math.max(2, cell * 0.75);
  ctx.beginPath();
  ctx.moveTo(pcx, pcy);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - ux * head + px * wing, y1 - uy * head + py * wing);
  ctx.lineTo(x1 - ux * head - px * wing, y1 - uy * head - py * wing);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function wrapMapCoord(v: number): number {
  return ((v % W) + W) % W;
}

function prepareMapExploredGrid(world: World, px: number, py: number, radius: number): void {
  const pad = MAP_UNEXPLORED_FADE_RADIUS;
  mapExploredGridW = radius * 2 + pad * 2;
  mapExploredGridH = mapExploredGridW;
  const needed = mapExploredGridW * mapExploredGridH;
  if (mapExploredGrid.length < needed) mapExploredGrid = new Uint8Array(needed);
  const startX = px - radius - pad;
  const startY = py - radius - pad;
  let wy = wrapMapCoord(startY);
  let out = 0;
  for (let gy = 0; gy < mapExploredGridH; gy++) {
    let wx = wrapMapCoord(startX);
    const row = wy * W;
    for (let gx = 0; gx < mapExploredGridW; gx++) {
      mapExploredGrid[out++] = isMapCellExplored(world, row + wx) ? 1 : 0;
      wx++;
      if (wx >= W) wx = 0;
    }
    wy++;
    if (wy >= W) wy = 0;
  }
}

function unexploredFadeBand(gx: number, gy: number, gridW: number): number {
  for (let dist = 1; dist <= MAP_UNEXPLORED_FADE_RADIUS; dist++) {
    const x0 = gx - dist;
    const x1 = gx + dist;
    const top = (gy - dist) * gridW;
    const bottom = (gy + dist) * gridW;
    for (let x = x0; x <= x1; x++) {
      if (mapExploredGrid[top + x] || mapExploredGrid[bottom + x]) return MAP_UNEXPLORED_FADE_RADIUS - dist + 1;
    }
    for (let y = gy - dist + 1; y <= gy + dist - 1; y++) {
      const row = y * gridW;
      if (mapExploredGrid[row + x0] || mapExploredGrid[row + x1]) return MAP_UNEXPLORED_FADE_RADIUS - dist + 1;
    }
  }
  return 0;
}

function unexploredMapCellPackedRgb(wx: number, wy: number, fadeBand: number): number {
  const hash = (Math.imul(wx + 17, 1103515245) ^ Math.imul(wy + 31, 12345)) >>> 0;
  const shade = 5 + (hash & 7);
  const edge = Math.max(0, Math.min(MAP_UNEXPLORED_FADE_RADIUS, fadeBand));
  const r = (shade >> 1) + edge * 3;
  const g = shade + edge * 8;
  const b = shade + 3 + edge * 9;
  return (r << 16) | (g << 8) | b;
}

function mapRasterBufferFor(ctx: CanvasRenderingContext2D, width: number, height: number): MapRasterBuffer | null {
  const key = (width << 16) ^ height;
  const cached = mapRasterBuffers.get(key);
  if (cached) return cached;
  const doc = ctx.canvas.ownerDocument ?? (typeof document !== 'undefined' ? document : null);
  if (!doc) return null;
  const canvas = doc.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const rasterCtx = canvas.getContext('2d');
  if (!rasterCtx) return null;
  const buffer = {
    canvas,
    ctx: rasterCtx,
    imageData: rasterCtx.createImageData(width, height),
  };
  mapRasterBuffers.set(key, buffer);
  return buffer;
}

function recordMapLiftMarker(x: number, y: number, isUp: boolean, isQuestLift: boolean): void {
  mapLiftX.push(x);
  mapLiftY.push(y);
  mapLiftUp.push(isUp ? 1 : 0);
  mapLiftQuest.push(isQuestLift ? 1 : 0);
}

function drawMapLiftArrow(ctx: CanvasRenderingContext2D, x: number, y: number, isUp: boolean, isQuestLift: boolean): void {
  const ah = 7;
  const aw = 5;
  ctx.strokeStyle = isQuestLift ? '#fff' : '#440';
  ctx.lineWidth = isQuestLift ? 3 : 2;
  ctx.beginPath();
  if (isUp) {
    ctx.moveTo(x, y - ah);
    ctx.lineTo(x + aw, y + ah);
    ctx.lineTo(x - aw, y + ah);
  } else {
    ctx.moveTo(x, y + ah);
    ctx.lineTo(x + aw, y - ah);
    ctx.lineTo(x - aw, y - ah);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = isQuestLift ? '#fc4' : '#ee2';
  ctx.fill();
}

function drawRecordedMapLiftArrows(ctx: CanvasRenderingContext2D): void {
  for (let i = 0; i < mapLiftX.length; i++) {
    drawMapLiftArrow(ctx, mapLiftX[i], mapLiftY[i], mapLiftUp[i] !== 0, mapLiftQuest[i] !== 0);
  }
}

function drawMapBaseRaster(
  ctx: CanvasRenderingContext2D,
  world: World,
  pxI: number,
  pyI: number,
  mapX: number,
  mapY: number,
  mapW: number,
  mapH: number,
  radius: number,
  cellW: number,
  cellH: number,
  questLiftDir: LiftDirection | undefined,
  colorMode: MapColorMode,
): void {
  const cols = radius * 2;
  const rows = cols;
  mapLiftX.length = 0;
  mapLiftY.length = 0;
  mapLiftUp.length = 0;
  mapLiftQuest.length = 0;

  const buffer = mapRasterBufferFor(ctx, cols, rows);
  if (!buffer) return;

  const data = buffer.imageData.data;
  const exploredGridW = mapExploredGridW;
  const exploredGridPad = MAP_UNEXPLORED_FADE_RADIUS;
  const startX = pxI - radius;
  const startY = pyI - radius;
  let out = 0;

  for (let gy = 0; gy < rows; gy++) {
    const wy = wrapMapCoord(startY + gy);
    const row = wy * W;
    for (let gx = 0; gx < cols; gx++) {
      const wx = wrapMapCoord(startX + gx);
      const ci = row + wx;
      const gridX = gx + exploredGridPad;
      const gridY = gy + exploredGridPad;
      let cr = 0;
      let cg = 0;
      let cb = 0;
      let alpha = 255;

      if (!mapExploredGrid[gridY * exploredGridW + gridX]) {
        const fadeBand = world.cells[ci] === Cell.WALL ? 0 : unexploredFadeBand(gridX, gridY, exploredGridW);
        const packed = unexploredMapCellPackedRgb(wx, wy, fadeBand);
        cr = (packed >> 16) & 255;
        cg = (packed >> 8) & 255;
        cb = packed & 255;
      } else {
        const cell = world.cells[ci];
        if (cell === Cell.WALL) {
          if (world.hermoWall[ci]) {
            cr = 110;
            cg = 195;
            cb = 255;
          } else {
            alpha = 0;
          }
        } else if (cell === Cell.ABYSS) {
          cr = 16;
          cg = 8;
          cb = 16;
        } else if (cell === Cell.LIFT) {
          cr = 204;
          cg = 204;
          cb = 0;
          const liftDir = world.liftDir[ci];
          if (mapLegendToggleEnabled('map_lifts')) {
            recordMapLiftMarker(
              mapX + gx * cellW,
              mapY + gy * cellH,
              liftDir === LiftDirection.UP,
              questLiftDir !== undefined && liftDir === questLiftDir,
            );
          }
        } else if (cell === Cell.WATER) {
          cr = 34;
          cg = 51;
          cb = 85;
        } else {
          if (colorMode === 'factions') {
            [cr, cg, cb] = territoryRgb(territoryOwnerAtIndex(world, ci));
          } else {
            const rid = world.roomMap[ci];
            if (rid >= 0) {
              [cr, cg, cb] = roomTypeRgb(world.rooms[rid]?.type);
            } else {
              const zid = world.zoneMap[ci];
              const [zr, zg, zb] = ZONE_COLORS[zid % 64];
              cr = zr >> 1;
              cg = zg >> 1;
              cb = zb >> 1;
            }
          }
          if (cell === Cell.DOOR) {
            if (colorMode === 'factions') {
              cr = Math.round(cr * 0.68 + 136 * 0.32);
              cg = Math.round(cg * 0.68 + 100 * 0.32);
              cb = Math.round(cb * 0.68 + 68 * 0.32);
            } else {
              cr = 136;
              cg = 100;
              cb = 68;
            }
          }

          if (world.fog[ci] > 50) {
            const f = world.fog[ci] / 255;
            const [fogR, fogG, fogB] = MAP_FOG_RGB;
            cr = Math.round(cr * (1 - f) + fogR * f);
            cg = Math.round(cg * (1 - f) + fogG * f);
            cb = Math.round(cb * (1 - f) + fogB * f);
          }
        }
      }

      data[out++] = cr;
      data[out++] = cg;
      data[out++] = cb;
      data[out++] = alpha;
    }
  }

  buffer.ctx.putImageData(buffer.imageData, 0, 0);
  ctx.save();
  const smoothing = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(buffer.canvas, mapX, mapY, mapW, mapH);
  ctx.imageSmoothingEnabled = smoothing;
  ctx.restore();
}

function drawMapRoomQuestMarkers(
  ctx: CanvasRenderingContext2D,
  world: World,
  pxI: number,
  pyI: number,
  mapX: number,
  mapY: number,
  radius: number,
  cellW: number,
  cellH: number,
): void {
  if (activeTargetRooms.size === 0 && activeTargetRoomTypes.size === 0) return;
  for (const room of world.rooms) {
    if (!room || drawnTargetRooms.has(room.id)) continue;
    let markerKind = activeTargetRooms.get(room.id);
    if (!markerKind) markerKind = activeTargetRoomTypes.get(room.type);
    if (!markerKind) continue;
    const cx = world.wrap(Math.floor(room.x + room.w / 2));
    const cy = world.wrap(Math.floor(room.y + room.h / 2));
    const ci = world.idx(cx, cy);
    const cell = world.cells[ci];
    if ((cell !== Cell.FLOOR && cell !== Cell.DOOR) || !isMapCellExplored(world, ci)) continue;
    const dx = world.delta(pxI, cx);
    const dy = world.delta(pyI, cy);
    if (Math.abs(dx) > radius || Math.abs(dy) > radius) continue;
    drawQuestMarker(ctx, mapX + (dx + radius) * cellW, mapY + (dy + radius) * cellH, 5, 3, markerKind);
    drawnTargetRooms.add(room.id);
  }
}

interface SurfaceMapCellMarker {
  r: number;
  g: number;
  b: number;
  alpha: number;
  coverage: number;
}

interface SurfaceMapMarkerCache {
  version: number;
  markers: Map<number, SurfaceMapCellMarker>;
}

const SURFACE_MAP_MARKER_CACHE_CAP = 8192;
const SURFACE_MAP_MARKER_ALPHA_MIN = 24;
const surfaceMapMarkerCache = new WeakMap<World, SurfaceMapMarkerCache>();

function surfaceMapCellMarker(pixels: Uint8Array): SurfaceMapCellMarker | null {
  let alphaSum = 0;
  let rSum = 0;
  let gSum = 0;
  let bSum = 0;
  let covered = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    const a = pixels[i + 3];
    if (a < SURFACE_MAP_MARKER_ALPHA_MIN) continue;
    alphaSum += a;
    rSum += pixels[i] * a;
    gSum += pixels[i + 1] * a;
    bSum += pixels[i + 2] * a;
    covered++;
  }
  if (alphaSum <= 0 || covered <= 0) return null;
  const inv = 1 / alphaSum;
  const coverage = covered / 256;
  return {
    r: Math.round(rSum * inv),
    g: Math.round(gSum * inv),
    b: Math.round(bSum * inv),
    alpha: Math.min(0.9, 0.42 + Math.sqrt(coverage) * 1.1),
    coverage,
  };
}

function surfaceMapMarkers(world: World): Map<number, SurfaceMapCellMarker> {
  const cached = surfaceMapMarkerCache.get(world);
  if (cached && cached.version === world.surfaceVersion) return cached.markers;

  const markers = new Map<number, SurfaceMapCellMarker>();
  for (const [ci, pixels] of world.surfaceMap) {
    if (markers.size >= SURFACE_MAP_MARKER_CACHE_CAP) break;
    if ((world.surfaceFlags[ci] & SURFACE_FLAG_CHALK_MAP) === 0) continue;
    const marker = surfaceMapCellMarker(pixels);
    if (marker) markers.set(ci, marker);
  }
  surfaceMapMarkerCache.set(world, { version: world.surfaceVersion, markers });
  return markers;
}

export function surfaceMapMarkersForTests(world: World): Map<number, SurfaceMapCellMarker> {
  return surfaceMapMarkers(world);
}

function drawSurfaceMapMarks(
  ctx: CanvasRenderingContext2D,
  world: World,
  pxI: number,
  pyI: number,
  mapX: number,
  mapY: number,
  radius: number,
  cellW: number,
  cellH: number,
): void {
  if (world.surfaceMap.size === 0) return;
  const markers = surfaceMapMarkers(world);
  if (markers.size === 0) return;

  ctx.save();
  for (const [ci, marker] of markers) {
    const wx = ci % W;
    const wy = (ci / W) | 0;
    const dx = world.delta(pxI, wx);
    const dy = world.delta(pyI, wy);
    if (Math.abs(dx) > radius || Math.abs(dy) > radius) continue;
    if (!isMapCellExplored(world, ci)) continue;

    const x = mapX + (dx + radius + 0.5) * cellW;
    const y = mapY + (dy + radius + 0.5) * cellH;
    const size = Math.max(1, Math.min(8, Math.max(cellW, cellH) * (0.65 + Math.sqrt(marker.coverage) * 4.5)));
    ctx.globalAlpha = marker.alpha;
    ctx.fillStyle = `rgb(${marker.r},${marker.g},${marker.b})`;
    ctx.fillRect(Math.round(x - size * 0.5), Math.round(y - size * 0.5), size, size);
  }
  ctx.restore();
}

function drawMapRoomLabels(
  ctx: CanvasRenderingContext2D,
  world: World,
  pxI: number,
  pyI: number,
  mapX: number,
  mapY: number,
  radius: number,
  cellW: number,
  cellH: number,
): void {
  let drawn = 0;
  ctx.save();
  ctx.font = '9px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 3;
  for (const room of world.rooms) {
    if (!room || !room.name) continue;
    const cx = world.wrap(Math.floor(room.x + room.w / 2));
    const cy = world.wrap(Math.floor(room.y + room.h / 2));
    const ci = world.idx(cx, cy);
    if (!isMapCellExplored(world, ci)) continue;
    const dx = world.delta(pxI, cx);
    const dy = world.delta(pyI, cy);
    if (Math.abs(dx) > radius || Math.abs(dy) > radius) continue;
    const x = mapX + (dx + radius) * cellW;
    const y = mapY + (dy + radius) * cellH;
    const label = shortMapLabel(room.name);
    ctx.strokeStyle = 'rgba(0,0,0,0.82)';
    ctx.strokeText(label, x, y);
    ctx.fillStyle = '#d8e2cc';
    ctx.fillText(label, x, y);
    drawn++;
    if (drawn >= MAP_LABEL_ROOM_CAP) break;
  }
  ctx.restore();
}

function drawMapNpcLabels(
  ctx: CanvasRenderingContext2D,
  world: World,
  player: Entity,
  pxI: number,
  pyI: number,
  mapX: number,
  mapY: number,
  radius: number,
  cellW: number,
  cellH: number,
): void {
  let drawn = 0;
  ctx.save();
  ctx.font = '9px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 3;
  for (const e of mapEntityQuery) {
    if (!e.alive || e.type !== EntityType.NPC || isPlayerEntity(e)) continue;
    const eCell = world.idx(Math.floor(e.x), Math.floor(e.y));
    if (!isMapCellExplored(world, eCell)) continue;
    const edx = world.delta(pxI, Math.floor(e.x));
    const edy = world.delta(pyI, Math.floor(e.y));
    if (Math.abs(edx) > radius || Math.abs(edy) > radius) continue;
    const x = mapX + (edx + radius) * cellW + 5;
    const y = mapY + (edy + radius) * cellH - 5;
    const label = shortMapLabel(e.name || 'NPC', 18);
    ctx.strokeStyle = 'rgba(0,0,0,0.86)';
    ctx.strokeText(label, x, y);
    ctx.fillStyle = isHostile(e, player) ? '#ff9a8a' : '#d6f3e5';
    ctx.fillText(label, x, y);
    drawn++;
    if (drawn >= MAP_LABEL_NPC_CAP) break;
  }
  ctx.restore();
}

/* ── 64 unique zone colors (HSL-based palette) ─────────────── */
export const ZONE_COLORS: [number, number, number][] = [];
for (let i = 0; i < 64; i++) {
  const hue = (i * 137.508) % 360; // golden angle for max spread
  const sat = 0.35 + (i % 3) * 0.15;
  const lit = 0.25 + (i % 4) * 0.06;
  const c = (1 - Math.abs(2 * lit - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = lit - c / 2;
  let r1: number, g1: number, b1: number;
  if      (hue < 60)  { r1 = c; g1 = x; b1 = 0; }
  else if (hue < 120) { r1 = x; g1 = c; b1 = 0; }
  else if (hue < 180) { r1 = 0; g1 = c; b1 = x; }
  else if (hue < 240) { r1 = 0; g1 = x; b1 = c; }
  else if (hue < 300) { r1 = x; g1 = 0; b1 = c; }
  else                { r1 = c; g1 = 0; b1 = x; }
  ZONE_COLORS.push([
    Math.round((r1 + m) * 255),
    Math.round((g1 + m) * 255),
    Math.round((b1 + m) * 255),
  ]);
}

/* ── Shared map renderer (used by minimap + fullmap) ──────────── */
function drawMap(
  ctx: CanvasRenderingContext2D,
  world: World, _entities: Entity[], player: Entity,
  _sx: number, _sy: number,
  mapX: number, mapY: number, mapW: number, mapH: number,
  radius: number, bgAlpha: number,
  quests?: Quest[],
  currentFloor?: FloorLevel,
  state?: GameState,
): void {
  ctx.fillStyle = `rgba(0,0,0,${bgAlpha})`;
  ctx.fillRect(mapX, mapY, mapW, mapH);

  const pxI = Math.floor(player.x);
  const pyI = Math.floor(player.y);
  const cellW = mapW / (radius * 2);
  const cellH = mapH / (radius * 2);
  const colorMode = mapColorMode();
  const showNpcs = mapLegendToggleEnabled('map_npcs');
  const showMonsters = mapLegendToggleEnabled('map_monsters');
  const showItems = mapLegendToggleEnabled('map_items');
  const showQuests = mapLegendToggleEnabled('map_quests');
  const showSurfaceMarks = mapLegendToggleEnabled('map_surface_marks');
  const fullMap = state?.mapMode === 2;
  prepareMapExploredGrid(world, pxI, pyI, radius);
  const questLiftDir = showQuests ? activeVisitLiftDirection(quests, currentFloor, state) : undefined;
  drawnTargetRooms.clear();
  if (quests && showQuests) {
    clearActiveQuestMarkers();
    let concreteRoomMarkers = 0;
    for (const q of quests) {
      if (q.done) continue;
      const kind = questKind(q);
      if (
        q.type === QuestType.FETCH &&
        q.targetItem &&
        (q.targetFloor === undefined || q.targetFloor === currentFloor)
      ) setMarkerKind(activeFetchItems, q.targetItem, kind);
      if (!questTargetVisibleOnMap(q, currentFloor, state)) continue;
      if (q.type === QuestType.KILL) registerActiveKillTarget(q);
      const hasRoomTarget = q.targetRoom !== undefined || q.targetRoomType !== undefined || q.targetZoneTag !== undefined;
      if (hasRoomTarget && concreteRoomMarkers < MAX_CONCRETE_QUEST_ROOM_MARKERS) {
        const resolved = resolveQuestTargetRoom(world, q, player);
        if (resolved) {
          setMarkerKind(activeTargetRooms, resolved.room.id, kind);
          concreteRoomMarkers++;
          continue;
        }
      }
      if (q.targetRoom === undefined && q.targetRoomType !== undefined) setMarkerKind(activeTargetRoomTypes, q.targetRoomType, kind);
    }
  } else {
    clearActiveQuestMarkers();
  }

  drawMapBaseRaster(ctx, world, pxI, pyI, mapX, mapY, mapW, mapH, radius, cellW, cellH, questLiftDir, colorMode);
  if (showQuests) drawMapRoomQuestMarkers(ctx, world, pxI, pyI, mapX, mapY, radius, cellW, cellH);
  if (showSurfaceMarks) drawSurfaceMapMarks(ctx, world, pxI, pyI, mapX, mapY, radius, cellW, cellH);

  // Entities: bounded local query, then screen-bin compression for dense crowds.
  const entityDotBudget = mapEntityDotBudget(mapW, mapH, radius);
  const crowdBinPx = mapCrowdBinPixels(mapW, mapH);
  getEntityIndex().queryRadiusCapped(
    player.x,
    player.y,
    radius * Math.SQRT2 + 2,
    mapEntityQuery,
    ENTITY_MASK_VISIBLE,
    mapEntityQueryBudget(mapW, mapH, radius),
  );
  resetMapCrowdBins(entityDotBudget);
  for (const e of mapEntityQuery) {
    if (!e.alive || isPlayerEntity(e)) continue;
    const eCell = world.idx(Math.floor(e.x), Math.floor(e.y));
    if (!isMapCellExplored(world, eCell)) continue;
    const edx = world.delta(pxI, Math.floor(e.x));
    const edy = world.delta(pyI, Math.floor(e.y));
    if (Math.abs(edx) > radius || Math.abs(edy) > radius) continue;

    const esx = mapX + (edx + radius) * cellW;
    const esy = mapY + (edy + radius) * cellH;
    const bx = Math.floor((esx - mapX) / crowdBinPx);
    const by = Math.floor((esy - mapY) / crowdBinPx);
    const group = mapEntityCrowdGroup(e, player);
    if (group === MAP_CROWD_GROUP_ITEM && !showItems) continue;
    if (group === MAP_CROWD_GROUP_MONSTER && !showMonsters) continue;
    if (
      (group === MAP_CROWD_GROUP_FRIENDLY_NPC ||
      group === MAP_CROWD_GROUP_NEUTRAL_NPC ||
      group === MAP_CROWD_GROUP_HOSTILE_NPC) &&
      !showNpcs
    ) continue;
    if (group >= 0) addMapCrowdDot(esx, esy, by * 2048 + bx, group);
  }
  drawMapCrowdBins(ctx, mapW, mapH);

  if (showQuests) {
    for (const e of mapEntityQuery) {
      if (!e.alive || e.type !== EntityType.ITEM_DROP) continue;
      const eCell = world.idx(Math.floor(e.x), Math.floor(e.y));
      if (!isMapCellExplored(world, eCell)) continue;
      const edx = world.delta(pxI, Math.floor(e.x));
      const edy = world.delta(pyI, Math.floor(e.y));
      if (Math.abs(edx) > radius || Math.abs(edy) > radius) continue;

      const esx = mapX + (edx + radius) * cellW;
      const esy = mapY + (edy + radius) * cellH;
      if (
        activeFetchItems.size > 0 &&
        e.inventory
      ) {
        let markerKind: QuestKind | undefined;
        for (const slot of e.inventory) {
          const slotKind = activeFetchItems.get(slot.defId);
          if (slotKind) markerKind = mergeQuestKind(markerKind, slotKind);
        }
        if (markerKind) drawQuestMarker(ctx, esx, esy, 5, 3, markerKind);
      }
    }
  }

  // Quest markers — notable NPC markers + VISIT room markers
  if (quests && showQuests) {
    for (const e of mapEntityQuery) {
      if (!e.alive || e.type !== EntityType.NPC) continue;
      const markerState = state ? npcQuestMarkerState(e, state) : null;
      if (!markerState) continue;
      const eCell = world.idx(Math.floor(e.x), Math.floor(e.y));
      if (!isMapCellExplored(world, eCell)) continue;
      const edx = world.delta(pxI, Math.floor(e.x));
      const edy = world.delta(pyI, Math.floor(e.y));
      if (Math.abs(edx) > radius || Math.abs(edy) > radius) continue;

      const markerStyle = markerState.tone === 'procedural'
        ? MAP_PROCEDURAL_NPC_MARKER
        : markerState.active ? MAP_AUTHORED_ACTIVE_NPC_MARKER : MAP_AUTHORED_IDLE_NPC_MARKER;
      const qsx = mapX + (edx + radius) * cellW;
      const qsy = mapY + (edy + radius) * cellH;
      const sz = 6, sw = 4;
      drawQuestDiamond(ctx, qsx, qsy, sz, sw, markerStyle.stroke, markerStyle.fill);
    }
    // VISIT quest markers (room targets)
    for (const q of quests) {
      if (q.done) continue;
      if (q.type !== QuestType.VISIT || q.targetRoom === undefined) continue;
      const room = world.rooms[q.targetRoom];
      if (!room || drawnTargetRooms.has(room.id)) continue;
      const rx = room.x + room.w / 2;
      const ry = room.y + room.h / 2;
      const qdx = world.delta(pxI, Math.floor(rx));
      const qdy = world.delta(pyI, Math.floor(ry));
      if (Math.abs(qdx) > radius || Math.abs(qdy) > radius) continue;
      const qsx = mapX + (qdx + radius) * cellW;
      const qsy = mapY + (qdy + radius) * cellH;
      drawQuestMarker(ctx, qsx, qsy, 6, 4, questKind(q));
    }
    // KILL quest markers — show target NPCs and monsters as red diamonds.
    if (hasActiveKillTargets()) {
      for (const e of mapEntityQuery) {
        if (!e.alive || !isActiveKillQuestTarget(e)) continue;
        const eCell = world.idx(Math.floor(e.x), Math.floor(e.y));
        if (!isMapCellExplored(world, eCell)) continue;
        const edx = world.delta(pxI, Math.floor(e.x));
        const edy = world.delta(pyI, Math.floor(e.y));
        if (Math.abs(edx) > radius || Math.abs(edy) > radius) continue;
        const qsx = mapX + (edx + radius) * cellW;
        const qsy = mapY + (edy + radius) * cellH;
        drawKillTargetMarker(ctx, qsx, qsy, 5, 3);
      }
    }
  }

  // Player dot
  const pcx = mapX + radius * cellW;
  const pcy = mapY + radius * cellH;

  // Lift direction arrows
  if (mapLegendToggleEnabled('map_lifts')) drawRecordedMapLiftArrows(ctx);
  ctx.fillStyle = '#fff';
  ctx.fillRect(pcx - 1, pcy - 1, 3, 3);
  // Direction indicator
  ctx.strokeStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(pcx, pcy);
  ctx.lineTo(
    pcx + Math.cos(player.angle) * 4 * cellW,
    pcy + Math.sin(player.angle) * 4 * cellH,
  );
  ctx.stroke();
  if (showQuests) drawActiveQuestDirectionArrow(ctx, world, player, state, pcx, pcy, cellW, cellH);
  if (fullMap && mapLegendToggleEnabled('map_room_labels')) {
    drawMapRoomLabels(ctx, world, pxI, pyI, mapX, mapY, radius, cellW, cellH);
  }
  if (fullMap && showNpcs && mapLegendToggleEnabled('map_npc_labels')) {
    drawMapNpcLabels(ctx, world, player, pxI, pyI, mapX, mapY, radius, cellW, cellH);
  }
}

function factionSampleHash(world: World): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < world.factionControl.length; i += 997) {
    h ^= territoryOwnerAtIndex(world, i) + i;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function overviewSignature(world: World, colorMode: MapColorMode): string {
  const factionHash = colorMode === 'factions' ? factionSampleHash(world) : 0;
  return [
    colorMode,
    world.cellVersion,
    world.wallTexVersion,
    world.floorTexVersion,
    world.rooms.length,
    world.doors.size,
    mapExplorationVersion(world),
    factionHash,
  ].join(':');
}

function overviewCellRgb(world: World, ci: number, colorMode: MapColorMode): [number, number, number] {
  const cell = world.cells[ci];
  if (cell === Cell.WALL) {
    if (world.hermoWall[ci]) return [42, 102, 130];
    return [20, 22, 23];
  }
  if (cell === Cell.ABYSS) return [5, 4, 8];
  if (cell === Cell.LIFT) return [92, 160, 210];
  if (cell === Cell.DOOR) return [190, 150, 68];
  if (cell === Cell.WATER) return [32, 78, 96];
  if (colorMode === 'factions') return territoryRgb(territoryOwnerAtIndex(world, ci), 0.74);

  const rid = world.roomMap[ci];
  if (rid >= 0) return roomTypeRgb(world.rooms[rid]?.type);
  const [zr, zg, zb] = ZONE_COLORS[world.zoneMap[ci] % 64];
  return [zr >> 1, zg >> 1, zb >> 1];
}

function floorOverviewCanvas(ctx: CanvasRenderingContext2D, world: World, colorMode: MapColorMode): HTMLCanvasElement | null {
  const signature = overviewSignature(world, colorMode);
  const cached = floorOverviewCache.get(world);
  if (cached && cached.signature === signature) return cached.canvas;

  const doc = ctx.canvas.ownerDocument ?? (typeof document !== 'undefined' ? document : null);
  if (!doc) return null;
  const canvas = cached?.canvas ?? doc.createElement('canvas');
  canvas.width = MAP_OVERVIEW_SIZE;
  canvas.height = MAP_OVERVIEW_SIZE;
  const bufferCtx = cached?.ctx ?? canvas.getContext('2d');
  if (!bufferCtx) return null;
  const imageData = cached?.imageData?.width === MAP_OVERVIEW_SIZE && cached.imageData.height === MAP_OVERVIEW_SIZE
    ? cached.imageData
    : bufferCtx.createImageData(MAP_OVERVIEW_SIZE, MAP_OVERVIEW_SIZE);
  const data = imageData.data;
  let out = 0;
  for (let ci = 0; ci < W * W; ci++) {
    if (isMapCellExplored(world, ci)) {
      const [r, g, b] = overviewCellRgb(world, ci, colorMode);
      data[out++] = r;
      data[out++] = g;
      data[out++] = b;
    } else {
      const x = ci % W;
      const y = (ci / W) | 0;
      const shade = 3 + ((Math.imul(x + 11, 73856093) ^ Math.imul(y + 17, 19349663)) & 3);
      data[out++] = shade;
      data[out++] = shade + 2;
      data[out++] = shade + 4;
    }
    data[out++] = 255;
  }
  bufferCtx.putImageData(imageData, 0, 0);
  floorOverviewCache.set(world, { canvas, ctx: bufferCtx, imageData, signature });
  return canvas;
}

function drawMapLegendSwatches(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, sy: number, colorMode: MapColorMode): void {
  const rows = colorMode === 'factions'
    ? Object.values(ZoneFaction).filter((value): value is ZoneFaction => typeof value === 'number')
        .map(owner => ({ label: TERRITORY_NAMES[owner], rgb: TERRITORY_RGB[owner] }))
    : [
        { label: 'Жилая', rgb: ROOM_TYPE_RGB[RoomType.LIVING] },
        { label: 'Кухня', rgb: ROOM_TYPE_RGB[RoomType.KITCHEN] },
        { label: 'Санузел', rgb: ROOM_TYPE_RGB[RoomType.BATHROOM] },
        { label: 'Склад', rgb: ROOM_TYPE_RGB[RoomType.STORAGE] },
        { label: 'Мед', rgb: ROOM_TYPE_RGB[RoomType.MEDICAL] },
        { label: 'Цех', rgb: ROOM_TYPE_RGB[RoomType.PRODUCTION] },
        { label: 'Штаб', rgb: ROOM_TYPE_RGB[RoomType.HQ] },
      ];
  ctx.save();
  ctx.font = `${7 * sy}px monospace`;
  ctx.textBaseline = 'middle';
  let cx = x;
  let cy = y;
  for (const row of rows) {
    const swatch = 7 * sy;
    const gap = 8 * sy;
    const labelW = Math.min(80 * sy, Math.max(34 * sy, row.label.length * 5.8 * sy));
    if (cx + swatch + gap + labelW > x + w) {
      cx = x;
      cy += 12 * sy;
    }
    ctx.fillStyle = `rgb(${row.rgb[0]},${row.rgb[1]},${row.rgb[2]})`;
    ctx.fillRect(cx, cy - 4 * sy, swatch, swatch);
    ctx.fillStyle = '#789';
    ctx.fillText(row.label, cx + swatch + gap, cy);
    cx += swatch + gap + labelW + 12 * sy;
  }
  ctx.restore();
}

function drawLegendMenuRow(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  index: number,
  x: number,
  y: number,
  w: number,
  rowH: number,
  sx: number,
): void {
  const row = mapLegendRowAt(index);
  if (!row) return;
  const selected = index === state.mapLegendSel;
  const textY = y + rowH * 0.5;
  if (selected) {
    ctx.fillStyle = 'rgba(0,92,78,0.48)';
    ctx.fillRect(x - 2 * sx, y, w + 4 * sx, rowH);
    ctx.strokeStyle = '#0fb';
    ctx.strokeRect(x - 2 * sx + 0.5, y + 0.5, w + 4 * sx - 1, rowH - 1);
  }
  ctx.fillStyle = selected ? '#0fa' : '#6a8';
  ctx.fillText(selected ? '>' : ' ', x, textY);

  let group = '';
  let label = '';
  let value = 'ENTER';
  let valueColor = '#fd6';
  if (row.kind === 'map_color_mode') {
    group = row.group;
    label = row.label;
    const mode = MAP_COLOR_MODES.find(entry => entry.id === mapColorMode());
    value = mode?.label ?? 'Типы комнат';
    valueColor = '#8cf';
  } else if (row.kind === 'reset_map_legend') {
    group = row.group;
    label = row.label;
  } else if (row.kind === 'map_toggle') {
    group = row.toggle.group;
    label = row.toggle.label;
    const enabled = mapLegendToggleEnabled(row.toggle.id);
    value = enabled ? 'ВКЛ' : 'ВЫКЛ';
    valueColor = enabled ? '#8f8' : '#b66';
  }

  const groupW = Math.min(72 * sx, w * 0.24);
  const valueW = Math.min(98 * sx, w * 0.33);
  const labelW = Math.max(40 * sx, w - groupW - valueW - 24 * sx);
  ctx.fillStyle = '#689';
  ctx.fillText(fitTextStable(ctx, group, groupW - 10 * sx), x + 14 * sx, textY);
  ctx.fillStyle = selected ? '#dff' : '#9bb';
  ctx.fillText(fitTextStable(ctx, label, labelW), x + groupW + 16 * sx, textY);
  ctx.fillStyle = valueColor;
  ctx.fillText(fitTextStable(ctx, value, valueW), x + groupW + labelW + 20 * sx, textY);
}

export function drawMapLegendMenu(
  ctx: CanvasRenderingContext2D,
  world: World,
  player: Entity,
  state: GameState,
  sx: number,
  sy: number,
  _uiTime = state.time,
): void {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const s = Math.max(1, Math.min(1.35, Math.min(sx, sy)));
  const pad = 14 * s;
  const gap = 16 * s;
  const colorMode = mapColorMode();
  const rightW = Math.min(w * 0.46, Math.max(240 * s, h * 0.72));
  const rightX = w - pad - rightW;
  const leftX = pad;
  const leftW = Math.max(160 * s, rightX - leftX - gap);
  const top = 66 * s;
  const rowH = 18 * s;
  const swatchY = h - 70 * s;
  const bottom = Math.max(top + rowH * 4, swatchY - 16 * s);
  const visibleRows = Math.max(4, Math.floor((bottom - top) / rowH));
  const rowCount = mapLegendRowCount();
  const maxScroll = Math.max(0, rowCount - visibleRows);
  const scroll = Math.max(0, Math.min(maxScroll, state.mapLegendScroll));

  ctx.fillStyle = '#00040a';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#123';
  ctx.strokeRect(pad + 0.5, pad + 0.5, w - pad * 2 - 1, h - pad * 2 - 1);

  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#6cf';
  ctx.font = `${13 * s}px monospace`;
  ctx.fillText('ЛЕГЕНДА КАРТЫ', leftX, 26 * s);
  ctx.font = `${7 * s}px monospace`;
  ctx.fillStyle = '#577';
  ctx.fillText(
    fitTextStable(ctx, `${controlHint('mapLegend')} открыть/закрыть  |  ${controlHint('gameMenu')} переключить  |  ${menuCloseHint()} закрыть`, leftW),
    leftX,
    43 * s,
  );

  ctx.textBaseline = 'middle';
  ctx.font = `${7 * s}px monospace`;
  ctx.fillStyle = '#345';
  ctx.fillText('РАЗДЕЛ', leftX + 14 * s, top - 10 * s);
  ctx.fillText('СЛОЙ', leftX + Math.min(72 * s, leftW * 0.24) + 16 * s, top - 10 * s);
  ctx.fillText('СТАТУС', leftX + leftW - 86 * s, top - 10 * s);
  for (let i = 0; i < visibleRows; i++) {
    const rowIndex = scroll + i;
    if (rowIndex >= rowCount) break;
    drawLegendMenuRow(ctx, state, rowIndex, leftX, top + i * rowH, leftW, rowH, s);
  }

  drawMapLegendSwatches(ctx, leftX, swatchY, leftW, s, colorMode);

  const overviewTop = 52 * s;
  const overviewSide = Math.min(rightW - 16 * s, h - overviewTop - 24 * s);
  const overviewX = rightX + (rightW - overviewSide) * 0.5;
  const overviewY = overviewTop + 18 * s;
  ctx.fillStyle = 'rgba(1,7,10,0.94)';
  ctx.fillRect(rightX, overviewTop, rightW, overviewSide + 24 * s);
  ctx.strokeStyle = '#17404a';
  ctx.strokeRect(rightX + 0.5, overviewTop + 0.5, rightW - 1, overviewSide + 24 * s - 1);
  ctx.fillStyle = '#7aa';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `${8 * s}px monospace`;
  ctx.fillText('СХЕМА ВСЕГО ЭТАЖА', overviewX, overviewTop + 11 * s);
  const overview = floorOverviewCanvas(ctx, world, colorMode);
  if (overview) {
    ctx.save();
    const smoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(overview, overviewX, overviewY, overviewSide, overviewSide);
    ctx.imageSmoothingEnabled = smoothing;
    ctx.restore();
  }
  const px = overviewX + (world.wrap(Math.floor(player.x)) / W) * overviewSide;
  const py = overviewY + (world.wrap(Math.floor(player.y)) / W) * overviewSide;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(px - 5, py);
  ctx.lineTo(px + 5, py);
  ctx.moveTo(px, py - 5);
  ctx.lineTo(px, py + 5);
  ctx.stroke();
}

/* ── Minimap ──────────────────────────────────────────────────── */
export function drawMinimap(
  ctx: CanvasRenderingContext2D,
  world: World, entities: Entity[], player: Entity,
  sx: number, sy: number, quests?: Quest[], _floorInstanceLabel?: string, currentFloor?: FloorLevel, state?: GameState, _uiTime = state?.time ?? 0,
  rect?: UiRect,
): void {
  const mw = rect?.w ?? MAP_SIZE * sx;
  const mh = rect?.h ?? MAP_SIZE * sy;
  const mx = rect?.x ?? ctx.canvas.width - mw - 4 * sx;
  const my = rect?.y ?? 4 * sy;
  drawMap(ctx, world, entities, player, sx, sy, mx, my, mw, mh, 40, 0.75, quests, currentFloor, state);
}

/* ── Full world map (fullscreen) ─────────────────────────────── */
export function drawFullMap(
  ctx: CanvasRenderingContext2D,
  world: World, entities: Entity[], player: Entity,
  sx: number, sy: number, quests?: Quest[], _floorInstanceLabel?: string, currentFloor?: FloorLevel, state?: GameState, _uiTime = state?.time ?? 0,
): void {
  const cw = ctx.canvas.width;
  const ch = ctx.canvas.height;
  const pad = 4 * sx;
  const mapW = cw - pad * 2;
  const mapH = ch - pad * 2;
  drawMap(ctx, world, entities, player, sx, sy, pad, pad, mapW, mapH, 200, 0.85, quests, currentFloor, state);

  ctx.fillStyle = '#666';
  ctx.font = `${8 * sy}px monospace`;
  const hint = `${controlHint('map')} закрыть карту  |  ${controlHint('mapLegend')} легенда/настройка карты  |  ${menuCloseHint()} закрыть`;
  ctx.fillText(fitTextStable(ctx, hint, mapW - 8 * sx), pad + 4, pad + mapH - 4);
}
