import { Faction, type Entity, type GameState } from '../../core/types';
import { getEntityIndex, ENTITY_MASK_NPC } from '../entity_index';
import { getRecentEvents } from '../events';

const MUGGING_MAX_DISTANCE_SQ = 25 * 25;
const MUGGING_COOLDOWN_SEC = 300;
const MUGGING_GROUP_RADIUS = 20;

const _muggingGroupOut: Entity[] = [];

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
  if (npc.faction !== Faction.WILD) return 0;
  if ((npc.playerRelation ?? 0) >= 0) return 0;

  const dx = npc.x - player.x;
  const dy = npc.y - player.y;
  if (dx * dx + dy * dy > MUGGING_MAX_DISTANCE_SQ) return 0;

  const recent = getRecentEvents(state, { type: 'mugging_start', limit: 1 });
  if (recent.length > 0) {
    if (state.time - recent[0].time < MUGGING_COOLDOWN_SEC) return 0;
  }

  getEntityIndex().queryRadiusCapped(npc.x, npc.y, MUGGING_GROUP_RADIUS, _muggingGroupOut, ENTITY_MASK_NPC, 16);

  let armedCount = 0;
  for (let i = 0; i < _muggingGroupOut.length; i++) {
    const ally = _muggingGroupOut[i];
    if (ally.faction === Faction.WILD && ally.alive && ally.weapon) {
      armedCount++;
    }
  }

  if (armedCount < 3) return 0;

  return 100;
}

/**
 * ЗАГЛУШКА: Логика тактики 'mugging'.
 *
 * Требования:
 * 1. Движение к игроку до дистанции в 2-3 клетки.
 * 2. Остановка и поддержание полукольца (чтобы не блокировать друг друга).
 * 3. Ожидание реакции игрока (оплаты или отказа).
 */
export function updateMuggingTactics(_npc: any, _state: GameState, _delta: number): void {
  // TODO: jules, реализуй логику тактики (передвижения) здесь
}
