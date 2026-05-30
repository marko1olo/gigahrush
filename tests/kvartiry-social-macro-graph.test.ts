import test from 'node:test';
import assert from 'node:assert/strict';

import { FloorLevel } from '../src/core/types';
import { generateFloor } from '../src/gen/floor_manifest';
import {
  getKvartirySocialMacroGraph,
  measureKvartiryArticulation,
} from '../src/gen/kvartiry/social_macro_graph';
import { getRouteCueMarkers } from '../src/systems/route_cues';
import { auditReachability, hasReachableAdjacentCell } from '../src/core/world';

let generated: ReturnType<typeof generateFloor> | null = null;

function kvartiry(): ReturnType<typeof generateFloor> {
  generated ??= generateFloor(FloorLevel.KVARTIRY, 20_260_530);
  return generated;
}

test('Kvartiry generation exposes a social macro graph with domain descriptors and route choices', () => {
  const gen = kvartiry();
  const graph = getKvartirySocialMacroGraph(gen.world);
  assert.ok(graph, 'Kvartiry macro graph should be registered on the generated world');

  const kinds = new Set(graph.nodes.map(node => node.kind));
  for (const kind of ['kitchen', 'water', 'ration', 'barricade', 'lift', 'print', 'apartment_cut'] as const) {
    assert.equal(kinds.has(kind), true, `missing ${kind} node`);
  }

  const routes = new Set(graph.edges.map(edge => edge.route));
  for (const route of ['crowd_route', 'apartment_cut', 'service_detour', 'risky_shortcut', 'lift_escape'] as const) {
    assert.equal(routes.has(route), true, `missing ${route} edge`);
  }

  assert.equal(graph.domains.length >= 3, true, 'Potts/Ising social domains should cover multiple factions');
  assert.equal(graph.domains.every(domain => domain.roomIds.length > 0 || domain.zoneIds.length > 0), true);
  assert.equal(graph.queueLoops >= 4, true, 'social anchors should receive braided queue loops');
  assert.equal(graph.apartmentCutDoors >= 1, true, 'apartment cut-through should open at least one extra door');

  const cueRoutes = new Set(
    getRouteCueMarkers(gen.world)
      .filter(cue => cue.tags.includes('social_macro'))
      .map(cue => cue.tags.find(tag => tag.endsWith('_route') || tag.endsWith('_cut') || tag.endsWith('_detour') || tag.endsWith('_shortcut') || tag.endsWith('_escape'))),
  );
  assert.equal(cueRoutes.has('crowd_route'), true);
  assert.equal(cueRoutes.has('apartment_cut'), true);
  assert.equal(cueRoutes.has('service_detour'), true);
  assert.equal(cueRoutes.has('risky_shortcut'), true);
});

test('Kvartiry social macro anchors stay reachable and do not leave large isolated regions', () => {
  const gen = kvartiry();
  const graph = getKvartirySocialMacroGraph(gen.world);
  assert.ok(graph);

  const startIdx = gen.world.idx(Math.floor(gen.spawnX), Math.floor(gen.spawnY));
  const audit = auditReachability(gen.world, startIdx);
  for (const node of graph.nodes) {
    const idx = gen.world.idx(Math.floor(node.accessX), Math.floor(node.accessY));
    assert.equal(
      !!audit.reachable[idx] || hasReachableAdjacentCell(gen.world, audit, idx),
      true,
      `${node.id} should be reachable from Kvartiry spawn`,
    );
  }

  const metric = measureKvartiryArticulation(gen.world, gen.spawnX, gen.spawnY);
  assert.equal(metric.largeIsolatedRegionCount, 0);
  assert.equal(metric.largeIsolatedRegionCells, 0);
  assert.equal(metric.largestRegionCells > 100_000, true);
  assert.equal(graph.articulation.largeIsolatedRegionCount, 0);
});
