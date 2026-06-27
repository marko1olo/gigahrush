/* ── Zombie — humanoid undead (мертвяк) ───────────────────────── */

import { FloorLevel, MonsterKind } from '../core/types';
import type { MonsterDef } from './monster';
import { S, rgba, noise, clamp, CLEAR, outline } from '../render/pixutil';

export const DEF: MonsterDef = {
  kind: MonsterKind.ZOMBIE,
  name: 'Мертвяк',
  hp: 35,
  speed: 1.4,
  dmg: 8,
  attackRate: 1.5,
  sprite: 0,   // auto-assigned by generateSprites()
  floors: [FloorLevel.MINISTRY, FloorLevel.KVARTIRY, FloorLevel.LIVING, FloorLevel.MAINTENANCE, FloorLevel.HELL],
  counterplay: 'Опасен толпой и дверью: вытяните из кухни, очереди или палаты в пустой проход и добейте до первого хвата.',
  lootHint: 'карманный бытовой хлам, чужая записка, редкие сигареты',
};

export function generateSprite(): Uint32Array {
  const t = new Uint32Array(S * S).fill(CLEAR);
  const sc = S / 64;
  const cx = S / 2;
  // Head — sickly green-grey
  for (let y = 4 * sc; y < 18 * sc; y++) for (let x = cx - 5 * sc; x < cx + 5 * sc; x++) {
    if (x < 0 || x >= S) continue;
    const dx = (x - cx) / (5 * sc), dy = (y - 11 * sc) / (7 * sc);
    if (dx * dx + dy * dy < 1) {
      const n = noise(x, y, 901) * 20;
      t[y * S + x] = rgba(clamp(80 + n), clamp(95 + n), clamp(70 + n));
    }
  }
  // Eyes — dead white with tiny dark pupil
  t[Math.floor(10 * sc) * S + Math.floor(cx - 2 * sc)] = rgba(200, 200, 190);
  t[Math.floor(10 * sc) * S + Math.floor(cx + 2 * sc)] = rgba(200, 200, 190);
  t[Math.floor(11 * sc) * S + Math.floor(cx - 2 * sc)] = rgba(30, 10, 10);
  t[Math.floor(11 * sc) * S + Math.floor(cx + 2 * sc)] = rgba(30, 10, 10);
  // Mouth — dark gash
  for (let x = cx - 3 * sc; x <= cx + 3 * sc; x++) {
    t[Math.floor(14 * sc) * S + Math.floor(x)] = rgba(40, 15, 15);
    if (noise(x, 14 * sc, 902) > 0.5) t[Math.floor(15 * sc) * S + Math.floor(x)] = rgba(50, 20, 20);
  }
  // Torso — tattered domestic clothes over rotting skin
  for (let y = 18 * sc; y < 44 * sc; y++) {
    const halfW = (7 + Math.sin(y / sc * 0.2) * 1.5) * sc;
    for (let x = Math.floor(cx - halfW); x < Math.floor(cx + halfW); x++) {
      if (x < 0 || x >= S) continue;
      const n = noise(x, y, 903) * 25;
      const cloth = noise(x * 2, y * 2, 904) > 0.6;
      if (cloth) {
        t[y * S + x] = rgba(clamp(46 + n), clamp(58 + n), clamp(78 + n));
      } else {
        t[y * S + x] = rgba(clamp(75 + n), clamp(90 + n), clamp(65 + n));
      }
    }
  }
  // Faded undershirt and apartment key on a string
  for (let y = 20 * sc; y < 35 * sc; y++) {
    const wobble = Math.floor(Math.sin(y / sc * 0.7) * 1.5 * sc);
    t[y * S + cx + wobble] = rgba(122, 116, 92);
    if (y > 25 * sc && y < 32 * sc) t[y * S + cx + wobble + 1] = rgba(70, 64, 42);
  }
  for (let y = 21 * sc; y < 37 * sc; y++) {
    if ((y & 3) === 0) continue;
    t[y * S + Math.floor(cx - 4 * sc)] = rgba(135, 128, 112);
    t[y * S + Math.floor(cx + 4 * sc)] = rgba(135, 128, 112);
  }
  // Arms — dangling, one shorter (torn)
  for (let y = 20 * sc; y < 40 * sc; y++) {
    const lx = Math.floor(cx - 8 * sc - (y - 20 * sc) * 0.15);
    const rx = Math.floor(cx + 8 * sc + (y - 20 * sc) * 0.1);
    if (lx >= 0) {
      const n = noise(lx, y, 905) * 15;
      t[y * S + lx] = rgba(clamp(70 + n), clamp(85 + n), clamp(60 + n));
    }
    if (rx < S && y < 36 * sc) {
      const n = noise(rx, y, 906) * 15;
      t[y * S + rx] = rgba(clamp(70 + n), clamp(85 + n), clamp(60 + n));
    }
  }
  // Legs
  for (let y = 44 * sc; y < 60 * sc; y++) {
    const n = noise(cx - 3 * sc, y, 907) * 15;
    t[y * S + Math.floor(cx - 3 * sc)] = rgba(clamp(55 + n), clamp(50 + n), clamp(45 + n));
    t[y * S + Math.floor(cx - 2 * sc)] = rgba(clamp(55 + n), clamp(50 + n), clamp(45 + n));
    t[y * S + Math.floor(cx + 2 * sc)] = rgba(clamp(55 + n), clamp(50 + n), clamp(45 + n));
    t[y * S + Math.floor(cx + 3 * sc)] = rgba(clamp(55 + n), clamp(50 + n), clamp(45 + n));
  }
  t[Math.floor(60 * sc) * S + Math.floor(cx - 4 * sc)] = rgba(85, 45, 35);
  t[Math.floor(60 * sc) * S + Math.floor(cx - 3 * sc)] = rgba(85, 45, 35);
  t[Math.floor(60 * sc) * S + Math.floor(cx + 2 * sc)] = rgba(38, 38, 42);
  t[Math.floor(60 * sc) * S + Math.floor(cx + 3 * sc)] = rgba(38, 38, 42);
  // Blood splatters
  for (let i = 0; i < 12; i++) {
    const bx = Math.floor(cx - 6 * sc + noise(i, 0, 908) * 12 * sc);
    const by = Math.floor(20 * sc + noise(0, i, 909) * 30 * sc);
    if (bx >= 0 && bx < S && by < S && t[by * S + bx] !== CLEAR) {
      t[by * S + bx] = rgba(clamp(100 + noise(bx, by, 910) * 30), 20, 15);
    }
  }
  outline(t, rgba(15, 20, 15));
  return t;
}
