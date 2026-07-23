import { Faction, type Entity, type GameState } from '../../core/types';
import { ENTITY_MASK_NPC, getEntityIndex } from '../entity_index';
import { getRecentEvents } from '../events';

const MUGGING_COOLDOWN_S = 300;
const MUGGING_DISTANCE_SQ = 15 * 15;
const MUGGING_GROUP_RADIUS = 10;
const MUGGING_MIN_GROUP_SIZE = 3;
const MUGGING_SCORE = 100;

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

  const relation = npc.playerRelation ?? 0;
  if (relation >= 0) return 0;

  const recentEvents = getRecentEvents(state, { type: 'mugging_start', limit: 1 });
  if (recentEvents.length > 0) {
    if (state.time - recentEvents[0].time < MUGGING_COOLDOWN_S) return 0;
  }

  const dx = player.x - npc.x;
  const dy = player.y - npc.y;
  const distSq = dx * dx + dy * dy;
  if (distSq > MUGGING_DISTANCE_SQ) return 0;

  const query: Entity[] = [];
  getEntityIndex().queryRadius(npc.x, npc.y, MUGGING_GROUP_RADIUS, query, ENTITY_MASK_NPC);
  let armedCount = 0;
  for (const e of query) {
    if (e.faction === Faction.WILD && !!e.weapon) {
      armedCount++;
    }
  }

  if (armedCount < MUGGING_MIN_GROUP_SIZE) return 0;

  return MUGGING_SCORE;
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
