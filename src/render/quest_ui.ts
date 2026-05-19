/* ── Quest log panel — paginated, one quest per page ──────────── */

import { FloorLevel, RoomType, type GameState, type Quest, QuestType } from '../core/types';
import { getRecentRumorLead } from '../systems/npc_memory';
import { formatQuestMinutes, questRemainingMinutes } from '../systems/quest_deadlines';
import { drawNeuroPanel, drawGlitchText } from './hud_fx';
import { drawWrappedText, fitText } from './ui_text';

const FLOOR_NAMES: Record<FloorLevel, string> = {
  [FloorLevel.MINISTRY]: 'Министерство',
  [FloorLevel.KVARTIRY]: 'Квартиры',
  [FloorLevel.LIVING]: 'Жилая зона',
  [FloorLevel.MAINTENANCE]: 'Коллекторы',
  [FloorLevel.HELL]: 'Преисподняя',
  [FloorLevel.VOID]: 'Пустота',
};

const ROOM_TYPE_NAMES: Record<RoomType, string> = {
  [RoomType.LIVING]: 'жилые комнаты',
  [RoomType.KITCHEN]: 'кухни',
  [RoomType.BATHROOM]: 'санузлы',
  [RoomType.STORAGE]: 'кладовые',
  [RoomType.MEDICAL]: 'медпункты',
  [RoomType.COMMON]: 'общие залы',
  [RoomType.PRODUCTION]: 'цеха',
  [RoomType.CORRIDOR]: 'коридоры',
  [RoomType.SMOKING]: 'курилки',
  [RoomType.OFFICE]: 'кабинеты',
  [RoomType.HQ]: 'штабы',
};

function routeFloor(q: Quest): FloorLevel | undefined {
  return q.visitFloor ?? q.targetFloor;
}

function routeDetail(q: Quest): string {
  if (q.targetHint) return q.targetHint;
  if (q.targetRoomType !== undefined) return `Ищите ${ROOM_TYPE_NAMES[q.targetRoomType]}.`;
  return '';
}

function questRouteHint(q: Quest, state: GameState): string {
  if (q.done) return '';
  const floor = routeFloor(q);
  const detail = routeDetail(q);
  if (floor !== undefined) {
    if (floor === state.currentFloor) return detail ? `Цель на этом этаже. ${detail}` : 'Цель на этом этаже.';
    const dir = floor > state.currentFloor ? '↓' : '↑';
    return detail
      ? `Цель: ${FLOOR_NAMES[floor]}. Лифт ${dir}. ${detail}`
      : `Цель: ${FLOOR_NAMES[floor]}. Ищите лифт ${dir}.`;
  }
  if (q.type === QuestType.TALK && q.targetPlotNpcId && q.targetNpcId === undefined) {
    return 'Собеседник на другом уровне. Ищите лифт.';
  }
  if (q.type === QuestType.VISIT && q.targetRoom === undefined) {
    return 'Комната отметится на карте, когда этаж будет найден.';
  }
  return detail;
}

export function drawQuestLog(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  sx: number, sy: number,
  uiTime = state.time,
): void {
  const pw = Math.min(400 * sx, ctx.canvas.width - 24 * sx);
  const ph = Math.min(280 * sy, ctx.canvas.height - 24 * sy);
  const px = (ctx.canvas.width - pw) / 2;
  const py = (ctx.canvas.height - ph) / 2;
  const time = uiTime;

  ctx.fillStyle = '#00040a';
  ctx.fillRect(px, py, pw, ph);
  drawNeuroPanel(ctx, px, py, pw, ph, time, 50);

  drawGlitchText(ctx, 'ЗАДАНИЯ [Q]', px + 8 * sx, py + 6 * sy, time, 500, '#6cf', 9 * sy);
  ctx.font = `${9 * sy}px monospace`;

  const active = state.quests.filter(q => !q.done);
  const done = state.quests.filter(q => q.done);
  const all = [...active, ...done];

  if (all.length === 0) {
    ctx.fillStyle = '#666';
    ctx.font = `${8 * sy}px monospace`;
    ctx.fillText('Нет заданий. Поговорите с жителями [E].', px + 8 * sx, py + 24 * sy);
    return;
  }

  const page = Math.min(state.questPage, all.length - 1);
  const q = all[page];
  const maxW = pw - 16 * sx;
  const contentBottom = py + ph - 22 * sy;

  // Page indicator
  ctx.fillStyle = '#888';
  ctx.font = `${7 * sy}px monospace`;
  ctx.fillText(`${page + 1} / ${all.length}`, px + pw - 40 * sx, py + 6 * sy);

  // Quest giver
  ctx.fillStyle = '#8af';
  ctx.font = `${8 * sy}px monospace`;
  ctx.fillText(fitText(ctx, `От: ${q.giverName ?? '???'}`, maxW), px + 8 * sx, py + 24 * sy);

  // Status badge
  const isFailed = q.failed === true;
  const isDone = q.done && !isFailed;
  ctx.fillStyle = isFailed ? '#f66' : isDone ? '#484' : '#dda';
  ctx.font = `${8 * sy}px monospace`;

  // Word-wrapped description
  const prefix = isFailed ? '× ' : isDone ? '✓ ' : '• ';
  let ly = py + 40 * sy;
  ly = drawWrappedText(
    ctx,
    prefix + q.desc,
    px + 8 * sx,
    ly,
    maxW,
    12 * sy,
    Math.max(1, Math.floor((contentBottom - ly) / (12 * sy))),
  );

  // Progress for KILL quests
  if (!q.done && q.killNeeded !== undefined && ly < contentBottom) {
    ly += 4 * sy;
    ctx.fillStyle = '#aaa';
    ctx.fillText(`Прогресс: ${q.killCount ?? 0}/${q.killNeeded}`, px + 8 * sx, ly);
  }

  const remaining = questRemainingMinutes(q, state.clock.totalMinutes);
  if (!q.done && remaining !== undefined && ly < contentBottom) {
    ly += 12 * sy;
    ctx.fillStyle = remaining <= 120 ? '#f66' : remaining <= 360 ? '#fa6' : '#8cf';
    ctx.font = `${7 * sy}px monospace`;
    ctx.fillText(`Срок: ${formatQuestMinutes(remaining)}`, px + 8 * sx, ly);
  } else if (isFailed && ly < contentBottom) {
    ly += 12 * sy;
    ctx.fillStyle = '#f66';
    ctx.font = `${7 * sy}px monospace`;
    ctx.fillText('Провалено: срок вышел', px + 8 * sx, ly);
  }

  const routeHint = questRouteHint(q, state);
  if (routeHint && ly < contentBottom) {
    ly += 12 * sy;
    ctx.fillStyle = '#8cf';
    ctx.font = `${7 * sy}px monospace`;
    ly = drawWrappedText(
      ctx,
      routeHint,
      px + 8 * sx,
      ly,
      maxW,
      9 * sy,
      Math.max(1, Math.floor((contentBottom - ly) / (9 * sy))),
    );
  }

  const rumorLead = getRecentRumorLead(state.time);
  if (rumorLead && ly < py + ph - 28 * sy) {
    ly += 8 * sy;
    ctx.fillStyle = '#d9a';
    ctx.font = `${7 * sy}px monospace`;
    drawWrappedText(ctx, `Слух: ${rumorLead.text}`, px + 8 * sx, ly, maxW, 9 * sy, Math.max(1, Math.floor((contentBottom - ly) / (9 * sy))));
  }

  // Bottom hint
  ctx.fillStyle = '#555';
  ctx.font = `${7 * sy}px monospace`;
  const hint = all.length > 1 ? '[W/S] листать  |  [Q] закрыть' : '[Q] закрыть';
  ctx.fillText(hint, px + 8 * sx, py + ph - 8 * sy);
}
