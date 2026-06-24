import test from 'node:test';
import assert from 'node:assert/strict';

import { Cell, Feature, RoomType, Tex, W } from '../src/core/types';
import { World } from '../src/core/world';
import { createMeshChunkCache } from '../src/render/mesh/chunk_cache';
import { type MeshInstance, type MeshPassContext } from '../src/render/mesh/scene_collect';

function openWorld(): World {
  const world = new World();
  world.cells.fill(Cell.FLOOR);
  world.features.fill(Feature.NONE);
  world.rooms.push({
    id: 0,
    type: RoomType.COMMON,
    x: 0,
    y: 0,
    w: W,
    h: W,
    doors: [],
    sealed: false,
    name: 'test room',
    apartmentId: -1,
    wallTex: Tex.CONCRETE,
    floorTex: Tex.F_CONCRETE,
  });
  world.roomMap.fill(0);
  return world;
}

function camera(x: number, y: number) {
  return { x, y, z: 0, yaw: 0, pitch: 0, fov: 90, aspect: 1 };
}

function context(world: World, x = 10.5, y = 10.5, seed = 123, overrides: Partial<MeshPassContext> = {}): MeshPassContext {
  return {
    world,
    camera: camera(x, y),
    floorKey: 'test:mesh',
    seed,
    time: 0,
    profile: { radius: 8, instanceCap: 64, ceilingDetail: 0, furnitureDetail: 0 },
    ...overrides,
  };
}

test('MeshChunkCache handles disabled profile', () => {
  const world = openWorld();
  const cache = createMeshChunkCache();
  const ctx = context(world, 10.5, 10.5, 123, { mode: 'off' });

  const out: MeshInstance[] = [];
  const stats = cache.update(ctx, out);

  assert.equal(stats.enabled, false);
  assert.equal(stats.chunksBuilt, 0);
  assert.equal(out.length, 0);
});

test('MeshChunkCache reuses chunks when context is unchanged', () => {
  const world = openWorld();
  world.features[world.idx(10, 10)] = Feature.TABLE;

  const cache = createMeshChunkCache();
  const ctx = context(world, 10.5, 10.5, 123, {
    profile: { radius: 16, instanceCap: 64, chunkSize: 8, maxChunksPerFrame: 64 },
  });

  const out1: MeshInstance[] = [];
  const stats1 = cache.update(ctx, out1);

  assert.equal(stats1.enabled, true);
  assert.ok(stats1.chunksBuilt > 0);
  assert.equal(stats1.chunksReused, 0);

  const out2: MeshInstance[] = [];
  const stats2 = cache.update(ctx, out2);

  assert.equal(stats2.enabled, true);
  assert.equal(stats2.chunksBuilt, 0);
  assert.ok(stats2.chunksReused > 0);
  assert.equal(stats2.instances, stats1.instances);
  assert.deepEqual(out1, out2);
});

test('MeshChunkCache clears and rebuilds on floorKey change', () => {
  const world = openWorld();
  const cache = createMeshChunkCache();

  const ctx1 = context(world, 10.5, 10.5, 123, {
    floorKey: 'floor1',
    profile: { radius: 16, instanceCap: 64, chunkSize: 8, maxChunksPerFrame: 64 },
  });

  const out1: MeshInstance[] = [];
  const stats1 = cache.update(ctx1, out1);
  assert.ok(stats1.chunksBuilt > 0);

  const ctx2 = context(world, 10.5, 10.5, 123, {
    floorKey: 'floor2',
    profile: { radius: 16, instanceCap: 64, chunkSize: 8, maxChunksPerFrame: 64 },
  });

  const out2: MeshInstance[] = [];
  const stats2 = cache.update(ctx2, out2);
  assert.ok(stats2.chunksBuilt > 0);
  assert.equal(stats2.chunksReused, 0);
});

test('MeshChunkCache clears and rebuilds on seed change', () => {
  const world = openWorld();
  const cache = createMeshChunkCache();

  const ctx1 = context(world, 10.5, 10.5, 123, {
    profile: { radius: 16, instanceCap: 64, chunkSize: 8, maxChunksPerFrame: 64 },
  });

  const out1: MeshInstance[] = [];
  const stats1 = cache.update(ctx1, out1);
  assert.ok(stats1.chunksBuilt > 0);

  const ctx2 = context(world, 10.5, 10.5, 456, {
    profile: { radius: 16, instanceCap: 64, chunkSize: 8, maxChunksPerFrame: 64 },
  });

  const out2: MeshInstance[] = [];
  const stats2 = cache.update(ctx2, out2);
  assert.ok(stats2.chunksBuilt > 0);
  assert.equal(stats2.chunksReused, 0);
});

test('MeshChunkCache invalidates specific chunks on world version change', () => {
  const world = openWorld();
  world.features[world.idx(10, 10)] = Feature.TABLE;

  const cache = createMeshChunkCache();
  const ctx = context(world, 10.5, 10.5, 123, {
    profile: { radius: 16, instanceCap: 64, chunkSize: 8, maxChunksPerFrame: 64 },
  });

  const out1: MeshInstance[] = [];
  cache.update(ctx, out1);

  // modify world (cell version)
  world.cellVersion++;
  world.cells[world.idx(10, 10)] = Cell.WALL;

  const out2: MeshInstance[] = [];
  const stats2 = cache.update(ctx, out2);

  assert.equal(stats2.enabled, true);
  assert.ok(stats2.chunksBuilt > 0);
  assert.equal(stats2.chunksReused, 0);
});

test('MeshChunkCache respects maxChunksPerFrame', () => {
  const world = openWorld();
  const cache = createMeshChunkCache();

  const ctx = context(world, 10.5, 10.5, 123, {
    profile: { radius: 32, instanceCap: 64, chunkSize: 8, maxChunksPerFrame: 2 },
  });

  const out: MeshInstance[] = [];
  const stats = cache.update(ctx, out);

  assert.equal(stats.chunksBuilt, 2);
  assert.equal(stats.chunksReused, 0);
});
