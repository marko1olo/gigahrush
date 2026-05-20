/* ── NPC interaction menu ─────────────────────────────────────── */

import { type Entity, type GameState, Faction } from '../core/types';
import { ITEMS } from '../data/catalog';
import { FACTION_NAMES, OCCUPATION_NAMES } from '../data/relations';
import { questDeadlineText, questRemainingMinutes } from '../systems/quest_deadlines';
import { drawNeuroPanel, drawGlitchText, textJitter, flicker } from './hud_fx';
import { dialogMenuScale, tradeGridScale } from './ui_layout';
import { drawCenteredWrappedText, drawWrappedText, fitText } from './ui_text';
import {
  questItemStateColor,
  questItemStateLabel,
  tradeCellPriceDisplay,
  tradePriceDisplay,
} from './economy_ui';

export function drawNpcMenu(
  ctx: CanvasRenderingContext2D,
  player: Entity,
  state: GameState,
  entities: Entity[],
  sx: number, sy: number,
  uiTime = state.time,
): void {
  const npc = entities.find(e => e.id === state.npcMenuTarget);
  if (!npc) return;

  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const ds = dialogMenuScale(w, h, sx, sy);
  sx = ds;
  sy = ds;
  const pw = Math.min(440 * sx, w - 24 * sx);
  const ph = Math.min(320 * sy, h - 24 * sy);
  const px = (w - pw) / 2;
  const py = (h - ph) / 2;
  const time = uiTime;

  // Background — neuro-panel
  ctx.fillStyle = '#00040a';
  ctx.fillRect(px, py, pw, ph);
  drawNeuroPanel(ctx, px, py, pw, ph, time, 90);

  // NPC name header
  const fName = npc.faction !== undefined ? FACTION_NAMES[npc.faction as Faction] : '';
  const oName = npc.occupation !== undefined ? OCCUPATION_NAMES[npc.occupation] : '';
  ctx.font = `${10 * sy}px monospace`;
  drawGlitchText(ctx, fitText(ctx, npc.name ?? '???', pw - 16 * sx), px + 8 * sx, py + 10 * sy, time, 900, '#0fa', 10 * sy);
  ctx.fillStyle = '#688';
  ctx.font = `${7 * sy}px monospace`;
  const fj = textJitter(time, 901);
  ctx.fillText(fitText(ctx, `${fName} · ${oName}`, pw - 16 * sx), px + 8 * sx + fj.dx, py + 22 * sy + fj.dy);

  if (state.npcMenuTab === 'main') {
    // Main menu: Talk, Quest, Trade
    const items = ['Говорить', 'Задание', 'Торг'];
    ctx.font = `${10 * sy}px monospace`;
    for (let i = 0; i < items.length; i++) {
      const selected = i === state.npcMenuSel;
      const yy = py + 44 * sy + i * 20 * sy;
      const mj = textJitter(time, 910 + i);
      ctx.fillStyle = selected ? `rgba(0,255,170,${flicker(time, 920 + i)})` : '#688';
      ctx.fillText(`${selected ? '▶ ' : '  '}${items[i]}`, px + 16 * sx + mj.dx, yy + mj.dy);
    }
    ctx.fillStyle = '#456';
    ctx.font = `${8 * sy}px monospace`;
    ctx.fillText(fitText(ctx, 'W/S выбор  |  [E] выбрать  |  Enter закрыть', pw - 16 * sx), px + 8 * sx, py + ph - 11 * sy);

  } else if (state.npcMenuTab === 'talk') {
    // Talk: show procedural text
    ctx.fillStyle = '#ccc';
    ctx.font = `${9 * sy}px monospace`;
    const maxW = pw - 16 * sx;
    const maxLines = Math.max(1, Math.floor((py + ph - 26 * sy - (py + 40 * sy)) / (13 * sy)));
    drawWrappedText(ctx, state.npcTalkText, px + 8 * sx, py + 40 * sy, maxW, 13 * sy, maxLines);

    ctx.fillStyle = '#555';
    ctx.font = `${8 * sy}px monospace`;
    ctx.fillText('[E/Enter] назад', px + 8 * sx, py + ph - 11 * sy);

  } else if (state.npcMenuTab === 'quest') {
    // Quest tab: paginated, one quest per page with word wrap
    const active = state.quests.filter(q => !q.done);
    const total = active.length;
    ctx.font = `${9 * sy}px monospace`;
    if (total === 0) {
      ctx.fillStyle = '#888';
      ctx.fillText('Активных заданий нет.', px + 8 * sx, py + 40 * sy);
    } else {
      const page = Math.min(state.questPage, total - 1);
      const q = active[page];
      // Header: page indicator
      ctx.fillStyle = '#888';
      ctx.font = `${8 * sy}px monospace`;
      ctx.fillText(`${page + 1} / ${total}`, px + pw - 40 * sx, py + 10 * sy);
      // Quest giver
      ctx.fillStyle = '#8af';
      ctx.font = `${9 * sy}px monospace`;
      ctx.fillText(fitText(ctx, `От: ${q.giverName ?? '???'}`, pw - 16 * sx), px + 8 * sx, py + 38 * sy);
      // Quest description — word-wrapped
      ctx.fillStyle = '#dda';
      const maxW = pw - 16 * sx;
      let ly = py + 54 * sy;
      const maxLines = Math.max(1, Math.floor((py + ph - 42 * sy - ly) / (13 * sy)));
      ly = drawWrappedText(ctx, q.desc, px + 8 * sx, ly, maxW, 13 * sy, maxLines);
      // Progress for KILL quests
      if (q.killNeeded !== undefined) {
        ly += 4 * sy;
        ctx.fillStyle = '#aaa';
        ctx.fillText(`Прогресс: ${q.killCount ?? 0}/${q.killNeeded}`, px + 8 * sx, ly);
      }
      const remaining = questRemainingMinutes(q, state.clock.totalMinutes);
      if (remaining !== undefined) {
        ly += 12 * sy;
        ctx.fillStyle = remaining <= 120 ? '#f66' : remaining <= 360 ? '#fa6' : '#8cf';
        ctx.font = `${8 * sy}px monospace`;
        ctx.fillText(fitText(ctx, `Срок: ${questDeadlineText(q, state.clock.totalMinutes)}`, maxW), px + 8 * sx, ly);
      }
    }
    ctx.fillStyle = '#555';
    ctx.font = `${8 * sy}px monospace`;
    const hint = total > 1 ? '[W/S] листать  |  [E/Enter] назад' : '[E/Enter] назад';
    ctx.fillText(fitText(ctx, hint, pw - 16 * sx), px + 8 * sx, py + ph - 11 * sy);

  } else if (state.npcMenuTab === 'trade') {
    // ── Fullscreen trade: two 5×5 grids ──
    const cw = ctx.canvas.width;
    const ch = ctx.canvas.height;
    const gs = tradeGridScale(cw, ch);
    sx = gs;
    sy = gs;
    // Overdraw fullscreen background
    ctx.fillStyle = 'rgba(0,0,0,0.98)';
    ctx.fillRect(0, 0, cw, ch);

    const GRID = 5;
    const cellSz = 22 * sx;
    const gap = 24 * sx;               // gap between grids
    const gridTotal = GRID * cellSz;
    const totalW = gridTotal * 2 + gap;
    const startX = (cw - totalW) / 2;
    const startY = 28 * sy;

    const npcInv = npc.inventory ?? [];
    const plrInv = player.inventory ?? [];

    // ── Title (centered) ──
    ctx.fillStyle = '#aaa';
    ctx.font = `${9.5 * sy}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('ТОРГ', cw / 2, 10 * sy);
    ctx.textAlign = 'left';

    // ── Headers with money ──
    ctx.font = `${8.5 * sy}px monospace`;
    ctx.fillStyle = '#ee4';
    ctx.fillText(`Вы: ₽${player.money ?? 0}`, startX, startY - 8 * sy);
    ctx.fillStyle = '#8cf';
    ctx.fillText(
      fitText(ctx, `${npc.name?.split(' ')[0] ?? 'NPC'}: ₽${npc.money ?? 0}`, gridTotal),
      startX + gridTotal + gap, startY - 8 * sy,
    );

    // ── Draw grid helper ──
    const drawGrid = (inv: { defId: string; count: number }[], gx: number, side: 'player' | 'npc') => {
      for (let row = 0; row < GRID; row++) {
        for (let col = 0; col < GRID; col++) {
          const idx = row * GRID + col;
          const cx = gx + col * cellSz;
          const cy = startY + row * cellSz;
          const selected = state.tradeSide === side && state.tradeCursorX === col && state.tradeCursorY === row;

          ctx.fillStyle = selected ? 'rgba(120,120,50,0.5)' : 'rgba(30,30,30,0.8)';
          ctx.fillRect(cx, cy, cellSz - 2, cellSz - 2);
          ctx.strokeStyle = selected ? '#ee4' : '#444';
          ctx.strokeRect(cx, cy, cellSz - 2, cellSz - 2);

          if (idx < inv.length) {
            const item = inv[idx];
            const def = ITEMS[item.defId];
            const price = tradeCellPriceDisplay(state, npc, item.defId, side === 'npc' ? 'buy' : 'sell');
            const questLabel = questItemStateLabel(price.questState);
            ctx.fillStyle = price.scarcityColor;
            ctx.fillRect(cx + 1 * sx, cy + 1 * sy, Math.max(1, 2 * sx), cellSz - 4 * sy);
            ctx.font = `${4.5 * sy}px monospace`;
            ctx.fillStyle = side === 'npc' ? '#8cf' : '#ee4';
            ctx.fillText(side === 'npc' ? 'ПРОД' : 'ВАШ', cx + 4 * sx, cy + 3 * sy);
            if (questLabel) {
              ctx.fillStyle = questItemStateColor(price.questState);
              ctx.textAlign = 'right';
              ctx.fillText(questLabel, cx + cellSz - 4 * sx, cy + 3 * sy);
              ctx.textAlign = 'left';
            }
            ctx.fillStyle = selected ? '#ee4' : '#ccc';
            ctx.font = `${5.6 * sy}px monospace`;
            const name = fitText(ctx, def?.name ?? item.defId, cellSz - 4 * sx);
            ctx.fillText(name, cx + 2 * sx, cy + 10 * sy);
            ctx.fillStyle = price.color;
            ctx.font = `${4.8 * sy}px monospace`;
            ctx.fillText(
              fitText(ctx, price.text, item.count > 1 ? cellSz - 18 * sx : cellSz - 6 * sx),
              cx + 4 * sx,
              cy + cellSz - 5 * sy,
            );
            if (item.count > 1) {
              ctx.fillStyle = '#8a8';
              ctx.font = `${4.8 * sy}px monospace`;
              ctx.fillText(`×${item.count}`, cx + cellSz - 16 * sx, cy + cellSz - 5 * sy);
            }
          }
        }
      }
    };

    // Player grid (left), NPC grid (right)
    drawGrid(plrInv, startX, 'player');
    drawGrid(npcInv, startX + gridTotal + gap, 'npc');

    // ── Selected item description ──
    const descY = startY + GRID * cellSz + 6 * sy;
    const curIdx = state.tradeCursorY * GRID + state.tradeCursorX;
    const curInv = state.tradeSide === 'player' ? plrInv : npcInv;
    ctx.textAlign = 'center';
    if (curIdx < curInv.length) {
      const item = curInv[curIdx];
      const def = ITEMS[item.defId];
      if (def) {
        ctx.fillStyle = '#ccc';
        ctx.font = `${8.5 * sy}px monospace`;
        const descW = Math.min(cw - 16 * sx, totalW + 24 * sx);
        ctx.fillText(fitText(ctx, `${def.name} ×${item.count}`, descW), cw / 2, descY);
        ctx.fillStyle = '#888';
        ctx.font = `${7.4 * sy}px monospace`;
        let actionY = drawCenteredWrappedText(ctx, def.desc, cw / 2, descY + 10 * sy, descW, 9 * sy, 2);
        const price = tradePriceDisplay(state, player, npc, item.defId, state.tradeSide === 'npc' ? 'buy' : 'sell');
        ctx.fillStyle = price.color;
        actionY = Math.min(actionY + 2 * sy, ch - 50 * sy);
        ctx.fillText(fitText(ctx, price.line, descW), cw / 2, actionY);
        ctx.fillStyle = price.scarcityColor;
        ctx.fillText(fitText(ctx, price.detail, descW), cw / 2, actionY + 9 * sy);
        ctx.fillStyle = price.ok ? '#6a6' : '#f84';
        ctx.fillText(fitText(ctx, price.status, descW), cw / 2, Math.min(actionY + 18 * sy, ch - 32 * sy));
      }
    } else {
      ctx.fillStyle = '#555';
      ctx.font = `${7 * sy}px monospace`;
      ctx.fillText('Пусто', cw / 2, descY + 6 * sy);
    }
    ctx.textAlign = 'left';

    // ── Hint (bottom-right, stacked) ──
    ctx.fillStyle = '#555';
    ctx.font = `${6.5 * sy}px monospace`;
    ctx.textAlign = 'right';
    const hintW = Math.max(60 * sx, cw - 16 * sx);
    ctx.fillText(fitText(ctx, 'WASD курсор', hintW), cw - 8 * sx, ch - 24 * sy);
    ctx.fillText(fitText(ctx, 'E купить/продать', hintW), cw - 8 * sx, ch - 16 * sy);
    ctx.fillText(fitText(ctx, 'Enter назад', hintW), cw - 8 * sx, ch - 8 * sy);
    ctx.textAlign = 'left';
  }
}
