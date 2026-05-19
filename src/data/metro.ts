/* ── Metro Error Line route definitions ──────────────────────── */

import { FloorLevel } from '../core/types';

export const METRO_STATION_ROOM_NAME = 'Станция ошибочной линии: платформа 19';
export const METRO_DEPOT_ROOM_NAME = 'Депо без рельсов: карман маршрута';
export const METRO_ERROR_ROOM_NAME = 'Слепая пересадка: чужой вестибюль';

export type MetroDestination =
  | { kind: 'floor'; floor: FloorLevel; label: string; returnRouteId?: string; returnHint?: string }
  | { kind: 'local'; roomName: string; label: string; returnRouteId?: string; returnHint?: string };

export interface MetroRouteDef {
  id: string;
  stationRoomName: string;
  panelSlot: number;
  label: string;
  clue: string;
  requiredItem?: string;
  wrongStopChance: number;
  cooldownSec: number;
  destination: MetroDestination;
  wrongStops: readonly MetroDestination[];
  safeReturn?: boolean;
  rumorIds: readonly string[];
  tags: readonly string[];
}

const TO_STATION: MetroDestination = {
  kind: 'local',
  roomName: METRO_STATION_ROOM_NAME,
  label: 'Платформа 19',
  returnHint: 'Белые лампы выводят обратно к четырем табло.',
};
const TO_LIVING: MetroDestination = {
  kind: 'floor',
  floor: FloorLevel.LIVING,
  label: 'Жилая зона',
  returnHint: 'Обычный лифт на соседнем этаже вернет к коллекторам.',
};
const TO_HELL: MetroDestination = {
  kind: 'floor',
  floor: FloorLevel.HELL,
  label: 'Красная нижняя',
  returnHint: 'Не уходи от лифта: обратный подъем возвращает к коллекторам.',
};
const TO_DEPOT: MetroDestination = {
  kind: 'local',
  roomName: METRO_DEPOT_ROOM_NAME,
  label: 'Депо без рельсов',
  returnRouteId: 'metro_depot_return',
  returnHint: 'Белая служебная петля в депо возвращает на платформу.',
};
const TO_ERROR: MetroDestination = {
  kind: 'local',
  roomName: METRO_ERROR_ROOM_NAME,
  label: 'Слепая пересадка',
  returnRouteId: 'metro_error_safe_return',
  returnHint: 'Не читай голос: белый экран слева ведет назад.',
};

export const METRO_ROUTES: readonly MetroRouteDef[] = [
  {
    id: 'metro_living_loop',
    stationRoomName: METRO_STATION_ROOM_NAME,
    panelSlot: 0,
    label: 'Жилая петля',
    clue: 'Зеленое табло стабильно, если в кармане есть схема лифтов.',
    requiredItem: 'metro_ticket',
    wrongStopChance: 0.18,
    cooldownSec: 18,
    destination: TO_LIVING,
    wrongStops: [TO_ERROR, TO_DEPOT],
    rumorIds: ['floor_metro_error_line', 'floor_metro_wrong_voice'],
    tags: ['living_loop', 'ticket', 'return_hint'],
  },
  {
    id: 'metro_red_lower',
    stationRoomName: METRO_STATION_ROOM_NAME,
    panelSlot: 1,
    label: 'Красная нижняя',
    clue: 'Красный голос врет чаще всего; при самосборе жди второй щелчок стрелки.',
    requiredItem: 'metro_ticket',
    wrongStopChance: 0.34,
    cooldownSec: 24,
    destination: TO_HELL,
    wrongStops: [TO_ERROR, TO_DEPOT],
    rumorIds: ['floor_metro_red_line', 'floor_metro_wrong_voice'],
    tags: ['red_lower', 'ticket', 'high_risk'],
  },
  {
    id: 'metro_railess_depot',
    stationRoomName: METRO_STATION_ROOM_NAME,
    panelSlot: 2,
    label: 'Депо без рельсов',
    clue: 'Желтая стрелка ведет к предохранителям и запасной белой петле.',
    requiredItem: 'metro_ticket',
    wrongStopChance: 0.12,
    cooldownSec: 16,
    destination: TO_DEPOT,
    wrongStops: [TO_ERROR],
    rumorIds: ['floor_metro_depot'],
    tags: ['depot', 'ticket', 'transfer'],
  },
  {
    id: 'metro_blind_transfer',
    stationRoomName: METRO_STATION_ROOM_NAME,
    panelSlot: 3,
    label: 'Слепая пересадка',
    clue: 'Черное табло опасно, но в чужом вестибюле белый экран всегда ведет назад.',
    requiredItem: 'metro_ticket',
    wrongStopChance: 0.42,
    cooldownSec: 28,
    destination: TO_ERROR,
    wrongStops: [TO_DEPOT],
    rumorIds: ['floor_metro_wrong_voice'],
    tags: ['blind_transfer', 'ticket', 'wrong_stop'],
  },
  {
    id: 'metro_depot_return',
    stationRoomName: METRO_DEPOT_ROOM_NAME,
    panelSlot: 0,
    label: 'Белая служебная петля',
    clue: 'Белая лампа над машиной не спрашивает билет и возвращает к платформе 19.',
    wrongStopChance: 0,
    cooldownSec: 8,
    destination: TO_STATION,
    wrongStops: [],
    safeReturn: true,
    rumorIds: ['floor_metro_depot'],
    tags: ['depot', 'safe_return', 'transfer'],
  },
  {
    id: 'metro_error_safe_return',
    stationRoomName: METRO_ERROR_ROOM_NAME,
    panelSlot: 0,
    label: 'Белый экран обратной станции',
    clue: 'Не слушай объявление: смотри на белый экран и возвращайся на платформу.',
    wrongStopChance: 0,
    cooldownSec: 10,
    destination: TO_STATION,
    wrongStops: [],
    safeReturn: true,
    rumorIds: ['floor_metro_wrong_voice'],
    tags: ['blind_transfer', 'safe_return', 'wrong_stop'],
  },
];

export function metroRouteForPanel(stationRoomName: string, panelSlot: number): MetroRouteDef | undefined {
  return METRO_ROUTES.find(r => r.stationRoomName === stationRoomName && r.panelSlot === panelSlot);
}

export function metroRoutesForRoom(stationRoomName: string): readonly MetroRouteDef[] {
  return METRO_ROUTES.filter(r => r.stationRoomName === stationRoomName);
}
