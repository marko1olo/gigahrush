import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import {
  UNDERHELL_FLAGS,
  generateUnderhellDesignFloor,
  scoreUnderhellThresholdChain,
  snapshotUnderhellFlags,
} from '../src/gen/design_floors/underhell';

test('underhell scores a complete threshold chain with retreat and reward branches', () => {
  const gen = generateUnderhellDesignFloor();
  const score = scoreUnderhellThresholdChain(gen.world, gen.ritualState);

  assert.equal(gen.thresholdChain.score, score.score);
  assert.equal(score.score >= score.minScore, true, `underhell threshold score ${score.score}/${score.minScore}`);
  assert.deepEqual(score.nodes.map(node => node.role), ['entry', 'threat', 'fallback', 'reward', 'exit']);
  assert.equal(score.nodes.every(node => node.reachable), true);
  assert.equal(score.hasRetreat, true);
  assert.equal(score.hasWitnessBranch, true);
  assert.equal(score.hasDebtReward, true);
  assert.equal(score.hasVoidExit, true);
  assert.equal(score.capillaryCells >= 72, true, `capillary cells ${score.capillaryCells}`);
  assert.equal(score.tributeFrontCells >= 24, true, `tribute front cells ${score.tributeFrontCells}`);
  assert.equal(score.shelterCells >= 18, true, `shelter cells ${score.shelterCells}`);
});

test('underhell forced-open debug path keeps the void cut deterministic', () => {
  const gen = generateUnderhellDesignFloor({ forceOpenVoidGate: true });
  const snapshot = snapshotUnderhellFlags(gen.ritualState.flags);

  assert.equal(snapshot.thresholdPaid, true);
  assert.equal(snapshot.thresholdCost, 'holy_water');
  assert.equal(snapshot.voidGateState, 'open');
  assert.equal((gen.ritualState.flags & UNDERHELL_FLAGS.VOID_GATE_OPEN) !== 0, true);
  assert.equal(gen.thresholdChain.hasVoidExit, true);
});
