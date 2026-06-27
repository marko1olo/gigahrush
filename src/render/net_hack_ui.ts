import { type NetHackOverlaySnapshot } from '../systems/net_hack';
import { controlHint, menuCloseHint } from '../systems/controls';
import { drawGlitchText, drawNeuroPanel, drawStaticNoise, textJitter } from './hud_fx';
import { fitText } from './ui_text';
import { drawShadowText, getUiFont } from './ui_font';



export function drawNetHackOverlay(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  time: number,
  hack: NetHackOverlaySnapshot,
): void {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const s = Math.max(0.8, Math.min(2, Math.min(sx, sy)));
  const pad = 8 * s;
  const panelW = Math.min(w - 12 * s, 334 * s);
  const panelH = Math.min(h - 12 * s, 188 * s);
  const x = (w - panelW) * 0.5;
  const y = (h - panelH) * 0.5;
  const maxW = panelW - pad * 2;
  const jitter = textJitter(time * 1.8, 1680);

  ctx.save();
  ctx.fillStyle = 'rgba(0,0,8,0.86)';
  ctx.fillRect(0, 0, w, h);
  drawNeuroPanel(ctx, x, y, panelW, panelH, time, 1681);
  drawStaticNoise(ctx, x, y, panelW, panelH, time, 0.038);

  ctx.textBaseline = 'top';
  drawGlitchText(ctx, hack.label, x + pad, y + 10 * s, time, 1682, '#63f6ff', 12 * s);
  ctx.font = getUiFont(8 * s, false);
  ctx.fillStyle = '#8ca0a8';
  drawShadowText(ctx, fitText(ctx, `Навык ${hack.skill} / сложность ${hack.difficulty}`, maxW), x + pad, y + 38 * s);

  ctx.font = getUiFont(15 * s, true);
  ctx.fillStyle = hack.locked ? '#ff7860' : hack.solved ? '#8f8' : '#63f6ff';
  const status = hack.locked ? 'БЛОКИРОВКА' : hack.solved ? 'ДОСТУП ОТКРЫТ' : `ШАНС ${hack.chancePercent}%`;
  drawShadowText(ctx, fitText(ctx, status, maxW), x + pad + jitter.dx, y + 66 * s + jitter.dy);

  ctx.font = getUiFont(8 * s, false);
  ctx.fillStyle = '#9fb8bd';
  drawShadowText(ctx, fitText(ctx, `Успех: деньги, архивный доступ, координатный след. Награда ${hack.rewardRubles} руб.`, maxW), x + pad, y + 98 * s);
  ctx.fillStyle = '#b88';
  drawShadowText(ctx, fitText(ctx, 'Ошибка: ПСИ-удар, тревожный сигнал и временная блокировка.', maxW), x + pad, y + 113 * s);
  if (hack.message) {
    ctx.fillStyle = '#d7f7ff';
    drawShadowText(ctx, fitText(ctx, hack.message, maxW), x + pad, y + 134 * s);
  }

  ctx.fillStyle = '#547078';
  ctx.font = getUiFont(7 * s, false);
  drawShadowText(ctx, fitText(ctx, `${controlHint('gameMenu')} взломать  ${menuCloseHint()} закрыть`, maxW), x + pad, y + panelH - 16 * s);
  ctx.restore();
}
