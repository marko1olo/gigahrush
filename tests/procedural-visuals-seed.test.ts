import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { EntityType, type Entity } from '../src/core/types';
import { ensureProceduralSpriteSeed } from '../src/entities/procedural_visuals';

test('ensureProceduralSpriteSeed missing edge cases for deriveEntitySpriteSeed', () => {
  // Edge case: Non-procedural entities should not get a sprite seed
  const itemDrop: Entity = {
    id: 1, type: EntityType.ITEM_DROP, x: 0, y: 0, angle: 0, pitch: 0, alive: true, speed: 0, sprite: 0,
  };
  ensureProceduralSpriteSeed(itemDrop);
  assert.equal(itemDrop.spriteSeed, undefined, 'Item drop should not get a sprite seed');

  // Edge case: e.spriteSeed is undefined, so it should be derived.
  const baseMonster: Entity = {
    id: 1, type: EntityType.MONSTER, x: 0, y: 0, angle: 0, pitch: 0, alive: true, speed: 0, sprite: 0,
  };
  ensureProceduralSpriteSeed(baseMonster);
  assert.ok(baseMonster.spriteSeed !== undefined, 'Monster entity should receive a sprite seed when undefined');
  const generatedSeed = baseMonster.spriteSeed;

  // Edge case: Entities with an existing `spriteSeed` are not overwritten.
  const monsterWithSeed: Entity = {
    id: 1, type: EntityType.MONSTER, x: 0, y: 0, angle: 0, pitch: 0, alive: true, speed: 0, sprite: 0, spriteSeed: 12345,
  };
  ensureProceduralSpriteSeed(monsterWithSeed);
  assert.equal(monsterWithSeed.spriteSeed, 12345, 'Existing sprite seed should be preserved');

  // Edge case: e.spriteSeed is explicitly set to 0.
  const monsterWithZeroSeed: Entity = {
    id: 1, type: EntityType.MONSTER, x: 0, y: 0, angle: 0, pitch: 0, alive: true, speed: 0, sprite: 0, spriteSeed: 0,
  };
  ensureProceduralSpriteSeed(monsterWithZeroSeed);
  assert.equal(monsterWithZeroSeed.spriteSeed, 0, 'Explicitly 0 sprite seed is ignored by ensureProceduralSpriteSeed because it only replaces undefined');

  // Edge case: Seed derivation modifies the hash if name or plotNpcId are provided.
  const monsterWithName: Entity = {
    id: 1, type: EntityType.MONSTER, x: 0, y: 0, angle: 0, pitch: 0, alive: true, speed: 0, sprite: 0,
    name: "Test Entity",
  };
  ensureProceduralSpriteSeed(monsterWithName);
  const seedWithName = monsterWithName.spriteSeed;
  assert.notEqual(generatedSeed, seedWithName, 'Seed should differ when name is provided');

  const monsterWithPlotId: Entity = {
    id: 1, type: EntityType.MONSTER, x: 0, y: 0, angle: 0, pitch: 0, alive: true, speed: 0, sprite: 0,
    plotNpcId: "test_plot_npc_42",
  };
  ensureProceduralSpriteSeed(monsterWithPlotId);
  const seedWithPlotNpcId = monsterWithPlotId.spriteSeed;
  assert.notEqual(generatedSeed, seedWithPlotNpcId, 'Seed should differ when plotNpcId is provided');

  const monsterWithBoth: Entity = {
    id: 1, type: EntityType.MONSTER, x: 0, y: 0, angle: 0, pitch: 0, alive: true, speed: 0, sprite: 0,
    name: "Test Entity",
    plotNpcId: "test_plot_npc_42",
  };
  ensureProceduralSpriteSeed(monsterWithBoth);
  const seedWithBoth = monsterWithBoth.spriteSeed;
  assert.notEqual(seedWithName, seedWithBoth, 'Seed should differ when both name and plotNpcId are provided');
  assert.notEqual(seedWithPlotNpcId, seedWithBoth, 'Seed should differ when both name and plotNpcId are provided');

  // Edge case: Fractional and negative coordinates
  const fractionMonsterSameCell: Entity = {
    id: 1, type: EntityType.MONSTER, x: 0.05, y: 0.05, angle: 0, pitch: 0, alive: true, speed: 0, sprite: 0, // Math.floor(0.05 * 16) = 0
  };
  ensureProceduralSpriteSeed(fractionMonsterSameCell);
  assert.equal(fractionMonsterSameCell.spriteSeed, generatedSeed, 'Fractional coordinates that floor to same cell should produce same seed');

  const fractionMonsterDiffCell: Entity = {
    id: 1, type: EntityType.MONSTER, x: 0.1, y: 0, angle: 0, pitch: 0, alive: true, speed: 0, sprite: 0, // Math.floor(0.1 * 16) = 1
  };
  ensureProceduralSpriteSeed(fractionMonsterDiffCell);
  assert.notEqual(fractionMonsterDiffCell.spriteSeed, generatedSeed, 'Fractional coordinates that floor to different cell should produce different seed');

  const negativeMonster: Entity = {
    id: 1, type: EntityType.MONSTER, x: -1.5, y: -2.5, angle: 0, pitch: 0, alive: true, speed: 0, sprite: 0,
  };
  ensureProceduralSpriteSeed(negativeMonster);
  assert.ok(negativeMonster.spriteSeed !== undefined, 'Negative coordinates should successfully generate a valid seed');

  // Edge case: Procedural NPC variants receive a seed
  const npcNonProcedural: Entity = {
    id: 6, type: EntityType.NPC, x: 0, y: 0, angle: 0, pitch: 0, alive: true, speed: 0, sprite: 99999,
  };
  ensureProceduralSpriteSeed(npcNonProcedural);
  assert.equal(npcNonProcedural.spriteSeed, undefined, 'NPC without procedural sprite indicator should not get a seed');

  const npcProceduralDynamic: Entity = {
    id: 5, type: EntityType.NPC, x: 0, y: 0, angle: 0, pitch: 0, alive: true, speed: 0, sprite: 0,
    npcVisualId: 'floor69_worker',
  };
  ensureProceduralSpriteSeed(npcProceduralDynamic);
  assert.ok(npcProceduralDynamic.spriteSeed !== undefined, 'NPC with dynamic texture should get a seed');
});
