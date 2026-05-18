# AG08 Monster Variants / AI Threats Log

## Session Start

What was wrong: Monster backlog required variants and new threat kinds, but the current registry stopped at ROBOT and had no variant data layer.
What was done: Preflight started. XML prompt, README, design sections, and core monster files were read. Status and rationale files were created.
Cinematic Cheats used: Data-driven definitions and procedural sprites only; no physics or systemic gore layers.
Exact Microseconds saved: Preflight only; runtime delta 0 us.

## Loop 1 Tasks 1-5

What was wrong: Monster registry had no variant layer and no first-priority threats from the monster backlog.
What was done: Added `MonsterVariantDef` registry with 20 variants; appended six monster kinds; created six entity modules with procedural sprites and counterplay metadata.
Cinematic Cheats used: Lamp strength is a local feature-radius check, water behavior is a movement multiplier, wall emergence is adjacent-wall bias, and Nelyud social horror is close-range reveal logic instead of social simulation.
Exact Microseconds saved: Avoided generator-wide variant mutation and per-frame global scans; estimated saved cost versus naive scan/integration is 50-200 us/frame in crowded scenes.

## Loop 2 Tasks 6-10

What was wrong: New enum values needed registry/XP wiring and their behavior needed bounded implementation evidence.
What was done: Registered all new monsters in `MONSTERS` and `MONSTER_SPRITES`, added XP values, exported floor helper pools, added deterministic AG08 scan cadence, fixed Pechateed to do one prioritized cooldown scan, and documented counterplay in README.
Cinematic Cheats used: Document appetite is a target-priority rule, lamp power is a 3-cell local check, and Nelyud reveal is a 6-cell aggression gate.
Exact Microseconds saved: Avoided second Pechateed scan and generator edits; estimated saved cost 100-500 us during heavy entity scenes.

## Loop 3 Tasks 11-13

What was wrong: Ranged behavior and optional debug scope required explicit verification.
What was done: Confirmed Paragraph uses existing ranged monster projectile path; confirmed AG08 did not add gore/render systems; skipped debug spawn edit because `src/systems/debug.ts` is dirty shared work.
Cinematic Cheats used: Ranged paper threat is an existing PSI bolt with a paper sprite, not a new projectile simulation.
Exact Microseconds saved: Avoided a new projectile/render path; estimated saved cost 20-80 us/frame in projectile-heavy scenes.

## Loop 4 Tasks 14-15

What was wrong: README still described 10 monster kinds and an all-monsters debug command.
What was done: Updated README to 22 monster kinds, added AG08 threat/counterplay table, documented the data-only variant registry, and corrected debug spawn wording. Final build passed.
Cinematic Cheats used: Documentation calls out cheap local checks and existing projectile reuse, not simulated systems.
Exact Microseconds saved: Documentation only; runtime delta 0 us.

## Loop 5 Polish Mandate

What was wrong: Post-checklist polish required proving the AG08 changes were not bloated and that enum/table records were exhaustive.
What was done: Read `<POLISH_MANDATE>`, re-read the AG08 registry/variant/AI changes, verified exhaustive `Record<MonsterKind, ...>` tables through TypeScript build, and kept variants readable. No behavior branch was deleted because the only custom branch, Pechateed's prioritized scan, avoids a double scan and is cooldown-gated.
Cinematic Cheats used: All new behavior remains local checks, cooldown target priority, or existing projectile paths.
Exact Microseconds saved: Pechateed single-scan branch avoids an estimated 100-500 us/frame versus naive per-frame or double-scan document hunting.

## Final Report

What was wrong:
- Monster backlog threats SHOVNIK, LAMPOVY, PECHATEED, TUBE_EEL, PARAGRAPH, and NELYUD were absent from `MonsterKind`, entity modules, registries, XP, and documentation.
- No variant data registry existed for cheap modifier-driven monster variants.
- README monster counts and debug wording were stale.

What was done:
- Added `src/data/monster_variants.ts` with 20 readable data-only variant definitions and lookup helpers.
- Appended six `MonsterKind` values and added six entity modules with `DEF`, procedural sprites, floor metadata, loot hints, and counterplay.
- Registered all new monsters in `MONSTERS` and `MONSTER_SPRITES`; auto sprite indexing remains untouched and exhaustive.
- Added XP table entries for all six new kinds.
- Added bounded AI rules: Shovnik wall bias, Lampovy lamp damage, Pechateed document-priority scan, Tube Eel water speed, Paragraph ranged PSI bolt, Nelyud close reveal.
- Exported `NEW_MONSTER_KINDS` and `NEW_MONSTERS_BY_FLOOR` instead of editing parallel-owned floor generators.
- Skipped `debug.ts` because it is dirty shared work.
- Updated README facts and appended this report.

Cinematic Cheats used:
- Wall emergence is adjacency math, not geometry deformation.
- Lamp power is a 3-cell feature check, not lighting simulation.
- Tube Eel water behavior is a speed multiplier, not swimming physics.
- Paragraph uses the existing PSI projectile path.
- Nelyud social horror is a close-range reveal gate, not a social simulation.

Exact Microseconds saved:
- Variant registry kept out of floor generators: 0 us/frame until consumed.
- Pechateed single cooldown scan instead of per-frame inventory scans: estimated 100-500 us/frame saved in crowded worlds.
- Existing projectile reuse for Paragraph: estimated 20-80 us/frame avoided versus a new projectile/render path.
- Local wall/lamp/water checks: expected under 10 us for typical active AG08 threat counts.

Build result:
- Final `npm run build` passed. Vite transformed 157 modules in 776ms.

## Round 2 Final Report

What was wrong:
- Variants were applied by samosbor/debug monster creation, but direct content helper spawns still created base monsters.
- Variant kills did not expose variant identity in kill event data and had no rare loot feedback.
- The dirty tree had strict TypeScript breakage in partially wired samosbor/rumor/void/container integration that blocked Round 2 verification.

What was done:
- Audited spawn paths with `rg`: samosbor corridor/random/fog/fog-boss and debug paths were variant-aware; direct generator/content spawns in maintenance, ministry, living, hell, void, quests, and defense waves were not.
- Integrated variants into two local content helper paths: maintenance `spawnMonstersNear()` and ministry `spawnAdminMonster()`. Eligible floor variants are forced there without changing generator contracts.
- Added a player-kill variant hook: kill events carry `monsterVariantId`/loot hint data, and variant kills have a 16% chance to drop existing flag-matched loot.
- Updated README shipped behavior and `Docs/Tasks/Status_AG08_MONSTERS.md`.
- Completed/fixed narrow compile blockers encountered during required typecheck: duplicate samosbor aftermath stubs, rumor helper duplication, void content manifest call, stale imports, and optional actor inventory handling.

Cinematic Cheats used:
- Variant content integration stays at spawn time; no runtime world scan was added.
- Rare trophies use existing item drops and world events, not a new loot system.
- Aftermath compile repair remains event-bound after rebuild, not per-frame simulation.

Verification:
- Baseline pre-edit `npm run build` passed: 171 modules, 770ms.
- Final `npm run typecheck` passed.
- Final `npm run build` passed: 201 modules, 1.50s.
- Final `npm run check` passed: 25 unit tests, build, and smoke playability (`hudLit=36864`, `webglLit=1024`).
