import { W, Faction, Occupation, QuestType, MonsterKind, type Entity, type Room } from '../../core/types';
import { type PlotNpcDef, registerSideQuest } from '../../data/plot';
import { requireSpawnedPlotNpcFromPackage } from '../plot_npc_spawn';
import { World } from '../../core/world';

export const BRIGADIR_ID = 'outskirts_wild_leader';
export const KAPITAN_ID = 'outskirts_liquidator_leader';

export const OUTSKIRTS_CONFLICT_NPCS: Record<string, PlotNpcDef> = {
  [BRIGADIR_ID]: {
    name: 'Бригадир',
    isFemale: false,
    faction: Faction.WILD,
    occupation: Occupation.MECHANIC, // RAIDER doesn't exist, using MECHANIC for Wild leader
    sprite: Occupation.MECHANIC,
    hp: 200,
    maxHp: 200,
    money: 100,
    speed: 1.0,
    talkLines: ['Чего надо?', 'Проваливай.'],
    talkLinesPost: ['Отличная работа.', 'Теперь пройдешь.'],
    inventory: [
      { defId: 'shotgun', count: 1 },
      { defId: 'ammo_shells', count: 12 },
      { defId: 'outskirts_pass', count: 1 },
    ],
  },
  [KAPITAN_ID]: {
    name: 'Капитан',
    isFemale: false,
    faction: Faction.LIQUIDATOR,
    occupation: Occupation.HUNTER, // GUARD doesn't exist, using HUNTER for Liquidator
    sprite: Occupation.HUNTER,
    hp: 250,
    maxHp: 250,
    money: 200,
    speed: 1.0,
    talkLines: ['Стой! Кто такой?', 'Предъяви документы.'],
    talkLinesPost: ['Молодец, боец.', 'Проходи.'],
    inventory: [
      { defId: 'ak47', count: 1 },
      { defId: 'ammo_762', count: 30 },
      { defId: 'outskirts_pass', count: 1 },
    ],
  },
};

registerSideQuest(BRIGADIR_ID, OUTSKIRTS_CONFLICT_NPCS[BRIGADIR_ID], [
  {
    id: 'outskirts_wild_kill_patrol',
    giverNpcId: BRIGADIR_ID,
    type: QuestType.KILL,
    desc: 'Убей патруль Ликвидаторов и помоги нам — получишь пропуск.',
    targetMonsterKind: MonsterKind.ZOMBIE, // Mocked, ideally specific to liquidators
    killNeeded: 3,
    rewardItem: 'outskirts_pass',
    rewardCount: 1,
    relationDelta: 10,
    xpReward: 100,
    moneyReward: 50,
  }
]);

registerSideQuest(KAPITAN_ID, OUTSKIRTS_CONFLICT_NPCS[KAPITAN_ID], [
  {
    id: 'outskirts_liquidator_clear_mutants',
    giverNpcId: KAPITAN_ID,
    type: QuestType.KILL,
    desc: 'Зачисти гнездо мутантов у западного КПП, помоги нам — получишь пропуск.',
    targetMonsterKind: MonsterKind.TVAR,
    killNeeded: 5,
    rewardItem: 'outskirts_pass',
    rewardCount: 1,
    relationDelta: 10,
    xpReward: 100,
    moneyReward: 50,
  }
]);

export function spawnOutskirtsConflict(world: World, entities: Entity[], nextId: { v: number }): void {
  // Find HQ rooms based on faction territory
  let wildHq: Room | undefined;
  let liqHq: Room | undefined;

  for (const room of world.rooms) {
    if (room.type === 4 || room.id % 5 === 0) { // Just using some logic if no tags exist
      if (room.x < W / 2 && !wildHq) wildHq = room;
      if (room.x > W / 2 && !liqHq) liqHq = room;
    }
  }

  // Fallback to general area if specific rooms aren't present
  if (!wildHq || !liqHq) {
     for (const room of world.rooms) {
       if (room.x < W / 4 && !wildHq) wildHq = room;
       if (room.x > (W * 3) / 4 && !liqHq) liqHq = room;
     }
  }

  if (wildHq) {
    requireSpawnedPlotNpcFromPackage(
      entities, nextId, BRIGADIR_ID, wildHq.x + wildHq.w / 2, wildHq.y + wildHq.h / 2,
      { weapon: 'shotgun', canGiveQuest: true }
    );
  }

  if (liqHq) {
    requireSpawnedPlotNpcFromPackage(
      entities, nextId, KAPITAN_ID, liqHq.x + liqHq.w / 2, liqHq.y + liqHq.h / 2,
      { weapon: 'ak47', canGiveQuest: true }
    );
  }
}
