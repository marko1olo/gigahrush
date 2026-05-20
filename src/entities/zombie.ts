/* ── Zombie — humanoid undead (мертвяк) ───────────────────────── */

import { FloorLevel, MonsterKind } from '../core/types';
import type { MonsterDef } from './monster';
import { S, rgba, noise, clamp, CLEAR } from '../render/pixutil';

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
  const cx = S / 2;
  // Head — sickly green-grey
  for (let y = 4; y < 18; y++) for (let x = cx - 5; x < cx + 5; x++) {
    if (x < 0 || x >= S) continue;
    const dx = (x - cx) / 5, dy = (y - 11) / 7;
    if (dx * dx + dy * dy < 1) {
      const n = noise(x, y, 901) * 20;
      t[y * S + x] = rgba(clamp(80 + n), clamp(95 + n), clamp(70 + n));
    }
  }
  // Eyes — dead white with tiny dark pupil
  t[10 * S + (cx - 2)] = rgba(200, 200, 190);
  t[10 * S + (cx + 2)] = rgba(200, 200, 190);
  t[11 * S + (cx - 2)] = rgba(30, 10, 10);
  t[11 * S + (cx + 2)] = rgba(30, 10, 10);
  // Mouth — dark gash
  for (let x = cx - 3; x <= cx + 3; x++) {
    t[14 * S + x] = rgba(40, 15, 15);
    if (noise(x, 14, 902) > 0.5) t[15 * S + x] = rgba(50, 20, 20);
  }
  // Torso — tattered domestic clothes over rotting skin
  for (let y = 18; y < 44; y++) {
    const halfW = 7 + Math.sin(y * 0.2) * 1.5;
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
  for (let y = 20; y < 35; y++) {
    const wobble = Math.floor(Math.sin(y * 0.7) * 1.5);
    t[y * S + cx + wobble] = rgba(122, 116, 92);
    if (y > 25 && y < 32) t[y * S + cx + wobble + 1] = rgba(70, 64, 42);
  }
  for (let y = 21; y < 37; y++) {
    if ((y & 3) === 0) continue;
    t[y * S + (cx - 4)] = rgba(135, 128, 112);
    t[y * S + (cx + 4)] = rgba(135, 128, 112);
  }
  // Arms — dangling, one shorter (torn)
  for (let y = 20; y < 40; y++) {
    const lx = Math.floor(cx - 8 - (y - 20) * 0.15);
    const rx = Math.floor(cx + 8 + (y - 20) * 0.1);
    if (lx >= 0) {
      const n = noise(lx, y, 905) * 15;
      t[y * S + lx] = rgba(clamp(70 + n), clamp(85 + n), clamp(60 + n));
    }
    if (rx < S && y < 36) {
      const n = noise(rx, y, 906) * 15;
      t[y * S + rx] = rgba(clamp(70 + n), clamp(85 + n), clamp(60 + n));
    }
  }
  // Legs
  for (let y = 44; y < 60; y++) {
    const n = noise(cx - 3, y, 907) * 15;
    t[y * S + (cx - 3)] = rgba(clamp(55 + n), clamp(50 + n), clamp(45 + n));
    t[y * S + (cx - 2)] = rgba(clamp(55 + n), clamp(50 + n), clamp(45 + n));
    t[y * S + (cx + 2)] = rgba(clamp(55 + n), clamp(50 + n), clamp(45 + n));
    t[y * S + (cx + 3)] = rgba(clamp(55 + n), clamp(50 + n), clamp(45 + n));
  }
  t[60 * S + (cx - 4)] = rgba(85, 45, 35);
  t[60 * S + (cx - 3)] = rgba(85, 45, 35);
  t[60 * S + (cx + 2)] = rgba(38, 38, 42);
  t[60 * S + (cx + 3)] = rgba(38, 38, 42);
  // Blood splatters
  for (let i = 0; i < 12; i++) {
    const bx = Math.floor(cx - 6 + noise(i, 0, 908) * 12);
    const by = Math.floor(20 + noise(0, i, 909) * 30);
    if (bx >= 0 && bx < S && by < S && t[by * S + bx] !== CLEAR) {
      t[by * S + bx] = rgba(clamp(100 + noise(bx, by, 910) * 30), 20, 15);
    }
  }
  return t;
}
