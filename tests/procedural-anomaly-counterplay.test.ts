import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { Cell, Feature, LiftDirection, type World } from '../src/core/types';
import {
  makeProceduralFloorSpec,
  type FloorAnomalyId,
  type ProceduralFloorSpec,
} from '../src/data/procedural_floors';
import { generateProceduralFloor } from '../src/gen/procedural_floor';
import { getRouteCueMarkers } from '../src/systems/route_cues';
import {
  auditReachability,
  describeReachability,
  hasReachableAdjacentCell,
  type ReachabilityAudit,
} from '../src/core/world';

interface HeavyTopologyCase {
  id: Extract<FloorAnomalyId, 'wall_snake' | 'living_tunnels' | 'conway_life' | 'section_shift'>;
  controlFeature: Feature;
  roomPattern: RegExp;
}

const HEAVY_TOPOLOGY_CASES: readonly HeavyTopologyCase[] = [
  { id: 'wall_snake', controlFeature: Feature.SCREEN, roomPattern: /\[wall_snake:/ },
  { id: 'living_tunnels', controlFeature: Feature.APPARATUS, roomPattern: /\[living_tunnel:/ },
  { id: 'section_shift', controlFeature: Feature.APPARATUS, roomPattern: /\[section_shift:/ },
  { id: 'conway_life', controlFeature: Feature.APPARATUS, roomPattern: /^Игра жизнь:/ },
];

function forcedSpec(anomalyId: HeavyTopologyCase['id']): ProceduralFloorSpec {
  const base = makeProceduralFloorSpec(880, 9);
  return {
    ...base,
    anomalyId,
    danger: 5,
    title: `${anomalyId}: ${base.title}`,
  };
}

function assertReachableLift(world: World, audit: ReachabilityAudit, direction: LiftDirection, label: string): void {
  for (let i = 0; i < world.cells.length; i++) {
    if (world.cells[i] !== Cell.LIFT || world.liftDir[i] !== direction) continue;
    if (hasReachableAdjacentCell(world, audit, i)) return;
  }
  assert.fail(`${label}: no reachable ${LiftDirection[direction]} lift`);
}

function assertReachablePoint(world: World, audit: ReachabilityAudit, x: number, y: number, label: string): void {
  const idx = world.idx(Math.floor(x), Math.floor(y));
  assert.equal(audit.reachable[idx], 1, `${label}: ${describeReachability(audit, world, idx)}`);
}

for (const anomalyCase of HEAVY_TOPOLOGY_CASES) {
  test(`heavy topology anomaly ${anomalyCase.id} keeps route reachable and counterplay cued`, () => {
    const spec = forcedSpec(anomalyCase.id);
    const gen = generateProceduralFloor(spec);
    const world = gen.world;
    const spawnIdx = world.idx(Math.floor(gen.spawnX), Math.floor(gen.spawnY));
    const audit = auditReachability(world, spawnIdx);

    assertReachableLift(world, audit, LiftDirection.UP, anomalyCase.id);
    assertReachableLift(world, audit, LiftDirection.DOWN, anomalyCase.id);
    assert.equal(
      world.rooms.some(room => anomalyCase.roomPattern.test(room.name)),
      true,
      `${anomalyCase.id}: generation should leave a rebuildable room tag`,
    );
    assert.equal(
      world.features.some(feature => feature === anomalyCase.controlFeature),
      true,
      `${anomalyCase.id}: expected visible interaction affordance`,
    );

    const cue = getRouteCueMarkers(world).find(marker => marker.tags.includes(anomalyCase.id));
    assert.notEqual(cue, undefined, `${anomalyCase.id}: route cue should carry anomaly tag`);
    assert.equal(cue!.tags.includes('route_pressure'), true);
    assert.equal(cue!.label.length > 0 && cue!.hint.length > 0 && cue!.targetName.length > 0, true);
    assertReachablePoint(world, audit, cue!.x, cue!.y, `${anomalyCase.id}: route cue marker`);
    assertReachablePoint(world, audit, cue!.targetX, cue!.targetY, `${anomalyCase.id}: route cue target`);
  });
}
