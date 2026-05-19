/* ── Shadow — dark ambush silhouette (теневик) ────────────────── */
/*   Black humanoid figure with readable violet rim and eye cues. */

import { FloorLevel, MonsterKind } from '../core/types';
import type { MonsterDef } from './monster';
import { S, rgba, noise, clamp, CLEAR } from '../render/pixutil';

export const DEF: MonsterDef = {
  kind: MonsterKind.SHADOW,
  name: 'Теневик',
  hp: 50,
  speed: 2.4,
  dmg: 12,
  attackRate: 1.0,
  sprite: 0,   // auto-assigned by generateSprites()
  floors: [FloorLevel.MINISTRY, FloorLevel.KVARTIRY, FloorLevel.LIVING, FloorLevel.HELL, FloorLevel.VOID],
  counterplay: 'Темный рывок читается короткой паузой: отходите в свет, включайте фонарь или рвите дистанцию до первого удара.',
  lootHint: 'темный след, холодная пыль, редкий странный сгусток',
};

export function generateSprite(): Uint32Array {
  const t = new Uint32Array(S * S).fill(CLEAR);
  const cx = S / 2;
  // Faint afterimage makes the ambush readable even against dark walls.
  for (let y = 6; y < 60; y++) {
    const fade = y < 18 ? 0.6 : y > 48 ? (60 - y) / 12 : 1;
    const halfW = y < 18 ? 8 : y < 42 ? 11 : 8;
    for (let side = -1; side <= 1; side += 2) {
      const edgeX = Math.floor(cx + side * (halfW + 1 + noise(y, side, 1098) * 2));
      if (edgeX < 0 || edgeX >= S) continue;
      const a = Math.floor((38 + noise(edgeX, y, 1099) * 46) * fade);
      if (a > 8) t[y * S + edgeX] = rgba(70, 38, 92, a);
    }
  }

  // Head — slightly oval, very dark with noise
  for (let y = 4; y < 18; y++) for (let x = cx - 6; x < cx + 6; x++) {
    if (x < 0 || x >= S) continue;
    const dx = (x - cx) / 6, dy = (y - 11) / 7;
    if (dx * dx + dy * dy < 1) {
      const n = noise(x, y, 1101) * 8;
      t[y * S + x] = rgba(clamp(8 + n), clamp(8 + n), clamp(10 + n));
    }
  }
  // Eyes — small but bright enough to warn before contact
  for (const ex of [cx - 3, cx + 3]) {
    t[9 * S + ex] = rgba(88, 48, 118, 180);
    t[10 * S + ex] = rgba(184, 78, 232);
    t[11 * S + ex] = rgba(116, 54, 168);
    if (ex > 0) t[10 * S + ex - 1] = rgba(74, 34, 104, 190);
    if (ex + 1 < S) t[10 * S + ex + 1] = rgba(74, 34, 104, 190);
  }

  // Torso — tall slender black form with wispy edges
  for (let y = 18; y < 50; y++) {
    const taper = y < 25 ? 8 : y < 40 ? 7 : 5;
    const wispL = noise(y, 0, 1102) * 3;
    const wispR = noise(0, y, 1103) * 3;
    for (let x = Math.floor(cx - taper - wispL); x < Math.floor(cx + taper + wispR); x++) {
      if (x < 0 || x >= S) continue;
      const edgeDist = Math.min(x - (cx - taper), (cx + taper) - x);
      const n = noise(x, y, 1104) * 6;
      // Edges are semi-transparent (wispy shadow)
      const alpha = edgeDist < 2 ? 120 + Math.floor(noise(x, y, 1105) * 80) : 255;
      const edgeGlow = edgeDist < 1.2 ? 14 : 0;
      t[y * S + x] = rgba(clamp(6 + n + edgeGlow), clamp(6 + n), clamp(8 + n + edgeGlow), alpha);
    }
  }

  // Shoulder breaks: a player should read a body, not a black column.
  for (let y = 19; y < 28; y++) {
    const hw = 9 - Math.floor((y - 19) / 3);
    for (const x of [Math.floor(cx - hw), Math.floor(cx + hw)]) {
      if (x < 0 || x >= S) continue;
      t[y * S + x] = rgba(92, 46, 112, 135);
    }
  }

  // Arms — thin trailing wisps
  for (let y = 22; y < 44; y++) {
    const spread = (y - 22) * 0.3;
    const lx = Math.floor(cx - 9 - spread + noise(y, 1, 1106) * 2);
    const rx = Math.floor(cx + 9 + spread - noise(1, y, 1107) * 2);
    if (lx >= 0) t[y * S + lx] = rgba(48, 26, 62, 165);
    if (rx < S)  t[y * S + rx] = rgba(48, 26, 62, 165);
    if (lx + 1 < S) t[y * S + lx + 1] = rgba(6, 6, 8, 180);
    if (rx - 1 >= 0) t[y * S + rx - 1] = rgba(6, 6, 8, 180);
  }
  // Lower body dissolves into wisps — no distinct legs
  for (let y = 50; y < 62; y++) {
    const fade = (y - 50) / 12;
    const halfW = Math.floor(5 * (1 - fade));
    for (let x = cx - halfW; x <= cx + halfW; x++) {
      if (x < 0 || x >= S) continue;
      const alpha = Math.floor(200 * (1 - fade) * (0.5 + noise(x, y, 1108) * 0.5));
      if (alpha > 10) t[y * S + x] = rgba(5, 5, 7, alpha);
    }
  }
  return t;
}
