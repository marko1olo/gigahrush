import { Faction, type Entity, type GameState } from '../../core/types';
import { ENTITY_MASK_NPC, getEntityIndex } from '../entity_index';
import { getNpcPlayerRelation } from '../npc_relations';
import { getRecentEvents } from '../events';
import { equippedCombatItemId, getWeaponStats } from '../inventory';

const MUGGING_EVAL_RADIUS = 12;
const MUGGING_COOLDOWN_SEC = 300;
const MUGGING_MIN_GROUP_SIZE = 3;

function isArmed(e: Entity): boolean {
  const wId = equippedCombatItemId(e);
  if (!wId) return false;
  const ws = getWeaponStats(e, wId);
  return ws.dmg > 3 || ws.isRanged;
}

const _muggingGroupQuery: Entity[] = [];

/**
 * ЗАГЛУШКА ДЛЯ СОБЫТИЯ "ГОП-СТОП" (jules agent task)
 *
 * Эта функция должна оценивать, насколько актуален intent 'mugging' для данного NPC.
 *
 * Требования:
 * 1. Проверить фракцию (WILD).
 * 2. Проверить дистанцию до игрока (используйте broadphase/entity_index).
 * 3. Проверить отношение игрока (playerRelation < 0).
 * 4. Убедиться, что группа состоит из >= 3 вооруженных NPC.
 * 5. Проверить cooldown события.
 *
 * Если все условия соблюдены, возвращаем высокий score. Иначе 0.
 */
export function scoreMuggingIntent(npc: Entity, state: GameState, player: Entity): number {
  // 1. Проверить фракцию (WILD)
  if (npc.faction !== Faction.WILD) return 0;

  // 3. Проверить отношение игрока (playerRelation < 0)
  if (getNpcPlayerRelation(npc) >= 0) return 0;

  // 5. Проверить cooldown события
  const recentStarts = getRecentEvents(state, { type: 'mugging_start', limit: 1 });
  if (recentStarts.length > 0 && state.time - recentStarts[0].time < MUGGING_COOLDOWN_SEC) return 0;

  // 2. Проверить дистанцию до игрока (используйте broadphase/entity_index)
  const index = getEntityIndex();
  // У нас нет wrappedDelta экспортированного, используем entity_index queryRadius как самый надежный способ проверить
  // дистанцию, так как он уже использует wrapping внутри себя.
  const count = index.queryRadiusCapped(player.x, player.y, MUGGING_EVAL_RADIUS, _muggingGroupQuery, ENTITY_MASK_NPC, 16);

  let npcInRadius = false;
  let armedWilds = 0;
  for (let i = 0; i < count; i++) {
    const e = _muggingGroupQuery[i];
    if (e.id === npc.id) npcInRadius = true;
    if (e.faction === Faction.WILD && isArmed(e)) {
      armedWilds++;
    }
  }

  // 4. Убедиться, что группа состоит из >= 3 вооруженных NPC, и сам NPC находится близко к игроку
  if (!npcInRadius) return 0;
  if (armedWilds < MUGGING_MIN_GROUP_SIZE) return 0;

  // Если все условия соблюдены, возвращаем высокий score.
  return 10;
}

/**
 * ЗАГЛУШКА: Логика тактики 'mugging'.
 *
 * Требования:
 * 1. Движение к игроку до дистанции в 2-3 клетки.
 * 2. Остановка и поддержание полукольца (чтобы не блокировать друг друга).
 * 3. Ожидание реакции игрока (оплаты или отказа).
 */
export function updateMuggingTactics(_npc: Entity, _state: GameState, _delta: number): void {
  // TODO: jules, реализуй логику тактики (передвижения) здесь
}
