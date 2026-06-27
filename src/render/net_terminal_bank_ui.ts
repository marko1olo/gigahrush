import { type NetTerminalBankSnapshot } from '../systems/net_terminal_gen';
import { controlBindingLabel, controlHint, menuCloseHint } from '../systems/controls';
import { drawGlitchText, drawNeuroPanel, drawStaticNoise, textJitter } from './hud_fx';
import { fitText } from './ui_text';
import { drawShadowText, getUiFont } from './ui_font';



function money(value: number): string {
  return `${Math.max(0, Math.floor(value))} руб.`;
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  value: string,
  maxW: number,
  tint: string,
): void {
  ctx.fillStyle = '#8ca0a8';
  drawShadowText(ctx, fitText(ctx, label, maxW * 0.42), x, y);
  ctx.textAlign = 'right';
  ctx.fillStyle = tint;
  drawShadowText(ctx, fitText(ctx, value, maxW * 0.55), x + maxW, y);
  ctx.textAlign = 'left';
}

export function drawNetTerminalBank(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  time: number,
  bank: NetTerminalBankSnapshot,
): void {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const s = Math.max(0.8, Math.min(2, Math.min(sx, sy)));
  const pad = 8 * s;
  const panelW = Math.min(w - 12 * s, 340 * s);
  const panelH = Math.min(h - 12 * s, 204 * s);
  const x = (w - panelW) * 0.5;
  const y = (h - panelH) * 0.5;
  const maxTextW = panelW - pad * 2;

  ctx.save();
  ctx.fillStyle = 'rgba(0,5,8,0.84)';
  ctx.fillRect(0, 0, w, h);
  drawNeuroPanel(ctx, x, y, panelW, panelH, time, 1240);
  drawStaticNoise(ctx, x, y, panelW, panelH, time, 0.026);

  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  drawGlitchText(ctx, 'НЕТ-БАНК', x + pad, y + 10 * s, time, 1241, '#63f6ff', 12 * s);
  ctx.textAlign = 'right';
  ctx.font = getUiFont(7 * s, false);
  ctx.fillStyle = '#55727a';
  drawShadowText(ctx,
    fitText(ctx, bank.terminalIdx >= 0 ? `IDX ${bank.terminalIdx}` : bank.terminalLabel, 92 * s),
    x + panelW - pad,
    y + 13 * s,
  );
  ctx.textAlign = 'left';

  ctx.font = getUiFont(8 * s, false);
  let ly = y + 38 * s;
  const lineH = 13 * s;
  drawLine(ctx, x + pad, ly, 'Нал', money(bank.cashRubles), maxTextW, '#d8f0d0');
  ly += lineH;
  drawLine(ctx, x + pad, ly, 'Счёт', money(bank.accountRubles), maxTextW, '#8fdcff');
  ly += lineH;
  drawLine(ctx, x + pad, ly, 'Депозит', money(bank.depositRubles), maxTextW, '#f0d27a');
  ly += lineH;
  drawLine(ctx, x + pad, ly, 'Долг', money(bank.debtRubles), maxTextW, bank.debtRubles > 0 ? '#ff8a70' : '#789098');

  const actionY = y + 100 * s;
  ctx.strokeStyle = 'rgba(99,246,255,0.28)';
  ctx.lineWidth = Math.max(1, s);
  ctx.beginPath();
  ctx.moveTo(x + pad, actionY - 9 * s);
  ctx.lineTo(x + panelW - pad, actionY - 9 * s);
  ctx.stroke();

  const jitter = textJitter(time * 1.5, 1242);
  ctx.font = getUiFont(11 * s, true);
  ctx.fillStyle = bank.canSubmit ? '#63f6ff' : '#ff8a70';
  drawShadowText(ctx,
    fitText(ctx, `${bank.actionLabel}: ${bank.presetLabel}`, maxTextW),
    x + pad + jitter.dx,
    actionY + jitter.dy,
  );

  ctx.font = getUiFont(8 * s, false);
  ctx.fillStyle = '#aab8bd';
  drawShadowText(ctx, fitText(ctx, `Сумма: ${money(bank.amountRubles)}`, maxTextW), x + pad, actionY + 18 * s);
  ctx.fillStyle = bank.canSubmit ? '#6f8' : '#f86';
  drawShadowText(ctx, fitText(ctx, bank.canSubmit ? 'Готово.' : 'Мало средств.', maxTextW), x + pad, actionY + 31 * s);

  if (bank.message) {
    ctx.fillStyle = '#d7f7ff';
    drawShadowText(ctx, fitText(ctx, bank.message, maxTextW), x + pad, actionY + 48 * s);
  }

  ctx.fillStyle = '#59717a';
  ctx.font = getUiFont(7 * s, false);
  drawShadowText(ctx, fitText(ctx, `${controlBindingLabel('menuUp')}/${controlBindingLabel('menuDown')} действие  ${controlBindingLabel('menuLeft')}/${controlBindingLabel('menuRight')} сумма  ${controlHint('gameMenu')} выполнить  ${menuCloseHint()} закрыть`, maxTextW), x + pad, y + panelH - 16 * s);
  ctx.restore();
}
