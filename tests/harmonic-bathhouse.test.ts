import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { Cell, EntityType, Faction, FloorLevel, MonsterKind, Occupation, RoomType, type Entity } from '../src/core/types';
import { designFloorById } from '../src/data/design_floors';
import { designFloorPopulationProfile } from '../src/data/design_floor_population';
import { generateDesignFloor } from '../src/gen/design_floors/manifest';
import type { HarmonicBathhouseGeneration } from '../src/gen/design_floors/harmonic_bathhouse';
import { getCellHazardMoveMultiplier } from '../src/systems/cell_hazards';
import { getEmergencyPanels } from '../src/systems/emergency_panels';
import { getRouteCueMarkers } from '../src/systems/route_cues';

function weightOf<T>(items: readonly { value: T; weight: number }[], value: T): number {
  return items.find(item => item.value === value)?.weight ?? 0;
}

function hasSlowHazardNear(gen: HarmonicBathhouseGeneration, x: number, y: number, radius: number): boolean {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const px = Math.floor(x + dx);
      const py = Math.floor(y + dy);
      const entity = { id: -770, type: EntityType.NPC, x: px + 0.5, y: py + 0.5 } as Entity;
      if (getCellHazardMoveMultiplier(gen.world, entity) < 1) return true;
    }
  }
  return false;
}

test('harmonic bathhouse route data and population profile match the pressure bathhouse brief', () => {
  const route = designFloorById('harmonic_bathhouse');
  assert.ok(route);
  assert.equal(route.z, -28);
  assert.equal(route.baseFloor, FloorLevel.MAINTENANCE);
  assert.equal(route.danger, 4);

  const profile = designFloorPopulationProfile(route);
  assert.equal(profile.npcTarget >= 500 && profile.npcTarget <= 1000, true, `npc target ${profile.npcTarget}`);
  assert.equal(profile.monsterTarget >= 1500 && profile.monsterTarget <= 2300, true, `monster target ${profile.monsterTarget}`);
  assert.equal(weightOf(profile.npcFactions, Faction.LIQUIDATOR) > weightOf(profile.npcFactions, Faction.WILD), true);
  assert.equal(weightOf(profile.npcOccupations, Occupation.MECHANIC) > weightOf(profile.npcOccupations, Occupation.DOCTOR), true);
  assert.equal(profile.monsterBiasKinds.includes(MonsterKind.TUMANNIK), true);
  assert.equal(profile.monsterBiasKinds.includes(MonsterKind.VODYANOY_KOSHMAR), true);
});

test('harmonic bathhouse generation exposes valve, hot path, cold bypass and repair decisions', () => {
  const gen = generateDesignFloor('harmonic_bathhouse') as HarmonicBathhouseGeneration;
  const state = gen.bathhouseState;

  assert.equal(state.routeId, 'harmonic_bathhouse');
  assert.deepEqual(
    state.decisions.map(decision => decision.id).sort(),
    ['cold_flooded_bypass', 'hot_fast_path', 'repair_pressure_route', 'turn_valve'],
  );
  assert.equal(state.bands.hotFogCells >= 900, true, `hot fog cells ${state.bands.hotFogCells}`);
  assert.equal(state.bands.coldWaterCells >= 650, true, `cold water cells ${state.bands.coldWaterCells}`);
  assert.equal(state.bands.pressureCells >= 250, true, `pressure cells ${state.bands.pressureCells}`);

  const panels = getEmergencyPanels(gen.world);
  const panelDefs = new Set(panels.map(panel => panel.defId));
  for (const defId of ['panel_power', 'panel_water', 'panel_doors', 'panel_vent'] as const) {
    assert.equal(panelDefs.has(defId), true, `missing ${defId}`);
  }

  const cues = getRouteCueMarkers(gen.world);
  for (const tag of ['turn_valve', 'hot_fast_path', 'cold_flooded_bypass', 'repair_pressure_route']) {
    assert.equal(cues.some(cue => cue.tags.includes(tag)), true, `missing cue ${tag}`);
  }
  assert.equal(cues.every(cue => cue.routeGroup?.decision), true);

  const hot = state.decisions.find(decision => decision.id === 'hot_fast_path');
  const cold = state.decisions.find(decision => decision.id === 'cold_flooded_bypass');
  assert.ok(hot);
  assert.ok(cold);
  assert.equal(hasSlowHazardNear(gen, hot.x, hot.y, 58), true, 'missing hot steam hazard');
  assert.equal(hasSlowHazardNear(gen, cold.x, cold.y, 58), true, 'missing cold flood hazard');

  const waterCells = gen.world.cells.reduce((count, cell) => count + (cell === Cell.WATER ? 1 : 0), 0);
  const fogCells = gen.world.fog.reduce((count, fog) => count + (fog > 0 ? 1 : 0), 0);
  assert.equal(waterCells >= 650, true, `water cells ${waterCells}`);
  assert.equal(fogCells >= 1200, true, `fog cells ${fogCells}`);
  assert.equal(gen.world.rooms.some(room => room.type === RoomType.BATHROOM && room.name.includes('Гармоническая купель')), true);
  assert.equal(gen.world.containers.some(container => container.tags.includes('repair_pressure_route')), true);
  assert.equal(gen.world.containers.some(container => container.tags.includes('hot_fast_path')), true);
});
