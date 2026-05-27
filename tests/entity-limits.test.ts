import test from 'node:test';
import assert from 'node:assert/strict';
import { EntityType, type Entity } from '../src/core/types';
import { ENTITY_SOFT_LIMITS } from '../src/data/entity_limits';
import {
  canSpawnEntityType,
  countLiveEntitiesOfType,
  entitySpawnSlots,
  remainingEntitySpawnSlots,
} from '../src/systems/entity_limits';

function entity(id: number, type: EntityType, alive = true): Entity {
  return {
    id,
    type,
    x: 0,
    y: 0,
    angle: 0,
    pitch: 0,
    alive,
    speed: 0,
    sprite: 0,
  } as Entity;
}

test('entity soft limits are centralized by gameplay type', () => {
  assert.equal(ENTITY_SOFT_LIMITS[EntityType.NPC], 5_000);
  assert.equal(ENTITY_SOFT_LIMITS[EntityType.MONSTER], 10_000);
  assert.equal(ENTITY_SOFT_LIMITS[EntityType.ITEM_DROP], 100_000);
  assert.equal(ENTITY_SOFT_LIMITS[EntityType.PROJECTILE], 100_000);
  assert.equal(ENTITY_SOFT_LIMITS[EntityType.BILLBOARD], 100_000);
  assert.equal(ENTITY_SOFT_LIMITS[EntityType.PROJECTILE], ENTITY_SOFT_LIMITS[EntityType.ITEM_DROP]);
});

test('entity spawn slots stop population spawns at the NPC ceiling', () => {
  const entities = Array.from({ length: 5_000 }, (_, i) => entity(i + 1, EntityType.NPC));
  assert.equal(countLiveEntitiesOfType(entities, EntityType.NPC), 5_000);
  assert.equal(remainingEntitySpawnSlots(entities, EntityType.NPC), 0);
  assert.equal(entitySpawnSlots(entities, EntityType.NPC, 8), 0);
  assert.equal(canSpawnEntityType(entities, EntityType.NPC), false);

  entities[123].alive = false;
  assert.equal(remainingEntitySpawnSlots(entities, EntityType.NPC), 1);
  assert.equal(entitySpawnSlots(entities, EntityType.NPC, 8), 1);
});

test('entity spawn slots ignore unrelated and dead entities', () => {
  const entities = [
    entity(1, EntityType.NPC),
    entity(2, EntityType.NPC, false),
    entity(3, EntityType.MONSTER),
    entity(4, EntityType.ITEM_DROP),
    entity(5, EntityType.BILLBOARD),
  ];
  assert.equal(countLiveEntitiesOfType(entities, EntityType.NPC), 1);
  assert.equal(entitySpawnSlots(entities, EntityType.MONSTER, 12), 12);
  assert.equal(entitySpawnSlots(entities, EntityType.ITEM_DROP, 12), 12);
  assert.equal(entitySpawnSlots(entities, EntityType.BILLBOARD, 12), 12);
});

test('projectile slots keep the emergency combat ceiling high', () => {
  const nearLimit = Array.from({ length: 99_999 }, (_, i) => entity(i + 1, EntityType.PROJECTILE));
  nearLimit.push(entity(100_000, EntityType.PROJECTILE, false));

  assert.equal(remainingEntitySpawnSlots(nearLimit, EntityType.PROJECTILE), 1);
  assert.equal(entitySpawnSlots(nearLimit, EntityType.PROJECTILE, 16), 1);
  assert.equal(canSpawnEntityType(nearLimit, EntityType.PROJECTILE), true);

  nearLimit.push(entity(100_001, EntityType.PROJECTILE));
  assert.equal(remainingEntitySpawnSlots(nearLimit, EntityType.PROJECTILE), 0);
  assert.equal(entitySpawnSlots(nearLimit, EntityType.PROJECTILE, 16), 0);
  assert.equal(canSpawnEntityType(nearLimit, EntityType.PROJECTILE), false);
});
