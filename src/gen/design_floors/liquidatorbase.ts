import {
      FloorLevel,
      RoomType,
  Tex,
  ZoneFaction,
  type Entity,
    } from '../../core/types';
import { World } from '../../core/world';
import { ensureConnectivity, generateZones, sanitizeDoors, stampRoom } from '../shared';
import type { FloorGeneration } from '../floor_manifest';

export const DESIGN_FLOOR_ID = 'liquidatorbase' as const;
export const LIQUIDATORBASE_ROUTE_Z = -12;
export const LIQUIDATORBASE_BASE_FLOOR = FloorLevel.MAINTENANCE;

export function reinforceLiquidatorbaseAuthoredHqTerritory(_world: World): void {
  // Can be used to strictly enforce territory based on room names or coords if needed.
}

export function alignLiquidatorbaseAmbientNpcTerritory(_world: World, _entities: Entity[]): void {
  // Can be used to ensure NPCs spawned match territory.
}

export function generateLiquidatorbaseDesignFloor(): FloorGeneration {
  const world = new World();
  world.wallTex.fill(Tex.METAL); // Clean metal walls
  world.floorTex.fill(Tex.F_CONCRETE);
  world.factionControl.fill(ZoneFaction.LIQUIDATOR);

  // Example geometry setup
  const spawnX = 10;
  const spawnY = 10;

  stampRoom(world, 1, RoomType.HQ, 5, 5, 10, 10, -1);
  stampRoom(world, 2, RoomType.COMMON, 20, 20, 40, 40, -1); // Arena
  stampRoom(world, 3, RoomType.LIVING, 65, 20, 20, 15, -1); // Barracks
  stampRoom(world, 4, RoomType.STORAGE, 65, 40, 20, 15, -1); // Armory

  sanitizeDoors(world);
  ensureConnectivity(world, spawnX, spawnY);
  generateZones(world);

  const entities: Entity[] = [];

  world.bakeLights();
  return { world, entities, spawnX, spawnY };
}
