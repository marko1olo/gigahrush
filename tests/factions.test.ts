import test from 'node:test';
import assert from 'node:assert/strict';

import { EntityType, Faction } from '../src/core/types';
import { World } from '../src/core/world';
import { initFactionRelations } from '../src/data/relations';
import {
  getFactionRelation,
  isHostile,
  applyDamageRelationPenalty,
  applyTheftRelationPenalty,
  applyRoomMemoryRelationPenalty,
  applyInfrastructureRelationResponse
} from '../src/systems/factions';
import { makeTestEntity } from './helpers';

test('getFactionRelation returns configured base values', () => {
  initFactionRelations();
  // Citizen and Liquidator are friendly (50)
  assert.equal(getFactionRelation(Faction.CITIZEN, Faction.LIQUIDATOR), 50);
  // Citizen and Cultist are neutral (0)
  assert.equal(getFactionRelation(Faction.CITIZEN, Faction.CULTIST), 0);
  // Citizen and Wild are hostile (-50)
  assert.equal(getFactionRelation(Faction.CITIZEN, Faction.WILD), -50);
});

test('isHostile correctly evaluates relations between entities', () => {
  initFactionRelations();
  const citizen = makeTestEntity({ id: 1, type: EntityType.NPC, faction: Faction.CITIZEN });
  const liquidator = makeTestEntity({ id: 2, type: EntityType.NPC, faction: Faction.LIQUIDATOR });
  const wild = makeTestEntity({ id: 3, type: EntityType.NPC, faction: Faction.WILD });

  // Citizen and Liquidator are friendly, so not hostile
  assert.equal(isHostile(citizen, liquidator), false);
  // Citizen and Wild are hostile
  assert.equal(isHostile(citizen, wild), true);
});

test('applyDamageRelationPenalty drops relation when attacking non-enemies', () => {
  initFactionRelations();
  const player = makeTestEntity({ id: 1, type: EntityType.NPC, persistentNpcId: 'player', faction: Faction.PLAYER });
  const citizen = makeTestEntity({ id: 2, type: EntityType.NPC, faction: Faction.CITIZEN, playerRelation: 50 });

  // Initially friendly
  assert.equal(getFactionRelation(Faction.CITIZEN, Faction.PLAYER), 50);

  // Player attacks citizen, causing 25 damage (penalty = 25 / 5 = 5)
  applyDamageRelationPenalty(player.faction, citizen.faction, 25, citizen, player);

  // Relation should drop by 5
  assert.equal(citizen.playerRelation, 45);
  // Faction relation also drops
  assert.equal(getFactionRelation(Faction.CITIZEN, Faction.PLAYER), 45);
});

test('applyDamageRelationPenalty does not apply penalty for attacking enemies', () => {
  initFactionRelations();
  const player = makeTestEntity({ id: 1, type: EntityType.NPC, persistentNpcId: 'player', faction: Faction.PLAYER });
  const wild = makeTestEntity({ id: 2, type: EntityType.NPC, faction: Faction.WILD, playerRelation: -50 });

  // Initially hostile
  assert.equal(getFactionRelation(Faction.WILD, Faction.PLAYER), -50);

  // Player attacks wild, causing 25 damage
  applyDamageRelationPenalty(player.faction, wild.faction, 25, wild, player);

  // Relation drops because player attacks wild (wild's player relation drops), but faction relation shouldn't change
  assert.equal(wild.playerRelation, -55);
  assert.equal(getFactionRelation(Faction.WILD, Faction.PLAYER), -50);
});

test('applyTheftRelationPenalty applies penalty when witnessed or audited', () => {
  initFactionRelations();
  // Witnessed theft penalty is -4
  assert.equal(applyTheftRelationPenalty(Faction.CITIZEN, true, false), -4);

  // Audited theft penalty is -2
  assert.equal(applyTheftRelationPenalty(Faction.CITIZEN, false, true), -2);

  // Unnoticed theft has no penalty
  assert.equal(applyTheftRelationPenalty(Faction.CITIZEN, false, false), 0);
});

test('applyRoomMemoryRelationPenalty drops relation correctly based on severity', () => {
  initFactionRelations();
  // Base is -1
  assert.equal(applyRoomMemoryRelationPenalty(Faction.CITIZEN, 1), -1);

  // Severity >= 5 drops relation by -2
  assert.equal(applyRoomMemoryRelationPenalty(Faction.CITIZEN, 5), -2);

  // No penalty for player faction
  assert.equal(applyRoomMemoryRelationPenalty(Faction.PLAYER, 5), 0);
});

test('applyInfrastructureRelationResponse changes relation correctly based on action', () => {
  initFactionRelations();

  assert.equal(applyInfrastructureRelationResponse(Faction.CITIZEN, 'repair'), 1);
  assert.equal(applyInfrastructureRelationResponse(Faction.CITIZEN, 'shutdown'), -1);
  assert.equal(applyInfrastructureRelationResponse(Faction.CITIZEN, 'force'), -2);
  assert.equal(applyInfrastructureRelationResponse(Faction.CITIZEN, 'overload'), -4);

  // WILD faction doesn't care about repair
  assert.equal(applyInfrastructureRelationResponse(Faction.WILD, 'repair'), 0);
});
