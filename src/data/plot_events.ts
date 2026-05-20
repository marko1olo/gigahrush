/* ── Plot event handlers — story triggers, quest creation, messages ── */
/*   Extracted from main.ts for modularity.                            */

import {
  Tex,
  type Entity, type GameState,
  MonsterKind, QuestType,
  msg,
} from '../core/types';
import { World } from '../core/world';
import { PLOT_CHAIN } from './plot';
import { addItem } from '../systems/inventory';
import { awardXP } from '../systems/rpg';

/* ── Herald killed → portal to Void ─────────────────────────── */
export function onHeraldKilled(
  e: Entity, world: World, state: GameState,
): boolean {
  const heraldStepIndex = PLOT_CHAIN.findIndex(step =>
    step.type === QuestType.KILL &&
    step.targetMonsterKind === MonsterKind.HERALD &&
    (step.killNeeded ?? 1) === 3);
  if (heraldStepIndex < 0) return false;
  const heraldQuest = state.quests.find(q =>
    q.plotStepIndex === heraldStepIndex &&
    !q.done &&
    q.type === QuestType.KILL);
  if (!heraldQuest || (heraldQuest.killCount ?? 0) < (heraldQuest.killNeeded ?? 3)) return false;

  const px = Math.floor(e.x), py = Math.floor(e.y);
  const ci = world.idx(px, py);
  world.floorTex[ci] = Tex.PORTAL;
  const portalZid = world.zoneMap[ci];
  const portalZoneName = portalZid >= 0 ? `зона ${portalZid + 1}` : '???';
  state.msgs.push(msg('Марфа Пороговая: «Порог открыт. Видишь зелёный пол - входи быстро, но за голосами в стороне не ходи.»', state.time, '#0f8'));
  state.msgs.push(msg(`Проход в Пустоту открыт в ${portalZoneName}!`, state.time, '#0ff'));
  return true; // caller should updateWorldData
}

/* ── Creator killed → return portal ──────────────────────────── */
export function onCreatorKilled(
  e: Entity, world: World, state: GameState,
): boolean {
  const px = Math.floor(e.x), py = Math.floor(e.y);
  const ci = world.idx(px, py);
  world.floorTex[ci] = Tex.PORTAL;
  state.msgs.push(msg('Творец упал. Портал возврата открылся на его месте.', state.time, '#9f8'));
  state.msgs.push(msg('Встаньте в центр портала, пока залпы не вернулись.', state.time, '#0ff'));
  return true; // caller should updateWorldData
}

/* ── Auto-complete step 10 (VISIT Hell) on arrival ───────────── */
export function onHellArrival(
  player: Entity, state: GameState,
): void {
  const step10Quest = state.quests.find(q => q.plotStepIndex === 10 && !q.done);
  if (step10Quest) {
    step10Quest.done = true;
    if (step10Quest.rewardItem) {
      addItem(player, step10Quest.rewardItem, step10Quest.rewardCount ?? 1);
    }
    if (step10Quest.extraRewards) {
      for (const r of step10Quest.extraRewards) addItem(player, r.defId, r.count);
    }
    if (step10Quest.xpReward) awardXP(player, step10Quest.xpReward, state.msgs, state.time);
    state.msgs.push(msg(`Задание выполнено: ${step10Quest.desc}`, state.time, '#4f4'));
  }
}

/* ── Hell entry hint; the chain itself is data-driven in PLOT_CHAIN. */
export function tryCreateVoiceQuest(
  _world: World, _entities: Entity[], state: GameState,
): void {
  const hellContactStepIndex = PLOT_CHAIN.findIndex(step => step.giverNpcId === 'hell_contact');
  if (hellContactStepIndex < 0) return;
  if (!state.quests.some(q => q.plotStepIndex === 10 && q.done)) return;
  const chainAlreadyReached = state.quests.some(q =>
    q.plotStepIndex !== undefined &&
    q.plotStepIndex >= hellContactStepIndex);
  if (chainAlreadyReached) return;
  state.msgs.push(msg('Сквозь шум Мясного низа слышно человеческое дыхание. Рядом живой, найдите его до следующего боя.', state.time, '#0f8'));
  state.msgs.push(msg('Найдите Никанора Обожжённого в Мясном низу.', state.time, '#4af'));
}

/* ── Void entry messages — Creator trap reveal ───────────────── */
export function onVoidEntry(state: GameState): void {
  state.msgs.push(msg('Портал выбросил вас в Пустоту: двери называют чужие комнаты, документы не совпадают с выходами.', state.time, '#0f8'));
  state.msgs.push(msg('Творец закрыл обратный ход. Обычная дверь сейчас не вернёт вас домой.', state.time, '#9f8'));
  state.msgs.push(msg('Проверяйте рабочие предупреждения: они пишут, какая комната врёт.', state.time, '#9f8'));
  state.msgs.push(msg('Голос, который вёл вас сюда, был Творцом. Считайте новые объявления ловушкой.', state.time, '#fa0'));
  state.msgs.push(msg('Найдите Жана Пустотника. Он знает, где открыть обратный портал.', state.time, '#4af'));
}
