import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { EntityType, Faction, FloorLevel, MonsterKind, ZoneFaction, type Entity } from '../src/core/types';
import { World } from '../src/core/world';
import {
  generateMyasomer,
  getMyasomerDebugSite,
  resetMyasomerForTests,
} from '../src/gen/hell/myasomer';
import { publishEvent, getRecentEvents } from '../src/systems/events';
import { makeGameState } from './helpers';

function player(): Entity {
  return {
    id: 1,
    type: EntityType.PLAYER,
    x: 512.5,
    y: 512.5,
    angle: 0,
    pitch: 0,
    alive: true,
    speed: 3,
    sprite: 0,
    name: 'Вы',
    faction: Faction.PLAYER,
  };
}

function myasomerFixture(): { world: World; entities: Entity[]; site: NonNullable<ReturnType<typeof getMyasomerDebugSite>> } {
  resetMyasomerForTests();
  const world = new World();
  world.zones[0] = {
    id: 0,
    cx: 512,
    cy: 512,
    faction: ZoneFaction.SAMOSBOR,
    hasLift: false,
    fogged: false,
    level: 9,
    hqRoomId: -1,
  };
  const entities = [player()];
  generateMyasomer(world, entities, { v: 2 });
  const site = getMyasomerDebugSite();
  assert.ok(site, 'myasomer site should be generated in an empty hell test world');
  entities[0].x = site.x;
  entities[0].y = site.y;
  return { world, entities, site };
}

test('myasomer generation creates local quiet and loud rewards', () => {
  const { world, site } = myasomerFixture();
  const room = world.rooms[site.roomId];
  assert.equal(room.name, 'Коридор Мясомера');

  const quiet = world.containerById.get(site.quietContainerId);
  const shard = world.containerById.get(site.shardContainerId);
  assert.ok(quiet);
  assert.ok(shard);
  assert.equal(quiet.inventory.some(item => item.defId === 'rawmeat'), true);
  assert.equal(shard.inventory.some(item => item.defId === 'siren_shard'), true);
  assert.equal(shard.tags.includes('loud_trigger'), true);
  resetMyasomerForTests();
});

test('quiet cache publishes myasomer quiet-clear without spawning threats', () => {
  const { entities, site } = myasomerFixture();
  const state = makeGameState({ currentFloor: FloorLevel.HELL, time: 20 });

  publishEvent(state, {
    type: 'container_opened',
    floor: FloorLevel.HELL,
    zoneId: site.zoneId,
    roomId: site.roomId,
    x: site.x,
    y: site.y,
    actorId: 1,
    actorName: 'Вы',
    actorFaction: Faction.PLAYER,
    containerId: site.quietContainerId,
    itemId: 'rawmeat',
    itemName: 'Сырое мясо',
    itemCount: 1,
    severity: 1,
    privacy: 'private',
    tags: ['container', 'open', 'myasomer'],
  });

  assert.equal(getRecentEvents(state, { tags: ['myasomer_quiet_clear'], limit: 1 }).length, 1);
  assert.equal(entities.filter(entity => entity.type === EntityType.MONSTER && entity.alive).length, 0);
  resetMyasomerForTests();
});

test('siren shard noise escalates locally and caps spawned pressure', () => {
  const { entities, site } = myasomerFixture();
  const state = makeGameState({ currentFloor: FloorLevel.HELL, time: 40 });

  for (let i = 0; i < 5; i++) {
    state.time += 1;
    publishEvent(state, {
      type: 'item_stolen',
      floor: FloorLevel.HELL,
      zoneId: site.zoneId,
      roomId: site.roomId,
      x: site.x,
      y: site.y,
      actorId: 1,
      actorName: 'Вы',
      actorFaction: Faction.PLAYER,
      containerId: site.shardContainerId,
      itemId: 'siren_shard',
      itemName: 'Осколок сирены',
      itemCount: 1,
      severity: 3,
      privacy: 'local',
      tags: ['container', 'theft', 'myasomer', 'loud_trigger'],
    });
  }

  const threats = entities.filter(entity => entity.type === EntityType.MONSTER && entity.alive);
  assert.equal(threats.length, 3);
  assert.equal(threats.some(entity => entity.monsterKind === MonsterKind.SHADOW), true);
  assert.equal(getRecentEvents(state, { tags: ['myasomer_warned'], limit: 1 }).length, 1);
  assert.equal(getRecentEvents(state, { tags: ['myasomer_triggered'], limit: 1 }).length >= 1, true);

  for (const threat of threats) threat.alive = false;
  publishEvent(state, {
    type: 'player_kill_monster',
    floor: FloorLevel.HELL,
    zoneId: site.zoneId,
    roomId: site.roomId,
    x: site.x,
    y: site.y,
    actorId: 1,
    actorName: 'Вы',
    actorFaction: Faction.PLAYER,
    targetId: threats[0].id,
    targetName: threats[0].name,
    monsterKind: threats[0].monsterKind,
    severity: 3,
    privacy: 'local',
    tags: ['combat', 'kill', 'monster'],
  });

  assert.equal(getRecentEvents(state, { tags: ['myasomer_loud_clear'], limit: 1 }).length, 1);
  resetMyasomerForTests();
});
