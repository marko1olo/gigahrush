/* ── Blood FX — procedural splatter, trails, pools ────────────── */

import { W, Cell, ProjType, type Entity, EntityType } from '../core/types';
import { World } from '../core/world';
import { stampMark, MarkType } from './marks';
import { Spr } from './sprite_index';
import { ensureEntityIndex } from '../systems/entity_index';

/* ── Screen-space blood particles ─────────────────────────────── */
export interface BloodParticle {
  x: number; y: number;      // world position
  z: number;                 // height: 0=floor, 0.5=mid, 1=ceiling
  vx: number; vy: number;    // velocity (cells/sec)
  vz: number;                // vertical velocity (units/sec)
  life: number;              // remaining seconds
  size: number;              // 1-3 px
  r: number; g: number; b: number;
}

const MAX_PARTICLES = 256;
export const particles: BloodParticle[] = [];

// Incrementing counter ensures every splatter is unique
let _splatterSeed = 0;

const PROJECTILE_MARK_CELL_CAP = 768;
const PROJECTILE_MARKS_PER_CELL = 8;
const projectileMarkCounts = new WeakMap<World, Map<number, number>>();

// Substance colors (R, G, B)
const BLOOD: [number, number, number] = [140, 10, 10];
const GORE:  [number, number, number] = [30, 40, 10];

export function isEnergyProjectileImpact(sprite: number | undefined, pt = ProjType.NORMAL): boolean {
  return pt === ProjType.BFG ||
    pt === ProjType.FLAME ||
    sprite === Spr.PSI_BOLT ||
    sprite === Spr.HOSTILE_PSI_BOLT ||
    sprite === Spr.EYE_BOLT ||
    sprite === Spr.PARAGRAPH_BOLT ||
    sprite === Spr.PLASMA_BOLT ||
    sprite === Spr.HOSTILE_PLASMA_BOLT ||
    sprite === Spr.GAUSS_BOLT ||
    sprite === Spr.BFG_BOLT ||
    sprite === Spr.FLAME_BOLT ||
    sprite === Spr.HOSTILE_FLAME_BOLT;
}

function canStampProjectileMark(world: World, cx: number, cy: number): boolean {
  const idx = world.idx(world.wrap(cx), world.wrap(cy));
  let counts = projectileMarkCounts.get(world);
  if (!counts) {
    counts = new Map();
    projectileMarkCounts.set(world, counts);
  }
  const prev = counts.get(idx) ?? 0;
  if (prev >= PROJECTILE_MARKS_PER_CELL) return false;
  if (prev === 0 && counts.size >= PROJECTILE_MARK_CELL_CAP) return false;
  counts.set(idx, prev + 1);
  return true;
}

function stampProjectileMark(
  world: World,
  cx: number, cy: number,
  fx: number, fy: number,
  radius: number,
  type: MarkType,
  seed: number,
  r: number, g: number, b: number,
  intensity: number,
  wallOk = false,
): void {
  if (!canStampProjectileMark(world, cx, cy)) return;
  stampMark(world, cx, cy, fx, fy, radius, type, seed, r, g, b, intensity, wallOk);
}

function stampEnergyMark(
  world: World,
  cx: number, cy: number,
  fx: number, fy: number,
  radius: number,
  sprite: number | undefined,
  wallOk = false,
): void {
  if (sprite === Spr.EYE_BOLT) {
    stampProjectileMark(world, cx, cy, fx, fy, radius, MarkType.PSI, ++_splatterSeed, 120, 220, 35, 190, wallOk);
  } else if (sprite === Spr.PARAGRAPH_BOLT) {
    stampProjectileMark(world, cx, cy, fx, fy, radius * 0.9, MarkType.PSI, ++_splatterSeed, 235, 42, 96, 205, wallOk);
    stampProjectileMark(world, cx, cy, fx, fy, radius * 0.45, MarkType.BULLET, ++_splatterSeed, 28, 22, 16, 185, wallOk);
  } else if (sprite === Spr.HOSTILE_PSI_BOLT) {
    stampProjectileMark(world, cx, cy, fx, fy, radius, MarkType.PSI, ++_splatterSeed, 230, 35, 140, 205, wallOk);
  } else if (sprite === Spr.PLASMA_BOLT) {
    stampProjectileMark(world, cx, cy, fx, fy, radius, MarkType.PSI, ++_splatterSeed, 40, 230, 210, 185, wallOk);
  } else if (sprite === Spr.HOSTILE_PLASMA_BOLT) {
    stampProjectileMark(world, cx, cy, fx, fy, radius, MarkType.SCORCH, ++_splatterSeed, 210, 95, 30, 190, wallOk);
  } else if (sprite === Spr.GAUSS_BOLT) {
    stampProjectileMark(world, cx, cy, fx, fy, radius * 0.75, MarkType.PSI, ++_splatterSeed, 170, 210, 255, 180, wallOk);
  } else {
    stampProjectileMark(world, cx, cy, fx, fy, radius, MarkType.PSI, ++_splatterSeed, 180, 80, 230, 185, wallOk);
  }
}

function projectileImpactColor(sprite: number | undefined, pt = ProjType.NORMAL): [number, number, number] {
  if (pt === ProjType.WEB) return [224, 226, 204];
  if (pt === ProjType.FLAME || sprite === Spr.FLAME_BOLT || sprite === Spr.HOSTILE_FLAME_BOLT) return [255, 92, 24];
  if (sprite === Spr.EYE_BOLT) return [150, 240, 52];
  if (sprite === Spr.PARAGRAPH_BOLT) return [248, 42, 104];
  if (sprite === Spr.HOSTILE_PSI_BOLT) return [248, 36, 132];
  if (sprite === Spr.PSI_BOLT) return [204, 96, 255];
  if (sprite === Spr.PLASMA_BOLT || sprite === Spr.GAUSS_BOLT) return [110, 232, 255];
  if (sprite === Spr.HOSTILE_PLASMA_BOLT) return [255, 126, 45];
  if (pt === ProjType.BFG || sprite === Spr.BFG_BOLT) return [104, 255, 90];
  if (sprite === Spr.HOSTILE_BULLET || sprite === Spr.HOSTILE_PELLET || sprite === Spr.HOSTILE_NAIL) return [255, 86, 42];
  return [255, 214, 118];
}

function spawnProjectileImpactParticles(
  x: number, y: number,
  z: number,
  sprite: number | undefined,
  pt = ProjType.NORMAL,
): void {
  const energy = isEnergyProjectileImpact(sprite, pt);
  const flame = pt === ProjType.FLAME || sprite === Spr.FLAME_BOLT || sprite === Spr.HOSTILE_FLAME_BOLT;
  const [r, g, b] = projectileImpactColor(sprite, pt);
  const count = flame ? 7 : energy ? 10 : 5;
  const baseSpeed = flame ? 1.7 : energy ? 2.4 : 1.25;
  const seed = ++_splatterSeed;
  for (let i = 0; i < count && particles.length < MAX_PARTICLES; i++) {
    const ang = Math.random() * Math.PI * 2;
    const spd = baseSpeed * (0.45 + Math.random() * 0.85);
    const h = (seed * 29 + i * 47) & 31;
    particles.push({
      x,
      y,
      z,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      vz: (energy ? 0.55 : 0.35) + Math.random() * (flame ? 1.0 : 1.35),
      life: flame ? 0.42 : energy ? 0.5 : 0.28,
      size: energy ? 1 + (h & 1) : 1,
      r: Math.min(255, r + h),
      g: Math.min(255, g + (h >> 1)),
      b: Math.min(255, b + (h >> 2)),
    });
  }
}

export function spawnProjectileBodyImpact(
  world: World,
  x: number, y: number,
  sprite: number | undefined,
  pt = ProjType.NORMAL,
  z = 0.5,
): void {
  spawnProjectileImpactParticles(x, y, z, sprite, pt);
  const cx = Math.floor(x), cy = Math.floor(y);
  if (world.solid(cx, cy)) return;
  const fx = (x % 1 + 1) % 1, fy = (y % 1 + 1) % 1;
  if (pt === ProjType.WEB) {
    stampProjectileMark(world, cx, cy, fx, fy, 0.22, MarkType.WEB, ++_splatterSeed, 226, 226, 202, 170);
  } else if (pt === ProjType.FLAME || sprite === Spr.FLAME_BOLT || sprite === Spr.HOSTILE_FLAME_BOLT) {
    stampProjectileMark(world, cx, cy, fx, fy, 0.18, MarkType.BURN, ++_splatterSeed, 10, 5, 2, 145);
  } else if (isEnergyProjectileImpact(sprite, pt)) {
    stampEnergyMark(world, cx, cy, fx, fy, 0.12, sprite);
  }
}

export function spawnProjectileFloorImpact(
  world: World,
  x: number, y: number,
  sprite: number | undefined,
  pt = ProjType.NORMAL,
): void {
  const cx = Math.floor(x), cy = Math.floor(y);
  if (world.solid(cx, cy)) return;
  const fx = (x % 1 + 1) % 1, fy = (y % 1 + 1) % 1;
  spawnProjectileImpactParticles(x, y, 0.08, sprite, pt);
  if (pt === ProjType.WEB) {
    stampProjectileMark(world, cx, cy, fx, fy, 0.34, MarkType.WEB, ++_splatterSeed, 226, 226, 202, 185);
  } else if (pt === ProjType.FLAME || sprite === Spr.FLAME_BOLT || sprite === Spr.HOSTILE_FLAME_BOLT) {
    stampProjectileMark(world, cx, cy, fx, fy, 0.3, MarkType.BURN, ++_splatterSeed, 8, 5, 2, 180);
  } else if (isEnergyProjectileImpact(sprite, pt)) {
    stampEnergyMark(world, cx, cy, fx, fy, 0.18, sprite);
  } else {
    stampProjectileMark(world, cx, cy, fx, fy, 0.08, MarkType.BULLET, ++_splatterSeed, 20, 18, 14, 140);
  }
}

export function spawnProjectileWallImpact(
  world: World,
  cx: number, cy: number,
  u: number, v: number,
  sprite: number | undefined,
  pt = ProjType.NORMAL,
): void {
  if (pt === ProjType.WEB) {
    stampProjectileMark(world, cx, cy, u, v, 0.3, MarkType.WEB, ++_splatterSeed, 226, 226, 202, 185, true);
  } else if (pt === ProjType.FLAME || sprite === Spr.FLAME_BOLT || sprite === Spr.HOSTILE_FLAME_BOLT) {
    stampProjectileMark(world, cx, cy, u, v, 0.25, MarkType.BURN, ++_splatterSeed, 5, 3, 1, 190, true);
  } else if (isEnergyProjectileImpact(sprite, pt)) {
    stampEnergyMark(world, cx, cy, u, v, 0.16, sprite, true);
  } else {
    const seed = ++_splatterSeed;
    stampProjectileMark(world, cx, cy, u, v, 0.1, MarkType.BULLET, seed, 30, 25, 18, 160, true);
    stampProjectileMark(world, cx, cy, u, v, 0.05, MarkType.BULLET, seed + 1, 8, 8, 8, 255, true);
  }
}

/* ── Stamp blood/gore on adjacent wall cells ──────────────────── */
function splatAdjacentWalls(
  world: World, ex: number, ey: number,
  radius: number, intensity: number, seed: number,
  cr: number, cg: number, cb: number,
  dvx = 0, dvy = 0, hitZ = 0.5,
): void {
  const ecx = Math.floor(ex), ecy = Math.floor(ey);
  const fracX = ((ex % 1) + 1) % 1;
  const fracY = ((ey % 1) + 1) % 1;
  // Cardinal directions: [dx, dy, face-U from entity position]
  const dirs: [number, number, number][] = [
    [-1, 0, fracY],  // West wall: horizontal on face = entity Y
    [+1, 0, fracY],  // East wall
    [0, -1, fracX],  // North wall: horizontal on face = entity X
    [0, +1, fracX],  // South wall
  ];
  const hasDir = dvx !== 0 || dvy !== 0;
  for (const [dx, dy, faceU] of dirs) {
    const wx = world.wrap(ecx + dx);
    const wy = world.wrap(ecy + dy);
    if (world.cells[wy * W + wx] !== Cell.WALL) continue;
    // Directional bias: skip walls behind projectile travel direction
    if (hasDir) {
      const dot = dx * dvx + dy * dvy;
      if (dot < -0.1) continue;
    }
    // Wall face V at impact height: spriteZ 0=floor→faceV 1.0, spriteZ 0.5=mid→faceV 0.5
    const faceV = Math.max(0.05, Math.min(0.95, 1.0 - hitZ + (Math.random() - 0.5) * 0.12));
    const u = Math.max(0, Math.min(0.999, faceU + (Math.random() - 0.5) * 0.15));
    stampMark(world, wx, wy, u, faceV, radius, MarkType.SPLAT, seed + dx * 7 + dy * 13, cr, cg, cb, intensity, true);
  }
}

/* ── Spawn blood particles on hit ─────────────────────────────── */
export function spawnBloodHit(world: World, ex: number, ey: number, fromAngle: number, dmg: number, gore = false, pvx = 0, pvy = 0, hitZ = 0.5): void {
  const seed = ++_splatterSeed;
  const [sr, sg, sb] = gore ? GORE : BLOOD;
  // Offset floor splat in projectile travel direction
  const spd = Math.sqrt(pvx * pvx + pvy * pvy);
  const offMag = spd > 0.1 ? Math.min(0.3, spd * 0.012) : 0;
  const offX = spd > 0.1 ? (pvx / spd) * offMag : 0;
  const offY = spd > 0.1 ? (pvy / spd) * offMag : 0;
  const sx = ex + offX, sy = ey + offY;
  const cx = Math.floor(sx), cy = Math.floor(sy);
  const fx = ((sx % 1) + 1) % 1, fy = ((sy % 1) + 1) % 1;
  const radius = Math.min(0.35, 0.08 + dmg * 0.004);
  const intensity = Math.min(220, 80 + dmg * 3);
  stampMark(world, cx, cy, fx, fy, radius, MarkType.SPLAT, seed, sr, sg, sb, intensity);

  // Directional wall splatter at impact height
  splatAdjacentWalls(world, ex, ey, radius * 0.6, Math.floor(intensity * 0.7), seed, sr, sg, sb, pvx, pvy, hitZ);

  // Spray some blood in hit direction (away from attacker) + projectile momentum
  const count = Math.min(24, 4 + Math.floor(dmg * 0.3));
  const pMomentum = spd > 0.1 ? 0.15 : 0;
  for (let i = 0; i < count && particles.length < MAX_PARTICLES; i++) {
    const spread = (Math.random() - 0.5) * 1.6;
    const ang = fromAngle + Math.PI + spread;
    const baseSpd = 1.5 + Math.random() * 3;
    // Unique color per particle — dark red / crimson / maroon
    const h = (seed * 7 + i * 31) & 0xFF;
    particles.push({
      x: ex, y: ey,
      z: hitZ,
      vx: Math.cos(ang) * baseSpd + pvx * pMomentum,
      vy: Math.sin(ang) * baseSpd + pvy * pMomentum,
      vz: (Math.random() - 0.3) * 1.5,  // slight upward bias then fall
      life: 1.5,  // generous life — gravity landing will kill them
      size: 1 + (h & 1),
      r: gore ? 20 + (h & 31) : 120 + (h & 63),
      g: gore ? 25 + (h & 15) : 5 + (h & 15),
      b: gore ? 5 + (h & 7) : 5 + (h & 7),
    });
  }
}

/* ── Large blood pool on death ────────────────────────────────── */
export function spawnDeathPool(world: World, ex: number, ey: number, gore = false, goreLevel = 1, pvx = 0, pvy = 0): void {
  const seed = ++_splatterSeed;
  const [sr, sg, sb] = gore ? GORE : BLOOD;
  // Offset pool in projectile travel direction
  const spd = Math.sqrt(pvx * pvx + pvy * pvy);
  const offMag = spd > 0.1 ? Math.min(0.4, spd * 0.015) : 0;
  const dirX = spd > 0.1 ? pvx / spd : 0;
  const dirY = spd > 0.1 ? pvy / spd : 0;
  const px = ex + dirX * offMag, py = ey + dirY * offMag;
  const cx = Math.floor(px), cy = Math.floor(py);
  const fx = ((px % 1) + 1) % 1, fy = ((py % 1) + 1) % 1;
  // Pool size scales with gore level
  const poolRadius = 0.35 + goreLevel * 0.08;
  stampMark(world, cx, cy, fx, fy, poolRadius, MarkType.POOL, seed, sr, sg, sb, 255);
  // Directional wall splatter at mid-body height
  splatAdjacentWalls(world, ex, ey, 0.25 + goreLevel * 0.05, 200, seed, sr, sg, sb, pvx, pvy, 0.5);
  // Large gore splatters spraying outward across multiple cells
  const splatCount = 3 + goreLevel * 3;
  for (let i = 0; i < splatCount; i++) {
    const ang = (i / splatCount) * Math.PI * 2 + (Math.random() - 0.5) * 1.2;
    // Spray distance: 0.5 to 2.5 cells from center, further with higher gore
    const dist = 0.3 + Math.random() * (0.6 + goreLevel * 0.5);
    // Bias toward projectile direction
    const biasX = dirX * 0.4, biasY = dirY * 0.4;
    const sx = ex + Math.cos(ang) * dist + biasX;
    const sy = ey + Math.sin(ang) * dist + biasY;
    const scx = Math.floor(((sx % W) + W) % W);
    const scy = Math.floor(((sy % W) + W) % W);
    if (world.solid(scx, scy)) continue;
    const splatRadius = 0.12 + goreLevel * 0.06 + Math.random() * 0.08;
    const splatIntensity = 160 + Math.floor(Math.random() * 60);
    stampMark(world, scx, scy, ((sx % 1) + 1) % 1, ((sy % 1) + 1) % 1, splatRadius, MarkType.SPLAT, seed + i + 1, sr, sg, sb, splatIntensity);
    // Wall splats at spray endpoints
    if (goreLevel >= 2 && Math.random() < 0.5) {
      splatAdjacentWalls(world, sx, sy, splatRadius * 0.5, splatIntensity - 40, seed + i + 50, sr, sg, sb, Math.cos(ang), Math.sin(ang), 0.3 + Math.random() * 0.5);
    }
  }
  // Gore spray particles for messy deaths (shotgun / explosion)
  if (goreLevel >= 2) {
    const particleCount = Math.min(48, goreLevel * 12);
    for (let i = 0; i < particleCount && particles.length < MAX_PARTICLES; i++) {
      const ang = Math.random() * Math.PI * 2;
      const baseSpd = 3 + Math.random() * 6;
      const pM = spd > 0.1 ? 0.25 : 0;
      const h = (seed * 7 + i * 31) & 0xFF;
      particles.push({
        x: ex, y: ey,
        z: 0.3 + Math.random() * 0.4,  // mid-body height
        vx: Math.cos(ang) * baseSpd + pvx * pM,
        vy: Math.sin(ang) * baseSpd + pvy * pM,
        vz: (Math.random() - 0.2) * 2.0,  // mostly upward spray
        life: 1.5,
        size: 1 + (h & 1),
        r: gore ? 20 + (h & 31) : 100 + (h & 63),
        g: gore ? 25 + (h & 15) : 5 + (h & 15),
        b: gore ? 5 + (h & 7) : 5 + (h & 7),
      });
    }
  }
}

/* ── Blood drip trail for wounded entities ────────────────────── */
export function updateBloodTrails(world: World, entities: Entity[], dt: number): void {
  // Only process every ~0.3s worth of dt (accumulate externally)
  for (const e of ensureEntityIndex(entities).actors) {
    if (!e.alive) continue;
    if (e.hp === undefined || e.maxHp === undefined) continue;
    const ratio = e.hp / e.maxHp;
    if (ratio >= 0.5) continue;  // only bleed when under 50% HP
    // Drip probability scales with damage
    const drip = (0.5 - ratio) * 2;  // 0..1
    if (Math.random() > drip * dt * 3) continue;
    const cx = Math.floor(e.x), cy = Math.floor(e.y);
    const fx = e.x - cx + (Math.random() - 0.5) * 0.3;
    const fy = e.y - cy + (Math.random() - 0.5) * 0.3;
    const isGore = e.type === EntityType.MONSTER;
    const [sr, sg, sb] = isGore ? GORE : BLOOD;
    stampMark(world, cx, cy,
      Math.max(0, Math.min(0.999, fx)),
      Math.max(0, Math.min(0.999, fy)),
      0.06 + Math.random() * 0.04,
      MarkType.DRIP,
      ++_splatterSeed, sr, sg, sb,
      60 + Math.floor(Math.random() * 40));
  }
}

/* ── Update particles physics ─────────────────────────────────── */
export function updateParticles(world: World, dt: number): void {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    // 3D gravity: pull particles down
    p.vz -= 3.5 * dt;
    p.z += p.vz * dt;
    // Hit floor → stamp blood and die
    if (p.z <= 0) {
      p.z = 0;
      const cx = Math.floor(p.x), cy = Math.floor(p.y);
      const fx = ((p.x % 1) + 1) % 1;
      const fy = ((p.y % 1) + 1) % 1;
      stampMark(world, cx, cy, fx, fy, 0.04 + p.size * 0.02, MarkType.SPLAT, ++_splatterSeed, p.r, p.g, p.b, 120);
      particles.splice(i, 1);
      continue;
    }
    // Time-expired (safety)
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }
    // XY friction (no world-space gravity on XY — the 3D vz handles vertical)
    p.vx *= 0.95;
    p.vy *= 0.95;
    p.x = ((p.x + p.vx * dt) % W + W) % W;
    p.y = ((p.y + p.vy * dt) % W + W) % W;
  }
}
