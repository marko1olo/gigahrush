import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/core/world';
import { recordPoiGenerationMetadata, getPoiGenerationMetadata, clearPoiGenerationMetadata } from '../src/gen/content_manifest_utils';

test('recordPoiGenerationMetadata adds a new metadata entry to the World object', () => {
  const world = new World();
  const metadata = { id: 'test_poi', debugLabel: 'Test POI' };

  recordPoiGenerationMetadata(world, metadata);

  const entries = getPoiGenerationMetadata(world);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].id, 'test_poi');
  assert.equal(entries[0].debugLabel, 'Test POI');
});

test('recordPoiGenerationMetadata deduplicates array properties', () => {
  const world = new World();
  const metadata = {
    id: 'test_poi_arrays',
    roomIds: [1, 2, 2, 3],
    npcIds: [10, 10, 20],
    containerIds: [100, 200, 100],
  };

  recordPoiGenerationMetadata(world, metadata);

  const entries = getPoiGenerationMetadata(world);
  assert.equal(entries.length, 1);
  assert.deepEqual(entries[0].roomIds, [1, 2, 3]);
  assert.deepEqual(entries[0].npcIds, [10, 20]);
  assert.deepEqual(entries[0].containerIds, [100, 200]);
});

test('recordPoiGenerationMetadata overwrites existing metadata with the same id', () => {
  const world = new World();
  const metadata_v1 = { id: 'test_poi_overwrite', debugLabel: 'v1', roomIds: [1] };
  const metadata_v2 = { id: 'test_poi_overwrite', debugLabel: 'v2', npcIds: [2] };

  recordPoiGenerationMetadata(world, metadata_v1);
  recordPoiGenerationMetadata(world, metadata_v2);

  const entries = getPoiGenerationMetadata(world);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].id, 'test_poi_overwrite');
  assert.equal(entries[0].debugLabel, 'v2');
  assert.deepEqual(entries[0].npcIds, [2]);
  assert.equal(entries[0].roomIds, undefined);
});
