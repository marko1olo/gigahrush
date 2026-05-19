/* ── Weapon stats registry — melee & ranged physical weapons ─── */

import { Spr } from '../render/sprite_index';
import { ProjType } from '../core/types';

export interface WeaponStats {
  dmg: number;
  durability: number;   // max durability for melee (0 = infinite/fists)
  range: number;        // melee reach in cells
  speed: number;        // attack cooldown seconds
  isRanged: boolean;
  ammoType?: string;    // item def id for ammo
  projSpeed?: number;   // projectile speed (cells/sec)
  pellets?: number;     // projectiles per shot (shotgun)
  spread?: number;      // spread angle in radians
  projSprite?: number;  // sprite index for projectile
  psiCost?: number;     // PSI cost per cast (if set, uses PSI instead of ammo)
  aoeRadius?: number;   // AoE explosion radius on projectile impact
  psiEffect?: string;   // instant PSI effect id (non-projectile spells)
  projType?: ProjType;  // special projectile behaviour
  soundId?: string;     // weapon sound id (for dispatching)
  knockback?: number;   // melee stop distance in cells, capped by systems
}

export const PHYS_WEAPON_STATS: Record<string, WeaponStats> = {
  '':       { dmg: 3,  durability: 0,   range: 1.35, speed: 0.34, isRanged: false, knockback: 0.06 },
  knife:    { dmg: 8,  durability: 32,  range: 1.35, speed: 0.23, isRanged: false, knockback: 0.10 },
  wrench:   { dmg: 13, durability: 95,  range: 1.45, speed: 0.40, isRanged: false, knockback: 0.18 },
  pipe:     { dmg: 20, durability: 60,  range: 1.85, speed: 0.64, isRanged: false, knockback: 0.34 },
  rebar:    { dmg: 25, durability: 95,  range: 2.05, speed: 0.78, isRanged: false, knockback: 0.42 },
  axe:      { dmg: 36, durability: 65,  range: 1.5,  speed: 0.88, isRanged: false, knockback: 0.32 },
  chainsaw: { dmg: 40, durability: 14,  range: 1.35, speed: 0.2,  isRanged: false, soundId: 'chainsaw', knockback: 0.16 },
  makarov:  { dmg: 17, durability: 0,   range: 0,    speed: 0.48, isRanged: true, ammoType: 'ammo_9mm',      projSpeed: 20, pellets: 1, spread: 0.022, projSprite: Spr.BULLET },
  ppsh:     { dmg: 7,  durability: 0,   range: 0,    speed: 0.08, isRanged: true, ammoType: 'ammo_9mm',      projSpeed: 18, pellets: 1, spread: 0.12,  projSprite: Spr.BULLET, soundId: 'ppsh' },
  shotgun:  { dmg: 10, durability: 0,   range: 0,    speed: 1.15, isRanged: true, ammoType: 'ammo_shells',   projSpeed: 16, pellets: 6, spread: 0.30,  projSprite: Spr.PELLET, soundId: 'shotgun' },
  nailgun:  { dmg: 12, durability: 0,   range: 0,    speed: 0.28, isRanged: true, ammoType: 'ammo_nails',    projSpeed: 17, pellets: 1, spread: 0.018, projSprite: Spr.NAIL, soundId: 'nailgun' },
  ak47:     { dmg: 22, durability: 0,   range: 0,    speed: 0.16, isRanged: true, ammoType: 'ammo_762',      projSpeed: 25, pellets: 1, spread: 0.075, projSprite: Spr.BULLET },
  machinegun:{ dmg: 13, durability: 0,  range: 0,    speed: 0.065, isRanged: true, ammoType: 'ammo_belt',     projSpeed: 21, pellets: 1, spread: 0.16,  projSprite: Spr.BULLET, soundId: 'machinegun' },
  grenade:  { dmg: 85, durability: 0,   range: 0,    speed: 1.7,  isRanged: true, ammoType: 'grenade',       projSpeed: 10, pellets: 1, spread: 0,     projSprite: Spr.GRENADE, projType: ProjType.GRENADE, aoeRadius: 4, soundId: 'grenade' },
  gauss:    { dmg: 135, durability: 0,  range: 0,    speed: 2.1,  isRanged: true, ammoType: 'ammo_energy',   projSpeed: 42, pellets: 1, spread: 0,     projSprite: Spr.GAUSS_BOLT, soundId: 'gauss' },
  plasma:   { dmg: 24, durability: 0,   range: 0,    speed: 0.18, isRanged: true, ammoType: 'ammo_energy',   projSpeed: 15, pellets: 1, spread: 0.13,  projSprite: Spr.PLASMA_BOLT, soundId: 'plasma' },
  bfg:      { dmg: 210, durability: 0,  range: 0,    speed: 4.0,  isRanged: true, ammoType: 'ammo_energy',   projSpeed: 7,  pellets: 1, spread: 0,     projSprite: Spr.BFG_BOLT, projType: ProjType.BFG, aoeRadius: 8, soundId: 'bfg' },
  flamethrower:{ dmg: 5, durability: 0, range: 0,    speed: 0.07, isRanged: true, ammoType: 'ammo_fuel',     projSpeed: 7.5, pellets: 1, spread: 0.22,  projSprite: Spr.FLAME_BOLT, projType: ProjType.FLAME, soundId: 'flame' },
  hammer:   { dmg: 13, durability: 75,  range: 1.4,  speed: 0.34, isRanged: false, knockback: 0.22 },
  crowbar:  { dmg: 26, durability: 110, range: 1.75, speed: 0.70, isRanged: false, knockback: 0.38 },
  sledgehammer:{ dmg: 52, durability: 85, range: 1.75, speed: 1.25, isRanged: false, knockback: 0.65 },
  fire_hook:{ dmg: 20, durability: 80,  range: 2.25, speed: 0.82, isRanged: false, knockback: 0.36 },
  entrenching_spade:{ dmg: 17, durability: 95, range: 1.45, speed: 0.44, isRanged: false, knockback: 0.20 },
  bayonet:  { dmg: 15, durability: 65,  range: 1.75, speed: 0.31, isRanged: false, knockback: 0.14 },
  chain:    { dmg: 17, durability: 75,  range: 2.0,  speed: 0.54, isRanged: false, knockback: 0.26 },
  metal_chair:{ dmg: 23, durability: 28, range: 1.7, speed: 0.86, isRanged: false, knockback: 0.50 },
  tt_pistol:{ dmg: 24, durability: 0, range: 0, speed: 0.46, isRanged: true, ammoType: 'ammo_762tt', projSpeed: 22, pellets: 1, spread: 0.045, projSprite: Spr.BULLET },
  nagant:   { dmg: 32, durability: 0, range: 0, speed: 1.0, isRanged: true, ammoType: 'ammo_nagant', projSpeed: 22, pellets: 1, spread: 0.010, projSprite: Spr.BULLET },
  homemade_pistol:{ dmg: 20, durability: 0, range: 0, speed: 0.85, isRanged: true, ammoType: 'ammo_9mm', projSpeed: 15, pellets: 1, spread: 0.16, projSprite: Spr.BULLET },
  toz_shotgun:{ dmg: 7, durability: 0, range: 0, speed: 1.45, isRanged: true, ammoType: 'ammo_shells', projSpeed: 20, pellets: 9, spread: 0.11, projSprite: Spr.PELLET, soundId: 'shotgun' },
  harpoon_gun:{ dmg: 78, durability: 0, range: 0, speed: 1.9, isRanged: true, ammoType: 'ammo_harpoon', projSpeed: 17, pellets: 1, spread: 0.004, projSprite: Spr.NAIL, soundId: 'nailgun' },
};
