/* ── HUD overlay: needs bars, minimap, messages, inventory ───── */

import { SCR_W, SCR_H } from './webgl';
import {
  W, type Entity, type GameState, EntityType, Cell, Feature, FloorLevel, Tex,
  ZoneFaction, LiftDirection,
} from '../core/types';
import { World } from '../core/world';
import { ITEMS } from '../data/catalog';
import { getEquippedToolDurability, getWeaponReadiness } from '../systems/inventory';
import { getPlayerHazardWarning } from '../systems/cell_hazards';
import { formatLastPlayerDamageCause } from '../systems/damage';
import { xpForLevel } from '../systems/rpg';
import { zhelemishHudLine } from '../systems/status';
import { drawDebugOverlay } from '../systems/debug';
import { ZONE_COLORS, drawMinimap, drawFullMap } from './map_ui';
import { drawInventory } from './stats_ui';
import { drawQuestLog } from './quest_ui';
import { drawLogMenu } from './log_ui';
import { drawFactionMenu } from './factions_ui';
import { drawGameMenu } from './menu_ui';
import { drawNpcMenu } from './npc_ui';
import { drawContainerMenu } from './container_ui';
import { drawNetSphereMenu } from './net_sphere_ui';
import { drawNetTerminalBank } from './net_terminal_bank_ui';
import { drawNetTerminalGenDenied } from './net_terminal_gen_ui';
import { drawMapEditor } from './map_editor_ui';
import { entityDisplayName } from '../entities/monster';
import { getActiveSamosborVariant } from '../data/samosbor_variants';
import { getSamosborShelterRoomIds, getSamosborWarningSnapshot, type SamosborWarningSnapshot } from '../systems/samosbor';
import { currentFloorInstanceLabel } from '../systems/floor_instances';
import { currentFloorRunLabel } from '../systems/procedural_floors';
import { getLiftArachnaWarningSnapshot, type LiftArachnaWarningSnapshot } from '../systems/lift_arachna';
import {
  getProceduralSmogStatus,
  proceduralAnomalyInteractionTargetId,
  type ProceduralSmogStatus,
} from '../systems/procedural_anomalies';
import { hladonInteractionTargetId } from '../systems/hladon';
import { railTrainInteractionTargetId } from '../systems/rail_trains';
import { getActiveRouteCueHud, isRouteCueTarget, type RouteCueHud } from '../systems/route_cues';
import { getCultProcessionPrompt } from '../systems/faction_events';
import { getSeroburmalineHudFx } from '../systems/seroburmaline';
import { ENTITY_MASK_ACTOR, ENTITY_MASK_NPC, getEntityIndex } from '../systems/entity_index';
import { getNetSphereSnapshot, isNetSphereOpen } from '../systems/net_sphere';
import {
  getNetTerminalBankSnapshot,
  getNetTerminalGenRuntimeSnapshot,
  getNetTerminalGenTerminals,
  isNetTerminalBankOpen,
  isNetTerminalGenDeniedOpen,
  isNetTerminalGenOpen,
  isNetTerminalGenTarget,
} from '../systems/net_terminal_gen';
import { getMapEditorSnapshot, isMapEditorOpen } from '../systems/map_editor';
import { isParitelSteamValveTarget } from '../gen/maintenance/paritel_steam_bridge';
import {
  textJitter, flicker, drawHoloBar, drawGlitchText,
  drawNeuroPanel, drawGlitchLine, drawStaticNoise, drawVeretarVeil, drawRouteCueWave, drawMaronaryProofNoise, drawSmogVeil,
  drawSeroburmalineNoLookFx, drawSignalRows,
} from './hud_fx';
import { fitText as fitUiText, setUiTextTime } from './ui_text';

const BAR_W = 50, BAR_H = 4;
const NEEDS_PANEL_H = 20;
const COMBAT_TARGET_SCAN_CAP = 160;
const COMBAT_TARGET_MAX_D2 = 18 * 18;
const COMBAT_TARGET_BODY_RADIUS = 0.3;
const COMBAT_TARGET_RAY_STEP_CAP = 48;
const COMBAT_TARGET_PLANE_LEN = Math.tan(Math.PI / 6);
const aimTargetQuery: Entity[] = [];
const interactionNpcQuery: Entity[] = [];

function toPercent(current: number, max: number): number {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(100, current / max * 100));
}

const ZONE_FACTION_NAMES: Record<ZoneFaction, string> = {
  [ZoneFaction.CITIZEN]: 'Граждане',
  [ZoneFaction.LIQUIDATOR]: 'Ликвидаторы',
  [ZoneFaction.CULTIST]: 'Культисты',
  [ZoneFaction.SAMOSBOR]: 'Самосбор',
  [ZoneFaction.WILD]: 'Дикие',
};
const MSG_MAX = 5;

interface VoidReturnPortalHudState {
  active?: boolean;
  used?: boolean;
  cell?: number;
  playerMustLeaveCell?: boolean;
  voidSpikeCarried?: boolean;
  voidSpikeResolved?: boolean;
}

function voidReturnPortalHudState(state: GameState): VoidReturnPortalHudState | undefined {
  const portal = (state as GameState & { voidReturnPortal?: VoidReturnPortalHudState }).voidReturnPortal;
  if (!portal?.active || portal.used || typeof portal.cell !== 'number') return undefined;
  if (portal.cell < 0 || portal.cell >= W * W) return undefined;
  return portal;
}

function voidReturnVictoryLine(state: GameState): string {
  const portal = (state as GameState & { voidReturnPortal?: VoidReturnPortalHudState }).voidReturnPortal;
  if (portal?.voidSpikeResolved) return 'ЗАДАЧА ЗАКРЫТА. Шип оставлен.';
  if (portal?.voidSpikeCarried) return 'ЗАДАЧА ЗАКРЫТА. Шип вынесен.';
  return 'ЗАДАЧА ЗАКРЫТА. Выход открыт.';
}

function drawVoidReturnPortalHint(
  ctx: CanvasRenderingContext2D,
  w: number,
  sx: number,
  sy: number,
  time: number,
  player: Entity,
  state: GameState,
  world: World,
): void {
  if (state.currentFloor !== FloorLevel.VOID || state.samosborActive) return;
  const portal = voidReturnPortalHudState(state);
  if (!portal || world.floorTex[portal.cell!] !== Tex.PORTAL) return;

  const px = (portal.cell! % W) + 0.5;
  const py = ((portal.cell! / W) | 0) + 0.5;
  const dx = world.delta(player.x, px);
  const dy = world.delta(player.y, py);
  const dist = Math.max(0, Math.round(Math.sqrt(dx * dx + dy * dy)));
  const consequence = portal.playerMustLeaveCell
    ? 'выйти и войти снова'
    : portal.voidSpikeResolved
      ? 'шип оставлен'
      : portal.voidSpikeCarried
        ? 'шип унесён'
        : 'встаньте в центр для выхода';
  const panelW = Math.min(w - 12 * sx, 196 * sx);
  const panelH = 28 * sy;
  const x = (w - panelW) * 0.5;
  const y = 42 * sy;

  ctx.save();
  drawNeuroPanel(ctx, x, y, panelW, panelH, time, 988);
  ctx.textAlign = 'center';
  ctx.shadowColor = '#0f8';
  ctx.shadowBlur = 7;
  drawGlitchText(ctx, 'ВЫХОД ДОМОЙ', w * 0.5, y + 4 * sy, time * 1.7, 989, '#0f8', 9 * sy);
  ctx.shadowBlur = 0;
  drawGlitchText(ctx, fitHudText(ctx, `центр ${dist}м / ${consequence}`, panelW - 12 * sx), w * 0.5, y + 17 * sy, time, 990, '#cfe', 7 * sy);
  ctx.textAlign = 'left';
  ctx.restore();
}

function drawSamosborPrewarning(
  ctx: CanvasRenderingContext2D,
  w: number,
  _h: number,
  sx: number,
  sy: number,
  time: number,
  warning: SamosborWarningSnapshot,
): void {
  const panelW = Math.min(w - 12 * sx, 218 * sx);
  const panelH = 58 * sy;
  const x = (w - panelW) * 0.5;
  const y = 6 * sy;
  const title = warning.variantId === 'istotit'
    ? `ИСТОТИТ: ${warning.secondsLeft}s`
    : warning.variantId === 'maronary'
    ? `МАРОНАРИЙ: ${warning.secondsLeft}s`
    : warning.variantId === 'veretar'
    ? `ВЕРЕТАР: ${warning.secondsLeft}s`
    : `САМОСБОР: ${warning.secondsLeft}s`;
  const zone = warning.zoneId >= 0 ? `Зона ${warning.zoneId + 1}` : 'Локальная зона';
  const action = warning.variantId === 'istotit'
    ? (warning.shelterRoomIds.length > 0 ? 'Укрытие на карте. Мест мало.' : 'К укрытию. Не отвечайте голосам.')
    : warning.variantId === 'maronary'
    ? (warning.wrongDoorX !== undefined ? 'Повтор двери отмечен. Не смотрите в источник.' : 'Не смотрите в зелёный источник.')
    : warning.variantId === 'veretar'
    ? 'Закройте белую щель или выйдите из зоны.'
    : 'К гермодвери или выйдите из зоны.';

  ctx.save();
  ctx.fillStyle = warning.variantId === 'veretar' ? 'rgba(31,31,28,0.84)' : 'rgba(18,6,24,0.82)';
  ctx.fillRect(x, y, panelW, panelH);
  ctx.strokeStyle = warning.tint;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, panelW - 1, panelH - 1);
  drawStaticNoise(ctx, x, y, panelW, panelH, time, 0.018);
  if (warning.variantId === 'maronary') {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, panelW, panelH);
    ctx.clip();
    ctx.translate(x, y);
    drawMaronaryProofNoise(ctx, panelW, panelH, time, 0.45);
    ctx.restore();
  }
  if (warning.variantId === 'veretar') {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, panelW, panelH);
    ctx.clip();
    ctx.translate(x, y);
    drawVeretarVeil(ctx, panelW, panelH, time, 0.7);
    ctx.restore();
  }

  ctx.textAlign = 'center';
  ctx.shadowColor = warning.tint;
  ctx.shadowBlur = 8;
  drawGlitchText(ctx, title, w * 0.5, y + 4 * sy, time * 2, 730, warning.tint, 10 * sy);
  ctx.shadowBlur = 0;
  drawGlitchText(ctx, `${warning.variantName} / ${warning.floorName} / ${zone}`, w * 0.5, y + 16 * sy, time, 731, '#ffd36a', 7 * sy);
  drawGlitchText(ctx, action, w * 0.5, y + 25 * sy, time, 732, '#ddd', 7 * sy);
  drawSignalRows(ctx, x + 6 * sx, y + 32 * sy, panelW - 12 * sx, 20 * sy, time, warning.tint, warning.signals.channelLines, 5.5 * sy);
  ctx.textAlign = 'left';
  ctx.restore();
}

function drawLiftArachnaWarning(
  ctx: CanvasRenderingContext2D,
  w: number,
  sx: number,
  sy: number,
  time: number,
  warning: LiftArachnaWarningSnapshot,
  y: number,
): void {
  const panelW = Math.min(w - 12 * sx, 210 * sx);
  const panelH = 32 * sy;
  const x = (w - panelW) * 0.5;
  const tint = warning.baited ? '#f44' : warning.secondWarning ? '#f4a' : '#fa0';
  const title = warning.baited
    ? `АРАХНА ПАДАЕТ: ${warning.secondsLeft}s`
    : `ШАХТА НАД ЛИФТОМ: ${warning.secondsLeft}s`;
  const action = warning.baited
    ? 'Отойдите от лифта. Цель сбита шумом.'
    : warning.secondWarning
      ? 'Смотрите вверх или уходите от шахты.'
      : 'Скрежет сверху. Проверьте потолок.';
  const zone = warning.zoneId >= 0 ? `Зона ${warning.zoneId + 1}` : 'Лифтовой узел';

  ctx.save();
  ctx.fillStyle = 'rgba(22,8,8,0.84)';
  ctx.fillRect(x, y, panelW, panelH);
  ctx.strokeStyle = tint;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, panelW - 1, panelH - 1);
  drawStaticNoise(ctx, x, y, panelW, panelH, time, 0.022);

  ctx.textAlign = 'center';
  ctx.shadowColor = tint;
  ctx.shadowBlur = 8;
  drawGlitchText(ctx, title, w * 0.5, y + 5 * sy, time * 2.3, 812, tint, 10 * sy);
  ctx.shadowBlur = 0;
  drawGlitchText(ctx, fitHudText(ctx, `${zone} / ${action}`, panelW - 12 * sx), w * 0.5, y + 20 * sy, time, 813, '#ddd', 7 * sy);
  ctx.textAlign = 'left';
  ctx.restore();
}

function drawSmogIndicator(
  ctx: CanvasRenderingContext2D,
  w: number,
  sx: number,
  sy: number,
  time: number,
  status: ProceduralSmogStatus,
): void {
  const panelW = 154 * sx;
  const panelH = 30 * sy;
  const x = w - panelW - 6 * sx;
  const y = 50 * sy;
  const title = status.handled
    ? 'СМОГ: ИСТОЧНИК ЗАКРЫТ'
    : status.sourceDistance <= 7
      ? 'ИСТОЧНИК СМОГА'
      : `СМОГ ${Math.round(status.intensity * 100)}%`;
  const action = status.prompt || 'обходите плотные комнаты';

  ctx.save();
  ctx.fillStyle = 'rgba(24,20,14,0.78)';
  ctx.fillRect(x, y, panelW, panelH);
  ctx.strokeStyle = status.handled ? '#8cf' : '#b98';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, panelW - 1, panelH - 1);
  drawStaticNoise(ctx, x, y, panelW, panelH, time, status.handled ? 0.008 : 0.018);
  drawGlitchText(ctx, title, x + 6 * sx, y + 5 * sy, time, 941, status.handled ? '#8cf' : '#d8b56a', 8 * sy);
  drawGlitchText(ctx, fitHudText(ctx, action, panelW - 12 * sx), x + 6 * sx, y + 17 * sy, time, 942, '#d7d0bd', 7 * sy);
  ctx.restore();
}

function drawRouteCueHint(
  ctx: CanvasRenderingContext2D,
  w: number,
  sx: number,
  sy: number,
  time: number,
  player: Entity,
  world: World,
  cue: RouteCueHud,
): void {
  const panelW = Math.min(w - 12 * sx, 176 * sx);
  const panelH = 35 * sy;
  const x = w - panelW - 6 * sx;
  const y = 6 * sy;
  const dx = world.delta(player.x, cue.targetX);
  const dy = world.delta(player.y, cue.targetY);
  const dist = Math.max(0, Math.round(Math.sqrt(dx * dx + dy * dy)));
  let rel = Math.atan2(dy, dx) - player.angle;
  while (rel > Math.PI) rel -= Math.PI * 2;
  while (rel < -Math.PI) rel += Math.PI * 2;
  const arrow = Math.abs(rel) < Math.PI * 0.25 ? '>' : Math.abs(rel) > Math.PI * 0.75 ? '<' : rel > 0 ? 'v' : '^';
  const alpha = Math.max(0, Math.min(1, (cue.expiresAt - time) / 1.2));

  ctx.save();
  ctx.globalAlpha = alpha;
  drawNeuroPanel(ctx, x, y, panelW, panelH, time, 760);
  drawRouteCueWave(ctx, x + 6 * sx, y + 4 * sy, panelW - 12 * sx, 7 * sy, time - cue.startedAt, cue.color);
  ctx.textAlign = 'left';
  drawGlitchText(ctx, fitHudText(ctx, cue.label, panelW - 12 * sx), x + 6 * sx, y + 12 * sy, time, 761, cue.color, 7 * sy);
  drawGlitchText(ctx, fitHudText(ctx, `${arrow} ${cue.targetName} ${dist}м`, panelW - 12 * sx), x + 6 * sx, y + 21 * sy, time, 762, '#ddd', 7 * sy);
  drawGlitchText(ctx, fitHudText(ctx, cue.hint, panelW - 12 * sx), x + 6 * sx, y + 29 * sy, time, 763, '#9a8', 6 * sy);
  ctx.restore();
}

function activeVisitLiftHint(state: GameState, direction: LiftDirection): string {
  for (const q of state.quests) {
    if (q.done || q.visitFloor === undefined || q.visitFloor === state.currentFloor) continue;
    const desired = q.visitFloor > state.currentFloor ? LiftDirection.DOWN : LiftDirection.UP;
    if (desired === direction) return ' ЦЕЛЬ';
  }
  return '';
}

function fitHudText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  return fitUiText(ctx, text, maxW);
}

function hudWeaponName(name: string): string {
  return name.replace(/^Сгусток:\s*/, '');
}

function compactHudBottomReserve(w: number, h: number, panelH: number, sy: number): number {
  if (w <= h || h >= 560) return 0;
  const controlReserve = Math.min(150, Math.max(96, h * 0.32));
  const minReadableTop = 90 * sy;
  return Math.min(controlReserve, Math.max(0, h - minReadableTop - panelH));
}

interface CombatTargetHud {
  name: string;
  dist: number;
  hpPct: number;
  danger: boolean;
}

interface CombatSignalHud {
  text: string;
  color: string;
}

function combatTargetName(e: Entity): string {
  return e.type === EntityType.PROJECTILE ? 'Снаряд' : entityDisplayName(e);
}

interface AimTargetHit {
  dist: number;
  forward: number;
  side: number;
}

function combatSpriteScale(e: Entity): number {
  return Math.max(0.35, Math.min(1.6, e.spriteScale ?? 1));
}

function crosshairInsideCombatSprite(e: Entity, forward: number, side: number, pitch: number): boolean {
  if (forward <= 0.1) return false;
  const scale = combatSpriteScale(e);
  const spriteScreenX = Math.floor((SCR_W / 2) * (1 + side / (forward * COMBAT_TARGET_PLANE_LEN)));
  const rawH = Math.abs(Math.floor(SCR_H / forward));
  const spriteH = Math.floor(rawH * scale);
  const spriteW = spriteH;
  if (spriteW <= 1 || spriteH <= 1) return false;

  const halfH = Math.floor(SCR_H / 2) + Math.floor(pitch * SCR_H);
  const footY = halfH + Math.floor(rawH * 0.5) - Math.floor(rawH * (e.spriteZ ?? 0));
  const startY = footY - spriteH;
  const tightHalfW = Math.max(2, spriteW * 0.34);
  const verticalInset = Math.max(1, spriteH * 0.08);
  const centerX = SCR_W * 0.5;
  const centerY = SCR_H * 0.5;
  return centerX >= spriteScreenX - tightHalfW && centerX <= spriteScreenX + tightHalfW
    && centerY >= startY + verticalInset && centerY <= footY - verticalInset;
}

function aimRayBlocked(world: World, px: number, py: number, dirX: number, dirY: number, maxDist: number): boolean {
  let mapX = Math.floor(px);
  let mapY = Math.floor(py);
  const ddx = dirX === 0 ? Infinity : Math.abs(1 / dirX);
  const ddy = dirY === 0 ? Infinity : Math.abs(1 / dirY);
  const stepX = dirX < 0 ? -1 : 1;
  const stepY = dirY < 0 ? -1 : 1;
  let sdx = dirX < 0 ? (px - mapX) * ddx : (mapX + 1 - px) * ddx;
  let sdy = dirY < 0 ? (py - mapY) * ddy : (mapY + 1 - py) * ddy;

  for (let step = 0; step < COMBAT_TARGET_RAY_STEP_CAP; step++) {
    const dist = Math.min(sdx, sdy);
    if (dist >= maxDist) return false;
    if (sdx < sdy) {
      sdx += ddx;
      mapX += stepX;
    } else {
      sdy += ddy;
      mapY += stepY;
    }
    if (world.solid(mapX, mapY)) return true;
  }
  return false;
}

function aimTargetHit(world: World, player: Entity, e: Entity, ca: number, sa: number): AimTargetHit | null {
  const dx = world.delta(player.x, e.x);
  const dy = world.delta(player.y, e.y);
  const d2 = dx * dx + dy * dy;
  if (d2 > COMBAT_TARGET_MAX_D2) return null;

  const forward = dx * ca + dy * sa;
  if (forward <= 0.35) return null;
  const side = -dx * sa + dy * ca;
  const bodyRadius = Math.max(0.16, Math.min(0.48, COMBAT_TARGET_BODY_RADIUS * combatSpriteScale(e)));
  if (Math.abs(side) > bodyRadius) return null;
  if (!crosshairInsideCombatSprite(e, forward, side, player.pitch)) return null;
  if (aimRayBlocked(world, player.x, player.y, ca, sa, Math.max(0.25, forward - bodyRadius))) return null;

  return { dist: Math.sqrt(d2), forward, side };
}

function findAimTarget(world: World, entities: Entity[], player: Entity): CombatTargetHud | null {
  const ca = Math.cos(player.angle);
  const sa = Math.sin(player.angle);
  let best: Entity | null = null;
  let bestScore = Infinity;
  let bestDist = 0;
  let checked = 0;

  getEntityIndex().queryRadius(player.x, player.y, Math.sqrt(COMBAT_TARGET_MAX_D2), aimTargetQuery, ENTITY_MASK_ACTOR);
  const candidates = aimTargetQuery.length > 0 ? aimTargetQuery : entities;
  for (const e of candidates) {
    if (!e.alive || e.id === player.id) continue;
    if (e.type !== EntityType.MONSTER && e.type !== EntityType.NPC) continue;
    if (world.dist2(player.x, player.y, e.x, e.y) > COMBAT_TARGET_MAX_D2) continue;
    checked++;
    const hit = aimTargetHit(world, player, e, ca, sa);
    if (hit) {
      const score = hit.forward + Math.abs(hit.side) * 0.4;
      if (score < bestScore) {
        best = e;
        bestScore = score;
        bestDist = hit.dist;
      }
    }
    if (checked >= COMBAT_TARGET_SCAN_CAP) break;
  }

  if (!best) return null;
  return {
    name: combatTargetName(best),
    dist: Math.max(1, Math.round(bestDist)),
    hpPct: toPercent(best.hp ?? 0, best.maxHp ?? 100),
    danger: best.type === EntityType.MONSTER,
  };
}

function recentCombatSignal(state: GameState, time: number): CombatSignalHud | null {
  for (let i = state.msgs.length - 1; i >= 0 && i >= state.msgs.length - 8; i--) {
    const m = state.msgs[i];
    if (time - m.time > 1.15) continue;
    const text = m.text;
    if (text.startsWith('Удар!')) return { text: text.replace(/^Удар!\s*/, 'ПОПАДАНИЕ '), color: '#fc4' };
    if (text.includes('повержен') || text.includes('повержена')) return { text: 'ЦЕЛЬ ПОВЕРЖЕНА', color: '#4f4' };
    if (text.startsWith('Взрыв!') || text.startsWith('БФГ!')) return { text: text.toUpperCase(), color: text.startsWith('БФГ!') ? '#4f4' : '#fa0' };
    if (text.includes('Нет патронов')) return { text: 'НЕТ ПАТРОНОВ', color: '#f84' };
    if (text.includes('Недостаточно ПСИ')) return { text: 'НЕТ ПСИ', color: '#f84' };
    if (m.color === '#f66' || text.includes('режет тебя') || text.includes('задел тебя')) return { text: `УРОН ${text}`, color: '#f66' };
  }
  return null;
}

function inferDeathCause(state: GameState, player: Entity, world: World, entities: Entity[]): { title: string; detail: string } {
  const deathTime = state.time - state.deathTimer;
  const lastDamageCause = formatLastPlayerDamageCause(state, deathTime);
  if (lastDamageCause) return { title: 'Причина смерти', detail: lastDamageCause };

  for (let i = state.msgs.length - 1; i >= 0 && i >= state.msgs.length - 16; i--) {
    const m = state.msgs[i];
    if (m.time < deathTime - 10 || m.time > deathTime + 1.5) continue;
    const text = m.text;
    if (text.includes('убил Вы')) return { title: 'Причина смерти', detail: text.replace('убил Вы', 'убил вас') };
    if (text.includes('режет тебя') || text.includes('задел тебя')) return { title: 'Причина смерти', detail: text };
    if (m.color === '#f66' && text.includes(': -')) return { title: 'Последний урон', detail: text };
    if (text.includes('Обратная тяга')) return { title: 'Последний урон', detail: text };
  }

  const needs = player.needs;
  if (needs) {
    if (needs.water <= 0) return { title: 'Причина смерти', detail: 'обезвоживание' };
    if (needs.food <= 0) return { title: 'Причина смерти', detail: 'голод' };
    if (needs.pee >= 100) return { title: 'Причина смерти', detail: 'мочевой отказ' };
    if (needs.poo >= 100) return { title: 'Причина смерти', detail: 'кишечный отказ' };
  }

  let nearest: Entity | null = null;
  let nearestD2 = 6 * 6;
  let checked = 0;
  for (const e of entities) {
    if (!e.alive || e.id === player.id) continue;
    if (e.type !== EntityType.MONSTER && e.type !== EntityType.NPC && e.type !== EntityType.PROJECTILE) continue;
    const d2 = world.dist2(player.x, player.y, e.x, e.y);
    if (d2 < nearestD2) {
      nearestD2 = d2;
      nearest = e;
    }
    checked++;
    if (checked >= 96) break;
  }
  if (nearest) {
    const dist = Math.max(1, Math.round(Math.sqrt(nearestD2)));
    return { title: 'Рядом с телом', detail: `${combatTargetName(nearest)} ${dist}м` };
  }
  if (state.samosborActive) return { title: 'Причина смерти', detail: 'самосбор: источник урона не распознан' };
  return { title: 'Причина смерти', detail: 'источник урона не распознан' };
}

function drawCombatWeaponPanel(
  ctx: CanvasRenderingContext2D,
  weapon: ReturnType<typeof getWeaponReadiness>,
  w: number,
  barY: number,
  sx: number,
  sy: number,
  time: number,
): { x: number; y: number; w: number } {
  const s = Math.max(1, Math.min(sx, sy));
  const panelW = Math.min(w - 8 * s, 96 * s);
  const panelH = 25 * s;
  const panelX = w - panelW - 4 * s;
  const panelY = barY - panelH - 3 * s;
  const statusColor = weapon.cannotFireReason ? '#f84' : weapon.lowResource ? '#fc4' : weapon.cooldown > 0.05 ? '#8cf' : '#9d9';
  drawNeuroPanel(ctx, panelX, panelY, panelW, panelH, time, 190);
  if (weapon.cannotFireReason || weapon.lowResource) {
    ctx.strokeStyle = weapon.cannotFireReason ? 'rgba(255,80,50,0.75)' : 'rgba(255,210,80,0.55)';
    ctx.lineWidth = 1;
    ctx.strokeRect(panelX + 0.5, panelY + 0.5, panelW - 1, panelH - 1);
  }

  const wj = textJitter(time, 200);
  ctx.textAlign = 'left';
  ctx.font = `${6.2 * s}px monospace`;
  ctx.fillStyle = `rgba(220,240,255,${flicker(time, 201)})`;
  ctx.fillText(fitHudText(ctx, hudWeaponName(weapon.name), panelW - 9 * s), panelX + 4.5 * s + wj.dx, panelY + 2 * s + wj.dy);

  ctx.font = `${5.2 * s}px monospace`;
  ctx.fillStyle = '#8cf';
  const control = weapon.controlLabel ? ` ${weapon.controlLabel}` : '';
  const reach = weapon.reachLabel ? ` ${weapon.reachLabel}` : '';
  const factLine = `${weapon.role} УРН ${weapon.damageLabel}${weapon.pellets > 1 ? `/${weapon.pellets}` : ''}${reach}${control}`;
  ctx.fillText(fitHudText(ctx, factLine, panelW - 9 * s), panelX + 4.5 * s, panelY + 9.5 * s);

  ctx.font = `${6.4 * s}px monospace`;
  ctx.fillStyle = statusColor;
  const stateLine = weapon.cannotFireReason ? weapon.cannotFireReason.toUpperCase() : weapon.cooldownLabel;
  ctx.fillText(fitHudText(ctx, stateLine, 42 * s), panelX + 4.5 * s, panelY + 16 * s);
  ctx.textAlign = 'right';
  ctx.fillStyle = weapon.cannotFireReason ? '#f84' : weapon.lowResource ? '#fc4' : '#d7ffd7';
  ctx.fillText(fitHudText(ctx, weapon.resourceLabel, panelW - 51 * s), panelX + panelW - 4.5 * s, panelY + 16 * s);
  ctx.textAlign = 'left';

  drawHoloBar(ctx, panelX + 4.5 * s, panelY + panelH - 3.2 * s, panelW - 9 * s, 1.8 * s, weapon.cannotFireReason ? 0 : weapon.readyPct * 100, statusColor, time, 193);
  return { x: panelX, y: panelY, w: panelW };
}

function drawCombatSightFeedback(
  ctx: CanvasRenderingContext2D,
  target: CombatTargetHud | null,
  signal: CombatSignalHud | null,
  cx: number,
  cy: number,
  sx: number,
  sy: number,
  time: number,
): void {
  if (target) {
    const tw = 76 * sx;
    const th = 15 * sy;
    const tx = cx - tw * 0.5;
    const ty = cy - 28 * sy;
    ctx.fillStyle = 'rgba(2,8,12,0.74)';
    ctx.fillRect(tx, ty, tw, th);
    ctx.strokeStyle = target.danger ? 'rgba(255,80,60,0.55)' : 'rgba(255,190,80,0.5)';
    ctx.strokeRect(tx + 0.5, ty + 0.5, tw - 1, th - 1);
    ctx.font = `${6 * sy}px monospace`;
    ctx.fillStyle = target.danger ? '#f88' : '#fc8';
    ctx.textAlign = 'left';
    ctx.fillText(fitHudText(ctx, `${target.name} ${target.dist}м`, tw - 8 * sx), tx + 4 * sx, ty + 2 * sy);
    const hpW = (tw - 8 * sx) * Math.max(0, Math.min(1, target.hpPct / 100));
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.fillRect(tx + 4 * sx, ty + 10 * sy, tw - 8 * sx, 2 * sy);
    ctx.fillStyle = target.hpPct < 30 ? '#f84' : '#8f8';
    ctx.fillRect(tx + 4 * sx, ty + 10 * sy, hpW, 2 * sy);
  }

  if (signal) {
    const alpha = 0.75 + Math.sin(time * 24) * 0.12;
    ctx.font = `bold ${8 * sy}px monospace`;
    ctx.textAlign = 'center';
    ctx.shadowColor = signal.color;
    ctx.shadowBlur = 7;
    ctx.fillStyle = signal.color;
    ctx.globalAlpha = alpha;
    ctx.fillText(fitHudText(ctx, signal.text, ctx.canvas.width * 0.82), cx, cy + 13 * sy);
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.textAlign = 'left';
  }
}



/* ── The HUD is drawn on the 2D canvas overlaying the 3D view ── */
export function drawHUD(
  ctx: CanvasRenderingContext2D,
  _scaleX: number, _scaleY: number,
  player: Entity,
  state: GameState,
  world: World,
  entities: Entity[],
  uiTime = state.time,
): void {
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  // Scale to match low-res viewport
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const sx = w / SCR_W;
  const sy = h / SCR_H;
  const menuScale = Math.max(0.8, Math.min(2, Math.min(sx, sy)));
  const msx = menuScale;
  const msy = menuScale;

  ctx.font = `${10 * sy}px monospace`;
  ctx.textBaseline = 'top';

  const time = uiTime;
  setUiTextTime(time);
  const smogStatus = getProceduralSmogStatus(world, player, state);
  if (smogStatus.inside) drawSmogVeil(ctx, w, h, time, smogStatus.intensity);

  // ── Bottom status bar (neuro-interface) ─────────────────
  const needsPanelH = NEEDS_PANEL_H * sy;
  const bottomReserve = compactHudBottomReserve(w, h, needsPanelH, sy);
  const barY = h - needsPanelH - bottomReserve;
  drawNeuroPanel(ctx, 0, barY, w, needsPanelH, time, 1);

  if (player.needs) {
    const bars: [string, number, number, string][] = [
      ['ХП', player.hp ?? 100, player.maxHp ?? 100, '#e44'],
    ];
    if (player.rpg) {
      bars.push(['ПСИ', player.rpg.psi, player.rpg.maxPsi, '#a4f']);
    }
    bars.push(
      ['ЕДА', player.needs.food, 100, '#8a4'],
      ['ВОДА', player.needs.water, 100, '#48c'],
      ['СОН', player.needs.sleep, 100, '#a8f'],
      ['ТУАЛ', Math.max(0, 100 - player.needs.pee), 100, '#da4'],
    );
    if (player.rpg) {
      bars.push(['XP', player.rpg.xp, xpForLevel(player.rpg.level + 1), '#af4']);
    }
    bars.forEach(([label, current, max, color], i) => {
      const barSpacing = bars.length > 5 ? 44 : 62;
      const barW = bars.length > 5 ? 36 : BAR_W;
      const bx = 8 * sx + i * barSpacing * sx;
      const by = barY + 3 * sy;
      const pct = toPercent(current, max);
      // Label with jitter
      drawGlitchText(ctx, label, bx, by, time, i * 13 + 7, '#8cc', 7 * sy);
      ctx.font = `${7 * sy}px monospace`;
      // Holo bar
      drawHoloBar(ctx, bx, by + 9 * sy, barW * sx, BAR_H * sy, pct, color, time, i);
    });
  }

  const netSphereOpen = isNetSphereOpen();
  const netTerminalGenOpen = isNetTerminalGenOpen();
  const mapEditorOpen = isMapEditorOpen();
  const showCompactPanels = state.mapMode !== 2 &&
    !state.showInventory && !state.showQuests && !state.showLog &&
    !state.showFactions && !state.showMenu && !state.showNpcMenu && !state.showContainerMenu &&
    !netSphereOpen && !netTerminalGenOpen && !mapEditorOpen;
  const combatWeapon = showCompactPanels ? getWeaponReadiness(player) : null;
  const combatTarget = showCompactPanels ? findAimTarget(world, entities, player) : null;
  const combatSignal = showCompactPanels ? recentCombatSignal(state, time) : null;

  const zhelemishLine = showCompactPanels ? zhelemishHudLine(player, time) : null;
  if (zhelemishLine) {
    const panelW = Math.min(180 * sx, w - 12 * sx);
    const panelH = 14 * sy;
    const panelX = 4 * sx;
    const panelY = barY - panelH - 4 * sy;
    drawNeuroPanel(ctx, panelX, panelY, panelW, panelH, time, 185);
    ctx.font = `${7 * sy}px monospace`;
    ctx.fillStyle = '#9c6';
    ctx.fillText(fitHudText(ctx, zhelemishLine, panelW - 10 * sx), panelX + 5 * sx, panelY + 4 * sy);
  }

  const routeCue = getActiveRouteCueHud(state.time, state.currentFloor);
  const routeCueVisible = !!routeCue && showCompactPanels && !state.samosborActive;
  const smogIndicatorVisible = smogStatus.active && (smogStatus.inside || smogStatus.sourceFound || smogStatus.handled);

  // Weapon state — compact bottom-right panel, hidden under fullscreen overlays.
  if (showCompactPanels) {
    const weaponPanel = drawCombatWeaponPanel(ctx, combatWeapon!, w, barY, sx, sy, time);

    if (player.tool) {
      const toolName = ITEMS[player.tool]?.name ?? player.tool;
      const toolDur = getEquippedToolDurability(player);
      const toolLabel = toolDur ? `${toolName} [${Math.max(0, Math.ceil(toolDur.cur))}/${toolDur.max}]` : toolName;
      const tj = textJitter(time, 210);
      ctx.textAlign = 'right';
      ctx.fillStyle = `rgba(136,200,255,${flicker(time, 211)})`;
      if (weaponPanel.y > 14 * sy) {
        const s = Math.max(1, Math.min(sx, sy));
        ctx.fillText(fitHudText(ctx, toolLabel, weaponPanel.w), weaponPanel.x + weaponPanel.w - 2 * s + tj.dx, weaponPanel.y - 8 * s + tj.dy);
      }
      ctx.fillStyle = '#ccc';
    }
    ctx.textAlign = 'left';
  }

  if (routeCueVisible) {
    drawRouteCueHint(ctx, w, sx, sy, time, player, world, routeCue);
  }
  if (showCompactPanels) {
    drawVoidReturnPortalHint(ctx, w, sx, sy, time, player, state, world);
  }

  // Universal [E] interaction prompt (color changes per target object)
  {
    const lookX = player.x + Math.cos(player.angle) * 1.5;
    const lookY = player.y + Math.sin(player.angle) * 1.5;
    const lci = world.idx(Math.floor(lookX), Math.floor(lookY));
    const cell = world.cells[lci];
    let targetId = 0; // unique id for color hashing
    let canInteract = false;
    let liftHint = '';
    const processionHint = getCultProcessionPrompt(world, state, player);
    if (processionHint) {
      canInteract = true;
      targetId = 850000 + processionHint.length;
    } else if (isNetTerminalGenTarget(world, state, lookX, lookY)) {
      canInteract = true;
      targetId = lci + 910000;
    } else if (cell === Cell.DOOR && world.doors.has(lci)) { canInteract = true; targetId = lci + 100000; }
    else if (cell === Cell.LIFT || world.features[lci] === Feature.LIFT_BUTTON) {
      canInteract = true; targetId = lci + 200000;
      const dir = world.liftDir[lci] as LiftDirection;
      liftHint = `${dir === LiftDirection.UP ? ' ↑' : ' ↓'}${activeVisitLiftHint(state, dir)}`;
    }
    else if (isParitelSteamValveTarget(world, lookX, lookY)) { canInteract = true; targetId = lci + 450000; }
    else if (isRouteCueTarget(world, player, lookX, lookY)) { canInteract = true; targetId = lci + 470000; }
    else {
      const anomalyTargetId = railTrainInteractionTargetId(world, player, state, lookX, lookY)
        ?? hladonInteractionTargetId(world, lookX, lookY)
        ?? proceduralAnomalyInteractionTargetId(world, state, lookX, lookY);
      if (anomalyTargetId !== null) { canInteract = true; targetId = anomalyTargetId; }
    }
    if (!canInteract) {
      let bestD2 = 4.0;
      getEntityIndex().queryRadius(lookX, lookY, 2, interactionNpcQuery, ENTITY_MASK_NPC);
      for (const e of interactionNpcQuery) {
        if (!e.alive || e.type !== EntityType.NPC) continue;
        const d2 = world.dist2(lookX, lookY, e.x, e.y);
        if (d2 < bestD2) { bestD2 = d2; canInteract = true; targetId = e.id; }
      }
    }
    if (!canInteract) {
      const container = world.containersAt(Math.floor(lookX), Math.floor(lookY))
        .find(c => c.discovered || c.access !== 'secret');
      if (container) {
        canInteract = true;
        targetId = container.id + 300000;
      }
    }
    if (canInteract) {
      // Deterministic color from targetId — shifted to cyan/teal palette
      const h0 = ((targetId * 2654435761) >>> 0) % 360;
      const er = Math.round(100 + 80 * Math.cos(h0 * Math.PI / 180));
      const eg = Math.round(200 + 55 * Math.cos((h0 + 120) * Math.PI / 180));
      const eb = Math.round(200 + 55 * Math.cos((h0 + 240) * Math.PI / 180));
      const ej = textJitter(time, targetId);
      const eAlpha = flicker(time, targetId + 500);
      ctx.fillStyle = `rgba(${er},${eg},${eb},${eAlpha})`;
      ctx.font = `${9 * sy}px monospace`;
      ctx.textAlign = 'center';
      // Subtle glow behind
      ctx.shadowColor = `rgba(${er},${eg},${eb},0.4)`;
      ctx.shadowBlur = 6;
      const prompt = fitHudText(ctx, `[E]${processionHint || liftHint}`, w - 24 * sx);
      ctx.fillText(prompt, w / 2 + ej.dx, h / 2 + 30 * sy + ej.dy);
      ctx.shadowBlur = 0;
      ctx.textAlign = 'left';
    }
  }

  const hazardWarning = getPlayerHazardWarning(world, player);
  if (hazardWarning && state.mapMode !== 2 && !state.showInventory && !state.showQuests && !state.showLog && !netSphereOpen && !netTerminalGenOpen && !mapEditorOpen) {
    const panelW = Math.min(w - 16 * sx, 230 * sx);
    const panelH = 28 * sy;
    const panelX = (w - panelW) * 0.5;
    const panelY = h * 0.5 + 42 * sy;
    drawNeuroPanel(ctx, panelX, panelY, panelW, panelH, time, 520);
    ctx.textAlign = 'center';
    ctx.shadowColor = hazardWarning.color;
    ctx.shadowBlur = hazardWarning.trapped ? 9 : 4;
    drawGlitchText(ctx, hazardWarning.title, w * 0.5, panelY + 4 * sy, time * 2, 521, hazardWarning.color, 10 * sy);
    ctx.shadowBlur = 0;
    ctx.font = `${7 * sy}px monospace`;
    ctx.fillStyle = '#f0c8c8';
    ctx.fillText(fitHudText(ctx, hazardWarning.detail, panelW - 12 * sx), w * 0.5, panelY + 17 * sy);
    ctx.textAlign = 'left';
  }

  // ── Messages (with jitter) ────────────────────────────────
  const now = state.time;
  let my = 4 * sy;
  ctx.font = `${7 * sy}px monospace`;
  const msgRightReserve = state.mapMode === 1 ? 90 * sx : 0;
  const msgMaxW = Math.max(48 * sx, w - 8 * sx - msgRightReserve);
  for (let i = state.msgs.length - 1; i >= Math.max(0, state.msgs.length - MSG_MAX); i--) {
    const m = state.msgs[i];
    const age = now - m.time;
    if (age > 8) continue;
    const _mday = m.day;
    const _mhh = String(m.hour).padStart(2, '0');
    const _mmm = String(m.minute).padStart(2, '0');
    const _stamp = `[Д${_mday} ${_mhh}:${_mmm}] `;
    const alpha = age > 6 ? 1 - (age - 6) / 2 : 1;
    const mj = textJitter(time, i * 17 + 300);
    ctx.globalAlpha = alpha * flicker(time, i + 300);
    const stampW = ctx.measureText(_stamp).width;
    ctx.fillStyle = '#556';
    ctx.fillText(_stamp, 4 * sx + mj.dx, my + mj.dy);
    ctx.fillStyle = m.color;
    ctx.fillText(fitHudText(ctx, m.text, msgMaxW - stampW), 4 * sx + stampW + mj.dx, my + mj.dy);
    my += 9 * sy;
  }
  ctx.globalAlpha = 1;

  const seroburmalineFx = getSeroburmalineHudFx(state);
  if (seroburmalineFx) drawSeroburmalineNoLookFx(ctx, w, h, time, seroburmalineFx);

  // ── Crosshair (neuro-style) ──────────────────────────────
  const cj = textJitter(time, 999);
  const cAlpha = 0.4 + Math.sin(time * 2) * 0.08;
  const crossRgb = combatWeapon?.cannotFireReason ? '255,95,55'
    : combatTarget ? '255,210,80'
    : combatWeapon && combatWeapon.cooldown > 0.05 ? '90,180,255'
    : '0,220,200';
  ctx.strokeStyle = `rgba(${crossRgb},${cAlpha})`;
  ctx.lineWidth = 1;
  const cx = w / 2 + cj.dx * 0.3, cy = h / 2 + cj.dy * 0.3;
  ctx.beginPath();
  ctx.moveTo(cx - 6 * sx, cy); ctx.lineTo(cx - 2 * sx, cy);
  ctx.moveTo(cx + 2 * sx, cy); ctx.lineTo(cx + 6 * sx, cy);
  ctx.moveTo(cx, cy - 6 * sy); ctx.lineTo(cx, cy - 2 * sy);
  ctx.moveTo(cx, cy + 2 * sy); ctx.lineTo(cx, cy + 6 * sy);
  ctx.stroke();
  // Small dot center
  ctx.fillStyle = `rgba(${crossRgb},${cAlpha * 0.6})`;
  ctx.fillRect(cx - 0.5, cy - 0.5, 1, 1);
  if (combatWeapon && combatWeapon.cooldownPct > 0.02) {
    const r = 10 * Math.min(sx, sy);
    ctx.strokeStyle = `rgba(${crossRgb},0.48)`;
    ctx.lineWidth = Math.max(1, Math.min(sx, sy));
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * combatWeapon.readyPct);
    ctx.stroke();
  }
  drawCombatSightFeedback(ctx, combatTarget, combatSignal, cx, cy, sx, sy, time);

  // ── Zone info + time + room (neuro-interface left panel) ──
  {
    const pci = world.idx(Math.floor(player.x), Math.floor(player.y));
    const zid = world.zoneMap[pci];
    const zone = world.zones[zid];

    // Game clock + day counter — just above status bar
    const hh = String(state.clock.hour).padStart(2, '0');
    const mm = String(state.clock.minute).padStart(2, '0');
    const day = Math.floor(state.clock.totalMinutes / 1440);
    const floorInstance = currentFloorInstanceLabel(state);
    const floorRun = currentFloorRunLabel(state);
    const leftInfoW = Math.max(70 * sx, Math.min(220 * sx, w - 150 * sx));
    if (floorRun) drawGlitchText(ctx, fitHudText(ctx, floorRun, leftInfoW), 4 * sx, barY - 62 * sy, time, 398, '#8cf', 7 * sy);
    if (floorInstance) drawGlitchText(ctx, fitHudText(ctx, `Лифт ${floorInstance}`, leftInfoW), 4 * sx, barY - 52 * sy, time, 404, '#f4a', 8 * sy);
    drawGlitchText(ctx, `День ${day}  ${hh}:${mm}`, 4 * sx, barY - 42 * sy, time, 400, '#8ac', 9 * sy);
    ctx.font = `${9 * sy}px monospace`;

    // Zone
    if (zone) {
      const [zr, zg, zb] = ZONE_COLORS[zid % 64];
      const fLabel = ZONE_FACTION_NAMES[zone.faction];
      const zj = textJitter(time, 410);
      ctx.fillStyle = `rgba(${zr},${zg},${zb},${flicker(time, 411)})`;
      ctx.font = `${8 * sy}px monospace`;
      ctx.fillText(fitHudText(ctx, `■ Зона ${zid + 1}  Ур.${zone.level ?? 1}`, leftInfoW), 4 * sx + zj.dx, barY - 32 * sy + zj.dy);
      const fColor = zone.faction === ZoneFaction.SAMOSBOR ? '#c4f' : '#7aa';
      drawGlitchText(ctx, fitHudText(ctx, fLabel, leftInfoW), 4 * sx, barY - 22 * sy, time, 412, fColor, 7 * sy);
      ctx.font = `${7 * sy}px monospace`;
    }

    // Room info
    const room = world.roomAt(player.x, player.y);
    if (room) {
      drawGlitchText(ctx, fitHudText(ctx, room.name, leftInfoW), 4 * sx, barY - 12 * sy, time, 420, '#688', 7 * sy);
      ctx.font = `${7 * sy}px monospace`;
    }
  }

  // ── Minimap (if toggled) ─────────────────────────────────
  if (state.mapMode === 1) {
    drawMinimap(ctx, world, entities, player, sx, sy, state.quests, currentFloorInstanceLabel(state), state.currentFloor, state, time);
  } else if (state.mapMode === 2) {
    drawFullMap(ctx, world, entities, player, sx, sy, state.quests, currentFloorInstanceLabel(state), state.currentFloor, state, time);
  }

  // ── Inventory (if toggled) ───────────────────────────────
  if (state.showInventory) {
    drawInventory(ctx, player, state, sx, sy, time);
  }

  // ── Quest log (if toggled) ───────────────────────────────
  if (state.showQuests) {
    drawQuestLog(ctx, state, msx, msy, time);
  }

  // ── Faction relations matrix (F) ─────────────────────────
  if (state.showFactions) {
    drawFactionMenu(ctx, player, entities, msx, msy, time);
  }

  // ── Message log (L) ─────────────────────────────────────
  if (state.showLog) {
    drawLogMenu(ctx, state, msx, msy, time);
  }

  // ── Game menu (ESC) ──────────────────────────────────────
  if (state.showMenu) {
    drawGameMenu(ctx, state, msx, msy, time);
  }

  // ── NPC interaction menu ─────────────────────────────────
  if (state.showNpcMenu) {
    drawNpcMenu(ctx, player, state, entities, msx, msy, time);
  }

  // ── Container menu ──────────────────────────────────────
  if (state.showContainerMenu) {
    drawContainerMenu(ctx, player, state, world, msx, msy);
  }

  // ── SAMOSBOR warning (intense glitch) ──────────────────────
  const samosborWarning = getSamosborWarningSnapshot(state);
  if (samosborWarning && !state.samosborActive) {
    drawSamosborPrewarning(ctx, w, h, sx, sy, time, samosborWarning);
    if (samosborWarning.variantId === 'veretar') drawVeretarVeil(ctx, w, h, time, 0.45);
  }
  const liftArachnaWarning = getLiftArachnaWarningSnapshot(state);
  if (liftArachnaWarning && !state.gameOver) {
    drawLiftArachnaWarning(ctx, w, sx, sy, time, liftArachnaWarning, (samosborWarning && !state.samosborActive ? 66 : 6) * sy);
  }
  if (state.samosborActive) {
    const activeVariant = getActiveSamosborVariant();
    const activeTitle = activeVariant?.def.id === 'istotit'
      ? 'ИСТОТИТ'
      : activeVariant?.def.id === 'maronary'
      ? 'МАРОНАРИЙ'
      : activeVariant?.def.id === 'veretar'
      ? 'ВЕРЕТАР'
      : 'САМОСБОР';
    const sj = textJitter(time * 3, 666);
    const sAlpha = 0.5 + Math.sin(time * 8) * 0.3;
    ctx.save();
    ctx.shadowColor = activeVariant ? activeVariant.def.tint : 'rgba(255,0,40,0.6)';
    ctx.shadowBlur = 12;
    ctx.fillStyle = activeVariant ? activeVariant.def.tint : `rgba(255,40,40,${sAlpha})`;
    ctx.font = `bold ${16 * sy}px monospace`;
    ctx.textAlign = 'center';
    const fittedActiveTitle = fitHudText(ctx, activeTitle, w - 16 * sx);
    ctx.fillText(fittedActiveTitle, w / 2 + sj.dx * 3, 20 * sy + sj.dy * 2);
    if (activeVariant) {
      ctx.font = `${8 * sy}px monospace`;
      ctx.fillText(fitHudText(ctx, activeVariant.def.displayName, w - 16 * sx), w / 2 + sj.dx, 38 * sy + sj.dy);
      if (activeVariant.def.id === 'istotit') {
        const room = world.roomAt(player.x, player.y);
        const inShelter = room ? getSamosborShelterRoomIds(state).includes(room.id) : false;
        ctx.font = `${7 * sy}px monospace`;
        ctx.fillText(fitHudText(ctx, inShelter ? '[E] впустить / закрыть' : '[E] к колоколу', w - 16 * sx), w / 2 + sj.dx, 48 * sy + sj.dy);
      }
    }
    // Doubled glitch offset copy
    ctx.fillStyle = `rgba(0,255,200,${sAlpha * 0.2})`;
    ctx.fillText(fittedActiveTitle, w / 2 + sj.dx * 3 + 2, 20 * sy + sj.dy * 2 + 1);
    ctx.textAlign = 'left';
    ctx.shadowBlur = 0;
    ctx.restore();
    // Extra static noise during samosbor
    drawStaticNoise(ctx, 0, 0, w, h, time, 0.04);
    if (activeVariant?.def.id === 'maronary') drawMaronaryProofNoise(ctx, w, h, time, 0.85);
    if (activeVariant?.def.id === 'veretar') drawVeretarVeil(ctx, w, h, time, 0.85);
  }

  if (smogIndicatorVisible) {
    drawSmogIndicator(ctx, w, sx, sy, time, smogStatus);
  }

  // ── Damage vignette (procedural blood edges) ──────────────
  if (state.dmgFlash > 0) {
    drawDamageVignette(ctx, w, h, state.dmgFlash, state.dmgSeed, time);
  }

  // ── PSI Beam visual (Kamehameha) ──────────────────────────
  if (state.beamFx > 0) {
    drawBeamFx(ctx, w, h, state.beamFx, state.beamAngle, state.beamLen, player.angle, time);
  }
  if (state.uvBeamFx > 0) {
    drawUvSpotlightFx(ctx, w, h, state.uvBeamFx, state.uvBeamLen, time);
  }

  // ── Game over (neuro-interface death) ─────────────────────
  if (state.gameOver && state.gameWon) {
    // Victory end screen — black fade-in
    const winAlpha = Math.min(1, state.deathTimer * 0.4);
    ctx.fillStyle = `rgba(0,0,0,${winAlpha})`;
    ctx.fillRect(0, 0, w, h);

    if (state.deathTimer > 1) {
      const textAlpha = Math.min(1, (state.deathTimer - 1) * 0.5);
      const dj = textJitter(time * 0.5, 999);
      ctx.save();
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,255,128,0.4)';
      ctx.shadowBlur = 20;
      ctx.fillStyle = `rgba(200,255,200,${textAlpha})`;
      ctx.font = `bold ${28 * sy}px monospace`;
      ctx.fillText('КОНЕЦ ИГРЫ', w / 2 + dj.dx, h / 2 - 20 * sy + dj.dy);
      ctx.fillStyle = `rgba(0,200,100,${textAlpha * 0.15})`;
      ctx.fillText('КОНЕЦ ИГРЫ', w / 2 + dj.dx + 3, h / 2 - 20 * sy + dj.dy + 1);
      ctx.shadowBlur = 0;
      ctx.fillStyle = `rgba(136,170,136,${Math.min(1, (state.deathTimer - 2) * 0.4)})`;
      ctx.font = `${10 * sy}px monospace`;
      ctx.fillText(fitHudText(ctx, voidReturnVictoryLine(state), w * 0.82), w / 2, h / 2 + 10 * sy);
      ctx.fillText('[R] — заново', w / 2, h / 2 + 30 * sy);
      ctx.textAlign = 'left';
      ctx.restore();
    }
  } else if (state.gameOver) {
    const deathAlpha = Math.min(0.5, state.deathTimer * 0.15);
    const grd = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.15, w / 2, h / 2, Math.min(w, h) * 0.7);
    grd.addColorStop(0, `rgba(0,0,0,0)`);
    grd.addColorStop(1, `rgba(0,0,0,${deathAlpha})`);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);

    // Intense static noise
    drawStaticNoise(ctx, 0, 0, w, h, time, 0.06 * Math.min(1, state.deathTimer * 0.3));

    const textAlpha = 0.6 + Math.sin(time * 3) * 0.3;
    const dj = textJitter(time * 2, 777);
    ctx.save();
    ctx.shadowColor = 'rgba(255,0,0,0.5)';
    ctx.shadowBlur = 15;
    ctx.fillStyle = `rgba(200,0,0,${textAlpha})`;
    ctx.font = `bold ${24 * sy}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('ВЫ ПОГИБЛИ', w / 2 + dj.dx * 2, h / 2 - 20 * sy + dj.dy);
    // RGB split ghost
    ctx.fillStyle = `rgba(0,200,200,${textAlpha * 0.15})`;
    ctx.fillText('ВЫ ПОГИБЛИ', w / 2 + dj.dx * 2 + 3, h / 2 - 20 * sy + dj.dy + 1);
    ctx.shadowBlur = 0;
    ctx.fillStyle = `rgba(136,136,136,${Math.min(1, state.deathTimer * 0.5)})`;
    const deathCause = inferDeathCause(state, player, world, entities);
    ctx.font = `${10 * sy}px monospace`;
    ctx.fillText(deathCause.title, w / 2, h / 2 + 10 * sy);
    ctx.font = `${8 * sy}px monospace`;
    ctx.fillText(fitHudText(ctx, deathCause.detail, w * 0.82), w / 2, h / 2 + 24 * sy);
    ctx.font = `${10 * sy}px monospace`;
    ctx.fillText('[R] — заново', w / 2, h / 2 + 44 * sy);
    ctx.textAlign = 'left';
    ctx.restore();
  }

  // ── Debug screen (~) ─────────────────────────────────────
  if (state.showDebug) {
    drawDebugOverlay(ctx, sx, sy, w, h, world, entities, state, state.debugSel);
  }

  // ── NET Sphere terminal (N) ──────────────────────────────
  if (netSphereOpen) {
    drawNetSphereMenu(ctx, msx, msy, time, getNetSphereSnapshot());
  }

  if (isNetTerminalGenDeniedOpen()) {
    const terminal = getNetTerminalGenRuntimeSnapshot();
    drawNetTerminalGenDenied(ctx, msx, msy, time, {
      status: 'locked',
      code: terminal.terminalIdx >= 0 ? `IDX ${terminal.terminalIdx}` : undefined,
      lines: [
        'Счёт доступен в банковском режиме.',
        'Редактор карты требует НЕТ-ГЕН.',
      ],
      footer: '[Enter] закрыть  |  счёт без ГЕН',
    });
  }

  if (isNetTerminalBankOpen()) {
    drawNetTerminalBank(ctx, msx, msy, time, getNetTerminalBankSnapshot(state, player));
  }

  if (mapEditorOpen) {
    drawMapEditor(ctx, msx, msy, time, world, entities, player, {
      ...getMapEditorSnapshot(state),
      terminals: getNetTerminalGenTerminals(),
    });
  }

  // ── Sleep overlay (Z held) ───────────────────────────────
  if (state.sleeping) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#a8f';
    ctx.font = `bold ${16 * sy}px monospace`;
    ctx.textAlign = 'center';
    const sleepPct = Math.floor(player.needs?.sleep ?? 0);
    ctx.fillText(`Сон: ${sleepPct}%`, w / 2, h / 2 - 10 * sy);
    ctx.fillStyle = '#666';
    ctx.font = `${8 * sy}px monospace`;
    ctx.fillText('[Z] — отпустите чтобы проснуться', w / 2, h / 2 + 10 * sy);
    ctx.textAlign = 'left';
  }

  // ── Global neuro-interface overlay (always-on) ───────────
  drawGlitchLine(ctx, w, h, time);

  ctx.restore();
}

/* ── Procedural damage vignette (blood vessel edges) ──────────── */
function drawDamageVignette(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  intensity: number, seed: number, time: number,
): void {
  ctx.save();

  // BFG green flash (seed === 2), explosion orange (seed === 3), normal red damage
  const isGreen = seed === 2;
  const isOrange = seed === 3;
  const cR = isGreen ? 0 : 1;
  const cG = isGreen ? 1 : isOrange ? 0.6 : 0;

  // Edge darkening — radial gradient from center
  const darkA = intensity * 0.4;
  const grd = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.min(w, h) * 0.65);
  grd.addColorStop(0, `rgba(0,0,0,0)`);
  grd.addColorStop(0.6, `rgba(${40 * cR},${Math.floor(40 * cG)},0,${darkA * 0.3})`);
  grd.addColorStop(1, `rgba(0,0,0,${darkA})`);
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, w, h);

  // Color overlay with radial gradient (transparent center, colored edges)
  const colA = intensity * (isGreen ? 0.7 : 0.5);
  const grd2 = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.15, w / 2, h / 2, Math.min(w, h) * 0.6);
  grd2.addColorStop(0, `rgba(${180 * cR},${180 * cG},0,0)`);
  grd2.addColorStop(0.5, `rgba(${140 * cR},${140 * cG},0,${colA * 0.2})`);
  grd2.addColorStop(1, `rgba(${120 * cR},${120 * cG},0,${colA})`);
  ctx.fillStyle = grd2;
  ctx.fillRect(0, 0, w, h);

  // Procedural blood vessel lines from edges
  ctx.globalCompositeOperation = 'source-over';
  const numVeins = 8 + Math.floor(intensity * 12);
  const s = seed;
  for (let i = 0; i < numVeins; i++) {
    // Seeded pseudo-random for consistent pattern per hit
    const r1 = ((Math.sin(s + i * 127.1) * 43758.5453) % 1 + 1) % 1;
    const r2 = ((Math.sin(s + i * 269.5 + 311.7) * 43758.5453) % 1 + 1) % 1;
    const r3 = ((Math.sin(s + i * 419.2 + 631.2) * 43758.5453) % 1 + 1) % 1;
    const r4 = ((Math.sin(s + i * 173.9 + 967.3) * 43758.5453) % 1 + 1) % 1;

    // Start from a random edge
    const edge = Math.floor(r1 * 4);
    let sx: number, sy: number;
    if (edge === 0) { sx = r2 * w; sy = 0; }           // top
    else if (edge === 1) { sx = r2 * w; sy = h; }      // bottom
    else if (edge === 2) { sx = 0; sy = r2 * h; }      // left
    else { sx = w; sy = r2 * h; }                       // right

    // Draw branching vein toward center
    const veinAlpha = intensity * (0.2 + r3 * 0.4);
    const veinLen = (0.1 + r4 * 0.25) * Math.min(w, h);
    const toX = w / 2 + (r3 - 0.5) * w * 0.3;
    const toY = h / 2 + (r4 - 0.5) * h * 0.3;
    const dx = toX - sx, dy = toY - sy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const nx = dx / dist, ny = dy / dist;

    ctx.beginPath();
    ctx.moveTo(sx, sy);

    // Main vein with slight organic wobble
    const steps = 6;
    let cx = sx, cy = sy;
    for (let j = 1; j <= steps; j++) {
      const t = j / steps;
      const wobbleT = Math.sin(time * 3 + i * 2 + j) * (4 + r2 * 8);
      cx = sx + nx * veinLen * t + ny * wobbleT;
      cy = sy + ny * veinLen * t - nx * wobbleT;
      ctx.lineTo(cx, cy);
    }

    const lineW = 1 + r3 * 2.5 * intensity;
    ctx.strokeStyle = `rgba(${160 * cR},${160 * cG},10,${veinAlpha})`;
    ctx.lineWidth = lineW;
    ctx.stroke();

    // Thinner branch
    if (r2 > 0.4 && i < numVeins - 2) {
      const bx = sx + nx * veinLen * 0.5 + ny * (r4 - 0.5) * 20;
      const by = sy + ny * veinLen * 0.5 - nx * (r4 - 0.5) * 20;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + nx * veinLen * 0.2 + ny * (r1 - 0.5) * 30,
                 by + ny * veinLen * 0.2 - nx * (r1 - 0.5) * 30);
      ctx.strokeStyle = `rgba(${130 * cR},${130 * cG},10,${veinAlpha * 0.6})`;
      ctx.lineWidth = lineW * 0.5;
      ctx.stroke();
    }
  }

  ctx.restore();
}

/* ── UV spotlight visual — narrow cyan/violet utility cone ────── */
function drawUvSpotlightFx(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  intensity: number,
  beamLen: number,
  time: number,
): void {
  ctx.save();
  const alpha = Math.min(1, intensity * 4);
  const cx = w / 2;
  const cy = h / 2;
  const reach = Math.min(w * 0.47, w * (0.22 + Math.min(1, beamLen / 10) * 0.3));
  const endX = cx + reach;
  const nearW = h * (0.012 + intensity * 0.018);
  const farW = h * (0.052 + intensity * 0.04);
  const wobble = Math.sin(time * 42) * h * 0.004;

  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 3; i++) {
    const layer = i / 2;
    const grd = ctx.createLinearGradient(cx, cy, endX, cy);
    grd.addColorStop(0, `rgba(230,255,255,${alpha * (0.42 - layer * 0.08)})`);
    grd.addColorStop(0.45, `rgba(120,190,255,${alpha * (0.24 - layer * 0.04)})`);
    grd.addColorStop(1, `rgba(120,70,255,0)`);
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.moveTo(cx, cy - nearW * (1 + layer) + wobble);
    ctx.lineTo(endX, cy - farW * (1 + layer * 0.45));
    ctx.lineTo(endX, cy + farW * (1 + layer * 0.45));
    ctx.lineTo(cx, cy + nearW * (1 + layer) + wobble);
    ctx.closePath();
    ctx.fill();
  }

  ctx.strokeStyle = `rgba(210,250,255,${alpha * 0.75})`;
  ctx.lineWidth = Math.max(1, h * 0.003);
  ctx.beginPath();
  ctx.moveTo(cx - 2, cy + wobble);
  ctx.lineTo(endX, cy + Math.sin(time * 58) * h * 0.01);
  ctx.stroke();

  for (let i = 0; i < 5; i++) {
    const t0 = (i + 1) / 6;
    const x = cx + reach * t0;
    const y = cy + Math.sin(time * 24 + i * 1.7) * farW * 0.36 * t0;
    ctx.strokeStyle = `rgba(170,120,255,${alpha * 0.24})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - reach * 0.06, y);
    ctx.lineTo(x + reach * 0.05, y + Math.cos(time * 31 + i) * farW * 0.18);
    ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

/* ── PSI Beam visual (Kamehameha) — bright purple beam from center ── */
function drawBeamFx(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  intensity: number,
  _beamAngle: number,
  _beamLen: number,
  _playerAngle: number,
  time: number,
): void {
  ctx.save();
  const alpha = Math.min(1, intensity * 2.5); // fade from ~0.85 to 0

  const cx = w / 2;
  const cy = h / 2;
  const beamEndX = w;

  // ── Fullscreen purple flash ──
  const flashA = intensity * 0.4;
  const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.7);
  grd.addColorStop(0, `rgba(180,40,255,${flashA})`);
  grd.addColorStop(0.3, `rgba(120,20,200,${flashA * 0.6})`);
  grd.addColorStop(1, `rgba(40,0,80,0)`);
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, w, h);

  // ── Central beam core — horizontal bands ──
  const beamH = h * 0.12 * (0.5 + intensity * 0.5);
  const wobble = Math.sin(time * 30) * beamH * 0.08;

  for (let i = 0; i < 3; i++) {
    const spread = beamH * (0.15 + i * 0.3);
    const lineA = alpha * (1 - i * 0.3);
    const r = i === 0 ? 255 : i === 1 ? 200 : 140;
    const g = i === 0 ? 220 : i === 1 ? 80 : 20;
    const b = 255;
    const grdBeam = ctx.createLinearGradient(0, cy, w, cy);
    grdBeam.addColorStop(0, `rgba(${r},${g},${b},0)`);
    grdBeam.addColorStop(0.15, `rgba(${r},${g},${b},${lineA * 0.3})`);
    grdBeam.addColorStop(0.4, `rgba(${r},${g},${b},${lineA})`);
    grdBeam.addColorStop(0.5, `rgba(${r},${g},${b},${lineA})`);
    grdBeam.addColorStop(0.6, `rgba(${r},${g},${b},${lineA})`);
    grdBeam.addColorStop(0.85, `rgba(${r},${g},${b},${lineA * 0.3})`);
    grdBeam.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = grdBeam;
    ctx.fillRect(0, cy - spread + wobble, w, spread * 2);
  }

  // ── Energy tendrils along beam ──
  ctx.globalCompositeOperation = 'lighter';
  const tendrilCount = 6;
  for (let i = 0; i < tendrilCount; i++) {
    const phase = time * 20 + i * 1.7;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    const segs = 12;
    for (let j = 1; j <= segs; j++) {
      const t = j / segs;
      const px = cx + (beamEndX - cx) * t;
      const py = cy + Math.sin(phase + t * 8) * beamH * 0.5 * t
        + Math.cos(phase * 1.3 + t * 12) * beamH * 0.2;
      ctx.lineTo(px, py);
    }
    ctx.strokeStyle = `rgba(180,100,255,${alpha * 0.4})`;
    ctx.lineWidth = 1.5 + intensity * 2;
    ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over';

  // ── Muzzle flash (hot center dot) ──
  const dotR = Math.min(w, h) * 0.04 * (0.5 + intensity);
  const dotGrd = ctx.createRadialGradient(cx, cy + wobble, 0, cx, cy + wobble, dotR);
  dotGrd.addColorStop(0, `rgba(255,255,255,${alpha})`);
  dotGrd.addColorStop(0.3, `rgba(220,180,255,${alpha * 0.8})`);
  dotGrd.addColorStop(1, `rgba(140,40,220,0)`);
  ctx.fillStyle = dotGrd;
  ctx.fillRect(cx - dotR, cy - dotR + wobble, dotR * 2, dotR * 2);

  ctx.restore();
}
