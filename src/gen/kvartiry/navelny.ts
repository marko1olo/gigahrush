/* ── Навэльный — side quest NPC for Квартиры floor ────────────── */

import {
  W, Cell,
  type Entity, EntityType, AIGoal, Faction, Occupation, QuestType,
} from '../../core/types';
import { World } from '../../core/world';
import { freshNeeds } from '../../data/catalog';
import { type PlotNpcDef, registerSideQuest } from '../../data/plot';

/* ── NPC definition ──────────────────────────────────────────── */
const NPC_DEF: PlotNpcDef = {
  name: 'Навэльный',
  isFemale: false,
  faction: Faction.CITIZEN,
  occupation: Occupation.DIRECTOR,
  sprite: Occupation.DIRECTOR,
  hp: 200, maxHp: 200, money: 0, speed: 1.0,
  inventory: [
    { defId: 'ballot', count: 5 },
  ],
  talkLines: [
    'Говорите тише: у кухни ликвидатор считает не слова, а тех, кто задержался у списка.',
    'Здесь всё держится на мокрой ведомости. Высохнет бумага - появится очередь, промокнет - появится приказ.',
    'Нужно сто бюллетеней. Не для праздника: без них соседей опять посчитают по ботинкам у двери.',
    'Каждый голос на счету, потому что счётчик у стояка давно пишет в пользу тех, кто с кобурой.',
    'Они держат ящик с патронами. Мы держим кухню, воду и фамилии тех, кто ещё отвечает.',
    'Бюллетень - это не спасение. Это бумажка, которую труднее выбить из руки, когда смотрят соседи.',
    'Ликвидаторская сводка назовёт это беспорядком. Мы назовём это очередью, где люди сами ставят подпись.',
    'Соберём голоса - узнаем, кого этаж ещё помнит живым, а кого уже списали в туман.',
  ],
  talkLinesPost: [
    'Спасибо. Бюллетени в папке, папка в сухом пакете, пакет не показывать у стояка.',
    'Подсчёт прошёл. Этаж на бумаге шумнее, чем в коридоре, и это уже заметили.',
    'Если вашу фамилию ещё можно прочитать, держите её крепче талона.',
    'Теперь надо донести папку до кухни и не дать ей утонуть в первом же ведре.',
  ],
};

/* ── Register NPC + quest ────────────────────────────────────── */
registerSideQuest('navelny', NPC_DEF, [
  {
    id: 'smart_voting',
    giverNpcId: 'navelny',
    type: QuestType.FETCH,
    desc: 'Навэльный: «Собери 100 бюллетеней. Пусть очередь у стояка сама посчитает живых, пока это не сделали ликвидаторы.»',
    targetItem: 'ballot', targetCount: 100,
    rewardItem: 'antidep', rewardCount: 5,
    relationDelta: 30, xpReward: 100, moneyReward: 500,
  },
]);

/* ── Spawn Navelny at random floor cell ──────────────────────── */
export function spawnNavelny(
  world: World, entities: Entity[], nextId: { v: number },
): void {
  for (let i = 0; i < 2000; i++) {
    const x = Math.floor(Math.random() * W);
    const y = Math.floor(Math.random() * W);
    if (world.cells[world.idx(x, y)] !== Cell.FLOOR) continue;
    entities.push({
      id: nextId.v++, type: EntityType.NPC,
      x: x + 0.5, y: y + 0.5,
      angle: Math.random() * Math.PI * 2, pitch: 0,
      alive: true, speed: NPC_DEF.speed, sprite: NPC_DEF.sprite,
      name: NPC_DEF.name, isFemale: NPC_DEF.isFemale,
      needs: freshNeeds(), hp: NPC_DEF.hp, maxHp: NPC_DEF.maxHp, money: NPC_DEF.money,
      ai: { goal: AIGoal.IDLE, tx: 0, ty: 0, path: [], pi: 0, stuck: 0, timer: 0 },
      inventory: NPC_DEF.inventory.map(i => ({ ...i })),
      faction: NPC_DEF.faction, occupation: NPC_DEF.occupation,
      plotNpcId: 'navelny', canGiveQuest: true, questId: -1,
      isTraveler: true,
    });
    return;
  }
}
