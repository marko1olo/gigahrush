import { RoomType, Feature, W, type Entity } from '../../core/types';
import { World } from '../../core/world';
import { stampRoom } from '../shared';
import type { FloorGeneration } from '../floor_manifest';

export const HORROR_FLOOR_ID = 'horrorfloor';

export function generateHorrorFloor(): FloorGeneration {
  const world = new World();
  const entities: Entity[] = [];

  const rx = 10;
  const ry = 10;
  const w = W - 20;
  const h = W - 20;

  // Fill with walls
  world.cells.fill(1);

  // Carve a large main room
  stampRoom(world, 1, RoomType.LIVING, rx + 5, ry + 5, w - 10, h - 10, -1);

  // Place a hiding spot (Feature.SHELF)
  world.features[world.idx(rx + 10, ry + 10)] = Feature.SHELF;

  return { world, entities, spawnX: rx + 15, spawnY: ry + 15 };
}
