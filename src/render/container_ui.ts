/* ── Container interaction menu ──────────────────────────────── */

import { type Entity, type GameState } from '../core/types';
import { World } from '../core/world';
import { ITEMS } from '../data/catalog';
import { MAX_INVENTORY_SLOTS } from '../data/inventory_limits';
import { containerAccessInfo, containerItemActionInfo, containerTheftStatus } from '../systems/containers';
import { controlBindingLabel, menuCloseHint } from '../systems/controls';
import {
  itemValueDisplay,
  questItemStateColor,
  questItemStateLabel,
} from './economy_ui';
import { containerMenuGridLayout } from './ui_layout';
<<<<<<< HEAD
import { drawCenteredWrappedText, fitText } from './ui_text';
=======
import { drawNeuroPanel } from './hud_fx';
import { drawCenteredWrappedText, fitText, wrapTextLines } from './ui_text';
>>>>>>> origin/main
import { drawItemGridIcon } from './item_sprites';
import { PALETTE } from './ui_utils';

export function drawContainerMenu(
  ctx: CanvasRenderingContext2D,
  player: Entity,
  state: GameState,
  world: World,
  sx: number,
  sy: number,
): void {
  const container = world.containerById.get(state.containerMenuTarget);
  if (!container) return;

  const cw = ctx.canvas.width;
  const ch = ctx.canvas.height;
  const layout = containerMenuGridLayout(cw, ch);
  sx = layout.scale;
  sy = layout.scale;
  
  // Use unified VHS panel instead of basic fillRect with real time for animation
  drawNeuroPanel(ctx, 0, 0, cw, ch, performance.now() / 1000, 150);

  const gridCols = layout.cols;
  const gridRows = layout.rows;
  const cellSz = layout.cell;
  const gridTotal = layout.gridTotal;
  const totalW = layout.containerX - layout.startX + gridTotal;
  const startX = layout.startX;
  const startY = layout.startY;
  const containerX = layout.containerX;
  const playerInv = player.inventory ?? [];
  const containerInv = container.inventory;
  const access = containerAccessInfo(container, player, state);

  ctx.fillStyle = PALETTE.textMuted;
  ctx.font = `${8.2 * sy}px "Press Start 2P", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('КОНТЕЙНЕР', cw / 2, 10 * sy);
  ctx.textAlign = 'left';

  ctx.font = `${7.2 * sy}px "Press Start 2P", monospace`;
  ctx.fillStyle = PALETTE.warning;
  ctx.fillText(`Вы: ${playerInv.length}/${MAX_INVENTORY_SLOTS}`, startX, startY - 9 * sy);
  const columnW = gridTotal;
  const containerName = fitText(ctx, container.name, columnW * 0.85);
  ctx.fillStyle = access.canTake ? PALETTE.primary : PALETTE.danger;
  ctx.fillText(`${containerName}: ${containerInv.length}`, containerX, startY - 9 * sy);
<<<<<<< HEAD
  ctx.fillStyle = access.color;
  ctx.font = `${6.4 * sy}px monospace`;
  ctx.fillText(fitText(ctx, access.label, columnW), containerX, startY - 18 * sy);
  ctx.fillStyle = '#888';
  let infoY = startY + gridRows * cellSz + 34 * sy;
  ctx.fillText(fitText(ctx, access.detail, totalW), startX, infoY);
  const theftStatus = containerTheftStatus(container);
  if (theftStatus) {
    infoY += 9 * sy;
    ctx.fillStyle = theftStatus.color;
    ctx.fillText(fitText(ctx, `${theftStatus.label}: ${theftStatus.detail}`, totalW), startX, infoY);
=======
  
  let infoY = startY + 4 * sy;
  ctx.fillStyle = access.canTake ? PALETTE.primary : PALETTE.danger;
  ctx.font = `${7.2 * sy}px "Press Start 2P", monospace`;
  for (const line of wrapTextLines(ctx, access.label, layout.infoW)) {
    ctx.fillText(line, layout.infoX, infoY);
    infoY += 9 * sy;
  }
  infoY += 4 * sy;

  ctx.fillStyle = PALETTE.textMuted;
  ctx.font = `${6.4 * sy}px "Press Start 2P", monospace`;
  for (const line of wrapTextLines(ctx, access.detail, layout.infoW)) {
    ctx.fillText(line, layout.infoX, infoY);
    infoY += 8 * sy;
  }
  const theftStatus = containerTheftStatus(container);
  if (theftStatus) {
    infoY += 4 * sy;
    ctx.fillStyle = theftStatus.color === '#ff4444' ? PALETTE.danger : PALETTE.warning;
    for (const line of wrapTextLines(ctx, `${theftStatus.label}: ${theftStatus.detail}`, layout.infoW)) {
      ctx.fillText(line, layout.infoX, infoY);
      infoY += 8 * sy;
    }
>>>>>>> origin/main
  }
  if (container.tags.includes('production_output')) {
    const produced = container.lastProducedItemId ? ITEMS[container.lastProducedItemId]?.name ?? container.lastProducedItemId : '';
    const reason = container.productionBlockedReason === 'no_inputs'
      ? 'нет сырья'
      : container.productionBlockedReason === 'container_full'
        ? 'ящик полон'
        : 'нет ящика';
    const status = container.productionBlockedReason
      ? `Цех стоит: ${reason}`
      : produced
        ? `Цех: ${produced} x${container.lastProducedCount ?? 1}`
        : `Цех: ${container.factoryId ?? 'ожидает сырьё'}`;
<<<<<<< HEAD
    ctx.fillStyle = container.productionBlockedReason ? '#fa4' : '#8cf';
    ctx.fillText(fitText(ctx, status, totalW), startX, infoY + 9 * sy);
=======
    infoY += 4 * sy;
    ctx.fillStyle = container.productionBlockedReason ? PALETTE.warning : PALETTE.primary;
    for (const line of wrapTextLines(ctx, status, layout.infoW)) {
      ctx.fillText(line, layout.infoX, infoY);
      infoY += 8 * sy;
    }
>>>>>>> origin/main
  }

  const drawGrid = (inv: { defId: string; count: number }[], gx: number, side: 'player' | 'container') => {
    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        const idx = row * gridCols + col;
        const cx = gx + col * cellSz;
        const cy = startY + row * cellSz;
        const selected = state.containerSide === side && state.containerCursorX === col && state.containerCursorY === row;

        ctx.fillStyle = selected ? 'rgba(0, 255, 102, 0.15)' : 'rgba(8, 12, 16, 0.4)';
        ctx.fillRect(cx, cy, cellSz - 2, cellSz - 2);
        ctx.strokeStyle = selected ? PALETTE.primary : PALETTE.borderDark;
        ctx.lineWidth = selected ? 2 : 1;
        ctx.strokeRect(cx + 0.5, cy + 0.5, cellSz - 3, cellSz - 3);
        ctx.lineWidth = 1;
        
        // VHS Scanlines effect for cell background
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        for (let sl = 0; sl < cellSz - 2; sl += 3) {
          ctx.fillRect(cx, cy + sl, cellSz - 2, 1);
        }

        if (idx < inv.length) {
          const item = inv[idx];
          const def = ITEMS[item.defId];
          const value = itemValueDisplay(state, item.defId);
          const questLabel = questItemStateLabel(value.questState);
          const stolenHere = container.stolenItemIds?.includes(item.defId) === true;
          const ownerLabel = side === 'container'
            ? access.theft ? 'ЧУЖ' : access.canTake ? access.label.slice(0, 3) : 'ЗАМ'
            : stolenHere ? 'КРАД' : 'ВАШ';
          ctx.fillStyle = value.scarcityColor;
          ctx.fillRect(cx + 1 * sx, cy + 1 * sy, Math.max(1, 2 * sx), cellSz - 4 * sy);
          ctx.font = `${4.5 * sy}px "Press Start 2P", monospace`;
          ctx.fillStyle = side === 'player' && stolenHere ? '#f84' : side === 'container' ? access.color : '#ee4';
          ctx.fillText(ownerLabel, cx + 4 * sx, cy + 3 * sy);
          if (questLabel) {
            ctx.fillStyle = questItemStateColor(value.questState);
            ctx.textAlign = 'right';
            ctx.fillText(questLabel, cx + cellSz - 4 * sx, cy + 3 * sy);
            ctx.textAlign = 'left';
          }
          drawItemGridIcon(ctx, item.defId, def?.name ?? item.defId, cx, cy, cellSz, sx, sy, selected, selected ? 1 : 0.84, {
            nameYUnits: 8,
            iconTopUnits: 8.8,
            bottomReserveUnits: 5.4,
          });
          ctx.fillStyle = value.scarcityColor;
          ctx.font = `${4.8 * sy}px "Press Start 2P", monospace`;
          ctx.fillText(
            fitText(ctx, value.priceText, item.count > 1 ? cellSz - 18 * sx : cellSz - 6 * sx),
            cx + 4 * sx,
            cy + cellSz - 5 * sy,
          );
          if (item.count > 1) {
            ctx.fillStyle = '#8a8';
            ctx.font = `${4.8 * sy}px "Press Start 2P", monospace`;
            ctx.fillText(`x${item.count}`, cx + cellSz - 16 * sx, cy + cellSz - 5 * sy);
          }
        }
      }
    }
  };

  drawGrid(playerInv, startX, 'player');
  drawGrid(containerInv, containerX, 'container');

  const descY = startY + gridRows * cellSz + 8 * sy;
  const curIdx = state.containerCursorY * gridCols + state.containerCursorX;
  const curInv = state.containerSide === 'player' ? playerInv : containerInv;
  ctx.textAlign = 'center';
  if (curIdx < curInv.length) {
    const item = curInv[curIdx];
    const def = ITEMS[item.defId];
    ctx.fillStyle = '#ccc';
    ctx.font = `${7.3 * sy}px "Press Start 2P", monospace`;
    const descW = Math.min(cw - 16 * sx, totalW + 24 * sx);
    ctx.fillText(fitText(ctx, `${def?.name ?? item.defId} x${item.count}`, descW), cw / 2, descY);
    ctx.fillStyle = '#888';
    ctx.font = `${6.4 * sy}px "Press Start 2P", monospace`;
    let actionY = drawCenteredWrappedText(ctx, def?.desc ?? '', cw / 2, descY + 9 * sy, descW, 8 * sy, 2);
    const side = state.containerSide === 'player' ? 'player' : 'container';
    const actionInfo = containerItemActionInfo(container, player, side, item, state);
    const actionDetail = actionInfo.detail && (actionInfo.mode === 'steal' || actionInfo.mode === 'buy' || actionInfo.mode === 'unlock' || actionInfo.mode === 'service')
      ? actionInfo.detail
      : '';
    ctx.fillStyle = actionInfo.enabled ? actionInfo.color : '#f84';
    actionY = Math.min(actionY + 3 * sy, ch - 52 * sy);
    const value = itemValueDisplay(state, item.defId);
    ctx.fillStyle = value.scarcityColor;
    ctx.fillText(fitText(ctx, value.line, descW), cw / 2, actionY);
    ctx.fillStyle = '#888';
    ctx.fillText(fitText(ctx, actionDetail || value.detail, descW), cw / 2, actionY + 8 * sy);
    ctx.fillStyle = actionInfo.enabled ? actionInfo.color : '#f84';
    if (value.questState) {
      const questLabel = value.questState === 'target' ? 'Квестовая цель' : 'Квестовая награда';
      ctx.fillStyle = questItemStateColor(value.questState);
      ctx.fillText(fitText(ctx, questLabel, descW), cw / 2, actionY + 16 * sy);
      ctx.fillStyle = actionInfo.enabled ? actionInfo.color : '#f84';
      ctx.fillText(fitText(ctx, actionInfo.label, descW), cw / 2, Math.min(actionY + 24 * sy, ch - 34 * sy));
    } else {
      ctx.fillText(fitText(ctx, actionInfo.label, descW), cw / 2, Math.min(actionY + 16 * sy, ch - 34 * sy));
    }
  } else {
    ctx.fillStyle = '#7c8a93';
    ctx.font = `${6.4 * sy}px "Press Start 2P", monospace`;
    ctx.fillText('Пустой слот', cw / 2, descY + 6 * sy);
  }
  ctx.textAlign = 'left';

  ctx.fillStyle = '#7a93a0';
  ctx.font = `${5.8 * sy}px "Press Start 2P", monospace`;
  ctx.textAlign = 'right';
  const hintW = Math.max(60 * sx, cw - 16 * sx);
  ctx.fillText(fitText(ctx, `${controlBindingLabel('menuUp')}/${controlBindingLabel('menuDown')} - курсор`, hintW), cw - 8 * sx, ch - 24 * sy);
  ctx.fillText(fitText(ctx, `${controlBindingLabel('gameMenu')} - действие с предметом`, hintW), cw - 8 * sx, ch - 16 * sy);
  ctx.fillText(fitText(ctx, `${menuCloseHint()} - закрыть`, hintW), cw - 8 * sx, ch - 8 * sy);
  ctx.textAlign = 'left';
}
