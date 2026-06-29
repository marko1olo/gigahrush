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

/** Safely put a color pixel (bounds checked) */
export function put(t: Uint32Array, x: number, y: number, color: number): void {
  const px = Math.floor(x);
  const py = Math.floor(y);
  if (px >= 0 && px < S && py >= 0 && py < S) t[py * S + px] = color;
}

/** Safely put an RGBA pixel (bounds checked) */
export function putRGB(t: Uint32Array, x: number, y: number, r: number, g: number, b: number, a = 255): void {
  const px = Math.floor(x);
  const py = Math.floor(y);
  if (px >= 0 && px < S && py >= 0 && py < S) t[py * S + px] = rgba(r, g, b, a);
}
