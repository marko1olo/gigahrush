import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { Cell, FloorLevel, RoomType, Tex, Faction, Feature } from '../src/core/types';
import { World } from '../src/core/world';
import {
  SEROBURMALINE_ROOM_PREFIX,
  SEROBURMALINE_ACTIVE_FEATURE,
  updateSeroburmalineExposure,
  getSeroburmalineHudFx,
} from '../src/systems/seroburmaline';
import { makeGameState, makeTestPlayer, addTestRoom } from './helpers';

function setupSeroburmalineScenario(playerFloor = FloorLevel.MAINTENANCE, x = 11.5, y = 11.5, angle = 0, pitch = 0) {
  const world = new World();
  const room = addTestRoom(world, {
    x: 10, y: 10, w: 5, h: 5,
    type: RoomType.SERVICE,
    name: `${SEROBURMALINE_ROOM_PREFIX} тестовая комната`,
    carve: true
  });

  // A source slot is typically at x + max(2, w - 6) and y + 2, y + max(2, h - 3)
  // Let's manually set a source feature on a known wall
  const wx = world.wrap(room.x + Math.max(2, room.w - 6));
  const wy = world.wrap(room.y + 2);
  const ci = world.idx(wx, wy);
  world.setFeatureAt(ci, SEROBURMALINE_ACTIVE_FEATURE);

  const state = makeGameState({ time: 10, tick: 30, currentFloor: playerFloor });
  const player = makeTestPlayer({
    id: 1, x, y, hp: 20, maxHp: 20, angle, pitch, faction: Faction.PLAYER, alive: true,
    rpg: { level: 1, xp: 0, attrPoints: 0, str: 0, agi: 0, int: 0, psi: 10, maxPsi: 10 }
  });

  return { world, state, player, sourcePos: { x: wx, y: wy } };
}

test('updateSeroburmalineExposure fades out when not on MAINTENANCE floor', () => {
  const { world, state, player, sourcePos } = setupSeroburmalineScenario(FloorLevel.MAINTENANCE);

  player.x = sourcePos.x - 2;
  player.y = sourcePos.y + 0.5;
  player.angle = 0;
  player.pitch = 0;

  // Artificially prime exposure
  updateSeroburmalineExposure(world, player, state, 1);
  assert.ok(getSeroburmalineHudFx(state)?.exposure! > 0, 'Initial exposure should be set');

  const initialExposure = getSeroburmalineHudFx(state)?.exposure!;

  // Now run on LIVING floor
  state.currentFloor = FloorLevel.LIVING;
  updateSeroburmalineExposure(world, player, state, 1);
  const currentExposure = getSeroburmalineHudFx(state)?.exposure ?? 0;

  assert.ok(currentExposure < initialExposure, 'Exposure should fade out on non-maintenance floors');
});

test('updateSeroburmalineExposure causes psi drop when looking at source', () => {
  const { world, state, player, sourcePos } = setupSeroburmalineScenario();

  // place player right in front of source looking at it
  player.x = sourcePos.x - 2;
  player.y = sourcePos.y + 0.5;
  player.angle = 0; // Look right (+X)
  player.pitch = 0; // Look straight

  const startPsi = player.rpg!.psi;

  // Need to accumulate some exposure to cross the 0.12 threshold for psi drop
  updateSeroburmalineExposure(world, player, state, 0.5); // dt = 0.5
  updateSeroburmalineExposure(world, player, state, 0.5); // dt = 0.5

  const hudFx = getSeroburmalineHudFx(state);
  assert.ok(hudFx?.looking, 'Player should be flagged as looking at source');
  assert.ok(hudFx!.exposure > 0.12, 'Exposure should be high enough to drain psi');
  assert.ok(player.rpg!.psi < startPsi, 'PSI should drain when looking at seroburmaline');
});

test('updateSeroburmalineExposure increases intensity but fades exposure when avoiding gaze', () => {
  const { world, state, player, sourcePos } = setupSeroburmalineScenario();

  // place player right in front of source but looking down
  player.x = sourcePos.x - 2;
  player.y = sourcePos.y + 0.5;
  player.angle = 0;
  player.pitch = -0.3; // Less than LOOK_DOWN_SAFE_PITCH (-0.22)

  updateSeroburmalineExposure(world, player, state, 1.0);

  const hudFx = getSeroburmalineHudFx(state);
  assert.ok(!hudFx?.looking, 'Player should NOT be flagged as looking at source');
  assert.equal(hudFx?.exposure ?? 0, 0, 'Exposure should be zero');
  assert.ok(hudFx!.intensity > 0.01, 'Intensity should be high from proximity');
  assert.ok(state.msgs.some(m => m.text.includes('Серобурмалин молчит: взгляд в пол.')), 'Should have avoid message');
});
