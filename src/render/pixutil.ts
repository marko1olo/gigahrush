/* ── Shared pixel utilities for procedural sprites & textures ── */

import { TEX } from '../core/types';

export const S = TEX;

/** Pack RGBA into little-endian uint32 (0xAABBGGRR) */
export function rgba(r: number, g: number, b: number, a = 255): number {
  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0;
}

/** Fast deterministic hash noise in [0,1] */
export function noise(x: number, y: number, s: number): number {
  let n = (x * 374761393 + y * 668265263 + s * 1274126177) | 0;
  n = (n ^ (n >> 13)) * 1103515245; n = n ^ (n >> 16);
  return (n & 0x7fff) / 0x7fff;
}

/** Clamp value to 0..255 */
export const clamp = (v: number) => v < 0 ? 0 : v > 255 ? 255 : v;

/** Transparent pixel */
export const CLEAR = rgba(0, 0, 0, 0);

/** Automatically add a solid outline around non-clear pixels */
export function outline(t: Uint32Array, color: number) {
  const edge = new Uint8Array(S * S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const idx = y * S + x;
      if (t[idx] === CLEAR) {
        if ((x > 0 && t[idx - 1] !== CLEAR) ||
            (x < S - 1 && t[idx + 1] !== CLEAR) ||
            (y > 0 && t[idx - S] !== CLEAR) ||
            (y < S - 1 && t[idx + S] !== CLEAR) ||
            (x > 0 && y > 0 && t[idx - S - 1] !== CLEAR) ||
            (x < S - 1 && y > 0 && t[idx - S + 1] !== CLEAR) ||
            (x > 0 && y < S - 1 && t[idx + S - 1] !== CLEAR) ||
            (x < S - 1 && y < S - 1 && t[idx + S + 1] !== CLEAR)) {
          edge[idx] = 1;
        }
      }
    }
  }
  for (let i = 0; i < S * S; i++) {
    if (edge[i]) t[i] = color;
  }
}
