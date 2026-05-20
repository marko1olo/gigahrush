import { Faction, FloorLevel } from '../core/types';
import { RESOURCE_BY_ID } from './resources';

export interface CaravanResourceDelta {
  resourceId: string;
  count: number;
}

export interface CaravanLaneDef {
  id: string;
  name: string;
  fromFloor: FloorLevel;
  toFloor: FloorLevel;
  resourceDeltas: readonly CaravanResourceDelta[];
  tariffResourceIds: readonly string[];
  feeRubles: number;
  riskTags: readonly string[];
  corpIds?: readonly string[];
  faction: Faction;
  startsOpen?: boolean;
}

const FLOOR_IDS = new Set(
  Object.values(FloorLevel).filter((value): value is FloorLevel => typeof value === 'number'),
);

export const CARAVAN_LANES: readonly CaravanLaneDef[] = [
  {
    id: 'kvartiry_living_food_water',
    name: 'Квартиры -> жилая очередь воды и еды',
    fromFloor: FloorLevel.KVARTIRY,
    toFloor: FloorLevel.LIVING,
    resourceDeltas: [{ resourceId: 'food', count: 6 }, { resourceId: 'drink_water', count: 5 }],
    tariffResourceIds: ['food', 'drink_water'],
    feeRubles: 18,
    riskTags: ['riot', 'queue', 'residential'],
    faction: Faction.CITIZEN,
  },
  {
    id: 'maintenance_living_tools',
    name: 'Коллекторы -> жилая ремонтная линия',
    fromFloor: FloorLevel.MAINTENANCE,
    toFloor: FloorLevel.LIVING,
    resourceDeltas: [{ resourceId: 'metal', count: 5 }, { resourceId: 'tools', count: 3 }],
    tariffResourceIds: ['metal', 'tools'],
    feeRubles: 24,
    riskTags: ['pressure', 'repair', 'pipes'],
    faction: Faction.CITIZEN,
  },
  {
    id: 'production_black_market_88',
    name: 'Производственный пояс -> рынок 88',
    fromFloor: FloorLevel.MAINTENANCE,
    toFloor: FloorLevel.LIVING,
    resourceDeltas: [{ resourceId: 'contraband', count: 3 }, { resourceId: 'ammo', count: 4 }],
    tariffResourceIds: ['contraband', 'ammo'],
    feeRubles: 36,
    riskTags: ['black_market', 'audit', 'ambush'],
    corpIds: ['market88'],
    faction: Faction.WILD,
  },
  {
    id: 'ministry_market_docs',
    name: 'Министерство -> рынок бумаг и банка',
    fromFloor: FloorLevel.MINISTRY,
    toFloor: FloorLevel.LIVING,
    resourceDeltas: [{ resourceId: 'documents', count: 5 }, { resourceId: 'paper', count: 4 }],
    tariffResourceIds: ['documents', 'paper'],
    feeRubles: 30,
    riskTags: ['stamp', 'audit', 'permit'],
    corpIds: ['ministry_registry'],
    faction: Faction.LIQUIDATOR,
  },
  {
    id: 'hell_cult_psi_goods',
    name: 'Мясной низ -> культовые ПСИ-грузы',
    fromFloor: FloorLevel.HELL,
    toFloor: FloorLevel.LIVING,
    resourceDeltas: [{ resourceId: 'psi', count: 2 }, { resourceId: 'contraband', count: 2 }],
    tariffResourceIds: ['psi', 'contraband'],
    feeRubles: 42,
    riskTags: ['cult', 'meat', 'psi'],
    faction: Faction.CULTIST,
  },
  {
    id: 'net_exchange_data',
    name: 'НЕТ-терминал -> обменные данные',
    fromFloor: FloorLevel.MINISTRY,
    toFloor: FloorLevel.LIVING,
    resourceDeltas: [{ resourceId: 'electronics', count: 3 }, { resourceId: 'documents', count: 2 }],
    tariffResourceIds: ['electronics', 'documents'],
    feeRubles: 28,
    riskTags: ['net', 'terminal', 'signal'],
    corpIds: ['net_sphere'],
    faction: Faction.SCIENTIST,
    startsOpen: false,
  },
];

export const CARAVAN_LANE_BY_ID: Record<string, CaravanLaneDef> = Object.fromEntries(
  CARAVAN_LANES.map(lane => [lane.id, lane]),
);

export function validateCaravanLanes(lanes: readonly CaravanLaneDef[] = CARAVAN_LANES): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const lane of lanes) {
    if (!lane.id || seen.has(lane.id)) errors.push(`lane:${lane.id || '<empty>'}:duplicate`);
    seen.add(lane.id);
    if (!FLOOR_IDS.has(lane.fromFloor)) errors.push(`${lane.id}:fromFloor`);
    if (!FLOOR_IDS.has(lane.toFloor)) errors.push(`${lane.id}:toFloor`);
    if (lane.resourceDeltas.length === 0) errors.push(`${lane.id}:resourceDeltas`);
    for (const delta of lane.resourceDeltas) {
      if (!RESOURCE_BY_ID[delta.resourceId]) errors.push(`${lane.id}:resource:${delta.resourceId}`);
      if (!Number.isFinite(delta.count) || delta.count <= 0) errors.push(`${lane.id}:count:${delta.resourceId}`);
    }
    for (const resourceId of lane.tariffResourceIds) {
      if (!RESOURCE_BY_ID[resourceId]) errors.push(`${lane.id}:tariffResource:${resourceId}`);
    }
    if (!Number.isFinite(lane.feeRubles) || lane.feeRubles < 0) errors.push(`${lane.id}:feeRubles`);
  }
  return errors;
}
