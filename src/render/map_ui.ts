/* ── Map rendering (minimap, full map) ────────────────────────── */

import {
  type Entity, type GameState, type Quest, EntityType, Cell, RoomType, W, QuestType,
  LiftDirection, MonsterKind, Faction, FloorLevel, ZoneFaction,
} from '../core/types';
import { World } from '../core/world';
import { ITEMS } from '../data/catalog';
import { hasAvailableQuest } from '../data/plot';
import {
  isQuestTargetOnCurrentFloor,
  questRouteFloor,
  questTargetLiftDirection,
  resolveQuestTargetRoom,
} from '../systems/contracts';
import { areFactionsHostile, getFactionUiSnapshot, type FactionUiSnapshot } from '../systems/factions';
import { getActiveSamosborVariant } from '../data/samosbor_variants';
import { getSamosborShelterRoomIds, getSamosborWarningSnapshot } from '../systems/samosbor';
import { getRecentRumorLead } from '../systems/npc_memory';
import { getWrongDoorMapCues } from '../systems/wrong_door';
import { getActiveCultProcessionSnapshots } from '../systems/faction_events';
import { seroburmalineSourceCellState } from '../systems/seroburmaline';
import { formatQuestMinutes, questRemainingMinutes } from '../systems/quest_deadlines';
import { getRouteCueMapReveals, type RouteCueMapReveal } from '../systems/route_cues';
import { ENTITY_MASK_VISIBLE, getEntityIndex } from '../systems/entity_index';
import { getBlackHandMarkCells } from './marks';
import { fitText as fitMapText } from './ui_text';

const MAP_SIZE = 80;
type QuestKind = 'plot' | 'side' | 'system';

const activeTalkTargets = new Map<number, QuestKind>();
const activeTalkPlotTargets = new Map<string, QuestKind>();
const activeQuestGivers = new Map<number, QuestKind>();
const activeKillKinds = new Map<MonsterKind, QuestKind>();
const activeTargetRoomTypes = new Map<RoomType, QuestKind>();
const activeTargetRooms = new Map<number, QuestKind>();
const activeFetchItems = new Map<string, QuestKind>();
const drawnTargetRooms = new Set<number>();
const MAX_CONCRETE_QUEST_ROOM_MARKERS = 8;
const mapEntityQuery: Entity[] = [];

const QUEST_KIND_PRIORITY: Record<QuestKind, number> = { plot: 3, side: 2, system: 1 };
const QUEST_MARKERS: Record<QuestKind, { label: string; stroke: string; fill: string; text: string }> = {
  plot: { label: 'СЮЖ', stroke: '#0b5570', fill: '#6cf', text: '#9df' },
  side: { label: 'БОК', stroke: '#704060', fill: '#f7a7d8', text: '#f7a7d8' },
  system: { label: 'СИСТ', stroke: '#76631a', fill: '#ffd35f', text: '#ffd35f' },
};
const FLOOR_SHORT_NAMES: Record<FloorLevel, string> = {
  [FloorLevel.MINISTRY]: 'МИН',
  [FloorLevel.KVARTIRY]: 'КВ',
  [FloorLevel.LIVING]: 'ЖИЛ',
  [FloorLevel.MAINTENANCE]: 'КОЛ',
  [FloorLevel.HELL]: 'АД',
  [FloorLevel.VOID]: 'ПУСТ',
};
const QUEST_TYPE_LABELS: Record<QuestType, string> = {
  [QuestType.FETCH]: 'ДОБ',
  [QuestType.VISIT]: 'МЕСТ',
  [QuestType.KILL]: 'БОЙ',
  [QuestType.TALK]: 'РАЗГ',
};

const FACTION_RGB: Record<ZoneFaction, [number, number, number]> = {
  [ZoneFaction.CITIZEN]: [74, 190, 145],
  [ZoneFaction.LIQUIDATOR]: [91, 158, 238],
  [ZoneFaction.CULTIST]: [188, 89, 255],
  [ZoneFaction.SAMOSBOR]: [230, 78, 92],
  [ZoneFaction.WILD]: [224, 167, 69],
};

const FACTION_SHORT: Record<ZoneFaction, string> = {
  [ZoneFaction.CITIZEN]: 'ГР',
  [ZoneFaction.LIQUIDATOR]: 'ЛК',
  [ZoneFaction.CULTIST]: 'КЛ',
  [ZoneFaction.SAMOSBOR]: 'СБ',
  [ZoneFaction.WILD]: 'ДК',
};

function routeFloor(q: Quest): FloorLevel | undefined {
  return questRouteFloor(q);
}

function questKind(q: Quest): QuestKind {
  if (q.plotStepIndex !== undefined) return 'plot';
  if (q.sideQuestId !== undefined) return 'side';
  return 'system';
}

function mergeQuestKind(current: QuestKind | undefined, next: QuestKind): QuestKind {
  return current && QUEST_KIND_PRIORITY[current] >= QUEST_KIND_PRIORITY[next] ? current : next;
}

function setMarkerKind<K>(map: Map<K, QuestKind>, key: K, kind: QuestKind): void {
  map.set(key, mergeQuestKind(map.get(key), kind));
}

function clearActiveQuestMarkers(): void {
  activeTalkTargets.clear();
  activeTalkPlotTargets.clear();
  activeQuestGivers.clear();
  activeKillKinds.clear();
  activeTargetRoomTypes.clear();
  activeTargetRooms.clear();
  activeFetchItems.clear();
}

function displayFloor(q: Quest, currentFloor: FloorLevel | undefined): FloorLevel | undefined {
  const floor = routeFloor(q);
  if (floor !== undefined) return floor;
  if (q.targetRoom !== undefined || q.targetNpcId !== undefined || q.targetMonsterKind !== undefined) return currentFloor;
  if (q.plotStepIndex === undefined && q.sideQuestId === undefined) return currentFloor;
  return undefined;
}

function objectiveFloorLabel(q: Quest, currentFloor: FloorLevel | undefined, state: GameState | undefined): string {
  const floor = displayFloor(q, currentFloor);
  if (floor === undefined) return 'ЭТ ?';
  const here = state ? isQuestTargetOnCurrentFloor(q, state) : floor === currentFloor;
  return here ? 'ЭТ ЗДЕСЬ' : `ЭТ ${FLOOR_SHORT_NAMES[floor]}`;
}

function questTargetVisibleOnMap(q: Quest, currentFloor: FloorLevel | undefined, state: GameState | undefined): boolean {
  if (state) return isQuestTargetOnCurrentFloor(q, state);
  const floor = routeFloor(q);
  return floor === undefined || floor === currentFloor;
}

function objectiveDeadlineLabel(q: Quest, state: GameState | undefined): string {
  if (!state) return 'СРОК --';
  const remaining = questRemainingMinutes(q, state.clock.totalMinutes);
  return remaining === undefined ? 'СРОК --' : `СРОК ${formatQuestMinutes(remaining)}`;
}

function objectiveDeadlineColor(q: Quest, state: GameState | undefined): string {
  if (!state) return '#789';
  const remaining = questRemainingMinutes(q, state.clock.totalMinutes);
  if (remaining === undefined) return '#789';
  if (remaining <= 120) return '#f66';
  if (remaining <= 360) return '#fa6';
  return '#8cf';
}

function objectiveRewardLabel(q: Quest): string {
  if ((q.moneyReward ?? 0) > 0) return `НАГР ${q.moneyReward}₽`;
  if (q.rewardItem) return `НАГР ${ITEMS[q.rewardItem]?.name ?? q.rewardItem}`;
  if ((q.xpReward ?? 0) > 0) return `НАГР ${q.xpReward}XP`;
  return 'НАГР --';
}

function objectiveSummary(q: Quest, currentFloor: FloorLevel | undefined, state: GameState | undefined): string {
  const marker = QUEST_MARKERS[questKind(q)];
  return `${marker.label} ${QUEST_TYPE_LABELS[q.type]} ${objectiveFloorLabel(q, currentFloor, state)} ${objectiveDeadlineLabel(q, state)} ${objectiveRewardLabel(q)}`;
}

function primaryObjective(quests: Quest[] | undefined, state: GameState | undefined): Quest | undefined {
  let best: Quest | undefined;
  let bestScore = -Infinity;
  if (!quests) return undefined;
  for (const q of quests) {
    if (q.done) continue;
    const remaining = state ? questRemainingMinutes(q, state.clock.totalMinutes) : undefined;
    const deadlinePressure = remaining === undefined ? 0 : Math.max(0, 600 - remaining);
    const rewardPressure = Math.min(80, (q.moneyReward ?? 0) / 4 + (q.xpReward ?? 0) / 8);
    const score = QUEST_KIND_PRIORITY[questKind(q)] * 1000 + deadlinePressure + rewardPressure;
    if (score > bestScore) {
      best = q;
      bestScore = score;
    }
  }
  return best;
}

function activeVisitLiftDirection(
  quests: Quest[] | undefined,
  currentFloor: FloorLevel | undefined,
  state: GameState | undefined,
): LiftDirection | undefined {
  if (!quests || currentFloor === undefined) return undefined;
  for (const q of quests) {
    const floor = routeFloor(q);
    if (q.done || floor === undefined) continue;
    if (state) {
      const dir = questTargetLiftDirection(q, state);
      if (dir !== undefined) return dir;
      continue;
    }
    if (floor === currentFloor) continue;
    return floor > currentFloor ? LiftDirection.DOWN : LiftDirection.UP;
  }
  return undefined;
}

function drawQuestDiamond(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  sz: number, sw: number,
  stroke: string, fill: string,
): void {
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y - sz);
  ctx.lineTo(x + sw, y);
  ctx.lineTo(x, y + sz);
  ctx.lineTo(x - sw, y);
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawQuestMarker(ctx: CanvasRenderingContext2D, x: number, y: number, sz: number, sw: number, kind: QuestKind): void {
  const marker = QUEST_MARKERS[kind];
  drawQuestDiamond(ctx, x, y, sz, sw, marker.stroke, marker.fill);
}

function drawObjectiveStrip(
  ctx: CanvasRenderingContext2D,
  quests: Quest[] | undefined,
  currentFloor: FloorLevel | undefined,
  state: GameState | undefined,
  x: number,
  y: number,
  w: number,
  sx: number,
  sy: number,
  maxRows: number,
): void {
  if (!quests) return;
  let activeCount = 0;
  for (const q of quests) if (!q.done) activeCount++;
  if (activeCount === 0) return;

  const rowH = 11 * sy;
  const panelH = maxRows * rowH + 5 * sy;
  ctx.fillStyle = 'rgba(0,4,8,0.72)';
  ctx.fillRect(x - 3 * sx, y - 7 * sy, w + 6 * sx, panelH);
  ctx.strokeStyle = '#1b3440';
  ctx.strokeRect(x - 3 * sx + 0.5, y - 7 * sy + 0.5, w + 6 * sx - 1, panelH - 1);

  ctx.font = `${7 * sy}px monospace`;
  let drawn = 0;
  for (const q of quests) {
    if (q.done) continue;
    const marker = QUEST_MARKERS[questKind(q)];
    const rowY = y + drawn * rowH;
    const suffix = drawn === maxRows - 1 && activeCount > maxRows ? ` +${activeCount - maxRows}` : '';
    ctx.fillStyle = marker.text;
    ctx.fillText(marker.label, x, rowY);
    ctx.fillStyle = objectiveDeadlineColor(q, state);
    const text = fitMapText(ctx, `${QUEST_TYPE_LABELS[q.type]} ${objectiveFloorLabel(q, currentFloor, state)} ${objectiveDeadlineLabel(q, state)} ${objectiveRewardLabel(q)}${suffix}`, w - 32 * sx);
    ctx.fillText(text, x + 32 * sx, rowY);
    drawn++;
    if (drawn >= maxRows) break;
  }
}

function tintFactionColor(cr: number, cg: number, cb: number, faction: ZoneFaction, amount: number): [number, number, number] {
  const [fr, fg, fb] = FACTION_RGB[faction];
  return [
    Math.round(cr * (1 - amount) + fr * amount),
    Math.round(cg * (1 - amount) + fg * amount),
    Math.round(cb * (1 - amount) + fb * amount),
  ];
}

function eventColor(severity: number): string {
  return severity >= 5 ? '#f35' : severity >= 4 ? '#fa4' : severity >= 3 ? '#fc6' : '#8cf';
}

function drawSamosborWarningRisk(
  ctx: CanvasRenderingContext2D,
  world: World,
  state: GameState | undefined,
  currentFloor: FloorLevel | undefined,
  uiTime: number,
  pxI: number,
  pyI: number,
  mapX: number,
  mapY: number,
  mapW: number,
  mapH: number,
  radius: number,
  cellW: number,
  cellH: number,
): void {
  if (!state) return;
  const warning = getSamosborWarningSnapshot(state);
  if (!warning || warning.floor !== currentFloor) return;
  const dx = world.delta(pxI, warning.zoneX);
  const dy = world.delta(pyI, warning.zoneY);
  if (Math.abs(dx) > radius || Math.abs(dy) > radius) return;

  const x = mapX + (dx + radius) * cellW;
  const y = mapY + (dy + radius) * cellH;
  const pulse = 0.55 + 0.35 * Math.sin(uiTime * 8);
  const riskR = Math.max(5, Math.min(18, Math.max(cellW, cellH) * 11));

  ctx.save();
  ctx.globalAlpha = 0.25 + pulse * 0.22;
  ctx.fillStyle = warning.tint;
  ctx.beginPath();
  ctx.arc(x, y, riskR, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.75;
  ctx.strokeStyle = warning.tint;
  ctx.lineWidth = Math.max(1, Math.min(3, cellW * 2));
  ctx.beginPath();
  ctx.arc(x, y, riskR + 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - riskR - 3, y);
  ctx.lineTo(x + riskR + 3, y);
  ctx.moveTo(x, y - riskR - 3);
  ctx.lineTo(x, y + riskR + 3);
  ctx.stroke();
  if (warning.variantId === 'maronary' && warning.wrongDoorX !== undefined && warning.wrongDoorY !== undefined) {
    const ddx = world.delta(pxI, warning.wrongDoorX);
    const ddy = world.delta(pyI, warning.wrongDoorY);
    if (Math.abs(ddx) <= radius && Math.abs(ddy) <= radius) {
      const doorX = mapX + (ddx + radius) * cellW;
      const doorY = mapY + (ddy + radius) * cellH;
      const markerW = Math.max(5, Math.min(12, cellW * 7));
      const markerH = Math.max(7, Math.min(16, cellH * 10));
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = '#35ff66';
      ctx.lineWidth = Math.max(1, Math.min(2, cellW * 1.5));
      ctx.strokeRect(doorX - markerW * 0.5, doorY - markerH * 0.5, markerW, markerH);
      ctx.beginPath();
      ctx.moveTo(doorX - markerW * 0.3, doorY);
      ctx.lineTo(doorX + markerW * 0.3, doorY);
      ctx.stroke();
    }
  }
  if (mapW > 140 && mapH > 120) {
    ctx.globalAlpha = 0.85;
    const panelW = Math.min(158, Math.max(82, mapW * 0.28));
    const panelH = 29;
    const panelX = Math.max(mapX + 4, Math.min(mapX + mapW - panelW - 4, x + riskR + 4));
    const panelY = Math.max(mapY + 4, Math.min(mapY + mapH - panelH - 4, y - 13));
    ctx.fillStyle = warning.variantId === 'veretar' ? 'rgba(22,22,20,0.82)' : 'rgba(8,8,12,0.78)';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = warning.tint;
    ctx.lineWidth = 1;
    ctx.strokeRect(panelX + 0.5, panelY + 0.5, panelW - 1, panelH - 1);
    ctx.fillStyle = warning.variantId === 'veretar' ? '#f4f1df' : '#ffd36a';
    ctx.font = '8px monospace';
    ctx.fillText(`${warning.signals.mapCode} ${warning.secondsLeft}s`, panelX + 4, panelY + 9);
    ctx.fillStyle = '#ddd';
    ctx.font = '7px monospace';
    ctx.fillText(fitMapText(ctx, warning.signals.audioLine, panelW - 8), panelX + 4, panelY + 18);
    ctx.fillText(fitMapText(ctx, warning.signals.mapLine, panelW - 8), panelX + 4, panelY + 26);
  }
  ctx.restore();
}

function drawCultProcessionOverlays(
  ctx: CanvasRenderingContext2D,
  world: World,
  state: GameState | undefined,
  currentFloor: FloorLevel | undefined,
  uiTime: number,
  pxI: number,
  pyI: number,
  mapX: number,
  mapY: number,
  mapW: number,
  mapH: number,
  radius: number,
  cellW: number,
  cellH: number,
): void {
  if (!state || currentFloor === undefined) return;
  for (const p of getActiveCultProcessionSnapshots(state)) {
    if (p.floor !== currentFloor) continue;
    const dx = world.delta(pxI, Math.floor(p.x));
    const dy = world.delta(pyI, Math.floor(p.y));
    if (Math.abs(dx) > radius || Math.abs(dy) > radius) continue;

    const x = mapX + (dx + radius) * cellW;
    const y = mapY + (dy + radius) * cellH;
    const pulse = 0.5 + 0.35 * Math.sin(uiTime * 7 + p.id);
    const fearR = Math.max(5, Math.min(22, Math.max(cellW, cellH) * p.fearRadius));
    const actionR = Math.max(3, Math.min(12, Math.max(cellW, cellH) * p.actionRadius));
    const color = p.disrupted ? '#fa0' : p.reported ? '#8cf' : p.disguised ? '#c8f' : '#b45cff';
    const label = p.disrupted ? 'СОРВ'
      : p.reported ? 'ДОН'
      : p.disguised ? 'ЗНАК'
      : p.followed ? 'ХВОСТ'
      : p.avoided ? 'ОБХ'
      : 'КУЛЬТ';

    ctx.save();
    ctx.globalAlpha = 0.12 + pulse * 0.12;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, fearR, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, Math.min(3, cellW * 2));
    ctx.beginPath();
    ctx.arc(x, y, actionR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - actionR - 2, y);
    ctx.lineTo(x + actionR + 2, y);
    ctx.moveTo(x, y - actionR - 2);
    ctx.lineTo(x, y + actionR + 2);
    ctx.stroke();
    if (mapW > 140 && mapH > 120) {
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = color;
      ctx.font = '8px monospace';
      ctx.fillText(`${label} ${Math.ceil(p.expiresIn)}s`, x + actionR + 4, y - 4);
    }
    ctx.restore();
  }
}

function drawBlackHandMarks(
  ctx: CanvasRenderingContext2D,
  world: World,
  pxI: number,
  pyI: number,
  mapX: number,
  mapY: number,
  radius: number,
  cellW: number,
  cellH: number,
): void {
  const marks = getBlackHandMarkCells(world);
  if (marks.length === 0) return;
  const size = Math.max(2, Math.min(7, Math.max(cellW, cellH) * 2.2));

  ctx.save();
  ctx.lineWidth = Math.max(1, Math.min(2, size * 0.28));
  for (const mark of marks) {
    const dx = world.delta(pxI, mark.x);
    const dy = world.delta(pyI, mark.y);
    if (Math.abs(dx) > radius || Math.abs(dy) > radius) continue;

    const x = mapX + (dx + radius + 0.5) * cellW;
    const y = mapY + (dy + radius + 0.5) * cellH;
    ctx.globalAlpha = 0.82;
    ctx.fillStyle = '#050404';
    ctx.strokeStyle = '#b33';
    ctx.beginPath();
    ctx.arc(x, y + size * 0.12, size * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    for (let i = -1; i <= 2; i++) {
      const fx = x + i * size * 0.18;
      ctx.moveTo(fx, y - size * 0.72);
      ctx.lineTo(fx, y - size * 0.08);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawFactionZoneMarkers(
  ctx: CanvasRenderingContext2D,
  world: World,
  snapshot: FactionUiSnapshot | undefined,
  currentFloor: FloorLevel | undefined,
  pxI: number,
  pyI: number,
  mapX: number,
  mapY: number,
  mapW: number,
  mapH: number,
  radius: number,
  cellW: number,
  cellH: number,
  uiTime: number,
): void {
  if (!snapshot || snapshot.floor !== currentFloor) return;
  const showText = mapW > 140 && mapH > 120;
  ctx.save();
  ctx.font = showText ? '8px monospace' : '6px monospace';
  ctx.textBaseline = 'middle';
  for (const zone of snapshot.zones) {
    const dx = world.delta(pxI, zone.x);
    const dy = world.delta(pyI, zone.y);
    if (Math.abs(dx) > radius || Math.abs(dy) > radius) continue;

    const x = mapX + (dx + radius + 0.5) * cellW;
    const y = mapY + (dy + radius + 0.5) * cellH;
    const [or, og, ob] = FACTION_RGB[zone.owner];
    const pulse = zone.contested ? 0.55 + 0.35 * Math.sin(uiTime * 6 + zone.zoneId) : 0.55;
    const markerR = Math.max(3, Math.min(showText ? 7 : 4, Math.max(cellW, cellH) * (zone.contested ? 3.2 : 2.2)));

    ctx.globalAlpha = zone.contested ? 0.72 + pulse * 0.2 : 0.72;
    ctx.strokeStyle = `rgb(${or},${og},${ob})`;
    ctx.lineWidth = zone.contested ? 2 : 1;
    ctx.beginPath();
    ctx.arc(x, y, markerR, 0, Math.PI * 2);
    ctx.stroke();
    if (zone.contested) {
      const [dr, dg, db] = FACTION_RGB[zone.dominant];
      ctx.fillStyle = `rgba(${dr},${dg},${db},0.45)`;
      ctx.fillRect(x - markerR * 0.65, y - markerR * 0.65, markerR * 1.3, markerR * 1.3);
    }

    if (!showText) continue;
    const text = zone.contested
      ? `${FACTION_SHORT[zone.owner]}/${FACTION_SHORT[zone.dominant]} ${Math.round(zone.pressure * 100)}%`
      : `${FACTION_SHORT[zone.owner]} ${zone.zoneId + 1}`;
    const label = fitMapText(ctx, text, 64);
    const tw = ctx.measureText(label).width;
    const lx = x + markerR + 3;
    const ly = y - 1;
    ctx.globalAlpha = 0.82;
    ctx.fillStyle = 'rgba(0,0,0,0.62)';
    ctx.fillRect(lx - 2, ly - 6, tw + 4, 11);
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = zone.contested ? '#ffd36a' : `rgb(${or},${og},${ob})`;
    ctx.fillText(label, lx, ly);
  }
  ctx.restore();
}

function drawFactionEventMarkers(
  ctx: CanvasRenderingContext2D,
  world: World,
  snapshot: FactionUiSnapshot | undefined,
  currentFloor: FloorLevel | undefined,
  pxI: number,
  pyI: number,
  mapX: number,
  mapY: number,
  mapW: number,
  mapH: number,
  radius: number,
  cellW: number,
  cellH: number,
  uiTime: number,
): void {
  if (!snapshot) return;
  const showText = mapW > 140 && mapH > 120;
  ctx.save();
  ctx.font = '8px monospace';
  ctx.textBaseline = 'middle';
  for (const event of snapshot.recentEvents) {
    if (event.floor !== currentFloor) continue;
    const dx = world.delta(pxI, Math.floor(event.x));
    const dy = world.delta(pyI, Math.floor(event.y));
    if (Math.abs(dx) > radius || Math.abs(dy) > radius) continue;

    const x = mapX + (dx + radius + 0.5) * cellW;
    const y = mapY + (dy + radius + 0.5) * cellH;
    const color = eventColor(event.severity);
    const age = Math.max(0, snapshot.time - event.time);
    const pulse = 0.45 + 0.35 * Math.sin(uiTime * 8 + event.id);
    const r = Math.max(4, Math.min(10, Math.max(cellW, cellH) * (4 + event.severity)));

    ctx.globalAlpha = Math.max(0.35, 0.9 - age / 180) + pulse * 0.08;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, Math.min(3, cellW * 2));
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.lineTo(x + r, y);
    ctx.lineTo(x, y + r);
    ctx.lineTo(x - r, y);
    ctx.closePath();
    ctx.stroke();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = color;
    ctx.fill();

    if (!showText) continue;
    const name = event.name || String(event.type);
    const phase = event.phase === 'aftermath' ? ' итог' : event.phase === 'start' ? ' старт' : '';
    const label = fitMapText(ctx, `${name}${phase}`, 120);
    const tw = ctx.measureText(label).width;
    ctx.globalAlpha = 0.82;
    ctx.fillStyle = 'rgba(0,0,0,0.66)';
    ctx.fillRect(x + r + 2, y - 6, tw + 5, 11);
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = color;
    ctx.fillText(label, x + r + 4, y);
  }
  ctx.restore();
}

function drawFactionMapLegend(
  ctx: CanvasRenderingContext2D,
  snapshot: FactionUiSnapshot | undefined,
  currentFloor: FloorLevel | undefined,
  x: number,
  y: number,
  maxW: number,
): void {
  if (!snapshot || snapshot.floor !== currentFloor) return;
  ctx.save();
  ctx.font = '8px monospace';
  ctx.textBaseline = 'top';
  let tx = x;
  for (const owner of snapshot.owners) {
    if (owner.zones <= 0) continue;
    const [r, g, b] = FACTION_RGB[owner.faction];
    const label = `${FACTION_SHORT[owner.faction]} ${owner.zones}${owner.contested > 0 ? `/${owner.contested}` : ''}`;
    const tw = ctx.measureText(label).width + 12;
    if (tx + tw > x + maxW) break;
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(tx, y + 2, 6, 6);
    ctx.fillStyle = '#9aa';
    ctx.fillText(label, tx + 9, y);
    tx += tw + 5;
  }
  const contested = snapshot.contestedZones > 0 ? `спор ${snapshot.contestedZones}` : 'спора нет';
  const hint = fitMapText(ctx, `${contested}; A/B владелец/давление`, maxW - Math.max(0, tx - x));
  if (tx < x + maxW - 20) {
    ctx.fillStyle = snapshot.contestedZones > 0 ? '#ffd36a' : '#666';
    ctx.fillText(hint, tx, y);
  }
  ctx.restore();
}

function drawWrongDoorCues(
  ctx: CanvasRenderingContext2D,
  world: World,
  state: GameState | undefined,
  uiTime: number,
  pxI: number,
  pyI: number,
  mapX: number,
  mapY: number,
  radius: number,
  cellW: number,
  cellH: number,
): void {
  const cues = getWrongDoorMapCues(world, state);
  if (cues.length === 0) return;

  ctx.save();
  ctx.strokeStyle = '#35ff66';
  ctx.fillStyle = '#35ff66';
  ctx.lineWidth = Math.max(1, Math.min(3, cellW * 2));
  for (const cue of cues) {
    const sdx = world.delta(pxI, cue.sourceX);
    const sdy = world.delta(pyI, cue.sourceY);
    if (Math.abs(sdx) > radius || Math.abs(sdy) > radius) continue;

    const tdx = world.delta(pxI, cue.targetX);
    const tdy = world.delta(pyI, cue.targetY);
    const targetVisible = Math.abs(tdx) <= radius && Math.abs(tdy) <= radius;
    const clampedDx = Math.max(-radius + 1, Math.min(radius - 1, tdx));
    const clampedDy = Math.max(-radius + 1, Math.min(radius - 1, tdy));
    const sx = mapX + (sdx + radius + 0.5) * cellW;
    const sy = mapY + (sdy + radius + 0.5) * cellH;
    const tx = mapX + ((targetVisible ? tdx : clampedDx) + radius + 0.5) * cellW;
    const ty = mapY + ((targetVisible ? tdy : clampedDy) + radius + 0.5) * cellH;
    const pulse = 0.55 + 0.35 * Math.sin(uiTime * 9 + cue.id);

    ctx.globalAlpha = 0.35 + pulse * 0.35;
    ctx.setLineDash([Math.max(3, cellW * 2), Math.max(2, cellW)]);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.82;
    ctx.strokeRect(sx - 4, sy - 4, 8, 8);
    ctx.fillRect(sx - 1.5, sy - 1.5, 3, 3);
    if (targetVisible) {
      ctx.beginPath();
      ctx.arc(tx, ty, 4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawCartographerRevealMarker(
  ctx: CanvasRenderingContext2D,
  reveal: RouteCueMapReveal,
  x: number,
  y: number,
  uiTime: number,
  cellW: number,
  cellH: number,
): void {
  const pulse = 0.55 + 0.35 * Math.sin(uiTime * 7 + reveal.id.length);
  const size = Math.max(4, Math.min(12, Math.max(cellW, cellH) * 5));
  ctx.strokeStyle = reveal.color;
  ctx.fillStyle = reveal.color;
  ctx.lineWidth = Math.max(1, Math.min(3, cellW * 1.8));
  ctx.globalAlpha = 0.55 + pulse * 0.28;

  if (reveal.kind === 'contract_target') {
    drawQuestDiamond(ctx, x, y, size * 0.72, size * 0.5, '#542', reveal.color);
    return;
  }

  if (reveal.kind === 'shelter_mark') {
    ctx.strokeRect(x - size * 0.55, y - size * 0.55, size * 1.1, size * 1.1);
    ctx.beginPath();
    ctx.moveTo(x - size * 0.35, y);
    ctx.lineTo(x + size * 0.35, y);
    ctx.moveTo(x, y - size * 0.35);
    ctx.lineTo(x, y + size * 0.35);
    ctx.stroke();
    return;
  }

  ctx.beginPath();
  ctx.arc(x, y, size * (reveal.kind === 'zone_danger' ? 0.9 : 0.55), 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - size, y);
  ctx.lineTo(x + size, y);
  ctx.moveTo(x, y - size);
  ctx.lineTo(x, y + size);
  ctx.stroke();
}

function drawCartographerMapReveals(
  ctx: CanvasRenderingContext2D,
  world: World,
  state: GameState | undefined,
  currentFloor: FloorLevel | undefined,
  uiTime: number,
  pxI: number,
  pyI: number,
  mapX: number,
  mapY: number,
  mapW: number,
  mapH: number,
  radius: number,
  cellW: number,
  cellH: number,
): void {
  if (!state || currentFloor === undefined) return;
  const reveals = getRouteCueMapReveals(world, state);
  if (reveals.length === 0) return;

  ctx.save();
  ctx.font = '8px monospace';
  for (const reveal of reveals) {
    if (reveal.floor !== currentFloor || reveal.x === undefined || reveal.y === undefined) continue;
    const dx = world.delta(pxI, Math.floor(reveal.x));
    const dy = world.delta(pyI, Math.floor(reveal.y));
    if (Math.abs(dx) > radius || Math.abs(dy) > radius) continue;

    const x = mapX + (dx + radius + 0.5) * cellW;
    const y = mapY + (dy + radius + 0.5) * cellH;
    drawCartographerRevealMarker(ctx, reveal, x, y, uiTime, cellW, cellH);
    if (mapW > 140 && mapH > 120) {
      ctx.globalAlpha = 0.88;
      ctx.fillStyle = reveal.color;
      ctx.fillText(fitMapText(ctx, reveal.label, 74), x + 6, y - 5);
    }
  }
  ctx.restore();
}

function latestCartographerReveal(reveals: readonly RouteCueMapReveal[]): RouteCueMapReveal | undefined {
  let best: RouteCueMapReveal | undefined;
  for (const reveal of reveals) {
    if (!best || reveal.expiresAt > best.expiresAt) best = reveal;
  }
  return best;
}

/* ── 64 unique zone colors (HSL-based palette) ─────────────── */
export const ZONE_COLORS: [number, number, number][] = [];
for (let i = 0; i < 64; i++) {
  const hue = (i * 137.508) % 360; // golden angle for max spread
  const sat = 0.35 + (i % 3) * 0.15;
  const lit = 0.25 + (i % 4) * 0.06;
  const c = (1 - Math.abs(2 * lit - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = lit - c / 2;
  let r1: number, g1: number, b1: number;
  if      (hue < 60)  { r1 = c; g1 = x; b1 = 0; }
  else if (hue < 120) { r1 = x; g1 = c; b1 = 0; }
  else if (hue < 180) { r1 = 0; g1 = c; b1 = x; }
  else if (hue < 240) { r1 = 0; g1 = x; b1 = c; }
  else if (hue < 300) { r1 = x; g1 = 0; b1 = c; }
  else                { r1 = c; g1 = 0; b1 = x; }
  ZONE_COLORS.push([
    Math.round((r1 + m) * 255),
    Math.round((g1 + m) * 255),
    Math.round((b1 + m) * 255),
  ]);
}

/* ── Shared map renderer (used by minimap + fullmap) ──────────── */
function drawMap(
  ctx: CanvasRenderingContext2D,
  world: World, _entities: Entity[], player: Entity,
  _sx: number, _sy: number,
  mapX: number, mapY: number, mapW: number, mapH: number,
  radius: number, bgAlpha: number,
  quests?: Quest[],
  currentFloor?: FloorLevel,
  state?: GameState,
  uiTime = state?.time ?? 0,
): void {
  ctx.fillStyle = `rgba(0,0,0,${bgAlpha})`;
  ctx.fillRect(mapX, mapY, mapW, mapH);

  const pxI = Math.floor(player.x);
  const pyI = Math.floor(player.y);
  const cellW = mapW / (radius * 2);
  const cellH = mapH / (radius * 2);
  const activeVariant = getActiveSamosborVariant();
  const questLiftDir = activeVisitLiftDirection(quests, currentFloor, state);
  const [fogR, fogG, fogB] = activeVariant?.fogColor ?? [80, 20, 120];
  const shelterRoomIds = getSamosborShelterRoomIds(state);
  const factionSnapshot = getFactionUiSnapshot();
  const factionZones = factionSnapshot && factionSnapshot.floor === currentFloor ? factionSnapshot.zoneById : undefined;
  drawnTargetRooms.clear();
  if (quests) {
    clearActiveQuestMarkers();
    let concreteRoomMarkers = 0;
    for (const q of quests) {
      if (q.done) continue;
      const kind = questKind(q);
      setMarkerKind(activeQuestGivers, q.giverId, kind);
      if (q.type === QuestType.TALK && q.targetNpcId !== undefined) setMarkerKind(activeTalkTargets, q.targetNpcId, kind);
      if (q.type === QuestType.TALK && q.targetPlotNpcId) setMarkerKind(activeTalkPlotTargets, q.targetPlotNpcId, kind);
      if (q.type === QuestType.KILL && q.targetMonsterKind !== undefined) setMarkerKind(activeKillKinds, q.targetMonsterKind, kind);
      if (
        q.type === QuestType.FETCH &&
        q.targetItem &&
        (q.targetFloor === undefined || q.targetFloor === currentFloor)
      ) setMarkerKind(activeFetchItems, q.targetItem, kind);
      if (!questTargetVisibleOnMap(q, currentFloor, state)) continue;
      const hasRoomTarget = q.targetRoom !== undefined || q.targetRoomType !== undefined || q.targetZoneTag !== undefined;
      if (hasRoomTarget && concreteRoomMarkers < MAX_CONCRETE_QUEST_ROOM_MARKERS) {
        const resolved = resolveQuestTargetRoom(world, q, player);
        if (resolved) {
          setMarkerKind(activeTargetRooms, resolved.room.id, kind);
          concreteRoomMarkers++;
          continue;
        }
      }
      if (q.targetRoom === undefined && q.targetRoomType !== undefined) setMarkerKind(activeTargetRoomTypes, q.targetRoomType, kind);
    }
  } else {
    clearActiveQuestMarkers();
  }

  for (let dy = -radius; dy < radius; dy++) {
    for (let dx = -radius; dx < radius; dx++) {
      const wx = ((pxI + dx) % W + W) % W;
      const wy = ((pyI + dy) % W + W) % W;
      const ci = wy * W + wx;
      const cell = world.cells[ci];
      if (cell === Cell.WALL) {
        // Hermetic shelter walls: special unbreakable wall marker.
        if (world.hermoWall[ci]) {
          ctx.fillStyle = '#6ec3ff';
          ctx.fillRect(mapX + (dx + radius) * cellW, mapY + (dy + radius) * cellH, cellW + 0.5, cellH + 0.5);
        }
        continue;
      }
      if (cell === Cell.ABYSS) {
        ctx.fillStyle = '#100810';
        ctx.fillRect(mapX + (dx + radius) * cellW, mapY + (dy + radius) * cellH, cellW + 0.5, cellH + 0.5);
        continue;
      }
      if (cell === Cell.LIFT) {
        ctx.fillStyle = '#cc0';
        ctx.fillRect(mapX + (dx + radius) * cellW, mapY + (dy + radius) * cellH, cellW + 0.5, cellH + 0.5);
        continue;
      }
      if (cell === Cell.WATER) {
        ctx.fillStyle = '#235';
        ctx.fillRect(mapX + (dx + radius) * cellW, mapY + (dy + radius) * cellH, cellW + 0.5, cellH + 0.5);
        continue;
      }

      const rid = world.roomMap[ci];
      let cr: number, cg: number, cb: number;
      if (rid >= 0) {
        const r = world.rooms[rid];
        if (r) {
          switch (r.type) {
            case RoomType.LIVING:     cr = 68; cg = 68; cb = 102; break;
            case RoomType.KITCHEN:    cr = 85; cg = 85; cb = 68; break;
            case RoomType.BATHROOM:   cr = 68; cg = 85; cb = 85; break;
            case RoomType.STORAGE:    cr = 85; cg = 68; cb = 51; break;
            case RoomType.MEDICAL:    cr = 68; cg = 102; cb = 102; break;
            case RoomType.COMMON:     cr = 68; cg = 68; cb = 68; break;
            case RoomType.PRODUCTION: cr = 85; cg = 85; cb = 68; break;
            default:                  cr = 51; cg = 51; cb = 51;
          }
        } else { cr = 51; cg = 51; cb = 51; }
      } else {
        const zid = world.zoneMap[ci];
        const [zr, zg, zb] = ZONE_COLORS[zid % 64];
        cr = zr >> 1; cg = zg >> 1; cb = zb >> 1;
      }
      if (cell === Cell.DOOR) { cr = 136; cg = 100; cb = 68; }

      const factionZone = factionZones?.[world.zoneMap[ci]];
      if (factionZone) {
        [cr, cg, cb] = tintFactionColor(cr, cg, cb, factionZone.owner, factionZone.contested ? 0.34 : 0.2);
        if (factionZone.contested && ((wx + wy) & 7) < 3) {
          [cr, cg, cb] = tintFactionColor(cr, cg, cb, factionZone.dominant, 0.34);
        }
      }

      if (world.fog[ci] > 50) {
        const f = world.fog[ci] / 255;
        cr = Math.round(cr * (1 - f) + fogR * f);
        cg = Math.round(cg * (1 - f) + fogG * f);
        cb = Math.round(cb * (1 - f) + fogB * f);
      }
      const isSamosborShelter = rid >= 0 && shelterRoomIds.includes(rid);
      if (isSamosborShelter) {
        cr = Math.round(cr * 0.55 + 212 * 0.45);
        cg = Math.round(cg * 0.55 + 166 * 0.45);
        cb = Math.round(cb * 0.55 + 72 * 0.45);
      }

      ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
      ctx.fillRect(mapX + (dx + radius) * cellW, mapY + (dy + radius) * cellH, cellW + 0.5, cellH + 0.5);
      if (isSamosborShelter) {
        ctx.strokeStyle = '#d6a64b';
        ctx.lineWidth = Math.max(1, Math.min(2, cellW));
        ctx.strokeRect(mapX + (dx + radius) * cellW, mapY + (dy + radius) * cellH, cellW + 0.5, cellH + 0.5);
      }

      if (currentFloor === FloorLevel.MAINTENANCE) {
        const sourceState = seroburmalineSourceCellState(world, wx, wy);
        if (sourceState) {
          const sx0 = mapX + (dx + radius + 0.5) * cellW;
          const sy0 = mapY + (dy + radius + 0.5) * cellH;
          const pulse = sourceState === 'active' ? 0.6 + 0.28 * Math.sin(uiTime * 8) : 0.35;
          ctx.save();
          ctx.globalAlpha = sourceState === 'active' ? 0.62 + pulse * 0.25 : 0.42;
          ctx.strokeStyle = sourceState === 'active' ? '#d58aa8' : '#8a8f88';
          ctx.fillStyle = sourceState === 'active' ? '#563046' : '#4b504c';
          ctx.lineWidth = Math.max(1, Math.min(2, cellW * 0.8));
          ctx.beginPath();
          ctx.arc(sx0, sy0, Math.max(3, Math.min(8, Math.max(cellW, cellH) * 2.2)), 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
      }

      if ((activeTargetRooms.size > 0 || activeTargetRoomTypes.size > 0) && rid >= 0) {
        const r = world.rooms[rid];
        let markerKind = r ? activeTargetRooms.get(r.id) : undefined;
        if (!markerKind && r) markerKind = activeTargetRoomTypes.get(r.type);
        if (r && markerKind && !drawnTargetRooms.has(r.id)) {
          const cx = world.wrap(Math.floor(r.x + r.w / 2));
          const cy = world.wrap(Math.floor(r.y + r.h / 2));
          if (wx === cx && wy === cy) {
            const qsx = mapX + (dx + radius) * cellW;
            const qsy = mapY + (dy + radius) * cellH;
            drawQuestMarker(ctx, qsx, qsy, 5, 3, markerKind);
            drawnTargetRooms.add(r.id);
          }
        }
      }
    }
  }

  drawSamosborWarningRisk(ctx, world, state, currentFloor, uiTime, pxI, pyI, mapX, mapY, mapW, mapH, radius, cellW, cellH);
  drawWrongDoorCues(ctx, world, state, uiTime, pxI, pyI, mapX, mapY, radius, cellW, cellH);
  drawCultProcessionOverlays(ctx, world, state, currentFloor, uiTime, pxI, pyI, mapX, mapY, mapW, mapH, radius, cellW, cellH);
  drawBlackHandMarks(ctx, world, pxI, pyI, mapX, mapY, radius, cellW, cellH);
  drawCartographerMapReveals(ctx, world, state, currentFloor, uiTime, pxI, pyI, mapX, mapY, mapW, mapH, radius, cellW, cellH);
  drawFactionZoneMarkers(ctx, world, factionSnapshot, currentFloor, pxI, pyI, mapX, mapY, mapW, mapH, radius, cellW, cellH, uiTime);
  drawFactionEventMarkers(ctx, world, factionSnapshot, currentFloor, pxI, pyI, mapX, mapY, mapW, mapH, radius, cellW, cellH, uiTime);

  // Entities
  getEntityIndex().queryRadius(player.x, player.y, radius * Math.SQRT2 + 2, mapEntityQuery, ENTITY_MASK_VISIBLE);
  for (const e of mapEntityQuery) {
    if (!e.alive || e.type === EntityType.PLAYER) continue;
    const edx = world.delta(pxI, Math.floor(e.x));
    const edy = world.delta(pyI, Math.floor(e.y));
    if (Math.abs(edx) > radius || Math.abs(edy) > radius) continue;

    ctx.fillStyle = e.type === EntityType.NPC
                  ? (e.faction !== undefined && areFactionsHostile(Faction.PLAYER, e.faction) ? '#e44' : '#4a4')
                  : e.type === EntityType.MONSTER ? '#e33'
                  : '#dd4';
    const esx = mapX + (edx + radius) * cellW;
    const esy = mapY + (edy + radius) * cellH;
    ctx.fillRect(esx - 1, esy - 1, 3, 3);
    if (
      e.type === EntityType.ITEM_DROP &&
      activeFetchItems.size > 0 &&
      e.inventory
    ) {
      let markerKind: QuestKind | undefined;
      for (const slot of e.inventory) {
        const slotKind = activeFetchItems.get(slot.defId);
        if (slotKind) markerKind = mergeQuestKind(markerKind, slotKind);
      }
      if (markerKind) drawQuestMarker(ctx, esx, esy, 5, 3, markerKind);
    }
  }

  // Quest markers — plot NPC markers + VISIT room markers
  if (quests) {
    // Mark all plot NPCs (gold if active quest / new quest available, blue otherwise)
    for (const e of mapEntityQuery) {
      if (!e.alive || !e.plotNpcId) continue;
      const edx = world.delta(pxI, Math.floor(e.x));
      const edy = world.delta(pyI, Math.floor(e.y));
      if (Math.abs(edx) > radius || Math.abs(edy) > radius) continue;

      const targetKind = activeTalkTargets.get(e.id) ?? (e.plotNpcId !== undefined ? activeTalkPlotTargets.get(e.plotNpcId) : undefined);
      const giverKind = activeQuestGivers.get(e.id);
      let markerKind = targetKind;
      if (giverKind) markerKind = mergeQuestKind(markerKind, giverKind);
      const hasActiveMarker = markerKind !== undefined;
      const hasNewQuest = hasAvailableQuest(e.plotNpcId, quests);

      const qsx = mapX + (edx + radius) * cellW;
      const qsy = mapY + (edy + radius) * cellH;
      const sz = 6, sw = 4;
      const marker = markerKind ? QUEST_MARKERS[markerKind] : undefined;
      ctx.strokeStyle = marker?.stroke ?? (hasNewQuest ? '#640' : '#024');
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(qsx, qsy - sz);
      ctx.lineTo(qsx + sw, qsy);
      ctx.lineTo(qsx, qsy + sz);
      ctx.lineTo(qsx - sw, qsy);
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = marker?.fill ?? (hasNewQuest ? '#fc4' : '#4af');
      ctx.fill();
      if (hasActiveMarker && mapW > 140 && mapH > 120) {
        ctx.fillStyle = marker?.text ?? '#fc4';
        ctx.font = '7px monospace';
        ctx.fillText(marker?.label ?? '', qsx + 5, qsy - 5);
      }
    }
    // VISIT quest markers (room targets)
    for (const q of quests) {
      if (q.done) continue;
      if (q.type !== QuestType.VISIT || q.targetRoom === undefined) continue;
      const room = world.rooms[q.targetRoom];
      if (!room || drawnTargetRooms.has(room.id)) continue;
      const rx = room.x + room.w / 2;
      const ry = room.y + room.h / 2;
      const qdx = world.delta(pxI, Math.floor(rx));
      const qdy = world.delta(pyI, Math.floor(ry));
      if (Math.abs(qdx) > radius || Math.abs(qdy) > radius) continue;
      const qsx = mapX + (qdx + radius) * cellW;
      const qsy = mapY + (qdy + radius) * cellH;
      drawQuestMarker(ctx, qsx, qsy, 6, 4, questKind(q));
    }
    // KILL quest markers — show target monsters as red diamonds
    if (activeKillKinds.size > 0) {
      for (const e of mapEntityQuery) {
        if (!e.alive || e.type !== EntityType.MONSTER) continue;
        const markerKind = e.monsterKind === undefined ? undefined : activeKillKinds.get(e.monsterKind);
        if (!markerKind) continue;
        const edx = world.delta(pxI, Math.floor(e.x));
        const edy = world.delta(pyI, Math.floor(e.y));
        if (Math.abs(edx) > radius || Math.abs(edy) > radius) continue;
        const qsx = mapX + (edx + radius) * cellW;
        const qsy = mapY + (edy + radius) * cellH;
        drawQuestMarker(ctx, qsx, qsy, 5, 3, markerKind);
        ctx.fillStyle = '#f44';
        ctx.fillRect(qsx - 1, qsy - 1, 2, 2);
      }
    }
  }

  // Player dot
  const pcx = mapX + radius * cellW;
  const pcy = mapY + radius * cellH;

  // Lift direction arrows
  for (let dy = -radius; dy < radius; dy++) {
    for (let dx = -radius; dx < radius; dx++) {
      const wx = ((pxI + dx) % W + W) % W;
      const wy = ((pyI + dy) % W + W) % W;
      const ci = wy * W + wx;
      if (world.cells[ci] !== Cell.LIFT) continue;
      const lsx = mapX + (dx + radius) * cellW;
      const lsy = mapY + (dy + radius) * cellH;
      const isUp = world.liftDir[ci] === LiftDirection.UP;
      const isQuestLift = questLiftDir !== undefined && world.liftDir[ci] === questLiftDir;
      const ah = 7;  // arrow half-height
      const aw = 5;  // arrow half-width
      // Dark outline
      ctx.strokeStyle = isQuestLift ? '#fff' : '#440';
      ctx.lineWidth = isQuestLift ? 3 : 2;
      ctx.beginPath();
      if (isUp) {
        ctx.moveTo(lsx, lsy - ah);
        ctx.lineTo(lsx + aw, lsy + ah);
        ctx.lineTo(lsx - aw, lsy + ah);
      } else {
        ctx.moveTo(lsx, lsy + ah);
        ctx.lineTo(lsx + aw, lsy - ah);
        ctx.lineTo(lsx - aw, lsy - ah);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = isQuestLift ? '#fc4' : '#ee2';
      ctx.fill();
    }
  }
  ctx.fillStyle = '#fff';
  ctx.fillRect(pcx - 1, pcy - 1, 3, 3);
  // Direction indicator
  ctx.strokeStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(pcx, pcy);
  ctx.lineTo(
    pcx + Math.cos(player.angle) * 4 * cellW,
    pcy + Math.sin(player.angle) * 4 * cellH,
  );
  ctx.stroke();
}

/* ── Minimap ──────────────────────────────────────────────────── */
export function drawMinimap(
  ctx: CanvasRenderingContext2D,
  world: World, entities: Entity[], player: Entity,
  sx: number, sy: number, quests?: Quest[], floorInstanceLabel?: string, currentFloor?: FloorLevel, state?: GameState, uiTime = state?.time ?? 0,
): void {
  const mw = MAP_SIZE * sx, mh = MAP_SIZE * sy;
  const mx = ctx.canvas.width - mw - 4 * sx;
  const my = 4 * sy;
  drawMap(ctx, world, entities, player, sx, sy, mx, my, mw, mh, 40, 0.75, quests, currentFloor, state, uiTime);
  if (floorInstanceLabel) {
    ctx.fillStyle = '#f4a';
    ctx.font = `${7 * sy}px monospace`;
    ctx.textAlign = 'right';
    ctx.fillText(floorInstanceLabel, mx + mw, my + mh + 3 * sy);
    ctx.textAlign = 'left';
  }
  const objective = primaryObjective(quests, state);
  if (objective) {
    const marker = QUEST_MARKERS[questKind(objective)];
    ctx.fillStyle = marker.text;
    ctx.font = `${7 * sy}px monospace`;
    ctx.textAlign = 'right';
    const oy = my + mh + (floorInstanceLabel ? 12 * sy : 3 * sy);
    ctx.fillText(fitMapText(ctx, objectiveSummary(objective, currentFloor, state), mw), mx + mw, oy);
    ctx.textAlign = 'left';
  }
}

/* ── Full world map (fullscreen) ─────────────────────────────── */
export function drawFullMap(
  ctx: CanvasRenderingContext2D,
  world: World, entities: Entity[], player: Entity,
  sx: number, sy: number, quests?: Quest[], floorInstanceLabel?: string, currentFloor?: FloorLevel, state?: GameState, uiTime = state?.time ?? 0,
): void {
  const cw = ctx.canvas.width;
  const ch = ctx.canvas.height;
  const pad = 4 * sx;
  const mapW = cw - pad * 2;
  const mapH = ch - pad * 2;
  drawMap(ctx, world, entities, player, sx, sy, pad, pad, mapW, mapH, 200, 0.85, quests, currentFloor, state, uiTime);
  drawFactionMapLegend(ctx, getFactionUiSnapshot(), currentFloor, pad + 4, pad + 16 * sy, mapW - 8 * sx);
  drawObjectiveStrip(ctx, quests, currentFloor, state, pad + mapW - Math.min(360 * sx, mapW - 12 * sx), pad + 8 * sy, Math.min(360 * sx, mapW - 12 * sx), sx, sy, 4);

  ctx.fillStyle = '#666';
  ctx.font = `${8 * sy}px monospace`;
  if (floorInstanceLabel) {
    ctx.fillStyle = '#f4a';
    ctx.fillText(`Лифт: ${floorInstanceLabel}`, pad + 4, pad + 4);
    ctx.fillStyle = '#666';
  }
  const rumorLead = state ? getRecentRumorLead(state.time) : undefined;
  const cartographerLead = state ? latestCartographerReveal(getRouteCueMapReveals(world, state)) : undefined;
  if (cartographerLead) {
    ctx.fillStyle = cartographerLead.color;
    ctx.fillText(
      fitMapText(ctx, `Карта: ${cartographerLead.label} - ${cartographerLead.hint}`, mapW - 16 * sx),
      pad + 4,
      pad + mapH - 24 * sy,
    );
    ctx.fillStyle = '#666';
  }
  if (rumorLead) {
    ctx.fillStyle = '#d9a';
    ctx.fillText(fitMapText(ctx, `Слух: ${rumorLead.text}`, mapW - 16 * sx), pad + 4, pad + mapH - 14 * sy);
    ctx.fillStyle = '#666';
  }
  ctx.fillText('[M] закрыть', pad + 4, pad + mapH - 4);
}
