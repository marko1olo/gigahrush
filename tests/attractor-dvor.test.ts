import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import {
  Cell,
  EntityType,
  Faction,
  FloorLevel,
  MonsterKind,
  Occupation,
  RoomType,
  ZoneFaction,
} from '../src/core/types';
import { designFloorAtZ, designFloorById } from '../src/data/design_floors';
import { designFloorPopulationProfile } from '../src/data/design_floor_population';
import { generateDesignFloor } from '../src/gen/design_floors/manifest';
import {
  ATTRACTOR_DVOR_BASE_FLOOR,
  ATTRACTOR_DVOR_ROOM_NAMES,
  ATTRACTOR_DVOR_ROUTE_ID,
  ATTRACTOR_DVOR_Z,
  getAttractorDvorState,
} from '../src/gen/design_floors/attractor_dvor';
import { getEmergencyPanels } from '../src/systems/emergency_panels';
import { getRouteCueMarkers } from '../src/systems/route_cues';
import { assertReachableRouteLifts, reachableCells } from './generator_helpers';

let cachedGeneration: ReturnType<typeof generateDesignFloor> | undefined;

function generatedAttractorDvor(): ReturnType<typeof generateDesignFloor> {
  cachedGeneration ??= generateDesignFloor(ATTRACTOR_DVOR_ROUTE_ID);
  return cachedGeneration;
}

function weightOf<T>(items: readonly { value: T; weight: number }[], value: T): number {
  return items.find(item => item.value === value)?.weight ?? 0;
}

test('attractor_dvor is registered as a maintenance authored route floor', () => {
  const route = designFloorById(ATTRACTOR_DVOR_ROUTE_ID);
  assert.ok(route);
  assert.equal(route.z, ATTRACTOR_DVOR_Z);
  assert.equal(route.baseFloor, ATTRACTOR_DVOR_BASE_FLOOR);
  assert.equal(route.baseFloor, FloorLevel.MAINTENANCE);
  assert.equal(route.displayName, 'Аттракторный двор');
  assert.equal(route.danger, 4);
  assert.equal(designFloorAtZ(ATTRACTOR_DVOR_Z)?.id, ATTRACTOR_DVOR_ROUTE_ID);
});

test('attractor_dvor population profile favors liquidator flow crews and industrial monsters', () => {
  const route = designFloorById(ATTRACTOR_DVOR_ROUTE_ID);
  assert.ok(route);
  const profile = designFloorPopulationProfile(route);

  assert.equal(profile.routeId, ATTRACTOR_DVOR_ROUTE_ID);
  assert.equal(profile.npcTarget >= 500 && profile.npcTarget <= 700, true, `npc target ${profile.npcTarget}`);
  assert.equal(profile.monsterTarget >= 1800 && profile.monsterTarget <= 2300, true, `monster target ${profile.monsterTarget}`);
  assert.equal(profile.npcNoun, 'дежурный потока');
  assert.equal(weightOf(profile.npcFactions, Faction.LIQUIDATOR) > weightOf(profile.npcFactions, Faction.WILD), true);
  assert.equal(weightOf(profile.npcOccupations, Occupation.ELECTRICIAN) > weightOf(profile.npcOccupations, Occupation.TRAVELER), true);
  assert.equal(profile.monsterBiasKinds.includes(MonsterKind.TUBE_EEL), true);
  assert.equal(profile.monsterBiasKinds.includes(MonsterKind.TRUBNYY_AVTOMAT), true);
  assert.equal(profile.monsterTags.includes('flow'), true);
  assert.equal(profile.monsterTags.includes('dead_zone'), true);
  assert.equal((profile.monsterPlacement.anchors?.length ?? 0) >= 5, true);
});

test('attractor_dvor exposes flow streamlines, local switches, patrol loop and route cues', () => {
  const gen = generatedAttractorDvor();
  const state = getAttractorDvorState(gen.world);
  assert.ok(state);

  const reachable = assertReachableRouteLifts(gen, ATTRACTOR_DVOR_ROUTE_ID);
  const cueTags = new Set(getRouteCueMarkers(gen.world).flatMap(cue => cue.tags));
  const panels = getEmergencyPanels(gen.world);
  const panelDefs = new Set(panels.map(panel => panel.defId));

  assert.equal(state.routeId, ATTRACTOR_DVOR_ROUTE_ID);
  assert.deepEqual(state.streamlines.map(flow => flow.id).sort(), ['dead_cut', 'main_stream', 'return_stream']);
  assert.equal(state.streamlines.every(flow => flow.points.length >= 6 && flow.cellCount > 200), true);
  assert.deepEqual(state.switchPanels.map(panel => panel.parameter).sort(), ['curl', 'damping', 'phase']);
  assert.equal(state.patrolLoops.some(loop => loop.guardCount === 4 && loop.roomNames.length === 4), true);
  assert.equal(panelDefs.has('panel_doors'), true);
  assert.equal(panelDefs.has('panel_vent'), true);
  assert.equal(panelDefs.has('panel_power'), true);

  for (const tag of ['main_stream', 'dead_zone', 'shortcut', 'patrol_loop', 'switch', 'prediction']) {
    assert.equal(cueTags.has(tag), true, `missing cue tag ${tag}`);
  }

  for (const panel of panels) {
    assert.equal(reachable[panel.idx], 1, `panel ${panel.defId} should be reachable`);
    assert.equal(panel.roomId >= 0, true, `panel ${panel.defId} room`);
    assert.equal(panel.zoneId >= 0, true, `panel ${panel.defId} zone`);
  }
});

test('attractor_dvor ships the dead-zone cut, transit cache and pressure actors', () => {
  const gen = generatedAttractorDvor();
  const reachable = reachableCells(gen);
  const rooms = new Set(gen.world.rooms.map(room => room.name));
  const npcs = gen.entities.filter(entity => entity.type === EntityType.NPC);
  const monsters = gen.entities.filter(entity => entity.type === EntityType.MONSTER);
  const deadZone = gen.world.rooms.find(room => room.name === ATTRACTOR_DVOR_ROOM_NAMES.deadZone);

  assert.ok(deadZone);
  assert.equal(deadZone.type, RoomType.STORAGE);
  assert.equal(rooms.has(ATTRACTOR_DVOR_ROOM_NAMES.pumpCore), true);
  assert.equal(rooms.has(ATTRACTOR_DVOR_ROOM_NAMES.transitCache), true);
  assert.equal(gen.world.containers.some(container => container.tags.includes('dead_zone') && container.tags.includes('shortcut')), true);
  assert.equal(gen.world.containers.some(container => container.tags.includes('transit_cache') && container.access === 'locked'), true);
  assert.equal(npcs.length >= 500, true, `npc count ${npcs.length}`);
  assert.equal(monsters.length >= 1800, true, `monster count ${monsters.length}`);
  assert.equal(monsters.some(entity => entity.monsterKind === MonsterKind.TUBE_EEL), true);
  assert.equal(monsters.some(entity => entity.monsterKind === MonsterKind.TRUBNYY_AVTOMAT), true);
  assert.equal(gen.world.zones.some(zone => zone.faction === ZoneFaction.SAMOSBOR && zone.level >= 5), true);

  let reachableWater = 0;
  for (let i = 0; i < gen.world.cells.length; i++) {
    if (reachable[i] && gen.world.cells[i] === Cell.WATER) reachableWater++;
  }
  assert.equal(reachableWater > 40, true, `reachable water cells ${reachableWater}`);
});
