import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { Cell, EntityType, Feature, RoomType, type Entity } from '../src/core/types';
import { auditReachability, hasReachableAdjacentCell } from '../src/core/world';
import { hashSeed, seededRandom } from '../src/core/rand';
import { designFloorById } from '../src/data/design_floors';
import { designFloorPopulationProfile } from '../src/data/design_floor_population';
import { applyDesignFloorPopulationField } from '../src/gen/design_floors/population';
import {
  expandRaionsovetArchiveGeometry,
  generateRaionsovetArchiveDesignFloor,
} from '../src/gen/design_floors/raionsovet_archive';

function isAmbientNpcTemplate(entity: Entity): boolean {
  return entity.type === EntityType.NPC &&
    !entity.plotNpcId &&
    !entity.persistentNpcId &&
    entity.alifeId === undefined &&
    entity.questId === -1;
}

function entityRoomType(entity: Entity, gen: ReturnType<typeof generateRaionsovetArchiveDesignFloor>): RoomType | undefined {
  const cell = gen.world.idx(Math.floor(entity.x), Math.floor(entity.y));
  const roomId = gen.world.roomMap[cell];
  return roomId >= 0 ? gen.world.rooms[roomId]?.type : undefined;
}

test('raionsovet archive profile populates queues, offices, and dangerous stacks', () => {
  const route = designFloorById('raionsovet_archive');
  assert.ok(route);
  const profile = designFloorPopulationProfile(route);
  const gen = generateRaionsovetArchiveDesignFloor();
  const rng = seededRandom(hashSeed('test:raionsovet-archive-expand', route.z));
  expandRaionsovetArchiveGeometry(gen.world, rng);
  applyDesignFloorPopulationField(gen, route);

  const ambientNpcs = gen.entities.filter(isAmbientNpcTemplate);
  const monsters = gen.entities.filter(entity => entity.type === EntityType.MONSTER);
  assert.equal(ambientNpcs.length, profile.npcTarget);
  assert.equal(monsters.length, profile.monsterTarget);

  const publicNpcCount = ambientNpcs.filter(entity => {
    const type = entityRoomType(entity, gen);
    return type === RoomType.COMMON || type === RoomType.OFFICE || type === RoomType.HQ;
  }).length;
  const archiveMonsterCount = monsters.filter(entity => entityRoomType(entity, gen) === RoomType.STORAGE).length;
  assert.equal(publicNpcCount >= 120, true, 'queue and office rooms should receive visible NPC traffic');
  assert.equal(archiveMonsterCount >= 120, true, 'archive stack rooms should receive monster pressure');

  const plotIds = new Set(gen.entities.map(entity => entity.plotNpcId).filter(Boolean));
  for (const id of ['archive_lida_index', 'archive_paper_grandfather', 'archive_fire_liquidator', 'archive_false_heir']) {
    assert.equal(plotIds.has(id), true, `${id} is present`);
  }

  const audit = auditReachability(gen.world, gen.world.idx(Math.floor(gen.spawnX), Math.floor(gen.spawnY)));
  const reachableDecisionContainers = gen.world.containers.filter(container => {
    if (!container.tags.includes('raionsovet_archive')) return false;
    if (!container.tags.some(tag => tag === 'document' || tag === 'theft' || tag === 'forgery' || tag === 'trade_license' || tag === 'expose_record')) return false;
    return hasReachableAdjacentCell(gen.world, audit, gen.world.idx(container.x, container.y));
  });
  assert.equal(reachableDecisionContainers.length >= 3, true, 'at least three document decisions are reachable');

  const expandedStackRooms = gen.world.rooms.filter(room =>
    room.name.includes('картотека') || room.name.includes('архив спорных копий'));
  assert.equal(expandedStackRooms.length >= 3, true, 'full-floor archive stack rooms are present');

  let shelfWallCount = 0;
  let stackLandmarkCount = 0;
  let readingPitCount = 0;
  for (const room of gen.world.rooms) {
    for (let y = room.y; y < room.y + room.h; y++) {
      for (let x = room.x; x < room.x + room.w; x++) {
        const idx = gen.world.idx(x, y);
        if (gen.world.roomMap[idx] !== room.id) continue;
        if (expandedStackRooms.includes(room) && gen.world.cells[idx] === Cell.WALL) shelfWallCount++;
        if (expandedStackRooms.includes(room) && (
          gen.world.features[idx] === Feature.LAMP ||
          gen.world.features[idx] === Feature.SCREEN ||
          gen.world.features[idx] === Feature.DESK ||
          gen.world.features[idx] === Feature.APPARATUS
        )) stackLandmarkCount++;
        if (room.name.includes('Читальный провал') && gen.world.cells[idx] === Cell.ABYSS) readingPitCount++;
      }
    }
  }
  assert.equal(shelfWallCount >= 1800, true, 'macro shelf motifs should make real stack canyons');
  assert.equal(stackLandmarkCount >= 16, true, 'braided stack sections should carry visible landmarks');
  assert.equal(readingPitCount >= 900, true, 'reading pit should remain a large tactical void');

  let documentLaneFixtures = 0;
  for (let i = 0; i < gen.world.cells.length; i++) {
    if (gen.world.roomMap[i] >= 0) continue;
    if (
      gen.world.features[i] === Feature.DESK ||
      gen.world.features[i] === Feature.SCREEN ||
      gen.world.features[i] === Feature.SHELF ||
      gen.world.features[i] === Feature.CHAIR
    ) documentLaneFixtures++;
  }
  assert.equal(documentLaneFixtures >= 180, true, 'document lanes should be legible outside room interiors');
});
