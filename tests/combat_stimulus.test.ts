import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { EntityType, Faction } from '../src/core/types';
import { World } from '../src/core/world';
import { notifyActorDamaged, getRecentCombatThreat, isRecentCombatThreat, resetCombatStimulus } from '../src/systems/combat_stimulus';
import { rebuildEntityIndex } from '../src/systems/entity_index';
import { makeTestEntity, makeTestPlayer, makeTestNpc } from './helpers';
import { addFactionRelMutual, initFactionRelations } from '../src/data/relations';

test('notifyActorDamaged sets combat threat memory for victim', () => {
  const world = new World();
  const time = 100;
  resetCombatStimulus();
  initFactionRelations();
  addFactionRelMutual(Faction.CITIZEN, Faction.LIQUIDATOR, -100);

  // Make the victim brave so they fight instead of flee
  const victim = makeTestEntity({ id: 1, hp: 50, alive: true, type: EntityType.NPC, faction: Faction.CITIZEN, psiMadness: 1 });
  const attacker = makeTestEntity({ id: 2, hp: 50, alive: true, type: EntityType.NPC, faction: Faction.LIQUIDATOR, x: 10, y: 20 });

  rebuildEntityIndex([victim, attacker]);

  notifyActorDamaged(world, victim, attacker, 10, 'npc_melee', time);

  const threat = getRecentCombatThreat(victim, time + 1);
  assert.ok(threat);
  assert.equal(threat.attackerId, 2);
  assert.equal(threat.lastKnownX, 10);
  assert.equal(threat.lastKnownY, 20);
  assert.equal(threat.damagePressure, 10);
  assert.equal(threat.reaction, 'fight');
});

test('notifyActorDamaged flees if not armed and not brave', () => {
  const world = new World();
  const time = 100;
  resetCombatStimulus();
  initFactionRelations();
  addFactionRelMutual(Faction.CITIZEN, Faction.LIQUIDATOR, -100);

  const victim = makeTestEntity({ id: 1, hp: 50, maxHp: 50, alive: true, type: EntityType.NPC, faction: Faction.CITIZEN, weapon: '' });
  const attacker = makeTestEntity({ id: 2, hp: 50, alive: true, type: EntityType.NPC, faction: Faction.LIQUIDATOR, x: 10, y: 20 });

  rebuildEntityIndex([victim, attacker]);

  notifyActorDamaged(world, victim, attacker, 10, 'npc_melee', time);

  const threat = getRecentCombatThreat(victim, time + 1);
  assert.ok(threat);
  assert.equal(threat.reaction, 'flee');
});

test('notifyActorDamaged does not trigger on player victim', () => {
  const world = new World();
  const time = 100;
  resetCombatStimulus();

  const victim = makeTestPlayer({ id: 1, hp: 50 });
  const attacker = makeTestNpc({ id: 2, hp: 50 });

  rebuildEntityIndex([victim, attacker]);

  notifyActorDamaged(world, victim, attacker, 10, 'npc_melee', time);

  const threat = getRecentCombatThreat(victim, time + 1);
  assert.equal(threat, undefined);
});

test('notifyActorDamaged respects threat TTL', () => {
  const world = new World();
  const time = 100;
  resetCombatStimulus();
  initFactionRelations();
  addFactionRelMutual(Faction.CITIZEN, Faction.LIQUIDATOR, -100);

  const victim = makeTestEntity({ id: 1, hp: 50, alive: true, type: EntityType.NPC, faction: Faction.CITIZEN });
  const attacker = makeTestEntity({ id: 2, hp: 50, alive: true, type: EntityType.NPC, faction: Faction.LIQUIDATOR, x: 10, y: 20 });

  rebuildEntityIndex([victim, attacker]);

  notifyActorDamaged(world, victim, attacker, 10, 'npc_melee', time);

  // TTL is COMBAT_THREAT_TTL (5.0 seconds). We pass current time + TTL + 1
  const threat = getRecentCombatThreat(victim, time + 6);
  assert.equal(threat, undefined);
});

test('notifyActorDamaged accumulates damage pressure', () => {
  const world = new World();
  const time = 100;
  resetCombatStimulus();
  initFactionRelations();
  addFactionRelMutual(Faction.CITIZEN, Faction.LIQUIDATOR, -100);

  const victim = makeTestEntity({ id: 1, hp: 50, alive: true, type: EntityType.NPC, faction: Faction.CITIZEN });
  const attacker = makeTestEntity({ id: 2, hp: 50, alive: true, type: EntityType.NPC, faction: Faction.LIQUIDATOR, x: 10, y: 20 });

  rebuildEntityIndex([victim, attacker]);

  notifyActorDamaged(world, victim, attacker, 10, 'npc_melee', time);
  notifyActorDamaged(world, victim, attacker, 20, 'npc_melee', time + 1);

  const threat = getRecentCombatThreat(victim, time + 2);
  assert.ok(threat);
  assert.equal(threat.damagePressure, 30); // 10 + 20
});

test('notifyActorDamaged does not target dead attacker', () => {
  const world = new World();
  const time = 100;
  resetCombatStimulus();
  initFactionRelations();
  addFactionRelMutual(Faction.CITIZEN, Faction.LIQUIDATOR, -100);

  const victim = makeTestEntity({ id: 1, hp: 50, alive: true, type: EntityType.NPC, faction: Faction.CITIZEN });
  const attacker = makeTestEntity({ id: 2, hp: 50, alive: false, type: EntityType.NPC, faction: Faction.LIQUIDATOR, x: 10, y: 20 }); // Dead attacker

  rebuildEntityIndex([victim, attacker]);

  notifyActorDamaged(world, victim, attacker, 10, 'npc_melee', time);

  const threat = getRecentCombatThreat(victim, time + 1);
  assert.equal(threat, undefined);
});

test('notifyActorDamaged triggers startling on non-combat threats', () => {
  const world = new World();
  const time = 100;
  resetCombatStimulus();
  initFactionRelations();

  const victim = makeTestEntity({ id: 1, hp: 50, alive: true, type: EntityType.NPC, faction: Faction.CITIZEN });
  const attacker = makeTestEntity({ id: 2, hp: 50, alive: true, type: EntityType.NPC, faction: Faction.CITIZEN, x: 10, y: 20 }); // Same faction, not hostile

  rebuildEntityIndex([victim, attacker]);

  notifyActorDamaged(world, victim, attacker, 10, 'npc_melee', time);

  // Still recorded, but reaction should be 'startled'
  const threat = getRecentCombatThreat(victim, time + 1);
  assert.ok(threat);
  assert.equal(threat.reaction, 'startled');
  assert.equal(isRecentCombatThreat(victim, attacker, time + 1), false);
});
