import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { ItemType, MonsterKind, RoomType, type QuestType } from '../src/core/types';
import { ITEMS, WEAPON_STATS } from '../src/data/catalog';
import { CONTAINER_DEFS } from '../src/data/container_defs';
import { CONTRACTS } from '../src/data/contracts';
import { FACTORIES } from '../src/data/factories';
import { FACTION_EVENT_DEFS } from '../src/data/faction_events';
import { FLOOR_CATALOG } from '../src/data/floor_catalog';
import { FLOOR_INSTANCES } from '../src/data/floor_instances';
import { MONSTER_ECOLOGY } from '../src/data/monster_ecology';
import { MONSTER_VARIANTS } from '../src/data/monster_variants';
import { PLOT_CHAIN, PLOT_NPCS, SIDE_QUESTS, type PlotStep } from '../src/data/plot';
import { RESOURCES } from '../src/data/resources';
import { RUMORS, type RumorReveal } from '../src/data/rumors';
import { SLIME_DEFS, SLIME_SAMPLE_IDS, validateSlimeDefs } from '../src/data/slime_defs';
import { ZHELEMISH_DEFS, ZHELEMISH_ITEM_IDS, validateZhelemishDefs } from '../src/data/zhelemish_defs';
import { MONSTERS } from '../src/entities/monster';
import { isFloorLevel } from '../src/gen/floor_manifest';

type QuestLike = PlotStep & {
  id?: string;
  type: QuestType;
};

function duplicateIds(ids: readonly string[]): string[] {
  const counts = new Map<string, number>();
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  return [...counts.entries()].filter(([, count]) => count > 1).map(([id]) => id).sort();
}

function assertUnique(label: string, ids: readonly string[]): void {
  assert.deepEqual(duplicateIds(ids), [], `${label} ids must be unique`);
}

function referencedItems(step: QuestLike): string[] {
  const ids: string[] = [];
  if (step.targetItem) ids.push(step.targetItem);
  if (step.rewardItem) ids.push(step.rewardItem);
  for (const reward of step.extraRewards ?? []) ids.push(reward.defId);
  return ids;
}

function missingItems(label: string, ids: readonly string[]): string[] {
  return ids.filter(id => id !== 'money' && !ITEMS[id]).map(id => `${label}:${id}`);
}

test('item ids are unique, keyed by id, and weapon items have stats', () => {
  const entries = Object.entries(ITEMS);

  assertUnique('item', entries.map(([, def]) => def.id));
  assert.deepEqual(
    entries.filter(([key, def]) => key !== def.id).map(([key, def]) => `${key}->${def.id}`),
    [],
  );

  const weaponIdsWithoutStats = entries
    .filter(([, def]) => def.type === ItemType.WEAPON)
    .map(([id]) => id)
    .filter(id => !WEAPON_STATS[id]);
  assert.deepEqual(weaponIdsWithoutStats, [], 'weapon items must have weapon stats');
});

test('story and side quest ids are unique and reference existing data', () => {
  assertUnique('side quest', SIDE_QUESTS.map(q => q.id));
  assertUnique('plot npc', Object.keys(PLOT_NPCS));

  const missingNpcRefs: string[] = [];
  const missingItemRefs: string[] = [];
  const missingMonsterRefs: string[] = [];

  const quests: QuestLike[] = [...PLOT_CHAIN, ...SIDE_QUESTS];
  for (const q of quests) {
    const label = q.id ?? q.desc.slice(0, 32);
    if (!PLOT_NPCS[q.giverNpcId]) missingNpcRefs.push(`${label}:giver:${q.giverNpcId}`);
    if (q.targetNpcId && !PLOT_NPCS[q.targetNpcId]) missingNpcRefs.push(`${label}:target:${q.targetNpcId}`);
    missingItemRefs.push(...missingItems(label, referencedItems(q)));
    if (q.targetMonsterKind !== undefined && !MONSTERS[q.targetMonsterKind]) {
      missingMonsterRefs.push(`${label}:monster:${q.targetMonsterKind}`);
    }
  }

  assert.deepEqual(missingNpcRefs, [], 'quest NPC references must exist');
  assert.deepEqual(missingItemRefs, [], 'quest item references must exist');
  assert.deepEqual(missingMonsterRefs, [], 'quest monster references must exist');
});

test('contract, resource, factory, and container ids stay coherent', () => {
  assertUnique('contract', CONTRACTS.map(c => c.id));
  assertUnique('resource', RESOURCES.map(r => r.id));
  assertUnique('factory', FACTORIES.map(f => f.id));
  assertUnique('faction event', FACTION_EVENT_DEFS.map(e => e.id));

  const resourceIds = new Set(RESOURCES.map(r => r.id));
  const roomTypeIds = new Set(Object.values(RoomType).filter(v => typeof v === 'number'));
  const missing: string[] = [];

  for (const r of RESOURCES) {
    if (!/^[a-z][a-z0-9_]*$/.test(r.id)) missing.push(`resource:${r.id}:idFormat`);
    if (r.baseStock <= 0) missing.push(`resource:${r.id}:baseStock:${r.baseStock}`);
    if (r.lowStock < 0 || r.lowStock >= r.baseStock) missing.push(`resource:${r.id}:lowStock:${r.lowStock}`);
    if (r.roomTypes.length === 0) missing.push(`resource:${r.id}:roomTypes`);
    for (const roomType of r.roomTypes) if (!roomTypeIds.has(roomType)) missing.push(`resource:${r.id}:roomType:${roomType}`);
  }

  for (const c of CONTRACTS) {
    missing.push(...missingItems(
      `contract:${c.id}`,
      [c.targetItem, c.rewardItem, ...(c.extraRewards ?? []).map(r => r.defId)].filter((v): v is string => !!v),
    ));
    if (!isFloorLevel(c.target.floor)) missing.push(`contract:${c.id}:floor:${c.target.floor}`);
    if (c.target.roomType !== undefined && !roomTypeIds.has(c.target.roomType)) missing.push(`contract:${c.id}:roomType:${c.target.roomType}`);
    if (c.targetPlotNpcId && !PLOT_NPCS[c.targetPlotNpcId]) missing.push(`contract:${c.id}:plotNpc:${c.targetPlotNpcId}`);
    if (c.rewardResourceId && !resourceIds.has(c.rewardResourceId)) missing.push(`contract:${c.id}:resource:${c.rewardResourceId}`);
    if (c.targetMonsterKind !== undefined && !MONSTERS[c.targetMonsterKind]) missing.push(`contract:${c.id}:monster:${c.targetMonsterKind}`);
  }

  for (const r of RESOURCES) missing.push(...missingItems(`resource:${r.id}`, r.itemIds));

  for (const f of FACTORIES) {
    if (!/^[a-z][a-z0-9_]*$/.test(f.id)) missing.push(`factory:${f.id}:idFormat`);
    if (f.roomTypes.length === 0) missing.push(`factory:${f.id}:roomTypes`);
    if (f.workerOccupations.length === 0) missing.push(`factory:${f.id}:workerOccupations`);
    for (const roomType of f.roomTypes) if (!roomTypeIds.has(roomType)) missing.push(`factory:${f.id}:roomType:${roomType}`);
    assertUnique(`factory ${f.id} recipe`, f.recipes.map(r => r.id));
    for (const recipe of f.recipes) {
      if (!/^[a-z][a-z0-9_]*$/.test(recipe.id)) missing.push(`factory:${f.id}:${recipe.id}:idFormat`);
      if (recipe.cycleSec <= 0) missing.push(`factory:${f.id}:${recipe.id}:cycleSec:${recipe.cycleSec}`);
      if (recipe.inputs.length === 0 && (recipe.inputItems ?? []).length === 0) missing.push(`factory:${f.id}:${recipe.id}:inputs`);
      if (recipe.outputs.length === 0) missing.push(`factory:${f.id}:${recipe.id}:outputs`);
      for (const input of recipe.inputs) {
        if (!resourceIds.has(input.id)) missing.push(`factory:${f.id}:${recipe.id}:resource:${input.id}`);
        if (input.count <= 0) missing.push(`factory:${f.id}:${recipe.id}:resourceCount:${input.id}:${input.count}`);
      }
      for (const item of recipe.inputItems ?? []) if (item.count <= 0) missing.push(`factory:${f.id}:${recipe.id}:inputCount:${item.defId}:${item.count}`);
      for (const output of recipe.outputs) if (output.count <= 0) missing.push(`factory:${f.id}:${recipe.id}:outputCount:${output.defId}:${output.count}`);
      missing.push(...missingItems(`factory:${f.id}:${recipe.id}:input`, (recipe.inputItems ?? []).map(i => i.defId)));
      missing.push(...missingItems(`factory:${f.id}:${recipe.id}`, recipe.outputs.map(o => o.defId)));
    }
  }

  for (const def of Object.values(CONTAINER_DEFS)) {
    missing.push(...missingItems(`container:${def.kind}`, def.itemPool.map(i => i.defId)));
  }

  for (const event of FACTION_EVENT_DEFS) {
    const scope = `factionEvent:${event.id}`;
    const eventItems: string[] = [];
    if (event.itemId) eventItems.push(event.itemId);
    for (const item of event.npcInventory ?? []) eventItems.push(item.defId);
    for (const item of event.drops ?? []) eventItems.push(item.defId);
    for (const item of event.containerDrops ?? []) eventItems.push(item.defId);
    missing.push(...missingItems(scope, eventItems));
    for (const weapon of event.weapons ?? []) if (!WEAPON_STATS[weapon]) missing.push(`${scope}:weapon:${weapon}`);
    for (const delta of event.economyDeltas ?? []) if (!resourceIds.has(delta.resourceId)) missing.push(`${scope}:resource:${delta.resourceId}`);
    if (event.minGroup < 0 || event.maxGroup < event.minGroup) missing.push(`${scope}:group:${event.minGroup}-${event.maxGroup}`);
    assertUnique(`${scope} tag`, [...event.tags]);
  }

  assert.deepEqual(missing, [], 'runtime data references must resolve');
});

test('slime definitions expose stable sample ids and text handles', () => {
  assert.equal(SLIME_DEFS.length, 8, 'AG61 defines the MVP slime type set');
  assert.deepEqual(validateSlimeDefs(), [], 'slime definitions must validate internally');
  assertUnique('slime', SLIME_DEFS.map(def => def.id));
  assertUnique('slime sample', SLIME_SAMPLE_IDS);

  const slimeResource = RESOURCES.find(resource => resource.id === 'slime_samples');
  assert.ok(slimeResource, 'slime_samples resource must exist for contract/economy lookup');

  const rumorIds = new Set(RUMORS.map(rumor => rumor.id));
  const rumorSampleIds = new Set<string>();
  for (const rumor of RUMORS) {
    const reveals: readonly RumorReveal[] = rumor.reveals === undefined ? [] : Array.isArray(rumor.reveals) ? rumor.reveals : [rumor.reveals];
    for (const reveal of reveals) {
      if (reveal.kind === 'item') rumorSampleIds.add(reveal.itemId);
    }
  }

  const missing: string[] = [];
  for (const def of SLIME_DEFS) {
    const item = ITEMS[def.sampleId];
    if (!item) {
      missing.push(`${def.id}:item:${def.sampleId}`);
      continue;
    }
    if (item.id !== def.sampleId) missing.push(`${def.id}:itemKey:${item.id}`);
    if (item.type !== ItemType.MISC) missing.push(`${def.id}:itemType:${item.type}`);
    if (!slimeResource.itemIds.includes(def.sampleId)) missing.push(`${def.id}:resource:${def.sampleId}`);
    if (!rumorSampleIds.has(def.sampleId)) missing.push(`${def.id}:rumorSample:${def.sampleId}`);
    for (const handle of def.textHandles) {
      if (!rumorIds.has(handle)) missing.push(`${def.id}:textHandle:${handle}`);
    }
  }

  assert.deepEqual(missing, [], 'slime sample ids must resolve through items, resources, and rumors');
});

test('zhelemish definitions expose stable item ids and economy roles', () => {
  assert.equal(ZHELEMISH_DEFS.length, 3, 'AG101 defines raw, dried, and boiled zhelemish forms');
  assert.deepEqual(validateZhelemishDefs(), [], 'zhelemish definitions must validate internally');
  assertUnique('zhelemish item', ZHELEMISH_ITEM_IDS);

  const zhelemishResource = RESOURCES.find(resource => resource.id === 'zhelemish');
  assert.ok(zhelemishResource, 'zhelemish resource must exist for economy lookup');

  const rumorItemIds = new Set<string>();
  for (const rumor of RUMORS) {
    const reveals: readonly RumorReveal[] = rumor.reveals === undefined ? [] : Array.isArray(rumor.reveals) ? rumor.reveals : [rumor.reveals];
    for (const reveal of reveals) {
      if (reveal.kind === 'item') rumorItemIds.add(reveal.itemId);
    }
  }

  const missing: string[] = [];
  for (const def of ZHELEMISH_DEFS) {
    const item = ITEMS[def.itemId];
    if (!item) {
      missing.push(`${def.itemId}:item`);
      continue;
    }
    if (item.id !== def.itemId) missing.push(`${def.itemId}:itemKey:${item.id}`);
    if (item.value !== def.baseValue) missing.push(`${def.itemId}:value:${item.value}->${def.baseValue}`);
    if (!zhelemishResource.itemIds.includes(def.itemId)) missing.push(`${def.itemId}:resource`);
    if (!rumorItemIds.has(def.itemId)) missing.push(`${def.itemId}:rumor`);
  }

  assert.equal(ZHELEMISH_DEFS.some(def => def.tradeRoles.includes('food')), true, 'zhelemish needs a food trade role');
  assert.equal(ZHELEMISH_DEFS.some(def => def.tradeRoles.includes('medicine_counterfeit')), true, 'zhelemish needs a counterfeit medicine trade role');
  assert.equal(ZHELEMISH_DEFS.some(def => def.tradeRoles.includes('reagent')), true, 'zhelemish needs a reagent trade role');
  assert.equal(ZHELEMISH_DEFS.some(def => def.tradeRoles.includes('cult_interest')), true, 'zhelemish needs cult interest');
  assert.equal(ZHELEMISH_DEFS.some(def => def.tradeRoles.includes('science_interest')), true, 'zhelemish needs science interest');
  assert.deepEqual(missing, [], 'zhelemish ids must resolve through items, resources, and rumors');
});

test('rumor reveals and expedition leads reference known gameplay ids', () => {
  const roomTypeIds = new Set(Object.values(RoomType).filter(v => typeof v === 'number'));
  const missing: string[] = [];
  let leadCount = 0;

  for (const rumor of RUMORS) {
    const reveals: readonly RumorReveal[] = rumor.reveals === undefined ? [] : Array.isArray(rumor.reveals) ? rumor.reveals : [rumor.reveals];
    for (const reveal of reveals) {
      if (reveal.kind === 'item') missing.push(...missingItems(`rumor:${rumor.id}:reveal`, [reveal.itemId]));
      if (reveal.kind === 'monster' && reveal.monsterKind !== undefined && !Object.prototype.hasOwnProperty.call(MONSTERS, reveal.monsterKind)) {
        missing.push(`rumor:${rumor.id}:revealMonster:${reveal.monsterKind}`);
      }
    }

    if (!rumor.lead) continue;
    leadCount++;
    if (rumor.lead.floor !== undefined && !isFloorLevel(rumor.lead.floor)) missing.push(`rumor:${rumor.id}:leadFloor:${rumor.lead.floor}`);
    if (rumor.lead.roomType !== undefined && !roomTypeIds.has(rumor.lead.roomType)) missing.push(`rumor:${rumor.id}:leadRoomType:${rumor.lead.roomType}`);
    if (rumor.lead.itemId) missing.push(...missingItems(`rumor:${rumor.id}:lead`, [rumor.lead.itemId]));
    if (rumor.lead.monsterKind !== undefined && !MONSTERS[rumor.lead.monsterKind as MonsterKind]) {
      missing.push(`rumor:${rumor.id}:leadMonster:${rumor.lead.monsterKind}`);
    }
    if (rumor.lead.action.trim().length < 12) missing.push(`rumor:${rumor.id}:leadAction`);
  }

  assert.ok(leadCount >= 30, `expected at least 30 practical rumor leads, got ${leadCount}`);
  assert.deepEqual(missing, [], 'rumor reveal and lead references must resolve');
});

test('monster variant and floor catalog ids are unique and valid', () => {
  assertUnique('monster variant', MONSTER_VARIANTS.map(v => v.id));
  assertUnique('monster ecology', MONSTER_ECOLOGY.map(e => String(e.kind)));
  assertUnique('floor catalog', FLOOR_CATALOG.map(f => f.id));
  assertUnique('floor instance', FLOOR_INSTANCES.map(f => f.id));

  const rumorIds = new Set(RUMORS.map(r => r.id));
  const variantIds = new Set(MONSTER_VARIANTS.map(v => v.id));
  const invalid: string[] = [];

  for (const [kind, def] of Object.entries(MONSTERS)) {
    if (def.kind !== Number(kind)) invalid.push(`monster:${kind}:defKind:${def.kind}`);
  }

  for (const v of MONSTER_VARIANTS) {
    if (!MONSTERS[v.baseKind]) invalid.push(`monsterVariant:${v.id}:base:${v.baseKind}`);
    for (const floor of v.floors) if (!isFloorLevel(floor)) invalid.push(`monsterVariant:${v.id}:floor:${floor}`);
  }

  for (const e of MONSTER_ECOLOGY) {
    if (!MONSTERS[e.kind]) invalid.push(`monsterEcology:${e.kind}:missingMonster`);
    for (const floor of e.floors) if (!isFloorLevel(floor)) invalid.push(`monsterEcology:${e.kind}:floor:${floor}`);
    for (const variant of e.variants) if (!variantIds.has(variant)) invalid.push(`monsterEcology:${e.kind}:variant:${variant}`);
    for (const rumorId of e.rumorIds) if (!rumorIds.has(rumorId)) invalid.push(`monsterEcology:${e.kind}:rumor:${rumorId}`);
    invalid.push(...missingItems(`monsterEcology:${e.kind}`, e.rareDrops.map(d => d.itemId)));
  }

  for (const f of FLOOR_CATALOG) if (!isFloorLevel(f.baseFloor)) invalid.push(`floorCatalog:${f.id}:base:${f.baseFloor}`);
  for (const f of FLOOR_INSTANCES) {
    if (!isFloorLevel(f.baseFloor)) invalid.push(`floorInstance:${f.id}:base:${f.baseFloor}`);
    if (!rumorIds.has(f.rumorId)) invalid.push(`floorInstance:${f.id}:rumor:${f.rumorId}`);
  }

  assert.deepEqual(invalid, [], 'monster/floor references must resolve');
});
