/* ── NPC dialogue & trade generation ──────────────────────────── */
/* Generic talk pools + trade item pools. Story NPC dialogue       */
/* lives in plot.ts — this module handles the dispatch.            */

import { type Entity, Occupation } from '../core/types';
import { getPlotDef } from './plot';
import { getNpcStateText } from '../systems/ai';
import { buildContextSnapshot, type ContextBuildOptions, type ContextSnapshot } from '../systems/context';
import { markNpcSpokenTo, type NpcMemory } from '../systems/npc_memory';
import { observeRecentRumorEventsForNpc, selectRumorForNpc } from '../systems/rumor';
import {
  CONTEXT_DANGEROUS_ZONE_LINES,
  CONTEXT_ACTIVE_CONTRACT_LINES,
  CONTEXT_FACTION_LINES,
  CONTEXT_FACTION_EVENT_FACTION_LINES,
  CONTEXT_FACTION_EVENT_LINES,
  CONTEXT_HIGH_TRUST_LINES,
  CONTEXT_HUNGER_LINES,
  CONTEXT_LIFT_ANOMALY_FLOOR_LINES,
  CONTEXT_LIFT_ANOMALY_LINES,
  CONTEXT_LOW_TRUST_LINES,
  CONTEXT_MONSTER_KILL_FLOOR_LINES,
  CONTEXT_MONSTER_KILL_LINES,
  CONTEXT_NEAR_CONTAINER_LINES,
  CONTEXT_OCCUPATION_LINES,
  CONTEXT_PRODUCTION_LINES,
  CONTEXT_PRODUCTION_OUTPUT_LINES,
  CONTEXT_PRODUCTION_SHORTAGE_LINES,
  CONTEXT_REPEATED_HELP_LINES,
  CONTEXT_SAFE_OWN_ZONE_LINES,
  CONTEXT_SAMOSBOR_AFTER_LINES,
  CONTEXT_SAMOSBOR_WARNING_LINES,
  CONTEXT_STOLEN_GOODS_LINES,
  CONTEXT_THIRST_LINES,
  CONTEXT_THEFT_FEAR_LINES,
  CONTEXT_WOUND_LINES,
} from './context_lines';

/* ── Generic talk pools ──────────────────────────────────────── */
const GENERAL_LINES = [
  'Стены опять гудят, как очередь у водяного окна. Перед самосбором они всегда становятся разговорчивее.',
  'Не ходи один по длинному коридору: одному потом легче числиться пропавшим.',
  'За стеной шорох. Может сосед, может шкаф, может сосед уже как шкаф.',
  'Тут раньше была кухня. Теперь стена. Домком говорит: перепланировка согласована постфактум.',
  'Свет мигает всё чаще. Лампы знают новости раньше людей.',
  'Сколько себя помню — одни стены, двери и люди, которые делают вид, что это район.',
  'Говорят, кто-то нашёл выход. Вернулся через стену и спросил, когда обед.',
  'Бетон ночью скрипит, будто вспоминает, кого держит внутри.',
  'Самосбор был вчера. Половина коридоров пропала, зато очередь стала короче.',
  'Сосед ушёл за водой и не вернулся. Талон вернулся мокрый.',
];

const FACTION_LINES: Record<number, string[]> = {
  0: ['Главное — не открывать во время сирены, даже если зовут голосом мамы.', 'Когда ел нормально? Нет, чай с хлебом не считается.', 'Еду и воду береги: пайки кончаются раньше сочувствия.'],
  1: ['Ликвидаторы идут первыми и возвращаются по ведомости.', 'После самосбора коридор надо зачищать, пока он не зачистил тебя.', 'Видел тварь? Бей первым, объясняй потом, если останется кому.'],
  2: ['Самосбор — не катастрофа. Катастрофа просит разрешения, а это милость.', 'Хрущ живой. Мы живём внутри его привычки.', 'Стены — плоть, двери — суставы, сирена — утренняя молитва.'],
  3: ['Данные неоднозначны. В переводе с научного: плохо и интересно.', 'По расчётам мир тороидальный. По ощущениям — коммунальный.', 'Нужны образцы стен, но стены не подписывают согласие.'],
};

const OCC_LINES: Record<number, string[]> = {
  [Occupation.COOK]:        ['Плита ещё работает. Это не надежда, это график.', 'Запасы тают. Тушёнка теперь звучит как молитва.'],
  [Occupation.DOCTOR]:      ['Приходи раненым, но не поздним. Поздних я только оформляю.', 'Таблеток мало, жалоб много, очередь делает вид, что это медицина.'],
  [Occupation.LOCKSMITH]:   ['Трубы опять потекли. Инструмент нужен такой, чтобы не боялся воды.', 'Дверь можно починить. Жильца после двери — не всегда.'],
  [Occupation.HUNTER]:      ['Сборки быстрые, но тупые. Это их делает честнее людей.', 'Охота тут простая: кто не считает патроны, тот сам становится добычей.'],
  [Occupation.PILGRIM]:     ['Помолись хрущу, если умеешь молчать после ответа.', 'Не всякая стена храм, но каждая умеет принимать жертвы.'],
  [Occupation.SCIENTIST]:   ['Я записываю всё, что вижу. Потом проверяю, не записывает ли оно меня.', 'Если образец шевелится только при начальстве, это уже открытие.'],
  [Occupation.STOREKEEPER]: ['Могу обменять кое-что полезное. Полезность узнаётся после сирены.', 'Товар есть. Справедливой цены нет, её самосбор унёс.'],
};

/* ── Talk text (called from NPC menu "Talk" tab) ─────────────── */
export function generateTalkText(npc: Entity, options: ContextBuildOptions = {}): string {
  // ── Plot NPC dialogue ──
  const def = getPlotDef(npc);
  if (def) {
    // Sequential lines before plotDone
    if (!npc.plotDone && def.talkLines.length > 0) {
      const idx = (npc._plotTalkIdx ?? 0) % def.talkLines.length;
      npc._plotTalkIdx = idx + 1;
      return def.talkLines[idx];
    }
    // Post-plot random lines (or fall through to generic)
    if (def.talkLinesPost.length > 0 && Math.random() < 0.75) {
      return def.talkLinesPost[Math.floor(Math.random() * def.talkLinesPost.length)];
    }
  }

  const now = options.time ?? performanceNowSeconds();
  const snapshot = buildContextSnapshot(npc, options);
  const memory = markNpcSpokenTo(npc, now);
  observeRecentRumorEventsForNpc(npc, snapshot, now);
  const contextLine = pickContextLine(snapshot, memory);
  if (contextLine) return contextLine;

  const rumorLine = selectRumorForNpc(npc, snapshot, now);
  if (rumorLine) return rumorLine;

  // NPC's current activity sometimes shows through
  if (npc.ai?.npcState !== undefined && Math.random() < 0.4) {
    return getNpcStateText(npc.ai.npcState);
  }

  const lines: string[] = [...GENERAL_LINES];
  if (npc.faction !== undefined) lines.push(...(FACTION_LINES[npc.faction] ?? []));
  if (npc.occupation !== undefined) lines.push(...(OCC_LINES[npc.occupation] ?? []));
  return lines[Math.floor(Math.random() * lines.length)];
}

function pickContextLine(snapshot: ContextSnapshot, memory: NpcMemory): string | undefined {
  if (memory.hurtByPlayer > 0 && memory.fear > 35) return pickContext(CONTEXT_THEFT_FEAR_LINES, memory);
  if (memory.trustPlayer < -25) return pickContext(CONTEXT_LOW_TRUST_LINES, memory);
  if (snapshot.isCritical || snapshot.isWounded) return pickContext(CONTEXT_WOUND_LINES, memory);
  if (snapshot.isHungry) return pickContext(CONTEXT_HUNGER_LINES, memory);
  if (snapshot.isThirsty) return pickContext(CONTEXT_THIRST_LINES, memory);
  if (snapshot.samosborActive === true || snapshot.hasRecentSamosborWarning) return pickContext(CONTEXT_SAMOSBOR_WARNING_LINES, memory);
  if (snapshot.samosborActive === false && (memory.fear > 60 || snapshot.hasRecentSamosborAftermath)) return pickContext(CONTEXT_SAMOSBOR_AFTER_LINES, memory);
  if (snapshot.isDangerousZone) return pickContext(CONTEXT_DANGEROUS_ZONE_LINES, memory);
  if (snapshot.isSafeOwnZone) return pickContext(CONTEXT_SAFE_OWN_ZONE_LINES, memory);
  if (memory.helpedByPlayer >= 2 && memory.trustPlayer > 25) return pickContext(CONTEXT_REPEATED_HELP_LINES, memory);
  if (snapshot.hasActiveContract && Math.random() < 0.45) return pickContext(CONTEXT_ACTIVE_CONTRACT_LINES, memory);
  if (snapshot.hasRecentPlayerTheft) return pickContext(CONTEXT_STOLEN_GOODS_LINES, memory);
  if (snapshot.hasRecentProductionShortage && Math.random() < 0.55) return pickContext(CONTEXT_PRODUCTION_SHORTAGE_LINES, memory);
  if (snapshot.hasRecentProductionOutput && Math.random() < 0.45) return pickContext(CONTEXT_PRODUCTION_OUTPUT_LINES, memory);
  if (snapshot.hasRecentLiftAnomaly) return pickContext(floorPool(CONTEXT_LIFT_ANOMALY_FLOOR_LINES, snapshot.floor, CONTEXT_LIFT_ANOMALY_LINES), memory);
  if (snapshot.hasRecentFactionClash) return pickContext(factionPool(snapshot, CONTEXT_FACTION_EVENT_FACTION_LINES, CONTEXT_FACTION_EVENT_LINES), memory);
  if (snapshot.hasRecentMonsterKill) return pickContext(floorPool(CONTEXT_MONSTER_KILL_FLOOR_LINES, snapshot.floor, CONTEXT_MONSTER_KILL_LINES), memory);
  if (snapshot.nearbyProduction && Math.random() < 0.35) return pickContext(CONTEXT_PRODUCTION_LINES, memory);
  if (snapshot.nearbyContainer && Math.random() < 0.35) return pickContext(CONTEXT_NEAR_CONTAINER_LINES, memory);
  if (memory.trustPlayer > 45) return pickContext(CONTEXT_HIGH_TRUST_LINES, memory);
  if (snapshot.npcOccupation !== undefined && Math.random() < 0.35) {
    const pool = CONTEXT_OCCUPATION_LINES[snapshot.npcOccupation];
    if (pool) return pickContext(pool, memory);
  }
  if (snapshot.npcFaction !== undefined && Math.random() < 0.25) {
    const pool = CONTEXT_FACTION_LINES[snapshot.npcFaction];
    if (pool) return pickContext(pool, memory);
  }
  return undefined;
}

function floorPool(pools: Record<number, readonly string[]>, floor: number | undefined, fallback: readonly string[]): readonly string[] {
  return floor !== undefined ? pools[floor] ?? fallback : fallback;
}

function factionPool(snapshot: ContextSnapshot, pools: Record<number, readonly string[]>, fallback: readonly string[]): readonly string[] {
  return snapshot.npcFaction !== undefined ? pools[snapshot.npcFaction] ?? fallback : fallback;
}

function pickContext(pool: readonly string[], memory: NpcMemory): string {
  return pool[Math.abs((memory.entityId + memory.knownRumorIds.length + memory.helpedByPlayer - memory.hurtByPlayer) | 0) % pool.length];
}

function performanceNowSeconds(): number {
  if (typeof performance !== 'undefined') return performance.now() / 1000;
  return Date.now() / 1000;
}

/* ── Trade item pools by occupation ──────────────────────────── */
const OCC_TRADE_ITEMS: Record<number, string[]> = {
  [Occupation.HOUSEWIFE]:   ['bread', 'water', 'cigs'],
  [Occupation.LOCKSMITH]:   ['wrench', 'pipe', 'flashlight', 'door_kit', 'block_kit'],
  [Occupation.SECRETARY]:   ['book', 'tea', 'cigs'],
  [Occupation.ELECTRICIAN]: ['wrench', 'flashlight', 'ammo_nails'],
  [Occupation.COOK]:        ['bread', 'kasha', 'kompot', 'canned', 'zhelemish_dried'],
  [Occupation.DOCTOR]:      ['bandage', 'pills', 'antidep', 'zhelemish_boiled'],
  [Occupation.TURNER]:      ['wrench', 'pipe', 'rebar'],
  [Occupation.MECHANIC]:    ['wrench', 'pipe', 'flashlight', 'jackhammer', 'ammo_nails'],
  [Occupation.STOREKEEPER]: ['bread', 'water', 'cigs', 'bandage', 'ammo_shells', 'cleaning_kit', 'zhelemish_raw', 'govnyak_roll', 'govnyak_brick'],
  [Occupation.ALCOHOLIC]:   ['bread', 'cigs', 'water', 'govnyak_roll'],
  [Occupation.SCIENTIST]:   ['flashlight', 'book', 'note', 'ammo_9mm', 'zhelemish_raw', 'govnyak_sample'],
  [Occupation.CHILD]:       ['bread', 'water'],
  [Occupation.DIRECTOR]:    ['book', 'tea', 'cigs', 'ammo_9mm'],
  [Occupation.TRAVELER]:    ['bread', 'water', 'canned', 'cigs', 'govnyak_roll'],
  [Occupation.PILGRIM]:     ['bread', 'water', 'knife', 'zhelemish_dried', 'govnyak_bad_batch'],
  [Occupation.HUNTER]:      ['knife', 'canned', 'rawmeat', 'ammo_9mm'],
};

export function generateNpcTradeItems(npc: Entity): { defId: string; count: number }[] {
  const items: { defId: string; count: number }[] = [];
  const pool = OCC_TRADE_ITEMS[npc.occupation ?? 0] ?? ['bread', 'water'];
  const count = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i++) {
    const defId = pool[Math.floor(Math.random() * pool.length)];
    items.push({ defId, count: 1 + Math.floor(Math.random() * 3) });
  }
  return items;
}
