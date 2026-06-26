import { RoomType, type Entity } from '../core/types';
import type { World } from '../core/world';
import type { CameraView } from '../systems/camera';
import type { BloodParticle } from './blood';
import { SeedRng } from '../core/rand';

type CritterKind = 'rat' | 'roach' | 'fly';

interface Critter {
  kind: CritterKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  originX: number;
  originY: number;
  life: number;
}

const activeCritters: Critter[] = [];
const CRITTER_CAP = 30;
const CRITTER_RADIUS = 15;
const CRITTER_RADIUS_SQ = CRITTER_RADIUS * CRITTER_RADIUS;

let lastTime = 0;
let lastScanTime = 0;
let rng = new SeedRng(1);

export function updateCritters(
  world: World,
  camera: CameraView,
  time: number,
  entities: Entity[]
): BloodParticle[] {
  let dt = time - lastTime;
  if (dt < 0 || dt > 1) dt = 0.016; // guard against large skips
  lastTime = time;

  // Cleanup dead critters
  for (let i = activeCritters.length - 1; i >= 0; i--) {
    const c = activeCritters[i];
    c.life -= dt;
    if (c.life <= 0) {
      activeCritters.splice(i, 1);
    }
  }

  // Scan & Spawn
  if (time - lastScanTime > 0.1 && activeCritters.length < CRITTER_CAP) {
    lastScanTime = time;
    rng = new SeedRng(Math.floor(time * 10)); // new RNG using time seed

    // Check up to 3 random cells near camera
    for (let attempt = 0; attempt < 3; attempt++) {
      if (activeCritters.length >= CRITTER_CAP) break;

      const dx = rng.float(-CRITTER_RADIUS, CRITTER_RADIUS);
      const dy = rng.float(-CRITTER_RADIUS, CRITTER_RADIUS);
      if (dx * dx + dy * dy > CRITTER_RADIUS_SQ) continue;

      const cx = Math.floor(camera.x + dx);
      const cy = Math.floor(camera.y + dy);
      const ci = world.idx(cx, cy);

      const light = world.light[ci] ?? 0;
      const isDark = light < 0.3;

      // Determine room
      const roomId = world.roomMap[ci];
      const room = roomId >= 0 ? world.rooms[roomId] : null;
      const roomType = room?.type;

      let spawnedKind: CritterKind | null = null;

      // 1. Flies: Over corpse or surface mark (even if light)
      if (!spawnedKind) {
        let hasCorpse = false;
        for (const e of entities) {
          if (e.hp !== undefined && e.hp <= 0 && Math.abs(e.x - cx) < 1.5 && Math.abs(e.y - cy) < 1.5) {
            hasCorpse = true;
            break;
          }
        }
        if (hasCorpse || world.surfaceMap.has(ci)) {
          if (rng.chance(0.4)) spawnedKind = 'fly';
        }
      }

      // Rats & Roaches shouldn't spawn in bright, clean areas
      if (!spawnedKind && isDark) {
        // 2. Rats: Storage, Kitchen, or near containers
        if (roomType === RoomType.STORAGE || roomType === RoomType.KITCHEN) {
          if (rng.chance(0.3)) spawnedKind = 'rat';
        } else {
          // Check for nearby container
          let nearContainer = false;
          for (const c of world.containers) {
            if (Math.abs(c.x - cx) < 2 && Math.abs(c.y - cy) < 2) {
              nearContainer = true;
              break;
            }
          }
          if (nearContainer && rng.chance(0.4)) spawnedKind = 'rat';
        }

        // 3. Cockroaches: Bathroom or dark corridors
        if (!spawnedKind) {
          if (roomType === RoomType.BATHROOM || roomType === RoomType.CORRIDOR || !room) {
            if (rng.chance(0.3)) spawnedKind = 'roach';
          }
        }
      }

      if (spawnedKind) {
        const angle = rng.random() * Math.PI * 2;
        const speed = spawnedKind === 'rat' ? 4 : (spawnedKind === 'roach' ? 2 : 1);

        activeCritters.push({
          kind: spawnedKind,
          x: cx + 0.5,
          y: cy + 0.5,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          originX: cx + 0.5,
          originY: cy + 0.5,
          life: rng.float(2, 4), // 2-4 seconds
        });
      }
    }
  }

  // Update & generate particles
  const particles: BloodParticle[] = [];
  for (const c of activeCritters) {
    // Basic movement
    c.x += c.vx * dt;
    c.y += c.vy * dt;

    if (c.kind === 'fly') {
      // Erratic around origin
      const ox = c.originX - c.x;
      const oy = c.originY - c.y;
      c.vx += ox * dt * 5 + (rng.random() - 0.5) * 10 * dt;
      c.vy += oy * dt * 5 + (rng.random() - 0.5) * 10 * dt;
      c.vx *= 0.95;
      c.vy *= 0.95;
    } else {
      // Flee camera
      const dx = c.x - camera.x;
      const dy = c.y - camera.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < 25) {
        const invDist = 1 / Math.sqrt(distSq);
        c.vx += dx * invDist * 10 * dt;
        c.vy += dy * invDist * 10 * dt;
      }
      // Damping
      c.vx *= 0.9;
      c.vy *= 0.9;
    }

    // Map to particle
    let size = 0.5;
    let r = 0, g = 0, b = 0;
    let z = 0.05;

    if (c.kind === 'rat') {
      size = 0.6;
      r = 60; g = 58; b = 62;
    } else if (c.kind === 'roach') {
      size = 0.4;
      r = 45; g = 30; b = 20;
    } else if (c.kind === 'fly') {
      size = 0.25;
      z = 0.3 + Math.sin(time * 10 + c.originX) * 0.1;
      r = 10; g = 10; b = 10;
    }

    particles.push({
      kind: 'debris',
      x: c.x,
      y: c.y,
      z,
      vx: 0,
      vy: 0,
      vz: 0,
      life: c.life,
      size,
      r, g, b,
      alpha: Math.min(1.0, c.life * 2), // fade out
    });
  }

  return particles;
}
