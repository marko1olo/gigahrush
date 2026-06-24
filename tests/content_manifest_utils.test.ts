import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { World } from '../src/core/world';
import {
  getPoiGenerationMetadata,
  recordPoiGenerationMetadata,
} from '../src/gen/content_manifest_utils';

test('getPoiGenerationMetadata returns the array associated with the World object in the WeakMap', () => {
  const metadata = { id: 'test-poi', floor: '1' };

  // We use the real record function to set it up since the production code
  // explicitly uses a WeakMap to link metadata to the World reference.
  const mockWorld = {
     rooms: [],
     containers: []
  } as unknown as World;

  recordPoiGenerationMetadata(mockWorld, metadata);

  const result = getPoiGenerationMetadata(mockWorld);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, metadata.id);
  assert.equal(result[0].floor, metadata.floor);
});

test('getPoiGenerationMetadata returns an empty array for a World object without recorded metadata', () => {
  const mockWorld = {
     rooms: [],
     containers: []
  } as unknown as World;

  const result = getPoiGenerationMetadata(mockWorld);
  assert.deepEqual(result, []);
});
