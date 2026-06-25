import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGameState, makeTestPlayer } from './helpers';
import {
  craftMenuSnapshot,
  craftMenuEntries,
  craftMaterialLine,
  craftEntryMissingLine,
  type CraftMenuRecipeEntry
} from '../src/systems/crafting';
import { emptyCraftVector } from '../src/data/craft_materials';

test('craftMenuSnapshot in craft mode returns filtered recipes', () => {
  const state = makeGameState();
  const player = makeTestPlayer();

  // Pipe should be known by default
  const snapshot = craftMenuSnapshot({
    actor: player,
    state,
    mode: 'craft',
    stationKind: 'lathe',
    filter: 'труба', // 'pipe' localized is 'Труба'
  });

  assert.equal(snapshot.mode, 'craft');
  assert.equal(snapshot.stationKind, 'lathe');

  // The entries should be filtered to contain at least the pipe
  const pipeRecipe = snapshot.recipes.find(r => r.itemId === 'pipe');
  assert.ok(pipeRecipe, 'Pipe recipe should be found');

  // It shouldn't contain something unrelated
  const knifeRecipe = snapshot.recipes.find(r => r.itemId === 'knife');
  assert.ok(!knifeRecipe, 'Knife recipe should be filtered out');

  const allFiltered = snapshot.recipes.every(r =>
    r.itemName.toLowerCase().includes('труба') ||
    r.recipeId.toLowerCase().includes('труба') ||
    r.tags.some(t => t.toLowerCase().includes('труба'))
  );
  assert.ok(allFiltered, 'All returned recipes should match the filter');
});

test('craftMenuSnapshot in disassemble mode returns filtered inventory with possible outputs', () => {
  const state = makeGameState();
  const player = makeTestPlayer({
    inventory: [
      { defId: 'pipe', count: 1 },
      { defId: 'bandage', count: 2 }, // Filter this out
    ]
  });

  const snapshot = craftMenuSnapshot({
    actor: player,
    state,
    mode: 'disassemble',
    stationKind: 'workbench',
    filter: 'труба',
  });

  assert.equal(snapshot.mode, 'disassemble');

  // The entries should be filtered to contain at least the pipe
  const pipeDisassemble = snapshot.inventory.find(r => r.itemId === 'pipe');
  assert.ok(pipeDisassemble, 'Pipe disassemble entry should be found');
  assert.ok(pipeDisassemble.possibleOutputs.length > 0, 'Pipe should have possible outputs');

  // It shouldn't contain the bandage
  const bandageDisassemble = snapshot.inventory.find(r => r.itemId === 'bandage');
  assert.ok(!bandageDisassemble, 'Bandage disassemble entry should be filtered out');
});

test('craftMenuEntries returns correct entries based on snapshot mode', () => {
  const state = makeGameState();
  const player = makeTestPlayer({
    inventory: [
      { defId: 'pipe', count: 1 },
    ]
  });

  const craftSnapshot = craftMenuSnapshot({
    actor: player,
    state,
    mode: 'craft',
    stationKind: 'workbench',
  });

  const disassembleSnapshot = craftMenuSnapshot({
    actor: player,
    state,
    mode: 'disassemble',
    stationKind: 'workbench',
  });

  const craftEntries = craftMenuEntries(craftSnapshot);
  assert.equal(craftEntries, craftSnapshot.recipes);

  const disassembleEntries = craftMenuEntries(disassembleSnapshot);
  assert.equal(disassembleEntries, disassembleSnapshot.inventory);
});

test('craftMaterialLine formats vectors correctly', () => {
  const empty = emptyCraftVector();
  assert.equal(craftMaterialLine(empty), 'нет');

  const oneMaterial = emptyCraftVector();
  oneMaterial[1] = 5; // electronics? Wait, depends on CRAFT_MATERIAL_IDS index
  assert.ok(craftMaterialLine(oneMaterial) !== 'нет');

  const multipleMaterials = emptyCraftVector();
  multipleMaterials[0] = 1;
  multipleMaterials[1] = 2;
  multipleMaterials[8] = 3;
  const line = craftMaterialLine(multipleMaterials);
  assert.ok(line.includes('1'));
  assert.ok(line.includes('2'));
  assert.ok(line.includes('3'));
  assert.ok(line.includes('  ')); // double space separated
});

test('craftEntryMissingLine returns formatted line or "ничего"', () => {
  const empty = emptyCraftVector();
  const missing = emptyCraftVector();
  missing[0] = 1;

  const entryEmpty = { missing: empty } as CraftMenuRecipeEntry;
  assert.equal(craftEntryMissingLine(entryEmpty), 'ничего');

  const entryMissing = { missing } as CraftMenuRecipeEntry;
  assert.notEqual(craftEntryMissingLine(entryMissing), 'ничего');
  assert.equal(craftEntryMissingLine(entryMissing), craftMaterialLine(missing));
});
