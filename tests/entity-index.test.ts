import test from 'node:test';
import assert from 'node:assert/strict';
import { EntityType, Faction, W, type Entity } from '../src/core/types';
import {
  ENTITY_MASK_ACTOR,
  ENTITY_MASK_MONSTER,
  ENTITY_MASK_NPC,
  EntityIndex,
} from '../src/systems/entity_index';

function entity(id: number, type: EntityType, x: number, y: number, alive = true): Entity {
  return {
    id,
    type,
    x,
    y,
    angle: 0,
    pitch: 0,
    alive,
    speed: 0,
    sprite: 0,
    faction: type === EntityType.NPC ? Faction.CITIZEN : undefined,
  };
}

test('entity index keeps alive byId entries and ignores dead entities', () => {
  const index = new EntityIndex();
  index.rebuild([
    entity(1, EntityType.NPC, 10, 10),
    entity(2, EntityType.MONSTER, 11, 10, false),
  ]);

  assert.equal(index.byId.get(1)?.id, 1);
  assert.equal(index.byId.has(2), false);
});

test('entity index exposes live AI actors and projectiles', () => {
  const index = new EntityIndex();
  const npc = entity(1, EntityType.NPC, 10, 10);
  npc.needs = { food: 100, water: 100, sleep: 100, pee: 0, poo: 0 };
  const projectile = entity(2, EntityType.PROJECTILE, 11, 10);
  const drop = entity(3, EntityType.ITEM_DROP, 12, 10);
  npc.ai = { goal: 0, tx: 0, ty: 0, path: [], pi: 0, stuck: 0, timer: 0 };
  projectile.projLife = 1;
  index.rebuild([npc, projectile, drop]);

  assert.deepEqual(index.actors.map(e => e.id), [1]);
  assert.deepEqual(index.ai.map(e => e.id), [1]);
  assert.deepEqual(index.needs.map(e => e.id), [1]);
  assert.deepEqual(index.projectiles.map(e => e.id), [2]);
});

test('entity index radius queries wrap around the torus edge', () => {
  const index = new EntityIndex();
  index.rebuild([
    entity(1, EntityType.NPC, 1, 1),
    entity(2, EntityType.MONSTER, W - 2, 1),
    entity(3, EntityType.NPC, W / 2, W / 2),
  ]);

  const out: Entity[] = [];
  index.queryRadius(0, 1, 4, out, ENTITY_MASK_ACTOR);

  assert.deepEqual(out.map(e => e.id).sort((a, b) => a - b), [1, 2]);
});

test('entity index type masks filter query results', () => {
  const index = new EntityIndex();
  index.rebuild([
    entity(1, EntityType.NPC, 20, 20),
    entity(2, EntityType.MONSTER, 21, 20),
    entity(3, EntityType.ITEM_DROP, 22, 20),
  ]);

  const out: Entity[] = [];
  index.queryRadius(20, 20, 6, out, ENTITY_MASK_NPC);
  assert.deepEqual(out.map(e => e.id), [1]);

  index.queryRadius(20, 20, 6, out, ENTITY_MASK_MONSTER);
  assert.deepEqual(out.map(e => e.id), [2]);
});
