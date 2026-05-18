import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { FloorLevel, MonsterKind } from '../src/core/types';
import { MONSTER_ECOLOGY } from '../src/data/monster_ecology';
import { DEF, generateSprite } from '../src/entities/pechateed';
import { S } from '../src/render/pixutil';

function sortedFloors(floors: readonly FloorLevel[] | undefined): FloorLevel[] {
  return [...(floors ?? [])].sort((a, b) => a - b);
}

test('pechateed local definition stays a kiteable document hunter', () => {
  const ecology = MONSTER_ECOLOGY.find(def => def.kind === MonsterKind.PECHATEED);

  assert.ok(ecology, 'PECHATEED ecology must exist');
  assert.equal(DEF.kind, MonsterKind.PECHATEED);
  assert.deepEqual(DEF.aiFlags, ['documentHunter']);
  assert.deepEqual(sortedFloors(DEF.floors), sortedFloors(ecology.floors));
  assert.ok(DEF.speed < 1.8, 'PECHATEED should remain kiteable');
  assert.ok(DEF.dmg >= 10, 'PECHATEED should punish a caught paper carrier');
  assert.match(DEF.counterplay ?? '', /Сбросьте.*бумаг/);
  assert.match(DEF.counterplay ?? '', /дистанц/);
  assert.match(DEF.lootHint ?? '', /бланк|чернил/);
});

test('pechateed sprite has a readable paper-and-stamp silhouette', () => {
  const sprite = generateSprite();
  let opaque = 0;
  let stampPixels = 0;
  let inkPixels = 0;

  for (const pixel of sprite) {
    if ((pixel >>> 24) === 0) continue;
    opaque++;
    const r = pixel & 0xff;
    const g = (pixel >>> 8) & 0xff;
    const b = (pixel >>> 16) & 0xff;
    if (r > 95 && g < 55 && b < 65) stampPixels++;
    if (r < 55 && g < 45 && b < 50) inkPixels++;
  }

  assert.equal(sprite.length, S * S);
  assert.ok(opaque > 450, 'sprite should not be visually thin or blank');
  assert.ok(stampPixels > 20, 'red stamp/mouth pixels should cue document identity');
  assert.ok(inkPixels > 20, 'dark ink/text pixels should cue document identity');
});
