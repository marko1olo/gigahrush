import test from 'node:test';
import assert from 'node:assert/strict';
import { Cell, EntityType, Faction, RoomType, Tex, type Entity } from '../src/core/types';
import { World } from '../src/core/world';
import { rebuildEntityIndex } from '../src/systems/entity_index';
import { resetNeedsCohortStateForTests, updateNeeds } from '../src/systems/needs';

function entity(id: number, type: EntityType, x: number, y: number): Entity {
  return {
    id,
    type,
    x,
    y,
    angle: 0,
    pitch: 0,
    alive: true,
    speed: 0,
    sprite: 0,
    faction: type === EntityType.NPC ? Faction.CITIZEN : undefined,
  };
}

test('cold resident needs use world room restoration cadence when world is supplied', () => {
  resetNeedsCohortStateForTests();
  const world = new World();
  const roomX = 100;
  const roomY = 100;
  world.cells[world.idx(roomX, roomY)] = Cell.FLOOR;
  world.roomMap[world.idx(roomX, roomY)] = 0;
  world.rooms.push({
    id: 0,
    type: RoomType.KITCHEN,
    x: roomX,
    y: roomY,
    w: 1,
    h: 1,
    doors: [],
    sealed: false,
    name: 'test kitchen',
    apartmentId: -1,
    wallTex: Tex.CONCRETE,
    floorTex: Tex.F_CONCRETE,
  });
  const player = entity(1, EntityType.PLAYER, 10, 10);
  const resident = entity(2, EntityType.NPC, roomX + 0.5, roomY + 0.5);
  resident.needs = { food: 10, water: 10, sleep: 100, pee: 0, poo: 0 };
  const entities = [player, resident];

  rebuildEntityIndex(entities);
  updateNeeds(entities, 1, 1, [], player.id, undefined, undefined, world);

  assert.ok((resident.needs?.food ?? 0) > 10);
  assert.ok((resident.needs?.water ?? 0) > 10);
});
