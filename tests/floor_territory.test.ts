import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { FloorLevel } from '../src/core/types';
import { DESIGN_FLOOR_ROUTES } from '../src/data/design_floors';
import {
  territorySharesForDesignFloor,
  territorySharesForProceduralSpec,
  territorySharesForStoryFloor,
} from '../src/data/floor_territory';
import type { FloorMajorityId, ProceduralFloorSpec, FloorAnomalyId } from '../src/data/procedural_floors';

function checkShares(shares: readonly { share: number }[], name: string) {
  assert.ok(shares, `${name} should return an array of shares`);
  let total = 0;
  for (const s of shares) {
    total += s.share;
  }
  assert.equal(total, 100, `${name} total share should equal 100`);
}

test('territorySharesForStoryFloor returns valid shares for all FloorLevel enum values summing to 100', () => {
  const storyFloors = Object.values(FloorLevel).filter(value => typeof value === 'number') as FloorLevel[];

  for (const floor of storyFloors) {
    const shares = territorySharesForStoryFloor(floor);
    checkShares(shares, `FloorLevel ${floor}`);
  }
});

test('territorySharesForDesignFloor returns valid shares for all design floors summing to 100', () => {
  for (const route of DESIGN_FLOOR_ROUTES) {
    const shares = territorySharesForDesignFloor(route.id);
    checkShares(shares, `DesignFloorId ${route.id}`);
  }
});

test('territorySharesForProceduralSpec returns valid shares summing to 100', () => {
  const mockSpec = (majorityId: FloorMajorityId, anomalyId: FloorAnomalyId): ProceduralFloorSpec => {
    return {
      key: 'test_spec',
      z: -10,
      ordinal: 1,
      seed: 1234,
      depth: 1,
      danger: 1,
      geometryId: 'living_blocks',
      baseFloor: FloorLevel.LIVING,
      majorityId,
      anomalyId,
      title: 'test',
      lootBiasIds: [],
      monsterBiasKinds: [],
      monsterBiasTags: [],
    };
  };

  const majorities: FloorMajorityId[] = ['citizens', 'liquidators', 'cultists', 'wild', 'scientists'];

  for (const majorityId of majorities) {
    const shares = territorySharesForProceduralSpec(mockSpec(majorityId, 'none'));
    checkShares(shares, `Procedural majority: ${majorityId}, anomaly: none`);
  }

  // Edge cases explicitly handled
  checkShares(territorySharesForProceduralSpec(mockSpec('citizens', 'false_safe_block')), "Procedural majority: citizens, anomaly: false_safe_block");
  checkShares(territorySharesForProceduralSpec(mockSpec('liquidators', 'false_safe_block')), "Procedural majority: liquidators, anomaly: false_safe_block");

  checkShares(territorySharesForProceduralSpec(mockSpec('cultists', 'samosbor_seed')), "Procedural majority: cultists, anomaly: samosbor_seed");
  checkShares(territorySharesForProceduralSpec(mockSpec('citizens', 'samosbor_seed')), "Procedural majority: citizens, anomaly: samosbor_seed");
  checkShares(territorySharesForProceduralSpec(mockSpec('liquidators', 'samosbor_seed')), "Procedural majority: liquidators, anomaly: samosbor_seed");

  checkShares(territorySharesForProceduralSpec(mockSpec('wild', 'zombie_apocalypse')), "Procedural majority: wild, anomaly: zombie_apocalypse");
});
