# AG03 Living Content Pack Log

## 2026-05-17

What was wrong:
- Living floor had existing large modules but lacked the assigned mundane Soviet housing horror POI pack.
- Existing side quest NPC spawns used random floor scans, which is weak discoverability for a 1024x1024 toroidal map.
- Shared side quest generator currently materializes side `FETCH` and `KILL` only; `TALK` and `VISIT` side definitions are data-valid but not runtime-offered without shared engine work.

What was done:
- Added `src/gen/living/soviet_housing_pack.ts`.
- Registered fixed-zone POIs:
  - Zone 18: `Консьержная`.
  - Zone 24: `Радиокружок` with a local `MonsterKind.EYE`.
  - Zone 25: `Комната потерянных вещей` plus `Ниша ремонта гермодверей`.
  - Zone 31: `Общая кухня: спорная`.
- Added six named NPCs using existing occupations/sprites/factions:
  - `ag03_pasha_concierge`
  - `ag03_gleb_radio`
  - `ag03_rita_lostfound`
  - `ag03_semen_hermo`
  - `ag03_tamara_kitchen`
  - `ag03_kirill_runner`
- Registered eight side quest definitions through `registerSideQuest`, including food/medicine fetch, TALK, KILL, and VISIT records.
- Added deterministic POI-first spawn with fallback scan from POI/zone center.
- Wired only owned shared points:
  - `src/gen/living/index.ts` side-effect import.
  - `src/gen/living/side_quests.ts` spawn call.
- Updated README with concise module/quest/POI facts.

Cinematic Cheats used:
- Common kitchen conflict represented by existing `world.stamp` brown floor mark plus a desk prop instead of new renderer decals or physics.
- Radio club threat uses one existing `EYE` monster on frequency theme instead of simulating radio/electromagnetic systems.
- Samosbor risk uses an unprotected volatile connector corridor, not a new hazard system.

Exact Microseconds saved:
- Avoided shared quest-engine edits: estimated 2500 us integration/debug saved now, plus collision risk avoided.
- Avoided new renderer/sprite work for kitchen stain: estimated 4000 us implementation saved; runtime per-frame cost 0 us for new renderer paths.
- Deterministic POI spawn instead of global random scan for AG03 NPCs: estimated 1000-3000 us saved at generation worst-case on low-end i3/MX350.
- Static room stamping instead of procedural simulation: per-frame cost saved estimated >100 us; generation-only cost retained.

Verification:
- Baseline `npm run build` before edits: passed, 596000 us.
- Implementation build after content wiring: passed, 594000 us.
- Final `npm run build`: passed, 607000 us; `dist/index.html` 607.66 kB, gzip 189.61 kB.
- Duplicate side quest id scan returned no duplicate ids.
- Polish build after dead-state removal: passed, 612000 us; `dist/index.html` 608.15 kB, gzip 189.77 kB.
- Reachability runtime check via `/tmp/ag03_living_bundle.mjs`: no missing AG03 rooms, no unreachable AG03 rooms, no missing AG03 NPCs; sampled world had 9156 entities and 10436 rooms.

Integrator note:
- AG03 stayed inside write scope. Existing shared side quest code does not materialize side `TALK`/`VISIT`; AG03 registered the required records but did not edit `systems/quests.ts`.

## 2026-05-17 Round 2

What was done:
- Added `src/gen/living/domkom_laundry_pack.ts`.
- Registered two unused LIVING zone POIs through the manifest/registry path:
  - Zone 39: `Продувочная прачечная`, a protected permanent room with no closable door, a local `POLZUN`, wet floor mark, supplies, and two NPCs. It is intentionally unsafe as a samosbor shelter.
  - Zone 46: `Комната домкома`, a protected household office with a closable door, paperwork/tool drops, and two NPCs.
- Added four named NPCs: Зоя Прачечная, Лев Сиренный, Нина Домком, Арсен Уплотнитель.
- Registered six side quests with existing item ids and existing `FETCH`/`KILL` materialization paths.
- Wired `content_manifest.ts` with a side-effect import and `side_quests.ts` with one fallback spawner entry.
- Seeded NPC rumor memory through existing bounded `learnRumor()` API using static samosbor/airlock rumor ids.
- Updated README with shipped POI and side-quest facts.

Verification:
- Baseline `npm run build` before Round 2 edits: passed; `dist/index.html` 737.40 kB, gzip 227.98 kB.
- Targeted module bundle: `npx esbuild src/gen/living/domkom_laundry_pack.ts --bundle --format=esm --platform=node --outfile=/tmp/ag03r2_module.mjs` passed.
- Targeted generation check `/tmp/ag03r2_check.mjs`: passed. Both rooms generated, all four NPCs spawned, laundry had no door, domkom had one door, and 0 test lift cells were overwritten.
- Final `npm run build`: passed; `dist/index.html` 1,008.44 kB, gzip 305.46 kB.
- Final `npm run typecheck`: passed.

Integrator notes:
- Current LIVING registered zone ids include 3, 7, 12, 13, 14, 18, 24, 25, 31, 32, 38, 42, plus AG03 Round 2 zones 39 and 46.
- AG03 Round 2 used `learnRumor()` instead of direct event observation because it only needed a cheap static rumor seed at spawn time.
