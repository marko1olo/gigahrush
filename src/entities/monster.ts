/* ── Monster shared types & registry ──────────────────────────── */

import { FloorLevel, MonsterKind } from '../core/types';
import { MONSTER_VARIANT_BY_ID, chooseMonsterVariant } from '../data/monster_variants';
import type { Entity } from '../core/types';

export type MonsterAIFlag =
  | 'wallBias'
  | 'debrisLurker'
  | 'lampPowered'
  | 'documentHunter'
  | 'waterStrider'
  | 'rangedClause'
  | 'closeReveal'
  | 'foodBait';

export interface MonsterDef {
  kind: MonsterKind;
  name: string;
  hp: number;
  speed: number;
  dmg: number;
  attackRate: number;
  sprite: number;
  isRanged?: boolean;       // shoots projectiles instead of melee
  projSpeed?: number;       // projectile speed (cells/sec)
  projSprite?: number;      // projectile sprite index
  aiFlags?: readonly MonsterAIFlag[];
  floors?: readonly FloorLevel[];
  counterplay?: string;
  lootHint?: string;
}

// Import all monsters
import { DEF as SBORKA_DEF, generateSprite as genSborka } from './sborka';
import { DEF as TVAR_DEF, generateSprite as genTvar } from './tvar';
import { DEF as POLZUN_DEF, generateSprite as genPolzun } from './polzun';
import { DEF as BETONNIK_DEF, generateSprite as genBetonnik } from './betonnik';
import { DEF as ZOMBIE_DEF, generateSprite as genZombie } from './zombie';
import { DEF as EYE_DEF, generateSprite as genEye, generateBoltSprite as genEyeBolt } from './eye';
import { DEF as NIGHTMARE_DEF, generateSprite as genNightmare } from './nightmare';
import { DEF as SHADOW_DEF, generateSprite as genShadow } from './shadow';
import { DEF as REBAR_DEF, generateSprite as genRebar } from './rebar';
import { DEF as MATKA_DEF, generateSprite as genMatka } from './matka';
import { DEF as IDOL_DEF, generateSprite as genIdol } from './idol';
import { DEF as MANCOBUS_DEF, generateSprite as genMancobus } from './mancobus';
import { DEF as HERALD_DEF, generateSprite as genHerald } from './herald';
import { DEF as CREATOR_DEF, generateSprite as genCreator } from './creator';
import { DEF as SPIRIT_DEF, generateSprite as genSpirit } from './spirit';
import { DEF as ROBOT_DEF, generateSprite as genRobot } from './robot';
import { DEF as SHOVNIK_DEF, generateSprite as genShovnik } from './shovnik';
import { DEF as LAMPOVY_DEF, generateSprite as genLampovy } from './lampovy';
import { DEF as PECHATEED_DEF, generateSprite as genPechateed } from './pechateed';
import { DEF as TUBE_EEL_DEF, generateSprite as genTubeEel } from './tube_eel';
import { DEF as PARAGRAPH_DEF, generateSprite as genParagraph } from './paragraph';
import { DEF as NELYUD_DEF, generateSprite as genNelyud } from './nelyud';
import { DEF as KRYSNOZHKA_DEF, generateSprite as genKrysnozhka } from './krysnozhka';
import { DEF as KOSTOREZ_DEF, generateSprite as genKostorez } from './kostorez';

export const MONSTERS: Record<MonsterKind, MonsterDef> = {
  [MonsterKind.SBORKA]:    SBORKA_DEF,
  [MonsterKind.TVAR]:      TVAR_DEF,
  [MonsterKind.POLZUN]:    POLZUN_DEF,
  [MonsterKind.BETONNIK]:  BETONNIK_DEF,
  [MonsterKind.ZOMBIE]:    ZOMBIE_DEF,
  [MonsterKind.EYE]:       EYE_DEF,
  [MonsterKind.NIGHTMARE]: NIGHTMARE_DEF,
  [MonsterKind.SHADOW]:    SHADOW_DEF,
  [MonsterKind.REBAR]:     REBAR_DEF,
  [MonsterKind.MATKA]:     MATKA_DEF,
  [MonsterKind.IDOL]:      IDOL_DEF,
  [MonsterKind.MANCOBUS]:  MANCOBUS_DEF,
  [MonsterKind.HERALD]:    HERALD_DEF,
  [MonsterKind.CREATOR]:   CREATOR_DEF,
  [MonsterKind.SPIRIT]:    SPIRIT_DEF,
  [MonsterKind.ROBOT]:     ROBOT_DEF,
  [MonsterKind.SHOVNIK]:   SHOVNIK_DEF,
  [MonsterKind.LAMPOVY]:   LAMPOVY_DEF,
  [MonsterKind.PECHATEED]: PECHATEED_DEF,
  [MonsterKind.TUBE_EEL]:  TUBE_EEL_DEF,
  [MonsterKind.PARAGRAPH]: PARAGRAPH_DEF,
  [MonsterKind.NELYUD]:    NELYUD_DEF,
  [MonsterKind.KRYSNOZHKA]: KRYSNOZHKA_DEF,
  [MonsterKind.KOSTOREZ]:  KOSTOREZ_DEF,
};

export const MONSTER_SPRITES: Record<MonsterKind, () => Uint32Array> = {
  [MonsterKind.SBORKA]:    genSborka,
  [MonsterKind.TVAR]:      genTvar,
  [MonsterKind.POLZUN]:    genPolzun,
  [MonsterKind.BETONNIK]:  genBetonnik,
  [MonsterKind.ZOMBIE]:    genZombie,
  [MonsterKind.EYE]:       genEye,
  [MonsterKind.NIGHTMARE]: genNightmare,
  [MonsterKind.SHADOW]:    genShadow,
  [MonsterKind.REBAR]:     genRebar,
  [MonsterKind.MATKA]:     genMatka,
  [MonsterKind.IDOL]:      genIdol,
  [MonsterKind.MANCOBUS]:  genMancobus,
  [MonsterKind.HERALD]:    genHerald,
  [MonsterKind.CREATOR]:   genCreator,
  [MonsterKind.SPIRIT]:    genSpirit,
  [MonsterKind.ROBOT]:     genRobot,
  [MonsterKind.SHOVNIK]:   genShovnik,
  [MonsterKind.LAMPOVY]:   genLampovy,
  [MonsterKind.PECHATEED]: genPechateed,
  [MonsterKind.TUBE_EEL]:  genTubeEel,
  [MonsterKind.PARAGRAPH]: genParagraph,
  [MonsterKind.NELYUD]:    genNelyud,
  [MonsterKind.KRYSNOZHKA]: genKrysnozhka,
  [MonsterKind.KOSTOREZ]:  genKostorez,
};

export const EYE_BOLT_SPRITE: () => Uint32Array = genEyeBolt;

export const NEW_MONSTER_KINDS: readonly MonsterKind[] = [
  MonsterKind.SHOVNIK,
  MonsterKind.LAMPOVY,
  MonsterKind.PECHATEED,
  MonsterKind.TUBE_EEL,
  MonsterKind.PARAGRAPH,
  MonsterKind.NELYUD,
  MonsterKind.KRYSNOZHKA,
  MonsterKind.KOSTOREZ,
];

export const NEW_MONSTERS_BY_FLOOR: Record<FloorLevel, readonly MonsterKind[]> = {
  [FloorLevel.MINISTRY]: [MonsterKind.SHOVNIK, MonsterKind.LAMPOVY, MonsterKind.PECHATEED, MonsterKind.PARAGRAPH, MonsterKind.NELYUD],
  [FloorLevel.KVARTIRY]: [MonsterKind.SHOVNIK, MonsterKind.LAMPOVY, MonsterKind.PECHATEED, MonsterKind.NELYUD, MonsterKind.KRYSNOZHKA],
  [FloorLevel.LIVING]: [MonsterKind.SHOVNIK, MonsterKind.LAMPOVY, MonsterKind.PECHATEED, MonsterKind.NELYUD, MonsterKind.KRYSNOZHKA],
  [FloorLevel.MAINTENANCE]: [MonsterKind.LAMPOVY, MonsterKind.TUBE_EEL, MonsterKind.KRYSNOZHKA, MonsterKind.KOSTOREZ],
  [FloorLevel.HELL]: [MonsterKind.KOSTOREZ],
  [FloorLevel.VOID]: [MonsterKind.PARAGRAPH],
};

/** Get generic type name for a monster kind (e.g. "Бетонник", "Тварь") */
export function monsterTypeName(kind: MonsterKind | undefined): string {
  if (kind === undefined) return 'Монстр';
  return MONSTERS[kind]?.name ?? 'Монстр';
}

/** Display name: NPC uses e.name, monsters use generic type name */
export function entityDisplayName(e: { name?: string; monsterKind?: MonsterKind; monsterVariantId?: string }): string {
  if (e.name) return e.name;
  if (e.monsterKind !== undefined) {
    const base = monsterTypeName(e.monsterKind);
    const variant = e.monsterVariantId ? MONSTER_VARIANT_BY_ID[e.monsterVariantId] : undefined;
    return variant ? `${variant.prefix} ${base}` : base;
  }
  return 'Цель';
}

export function applyMonsterVariant(e: Entity, floor: FloorLevel, force = false): void {
  if (e.monsterKind === undefined || e.monsterVariantId) return;
  if (!force && Math.random() > 0.35) return;
  const variant = chooseMonsterVariant(e.monsterKind, floor);
  if (!variant) return;

  e.monsterVariantId = variant.id;
  e.monsterDmgMult = variant.dmgMult;
  e.speed *= variant.speedMult;

  if (e.maxHp !== undefined) {
    const oldMax = Math.max(1, e.maxHp);
    const oldHp = e.hp ?? oldMax;
    const ratio = Math.max(0, Math.min(1, oldHp / oldMax));
    e.maxHp = Math.max(1, Math.round(oldMax * variant.hpMult));
    e.hp = Math.max(1, Math.round(e.maxHp * ratio));
  }
}
