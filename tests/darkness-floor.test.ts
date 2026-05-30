import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { Feature } from '../src/core/types';
import { generateDarknessDesignFloor, getDarknessState } from '../src/gen/design_floors/darkness';

test('darkness floor exposes light, reveal, sound and radon topology state', () => {
  const gen = generateDarknessDesignFloor();
  const state = getDarknessState(gen.world);

  assert.equal(state, gen.darknessState);
  assert.equal(gen.darknessState.lightBudget, 8);
  assert.equal(gen.darknessState.roomLabels.length >= 10, true);
  assert.equal(gen.darknessState.lightGraphNodes.length, gen.darknessState.roomLabels.length);
  assert.equal(gen.darknessState.lightGraphEdges.length >= 10, true);
  assert.equal(gen.darknessState.revealShells.length, gen.darknessState.roomLabels.length);
  assert.equal(gen.darknessState.soundPaths.length >= 3, true);
  assert.equal(gen.darknessState.radonSightCorridors.length >= 2, true);

  const entryNode = gen.darknessState.lightGraphNodes.find(node => node.roomKey === 'entry');
  assert.ok(entryNode);
  assert.equal(entryNode.budgetAfterReveal, 8);
  assert.equal(entryNode.tags.includes('revealed_start'), true);

  for (const shell of gen.darknessState.revealShells) {
    assert.equal(shell.cellCount > 0, true, `${shell.id} should reveal walkable cells`);
    assert.equal(shell.maxFog >= shell.minFog, true, `${shell.id} fog range should be ordered`);
  }

  for (const path of gen.darknessState.soundPaths) {
    assert.equal(path.cellCount > 0, true, `${path.id} should have a routed sound path`);
    assert.equal(path.tags.includes('sound_path'), true, `${path.id} should be tagged as a sound path`);
  }

  for (const corridor of gen.darknessState.radonSightCorridors) {
    assert.equal(corridor.cellCount > 0, true, `${corridor.id} should cross floor cells`);
    assert.equal(corridor.tags.includes('sight_corridor'), true, `${corridor.id} should be a sight corridor`);
    assert.equal(corridor.maxFog >= corridor.minFog, true, `${corridor.id} fog range should be ordered`);
  }

  assert.equal(gen.world.features.some(feature => feature === Feature.LAMP || feature === Feature.CANDLE), false);
  assert.equal(gen.world.light.some(value => value > 0), false);
});
