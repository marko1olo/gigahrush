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



/** Add a border around non-transparent pixels */
export function outline(t: Uint32Array, color: number, alphaThreshold = 0, thickness = 1) {
  const edges: number[] = [];
  const size = Math.sqrt(t.length) | 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = y * size + x;
      const alpha = (t[idx] >>> 24) & 0xff;
      if (alpha <= alphaThreshold) {
        let nearSolid = false;
        for (let dy = -thickness; dy <= thickness; dy++) {
          for (let dx = -thickness; dx <= thickness; dx++) {
            if (dx * dx + dy * dy <= thickness * thickness) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
                const nIdx = ny * size + nx;
                const nAlpha = (t[nIdx] >>> 24) & 0xff;
                if (nAlpha > alphaThreshold) {
                  nearSolid = true;
                  break;
                }
              }
            }
          }
          if (nearSolid) break;
        }
        if (nearSolid) edges.push(idx);
      }
    }
  }
  for (let i = 0; i < edges.length; i++) {
    t[edges[i]] = color;
  }
}

/** Apply a simple gradient shading across the existing pixels for volume */
export function applyGradientShading(t: Uint32Array, angle: number, strength: number = 0.5) {
  const size = Math.sqrt(t.length) | 0;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = y * size + x;
      const px = t[idx];
      const a = (px >>> 24) & 0xff;
      if (a > 0) {
        const r = px & 0xff;
        const g = (px >>> 8) & 0xff;
        const b = (px >>> 16) & 0xff;
        const proj = (x / size - 0.5) * dx + (y / size - 0.5) * dy;
        const light = 1.0 - proj * strength;
        t[idx] = rgba(clamp(r * light), clamp(g * light), clamp(b * light), a);
      }
    }
  }
}
