/* ── Container interaction menu ──────────────────────────────── */

import { type Entity, type GameState } from '../core/types';
import { World } from '../core/world';
import { ITEMS } from '../data/catalog';
import { containerAccessInfo, containerTheftStatus } from '../systems/containers';
import { containerGridScale } from './ui_layout';
import { drawCenteredWrappedText, fitText } from './ui_text';

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
  const gs = containerGridScale(cw, ch);
  sx = gs;
  sy = gs;
  ctx.fillStyle = 'rgba(0,0,0,0.98)';
  ctx.fillRect(0, 0, cw, ch);

  const GRID = 5;
  const cellSz = 22 * sx;
  const gap = 24 * sx;
  const gridTotal = GRID * cellSz;
  const totalW = gridTotal * 2 + gap;
  const startX = (cw - totalW) / 2;
  const startY = 30 * sy;
  const containerX = startX + gridTotal + gap;
  const playerInv = player.inventory ?? [];
  const containerInv = container.inventory;
  const access = containerAccessInfo(container, player);

  ctx.fillStyle = '#aaa';
  ctx.font = `${9.5 * sy}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('КОНТЕЙНЕР', cw / 2, 10 * sy);
  ctx.textAlign = 'left';

  ctx.font = `${8.5 * sy}px monospace`;
  ctx.fillStyle = '#ee4';
  ctx.fillText(`Вы: ${playerInv.length}/25`, startX, startY - 9 * sy);
  const columnW = gridTotal;
  const containerName = fitText(ctx, container.name, columnW * 0.85);
  ctx.fillStyle = access.color;
  ctx.fillText(`${containerName}: ${containerInv.length}/${container.capacitySlots}`, containerX, startY - 9 * sy);
  ctx.fillStyle = access.color;
  ctx.font = `${7.4 * sy}px monospace`;
  ctx.fillText(fitText(ctx, access.label, columnW), containerX, startY - 18 * sy);
  ctx.fillStyle = '#888';
  let infoY = startY + GRID * cellSz + 36 * sy;
  ctx.fillText(fitText(ctx, access.detail, totalW), startX, infoY);
  const theftStatus = containerTheftStatus(container);
  if (theftStatus) {
    infoY += 9 * sy;
    ctx.fillStyle = theftStatus.color;
    ctx.fillText(fitText(ctx, `${theftStatus.label}: ${theftStatus.detail}`, totalW), startX, infoY);
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
    ctx.fillStyle = container.productionBlockedReason ? '#fa4' : '#8cf';
    ctx.fillText(fitText(ctx, status, totalW), startX, infoY + 9 * sy);
  }

  const drawGrid = (inv: { defId: string; count: number }[], gx: number, side: string) => {
    for (let row = 0; row < GRID; row++) {
      for (let col = 0; col < GRID; col++) {
        const idx = row * GRID + col;
        const cx = gx + col * cellSz;
        const cy = startY + row * cellSz;
        const selected = state.containerSide === side && state.containerCursorX === col && state.containerCursorY === row;

        ctx.fillStyle = selected ? 'rgba(80,120,110,0.55)' : 'rgba(30,30,30,0.82)';
        ctx.fillRect(cx, cy, cellSz - 2, cellSz - 2);
        ctx.strokeStyle = selected ? '#0fa' : '#444';
        ctx.strokeRect(cx, cy, cellSz - 2, cellSz - 2);

        if (idx < inv.length) {
          const item = inv[idx];
          const def = ITEMS[item.defId];
          ctx.fillStyle = selected ? '#0fa' : '#ccc';
          ctx.font = `${5.6 * sy}px monospace`;
          ctx.fillText(fitText(ctx, def?.name ?? item.defId, cellSz - 4 * sx), cx + 2 * sx, cy + 10 * sy);
          if (item.count > 1) {
            ctx.fillStyle = '#8a8';
            ctx.font = `${4.8 * sy}px monospace`;
            ctx.fillText(`x${item.count}`, cx + cellSz - 16 * sx, cy + cellSz - 5 * sy);
          }
        }
      }
    }
  };

  drawGrid(playerInv, startX, 'player');
  drawGrid(containerInv, containerX, 'container');

  const descY = startY + GRID * cellSz + 8 * sy;
  const curIdx = state.containerCursorY * GRID + state.containerCursorX;
  const curInv = state.containerSide === 'player' ? playerInv : containerInv;
  ctx.textAlign = 'center';
  if (curIdx < curInv.length) {
    const item = curInv[curIdx];
    const def = ITEMS[item.defId];
    ctx.fillStyle = '#ccc';
    ctx.font = `${8.5 * sy}px monospace`;
    const descW = Math.min(cw - 16 * sx, totalW + 24 * sx);
    ctx.fillText(fitText(ctx, `${def?.name ?? item.defId} x${item.count}`, descW), cw / 2, descY);
    ctx.fillStyle = '#888';
    ctx.font = `${7.4 * sy}px monospace`;
    let actionY = drawCenteredWrappedText(ctx, def?.desc ?? '', cw / 2, descY + 10 * sy, descW, 9 * sy, 2);
    const action = state.containerSide === 'container'
      ? access.canTake ? access.theft ? '[E] украсть' : '[E] взять' : 'нет доступа'
      : access.canPut ? '[E] положить' : 'нет доступа';
    ctx.fillStyle = state.containerSide === 'container' && access.theft ? '#f84' : access.color;
    actionY = Math.min(actionY + 3 * sy, ch - 34 * sy);
    ctx.fillText(action, cw / 2, actionY);
  } else {
    ctx.fillStyle = '#555';
    ctx.font = `${7.4 * sy}px monospace`;
    ctx.fillText('Пустой слот', cw / 2, descY + 6 * sy);
  }
  ctx.textAlign = 'left';

  ctx.fillStyle = '#555';
  ctx.font = `${6.5 * sy}px monospace`;
  ctx.textAlign = 'right';
  ctx.fillText('W/S/стрелки - курсор', cw - 8 * sx, ch - 24 * sy);
  ctx.fillText('E - перенести 1 предмет', cw - 8 * sx, ch - 16 * sy);
  ctx.fillText('ENTER - закрыть', cw - 8 * sx, ch - 8 * sy);
  ctx.textAlign = 'left';
}
