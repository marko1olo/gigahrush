/* ── Архив ликвидаторских дел — contract records POI ─────────── */

import {
  Cell, ContainerKind, DoorState, Feature, FloorLevel, Faction, MonsterKind, Occupation, RoomType, Tex,
  type Entity, type WorldContainer,
} from '../../core/types';
import { World } from '../../core/world';
import {
  type NextId, addItemDrop, createAdminRoom, setFeature, spawnAdminMonster, spawnNamedCivilian,
} from './admin_common';
import { genLog } from '../log';

function nextContainerId(world: World): number {
  return world.containers.reduce((mx, c) => Math.max(mx, c.id), 0) + 1;
}

function addLiquidatorContainer(
  world: World,
  roomId: number,
  x: number,
  y: number,
  kind: ContainerKind,
  name: string,
  access: WorldContainer['access'],
  inventory: WorldContainer['inventory'],
  tags: string[],
  faction = Faction.LIQUIDATOR,
): void {
  world.addContainer({
    id: nextContainerId(world),
    x,
    y,
    floor: FloorLevel.MINISTRY,
    roomId,
    zoneId: world.zoneMap[world.idx(x, y)],
    kind,
    name,
    inventory,
    capacitySlots: 10,
    faction,
    access,
    discovered: true,
    tags,
  });
}

function addRecordsGate(world: World, roomId: number, gateX: number, topY: number, bottomY: number, doorY: number): void {
  for (let y = topY; y <= bottomY; y++) {
    const ci = world.idx(gateX, y);
    world.features[ci] = Feature.NONE;
    world.cells[ci] = Cell.WALL;
    world.wallTex[ci] = Tex.MARBLE;
  }

  const doorIdx = world.idx(gateX, doorY);
  world.cells[doorIdx] = Cell.DOOR;
  world.doors.set(doorIdx, {
    idx: doorIdx,
    state: DoorState.LOCKED,
    roomA: roomId,
    roomB: roomId,
    keyId: 'key',
    timer: 0,
  });
  const room = world.rooms[roomId];
  if (room && !room.doors.includes(doorIdx)) room.doors.push(doorIdx);
}

function markLastNpcAsQuestGiver(entities: Entity[]): void {
  const npc = entities[entities.length - 1];
  if (npc) npc.canGiveQuest = true;
}

function spawnNamedThreat(
  world: World,
  entities: Entity[],
  nextId: NextId,
  x: number,
  y: number,
  kind: MonsterKind,
  name: string,
): void {
  const before = entities.length;
  spawnAdminMonster(world, entities, nextId, x, y, kind);
  if (entities.length > before) entities[entities.length - 1].name = name;
}

export function generateLiquidatorArchive(
  world: World, nextRoomId: number, entities: Entity[], nextId: NextId, spawnX: number, spawnY: number,
): { nextRoomId: number } {
  const room = createAdminRoom(world, nextRoomId, spawnX, spawnY, {
    type: RoomType.OFFICE,
    name: 'Архив ликвидаторских дел',
    w: 17, h: 10,
    minDist: 85, maxDist: 185,
    wallTex: Tex.MARBLE,
    floorTex: Tex.F_MARBLE_TILE,
  });
  if (!room) return { nextRoomId };

  const rx = room.x;
  const ry = room.y;
  const cy = ry + Math.floor(room.h / 2);
  const gateX = rx + room.w - 6;
  const deskY = ry + 3;
  addRecordsGate(world, room.id, gateX, ry + 1, ry + room.h - 2, cy);

  for (let dx = 2; dx < room.w - 7; dx++) setFeature(world, rx + dx, deskY, Feature.DESK);
  for (let dx = 2; dx < room.w - 7; dx += 2) setFeature(world, rx + dx, deskY + 1, Feature.CHAIR);
  for (let dy = 1; dy < room.h - 1; dy += 2) {
    setFeature(world, rx + 1, ry + dy, Feature.SHELF);
    setFeature(world, rx + room.w - 2, ry + dy, Feature.SHELF);
  }
  for (let dy = 2; dy < room.h - 2; dy += 2) setFeature(world, gateX + 2, ry + dy, Feature.SHELF);
  setFeature(world, rx + 3, ry + 1, Feature.LAMP);
  setFeature(world, gateX - 1, cy, Feature.SCREEN);
  setFeature(world, gateX + 3, ry + room.h - 2, Feature.LAMP);
  world.wallTex[world.idx(rx + Math.floor(room.w / 2), ry - 1)] = Tex.POSTER_BASE + 31;
  world.wallTex[world.idx(rx + room.w, cy)] = Tex.SCREEN_BASE + 9;

  addItemDrop(entities, nextId, rx + 2, ry + room.h - 2, 'unsigned_order', 1);
  addItemDrop(entities, nextId, rx + 4, ry + room.h - 2, 'samosbor_tally', 1);
  addItemDrop(entities, nextId, gateX + 1, ry + 2, 'denunciation', 1);

  spawnNamedCivilian(
    entities, nextId, 'Лада Опись', true,
    rx + 4, deskY - 1, Occupation.SECRETARY, Faction.CITIZEN,
    [{ defId: 'blank_form', count: 2 }, { defId: 'unsigned_order', count: 1 }, { defId: 'tea', count: 1 }],
  );
  markLastNpcAsQuestGiver(entities);
  spawnNamedCivilian(
    entities, nextId, 'Интендант Л-47', false,
    rx + 7, deskY - 1, Occupation.HUNTER, Faction.LIQUIDATOR,
    [{ defId: 'tt_pistol', count: 1 }, { defId: 'ammo_762tt', count: 14 }, { defId: 'liquidator_token', count: 1 }],
    'tt_pistol',
  );
  markLastNpcAsQuestGiver(entities);
  spawnNamedCivilian(
    entities, nextId, 'Постовой Невынос', false,
    gateX - 1, cy, Occupation.HUNTER, Faction.LIQUIDATOR,
    [{ defId: 'makarov', count: 1 }, { defId: 'ammo_9mm', count: 18 }, { defId: 'liquidator_ration', count: 1 }],
    'makarov',
  );

  addLiquidatorContainer(
    world, room.id, gateX + 2, ry + 2,
    ContainerKind.FILING_CABINET,
    'Картотека Л-47: жетоны и выезды',
    'faction',
    [
      { defId: 'liquidator_token', count: 1 },
      { defId: 'missing_record_file', count: 1 },
      { defId: 'chernobog_liquidator_memo', count: 1 },
      { defId: 'denunciation', count: 2 },
      { defId: 'samosbor_tally', count: 1 },
    ],
    [
      'evidence',
      'evidence_drop',
      'cult',
      'archive',
      'archive_route',
      'inspection_archive',
      'raionsovet_archive',
      'chernobog',
      'liquidator_archive',
      'audit',
    ],
  );
  addLiquidatorContainer(
    world, room.id, gateX + 3, ry + room.h - 3,
    ContainerKind.FILING_CABINET,
    'Запечатанная полка рапортов',
    'owner',
    [
      { defId: 'sealed_complaint', count: 1 },
      { defId: 'record_exposure_notice', count: 1 },
      { defId: 'chernobog_confiscation_act', count: 1 },
      { defId: 'void_archive_warrant', count: 1 },
    ],
    [
      'evidence',
      'evidence_drop',
      'cult',
      'archive',
      'archive_route',
      'inspection_archive',
      'raionsovet_archive',
      'chernobog',
      'sealed',
      'audit',
    ],
  );
  addLiquidatorContainer(
    world, room.id, rx + 2, ry + 2,
    ContainerKind.WEAPON_CRATE,
    'Шкаф боевой описи Л-47',
    'faction',
    [
      { defId: 'uv_spotlight', count: 1 },
      { defId: 'ammo_762tt', count: 12 },
      { defId: 'ammo_9mm', count: 18 },
      { defId: 'bandage', count: 2 },
      { defId: 'liquidator_ration', count: 1 },
    ],
    ['liquidator', 'liquidator_archive', 'archive_route', 'patrol', 'combat', 'ammo'],
  );

  spawnNamedThreat(world, entities, nextId, gateX + 3, cy, MonsterKind.PARAGRAPH, 'Параграф Л-47');
  spawnNamedThreat(world, entities, nextId, gateX + 1, ry + room.h - 2, MonsterKind.PECHATEED, 'Печатеед описи');

  genLog(`[MINISTRY_ADMIN] ${room.name} at (${room.x}, ${room.y}) room #${room.id}`);
  return { nextRoomId: room.id + 1 };
}
