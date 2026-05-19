import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import {
  Cell,
  FloorLevel,
  RoomType,
} from '../src/core/types';
import { World } from '../src/core/world';
import { NET_TERMINAL_GEN_NORMAL_MIN_TERMINALS } from '../src/data/net_terminal_gen';
import { ensureBankingState } from '../src/systems/banking';
import { createWorldEventState, getRecentEvents } from '../src/systems/events';
import {
  activateNetTerminalBank,
  clearNetTerminalGenTerminals,
  closeNetTerminalGen,
  getNetTerminalBankSnapshot,
  getNetTerminalGenTerminals,
  grantNetTerminalGenAccess,
  isNetTerminalBankOpen,
  isNetTerminalGenEditorOpen,
  moveNetTerminalBankAction,
  placeNetTerminalGenTerminalsForCurrentFloor,
  tryUseNetTerminalGen,
} from '../src/systems/net_terminal_gen';
import { addTestRoom, makeGameState, makeTestPlayer } from './helpers';

const DIRS: readonly [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];

test('normal net terminal placement puts at least sixteen usable terminals on a roomy floor', () => {
  clearNetTerminalGenTerminals();
  const world = makeTerminalWorld();
  const state = makeGameState({ currentFloor: FloorLevel.LIVING });

  const placed = placeNetTerminalGenTerminalsForCurrentFloor(world, state, { seed: 1234 });
  const terminals = getNetTerminalGenTerminals();

  assert.equal(placed, NET_TERMINAL_GEN_NORMAL_MIN_TERMINALS);
  assert.equal(terminals.length, NET_TERMINAL_GEN_NORMAL_MIN_TERMINALS);
  for (const terminal of terminals) {
    const idx = terminal.idx;
    assert.equal(world.aptMask[idx], 0);
    assert.equal(world.hermoWall[idx], 0);
    assert.notEqual(world.cells[idx], Cell.DOOR);
    assert.notEqual(world.cells[idx], Cell.LIFT);
    assert.notEqual(world.cells[idx], Cell.ABYSS);
    assert.ok(hasAdjacentPassable(world, terminal.x, terminal.y));
  }

  clearNetTerminalGenTerminals();
});

test('using a net terminal without GEN opens bank access instead of denied-only access', () => {
  clearNetTerminalGenTerminals();
  const world = makeTerminalWorld();
  const state = makeGameState({ worldEvents: createWorldEventState() });
  const player = makeTestPlayer({ x: 100, y: 100, money: 100 });
  placeNetTerminalGenTerminalsForCurrentFloor(world, state, { seed: 2 });
  const terminal = getNetTerminalGenTerminals()[0];
  assert.ok(terminal);

  const result = tryUseNetTerminalGen(world, player, state, terminal.x, terminal.y);

  assert.equal(result.handled, true);
  assert.equal(result.access, false);
  assert.equal(result.mode, 'bank');
  assert.equal(isNetTerminalBankOpen(), true);
  assert.equal(getNetTerminalBankSnapshot(state, player).cashRubles, 100);

  closeNetTerminalGen();
  clearNetTerminalGenTerminals();
});

test('net terminal bank can deposit cash and withdraw account rubles', () => {
  clearNetTerminalGenTerminals();
  const world = makeTerminalWorld();
  const state = makeGameState({ worldEvents: createWorldEventState() });
  const player = makeTestPlayer({ x: 100, y: 100, money: 100 });
  placeNetTerminalGenTerminalsForCurrentFloor(world, state, { seed: 3 });
  const terminal = getNetTerminalGenTerminals()[0];
  assert.ok(terminal);
  tryUseNetTerminalGen(world, player, state, terminal.x, terminal.y);

  assert.equal(activateNetTerminalBank(state, player), true);
  assert.equal(player.money, 90);
  assert.equal(ensureBankingState(state).accountRubles, 10);

  moveNetTerminalBankAction(1);
  assert.equal(activateNetTerminalBank(state, player), true);
  assert.equal(player.money, 100);
  assert.equal(ensureBankingState(state).accountRubles, 0);

  const events = getRecentEvents(state, { tags: ['banking', 'account'], limit: 2 });
  assert.equal(events.length, 2);
  assert.equal(events[0].tags.includes('withdraw'), true);
  assert.equal(events[1].tags.includes('deposit'), true);

  closeNetTerminalGen();
  clearNetTerminalGenTerminals();
});

test('GEN access still routes terminals to the map editor path', () => {
  clearNetTerminalGenTerminals();
  const world = makeTerminalWorld();
  const state = makeGameState();
  const player = makeTestPlayer({ x: 100, y: 100, money: 100 });
  placeNetTerminalGenTerminalsForCurrentFloor(world, state, { seed: 4 });
  const terminal = getNetTerminalGenTerminals()[0];
  assert.ok(terminal);
  grantNetTerminalGenAccess(state);

  const result = tryUseNetTerminalGen(world, player, state, terminal.x, terminal.y);

  assert.equal(result.handled, true);
  assert.equal(result.access, true);
  assert.equal(result.mode, 'editor');
  assert.equal(isNetTerminalGenEditorOpen(), true);

  closeNetTerminalGen();
  clearNetTerminalGenTerminals();
});

function makeTerminalWorld(): World {
  const world = new World();
  addTestRoom(world, {
    type: RoomType.LIVING,
    x: 96,
    y: 96,
    w: 48,
    h: 48,
    name: 'Тестовый зал',
  });
  return world;
}

function hasAdjacentPassable(world: World, x: number, y: number): boolean {
  for (const [dx, dy] of DIRS) {
    const nx = world.wrap(x + dx);
    const ny = world.wrap(y + dy);
    const idx = world.idx(nx, ny);
    if ((world.cells[idx] === Cell.FLOOR || world.cells[idx] === Cell.WATER) && !world.solid(nx, ny)) return true;
  }
  return false;
}
