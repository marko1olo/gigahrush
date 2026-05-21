/* -- Design floor: Пионерлагерь ---------------------------------
 * A Soviet summer-camp pocket inside the concrete route. The floor
 * uses generic camp grammar, not copied Everlasting Summer names.
 */

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
  type Item,
  type Room,
  type WorldContainer,
} from '../../core/types';
import { World } from '../../core/world';
import { hashSeed, withSeededRandom } from '../../core/rand';
import { freshNeeds } from '../../data/catalog';
import { type PlotNpcDef, registerSideQuest } from '../../data/plot';
import { MONSTERS, applyMonsterVariant } from '../../entities/monster';
import { monsterSpr, Spr } from '../../render/sprite_index';
import { ensureConnectivity, generateZones, sanitizeDoors, stampRoom } from '../shared';
import type { FloorGeneration } from '../floor_manifest';

export const PIONEER_CAMP_DESIGN_FLOOR_ID = 'pioneer_camp' as const;
export const PIONEER_CAMP_ROUTE_Z = 38;
export const PIONEER_CAMP_BASE_FLOOR = FloorLevel.LIVING;
export const PIONEER_CAMP_DISPLAY_NAME = 'Пионерлагерь';

const CAMP_SEED = hashSeed(PIONEER_CAMP_DESIGN_FLOOR_ID);
const CX = W >> 1;
const CY = W >> 1;

const NPC_IDS = {
  shift: 'camp_shift_tamara',
  radio: 'camp_radio_egor',
  medic: 'camp_medic_ira',
  cook: 'camp_canteen_zoya',
} as const;

type CampNpcId = (typeof NPC_IDS)[keyof typeof NPC_IDS];

interface CampRooms {
  square: Room;
  gate: Room;
  canteen: Room;
  infirmary: Room;
  library: Room;
  radioClub: Room;
  musicClub: Room;
  stage: Room;
  bathhouse: Room;
  boat: Room;
  sport: Room;
  oldCabin: Room;
}

const NPC_DEFS: Record<CampNpcId, PlotNpcDef> = {
  camp_shift_tamara: {
    name: 'Тамара Сменная',
    isFemale: true,
    faction: Faction.SCIENTIST,
    occupation: Occupation.DIRECTOR,
    sprite: Occupation.DIRECTOR,
    hp: 150, maxHp: 150, money: 70, speed: 0.82,
    inventory: [
      { defId: 'blank_form', count: 2 },
      { defId: 'emergency_roster', count: 1 },
      { defId: 'kompot', count: 1 },
    ],
    talkLines: [
      'Смена не заканчивается. По расписанию уже тридцать седьмой тихий час, а дети всё ещё числятся в строю.',
      'Площадь держит лагерь вместе. Если список укрытия врёт, линейка станет очередью в гермодверь.',
      'Не называйте это Совёнком. У нас другая птица, бетонная, и она не спит.',
    ],
    talkLinesPost: [
      'Список сверили. Теперь хотя бы понятно, кого нет, когда все стоят перед нами.',
      'Если услышите горн после сирены, идите не на звук, а к ближайшей двери.',
    ],
  },
  camp_radio_egor: {
    name: 'Егор Радиокружок',
    isFemale: false,
    faction: Faction.SCIENTIST,
    occupation: Occupation.ELECTRICIAN,
    sprite: Occupation.ELECTRICIAN,
    hp: 105, maxHp: 105, money: 44, speed: 0.9,
    inventory: [
      { defId: 'radio', count: 1 },
      { defId: 'wire_coil', count: 1 },
      { defId: 'circuit_board', count: 1 },
    ],
    talkLines: [
      'Радиорубка ловит не эфир, а соседние версии этого лагеря. Все говорят одно и то же с разной задержкой.',
      'Два мотка проволоки, и я заведу громкоговоритель. Можно предупредить столовую, а можно заманить то, что слушает.',
      'Песни лучше не ставить. Последний раз хор подпевал из старого корпуса.',
    ],
    talkLinesPost: [
      'Линия живая. Когда она щёлкает три раза, значит кто-то отвечает из леса.',
      'Громкоговоритель теперь наш. Пока он не решил наоборот.',
    ],
  },
  camp_medic_ira: {
    name: 'Ира Медпункт',
    isFemale: true,
    faction: Faction.CITIZEN,
    occupation: Occupation.DOCTOR,
    sprite: Occupation.DOCTOR,
    hp: 115, maxHp: 115, money: 38, speed: 0.88,
    inventory: [
      { defId: 'bandage', count: 2 },
      { defId: 'iodine', count: 1 },
      { defId: 'pills', count: 1 },
    ],
    talkLines: [
      'Ссадины обычные. Следы строем - нет. После отбоя сюда приходят те, кто должен был спать.',
      'Санитарный набор нужен не для героизма. Для выбора: лечить беглеца из леса или держать запас для линейки.',
      'В медпункте тихо, потому что стены здесь слушают пульс.',
    ],
    talkLinesPost: [
      'Перевязочный запас есть. Это не безопасность, но уже не голые руки.',
      'Если кто-то улыбается одинаково долго, ведите ко мне или сразу к Егору.',
    ],
  },
  camp_canteen_zoya: {
    name: 'Зоя Столовая',
    isFemale: true,
    faction: Faction.CITIZEN,
    occupation: Occupation.COOK,
    sprite: Occupation.COOK,
    hp: 125, maxHp: 125, money: 58, speed: 0.8,
    inventory: [
      { defId: 'kasha', count: 3 },
      { defId: 'kompot', count: 2 },
      { defId: 'knife', count: 1 },
    ],
    talkLines: [
      'Перловка держит строй лучше вожатых. Главное - не спрашивать, кто стоял в кастрюле до крупы.',
      'Сахар принеси. Сделаю компот для живых или сироп для тех, кто притворяется детьми.',
      'Из столовой проще всего украсть. Потом весь лагерь знает, кто ел слишком тихо.',
    ],
    talkLinesPost: [
      'Компот есть. Дежурные спорят, кому положен первый ковш.',
      'Если в каше что-то шевелится, не мешайте вообще. Зовите дежурного и отходите от котла.',
    ],
  },
};

registerSideQuest(NPC_IDS.shift, NPC_DEFS.camp_shift_tamara, [{
  id: 'camp_verify_roster',
  giverNpcId: NPC_IDS.shift,
  type: QuestType.FETCH,
  desc: 'Тамара Сменная: «Найди список укрытия у старого корпуса. Решим, кого прятать, а кого уже только числить.»',
  targetItem: 'emergency_roster',
  targetCount: 1,
  rewardItem: 'blank_form',
  rewardCount: 2,
  extraRewards: [{ defId: 'child_map', count: 1 }],
  relationDelta: 12,
  xpReward: 55,
  moneyReward: 35,
}]);

registerSideQuest(NPC_IDS.radio, NPC_DEFS.camp_radio_egor, [{
  id: 'camp_repair_loudspeaker',
  giverNpcId: NPC_IDS.radio,
  type: QuestType.FETCH,
  desc: 'Егор Радиокружок: «Два мотка проволоки - и громкоговоритель будет предупреждать лагерь, а не только повторять лес.»',
  targetItem: 'wire_coil',
  targetCount: 2,
  rewardItem: 'radio',
  rewardCount: 1,
  extraRewards: [{ defId: 'ammo_energy', count: 1 }],
  relationDelta: 10,
  xpReward: 60,
  moneyReward: 30,
}]);

registerSideQuest(NPC_IDS.medic, NPC_DEFS.camp_medic_ira, [{
  id: 'camp_medpost_choice',
  giverNpcId: NPC_IDS.medic,
  type: QuestType.FETCH,
  desc: 'Ира Медпункт: «Санитарный набор в медпункт. Потом выберем: перевязать беглеца из леса или оставить запас на сирену.»',
  targetItem: 'sanitary_kit',
  targetCount: 1,
  rewardItem: 'bandage',
  rewardCount: 3,
  extraRewards: [{ defId: 'pills', count: 1 }],
  relationDelta: 12,
  xpReward: 50,
  moneyReward: 28,
}]);

registerSideQuest(NPC_IDS.cook, NPC_DEFS.camp_canteen_zoya, [{
  id: 'camp_canteen_compote',
  giverNpcId: NPC_IDS.cook,
  type: QuestType.FETCH,
  desc: 'Зоя Столовая: «Принеси прессованный сахар. Сварю компот: можно накормить отряд, можно купить тишину у очереди.»',
  targetItem: 'pressed_sugar',
  targetCount: 2,
  rewardItem: 'kompot',
  rewardCount: 3,
  extraRewards: [{ defId: 'kasha', count: 2 }],
  relationDelta: 8,
  xpReward: 40,
  moneyReward: 24,
}]);

export function generatePioneerCampDesignFloor(seed = CAMP_SEED): FloorGeneration {
  return withSeededRandom(seed, () => {
    const world = new World();
    const entities: Entity[] = [];
    const nextId = { v: 1 };

    initCampWorld(world);
    const rooms = buildCampCore(world);
    buildCampPaths(world, rooms);
    decorateCampCore(world, rooms);
    placeCampLifts(world, rooms);

    generateZones(world);
    tuneCampZones(world);

    const owners = spawnCampNpcs(entities, nextId, rooms);
    spawnCampCrowd(entities, nextId, rooms);
    placeCampContainers(world, rooms, owners);
    placeCampDrops(world, entities, nextId, rooms);
    spawnCampThreats(world, entities, nextId, rooms);

    sanitizeDoors(world);
    ensureConnectivity(world, rooms.gate.x + 8.5, rooms.gate.y + 8.5);
    world.rebuildContainerMap();
    world.bakeLights();

    return {
      world,
      entities,
      spawnX: rooms.gate.x + 8.5,
      spawnY: rooms.gate.y + 8.5,
    };
  });
}

export function expandPioneerCampFullFloor(world: World, rng: () => number): void {
  const mask = campProtectedMask(world);
  carveSafeTrailLoop(world, mask, 210, 210, 604, 604, 4, Tex.F_WOOD);
  carveSafeTrailLoop(world, mask, 112, 132, 800, 756, 2, Tex.F_CONCRETE);

  for (const [ax, ay, bx, by] of [
    [CX, CY - 36, 512, 132],
    [CX - 54, CY, 160, 512],
    [CX + 54, CY, 864, 512],
    [CX, CY + 58, 512, 888],
    [420, 468, 238, 238],
    [602, 552, 790, 790],
  ] as const) {
    carveSafeLine(world, mask, ax, ay, bx, by, 3, Tex.F_WOOD);
  }

  const cabinSpecs = [
    [250, 258], [308, 238], [366, 260], [708, 252], [766, 286],
    [238, 704], [306, 754], [696, 716], [762, 748], [830, 704],
  ] as const;
  for (let i = 0; i < cabinSpecs.length; i++) {
    const [x, y] = cabinSpecs[i];
    const room = addCampRoom(world, RoomType.LIVING, x, y, 16, 11, `Спальный домик ${i + 1}`, Tex.PANEL, Tex.F_WOOD);
    const doorX = room.x + (room.w >> 1);
    const doorY = y < CY ? room.y + room.h : room.y - 1;
    addCampDoor(world, room, doorX, doorY, DoorState.CLOSED);
    carveSafeLine(world, mask, doorX, y < CY ? doorY + 1 : doorY - 1, CX, CY, 2, Tex.F_WOOD);
    setFeature(world, room.x + 3, room.y + 3, Feature.BED);
    setFeature(world, room.x + room.w - 4, room.y + 3, Feature.BED);
    setFeature(world, room.x + 7, room.y + room.h - 3, Feature.TABLE);
    if (i % 3 === 0) markPosterWall(world, room.x + 6, room.y - 1, 31 + i);
  }

  for (let i = 0; i < 34; i++) {
    const x = 84 + Math.floor(rng() * 856);
    const y = 92 + Math.floor(rng() * 840);
    const ci = world.idx(x, y);
    if (mask[ci] || world.cells[ci] !== Cell.WALL) continue;
    world.wallTex[ci] = rng() < 0.6 ? Tex.ROTTEN : Tex.PANEL;
    if (rng() < 0.35) world.stamp(x, y, 0.5, 0.5, 0.8, 0.16, 4100 + i, 42, 88, 52, true);
  }

  for (let i = 0; i < 44; i++) {
    const x = 120 + Math.floor(rng() * 784);
    const y = 120 + Math.floor(rng() * 784);
    const ci = world.idx(x, y);
    if (mask[ci] || world.cells[ci] !== Cell.FLOOR || world.features[ci] !== Feature.NONE) continue;
    world.features[ci] = rng() < 0.72 ? Feature.LAMP : Feature.CANDLE;
  }
}

function initCampWorld(world: World): void {
  for (let i = 0; i < W * W; i++) {
    world.wallTex[i] = Tex.PANEL;
    world.floorTex[i] = Tex.F_CONCRETE;
    world.factionControl[i] = ZoneFaction.CITIZEN;
  }
}

function buildCampCore(world: World): CampRooms {
  const square = addOpenArea(world, RoomType.COMMON, CX - 45, CY - 34, 90, 68, 'Площадь обязательной линейки', Tex.F_CONCRETE);
  const gate = addCampRoom(world, RoomType.CORRIDOR, CX - 34, CY - 126, 68, 20, 'Ворота и остановка лагеря', Tex.BRICK, Tex.F_CONCRETE);
  const canteen = addCampRoom(world, RoomType.KITCHEN, CX + 58, CY + 40, 48, 26, 'Столовая на три бесконечных обеда', Tex.TILE_W, Tex.F_TILE);
  const infirmary = addCampRoom(world, RoomType.MEDICAL, CX - 92, CY + 42, 32, 22, 'Медпункт тихого часа', Tex.TILE_W, Tex.F_TILE);
  const library = addCampRoom(world, RoomType.COMMON, CX - 108, CY - 64, 42, 24, 'Библиотека обязательного чтения', Tex.PANEL, Tex.F_WOOD);
  const radioClub = addCampRoom(world, RoomType.PRODUCTION, CX + 62, CY - 66, 38, 24, 'Радиокружок с чужим эфиром', Tex.METAL, Tex.F_CONCRETE);
  const musicClub = addCampRoom(world, RoomType.COMMON, CX + 112, CY - 46, 32, 20, 'Музыкальный кружок без припева', Tex.PANEL, Tex.F_WOOD);
  const stage = addOpenArea(world, RoomType.COMMON, CX - 30, CY + 56, 60, 22, 'Сцена вечерней линейки', Tex.F_WOOD);
  const bathhouse = addCampRoom(world, RoomType.BATHROOM, CX - 142, CY + 128, 34, 22, 'Умывальники и банный ряд', Tex.TILE_W, Tex.F_WATER);
  const boat = addCampRoom(world, RoomType.STORAGE, CX + 90, CY + 128, 38, 20, 'Лодочная станция у бетонной воды', Tex.ROTTEN, Tex.F_WOOD);
  const sport = addOpenArea(world, RoomType.COMMON, CX + 132, CY + 80, 58, 34, 'Спортплощадка под сеткой труб', Tex.F_CONCRETE);
  const oldCabin = addCampRoom(world, RoomType.STORAGE, CX - 214, CY - 148, 34, 22, 'Старый корпус за лесной тропой', Tex.ROTTEN, Tex.F_WOOD);
  return { square, gate, canteen, infirmary, library, radioClub, musicClub, stage, bathhouse, boat, sport, oldCabin };
}

function buildCampPaths(world: World, rooms: CampRooms): void {
  carveLineWidth(world, CX, CY - 34, CX, rooms.gate.y + rooms.gate.h + 1, 4, Tex.F_WOOD);
  carveLineWidth(world, CX - 45, CY, rooms.library.x + rooms.library.w + 1, CY - 52, 3, Tex.F_WOOD);
  carveLineWidth(world, CX + 45, CY, rooms.radioClub.x - 1, CY - 54, 3, Tex.F_WOOD);
  carveLineWidth(world, CX + 45, CY + 16, rooms.canteen.x - 1, rooms.canteen.y + 13, 4, Tex.F_WOOD);
  carveLineWidth(world, CX - 45, CY + 18, rooms.infirmary.x + rooms.infirmary.w + 1, rooms.infirmary.y + 12, 3, Tex.F_WOOD);
  carveLineWidth(world, CX, CY + 34, CX, rooms.stage.y - 1, 4, Tex.F_WOOD);
  carveLineWidth(world, rooms.stage.x + 30, rooms.stage.y + rooms.stage.h + 1, CX - 124, rooms.bathhouse.y + 11, 3, Tex.F_WOOD);
  carveLineWidth(world, rooms.stage.x + 32, rooms.stage.y + rooms.stage.h + 1, rooms.boat.x + 2, rooms.boat.y + 10, 3, Tex.F_WOOD);
  carveLineWidth(world, rooms.radioClub.x + rooms.radioClub.w + 1, rooms.radioClub.y + 10, rooms.musicClub.x - 1, rooms.musicClub.y + 10, 2, Tex.F_WOOD);
  carveLineWidth(world, rooms.library.x, rooms.library.y + 12, rooms.oldCabin.x + rooms.oldCabin.w + 1, rooms.oldCabin.y + 11, 2, Tex.F_WOOD);

  connectCampRoom(world, rooms.gate, rooms.gate.x + 34, rooms.gate.y + rooms.gate.h, rooms.gate.x + 34, rooms.gate.y + rooms.gate.h + 1);
  connectCampRoom(world, rooms.library, rooms.library.x + rooms.library.w, rooms.library.y + 12, rooms.library.x + rooms.library.w + 1, rooms.library.y + 12);
  connectCampRoom(world, rooms.radioClub, rooms.radioClub.x, rooms.radioClub.y + 12, rooms.radioClub.x - 1, rooms.radioClub.y + 12);
  connectCampRoom(world, rooms.musicClub, rooms.musicClub.x, rooms.musicClub.y + 10, rooms.musicClub.x - 1, rooms.musicClub.y + 10);
  connectCampRoom(world, rooms.canteen, rooms.canteen.x, rooms.canteen.y + 13, rooms.canteen.x - 1, rooms.canteen.y + 13);
  connectCampRoom(world, rooms.infirmary, rooms.infirmary.x + rooms.infirmary.w, rooms.infirmary.y + 12, rooms.infirmary.x + rooms.infirmary.w + 1, rooms.infirmary.y + 12);
  connectCampRoom(world, rooms.bathhouse, rooms.bathhouse.x + rooms.bathhouse.w, rooms.bathhouse.y + 11, rooms.bathhouse.x + rooms.bathhouse.w + 1, rooms.bathhouse.y + 11);
  connectCampRoom(world, rooms.boat, rooms.boat.x, rooms.boat.y + 10, rooms.boat.x - 1, rooms.boat.y + 10);
  connectCampRoom(world, rooms.oldCabin, rooms.oldCabin.x + rooms.oldCabin.w, rooms.oldCabin.y + 11, rooms.oldCabin.x + rooms.oldCabin.w + 1, rooms.oldCabin.y + 11, DoorState.LOCKED, 'child_map');

  carveBeachAndWater(world, rooms.boat);
}

function decorateCampCore(world: World, rooms: CampRooms): void {
  setFeature(world, CX, CY, Feature.APPARATUS);
  setFeature(world, CX - 2, CY, Feature.CANDLE);
  setFeature(world, CX + 2, CY, Feature.CANDLE);
  for (let x = rooms.square.x + 10; x < rooms.square.x + rooms.square.w - 8; x += 14) {
    setFeature(world, x, rooms.square.y + 8, Feature.CHAIR);
    setFeature(world, x, rooms.square.y + rooms.square.h - 9, Feature.CHAIR);
  }
  for (let y = rooms.square.y + 12; y < rooms.square.y + rooms.square.h - 8; y += 12) {
    setFeature(world, rooms.square.x + 8, y, Feature.CHAIR);
    setFeature(world, rooms.square.x + rooms.square.w - 9, y, Feature.CHAIR);
  }

  markPosterWall(world, rooms.gate.x + 12, rooms.gate.y - 1, 7);
  markPosterWall(world, rooms.gate.x + 40, rooms.gate.y - 1, 13);
  markPosterWall(world, rooms.radioClub.x + 11, rooms.radioClub.y - 1, 19);
  markPosterWall(world, rooms.canteen.x + 10, rooms.canteen.y - 1, 27);

  setFeature(world, rooms.gate.x + 10, rooms.gate.y + 8, Feature.TABLE);
  setFeature(world, rooms.gate.x + 18, rooms.gate.y + 8, Feature.SCREEN);
  setFeature(world, rooms.gate.x + rooms.gate.w - 8, rooms.gate.y + 8, Feature.SHELF);

  for (let x = rooms.canteen.x + 4; x < rooms.canteen.x + rooms.canteen.w - 4; x += 8) setFeature(world, x, rooms.canteen.y + 4, Feature.STOVE);
  for (let x = rooms.canteen.x + 6; x < rooms.canteen.x + rooms.canteen.w - 6; x += 8) {
    setFeature(world, x, rooms.canteen.y + 13, Feature.TABLE);
    setFeature(world, x + 1, rooms.canteen.y + 16, Feature.CHAIR);
  }
  setFeature(world, rooms.canteen.x + rooms.canteen.w - 4, rooms.canteen.y + 5, Feature.SINK);

  setFeature(world, rooms.infirmary.x + 4, rooms.infirmary.y + 4, Feature.BED);
  setFeature(world, rooms.infirmary.x + 11, rooms.infirmary.y + 4, Feature.BED);
  setFeature(world, rooms.infirmary.x + rooms.infirmary.w - 5, rooms.infirmary.y + 4, Feature.SHELF);
  setFeature(world, rooms.infirmary.x + 4, rooms.infirmary.y + rooms.infirmary.h - 4, Feature.DESK);

  for (let x = rooms.library.x + 4; x < rooms.library.x + rooms.library.w - 4; x += 6) {
    setFeature(world, x, rooms.library.y + 3, Feature.SHELF);
    setFeature(world, x, rooms.library.y + rooms.library.h - 4, Feature.SHELF);
  }
  setFeature(world, rooms.library.x + 8, rooms.library.y + 11, Feature.TABLE);

  setFeature(world, rooms.radioClub.x + 5, rooms.radioClub.y + 5, Feature.SCREEN);
  setFeature(world, rooms.radioClub.x + 12, rooms.radioClub.y + 6, Feature.APPARATUS);
  setFeature(world, rooms.radioClub.x + 21, rooms.radioClub.y + 5, Feature.MACHINE);
  setFeature(world, rooms.radioClub.x + rooms.radioClub.w - 5, rooms.radioClub.y + rooms.radioClub.h - 4, Feature.SHELF);

  setFeature(world, rooms.musicClub.x + 4, rooms.musicClub.y + 5, Feature.TABLE);
  setFeature(world, rooms.musicClub.x + 10, rooms.musicClub.y + 5, Feature.CHAIR);
  setFeature(world, rooms.musicClub.x + 18, rooms.musicClub.y + 6, Feature.APPARATUS);

  for (let x = rooms.stage.x + 6; x < rooms.stage.x + rooms.stage.w - 5; x += 12) {
    setFeature(world, x, rooms.stage.y + 4, Feature.CANDLE);
    setFeature(world, x + 4, rooms.stage.y + 14, Feature.CHAIR);
  }

  for (let x = rooms.bathhouse.x + 4; x < rooms.bathhouse.x + rooms.bathhouse.w - 3; x += 5) {
    setFeature(world, x, rooms.bathhouse.y + 4, Feature.SINK);
  }
  setFeature(world, rooms.bathhouse.x + 6, rooms.bathhouse.y + rooms.bathhouse.h - 5, Feature.TOILET);
  setFeature(world, rooms.bathhouse.x + rooms.bathhouse.w - 7, rooms.bathhouse.y + rooms.bathhouse.h - 5, Feature.TOILET);

  setFeature(world, rooms.boat.x + 4, rooms.boat.y + 4, Feature.SHELF);
  setFeature(world, rooms.boat.x + 12, rooms.boat.y + 4, Feature.TABLE);
  setFeature(world, rooms.boat.x + 24, rooms.boat.y + 11, Feature.APPARATUS);

  for (let y = rooms.sport.y + 5; y < rooms.sport.y + rooms.sport.h - 4; y += 8) {
    setFeature(world, rooms.sport.x + 4, y, Feature.CHAIR);
    setFeature(world, rooms.sport.x + rooms.sport.w - 5, y, Feature.CHAIR);
  }
  carveLineWidth(world, rooms.sport.x + 12, rooms.sport.y + rooms.sport.h / 2 | 0, rooms.sport.x + rooms.sport.w - 12, rooms.sport.y + rooms.sport.h / 2 | 0, 1, Tex.F_CONCRETE);

  setFeature(world, rooms.oldCabin.x + 4, rooms.oldCabin.y + 4, Feature.BED);
  setFeature(world, rooms.oldCabin.x + 11, rooms.oldCabin.y + 8, Feature.SHELF);
  setFeature(world, rooms.oldCabin.x + rooms.oldCabin.w - 6, rooms.oldCabin.y + rooms.oldCabin.h - 5, Feature.CANDLE);
  world.stamp(rooms.oldCabin.x + 18, rooms.oldCabin.y + 11, 0.5, 0.5, 3.2, 0.42, 7001, 55, 34, 62);
}

function placeCampLifts(world: World, rooms: CampRooms): void {
  placeLift(world, rooms.gate.x + 8, rooms.gate.y + 9, rooms.gate.x + 11, rooms.gate.y + 9, LiftDirection.UP);
  placeLift(world, rooms.boat.x + rooms.boat.w - 5, rooms.boat.y + rooms.boat.h - 5, rooms.boat.x + rooms.boat.w - 8, rooms.boat.y + rooms.boat.h - 5, LiftDirection.DOWN);
}

function tuneCampZones(world: World): void {
  for (const zone of world.zones) {
    const d = world.dist(zone.cx, zone.cy, CX, CY);
    zone.faction = d > 250 ? ZoneFaction.WILD : ZoneFaction.CITIZEN;
    zone.level = d > 300 ? 4 : d > 180 ? 3 : 2;
    zone.fogged = false;
    zone.hasLift = false;
  }
  for (let i = 0; i < W * W; i++) {
    world.factionControl[i] = world.zones[world.zoneMap[i]]?.faction ?? ZoneFaction.CITIZEN;
  }
}

function spawnCampNpcs(
  entities: Entity[],
  nextId: { v: number },
  rooms: CampRooms,
): Record<CampNpcId, number> {
  return {
    camp_shift_tamara: spawnPlotNpc(entities, nextId, NPC_IDS.shift, NPC_DEFS.camp_shift_tamara, rooms.square.x + 46, rooms.square.y + 36, 0),
    camp_radio_egor: spawnPlotNpc(entities, nextId, NPC_IDS.radio, NPC_DEFS.camp_radio_egor, rooms.radioClub.x + 15, rooms.radioClub.y + 12, Math.PI),
    camp_medic_ira: spawnPlotNpc(entities, nextId, NPC_IDS.medic, NPC_DEFS.camp_medic_ira, rooms.infirmary.x + 8, rooms.infirmary.y + 12, 0),
    camp_canteen_zoya: spawnPlotNpc(entities, nextId, NPC_IDS.cook, NPC_DEFS.camp_canteen_zoya, rooms.canteen.x + 12, rooms.canteen.y + 18, Math.PI / 2, 'knife'),
  };
}

function spawnCampCrowd(entities: Entity[], nextId: { v: number }, rooms: CampRooms): void {
  spawnAmbientNpc(entities, nextId, 'Дежурный у флагштока', Faction.CITIZEN, Occupation.CHILD, rooms.square.x + 35, rooms.square.y + 30, [
    { defId: 'pressed_sugar', count: 1 },
  ]);
  spawnAmbientNpc(entities, nextId, 'Библиотекарь смены', Faction.CITIZEN, Occupation.SECRETARY, rooms.library.x + 10, rooms.library.y + 12, [
    { defId: 'book', count: 2 },
    { defId: 'note', count: 1 },
  ]);
  spawnAmbientNpc(entities, nextId, 'Лодочник без воды', Faction.LIQUIDATOR, Occupation.HUNTER, rooms.boat.x + 18, rooms.boat.y + 12, [
    { defId: 'harpoon_gun', count: 1 },
    { defId: 'metal_water', count: 1 },
  ], 'harpoon_gun');
  spawnAmbientNpc(entities, nextId, 'Тихий пионер у сцены', Faction.WILD, Occupation.TRAVELER, rooms.stage.x + 48, rooms.stage.y + 12, [
    { defId: 'child_map', count: 1 },
  ], 'knife');
  spawnAmbientNpc(entities, nextId, 'Сторож старого корпуса', Faction.LIQUIDATOR, Occupation.HUNTER, rooms.oldCabin.x + rooms.oldCabin.w + 4, rooms.oldCabin.y + 12, [
    { defId: 'ammo_9mm', count: 8 },
  ], 'makarov');
}

function placeCampContainers(world: World, rooms: CampRooms, owners: Record<CampNpcId, number>): void {
  addCampContainer(world, rooms.canteen, rooms.canteen.x + rooms.canteen.w - 5, rooms.canteen.y + 6, ContainerKind.FRIDGE, 'Холодильник столовой с подписанным компотом', 'owner', [
    { defId: 'kompot', count: 3 },
    { defId: 'kasha', count: 3 },
    { defId: 'pressed_sugar', count: 2 },
  ], owners.camp_canteen_zoya, NPC_DEFS.camp_canteen_zoya.name, ['pioneer_camp', 'canteen', 'food']);

  addCampContainer(world, rooms.infirmary, rooms.infirmary.x + rooms.infirmary.w - 4, rooms.infirmary.y + rooms.infirmary.h - 5, ContainerKind.MEDICAL_CABINET, 'Аптечный шкаф тихого часа', 'owner', [
    { defId: 'sanitary_kit', count: 1 },
    { defId: 'iodine', count: 2 },
    { defId: 'bandage', count: 2 },
  ], owners.camp_medic_ira, NPC_DEFS.camp_medic_ira.name, ['pioneer_camp', 'medical']);

  addCampContainer(world, rooms.radioClub, rooms.radioClub.x + rooms.radioClub.w - 4, rooms.radioClub.y + 6, ContainerKind.TOOL_LOCKER, 'Ящик радиокружка с мотками', 'owner', [
    { defId: 'wire_coil', count: 2 },
    { defId: 'circuit_board', count: 1 },
    { defId: 'radio', count: 1 },
  ], owners.camp_radio_egor, NPC_DEFS.camp_radio_egor.name, ['pioneer_camp', 'radio', 'repair']);

  addCampContainer(world, rooms.library, rooms.library.x + rooms.library.w - 5, rooms.library.y + 5, ContainerKind.FILING_CABINET, 'Картотека отрядных дел', 'room', [
    { defId: 'book', count: 4 },
    { defId: 'blank_form', count: 2 },
    { defId: 'child_map', count: 1 },
  ], undefined, undefined, ['pioneer_camp', 'library', 'documents']);

  addCampContainer(world, rooms.oldCabin, rooms.oldCabin.x + rooms.oldCabin.w - 5, rooms.oldCabin.y + rooms.oldCabin.h - 5, ContainerKind.SECRET_STASH, 'Ржавый сейф старого корпуса', 'locked', [
    { defId: 'emergency_roster', count: 1 },
    { defId: 'siren_instruction', count: 1 },
    { defId: 'meat_rune', count: 1 },
  ], undefined, undefined, ['pioneer_camp', 'old_camp', 'samosbor']);
}

function placeCampDrops(world: World, entities: Entity[], nextId: { v: number }, rooms: CampRooms): void {
  dropItem(world, entities, nextId, rooms.square.x + 18, rooms.square.y + 20, 'child_map', 1);
  dropItem(world, entities, nextId, rooms.stage.x + 20, rooms.stage.y + 10, 'note', 1);
  dropItem(world, entities, nextId, rooms.bathhouse.x + 8, rooms.bathhouse.y + 12, 'toiletpaper', 1);
  dropItem(world, entities, nextId, rooms.boat.x + 9, rooms.boat.y + 13, 'metal_water', 1);
  dropItem(world, entities, nextId, rooms.oldCabin.x + 6, rooms.oldCabin.y + 14, 'emergency_roster', 1);
}

function spawnCampThreats(world: World, entities: Entity[], nextId: { v: number }, rooms: CampRooms): void {
  spawnMonster(world, entities, nextId, MonsterKind.NELYUD, rooms.oldCabin.x + 18, rooms.oldCabin.y + 10, 3);
  spawnMonster(world, entities, nextId, MonsterKind.SHADOW, rooms.oldCabin.x + 7, rooms.oldCabin.y + 6, 3);
  spawnMonster(world, entities, nextId, MonsterKind.EYE, rooms.radioClub.x + rooms.radioClub.w + 8, rooms.radioClub.y + 6, 2);
  spawnMonster(world, entities, nextId, MonsterKind.TUBE_EEL, CX + 112, CY + 188, 3);
}

function addCampRoom(
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
  const room = stampRoom(world, world.rooms.length, type, Math.floor(x), Math.floor(y), w, h, -1);
  room.name = name;
  room.wallTex = wallTex;
  room.floorTex = floorTex;
  retuneRoom(world, room, wallTex, floorTex);
  return room;
}

function addOpenArea(
  world: World,
  type: RoomType,
  x: number,
  y: number,
  w: number,
  h: number,
  name: string,
  floorTex: Tex,
): Room {
  const room: Room = {
    id: world.rooms.length,
    type,
    x: world.wrap(x),
    y: world.wrap(y),
    w,
    h,
    doors: [],
    sealed: false,
    name,
    apartmentId: -1,
    wallTex: Tex.PANEL,
    floorTex,
  };
  world.rooms.push(room);
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) openTile(world, x + dx, y + dy, floorTex, room.id);
  }
  return room;
}

function retuneRoom(world: World, room: Room, wallTex: Tex, floorTex: Tex): void {
  for (let dy = -1; dy <= room.h; dy++) {
    for (let dx = -1; dx <= room.w; dx++) {
      const ci = world.idx(room.x + dx, room.y + dy);
      if (dx >= 0 && dx < room.w && dy >= 0 && dy < room.h) {
        world.floorTex[ci] = floorTex;
      } else if (world.cells[ci] === Cell.WALL) {
        world.wallTex[ci] = wallTex;
      }
    }
  }
}

function connectCampRoom(
  world: World,
  room: Room,
  doorX: number,
  doorY: number,
  pathX: number,
  pathY: number,
  state = DoorState.CLOSED,
  keyId = '',
): void {
  addCampDoor(world, room, doorX, doorY, state, keyId);
  carveLineWidth(world, pathX, pathY, pathX + world.delta(pathX, doorX), pathY + world.delta(pathY, doorY), 2, Tex.F_WOOD);
}

function addCampDoor(world: World, room: Room, x: number, y: number, state: DoorState, keyId = ''): number {
  const idx = world.idx(x, y);
  world.cells[idx] = Cell.DOOR;
  world.doors.set(idx, {
    idx,
    state,
    roomA: room.id,
    roomB: -1,
    keyId,
    timer: 0,
  });
  room.doors.push(idx);
  return idx;
}

function carveBeachAndWater(world: World, boat: Room): void {
  addOpenArea(world, RoomType.COMMON, CX + 48, CY + 152, 128, 18, 'Бетонный пляж у резервуара', Tex.F_CONCRETE);
  for (let y = CY + 173; y < CY + 210; y++) {
    for (let x = CX + 42; x < CX + 188; x++) {
      const ci = world.idx(x, y);
      world.cells[ci] = Cell.WATER;
      world.roomMap[ci] = -1;
      world.floorTex[ci] = Tex.F_WATER;
      if ((x + y) % 17 === 0) world.features[ci] = Feature.NONE;
    }
  }
  carveLineWidth(world, boat.x + boat.w - 2, boat.y + 13, CX + 78, CY + 160, 2, Tex.F_WOOD);
}

function carveLineWidth(world: World, ax: number, ay: number, bx: number, by: number, width: number, floorTex: Tex): void {
  if (ax !== bx && ay !== by) {
    carveLineWidth(world, ax, ay, bx, ay, width, floorTex);
    carveLineWidth(world, bx, ay, bx, by, width, floorTex);
    return;
  }
  const half = width >> 1;
  const from = ax === bx ? Math.min(ay, by) : Math.min(ax, bx);
  const to = ax === bx ? Math.max(ay, by) : Math.max(ax, bx);
  for (let p = from; p <= to; p++) {
    for (let n = 0; n < width; n++) {
      const o = n - half;
      openTile(world, ax === bx ? ax + o : p, ax === bx ? p : ay + o, floorTex, -1);
    }
  }
}

function openTile(world: World, x: number, y: number, floorTex: Tex, roomId: number): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] === Cell.LIFT || world.cells[ci] === Cell.DOOR) return;
  world.cells[ci] = Cell.FLOOR;
  world.roomMap[ci] = roomId;
  world.floorTex[ci] = floorTex;
  if (world.features[ci] !== Feature.NONE) world.features[ci] = Feature.NONE;
}

function setFeature(world: World, x: number, y: number, feature: Feature): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] === Cell.FLOOR || world.cells[ci] === Cell.WATER) world.features[ci] = feature;
}

function placeLift(world: World, x: number, y: number, buttonX: number, buttonY: number, direction: LiftDirection): void {
  const li = world.idx(x, y);
  world.cells[li] = Cell.LIFT;
  world.wallTex[li] = Tex.LIFT_DOOR;
  world.liftDir[li] = direction;
  const bi = world.idx(buttonX, buttonY);
  if (world.cells[bi] === Cell.FLOOR) world.features[bi] = Feature.LIFT_BUTTON;
  world.liftDir[bi] = direction;
}

function markPosterWall(world: World, x: number, y: number, n: number): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] === Cell.WALL) world.wallTex[ci] = (Tex.POSTER_BASE + (n % 64)) as Tex;
}

function spawnPlotNpc(
  entities: Entity[],
  nextId: { v: number },
  npcId: CampNpcId,
  def: PlotNpcDef,
  x: number,
  y: number,
  angle: number,
  weapon?: string,
): number {
  const id = nextId.v++;
  entities.push({
    id,
    type: EntityType.NPC,
    x: x + 0.5,
    y: y + 0.5,
    angle,
    pitch: 0,
    alive: true,
    speed: def.speed,
    sprite: def.sprite,
    name: def.name,
    isFemale: def.isFemale,
    needs: freshNeeds(),
    hp: def.hp,
    maxHp: def.maxHp,
    money: def.money,
    ai: { goal: AIGoal.IDLE, tx: x + 0.5, ty: y + 0.5, path: [], pi: 0, stuck: 0, timer: 0 },
    inventory: def.inventory.map(item => ({ ...item })),
    weapon,
    faction: def.faction,
    occupation: def.occupation,
    plotNpcId: npcId,
    canGiveQuest: true,
    questId: -1,
  });
  return id;
}

function spawnAmbientNpc(
  entities: Entity[],
  nextId: { v: number },
  name: string,
  faction: Faction,
  occupation: Occupation,
  x: number,
  y: number,
  inventory: Item[],
  weapon?: string,
): void {
  entities.push({
    id: nextId.v++,
    type: EntityType.NPC,
    x: x + 0.5,
    y: y + 0.5,
    angle: Math.random() * Math.PI * 2,
    pitch: 0,
    alive: true,
    speed: 0.82 + Math.random() * 0.25,
    sprite: occupation,
    name,
    needs: freshNeeds(),
    hp: faction === Faction.LIQUIDATOR ? 140 : 75,
    maxHp: faction === Faction.LIQUIDATOR ? 140 : 75,
    money: 4 + Math.floor(Math.random() * 28),
    ai: { goal: AIGoal.IDLE, tx: x + 0.5, ty: y + 0.5, path: [], pi: 0, stuck: 0, timer: 0 },
    inventory: inventory.map(item => ({ ...item })),
    weapon,
    faction,
    occupation,
    questId: -1,
  });
}

function addCampContainer(
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
    x: world.wrap(x),
    y: world.wrap(y),
    floor: PIONEER_CAMP_BASE_FLOOR,
    roomId: room.id,
    zoneId: world.zoneMap[world.idx(x, y)],
    kind,
    name,
    inventory: inventory.map(item => ({ ...item })),
    capacitySlots: Math.max(8, inventory.length + 4),
    ownerNpcId,
    ownerName,
    access,
    discovered: access !== 'secret',
    tags,
  };
  world.addContainer(container);
  setFeature(world, x, y, kind === ContainerKind.FRIDGE || kind === ContainerKind.MEDICAL_CABINET ? Feature.SHELF : Feature.SHELF);
  return container;
}

function nextContainerId(world: World): number {
  let id = 1;
  for (const container of world.containers) id = Math.max(id, container.id + 1);
  return id;
}

function dropItem(
  world: World,
  entities: Entity[],
  nextId: { v: number },
  x: number,
  y: number,
  defId: string,
  count: number,
): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] !== Cell.FLOOR && world.cells[ci] !== Cell.WATER) return;
  entities.push({
    id: nextId.v++,
    type: EntityType.ITEM_DROP,
    x: x + 0.5,
    y: y + 0.5,
    angle: 0,
    pitch: 0,
    alive: true,
    speed: 0,
    sprite: Spr.ITEM_DROP,
    inventory: [{ defId, count }],
  });
}

function spawnMonster(
  world: World,
  entities: Entity[],
  nextId: { v: number },
  kind: MonsterKind,
  x: number,
  y: number,
  level: number,
): void {
  const ci = world.idx(x, y);
  if (world.cells[ci] !== Cell.FLOOR && world.cells[ci] !== Cell.WATER) return;
  const def = MONSTERS[kind];
  if (!def) return;
  const hp = Math.round(def.hp * (1 + level * 0.18));
  const monster: Entity = {
    id: nextId.v++,
    type: EntityType.MONSTER,
    x: x + 0.5,
    y: y + 0.5,
    angle: Math.random() * Math.PI * 2,
    pitch: 0,
    alive: true,
    speed: def.speed * (1 + level * 0.04),
    sprite: monsterSpr(kind),
    hp,
    maxHp: hp,
    monsterKind: kind,
    attackCd: 0,
    ai: { goal: AIGoal.WANDER, tx: x, ty: y, path: [], pi: 0, stuck: 0, timer: 0 },
    phasing: kind === MonsterKind.SHADOW,
  };
  applyMonsterVariant(monster, PIONEER_CAMP_BASE_FLOOR, level >= 3);
  entities.push(monster);
}

function campProtectedMask(world: World): Uint8Array {
  const mask = new Uint8Array(W * W);
  for (const room of world.rooms) {
    for (let y = room.y - 1; y <= room.y + room.h; y++) {
      for (let x = room.x - 1; x <= room.x + room.w; x++) mask[world.idx(x, y)] = 1;
    }
  }
  for (const idx of world.doors.keys()) mask[idx] = 1;
  for (const container of world.containers) mask[world.idx(container.x, container.y)] = 1;
  for (let i = 0; i < W * W; i++) if (world.cells[i] === Cell.LIFT) mask[i] = 1;
  return mask;
}

function carveSafeTrailLoop(world: World, mask: Uint8Array, x: number, y: number, w: number, h: number, width: number, floorTex: Tex): void {
  carveSafeLine(world, mask, x, y, x + w, y, width, floorTex);
  carveSafeLine(world, mask, x + w, y, x + w, y + h, width, floorTex);
  carveSafeLine(world, mask, x + w, y + h, x, y + h, width, floorTex);
  carveSafeLine(world, mask, x, y + h, x, y, width, floorTex);
}

function carveSafeLine(world: World, mask: Uint8Array, ax: number, ay: number, bx: number, by: number, width: number, floorTex: Tex): void {
  if (ax !== bx && ay !== by) {
    carveSafeLine(world, mask, ax, ay, bx, ay, width, floorTex);
    carveSafeLine(world, mask, bx, ay, bx, by, width, floorTex);
    return;
  }
  const half = width >> 1;
  const from = ax === bx ? Math.min(ay, by) : Math.min(ax, bx);
  const to = ax === bx ? Math.max(ay, by) : Math.max(ax, bx);
  for (let p = from; p <= to; p++) {
    for (let n = 0; n < width; n++) {
      const o = n - half;
      const x = ax === bx ? ax + o : p;
      const y = ax === bx ? p : ay + o;
      const ci = world.idx(x, y);
      if (mask[ci] || world.cells[ci] === Cell.LIFT || world.cells[ci] === Cell.DOOR) continue;
      world.cells[ci] = Cell.FLOOR;
      world.roomMap[ci] = -1;
      world.floorTex[ci] = floorTex;
      world.factionControl[ci] = ZoneFaction.CITIZEN;
      if (world.features[ci] !== Feature.NONE) world.features[ci] = Feature.NONE;
    }
  }
}
