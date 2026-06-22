import * as assert from "node:assert/strict";
import { test } from "node:test";
import {
  clearPoiGenerationMetadata,
  getPoiGenerationMetadata,
  recordPoiGenerationMetadata,
} from "../src/gen/content_manifest_utils";
import { World } from "../src/core/world";

test("clearPoiGenerationMetadata", () => {
  // Create a mock World object. We don't need all properties for this test,
  // just an object reference that we can cast to World.
  const world = {} as World;

  // Add some test metadata
  recordPoiGenerationMetadata(world, {
    id: "test_poi",
    floor: "test_floor",
  });

  // Verify metadata was added
  const initialMetadata = getPoiGenerationMetadata(world);
  assert.equal(initialMetadata.length, 1);
  assert.equal(initialMetadata[0].id, "test_poi");

  // Clear the metadata
  clearPoiGenerationMetadata(world);

  // Verify metadata is now empty
  const finalMetadata = getPoiGenerationMetadata(world);
  assert.equal(finalMetadata.length, 0);
});
