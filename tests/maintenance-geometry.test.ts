import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { Cell, FloorLevel } from '../src/core/types';
import { generateFloor } from '../src/gen/floor_manifest';
import { getEmergencyPanels } from '../src/systems/emergency_panels';
import { assertReachableRouteLifts } from './generator_helpers';

test('maintenance macro geometry exposes wet, dry, duct, panel and repair route choices', () => {
  const gen = generateFloor(FloorLevel.MAINTENANCE);
  const reachable = assertReachableRouteLifts(gen, 'maintenance story floor');

  const requiredRooms = [
    'Главная насосная: сухой остров',
    'Затопленный бассейн: сухие кромки',
    'Дренажное поле: сухие рейки',
    'Сервисный воздуховод: сухой обход',
    'Щитовая хорда: водяной байпас',
    'Ремонтная обходная хорда: сухой склад',
  ];
  for (const name of requiredRooms) {
    const room = gen.world.rooms.find(candidate => candidate?.name === name);
    assert.ok(room, `${name} should be generated`);
    const ci = gen.world.idx(room.x + Math.floor(room.w / 2), room.y + Math.floor(room.h / 2));
    assert.equal(reachable[ci], 1, `${name} should be reachable from spawn`);
  }

  const panels = getEmergencyPanels(gen.world);
  const panelDefs = new Set(panels.map(panel => panel.defId));
  for (const id of ['panel_power', 'panel_water', 'panel_doors', 'panel_vent']) {
    assert.equal(panelDefs.has(id), true, `${id} should be available on the maintenance panel chord`);
  }
  for (const panel of panels) {
    assert.equal(reachable[panel.idx], 1, `${panel.defId} should be reachable`);
    assert.equal(panel.roomId >= 0, true, `${panel.defId} should be inside a room`);
  }

  let reachableWater = 0;
  let reachableDry = 0;
  for (let i = 0; i < gen.world.cells.length; i++) {
    if (!reachable[i]) continue;
    if (gen.world.cells[i] === Cell.WATER) reachableWater++;
    else if (gen.world.cells[i] === Cell.FLOOR) reachableDry++;
  }
  assert.equal(reachableWater >= 900, true, 'wet shortcut network should be substantial');
  assert.equal(reachableDry >= 18_000, true, 'dry long-path network should remain substantial');
});
