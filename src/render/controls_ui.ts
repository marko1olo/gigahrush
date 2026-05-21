import { type GameState } from '../core/types';
import {
  CONTROL_ACTIONS,
  controlBindingLabel,
  controlHint,
  getControlCaptureAction,
} from '../systems/controls';
import { drawNeuroPanel, drawGlitchText, flicker, textJitter } from './hud_fx';
import { fitText } from './ui_text';

export function drawControlsMenu(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  sx: number,
  sy: number,
  uiTime = state.time,
): void {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const time = uiTime;
  const rowH = 12 * sy;
  const top = 34 * sy;
  const bottom = h - 24 * sy;
  const visible = Math.max(4, Math.floor((bottom - top) / rowH));
  const maxScroll = Math.max(0, CONTROL_ACTIONS.length - visible);
  const scroll = Math.max(0, Math.min(maxScroll, state.controlScroll));
  const selected = Math.max(0, Math.min(CONTROL_ACTIONS.length - 1, state.controlSel));
  const capture = getControlCaptureAction();
  const prevTextBaseline = ctx.textBaseline;

  ctx.fillStyle = '#00040a';
  ctx.fillRect(0, 0, w, h);
  drawNeuroPanel(ctx, 4 * sx, 4 * sy, w - 8 * sx, h - 8 * sy, time, 1140);

  ctx.textBaseline = 'alphabetic';
  const titleJ = textJitter(time, 1141);
  drawGlitchText(ctx, 'ГОРЯЧИЕ КЛАВИШИ', 12 * sx + titleJ.dx, 12 * sy + titleJ.dy, time, 1142, '#6cf', 11 * sy);
  ctx.font = `${7 * sy}px monospace`;
  ctx.fillStyle = '#577';
  ctx.fillText(
    fitText(ctx, `${controlHint('controlsMenu')} открыть/закрыть  |  ${controlHint('interact')} изменить  |  ${controlHint('controlReset')} сбросить  |  ${controlHint('gameMenu')} закрыть`, w - 24 * sx),
    12 * sx,
    25 * sy,
  );

  const x = 10 * sx;
  const groupW = Math.min(86 * sx, w * 0.24);
  const keyW = Math.min(150 * sx, w * 0.38);
  const labelW = Math.max(40 * sx, w - x * 2 - groupW - keyW - 12 * sx);

  ctx.font = `${7 * sy}px monospace`;
  ctx.fillStyle = '#345';
  ctx.fillText('РАЗДЕЛ', x + 14 * sx, top - 7 * sy);
  ctx.fillText('ДЕЙСТВИЕ', x + groupW + 18 * sx, top - 7 * sy);
  ctx.fillText('КЛАВИШИ', x + groupW + labelW + 20 * sx, top - 7 * sy);

  ctx.textBaseline = 'middle';
  for (let row = 0; row < visible; row++) {
    const i = scroll + row;
    if (i >= CONTROL_ACTIONS.length) break;
    const action = CONTROL_ACTIONS[i];
    const rowY = top + row * rowH;
    const textY = rowY + rowH * 0.5;
    const isSel = i === selected;
    const isCapture = capture === action.id;

    if (isSel) {
      ctx.fillStyle = `rgba(0,90,78,${0.46 + 0.12 * flicker(time, 1145 + i)})`;
      ctx.fillRect(x - 2 * sx, rowY, w - x * 2 + 4 * sx, rowH);
      ctx.strokeStyle = isCapture ? '#fd6' : 'rgba(0,255,190,0.46)';
      ctx.strokeRect(x - 2 * sx + 0.5, rowY + 0.5, w - x * 2 + 4 * sx - 1, rowH - 1);
    }

    ctx.fillStyle = isSel ? '#0fa' : '#6a8';
    ctx.fillText(isSel ? '▶' : ' ', x, textY);
    ctx.fillStyle = '#689';
    ctx.fillText(fitText(ctx, action.group, groupW - 10 * sx), x + 14 * sx, textY);
    ctx.fillStyle = isSel ? '#dff' : '#9bb';
    ctx.fillText(fitText(ctx, action.label, labelW - 8 * sx), x + groupW + 18 * sx, textY);
    ctx.fillStyle = isCapture ? '#fd6' : isSel ? '#fff' : '#9cb';
    const keys = isCapture ? 'НАЖМИТЕ КЛАВИШУ...' : controlBindingLabel(action.id);
    ctx.fillText(fitText(ctx, keys, keyW - 4 * sx), x + groupW + labelW + 20 * sx, textY);
  }

  if (CONTROL_ACTIONS.length > visible) {
    const barX = w - 10 * sx;
    const barY = top;
    const barH = visible * rowH;
    const thumbH = Math.max(8 * sy, barH * (visible / CONTROL_ACTIONS.length));
    const thumbY = barY + (barH - thumbH) * (scroll / Math.max(1, maxScroll));
    ctx.fillStyle = '#123';
    ctx.fillRect(barX, barY, 3 * sx, barH);
    ctx.fillStyle = '#587';
    ctx.fillRect(barX, thumbY, 3 * sx, thumbH);
  }

  ctx.fillStyle = capture ? '#fd6' : '#456';
  ctx.font = `${7 * sy}px monospace`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(
    capture
      ? 'Esc отменит ввод. Backspace вернёт выбранное действие к умолчанию.'
      : 'Бинды хранятся отдельно от сохранения игры и применяются сразу.',
    12 * sx,
    h - 10 * sy,
  );
  ctx.textBaseline = prevTextBaseline;
}
