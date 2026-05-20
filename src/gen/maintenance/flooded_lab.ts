/* ── Затопленная лаборатория — permanent room (maintenance) ───── */
/* Hand-crafted scientific lab built into the maintenance maze.    */
/* NPC: Профессор Тесла — gives FETCH quest for energy cells.      */

import {
  Cell, Tex, Feature, RoomType,
  type Room, type Entity,
  EntityType, AIGoal, Faction, Occupation, QuestType,
} from '../../core/types';
import { World } from '../../core/world';
import { freshNeeds } from '../../data/catalog';
import { type PlotNpcDef, registerSideQuest } from '../../data/plot';
import { stampRoom, protectRoom, connectProtectedRoom, findClearArea } from '../shared';
import { Spr } from '../../render/sprite_index';
import { genLog } from '../log';

/* ── NPC definition ──────────────────────────────────────────── */
const NPC_DEF: PlotNpcDef = {
  name: 'Профессор Тесла',
  isFemale: false,
  faction: Faction.SCIENTIST,
  occupation: Occupation.SCIENTIST,
  sprite: Occupation.SCIENTIST,
  hp: 160, maxHp: 160, money: 150, speed: 0.7,
  inventory: [
    { defId: 'psi_strike', count: 1 },
    { defId: 'antidep', count: 2 },
    { defId: 'pills', count: 3 },
    { defId: 'note', count: 3 },
  ],
  talkLines: [
    'А-а, гость. Заходите, только не в лужу: генератор опять пробивает на пол.',
    'Я профессор Тесла. Не тот, разумеется. Но фамилия обязывает.',
    'Я собираю ПСИ-излучатель из шкафов, катушек и чужих актов списания. Пока он только гудит и сушит плесень.',
    'Нужны энергоячейки. Пять штук. Принесите - отдам прототип ПСИ-луча. Держать как резак, не как сувенир.',
  ],
  talkLinesPost: [
    'Излучатель работает. Тише. Слышите гул? Это не победа, это катушка наконец попала в частоту.',
    'Возьмите ещё ячейку. В журнале она всё равно числится утонувшей.',
    'Если найдёте странные сгустки - несите в банке. Без банки это уже не наука, а уборка.',
  ],
};

registerSideQuest('prof_tesla', NPC_DEF, [
  {
    id: 'tesla_energy',
    giverNpcId: 'prof_tesla',
    type: QuestType.FETCH,
    desc: 'Тесла: «Пять энергоячеек. Без них ПСИ-излучатель останется мокрой кучей проводов.»',
    targetItem: 'ammo_energy', targetCount: 5,
    rewardItem: 'psi_beam', rewardCount: 1,
    extraRewards: [
      { defId: 'antidep', count: 3 },
      { defId: 'pills', count: 4 },
      { defId: 'bandage', count: 4 },
    ],
    relationDelta: 25, xpReward: 120, moneyReward: 200,
  },
]);

/* ── Generate Затопленная лаборатория ─────────────────────────── */
const LAB_W = 11;
const LAB_H = 9;

export function generateFloodedLab(
  world: World, nextRoomId: number, entities: Entity[], nextId: { v: number },
  spawnX: number, spawnY: number,
): { nextRoomId: number } {
  const cx = Math.floor(spawnX);
  const cy = Math.floor(spawnY);

  const pos = findClearArea(world, cx, cy, LAB_W, LAB_H, 30, 80);
  const labX = pos ? pos.x : world.wrap(cx + 50);
  const labY = pos ? pos.y : world.wrap(cy + 50);

  const room: Room = stampRoom(world, nextRoomId, RoomType.MEDICAL, labX, labY, LAB_W, LAB_H, -1);
  room.name = 'Затопленная лаборатория';
  room.wallTex = Tex.METAL;
  room.floorTex = Tex.F_TILE;
  protectRoom(world, labX, labY, LAB_W, LAB_H, Tex.METAL, Tex.F_TILE);
  connectProtectedRoom(world, labX, labY, LAB_W, LAB_H);

  // Floor: tile with water puddles in the corners
  for (let dy = 0; dy < LAB_H; dy++) {
    for (let dx = 0; dx < LAB_W; dx++) {
      const ci = world.idx(labX + dx, labY + dy);
      world.floorTex[ci] = Tex.F_TILE;
    }
  }
  // Two water puddles (passable WATER cells) in opposite corners
  const puddles: [number, number][] = [
    [labX + 1, labY + 1],
    [labX + 1, labY + LAB_H - 2],
    [labX + LAB_W - 2, labY + 1],
    [labX + LAB_W - 2, labY + LAB_H - 2],
  ];
  for (const [px, py] of puddles) {
    const ci = world.idx(px, py);
    world.cells[ci] = Cell.WATER;
    world.floorTex[ci] = Tex.F_WATER;
  }

  // Lamps
  const rcx = labX + Math.floor(LAB_W / 2);
  const rcy = labY + Math.floor(LAB_H / 2);
  world.features[world.idx(rcx, rcy - 1)] = Feature.LAMP;
  world.features[world.idx(labX + 2, labY + Math.floor(LAB_H / 2))] = Feature.LAMP;
  world.features[world.idx(labX + LAB_W - 3, labY + Math.floor(LAB_H / 2))] = Feature.LAMP;

  // Workbenches: row of MACHINE/APPARATUS/SHELF along the back wall
  for (let dx = 2; dx < LAB_W - 2; dx++) {
    const ci = world.idx(labX + dx, labY + 1);
    if (world.cells[ci] !== Cell.FLOOR) continue;
    if (dx % 3 === 0)      world.features[ci] = Feature.MACHINE;
    else if (dx % 3 === 1) world.features[ci] = Feature.APPARATUS;
    else                   world.features[ci] = Feature.SHELF;
  }
  // Front: desk + chair (consultation point)
  world.features[world.idx(rcx, rcy + 1)] = Feature.DESK;
  world.features[world.idx(rcx - 1, rcy + 1)] = Feature.CHAIR;
  world.features[world.idx(rcx + 1, rcy + 1)] = Feature.CHAIR;

  // Loot scattered: a few notes, an antidep, an energy cell
  const lootPool = ['note', 'note', 'antidep', 'pills', 'bandage', 'ammo_energy', 'psi_strike', 'tea'];
  for (const defId of lootPool) {
    for (let attempt = 0; attempt < 30; attempt++) {
      const lx = labX + 1 + Math.floor(Math.random() * (LAB_W - 2));
      const ly = labY + 1 + Math.floor(Math.random() * (LAB_H - 2));
      const ci = world.idx(lx, ly);
      if (world.cells[ci] !== Cell.FLOOR) continue;
      if (world.features[ci]) continue;
      entities.push({
        id: nextId.v++, type: EntityType.ITEM_DROP,
        x: lx + 0.5, y: ly + 0.5, angle: 0, pitch: 0, alive: true, speed: 0, sprite: Spr.ITEM_DROP,
        inventory: [{ defId, count: 1 }],
      });
      break;
    }
  }

  // NPC: Профессор Тесла in the center
  entities.push({
    id: nextId.v++, type: EntityType.NPC,
    x: rcx + 0.5, y: rcy + 0.5,
    angle: Math.PI / 2, pitch: 0,
    alive: true, speed: NPC_DEF.speed, sprite: NPC_DEF.sprite,
    name: NPC_DEF.name, isFemale: NPC_DEF.isFemale,
    needs: freshNeeds(), hp: NPC_DEF.hp, maxHp: NPC_DEF.maxHp, money: NPC_DEF.money,
    ai: { goal: AIGoal.IDLE, tx: 0, ty: 0, path: [], pi: 0, stuck: 0, timer: 0 },
    inventory: NPC_DEF.inventory.map(i => ({ ...i })),
    faction: NPC_DEF.faction, occupation: NPC_DEF.occupation,
    plotNpcId: 'prof_tesla', canGiveQuest: true, questId: -1,
  });

  // Two assistant scientist NPCs (named, lower HP, no quests)
  const assistants = [
    { name: 'Лаборант Клим', x: labX + 2, y: rcy + 1 },
    { name: 'Лаборант Соня',  x: labX + LAB_W - 3, y: rcy + 1 },
  ];
  for (const a of assistants) {
    entities.push({
      id: nextId.v++, type: EntityType.NPC,
      x: a.x + 0.5, y: a.y + 0.5,
      angle: Math.PI / 2, pitch: 0,
      alive: true, speed: 1.0, sprite: Occupation.SCIENTIST,
      name: a.name, isFemale: a.name === 'Лаборант Соня',
      needs: freshNeeds(), hp: 80, maxHp: 80, money: 20,
      ai: { goal: AIGoal.IDLE, tx: 0, ty: 0, path: [], pi: 0, stuck: 0, timer: 0 },
      inventory: [{ defId: 'note', count: 1 }, { defId: 'antidep', count: 1 }],
      faction: Faction.SCIENTIST, occupation: Occupation.SCIENTIST,
      questId: -1,
    });
  }

  genLog(`[FLOODED_LAB] at (${labX}, ${labY}) room #${room.id}`);
  const usedId = Math.max(nextRoomId, room.id + 1);
  return { nextRoomId: usedId };
}
