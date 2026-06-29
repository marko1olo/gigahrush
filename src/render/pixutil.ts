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

/** Put a pixel at (x, y) if it is within texture bounds */
export function put(t: Uint32Array, x: number, y: number, color: number): void {
  if (x >= 0 && x < S && y >= 0 && y < S) t[y * S + x] = color;
}

/** Draw a line from (x0, y0) to (x1, y1) */
export function line(t: Uint32Array, x0: number, y0: number, x1: number, y1: number, color: number): void {
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
  for (let i = 0; i <= steps; i++) {
    const k = i / steps;
    put(t, Math.round(x0 + (x1 - x0) * k), Math.round(y0 + (y1 - y0) * k), color);
  }
}
