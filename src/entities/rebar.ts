/* ── Rebar — inorganic rebar monster (арматура) ───────────────── */
/*   Constructed from twisted construction rebar and concrete.   */
/*   Looks like animated building materials — rods, wires, rust. */

import { FloorLevel, MonsterKind } from '../core/types';
import type { MonsterDef } from './monster';
import { S, rgba, noise, clamp, CLEAR } from '../render/pixutil';

export const DEF: MonsterDef = {
  kind: MonsterKind.REBAR,
  name: 'Арматура',
  hp: 210,
  speed: 0.82,
  dmg: 24,
  attackRate: 2.4,
  sprite: 0,   // auto-assigned by generateSprites()
  floors: [FloorLevel.LIVING, FloorLevel.MAINTENANCE, FloorLevel.HELL, FloorLevel.VOID],
  counterplay: 'Не наступайте на ровное железо у стеллажей: отходите в широкий проход, бейте с дистанции и не деритесь голыми руками.',
  lootHint: 'тяжелый металл, витая проволока и редкая годная арматура',
};

export function generateSprite(): Uint32Array {
  const t = new Uint32Array(S * S).fill(CLEAR);
  const cx = Math.floor(S / 2);

  const put = (x: number, y: number, color: number): void => {
    const px = Math.floor(x);
    const py = Math.floor(y);
    if (px < 0 || px >= S || py < 0 || py >= S) return;
    t[py * S + px] = color;
  };

  const metal = (x: number, y: number, bright = 0): number => {
    const n = noise(x * 3, y * 2, 1201) * 28;
    const rust = noise(x * 5, y * 3, 1202) > 0.66 ? 48 : 0;
    return rgba(
      clamp(62 + n + bright + rust),
      clamp(58 + n + bright * 0.5 - rust * 0.18),
      clamp(55 + n + bright * 0.35 - rust * 0.45),
    );
  };

  // Broad dark scrap base keeps the threat from reading as a thin harmless line.
  for (let y = 47; y < 61; y++) {
    for (let x = cx - 17; x <= cx + 18; x++) {
      const dx = (x - cx) / 18;
      const dy = (y - 54) / 8;
      if (dx * dx + dy * dy > 1.05 || noise(x, y, 1211) < 0.18) continue;
      put(x, y, rgba(36, 32, 29));
    }
  }

  // Concrete knots on the frame: readable storage/production debris, not corpse loot.
  const chunks = [
    { x: cx - 9, y: 15, r: 4 },
    { x: cx + 8, y: 22, r: 5 },
    { x: cx - 6, y: 38, r: 5 },
    { x: cx + 7, y: 45, r: 4 },
  ];
  for (const chunk of chunks) {
    for (let dy = -chunk.r; dy <= chunk.r; dy++) for (let dx = -chunk.r; dx <= chunk.r; dx++) {
      if (dx * dx + dy * dy > chunk.r * chunk.r || noise(dx, dy, 1207) < 0.08) continue;
      const px = chunk.x + dx;
      const py = chunk.y + dy;
      const n = noise(px, py, 1208) * 26;
      const crack = noise(px * 3, py * 3, 1209) > 0.78 ? -34 : 0;
      put(px, py, rgba(clamp(106 + n + crack), clamp(101 + n + crack), clamp(95 + n + crack)));
    }
  }

  // Main vertical rods: four jagged bars with exposed bright edges.
  const rods = [cx - 9, cx - 3, cx + 3, cx + 9];
  for (const rx of rods) {
    for (let y = 3; y < 59; y++) {
      const jitter = noise(rx, y, 1212) > 0.82 ? (rx < cx ? -1 : 1) : 0;
      const x = rx + jitter;
      put(x, y, metal(x, y, 8));
      put(x + 1, y, metal(x + 1, y));
      if (noise(x, y, 1213) > 0.72) put(x - 1, y, rgba(31, 28, 25));
    }
  }

  // Cross-braces and shelf-flat bars sell the "do not step on/punch iron" cue.
  for (let y = 11; y < 55; y += 7) {
    const lean = y % 14 === 0 ? -1 : 1;
    for (let x = cx - 14; x <= cx + 15; x++) {
      const py = y + Math.floor((x - cx) * 0.08 * lean);
      put(x, py, metal(x, py, 4));
      if (noise(x, py, 1214) > 0.6) put(x, py + 1, rgba(44, 39, 34));
    }
  }
  for (let y = 49; y <= 57; y += 4) {
    for (let x = cx - 18; x <= cx + 18; x++) {
      if (noise(x, y, 1215) < 0.12) continue;
      put(x, y, metal(x, y, x % 7 === 0 ? 18 : 0));
    }
  }

  // Twisted wire wrapping and loose hooks.
  for (let y = 7; y < 57; y++) {
    const waveX = cx + Math.sin(y * 0.48) * 11;
    put(waveX, y, rgba(49, 44, 39));
    if (y % 9 === 0) put(waveX + 1, y, rgba(112, 75, 54));
  }
  for (let y = 5; y < 38; y++) {
    put(cx - 18 + y * 0.22, y, metal(cx - 18 + y * 0.22, y, 12));
    put(cx + 18 - y * 0.18, y + 4, metal(cx + 18 - y * 0.18, y + 4, 12));
  }

  // Sparking eyes/glints in the top gaps, small but hot against cold metal.
  const eyeY = 9;
  for (const ex of [cx - 4, cx + 4]) {
    put(ex, eyeY, rgba(255, 68, 28));
    put(ex + 1, eyeY, rgba(255, 126, 38));
    put(ex, eyeY + 1, rgba(178, 34, 22));
  }
  put(cx - 12, 27, rgba(242, 92, 36));
  put(cx + 12, 35, rgba(246, 128, 42));

  // Protruding rebar tips at head height.
  for (let y = 0; y < 7; y++) {
    put(cx - 7, y, metal(cx - 7, y, 16));
    put(cx + 8, y, metal(cx + 8, y, 16));
    if (y > 2) put(cx, y - 1, metal(cx, y - 1, 10));
  }

  return t;
}
