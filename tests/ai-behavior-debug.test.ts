import test from 'node:test';
import assert from 'node:assert/strict';

import { AIGoal, MonsterKind } from '../src/core/types';
import {
  AI_BEHAVIOR_DEBUG_TAG_CAP,
  AI_BEHAVIOR_DEBUG_TEXT_CAP,
  AI_BEHAVIOR_DEBUG_TOP_SCORE_CAP,
  AI_BEHAVIOR_DEBUG_TRACE_CAP,
  appendAiBehaviorTrace,
  buildAiBehaviorDebugSnapshot,
  makeAiBehaviorTraceEntry,
  makeAiIntentDebugSample,
  makeAiMonsterDebugSample,
  makeAiSamosborDebugSample,
} from '../src/systems/ai/ai_behavior_debug';

test('intent debug samples are compact copies with bounded score lists', () => {
  const topScores = Array.from({ length: AI_BEHAVIOR_DEBUG_TOP_SCORE_CAP + 3 }, (_, i) => ({
    intentId: `intent_${i}`,
    score: i === 2 ? Number.NaN : i * 1.5,
    reason: i === 0 ? 'x'.repeat(AI_BEHAVIOR_DEBUG_TEXT_CAP + 20) : undefined,
  }));

  const sample = makeAiIntentDebugSample({
    actorId: 12.9,
    actorKind: 'npc',
    x: 10.25,
    y: 20.5,
    roomId: 4.8,
    zoneId: Number.NaN,
    tags: ['work', 'kitchen', 'crowd', 'safe', 'hungry', 'late', 'extra'],
    intentId: 'work',
    previousIntentId: '',
    score: Number.POSITIVE_INFINITY,
    goal: AIGoal.WORK,
    targetRoomId: 9.6,
    targetCell: 123.8,
    nextDecisionAt: 42.25,
    topScores,
  });

  topScores[0] = { intentId: 'mutated', score: 999 };

  assert.equal(sample.kind, 'intent');
  assert.equal(sample.actorId, 12);
  assert.deepEqual(sample.point, { x: 10.25, y: 20.5 });
  assert.equal(sample.roomId, 4);
  assert.equal(sample.zoneId, undefined);
  assert.equal(sample.score, 0);
  assert.equal(sample.previousIntentId, undefined);
  assert.equal(sample.goal, AIGoal.WORK);
  assert.equal(sample.targetRoomId, 9);
  assert.equal(sample.targetCell, 123);
  assert.equal(sample.tags.length, AI_BEHAVIOR_DEBUG_TAG_CAP);
  assert.equal(sample.topScores.length, AI_BEHAVIOR_DEBUG_TOP_SCORE_CAP);
  assert.equal(sample.topScores[0].intentId, 'intent_0');
  assert.equal(sample.topScores[0].reason?.length, AI_BEHAVIOR_DEBUG_TEXT_CAP);
  assert.equal(sample.topScores[2].score, 0);
});

test('trace helpers enforce the 300 entry hard cap and count dropped entries', () => {
  let trace = undefined as ReturnType<typeof appendAiBehaviorTrace> | undefined;

  for (let frame = 0; frame < AI_BEHAVIOR_DEBUG_TRACE_CAP + 5; frame++) {
    const sample = makeAiIntentDebugSample({
      actorId: frame,
      intentId: 'wander',
      score: frame,
    });
    trace = appendAiBehaviorTrace(trace, makeAiBehaviorTraceEntry(frame, frame / 60, sample), 9999);
  }

  assert.equal(trace?.entries.length, AI_BEHAVIOR_DEBUG_TRACE_CAP);
  assert.equal(trace?.dropped, 5);
  assert.equal(trace?.entries[0].frame, 5);
  assert.equal(trace?.entries.at(-1)?.frame, AI_BEHAVIOR_DEBUG_TRACE_CAP + 4);

  const snapshot = buildAiBehaviorDebugSnapshot(trace);
  assert.equal(snapshot.cap, AI_BEHAVIOR_DEBUG_TRACE_CAP);
  assert.equal(snapshot.counts.intent, AI_BEHAVIOR_DEBUG_TRACE_CAP);
  assert.equal(snapshot.counts.monster, 0);
  assert.equal(snapshot.counts.samosbor, 0);
});

test('monster and samosbor samples stay primitive and independently copied', () => {
  const monster = makeAiMonsterDebugSample({
    actorId: 21,
    actorKind: 'monster',
    monsterKind: MonsterKind.SBORKA,
    goal: AIGoal.HUNT,
    stage: 2.7,
    stimulus: 'noise',
    combatTargetId: 1,
    homeRoomId: 8,
    targetCell: 450,
    cooldown: Number.NaN,
    tags: ['monster'],
  });
  const samosbor = makeAiSamosborDebugSample({
    actorId: 22,
    actorKind: 'npc',
    active: true,
    decision: 'seek_shelter',
    pressure: 4,
    shelterRoomId: 11.9,
    shelterScore: 0.75,
    targetCell: 700.2,
    secondsLeft: 18.5,
  });

  const first = appendAiBehaviorTrace(undefined, makeAiBehaviorTraceEntry(1, 2, monster));
  const second = appendAiBehaviorTrace(first, makeAiBehaviorTraceEntry(2, 3, samosbor));
  const snapshot = buildAiBehaviorDebugSnapshot(second);

  assert.equal(monster.stage, 2);
  assert.equal(monster.cooldown, undefined);
  assert.equal(samosbor.pressure, 1);
  assert.equal(samosbor.shelterRoomId, 11);
  assert.equal(samosbor.targetCell, 700);
  assert.equal(snapshot.counts.intent, 0);
  assert.equal(snapshot.counts.monster, 1);
  assert.equal(snapshot.counts.samosbor, 1);
  assert.notEqual(snapshot.entries[0], first.entries[0]);
});
