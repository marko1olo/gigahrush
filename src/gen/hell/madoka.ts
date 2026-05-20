/* ── Мегука — stranded PSI orderly in Hell ────────────────────── */
/* High PSI, practical triage and corridor control.                */

import {
  W, Cell,
  type Entity, EntityType, AIGoal, Faction, Occupation,
} from '../../core/types';
import { World } from '../../core/world';
import { freshNeeds } from '../../data/catalog';
import { type PlotNpcDef, registerSideQuest } from '../../data/plot';
import { Spr } from '../../render/sprite_index';

const NPC_DEF: PlotNpcDef = {
  name: 'Мегука ПСИ-дежурная',
  isFemale: true,
  faction: Faction.SCIENTIST,
  occupation: Occupation.HUNTER,
  sprite: Spr.MADOKA,
  hp: 3333, maxHp: 3333, money: 0, speed: 1.5,
  inventory: [
    { defId: 'psi_beam', count: 1 },
    { defId: 'psi_strike', count: 5 },
    { defId: 'psi_storm', count: 2 },
    { defId: 'antidep', count: 5 },
    { defId: 'holy_water', count: 2 },
  ],
  talkLines: [
    'В журнале написано: нижний пост ПСИ, мокрый фильтр, не лезть первым. Журнал промок, но пункт верный.',
    'Посох светит, пока есть ПСИ. Дальше он просто палка с плохой репутацией.',
    'Внизу за обещания спрашивают водой, бинтами и патронами.',
    'Дежурная по ПСИ отступает первой, если герма ещё держит.',
    'Импульс сорвался. Извините: приборы здесь пищат раньше рук.',
    'Сначала укрытие, потом слова. Яков бы подписал, если бы бумага не потела.',
    'Пока хватило бы сухого фильтра, целой двери и выхода без чужой таблички.',
    'Вы тоже видите этих монстров? Значит, запись в моей голове не совсем врёт.',
    'Мой посох пищит вашим голосом? Тогда бейте по моей руке: импульс перехватило.',
    'Свет в каждый угол не выйдет. Тогда хотя бы в тот, где мы сейчас стоим.',
  ],
  talkLinesPost: [
    'Спасибо, что выслушал. Теперь хотя бы понятно, куда не идти.',
    'Буду держать посох заряженным. Слова потом.',
  ],
};

registerSideQuest('meduka_meguku', NPC_DEF, []);

export function spawnMedukaMeguku(
  world: World, entities: Entity[], nextId: { v: number },
): void {
  for (let i = 0; i < 4000; i++) {
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
      weapon: 'psi_beam',
      faction: NPC_DEF.faction, occupation: NPC_DEF.occupation,
      plotNpcId: 'meduka_meguku', canGiveQuest: false, questId: -1,
      isTraveler: true,
      rpg: {
        level: 12, xp: 0, attrPoints: 0,
        str: 5, agi: 8, int: 20,
        psi: 9999, maxPsi: 9999,
      },
    });
    return;
  }
}
