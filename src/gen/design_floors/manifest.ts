import {
  DESIGN_FLOOR_ROUTES,
  designFloorById,
  type DesignFloorId,
} from '../../data/design_floors';
import { hashSeed, withSeededRandom } from '../../core/rand';
import { floorRunZAllowsNpcs } from '../../data/procedural_floors';
import type { FloorGeneration } from '../floor_manifest';
import { withoutNpcEntities } from '../entity_filters';
import { generateAntennaCourtDesignFloor } from './antenna_court';
import { generateAttractorDvorDesignFloor } from './attractor_dvor';
import { generateBankFloorDesignFloor } from './bank_floor';
import { generateBolnichnyKorpusDesignFloor } from './bolnichny_korpus';
import { generateBlackMarket88DesignFloor } from './black_market_88';
import { generateCantorPustotyDesignFloor } from './cantor_pustoty';
import { generateCayleyByuroDesignFloor } from './cayley_byuro';
import { generateChthonicAtticDesignFloor } from './chthonic_attic';
import { generateCommunalRingDesignFloor } from './communal_ring';
import { generateCriticalLeakArchiveDesignFloor } from './critical_leak_archive';
import { generateDarkMetroDesignFloor } from './dark_metro';
import { generateDarknessDesignFloor } from './darkness';
import { generateFloor69DesignFloor } from './floor_69';
import { generateHarmonicBathhouseDesignFloor } from './harmonic_bathhouse';
import { generateHilbertDepotDesignFloor } from './hilbert_depot';
import { generateHyperbolicSwitchyardDesignFloor } from './hyperbolic_switchyard';
import { generateIstinniyLabirintDesignFloor } from './istinniy_labirint';
import { generateManhattanCrossroadsDesignFloor } from './manhattan_crossroads';
import { generateMarkovStairwellDesignFloor } from './markov_stairwell';
import { generateMoebiusPodezdDesignFloor } from './moebius_podezd';
import { generateNumberRegistryDesignFloor } from './number_registry';
import { generateObschezhitieSmenyDesignFloor } from './obschezhitie_smeny';
import { generateOranzhereyaBetonaDesignFloor } from './oranzhereya_betona';
import { generatePenroseLaundryDesignFloor } from './penrose_laundry';
import { generatePioneerCampDesignFloor } from './pioneer_camp';
import { generatePodadDesignFloor } from './podad';
import { generateProductionBeltDesignFloor } from './production_belt';
import { generateRadonExchangeDesignFloor } from './radon_exchange';
import { generateRaionsovetArchiveDesignFloor } from './raionsovet_archive';
import { generateRegistryMorgueDesignFloor } from './registry_morgue';
import { generateRoofDesignFloor } from './roof';
import { generateServiceFloorDesignFloor } from './service_floor';
import { generateShahtaAtriumDesignFloor } from './shahta_atrium';
import { generateSiliconNetWellDesignFloor } from './silicon_net_well';
import { generateSlimeNiiDesignFloor } from './slime_nii';
import { generateSpetspriemnikDesignFloor } from './spetspriemnik';
import { generateSpectralChasovnyaDesignFloor } from './spectral_chasovnya';
import { generateTuringNurseryDesignFloor } from './turing_nursery';
import { generateUnderhellDesignFloor } from './underhell';
import { generateUpperBureauDesignFloor } from './upper_bureau';
import { generateVoronoiQuarantineDesignFloor } from './voronoi_quarantine';
import { expandDesignFloorGeneration } from './full_floor';

const DESIGN_FLOOR_GENERATORS: Record<DesignFloorId, () => FloorGeneration> = {
  roof: generateRoofDesignFloor,
  chthonic_attic: generateChthonicAtticDesignFloor,
  radon_exchange: generateRadonExchangeDesignFloor,
  antenna_court: generateAntennaCourtDesignFloor,
  spetspriemnik: generateSpetspriemnikDesignFloor,
  cayley_byuro: generateCayleyByuroDesignFloor,
  upper_bureau: generateUpperBureauDesignFloor,
  number_registry: generateNumberRegistryDesignFloor,
  istinniy_labirint: generateIstinniyLabirintDesignFloor,
  bank_floor: generateBankFloorDesignFloor,
  critical_leak_archive: generateCriticalLeakArchiveDesignFloor,
  raionsovet_archive: generateRaionsovetArchiveDesignFloor,
  markov_stairwell: generateMarkovStairwellDesignFloor,
  registry_morgue: generateRegistryMorgueDesignFloor,
  bolnichny_korpus: generateBolnichnyKorpusDesignFloor,
  slime_nii: generateSlimeNiiDesignFloor,
  turing_nursery: generateTuringNurseryDesignFloor,
  manhattan_crossroads: generateManhattanCrossroadsDesignFloor,
  voronoi_quarantine: generateVoronoiQuarantineDesignFloor,
  communal_ring: generateCommunalRingDesignFloor,
  moebius_podezd: generateMoebiusPodezdDesignFloor,
  pioneer_camp: generatePioneerCampDesignFloor,
  oranzhereya_betona: generateOranzhereyaBetonaDesignFloor,
  floor_69: generateFloor69DesignFloor,
  obschezhitie_smeny: generateObschezhitieSmenyDesignFloor,
  penrose_laundry: generatePenroseLaundryDesignFloor,
  black_market_88: generateBlackMarket88DesignFloor,
  production_belt: generateProductionBeltDesignFloor,
  service_floor: generateServiceFloorDesignFloor,
  silicon_net_well: generateSiliconNetWellDesignFloor,
  shahta_atrium: generateShahtaAtriumDesignFloor,
  hyperbolic_switchyard: generateHyperbolicSwitchyardDesignFloor,
  harmonic_bathhouse: generateHarmonicBathhouseDesignFloor,
  hilbert_depot: generateHilbertDepotDesignFloor,
  dark_metro: generateDarkMetroDesignFloor,
  attractor_dvor: generateAttractorDvorDesignFloor,
  underhell: generateUnderhellDesignFloor,
  podad: generatePodadDesignFloor,
  spectral_chasovnya: generateSpectralChasovnyaDesignFloor,
  cantor_pustoty: generateCantorPustotyDesignFloor,
  darkness: generateDarknessDesignFloor,
};

const DEFAULT_DESIGN_FLOOR_SEED = 0x4453474e;

export function designFloorGenerationSeed(id: DesignFloorId, runSeed = DEFAULT_DESIGN_FLOOR_SEED): number {
  return hashSeed(`design-floor:${id}`, runSeed);
}

export function isDesignFloorId(id: string): id is DesignFloorId {
  return designFloorById(id) !== undefined;
}

export function designFloorGeneratorIds(): readonly DesignFloorId[] {
  return Object.keys(DESIGN_FLOOR_GENERATORS) as DesignFloorId[];
}

export function generateDesignFloor(id: DesignFloorId, runSeed = DEFAULT_DESIGN_FLOOR_SEED): FloorGeneration {
  const route = designFloorById(id);
  return withSeededRandom(designFloorGenerationSeed(id, runSeed), () => {
    const gen = DESIGN_FLOOR_GENERATORS[id]();
    if (!route) return gen;
    const expanded = expandDesignFloorGeneration(gen, route);
    return floorRunZAllowsNpcs(route.z) ? expanded : withoutNpcEntities(expanded);
  });
}

export function validateDesignFloorGenerators(): void {
  for (const def of DESIGN_FLOOR_ROUTES) {
    if (!DESIGN_FLOOR_GENERATORS[def.id]) {
      throw new Error(`Missing design floor generator: ${def.id}`);
    }
  }
}
