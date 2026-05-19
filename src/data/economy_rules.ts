import { Faction, FloorLevel, Occupation } from '../core/types';

export type EconomyFloorRef = FloorLevel | string;

export interface EconomyDemandRule {
  resourceId: string;
  floor?: EconomyFloorRef;
  multiplier: number;
  reason: string;
  tags?: readonly string[];
}

export interface EconomyTariffRule {
  resourceId?: string;
  floor?: EconomyFloorRef;
  multiplier: number;
  reason: string;
  tags?: readonly string[];
}

export interface EconomyTradeSpreadRule {
  id: string;
  occupation?: Occupation;
  faction?: Faction;
  buyMultiplier: number;
  sellMultiplier: number;
  reason: string;
  tags: readonly string[];
}

export const ECONOMY_DEMAND_RULES: readonly EconomyDemandRule[] = [
  { floor: FloorLevel.MINISTRY, resourceId: 'documents', multiplier: 1.36, reason: 'ministry_document_demand', tags: ['ministry', 'documents'] },
  { floor: FloorLevel.MINISTRY, resourceId: 'paper', multiplier: 1.28, reason: 'ministry_paper_queue', tags: ['ministry', 'paper'] },
  { floor: FloorLevel.MINISTRY, resourceId: 'medicine', multiplier: 1.12, reason: 'ministry_clinic_queue', tags: ['ministry', 'medicine'] },
  { floor: FloorLevel.MINISTRY, resourceId: 'food', multiplier: 1.10, reason: 'ministry_canteen_queue', tags: ['ministry', 'food'] },

  { floor: FloorLevel.KVARTIRY, resourceId: 'drink_water', multiplier: 1.34, reason: 'kvartiry_water_queue', tags: ['kvartiry', 'water'] },
  { floor: FloorLevel.KVARTIRY, resourceId: 'food', multiplier: 1.24, reason: 'kvartiry_food_queue', tags: ['kvartiry', 'food'] },
  { floor: FloorLevel.KVARTIRY, resourceId: 'medicine', multiplier: 1.18, reason: 'kvartiry_medicine_queue', tags: ['kvartiry', 'medicine'] },

  { floor: FloorLevel.LIVING, resourceId: 'food', multiplier: 1.08, reason: 'living_food_baseline', tags: ['living', 'food'] },
  { floor: FloorLevel.LIVING, resourceId: 'contraband', multiplier: 1.12, reason: 'living_contraband_appetite', tags: ['living', 'contraband'] },

  { floor: FloorLevel.MAINTENANCE, resourceId: 'metal', multiplier: 1.12, reason: 'maintenance_repair_demand', tags: ['maintenance', 'metal'] },
  { floor: FloorLevel.MAINTENANCE, resourceId: 'tools', multiplier: 1.10, reason: 'maintenance_tool_demand', tags: ['maintenance', 'tools'] },
  { floor: FloorLevel.MAINTENANCE, resourceId: 'fuel', multiplier: 1.22, reason: 'maintenance_fuel_demand', tags: ['maintenance', 'fuel'] },
  { floor: FloorLevel.MAINTENANCE, resourceId: 'electronics', multiplier: 1.18, reason: 'maintenance_electronics_demand', tags: ['maintenance', 'electronics'] },

  { floor: FloorLevel.HELL, resourceId: 'medicine', multiplier: 1.34, reason: 'hell_trauma_demand', tags: ['hell', 'medicine'] },
  { floor: FloorLevel.HELL, resourceId: 'psi', multiplier: 1.30, reason: 'hell_psi_demand', tags: ['hell', 'psi'] },
  { floor: FloorLevel.HELL, resourceId: 'fuel', multiplier: 1.18, reason: 'hell_burn_demand', tags: ['hell', 'fuel'] },

  { floor: FloorLevel.VOID, resourceId: 'psi', multiplier: 1.42, reason: 'void_psi_demand', tags: ['void', 'psi'] },
  { floor: FloorLevel.VOID, resourceId: 'electronics', multiplier: 1.22, reason: 'void_signal_demand', tags: ['void', 'electronics'] },
  { floor: FloorLevel.VOID, resourceId: 'documents', multiplier: 1.18, reason: 'void_record_demand', tags: ['void', 'documents'] },
];

export const ECONOMY_TARIFF_RULES: readonly EconomyTariffRule[] = [
  { floor: FloorLevel.MINISTRY, resourceId: 'documents', multiplier: 1.08, reason: 'ministry_stamp_tariff', tags: ['tariff', 'stamp'] },
  { floor: FloorLevel.MINISTRY, resourceId: 'paper', multiplier: 1.05, reason: 'ministry_form_tariff', tags: ['tariff', 'forms'] },
  { floor: FloorLevel.KVARTIRY, resourceId: 'drink_water', multiplier: 1.05, reason: 'kvartiry_queue_tariff', tags: ['tariff', 'ration'] },
  { floor: FloorLevel.KVARTIRY, resourceId: 'food', multiplier: 1.03, reason: 'kvartiry_ration_tariff', tags: ['tariff', 'ration'] },
  { floor: FloorLevel.MAINTENANCE, resourceId: 'metal', multiplier: 0.84, reason: 'maintenance_local_scrap', tags: ['tariff', 'local_supply'] },
  { floor: FloorLevel.MAINTENANCE, resourceId: 'tools', multiplier: 0.88, reason: 'maintenance_tool_exchange', tags: ['tariff', 'local_supply'] },
  { floor: FloorLevel.HELL, multiplier: 1.08, reason: 'hell_hazard_tariff', tags: ['tariff', 'hazard'] },
  { floor: FloorLevel.VOID, multiplier: 1.10, reason: 'void_anomaly_tariff', tags: ['tariff', 'anomaly'] },
];

export const DEFAULT_TRADE_SPREAD: EconomyTradeSpreadRule = {
  id: 'default',
  buyMultiplier: 1.15,
  sellMultiplier: 0.85,
  reason: 'default_trade_spread',
  tags: ['spread', 'default'],
};

export const ECONOMY_TRADE_SPREAD_RULES: readonly EconomyTradeSpreadRule[] = [
  {
    id: 'storekeeper',
    occupation: Occupation.STOREKEEPER,
    buyMultiplier: 1.12,
    sellMultiplier: 0.88,
    reason: 'storekeeper_spread',
    tags: ['spread', 'storekeeper'],
  },
  {
    id: 'wild_market',
    faction: Faction.WILD,
    buyMultiplier: 1.25,
    sellMultiplier: 0.72,
    reason: 'wild_market_spread',
    tags: ['spread', 'wild'],
  },
  {
    id: 'cult_buyer',
    faction: Faction.CULTIST,
    buyMultiplier: 1.20,
    sellMultiplier: 0.78,
    reason: 'cult_buyer_spread',
    tags: ['spread', 'cult'],
  },
  {
    id: 'liquidator_pressure',
    faction: Faction.LIQUIDATOR,
    buyMultiplier: 1.10,
    sellMultiplier: 0.75,
    reason: 'liquidator_pressure_spread',
    tags: ['spread', 'liquidator'],
  },
  {
    id: 'scientist_specimen',
    faction: Faction.SCIENTIST,
    buyMultiplier: 1.08,
    sellMultiplier: 0.92,
    reason: 'scientist_specimen_spread',
    tags: ['spread', 'scientist'],
  },
  {
    id: 'scientist_occupation',
    occupation: Occupation.SCIENTIST,
    buyMultiplier: 1.08,
    sellMultiplier: 0.92,
    reason: 'scientist_specimen_spread',
    tags: ['spread', 'scientist'],
  },
];
