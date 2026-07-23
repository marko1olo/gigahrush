import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { getZhelemishDef } from '../src/data/zhelemish_defs';

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

import { validateZhelemishDefs, ZhelemishDef, ZHELEMISH_DEFS } from '../src/data/zhelemish_defs';
import { Faction, FloorLevel, RoomType } from '../src/core/types';

test('validateZhelemishDefs returns empty array for valid defaults', () => {
  const problems = validateZhelemishDefs();
  assert.deepEqual(problems, []);
});

test('validateZhelemishDefs detects duplicate item IDs', () => {
  const problems = validateZhelemishDefs(ZHELEMISH_DEFS, ['zhelemish_raw', 'zhelemish_raw']);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /duplicate zhelemish item:zhelemish_raw/);
});

test('validateZhelemishDefs detects validation errors in definitions', () => {
  // Create a deep copy of a valid def to mutate
  const validDef = ZHELEMISH_DEFS[0];

  const createInvalid = (mutator: (def: any) => void): ZhelemishDef => {
    const copy = JSON.parse(JSON.stringify(validDef));
    mutator(copy);
    return copy as ZhelemishDef;
  };

  const testCases = [
    {
      def: createInvalid(d => { d.tags = d.tags.filter((t: string) => t !== 'zhelemish'); }),
      expectedError: 'missing zhelemish tag'
    },
    {
      def: createInvalid(d => { d.tags = d.tags.filter((t: string) => t !== d.form); }),
      expectedError: 'missing form tag'
    },
    {
      def: createInvalid(d => { d.baseValue = 0; }),
      expectedError: 'baseValue:0'
    },
    {
      def: createInvalid(d => { d.baseValue = 1.5; }),
      expectedError: 'baseValue:1.5'
    },
    {
      def: createInvalid(d => { d.tradeRoles = []; }),
      expectedError: 'tradeRoles'
    },
    {
      def: createInvalid(d => { d.preferredFactions = []; }),
      expectedError: 'preferredFactions'
    },
    {
      def: createInvalid(d => { d.sourceFloors = []; }),
      expectedError: 'sourceFloors'
    },
    {
      def: createInvalid(d => { d.sourceRooms = []; }),
      expectedError: 'sourceRooms'
    },
    {
      def: createInvalid(d => { d.choices = []; }),
      expectedError: 'choices'
    },
    {
      def: createInvalid(d => { d.choices = ['invalid_choice']; }),
      expectedError: 'choice:invalid_choice'
    },
    {
      def: createInvalid(d => { d.choiceHint = 'too short'; }),
      expectedError: 'choiceHint'
    },
    {
      def: createInvalid(d => { d.useHint = 'too short'; }),
      expectedError: 'useHint'
    },
    {
      def: createInvalid(d => { d.riskHint = 'too short'; }),
      expectedError: 'riskHint'
    },
    {
      def: createInvalid(d => { d.questHooks = []; }),
      expectedError: 'questHooks'
    }
  ];

  for (const { def, expectedError } of testCases) {
    const problems = validateZhelemishDefs([def], [def.itemId]);
    assert.ok(problems.length > 0, `Expected error containing "${expectedError}" but got no problems`);
    assert.ok(
      problems.some(p => p.includes(expectedError)),
      `Expected error containing "${expectedError}" but got: ${problems.join(', ')}`
    );
  }
});
