import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { FloorLevel, MonsterKind } from '../src/core/types';
import { isBaitAttractedMonster } from '../src/data/monster_ecology';
import { DEF, generateSprite } from '../src/entities/tube_eel';
import { S } from '../src/render/pixutil';

test('tube eel remains a water ambusher with dry-edge counterplay', () => {
  assert.equal(DEF.kind, MonsterKind.TUBE_EEL);
  assert.deepEqual(DEF.aiFlags, ['waterStrider']);
  assert.deepEqual(DEF.floors, [FloorLevel.MAINTENANCE]);

  const waterSpeed = DEF.speed * 1.45;
  const drySpeed = DEF.speed * 0.72;
  assert.ok(waterSpeed >= 2.0, 'water lane speed should make it a real ambusher');
  assert.ok(drySpeed <= 1.1, 'dry ground should be meaningful counterplay');
  assert.ok(DEF.hp <= 65, 'dry-edge shooting should not feel like fighting a tank');

  assert.match(DEF.counterplay ?? '', /сух|кромк|мост|вод/);
  assert.match(DEF.counterplay ?? '', /гарпун|приманк/);
  assert.match(DEF.lootHint ?? '', /слиз|манометр|труб/);
  assert.equal(isBaitAttractedMonster(MonsterKind.TUBE_EEL), true);
});

test('tube eel sprite read as a dark slithering body with visible eyes', () => {
  const sprite = generateSprite();
  let opaque = 0;
  let eyes = 0;
  let darkBody = 0;

  for (const px of sprite) {
    if ((px >>> 24) === 0) continue;
    opaque++;

    const r = px & 0xff;
    const g = (px >>> 8) & 0xff;
    const b = (px >>> 16) & 0xff;

    if (r === 240 && g === 240 && b === 180) eyes++;
    else if (r === 45 && g === 55 && b === 58) darkBody++;
  }

  assert.equal(sprite.length, S * S);
  assert.equal(opaque > 100, true, 'tube eel sprite should have a readable body');
  assert.equal(eyes, 2, 'tube eel should have two readable eyes');
  assert.equal(darkBody > 20, true, 'tube eel should have dark body segments');
});
