import {
  type Entity,
  type GameState,
  type Item,
  type ItemDef,
  type RPGStats,
  Faction,
  FloorLevel,
  Occupation,
} from '../core/types';
import { ITEMS } from '../data/catalog';
import { type EconomyState, createEconomyFloorState, createEconomyState, normalizeEconomyState } from '../data/economy';
import {
  DEFAULT_TRADE_SPREAD,
  ECONOMY_DEMAND_RULES,
  ECONOMY_TARIFF_RULES,
  ECONOMY_TRADE_SPREAD_RULES,
  type EconomyFloorRef,
  type EconomyTradeSpreadRule,
} from '../data/economy_rules';
import { isSilverSlimeItem, SILVER_SLIME_SEALED_ID } from '../data/items';
import { RESOURCES, resourceForItem, resourceForItemType } from '../data/resources';
import { publishEvent } from './events';
import { isGovnyakItem } from './govnyak';
import { intContractRewardMult } from './rpg';

type EconomyGameState = GameState & { economy?: EconomyState };
type CachedPrice = { price: number; multiplier: number };
type PriceCache = { floor: FloorLevel; version: number; items: Map<string, CachedPrice> };

export interface EconomyQuoteOptions {
  floor?: EconomyFloorRef;
  stockFloor?: FloorLevel;
  trader?: Entity;
  traderFaction?: Faction;
  traderOccupation?: Occupation;
  tariffMultiplier?: number;
  tags?: readonly string[];
  reason?: string;
}

export interface EconomyQuote {
  basePrice: number;
  scarcityMultiplier: number;
  demandMultiplier: number;
  tariffMultiplier: number;
  buyPrice: number;
  sellPrice: number;
  resourceId?: string;
  tags: string[];
  reason: string;
}

export interface PlayerItemSaleRecordOptions {
  tags?: readonly string[];
  data?: Record<string, unknown>;
}

interface RuleSummary {
  multiplier: number;
  tags: string[];
  reasons: string[];
}

const MAX_PRICE_CACHE_ITEMS = 256;
const MAX_QUOTE_TAGS = 8;
const priceCaches = new WeakMap<GameState, PriceCache>();

function pushTag(out: string[], tag: string | undefined): void {
  if (!tag || out.length >= MAX_QUOTE_TAGS || out.includes(tag)) return;
  out.push(tag);
}

function pushTags(out: string[], tags: readonly string[] | undefined): void {
  if (!tags) return;
  for (const tag of tags) pushTag(out, tag);
}

function floorMatches(ruleFloor: EconomyFloorRef | undefined, floor: EconomyFloorRef): boolean {
  return ruleFloor === undefined || ruleFloor === floor;
}

function clampRuleMultiplier(value: number): number {
  return Number.isFinite(value) ? Math.max(0.1, Math.min(6, value)) : 1;
}

function stockFloorFor(state: GameState, opts: EconomyQuoteOptions): FloorLevel {
  if (opts.stockFloor !== undefined) return opts.stockFloor;
  return typeof opts.floor === 'number' ? opts.floor : state.currentFloor;
}

function demandFor(resourceId: string | undefined, floor: EconomyFloorRef): RuleSummary {
  const out: RuleSummary = { multiplier: 1, tags: [], reasons: [] };
  if (!resourceId) return out;
  for (const rule of ECONOMY_DEMAND_RULES) {
    if (rule.resourceId !== resourceId || !floorMatches(rule.floor, floor)) continue;
    out.multiplier *= clampRuleMultiplier(rule.multiplier);
    pushTags(out.tags, rule.tags);
    out.reasons.push(rule.reason);
  }
  return out;
}

function tariffFor(resourceId: string | undefined, floor: EconomyFloorRef, opts: EconomyQuoteOptions): RuleSummary {
  const out: RuleSummary = { multiplier: 1, tags: [], reasons: [] };
  for (const rule of ECONOMY_TARIFF_RULES) {
    if (resourceId && rule.resourceId !== undefined && rule.resourceId !== resourceId) continue;
    if (!floorMatches(rule.floor, floor)) continue;
    out.multiplier *= clampRuleMultiplier(rule.multiplier);
    pushTags(out.tags, rule.tags);
    out.reasons.push(rule.reason);
  }
  if (opts.tariffMultiplier !== undefined) {
    out.multiplier *= clampRuleMultiplier(opts.tariffMultiplier);
    pushTag(out.tags, 'tariff_modifier');
    if (opts.reason) out.reasons.push(opts.reason);
  }
  return out;
}

function traderMatches(rule: EconomyTradeSpreadRule, faction: Faction | undefined, occupation: Occupation | undefined): boolean {
  if (rule.faction !== undefined && rule.faction !== faction) return false;
  if (rule.occupation !== undefined && rule.occupation !== occupation) return false;
  return rule.faction !== undefined || rule.occupation !== undefined;
}

function spreadFor(opts: EconomyQuoteOptions): EconomyTradeSpreadRule {
  const faction = opts.traderFaction ?? opts.trader?.faction;
  const occupation = opts.traderOccupation ?? opts.trader?.occupation;
  let selected = DEFAULT_TRADE_SPREAD;
  for (const rule of ECONOMY_TRADE_SPREAD_RULES) {
    if (traderMatches(rule, faction, occupation)) selected = rule;
  }
  return selected;
}

function roundedPrice(basePrice: number, multiplier: number): number {
  return Math.max(1, Math.round(basePrice * multiplier));
}

function isEconomyState(value: unknown): value is EconomyState {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<EconomyState>;
  return typeof candidate.priceVersion === 'number'
    && !!candidate.floors
    && typeof candidate.floors === 'object';
}

export function ensureEconomyState(state: GameState): EconomyState {
  const econState = state as EconomyGameState;
  if (!isEconomyState(econState.economy)) {
    econState.economy = normalizeEconomyState(econState.economy ?? createEconomyState());
    priceCaches.delete(state);
  }
  if (!econState.economy.floors[state.currentFloor]) {
    econState.economy.floors[state.currentFloor] = createEconomyFloorState(state.currentFloor);
  }
  return econState.economy;
}

export function normalizeGameEconomy(state: GameState, saved: unknown): void {
  const econState = state as EconomyGameState;
  econState.economy = normalizeEconomyState(saved);
  priceCaches.delete(state);
  if (!econState.economy.floors[state.currentFloor]) {
    econState.economy.floors[state.currentFloor] = createEconomyFloorState(state.currentFloor);
  }
}

export function economyForSave(state: GameState): EconomyState {
  return ensureEconomyState(state);
}

export function getResourceScarcity(state: GameState, resourceId: string, floor: FloorLevel = state.currentFloor): number {
  const econ = ensureEconomyState(state);
  const floorState = econ.floors[floor] ?? createEconomyFloorState(floor);
  econ.floors[floor] = floorState;
  const res = RESOURCES.find(r => r.id === resourceId);
  const stock = floorState.resources[resourceId];
  if (!res || !stock) return 1;
  return Math.max(0.25, Math.min(4, stock.target / Math.max(1, stock.stock)));
}

export function changeResourceStock(state: GameState, resourceId: string, delta: number, floor: FloorLevel = state.currentFloor): boolean {
  const econ = ensureEconomyState(state);
  const floorState = econ.floors[floor] ?? createEconomyFloorState(floor);
  econ.floors[floor] = floorState;
  const stock = floorState.resources[resourceId];
  if (!stock) return false;
  const next = Math.max(0, Math.min(stock.target * 2, stock.stock + delta));
  stock.lastDelta = next - stock.stock;
  stock.stock = next;
  if (stock.lastDelta !== 0) econ.priceVersion++;
  floorState.lastTickAt = state.time;
  return true;
}

export function canSpendResources(state: GameState, inputs: { id: string; count: number }[], floor: FloorLevel = state.currentFloor): boolean {
  const econ = ensureEconomyState(state);
  const floorState = econ.floors[floor] ?? createEconomyFloorState(floor);
  econ.floors[floor] = floorState;
  for (const i of inputs) {
    const stock = floorState.resources[i.id];
    if (!stock || stock.stock < i.count) return false;
  }
  return true;
}

export function spendResources(state: GameState, inputs: { id: string; count: number }[], floor: FloorLevel = state.currentFloor): boolean {
  if (!canSpendResources(state, inputs, floor)) return false;
  for (const i of inputs) changeResourceStock(state, i.id, -i.count, floor);
  return true;
}

function priceCacheFor(state: GameState): PriceCache {
  const econ = ensureEconomyState(state);
  let cache = priceCaches.get(state);
  if (!cache || cache.floor !== state.currentFloor || cache.version !== econ.priceVersion) {
    cache = { floor: state.currentFloor, version: econ.priceVersion, items: new Map() };
    priceCaches.set(state, cache);
  }
  return cache;
}

function cachedItemPrice(state: GameState, defId: string): CachedPrice {
  const cache = priceCacheFor(state);
  const cached = cache.items.get(defId);
  if (cached) return cached;
  const def = ITEMS[defId] as ItemDef | undefined;
  if (!def) return { price: 0, multiplier: 1 };
  const quote = getEconomyQuote(state, defId);
  const multiplier = quote.scarcityMultiplier;
  const price = roundedPrice(quote.basePrice, quote.scarcityMultiplier * quote.demandMultiplier * quote.tariffMultiplier);
  const next = { price, multiplier };
  if (cache.items.size >= MAX_PRICE_CACHE_ITEMS) cache.items.clear();
  cache.items.set(defId, next);
  return next;
}

export function primeTradePriceCache(state: GameState, inventories: readonly (readonly Item[] | undefined)[]): void {
  for (const inv of inventories) {
    if (!inv) continue;
    for (const item of inv) cachedItemPrice(state, item.defId);
  }
}

export function getItemPriceMultiplier(state: GameState, defId: string): number {
  return cachedItemPrice(state, defId).multiplier;
}

export function getAdjustedItemPrice(state: GameState, defId: string): number {
  return cachedItemPrice(state, defId).price;
}

export function getEconomyQuote(state: GameState, defId: string, opts: EconomyQuoteOptions = {}): EconomyQuote {
  const def = ITEMS[defId] as ItemDef | undefined;
  if (!def) {
    return {
      basePrice: 0,
      scarcityMultiplier: 1,
      demandMultiplier: 1,
      tariffMultiplier: 1,
      buyPrice: 0,
      sellPrice: 0,
      tags: ['unknown_item'],
      reason: 'unknown_item',
    };
  }

  const floor = opts.floor ?? state.currentFloor;
  const resource = resourceForItem(defId) ?? resourceForItemType(def.type);
  const resourceId = resource?.id;
  const scarcityMultiplier = resourceId ? getResourceScarcity(state, resourceId, stockFloorFor(state, opts)) : 1;
  const demand = demandFor(resourceId, floor);
  const tariff = tariffFor(resourceId, floor, opts);
  const spread = spreadFor(opts);
  const basePrice = Math.max(0, def.value ?? 0);
  const adjustedMultiplier = scarcityMultiplier * demand.multiplier * tariff.multiplier;
  const tags: string[] = ['economy'];
  if (resourceId) pushTag(tags, `res_${resourceId}`);
  pushTags(tags, demand.tags);
  pushTags(tags, tariff.tags);
  pushTags(tags, spread.tags);
  pushTags(tags, opts.tags);
  const reasons = [...demand.reasons, ...tariff.reasons, spread.reason];
  if (opts.reason && opts.tariffMultiplier === undefined) reasons.push(opts.reason);

  return {
    basePrice,
    scarcityMultiplier,
    demandMultiplier: demand.multiplier,
    tariffMultiplier: tariff.multiplier,
    buyPrice: roundedPrice(basePrice, adjustedMultiplier * spread.buyMultiplier),
    sellPrice: roundedPrice(basePrice, adjustedMultiplier * spread.sellMultiplier),
    resourceId,
    tags,
    reason: reasons.slice(0, 4).join('+') || 'base_price',
  };
}

export function recordPlayerItemSale(
  state: GameState,
  seller: Entity,
  buyer: Entity,
  defId: string,
  count: number,
  unitPrice: number,
  zoneId?: number,
  opts: PlayerItemSaleRecordOptions = {},
): void {
  const def = ITEMS[defId];
  const silver = isSilverSlimeItem(defId);
  const govnyak = isGovnyakItem(defId);
  const scienceBuyer = buyer.faction === Faction.SCIENTIST || buyer.occupation === Occupation.SCIENTIST;
  const blackMarketBuyer = buyer.occupation === Occupation.STOREKEEPER
    || buyer.faction === Faction.WILD
    || buyer.faction === Faction.CULTIST;
  const liquidatorConfiscation = govnyak && buyer.faction === Faction.LIQUIDATOR;
  const sealedScienceHandoff = silver && defId === SILVER_SLIME_SEALED_ID && scienceBuyer;
  const outcome = sealedScienceHandoff
    ? 'science_handoff'
    : silver && blackMarketBuyer ? 'black_market_sale'
      : silver ? 'cash_sale'
        : liquidatorConfiscation ? 'confiscation'
          : govnyak && blackMarketBuyer ? 'contraband_sale'
            : govnyak ? 'pressure_sale'
              : 'sale';
  const tags = silver
    ? ['player', 'trade', 'slime', 'silver_slime', sealedScienceHandoff ? 'science' : blackMarketBuyer ? 'black_market' : 'cash', outcome]
    : govnyak
      ? ['player', 'trade', 'govnyak', 'contraband', liquidatorConfiscation ? 'confiscation' : blackMarketBuyer ? 'black_market' : 'cash', outcome]
      : ['player', 'trade', 'sale'];
  pushTags(tags, opts.tags);
  publishEvent(state, {
    type: sealedScienceHandoff || liquidatorConfiscation ? 'player_handoff_item' : 'player_sell_item',
    zoneId,
    actorId: seller.id,
    actorName: seller.name ?? 'Вы',
    actorFaction: seller.faction,
    targetId: buyer.id,
    targetName: buyer.name,
    targetFaction: buyer.faction,
    itemId: defId,
    itemName: def?.name ?? defId,
    itemCount: count,
    itemValue: def?.value ?? 0,
    severity: silver ? 4 : govnyak ? liquidatorConfiscation ? 4 : 3 : 1,
    privacy: silver ? 'witnessed' : govnyak ? 'local' : 'private',
    tags,
    data: {
      unitPrice,
      totalPrice: unitPrice * count,
      price: unitPrice,
      direction: 'player_to_npc',
      outcome,
      rumorIds: silver
        ? [sealedScienceHandoff ? 'silver_slime_science_handoff' : 'silver_slime_sale_suspicion']
        : govnyak
          ? [liquidatorConfiscation ? 'govnyak_confiscation' : 'govnyak_trade']
        : undefined,
      ...opts.data,
    },
  });
}

export function getScarcityAdjustedReward(
  state: GameState,
  resourceId: string,
  baseReward: number,
  floor: FloorLevel = state.currentFloor,
  maxMultiplier = 3,
  rpg?: RPGStats,
): number {
  const scarcity = getResourceScarcity(state, resourceId, floor);
  const multiplier = Math.min(maxMultiplier, Math.max(1, scarcity));
  const intMultiplier = rpg ? intContractRewardMult(rpg) : 1;
  return Math.max(1, Math.round(baseReward * multiplier * intMultiplier));
}

export function summarizeEconomy(state: GameState, limit = 8): string[] {
  const econ = ensureEconomyState(state);
  const floorState = econ.floors[state.currentFloor] ?? createEconomyFloorState(state.currentFloor);
  econ.floors[state.currentFloor] = floorState;
  return RESOURCES.slice(0, limit).map(r => {
    const stock = floorState.resources[r.id];
    const mult = getResourceScarcity(state, r.id);
    return `${r.name}: ${Math.round(stock.stock)}/${stock.target} x${mult.toFixed(2)}`;
  });
}
