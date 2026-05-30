import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { Cell, EntityType, FloorLevel, LiftDirection, MonsterKind, RoomType, W } from '../src/core/types';
import { designFloorAtZ, designFloorById } from '../src/data/design_floors';
import { designFloorPopulationProfile } from '../src/data/design_floor_population';
import { getEmergencyPanels } from '../src/systems/emergency_panels';
import { getRouteCueMarkers } from '../src/systems/route_cues';
import { generateDesignFloor } from '../src/gen/design_floors/manifest';
import {
  DESIGN_FLOOR_ID,
  SHAHTA_ATRIUM_ROUTE_Z,
  type ShahtaAtriumGeneration,
} from '../src/gen/design_floors/shahta_atrium';

const CX = W >> 1;
const CY = W >> 1;
const OUTER_R = 304;

let cachedGeneration: ShahtaAtriumGeneration | undefined;

function genShahta(): ShahtaAtriumGeneration {
  cachedGeneration ??= generateDesignFloor(DESIGN_FLOOR_ID) as ShahtaAtriumGeneration;
  return cachedGeneration;
}

function reachableWithBlockedRooms(
  gen: ShahtaAtriumGeneration,
  targetX: number,
  targetY: number,
  blockedRoomNames: readonly string[],
): boolean {
  const world = gen.world;
  const blockedRooms = new Set(world.rooms
    .filter(room => blockedRoomNames.some(name => room.name.includes(name)))
    .map(room => room.id));
  const start = world.idx(Math.floor(gen.spawnX), Math.floor(gen.spawnY));
  const target = world.idx(targetX, targetY);
  const reachable = new Uint8Array(W * W);
  const queue = new Int32Array(W * W);
  let head = 0;
  let tail = 0;
  reachable[start] = 1;
  queue[tail++] = start;
  while (head < tail) {
    const ci = queue[head++];
    if (ci === target) return true;
    const x = ci % W;
    const y = (ci / W) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const ni = world.idx(x + dx, y + dy);
      if (reachable[ni]) continue;
      if (blockedRooms.has(world.roomMap[ni])) continue;
      const cell = world.cells[ni];
      if (cell !== Cell.FLOOR && cell !== Cell.WATER && cell !== Cell.DOOR) continue;
      reachable[ni] = 1;
      queue[tail++] = ni;
    }
  }
  return false;
}

test('shahta atrium route registration and population profile expose the shaft stop', () => {
  const route = designFloorById(DESIGN_FLOOR_ID);
  assert.ok(route);
  assert.equal(route.z, SHAHTA_ATRIUM_ROUTE_Z);
  assert.equal(route.baseFloor, FloorLevel.MAINTENANCE);
  assert.equal(designFloorAtZ(SHAHTA_ATRIUM_ROUTE_Z)?.id, DESIGN_FLOOR_ID);

  const profile = designFloorPopulationProfile(route);
  assert.equal(profile.routeId, DESIGN_FLOOR_ID);
  assert.equal(profile.npcTarget >= 500 && profile.npcTarget <= 900, true);
  assert.equal(profile.monsterTarget >= 1800 && profile.monsterTarget <= 2400, true);
  assert.equal(profile.monsterBiasKinds.includes(MonsterKind.TRUBNYY_AVTOMAT), true);
  assert.equal(profile.monsterTags.includes('bridge'), true);
  assert.equal((profile.monsterPlacement.anchors?.length ?? 0) >= 5, true);
});

test('shahta atrium generation ships void, rings, bridges, service rim and repair cue', () => {
  const gen = genShahta();
  const state = gen.shahtaAtriumState;
  const cues = getRouteCueMarkers(gen.world);
  const panels = getEmergencyPanels(gen.world);
  const npcs = gen.entities.filter(entity => entity.type === EntityType.NPC);
  const monsters = gen.entities.filter(entity => entity.type === EntityType.MONSTER);

  assert.equal(state.routeId, DESIGN_FLOOR_ID);
  assert.equal(state.voidCells > 30_000, true, `void cells ${state.voidCells}`);
  assert.equal(state.ringCells > 45_000, true, `ring cells ${state.ringCells}`);
  assert.equal(state.bridgeCount >= 4, true);
  assert.equal(state.serviceBypassCells > 20_000, true);
  assert.equal(state.coverIslands >= 35, true, `cover islands ${state.coverIslands}`);
  assert.equal(state.losCoverScore > 0, true);
  assert.equal(state.bridges.some(bridge => bridge.repairable && bridge.gapCells > 0), true);

  let abyssCells = 0;
  for (const cell of gen.world.cells) if (cell === Cell.ABYSS) abyssCells++;
  assert.equal(abyssCells > 25_000, true, `runtime abyss cells ${abyssCells}`);

  assert.equal(cues.some(cue => cue.tags.includes('exposed')), true);
  assert.equal(cues.some(cue => cue.tags.includes('service_rim')), true);
  assert.equal(cues.some(cue => cue.tags.includes('repairable_bridge')), true);
  assert.equal(cues.some(cue => cue.tags.includes('los_cover_score')), true);
  assert.equal(panels.some(panel => panel.defId === 'panel_doors'), true);

  assert.equal(gen.world.rooms.some(room => room.name === 'Ремонтный пост перемычки' && room.type === RoomType.PRODUCTION), true);
  assert.equal(gen.world.containers.some(container => container.tags.includes('repairable_bridge')), true);
  assert.equal(npcs.length >= 500, true, `npc count ${npcs.length}`);
  assert.equal(monsters.length >= 1800, true, `monster count ${monsters.length}`);
});

test('shahta atrium keeps route anchors out of the abyss and preserves two crossing choices', () => {
  const gen = genShahta();
  const world = gen.world;
  const liftCells: number[] = [];
  for (let i = 0; i < world.cells.length; i++) if (world.cells[i] === Cell.LIFT) liftCells.push(i);
  assert.equal(liftCells.length >= 4, true);

  for (const idx of liftCells) {
    assert.notEqual(world.cells[idx], Cell.ABYSS);
    const x = idx % W;
    const y = (idx / W) | 0;
    const hasAdjacentFloor = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
      const cell = world.cells[world.idx(x + dx, y + dy)];
      return cell === Cell.FLOOR || cell === Cell.WATER;
    });
    assert.equal(hasAdjacentFloor, true, `lift at ${x},${y} must have an approach`);
  }

  const westExitX = CX - OUTER_R - 8;
  const westExitY = CY;
  assert.equal(
    reachableWithBlockedRooms(gen, westExitX, westExitY, ['Сервисный обод']),
    true,
    'bridge/ring route should reach the west side without the service rim',
  );
  assert.equal(
    reachableWithBlockedRooms(gen, westExitX, westExitY, ['Открытый мост запад-восток']),
    true,
    'service rim and alternate bridges should reach the west side without the fastest bridge',
  );
});
