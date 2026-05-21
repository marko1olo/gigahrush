/* ── Game menu (ESC) ──────────────────────────────────────────── */

import { type GameState } from '../core/types';
import { controlBindingLabel } from '../systems/controls';
import { drawNeuroPanel, textJitter, flicker } from './hud_fx';
import { fitText } from './ui_text';

export function drawGameMenu(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  _sx: number, sy: number,
  uiTime = state.time,
): void {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const time = uiTime;

  // Darken background
  ctx.fillStyle = 'rgba(0,0,4,0.85)';
  ctx.fillRect(0, 0, w, h);

  // Panel
  const pw = Math.min(w - 16 * _sx, 240 * _sx), ph = Math.min(h - 16 * sy, 160 * sy);
  const px = (w - pw) / 2;
  const py = (h - ph) / 2;
  drawNeuroPanel(ctx, px, py, pw, ph, time, 70);

  // Title
  ctx.save();
  ctx.shadowColor = 'rgba(200,0,0,0.5)';
  ctx.shadowBlur = 10;
  const tj = textJitter(time, 700);
  ctx.fillStyle = `rgba(200,0,0,${flicker(time, 701)})`;
  ctx.font = `bold ${20 * sy}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('ГИГАХРУЩ', w / 2 + tj.dx, py + 20 * sy + tj.dy);
  ctx.shadowBlur = 0;
  ctx.restore();

  // Menu items
  const items = ['Продолжить', 'Новая игра', 'Сохранить', 'Загрузить'];
  ctx.font = `${10 * sy}px monospace`;
  ctx.textAlign = 'center';
  for (let i = 0; i < items.length; i++) {
    const selected = i === state.menuSel;
    const yy = py + 60 * sy + i * 20 * sy;
    const mj = textJitter(time, 710 + i);
    const alpha = flicker(time, 720 + i);
    ctx.fillStyle = selected ? `rgba(0,255,170,${alpha})` : `rgba(100,136,136,${alpha})`;
    ctx.fillText(`${selected ? '▶ ' : '  '}${items[i]}`, w / 2 + mj.dx, yy + mj.dy);
  }

  ctx.fillStyle = '#456';
  ctx.font = `${7 * sy}px monospace`;
  ctx.fillText(
    fitText(ctx, `${controlBindingLabel('menuUp')}/${controlBindingLabel('menuDown')} — выбор  |  ${controlBindingLabel('interact')} — подтвердить  |  ${controlBindingLabel('gameMenu')} — закрыть`, pw - 12 * _sx),
    w / 2,
    py + ph - 10 * sy,
  );

  ctx.textAlign = 'left';
}
