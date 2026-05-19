import { type NetSphereSnapshot } from '../systems/net_sphere';
import { drawGlitchText, drawNeuroPanel, drawStaticNoise } from './hud_fx';

function fitText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (maxW <= 0) return '';
  if (ctx.measureText(text).width <= maxW) return text;
  let end = text.length - 3;
  while (end > 1 && ctx.measureText(text.slice(0, end) + '...').width > maxW) end--;
  return text.slice(0, Math.max(1, end)) + '...';
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxLines: number): string[] {
  if (maxW <= 0 || maxLines <= 0) return [];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxW) {
      line = next;
      continue;
    }
    if (line) lines.push(line);
    line = word;
    if (lines.length >= maxLines) break;
  }
  if (line && lines.length < maxLines) lines.push(fitText(ctx, line, maxW));
  return lines;
}

function two(value: number): string {
  return String(value).padStart(2, '0');
}

function timeLabel(epochMs: number): string {
  if (!epochMs) return '--:--';
  const date = new Date(epochMs);
  return `${two(date.getHours())}:${two(date.getMinutes())}`;
}

function statLine(
  ctx: CanvasRenderingContext2D,
  label: string,
  value: string,
  x: number,
  y: number,
  w: number,
  valueOffset: number,
  tint = '#8cf',
): void {
  const valueX = x + valueOffset;
  ctx.fillStyle = '#6f7d88';
  ctx.fillText(fitText(ctx, label, valueOffset - 4), x, y);
  ctx.fillStyle = tint;
  ctx.fillText(fitText(ctx, value, w - valueOffset), valueX, y);
}

export function drawNetSphereMenu(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  time: number,
  net: NetSphereSnapshot,
): void {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const s = Math.max(0.8, Math.min(2, Math.min(sx, sy)));
  const pad = 8 * s;
  const x = 5 * s;
  const y = 5 * s;
  const panelW = w - 10 * s;
  const panelH = h - 10 * s;
  const leftW = Math.min(210 * s, panelW * 0.38);
  const chatX = x + pad + leftW + 8 * s;
  const chatW = Math.max(80 * s, x + panelW - chatX - pad);
  const headerY = y + 10 * s;
  const chatY = headerY + 2 * s;
  const chatH = Math.max(80 * s, y + panelH - chatY - 18 * s);
  const commandY = y + panelH - 29 * s;
  const valueOffset = Math.max(58 * s, Math.min(132 * s, leftW * 0.5));
  const lineH = 9 * s;

  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  ctx.fillRect(0, 0, w, h);
  drawNeuroPanel(ctx, x, y, panelW, panelH, time, 820);
  drawStaticNoise(ctx, x, y, panelW, panelH, time, net.status === 'online' ? 0.012 : 0.026);

  ctx.textBaseline = 'top';
  ctx.font = `bold ${12 * s}px monospace`;
  drawGlitchText(ctx, 'НЕТ-СФЕРА', x + pad, headerY, time, 821, '#63f6ff', 12 * s);
  ctx.font = `${7 * s}px monospace`;
  ctx.fillStyle = net.status === 'online' ? '#7f8' : net.status === 'syncing' ? '#fd6' : '#f86';
  ctx.fillText(net.statusText, x + pad, headerY + 16 * s);
  if (net.busy) {
    ctx.fillStyle = '#89a';
    ctx.fillText('пакет...', x + pad + 75 * s, headerY + 16 * s);
  }

  const leftX = x + pad;
  let ly = headerY + 34 * s;
  ctx.font = `${8 * s}px monospace`;
  statLine(ctx, 'НЕТ-ИМЯ', net.nickname, leftX, ly, leftW, valueOffset, '#d8f6ff'); ly += 12 * s;
  statLine(ctx, 'НЕТ-ГЕН', net.netGen, leftX, ly, leftW, valueOffset, '#7da3ad'); ly += 10 * s;
  statLine(ctx, 'СЕССИЯ', net.sessionId, leftX, ly, leftW, valueOffset, '#6f8792'); ly += 14 * s;

  const stats = net.stats;
  statLine(ctx, 'онлайн', String(stats?.onlineUsers ?? '-'), leftX, ly, leftW, valueOffset, '#7f8'); ly += 10 * s;
  statLine(ctx, 'игроков', String(stats?.totalPlayers ?? '-'), leftX, ly, leftW, valueOffset, '#8cf'); ly += 10 * s;
  statLine(ctx, 'самосборов', String(stats?.totalSamosbors ?? '-'), leftX, ly, leftW, valueOffset, '#f6c'); ly += 10 * s;
  statLine(ctx, 'смертей', String(stats?.totalDeaths ?? '-'), leftX, ly, leftW, valueOffset, '#f86'); ly += 16 * s;

  const profile = net.profile;
  statLine(ctx, 'запусков', String(profile?.runs ?? '-'), leftX, ly, leftW, valueOffset, '#8cf'); ly += 10 * s;
  statLine(ctx, 'мой пик', profile ? `ур.${profile.bestLevel} / ${profile.bestSamosborCount} сбор.` : '-', leftX, ly, leftW, valueOffset, '#fd8'); ly += 10 * s;
  statLine(ctx, 'мой этаж', profile?.lastFloor || '-', leftX, ly, leftW, valueOffset, '#9df'); ly += 10 * s;
  statLine(ctx, 'мои смерти', String(profile?.deaths ?? '-'), leftX, ly, leftW, valueOffset, '#f98'); ly += 16 * s;

  ctx.fillStyle = '#9cf';
  ctx.fillText('СВОДКА', leftX, ly);
  ly += 10 * s;
  const maxEventRows = Math.max(0, Math.min(5, Math.floor((commandY - ly - 18 * s) / lineH)));
  for (const event of net.events.slice(0, maxEventRows)) {
    const color = event.type === 'death' ? '#f98' : '#f6c';
    ctx.fillStyle = color;
    ctx.fillText(fitText(ctx, event.summary, leftW - 8 * s), leftX, ly);
    ly += lineH;
  }

  if (net.error) {
    ly += 6 * s;
    ctx.fillStyle = '#f86';
    const maxErrorRows = Math.max(0, Math.floor((commandY - ly) / lineH));
    for (const line of wrapText(ctx, net.error, leftW - pad, Math.min(4, maxErrorRows))) {
      ctx.fillText(line, leftX, ly);
      ly += lineH;
    }
  }

  ctx.fillStyle = '#607080';
  ctx.fillText(fitText(ctx, '/netgen NET-...  /new  /clear', leftW), leftX, commandY);
  ctx.fillStyle = '#607080';
  ctx.fillText(fitText(ctx, '[N] открыть  [Esc] закрыть  [Enter] отправить', leftW), leftX, commandY + 10 * s);

  ctx.strokeStyle = 'rgba(92,246,255,0.34)';
  ctx.strokeRect(chatX, chatY, chatW, chatH);
  ctx.fillStyle = 'rgba(3,18,24,0.58)';
  ctx.fillRect(chatX + 1, chatY + 1, chatW - 2, chatH - 2);

  ctx.font = `${8 * s}px monospace`;
  ctx.fillStyle = '#9cf';
  ctx.fillText('ТЕРМИНАЛ', chatX + 6 * s, chatY + 5 * s);

  const promptH = 18 * s;
  const msgTop = chatY + 20 * s;
  const msgBottom = chatY + chatH - promptH - 4 * s;
  let cy = msgBottom - 9 * s;
  ctx.font = `${7 * s}px monospace`;
  const compactChat = chatW < 180 * s;
  for (let i = net.chat.length - 1; i >= 0 && cy >= msgTop; i--) {
    const line = net.chat[i];
    const stamp = timeLabel(line.createdAt);
    const name = line.nickname || 'Жилец';
    const nameW = Math.max(24 * s, Math.min(96 * s, chatW * 0.3));
    const label = `[${stamp} ${fitText(ctx, name, nameW)}]`;
    if (compactChat) {
      const bodyW = Math.max(20 * s, chatW - 16 * s);
      const wrapped = wrapText(ctx, line.body, bodyW, 3);
      for (let j = wrapped.length - 1; j >= 0 && cy >= msgTop; j--) {
        ctx.fillStyle = '#d6f6ee';
        ctx.fillText(wrapped[j], chatX + 10 * s, cy);
        cy -= lineH;
      }
      if (cy >= msgTop) {
        ctx.fillStyle = '#6b7f8a';
        ctx.fillText(fitText(ctx, label, chatW - 12 * s), chatX + 6 * s, cy);
        cy -= lineH;
      }
      continue;
    }
    const bodyW = Math.max(20 * s, chatW - 16 * s - ctx.measureText(label).width);
    const wrapped = wrapText(ctx, line.body, bodyW, 3);
    for (let j = wrapped.length - 1; j >= 0 && cy >= msgTop; j--) {
      ctx.fillStyle = j === 0 ? '#6b7f8a' : '#253844';
      if (j === 0) ctx.fillText(label, chatX + 6 * s, cy);
      ctx.fillStyle = '#d6f6ee';
      ctx.fillText(wrapped[j], chatX + 9 * s + ctx.measureText(label).width, cy);
      cy -= lineH;
    }
  }

  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  ctx.fillRect(chatX + 2 * s, chatY + chatH - promptH, chatW - 4 * s, promptH - 2 * s);
  ctx.fillStyle = '#63f6ff';
  const cursor = Math.floor(time * 2) % 2 === 0 ? '_' : '';
  ctx.fillText(`> ${fitText(ctx, net.draft + cursor, chatW - 14 * s)}`, chatX + 6 * s, chatY + chatH - promptH + 5 * s);

  ctx.restore();
}
