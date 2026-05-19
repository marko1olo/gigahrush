import assert from 'node:assert/strict';
import test from 'node:test';
import { EntityType, Faction, FloorLevel, type Entity, type GameState } from '../src/core/types';
import { createEconomyFloorState } from '../src/data/economy';
import { ensureEconomyState, getEconomyQuote } from '../src/systems/economy';
import { buyFromNpc, sellToNpc } from '../src/systems/trade';
import { getRecentEvents } from '../src/systems/events';
import { makeGameState } from './helpers';

function actor(overrides: Partial<Entity> = {}): Entity {
  return {
    id: 1,
    type: EntityType.NPC,
    x: 0,
    y: 0,
    angle: 0,
    pitch: 0,
    alive: true,
    speed: 0,
    sprite: 0,
    name: 'Торговец',
    faction: Faction.CITIZEN,
    inventory: [],
    money: 100,
    ...overrides,
  };
}

function resetFloor(state: GameState, floor: FloorLevel): void {
  const economy = ensureEconomyState(state);
  economy.floors[floor] = createEconomyFloorState(floor);
}

function resourceStock(state: GameState, floor: FloorLevel, resourceId: string): number {
  const economy = ensureEconomyState(state);
  return economy.floors[floor]?.resources[resourceId]?.stock ?? 0;
}

test('floor demand makes water dearer on KVARTIRY than LIVING at the same stock', () => {
  const living = makeGameState({ currentFloor: FloorLevel.LIVING });
  const kvartiry = makeGameState({ currentFloor: FloorLevel.KVARTIRY });
  resetFloor(living, FloorLevel.LIVING);
  resetFloor(kvartiry, FloorLevel.KVARTIRY);

  const livingQuote = getEconomyQuote(living, 'water');
  const kvartiryQuote = getEconomyQuote(kvartiry, 'water');

  assert.ok(kvartiryQuote.buyPrice > livingQuote.buyPrice);
  assert.ok(kvartiryQuote.demandMultiplier > livingQuote.demandMultiplier);
});

test('maintenance local tariffs keep metal and tools no dearer than LIVING at normal stock', () => {
  const living = makeGameState({ currentFloor: FloorLevel.LIVING });
  const maintenance = makeGameState({ currentFloor: FloorLevel.MAINTENANCE });
  resetFloor(living, FloorLevel.LIVING);
  resetFloor(maintenance, FloorLevel.MAINTENANCE);

  assert.ok(getEconomyQuote(maintenance, 'metal_sheet').buyPrice <= getEconomyQuote(living, 'metal_sheet').buyPrice);
  assert.ok(getEconomyQuote(maintenance, 'flashlight').buyPrice <= getEconomyQuote(living, 'flashlight').buyPrice);
});

test('buying water from an NPC moves one item, money, event data and floor supply', () => {
  const state = makeGameState({ currentFloor: FloorLevel.LIVING });
  resetFloor(state, FloorLevel.LIVING);
  const player = actor({ id: 1, type: EntityType.PLAYER, name: 'Вы', faction: Faction.PLAYER, inventory: [], money: 10 });
  const npc = actor({ id: 2, inventory: [{ defId: 'water', count: 2 }], money: 5 });
  const beforeStock = resourceStock(state, FloorLevel.LIVING, 'drink_water');
  const quote = getEconomyQuote(state, 'water', { trader: npc });

  const result = buyFromNpc(state, player, npc, 0, { zoneId: 3 });

  assert.equal(result.ok, true);
  assert.equal(result.price, quote.buyPrice);
  assert.equal(player.money, 10 - quote.buyPrice);
  assert.equal(npc.money, 5 + quote.buyPrice);
  assert.equal(player.inventory?.[0]?.defId, 'water');
  assert.equal(player.inventory?.[0]?.count, 1);
  assert.equal(npc.inventory?.[0]?.count, 1);
  assert.equal(resourceStock(state, FloorLevel.LIVING, 'drink_water'), beforeStock - 1);

  const event = getRecentEvents(state, { limit: 1 })[0];
  assert.equal(event.itemId, 'water');
  assert.equal(event.data?.price, quote.buyPrice);
  assert.equal(event.data?.direction, 'npc_to_player');
  assert.equal(event.tags.includes('buy'), true);
});

test('selling water to an NPC moves one item, money, event data and floor supply', () => {
  const state = makeGameState({ currentFloor: FloorLevel.LIVING });
  resetFloor(state, FloorLevel.LIVING);
  const player = actor({ id: 1, type: EntityType.PLAYER, name: 'Вы', faction: Faction.PLAYER, inventory: [{ defId: 'water', count: 2 }], money: 1 });
  const npc = actor({ id: 2, inventory: [], money: 20 });
  const beforeStock = resourceStock(state, FloorLevel.LIVING, 'drink_water');
  const quote = getEconomyQuote(state, 'water', { trader: npc });

  const result = sellToNpc(state, player, npc, 0, { zoneId: 4 });

  assert.equal(result.ok, true);
  assert.equal(result.price, quote.sellPrice);
  assert.equal(player.money, 1 + quote.sellPrice);
  assert.equal(npc.money, 20 - quote.sellPrice);
  assert.equal(player.inventory?.[0]?.count, 1);
  assert.equal(npc.inventory?.[0]?.defId, 'water');
  assert.equal(npc.inventory?.[0]?.count, 1);
  assert.equal(resourceStock(state, FloorLevel.LIVING, 'drink_water'), beforeStock + 1);

  const event = getRecentEvents(state, { limit: 1 })[0];
  assert.equal(event.itemId, 'water');
  assert.equal(event.data?.price, quote.sellPrice);
  assert.equal(event.data?.direction, 'player_to_npc');
  assert.equal(event.tags.includes('sell'), true);
});

test('failed trades do not mutate money, inventories or resource stock', () => {
  const noMoneyState = makeGameState({ currentFloor: FloorLevel.LIVING });
  resetFloor(noMoneyState, FloorLevel.LIVING);
  const poorPlayer = actor({ id: 1, type: EntityType.PLAYER, faction: Faction.PLAYER, inventory: [], money: 0 });
  const waterSeller = actor({ id: 2, inventory: [{ defId: 'water', count: 1 }], money: 7 });
  const stockBeforeBuy = resourceStock(noMoneyState, FloorLevel.LIVING, 'drink_water');

  const buyResult = buyFromNpc(noMoneyState, poorPlayer, waterSeller, 0);

  assert.equal(buyResult.ok, false);
  assert.equal(buyResult.code, 'player_no_money');
  assert.equal(poorPlayer.money, 0);
  assert.equal(poorPlayer.inventory?.length, 0);
  assert.equal(waterSeller.money, 7);
  assert.equal(waterSeller.inventory?.[0]?.count, 1);
  assert.equal(resourceStock(noMoneyState, FloorLevel.LIVING, 'drink_water'), stockBeforeBuy);

  const noSpaceState = makeGameState({ currentFloor: FloorLevel.LIVING });
  resetFloor(noSpaceState, FloorLevel.LIVING);
  const seller = actor({ id: 3, type: EntityType.PLAYER, faction: Faction.PLAYER, inventory: [{ defId: 'water', count: 1 }], money: 2 });
  const fullNpc = actor({
    id: 4,
    inventory: Array.from({ length: 25 }, () => ({ defId: 'water', count: 999 })),
    money: 20,
  });
  const stockBeforeSell = resourceStock(noSpaceState, FloorLevel.LIVING, 'drink_water');

  const sellResult = sellToNpc(noSpaceState, seller, fullNpc, 0);

  assert.equal(sellResult.ok, false);
  assert.equal(sellResult.code, 'npc_no_space');
  assert.equal(seller.money, 2);
  assert.equal(seller.inventory?.[0]?.count, 1);
  assert.equal(fullNpc.money, 20);
  assert.equal(fullNpc.inventory?.length, 25);
  assert.equal(resourceStock(noSpaceState, FloorLevel.LIVING, 'drink_water'), stockBeforeSell);
});
