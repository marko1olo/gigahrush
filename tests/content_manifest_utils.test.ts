import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { syncNextEntityId } from '../src/gen/content_manifest_utils';
import { EntityType, type Entity } from '../src/core/types';

describe('syncNextEntityId', () => {
  it('returns nextId if entities array is empty', () => {
    const entities: Entity[] = [];
    assert.equal(syncNextEntityId(entities, 1), 1);
    assert.equal(syncNextEntityId(entities, 42), 42);
  });

  it('returns nextId if all entity IDs are lower', () => {
    const entities = [
      { id: 1 } as Entity,
      { id: 2 } as Entity,
      { id: 3 } as Entity,
    ];
    assert.equal(syncNextEntityId(entities, 5), 5);
  });

  it('returns max(entityId) + 1 if there are entities with IDs >= nextId', () => {
    const entities = [
      { id: 1 } as Entity,
      { id: 5 } as Entity,
      { id: 2 } as Entity,
    ];
    assert.equal(syncNextEntityId(entities, 1), 6);
  });

  it('works with negative nextId (although unlikely in practice)', () => {
    const entities = [
      { id: 1 } as Entity,
    ];
    assert.equal(syncNextEntityId(entities, -5), 2);
  });

  it('handles entities with negative IDs', () => {
    const entities = [
      { id: -10 } as Entity,
      { id: -5 } as Entity,
    ];
    assert.equal(syncNextEntityId(entities, -20), -4);
  });

  it('handles entities array with one element equal to nextId', () => {
    const entities = [
      { id: 5 } as Entity,
    ];
    assert.equal(syncNextEntityId(entities, 5), 6);
  });
});
