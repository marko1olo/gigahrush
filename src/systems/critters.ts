import type { Entity } from '../core/types';
import { EntityType } from '../core/types';

export interface Fly {
  x: number;
  y: number;
  z: number;
  cx: number;
  cy: number;
  radius: number;
  phase: number;
  speed: number;
  corpseId: number;
}

const MAX_FLIES_TOTAL = 30;

export const flies: Fly[] = [];

export function updateFlies(entities: Entity[], time: number, cameraX: number, cameraY: number): void {
  flies.length = 0;
  const maxDist = 20;
  let totalFlies = 0;

  for (const e of entities) {
    if (totalFlies >= MAX_FLIES_TOTAL) break;

    if (e.alive || (e.type !== EntityType.NPC && e.type !== EntityType.MONSTER)) continue;
    if (e.deathTime === undefined || time - e.deathTime < 30) continue;

    let dx = e.x - cameraX;
    let dy = e.y - cameraY;

    const W = 1024;
    if (dx > W / 2) dx -= W;
    if (dx < -W / 2) dx += W;
    if (dy > W / 2) dy -= W;
    if (dy < -W / 2) dy += W;

    const distSq = dx * dx + dy * dy;
    if (distSq > maxDist * maxDist) continue;

    const flyCount = 5 + (e.id % 6);

    for (let i = 0; i < flyCount; i++) {
      if (totalFlies >= MAX_FLIES_TOTAL) break;
      const seed = e.id * 100 + i;
      const phase = (seed * 1.618) % (Math.PI * 2);
      const radius = 0.2 + ((seed * 2.718) % 0.3);
      const speed = 1.0 + ((seed * 3.141) % 1.5);
      const baseHeight = 0.3 + ((seed * 1.414) % 0.3);

      const x = e.x + radius * Math.cos(time * speed + phase);
      const y = e.y + radius * Math.sin(time * speed + phase);
      const z = baseHeight + 0.05 * Math.sin(time * speed * 2 + phase);

      flies.push({ x, y, z, cx: e.x, cy: e.y, radius, phase, speed, corpseId: e.id });
      totalFlies++;
    }
  }
}
