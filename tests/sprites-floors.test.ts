import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { Cell, ContainerKind, EntityType, Feature, FloorLevel, Occupation, type Entity } from '../src/core/types';
import { entityUsesProceduralSprite, generateProceduralEntitySprite, isFloor69FemaleSprite } from '../src/entities/procedural_visuals';
import { generateFloor, isFloorLevel } from '../src/gen/floor_manifest';
import { S } from '../src/render/pixutil';
import { containerSpr, featureSpr, Spr } from '../src/render/sprite_index';
import { generateSprites } from '../src/render/sprites';
import { rebuildWorld } from '../src/systems/samosbor';

function spriteHash(sprite: Uint32Array): number {
  let h = 2166136261;
  for (let i = 0; i < sprite.length; i += 17) {
    h ^= sprite[i];
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

test('sprite registry and generated sheet stay aligned', () => {
  const sprites = generateSprites();

  assert.equal(sprites.length, Spr.TOTAL);
  assert.equal(Spr.ART_NUDE_3, Spr.ART_NUDE_BASE + 3);
  assert.equal(Spr.F69_FEMALE_NPC_BASE, Spr.ART_NUDE_3 + 1);
  assert.equal(Spr.F69_FEMALE_NPC_7 + 1, Spr.TOTAL);
  for (const sprite of sprites) assert.equal(sprite.length, S * S);

  const projectileSprites = [
    Spr.EYE_BOLT,
    Spr.BULLET,
    Spr.PELLET,
    Spr.NAIL,
    Spr.PSI_BOLT,
    Spr.PLASMA_BOLT,
    Spr.HOSTILE_BULLET,
    Spr.HOSTILE_PELLET,
    Spr.HOSTILE_NAIL,
    Spr.HOSTILE_PSI_BOLT,
    Spr.HOSTILE_PLASMA_BOLT,
    Spr.HOSTILE_FLAME_BOLT,
    Spr.GAUSS_BOLT,
    Spr.BFG_BOLT,
    Spr.FLAME_BOLT,
    Spr.GRENADE,
  ];
  for (const i of projectileSprites) {
    assert.ok(i >= 0 && i < Spr.TOTAL, `projectile sprite ${i} should be in the atlas`);
    let opaque = 0;
    for (const px of sprites[i]) if (px !== 0) opaque++;
    assert.ok(opaque > 20, `projectile sprite ${i} should not be blank`);
  }

  const worldObjectSprites = [
    featureSpr(Feature.TABLE),
    featureSpr(Feature.CHAIR),
    featureSpr(Feature.BED),
    featureSpr(Feature.SHELF),
    featureSpr(Feature.MACHINE),
    featureSpr(Feature.SCREEN),
    containerSpr(ContainerKind.WOODEN_CHEST),
    containerSpr(ContainerKind.METAL_CABINET),
    containerSpr(ContainerKind.SAFE),
    containerSpr(ContainerKind.TRASH_BIN),
  ];
  for (const i of worldObjectSprites) {
    assert.ok(i >= 0 && i < Spr.TOTAL, `world object sprite ${i} should be in the atlas`);
    let opaque = 0;
    for (const px of sprites[i]) if (px !== 0) opaque++;
    assert.ok(opaque > 80, `world object sprite ${i} should not be blank`);
  }

  for (let i = Spr.ART_NUDE_BASE; i <= Spr.ART_NUDE_3; i++) {
    let opaque = 0;
    for (const px of sprites[i]) if (px !== 0) opaque++;
    assert.ok(opaque > 200, `art sprite ${i} should not be blank`);
  }
  for (let i = Spr.F69_FEMALE_NPC_BASE; i <= Spr.F69_FEMALE_NPC_7; i++) {
    let opaque = 0;
    for (const px of sprites[i]) if (px !== 0) opaque++;
    assert.ok(opaque > 200, `F69 fallback sprite ${i} should not be blank`);
  }
});

test('F69 NPC sprites use seed-driven procedural adult variants', () => {
  const f69Npc: Entity = {
    id: 6901,
    type: EntityType.NPC,
    x: 1,
    y: 1,
    angle: 0,
    pitch: 0,
    alive: true,
    speed: 1,
    sprite: Spr.F69_FEMALE_NPC_0,
    occupation: Occupation.TRAVELER,
    isFemale: true,
  };
  const travelerNpc: Entity = {
    ...f69Npc,
    id: 6902,
    sprite: Occupation.TRAVELER,
  };
  const otherF69Npc: Entity = {
    ...f69Npc,
    id: 6903,
    name: 'Другая сцена',
  };
  const authoredNpc: Entity = {
    ...f69Npc,
    id: 6904,
    sprite: Spr.VETERAN,
  };

  const f69Sprite = generateProceduralEntitySprite(f69Npc);
  const otherF69Sprite = generateProceduralEntitySprite(otherF69Npc);
  assert.equal(isFloor69FemaleSprite(f69Npc.sprite), true);
  assert.equal(entityUsesProceduralSprite(f69Npc), true);
  assert.equal(f69Sprite?.length, S * S);
  assert.equal(otherF69Sprite?.length, S * S);
  assert.notEqual(spriteHash(f69Sprite!), spriteHash(otherF69Sprite!));
  assert.equal(entityUsesProceduralSprite(travelerNpc), true);
  assert.equal(generateProceduralEntitySprite(travelerNpc)?.length, S * S);
  assert.equal(entityUsesProceduralSprite(authoredNpc), false);
  assert.equal(generateProceduralEntitySprite(authoredNpc), null);
});

test('floor manifest validates known floors and rejects invalid ids', () => {
  assert.equal(isFloorLevel(FloorLevel.MINISTRY), true);
  assert.equal(isFloorLevel(FloorLevel.VOID), true);
  assert.equal(isFloorLevel(-1), false);
  assert.equal(isFloorLevel(999), false);
  assert.equal(isFloorLevel('2'), false);
});

test('all floor generators return playable spawn cells and live actors', () => {
  const floors = [
    FloorLevel.MINISTRY,
    FloorLevel.KVARTIRY,
    FloorLevel.LIVING,
    FloorLevel.MAINTENANCE,
    FloorLevel.HELL,
    FloorLevel.VOID,
  ];

  for (const floor of floors) {
    const generated = generateFloor(floor);
    const sx = Math.floor(generated.spawnX);
    const sy = Math.floor(generated.spawnY);
    const spawnIdx = generated.world.idx(sx, sy);

    assert.equal(generated.world.cells.length, 1024 * 1024);
    assert.ok(
      generated.world.cells[spawnIdx] === Cell.FLOOR || generated.world.cells[spawnIdx] === Cell.WATER,
      `floor ${floor} spawn must be passable`,
    );
    assert.equal(generated.world.solid(sx, sy), false, `floor ${floor} spawn must not be solid`);
    assert.equal(generated.world.zones.length, 64, `floor ${floor} should have 64 zones`);
    assert.ok(generated.entities.some(e => e.alive && (e.type === EntityType.NPC || e.type === EntityType.MONSTER)));
  }
});

test('non-living samosbor rebuild replaces stale generated actors but keeps player', () => {
  const generated = generateFloor(FloorLevel.MAINTENANCE);
  const entities = [...generated.entities];
  entities.push(
    {
      id: 9001,
      type: EntityType.PLAYER,
      x: generated.spawnX,
      y: generated.spawnY,
      angle: 0,
      pitch: 0,
      alive: true,
      speed: 0,
      sprite: 0,
    },
    {
      id: 9002,
      type: EntityType.NPC,
      x: generated.spawnX + 1,
      y: generated.spawnY,
      angle: 0,
      pitch: 0,
      alive: true,
      speed: 0,
      sprite: 0,
    },
    {
      id: 9003,
      type: EntityType.MONSTER,
      x: generated.spawnX + 2,
      y: generated.spawnY,
      angle: 0,
      pitch: 0,
      alive: true,
      speed: 0,
      sprite: 0,
    },
  );

  rebuildWorld(generated.world, entities, { v: 10000 }, 1, FloorLevel.MAINTENANCE);

  const player = entities.find(e => e.id === 9001);
  assert.ok(player);
  assert.equal(entities.some(e => e.id === 9002), false);
  assert.equal(entities.some(e => e.id === 9003), false);
  assert.ok(entities.some(e => e.id >= 10000 && (e.type === EntityType.NPC || e.type === EntityType.MONSTER)));
  const playerCell = generated.world.cells[generated.world.idx(Math.floor(player.x), Math.floor(player.y))];
  assert.ok(playerCell === Cell.FLOOR || playerCell === Cell.WATER);
});
