/* ── Полковник Стрельцов — side quest (ministry floor) ────────── */
/* Заместитель министра по безопасности. Спецоперации по духам.    */

import {
  W, Cell,
  type Entity, EntityType, AIGoal, Faction, Occupation, QuestType, MonsterKind,
} from '../../core/types';
import { World } from '../../core/world';
import { freshNeeds } from '../../data/catalog';
import { type PlotNpcDef, registerSideQuest } from '../../data/plot';

const NPC_DEF: PlotNpcDef = {
  name: 'Полковник Стрельцов',
  isFemale: false,
  faction: Faction.LIQUIDATOR,
  occupation: Occupation.HUNTER,
  sprite: Occupation.HUNTER,
  hp: 800, maxHp: 800, money: 500, speed: 1.3,
  inventory: [
    { defId: 'ppsh', count: 1 },
    { defId: 'ammo_9mm', count: 50 },
    { defId: 'grenade', count: 2 },
    { defId: 'bandage', count: 3 },
  ],
  talkLines: [
    'Полковник Стрельцов. Заместитель министра по особым операциям. Слушаю.',
    'У нас проблема. Духи. Не привидения — настоящие, проходящие сквозь мрамор.',
    'Их записали за портретной галереей, но в зачёт идут любые четыре подтвержденных духа.',
    'Уничтожь четырёх. Это спецзадание. Я лично прослежу за наградой.',
  ],
  talkLinesPost: [
    'Спецоперация выполнена на «отлично». Министр доволен.',
    'Если снова увидите духов, держите дистанцию и докладывайте живым.',
    'Ты теперь в личном резерве. Это привилегия.',
  ],
};

registerSideQuest('polkovnik_streltsov', NPC_DEF, [
  {
    id: 'streltsov_spirits',
    giverNpcId: 'polkovnik_streltsov',
    type: QuestType.KILL,
    desc: 'Стрельцов: «Четыре духа. Где встретите - там и уничтожить.»',
    targetMonsterKind: MonsterKind.SPIRIT,
    killNeeded: 4,
    rewardItem: 'gauss', rewardCount: 1,
    extraRewards: [
      { defId: 'ammo_energy', count: 4 },
      { defId: 'grenade', count: 3 },
      { defId: 'bandage', count: 4 },
    ],
    relationDelta: 25, xpReward: 150, moneyReward: 800,
  },
]);

export function spawnPolkovnikStreltsov(
  world: World, entities: Entity[], nextId: { v: number },
): void {
  for (let i = 0; i < 3000; i++) {
    const x = Math.floor(Math.random() * W);
    const y = Math.floor(Math.random() * W);
    if (world.cells[world.idx(x, y)] !== Cell.FLOOR) continue;
    if (world.roomMap[world.idx(x, y)] < 0 && i < 2000) continue;
    entities.push({
      id: nextId.v++, type: EntityType.NPC,
      x: x + 0.5, y: y + 0.5,
      angle: Math.random() * Math.PI * 2, pitch: 0,
      alive: true, speed: NPC_DEF.speed, sprite: NPC_DEF.sprite,
      name: NPC_DEF.name, isFemale: NPC_DEF.isFemale,
      needs: freshNeeds(), hp: NPC_DEF.hp, maxHp: NPC_DEF.maxHp, money: NPC_DEF.money,
      ai: { goal: AIGoal.IDLE, tx: 0, ty: 0, path: [], pi: 0, stuck: 0, timer: 0 },
      inventory: NPC_DEF.inventory.map(i => ({ ...i })),
      weapon: 'ppsh',
      faction: NPC_DEF.faction, occupation: NPC_DEF.occupation,
      plotNpcId: 'polkovnik_streltsov', canGiveQuest: true, questId: -1,
    });
    return;
  }
}
