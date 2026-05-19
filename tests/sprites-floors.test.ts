import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { Cell, ContainerKind, EntityType, Feature, FloorLevel, MonsterKind, Occupation, Tex, type Entity } from '../src/core/types';
import { entityUsesProceduralSprite, generateProceduralEntitySprite, isFloor69FemaleSprite } from '../src/entities/procedural_visuals';
import { generateFloor, isFloorLevel } from '../src/gen/floor_manifest';
import { S } from '../src/render/pixutil';
import {
  containerSpr,
  featureSpr,
  monsterSpr,
  Spr,
  SPRITE_CONTAINER_KINDS,
  SPRITE_FEATURES,
  SPRITE_MONSTER_KINDS,
} from '../src/render/sprite_index';
import { generateSprites } from '../src/render/sprites';
import { generateTextures } from '../src/render/textures';
import { rebuildWorld } from '../src/systems/samosbor';

function spriteHash(sprite: Uint32Array): number {
  let h = 2166136261;
  for (let i = 0; i < sprite.length; i++) {
    h ^= sprite[i];
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function opaquePixels(sprite: Uint32Array): number {
  let opaque = 0;
  for (const px of sprite) if ((px >>> 24) !== 0) opaque++;
  return opaque;
}

test('sprite registry and generated sheet stay aligned', () => {
  const sprites = generateSprites();

  assert.equal(sprites.length, Spr.TOTAL);
  assert.equal(featureSpr(Feature.DESK), Spr.DESK);
  assert.equal(Spr.FEATURE_BASE, Spr.DESK + 1);
  assert.equal(Spr.ART_NUDE_3, Spr.ART_NUDE_BASE + 3);
  assert.equal(Spr.F69_FEMALE_NPC_BASE, Spr.ART_NUDE_3 + 1);
  assert.equal(Spr.F69_FEMALE_NPC_7 + 1, Spr.TOTAL);
  for (let i = 0; i < sprites.length; i++) {
    assert.equal(sprites[i].length, S * S);
    assert.ok(opaquePixels(sprites[i]) > 0, `sprite ${i} should not be blank`);
  }

  const seenHashes = new Map<number, number>();
  for (let i = 0; i < sprites.length; i++) {
    const hash = spriteHash(sprites[i]);
    const prev = seenHashes.get(hash);
    assert.equal(prev, undefined, `sprite ${i} duplicates sprite ${prev}`);
    seenHashes.set(hash, i);
  }

  const monsterKinds = Object.values(MonsterKind)
    .filter((value): value is MonsterKind => typeof value === 'number')
    .sort((a, b) => a - b);
  assert.deepEqual(SPRITE_MONSTER_KINDS, monsterKinds);
  const monsterSlots = SPRITE_MONSTER_KINDS.map(monsterSpr);
  assert.equal(new Set(monsterSlots).size, SPRITE_MONSTER_KINDS.length);
  for (const i of monsterSlots) {
    assert.ok(i >= 0 && i < Spr.TOTAL, `monster sprite ${i} should be in the atlas`);
    assert.ok(opaquePixels(sprites[i]) > 80, `monster sprite ${i} should not be blank`);
  }

  const featureIds = [Feature.DESK, ...SPRITE_FEATURES];
  assert.equal((SPRITE_FEATURES as readonly Feature[]).includes(Feature.DESK), false);
  const featureSlots = featureIds.map(featureSpr);
  assert.equal(new Set(featureSlots).size, featureIds.length);
  for (const i of featureSlots) {
    assert.ok(i >= 0 && i < Spr.TOTAL, `feature sprite ${i} should be in the atlas`);
    assert.ok(opaquePixels(sprites[i]) > 80, `feature sprite ${i} should not be blank`);
  }

  const containerKinds = Object.values(ContainerKind)
    .filter((value): value is ContainerKind => typeof value === 'number')
    .sort((a, b) => a - b);
  assert.deepEqual(SPRITE_CONTAINER_KINDS, containerKinds);
  const containerSlots = SPRITE_CONTAINER_KINDS.map(containerSpr);
  assert.equal(new Set(containerSlots).size, SPRITE_CONTAINER_KINDS.length);
  for (const i of containerSlots) {
    assert.ok(i >= 0 && i < Spr.TOTAL, `container sprite ${i} should be in the atlas`);
    assert.ok(opaquePixels(sprites[i]) > 80, `container sprite ${i} should not be blank`);
  }

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
    assert.ok(opaquePixels(sprites[i]) > 20, `projectile sprite ${i} should not be blank`);
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
    assert.ok(opaquePixels(sprites[i]) > 80, `world object sprite ${i} should not be blank`);
  }

  for (let i = Spr.ART_NUDE_BASE; i <= Spr.ART_NUDE_3; i++) {
    assert.ok(opaquePixels(sprites[i]) > 200, `art sprite ${i} should not be blank`);
  }
  for (let i = Spr.F69_FEMALE_NPC_BASE; i <= Spr.F69_FEMALE_NPC_7; i++) {
    assert.ok(opaquePixels(sprites[i]) > 200, `F69 fallback sprite ${i} should not be blank`);
  }
});

test('texture atlas procedural ranges stay allocated and filled', () => {
  const textures = generateTextures();

  assert.equal(textures.length, Tex.COUNT);
  assert.equal(Tex.PORTRAIT_BASE + 64, Tex.POSTER_BASE);
  assert.equal(Tex.POSTER_BASE + 64, Tex.F_PARQUET);
  assert.equal(Tex.F_CARPET_EDGE_BASE + 16, Tex.SCREEN_BASE);
  assert.equal(Tex.SCREEN_BASE + 32, Tex.COUNT);

  const ranges: readonly [string, number, number][] = [
    ['slides', Tex.SLIDE_1, Tex.SLIDE_8],
    ['hints', Tex.HINT_1, Tex.HINT_LORE],
    ['portraits', Tex.PORTRAIT_BASE, Tex.PORTRAIT_BASE + 63],
    ['posters', Tex.POSTER_BASE, Tex.POSTER_BASE + 63],
    ['carpet edges', Tex.F_CARPET_EDGE_BASE, Tex.F_CARPET_EDGE_BASE + 15],
    ['screens', Tex.SCREEN_BASE, Tex.SCREEN_BASE + 31],
  ];

  for (const [name, first, last] of ranges) {
    assert.ok(first >= 0 && last < Tex.COUNT && first <= last, `${name} range should fit the atlas`);
    for (let i = first; i <= last; i++) {
      assert.equal(textures[i].length, S * S, `${name} texture ${i} should have atlas-sized pixels`);
      assert.ok(opaquePixels(textures[i]) > S * S / 2, `${name} texture ${i} should not be blank`);
    }
  }

  for (let i = 0; i < textures.length; i++) {
    assert.equal(textures[i].length, S * S);
    assert.ok(opaquePixels(textures[i]) > 0, `texture ${i} should not be blank`);
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
