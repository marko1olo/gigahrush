/* ── Сталкер Меченый — side quest content module ──────────────── */
/* Артефактоискатель скупает идолов Чернобога за пси-сгустки.      */

import {
  W, Cell,
  type Entity, EntityType, AIGoal, Faction, Occupation, QuestType,
} from '../../core/types';
import { World } from '../../core/world';
import { freshNeeds } from '../../data/catalog';
import { type PlotNpcDef, registerSideQuest } from '../../data/plot';

const NPC_DEF: PlotNpcDef = {
  name: 'Сталкер Меченый',
  isFemale: false,
  faction: Faction.CITIZEN,
  occupation: Occupation.TRAVELER,
  sprite: Occupation.TRAVELER,
  hp: 180, maxHp: 180, money: 200, speed: 1.3,
  inventory: [
    { defId: 'makarov', count: 1 },
    { defId: 'ammo_9mm', count: 12 },
    { defId: 'psi_strike', count: 1 },
    { defId: 'antidep', count: 1 },
  ],
  talkLines: [
    'Тише. Не ори. Меня тут не было.',
    'Зовут Меченым. Хожу глубоко: лифт, коллектор, два мокрых коридора и лестница без таблички.',
    'Идолы Чернобога — настоящая валюта. Не эти бумажки.',
    'Принесёшь три штуки — отдам пси-сгусток. Хороший. Из лаборатории.',
    'Только не из храма таскай. Батюшка проклянёт. Я знаю — у меня шрам на спине.',
  ],
  talkLinesPost: [
    'Хорошая сделка. Идолы я в схрон сложу.',
    'Если опять найдёшь — приходи. Цену не сбавлю.',
    'Меня тут не было. Запомни.',
  ],
};

registerSideQuest('stalker_mecheny', NPC_DEF, [
  {
    id: 'mecheny_idols',
    giverNpcId: 'stalker_mecheny',
    type: QuestType.FETCH,
    desc: 'Меченый: «Три идола Чернобога. Цена — пси-сгусток и патроны. Без вопросов.»',
    targetItem: 'idol_chernobog', targetCount: 3,
    rewardItem: 'psi_madness', rewardCount: 1,
    extraRewards: [{ defId: 'ammo_9mm', count: 16 }, { defId: 'antidep', count: 1 }],
    relationDelta: 10, xpReward: 80, moneyReward: 150,
  },
]);

export function spawnStalkerMecheny(
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
      weapon: 'makarov',
      faction: NPC_DEF.faction, occupation: NPC_DEF.occupation,
      plotNpcId: 'stalker_mecheny', canGiveQuest: true, questId: -1,
      isTraveler: true,
    });
    return;
  }
}
