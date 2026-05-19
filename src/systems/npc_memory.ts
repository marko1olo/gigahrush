/* ── Bounded module-level NPC memory store ────────────────────── */

import { Faction, type Entity, type FloorLevel, type MonsterKind } from '../core/types';

export type NpcObservedFactKind = 'theft' | 'samosbor' | 'monster_kill' | 'contract' | 'faction_event';

export interface NpcObservedFact {
  eventId: number;
  kind: NpcObservedFactKind;
  observedAt: number;
  expiresAt: number;
  score: number;
  tags: string[];
}

export interface NpcMemoryEventLike {
  id?: number;
  type?: string;
  time?: number;
  severity?: number;
  privacy?: string;
  tags?: readonly string[];
  actorId?: number;
  actorFaction?: Faction;
  targetId?: number;
  data?: Record<string, unknown>;
}

export interface NpcMemory {
  entityId: number;
  lastSeenPlayerAt: number;
  helpedByPlayer: number;
  hurtByPlayer: number;
  knownRumorIds: string[];
  fear: number;
  trustPlayer: number;
  lastSpokeAt: number;
  lastRumorAt: number;
  lastContextAt: number;
  lastBarkAt: number;
  lastMemoryTickMinute: number;
  lastRumorEventId: number;
  lastEventRumorId: string;
  lastEventRumorAt: number;
  lastTouchedAt: number;
  observedFacts: NpcObservedFact[];
}

export interface RecentRumorLead {
  rumorId: string;
  text: string;
  heardAt: number;
  expiresAt: number;
  floor?: FloorLevel;
  roomName?: string;
  itemId?: string;
  monsterKind?: MonsterKind;
}

const MAX_NPC_MEMORIES = 1536;
const MAX_RUMORS_PER_NPC = 12;
const MAX_OBSERVED_FACTS_PER_NPC = 8;
const MEMORY_TICK_MINUTES = 4;
const RECENT_RUMOR_LEAD_TTL_S = 360;

const memories = new Map<number, NpcMemory>();
let recentRumorLead: RecentRumorLead | undefined;

export function rememberRecentRumorLead(input: Omit<RecentRumorLead, 'expiresAt'>): void {
  recentRumorLead = {
    ...input,
    expiresAt: input.heardAt + RECENT_RUMOR_LEAD_TTL_S,
  };
}

export function getRecentRumorLead(now: number): RecentRumorLead | undefined {
  if (!recentRumorLead) return undefined;
  if (now > recentRumorLead.expiresAt) {
    recentRumorLead = undefined;
    return undefined;
  }
  return recentRumorLead;
}

export function getNpcMemory(npc: Entity, now = 0): NpcMemory {
  let memory = memories.get(npc.id);
  if (!memory) {
    memory = {
      entityId: npc.id,
      lastSeenPlayerAt: -Infinity,
      helpedByPlayer: 0,
      hurtByPlayer: 0,
      knownRumorIds: [],
      fear: 0,
      trustPlayer: 0,
      lastSpokeAt: -Infinity,
      lastRumorAt: -Infinity,
      lastContextAt: -Infinity,
      lastBarkAt: -Infinity,
      lastMemoryTickMinute: -999999,
      lastRumorEventId: -1,
      lastEventRumorId: '',
      lastEventRumorAt: -Infinity,
      lastTouchedAt: now,
      observedFacts: [],
    };
    memories.set(npc.id, memory);
    pruneMemoryStore();
  }
  memory.lastTouchedAt = now;
  return memory;
}

export function markNpcSpokenTo(npc: Entity, now: number): NpcMemory {
  const memory = getNpcMemory(npc, now);
  memory.lastSpokeAt = now;
  memory.lastSeenPlayerAt = now;
  return memory;
}

export function notePlayerHelped(npc: Entity, now: number, amount = 1): void {
  const memory = getNpcMemory(npc, now);
  applyPlayerHelped(memory, amount);
}

export function notePlayerHurt(npc: Entity, now: number, amount = 1): void {
  const memory = getNpcMemory(npc, now);
  applyPlayerHurt(memory, amount);
}

export function notePlayerTheftWitnessed(npc: Entity, now: number, amount = 1): void {
  const memory = getNpcMemory(npc, now);
  applyPlayerTheftWitnessed(memory, amount);
  memory.lastSeenPlayerAt = now;
}

export function notePlayerTheftAudited(npc: Entity, now: number, amount = 1): void {
  const memory = getNpcMemory(npc, now);
  applyPlayerTheftAudited(memory, amount);
}

export function noteObservedEventFact(npc: Entity, event: NpcMemoryEventLike, now: number): boolean {
  const kind = observedFactKind(event);
  if (!kind) return false;
  const memory = getNpcMemory(npc, now);
  trimObservedFacts(memory, now);
  const eventId = typeof event.id === 'number' ? event.id : syntheticObservedEventId(event, now);
  if (memory.observedFacts.some(fact => fact.eventId === eventId)) return true;
  memory.observedFacts.push({
    eventId,
    kind,
    observedAt: now,
    expiresAt: now + observedFactTtl(kind),
    score: observedFactScore(event),
    tags: observedFactTags(event, kind),
  });
  if (memory.observedFacts.length > MAX_OBSERVED_FACTS_PER_NPC) {
    memory.observedFacts.splice(0, memory.observedFacts.length - MAX_OBSERVED_FACTS_PER_NPC);
  }
  applyObservedFactReaction(memory, event, kind, now);
  return true;
}

export function rememberRumor(npc: Entity, rumorId: string, now: number): boolean {
  return storeRumor(npc, rumorId, now, true);
}

export function learnRumor(npc: Entity, rumorId: string, now: number): boolean {
  return storeRumor(npc, rumorId, now, false);
}

export function flagEventRumor(npc: Entity, rumorId: string, eventId: number, now: number): boolean {
  const memory = getNpcMemory(npc, now);
  if (eventId <= memory.lastRumorEventId) return false;
  memory.lastRumorEventId = eventId;
  memory.lastEventRumorId = rumorId;
  memory.lastEventRumorAt = now;
  return learnRumor(npc, rumorId, now);
}

function storeRumor(npc: Entity, rumorId: string, now: number, markSpoken: boolean): boolean {
  const memory = getNpcMemory(npc, now);
  if (memory.knownRumorIds.includes(rumorId)) return false;
  memory.knownRumorIds.push(rumorId);
  if (memory.knownRumorIds.length > MAX_RUMORS_PER_NPC) {
    memory.knownRumorIds.splice(0, memory.knownRumorIds.length - MAX_RUMORS_PER_NPC);
  }
  if (markSpoken) memory.lastRumorAt = now;
  return true;
}

export function trimNpcMemory(npc: Entity, now: number): void {
  const memory = getNpcMemory(npc, now);
  if (memory.knownRumorIds.length > MAX_RUMORS_PER_NPC) {
    memory.knownRumorIds.splice(0, memory.knownRumorIds.length - MAX_RUMORS_PER_NPC);
  }
  trimObservedFacts(memory, now);
  memory.fear = clamp(memory.fear - 1, 0, 100);
  if (memory.trustPlayer > 0) memory.trustPlayer--;
  else if (memory.trustPlayer < 0) memory.trustPlayer++;
}

export function tickNpcMemoryLowFrequency(npc: Entity, now: number, totalMinutes: number, samosborActive: boolean): boolean {
  const memory = getNpcMemory(npc, now);
  const stagger = npc.id % MEMORY_TICK_MINUTES;
  if (totalMinutes - memory.lastMemoryTickMinute < MEMORY_TICK_MINUTES) return false;
  if ((totalMinutes | 0) % MEMORY_TICK_MINUTES !== stagger) return false;

  memory.lastMemoryTickMinute = totalMinutes;
  if (samosborActive) memory.fear = clamp(memory.fear + 4, 0, 100);
  if (npc.hp !== undefined && npc.maxHp !== undefined && npc.hp < npc.maxHp * 0.5) {
    memory.fear = clamp(memory.fear + 3, 0, 100);
  }
  trimNpcMemory(npc, now);
  return true;
}

export function getNpcMemoryCount(): number {
  return memories.size;
}

function pruneMemoryStore(): void {
  if (memories.size <= MAX_NPC_MEMORIES) return;
  let oldestId = -1;
  let oldestTouch = Infinity;
  for (const [id, memory] of memories) {
    if (memory.lastTouchedAt < oldestTouch) {
      oldestTouch = memory.lastTouchedAt;
      oldestId = id;
    }
  }
  if (oldestId >= 0) memories.delete(oldestId);
}

function applyPlayerHelped(memory: NpcMemory, amount: number): void {
  memory.helpedByPlayer = Math.min(999, memory.helpedByPlayer + amount);
  memory.trustPlayer = clamp(memory.trustPlayer + 8 * amount, -100, 100);
  memory.fear = Math.max(0, memory.fear - 3 * amount);
}

function applyPlayerHurt(memory: NpcMemory, amount: number): void {
  memory.hurtByPlayer = Math.min(999, memory.hurtByPlayer + amount);
  memory.trustPlayer = clamp(memory.trustPlayer - 18 * amount, -100, 100);
  memory.fear = clamp(memory.fear + 15 * amount, 0, 100);
}

function applyPlayerTheftWitnessed(memory: NpcMemory, amount: number): void {
  memory.hurtByPlayer = Math.min(999, memory.hurtByPlayer + amount);
  memory.trustPlayer = clamp(memory.trustPlayer - 14 * amount, -100, 100);
  memory.fear = clamp(memory.fear + 10 * amount, 0, 100);
}

function applyPlayerTheftAudited(memory: NpcMemory, amount: number): void {
  memory.hurtByPlayer = Math.min(999, memory.hurtByPlayer + amount);
  memory.trustPlayer = clamp(memory.trustPlayer - 8 * amount, -100, 100);
  memory.fear = clamp(memory.fear + 5 * amount, 0, 100);
}

function observedFactKind(event: NpcMemoryEventLike): NpcObservedFactKind | undefined {
  const type = event.type ?? '';
  const tags = event.tags ?? [];
  if (type === 'item_stolen' || tags.includes('theft')) return 'theft';
  if (type === 'contract_created' || type === 'contract_completed' || type === 'contract_failed') return 'contract';
  if (type === 'player_kill_monster' || type === 'npc_kill_monster' || type === 'fog_boss_killed') return 'monster_kill';
  if (type.includes('samosbor') || tags.includes('samosbor')) return 'samosbor';
  if (type === 'faction_event' || type === 'faction_patrol_clash' || type === 'faction_relation_changed' || tags.includes('faction_event')) return 'faction_event';
  return undefined;
}

function observedFactTtl(kind: NpcObservedFactKind): number {
  switch (kind) {
    case 'theft': return 720;
    case 'contract': return 900;
    case 'monster_kill': return 600;
    case 'samosbor': return 900;
    case 'faction_event': return 720;
  }
}

function observedFactScore(event: NpcMemoryEventLike): number {
  return clamp((event.severity ?? 0) * 20, 1, 100);
}

function observedFactTags(event: NpcMemoryEventLike, kind: NpcObservedFactKind): string[] {
  const out: string[] = [kind];
  for (const tag of event.tags ?? []) {
    const clean = String(tag).slice(0, 32);
    if (clean && !out.includes(clean)) out.push(clean);
    if (out.length >= 8) break;
  }
  return out;
}

function syntheticObservedEventId(event: NpcMemoryEventLike, now: number): number {
  const typeHash = event.type ? hashString(event.type) : 0;
  return -Math.abs(((Math.floor(now * 10) & 0xfffff) << 8) ^ typeHash ^ ((event.targetId ?? 0) << 3));
}

function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = ((h << 5) - h + input.charCodeAt(i)) | 0;
  return h;
}

function applyObservedFactReaction(memory: NpcMemory, event: NpcMemoryEventLike, kind: NpcObservedFactKind, now: number): void {
  const type = event.type ?? '';
  switch (kind) {
    case 'theft':
      if (event.privacy === 'witnessed' || event.tags?.includes('witnessed')) {
        applyPlayerTheftWitnessed(memory, 1);
        memory.lastSeenPlayerAt = now;
      } else {
        applyPlayerTheftAudited(memory, 1);
      }
      return;
    case 'contract':
      if (type === 'contract_completed') applyPlayerHelped(memory, 1);
      else if (type === 'contract_failed') applyPlayerHurt(memory, 1);
      else memory.fear = clamp(memory.fear + 1, 0, 100);
      return;
    case 'monster_kill':
      if (type === 'player_kill_monster' || type === 'fog_boss_killed' || event.actorFaction === Faction.PLAYER || event.actorId === 0) {
        applyPlayerHelped(memory, 1);
        memory.fear = clamp(memory.fear + 3, 0, 100);
      } else {
        memory.fear = clamp(memory.fear + 5, 0, 100);
      }
      return;
    case 'samosbor':
      memory.fear = clamp(memory.fear + (type === 'samosbor_ended' ? 8 : 12), 0, 100);
      return;
    case 'faction_event':
      memory.fear = clamp(memory.fear + ((event.severity ?? 0) >= 4 ? 8 : 5), 0, 100);
      return;
  }
}

function trimObservedFacts(memory: NpcMemory, now: number): void {
  for (let i = memory.observedFacts.length - 1; i >= 0; i--) {
    if (now > memory.observedFacts[i].expiresAt) memory.observedFacts.splice(i, 1);
  }
  if (memory.observedFacts.length > MAX_OBSERVED_FACTS_PER_NPC) {
    memory.observedFacts.splice(0, memory.observedFacts.length - MAX_OBSERVED_FACTS_PER_NPC);
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
