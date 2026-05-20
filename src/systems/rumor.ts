/* ── Cheap rumor selection, event bridge, and NPC remembrance ─── */

import { Faction, FloorLevel, MonsterKind, RoomType, type Entity, type WorldEvent } from '../core/types';
import { chernobogDocketItemRumorId } from '../data/chernobog_docket';
import { ITEMS, isSilverSlimeItem } from '../data/items';
import { RUMORS, type RumorDef, type RumorLead, type RumorReveal, type RumorTopic } from '../data/rumors';
import { monsterTypeName } from '../entities/monster';
import { type ContextSnapshot } from './context';
import {
  flagEventRumor,
  getNpcMemory,
  learnRumor,
  notePlayerHelped,
  notePlayerHurt,
  notePlayerTheftAudited,
  notePlayerTheftWitnessed,
  rememberRecentRumorLead,
  rememberRumor,
  type NpcMemory,
} from './npc_memory';

export interface RumorEventLike {
  id?: number;
  type?: string;
  time?: number;
  severity?: number;
  floor?: FloorLevel;
  zoneId?: number;
  roomId?: number;
  x?: number;
  y?: number;
  itemId?: string;
  monsterKind?: MonsterKind;
  actorId?: number;
  actorFaction?: Faction;
  targetId?: number;
  targetName?: string;
  privacy?: string;
  tags?: readonly string[];
  data?: Record<string, unknown>;
}

const RUMOR_TALK_COOLDOWN_S = 90;
const RUMOR_TICK_MINUTES = 7;
const MAX_RUMOR_EVENT_RECORDS = 32;
const MAX_RUMOR_EVENTS_PER_TALK = 6;
const RUMOR_EVENT_REPEAT_COOLDOWN_S = 240;
const RUMOR_EVENT_MAX_AGE_S = 6 * 60 * 60;

interface RumorEventRecord extends RumorEventLike {
  eventId: number;
  rumorId: string;
  observedAt: number;
  dedupeKey: string;
  priority: number;
}

const rumorEvents: RumorEventRecord[] = [];
let syntheticRumorEventId = 1_000_000;

export function selectRumorForNpc(npc: Entity, snapshot: ContextSnapshot, now: number): string | undefined {
  const memory = getNpcMemory(npc, now);
  if (now - memory.lastRumorAt < RUMOR_TALK_COOLDOWN_S && memory.knownRumorIds.length > 0) return undefined;

  if (memory.lastEventRumorId) {
    const eventRumor = findRumor(memory.lastEventRumorId);
    const eventRecord = rumorEvents.find(e => e.eventId === memory.lastRumorEventId && e.rumorId === eventRumor?.id);
    memory.lastEventRumorId = '';
    if (eventRumor && rumorAllowed(eventRumor, snapshot, memory)) {
      if (eventRecord && !rumorEventFresh(eventRecord, now)) return undefined;
      markRumorSpoken(npc, memory, eventRumor.id, now);
      return renderRumor(eventRumor, snapshot, memory, now, eventRecord);
    }
  }

  const screenRumor = selectScreenRumor(snapshot, memory);
  if (screenRumor) {
    markRumorSpoken(npc, memory, screenRumor.id, now);
    return renderRumor(screenRumor, snapshot, memory, now);
  }

  const preferred = preferredTopics(snapshot, memory);
  let best: RumorDef | undefined;
  let bestScore = -Infinity;
  for (const rumor of RUMORS) {
    if (!rumorAllowed(rumor, snapshot, memory)) continue;
    if (memory.knownRumorIds.includes(rumor.id)) continue;
    const score = scoreRumor(rumor, snapshot, memory, preferred);
    if (score > bestScore) {
      best = rumor;
      bestScore = score;
    }
  }
  if (!best) return undefined;
  markRumorSpoken(npc, memory, best.id, now);
  return renderRumor(best, snapshot, memory, now);
}

export function recordRumorEvent(event: WorldEvent | RumorEventLike): boolean {
  if (!isHighSignalRumorEvent(event)) return false;
  const rumorId = eventToStaticRumorId(event);
  if (!rumorId) return false;
  const eventId = typeof event.id === 'number' ? event.id : syntheticRumorEventId++;
  if (rumorEvents.some(e => e.eventId === eventId)) return false;
  const observedAt = event.time ?? 0;
  pruneRumorEvents(observedAt);
  const dedupeKey = rumorEventDedupeKey(event, rumorId);
  if (rumorEvents.some(e => e.dedupeKey === dedupeKey && rumorEventDuplicateFresh(e, observedAt))) return false;
  rumorEvents.push({
    ...event,
    eventId,
    rumorId,
    observedAt,
    dedupeKey,
    priority: rumorEventPriority(event),
    tags: event.tags ? [...event.tags] : [],
    data: event.data ? { ...event.data } : undefined,
  });
  trimRumorEventRecords();
  return true;
}

export function observeRecentRumorEventsForNpc(npc: Entity, snapshot: ContextSnapshot, now: number): number {
  const memory = getNpcMemory(npc, now);
  pruneRumorEvents(now);
  let best: RumorEventRecord | undefined;
  let bestScore = -Infinity;
  let scanned = 0;
  for (let i = rumorEvents.length - 1; i >= 0 && scanned < MAX_RUMOR_EVENTS_PER_TALK; i--) {
    const event = rumorEvents[i];
    if (event.eventId <= memory.lastRumorEventId) break;
    scanned++;
    if (!rumorEventFresh(event, now)) continue;
    if (!eventRelevantToNpc(event, snapshot)) continue;
    const score = event.priority + Math.min(8, rumorEvents.length - i);
    if (score > bestScore) {
      best = event;
      bestScore = score;
    }
  }
  if (!best) return 0;
  applyRumorEventToNpc(npc, best, now);
  return 1;
}

export function observeRumorEvent(npc: Entity, event: RumorEventLike, now: number): void {
  if ((event.severity ?? 0) < 2) return;
  const id = eventToStaticRumorId(event);
  const memory = getNpcMemory(npc, now);
  if (id && (memory.lastEventRumorId !== id || now - memory.lastEventRumorAt >= RUMOR_EVENT_REPEAT_COOLDOWN_S)) {
    applyRumorEventToNpc(npc, {
      ...event,
      eventId: event.id ?? syntheticRumorEventId++,
      rumorId: id,
      observedAt: now,
      dedupeKey: rumorEventDedupeKey(event, id),
      priority: rumorEventPriority(event),
    }, now);
  }
  if ((event.severity ?? 0) >= 4 && !isPlayerTheftEvent(event)) memory.fear = Math.min(100, memory.fear + 8);
}

function rumorEventFresh(event: RumorEventRecord, now: number): boolean {
  if (now <= 0 || event.observedAt <= 0) return true;
  return now - event.observedAt <= RUMOR_EVENT_MAX_AGE_S;
}

function rumorEventDuplicateFresh(event: RumorEventRecord, now: number): boolean {
  if (now <= 0 || event.observedAt <= 0) return true;
  return Math.abs(now - event.observedAt) < RUMOR_EVENT_REPEAT_COOLDOWN_S;
}

function pruneRumorEvents(now: number): void {
  if (now <= 0) return;
  for (let i = rumorEvents.length - 1; i >= 0; i--) {
    if (!rumorEventFresh(rumorEvents[i], now)) rumorEvents.splice(i, 1);
  }
}

function trimRumorEventRecords(): void {
  while (rumorEvents.length > MAX_RUMOR_EVENT_RECORDS) {
    let dropIdx = 0;
    for (let i = 1; i < rumorEvents.length; i++) {
      const current = rumorEvents[i];
      const drop = rumorEvents[dropIdx];
      if (current.priority < drop.priority || (current.priority === drop.priority && current.observedAt < drop.observedAt)) {
        dropIdx = i;
      }
    }
    rumorEvents.splice(dropIdx, 1);
  }
}

function rumorEventPriority(event: RumorEventLike): number {
  const type = event.type ?? '';
  let priority = (event.severity ?? 0) * 10;
  if (eventDataRumorId(event)) priority += 16;
  if (type.includes('samosbor') || type.startsWith('fog_')) priority += 12;
  if (type === 'item_stolen' || event.tags?.includes('theft')) priority += 10;
  if (type === 'contract_created' || type === 'quest_created') priority += 8;
  if (type.includes('complete') || type.includes('failed')) priority += 8;
  if ((type.includes('kill') || event.tags?.includes('monster')) && isRareMonsterKind(event.monsterKind)) priority += 12;
  if (event.privacy === 'public') priority += 3;
  if (event.privacy === 'secret' || event.privacy === 'private') priority -= 20;
  return priority;
}

function rumorEventDedupeKey(event: RumorEventLike, rumorId: string): string {
  const dataKey = eventDataDedupeKey(event);
  return [
    rumorId,
    event.type ?? '',
    event.floor ?? '',
    event.zoneId ?? '',
    event.roomId ?? '',
    event.itemId ?? '',
    event.monsterKind ?? '',
    dataKey,
  ].join('|');
}

function eventDataDedupeKey(event: RumorEventLike): string {
  const data = event.data;
  if (!data) return '';
  for (const key of ['contractId', 'questId', 'sideQuestId', 'factionEventId', 'outcome', 'reason']) {
    const value = data[key];
    if (typeof value === 'string' || typeof value === 'number') return `${key}:${value}`;
  }
  return '';
}

export function tickNpcRumorLowFrequency(npc: Entity, now: number, totalMinutes: number, samosborActive: boolean): boolean {
  const memory = getNpcMemory(npc, now);
  if (totalMinutes - memory.lastContextAt < RUMOR_TICK_MINUTES) return false;
  if (((totalMinutes | 0) + npc.id) % RUMOR_TICK_MINUTES !== 0) return false;

  memory.lastContextAt = totalMinutes;
  if (samosborActive) return learnRumor(npc, 'samosbor_vent_first', now);
  if (npc.hp !== undefined && npc.maxHp !== undefined && npc.hp < npc.maxHp * 0.5) {
    return learnRumor(npc, 'rare_bandage_med', now);
  }
  if ((npc.needs?.food ?? 100) < 20 || (npc.needs?.water ?? 100) < 20) {
    return learnRumor(npc, 'room_kitchen_empty', now);
  }
  return false;
}

function selectScreenRumor(snapshot: ContextSnapshot, memory: NpcMemory): RumorDef | undefined {
  if (snapshot.nearbyScreenRumorIds.length === 0) return undefined;
  let best: RumorDef | undefined;
  let bestScore = -Infinity;
  for (const id of snapshot.nearbyScreenRumorIds) {
    const rumor = findRumor(id);
    if (!rumor || !rumorAllowed(rumor, snapshot, memory)) continue;
    if (memory.knownRumorIds.includes(id)) continue;
    let score = 35 + stableNoise(id, memory.entityId);
    if (rumor.topic === 'monster') score += 8;
    if (rumor.lead) score += 6;
    if (score > bestScore) {
      best = rumor;
      bestScore = score;
    }
  }
  return best;
}

function rumorAllowed(rumor: RumorDef, snapshot: ContextSnapshot, memory: NpcMemory): boolean {
  if (memory.trustPlayer < rumor.minTrust) return false;
  if (snapshot.floor !== undefined && !rumor.floors.includes(snapshot.floor)) return false;
  if (isEventOnlyRumor(rumor) && memory.lastEventRumorId !== rumor.id) return false;
  return true;
}

function preferredTopics(snapshot: ContextSnapshot, memory: NpcMemory): RumorTopic[] {
  if (snapshot.samosborActive) return ['samosbor', 'monster', 'room'];
  if (snapshot.hasRecentPlayerTheft) return ['container', 'player_action', 'faction'];
  if (snapshot.hasRecentMetroEvent) return ['floor', 'room', 'rare_item'];
  if (snapshot.hasRecentFactionClash) return ['faction', 'monster', 'container'];
  if (snapshot.hasRecentMonsterKill) return ['monster', 'rare_item', 'floor'];
  if (snapshot.hasRecentContainerOpen) return ['container', 'rare_item', 'room'];
  if (snapshot.hasActiveContract) return ['contract', 'faction', 'monster'];
  if (snapshot.nearbyProduction) return ['economy', 'container', 'room'];
  if (snapshot.nearbyContainer) return ['container', 'economy', 'room'];
  if (snapshot.isDangerousZone || memory.fear > 65) return ['monster', 'samosbor', 'faction'];
  if (snapshot.isWounded || snapshot.isHungry || snapshot.isThirsty) return ['rare_item', 'room', 'faction'];
  if (memory.trustPlayer > 35) return ['player_action', 'floor', 'rare_item'];
  return ['room', 'faction', 'floor'];
}

function scoreRumor(rumor: RumorDef, snapshot: ContextSnapshot, memory: NpcMemory, preferred: RumorTopic[]): number {
  let score = 10;
  const prefIdx = preferred.indexOf(rumor.topic);
  if (prefIdx >= 0) score += 30 - prefIdx * 8;
  if (!memory.knownRumorIds.includes(rumor.id)) score += 12;
  if (memory.lastEventRumorId === rumor.id) score += 45;
  if (rumor.lead) score += 10;
  score += rumorRevealPriority(rumor.reveals);
  if (rumor.minTrust > 0 && memory.trustPlayer >= rumor.minTrust) score += 4;
  if (snapshot.zoneLevel !== undefined && snapshot.zoneLevel >= 6 && rumor.topic === 'monster') score += 10;
  if (snapshot.roomType !== undefined && rumor.topic === 'room') score += 8;
  score += stableNoise(rumor.id, memory.entityId);
  return score;
}

function markRumorSpoken(npc: Entity, memory: NpcMemory, rumorId: string, now: number): void {
  if (!rememberRumor(npc, rumorId, now)) memory.lastRumorAt = now;
}

function isEventOnlyRumor(rumor: RumorDef): boolean {
  return rumor.id.startsWith('event_');
}

function rumorRevealPriority(input: RumorDef['reveals']): number {
  if (!input) return 0;
  const reveals = Array.isArray(input) ? input : [input];
  let best = 0;
  for (const reveal of reveals) {
    let score = reveal.confidence;
    if (reveal.kind === 'danger' || reveal.kind === 'container') score += 3;
    else if (reveal.kind === 'item' || reveal.kind === 'monster' || reveal.kind === 'floor') score += 2;
    if (score > best) best = score;
  }
  return Math.min(10, best);
}

function renderRumor(
  rumor: RumorDef,
  snapshot: ContextSnapshot,
  memory: NpcMemory,
  now: number,
  event?: RumorEventRecord,
): string {
  const idx = Math.abs((memory.entityId * 31 + rumor.id.length * 17 + memory.knownRumorIds.length) | 0) % rumor.text.length;
  const text = fillSlots(rumor.text[idx], snapshot);
  const lead = formatLeadLine(rumor, event);
  if (lead) {
    rememberRecentLead(rumor, lead, now, event);
    return `${text} Зацепка: ${lead}.`;
  }
  const reveal = formatRevealLine(rumor.reveals);
  if (reveal) rememberRecentLead(rumor, reveal.slice('Зацепка: '.length).replace(/\.$/, ''), now, event);
  return reveal ? `${text} ${reveal}` : text;
}

const FLOOR_NAMES: Record<FloorLevel, string> = {
  [FloorLevel.MINISTRY]: 'Министерство',
  [FloorLevel.KVARTIRY]: 'Квартиры',
  [FloorLevel.LIVING]: 'Жилая зона',
  [FloorLevel.MAINTENANCE]: 'Коллекторы',
  [FloorLevel.HELL]: 'Ад',
  [FloorLevel.VOID]: 'Пустота',
};

const ROOM_TYPE_NAMES: Record<RoomType, string> = {
  [RoomType.LIVING]: 'жилая комната',
  [RoomType.KITCHEN]: 'кухня',
  [RoomType.BATHROOM]: 'санузел',
  [RoomType.STORAGE]: 'кладовая',
  [RoomType.MEDICAL]: 'медпункт',
  [RoomType.COMMON]: 'общая комната',
  [RoomType.PRODUCTION]: 'производственная',
  [RoomType.CORRIDOR]: 'коридор',
  [RoomType.SMOKING]: 'курилка',
  [RoomType.OFFICE]: 'кабинет',
  [RoomType.HQ]: 'штаб',
};

const FACTION_NAMES: Record<number, string> = {
  [Faction.CITIZEN]: 'жильцы',
  [Faction.LIQUIDATOR]: 'ликвидаторы',
  [Faction.CULTIST]: 'культисты',
  [Faction.SCIENTIST]: 'ученые',
  [Faction.WILD]: 'дикие',
  [Faction.PLAYER]: 'вы',
};

const ZONE_FACTION_NAMES: Record<number, string> = {
  0: 'жильцы',
  1: 'ликвидаторы',
  2: 'культисты',
  3: 'самосбор',
  4: 'дикие',
};

function formatRevealLine(input: RumorDef['reveals']): string {
  if (!input) return '';
  const reveals = Array.isArray(input) ? input : [input];
  if (reveals.length < 2 && !reveals.some(revealIsActionable)) return '';
  const parts: string[] = [];
  for (const reveal of reveals) {
    const part = formatReveal(reveal);
    if (part && !parts.includes(part)) parts.push(part);
  }
  return parts.length > 0 ? `Зацепка: ${parts.join(', ')}.` : '';
}

function revealIsActionable(reveal: RumorReveal): boolean {
  if (reveal.kind === 'danger' || reveal.kind === 'container') return true;
  if (reveal.confidence < 4) return false;
  return formatReveal(reveal).length > 0;
}

function formatLeadLine(rumor: RumorDef, event?: RumorEventRecord): string {
  if (rumor.lead) return formatStaticLead(rumor.lead);
  return event ? formatEventLead(event) : '';
}

function formatStaticLead(lead: RumorLead): string {
  const parts: string[] = [];
  if (lead.floor !== undefined) parts.push(FLOOR_NAMES[lead.floor]);
  if (lead.zoneHint) parts.push(lead.zoneHint);
  if (lead.roomName) parts.push(lead.roomName);
  else if (lead.roomType !== undefined) parts.push(ROOM_TYPE_NAMES[lead.roomType]);
  if (lead.itemId) {
    const itemName = ITEMS[lead.itemId]?.name.toLowerCase();
    if (itemName) parts.push(itemName);
  }
  if (lead.monsterKind !== undefined) parts.push(monsterTypeName(lead.monsterKind).toLowerCase());
  const prefix = parts.length > 0 ? `${parts.join(' / ')}: ` : '';
  return `${prefix}${lead.action}`;
}

function formatEventLead(event: RumorEventRecord): string {
  const parts: string[] = [];
  if (event.floor !== undefined) parts.push(FLOOR_NAMES[event.floor]);
  if (event.zoneId !== undefined) parts.push(`зона ${event.zoneId}`);
  if (event.roomId !== undefined) parts.push(`комната ${event.roomId}`);
  const resourceName = typeof event.data?.resourceName === 'string' ? event.data.resourceName : '';
  if (resourceName) parts.push(resourceName.toLowerCase());
  if (event.itemId) {
    const itemName = ITEMS[event.itemId]?.name.toLowerCase();
    if (itemName) parts.push(itemName);
  }
  if (event.monsterKind !== undefined) parts.push(monsterTypeName(event.monsterKind).toLowerCase());

  const action = eventLeadAction(event);
  if (!action && parts.length === 0) return '';
  return parts.length > 0 ? `${parts.join(' / ')}: ${action}` : action;
}

function eventLeadAction(event: RumorEventRecord): string {
  const type = event.type ?? '';
  if (type === 'samosbor_zone_captured') return 'обойди эту зону сейчас или проверь последствия после отбоя';
  if (type === 'fog_boss_spawned') return 'ищи укрытие и не входи в туман без патронов';
  if (type === 'fog_boss_killed') return 'проверь отступивший туман на лут и следы';
  if (type === 'smog_entered') return 'готовь фильтр или влажную ткань, либо обходи плотные комнаты';
  if (type === 'smog_source_found') return 'найди аппарат и перекрой источник, если есть инструмент';
  if (type === 'smog_source_handled') return 'проверь рассеявшийся смог на лут и свидетелей';
  if (type === 'room_produced_items') return 'проверь контейнер цеха, пока партию не разобрали';
  if (type === 'room_lacked_resources' || type === 'room_blocked_production') return 'неси сырье или ищи дефицитный ресурс рядом с цехом';
  if (event.tags?.includes('resource_shortage')) return 'сверь цены и оплату системных заданий: дефицит поднял давление';
  if (event.tags?.includes('resource_recovery')) return 'проверь торговцев и задания: часть давления спала';
  if (type === 'container_opened' || type === 'container_looted') return 'проверь контейнер и свидетелей, пока след свежий';
  if (type === 'item_stolen') return 'держись подальше от владельца контейнера или готовь объяснение';
  if (type === 'contract_created' || type === 'quest_created') return 'открой журнал заданий и подготовь вылазку';
  if (type === 'metro_wrong_stop') return 'ищи платформу 19 и не садись без билета';
  if (type === 'metro_route_taken') return 'проверь станцию ошибочной линии для следующего маршрута';
  if (type === 'elevator_anomaly' || type === 'elevator_loop_exit' || type === 'floor_transition') return 'ищи лифт и сверяй этаж перед выходом';
  if (type === 'faction_patrol_clash' || type === 'faction_relation_changed') return 'проверь зону столкновения на контроль, трофеи и свидетелей';
  if (type === 'player_kill_monster' || type === 'npc_kill_monster') return 'проверь место боя на редкий дроп';
  if (type === 'shelter_tally_handled') return 'спроси, кому ушла ведомость укрытых и кто оказался лишним в строках';
  if (type === 'player_sell_item' || type === 'player_handoff_item') return 'спроси, кому ушла проба и сохранилась ли пломба';
  if (type === 'player_destroy_item') return 'проверь, что открытый остаток не остался в инвентаре';
  return 'проверь место слуха, пока событие не стерли стены';
}

function rememberRecentLead(rumor: RumorDef, text: string, now: number, event?: RumorEventRecord): void {
  rememberRecentRumorLead({
    rumorId: rumor.id,
    text,
    heardAt: now,
    floor: rumor.lead?.floor ?? event?.floor,
    roomName: rumor.lead?.roomName,
    itemId: rumor.lead?.itemId ?? event?.itemId,
    monsterKind: rumor.lead?.monsterKind ?? event?.monsterKind,
  });
}

export function describeRumorReveal(reveal: RumorReveal): string {
  return formatReveal(reveal);
}

function formatReveal(reveal: RumorReveal): string {
  switch (reveal.kind) {
    case 'floor':
      return FLOOR_NAMES[reveal.floor];
    case 'zone':
      if (reveal.zoneId !== undefined) return `зона ${reveal.zoneId + 1}`;
      if (reveal.faction !== undefined) return `зона: ${ZONE_FACTION_NAMES[reveal.faction] ?? 'чужая'}`;
      return '';
    case 'room':
      return reveal.roomName ?? (reveal.roomType !== undefined ? ROOM_TYPE_NAMES[reveal.roomType] : '');
    case 'danger':
      return `опасность ${Math.max(1, Math.min(5, reveal.level | 0))}/5`;
    case 'monster':
      return reveal.monsterKind !== undefined ? monsterTypeName(reveal.monsterKind).toLowerCase() : '';
    case 'container':
      return reveal.name ?? (reveal.tag ? containerTagName(reveal.tag) : '');
    case 'item':
      return ITEMS[reveal.itemId]?.name.toLowerCase() ?? '';
    case 'faction':
      return reveal.faction !== undefined ? FACTION_NAMES[reveal.faction] ?? '' : '';
    case 'warning':
      return warningTagName(reveal.tag);
  }
}

function containerTagName(tag: string): string {
  switch (tag) {
    case 'locked_container':
    case 'locked':
      return 'запертый ящик';
    case 'weapon':
      return 'оружейный ящик';
    case 'medical':
      return 'медицинский шкаф';
    case 'chernobog':
      return 'досье ЧБ';
    case 'paper':
      return 'картотека';
    default:
      return humanizeTag(tag);
  }
}

const TAG_WORDS: Record<string, string> = {
  airlock: 'шлюз',
  armed: 'оружие',
  audit: 'ревизия',
  bad: 'плохая',
  batch: 'партия',
  betonov: 'Бетонов',
  black: 'черная',
  borrowed: 'заемный',
  boss: 'босс',
  chernobog: 'Чернобог',
  choir: 'хор',
  confiscation: 'конфискация',
  container: 'контейнер',
  contract: 'контракт',
  counterfeit: 'подделка',
  cult: 'культ',
  danger: 'опасность',
  debt: 'долг',
  done: 'закрыт',
  door: 'дверь',
  economy: 'экономика',
  external: 'внешняя',
  failed: 'провален',
  fair: 'честный',
  fog: 'туман',
  forged: 'подделка',
  green: 'зеленый',
  hand: 'ладонь',
  hidden: 'спрятано',
  idol: 'идол',
  istotit: 'Истотит',
  kostorez: 'косторез',
  lift: 'лифт',
  light: 'свет',
  liquidator: 'ликвидатор',
  lost: 'потеря',
  market: 'рынок',
  maronary: 'Маронарий',
  metro: 'метро',
  ministry: 'министерство',
  numbered: 'номерной',
  obzh: 'ОБЖ',
  player: 'игрок',
  pneumomail: 'пневмопочта',
  production: 'производство',
  quest: 'задание',
  quiet: 'тихий',
  ration: 'паек',
  recovery: 'восстановление',
  report: 'рапорт',
  rescue: 'спасение',
  samosbor: 'самосбор',
  school: 'школа',
  seal: 'пломба',
  sealed: 'гермодверь',
  shelter: 'укрытие',
  shortage: 'дефицит',
  silver: 'серебро',
  slime: 'слизь',
  social: 'социальный след',
  source: 'источник',
  steam: 'пар',
  stolen: 'украдено',
  tally: 'ведомость',
  theft: 'кража',
  trade: 'обмен',
  variant: 'вариант',
  veretar: 'Веретар',
  void: 'пустота',
  water: 'вода',
  weapon: 'оружие',
  white: 'белый',
  wild: 'дикие',
  window: 'окно',
  witness: 'свидетель',
  wrong: 'ошибка',
  zhelemish: 'желемыш',
};

function humanizeTag(tag: string): string {
  const parts = tag.split('_').filter(Boolean);
  if (parts.length === 0) return '';
  return parts.map(part => TAG_WORDS[part] ?? part).join(' ');
}

function warningTagName(tag: string): string {
  switch (tag) {
    case 'samosbor_warning':
      return 'риск самосбора';
    case 'sealed_door':
      return 'двери могут лгать';
    case 'airlock':
      return 'ищи шлюз';
    case 'danger':
      return 'опасный участок';
    case 'metro':
      return 'ошибка метро';
    case 'lift':
      return 'проверь лифт';
    case 'silver_slime':
      return 'прозрачная проба вызывает вопросы';
    case 'veretar_window_rescue':
      return 'свидетеля оттащили от белого окна';
    case 'veretar_window_seal':
      return 'белую щель заклеили';
    case 'veretar_window_curtain':
      return 'белое окно занавесили';
    case 'veretar_window_sample':
      return 'с белого подоконника взяли песок';
    case 'veretar_photo_taken':
      return 'засвеченный кадр вынесли из белого прохода';
    case 'veretar_window_lost':
      return 'белый обход забрал свидетеля';
    case 'false_lead':
      return 'ложная зацепка';
    case 'pneumomail':
      return 'пневмопочта шумит';
    default:
      return humanizeTag(tag);
  }
}

function fillSlots(text: string, snapshot: ContextSnapshot): string {
  let out = text;
  if (out.includes('{zone}')) out = out.split('{zone}').join(snapshot.zoneId === undefined ? 'этой зоне' : `зоне ${snapshot.zoneId}`);
  if (out.includes('{room}')) out = out.split('{room}').join(snapshot.roomName ?? 'этой комнате');
  return out;
}

function eventToStaticRumorId(event: RumorEventLike): string | undefined {
  const type = event.type ?? '';
  const dataRumor = eventDataRumorId(event);
  if (dataRumor) return dataRumor;
  const veretarWindowRumor = veretarWindowEventRumorId(event);
  if (veretarWindowRumor) return veretarWindowRumor;
  const factionRumor = factionEventRumorId(event);
  if (factionRumor) return factionRumor;
  const scarcityRumor = resourceScarcityEventRumorId(event);
  if (scarcityRumor) return scarcityRumor;
  if (type === 'contract_created' || type === 'quest_created') return contractEventRumorId(event);
  if (event.tags?.includes('false_safe_block')) return 'faction_cultist_after_fog';
  if (event.tags?.includes('metro') || event.type?.includes('metro')) return 'floor_metro_error_line';
  if (event.tags?.includes('variant_maronary')) return 'samosbor_maronary_variant';
  if (event.tags?.includes('wrong_door')) return 'samosbor_maronary_door';
  if (event.tags?.includes('variant_veretar')) return 'samosbor_veretar_variant';
  if (type === 'samosbor_zone_captured') return 'event_samosbor_zone_captured';
  if (type === 'fog_boss_spawned') return 'samosbor_electric_variant';
  if (type === 'fog_boss_killed') return 'event_fog_boss_killed';
  if (type.startsWith('smog_')) return 'player_seen_fog';
  if (type === 'room_produced_items') return 'event_factory_output';
  if (type === 'room_lacked_resources' || type === 'room_blocked_production') return 'event_factory_shortage';
  if (event.tags?.includes('ration_coupon_audit')) return 'ration_coupon_audit_reported';
  if (type.includes('samosbor') || event.tags?.includes('samosbor')) return 'samosbor_zone_lamps';
  if (type === 'item_deposited' && event.tags?.includes('resident_relief')) return 'faction_citizen_food';
  if (type === 'item_deposited' && (event.tags?.includes('evidence') || event.tags?.includes('sabotage'))) return 'faction_cultist_after_fog';
  if (type === 'item_stolen' || event.tags?.includes('theft')) return 'container_theft_seen';
  if (type === 'container_opened' || type === 'container_looted') return 'container_safe_whispers';
  const itemRumor = event.itemId ? itemEventRumorId(event.itemId) : undefined;
  if (itemRumor) return itemRumor;
  if (type === 'quest_completed' || (type.includes('contract') && type.includes('complete'))) return 'contract_completed';
  if (type === 'quest_failed' || (type.includes('contract') && (type.includes('fail') || type.includes('failed')))) return 'contract_failed';
  if (type === 'elevator_anomaly') return 'floor_lift_smell';
  if (type === 'elevator_loop_exit') return 'floor_pocket_rooms';
  if (type.includes('floor') || event.tags?.includes('floor_transition')) return 'event_floor_transition';
  if ((type.includes('kill') || event.tags?.includes('monster')) && isRareMonsterKind(event.monsterKind)) return 'event_rare_monster_kill';
  if (type.includes('kill') || event.tags?.includes('monster')) return 'player_kills_monsters';
  return undefined;
}

function isHighSignalRumorEvent(event: RumorEventLike): boolean {
  const type = event.type ?? '';
  if (eventDataRumorId(event)) return (event.severity ?? 0) >= 2;
  if (veretarWindowEventRumorId(event)) return (event.severity ?? 0) >= 2;
  if (event.tags?.includes('resource_shortage') || event.tags?.includes('resource_recovery')) return (event.severity ?? 0) >= 3;
  if (type === 'faction_event' || event.tags?.includes('faction_event')) return (event.severity ?? 0) >= 2;
  if (type === 'contract_created' || type === 'quest_created') return (event.severity ?? 0) >= 3;
  if (type === 'quest_failed' || type === 'contract_failed') return true;
  if (event.tags?.includes('ration_coupon_audit') || type.startsWith('ration_')) return true;
  if (type === 'metro_wrong_stop' || type === 'elevator_anomaly' || type === 'elevator_loop_exit') return true;
  if (event.tags?.includes('false_safe_block')) return (event.severity ?? 0) >= 3;
  if ((event.severity ?? 0) < 3) return false;
  if (type === 'samosbor_zone_captured' || type === 'fog_boss_spawned' || type === 'fog_boss_killed' || type.startsWith('smog_') || type === 'item_stolen') return true;
  if (type === 'item_deposited') return true;
  if (type === 'container_opened' || type === 'container_looted') return true;
  if (type === 'player_pick_item' && event.itemId !== undefined && itemEventRumorId(event.itemId) !== undefined) return true;
  if (
    (type === 'player_sell_item' || type === 'player_handoff_item' || type === 'player_destroy_item' || type === 'player_use_item')
    && event.itemId !== undefined
    && isSilverSlimeItem(event.itemId)
  ) return true;
  if (type === 'room_produced_items' || type === 'room_lacked_resources' || type === 'room_blocked_production') return true;
  if (type === 'quest_completed') return (event.severity ?? 0) >= 4;
  if (type.includes('contract') && (type.includes('complete') || type.includes('fail'))) return true;
  if (type.startsWith('monster_') && event.monsterKind === MonsterKind.KOSTOREZ) return true;
  if ((type === 'player_kill_monster' || event.tags?.includes('kill')) && isRareMonsterKind(event.monsterKind)) return true;
  if (type.includes('floor') || event.tags?.includes('floor_transition')) return true;
  return false;
}

function eventDataRumorId(event: RumorEventLike): string | undefined {
  const ids = event.data?.rumorIds;
  if (!Array.isArray(ids)) return undefined;
  for (const id of ids) {
    if (typeof id === 'string' && findRumor(id)) return id;
  }
  return undefined;
}

function veretarWindowEventRumorId(event: RumorEventLike): string | undefined {
  const sideQuestId = event.data?.sideQuestId;
  if (sideQuestId === 'ag95_pull_witness_from_window') return 'samosbor_veretar_window_rescue';
  if (sideQuestId === 'ag95_mark_white_shortcut') return 'samosbor_veretar_window_lost';
  const tags = event.tags ?? [];
  const depositOutcome = event.data?.depositOutcome;
  if (depositOutcome === 'veretar_window_curtained') return 'samosbor_veretar_window_curtained';
  if (depositOutcome === 'veretar_window_sealed') return 'samosbor_veretar_window_sealed';
  if (tags.includes('veretar_window_curtain')) return 'samosbor_veretar_window_curtained';
  if (tags.includes('veretar_window_seal')) return 'samosbor_veretar_window_sealed';
  if (tags.includes('veretar_window_shortcut') || tags.includes('veretar_window_lost')) return 'samosbor_veretar_window_lost';
  if (tags.includes('veretar_window_sample')) return event.itemId === 'overexposed_photo'
    ? 'samosbor_veretar_photo_taken'
    : 'samosbor_veretar_window_sampled';
  return undefined;
}

function contractEventRumorId(event: RumorEventLike): string {
  const tags = event.tags ?? [];
  if (tags.includes('void_contract')) return 'void_contracts_do_not_return';
  if (tags.includes('floor_ministry') || tags.includes('documents') || tags.includes('stealth')) return 'contract_admin_papers';
  if (tags.includes('combat') || tags.includes('kill') || tags.includes('ammo')) return 'contract_liquidator_board';
  return 'contract_created';
}

function resourceScarcityEventRumorId(event: RumorEventLike): string | undefined {
  const tags = event.tags ?? [];
  if (tags.includes('resource_recovery')) return 'economy_resource_recovered';
  if (!tags.includes('resource_shortage')) return undefined;
  switch (event.data?.resourceId) {
    case 'drink_water': return 'economy_water_price';
    case 'medicine': return 'economy_med_shortage';
    case 'food': return 'economy_kitchen_stock';
    case 'ammo': return 'contract_liquidator_board';
    case 'documents':
    case 'paper': return 'contract_admin_papers';
    default: return 'economy_resource_pressure';
  }
}

function itemEventRumorId(itemId: string): string | undefined {
  if (isSilverSlimeItem(itemId)) {
    return itemId === 'slime_sample_silver_open' ? 'silver_slime_used_suspicion' : 'slime_silver_sealed_trade';
  }
  const chernobogRumor = chernobogDocketItemRumorId(itemId);
  if (chernobogRumor) return chernobogRumor;
  switch (itemId) {
    case 'official_permit_slip': return 'lead_ministry_permit_office_slip';
    case 'forged_permit_slip': return 'rare_forged_permit_slip';
    case 'official_quarantine_clearance':
    case 'forged_quarantine_clearance': return 'rare_quarantine_clearance';
    case 'ration_registry_extract': return 'lead_kvartiry_ration_queue_registry';
    case 'elevator_access_order': return 'rare_elevator_order';
    case 'void_archive_warrant': return 'rare_void_archive_warrant';
    case 'quarantine_medcard': return 'lead_living_quarantine_medcard';
    case 'spore_print': return 'lead_living_mushroom_cellar_spores';
    case 'zhelemish_raw':
    case 'zhelemish_dried':
    case 'zhelemish_boiled': return 'lead_living_zhelemish_cellar';
    case 'liquidator_token': return 'lead_living_black_market_debt';
    case 'door_kit': return 'lead_living_obzh_door_kit';
    case 'archive_access_permit': return 'lead_ministry_raionsovet_permit';
    case 'stolen_archive_card': return 'lead_ministry_inspection_archive_card';
    case 'seal_wax': return 'lead_ministry_stamp_room_wax';
    case 'passport_stub': return 'lead_ministry_queue_hall_stub';
    case 'ballot': return 'lead_kvartiry_print_room_ballot';
    case 'pipe': return 'lead_kvartiry_barricade_pipe';
    case 'pressure_logbook': return 'lead_maintenance_pressure_logbook';
    case 'fuse': return 'lead_maintenance_steam_valves_fuse';
    case 'water_coupon': return 'lead_maintenance_watermeter_coupon';
    case 'flashlight': return 'lead_maintenance_diver_cache_flashlight';
    case 'metro_ticket': return 'lead_maintenance_metro_ticket';
    case 'pneumomail_capsule': return 'pneumomail_contraband_note';
    case 'concentrate_coupon': return 'lead_maintenance_concentrate_press_coupon';
    case 'valve_tag': return 'lead_maintenance_heatline_valve_tag';
    case 'siren_shard': return 'lead_hell_herald_threshold_shard';
    case 'bottled_voice': return 'lead_hell_contact_cell_voice';
    case 'meat_rune': return 'lead_hell_meat_rune_storage';
    case 'void_spike': return 'lead_void_protocol_chamber_spike';
    case 'maronary_shaving': return 'samosbor_maronary_shaving';
    case 'shelter_tally': return 'samosbor_istotit_shelter_tally';
    case 'forged_shelter_tally': return 'samosbor_istotit_tally_forged';
    case 'veretar_sand': return 'samosbor_veretar_sand';
    case 'overexposed_photo': return 'samosbor_veretar_photo';
    case 'bandage': return 'rare_bandage_med';
    case 'pills': return 'rare_pills_trade';
    case 'govnyak_roll':
    case 'govnyak_brick':
    case 'govnyak_sample': return 'govnyak_trade';
    case 'govnyak_bad_batch': return 'govnyak_bad_batch';
    case 'ammo_9mm': return 'lead_living_market_ammo';
    default: return undefined;
  }
}

function factionEventRumorId(event: RumorEventLike): string | undefined {
  const type = event.type ?? '';
  if (type !== 'faction_event' && !event.tags?.includes('faction_event')) return undefined;
  const factionEventId = typeof event.data?.factionEventId === 'string' ? event.data.factionEventId : '';
  const tags = event.tags ?? [];
  if (factionEventId === 'relief_caravan' || tags.includes('relief') || tags.includes('caravan')) return 'faction_citizen_food';
  if (factionEventId === 'cult_procession' || tags.includes('cult') || event.actorFaction === Faction.CULTIST) return 'faction_cultist_after_fog';
  if (factionEventId === 'wild_looters' || tags.includes('looters') || tags.includes('theft') || event.actorFaction === Faction.WILD) return 'faction_wild_kitchen';
  if (factionEventId === 'tax_raid' || tags.includes('tax')) return 'faction_liquidator_patrol';
  if (factionEventId === 'liquidator_sweep' || tags.includes('sweep') || event.actorFaction === Faction.LIQUIDATOR) return 'faction_liquidator_ammo';
  return 'faction_zone_border';
}

function isPlayerTheftEvent(event: RumorEventLike): boolean {
  const type = event.type ?? '';
  const playerEvent = event.actorFaction === Faction.PLAYER || event.actorId === 0;
  return playerEvent && (type === 'item_stolen' || event.tags?.includes('theft') === true);
}

function isRareMonsterKind(kind: MonsterKind | undefined): boolean {
  return kind === MonsterKind.BETONNIK
    || kind === MonsterKind.NIGHTMARE
    || kind === MonsterKind.SHADOW
    || kind === MonsterKind.REBAR
    || kind === MonsterKind.MATKA
    || kind === MonsterKind.MANCOBUS
    || kind === MonsterKind.HERALD
    || kind === MonsterKind.CREATOR
    || kind === MonsterKind.SHOVNIK
    || kind === MonsterKind.LAMPOVY
    || kind === MonsterKind.PECHATEED
    || kind === MonsterKind.TUBE_EEL
    || kind === MonsterKind.PARAGRAPH
    || kind === MonsterKind.NELYUD
    || kind === MonsterKind.KOSTOREZ;
}

function eventRelevantToNpc(event: RumorEventRecord, snapshot: ContextSnapshot): boolean {
  if (event.privacy === 'secret' || event.privacy === 'private') return false;
  if (snapshot.floor !== undefined && event.floor !== undefined && snapshot.floor !== event.floor) return false;
  if (event.zoneId !== undefined && snapshot.zoneId !== undefined) {
    if (event.zoneId === snapshot.zoneId) return true;
    return (event.severity ?? 0) >= 5 && event.privacy === 'public';
  }
  return event.privacy === 'public' || (event.severity ?? 0) >= 5 || event.type?.includes('floor') === true;
}

function applyRumorEventToNpc(npc: Entity, event: RumorEventRecord, now: number): void {
  flagEventRumor(npc, event.rumorId, event.eventId, now);
  const memory = getNpcMemory(npc, now);
  const type = event.type ?? '';
  const outcome = typeof event.data?.outcome === 'string' ? event.data.outcome : '';

  if (type === 'shelter_tally_handled') {
    if (outcome === 'give_residents') notePlayerHelped(npc, now, 1);
    else if (outcome === 'stolen') notePlayerTheftWitnessed(npc, now, 1);
    else if (outcome.includes('forged') || outcome === 'forge' || outcome === 'hide' || outcome.startsWith('sell_')) notePlayerHurt(npc, now, 1);
    memory.fear = Math.min(100, memory.fear + (outcome === 'give_residents' ? 2 : 5));
    return;
  }

  if (isPlayerTheftEvent(event)) {
    if (event.tags?.includes('audit') && !event.tags.includes('witnessed')) notePlayerTheftAudited(npc, now, 1);
    else notePlayerTheftWitnessed(npc, now, 1);
    return;
  }
  if (type === 'quest_completed' || type === 'contract_completed') {
    notePlayerHelped(npc, now, event.actorId === npc.id ? 2 : 1);
    return;
  }
  if (type === 'quest_failed' || type === 'contract_failed') {
    notePlayerHurt(npc, now, 1);
    return;
  }
  if (type === 'fog_boss_killed' || type === 'player_kill_monster') {
    notePlayerHelped(npc, now, 1);
    memory.fear = Math.min(100, memory.fear + 3);
    return;
  }
  if (type.includes('samosbor')) {
    memory.fear = Math.min(100, memory.fear + 8);
  }
}

function findRumor(id: string): RumorDef | undefined {
  for (const rumor of RUMORS) if (rumor.id === id) return rumor;
  return undefined;
}

function stableNoise(id: string, salt: number): number {
  let h = salt | 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  return Math.abs(h % 17);
}
