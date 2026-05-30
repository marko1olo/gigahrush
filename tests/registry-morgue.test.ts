import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { auditReachability } from '../src/core/world';
import { Cell, EntityType, LiftDirection, RoomType, W } from '../src/core/types';
import { ITEMS } from '../src/data/catalog';
import { CONTRACTS } from '../src/data/contracts';
import { designFloorById } from '../src/data/design_floors';
import { designFloorPopulationProfile } from '../src/data/design_floor_population';
import { SIDE_QUESTS } from '../src/data/plot';
import { resourceForItem } from '../src/data/resources';
import { generateDesignFloor } from '../src/gen/design_floors/manifest';

let cachedGeneration: ReturnType<typeof generateDesignFloor> | undefined;

function generatedRegistryMorgue(): ReturnType<typeof generateDesignFloor> {
  cachedGeneration ??= generateDesignFloor('registry_morgue');
  return cachedGeneration;
}

function hasReachableLift(gen: ReturnType<typeof generateDesignFloor>, direction: LiftDirection): boolean {
  const audit = auditReachability(gen.world, gen.world.idx(Math.floor(gen.spawnX), Math.floor(gen.spawnY)));
  for (let i = 0; i < W * W; i++) {
    if (gen.world.cells[i] !== Cell.LIFT || gen.world.liftDir[i] !== direction) continue;
    const x = i % W;
    const y = (i / W) | 0;
    const neighbors = [
      gen.world.idx(x + 1, y),
      gen.world.idx(x - 1, y),
      gen.world.idx(x, y + 1),
      gen.world.idx(x, y - 1),
    ];
    if (neighbors.some(idx => audit.reachable[idx] === 1)) return true;
  }
  return false;
}

test('corpse number tag is a document-scarcity morgue proof token', () => {
  const def = ITEMS.corpse_number_tag;
  assert.ok(def);
  assert.equal(def.name, 'Номерок трупа');
  assert.equal(def.tags?.includes('identity'), true);
  assert.equal(resourceForItem(def.id)?.id, 'documents');
  assert.equal(CONTRACTS.find(contract => contract.id === 'ministry_registry_tag_return')?.targetItem, def.id);
});

test('registry morgue is a monster-heavy bureaucratic horror floor with bounded staff', () => {
  const route = designFloorById('registry_morgue');
  assert.ok(route);
  const profile = designFloorPopulationProfile(route);
  assert.equal(profile.npcTarget, 480);
  assert.equal(profile.monsterTarget, 1150);

  const gen = generatedRegistryMorgue();
  const npcs = gen.entities.filter(e => e.type === EntityType.NPC);
  const monsters = gen.entities.filter(e => e.type === EntityType.MONSTER);

  assert.equal(npcs.length >= 250 && npcs.length <= 700, true, `npc count ${npcs.length}`);
  assert.equal(monsters.length >= 700 && monsters.length <= 1600, true, `monster count ${monsters.length}`);
  assert.equal(monsters.length > npcs.length * 2, true, `monsters ${monsters.length}, npcs ${npcs.length}`);
  assert.equal(gen.world.rooms.some(room => room.type === RoomType.MEDICAL && room.name.includes('Зараженная камера')), true);
  assert.equal(gen.world.rooms.some(room => room.type === RoomType.STORAGE && room.name.includes('Холодная')), true);
});

test('registry morgue gates valuable records and medicine behind owned or locked containers', () => {
  const gen = generatedRegistryMorgue();
  const bodyStorage = gen.world.containers.find(c => c.name === 'Холодная картотека без номера');
  const medCabinet = gen.world.containers.find(c => c.name === 'Опечатанный медицинский шкаф Крутова');
  const deathSafe = gen.world.containers.find(c => c.name === 'Сейф свидетельств о смерти');

  assert.ok(bodyStorage);
  assert.equal(bodyStorage.access, 'owner');
  assert.equal(bodyStorage.tags.includes('body_storage'), true);
  assert.equal(bodyStorage.tags.includes('morgue_theft'), true);
  assert.equal(bodyStorage.inventory.some(item => item.defId === 'missing_record_file'), true);
  assert.equal(bodyStorage.inventory.some(item => item.defId === 'corpse_number_tag'), true);
  assert.equal(bodyStorage.inventory.some(item => item.defId === 'container_key_label'), true);

  assert.ok(medCabinet);
  assert.equal(medCabinet.access, 'owner');
  assert.equal(medCabinet.tags.includes('quarantine'), true);
  assert.equal(medCabinet.tags.includes('morgue_theft'), true);
  assert.equal(medCabinet.inventory.filter(item => item.defId === 'morphine_ampoule').length, 1);

  assert.ok(deathSafe);
  assert.equal(deathSafe.access, 'locked');
  assert.equal(deathSafe.tags.includes('false_death'), true);
  assert.equal(deathSafe.inventory.some(item => item.defId === 'record_exposure_notice'), true);
});

test('registry morgue drawer canyon has Hilbert-ordered Potts record domains without free medicine', () => {
  const gen = generatedRegistryMorgue();
  const drawers = gen.world.containers.filter(c => c.tags.includes('hilbert_tag_order'));
  const medicalLoot = new Set(['sanitary_kit', 'antibiotic', 'morphine_ampoule', 'bandage']);

  assert.equal(drawers.length >= 36, true, `drawer count ${drawers.length}`);
  assert.equal(drawers.every(c => c.tags.includes('drawer_canyon')), true);
  assert.equal(drawers.every(c => c.tags.includes('morgue_theft')), true);
  assert.equal(drawers.every(c => c.access === 'owner' || c.access === 'locked'), true);
  assert.equal(drawers.some(c => c.tags.includes('potts_living_record')), true);
  assert.equal(drawers.some(c => c.tags.includes('potts_dead_record')), true);
  assert.equal(drawers.some(c => c.tags.includes('potts_contaminated_record')), true);
  assert.equal(drawers.every(c => c.inventory.every(item => !medicalLoot.has(item.defId))), true);

  const order = drawers.map(c => {
    const tag = c.tags.find(t => t.startsWith('hilbert_order_'));
    assert.ok(tag);
    return Number.parseInt(tag.slice('hilbert_order_'.length), 10);
  });
  assert.deepEqual(order, order.toSorted((a, b) => a - b));
  assert.equal(new Set(order).size, drawers.length);
});

test('registry morgue cold shells keep both lift directions reachable', () => {
  const gen = generatedRegistryMorgue();

  assert.equal(hasReachableLift(gen, LiftDirection.UP), true);
  assert.equal(hasReachableLift(gen, LiftDirection.DOWN), true);
});

test('registry morgue side quests publish record, false-death, escort, theft, and quarantine hooks', () => {
  generatedRegistryMorgue();
  const byId = new Map(SIDE_QUESTS.map(quest => [quest.id, quest]));

  assert.equal(byId.get('morgue_find_tag')?.eventTags?.includes('record_correction'), true);
  assert.equal(byId.get('morgue_find_tag')?.targetRoute?.designFloorId, 'registry_morgue');
  assert.equal(byId.get('morgue_find_tag')?.targetItem, 'corpse_number_tag');
  assert.equal(byId.get('morgue_swap_certificate')?.eventTags?.includes('false_death'), true);
  assert.equal(byId.get('morgue_missing_body')?.eventTags?.includes('false_body'), true);
  assert.equal(byId.get('morgue_relative_escort')?.eventTags?.includes('escort'), true);
  assert.equal(byId.get('morgue_relative_escort')?.requiresSideQuestDone, 'morgue_name_return');
  assert.equal(byId.get('morgue_relative_escort')?.targetRoomName, 'Кабинет книги умерших');
  assert.equal(byId.get('morgue_medicine_lock')?.eventTags?.includes('quarantine_paper_use'), true);
});
