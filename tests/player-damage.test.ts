import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import {
  Cell,
  DoorState,
  EntityType,
  Faction,
  FloorLevel,
  MonsterKind,
  RoomType,
  Tex,
  W,
  ZoneFaction,
  type Entity,
} from '../src/core/types';
import { World } from '../src/core/world';
import { SAMOSBOR_VARIANTS, type ActiveSamosborVariant } from '../src/data/samosbor_variants';
import { registerCellHazardSite, tickCellHazards, clearCellHazards } from '../src/systems/cell_hazards';
import { formatLastPlayerDamageCause, recordPlayerDamage, hasFreshPlayerDamageRecord, updateBlockCrushDamage } from '../src/systems/damage';
import { ENTITY_MASK_ACTOR, EntityIndex } from '../src/systems/entity_index';
import { updateNeeds } from '../src/systems/needs';
import { resetSamosborRuntimeForTests, resolvePlayerShelterAtSealForTests } from '../src/systems/samosbor';
import { makeGameState, makeTestEntity, makeTestPlayer, makeTestNpc } from './helpers';

test('last player damage keeps monster source for death cause', () => {
  const state = makeGameState({ time: 42, tick: 123 });
  const monster = makeTestEntity({
    id: 7,
    type: EntityType.MONSTER,
    monsterKind: MonsterKind.TVAR,
    name: 'Тварь из кухни',
  });

  recordPlayerDamage(state, monster, 17);

  assert.equal(formatLastPlayerDamageCause(state, 42), 'Тварь из кухни: -17');
  assert.equal(state.lastDamage?.sourceKind, 'monster');
  assert.equal(state.lastDamage?.sourceId, 7);
});

test('stale player damage is not reused as a death cause', () => {
  const state = makeGameState({ time: 10, tick: 1 });
  const monster = makeTestEntity({ id: 2, type: EntityType.MONSTER, monsterKind: MonsterKind.SBORKA });

  recordPlayerDamage(state, monster, 5);

  assert.equal(formatLastPlayerDamageCause(state, 30), undefined);
});

test('player projectile damage keeps projectile source and actionable shooter detail', () => {
  const state = makeGameState({ time: 18, tick: 55 });
  const projectile = makeTestEntity({ id: 44, type: EntityType.PROJECTILE, name: undefined });

  recordPlayerDamage(state, projectile, 8, 'Дробь от Ликвидатор: -8');

  assert.equal(state.lastDamage?.sourceKind, 'projectile');
  assert.equal(state.lastDamage?.sourceId, 44);
  assert.equal(state.lastDamage?.sourceName, 'снаряд');
  assert.equal(formatLastPlayerDamageCause(state, 18), 'Дробь от Ликвидатор: -8');
});

test('player damage detail hides binary float tails', () => {
  const state = makeGameState({ time: 19, tick: 56 });

  recordPlayerDamage(state, undefined, 1.23456789, 'Тестовый ожог: -1.23456789');

  assert.equal(state.lastDamage?.amount, 1.2);
  assert.equal(formatLastPlayerDamageCause(state, 19), 'Тестовый ожог: -1.2');
});

test('needs starvation records player damage cause', () => {
  const state = makeGameState({ time: 21, tick: 60 });
  const player = makeTestPlayer({
    id: 1,
    hp: 10,
    maxHp: 10,
    needs: { food: 0, water: 40, sleep: 50, pee: 0, poo: 0 },
  });

  updateNeeds([player], 1, state.time, state.msgs, player.id, undefined, state);

  assert.equal(state.lastDamage?.sourceKind, 'need');
  assert.equal(formatLastPlayerDamageCause(state, 21), 'Голод: -0.3');
});

test('needs dehydration records player damage cause', () => {
  const state = makeGameState({ time: 24, tick: 72 });
  const player = makeTestPlayer({
    id: 1,
    hp: 10,
    maxHp: 10,
    needs: { food: 40, water: 0, sleep: 50, pee: 0, poo: 0 },
  });

  updateNeeds([player], 1, state.time, state.msgs, player.id, undefined, state);

  assert.equal(state.lastDamage?.sourceKind, 'need');
  assert.equal(formatLastPlayerDamageCause(state, 24), 'Обезвоживание: -0.5');
});

test('cell hazard damage records hazard cause', () => {
  const world = new World();
  const state = makeGameState({ time: 30, tick: 90 });
  const player = makeTestPlayer({ id: 1, x: 4.5, y: 4.5, hp: 20, maxHp: 20 });
  const cell = world.idx(4, 4);
  world.set(4, 4, Cell.FLOOR);
  registerCellHazardSite(world, {
    id: 'test_acid_pool',
    kind: 'acid',
    displayName: 'Кислотная лужа',
    cells: [cell],
    sticky: false,
    playerDamagePerSecond: 3,
    warning: 'Сойдите с пятна или выжгите его.',
  });

  tickCellHazards(world, [player], state, 1, player, false);
  clearCellHazards(world);

  assert.equal(player.hp, 17);
  assert.equal(state.lastDamage?.sourceKind, 'hazard');
  assert.equal(formatLastPlayerDamageCause(state, 30), 'Кислотная лужа: -3. Сойдите с пятна или выжгите его.');
});

const CLASSIC_VARIANT_DEF = SAMOSBOR_VARIANTS.find(variant => variant.id === 'classic');
if (!CLASSIC_VARIANT_DEF) throw new Error('classic samosbor variant missing');

const CLASSIC_TEST_VARIANT: ActiveSamosborVariant = {
  def: CLASSIC_VARIANT_DEF,
  modifiers: [],
  durationMult: CLASSIC_VARIANT_DEF.durationMult,
  spawnMult: CLASSIC_VARIANT_DEF.spawnMult,
  fogSeedMult: 1,
  fogSpawnIntervalMult: 1,
  sealTimingDelta: CLASSIC_VARIANT_DEF.sealTimingDelta,
  noSiren: false,
  extraEyes: 0,
  shelterRoomCount: 0,
  fogColor: CLASSIC_VARIANT_DEF.fogColor,
};

function makeUnpreparedSamosborShelter(): { world: World; entities: Entity[]; player: Entity } {
  const world = new World();
  const roomId = 88;
  const room = {
    id: roomId,
    type: RoomType.LIVING,
    x: 10, y: 10, w: 4, h: 4,
    doors: [] as number[],
    sealed: false,
    name: 'Тестовая комната',
    apartmentId: -1,
    wallTex: Tex.CONCRETE,
    floorTex: Tex.F_CONCRETE,
  };
  world.rooms[roomId] = room;
  world.zones[0] = { id: 0, cx: 12, cy: 12, faction: ZoneFaction.CITIZEN, hasLift: false, fogged: false, level: 1, hqRoomId: -1 };
  for (let y = room.y; y < room.y + room.h; y++) {
    for (let x = room.x; x < room.x + room.w; x++) {
      const ci = world.idx(x, y);
      world.set(x, y, Cell.FLOOR);
      world.roomMap[ci] = roomId;
      world.zoneMap[ci] = 0;
      world.aptMask[ci] = 1;
    }
  }
  const doorIdx = world.idx(room.x + room.w, room.y + 1);
  world.set(room.x + room.w, room.y + 1, Cell.DOOR);
  world.roomMap[doorIdx] = roomId;
  world.zoneMap[doorIdx] = 0;
  world.aptMask[doorIdx] = 1;
  world.doors.set(doorIdx, { idx: doorIdx, state: DoorState.HERMETIC_OPEN, roomA: roomId, roomB: -1, keyId: '', timer: 0 });
  room.doors.push(doorIdx);

  const player = makeTestPlayer({
    id: 1,
    x: room.x + 1.5,
    y: room.y + 1.5,
    hp: 20,
    maxHp: 20,
    faction: Faction.PLAYER,
    rpg: { level: 1, xp: 0, attrPoints: 0, str: 0, agi: 0, int: 0, psi: 10, maxPsi: 10 },
  });
  return { world, entities: [player], player };
}

test('samosbor shelter failure records samosbor damage cause', () => {
  resetSamosborRuntimeForTests();
  const ctx = makeUnpreparedSamosborShelter();
  const state = makeGameState({ time: 33, tick: 101, currentFloor: FloorLevel.LIVING, samosborActive: true, samosborCount: 1 });

  resolvePlayerShelterAtSealForTests(ctx.world, ctx.entities, state, CLASSIC_TEST_VARIANT);

  assert.equal(ctx.player.hp, 16);
  assert.equal(state.lastDamage?.sourceKind, 'samosbor');
  assert.equal(formatLastPlayerDamageCause(state, 33), `${CLASSIC_VARIANT_DEF.displayName}: вне рабочей гермы: -4`);
});

test('toroidal edge projectile swept query finds player across wrap', () => {
  const index = new EntityIndex();
  const player = makeTestEntity({ id: 1, type: EntityType.NPC, persistentNpcId: 'player', x: 0.2, y: 32, hp: 100 });
  const projectile = makeTestEntity({
    id: 2,
    type: EntityType.PROJECTILE,
    x: W - 0.35,
    y: 32,
    vx: 12,
    vy: 0,
    projDmg: 10,
    ownerId: 99,
  });
  const farNpc = makeTestEntity({ id: 3, type: EntityType.NPC, x: W - 8, y: 32 });

  index.rebuild([player, projectile, farNpc]);

  const out: Entity[] = [];
  const nextX = (projectile.x + 0.8) % W;
  index.queryPathRadius(projectile.x, projectile.y, nextX, projectile.y, 0.6, out, ENTITY_MASK_ACTOR);

  assert.deepEqual(out.map(e => e.id), [1]);
});

test('hasFreshPlayerDamageRecord returns true for fresh damage within threshold', () => {
  const state = makeGameState({ time: 50.0, tick: 100 });
  recordPlayerDamage(state, undefined, 10, 'Тестовый урон');

  assert.equal(hasFreshPlayerDamageRecord(state, 100, 50.0), true);
  assert.equal(hasFreshPlayerDamageRecord(state, 100, 50.05), true);
  assert.equal(hasFreshPlayerDamageRecord(state, 100, 49.95), true);
});

test('hasFreshPlayerDamageRecord returns false if damage is outside threshold or tick differs', () => {
  const state = makeGameState({ time: 50.0, tick: 100 });
  recordPlayerDamage(state, undefined, 10, 'Тестовый урон');

  assert.equal(hasFreshPlayerDamageRecord(state, 100, 50.06), false);
  assert.equal(hasFreshPlayerDamageRecord(state, 100, 49.94), false);
  assert.equal(hasFreshPlayerDamageRecord(state, 101, 50.0), false);
});

test('hasFreshPlayerDamageRecord returns false if there is no damage record', () => {
  const state = makeGameState();
  assert.equal(hasFreshPlayerDamageRecord(state, 100, 50.0), false);
});

test('updateBlockCrushDamage damages player inside a solid cell and creates a record', () => {
  const world = new World();
  world.set(5, 5, Cell.WALL);
  const state = makeGameState({ time: 10, tick: 20 });
  const player = makeTestPlayer({ id: 1, x: 5.5, y: 5.5, hp: 20, maxHp: 20 });

  updateBlockCrushDamage(world, [player], state, 0.5);

  assert.equal(player.hp, 15); // 20 - (10 * 0.5)
  assert.equal(state.lastDamage?.sourceKind, 'hazard');
  assert.equal(state.lastDamage?.amount, 5);
  assert.equal(state.lastDamage?.detail, 'Раздавлен в структуре');
});

test('updateBlockCrushDamage does not damage player if phasing is active', () => {
  const world = new World();
  world.set(5, 5, Cell.WALL);
  const state = makeGameState({ time: 10, tick: 20 });
  const player = makeTestPlayer({ id: 1, x: 5.5, y: 5.5, hp: 20, maxHp: 20, phasing: true });

  updateBlockCrushDamage(world, [player], state, 0.5);

  assert.equal(player.hp, 20);
  assert.equal(state.lastDamage, undefined);
});

test('updateBlockCrushDamage damages and can kill NPCs/monsters inside a solid cell', () => {
  const world = new World();
  world.set(5, 5, Cell.WALL);
  const state = makeGameState({ time: 10, tick: 20 });
  const npc = makeTestNpc({ id: 2, x: 5.5, y: 5.5, hp: 4 });
  const monster = makeTestEntity({ id: 3, type: EntityType.MONSTER, x: 5.5, y: 5.5, hp: 6 });

  updateBlockCrushDamage(world, [npc, monster], state, 0.5);

  assert.equal(npc.hp, -1);
  assert.equal(npc.alive, false);
  assert.equal(monster.hp, 1);
  assert.equal(monster.alive, true);
});

test('updateBlockCrushDamage skips dead entities', () => {
  const world = new World();
  world.set(5, 5, Cell.WALL);
  const state = makeGameState({ time: 10, tick: 20 });
  const player = makeTestPlayer({ id: 1, x: 5.5, y: 5.5, hp: 0, maxHp: 20, alive: false });

  updateBlockCrushDamage(world, [player], state, 0.5);

  assert.equal(player.hp, 0);
  assert.equal(state.lastDamage, undefined);
});

test('updateBlockCrushDamage does not damage entities outside of solid cells', () => {
  const world = new World();
  world.set(5, 5, Cell.FLOOR);
  const state = makeGameState({ time: 10, tick: 20 });
  const player = makeTestPlayer({ id: 1, x: 5.5, y: 5.5, hp: 20, maxHp: 20 });

  updateBlockCrushDamage(world, [player], state, 0.5);

  assert.equal(player.hp, 20);
  assert.equal(state.lastDamage, undefined);
});

test('updateBlockCrushDamage skips LOZHNYY_DUKH if falsePhaseActive is > 0', () => {
  const world = new World();
  world.set(5, 5, Cell.WALL);
  const state = makeGameState({ time: 10, tick: 20 });
  const monster = makeTestEntity({ id: 3, type: EntityType.MONSTER, monsterKind: MonsterKind.LOZHNYY_DUKH, x: 5.5, y: 5.5, hp: 10, ai: { falsePhaseActive: 1 } as any });

  updateBlockCrushDamage(world, [monster], state, 0.5);

  assert.equal(monster.hp, 10);
});
