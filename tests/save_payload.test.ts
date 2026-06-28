import test from 'node:test';
import assert from 'node:assert/strict';
import { createPortalCompactSavePayload } from '../src/systems/save_payload';

test('createPortalCompactSavePayload handles undefined state elements', () => {
  const mockPayload = {
    version: 42,
    player: {
      inventory: [],
      statuses: [],
    },
    state: {
      samosborActive: true,
      quests: [],
      floorRun: { runSeed: 123, currentZ: 5, visited: { 'a': true } },
      floorMemory: { version: 1, entries: [{ id: 'test' }] },
      alife: { version: 1, seed: 1, total: 10, deadIds: [], deadPlotNpcIds: [], overrides: [] },
      alifeMobility: { someMobility: true },
      mapEditorPatches: { patch: true },
      worldEvents: { recentEvents: { count: 1 } },
      demosSocial: { data: true },
      banking: { recentLedger: [] },
      stockMarket: { recentTrades: [] },
      production: [],
      containers: [],
      voidReturnPortal: { x: 10, y: 10 },
      voidEntryFromFloor: 2,
    },
  };

  const compacted = createPortalCompactSavePayload(mockPayload as any);

  assert.equal(compacted.state.samosborActive, false);
  assert.equal(compacted.state.alifeMobility, undefined);
  assert.equal(compacted.state.mapEditorPatches, undefined);
  assert.equal(compacted.state.worldEvents, undefined);
  assert.equal(compacted.state.demosSocial, undefined);
  assert.equal(compacted.state.voidReturnPortal, undefined);
  assert.equal(compacted.state.voidEntryFromFloor, undefined);
  assert.deepEqual(compacted.state.floorMemory, { version: 1, entries: [] });
});

test('createPortalCompactSavePayload caps arrays properly', () => {
  const quests = Array.from({ length: 100 }, (_, i) => ({ id: `q${i}`, desc: 'd', giverName: 'g' }));
  const production = Array.from({ length: 30 }, (_, i) => ({ kind: 'kind', count: 1 }));
  const containers = Array.from({ length: 30 }, (_, i) => ({ tags: [], name: 'n', inventory: [], x: 0, y: 0 }));

  const mockPayload = {
    version: 1,
    player: {
      inventory: [],
      statuses: [],
    },
    state: {
      quests,
      floorRun: null,
      alife: null,
      banking: null,
      stockMarket: null,
      production,
      containers,
    },
  };

  const compacted = createPortalCompactSavePayload(mockPayload as any);

  assert.equal(compacted.state.quests.length, 64);
  assert.equal(compacted.state.quests[0].id, 'q36'); // slices from the end (-PORTAL_COMPACT_QUEST_CAP)

  assert.equal(compacted.state.production.length, 16);
  assert.equal(compacted.state.production[0].kind, 'kind'); // slices from the start (0, PORTAL_COMPACT_PRODUCTION_CAP)

  assert.equal(compacted.state.containers.length, 16); // uses PORTAL_COMPACT_CONTAINER_CAP
});

test('compactFloorRunForPortal compacts correctly', () => {
  const visited: Record<string, true> = {};
  for (let i = 0; i < 200; i++) {
    visited[`cell_${i}`] = true;
  }
  // Also add some boolean false/invalid keys to check filtering
  visited['ignored'] = false as unknown as true;

  const mockPayload = {
    version: 1,
    player: { inventory: [], statuses: [] },
    state: {
      quests: [],
      production: [],
      containers: [],
      floorRun: {
        runSeed: 42,
        currentZ: 10,
        visited,
      },
      alife: null,
      banking: null,
      stockMarket: null,
    },
  };

  const compacted = createPortalCompactSavePayload(mockPayload as any);

  const floorRun: any = compacted.state.floorRun;
  assert.equal(floorRun.runSeed, 42);
  assert.equal(floorRun.currentZ, 10);
  assert.equal(Object.keys(floorRun.visited).length, 128); // 128 limit cap
  assert.equal(floorRun.visited['ignored'], undefined);
});

test('compactFloorRunForPortal handles non-record input safely', () => {
  const mockPayload = {
    version: 1,
    player: { inventory: [], statuses: [] },
    state: {
      quests: [],
      production: [],
      containers: [],
      floorRun: "invalid_string",
      alife: null,
      banking: null,
      stockMarket: null,
    },
  };
  const compacted = createPortalCompactSavePayload(mockPayload as any);
  assert.equal(compacted.state.floorRun, undefined);
});

test('compactAlifeForPortal compacts correctly', () => {
  const deadIds = Array.from({ length: 2000 }, (_, i) => `dead_${i}`);
  const deadPlotNpcIds = Array.from({ length: 300 }, (_, i) => `plot_${i}`);
  const overrides = Array.from({ length: 100 }, (_, i) => ({ id: `over_${i}` }));

  const mockPayload = {
    version: 1,
    player: { inventory: [], statuses: [] },
    state: {
      quests: [],
      production: [],
      containers: [],
      floorRun: null,
      alife: {
        version: 2,
        seed: 99,
        total: 50,
        playerRelationTargetFaction: 'A',
        playerRelationTargetAlifeId: 'B',
        deadIds,
        deadPlotNpcIds,
        overrides,
      },
      banking: null,
      stockMarket: null,
    },
  };

  const compacted = createPortalCompactSavePayload(mockPayload as any);

  const alife: any = compacted.state.alife;
  assert.equal(alife.version, 2);
  assert.equal(alife.seed, 99);
  assert.equal(alife.total, 50);
  assert.equal(alife.playerRelationTargetFaction, 'A');
  assert.equal(alife.playerRelationTargetAlifeId, 'B');
  assert.equal(alife.deadIds.length, 1024); // PORTAL_COMPACT_ALIFE_DEAD_ID_CAP
  assert.equal(alife.deadPlotNpcIds.length, 128); // PORTAL_COMPACT_ALIFE_PLOT_DEATH_CAP
  assert.equal(alife.overrides.length, 64); // PORTAL_COMPACT_ALIFE_OVERRIDE_CAP
});

test('compactAlifeForPortal handles non-record input safely', () => {
  const mockPayload = {
    version: 1,
    player: { inventory: [], statuses: [] },
    state: {
      quests: [],
      production: [],
      containers: [],
      floorRun: null,
      alife: ["invalid_array"],
      banking: null,
      stockMarket: null,
    },
  };
  const compacted = createPortalCompactSavePayload(mockPayload as any);
  assert.equal(compacted.state.alife, undefined);
});

test('compactAlifeForPortal handles non-array deadIds/deadPlotNpcIds/overrides', () => {
  const mockPayload = {
    version: 1,
    player: { inventory: [], statuses: [] },
    state: {
      quests: [],
      production: [],
      containers: [],
      floorRun: null,
      alife: {
        deadIds: "string",
        deadPlotNpcIds: {},
        overrides: 123,
      },
      banking: null,
      stockMarket: null,
    },
  };

  const compacted = createPortalCompactSavePayload(mockPayload as any);
  const alife: any = compacted.state.alife;
  assert.deepEqual(alife.deadIds, []);
  assert.deepEqual(alife.deadPlotNpcIds, []);
  assert.deepEqual(alife.overrides, []);
});

test('compactBankingForPortal and compactStockMarketForPortal compact correctly', () => {
  const recentLedger = Array.from({ length: 20 }, (_, i) => ({ amount: i }));
  const recentTrades = Array.from({ length: 20 }, (_, i) => ({ tradeId: i }));

  const mockPayload = {
    version: 1,
    player: { inventory: [], statuses: [] },
    state: {
      quests: [],
      production: [],
      containers: [],
      floorRun: null,
      alife: null,
      banking: { balance: 100, recentLedger },
      stockMarket: { prices: {}, recentTrades },
    },
  };

  const compacted = createPortalCompactSavePayload(mockPayload as any);

  const banking: any = compacted.state.banking;
  assert.equal(banking.balance, 100);
  assert.equal(banking.recentLedger.length, 6);
  assert.equal(banking.recentLedger[0].amount, 14); // Slices last 6

  const stockMarket: any = compacted.state.stockMarket;
  assert.equal(stockMarket.recentTrades.length, 6);
  assert.equal(stockMarket.recentTrades[0].tradeId, 14); // Slices last 6
});

test('compactBankingForPortal and compactStockMarketForPortal handle non-records and non-arrays safely', () => {
  const mockPayload = {
    version: 1,
    player: { inventory: [], statuses: [] },
    state: {
      quests: [],
      production: [],
      containers: [],
      floorRun: null,
      alife: null,
      banking: "string",
      stockMarket: { recentTrades: "string" },
    },
  };

  const compacted = createPortalCompactSavePayload(mockPayload as any);

  assert.equal(compacted.state.banking, "string");
  const stockMarket: any = compacted.state.stockMarket;
  assert.deepEqual(stockMarket.recentTrades, []);
});

test('compactBooleanRecord skips non-true values and empty keys', () => {
  const mockPayload = {
    version: 1,
    player: { inventory: [], statuses: [] },
    state: {
      quests: [],
      production: [],
      containers: [],
      floorRun: {
        runSeed: 42,
        currentZ: 10,
        visited: {
          'valid_key': true,
          'false_key': false,
          '': true,
          [ 'a'.repeat(100) ]: true, // Keys longer than 96 should be sliced
        },
      },
      alife: null,
      banking: null,
      stockMarket: null,
    },
  };

  const compacted = createPortalCompactSavePayload(mockPayload as any);
  const floorRun: any = compacted.state.floorRun;

  assert.equal(floorRun.visited['valid_key'], true);
  assert.equal(floorRun.visited['false_key'], undefined);
  assert.equal(floorRun.visited[''], undefined);
  // Key should be sliced to 96 chars
  assert.equal(floorRun.visited['a'.repeat(96)], true);
});

test('inventoryForSave handles undefined and valid inventory limits', () => {
  const inventory = Array.from({ length: 50 }, (_, i) => ({ defId: `item_${i}`, count: 1 }));

  const mockPayload = {
    version: 1,
    player: {
      inventory, // will be sliced to SAVE_PLAYER_INVENTORY_CAP
      statuses: undefined,
    },
    state: {
      quests: [], production: [], containers: [],
      floorRun: null, alife: null, banking: null, stockMarket: null,
    },
  };

  const compacted = createPortalCompactSavePayload(mockPayload as any);
  assert.equal(compacted.player.inventory?.length, 50); // The limit SAVE_PLAYER_INVENTORY_CAP is MAX_INVENTORY_SLOTS which is 1 << 6 = 64. So length 50 is fully retained. // MAX_INVENTORY_SLOTS is usually 48, assuming so based on the test
  assert.equal(compacted.player.statuses, undefined);
});

test('statusesForSave handles statuses correctly', () => {
  const statuses = Array.from({ length: 20 }, (_, i) => ({
    id: `status_${i}`,
    source: 'test',
    startedAt: 100,
    expiresAt: 200,
    intensity: i,
    badReaction: true,
  }));
  // Push invalid numeric data
  statuses.push({
    id: 'status_invalid',
    source: 'test',
    startedAt: NaN,
    expiresAt: Infinity,
    intensity: NaN,
    badReaction: false,
  });

  const mockPayload = {
    version: 1,
    player: {
      inventory: [],
      statuses, // will be sliced to SAVE_STATUS_CAP
    },
    state: {
      quests: [], production: [], containers: [],
      floorRun: null, alife: null, banking: null, stockMarket: null,
    },
  };

  const compacted = createPortalCompactSavePayload(mockPayload as any);
  assert.equal(compacted.player.statuses?.length, 12); // SAVE_STATUS_CAP is 12

  // The last pushed item was the invalid one, so let's verify that one
  const lastStatus = compacted.player.statuses![11];
  assert.equal(lastStatus.id, 'status_invalid');
  assert.equal(lastStatus.startedAt, 0); // NaN replaced with 0
  assert.equal(lastStatus.expiresAt, 0); // Infinity replaced with 0
  assert.equal(lastStatus.intensity, 0); // NaN replaced with 0
  assert.equal(lastStatus.badReaction, undefined); // false replaced with undefined
});
