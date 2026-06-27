import { RoomType, Tex, type Entity, EntityType, Faction, Occupation, Cell } from '../../core/types';
import { World } from '../../core/world';
import { stampRoom, protectRoom } from '../shared';

export function generateTutorialApartmentsDesignFloor(world: World, entities: Entity[], nextId: {v: number}, startX: number, startY: number) {
  let nextRoomId = world.rooms.length;

  const aptW = 12;
  const aptH = 12;

  // Find clear position near start room
  let aptX = startX + 5;
  let aptY = startY + 5;

  function areaClear(bx: number, by: number, fw: number, fh: number): boolean {
    for (let dy = -1; dy <= fh; dy++)
      for (let dx = -1; dx <= fw; dx++)
        if (world.aptMask[world.idx((bx + dx + 1024) % 1024, (by + dy + 1024) % 1024)]) return false;
    return true;
  }

  let found = false;
  for (let r = 2; r < 50 && !found; r++) {
    for (let dy = -r; dy <= r && !found; dy++) {
      for (let dx = -r; dx <= r && !found; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
        const tx = (startX + dx + 1024) % 1024;
        const ty = (startY + dy + 1024) % 1024;
        if (areaClear(tx, ty, aptW, aptH)) {
          aptX = tx; aptY = ty; found = true;
        }
      }
    }
  }

  const room = stampRoom(world, nextRoomId++, RoomType.LIVING, aptX, aptY, aptW, aptH, -1);
  room.name = 'Учебная квартира';
  room.wallTex = Tex.PANEL;
  room.floorTex = Tex.F_CONCRETE;
  protectRoom(world, aptX, aptY, aptW, aptH, Tex.PANEL, Tex.F_CONCRETE);

  // Door connecting roughly to outside
  const doorIdx = world.idx(aptX, aptY + Math.floor(aptH / 2));
  world.cells[doorIdx] = Cell.DOOR;
  world.wallTex[doorIdx] = Tex.DOOR_WOOD;
  world.floorTex[doorIdx] = Tex.F_CONCRETE;

  // Spawn 3 peaceful neighbors
  for (let i = 0; i < 3; i++) {
    entities.push({
      id: nextId.v++,
      type: EntityType.NPC,
      x: aptX + 2 + i * 2,
      y: aptY + 2 + i * 2,
      angle: Math.PI / 2,
      pitch: 0,
      alive: true,
      speed: 1.0,
      hp: 80,
      maxHp: 80,
      faction: Faction.CITIZEN,
      occupation: Occupation.HOUSEWIFE,
      sprite: Occupation.HOUSEWIFE,
      playerRelation: 1, // Minimum friendly threshold
    });
  }

  const spawnX = aptX + 1;
  const spawnY = aptY + 1;

  return { spawnX, spawnY };
}
