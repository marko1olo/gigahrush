import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import {
  ContainerKind,
  Feature,
  FloorLevel,
} from '../src/core/types';
import { World } from '../src/core/world';
import { placeInteractiveAt } from '../src/gen/interactive_placement';
import { activateInteraction, findInteractionTarget } from '../src/systems/interactions';
import { createWorldEventState, getRecentEvents } from '../src/systems/events';
import { interactiveAt } from '../src/systems/interactive';
import {
  addTestRoom,
  makeGameState,
  makeTestContainer,
  makeTestPlayer,
} from './helpers';

test('existing sink features become lazy interactive water sources', () => {
  const world = new World();
  addTestRoom(world);
  const sinkIdx = world.idx(12, 12);
  world.features[sinkIdx] = Feature.SINK;
  world.aptMask[sinkIdx] = 1;
  const state = makeGameState({ worldEvents: createWorldEventState() });
  const player = makeTestPlayer({
    id: 1,
    x: 11.5,
    y: 12,
    needs: { food: 80, water: 35, sleep: 80, pee: 0, poo: 0 },
  });
  const ctx = {
    world,
    state,
    player,
    entities: [player],
    nextEntityId: { v: 2 },
    lookX: 12,
    lookY: 12,
  };

  const target = findInteractionTarget(ctx);
  assert.equal(target?.defId, 'sink_drink');
  assert.equal(interactiveAt(world, 12, 12)[0]?.defId, 'sink_drink');

  const result = activateInteraction(ctx);
  assert.equal(result.handled, true);
  assert.equal(player.needs?.water, 63);
  assert.equal(player.needs?.pendingPee, 8);
  assert.equal(getRecentEvents(state, { tags: ['interactive'], limit: 1 })[0]?.data?.interactiveDefId, 'sink_drink');
});

test('broken fixtures override lazy working fixtures until repaired', () => {
  const world = new World();
  addTestRoom(world);
  const sinkIdx = world.idx(12, 12);
  world.features[sinkIdx] = Feature.SINK;
  world.aptMask[sinkIdx] = 1;
  assert.ok(placeInteractiveAt(world, 12, 12, 'sink_broken'));

  const state = makeGameState({ worldEvents: createWorldEventState() });
  const player = makeTestPlayer({
    id: 1,
    x: 11.5,
    y: 12,
    needs: { food: 80, water: 35, sleep: 80, pee: 0, poo: 0 },
  });
  const ctx = {
    world,
    state,
    player,
    entities: [player],
    nextEntityId: { v: 2 },
    lookX: 12,
    lookY: 12,
  };

  const target = findInteractionTarget(ctx);
  assert.equal(target?.defId, 'sink_broken');
  assert.match(target?.prompt ?? '', /сломанная раковина/);

  const result = activateInteraction(ctx);
  assert.equal(result.handled, true);
  assert.equal(player.needs?.water, 35);
  assert.match(state.msgs.at(-1)?.text ?? '', /Нужен ремонт/);
  assert.equal(getRecentEvents(state, { tags: ['interactive'], limit: 1 })[0]?.data?.interactiveDefId, 'sink_broken');
});

test('containers are discoverable through the interactive adapter', () => {
  const world = new World();
  addTestRoom(world);
  const state = makeGameState({
    currentFloor: FloorLevel.LIVING,
    worldEvents: createWorldEventState(),
  });
  const player = makeTestPlayer({ id: 1, x: 11.5, y: 12 });
  const container = makeTestContainer({
    id: 77,
    x: 12,
    y: 12,
    roomId: 0,
    zoneId: 0,
    floor: FloorLevel.LIVING,
    kind: ContainerKind.TOOL_LOCKER,
    name: 'Шкаф проверки',
    capacitySlots: 3,
  });
  world.addContainer(container);
  let opened = -1;
  const ctx = {
    world,
    state,
    player,
    entities: [player],
    nextEntityId: { v: 2 },
    lookX: 12,
    lookY: 12,
    openContainerMenu: (target: typeof container) => {
      opened = target.id;
    },
  };

  assert.equal(findInteractionTarget(ctx)?.defId, 'container_adapter');
  const result = activateInteraction(ctx);
  assert.equal(result.handled, true);
  assert.equal(result.openedOverlay, true);
  assert.equal(opened, 77);
});

test('generators can place explicit feature-backed interactives', () => {
  const world = new World();
  const room = addTestRoom(world);
  const placed = placeInteractiveAt(world, room.x + 2, room.y + 2, 'workbench_basic');
  assert.ok(placed);
  assert.equal(world.features[world.idx(room.x + 2, room.y + 2)], Feature.MACHINE);

  const state = makeGameState({ worldEvents: createWorldEventState() });
  const player = makeTestPlayer({ id: 1, x: room.x + 1.5, y: room.y + 2 });
  const result = activateInteraction({
    world,
    state,
    player,
    entities: [player],
    nextEntityId: { v: 2 },
    lookX: room.x + 2,
    lookY: room.y + 2,
  });
  assert.equal(result.handled, true);
  assert.match(state.msgs.at(-1)?.text ?? '', /Верстак/);
});

test('feature-backed interactives reject blocked cells', () => {
  const world = new World();
  const placed = placeInteractiveAt(world, 1, 1, 'workbench_basic');

  assert.equal(placed, null);
  assert.equal(world.features[world.idx(1, 1)], Feature.NONE);
});
