# AG08 Monster Variants / AI Threats Status

Agent: AGENT_08_MONSTER_VARIANTS_AI
Domain: Monster Variants / AI Threats
Task count: 15

## Relevant Mandates Identified Before Coding

- Readable threat, counterplay, floor connection, cheap AI.
- Predictable beats realistic.
- No physics or continuous simulation for monster gimmicks.
- Hot AI loops must be bounded with flags, range checks, and cooldowns.
- Definition-driven monster data over scattered hardcoded behavior.
- Existing sprite index is auto-computed; preserve enum append order only.

## Baseline Notes

- Existing `MonsterKind` order before AG08: SBORKA, TVAR, POLZUN, BETONNIK, ZOMBIE, EYE, NIGHTMARE, SHADOW, REBAR, MATKA, IDOL, MANCOBUS, HERALD, CREATOR, SPIRIT, ROBOT.
- Existing sprite indices are auto-derived in `src/render/sprite_index.ts` from NPC counts plus `MonsterKind` ordinal order.
- Existing AI behaviors: target cache + periodic scan, player preference under 15 cells, ranged projectile path for ranged defs, melee under 1.2 cells, phasing direct movement, Matka 60s local child spawn cap.
- Existing XP table covers all pre-AG08 monsters only.

## Round 2

- XML block `AGENT_08_MONSTER_VARIANTS_AI` identified from `Docs/AgentPrompts/AGENT_08_MONSTER_VARIANTS_AI.md`.
- Required docs/code preflight read: `README.md`, `architecture.md`, `src/core/types.ts`, `src/entities/monster.ts`, `src/data/monster_variants.ts`, `src/systems/ai/monster.ts`, `src/systems/samosbor.ts`, `src/systems/rpg.ts`, and local floor content helpers.
- Baseline `npm run build` before Round 2 edits passed; Vite transformed 171 modules in 770ms.
- Spawn path audit: variants already applied through samosbor corridor/random/fog/fog-boss creation and debug spawning. Direct content/generator spawns in maintenance, ministry, living, hell, void, quests, and main defense waves were still base monsters unless they called those helpers.
- Implemented variant-aware content integration in two narrow helper contexts: `spawnMonstersNear()` for maintenance POI threats and `spawnAdminMonster()` for ministry admin threats. Both force eligible floor variants without changing base generator contracts.
- Added rare player kill loot hook for variant monsters: player kill events include `monsterVariantId` data, and variant kills have a small chance to drop existing item loot keyed by variant flags.
- No new `MonsterKind` values or renderer systems were added in Round 2.
- Final Round 2 verification passed: `npm run typecheck`; `npm run build` transformed 201 modules in 1.50s; `npm run check` passed with 25 unit tests, final build, and smoke playability.

## Checklist

- [x] 1. Record existing monster enum order, sprite indices, AI behaviors, and XP table. DOD: preflight notes list enum order, auto sprite model, target scan model, and XP gap. Rejected: manual sprite index table. Estimate: 0 us runtime.
- [x] 2. Add `MonsterVariantDef` data registry for modifiers on existing monsters. DOD: `src/data/monster_variants.ts` defines hp/speed/dmg multipliers, flags, floors, loot hints. Rejected: patching generators per variant. Estimate: 0 us/frame.
- [x] 3. Add at least 20 variant defs. DOD: 20 data-only variants added. Rejected: procedural runtime mutation pass. Estimate: 0 us/frame until consumed.
- [x] 4. Add at least 5 new monster kinds from required list. DOD: 6 append-only enum values added: SHOVNIK, LAMPOVY, PECHATEED, TUBE_EEL, PARAGRAPH, NELYUD. Rejected: inserting enum values before existing kinds. Estimate: 0 us/frame.
- [x] 5. Create entity module and sprite generator for each new monster. DOD: six new `src/entities/` modules with `DEF` and procedural sprite generator. Rejected: shared visual subsystem. Estimate: sprite generation load-time only.
- [x] 6. Update `MONSTERS`, `MONSTER_SPRITES`, sprite index compatibility, and XP table. DOD: registry maps all 22 enum values; sprite index remains auto-counted; XP entries added. Rejected: manual `sprite_index.ts` constants. Estimate: 0 us/frame.
- [x] 7. Add bounded AI behavior flags where needed. DOD: wall/lamp/document/water/ranged/close-reveal behavior handled in `systems/ai/monster.ts`. Rejected: new subsystem or per-frame global scans. Estimate: local checks only; target scans stay cooldown-gated.
- [x] 8. Keep behavior deterministic and bounded. DOD: AG08 special target scans use fixed cadence; Pechateed does one prioritized cooldown scan; local wall/lamp/water checks are radius/adjacency bounded. Rejected: random cadence for new special behaviors. Estimate: below 10 us typical active threat set.
- [x] 9. Expose floor spawn helper arrays instead of editing unowned floor generators. DOD: `NEW_MONSTER_KINDS` and `NEW_MONSTERS_BY_FLOOR` exported from `src/entities/monster.ts`. Rejected: editing parallel-owned generators. Estimate: 0 us/frame.
- [x] 10. Add counterplay rules. DOD: each new `DEF` has `counterplay`; README has a factual counterplay table. Rejected: hidden mechanics with no player-facing rule. Estimate: 0 us/frame.
- [x] 11. Use existing projectile systems if ranged. DOD: `PARAGRAPH` uses `isRanged`, `projSpeed`, and auto-assigned `Spr.PSI_BOLT`; no new projectile code. Rejected: custom projectile subsystem. Estimate: 0 us beyond existing projectile path.
- [x] 12. Avoid gore/visual systems outside sprite generation. DOD: new visuals are only six sprite generators; no render/blood/marks edits by AG08. Rejected: gore/decals for threat identity. Estimate: 0 us/frame extra systems.
- [x] 13. Optional debug spawn update if safe. DOD: skipped because `src/systems/debug.ts` is already dirty from parallel/shared work; AG08 did not touch it. Rejected: editing dirty shared debug list. Estimate: 0 us/frame.
- [x] 14. README factual update. DOD: README now states 22 monster kinds, lists six AG08 threats, counterplay, and variant registry facts. Rejected: documenting unintegrated floor spawns as active. Estimate: 0 us/frame.
- [x] 15. Build and fix own errors. DOD: final `npm run build` passed after README/code changes; Vite transformed 157 modules in 679ms. Rejected: stopping at TypeScript-only assumption. Estimate: build-time validation.

## Iteration Log

- Loop 0 / Preflight: XML extracted by CLI, README read, mandated design sections read, mandated code files read. Missing local `.agents-skills`, AGENTS.md, domain file, and POLISH.txt in this checkout.
- Loop 1 / Tasks 1-5: Variant registry and six new monster modules implemented. `npm run build` passed after implementation; Vite transformed 150 modules in 662ms.
- Loop 2 / Tasks 6-10: Registries, XP, bounded AI, helper floor pools, and README counterplay audited. `npm run build` passed; Vite transformed 157 modules in 698ms.
- Loop 3 / Tasks 11-13: Ranged/projectile path, visual scope, and debug safety audited with `rg`; debug spawn update skipped due dirty shared file.
- Loop 4 / Tasks 14-15: README factual update verified and `npm run build` passed; Vite transformed 157 modules in 679ms.
- Loop 5 / Polish: `<POLISH_MANDATE>` read after 100% checklist. Re-read AG08 code paths; exhaustive `Record<MonsterKind, ...>` tables compile; no over-complex AG08 branch removed because Pechateed's custom scan prevents a second scan and remains cooldown-gated. `npm run build` passed; Vite transformed 157 modules in 776ms.
