/* ── Pneumomail capsules: old infrastructure, fallible leads ─── */

export const PNEUMOMAIL_ROOM_NAME = 'Пневмопочтовый узел: прием и перехват';
export const PNEUMOMAIL_SORTER_ROOM_NAME = 'Пневмопочтовый узел: сортировка чужих капсул';
export const PNEUMOMAIL_ROOM_PREFIX = 'Пневмопочтовый узел';
export const PNEUMOMAIL_CAPSULE_ITEM_ID = 'pneumomail_capsule';
export const PNEUMOMAIL_CONTRACT_ID = 'maint_pneumomail_pressure_manifest';
export const PNEUMOMAIL_HISTORY_CAPACITY = 12;

export type PneumomailCapsuleKind =
  | 'true_lead'
  | 'false_lead'
  | 'contract'
  | 'empty'
  | 'contraband'
  | 'warning';

export const PNEUMOMAIL_REQUIRED_KINDS: readonly PneumomailCapsuleKind[] = [
  'true_lead',
  'warning',
  'contraband',
  'contract',
  'false_lead',
];

export interface PneumomailCapsuleItem {
  defId: string;
  count: number;
}

export interface PneumomailCapsuleDef {
  id: string;
  kind: PneumomailCapsuleKind;
  weight: number;
  text: string;
  rumorId?: string;
  contractId?: string;
  items?: readonly PneumomailCapsuleItem[];
  severity: 1 | 2 | 3 | 4;
}

export const PNEUMOMAIL_CAPSULES: readonly PneumomailCapsuleDef[] = [
  {
    id: 'true_heatline_valve',
    kind: 'true_lead',
    weight: 4,
    text: 'Капсула стучит: «Развилка стояков 16. Бирка вентиля лежит у красного ввода. Сначала проверь мокрый пол.»',
    rumorId: 'pneumomail_true_heatline_valve',
    severity: 3,
  },
  {
    id: 'false_archive_chute',
    kind: 'false_lead',
    weight: 3,
    text: 'Капсула шепчет: «Архив труб N-0 открыт». Бумага слишком свежая; это шум, не маршрут.',
    severity: 2,
  },
  {
    id: 'pressure_manifest_contract',
    kind: 'contract',
    weight: 2,
    text: 'Из капсулы выпал талон: «Сверить журнал давления. Оплата после сдачи листа.»',
    rumorId: 'pneumomail_contract_pressure_manifest',
    contractId: PNEUMOMAIL_CONTRACT_ID,
    severity: 4,
  },
  {
    id: 'empty_return',
    kind: 'empty',
    weight: 2,
    text: 'Тубус пришел пустым. Внутри пыль, чужой вдох и след старого сургуча.',
    severity: 1,
  },
  {
    id: 'contraband_note',
    kind: 'contraband',
    weight: 2,
    text: 'Внутри фальшивый корешок и маршрут без подписи. Капсула годится как улика или товар.',
    rumorId: 'pneumomail_contraband_note',
    items: [
      { defId: PNEUMOMAIL_CAPSULE_ITEM_ID, count: 1 },
      { defId: 'forged_permit_slip', count: 1 },
    ],
    severity: 4,
  },
  {
    id: 'samosbor_warning',
    kind: 'warning',
    weight: 3,
    text: 'Капсула теплая: «Если труба молчит перед сиреной, письмо уже читает стена.»',
    rumorId: 'pneumomail_warning_samosbor',
    severity: 3,
  },
];
