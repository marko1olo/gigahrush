import { type Entity, type GameState } from '../core/types';
import { ITEMS } from '../data/catalog';
import { getStack } from '../data/items';
import { bankingSummary } from '../systems/banking';
import { getAdjustedItemPrice, getEconomyQuote, getItemPriceMultiplier } from '../systems/economy';
import { stockMarketSnapshot } from '../systems/stock_market';
import { drawGlitchText, drawNeuroPanel } from './hud_fx';
import { fitText } from './ui_text';

const INVENTORY_SLOTS = 25;

type LooseRecord = Record<string, unknown>;

export interface FinanceSnapshot {
  cash: number;
  hasBanking: boolean;
  accountRubles: number;
  depositPrincipal: number;
  depositYield: number;
  debtRubles: number;
  creditLimit: number;
  hasStock: boolean;
  portfolioValue: number;
  portfolioPL: number;
}

export interface FinanceLine {
  text: string;
  color: string;
}

export interface TradePriceDisplay {
  price: number;
  line: string;
  status: string;
  color: string;
  ok: boolean;
}

function asRecord(value: unknown): LooseRecord | null {
  return value && typeof value === 'object' ? value as LooseRecord : null;
}

function num(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function compactRubles(value: number): string {
  const rounded = Math.round(value);
  return `${rounded}₽`;
}

function formatSignedRubles(value: number): string {
  const rounded = Math.round(value);
  return `${rounded >= 0 ? '+' : ''}${rounded}₽`;
}

function readBanking(state: GameState): Pick<
  FinanceSnapshot,
  'hasBanking' | 'accountRubles' | 'depositPrincipal' | 'depositYield' | 'debtRubles' | 'creditLimit'
> {
  const banking = asRecord((state as GameState & { banking?: unknown }).banking);
  if (!banking) {
    return {
      hasBanking: false,
      accountRubles: 0,
      depositPrincipal: 0,
      depositYield: 0,
      debtRubles: 0,
      creditLimit: 0,
    };
  }

  const summary = bankingSummary(state);
  const elapsedMinutes = Math.max(0, num(state.clock?.totalMinutes) - summary.lastInterestAt);
  const pendingDepositYield = summary.depositPrincipal > 0 && summary.depositRate > 0
    ? summary.depositPrincipal * summary.depositRate * Math.min(1, elapsedMinutes / 60)
    : 0;

  const depositPrincipal = Math.max(0, num(banking.depositPrincipal));
  const depositAccrued = Math.max(0, num(banking.depositAccrued ?? banking.depositInterest));
  const depositRate = Math.max(0, num(banking.depositRate));
  const depositOpenedAt = num(banking.depositOpenedAt, state.time);
  const elapsedDays = Math.max(0, Math.min(3650, (state.time - depositOpenedAt) / 86400));
  const estimatedYield = depositAccrued || depositPrincipal * depositRate * elapsedDays / 365;
  const loanPrincipal = Math.max(0, num(banking.loanPrincipal ?? banking.debtPrincipal));
  const loanAccrued = Math.max(0, num(banking.loanAccrued ?? banking.debtAccrued));

  return {
    hasBanking: true,
    accountRubles: summary.accountRubles,
    depositPrincipal: summary.depositPrincipal || depositPrincipal,
    depositYield: Math.max(0, pendingDepositYield || estimatedYield),
    debtRubles: summary.debtRubles || Math.max(0, num(banking.debtRubles, loanPrincipal + loanAccrued)),
    creditLimit: summary.creditLimit,
  };
}

function readStock(state: GameState): Pick<FinanceSnapshot, 'hasStock' | 'portfolioValue' | 'portfolioPL'> {
  const stock = asRecord((state as GameState & { stockMarket?: unknown }).stockMarket);
  if (!stock) return { hasStock: false, portfolioValue: 0, portfolioPL: 0 };

  const directValue = num(stock.portfolioValue ?? stock.portfolioRubles, Number.NaN);
  const directPL = num(stock.portfolioPL ?? stock.unrealizedPL, Number.NaN);
  const quotes = asRecord(stock.quotes);
  const portfolio = asRecord(stock.portfolio);
  let value = Number.isFinite(directValue) ? directValue : 0;
  let cost = 0;
  let directPositions = 0;

  if (quotes && portfolio) {
    value = 0;
    for (const [corpId, posValue] of Object.entries(portfolio)) {
      const pos = asRecord(posValue);
      const quote = asRecord(quotes[corpId]);
      if (!pos || !quote) continue;
      const shares = Math.max(0, num(pos.shares));
      const avgPrice = Math.max(0, num(pos.avgPrice));
      const price = Math.max(0, num(quote.price));
      value += shares * price;
      cost += shares * avgPrice;
      if (shares > 0) directPositions++;
    }
  }

  const snapshot = stockMarketSnapshot(state);
  const snapshotCost = snapshot.quotes.reduce((sum, quote) => sum + quote.shares * quote.avgPrice, 0);
  const snapshotPL = snapshot.portfolioValue - snapshotCost;
  if (snapshot.quotes.length > 0 && (snapshot.portfolioValue > 0 || directPositions === 0)) {
    return {
      hasStock: true,
      portfolioValue: Math.max(0, snapshot.portfolioValue),
      portfolioPL: snapshotPL,
    };
  }

  return {
    hasStock: true,
    portfolioValue: Math.max(0, value),
    portfolioPL: Number.isFinite(directPL) ? directPL : value - cost,
  };
}

export function readFinanceSnapshot(player: Entity, state: GameState): FinanceSnapshot {
  const banking = readBanking(state);
  const stock = readStock(state);
  return {
    cash: Math.max(0, player.money ?? 0),
    ...banking,
    ...stock,
  };
}

export function financeDetailLines(snapshot: FinanceSnapshot): FinanceLine[] {
  const lines: FinanceLine[] = [
    { text: `Наличные: ${compactRubles(snapshot.cash)}`, color: '#ee4' },
  ];
  if (snapshot.hasBanking) {
    lines.push({ text: `Счет: ${compactRubles(snapshot.accountRubles)}`, color: '#8cf' });
    if (snapshot.depositPrincipal > 0 || snapshot.depositYield > 0) {
      lines.push({
        text: `Депозит: ${compactRubles(snapshot.depositPrincipal)} +~${compactRubles(snapshot.depositYield)}`,
        color: '#8f8',
      });
    }
    if (snapshot.debtRubles > 0 || snapshot.creditLimit > 0) {
      const debt = snapshot.debtRubles > 0 ? `Долг: ${compactRubles(snapshot.debtRubles)}` : 'Долг: 0₽';
      const limit = snapshot.creditLimit > 0 ? ` / лимит ${compactRubles(snapshot.creditLimit)}` : '';
      lines.push({ text: `${debt}${limit}`, color: snapshot.debtRubles > 0 ? '#f86' : '#789' });
    }
  }
  if (snapshot.hasStock) {
    lines.push({ text: `Портфель: ${compactRubles(snapshot.portfolioValue)}`, color: '#9df' });
    lines.push({
      text: `Акции P/L: ${formatSignedRubles(snapshot.portfolioPL)}`,
      color: snapshot.portfolioPL >= 0 ? '#8f8' : '#f86',
    });
  }
  return lines;
}

export function hudFinanceLines(snapshot: FinanceSnapshot): FinanceLine[] {
  const top = snapshot.hasBanking
    ? `₽${Math.round(snapshot.cash)} сч ${Math.round(snapshot.accountRubles)}`
    : `₽${Math.round(snapshot.cash)}`;
  const lines: FinanceLine[] = [{ text: top, color: '#ee4' }];
  if (snapshot.debtRubles > 0) lines.push({ text: `долг ${compactRubles(snapshot.debtRubles)}`, color: '#f86' });
  return lines;
}

function inventoryFinanceLines(snapshot: FinanceSnapshot): FinanceLine[] {
  const lines: FinanceLine[] = [
    {
      text: snapshot.hasBanking
        ? `Наличные: ${compactRubles(snapshot.cash)}  Счет: ${compactRubles(snapshot.accountRubles)}`
        : `Наличные: ${compactRubles(snapshot.cash)}`,
      color: '#ee4',
    },
  ];
  if (snapshot.depositPrincipal > 0 || snapshot.depositYield > 0) {
    lines.push({
      text: `Депозит: ${compactRubles(snapshot.depositPrincipal)} +~${compactRubles(snapshot.depositYield)}`,
      color: '#8f8',
    });
  }
  if (snapshot.hasBanking && (snapshot.debtRubles > 0 || snapshot.creditLimit > 0)) {
    const limit = snapshot.creditLimit > 0 ? ` / лимит ${compactRubles(snapshot.creditLimit)}` : '';
    lines.push({
      text: `Долг: ${compactRubles(snapshot.debtRubles)}${limit}`,
      color: snapshot.debtRubles > 0 ? '#f86' : '#789',
    });
  }
  if (snapshot.hasStock) {
    lines.push({
      text: `Портфель: ${compactRubles(snapshot.portfolioValue)}  P/L ${formatSignedRubles(snapshot.portfolioPL)}`,
      color: snapshot.portfolioPL >= 0 ? '#8f8' : '#f86',
    });
  }
  return lines;
}

export function drawHudFinanceCompact(
  ctx: CanvasRenderingContext2D,
  player: Entity,
  state: GameState,
  sx: number,
  sy: number,
  time: number,
  y: number,
): void {
  const lines = hudFinanceLines(readFinanceSnapshot(player, state));
  const w = ctx.canvas.width;
  const panelW = Math.min(116 * sx, w - 12 * sx);
  const lineH = 9 * sy;
  const panelH = (8 + lines.length * 9) * sy;
  const x = w - panelW - 6 * sx;
  if (panelW <= 24 * sx) return;

  ctx.save();
  drawNeuroPanel(ctx, x, y, panelW, panelH, time, 280);
  ctx.font = `${7 * sy}px monospace`;
  ctx.textAlign = 'left';
  for (let i = 0; i < lines.length; i++) {
    ctx.fillStyle = lines[i].color;
    ctx.fillText(fitText(ctx, lines[i].text, panelW - 10 * sx), x + 5 * sx, y + (4 * sy) + i * lineH);
  }
  ctx.restore();
}

export function drawInventoryFinanceBlock(
  ctx: CanvasRenderingContext2D,
  player: Entity,
  state: GameState,
  x: number,
  y: number,
  w: number,
  sy: number,
  time: number,
  maxBottom: number,
): number {
  const lines = inventoryFinanceLines(readFinanceSnapshot(player, state));
  const lineH = 9 * sy;
  const available = Math.max(1, Math.floor((maxBottom - y - 8 * sy) / lineH));
  const visible = lines.slice(0, available);
  if (visible.length === 0) return y;

  drawGlitchText(ctx, 'ФИНАНСЫ', x, y, time, 830, '#6cf', 7 * sy);
  let cy = y + 10 * sy;
  ctx.font = `${7 * sy}px monospace`;
  for (const line of visible) {
    ctx.fillStyle = line.color;
    ctx.fillText(fitText(ctx, line.text, w), x, cy);
    cy += lineH;
  }
  return cy + 3 * sy;
}

export function hasInventoryRoom(inv: readonly { defId: string; count: number; data?: unknown }[] | undefined, defId: string): boolean {
  const def = ITEMS[defId];
  if (!def) return false;
  const slots = inv ?? [];
  const stack = getStack(def);
  for (const slot of slots) {
    if (slot.defId === defId && slot.count < stack && slot.data === undefined) return true;
  }
  return slots.length < INVENTORY_SLOTS;
}

export function tradePriceDisplay(
  state: GameState,
  player: Entity,
  npc: Entity,
  defId: string,
  side: 'buy' | 'sell',
): TradePriceDisplay {
  let price = getAdjustedItemPrice(state, defId);
  let demand = 1;
  let scarcity = getItemPriceMultiplier(state, defId);
  let tariff = 1;
  try {
    const quote = getEconomyQuote(state, defId, { trader: npc });
    price = side === 'buy' ? quote.buyPrice : quote.sellPrice;
    demand = quote.demandMultiplier;
    scarcity = quote.scarcityMultiplier;
    tariff = quote.tariffMultiplier;
  } catch {
    // Rendering must stay graceful if a partially merged economy system cannot quote yet.
  }
  const reasons = [`спрос x${demand.toFixed(1)}`, `дефицит x${scarcity.toFixed(1)}`];
  if (Math.abs(tariff - 1) > 0.04) reasons.push(`тариф x${tariff.toFixed(1)}`);
  const label = side === 'buy' ? 'Цена' : 'Скупка';
  const payer = side === 'buy' ? player : npc;
  const receiver = side === 'buy' ? player : npc;
  const hasMoney = (payer.money ?? 0) >= price;
  const hasSpace = hasInventoryRoom(receiver.inventory, defId);
  const ok = hasMoney && hasSpace;
  const status = ok
    ? side === 'buy' ? '[E] купить' : '[E] продать'
    : !hasMoney
      ? side === 'buy' ? 'не хватает денег' : 'у торговца нет денег'
      : side === 'buy' ? 'нет места' : 'у торговца нет места';

  return {
    price,
    line: `${label}: ${price}₽ ${reasons.join(' ')}`,
    status,
    color: ok ? '#da4' : '#f84',
    ok,
  };
}
