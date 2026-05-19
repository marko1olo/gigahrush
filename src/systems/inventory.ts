/* ── Inventory system: items, pickup, use ─────────────────────── */

import {
  type Entity, type GameState, type Item, type ItemDef, type Msg,
  type WorldEventPrivacy, type WorldEventSeverity, ItemType,
  EntityType, Faction, FloorLevel,
  msg,
} from '../core/types';
import { ITEMS, WEAPON_STATS, type WeaponStats } from '../data/catalog';
import { GOVNYAK_COURIER_CONTRACT_IDS, GOVNYAK_COURIER_PACKAGE_ITEM } from '../data/contracts';
import { addFactionRelMutual } from '../data/relations';
import {
  getStack,
  ITEM_TAGS,
  SILVER_SLIME_OPENED_ID,
  SILVER_SLIME_SEALED_ID,
} from '../data/items';
import { World } from '../core/world';
import { Spr } from '../render/sprite_index';
import { playPickup } from './audio';
import { changeResourceStock } from './economy';
import { publishEvent } from './events';
import { placeMonsterBait, removeMonsterBaitForEntity } from './monster_bait';
import { handleRationCouponUse } from './ration_coupons';
import {
  govnyakAimSpreadMult,
  isGovnyakItem,
  updateGovnyakConditions,
  useGovnyakItem,
} from './govnyak';
import { destroyMaronaryShaving } from './maronary_shaving';
import {
  FORGED_SHELTER_TALLY_ID,
  SHELTER_TALLY_ID,
  isShelterTallyItem,
  publishShelterTallyEvent,
} from './shelter_tally';
import {
  adjustedPsiCost,
  agiAttackSpeedMult,
  agiRangedSpreadMult,
  strDurabilityWearMult,
  strHeavyWeaponSpeedMult,
  strMeleeDmgMult,
} from './rpg';
import {
  activeZhelemishSkin,
  applyZhelemishSkinWithMessage,
  cureZhelemishSkin,
  isZhelemishCureItem,
  zhelemishHealingMult,
  zhelemishSourceForItem,
} from './status';

const MAX_SLOTS = 25;
const GOVNYAK_COURIER_ROUTE_SET = new Set<string>(GOVNYAK_COURIER_CONTRACT_IDS);
const GREEN_ACID_COUNTERMEASURE = 'filter_layer';
const VERETAR_UNSEALED_SAND = 'veretar_sand';
const VERETAR_SEALED_SAND = 'sealed_veretar_sand';
const VERETAR_SEAL_ITEMS = ['sealant_tube', 'seal_wax'] as const;
const VERETAR_SPOILED_FOOD = 'sand_spoiled_ration';
const VERETAR_SPOILED_DOCUMENT = 'bleached_document';
const VERETAR_FOOD_TARGETS = new Set([
  'bread', 'canned', 'kasha', 'rawmeat', 'mushroom_mass', 'grey_briquette', 'green_briquette',
  'liquidator_ration', 'pearl_barley', 'soup_cube', 'pressed_sugar', 'yeast_bread',
]);
const VERETAR_DOCUMENT_TARGETS = new Set([
  'note', 'book', 'blank_form', 'temp_pass', 'permanent_pass', 'caravan_route', 'lift_scheme',
  'archive_access_permit', 'forged_stamp_sheet', 'stolen_archive_card', 'missing_record_file',
  'record_exposure_notice', 'passport_stub', 'personal_file_copy', 'neighbor_complaint',
  'denunciation', 'unsigned_order', 'siren_instruction', 'voluntary_receipt', 'samosbor_tally',
  'sealed_complaint', 'elevator_override_form', 'pressure_logbook', 'ration_stamp_pad',
  'emergency_roster', 'official_permit_slip', 'forged_permit_slip', 'weapon_permit_signed',
  'weapon_permit_forged', 'ammo_issue_order', 'official_quarantine_clearance',
  'forged_quarantine_clearance', 'ration_registry_extract', 'forged_ration_card',
  'elevator_access_order', 'void_archive_warrant', 'ministry_audit_forgery',
]);

const AMMO_LABELS: Record<string, string> = {
  ammo_9mm: '9мм',
  ammo_shells: 'дробь',
  ammo_nails: 'гвозди',
  ammo_762: '7.62',
  ammo_belt: 'лента',
  ammo_energy: 'энерго',
  ammo_fuel: 'бензин',
  ammo_762tt: '7.62 ТТ',
  ammo_nagant: 'Наган',
  ammo_harpoon: 'гарпуны',
  grenade: 'граната',
};

const DOCUMENT_GATE_ITEMS = new Set([
  'official_permit_slip',
  'forged_permit_slip',
  'fake_pass',
  'ministry_audit_forgery',
  'stolen_archive_card',
]);
const DOCUMENT_MARKET_VALUES: Record<string, number> = {
  forged_permit_slip: 38,
  fake_pass: 35,
  ministry_audit_forgery: 64,
  stolen_archive_card: 55,
};

export interface WeaponReadiness {
  id: string;
  name: string;
  role: string;
  damage: number;
  damageLabel: string;
  range: number;
  pellets: number;
  knockback: number;
  reachLabel: string;
  controlLabel: string;
  cooldown: number;
  cooldownMax: number;
  cooldownPct: number;
  readyPct: number;
  cooldownLabel: string;
  resourceKind: 'none' | 'ammo' | 'psi' | 'durability';
  resourceName: string;
  resourceCurrent: number;
  resourceMax?: number;
  resourceCost?: number;
  resourceLabel: string;
  cannotFireReason: string;
  lowResource: boolean;
  warning: boolean;
}

export interface InventoryUseHandlerContext {
  actor: Entity;
  slotIdx: number;
  slot: Item;
  def: ItemDef;
  msgs: Msg[];
  time: number;
  state?: GameState;
  zoneId?: number;
  world?: World;
}

export type InventoryUseHandler = (ctx: InventoryUseHandlerContext) => boolean;

interface GreenAcidPickupData {
  ag64GreenAcid: true;
  organicRisk?: boolean;
  sample?: boolean;
  warned?: boolean;
}

// Side-effect floor modules can register through import cycles before this module finishes evaluating.
var inventoryUseHandlers: InventoryUseHandler[] | undefined;

function getInventoryUseHandlers(): InventoryUseHandler[] {
  if (!inventoryUseHandlers) inventoryUseHandlers = [];
  return inventoryUseHandlers;
}

export function registerInventoryUseHandler(handler: InventoryUseHandler): void {
  const handlers = getInventoryUseHandlers();
  if (!handlers.includes(handler)) handlers.push(handler);
}

function canStackData(a: unknown, b: unknown): boolean {
  return a === undefined && b === undefined;
}

function greenAcidPickupData(data: unknown): GreenAcidPickupData | null {
  if (!data || typeof data !== 'object') return null;
  const acid = data as Partial<GreenAcidPickupData>;
  return acid.ag64GreenAcid === true ? acid as GreenAcidPickupData : null;
}

function setGreenAcidWarned(item: Item): void {
  if (!item.data || typeof item.data !== 'object') return;
  (item.data as GreenAcidPickupData).warned = true;
}

function publishGreenAcidItemEvent(
  state: GameState | undefined,
  actor: Entity,
  kind: 'exposure' | 'neutralization' | 'sample',
  defId: string,
  count: number,
  zoneId: number,
  x: number,
  y: number,
): void {
  if (!state || actor.type !== EntityType.PLAYER) return;
  const def = ITEMS[defId];
  const eventItemId = kind === 'neutralization' ? GREEN_ACID_COUNTERMEASURE : defId;
  const eventDef = ITEMS[eventItemId];
  publishEvent(state, {
    type: kind === 'neutralization' ? 'player_use_item' : 'player_pick_item',
    zoneId,
    x,
    y,
    actorId: actor.id,
    actorName: actor.name ?? 'Вы',
    actorFaction: actor.faction,
    itemId: eventItemId,
    itemName: eventDef?.name ?? eventItemId,
    itemCount: count,
    itemValue: eventDef?.value ?? 0,
    severity: kind === 'sample' ? 3 : kind === 'neutralization' ? 3 : 2,
    privacy: 'private',
    tags: ['player', 'inventory', 'slime', 'acid', 'green_acid', kind],
    data: {
      source: 'ag64_green_acid_room',
      affectedItemId: defId,
      affectedItemName: def?.name ?? defId,
    },
  });
}

function veretarSpoilageKind(defId: string): 'food' | 'document' | undefined {
  if (VERETAR_FOOD_TARGETS.has(defId)) return 'food';
  if (VERETAR_DOCUMENT_TARGETS.has(defId)) return 'document';
  return undefined;
}

function hasUnsealedVeretarSand(actor: Entity): boolean {
  return (actor.inventory ?? []).some(slot => slot.defId === VERETAR_UNSEALED_SAND && slot.count > 0);
}

function canAddSingle(actor: Entity, defId: string): boolean {
  const def = ITEMS[defId];
  if (!def) return false;
  const inv = actor.inventory ?? [];
  return inv.some(slot => slot.defId === defId && slot.count < getStack(def) && canStackData(slot.data, undefined))
    || inv.length < MAX_SLOTS;
}

function decrementInventorySlot(inv: Item[], slotIdx: number): void {
  const slot = inv[slotIdx];
  if (!slot) return;
  slot.count--;
  if (slot.count <= 0) inv.splice(slotIdx, 1);
}

function findVeretarSealItem(actor: Entity): string | undefined {
  for (const id of VERETAR_SEAL_ITEMS) if (hasItem(actor, id)) return id;
  return undefined;
}

function hasRoomForSealedSand(inv: Item[], selectedSand: Item, sealItemId: string): boolean {
  const sealedDef = ITEMS[VERETAR_SEALED_SAND];
  if (!sealedDef) return false;
  if (selectedSand.count <= 1) return true;
  if (inv.some(slot => slot.defId === VERETAR_SEALED_SAND && slot.count < getStack(sealedDef) && canStackData(slot.data, undefined))) return true;
  const sealSlot = inv.find(slot => slot.defId === sealItemId);
  return inv.length < MAX_SLOTS || sealSlot?.count === 1;
}

function publishVeretarSandEvent(
  state: GameState | undefined,
  actor: Entity,
  action: string,
  itemId: string,
  count: number,
  severity: 1 | 2 | 3,
  zoneId?: number,
  affectedItemId?: string,
  replacementItemId?: string,
): void {
  if (!state || actor.type !== EntityType.PLAYER) return;
  const def = ITEMS[itemId];
  const affectedDef = affectedItemId ? ITEMS[affectedItemId] : undefined;
  publishEvent(state, {
    type: action === 'unsealed_pickup' ? 'player_pick_item' : 'player_use_item',
    zoneId,
    actorId: actor.id,
    actorName: actor.name ?? 'Вы',
    actorFaction: actor.faction,
    itemId,
    itemName: def?.name ?? itemId,
    itemCount: count,
    itemValue: def?.value ?? 0,
    severity,
    privacy: 'private',
    tags: ['player', 'inventory', 'veretar', 'sand', action, ...(ITEM_TAGS[itemId] ?? [])].slice(0, 8),
    data: {
      action,
      affectedItemId,
      affectedItemName: affectedDef?.name,
      replacementItemId,
      replacementItemName: replacementItemId ? ITEMS[replacementItemId]?.name : undefined,
    },
  });
}

function spoilOneVeretarNeighbor(actor: Entity, preferredDefId?: string): {
  oldItemId: string;
  oldItemName: string;
  replacementItemId: string;
  replacementItemName: string;
} | null {
  const inv = actor.inventory;
  if (!inv) return null;
  let idx = preferredDefId ? inv.findIndex(slot => slot.defId === preferredDefId && veretarSpoilageKind(slot.defId)) : -1;
  if (idx < 0) idx = inv.findIndex(slot => veretarSpoilageKind(slot.defId));
  if (idx < 0) return null;

  const slot = inv[idx];
  const kind = veretarSpoilageKind(slot.defId);
  if (!kind) return null;
  const replacementItemId = kind === 'food' ? VERETAR_SPOILED_FOOD : VERETAR_SPOILED_DOCUMENT;
  if (slot.count > 1 && !canAddSingle(actor, replacementItemId)) return null;

  const oldItemId = slot.defId;
  const oldItemName = ITEMS[oldItemId]?.name ?? oldItemId;
  decrementInventorySlot(inv, idx);
  addItem(actor, replacementItemId, 1);
  return {
    oldItemId,
    oldItemName,
    replacementItemId,
    replacementItemName: ITEMS[replacementItemId]?.name ?? replacementItemId,
  };
}

function handleVeretarPickupRisk(
  actor: Entity,
  pickedDefId: string,
  msgs: Msg[],
  time: number,
  state: GameState | undefined,
  zoneId: number,
): void {
  const pickedSand = pickedDefId === VERETAR_UNSEALED_SAND;
  const pickedVulnerable = veretarSpoilageKind(pickedDefId) !== undefined;
  if (!pickedSand && !pickedVulnerable) return;
  if (!hasUnsealedVeretarSand(actor)) return;

  const spoiled = spoilOneVeretarNeighbor(actor, pickedVulnerable ? pickedDefId : undefined);
  if (spoiled) {
    msgs.push(msg(
      `Белый песок просыпался: ${spoiled.oldItemName} испорчен. Запечатайте пробу герметиком.`,
      time, '#f4e7b0',
    ));
    publishVeretarSandEvent(state, actor, 'spoilage', VERETAR_UNSEALED_SAND, 1, 3, zoneId, spoiled.oldItemId, spoiled.replacementItemId);
    return;
  }

  if (pickedSand) {
    msgs.push(msg('Белый песок открыт: держите его отдельно от пайка и бумаг или запечатайте герметиком.', time, '#f4e7b0'));
    publishVeretarSandEvent(state, actor, 'unsealed_pickup', VERETAR_UNSEALED_SAND, 1, 2, zoneId);
  }
}

function handleVeretarSandUse(e: Entity, slotIdx: number, msgs: Msg[], time: number, state?: GameState): boolean {
  if (!e.inventory || slotIdx >= e.inventory.length) return false;
  const slot = e.inventory[slotIdx];
  if (slot.defId === VERETAR_SEALED_SAND) {
    msgs.push(msg('Гермопакет с белым песком цел. Несите его по назначению, не вскрывая.', time, '#f4e7b0'));
    publishVeretarSandEvent(state, e, 'sealed_check', VERETAR_SEALED_SAND, 1, 1);
    return true;
  }
  if (slot.defId !== VERETAR_UNSEALED_SAND) return false;

  const sealItemId = findVeretarSealItem(e);
  if (sealItemId) {
    if (!hasRoomForSealedSand(e.inventory, slot, sealItemId)) {
      msgs.push(msg('Для гермопакета нужен свободный слот или место в стопке проб.', time, '#f4e7b0'));
      publishVeretarSandEvent(state, e, 'seal_blocked', VERETAR_UNSEALED_SAND, 1, 2);
      return true;
    }
    if (slot.count <= 1) {
      slot.defId = VERETAR_SEALED_SAND;
      slot.count = 1;
      slot.data = undefined;
    } else {
      slot.count--;
      addItem(e, VERETAR_SEALED_SAND, 1);
    }
    removeItem(e, sealItemId, 1);
    msgs.push(msg(`Белый песок запечатан. Потрачен ${ITEMS[sealItemId]?.name ?? sealItemId}.`, time, '#f4e7b0'));
    publishVeretarSandEvent(state, e, 'sealed', VERETAR_SEALED_SAND, 1, 3, undefined, sealItemId);
    return true;
  }

  decrementInventorySlot(e.inventory, slotIdx);
  msgs.push(msg('Вы вытряхнули белый песок в щель пола. Доказательство уничтожено, но сумка стала тише.', time, '#d8d4bf'));
  publishVeretarSandEvent(state, e, 'destroyed', VERETAR_UNSEALED_SAND, 1, 2);
  return true;
}

function publishPlayerItemEvent(
  state: GameState | undefined,
  actor: Entity,
  type: 'player_pick_item' | 'player_drop_item' | 'player_use_item' | 'tool_broke' | 'ammo_consumed',
  defId: string,
  count: number,
  severity: 0 | 1 | 2 | 3,
  zoneId?: number,
): void {
  if (!state || actor.type !== EntityType.PLAYER) return;
  const def = ITEMS[defId];
  const tags = ['player', 'inventory', def?.type !== undefined ? `item_type_${def.type}` : 'item'];
  for (const tag of ITEM_TAGS[defId] ?? []) if (!tags.includes(tag)) tags.push(tag);
  for (const tag of def?.tags ?? []) if (!tags.includes(tag)) tags.push(tag);
  const eventSeverity = defId === 'maronary_shaving' && type === 'player_pick_item' && severity < 3 ? 3 : severity;
  publishEvent(state, {
    type,
    zoneId,
    actorId: actor.id,
    actorName: actor.name ?? 'Вы',
    actorFaction: actor.faction,
    itemId: defId,
    itemName: def?.name ?? defId,
    itemCount: count,
    itemValue: def?.value ?? 0,
    severity: eventSeverity,
    privacy: defId === 'maronary_shaving' ? 'local' : 'private',
    tags,
  });
}

function openGovnyakCourierPackage(actor: Entity, msgs: Msg[], time: number, state?: GameState): boolean {
  if (!state) {
    msgs.push(msg('Пломба держит пакет закрытым. Нужен активный маршрут, чтобы понять цену любопытства.', time, '#888'));
    return true;
  }

  const failedContracts: string[] = [];
  for (const q of state.quests) {
    if (q.done || !q.contractId || !GOVNYAK_COURIER_ROUTE_SET.has(q.contractId)) continue;
    q.done = true;
    q.failed = true;
    failedContracts.push(q.contractId);
    publishEvent(state, {
      type: 'contract_failed',
      actorId: q.giverId,
      actorName: q.giverName,
      actorFaction: q.contractFaction,
      targetName: q.desc,
      severity: 4,
      privacy: 'local',
      tags: ['quest', 'contract', 'failed', 'govnyak_courier', 'opened_package'],
      data: {
        questId: q.id,
        contractId: q.contractId,
        reason: 'opened_package',
        packageItem: GOVNYAK_COURIER_PACKAGE_ITEM,
      },
    });
  }

  removeItem(actor, GOVNYAK_COURIER_PACKAGE_ITEM, 1);
  msgs.push(msg(
    failedContracts.length > 0
      ? 'Пломба сорвана. Внутри серый табачный комок и чужая бухгалтерия. Курьерский маршрут провален.'
      : 'Пломба сорвана. Внутри почти ничего, кроме запаха дешёвого забытья и чужой метки.',
    time,
    '#f84',
  ));
  publishEvent(state, {
    type: 'player_use_item',
    actorId: actor.id,
    actorName: actor.name ?? 'Вы',
    actorFaction: actor.faction,
    itemId: GOVNYAK_COURIER_PACKAGE_ITEM,
    itemName: ITEMS[GOVNYAK_COURIER_PACKAGE_ITEM]?.name ?? GOVNYAK_COURIER_PACKAGE_ITEM,
    itemCount: 1,
    itemValue: ITEMS[GOVNYAK_COURIER_PACKAGE_ITEM]?.value ?? 0,
    severity: 4,
    privacy: 'private',
    tags: ['player', 'inventory', 'govnyak_courier', 'opened_package', 'contraband'],
    data: {
      failedContracts,
      reason: 'opened_package',
      suspicion: 'market_saw_broken_seal',
    },
  });
  return true;
}

export function publishItemTradeEvent(
  state: GameState | undefined,
  seller: Entity,
  buyer: Entity,
  defId: string,
  price: number,
  count = 1,
): void {
  if (!state) return;
  const player = seller.type === EntityType.PLAYER ? seller : buyer.type === EntityType.PLAYER ? buyer : undefined;
  if (!player) return;
  const other = player === seller ? buyer : seller;
  const def = ITEMS[defId];
  const govnyak = isGovnyakItem(defId);
  const playerSelling = player === seller;
  const confiscation = govnyak && playerSelling && other.faction === Faction.LIQUIDATOR;
  publishEvent(state, {
    type: playerSelling ? 'player_sell_item' : 'player_handoff_item',
    actorId: player.id,
    actorName: player.name ?? 'Вы',
    actorFaction: player.faction,
    targetId: other.id,
    targetName: other.name,
    targetFaction: other.faction,
    itemId: defId,
    itemName: def?.name ?? defId,
    itemCount: count,
    itemValue: price,
    severity: govnyak ? confiscation ? 4 : 3 : 1,
    privacy: govnyak ? 'local' : 'private',
    tags: [
      'player',
      'inventory',
      'trade',
      playerSelling ? 'sell' : 'buy',
      ...(govnyak ? ['govnyak', 'contraband'] : []),
      ...(confiscation ? ['confiscation', 'liquidator'] : []),
    ],
    data: {
      price,
      sellerId: seller.id,
      sellerName: seller.name,
      buyerId: buyer.id,
      buyerName: buyer.name,
      direction: playerSelling ? 'player_to_npc' : 'npc_to_player',
      rumorIds: govnyak ? [confiscation ? 'govnyak_confiscation' : 'govnyak_trade'] : [],
    },
  });
}

function consumeInventorySlot(e: Entity, slotIdx: number): void {
  const slot = e.inventory?.[slotIdx];
  if (!slot) return;
  slot.count--;
  if (slot.count <= 0) e.inventory?.splice(slotIdx, 1);
}

function zhelemishHealingFrictionText(e: Entity, beforeHp: number | undefined, time: number): string {
  if (beforeHp === undefined || e.hp === undefined || e.hp <= beforeHp) return '';
  const mult = zhelemishHealingMult(e, time);
  if (mult >= 1) return '';
  const rawGain = e.hp - beforeHp;
  const adjustedGain = Math.max(1, Math.round(rawGain * mult));
  e.hp = Math.min(e.maxHp ?? 100, beforeHp + adjustedGain);
  return ` Желемыш забрал часть лечения: +${adjustedGain}/${Math.round(rawGain)}.`;
}

function publishSilverSlimeInventoryEvent(
  state: GameState | undefined,
  actor: Entity,
  type: 'player_use_item' | 'player_destroy_item',
  defId: string,
  severity: 3 | 4,
  zoneId: number | undefined,
  outcome: string,
  rumorId: string,
): void {
  if (!state || actor.type !== EntityType.PLAYER) return;
  const def = ITEMS[defId];
  publishEvent(state, {
    type,
    zoneId,
    actorId: actor.id,
    actorName: actor.name ?? 'Вы',
    actorFaction: actor.faction,
    itemId: defId,
    itemName: def?.name ?? defId,
    itemCount: 1,
    itemValue: def?.value ?? 0,
    severity,
    privacy: 'witnessed',
    tags: ['player', 'inventory', 'slime', 'silver_slime', 'sample', outcome],
    data: { outcome, rumorIds: [rumorId] },
  });
}

function handleSilverSlimeUse(
  e: Entity,
  slotIdx: number,
  msgs: Msg[],
  time: number,
  state: GameState | undefined,
  zoneId: number | undefined,
): boolean {
  const slot = e.inventory?.[slotIdx];
  if (!slot) return false;

  if (slot.defId === SILVER_SLIME_SEALED_ID) {
    let psiGain = 0;
    if (e.rpg) {
      const before = e.rpg.psi;
      e.rpg.psi = Math.min(e.rpg.maxPsi, e.rpg.psi + 12);
      psiGain = Math.round(e.rpg.psi - before);
    }
    if (e.needs) {
      e.needs.sleep = Math.min(100, e.needs.sleep + 25);
      e.needs.water = Math.max(0, e.needs.water - 12);
      e.needs.pendingPee = (e.needs.pendingPee ?? 0) + 6;
    }
    if (e.hp !== undefined) e.hp = Math.max(1, e.hp - 6);

    consumeInventorySlot(e, slotIdx);
    addItem(e, SILVER_SLIME_OPENED_ID, 1);

    msgs.push(msg(`Серебристая слизь вскрыта: сон +25, ПСИ +${psiGain}, вода -12, HP -6. Пломба уже не доказательство.`, time, '#bfc'));
    publishSilverSlimeInventoryEvent(
      state,
      e,
      'player_use_item',
      SILVER_SLIME_SEALED_ID,
      4,
      zoneId,
      'silver_slime_opened',
      'silver_slime_used_suspicion',
    );
    return true;
  }

  if (slot.defId === SILVER_SLIME_OPENED_ID) {
    if (e.needs) e.needs.water = Math.max(0, e.needs.water - 4);
    if (e.hp !== undefined) e.hp = Math.max(1, e.hp - 2);
    consumeInventorySlot(e, slotIdx);
    msgs.push(msg('Открытая проба уничтожена: вода -4, HP -2. Дешевле, чем объяснять запах.', time, '#9cf'));
    publishSilverSlimeInventoryEvent(
      state,
      e,
      'player_destroy_item',
      SILVER_SLIME_OPENED_ID,
      3,
      zoneId,
      'silver_slime_destroyed',
      'silver_slime_destroyed_suspicion',
    );
    return true;
  }

  return false;
}

/* ── Add item to entity inventory ─────────────────────────────── */
export function addItem(e: Entity, defId: string, count = 1, data?: unknown): boolean {
  if (!e.inventory) e.inventory = [];
  const def = ITEMS[defId];
  if (!def) return false;

  // Try stacking
  for (const slot of e.inventory) {
    if (slot.defId === defId && slot.count < getStack(def) && canStackData(slot.data, data)) {
      const add = Math.min(count, getStack(def) - slot.count);
      slot.count += add;
      count -= add;
      if (count <= 0) return true;
    }
  }

  // New slot — init durability for melee weapons
  while (count > 0 && e.inventory.length < MAX_SLOTS) {
    const add = Math.min(count, getStack(def));
    const ws = WEAPON_STATS[defId];
    let slotData = data;
    if (slotData === undefined && ws && !ws.isRanged && ws.durability > 0) slotData = { dur: ws.durability };
    else if (slotData === undefined && def.durability && def.durability > 0) slotData = { dur: def.durability };
    e.inventory.push({ defId, count: add, data: slotData });
    count -= add;
  }

  return count <= 0;
}

/* ── Remove item from inventory ───────────────────────────────── */
export function removeItem(e: Entity, defId: string, count = 1): boolean {
  if (!e.inventory) return false;
  for (let i = e.inventory.length - 1; i >= 0; i--) {
    const slot = e.inventory[i];
    if (slot.defId === defId) {
      const rem = Math.min(count, slot.count);
      slot.count -= rem;
      count -= rem;
      if (slot.count <= 0) e.inventory.splice(i, 1);
      if (count <= 0) return true;
    }
  }
  return count <= 0;
}

/* ── Check if entity has item ─────────────────────────────────── */
export function hasItem(e: Entity, defId: string): boolean {
  return (e.inventory ?? []).some(i => i.defId === defId);
}

function inventoryCount(e: Entity, defId: string): number {
  let total = 0;
  for (const slot of e.inventory ?? []) if (slot.defId === defId) total += slot.count;
  return total;
}

function hasRoomForOutputAfterConsuming(e: Entity, outputId: string, consumedIds: readonly string[]): boolean {
  const def = ITEMS[outputId];
  if (!def) return false;
  const inv = e.inventory ?? [];
  if (inv.some(slot => slot.defId === outputId && slot.count < getStack(def) && canStackData(slot.data, undefined))) return true;

  const consumeCounts = new Map<string, number>();
  for (const id of consumedIds) consumeCounts.set(id, (consumeCounts.get(id) ?? 0) + 1);
  let freedSlots = 0;
  for (const slot of inv) {
    const consume = consumeCounts.get(slot.defId) ?? 0;
    if (consume <= 0) continue;
    const taken = Math.min(slot.count, consume);
    consumeCounts.set(slot.defId, consume - taken);
    if (taken >= slot.count) freedSlots++;
  }
  return inv.length - freedSlots < MAX_SLOTS;
}

function consumeDocumentItems(e: Entity, ids: readonly string[]): boolean {
  const needed = new Map<string, number>();
  for (const id of ids) needed.set(id, (needed.get(id) ?? 0) + 1);
  for (const [id, count] of needed) if (inventoryCount(e, id) < count) return false;
  for (const [id, count] of needed) removeItem(e, id, count);
  return true;
}

function documentZoneId(e: Entity, zoneId: number | undefined, world: World | undefined): number | undefined {
  if (zoneId !== undefined) return zoneId;
  if (!world) return undefined;
  return world.zoneMap[world.idx(Math.floor(e.x), Math.floor(e.y))];
}

function documentRoomName(e: Entity, world: World | undefined): string | undefined {
  return world?.roomAt(e.x, e.y)?.name;
}

function documentActionTags(defId: string, extra: readonly string[]): string[] {
  const out = ['player', 'inventory', 'document'];
  for (const tag of extra) if (!out.includes(tag)) out.push(tag);
  for (const tag of ITEM_TAGS[defId] ?? []) if (!out.includes(tag)) out.push(tag);
  for (const tag of ITEMS[defId]?.tags ?? []) if (!out.includes(tag)) out.push(tag);
  return out.slice(0, 8);
}

function publishDocumentActionEvent(
  state: GameState | undefined,
  actor: Entity,
  type: 'player_use_item' | 'player_sell_item' | 'player_handoff_item',
  itemId: string,
  severity: WorldEventSeverity,
  privacy: WorldEventPrivacy,
  tags: readonly string[],
  data: Record<string, unknown>,
  zoneId: number | undefined,
  world: World | undefined,
  targetName?: string,
): void {
  if (!state || actor.type !== EntityType.PLAYER) return;
  const def = ITEMS[itemId];
  publishEvent(state, {
    type,
    zoneId: documentZoneId(actor, zoneId, world),
    roomId: world?.roomAt(actor.x, actor.y)?.id,
    x: actor.x,
    y: actor.y,
    actorId: actor.id,
    actorName: actor.name ?? 'Вы',
    actorFaction: actor.faction,
    targetName,
    itemId,
    itemName: def?.name ?? itemId,
    itemCount: 1,
    itemValue: def?.value ?? 0,
    severity,
    privacy,
    tags: documentActionTags(itemId, tags),
    data,
  });
}

function documentGateOutput(defId: string): string {
  return defId === 'ministry_audit_forgery' || defId === 'stolen_archive_card'
    ? 'archive_access_permit'
    : 'key';
}

function useDocumentAtMinistryGate(
  e: Entity,
  defId: string,
  msgs: Msg[],
  time: number,
  state: GameState,
  zoneId: number | undefined,
  world: World | undefined,
): boolean {
  const outputId = documentGateOutput(defId);
  if (!hasRoomForOutputAfterConsuming(e, outputId, [defId])) {
    msgs.push(msg('Некуда положить выданный доступ. Освободите слот перед окном.', time, '#aa8'));
    return true;
  }
  if (!consumeDocumentItems(e, [defId])) return true;
  addItem(e, outputId, 1);

  const official = defId === 'official_permit_slip';
  const stolen = defId === 'stolen_archive_card';
  const forged = !official && !stolen;
  const roomName = documentRoomName(e, world) ?? (outputId === 'key' ? 'Проверочный коридор N3' : 'архивное окно');
  if (official) {
    changeResourceStock(state, 'documents', 1, FloorLevel.MINISTRY);
    addFactionRelMutual(Faction.PLAYER, Faction.CITIZEN, 1);
    msgs.push(msg('Официальный корешок принят. Дверь N3 выдала ключ без лишнего шума.', time, '#8f8'));
  } else if (stolen) {
    changeResourceStock(state, 'documents', 1, FloorLevel.MINISTRY);
    addFactionRelMutual(Faction.PLAYER, Faction.LIQUIDATOR, 2);
    addFactionRelMutual(Faction.PLAYER, Faction.WILD, -1);
    msgs.push(msg('Краденая архивная карточка сдана как улика. Выдан архивный допуск; рынок это не одобрит.', time, '#8cf'));
  } else {
    changeResourceStock(state, 'documents', -1, FloorLevel.MINISTRY);
    addFactionRelMutual(Faction.PLAYER, Faction.LIQUIDATOR, -2);
    addFactionRelMutual(Faction.PLAYER, Faction.WILD, 1);
    msgs.push(msg(`${ITEMS[defId]?.name ?? defId} принят. Доступ выдан, но журнал запомнил слишком ровную бумагу.`, time, '#fa6'));
  }

  publishDocumentActionEvent(
    state,
    e,
    stolen ? 'player_handoff_item' : 'player_use_item',
    defId,
    forged ? 4 : 3,
    forged ? 'local' : 'private',
    [
      outputId === 'key' ? 'document_gate' : 'archive_access',
      official ? 'official' : stolen ? 'stolen' : 'forgery',
      ...(forged ? ['audit_risk'] : []),
      'access_granted',
    ],
    {
      outcome: outputId === 'key' ? 'gate_key_granted' : 'archive_access_granted',
      outputItemId: outputId,
      outputItemName: ITEMS[outputId]?.name ?? outputId,
      roomName,
      ministryDocumentDelta: official || stolen ? 1 : -1,
      rumorIds: forged ? ['player_forged_stamp_risk', 'rare_forged_permit_slip'] : ['lead_ministry_permit_office_slip'],
    },
    zoneId,
    world,
    roomName,
  );
  return true;
}

function forgePermitFromStampSheet(
  e: Entity,
  msgs: Msg[],
  time: number,
  state: GameState | undefined,
  zoneId: number | undefined,
  world: World | undefined,
): boolean {
  const inputs = ['forged_stamp_sheet', 'blank_form', 'ink_bottle'] as const;
  for (const id of inputs) {
    if (!hasItem(e, id)) {
      msgs.push(msg('Для кованого корешка нужны лист с поддельной печатью, пустой бланк и чернила.', time, '#aa8'));
      return true;
    }
  }
  if (!hasRoomForOutputAfterConsuming(e, 'forged_permit_slip', inputs)) {
    msgs.push(msg('Некуда положить кованый корешок. Освободите слот перед печатью.', time, '#aa8'));
    return true;
  }
  if (!consumeDocumentItems(e, inputs)) return true;
  addItem(e, 'forged_permit_slip', 1);
  if (state) {
    changeResourceStock(state, 'documents', -1, FloorLevel.MINISTRY);
    addFactionRelMutual(Faction.PLAYER, Faction.LIQUIDATOR, -1);
    addFactionRelMutual(Faction.PLAYER, Faction.WILD, 1);
  }
  msgs.push(msg('Бланк, чернила и поддельная печать сошлись в кованый корешок пропуска. Теперь риск можно нести к N3.', time, '#fa6'));
  publishDocumentActionEvent(
    state,
    e,
    'player_use_item',
    'forged_permit_slip',
    4,
    'local',
    ['forgery', 'permit_forged', 'audit_risk'],
    {
      outcome: 'forged_permit_created',
      sourceItemIds: [...inputs],
      ministryDocumentDelta: -1,
      rumorIds: ['player_forged_stamp_risk', 'rare_forged_permit_slip'],
    },
    zoneId,
    world,
    documentRoomName(e, world),
  );
  return true;
}

function sellDocumentToBlackMarket(
  e: Entity,
  defId: string,
  msgs: Msg[],
  time: number,
  state: GameState,
  zoneId: number | undefined,
  world: World | undefined,
): boolean {
  const price = DOCUMENT_MARKET_VALUES[defId];
  if (!price) return false;
  removeItem(e, defId, 1);
  e.money = (e.money ?? 0) + price;
  changeResourceStock(state, 'documents', -1, FloorLevel.MINISTRY);
  changeResourceStock(state, 'contraband', 1, state.currentFloor);
  addFactionRelMutual(Faction.PLAYER, Faction.WILD, 2);
  addFactionRelMutual(Faction.PLAYER, Faction.LIQUIDATOR, -1);
  msgs.push(msg(`${ITEMS[defId]?.name ?? defId} ушёл через рынок за ${price}₽. Доступ потерян, слух остался.`, time, '#ee4'));
  publishDocumentActionEvent(
    state,
    e,
    'player_sell_item',
    defId,
    4,
    'local',
    ['black_market', 'trade', 'contraband', 'audit_risk'],
    {
      outcome: 'black_market_document_sale',
      rewardMoney: price,
      ministryDocumentDelta: -1,
      contrabandDelta: 1,
      rumorIds: ['rare_forged_permit_slip', 'contract_failed'],
    },
    zoneId,
    world,
    'чёрный рынок документов',
  );
  return true;
}

function handleDocumentPaperUse(
  e: Entity,
  defId: string,
  msgs: Msg[],
  time: number,
  state: GameState | undefined,
  zoneId: number | undefined,
  world: World | undefined,
): boolean {
  if (defId === 'forged_stamp_sheet') return forgePermitFromStampSheet(e, msgs, time, state, zoneId, world);
  if (!DOCUMENT_GATE_ITEMS.has(defId) && DOCUMENT_MARKET_VALUES[defId] === undefined) return false;
  if (!state || e.type !== EntityType.PLAYER) {
    msgs.push(msg(ITEMS[defId]?.desc ?? 'Бумага требует адресата.', time, '#aa8'));
    return true;
  }

  if (state.currentFloor === FloorLevel.MINISTRY && DOCUMENT_GATE_ITEMS.has(defId)) {
    return useDocumentAtMinistryGate(e, defId, msgs, time, state, zoneId, world);
  }
  if ((state.currentFloor === FloorLevel.LIVING || state.currentFloor === FloorLevel.KVARTIRY) && DOCUMENT_MARKET_VALUES[defId] !== undefined) {
    return sellDocumentToBlackMarket(e, defId, msgs, time, state, zoneId, world);
  }

  msgs.push(msg('Эта бумага просит адресата: N3, архивное окно, квартирную типографию или рынок.', time, '#aa8'));
  return true;
}

function handleShelterTallyUse(e: Entity, defId: string, msgs: Msg[], time: number, state?: GameState): boolean {
  if (!isShelterTallyItem(defId)) return false;
  if (!state || e.type !== EntityType.PLAYER) {
    msgs.push(msg(ITEMS[defId]?.desc ?? 'Бумага требует адресата.', time, '#aa8'));
    return true;
  }

  const forged = defId === FORGED_SHELTER_TALLY_ID;
  if (!forged && hasItem(e, 'forged_stamp_sheet')) {
    removeItem(e, SHELTER_TALLY_ID, 1);
    removeItem(e, 'forged_stamp_sheet', 1);
    addItem(e, FORGED_SHELTER_TALLY_ID, 1);
    msgs.push(msg('Ведомость переписана под печать. В списке появились удобные живые и удобные пустые места.', time, '#fa8'));
    publishShelterTallyEvent(state, e, SHELTER_TALLY_ID, 'forge');
    return true;
  }

  if (state.currentFloor === FloorLevel.MINISTRY) {
    removeItem(e, defId, 1);
    if (!forged) {
      e.money = (e.money ?? 0) + 45;
      msgs.push(msg('Министерство приняло ведомость укрытых. +45₽ за аккуратные фамилии.', time, '#ee4'));
      publishShelterTallyEvent(state, e, defId, 'submit_ministry', { itemValue: 45 });
    } else {
      msgs.push(msg('Министерство приняло липовую ведомость, но печать смотрела слишком ровно.', time, '#f84'));
      publishShelterTallyEvent(state, e, defId, 'submit_forged_ministry');
    }
    return true;
  }

  if (state.currentFloor === FloorLevel.LIVING || state.currentFloor === FloorLevel.KVARTIRY) {
    removeItem(e, defId, 1);
    if (forged) {
      msgs.push(msg('Жильцы читают липовый список и сразу находят лишнюю благодарность.', time, '#f84'));
      publishShelterTallyEvent(state, e, defId, 'give_forged_residents');
    } else {
      msgs.push(msg('Старшие подъезда получили список. Кто-то благодарит, кто-то ищет свое пустое место.', time, '#8f8'));
      publishShelterTallyEvent(state, e, defId, 'give_residents');
    }
    return true;
  }

  msgs.push(msg('Ведомость укрытых требует адресата: Министерство, жилой блок, рынок или тайник.', time, '#aa8'));
  return true;
}

/* ── Use selected item ────────────────────────────────────────── */
export function useItem(e: Entity, slotIdx: number, msgs: Msg[], time: number, state?: GameState, zoneId?: number, world?: World): void {
  if (!e.inventory || slotIdx >= e.inventory.length) return;
  const slot = e.inventory[slotIdx];
  const def = ITEMS[slot.defId];
  if (!def) return;

  for (const handler of getInventoryUseHandlers()) {
    if (handler({ actor: e, slotIdx, slot, def, msgs, time, state, zoneId, world })) return;
  }

  if (def.id === GOVNYAK_COURIER_PACKAGE_ITEM) {
    if (openGovnyakCourierPackage(e, msgs, time, state)) return;
  }

  if (handleDocumentPaperUse(e, def.id, msgs, time, state, zoneId, world)) return;
  if (handleShelterTallyUse(e, def.id, msgs, time, state)) return;
  if (handleVeretarSandUse(e, slotIdx, msgs, time, state)) return;

  if (def.id === 'maronary_shaving') {
    const useText = destroyMaronaryShaving(e, state);
    msgs.push(msg(useText, time, '#fc4'));
    decrementInventorySlot(e.inventory, slotIdx);
    return;
  }

  // Weapons: equip
  if (def.type === ItemType.WEAPON) {
    e.weapon = def.id;
    msgs.push(msg(`Экипировано: ${def.name}`, time, '#ccc'));
    publishPlayerItemEvent(state, e, 'player_use_item', def.id, 1, 2, zoneId);
    return;
  }

  // Tools: equip to utility slot
  if (def.type === ItemType.TOOL) {
    e.tool = def.id;
    msgs.push(msg(`Инструмент: ${def.name}`, time, '#8cf'));
    publishPlayerItemEvent(state, e, 'player_use_item', def.id, 1, 2, zoneId);
    return;
  }

  if (handleRationCouponUse(e, slotIdx, msgs, time, state, zoneId, world)) return;

  const govnyakUse = useGovnyakItem(e, def.id, state);
  if (govnyakUse) {
    msgs.push(msg(govnyakUse.text, time, govnyakUse.badBatch ? '#fa0' : '#9a6'));
    placeMonsterBait(state, world, e, e.x, e.y, def.id, 1, 'use');
    consumeInventorySlot(e, slotIdx);
    return;
  }

  if (handleSilverSlimeUse(e, slotIdx, msgs, time, state, zoneId)) return;

  const zhelemishSource = zhelemishSourceForItem(def.id);
  if (zhelemishSource) {
    const beforeHp = e.hp;
    const useText = def.use?.(e);
    if (useText) msgs.push(msg(useText + zhelemishHealingFrictionText(e, beforeHp, time), time, '#6a6'));
    applyZhelemishSkinWithMessage(e, time, msgs, zhelemishSource, state);
    consumeInventorySlot(e, slotIdx);
    publishPlayerItemEvent(state, e, 'player_use_item', def.id, 1, 3, zoneId);
    return;
  }

  // Usable items
  if (def.use) {
    if (isZhelemishCureItem(def.id) && activeZhelemishSkin(e, time)) {
      const useText = def.use(e);
      msgs.push(msg(useText, time, '#6a6'));
      cureZhelemishSkin(e, time, msgs, state, def.id);
      consumeInventorySlot(e, slotIdx);
      publishPlayerItemEvent(state, e, 'player_use_item', def.id, 1, 3, zoneId);
      return;
    }
    const beforeHp = e.hp;
    const useText = def.use(e);
    msgs.push(msg(useText + zhelemishHealingFrictionText(e, beforeHp, time), time, '#6a6'));
    placeMonsterBait(state, world, e, e.x, e.y, def.id, 1, 'use');
    consumeInventorySlot(e, slotIdx);
    publishPlayerItemEvent(state, e, 'player_use_item', def.id, 1, 2, zoneId);
    return;
  }

  // Notes
  if (def.type === ItemType.NOTE && slot.data) {
    msgs.push(msg(String(slot.data), time, '#aa8'));
    publishPlayerItemEvent(state, e, 'player_use_item', def.id, 1, 2, zoneId);
    return;
  }
}

/* ── Drop item from inventory onto the ground ─────────────────── */
export function dropItem(
  player: Entity, slotIdx: number, entities: Entity[],
  msgs: Msg[], time: number, nextId: { v: number }, state?: GameState, world?: World,
): void {
  if (!player.inventory || slotIdx >= player.inventory.length) return;
  const slot = player.inventory[slotIdx];
  const def = ITEMS[slot.defId];
  if (!def) return;

  const dropCount = slot.count;

  // If dropping equipped weapon, unequip
  if (def.type === ItemType.WEAPON && player.weapon === def.id) {
    player.weapon = '';
  }
  if (def.type === ItemType.TOOL && player.tool === def.id) {
    player.tool = '';
  }

  // Tools are destroyed on drop (picking up would reset charge)
  if (def.type === ItemType.TOOL) {
    player.inventory.splice(slotIdx, 1);
    msgs.push(msg(`${def.name} выброшен и сломан`, time, '#f84'));
    publishPlayerItemEvent(state, player, 'player_drop_item', def.id, dropCount, 2);
    publishPlayerItemEvent(state, player, 'tool_broke', def.id, dropCount, 3);
    return;
  }

  // Place drop 3 cells in front of player (far enough to avoid auto-pickup)
  const dx = Math.cos(player.angle);
  const dy = Math.sin(player.angle);
  const dropX = player.x + dx * 3.0;
  const dropY = player.y + dy * 3.0;

  const dropId = nextId.v++;
  entities.push({
    id: dropId, type: EntityType.ITEM_DROP,
    x: dropX, y: dropY, angle: 0, pitch: 0, alive: true, speed: 0, sprite: Spr.ITEM_DROP,
    inventory: [{ defId: slot.defId, count: dropCount, data: slot.data }],
  });

  player.inventory.splice(slotIdx, 1);

  msgs.push(msg(`Выброшено: ${def.name}${dropCount > 1 ? ' ×' + dropCount : ''}`, time, '#aa6'));
  publishPlayerItemEvent(state, player, 'player_drop_item', def.id, dropCount, 2);
  if (placeMonsterBait(state, world, player, dropX, dropY, def.id, dropCount, 'drop', dropId)) {
    msgs.push(msg('Запах приманки пошёл по коридору', time, '#ca6'));
  }
}

/* ── Pickup nearby item drops ─────────────────────────────────── */
export function pickupNearby(
  world: World,
  entities: Entity[],
  player: Entity,
  msgs: Msg[],
  time: number,
  state?: GameState,
  onPickedDrop?: (drop: Entity) => void,
): void {
  for (let i = entities.length - 1; i >= 0; i--) {
    const drop = entities[i];
    if (drop.type !== EntityType.ITEM_DROP || !drop.alive) continue;
    if (world.dist(player.x, player.y, drop.x, drop.y) > 1.5) continue;

    const inv = drop.inventory;
    if (!inv || inv.length === 0) continue;

    let pickedAny = false;
    for (const item of inv) {
      const def = ITEMS[item.defId];
      const acid = greenAcidPickupData(item.data);
      const zoneId = world.zoneMap[world.idx(Math.floor(drop.x), Math.floor(drop.y))];
      if (acid?.organicRisk && !hasItem(player, GREEN_ACID_COUNTERMEASURE)) {
        if (!acid.warned) {
          setGreenAcidWarned(item);
          msgs.push(msg(
            `Зелёная кислота шипит на ${def?.name ?? item.defId}. Нужен фильтрующий слой; повторная попытка испортит добычу.`,
            time, '#9f4',
          ));
          publishGreenAcidItemEvent(state, player, 'exposure', item.defId, item.count, zoneId, drop.x, drop.y);
          continue;
        }
        msgs.push(msg(`${def?.name ?? item.defId} вспенился в кислоте. Добыча потеряна.`, time, '#bf4'));
        item.count = 0;
        pickedAny = true;
        publishGreenAcidItemEvent(state, player, 'exposure', item.defId, 1, zoneId, drop.x, drop.y);
        continue;
      }

      if (addItem(player, item.defId, item.count, acid ? undefined : item.data)) {
        if (acid?.organicRisk) {
          removeItem(player, GREEN_ACID_COUNTERMEASURE, 1);
          msgs.push(msg(`Фильтрующий слой принял кислоту: ${def?.name ?? item.defId} спасён.`, time, '#9f4'));
          publishGreenAcidItemEvent(state, player, 'neutralization', item.defId, item.count, zoneId, drop.x, drop.y);
        }
        if (acid?.sample) {
          msgs.push(msg('Взята проба зелёной кислотной слизи.', time, '#9f4'));
          publishGreenAcidItemEvent(state, player, 'sample', item.defId, item.count, zoneId, drop.x, drop.y);
        }
        msgs.push(msg(`Подобрано: ${def?.name ?? item.defId}`, time, '#dd4'));
        publishPlayerItemEvent(state, player, 'player_pick_item', item.defId, item.count, 2, zoneId);
        handleVeretarPickupRisk(player, item.defId, msgs, time, state, zoneId);
        pickedAny = true;
      }
    }

    if (pickedAny) {
      removeMonsterBaitForEntity(drop.id, state, time, 'picked_up');
      onPickedDrop?.(drop);
      drop.alive = false;
      playPickup();
    }
  }
}

/* ── Get full weapon stats ────────────────────────────────────── */
export function getWeaponStats(e: Entity): WeaponStats {
  const ws = WEAPON_STATS[e.weapon ?? ''] ?? WEAPON_STATS[''];
  const govnyakSpread = govnyakAimSpreadMult(e);
  if (!e.rpg && govnyakSpread === 1) return ws;
  let speed = ws.speed;
  let spread = ws.spread;
  let psiCost = ws.psiCost;
  let changed = false;

  if (e.rpg && !ws.isRanged && !ws.psiCost) {
    const nextSpeed = ws.speed * strHeavyWeaponSpeedMult(e.rpg, ws.speed);
    if (nextSpeed !== ws.speed) { speed = nextSpeed; changed = true; }
  }
  if (ws.isRanged && ws.spread !== undefined && ws.spread > 0) {
    const nextSpread = ws.spread * (e.rpg ? agiRangedSpreadMult(e.rpg) : 1) * govnyakSpread;
    if (nextSpread !== ws.spread) { spread = nextSpread; changed = true; }
  }
  if (e.rpg && ws.psiCost !== undefined && ws.psiCost > 0) {
    psiCost = adjustedPsiCost(ws.psiCost, e.rpg);
    changed = true;
  }

  return changed ? { ...ws, speed, spread, psiCost } : ws;
}

/* ── Get current durability of equipped melee weapon ──────────── */
export function getEquippedDurability(e: Entity): { cur: number; max: number } | null {
  const ws = WEAPON_STATS[e.weapon ?? ''];
  if (!ws || ws.isRanged || ws.durability <= 0) return null;
  const slot = (e.inventory ?? []).find(s => s.defId === e.weapon);
  if (!slot) return null;
  const d = slot.data as { dur?: number } | undefined;
  return { cur: d?.dur ?? ws.durability, max: ws.durability };
}

/* ── Contextual weapon break exclamations ─────────────────────── */
const BREAK_EXCLAIM = [
  'Бля!', 'Блин!', 'Пацаны!', 'Плохо дело!', 'Вот чёрт!',
  'Да ну нах!', 'Твою мать!', 'Ну всё!', 'Капец!', 'Ёпта!',
  'Мда уж...', 'Ай!', 'Ну отлично!', 'Вот блин!', 'Ну ёлки!',
];
const BREAK_EXCLAIM_F = [
  'Блин!', 'Ой!', 'Ну нет!', 'Ужас!', 'Вот чёрт!',
  'Плохо дело!', 'Капец!', 'Ну отлично!', 'Батюшки!', 'Кошмар!',
];

/* ── Consume durability on melee hit. Returns true if weapon broke */
export function consumeDurability(e: Entity, msgs: Msg[], time: number, state?: GameState): boolean {
  const ws = WEAPON_STATS[e.weapon ?? ''];
  if (!ws || ws.isRanged || ws.durability <= 0) return false;
  const inv = e.inventory ?? [];
  const idx = inv.findIndex(s => s.defId === e.weapon);
  if (idx < 0) return false;
  const slot = inv[idx];
  const d = (slot.data ?? { dur: ws.durability }) as { dur: number };
  const wear = e.rpg && ws.durability > 1 ? strDurabilityWearMult(e.rpg) : 1;
  d.dur -= wear;
  slot.data = d;
  if (d.dur <= 0) {
    const name = ITEMS[slot.defId]?.name ?? slot.defId;
    inv.splice(idx, 1);
    e.weapon = '';
    if (e.type === EntityType.NPC && e.name) {
      const pool = e.isFemale ? BREAK_EXCLAIM_F : BREAK_EXCLAIM;
      const excl = pool[Math.floor(Math.random() * pool.length)];
      msgs.push(msg(`${e.name}: ${excl} ${name} ${e.isFemale ? 'сломалась' : 'сломался'}!`, time, '#f84'));
    } else {
      msgs.push(msg(`${name} сломался!`, time, '#f84'));
    }
    publishPlayerItemEvent(state, e, 'tool_broke', slot.defId, 1, 3);
    return true;
  }
  return false;
}

/* ── Get current durability of equipped tool ──────────────────── */
export function getEquippedToolDurability(e: Entity): { cur: number; max: number } | null {
  const toolId = e.tool ?? '';
  if (!toolId) return null;
  const def = ITEMS[toolId];
  if (!def || def.type !== ItemType.TOOL || !def.durability || def.durability <= 0) return null;
  const slot = (e.inventory ?? []).find(s => s.defId === toolId);
  if (!slot) return null;
  const d = slot.data as { dur?: number } | undefined;
  return { cur: d?.dur ?? def.durability, max: def.durability };
}

/* ── Consume durability on equipped tool use ──────────────────── */
export function consumeToolDurability(e: Entity, amount: number, msgs: Msg[], time: number, state?: GameState): boolean {
  if (amount <= 0) return false;
  const toolId = e.tool ?? '';
  if (!toolId) return false;
  const def = ITEMS[toolId];
  if (!def || def.type !== ItemType.TOOL || !def.durability || def.durability <= 0) return false;
  const inv = e.inventory ?? [];
  const idx = inv.findIndex(s => s.defId === toolId);
  if (idx < 0) { e.tool = ''; return false; }
  const slot = inv[idx];
  const d = (slot.data ?? { dur: def.durability }) as { dur: number };
  const wear = e.rpg && def.durability > 1 ? amount * strDurabilityWearMult(e.rpg) : amount;
  d.dur -= wear;
  slot.data = d;
  if (d.dur <= 0) {
    const name = ITEMS[slot.defId]?.name ?? slot.defId;
    inv.splice(idx, 1);
    e.tool = '';
    msgs.push(msg(`${name} изношен и сломан!`, time, '#f84'));
    publishPlayerItemEvent(state, e, 'tool_broke', slot.defId, 1, 3);
    return true;
  }
  return false;
}

/* ── Consume ammo for ranged weapon. Returns true if ammo available */
export function consumeAmmo(e: Entity, state?: GameState): boolean {
  const ws = WEAPON_STATS[e.weapon ?? ''];
  if (!ws || !ws.isRanged || !ws.ammoType) return false;
  const consumed = removeItem(e, ws.ammoType, 1);
  if (consumed) publishPlayerItemEvent(state, e, 'ammo_consumed', ws.ammoType, 1, 0);
  return consumed;
}

/* ── Count ammo for current ranged weapon ─────────────────────── */
export function countAmmo(e: Entity): number {
  const ws = WEAPON_STATS[e.weapon ?? ''];
  if (!ws || !ws.isRanged || !ws.ammoType) return 0;
  let total = 0;
  for (const slot of e.inventory ?? []) {
    if (slot.defId === ws.ammoType) total += slot.count;
  }
  return total;
}

export function updateInventoryConditions(e: Entity, state: GameState): void {
  updateGovnyakConditions(e, state);
}

function compactAmmoName(ammoType: string | undefined): string {
  if (!ammoType) return 'заряд';
  const label = AMMO_LABELS[ammoType];
  if (label) return label;
  const name = ITEMS[ammoType]?.name ?? ammoType;
  return name
    .replace(/^Патроны\s+/i, '')
    .replace(/^Канистра\s+/i, '')
    .replace(/^Пулемётная\s+/i, '')
    .slice(0, 14);
}

function weaponRole(id: string, ws: WeaponStats): string {
  if (ws.psiCost) return ws.isRanged ? 'ПСИ-снаряд' : 'ПСИ-эффект';
  if (ws.isRanged) {
    if (ws.aoeRadius) return 'взрыв';
    if (id === 'flamethrower' || ws.ammoType === 'ammo_fuel') return 'зачистка';
    if ((ws.pellets ?? 1) > 1) return 'дробь';
    if (ws.ammoType === 'ammo_energy') return 'энерго';
    if (ws.ammoType === 'ammo_nails' || ws.ammoType === 'ammo_harpoon') return 'индустр.';
    if (ws.speed <= 0.1) return 'авто';
    return 'огонь';
  }
  if (!id) return 'кулаки';
  if ((ws.knockback ?? 0) >= 0.45) return 'стоп-ближ.';
  if (ws.range >= 1.65) return 'длинный ближ.';
  if (ws.speed >= 0.7 || ws.dmg >= 35) return 'тяж. ближ.';
  return 'ближний';
}

function weaponReachLabel(ws: WeaponStats): string {
  if (ws.isRanged || ws.psiCost) return '';
  return `дист ${ws.range.toFixed(1)}`;
}

function weaponControlLabel(ws: WeaponStats): string {
  if (ws.isRanged || ws.psiCost) return '';
  const knockback = ws.knockback ?? 0;
  return knockback >= 0.1 ? `стоп ${knockback.toFixed(1)}` : '';
}

function weaponDamageLabel(e: Entity, ws: WeaponStats): { damage: number; label: string } {
  if (ws.isRanged || ws.psiCost) {
    const pellets = ws.pellets ?? 1;
    return { damage: ws.dmg, label: pellets > 1 ? `${ws.dmg}x${pellets}` : String(ws.dmg) };
  }
  const baseDmg = (!e.weapon && e.rpg) ? e.rpg.level : ws.dmg;
  const damage = Math.round(baseDmg * (e.rpg ? strMeleeDmgMult(e.rpg) : 1));
  return { damage, label: String(damage) };
}

/* ── Bounded current weapon display state for HUD/inventory ───── */
export function getWeaponReadiness(e: Entity): WeaponReadiness {
  const id = e.weapon ?? '';
  const ws = getWeaponStats(e);
  const name = id ? (ITEMS[id]?.name ?? id) : 'Кулаки';
  const cooldown = Math.max(0, e.attackCd ?? 0);
  const cooldownMax = Math.max(0.05, ws.speed * (e.rpg ? agiAttackSpeedMult(e.rpg) : 1));
  const cooldownPct = Math.max(0, Math.min(1, cooldown / cooldownMax));
  const damage = weaponDamageLabel(e, ws);
  let resourceKind: WeaponReadiness['resourceKind'] = 'none';
  let resourceName = '';
  let resourceCurrent = 0;
  let resourceMax: number | undefined;
  let resourceCost: number | undefined;
  let resourceLabel = 'без расхода';
  let cannotFireReason = '';
  let lowResource = false;

  if (ws.psiCost) {
    const cost = adjustedPsiCost(ws.psiCost, e.rpg);
    const costLabel = Number.isInteger(cost) ? String(cost) : cost.toFixed(1);
    const psi = Math.floor(e.rpg?.psi ?? 0);
    const maxPsi = e.rpg?.maxPsi ?? 0;
    resourceKind = 'psi';
    resourceName = 'ПСИ';
    resourceCurrent = psi;
    resourceMax = maxPsi;
    resourceCost = cost;
    resourceLabel = `ПСИ ${psi}/${maxPsi} -${costLabel}`;
    if (!e.rpg || (e.rpg.psi ?? 0) < cost) cannotFireReason = 'нет ПСИ';
    lowResource = psi < cost * 2;
  } else if (ws.isRanged) {
    const ammo = countAmmo(e);
    resourceKind = 'ammo';
    resourceName = compactAmmoName(ws.ammoType);
    resourceCurrent = ammo;
    resourceCost = 1;
    resourceLabel = `${resourceName} ${ammo}`;
    if (!ws.ammoType || ammo <= 0) cannotFireReason = 'нет патронов';
    lowResource = ammo <= 3;
  } else {
    const dur = getEquippedDurability(e);
    resourceKind = 'durability';
    resourceName = 'прочн';
    if (dur) {
      const cur = Math.max(0, Math.ceil(dur.cur));
      resourceCurrent = cur;
      resourceMax = dur.max;
      resourceLabel = `прочн ${cur}/${dur.max}`;
      if (cur <= 0) cannotFireReason = 'сломано';
      lowResource = cur / Math.max(1, dur.max) <= 0.2;
    } else {
      resourceCurrent = ws.durability > 0 ? 0 : 1;
      resourceLabel = ws.durability > 0 ? 'прочн --' : 'прочн ∞';
      if (ws.durability > 0 && id) cannotFireReason = 'нет оружия';
    }
  }

  return {
    id,
    name,
    role: weaponRole(id, ws),
    damage: damage.damage,
    damageLabel: damage.label,
    range: ws.range,
    pellets: ws.pellets ?? 1,
    knockback: ws.knockback ?? 0,
    reachLabel: weaponReachLabel(ws),
    controlLabel: weaponControlLabel(ws),
    cooldown,
    cooldownMax,
    cooldownPct,
    readyPct: 1 - cooldownPct,
    cooldownLabel: cooldown > 0.05 ? `КД ${cooldown.toFixed(1)}с` : 'ГОТОВ',
    resourceKind,
    resourceName,
    resourceCurrent,
    resourceMax,
    resourceCost,
    resourceLabel,
    cannotFireReason,
    lowResource,
    warning: cannotFireReason !== '' || lowResource,
  };
}
