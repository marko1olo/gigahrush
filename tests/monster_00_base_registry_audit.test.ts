import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { FloorLevel, MonsterKind } from '../src/core/types';
import {
  BAIT_ATTRACTED_MONSTER_KINDS,
  chooseFloorMonsterKind,
  getMonsterEcology,
  monsterEcologyEventData,
  monsterEcologyTags,
} from '../src/data/monster_ecology';
import {
  MONSTER_VARIANTS,
  chooseMonsterVariant,
} from '../src/data/monster_variants';
import {
  MONSTERS,
  MONSTER_SPRITES,
  NEW_MONSTER_KINDS,
  NEW_MONSTERS_BY_FLOOR,
  type MonsterDef,
} from '../src/entities/monster';
import { S } from '../src/render/pixutil';

const EXPECTED_BASE_MONSTER_IDS = [
  'SBORKA',
  'TVAR',
  'POLZUN',
  'BETONNIK',
  'ZOMBIE',
  'EYE',
  'NIGHTMARE',
  'SHADOW',
  'REBAR',
  'MATKA',
  'IDOL',
  'MANCOBUS',
  'HERALD',
  'CREATOR',
  'SPIRIT',
  'ROBOT',
  'SHOVNIK',
  'LAMPOVY',
  'PECHATEED',
  'TUBE_EEL',
  'PARAGRAPH',
  'NELYUD',
  'KRYSNOZHKA',
  'KOSTOREZ',
] as const;

interface TacticalAudit {
  kind: MonsterKind;
  floors: readonly FloorLevel[];
  rare: boolean;
  aiFlags?: readonly string[];
  variants?: readonly string[];
  defCounterplay: RegExp;
  ecologyCounterplay: RegExp;
  statGuard: (def: MonsterDef) => void;
}

function monsterKinds(): MonsterKind[] {
  return (Object.keys(MONSTERS).map(Number) as MonsterKind[]).sort((a, b) => a - b);
}

function sortedFloors(floors: readonly FloorLevel[] | undefined): FloorLevel[] {
  return [...(floors ?? [])].sort((a, b) => a - b);
}

function spriteHash(sprite: Uint32Array): number {
  let h = 2166136261;
  for (const px of sprite) {
    h ^= px;
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function opaquePixels(sprite: Uint32Array): number {
  let count = 0;
  for (const px of sprite) {
    if ((px >>> 24) !== 0) count++;
  }
  return count;
}

test('base monster registry keeps stable enum ids, ecology tags, and floor data', () => {
  const kinds = monsterKinds();
  assert.deepEqual(kinds.map(kind => MonsterKind[kind]), EXPECTED_BASE_MONSTER_IDS);
  assert.equal(kinds.length, 24);

  for (const kind of kinds) {
    const def = MONSTERS[kind];
    const ecology = getMonsterEcology(kind);
    assert.ok(ecology, `${MonsterKind[kind]} needs ecology data`);
    assert.equal(def.kind, kind, `${MonsterKind[kind]} registry entry points at another kind`);
    assert.equal(def.name.trim().length >= 3, true, `${MonsterKind[kind]} needs a display name`);
    const localFloors = sortedFloors(def.floors);
    assert.equal(ecology.floors.length > 0, true, `${MonsterKind[kind]} ecology needs floor placement`);
    if (localFloors.length > 0) {
      assert.deepEqual(localFloors, sortedFloors(ecology.floors), `${MonsterKind[kind]} def/ecology floors diverged`);
    }
    assert.equal(ecology.counterplay.trim().length >= 32, true, `${MonsterKind[kind]} needs concrete ecology counterplay`);
    assert.equal((def.counterplay ?? '').trim().length >= 32, true, `${MonsterKind[kind]} needs local counterplay`);
    assert.equal((def.lootHint ?? '').trim().length >= 8, true, `${MonsterKind[kind]} needs local loot hint`);

    const tags = monsterEcologyTags(kind);
    assert.equal(tags.includes('ecology'), true, `${MonsterKind[kind]} missing ecology event tag`);
    assert.equal(tags.includes(`monster_${MonsterKind[kind].toLowerCase()}`), true, `${MonsterKind[kind]} missing monster event tag`);
    assert.equal(tags.includes('rare_monster'), ecology.rare, `${MonsterKind[kind]} rare event tag mismatch`);

    const data = monsterEcologyEventData(kind);
    assert.deepEqual(data?.ecologyFloors, ecology.floors);
    assert.deepEqual(data?.ecologyRooms, ecology.rooms);
    assert.deepEqual(data?.ecologyVariants, ecology.variants);
    assert.equal(data?.ecologyCounterplay, ecology.counterplay);
    assert.equal(data?.ecologyLootHint, ecology.lootHint);
  }
});

test('every base monster sprite generator emits readable unique art', () => {
  const hashes = new Map<number, string>();

  for (const kind of monsterKinds()) {
    const sprite = MONSTER_SPRITES[kind]();
    assert.equal(sprite.length, S * S, `${MonsterKind[kind]} sprite must use atlas tile size`);
    assert.equal(opaquePixels(sprite) > 450, true, `${MonsterKind[kind]} sprite should not be blank or needle-thin`);

    const hash = spriteHash(sprite);
    const duplicate = hashes.get(hash);
    assert.equal(duplicate, undefined, `${MonsterKind[kind]} sprite duplicates ${duplicate}`);
    hashes.set(hash, MonsterKind[kind]);
  }
});

test('uncovered common monsters keep their tactical counterplay roles', () => {
  const audits: TacticalAudit[] = [
    {
      kind: MonsterKind.SBORKA,
      floors: [FloorLevel.MINISTRY, FloorLevel.KVARTIRY, FloorLevel.LIVING, FloorLevel.MAINTENANCE, FloorLevel.HELL],
      rare: false,
      aiFlags: ['foodBait'],
      variants: ['cracked_sborka', 'fog_sborka'],
      defCounterplay: /широк|еда|говняк|дроб/,
      ecologyCounterplay: /широк|приман|сборк/,
      statGuard: def => {
        assert.equal(def.hp <= 20, true, 'SBORKA should stay weak');
        assert.equal(def.speed >= 2.4, true, 'SBORKA should stay fast');
        assert.equal(def.dmg <= 8, true, 'SBORKA should stay an ammo-drain swarm threat, not a bruiser');
      },
    },
    {
      kind: MonsterKind.TVAR,
      floors: [FloorLevel.KVARTIRY, FloorLevel.LIVING, FloorLevel.MAINTENANCE, FloorLevel.HELL],
      rare: false,
      aiFlags: ['foodBait', 'wallBias'],
      variants: ['panel_tvar', 'hungry_tvar'],
      defCounterplay: /средн|стен|еда|говняк/,
      ecologyCounterplay: /полторы клетки|центр комнаты|кромк|больнее/,
      statGuard: def => {
        assert.equal(def.hp >= 45 && def.hp <= 85, true, 'TVAR should stay a medium HP threat');
        assert.equal(def.speed >= 1.4 && def.speed <= 2.1, true, 'TVAR should pressure but not outrun spacing');
        assert.equal(def.dmg >= 10 && def.dmg <= 16, true, 'TVAR contact damage should stay medium');
      },
    },
    {
      kind: MonsterKind.EYE,
      floors: [FloorLevel.MINISTRY, FloorLevel.LIVING, FloorLevel.MAINTENANCE, FloorLevel.HELL, FloorLevel.VOID],
      rare: false,
      variants: ['blind_eye', 'lamp_eye'],
      defCounterplay: /линию огня|после выстрела|коридор/,
      ecologyCounterplay: /Ломайте линию|после выстрела|коридор/,
      statGuard: def => {
        assert.equal(def.isRanged, true, 'EYE should stay ranged');
        assert.equal((def.projSpeed ?? 0) >= 6 && (def.projSpeed ?? 0) <= 10, true, 'EYE projectile should stay readable');
        assert.equal(def.attackRate >= 2, true, 'EYE should preserve a close-after-shot window');
      },
    },
    {
      kind: MonsterKind.SHADOW,
      floors: [FloorLevel.MINISTRY, FloorLevel.KVARTIRY, FloorLevel.LIVING, FloorLevel.HELL, FloorLevel.VOID],
      rare: false,
      variants: ['deep_shadow', 'thin_shadow'],
      defCounterplay: /освещ|широк|дистанц/,
      ecologyCounterplay: /Двиг|просвет|темнот/,
      statGuard: def => {
        assert.equal(def.hp >= 40 && def.hp <= 70, true, 'SHADOW should stay killable when revealed');
        assert.equal(def.speed >= 2 && def.speed <= 2.7, true, 'SHADOW should stay an ambush pressure threat');
      },
    },
    {
      kind: MonsterKind.REBAR,
      floors: [FloorLevel.LIVING, FloorLevel.MAINTENANCE, FloorLevel.HELL, FloorLevel.VOID],
      rare: true,
      variants: ['rebar_veteran', 'rust_rebar'],
      defCounterplay: /желез|стеллаж|дистанц|голыми руками/,
      ecologyCounterplay: /желез|склад|дистанц|руками/,
      statGuard: def => {
        assert.equal(def.hp >= 180, true, 'REBAR should stay a heavy object threat');
        assert.equal(def.speed < 1, true, 'REBAR should remain kiteable');
        assert.equal(def.attackRate >= 2, true, 'REBAR should leave a planning window');
      },
    },
    {
      kind: MonsterKind.NELYUD,
      floors: [FloorLevel.MINISTRY, FloorLevel.KVARTIRY, FloorLevel.LIVING],
      rare: true,
      aiFlags: ['closeReveal'],
      defCounterplay: /дистанц|молчалив|свидетел|выход/,
      ecologyCounterplay: /дистанц|раскрывается|близк|лицу/,
      statGuard: def => {
        assert.equal(def.hp >= 60 && def.hp <= 100, true, 'NELYUD should stay tougher than a citizen but not boss-heavy');
        assert.equal(def.speed <= 1.9, true, 'NELYUD should not become a generic fast chaser');
      },
    },
    {
      kind: MonsterKind.KRYSNOZHKA,
      floors: [FloorLevel.KVARTIRY, FloorLevel.LIVING, FloorLevel.MAINTENANCE],
      rare: false,
      aiFlags: ['foodBait'],
      variants: ['garbage_krysnozhka'],
      defCounterplay: /мало здоровья|дроб|еда|говняк|ловушк/,
      ecologyCounterplay: /приман|ловушк|рывок|дроб/,
      statGuard: def => {
        assert.equal(def.hp <= 20, true, 'KRYSNOZHKA should stay fragile');
        assert.equal(def.speed >= 2.2, true, 'KRYSNOZHKA should stay a swarm rush threat');
        assert.equal(def.dmg <= 5, true, 'KRYSNOZHKA should rely on swarm pressure');
      },
    },
    {
      kind: MonsterKind.KOSTOREZ,
      floors: [FloorLevel.MAINTENANCE, FloorLevel.HELL],
      rare: true,
      defCounterplay: /замах|дистанц|колонна|дроб|лист металла/,
      ecologyCounterplay: /замах|дистанц|колонна|дроб/,
      statGuard: def => {
        assert.equal(def.hp >= 120 && def.hp <= 190, true, 'KOSTOREZ should stay an elite, not a boss sponge');
        assert.equal(def.attackRate >= 2.4, true, 'KOSTOREZ windup should stay readable');
        assert.equal(def.speed >= 1.3 && def.speed <= 1.8, true, 'KOSTOREZ should threaten but preserve corner counterplay');
      },
    },
  ];

  for (const audit of audits) {
    const def = MONSTERS[audit.kind];
    const ecology = getMonsterEcology(audit.kind);
    assert.ok(ecology, `${MonsterKind[audit.kind]} needs ecology`);
    assert.deepEqual(sortedFloors(def.floors), sortedFloors(audit.floors), `${MonsterKind[audit.kind]} local floors changed`);
    assert.deepEqual(sortedFloors(ecology.floors), sortedFloors(audit.floors), `${MonsterKind[audit.kind]} ecology floors changed`);
    assert.equal(ecology.rare, audit.rare, `${MonsterKind[audit.kind]} rare gate changed`);
    if (audit.aiFlags) assert.deepEqual(def.aiFlags, audit.aiFlags, `${MonsterKind[audit.kind]} aiFlags changed`);
    for (const variant of audit.variants ?? []) {
      assert.equal(ecology.variants.includes(variant), true, `${MonsterKind[audit.kind]} lost ecology variant ${variant}`);
    }
    assert.match(def.counterplay ?? '', audit.defCounterplay);
    assert.match(ecology.counterplay, audit.ecologyCounterplay);
    audit.statGuard(def);
  }
});

test('monster ecology selection respects floor placement and rare gates', () => {
  const rngSamples = [0, 0.13, 0.37, 0.71, 0.99];

  for (const floor of [
    FloorLevel.MINISTRY,
    FloorLevel.KVARTIRY,
    FloorLevel.LIVING,
    FloorLevel.MAINTENANCE,
    FloorLevel.HELL,
    FloorLevel.VOID,
  ]) {
    for (const allowRare of [false, true]) {
      for (const sample of rngSamples) {
        const kind = chooseFloorMonsterKind({
          floor,
          samosborCount: 6,
          allowRare,
          rng: () => sample,
        });
        const ecology = getMonsterEcology(kind);
        assert.ok(ecology, `${MonsterKind[kind]} must resolve after selection`);
        assert.equal(ecology.floors.includes(floor), true, `${MonsterKind[kind]} selected outside ${FloorLevel[floor]}`);
        if (!allowRare) assert.equal(ecology.rare, false, `${MonsterKind[kind]} selected rare monster without allowRare`);
      }
    }
  }
});

test('monster variants and new-kind floor manifests stay data-driven', () => {
  const floorMap = new Map<MonsterKind, FloorLevel[]>();
  for (const [floorKey, kinds] of Object.entries(NEW_MONSTERS_BY_FLOOR)) {
    const floor = Number(floorKey) as FloorLevel;
    for (const kind of kinds) {
      const floors = floorMap.get(kind) ?? [];
      floors.push(floor);
      floorMap.set(kind, floors);
    }
  }

  for (const kind of NEW_MONSTER_KINDS) {
    const def = MONSTERS[kind];
    assert.deepEqual(sortedFloors(floorMap.get(kind)), sortedFloors(def.floors), `${MonsterKind[kind]} floor manifest diverged from local def`);
  }

  for (const variant of MONSTER_VARIANTS) {
    assert.match(variant.id, /^[a-z0-9]+(?:_[a-z0-9]+)*$/, `${variant.id} should stay lowercase snake_case`);
    assert.equal(variant.flags.length > 0, true, `${variant.id} needs at least one tactical flag`);
    assert.equal(
      variant.hpMult !== 1 || variant.speedMult !== 1 || variant.dmgMult !== 1,
      true,
      `${variant.id} should change at least one combat multiplier`,
    );
    assert.equal(variant.lootHint.trim().length >= 4, true, `${variant.id} needs a loot hint`);
    for (const floor of variant.floors) {
      const baseFloors = MONSTERS[variant.baseKind].floors?.length
        ? MONSTERS[variant.baseKind].floors
        : getMonsterEcology(variant.baseKind)?.floors;
      assert.equal(
        baseFloors?.includes(floor),
        true,
        `${variant.id} is placed outside ${MonsterKind[variant.baseKind]} floors`,
      );
      const picked = chooseMonsterVariant(variant.baseKind, floor);
      assert.ok(picked, `${variant.id} floor should be selectable for ${MonsterKind[variant.baseKind]}`);
      assert.equal(picked.baseKind, variant.baseKind);
      assert.equal(picked.floors.includes(floor), true);
    }
  }
});

test('bait-attracted monster list is narrow and backed by foodBait AI flags', () => {
  assert.deepEqual(BAIT_ATTRACTED_MONSTER_KINDS, [
    MonsterKind.KRYSNOZHKA,
    MonsterKind.SBORKA,
    MonsterKind.TVAR,
    MonsterKind.POLZUN,
    MonsterKind.TUBE_EEL,
  ]);

  for (const kind of BAIT_ATTRACTED_MONSTER_KINDS) {
    const flags = MONSTERS[kind].aiFlags ?? [];
    assert.equal(
      flags.includes('foodBait') || flags.includes('waterStrider'),
      true,
      `${MonsterKind[kind]} bait tag must be backed by an explicit movement/cue flag`,
    );
    assert.match(MONSTERS[kind].counterplay ?? '', /ед|говняк|приман|сух|кромк|вод/);
  }
});
