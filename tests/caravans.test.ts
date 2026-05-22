import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import '../src/gen/living/caravan_exchange';

import { Cell, Feature, FloorLevel, RoomType } from '../src/core/types';
import { World } from '../src/core/world';
import { CARAVAN_LANES, SMALL_CARAVAN_TEMPLATES, validateCaravanLanes, validateSmallCaravanTemplates } from '../src/data/caravans';
import { createEconomyFloorState } from '../src/data/economy';
import { getSideQuestRegistrySnapshot } from '../src/data/plot';
import {
  CARAVAN_TICK_SECONDS,
  ensureCaravanState,
  getCaravanResourceTariffMultiplier,
  getNearestSmallCaravan,
  payCaravanTariff,
  robCaravanCargo,
  spawnSmallCaravanNear,
  tickCaravans,
} from '../src/systems/caravans';
import { ensureEconomyState, getAdjustedItemPrice, getEconomyQuote } from '../src/systems/economy';
import { createWorldEventState, getRecentEvents, publishEvent } from '../src/systems/events';
import { addTestRoom, makeGameState, makeTestPlayer } from './helpers';

const LANE_QUEUE = 'kvartiry_living_food_water';
const LANE_NET = 'net_exchange_data';
const LANE_MARKET = 'production_black_market_88';

test('caravan lane definitions validate and cover required supply lanes', () => {
  assert.equal(CARAVAN_LANES.length >= 6, true);
  assert.deepEqual(validateCaravanLanes(), []);
  assert.equal(SMALL_CARAVAN_TEMPLATES.length >= 5, true);
  assert.deepEqual(validateSmallCaravanTemplates(), []);
  assert.equal(CARAVAN_LANES.some(lane => lane.id === LANE_QUEUE), true);
  assert.equal(CARAVAN_LANES.some(lane => lane.id === LANE_NET), true);
  assert.equal(CARAVAN_LANES.some(lane => lane.id === LANE_MARKET), true);
});

test('forced caravan tick moves stock between two floors and publishes visible events', () => {
  const state = makeGameState({
    currentFloor: FloorLevel.LIVING,
    time: 100,
    worldEvents: createWorldEventState(),
  });
  const economy = ensureEconomyState(state);
  economy.floors[FloorLevel.KVARTIRY] = createEconomyFloorState(FloorLevel.KVARTIRY);
  economy.floors[FloorLevel.LIVING] = createEconomyFloorState(FloorLevel.LIVING);

  const beforeKvFood = economy.floors[FloorLevel.KVARTIRY]!.resources.food.stock;
  const beforeLivingFood = economy.floors[FloorLevel.LIVING]!.resources.food.stock;

  assert.equal(tickCaravans(state, CARAVAN_TICK_SECONDS, true, 1), 1);

  assert.ok(economy.floors[FloorLevel.KVARTIRY]!.resources.food.stock < beforeKvFood);
  assert.ok(economy.floors[FloorLevel.LIVING]!.resources.food.stock > beforeLivingFood);
  assert.equal(
    getRecentEvents(state, { tags: ['caravan', 'tariff', 'supply_lane', LANE_QUEUE], limit: 1 }).length,
    1,
  );
  assert.equal(state.msgLog.some(entry => entry.text.includes('Квартиры -> Жилая: еда и вода')), true);
});

test('caravan tariff getter reflects robbery pressure and paid stabilization', () => {
  const state = makeGameState({
    currentFloor: FloorLevel.LIVING,
    time: 200,
    worldEvents: createWorldEventState(),
  });

  const before = getCaravanResourceTariffMultiplier(state, 'drink_water', FloorLevel.LIVING);
  assert.equal(robCaravanCargo(state, LANE_QUEUE), true);
  const pressured = getCaravanResourceTariffMultiplier(state, 'drink_water', FloorLevel.LIVING);
  assert.ok(pressured > before);

  assert.equal(payCaravanTariff(state, LANE_QUEUE), true);
  const stabilized = getCaravanResourceTariffMultiplier(state, 'drink_water', FloorLevel.LIVING);
  assert.ok(stabilized < pressured);
});

test('caravan tariffs feed item economy quotes and invalidate cached prices', () => {
  const state = makeGameState({
    currentFloor: FloorLevel.LIVING,
    time: 220,
    worldEvents: createWorldEventState(),
  });
  ensureEconomyState(state).floors[FloorLevel.LIVING] = createEconomyFloorState(FloorLevel.LIVING);

  const beforeTariff = getCaravanResourceTariffMultiplier(state, 'drink_water', FloorLevel.LIVING);
  const beforeQuote = getEconomyQuote(state, 'filtered_water');
  const cachedBefore = getAdjustedItemPrice(state, 'filtered_water');

  assert.equal(beforeQuote.tariffMultiplier, beforeTariff);
  assert.equal(beforeQuote.tags.includes('caravan_tariff'), true);
  assert.equal(robCaravanCargo(state, LANE_QUEUE), true);

  const pressuredTariff = getCaravanResourceTariffMultiplier(state, 'drink_water', FloorLevel.LIVING);
  const pressuredQuote = getEconomyQuote(state, 'filtered_water');

  assert.ok(pressuredTariff > beforeTariff);
  assert.equal(pressuredQuote.tariffMultiplier, pressuredTariff);
  assert.ok(pressuredQuote.buyPrice > beforeQuote.buyPrice);
  assert.ok(getAdjustedItemPrice(state, 'filtered_water') > cachedBefore);
});

test('caravan exchange registers route choices and quest events open or close lanes', () => {
  const questIds = new Set(
    getSideQuestRegistrySnapshot()
      .filter(quest => quest.id.startsWith('ag108_'))
      .map(quest => quest.id),
  );
  assert.deepEqual(
    [...questIds].sort(),
    ['ag108_close_market_lane', 'ag108_open_net_lane', 'ag108_pay_queue_tariff'],
  );

  const state = makeGameState({
    currentFloor: FloorLevel.LIVING,
    time: 300,
    worldEvents: createWorldEventState(),
  });
  assert.equal(ensureCaravanState(state).lanes[LANE_NET].open, false);

  publishEvent(state, {
    type: 'quest_completed',
    severity: 4,
    privacy: 'public',
    targetName: 'НЕТ-линия обменных данных открыта',
    tags: ['quest', 'completed', 'caravan', 'tariff', 'supply_lane', LANE_NET],
    data: { caravanAction: 'open_lane', laneId: LANE_NET },
  });
  assert.equal(ensureCaravanState(state).lanes[LANE_NET].open, true);

  assert.equal(ensureCaravanState(state).lanes[LANE_MARKET].open, true);
  publishEvent(state, {
    type: 'quest_completed',
    severity: 4,
    privacy: 'public',
    targetName: 'Маршрут рынка 88 сдан ревизору',
    tags: ['quest', 'completed', 'caravan', 'tariff', 'supply_lane', LANE_MARKET],
    data: { caravanAction: 'close_lane', laneId: LANE_MARKET },
  });
  assert.equal(ensureCaravanState(state).lanes[LANE_MARKET].open, false);
  assert.equal(getRecentEvents(state, { tags: ['caravan', 'supply_lane', LANE_NET], limit: 1 }).length, 1);
});

test('caravan contract completions apply escort, raid, reroute, report, and seat outcomes', () => {
  const state = makeGameState({
    currentFloor: FloorLevel.LIVING,
    time: 420,
    worldEvents: createWorldEventState(),
  });
  const caravans = ensureCaravanState(state);
  const queueStability = caravans.lanes[LANE_QUEUE].stability;
  const repairPressure = caravans.lanes.maintenance_living_tools.tariffPressure;

  publishEvent(state, {
    type: 'contract_completed',
    severity: 4,
    privacy: 'public',
    targetName: 'Довести малую очередь',
    tags: ['quest', 'contract', 'completed', 'caravan'],
    data: { contractId: 'caravan_escort_queue_porters' },
  });
  assert.ok(ensureCaravanState(state).lanes[LANE_QUEUE].stability > queueStability);

  publishEvent(state, {
    type: 'contract_completed',
    severity: 4,
    privacy: 'public',
    targetName: 'Снять мешок с очереди',
    tags: ['quest', 'contract', 'completed', 'caravan'],
    data: { contractId: 'caravan_raid_queue_cargo' },
  });
  assert.equal(ensureCaravanState(state).lanes[LANE_QUEUE].raids, 1);

  publishEvent(state, {
    type: 'contract_completed',
    severity: 4,
    privacy: 'public',
    targetName: 'Рискованный обход ремонтников',
    tags: ['quest', 'contract', 'completed', 'caravan'],
    data: { contractId: 'caravan_reroute_repair_crew' },
  });
  assert.ok(ensureCaravanState(state).lanes.maintenance_living_tools.tariffPressure > repairPressure);

  publishEvent(state, {
    type: 'contract_completed',
    severity: 4,
    privacy: 'public',
    targetName: 'Сдать серый маршрут',
    tags: ['quest', 'contract', 'completed', 'caravan'],
    data: { contractId: 'caravan_report_market88_smugglers' },
  });
  assert.equal(ensureCaravanState(state).lanes[LANE_MARKET].open, false);

  publishEvent(state, {
    type: 'contract_completed',
    severity: 3,
    privacy: 'local',
    targetName: 'Место в водном караване',
    tags: ['quest', 'contract', 'completed', 'caravan'],
    data: { contractId: 'caravan_buy_queue_seat' },
  });
  assert.equal(state.msgs.some(entry => entry.text.includes('Место в малом караване')), true);
});

test('small caravan runs open near service cells without creating new people', () => {
  const world = new World();
  addTestRoom(world, {
    id: 2,
    x: 20,
    y: 20,
    w: 18,
    h: 10,
    type: RoomType.OFFICE,
    name: 'Караванный тестовый узел',
  });
  world.cells[world.idx(23, 19)] = Cell.LIFT;
  world.features[world.idx(24, 20)] = Feature.LIFT_BUTTON;

  const player = makeTestPlayer({ id: 1, x: 26.5, y: 25.5 });
  const state = makeGameState({
    currentFloor: FloorLevel.LIVING,
    time: 600,
    worldEvents: createWorldEventState(),
  });
  const entities = [player];
  const nextId = { v: 2 };

  const run = spawnSmallCaravanNear(state, world, entities, nextId, player, 'queue_lift_porters');
  assert.ok(run);
  assert.equal(entities.length, 1);
  assert.equal(run.memberIds.length, 0);

  const nearest = getNearestSmallCaravan(state, world, player, 80);
  assert.equal(nearest?.id, run?.id);
  assert.equal(nearest?.laneId, LANE_QUEUE);
  assert.equal(nearest?.statusText, 'в пути');
});
