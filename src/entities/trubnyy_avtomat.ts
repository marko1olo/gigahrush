/* -- Trubnyy Avtomat: wet-corridor line machine ---------------- */

import { FloorLevel, MonsterKind } from '../core/types';
import type { MonsterDef } from './monster';
import { S, rgba, noise, clamp, CLEAR } from '../render/pixutil';

export const DEF: MonsterDef = {
  kind: MonsterKind.TRUBNYY_AVTOMAT,
  name: 'Трубный Автомат',
  hp: 150,
  speed: 0.82,
  dmg: 25,
  attackRate: 2.75,
  sprite: 0,
  isRanged: true,
  projSpeed: 13,
  projSprite: 0,
  aiFlags: ['wetLineShot'],
  floors: [FloorLevel.MAINTENANCE],
  counterplay: 'Сойдите с мокрой прямой до окончания заряда: автомат бьет только по водной линии, долго остывает после залпа и плохо держит фланг в упоре.',
  lootHint: 'мокрая плата, синие трубные кольца, обожженный манометр, редкая энергоячейка',
};

function put(t: Uint32Array, x: number, y: number, color: number): void {
  if (x < 0 || x >= S || y < 0 || y >= S) return;
  t[y * S + x] = color;
}

function rect(t: Uint32Array, x0: number, y0: number, w: number, h: number, color: number, seed = 0): void {
  const r = color & 0xff;
  const g = (color >>> 8) & 0xff;
  const b = (color >>> 16) & 0xff;
  const a = (color >>> 24) & 0xff;
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      if (x < 0 || x >= S || y < 0 || y >= S) continue;
      const n = seed === 0 ? 0 : noise(x, y, seed) * 18 - 8;
      put(t, x, y, rgba(clamp(r + n), clamp(g + n), clamp(b + n), a));
    }
  }
}

function ellipse(t: Uint32Array, cx: number, cy: number, rx: number, ry: number, color: number, seed: number): void {
  const r = color & 0xff;
  const g = (color >>> 8) & 0xff;
  const b = (color >>> 16) & 0xff;
  const a = (color >>> 24) & 0xff;
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      const d = dx * dx + dy * dy;
      if (d > 1) continue;
      const n = noise(x, y, seed) * 18 - 7;
      put(t, x, y, rgba(clamp(r + n), clamp(g + n), clamp(b + n), a));
    }
  }
}

function ellipseBand(t: Uint32Array, cx: number, cy: number, rx: number, ry: number, thick: number, color: number): void {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > 1 || d < 1 - thick) continue;
      put(t, x, y, color);
    }
  }
}

export function generateSprite(): Uint32Array {
  const t = new Uint32Array(S * S).fill(CLEAR);
  const cx = S / 2;

  rect(t, 18, 47, 20, 7, rgba(38, 41, 42), 7130);
  rect(t, 25, 50, 21, 7, rgba(28, 30, 31), 7131);
  for (let x = 17; x < 47; x += 4) rect(t, x, 55, 3, 4, rgba(18, 19, 20));

  ellipse(t, cx, 32, 18, 17, rgba(56, 62, 65), 7101);
  ellipse(t, cx - 2, 32, 12, 19, rgba(34, 38, 40), 7102);
  ellipseBand(t, cx, 27, 18, 7, 0.26, rgba(34, 118, 154));
  ellipseBand(t, cx, 36, 18, 7, 0.25, rgba(42, 154, 198));

  for (let y = 23; y < 43; y += 5) {
    for (let x = 17; x < 48; x++) {
      if (noise(x, y, 7110) > 0.28) put(t, x, y, rgba(26, 92, 126));
    }
  }

  rect(t, 11, 24, 11, 5, rgba(70, 49, 36), 7120);
  rect(t, 9, 16, 5, 14, rgba(48, 52, 52), 7121);
  rect(t, 42, 18, 8, 5, rgba(70, 49, 36), 7122);
  rect(t, 49, 20, 5, 14, rgba(46, 50, 51), 7123);
  ellipseBand(t, 14, 18, 7, 7, 0.22, rgba(82, 54, 38));
  ellipseBand(t, 49, 32, 8, 8, 0.20, rgba(82, 54, 38));

  rect(t, 39, 29, 13, 7, rgba(28, 32, 34), 7140);
  rect(t, 50, 30, 7, 5, rgba(22, 24, 25), 7141);
  ellipse(t, 57, 32, 4, 4, rgba(210, 236, 238), 7142);
  ellipse(t, 57, 32, 2, 2, rgba(255, 246, 210), 7143);
  put(t, 58, 32, rgba(255, 255, 250));

  for (let i = 0; i < 30; i++) {
    const x = 19 + Math.floor(noise(i, 5, 7150) * 27);
    const y = 18 + Math.floor(noise(i, 9, 7151) * 29);
    const rust = noise(x, y, 7152);
    if (rust > 0.55) put(t, x, y, rgba(126, 62, 35));
  }

  for (let y = 15; y < 55; y += 8) {
    put(t, 20, y, rgba(120, 196, 220));
    put(t, 21, y, rgba(52, 128, 168));
    put(t, 45, y + 2, rgba(120, 196, 220));
    put(t, 46, y + 2, rgba(52, 128, 168));
  }

  return t;
}
