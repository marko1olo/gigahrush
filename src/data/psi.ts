/* ── ПСИ сгустки — PSI weapon stats ──────────────────────────── */

import type { WeaponStats } from './weapons';
import { Spr } from '../render/sprite_index';

export const PSI_WEAPON_STATS: Record<string, WeaponStats> = {
  psi_strike:   { dmg: 15, durability: 0, range: 0, speed: 0.5,  isRanged: true,  psiCost: 3,  projSpeed: 16, projSprite: Spr.PSI_BOLT },
  psi_rupture:  { dmg: 22, durability: 0, range: 0, speed: 1.0,  isRanged: true,  psiCost: 8,  projSpeed: 13, projSprite: Spr.PSI_BOLT, aoeRadius: 2.5 },
  psi_storm:    { dmg: 22, durability: 0, range: 0, speed: 1.6,  isRanged: false, psiCost: 18, psiEffect: 'storm' },
  psi_brainburn:{ dmg: 0,  durability: 0, range: 0, speed: 1.5,  isRanged: false, psiCost: 20, psiEffect: 'brain_burn' },
  psi_madness:  { dmg: 0,  durability: 0, range: 0, speed: 1.0,  isRanged: false, psiCost: 9,  psiEffect: 'madness' },
  psi_control:  { dmg: 0,  durability: 0, range: 0, speed: 1.2,  isRanged: false, psiCost: 18, psiEffect: 'control' },
  psi_phase:    { dmg: 0,  durability: 0, range: 0, speed: 0.9,  isRanged: false, psiCost: 16, psiEffect: 'phase' },
  psi_mark:     { dmg: 0,  durability: 0, range: 0, speed: 0.45, isRanged: false, psiCost: 5,  psiEffect: 'mark' },
  psi_recall:   { dmg: 0,  durability: 0, range: 0, speed: 0.55, isRanged: false, psiCost: 7,  psiEffect: 'recall' },
  psi_beam:     { dmg: 26, durability: 0, range: 0, speed: 0.65, isRanged: false, psiCost: 12, psiEffect: 'beam' },
  psi_concrete_splinter:{ dmg: 24, durability: 0, range: 0, speed: 0.6, isRanged: true, psiCost: 5, projSpeed: 17, projSprite: Spr.PSI_BOLT },
  psi_shadow_lance:{ dmg: 38, durability: 0, range: 0, speed: 0.85, isRanged: true, psiCost: 10, projSpeed: 24, projSprite: Spr.PSI_BOLT },
  psi_order_seal:{ dmg: 32, durability: 0, range: 0, speed: 1.15, isRanged: true, psiCost: 11, projSpeed: 12, projSprite: Spr.PSI_BOLT, aoeRadius: 2 },
  psi_void_needle:{ dmg: 90, durability: 0, range: 0, speed: 1.5, isRanged: true, psiCost: 20, projSpeed: 28, projSprite: Spr.PSI_BOLT },
  psi_meat_hook:{ dmg: 42, durability: 0, range: 0, speed: 1.05, isRanged: true, psiCost: 11, projSpeed: 11, projSprite: Spr.PSI_BOLT },
  psi_siren_pulse:{ dmg: 30, durability: 0, range: 0, speed: 1.1, isRanged: true, psiCost: 12, projSpeed: 18, projSprite: Spr.PSI_BOLT, aoeRadius: 2 },
};
