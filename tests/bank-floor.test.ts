import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import {
  Cell,
  EntityType,
  FloorLevel,
  LiftDirection,
} from '../src/core/types';
import {
  DESIGN_FLOOR_ROUTES,
  designFloorAtZ,
  designFloorById,
} from '../src/data/design_floors';
import { PROCEDURAL_FLOOR_ZS } from '../src/data/procedural_floors';
import { getSideQuestRegistrySnapshot } from '../src/data/plot';
import {
  commitFloorRunEntry,
  resolveFloorRunRoute,
  setFloorRunState,
} from '../src/systems/procedural_floors';
import { getRecentEvents } from '../src/systems/events';
import { putIntoContainer, takeFromContainer } from '../src/systems/containers';
import { generateDesignFloor, validateDesignFloorGenerators } from '../src/gen/design_floors/manifest';
import {
  BANK_FLOOR_BASE_FLOOR,
  BANK_FLOOR_ROUTE_ID,
  BANK_FLOOR_Z,
  BANK_ROOM_NAMES,
} from '../src/gen/design_floors/bank_floor';
import { makeGameState, makeTestPlayer } from './helpers';

test('bank_floor is registered as an authored Ministry-band route', () => {
  validateDesignFloorGenerators();

  const route = designFloorById(BANK_FLOOR_ROUTE_ID);
  assert.equal(route?.z, BANK_FLOOR_Z);
  assert.equal(route?.baseFloor, BANK_FLOOR_BASE_FLOOR);
  assert.equal(route?.displayName, 'Банковский этаж');
  assert.equal(designFloorAtZ(BANK_FLOOR_Z)?.id, BANK_FLOOR_ROUTE_ID);
  assert.equal(PROCEDURAL_FLOOR_ZS.includes(BANK_FLOOR_Z), false);
  assert.equal(DESIGN_FLOOR_ROUTES.some(def => def.id === BANK_FLOOR_ROUTE_ID), true);
});

test('normal lift route reaches bank_floor between Ministry and Raionsovet archive', () => {
  const state = makeGameState({ currentFloor: FloorLevel.MINISTRY });
  setFloorRunState(state, { runSeed: 2214, currentZ: 30, specs: {}, visited: {} }, FloorLevel.MINISTRY);

  for (const expectedZ of [29, 28, 27]) {
    const gap = resolveFloorRunRoute(state, LiftDirection.DOWN);
    assert.equal(gap?.z, expectedZ);
    assert.equal(gap?.procedural, true);
    commitFloorRunEntry(state, gap!);
  }

  const bank = resolveFloorRunRoute(state, LiftDirection.DOWN);
  assert.equal(bank?.z, BANK_FLOOR_Z);
  assert.equal(bank?.designFloorId, BANK_FLOOR_ROUTE_ID);
  assert.equal(bank?.baseFloor, BANK_FLOOR_BASE_FLOOR);
  commitFloorRunEntry(state, bank!);

  for (const expectedZ of [25, 24, 23]) {
    const nextGap = resolveFloorRunRoute(state, LiftDirection.DOWN);
    assert.equal(nextGap?.z, expectedZ);
    assert.equal(nextGap?.procedural, true);
    commitFloorRunEntry(state, nextGap!);
  }

  const archive = resolveFloorRunRoute(state, LiftDirection.DOWN);
  assert.equal(archive?.z, 22);
  assert.equal(archive?.designFloorId, 'raionsovet_archive');
});

test('bank_floor generator creates named banking rooms, NPCs, containers and passable spawn', () => {
  const gen = generateDesignFloor(BANK_FLOOR_ROUTE_ID);
  const spawnCell = gen.world.cells[gen.world.idx(Math.floor(gen.spawnX), Math.floor(gen.spawnY))];
  const names = new Set(gen.world.rooms.map(room => room.name));
  const npcs = gen.entities.filter(e => e.type === EntityType.NPC);
  const upLift = gen.world.liftDir.some((dir, idx) => dir === LiftDirection.UP && gen.world.cells[idx] === Cell.LIFT);
  const downLift = gen.world.liftDir.some((dir, idx) => dir === LiftDirection.DOWN && gen.world.cells[idx] === Cell.LIFT);

  assert.equal(spawnCell, Cell.FLOOR);
  assert.equal(upLift, true);
  assert.equal(downLift, true);
  for (const roomName of [
    BANK_ROOM_NAMES.hall,
    BANK_ROOM_NAMES.teller,
    BANK_ROOM_NAMES.deposit,
    BANK_ROOM_NAMES.credit,
    BANK_ROOM_NAMES.vault,
    BANK_ROOM_NAMES.queue,
    BANK_ROOM_NAMES.bypass,
  ]) {
    assert.equal(names.has(roomName), true, roomName);
  }
  assert.equal(npcs.length >= 5, true);
  assert.equal(npcs.some(e => e.plotNpcId === 'bank_cashier_lyuba'), true);
  assert.equal(npcs.some(e => e.plotNpcId === 'bank_credit_prokhor'), true);
  assert.equal(gen.world.containers.some(c => c.tags.includes('banking') && c.tags.includes('deposit')), true);
  assert.equal(gen.world.containers.some(c => c.tags.includes('banking') && c.tags.includes('vault')), true);
});

test('bank_floor exposes legal deposit and risky vault interactions through existing systems', () => {
  const gen = generateDesignFloor(BANK_FLOOR_ROUTE_ID);
  const state = makeGameState({ currentFloor: BANK_FLOOR_BASE_FLOOR, time: 12 });
  const player = makeTestPlayer({
    id: 9999,
    x: gen.spawnX,
    y: gen.spawnY,
    speed: 3,
    hp: 100,
    maxHp: 100,
    money: 180,
    inventory: [{ defId: 'voluntary_receipt', count: 1 }],
  });
  const deposit = gen.world.containers.find(c => c.tags.includes('banking') && c.tags.includes('account'));
  const vault = gen.world.containers.find(c => c.tags.includes('banking') && c.tags.includes('vault'));

  assert.ok(deposit);
  assert.ok(vault);
  assert.equal(putIntoContainer(deposit, player, 0, 1, { state, world: gen.world, entities: gen.entities }), true);

  const depositEvent = getRecentEvents(state, { type: 'item_deposited', tags: ['banking', 'deposit'], limit: 1 })[0];
  assert.equal(depositEvent?.containerId, deposit.id);
  assert.equal(depositEvent?.data?.depositOutcome, 'deposit');

  player.x = vault.x + 0.5;
  player.y = vault.y + 0.5;
  assert.equal(takeFromContainer(vault, player, 0, 1, { state, world: gen.world, entities: gen.entities }), true);
  const theftEvent = getRecentEvents(state, { type: 'item_stolen', tags: ['banking', 'vault'], limit: 1 })[0];
  assert.equal(theftEvent?.containerId, vault.id);
  assert.equal(theftEvent?.tags.includes('theft'), true);
});

test('bank_floor registers banking side quests for deposit, loan, repayment and forged paper choices', () => {
  const ids = new Set(getSideQuestRegistrySnapshot().map(q => q.id));
  for (const id of [
    'bank_cash_deposit_50',
    'bank_take_corridor_loan',
    'bank_repay_corridor_loan',
    'bank_report_forged_debt_paper',
    'bank_cash_forged_debt_paper',
  ]) {
    assert.equal(ids.has(id), true, id);
  }
});
