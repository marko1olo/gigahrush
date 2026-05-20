/* ── Ministry NPC spawning ─────────────────────────────────────── */
/*   Directors, officials in suits, scientists, liquidators.        */
/*   Special NPCs: GenSec Khrushchev, Minister Rotenbergov.        */

import {
  W, Cell,
  type Entity, EntityType, AIGoal, Faction, Occupation, QuestType, RoomType,
} from '../../core/types';
import { World } from '../../core/world';
import { freshNeeds, randomName } from '../../data/catalog';
import { rng } from '../shared';
import { gaussianLevel, randomRPG, getMaxHp } from '../../systems/rpg';
import { type PlotNpcDef, registerSideQuest } from '../../data/plot';
import { spawnArkhivariusKafkin } from './arkhivarius';
import { spawnPolkovnikStreltsov } from './streltsov';
import { spawnBufetchitsaGlafira } from './glafira';

/* ── Weapon loadout for ministry NPCs ─────────────────────────── */
function ministryWeaponLoadout(faction: Faction, occupation: Occupation): { weapon: string; inv: { defId: string; count: number }[] } {
  if (faction === Faction.LIQUIDATOR) {
    const roll = Math.random();
    if (roll < 0.30) return { weapon: 'makarov', inv: [{ defId: 'makarov', count: 1 }, { defId: 'ammo_9mm', count: rng(6, 16) }] };
    if (roll < 0.45) return { weapon: 'ppsh', inv: [{ defId: 'ppsh', count: 1 }, { defId: 'ammo_9mm', count: rng(20, 40) }] };
    if (roll < 0.65) return { weapon: 'axe', inv: [{ defId: 'axe', count: 1 }] };
    return { weapon: 'pipe', inv: [{ defId: 'pipe', count: 1 }] };
  }
  if (occupation === Occupation.DIRECTOR) {
    return Math.random() < 0.3 ? { weapon: 'makarov', inv: [{ defId: 'makarov', count: 1 }, { defId: 'ammo_9mm', count: rng(4, 8) }] } : { weapon: '', inv: [] };
  }
  return { weapon: '', inv: [] };
}

/* ── Special NPCs definitions ─────────────────────────────────── */
const KHRUSHCHEV_DEF: PlotNpcDef = {
  name: 'Генсек Хрущёв',
  isFemale: false,
  faction: Faction.CITIZEN,
  occupation: Occupation.DIRECTOR,
  sprite: Occupation.DIRECTOR,
  hp: 5000, maxHp: 5000, money: 500, speed: 0.8,
  inventory: [
    { defId: 'bread', count: 5 },
    { defId: 'cigs', count: 3 },
  ],
  talkLines: [
    'Генеральный секретарь Хрущёв. Докладывайте коротко: у меня лифт за дверью и три окна без печати.',
    'Дом стоит не потому, что красивый. Его каждый день подпирают стояки, наряды и люди, которым некогда спорить.',
    'Каждый стояк, актовый зал и коллектор внесён в план. Даже те, что ночью уходят в другой шкаф.',
    'В коллекторах Махно режет кабель, берет пайки и срывает пломбы. Потом называет это волей.',
    'Убери Махно. Без атамана у них останется склад, очередь и страх перед ликвидаторами.',
  ],
  talkLinesPost: [
    'Махно списан. Кабельщики уже просят охрану, а не лозунги.',
    'Порядок - это когда наряд закрыт до сирены и никто не несет пломбу в кармане.',
    'Премия в шкафу. Не задерживайся у окна: очередь умеет слушать.',
  ],
};

const ROTENBERGOV_DEF: PlotNpcDef = {
  name: 'Министр Ротенбергов',
  isFemale: false,
  faction: Faction.CITIZEN,
  occupation: Occupation.DIRECTOR,
  sprite: Occupation.DIRECTOR,
  hp: 3000, maxHp: 3000, money: 10000, speed: 0.6,
  inventory: [
    { defId: 'tea', count: 3 },
    { defId: 'book', count: 1 },
  ],
  talkLines: [
    'Министр финансов Ротенбергов. Говорите кратко: у бюджета сквозняк.',
    'В Гигахруще всё облагается: вода, тишина, место в очереди, даже кнопка лифта.',
    'Когда баланс не сходится, первым мокнет архив. Потом уже бегают с герметиком.',
    'Нужен миллион рублей. Официально - чрезвычайный сбор, фактически - закупка пломб, воды и молчания.',
    'Не путайте пустой карман с чистой квитанцией. Окно всё равно спросит фамилию.',
  ],
  talkLinesPost: [
    'Сумма поступила. Бухгалтерия перестала держать дверь шкафом.',
    'Финансовая дисциплина - это когда коммуналку платят до того, как вода пришла за подписью.',
    'Будут новые сборы. Дом большой, а печатей всегда не хватает.',
  ],
};

/* ── Register side quests ─────────────────────────────────────── */
registerSideQuest('khrushchev', KHRUSHCHEV_DEF, [
  {
    id: 'khrushchev_kill_makhno',
    giverNpcId: 'khrushchev',
    type: QuestType.KILL,
    desc: 'Генсек Хрущёв: «Махно режет кабель и срывает пломбы в коллекторах. Убери атамана, пока ремонтники не ходят туда только с охраной.»',
    targetPlotNpcId: 'makhno',
    killNeeded: 1,
    rewardItem: 'psi_brainburn', rewardCount: 1,
    extraRewards: [{ defId: 'bandage', count: 5 }, { defId: 'ammo_9mm', count: 20 }],
    relationDelta: 30, xpReward: 200, moneyReward: 5000,
  },
]);

registerSideQuest('rotenbergov', ROTENBERGOV_DEF, [
  {
    id: 'rotenbergov_taxes',
    giverNpcId: 'rotenbergov',
    type: QuestType.FETCH,
    desc: 'Министр Ротенбергов: «Налог чрезвычайный. Принеси 1 000 000 рублей: нужны пломбы, вода и тишина в архиве.»',
    targetItem: 'money', targetCount: 1000000,
    rewardItem: 'psi_control', rewardCount: 1,
    extraRewards: [{ defId: 'antidep', count: 3 }],
    relationDelta: 50, xpReward: 500, moneyReward: 0,
  },
]);

/* ── Spawn all ministry NPCs ─────────────────────────────────── */
export function spawnMinistryNpcs(
  world: World, entities: Entity[], nextId: { v: number },
): void {
  const NPC_CAP = 1000;
  let npcCount = 0;

  /* ── Regular NPCs: directors, secretaries, scientists, liquidators ── */
  const npcTypes: { faction: Faction; occupation: Occupation; weight: number }[] = [
    { faction: Faction.CITIZEN,    occupation: Occupation.DIRECTOR,    weight: 25 },
    { faction: Faction.CITIZEN,    occupation: Occupation.SECRETARY,   weight: 20 },
    { faction: Faction.SCIENTIST,  occupation: Occupation.SCIENTIST,   weight: 15 },
    { faction: Faction.LIQUIDATOR, occupation: Occupation.HUNTER,      weight: 15 },
    { faction: Faction.CITIZEN,    occupation: Occupation.STOREKEEPER, weight: 10 },
    { faction: Faction.CITIZEN,    occupation: Occupation.COOK,        weight: 8 },
    { faction: Faction.CITIZEN,    occupation: Occupation.DOCTOR,      weight: 7 },
  ];

  function pickNpcType(): { faction: Faction; occupation: Occupation } {
    let total = 0;
    for (const t of npcTypes) total += t.weight;
    let roll = Math.random() * total;
    for (const t of npcTypes) {
      roll -= t.weight;
      if (roll <= 0) return t;
    }
    return npcTypes[0];
  }

  while (npcCount < NPC_CAP) {
    const prevCount = npcCount;
    for (const zone of world.zones) {
      if (npcCount >= NPC_CAP) break;
      const squadSize = rng(1, 3);
      const fDef = pickNpcType();
      for (let s = 0; s < squadSize && npcCount < NPC_CAP; s++) {
        let sx = -1, sy = -1;
        for (let r = 0; r < 30; r++) {
          const tx = world.wrap(zone.cx + rng(-r * 3, r * 3));
          const ty = world.wrap(zone.cy + rng(-r * 3, r * 3));
          const tci = world.idx(tx, ty);
          if (world.cells[tci] === Cell.FLOOR) {
            sx = tx; sy = ty;
            break;
          }
        }
        if (sx < 0) continue;
        const zoneLevel = zone.level ?? 1;
        const npcLevel = gaussianLevel(zoneLevel + 2, 2);
        const rpg = randomRPG(npcLevel);
        const maxHp = Math.round(getMaxHp(rpg) * 1.5);
        const nm = randomName(fDef.faction);
        const loadout = ministryWeaponLoadout(fDef.faction, fDef.occupation);
        entities.push({
          id: nextId.v++, type: EntityType.NPC,
          x: sx + 0.5, y: sy + 0.5,
          angle: Math.random() * Math.PI * 2, pitch: 0,
          alive: true,
          speed: 1.2 + Math.random() * 0.3,
          sprite: fDef.occupation,
          name: nm.name,
          isFemale: nm.female,
          needs: freshNeeds(),
          hp: maxHp, maxHp,
          money: rng(50, 500),
          ai: { goal: AIGoal.IDLE, tx: 0, ty: 0, path: [], pi: 0, stuck: 0, timer: 0 },
          inventory: loadout.inv.map(i => ({ ...i })),
          weapon: loadout.weapon || undefined,
          faction: fDef.faction,
          occupation: fDef.occupation,
          isTraveler: false,
          questId: -1,
          rpg,
        });
        npcCount++;
      }
    }
    // Safety: if no NPCs were placed this pass, stop to avoid infinite loop
    if (npcCount === prevCount) break;
  }

  /* ── Spawn Генсек Хрущёв ────────────────────────────────────── */
  spawnPlotNpc(world, entities, nextId, 'khrushchev', KHRUSHCHEV_DEF);

  /* ── Spawn Министр Ротенбергов ──────────────────────────────── */
  spawnPlotNpc(world, entities, nextId, 'rotenbergov', ROTENBERGOV_DEF);

  /* ── Side-quest wandering NPCs ─────────────────────────────── */
  spawnArkhivariusKafkin(world, entities, nextId);
  spawnPolkovnikStreltsov(world, entities, nextId);
  spawnBufetchitsaGlafira(world, entities, nextId);

  /* ── Assign offices/rooms to NPCs ──────────────────────────── */
  assignMinistryRooms(world, entities);
}

/* ── Spawn a plot NPC at a random floor cell ──────────────────── */
function spawnPlotNpc(
  world: World, entities: Entity[], nextId: { v: number },
  plotNpcId: string, def: PlotNpcDef,
): void {
  for (let i = 0; i < 2000; i++) {
    const x = Math.floor(Math.random() * W);
    const y = Math.floor(Math.random() * W);
    if (world.cells[world.idx(x, y)] !== Cell.FLOOR) continue;
    // Prefer rooms for important NPCs
    if (world.roomMap[world.idx(x, y)] < 0 && i < 1500) continue;
    entities.push({
      id: nextId.v++, type: EntityType.NPC,
      x: x + 0.5, y: y + 0.5,
      angle: Math.random() * Math.PI * 2, pitch: 0,
      alive: true, speed: def.speed, sprite: def.sprite,
      name: def.name, isFemale: def.isFemale,
      needs: freshNeeds(), hp: def.hp, maxHp: def.maxHp, money: def.money,
      ai: { goal: AIGoal.IDLE, tx: 0, ty: 0, path: [], pi: 0, stuck: 0, timer: 0 },
      inventory: def.inventory.map(i => ({ ...i })),
      faction: def.faction, occupation: def.occupation,
      plotNpcId, canGiveQuest: true, questId: -1,
      isTraveler: false,
    });
    return;
  }
}

/* ── Assign rooms to ministry NPCs by occupation ─────────────── */
function assignMinistryRooms(world: World, entities: Entity[]): void {
  // Collect rooms by type
  const offices: number[] = [];
  const kitchens: number[] = [];
  const medicals: number[] = [];
  const storages: number[] = [];
  const commons: number[] = [];
  for (const room of world.rooms) {
    if (!room) continue;
    switch (room.type) {
      case RoomType.OFFICE:  offices.push(room.id); break;
      case RoomType.KITCHEN: kitchens.push(room.id); break;
      case RoomType.MEDICAL: medicals.push(room.id); break;
      case RoomType.STORAGE: storages.push(room.id); break;
      case RoomType.COMMON:  commons.push(room.id); break;
    }
  }

  // Round-robin assign rooms to NPCs by occupation
  let oi = 0, ki = 0, mi = 0, si = 0, ci = 0;
  for (const e of entities) {
    if (e.type !== EntityType.NPC || !e.alive) continue;
    switch (e.occupation) {
      case Occupation.DIRECTOR:
      case Occupation.SECRETARY:
      case Occupation.SCIENTIST:
        if (offices.length > 0) { e.assignedRoomId = offices[oi % offices.length]; oi++; }
        break;
      case Occupation.COOK:
        if (kitchens.length > 0) { e.assignedRoomId = kitchens[ki % kitchens.length]; ki++; }
        break;
      case Occupation.DOCTOR:
        if (medicals.length > 0) { e.assignedRoomId = medicals[mi % medicals.length]; mi++; }
        break;
      case Occupation.STOREKEEPER:
        if (storages.length > 0) { e.assignedRoomId = storages[si % storages.length]; si++; }
        break;
      case Occupation.HUNTER:
        // Liquidators patrol corridors — no assigned room; but give them a common hall as fallback
        if (commons.length > 0) { e.assignedRoomId = commons[ci % commons.length]; ci++; }
        break;
    }
  }
}
