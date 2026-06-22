import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { World } from '../src/core/world';
import {
  clearPoiGenerationMetadata,
  getPoiGenerationMetadata,
  recordPoiGenerationMetadata,
} from '../src/gen/content_manifest_utils';

test('clearPoiGenerationMetadata clears POI metadata from a World object', () => {
  const world = new World();

  // Initially empty
  assert.deepEqual(getPoiGenerationMetadata(world), []);

  // Add some metadata
  recordPoiGenerationMetadata(world, {
    id: 'test_poi',
    floor: 'living',
  });

  // Verify it was added
  const metadata = getPoiGenerationMetadata(world);
  assert.equal(metadata.length, 1);
  assert.equal(metadata[0].id, 'test_poi');

  // Clear metadata
  clearPoiGenerationMetadata(world);

  // Verify it is empty again
  assert.deepEqual(getPoiGenerationMetadata(world), []);
});
