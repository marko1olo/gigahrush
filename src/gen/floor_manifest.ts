/* ── Floor generation manifest ──────────────────────────────────
 * One authoritative place for FloorLevel -> generator mapping.
 */

import { FloorLevel, type Entity } from '../core/types';
import { World } from '../core/world';
import { generateMinistry } from './ministry';
import { generateKvartiry, resetKvPopulationState } from './kvartiry';
import { generateWorld } from './living';
import { generateMaintenance } from './maintenance';
import { generateHell } from './hell';
import { generateVoid } from './void';
import { withoutNpcEntities } from './entity_filters';

export interface FloorGeneration {
  world: World;
  entities: Entity[];
  spawnX: number;
  spawnY: number;
}

export const FLOOR_NAMES: Record<FloorLevel, string> = {
  [FloorLevel.MINISTRY]: 'Министерство',
  [FloorLevel.KVARTIRY]: 'Квартиры',
  [FloorLevel.LIVING]: 'Жилая зона',
  [FloorLevel.MAINTENANCE]: 'Коллекторы',
  [FloorLevel.HELL]: 'Мясной низ',
  [FloorLevel.VOID]: 'Пустота',
};

export function floorLevelDisplayName(floor: FloorLevel): string {
  return FLOOR_NAMES[floor];
}

export const FLOOR_MESSAGE_COLORS: Record<FloorLevel, string> = {
  [FloorLevel.MINISTRY]: '#fc4',
  [FloorLevel.KVARTIRY]: '#fa4',
  [FloorLevel.LIVING]: '#4af',
  [FloorLevel.MAINTENANCE]: '#4af',
  [FloorLevel.HELL]: '#f44',
  [FloorLevel.VOID]: '#0f8',
};

export function nextFloorEntrySamosborTimer(floor: FloorLevel): number {
  switch (floor) {
    case FloorLevel.MINISTRY: return 600 + Math.random() * 600;
    case FloorLevel.KVARTIRY: return 240 + Math.random() * 360;
    case FloorLevel.MAINTENANCE: return 180 + Math.random() * 240;
    case FloorLevel.HELL: return 60 + Math.random() * 240;
    case FloorLevel.VOID: return 40 + Math.random() * 120;
    case FloorLevel.LIVING:
    default: return 300 + Math.random() * 300;
  }
}

export function nextPostSamosborTimer(floor: FloorLevel): number {
  switch (floor) {
    case FloorLevel.MINISTRY: return 600 + Math.random() * 600;
    case FloorLevel.KVARTIRY: return 240 + Math.random() * 360;
    case FloorLevel.MAINTENANCE: return 180 + Math.random() * 240;
    case FloorLevel.HELL: return 60 + Math.random() * 240;
    case FloorLevel.LIVING:
    case FloorLevel.VOID:
    default: return 300 + Math.random() * 300;
  }
}

export function resetGeneratedFloorPopulationState(): void {
  resetKvPopulationState();
}

const FLOOR_GENERATORS: Record<FloorLevel, () => FloorGeneration> = {
  [FloorLevel.MINISTRY]: generateMinistry,
  [FloorLevel.KVARTIRY]: generateKvartiry,
  [FloorLevel.LIVING]: generateWorld,
  [FloorLevel.MAINTENANCE]: generateMaintenance,
  [FloorLevel.HELL]: generateHell,
  [FloorLevel.VOID]: generateVoid,
};

export function isFloorLevel(value: unknown): value is FloorLevel {
  return typeof value === 'number' && value in FLOOR_GENERATORS;
}

export function generateFloor(floor: FloorLevel): FloorGeneration {
  const generation = FLOOR_GENERATORS[floor]();
  return floor === FloorLevel.VOID ? withoutNpcEntities(generation) : generation;
}
