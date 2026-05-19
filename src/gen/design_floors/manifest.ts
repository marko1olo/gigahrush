import {
  DESIGN_FLOOR_ROUTES,
  designFloorById,
  type DesignFloorId,
} from '../../data/design_floors';
import { floorRunZAllowsNpcs } from '../../data/procedural_floors';
import type { FloorGeneration } from '../floor_manifest';
import { withoutNpcEntities } from '../entity_filters';
import { generateAntennaCourtDesignFloor } from './antenna_court';
import { generateBankFloorDesignFloor } from './bank_floor';
import { generateBlackMarket88DesignFloor } from './black_market_88';
import { generateChthonicAtticDesignFloor } from './chthonic_attic';
import { generateCommunalRingDesignFloor } from './communal_ring';
import { generateDarkMetroDesignFloor } from './dark_metro';
import { generateDarknessDesignFloor } from './darkness';
import { generateFloor69DesignFloor } from './floor_69';
import { generateManhattanCrossroadsDesignFloor } from './manhattan_crossroads';
import { generatePioneerCampDesignFloor } from './pioneer_camp';
import { generateProductionBeltDesignFloor } from './production_belt';
import { generateRaionsovetArchiveDesignFloor } from './raionsovet_archive';
import { generateRegistryMorgueDesignFloor } from './registry_morgue';
import { generateRoofDesignFloor } from './roof';
import { generateServiceFloorDesignFloor } from './service_floor';
import { generateUnderhellDesignFloor } from './underhell';
import { generateUpperBureauDesignFloor } from './upper_bureau';
import { expandDesignFloorGeneration } from './full_floor';

const DESIGN_FLOOR_GENERATORS: Record<DesignFloorId, () => FloorGeneration> = {
  roof: generateRoofDesignFloor,
  chthonic_attic: generateChthonicAtticDesignFloor,
  antenna_court: generateAntennaCourtDesignFloor,
  upper_bureau: generateUpperBureauDesignFloor,
  bank_floor: generateBankFloorDesignFloor,
  raionsovet_archive: generateRaionsovetArchiveDesignFloor,
  registry_morgue: generateRegistryMorgueDesignFloor,
  manhattan_crossroads: generateManhattanCrossroadsDesignFloor,
  communal_ring: generateCommunalRingDesignFloor,
  pioneer_camp: generatePioneerCampDesignFloor,
  floor_69: generateFloor69DesignFloor,
  black_market_88: generateBlackMarket88DesignFloor,
  production_belt: generateProductionBeltDesignFloor,
  service_floor: generateServiceFloorDesignFloor,
  dark_metro: generateDarkMetroDesignFloor,
  underhell: generateUnderhellDesignFloor,
  darkness: generateDarknessDesignFloor,
};

export function isDesignFloorId(id: string): id is DesignFloorId {
  return designFloorById(id) !== undefined;
}

export function generateDesignFloor(id: DesignFloorId): FloorGeneration {
  const route = designFloorById(id);
  const gen = DESIGN_FLOOR_GENERATORS[id]();
  if (!route) return gen;
  const expanded = expandDesignFloorGeneration(gen, route);
  return floorRunZAllowsNpcs(route.z) ? expanded : withoutNpcEntities(expanded);
}

export function validateDesignFloorGenerators(): void {
  for (const def of DESIGN_FLOOR_ROUTES) {
    if (!DESIGN_FLOOR_GENERATORS[def.id]) {
      throw new Error(`Missing design floor generator: ${def.id}`);
    }
  }
}
