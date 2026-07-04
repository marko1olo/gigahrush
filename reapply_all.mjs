import fs from 'fs';

// 1. patch items.ts
let content = fs.readFileSync('src/data/items.ts', 'utf-8');

const missingTags = `  concrete_rubble: ['resource', 'construction', 'rubble'],
  brick_pieces: ['resource', 'construction', 'rubble'],
  rebar_piece: ['resource', 'construction', 'metal'],
  pipe_fragment: ['resource', 'construction', 'metal', 'pipe'],
  metal_scrap: ['resource', 'construction', 'metal'],
  raw_meat: ['resource', 'organic', 'meat'],
  electronics: ['resource', 'electronics'],`;

if (!content.includes('concrete_rubble: [')) {
    content = content.replace(
        "export const ITEM_TAGS: Record<string, readonly string[]> = {",
        "export const ITEM_TAGS: Record<string, readonly string[]> = {\n" + missingTags
    );
}

const missingItems = `  concrete_rubble:{ id:'concrete_rubble', name:'Кусок бетона', type:ItemType.MISC, desc:'Кусок бетонной стены. Тяжелый и бесполезный, если только не кинуть в кого-нибудь.', spawnRooms:[], spawnW:0, value:1, tags:[...ITEM_TAGS.concrete_rubble] },
  brick_pieces:{ id:'brick_pieces', name:'Обломки кирпича', type:ItemType.MISC, desc:'Красные куски битого кирпича.', spawnRooms:[], spawnW:0, value:1, tags:[...ITEM_TAGS.brick_pieces] },
  rebar_piece:{ id:'rebar_piece', name:'Арматура', type:ItemType.MISC, desc:'Ржавый кусок арматуры.', spawnRooms:[], spawnW:0, value:2, tags:[...ITEM_TAGS.rebar_piece] },
  pipe_fragment:{ id:'pipe_fragment', name:'Обломок трубы', type:ItemType.MISC, desc:'Кусок старой трубы. Можно использовать как грузило или сдать на металл.', spawnRooms:[], spawnW:0, value:3, tags:[...ITEM_TAGS.pipe_fragment] },
  metal_scrap:{ id:'metal_scrap', name:'Металлолом', type:ItemType.MISC, desc:'Искореженный кусок металла.', spawnRooms:[], spawnW:0, value:4, tags:[...ITEM_TAGS.metal_scrap] },
  raw_meat:{ id:'raw_meat', name:'Сырое мясо', type:ItemType.MISC, desc:'Подозрительный кусок сырой плоти.', spawnRooms:[], spawnW:0, value:5, tags:[...ITEM_TAGS.raw_meat] },
  electronics:{ id:'electronics', name:'Электроника', type:ItemType.MISC, desc:'Раскуроченная плата и провода.', spawnRooms:[], spawnW:0, value:5, tags:[...ITEM_TAGS.electronics] },`;

if (!content.includes("id:'concrete_rubble'")) {
    content = content.replace(
        "export const ITEMS: Record<string, ItemDef> = {",
        "export const ITEMS: Record<string, ItemDef> = {\n" + missingItems
    );
}
fs.writeFileSync('src/data/items.ts', content);

// 2. test
let tests = `import test from 'node:test';
import assert from 'node:assert/strict';
import { Tex, EntityType, Cell } from '../src/core/types';
import { rollWallDrops } from '../src/systems/destructibility';
import { makeGameState } from './helpers';
import { World } from '../src/core/world';

test('rollWallDrops spawns correct items based on WALL_LOOT and respects STASH generation', () => {
  const world = new World(123);
  const state = makeGameState();
  const nextEntityId = { v: 100 };

  const cellIdx = world.idx(10, 10);

  let rubbleCount = 0;
  let rebarCount = 0;
  let wireCount = 0;
  let stashCount = 0;

  for (let i = 0; i < 1000; i++) {
    const entities = [];
    state.tick = i * 1234567;
    rollWallDrops(world, entities, nextEntityId, state, Tex.CONCRETE, cellIdx);

    for (const drop of entities) {
      if (drop.inventory && drop.inventory.length > 0) {
        const id = drop.inventory[0].defId;
        if (id === 'concrete_rubble') rubbleCount++;
        else if (id === 'rebar_piece') rebarCount++;
        else if (id === 'wire_coil') wireCount++;
        else stashCount++;
      }
    }
  }

  assert.ok(rubbleCount > 600 && rubbleCount < 800, \`Expected ~700 rubble, got \${rubbleCount}\`);
  assert.ok(rebarCount > 150 && rebarCount < 250, \`Expected ~200 rebar, got \${rebarCount}\`);
  assert.ok(wireCount > 20 && wireCount < 80, \`Expected ~50 wire, got \${wireCount}\`);
  assert.ok(stashCount > 5 && stashCount < 40, \`Expected ~20 stash items (which might be 1-3 drops each, so up to 60 total drops), got \${stashCount}\`);

  state.tick = 9999;
  const entities2 = [];
  let waterTriggered = false;
  for (let i = 0; i < 100; i++) {
    state.tick = 9999 + i * 1234567;
    world.cells[cellIdx] = Cell.WALL;
    rollWallDrops(world, entities2, nextEntityId, state, Tex.PIPE, cellIdx);
    if (world.cells[cellIdx] === Cell.WATER) {
      waterTriggered = true;
    }
  }
  assert.ok(waterTriggered, 'WATER_EFFECT should turn cell into WATER');
});
`;
fs.writeFileSync('tests/wall_loot.test.ts', tests);

// 3. Wall_loot
let wl = `import { Tex } from '../core/types';

export interface WallDropEntry {
  itemId?: string;
  markerId?: 'HIDDEN_STASH' | 'WATER_EFFECT';
  chance: number; // 0.0 to 1.0
  amountMin: number;
  amountMax: number;
}

export type WallLootConfig = Partial<Record<Tex, WallDropEntry[]>>;

export const WALL_LOOT: WallLootConfig = {
  [Tex.CONCRETE]: [
    { itemId: 'concrete_rubble', chance: 0.70, amountMin: 1, amountMax: 2 },
    { itemId: 'rebar_piece', chance: 0.20, amountMin: 1, amountMax: 1 },
    { itemId: 'wire_coil', chance: 0.05, amountMin: 1, amountMax: 1 },
    { markerId: 'HIDDEN_STASH', chance: 0.02, amountMin: 1, amountMax: 1 },
  ],
  [Tex.PANEL]: [
    { itemId: 'concrete_rubble', chance: 0.70, amountMin: 1, amountMax: 2 },
    { itemId: 'rebar_piece', chance: 0.20, amountMin: 1, amountMax: 1 },
    { itemId: 'wire_coil', chance: 0.05, amountMin: 1, amountMax: 1 },
    { markerId: 'HIDDEN_STASH', chance: 0.02, amountMin: 1, amountMax: 1 },
  ],
  [Tex.BRICK]: [
    { itemId: 'brick_pieces', chance: 0.60, amountMin: 1, amountMax: 2 },
    { itemId: 'wire_coil', chance: 0.15, amountMin: 1, amountMax: 1 },
    { itemId: 'pipe_fragment', chance: 0.10, amountMin: 1, amountMax: 1 },
    { markerId: 'HIDDEN_STASH', chance: 0.05, amountMin: 1, amountMax: 1 },
  ],
  [Tex.METAL]: [
    { itemId: 'metal_scrap', chance: 0.50, amountMin: 2, amountMax: 2 },
    { itemId: 'electronics', chance: 0.15, amountMin: 1, amountMax: 1 },
    { itemId: 'pipe_fragment', chance: 0.20, amountMin: 1, amountMax: 1 },
  ],
  [Tex.PIPE]: [
    { itemId: 'pipe_fragment', chance: 0.60, amountMin: 2, amountMax: 2 },
    { markerId: 'WATER_EFFECT', chance: 0.30, amountMin: 1, amountMax: 1 },
  ],
  [Tex.MEAT]: [
    { itemId: 'raw_meat', chance: 0.40, amountMin: 1, amountMax: 1 },
  ],
  [Tex.GUT]: [
    { itemId: 'raw_meat', chance: 0.40, amountMin: 1, amountMax: 1 },
  ],
};
`;
fs.writeFileSync('src/data/wall_loot.ts', wl);

let destruct = `import { Tex, EntityType, type GameState, type Entity, msg, Cell, W } from '../core/types';
import { Spr } from '../render/sprite_index';
import type { World } from '../core/world';
import { WALL_LOOT } from '../data/wall_loot';
import { xorshift32 } from '../core/rand';
import { generateContainerLoot } from './procedural_loot';

export function rollWallDrops(
  world: World,
  entities: Entity[],
  nextEntityId: { v: number },
  state: GameState,
  texture: Tex,
  cellIdx: number
): void {
  let entries = WALL_LOOT[texture];

  if (false /* exposed_pipes tag check not implemented directly on world.tags yet, needs room.tags check if added later */) {
    entries = [
      { itemId: 'wire_coil', chance: 0.40, amountMin: 2, amountMax: 2 },
      { itemId: 'electronics', chance: 0.20, amountMin: 1, amountMax: 1 },
      { itemId: 'pipe_fragment', chance: 0.30, amountMin: 1, amountMax: 1 },
    ];
  }

  if (!entries) return;

  const rng = xorshift32(state.tick ^ cellIdx);
  const cx = (cellIdx % W) + 0.5;
  const cy = Math.floor(cellIdx / W) + 0.5;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (rng() < entry.chance) {
      if (entry.markerId === 'HIDDEN_STASH') {
        const amount = Math.floor(rng() * 3) + 1;
        const rollItems = [];
        for (let j = 0; j < amount; j++) {
            rollItems.push(rng());
        }
        const loot = generateContainerLoot(['valuable'], undefined, state.currentFloor, rollItems);

        if (loot.length > 0) {
          state.msgs.push(msg('Вы нашли замурованный тайник!', state.time, '#ff0'));

          const dropId = nextEntityId.v++;
          entities.push({
            id: dropId,
            type: EntityType.ITEM_DROP,
            x: cx,
            y: cy,
            angle: rng() * Math.PI * 2,
            pitch: 0,
            alive: true,
            speed: 0,
            sprite: Spr.ITEM_DROP,
            inventory: loot,
          });
        }
      } else if (entry.markerId === 'WATER_EFFECT') {
        world.cells[cellIdx] = Cell.WATER;
      } else {
        const amount = entry.amountMin + Math.floor(rng() * (entry.amountMax - entry.amountMin + 1));
        const dropId = nextEntityId.v++;
        entities.push({
          id: dropId,
          type: EntityType.ITEM_DROP,
          x: cx,
          y: cy,
          angle: rng() * Math.PI * 2,
          pitch: 0,
          alive: true,
          speed: 0,
          sprite: Spr.ITEM_DROP,
          inventory: [{ defId: entry.itemId!, count: amount }],
        });
      }
    }
  }
}
`;
fs.writeFileSync('src/systems/destructibility.ts', destruct);

// patch item sprite tests
let sprite_tests = fs.readFileSync('tests/item-sprites.test.ts', 'utf-8');
sprite_tests = sprite_tests.replace("assert.equal(ids.length, 441);", "assert.equal(ids.length, 448);");
fs.writeFileSync('tests/item-sprites.test.ts', sprite_tests);
