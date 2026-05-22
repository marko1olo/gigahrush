/* -- Кабинет больного приказа: exposed Mukhozhuk authority host -- */

import {
  ContainerKind, Faction, Feature, FloorLevel, MonsterKind, Occupation, RoomType, Tex,
  type Entity, type Room, type WorldContainer,
} from '../../core/types';
import { World } from '../../core/world';
import {
  type NextId, addItemDrop, createAdminRoom, setFeature, spawnAdminMonster, spawnNamedCivilian,
} from './admin_common';
import { genLog } from '../log';

function nextContainerId(world: World): number {
  let id = world.containers.reduce((mx, c) => Math.max(mx, c.id), 0) + 1;
  while (world.containerById.has(id) || world.containers.some(c => c.id === id)) id++;
  return id;
}

function addFoodAuditCabinet(
  world: World,
  room: Room,
  x: number,
  y: number,
  inventory: WorldContainer['inventory'],
): void {
  const wx = world.wrap(x);
  const wy = world.wrap(y);
  world.addContainer({
    id: nextContainerId(world),
    x: wx,
    y: wy,
    floor: FloorLevel.MINISTRY,
    roomId: room.id,
    zoneId: world.zoneMap[world.idx(wx, wy)],
    kind: ContainerKind.FRIDGE,
    name: 'Запас больного приказа',
    inventory,
    capacitySlots: 8,
    faction: Faction.LIQUIDATOR,
    access: 'faction',
    discovered: true,
    tags: ['mukhozhuk', 'food', 'audit', 'quarantine'],
  });
  setFeature(world, wx, wy, Feature.SHELF);
}

export function generateMukhozhukAudit(
  world: World,
  nextRoomId: number,
  entities: Entity[],
  nextId: NextId,
  spawnX: number,
  spawnY: number,
): { nextRoomId: number } {
  const room = createAdminRoom(world, nextRoomId, spawnX, spawnY, {
    type: RoomType.HQ,
    name: 'Кабинет больного приказа',
    w: 22,
    h: 13,
    minDist: 120,
    maxDist: 300,
    wallTex: Tex.MARBLE,
    floorTex: Tex.F_RED_CARPET,
  });
  if (!room) return { nextRoomId };

  const rx = room.x;
  const ry = room.y;
  const cx = rx + Math.floor(room.w / 2);
  const cy = ry + Math.floor(room.h / 2);

  for (let dx = 3; dx < room.w - 3; dx += 4) {
    setFeature(world, rx + dx, cy - 3, Feature.DESK);
    setFeature(world, rx + dx + 1, cy + 3, Feature.CHAIR);
  }
  for (let y = cy - 2; y <= cy + 2; y++) setFeature(world, rx + room.w - 4, y, Feature.DESK);
  setFeature(world, rx + room.w - 3, cy, Feature.SCREEN);

  addFoodAuditCabinet(world, room, rx + 3, cy - 1, [
    { defId: 'liquidator_ration', count: 2 },
    { defId: 'canned', count: 2 },
    { defId: 'alcohol_bottle', count: 1 },
    { defId: 'quarantine_medcard', count: 1 },
  ]);
  addItemDrop(entities, nextId, rx + room.w - 6, cy + 3, 'clean_health_cert', 1);
  addItemDrop(entities, nextId, rx + 5, cy + 3, 'inspection_mirror', 1);

  spawnNamedCivilian(entities, nextId, 'Ликвидатор-свидетель Платон', false, rx + 5, cy, Occupation.HUNTER, Faction.LIQUIDATOR, [{ defId: 'liquidator_ration', count: 1 }], 'makarov');
  spawnNamedCivilian(entities, nextId, 'Секретарь карантинной ревизии', true, rx + 8, cy - 2, Occupation.SECRETARY, Faction.CITIZEN, [{ defId: 'clean_health_cert', count: 1 }]);
  spawnAdminMonster(world, entities, nextId, cx + 5, cy, MonsterKind.MUKHOZHUK_HOST);

  genLog(`[MINISTRY_MUKHOZHUK] ${room.name} at (${room.x}, ${room.y}) room #${room.id}`);
  return { nextRoomId: room.id + 1 };
}
