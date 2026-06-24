import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { AIGoal, Cell, EntityType, Faction, FloorLevel, MonsterKind, type Entity, type Msg } from '../src/core/types';
import { World } from '../src/core/world';
import { DEF, generateSprite } from '../src/entities/shovnik';
import { getMonsterEcology } from '../src/data/monster_ecology';
import { updateMonster, setEntityMap } from '../src/systems/ai/monster';
import { getEntityIndex, rebuildEntityIndex } from '../src/systems/entity_index';
import { S, rgba } from '../src/render/pixutil';
import { makeGameState, addTestRoom, makeTestPlayer } from './helpers';

function shovnik(id: number, x: number, y: number): Entity {
  return {
    id,
    type: EntityType.MONSTER,
    x,
    y,
    angle: 0,
    pitch: 0,
    alive: true,
    speed: DEF.speed,
    sprite: DEF.sprite,
    hp: DEF.hp,
    maxHp: DEF.hp,
    monsterKind: MonsterKind.SHOVNIK,
    attackCd: 0,
    ai: { goal: AIGoal.IDLE, tx: 0, ty: 0, path: [], pi: 0, stuck: 0, timer: 0 },
  };
}

function prime(entities: Entity[]): void {
  rebuildEntityIndex(entities);
  getEntityIndex().beginTelemetryFrame();
  setEntityMap(new Map(entities.map(e => [e.id, e])));
}

test('shovnik definition and sprite', () => {
  assert.equal(DEF.kind, MonsterKind.SHOVNIK);
  assert.ok(DEF.aiFlags?.includes('wallBias'), 'shovnik must have wallBias AI flag');

  const sprite = generateSprite();
  assert.equal(sprite.length, S * S);

  let seamPixels = 0;
  let eyePixels = 0;

  for (const px of sprite) {
    if (px === rgba(35, 25, 28) || px === rgba(35, 28, 25)) seamPixels++;
    if (px === rgba(240, 190, 70)) eyePixels++;
  }

  assert.ok(seamPixels > 50, 'sprite should have dark seam pixels');
  assert.equal(eyePixels, 2, 'sprite should have exactly two yellow eye pixels');
});

test('shovnik definition and ecology read as civil seam hunter', () => {
  const ecology = getMonsterEcology(MonsterKind.SHOVNIK);
  assert.ok(ecology, 'ecology must be defined');
  assert.equal(ecology.rare, false);
  assert.equal(DEF.floors?.includes(FloorLevel.KVARTIRY), true);
  assert.equal(DEF.floors?.includes(FloorLevel.LIVING), true);
  assert.equal(DEF.floors?.includes(FloorLevel.MINISTRY), true);
  assert.match(DEF.counterplay ?? '', /центр|кромк/i);
});

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

test('shovnik gains wallBias advantage near walls and loses it in open floor', () => {
  const world = openWorld();
  addTestRoom(world, { id: 1, x: 5, y: 5, w: 10, h: 10, type: 0, carve: true });

  // Make the walls explicit by placing them correctly
  world.cells[world.idx(5, 5)] = Cell.WALL;

  // Create player and shovnik near wall
  const target = makeTestPlayer({ x: 5.5, y: 5.5 });
  const monster = shovnik(2, 6, 5.5);
  monster.ai!.combatTargetId = target.id;
  const entities = [target, monster];
  const msgs: Msg[] = [];
  const state = makeGameState();

  prime(entities);
  updateMonster(world, entities, monster, 0.1, 1, msgs, target.id, { v: 10 }, state);

  assert.equal(monster.ai?.wallBiasWasActive, true, 'shovnik should have wall advantage near wall');

  // Move them to open center
  target.x = 10;
  target.y = 10;
  monster.x = 10;
  monster.y = 11;

  prime(entities);
  updateMonster(world, entities, monster, 0.1, 2, msgs, target.id, { v: 10 }, state);

  assert.equal(monster.ai?.wallBiasWasActive, false, 'shovnik should lose wall advantage in open area');
});
