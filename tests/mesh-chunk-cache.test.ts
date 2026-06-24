import test from 'node:test';
import assert from 'node:assert/strict';

import { Cell, Feature, FloorLevel, RoomType, Tex, W } from '../src/core/types';
import { World, setVisualSlot as setWorldVisualSlot } from '../src/core/world';
import { createMeshChunkCache } from '../src/render/mesh/chunk_cache';
import {
  VISUAL_CELL_CODES,
  type MeshPassContext,
  type MeshInstance,
} from '../src/render/mesh/scene_collect';

function camera(x: number, y: number) {
  return { x, y, angle: 0, pitch: 0, height: 0, fovRadians: 1.0, mode: 'fp' as const };
}

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

function context(world: World, x = 10.5, y = 10.5, seed = 123, overrides: Partial<MeshPassContext> = {}): MeshPassContext {
  const base: MeshPassContext = {
    world,
    camera: camera(x, y),
    floorKey: 'test:mesh',
    seed,
    time: 0,
    profile: { radius: 8, instanceCap: 64, ceilingDetail: 0, furnitureDetail: 0 },
  };
  return {
    ...base,
    ...overrides,
    profile: { ...(base.profile ?? {}), ...(overrides.profile ?? {}) },
  };
}

test('chunk cache properly calculates chunk bounds and reusing', () => {
  const world = openWorld();
  const cache = createMeshChunkCache();

  const ctx = context(world, 10.5, 10.5, 123, {
    profile: { radius: 16, instanceCap: 64, chunkSize: 8, maxChunksPerFrame: 64 },
  });

  const out: MeshInstance[] = [];
  const stats = cache.update(ctx, out);

  assert.equal(stats.enabled, true);
  assert.ok(stats.chunksBuilt > 0);
  assert.equal(stats.chunksReused, 0);
});

test('chunk cache disables when profile is disabled', () => {
  const world = openWorld();
  const cache = createMeshChunkCache();

  const ctx = context(world, 10.5, 10.5, 123, {
    profile: { enabled: false },
  });

  const out: MeshInstance[] = [];
  const stats = cache.update(ctx, out);

  assert.equal(stats.enabled, false);
  assert.equal(stats.chunksConsidered, 0);
  assert.equal(stats.chunksBuilt, 0);
  assert.equal(stats.chunksReused, 0);
});

test('chunk cache invalidates when floorKey changes', () => {
  const world = openWorld();
  const cache = createMeshChunkCache();

  const profile = { radius: 16, instanceCap: 64, chunkSize: 8, maxChunksPerFrame: 64 };
  const ctx1 = context(world, 10.5, 10.5, 123, { profile, floorKey: 'story:living' });
  const ctx2 = context(world, 10.5, 10.5, 123, { profile, floorKey: 'story:bedroom' });

  const out: MeshInstance[] = [];
  const stats1 = cache.update(ctx1, out);
  assert.ok(stats1.chunksBuilt > 0);
  assert.equal(stats1.chunksReused, 0);

  const stats2 = cache.update(ctx2, out);
  assert.ok(stats2.chunksBuilt > 0);
  assert.equal(stats2.chunksReused, 0);
});

test('chunk cache invalidates when seed changes', () => {
  const world = openWorld();
  const cache = createMeshChunkCache();

  const profile = { radius: 16, instanceCap: 64, chunkSize: 8, maxChunksPerFrame: 64 };
  const ctx1 = context(world, 10.5, 10.5, 123, { profile });
  const ctx2 = context(world, 10.5, 10.5, 456, { profile });

  const out: MeshInstance[] = [];
  const stats1 = cache.update(ctx1, out);
  assert.ok(stats1.chunksBuilt > 0);
  assert.equal(stats1.chunksReused, 0);

  const stats2 = cache.update(ctx2, out);
  assert.ok(stats2.chunksBuilt > 0);
  assert.equal(stats2.chunksReused, 0);
});

test('chunk cache reuses chunks properly when nothing changes', () => {
  const world = openWorld();
  const cache = createMeshChunkCache();

  const ctx = context(world, 10.5, 10.5, 123, {
    profile: { radius: 16, instanceCap: 64, chunkSize: 8, maxChunksPerFrame: 64 },
  });

  const out: MeshInstance[] = [];
  const stats1 = cache.update(ctx, out);
  assert.ok(stats1.chunksBuilt > 0);
  assert.equal(stats1.chunksReused, 0);

  const stats2 = cache.update(ctx, out);
  assert.equal(stats2.chunksBuilt, 0);
  assert.ok(stats2.chunksReused > 0);
  assert.equal(stats2.chunksReused, stats1.chunksBuilt);
});

test('chunk cache honors maxChunksPerFrame', () => {
  const world = openWorld();
  const cache = createMeshChunkCache();

  const ctx = context(world, 10.5, 10.5, 123, {
    profile: { radius: 32, instanceCap: 64, chunkSize: 8, maxChunksPerFrame: 2 },
  });

  const out: MeshInstance[] = [];
  const stats1 = cache.update(ctx, out);
  assert.equal(stats1.chunksBuilt, 2);
  assert.equal(stats1.chunksReused, 0);

  const stats2 = cache.update(ctx, out);
  assert.equal(stats2.chunksBuilt, 2);
  assert.equal(stats2.chunksReused, 2);
});


test('chunk cache invalidates when world changes', () => {
  const world1 = openWorld();
  const world2 = openWorld();
  const cache = createMeshChunkCache();

  const profile = { radius: 16, instanceCap: 64, chunkSize: 8, maxChunksPerFrame: 64 };
  const ctx1 = context(world1, 10.5, 10.5, 123, { profile });
  const ctx2 = context(world2, 10.5, 10.5, 123, { profile });

  const out: MeshInstance[] = [];
  const stats1 = cache.update(ctx1, out);
  assert.ok(stats1.chunksBuilt > 0);
  assert.equal(stats1.chunksReused, 0);

  const stats2 = cache.update(ctx2, out);
  assert.ok(stats2.chunksBuilt > 0);
  assert.equal(stats2.chunksReused, 0);
});

test('chunk cache clears entries correctly', () => {
  const world = openWorld();
  const cache = createMeshChunkCache();

  const ctx = context(world, 10.5, 10.5, 123, {
    profile: { radius: 16, instanceCap: 64, chunkSize: 8, maxChunksPerFrame: 64 },
  });

  const out: MeshInstance[] = [];
  cache.update(ctx, out);
  cache.clear();

  const stats = cache.update(ctx, out);
  assert.ok(stats.chunksBuilt > 0);
  assert.equal(stats.chunksReused, 0);
});

test('chunk cache invalidates on visual slot version changes', () => {
  const world = openWorld();
  const cache = createMeshChunkCache();
  setWorldVisualSlot(world, world.idx(10, 10), 0, VISUAL_CELL_CODES.RUBBLE_CHUNK);

  const ctx = context(world, 10.5, 10.5, 123, {
    profile: { radius: 2, instanceCap: 64, chunkSize: 8, maxChunksPerFrame: 64 },
  });
  const out: MeshInstance[] = [];
  const first = cache.update(ctx, out);
  assert.equal(first.enabled, true);
  assert.ok(first.chunksBuilt > 0);
  assert.equal(out.some(instance => instance.modelId === 'rubble_chunk'), true);

  const second = cache.update(ctx, out);
  assert.equal(second.enabled, true);
  assert.equal(second.chunksBuilt, 0);
  assert.ok(second.chunksReused > 0);

  setWorldVisualSlot(world, world.idx(10, 11), 0, VISUAL_CELL_CODES.RUBBLE_CHUNK);
  const third = cache.update(ctx, out);
  assert.equal(third.enabled, true);
  assert.ok(third.chunksBuilt > 0);
});

test('chunk cache invalidates on cell version changes', () => {
  const world = openWorld();
  const cache = createMeshChunkCache();

  const ctx = context(world, 10.5, 10.5, 123, {
    profile: { radius: 2, instanceCap: 64, chunkSize: 8, maxChunksPerFrame: 64 },
  });
  const out: MeshInstance[] = [];
  const first = cache.update(ctx, out);
  assert.equal(first.enabled, true);
  assert.ok(first.chunksBuilt > 0);

  const second = cache.update(ctx, out);
  assert.equal(second.enabled, true);
  assert.equal(second.chunksBuilt, 0);
  assert.ok(second.chunksReused > 0);

  world.cells[world.idx(10, 10)] = Cell.WALL;
  world.cellVersion++;

  const third = cache.update(ctx, out);
  assert.equal(third.enabled, true);
  assert.ok(third.chunksBuilt > 0);
});

test('chunk cache invalidates on feature version changes', () => {
  const world = openWorld();
  const cache = createMeshChunkCache();

  const ctx = context(world, 10.5, 10.5, 123, {
    profile: { radius: 2, instanceCap: 64, chunkSize: 8, maxChunksPerFrame: 64 },
  });
  const out: MeshInstance[] = [];
  const first = cache.update(ctx, out);
  assert.equal(first.enabled, true);
  assert.ok(first.chunksBuilt > 0);

  const second = cache.update(ctx, out);
  assert.equal(second.enabled, true);
  assert.equal(second.chunksBuilt, 0);
  assert.ok(second.chunksReused > 0);

  world.features[world.idx(10, 10)] = Feature.TABLE;
  world.featureVersion++;

  const third = cache.update(ctx, out);
  assert.equal(third.enabled, true);
  assert.ok(third.chunksBuilt > 0);
});

test('chunk cache properly wraps across toroidal map bounds', () => {
  const world = openWorld();
  const cache = createMeshChunkCache();

  // Test across top-left wrap
  const ctx = context(world, 0.5, 0.5, 123, {
    profile: { radius: 16, instanceCap: 64, chunkSize: 8, maxChunksPerFrame: 64 },
  });

  const out: MeshInstance[] = [];
  const stats = cache.update(ctx, out);

  assert.equal(stats.enabled, true);
  assert.ok(stats.chunksBuilt > 0);

  // Test across bottom-right wrap
  const ctx2 = context(world, W - 0.5, W - 0.5, 123, {
    profile: { radius: 16, instanceCap: 64, chunkSize: 8, maxChunksPerFrame: 64 },
  });

  const out2: MeshInstance[] = [];
  const stats2 = cache.update(ctx2, out2);

  assert.equal(stats2.enabled, true);
  assert.ok(stats2.chunksBuilt > 0);
});
