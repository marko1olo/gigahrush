/**
 * Shared rendering logic for the loading screen (used by both the main thread during initial synchronous
 * draw and the offscreen web worker during async world generation).
 *
 * ONE unified atmospheric screen serves every load: first boot, floor transitions, post-samosbor rebuild,
 * teleports and restarts. There is no longer a separate "minimal" transition screen — the rich system
 * briefing (controls, survival rules, progress bar) plus the rotating numbered tip is the single canon.
 */

const CANVAS_TEXT_GLITCH_CHARS = '#%&*+=?/\\<>[]{}';


const CANVAS_TEXT_GLITCH_RE = /[A-Za-zА-Яа-яЁё]/;

function canvasTextGlitchTick(): number {
  return Math.floor(performance.now() / 85);
}

function canvasTextGlitchHash(text: string, index: number, x: number, y: number, tick: number): number {
  let h = (0x811c9dc5 ^ tick ^ Math.round(x * 7) ^ Math.round(y * 13)) >>> 0;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i) + i * 17;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  h ^= Math.imul(index + 1, 0x9e3779b9);
  h ^= h >>> 16;
  return h >>> 0;
}

export function canvasTextGlitch(text: string, x: number, y: number): string {
  if (text.length < 4) return text;
  const chars = Array.from(text);
  const maxChanges = Math.max(1, Math.min(4, Math.floor(chars.length / 16)));
  const tick = canvasTextGlitchTick();
  let changed = 0;
  for (let i = 0; i < chars.length && changed < maxChanges; i++) {
    const ch = chars[i];
    if (!CANVAS_TEXT_GLITCH_RE.test(ch)) continue;
    const h = canvasTextGlitchHash(text, i, x, y, tick);
    // Fixed pressure of 10 per mille for loading screen styling
    if ((h % 1000) >= 10) continue;
    chars[i] = CANVAS_TEXT_GLITCH_CHARS[(h >>> 10) % CANVAS_TEXT_GLITCH_CHARS.length];
    changed++;
  }
  return changed > 0 ? chars.join('') : text;
}

/**
 * Main entry point for drawing the loading screen canvas.
 *
 * A single unified screen is used for every load (`isFirstLoad` no longer selects a different layout;
 * it only tweaks the framing copy). The rotating numbered `currentTip` is always shown at the bottom.
 */
export function drawLoadingScreen(
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
  width: number,
  height: number,
  now: number,
  isFirstLoad: boolean,
  progressStage: string,
  progressPct: number,
  dots: number,
  currentTip: string,
): void {
  drawUnifiedLoading(ctx, width, height, now, isFirstLoad, progressStage, progressPct, dots, currentTip);
}

import { drawNeuroPanel } from './hud_fx';

/**
 * The one unified atmospheric loading screen. Shows the system briefing, controls, survival rules,
 * progress bar and a rotating numbered tip. Used identically for first boot and every subsequent
 * transition (floor change, samosbor rebuild, teleport, restart). `isFirstLoad` only softens the
 * framing copy for returning loads; the layout is the same.
 */
function drawUnifiedLoading(
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
  width: number,
  height: number,
  now: number,
  isFirstLoad: boolean,
  progressStage: string,
  progressPct: number,
  dots: number,
  currentTip: string,
): void {
  const time = typeof performance !== 'undefined' ? performance.now() / 1000 : now / 1000;
  
  drawNeuroPanel(ctx as CanvasRenderingContext2D, 0, 0, width, height, time, 500);

  // Subtle terminal border on larger screens
  if (width >= 500 && height >= 400) {
    ctx.strokeStyle = '#182424';
    ctx.lineWidth = 2;
    ctx.strokeRect(12, 12, width - 24, height - 24);
  }

  const isLandscape = width >= height * 1.05 && width >= 650;
  const centerX = width / 2;
  const pulseWarn = Math.floor(now / 380) % 2 === 0;

  if (isLandscape) {
    // ── LANDSCAPE LAYOUT (Desktop / Tablet) ──
    const topTitleY = Math.round(height * 0.08);
    const topSubY = Math.round(height * 0.15);
    const topWarnY = Math.round(height * 0.22);

    // Title
    const titleSize = Math.max(18, Math.min(36, Math.round(height / 24)));
    ctx.font = `bold ${titleSize}px "Press Start 2P", monospace`;
    ctx.fillStyle = '#e56a20';
    ctx.textAlign = 'center';
    const titleText = canvasTextGlitch('[ СИСТЕМНАЯ СВОДКА ОТ ПАРТИИ ]', centerX, topTitleY);
    ctx.fillText(titleText, centerX, topTitleY);

    // Subtitle
    const subSize = Math.max(12, Math.min(20, Math.round(height / 44)));
    ctx.font = `${subSize}px "Press Start 2P", monospace`;
    ctx.fillStyle = '#bbb';
    ctx.fillText(isFirstLoad ? 'ПРОЦЕДУРНЫЙ СИМУЛЯТОР ВЫЖИВАНИЯ В ГИГАХРУЩЕ' : 'ПЕРЕСБОРКА СЕКТОРА • ДЕРЖИТЕСЬ, ТОВАРИЩ', centerX, topSubY);

    // Hazard warning banner
    const warnSize = Math.max(12, Math.min(18, Math.round(height / 48)));
    ctx.font = `bold ${warnSize}px "Press Start 2P", monospace`;
    ctx.fillStyle = pulseWarn ? '#ff4433' : '#d03020';
    const warnText = canvasTextGlitch('!!! НЕ ЖДИТЕ ПОЩАДЫ, ТОВАРИЩИ. ВЫ ПРЕДУПРЕЖДЕНЫ !!!', centerX, topWarnY);
    ctx.fillText(warnText, centerX, topWarnY);

    // Center Loading Indicator & Progress Bar (raised to leave room for the numbered tip footer)
    const centerY = Math.round(height * 0.42);
    const baseText = 'ЗАГРУЗКА';
    const dotsStr = '.'.repeat(dots);

    ctx.font = `${Math.round(height / 22)}px "Press Start 2P", monospace`;
    ctx.fillStyle = '#aaa';
    ctx.textAlign = 'center';
    const glitchedBase = canvasTextGlitch(baseText, centerX, centerY);
    const baseWidth = ctx.measureText(glitchedBase).width;
    ctx.fillText(glitchedBase, centerX, centerY);

    ctx.textAlign = 'left';
    const glitchedDots = canvasTextGlitch(dotsStr, centerX + baseWidth / 2, centerY);
    ctx.fillText(glitchedDots, centerX + baseWidth / 2, centerY);

    const barW = Math.min(520, width * 0.42);
    const barH = Math.max(3, Math.round(height / 180));
    const barX = (width - barW) / 2;
    const barY = centerY + Math.round(height / 32);

    ctx.fillStyle = '#182222';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = '#44ccaa';
    ctx.fillRect(barX, barY, barW * (progressPct / 100), barH);

    if (progressStage) {
      const stageSize = Math.max(12, Math.min(16, Math.round(height / 52)));
      ctx.font = `${stageSize}px "Press Start 2P", monospace`;
      ctx.fillStyle = '#779999';
      ctx.textAlign = 'center';
      ctx.fillText(progressStage, centerX, barY + barH + stageSize + 6);
    }

    // Bottom Dual Columns (Controls & Survival Rules)
    const colSize = Math.max(12, Math.min(16, Math.round(height / 54)));
    const lineH = Math.round(colSize * 1.55);
    const startY = Math.round(height * 0.58);

    // Left Column: Key bindings
    const leftX = Math.round(width * 0.05);
    ctx.textAlign = 'left';
    ctx.font = `bold ${colSize + 1}px "Press Start 2P", monospace`;
    ctx.fillStyle = '#44ccaa';
    ctx.fillText('> ОСНОВНЫЕ КЛАВИШИ <', leftX, startY);

    const leftControls = [
      ['Enter', 'Меню'],
      ['ПКМ', 'Выбрать'],
      ['ПКМ', 'Закрыть'],
      ['WASD / ARROWS', 'Перемещение'],
      ['E', 'Взаимодействие'],
      ['Tab', 'Раскладка'],
      ['I', 'Инвентарь'],
      ['M', 'Карта'],
      ['Esc', 'Пауза'],
    ];

    const descOffset = Math.max(140, Math.round(width * 0.13));
    for (let i = 0; i < leftControls.length; i++) {
      const rowY = startY + (i + 1.4) * lineH;
      ctx.font = `bold ${colSize}px "Press Start 2P", monospace`;
      ctx.fillStyle = '#ddf0f0';
      ctx.fillText(leftControls[i][0], leftX, rowY);
      ctx.font = `${colSize}px "Press Start 2P", monospace`;
      ctx.fillStyle = '#88aaaa';
      ctx.fillText(`— ${leftControls[i][1]}`, leftX + descOffset, rowY);
    }

    // Right Column: Survival Rules
    const rightX = Math.round(width * 0.52);
    const rightMaxW = width * 0.95 - rightX;
    ctx.font = `bold ${colSize + 1}px "Press Start 2P", monospace`;
    ctx.fillStyle = '#eeaa22';
    ctx.fillText('> ПРАВИЛА ВЫЖИВАНИЯ <', rightX, startY);

    const rightTips = [
      ['САМОСБОР', 'Услышали сирену - бегите за гермодверь или в убежище!'],
      ['ЭТАЖИ', 'Лифты соединяют этажи бесконечного мегасооружения.'],
      ['ПОКАЗАТЕЛИ', 'Следите за голодом, жаждой, кровотечением и пси-истощением внизу экрана.'],
      ['ИНФОСЕТЬ', 'Обыскивайте контейнеры, собирайте талоны и торгуйте через терминалы.'],
      ['СМЕРТЬ', 'Каждая попытка уникальна. Смерть необратима, но учит выживать в новом цикле.'],
    ];

    let currentTipY = startY + 1.4 * lineH;
    for (let i = 0; i < rightTips.length; i++) {
      currentTipY += drawTipItem(ctx, rightTips[i][0], rightTips[i][1], rightX, currentTipY, rightMaxW, colSize, lineH);
    }

    // Rotating numbered tip footer (canon across every load)
    drawNumberedTip(ctx, currentTip, width, height, height - Math.round(height * 0.04));
  } else {
    // ── PORTRAIT LAYOUT (Mobile / Narrow Window) ──
    const topTitleY = Math.round(height * 0.05);
    const topSubY = Math.round(height * 0.09);
    const topWarnY = Math.round(height * 0.13);

    const titleSize = Math.max(16, Math.min(26, Math.round(width / 18)));
    ctx.font = `bold ${titleSize}px "Press Start 2P", monospace`;
    ctx.fillStyle = '#e56a20';
    ctx.textAlign = 'center';
    const titleText = canvasTextGlitch('[ СИСТЕМНАЯ СВОДКА ОТ ПАРТИИ ]', centerX, topTitleY);
    ctx.fillText(titleText, centerX, topTitleY);

    const subSize = Math.max(11, Math.min(16, Math.round(width / 32)));
    ctx.font = `${subSize}px "Press Start 2P", monospace`;
    ctx.fillStyle = '#bbb';
    ctx.fillText(isFirstLoad ? 'БЕЗЖАЛОСТНЫЙ СИМУЛЯТОР В ГИГАХРУЩЕ' : 'ПЕРЕСБОРКА СЕКТОРА • ДЕРЖИТЕСЬ', centerX, topSubY);

    const warnSize = Math.max(11, Math.min(15, Math.round(width / 34)));
    ctx.font = `bold ${warnSize}px "Press Start 2P", monospace`;
    ctx.fillStyle = pulseWarn ? '#ff4433' : '#d03020';
    ctx.fillText('НЕ ЖДИТЕ ПОЩАДЫ. ВЫ ПРЕДУПРЕЖДЕНЫ.', centerX, topWarnY);

    // Center Loading & Progress Bar
    const centerY = Math.round(height * 0.22);
    const baseText = 'ЗАГРУЗКА';
    const dotsStr = '.'.repeat(dots);

    ctx.font = `${Math.max(16, Math.round(height / 32))}px "Press Start 2P", monospace`;
    ctx.fillStyle = '#aaa';
    const glitchedBase = canvasTextGlitch(baseText, centerX, centerY);
    const baseWidth = ctx.measureText(glitchedBase).width;
    ctx.fillText(glitchedBase, centerX, centerY);

    ctx.textAlign = 'left';
    const glitchedDots = canvasTextGlitch(dotsStr, centerX + baseWidth / 2, centerY);
    ctx.fillText(glitchedDots, centerX + baseWidth / 2, centerY);

    const barW = Math.min(400, width * 0.76);
    const barH = Math.max(3, Math.round(height / 200));
    const barX = (width - barW) / 2;
    const barY = centerY + Math.round(height / 42);

    ctx.fillStyle = '#182222';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = '#44ccaa';
    ctx.fillRect(barX, barY, barW * (progressPct / 100), barH);

    if (progressStage) {
      const stageSize = Math.max(11, Math.round(height / 60));
      ctx.font = `${stageSize}px "Press Start 2P", monospace`;
      ctx.fillStyle = '#779999';
      ctx.textAlign = 'center';
      ctx.fillText(progressStage, centerX, barY + barH + stageSize + 6);
    }

    // Stacked Controls & Survival Rules
    const colSize = Math.max(11, Math.min(14, Math.round(height / 64)));
    const lineH = Math.round(colSize * 1.5);
    const leftX = Math.round(width * 0.06);
    const descOffset = Math.max(120, Math.round(width * 0.36));

    const startY1 = Math.round(height * 0.33);
    ctx.textAlign = 'left';
    ctx.font = `bold ${colSize + 1}px "Press Start 2P", monospace`;
    ctx.fillStyle = '#44ccaa';
    ctx.fillText('> ОСНОВНЫЕ КЛАВИШИ <', leftX, startY1);

    const controlsP = [
      ['Enter / Space / E', 'Принять / Действие / Взаимодействие'],
      ['ЛКМ / ПКМ', 'Выбор / Закрыть меню / Отмена'],
      ['WASD / Джойстик', 'Движение персонажа'],
      ['Tab / I / B', 'Раскладка / Инвентарь'],
      ['R / F / M / Esc', 'Перезарядка / Фонарь / Карта / Пауза'],
    ];

    for (let i = 0; i < controlsP.length; i++) {
      const rowY = startY1 + (i + 1.4) * lineH;
      ctx.font = `bold ${colSize}px "Press Start 2P", monospace`;
      ctx.fillStyle = '#ddf0f0';
      ctx.fillText(controlsP[i][0], leftX, rowY);
      ctx.font = `${colSize}px "Press Start 2P", monospace`;
      ctx.fillStyle = '#88aaaa';
      ctx.fillText(`— ${controlsP[i][1]}`, leftX + descOffset, rowY);
    }

    const startY2 = Math.round(height * 0.54);
    ctx.font = `bold ${colSize + 1}px "Press Start 2P", monospace`;
    ctx.fillStyle = '#eeaa22';
    ctx.fillText('> ПРАВИЛА ВЫЖИВАНИЯ <', leftX, startY2);

    const tipsP = [
      ['САМОСБОР', 'Услышали сирену — бегите за гермодверь!'],
      ['ЭТАЖИ', 'Лифты соединяют этажи мегасооружения.'],
      ['ПОКАЗАТЕЛИ', 'Следите за голодом, жаждой и пси-уровнем.'],
      ['ИНФОСЕТЬ', 'Обыскивайте контейнеры и торгуйте в терминалах.'],
      ['СМЕРТЬ', 'Каждая попытка уникальна. Учитесь на ошибках.'],
    ];

    const maxWP = width * 0.94 - leftX;
    let currentTipY = startY2 + 1.4 * lineH;
    for (let i = 0; i < tipsP.length; i++) {
      currentTipY += drawTipItem(ctx, tipsP[i][0], tipsP[i][1], leftX, currentTipY, maxWP, colSize, lineH);
    }

    // Rotating numbered tip footer (canon across every load)
    drawNumberedTip(ctx, currentTip, width, height, height - Math.round(height * 0.03));
  }

  ctx.textAlign = 'left';
}


/**
 * Draws the rotating numbered tip ("Совет N: ...") as a centered footer, wrapped and bottom-anchored so
 * long tips grow upward and always stay on screen. Shared by both layouts.
 */
function drawNumberedTip(
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
  currentTip: string,
  width: number,
  height: number,
  footerBottom: number,
): void {
  if (!currentTip) return;
  const tipSize = Math.max(12, Math.min(20, Math.round(height / 46)));
  ctx.font = `${tipSize}px "Press Start 2P", monospace`;

  const maxW = width * 0.86;
  const words = currentTip.split(' ');
  const lines: string[] = [];
  let line = words[0] ?? '';
  for (let i = 1; i < words.length; i++) {
    const test = line + ' ' + words[i];
    if (ctx.measureText(test).width > maxW) {
      lines.push(line);
      line = words[i];
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);

  const lineH = tipSize * 1.3;
  const startY = footerBottom - (lines.length - 1) * lineH;
  ctx.fillStyle = '#8a9a8a';
  ctx.textAlign = 'center';
  for (let i = 0; i < lines.length; i++) {
    const lineY = startY + i * lineH;
    ctx.fillText(canvasTextGlitch(lines[i], width / 2, lineY), width / 2, lineY);
  }
  ctx.textAlign = 'left';
}


/**
 * Draws a topic bullet point and description, automatically wrapping the text across multiple lines if needed.
 */
function drawTipItem(
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
  topic: string,
  desc: string,
  x: number,
  y: number,
  maxW: number,
  fontSize: number,
  lineH: number,
): number {
  ctx.font = `bold ${fontSize}px "Press Start 2P", monospace`;
  ctx.fillStyle = '#eeddaa';
  const prefix = `• ${topic}: `;
  ctx.fillText(prefix, x, y);
  const prefixW = ctx.measureText(prefix).width;

  ctx.font = `${fontSize}px "Press Start 2P", monospace`;
  ctx.fillStyle = '#99aa99';

  if (prefixW + ctx.measureText(desc).width <= maxW) {
    ctx.fillText(desc, x + prefixW, y);
    return lineH;
  }

  // Wrap text
  const words = desc.split(' ');
  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const testLine = currentLine + ' ' + words[i];
    const availW = lines.length === 0 ? maxW - prefixW : maxW - 16;
    if (ctx.measureText(testLine).width > availW) {
      lines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  for (let i = 0; i < lines.length; i++) {
    if (i === 0) {
      ctx.fillText(lines[i], x + prefixW, y);
    } else {
      ctx.fillText(lines[i], x + 16, y + i * lineH);
    }
  }
  return lines.length * lineH;
}
