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
  | 'silicon_net_well'
  | 'dark_metro'
  | 'underhell'
  | 'podad'
  | 'darkness';

export interface DesignFloorRouteDef {
  id: DesignFloorId;
  z: number;
  displayName: string;
  baseFloor: FloorLevel;
  color: string;
  role: string;
  danger: 1 | 2 | 3 | 4 | 5;
}

export const DESIGN_FLOOR_ROUTES: readonly DesignFloorRouteDef[] = [
  { id: 'roof', z: 50, displayName: 'Крыша', baseFloor: FloorLevel.MINISTRY, color: '#9cf', role: 'воздух, антенны, видимость', danger: 2 },
  { id: 'chthonic_attic', z: 46, displayName: 'Чердак техслужб', baseFloor: FloorLevel.MINISTRY, color: '#c8f', role: 'техчердак, тайники, старые шахты', danger: 3 },
  { id: 'antenna_court', z: 42, displayName: 'Антенный двор', baseFloor: FloorLevel.MINISTRY, color: '#8ff', role: 'связь, наружный ветер, обзор', danger: 2 },
  { id: 'pioneer_camp', z: 38, displayName: 'Пионерлагерь', baseFloor: FloorLevel.LIVING, color: '#6d8', role: 'социальный лагерь, детские запасы', danger: 2 },
  { id: 'upper_bureau', z: 34, displayName: 'Верхнее бюро', baseFloor: FloorLevel.MINISTRY, color: '#fc4', role: 'документы и доступ', danger: 3 },
  { id: 'bank_floor', z: 26, displayName: 'Банковский этаж', baseFloor: FloorLevel.MINISTRY, color: '#fd6', role: 'деньги, долги, сейфы', danger: 3 },
  { id: 'raionsovet_archive', z: 22, displayName: 'Райсовет и архив картотек', baseFloor: FloorLevel.MINISTRY, color: '#fc4', role: 'архивы, картотеки, пропуска', danger: 3 },
  { id: 'registry_morgue', z: 18, displayName: 'Морг регистраций', baseFloor: FloorLevel.MINISTRY, color: '#ccc', role: 'мертвые записи и проверки', danger: 4 },
  { id: 'manhattan_crossroads', z: 8, displayName: 'Перекрестки', baseFloor: FloorLevel.KVARTIRY, color: '#fa4', role: 'городской обход и развилки', danger: 3 },
  { id: 'communal_ring', z: 4, displayName: 'Коммунальное кольцо', baseFloor: FloorLevel.KVARTIRY, color: '#fa4', role: 'социальный обход', danger: 2 },
  { id: 'floor_69', z: -4, displayName: 'Этаж 69', baseFloor: FloorLevel.MAINTENANCE, color: '#f8a', role: 'населенный сбой, сделки, слухи', danger: 3 },
  { id: 'black_market_88', z: -10, displayName: 'Черный рынок 88', baseFloor: FloorLevel.LIVING, color: '#fd4', role: 'торговля, контрабанда, долги', danger: 3 },
  { id: 'production_belt', z: -14, displayName: 'Производственный пояс', baseFloor: FloorLevel.MAINTENANCE, color: '#fd6', role: 'лут и ремонт', danger: 4 },
  { id: 'service_floor', z: -18, displayName: 'Служебный этаж', baseFloor: FloorLevel.MAINTENANCE, color: '#8cf', role: 'служебный обход и ремонт', danger: 3 },
  { id: 'silicon_net_well', z: -22, displayName: 'Кремниевый НЕТ-колодец', baseFloor: FloorLevel.MAINTENANCE, color: '#63f6ff', role: 'НЕТ-доступ, кремниевая жизнь, редкое оружие', danger: 4 },
  { id: 'dark_metro', z: -32, displayName: 'Темная пересадка', baseFloor: FloorLevel.MAINTENANCE, color: '#79f', role: 'опасный короткий ход', danger: 4 },
  { id: 'underhell', z: -38, displayName: 'Нижний пропускник', baseFloor: FloorLevel.HELL, color: '#f44', role: 'боевой порог мясного низа', danger: 5 },
  { id: 'podad', z: -40, displayName: 'Подад', baseFloor: FloorLevel.HELL, color: '#d34', role: 'живые тоннели, двигающиеся стены, нижний порог', danger: 5 },
  { id: 'darkness', z: -48, displayName: 'Темный отсек', baseFloor: FloorLevel.VOID, color: '#88f', role: 'позднее давление', danger: 5 },
];

export const DESIGN_FLOOR_ZS: readonly number[] = DESIGN_FLOOR_ROUTES.map(def => def.z);

export function designFloorById(id: string): DesignFloorRouteDef | undefined {
  return DESIGN_FLOOR_ROUTES.find(def => def.id === id);
}

export function designFloorAtZ(z: number): DesignFloorRouteDef | undefined {
  return DESIGN_FLOOR_ROUTES.find(def => def.z === z);
}
