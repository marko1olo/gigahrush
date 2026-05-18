/* ── Eye — flying demonic eye (глаз) ──────────────────────────── */
/*   Ranged monster: shoots projectiles like a cacodemon.        */

import { FloorLevel, MonsterKind } from '../core/types';
import type { MonsterDef } from './monster';
import { S, rgba, noise, clamp, CLEAR } from '../render/pixutil';

export const DEF: MonsterDef = {
  kind: MonsterKind.EYE,
  name: 'Глаз',
  hp: 20,
  speed: 2.2,
  dmg: 14,
  attackRate: 2.5,
  sprite: 0,   // auto-assigned by generateSprites()
  isRanged: true,
  projSpeed: 8,
  projSprite: 0,        // auto-assigned to Spr.EYE_BOLT
  floors: [FloorLevel.MINISTRY, FloorLevel.LIVING, FloorLevel.MAINTENANCE, FloorLevel.HELL, FloorLevel.VOID],
  counterplay: 'Ломайте линию огня и сближайтесь после выстрела: Глаз держит прямой коридор, но платит длинной паузой.',
  lootHint: 'перегоревшие нити, стеклянная пыль, редкая лампа или ПСИ-пыль',
};

export function generateSprite(): Uint32Array {
  const t = new Uint32Array(S * S).fill(CLEAR);
  const cx = S / 2, cy = S / 2;
  // Spherical body — fleshy red-pink
  for (let y = 8; y < 56; y++) for (let x = 8; x < 56; x++) {
    const dx = (x - cx) / 22, dy = (y - cy) / 22;
    const d2 = dx * dx + dy * dy;
    if (d2 < 1) {
      const n = noise(x, y, 1001) * 20;
      const shade = Math.sqrt(d2) * 40;
      t[y * S + x] = rgba(
        clamp(150 + n - shade),
        clamp(50 + n - shade),
        clamp(55 + n - shade),
      );
    }
  }
  // Veins — darker red lines radiating from center
  for (let i = 0; i < 8; i++) {
    const ang = i * Math.PI / 4 + noise(i, 0, 1002) * 0.5;
    for (let r = 8; r < 20; r++) {
      const vx = Math.floor(cx + Math.cos(ang) * r + noise(r, i, 1003) * 2);
      const vy = Math.floor(cy + Math.sin(ang) * r + noise(i, r, 1004) * 2);
      if (vx >= 0 && vx < S && vy >= 0 && vy < S && t[vy * S + vx] !== CLEAR) {
        t[vy * S + vx] = rgba(100, 20, 25);
      }
    }
  }
  // Giant central eye — white sclera
  for (let y = cy - 10; y < cy + 10; y++) for (let x = cx - 12; x < cx + 12; x++) {
    const dx = (x - cx) / 12, dy = (y - cy) / 10;
    if (dx * dx + dy * dy < 1) {
      t[y * S + x] = rgba(230, 225, 210);
    }
  }
  // Iris — sickly yellow-green
  for (let y = cy - 6; y < cy + 6; y++) for (let x = cx - 6; x < cx + 6; x++) {
    const dx = (x - cx) / 6, dy = (y - cy) / 6;
    if (dx * dx + dy * dy < 1) {
      const n = noise(x, y, 1005) * 30;
      t[y * S + x] = rgba(clamp(180 + n), clamp(200 + n), clamp(40 + n));
    }
  }
  // Pupil — vertical slit (reptilian)
  for (let y = cy - 5; y < cy + 5; y++) {
    const slitW = Math.max(1, 2 - Math.abs(y - cy) * 0.3);
    for (let x = Math.floor(cx - slitW); x <= Math.floor(cx + slitW); x++) {
      if (x >= 0 && x < S) t[y * S + x] = rgba(5, 5, 5);
    }
  }
  // Small tentacles hanging below
  for (let i = -2; i <= 2; i++) {
    const tx = cx + i * 4;
    for (let y = cy + 20; y < cy + 20 + 4 + Math.floor(noise(i + 3, 0, 1006) * 6); y++) {
      if (y < S && tx >= 0 && tx < S) {
        const n = noise(tx, y, 1007) * 15;
        t[y * S + tx] = rgba(clamp(120 + n), clamp(40 + n), clamp(45 + n));
      }
    }
  }
  return t;
}

/* ── Eye bolt projectile sprite ───────────────────────────────── */
export function generateBoltSprite(): Uint32Array {
  const t = new Uint32Array(S * S).fill(CLEAR);
  const cx = S / 2, cy = S / 2;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const dx = x - cx;
    const dy = y - cy;
    const d = Math.sqrt(dx * dx + dy * dy);
    const ring = Math.abs(d - 9);
    const core = d < 5;
    const halo = d < 16;
    const ray = (Math.abs(dx) < 1.4 && Math.abs(dy) < 17) || (Math.abs(dy) < 1.4 && Math.abs(dx) < 17);
    const spark = noise(x * 2, y * 2, 1301) > 0.88 && d < 18;
    if (!core && !halo && !ray && !spark) continue;

    const f = Math.max(0, 1 - d / 16);
    const ringGlow = Math.max(0, 1 - ring / 2.5);
    const rayGlow = ray ? Math.max(0, 1 - d / 18) : 0;
    const sparkGlow = spark ? 0.45 + noise(x, y, 1302) * 0.35 : 0;
    const bright = Math.max(f, ringGlow * 0.8, rayGlow * 0.65, sparkGlow);
    const a = clamp(Math.floor(45 + bright * 210));
    t[y * S + x] = rgba(
      clamp(Math.floor(90 + bright * 165)),
      clamp(Math.floor(190 + bright * 65)),
      clamp(Math.floor(35 + bright * 70)),
      a,
    );
  }
  return t;
}
