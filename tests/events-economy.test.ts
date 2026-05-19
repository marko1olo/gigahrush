import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import {
  Cell,
  ContainerKind,
  EntityType,
  Faction,
  FloorLevel,
  Occupation,
  QuestType,
  RoomType,
  Tex,
  type Entity,
  type WorldContainer,
  WORLD_EVENT_IMPORTANT_CAPACITY,
  WORLD_EVENT_RECENT_CAPACITY,
  WORLD_EVENT_ZONE_CAPACITY,
  ZoneFaction,
} from '../src/core/types';
import { World } from '../src/core/world';
import { ITEMS } from '../src/data/catalog';
import { createEconomyFloorState, normalizeEconomyState } from '../src/data/economy';
import { getStack } from '../src/data/items';
import { SIDE_QUESTS } from '../src/data/plot';
import { getFactionRel, initFactionRelations } from '../src/data/relations';
import { RESOURCES } from '../src/data/resources';
import { spawnContract } from '../src/systems/contracts';
import { putIntoContainer, restoreValidContainers, takeFromContainer } from '../src/systems/containers';
import {
  changeResourceStock,
  economyForSave,
  ensureEconomyState,
  getAdjustedItemPrice,
  getResourceScarcity,
  normalizeGameEconomy,
  spendResources,
  summarizeEconomy,
} from '../src/systems/economy';
import {
  createWorldEventState,
  getImportantEvents,
  getRecentEvents,
  getZoneEvents,
  publishEvent,
  trimEventHistoryForSave,
} from '../src/systems/events';
import { getNpcMemory } from '../src/systems/npc_memory';
import { ensureProductionRooms, tickProduction, type ProductionState } from '../src/systems/production';
import { checkQuests, offerQuest } from '../src/systems/quests';
import { makeGameState } from './helpers';

test('world event buffers cap, order newest first, and filter by zone/severity', () => {
  const state = makeGameState({ worldEvents: createWorldEventState() });

  for (let i = 0; i < WORLD_EVENT_RECENT_CAPACITY + 8; i++) {
    state.time = i * 5;
    publishEvent(state, {
      type: 'npc_enter_zone',
      zoneId: i % 2 === 0 ? 7 : 8,
      severity: i % 4 === 0 ? 4 : 1,
      privacy: 'local',
      tags: ['test', i % 2 === 0 ? 'even' : 'odd'],
    });
  }

  const recent = getRecentEvents(state);
  assert.equal(recent.length, WORLD_EVENT_RECENT_CAPACITY);
  assert.equal(recent[0].id, WORLD_EVENT_RECENT_CAPACITY + 8);
  assert.equal(recent.at(-1)?.id, 9);

  const zoneEvents = getZoneEvents(state, 7);
  assert.equal(zoneEvents.length, WORLD_EVENT_ZONE_CAPACITY);
  assert.equal(zoneEvents[0].zoneId, 7);
  assert.ok(zoneEvents.every(e => e.tags.includes('even')));

  const important = getImportantEvents(state, WORLD_EVENT_IMPORTANT_CAPACITY + 10);
  assert.equal(important.length, WORLD_EVENT_IMPORTANT_CAPACITY);
  assert.ok(important.every(e => e.severity >= 4));
});

test('world event normalization trims old save payloads to fixed capacities', () => {
  const state = makeGameState({ worldEvents: createWorldEventState() });

  for (let i = 0; i < WORLD_EVENT_RECENT_CAPACITY + 20; i++) {
    publishEvent(state, {
      type: 'samosbor_warning',
      zoneId: 3,
      severity: 3,
      privacy: 'public',
      tags: ['samosbor'],
    });
  }

  const saved = trimEventHistoryForSave(state);
  assert.equal(saved.recentEvents.capacity, WORLD_EVENT_RECENT_CAPACITY);
  assert.equal(saved.recentEvents.count, WORLD_EVENT_RECENT_CAPACITY);
  assert.equal(saved.zoneEvents[3].capacity, WORLD_EVENT_ZONE_CAPACITY);
  assert.equal(saved.zoneEvents[3].count, WORLD_EVENT_ZONE_CAPACITY);
});

test('AG82 idol branch completion returns the idol and publishes branch context', () => {
  initFactionRelations();
  const branch = SIDE_QUESTS.find(q => q.id === 'idol_ministry_registration');
  assert.ok(branch);

  const state = makeGameState({
    currentFloor: FloorLevel.MINISTRY,
    worldEvents: createWorldEventState(),
  });
  const player = testActor({ inventory: [{ defId: 'idol_chernobog', count: 1 }] });
  const giver = testActor({
    id: 2,
    type: EntityType.NPC,
    name: 'Вера Пропускова',
    faction: Faction.CITIZEN,
    occupation: Occupation.SECRETARY,
  });
  state.quests.push({
    id: 1,
    type: QuestType.FETCH,
    giverId: giver.id,
    giverName: giver.name ?? '???',
    desc: branch.desc,
    targetItem: branch.targetItem,
    targetCount: branch.targetCount,
    rewardItem: branch.rewardItem,
    rewardCount: branch.rewardCount,
    extraRewards: branch.extraRewards,
    relationDelta: branch.relationDelta,
    xpReward: branch.xpReward,
    moneyReward: branch.moneyReward,
    sideQuestId: branch.id,
    eventTags: branch.eventTags ? [...branch.eventTags] : undefined,
    eventData: branch.eventData ? { ...branch.eventData } : undefined,
    eventPrivacy: branch.eventPrivacy,
    eventSeverity: branch.eventSeverity,
    eventTargetName: branch.eventTargetName,
    done: false,
  });

  checkQuests(player, new World(), [player, giver], state, state.msgs);

  assert.equal(state.quests[0].done, true);
  assert.equal(player.inventory?.find(i => i.defId === 'idol_chernobog')?.count, 1);
  const event = getRecentEvents(state, { tags: ['idol_branch'], limit: 1 })[0];
  assert.ok(event);
  assert.equal(event.data?.mainPlotItemReturned, true);
  assert.equal(event.tags.includes('ministry'), true);
  assert.equal(event.tags.includes('report'), true);
});

test('economy state normalizes invalid resources and preserves valid saved values', () => {
  const normalized = normalizeEconomyState({
    priceVersion: 3,
    floors: {
      [FloorLevel.LIVING]: {
        floor: FloorLevel.LIVING,
        resources: {
          drink_water: { stock: Number.NaN, target: 50, lastDelta: Number.POSITIVE_INFINITY },
        },
        lastTickAt: 42,
      },
    },
  });

  const floor = normalized.floors[FloorLevel.LIVING]!;
  const base = RESOURCES.find(r => r.id === 'drink_water')!.baseStock;
  assert.equal(normalized.priceVersion, 3);
  assert.equal(floor.resources.drink_water.stock, base);
  assert.equal(floor.resources.drink_water.target, 50);
  assert.equal(floor.resources.drink_water.lastDelta, 0);
  assert.equal(floor.lastTickAt, 42);
});

test('economy save normalization fills missing floors and drops unknown resources', () => {
  const state = makeGameState({ currentFloor: FloorLevel.KVARTIRY });

  normalizeGameEconomy(state, {
    priceVersion: 9,
    floors: {
      [FloorLevel.LIVING]: {
        floor: FloorLevel.LIVING,
        resources: {
          unknown_resource: { stock: 999, target: 999, lastDelta: 0 },
          food: { stock: 20, target: 140, lastDelta: -4 },
        },
        lastTickAt: 77,
      },
    },
  });

  const saved = economyForSave(state);
  const living = saved.floors[FloorLevel.LIVING]!;
  const current = saved.floors[FloorLevel.KVARTIRY]!;
  assert.equal(saved.priceVersion, 9);
  assert.ok(living, 'saved living economy should exist');
  assert.ok(current, 'current floor economy should be created lazily');
  assert.equal('unknown_resource' in living.resources, false);
  assert.equal(living.resources.food.stock, 20);
  assert.equal(current.floor, FloorLevel.KVARTIRY);
});

test('economy resource spending clamps stock and affects item prices', () => {
  const state = makeGameState({ time: 100, currentFloor: FloorLevel.LIVING });
  const economy = ensureEconomyState(state);
  economy.floors[FloorLevel.LIVING] = createEconomyFloorState(FloorLevel.LIVING);

  assert.equal(changeResourceStock(state, 'drink_water', -119), true);
  assert.equal(getResourceScarcity(state, 'drink_water'), 4);
  assert.equal(getAdjustedItemPrice(state, 'water'), 8);
  assert.equal(spendResources(state, [{ id: 'drink_water', count: 2 }]), false);
  assert.equal(spendResources(state, [{ id: 'drink_water', count: 1 }]), true);
  assert.equal(getResourceScarcity(state, 'drink_water'), 4);
});

test('economy price cache invalidates when stock changes and debug summary stays bounded', () => {
  const state = makeGameState({ time: 200, currentFloor: FloorLevel.LIVING });
  const economy = ensureEconomyState(state);
  economy.floors[FloorLevel.LIVING] = createEconomyFloorState(FloorLevel.LIVING);

  const baseWaterPrice = getAdjustedItemPrice(state, 'water');
  assert.equal(changeResourceStock(state, 'drink_water', -60), true);
  assert.ok(getAdjustedItemPrice(state, 'water') > baseWaterPrice);

  const lines = summarizeEconomy(state, 3);
  assert.equal(lines.length, 3);
  assert.ok(lines[0].includes('Питьевая вода'));
  assert.ok(lines.every(line => line.includes(' x')));
});

function testActor(overrides: Partial<Entity> = {}): Entity {
  return {
    id: 1,
    type: EntityType.PLAYER,
    x: 0,
    y: 0,
    angle: 0,
    pitch: 0,
    alive: true,
    speed: 0,
    sprite: 0,
    name: 'Вы',
    faction: Faction.PLAYER,
    inventory: [],
    ...overrides,
  };
}

function testContainer(overrides: Partial<WorldContainer> = {}): WorldContainer {
  return {
    id: 1,
    x: 0,
    y: 0,
    floor: FloorLevel.LIVING,
    roomId: 1,
    zoneId: 1,
    kind: ContainerKind.EMERGENCY_BOX,
    name: 'Тестовый ящик',
    inventory: [],
    capacitySlots: 1,
    access: 'public',
    discovered: true,
    tags: [],
    ...overrides,
  };
}

test('container take/put refuses full targets without changing source counts', () => {
  const state = makeGameState({ worldEvents: createWorldEventState() });
  const fullPlayer = testActor({
    inventory: Array.from({ length: 25 }, () => ({ defId: 'bread', count: getStack(ITEMS.bread) })),
  });
  const waterBox = testContainer({ inventory: [{ defId: 'water', count: 1 }] });

  assert.equal(takeFromContainer(waterBox, fullPlayer, 0, 1, state), false);
  assert.equal(waterBox.inventory[0].count, 1);
  assert.equal(fullPlayer.inventory?.length, 25);

  const donor = testActor({ inventory: [{ defId: 'water', count: 1 }] });
  const fullBox = testContainer({ inventory: [{ defId: 'bread', count: getStack(ITEMS.bread) }] });

  assert.equal(putIntoContainer(fullBox, donor, 0, 1), false);
  assert.deepEqual(donor.inventory, [{ defId: 'water', count: 1 }]);
  assert.deepEqual(fullBox.inventory, [{ defId: 'bread', count: getStack(ITEMS.bread) }]);
});

test('container put moves exactly one selected stack unit', () => {
  const actor = testActor({ inventory: [{ defId: 'water', count: 2 }] });
  const box = testContainer({ inventory: [{ defId: 'water', count: 1 }] });

  assert.equal(putIntoContainer(box, actor, 0, 1), true);
  assert.deepEqual(actor.inventory, [{ defId: 'water', count: 1 }]);
  assert.deepEqual(box.inventory, [{ defId: 'water', count: 2 }]);
});

test('witnessed container theft marks audit, memory, event context, and faction pressure once', () => {
  initFactionRelations();
  const state = makeGameState({
    time: 345,
    currentFloor: FloorLevel.LIVING,
    worldEvents: createWorldEventState(),
  });
  const world = new World();
  world.rooms[0] = {
    id: 0,
    type: RoomType.STORAGE,
    x: 10, y: 10, w: 6, h: 6,
    doors: [],
    sealed: false,
    name: 'Тестовый склад',
    apartmentId: -1,
    wallTex: Tex.CONCRETE,
    floorTex: Tex.F_CONCRETE,
  };
  world.zones[0] = { id: 0, cx: 12, cy: 12, faction: ZoneFaction.CITIZEN, hasLift: false, fogged: false, level: 1, hqRoomId: -1 };
  for (let y = 10; y < 16; y++) {
    for (let x = 10; x < 16; x++) {
      world.set(x, y, Cell.FLOOR);
      world.roomMap[world.idx(x, y)] = 0;
      world.zoneMap[world.idx(x, y)] = 0;
    }
  }

  const player = testActor({ id: 0, x: 11, y: 11, faction: Faction.PLAYER });
  const witness = testActor({
    id: 77,
    type: EntityType.NPC,
    x: 12.5,
    y: 12.5,
    name: 'Свидетель',
    faction: Faction.CITIZEN,
    inventory: [],
  });
  const box = testContainer({
    id: 22,
    x: 12,
    y: 12,
    roomId: 0,
    zoneId: 0,
    access: 'faction',
    faction: Faction.CITIZEN,
    inventory: [{ defId: 'water', count: 2 }],
    capacitySlots: 4,
    tags: ['food'],
  });
  world.addContainer(box);

  assert.equal(takeFromContainer(box, player, 0, 1, { state, world, entities: [player, witness] }), true);

  const event = getRecentEvents(state, { type: 'item_stolen', limit: 1 })[0];
  assert.equal(event.privacy, 'witnessed');
  assert.equal(event.severity, 5);
  assert.equal(event.data?.witnessCount, 1);
  assert.deepEqual(event.data?.witnessIds, [77]);
  assert.equal(box.lastAuditAt, 345);
  assert.deepEqual(box.stolenItemIds, ['water']);
  assert.equal(getNpcMemory(witness, state.time).hurtByPlayer, 1);
  assert.equal(getNpcMemory(witness, state.time).trustPlayer, -14);
  assert.equal(getFactionRel(Faction.CITIZEN, Faction.PLAYER), 46);
});

test('saved containers outside regenerated topology are dropped on restore', () => {
  const world = new World();
  world.rooms[0] = {
    id: 0,
    type: RoomType.STORAGE,
    x: 10, y: 10, w: 5, h: 5,
    doors: [],
    sealed: false,
    name: 'Тестовый склад',
    apartmentId: -1,
    wallTex: Tex.CONCRETE,
    floorTex: Tex.F_CONCRETE,
  };
  world.zones[0] = { id: 0, cx: 12, cy: 12, faction: ZoneFaction.CITIZEN, hasLift: false, fogged: false, level: 1, hqRoomId: -1 };
  for (let y = 10; y < 15; y++) {
    for (let x = 10; x < 15; x++) {
      world.set(x, y, Cell.FLOOR);
      world.roomMap[world.idx(x, y)] = 0;
      world.zoneMap[world.idx(x, y)] = 0;
    }
  }

  const restored = restoreValidContainers(world, FloorLevel.LIVING, [
    {
      ...testContainer({ id: 11, x: 11, y: 11, roomId: 0, zoneId: 0, capacitySlots: 0, inventory: [{ defId: 'water', count: 2 }] }),
      access: 'invalid',
    },
    testContainer({ id: 12, x: 50, y: 50, roomId: 0, zoneId: 0, capacitySlots: 4, inventory: [{ defId: 'bread', count: 1 }] }),
  ]);

  assert.equal(restored, 1);
  assert.equal(world.containers.length, 1);
  assert.equal(world.containers[0].id, 11);
  assert.equal(world.containers[0].capacitySlots, 8);
  assert.equal(world.containers[0].access, 'public');
  assert.equal(world.containerById.has(11), true);
  assert.equal(world.containerById.has(12), false);
});

test('production state cannot write output into another floor container id', () => {
  const state = makeGameState({
    currentFloor: FloorLevel.KVARTIRY,
    time: 1000,
    worldEvents: createWorldEventState(),
  });
  (state as typeof state & { production: ProductionState[] }).production = [{
    floor: FloorLevel.LIVING,
    roomId: 7,
    factoryId: 'metal_shop',
    recipeId: 'cut_pipe',
    progressSec: 0,
    nextTickAt: 0,
    outputContainerId: 1,
  }];

  const world = new World();
  world.rooms[7] = {
    id: 7,
    type: RoomType.COMMON,
    x: 8, y: 8, w: 6, h: 6,
    doors: [],
    sealed: false,
    name: 'Тестовая комната другого этажа',
    apartmentId: -1,
    wallTex: Tex.CONCRETE,
    floorTex: Tex.F_CONCRETE,
  };
  world.zones[0] = { id: 0, cx: 10, cy: 10, faction: ZoneFaction.CITIZEN, hasLift: false, fogged: false, level: 1, hqRoomId: -1 };
  const box = testContainer({
    id: 1,
    floor: FloorLevel.KVARTIRY,
    roomId: 7,
    zoneId: 0,
    inventory: [],
    capacitySlots: 4,
    tags: ['tools'],
  });
  world.addContainer(box);

  assert.equal(tickProduction(state, world, true), 0);
  assert.deepEqual(box.inventory, []);
});

test('production room registration replaces stale current-floor output containers', () => {
  const state = makeGameState({
    currentFloor: FloorLevel.LIVING,
    time: 1000,
    worldEvents: createWorldEventState(),
  });
  (state as typeof state & { production: ProductionState[] }).production = [{
    floor: FloorLevel.LIVING,
    roomId: 0,
    factoryId: 'metal_shop',
    recipeId: 'cut_pipe',
    progressSec: 0,
    nextTickAt: 0,
    outputContainerId: 999,
  }];

  const world = new World();
  world.rooms[0] = {
    id: 0,
    type: RoomType.PRODUCTION,
    x: 10, y: 10, w: 7, h: 7,
    doors: [],
    sealed: false,
    name: 'Цех металла',
    apartmentId: -1,
    wallTex: Tex.METAL,
    floorTex: Tex.F_CONCRETE,
  };
  world.zones[0] = { id: 0, cx: 13, cy: 13, faction: ZoneFaction.CITIZEN, hasLift: false, fogged: false, level: 1, hqRoomId: -1 };
  for (let y = 10; y < 17; y++) {
    for (let x = 10; x < 17; x++) {
      world.set(x, y, Cell.FLOOR);
      world.roomMap[world.idx(x, y)] = 0;
      world.zoneMap[world.idx(x, y)] = 0;
    }
  }

  ensureProductionRooms(state, world);

  const production = (state as typeof state & { production: ProductionState[] }).production;
  assert.equal(production.length, 1);
  assert.notEqual(production[0].outputContainerId, 999);
  assert.equal(world.containerById.has(production[0].outputContainerId), true);
  assert.equal(world.containerById.get(production[0].outputContainerId)?.roomId, 0);
});

test('nearby production output marks container and reaches world log', () => {
  const state = makeGameState({
    currentFloor: FloorLevel.LIVING,
    time: 1000,
    worldEvents: createWorldEventState(),
  });
  const world = new World();
  world.rooms[0] = {
    id: 0,
    type: RoomType.PRODUCTION,
    x: 10, y: 10, w: 7, h: 7,
    doors: [],
    sealed: false,
    name: 'Цех металла',
    apartmentId: -1,
    wallTex: Tex.METAL,
    floorTex: Tex.F_CONCRETE,
  };
  for (let y = 10; y < 17; y++) {
    for (let x = 10; x < 17; x++) {
      world.set(x, y, Cell.FLOOR);
      world.roomMap[world.idx(x, y)] = 0;
    }
  }
  world.zones[0] = { id: 0, cx: 13, cy: 13, faction: ZoneFaction.CITIZEN, hasLift: false, fogged: false, level: 1, hqRoomId: -1 };
  const player = testActor({ id: 0, x: 13, y: 13 });

  assert.equal(tickProduction(state, world, true, player), 1);
  const output = world.containers.find(c => c.tags.includes('production_output'));
  assert.ok(output);
  assert.equal(output.factoryId, 'metal_shop');
  assert.equal(output.lastProducedItemId, 'pipe');
  assert.equal(getRecentEvents(state, { type: 'room_produced_items', limit: 1 })[0]?.severity, 3);
  assert.ok(state.msgLog.some(entry => entry.text.includes('Цех выдал')));
});

test('slime furnace consumes a sample item before producing cleanup output', () => {
  const state = makeGameState({
    currentFloor: FloorLevel.MAINTENANCE,
    time: 1000,
    worldEvents: createWorldEventState(),
  });
  const world = new World();
  world.rooms[0] = {
    id: 0,
    type: RoomType.PRODUCTION,
    x: 10, y: 10, w: 7, h: 7,
    doors: [],
    sealed: false,
    name: 'Печь деактивации слизи',
    apartmentId: -1,
    wallTex: Tex.PIPE,
    floorTex: Tex.F_CONCRETE,
  };
  for (let y = 10; y < 17; y++) {
    for (let x = 10; x < 17; x++) {
      world.set(x, y, Cell.FLOOR);
      world.roomMap[world.idx(x, y)] = 0;
    }
  }
  world.zones[0] = { id: 0, cx: 13, cy: 13, faction: ZoneFaction.LIQUIDATOR, hasLift: false, fogged: false, level: 1, hqRoomId: -1 };
  world.addContainer(testContainer({
    id: 1,
    x: 12,
    y: 12,
    floor: FloorLevel.MAINTENANCE,
    roomId: 0,
    zoneId: 0,
    inventory: [{ defId: 'slime_sample_brown', count: 1 }],
    capacitySlots: 4,
    tags: ['cleanup', 'slime'],
  }));

  assert.equal(tickProduction(state, world, true), 1);
  const output = world.containerById.get(1);
  assert.ok(output);
  assert.equal(output.inventory.some(item => item.defId === 'slime_sample_brown'), false);
  assert.equal(output.inventory.find(item => item.defId === 'deactivated_residue')?.count, 2);
  assert.equal(output.inventory.find(item => item.defId === 'gasmask_filter')?.count, 1);
  const event = getRecentEvents(state, { type: 'room_produced_items', limit: 1 })[0];
  assert.ok(event.tags.includes('furnace_used'));
  assert.ok(event.tags.includes('deactivation_completed'));
});

test('contract spawn creates a normal quest and contract event', () => {
  const state = makeGameState({ clock: { hour: 10, minute: 0, totalMinutes: 120 }, worldEvents: createWorldEventState() });

  assert.equal(spawnContract(state), true);
  assert.equal(state.quests.length, 1);
  assert.ok(state.quests[0].contractId);
  assert.ok((state.quests[0].timeLimitMinutes ?? 0) >= 60);
  assert.ok((state.quests[0].expiresAtMinutes ?? 0) > state.clock.totalMinutes);
  assert.equal(getRecentEvents(state, { type: 'contract_created', limit: 1 })[0]?.data?.contractId, state.quests[0].contractId);
});

test('NPC assignment offer can use contract templates as timed contract quests', () => {
  const state = makeGameState({ worldEvents: createWorldEventState() });
  const world = new World();
  world.set(10, 10, Cell.FLOOR);
  world.rooms = [{
    id: 0,
    type: RoomType.OFFICE,
    x: 8, y: 8, w: 6, h: 6,
    doors: [],
    sealed: false,
    name: 'Тестовая контора',
    apartmentId: -1,
    wallTex: Tex.CONCRETE,
    floorTex: Tex.F_CONCRETE,
  }];
  world.roomMap[world.idx(10, 10)] = 0;
  world.zones[0] = { id: 0, cx: 10, cy: 10, faction: ZoneFaction.CITIZEN, hasLift: false, fogged: false, level: 1, hqRoomId: -1 };
  const npc = testActor({
    id: 42,
    type: EntityType.NPC,
    x: 10,
    y: 10,
    name: 'Кладовщик Тестов',
    faction: Faction.CITIZEN,
    occupation: Occupation.STOREKEEPER,
    canGiveQuest: true,
  });
  const player = testActor({ id: 0, x: 11, y: 10 });
  const originalRandom = Math.random;

  try {
    Math.random = () => 0;
    offerQuest(npc, player, world, [player, npc], state, state.msgs);
  } finally {
    Math.random = originalRandom;
  }

  assert.equal(state.quests.length, 1);
  assert.ok(state.quests[0].contractId);
  assert.ok((state.quests[0].timeLimitMinutes ?? 0) >= 60);
  assert.ok((state.quests[0].expiresAtMinutes ?? 0) > state.clock.totalMinutes);
  assert.equal(npc.questId, state.quests[0].id);
  assert.equal(getRecentEvents(state, { type: 'contract_created', limit: 1 })[0]?.data?.contractId, state.quests[0].contractId);
});

test('procedural quest offers have no global active quest cap', () => {
  const state = makeGameState({ worldEvents: createWorldEventState() });
  state.quests = Array.from({ length: 12 }, (_, i) => ({
    id: 100 + i,
    type: QuestType.FETCH,
    giverId: 100 + i,
    giverName: `NPC ${i}`,
    desc: 'Старое процедурное задание',
    targetItem: 'bread',
    targetCount: 1,
    done: false,
  }));
  const world = new World();
  world.set(10, 10, Cell.FLOOR);
  world.rooms = [{
    id: 0,
    type: RoomType.OFFICE,
    x: 8, y: 8, w: 6, h: 6,
    doors: [],
    sealed: false,
    name: 'Тестовая контора',
    apartmentId: -1,
    wallTex: Tex.CONCRETE,
    floorTex: Tex.F_CONCRETE,
  }];
  world.roomMap[world.idx(10, 10)] = 0;
  world.zones[0] = { id: 0, cx: 10, cy: 10, faction: ZoneFaction.CITIZEN, hasLift: false, fogged: false, level: 1, hqRoomId: -1 };
  const npc = testActor({
    id: 42,
    type: EntityType.NPC,
    x: 10,
    y: 10,
    name: 'Безлимитный диспетчер',
    faction: Faction.CITIZEN,
    occupation: Occupation.STOREKEEPER,
    canGiveQuest: true,
  });
  const player = testActor({ id: 0, x: 11, y: 10 });
  const originalRandom = Math.random;

  try {
    Math.random = () => 0;
    offerQuest(npc, player, world, [player, npc], state, state.msgs);
  } finally {
    Math.random = originalRandom;
  }

  assert.equal(state.quests.length, 13);
  assert.equal(npc.questId, state.quests[12].id);
});

test('timed procedural quests fail when their deadline passes', () => {
  const state = makeGameState({ clock: { hour: 8, minute: 0, totalMinutes: 0 }, worldEvents: createWorldEventState() });
  const player = testActor({ id: 0 });
  const world = new World();

  assert.equal(spawnContract(state), true);
  const q = state.quests[0];
  q.expiresAtMinutes = 1;
  state.clock.totalMinutes = 2;

  checkQuests(player, world, [player], state, state.msgs);

  assert.equal(q.done, true);
  assert.equal(q.failed, true);
  assert.equal(getRecentEvents(state, { type: 'contract_failed', limit: 1 })[0]?.data?.reason, 'deadline');
});
