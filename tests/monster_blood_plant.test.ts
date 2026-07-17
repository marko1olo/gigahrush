import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { EntityType, FloorLevel, MonsterKind, ProjType, type Entity } from '../src/core/types';
import { DEF, generateSprite } from '../src/entities/blood_plant';
import { getMonsterEcology } from '../src/data/monster_ecology';
import { S } from '../src/render/pixutil';
import { Spr } from '../src/render/sprite_index';
import { bloodPlantProjectileDamage } from '../src/systems/blood_plant';

test('blood plant definition, ecology, and sprite read as a red mold rooted hive', () => {
  const ecology = getMonsterEcology(MonsterKind.BLOOD_PLANT);
  const sprite = generateSprite();
  let opaque = 0;
  let red = 0;
  for (const px of sprite) {
    if ((px >>> 24) === 0) continue;
    opaque++;
    const r = px & 0xff;
    const g = (px >>> 8) & 0xff;
    const b = (px >>> 16) & 0xff;
    if (r > g + 20 && r > b + 20) red++;
  }

  assert.equal(DEF.kind, MonsterKind.BLOOD_PLANT);
  assert.deepEqual(DEF.aiFlags, ['rootHive']);
  assert.deepEqual(DEF.floors, [FloorLevel.LIVING, FloorLevel.MAINTENANCE, FloorLevel.HELL]);
  assert.equal(ecology?.rare, true);
  assert.match(DEF.counterplay ?? '', /соли|огня|режущего/i);
  assert.equal(sprite.length, S * S);
  assert.ok(opaque > 150, 'blood plant sprite should have visible elements');
  assert.ok(red > 50, 'blood plant should have clear red mold/vein colors');
});

test('bloodPlantProjectileDamage calculations', async (t) => {
  await t.test('returns base damage for non-blood plants', () => {
    const target = { type: EntityType.MONSTER, monsterKind: MonsterKind.SPAWNER, hp: 100, maxHp: 100 } as Entity;
    const projectile = { type: EntityType.PROJECTILE, projType: ProjType.FLAME } as Entity;
    assert.equal(bloodPlantProjectileDamage(target, projectile, 10), 10);
  });

  await t.test('returns base damage for non-fire projectiles', () => {
    const target = { type: EntityType.MONSTER, monsterKind: MonsterKind.BLOOD_PLANT, hp: 100, maxHp: 100 } as Entity;
    const projectile = { type: EntityType.PROJECTILE, projType: ProjType.NORMAL } as Entity;
    assert.equal(bloodPlantProjectileDamage(target, projectile, 10), 10);
  });

  await t.test('deals at least 38% max HP damage to blood plants from fire projectiles', () => {
    const target = { type: EntityType.MONSTER, monsterKind: MonsterKind.BLOOD_PLANT, hp: 100, maxHp: 100 } as Entity;
    const projectile = { type: EntityType.PROJECTILE, projType: ProjType.FLAME } as Entity;
    assert.equal(bloodPlantProjectileDamage(target, projectile, 10), 38);
  });

  await t.test('deals base damage if it exceeds 38% max HP', () => {
    const target = { type: EntityType.MONSTER, monsterKind: MonsterKind.BLOOD_PLANT, hp: 100, maxHp: 100 } as Entity;
    const projectile = { type: EntityType.PROJECTILE, projType: ProjType.FLAME } as Entity;
    assert.equal(bloodPlantProjectileDamage(target, projectile, 50), 50);
  });

  await t.test('calculates maxHp from hp if maxHp is undefined', () => {
    const target = { type: EntityType.MONSTER, monsterKind: MonsterKind.BLOOD_PLANT, hp: 200 } as Entity;
    const projectile = { type: EntityType.PROJECTILE, projType: ProjType.FLAME } as Entity;
    assert.equal(bloodPlantProjectileDamage(target, projectile, 10), 76);
  });

  await t.test('defaults maxHp to 1 if both maxHp and hp are undefined', () => {
    const target = { type: EntityType.MONSTER, monsterKind: MonsterKind.BLOOD_PLANT } as Entity;
    const projectile = { type: EntityType.PROJECTILE, projType: ProjType.FLAME } as Entity;
    assert.equal(bloodPlantProjectileDamage(target, projectile, 0), 1);
  });

  await t.test('identifies fire projectiles by sprite', () => {
    const target = { type: EntityType.MONSTER, monsterKind: MonsterKind.BLOOD_PLANT, maxHp: 100 } as Entity;
    const projFlameBolt = { type: EntityType.PROJECTILE, sprite: Spr.FLAME_BOLT } as Entity;
    const projHostileFlameBolt = { type: EntityType.PROJECTILE, sprite: Spr.HOSTILE_FLAME_BOLT } as Entity;
    assert.equal(bloodPlantProjectileDamage(target, projFlameBolt, 10), 38);
    assert.equal(bloodPlantProjectileDamage(target, projHostileFlameBolt, 10), 38);
  });
});
