import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { auditReachability } from '../src/core/world';
import { Cell, EntityType, Feature, FloorLevel, LiftDirection, MonsterKind, Occupation, RoomType, W } from '../src/core/types';
import { designFloorAtZ, designFloorById } from '../src/data/design_floors';
import { designFloorPopulationProfile } from '../src/data/design_floor_population';
import { PROCEDURAL_FLOOR_ZS } from '../src/data/procedural_floors';
import { SIDE_QUESTS } from '../src/data/plot';
import { generateDesignFloor } from '../src/gen/design_floors/manifest';
import {
  SPECTRAL_CHASOVNYA_BASE_FLOOR,
  SPECTRAL_CHASOVNYA_ROOM_NAMES,
  SPECTRAL_CHASOVNYA_ROUTE_ID,
  SPECTRAL_CHASOVNYA_Z,
  getSpectralChasovnyaState,
  ringSpectralChasovnyaBell,
  type SpectralChasovnyaGeneration,
} from '../src/gen/design_floors/spectral_chasovnya';
import { getRecentNoiseRecords } from '../src/systems/noise';
import { getRecentEvents } from '../src/systems/events';
import { findInteractionTarget, activateInteraction } from '../src/systems/interactions';
import { getRouteCueMarkers, routeCueCount } from '../src/systems/route_cues';
import { makeGameState, makeTestPlayer } from './helpers';

let cachedGeneration: SpectralChasovnyaGeneration | undefined;

function spectralGen(): SpectralChasovnyaGeneration {
  cachedGeneration ??= generateDesignFloor(SPECTRAL_CHASOVNYA_ROUTE_ID) as SpectralChasovnyaGeneration;
  return cachedGeneration;
}

function reachableRoomCells(gen: SpectralChasovnyaGeneration, roomName: string): number {
  const room = gen.world.rooms.find(candidate => candidate.name === roomName);
  assert.ok(room, `missing room ${roomName}`);
  const audit = auditReachability(gen.world, gen.world.idx(Math.floor(gen.spawnX), Math.floor(gen.spawnY)));
  let cells = 0;
  for (let i = 0; i < gen.world.cells.length; i++) {
    if (gen.world.roomMap[i] === room.id && audit.reachable[i]) cells++;
  }
  return cells;
}

function hasReachableLift(gen: SpectralChasovnyaGeneration, direction: LiftDirection): boolean {
  const audit = auditReachability(gen.world, gen.world.idx(Math.floor(gen.spawnX), Math.floor(gen.spawnY)));
  for (let i = 0; i < gen.world.cells.length; i++) {
    if (gen.world.cells[i] !== Cell.LIFT || gen.world.liftDir[i] !== direction) continue;
    const x = i % W;
    const y = (i / W) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      if (audit.reachable[gen.world.idx(x + dx, y + dy)]) return true;
    }
  }
  return false;
}

test('spectral_chasovnya is registered as a Hell-band authored sound route', () => {
  const route = designFloorById(SPECTRAL_CHASOVNYA_ROUTE_ID);

  assert.equal(route?.z, SPECTRAL_CHASOVNYA_Z);
  assert.equal(route?.baseFloor, SPECTRAL_CHASOVNYA_BASE_FLOOR);
  assert.equal(route?.baseFloor, FloorLevel.HELL);
  assert.equal(route?.displayName, 'Спектральная часовня');
  assert.equal(designFloorAtZ(SPECTRAL_CHASOVNYA_Z)?.id, SPECTRAL_CHASOVNYA_ROUTE_ID);
  assert.equal(PROCEDURAL_FLOOR_ZS.includes(SPECTRAL_CHASOVNYA_Z), false);
});

test('spectral_chasovnya population profile favors cult listeners and sound-focused monsters', () => {
  const route = designFloorById(SPECTRAL_CHASOVNYA_ROUTE_ID);
  assert.ok(route);
  const profile = designFloorPopulationProfile(route);

  assert.equal(profile.npcTarget, 180);
  assert.equal(profile.monsterTarget, 3916);
  assert.equal(profile.npcNoun, 'слушатель');
  assert.equal(profile.npcOccupations.some(entry => entry.value === Occupation.PRIEST && entry.weight >= 30), true);
  assert.equal(profile.monsterBiasKinds.includes(MonsterKind.SLEPOGLAZ), true);
  assert.equal(profile.monsterBiasKinds.includes(MonsterKind.TUMANNIK), true);
  assert.equal(profile.monsterTags.includes('sound'), true);
  assert.equal(profile.monsterTags.includes('bell'), true);
  assert.equal((profile.monsterPlacement.roomWeights?.[RoomType.COMMON] ?? 0) > 1.5, true);
  assert.equal((profile.monsterPlacement.anchors?.length ?? 0) >= 4, true);
});

test('spectral_chasovnya exposes standing waves, shadows, bells and reachable exits', () => {
  const gen = spectralGen();
  const state = getSpectralChasovnyaState(gen.world);
  const questIds = new Set(SIDE_QUESTS.map(quest => quest.id));

  assert.equal(state, gen.spectralState);
  assert.equal(gen.spectralState.standingWaveRooms.length, 4);
  assert.equal(gen.spectralState.shadowZones.length, 3);
  assert.equal(gen.spectralState.bellNodes.length, 2);
  assert.equal(gen.spectralState.acousticBands.length, 3);
  assert.equal(routeCueCount(gen.world) >= 4, true);
  assert.equal(getRouteCueMarkers(gen.world).some(cue => cue.tags.includes('sound_bait')), true);
  assert.equal(hasReachableLift(gen, LiftDirection.UP), true);
  assert.equal(hasReachableLift(gen, LiftDirection.DOWN), true);

  for (const name of [
    SPECTRAL_CHASOVNYA_ROOM_NAMES.bellCage,
    SPECTRAL_CHASOVNYA_ROOM_NAMES.radioSacristy,
    SPECTRAL_CHASOVNYA_ROOM_NAMES.quietSouth,
    SPECTRAL_CHASOVNYA_ROOM_NAMES.focusArch,
    SPECTRAL_CHASOVNYA_ROOM_NAMES.exit,
  ]) {
    assert.equal(reachableRoomCells(gen, name) > 0, true, name);
  }

  const mainBell = gen.spectralState.bellNodes[0];
  assert.equal(gen.world.features[gen.world.idx(Math.floor(mainBell.x), Math.floor(mainBell.y))], Feature.APPARATUS);
  assert.equal(gen.entities.some(entity => entity.type === EntityType.NPC && entity.plotNpcId === 'spectral_bellwarden_miron'), true);
  assert.equal(gen.entities.some(entity => entity.type === EntityType.MONSTER && entity.monsterKind === MonsterKind.SLEPOGLAZ), true);
  assert.equal(gen.entities.some(entity => entity.type === EntityType.MONSTER && entity.monsterKind === MonsterKind.TUMANNIK), true);
  assert.equal(gen.world.containers.some(container => container.tags.includes('spectral_chasovnya') && container.tags.includes('hearing_boost')), true);
  assert.equal(questIds.has('spectral_tune_radio_sacristy'), true);
});

test('spectral_chasovnya bell interaction publishes a bounded sound bait pulse', () => {
  const gen = spectralGen();
  const node = gen.spectralState.bellNodes[0];
  const player = makeTestPlayer({ id: 9001, x: node.x + 1, y: node.y, angle: Math.PI });
  const state = makeGameState({ currentFloor: FloorLevel.HELL, time: 10 });
  const target = findInteractionTarget({
    world: gen.world,
    state,
    player,
    entities: gen.entities,
    nextEntityId: { v: 10000 },
    lookX: node.x,
    lookY: node.y,
  });

  assert.equal(target?.defId, 'spectral_chasovnya_bell');
  const result = activateInteraction({
    world: gen.world,
    state,
    player,
    entities: gen.entities,
    nextEntityId: { v: 10000 },
    lookX: node.x,
    lookY: node.y,
  });

  assert.equal(result.handled, true);
  assert.equal(ringSpectralChasovnyaBell(gen.world, state, player, gen.entities, 'missing_node'), false);
  assert.equal(gen.spectralState.rungBellNodeIds.includes(node.id), true);
  const noise = getRecentNoiseRecords(state, { floor: FloorLevel.HELL, source: 'siren', minSeverity: 4, limit: 1 })[0];
  assert.ok(noise);
  assert.equal(noise.tags.includes('spectral_chasovnya'), true);
  assert.equal(noise.radius <= 48, true);
  const event = getRecentEvents(state, { type: 'monster_bait_placed', tags: ['spectral_chasovnya'], limit: 1 })[0];
  assert.ok(event);
  assert.equal(event.data?.routeId, SPECTRAL_CHASOVNYA_ROUTE_ID);
});
