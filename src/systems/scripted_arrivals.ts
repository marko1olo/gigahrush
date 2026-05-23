/* ── Scripted A-Life-like arrivals for authored plot beats ────── */

import {
  AIGoal,
  Cell,
  EntityType,
  Faction,
  FloorLevel,
  LiftDirection,
  Occupation,
  W,
  msg,
  type Entity,
  type GameState,
} from '../core/types';
import { World } from '../core/world';
import { freshNeeds, randomName } from '../data/catalog';
import { PLOT_CHAIN, PLOT_NPCS } from '../data/plot';
import { entitySpawnSlots } from './entity_limits';
import { isPlotNpcDead } from './alife';
import { currentFloorRunEntry } from './procedural_floors';
import { randomRPG, getMaxHp } from './rpg';
import { tryAssignPathToCell } from './ai/pathfinding';

const HOLDOUT_TAG = 'hell_holdout';
const GUARD_WEAPONS = ['ak47', 'ppsh', 'shotgun', 'makarov'] as const;

function hellHoldoutStepIndex(): number {
  return PLOT_CHAIN.findIndex(step => step.eventTags?.includes(HOLDOUT_TAG));
}

function shouldSpawnHellHoldoutArrivals(state: GameState, entities: readonly Entity[]): boolean {
  const stepIndex = hellHoldoutStepIndex();
  if (stepIndex < 0) return false;
  if (state.currentFloor !== FloorLevel.HELL || currentFloorRunEntry(state).storyFloor !== FloorLevel.HELL) return false;
  if (!state.quests.some(q => q.plotStepIndex === stepIndex && q.done && !q.failed)) return false;
  if (state.quests.some(q => q.plotStepIndex !== undefined && q.plotStepIndex > stepIndex)) return false;
  if (entities.some(e => e.type === EntityType.NPC && e.alive && e.plotNpcId === 'major_grom')) return false;
  return !isPlotNpcDead(state, 'major_grom');
}

function passable(world: World, x: number, y: number): boolean {
  const cell = world.cells[world.idx(x, y)];
  return cell === Cell.FLOOR || cell === Cell.WATER || cell === Cell.LIFT;
}

function nearestStandCell(world: World, cell: number): number {
  const x = cell % W;
  const y = (cell / W) | 0;
  if (passable(world, x, y)) return cell;
  for (let r = 1; r <= 5; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
        const ci = world.idx(x + dx, y + dy);
        if (passable(world, (ci % W), (ci / W) | 0)) return ci;
      }
    }
  }
  return cell;
}

function arrivalCellNearLift(world: World, targetX: number, targetY: number, fallbackX: number, fallbackY: number): number {
  let best = -1;
  let bestScore = Number.POSITIVE_INFINITY;
  for (let i = 0; i < world.cells.length; i++) {
    if (world.cells[i] !== Cell.LIFT) continue;
    const dir = world.liftDir[i];
    const lx = i % W;
    const ly = (i / W) | 0;
    const stand = nearestStandCell(world, i);
    const score = world.dist2(targetX, targetY, lx + 0.5, ly + 0.5) + (dir === LiftDirection.UP ? 0 : 64);
    if (score < bestScore) {
      best = stand;
      bestScore = score;
    }
  }
  if (best >= 0) return best;
  return nearestStandCell(world, world.idx(Math.floor(fallbackX), Math.floor(fallbackY)));
}

function holdoutAnchor(state: GameState, world: World, player: Entity): { x: number; y: number } {
  const stepIndex = hellHoldoutStepIndex();
  const quest = state.quests.find(q => q.plotStepIndex === stepIndex);
  const room = quest?.targetRoom !== undefined
    ? world.rooms[quest.targetRoom]
    : quest?.targetRoomName
      ? world.rooms.find(r => r?.name === quest.targetRoomName)
      : undefined;
  if (!room) return { x: player.x, y: player.y };
  return { x: room.x + room.w / 2, y: room.y + room.h / 2 };
}

function sendToAnchor(world: World, entity: Entity, anchor: { x: number; y: number }): void {
  if (!entity.ai) return;
  entity.ai.goal = AIGoal.GOTO;
  entity.ai.tx = Math.floor(anchor.x);
  entity.ai.ty = Math.floor(anchor.y);
  const status = tryAssignPathToCell(world, entity, entity.ai.tx, entity.ai.ty);
  if (status === 'not_found') entity.ai.goal = AIGoal.WANDER;
}

function spawnMajor(world: World, entities: Entity[], nextId: { v: number }, cell: number, anchor: { x: number; y: number }): void {
  const def = PLOT_NPCS.major_grom;
  const x = cell % W;
  const y = (cell / W) | 0;
  const major: Entity = {
    id: nextId.v++, type: EntityType.NPC,
    x: x + 0.5, y: y + 0.5,
    angle: 0, pitch: 0, alive: true, speed: def.speed,
    sprite: def.sprite,
    name: def.name, isFemale: def.isFemale,
    needs: freshNeeds(), hp: def.hp, maxHp: def.maxHp, money: def.money,
    ai: { goal: AIGoal.IDLE, tx: 0, ty: 0, path: [], pi: 0, stuck: 0, timer: 0 },
    inventory: def.inventory.map(item => ({ ...item })),
    weapon: 'ak47',
    faction: def.faction, occupation: def.occupation,
    plotNpcId: 'major_grom', canGiveQuest: true, questId: -1,
    isTraveler: true,
  };
  sendToAnchor(world, major, anchor);
  entities.push(major);
}

function spawnLiquidator(world: World, entities: Entity[], nextId: { v: number }, cell: number, anchor: { x: number; y: number }, idx: number): void {
  const x = world.wrap((cell % W) + (idx % 3) - 1);
  const y = world.wrap(((cell / W) | 0) + Math.floor(idx / 3));
  if (!passable(world, x, y)) return;
  const name = randomName(Faction.LIQUIDATOR);
  const rpg = randomRPG(8);
  const maxHp = Math.round(getMaxHp(rpg) * 1.5);
  const weapon = GUARD_WEAPONS[idx % GUARD_WEAPONS.length];
  const ammo = weapon === 'shotgun' ? 'ammo_shells' : weapon === 'ak47' ? 'ammo_762' : 'ammo_9mm';
  const npc: Entity = {
    id: nextId.v++, type: EntityType.NPC,
    x: x + 0.5, y: y + 0.5,
    angle: 0, pitch: 0, alive: true, speed: 1.35 + Math.random() * 0.25,
    sprite: Occupation.HUNTER,
    name: name.name, isFemale: name.female,
    needs: freshNeeds(), hp: maxHp, maxHp,
    money: 20 + Math.floor(Math.random() * 50),
    ai: { goal: AIGoal.IDLE, tx: 0, ty: 0, path: [], pi: 0, stuck: 0, timer: 0 },
    inventory: [
      { defId: weapon, count: 1 },
      { defId: ammo, count: weapon === 'shotgun' ? 8 : 24 },
      { defId: 'bandage', count: 1 },
    ],
    weapon,
    faction: Faction.LIQUIDATOR,
    occupation: Occupation.HUNTER,
    isTraveler: true,
    questId: -1,
    rpg,
  };
  sendToAnchor(world, npc, anchor);
  entities.push(npc);
}

export function updateScriptedArrivals(world: World, entities: Entity[], player: Entity, state: GameState, nextId: { v: number }): boolean {
  if (!shouldSpawnHellHoldoutArrivals(state, entities)) return false;
  const anchor = holdoutAnchor(state, world, player);
  const cell = arrivalCellNearLift(world, anchor.x, anchor.y, player.x, player.y);
  spawnMajor(world, entities, nextId, cell, anchor);
  const slots = entitySpawnSlots(entities, EntityType.NPC, 5);
  for (let i = 0; i < slots; i++) spawnLiquidator(world, entities, nextId, cell, anchor, i);
  state.msgs.push(msg('Лифт выплюнул группу Громного. Они идут к зоне закрепления, оружие уже на руках.', state.time, '#8cf'));
  return true;
}
