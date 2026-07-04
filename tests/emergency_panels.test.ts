import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { World } from '../src/core/world';
import { addTestRoom, makeGameState, makeTestPlayer } from './helpers';
import { getEmergencyPanelMenuSnapshot, tryUseEmergencyPanel, closeEmergencyPanelMenu, registerEmergencyPanel } from '../src/systems/emergency_panels';

test('getEmergencyPanelMenuSnapshot returns null when menu is closed', () => {
    const player = makeTestPlayer();
    closeEmergencyPanelMenu();
    assert.equal(getEmergencyPanelMenuSnapshot(player), null);
});

test('getEmergencyPanelMenuSnapshot builds valid snapshot when panel exists and menu open', () => {
  const world = new World();
  const player = makeTestPlayer();
  const state = makeGameState();

  // Create a room with zone info to test subtitle logic
  const room = addTestRoom(world, { id: 1, x: 5, y: 5, w: 5, h: 5, name: 'Служебное помещение', zoneId: 1 });

  // Register a panel
  const panel = registerEmergencyPanel(world, 7, 7, 'panel_power');
  assert.ok(panel, 'Panel should be registered successfully');

  // Set panel's roomId explicitly because register doesn't set it (usually generation does)
  panel.roomId = room.id;

  // Try to open it
  const opened = tryUseEmergencyPanel(world, player, state, 7, 7);
  assert.ok(opened, 'Panel menu should be opened');

  // Get snapshot
  const snapshot = getEmergencyPanelMenuSnapshot(player);

  // Assertions
  assert.ok(snapshot !== null, 'Snapshot should not be null');
  assert.equal(snapshot.open, true);
  assert.equal(snapshot.title, 'Аварийный щиток света'); // Expected name from data for panel_power
  assert.equal(snapshot.subtitle, 'Служебное помещение');

  // Verify it contains options like "shut down", "repair", etc.
  assert.ok(snapshot.options.length > 0);
  assert.equal(snapshot.options.some(opt => opt.id === 'leave'), true);

  closeEmergencyPanelMenu();
});

test('getEmergencyPanelMenuSnapshot properly falls back to generic zone name if no room associated', () => {
  const world = new World();
  const player = makeTestPlayer();
  const state = makeGameState();

  world.cells[world.idx(15, 15)] = 0;
  const panel = registerEmergencyPanel(world, 15, 15, 'panel_power');
  assert.ok(panel, 'Panel should be registered successfully');
  panel.zoneId = 4; // Set a mock zoneId
  panel.roomId = -1; // No room

  tryUseEmergencyPanel(world, player, state, 15, 15);
  const snapshot = getEmergencyPanelMenuSnapshot(player);

  assert.ok(snapshot !== null, 'Snapshot should not be null');
  assert.equal(snapshot.subtitle, 'зона 5'); // panel.zoneId + 1 = 4 + 1

  closeEmergencyPanelMenu();
});

test('getEmergencyPanelMenuSnapshot handles invalid or destroyed panel mid-interaction', () => {
  const world = new World();
  const player = makeTestPlayer();
  const state = makeGameState();

  world.cells[world.idx(10, 10)] = 0;
  const panel = registerEmergencyPanel(world, 10, 10, 'panel_power');
  assert.ok(panel);

  tryUseEmergencyPanel(world, player, state, 10, 10);

  // Directly modify the panel state to simulate it being removed from the world while menu is open
  // This triggers the !panel condition
  const panelStatesMap = (world as any)._panelStates || new Map();
  // Depending on implementation, we can just delete it or hack menuState

  // Actually, we can just close it via getEmergencyPanelMenuSnapshot simulating the fail state
  // We'll mutate the panel's defId to trigger !def instead
  panel.defId = 'non_existent_panel' as any;

  const snapshot = getEmergencyPanelMenuSnapshot(player);
  assert.equal(snapshot, null, 'Should return null and close menu if def is missing');
  assert.equal(getEmergencyPanelMenuSnapshot(player), null, 'Menu should be closed after failure');
});

test('getEmergencyPanelMenuSnapshot selected option logic checks', () => {
  const world = new World();
  const player = makeTestPlayer();
  const state = makeGameState();
  world.cells[world.idx(12, 12)] = 0; // Cell.FLOOR

  const panel = registerEmergencyPanel(world, 12, 12, 'panel_power');
  assert.ok(panel);

  tryUseEmergencyPanel(world, player, state, 12, 12);

  let snapshot = getEmergencyPanelMenuSnapshot(player);
  assert.ok(snapshot);
  const maxSelected = snapshot.options.length - 1;
  assert.equal(snapshot.selected, 0, 'Should start at 0');

  closeEmergencyPanelMenu();
});
