# Addmonster 26: Конторщик

## Source

- Former registry entry: `src/data/monster_variants.ts` id `office_zombie`.
- Lore-facing old name: `Конторская Мертвячина`.

## Hard Rule

Standalone monster package only. It is not a zombie with office modifiers; it is a document-scent monster.

## Gameplay Role

Ministry undead that reacts to papers, stamps, folders, and carried bureaucracy. It turns inventory greed into noise and aggro.

Player decision: carry valuable forms through danger, stash them before combat, or use papers as a lure.

## Sprite Plan

- New sprite module: `src/entities/kontorshchik.ts`.
- Silhouette: stiff corpse in torn office jacket with paper strips dragged from sleeves.
- Palette: gray suit, yellowed paper, purple stamp bruises, dead green face.
- Procedural generation:
  - Draw narrow shoulders and a folder-like chest plate.
  - Add hanging paper strips with stamped red marks.
  - Randomize tie/scarf and folder side for recognition.
- Readability mark: paper strips flutter toward carried documents during aggro.

## AI Plan

- New `MonsterKind.KONTORSHCHIK`.
- Medium HP, low speed until paper scent, grab-focused attack.
- Special rule: `documentScent`.
  - Aggro radius increases when player carries tagged documents/forms.
  - Grab can briefly slow document use or mark one carried paper as noisy.
  - Dropping/stashing papers reduces pressure, but may create a lure point.

## Generation And Reachability

- Floor weights: `MINISTRY`, rare `LIVING`.
- Spawn near archives, desks, form queues, cabinet POIs.
- Add normal rumors tied to document handling, not old modifier ids.

## Counterplay

- Fight without a stack of papers in hand.
- Drop a junk form to redirect it.
- Use shelving/office furniture to break grab paths.

## Done

- Document scent uses item tags or ids, not hardcoded one-off imports.
- It appears in Ministry debug/editor catalogs.
- Old `office_zombie` data is obsolete.

## Repeat-Pass Instructions

This file may be run after one or more earlier addmonster workers already touched the tree. Treat existing work for this monster as partial implementation to audit and finish, not as a reason to create a second package.

- First search the current tree for the planned `MonsterKind`, sprite module name, Russian display name, and former variant id or source name when this file lists one.
- If the monster already exists, keep its established ids and file names unless they are clearly broken; complete missing `Done` items instead of replacing the implementation.
- Repair reachability/debug spawning, ecology, rumors, events/log output, bounded AI behavior, and focused tests as needed.
- If `addmonster_43.md` has already removed `monsterVariantId` and `src/data/monster_variants.ts`, do not re-add them. Convert leftover references to direct `MonsterKind`, encounter tags, or authored module state.
- Preserve other addmonster additions in shared files. Resolve duplicates by keeping one canonical entry for this monster and leaving unrelated entries alone.

## Agent Orchestration

- Parallel owner: one GPT-5.5 worker implements only this addmonster file.
- First read: `AGENTS.md`, `README.md`, `architecture.md`, `addmonster_00_index.md`, then this file.
- Write scope: create/modify only the monster package, sprite, authored POI/tests needed for this creature. Do not edit another `addmonster_*.md`.
- Shared files: make only minimal append-style edits for this monster; never reorder or refactor shared registries while other agents are working.
- Forbidden: `monsterVariantId`, `MONSTER_VARIANTS`, `applyMonsterVariant`, prefix-derived stats, or any mechanical subtype system.
- Final report: changed paths, new or existing `MonsterKind`, reachability/debug path, tests run or skipped, whether this was fresh work or repeat completion, and conflicts/TODOs.
