/* ── Faction relations matrix (F key) ─────────────────────────── */

import { type Entity, Faction, ZoneFaction } from '../core/types';
import { getFactionRel } from '../data/relations';
import { getFactionUiSnapshot, type FactionUiSnapshot } from '../systems/factions';
import { drawNeuroPanel, drawGlitchText } from './hud_fx';
import { fitText } from './ui_text';

const MATRIX_LABELS = ['Игрок', 'Граждане', 'Ликвид.', 'Культ.', 'Учёные', 'Дикие'];
const MATRIX_FACTIONS = [Faction.PLAYER, Faction.CITIZEN, Faction.LIQUIDATOR, Faction.CULTIST, Faction.SCIENTIST, Faction.WILD];
const ZONE_FACTION_NAMES: Record<ZoneFaction, string> = {
  [ZoneFaction.CITIZEN]: 'Граждане',
  [ZoneFaction.LIQUIDATOR]: 'Ликвидаторы',
  [ZoneFaction.CULTIST]: 'Культ',
  [ZoneFaction.SAMOSBOR]: 'Самосбор',
  [ZoneFaction.WILD]: 'Дикие',
};
const ZONE_FACTION_COLORS: Record<ZoneFaction, string> = {
  [ZoneFaction.CITIZEN]: '#4abe91',
  [ZoneFaction.LIQUIDATOR]: '#5b9eee',
  [ZoneFaction.CULTIST]: '#bc59ff',
  [ZoneFaction.SAMOSBOR]: '#e64e5c',
  [ZoneFaction.WILD]: '#e0a745',
};

function eventColor(severity: number): string {
  return severity >= 5 ? '#f35' : severity >= 4 ? '#fa4' : severity >= 3 ? '#fc6' : '#8cf';
}

function drawRelationMatrix(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  sy: number,
): void {
  const cols = MATRIX_LABELS.length;
  const cellW = w / (cols + 1);
  const cellH = h / (cols + 1);
  const fontSize = Math.min(cellH * 0.55, cellW * 0.15, 10 * sy);
  const labelFontSize = Math.min(cellH * 0.5, cellW * 0.14, 9 * sy);

  ctx.strokeStyle = 'rgba(100,100,100,0.3)';
  ctx.lineWidth = 1;
  ctx.font = `bold ${labelFontSize}px monospace`;
  for (let c = 0; c < cols; c++) {
    const cx = x + (c + 1) * cellW + cellW / 2;
    const cy = y + cellH / 2;
    ctx.fillStyle = c === 0 ? '#fff' : '#ccc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(fitText(ctx, MATRIX_LABELS[c], cellW * 0.95), cx, cy);
  }

  for (let r = 0; r < cols; r++) {
    const ry = y + (r + 1) * cellH + cellH / 2;
    ctx.fillStyle = r === 0 ? '#fff' : '#ccc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${labelFontSize}px monospace`;
    ctx.fillText(fitText(ctx, MATRIX_LABELS[r], cellW * 0.95), x + cellW / 2, ry);

    ctx.font = `${fontSize}px monospace`;
    for (let c = 0; c < cols; c++) {
      const v = getFactionRel(MATRIX_FACTIONS[r], MATRIX_FACTIONS[c]);
      const cx = x + (c + 1) * cellW + cellW / 2;
      if (r === c) {
        ctx.fillStyle = '#555';
        ctx.fillText('-', cx, ry);
      } else {
        ctx.fillStyle = v >= 50 ? '#4f4' : v >= 0 ? '#cc4' : v >= -50 ? '#f84' : '#f44';
        ctx.fillText(String(v), cx, ry);
      }
    }

    const lineY = y + (r + 1) * cellH;
    ctx.beginPath();
    ctx.moveTo(x, lineY);
    ctx.lineTo(x + w, lineY);
    ctx.stroke();
  }

  for (let c = 1; c <= cols; c++) {
    const lx = x + c * cellW;
    ctx.beginPath();
    ctx.moveTo(lx, y + cellH);
    ctx.lineTo(lx, y + h);
    ctx.stroke();
  }
}

function drawFactionSnapshotPanel(
  ctx: CanvasRenderingContext2D,
  snapshot: FactionUiSnapshot | undefined,
  x: number,
  y: number,
  w: number,
  h: number,
  sy: number,
): void {
  ctx.fillStyle = 'rgba(0,10,14,0.72)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(0,220,200,0.35)';
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = `bold ${9 * sy}px monospace`;
  ctx.fillStyle = '#0ca';
  ctx.fillText('ЗОНЫ И СОБЫТИЯ', x + 6, y + 5);

  ctx.font = `${8 * sy}px monospace`;
  if (!snapshot) {
    ctx.fillStyle = '#777';
    ctx.fillText(fitText(ctx, 'Нет снимка: подождите тик симуляции.', w - 12), x + 6, y + 20 * sy);
    return;
  }

  let yy = y + 19 * sy;
  ctx.fillStyle = snapshot.contestedZones > 0 ? '#ffd36a' : '#688';
  ctx.fillText(`Спорные зоны: ${snapshot.contestedZones}`, x + 6, yy);
  yy += 11 * sy;

  for (const owner of snapshot.owners) {
    if (owner.zones <= 0) continue;
    ctx.fillStyle = ZONE_FACTION_COLORS[owner.faction];
    ctx.fillRect(x + 7, yy + 2, 6, 6);
    ctx.fillStyle = owner.contested > 0 ? '#ffd36a' : '#bbb';
    const line = `${ZONE_FACTION_NAMES[owner.faction]}: ${owner.zones}${owner.contested > 0 ? `, спор ${owner.contested}` : ''}`;
    ctx.fillText(fitText(ctx, line, w - 20), x + 17, yy);
    yy += 10 * sy;
  }

  yy += 3 * sy;
  ctx.fillStyle = '#8ac';
  ctx.fillText('Давление', x + 6, yy);
  yy += 10 * sy;
  let drawnContested = 0;
  for (const zone of snapshot.zones) {
    if (!zone.contested) continue;
    if (drawnContested >= 4 || yy > y + h - 54 * sy) break;
    const line = `З${zone.zoneId + 1}: ${ZONE_FACTION_NAMES[zone.owner]} / ${ZONE_FACTION_NAMES[zone.dominant]} ${Math.round(zone.pressure * 100)}%`;
    ctx.fillStyle = '#ffd36a';
    ctx.fillText(fitText(ctx, line, w - 12), x + 6, yy);
    yy += 10 * sy;
    drawnContested++;
  }
  if (drawnContested === 0) {
    ctx.fillStyle = '#666';
    ctx.fillText('Границы устойчивы.', x + 6, yy);
    yy += 10 * sy;
  }

  yy += 3 * sy;
  ctx.fillStyle = '#8ac';
  ctx.fillText('Недавнее', x + 6, yy);
  yy += 10 * sy;
  if (snapshot.recentEvents.length === 0) {
    ctx.fillStyle = '#666';
    ctx.fillText('Фракционных событий пока нет.', x + 6, yy);
    return;
  }
  for (const event of snapshot.recentEvents) {
    if (yy > y + h - 10 * sy) break;
    const age = Math.max(0, Math.round(snapshot.time - event.time));
    const zone = event.zoneId >= 0 ? `З${event.zoneId + 1}` : 'зона ?';
    const phase = event.phase === 'aftermath' ? ' итог' : event.phase === 'start' ? ' старт' : '';
    const name = event.name || String(event.type);
    ctx.fillStyle = eventColor(event.severity);
    ctx.fillText(fitText(ctx, `${age}s ${zone}: ${name}${phase}`, w - 12), x + 6, yy);
    yy += 10 * sy;
  }
}

export function drawFactionMenu(
  ctx: CanvasRenderingContext2D,
  _player: Entity,
  _entities: Entity[],
  sx: number, sy: number,
  time = 0,
): void {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;

  // Fullscreen neuro-panel background
  ctx.fillStyle = '#00040a';
  ctx.fillRect(0, 0, w, h);
  drawNeuroPanel(ctx, 0, 0, w, h, time, 95);

  // Title
  ctx.font = `bold ${12 * sy}px monospace`;
  ctx.textAlign = 'center';
  drawGlitchText(ctx, fitText(ctx, 'ОТНОШЕНИЯ ФРАКЦИЙ', w - 16 * sx), w / 2, 20 * sy, time, 950, '#0ca', 12 * sy);

  const snapshot = getFactionUiSnapshot();
  const topY = 36 * sy;
  const botY = h - 16 * sy;
  const pad = 6 * sx;
  const sideBySide = w >= 520 * sx;
  const sideW = sideBySide ? Math.min(230 * sx, w * 0.38) : w - pad * 2;
  const tableW = sideBySide ? w - sideW - pad * 3 : w - pad * 2;
  const tableH = sideBySide ? botY - topY : Math.max(140 * sy, (botY - topY) * 0.58);
  drawRelationMatrix(ctx, pad, topY, tableW, tableH, sy);
  drawFactionSnapshotPanel(
    ctx,
    snapshot,
    sideBySide ? pad * 2 + tableW : pad,
    sideBySide ? topY : topY + tableH + 6 * sy,
    sideW,
    sideBySide ? tableH : botY - (topY + tableH + 6 * sy),
    sy,
  );

  // Hint
  ctx.fillStyle = '#555';
  ctx.font = `${8 * sy}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('[F] закрыть', w / 2, botY + 2 * sy);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
}
