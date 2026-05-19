import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import '../src/gen/kvartiry/content_manifest';
import { FloorLevel, QuestType, RoomType } from '../src/core/types';
import { PLOT_NPCS, SIDE_QUESTS } from '../src/data/plot';
import {
  COMMUNAL_KITCHEN_FEUD_FINAL_BRANCH_IDS,
  COMMUNAL_KITCHEN_FEUD_QUEST_IDS,
} from '../src/gen/kvartiry/communal_kitchen_feud';

test('communal kitchen feud registers five mutually resolving branches', () => {
  const ids = Object.values(COMMUNAL_KITCHEN_FEUD_QUEST_IDS);
  assert.deepEqual(ids, [...COMMUNAL_KITCHEN_FEUD_FINAL_BRANCH_IDS]);

  for (const id of ids) {
    const quest = SIDE_QUESTS.find(q => q.id === id);
    assert.ok(quest, `missing kitchen feud quest ${id}`);
    assert.equal(quest.type, QuestType.FETCH);
    assert.equal(quest.giverNpcId in PLOT_NPCS, true, `${id} has missing giver`);
    assert.equal(quest.targetFloor, FloorLevel.KVARTIRY);
    assert.equal(quest.targetRoomType, RoomType.KITCHEN);
    assert.equal(quest.targetZoneTag, 'kitchen_feud');
    assert.ok(quest.targetHint?.includes('Квартиры'), `${id} needs a floor hint`);
    assert.equal(quest.eventTags?.includes('kitchen_feud'), true, `${id} needs kitchen event tag`);

    const blockers = COMMUNAL_KITCHEN_FEUD_FINAL_BRANCH_IDS.filter(qid => qid !== id);
    assert.deepEqual(quest.blockedBySideQuestIds, blockers);
    assert.deepEqual(quest.abandonsSideQuestIds, blockers);
  }
});

test('communal kitchen feud covers food, side, theft, expose, and liquidator outcomes', () => {
  const byId = new Map(SIDE_QUESTS.map(q => [q.id, q]));

  assert.equal(byId.get(COMMUNAL_KITCHEN_FEUD_QUEST_IDS.mediateFood)?.targetItem, 'kasha');
  assert.equal(byId.get(COMMUNAL_KITCHEN_FEUD_QUEST_IDS.sideSanek)?.targetItem, 'cigs');
  assert.equal(byId.get(COMMUNAL_KITCHEN_FEUD_QUEST_IDS.stealKey)?.targetItem, 'borrowed_kitchen_key');
  assert.equal(byId.get(COMMUNAL_KITCHEN_FEUD_QUEST_IDS.exposeCard)?.targetItem, 'forged_ration_card');
  assert.equal(byId.get(COMMUNAL_KITCHEN_FEUD_QUEST_IDS.callLiquidators)?.targetItem, 'sealed_complaint');

  assert.equal(byId.get(COMMUNAL_KITCHEN_FEUD_QUEST_IDS.stealKey)?.eventTags?.includes('theft'), true);
  assert.equal(byId.get(COMMUNAL_KITCHEN_FEUD_QUEST_IDS.exposeCard)?.eventTags?.includes('witness'), true);
  assert.equal(byId.get(COMMUNAL_KITCHEN_FEUD_QUEST_IDS.callLiquidators)?.eventTags?.includes('liquidator'), true);
});
