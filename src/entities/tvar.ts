/* ── Tvar — hunched shadow creature ───────────────────────────── */

import { FloorLevel, MonsterKind } from '../core/types';
import type { MonsterDef } from './monster';
import { S, rgba, noise, clamp, CLEAR } from '../render/pixutil';

export const DEF: MonsterDef = {
  kind: MonsterKind.TVAR,
  name: 'Тварь',
  hp: 54,
  speed: 1.65,
  dmg: 13,
  attackRate: 1.15,
  sprite: 0,   // auto-assigned by generateSprites()
  aiFlags: ['foodBait', 'wallBias'],
  floors: [FloorLevel.KVARTIRY, FloorLevel.LIVING, FloorLevel.MAINTENANCE, FloorLevel.HELL],
  counterplay: 'Не жмитесь к панели: держите полторы клетки и центр комнаты, а еду или говняк бросайте вбок, чтобы разорвать контакт.',
  lootHint: 'сырая органика, бетонная крошка у лап, редкий кусок мяса',
};

export function generateSprite(): Uint32Array {
  const t = new Uint32Array(S * S).fill(CLEAR);
  const cx = S / 2;
  // Hunched mass
  for (let y = 8; y < 55; y++) for (let x = cx - 14; x < cx + 14; x++) {
    if (x < 0 || x >= S) continue;
    const dx = (x - cx) / 14, dy = (y - 32) / 24;
    if (dx * dx + dy * dy < 1) {
      const n = noise(x, y, 555) * 20;
      const dark = y > 40 ? 15 : 0;
      t[y * S + x] = rgba(clamp(45 + n - dark), clamp(40 + n - dark), clamp(50 + n - dark));
    }
  }
  // Panel scars across the shoulders make the wall-born silhouette readable.
  for (let y = 21; y < 47; y += 7) {
    const lean = Math.sin(y * 0.31) * 2;
    for (let dx = -10; dx <= 10; dx++) {
      const x = Math.floor(cx + dx + lean);
      if (x < 0 || x >= S) continue;
      if (Math.abs(dx) > 8 && y < 30) continue;
      const n = noise(x, y, 558) * 14;
      t[y * S + x] = rgba(clamp(82 + n), clamp(80 + n), clamp(76 + n));
    }
  }
  // Wall-scraping forelimbs
  for (let y = 25; y < 50; y += 2) {
    const reach = (y - 25) * 0.24;
    const lx = Math.floor(cx - 12 - reach);
    const rx = Math.floor(cx + 12 + reach);
    const n = noise(y, 0, 559) * 16;
    if (lx >= 0 && lx < S) t[y * S + lx] = rgba(clamp(86 + n), clamp(82 + n), clamp(78 + n));
    if (rx >= 0 && rx < S) t[y * S + rx] = rgba(clamp(86 + n), clamp(82 + n), clamp(78 + n));
  }
  // Multiple eyes
  for (const [ex, ey] of [[-5,16],[-2,14],[2,14],[5,16],[0,18]]) {
    const px = cx + ex, py = ey;
    if (px >= 0 && px < S && py >= 0 && py < S) {
      t[py * S + px] = rgba(180, 255, 180);
      if (py + 1 < S) t[(py + 1) * S + px] = rgba(80, 170, 90);
    }
  }
  return t;
}
