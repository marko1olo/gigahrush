import {
  AIGoal,
  Cell,
  EntityType,
  Feature,
  FloorLevel,
  MonsterKind,
  RoomType,
  Tex,
  W,
  ZoneFaction,
  type Entity,
  type Room,
  type Zone,
} from '../../core/types';
import { World } from '../../core/world';
import { hashSeed, seededRandom } from '../../core/rand';
import type { DesignFloorRouteDef } from '../../data/design_floors';
import { MONSTERS } from '../../entities/monster';
import { monsterSpr } from '../../render/sprite_index';
import { ensureConnectivity, generateZones, sanitizeDoors } from '../shared';
import type { FloorGeneration } from '../floor_manifest';
import { blackoutDarknessLights, expandDarknessRouteGeometry } from './darkness';
import { applyFloor69AmbientSpriteTemplates, expandFloor69FullFloor } from './floor_69';
import { expandManhattanCrossroadsRouteShell } from './manhattan_crossroads';
import { expandServiceFloorMachineMaze, placeServiceFloorEmergencyPanels } from './service_floor';
import { expandChthonicAtticRootNetwork, retuneExpandedChthonicAtticEcology } from './chthonic_attic';
import { expandUpperBureauGeometry, retuneUpperBureauZones } from './upper_bureau';
import { expandAntennaCourtRouteGeometry, retuneAntennaCourtRouteZones } from './antenna_court';
import { expandBankFloorRouteGeometry } from './bank_floor';
import { expandRoofArchipelago, retuneRoofPressureZones } from './roof';
import { expandBlackMarket88Bazaar } from './black_market_88';
import { expandDarkMetroFullFloorGeometry, tuneDarkMetroRouteZone } from './dark_metro';
import { expandPioneerCampFullFloor, tunePioneerCampPopulationZones } from './pioneer_camp';
import { expandProductionBeltGeometry } from './production_belt';
import { expandRaionsovetArchiveGeometry } from './raionsovet_archive';
import { expandRegistryMorgueGeometry } from './registry_morgue';
import { expandSiliconNetWellRouteGeometry, tuneSiliconNetWellRouteZones } from './silicon_net_well';
import { expandSlimeNiiRouteGeometry } from './slime_nii';
import { ensureRouteWideFootprint } from './route_shell';
import { applyDesignFloorPopulationField } from './population';

interface FloorStyle {
  wallTex: Tex;
  floorTex: Tex;
  faction: ZoneFaction;
  danger: number;
}

interface Point {
  x: number;
  y: number;
}

type CommunalSide = 'north' | 'south' | 'west' | 'east';

export function expandDesignFloorGeneration<T extends FloorGeneration>(
  generation: T,
  route: DesignFloorRouteDef,
): T {
  const rng = seededRandom(hashSeed(`design-full:${route.id}:${route.z}`, route.z));
  switch (route.id) {
    case 'roof':
      expandRoof(generation.world, rng);
      break;
    case 'floor_69':
      expandFloor69FullFloor(generation, rng);
      break;
    case 'manhattan_crossroads':
      expandCrossroads(generation.world, rng, style(route));
      break;
    case 'communal_ring':
      expandCommunalRing(generation.world, rng, style(route));
      break;
    case 'pioneer_camp':
      expandPioneerCampFullFloor(generation.world, rng);
      break;
    case 'dark_metro':
      expandDarkMetroFullFloorGeometry(generation.world, rng, style(route), generation.entities);
      break;
    case 'production_belt':
      expandProductionBeltGeometry(generation.world, rng);
      break;
    case 'service_floor':
      expandServiceFloor(generation, rng, style(route));
      break;
    case 'silicon_net_well':
      expandSiliconNetWellRouteGeometry(generation.world, rng);
      break;
    case 'underhell':
      expandUnderhell(generation.world, generation.entities, rng);
      break;
    case 'darkness':
      expandDarkness(generation.world, generation.entities, rng);
      break;
    case 'chthonic_attic':
      expandChthonicAtticRootNetwork(generation.world, generation.entities, rng);
      break;
    case 'antenna_court':
      expandAntennaCourtRouteGeometry(generation.world, rng);
      break;
    case 'raionsovet_archive':
      expandRaionsovetArchiveGeometry(generation.world, rng);
      break;
    case 'registry_morgue':
      expandRegistryMorgueGeometry(generation.world, rng);
      break;
    case 'slime_nii':
      expandSlimeNiiRouteGeometry(generation.world, rng);
      break;
    case 'black_market_88':
      expandBlackMarket88Bazaar(generation.world, rng);
      break;
    case 'upper_bureau':
      expandUpperBureauGeometry(generation.world, rng);
      break;
    case 'bank_floor':
      expandBankFloorRouteGeometry(generation.world, rng);
      break;
  }
  ensureRouteWideFootprint(generation.world, route, rng);
  if (route.id === 'communal_ring') labelCommunalRingPopulationRooms(generation.world);
  finalizeExpandedFloor(generation, route, rng);
  if (route.id === 'service_floor') placeServiceFloorEmergencyPanels(generation.world);
  if (route.id === 'chthonic_attic') retuneExpandedChthonicAtticEcology(generation.world);
  if (route.id === 'pioneer_camp') tunePioneerCampPopulationZones(generation.world);
  applyDesignFloorPopulationField(generation, route);
  if (route.id === 'floor_69') applyFloor69AmbientSpriteTemplates(generation.entities);
  return generation;
}

function style(route: DesignFloorRouteDef): FloorStyle {
  switch (route.baseFloor) {
    case FloorLevel.MINISTRY:
      return { wallTex: Tex.MARBLE, floorTex: Tex.F_PARQUET, faction: ZoneFaction.CITIZEN, danger: 2 };
    case FloorLevel.KVARTIRY:
      return { wallTex: Tex.BRICK, floorTex: Tex.F_LINO, faction: ZoneFaction.CITIZEN, danger: 3 };
    case FloorLevel.MAINTENANCE:
      return { wallTex: Tex.PIPE, floorTex: Tex.F_CONCRETE, faction: ZoneFaction.LIQUIDATOR, danger: 4 };
    case FloorLevel.HELL:
      return { wallTex: Tex.MEAT, floorTex: Tex.F_MEAT, faction: ZoneFaction.CULTIST, danger: 5 };
    case FloorLevel.VOID:
      return { wallTex: Tex.VOID_WALL, floorTex: Tex.F_VOID, faction: ZoneFaction.SAMOSBOR, danger: 5 };
    case FloorLevel.LIVING:
    default:
      return { wallTex: Tex.PANEL, floorTex: Tex.F_CARPET, faction: ZoneFaction.CITIZEN, danger: 3 };
  }
}

function finalizeExpandedFloor<T extends FloorGeneration>(
  generation: T,
  route: DesignFloorRouteDef,
  rng: () => number,
): void {
  generateZones(generation.world);
  tuneZones(generation.world, style(route), route.id);
  if (route.id === 'roof') retuneRoofPressureZones(generation.world);
  if (route.id === 'antenna_court') retuneAntennaCourtRouteZones(generation.world);
  if (route.id !== 'roof' && route.id !== 'darkness') {
    const lightCount = route.id === 'dark_metro' ? 130 : 260;
    scatterAmbientLights(generation.world, rng, lightCount);
  }
  ensureConnectivity(generation.world, generation.spawnX, generation.spawnY);
  sanitizeDoors(generation.world);
  generation.world.rebuildContainerMap();
  if (route.id === 'roof') applyUniformSkyLight(generation.world);
  else if (route.id === 'darkness') blackoutDarknessLights(generation.world);
  else generation.world.bakeLights();
}

function tuneZones(world: World, s: FloorStyle, routeId: string): void {
  if (routeId === 'silicon_net_well') {
    tuneSiliconNetWellRouteZones(world);
    return;
  }
  for (const zone of world.zones) {
    const d = world.dist(zone.cx, zone.cy, W / 2, W / 2);
    zone.level = Math.max(1, Math.min(5, Math.round(s.danger + d / 420)));
    zone.faction = s.faction;
    if (routeId === 'floor_69' && zone.id % 9 === 0) zone.faction = ZoneFaction.LIQUIDATOR;
    if (routeId === 'black_market_88') tuneBlackMarket88Zone(world, zone, s.danger);
    if (routeId === 'slime_nii') zone.faction = d < 250 ? ZoneFaction.LIQUIDATOR : zone.id % 5 === 0 ? ZoneFaction.WILD : ZoneFaction.CITIZEN;
    if (routeId === 'communal_ring') {
      if (zone.id % 31 === 0) zone.faction = ZoneFaction.SAMOSBOR;
      else if (zone.id % 13 === 0) zone.faction = ZoneFaction.WILD;
      else if (zone.id % 17 === 0) zone.faction = ZoneFaction.LIQUIDATOR;
      else zone.faction = ZoneFaction.CITIZEN;
    }
    if (routeId === 'underhell') {
      const lowerGate = zone.cy > W * 0.62;
      zone.level = Math.min(8, zone.level + (lowerGate ? 2 : 1));
      zone.faction = lowerGate ? ZoneFaction.SAMOSBOR : zone.id % 5 === 0 ? ZoneFaction.LIQUIDATOR : ZoneFaction.CULTIST;
    }
    if (routeId === 'dark_metro') tuneDarkMetroRouteZone(zone);
    if (routeId === 'service_floor') tuneServiceFloorZone(world, zone, s.danger);
    if (routeId === 'registry_morgue') {
      const coldRows = zone.cy >= 250 && zone.cy <= 790 && (zone.cy < 455 || zone.cy > 585) && zone.cx >= 60 && zone.cx <= 965;
      const registryCore = zone.cx >= 300 && zone.cx <= 725 && zone.cy >= 455 && zone.cy <= 585;
      if (coldRows) {
        zone.faction = ZoneFaction.SAMOSBOR;
        zone.level = Math.max(zone.level, 4);
      } else if (registryCore) {
        zone.faction = zone.id % 3 === 0 ? ZoneFaction.LIQUIDATOR : ZoneFaction.CITIZEN;
        zone.level = Math.max(zone.level, 3);
      }
    }
    if (routeId === 'manhattan_crossroads') tuneManhattanCrossroadsZone(world, zone, s.danger);
    zone.fogged = false;
  }

  if (routeId === 'raionsovet_archive') retuneRaionsovetArchiveZones(world);

  if (routeId === 'upper_bureau') {
    retuneUpperBureauZones(world);
    return;
  }

  for (let i = 0; i < W * W; i++) {
    const zone = world.zones[world.zoneMap[i]];
    world.factionControl[i] = zone?.faction ?? s.faction;
  }
}

function tuneManhattanCrossroadsZone(world: World, zone: Zone, baseDanger: number): void {
  const d = world.dist(zone.cx, zone.cy, W / 2, W / 2);
  const centralControl = d < 158 || (zone.cx >= 448 && zone.cx <= 608 && zone.cy >= 432 && zone.cy <= 592);
  const wrongExit = zone.cx >= 640 && zone.cy >= 512 && zone.cy <= 760;
  const falseRoad = zone.cx <= 176 || zone.cx >= 848 || zone.cy <= 176 || zone.cy >= 848;
  const gangRoad = wrongExit || falseRoad || (zone.cx >= 610 && zone.cy >= 610) || (zone.cx <= 304 && zone.cy >= 610);
  const marketQueue = zone.cx >= 320 && zone.cx <= 560 && zone.cy >= 480 && zone.cy <= 620;

  if (gangRoad) {
    zone.faction = ZoneFaction.WILD;
    zone.level = Math.max(zone.level, wrongExit ? 4 : 3);
  } else if (centralControl) {
    zone.faction = ZoneFaction.LIQUIDATOR;
    zone.level = Math.max(zone.level, baseDanger);
  } else if (marketQueue) {
    zone.faction = zone.cx > 500 ? ZoneFaction.LIQUIDATOR : ZoneFaction.CITIZEN;
    zone.level = Math.max(zone.level, baseDanger);
  } else {
    zone.faction = ZoneFaction.CITIZEN;
    zone.level = Math.max(2, Math.min(5, zone.level));
  }

  if (falseRoad && (zone.cx <= 176 || zone.cx >= 848) && (zone.cy <= 176 || zone.cy >= 848)) {
    zone.level = Math.max(zone.level, 5);
  }
  zone.hasLift = zone.hasLift || d < 330 || wrongExit;
}

function tuneBlackMarket88Zone(world: World, zone: Zone, baseDanger: number): void {
  const inBazaar = zone.cx >= 260 && zone.cx <= 764 && zone.cy >= 328 && zone.cy <= 696;
  const debtAndPapers = zone.cx >= 420 && zone.cx <= 660 && zone.cy >= 420 && zone.cy <= 620;
  const guardPosts = (zone.cx >= 386 && zone.cx <= 476 && zone.cy >= 456 && zone.cy <= 536)
    || (zone.cx >= 552 && zone.cx <= 646 && zone.cy >= 412 && zone.cy <= 570);

  if (isBlackMarket88ServiceGutZone(zone)) {
    zone.faction = zone.id % 5 === 0 ? ZoneFaction.SAMOSBOR : ZoneFaction.WILD;
    zone.level = Math.max(zone.level, baseDanger + 1);
  } else if (guardPosts) {
    zone.faction = ZoneFaction.LIQUIDATOR;
    zone.level = Math.max(zone.level, baseDanger);
  } else if (debtAndPapers) {
    zone.faction = zone.id % 3 === 0 ? ZoneFaction.WILD : ZoneFaction.CITIZEN;
    zone.level = Math.max(zone.level, baseDanger);
  } else if (inBazaar) {
    zone.faction = zone.id % 7 === 0 ? ZoneFaction.WILD : ZoneFaction.CITIZEN;
    zone.level = Math.max(zone.level, baseDanger - 1);
  } else if (zone.id % 7 === 0) {
    zone.faction = ZoneFaction.WILD;
  }
  void world;
}

function isBlackMarket88ServiceGutZone(zone: Zone): boolean {
  const northSouthGuts = zone.cx >= 180 && zone.cx <= 844 &&
    ((zone.cy >= 286 && zone.cy <= 356) || (zone.cy >= 676 && zone.cy <= 736));
  const westEastGuts = zone.cy >= 344 && zone.cy <= 660 &&
    (zone.cx <= 180 || zone.cx >= 844);
  return northSouthGuts || westEastGuts;
}

function retuneRaionsovetArchiveZones(world: World): void {
  const storage = new Int32Array(world.zones.length);
  const office = new Int32Array(world.zones.length);
  const common = new Int32Array(world.zones.length);
  const hq = new Int32Array(world.zones.length);
  const production = new Int32Array(world.zones.length);

  for (let i = 0; i < W * W; i++) {
    if (world.cells[i] !== Cell.FLOOR) continue;
    const zoneId = world.zoneMap[i];
    if (zoneId < 0 || zoneId >= world.zones.length) continue;
    const room = world.rooms[world.roomMap[i]];
    if (!room) continue;
    switch (room.type) {
      case RoomType.STORAGE:
        storage[zoneId]++;
        break;
      case RoomType.OFFICE:
        office[zoneId]++;
        break;
      case RoomType.COMMON:
        common[zoneId]++;
        break;
      case RoomType.HQ:
        hq[zoneId]++;
        break;
      case RoomType.PRODUCTION:
        production[zoneId]++;
        break;
    }
  }

  for (const zone of world.zones) {
    const z = zone.id;
    const archiveScore = storage[z] + production[z] * 0.8;
    const adminScore = office[z] + hq[z] * 1.2;
    const queueScore = common[z];
    if (archiveScore > 220 && archiveScore > adminScore + queueScore) {
      zone.faction = z % 5 === 0 ? ZoneFaction.WILD : ZoneFaction.SAMOSBOR;
      zone.level = Math.max(zone.level, archiveScore > 520 ? 5 : 4);
    } else if (adminScore > 150) {
      zone.faction = z % 4 === 0 ? ZoneFaction.LIQUIDATOR : ZoneFaction.CITIZEN;
      zone.level = Math.max(zone.level, 3);
    } else if (queueScore > 150) {
      zone.faction = ZoneFaction.CITIZEN;
      zone.level = Math.max(zone.level, 2);
    }
  }
}

function tuneServiceFloorZone(world: World, zone: Zone, baseDanger: number): void {
  const centralStaff = zone.cx >= 384 && zone.cx <= 650 && zone.cy >= 448 && zone.cy <= 578;
  const pumpBelt = zone.cy >= 620 && zone.cy <= 744 && zone.cx >= 245 && zone.cx <= 780;
  const compressorBelt = zone.cy >= 250 && zone.cy <= 360 && zone.cx >= 245 && zone.cx <= 780;
  const cableSpine = Math.abs(world.delta(zone.cx, 332)) <= 54 || Math.abs(world.delta(zone.cx, 704)) <= 54 ||
    Math.abs(world.delta(zone.cy, 438)) <= 54 || Math.abs(world.delta(zone.cy, 590)) <= 54;
  const remoteCore = zone.cx <= 260 || zone.cx >= 760 || zone.cy <= 230 || zone.cy >= 790;

  if (centralStaff) {
    zone.faction = ZoneFaction.LIQUIDATOR;
    zone.level = Math.max(zone.level, baseDanger);
    zone.hasLift = true;
  } else if (pumpBelt || compressorBelt) {
    zone.faction = zone.id % 2 === 0 ? ZoneFaction.SAMOSBOR : ZoneFaction.WILD;
    zone.level = Math.max(zone.level, 4);
  } else if (remoteCore || cableSpine) {
    zone.faction = zone.id % 3 === 0 ? ZoneFaction.WILD : ZoneFaction.SAMOSBOR;
    zone.level = Math.max(zone.level, remoteCore ? 5 : 4);
  } else {
    zone.faction = ZoneFaction.LIQUIDATOR;
    zone.level = Math.max(3, Math.min(5, zone.level));
  }
}

function protectedMask(world: World): Uint8Array {
  const mask = new Uint8Array(W * W);
  for (const room of world.rooms) {
    for (let y = room.y - 1; y <= room.y + room.h; y++) {
      for (let x = room.x - 1; x <= room.x + room.w; x++) {
        mask[world.idx(x, y)] = 1;
      }
    }
  }
  for (const idx of world.doors.keys()) mask[idx] = 1;
  for (const container of world.containers) mask[world.idx(container.x, container.y)] = 1;
  for (let i = 0; i < W * W; i++) if (world.cells[i] === Cell.LIFT) mask[i] = 1;
  return mask;
}

function addRoom(
  world: World,
  type: RoomType,
  x: number,
  y: number,
  w: number,
  h: number,
  name: string,
  wallTex: Tex,
  floorTex: Tex,
): Room {
  const room: Room = {
    id: world.rooms.length,
    type,
    x: world.wrap(x),
    y: world.wrap(y),
    w,
    h,
    doors: [],
    sealed: false,
    name,
    apartmentId: -1,
    wallTex,
    floorTex,
  };
  world.rooms.push(room);
  carveRect(world, room.x, room.y, w, h, room.id, floorTex);
  wallRing(world, room.x, room.y, w, h, wallTex);
  return room;
}

function carveRect(world: World, x: number, y: number, w: number, h: number, roomId: number, floorTex: Tex): void {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const ci = world.idx(x + dx, y + dy);
      world.cells[ci] = Cell.FLOOR;
      world.roomMap[ci] = roomId;
      world.floorTex[ci] = floorTex;
    }
  }
}

function wallRing(world: World, x: number, y: number, w: number, h: number, wallTex: Tex): void {
  for (let dy = -1; dy <= h; dy++) {
    for (let dx = -1; dx <= w; dx++) {
      if (dx >= 0 && dx < w && dy >= 0 && dy < h) continue;
      const ci = world.idx(x + dx, y + dy);
      if (world.cells[ci] === Cell.WALL || world.cells[ci] === Cell.ABYSS) {
        world.cells[ci] = Cell.WALL;
        world.wallTex[ci] = wallTex;
      }
    }
  }
}

function carveLine(world: World, ax: number, ay: number, bx: number, by: number, width: number, floorTex: Tex): void {
  let x = ax;
  let y = ay;
  const sx = bx === ax ? 0 : bx > ax ? 1 : -1;
  const sy = by === ay ? 0 : by > ay ? 1 : -1;
  while (x !== bx) {
    carveDisc(world, x, y, width, floorTex);
    x += sx;
  }
  while (y !== by) {
    carveDisc(world, x, y, width, floorTex);
    y += sy;
  }
  carveDisc(world, x, y, width, floorTex);
}

function carveDisc(world: World, cx: number, cy: number, r: number, floorTex: Tex, roomId = -1): void {
  const r2 = r * r;
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r2) continue;
      const ci = world.idx(cx + dx, cy + dy);
      world.cells[ci] = Cell.FLOOR;
      world.roomMap[ci] = roomId;
      world.floorTex[ci] = floorTex;
    }
  }
}

function setFeature(world: World, x: number, y: number, feature: Feature): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] === Cell.FLOOR || world.cells[ci] === Cell.WATER) world.features[ci] = feature;
}

function scatterAmbientLights(world: World, rng: () => number, count: number): void {
  for (let attempt = 0, placed = 0; attempt < count * 20 && placed < count; attempt++) {
    const x = Math.floor(rng() * W);
    const y = Math.floor(rng() * W);
    const ci = world.idx(x, y);
    if (world.cells[ci] !== Cell.FLOOR || world.features[ci] !== Feature.NONE) continue;
    if (rng() < 0.7) world.features[ci] = Feature.LAMP;
    else world.features[ci] = Feature.CANDLE;
    placed++;
  }
}

function applyUniformSkyLight(world: World): void {
  for (let i = 0; i < W * W; i++) {
    if (world.features[i] === Feature.LAMP || world.features[i] === Feature.CANDLE) {
      world.features[i] = Feature.NONE;
    }
  }
  world.light.fill(0.94);
}

function randomFloorCell(world: World, rng: () => number): Point | null {
  for (let attempt = 0; attempt < 2000; attempt++) {
    const x = Math.floor(rng() * W);
    const y = Math.floor(rng() * W);
    if (world.cells[world.idx(x, y)] === Cell.FLOOR) return { x, y };
  }
  return null;
}

function expandRoof(world: World, rng: () => number): void {
  expandRoofArchipelago(world, rng);
}

function expandCrossroads(world: World, rng: () => number, s: FloorStyle): void {
  void s;
  expandManhattanCrossroadsRouteShell(world, rng);
}

function expandCommunalRing(world: World, rng: () => number, s: FloorStyle): void {
  const mask = communalProtectedMask(world);
  const rings = [132, 252, 372, 456];
  for (const r of rings) carveCommunalRing(world, mask, r, r === 132 ? 3 : 4, s.floorTex);

  for (const x of [192, 320, 512, 704, 832]) {
    carveSafeLine(world, mask, x, 512 - 456, x, 512 - 132, 3, s.floorTex);
    carveSafeLine(world, mask, x, 512 + 132, x, 512 + 456, 3, s.floorTex);
  }
  for (const y of [192, 320, 512, 704, 832]) {
    carveSafeLine(world, mask, 512 - 456, y, 512 - 132, y, 3, s.floorTex);
    carveSafeLine(world, mask, 512 + 132, y, 512 + 456, y, 3, s.floorTex);
  }

  carveSafeLine(world, mask, 512, 512 - 132, 512, 460, 2, s.floorTex);
  carveSafeLine(world, mask, 512, 564, 512, 512 + 132, 2, s.floorTex);
  addCommunalServiceShafts(world, mask);
  addCommunalBottlenecks(world, mask, s.wallTex);

  const serviceTypes = [
    RoomType.KITCHEN,
    RoomType.COMMON,
    RoomType.BATHROOM,
    RoomType.PRODUCTION,
    RoomType.STORAGE,
    RoomType.OFFICE,
    RoomType.LIVING,
  ];
  const sides: CommunalSide[] = ['north', 'east', 'south', 'west'];
  for (let ri = 1; ri < rings.length; ri++) {
    const r = rings[ri];
    const offsets = [-r + 72, Math.round(-r * 0.32), Math.round(r * 0.32), r - 72];
    for (let si = 0; si < sides.length; si++) {
      for (let oi = 0; oi < offsets.length; oi++) {
        const type = serviceTypes[(ri + si + oi) % serviceTypes.length];
        addCommunalKnot(world, mask, rng, s, sides[si], r, offsets[oi], type);
      }
    }
  }
}

function labelCommunalRingPopulationRooms(world: World): void {
  for (const room of world.rooms) {
    switch (room.name) {
      case 'Радиальная общая кухня':
        room.type = RoomType.KITCHEN;
        break;
      case 'Банный ряд кольца':
        room.type = RoomType.BATHROOM;
        break;
      case 'Прачечный узел':
        room.type = RoomType.PRODUCTION;
        break;
      case 'Кладовая у спицы':
        room.type = RoomType.STORAGE;
        break;
      case 'Дежурная доска':
        room.type = RoomType.OFFICE;
        break;
      case 'Коммунальная тесная комната':
        room.type = RoomType.LIVING;
        break;
    }
  }

  const storageLines: readonly [string, number, number, number, number][] = [
    ['Мусорный сервисный ход северо-запада', 56, 220, 380, 220],
    ['Мусорный сервисный ход северо-востока', 644, 284, 968, 284],
    ['Прачечный сервисный ход юго-запада', 212, 644, 212, 968],
    ['Водяной сервисный ход востока', 812, 56, 812, 380],
    ['Пищевой сервисный ход юга', 140, 812, 388, 812],
    ['Сухой сервисный ход юго-востока', 636, 720, 884, 720],
  ];
  for (const [name, ax, ay, bx, by] of storageLines) {
    labelCommunalLineRoom(world, RoomType.STORAGE, name, ax, ay, bx, by, 5, Tex.F_CONCRETE, Tex.PIPE);
  }

  const commonRooms: readonly [string, number, number, number, number][] = [
    ['Очередь северной общей кухни', 470, 454, 86, 17],
    ['Очередь паечной кладовой', 466, 552, 92, 21],
    ['Спорный угол прачечной', 416, 486, 32, 38],
    ['Мокрая очередь душевой', 574, 486, 33, 40],
    ['Доска жалоб у внешнего кольца', 520, 466, 54, 24],
    ['Протестный узел северо-запада', 174, 176, 44, 30],
    ['Протестный узел северо-востока', 806, 174, 48, 32],
    ['Протестный узел юго-запада', 176, 806, 46, 34],
    ['Протестный узел юго-востока', 804, 804, 50, 34],
    ['Общий разворот внутреннего кольца', 478, 488, 74, 46],
  ];
  for (const [name, x, y, w, h] of commonRooms) {
    labelCommunalLogicalRoom(world, RoomType.COMMON, name, x, y, w, h, Tex.F_LINO, Tex.PANEL);
  }

  for (const r of [132, 252, 372, 456]) {
    const width = r === 132 ? 6 : 8;
    labelCommunalLogicalRoom(world, RoomType.CORRIDOR, `Северное кольцо коммуналки R${r}`, 512 - r, 512 - r - 2, r * 2 + width, width + 4, Tex.F_LINO, Tex.PANEL);
    labelCommunalLogicalRoom(world, RoomType.CORRIDOR, `Южное кольцо коммуналки R${r}`, 512 - r, 512 + r - 2, r * 2 + width, width + 4, Tex.F_LINO, Tex.PANEL);
    labelCommunalLogicalRoom(world, RoomType.CORRIDOR, `Западное кольцо коммуналки R${r}`, 512 - r - 2, 512 - r, width + 4, r * 2 + width, Tex.F_LINO, Tex.PANEL);
    labelCommunalLogicalRoom(world, RoomType.CORRIDOR, `Восточное кольцо коммуналки R${r}`, 512 + r - 2, 512 - r, width + 4, r * 2 + width, Tex.F_LINO, Tex.PANEL);
  }

  for (const x of [192, 320, 512, 704, 832]) {
    labelCommunalLogicalRoom(world, RoomType.CORRIDOR, `Северная коммунальная спица ${x}`, x - 3, 56, 7, 324, Tex.F_LINO, Tex.PANEL);
    labelCommunalLogicalRoom(world, RoomType.CORRIDOR, `Южная коммунальная спица ${x}`, x - 3, 644, 7, 324, Tex.F_LINO, Tex.PANEL);
  }
  for (const y of [192, 320, 512, 704, 832]) {
    labelCommunalLogicalRoom(world, RoomType.CORRIDOR, `Западная коммунальная спица ${y}`, 56, y - 3, 324, 7, Tex.F_LINO, Tex.PANEL);
    labelCommunalLogicalRoom(world, RoomType.CORRIDOR, `Восточная коммунальная спица ${y}`, 644, y - 3, 324, 7, Tex.F_LINO, Tex.PANEL);
  }
}

function labelCommunalLineRoom(
  world: World,
  type: RoomType,
  name: string,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  width: number,
  floorTex: Tex,
  wallTex: Tex,
): void {
  const half = Math.floor(width / 2);
  const x = Math.min(ax, bx) - half;
  const y = Math.min(ay, by) - half;
  const w = Math.abs(ax - bx) + width;
  const h = Math.abs(ay - by) + width;
  labelCommunalLogicalRoom(world, type, name, x, y, w, h, floorTex, wallTex);
}

function labelCommunalLogicalRoom(
  world: World,
  type: RoomType,
  name: string,
  x: number,
  y: number,
  w: number,
  h: number,
  floorTex: Tex,
  wallTex: Tex,
): void {
  const room: Room = {
    id: world.rooms.length,
    type,
    x: world.wrap(x),
    y: world.wrap(y),
    w,
    h,
    doors: [],
    sealed: false,
    name,
    apartmentId: -1,
    wallTex,
    floorTex,
  };
  let mapped = 0;
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const ci = world.idx(x + dx, y + dy);
      if (world.cells[ci] !== Cell.FLOOR || world.roomMap[ci] >= 0) continue;
      if (mapped === 0) world.rooms.push(room);
      world.roomMap[ci] = room.id;
      mapped++;
    }
  }
}

function communalProtectedMask(world: World): Uint8Array {
  return protectedMask(world);
}

function carveCommunalRing(world: World, mask: Uint8Array, r: number, width: number, floorTex: Tex): void {
  carveSafeRect(world, mask, 512 - r, 512 - r, r * 2, width, floorTex);
  carveSafeRect(world, mask, 512 - r, 512 + r, r * 2, width, floorTex);
  carveSafeRect(world, mask, 512 - r, 512 - r, width, r * 2, floorTex);
  carveSafeRect(world, mask, 512 + r, 512 - r, width, r * 2 + width, floorTex);
}

function carveSafeRect(world: World, mask: Uint8Array, x: number, y: number, w: number, h: number, floorTex: Tex): void {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) carveSafeCell(world, mask, x + dx, y + dy, floorTex);
  }
}

function carveSafeLine(world: World, mask: Uint8Array, ax: number, ay: number, bx: number, by: number, width: number, floorTex: Tex): void {
  if (ax !== bx && ay !== by) {
    carveSafeLine(world, mask, ax, ay, bx, ay, width, floorTex);
    carveSafeLine(world, mask, bx, ay, bx, by, width, floorTex);
    return;
  }
  const half = Math.floor(width / 2);
  const from = ax === bx ? Math.min(ay, by) : Math.min(ax, bx);
  const to = ax === bx ? Math.max(ay, by) : Math.max(ax, bx);
  for (let p = from; p <= to; p++) {
    for (let n = 0; n < width; n++) {
      const o = n - half;
      carveSafeCell(world, mask, ax === bx ? ax + o : p, ax === bx ? p : ay + o, floorTex);
    }
  }
}

function carveSafeCell(world: World, mask: Uint8Array, x: number, y: number, floorTex: Tex): void {
  const ci = world.idx(x, y);
  if (mask[ci] || world.cells[ci] === Cell.LIFT || world.cells[ci] === Cell.DOOR) return;
  world.cells[ci] = Cell.FLOOR;
  world.roomMap[ci] = -1;
  world.floorTex[ci] = floorTex;
  world.factionControl[ci] = ZoneFaction.CITIZEN;
}

function addCommunalKnot(
  world: World,
  mask: Uint8Array,
  rng: () => number,
  s: FloorStyle,
  side: CommunalSide,
  radius: number,
  offset: number,
  type: RoomType,
): void {
  const size = communalKnotSize(type, rng);
  const center = 512 + offset;
  let x = 0;
  let y = 0;
  let doorX = 0;
  let doorY = 0;
  let ringX = 0;
  let ringY = 0;

  if (side === 'north' || side === 'south') {
    x = Math.round(center - size.w / 2);
    y = side === 'north' ? 512 - radius - size.h - 9 : 512 + radius + 9;
    doorX = Math.round(center);
    doorY = side === 'north' ? y + size.h : y - 1;
    ringX = doorX;
    ringY = side === 'north' ? 512 - radius + 1 : 512 + radius + 2;
  } else {
    x = side === 'west' ? 512 - radius - size.w - 9 : 512 + radius + 9;
    y = Math.round(center - size.h / 2);
    doorX = side === 'west' ? x + size.w : x - 1;
    doorY = Math.round(center);
    ringX = side === 'west' ? 512 - radius + 1 : 512 + radius + 2;
    ringY = doorY;
  }

  if (!canPlaceCommunalRoom(world, mask, x, y, size.w, size.h)) return;
  const tileRoom = type === RoomType.BATHROOM || type === RoomType.KITCHEN;
  const room = addRoom(world, type, x, y, size.w, size.h, communalKnotName(type), tileRoom ? Tex.TILE_W : s.wallTex, tileRoom ? Tex.F_TILE : s.floorTex);
  carveSafeLine(world, mask, doorX, doorY, ringX, ringY, 2, s.floorTex);
  decorateCommunalKnot(world, room, rng);
  placeCommunalQueueMarker(world, ringX, ringY, type);
}

function communalKnotSize(type: RoomType, rng: () => number): { w: number; h: number } {
  switch (type) {
    case RoomType.KITCHEN: return { w: 32 + Math.floor(rng() * 8), h: 16 + Math.floor(rng() * 4) };
    case RoomType.BATHROOM: return { w: 28 + Math.floor(rng() * 6), h: 15 + Math.floor(rng() * 4) };
    case RoomType.PRODUCTION: return { w: 30 + Math.floor(rng() * 8), h: 16 + Math.floor(rng() * 6) };
    case RoomType.STORAGE: return { w: 24 + Math.floor(rng() * 8), h: 14 + Math.floor(rng() * 5) };
    case RoomType.OFFICE: return { w: 24 + Math.floor(rng() * 7), h: 13 + Math.floor(rng() * 4) };
    default: return { w: 22 + Math.floor(rng() * 8), h: 13 + Math.floor(rng() * 5) };
  }
}

function canPlaceCommunalRoom(world: World, mask: Uint8Array, x: number, y: number, w: number, h: number): boolean {
  if (x < 6 || y < 6 || x + w >= W - 6 || y + h >= W - 6) return false;
  for (let dy = -1; dy <= h; dy++) {
    for (let dx = -1; dx <= w; dx++) {
      const ci = world.idx(x + dx, y + dy);
      if (mask[ci] || world.cells[ci] !== Cell.WALL) return false;
    }
  }
  return true;
}

function communalKnotName(type: RoomType): string {
  switch (type) {
    case RoomType.KITCHEN: return 'Радиальная общая кухня';
    case RoomType.BATHROOM: return 'Банный ряд кольца';
    case RoomType.PRODUCTION: return 'Прачечный узел';
    case RoomType.STORAGE: return 'Кладовая у спицы';
    case RoomType.OFFICE: return 'Дежурная доска';
    default: return 'Коммунальная тесная комната';
  }
}

function decorateCommunalKnot(world: World, room: Room, rng: () => number): void {
  if (room.type === RoomType.KITCHEN) {
    for (let x = room.x + 3; x < room.x + room.w - 3; x += 6) setFeature(world, x, room.y + 2, Feature.STOVE);
    setFeature(world, room.x + 2, room.y + room.h - 3, Feature.SINK);
    setFeature(world, room.x + room.w - 5, room.y + room.h - 4, Feature.TABLE);
    return;
  }
  if (room.type === RoomType.BATHROOM) {
    for (let x = room.x + 3; x < room.x + room.w - 3; x += 5) {
      setFeature(world, x, room.y + 2, Feature.SINK);
      setFeature(world, x + 1, room.y + room.h - 3, Feature.TOILET);
    }
    const water = world.idx(room.x + (room.w >> 1), room.y + (room.h >> 1));
    world.cells[water] = Cell.WATER;
    world.floorTex[water] = Tex.F_WATER;
    return;
  }
  if (room.type === RoomType.PRODUCTION) {
    for (let x = room.x + 3; x < room.x + room.w - 3; x += 7) setFeature(world, x, room.y + 3, Feature.MACHINE);
    setFeature(world, room.x + room.w - 4, room.y + room.h - 4, Feature.SHELF);
    setFeature(world, room.x + 4, room.y + room.h - 4, Feature.SINK);
    return;
  }
  if (room.type === RoomType.STORAGE) {
    for (let x = room.x + 3; x < room.x + room.w - 3; x += 4) setFeature(world, x, room.y + 3, Feature.SHELF);
    for (let x = room.x + 5; x < room.x + room.w - 3; x += 6) setFeature(world, x, room.y + room.h - 4, Feature.SHELF);
    return;
  }
  if (room.type === RoomType.OFFICE) {
    setFeature(world, room.x + 3, room.y + 3, Feature.DESK);
    setFeature(world, room.x + 8, room.y + 3, Feature.SCREEN);
    setFeature(world, room.x + room.w - 4, room.y + room.h - 4, Feature.SHELF);
    return;
  }
  setFeature(world, room.x + 3, room.y + 3, Feature.BED);
  setFeature(world, room.x + room.w - 4, room.y + room.h - 4, rng() < 0.5 ? Feature.TABLE : Feature.CHAIR);
}

function placeCommunalQueueMarker(world: World, x: number, y: number, type: RoomType): void {
  setFeature(world, x + 2, y, type === RoomType.STORAGE ? Feature.SHELF : Feature.TABLE);
  setFeature(world, x - 2, y, type === RoomType.BATHROOM ? Feature.SINK : Feature.CHAIR);
}

function addCommunalServiceShafts(world: World, mask: Uint8Array): void {
  const shafts: [number, number, number, number][] = [
    [56, 220, 380, 220],
    [644, 284, 968, 284],
    [212, 644, 212, 968],
    [812, 56, 812, 380],
    [140, 812, 388, 812],
    [636, 720, 884, 720],
  ];
  for (const [ax, ay, bx, by] of shafts) {
    carveSafeLine(world, mask, ax, ay, bx, by, 1, Tex.F_CONCRETE);
    setFeature(world, ax, ay, Feature.APPARATUS);
    setFeature(world, bx, by, Feature.LAMP);
  }
}

function addCommunalBottlenecks(world: World, mask: Uint8Array, wallTex: Tex): void {
  addHorizontalPinch(world, mask, 248, 56, 4, 2, wallTex);
  addHorizontalPinch(world, mask, 696, 884, 4, 1, wallTex);
  addHorizontalPinch(world, mask, 396, 260, 4, 1, wallTex);
  addHorizontalPinch(world, mask, 612, 764, 4, 2, wallTex);
  addVerticalPinch(world, mask, 56, 628, 4, 1, wallTex);
  addVerticalPinch(world, mask, 884, 356, 4, 2, wallTex);
  addVerticalPinch(world, mask, 260, 436, 4, 2, wallTex);
  addVerticalPinch(world, mask, 764, 596, 4, 1, wallTex);
}

function addHorizontalPinch(world: World, mask: Uint8Array, x: number, y: number, width: number, gapOffset: number, wallTex: Tex): void {
  for (let dy = 0; dy < width; dy++) if (dy !== gapOffset) setCommunalWall(world, mask, x, y + dy, wallTex);
}

function addVerticalPinch(world: World, mask: Uint8Array, x: number, y: number, width: number, gapOffset: number, wallTex: Tex): void {
  for (let dx = 0; dx < width; dx++) if (dx !== gapOffset) setCommunalWall(world, mask, x + dx, y, wallTex);
}

function setCommunalWall(world: World, mask: Uint8Array, x: number, y: number, wallTex: Tex): void {
  const ci = world.idx(x, y);
  if (mask[ci] || world.cells[ci] !== Cell.FLOOR) return;
  world.cells[ci] = Cell.WALL;
  world.roomMap[ci] = -1;
  world.wallTex[ci] = wallTex;
  world.features[ci] = Feature.NONE;
}

function expandServiceFloor(generation: FloorGeneration, rng: () => number, s: FloorStyle): void {
  expandServiceFloorMachineMaze(generation.world, rng, s, generation.entities);
}

function expandUnderhell(world: World, entities: Entity[], rng: () => number): void {
  const specs = [
    { x: 146, y: 146, w: 38, h: 24, r: 34, name: 'Остров бездонной кости' },
    { x: 360, y: 104, w: 34, h: 22, r: 30, name: 'Корневой верхний уступ' },
    { x: 620, y: 118, w: 42, h: 24, r: 36, name: 'Пустая плита моста' },
    { x: 842, y: 204, w: 36, h: 26, r: 32, name: 'Сторожевой бетонный зуб' },
    { x: 884, y: 452, w: 34, h: 28, r: 31, name: 'Пошлинная боковая скоба' },
    { x: 820, y: 722, w: 44, h: 24, r: 37, name: 'Нижний костяной разворот' },
    { x: 604, y: 864, w: 42, h: 26, r: 38, name: 'Ложный выход к Пустоте' },
    { x: 368, y: 852, w: 34, h: 24, r: 30, name: 'Плита отступления' },
    { x: 142, y: 742, w: 40, h: 25, r: 35, name: 'Обратный карниз' },
    { x: 104, y: 496, w: 36, h: 24, r: 32, name: 'Слепой боковой мост' },
    { x: 210, y: 308, w: 34, h: 23, r: 31, name: 'Остров старого ребра' },
    { x: 724, y: 340, w: 36, h: 24, r: 32, name: 'Культовый обходной зуб' },
  ];
  const points: Point[] = [];
  for (const spec of specs) {
    const x = spec.x + Math.floor((rng() - 0.5) * 12);
    const y = spec.y + Math.floor((rng() - 0.5) * 12);
    const cx = x + (spec.w >> 1);
    const cy = y + (spec.h >> 1);
    carveDisc(world, cx, cy, spec.r, Tex.F_MEAT);
    const room = addRoom(world, RoomType.COMMON, x, y, spec.w, spec.h, spec.name, Tex.MEAT, Tex.F_MEAT);
    points.push({ x: room.x + (room.w >> 1), y: room.y + (room.h >> 1) });
    for (let i = 0; i < 3; i++) {
      setFeature(world, room.x + 4 + Math.floor(rng() * Math.max(1, room.w - 8)), room.y + 3 + Math.floor(rng() * Math.max(1, room.h - 6)), rng() < 0.5 ? Feature.CANDLE : Feature.APPARATUS);
    }
  }

  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    carveLine(world, a.x, a.y, b.x, b.y, i % 3 === 0 ? 2 : 1, i % 2 === 0 ? Tex.F_CONCRETE : Tex.F_GUT);
  }
  carveLine(world, 512, 500, points[10].x, points[10].y, 2, Tex.F_CONCRETE);
  carveLine(world, 512, 500, points[11].x, points[11].y, 2, Tex.F_GUT);
  carveLine(world, 512, 784, points[6].x, points[6].y, 2, Tex.F_CONCRETE);
  carveLine(world, 452, 716, points[8].x, points[8].y, 1, Tex.F_CONCRETE);
  sinkExpandedUnderhellAbyss(world);
  spawnAmbientMonsters(world, entities, rng, 64, [MonsterKind.SHADOW, MonsterKind.IDOL, MonsterKind.SPIRIT, MonsterKind.REBAR, MonsterKind.KOSTOREZ]);
}

function sinkExpandedUnderhellAbyss(world: World): void {
  const mask = protectedMask(world);
  for (let i = 0; i < W * W; i++) {
    if (mask[i]) continue;
    const cell = world.cells[i];
    if (cell === Cell.FLOOR || cell === Cell.DOOR || cell === Cell.LIFT) continue;
    world.cells[i] = Cell.ABYSS;
    world.roomMap[i] = -1;
    world.wallTex[i] = Tex.DARK;
    world.floorTex[i] = Tex.F_ABYSS;
    world.features[i] = Feature.NONE;
  }
}

function expandDarkness(world: World, entities: Entity[], rng: () => number): void {
  expandDarknessRouteGeometry(world, entities, rng);
}

function spawnAmbientMonsters(
  world: World,
  entities: Entity[],
  rng: () => number,
  count: number,
  kinds: MonsterKind[],
): void {
  let nextId = entities.reduce((mx, e) => Math.max(mx, e.id), 0) + 1;
  for (let i = 0; i < count; i++) {
    const p = randomFloorCell(world, rng);
    if (!p) break;
    const kind = kinds[Math.floor(rng() * kinds.length)];
    const def = MONSTERS[kind];
    const monster: Entity = {
      id: nextId++,
      type: EntityType.MONSTER,
      x: p.x + 0.5,
      y: p.y + 0.5,
      angle: rng() * Math.PI * 2,
      pitch: 0,
      alive: true,
      speed: def.speed,
      sprite: monsterSpr(kind),
      hp: def.hp,
      maxHp: def.hp,
      monsterKind: kind,
      attackCd: 0,
      ai: { goal: AIGoal.WANDER, tx: p.x, ty: p.y, path: [], pi: 0, stuck: 0, timer: 0 },
      phasing: kind === MonsterKind.SPIRIT,
    };
    entities.push(monster);
  }
}
