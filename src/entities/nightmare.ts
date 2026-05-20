/* ── Nightmare — procedural horror (кошмарище) ────────────────── */
/*   Thick fleshy trunk with eye-stalks, gaping mouths, and      */
/*   organic growths. Every nightmare is unique — the seed        */
/*   controls stalk count/placement, mouth positions, body shape. */

import { FloorLevel, MonsterKind } from '../core/types';
import type { MonsterDef } from './monster';
import { S, rgba, noise, clamp, CLEAR } from '../render/pixutil';

export const DEF: MonsterDef = {
  kind: MonsterKind.NIGHTMARE,
  name: 'Кошмарище',
  hp: 260,
  speed: 1.35,
  dmg: 32,
  attackRate: 1.15,
  sprite: 0,   // auto-assigned by generateSprites()
  floors: [FloorLevel.MINISTRY, FloorLevel.LIVING, FloorLevel.MAINTENANCE, FloorLevel.HELL, FloorLevel.VOID],
  counterplay: 'Не играйте в длинный бой: либо сразу вливайте тяжелый урон с выходом за спиной, либо уходите из комнаты до давления.',
  lootHint: 'психический налет, ПСИ-пыль, редкий антидепрессант из мокрой памяти',
};

/* ── Static fallback sprite (used in sprite sheet) ────────────── */
export function generateSprite(): Uint32Array {
  return generateNightmareSprite(666);
}

/* helper: draw filled ellipse */
function ellipse(
  t: Uint32Array, cx: number, cy: number, rx: number, ry: number,
  col: (d: number, x: number, y: number) => number,
) {
  for (let y = Math.max(0, Math.floor(cy - ry)); y <= Math.min(S - 1, Math.ceil(cy + ry)); y++)
    for (let x = Math.max(0, Math.floor(cx - rx)); x <= Math.min(S - 1, Math.ceil(cx + rx)); x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      const d2 = dx * dx + dy * dy;
      if (d2 < 1) t[y * S + x] = col(Math.sqrt(d2), x, y);
    }
}

/* ── Procedural sprite from name hash — each nightmare unique ── */
export function generateNightmareSprite(seed: number): Uint32Array {
  const t = new Uint32Array(S * S).fill(CLEAR);
  const cx = S / 2;

  // Hash-derived parameters
  const numStalks = 3 + (seed % 5);           // 3-7 eye stalks
  const numMouths = 2 + (seed % 3);           // 2-4 mouths
  const bodyHue   = seed % 3;                 // 0=brown, 1=dark-red, 2=grey-flesh
  const numBumps  = 2 + (seed % 4);           // organic lumps on trunk

  const bodyColors: [number, number, number][] = [
    [100, 60, 45],   // reddish brown flesh
    [90, 40, 40],    // dark crimson
    [85, 75, 70],    // grey-flesh
  ];
  const [br, bg, bb] = bodyColors[bodyHue];

  // ── Thick trunk (wide bottom, narrows towards top) ──────────
  const trunkTop = 18, trunkBot = 58;
  const trunkCy = (trunkTop + trunkBot) / 2;
  for (let y = trunkTop; y < trunkBot; y++) {
    // Wider at bottom, narrower at top — organic taper
    const t0 = (y - trunkTop) / (trunkBot - trunkTop); // 0 top .. 1 bottom
    const halfW = 8 + Math.floor(t0 * 12) + Math.floor(noise(y, 0, seed) * 4);
    for (let x = cx - halfW; x <= cx + halfW; x++) {
      if (x < 0 || x >= S) continue;
      const n = noise(x, y, seed + 100) * 25;
      const depth = Math.abs(x - cx) / halfW * 25;
      const vein = Math.sin(x * 0.9 + y * 0.7 + seed) > 0.75 ? 18 : 0;
      const crack = noise(x * 2, y * 2, seed + 101) > 0.92 ? -25 : 0;
      t[y * S + x] = rgba(
        clamp(br + n - depth + vein + crack),
        clamp(bg + n - depth + crack),
        clamp(bb + n - depth + crack),
      );
    }
  }

  // ── Organic bumps / blisters on trunk ───────────────────────
  for (let i = 0; i < numBumps; i++) {
    const bx = cx + Math.floor((noise(i, 5, seed + 110) - 0.5) * 18);
    const by = trunkTop + 8 + Math.floor(noise(5, i, seed + 111) * (trunkBot - trunkTop - 16));
    const bR = 3 + Math.floor(noise(i, i, seed + 112) * 3);
    ellipse(t, bx, by, bR, bR, (d, px, py) => {
      const n = noise(px, py, seed + 113) * 15;
      return rgba(clamp(br + 20 + n - d * 15), clamp(bg + 10 + n - d * 15), clamp(bb + 5 + n));
    });
  }

  // ── Eye-stalks growing from the top ─────────────────────────
  for (let i = 0; i < numStalks; i++) {
    // Base position along upper trunk
    const baseX = cx + Math.floor((noise(i, 0, seed + 200) - 0.5) * 16);
    const baseY = trunkTop + Math.floor(noise(0, i, seed + 201) * 6);
    // Stalk curves upward with slight random lean
    const lean = (noise(i, 1, seed + 202) - 0.5) * 1.5;
    const stalkLen = 10 + Math.floor(noise(1, i, seed + 203) * 8);
    let sx = baseX, sy = baseY;
    for (let j = 0; j < stalkLen; j++) {
      sy--;
      sx += Math.floor(lean + (noise(j, i, seed + 204) - 0.5) * 1.6);
      if (sx < 1 || sx >= S - 1 || sy < 0) break;
      const n = noise(sx, sy, seed + 205) * 15;
      // Thick stalk (2-3 px wide)
      t[sy * S + sx] = rgba(clamp(br - 5 + n), clamp(bg - 5 + n), clamp(bb - 5 + n));
      t[sy * S + sx + 1] = rgba(clamp(br - 10 + n), clamp(bg - 10 + n), clamp(bb - 10 + n));
      if (noise(j, i, seed + 206) > 0.5)
        t[sy * S + sx - 1] = rgba(clamp(br - 12 + n), clamp(bg - 12 + n), clamp(bb - 12 + n));
    }
    // Eyeball at tip
    const eyeR = 3 + Math.floor(noise(i, i, seed + 210) * 2);
    ellipse(t, sx, sy, eyeR, eyeR, (d) =>
      d < 0.45 ? (noise(i, 3, seed + 211) > 0.5 ? rgba(10, 5, 5) : rgba(180, 20, 20))
               : rgba(220, 215, 180));
    // Glow ring around eye (reddish)
    ellipse(t, sx, sy, eyeR + 1, eyeR + 1, (d, px, py) => {
      if (d < 0.7) return t[py * S + px]; // keep inner pixels
      return rgba(clamp(br + 40), clamp(bg - 10), clamp(bb - 10));
    });
  }

  // ── Mouths — gaping dark holes with teeth on the trunk ──────
  for (let i = 0; i < numMouths; i++) {
    const my = trunkCy + Math.floor((noise(i, 1, seed + 300) - 0.3) * 18);
    const mw = 4 + Math.floor(noise(1, i, seed + 301) * 6);
    const mh = 2 + Math.floor(noise(i, 2, seed + 302) * 2);
    const mx = Math.floor(cx + (noise(i, 3, seed + 303) - 0.5) * 14 - mw / 2);
    // Dark mouth interior
    for (let dy = 0; dy < mh; dy++) for (let x = mx; x < mx + mw; x++) {
      const py = my + dy;
      if (x < 0 || x >= S || py < 0 || py >= S) continue;
      if (t[py * S + x] === CLEAR) continue;
      t[py * S + x] = rgba(25, 8, 12);
    }
    // Teeth — top row
    for (let x = mx; x < mx + mw; x++) {
      if (x < 0 || x >= S || my - 1 < 0) continue;
      if (t[my * S + x] === CLEAR) continue;
      if (noise(x, my, seed + 304) > 0.35) {
        t[(my - 1) * S + x] = rgba(210, 200, 170);
        if (noise(x, my, seed + 306) > 0.6 && my - 2 >= 0)
          t[(my - 2) * S + x] = rgba(200, 190, 160);
      }
    }
    // Teeth — bottom row
    for (let x = mx; x < mx + mw; x++) {
      const py = my + mh;
      if (x < 0 || x >= S || py >= S) continue;
      if (noise(x, py, seed + 305) > 0.4) {
        t[py * S + x] = rgba(210, 200, 170);
      }
    }
  }

  // ── Small tentacle / root tendrils at the very bottom ───────
  const tendrils = 3 + (seed % 4);
  for (let i = 0; i < tendrils; i++) {
    let tx = cx + Math.floor((noise(i, 4, seed + 400) - 0.5) * 20);
    let ty = trunkBot - 1;
    const len = 3 + Math.floor(noise(4, i, seed + 401) * 5);
    for (let j = 0; j < len; j++) {
      tx += Math.floor((noise(j, i, seed + 402) - 0.5) * 2.5);
      ty++;
      if (tx < 0 || tx >= S || ty >= S) break;
      const n = noise(tx, ty, seed + 403) * 12;
      t[ty * S + tx] = rgba(clamp(br - 15 + n), clamp(bg - 15 + n), clamp(bb - 15 + n));
      if (tx + 1 < S) t[ty * S + tx + 1] = rgba(clamp(br - 20 + n), clamp(bg - 20 + n), clamp(bb - 20 + n));
    }
  }

  return t;
}
