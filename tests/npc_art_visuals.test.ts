import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { Faction, Occupation } from '../src/core/types';
import { categorizeNpcAge, resolveNpcArtVisualId } from '../src/data/npc_art_visuals';
import {
  NPC_VISUAL_OLGA_DMITRIEVNA,
  NPC_VISUAL_SCIENTIST_MALE,
  NPC_VISUAL_SCIENTIST_FEMALE,
  NPC_VISUAL_CITIZEN_MALE,
  NPC_VISUAL_CITIZEN_CHILD_MALE,
  NPC_VISUAL_CITIZEN_OLD_FEMALE,
  NPC_VISUAL_WORKER69,
  NPC_VISUAL_LIQUIDATOR_MALE,
} from '../src/data/art_sprite_manifest';

test('categorizeNpcAge maps ages to categories', () => {
  assert.equal(categorizeNpcAge(undefined), 'adult');
  assert.equal(categorizeNpcAge(10), 'child');
  assert.equal(categorizeNpcAge(14), 'child');
  assert.equal(categorizeNpcAge(15), 'young');
  assert.equal(categorizeNpcAge(25), 'young');
  assert.equal(categorizeNpcAge(26), 'adult');
  assert.equal(categorizeNpcAge(59), 'adult');
  assert.equal(categorizeNpcAge(60), 'old');
  assert.equal(categorizeNpcAge(80), 'old');
});

test('resolveNpcArtVisualId resolves by plotNpcId directly', () => {
  assert.equal(
    resolveNpcArtVisualId({ plotNpcId: 'olga' }),
    NPC_VISUAL_OLGA_DMITRIEVNA
  );

  // Plot ID takes priority over other characteristics
  assert.equal(
    resolveNpcArtVisualId({ plotNpcId: 'olga', isFemale: false, faction: Faction.LIQUIDATOR }),
    NPC_VISUAL_OLGA_DMITRIEVNA
  );
});

test('resolveNpcArtVisualId resolves by family mappings based on scorings', () => {
  // Faction +10, Sex +2
  assert.equal(
    resolveNpcArtVisualId({ faction: Faction.SCIENTIST, isFemale: false }),
    NPC_VISUAL_SCIENTIST_MALE
  );

  assert.equal(
    resolveNpcArtVisualId({ faction: Faction.SCIENTIST, isFemale: true }),
    NPC_VISUAL_SCIENTIST_FEMALE
  );

  // Age +5
  assert.equal(
    resolveNpcArtVisualId({ faction: Faction.CITIZEN, isFemale: false, age: 30 }),
    NPC_VISUAL_CITIZEN_MALE
  );

  assert.equal(
    resolveNpcArtVisualId({ faction: Faction.CITIZEN, isFemale: false, age: 10 }),
    NPC_VISUAL_CITIZEN_CHILD_MALE
  );

  assert.equal(
    resolveNpcArtVisualId({ faction: Faction.CITIZEN, isFemale: true, age: 70 }),
    NPC_VISUAL_CITIZEN_OLD_FEMALE
  );
});

test('resolveNpcArtVisualId occupation score outweighs faction', () => {
  // Occupation (+15) should take precedence if conflicting.
  // Although in manifest, WORKER69 has no faction specified, we can test it
  // overriding something else, or matching it.
  assert.equal(
    resolveNpcArtVisualId({ occupation: Occupation.WORKER69, isFemale: true }),
    NPC_VISUAL_WORKER69
  );

  // Conflict block mapping - WORKER69 expects sex: 'female'. If we pass male, it should conflict and return undefined (or a different one if applicable, but there is no male WORKER69).
  // Wait, if it returns undefined or something else depends on other matches. Since we have no fallback that matches occupation=WORKER69, it should probably return undefined or some base if there's no match.
  // Actually, if we pass faction: SCIENTIST and occupation: WORKER69.
  // SCIENTIST matches faction (10), but occupation is WORKER69 (0 match for scientist). Wait, scientist mapping has NO occupation specified, so it doesn't conflict!
  // Wait, if mapping has NO occupation, conflict is false. So SCIENTIST mapping would score +10 (for faction) +2 (for sex).
  // But WORKER69 mapping would score +15 (for occupation) +2 (for sex). 17 > 12.
  assert.equal(
    resolveNpcArtVisualId({ faction: Faction.SCIENTIST, occupation: Occupation.WORKER69, isFemale: true }),
    NPC_VISUAL_WORKER69
  );
});

test('resolveNpcArtVisualId conflict logic blocks mappings', () => {
  // If we specify female, LIQUIDATOR male mappings will conflict because mapping.sex is 'male'.
  // Actually, there is a LIQUIDATOR_FEMALE mapping, so it returns that.

  // Let's test a case with no matching visual where conflict happens.
  // E.g., occupation WORKER69 but male. WORKER69 mapping requires sex='female'. It will conflict.
  // If no other mapping matches (e.g. no faction given), it should return undefined.
  assert.equal(
    resolveNpcArtVisualId({ occupation: Occupation.WORKER69, isFemale: false }),
    undefined
  );
});

test('resolveNpcArtVisualId undefined if no positive score', () => {
  assert.equal(resolveNpcArtVisualId({}), undefined);
});
