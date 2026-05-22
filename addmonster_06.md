# Addmonster 06: Головной слизень

## Source

- https://samosbor.shoutwiki.com/wiki/Твари

## Current Coverage

No brain parasite that steals a host. `NELYUD` imitates people; `ZOMBIE` infects in zombie-apocalypse floors. Головной слизень should be a visible parasite that can detach and reuse host skills.

## Gameplay Role

High-risk parasite for hospitals, quarantine, and post-samosbor crowd events. It turns a known NPC or corpse into a moving threat, creating a decision between clean execution, quarantine, and risky rescue.

## Visual And Sprite Plan

- New sprite file: `src/entities/head_slug.ts`.
- Silhouette: small floating/attached blob above neck, dangling tendrils, host body underneath for infected state.
- Palette: wet gray-pink, black veins, pale eye spots, host clothing color from seeded faction.
- Procedural generation:
  - Standalone slug: oval head mass with 3 to 6 tendrils.
  - Hosted sprite: reuse humanoid layout logic style, add missing/tilted head gap and hovering parasite.
  - Seeded tendril count and eye clusters.
- Consider two sprite functions: slug-only and hosted, but one `MonsterKind` can use one clear hosted sprite for first pass.

## AI Plan

- New `MonsterKind.HEAD_SLUG`.
- `hostParasite` AI flag:
  - If spawned on corpse/NPC, copies a small skill profile: speed from host occupation/faction tier, weapon preference optional later.
  - On host death, slug attempts a short crawl/flee to nearest corpse or stunned NPC.
  - Rehost attempts are radius-capped and cooldown-capped.
- First implementation can avoid live NPC takeover unless a POI explicitly spawns infected hosts.
- Attack: bite/control lash, low damage but applies panic or slow.

## Generation And Reachability

- Hospital quarantine, fake medpost, Living/Ministry offices after samosbor.
- Procedural zombie-apocalypse floors can spawn one slug in a medical room, not global infection.
- Debug command should spawn slug and optional infected host.

## Systems And Files

- `src/core/types.ts`, `src/entities/monster.ts`, `src/entities/head_slug.ts`.
- `src/systems/ai/monster.ts`: detached/hosted state using `monsterStage` or small optional fields on `Entity`.
- `src/systems/status.ts`: optional parasite panic/infection marker.
- `src/systems/events.ts`: `head_slug_detached`, `head_slug_rehosted`, `head_slug_quarantined`.
- `src/data/monster_ecology.ts`, `src/data/rumors.ts`.
- Tests: rehost cap and no full entity scan.

## Counterplay

- Kill host at range and finish slug before it reaches another body.
- Fire/UV prevents rehost briefly.
- Quarantine container or sealed room can be a non-kill objective.

## Done

- Detach/rehost behavior is bounded.
- Infected host is visually distinct.
- Medical content can reference it without bespoke AI.

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
