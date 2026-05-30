import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { Cell, EntityType, FloorLevel, LiftDirection, MonsterKind, RoomType, W } from '../src/core/types';
import { auditReachability } from '../src/core/world';
import { designFloorAtZ, designFloorById } from '../src/data/design_floors';
import { designFloorPopulationProfile } from '../src/data/design_floor_population';
import { ACTIVE_ACTOR_SOFT_LIMIT } from '../src/data/entity_limits';
import { PROCEDURAL_FLOOR_ZS, floorRunZAllowsNpcs } from '../src/data/procedural_floors';
import { generateDesignFloor } from '../src/gen/design_floors/manifest';
import {
  CANTOR_PUSTOTY_BASE_FLOOR,
  CANTOR_PUSTOTY_ROOM_NAMES,
  CANTOR_PUSTOTY_ROUTE_ID,
  CANTOR_PUSTOTY_Z,
  measureCantorPustotyMetrics,
} from '../src/gen/design_floors/cantor_pustoty';
import { getRouteCueMarkers } from '../src/systems/route_cues';

type CantorGeneration = ReturnType<typeof generateDesignFloor>;

let cached: CantorGeneration | undefined;

function cantor(): CantorGeneration {
  cached ??= generateDesignFloor(CANTOR_PUSTOTY_ROUTE_ID);
  return cached;
}

function reachableLift(gen: CantorGeneration, direction: LiftDirection): boolean {
  const audit = auditReachability(gen.world, gen.world.idx(Math.floor(gen.spawnX), Math.floor(gen.spawnY)));
  for (let i = 0; i < W * W; i++) {
    if (gen.world.cells[i] !== Cell.LIFT || gen.world.liftDir[i] !== direction) continue;
    const x = i % W;
    const y = (i / W) | 0;
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]] as const) {
      if (audit.reachable[gen.world.idx(x + dx, y + dy)]) return true;
    }
  }
  return false;
}

test('cantor_pustoty is registered as a late Void route floor', () => {
  const route = designFloorById(CANTOR_PUSTOTY_ROUTE_ID);
  assert.equal(route?.z, CANTOR_PUSTOTY_Z);
  assert.equal(route?.baseFloor, CANTOR_PUSTOTY_BASE_FLOOR);
  assert.equal(route?.baseFloor, FloorLevel.VOID);
  assert.equal(route?.displayName, 'Кантор пустоты');
  assert.equal(route?.danger, 5);
  assert.equal(designFloorAtZ(CANTOR_PUSTOTY_Z)?.id, CANTOR_PUSTOTY_ROUTE_ID);
  assert.equal(PROCEDURAL_FLOOR_ZS.includes(CANTOR_PUSTOTY_Z), false);
  assert.equal(floorRunZAllowsNpcs(CANTOR_PUSTOTY_Z), true);

  assert.ok(route);
  const profile = designFloorPopulationProfile(route);
  assert.equal(profile.npcTarget, 0);
  assert.equal(profile.monsterTarget, ACTIVE_ACTOR_SOFT_LIMIT);
  assert.equal(profile.monsterBiasKinds.includes(MonsterKind.LISHENNYY), true);
  assert.equal(profile.monsterTags.includes('gap_bridge'), true);
  assert.equal(profile.monsterTags.includes('dust_island'), true);
});

test('cantor_pustoty generates recursive gaps, repaired bridges, and reachable route anchors', () => {
  const gen = cantor();
  const metrics = measureCantorPustotyMetrics(gen);
  const spawnCell = gen.world.cells[gen.world.idx(Math.floor(gen.spawnX), Math.floor(gen.spawnY))];
  const roomNames = new Set(gen.world.rooms.map(room => room.name));

  assert.equal(spawnCell, Cell.FLOOR);
  assert.equal(reachableLift(gen, LiftDirection.UP), true);
  assert.equal(reachableLift(gen, LiftDirection.DOWN), true);
  assert.equal(metrics.ungatedUpLiftReachable, true);
  assert.equal(metrics.ungatedDownLiftReachable, true);
  assert.equal(metrics.recursionDepth, 4);
  assert.equal(metrics.componentCountBeforeBridge >= 5, true, `components ${metrics.componentCountBeforeBridge}`);
  assert.equal(metrics.largestComponentBeforeBridge >= 300, true, `largest ${metrics.largestComponentBeforeBridge}`);
  assert.equal(metrics.bridgedComponents >= 4, true, `bridged ${metrics.bridgedComponents}`);
  assert.equal(metrics.bridgeProxyCells >= 80, true, `bridge cells ${metrics.bridgeProxyCells}`);
  assert.equal(metrics.proxyOpenCells >= 1800, true, `proxy open ${metrics.proxyOpenCells}`);
  assert.equal(metrics.abyssCells >= 500_000, true, `abyss ${metrics.abyssCells}`);

  for (const name of Object.values(CANTOR_PUSTOTY_ROOM_NAMES)) {
    assert.equal(roomNames.has(name), true, name);
  }
});

test('cantor_pustoty exposes tool preparation, risky dust-island loot, and cue markers', () => {
  const gen = cantor();
  const metrics = measureCantorPustotyMetrics(gen);
  const cues = getRouteCueMarkers(gen.world);
  const npcs = gen.entities.filter(entity => entity.type === EntityType.NPC);
  const monsters = gen.entities.filter(entity => entity.type === EntityType.MONSTER);

  assert.equal(npcs.length, 0);
  assert.equal(monsters.some(entity => entity.monsterKind === MonsterKind.TONKAYA_TEN), true);
  assert.equal(monsters.some(entity => entity.monsterKind === MonsterKind.LISHENNYY), true);
  assert.equal(gen.world.rooms.some(room => room.type === RoomType.PRODUCTION && room.name === CANTOR_PUSTOTY_ROOM_NAMES.repair), true);
  assert.equal(metrics.stashIslandCount >= 3, true);
  assert.equal(metrics.reachableStashContainers >= 2, true);
  assert.equal(gen.world.containers.some(container =>
    container.tags.includes('gap_bridge') &&
    container.inventory.some(item => item.defId === 'metal_sheet' || item.defId === 'wrench')), true);
  assert.equal(gen.world.containers.some(container =>
    container.tags.includes('dust_island') &&
    container.inventory.some(item => item.defId === 'psi_dust')), true);
  assert.equal(cues.some(cue => cue.tags.includes('gap_bridge') && cue.tags.includes('cantor_pustoty')), true);
  assert.equal(cues.some(cue => cue.tags.includes('stash_island') && cue.tags.includes('cantor_pustoty')), true);
});
