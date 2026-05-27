import test from 'node:test';
import assert from 'node:assert/strict';

import { Faction, Occupation, RoomType } from '../src/core/types';
import {
  chooseStableNpcUtilityTarget,
  createNpcUtilityScoreBuffer,
  getNpcUtilityScore,
  npcUtilityIdentitySeed,
  npcUtilityJitter01,
  npcUtilityRhythmBias,
  npcUtilityWorkRoomTypeWeight,
  scoreNpcUtilities,
  scoreNpcUtilityTargetPreference,
  selectNpcUtilityIntent,
  setNpcUtilityScore,
  shouldSwitchNpcUtilityIntent,
  type NpcUtilityTargetCandidate,
} from '../src/systems/ai/npc_utility';

test('NPC utility identity seed prefers stable A-Life identity over transient entity id', () => {
  const a = { entityId: 10, alifeId: 777 };
  const b = { entityId: 999, alifeId: 777 };
  const c = { entityId: 10, alifeId: 778 };

  assert.equal(npcUtilityIdentitySeed(a), npcUtilityIdentitySeed(b));
  assert.notEqual(npcUtilityIdentitySeed(a), npcUtilityIdentitySeed(c));
  assert.equal(npcUtilityJitter01(a, 'work'), npcUtilityJitter01(b, 'work'));
});

test('NPC utility scores urgent water over routine work without a hard schedule', () => {
  const scores = scoreNpcUtilities({
    identity: { alifeId: 42 },
    minuteOfDay: 630,
    needs: { food: 90, water: 5, sleep: 92, pee: 8, poo: 6 },
    role: {
      faction: Faction.CITIZEN,
      occupation: Occupation.LOCKSMITH,
      duty: 0.9,
      riskTolerance: 0.2,
    },
  });

  assert.equal(selectNpcUtilityIntent(scores).intent, 'drink');
  assert.ok(getNpcUtilityScore(scores, 'drink') > getNpcUtilityScore(scores, 'work'));
});

test('NPC utility rhythm is soft pressure rather than zero-or-one schedule state', () => {
  const identity = { alifeId: 1234 };
  const workHour = npcUtilityRhythmBias('work', 630, identity);
  const midnight = npcUtilityRhythmBias('work', 0, identity);
  const scores = scoreNpcUtilities({
    identity,
    minuteOfDay: 0,
    needs: { food: 100, water: 100, sleep: 100, pee: 0, poo: 0 },
    role: { faction: Faction.CITIZEN, occupation: Occupation.MECHANIC, duty: 0.8 },
  });

  assert.ok(workHour > midnight);
  assert.ok(getNpcUtilityScore(scores, 'work') > 10);
});

test('NPC utility hysteresis keeps close routine winners but yields to emergency intents', () => {
  const scores = createNpcUtilityScoreBuffer();
  setNpcUtilityScore(scores, 'work', 50);
  setNpcUtilityScore(scores, 'social', 55);

  const held = selectNpcUtilityIntent(scores, 'work', { switchMargin: 8 });
  assert.equal(held.intent, 'work');
  assert.equal(held.switched, false);
  assert.equal(shouldSwitchNpcUtilityIntent('social', 55, 'work', 50, { switchMargin: 8 }), false);

  setNpcUtilityScore(scores, 'flee', 59);
  const fled = selectNpcUtilityIntent(scores, 'work', { emergencyScore: 58 });
  assert.equal(fled.intent, 'flee');
  assert.equal(fled.switched, true);
  assert.equal(fled.emergency, true);
});

test('NPC utility threat scoring can choose flee over routine needs', () => {
  const scores = scoreNpcUtilities({
    identity: { alifeId: 91 },
    minuteOfDay: 640,
    hp: 30,
    maxHp: 100,
    needs: { food: 80, water: 80, sleep: 80, pee: 5, poo: 5 },
    threat: { danger: 1, visibleHostiles: 2, monster: 1, distance: 4, strongerHostile: true },
    role: {
      faction: Faction.CITIZEN,
      occupation: Occupation.SECRETARY,
      riskTolerance: 0.05,
      panicBias: 0.85,
      armed: false,
    },
  });

  const selected = selectNpcUtilityIntent(scores, 'work');
  assert.equal(selected.intent, 'flee');
  assert.equal(selected.emergency, true);
});

test('NPC utility target preference is stable across candidate order and respects work room affinity', () => {
  const targets: NpcUtilityTargetCandidate[] = [
    { id: 1, roomType: RoomType.PRODUCTION, utility: 10, distance: 12 },
    { id: 2, roomType: RoomType.PRODUCTION, utility: 10, distance: 12 },
    { id: 3, roomType: RoomType.OFFICE, utility: 10, distance: 12 },
  ];
  const context = {
    identity: { alifeId: 555 },
    intent: 'work' as const,
    occupation: Occupation.MECHANIC,
    faction: Faction.CITIZEN,
  };

  const forward = chooseStableNpcUtilityTarget(targets, context);
  const reversed = chooseStableNpcUtilityTarget([...targets].reverse(), context);
  assert.equal(forward?.id, reversed?.id);
  assert.ok(npcUtilityWorkRoomTypeWeight(Occupation.COOK, RoomType.KITCHEN) > npcUtilityWorkRoomTypeWeight(Occupation.COOK, RoomType.PRODUCTION));
  assert.ok(scoreNpcUtilityTargetPreference(targets[0], context) > scoreNpcUtilityTargetPreference(targets[2], context));
});
