import { FloorLevel } from '../core/types';

export type DesignFloorId =
  | 'roof'
  | 'chthonic_attic'
  | 'antenna_court'
  | 'upper_bureau'
  | 'bank_floor'
  | 'raionsovet_archive'
  | 'registry_morgue'
  | 'manhattan_crossroads'
  | 'communal_ring'
  | 'pioneer_camp'
  | 'floor_69'
  | 'black_market_88'
  | 'production_belt'
  | 'service_floor'
  | 'dark_metro'
  | 'underhell'
  | 'darkness';

export interface DesignFloorRouteDef {
  id: DesignFloorId;
  z: number;
  displayName: string;
  baseFloor: FloorLevel;
  color: string;
}

export const DESIGN_FLOOR_ROUTES: readonly DesignFloorRouteDef[] = [
  { id: 'roof', z: -44, displayName: 'Крыша', baseFloor: FloorLevel.MINISTRY, color: '#9cf' },
  { id: 'chthonic_attic', z: -40, displayName: 'Хтонический чердак', baseFloor: FloorLevel.MINISTRY, color: '#c8f' },
  { id: 'antenna_court', z: -36, displayName: 'Антенный двор', baseFloor: FloorLevel.MINISTRY, color: '#8ff' },
  { id: 'pioneer_camp', z: -32, displayName: 'Пионерлагерь', baseFloor: FloorLevel.LIVING, color: '#6d8' },
  { id: 'upper_bureau', z: -28, displayName: 'Верхнее бюро', baseFloor: FloorLevel.MINISTRY, color: '#fc4' },
  { id: 'bank_floor', z: -22, displayName: 'Банковский этаж', baseFloor: FloorLevel.MINISTRY, color: '#fd6' },
  { id: 'raionsovet_archive', z: -20, displayName: 'Райсовет и Живой архив', baseFloor: FloorLevel.MINISTRY, color: '#fc4' },
  { id: 'registry_morgue', z: -16, displayName: 'Морг регистраций', baseFloor: FloorLevel.MINISTRY, color: '#ccc' },
  { id: 'manhattan_crossroads', z: -8, displayName: 'Перекрестки', baseFloor: FloorLevel.KVARTIRY, color: '#fa4' },
  { id: 'communal_ring', z: -4, displayName: 'Коммунальное кольцо', baseFloor: FloorLevel.KVARTIRY, color: '#fa4' },
  { id: 'floor_69', z: 4, displayName: 'Этаж 69', baseFloor: FloorLevel.MAINTENANCE, color: '#f8a' },
  { id: 'black_market_88', z: 8, displayName: 'Черный рынок 88', baseFloor: FloorLevel.LIVING, color: '#fd4' },
  { id: 'production_belt', z: 12, displayName: 'Производственный пояс', baseFloor: FloorLevel.MAINTENANCE, color: '#fd6' },
  { id: 'service_floor', z: 16, displayName: 'Служебный этаж', baseFloor: FloorLevel.MAINTENANCE, color: '#8cf' },
  { id: 'dark_metro', z: 24, displayName: 'Темная пересадка', baseFloor: FloorLevel.MAINTENANCE, color: '#79f' },
  { id: 'underhell', z: 32, displayName: 'Ниже ада', baseFloor: FloorLevel.HELL, color: '#f44' },
  { id: 'darkness', z: 40, displayName: 'Тьма', baseFloor: FloorLevel.VOID, color: '#88f' },
];

export const DESIGN_FLOOR_ZS: readonly number[] = DESIGN_FLOOR_ROUTES.map(def => def.z);

export function designFloorById(id: string): DesignFloorRouteDef | undefined {
  return DESIGN_FLOOR_ROUTES.find(def => def.id === id);
}

export function designFloorAtZ(z: number): DesignFloorRouteDef | undefined {
  return DESIGN_FLOOR_ROUTES.find(def => def.z === z);
}
