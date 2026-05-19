import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import '../src/gen/living/caravan_exchange';

import { FloorLevel } from '../src/core/types';
import { CARAVAN_LANES, validateCaravanLanes } from '../src/data/caravans';
import { createEconomyFloorState } from '../src/data/economy';
import { getSideQuestRegistrySnapshot } from '../src/data/plot';
import {
  CARAVAN_TICK_SECONDS,
  ensureCaravanState,
  getCaravanResourceTariffMultiplier,
  payCaravanTariff,
  robCaravanCargo,
  tickCaravans,
} from '../src/systems/caravans';
import { ensureEconomyState } from '../src/systems/economy';
import { createWorldEventState, getRecentEvents, publishEvent } from '../src/systems/events';
import { makeGameState } from './helpers';

const LANE_QUEUE = 'kvartiry_living_food_water';
const LANE_NET = 'net_exchange_data';
const LANE_MARKET = 'production_black_market_88';

test('caravan lane definitions validate and cover required supply lanes', () => {
  assert.equal(CARAVAN_LANES.length >= 6, true);
  assert.deepEqual(validateCaravanLanes(), []);
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
  assert.equal(state.msgLog.some(entry => entry.text.includes('Квартиры -> жилая очередь')), true);
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
