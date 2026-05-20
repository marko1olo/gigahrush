import test from 'node:test';
import assert from 'node:assert/strict';
import { EntityType, FloorLevel } from '../src/core/types';
import {
  HELL_POPULATION_PROFILE,
  KVARTIRY_POPULATION_PROFILE,
  VOID_POPULATION_PROFILE,
} from '../src/data/population_profiles';
import { generateHell } from '../src/gen/hell';
import { generateKvartiry } from '../src/gen/kvartiry';
import { generateFloor } from '../src/gen/floor_manifest';

function liveActors(entities: readonly { alive: boolean; type: EntityType; ai?: unknown }[]): readonly { ai?: unknown }[] {
  return entities.filter(e => e.alive && (e.type === EntityType.NPC || e.type === EntityType.MONSTER));
}

function liveAiActors(entities: readonly { alive: boolean; type: EntityType; ai?: unknown }[]): readonly { ai?: unknown }[] {
  return liveActors(entities).filter(e => e.ai);
}

test('KVARTIRY starts as a five-thousand actor AI floor', () => {
  const gen = generateKvartiry();
  const actors = liveActors(gen.entities);
  assert.equal(actors.length >= 5000, true);
  assert.equal(liveAiActors(gen.entities).length, actors.length);
  assert.equal(gen.entities.filter(e => e.type === EntityType.NPC).length >= KVARTIRY_POPULATION_PROFILE.citizens.initial, true);
});

test('HELL starts as a five-thousand actor AI floor', () => {
  const gen = generateHell();
  const actors = liveActors(gen.entities);
  const monsters = gen.entities.filter(e => e.alive && e.type === EntityType.MONSTER);
  assert.equal(actors.length >= 5000, true);
  assert.equal(liveAiActors(gen.entities).length, actors.length);
  assert.equal(monsters.length >= HELL_POPULATION_PROFILE.monsters.initial, true);
});

test('VOID keeps NPC-free endgame density through monsters', () => {
  const gen = generateFloor(FloorLevel.VOID);
  const actors = liveActors(gen.entities);
  assert.equal(gen.entities.some(e => e.type === EntityType.NPC), false);
  assert.equal(actors.length >= 1000, true);
  assert.equal(liveAiActors(gen.entities).length, actors.length);
  assert.equal(gen.entities.filter(e => e.type === EntityType.MONSTER).length >= VOID_POPULATION_PROFILE.guardians, true);
  assert.equal(VOID_POPULATION_PROFILE.floor, FloorLevel.VOID);
});
