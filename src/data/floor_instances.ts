/* ── Numbered elevator floor metadata ─────────────────────────── */

import { FloorLevel } from '../core/types';

export interface FloorInstanceFollowupDef {
  id: string;
  title: string;
  message: string;
  suppressSeconds: number;
  tags: readonly string[];
}

export interface FloorInstanceDef {
  id: string;
  displayNumber: string;
  title: string;
  baseFloor: FloorLevel;
  seedTag: string;
  risk: 1 | 2 | 3 | 4 | 5;
  weight: number;
  discovered: boolean;
  rumorId: string;
  followup?: FloorInstanceFollowupDef;
}

export const FLOOR_INSTANCES: readonly FloorInstanceDef[] = [
  {
    id: 'loop_404',
    displayNumber: '404',
    title: 'Не найден',
    baseFloor: FloorLevel.LIVING,
    seedTag: 'not_found',
    risk: 4,
    weight: 18,
    discovered: false,
    rumorId: 'floor_pocket_rooms',
  },
  {
    id: 'loop_556',
    displayNumber: '556',
    title: 'П-46',
    baseFloor: FloorLevel.KVARTIRY,
    seedTag: 'p46_protocol',
    risk: 3,
    weight: 12,
    discovered: false,
    rumorId: 'samosbor_quiet_variant',
  },
  {
    id: 'loop_777',
    displayNumber: '777',
    title: 'Счастливый',
    baseFloor: FloorLevel.LIVING,
    seedTag: 'lucky_shelter',
    risk: 2,
    weight: 10,
    discovered: false,
    rumorId: 'floor_safe_not_safe',
  },
  {
    id: 'loop_1337',
    displayNumber: '1337',
    title: 'Элитный',
    baseFloor: FloorLevel.MAINTENANCE,
    seedTag: 'radio_code',
    risk: 4,
    weight: 8,
    discovered: false,
    rumorId: 'samosbor_electric_variant',
  },
  {
    id: 'loop_013',
    displayNumber: '013',
    title: 'Служебный',
    baseFloor: FloorLevel.MINISTRY,
    seedTag: 'service_order',
    risk: 3,
    weight: 8,
    discovered: false,
    rumorId: 'faction_ministry_papers',
  },
  {
    id: 'loop_089',
    displayNumber: '089',
    title: 'Теплый лифт',
    baseFloor: FloorLevel.MAINTENANCE,
    seedTag: 'warm_shaft',
    risk: 3,
    weight: 7,
    discovered: false,
    rumorId: 'floor_lift_smell',
    followup: {
      id: 'warm_shaft_stabilized',
      title: 'Теплая шахта стабилизирована',
      message: 'Бирка N-089 согрела шахту: следующий лифтовый рывок держит обычный маршрут.',
      suppressSeconds: 180,
      tags: ['warm_shaft', 'route_guard', 'lift_repair_shaft'],
    },
  },
  {
    id: 'loop_000',
    displayNumber: '000',
    title: 'Нулевой список',
    baseFloor: FloorLevel.VOID,
    seedTag: 'zero_register',
    risk: 5,
    weight: 3,
    discovered: false,
    rumorId: 'floor_void_listens',
  },
  {
    id: 'loop_912',
    displayNumber: '912',
    title: 'Чужая очередь',
    baseFloor: FloorLevel.KVARTIRY,
    seedTag: 'wrong_queue',
    risk: 2,
    weight: 9,
    discovered: false,
    rumorId: 'room_lift_wrong',
  },
];

const FLOOR_INSTANCE_BY_ID = new Map(FLOOR_INSTANCES.map(def => [def.id, def]));

export function floorInstanceById(id: string): FloorInstanceDef | undefined {
  return FLOOR_INSTANCE_BY_ID.get(id);
}
