import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { AIGoal, Cell, EntityType, Faction, FloorLevel, MonsterKind, ProjType, RoomType, type Entity } from '../src/core/types';
import { World } from '../src/core/world';
import { getMonsterEcology } from '../src/data/monster_ecology';
import { RUMORS } from '../src/data/rumors';
import { DEF, generateSprite } from '../src/entities/fog_shark';
import { MONSTERS, MONSTER_SPRITES, NEW_MONSTERS_BY_FLOOR } from '../src/entities/monster';
import { S } from '../src/render/pixutil';
import {
  FOG_SHARK_DRY_SPEED_MULT,
  FOG_SHARK_FOG_SPEED_MULT,
  fogSharkMoveMultiplierForTests,
} from '../src/systems/ai/monster';
import { rebuildEntityIndex } from '../src/systems/entity_index';
import { createWorldEventState, getRecentEvents } from '../src/systems/events';
import {
  FOG_SHARK_IGNITION_TARGET_CAP,
} from '../src/systems/fog_shark';
import { adjustMonsterProjectileDamage, recordMonsterProjectileDeath } from '../src/systems/monster_counterplay';
import { makeGameState, makeTestNpc, makeTestPlayer } from './helpers';

function openWorld(): World {
  const world = new World();
  world.cells.fill(Cell.FLOOR);
  world.zoneMap.fill(0);
  world.roomMap.fill(0);
  world.rooms[0] = {
    id: 0,
    type: RoomType.CORRIDOR,
    x: 8,
    y: 8,
    w: 12,
    h: 8,
    doors: [],
    sealed: false,
    name: 'Тестовый туманный коридор',
    apartmentId: -1,
  };
  world.zones[0] = {
    id: 0,
    cx: 10,
    cy: 10,
    faction: 0,
    hasLift: false,
    fogged: false,
    level: 2,
    hqRoomId: -1,
  };
  return world;
}

function fogShark(id: number, x: number, y: number, hp = DEF.hp): Entity {
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
    hp,
    maxHp: DEF.hp,
    monsterKind: MonsterKind.FOG_SHARK,
    attackCd: 0,
    ai: { goal: AIGoal.IDLE, tx: 0, ty: 0, path: [], pi: 0, stuck: 0, timer: 0 },
  };
}

test('fog shark is standalone fog-pack content with sprite, ecology, and rumors', () => {
  const ecology = getMonsterEcology(MonsterKind.FOG_SHARK);
  const sprite = generateSprite();
  let opaque = 0;
  let teeth = 0;
  let fogPixels = 0;

  for (const px of sprite) {
    const a = px >>> 24;
    if (a === 0) continue;
    opaque++;
    const r = px & 255;
    const g = (px >>> 8) & 255;
    const b = (px >>> 16) & 255;
    if (r > 190 && g > 190 && b > 180) teeth++;
    if (a > 25 && a < 130 && b > r - 15) fogPixels++;
  }

  assert.equal(DEF.kind, MonsterKind.FOG_SHARK);
  assert.equal(MONSTERS[MonsterKind.FOG_SHARK], DEF);
  assert.equal(MONSTER_SPRITES[MonsterKind.FOG_SHARK], generateSprite);
  assert.deepEqual(DEF.aiFlags, ['fogSwimmer']);
  assert.deepEqual(DEF.floors, [FloorLevel.LIVING, FloorLevel.MAINTENANCE, FloorLevel.HELL]);
  assert.equal(NEW_MONSTERS_BY_FLOOR[FloorLevel.MAINTENANCE].includes(MonsterKind.FOG_SHARK), true);
  assert.match(DEF.counterplay ?? '', /туман|двер|огонь|взрыв/i);
  assert.equal(ecology?.rumorIds.includes('monster_fog_shark_fog'), true);
  assert.equal(ecology?.rumorIds.includes('ecology_fog_shark_fire'), true);
  assert.equal(RUMORS.some(rumor => rumor.id === 'monster_fog_shark_fog'), true);
  assert.equal(RUMORS.some(rumor => rumor.id === 'ecology_fog_shark_fire'), true);
  assert.equal(sprite.length, S * S);
  assert.equal(opaque > 350, true);
  assert.equal(teeth >= 10, true, 'metal teeth should read in the small sprite');
  assert.equal(fogPixels > 45, true, 'fog fringe should make the shark read airborne');
});

test('fog shark slows sharply on dry cells and regains speed in fog pressure', () => {
  const world = openWorld();
  const shark = fogShark(2, 10.5, 10.5);

  assert.equal(fogSharkMoveMultiplierForTests(world, shark), FOG_SHARK_DRY_SPEED_MULT);

  world.fog[world.idx(10, 10)] = 90;
  assert.equal(fogSharkMoveMultiplierForTests(world, shark), FOG_SHARK_FOG_SPEED_MULT);

  world.fog[world.idx(10, 10)] = 0;
  world.zones[0].fogged = true;
  assert.equal(fogSharkMoveMultiplierForTests(world, shark), FOG_SHARK_FOG_SPEED_MULT);
});

test('fog shark flame kill is lethal and ignition burst is bounded to one event', () => {
  const world = openWorld();
  const player = makeTestPlayer({ id: 1, x: 11.0, y: 10.5, hp: 100, maxHp: 100, faction: Faction.PLAYER });
  const npc = makeTestNpc({ id: 2, x: 11.4, y: 10.5, hp: 30, maxHp: 30, faction: Faction.CITIZEN });
  const shark = fogShark(3, 10.5, 10.5);
  const pack = Array.from({ length: 12 }, (_, i) => fogShark(10 + i, 10.65 + i * 0.03, 10.9, 6));
  const entities = [player, npc, shark, ...pack];
  const state = makeGameState({ currentFloor: FloorLevel.MAINTENANCE, worldEvents: createWorldEventState() });
  const projectile = {
    id: 80,
    type: EntityType.PROJECTILE,
    x: 9.5,
    y: 10.5,
    angle: 0,
    pitch: 0,
    alive: true,
    speed: 0,
    sprite: 0,
    ownerId: player.id,
    projType: ProjType.FLAME,
    projDmg: 4,
  } satisfies Entity;

  assert.equal(adjustMonsterProjectileDamage(shark, projectile, projectile.projDmg ?? 0) > DEF.hp, true);

  rebuildEntityIndex(entities);
  shark.alive = false;
  let collateralKills = 0;
  recordMonsterProjectileDeath(world, state, shark, projectile, player, target => {
    collateralKills++;
    assert.notEqual(target.id, shark.id);
  });

  const events = getRecentEvents(state, { type: 'fog_shark_ignited', tags: ['fog_shark'], limit: 4 });
  assert.equal(events.length, 1);
  const hits = Number(events[0].data?.hitCount ?? 0);
  assert.equal(hits <= FOG_SHARK_IGNITION_TARGET_CAP, true);
  assert.equal(player.hp! < 100, true, 'close player should be hurt by risky fire');
  assert.equal(npc.hp! < 30, true, 'close NPC should be hurt by the gas burst');
  assert.equal(pack.some(packmate => (packmate.hp ?? DEF.hp) < 6), true, 'nearby sharks should take burst damage');
  assert.equal(collateralKills <= FOG_SHARK_IGNITION_TARGET_CAP, true);

  assert.equal(events[0].data?.cap, FOG_SHARK_IGNITION_TARGET_CAP);
  assert.equal(events[0].data?.killCount, collateralKills);
  assert.equal(events[0].data?.sharkHits !== undefined, true);
});
