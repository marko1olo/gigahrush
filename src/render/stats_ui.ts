/* ── Inventory panel (fullscreen) ──────────────────────────────── */

import { type Entity, type GameState, ItemType } from '../core/types';
import { ITEMS } from '../data/catalog';
import { getEquippedToolDurability, getWeaponReadiness } from '../systems/inventory';
import { controlHint } from '../systems/controls';
import {
  rpgStatEffects,
  rpgStatEffectsAfterSpend,
  RPG_LEVEL_CAP,
  xpForLevel,
  type RPGStatEffects,
} from '../systems/rpg';
import { zhelemishStatsLine } from '../systems/status';
import { drawNeuroPanel, drawGlitchText, textJitter, flicker } from './hud_fx';
import { fitText as fitStatText } from './ui_text';
import { drawInventoryFinanceBlock, readFinanceSnapshot } from './economy_ui';
import { fullscreenInventoryLayout } from './ui_layout';
import { drawItemGridIcon } from './item_sprites';

export function drawInventory(
  ctx: CanvasRenderingContext2D,
  player: Entity, state: GameState,
  sx: number, sy: number,
  uiTime = state.time,
): void {
  const inv = player.inventory ?? [];
  const GRID = 5;
  const cw = ctx.canvas.width;
  const ch = ctx.canvas.height;
  const time = uiTime;
  const layout = fullscreenInventoryLayout(cw, ch, sx, sy);
  sx = layout.scale;
  sy = layout.scale;

  // Fullscreen neuro-panel background
  ctx.fillStyle = '#00040a';
  ctx.fillRect(0, 0, cw, ch);
  drawNeuroPanel(ctx, 0, 0, cw, ch, time, 80);

  // Title + money + close hint
  drawGlitchText(ctx, 'ИНВЕНТАРЬ', 8 * sx, 6 * sy, time, 800, '#6cf', 9 * sy);
  ctx.font = `${9 * sy}px monospace`;
  const finance = readFinanceSnapshot(player, state);
  const mj = textJitter(time, 801);
  ctx.fillStyle = `rgba(238,238,68,${flicker(time, 802)})`;
  const titleMoney = finance.hasBanking
    ? `₽${Math.round(finance.cash)} сч ${Math.round(finance.accountRubles)}`
    : `₽${Math.round(finance.cash)}`;
  ctx.fillText(fitStatText(ctx, titleMoney, 90 * sx), 88 * sx + mj.dx, 6 * sy + mj.dy);
  ctx.fillStyle = '#456';
  ctx.font = `${7 * sy}px monospace`;
  ctx.textAlign = 'right';
  ctx.fillText(`${controlHint('inventory')} закрыть`, cw - 8 * sx, 6 * sy);
  ctx.textAlign = 'left';

  // ── LEFT COLUMN: grid + item desc + weapon + money ───────
  const cellSz = layout.grid.cell;
  const gridX = layout.grid.x;
  const gridY = layout.grid.y;
  const gridW = layout.grid.w;

  // 5×5 Grid
  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      const idx = row * GRID + col;
      const cx = gridX + col * cellSz;
      const cy = gridY + row * cellSz;
      const selected = idx === state.invSel;

      ctx.fillStyle = selected ? 'rgba(0,60,50,0.6)' : 'rgba(5,15,20,0.8)';
      ctx.fillRect(cx, cy, cellSz - 2, cellSz - 2);
      ctx.strokeStyle = selected ? 'rgba(0,255,200,0.6)' : 'rgba(0,100,80,0.25)';
      ctx.strokeRect(cx, cy, cellSz - 2, cellSz - 2);

      if (idx < inv.length) {
        const item = inv[idx];
        const def = ITEMS[item.defId];
        drawItemGridIcon(ctx, item.defId, def?.name ?? item.defId, cx, cy, cellSz, sx, sy, selected, selected ? 1 : 0.86);
        if (item.count > 1) {
          ctx.fillStyle = '#6a8';
          ctx.font = `${5 * sy}px monospace`;
          ctx.textAlign = 'center';
          ctx.fillText(`×${item.count}`, cx + cellSz / 2, cy + cellSz - 5 * sy);
          ctx.textAlign = 'left';
        }
      }
    }
  }

  // Selected item description (under grid, shifted right toward center)
  const descY = gridY + GRID * cellSz + 4 * sy;
  const descX = gridX + gridW / 2;
  ctx.textAlign = 'center';
  if (state.invSel < inv.length) {
    const item = inv[state.invSel];
    const def = ITEMS[item.defId];
    if (def) {
      ctx.fillStyle = '#ccc';
      ctx.font = `${8 * sy}px monospace`;
      ctx.fillText(fitStatText(ctx, `${def.name} ×${item.count}`, gridW + 8 * sx), descX, descY);
      ctx.fillStyle = '#888';
      ctx.font = `${7 * sy}px monospace`;
      let infoY = descY + 10 * sy;
      ctx.fillText(fitStatText(ctx, def.desc, gridW + 8 * sx), descX, infoY);
      infoY += 8 * sy;
      const actionBaseY = Math.min(infoY + 2 * sy, ch - 42 * sy);
      ctx.fillStyle = '#da4';
      ctx.fillText(`Цена: ${def.value ?? 0}₽`, descX, actionBaseY);
      if (def.use || def.type === ItemType.WEAPON || def.type === ItemType.TOOL) {
        ctx.fillStyle = '#6a6';
        ctx.fillText(`${controlHint('interact')} использовать`, descX, actionBaseY + 10 * sy);
      }
      ctx.fillStyle = '#a86';
      ctx.fillText(`${controlHint('drop')} выкинуть`, descX, actionBaseY + 20 * sy);
    }
  } else {
    ctx.fillStyle = '#555';
    ctx.font = `${7 * sy}px monospace`;
    ctx.fillText('Пустой слот', descX, descY + 6 * sy);
  }
  ctx.textAlign = 'left';

  // ── RIGHT COLUMN: stats ──────────────────────────────────
  const stX = gridX + gridW + 16 * sx;
  const barW = Math.max(24 * sx, cw - stX - 16 * sx);
  let stY = gridY;

  // Name + Level + Attributes on same row
  ctx.fillStyle = '#ee4';
  ctx.font = `${10 * sy}px monospace`;
  const nameStr = player.name ?? 'Вы';
  const nameMaxW = player.rpg ? barW * 0.45 : barW;
  ctx.fillText(fitStatText(ctx, nameStr, nameMaxW), stX, stY);
  let nameEndX = stX + Math.min(ctx.measureText(nameStr + '  ').width, nameMaxW);
  if (player.rpg) {
    ctx.fillStyle = '#af4';
    ctx.font = `${10 * sy}px monospace`;
    ctx.fillText(`Ур.${player.rpg.level}`, nameEndX, stY);
    nameEndX += ctx.measureText(`Ур.${player.rpg.level}   `).width;
  }

  // Attributes right of name/level
  if (player.rpg) {
    const rpg = player.rpg;
    const apLabel = rpg.attrPoints > 0 ? `  +${rpg.attrPoints}` : '';
    const attrLine = `${controlHint('attrStr')}СИЛ:${rpg.str}  ${controlHint('attrAgi')}ЛОВ:${rpg.agi}  ${controlHint('attrInt')}ИНТ:${rpg.int}${apLabel}`;
    ctx.font = `${8 * sy}px monospace`;
    if (nameEndX + ctx.measureText(attrLine).width > stX + barW) {
      stY += 11 * sy;
      nameEndX = stX;
    }
    const attrMaxW = Math.max(0, stX + barW - nameEndX);
    if (ctx.measureText(attrLine).width > attrMaxW) {
      ctx.fillStyle = '#e84';
      ctx.fillText(fitStatText(ctx, attrLine, attrMaxW), nameEndX, stY);
    } else {
      ctx.fillStyle = '#e84';
      const strLabel = `${controlHint('attrStr')}СИЛ:${rpg.str}`;
      const agiLabel = `${controlHint('attrAgi')}ЛОВ:${rpg.agi}`;
      const intLabel = `${controlHint('attrInt')}ИНТ:${rpg.int}`;
      ctx.fillText(strLabel, nameEndX, stY);
      const s1w = ctx.measureText(`${strLabel}  `).width;
      ctx.fillStyle = '#4e8';
      ctx.fillText(agiLabel, nameEndX + s1w, stY);
      const s2w = ctx.measureText(`${agiLabel}  `).width;
      ctx.fillStyle = '#48f';
      ctx.fillText(intLabel, nameEndX + s1w + s2w, stY);
      if (apLabel) {
        const s3w = ctx.measureText(`${intLabel} `).width;
        ctx.fillStyle = '#ee4';
        ctx.fillText(apLabel, nameEndX + s1w + s2w + s3w, stY);
      }
    }
  }
  stY += 14 * sy;

  // Attribute points (always visible)
  if (player.rpg) {
    ctx.fillStyle = player.rpg.attrPoints > 0 ? '#ee4' : '#888';
    ctx.font = `${8 * sy}px monospace`;
    ctx.fillText(`Очков характеристик: ${player.rpg.attrPoints}`, stX, stY);
    stY += 12 * sy;
    stY = drawRpgEffectBlock(ctx, player, stX, stY, barW, sy);
  }

  // XP bar
  if (player.rpg) {
    const capped = player.rpg.level >= RPG_LEVEL_CAP;
    const xpNeeded = capped ? 1 : xpForLevel(player.rpg.level + 1);
    ctx.fillStyle = '#8a8';
    ctx.font = `${7 * sy}px monospace`;
    ctx.fillText(capped ? `XP: максимум ${RPG_LEVEL_CAP}` : `XP: ${player.rpg.xp}/${xpNeeded}`, stX, stY);
    stY += 9 * sy;
    drawStatBar(ctx, stX, stY, barW, 4 * sy, capped ? 1 : player.rpg.xp / xpNeeded, '#af4');
    stY += 8 * sy;
  }

  // HP bar
  ctx.fillStyle = '#aaa';
  ctx.font = `${7 * sy}px monospace`;
  ctx.fillText(`ХП: ${player.hp ?? 0}/${player.maxHp ?? 100}`, stX, stY);
  stY += 10 * sy;
  drawStatBar(ctx, stX, stY, barW, 5 * sy, (player.hp ?? 0) / (player.maxHp ?? 100), '#e44');
  stY += 8 * sy;

  // PSI bar
  if (player.rpg) {
    ctx.fillStyle = '#a4f';
    ctx.font = `${7 * sy}px monospace`;
    ctx.fillText(`ПСИ: ${Math.round(player.rpg.psi)}/${player.rpg.maxPsi}`, stX, stY);
    stY += 10 * sy;
    drawStatBar(ctx, stX, stY, barW, 5 * sy, player.rpg.maxPsi > 0 ? player.rpg.psi / player.rpg.maxPsi : 0, '#a4f');
    stY += 8 * sy;
  }

  // Needs
  if (player.needs) {
    const needs: [string, number, string][] = [
      ['Еда', player.needs.food, '#8a4'],
      ['Вода', player.needs.water, '#48c'],
      ['Сон', player.needs.sleep, '#a8f'],
      ['Туалет', Math.max(0, 100 - player.needs.pee), '#da4'],
    ];
    for (const [label, val, color] of needs) {
      ctx.fillStyle = '#aaa';
      ctx.font = `${6 * sy}px monospace`;
      ctx.fillText(`${label}: ${Math.round(val)}`, stX, stY);
      stY += 7 * sy;
      drawStatBar(ctx, stX, stY, barW, 3 * sy, val / 100, color);
      stY += 6 * sy;
    }
  }

  stY += 4 * sy;
  stY = drawInventoryFinanceBlock(ctx, player, state, stX, stY, barW, sy, time, ch - 14 * sy);

  const zhelemishLine = zhelemishStatsLine(player, time);
  if (zhelemishLine) {
    stY += 3 * sy;
    ctx.fillStyle = '#9c6';
    ctx.font = `${6 * sy}px monospace`;
    ctx.fillText(fitStatText(ctx, zhelemishLine, barW), stX, stY);
    stY += 9 * sy;
  }

  // Equipped weapon info — compact facts, right side
  const contentBottom = ch - 8 * sy;
  stY += 4 * sy;
  const weapon = getWeaponReadiness(player);
  ctx.fillStyle = '#ccc';
  ctx.font = `${7 * sy}px monospace`;
  if (stY + 8 * sy <= contentBottom) {
    ctx.fillText(
      fitStatText(ctx, `Оружие: ${weapon.name}  ${weapon.role}  Урон:${weapon.damageLabel}`, barW),
      stX, stY,
    );
    stY += 9 * sy;
  }
  if (stY + 8 * sy <= contentBottom) {
    ctx.fillStyle = weapon.warning ? '#f84' : '#9d9';
    const weaponState = weapon.cannotFireReason
      ? `${weapon.resourceLabel}  ${weapon.cannotFireReason}`
      : `${weapon.resourceLabel}  ${weapon.cooldownLabel}`;
    ctx.fillText(fitStatText(ctx, weaponState, barW), stX, stY);
    stY += 12 * sy;
  }
  if (weapon.statLabel && stY + 8 * sy <= contentBottom) {
    ctx.fillStyle = '#8ad';
    ctx.fillText(fitStatText(ctx, weapon.statLabel, barW), stX, stY);
    stY += 9 * sy;
  }

  const toolName = player.tool ? (ITEMS[player.tool]?.name ?? player.tool) : 'нет';
  const toolDur = getEquippedToolDurability(player);
  const toolDurLabel = toolDur ? `${Math.max(0, Math.ceil(toolDur.cur))}/${toolDur.max}` : '--';
  if (stY + 8 * sy <= contentBottom) {
    ctx.fillStyle = '#8cf';
    ctx.fillText(fitStatText(ctx, `Инструмент: ${toolName}  Износ:${toolDurLabel}`, barW), stX, stY);
    stY += 12 * sy;
  }

  // Stats
  if (stY + 8 * sy <= contentBottom) {
    ctx.fillStyle = '#888';
    ctx.font = `${7 * sy}px monospace`;
    const day = Math.floor(state.clock.totalMinutes / 1440);
    ctx.fillText(fitStatText(ctx, `Выжил дней: ${day}  |  Самосборов: ${state.samosborCount}`, barW), stX, stY);
  }
}

function signedPct(mult: number): string {
  const pct = Math.round((mult - 1) * 100);
  return `${pct >= 0 ? '+' : ''}${pct}%`;
}

function reducedPct(mult: number): string {
  return `-${Math.max(0, Math.round((1 - mult) * 100))}%`;
}

function statDelta(current: RPGStatEffects, next: RPGStatEffects, key: keyof RPGStatEffects): string {
  const diff = next[key] - current[key];
  if (Math.abs(diff) < 0.005) return '';
  if (key === 'maxHp' || key === 'maxPsi') return `+${Math.round(diff)}`;
  return diff > 0 ? signedPct(next[key] / current[key]) : reducedPct(next[key] / current[key]);
}

function drawRpgEffectBlock(
  ctx: CanvasRenderingContext2D,
  player: Entity,
  x: number, y: number, w: number, sy: number,
): number {
  const rpg = player.rpg;
  if (!rpg) return y;
  const current = rpgStatEffects(rpg);
  const strNext = rpg.attrPoints > 0 ? rpgStatEffectsAfterSpend(rpg, 'str') : undefined;
  const agiNext = rpg.attrPoints > 0 ? rpgStatEffectsAfterSpend(rpg, 'agi') : undefined;
  const intNext = rpg.attrPoints > 0 ? rpgStatEffectsAfterSpend(rpg, 'int') : undefined;
  const suffix = (delta: string) => delta ? ` (${delta})` : '';
  const lines: [string, string][] = [
    [
      '#e84',
      `СИЛ HP ${current.maxHp}${suffix(strNext ? statDelta(current, strNext, 'maxHp') : '')}  ` +
      `ближ ${signedPct(current.meleeDamageMult)}  тяж ${reducedPct(current.heavyWeaponSpeedMult)}`,
    ],
    [
      '#4e8',
      `ЛОВ ход ${signedPct(current.moveSpeedMult)}  темп ${reducedPct(current.attackCooldownMult)}  ` +
      `разброс ${reducedPct(current.rangedSpreadMult)}${suffix(agiNext ? statDelta(current, agiNext, 'attackCooldownMult') : '')}`,
    ],
    [
      '#68f',
      `ИНТ ПСИ ${current.maxPsi}${suffix(intNext ? statDelta(current, intNext, 'maxPsi') : '')}  ` +
      `цена ${reducedPct(current.psiCostMult)}  контр ${signedPct(current.contractRewardMult)}  док ${signedPct(current.documentRewardMult)}`,
    ],
  ];

  ctx.font = `${6 * sy}px monospace`;
  for (const [color, line] of lines) {
    ctx.fillStyle = color;
    ctx.fillText(fitStatText(ctx, line, w), x, y);
    y += 7 * sy;
  }
  return y + 2 * sy;
}

function drawStatBar(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  pct: number, color: string,
): void {
  ctx.fillStyle = '#222';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * Math.max(0, Math.min(1, pct)), h);
}
