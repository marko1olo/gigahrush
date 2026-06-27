
import { World } from '../../core/world';
import type { Entity } from '../../core/types';
import type { FloorGeneration } from '../floor_manifest';

export function generateLiquidatorBaseDesignFloor(): FloorGeneration {
  const world = new World();
  const entities: Entity[] = [];
  const spawnX = 50.5;
  const spawnY = 50.5;
  return { world, entities, spawnX, spawnY };
}
