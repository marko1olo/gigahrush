import { ContainerKind, type ContainerAccess, RoomType } from '../core/types';

export interface ContainerDef {
  kind: ContainerKind;
  name: string;
  capacitySlots: number;
  defaultAccess: ContainerAccess;
  roomTypes: RoomType[];
  itemPool: { defId: string; min: number; max: number; chance?: number }[];
  tags: string[];
}

export const CONTAINER_DEFS: Record<ContainerKind, ContainerDef> = {
  [ContainerKind.WOODEN_CHEST]: {
    kind: ContainerKind.WOODEN_CHEST, name: 'Деревянный сундук', capacitySlots: 10, defaultAccess: 'owner',
    roomTypes: [RoomType.LIVING, RoomType.STORAGE], itemPool: [{ defId: 'bread', min: 1, max: 3 }, { defId: 'cigs', min: 1, max: 2 }, { defId: 'note', min: 1, max: 2 }, { defId: 'shelter_tally', min: 0, max: 1 }], tags: ['home', 'food'],
  },
  [ContainerKind.METAL_CABINET]: {
    kind: ContainerKind.METAL_CABINET, name: 'Железный шкаф', capacitySlots: 12, defaultAccess: 'room',
    roomTypes: [RoomType.STORAGE, RoomType.PRODUCTION], itemPool: [{ defId: 'pipe', min: 1, max: 2 }, { defId: 'wrench', min: 1, max: 1 }, { defId: 'ammo_nails', min: 2, max: 6, chance: 0.25 }, { defId: 'valve_tag', min: 1, max: 2 }, { defId: 'relay_diagram', min: 1, max: 1 }], tags: ['tools'],
  },
  [ContainerKind.MEDICAL_CABINET]: {
    kind: ContainerKind.MEDICAL_CABINET, name: 'Медицинский шкаф', capacitySlots: 10, defaultAccess: 'room',
    roomTypes: [RoomType.MEDICAL], itemPool: [{ defId: 'bandage', min: 2, max: 5 }, { defId: 'pills', min: 1, max: 2 }, { defId: 'water', min: 1, max: 2 }, { defId: 'filter_receipt', min: 1, max: 1 }, { defId: 'inspection_mirror', min: 1, max: 1 }], tags: ['medical'],
  },
  [ContainerKind.WEAPON_CRATE]: {
    kind: ContainerKind.WEAPON_CRATE, name: 'Оружейный ящик', capacitySlots: 8, defaultAccess: 'faction',
    roomTypes: [RoomType.HQ, RoomType.STORAGE, RoomType.PRODUCTION], itemPool: [{ defId: 'ammo_9mm', min: 4, max: 10, chance: 0.75 }, { defId: 'ammo_shells', min: 1, max: 2, chance: 0.35 }, { defId: 'ammo_762tt', min: 4, max: 8, chance: 0.2 }, { defId: 'ammo_nagant', min: 3, max: 6, chance: 0.2 }, { defId: 'ammo_762', min: 5, max: 9, chance: 0.12 }, { defId: 'ammo_harpoon', min: 1, max: 2, chance: 0.08 }, { defId: 'ammo_belt', min: 8, max: 16, chance: 0.03 }, { defId: 'knife', min: 1, max: 1 }, { defId: 'makarov', min: 1, max: 1, chance: 0.35 }], tags: ['weapon', 'locked', 'ammo'],
  },
  [ContainerKind.FRIDGE]: {
    kind: ContainerKind.FRIDGE, name: 'Холодильник', capacitySlots: 8, defaultAccess: 'room',
    roomTypes: [RoomType.KITCHEN], itemPool: [{ defId: 'water', min: 2, max: 5 }, { defId: 'kasha', min: 1, max: 3 }, { defId: 'canned', min: 1, max: 2 }], tags: ['food'],
  },
  [ContainerKind.SAFE]: {
    kind: ContainerKind.SAFE, name: 'Сейф', capacitySlots: 10, defaultAccess: 'locked',
    roomTypes: [RoomType.OFFICE, RoomType.HQ], itemPool: [{ defId: 'key', min: 1, max: 1 }, { defId: 'ballot', min: 1, max: 4 }, { defId: 'note', min: 1, max: 3 }, { defId: 'seal_wax', min: 1, max: 2 }, { defId: 'ration_stamp_pad', min: 1, max: 1 }, { defId: 'elevator_override_form', min: 1, max: 1 }, { defId: 'official_permit_slip', min: 1, max: 2 }, { defId: 'official_quarantine_clearance', min: 1, max: 1 }, { defId: 'ration_registry_extract', min: 1, max: 2 }, { defId: 'elevator_access_order', min: 1, max: 1 }, { defId: 'maronary_shaving', min: 1, max: 1, chance: 0.015 }], tags: ['valuable', 'locked', 'paper'],
  },
  [ContainerKind.FILING_CABINET]: {
    kind: ContainerKind.FILING_CABINET, name: 'Картотека', capacitySlots: 10, defaultAccess: 'room',
    roomTypes: [RoomType.OFFICE, RoomType.STORAGE], itemPool: [{ defId: 'note', min: 2, max: 5 }, { defId: 'book', min: 1, max: 2 }, { defId: 'ballot', min: 1, max: 3 }, { defId: 'sealed_complaint', min: 1, max: 2 }, { defId: 'samosbor_tally', min: 1, max: 1 }, { defId: 'shelter_tally', min: 0, max: 1 }, { defId: 'pressure_logbook', min: 1, max: 1 }, { defId: 'container_key_label', min: 1, max: 2 }, { defId: 'emergency_roster', min: 1, max: 1 }, { defId: 'filter_receipt', min: 1, max: 1 }], tags: ['paper'],
  },
  [ContainerKind.CASHBOX]: {
    kind: ContainerKind.CASHBOX, name: 'Касса', capacitySlots: 5, defaultAccess: 'owner',
    roomTypes: [RoomType.OFFICE, RoomType.KITCHEN], itemPool: [{ defId: 'cigs', min: 1, max: 3 }, { defId: 'tea', min: 1, max: 2 }, { defId: 'ration_stamp_pad', min: 1, max: 1 }, { defId: 'container_key_label', min: 1, max: 1 }, { defId: 'shelter_tally', min: 0, max: 1 }, { defId: 'govnyak_roll', min: 1, max: 2 }], tags: ['trade'],
  },
  [ContainerKind.SECRET_STASH]: {
    kind: ContainerKind.SECRET_STASH, name: 'Тайник', capacitySlots: 8, defaultAccess: 'secret',
    roomTypes: [RoomType.CORRIDOR, RoomType.SMOKING, RoomType.LIVING], itemPool: [{ defId: 'forged_permit_slip', min: 1, max: 2 }, { defId: 'forged_quarantine_clearance', min: 1, max: 1 }, { defId: 'forged_ration_card', min: 1, max: 2 }, { defId: 'knife', min: 1, max: 1 }, { defId: 'cigs', min: 1, max: 4 }, { defId: 'govnyak_roll', min: 1, max: 3 }, { defId: 'govnyak_brick', min: 1, max: 1 }, { defId: 'govnyak_bad_batch', min: 1, max: 1 }, { defId: 'strange_clot', min: 1, max: 1 }, { defId: 'maronary_shaving', min: 1, max: 1, chance: 0.025 }], tags: ['secret', 'paper', 'forged', 'contraband'],
  },
  [ContainerKind.EMERGENCY_BOX]: {
    kind: ContainerKind.EMERGENCY_BOX, name: 'Аварийный ящик', capacitySlots: 8, defaultAccess: 'public',
    roomTypes: [RoomType.COMMON, RoomType.CORRIDOR], itemPool: [{ defId: 'water', min: 1, max: 3 }, { defId: 'bandage', min: 1, max: 2 }, { defId: 'bread', min: 1, max: 2 }, { defId: 'emergency_roster', min: 1, max: 1 }, { defId: 'siren_instruction', min: 1, max: 1 }], tags: ['public', 'samosbor'],
  },
  [ContainerKind.TRASH_BIN]: {
    kind: ContainerKind.TRASH_BIN, name: 'Мусорный бак', capacitySlots: 6, defaultAccess: 'public',
    roomTypes: [RoomType.KITCHEN, RoomType.CORRIDOR], itemPool: [{ defId: 'toiletpaper', min: 1, max: 2 }, { defId: 'note', min: 1, max: 1 }], tags: ['trash', 'public'],
  },
  [ContainerKind.TOOL_LOCKER]: {
    kind: ContainerKind.TOOL_LOCKER, name: 'Инструментальный шкаф', capacitySlots: 10, defaultAccess: 'room',
    roomTypes: [RoomType.PRODUCTION, RoomType.STORAGE], itemPool: [{ defId: 'wrench', min: 1, max: 2 }, { defId: 'door_kit', min: 1, max: 1 }, { defId: 'flashlight', min: 1, max: 1 }, { defId: 'valve_tag', min: 1, max: 2 }, { defId: 'relay_diagram', min: 1, max: 1 }, { defId: 'inspection_mirror', min: 1, max: 1 }, { defId: 'fuse', min: 1, max: 2 }, { defId: 'sealant_tube', min: 1, max: 1 }], tags: ['tools'],
  },
};

export function containerKindsForRoom(type: RoomType): ContainerKind[] {
  const kinds = Object.values(CONTAINER_DEFS)
    .filter(d => d.roomTypes.includes(type))
    .map(d => d.kind);
  return kinds.length > 0 ? kinds : [ContainerKind.WOODEN_CHEST];
}
