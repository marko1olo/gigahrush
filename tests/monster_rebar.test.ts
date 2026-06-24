import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { AIGoal, Cell, EntityType, Faction, FloorLevel, MonsterKind, type Entity, type Msg } from '../src/core/types';
import { World } from '../src/core/world';
import { DEF, generateSprite } from '../src/entities/rebar';
import { getMonsterEcology } from '../src/data/monster_ecology';
import { updateMonster, setEntityMap } from '../src/systems/ai/monster';
import { createWorldEventState, getRecentEvents, publishEvent } from '../src/systems/events';
import { publishNoise, resetNoiseRecords } from '../src/systems/noise';
import { getEntityIndex, rebuildEntityIndex } from '../src/systems/entity_index';
import { setListenerPos } from '../src/systems/audio';
import { monsterSpr } from '../src/render/sprite_index';
import { S } from '../src/render/pixutil';
import { makeGameState } from './helpers';

function openWorld(): World {
  const world = new World();
  world.cells.fill(Cell.FLOOR);
  world.zoneMap.fill(0);
  world.zones[0] = {
    id: 0,
    cx: 10,
    cy: 10,
    faction: 0,
    hasLift: false,
    fogged: false,
    level: 1,
    hqRoomId: -1,
  };
  return world;
}

function player(x: number, y: number): Entity {
  return {
    id: 1,
    type: EntityType.NPC, persistentNpcId: 'player',
    x,
    y,
    angle: 0,
    pitch: 0,
    alive: true,
    speed: 3,
    sprite: 0,
    hp: 100,
    maxHp: 100,
    name: 'Вы',
    faction: Faction.PLAYER,
  };
}

function rebarEntity(id: number, x: number, y: number): Entity {
  return {
    id,
    type: EntityType.MONSTER,
    x,
    y,
    angle: 0,
    pitch: 0,
    alive: true,
    speed: DEF.speed,
    sprite: monsterSpr(MonsterKind.REBAR),
    hp: DEF.hp,
    maxHp: DEF.hp,
    monsterKind: MonsterKind.REBAR,
    attackCd: 0,
    ai: { goal: AIGoal.IDLE, tx: 0, ty: 0, path: [], pi: 0, stuck: 0, timer: 0 },
  };
}

function prime(entities: Entity[]): void {
  rebuildEntityIndex(entities);
  getEntityIndex().beginTelemetryFrame();
  setEntityMap(new Map(entities.map(e => [e.id, e])));
}

test('rebar definition, ecology, and sprite properties are correct', () => {
  const ecology = getMonsterEcology(MonsterKind.REBAR);
  const sprite = generateSprite();

  let opaque = 0;
  for (const px of sprite) {
    if ((px >>> 24) !== 0) {
      opaque++;
    }
  }

  assert.equal(DEF.kind, MonsterKind.REBAR);
  assert.deepEqual(DEF.aiFlags, ['debrisLurker', 'wallBias']);
  assert.deepEqual(DEF.floors, [FloorLevel.LIVING, FloorLevel.MAINTENANCE, FloorLevel.HELL, FloorLevel.VOID]);
  assert.equal(ecology?.rare, undefined);
  assert.match(DEF.counterplay ?? '', /Железо звенит|центр|дистанции/i);

  assert.equal(sprite.length, S * S);
  assert.equal(opaque > 100, true, 'rebar sprite should have a readable amount of opaque pixels');
});

test('rebar uses debrisLurker and wallBias to change scale in and out of cover', () => {
  const world = openWorld();
  const target = player(10, 10);
  const rebar = rebarEntity(2, 12, 10);
  rebar.ai!.combatTargetId = target.id;
  const entities = [target, rebar];
  const state = makeGameState({ worldEvents: createWorldEventState() });
  const msgs: Msg[] = [];

  // Setup wall cover
  world.cells[9 * world.W + 12] = Cell.WALL; // Wall above rebar

  prime(entities);
  updateMonster(world, entities, rebar, 0.1, 1, msgs, target.id, { v: 10 }, state);

  // Expect scale up when near wall due to wallBias/debrisLurker active logic
  assert.equal(rebar.spriteScale, 1.05);

  // Move rebar to open area without wall
  rebar.x = 15;
  rebar.y = 15;
  world.cells[9 * world.W + 12] = Cell.FLOOR; // Remove wall

  prime(entities);
  updateMonster(world, entities, rebar, 0.1, 2, msgs, target.id, { v: 10 }, state);

  // Expect scale down when open floor breaks wallBias/debrisLurker
  assert.equal(rebar.spriteScale, 0.94);
});
