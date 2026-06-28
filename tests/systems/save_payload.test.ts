import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { buildSavePayload, summarizeSavePayload, createPortalCompactSavePayload } from '../../src/systems/save_payload';
import { makeGameState, makeTestPlayer, makeTestContainer } from '../helpers';
import { FloorLevel } from '../../src/core/types';

test('buildSavePayload constructs valid save payload with all required fields', () => {
  const player = makeTestPlayer({
    x: 10,
    y: 20,
    angle: 90,
    hp: 80,
    maxHp: 100,
    money: 50,
    age: 25,
    sex: 'male',
    isFemale: false,
    needs: { sleep: 1, food: 2, water: 3, energy: 4, morale: 5, health: 6, toilet: 7, warmth: 8, hygiene: 9 },
    inventory: [{ defId: 'item1', count: 1 } as any],
    statuses: [],
    karma: 10,
    kills: 5,
    npcKills: 2,
    monsterKills: 3,
  });

  const state = makeGameState({
    currentFloor: FloorLevel.LIVING,
    time: 12345,
    tick: 67890,
    quests: [],
    samosborActive: true,
    samosborCount: 2,
    samosborTimer: 100,
    nextQuestId: 10,
  });

  const containers = [
    makeTestContainer({
      id: 1,
      name: 'Container 1',
      x: 5,
      y: 5,
      inventory: [{ defId: 'item2', count: 2 } as any],
      tags: ['tag1'],
      ownerName: 'Owner',
      stolenItemIds: ['item2'],
    })
  ];

  const payload = buildSavePayload({
    player,
    state,
    containers,
    sections: {
      floorRun: { someRunData: true },
      floorInstances: { instances: [] },
      voidReturnPortal: { portal: true },
      voidEntryFromFloor: 1,
      liftArachna: { arachna: true },
      pseudolift: { pseudolift: true },
      floorMemory: { memory: true },
      alife: { alife: true },
      alifeMobility: { mobility: true },
      computers: { computers: [] },
      netHack: { hack: true },
      netTerminalGen: { terminal: true },
      mapEditorPatches: { patches: [] },
      worldEvents: { events: [] },
      crafting: { crafting: true },
      demosSocial: { social: true },
      economy: { economy: true },
      banking: { banking: true },
      stockMarket: { stock: true },
      production: [],
    },
  });

  assert.equal(payload.player.x, 10);
  assert.equal(payload.player.y, 20);
  assert.equal(payload.player.angle, 90);
  assert.equal(payload.player.hp, 80);
  assert.equal(payload.player.maxHp, 100);
  assert.deepEqual(payload.player.needs, { sleep: 1, food: 2, water: 3, energy: 4, morale: 5, health: 6, toilet: 7, warmth: 8, hygiene: 9 });
  assert.equal(payload.player.inventory?.length, 1);
  assert.equal(payload.player.inventory?.[0].defId, 'item1');
  assert.equal(payload.player.money, 50);
  assert.equal(payload.player.age, 25);
  assert.equal(payload.player.sex, 'male');
  assert.equal(payload.player.karma, 10);
  assert.equal(payload.player.kills, 5);
  assert.equal(payload.player.npcKills, 2);
  assert.equal(payload.player.monsterKills, 3);

  assert.equal(payload.state.time, 12345);
  assert.equal(payload.state.tick, 67890);
  assert.equal(payload.state.currentFloor, FloorLevel.LIVING);
  assert.equal(payload.state.samosborActive, true);
  assert.equal(payload.state.samosborCount, 2);
  assert.equal(payload.state.samosborTimer, 100);
  assert.equal(payload.state.nextQuestId, 10);

  assert.deepEqual(payload.state.floorRun, { someRunData: true });
  assert.deepEqual(payload.state.floorInstances, { instances: [] });
  assert.deepEqual(payload.state.voidReturnPortal, { portal: true });
  assert.equal(payload.state.voidEntryFromFloor, 1);
  assert.deepEqual(payload.state.liftArachna, { arachna: true });
  assert.deepEqual(payload.state.pseudolift, { pseudolift: true });
  assert.deepEqual(payload.state.floorMemory, { memory: true });
  assert.deepEqual(payload.state.alife, { alife: true });
  assert.deepEqual(payload.state.alifeMobility, { mobility: true });
  assert.deepEqual(payload.state.computers, { computers: [] });
  assert.deepEqual(payload.state.netHack, { hack: true });
  assert.deepEqual(payload.state.netTerminalGen, { terminal: true });
  assert.deepEqual(payload.state.mapEditorPatches, { patches: [] });
  assert.deepEqual(payload.state.worldEvents, { events: [] });
  assert.deepEqual(payload.state.crafting, { crafting: true });
  assert.deepEqual(payload.state.demosSocial, { social: true });
  assert.deepEqual(payload.state.economy, { economy: true });
  assert.deepEqual(payload.state.banking, { banking: true });
  assert.deepEqual(payload.state.stockMarket, { stock: true });

  assert.equal(payload.state.containers.length, 1);
  assert.equal(payload.state.containers[0].name, 'Container 1');
  assert.equal(payload.state.containers[0].x, 5);
  assert.equal(payload.state.containers[0].y, 5);
  assert.equal(payload.state.containers[0].inventory.length, 1);
  assert.equal(payload.state.containers[0].inventory[0].defId, 'item2');
  assert.deepEqual(payload.state.containers[0].tags, ['tag1']);
  assert.equal(payload.state.containers[0].ownerName, 'Owner');
  assert.deepEqual(payload.state.containers[0].stolenItemIds, ['item2']);
});

test('buildSavePayload correctly handles optional player properties', () => {
  const player = makeTestPlayer({
    x: 10,
    y: 20,
    angle: 90,
    hp: 80,
    maxHp: 100,
    money: 50,
    age: 25,
    sex: 'male',
    isFemale: false,
    needs: undefined,
    inventory: undefined,
    rpg: undefined,
    weapon: undefined,
    tool: undefined,
  });

  const state = makeGameState({
    currentFloor: FloorLevel.LIVING,
    time: 12345,
    tick: 67890,
    quests: [],
    samosborActive: true,
    samosborCount: 2,
    samosborTimer: 100,
    nextQuestId: 10,
  });

  const payload = buildSavePayload({
    player,
    state,
    containers: [],
    sections: {
      floorRun: { someRunData: true },
      floorInstances: { instances: [] },
      voidReturnPortal: { portal: true },
      voidEntryFromFloor: 1,
      liftArachna: { arachna: true },
      pseudolift: { pseudolift: true },
      floorMemory: { memory: true },
      alife: { alife: true },
      alifeMobility: { mobility: true },
      computers: { computers: [] },
      netHack: { hack: true },
      netTerminalGen: { terminal: true },
      mapEditorPatches: { patches: [] },
      worldEvents: { events: [] },
      crafting: { crafting: true },
      demosSocial: { social: true },
      economy: { economy: true },
      banking: { banking: true },
      stockMarket: { stock: true },
      production: [],
    },
  });

  assert.equal(payload.player.needs, undefined);
  assert.deepEqual(payload.player.inventory, []);
  assert.equal(payload.player.rpg, undefined);
  assert.equal(payload.player.weapon, undefined);
  assert.equal(payload.player.tool, undefined);
});

test('summarizeSavePayload computes correct summary', () => {
  const player = makeTestPlayer({
    x: 10,
    y: 20,
    angle: 90,
    hp: 80,
    maxHp: 100,
    money: 50,
    age: 25,
    sex: 'male',
    isFemale: false,
    needs: { sleep: 1, food: 2, water: 3, energy: 4, morale: 5, health: 6, toilet: 7, warmth: 8, hygiene: 9 },
    inventory: [{ defId: 'item1', count: 1 } as any, { defId: 'item2', count: 2 } as any],
    statuses: [],
    karma: 10,
    kills: 5,
    npcKills: 2,
    monsterKills: 3,
  });

  const state = makeGameState({
    currentFloor: FloorLevel.LIVING,
    time: 12345,
    tick: 67890,
    quests: [{ id: 'quest1', state: 'active', desc: 'desc', giverName: 'giver', steps: [] } as any],
    samosborActive: true,
    samosborCount: 2,
    samosborTimer: 100,
    nextQuestId: 10,
  });

  const containers = [
    makeTestContainer({
      id: 1,
      name: 'Container 1',
      x: 5,
      y: 5,
      inventory: [{ defId: 'item2', count: 2 } as any],
      tags: ['tag1'],
      ownerName: 'Owner',
      stolenItemIds: ['item2'],
    })
  ];

  const payload = buildSavePayload({
    player,
    state,
    containers,
    sections: {
      floorRun: { someRunData: true },
      floorInstances: { instances: [] },
      voidReturnPortal: { portal: true },
      voidEntryFromFloor: 1,
      liftArachna: { arachna: true },
      pseudolift: { pseudolift: true },
      floorMemory: { memory: true },
      alife: { alife: true },
      alifeMobility: { mobility: true },
      computers: { computers: [] },
      netHack: { hack: true },
      netTerminalGen: { terminal: true },
      mapEditorPatches: { patches: { patch1: { ops: [1, 2, 3] } } },
      worldEvents: { recentEvents: { count: 1 }, importantEvents: { count: 2 }, facts: [1, 2, 3] },
      crafting: { crafting: true },
      demosSocial: { social: true },
      economy: { economy: true },
      banking: { banking: true },
      stockMarket: { stock: true },
      production: [],
    },
  });


  const summary = summarizeSavePayload(payload, { liveEntityCount: 42 });

  assert.equal(typeof summary.bytes, 'number');
  assert.equal(summary.bytes > 0, true);
  assert.equal(summary.liveEntityCount, 42);
  assert.equal(summary.serializedEntities, false);
  assert.equal(summary.sections.length > 0, true);

  const playerSection = summary.sections.find((s: any) => s.label === 'player');
  assert.equal(playerSection.count, 2); // inventory length

  const questsSection = summary.sections.find((s: any) => s.label === 'quests');
  assert.equal(questsSection.count, 1);

  const eventsSection = summary.sections.find((s: any) => s.label === 'events');
  assert.equal(eventsSection.count, 6); // 1 + 2 + 3

  const mapEditorSection = summary.sections.find((s: any) => s.label === 'mapEditor');
  assert.equal(mapEditorSection.count, 3); // ops length

  const containersSection = summary.sections.find((s: any) => s.label === 'containers');
  assert.equal(containersSection.count, 1);

  const productionSection = summary.sections.find((s: any) => s.label === 'production');
  assert.equal(productionSection.count, 0);
});

test('createPortalCompactSavePayload compacts correctly', () => {
  const player = makeTestPlayer({
    inventory: [{ defId: 'item1', count: 1 } as any],
    statuses: [],
  });

  const state = makeGameState({
    quests: Array(100).fill(null).map((_, i) => ({ id: `q${i}`, state: 'active', desc: 'desc', giverName: 'giver', steps: [] } as any)),
    samosborActive: true,
    floorRun: { runSeed: 123, currentZ: 5, visited: { a: true, b: false, c: true }, extra: 'dropme' },
    alife: { version: 1, seed: 42, total: 10, playerRelationTargetFaction: 1, deadIds: ['d1', 'd2'], extra: 'dropme' },
    banking: { recentLedger: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
    stockMarket: { recentTrades: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
    production: Array(20).fill(null).map((_, i) => ({ id: `p${i}` } as any)),
    currentFloor: FloorLevel.LIVING,
  });

  const payload = buildSavePayload({
    player,
    state,
    containers: Array(20).fill(null).map((_, i) => makeTestContainer({ id: i, tags: [] })),
    sections: {
      floorRun: state.floorRun,
      floorInstances: {},
      alife: state.alife,
      alifeMobility: { m: 1 },
      mapEditorPatches: { p: 1 },
      worldEvents: { w: 1 },
      demosSocial: { d: 1 },
      crafting: {},
      banking: state.banking,
      stockMarket: state.stockMarket,
      production: state.production,
      liftArachna: {},
      pseudolift: {},
      floorMemory: { version: 2, entries: [{}] },
    },
  });

  (payload as any).version = 5;


  const compact = createPortalCompactSavePayload(payload);

  assert.equal((compact as any).version, 5);
  assert.equal(compact.state.samosborActive, false);
  assert.equal(compact.state.quests.length, 64); // PORTAL_COMPACT_QUEST_CAP

  assert.deepEqual(compact.state.floorRun, { runSeed: 123, currentZ: 5, visited: { a: true, c: true } });
  assert.deepEqual(compact.state.floorMemory, { version: 1, entries: [] });
  assert.deepEqual(compact.state.alife, { version: 1, seed: 42, total: 10, playerRelationTargetFaction: 1, playerRelationTargetAlifeId: undefined, deadIds: ['d1', 'd2'], deadPlotNpcIds: [], overrides: [] });
  assert.equal(compact.state.alifeMobility, undefined);
  assert.equal(compact.state.mapEditorPatches, undefined);
  assert.equal(compact.state.worldEvents, undefined);
  assert.equal(compact.state.demosSocial, undefined);
  assert.equal(compact.state.voidReturnPortal, undefined);
  assert.equal(compact.state.voidEntryFromFloor, undefined);

  assert.equal((compact.state.banking as any).recentLedger.length, 6);
  assert.equal((compact.state.banking as any).recentLedger[0], 4);

  assert.equal((compact.state.stockMarket as any).recentTrades.length, 6);
  assert.equal((compact.state.stockMarket as any).recentTrades[0], 4);

  assert.equal(compact.state.production.length, 0); // PORTAL_COMPACT_PRODUCTION_CAP
  assert.equal(compact.state.containers.length, 16); // PORTAL_COMPACT_CONTAINER_CAP
});
