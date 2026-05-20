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
    startLine: 'ПРОТОКОЛ: зеленая лампа взята в счет. Туман поднялся, ближайшие двери закрылись на 12 секунд.',
    endLine: 'ПРОТОКОЛ: счет по зеленой лампе закрыт. Локальная отметка снята.',
    backlashLine: 'ОТДАЧА: долг ударил по здоровью и ПСИ существ рядом.',
  },
  {
    id: 'silence',
    name: 'Тихая комната',
    scope: 'room',
    effect: 'silence',
    durationSec: 75,
    cooldownSec: 180,
    tags: ['void', 'local', 'sound', 'light'],
    startLine: 'ПРОТОКОЛ: лампы и свечи в комнате погашены. Тише стало, но путь виден хуже.',
    endLine: 'ПРОТОКОЛ: срок тишины вышел. Сверяйте выходы по карте, не по слуху.',
    backlashLine: 'ОТДАЧА: по углам поднялся туман; у двери хуже видно.',
  },
  {
    id: 'inverted_access',
    name: 'Обратный допуск',
    scope: 'door',
    effect: 'inverted_access',
    durationSec: 45,
    cooldownSec: 150,
    tags: ['void', 'door', 'access'],
    startLine: 'ПРОТОКОЛ: ближайшие двери поменяли состояние. Открытая закрылась, закрытая открылась.',
    endLine: 'ПРОТОКОЛ: ручки вернулись в обычный порядок.',
    backlashLine: 'ОТДАЧА: обратный допуск дернул руку и снял здоровье.',
  },
  {
    id: 'false_save',
    name: 'Ложное сохранение',
    scope: 'document',
    effect: 'false_save',
    durationSec: 120,
    cooldownSec: 240,
    tags: ['void', 'document', 'trace'],
    startLine: 'ПРОТОКОЛ: на полу появились две фальшивые записи П-46. Лифту их не показывать.',
    endLine: 'ПРОТОКОЛ: фальшивая запись осыпалась; реальное сохранение не изменилось.',
    backlashLine: 'ОТДАЧА: из лишней строки вышел Параграф.',
  },
  {
    id: 'memory_echo',
    name: 'Эхо жильца',
    scope: 'npc',
    effect: 'memory_echo',
    durationSec: 60,
    cooldownSec: 180,
    tags: ['void', 'npc', 'echo'],
    startLine: 'ПРОТОКОЛ: рядом появился двойник жильца. Держите дистанцию: он не проводник и дверей не открывает.',
    endLine: 'ПРОТОКОЛ: эхо исчезло, на полу осталась пустая бирка.',
    backlashLine: 'ОТДАЧА: к эху пришел Нелюдь; обходите или стреляйте.',
  },
  {
    id: 'psi_backlash',
    name: 'Пси-отдача',
    scope: 'encounter',
    effect: 'psi_backlash',
    durationSec: 20,
    cooldownSec: 210,
    tags: ['void', 'psi', 'combat'],
    startLine: 'ПРОТОКОЛ: ПСИ-отдача сбила цели рядом. Они теряют агрессию, вы платите здоровьем.',
    endLine: 'ПРОТОКОЛ: ПСИ-отдача стихла; цели снова видят маршрут.',
    backlashLine: 'ОТДАЧА: отдача ударила второй раз и сняла здоровье.',
  },
  {
    id: 'floor_name_corruption',
    name: 'Сбой имени этажа',
    scope: 'room',
    effect: 'floor_name_corruption',
    durationSec: 300,
    cooldownSec: 300,
    tags: ['void', 'room', 'name'],
    startLine: 'ПРОТОКОЛ: табличка комнаты сменила название. До конца срока карта будет путаться.',
    endLine: 'ПРОТОКОЛ: прежнее название комнаты возвращено на табличку.',
    backlashLine: 'ОТДАЧА: комната дернула замок; проверьте дверь перед выходом.',
  },
  {
    id: 'spirit_toll',
    name: 'Пошлина духа',
    scope: 'encounter',
    effect: 'spirit_toll',
    durationSec: 90,
    cooldownSec: 240,
    tags: ['void', 'spirit', 'cost'],
    startLine: 'ПРОТОКОЛ: пошлина списана, рядом вышел Счетчик пошлины. Шип или проход берите сразу.',
    endLine: 'ПРОТОКОЛ: квитанция пошлины закрыта; долг не тянется дальше комнаты.',
    backlashLine: 'ОТДАЧА: неоплаченная пошлина закрыла вход и позвала Счетчика.',
  },
];

const VOID_PROTOCOL_BY_ID = new Map(VOID_PROTOCOLS.map(def => [def.id, def]));

export function getVoidProtocolDef(id: string): VoidProtocolDef | undefined {
  return VOID_PROTOCOL_BY_ID.get(id);
}
