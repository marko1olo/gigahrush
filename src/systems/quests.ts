/* ── Procedural quest system ──────────────────────────────────── */

import {
  type Entity, type Quest, type GameState, type Msg, type Room,
  QuestType, EntityType, Occupation, MonsterKind, Faction,
  RoomType, Cell, AIGoal, W, ZoneFaction, FloorLevel,
  msg,
} from '../core/types';
import { World } from '../core/world';
import { ITEMS } from '../data/catalog';
import { isSilverSlimeItem, SILVER_SLIME_SEALED_ID } from '../data/items';

import { addFactionRelMutual, getFactionRel } from '../data/relations';
import { PLOT_CHAIN, PLOT_NPCS, SIDE_QUESTS, isPlotNpc, sideQuestPrereqsMet } from '../data/plot';
import { CONTRACTS, GOVNYAK_COURIER_PACKAGE_ITEM, type ContractDef, contractToQuest, questTargetEventData } from '../data/contracts';
import { addItem, removeItem } from './inventory';
import { getScarcityAdjustedReward } from './economy';
import {
  canCompleteGovnyakCourierEndpoint,
  govnyakCourierOutcomeEventData,
  handleContractQuestItemOutcome,
  isQuestTargetOnCurrentFloor,
  isContractHiddenForAssignment,
  isGovnyakCourierContractId,
  prepareAcceptedContract,
  resolveQuestTargetRoom,
  resolveGovnyakCourierOutcome,
} from './contracts';
import {
  questDifficulty, questXpReward, questMoneyReward, awardXP, randomRPG, scaleMonsterHp, scaleMonsterSpeed,
  intContractRewardMult, intDocumentRewardMult,
} from './rpg';
import { MONSTERS } from '../entities/monster';
import { publishEvent } from './events';
import { entitySpawnSlots } from './entity_limits';
import {
  assignProceduralQuestDeadline,
  deadlineMessageSuffix,
  ensureQuestDeadline,
  questDeadlineEventData,
  questDeadlineExpired,
  type QuestDeadlineContext,
} from './quest_deadlines';
import {
  addNpcPlayerRelation,
  completedQuestFactionRelationDelta,
  completedQuestGiverRelationDelta,
  getNpcPlayerRelation,
} from './npc_relations';

const BASE_QUEST_GIVER_CHANCE = 0.35;

interface AuthoredQuestMeta {
  targetFloor?: FloorLevel;
  targetRoomType?: number;
  targetZoneTag?: string;
  targetHint?: string;
  eventTags?: string[];
  eventData?: Record<string, unknown>;
  eventPrivacy?: Quest['eventPrivacy'];
  eventSeverity?: Quest['eventSeverity'];
  eventTargetName?: string;
  failOnNpcDeathPlotId?: string;
  abandonsSideQuestIds?: string[];
  timeLimitMinutes?: number;
}

function authoredQuestMeta(step: AuthoredQuestMeta, state: GameState): Partial<Quest> {
  const meta: Partial<Quest> = {};
  if (step.targetFloor !== undefined) meta.targetFloor = step.targetFloor;
  if (step.targetRoomType !== undefined) meta.targetRoomType = step.targetRoomType as RoomType;
  if (step.targetZoneTag) meta.targetZoneTag = step.targetZoneTag;
  if (step.targetHint) meta.targetHint = step.targetHint;
  if (step.eventTags?.length) meta.eventTags = [...step.eventTags];
  if (step.eventData) meta.eventData = { ...step.eventData };
  if (step.eventPrivacy) meta.eventPrivacy = step.eventPrivacy;
  if (step.eventSeverity !== undefined) meta.eventSeverity = step.eventSeverity;
  if (step.eventTargetName) meta.eventTargetName = step.eventTargetName;
  if (step.failOnNpcDeathPlotId) meta.failOnNpcDeathPlotId = step.failOnNpcDeathPlotId;
  if (step.abandonsSideQuestIds?.length) meta.abandonsSideQuestIds = [...step.abandonsSideQuestIds];
  if (step.timeLimitMinutes !== undefined) {
    meta.timeLimitMinutes = step.timeLimitMinutes;
    meta.expiresAtMinutes = Math.ceil(state.clock.totalMinutes + step.timeLimitMinutes);
  }
  return meta;
}

function questTags(q: Quest, phase: string, contractDef?: ContractDef): string[] {
  return q.contractId
    ? ['quest', 'contract', phase, ...(contractDef?.tags ?? []), ...(q.eventTags ?? [])]
    : ['quest', phase, ...(q.eventTags ?? [])];
}

function questSpawnMonstersOnAccept(q: Quest): number {
  if (q.plotStepIndex !== undefined) return PLOT_CHAIN[q.plotStepIndex]?.spawnMonstersOnAccept ?? 0;
  if (q.sideQuestId) return SIDE_QUESTS.find(sq => sq.id === q.sideQuestId)?.spawnMonstersOnAccept ?? 0;
  return 0;
}

function visitNeedsConcreteTarget(q: Quest): boolean {
  return q.targetRoom !== undefined || q.targetRoomType !== undefined || q.targetZoneTag !== undefined;
}

function checkVisitQuestAtPlayer(q: Quest, player: Entity, world: World, state: GameState): boolean {
  if (visitNeedsConcreteTarget(q)) {
    if (!isQuestTargetOnCurrentFloor(q, state)) return false;
    const resolved = resolveQuestTargetRoom(world, q, player);
    if (resolved) q.targetRoom = resolved.room.id;
    const room = world.roomAt(player.x, player.y);
    return !!room && resolved !== undefined && room.id === resolved.room.id;
  }

  if (q.visitFloor !== undefined) return isQuestTargetOnCurrentFloor(q, state);
  if (q.targetRoom !== undefined) {
    const room = world.roomAt(player.x, player.y);
    return !!room && room.id === q.targetRoom;
  }
  return false;
}

/* ── Assign a contextual slice of living NPCs as quest givers ─── */
export function reassignQuestGivers(entities: Entity[]): void {
  for (const e of entities) {
    if (e.type !== EntityType.NPC || !e.alive) continue;
    if (isPlotNpc(e)) continue;
    if (e.persistentNpcId) continue;
    e.canGiveQuest = Math.random() < questGiverChance(e);
  }
}

function questGiverChance(npc: Entity): number {
  let chance = BASE_QUEST_GIVER_CHANCE;
  if (npc.faction === Faction.LIQUIDATOR || npc.occupation === Occupation.HUNTER) chance += 0.18;
  if (npc.faction === Faction.SCIENTIST || npc.occupation === Occupation.SCIENTIST) chance += 0.12;
  if (
    npc.occupation === Occupation.COOK ||
    npc.occupation === Occupation.DOCTOR ||
    npc.occupation === Occupation.LOCKSMITH ||
    npc.occupation === Occupation.MECHANIC ||
    npc.occupation === Occupation.STOREKEEPER ||
    npc.occupation === Occupation.SECRETARY ||
    npc.occupation === Occupation.DIRECTOR
  ) chance += 0.10;
  if (npc.occupation === Occupation.CHILD || npc.occupation === Occupation.ALCOHOLIC) chance -= 0.12;
  if (npc.faction === Faction.WILD) chance -= 0.05;
  return Math.max(0.20, Math.min(0.55, chance));
}

/* ── Generate a quest from an NPC (called on interact) ────────── */
export function offerQuest(
  npc: Entity, player: Entity, world: World, entities: Entity[],
  state: GameState, msgs: Msg[], nextEntityId?: { v: number },
): void {
  if (!npc.alive || npc.type !== EntityType.NPC) return;
  if (!npc.canGiveQuest) {
    msgs.push(msg(`${npc.name}: «Мне нечего тебе поручить.»`, state.time, '#888'));
    return;
  }
  // Don't give quest if already has one active from this NPC
  if (state.quests.some(q => q.giverId === npc.id && !q.done)) {
    msgs.push(msg(`${npc.name}: «Ещё не выполнил прошлое задание?»`, state.time, '#aaa'));
    return;
  }
  // Plot NPCs always give quests — they are not in the relation matrix
  if (!isPlotNpc(npc)) {
    const npcFaction = npc.faction ?? Faction.CITIZEN;
    const rel = getFactionRel(Faction.PLAYER, npcFaction);
    const personalRel = getNpcPlayerRelation(npc);
    if (rel < -10 || personalRel < -10) {
      msgs.push(msg(`${npc.name} не хочет с вами разговаривать.`, state.time, '#a44'));
      return;
    }
  }

  const quest = generateQuest(npc, player, world, entities, state);
  if (!quest) {
    msgs.push(msg(`${npc.name}: «Пока ничего не нужно.»`, state.time, '#888'));
    return;
  }

  state.quests.push(quest);
  npc.questId = quest.id;
  msgs.push(msg(`Новое поручение: ${quest.desc}${deadlineMessageSuffix(quest, state.clock.totalMinutes)}`, state.time, '#4af'));
  const contractId = quest.contractId;
  const contractDef = contractId ? CONTRACTS.find(c => c.id === contractId) : undefined;
  publishEvent(state, {
    type: contractId ? 'contract_created' : 'quest_created',
    actorId: npc.id,
    actorName: npc.name ?? '???',
    actorFaction: npc.faction,
    targetName: quest.desc,
    severity: quest.eventSeverity ?? 3,
    privacy: quest.eventPrivacy ?? 'local',
    tags: questTags(quest, 'created', contractDef),
    data: {
      contractId,
      questId: quest.id,
      questType: quest.type,
      plotStepIndex: quest.plotStepIndex,
      sideQuestId: quest.sideQuestId,
      contractFaction: quest.contractFaction,
      contractRank: quest.contractRank,
      rewardResourceId: contractDef?.rewardResourceId,
      timeLimitMinutes: quest.timeLimitMinutes,
      expiresAtMinutes: quest.expiresAtMinutes,
      ...quest.eventData,
      ...questTargetEventData(quest),
    },
  });

  // Spawn monsters around quest giver when authored quest asks for route pressure.
  if (nextEntityId) {
    const spawnCount = questSpawnMonstersOnAccept(quest);
    if (spawnCount > 0) spawnQuestMonsters(npc, world, entities, nextEntityId, spawnCount, msgs, state.time);
  }
}

/* ── Spawn hostile monsters around NPC (for quest defense events) ── */
const SPAWN_KINDS = [
  MonsterKind.TVAR, MonsterKind.SBORKA, MonsterKind.POLZUN,
  MonsterKind.ZOMBIE, MonsterKind.SHADOW, MonsterKind.SBORKA,
  MonsterKind.TVAR, MonsterKind.ZOMBIE,
];

function spawnQuestMonsters(
  npc: Entity, world: World, entities: Entity[],
  nextEntityId: { v: number }, count: number,
  msgs: Msg[], time: number,
): void {
  const slots = entitySpawnSlots(entities, EntityType.MONSTER, count);
  let spawned = 0;
  for (let i = 0; i < slots; i++) {
    // Pick random floor cell in radius 3-8 from NPC (tight corridors)
    const angle = (Math.PI * 2 * i) / slots + (Math.random() - 0.5) * 0.5;
    const dist = 3 + Math.random() * 5;
    let found = false;
    let mx = 0, my = 0;
    for (let attempt = 0; attempt < 60; attempt++) {
      const a = angle + (attempt > 0 ? (Math.random() - 0.5) * 1.5 : 0);
      const d = dist + (attempt > 0 ? (Math.random() - 0.5) * 4 : 0);
      const tx = ((Math.floor(npc.x) + Math.round(Math.cos(a) * d)) % W + W) % W;
      const ty = ((Math.floor(npc.y) + Math.round(Math.sin(a) * d)) % W + W) % W;
      if (world.cells[world.idx(tx, ty)] === Cell.FLOOR) {
        mx = tx; my = ty; found = true; break;
      }
    }
    if (!found) continue;

    const kind = SPAWN_KINDS[i % SPAWN_KINDS.length];
    const mdef = MONSTERS[kind];
    if (!mdef) continue;

    const zid = world.zoneMap[world.idx(mx, my)];
    const zoneLevel = (zid >= 0 && world.zones[zid]) ? (world.zones[zid].level ?? 5) : 5;
    const rpg = randomRPG(zoneLevel);

    entities.push({
      id: nextEntityId.v++, type: EntityType.MONSTER,
      x: mx + 0.5, y: my + 0.5,
      angle: Math.atan2(npc.y - my - 0.5, npc.x - mx - 0.5),
      pitch: 0, alive: true,
      speed: scaleMonsterSpeed(mdef.speed, zoneLevel),
      sprite: mdef.sprite,
      hp: scaleMonsterHp(mdef.hp, zoneLevel),
      maxHp: scaleMonsterHp(mdef.hp, zoneLevel),
      monsterKind: kind, attackCd: 0,
      ai: { goal: AIGoal.WANDER, tx: Math.floor(npc.x), ty: Math.floor(npc.y), path: [], pi: 0, stuck: 0, timer: 0 },
      rpg,
    });
    spawned++;
  }
  if (spawned > 0) {
    msgs.push(msg('Вы слышите рык и скрежет — маршрут стал громким!', time, '#f44'));
  }
}

/* ── Check all active quests for completion ───────────────────── */
export function checkQuests(
  player: Entity, world: World, entities: Entity[],
  state: GameState, msgs: Msg[],
): void {
  for (const q of state.quests) {
    if (q.done) continue;
    ensureQuestDeadline(q, state.clock.totalMinutes, questDeadlineContext(q, player, world, state));
    if (expireQuestIfNeeded(q, player, entities, state, msgs)) continue;
    if (handleContractQuestItemOutcome(q, player, entities, state, msgs)) continue;

    let complete = false;
    const govnyakCourierReady = canCompleteGovnyakCourierEndpoint(q, player, world, state);
    if (govnyakCourierReady !== undefined) {
      if (govnyakCourierReady) complete = true;
      if (complete) completeQuest(q, player, entities, state, msgs);
      continue;
    }

    switch (q.type) {
      case QuestType.FETCH:
        if (q.targetItem === 'money') {
          if ((player.money ?? 0) >= (q.targetCount ?? 1)) complete = true;
        } else if (q.targetItem) {
          const needed = q.targetCount ?? 1;
          const have = (player.inventory ?? []).reduce(
            (sum, s) => s.defId === q.targetItem ? sum + s.count : sum, 0,
          );
          if (have >= needed) complete = true;
        }
        break;

      case QuestType.VISIT:
        complete = checkVisitQuestAtPlayer(q, player, world, state);
        break;

      case QuestType.KILL:
        if (q.killCount !== undefined && q.killNeeded !== undefined) {
          if (q.killCount >= q.killNeeded) complete = true;
        }
        break;

      case QuestType.TALK:
        // Checked in interact — when player talks to target NPC
        break;
    }

    if (complete) completeQuest(q, player, entities, state, msgs);
  }
}

/* ── Notify kill for KILL quests ──────────────────────────────── */
export function notifyKill(kind: MonsterKind, state: GameState): void {
  for (const q of state.quests) {
    if (q.done || q.type !== QuestType.KILL) continue;
    if (q.targetMonsterKind === kind || q.targetMonsterKind === undefined) {
      q.killCount = (q.killCount ?? 0) + 1;
    }
  }
}

/* ── Notify NPC kill for KILL quests targeting plotNpcId ───────── */
export function notifyNpcKill(plotNpcId: string, state: GameState): void {
  for (const q of state.quests) {
    if (q.done || q.type !== QuestType.KILL) continue;
    if (q.targetPlotNpcId === plotNpcId) {
      q.killCount = (q.killCount ?? 0) + 1;
    }
  }
  for (const q of state.quests) {
    if (q.done || q.failOnNpcDeathPlotId !== plotNpcId) continue;
    failQuest(q, [], state, undefined, 'npc_dead', ['npc_dead'], { protectedPlotNpcId: plotNpcId });
  }
}

function failQuest(
  q: Quest,
  entities: Entity[],
  state: GameState,
  msgs: Msg[] | undefined,
  reason: string,
  extraTags: string[] = [],
  extraData: Record<string, unknown> = {},
): void {
  if (q.done) return;

  q.done = true;
  q.failed = true;
  const giver = entities.find(e => e.id === q.giverId);
  if (giver?.questId === q.id) giver.questId = -1;
  const contractDef = q.contractId ? CONTRACTS.find(c => c.id === q.contractId) : undefined;

  if (msgs) msgs.push(msg(`Поручение сорвано: ${q.desc}`, state.time, '#f66'));
  publishEvent(state, {
    type: q.contractId ? 'contract_failed' : 'quest_failed',
    actorId: q.giverId,
    actorName: q.giverName,
    actorFaction: giver?.faction ?? q.contractFaction,
    targetName: q.desc,
    severity: 3,
    privacy: 'local',
    tags: [...questTags(q, 'failed', contractDef), reason, ...extraTags],
    data: {
      questId: q.id,
      questType: q.type,
      targetItem: q.targetItem,
      targetMonsterKind: q.targetMonsterKind,
      targetPlotNpcId: q.targetPlotNpcId,
      sideQuestId: q.sideQuestId,
      contractId: q.contractId,
      contractFaction: q.contractFaction,
      contractRank: q.contractRank,
      rewardResourceId: contractDef?.rewardResourceId,
      ...questDeadlineEventData(q, state.clock.totalMinutes),
      reason,
      ...extraData,
      ...questTargetEventData(q),
    },
  });
}

/* ── Check if talking to target NPC completes a TALK quest ────── */
export function checkTalkQuest(
  targetNpc: Entity, player: Entity, entities: Entity[],
  state: GameState, msgs: Msg[],
): void {
  for (const q of state.quests) {
    if (q.done || q.type !== QuestType.TALK) continue;
    // Match by entity id OR by plot NPC id (cross-floor quests)
    const matchById = q.targetNpcId === targetNpc.id;
    const matchByPlotId = q.targetPlotNpcId && targetNpc.plotNpcId === q.targetPlotNpcId;
    if (!matchById && !matchByPlotId) continue;
    const plotDef = targetNpc.plotNpcId ? PLOT_NPCS[targetNpc.plotNpcId] : undefined;
    const talkQuestResponse = plotDef?.talkQuestResponse;
    if (talkQuestResponse) {
      msgs.push(msg(`${targetNpc.name}: «${pickTalkQuestResponse(talkQuestResponse)}»`, state.time, '#aaf'));
    } else {
      msgs.push(msg(`${targetNpc.name}: «Передам, спасибо.»`, state.time, '#aaf'));
    }
    completeQuest(q, player, entities, state, msgs);
  }
}

function pickTalkQuestResponse(response: string | readonly string[]): string {
  if (typeof response === 'string') return response;
  return response[Math.floor(Math.random() * response.length)] ?? 'Передам, спасибо.';
}

function contractCompletionTags(contractDef: ContractDef | undefined): string[] {
  if (!contractDef) return ['quest', 'completed'];
  if (!contractDef.tags.includes('cleanup')) return ['quest', 'contract', 'completed', ...contractDef.tags];
  const tags = ['quest', 'contract', 'completed', 'cleanup_completed'];
  for (const tag of ['slime', 'brown_slime', 'cleanup']) {
    if (contractDef.tags.includes(tag)) tags.push(tag);
  }
  for (const tag of contractDef.tags) if (!tags.includes(tag)) tags.push(tag);
  return tags;
}

/* ── Complete a quest ─────────────────────────────────────────── */
function completeQuest(
  q: Quest, player: Entity, entities: Entity[],
  state: GameState, msgs: Msg[],
): void {
  q.done = true;
  resolveGovnyakCourierOutcome(q, player, state, msgs);

  // FETCH: take the item from player
  if (q.type === QuestType.FETCH && q.targetItem) {
    if (q.targetItem === 'money') {
      player.money = (player.money ?? 0) - (q.targetCount ?? 1);
    } else {
      removeItem(player, q.targetItem, q.targetCount ?? 1);
    }
  }

  // Reward
  if (q.rewardItem) {
    addItem(player, q.rewardItem, q.rewardCount ?? 1);
    const def = ITEMS[q.rewardItem];
    msgs.push(msg(`Плата: ${def?.name ?? q.rewardItem} ×${q.rewardCount ?? 1}`, state.time, '#4f4'));
  }
  if (q.extraRewards) {
    for (const r of q.extraRewards) {
      addItem(player, r.defId, r.count);
      const def = ITEMS[r.defId];
      msgs.push(msg(`Плата: ${def?.name ?? r.defId} ×${r.count}`, state.time, '#4f4'));
    }
  }

  // XP reward
  if (q.xpReward) {
    awardXP(player, q.xpReward, msgs, state.time);
  }

  // Money reward
  if (q.moneyReward) {
    player.money = (player.money ?? 0) + q.moneyReward;
    msgs.push(msg(`+${q.moneyReward}₽`, state.time, '#ee4'));
  }

  const giver = entities.find(e => e.id === q.giverId);
  const giverFaction = giver?.faction ?? q.contractFaction ?? Faction.CITIZEN;
  const factionRelationDelta = completedQuestFactionRelationDelta(q.relationDelta);
  if (factionRelationDelta !== 0) addFactionRelMutual(Faction.PLAYER, giverFaction, factionRelationDelta);
  const giverPlayerRelationDelta = giver?.type === EntityType.NPC
    ? completedQuestGiverRelationDelta(q.relationDelta, q.difficulty)
    : 0;
  const giverPlayerRelation = giverPlayerRelationDelta !== 0 && giver
    ? addNpcPlayerRelation(giver, giverPlayerRelationDelta)
    : undefined;

  // Clear NPC's questId
  if (giver) {
    giver.questId = -1;
    // Side quest NPC: switch to post-dialogue after completion
    if (q.sideQuestId) giver.plotDone = true;
  }

  msgs.push(msg(`Поручение закрыто: ${q.desc}`, state.time, '#4f4'));
  const contractDef = q.contractId ? CONTRACTS.find(c => c.id === q.contractId) : undefined;
  publishEvent(state, {
    type: q.contractId ? 'contract_completed' : 'quest_completed',
    actorId: q.giverId,
    actorName: q.giverName,
    actorFaction: giverFaction,
    targetName: q.eventTargetName ?? q.desc,
    severity: q.eventSeverity ?? 4,
    privacy: q.eventPrivacy ?? 'local',
    tags: q.contractId ? [...contractCompletionTags(contractDef), ...(q.eventTags ?? [])] : questTags(q, 'completed'),
    data: {
      questId: q.id,
      questType: q.type,
      targetItem: q.targetItem,
      targetMonsterKind: q.targetMonsterKind,
      targetPlotNpcId: q.targetPlotNpcId,
      plotStepIndex: q.plotStepIndex,
      sideQuestId: q.sideQuestId,
      contractId: q.contractId,
      contractFaction: q.contractFaction,
      contractRank: q.contractRank,
      rewardResourceId: contractDef?.rewardResourceId,
      xpReward: q.xpReward,
      moneyReward: q.moneyReward,
      factionRelationDelta,
      giverPlayerRelationDelta,
      giverPlayerRelation,
      ...questDeadlineEventData(q, state.clock.totalMinutes),
      ...q.eventData,
      ...govnyakCourierOutcomeEventData(q),
      ...questTargetEventData(q),
    },
  });

  if (q.type === QuestType.FETCH && q.targetItem && isSilverSlimeItem(q.targetItem)) {
    const itemDef = ITEMS[q.targetItem];
    const sealed = q.targetItem === SILVER_SLIME_SEALED_ID;
    const scienceHandoff = sealed && (giverFaction === Faction.SCIENTIST || q.contractFaction === Faction.SCIENTIST || contractDef?.tags.includes('science') === true);
    const blackMarketHandoff = giverFaction === Faction.WILD || giverFaction === Faction.CULTIST || contractDef?.tags.includes('black_market') === true;
    publishEvent(state, {
      type: 'player_handoff_item',
      actorId: player.id,
      actorName: player.name ?? 'Вы',
      actorFaction: player.faction,
      targetId: q.giverId,
      targetName: q.giverName,
      targetFaction: giverFaction,
      itemId: q.targetItem,
      itemName: itemDef?.name ?? q.targetItem,
      itemCount: q.targetCount ?? 1,
      itemValue: itemDef?.value ?? 0,
      severity: 4,
      privacy: 'public',
      tags: ['player', 'handoff', 'slime', 'silver_slime', sealed ? 'sealed' : 'opened', scienceHandoff ? 'science' : blackMarketHandoff ? 'black_market' : 'suspicious'],
      data: {
        questId: q.id,
        contractId: q.contractId,
        outcome: scienceHandoff ? 'science_handoff' : blackMarketHandoff ? 'black_market_sale' : 'sample_handoff',
        rumorIds: [scienceHandoff ? 'silver_slime_science_handoff' : 'silver_slime_sale_suspicion'],
      },
    });
  }

  abandonSideQuests(q, entities, state, msgs);
}

function abandonSideQuests(
  completed: Quest,
  entities: Entity[],
  state: GameState,
  msgs: Msg[],
): void {
  if (!completed.abandonsSideQuestIds?.length) return;
  const abandoned = new Set(completed.abandonsSideQuestIds);
  for (const q of state.quests) {
    if (q.done || !q.sideQuestId || !abandoned.has(q.sideQuestId)) continue;
    failQuest(q, entities, state, msgs, 'abandoned', ['abandoned'], {
      abandonedByQuestId: completed.id,
      abandonedBySideQuestId: completed.sideQuestId,
    });
  }
}

function expireQuestIfNeeded(q: Quest, player: Entity, entities: Entity[], state: GameState, msgs: Msg[]): boolean {
  if (!questDeadlineExpired(q, state.clock.totalMinutes)) return false;

  q.done = true;
  q.failed = true;
  const giver = entities.find(e => e.id === q.giverId);
  if (giver?.questId === q.id) giver.questId = -1;
  const contractDef = q.contractId ? CONTRACTS.find(c => c.id === q.contractId) : undefined;
  if (isGovnyakCourierContractId(q.contractId)) removeItem(player, GOVNYAK_COURIER_PACKAGE_ITEM, 1);

  msgs.push(msg(`Срок вышел: ${q.desc}`, state.time, '#f66'));
  publishEvent(state, {
    type: q.contractId ? 'contract_failed' : 'quest_failed',
    actorId: q.giverId,
    actorName: q.giverName,
    actorFaction: giver?.faction ?? q.contractFaction,
    targetName: q.desc,
    severity: 3,
    privacy: 'local',
    tags: [...questTags(q, 'failed', contractDef), 'deadline'],
    data: {
      questId: q.id,
      questType: q.type,
      targetItem: q.targetItem,
      targetMonsterKind: q.targetMonsterKind,
      targetPlotNpcId: q.targetPlotNpcId,
      sideQuestId: q.sideQuestId,
      contractId: q.contractId,
      contractFaction: q.contractFaction,
      contractRank: q.contractRank,
      rewardResourceId: contractDef?.rewardResourceId,
      ...questDeadlineEventData(q, state.clock.totalMinutes),
      reason: 'deadline',
      ...q.eventData,
      ...questTargetEventData(q),
    },
  });
  return true;
}

function questDeadlineContext(q: Quest, player: Entity, world: World, state: GameState): QuestDeadlineContext {
  const targetFloor = q.visitFloor ?? q.targetFloor;
  const ctx: QuestDeadlineContext = {
    samosborDanger: state.samosborActive,
    crossFloor: targetFloor !== undefined && targetFloor !== state.currentFloor,
  };
  if (q.targetRoom !== undefined) {
    const room = world.rooms[q.targetRoom];
    if (room) ctx.distance = world.dist(player.x, player.y, room.x + room.w / 2, room.y + room.h / 2);
  }
  return ctx;
}
/* ── Toroidal direction name (from → to) ─────────────────────── */
function toroidalDirection(world: World, fromX: number, fromY: number, toX: number, toY: number): string {
  const dx = world.delta(Math.floor(fromX), Math.floor(toX));
  const dy = world.delta(Math.floor(fromY), Math.floor(toY));
  // dy<0 = target is above = north; dx>0 = target is right = east
  const ns = dy < -5 ? 'север' : dy > 5 ? 'юг' : '';
  const ew = dx > 5 ? 'восток' : dx < -5 ? 'запад' : '';
  if (ns && ew) return `на ${ns}о-${ew}е`;
  if (ns) return `на ${ns}е`;
  if (ew) return `на ${ew}е`;
  return 'недалеко';
}

function nearestRoomOfType(world: World, npc: Entity, roomType: number): Room | null {
  const current = world.roomAt(npc.x, npc.y);
  if (current?.type === roomType) return current;

  let best: Room | null = null;
  let bestD2 = Number.POSITIVE_INFINITY;
  for (const room of world.rooms) {
    if (!room || room.type !== roomType) continue;
    const d2 = world.dist2(npc.x, npc.y, room.x + room.w / 2, room.y + room.h / 2);
    if (d2 < bestD2) {
      best = room;
      bestD2 = d2;
    }
  }
  return best;
}

function nearestRoomByName(world: World, npc: Entity, roomName: string): Room | null {
  const current = world.roomAt(npc.x, npc.y);
  if (current?.name === roomName) return current;

  let best: Room | null = null;
  let bestD2 = Number.POSITIVE_INFINITY;
  for (const room of world.rooms) {
    if (!room || room.name !== roomName) continue;
    const d2 = world.dist2(npc.x, npc.y, room.x + room.w / 2, room.y + room.h / 2);
    if (d2 < bestD2) {
      best = room;
      bestD2 = d2;
    }
  }
  return best;
}

/* ── Generate plot quest from PLOT_CHAIN ──────────────────────── */
function generatePlotQuest(
  npc: Entity, world: World, entities: Entity[], state: GameState,
): Quest | null {
  const plotId = npc.plotNpcId!;
  for (let i = 0; i < PLOT_CHAIN.length; i++) {
    const step = PLOT_CHAIN[i];
    if (step.giverNpcId !== plotId) continue;
    // Skip if this step already has a quest (active or done)
    if (state.quests.some(q => q.plotStepIndex === i)) continue;
    // All previous steps must be done
    let allPrevDone = true;
    for (let j = 0; j < i; j++) {
      if (!state.quests.some(q => q.plotStepIndex === j && q.done)) { allPrevDone = false; break; }
    }
    if (!allPrevDone) continue;

    const id = state.nextQuestId++;
    let desc = step.desc;

    if (step.type === QuestType.TALK && step.targetNpcId) {
      const target = entities.find(e => e.plotNpcId === step.targetNpcId && e.alive);
      if (target && desc.includes('{dir}')) {
        desc = desc.replace('{dir}', toroidalDirection(world, npc.x, npc.y, target.x, target.y));
      } else if (!target) {
        // Target NPC on a different floor — strip {dir} placeholder
        desc = desc.replace('{dir}', 'на другом уровне');
      }
      const targetDef = PLOT_NPCS[step.targetNpcId];
      return {
        id, type: step.type,
        giverId: npc.id, giverName: npc.name ?? '???',
        desc,
        targetNpcId: target?.id, targetNpcName: target?.name ?? targetDef?.name,
        targetPlotNpcId: step.targetNpcId,
        rewardItem: step.rewardItem, rewardCount: step.rewardCount,
        extraRewards: step.extraRewards,
        relationDelta: step.relationDelta, xpReward: step.xpReward,
        moneyReward: step.moneyReward,
        plotStepIndex: i,
        ...authoredQuestMeta(step, state),
        done: false,
      };
    }

    if (step.type === QuestType.FETCH) {
      return {
        id, type: step.type,
        giverId: npc.id, giverName: npc.name ?? '???',
        desc,
        targetItem: step.targetItem, targetCount: step.targetCount,
        rewardItem: step.rewardItem, rewardCount: step.rewardCount,
        extraRewards: step.extraRewards,
        relationDelta: step.relationDelta, xpReward: step.xpReward,
        moneyReward: step.moneyReward,
        plotStepIndex: i,
        ...authoredQuestMeta(step, state),
        done: false,
      };
    }

    if (step.type === QuestType.KILL) {
      if (desc.includes('{dir}') && step.targetMonsterKind !== undefined) {
        const targetMon = entities.find(e => e.type === EntityType.MONSTER && e.alive && e.monsterKind === step.targetMonsterKind);
        desc = desc.replace('{dir}', targetMon
          ? toroidalDirection(world, npc.x, npc.y, targetMon.x, targetMon.y)
          : 'где-то в глубине');
      }
      return {
        id, type: step.type,
        giverId: npc.id, giverName: npc.name ?? '???',
        desc,
        targetMonsterKind: step.targetMonsterKind,
        targetPlotNpcId: step.targetPlotNpcId,
        killCount: 0, killNeeded: step.killNeeded ?? 1,
        rewardItem: step.rewardItem, rewardCount: step.rewardCount,
        extraRewards: step.extraRewards,
        relationDelta: step.relationDelta, xpReward: step.xpReward,
        moneyReward: step.moneyReward,
        plotStepIndex: i,
        ...authoredQuestMeta(step, state),
        done: false,
      };
    }

    if (step.type === QuestType.VISIT && (step.targetRoomType !== undefined || step.targetRoomName !== undefined)) {
      const room = step.targetRoomName
        ? nearestRoomByName(world, npc, step.targetRoomName)
        : nearestRoomOfType(world, npc, step.targetRoomType!);
      return {
        id, type: step.type,
        giverId: npc.id, giverName: npc.name ?? '???',
        desc,
        targetRoom: room?.id,
        rewardItem: step.rewardItem, rewardCount: step.rewardCount,
        extraRewards: step.extraRewards,
        relationDelta: step.relationDelta, xpReward: step.xpReward,
        moneyReward: step.moneyReward,
        plotStepIndex: i,
        ...authoredQuestMeta(step, state),
        done: false,
      };
    }

    if (step.type === QuestType.VISIT && (step as { visitFloor?: number }).visitFloor !== undefined) {
      return {
        id, type: step.type,
        giverId: npc.id, giverName: npc.name ?? '???',
        desc,
        visitFloor: (step as { visitFloor: number }).visitFloor,
        rewardItem: step.rewardItem, rewardCount: step.rewardCount,
        extraRewards: step.extraRewards,
        relationDelta: step.relationDelta, xpReward: step.xpReward,
        moneyReward: step.moneyReward,
        plotStepIndex: i,
        ...authoredQuestMeta(step, state),
        done: false,
      };
    }
  }

  // ── Side quests (no prerequisite chain) ──
  for (const sq of SIDE_QUESTS) {
    if (sq.giverNpcId !== plotId) continue;
    if (state.quests.some(q => q.sideQuestId === sq.id)) continue;
    if (!sideQuestPrereqsMet(sq, state.quests)) continue;

    if (sq.type === QuestType.FETCH) {
      const id = state.nextQuestId++;
      return {
        id, type: sq.type,
        giverId: npc.id, giverName: npc.name ?? '???',
        desc: sq.desc,
        targetItem: sq.targetItem, targetCount: sq.targetCount,
        rewardItem: sq.rewardItem, rewardCount: sq.rewardCount,
        extraRewards: sq.extraRewards,
        relationDelta: sq.relationDelta, xpReward: sq.xpReward,
        moneyReward: sq.moneyReward,
        sideQuestId: sq.id,
        ...authoredQuestMeta(sq, state),
        done: false,
      };
    }
    if (sq.type === QuestType.KILL) {
      const id = state.nextQuestId++;
      return {
        id, type: sq.type,
        giverId: npc.id, giverName: npc.name ?? '???',
        desc: sq.desc,
        targetMonsterKind: sq.targetMonsterKind,
        targetPlotNpcId: sq.targetPlotNpcId,
        killCount: 0, killNeeded: sq.killNeeded ?? 1,
        rewardItem: sq.rewardItem, rewardCount: sq.rewardCount,
        extraRewards: sq.extraRewards,
        relationDelta: sq.relationDelta, xpReward: sq.xpReward,
        moneyReward: sq.moneyReward,
        sideQuestId: sq.id,
        ...authoredQuestMeta(sq, state),
        done: false,
      };
    }
    if (sq.type === QuestType.TALK) {
      const targetPlotNpcId = sq.targetNpcId ?? sq.targetPlotNpcId;
      if (!targetPlotNpcId) continue;
      const id = state.nextQuestId++;
      const target = entities.find(e => e.plotNpcId === targetPlotNpcId && e.alive);
      const targetDef = PLOT_NPCS[targetPlotNpcId];
      let desc = sq.desc;
      if (desc.includes('{dir}')) {
        desc = desc.replace('{dir}', target
          ? toroidalDirection(world, npc.x, npc.y, target.x, target.y)
          : 'на другом уровне');
      }
      return {
        id, type: sq.type,
        giverId: npc.id, giverName: npc.name ?? '???',
        desc,
        targetNpcId: target?.id,
        targetNpcName: target?.name ?? targetDef?.name ?? targetPlotNpcId,
        targetPlotNpcId,
        rewardItem: sq.rewardItem, rewardCount: sq.rewardCount,
        extraRewards: sq.extraRewards,
        relationDelta: sq.relationDelta, xpReward: sq.xpReward,
        moneyReward: sq.moneyReward,
        sideQuestId: sq.id,
        ...authoredQuestMeta(sq, state),
        done: false,
      };
    }
    if (sq.type === QuestType.VISIT && sq.visitFloor !== undefined) {
      const id = state.nextQuestId++;
      return {
        id, type: sq.type,
        giverId: npc.id, giverName: npc.name ?? '???',
        desc: sq.desc,
        visitFloor: sq.visitFloor,
        rewardItem: sq.rewardItem, rewardCount: sq.rewardCount,
        extraRewards: sq.extraRewards,
        relationDelta: sq.relationDelta, xpReward: sq.xpReward,
        moneyReward: sq.moneyReward,
        sideQuestId: sq.id,
        ...authoredQuestMeta(sq, state),
        done: false,
      };
    }
    if (sq.type === QuestType.VISIT && (sq.targetRoomType !== undefined || sq.targetRoomName !== undefined)) {
      const room = sq.targetRoomName
        ? nearestRoomByName(world, npc, sq.targetRoomName)
        : nearestRoomOfType(world, npc, sq.targetRoomType!);
      if (!room) continue;
      const id = state.nextQuestId++;
      let desc = sq.desc;
      if (desc.includes('{dir}')) {
        desc = desc.replace('{dir}', toroidalDirection(world, npc.x, npc.y, room.x + room.w / 2, room.y + room.h / 2));
      }
      return {
        id, type: sq.type,
        giverId: npc.id, giverName: npc.name ?? '???',
        desc,
        targetRoom: room.id,
        rewardItem: sq.rewardItem, rewardCount: sq.rewardCount,
        extraRewards: sq.extraRewards,
        relationDelta: sq.relationDelta, xpReward: sq.xpReward,
        moneyReward: sq.moneyReward,
        sideQuestId: sq.id,
        ...authoredQuestMeta(sq, state),
        done: false,
      };
    }
  }

  return null;
}

interface QuestContext {
  floor: FloorLevel;
  roomName: string;
  roomType?: RoomType;
  zoneId: number;
  zoneFaction?: ZoneFaction;
  zoneLevel: number;
  samosborDanger: boolean;
  nearbyMonster?: Entity;
}

type QuestChoice = 'fetch' | 'visit' | 'kill' | 'talk';

function buildQuestContext(npc: Entity, world: World, entities: Entity[], state: GameState): QuestContext {
  const room = world.roomAt(npc.x, npc.y);
  const cellIdx = world.idx(Math.floor(npc.x), Math.floor(npc.y));
  const zoneId = world.zoneMap[cellIdx] ?? 0;
  const zone = world.zones[zoneId];
  let nearbyMonster: Entity | undefined;
  let bestD2 = 30 * 30;
  for (const e of entities) {
    if (e.type !== EntityType.MONSTER || !e.alive) continue;
    const d2 = world.dist2(npc.x, npc.y, e.x, e.y);
    if (d2 < bestD2) { bestD2 = d2; nearbyMonster = e; }
  }
  return {
    floor: state.currentFloor,
    roomName: room?.name ?? 'коридоре',
    roomType: room?.type,
    zoneId,
    zoneFaction: zone?.faction,
    zoneLevel: zone?.level ?? 1,
    samosborDanger: state.samosborActive || zone?.fogged === true || zone?.faction === ZoneFaction.SAMOSBOR,
    nearbyMonster,
  };
}

function pickQuestChoice(npc: Entity, ctx: QuestContext): QuestChoice {
  const weights: Record<QuestChoice, number> = { fetch: 35, visit: 18, kill: 20, talk: 15 };
  if (ctx.samosborDanger) { weights.kill += 30; weights.fetch += 10; }
  if (ctx.nearbyMonster) weights.kill += 25;
  if (npc.faction === Faction.LIQUIDATOR || npc.occupation === Occupation.HUNTER) weights.kill += 30;
  if (npc.faction === Faction.CULTIST || npc.occupation === Occupation.PILGRIM || npc.occupation === Occupation.PRIEST) {
    weights.fetch += 12;
    weights.talk += 8;
  }
  if (npc.occupation === Occupation.SECRETARY || npc.occupation === Occupation.DIRECTOR) {
    weights.visit += 18;
    weights.talk += 12;
  }
  if (npc.occupation === Occupation.SCIENTIST || npc.faction === Faction.SCIENTIST) {
    weights.fetch += 16;
    weights.visit += 10;
  }
  if (
    ctx.roomType === RoomType.KITCHEN ||
    ctx.roomType === RoomType.MEDICAL ||
    ctx.roomType === RoomType.PRODUCTION ||
    ctx.roomType === RoomType.STORAGE ||
    ctx.roomType === RoomType.OFFICE
  ) weights.fetch += 18;
  if (npc.occupation === Occupation.CHILD) weights.kill = Math.max(3, weights.kill - 22);

  const total = weights.fetch + weights.visit + weights.kill + weights.talk;
  let r = Math.random() * total;
  for (const choice of ['fetch', 'visit', 'kill', 'talk'] as QuestChoice[]) {
    r -= weights[choice];
    if (r <= 0) return choice;
  }
  return 'fetch';
}

function contractScore(def: ContractDef, npc: Entity, ctx: QuestContext): number {
  let score = 0;
  if (def.target.floor === ctx.floor) score += 4;
  if (def.target.roomType !== undefined && def.target.roomType === ctx.roomType) score += 3;
  if (npc.faction === def.faction) score += 7;
  if (def.faction === Faction.CITIZEN && (npc.faction === Faction.CITIZEN || npc.faction === undefined)) score += 3;
  if (def.tags.includes('combat') && (ctx.samosborDanger || ctx.nearbyMonster || npc.occupation === Occupation.HUNTER)) score += 5;
  if (def.tags.includes('admin') && ctx.roomType === RoomType.OFFICE) score += 5;
  if (def.tags.includes('paper') && (ctx.roomType === RoomType.OFFICE || npc.occupation === Occupation.SECRETARY)) score += 4;
  if (def.tags.includes('food') && ctx.roomType === RoomType.KITCHEN) score += 5;
  if (def.tags.includes('supply') && (ctx.roomType === RoomType.STORAGE || ctx.roomType === RoomType.KITCHEN)) score += 3;
  if (def.tags.includes('maintenance') && (ctx.roomType === RoomType.PRODUCTION || npc.occupation === Occupation.LOCKSMITH || npc.occupation === Occupation.MECHANIC)) score += 5;
  if (def.tags.includes('science') && (npc.faction === Faction.SCIENTIST || npc.occupation === Occupation.SCIENTIST)) score += 6;
  if (def.tags.includes('cult') && (npc.faction === Faction.CULTIST || npc.occupation === Occupation.PILGRIM || npc.occupation === Occupation.PRIEST)) score += 6;
  if (def.tags.includes('wild') && npc.faction === Faction.WILD) score += 6;
  if (def.tags.includes('black_market') && (ctx.roomName.includes('88') || ctx.roomName.includes('Толкучка') || npc.occupation === Occupation.STOREKEEPER)) score += 7;
  if (def.tags.includes('medicine') && (ctx.roomType === RoomType.MEDICAL || ctx.samosborDanger)) score += 4;
  if (def.rank > Math.max(1, ctx.zoneLevel + 1)) score -= 2;
  return score;
}

function hasDocumentTags(tags: readonly string[]): boolean {
  return tags.includes('paper') || tags.includes('documents') || tags.includes('admin');
}

function intAdjustedMoney(base: number, player: Entity, documentWork = false): number {
  if (!player.rpg || base <= 0) return base;
  const mult = documentWork ? intDocumentRewardMult(player.rpg) : intContractRewardMult(player.rpg);
  return Math.max(1, Math.round(base * mult));
}

function pickSystemQuest(npc: Entity, player: Entity, ctx: QuestContext, state: GameState): Quest | null {
  const scored = CONTRACTS
    .filter(c => !isContractHiddenForAssignment(c))
    .filter(c => !state.quests.some(q => q.contractId === c.id))
    .map(def => ({ def, score: contractScore(def, npc, ctx) }))
    .filter(row => row.score > 0)
    .sort((a, b) => b.score - a.score);
  if (scored.length === 0) return null;
  const top = scored.slice(0, Math.min(3, scored.length));
  const picked = top[Math.floor(Math.random() * top.length)].def;
  const moneyReward = picked.rewardResourceId
    ? getScarcityAdjustedReward(
      state, picked.rewardResourceId, picked.moneyReward,
      picked.target.floor, picked.rewardScarcityMax ?? 3, player.rpg,
    )
    : intAdjustedMoney(picked.moneyReward, player, hasDocumentTags(picked.tags));
  const quest = contractToQuest(picked, state.nextQuestId++, { id: npc.id, name: npc.name }, moneyReward);
  prepareAcceptedContract(quest, state);
  return assignProceduralQuestDeadline(quest, state.clock.totalMinutes, {
    samosborDanger: ctx.samosborDanger,
    nearbyMonster: ctx.nearbyMonster !== undefined,
    crossFloor: quest.targetFloor !== undefined && quest.targetFloor !== state.currentFloor,
  });
}

function shouldOfferSystemQuest(npc: Entity, ctx: QuestContext): boolean {
  let chance = 0.20;
  if (npc.faction === Faction.LIQUIDATOR || npc.occupation === Occupation.HUNTER) chance += 0.18;
  if (ctx.samosborDanger || ctx.nearbyMonster) chance += 0.12;
  if (ctx.roomType === RoomType.OFFICE || ctx.roomType === RoomType.STORAGE || ctx.roomType === RoomType.PRODUCTION) chance += 0.08;
  return Math.random() < Math.min(0.45, chance);
}

/* ── Generate quest based on NPC context ──────────────────────── */
function generateQuest(
  npc: Entity, player: Entity, world: World, entities: Entity[], state: GameState,
): Quest | null {
  // ── Story quest from PLOT_CHAIN ──
  if (isPlotNpc(npc)) {
    return generatePlotQuest(npc, world, entities, state);
  }

  const occ = npc.occupation;
  const ctx = buildQuestContext(npc, world, entities, state);
  if (shouldOfferSystemQuest(npc, ctx)) {
    const systemQuest = pickSystemQuest(npc, player, ctx, state);
    if (systemQuest) return systemQuest;
  }

  const choice = pickQuestChoice(npc, ctx);

  if (choice === 'fetch') {
    const item = pickFetchItem(occ, npc, ctx);
    if (!item) return null;
    const def = ITEMS[item];
    if (!def) return null;
    const count = targetCountForItem(item, ctx);
    const reward = pickRewardItem(occ, ctx);
    const diff = questDifficulty((def.value ?? 10) * count, 50, ctx.samosborDanger ? 1.3 : 1.0);
    const docWork = item === 'note' || item === 'book' || item === 'ballot' || ctx.roomType === RoomType.OFFICE;
    return assignProceduralQuestDeadline({
      id: state.nextQuestId++, type: QuestType.FETCH,
      giverId: npc.id, giverName: npc.name ?? '???',
      desc: `${npc.name}: «Принеси ${def.name} ×${count} в ${ctx.roomName}. Плата после сдачи; не тяни до сирены.»`,
      targetItem: item, targetCount: count,
      rewardItem: reward, rewardCount: 1, relationDelta: 10,
      difficulty: diff, xpReward: questXpReward(diff), moneyReward: intAdjustedMoney(questMoneyReward(diff), player, docWork),
      done: false,
    }, state.clock.totalMinutes, { samosborDanger: ctx.samosborDanger, nearbyMonster: ctx.nearbyMonster !== undefined });
  }

  if (choice === 'visit') {
    const room = pickVisitRoom(world, npc, preferredVisitRooms(npc, ctx));
    if (!room) return null;
    const dist = world.dist(npc.x, npc.y, room.x, room.y);
    const diff = questDifficulty(0, dist, ctx.samosborDanger ? 1.1 : 0.8);
    const docWork = room.name.includes('архив') || room.name.includes('кабин') || preferredVisitRooms(npc, ctx).includes(RoomType.OFFICE);
    return assignProceduralQuestDeadline({
      id: state.nextQuestId++, type: QuestType.VISIT,
      giverId: npc.id, giverName: npc.name ?? '???',
      desc: `${npc.name}: «Проверь ${room.name} ${toroidalDirection(world, npc.x, npc.y, room.x, room.y)}. Нужна отметка, не рассказ.»`,
      targetRoom: room.id,
      rewardItem: pickRewardItem(occ, ctx), rewardCount: 1, relationDelta: 8,
      difficulty: diff, xpReward: questXpReward(diff), moneyReward: intAdjustedMoney(questMoneyReward(diff), player, docWork),
      done: false,
    }, state.clock.totalMinutes, {
      samosborDanger: ctx.samosborDanger,
      nearbyMonster: ctx.nearbyMonster !== undefined,
      distance: dist,
    });
  }

  if (choice === 'kill') {
    const kind = pickKillKind(npc, ctx);
    const mdef = MONSTERS[kind];
    const killNeeded = ctx.samosborDanger && kind === MonsterKind.SBORKA ? 2 : 1;
    const killDiff = questDifficulty(0, 0, monsterQuestScale(kind) * killNeeded);
    return assignProceduralQuestDeadline({
      id: state.nextQuestId++, type: QuestType.KILL,
      giverId: npc.id, giverName: npc.name ?? '???',
      desc: `${npc.name}: «Убей ${monsterQuestName(kind)}${mdef ? ` у ${ctx.roomName}` : ''}. Плата после тишины.»`,
      targetMonsterKind: kind, killCount: 0, killNeeded,
      rewardItem: pickRewardItem(occ, ctx), rewardCount: 1, relationDelta: 15,
      difficulty: killDiff, xpReward: questXpReward(killDiff), moneyReward: intAdjustedMoney(questMoneyReward(killDiff), player),
      done: false,
    }, state.clock.totalMinutes, { samosborDanger: ctx.samosborDanger, nearbyMonster: ctx.nearbyMonster !== undefined });
  }

  const target = pickTalkTarget(npc, world, entities);
  if (!target) return null;
  const dist = world.dist(npc.x, npc.y, target.x, target.y);
  const talkDiff = questDifficulty(0, dist, 0.6);
  return assignProceduralQuestDeadline({
    id: state.nextQuestId++, type: QuestType.TALK,
    giverId: npc.id, giverName: npc.name ?? '???',
    desc: `${npc.name}: «Передай ${target.name} сообщение. Он ${toroidalDirection(world, npc.x, npc.y, target.x, target.y)}; плата после ответа.»`,
    targetNpcId: target.id, targetNpcName: target.name,
    rewardItem: pickRewardItem(occ, ctx), rewardCount: 1, relationDelta: 12,
    difficulty: talkDiff, xpReward: questXpReward(talkDiff), moneyReward: intAdjustedMoney(questMoneyReward(talkDiff), player),
    done: false,
  }, state.clock.totalMinutes, {
    samosborDanger: ctx.samosborDanger,
    nearbyMonster: ctx.nearbyMonster !== undefined,
    distance: dist,
  });
}

/* ── Occupation-specific item picks ───────────────────────────── */
const FETCH_ITEMS: Partial<Record<Occupation, string[]>> = {
  [Occupation.COOK]: ['bread', 'canned', 'kasha', 'rawmeat', 'water'],
  [Occupation.DOCTOR]: ['bandage', 'pills', 'antidep', 'water'],
  [Occupation.HUNTER]: ['knife', 'pipe', 'wrench', 'canned'],
  [Occupation.LOCKSMITH]: ['wrench', 'flashlight'],
  [Occupation.SCIENTIST]: ['note', 'book', 'flashlight', 'govnyak_sample'],
  [Occupation.SECRETARY]: ['book', 'cigs', 'note'],
  [Occupation.STOREKEEPER]: ['cigs', 'toiletpaper', 'canned', 'water', 'govnyak_roll', 'govnyak_brick'],
};

function pushUnique(pool: string[], items: string[]): void {
  for (const item of items) if (ITEMS[item] && !pool.includes(item)) pool.push(item);
}

function pickFetchItem(occ: Occupation | undefined, npc: Entity, ctx: QuestContext): string | null {
  const pool: string[] = [];
  if (ctx.samosborDanger) pushUnique(pool, ['bandage', 'water', 'ammo_9mm', 'bread']);
  if (ctx.roomType === RoomType.KITCHEN) pushUnique(pool, ['water', 'bread', 'canned', 'kasha']);
  if (ctx.roomType === RoomType.MEDICAL) pushUnique(pool, ['bandage', 'pills', 'antidep', 'water']);
  if (ctx.roomType === RoomType.PRODUCTION) pushUnique(pool, ['pipe', 'wrench', 'rebar', 'door_kit']);
  if (ctx.roomType === RoomType.OFFICE) pushUnique(pool, ['note', 'book', 'ballot']);
  if (ctx.roomType === RoomType.STORAGE) pushUnique(pool, ['canned', 'pipe', 'ammo_9mm', 'flashlight']);
  if (npc.faction === Faction.CULTIST || occ === Occupation.PILGRIM || occ === Occupation.PRIEST) {
    pushUnique(pool, ['idol_chernobog', 'strange_clot', 'cigs', 'govnyak_bad_batch']);
  }
  if (npc.faction === Faction.SCIENTIST || occ === Occupation.SCIENTIST) pushUnique(pool, ['strange_clot', 'note', 'book', 'pills', 'govnyak_sample']);
  if (npc.faction === Faction.LIQUIDATOR || occ === Occupation.HUNTER) pushUnique(pool, ['ammo_9mm', 'bandage', 'canned']);
  if (occ !== undefined && FETCH_ITEMS[occ]) pushUnique(pool, FETCH_ITEMS[occ]!);
  pushUnique(pool, ['bread', 'water', 'bandage', 'cigs']);
  return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null;
}

function targetCountForItem(item: string, ctx: QuestContext): number {
  if (item.startsWith('govnyak_')) return 1;
  if (item === 'water' || item === 'bread' || item === 'cigs') return ctx.samosborDanger ? 3 : 2;
  if (item === 'note' || item === 'ballot') return 3;
  if (item.startsWith('ammo_')) return 10;
  return 1;
}

const REWARD_ITEMS: Partial<Record<Occupation, string[]>> = {
  [Occupation.COOK]: ['bread', 'kasha', 'kompot'],
  [Occupation.DOCTOR]: ['bandage', 'pills', 'antidep'],
  [Occupation.HUNTER]: ['canned', 'rawmeat', 'knife'],
  [Occupation.LOCKSMITH]: ['flashlight', 'wrench'],
  [Occupation.SCIENTIST]: ['note', 'pills'],
  [Occupation.SECRETARY]: ['tea', 'book'],
  [Occupation.STOREKEEPER]: ['cigs', 'water', 'bread'],
};

function pickRewardItem(occ?: Occupation, ctx?: QuestContext): string {
  const pool: string[] = [];
  if (ctx?.samosborDanger) pushUnique(pool, ['bandage', 'ammo_9mm', 'water']);
  if (ctx?.roomType === RoomType.OFFICE) pushUnique(pool, ['note', 'book', 'tea']);
  if (ctx?.roomType === RoomType.PRODUCTION) pushUnique(pool, ['wrench', 'pipe', 'flashlight']);
  if (occ !== undefined && REWARD_ITEMS[occ]) pushUnique(pool, REWARD_ITEMS[occ]!);
  pushUnique(pool, ['bread', 'water', 'bandage']);
  return pool[Math.floor(Math.random() * pool.length)];
}

function preferredVisitRooms(npc: Entity, ctx: QuestContext): RoomType[] {
  if (npc.occupation === Occupation.DOCTOR) return [RoomType.MEDICAL, RoomType.STORAGE];
  if (npc.occupation === Occupation.COOK) return [RoomType.KITCHEN, RoomType.STORAGE];
  if (npc.occupation === Occupation.LOCKSMITH || npc.occupation === Occupation.MECHANIC || npc.occupation === Occupation.TURNER) {
    return [RoomType.PRODUCTION, RoomType.STORAGE];
  }
  if (npc.occupation === Occupation.SECRETARY || npc.occupation === Occupation.DIRECTOR) return [RoomType.OFFICE, RoomType.HQ];
  if (npc.occupation === Occupation.SCIENTIST || npc.faction === Faction.SCIENTIST) return [RoomType.MEDICAL, RoomType.OFFICE];
  if (ctx.samosborDanger) return [RoomType.HQ, RoomType.MEDICAL, RoomType.STORAGE];
  return [];
}

function pickVisitRoom(world: World, npc: Entity, preferred: RoomType[] = []): { id: number; name: string; x: number; y: number } | null {
  const allRooms = world.rooms.filter(r => r != null && r.type !== RoomType.CORRIDOR);
  const rooms = preferred.length > 0 ? allRooms.filter(r => preferred.includes(r.type)) : allRooms;
  if (rooms.length === 0) return null;
  // Pick a room at some distance
  const candidates = rooms.filter(r => world.dist(npc.x, npc.y, r.x + r.w / 2, r.y + r.h / 2) > 15);
  const pool = candidates.length > 0 ? candidates : rooms;
  const r = pool[Math.floor(Math.random() * pool.length)];
  return { id: r.id, name: r.name, x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

function pickKillKind(npc: Entity, ctx: QuestContext): MonsterKind {
  if (ctx.nearbyMonster?.monsterKind !== undefined) return ctx.nearbyMonster.monsterKind;
  if (npc.faction === Faction.LIQUIDATOR || npc.occupation === Occupation.HUNTER) {
    const pool = [MonsterKind.SBORKA, MonsterKind.TVAR, MonsterKind.POLZUN, MonsterKind.SHADOW];
    return pool[Math.floor(Math.random() * pool.length)];
  }
  if (ctx.roomType === RoomType.OFFICE) return MonsterKind.PECHATEED;
  if (ctx.roomType === RoomType.PRODUCTION) return MonsterKind.REBAR;
  if (ctx.samosborDanger) return MonsterKind.SBORKA;
  const pool = [MonsterKind.SBORKA, MonsterKind.TVAR, MonsterKind.POLZUN];
  return pool[Math.floor(Math.random() * pool.length)];
}

function monsterQuestScale(kind: MonsterKind): number {
  if (kind === MonsterKind.POLZUN || kind === MonsterKind.SHADOW || kind === MonsterKind.REBAR || kind === MonsterKind.PECHATEED) return 2.0;
  if (kind === MonsterKind.TVAR) return 1.5;
  return 1.0;
}

function monsterQuestName(kind: MonsterKind): string {
  if (kind === MonsterKind.SBORKA) return 'сборку';
  if (kind === MonsterKind.TVAR) return 'тварь';
  if (kind === MonsterKind.POLZUN) return 'ползуна';
  if (kind === MonsterKind.SHADOW) return 'теневика';
  if (kind === MonsterKind.REBAR) return 'арматуру';
  if (kind === MonsterKind.PECHATEED) return 'печатееда';
  return (MONSTERS[kind]?.name ?? 'монстра').toLowerCase();
}

function pickTalkTarget(npc: Entity, world: World, entities: Entity[]): Entity | null {
  const candidates = entities
    .filter(e => e.type === EntityType.NPC && e.alive && e.id !== npc.id)
    .sort((a, b) => {
      const af = a.faction === npc.faction ? -30 : 0;
      const bf = b.faction === npc.faction ? -30 : 0;
      return world.dist2(npc.x, npc.y, a.x, a.y) + af - (world.dist2(npc.x, npc.y, b.x, b.y) + bf);
    });
  if (candidates.length === 0) return null;
  const top = candidates.slice(0, Math.min(12, candidates.length));
  return top[Math.floor(Math.random() * top.length)];
}
