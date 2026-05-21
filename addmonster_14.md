# Addmonster 14: Мухожук

## Source

- https://samosbor.shoutwiki.com/wiki/Мухожук

## Current Coverage

No parasite that degrades leadership/hosts. Existing zombies and head-slug plan cover possession differently. Мухожук is more social: infected officials consume, lose judgment, and become dangerous hosts.

## Gameplay Role

Rare parasite-host in Ministry, liquidator, and faction-event content. It should turn a trusted authority or guarded NPC into a bad decision generator before combat.

Player decision: expose infection, quarantine, assassinate, or exploit the infected leader's bad orders.

## Visual And Sprite Plan

- New sprite file: `src/entities/mukhozhuk.ts`.
- First pass can represent the exposed parasite-host, not the invisible larva.
- Silhouette: bloated official/liquidator body, head swollen under cap/helmet, beetle legs protruding from neck/back.
- Palette: sick gray skin, brown-black carapace, oily green highlights.
- Procedural generation:
  - Humanoid body with oversized head/upper back.
  - Beetle wing plates on skull/back.
  - Thin insect legs emerging around collar.
  - Host clothing states: official coat, liquidator coat, worker shirt.

## AI Plan

- New `MonsterKind.MUKHOZHUK_HOST`.
- `parasiteLeader` AI flag:
  - Before reveal, can be an NPC state/quest condition rather than monster.
  - On reveal, host becomes monster with erratic pursuit and summons/commands nearby weak NPCs only if they are already hostile/cult/guard and within radius.
  - Appetite behavior: seeks food/alcohol containers in idle state, damaging economy/containers as event.
- Do not let it globally corrupt all leadership.

## Generation And Reachability

- Ministry office, faction event, liquidator archive, black-market contraband audit.
- Use rare event, not generic corridor spawn.
- Debug command: infect nearest NPC or spawn exposed host.

## Systems And Files

- `src/core/types.ts`, `src/entities/monster.ts`, `src/entities/mukhozhuk.ts`.
- `src/systems/faction_events.ts`: optional infection event later.
- `src/systems/ai/monster.ts`: erratic host and local command pulse.
- `src/systems/events.ts`: `mukhozhuk_exposed`, `mukhozhuk_food_spoiled`.
- `src/data/rumors.ts`: symptoms and audit leads.
- Tests: command pulse radius cap, no broad NPC scan.

## Counterplay

- Watch behavior: irrational orders, food/alcohol hoarding.
- Expose with medical/scientific item or witness.
- Kill parasite host before it reaches guards.
- Quarantine preserves evidence but takes time.

## Done

- Has social pre-reveal and combat reveal.
- Does not become a universal infection simulator.
- One Ministry route can surface it.

## Agent Orchestration

- Parallel owner: one GPT-5.5 worker implements only this addmonster file.
- First read: `AGENTS.md`, `README.md`, `architecture.md`, `addmonster_00_index.md`, then this file.
- Write scope: create/modify only the monster package, sprite, authored POI/tests needed for this creature. Do not edit another `addmonster_*.md`.
- Shared files: make only minimal append-style edits for this monster; never reorder or refactor shared registries while other agents are working.
- Forbidden: `monsterVariantId`, `MONSTER_VARIANTS`, `applyMonsterVariant`, prefix-derived stats, or any mechanical subtype system.
- Final report: changed paths, new `MonsterKind`, reachability/debug path, tests run or skipped, and conflicts/TODOs.
