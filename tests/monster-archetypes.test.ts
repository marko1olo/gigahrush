import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { MonsterKind } from '../src/core/types';
import { DEF as FOG_SHARK_DEF } from '../src/entities/fog_shark';
import { DEF as GREEN_DOG_DEF } from '../src/entities/green_dog';
import {
  MONSTER_ARCHETYPE_DEFS,
  MONSTER_ARCHETYPE_IDS,
  MONSTER_ARCHETYPE_LIMITS,
  getMonsterArchetypes,
  isMonsterScanBudgetBounded,
  monsterDeterministicCadenceSec,
  monsterKindsForArchetype,
  monsterScanRadiusSq,
  monsterTerritoryPressureFromDistanceSq,
  monsterTerritoryStage,
  rankMonsterStimuli,
  resolveMonsterCounterplayTransition,
} from '../src/systems/ai/monster_archetypes';

test('monster archetype registry exposes the planned generic behavior families with bounded budgets', () => {
  assert.deepEqual(MONSTER_ARCHETYPE_IDS, [
    'chaser',
    'ambusher',
    'territorial',
    'resource_predator',
    'pack_hunter',
    'line_turret',
    'parasite_controller',
    'trap_tether',
    'conditional_neutral',
    'hive_spawner',
  ]);

  for (const archetype of MONSTER_ARCHETYPE_IDS) {
    const def = MONSTER_ARCHETYPE_DEFS[archetype];
    assert.equal(def.id, archetype);
    assert.equal(def.states.length > 0, true, `${archetype} should expose FSM states`);
    assert.equal(def.stimuli.length > 0, true, `${archetype} should expose stimulus interests`);
    assert.equal(def.territories.length > 0, true, `${archetype} should expose territory anchors`);
    assert.equal(isMonsterScanBudgetBounded(def.scan), true, `${archetype} scan budget should stay bounded`);
    assert.equal(monsterScanRadiusSq(def.scan), def.scan.radius * def.scan.radius);
    assert.equal(monsterKindsForArchetype(archetype).length > 0, true, `${archetype} should have at least one current integration candidate`);
  }

  assert.equal(MONSTER_ARCHETYPE_DEFS.pack_hunter.scan.resultCap, MONSTER_ARCHETYPE_LIMITS.packShareCapMax);
  assert.equal(MONSTER_ARCHETYPE_DEFS.hive_spawner.scan.resultCap, MONSTER_ARCHETYPE_LIMITS.spawnBurstCapMax);
});

test('existing monster kinds and ai flags resolve to gradual-integration archetypes', () => {
  const greenDog = getMonsterArchetypes(MonsterKind.GREEN_DOG, GREEN_DOG_DEF.aiFlags ?? []);
  assert.equal(greenDog.includes('pack_hunter'), true);
  assert.equal(greenDog.includes('resource_predator'), true);
  assert.equal(greenDog.includes('chaser'), true);
  assert.equal(new Set(greenDog).size, greenDog.length, 'flag-derived archetypes should not duplicate kind mappings');

  const fogShark = getMonsterArchetypes(MonsterKind.FOG_SHARK, FOG_SHARK_DEF.aiFlags ?? []);
  assert.equal(fogShark.includes('pack_hunter'), true);
  assert.equal(fogShark.includes('ambusher'), true);

  assert.equal(getMonsterArchetypes(MonsterKind.HEAD_SLUG).includes('parasite_controller'), true);
  assert.equal(getMonsterArchetypes(MonsterKind.TRUBNYY_AVTOMAT).includes('line_turret'), true);
  assert.equal(getMonsterArchetypes(MonsterKind.SLIMEVIK).includes('conditional_neutral'), true);
  assert.equal(getMonsterArchetypes(MonsterKind.MATKA).includes('hive_spawner'), true);
});

test('counterplay transitions describe state changes instead of only damage modifiers', () => {
  const lineBreak = resolveMonsterCounterplayTransition(['line_turret'], 'warn_telegraph', 'line_break');
  assert.equal(lineBreak?.to, 'recover');
  assert.equal(lineBreak.clearTarget, true);
  assert.equal(lineBreak.resetWindup, true);
  assert.equal(lineBreak.tags.includes('line_broken'), true);

  const loudFear = resolveMonsterCounterplayTransition(['pack_hunter'], 'commit', 'loud_fear', 1.4);
  assert.equal(loudFear?.to, 'flee_reset');
  assert.equal(loudFear.clearTarget, true);
  assert.equal((loudFear.driveDelta.pack_confidence ?? 0) < 0, true);
  assert.equal((loudFear.cooldownSec ?? 0) <= MONSTER_ARCHETYPE_LIMITS.transitionCooldownMaxSec, true);

  const bait = resolveMonsterCounterplayTransition(['resource_predator'], 'commit', 'bait_satisfied');
  assert.equal(bait?.to, 'feed_claim');
  assert.equal((bait.driveDelta.hunger ?? 0) < 0, true);

  assert.equal(resolveMonsterCounterplayTransition(['chaser'], 'dormant', 'line_break'), undefined);
});

test('stimulus ranking respects archetype interests, ttl, and caps', () => {
  const resourceRank = rankMonsterStimuli(['resource_predator'], [
    { id: 'hostile_sight', severity: 1, ageSec: 0.2 },
    { id: 'bait', severity: 0.9, ageSec: 0.1 },
    { id: 'document_scent', severity: 2, ageSec: 11, ttlSec: 1 },
  ]);

  assert.equal(resourceRank[0].stimulus.id, 'bait');
  assert.equal(resourceRank.some(entry => entry.stimulus.id === 'document_scent'), false, 'expired stimuli should not rank');

  const turretRank = rankMonsterStimuli(['line_turret'], [
    { id: 'bait', severity: 2, ageSec: 0 },
    { id: 'wet_line', severity: 0.8, ageSec: 0 },
  ]);

  assert.equal(turretRank[0].stimulus.id, 'wet_line');
  assert.equal(rankMonsterStimuli(['pack_hunter'], turretRank.map(entry => entry.stimulus), 1).length, 1);
});

test('territory and cadence helpers are deterministic and bounded', () => {
  const anchor = {
    id: 'test_room',
    type: 'home_room' as const,
    x: 10,
    y: 10,
    radius: 4,
    leashRadius: 12,
  };

  assert.equal(monsterTerritoryPressureFromDistanceSq(3 * 3, anchor), 0);
  const mid = monsterTerritoryPressureFromDistanceSq(8 * 8, anchor);
  assert.equal(mid > 0 && mid < 1, true);
  assert.equal(monsterTerritoryPressureFromDistanceSq(20 * 20, anchor), 1);
  assert.equal(monsterTerritoryStage('dormant', mid), 'patrol_territory');
  assert.equal(monsterTerritoryStage('commit', 0.9), 'flee_reset');

  const scan = MONSTER_ARCHETYPE_DEFS.chaser.scan;
  const cadence = monsterDeterministicCadenceSec(42, scan);
  const pressureCadence = monsterDeterministicCadenceSec(42, scan, 1);
  assert.equal(cadence >= MONSTER_ARCHETYPE_LIMITS.cadenceMinSec, true);
  assert.equal(cadence <= MONSTER_ARCHETYPE_LIMITS.cadenceMaxSec, true);
  assert.equal(pressureCadence <= cadence, true);
  assert.equal(monsterDeterministicCadenceSec(42, scan), cadence);
});
