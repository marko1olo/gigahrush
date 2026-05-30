/* ── Game data catalogue — barrel re-export ──────────────────── */
/*  Отдельные модули:
 *    weapons.ts  — WeaponStats + физ. оружие
 *    psi.ts      — ПСИ-сгустки
 *    rooms.ts    — RoomDef + ROOM_DEFS
 *    items.ts    — ITEMS
 *    names.ts    — randomName, freshNeeds
 *    notes.ts    — NOTES (лор-записки)
 */

import {
  PHYS_WEAPON_ROLE_TIERS,
  PHYS_WEAPON_STATS,
  WEAPON_ROLE_LABELS,
  type WeaponRoleTier,
  type WeaponStats,
} from './weapons';
import { PSI_WEAPON_ROLE_TIERS, PSI_WEAPON_STATS } from './psi';

// Merged weapon registry (physical + PSI)
export const WEAPON_STATS: Record<string, WeaponStats> = {
  ...PHYS_WEAPON_STATS,
  ...PSI_WEAPON_STATS,
};

export const WEAPON_ROLE_TIERS: Record<string, WeaponRoleTier> = {
  ...PHYS_WEAPON_ROLE_TIERS,
  ...PSI_WEAPON_ROLE_TIERS,
};

export type { WeaponRoleTier, WeaponStats } from './weapons';
export { WEAPON_ROLE_LABELS };
export { ROOM_DEFS, type RoomDef } from './rooms';
export { ITEMS } from './items';
export { randomName, type NameResult, freshNeeds } from './names';
export { NOTES } from './notes';
export { PLOT_NPCS, PLOT_CHAIN, isPlotNpc, getPlotDef, type PlotNpcDef, type PlotStep } from './plot';
export { PLOT_ROOMS, type PlotRoomDef } from './plot_rooms';
export { generateNpcTradeItems } from './dialogue';
export { ZHELEMISH_DEFS, ZHELEMISH_ITEM_IDS, getZhelemishDef, validateZhelemishDefs, type ZhelemishDef, type ZhelemishItemId } from './zhelemish_defs';
