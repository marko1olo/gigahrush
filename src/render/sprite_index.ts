/* ── Sprite index registry — auto-computed, zero hardcoding ──── */
/*   Adding a new monster? Just add to MonsterKind enum and       */
/*   monster.ts registry. All sprite indices adjust automatically.*/
/*                                                                 */
/*   Layout: [NPCs | Travelers | ItemDrop | Monsters | EyeBolt | */
/*            Desk | Feature objects | Container objects |        */
/*            Bullet | Pellet | Nail | PsiBolt | PlasmaBolt |     */
/*            Hostile projectile variants | GaussBolt | BfgBolt | */
/*            FlameBolt | Grenade | TrainCar |                    */
/*            ArtNude variants | F69 female NPCs ]               */

import { ContainerKind, Feature, MonsterKind } from '../core/types';
import { NPC_SPRITE_GENERATORS } from '../entities/npc';

const NPC_COUNT     = NPC_SPRITE_GENERATORS.length;
const TRAVELER_COUNT = 3;
const PRIEST_COUNT   = 1;
// MonsterKind is a regular enum — Object.values has both string keys and numeric values
const MONSTER_COUNT  = Object.values(MonsterKind).filter(v => typeof v === 'number').length;
const FEATURE_SPRITE_COUNT = 15; // Feature.LAMP..Feature.SCREEN
const CONTAINER_SPRITE_COUNT = Object.values(ContainerKind).filter(v => typeof v === 'number').length;

let _i = 0;
_i += NPC_COUNT;          // occupation NPC sprites
_i += TRAVELER_COUNT;     // traveler sprites
_i += PRIEST_COUNT;       // priest sprite
const _VETERAN   = _i++;  // veteran sprite (Степаныч)
const _GORDON    = _i++;  // Gordon Freeman (maintenance)
const _MADOKA    = _i++;  // Медука Мегуку (hell)
const _PAKHOM    = _i++;  // Пахом Братишка (kvartiry)
const _ITEM_DROP = _i++;
const _MON_BASE  = _i; _i += MONSTER_COUNT;
const _EYE_BOLT  = _i++;
const _DESK      = _i++;
const _FEATURE_BASE = _i; _i += FEATURE_SPRITE_COUNT;
const _CONTAINER_BASE = _i; _i += CONTAINER_SPRITE_COUNT;
const _BULLET    = _i++;
const _PELLET    = _i++;
const _NAIL      = _i++;
const _PSI_BOLT  = _i++;
const _PLASMA_BOLT = _i++;
const _HOSTILE_BULLET = _i++;
const _HOSTILE_PELLET = _i++;
const _HOSTILE_NAIL = _i++;
const _HOSTILE_PSI_BOLT = _i++;
const _HOSTILE_PLASMA_BOLT = _i++;
const _HOSTILE_FLAME_BOLT = _i++;
const _GAUSS_BOLT  = _i++;
const _BFG_BOLT    = _i++;
const _FLAME_BOLT  = _i++;
const _GRENADE     = _i++;
const _TRAIN_CAR   = _i++;
const _ART_NUDE_BASE = _i; _i += 4;
const _F69_FEMALE_NPC_BASE = _i; _i += 8;

/** Named sprite indices — import these instead of magic numbers */
export const Spr = {
  VETERAN:   _VETERAN,
  GORDON:    _GORDON,
  MADOKA:    _MADOKA,
  PAKHOM:    _PAKHOM,
  ITEM_DROP: _ITEM_DROP,
  EYE_BOLT:  _EYE_BOLT,
  DESK:      _DESK,
  FEATURE_BASE: _FEATURE_BASE,
  CONTAINER_BASE: _CONTAINER_BASE,
  BULLET:    _BULLET,
  PELLET:    _PELLET,
  NAIL:      _NAIL,
  PSI_BOLT:  _PSI_BOLT,
  PLASMA_BOLT: _PLASMA_BOLT,
  HOSTILE_BULLET: _HOSTILE_BULLET,
  HOSTILE_PELLET: _HOSTILE_PELLET,
  HOSTILE_NAIL: _HOSTILE_NAIL,
  HOSTILE_PSI_BOLT: _HOSTILE_PSI_BOLT,
  HOSTILE_PLASMA_BOLT: _HOSTILE_PLASMA_BOLT,
  HOSTILE_FLAME_BOLT: _HOSTILE_FLAME_BOLT,
  GAUSS_BOLT:  _GAUSS_BOLT,
  BFG_BOLT:    _BFG_BOLT,
  FLAME_BOLT:  _FLAME_BOLT,
  GRENADE:     _GRENADE,
  TRAIN_CAR:   _TRAIN_CAR,
  ART_NUDE_BASE: _ART_NUDE_BASE,
  ART_NUDE_0:  _ART_NUDE_BASE,
  ART_NUDE_1:  _ART_NUDE_BASE + 1,
  ART_NUDE_2:  _ART_NUDE_BASE + 2,
  ART_NUDE_3:  _ART_NUDE_BASE + 3,
  F69_FEMALE_NPC_BASE: _F69_FEMALE_NPC_BASE,
  F69_FEMALE_NPC_0: _F69_FEMALE_NPC_BASE,
  F69_FEMALE_NPC_1: _F69_FEMALE_NPC_BASE + 1,
  F69_FEMALE_NPC_2: _F69_FEMALE_NPC_BASE + 2,
  F69_FEMALE_NPC_3: _F69_FEMALE_NPC_BASE + 3,
  F69_FEMALE_NPC_4: _F69_FEMALE_NPC_BASE + 4,
  F69_FEMALE_NPC_5: _F69_FEMALE_NPC_BASE + 5,
  F69_FEMALE_NPC_6: _F69_FEMALE_NPC_BASE + 6,
  F69_FEMALE_NPC_7: _F69_FEMALE_NPC_BASE + 7,
  TOTAL:     _i,
};

/** Compute sprite index for a monster kind — always correct regardless of monster count */
export function monsterSpr(kind: MonsterKind): number {
  return _MON_BASE + kind;
}

export function featureSpr(feature: Feature): number {
  return _FEATURE_BASE + feature - Feature.LAMP;
}

export function containerSpr(kind: ContainerKind): number {
  return _CONTAINER_BASE + kind;
}

/** Runtime sprite swap for non-player shooters using player weapon data */
export function hostileProjectileSprite(sprite: number): number {
  switch (sprite) {
    case Spr.BULLET: return Spr.HOSTILE_BULLET;
    case Spr.PELLET: return Spr.HOSTILE_PELLET;
    case Spr.NAIL: return Spr.HOSTILE_NAIL;
    case Spr.PSI_BOLT: return Spr.HOSTILE_PSI_BOLT;
    case Spr.PLASMA_BOLT: return Spr.HOSTILE_PLASMA_BOLT;
    case Spr.FLAME_BOLT: return Spr.HOSTILE_FLAME_BOLT;
    default: return sprite;
  }
}
