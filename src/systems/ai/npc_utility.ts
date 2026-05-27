/* ── NPC utility selector core: deterministic live-intent scoring ─ */

import {
  type Entity,
  Faction,
  type Needs,
  Occupation,
  type Room,
  RoomType,
} from '../../core/types';

export const NPC_UTILITY_INTENTS = [
  'safety',
  'combat',
  'flee',
  'toilet',
  'drink',
  'eat',
  'sleep',
  'work',
  'heal',
  'social',
  'patrol',
  'wander',
] as const;

export type NpcUtilityIntentId = typeof NPC_UTILITY_INTENTS[number];

export const NPC_UTILITY_INTENT_INDEX = {
  safety: 0,
  combat: 1,
  flee: 2,
  toilet: 3,
  drink: 4,
  eat: 5,
  sleep: 6,
  work: 7,
  heal: 8,
  social: 9,
  patrol: 10,
  wander: 11,
} as const satisfies Record<NpcUtilityIntentId, number>;

export const NPC_UTILITY_INTENT_COUNT = NPC_UTILITY_INTENTS.length;

export type NpcUtilityScoreBuffer = Float32Array | number[];

export interface NpcUtilityIdentity {
  entityId?: number;
  alifeId?: number;
  persistentNpcId?: string;
  plotNpcId?: string;
  routineSeed?: number;
}

export interface NpcUtilityThreatSnapshot {
  danger?: number;
  visibleHostiles?: number;
  hostilePower?: number;
  allyPower?: number;
  distance?: number;
  gunfire?: number;
  monster?: number;
  fire?: number;
  fog?: number;
  cornered?: boolean;
  inShelter?: boolean;
  strongerHostile?: boolean;
}

export interface NpcUtilityRoleSnapshot {
  faction?: Faction;
  occupation?: Occupation;
  duty?: number;
  sociability?: number;
  riskTolerance?: number;
  greed?: number;
  panicBias?: number;
  armed?: boolean;
  hasRangedWeapon?: boolean;
  orderedCombat?: boolean;
  isTraveler?: boolean;
}

export interface NpcUtilityTargetPressure {
  available?: boolean;
  distance?: number;
  crowd?: number;
  danger?: number;
  factionPenalty?: number;
}

export interface NpcUtilityScoreContext {
  identity?: NpcUtilityIdentity;
  minuteOfDay?: number;
  totalMinutes?: number;
  samosborActive?: boolean;
  samosborWarning?: boolean;
  currentIntent?: NpcUtilityIntentId;
  currentIntentStickiness?: number;
  needs?: Partial<Needs>;
  hp?: number;
  maxHp?: number;
  threat?: NpcUtilityThreatSnapshot;
  role?: NpcUtilityRoleSnapshot;
  local?: Partial<Record<NpcUtilityIntentId, number>>;
  target?: Partial<Record<NpcUtilityIntentId, NpcUtilityTargetPressure>>;
}

export interface NpcUtilitySelectionOptions {
  switchMargin?: number;
  emergencyMargin?: number;
  emergencyScore?: number;
  currentScore?: number;
}

export interface NpcUtilitySelection {
  intent: NpcUtilityIntentId;
  score: number;
  previousIntent?: NpcUtilityIntentId;
  previousScore: number;
  switched: boolean;
  margin: number;
  emergency: boolean;
}

export interface NpcUtilityTargetCandidate {
  id: number | string;
  roomId?: number;
  roomType?: RoomType;
  type?: RoomType | string;
  x?: number;
  y?: number;
  utility?: number;
  distance?: number;
  crowd?: number;
  capacity?: number;
  danger?: number;
  factionPenalty?: number;
}

export interface NpcUtilityTargetPreferenceContext {
  identity?: NpcUtilityIdentity;
  intent: NpcUtilityIntentId;
  occupation?: Occupation;
  faction?: Faction;
  currentTargetId?: number | string;
  previousTargetId?: number | string;
  distanceScale?: number;
  stickiness?: number;
  stableJitter?: number;
}

const HASH_OFFSET = 2166136261 >>> 0;
const HASH_PRIME = 16777619;
const DAY_MINUTES = 1440;
const DEFAULT_SWITCH_MARGIN = 8;
const DEFAULT_EMERGENCY_MARGIN = 1;
const DEFAULT_EMERGENCY_SCORE = 58;
const EMERGENCY_INTENTS: ReadonlySet<NpcUtilityIntentId> = new Set(['safety', 'flee', 'combat', 'heal']);

export function createNpcUtilityScoreBuffer(): Float32Array {
  return new Float32Array(NPC_UTILITY_INTENT_COUNT);
}

export function npcUtilityIdentityFromEntity(entity: Pick<Entity, 'id' | 'alifeId' | 'persistentNpcId' | 'plotNpcId'>): NpcUtilityIdentity {
  return {
    entityId: entity.id,
    alifeId: entity.alifeId,
    persistentNpcId: entity.persistentNpcId,
    plotNpcId: entity.plotNpcId,
  };
}

export function npcUtilityIdentitySeed(identity?: NpcUtilityIdentity): number {
  if (!identity) return 0x6d2b79f5;
  if (isFiniteNumber(identity.routineSeed)) return mix32(identity.routineSeed);
  if (isFiniteNumber(identity.alifeId)) return mix32(0xa11fe000 ^ identity.alifeId);
  if (identity.persistentNpcId) return hashString32(`p:${identity.persistentNpcId}`);
  if (identity.plotNpcId) return hashString32(`plot:${identity.plotNpcId}`);
  if (isFiniteNumber(identity.entityId)) return mix32(0xe17a0000 ^ identity.entityId);
  return 0x6d2b79f5;
}

export function npcUtilityChannelSeed(identityOrSeed: NpcUtilityIdentity | number | undefined, channel: string | number): number {
  const seed = typeof identityOrSeed === 'number' ? mix32(identityOrSeed) : npcUtilityIdentitySeed(identityOrSeed);
  if (typeof channel === 'number') return mix32(seed ^ channel);
  return hashString32(channel, seed ^ 0x9e3779b9);
}

export function npcUtilityJitter01(identityOrSeed: NpcUtilityIdentity | number | undefined, channel: string | number): number {
  return ((npcUtilityChannelSeed(identityOrSeed, channel) >>> 8) & 0x00ffffff) / 0x01000000;
}

export function npcUtilityJitterSigned(identityOrSeed: NpcUtilityIdentity | number | undefined, channel: string | number, amplitude = 1): number {
  return (npcUtilityJitter01(identityOrSeed, channel) * 2 - 1) * amplitude;
}

export function npcUtilityShiftOffsetMinutes(identity?: NpcUtilityIdentity, spanMinutes = 180): number {
  return Math.round(npcUtilityJitterSigned(identity, 'shift_offset', spanMinutes * 0.5));
}

export function npcUtilityRhythmBias(
  intent: NpcUtilityIntentId,
  minuteOfDay: number,
  identity?: NpcUtilityIdentity,
  scale = 12,
): number {
  const shifted = wrapMinute(minuteOfDay - npcUtilityShiftOffsetMinutes(identity));
  let phase = 0;
  switch (intent) {
    case 'toilet':
      phase = max3(minuteWindow01(shifted, 430, 170), minuteWindow01(shifted, 820, 130), minuteWindow01(shifted, 1260, 170));
      break;
    case 'drink':
      phase = max3(minuteWindow01(shifted, 500, 150), minuteWindow01(shifted, 780, 140), minuteWindow01(shifted, 1140, 170));
      break;
    case 'eat':
      phase = max3(minuteWindow01(shifted, 470, 130), minuteWindow01(shifted, 750, 130), minuteWindow01(shifted, 1140, 150));
      break;
    case 'sleep':
      phase = Math.max(minuteWindow01(shifted, 90, 330), minuteWindow01(shifted, 1410, 230));
      break;
    case 'work':
      phase = Math.max(minuteWindow01(shifted, 630, 270), minuteWindow01(shifted, 930, 240));
      break;
    case 'social':
      phase = Math.max(minuteWindow01(shifted, 760, 130), minuteWindow01(shifted, 1210, 260));
      break;
    case 'patrol':
      phase = Math.max(minuteWindow01(shifted, 650, 360), minuteWindow01(shifted, 1250, 300));
      break;
    case 'wander':
      phase = Math.max(minuteWindow01(shifted, 1050, 360), 0.35);
      break;
    case 'safety':
    case 'combat':
    case 'flee':
    case 'heal':
      phase = 0;
      break;
  }
  return phase * scale;
}

export function scoreNpcUtilities(context: NpcUtilityScoreContext, out: NpcUtilityScoreBuffer = createNpcUtilityScoreBuffer()): NpcUtilityScoreBuffer {
  const identity = context.identity;
  const minute = context.minuteOfDay ?? context.totalMinutes ?? 0;
  const needs = context.needs;
  const role = context.role;
  const threat = context.threat;
  const faction = role?.faction;
  const occupation = role?.occupation;
  const duty = unitTrait(role?.duty, defaultDuty(faction, occupation));
  const sociability = unitTrait(role?.sociability, defaultSociability(faction, occupation));
  const risk = unitTrait(role?.riskTolerance, defaultRiskTolerance(faction, occupation));
  const panic = unitTrait(role?.panicBias, defaultPanicBias(faction));
  const hpPressure = healthPressure(context.hp, context.maxHp);
  const threatPressure = computeThreatPressure(threat);
  const visibleHostilePressure = clamp01((threat?.visibleHostiles ?? 0) / 4);
  const closeThreatPressure = threat?.distance === undefined ? 0 : clamp01((18 - threat.distance) / 18);
  const hostilePower = positive(threat?.hostilePower);
  const allyPower = positive(threat?.allyPower);
  const strongerHostile = threat?.strongerHostile === true || hostilePower > allyPower + 0.15;
  const armed = role?.armed === true || role?.hasRangedWeapon === true;
  const toiletPressure = Math.max(highNeedPressure(needs?.pee), highNeedPressure(needs?.poo));
  const drinkPressure = lowNeedPressure(needs?.water);
  const eatPressure = lowNeedPressure(needs?.food);
  const sleepPressure = lowNeedPressure(needs?.sleep);
  const urgentNeed = Math.max(toiletPressure, drinkPressure, eatPressure, sleepPressure, hpPressure);
  const stickiness = context.currentIntentStickiness ?? 0;

  setScore(out, 'safety', clampScore(
    (context.samosborActive ? 72 : 0) +
    (context.samosborWarning ? 34 : 0) +
    threatPressure * 44 +
    unitish(threat?.fire) * 26 +
    unitish(threat?.fog) * 16 +
    localScore(context, 'safety') +
    currentStickiness(context, 'safety', stickiness) -
    targetPenalty(context, 'safety')
  ));

  setScore(out, 'combat', clampScore(
    visibleHostilePressure * 34 +
    closeThreatPressure * 12 +
    (armed ? 18 : -16) +
    (role?.orderedCombat ? 28 : 0) +
    (threat?.cornered ? 18 : 0) +
    risk * 22 +
    duty * 10 -
    hpPressure * 30 -
    panic * 12 -
    (strongerHostile ? 14 : 0) +
    localScore(context, 'combat') +
    currentStickiness(context, 'combat', stickiness) -
    targetPenalty(context, 'combat')
  ));

  setScore(out, 'flee', clampScore(
    visibleHostilePressure * 24 +
    threatPressure * 42 +
    unitish(threat?.monster) * 24 +
    unitish(threat?.fire) * 25 +
    hpPressure * 32 +
    (strongerHostile ? 18 : 0) +
    (1 - risk) * 15 +
    panic * 18 +
    (context.samosborActive ? 8 : 0) -
    (armed ? 5 : 0) +
    localScore(context, 'flee') +
    currentStickiness(context, 'flee', stickiness) -
    targetPenalty(context, 'flee')
  ));

  setScore(out, 'toilet', clampScore(
    toiletPressure * 92 +
    npcUtilityRhythmBias('toilet', minute, identity, 8) +
    localScore(context, 'toilet') +
    currentStickiness(context, 'toilet', stickiness) -
    threatPressure * 18 -
    targetPenalty(context, 'toilet')
  ));

  setScore(out, 'drink', clampScore(
    drinkPressure * 88 +
    npcUtilityRhythmBias('drink', minute, identity, 9) +
    localScore(context, 'drink') +
    currentStickiness(context, 'drink', stickiness) -
    threatPressure * 16 -
    targetPenalty(context, 'drink')
  ));

  setScore(out, 'eat', clampScore(
    eatPressure * 86 +
    npcUtilityRhythmBias('eat', minute, identity, 9) +
    localScore(context, 'eat') +
    currentStickiness(context, 'eat', stickiness) -
    threatPressure * 16 -
    targetPenalty(context, 'eat')
  ));

  setScore(out, 'sleep', clampScore(
    sleepPressure * 76 +
    npcUtilityRhythmBias('sleep', minute, identity, 17) +
    (occupation === Occupation.CHILD ? 7 : 0) +
    localScore(context, 'sleep') +
    currentStickiness(context, 'sleep', stickiness) -
    threatPressure * 30 -
    (context.samosborActive ? 18 : 0) -
    targetPenalty(context, 'sleep')
  ));

  setScore(out, 'work', clampScore(
    duty * 34 +
    occupationWorkDrive(occupation) * 18 +
    npcUtilityRhythmBias('work', minute, identity, 15) +
    localScore(context, 'work') +
    currentStickiness(context, 'work', stickiness) -
    urgentNeed * 30 -
    threatPressure * 42 -
    (context.samosborActive ? 45 : 0) -
    targetPenalty(context, 'work')
  ));

  setScore(out, 'heal', clampScore(
    hpPressure * 105 +
    (occupation === Occupation.DOCTOR && hpPressure < 0.01 ? 6 : 0) +
    localScore(context, 'heal') +
    currentStickiness(context, 'heal', stickiness) -
    threatPressure * 10 -
    targetPenalty(context, 'heal')
  ));

  setScore(out, 'social', clampScore(
    sociability * 29 +
    npcUtilityRhythmBias('social', minute, identity, 13) +
    localScore(context, 'social') +
    currentStickiness(context, 'social', stickiness) -
    urgentNeed * 15 -
    threatPressure * 34 -
    (context.samosborActive ? 25 : 0) -
    targetPenalty(context, 'social')
  ));

  setScore(out, 'patrol', clampScore(
    patrolDrive(faction, occupation) * 36 +
    duty * 18 +
    npcUtilityRhythmBias('patrol', minute, identity, 8) +
    threatPressure * 10 +
    localScore(context, 'patrol') +
    currentStickiness(context, 'patrol', stickiness) -
    urgentNeed * 18 -
    (context.samosborActive && faction !== Faction.LIQUIDATOR && faction !== Faction.CULTIST ? 24 : 0) -
    targetPenalty(context, 'patrol')
  ));

  setScore(out, 'wander', clampScore(
    9 +
    npcUtilityRhythmBias('wander', minute, identity, 5) +
    npcUtilityJitterSigned(identity, 'wander_score', 3) +
    (role?.isTraveler ? 19 : 0) +
    localScore(context, 'wander') +
    currentStickiness(context, 'wander', stickiness) -
    urgentNeed * 12 -
    threatPressure * 22 -
    targetPenalty(context, 'wander')
  ));

  addIdentityJitter(out, identity);
  return out;
}

export function getNpcUtilityScore(scores: NpcUtilityScoreBuffer, intent: NpcUtilityIntentId): number {
  return scores[NPC_UTILITY_INTENT_INDEX[intent]] ?? 0;
}

export function setNpcUtilityScore(scores: NpcUtilityScoreBuffer, intent: NpcUtilityIntentId, score: number): void {
  setScore(scores, intent, score);
}

export function bestNpcUtilityIntent(scores: NpcUtilityScoreBuffer): NpcUtilitySelection {
  let bestIndex = 0;
  let bestScore = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < NPC_UTILITY_INTENT_COUNT; i++) {
    const score = scores[i] ?? 0;
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }
  const intent = NPC_UTILITY_INTENTS[bestIndex];
  return {
    intent,
    score: bestScore,
    previousScore: Number.NEGATIVE_INFINITY,
    switched: true,
    margin: 0,
    emergency: isNpcUtilityEmergencyIntent(intent, bestScore),
  };
}

export function isNpcUtilityEmergencyIntent(intent: NpcUtilityIntentId, score = Infinity, threshold = DEFAULT_EMERGENCY_SCORE): boolean {
  return EMERGENCY_INTENTS.has(intent) && score >= threshold;
}

export function shouldSwitchNpcUtilityIntent(
  nextIntent: NpcUtilityIntentId,
  nextScore: number,
  currentIntent: NpcUtilityIntentId | undefined,
  currentScore: number,
  options: NpcUtilitySelectionOptions = {},
): boolean {
  if (!currentIntent) return true;
  if (nextIntent === currentIntent) return false;
  const emergencyScore = options.emergencyScore ?? DEFAULT_EMERGENCY_SCORE;
  const emergency = isNpcUtilityEmergencyIntent(nextIntent, nextScore, emergencyScore);
  if (emergency) return true;
  const margin = options.switchMargin ?? DEFAULT_SWITCH_MARGIN;
  return nextScore > currentScore + margin;
}

export function selectNpcUtilityIntent(
  scores: NpcUtilityScoreBuffer,
  currentIntent?: NpcUtilityIntentId,
  options: NpcUtilitySelectionOptions = {},
): NpcUtilitySelection {
  const best = bestNpcUtilityIntent(scores);
  if (!currentIntent || best.intent === currentIntent) {
    return {
      ...best,
      previousIntent: currentIntent,
      previousScore: currentIntent ? getNpcUtilityScore(scores, currentIntent) : Number.NEGATIVE_INFINITY,
      switched: !currentIntent,
    };
  }
  const previousScore = options.currentScore ?? getNpcUtilityScore(scores, currentIntent);
  const emergency = isNpcUtilityEmergencyIntent(best.intent, best.score, options.emergencyScore ?? DEFAULT_EMERGENCY_SCORE);
  const margin = emergency ? (options.emergencyMargin ?? DEFAULT_EMERGENCY_MARGIN) : (options.switchMargin ?? DEFAULT_SWITCH_MARGIN);
  const switched = emergency || best.score > previousScore + margin;
  return {
    intent: switched ? best.intent : currentIntent,
    score: switched ? best.score : previousScore,
    previousIntent: currentIntent,
    previousScore,
    switched,
    margin,
    emergency,
  };
}

export function npcUtilityWorkRoomTypeWeight(occupation: Occupation | undefined, roomType: RoomType): number {
  switch (occupation) {
    case Occupation.COOK:
      return roomType === RoomType.KITCHEN ? 34 : roomType === RoomType.STORAGE ? 10 : 0;
    case Occupation.DOCTOR:
      return roomType === RoomType.MEDICAL ? 36 : roomType === RoomType.OFFICE ? 8 : 0;
    case Occupation.LOCKSMITH:
    case Occupation.ELECTRICIAN:
    case Occupation.TURNER:
    case Occupation.MECHANIC:
      return roomType === RoomType.PRODUCTION ? 35 : roomType === RoomType.STORAGE ? 12 : 0;
    case Occupation.SECRETARY:
      return roomType === RoomType.OFFICE ? 34 : roomType === RoomType.COMMON ? 8 : 0;
    case Occupation.STOREKEEPER:
      return roomType === RoomType.STORAGE ? 34 : roomType === RoomType.PRODUCTION ? 8 : 0;
    case Occupation.SCIENTIST:
      return roomType === RoomType.OFFICE || roomType === RoomType.MEDICAL ? 26 : roomType === RoomType.PRODUCTION ? 10 : 0;
    case Occupation.DIRECTOR:
      return roomType === RoomType.OFFICE ? 28 : roomType === RoomType.COMMON ? 18 : 0;
    case Occupation.HOUSEWIFE:
      return roomType === RoomType.LIVING ? 23 : roomType === RoomType.KITCHEN ? 20 : 0;
    case Occupation.CHILD:
      return roomType === RoomType.LIVING ? 17 : roomType === RoomType.COMMON ? 15 : 0;
    case Occupation.ALCOHOLIC:
      return roomType === RoomType.SMOKING ? 24 : roomType === RoomType.COMMON || roomType === RoomType.KITCHEN ? 15 : 0;
    case Occupation.HUNTER:
    case Occupation.TRAVELER:
    case Occupation.PILGRIM:
      return roomType === RoomType.CORRIDOR ? 24 : roomType === RoomType.COMMON ? 15 : 0;
    case Occupation.PRIEST:
      return roomType === RoomType.HQ ? 25 : roomType === RoomType.COMMON ? 18 : 0;
    default:
      return roomType === RoomType.PRODUCTION ? 16 : roomType === RoomType.OFFICE ? 14 : 0;
  }
}

export function npcUtilityRoomTypeWeightForIntent(
  intent: NpcUtilityIntentId,
  roomType: RoomType | undefined,
  occupation?: Occupation,
): number {
  if (roomType === undefined) return 0;
  switch (intent) {
    case 'safety':
    case 'flee':
      return roomType === RoomType.LIVING ? 24 : roomType === RoomType.HQ ? 18 : roomType === RoomType.COMMON ? 8 : 0;
    case 'toilet':
      return roomType === RoomType.BATHROOM ? 38 : 0;
    case 'drink':
      return roomType === RoomType.KITCHEN ? 28 : roomType === RoomType.BATHROOM ? 14 : 0;
    case 'eat':
      return roomType === RoomType.KITCHEN ? 34 : roomType === RoomType.COMMON ? 8 : 0;
    case 'sleep':
      return roomType === RoomType.LIVING ? 34 : 0;
    case 'work':
      return npcUtilityWorkRoomTypeWeight(occupation, roomType);
    case 'heal':
      return roomType === RoomType.MEDICAL ? 40 : 0;
    case 'social':
      return roomType === RoomType.COMMON ? 24 : roomType === RoomType.SMOKING || roomType === RoomType.KITCHEN ? 17 : roomType === RoomType.HQ ? 10 : 0;
    case 'patrol':
      return roomType === RoomType.CORRIDOR ? 24 : roomType === RoomType.HQ ? 20 : roomType === RoomType.COMMON ? 12 : 0;
    case 'wander':
      return roomType === RoomType.CORRIDOR || roomType === RoomType.COMMON ? 9 : 0;
    case 'combat':
      return roomType === RoomType.CORRIDOR ? 8 : roomType === RoomType.HQ ? 10 : 0;
  }
}

export function scoreNpcUtilityTargetPreference(
  target: NpcUtilityTargetCandidate,
  context: NpcUtilityTargetPreferenceContext,
): number {
  const targetId = target.roomId ?? target.id;
  const roomType = target.roomType ?? (typeof target.type === 'number' ? target.type : undefined);
  const distanceScale = Math.max(1, context.distanceScale ?? 64);
  const stickiness = context.stickiness ?? 12;
  const stableJitter = context.stableJitter ?? 6;
  const distance = positive(target.distance);
  const capacity = positive(target.capacity);
  const crowd = capacity > 0 ? positive(target.crowd) / capacity : positive(target.crowd) * 0.12;
  const danger = unitish(target.danger);
  let score =
    positive(target.utility) +
    npcUtilityRoomTypeWeightForIntent(context.intent, roomType, context.occupation) +
    stableTargetJitter(context.identity, context.intent, targetId, stableJitter) -
    clamp01(distance / distanceScale) * 22 -
    clamp01(crowd) * 22 -
    danger * targetDangerWeight(context.intent) -
    positive(target.factionPenalty);

  if (targetId === context.currentTargetId) score += stickiness;
  else if (targetId === context.previousTargetId) score += stickiness * 0.45;
  if (context.faction === Faction.LIQUIDATOR && context.intent === 'patrol' && roomType === RoomType.CORRIDOR) score += 5;
  return score;
}

export function scoreNpcUtilityRoomPreference(room: Room, context: NpcUtilityTargetPreferenceContext): number {
  return scoreNpcUtilityTargetPreference({
    id: room.id,
    roomId: room.id,
    roomType: room.type,
    x: room.x + room.w * 0.5,
    y: room.y + room.h * 0.5,
  }, context);
}

export function chooseStableNpcUtilityTarget<T extends NpcUtilityTargetCandidate>(
  targets: readonly T[],
  context: NpcUtilityTargetPreferenceContext,
): T | undefined {
  let best: T | undefined;
  let bestScore = Number.NEGATIVE_INFINITY;
  let bestTie = Number.NEGATIVE_INFINITY;
  for (const target of targets) {
    const targetId = target.roomId ?? target.id;
    const score = scoreNpcUtilityTargetPreference(target, context);
    const tie = stableTargetJitter(context.identity, context.intent, targetId, 1);
    if (score > bestScore || (score === bestScore && tie > bestTie)) {
      best = target;
      bestScore = score;
      bestTie = tie;
    }
  }
  return best;
}

function addIdentityJitter(scores: NpcUtilityScoreBuffer, identity: NpcUtilityIdentity | undefined): void {
  for (const intent of NPC_UTILITY_INTENTS) {
    const index = NPC_UTILITY_INTENT_INDEX[intent];
    scores[index] = clampScore((scores[index] ?? 0) + npcUtilityJitterSigned(identity, `score:${intent}`, 2.5));
  }
}

function currentStickiness(context: NpcUtilityScoreContext, intent: NpcUtilityIntentId, amount: number): number {
  return context.currentIntent === intent ? amount : 0;
}

function setScore(scores: NpcUtilityScoreBuffer, intent: NpcUtilityIntentId, score: number): void {
  scores[NPC_UTILITY_INTENT_INDEX[intent]] = clampScore(score);
}

function localScore(context: NpcUtilityScoreContext, intent: NpcUtilityIntentId): number {
  return context.local?.[intent] ?? 0;
}

function targetPenalty(context: NpcUtilityScoreContext, intent: NpcUtilityIntentId): number {
  const target = context.target?.[intent];
  if (!target) return 0;
  return (target.available === false ? 36 : 0) +
    clamp01(positive(target.distance) / 96) * 24 +
    clamp01(positive(target.crowd) / 8) * 18 +
    unitish(target.danger) * targetDangerWeight(intent) +
    positive(target.factionPenalty);
}

function targetDangerWeight(intent: NpcUtilityIntentId): number {
  switch (intent) {
    case 'combat': return 8;
    case 'patrol': return 14;
    case 'safety':
    case 'flee': return 35;
    default: return 24;
  }
}

function stableTargetJitter(
  identity: NpcUtilityIdentity | undefined,
  intent: NpcUtilityIntentId,
  targetId: number | string,
  amplitude: number,
): number {
  return npcUtilityJitterSigned(identity, `target:${intent}:${String(targetId)}`, amplitude);
}

function computeThreatPressure(threat: NpcUtilityThreatSnapshot | undefined): number {
  if (!threat) return 0;
  return clamp01(
    Math.max(
      unitish(threat.danger),
      unitish(threat.monster),
      unitish(threat.gunfire) * 0.75,
      unitish(threat.fire),
      unitish(threat.fog) * 0.6,
      clamp01((threat.visibleHostiles ?? 0) / 3) * 0.85,
      threat.distance === undefined ? 0 : clamp01((16 - threat.distance) / 16),
    ) +
    (threat.cornered ? 0.15 : 0) +
    (threat.inShelter ? -0.18 : 0)
  );
}

function healthPressure(hp: number | undefined, maxHp: number | undefined): number {
  if (!isFiniteNumber(hp) || !isFiniteNumber(maxHp) || maxHp <= 0) return 0;
  return clamp01(1 - hp / maxHp);
}

function lowNeedPressure(value: number | undefined): number {
  if (!isFiniteNumber(value)) return 0;
  return smoothstep(0.18, 0.82, clamp01((72 - value) / 72));
}

function highNeedPressure(value: number | undefined): number {
  if (!isFiniteNumber(value)) return 0;
  return smoothstep(0.35, 0.9, clamp01(value / 100));
}

function occupationWorkDrive(occupation: Occupation | undefined): number {
  switch (occupation) {
    case Occupation.CHILD:
    case Occupation.TRAVELER:
    case Occupation.PILGRIM:
      return 0.25;
    case Occupation.ALCOHOLIC:
      return 0.35;
    case Occupation.HOUSEWIFE:
    case Occupation.HUNTER:
    case Occupation.PRIEST:
      return 0.55;
    case Occupation.DIRECTOR:
    case Occupation.SCIENTIST:
    case Occupation.DOCTOR:
      return 0.8;
    case Occupation.COOK:
    case Occupation.LOCKSMITH:
    case Occupation.SECRETARY:
    case Occupation.ELECTRICIAN:
    case Occupation.TURNER:
    case Occupation.MECHANIC:
    case Occupation.STOREKEEPER:
      return 0.72;
    default:
      return 0.5;
  }
}

function patrolDrive(faction: Faction | undefined, occupation: Occupation | undefined): number {
  if (occupation === Occupation.HUNTER) return 0.9;
  if (occupation === Occupation.PILGRIM || occupation === Occupation.PRIEST) return 0.55;
  if (faction === Faction.LIQUIDATOR) return 0.82;
  if (faction === Faction.CULTIST) return 0.58;
  if (faction === Faction.WILD) return 0.42;
  return 0.08;
}

function defaultDuty(faction: Faction | undefined, occupation: Occupation | undefined): number {
  if (faction === Faction.LIQUIDATOR) return 0.82;
  if (faction === Faction.SCIENTIST) return 0.74;
  if (faction === Faction.CULTIST) return 0.62;
  switch (occupation) {
    case Occupation.CHILD: return 0.15;
    case Occupation.ALCOHOLIC: return 0.22;
    case Occupation.TRAVELER:
    case Occupation.PILGRIM: return 0.3;
    case Occupation.DIRECTOR:
    case Occupation.DOCTOR:
    case Occupation.SCIENTIST: return 0.74;
    default: return 0.55;
  }
}

function defaultSociability(faction: Faction | undefined, occupation: Occupation | undefined): number {
  if (occupation === Occupation.CHILD || occupation === Occupation.ALCOHOLIC) return 0.72;
  if (occupation === Occupation.SECRETARY || occupation === Occupation.COOK || occupation === Occupation.HOUSEWIFE) return 0.62;
  if (faction === Faction.CULTIST) return 0.32;
  if (faction === Faction.WILD) return 0.25;
  return 0.48;
}

function defaultRiskTolerance(faction: Faction | undefined, occupation: Occupation | undefined): number {
  if (occupation === Occupation.HUNTER) return 0.78;
  if (faction === Faction.LIQUIDATOR) return 0.74;
  if (faction === Faction.CULTIST || faction === Faction.WILD) return 0.6;
  if (occupation === Occupation.CHILD) return 0.15;
  if (occupation === Occupation.DOCTOR || occupation === Occupation.SCIENTIST) return 0.38;
  return 0.32;
}

function defaultPanicBias(faction: Faction | undefined): number {
  if (faction === Faction.LIQUIDATOR) return 0.22;
  if (faction === Faction.CULTIST || faction === Faction.WILD) return 0.35;
  return 0.5;
}

function unitTrait(value: number | undefined, fallback: number): number {
  if (!isFiniteNumber(value)) return fallback;
  return unitish(value);
}

function unitish(value: number | undefined): number {
  if (!isFiniteNumber(value)) return 0;
  const abs = Math.abs(value);
  if (abs <= 1) return clamp01(value);
  if (abs <= 100) return clamp01(value / 100);
  return clamp01(value / 255);
}

function positive(value: number | undefined): number {
  return isFiniteNumber(value) && value > 0 ? value : 0;
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const x = clamp01((value - edge0) / (edge1 - edge0));
  return x * x * (3 - 2 * x);
}

function minuteWindow01(minute: number, center: number, halfWidth: number): number {
  const distance = circularMinuteDistance(minute, center);
  if (distance >= halfWidth) return 0;
  return 0.5 + Math.cos(Math.PI * distance / halfWidth) * 0.5;
}

function circularMinuteDistance(a: number, b: number): number {
  const d = Math.abs(wrapMinute(a) - wrapMinute(b));
  return Math.min(d, DAY_MINUTES - d);
}

function wrapMinute(value: number): number {
  return ((value % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
}

function max3(a: number, b: number, c: number): number {
  return Math.max(a, Math.max(b, c));
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function hashString32(value: string, seed = HASH_OFFSET): number {
  let hash = seed >>> 0;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, HASH_PRIME) >>> 0;
  }
  return mix32(hash);
}

function mix32(value: number): number {
  let x = value >>> 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d) >>> 0;
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b) >>> 0;
  x ^= x >>> 16;
  return x >>> 0;
}
