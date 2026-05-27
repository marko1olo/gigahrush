import test from 'node:test';
import assert from 'node:assert/strict';

import { World } from '../src/core/world';
import {
  AIGoal,
  Cell,
  EntityType,
  Faction,
  FloorLevel,
  Occupation,
  type Entity,
  type GameState,
} from '../src/core/types';
import {
  assignPersistentAlifeNpcFromEntity,
  alifeForSave,
  captureAlifeFloorState,
  defaultAlifePopulation,
  getAlifeNpcTotalMoney,
  getAlifeLeaderboardSnapshot,
  materializeAlifeFloorPopulation,
  recordAlifeNpcDeath,
  setAlifeState,
} from '../src/systems/alife';
import { setFloorRunState } from '../src/systems/procedural_floors';
import { getFactionRel, initFactionRelations } from '../src/data/relations';
import { freshRPG, RPG_LEVEL_CAP } from '../src/systems/rpg';

function minimalState(): GameState {
  const state = { currentFloor: FloorLevel.LIVING } as GameState;
  setFloorRunState(state, { runSeed: 1 }, FloorLevel.LIVING);
  return state;
}

function restoreGlobalProperty(name: 'navigator' | 'performance' | 'window', descriptor: PropertyDescriptor | undefined): void {
  if (descriptor) Object.defineProperty(globalThis, name, descriptor);
  else delete (globalThis as Record<string, unknown>)[name];
}

function ambientTemplate(id: number, x: number, y: number): Entity {
  return {
    id,
    type: EntityType.NPC,
    x,
    y,
    angle: 0,
    pitch: 0,
    alive: true,
    speed: 1.2,
    sprite: Occupation.TRAVELER,
    name: `template ${id}`,
    hp: 10,
    maxHp: 10,
    ai: { goal: AIGoal.IDLE, tx: 0, ty: 0, path: [], pi: 0, stuck: 0, timer: 0 },
    faction: Faction.CITIZEN,
    occupation: Occupation.TRAVELER,
    isTraveler: true,
    questId: -1,
  };
}

test('A-Life default population is fixed when runtime memory is unknown', () => {
  assert.equal(defaultAlifePopulation(), 100_000);
});

test('A-Life mobile runtime keeps the same fixed population despite large memory hints', () => {
  const navigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  const performanceDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'performance');
  const windowDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'window');
  try {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {
        userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Mobile Safari/537.36',
        maxTouchPoints: 5,
        deviceMemory: 16,
      },
    });
    Object.defineProperty(globalThis, 'performance', {
      configurable: true,
      value: { memory: { jsHeapSizeLimit: 4 * 1024 * 1024 * 1024 } },
    });
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { innerWidth: 844, innerHeight: 390 },
    });

    assert.equal(defaultAlifePopulation(), 100_000);
  } finally {
    restoreGlobalProperty('navigator', navigatorDescriptor);
    restoreGlobalProperty('performance', performanceDescriptor);
    restoreGlobalProperty('window', windowDescriptor);
  }
});

test('A-Life materializes ambient slots and leaves killed slots empty', () => {
  initFactionRelations();
  const state = minimalState();
  setAlifeState(state, { seed: 12345, total: 100_000 });
  const world = new World();
  world.cells[world.idx(10, 10)] = Cell.FLOOR;
  world.cells[world.idx(11, 10)] = Cell.FLOOR;
  const entities = [ambientTemplate(1, 10.5, 10.5), ambientTemplate(2, 11.5, 10.5)];
  const nextId = { v: 3 };

  materializeAlifeFloorPopulation(state, world, entities, nextId, 'story:living');

  assert.equal(entities.length, 2);
  assert.equal(entities.every(entity => entity.alifeId !== undefined), true);
  const firstRelation = entities[0].playerRelation;
  assert.equal(typeof firstRelation, 'number');
  assert.ok(Math.abs((firstRelation ?? 0) - getFactionRel(entities[0].faction ?? Faction.CITIZEN, Faction.PLAYER)) <= 12);
  assert.equal(typeof entities[0].karma, 'number');
  assert.ok((entities[0].karma ?? 0) >= -128 && (entities[0].karma ?? 0) <= 128);
  const killedAlifeId = entities[0].alifeId;
  assert.ok(killedAlifeId);

  recordAlifeNpcDeath(state, entities[0]);

  const regenerated = [ambientTemplate(10, 10.5, 10.5), ambientTemplate(11, 11.5, 10.5)];
  materializeAlifeFloorPopulation(state, world, regenerated, { v: 20 }, 'story:living');

  assert.equal(regenerated.length, 1);
  assert.notEqual(regenerated[0].alifeId, killedAlifeId);
  assert.equal(regenerated[0].x, 11.5);
  assert.equal(alifeForSave(state).deadIds.includes(killedAlifeId), true);
});

test('event-created ordinary NPC receives persistent A-Life identity', () => {
  const state = minimalState();
  setAlifeState(state, { seed: 12345, total: 100_000 });
  const npc = ambientTemplate(50, 16.5, 16.5);
  npc.name = 'Новый жилец';
  npc.faction = Faction.SCIENTIST;
  npc.occupation = Occupation.SCIENTIST;
  npc.money = 77;
  npc.canGiveQuest = true;
  npc.rpg = freshRPG(12);
  npc.maxHp = 64;
  npc.hp = 64;
  const entities: Entity[] = [];

  assert.equal(assignPersistentAlifeNpcFromEntity(state, npc, entities), true);

  assert.equal(typeof npc.alifeId, 'number');
  assert.equal(npc.persistentNpcId, `alife:${npc.alifeId}`);
  const save = alifeForSave(state);
  const override = save.overrides.find(item => item.id === npc.alifeId);
  assert.ok(override);
  assert.equal(override.name, 'Новый жилец');
  assert.equal(override.faction, Faction.SCIENTIST);
  assert.equal(override.occupation, Occupation.SCIENTIST);
  assert.equal(override.canGiveQuest, true);
});

test('event-created ordinary NPC does not inherit an existing A-Life identity or death slot', () => {
  const state = minimalState();
  const alife = setAlifeState(state, { seed: 12345, total: 1_000 }) as {
    npcs: Array<{
      id: number;
      floorKey: string;
      playerRelation?: number;
      karma: number;
      kills?: number;
      npcKills?: number;
      dead?: boolean;
    }>;
    floorIndex: Record<string, number[]>;
  };
  const reserved = alife.npcs[0];
  reserved.floorKey = 'story:living';
  reserved.playerRelation = -88;
  reserved.karma = -123;
  reserved.kills = 17;
  reserved.npcKills = 9;
  alife.floorIndex['story:living'] = [0];

  const npc = ambientTemplate(60, 18.5, 18.5);
  npc.name = 'Прибытие без прошлого';
  npc.kills = undefined;
  npc.npcKills = undefined;
  npc.monsterKills = undefined;
  npc.playerRelation = undefined;
  npc.karma = undefined;

  assert.equal(assignPersistentAlifeNpcFromEntity(state, npc, []), true);

  assert.ok(npc.alifeId);
  assert.notEqual(npc.alifeId, reserved.id);
  assert.equal(reserved.playerRelation, -88);
  assert.equal(reserved.karma, -123);
  assert.equal(reserved.kills, 17);
  assert.equal(reserved.npcKills, 9);
  assert.notEqual(npc.playerRelation, -88);
  assert.notEqual(npc.karma, -123);
  assert.equal(npc.kills, 0);
  assert.equal(npc.npcKills, 0);

  recordAlifeNpcDeath(state, npc);
  const save = alifeForSave(state);
  assert.equal(save.deadIds.includes(npc.alifeId), true);
  assert.equal(save.deadIds.includes(reserved.id), false);
});

test('A-Life caps sanitized and saved dead ids', () => {
  const state = minimalState();
  const deadIds = Array.from({ length: 70_000 }, (_, index) => index + 1);
  const alife = setAlifeState(state, { seed: 12345, total: 100_000, deadIds }) as {
    npcs: Array<{ dead?: boolean }>;
  };

  assert.equal(alife.npcs.filter(npc => npc.dead).length, 65_536);
  const save = alifeForSave(state);
  assert.equal(save.deadIds.length, 65_536);
  assert.equal(save.deadIds[0], 1);
  assert.equal(save.deadIds[save.deadIds.length - 1], 65_536);
});

test('A-Life quest candidates are bounded instead of every persistent NPC offering work', () => {
  const state = minimalState();
  const alife = setAlifeState(state, { seed: 12345, total: 100_000 }) as {
    npcs: Array<{ canGiveQuest: boolean }>;
  };
  const candidates = alife.npcs.filter(npc => npc.canGiveQuest).length;

  assert.ok(candidates > 4_000, 'some persistent NPCs should be quest candidates');
  assert.ok(candidates < 24_000, 'dense floors should not make every persistent NPC a quest giver');
});

test('A-Life design-floor records use Floor 69 social population mix', () => {
  const state = minimalState();
  const alife = setAlifeState(state, { seed: 12345, total: 100_000 }) as {
    npcs: Array<{ floorKey: string; faction: Faction; occupation: Occupation }>;
  };
  const floor69 = alife.npcs.filter(npc => npc.floorKey === 'design:floor_69');
  const industrialTrades = floor69.filter(npc =>
    npc.occupation === Occupation.ELECTRICIAN ||
    npc.occupation === Occupation.TURNER,
  );

  assert.ok(floor69.length > 1000, 'floor_69 should receive a dense A-Life allocation');
  assert.equal(floor69.some(npc => npc.occupation === Occupation.CHILD), false);
  assert.ok(floor69.some(npc => npc.faction === Faction.LIQUIDATOR), 'floor_69 should include guard/liquidator records');
  assert.ok(floor69.some(npc => npc.occupation === Occupation.DOCTOR), 'floor_69 should include clinic records');
  assert.ok(floor69.some(npc => npc.occupation === Occupation.SECRETARY || npc.occupation === Occupation.STOREKEEPER), 'floor_69 should include staff/accounting records');
  assert.ok(industrialTrades.length < floor69.length * 0.05, 'floor_69 should not inherit the generic Maintenance worker mix');
});

test('A-Life generation keeps broad level and account wealth tails bounded', () => {
  const state = minimalState();
  const alife = setAlifeState(state, { seed: 12345, total: 100_000 }) as {
    npcs: Array<{ level: number; money: number; accountRubles: number }>;
  };
  const lowLevel = alife.npcs.filter(npc => npc.level <= 10).length;
  const maxLevel = Math.max(...alife.npcs.map(npc => npc.level));
  const millionaires = alife.npcs.filter(npc => npc.money + npc.accountRubles >= 1_000_000).length;
  const richPocket = Math.max(...alife.npcs.map(npc => npc.money));

  assert.ok(lowLevel > 50_000, 'most generated NPCs should stay in levels 1-10');
  assert.equal(maxLevel, 100);
  assert.ok(millionaires > 0 && millionaires < 10, 'procedural millionaires should exist but stay rare');
  assert.ok(richPocket <= 2_000, 'generated NPC cash stays pocket-sized while accountRubles carries wealth');
});

test('A-Life materialization preserves template sprite identity for special floors', () => {
  const state = minimalState();
  setAlifeState(state, { seed: 12345, total: 100_000 });
  const world = new World();
  world.cells[world.idx(12, 10)] = Cell.FLOOR;
  const template = ambientTemplate(1, 12.5, 10.5);
  template.sprite = 777;
  template.name = 'Особый шаблон';
  template.isFemale = true;
  template.occupation = Occupation.SECRETARY;
  template.faction = Faction.SCIENTIST;
  template.isTraveler = false;
  template.assignedRoomId = 42;
  template.ai = { goal: AIGoal.WANDER, tx: 12, ty: 10, path: [{ x: 12, y: 10 }], pi: 0, stuck: 2, timer: 3 };
  const entities = [template];

  materializeAlifeFloorPopulation(state, world, entities, { v: 2 }, 'story:living');

  assert.equal(entities.length, 1);
  assert.equal(entities[0].sprite, 777);
  assert.equal(entities[0].name, 'Особый шаблон');
  assert.equal(entities[0].isFemale, true);
  assert.equal(entities[0].occupation, Occupation.SECRETARY);
  assert.equal(entities[0].faction, Faction.SCIENTIST);
  assert.equal(typeof entities[0].spriteSeed, 'number');
  assert.equal(typeof entities[0].canGiveQuest, 'boolean');
  assert.equal(entities[0].isTraveler, false);
  assert.equal(entities[0].assignedRoomId, 42);
  assert.equal(entities[0].ai?.goal, AIGoal.WANDER);
  assert.equal(entities[0].ai?.path.length, 0);
});

test('A-Life materializes cash and account wealth as separate NPC fields', () => {
  const state = minimalState();
  const alife = setAlifeState(state, { seed: 12345, total: 100_000, overrides: [{ id: 1, money: 640, accountRubles: 999_360 }] }) as {
    floorIndex: Record<string, number[]>;
  };
  alife.floorIndex['story:living'] = [0];
  const world = new World();
  world.cells[world.idx(12, 10)] = Cell.FLOOR;
  const entities = [ambientTemplate(1, 12.5, 10.5)];

  materializeAlifeFloorPopulation(state, world, entities, { v: 2 }, 'story:living');

  assert.equal(entities.length, 1);
  assert.equal(entities[0].money, 640);
  assert.equal(entities[0].accountRubles, 999_360);
  assert.equal(getAlifeNpcTotalMoney(state, entities[0]), 1_000_000);
  assert.equal(alifeForSave(state).overrides.some(item =>
    item.id === 1 &&
    item.money === 640 &&
    item.accountRubles === 999_360,
  ), true);
});

test('A-Life restored floor entities preserve account wealth on capture', () => {
  const state = minimalState();
  const alife = setAlifeState(state, { seed: 12345, total: 100_000, overrides: [{ id: 1, money: 640, accountRubles: 999_360 }] }) as {
    floorIndex: Record<string, number[]>;
  };
  alife.floorIndex['story:living'] = [0];
  const world = new World();
  world.cells[world.idx(12, 10)] = Cell.FLOOR;
  const restored = ambientTemplate(1, 12.5, 10.5);
  restored.alifeId = 1;
  restored.persistentNpcId = 'alife:1';
  restored.money = 640;
  const entities = [restored];

  materializeAlifeFloorPopulation(state, world, entities, { v: 2 }, 'story:living');
  captureAlifeFloorState(state, entities);

  assert.equal(alifeForSave(state).overrides.some(item =>
    item.id === 1 &&
    item.money === 640 &&
    item.accountRubles === 999_360,
  ), true);
});

test('A-Life leaderboard includes the player as a ranked actor', () => {
  const state = minimalState();
  setAlifeState(state, { seed: 12345, total: 1_000 });
  const player: Entity = {
    id: 0,
    type: EntityType.PLAYER,
    x: 0,
    y: 0,
    angle: 0,
    pitch: 0,
    alive: true,
    speed: 3,
    sprite: 0,
    name: 'Жилец',
    faction: Faction.PLAYER,
    playerRelation: 100,
    karma: 0,
    kills: 300,
    npcKills: 120,
    monsterKills: 180,
    money: 10_000,
    rpg: freshRPG(RPG_LEVEL_CAP),
  };

  const snapshot = getAlifeLeaderboardSnapshot(state, player, 100);

  assert.equal(snapshot.totalAlive, 100_001);
  assert.ok(snapshot.player.rank <= 100);
  assert.equal(snapshot.entries.some(entry => entry.player), true);
});

test('A-Life leaderboard cache respects requested limits', () => {
  const state = minimalState();
  setAlifeState(state, { seed: 12345, total: 1_000 });
  const player: Entity = {
    id: 0,
    type: EntityType.PLAYER,
    x: 0,
    y: 0,
    angle: 0,
    pitch: 0,
    alive: true,
    speed: 1,
    sprite: 0,
    name: 'Вы',
    faction: Faction.PLAYER,
  };

  assert.equal(getAlifeLeaderboardSnapshot(state, player, 5).entries.length, 5);
  assert.equal(getAlifeLeaderboardSnapshot(state, player, 10).entries.length, 10);
});
