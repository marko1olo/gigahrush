/* ── Game menu (Enter) ────────────────────────────────────────── */

import { type GameState } from '../core/types';
import { GAME_MENU_ITEMS } from '../systems/game_menu';
import { isPlatformAudioMuted } from '../systems/platform_bridge';
import { controlBindingLabel, menuCloseHint } from '../systems/controls';
import { drawNeuroPanel, textJitter, flicker } from './hud_fx';
import { fitText } from './ui_text';
import { PALETTE } from './ui_utils';

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
  ctx.fillStyle = PALETTE.bgPanelSolid;
  ctx.fillRect(0, 0, w, h);

  // Panel
  const itemStep = 16 * sy;
  const pw = Math.min(w - 16 * _sx, 240 * _sx);
  const ph = Math.min(h - 16 * sy, Math.max(160 * sy, 80 * sy + GAME_MENU_ITEMS.length * itemStep));
  const px = (w - pw) / 2;
  const py = (h - ph) / 2;
  drawNeuroPanel(ctx, px, py, pw, ph, time, 70);

  // Title
  ctx.save();
  ctx.shadowColor = 'rgba(255, 51, 51, 0.5)';
  ctx.shadowBlur = 10;
  const tj = textJitter(time, 700);
  ctx.fillStyle = `rgba(255, 51, 51,${flicker(time, 701)})`;
  ctx.font = `bold ${20 * sy}px "Press Start 2P", monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('ГИГАХРУЩ', w / 2 + tj.dx, py + 20 * sy + tj.dy);
  ctx.shadowBlur = 0;
  ctx.restore();

  // Menu items
  ctx.font = `${9 * sy}px "Press Start 2P", monospace`;
  ctx.textAlign = 'center';
  for (let i = 0; i < GAME_MENU_ITEMS.length; i++) {
    const selected = i === state.menuSel;
    const yy = py + 52 * sy + i * itemStep;
    const mj = textJitter(time, 710 + i);
    const alpha = flicker(time, 720 + i);
<<<<<<< HEAD
    let label: string = GAME_MENU_ITEMS[i].label;
    if (GAME_MENU_ITEMS[i].id === 'sound') {
      label = isPlatformAudioMuted() ? 'Звук: Выкл' : 'Звук: Вкл';
    }
    ctx.fillStyle = selected ? `rgba(0,255,170,${alpha})` : `rgba(100,136,136,${alpha})`;
=======
    const label: string = GAME_MENU_ITEMS[i].label;
    ctx.fillStyle = selected ? `rgba(0,255,102,${alpha})` : PALETTE.textMuted;
>>>>>>> origin/main
    ctx.fillText(`${selected ? '▶ ' : '  '}${label}`, w / 2 + mj.dx, yy + mj.dy);
  }

  ctx.fillStyle = '#7a93a0';
  ctx.font = `${7 * sy}px "Press Start 2P", monospace`;
  ctx.fillText(
    fitText(ctx, `${controlBindingLabel('controlsMenu')} — клавиши  |  ${controlBindingLabel('menuUp')}/${controlBindingLabel('menuDown')} — выбор  |  ${controlBindingLabel('gameMenu')} — подтвердить  |  ${menuCloseHint()} — закрыть`, pw - 12 * _sx),
    w / 2,
    py + ph - 10 * sy,
  );

  ctx.textAlign = 'left';
}
