import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { getZhelemishDef, validateZhelemishDefs, ZHELEMISH_DEFS, ZHELEMISH_ITEM_IDS } from '../src/data/zhelemish_defs';

test('getZhelemishDef returns definition for valid ID', () => {
  const def = getZhelemishDef('zhelemish_raw');
  assert.ok(def, 'Should return definition for valid ID');
  assert.equal(def.itemId, 'zhelemish_raw');
  assert.equal(def.form, 'raw');
});

test('getZhelemishDef returns undefined for invalid ID', () => {
  const def = getZhelemishDef('not_a_zhelemish');
  assert.equal(def, undefined, 'Should return undefined for invalid ID');
});


test('validateZhelemishDefs', async (t) => {
  await t.test('returns no problems for valid definitions', () => {
    const problems = validateZhelemishDefs();
    assert.deepEqual(problems, []);
  });

  await t.test('detects duplicate item IDs', () => {
    const originalLength = ZHELEMISH_ITEM_IDS.length;
    (ZHELEMISH_ITEM_IDS as any).push('zhelemish_raw');
    try {
      const problems = validateZhelemishDefs();
      assert.ok(problems.includes('duplicate zhelemish item:zhelemish_raw'));
    } finally {
      (ZHELEMISH_ITEM_IDS as any).length = originalLength;
    }
  });

  await t.test('detects missing zhelemish tag', () => {
    const def = ZHELEMISH_DEFS[0] as any;
    const originalTags = [...def.tags];
    def.tags = def.tags.filter((tag: string) => tag !== 'zhelemish');
    try {
      const problems = validateZhelemishDefs();
      assert.ok(problems.some(p => p.includes('missing zhelemish tag')));
    } finally {
      def.tags = originalTags;
    }
  });

  await t.test('detects missing form tag', () => {
    const def = ZHELEMISH_DEFS[0] as any;
    const originalTags = [...def.tags];
    def.tags = def.tags.filter((tag: string) => tag !== def.form);
    try {
      const problems = validateZhelemishDefs();
      assert.ok(problems.some(p => p.includes('missing form tag')));
    } finally {
      def.tags = originalTags;
    }
  });

  await t.test('detects invalid baseValue', () => {
    const def = ZHELEMISH_DEFS[0] as any;
    const originalValue = def.baseValue;

    def.baseValue = 0;
    try {
      const problems = validateZhelemishDefs();
      assert.ok(problems.some(p => p.includes('baseValue:0')));
    } finally {
      def.baseValue = originalValue;
    }

    def.baseValue = 1.5;
    try {
      const problems = validateZhelemishDefs();
      assert.ok(problems.some(p => p.includes('baseValue:1.5')));
    } finally {
      def.baseValue = originalValue;
    }
  });

  const arrayProperties = [
    'tradeRoles',
    'preferredFactions',
    'sourceFloors',
    'sourceRooms',
    'choices',
    'questHooks'
  ];

  for (const prop of arrayProperties) {
    await t.test(`detects empty ${prop}`, () => {
      const def = ZHELEMISH_DEFS[0] as any;
      const originalValue = def[prop];
      def[prop] = [];
      try {
        const problems = validateZhelemishDefs();
        assert.ok(problems.some(p => p.includes(`:${prop}`)));
      } finally {
        def[prop] = originalValue;
      }
    });
  }

  await t.test('detects invalid choices', () => {
    const def = ZHELEMISH_DEFS[0] as any;
    const originalValue = def.choices;
    def.choices = ['not_a_valid_choice'];
    try {
      const problems = validateZhelemishDefs();
      assert.ok(problems.some(p => p.includes(':choice:not_a_valid_choice')));
    } finally {
      def.choices = originalValue;
    }
  });

  const hintProperties = [
    { prop: 'choiceHint', minLength: 30 },
    { prop: 'useHint', minLength: 20 },
    { prop: 'riskHint', minLength: 20 }
  ];

  for (const { prop, minLength } of hintProperties) {
    await t.test(`detects short ${prop}`, () => {
      const def = ZHELEMISH_DEFS[0] as any;
      const originalValue = def[prop];
      def[prop] = 'a'.repeat(minLength - 1);
      try {
        const problems = validateZhelemishDefs();
        assert.ok(problems.some(p => p.includes(`:${prop}`)));
      } finally {
        def[prop] = originalValue;
      }
    });
  }
});
