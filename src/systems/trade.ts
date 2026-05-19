import { type Entity, type FloorLevel, type GameState } from '../core/types';
import { ITEMS } from '../data/catalog';
import { type EconomyFloorRef } from '../data/economy_rules';
import { addItem } from './inventory';
import {
  changeResourceStock,
  getEconomyQuote,
  recordPlayerItemSale,
  type EconomyQuote,
  type EconomyQuoteOptions,
} from './economy';
import { publishEvent } from './events';
import { isGovnyakItem } from './govnyak';

export type TradeResultCode =
  | 'bought'
  | 'sold'
  | 'handoff'
  | 'no_item'
  | 'player_no_money'
  | 'player_no_space'
  | 'npc_no_money'
  | 'npc_no_space';

export interface TradeResult {
  ok: boolean;
  code: TradeResultCode;
  defId?: string;
  price?: number;
  quote?: EconomyQuote;
}

export interface TradeHookContext {
  state: GameState;
  player: Entity;
  npc: Entity;
  slotIndex: number;
}

export interface CompletedTradeContext extends TradeHookContext {
  defId: string;
  price: number;
  quote: EconomyQuote;
  zoneId?: number;
}

export interface TradeOptions {
  floor?: EconomyFloorRef;
  stockFloor?: FloorLevel;
  zoneId?: number;
  tariffMultiplier?: number;
  tags?: readonly string[];
  reason?: string;
  beforeSell?: (ctx: TradeHookContext) => boolean;
  afterSell?: (ctx: CompletedTradeContext) => void;
}

function quoteOptions(npc: Entity, opts: TradeOptions): EconomyQuoteOptions {
  return {
    floor: opts.floor,
    stockFloor: opts.stockFloor,
    trader: npc,
    tariffMultiplier: opts.tariffMultiplier,
    tags: opts.tags,
    reason: opts.reason,
  };
}

function stockFloorForTrade(state: GameState, opts: TradeOptions): FloorLevel {
  if (opts.stockFloor !== undefined) return opts.stockFloor;
  return typeof opts.floor === 'number' ? opts.floor : state.currentFloor;
}

function decrementSlot(inv: Entity['inventory'], slotIndex: number): void {
  const slot = inv?.[slotIndex];
  if (!slot) return;
  slot.count--;
  if (slot.count <= 0) inv?.splice(slotIndex, 1);
}

function publishPlayerBuyEvent(
  state: GameState,
  player: Entity,
  npc: Entity,
  defId: string,
  price: number,
  quote: EconomyQuote,
  zoneId?: number,
): void {
  const def = ITEMS[defId];
  const govnyak = isGovnyakItem(defId);
  publishEvent(state, {
    type: 'player_handoff_item',
    zoneId,
    actorId: player.id,
    actorName: player.name ?? 'Вы',
    actorFaction: player.faction,
    targetId: npc.id,
    targetName: npc.name,
    targetFaction: npc.faction,
    itemId: defId,
    itemName: def?.name ?? defId,
    itemCount: 1,
    itemValue: price,
    severity: govnyak ? 3 : 1,
    privacy: govnyak ? 'local' : 'private',
    tags: [
      'player',
      'inventory',
      'trade',
      'buy',
      ...(govnyak ? ['govnyak', 'contraband'] : []),
      ...quote.tags,
    ],
    data: {
      price,
      unitPrice: price,
      totalPrice: price,
      direction: 'npc_to_player',
      sellerId: npc.id,
      sellerName: npc.name,
      buyerId: player.id,
      buyerName: player.name,
      resourceId: quote.resourceId,
      quoteReason: quote.reason,
      quoteTags: quote.tags,
      rumorIds: govnyak ? ['govnyak_trade'] : [],
    },
  });
}

export function buyFromNpc(
  state: GameState,
  player: Entity,
  npc: Entity,
  slotIndex: number,
  opts: TradeOptions = {},
): TradeResult {
  const npcInv = npc.inventory ?? [];
  const slot = npcInv[slotIndex];
  if (!slot || slot.count <= 0) return { ok: false, code: 'no_item' };

  const defId = slot.defId;
  const quote = getEconomyQuote(state, defId, quoteOptions(npc, opts));
  const price = quote.buyPrice;
  if ((player.money ?? 0) < price) return { ok: false, code: 'player_no_money', defId, price, quote };
  if (!addItem(player, defId, 1, slot.data)) return { ok: false, code: 'player_no_space', defId, price, quote };

  player.money = (player.money ?? 0) - price;
  npc.money = (npc.money ?? 0) + price;
  decrementSlot(npcInv, slotIndex);
  if (quote.resourceId) changeResourceStock(state, quote.resourceId, -1, stockFloorForTrade(state, opts));
  publishPlayerBuyEvent(state, player, npc, defId, price, quote, opts.zoneId);
  return { ok: true, code: 'bought', defId, price, quote };
}

export function sellToNpc(
  state: GameState,
  player: Entity,
  npc: Entity,
  slotIndex: number,
  opts: TradeOptions = {},
): TradeResult {
  if (opts.beforeSell?.({ state, player, npc, slotIndex })) return { ok: true, code: 'handoff' };

  const playerInv = player.inventory ?? [];
  const slot = playerInv[slotIndex];
  if (!slot || slot.count <= 0) return { ok: false, code: 'no_item' };

  const defId = slot.defId;
  const quote = getEconomyQuote(state, defId, quoteOptions(npc, opts));
  const price = quote.sellPrice;
  if ((npc.money ?? 0) < price) return { ok: false, code: 'npc_no_money', defId, price, quote };
  if (!addItem(npc, defId, 1, slot.data)) return { ok: false, code: 'npc_no_space', defId, price, quote };

  npc.money = (npc.money ?? 0) - price;
  player.money = (player.money ?? 0) + price;
  decrementSlot(playerInv, slotIndex);
  if (quote.resourceId) changeResourceStock(state, quote.resourceId, 1, stockFloorForTrade(state, opts));
  recordPlayerItemSale(state, player, npc, defId, 1, price, opts.zoneId, {
    tags: ['sell', ...quote.tags],
    data: {
      resourceId: quote.resourceId,
      quoteReason: quote.reason,
      quoteTags: quote.tags,
    },
  });
  opts.afterSell?.({ state, player, npc, slotIndex, defId, price, quote, zoneId: opts.zoneId });
  return { ok: true, code: 'sold', defId, price, quote };
}
