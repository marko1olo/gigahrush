import { Entity, DamageType, type GameState } from '../core/types';
import type { World } from '../core/world';
import { ITEMS, WEAPON_STATS } from '../data/catalog';
import { applyMonsterArmorHit, type MonsterArmorHitInput, type MonsterArmorHitResult } from './monster_armor';

export function calculateDamage(baseDamage: number, damageType: DamageType | undefined, target: Entity): number {
  let resist = 0;
  if (target.armorDefId) {
    const armorDef = ITEMS[target.armorDefId];
    if (armorDef && armorDef.resistances) {
      // Нетипизированный источник урона считается кинетикой — иначе резисты брони молча не работают.
      resist = armorDef.resistances[damageType ?? DamageType.KINETIC] ?? 0;
    }
  }
  return Math.max(0, baseDamage * (100 - resist) / 100);
}

/* Единый конвейер урона: резист надетой брони цели (по типу урона оружия),
   затем врождённая броня монстров. Тип берётся из input.damageType, иначе
   из реестра оружия по weaponId, иначе кинетика. */
export function applyDamage(
  world: World,
  state: GameState,
  target: Entity,
  input: MonsterArmorHitInput & { damageType?: DamageType },
): MonsterArmorHitResult {
  const damageType = input.damageType
    ?? (input.weaponId !== undefined ? WEAPON_STATS[input.weaponId]?.damageType : undefined);
  const typed = Math.round(calculateDamage(input.damage, damageType, target));
  if (typed === input.damage) return applyMonsterArmorHit(world, state, target, input);
  return applyMonsterArmorHit(world, state, target, { ...input, damage: typed });
}

export function applyHitStaggerAndKnockback(target: Entity, sourceX: number, sourceY: number, damage: number): void {
  if (damage <= 0 || !target.alive) return;
  const maxHp = target.maxHp || 100;
  const ratio = damage / maxHp;
  
  // Noticeable hit -> Apply stagger and knockback
  if (ratio > 0.01) {
    // Asymptotic stagger up to 1 second
    const staggerTime = Math.min(1.0, (ratio * 1.5) / (ratio * 1.5 + 0.2));
    target.staggerTimer = Math.max(target.staggerTimer ?? 0, staggerTime);
    if (target.ai) target.ai.staggerTimer = Math.max(target.ai.staggerTimer ?? 0, staggerTime);
    
    // Knockback
    let dx = target.x - sourceX;
    let dy = target.y - sourceY;
    const dist = Math.hypot(dx, dy);
    if (dist > 0.01) {
      dx /= dist;
      dy /= dist;
      // push force scales with stagger intensity (cells/sec)
      const pushForce = staggerTime * 12.0; 
      target.vx = (target.vx ?? 0) + dx * pushForce;
      target.vy = (target.vy ?? 0) + dy * pushForce;
    }
  }
}

