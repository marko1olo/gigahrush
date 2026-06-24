export function calculateDamage(baseDamage: number, armor: number): number {
  return Math.max(0, baseDamage - armor);
}
