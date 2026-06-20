import test from 'node:test';
import assert from 'node:assert/strict';

import { EntityType, Faction, QuestType } from '../src/core/types';
import { World } from '../src/core/world';
import { getFactionRel, initFactionRelations, setFactionRel } from '../src/data/relations';
import { applyDamageRelationPenalty, isHostile } from '../src/systems/factions';
import { getFactionPlayerRelation } from '../src/systems/npc_relations';
import { getRecentEvents } from '../src/systems/events';
import { checkQuests } from '../src/systems/quests';
import { makeGameState, makeTestEntity } from './helpers';

test('player attack lowers personal NPC relation and can make that NPC hostile', () => {
  initFactionRelations();
  const player = makeTestEntity({ id: 0, type: EntityType.NPC, persistentNpcId: 'player', faction: Faction.PLAYER });
  const npc = makeTestEntity({
    id: 7,
    type: EntityType.NPC,
    name: 'Недовольный сосед',
    faction: Faction.CITIZEN,
    playerRelation: -49,
  });

  applyDamageRelationPenalty(player.faction, npc.faction, 10, npc, player);

  assert.equal(npc.playerRelation, -51);
  assert.equal(player.karma, -1);
  assert.equal(getFactionRel(Faction.CITIZEN, Faction.PLAYER), 48);
  assert.equal(isHostile(npc, player), true);
});

test('getFactionPlayerRelation correctly resolves faction vs player relationships', () => {
  initFactionRelations();

  // Test 1: undefined defaults to Faction.CITIZEN
  assert.equal(getFactionPlayerRelation(undefined), getFactionRel(Faction.CITIZEN, Faction.PLAYER));

  // Test 2: explicit faction
  assert.equal(getFactionPlayerRelation(Faction.SCIENTIST), getFactionRel(Faction.SCIENTIST, Faction.PLAYER));

  // Test 3: mutability - change relation and verify it reflects
  setFactionRel(Faction.CULTIST, Faction.PLAYER, -80);
  assert.equal(getFactionPlayerRelation(Faction.CULTIST), -80);
});

test('quest completion gives small faction gain and stronger giver relation gain', () => {
  initFactionRelations();
  const state = makeGameState();
  const world = new World();
  const player = makeTestEntity({
    id: 0,
    type: EntityType.NPC, persistentNpcId: 'player',
    faction: Faction.PLAYER,
    inventory: [{ defId: 'bread', count: 1 }],
  });
  const giver = makeTestEntity({
    id: 5,
    type: EntityType.NPC,
    name: 'Проситель',
    faction: Faction.CITIZEN,
    playerRelation: 10,
    questId: 1,
  });
  state.quests.push({
    id: 1,
    type: QuestType.FETCH,
    giverId: giver.id,
    giverName: giver.name ?? 'NPC',
    desc: 'Принеси хлеб',
    targetItem: 'bread',
    targetCount: 1,
    relationDelta: 12,
    done: false,
  });

  checkQuests(player, world, [player, giver], state, state.msgs);

  assert.equal(state.quests[0].done, true);
  assert.equal(getFactionRel(Faction.CITIZEN, Faction.PLAYER), 51);
  assert.equal(giver.playerRelation, 15);
  assert.equal(getRecentEvents(state, { type: 'quest_completed', limit: 1 })[0]?.data?.factionRelationDelta, 1);
});
