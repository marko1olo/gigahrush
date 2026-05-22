/* ── Standalone monster trait helpers ────────────────────────── */

import { Cell, EntityType, Feature, MonsterKind, type Entity } from '../core/types';
import { World } from '../core/world';
import { MONSTERS } from '../entities/monster';

const DEFENSIVE_NEUTRAL_HOSTILE_STAGE = 1;
export const PANELNIK_WALL_BRACE_DAMAGE_MULT = 0.58;
export const PANELNIK_OPEN_SLOW_SEC = 1.35;
export const PANELNIK_OPEN_SLOW_MULT = 0.58;
export const CHERVIE_NET_SOURCE_RADIUS = 7;

export interface ChervieNetSource {
  idx: number;
  x: number;
  y: number;
  feature: Feature.SCREEN | Feature.APPARATUS;
  dist2: number;
}

function wallCell(world: World, x: number, y: number): boolean {
  return world.cells[world.idx(x, y)] === Cell.WALL;
}

export function panelnikWallBraceActive(world: World, e: Entity): boolean {
  if (e.type !== EntityType.MONSTER || e.monsterKind !== MonsterKind.PANELNIK) return false;
  const x = Math.floor(e.x);
  const y = Math.floor(e.y);
  return wallCell(world, x - 1, y) ||
    wallCell(world, x + 1, y) ||
    wallCell(world, x, y - 1) ||
    wallCell(world, x, y + 1);
}

export function panelnikOpenFloor(world: World, e: Entity): boolean {
  if (e.type !== EntityType.MONSTER || e.monsterKind !== MonsterKind.PANELNIK) return false;
  const x = Math.floor(e.x);
  const y = Math.floor(e.y);
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      if (dx * dx + dy * dy > 4) continue;
      if (wallCell(world, x + dx, y + dy)) return false;
    }
  }
  return true;
}

export function lotochnikDrainArmorActive(world: World, e: Entity): boolean {
  if (e.type !== EntityType.MONSTER || e.monsterKind !== MonsterKind.LOTOCHNIK) return false;
  return world.cells[world.idx(Math.floor(e.x), Math.floor(e.y))] === Cell.WATER;
}

function isChervieNetSourceFeature(feature: Feature): feature is Feature.SCREEN | Feature.APPARATUS {
  return feature === Feature.SCREEN || feature === Feature.APPARATUS;
}

function chervieHasLineToSource(world: World, e: Entity, sourceIdx: number, sx: number, sy: number): boolean {
  const tx = sx + 0.5;
  const ty = sy + 0.5;
  const dx = world.delta(e.x, tx);
  const dy = world.delta(e.y, ty);
  const dist = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.max(2, Math.ceil(dist * 2));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const x = world.wrap(Math.floor(e.x + dx * t));
    const y = world.wrap(Math.floor(e.y + dy * t));
    const idx = world.idx(x, y);
    if (idx === sourceIdx) continue;
    if (world.solid(x, y)) return false;
  }
  return true;
}

export function findChervieNetSource(world: World, e: Entity, radius = CHERVIE_NET_SOURCE_RADIUS): ChervieNetSource | undefined {
  if (e.type !== EntityType.MONSTER || e.monsterKind !== MonsterKind.CHERVIE_AVATAR) return undefined;
  const ex = Math.floor(e.x);
  const ey = Math.floor(e.y);
  const r2 = radius * radius;
  let best: ChervieNetSource | undefined;
  let bestScore = Infinity;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy > r2) continue;
      const x = world.wrap(ex + dx);
      const y = world.wrap(ey + dy);
      const idx = world.idx(x, y);
      const feature = world.features[idx] as Feature;
      if (!isChervieNetSourceFeature(feature)) continue;
      const dist2 = world.dist2(e.x, e.y, x + 0.5, y + 0.5);
      if (dist2 > r2 || !chervieHasLineToSource(world, e, idx, x, y)) continue;
      const score = dist2 - (feature === Feature.APPARATUS ? 1.5 : 0);
      if (score >= bestScore) continue;
      bestScore = score;
      best = { idx, x, y, feature, dist2 };
    }
  }
  return best;
}

export function chervieNetPowered(world: World, e: Entity): boolean {
  return findChervieNetSource(world, e) !== undefined;
}

export function isPassiveDefensiveNeutralMonster(e: Entity): boolean {
  if (e.type !== EntityType.MONSTER || e.monsterKind === undefined) return false;
  const def = MONSTERS[e.monsterKind];
  return def?.aiFlags?.includes('defensiveNeutral') === true
    && e.monsterStage !== DEFENSIVE_NEUTRAL_HOSTILE_STAGE;
}

export function applyMonsterIncomingDamage(world: World, target: Entity, damage: number): number {
  if (panelnikWallBraceActive(world, target)) return Math.max(1, Math.round(damage * PANELNIK_WALL_BRACE_DAMAGE_MULT));
  if (!lotochnikDrainArmorActive(world, target)) return damage;
  return Math.max(1, Math.round(damage * 0.58));
}
