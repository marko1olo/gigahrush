/* ── RPG system: levels, XP, attributes, PSI ─────────────────── */

import {
  type Entity, type RPGStats, type Msg,
  W, MonsterKind, FloorLevel,
  msg,
} from '../core/types';

// ── XP formula: soft quadratic — looks linear at 1-10, quadratic long-term ──
// xpToLevel(L) = 80*L + 5*L²
// Level 1: 85,  Level 5: 525,  Level 10: 1300,  Level 20: 3600,  Level 50: 16500
export function xpForLevel(level: number): number {
  return 80 * level + 5 * level * level;
}

// Total XP needed to reach a given level (from 0)
export function totalXpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i <= level; i++) total += xpForLevel(i);
  return total;
}

// ── Base stats + per-level linear growth ─────────────────────────
const BASE_HP = 100;
const HP_PER_LEVEL = 10;
const BASE_PSI = 10;
const PSI_PER_LEVEL = 1;

export function getLevelHp(level: number): number { return BASE_HP + HP_PER_LEVEL * (level - 1); }
export function getLevelPsi(level: number): number { return BASE_PSI + PSI_PER_LEVEL * (level - 1); }

// ── Fresh RPG stats ──────────────────────────────────────────────
export function freshRPG(level = 1): RPGStats {
  const maxPsi = getLevelPsi(level);
  return {
    level,
    xp: 0,
    attrPoints: 0,
    str: 0,
    agi: 0,
    int: 0,
    psi: maxPsi,
    maxPsi,
  };
}

// ── Random RPG stats for NPC/monster at given level ──────────────
export function randomRPG(level: number): RPGStats {
  const points = Math.max(0, level - 1);
  let str = 0, agi = 0, int_ = 0;
  for (let i = 0; i < points; i++) {
    const r = Math.random();
    if (r < 0.34) str++;
    else if (r < 0.67) agi++;
    else int_++;
  }
  const maxPsi = Math.round(getLevelPsi(level) * (1 + 0.1 * int_));
  return {
    level,
    xp: 0,
    attrPoints: 0,
    str,
    agi,
    int: int_,
    psi: maxPsi,
    maxPsi,
  };
}

// ── Compute effective max PSI (level base + INT multiplier) ──────
export function getMaxPsi(rpg: RPGStats): number {
  return Math.round(getLevelPsi(rpg.level) * (1 + 0.1 * rpg.int));
}

// ── Compute effective max HP (level base + STR multiplier) ───────
export function getMaxHp(rpg: RPGStats): number {
  return Math.round(getLevelHp(rpg.level) * (1 + 0.1 * rpg.str));
}

// ── Attribute multipliers ────────────────────────────────────────
export function strMeleeDmgMult(rpg: RPGStats): number { return 1 + 0.1 * rpg.str; }
export function agiSpeedMult(rpg: RPGStats): number { return 1 + 0.1 * rpg.agi; }
export function agiAttackSpeedMult(rpg: RPGStats): number { return 1 / (1 + 0.1 * rpg.agi); } // lower cooldown
export function intXpMult(rpg: RPGStats): number { return 1 + 0.1 * rpg.int; }
export function strDurabilityWearMult(rpg: RPGStats): number { return 1 / (1 + 0.08 * rpg.str); }
export function strHeavyWeaponSpeedMult(rpg: RPGStats, baseCooldown: number): number {
  return baseCooldown >= 0.65 ? 1 / (1 + 0.05 * rpg.str) : 1;
}
export function agiRangedSpreadMult(rpg: RPGStats): number { return 1 / (1 + 0.12 * rpg.agi); }
export function intPsiCostMult(rpg: RPGStats): number { return Math.max(0.75, 1 - 0.035 * rpg.int); }
export function intContractRewardMult(rpg: RPGStats): number {
  return 1 + Math.min(0.35, 0.05 * rpg.int);
}
export function intDocumentRewardMult(rpg: RPGStats): number {
  return 1 + Math.min(0.5, 0.08 * rpg.int);
}

export function adjustedPsiCost(baseCost: number, rpg?: RPGStats): number {
  if (!rpg || baseCost <= 0) return baseCost;
  return Math.max(1, Math.round(baseCost * intPsiCostMult(rpg) * 10) / 10);
}

// ── Award XP and handle level-ups ────────────────────────────────
export function awardXP(e: Entity, amount: number, msgs: Msg[], time: number): void {
  if (!e.rpg) return;
  // INT bonus to XP
  const adjusted = Math.round(amount * intXpMult(e.rpg));
  e.rpg.xp += adjusted;

  msgs.push(msg(`+${adjusted} XP`, time, '#af4'));

  // Check for level up(s)
  while (e.rpg.xp >= xpForLevel(e.rpg.level + 1)) {
    e.rpg.xp -= xpForLevel(e.rpg.level + 1);
    e.rpg.level++;
    e.rpg.attrPoints++;
    // Recalculate maxPsi (level + INT)
    e.rpg.maxPsi = getMaxPsi(e.rpg);
    e.rpg.psi = e.rpg.maxPsi; // full PSI on level up
    // Recalculate maxHp (level + STR)
    if (e.maxHp !== undefined) {
      const newMax = getMaxHp(e.rpg);
      const diff = newMax - (e.maxHp ?? 100);
      e.maxHp = newMax;
      if (e.hp !== undefined) e.hp = Math.min(e.maxHp, e.hp + diff);
    }
    msgs.push(msg(`УРОВЕНЬ ${e.rpg.level}! +1 очко атрибутов`, time, '#ff4'));
  }
}

// ── Spend attribute point ────────────────────────────────────────
export function spendAttrPoint(e: Entity, attr: 'str' | 'agi' | 'int'): boolean {
  if (!e.rpg || e.rpg.attrPoints <= 0) return false;
  e.rpg.attrPoints--;
  e.rpg[attr]++;

  // Recalculate derived stats
  if (attr === 'str' && e.maxHp !== undefined) {
    const newMax = getMaxHp(e.rpg);
    const diff = newMax - (e.maxHp ?? 100);
    e.maxHp = newMax;
    if (e.hp !== undefined) e.hp = Math.min(e.maxHp, e.hp + Math.max(0, diff));
  }
  if (attr === 'int') {
    e.rpg.maxPsi = getMaxPsi(e.rpg);
  }
  return true;
}

// ── XP for killing a monster (scales with monster level) ─────────
const MONSTER_BASE_XP: Record<MonsterKind, number> = {
  [MonsterKind.SBORKA]:    15,
  [MonsterKind.TVAR]:      30,
  [MonsterKind.POLZUN]:    50,
  [MonsterKind.BETONNIK]: 120,
  [MonsterKind.ZOMBIE]:    20,
  [MonsterKind.EYE]:       25,
  [MonsterKind.NIGHTMARE]: 45,
  [MonsterKind.SHADOW]:    35,
  [MonsterKind.REBAR]:     55,
  [MonsterKind.MATKA]:    150,
  [MonsterKind.MANCOBUS]: 200,
  [MonsterKind.HERALD]:   180,
  [MonsterKind.CREATOR]:  500,
  [MonsterKind.SPIRIT]:   40,
  [MonsterKind.IDOL]:      10,
  [MonsterKind.ROBOT]:     35,
  [MonsterKind.SHOVNIK]:   32,
  [MonsterKind.LAMPOVY]:   28,
  [MonsterKind.PECHATEED]: 38,
  [MonsterKind.TUBE_EEL]:  55,
  [MonsterKind.PARAGRAPH]: 45,
  [MonsterKind.NELYUD]:    70,
  [MonsterKind.KRYSNOZHKA]: 24,
  [MonsterKind.KOSTOREZ]:  95,
};

export function xpForMonsterKill(kind: MonsterKind, monsterLevel: number): number {
  const base = MONSTER_BASE_XP[kind] ?? 20;
  return Math.round(base * (1 + 0.15 * (monsterLevel - 1)));
}

// ── XP for killing an NPC (based on NPC level) ──────────────────
export function xpForNpcKill(npcLevel: number): number {
  return Math.round(10 * (1 + 0.15 * (npcLevel - 1)));
}

// ── Zone level calculation ───────────────────────────────────────
// Level depends on distance from center of the zone grid + floor bonus.
const ZONE_CELL = Math.floor(W / 8); // ~128; must match shared.ts ZONE_CELL
export function calcZoneLevel(zoneCx: number, zoneCy: number, floor: FloorLevel): number {
  // Convert world-space center to grid coordinates (0-7)
  const zx = zoneCx / ZONE_CELL;
  const zy = zoneCy / ZONE_CELL;
  const dx = Math.abs(zx - 3.5);
  const dy = Math.abs(zy - 3.5);
  const distFromCenter = Math.sqrt(dx * dx + dy * dy);
  const baseLevel = Math.max(1, Math.round(1 + distFromCenter * 1.5));

  // Floor bonus
  const floorBonus: Record<FloorLevel, number> = {
    [FloorLevel.MINISTRY]: 0,
    [FloorLevel.KVARTIRY]: 0,
    [FloorLevel.LIVING]: 0,
    [FloorLevel.MAINTENANCE]: 4,
    [FloorLevel.HELL]: 9,
    [FloorLevel.VOID]: 15,
  };

  return baseLevel + (floorBonus[floor] ?? 0);
}

// ── Scale monster stats by zone level ────────────────────────────
export function scaleMonsterHp(baseHp: number, level: number): number {
  return Math.round(baseHp * (1 + 0.12 * (level - 1)));
}

export function scaleMonsterDmg(baseDmg: number, level: number): number {
  return Math.round(baseDmg * (1 + 0.10 * (level - 1)));
}

export function scaleMonsterSpeed(baseSpeed: number, level: number): number {
  return baseSpeed * (1 + 0.02 * (level - 1));
}

// ── Gaussian-ish random level (for NPCs) ─────────────────────────
export function gaussianLevel(center: number, sigma = 2): number {
  // Box-Muller transform
  const u1 = Math.random() || 0.001;
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.max(1, Math.round(center + z * sigma));
}

// ── PSI recovery is explicit: items, rewards, drains and level-ups only ──
export function regenPsi(_e: Entity, _dt: number): void {
}

// ── Quest difficulty based on item value and distance ────────────
export function questDifficulty(
  itemValue: number, distance: number, questTypeBase: number,
): number {
  // itemValue: 0-120, distance: 0-500+
  const valueMod = 1 + itemValue / 30;    // 1.0 - 5.0
  const distMod = 1 + distance / 100;     // 1.0 - 6.0
  return Math.round((questTypeBase * valueMod * distMod) * 10) / 10;
}

// ── XP and money reward from quest difficulty ────────────────────
export function questXpReward(difficulty: number): number {
  return Math.round(20 * difficulty);
}

export function questMoneyReward(difficulty: number): number {
  return Math.round(5 * difficulty);
}
