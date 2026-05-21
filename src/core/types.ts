/* ── ГИГАХРУЩ — core type definitions ─────────────────────────── */

export const W = 1024;           // toroidal world size
export const TEX = 64;           // texture size (px)
export const MAX_DRAW = 40;      // max raycaster distance
export const TICK_S = 1 / 60;    // seconds per logic tick

// ── Cells ────────────────────────────────────────────────────────
export const enum Cell {
  FLOOR   = 0,
  WALL    = 1,
  DOOR    = 2,
  ABYSS   = 3,
  LIFT    = 4,
  WATER   = 5,
}



// ── Texture indices ──────────────────────────────────────────────
export const enum Tex {
  CONCRETE  = 0,
  BRICK     = 1,
  PANEL     = 2,
  TILE_W    = 3,
  METAL     = 4,
  ROTTEN    = 5,
  CURTAIN   = 6,
  DARK      = 7,
  // floors 8-15
  F_CONCRETE = 8,
  F_LINO     = 9,
  F_TILE     = 10,
  F_WOOD     = 11,
  F_CARPET   = 12,
  // ceiling
  CEIL       = 13,
  // doors
  DOOR_WOOD  = 14,
  DOOR_METAL = 15,
  // abyss
  F_ABYSS    = 16,
  // lift
  LIFT_DOOR  = 17,
  // maintenance
  PIPE       = 18,
  F_WATER    = 19,
  // hell
  MEAT       = 20,
  F_MEAT     = 21,
  // start room
  DESK       = 22,
  SLIDE_1    = 23,
  SLIDE_2    = 24,
  SLIDE_3    = 25,
  SLIDE_4    = 26,
  SLIDE_5    = 27,
  SLIDE_6    = 28,
  SLIDE_7    = 29,
  SLIDE_8    = 30,
  TARGET     = 31,
  // keybind hint posters (tutorial room) — 2 hints per texture + lore poster
  HINT_1 = 32, HINT_2 = 33, HINT_3 = 34, HINT_4 = 35,
  HINT_5 = 36, HINT_6 = 37, HINT_7 = 38, HINT_LORE = 39,
  HERMO_WALL = 40,
  GUT        = 41,
  F_GUT      = 42,
  VOID_WALL  = 43,
  F_VOID     = 44,
  PORTAL     = 45,
  CROSS      = 46,
  ICON       = 47,
  // ministry (stalinist empire)
  MARBLE          = 48,
  F_RED_CARPET    = 49,
  F_GREEN_CARPET  = 50,
  F_MARBLE_TILE   = 51,
  // portraits — 64 procedural variants (coordinate-hash like posters)
  PORTRAIT_BASE   = 52,  // 64 procedural portraits: 52..115
  // agitprop posters — 64 procedural variants
  POSTER_BASE     = 116, // 64 procedural posters: 116..179
  // parquet floor
  F_PARQUET       = 180,
  // red carpet edge-aware tiling: 16 variants by 4-bit edge mask (NESW)
  F_CARPET_EDGE_BASE = 181, // 16 variants: 181..196
  // procedural wall-mounted screens: 8 program variants × 4 animation frames
  SCREEN_BASE     = 197, // 32 variants: 197..228
  COUNT           = 229,
}

// ── Floor levels (Z-axis) ────────────────────────────────────────
export enum FloorLevel {
  MINISTRY     = 0,   // министерство (-2) — сталинский ампир, чиновники, ковры
  KVARTIRY     = 1,   // квартиры (-1) — плотная жилая зона, 5к гражданских, протесты
  LIVING       = 2,   // жилая зона (0) — квартиры, цеха, залы
  MAINTENANCE  = 3,   // коллекторы — трубы, туннели, каналы с водой
  HELL         = 4,   // ад — мясо, постоянный самосбор, культисты
  VOID         = 5,   // пустота — абстрактный фрактальный уровень, финальный босс
}

// ── Lift direction ───────────────────────────────────────────────
export const enum LiftDirection {
  DOWN = 0,   // ведёт на этаж ниже
  UP   = 1,   // ведёт на этаж выше
}

// ── Rooms ────────────────────────────────────────────────────────
export enum RoomType {
  LIVING,      // personal room — sleep, hide
  KITCHEN,     // eat, drink
  BATHROOM,    // toilet, shower
  STORAGE,     // items
  MEDICAL,     // healing
  COMMON,      // hall
  PRODUCTION,  // work
  CORRIDOR,    // passage
  SMOKING,     // курилка — free time
  OFFICE,      // бухгалтерия — paperwork
  HQ,          // штаб фракции — spawn + охрана
}

export interface Room {
  id: number;
  type: RoomType;
  x: number; y: number; w: number; h: number;
  doors: number[];          // door cell indices
  sealed: boolean;          // hermetically sealed during samosbor
  name: string;
  apartmentId: number;      // -1 = not apartment
  wallTex: Tex;
  floorTex: Tex;
}

// ── Cell features (one per cell) ─────────────────────────────────
export const enum Feature {
  NONE         = 0,
  LAMP         = 1,
  TABLE        = 2,
  CHAIR        = 3,
  BED          = 4,
  STOVE        = 5,
  SINK         = 6,
  TOILET       = 7,
  SHELF        = 8,
  MACHINE      = 9,
  APPARATUS    = 10,
  LIFT_BUTTON  = 11,
  DESK         = 12,
  SLIDE        = 13,
  CANDLE       = 14,
  SCREEN       = 15,
}

// ── Doors ────────────────────────────────────────────────────────
export enum DoorState {
  OPEN,
  CLOSED,
  LOCKED,
  HERMETIC_OPEN,
  HERMETIC_CLOSED,
}

export interface Door {
  idx: number;             // cell index
  state: DoorState;
  roomA: number;           // room id or -1
  roomB: number;
  keyId: string;           // item def id needed ("" = no key)
  timer: number;           // auto-close timer
}

// ── Entities ─────────────────────────────────────────────────────
export enum EntityType { PLAYER, NPC, MONSTER, ITEM_DROP, PROJECTILE }

/** Special projectile behaviour tags */
export enum ProjType {
  NORMAL,       // default: straight-line, single-hit
  GRENADE,      // arc physics, explodes on timer/impact, scorch decal
  FLAME,        // short range, leaves fire trail on floor
  BFG,          // slow orb, on impact huge AoE + green screen flash
  BEAM,         // continuous beam (psi kamehameha)
}

export enum MonsterKind {
  SBORKA,     // fast, weak               — бегает быстро
  TVAR,       // medium                   — ходит за стенами
  POLZUN,     // slow, strong, creepy     — вылезает из-под пола
  BETONNIK,   // rare boss, very strong   — бетонная тварь
  ZOMBIE,     // humanoid undead          — мертвяк
  EYE,        // flying eye, ranged       — глаз (стреляет)
  NIGHTMARE,  // procedural horror        — кошмарище
  SHADOW,     // dark silhouette          — теневик
  REBAR,      // inorganic rebar monster  — арматура
  MATKA,      // spawner boss             — матка
  IDOL,       // immobile psi monolith    — идол
  MANCOBUS,   // fat boss controller      — манкобус (управляет тварями)
  HERALD,     // thin tree-like watcher   — вестник (свисающие глаза)
  CREATOR,    // final boss               — творец (белый силуэт)
  SPIRIT,     // ghostly skull face       — дух (летает сквозь стены)
  ROBOT,      // industrial automaton     — робот (стреляет плазмой)
  SHOVNIK,    // seam hunter              — шовник (сильнее у стен)
  LAMPOVY,    // light-fed threat         — ламповый (сильнее у ламп)
  PECHATEED,  // document eater           — печатеед (чует бумаги)
  TUBE_EEL,   // water/pipe ambusher      — трубный угорь (быстрее в воде)
  PARAGRAPH,  // hostile document         — параграф (дальний бой)
  NELYUD,     // false human              — нелюдь (ждёт близкой дистанции)
  KRYSNOZHKA, // food/garbage swarm       — крысоножка (идёт на приманку)
  KOSTOREZ,   // melee elite              — косторез (читабельный рывок)
  SAFEGUARD,  // NET/BLAME blade guard    — сейфгард (быстрый охранитель)
}

export type PlayerDamageSourceKind = 'monster' | 'npc' | 'projectile' | 'hazard' | 'need' | 'samosbor' | 'void' | 'unknown';

export interface PlayerDamageRecord {
  time: number;
  tick: number;
  amount: number;
  sourceKind: PlayerDamageSourceKind;
  sourceId?: number;
  sourceName: string;
  monsterKind?: MonsterKind;
  weaponId?: string;
  detail: string;
}

// ── Factions ─────────────────────────────────────────────────────
export enum Faction {
  CITIZEN,     // граждане
  LIQUIDATOR,  // ликвидаторы
  CULTIST,     // культисты
  SCIENTIST,   // учёные
  WILD,        // дикие
  PLAYER,      // игрок (отдельная фракция в системе отношений)
}

// ── Zone control factions ────────────────────────────────────────
export enum ZoneFaction {
  CITIZEN,     // граждане
  LIQUIDATOR,  // ликвидаторы
  CULTIST,     // культисты
  SAMOSBOR,    // самосбор (захваченная зона)
  WILD,        // дикие
}

// ── Zones (64 macro-regions ~128×128) ────────────────────────────
export interface Zone {
  id: number;
  cx: number; cy: number;     // center cell
  faction: ZoneFaction;
  hasLift: boolean;
  fogged: boolean;            // фиолетовый туман active
  level: number;              // zone danger level (scales monsters & loot)
  hqRoomId: number;           // room id of faction HQ in this zone (-1 = none)
}

// ── Occupations ──────────────────────────────────────────────────
export enum Occupation {
  HOUSEWIFE,   // домохозяйка
  LOCKSMITH,   // слесарь
  SECRETARY,   // секретарь
  ELECTRICIAN, // электрик
  COOK,        // повар
  DOCTOR,      // врач
  TURNER,      // токарь
  MECHANIC,    // механик
  STOREKEEPER, // кладовщик
  ALCOHOLIC,   // алкоголик
  SCIENTIST,   // учёный
  CHILD,       // ребёнок
  DIRECTOR,    // директор
  TRAVELER,    // путник — бродит по лабиринту
  PILGRIM,     // паломник — бродит по лабиринту (культист)
  HUNTER,      // охотник — бродит по лабиринту (ликвидатор)
  PRIEST,      // батюшка — священник в храме
}

export interface Needs {
  food:  number;   // 0‥100   lower = hungrier
  water: number;
  sleep: number;
  pee:   number;   // 0‥100   higher = more urgent
  poo:   number;
  pendingPee?: number;  // pending digestion → passive pee growth
  pendingPoo?: number;  // pending digestion → passive poo growth
}

// ── RPG stats (level, XP, attributes, PSI) ───────────────────────
export interface RPGStats {
  level: number;
  xp: number;
  attrPoints: number;      // unspent attribute points
  str: number;             // сила: melee dmg + maxHP scaling
  agi: number;             // ловкость: movement/attack/spread scaling
  int: number;             // интеллект: maxPsi, XP, reward and PSI cost scaling
  psi: number;             // current PSI (mana)
  maxPsi: number;          // base max PSI (scaled by INT)
}

export type PlayerStatusId = 'zhelemish_skin' | 'govnyak_relief' | 'govnyak_cough' | 'govnyak_debt';
export type PlayerStatusSource =
  | 'zhelemish_raw'
  | 'zhelemish_treated'
  | 'govnyak_roll'
  | 'govnyak_brick'
  | 'govnyak_sample'
  | 'govnyak_bad_batch'
  | 'debug';

export interface PlayerStatus {
  id: PlayerStatusId;
  source: PlayerStatusSource;
  startedAt: number;
  expiresAt: number;
  intensity?: number;
  badReaction?: boolean;
}

export enum AIGoal {
  IDLE, GOTO, EAT, DRINK, SLEEP, TOILET, WORK, HIDE, HUNT, FLEE, WANDER,
}

// ── NPC A-Life FSM states ────────────────────────────────────────
export enum NpcState {
  SLEEPING,    // 22-6: в жилой комнате, спит
  MORNING,     // 6-8: утренние дела — санузел, кухня, коридоры
  WORKING,     // 8-12, 13-18: на работе
  LUNCH,       // 12-13: обед в кухне
  FREE_TIME,   // 18-22: свободное время — курилка, кухня, бродит
  HIDING,      // самосбор — сидит в жилой
  TRAVELING,   // путники — бродят по лабиринту постоянно
  MEETING,     // заседание в зале (министерство)
  PATROL,      // патруль коридоров (ликвидаторы)
  BREAK,       // перекур / перерыв
}

export interface AIState {
  goal: AIGoal;
  tx: number; ty: number;     // target position
  path: number[];             // cell indices
  pi: number;                 // path index
  stuck: number;
  timer: number;
  npcState?: NpcState;        // A-Life FSM current state
  stateTimer?: number;        // time remaining in current sub-activity
  combatTargetId?: number;    // cached hostile target entity id
  combatScanCd?: number;      // cooldown until next full hostile scan
  windupTimer?: number;       // generic readable attack windup countdown
  windupTargetId?: number;    // target locked by current windup
  staggerTimer?: number;      // temporary interrupt / stagger lockout
  lastSeenTargetId?: number;  // event throttle for first sight / escape beats
  bossPhaseIndex?: number;    // last announced boss phase cue
  baitMarkerId?: number;      // cached monster bait marker id
  baitScanCd?: number;        // cooldown until next bounded bait scan
  ambientBarkCd?: number;     // cooldown for rare generic A-Life chatter
  wanderAngle?: number;        // phasing monster drift direction
  thinkAccum?: number;         // accumulated dt for staggered far-AI ticks
  thinkInterval?: number;      // deterministic cadence for far-AI ticks
  nearFrame?: number;          // transient marker for current near-player AI frame
}

export interface Entity {
  id: number;
  type: EntityType;
  x: number; y: number;
  angle: number;
  pitch: number;              // vertical look: -1..1 (y-shearing)
  alive: boolean;
  speed: number;
  sprite: number;             // sprite sheet index
  spriteSeed?: number;        // deterministic per-entity procedural visual seed
  // optional components
  needs?: Needs;
  hp?: number;
  maxHp?: number;
  ai?: AIState;
  inventory?: Item[];
  name?: string;
  monsterKind?: MonsterKind;
  monsterVariantId?: string;   // optional cheap modifier from data/monster_variants
  monsterDmgMult?: number;     // cached damage multiplier from variant
  attackCd?: number;
  familyId?: number;
  weapon?: string;            // equipped item def id
  tool?: string;              // equipped tool def id
  faction?: Faction;
  occupation?: Occupation;
  playerRelation?: number;    // personal attitude to player, -100..100; below hostile threshold attacks
  karma?: number;             // A-Life moral/social charge, -128..128; player starts at 0
  kills?: number;             // total actor kills for A-Life ranking
  npcKills?: number;          // NPC kills for A-Life ranking
  monsterKills?: number;      // monster kills for A-Life ranking
  isTraveler?: boolean;       // путник/паломник/охотник — бродит по лабиринту
  assignedRoomId?: number;    // назначенный кабинет (министерство)
  questId?: number;           // active quest given by this NPC (-1 = none)
  canGiveQuest?: boolean;     // authored/current quest affordance; persistent A-Life NPCs are valid quest candidates
  alifeId?: number;           // persistent procedural NPC identity
  persistentNpcId?: string;   // stable non-plot NPC key, e.g. alife:123
  money?: number;             // рубли
  spriteScale?: number;       // sprite size multiplier (child = 0.6)
  spriteZ?: number;           // vertical offset: 0=ground, 0.5=eye level (projectiles)
  plotNpcId?: string;         // story NPC key (e.g. 'olga', 'barni', 'yakov') — see data/plot.ts
  plotDone?: boolean;         // story phase ended, NPC switches to post-plot dialogue
  _plotTalkIdx?: number;      // internal: sequential dialogue line counter
  // projectile fields
  vx?: number; vy?: number;   // velocity (cells/sec)
  vz?: number;                // vertical velocity (units/sec, affects spriteZ)
  projDmg?: number;           // projectile damage
  projLife?: number;          // remaining lifetime (seconds)
  ownerId?: number;           // entity that fired this
  aoeRadius?: number;         // AoE explosion radius on impact
  aoeDmg?: number;            // AoE damage on impact
  projType?: ProjType;        // special projectile behaviour
  projGore?: number;          // gore intensity 1-3 (1=clean, 3=messy)
  burnTimer?: number;         // fire: remaining burn time on floor cell
  rpg?: RPGStats;             // RPG stats (level, XP, attributes)
  statuses?: PlayerStatus[];  // bounded timed player/NPC conditions
  isFemale?: boolean;          // gender for kill message grammar
  isFogBoss?: boolean;         // fog boss — killing stops fog in zone
  fogBossZone?: number;        // zone id this boss guards
  matkaTimer?: number;         // матка spawn timer (seconds until next spawn)
  psiMadness?: number;         // remaining seconds of PSI madness (attacks everyone)
  psiControlledBy?: number;    // entity id of PSI controller (ally override)
  phasing?: boolean;           // can move through walls (spirit)
}

// ── Items ────────────────────────────────────────────────────────
export enum ItemType { FOOD, DRINK, MEDICINE, WEAPON, TOOL, KEY, NOTE, MISC, AMMO }

export interface ItemDef {
  id: string;
  name: string;
  type: ItemType;
  desc: string;
  spawnRooms: RoomType[];
  spawnW: number;             // spawn weight
  value: number;              // price in рубли (0 = worthless)
  tags?: string[];            // small content labels for events/economy hooks
  stack?: number;             // override max stack size
  durability?: number;        // max durability for tools/consumable kits
  use?: (e: Entity) => string; // returns message
}

export interface Item {
  defId: string;
  count: number;
  data?: unknown;              // key roomId, note text, etc.
}

// ── Containers ──────────────────────────────────────────────────
export enum ContainerKind {
  WOODEN_CHEST,
  METAL_CABINET,
  MEDICAL_CABINET,
  WEAPON_CRATE,
  FRIDGE,
  SAFE,
  FILING_CABINET,
  CASHBOX,
  SECRET_STASH,
  EMERGENCY_BOX,
  TRASH_BIN,
  TOOL_LOCKER,
}

export type ContainerAccess = 'public' | 'room' | 'faction' | 'owner' | 'locked' | 'secret';

export interface WorldContainer {
  id: number;
  x: number;
  y: number;
  floor: FloorLevel;
  roomId: number;
  zoneId: number;
  kind: ContainerKind;
  name: string;
  inventory: Item[];
  capacitySlots: number;
  ownerNpcId?: number;
  ownerName?: string;
  faction?: Faction;
  access: ContainerAccess;
  lockDifficulty?: number;
  discovered: boolean;
  stolenItemIds?: string[];
  lastOpenedBy?: number;
  lastOpenedAt?: number;
  lastAuditAt?: number;
  factoryId?: string;
  lastProducedAt?: number;
  lastProducedItemId?: string;
  lastProducedCount?: number;
  productionBlockedReason?: 'no_inputs' | 'container_full' | 'no_container';
  tags: string[];
}

// ── Rail trains ─────────────────────────────────────────────────
export interface RailTrainTrack {
  id: string;
  label: string;
  cells: number[];
  stationOffsets: number[];
  platformCells: number[];
  loop: boolean;
}

export interface RailTrain {
  id: string;
  label: string;
  trackId: string;
  offset: number;
  speed: number;
  length: number;
  direction: 1 | -1;
  stopSeconds: number;
  stopUntil: number;
  passengerId: number;
  passengerSeat: number;
  entityIds: number[];
  lastStopOffset: number;
  nextWarnAt: number;
  nextCrushAt: number;
  nextDoorMsgAt: number;
}

// ── Quests ────────────────────────────────────────────────────────
export enum QuestType { FETCH, VISIT, KILL, TALK }

export interface QuestTargetMarker {
  floor?: FloorLevel;
  roomType?: RoomType;
  roomName?: string;
  zoneTag?: string;
  designFloorId?: string;
  proceduralTag?: string;
  routeZ?: number;
  risk?: number;
}

export interface Quest {
  id: number;
  type: QuestType;
  giverId: number;            // NPC entity id
  giverName: string;
  desc: string;
  // FETCH: targetItem + targetCount
  targetItem?: string;        // item def id
  targetCount?: number;
  // VISIT: targetRoom
  targetRoom?: number;        // room id
  // Generic route target metadata; unlike visitFloor, targetFloor is only a hint.
  targetFloor?: FloorLevel;
  targetRoomType?: RoomType;
  targetZoneTag?: string;
  targetMarker?: QuestTargetMarker;
  targetHint?: string;
  // KILL: targetMonsterKind + killCount/killNeeded
  targetMonsterKind?: MonsterKind;
  killCount?: number;
  killNeeded?: number;
  // TALK: targetNpcId
  targetNpcId?: number;
  targetNpcName?: string;
  targetPlotNpcId?: string;  // plot NPC key for cross-floor TALK quests
  // reward
  rewardItem?: string;
  rewardCount?: number;
  extraRewards?: {defId: string; count: number}[];  // additional rewards
  relationDelta?: number;     // how much relation changes on completion
  difficulty?: number;        // difficulty modifier (scales XP & rewards)
  xpReward?: number;          // XP reward on completion
  moneyReward?: number;       // money reward on completion
  plotStepIndex?: number;     // index into PLOT_CHAIN (story quests only)
  sideQuestId?: string;       // id from SIDE_QUESTS (hand-designed side quests)
  contractId?: string;        // AG10 contract wrapper id
  contractFaction?: Faction;  // issuer faction for generated contracts
  contractRank?: number;      // license/difficulty tier
  visitFloor?: FloorLevel;    // auto-complete VISIT quest when entering this floor
  eventTags?: string[];       // extra tags for authored quest events
  eventData?: Record<string, unknown>; // extra compact data for authored quest events
  eventPrivacy?: WorldEventPrivacy; // privacy override for authored quest events
  eventSeverity?: WorldEventSeverity; // severity override for authored quest events
  eventTargetName?: string;   // completed event summary override
  failOnNpcDeathPlotId?: string; // fail when this plot NPC dies
  abandonsSideQuestIds?: string[]; // completing this quest fails these active side quests
  timeLimitMinutes?: number;  // procedural quests, or authored quests that explicitly opt into a deadline
  expiresAtMinutes?: number;  // absolute GameClock.totalMinutes deadline
  failed?: boolean;           // true when a timed procedural quest expired
  done: boolean;
}

// ── World events / context facts ────────────────────────────────
export const WORLD_EVENT_RECENT_CAPACITY = 512;
export const WORLD_EVENT_IMPORTANT_CAPACITY = 128;
export const WORLD_EVENT_ZONE_CAPACITY = 32;
export const WORLD_EVENT_ZONE_COUNT = 64;

export const WORLD_EVENT_TYPES = [
  'npc_enter_zone',
  'npc_leave_zone',
  'npc_enter_room',
  'npc_need_low',
  'npc_pick_item',
  'npc_drop_item',
  'npc_store_item',
  'npc_take_from_container',
  'container_looted',
  'container_opened',
  'item_stolen',
  'item_deposited',
  'room_produced_items',
  'room_lacked_resources',
  'room_blocked_production',
  'npc_kill_monster',
  'npc_kill_npc',
  'player_kill_monster',
  'player_kill_npc',
  'player_hurt_npc',
  'player_pick_item',
  'player_drop_item',
  'player_use_item',
  'player_sell_item',
  'player_handoff_item',
  'player_destroy_item',
  'permit_forged',
  'permit_exposed',
  'access_granted',
  'player_status_applied',
  'player_status_expired',
  'player_status_cured',
  'player_status_bad_reaction',
  'tool_broke',
  'ammo_consumed',
  'gravity_beam_fired',
  'uv_spotlight_used',
  'uv_spotlight_target_affected',
  'uv_spotlight_depleted',
  'monster_bait_placed',
  'monster_bait_attracted',
  'monster_bait_consumed',
  'monster_bait_expired',
  'samosbor_warning',
  'samosbor_started',
  'samosbor_zone_captured',
  'samosbor_ended',
  'hermodoor_borer_detected',
  'hermodoor_borer_damage',
  'hermodoor_borer_repaired',
  'hermodoor_borer_compromised',
  'fog_boss_spawned',
  'fog_boss_killed',
  'monster_sighted',
  'monster_windup_interrupted',
  'monster_armor_cut',
  'monster_escaped',
  'smog_entered',
  'smog_source_found',
  'smog_source_handled',
  'bad_apple_spawned',
  'bad_apple_toggled',
  'metro_route_taken',
  'metro_wrong_stop',
  'rail_train_boarded',
  'rail_train_exited',
  'rail_train_crush',
  'emergency_panel_used',
  'gambling_bet',
  'gambling_win',
  'gambling_loss',
  'computer_data_stolen',
  'net_terminal_hacked',
  'net_terminal_hack_failed',
  'quest_created',
  'quest_completed',
  'quest_failed',
  'contract_created',
  'contract_completed',
  'contract_failed',
  'ration_coupon_spent',
  'ration_coupon_stolen',
  'ration_coupon_forged',
  'ration_coupon_reported',
  'ration_audit_resolved',
  'shelter_tally_handled',
  'rumor_observed',
  'rumor_spread',
  'faction_event',
  'faction_patrol_clash',
  'floor_transition',
  'elevator_anomaly',
  'elevator_loop_exit',
  'lift_arachna_warned',
  'lift_arachna_sprung',
  'lift_arachna_avoided',
  'lift_arachna_cleared',
  'paritel_valve_changed',
  'paritel_bridge_crossed',
  'paritel_threat_neutralized',
  'paritel_steam_injury',
  'paritel_steam_avoided',
  'faction_relation_changed',
  'door_opened',
  'door_sealed',
  'room_regrown',
  'hazard_trapped',
  'hazard_escaped',
  'hazard_cleaned',
  'burn_cleanup',
  'fuel_empty',
  'collateral_damage',
  'void_protocol_obtained',
  'void_protocol_started',
  'void_protocol_ended',
  'void_protocol_backlash',
  'void_protocol_rejected',
  'krysnozhka_swarm_triggered',
  'krysnozhka_baited',
  'krysnozhka_dispersed',
  'krysnozhka_nest_cleared',
  'death_seen',
] as const;

export type WorldEventType = typeof WORLD_EVENT_TYPES[number];

export type WorldEventSeverity = 0 | 1 | 2 | 3 | 4 | 5;
export type WorldEventPrivacy = 'public' | 'local' | 'witnessed' | 'private' | 'secret';

export interface WorldEvent {
  id: number;
  type: WorldEventType;
  time: number;
  day: number;
  hour: number;
  minute: number;
  floor: FloorLevel;
  zoneId?: number;
  roomId?: number;
  x?: number;
  y?: number;
  actorId?: number;
  actorName?: string;
  actorFaction?: Faction;
  targetId?: number;
  targetName?: string;
  targetFaction?: Faction;
  itemId?: string;
  itemName?: string;
  itemCount?: number;
  itemValue?: number;
  monsterKind?: MonsterKind;
  containerId?: number;
  containerOwnerId?: number;
  containerFaction?: Faction;
  severity: WorldEventSeverity;
  privacy: WorldEventPrivacy;
  truth: 'fact';
  tags: string[];
  data?: Record<string, unknown>;
}

export type WorldEventDraft = Omit<WorldEvent, 'id' | 'time' | 'day' | 'hour' | 'minute' | 'floor' | 'truth'> & {
  time?: number;
  day?: number;
  hour?: number;
  minute?: number;
  floor?: FloorLevel;
  truth?: 'fact';
};

export interface ContextFact {
  id: number;
  eventId: number;
  kind: 'danger' | 'shortage' | 'theft' | 'death' | 'production' | 'need' | 'quest_hook' | 'social' | 'territory';
  subjectId?: number;
  subjectName?: string;
  zoneId?: number;
  roomId?: number;
  itemId?: string;
  faction?: Faction;
  score: number;
  expiresAt?: number;
  tags: string[];
}

export interface EventFilter {
  type?: WorldEventType;
  zoneId?: number;
  floor?: FloorLevel;
  minSeverity?: WorldEventSeverity;
  privacy?: WorldEventPrivacy;
  actorId?: number;
  targetId?: number;
  sinceId?: number;
  tags?: string[];
  limit?: number;
}

export interface WorldEventBuffer {
  capacity: number;
  start: number;
  count: number;
  items: (WorldEvent | null)[];
}

export interface WorldEventState {
  nextId: number;
  recentEvents: WorldEventBuffer;
  importantEvents: WorldEventBuffer;
  zoneEvents: WorldEventBuffer[];
  facts: ContextFact[];
  nextFactId: number;
  lastLogKey: string;
  lastLogTime: number;
}

// ── Game state ───────────────────────────────────────────────────
// ── Game clock (24h cycle) ────────────────────────────────────────
// 1 game hour = 60 real seconds, 1 game minute = 1 real second
// gameHour: 0-23, gameMinute: 0-59
export interface GameClock {
  hour: number;
  minute: number;
  totalMinutes: number;     // total minutes elapsed since game start
}

export interface GameState {
  tick: number;
  time: number;
  clock: GameClock;
  samosborActive: boolean;
  samosborTimer: number;
  samosborCount: number;
  paused: boolean;
  gameOver: boolean;
  showInventory: boolean;
  mapMode: number;          // 0=off, 1=minimap, 2=fullmap
  showQuests: boolean;
  invSel: number;
  msgs: Msg[];
  quests: Quest[];
  nextQuestId: number;
  currentFloor: FloorLevel;
  fogSpreadTimer: number;     // ticks between fog spread steps
  // ── Game menu (ESC) ──
  showMenu: boolean;
  menuSel: number;            // 0=continue, 1=new game, 2=save, 3=load
  // ── NPC interaction menu ──
  showNpcMenu: boolean;
  npcMenuSel: number;         // 0=talk, 1=quest, 2=trade
  npcMenuTarget: number;      // entity id
  npcMenuTab: string;         // 'main'|'talk'|'quest'|'trade'
  npcTalkText: string;
  questPage: number;
  tradeCursorX: number;       // 0..4 column in trade grid
  tradeCursorY: number;       // 0..4 row in trade grid
  tradeSide: string;          // 'player'|'npc'
  // ── Container interaction menu ──
  showContainerMenu: boolean;
  containerMenuTarget: number; // world container id
  containerCursorX: number;    // 0..4 column in container grid
  containerCursorY: number;    // 0..4 row in container grid
  containerSide: string;       // 'player'|'container'
  showDebug: boolean;
  debugSel: number;
  showFactions: boolean;       // faction relations matrix (F key)
  factionRankScroll: number;   // A-Life leaderboard scroll inside F menu
  showLog: boolean;            // message log menu (L key)
  logScroll: number;           // scroll offset in log menu
  showControls: boolean;       // hotkey / rebind screen (Tab by default)
  controlSel: number;
  controlScroll: number;
  msgLog: LogEntry[];          // persistent message log with timestamps
  dmgFlash: number;           // damage vignette intensity 0..1, decays over time
  dmgSeed: number;            // random seed for vein pattern per hit
  lastDamage?: PlayerDamageRecord;
  deathTimer: number;         // seconds since player death (for camera drop)
  sleeping: boolean;          // player is holding Z to sleep
  beamFx: number;            // PSI beam visual timer (seconds remaining)
  beamAngle: number;         // beam direction (radians)
  beamLen: number;           // beam length (cells)
  uvBeamFx: number;          // UV spotlight visual timer (seconds remaining)
  uvBeamLen: number;         // UV spotlight reach (cells)
  gameWon: boolean;          // end-screen victory flag; return portal now continues freeplay
  worldEvents?: WorldEventState; // bounded structured event history; old saves may omit it
}

export interface Msg { text: string; time: number; color: string; day: number; hour: number; minute: number; }
export interface LogEntry { text: string; color: string; day: number; hour: number; minute: number; }

/* ── Global msg factory — stores current clock, call setMsgClock each frame ── */
let _msgDay = 0, _msgHour = 8, _msgMin = 0;
export function setMsgClock(clock: GameClock): void {
  _msgDay = Math.floor(clock.totalMinutes / 1440);
  _msgHour = clock.hour;
  _msgMin = clock.minute;
}
export function msg(text: string, time: number, color: string): Msg {
  return { text, time, color, day: _msgDay, hour: _msgHour, minute: _msgMin };
}

// ── Input ────────────────────────────────────────────────────────
export interface InputState {
  fwd: boolean; back: boolean; left: boolean; right: boolean;
  strafeL: boolean; strafeR: boolean;
  attack: boolean; interact: boolean; pickup: boolean;
  map: boolean; inv: boolean;
  invUp: boolean; invDn: boolean; invLeft: boolean; invRight: boolean;
  use: boolean;
  escape: boolean;
  questLog: boolean;
  mouseAttack: boolean;
  attrStr: boolean; attrAgi: boolean; attrInt: boolean;  // 1,2,3 keys for attribute spending
  debugScreen: boolean;
  pee: boolean;                 // P key — urinate
  drop: boolean;                // D key — drop item (inventory)
  factionMenu: boolean;         // F key — faction relations matrix
  logMenu: boolean;             // L key — message log
  sleep: boolean;               // Z key — hold to sleep
  controls: boolean;            // Tab by default — hotkey / rebind screen
  controlReset: boolean;        // Backspace by default — reset selected binding
  mouse: { dx: number; dy: number; locked: boolean; };
  touch: { moveX: number; moveY: number; lookX: number; lookY: number; active: boolean; };
}
