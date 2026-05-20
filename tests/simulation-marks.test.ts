import test from 'node:test';
import assert from 'node:assert/strict';
import { Cell, EntityType, ProjType, type Entity } from '../src/core/types';
import { World } from '../src/core/world';
import { updateBloodTrails, spawnProjectileFloorImpact } from '../src/render/blood';

function withRandom<T>(value: number, fn: () => T): T {
  const saved = Math.random;
  Math.random = () => value;
  try {
    return fn();
  } finally {
    Math.random = saved;
  }
}

function farNpc(): Entity {
  return {
    id: 1001,
    type: EntityType.NPC,
    x: 900.5,
    y: 850.5,
    angle: 0,
    pitch: 0,
    alive: true,
    speed: 1,
    sprite: 0,
    hp: 10,
    maxHp: 100,
  };
}

test('wounded far-away actors still leave persistent blood marks in world surface state', () => {
  const world = new World();
  world.set(900, 850, Cell.FLOOR);
  const beforeVersion = world.surfaceVersion;

  withRandom(0, () => updateBloodTrails(world, [farNpc()], 1));

  const cell = world.idx(900, 850);
  assert.ok(world.surfaceVersion > beforeVersion);
  assert.ok(world.surfaceMap.has(cell), 'far blood mark should be stamped into the world, not gated by player distance');
});

test('far-away projectile impacts still leave persistent bullet marks in world surface state', () => {
  const world = new World();
  world.set(900, 850, Cell.FLOOR);
  const beforeVersion = world.surfaceVersion;

  spawnProjectileFloorImpact(world, 900.5, 850.5, undefined, ProjType.NORMAL);

  const cell = world.idx(900, 850);
  assert.ok(world.surfaceVersion > beforeVersion);
  assert.ok(world.surfaceMap.has(cell), 'far bullet mark should be stamped into the world, not gated by rendering distance');
});
