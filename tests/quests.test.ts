import test from 'node:test';
import * as assert from 'node:assert/strict';
import { activeTalkQuestForNpc } from '../src/systems/quests';
import { QuestType } from '../src/core/types';
import { makeTestNpc } from './helpers';

test('activeTalkQuestForNpc returns undefined when there are no quests', () => {
  const npc = makeTestNpc({ id: 1 });
  const state = { quests: [] };

  const result = activeTalkQuestForNpc(npc, state);
  assert.equal(result, undefined);
});
