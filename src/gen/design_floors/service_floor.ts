/* ── Design floor: service_floor — lift machines and staff routes ─ */

import {
  AIGoal,
  Cell,
  ContainerKind,
  DoorState,
  EntityType,
  Faction,
  Feature,
  FloorLevel,
  LiftDirection,
  MonsterKind,
  Occupation,
  QuestType,
  RoomType,
  Tex,
  W,
  ZoneFaction,
  type Entity,
  type GameState,
  type Item,
  type Room,
  type WorldContainer,
  type WorldEvent,
} from '../../core/types';
import { World } from '../../core/world';
import { freshNeeds } from '../../data/catalog';
import { type PlotNpcDef, registerSideQuest } from '../../data/plot';
import { MONSTERS } from '../../entities/monster';
import { Spr } from '../../render/sprite_index';
import { publishEvent } from '../../systems/events';
import { registerRouteCue } from '../../systems/route_cues';
import { randomRPG, scaleMonsterHp, scaleMonsterSpeed } from '../../systems/rpg';
import { stampRoom } from '../shared';
import type { FloorGeneration } from '../floor_manifest';

export const DESIGN_FLOOR_ID = 'service_floor' as const;
export const SERVICE_FLOOR_Z = -18;
export const SERVICE_FLOOR_BASE_FLOOR = FloorLevel.MAINTENANCE;

const MASTER_SCOPE_TAG = 'service_master_scope';
const LIFT_MACHINE_ROOM = 'Машинный зал лифтовой группы С-15';
const BREAKER_ROOM = 'Щитовая служебного этажа С-15';
const JANITOR_DEPOT = 'Кладовая дежурных ключей С-15';
const VENT_JUNCTION = 'Вентиляционный узел над шахтой С-15';
const STAFF_CANTEEN = 'Столовая ремонтной смены С-15';
const CLERK_OFFICE = 'Запертая диспетчерская рейдов С-15';

export type ServiceLiftMachineState = 'faulty' | 'repaired';
export type ServicePowerZoneId = 'machine_hall' | 'breaker_room' | 'staff_route' | 'ventilation';

export interface ServicePowerZoneFlag {
  id: ServicePowerZoneId;
  name: string;
  powered: boolean;
  roomId: number;
}

export interface ServiceRerouteFlags {
  lowerStaffRouteOpen: boolean;
  marketRaidDiverted: boolean;
  productionBypassArmed: boolean;
}

export type ServiceTransferRouteId =
  | 'service_to_production_belt_feed'
  | 'service_to_dark_metro_signal'
  | 'service_to_darkness_light_reserve';

export interface ServiceTransferRoute {
  id: ServiceTransferRouteId;
  label: string;
  sourceRoomName: string;
  targetRouteId: 'production_belt' | 'dark_metro' | 'darkness';
  requiresZone: ServicePowerZoneId;
  routeFlag: keyof ServiceRerouteFlags | 'power';
  clue: string;
}

export interface ServiceFloorState {
  routeId: typeof DESIGN_FLOOR_ID;
  anchorZ: number;
  baseFloor: FloorLevel;
  liftMachineState: ServiceLiftMachineState;
  masterKeyKnown: boolean;
  powerZones: ServicePowerZoneFlag[];
  rerouteFlags: ServiceRerouteFlags;
  transferRoutes: ServiceTransferRoute[];
  scopedDoorIds: number[];
  scopedContainerIds: number[];
  debugEntry: {
    spawnX: number;
    spawnY: number;
    summary: string;
  };
}

export interface ServiceFloorGeneration extends FloorGeneration {
  serviceState: ServiceFloorState;
}

export interface ServiceFloorExpansionStyle {
  wallTex: Tex;
  floorTex: Tex;
}

export const SERVICE_FLOOR_MASTER_SCOPE = {
  tag: MASTER_SCOPE_TAG,
  rooms: [JANITOR_DEPOT, CLERK_OFFICE],
  note: 'Scoped to recorded Service Floor doors and containers only; it does not use the generic key door path.',
} as const;

export const SERVICE_TRANSFER_ROUTES: readonly ServiceTransferRoute[] = [
  {
    id: 'service_to_production_belt_feed',
    label: 'Обход питания к Производственному поясу',
    sourceRoomName: LIFT_MACHINE_ROOM,
    targetRouteId: 'production_belt',
    requiresZone: 'machine_hall',
    routeFlag: 'productionBypassArmed',
    clue: 'После ремонта С-15 нижний персональный коридор принимает дверь-комплекты и энергоячейки с Пояса.',
  },
  {
    id: 'service_to_dark_metro_signal',
    label: 'Сигнальный лаз в Темную пересадку',
    sourceRoomName: VENT_JUNCTION,
    targetRouteId: 'dark_metro',
    requiresZone: 'ventilation',
    routeFlag: 'power',
    clue: 'Запитанная вентиляция дает короткий путь к стрелочной будке метро, но зовет ламповых.',
  },
  {
    id: 'service_to_darkness_light_reserve',
    label: 'Резерв аварийного света для темного отсека',
    sourceRoomName: BREAKER_ROOM,
    targetRouteId: 'darkness',
    requiresZone: 'breaker_room',
    routeFlag: 'power',
    clue: 'Релейная схема может уйти в поздний световой карман вместо местного комфорта.',
  },
];

const BORIS_DEF: PlotNpcDef = {
  name: 'Борис Лифтёр',
  isFemale: false,
  faction: Faction.LIQUIDATOR,
  occupation: Occupation.MECHANIC,
  sprite: Occupation.MECHANIC,
  hp: 170, maxHp: 170, money: 95, speed: 1.0,
  inventory: [
    { defId: 'wrench', count: 1 },
    { defId: 'lift_scheme', count: 1 },
    { defId: 'fuse', count: 1 },
  ],
  talkLines: [
    'Машина С-15 тянет кабину честно, а маршрут врёт. Если поменять предохранители, лифт хотя бы перестанет выбирать нижний этаж наугад.',
    'Я чиню не лифт целиком. Только маленькое право доехать туда, куда нажал.',
    'Служебный ключ не открывает мир. Он открывает две двери, за которые я потом отвечаю.',
  ],
  talkLinesPost: [
    'Маршрут держит. Не навсегда, но достаточно, чтобы успеть пожалеть о поездке.',
    'Если кнопка молчит, слушай реле. Реле врёт тише человека.',
  ],
};

const NADYA_DEF: PlotNpcDef = {
  name: 'Надя Ключница',
  isFemale: true,
  faction: Faction.CITIZEN,
  occupation: Occupation.STOREKEEPER,
  sprite: Occupation.STOREKEEPER,
  hp: 115, maxHp: 115, money: 65, speed: 0.95,
  inventory: [
    { defId: 'inspection_mirror', count: 1 },
    { defId: 'sealant_tube', count: 1 },
    { defId: 'cigs', count: 1 },
  ],
  talkLines: [
    'Мастер-ключ тут не главный. Главный тот, кто знает, какие две двери в ведомости, а какие придумали жильцы.',
    'Кладовая моя. Возьмёшь без спроса — шум пойдёт по трубам раньше тебя.',
    'Вентиляция ведёт быстро, если не боишься того, что питается светом.',
  ],
  talkLinesPost: [
    'Теперь ты знаешь малый круг. За большой круг людей списывают.',
    'Не показывай допуск в Министерстве. Они спросят, почему он полезный.',
  ],
};

const ROMA_DEF: PlotNpcDef = {
  name: 'Рома Щитовой',
  isFemale: false,
  faction: Faction.SCIENTIST,
  occupation: Occupation.ELECTRICIAN,
  sprite: Occupation.ELECTRICIAN,
  hp: 125, maxHp: 125, money: 80, speed: 1.0,
  inventory: [
    { defId: 'relay_diagram', count: 1 },
    { defId: 'fuse', count: 2 },
    { defId: 'flashlight', count: 1 },
  ],
  talkLines: [
    'Свет можно вернуть на один маршрут. На все нельзя: дом решит, что мы вызываем его наружу.',
    'Ламповый ест яркое. Поэтому я чиню темноту аккуратно.',
    'Если щитовая хлопнет во время самосбора, двери станут мнением.',
  ],
  talkLinesPost: [
    'Один контур горит. Второй пусть стыдится в темноте.',
    'Не стой под новой лампой слишком долго. Она теперь пахнет тобой.',
  ],
};

const CLERK_DEF: PlotNpcDef = {
  name: 'Павел Без Пропуска',
  isFemale: false,
  faction: Faction.CITIZEN,
  occupation: Occupation.SECRETARY,
  sprite: Occupation.SECRETARY,
  hp: 100, maxHp: 100, money: 40, speed: 0.9,
  inventory: [
    { defId: 'elevator_override_form', count: 1 },
    { defId: 'official_permit_slip', count: 1 },
  ],
  talkLines: [
    'Меня заперли снаружи моего же журнала. Там рейдовая очередь, и она уже почти дошла до рынка.',
    'Переставь форму обхода — рейд пойдёт первым в пустой коридор, а не к людям.',
    'Это не спасение. Это перенос ошибки на адрес, где пока никто не расписался.',
  ],
  talkLinesPost: [
    'Журнал поменял очередь. Теперь он делает вид, что сам так решил.',
    'Если спросят, меня тут не было. Я всё ещё заперт, просто с другой стороны.',
  ],
};

registerSideQuest('service_liftmaster_boris', BORIS_DEF, [
  {
    id: 'service_fix_lift_machine',
    giverNpcId: 'service_liftmaster_boris',
    type: QuestType.FETCH,
    desc: 'Борис: «Три предохранителя в машинный зал С-15. Починим не весь лифт, а маленькое право доехать по кнопке.»',
    targetItem: 'fuse', targetCount: 3,
    rewardItem: 'lift_scheme', rewardCount: 1,
    extraRewards: [{ defId: 'gear', count: 1 }, { defId: 'elevator_override_form', count: 1 }],
    relationDelta: 14, xpReward: 90, moneyReward: 85,
  },
]);

registerSideQuest('service_janitor_nadya', NADYA_DEF, [
  {
    id: 'service_steal_master_key',
    giverNpcId: 'service_janitor_nadya',
    type: QuestType.VISIT,
    desc: 'Надя: «Зайди в кладовую С-15 и посмотри ведомость малого круга. Мастер-ключ тут означает ровно две двери.»',
    targetRoomName: JANITOR_DEPOT,
    rewardItem: 'door_kit', rewardCount: 1,
    extraRewards: [{ defId: 'inspection_mirror', count: 1 }],
    relationDelta: 10, xpReward: 60, moneyReward: 45,
  },
]);

registerSideQuest('service_electrician_roma', ROMA_DEF, [
  {
    id: 'service_restore_lights',
    giverNpcId: 'service_electrician_roma',
    type: QuestType.FETCH,
    desc: 'Рома: «Неси релейную схему. Поднимем свет на одном маршруте, а не устроим ламповым столовую.»',
    targetItem: 'relay_diagram', targetCount: 1,
    rewardItem: 'flashlight', rewardCount: 1,
    extraRewards: [{ defId: 'gasmask_filter', count: 1 }, { defId: 'fuse', count: 1 }],
    relationDelta: 12, xpReward: 75, moneyReward: 70,
  },
]);

registerSideQuest('service_locked_out_clerk', CLERK_DEF, [
  {
    id: 'service_reroute_raid',
    giverNpcId: 'service_locked_out_clerk',
    type: QuestType.FETCH,
    desc: 'Павел: «Бланк обхода в диспетчерскую С-15. Рейдовую очередь отправят в пустой коридор, если печать пройдет у диспетчера.»',
    targetItem: 'elevator_override_form', targetCount: 1,
    rewardItem: 'official_permit_slip', rewardCount: 1,
    extraRewards: [{ defId: 'ammo_9mm', count: 12 }],
    relationDelta: 8, xpReward: 80, moneyReward: 95,
  },
]);

export function createServiceFloorState(): ServiceFloorState {
  return {
    routeId: DESIGN_FLOOR_ID,
    anchorZ: SERVICE_FLOOR_Z,
    baseFloor: SERVICE_FLOOR_BASE_FLOOR,
    liftMachineState: 'faulty',
    masterKeyKnown: false,
    powerZones: [],
    rerouteFlags: {
      lowerStaffRouteOpen: false,
      marketRaidDiverted: false,
      productionBypassArmed: false,
    },
    transferRoutes: SERVICE_TRANSFER_ROUTES.map(route => ({ ...route })),
    scopedDoorIds: [],
    scopedContainerIds: [],
    debugEntry: {
      spawnX: 416.5,
      spawnY: 514.5,
      summary: 'service_floor z=-18 spawn at west service lift; east lift is reachable through the staff corridor.',
    },
  };
}

export function summarizeServiceFloorFlags(service: ServiceFloorState): string[] {
  const powered = service.powerZones
    .filter(z => z.powered)
    .map(z => z.id)
    .join(',') || 'none';
  return [
    `route=${service.routeId} z=${service.anchorZ} base=${FloorLevel[service.baseFloor]}`,
    `liftMachine=${service.liftMachineState} masterKeyKnown=${service.masterKeyKnown}`,
    `power=${powered}`,
    `reroute lower=${service.rerouteFlags.lowerStaffRouteOpen} marketRaidDiverted=${service.rerouteFlags.marketRaidDiverted} productionBypass=${service.rerouteFlags.productionBypassArmed}`,
    `transfers=${service.transferRoutes.map(route => `${route.id}:${route.targetRouteId}`).join(',') || 'none'}`,
    `scope doors=${service.scopedDoorIds.length} containers=${service.scopedContainerIds.length}`,
  ];
}

export function applyServiceMasterKeyScope(world: World, service: ServiceFloorState): { doors: number; containers: number } {
  let doors = 0;
  let containers = 0;
  for (const id of service.scopedDoorIds) {
    const door = world.doors.get(id);
    if (!door || door.state !== DoorState.LOCKED) continue;
    door.state = DoorState.CLOSED;
    door.keyId = '';
    doors++;
  }
  for (const id of service.scopedContainerIds) {
    const container = world.containerById.get(id);
    if (!container || !container.tags.includes(MASTER_SCOPE_TAG)) continue;
    if (container.access !== 'room') {
      container.access = 'room';
      container.discovered = true;
      containers++;
    }
  }
  return { doors, containers };
}

export function learnServiceMasterKey(game: GameState, world: World, service: ServiceFloorState): WorldEvent {
  service.masterKeyKnown = true;
  const changed = applyServiceMasterKeyScope(world, service);
  return publishEvent(game, {
    type: 'door_opened',
    floor: game.currentFloor,
    severity: 3,
    privacy: 'local',
    tags: ['service_floor', 'master_key_scope', 'access_flag'],
    data: {
      routeId: service.routeId,
      scopeTag: MASTER_SCOPE_TAG,
      changedDoors: changed.doors,
      changedContainers: changed.containers,
    },
  });
}

export function repairServiceLiftMachine(game: GameState, service: ServiceFloorState): WorldEvent {
  service.liftMachineState = 'repaired';
  service.rerouteFlags.lowerStaffRouteOpen = true;
  service.rerouteFlags.productionBypassArmed = true;
  return publishEvent(game, {
    type: 'elevator_loop_exit',
    floor: game.currentFloor,
    severity: 4,
    privacy: 'local',
    tags: ['service_floor', 'lift_machine', 'repair', 'route_flag'],
    data: {
      routeId: service.routeId,
      anchorZ: service.anchorZ,
      liftMachineState: service.liftMachineState,
      lowerStaffRouteOpen: service.rerouteFlags.lowerStaffRouteOpen,
      productionBypassArmed: service.rerouteFlags.productionBypassArmed,
      transferRoutes: service.transferRoutes
        .filter(route => route.targetRouteId === 'production_belt')
        .map(route => route.id),
    },
  });
}

export function restoreServicePowerZone(
  game: GameState,
  service: ServiceFloorState,
  zoneId: ServicePowerZoneId,
): WorldEvent {
  for (const zone of service.powerZones) {
    if (zone.id === zoneId) zone.powered = true;
  }
  return publishEvent(game, {
    type: 'room_produced_items',
    floor: game.currentFloor,
    severity: 3,
    privacy: 'local',
    tags: ['service_floor', 'power', 'light_route'],
    data: {
      routeId: service.routeId,
      powerZone: zoneId,
      powered: true,
      transferRoutes: service.transferRoutes
        .filter(route => route.requiresZone === zoneId)
        .map(route => route.id),
    },
  });
}

export function rerouteServiceRaid(game: GameState, service: ServiceFloorState): WorldEvent {
  service.rerouteFlags.marketRaidDiverted = true;
  return publishEvent(game, {
    type: 'faction_patrol_clash',
    floor: game.currentFloor,
    severity: 4,
    privacy: 'local',
    tags: ['service_floor', 'raid', 'reroute_flag'],
    data: {
      routeId: service.routeId,
      marketRaidDiverted: service.rerouteFlags.marketRaidDiverted,
    },
  });
}

export function generateServiceFloorDesignFloor(): ServiceFloorGeneration {
  const world = new World();
  const entities: Entity[] = [];
  const nextId = { v: 1 };
  const serviceState = createServiceFloorState();

  for (let i = 0; i < W * W; i++) {
    world.wallTex[i] = Tex.METAL;
    world.floorTex[i] = Tex.F_CONCRETE;
  }

  carveStaffRoute(world, 430, 512, 190, 5);
  carveStaffRoute(world, 520, 478, 5, 82);
  carveStaffRoute(world, 458, 504, 112, 3);
  carveStaffRoute(world, 478, 538, 84, 3);

  const westLift = stampServiceRoom(world, RoomType.CORRIDOR, 410, 508, 15, 12, 'Западный служебный лифт С-15', Tex.LIFT_DOOR, Tex.F_CONCRETE);
  const eastLift = stampServiceRoom(world, RoomType.CORRIDOR, 625, 508, 15, 12, 'Восточный служебный лифт С-15', Tex.LIFT_DOOR, Tex.F_CONCRETE);
  const machine = stampServiceRoom(world, RoomType.PRODUCTION, 488, 486, 30, 19, LIFT_MACHINE_ROOM, Tex.PIPE, Tex.F_CONCRETE);
  const breaker = stampServiceRoom(world, RoomType.PRODUCTION, 470, 526, 22, 15, BREAKER_ROOM, Tex.METAL, Tex.F_TILE);
  const janitor = stampServiceRoom(world, RoomType.STORAGE, 438, 526, 20, 13, JANITOR_DEPOT, Tex.PANEL, Tex.F_LINO);
  const vent = stampServiceRoom(world, RoomType.CORRIDOR, 536, 486, 24, 17, VENT_JUNCTION, Tex.DARK, Tex.F_CONCRETE);
  const canteen = stampServiceRoom(world, RoomType.KITCHEN, 548, 526, 28, 16, STAFF_CANTEEN, Tex.TILE_W, Tex.F_TILE);
  const clerk = stampServiceRoom(world, RoomType.OFFICE, 584, 494, 22, 13, CLERK_OFFICE, Tex.MARBLE, Tex.F_PARQUET);

  connectRoomRight(world, westLift, 430, 514, DoorState.CLOSED);
  connectRoomLeft(world, eastLift, 619, 514, DoorState.CLOSED);
  connectRoomDown(world, machine, 503, 512, DoorState.CLOSED);
  connectRoomUp(world, breaker, 482, 516, DoorState.CLOSED);
  const janitorDoor = connectRoomUp(world, janitor, 448, 516, DoorState.LOCKED);
  connectRoomDown(world, vent, 548, 512, DoorState.CLOSED);
  connectRoomUp(world, canteen, 562, 516, DoorState.CLOSED);
  const clerkDoor = connectRoomDown(world, clerk, 595, 512, DoorState.LOCKED);
  serviceState.scopedDoorIds.push(janitorDoor, clerkDoor);

  placeLift(world, westLift.x + 4, westLift.y + 6, LiftDirection.UP);
  placeLift(world, eastLift.x + eastLift.w - 5, eastLift.y + 6, LiftDirection.DOWN);

  dressCorridors(world);
  dressLiftMachine(world, machine);
  dressBreakerRoom(world, breaker);
  dressJanitorDepot(world, janitor);
  dressVentJunction(world, vent);
  dressCanteen(world, canteen);
  dressClerkOffice(world, clerk);

  generateServiceZones(world, [westLift, eastLift, machine, breaker, janitor, vent, canteen, clerk]);

  const borisId = spawnPlotNpc(entities, nextId, 'service_liftmaster_boris', BORIS_DEF, machine.x + 6, machine.y + 12, Math.PI);
  const romaId = spawnPlotNpc(entities, nextId, 'service_electrician_roma', ROMA_DEF, breaker.x + 5, breaker.y + 8, Math.PI / 2);
  const nadyaId = spawnPlotNpc(entities, nextId, 'service_janitor_nadya', NADYA_DEF, canteen.x + 5, canteen.y + 10, 0);
  spawnPlotNpc(entities, nextId, 'service_locked_out_clerk', CLERK_DEF, clerk.x - 3, 514, 0);

  addServiceContainer(world, machine, machine.x + machine.w - 3, machine.y + 3, ContainerKind.TOOL_LOCKER, 'Шкаф Бориса у лифтовой машины', 'owner', [
    { defId: 'fuse', count: 2 },
    { defId: 'gear', count: 1 },
    { defId: 'lift_scheme', count: 1 },
    { defId: 'wrench', count: 1 },
  ], borisId, BORIS_DEF.name, ['service_floor', 'lift_machine', 'repair']);

  addServiceContainer(world, breaker, breaker.x + breaker.w - 4, breaker.y + 3, ContainerKind.METAL_CABINET, 'Щитовой шкаф Ромы', 'owner', [
    { defId: 'relay_diagram', count: 1 },
    { defId: 'fuse', count: 2 },
    { defId: 'circuit_board', count: 1 },
  ], romaId, ROMA_DEF.name, ['service_floor', 'power']);

  const janitorContainer = addServiceContainer(world, janitor, janitor.x + 3, janitor.y + 3, ContainerKind.TOOL_LOCKER, 'Ведомость малого круга ключей', 'owner', [
    { defId: 'door_kit', count: 1 },
    { defId: 'inspection_mirror', count: 1 },
    { defId: 'sealant_tube', count: 2 },
    { defId: 'flashlight', count: 1 },
  ], nadyaId, NADYA_DEF.name, ['service_floor', MASTER_SCOPE_TAG, 'janitor']);

  const clerkContainer = addServiceContainer(world, clerk, clerk.x + clerk.w - 3, clerk.y + 3, ContainerKind.FILING_CABINET, 'Рейдовый журнал С-15', 'locked', [
    { defId: 'elevator_override_form', count: 1 },
    { defId: 'official_permit_slip', count: 2 },
    { defId: 'ration_registry_extract', count: 1 },
  ], undefined, undefined, ['service_floor', MASTER_SCOPE_TAG, 'raid']);

  serviceState.scopedContainerIds.push(janitorContainer.id, clerkContainer.id);

  addServiceContainer(world, canteen, canteen.x + canteen.w - 4, canteen.y + 4, ContainerKind.FRIDGE, 'Холодильник ремонтной смены', 'room', [
    { defId: 'water', count: 2 },
    { defId: 'bread', count: 1 },
    { defId: 'canned', count: 1 },
  ], undefined, undefined, ['service_floor', 'food']);

  dropItems(world, entities, nextId, machine, ['fuse', 'gear', 'sealant_tube']);
  dropItems(world, entities, nextId, breaker, ['fuse', 'relay_diagram']);
  dropItems(world, entities, nextId, vent, ['gasmask_filter', 'ammo_energy']);
  dropItems(world, entities, nextId, canteen, ['water', 'bread']);

  spawnMonsterPack(world, entities, nextId, vent.x + 12, vent.y + 8, [MonsterKind.LAMPOVY, MonsterKind.ROBOT, MonsterKind.REBAR]);
  spawnMonsterPack(world, entities, nextId, eastLift.x + 4, eastLift.y + 6, [MonsterKind.ROBOT, MonsterKind.SBORKA]);

  serviceState.powerZones = [
    { id: 'machine_hall', name: LIFT_MACHINE_ROOM, powered: true, roomId: machine.id },
    { id: 'breaker_room', name: BREAKER_ROOM, powered: false, roomId: breaker.id },
    { id: 'staff_route', name: 'Служебный коридор С-15', powered: true, roomId: -1 },
    { id: 'ventilation', name: VENT_JUNCTION, powered: false, roomId: vent.id },
  ];

  registerServiceRouteCues(world, serviceState, machine, breaker, vent, eastLift);

  world.bakeLights();
  return {
    world,
    entities,
    spawnX: serviceState.debugEntry.spawnX,
    spawnY: serviceState.debugEntry.spawnY,
    serviceState,
  };
}

function registerServiceRouteCues(
  world: World,
  service: ServiceFloorState,
  machine: Room,
  breaker: Room,
  vent: Room,
  eastLift: Room,
): void {
  const productionRoute = service.transferRoutes.find(route => route.id === 'service_to_production_belt_feed');
  if (productionRoute) {
    const markerX = machine.x + 5.5;
    const markerY = machine.y + 5.5;
    const targetX = eastLift.x + eastLift.w - 5 + 0.5;
    const targetY = eastLift.y + 6.5;
    const markerCell = world.idx(Math.floor(markerX), Math.floor(markerY));
    registerRouteCue(world, {
      id: productionRoute.id,
      x: markerX,
      y: markerY,
      targetX,
      targetY,
      floor: SERVICE_FLOOR_BASE_FLOOR,
      roomId: machine.id,
      targetRoomId: eastLift.id,
      zoneId: world.zoneMap[markerCell],
      label: 'производственный обход',
      hint: 'лебедка С-15 тянет к восточному служебному лифту',
      targetName: productionRoute.label,
      color: '#8cf',
      tags: ['service_floor', 'production_belt', 'shortcut', 'repair'],
      toneSeed: machine.id * 811 + eastLift.id,
      radius: 9,
      targetRadius: 3,
      cooldownSec: 34,
      heardText: 'Лебедка С-15 стучит в сторону Производственного пояса. Ремонт открывает короткий персональный ход.',
      followedText: 'Восточный служебный лифт найден. После ремонта он станет обходом к производственной выдаче.',
      ignoredText: 'Лебедка С-15 стихла за спиной. Производственный обход остался не проверен.',
    });
  }

  const metroRoute = service.transferRoutes.find(route => route.id === 'service_to_dark_metro_signal');
  if (metroRoute) {
    const markerX = vent.x + vent.w - 4 + 0.5;
    const markerY = vent.y + 2.5;
    const targetX = vent.x + 3.5;
    const targetY = vent.y + vent.h - 4 + 0.5;
    const markerCell = world.idx(Math.floor(markerX), Math.floor(markerY));
    registerRouteCue(world, {
      id: metroRoute.id,
      x: markerX,
      y: markerY,
      targetX,
      targetY,
      floor: SERVICE_FLOOR_BASE_FLOOR,
      roomId: vent.id,
      targetRoomId: vent.id,
      zoneId: world.zoneMap[markerCell],
      label: 'метро-сигнал',
      hint: 'темный воздух ведет к стрелочной будке',
      targetName: metroRoute.label,
      color: '#79f',
      tags: ['service_floor', 'dark_metro', 'transfer', 'warning'],
      toneSeed: vent.id * 823 + breaker.id,
      radius: 8,
      targetRadius: 3,
      cooldownSec: 38,
      heardText: 'Вентиляция отвечает метро-сигналом: короткий путь возможен, если вернуть питание контуру.',
      followedText: 'Вентиляционный лаз найден. Он обещает Темную пересадку и предупреждает о ламповых.',
      ignoredText: 'Метро-сигнал ушел в вентиляцию. Короткий лаз остался темным.',
    });
  }

  const darknessRoute = service.transferRoutes.find(route => route.id === 'service_to_darkness_light_reserve');
  if (darknessRoute) {
    const markerX = breaker.x + breaker.w - 4 + 0.5;
    const markerY = breaker.y + 5.5;
    const targetX = breaker.x + 3.5;
    const targetY = breaker.y + breaker.h - 3 + 0.5;
    const markerCell = world.idx(Math.floor(markerX), Math.floor(markerY));
    registerRouteCue(world, {
      id: darknessRoute.id,
      x: markerX,
      y: markerY,
      targetX,
      targetY,
      floor: SERVICE_FLOOR_BASE_FLOOR,
      roomId: breaker.id,
      targetRoomId: breaker.id,
      zoneId: world.zoneMap[markerCell],
      label: 'резерв света',
      hint: 'щитовая держит поздний световой запас',
      targetName: darknessRoute.label,
      color: '#bbf',
      tags: ['service_floor', 'darkness', 'transfer', 'light'],
      toneSeed: breaker.id * 829 + vent.id,
      radius: 8,
      targetRadius: 2.8,
      cooldownSec: 42,
      heardText: 'Щитовая щелкает поздним резервом: схему можно потратить здесь или оставить для темного отсека.',
      followedText: 'Релейный резерв найден. Это будущий световой карман, если не израсходовать его на месте.',
      ignoredText: 'Резерв света остался в щитовой. Поздний маршрут будет темнее.',
    });
  }
}

export function expandServiceFloorMachineMaze(
  world: World,
  rng: () => number,
  style: ServiceFloorExpansionStyle,
): void {
  const staffTex = style.floorTex;
  const ductTex = Tex.F_ABYSS;
  const staffWall = style.wallTex;

  carveServiceRun(world, 244, 188, 780, 188, 5, staffTex, staffWall);
  carveServiceRun(world, 244, 836, 780, 836, 5, staffTex, staffWall);
  carveServiceRun(world, 244, 188, 244, 836, 5, staffTex, staffWall);
  carveServiceRun(world, 780, 188, 780, 836, 5, staffTex, staffWall);
  carveServiceRun(world, 244, 514, 408, 514, 5, staffTex, staffWall);
  carveServiceRun(world, 641, 514, 780, 514, 5, staffTex, staffWall);
  carveServiceRun(world, 520, 188, 520, 836, 5, staffTex, staffWall);
  carveServiceRun(world, 244, 324, 780, 324, 3, staffTex, staffWall);
  carveServiceRun(world, 244, 700, 780, 700, 3, staffTex, staffWall);

  const westLift = findServiceRoom(world, 'Западный служебный лифт С-15');
  if (westLift) connectRoomLeft(world, westLift, 244, 514, DoorState.CLOSED);
  const eastLift = findServiceRoom(world, 'Восточный служебный лифт С-15');
  if (eastLift) connectRoomRight(world, eastLift, 780, 514, DoorState.CLOSED);

  const cores = [
    stampMachineCore(world, 160, 170, 58, 36, 'Северо-западное лифтовое ядро С-15', 244, 'right'),
    stampMachineCore(world, 806, 170, 58, 36, 'Северо-восточное лифтовое ядро С-15', 780, 'left'),
    stampMachineCore(world, 160, 818, 60, 38, 'Юго-западное лифтовое ядро С-15', 244, 'right'),
    stampMachineCore(world, 804, 818, 60, 38, 'Юго-восточное лифтовое ядро С-15', 780, 'left'),
    stampMachineCore(world, 456, 140, 128, 34, 'Верхняя лебедочная галерея С-15', 188, 'down'),
    stampMachineCore(world, 448, 860, 128, 34, 'Нижняя лебедочная галерея С-15', 836, 'up'),
  ];

  for (let i = 0; i < cores.length; i++) {
    dressMachineCore(world, cores[i], i);
  }

  const booths = [
    stampControlBooth(world, 235, 142, 'Пульт северо-западного обхода С-15', 244, 188, 'down'),
    stampControlBooth(world, 758, 142, 'Пульт северо-восточного обхода С-15', 780, 188, 'down'),
    stampControlBooth(world, 235, 810, 'Пульт нижнего западного обхода С-15', 244, 836, 'down'),
    stampControlBooth(world, 758, 810, 'Пульт нижнего восточного обхода С-15', 780, 836, 'down'),
    stampControlBooth(world, 496, 226, 'Пост наблюдения над шахтами С-15', 520, 226, 'right'),
    stampControlBooth(world, 496, 762, 'Пост учета кабельных потерь С-15', 520, 762, 'right'),
  ];
  for (const booth of booths) dressControlBooth(world, booth);

  const pumps = [
    stampPumpAlcove(world, 304, 666, 46, 28, 'Насосная ниша западного стояка С-15', 700, 'down'),
    stampPumpAlcove(world, 674, 666, 46, 28, 'Насосная ниша восточного стояка С-15', 700, 'down'),
    stampPumpAlcove(world, 302, 274, 46, 28, 'Компрессорный карман западной шахты С-15', 324, 'down'),
    stampPumpAlcove(world, 676, 274, 46, 28, 'Компрессорный карман восточной шахты С-15', 324, 'down'),
  ];
  for (const pump of pumps) dressPumpAlcove(world, pump);

  carveDuctBypass(world, 244, 188, 430, 486, ductTex);
  carveDuctBypass(world, 780, 188, 560, 486, ductTex);
  carveDuctBypass(world, 244, 836, 430, 538, ductTex);
  carveDuctBypass(world, 780, 836, 562, 538, ductTex);
  carveDuctBypass(world, 244, 324, 520, 514, ductTex);
  carveDuctBypass(world, 780, 700, 520, 514, ductTex);

  carveCableTrench(world, 332, 188, 332, 836, rng);
  carveCableTrench(world, 704, 188, 704, 836, rng);
  carveCableTrench(world, 244, 438, 780, 438, rng);
  carveCableTrench(world, 244, 590, 780, 590, rng);

  dressServiceRoutes(world, rng);
}

function stampServiceRoom(
  world: World,
  type: RoomType,
  x: number,
  y: number,
  w: number,
  h: number,
  name: string,
  wallTex: Tex,
  floorTex: Tex,
): Room {
  const room = stampRoom(world, world.rooms.length, type, x, y, w, h, -1);
  room.name = name;
  room.wallTex = wallTex;
  room.floorTex = floorTex;
  for (let dy = -1; dy <= h; dy++) {
    for (let dx = -1; dx <= w; dx++) {
      const ci = world.idx(x + dx, y + dy);
      if (world.cells[ci] === Cell.WALL) world.wallTex[ci] = wallTex;
      if (dx >= 0 && dx < w && dy >= 0 && dy < h) world.floorTex[ci] = floorTex;
    }
  }
  return room;
}

function findServiceRoom(world: World, name: string): Room | undefined {
  return world.rooms.find(room => room.name === name);
}

function carveStaffRoute(world: World, x: number, y: number, w: number, h: number): void {
  for (let dy = -1; dy <= h; dy++) {
    for (let dx = -1; dx <= w; dx++) {
      const ci = world.idx(x + dx, y + dy);
      if (dx < 0 || dx >= w || dy < 0 || dy >= h) {
        if (world.cells[ci] === Cell.WALL) world.wallTex[ci] = Tex.METAL;
      } else {
        world.cells[ci] = Cell.FLOOR;
        world.roomMap[ci] = -1;
        world.floorTex[ci] = Tex.F_CONCRETE;
      }
    }
  }
}

function carveServiceRun(
  world: World,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  width: number,
  floorTex: Tex,
  wallTex: Tex,
): void {
  const half = width >> 1;
  if (ay === by) {
    const x = Math.min(ax, bx);
    carveExpansionRect(world, x, ay - half, Math.abs(bx - ax) + 1, width, floorTex, wallTex);
    return;
  }
  const y = Math.min(ay, by);
  carveExpansionRect(world, ax - half, y, width, Math.abs(by - ay) + 1, floorTex, wallTex);
}

function carveExpansionRect(
  world: World,
  x: number,
  y: number,
  w: number,
  h: number,
  floorTex: Tex,
  wallTex: Tex,
): void {
  for (let dy = -1; dy <= h; dy++) {
    for (let dx = -1; dx <= w; dx++) {
      const ci = world.idx(x + dx, y + dy);
      if (dx < 0 || dx >= w || dy < 0 || dy >= h) {
        if (world.cells[ci] === Cell.WALL) world.wallTex[ci] = wallTex;
      } else {
        openExpansionTile(world, x + dx, y + dy, floorTex);
      }
    }
  }
}

function openExpansionTile(world: World, x: number, y: number, floorTex: Tex): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] === Cell.LIFT || world.cells[ci] === Cell.DOOR) return;
  if (world.roomMap[ci] >= 0 && world.cells[ci] !== Cell.WALL) return;
  world.cells[ci] = Cell.FLOOR;
  world.roomMap[ci] = -1;
  world.floorTex[ci] = floorTex;
  if (world.features[ci] !== Feature.NONE) world.features[ci] = Feature.NONE;
}

function openRouteTile(world: World, x: number, y: number, floorTex = Tex.F_CONCRETE): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] === Cell.LIFT) return;
  world.cells[ci] = Cell.FLOOR;
  world.roomMap[ci] = -1;
  world.floorTex[ci] = floorTex;
}

function stampMachineCore(
  world: World,
  x: number,
  y: number,
  w: number,
  h: number,
  name: string,
  route: number,
  side: 'left' | 'right' | 'up' | 'down',
): Room {
  const room = stampServiceRoom(world, RoomType.PRODUCTION, x, y, w, h, name, Tex.PIPE, Tex.F_CONCRETE);
  const midX = room.x + (room.w >> 1);
  const midY = room.y + (room.h >> 1);
  if (side === 'left') connectRoomLeft(world, room, route, midY, DoorState.CLOSED);
  else if (side === 'right') connectRoomRight(world, room, route, midY, DoorState.CLOSED);
  else if (side === 'up') connectRoomUp(world, room, midX, route, DoorState.CLOSED);
  else connectRoomDown(world, room, midX, route, DoorState.CLOSED);
  return room;
}

function stampControlBooth(
  world: World,
  x: number,
  y: number,
  name: string,
  routeX: number,
  routeY: number,
  side: 'left' | 'right' | 'up' | 'down',
): Room {
  const room = stampServiceRoom(world, RoomType.OFFICE, x, y, 18, 12, name, Tex.METAL, Tex.F_TILE);
  if (side === 'left') connectRoomLeft(world, room, routeX, routeY, DoorState.LOCKED, 'key');
  else if (side === 'right') connectRoomRight(world, room, routeX, routeY, DoorState.LOCKED, 'key');
  else if (side === 'up') connectRoomUp(world, room, room.x + (room.w >> 1), routeY, DoorState.LOCKED, 'key');
  else connectRoomDown(world, room, room.x + (room.w >> 1), routeY, DoorState.LOCKED, 'key');
  return room;
}

function stampPumpAlcove(
  world: World,
  x: number,
  y: number,
  w: number,
  h: number,
  name: string,
  routeY: number,
  side: 'up' | 'down',
): Room {
  const room = stampServiceRoom(world, RoomType.PRODUCTION, x, y, w, h, name, Tex.PIPE, Tex.F_WATER);
  const midX = room.x + (room.w >> 1);
  if (side === 'up') connectRoomUp(world, room, midX, routeY, DoorState.CLOSED);
  else connectRoomDown(world, room, midX, routeY, DoorState.CLOSED);
  return room;
}

function setFeature(world: World, x: number, y: number, feature: Feature): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] === Cell.WALL || world.cells[ci] === Cell.LIFT) return;
  world.features[ci] = feature;
}

function addDoor(world: World, room: Room, x: number, y: number, state: DoorState, keyId = ''): number {
  const ci = world.idx(x, y);
  world.cells[ci] = Cell.DOOR;
  world.wallTex[ci] = room.wallTex;
  world.doors.set(ci, { idx: ci, state, roomA: room.id, roomB: -1, keyId, timer: 0 });
  room.doors.push(ci);
  return ci;
}

function connectRoomDown(world: World, room: Room, x: number, targetY: number, state: DoorState, keyId = ''): number {
  const doorY = room.y + room.h;
  const doorId = addDoor(world, room, x, doorY, state, keyId);
  for (let y = doorY + 1; y <= targetY; y++) openRouteTile(world, x, y, room.floorTex);
  return doorId;
}

function connectRoomUp(world: World, room: Room, x: number, targetY: number, state: DoorState, keyId = ''): number {
  const doorY = room.y - 1;
  const doorId = addDoor(world, room, x, doorY, state, keyId);
  for (let y = doorY - 1; y >= targetY; y--) openRouteTile(world, x, y, room.floorTex);
  return doorId;
}

function connectRoomLeft(world: World, room: Room, targetX: number, y: number, state: DoorState, keyId = ''): number {
  const doorX = room.x - 1;
  const doorId = addDoor(world, room, doorX, y, state, keyId);
  for (let x = doorX - 1; x >= targetX; x--) openRouteTile(world, x, y, room.floorTex);
  return doorId;
}

function connectRoomRight(world: World, room: Room, targetX: number, y: number, state: DoorState, keyId = ''): number {
  const doorX = room.x + room.w;
  const doorId = addDoor(world, room, doorX, y, state, keyId);
  for (let x = doorX + 1; x <= targetX; x++) openRouteTile(world, x, y, room.floorTex);
  return doorId;
}

function placeLift(world: World, x: number, y: number, direction: LiftDirection): void {
  const ci = world.idx(x, y);
  world.cells[ci] = Cell.LIFT;
  world.wallTex[ci] = Tex.LIFT_DOOR;
  world.liftDir[ci] = direction;
  setFeature(world, x + 1, y, Feature.LIFT_BUTTON);
  world.liftDir[world.idx(x + 1, y)] = direction;
}

function dressCorridors(world: World): void {
  for (let x = 438; x < 612; x += 12) {
    setFeature(world, x, 514, x % 24 === 0 ? Feature.SCREEN : Feature.LAMP);
  }
  for (let y = 484; y < 556; y += 10) {
    setFeature(world, 522, y, y % 20 === 0 ? Feature.APPARATUS : Feature.LAMP);
  }
  for (let x = 458; x < 570; x += 16) {
    setFeature(world, x, 505, Feature.APPARATUS);
  }
  for (let x = 480; x < 562; x += 14) {
    setFeature(world, x, 539, Feature.SHELF);
  }
}

function dressServiceRoutes(world: World, rng: () => number): void {
  for (let x = 268; x <= 756; x += 28) {
    setFeature(world, x, 188, x % 84 === 0 ? Feature.SCREEN : Feature.LAMP);
    setFeature(world, x, 836, x % 84 === 0 ? Feature.APPARATUS : Feature.LAMP);
  }
  for (let y = 224; y <= 804; y += 30) {
    setFeature(world, 244, y, y % 90 === 0 ? Feature.SCREEN : Feature.APPARATUS);
    setFeature(world, 780, y, y % 90 === 0 ? Feature.SCREEN : Feature.APPARATUS);
  }
  for (let x = 280; x <= 748; x += 36) {
    setFeature(world, x, 324, Feature.APPARATUS);
    setFeature(world, x, 700, Feature.SHELF);
  }
  for (let y = 216; y <= 808; y += 44) {
    setFeature(world, 520, y, rng() < 0.55 ? Feature.LAMP : Feature.SCREEN);
  }
}

function dressLiftMachine(world: World, room: Room): void {
  for (let y = room.y + 2; y < room.y + room.h - 2; y += 3) {
    setFeature(world, room.x + 2, y, Feature.MACHINE);
    setFeature(world, room.x + room.w - 3, y, Feature.APPARATUS);
  }
  for (let x = room.x + 6; x < room.x + room.w - 4; x += 5) {
    setFeature(world, x, room.y + 2, Feature.SCREEN);
    setFeature(world, x, room.y + room.h - 3, Feature.LAMP);
    world.stamp(x, room.y + 9, 0.5, 0.5, 0.18, 70, room.id * 53 + x, 30, 30, 35);
  }
  setFeature(world, room.x + 5, room.y + 5, Feature.LIFT_BUTTON);
}

function dressMachineCore(world: World, room: Room, seedOffset: number): void {
  const shaftX = room.x + (room.w >> 1) - 2;
  for (let y = room.y + 5; y < room.y + room.h - 5; y++) {
    for (let x = shaftX; x < shaftX + 4; x++) {
      const ci = world.idx(x, y);
      if (world.roomMap[ci] !== room.id || world.cells[ci] !== Cell.FLOOR) continue;
      world.cells[ci] = Cell.ABYSS;
      world.floorTex[ci] = Tex.F_ABYSS;
      world.features[ci] = Feature.NONE;
    }
  }
  for (let y = room.y + 3; y < room.y + room.h - 3; y += 4) {
    setFeature(world, room.x + 3, y, Feature.MACHINE);
    setFeature(world, room.x + room.w - 4, y, Feature.APPARATUS);
  }
  for (let x = room.x + 8; x < room.x + room.w - 8; x += 8) {
    setFeature(world, x, room.y + 3, Feature.SCREEN);
    setFeature(world, x, room.y + room.h - 4, Feature.LAMP);
    world.stamp(x, room.y + (room.h >> 1), 0.5, 0.5, 2.4, 0.18, room.id * 311 + seedOffset * 17 + x, 22, 24, 28);
  }
  setFeature(world, room.x + 5, room.y + 5, Feature.LIFT_BUTTON);
}

function dressControlBooth(world: World, room: Room): void {
  setFeature(world, room.x + 3, room.y + 3, Feature.DESK);
  setFeature(world, room.x + 4, room.y + 3, Feature.SCREEN);
  setFeature(world, room.x + room.w - 4, room.y + 3, Feature.SCREEN);
  setFeature(world, room.x + 4, room.y + room.h - 4, Feature.SHELF);
  setFeature(world, room.x + room.w - 5, room.y + room.h - 4, Feature.LAMP);
}

function dressPumpAlcove(world: World, room: Room): void {
  for (let x = room.x + 4; x < room.x + room.w - 4; x++) {
    const ci = world.idx(x, room.y + (room.h >> 1));
    if (world.roomMap[ci] === room.id && world.cells[ci] === Cell.FLOOR) {
      world.cells[ci] = Cell.WATER;
      world.floorTex[ci] = Tex.F_WATER;
    }
  }
  for (let y = room.y + 3; y < room.y + room.h - 3; y += 5) {
    setFeature(world, room.x + 3, y, Feature.MACHINE);
    setFeature(world, room.x + room.w - 4, y, Feature.APPARATUS);
  }
  setFeature(world, room.x + (room.w >> 1), room.y + 3, Feature.SCREEN);
}

function dressBreakerRoom(world: World, room: Room): void {
  for (let x = room.x + 2; x < room.x + room.w - 2; x += 3) {
    setFeature(world, x, room.y + 2, Feature.APPARATUS);
    setFeature(world, x, room.y + 5, Feature.SCREEN);
  }
  setFeature(world, room.x + 3, room.y + room.h - 3, Feature.DESK);
  setFeature(world, room.x + room.w - 4, room.y + room.h - 3, Feature.LAMP);
}

function dressJanitorDepot(world: World, room: Room): void {
  for (let y = room.y + 1; y < room.y + room.h - 1; y++) {
    setFeature(world, room.x + 1, y, Feature.SHELF);
    if (y % 3 === 0) setFeature(world, room.x + room.w - 2, y, Feature.SINK);
  }
  setFeature(world, room.x + 5, room.y + 3, Feature.DESK);
  setFeature(world, room.x + 6, room.y + room.h - 3, Feature.LAMP);
}

function dressVentJunction(world: World, room: Room): void {
  for (let x = room.x + 3; x < room.x + room.w - 3; x += 4) {
    for (let y = room.y + 3; y < room.y + room.h - 3; y += 4) {
      setFeature(world, x, y, Feature.APPARATUS);
      world.stamp(x, y, 0.5, 0.5, 0.22, 90, room.id * 97 + x + y, 20, 22, 25);
    }
  }
  setFeature(world, room.x + room.w - 4, room.y + 2, Feature.LAMP);
}

function dressCanteen(world: World, room: Room): void {
  for (let x = room.x + 4; x < room.x + room.w - 4; x += 7) {
    setFeature(world, x, room.y + 5, Feature.TABLE);
    setFeature(world, x - 1, room.y + 5, Feature.CHAIR);
    setFeature(world, x + 1, room.y + 5, Feature.CHAIR);
  }
  setFeature(world, room.x + 2, room.y + 2, Feature.STOVE);
  setFeature(world, room.x + 5, room.y + 2, Feature.SINK);
  setFeature(world, room.x + room.w - 4, room.y + room.h - 4, Feature.LAMP);
}

function dressClerkOffice(world: World, room: Room): void {
  for (let y = room.y + 2; y < room.y + room.h - 2; y += 3) {
    setFeature(world, room.x + 2, y, Feature.SHELF);
    setFeature(world, room.x + room.w - 3, y, Feature.SCREEN);
  }
  setFeature(world, room.x + 7, room.y + 6, Feature.DESK);
  setFeature(world, room.x + 9, room.y + 6, Feature.CHAIR);
  setFeature(world, room.x + 4, room.y + 2, Feature.LAMP);
}

function carveDuctBypass(world: World, ax: number, ay: number, bx: number, by: number, floorTex: Tex): void {
  const elbowX = ax;
  const elbowY = by;
  carveServiceRun(world, ax, ay, elbowX, elbowY, 1, floorTex, Tex.DARK);
  carveServiceRun(world, elbowX, elbowY, bx, by, 1, floorTex, Tex.DARK);
  const minX = Math.min(elbowX, bx);
  const maxX = Math.max(elbowX, bx);
  for (let x = minX; x <= maxX; x += 12) setFeature(world, x, by, Feature.APPARATUS);
  const minY = Math.min(ay, elbowY);
  const maxY = Math.max(ay, elbowY);
  for (let y = minY; y <= maxY; y += 14) setFeature(world, ax, y, Feature.SHELF);
}

function carveCableTrench(world: World, ax: number, ay: number, bx: number, by: number, rng: () => number): void {
  carveServiceRun(world, ax, ay, bx, by, 2, Tex.F_ABYSS, Tex.PIPE);
  if (ax === bx) {
    const minY = Math.min(ay, by);
    const maxY = Math.max(ay, by);
    for (let y = minY; y <= maxY; y += 22) {
      setFeature(world, ax - 1, y, rng() < 0.5 ? Feature.APPARATUS : Feature.SCREEN);
      world.stamp(ax, y, 0.5, 0.5, 1.8, 0.14, ax * 997 + y, 18, 20, 24);
    }
  } else {
    const minX = Math.min(ax, bx);
    const maxX = Math.max(ax, bx);
    for (let x = minX; x <= maxX; x += 24) {
      setFeature(world, x, ay - 1, rng() < 0.5 ? Feature.APPARATUS : Feature.SCREEN);
      world.stamp(x, ay, 0.5, 0.5, 1.8, 0.14, ay * 991 + x, 18, 20, 24);
    }
  }
}

function generateServiceZones(world: World, rooms: Room[]): void {
  const zoneSize = W / 8;
  world.zones = [];
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const id = y * 8 + x;
      world.zones.push({
        id,
        cx: Math.floor(x * zoneSize + zoneSize / 2),
        cy: Math.floor(y * zoneSize + zoneSize / 2),
        faction: ZoneFaction.LIQUIDATOR,
        hasLift: false,
        fogged: false,
        level: 3,
        hqRoomId: -1,
      });
    }
  }
  for (let y = 0; y < W; y++) {
    const zy = Math.min(7, Math.floor(y / zoneSize));
    for (let x = 0; x < W; x++) {
      const zx = Math.min(7, Math.floor(x / zoneSize));
      world.zoneMap[y * W + x] = zy * 8 + zx;
      world.factionControl[y * W + x] = ZoneFaction.LIQUIDATOR;
    }
  }
  for (const room of rooms) {
    const zi = world.zoneMap[world.idx(room.x + Math.floor(room.w / 2), room.y + Math.floor(room.h / 2))];
    const zone = world.zones[zi];
    if (!zone) continue;
    zone.hasLift = zone.hasLift || room.name.includes('лифт');
    zone.level = Math.max(zone.level, room.name === VENT_JUNCTION ? 4 : 3);
  }
}

function spawnPlotNpc(
  entities: Entity[],
  nextId: { v: number },
  npcId: string,
  def: PlotNpcDef,
  x: number,
  y: number,
  angle: number,
): number {
  const id = nextId.v++;
  entities.push({
    id, type: EntityType.NPC,
    x: x + 0.5, y: y + 0.5, angle, pitch: 0,
    alive: true, speed: def.speed, sprite: def.sprite,
    name: def.name, isFemale: def.isFemale,
    needs: freshNeeds(), hp: def.hp, maxHp: def.maxHp, money: def.money,
    ai: { goal: AIGoal.IDLE, tx: 0, ty: 0, path: [], pi: 0, stuck: 0, timer: 0 },
    inventory: def.inventory.map(i => ({ ...i })),
    faction: def.faction, occupation: def.occupation,
    plotNpcId: npcId, canGiveQuest: true, questId: -1,
  });
  return id;
}

function addServiceContainer(
  world: World,
  room: Room,
  x: number,
  y: number,
  kind: ContainerKind,
  name: string,
  access: WorldContainer['access'],
  inventory: Item[],
  ownerNpcId: number | undefined,
  ownerName: string | undefined,
  tags: string[],
): WorldContainer {
  const container: WorldContainer = {
    id: nextContainerId(world),
    x,
    y,
    floor: SERVICE_FLOOR_BASE_FLOOR,
    roomId: room.id,
    zoneId: world.zoneMap[world.idx(x, y)],
    kind,
    name,
    inventory: inventory.map(i => ({ ...i })),
    capacitySlots: Math.max(8, inventory.length + 4),
    ownerNpcId,
    ownerName,
    access,
    discovered: access !== 'secret',
    tags,
  };
  world.addContainer(container);
  setFeature(world, x, y, kind === ContainerKind.FRIDGE ? Feature.SINK : Feature.SHELF);
  return container;
}

function nextContainerId(world: World): number {
  let id = 1;
  for (const container of world.containers) id = Math.max(id, container.id + 1);
  return id;
}

function dropItems(world: World, entities: Entity[], nextId: { v: number }, room: Room, itemIds: string[]): void {
  for (let n = 0; n < itemIds.length; n++) {
    const x = room.x + 2 + ((n * 5) % Math.max(1, room.w - 4));
    const y = room.y + 2 + ((n * 3) % Math.max(1, room.h - 4));
    const ci = world.idx(x, y);
    if (world.cells[ci] !== Cell.FLOOR) continue;
    entities.push({
      id: nextId.v++, type: EntityType.ITEM_DROP,
      x: x + 0.5, y: y + 0.5, angle: 0, pitch: 0,
      alive: true, speed: 0, sprite: Spr.ITEM_DROP,
      inventory: [{ defId: itemIds[n], count: 1 }],
    });
  }
}

function spawnMonsterPack(
  world: World,
  entities: Entity[],
  nextId: { v: number },
  x: number,
  y: number,
  kinds: MonsterKind[],
): void {
  for (let i = 0; i < kinds.length; i++) {
    const kind = kinds[i];
    const def = MONSTERS[kind];
    if (!def) continue;
    const mx = x + (i % 2) * 3 - 1;
    const my = y + Math.floor(i / 2) * 3 - 1;
    const ci = world.idx(mx, my);
    if (world.cells[ci] !== Cell.FLOOR) continue;
    const zone = world.zones[world.zoneMap[ci]];
    const zoneLevel = zone?.level ?? 3;
    const hp = scaleMonsterHp(def.hp, zoneLevel);
    const monster: Entity = {
      id: nextId.v++, type: EntityType.MONSTER,
      x: mx + 0.5, y: my + 0.5,
      angle: 0, pitch: 0,
      alive: true,
      speed: scaleMonsterSpeed(def.speed, zoneLevel),
      sprite: def.sprite,
      hp, maxHp: hp,
      monsterKind: kind, attackCd: 0,
      ai: { goal: AIGoal.WANDER, tx: x, ty: y, path: [], pi: 0, stuck: 0, timer: 0 },
      rpg: randomRPG(zoneLevel),
    };
    entities.push(monster);
  }
}
