import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import {
  EntityType,
  Faction,
  FloorLevel,
  MonsterKind,
  Occupation,
  type Entity,
  type WorldEvent,
} from '../src/core/types';
import {
  CONTEXT_FACTION_EVENT_FACTION_LINES,
  CONTEXT_LIFT_ANOMALY_FLOOR_LINES,
  CONTEXT_MONSTER_KILL_FLOOR_LINES,
  CONTEXT_PRODUCTION_SHORTAGE_LINES,
  CONTEXT_SAMOSBOR_WARNING_LINES,
  CONTEXT_STOLEN_GOODS_LINES,
} from '../src/data/context_lines';
import { buildContextSnapshot } from '../src/systems/context';
import { createWorldEventState } from '../src/systems/events';
import { makeGameState } from './helpers';

test('recent event context flags are derived from bounded world event history', () => {
  assert.equal(snapshotFor('samosbor_warning').hasRecentSamosborWarning, true);
  assert.equal(snapshotFor('item_stolen', { actorId: 0, actorFaction: Faction.PLAYER }).hasRecentPlayerTheft, true);
  assert.equal(snapshotFor('room_lacked_resources').hasRecentProductionShortage, true);
  assert.equal(snapshotFor('elevator_anomaly').hasRecentLiftAnomaly, true);
  assert.equal(snapshotFor('faction_patrol_clash').hasRecentFactionClash, true);
  assert.equal(snapshotFor('player_kill_monster', { monsterKind: MonsterKind.TVAR }).hasRecentMonsterKill, true);
});

test('context line pools cover recent event floors and factions', () => {
  assert.ok(CONTEXT_SAMOSBOR_WARNING_LINES.length >= 4);
  assert.ok(CONTEXT_STOLEN_GOODS_LINES.length >= 5);
  assert.ok(CONTEXT_PRODUCTION_SHORTAGE_LINES.length >= 5);
  assert.ok(CONTEXT_LIFT_ANOMALY_FLOOR_LINES[FloorLevel.LIVING]?.length);
  assert.ok(CONTEXT_FACTION_EVENT_FACTION_LINES[Faction.LIQUIDATOR]?.length);
  assert.ok(CONTEXT_MONSTER_KILL_FLOOR_LINES[FloorLevel.HELL]?.length);
});

function snapshotFor(type: WorldEvent['type'], overrides: Partial<WorldEvent> = {}) {
  const state = makeGameState({
    time: 120,
    currentFloor: FloorLevel.LIVING,
    worldEvents: createWorldEventState(),
  });
  const buffer = state.worldEvents?.recentEvents;
  assert.ok(buffer);
  buffer.items[0] = {
    id: 1,
    type,
    time: 120,
    day: 0,
    hour: 8,
    minute: 0,
    floor: FloorLevel.LIVING,
    actorId: undefined,
    actorFaction: undefined,
    monsterKind: undefined,
    severity: 3,
    privacy: 'local',
    truth: 'fact',
    tags: [],
    ...overrides,
  };
  buffer.count = 1;
  return buildContextSnapshot(makeNpc(), { state, player: makePlayer(), time: state.time });
}

function makeNpc(): Entity {
  return {
    id: 9201,
    type: EntityType.NPC,
    x: 10,
    y: 10,
    angle: 0,
    pitch: 0,
    alive: true,
    speed: 1,
    sprite: 0,
    name: 'Контекст',
    faction: Faction.CITIZEN,
    occupation: Occupation.HOUSEWIFE,
    needs: { food: 100, water: 100, sleep: 100, pee: 0, poo: 0 },
    hp: 100,
    maxHp: 100,
  };
}

function makePlayer(): Entity {
  return {
    id: 0,
    type: EntityType.PLAYER,
    x: 11,
    y: 10,
    angle: 0,
    pitch: 0,
    alive: true,
    speed: 1,
    sprite: 0,
    name: 'Игрок',
    faction: Faction.PLAYER,
  };
}
