import { EntityType } from '../core/types';

export const ACTIVE_ACTOR_SOFT_LIMIT = 4_096;
export const FLOOR_OBJECT_SOFT_LIMIT = 65_536;

export const ENTITY_SOFT_LIMITS: Partial<Record<EntityType, number>> = {
  [EntityType.NPC]: ACTIVE_ACTOR_SOFT_LIMIT,
  [EntityType.MONSTER]: ACTIVE_ACTOR_SOFT_LIMIT,
  [EntityType.ITEM_DROP]: FLOOR_OBJECT_SOFT_LIMIT,
  [EntityType.PROJECTILE]: FLOOR_OBJECT_SOFT_LIMIT,
  [EntityType.BILLBOARD]: FLOOR_OBJECT_SOFT_LIMIT,
} as const;

export function fitActiveActorCounts(npcs: number, monsters: number, cap = ACTIVE_ACTOR_SOFT_LIMIT): { npcs: number; monsters: number } {
  const npcTarget = Math.max(0, Math.round(npcs));
  const monsterTarget = Math.max(0, Math.round(monsters));
  const total = npcTarget + monsterTarget;
  const actorCap = Math.max(0, Math.floor(cap));
  if (total <= actorCap) return { npcs: npcTarget, monsters: monsterTarget };
  if (actorCap <= 0 || total <= 0) return { npcs: 0, monsters: 0 };

  const scaledNpc = npcTarget * actorCap / total;
  const scaledMonster = monsterTarget * actorCap / total;
  let fitNpcs = Math.floor(scaledNpc);
  let fitMonsters = Math.floor(scaledMonster);

  if (npcTarget > 0 && fitNpcs === 0 && actorCap > fitMonsters) fitNpcs = 1;
  if (monsterTarget > 0 && fitMonsters === 0 && actorCap > fitNpcs) fitMonsters = 1;

  while (fitNpcs + fitMonsters > actorCap) {
    if (fitMonsters >= fitNpcs && fitMonsters > 0) fitMonsters--;
    else if (fitNpcs > 0) fitNpcs--;
    else break;
  }

  let remainder = actorCap - fitNpcs - fitMonsters;
  const npcFrac = scaledNpc - Math.floor(scaledNpc);
  const monsterFrac = scaledMonster - Math.floor(scaledMonster);
  while (remainder > 0) {
    if ((monsterTarget > 0 && monsterFrac >= npcFrac) || npcTarget <= 0) fitMonsters++;
    else fitNpcs++;
    remainder--;
  }

  return { npcs: fitNpcs, monsters: fitMonsters };
}
