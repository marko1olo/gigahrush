/* ── Пахом Братишка — wandering NPC (kvartiry) ───────────────── */
/* Цитаты из «Зелёного слоника».                                   */

import {
  W, Cell,
  type Entity, EntityType, AIGoal, Faction, Occupation,
} from '../../core/types';
import { World } from '../../core/world';
import { freshNeeds } from '../../data/catalog';
import { type PlotNpcDef, registerSideQuest } from '../../data/plot';
import { Spr } from '../../render/sprite_index';

const NPC_DEF: PlotNpcDef = {
  name: 'Пахом Братишка',
  isFemale: false,
  faction: Faction.CITIZEN,
  occupation: Occupation.ALCOHOLIC,
  sprite: Spr.PAKHOM,
  hp: 250, maxHp: 250, money: 30, speed: 1.0,
  inventory: [
    { defId: 'kasha', count: 3 },
    { defId: 'bread', count: 2 },
    { defId: 'cigs', count: 4 },
    { defId: 'knife', count: 1 },
  ],
  talkLines: [
    'Я кашу держу в кармане, пока крысы не нашли. Тебе надо?',
    'Ты тут как, живой? Глаза нормальные, только усталые.',
    'Не обижайся, если я близко стою. В коридоре иначе тебя сразу отрежут.',
    'Каша тёплая была утром. Сейчас просто честная.',
    'Поешь. С пустым животом сирена звучит ближе.',
    'Я по-доброму. Нож у меня для двери, не для людей, если люди не первые.',
    'Свои тут те, кто делится до отбоя. После отбоя уже поздно знакомиться.',
    'Я принёс хлеб и сигареты. За них сосед иногда становится соседом.',
    'Не кричи. Стены тонкие, а некоторые стены отвечают.',
    'Покурим у шахты, только пепел в банку. Клава за грязь ругается страшнее обхода.',
  ],
  talkLinesPost: [
    'Заходи, если будет чем делиться. Я обычно здесь, пока коридор не передумал.',
    'Каша стынет, но ещё съедобная. Это редкость.',
    'Если у стояка начнётся давка, держись стены и не спорь с мокрыми руками.',
  ],
};

registerSideQuest('pahom_bratishka', NPC_DEF, []);

export function spawnPahomBratishka(
  world: World, entities: Entity[], nextId: { v: number },
): void {
  for (let i = 0; i < 3000; i++) {
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
      weapon: 'knife',
      faction: NPC_DEF.faction, occupation: NPC_DEF.occupation,
      plotNpcId: 'pahom_bratishka', canGiveQuest: false, questId: -1,
      isTraveler: true,
    });
    return;
  }
}
