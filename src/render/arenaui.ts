import { controlBindingLabel, controlHint, menuCloseHint } from '../systems/controls';
import { drawGlitchText, drawNeuroPanel, drawStaticNoise, textJitter } from './hud_fx';
import { fitText } from './ui_text';

function rub(value: number): string {
  return `${Math.max(0, Math.floor(value))} руб.`;
}

export interface ArenaBetOverlaySnapshot {
  open: boolean;
  arenaId: string;
  combatant1Name: string;
  combatant1Level: number;
  combatant1Hp: number;
  combatant1HasWeapon: boolean;
  combatant2Name: string;
  combatant2Level: number;
  combatant2Hp: number;
  combatant2HasWeapon: boolean;
  cashRubles: number;
  betRubles: number;
  presetIndex: number;
  presets: readonly number[];
  selectedCombatant: 1 | 2;
  message: string;
  canSubmit: boolean;
  odds1: number;
  odds2: number;
}

export function drawArenaBetOverlay(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  time: number,
  game: ArenaBetOverlaySnapshot,
): void {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const s = Math.max(0.8, Math.min(2, Math.min(sx, sy)));
  const pad = 8 * s;
  const panelW = Math.min(w - 12 * s, 360 * s);
  const panelH = Math.min(h - 12 * s, 220 * s);
  const x = (w - panelW) * 0.5;
  const y = (h - panelH) * 0.5;
  const maxW = panelW - pad * 2;
  const jitter = textJitter(time * 1.4, 1550);

  ctx.save();
  ctx.fillStyle = 'rgba(3,0,0,0.82)';
  ctx.fillRect(0, 0, w, h);
  drawNeuroPanel(ctx, x, y, panelW, panelH, time, 1551);
  drawStaticNoise(ctx, x, y, panelW, panelH, time, 0.025);

  ctx.textBaseline = 'top';
  drawGlitchText(ctx, 'Арена ЖЭК: Ставки', x + pad, y + 10 * s, time, 1552, '#ffd36a', 12 * s);
  ctx.font = `${8 * s}px monospace`;
  ctx.fillStyle = '#a98';
  ctx.fillText(fitText(ctx, `Наличные: ${rub(game.cashRubles)}`, maxW), x + pad, y + 36 * s);

  ctx.fillStyle = game.selectedCombatant === 1 ? '#fff' : '#888';
  ctx.fillText(fitText(ctx, `Боец 1: ${game.combatant1Name} (Ур.${game.combatant1Level}) ${game.combatant1HasWeapon ? '[Оружие]' : ''} - Коэф: ${game.odds1}x`, maxW), x + pad, y + 54 * s);

  ctx.fillStyle = game.selectedCombatant === 2 ? '#fff' : '#888';
  ctx.fillText(fitText(ctx, `Боец 2: ${game.combatant2Name} (Ур.${game.combatant2Level}) ${game.combatant2HasWeapon ? '[Оружие]' : ''} - Коэф: ${game.odds2}x`, maxW), x + pad, y + 68 * s);

  ctx.font = `bold ${14 * s}px monospace`;
  ctx.fillStyle = game.canSubmit ? '#ffd36a' : '#ff7860';
  ctx.fillText(fitText(ctx, `Ставка: ${rub(game.betRubles)} (${game.selectedCombatant === 1 ? 'на Бойца 1' : 'на Бойца 2'})`, maxW), x + pad + jitter.dx, y + 96 * s + jitter.dy);

  ctx.font = `${8 * s}px monospace`;
  ctx.fillStyle = game.canSubmit ? '#8f8' : '#f86';
  const stakeLine = game.canSubmit
      ? 'Арена принимает ставку.'
      : 'Наличных не хватает.';
  ctx.fillText(fitText(ctx, stakeLine, maxW), x + pad, y + 120 * s);
  if (game.message) {
    ctx.fillStyle = '#d7f7ff';
    ctx.fillText(fitText(ctx, game.message, maxW), x + pad, y + 137 * s);
  }

  ctx.fillStyle = '#6d6670';
  ctx.font = `${7 * s}px monospace`;
  ctx.fillText(fitText(ctx, `${controlBindingLabel('menuUp')}/${controlBindingLabel('menuDown')} боец  ${controlBindingLabel('menuLeft')}/${controlBindingLabel('menuRight')} ставка  ${controlHint('gameMenu')} подтвердить  ${menuCloseHint()} выйти`, maxW), x + pad, y + panelH - 16 * s);
  ctx.restore();
}
