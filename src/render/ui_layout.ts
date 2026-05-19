const GRID_COLS = 5;
const GRID_CELL_UNITS = 22;
const GRID_GAP_UNITS = 24;
const GRID_SCREEN_W = 0.88;
const GRID_SCREEN_H = 0.78;
const GRID_SCALE_MAX = 4;
const GRID_SCALE_TARGET_MIN = 2.2;

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function dialogMenuScale(canvasW: number, canvasH: number, sx: number, sy: number): number {
  const raw = Math.min(canvasW / 320, canvasH / 200);
  return Math.max(sx, sy, clamp(raw, 1, 3.35));
}

function inventoryGridScale(canvasW: number, canvasH: number, verticalUnits: number): number {
  const raw = Math.min(canvasW / 320, canvasH / 200);
  const twoGridUnits = GRID_CELL_UNITS * GRID_COLS * 2 + GRID_GAP_UNITS;
  const byW = (canvasW * GRID_SCREEN_W) / twoGridUnits;
  const byH = (canvasH * GRID_SCREEN_H) / verticalUnits;
  const fit = Math.min(raw, byW, byH);
  const minScale = Math.max(1, Math.min(GRID_SCALE_TARGET_MIN, byW, byH));
  return clamp(fit, Math.min(minScale, fit), GRID_SCALE_MAX);
}

export function tradeGridScale(canvasW: number, canvasH: number): number {
  return inventoryGridScale(canvasW, canvasH, 28 + GRID_CELL_UNITS * GRID_COLS + 58);
}

export function containerGridScale(canvasW: number, canvasH: number): number {
  return inventoryGridScale(canvasW, canvasH, 30 + GRID_CELL_UNITS * GRID_COLS + 66);
}
