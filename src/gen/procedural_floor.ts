/* ── Seeded combinatoric procedural floors ───────────────────── */

import {
  W,
  Cell,
  ContainerKind,
  Feature,
  FloorLevel,
  LiftDirection,
  EntityType,
  AIGoal,
  Faction,
  MonsterKind,
  Occupation,
  RoomType,
  Tex,
  ZoneFaction,
  type Entity,
  type Item,
  type ItemDef,
  type RailTrainTrack,
  type Room,
  type WorldContainer,
} from '../core/types';
import { World } from '../core/world';
import { withSeededRandom } from '../core/rand';
import { ITEMS, NOTES, freshNeeds, randomName } from '../data/catalog';
import { ITEM_TAGS, getStack, spawnCount } from '../data/items';
import { CONTAINER_DEFS, containerKindsForRoom } from '../data/container_defs';
import { emergencyPanelDefsForGeometry, type EmergencyPanelDef } from '../data/emergency_panels';
import { chooseFloorMonsterKind, getMonsterEcology } from '../data/monster_ecology';
import {
  proceduralPopulationBudget,
  proceduralPopulationProfileId,
} from '../data/population_profiles';
import {
  FALSE_SAFE_BLOCK_ROOM_PREFIX,
  FALSE_SAFE_BLOCK_TAG,
  PROCEDURAL_LOOT_ANOMALY_KIND_BIAS,
  PROCEDURAL_LOOT_ANOMALY_TAGS,
  PROCEDURAL_LOOT_FACTION_KIND_BIAS,
  PROCEDURAL_LOOT_FACTION_TAGS,
  floorRunZAllowsNpcs,
  geometryById,
  majorityById,
  proceduralFloorAnomalyRoutePressure,
  proceduralFloorRoutePressureLevel,
  proceduralMonsterFloor,
  proceduralLootValueCap,
  type ProceduralFloorSpec,
} from '../data/procedural_floors';
import { MONSTERS, applyMonsterVariant } from '../entities/monster';
import { monsterSpr, Spr } from '../render/sprite_index';
import { gaussianLevel, getMaxHp, randomRPG } from '../systems/rpg';
import { canSpawnEntityType, entitySpawnSlots } from '../systems/entity_limits';
import { addRailTrainRoute } from '../systems/rail_trains';
import { registerRouteCue } from '../systems/route_cues';
import { placeEmergencyPanel } from '../systems/emergency_panels';
import { relightBadAppleWorld } from '../systems/procedural_anomalies/bad_apple_world';
import {
  buildWalkablePlacementMap,
  canPlaceRoom,
  connectRoomsMST,
  decorateRoom,
  ensureConnectivity,
  generateZones,
  isConnectivityWalkable,
  placeLifts,
  sanitizeDoors,
  shapeRoom,
  stampRoom,
} from './shared';
import type { FloorGeneration } from './floor_manifest';
import { decorateCarnivorousFungusRoom } from './carnivorous_fungus_room';
import { applyProceduralAnomalyProfile } from './procedural_anomalies';
import { removeNpcEntities } from './entity_filters';
import { registerProceduralAnomalyPlacement } from './procedural_anomalies/common';
import { sampleNaturalPopulationCells, type NaturalPopulationProfile } from './population_placement';

function irng(lo: number, hi: number): number {
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}

function chance(p: number): boolean {
  return Math.random() < p;
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function isIndustrialGeometry(id: ProceduralFloorSpec['geometryId']): boolean {
  return id === 'collectors'
    || id === 'workshops'
    || id === 'service_spines'
    || id === 'attic_weatherworks'
    || id === 'sump_causeways';
}

function roomSize(type: RoomType, industrial: boolean): { w: number; h: number } {
  if (type === RoomType.CORRIDOR) {
    return chance(0.5)
      ? { w: irng(18, 42), h: irng(3, 5) }
      : { w: irng(3, 5), h: irng(18, 42) };
  }
  if (type === RoomType.PRODUCTION) return { w: irng(12, industrial ? 30 : 22), h: irng(9, industrial ? 24 : 18) };
  if (type === RoomType.COMMON) return { w: irng(10, 24), h: irng(8, 20) };
  if (type === RoomType.OFFICE) return { w: irng(7, 14), h: irng(6, 12) };
  if (type === RoomType.BATHROOM) return { w: irng(4, 7), h: irng(4, 7) };
  if (type === RoomType.KITCHEN) return { w: irng(5, 9), h: irng(5, 9) };
  return { w: irng(5, 12), h: irng(5, 11) };
}

function applyRoomTexture(world: World, room: Room, wallTex: Tex, floorTex: Tex): void {
  room.wallTex = wallTex;
  room.floorTex = floorTex;
  for (let dy = -1; dy <= room.h; dy++) {
    for (let dx = -1; dx <= room.w; dx++) {
      const i = world.idx(room.x + dx, room.y + dy);
      if (world.cells[i] === Cell.WALL) world.wallTex[i] = wallTex;
    }
  }
  for (let dy = 0; dy < room.h; dy++) {
    for (let dx = 0; dx < room.w; dx++) {
      world.floorTex[world.idx(room.x + dx, room.y + dy)] = floorTex;
    }
  }
}

function decorateProceduralRoom(world: World, room: Room, spec: ProceduralFloorSpec): void {
  const industrial = isIndustrialGeometry(spec.geometryId);
  for (let dy = 1; dy < room.h - 1; dy++) {
    for (let dx = 1; dx < room.w - 1; dx++) {
      if (Math.random() > 0.025) continue;
      const i = world.idx(room.x + dx, room.y + dy);
      if (world.cells[i] !== Cell.FLOOR) continue;
      if (room.type === RoomType.PRODUCTION) world.features[i] = industrial ? Feature.MACHINE : Feature.TABLE;
      else if (room.type === RoomType.KITCHEN) world.features[i] = chance(0.5) ? Feature.STOVE : Feature.SINK;
      else if (room.type === RoomType.BATHROOM) world.features[i] = chance(0.5) ? Feature.TOILET : Feature.SINK;
      else if (room.type === RoomType.OFFICE) world.features[i] = chance(0.5) ? Feature.DESK : Feature.SHELF;
      else if (room.type === RoomType.STORAGE) world.features[i] = Feature.SHELF;
      else if (chance(0.25)) world.features[i] = Feature.LAMP;
    }
  }
}

function buildRooms(world: World, spec: ProceduralFloorSpec): { rooms: Room[]; spawnX: number; spawnY: number } {
  const geom = geometryById(spec.geometryId);
  const rooms: Room[] = [];
  const industrial = geom.tags.includes('industrial');
  const targetRooms = geom.roomCount + spec.danger * 6;
  let id = 0;

  for (let attempt = 0; attempt < targetRooms * 70 && rooms.length < targetRooms; attempt++) {
    const type = pick(geom.roomTypes);
    const size = roomSize(type, industrial);
    const x = irng(20, W - 20 - size.w);
    const y = irng(20, W - 20 - size.h);
    if (!canPlaceRoom(world, x, y, size.w, size.h)) continue;
    const room = stampRoom(world, id++, type, x, y, size.w, size.h, -1);
    room.name = proceduralRoomName(spec, room);
    applyRoomTexture(world, room, geom.wallTex, geom.floorTex);
    if (type === RoomType.COMMON || type === RoomType.PRODUCTION || type === RoomType.CORRIDOR) {
      if (chance(0.55)) shapeRoom(world, room);
      decorateRoom(world, room);
    }
    decorateProceduralRoom(world, room, spec);
    rooms.push(room);
  }

  connectRoomsMST(world, rooms);
  const first = rooms[0];
  const spawnX = first ? first.x + Math.floor(first.w / 2) + 0.5 : W / 2 + 0.5;
  const spawnY = first ? first.y + Math.floor(first.h / 2) + 0.5 : W / 2 + 0.5;
  ensureConnectivity(world, spawnX, spawnY);
  sanitizeDoors(world);
  return { rooms, spawnX, spawnY };
}

function proceduralRoomName(spec: ProceduralFloorSpec, room: Room): string {
  const prefix = spec.geometryId === 'workshops'
    ? 'Цех'
    : spec.geometryId === 'collectors'
      ? 'Канал'
      : spec.geometryId === 'sump_causeways'
        ? 'Эстакада'
        : spec.geometryId === 'service_spines'
          ? 'Штрек'
          : spec.geometryId === 'attic_weatherworks'
            ? 'Венткамера'
            : spec.geometryId === 'archive_warrens'
              ? 'Стеллаж'
              : spec.geometryId === 'admin_pockets'
                ? 'Кабинет'
                : spec.geometryId === 'communal_knots'
                  ? 'Узел'
                  : 'Комната';
  if (room.type === RoomType.PRODUCTION) return `${prefix} ${room.id}`;
  if (room.type === RoomType.CORRIDOR) return `Ход ${room.id}`;
  if (room.type === RoomType.STORAGE) return `Кладовая ${room.id}`;
  if (room.type === RoomType.OFFICE) return `Контора ${room.id}`;
  return `${prefix} ${room.id}`;
}

function applyZones(world: World, spec: ProceduralFloorSpec): void {
  const majority = majorityById(spec.majorityId);
  const alternatives: ZoneFaction[] = [majority.zoneFaction, majority.zoneFaction, majority.zoneFaction];
  if (majority.zoneFaction !== ZoneFaction.CITIZEN) alternatives.push(ZoneFaction.CITIZEN);
  alternatives.push(ZoneFaction.LIQUIDATOR, ZoneFaction.CULTIST, ZoneFaction.WILD);
  for (const zone of world.zones) {
    zone.level = Math.max(1, Math.min(5, spec.danger + irng(-1, 1)));
    zone.fogged = false;
    zone.faction = chance(0.68) ? majority.zoneFaction : pick(alternatives);
  }
}

function randomRoomCell(room: Room): { x: number; y: number } {
  return {
    x: room.x + irng(1, Math.max(1, room.w - 2)),
    y: room.y + irng(1, Math.max(1, room.h - 2)),
  };
}

function chooseItem(room: Room, spec: ProceduralFloorSpec, maxValue = Number.POSITIVE_INFINITY): ItemDef | null {
  let total = 0;
  const weighted: { def: ItemDef; weight: number }[] = [];
  for (const def of Object.values(ITEMS)) {
    if (!def.spawnRooms.includes(room.type)) continue;
    if (def.value > maxValue) continue;
    let weight = def.spawnW * (1000 / (def.value + 10));
    if (spec.lootBiasIds.includes(def.id)) weight *= 4.5;
    if (spec.danger >= 4 && def.value > 80) weight *= 1.5;
    if (weight <= 0) continue;
    weighted.push({ def, weight });
    total += weight;
  }
  if (weighted.length === 0 || total <= 0) return null;
  let roll = Math.random() * total;
  for (const item of weighted) {
    roll -= item.weight;
    if (roll <= 0) return item.def;
  }
  return weighted[weighted.length - 1].def;
}

function dropItem(entities: Entity[], nextId: { v: number }, x: number, y: number, defId: string, count = 1): void {
  if (!canSpawnEntityType(entities, EntityType.ITEM_DROP)) return;
  entities.push({
    id: nextId.v++,
    type: EntityType.ITEM_DROP,
    x: x + 0.5,
    y: y + 0.5,
    angle: 0,
    pitch: 0,
    alive: true,
    speed: 0,
    sprite: Spr.ITEM_DROP,
    inventory: [{
      defId,
      count,
      data: defId === 'note' ? pick(NOTES) : undefined,
    }],
  });
}

function itemTags(defId: string): readonly string[] {
  return ITEMS[defId]?.tags ?? ITEM_TAGS[defId] ?? [];
}

function inventoryValue(items: readonly Item[]): number {
  let value = 0;
  for (const item of items) value += (ITEMS[item.defId]?.value ?? 0) * item.count;
  return value;
}

function addCappedItem(inv: Item[], item: Item, valueCap: number, capacitySlots: number): boolean {
  const def = ITEMS[item.defId];
  if (!def || item.count <= 0 || inv.length >= capacitySlots) return false;
  const roomLeft = valueCap - inventoryValue(inv);
  let count = Math.min(item.count, getStack(def));
  if (def.value > 0) count = Math.min(count, Math.floor(roomLeft / def.value));
  if (count <= 0) return false;
  inv.push({
    defId: item.defId,
    count,
    data: item.data ?? (item.defId === 'note' ? pick(NOTES) : undefined),
  });
  return true;
}

function proceduralContainerValueCap(kind: ContainerKind, spec: ProceduralFloorSpec): number {
  return Math.min(proceduralLootValueCap(spec.danger), CONTAINER_DEFS[kind].proceduralValueCap ?? Number.POSITIVE_INFINITY);
}

function seedProceduralLootInventory(room: Room, kind: ContainerKind, spec: ProceduralFloorSpec): Item[] {
  const def = CONTAINER_DEFS[kind];
  const valueCap = proceduralContainerValueCap(kind, spec);
  const inv: Item[] = [];
  const targetSlots = Math.min(def.capacitySlots, 2 + Math.floor(spec.danger / 2) + (kind === ContainerKind.SAFE || kind === ContainerKind.SECRET_STASH ? 1 : 0));
  const bias = spec.lootBiasIds[(room.id + kind + spec.danger) % Math.max(1, spec.lootBiasIds.length)];
  if (bias && chance(0.72)) addCappedItem(inv, { defId: bias, count: 1 }, valueCap, def.capacitySlots);

  for (let attempt = 0; attempt < targetSlots * 4 && inv.length < targetSlots; attempt++) {
    const remaining = valueCap - inventoryValue(inv);
    if (remaining <= 0) break;
    const picked = chooseItem(room, spec, remaining);
    if (!picked) break;
    const count = irng(1, Math.max(1, Math.min(spawnCount(picked), spec.danger + 2)));
    addCappedItem(inv, { defId: picked.id, count }, valueCap, def.capacitySlots);
  }

  for (const item of def.itemPool) {
    if (inv.length > 0) break;
    if (item.chance !== undefined && !chance(item.chance)) continue;
    addCappedItem(inv, { defId: item.defId, count: Math.max(1, item.min) }, valueCap, def.capacitySlots);
  }
  return inv;
}

function uniqueTags(tags: readonly string[]): string[] {
  const out: string[] = [];
  for (const tag of tags) {
    if (!tag || out.includes(tag)) continue;
    out.push(tag);
  }
  return out;
}

function inventoryHasContamination(inv: readonly Item[]): boolean {
  for (const item of inv) {
    const tags = itemTags(item.defId);
    if (
      tags.includes('contaminant') ||
      tags.includes('contaminated') ||
      tags.includes('bad_batch') ||
      tags.includes('bait_risky') ||
      tags.includes('toxic') ||
      tags.includes('infection')
    ) return true;
  }
  return false;
}

function proceduralOwnerName(spec: ProceduralFloorSpec): string {
  if (spec.majorityId === 'liquidators') return 'пост ликвидаторов';
  if (spec.majorityId === 'cultists') return 'черная ладонь';
  if (spec.majorityId === 'scientists') return 'смена НИИ';
  if (spec.majorityId === 'wild') return 'дикие жильцы';
  return 'местные жильцы';
}

function proceduralLootAccess(kind: ContainerKind, spec: ProceduralFloorSpec): WorldContainer['access'] {
  const base = CONTAINER_DEFS[kind].defaultAccess;
  if (kind === ContainerKind.SECRET_STASH) return 'secret';
  if (kind === ContainerKind.SAFE) return 'locked';
  if (kind === ContainerKind.WEAPON_CRATE) return 'faction';
  if (base === 'public') return 'public';
  if (spec.majorityId === 'liquidators' || spec.majorityId === 'cultists' || spec.majorityId === 'scientists') return 'faction';
  if (spec.majorityId === 'wild' && spec.danger >= 2) return chance(0.55) ? 'owner' : 'secret';
  if (spec.danger >= 4 && base !== 'room') return 'locked';
  return base;
}

function proceduralLootTags(kind: ContainerKind, spec: ProceduralFloorSpec, access: WorldContainer['access'], inventory: readonly Item[], extra: readonly string[] = []): string[] {
  const valueCap = proceduralContainerValueCap(kind, spec);
  return uniqueTags([
    'procedural_floor',
    'loot',
    'stash',
    `danger_${spec.danger}`,
    spec.geometryId,
    spec.majorityId,
    spec.anomalyId,
    ...PROCEDURAL_LOOT_FACTION_TAGS[spec.majorityId],
    ...PROCEDURAL_LOOT_ANOMALY_TAGS[spec.anomalyId],
    ...(access === 'owner' || access === 'faction' || access === 'locked' ? ['theft', 'audit_risk'] : []),
    ...(access === 'secret' ? ['secret'] : []),
    ...(inventoryHasContamination(inventory) ? ['contaminated'] : []),
    `value_cap_${valueCap}`,
    ...CONTAINER_DEFS[kind].tags,
    ...extra,
  ]);
}

function addProceduralLootContainer(
  world: World,
  spec: ProceduralFloorSpec,
  room: Room,
  pos: { x: number; y: number },
  kind: ContainerKind,
  inventory: Item[],
  extraTags: readonly string[] = [],
  name?: string,
): WorldContainer | null {
  if (inventory.length === 0 || world.containersAt(pos.x, pos.y).length > 0) return null;
  const def = CONTAINER_DEFS[kind];
  const access = proceduralLootAccess(kind, spec);
  const container: WorldContainer = {
    id: nextContainerId(world),
    x: pos.x,
    y: pos.y,
    floor: spec.baseFloor,
    roomId: room.id,
    zoneId: world.zoneMap[world.idx(pos.x, pos.y)],
    kind,
    name: name ?? `${def.name}: ${room.name}`,
    inventory,
    capacitySlots: def.capacitySlots,
    ownerName: access === 'owner' ? proceduralOwnerName(spec) : undefined,
    faction: access === 'faction' || access === 'locked' ? majorityById(spec.majorityId).npcFaction : undefined,
    access,
    lockDifficulty: access === 'locked' ? Math.min(5, 1 + spec.danger) : undefined,
    discovered: access !== 'secret',
    tags: proceduralLootTags(kind, spec, access, inventory, extraTags),
  };
  world.addContainer(container);
  return container;
}

interface ReachableLootCell {
  room: Room;
  x: number;
  y: number;
  dist2FromSpawn: number;
}

function isLootCell(world: World, ci: number, reachable: Uint8Array): boolean {
  if (!reachable[ci]) return false;
  if (world.cells[ci] !== Cell.FLOOR && world.cells[ci] !== Cell.WATER) return false;
  if (world.features[ci] !== Feature.NONE && world.features[ci] !== Feature.SHELF && world.features[ci] !== Feature.TABLE) return false;
  return true;
}

function collectReachableLootCells(world: World, rooms: Room[], reachable: Uint8Array, spawnX: number, spawnY: number): ReachableLootCell[] {
  const cells: ReachableLootCell[] = [];
  for (const room of rooms) {
    if (room.w < 3 || room.h < 3) continue;
    for (let dy = 1; dy < room.h - 1; dy++) {
      for (let dx = 1; dx < room.w - 1; dx++) {
        const x = world.wrap(room.x + dx);
        const y = world.wrap(room.y + dy);
        const ci = world.idx(x, y);
        if (world.roomMap[ci] !== room.id || !isLootCell(world, ci, reachable)) continue;
        if (world.containersAt(x, y).length > 0) continue;
        cells.push({ room, x, y, dist2FromSpawn: world.dist2(spawnX, spawnY, x + 0.5, y + 0.5) });
      }
    }
  }
  return cells;
}

interface ReachablePanelCell {
  room: Room;
  x: number;
  y: number;
  weight: number;
}

function panelRoomWeight(room: Room, def: EmergencyPanelDef, spec: ProceduralFloorSpec): number {
  let weight = def.roomTypes.includes(room.type) ? 4 : 0.4;
  if (room.type === RoomType.PRODUCTION) weight += 3;
  if (room.type === RoomType.STORAGE) weight += 2;
  if (room.type === RoomType.CORRIDOR) weight += spec.geometryId === 'service_spines' ? 3 : 1;
  if (room.type === RoomType.OFFICE && def.id === 'panel_doors') weight += 2;
  if (room.type === RoomType.BATHROOM && def.id === 'panel_water') weight += 3;
  if (room.id === 0) weight *= 0.18;
  return weight;
}

function collectReachablePanelCells(
  world: World,
  rooms: Room[],
  reachable: Uint8Array,
  spec: ProceduralFloorSpec,
  def: EmergencyPanelDef,
  used: Set<number>,
): ReachablePanelCell[] {
  const cells: ReachablePanelCell[] = [];
  for (const room of rooms) {
    if (room.w < 4 || room.h < 4) continue;
    const baseWeight = panelRoomWeight(room, def, spec);
    if (baseWeight <= 0) continue;
    for (let dy = 1; dy < room.h - 1; dy++) {
      for (let dx = 1; dx < room.w - 1; dx++) {
        const x = world.wrap(room.x + dx);
        const y = world.wrap(room.y + dy);
        const ci = world.idx(x, y);
        if (used.has(ci) || !reachable[ci]) continue;
        if (world.cells[ci] !== Cell.FLOOR) continue;
        if (world.roomMap[ci] !== room.id) continue;
        if (world.features[ci] !== Feature.NONE && world.features[ci] !== Feature.SHELF && world.features[ci] !== Feature.TABLE) continue;
        if (world.containersAt(x, y).length > 0) continue;
        const edge = dx <= 1 || dy <= 1 || dx >= room.w - 2 || dy >= room.h - 2;
        cells.push({ room, x, y, weight: edge ? baseWeight * 1.25 : baseWeight });
      }
    }
  }
  return cells;
}

function pickEmergencyPanelDef(spec: ProceduralFloorSpec, placed: number): EmergencyPanelDef | null {
  const defs = emergencyPanelDefsForGeometry(spec.geometryId);
  if (defs.length === 0) return null;
  let total = 0;
  for (const def of defs) total += def.weight * (def.geometryWeights[spec.geometryId] ?? 0);
  let roll = ((spec.seed + placed * 7919) % 100000) / 100000 * total;
  for (const def of defs) {
    roll -= def.weight * (def.geometryWeights[spec.geometryId] ?? 0);
    if (roll <= 0) return def;
  }
  return defs[defs.length - 1];
}

function pickReachablePanelCell(cells: readonly ReachablePanelCell[]): ReachablePanelCell | null {
  let total = 0;
  for (const cell of cells) total += cell.weight;
  if (cells.length === 0 || total <= 0) return null;
  let roll = Math.random() * total;
  for (const cell of cells) {
    roll -= cell.weight;
    if (roll <= 0) return cell;
  }
  return cells[cells.length - 1];
}

function placeProceduralEmergencyPanels(world: World, rooms: Room[], spec: ProceduralFloorSpec, reachable: Uint8Array): void {
  const defs = emergencyPanelDefsForGeometry(spec.geometryId);
  if (defs.length === 0) return;
  const baseCount = spec.geometryId === 'service_spines' ? 2 : 1;
  const target = Math.min(3, baseCount + (spec.danger >= 3 ? 1 : 0));
  const used = new Set<number>();

  for (let placed = 0; placed < target; placed++) {
    const def = pickEmergencyPanelDef(spec, placed);
    if (!def) break;
    const cells = collectReachablePanelCells(world, rooms, reachable, spec, def, used);
    const cell = pickReachablePanelCell(cells);
    if (!cell) break;
    const ci = world.idx(cell.x, cell.y);
    used.add(ci);
    placeEmergencyPanel(world, cell.x, cell.y, def.id, spec.seed ^ (cell.room.id * 193) ^ placed);
  }
}

function roomLootWeight(room: Room, spec: ProceduralFloorSpec): number {
  if (room.type === RoomType.STORAGE) return 5;
  if (room.type === RoomType.PRODUCTION) return spec.geometryId === 'workshops' || spec.geometryId === 'collectors' ? 4.5 : 3.2;
  if (room.type === RoomType.OFFICE) return spec.majorityId === 'scientists' || spec.geometryId === 'admin_pockets' ? 4.4 : 2.6;
  if (room.type === RoomType.KITCHEN) return spec.majorityId === 'citizens' ? 3.2 : 1.8;
  if (room.type === RoomType.COMMON) return 2.2;
  if (room.type === RoomType.CORRIDOR) return spec.anomalyId === 'teleport_cells' || spec.anomalyId === 'rail_trains' ? 2.6 : 0.8;
  return 1.2;
}

function pickReachableLootCell(cells: readonly ReachableLootCell[], used: Set<number>, spec: ProceduralFloorSpec): ReachableLootCell | null {
  let total = 0;
  const weighted: { cell: ReachableLootCell; weight: number }[] = [];
  const nearLimit = (18 + spec.danger * 3) ** 2;
  for (const cell of cells) {
    if (used.has(cell.x + cell.y * W)) continue;
    let weight = roomLootWeight(cell.room, spec);
    if (cell.dist2FromSpawn < nearLimit) weight *= 0.18;
    if (cell.dist2FromSpawn > nearLimit * 4) weight *= 1.35;
    weighted.push({ cell, weight });
    total += weight;
  }
  if (weighted.length === 0 || total <= 0) return null;
  let roll = Math.random() * total;
  for (const item of weighted) {
    roll -= item.weight;
    if (roll <= 0) return item.cell;
  }
  return weighted[weighted.length - 1].cell;
}

function chooseProceduralContainerKind(room: Room, spec: ProceduralFloorSpec, index: number): ContainerKind {
  const preferred = [
    ...PROCEDURAL_LOOT_ANOMALY_KIND_BIAS[spec.anomalyId],
    ...PROCEDURAL_LOOT_FACTION_KIND_BIAS[spec.majorityId],
    ...containerKindsForRoom(room.type),
  ];
  const fitting = preferred.filter(kind => CONTAINER_DEFS[kind].roomTypes.includes(room.type));
  const pool = fitting.length > 0 ? fitting : containerKindsForRoom(room.type);
  return pool[(spec.seed + room.id * 17 + index * 7) % pool.length];
}

function spawnLoot(world: World, rooms: Room[], spec: ProceduralFloorSpec, spawnX: number, spawnY: number, reachable: Uint8Array): void {
  const cells = collectReachableLootCells(world, rooms, reachable, spawnX, spawnY);
  const used = new Set<number>();
  const anomalyBonus = spec.anomalyId === 'none' ? 0 : 1;
  const target = Math.min(24, 5 + spec.danger * 2 + anomalyBonus + (spec.majorityId === 'wild' || spec.majorityId === 'cultists' ? 1 : 0));
  for (let n = 0; n < target; n++) {
    const cell = pickReachableLootCell(cells, used, spec);
    if (!cell) break;
    used.add(cell.x + cell.y * W);
    const kind = chooseProceduralContainerKind(cell.room, spec, n);
    const inventory = seedProceduralLootInventory(cell.room, kind, spec);
    addProceduralLootContainer(world, spec, cell.room, cell, kind, inventory);
  }
}

function occupationForFaction(faction: Faction, roomType: RoomType): Occupation {
  if (faction === Faction.LIQUIDATOR) return Occupation.HUNTER;
  if (faction === Faction.CULTIST) return Occupation.PILGRIM;
  if (faction === Faction.SCIENTIST) return Occupation.SCIENTIST;
  if (faction === Faction.WILD) return chance(0.5) ? Occupation.ALCOHOLIC : Occupation.TRAVELER;
  if (roomType === RoomType.PRODUCTION) return chance(0.5) ? Occupation.MECHANIC : Occupation.TURNER;
  if (roomType === RoomType.MEDICAL) return Occupation.DOCTOR;
  if (roomType === RoomType.OFFICE) return Occupation.SECRETARY;
  return pick([Occupation.HOUSEWIFE, Occupation.LOCKSMITH, Occupation.COOK, Occupation.TRAVELER]);
}

function npcLoadout(faction: Faction, danger: number): { weapon?: string; inventory: { defId: string; count: number }[] } {
  if (faction === Faction.LIQUIDATOR) {
    if (danger >= 4 && chance(0.35)) return { weapon: 'ak47', inventory: [{ defId: 'ak47', count: 1 }, { defId: 'ammo_762', count: irng(12, 32) }] };
    return { weapon: 'makarov', inventory: [{ defId: 'makarov', count: 1 }, { defId: 'ammo_9mm', count: irng(8, 24) }] };
  }
  if (faction === Faction.CULTIST) return chance(0.35)
    ? { weapon: 'psi_strike', inventory: [{ defId: 'psi_strike', count: 1 }] }
    : { weapon: 'knife', inventory: [{ defId: 'knife', count: 1 }] };
  if (faction === Faction.WILD) return { weapon: 'pipe', inventory: [{ defId: 'pipe', count: 1 }] };
  if (chance(0.2 + danger * 0.03)) return { weapon: 'knife', inventory: [{ defId: 'knife', count: 1 }] };
  return { inventory: [] };
}

function spawnNpcs(world: World, rooms: Room[], entities: Entity[], nextId: { v: number }, spec: ProceduralFloorSpec): void {
  const majority = majorityById(spec.majorityId);
  const count = entitySpawnSlots(entities, EntityType.NPC, proceduralPopulationBudgetForSpec(spec, true).npcs);
  const cells = sampleNaturalPopulationCells(world, count, proceduralNpcPlacementProfile(spec), proceduralNpcPopulationSeed(spec, nextId.v));
  for (const cell of cells) {
    const room = rooms[world.roomMap[cell]];
    const roomType = room?.type ?? RoomType.CORRIDOR;
    const faction = chance(0.78) ? majority.npcFaction : pick([Faction.CITIZEN, Faction.LIQUIDATOR, Faction.WILD, Faction.CULTIST]);
    const occupation = occupationForFaction(faction, roomType);
    const zoneLevel = world.zones[world.zoneMap[cell]]?.level ?? spec.danger;
    const rpg = randomRPG(gaussianLevel(zoneLevel, 2));
    const maxHp = getMaxHp(rpg);
    const nm = randomName(faction);
    const loadout = npcLoadout(faction, spec.danger);
    entities.push({
      id: nextId.v++,
      type: EntityType.NPC,
      x: (cell % W) + 0.5,
      y: ((cell / W) | 0) + 0.5,
      angle: Math.random() * Math.PI * 2,
      pitch: 0,
      alive: true,
      speed: occupation === Occupation.CHILD ? 0.8 : 1.15,
      sprite: occupation,
      name: nm.name,
      isFemale: nm.female,
      needs: freshNeeds(),
      hp: maxHp,
      maxHp,
      money: irng(5, 80 + spec.danger * 30),
      ai: { goal: AIGoal.IDLE, tx: 0, ty: 0, path: [], pi: 0, stuck: 0, timer: 0 },
      faction,
      occupation,
      isTraveler: true,
      questId: -1,
      rpg,
      inventory: loadout.inventory,
      weapon: loadout.weapon,
    });
  }
}

function proceduralNpcPlacementProfile(spec: ProceduralFloorSpec): NaturalPopulationProfile {
  const majority = majorityById(spec.majorityId);
  const highDensity = spec.anomalyId === 'zombie_apocalypse';
  const zoneWeights: Partial<Record<ZoneFaction, number>> = {
    [ZoneFaction.CITIZEN]: highDensity ? 1.0 : 0.98,
    [ZoneFaction.LIQUIDATOR]: highDensity ? 1.0 : 0.98,
    [ZoneFaction.CULTIST]: highDensity ? 1.0 : 0.98,
    [ZoneFaction.WILD]: highDensity ? 1.0 : 0.98,
  };
  zoneWeights[majority.zoneFaction] = highDensity ? 1.04 : 1.14;
  return {
    noiseScale: highDensity ? 160 : 128,
    noiseStrength: highDensity ? 0.02 : 0.1,
    openWeight: 1.0,
    roomWeights: highDensity
      ? {
          [RoomType.LIVING]: 1.0,
          [RoomType.KITCHEN]: 1.0,
          [RoomType.COMMON]: 1.0,
          [RoomType.CORRIDOR]: 1.0,
          [RoomType.PRODUCTION]: 1.0,
          [RoomType.OFFICE]: 1.0,
          [RoomType.MEDICAL]: 1.0,
          [RoomType.STORAGE]: 1.0,
          [RoomType.SMOKING]: 1.0,
          [RoomType.BATHROOM]: 1.0,
          [RoomType.HQ]: 1.0,
        }
      : {
          [RoomType.LIVING]: 1.08,
          [RoomType.KITCHEN]: 1.06,
          [RoomType.COMMON]: 1.05,
          [RoomType.CORRIDOR]: 1.0,
          [RoomType.PRODUCTION]: 0.98,
          [RoomType.OFFICE]: 0.98,
          [RoomType.MEDICAL]: 0.96,
          [RoomType.STORAGE]: 0.94,
          [RoomType.SMOKING]: 0.94,
          [RoomType.BATHROOM]: 0.9,
          [RoomType.HQ]: 0.9,
        },
    zoneWeights,
  };
}

function proceduralNpcPopulationSeed(spec: ProceduralFloorSpec, nextId: number): number {
  return (spec.seed ^ Math.imul(spec.z + 97, 0x45d9f3b) ^ Math.imul(nextId + 1, 0x27d4eb2d)) >>> 0;
}

function randomFloorCell(world: World, sx: number, sy: number, minDist2: number): { x: number; y: number } | null {
  for (let attempt = 0; attempt < 5000; attempt++) {
    const x = irng(4, W - 5);
    const y = irng(4, W - 5);
    const ci = world.idx(x, y);
    if (world.cells[ci] !== Cell.FLOOR && world.cells[ci] !== Cell.WATER) continue;
    if (minDist2 > 0 && world.dist2(sx, sy, x + 0.5, y + 0.5) < minDist2) continue;
    return { x, y };
  }
  return null;
}

function anomalyRoutePressure(spec: ProceduralFloorSpec): number {
  return proceduralFloorAnomalyRoutePressure(spec);
}

function proceduralPopulationBudgetForSpec(spec: ProceduralFloorSpec, npcAllowed: boolean) {
  return proceduralPopulationBudget({
    z: spec.z,
    danger: spec.danger,
    anomalyPressure: anomalyRoutePressure(spec),
    industrial: isIndustrialGeometry(spec.geometryId),
    npcAllowed,
    profileId: proceduralPopulationProfileId(spec.anomalyId),
  });
}

function routePressureLevel(spec: ProceduralFloorSpec): number {
  return proceduralFloorRoutePressureLevel(spec);
}

function proceduralMonsterCount(spec: ProceduralFloorSpec): number {
  return proceduralPopulationBudgetForSpec(spec, floorRunZAllowsNpcs(spec.z)).monsters;
}

function rareMonsterLimit(spec: ProceduralFloorSpec): number {
  if (spec.danger >= 5) return 2;
  if (spec.danger >= 3) return 1;
  return 0;
}

function rareMonsterChance(spec: ProceduralFloorSpec): number {
  return Math.min(0.08, 0.012 + spec.danger * 0.008 + routePressureLevel(spec) * 0.005);
}

function roomTypeAt(world: World, x: number, y: number): RoomType | undefined {
  const rid = world.roomMap[world.idx(x, y)];
  if (rid >= 0) return world.rooms[rid]?.type;
  return RoomType.CORRIDOR;
}

function spawnMonster(
  world: World,
  entities: Entity[],
  nextId: { v: number },
  spec: ProceduralFloorSpec,
  sx: number,
  sy: number,
  allowRare: boolean,
): MonsterKind | null {
  if (!canSpawnEntityType(entities, EntityType.MONSTER)) return null;
  const pos = randomFloorCell(world, sx, sy, 90 * 90);
  if (!pos) return null;
  const kind = chooseFloorMonsterKind({
    floor: proceduralMonsterFloor(spec),
    roomType: roomTypeAt(world, pos.x, pos.y),
    floorTags: spec.monsterBiasTags,
    samosborCount: spec.danger,
    allowRare,
    biasKinds: spec.monsterBiasKinds,
    routePressure: routePressureLevel(spec),
  });
  const def = MONSTERS[kind];
  const zoneLevel = world.zones[world.zoneMap[world.idx(pos.x, pos.y)]]?.level ?? spec.danger;
  const hp = Math.round(def.hp * (0.75 + zoneLevel * 0.18));
  const monster: Entity = {
    id: nextId.v++,
    type: EntityType.MONSTER,
    x: pos.x + 0.5,
    y: pos.y + 0.5,
    angle: Math.random() * Math.PI * 2,
    pitch: 0,
    alive: true,
    speed: def.speed * (0.9 + spec.danger * 0.04),
    sprite: monsterSpr(kind),
    hp,
    maxHp: hp,
    monsterKind: kind,
    attackCd: 0,
    ai: { goal: AIGoal.WANDER, tx: pos.x, ty: pos.y, path: [], pi: 0, stuck: 0, timer: 0 },
    rpg: randomRPG(Math.max(1, zoneLevel)),
    phasing: kind === MonsterKind.SPIRIT,
  };
  applyMonsterVariant(monster, proceduralMonsterFloor(spec), spec.danger >= 4);
  entities.push(monster);
  return kind;
}

function spawnMonsters(world: World, entities: Entity[], nextId: { v: number }, spec: ProceduralFloorSpec, sx: number, sy: number): void {
  const count = entitySpawnSlots(entities, EntityType.MONSTER, proceduralMonsterCount(spec));
  const rareLimit = rareMonsterLimit(spec);
  let rareSpawned = 0;
  for (let i = 0; i < count; i++) {
    const allowRare = rareSpawned < rareLimit && chance(rareMonsterChance(spec));
    const kind = spawnMonster(world, entities, nextId, spec, sx, sy, allowRare);
    if (kind !== null && getMonsterEcology(kind)?.rare) rareSpawned++;
  }
}

function roomCenter(room: Room): { x: number; y: number } {
  return {
    x: room.x + Math.floor(room.w / 2),
    y: room.y + Math.floor(room.h / 2),
  };
}

function chooseSmogSourceRoom(rooms: Room[]): Room | null {
  const preferred = rooms.filter(room => (
    room.id !== 0 &&
    (room.type === RoomType.PRODUCTION ||
      room.type === RoomType.SMOKING ||
      room.type === RoomType.STORAGE ||
      room.type === RoomType.CORRIDOR ||
      room.type === RoomType.COMMON)
  ));
  if (preferred.length > 0) return pick(preferred);
  return rooms.length > 1 ? pick(rooms.slice(1)) : rooms[0] ?? null;
}

function nearbySmogRooms(world: World, rooms: Room[], source: Room, spec: ProceduralFloorSpec): Room[] {
  const sourceCenter = roomCenter(source);
  const limit = Math.min(rooms.length, 5 + spec.danger * 2);
  const radius = 74 + spec.danger * 18;
  const weighted = rooms
    .filter(room => room.id !== source.id && room.id !== 0)
    .map(room => {
      const c = roomCenter(room);
      let priority = world.dist2(sourceCenter.x, sourceCenter.y, c.x, c.y);
      if (room.type === RoomType.CORRIDOR || room.type === RoomType.SMOKING) priority *= 0.55;
      if (room.type === RoomType.PRODUCTION || room.type === RoomType.STORAGE) priority *= 0.75;
      return { room, priority };
    })
    .filter(item => item.priority <= radius * radius || item.room.type === RoomType.CORRIDOR)
    .sort((a, b) => a.priority - b.priority);
  const out = [source];
  for (const item of weighted) {
    if (out.length >= limit) break;
    out.push(item.room);
  }
  return out;
}

function addSmogCell(world: World, set: Set<number>, x: number, y: number, density: number): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] !== Cell.FLOOR && world.cells[ci] !== Cell.WATER) return;
  if (world.features[ci] === Feature.LIFT_BUTTON) return;
  world.fog[ci] = Math.max(world.fog[ci], Math.max(0, Math.min(235, density)));
  set.add(ci);
}

function fillSmogRoom(world: World, set: Set<number>, room: Room, source: Room, spec: ProceduralFloorSpec): void {
  const sourceRoom = room.id === source.id;
  const keepOpen = sourceRoom ? 0.96 : room.type === RoomType.CORRIDOR ? 0.74 : 0.82;
  for (let dy = 0; dy < room.h; dy++) {
    for (let dx = 0; dx < room.w; dx++) {
      if (!sourceRoom && Math.random() > keepOpen) continue;
      const edge = dx === 0 || dy === 0 || dx === room.w - 1 || dy === room.h - 1;
      const base = sourceRoom ? irng(150, 225) : irng(82, 176);
      const density = edge ? Math.floor(base * 0.62) : base + spec.danger * 4;
      addSmogCell(world, set, room.x + dx, room.y + dy, density);
    }
  }
}

function seedSmogCorridorPockets(world: World, set: Set<number>, source: Room, spec: ProceduralFloorSpec): void {
  const c = roomCenter(source);
  const radius = 48 + spec.danger * 18;
  const samples = 900 + spec.danger * 260;
  for (let i = 0; i < samples; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.sqrt(Math.random()) * radius;
    const x = Math.floor(c.x + Math.cos(angle) * dist);
    const y = Math.floor(c.y + Math.sin(angle) * dist);
    const ci = world.idx(x, y);
    if (world.roomMap[ci] >= 0 && world.roomMap[ci] !== source.id) continue;
    addSmogCell(world, set, x, y, irng(58, 158));
    if (chance(0.08)) world.stamp(x, y, 0.5, 0.5, 0.38, 0.36, spec.seed + i, 86, 76, 52, false);
  }
}

function placeSmogSource(world: World, source: Room, spec: ProceduralFloorSpec, set: Set<number>): { x: number; y: number } {
  const pos = randomRoomCell(source);
  const ci = world.idx(pos.x, pos.y);
  world.features[ci] = Feature.APPARATUS;
  world.anomalySmogSource = ci;
  world.anomalySmogHandled = false;
  addSmogCell(world, set, pos.x, pos.y, 235);
  for (let dy = -3; dy <= 3; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      if (dx * dx + dy * dy > 10) continue;
      addSmogCell(world, set, pos.x + dx, pos.y + dy, irng(176, 235));
    }
  }
  world.stamp(pos.x, pos.y, 0.5, 0.5, 0.72, 0.92, spec.seed ^ 0x51f00d, 92, 76, 44, false);
  return pos;
}

function spawnSmogLooter(world: World, room: Room, entities: Entity[], nextId: { v: number }, spec: ProceduralFloorSpec): void {
  if (!canSpawnEntityType(entities, EntityType.NPC)) return;
  const pos = randomRoomCell(room);
  const ci = world.idx(pos.x, pos.y);
  const zoneLevel = world.zones[world.zoneMap[ci]]?.level ?? spec.danger;
  const rpg = randomRPG(gaussianLevel(zoneLevel, 2));
  const maxHp = getMaxHp(rpg);
  const nm = randomName(Faction.WILD);
  const weapon = chance(0.55) ? 'pipe' : 'knife';
  entities.push({
    id: nextId.v++,
    type: EntityType.NPC,
    x: pos.x + 0.5,
    y: pos.y + 0.5,
    angle: Math.random() * Math.PI * 2,
    pitch: 0,
    alive: true,
    speed: 1.15,
    sprite: chance(0.45) ? Occupation.ALCOHOLIC : Occupation.TRAVELER,
    name: nm.name,
    isFemale: nm.female,
    needs: freshNeeds(),
    hp: maxHp,
    maxHp,
    money: irng(12, 55 + spec.danger * 22),
    ai: { goal: AIGoal.WANDER, tx: pos.x, ty: pos.y, path: [], pi: 0, stuck: 0, timer: 0 },
    faction: Faction.WILD,
    occupation: Occupation.TRAVELER,
    isTraveler: true,
    questId: -1,
    rpg,
    inventory: [
      { defId: weapon, count: 1 },
      { defId: chance(0.55) ? 'cigs' : 'filter_receipt', count: 1 },
      { defId: chance(0.3) ? 'forged_quarantine_clearance' : 'grey_briquette', count: 1 },
    ],
    weapon,
  });
}

function spawnSmogMonster(world: World, room: Room, entities: Entity[], nextId: { v: number }, spec: ProceduralFloorSpec): void {
  if (!canSpawnEntityType(entities, EntityType.MONSTER)) return;
  const pos = randomRoomCell(room);
  const kind = pick([MonsterKind.POLZUN, MonsterKind.TVAR, MonsterKind.NELYUD, MonsterKind.SHADOW]);
  const def = MONSTERS[kind];
  const zoneLevel = world.zones[world.zoneMap[world.idx(pos.x, pos.y)]]?.level ?? spec.danger;
  const hp = Math.round(def.hp * (0.78 + zoneLevel * 0.16));
  const monster: Entity = {
    id: nextId.v++,
    type: EntityType.MONSTER,
    x: pos.x + 0.5,
    y: pos.y + 0.5,
    angle: Math.random() * Math.PI * 2,
    pitch: 0,
    alive: true,
    speed: def.speed * (0.95 + spec.danger * 0.035),
    sprite: monsterSpr(kind),
    hp,
    maxHp: hp,
    monsterKind: kind,
    attackCd: 0,
    ai: { goal: AIGoal.WANDER, tx: pos.x, ty: pos.y, path: [], pi: 0, stuck: 0, timer: 0 },
    rpg: randomRPG(Math.max(1, zoneLevel)),
    phasing: kind === MonsterKind.SPIRIT,
  };
  applyMonsterVariant(monster, spec.baseFloor, true);
  entities.push(monster);
}

function applyWaterAndMachines(world: World, spec: ProceduralFloorSpec): void {
  if (spec.geometryId !== 'collectors') return;
  for (let i = 0; i < 9000; i++) {
    const x = irng(4, W - 5);
    const y = irng(4, W - 5);
    const ci = world.idx(x, y);
    if (world.cells[ci] !== Cell.FLOOR || world.roomMap[ci] >= 0) continue;
    if (!chance(0.32)) continue;
    world.cells[ci] = Cell.WATER;
    world.floorTex[ci] = Tex.F_WATER;
  }
}

function roofDuctFeature(step: number, line: number): Feature {
  const mode = (step + line * 5) % 5;
  if (mode === 0) return Feature.LAMP;
  if (mode === 1) return Feature.SCREEN;
  if (mode === 2) return Feature.APPARATUS;
  if (mode === 3) return Feature.MACHINE;
  return Feature.SHELF;
}

function carveRoofDuctCell(world: World, x: number, y: number): boolean {
  const ci = world.idx(x, y);
  if (world.cells[ci] === Cell.LIFT || world.hermoWall[ci] || world.aptMask[ci]) return false;
  world.cells[ci] = Cell.FLOOR;
  world.floorTex[ci] = Tex.F_CONCRETE;
  world.wallTex[ci] = Tex.PIPE;
  world.features[ci] = Feature.NONE;
  world.roomMap[ci] = -1;
  world.fog[ci] = Math.max(world.fog[ci], 8);
  return true;
}

function decorateRoofDuctEdge(world: World, x: number, y: number, feature: Feature, spec: ProceduralFloorSpec, step: number): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] !== Cell.FLOOR || world.features[ci] !== Feature.NONE) return;
  world.features[ci] = feature;
  world.stamp(x, y, 0.5, 0.5, 0.24, 0.46, spec.seed ^ (step * 41), 88, 100, 104, false);
}

function carveRoofDuctSegment(
  world: World,
  spec: ProceduralFloorSpec,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  horizontal: boolean,
  line: number,
  stepBase: number,
): number {
  const delta = horizontal ? world.delta(ax, bx) : world.delta(ay, by);
  const stepDir = delta >= 0 ? 1 : -1;
  const steps = Math.abs(delta);
  let x = world.wrap(ax);
  let y = world.wrap(ay);

  for (let s = 0; s <= steps; s++) {
    for (let side = 0; side <= 1; side++) {
      const cx = horizontal ? x : x + side;
      const cy = horizontal ? y + side : y;
      carveRoofDuctCell(world, cx, cy);
    }

    const absoluteStep = stepBase + s;
    if (absoluteStep % 23 === 0) {
      const side = ((absoluteStep / 23 + line) & 1) === 0 ? -1 : 2;
      const fx = horizontal ? x : x + side;
      const fy = horizontal ? y + side : y;
      decorateRoofDuctEdge(world, fx, fy, roofDuctFeature(absoluteStep, line), spec, absoluteStep);
    }
    if (absoluteStep % 43 === 0) {
      world.stamp(x, y, 0.5, 0.5, 0.18, 0.34, spec.seed + absoluteStep * 59 + line * 7, 210, 220, 218, true);
    }

    if (s < steps) {
      if (horizontal) x = world.wrap(x + stepDir);
      else y = world.wrap(y + stepDir);
    }
  }

  return stepBase + steps + 1;
}

function chooseRoofDuctTargets(world: World, rooms: Room[], sx: number, sy: number, spec: ProceduralFloorSpec): Room[] {
  const candidates = rooms
    .filter(room => room.id !== 0 && room.type !== RoomType.BATHROOM && room.w >= 5 && room.h >= 5)
    .map(room => ({ room, d2: world.dist2(sx, sy, roomCenter(room).x, roomCenter(room).y) }))
    .filter(item => item.d2 > 50 * 50)
    .sort((a, b) => b.d2 - a.d2);
  const window = candidates.slice(0, Math.min(candidates.length, 14));
  const targetCount = Math.min(window.length, 2 + Math.floor(spec.danger / 2));
  const picked: Room[] = [];
  for (let i = 0; i < window.length && picked.length < targetCount; i++) {
    const index = (spec.seed + i * 5) % window.length;
    const room = window[index].room;
    if (!picked.includes(room)) picked.push(room);
  }
  return picked;
}

function applyAtticWeatherworks(world: World, rooms: Room[], spec: ProceduralFloorSpec, spawnX: number, spawnY: number): void {
  if (spec.geometryId !== 'attic_weatherworks') return;
  const sx = Math.floor(spawnX);
  const sy = Math.floor(spawnY);
  const targets = chooseRoofDuctTargets(world, rooms, sx, sy, spec);

  for (let i = 0; i < targets.length; i++) {
    const end = roomCenter(targets[i]);
    const horizontalFirst = ((spec.seed >> (i % 12)) & 1) === 0;
    let step = i * 701;
    if (horizontalFirst) {
      step = carveRoofDuctSegment(world, spec, sx, sy, end.x, sy, true, i, step);
      carveRoofDuctSegment(world, spec, end.x, sy, end.x, end.y, false, i, step);
    } else {
      step = carveRoofDuctSegment(world, spec, sx, sy, sx, end.y, false, i, step);
      carveRoofDuctSegment(world, spec, sx, end.y, end.x, end.y, true, i, step);
    }
    targets[i].name = `${targets[i].name} у шумной тяги`;
  }
  world.markFogDirty();
}

function applyArchiveWarrens(world: World, rooms: Room[], spec: ProceduralFloorSpec): void {
  if (spec.geometryId !== 'archive_warrens') return;
  const candidates = rooms
    .filter(room => room.type === RoomType.STORAGE || room.type === RoomType.OFFICE || room.type === RoomType.COMMON)
    .sort((a, b) => (b.w * b.h) - (a.w * a.h));
  const limit = Math.min(candidates.length, 10 + spec.danger * 3);

  for (let i = 0; i < limit; i++) {
    const room = candidates[i];
    room.name = room.type === RoomType.OFFICE
      ? `Опись ${room.id}: столы доступа`
      : `Архивная нора ${room.id}`;
    room.floorTex = room.type === RoomType.OFFICE ? Tex.F_GREEN_CARPET : Tex.F_PARQUET;
    for (let dy = 1; dy < room.h - 1; dy++) {
      for (let dx = 1; dx < room.w - 1; dx++) {
        if (dy % 3 === 0 && dx % 4 !== 0) continue;
        if (dy % 3 !== 0 && dx % 5 !== 0) continue;
        const ci = world.idx(room.x + dx, room.y + dy);
        if (world.cells[ci] !== Cell.FLOOR || world.roomMap[ci] !== room.id || world.features[ci] !== Feature.NONE) continue;
        world.features[ci] = room.type === RoomType.OFFICE && chance(0.35) ? Feature.DESK : Feature.SHELF;
        world.floorTex[ci] = room.floorTex;
      }
    }
    const center = roomCenter(room);
    if (i % 3 === 0) world.stamp(center.x, center.y, 0.5, 0.5, 0.32, 0.58, spec.seed + i * 113, 210, 198, 168, false);
  }
}

function applyCommunalKnots(world: World, rooms: Room[], spec: ProceduralFloorSpec): void {
  if (spec.geometryId !== 'communal_knots') return;
  const hubs = rooms
    .filter(room => room.type === RoomType.COMMON || room.type === RoomType.KITCHEN || room.type === RoomType.SMOKING || room.type === RoomType.LIVING)
    .sort((a, b) => (b.w * b.h) - (a.w * a.h));
  const count = Math.min(hubs.length, 6 + spec.danger * 2);

  for (let i = 0; i < count; i++) {
    const room = hubs[i];
    room.name = room.type === RoomType.KITCHEN
      ? `Общая кухня ${room.id}`
      : room.type === RoomType.SMOKING
        ? `Очередь у курилки ${room.id}`
        : `Коммунальный узел ${room.id}`;
    placeRoomFeature(world, room, Feature.TABLE, Math.floor(room.w / 2), Math.floor(room.h / 2));
    if (room.type === RoomType.KITCHEN || room.type === RoomType.COMMON) {
      placeRoomFeature(world, room, Feature.STOVE, 1, 1);
      placeRoomFeature(world, room, Feature.SINK, room.w - 2, 1);
    }
    if (room.type === RoomType.LIVING || room.type === RoomType.COMMON) {
      placeRoomFeature(world, room, Feature.BED, 1, room.h - 2);
      placeRoomFeature(world, room, Feature.CHAIR, room.w - 2, room.h - 2);
    }
    const center = roomCenter(room);
    world.stamp(center.x, center.y, 0.5, 0.5, 0.28, 0.5, spec.seed + i * 211, 120, 92, 70, false);
  }
}

function carveSumpCell(world: World, x: number, y: number, water: boolean, spec: ProceduralFloorSpec): boolean {
  const ci = world.idx(x, y);
  if (world.cells[ci] === Cell.LIFT || world.hermoWall[ci] || world.aptMask[ci]) return false;
  world.cells[ci] = water ? Cell.WATER : Cell.FLOOR;
  world.floorTex[ci] = water ? Tex.F_WATER : Tex.F_CONCRETE;
  world.wallTex[ci] = Tex.PIPE;
  world.features[ci] = Feature.NONE;
  world.roomMap[ci] = -1;
  if (water && ((x * 13 + y * 17 + spec.seed) & 31) === 0) {
    world.stamp(x, y, 0.5, 0.5, 0.32, 0.44, spec.seed ^ (x * 31 + y * 7), 30, 54, 48, false);
  }
  return true;
}

function decorateSumpEdge(world: World, x: number, y: number, feature: Feature, spec: ProceduralFloorSpec, step: number): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] !== Cell.FLOOR || world.features[ci] !== Feature.NONE) return;
  world.features[ci] = feature;
  if (feature === Feature.MACHINE || feature === Feature.APPARATUS) {
    world.stamp(x, y, 0.5, 0.5, 0.42, 0.5, spec.seed + step * 97, 76, 96, 90, false);
  }
}

function carveSumpBand(world: World, spec: ProceduralFloorSpec, line: number, horizontal: boolean, coord: number): void {
  const start = 54 + line * 17;
  const end = W - 55 - line * 19;
  for (let p = start; p <= end; p++) {
    for (let side = -4; side <= 4; side++) {
      const x = horizontal ? p : coord + side;
      const y = horizontal ? coord + side : p;
      const dryLane = Math.abs(side) <= 1 || ((p + line * 13) % 47 === 0 && Math.abs(side) <= 3);
      carveSumpCell(world, x, y, !dryLane, spec);
    }
    if ((p + line * 11) % 31 === 0) {
      const side = ((p + line) & 1) === 0 ? -5 : 5;
      const fx = horizontal ? p : coord + side;
      const fy = horizontal ? coord + side : p;
      decorateSumpEdge(world, fx, fy, (p & 1) === 0 ? Feature.LAMP : Feature.MACHINE, spec, p + line * 1000);
    }
  }
}

function applySumpCauseways(world: World, rooms: Room[], spec: ProceduralFloorSpec, spawnX: number, spawnY: number): void {
  if (spec.geometryId !== 'sump_causeways') return;
  const anchors = rooms
    .filter(room => room.type === RoomType.CORRIDOR || room.type === RoomType.PRODUCTION || room.type === RoomType.COMMON)
    .filter(room => {
      const c = roomCenter(room);
      return world.dist2(spawnX, spawnY, c.x, c.y) > 48 * 48;
    });
  const sourceRooms = anchors.length > 0 ? anchors : rooms;
  if (sourceRooms.length === 0) return;
  const lineCount = Math.min(4, 2 + Math.floor(spec.danger / 2));

  for (let i = 0; i < lineCount; i++) {
    const room = sourceRooms[(spec.seed + i * 17) % sourceRooms.length];
    const c = roomCenter(room);
    const horizontal = i % 2 === 0;
    const coord = world.wrap(horizontal ? c.y + (i - 1) * 23 : c.x + (i - 1) * 23);
    carveSumpBand(world, spec, i, horizontal, coord);
    room.name = `${room.name} у черной воды`;
  }
}

function serviceSpineFeature(step: number, line: number): Feature {
  const mode = (step + line * 3) % 4;
  if (mode === 0) return Feature.LAMP;
  if (mode === 1) return Feature.SCREEN;
  if (mode === 2) return Feature.APPARATUS;
  return Feature.MACHINE;
}

function carveServiceSpineCell(world: World, x: number, y: number): boolean {
  const ci = world.idx(x, y);
  if (world.cells[ci] === Cell.LIFT || world.hermoWall[ci] || world.aptMask[ci]) return false;
  world.cells[ci] = Cell.FLOOR;
  world.floorTex[ci] = Tex.F_CONCRETE;
  world.wallTex[ci] = Tex.METAL;
  world.features[ci] = Feature.NONE;
  world.roomMap[ci] = -1;
  return true;
}

function decorateServiceSpineEdge(world: World, x: number, y: number, feature: Feature, spec: ProceduralFloorSpec, step: number): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] !== Cell.FLOOR || world.features[ci] !== Feature.NONE) return;
  world.features[ci] = feature;
  if (feature === Feature.APPARATUS || feature === Feature.MACHINE) {
    world.stamp(x, y, 0.5, 0.5, 0.34, 0.52, spec.seed + step * 29, 72, 88, 86, false);
  }
}

function carveServiceSpineSegment(
  world: World,
  spec: ProceduralFloorSpec,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  horizontal: boolean,
  line: number,
  stepBase: number,
): number {
  const delta = horizontal ? world.delta(ax, bx) : world.delta(ay, by);
  const stepDir = delta >= 0 ? 1 : -1;
  const steps = Math.abs(delta);
  let x = world.wrap(ax);
  let y = world.wrap(ay);

  for (let s = 0; s <= steps; s++) {
    for (let side = -1; side <= 1; side++) {
      const cx = horizontal ? x : x + side;
      const cy = horizontal ? y + side : y;
      carveServiceSpineCell(world, cx, cy);
    }

    const absoluteStep = stepBase + s;
    if (absoluteStep % 19 === 0) {
      const side = ((absoluteStep / 19 + line) & 1) === 0 ? -2 : 2;
      const fx = horizontal ? x : x + side;
      const fy = horizontal ? y + side : y;
      decorateServiceSpineEdge(world, fx, fy, serviceSpineFeature(absoluteStep, line), spec, absoluteStep);
    }
    if (absoluteStep % 37 === 0) {
      world.stamp(x, y, 0.5, 0.5, 0.28, 0.36, spec.seed ^ (absoluteStep * 131 + line * 17), 58, 68, 65, false);
    }

    if (s < steps) {
      if (horizontal) x = world.wrap(x + stepDir);
      else y = world.wrap(y + stepDir);
    }
  }

  return stepBase + steps + 1;
}

function chooseServiceSpineTargets(world: World, rooms: Room[], sx: number, sy: number, spec: ProceduralFloorSpec): Room[] {
  const candidates = rooms
    .filter(room => room.id !== 0 && room.type !== RoomType.BATHROOM && room.w >= 5 && room.h >= 5)
    .map(room => ({ room, d2: world.dist2(sx, sy, roomCenter(room).x, roomCenter(room).y) }))
    .filter(item => item.d2 > 42 * 42)
    .sort((a, b) => b.d2 - a.d2);
  const window = candidates.slice(0, Math.min(candidates.length, 18));
  const targetCount = Math.min(window.length, 2 + Math.floor(spec.danger / 2));
  const picked: Room[] = [];

  for (let attempt = 0; attempt < targetCount * 10 && picked.length < targetCount; attempt++) {
    const candidate = pick(window).room;
    if (picked.includes(candidate)) continue;
    const c = roomCenter(candidate);
    const tooClose = picked.some(room => world.dist2(c.x, c.y, roomCenter(room).x, roomCenter(room).y) < 80 * 80);
    if (tooClose && attempt < targetCount * 6) continue;
    picked.push(candidate);
  }

  for (const item of window) {
    if (picked.length >= targetCount) break;
    if (!picked.includes(item.room)) picked.push(item.room);
  }
  return picked;
}

function applyServiceSpines(world: World, rooms: Room[], spec: ProceduralFloorSpec, spawnX: number, spawnY: number): void {
  if (spec.geometryId !== 'service_spines') return;
  const sx = Math.floor(spawnX);
  const sy = Math.floor(spawnY);
  const targets = chooseServiceSpineTargets(world, rooms, sx, sy, spec);

  for (let i = 0; i < targets.length; i++) {
    const end = roomCenter(targets[i]);
    const horizontalFirst = ((spec.seed + i) & 1) === 0;
    let step = i * 997;
    if (horizontalFirst) {
      step = carveServiceSpineSegment(world, spec, sx, sy, end.x, sy, true, i, step);
      carveServiceSpineSegment(world, spec, end.x, sy, end.x, end.y, false, i, step);
    } else {
      step = carveServiceSpineSegment(world, spec, sx, sy, sx, end.y, false, i, step);
      carveServiceSpineSegment(world, spec, sx, end.y, end.x, end.y, true, i, step);
    }
    targets[i].name = `${targets[i].name} у сервисного штрека`;
  }
}

function applySmog(
  world: World,
  rooms: Room[],
  entities: Entity[],
  nextId: { v: number },
  spec: ProceduralFloorSpec,
  allowNpcs: boolean,
): void {
  if (spec.anomalyId === 'smog') {
    const source = chooseSmogSourceRoom(rooms);
    if (!source) return;
    const set = new Set<number>();
    const affectedRooms = nearbySmogRooms(world, rooms, source, spec);
    for (const room of affectedRooms) {
      fillSmogRoom(world, set, room, source, spec);
      const center = roomCenter(room);
      const zid = world.zoneMap[world.idx(Math.floor(center.x), Math.floor(center.y))];
      const zone = world.zones[zid];
      if (zone) zone.fogged = true;
    }
    seedSmogCorridorPockets(world, set, source, spec);
    const sourcePos = placeSmogSource(world, source, spec, set);
    dropItem(entities, nextId, sourcePos.x + 1, sourcePos.y, 'valve_tag', 1);
    dropItem(entities, nextId, sourcePos.x - 1, sourcePos.y, chance(0.5) ? 'filter_receipt' : 'gasmask_filter', 1);
    const pressureRooms = affectedRooms.length > 0 ? affectedRooms : [source];
    if (allowNpcs) {
      for (let i = 0; i < Math.min(5, 2 + spec.danger); i++) spawnSmogLooter(world, pick(pressureRooms), entities, nextId, spec);
    }
    for (let i = 0; i < 2 + spec.danger; i++) spawnSmogMonster(world, pick(pressureRooms), entities, nextId, spec);
    world.anomalySmogCells = [...set];
    world.markFogDirty();
    return;
  }

  if (spec.anomalyId !== 'samosbor_seed') return;
  const amount = 16000;
  for (let i = 0; i < amount; i++) {
    const x = irng(0, W - 1);
    const y = irng(0, W - 1);
    const ci = world.idx(x, y);
    if (world.cells[ci] !== Cell.FLOOR && world.cells[ci] !== Cell.WATER) continue;
    world.fog[ci] = Math.max(world.fog[ci], irng(45, 120));
  }
  world.markFogDirty();
}

function applySamosborSeed(world: World, spec: ProceduralFloorSpec): void {
  if (spec.anomalyId !== 'samosbor_seed') return;
  for (const zone of world.zones) {
    if (chance(0.22 + spec.danger * 0.04)) zone.faction = ZoneFaction.SAMOSBOR;
  }
  for (let i = 0; i < 1400; i++) {
    const pos = randomFloorCell(world, W / 2, W / 2, 0);
    if (!pos) continue;
    const ci = world.idx(pos.x, pos.y);
    world.floorTex[ci] = chance(0.5) ? Tex.F_GUT : Tex.F_MEAT;
    if (chance(0.2)) world.stamp(pos.x, pos.y, 0.5, 0.5, 0.45, 0.8, spec.seed + i, 120, 15, 28, false);
  }
}

function applyMushrooms(world: World, rooms: Room[], entities: Entity[], nextId: { v: number }, spec: ProceduralFloorSpec): void {
  if (spec.anomalyId !== 'mushroom_mycelium') return;
  const roomsToSeed = Math.min(34, rooms.length);
  for (let i = 0; i < roomsToSeed; i++) {
    const room = pick(rooms);
    const pos = randomRoomCell(room);
    const ci = world.idx(pos.x, pos.y);
    world.features[ci] = Feature.APPARATUS;
    dropItem(entities, nextId, pos.x, pos.y, chance(0.7) ? 'mushroom_mass' : 'infected_mushroom', irng(1, 3));
    world.stamp(pos.x, pos.y, 0.5, 0.5, 0.5, 0.65, spec.seed + i, 60, 130, 70, false);
  }
}

function applyCarnivorousFungusRooms(world: World, rooms: Room[], entities: Entity[], nextId: { v: number }, spec: ProceduralFloorSpec): void {
  if (spec.anomalyId !== 'mushroom_mycelium') return;
  const candidates = rooms.filter(room => room.type !== RoomType.CORRIDOR && room.w >= 12 && room.h >= 10);
  if (candidates.length === 0) return;

  const count = Math.min(spec.danger >= 4 ? 2 : 1, candidates.length);
  const used = new Set<number>();
  for (let i = 0; i < count; i++) {
    let room = pick(candidates);
    for (let guard = 0; guard < 12 && used.has(room.id); guard++) room = pick(candidates);
    if (used.has(room.id)) continue;
    used.add(room.id);
    decorateCarnivorousFungusRoom(world, entities, nextId, room, {
      seed: spec.seed + 1130 + i * 17,
      withCounterplayDrops: i === 0,
      withGuardMonster: spec.danger >= 3,
    });
  }
}

const HLADON_ROOM_PREFIX = 'Хладон:';
const HLADON_KIT_ITEMS = ['boiler_water', 'asbestos_cord', 'sealant_tube', 'cloth_roll'] as const;

function stampHladonFrost(world: World, room: Room, seedBase: number, danger: number): void {
  room.name = `${HLADON_ROOM_PREFIX} холодный карман ${room.id} граница ${danger}`;
  room.wallTex = Tex.TILE_W;
  room.floorTex = Tex.F_TILE;

  for (let dy = 0; dy < room.h; dy++) {
    for (let dx = 0; dx < room.w; dx++) {
      const x = world.wrap(room.x + dx);
      const y = world.wrap(room.y + dy);
      const ci = world.idx(x, y);
      if (world.cells[ci] !== Cell.FLOOR && world.cells[ci] !== Cell.WATER) continue;
      world.floorTex[ci] = Tex.F_TILE;
      world.fog[ci] = Math.max(world.fog[ci], 18 + danger * 5);
      const feature = world.features[ci] as Feature;
      if (feature === Feature.LAMP || feature === Feature.CANDLE || feature === Feature.STOVE || feature === Feature.MACHINE) {
        world.features[ci] = Feature.NONE;
      }
      if ((dx + dy + seedBase) % 5 === 0) {
        world.stamp(x, y, 0.5, 0.5, 0.28, 0.45, seedBase + dx * 37 + dy * 101, 185, 220, 235, false);
      }
    }
  }

  for (let dx = 0; dx < room.w; dx += 2) {
    for (const y of [room.y, room.y + room.h - 1]) {
      world.stamp(room.x + dx, y, 0.5, 0.5, 0.38, 0.75, seedBase + dx * 17 + y, 210, 238, 255, true);
    }
  }
  for (let dy = 0; dy < room.h; dy += 2) {
    for (const x of [room.x, room.x + room.w - 1]) {
      world.stamp(x, room.y + dy, 0.5, 0.5, 0.38, 0.75, seedBase + dy * 23 + x, 210, 238, 255, true);
    }
  }

  const control = roomCell(world, room, Math.floor(room.w / 2), Math.floor(room.h / 2));
  if (control) {
    world.features[world.idx(control.x, control.y)] = Feature.APPARATUS;
    world.stamp(control.x, control.y, 0.5, 0.5, 0.7, 0.5, seedBase + 909, 150, 205, 240, false);
  }
}

function pickHladonRooms(world: World, rooms: Room[], spec: ProceduralFloorSpec, sx: number, sy: number): Room[] {
  const candidates = rooms.filter(room => {
    if (room.type === RoomType.CORRIDOR || room.w < 6 || room.h < 6) return false;
    const c = roomCenter(room);
    return world.dist2(sx, sy, c.x, c.y) > 52 * 52;
  });
  if (candidates.length === 0) return [];

  const target = Math.min(candidates.length, 2 + Math.floor(spec.danger / 2));
  const picked: Room[] = [];
  for (let attempt = 0; attempt < target * 24 && picked.length < target; attempt++) {
    const room = pick(candidates);
    if (picked.includes(room)) continue;
    const c = roomCenter(room);
    const tooClose = picked.some(other => {
      const oc = roomCenter(other);
      return world.dist2(c.x, c.y, oc.x, oc.y) < 36 * 36;
    });
    if (tooClose && attempt < target * 12) continue;
    picked.push(room);
  }
  return picked;
}

function seedHladonCounterplay(world: World, rooms: Room[], coldRooms: Room[], entities: Entity[], nextId: { v: number }, spec: ProceduralFloorSpec): void {
  const warmRooms = rooms.filter(room => (
    !coldRooms.includes(room) &&
    room.type !== RoomType.CORRIDOR &&
    room.w >= 5 &&
    room.h >= 5
  ));
  if (warmRooms.length === 0) return;

  const firstCold = roomCenter(coldRooms[0]);
  let kitRoom = warmRooms[0];
  let best = Infinity;
  for (const room of warmRooms) {
    const c = roomCenter(room);
    const d2 = world.dist2(firstCold.x, firstCold.y, c.x, c.y);
    if (d2 < best) {
      best = d2;
      kitRoom = room;
    }
  }

  kitRoom.name = `${kitRoom.name} теплый запас`;
  const warmSpot = roomCell(world, kitRoom, Math.floor(kitRoom.w / 2), Math.floor(kitRoom.h / 2));
  if (warmSpot) {
    world.features[world.idx(warmSpot.x, warmSpot.y)] = isIndustrialGeometry(spec.geometryId)
      ? Feature.MACHINE
      : Feature.STOVE;
    world.stamp(warmSpot.x, warmSpot.y, 0.5, 0.5, 0.6, 0.38, spec.seed + 7301, 225, 120, 45, false);
  }

  const kitCount = Math.min(HLADON_KIT_ITEMS.length, 2 + Math.floor(spec.danger / 2));
  for (let i = 0; i < kitCount; i++) {
    const pos = randomRoomCell(kitRoom);
    dropItem(entities, nextId, pos.x, pos.y, HLADON_KIT_ITEMS[i], 1);
  }
}

function applyHladon(world: World, rooms: Room[], entities: Entity[], nextId: { v: number }, spec: ProceduralFloorSpec, sx: number, sy: number): void {
  if (spec.anomalyId !== 'hladon') return;
  const coldRooms = pickHladonRooms(world, rooms, spec, sx, sy);
  if (coldRooms.length === 0) return;

  for (let i = 0; i < coldRooms.length; i++) {
    stampHladonFrost(world, coldRooms[i], spec.seed + 9100 + i * 997, spec.danger);
  }
  seedHladonCounterplay(world, rooms, coldRooms, entities, nextId, spec);
  world.markFogDirty();
}

function applyTeleports(world: World, spec: ProceduralFloorSpec): void {
  if (spec.anomalyId !== 'teleport_cells') return;
  const pairs = 4 + spec.danger;
  for (let i = 0; i < pairs; i++) {
    const a = randomFloorCell(world, W / 2, W / 2, 0);
    const b = randomFloorCell(world, a?.x ?? W / 2, a?.y ?? W / 2, 180 * 180);
    if (!a || !b) continue;
    const ai = world.idx(a.x, a.y);
    const bi = world.idx(b.x, b.y);
    world.anomalyTeleports.set(ai, bi);
    world.anomalyTeleports.set(bi, ai);
    world.features[ai] = Feature.SCREEN;
    world.features[bi] = Feature.SCREEN;
    world.floorTex[ai] = Tex.F_VOID;
    world.floorTex[bi] = Tex.F_VOID;
  }
}

function carveRailCenter(world: World, x: number, y: number): boolean {
  const ci = world.idx(x, y);
  if (world.cells[ci] === Cell.LIFT || world.hermoWall[ci] || world.aptMask[ci]) return false;
  world.cells[ci] = Cell.WATER;
  world.floorTex[ci] = Tex.F_WATER;
  world.features[ci] = Feature.NONE;
  world.roomMap[ci] = -1;
  return true;
}

function carveRailBed(world: World, x: number, y: number, horizontal: boolean, spec: ProceduralFloorSpec): boolean {
  let centerOpen = false;
  for (let side = -1; side <= 1; side++) {
    const rx = horizontal ? x : x + side;
    const ry = horizontal ? y + side : y;
    const opened = carveRailCenter(world, rx, ry);
    if (side === 0) centerOpen = opened;
  }
  if (centerOpen && ((x * 17 + y * 31 + spec.seed) & 15) === 0) {
    world.stamp(x, y, 0.5, 0.5, 0.32, 0.5, spec.seed ^ (x * 13 + y * 29), 92, 92, 84, false);
  }
  return centerOpen;
}

function carveRailPlatform(
  world: World,
  platformCells: number[],
  x: number,
  y: number,
  horizontal: boolean,
  side: number,
  spec: ProceduralFloorSpec,
): void {
  for (let along = -12; along <= 12; along++) {
    for (let depth = 2; depth <= 5; depth++) {
      const px = horizontal ? x + along : x + side * depth;
      const py = horizontal ? y + side * depth : y + along;
      const ci = world.idx(px, py);
      if (world.cells[ci] === Cell.LIFT || world.hermoWall[ci] || world.aptMask[ci]) continue;
      world.cells[ci] = Cell.FLOOR;
      world.floorTex[ci] = spec.geometryId === 'admin_pockets' ? Tex.F_MARBLE_TILE : Tex.F_CONCRETE;
      world.roomMap[ci] = -1;
      platformCells.push(ci);
    }
  }

  const screenX = horizontal ? x : x + side * 4;
  const screenY = horizontal ? y + side * 4 : y;
  const screen = world.idx(screenX, screenY);
  if (world.cells[screen] !== Cell.LIFT) world.features[screen] = Feature.SCREEN;
  const lampX = horizontal ? x - 7 : x + side * 4;
  const lampY = horizontal ? y + side * 4 : y - 7;
  const lamp = world.idx(lampX, lampY);
  if (world.cells[lamp] !== Cell.LIFT) world.features[lamp] = Feature.LAMP;

  for (let depth = 5; depth <= 18; depth++) {
    const ax = horizontal ? x : x + side * depth;
    const ay = horizontal ? y + side * depth : y;
    const ci = world.idx(ax, ay);
    if (world.cells[ci] === Cell.LIFT || world.hermoWall[ci] || world.aptMask[ci]) continue;
    world.cells[ci] = Cell.FLOOR;
    world.floorTex[ci] = Tex.F_CONCRETE;
    world.roomMap[ci] = -1;
  }
}

function nearestTrackOffsetByCell(track: RailTrainTrack, ci: number): number {
  const direct = track.cells.indexOf(ci);
  return direct >= 0 ? direct : Math.floor(track.cells.length / 2);
}

function carveProceduralRailLine(
  world: World,
  spec: ProceduralFloorSpec,
  line: number,
  horizontal: boolean,
  coord: number,
): RailTrainTrack | null {
  const cells: number[] = [];
  const platformCells: number[] = [];
  const stationOffsets: number[] = [];
  const start = 70 + line * 11;
  const end = W - 72 - line * 13;
  for (let p = start; p <= end; p++) {
    const x = horizontal ? p : coord;
    const y = horizontal ? coord : p;
    if (carveRailBed(world, x, y, horizontal, spec)) cells.push(world.idx(x, y));
  }
  if (cells.length < 64) return null;

  const stations = [start + 96, Math.floor((start + end) / 2), end - 96];
  for (let i = 0; i < stations.length; i++) {
    const p = Math.max(start + 12, Math.min(end - 12, stations[i]));
    const x = horizontal ? p : coord;
    const y = horizontal ? coord : p;
    const side = ((line + i) & 1) === 0 ? -1 : 1;
    carveRailPlatform(world, platformCells, x, y, horizontal, side, spec);
    stationOffsets.push(nearestTrackOffsetByCell({ id: '', label: '', cells, stationOffsets: [], platformCells: [], loop: true }, world.idx(x, y)));
  }

  return {
    id: `procedural_${spec.key}_rail_${line}`,
    label: line === 0 ? 'Серая линия' : line === 1 ? 'Ржавая линия' : 'Обратная линия',
    cells,
    stationOffsets,
    platformCells,
    loop: true,
  };
}

function chooseRailAnchorRooms(world: World, rooms: Room[], sx: number, sy: number): Room[] {
  const candidates = rooms
    .filter(room => room.type === RoomType.CORRIDOR || room.type === RoomType.PRODUCTION || room.type === RoomType.COMMON)
    .filter(room => {
      const c = roomCenter(room);
      return world.dist2(sx, sy, c.x, c.y) > 42 * 42;
    });
  return candidates.length > 0 ? candidates : rooms;
}

function applyRailTrains(
  world: World,
  rooms: Room[],
  entities: Entity[],
  nextId: { v: number },
  spec: ProceduralFloorSpec,
  sx: number,
  sy: number,
): void {
  if (spec.anomalyId !== 'rail_trains') return;
  const anchors = chooseRailAnchorRooms(world, rooms, sx, sy);
  if (anchors.length === 0) return;
  const lineCount = isIndustrialGeometry(spec.geometryId)
    ? Math.min(3, 1 + Math.floor(spec.danger / 2))
    : 1;
  for (let i = 0; i < lineCount; i++) {
    const room = anchors[(spec.seed + i * 7) % anchors.length];
    const center = roomCenter(room);
    const horizontal = i % 2 === 0;
    const coord = world.wrap(horizontal ? center.y + (i - 1) * 18 : center.x + (i - 1) * 18);
    const track = carveProceduralRailLine(world, spec, i, horizontal, coord);
    if (!track) continue;
    addRailTrainRoute(world, entities, nextId, track, {
      id: `${track.id}_train`,
      label: `${track.label} ${spec.ordinal}`,
      speed: 3.3 + spec.danger * 0.45 + i * 0.35,
      length: Math.min(16, 8 + spec.danger + i * 2),
      initialOffset: track.stationOffsets[0],
      stopSeconds: 3.5,
      direction: i % 2 === 0 ? 1 : -1,
    });
  }
}

function roomCell(world: World, room: Room, dx: number, dy: number): { x: number; y: number } | null {
  const x = world.wrap(room.x + Math.max(1, Math.min(room.w - 2, dx)));
  const y = world.wrap(room.y + Math.max(1, Math.min(room.h - 2, dy)));
  const ci = world.idx(x, y);
  if (world.cells[ci] !== Cell.FLOOR || world.roomMap[ci] !== room.id) return null;
  return { x, y };
}

function placeRoomFeature(world: World, room: Room, feature: Feature, dx: number, dy: number): { x: number; y: number } | null {
  const pos = roomCell(world, room, dx, dy);
  if (!pos) return null;
  world.features[world.idx(pos.x, pos.y)] = feature;
  return pos;
}

function pressureCueProfile(floor: FloorLevel, spec: ProceduralFloorSpec): {
  label: string;
  hint: string;
  targetName: string;
  color: string;
  heardText: string;
  followedText: string;
  ignoredText: string;
} {
  if (spec.anomalyId === 'hladon') {
    return {
      label: 'холодный стык',
      hint: 'иней шуршит в сторону хищного кармана',
      targetName: 'холодный карман с тварями',
      color: '#9df',
      heardText: 'Вентиляция хрустит инеем. HUD ловит холодный ход, где лучше держать дистанцию.',
      followedText: 'Холодный след вывел к карману. Твари здесь слышны раньше, чем видны.',
      ignoredText: 'Иней остался за спиной. Холодный карман пока ждет без свидетелей.',
    };
  }
  if (spec.anomalyId === 'samosbor_seed') {
    return {
      label: 'сиренный налет',
      hint: 'сирена ведет к свежей мясной давке',
      targetName: 'самосборный карман',
      color: '#f79',
      heardText: 'В стене щелкает старая сирена. Маршрут к давке лучше считать заранее.',
      followedText: 'Сиренный след вывел к мясной давке. Здесь решает отход, а не лишний выстрел.',
      ignoredText: 'Сиренный след затих позади. Давка осталась на чужом маршруте.',
    };
  }
  if (spec.anomalyId === 'zombie_apocalypse') {
    return {
      label: 'очаг ноль',
      hint: 'толпа шумит вокруг первого мертвяка',
      targetName: 'очаг заражения',
      color: '#9f6',
      heardText: 'За стеной толпа говорит слишком ровно. Один голос уже не дышит.',
      followedText: 'Шум вывел к очагу. Здесь решение простое: изолировать, стрелять или уходить.',
      ignoredText: 'Толпа осталась за стеной. Очаг ноль получил еще минуту.',
    };
  }
  if (floor === FloorLevel.MINISTRY) {
    return {
      label: 'шорох папок',
      hint: 'бумаги ведут к живой канцелярии',
      targetName: 'опасная канцелярия',
      color: '#bdc7ff',
      heardText: 'За стеной шуршат папки. По звуку ясно: впереди не очередь, а охота на документы.',
      followedText: 'Шорох папок вывел к живой канцелярии. Укрытия здесь важнее прямой линии.',
      ignoredText: 'Папки шуршат дальше без вас. Бумажная угроза осталась в стороне.',
    };
  }
  if (floor === FloorLevel.MAINTENANCE) {
    return {
      label: 'трубный стук',
      hint: 'трубы считают мокрый обход',
      targetName: 'давящий трубный проход',
      color: '#8cf',
      heardText: 'Трубы простукивают обход. Впереди слышны вода, металл и короткая засада.',
      followedText: 'Трубный стук вывел к давящему проходу. Сухой угол здесь дороже патрона.',
      ignoredText: 'Трубный стук ушел в бетон. Засада осталась шуметь в стороне.',
    };
  }
  if (floor === FloorLevel.HELL) {
    return {
      label: 'мясной зов',
      hint: 'стены дышат в сторону плотного боя',
      targetName: 'мясной проход',
      color: '#f87',
      heardText: 'Стена дышит теплым ритмом. Впереди плотный бой, но не обязательный.',
      followedText: 'Мясной зов вывел к проходу. Отступление здесь нужно держать открытым.',
      ignoredText: 'Мясной зов стих за спиной. Проход остался кормить тишину.',
    };
  }
  if (floor === FloorLevel.VOID) {
    return {
      label: 'пустой тон',
      hint: 'тишина показывает опасную прямую',
      targetName: 'пустотная линия',
      color: '#8fdbbd',
      heardText: 'Тишина взяла ноту. HUD отмечает прямую, где лучше не стоять открыто.',
      followedText: 'Пустой тон вывел к линии огня. Стена нужна ближе, чем цель.',
      ignoredText: 'Пустой тон пропал. Опасная прямая осталась вне маршрута.',
    };
  }
  return {
    label: 'дворовый шорох',
    hint: 'стены ведут к шумной комнате',
    targetName: 'шумная комната',
    color: '#fc9',
    heardText: 'В стенах идет соседский шорох. Это не толпа, а место, где лучше выбрать угол.',
    followedText: 'Шорох вывел к шумной комнате. Решайте: обойти, зачистить или быстро забрать лут.',
    ignoredText: 'Соседский шорох остался позади. Комната подождет другой вылазки.',
  };
}

function choosePressureTargetRoom(world: World, rooms: Room[], spec: ProceduralFloorSpec, sx: number, sy: number): Room | null {
  const preferredTypes = isIndustrialGeometry(spec.geometryId)
    ? [RoomType.PRODUCTION, RoomType.STORAGE, RoomType.CORRIDOR, RoomType.COMMON]
    : spec.geometryId === 'admin_pockets' || spec.geometryId === 'archive_warrens'
      ? [RoomType.OFFICE, RoomType.STORAGE, RoomType.CORRIDOR, RoomType.COMMON]
      : [RoomType.COMMON, RoomType.STORAGE, RoomType.CORRIDOR, RoomType.LIVING];
  let best: Room | null = null;
  let bestScore = -Infinity;
  for (const room of rooms) {
    if (room.id === 0 || room.w < 4 || room.h < 4) continue;
    const c = roomCenter(room);
    const d2 = world.dist2(sx, sy, c.x, c.y);
    if (d2 < 42 * 42) continue;
    let score = Math.min(150 * 150, d2) / 900;
    const pref = preferredTypes.indexOf(room.type);
    if (pref >= 0) score += 80 - pref * 12;
    if (room.type === RoomType.CORRIDOR) score += routePressureLevel(spec) * 8;
    if (room.type === RoomType.PRODUCTION && proceduralMonsterFloor(spec) === FloorLevel.MAINTENANCE) score += 20;
    if (score > bestScore) {
      bestScore = score;
      best = room;
    }
  }
  return best;
}

function choosePressureMarkerRoom(world: World, rooms: Room[], target: Room, sx: number, sy: number): Room | null {
  let best: Room | null = null;
  let bestD2 = Infinity;
  const tc = roomCenter(target);
  for (const room of rooms) {
    if (room.id === target.id || room.w < 4 || room.h < 4) continue;
    const c = roomCenter(room);
    if (world.dist2(c.x, c.y, tc.x, tc.y) < 20 * 20) continue;
    const d2 = world.dist2(sx, sy, c.x, c.y);
    if (d2 < bestD2) {
      bestD2 = d2;
      best = room;
    }
  }
  return best ?? rooms.find(room => room.id !== target.id) ?? null;
}

function registerProceduralMonsterPressureCue(world: World, rooms: Room[], spec: ProceduralFloorSpec, sx: number, sy: number): void {
  const pressure = routePressureLevel(spec);
  if (pressure <= 0) return;
  const target = choosePressureTargetRoom(world, rooms, spec, sx, sy);
  if (!target) return;
  const markerRoom = choosePressureMarkerRoom(world, rooms, target, sx, sy);
  if (!markerRoom) return;
  const marker = roomCell(world, markerRoom, Math.floor(markerRoom.w / 2), Math.floor(markerRoom.h / 2));
  const targetPos = roomCell(world, target, Math.floor(target.w / 2), Math.floor(target.h / 2));
  if (!marker || !targetPos) return;

  const markerCell = world.idx(marker.x, marker.y);
  if (world.features[markerCell] === Feature.NONE) world.features[markerCell] = Feature.SCREEN;
  world.stamp(marker.x, marker.y, 0.5, 0.5, 0.34, 0.72, spec.seed ^ 0x5111, 84, 124, 116, true);
  const profile = pressureCueProfile(proceduralMonsterFloor(spec), spec);
  registerRouteCue(world, {
    id: `procedural_${spec.key}_monster_pressure`,
    x: marker.x + 0.5,
    y: marker.y + 0.5,
    targetX: targetPos.x + 0.5,
    targetY: targetPos.y + 0.5,
    floor: spec.baseFloor,
    roomId: markerRoom.id,
    targetRoomId: target.id,
    zoneId: world.zoneMap[markerCell],
    label: profile.label,
    hint: profile.hint,
    targetName: profile.targetName,
    color: profile.color,
    tags: ['procedural_floor', 'route_pressure', 'monster_pressure', spec.geometryId, spec.majorityId, spec.anomalyId],
    toneSeed: (spec.seed ^ (target.id * 1103) ^ (markerRoom.id * 67)) >>> 0,
    radius: 11,
    targetRadius: 3,
    cooldownSec: 30,
    heardText: profile.heardText,
    followedText: profile.followedText,
    ignoredText: profile.ignoredText,
  });
}

function cleanFalseSafeRoom(world: World, room: Room): void {
  room.floorTex = Tex.F_TILE;
  for (let dy = 0; dy < room.h; dy++) {
    for (let dx = 0; dx < room.w; dx++) {
      const x = world.wrap(room.x + dx);
      const y = world.wrap(room.y + dy);
      const ci = world.idx(x, y);
      if (world.roomMap[ci] !== room.id) continue;
      if (world.cells[ci] === Cell.FLOOR || world.cells[ci] === Cell.WATER) {
        world.floorTex[ci] = Tex.F_TILE;
        world.fog[ci] = 0;
      }
    }
  }
}

function nextContainerId(world: World): number {
  return world.containers.reduce((mx, c) => Math.max(mx, c.id), 0) + 1;
}

function addFalseSafeContainer(
  world: World,
  spec: ProceduralFloorSpec,
  room: Room,
  pos: { x: number; y: number },
  kind: ContainerKind,
  name: string,
  secret: boolean,
): void {
  world.addContainer({
    id: nextContainerId(world),
    x: pos.x,
    y: pos.y,
    floor: spec.baseFloor,
    roomId: room.id,
    zoneId: world.zoneMap[world.idx(pos.x, pos.y)],
    kind,
    name,
    inventory: secret
      ? [
        { defId: 'meat_rune', count: 1 },
        { defId: 'psi_dust', count: 1 },
        { defId: 'container_key_label', count: 1 },
      ]
      : [
        { defId: 'water', count: 1 },
        { defId: 'bread', count: 1 },
        { defId: 'bandage', count: 1 },
        { defId: 'siren_instruction', count: 1 },
      ],
    capacitySlots: secret ? 8 : 10,
    ownerName: secret ? undefined : 'Черная ладонь',
    faction: Faction.CULTIST,
    access: secret ? 'secret' : 'owner',
    lockDifficulty: secret ? undefined : 4,
    discovered: !secret,
    tags: [
      FALSE_SAFE_BLOCK_TAG,
      'cult',
      secret ? 'marker_evidence' : 'locked_supply',
      secret ? 'secret' : 'shelter',
      secret ? 'evidence' : 'audit',
    ],
  });
}

function findFreeRoomCell(world: World, room: Room, seed: number): { x: number; y: number } | null {
  for (let a = 0; a < 24; a++) {
    const x = world.wrap(room.x + 1 + ((seed + a * 5) % Math.max(1, room.w - 2)));
    const y = world.wrap(room.y + 1 + ((seed * 3 + a * 7) % Math.max(1, room.h - 2)));
    const ci = world.idx(x, y);
    if (world.cells[ci] === Cell.FLOOR && world.roomMap[ci] === room.id && world.features[ci] === Feature.NONE) return { x, y };
  }
  return null;
}

function spawnFalseSafeCaretaker(
  world: World,
  entities: Entity[],
  nextId: { v: number },
  room: Room,
  spec: ProceduralFloorSpec,
): void {
  if (!canSpawnEntityType(entities, EntityType.NPC)) return;
  const pos = findFreeRoomCell(world, room, nextId.v + room.id * 17);
  if (!pos) return;
  const ci = world.idx(pos.x, pos.y);
  const zoneLevel = world.zones[world.zoneMap[ci]]?.level ?? spec.danger;
  const rpg = randomRPG(gaussianLevel(zoneLevel, 2));
  const maxHp = getMaxHp(rpg);
  const nm = randomName(Faction.CULTIST);
  const loadout = npcLoadout(Faction.CULTIST, spec.danger);
  entities.push({
    id: nextId.v++,
    type: EntityType.NPC,
    x: pos.x + 0.5,
    y: pos.y + 0.5,
    angle: Math.random() * Math.PI * 2,
    pitch: 0,
    alive: true,
    speed: 1.05,
    sprite: Occupation.PILGRIM,
    name: nm.name,
    isFemale: nm.female,
    needs: freshNeeds(),
    hp: maxHp,
    maxHp,
    money: irng(10, 70 + spec.danger * 25),
    ai: { goal: AIGoal.IDLE, tx: pos.x, ty: pos.y, path: [], pi: 0, stuck: 0, timer: 0 },
    faction: Faction.CULTIST,
    occupation: Occupation.PILGRIM,
    isTraveler: true,
    questId: -1,
    rpg,
    inventory: loadout.inventory,
    weapon: loadout.weapon,
  });
}

function chooseFalseSafeShelter(world: World, rooms: Room[]): Room | null {
  const candidates = rooms.filter(room => (
    room.w >= 7
    && room.h >= 6
    && room.type !== RoomType.CORRIDOR
    && room.type !== RoomType.BATHROOM
    && room.doors.length > 0
  ));
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => {
    const ac = roomCenter(a);
    const bc = roomCenter(b);
    return world.dist2(W / 2, W / 2, ac.x, ac.y) - world.dist2(W / 2, W / 2, bc.x, bc.y);
  });
  return pick(candidates.slice(0, Math.min(18, candidates.length)));
}

function applyFalseSafeBlock(
  world: World,
  rooms: Room[],
  entities: Entity[],
  nextId: { v: number },
  spec: ProceduralFloorSpec,
  allowNpcs: boolean,
): void {
  if (spec.anomalyId !== 'false_safe_block') return;
  const shelter = chooseFalseSafeShelter(world, rooms);
  if (!shelter) return;
  const center = roomCenter(shelter);
  shelter.name = `${FALSE_SAFE_BLOCK_ROOM_PREFIX}: чистое укрытие без сирены`;
  cleanFalseSafeRoom(world, shelter);
  const shelterZoneId = world.zoneMap[world.idx(center.x, center.y)];
  const shelterZone = world.zones[shelterZoneId];
  if (shelterZone) {
    shelterZone.faction = ZoneFaction.CULTIST;
    shelterZone.level = Math.max(shelterZone.level, Math.min(5, spec.danger + 1));
    shelterZone.fogged = false;
  }

  const quietCorridors = rooms
    .filter(room => room.type === RoomType.CORRIDOR)
    .map(room => ({ room, d2: world.dist2(center.x, center.y, room.x + room.w / 2, room.y + room.h / 2) }))
    .sort((a, b) => a.d2 - b.d2)
    .slice(0, 3)
    .map(row => row.room);
  for (const room of quietCorridors) {
    room.name = `${FALSE_SAFE_BLOCK_ROOM_PREFIX}: тихий ход ${room.id}`;
    cleanFalseSafeRoom(world, room);
  }

  const screen = placeRoomFeature(world, shelter, Feature.SCREEN, 2, 1);
  const marker = placeRoomFeature(world, shelter, Feature.APPARATUS, shelter.w - 3, Math.floor(shelter.h / 2));
  placeRoomFeature(world, shelter, Feature.BED, Math.floor(shelter.w / 2), Math.floor(shelter.h / 2));
  placeRoomFeature(world, shelter, Feature.LAMP, 1, shelter.h - 2);
  placeRoomFeature(world, shelter, Feature.LAMP, shelter.w - 2, 1);
  if (screen) world.stamp(screen.x, screen.y, 0.5, 0.5, 0.2, 160, spec.seed + 4401, 6, 6, 6, true);
  if (marker) {
    world.stamp(marker.x, marker.y, 0.5, 0.5, 0.52, 220, spec.seed + 4402, 4, 4, 3, true);
    world.stamp(marker.x, marker.y, 0.5, 0.5, 0.28, 190, spec.seed + 4403, 80, 12, 48, false);
  }

  for (let i = 0; i < 7; i++) {
    const room = i < quietCorridors.length ? quietCorridors[i] : shelter;
    const pos = roomCell(world, room, 1 + ((i * 5) % Math.max(1, room.w - 2)), 1 + ((i * 7) % Math.max(1, room.h - 2)));
    if (!pos) continue;
    world.stamp(pos.x, pos.y, 0.5, 0.5, 0.24 + (i % 3) * 0.04, 150, spec.seed + 4500 + i, 2, 2, 2, i % 2 === 0);
  }

  const supplyPos = findFreeRoomCell(world, shelter, spec.seed + 51);
  if (supplyPos) addFalseSafeContainer(
    world,
    spec,
    shelter,
    supplyPos,
    ContainerKind.EMERGENCY_BOX,
    'Опломбированный запас тихого блока',
    false,
  );
  const stashPos = findFreeRoomCell(world, shelter, spec.seed + 83);
  if (stashPos) addFalseSafeContainer(
    world,
    spec,
    shelter,
    stashPos,
    ContainerKind.SECRET_STASH,
    'Ниша черной ладони под чистым полом',
    true,
  );

  if (allowNpcs) {
    const caretakers = Math.min(4, 2 + Math.floor(spec.danger / 2));
    for (let i = 0; i < caretakers; i++) spawnFalseSafeCaretaker(world, entities, nextId, shelter, spec);
  }
}

function reachableCellsFrom(world: World, spawnX: number, spawnY: number): Uint8Array {
  const out = new Uint8Array(W * W);
  const queue = new Int32Array(W * W);
  let head = 0;
  let tail = 0;
  const start = world.idx(Math.floor(spawnX), Math.floor(spawnY));
  out[start] = 1;
  queue[tail++] = start;

  while (head < tail) {
    const ci = queue[head++];
    const x = ci % W;
    const y = (ci / W) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const ni = world.idx(x + dx, y + dy);
      if (out[ni]) continue;
      if (!isConnectivityWalkable(world, ni)) continue;
      out[ni] = 1;
      queue[tail++] = ni;
    }
  }

  return out;
}

function containerCellValidForReachability(world: World, ci: number, reachable: Uint8Array): boolean {
  if (!reachable[ci]) return false;
  return world.cells[ci] === Cell.FLOOR || world.cells[ci] === Cell.WATER;
}

function findReachableContainerCell(
  world: World,
  rooms: Room[],
  reachable: Uint8Array,
  seed: number,
  preferredRoom?: Room,
  occupied?: Set<number>,
): { room: Room; x: number; y: number } | null {
  const roomPool = preferredRoom ? [preferredRoom, ...rooms.filter(room => room.id !== preferredRoom.id)] : rooms;
  for (const room of roomPool) {
    if (room.w < 3 || room.h < 3) continue;
    const samples = Math.max(18, Math.min(80, (room.w - 2) * (room.h - 2)));
    for (let a = 0; a < samples; a++) {
      const x = world.wrap(room.x + 1 + ((seed + a * 5) % Math.max(1, room.w - 2)));
      const y = world.wrap(room.y + 1 + ((seed * 3 + a * 7) % Math.max(1, room.h - 2)));
      const ci = world.idx(x, y);
      if (world.roomMap[ci] !== room.id || !containerCellValidForReachability(world, ci, reachable)) continue;
      if (occupied?.has(ci) || world.containersAt(x, y).length > 0) continue;
      return { room, x, y };
    }
  }
  return null;
}

function convertDropInventory(drop: Entity, kind: ContainerKind, spec: ProceduralFloorSpec): Item[] {
  const inv: Item[] = [];
  const valueCap = proceduralContainerValueCap(kind, spec);
  const capacitySlots = CONTAINER_DEFS[kind].capacitySlots;
  for (const item of drop.inventory ?? []) addCappedItem(inv, item, valueCap, capacitySlots);
  return inv;
}

function kindForConvertedDrop(drop: Entity, room: Room | undefined, spec: ProceduralFloorSpec): ContainerKind {
  const firstId = drop.inventory?.[0]?.defId;
  const tags = firstId ? itemTags(firstId) : [];
  if (tags.includes('medicine') || tags.includes('triage') || firstId === 'bandage' || firstId === 'antifungal_ointment') return ContainerKind.MEDICAL_CABINET;
  if (tags.includes('tool') || firstId === 'rock_salt' || firstId === 'valve_tag' || firstId === 'filter_receipt') return ContainerKind.TOOL_LOCKER;
  if (tags.includes('contaminant') || tags.includes('bait_risky') || spec.anomalyId === 'mushroom_mycelium') return ContainerKind.SECRET_STASH;
  if (room?.type === RoomType.KITCHEN) return ContainerKind.FRIDGE;
  return ContainerKind.EMERGENCY_BOX;
}

function containerizeLooseProceduralDrops(
  world: World,
  rooms: Room[],
  entities: Entity[],
  spec: ProceduralFloorSpec,
  reachable: Uint8Array,
): void {
  let write = 0;
  for (const entity of entities) {
    if (entity.type !== EntityType.ITEM_DROP || !entity.inventory || entity.inventory.length === 0) {
      entities[write++] = entity;
      continue;
    }
    const x = world.wrap(Math.floor(entity.x));
    const y = world.wrap(Math.floor(entity.y));
    const ci = world.idx(x, y);
    const room = world.roomMap[ci] >= 0 ? world.rooms[world.roomMap[ci]] : undefined;
    const kind = kindForConvertedDrop(entity, room, spec);
    const inventory = convertDropInventory(entity, kind, spec);
    const sameCellOk = room && containerCellValidForReachability(world, ci, reachable) && world.containersAt(x, y).length === 0;
    const target = sameCellOk
      ? { room, x, y }
      : findReachableContainerCell(world, rooms, reachable, entity.id * 37 + spec.seed, room);
    if (target && inventory.length > 0) {
      addProceduralLootContainer(world, spec, target.room, target, kind, inventory, ['converted_drop'], `${CONTAINER_DEFS[kind].name}: найденная закладка`);
      continue;
    }
    entities[write++] = entity;
  }
  entities.length = write;
}

function ensureContainersReachable(world: World, rooms: Room[], spec: ProceduralFloorSpec, reachable: Uint8Array): void {
  const occupied = new Set<number>();
  for (const container of world.containers) {
    const ci = world.idx(container.x, container.y);
    if (containerCellValidForReachability(world, ci, reachable) && !occupied.has(ci)) occupied.add(ci);
  }

  let changed = false;
  for (const container of world.containers) {
    const ci = world.idx(container.x, container.y);
    if (containerCellValidForReachability(world, ci, reachable) && occupied.has(ci)) continue;
    occupied.delete(ci);
    const room = world.rooms[container.roomId];
    const target = findReachableContainerCell(world, rooms, reachable, container.id * 53 + spec.seed, room, occupied);
    if (!target) continue;
    container.x = target.x;
    container.y = target.y;
    container.roomId = target.room.id;
    container.zoneId = world.zoneMap[world.idx(target.x, target.y)];
    occupied.add(world.idx(target.x, target.y));
    changed = true;
  }
  if (changed) world.rebuildContainerMap();
}

function resolveProceduralSpawn(world: World, spawnX: number, spawnY: number): { spawnX: number; spawnY: number } {
  const sx = Math.floor(spawnX);
  const sy = Math.floor(spawnY);
  const startCell = world.cells[world.idx(sx, sy)];
  if (startCell === Cell.FLOOR || startCell === Cell.WATER) return { spawnX, spawnY };

  for (let r = 1; r <= 48; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
        const x = sx + dx;
        const y = sy + dy;
        const cell = world.cells[world.idx(x, y)];
        if (cell === Cell.FLOOR || cell === Cell.WATER) return { spawnX: x + 0.5, spawnY: y + 0.5 };
      }
    }
  }

  for (let i = 0; i < W * W; i++) {
    if (world.cells[i] !== Cell.FLOOR && world.cells[i] !== Cell.WATER) continue;
    return { spawnX: (i % W) + 0.5, spawnY: ((i / W) | 0) + 0.5 };
  }
  return { spawnX, spawnY };
}

const CONNECTIVITY_DIRS = [[1,0],[-1,0],[0,1],[0,-1]] as const;

function reachableFromSpawn(world: World, spawnX: number, spawnY: number): Uint8Array {
  const out = new Uint8Array(W * W);
  const start = world.idx(Math.floor(spawnX), Math.floor(spawnY));
  if (!isConnectivityWalkable(world, start)) return out;

  const queue = new Int32Array(W * W);
  let head = 0;
  let tail = 0;
  out[start] = 1;
  queue[tail++] = start;

  while (head < tail) {
    const ci = queue[head++];
    const x = ci % W;
    const y = (ci / W) | 0;
    for (const [dx, dy] of CONNECTIVITY_DIRS) {
      const ni = world.idx(x + dx, y + dy);
      if (out[ni] || !isConnectivityWalkable(world, ni)) continue;
      out[ni] = 1;
      queue[tail++] = ni;
    }
  }

  return out;
}

function canForceProceduralFloor(world: World, ci: number): boolean {
  return world.cells[ci] !== Cell.LIFT &&
    world.hermoWall[ci] === 0 &&
    world.aptMask[ci] === 0 &&
    world.features[ci] !== Feature.LIFT_BUTTON &&
    !world.containerMap.has(ci);
}

function forceProceduralFloor(world: World, x: number, y: number, roomId: number, floorTex: Tex): boolean {
  const ci = world.idx(x, y);
  if (!canForceProceduralFloor(world, ci)) return false;
  world.cells[ci] = Cell.FLOOR;
  world.floorTex[ci] = floorTex;
  world.features[ci] = Feature.NONE;
  world.roomMap[ci] = roomId;
  world.doors.delete(ci);
  return true;
}

function roomHasWalkableCell(world: World, room: Room): boolean {
  let owned = false;
  for (let dy = 0; dy < room.h; dy++) {
    for (let dx = 0; dx < room.w; dx++) {
      const ci = world.idx(room.x + dx, room.y + dy);
      if (world.roomMap[ci] !== room.id) continue;
      owned = true;
      if (isConnectivityWalkable(world, ci)) return true;
    }
  }
  return !owned;
}

function openRoomAnchor(world: World, room: Room): boolean {
  const cx = room.x + Math.floor(room.w / 2);
  const cy = room.y + Math.floor(room.h / 2);
  if (world.roomMap[world.idx(cx, cy)] === room.id && forceProceduralFloor(world, cx, cy, room.id, room.floorTex)) return true;

  for (let r = 1; r <= Math.max(room.w, room.h); r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
        const x = world.wrap(cx + dx);
        const y = world.wrap(cy + dy);
        const ci = world.idx(x, y);
        if (world.roomMap[ci] !== room.id) continue;
        if (forceProceduralFloor(world, x, y, room.id, room.floorTex)) return true;
      }
    }
  }
  return false;
}

function repairProceduralRoomAnchors(world: World): boolean {
  let changed = false;
  for (const room of world.rooms) {
    if (!room || room.sealed || room.w <= 0 || room.h <= 0) continue;
    if (roomHasWalkableCell(world, room)) continue;
    if (openRoomAnchor(world, room)) changed = true;
  }
  return changed;
}

function liftDirectionHasReachableAccess(world: World, reachable: Uint8Array, direction: LiftDirection): boolean {
  for (let i = 0; i < world.cells.length; i++) {
    if (world.cells[i] !== Cell.LIFT || world.liftDir[i] !== direction) continue;
    const x = i % W;
    const y = (i / W) | 0;
    for (const [dx, dy] of CONNECTIVITY_DIRS) {
      if (reachable[world.idx(x + dx, y + dy)]) return true;
    }
  }
  return false;
}

function firstLiftCell(world: World, direction: LiftDirection): number {
  for (let i = 0; i < world.cells.length; i++) {
    if (world.cells[i] === Cell.LIFT && world.liftDir[i] === direction) return i;
  }
  return -1;
}

function liftButtonCellUsable(world: World, ci: number, direction: LiftDirection): boolean {
  return world.features[ci] === Feature.NONE ||
    (world.features[ci] === Feature.LIFT_BUTTON && world.liftDir[ci] === direction);
}

function openLiftAccessCell(world: World, liftIdx: number, direction: LiftDirection): boolean {
  const x = liftIdx % W;
  const y = (liftIdx / W) | 0;
  for (const [dx, dy] of CONNECTIVITY_DIRS) {
    const ni = world.idx(x + dx, y + dy);
    if (!isConnectivityWalkable(world, ni) || !liftButtonCellUsable(world, ni, direction)) continue;
    world.features[ni] = Feature.LIFT_BUTTON;
    world.liftDir[ni] = direction;
    return true;
  }

  for (const [dx, dy] of CONNECTIVITY_DIRS) {
    const nx = world.wrap(x + dx);
    const ny = world.wrap(y + dy);
    const ni = world.idx(nx, ny);
    if (!liftButtonCellUsable(world, ni, direction)) continue;
    if (!forceProceduralFloor(world, nx, ny, -1, Tex.F_CONCRETE)) continue;
    world.features[ni] = Feature.LIFT_BUTTON;
    world.liftDir[ni] = direction;
    return true;
  }
  return false;
}

function placeFallbackLift(world: World, reachable: Uint8Array, direction: LiftDirection): boolean {
  for (let pass = 0; pass < 2; pass++) {
    for (let bi = 0; bi < reachable.length; bi++) {
      if (!reachable[bi] || !isConnectivityWalkable(world, bi)) continue;
      if (pass === 0 && world.roomMap[bi] >= 0) continue;
      if (world.features[bi] !== Feature.NONE) continue;
      const bx = bi % W;
      const by = (bi / W) | 0;
      for (const [dx, dy] of CONNECTIVITY_DIRS) {
        const li = world.idx(bx + dx, by + dy);
        if (world.cells[li] !== Cell.WALL || world.aptMask[li] || world.hermoWall[li] || world.doors.has(li)) continue;
        world.cells[li] = Cell.LIFT;
        world.wallTex[li] = Tex.LIFT_DOOR;
        world.roomMap[li] = -1;
        world.features[li] = Feature.NONE;
        world.liftDir[li] = direction;
        world.features[bi] = Feature.LIFT_BUTTON;
        world.liftDir[bi] = direction;
        return true;
      }
    }
  }
  return false;
}

function ensureProceduralLiftAccess(world: World, spawnX: number, spawnY: number): void {
  let reachable = reachableFromSpawn(world, spawnX, spawnY);
  for (const direction of [LiftDirection.UP, LiftDirection.DOWN] as const) {
    if (liftDirectionHasReachableAccess(world, reachable, direction)) continue;
    const liftIdx = firstLiftCell(world, direction);
    if (liftIdx >= 0) {
      openLiftAccessCell(world, liftIdx, direction);
    } else {
      placeFallbackLift(world, reachable, direction);
    }
    ensureConnectivity(world, spawnX, spawnY);
    reachable = reachableFromSpawn(world, spawnX, spawnY);
  }
}

function repairFinalProceduralConnectivity(world: World, spawnX: number, spawnY: number): { spawnX: number; spawnY: number } {
  let spawn = resolveProceduralSpawn(world, spawnX, spawnY);
  sanitizeDoors(world);
  repairProceduralRoomAnchors(world);
  ensureConnectivity(world, spawn.spawnX, spawn.spawnY);
  ensureProceduralLiftAccess(world, spawn.spawnX, spawn.spawnY);
  ensureConnectivity(world, spawn.spawnX, spawn.spawnY);
  sanitizeDoors(world);
  ensureConnectivity(world, spawn.spawnX, spawn.spawnY);
  spawn = resolveProceduralSpawn(world, spawn.spawnX, spawn.spawnY);
  return spawn;
}

export function generateProceduralFloor(spec: ProceduralFloorSpec): FloorGeneration {
  return withSeededRandom(spec.seed, () => {
    const world = new World();
    const entities: Entity[] = [];
    const nextId = { v: 1 };
    const allowNpcs = floorRunZAllowsNpcs(spec.z);
    const { rooms, spawnX, spawnY } = buildRooms(world, spec);

    applyAtticWeatherworks(world, rooms, spec, spawnX, spawnY);
    applyArchiveWarrens(world, rooms, spec);
    applyCommunalKnots(world, rooms, spec);
    applyServiceSpines(world, rooms, spec, spawnX, spawnY);
    applySumpCauseways(world, rooms, spec, spawnX, spawnY);
    generateZones(world);
    applyZones(world, spec);
    applyWaterAndMachines(world, spec);
    placeLifts(world, 8, LiftDirection.UP);
    placeLifts(world, 8, LiftDirection.DOWN);
    const placement = buildWalkablePlacementMap(world, spawnX, spawnY);
    registerProceduralAnomalyPlacement(world, placement);

    placeProceduralEmergencyPanels(world, rooms, spec, placement.reachable);
    spawnLoot(world, rooms, spec, spawnX, spawnY, placement.reachable);
    if (allowNpcs) spawnNpcs(world, rooms, entities, nextId, spec);
    spawnMonsters(world, entities, nextId, spec, spawnX, spawnY);

    applySmog(world, rooms, entities, nextId, spec, allowNpcs);
    applySamosborSeed(world, spec);
    applyMushrooms(world, rooms, entities, nextId, spec);
    applyCarnivorousFungusRooms(world, rooms, entities, nextId, spec);
    applyHladon(world, rooms, entities, nextId, spec, spawnX, spawnY);
    applyTeleports(world, spec);
    applyRailTrains(world, rooms, entities, nextId, spec, spawnX, spawnY);
    applyFalseSafeBlock(world, rooms, entities, nextId, spec, allowNpcs);
    applyProceduralAnomalyProfile({ world, rooms, entities, nextId, spec, spawnX, spawnY, placement });
    const spawn = repairFinalProceduralConnectivity(world, spawnX, spawnY);
    const reachable = reachableCellsFrom(world, spawn.spawnX, spawn.spawnY);
    ensureContainersReachable(world, rooms, spec, reachable);
    containerizeLooseProceduralDrops(world, rooms, entities, spec, reachable);
    registerProceduralMonsterPressureCue(world, rooms, spec, spawn.spawnX, spawn.spawnY);
    if (!allowNpcs) removeNpcEntities(entities);

    world.bakeLights();
    relightBadAppleWorld(world);
    return { world, entities, spawnX: spawn.spawnX, spawnY: spawn.spawnY };
  });
}
