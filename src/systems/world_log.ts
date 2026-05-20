/* ── World log consumer: structured events → HUD/log strings ──── */

import {
  type GameState, type LogEntry, type Msg, type WorldEvent,
  MonsterKind,
} from '../core/types';

const LOG_MAX = 500;
const DEDUPE_SECONDS = 4;
const TELEMETRY_ONLY = new Set<string>([
  'ammo_consumed',
  'container_opened',
  'rumor_observed',
]);

function eventKey(e: WorldEvent): string {
  return `${e.type}|${e.actorId ?? -1}|${e.targetId ?? -1}|${e.zoneId ?? -1}|${e.itemId ?? ''}`;
}

function colorFor(e: WorldEvent): string {
  if (e.severity >= 5) return '#f4a';
  if (e.severity >= 4) return '#fa0';
  if (e.severity >= 3) return '#4af';
  return '#aaa';
}

function monsterName(kind?: MonsterKind): string {
  switch (kind) {
    case MonsterKind.SBORKA: return 'сборка';
    case MonsterKind.TVAR: return 'тварь';
    case MonsterKind.POLZUN: return 'ползун';
    case MonsterKind.BETONNIK: return 'бетонник';
    case MonsterKind.ZOMBIE: return 'мертвяк';
    case MonsterKind.EYE: return 'глаз';
    case MonsterKind.NIGHTMARE: return 'кошмарище';
    case MonsterKind.SHADOW: return 'теневик';
    case MonsterKind.REBAR: return 'арматура';
    case MonsterKind.MATKA: return 'матка';
    case MonsterKind.IDOL: return 'идол';
    case MonsterKind.MANCOBUS: return 'манкобус';
    case MonsterKind.HERALD: return 'вестник';
    case MonsterKind.CREATOR: return 'творец';
    case MonsterKind.SPIRIT: return 'дух';
    case MonsterKind.ROBOT: return 'робот';
    case MonsterKind.KOSTOREZ: return 'косторез';
    default: return 'монстр';
  }
}

function containerName(e: WorldEvent): string {
  const name = e.data?.containerName;
  return typeof name === 'string' ? name : `контейнер #${e.containerId ?? '?'}`;
}

function samosborWarningText(e: WorldEvent): string {
  if (e.tags.includes('aftermath')) {
    const title = typeof e.data?.beatTitle === 'string' ? e.data.beatTitle : 'след';
    return `Последствие самосбора: ${title}${e.itemName ? `, ${e.itemName}` : ''}.`;
  }
  const warning = e.data?.warning;
  if (typeof warning === 'string' && warning.length > 0) return warning;
  const floorName = typeof e.data?.floorName === 'string' ? e.data.floorName : '';
  const variantName = typeof e.data?.variantName === 'string' ? e.data.variantName : '';
  const zone = e.zoneId !== undefined ? `зона ${e.zoneId + 1}` : 'локальная зона';
  const place = floorName ? `${floorName}, ${zone}` : zone;
  return variantName
    ? `Предвестник самосбора: ${variantName}, ${place}.`
    : `Предвестник самосбора: ${place}.`;
}

function wrongDoorText(e: WorldEvent): string {
  switch (e.data?.phase) {
    case 'created':
      return 'Маронарий: отмечена неправильная дверь.';
    case 'used':
      return 'Неправильная дверь сработала. Выход изменён.';
    case 'expired':
      return 'Неправильная дверь погасла.';
    default:
      return 'Неправильная дверь активна на маршруте.';
  }
}

function factionRelationText(e: WorldEvent): string {
  const factionEventId = typeof e.data?.factionEventId === 'string' ? e.data.factionEventId : '';
  const action = typeof e.data?.processionAction === 'string' ? e.data.processionAction : '';
  const outcome = typeof e.data?.processionOutcome === 'string' ? e.data.processionOutcome : '';
  if (factionEventId === 'cult_procession') {
    if (action === 'avoid') return `Процессия Чернобога обойдена${e.zoneId !== undefined ? `: зона ${e.zoneId + 1}` : ''}.`;
    if (action === 'follow') return 'Вы прошли в хвосте процессии. Маршрут отмечен, ПСИ просело.';
    if (action === 'report') return 'Маршрут культовой процессии передан ликвидаторам по рации.';
    if (action === 'disguise' || action === 'cover') return 'Мясная метка сработала. Вас пропустили в хвост.';
    if (action === 'disrupt') return `Культовая процессия сорвана${e.zoneId !== undefined ? ` в зоне ${e.zoneId + 1}` : ''}.`;
    if (action === 'aftermath' && outcome.includes('самосбор')) return `Самосбор прервал культовую процессию${e.zoneId !== undefined ? `: зона ${e.zoneId + 1}` : ''}. Давление спало.`;
    if (action === 'aftermath' && outcome === 'сорвана') return `Давление сорванной процессии спало${e.zoneId !== undefined ? `: зона ${e.zoneId + 1}` : ''}.`;
    if (action === 'aftermath') return `Культовая процессия ${outcome || 'затихла'}${e.zoneId !== undefined ? `: зона ${e.zoneId + 1}` : ''}. Давление спало.`;
    return `Культовая процессия идёт${e.zoneId !== undefined ? ` в зоне ${e.zoneId + 1}` : ''}. Уступите коридор.`;
  }
  if (factionEventId) {
    const name = typeof e.data?.name === 'string' ? e.data.name : factionEventId;
    return `${name}${e.zoneId !== undefined ? `: зона ${e.zoneId + 1}` : ''}.`;
  }
  return `Фракционный сдвиг${e.zoneId !== undefined ? `: зона ${e.zoneId + 1}` : ''}.`;
}

function pneumomailText(e: WorldEvent): string {
  if (!e.tags.includes('pneumomail')) return '';
  const action = typeof e.data?.capsuleEvent === 'string' ? e.data.capsuleEvent : '';
  if (action === 'capsule_received') return `Пневмопочта: получена капсула${e.itemName ? `, ${e.itemName}` : ''}.`;
  if (action === 'capsule_sent') return `Пневмопочта: отправлена улика ${e.itemName ?? e.itemId ?? ''}.`;
  if (action === 'capsule_jammed') return `Пневмопочта: труба заклинена${e.itemName ? ` через ${e.itemName}` : ''}.`;
  if (action === 'capsule_intercepted') return `Пневмопочта: перехвачена ${e.itemName ?? 'капсула'}.`;
  if (action === 'capsule_reported') return 'Пневмопочта: вскрытие сдано в контроль.';
  return 'Пневмопочта: событие в журнале.';
}

function eventText(e: WorldEvent): string {
  const pneumomail = pneumomailText(e);
  if (pneumomail) return pneumomail;

  switch (e.type) {
    case 'samosbor_warning':
      return samosborWarningText(e);
    case 'samosbor_started':
      if (e.data?.variantId === 'maronary') return `Маронарий начался${e.zoneId !== undefined ? `: зона ${e.zoneId + 1}` : ''}. Не проверяйте дверь взглядом.`;
      return `Самосбор начался${e.zoneId !== undefined ? `: зона ${e.zoneId + 1}` : ''}. Ищите гермодверь.`;
    case 'samosbor_zone_captured':
      return `Зона ${e.zoneId !== undefined ? e.zoneId + 1 : '?'} под самосбором. Карта устарела.`;
    case 'samosbor_ended':
      return 'Отбой самосбора. Проверьте карту и двери.';
    case 'hermodoor_borer_detected':
      return `Гермоточильщик у двери: ${String(e.data?.roomName ?? 'укрытие')}. Есть время среагировать.`;
    case 'hermodoor_borer_damage':
      return `Гермодверь повреждена: ${String(e.data?.roomName ?? 'укрытие')}.`;
    case 'hermodoor_borer_repaired':
      return `Гермодверь отремонтирована: ${String(e.data?.roomName ?? 'укрытие')}.`;
    case 'hermodoor_borer_compromised':
      return `Укрытие скомпрометировано: ${String(e.data?.roomName ?? 'укрытие')}.`;
    case 'fog_boss_spawned':
      return `Босс тумана появился${e.zoneId !== undefined ? ` в зоне ${e.zoneId + 1}` : ''}.`;
    case 'fog_boss_killed':
      return `Босс тумана уничтожен${e.zoneId !== undefined ? ` в зоне ${e.zoneId + 1}` : ''}.`;
    case 'smog_entered':
      return `Смог${e.zoneId !== undefined ? ` в зоне ${e.zoneId + 1}` : ''}. Нужен фильтр, ткань или обход.`;
    case 'smog_source_found':
      return `Источник смога найден${e.zoneId !== undefined ? ` в зоне ${e.zoneId + 1}` : ''}. Его можно перекрыть.`;
    case 'smog_source_handled':
      return `Источник смога перекрыт${e.zoneId !== undefined ? ` в зоне ${e.zoneId + 1}` : ''}.`;
    case 'monster_sighted':
      return `${e.actorName ?? 'Косторез'} заметил цель. Замах будет виден.`;
    case 'monster_windup_interrupted':
      return `${e.actorName ?? 'Косторез'} сбит во время замаха.`;
    case 'monster_armor_cut':
      return e.tags.includes('armor_cut')
        ? `${e.actorName ?? 'Косторез'} срезал бронелист.`
        : `${e.actorName ?? 'Косторез'} провел режущий удар.`;
    case 'monster_escaped':
      return `${e.targetName ?? 'Цель'} ушла из-под замаха Костореза.`;
    case 'metro_route_taken':
      return `Метро: ${String(e.data?.routeLabel ?? 'маршрут')} -> ${String(e.data?.destinationLabel ?? 'остановка')}.`;
    case 'metro_wrong_stop':
      return `Метро ошиблось: ${String(e.data?.routeLabel ?? 'маршрут')} -> ${String(e.data?.destinationLabel ?? 'чужая остановка')}.`;
    case 'rail_train_boarded':
      return `Поезд: посадка в ${String(e.data?.trainLabel ?? 'состав')}.`;
    case 'rail_train_exited':
      return `Поезд: выход из ${String(e.data?.trainLabel ?? 'состава')}.`;
    case 'rail_train_crush':
      return `Поезд задавил: ${e.actorName ?? 'цель'}.`;
    case 'rumor_observed':
      if (e.tags.includes('false_safe_block')) return 'Тихий блок раскрыт: нет сирены, есть культовая метка.';
      return `${e.actorName ?? 'Кто-то'} заметил слух.`;
    case 'player_pick_item':
      return `Подобрано: ${e.itemName ?? e.itemId ?? 'предмет'}${e.itemCount && e.itemCount > 1 ? ` x${e.itemCount}` : ''}.`;
    case 'player_drop_item':
      return `Выброшено: ${e.itemName ?? e.itemId ?? 'предмет'}${e.itemCount && e.itemCount > 1 ? ` x${e.itemCount}` : ''}.`;
    case 'player_use_item':
      if (e.tags.includes('false_safe_block') && e.tags.includes('marker_resolved')) return 'Черная ладонь снята. Тихий блок снова обычный.';
      return `Использовано: ${e.itemName ?? e.itemId ?? 'предмет'}.`;
    case 'player_destroy_item':
      return `Уничтожено: ${e.itemName ?? e.itemId ?? 'предмет'}.`;
    case 'player_sell_item':
      if (e.tags.includes('govnyak')) return `Говняк продан${e.targetName ? ` -> ${e.targetName}` : ''}. Долг перенесён.`;
      return `Продано: ${e.itemName ?? e.itemId ?? 'предмет'}${e.targetName ? ` -> ${e.targetName}` : ''}.`;
    case 'player_handoff_item':
      if (e.tags.includes('govnyak') && e.tags.includes('confiscation')) return `Говняк сдан ликвидатору${e.targetName ? ` -> ${e.targetName}` : ''}.`;
      if (e.tags.includes('govnyak')) return `Говняк куплен${e.targetName ? ` у ${e.targetName}` : ''}. Проверьте долг.`;
      return `Передано: ${e.itemName ?? e.itemId ?? 'предмет'}${e.targetName ? ` -> ${e.targetName}` : ''}.`;
    case 'player_status_applied':
      if (e.data?.statusId === 'zhelemish_skin') return 'Желемышная кожа включена: защита, расход воды и ПСИ.';
      if (String(e.data?.statusId ?? '').startsWith('govnyak_')) return 'Говняк подействовал. Долг растёт.';
      return 'Временное состояние получено.';
    case 'player_status_bad_reaction':
      if (e.data?.statusId === 'zhelemish_skin') return 'Желемыш дал плохую реакцию: вода и ПСИ просели.';
      if (String(e.data?.statusId ?? '').startsWith('govnyak_')) return 'Гремучий говняк сорвался: кашель, шум и долг.';
      return 'Плохая реакция на временное состояние.';
    case 'player_status_cured':
      if (e.data?.statusId === 'zhelemish_skin') return 'Желемышная кожа снята лекарством.';
      if (e.data?.statusId === 'govnyak_debt') return 'Говнячный долг снят. Прицел стабилен.';
      return 'Временное состояние снято.';
    case 'player_status_expired':
      if (e.data?.statusId === 'zhelemish_skin') return 'Желемышная кожа высохла и отвалилась.';
      if (String(e.data?.statusId ?? '').startsWith('govnyak_')) return 'Говнячный кашель отпустил.';
      return 'Временное состояние прошло.';
    case 'tool_broke':
      return `Сломано: ${e.itemName ?? e.itemId ?? 'инструмент'}.`;
    case 'player_kill_monster':
      if (e.data?.monsterVariantId === 'betonoed') return 'Бетоноед добит. Слабая стена в безопасности.';
      return `Убит ${e.targetName ?? monsterName(e.monsterKind)}.`;
    case 'player_kill_npc':
      return `Убит жилец: ${e.targetName ?? 'без имени'}. Репутация снижена.`;
    case 'npc_kill_monster':
      return `${e.actorName ?? 'NPC'} убил ${monsterName(e.monsterKind)}.`;
    case 'npc_kill_npc':
      return `${e.actorName ?? 'NPC'} убил ${e.targetName ?? 'NPC'}.`;
    case 'quest_created':
      return `Принято задание: ${e.targetName ?? e.data?.desc ?? 'без описания'}.`;
    case 'quest_completed':
      return `Задание выполнено: ${e.targetName ?? e.data?.desc ?? 'без описания'}.`;
    case 'quest_failed':
      return `Задание провалено: ${e.targetName ?? e.data?.reason ?? 'срок вышел'}.`;
    case 'contract_created':
      return `Системное задание принято: ${e.targetName ?? e.data?.contractId ?? 'без номера'}.`;
    case 'contract_completed':
      if (e.tags.includes('cleanup_completed')) return `Зачистка завершена: ${e.targetName ?? e.data?.contractId ?? 'без номера'}.`;
      return `Системное задание закрыто: ${e.targetName ?? e.data?.contractId ?? 'без номера'}.`;
    case 'contract_failed':
      return `Системное задание сорвалось: ${e.data?.reason ?? 'отказ окна'}.`;
    case 'ration_coupon_spent':
      return `Талон погашен: ${e.itemName ?? e.itemId ?? 'пайковый документ'}. Паёк выдан.`;
    case 'ration_coupon_stolen':
      return `Украдены талоны: ${e.itemName ?? e.itemId ?? 'пайковая бумага'}. Запущен пайковый аудит.`;
    case 'ration_coupon_forged':
      return `Подделан пайковый документ: ${e.itemName ?? e.itemId ?? 'карточка'}. Риск ревизии.`;
    case 'ration_coupon_reported':
      return `Пайковая махинация сдана: ${e.itemName ?? e.itemId ?? 'улика'}. Очередь пересчитает пайки.`;
    case 'ration_audit_resolved':
      if (e.data?.outcome === 'black_market_sale') return 'Пайковая карточка продана на рынок.';
      return 'Пайковая ревизия закрыта. Министерство и очередь сверили списки.';
    case 'container_opened':
      if (e.tags.includes('false_safe_block')) return `Открыт запас тихого блока: ${containerName(e)}.`;
      if (e.tags.includes('quarantine')) return `Карантин открыт: ${containerName(e)}.`;
      return `Открыт контейнер: ${containerName(e)}.`;
    case 'item_stolen':
      if (e.tags.includes('false_safe_block')) return `Чужой запас тихого блока взят: ${e.itemName ?? e.itemId ?? 'предмет'}. Метка активна.`;
      if (e.tags.includes('quarantine')) return `Карантин нарушен: ${e.itemName ?? e.itemId ?? 'предмет'} вынесли из ${containerName(e)}.`;
      if (e.tags.includes('witnessed')) return `Кражу заметили: ${e.itemName ?? e.itemId ?? 'предмет'} из ${containerName(e)}.`;
      if (e.tags.includes('audit')) return `Кража попадёт в ревизию: ${e.itemName ?? e.itemId ?? 'предмет'} из ${containerName(e)}.`;
      return `Кража: ${e.itemName ?? e.itemId ?? 'предмет'}.`;
    case 'item_deposited':
      if (e.tags.includes('resident_relief')) return `Запас возвращён жильцам: ${e.itemName ?? e.itemId ?? 'предмет'} в ${containerName(e)}.`;
      if (e.tags.includes('evidence')) return `Доказательство подброшено: ${e.itemName ?? e.itemId ?? 'предмет'} в ${containerName(e)}.`;
      if (e.tags.includes('sabotage')) return `Запас испорчен: ${e.itemName ?? e.itemId ?? 'предмет'} в ${containerName(e)}.`;
      return `Положено в контейнер: ${e.itemName ?? e.itemId ?? 'предмет'}.`;
    case 'room_produced_items':
      return `Цех выдал: ${e.itemName ?? e.itemId ?? 'партия'}${e.itemCount && e.itemCount > 1 ? ` x${e.itemCount}` : ''}.`;
    case 'room_lacked_resources':
      return `Цех встал: не хватает сырья${e.roomId !== undefined ? ` в комнате #${e.roomId}` : ''}.`;
    case 'room_blocked_production':
      return `Цех заблокирован: ${String(e.data?.blockedReason ?? 'нет места')}.`;
    case 'hazard_trapped':
      return `${e.actorName ?? 'Кто-то'} застрял в ${String(e.data?.hazardName ?? 'опасность')}.`;
    case 'hazard_escaped':
      return `${e.actorName ?? 'Кто-то'} вышел из ${String(e.data?.hazardName ?? 'липкой зоны')}${e.data?.noisy ? ', шумно' : ''}.`;
    case 'hazard_cleaned':
      return `${String(e.data?.hazardName ?? 'Опасность')} очищена: ${String(e.data?.cleanedCells ?? '?')} клет.`;
    case 'burn_cleanup':
      return `Огонь зачистил остаток: ${String(e.data?.cleanedHazardCells ?? '?')} клет.`;
    case 'fuel_empty':
      return 'Огнемёт сухой: бензин кончился.';
    case 'collateral_damage':
      return `Огонь испортил: ${e.itemName ?? e.itemId ?? 'предмет'}.`;
    case 'rumor_spread':
      return `${e.actorName ?? 'Кто-то'} передал слух.`;
    case 'faction_event':
      return factionRelationText(e);
    case 'faction_patrol_clash':
      return `Патрули столкнулись${e.zoneId !== undefined ? ` в зоне ${e.zoneId + 1}` : ''}.`;
    case 'faction_relation_changed':
      return factionRelationText(e);
    case 'floor_transition':
      if (e.tags.includes('false_safe_block')) return 'Переход: тихий блок. Сирены нет.';
      return `Переход: ${e.targetName ?? 'другой этаж'}.`;
    case 'door_opened':
      if (e.tags.includes('betonoed') && e.tags.includes('wall_breached')) return 'Бетоноед вскрыл слабую стену. Короткий ход открыт.';
      if (e.tags.includes('betonoed') && e.tags.includes('shortcut_used')) return 'Ход Бетоноеда использован как короткий маршрут.';
      if (e.tags.includes('wrong_door')) return wrongDoorText(e);
      return `Дверь открылась${e.zoneId !== undefined ? ` в зоне ${e.zoneId + 1}` : ''}.`;
    case 'door_sealed':
      if (e.tags.includes('betonoed')) return 'Проход Бетоноеда запечатан.';
      return 'Проход запечатан.';
    case 'death_seen':
      if (e.tags.includes('betonoed') && e.tags.includes('driven_off')) return 'Бетоноед отогнан от слабой стены.';
      return `${e.targetName ?? 'Смерть'} замечена.`;
    case 'paritel_valve_changed':
      return `Паровой мост: давление ${String(e.data?.pressure ?? '?')}/3.`;
    case 'paritel_bridge_crossed':
      return 'Паровой мост пройден.';
    case 'paritel_threat_neutralized':
      return 'Паритель нейтрализован.';
    case 'paritel_steam_injury':
      return 'Паровой мост обжёг игрока.';
    case 'paritel_steam_avoided':
      return 'Паровой мост обойден без прямого ожога.';
    case 'lift_arachna_warned':
      return 'Лифт: над шахтой скребет лифтовая арахна. Смотрите вверх или отходите.';
    case 'lift_arachna_sprung':
      return e.tags.includes('baited_drop')
        ? 'Лифтовая арахна сорвалась на шум и промахнулась.'
        : 'Лифтовая арахна упала из шахты.';
    case 'lift_arachna_avoided':
      return 'Лифтовая арахна не упала. Шахта тиха.';
    case 'lift_arachna_cleared':
      return 'Лифтовая арахна очищена. У лифта стало тише.';
    default:
      return `${e.type}${e.zoneId !== undefined ? ` (зона ${e.zoneId + 1})` : ''}.`;
  }
}

function shouldLog(e: WorldEvent): boolean {
  if (e.tags.includes('pneumomail')) return e.severity >= 2;
  if (e.tags.includes('false_safe_block')) return e.severity >= 3;
  if (TELEMETRY_ONLY.has(e.type) && !(e.type === 'container_opened' && e.tags.includes('quarantine'))) return false;
  if (e.privacy === 'secret' || e.privacy === 'private') {
    return e.severity >= 2 && (e.actorName === 'Вы' || e.actorId === 0);
  }
  return e.severity >= 3 || e.type.startsWith('quest_') || e.type.startsWith('contract_') || e.type.startsWith('samosbor_') || e.type.startsWith('fog_boss_') || e.type.startsWith('smog_') || e.type.startsWith('monster_') || e.type.startsWith('metro_') || e.type.startsWith('rail_train_') || e.type.startsWith('hazard_') || e.type.startsWith('paritel_');
}

function shouldHud(e: WorldEvent): boolean {
  if (!shouldLog(e)) return false;
  if (e.type === 'ammo_consumed') return false;
  return e.severity >= 3 || e.tags.includes('pneumomail') || e.type.startsWith('quest_') || e.type.startsWith('samosbor_') || e.type.startsWith('fog_boss_') || e.type.startsWith('smog_') || e.type.startsWith('monster_') || e.type.startsWith('metro_') || e.type.startsWith('rail_train_') || e.type.startsWith('hazard_') || e.type.startsWith('paritel_');
}

function pushLog(state: GameState, entry: LogEntry): void {
  state.msgLog.push(entry);
  if (state.msgLog.length > LOG_MAX) state.msgLog.splice(0, state.msgLog.length - LOG_MAX);
}

export function recordWorldLogEvent(state: GameState, event: WorldEvent): void {
  if (!state.worldEvents || !shouldLog(event)) return;
  const key = eventKey(event);
  if (state.worldEvents.lastLogKey === key && event.time - state.worldEvents.lastLogTime < DEDUPE_SECONDS && event.severity < 5) {
    return;
  }
  state.worldEvents.lastLogKey = key;
  state.worldEvents.lastLogTime = event.time;

  const text = eventText(event);
  const color = colorFor(event);
  const entry: LogEntry = { text, color, day: event.day, hour: event.hour, minute: event.minute };
  pushLog(state, entry);

  if (shouldHud(event)) {
    const hud: Msg = { text, color, time: event.time, day: event.day, hour: event.hour, minute: event.minute };
    state.msgs.push(hud);
  }
}
