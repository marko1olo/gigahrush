import { crittersEnabled } from '../systems/ui_orchestrator';

/**
 * Returns whether critters (and small particles like flies/roaches) should be rendered.
 * Automatically disables them on mobile devices (maxTouchPoints > 0) or if the UI toggle is disabled.
 * A runtime FPS check can optionally be passed to disable them below 30 FPS.
 */
export interface Critter {
  active: boolean;
  type: 'fly'; // later we might add 'rat', 'roach'
  x: number;
  y: number;
  z: number;
  targetX: number; // anchor X (corpse)
  targetY: number; // anchor Y (corpse)
  phase: number;
  speed: number;
}

export const CRITTERS_POOL: Critter[] = [];
for (let i = 0; i < 200; i++) {
  CRITTERS_POOL.push({
    active: false,
    type: 'fly',
    x: 0,
    y: 0,
    z: 0,
    targetX: 0,
    targetY: 0,
    phase: 0,
    speed: 0,
  });
}

export function updateFlies(_dt: number, playerX: number, playerY: number, onBuzz: (volume: number) => void): void {
  const time = performance.now() / 1000;
  let minFlyDist = Infinity;

  for (let i = 0; i < CRITTERS_POOL.length; i++) {
    const c = CRITTERS_POOL[i];
    if (!c.active || c.type !== 'fly') continue;

    // Radius pulsing
    const r = 0.2 + (Math.sin(time * 2 + c.phase) * 0.1);

    c.x = c.targetX + r * Math.cos(time * c.speed + c.phase);
    c.y = c.targetY + r * Math.sin(time * c.speed + c.phase);
    c.z = 0.4 + 0.2 * Math.sin(time * 3 + c.phase); // Height modulation (0.2 - 0.6)

    // Calculate distance to player to determine closest fly distance for buzzing sound
    const dx = c.x - playerX;
    const dy = c.y - playerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minFlyDist) {
      minFlyDist = dist;
    }
  }

  if (minFlyDist < 5.0) {
    const volume = 1.0 - (minFlyDist / 5.0); // fade out at 5 cells
    onBuzz(volume);
  } else {
    onBuzz(0);
  }
}

export function getCritterRenderEnabled(fps?: number): boolean {
  if (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) {
    return false;
  }
  if (fps !== undefined && fps < 30) {
    return false;
  }
  return crittersEnabled();
}
