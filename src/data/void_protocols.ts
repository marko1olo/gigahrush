/* ── VOID afterprotocol definitions — local late-game rules ───── */

export type VoidProtocolScope = 'room' | 'door' | 'zone' | 'npc' | 'document' | 'encounter';

export type VoidProtocolEffect =
  | 'silence'
  | 'inverted_access'
  | 'false_save'
  | 'memory_echo'
  | 'psi_backlash'
  | 'floor_name_corruption'
  | 'spirit_toll'
  | 'borrowed_light';

export interface VoidProtocolDef {
  id: string;
  name: string;
  scope: VoidProtocolScope;
  effect: VoidProtocolEffect;
  durationSec: number;
  cooldownSec: number;
  tags: string[];
  startLine: string;
  endLine: string;
  backlashLine: string;
}

export const VOID_PROTOCOLS: readonly VoidProtocolDef[] = [
  {
    id: 'borrowed_light',
    name: 'Заемный свет',
    scope: 'room',
    effect: 'borrowed_light',
    durationSec: 40,
    cooldownSec: 180,
    tags: ['void', 'local', 'light', 'reward'],
    startLine: 'Свет взят взаймы. Комната платит видимостью.',
    endLine: 'Заемный свет гаснет в квитанции.',
    backlashLine: 'Отдача закрывает дверь и бьет по вискам.',
  },
  {
    id: 'silence',
    name: 'Тихая комната',
    scope: 'room',
    effect: 'silence',
    durationSec: 75,
    cooldownSec: 180,
    tags: ['void', 'local', 'sound', 'light'],
    startLine: 'Комната глохнет. Лампы смотрят вниз.',
    endLine: 'Звук возвращается не весь.',
    backlashLine: 'В коридоре рядом становится слишком слышно.',
  },
  {
    id: 'inverted_access',
    name: 'Обратный допуск',
    scope: 'door',
    effect: 'inverted_access',
    durationSec: 45,
    cooldownSec: 150,
    tags: ['void', 'door', 'access'],
    startLine: 'Дверь принимает обратный порядок.',
    endLine: 'Петля допуска закрывается.',
    backlashLine: 'Соседняя ручка отвечает без просьбы.',
  },
  {
    id: 'false_save',
    name: 'Ложное сохранение',
    scope: 'document',
    effect: 'false_save',
    durationSec: 120,
    cooldownSec: 240,
    tags: ['void', 'document', 'trace'],
    startLine: 'На полу появляется запись, которой не было.',
    endLine: 'Чернила становятся обычной пылью.',
    backlashLine: 'Одна строка меняет адресата.',
  },
  {
    id: 'memory_echo',
    name: 'Эхо памяти',
    scope: 'npc',
    effect: 'memory_echo',
    durationSec: 60,
    cooldownSec: 180,
    tags: ['void', 'npc', 'echo'],
    startLine: 'Память встает рядом и молчит.',
    endLine: 'Эхо уходит без прощания.',
    backlashLine: 'Кто-то рядом вспоминает чужое.',
  },
  {
    id: 'psi_backlash',
    name: 'Пси-отдача',
    scope: 'encounter',
    effect: 'psi_backlash',
    durationSec: 20,
    cooldownSec: 210,
    tags: ['void', 'psi', 'combat'],
    startLine: 'Пси-сгусток бьет назад по комнате.',
    endLine: 'Отдача утихает.',
    backlashLine: 'Голова платит за тишину.',
  },
  {
    id: 'floor_name_corruption',
    name: 'Сбой имени этажа',
    scope: 'room',
    effect: 'floor_name_corruption',
    durationSec: 300,
    cooldownSec: 300,
    tags: ['void', 'room', 'name'],
    startLine: 'Табличка на комнате пишет другое.',
    endLine: 'Имя комнаты снова держится на месте.',
    backlashLine: 'Следующая табличка смотрит на вас первой.',
  },
  {
    id: 'spirit_toll',
    name: 'Пошлина духа',
    scope: 'encounter',
    effect: 'spirit_toll',
    durationSec: 90,
    cooldownSec: 240,
    tags: ['void', 'spirit', 'cost'],
    startLine: 'Пошлина принята. Проход держит слово.',
    endLine: 'Квитанция духа остывает.',
    backlashLine: 'Неплаченная строка зовет счетчика.',
  },
];

const VOID_PROTOCOL_BY_ID = new Map(VOID_PROTOCOLS.map(def => [def.id, def]));

export function getVoidProtocolDef(id: string): VoidProtocolDef | undefined {
  return VOID_PROTOCOL_BY_ID.get(id);
}
