/* Bounded pure snapshots for future AI behavior telemetry. */

import type { AIGoal, MonsterKind } from '../../core/types';

export const AI_BEHAVIOR_DEBUG_TRACE_CAP = 300;
export const AI_BEHAVIOR_DEBUG_TOP_SCORE_CAP = 8;
export const AI_BEHAVIOR_DEBUG_TAG_CAP = 6;
export const AI_BEHAVIOR_DEBUG_TEXT_CAP = 96;

const SCORE_LIMIT = 1_000_000;

export type AiBehaviorActorKind = 'player' | 'npc' | 'monster';

export type AiBehaviorIntentId =
  | 'safety'
  | 'combat'
  | 'flee'
  | 'toilet'
  | 'drink'
  | 'eat'
  | 'sleep'
  | 'work'
  | 'heal'
  | 'social'
  | 'patrol'
  | 'loot'
  | 'repair'
  | 'escort'
  | 'wander';

export type AiMonsterStimulusId =
  | 'sight'
  | 'damage'
  | 'noise'
  | 'bait'
  | 'light'
  | 'water'
  | 'door'
  | 'corpse'
  | 'territory'
  | 'samosbor'
  | 'none';

export type AiSamosborDecisionId =
  | 'seek_shelter'
  | 'hold_shelter'
  | 'defend'
  | 'escort'
  | 'panic'
  | 'freeze'
  | 'exploit'
  | 'ignore';

export interface AiBehaviorDebugPoint {
  readonly x: number;
  readonly y: number;
}

export interface AiBehaviorDebugBaseInput {
  readonly actorId: number;
  readonly actorKind?: AiBehaviorActorKind;
  readonly x?: number;
  readonly y?: number;
  readonly roomId?: number;
  readonly zoneId?: number;
  readonly floorKey?: string;
  readonly tags?: readonly string[];
}

export interface AiIntentScoreInput {
  readonly intentId: AiBehaviorIntentId | string;
  readonly score: number;
  readonly reason?: string;
}

export interface AiIntentScore {
  readonly intentId: string;
  readonly score: number;
  readonly reason?: string;
}

export interface AiIntentDebugInput extends AiBehaviorDebugBaseInput {
  readonly intentId: AiBehaviorIntentId | string;
  readonly score: number;
  readonly previousIntentId?: AiBehaviorIntentId | string;
  readonly goal?: AIGoal;
  readonly targetRoomId?: number;
  readonly targetCell?: number;
  readonly nextDecisionAt?: number;
  readonly topScores?: readonly AiIntentScoreInput[];
}

export interface AiMonsterDebugInput extends AiBehaviorDebugBaseInput {
  readonly monsterKind?: MonsterKind;
  readonly goal?: AIGoal;
  readonly stage?: number;
  readonly stimulus?: AiMonsterStimulusId | string;
  readonly combatTargetId?: number;
  readonly homeRoomId?: number;
  readonly targetCell?: number;
  readonly cooldown?: number;
}

export interface AiSamosborDebugInput extends AiBehaviorDebugBaseInput {
  readonly active: boolean;
  readonly decision: AiSamosborDecisionId | string;
  readonly pressure: number;
  readonly shelterRoomId?: number;
  readonly shelterScore?: number;
  readonly targetCell?: number;
  readonly secondsLeft?: number;
}

interface AiBehaviorDebugBase {
  readonly actorId: number;
  readonly actorKind?: AiBehaviorActorKind;
  readonly point?: AiBehaviorDebugPoint;
  readonly roomId?: number;
  readonly zoneId?: number;
  readonly floorKey?: string;
  readonly tags: readonly string[];
}

export interface AiIntentDebugSample extends AiBehaviorDebugBase {
  readonly kind: 'intent';
  readonly intentId: string;
  readonly score: number;
  readonly previousIntentId?: string;
  readonly goal?: AIGoal;
  readonly targetRoomId?: number;
  readonly targetCell?: number;
  readonly nextDecisionAt?: number;
  readonly topScores: readonly AiIntentScore[];
}

export interface AiMonsterDebugSample extends AiBehaviorDebugBase {
  readonly kind: 'monster';
  readonly monsterKind?: MonsterKind;
  readonly goal?: AIGoal;
  readonly stage?: number;
  readonly stimulus: string;
  readonly combatTargetId?: number;
  readonly homeRoomId?: number;
  readonly targetCell?: number;
  readonly cooldown?: number;
}

export interface AiSamosborDebugSample extends AiBehaviorDebugBase {
  readonly kind: 'samosbor';
  readonly active: boolean;
  readonly decision: string;
  readonly pressure: number;
  readonly shelterRoomId?: number;
  readonly shelterScore?: number;
  readonly targetCell?: number;
  readonly secondsLeft?: number;
}

export type AiBehaviorDebugSample =
  | AiIntentDebugSample
  | AiMonsterDebugSample
  | AiSamosborDebugSample;

export interface AiBehaviorDebugTraceEntry {
  readonly frame: number;
  readonly time: number;
  readonly sample: AiBehaviorDebugSample;
}

export interface AiBehaviorDebugTraceState {
  readonly entries: readonly AiBehaviorDebugTraceEntry[];
  readonly dropped: number;
}

export interface AiBehaviorDebugSnapshot extends AiBehaviorDebugTraceState {
  readonly cap: number;
  readonly counts: {
    readonly intent: number;
    readonly monster: number;
    readonly samosbor: number;
  };
}

export function makeAiIntentDebugSample(input: AiIntentDebugInput): AiIntentDebugSample {
  return {
    ...baseSample(input),
    kind: 'intent',
    intentId: cleanText(input.intentId, 'unknown'),
    score: clampFinite(input.score, -SCORE_LIMIT, SCORE_LIMIT, 0),
    previousIntentId: cleanOptionalText(input.previousIntentId),
    goal: cleanOptionalInt(input.goal),
    targetRoomId: cleanOptionalInt(input.targetRoomId),
    targetCell: cleanOptionalInt(input.targetCell),
    nextDecisionAt: cleanOptionalNumber(input.nextDecisionAt),
    topScores: cleanIntentScores(input.topScores),
  };
}

export function makeAiMonsterDebugSample(input: AiMonsterDebugInput): AiMonsterDebugSample {
  return {
    ...baseSample(input),
    kind: 'monster',
    monsterKind: cleanOptionalInt(input.monsterKind) as MonsterKind | undefined,
    goal: cleanOptionalInt(input.goal),
    stage: cleanOptionalInt(input.stage),
    stimulus: cleanText(input.stimulus ?? 'none', 'none'),
    combatTargetId: cleanOptionalInt(input.combatTargetId),
    homeRoomId: cleanOptionalInt(input.homeRoomId),
    targetCell: cleanOptionalInt(input.targetCell),
    cooldown: cleanOptionalNumber(input.cooldown),
  };
}

export function makeAiSamosborDebugSample(input: AiSamosborDebugInput): AiSamosborDebugSample {
  return {
    ...baseSample(input),
    kind: 'samosbor',
    active: input.active === true,
    decision: cleanText(input.decision, 'ignore'),
    pressure: clampFinite(input.pressure, 0, 1, 0),
    shelterRoomId: cleanOptionalInt(input.shelterRoomId),
    shelterScore: cleanOptionalNumber(input.shelterScore),
    targetCell: cleanOptionalInt(input.targetCell),
    secondsLeft: cleanOptionalNumber(input.secondsLeft),
  };
}

export function makeAiBehaviorTraceEntry(
  frame: number,
  time: number,
  sample: AiBehaviorDebugSample,
): AiBehaviorDebugTraceEntry {
  return {
    frame: cleanInt(frame, 0),
    time: cleanNumber(time, 0),
    sample: copyAiBehaviorDebugSample(sample),
  };
}

export function appendAiBehaviorTrace(
  state: AiBehaviorDebugTraceState | undefined,
  entry: AiBehaviorDebugTraceEntry,
  cap = AI_BEHAVIOR_DEBUG_TRACE_CAP,
): AiBehaviorDebugTraceState {
  const limit = normalizeTraceCap(cap);
  const source = state?.entries ?? [];
  const dropped = state?.dropped ?? 0;
  const entries = [...source, makeAiBehaviorTraceEntry(entry.frame, entry.time, entry.sample)];
  if (entries.length <= limit) return { entries, dropped };
  const overflow = entries.length - limit;
  return {
    entries: limit > 0 ? entries.slice(overflow) : [],
    dropped: dropped + overflow,
  };
}

export function buildAiBehaviorDebugSnapshot(
  state: AiBehaviorDebugTraceState | undefined,
  cap = AI_BEHAVIOR_DEBUG_TRACE_CAP,
): AiBehaviorDebugSnapshot {
  const limit = normalizeTraceCap(cap);
  const source = state?.entries ?? [];
  const overflow = Math.max(0, source.length - limit);
  const entries = overflow > 0 ? source.slice(overflow).map(copyTraceEntry) : source.map(copyTraceEntry);
  const counts = { intent: 0, monster: 0, samosbor: 0 };
  for (const entry of entries) counts[entry.sample.kind]++;
  return {
    cap: limit,
    entries,
    dropped: (state?.dropped ?? 0) + overflow,
    counts,
  };
}

function baseSample(input: AiBehaviorDebugBaseInput): AiBehaviorDebugBase {
  const x = cleanOptionalNumber(input.x);
  const y = cleanOptionalNumber(input.y);
  return {
    actorId: cleanInt(input.actorId, -1),
    actorKind: input.actorKind,
    point: x === undefined || y === undefined ? undefined : { x, y },
    roomId: cleanOptionalInt(input.roomId),
    zoneId: cleanOptionalInt(input.zoneId),
    floorKey: cleanOptionalText(input.floorKey),
    tags: cleanTags(input.tags),
  };
}

function cleanIntentScores(scores: readonly AiIntentScoreInput[] | undefined): readonly AiIntentScore[] {
  if (!scores || scores.length === 0) return [];
  const out: AiIntentScore[] = [];
  for (const score of scores) {
    out.push({
      intentId: cleanText(score.intentId, 'unknown'),
      score: clampFinite(score.score, -SCORE_LIMIT, SCORE_LIMIT, 0),
      reason: cleanOptionalText(score.reason),
    });
    if (out.length >= AI_BEHAVIOR_DEBUG_TOP_SCORE_CAP) break;
  }
  return out;
}

function copyTraceEntry(entry: AiBehaviorDebugTraceEntry): AiBehaviorDebugTraceEntry {
  return makeAiBehaviorTraceEntry(entry.frame, entry.time, entry.sample);
}

function copyAiBehaviorDebugSample(sample: AiBehaviorDebugSample): AiBehaviorDebugSample {
  switch (sample.kind) {
    case 'intent':
      return makeAiIntentDebugSample(sample);
    case 'monster':
      return makeAiMonsterDebugSample(sample);
    case 'samosbor':
      return makeAiSamosborDebugSample(sample);
  }
}

function normalizeTraceCap(cap: number): number {
  return Math.max(0, Math.min(AI_BEHAVIOR_DEBUG_TRACE_CAP, cleanInt(cap, AI_BEHAVIOR_DEBUG_TRACE_CAP)));
}

function cleanTags(tags: readonly string[] | undefined): readonly string[] {
  if (!tags || tags.length === 0) return [];
  const out: string[] = [];
  for (const tag of tags) {
    const clean = cleanOptionalText(tag);
    if (clean === undefined) continue;
    out.push(clean);
    if (out.length >= AI_BEHAVIOR_DEBUG_TAG_CAP) break;
  }
  return out;
}

function cleanOptionalText(value: string | number | undefined): string | undefined {
  if (value === undefined) return undefined;
  const clean = cleanText(value, '');
  return clean.length > 0 ? clean : undefined;
}

function cleanText(value: string | number, fallback: string): string {
  const raw = `${value}`.trim();
  const text = raw.length > 0 ? raw : fallback;
  return text.length > AI_BEHAVIOR_DEBUG_TEXT_CAP ? text.slice(0, AI_BEHAVIOR_DEBUG_TEXT_CAP) : text;
}

function cleanOptionalNumber(value: number | undefined): number | undefined {
  return value === undefined || !Number.isFinite(value) ? undefined : value;
}

function cleanNumber(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function cleanOptionalInt(value: number | undefined): number | undefined {
  return value === undefined || !Number.isFinite(value) ? undefined : Math.trunc(value);
}

function cleanInt(value: number, fallback: number): number {
  return Number.isFinite(value) ? Math.trunc(value) : fallback;
}

function clampFinite(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, value));
}
