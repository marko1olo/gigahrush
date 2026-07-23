import test from 'node:test';
import * as assert from 'node:assert';
import { craftEntryActionText } from '../../src/render/craft_ui';
import { CraftMenuRecipeEntry, CraftMenuDisassembleEntry } from '../../src/systems/crafting';

test('craftEntryActionText', async (t) => {
  await t.test('returns "ГОТОВО К СБОРКЕ" for craftable recipe', () => {
    const entry = {
      kind: 'recipe',
      craftable: true,
    } as unknown as CraftMenuRecipeEntry;
    assert.strictEqual(craftEntryActionText(entry), 'ГОТОВО К СБОРКЕ');
  });

  await t.test('returns missing items string for non-craftable recipe (no items)', () => {
    const entry = {
      kind: 'recipe',
      craftable: false,
      missing: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    } as unknown as CraftMenuRecipeEntry;
    assert.strictEqual(craftEntryActionText(entry), 'НЕДОСТАЕТ: ничего');
  });

  await t.test('returns missing items string for non-craftable recipe (with items)', () => {
    const entry = {
      kind: 'recipe',
      craftable: false,
      missing: [2, 0, 0, 0, 0, 1, 0, 0, 0],
    } as unknown as CraftMenuRecipeEntry;
    assert.strictEqual(craftEntryActionText(entry), 'НЕДОСТАЕТ: МЕХ 2  МАТ 1');
  });

  await t.test('returns output items string for valid disassemble', () => {
    const entry = {
      kind: 'disassemble',
      canDisassemble: true,
      possibleOutputs: [{ label: 'Хлам', weight: 1 }, { label: 'Деталь', weight: 2 }]
    } as unknown as CraftMenuDisassembleEntry;
    assert.strictEqual(craftEntryActionText(entry), 'ВЫХОД: 1 из: Хлам 1  Деталь 2');
  });

  await t.test('returns no outputs string for valid disassemble with no possible outputs', () => {
    const entry = {
      kind: 'disassemble',
      canDisassemble: true,
      possibleOutputs: []
    } as unknown as CraftMenuDisassembleEntry;
    assert.strictEqual(craftEntryActionText(entry), 'ВЫХОД: выход не рассчитан');
  });

  await t.test('returns needed station error for invalid disassemble', () => {
    const entry = {
      kind: 'disassemble',
      canDisassemble: false,
      blockedReason: 'invalid_station',
      possibleOutputs: []
    } as unknown as CraftMenuDisassembleEntry;
    assert.strictEqual(craftEntryActionText(entry), 'НЕЛЬЗЯ: нужен верстак');
  });

  await t.test('returns default error for invalid disassemble without specific reason', () => {
    const entry = {
      kind: 'disassemble',
      canDisassemble: false,
      blockedReason: 'unknown',
      possibleOutputs: []
    } as unknown as CraftMenuDisassembleEntry;
    assert.strictEqual(craftEntryActionText(entry), 'НЕЛЬЗЯ: выход не рассчитан');
  });
});
