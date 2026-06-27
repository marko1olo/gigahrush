/* ── Sborka — fast twitchy creature ───────────────────────────── */

import { FloorLevel, MonsterKind } from '../core/types';
import type { MonsterDef } from './monster';
import { S, rgba, noise, clamp, CLEAR, outline } from '../render/pixutil';

export const DEF: MonsterDef = {
  kind: MonsterKind.SBORKA,
  name: 'Сборка',
  hp: 8,
  speed: 3.15,
  dmg: 3,
  attackRate: 0.65,
  sprite: 0,   // auto-assigned by generateSprites()
  aiFlags: ['foodBait'],
  floors: [FloorLevel.MINISTRY, FloorLevel.KVARTIRY, FloorLevel.LIVING, FloorLevel.MAINTENANCE, FloorLevel.HELL],
  counterplay: 'Быстрая и слабая: принимайте в широком проходе, гасите дешевым выстрелом до касания и не тратьте последний магазин на первую.',
  lootHint: 'проволока, кладовой мусор, редкая изолента из треснувшего узла',
};

export function generateSprite(): Uint32Array {
  const t = new Uint32Array(S * S).fill(CLEAR);
  const sc = S / 64;
  const cx = S / 2;

  // Compact jagged body: weak, fast, made from scraps.
  for (let y = 16 * sc; y < 50 * sc; y++) {
    const lean = Math.sin(y / sc * 0.33) * 2;
    const halfW = y < 28 * sc ? (5 + Math.sin(y / sc * 0.7) * 2) * sc : (7 + Math.sin(y / sc * 0.45) * 3) * sc;
    for (let x = Math.floor(cx - halfW + lean); x <= Math.ceil(cx + halfW + lean); x++) {
      if (x < 0 || x >= S) continue;
      const dx = (x - cx - lean) / Math.max(1, halfW);
      if (dx * dx > 1.1) continue;
      const n = noise(x, y, 444) * 30;
      const crack = noise(x * 3, y * 2, 445) > 0.82 ? -35 : 0;
      t[y * S + x] = rgba(clamp(82 + n + crack), clamp(45 + n + crack), clamp(54 + n + crack));
    }
  }

  for (let y = 20 * sc; y < 48 * sc; y += 6 * sc) {
    const shift = Math.floor(Math.sin(y / sc * 0.6) * 3 * sc);
    for (let dx = -10 * sc; dx <= 10 * sc; dx += 4 * sc) {
      const px = Math.floor(cx + dx + shift);
      if (px >= 0 && px < S) t[y * S + px] = rgba(35, 28, 32);
    }
  }

  for (let y = 27 * sc; y < 53 * sc; y += 5 * sc) {
    const spread = (6 + (y / sc - 27) * 0.28) * sc;
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < 5; i++) {
        const x = Math.floor(cx + side * (spread + i));
        const yy = y + Math.floor(i * 0.4 * sc);
        if (x >= 0 && x < S && yy >= 0 && yy < S) t[yy * S + x] = rgba(72, 45, 38);
      }
    }
  }

  t[Math.floor(18 * sc) * S + (Math.floor(cx - 3 * sc))] = rgba(255, 100, 100);
  t[Math.floor(18 * sc) * S + (Math.floor(cx + 3 * sc))] = rgba(255, 100, 100);
  t[Math.floor(19 * sc) * S + (Math.floor(cx - 3 * sc))] = rgba(255, 80, 80);
  t[Math.floor(19 * sc) * S + (Math.floor(cx + 3 * sc))] = rgba(255, 80, 80);

  for (let y = 50 * sc; y < 58 * sc; y++) {
    const n = noise(cx, y, 446) * 18;
    const lx = Math.floor(cx - 5 * sc - (y - 50 * sc) * 0.45);
    const rx = Math.floor(cx + 4 * sc + (y - 50 * sc) * 0.25);
    if (lx >= 0) t[y * S + lx] = rgba(clamp(78 + n), clamp(45 + n), clamp(42 + n));
    if (rx < S) t[y * S + rx] = rgba(clamp(78 + n), clamp(45 + n), clamp(42 + n));
  }
  outline(t, rgba(20, 20, 20));
  return t;
}
