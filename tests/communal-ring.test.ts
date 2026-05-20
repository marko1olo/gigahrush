import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import {
  Cell,
  EntityType,
  FloorLevel,
  LiftDirection,
} from '../src/core/types';
import {
  designFloorAtZ,
  designFloorById,
} from '../src/data/design_floors';
import { getSideQuestRegistrySnapshot } from '../src/data/plot';
import { generateDesignFloor } from '../src/gen/design_floors/manifest';
import {
  COMMUNAL_RING_DESIGN_FLOOR_ID,
  COMMUNAL_RING_ROUTE_Z,
} from '../src/gen/design_floors/communal_ring';

test('communal_ring is the authored коммуналка route floor', () => {
  const route = designFloorById(COMMUNAL_RING_DESIGN_FLOOR_ID);
  assert.equal(route?.z, COMMUNAL_RING_ROUTE_Z);
  assert.equal(route?.baseFloor, FloorLevel.KVARTIRY);
  assert.equal(route?.displayName, 'Коммунальное кольцо');
  assert.equal(designFloorAtZ(COMMUNAL_RING_ROUTE_Z)?.id, COMMUNAL_RING_DESIGN_FLOOR_ID);
});

test('communal_ring generator creates through communal flats with quest NPCs', () => {
  const gen = generateDesignFloor(COMMUNAL_RING_DESIGN_FLOOR_ID);
  const spawnCell = gen.world.cells[gen.world.idx(Math.floor(gen.spawnX), Math.floor(gen.spawnY))];
  const throughRooms = gen.world.rooms.filter(room => room.name.includes('сквозная коммуналка'));
  const throughRoomIds = new Set(throughRooms.map(room => room.id));
  let internalThroughDoors = 0;
  let externalThroughDoors = 0;

  for (const room of throughRooms) {
    for (const doorIdx of room.doors) {
      const door = gen.world.doors.get(doorIdx);
      if (!door) continue;
      if (throughRoomIds.has(door.roomA) && throughRoomIds.has(door.roomB)) internalThroughDoors++;
      if (door.roomB < 0 || door.roomA < 0) externalThroughDoors++;
    }
  }

  assert.equal(spawnCell, Cell.FLOOR);
  assert.equal(gen.world.liftDir.some((dir, idx) => dir === LiftDirection.UP && gen.world.cells[idx] === Cell.LIFT), true);
  assert.equal(gen.world.liftDir.some((dir, idx) => dir === LiftDirection.DOWN && gen.world.cells[idx] === Cell.LIFT), true);
  assert.equal(throughRooms.length >= 20, true);
  assert.equal(internalThroughDoors >= 16, true);
  assert.equal(externalThroughDoors >= 8, true);
  assert.equal(gen.world.containers.filter(container => container.tags.includes('through_flat')).length >= 4, true);
  assert.equal(gen.entities.some(e => e.type === EntityType.NPC && e.plotNpcId === 'communal_through_nina'), true);
  assert.equal(gen.entities.some(e => e.type === EntityType.NPC && e.plotNpcId === 'communal_primus_yegor'), true);
});

test('communal_ring registers communal service and through-flat side quests', () => {
  const ids = new Set(getSideQuestRegistrySnapshot().map(q => q.id));
  for (const id of [
    'communal_clean_bandages',
    'communal_shower_pressure',
    'communal_notice_dispute',
    'communal_pantry_theft',
    'communal_through_chain_bread',
    'communal_primus_valve',
  ]) {
    assert.equal(ids.has(id), true, id);
  }
});
