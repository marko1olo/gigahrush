/* ── Виктор Аргонов — side quest content module ──────────────── */
/* Self-contained: NPC definition + quest + spawn.                 */
/* Registered automatically via registerSideQuest() at import.     */

import {
  W, Cell,
  type Entity, EntityType, AIGoal, Faction, Occupation, QuestType,
} from '../../core/types';
import { World } from '../../core/world';
import { freshNeeds } from '../../data/catalog';
import { type PlotNpcDef, registerSideQuest } from '../../data/plot';

/* ── NPC definition ──────────────────────────────────────────── */
const NPC_DEF: PlotNpcDef = {
  name: 'Виктор Аргонов',
  isFemale: false,
  faction: Faction.CITIZEN,
  occupation: Occupation.ALCOHOLIC,
  sprite: Occupation.ALCOHOLIC,
  hp: 40, maxHp: 40, money: 0, speed: 0.7,
  inventory: [
    { defId: 'cigs', count: 3 },
  ],
  talkLines: [
    'Баклы, лира, меф... тише, у батареи милиция слушает.',
    'Принеси мне таблетки. Не для бессмертия, для ночи без стука в висках.',
    'Десять таблеток - и я допишу трек про лифт, который не вернулся.',
    'В висках горит, руки трясутся. Или баклы, или опять вентиляция травит.',
  ],
  talkLinesPost: [
    'Это новая запись. Лифт скрипит в такт, значит почти музыка.',
    'Таблетки сработали. Я хотя бы слышу дверь, а не весь подъезд сразу.',
    'Спасибо. Теперь если батарея начнет петь, я успею закрыть форточку.',
  ],
};

/* ── Register NPC + quest into global data ───────────────────── */
registerSideQuest('viktor_argonov', NPC_DEF, [
  {
    id: 'viktor_pills',
    giverNpcId: 'viktor_argonov',
    type: QuestType.FETCH,
    desc: 'Виктор Аргонов: «Принеси десять таблеток. Я переживу ночь, а ты получишь запись с маршрутом у лифта.»',
    targetItem: 'pills', targetCount: 10,
    rewardItem: 'note', rewardCount: 1,
    relationDelta: 15, xpReward: 30, moneyReward: 1,
  },
]);

/* ── Spawn at random FLOOR cell ──────────────────────────────── */
export function spawnViktor(
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
      plotNpcId: 'viktor_argonov', canGiveQuest: true, questId: -1,
      isTraveler: true,
    });
    return;
  }
}
