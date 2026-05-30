/* ── Runtime NPC dialogue dispatch ───────────────────────────── */

import { Faction, FloorLevel, type Entity, Occupation, RoomType } from '../core/types';
import {
  FACTION_LINES,
  GENERAL_LINES,
  MEDICAL_ROOM_LINES,
  MINISTRY_CLERK_LINES,
  MINISTRY_OCC_LINES,
  OCC_LINES,
  OLD_WORLD_MEMORY_LINES,
  ROOM_MEMORY_COMBAT_LINES,
  ROOM_MEMORY_HELP_LINES,
  ROOM_MEMORY_REPAIR_LINES,
  ROOM_MEMORY_SAMOSBOR_LINES,
  ROOM_MEMORY_THEFT_LINES,
} from '../data/dialogue';
import { PLOT_CHAIN, getPlotDef } from '../data/plot';
import {
  CONTEXT_ACTIVE_CONTRACT_LINES,
  CONTEXT_DANGEROUS_ZONE_LINES,
  CONTEXT_FACTION_EVENT_FACTION_LINES,
  CONTEXT_FACTION_EVENT_LINES,
  CONTEXT_FACTION_LINES,
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
} from '../data/context_lines';
import { getNpcStateText } from './ai';
import { buildContextSnapshot, type ContextBuildOptions, type ContextSnapshot } from './context';
import { markNpcSpokenTo, type NpcMemory } from './npc_memory';
import { observeRecentRumorEventsForNpc, selectRumorForNpc } from './rumor';

/* ── Talk text (called from NPC menu "Talk" tab) ─────────────── */
export function generateTalkText(npc: Entity, options: ContextBuildOptions = {}): string {
  const def = getPlotDef(npc);
  if (def) {
    const plotPostUnlocked = isPlotNpcPostUnlocked(npc, options.state?.quests);
    if ((npc.plotDone || plotPostUnlocked) && def.talkLinesPost.length > 0 && Math.random() < 0.75) {
      return def.talkLinesPost[Math.floor(Math.random() * def.talkLinesPost.length)];
    }
    if (!npc.plotDone && !plotPostUnlocked && def.talkLines.length > 0) {
      const idx = (npc._plotTalkIdx ?? 0) % def.talkLines.length;
      npc._plotTalkIdx = idx + 1;
      return def.talkLines[idx];
    }
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

  if (npc.ai?.npcState !== undefined && Math.random() < 0.4) {
    return getNpcStateText(npc.ai.npcState);
  }

  const lines: string[] = [...GENERAL_LINES];
  if (snapshot.floor === FloorLevel.MINISTRY) {
    lines.push(...MINISTRY_CLERK_LINES);
    if (npc.occupation !== undefined) lines.push(...(MINISTRY_OCC_LINES[npc.occupation] ?? []));
  }
  if (npc.faction !== undefined) lines.push(...(FACTION_LINES[npc.faction] ?? []));
  if (npc.occupation !== undefined) lines.push(...(OCC_LINES[npc.occupation] ?? []));
  if (shouldUseOldWorldMemoryLines(npc) && Math.random() < 0.18) {
    lines.push(...OLD_WORLD_MEMORY_LINES);
  }
  return lines[Math.floor(Math.random() * lines.length)];
}

function shouldUseOldWorldMemoryLines(npc: Entity): boolean {
  return npc.occupation !== Occupation.CHILD && (
    npc.faction === Faction.CITIZEN ||
    npc.occupation === Occupation.HOUSEWIFE ||
    npc.occupation === Occupation.DIRECTOR ||
    npc.occupation === Occupation.TRAVELER
  );
}

function isPlotNpcPostUnlocked(npc: Entity, quests: readonly { plotStepIndex?: number; done?: boolean }[] | undefined): boolean {
  const plotId = npc.plotNpcId;
  if (!plotId || !quests) return false;
  let hasStep = false;
  for (let i = 0; i < PLOT_CHAIN.length; i++) {
    if (PLOT_CHAIN[i].giverNpcId !== plotId) continue;
    hasStep = true;
    if (!quests.some(q => q.plotStepIndex === i && q.done)) return false;
  }
  return hasStep;
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
  if (snapshot.roomMemorySeverity >= 3 && (snapshot.hasRoomMemoryTheft || snapshot.hasRoomMemoryCombat)) {
    return pickContext(snapshot.hasRoomMemoryTheft ? ROOM_MEMORY_THEFT_LINES : ROOM_MEMORY_COMBAT_LINES, memory);
  }
  if (snapshot.roomMemorySeverity >= 3 && snapshot.hasRoomMemoryRepair) return pickContext(ROOM_MEMORY_REPAIR_LINES, memory);
  if (snapshot.roomMemorySeverity >= 3 && snapshot.hasRoomMemoryHelp) return pickContext(ROOM_MEMORY_HELP_LINES, memory);
  if (snapshot.roomMemorySeverity >= 3 && snapshot.hasRoomMemorySamosbor) return pickContext(ROOM_MEMORY_SAMOSBOR_LINES, memory);
  if (snapshot.hasRecentPlayerTheft) return pickContext(CONTEXT_STOLEN_GOODS_LINES, memory);
  if (snapshot.hasRecentProductionShortage && Math.random() < 0.55) return pickContext(CONTEXT_PRODUCTION_SHORTAGE_LINES, memory);
  if (snapshot.hasRecentProductionOutput && Math.random() < 0.45) return pickContext(CONTEXT_PRODUCTION_OUTPUT_LINES, memory);
  if (snapshot.hasRecentLiftAnomaly) return pickContext(floorPool(CONTEXT_LIFT_ANOMALY_FLOOR_LINES, snapshot.floor, CONTEXT_LIFT_ANOMALY_LINES), memory);
  if (snapshot.hasRecentFactionClash) return pickContext(factionPool(snapshot, CONTEXT_FACTION_EVENT_FACTION_LINES, CONTEXT_FACTION_EVENT_LINES), memory);
  if (snapshot.hasRecentMonsterKill) return pickContext(floorPool(CONTEXT_MONSTER_KILL_FLOOR_LINES, snapshot.floor, CONTEXT_MONSTER_KILL_LINES), memory);
  if (snapshot.roomType === RoomType.MEDICAL && Math.random() < 0.55) return pickContext(MEDICAL_ROOM_LINES, memory);
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
