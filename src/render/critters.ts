import { crittersEnabled } from '../systems/ui_orchestrator';
import { seededRandom } from '../core/rand';

export type CritterType = 'rat' | 'roach' | 'fly';

export interface Critter {
  active: boolean;
  type: CritterType;
  x: number;
  y: number;
  z: number;
  targetX: number;
  targetY: number;
  speed: number;
  phase: number;
}

export const MAX_CRITTERS = 64;
export const CRITTERS_POOL: Critter[] = Array.from({ length: MAX_CRITTERS }, () => ({
  active: false, type: 'roach', x: 0, y: 0, z: 0, targetX: 0, targetY: 0, speed: 1, phase: 0
}));

const critterRandom = seededRandom(1337);

export function updateCritters(dt: number, fps?: number): void {
  if (!getCritterRenderEnabled(fps)) return;

  for (let i = 0; i < MAX_CRITTERS; i++) {
    const c = CRITTERS_POOL[i];
    if (!c.active) continue;

    const dx = c.targetX - c.x;
    const dy = c.targetY - c.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 0.1) {
      pickNewCritterTarget(c);
    } else {
      c.x += (dx / dist) * c.speed * dt;
      c.y += (dy / dist) * c.speed * dt;
    }
  }
}

function pickNewCritterTarget(c: Critter): void {
  if (critterRandom() > 0.05) return;

  const tx = Math.round(c.x) + (critterRandom() > 0.5 ? 1 : -1);
  const ty = Math.round(c.y) + (critterRandom() > 0.5 ? 1 : -1);
  c.targetX = tx;
  c.targetY = ty;
}

/**
 * Returns whether critters (and small particles like flies/roaches) should be rendered.
 * Automatically disables them on mobile devices (maxTouchPoints > 0) or if the UI toggle is disabled.
 * A runtime FPS check can optionally be passed to disable them below 30 FPS.
 */
export function getCritterRenderEnabled(fps?: number): boolean {
  if (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) {
    return false;
  }
  if (fps !== undefined && fps < 30) {
    return false;
  }
  return crittersEnabled();
}
