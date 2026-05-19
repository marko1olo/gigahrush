/* ── Faction relations matrix (F key) ─────────────────────────── */

import { type Entity, Faction } from '../core/types';
import { getFactionRel } from '../data/relations';
import { drawNeuroPanel, drawGlitchText } from './hud_fx';
import { fitText } from './ui_text';

const MATRIX_LABELS = ['Игрок', 'Граждане', 'Ликвид.', 'Культ.', 'Учёные', 'Дикие'];
const MATRIX_FACTIONS = [Faction.PLAYER, Faction.CITIZEN, Faction.LIQUIDATOR, Faction.CULTIST, Faction.SCIENTIST, Faction.WILD];

export function drawFactionMenu(
  ctx: CanvasRenderingContext2D,
  _player: Entity,
  _entities: Entity[],
  sx: number, sy: number,
  time = 0,
): void {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const cols = MATRIX_LABELS.length; // 6

  // Fullscreen neuro-panel background
  ctx.fillStyle = '#00040a';
  ctx.fillRect(0, 0, w, h);
  drawNeuroPanel(ctx, 0, 0, w, h, time, 95);

  // Title
  drawGlitchText(ctx, 'ОТНОШЕНИЯ ФРАКЦИЙ', w / 2 - 80 * sx, 20 * sy, time, 950, '#0ca', 12 * sy);
  ctx.font = `bold ${12 * sy}px monospace`;
  ctx.textAlign = 'center';

  // Compute values directly from dynamic faction matrix
  const values: number[][] = [];
  for (let r = 0; r < cols; r++) {
    values[r] = [];
    for (let c = 0; c < cols; c++) {
      values[r][c] = getFactionRel(MATRIX_FACTIONS[r], MATRIX_FACTIONS[c]);
    }
  }

  // Layout: divide available space evenly
  const topY = 32 * sy;
  const botY = h - 16 * sy;
  const leftX = 4 * sx;
  const rightX = w - 4 * sx;
  const tableW = rightX - leftX;
  const tableH = botY - topY;
  const cellW = tableW / (cols + 1);
  const cellH = tableH / (cols + 1);
  const fontSize = Math.min(cellH * 0.55, cellW * 0.15, 10 * sy);
  const labelFontSize = Math.min(cellH * 0.5, cellW * 0.14, 9 * sy);

  // Column headers
  ctx.font = `bold ${labelFontSize}px monospace`;
  for (let c = 0; c < cols; c++) {
    const cx = leftX + (c + 1) * cellW + cellW / 2;
    const cy = topY + cellH / 2;
    ctx.fillStyle = c === 0 ? '#fff' : '#ccc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(fitText(ctx, MATRIX_LABELS[c], cellW * 0.95), cx, cy);
  }

  // Row headers + values
  for (let r = 0; r < cols; r++) {
    const ry = topY + (r + 1) * cellH + cellH / 2;

    // Row label
    ctx.fillStyle = r === 0 ? '#fff' : '#ccc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${labelFontSize}px monospace`;
    ctx.fillText(fitText(ctx, MATRIX_LABELS[r], cellW * 0.95), leftX + cellW / 2, ry);

    // Values
    ctx.font = `${fontSize}px monospace`;
    for (let c = 0; c < cols; c++) {
      const v = values[r][c];
      const cx = leftX + (c + 1) * cellW + cellW / 2;
      if (r === c) {
        ctx.fillStyle = '#555';
        ctx.fillText('—', cx, ry);
      } else {
        ctx.fillStyle = v >= 50 ? '#4f4' : v >= 0 ? '#cc4' : v >= -50 ? '#f84' : '#f44';
        ctx.fillText(String(v), cx, ry);
      }
    }

    // Grid line
    const lineY = topY + (r + 1) * cellH;
    ctx.strokeStyle = 'rgba(100,100,100,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(leftX, lineY);
    ctx.lineTo(rightX, lineY);
    ctx.stroke();
  }

  // Vertical grid lines
  for (let c = 1; c <= cols; c++) {
    const lx = leftX + c * cellW;
    ctx.beginPath();
    ctx.moveTo(lx, topY + cellH);
    ctx.lineTo(lx, botY);
    ctx.stroke();
  }

  // Hint
  ctx.fillStyle = '#555';
  ctx.font = `${8 * sy}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('[F] закрыть', w / 2, botY + 2 * sy);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
}
