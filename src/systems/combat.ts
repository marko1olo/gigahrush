import { Entity, DamageType } from '../core/types';
import { ITEMS } from '../data/catalog';

export function calculateDamage(baseDamage: number, damageType: DamageType | undefined, target: Entity): number {
  let resist = 0;
  if (target.armorDefId) {
    const armorDef = ITEMS[target.armorDefId];
    if (armorDef && armorDef.resistances && damageType !== undefined) {
      resist = armorDef.resistances[damageType] ?? 0;
    }
  }
  return Math.max(0, baseDamage * (100 - resist) / 100);
}
