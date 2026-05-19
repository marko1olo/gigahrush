import { FloorLevel } from '../core/types';
import { RESOURCES } from './resources';

export interface ResourceStock {
  stock: number;
  target: number;
  lastDelta: number;
}

export interface EconomyFloorState {
  floor: FloorLevel;
  resources: Record<string, ResourceStock>;
  lastTickAt: number;
}

export interface EconomyState {
  floors: Partial<Record<FloorLevel, EconomyFloorState>>;
  priceVersion: number;
}

export function createEconomyState(): EconomyState {
  return { floors: {}, priceVersion: 1 };
}

export function createEconomyFloorState(floor: FloorLevel): EconomyFloorState {
  const resources: Record<string, ResourceStock> = {};
  for (const r of RESOURCES) resources[r.id] = { stock: r.baseStock, target: r.baseStock, lastDelta: 0 };
  return { floor, resources, lastTickAt: 0 };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function finiteOr(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isFinite(value) ? value : fallback;
}

export function normalizeEconomyState(value: unknown): EconomyState {
  const src = (value && typeof value === 'object') ? value as Partial<EconomyState> : {};
  const out = createEconomyState();
  out.priceVersion = Math.max(1, Math.floor(finiteOr(src.priceVersion, 1)));
  if (src.floors) {
    for (const k of Object.keys(src.floors)) {
      const floor = Number(k) as FloorLevel;
      const existing = src.floors[floor];
      const normalized = createEconomyFloorState(floor);
      if (existing?.resources) {
        for (const r of RESOURCES) {
          const v = existing.resources[r.id];
          if (v) {
            const target = clamp(finiteOr(v.target, r.baseStock), 1, r.baseStock * 4);
            normalized.resources[r.id] = {
              stock: clamp(finiteOr(v.stock, r.baseStock), 0, target * 2),
              target,
              lastDelta: clamp(finiteOr(v.lastDelta, 0), -target, target),
            };
          }
        }
      }
      normalized.lastTickAt = existing?.lastTickAt ?? 0;
      out.floors[floor] = normalized;
    }
  }
  return out;
}
