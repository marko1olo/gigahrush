# Status_AG06_KV

Agent: AGENT_06_KVARTIRY_SOCIAL_CONTENT  
Domain: Kvartiry / Social Unrest Content  
Task Count: 13

## Mandates Identified

- Social content only: add POIs/NPCs/quests, not a new simulation loop.
- Existing faction enum only: CITIZEN, LIQUIDATOR, WILD, CULTIST, SCIENTIST.
- No dependency on rumor/memory agent or future event systems.
- Keep spawn counts within Kvartiry caps and intervals.
- Use room metadata/current RoomType patterns; do not expand enums for one-off POIs.
- Preserve generator architecture; only import/call content modules and add bounded uprising tuning.

## Preflight

- [x] README.md read by CLI. DOD: full CLI read started before prompt parsing; alternative rejected: relying on cached summary. Estimate: 1200 us.
- [x] Agent XML prompt extracted cover-to-cover by id. DOD: `awk` exact tag extraction; alternative rejected: manual copy. Estimate: 400 us.
- [x] Required desdoc sections read. DOD: sections 7, 8, 11, 13.2, 52 loaded; alternative rejected: reading only headings. Estimate: 1800 us.
- [x] Required source files read. DOD: initial pass over Kvartiry generator, content modules, AI index, plot registry; alternative rejected: editing from assumptions. Estimate: 2200 us.
- [x] Baseline build run. DOD: `npm run build` passed before implementation; alternative rejected: assuming current HEAD compiles. Estimate: 612000 us.

## Task Checklist

- [x] 1. Document current Kvartiry generator phases and population caps. DOD: recorded phase/cap facts below from `src/gen/kvartiry/index.ts`; alternative rejected: vague README-only summary. Estimate: 2400 us.
- [x] 2. Add `ration_queue.ts`. DOD: protected reachable ration office with queue NPCs, water/food drops, quest registration; alternative rejected: global ration simulation. Estimate: 1800 us.
- [x] 3. Add `print_room.ts`. DOD: protected illegal print room with forged-paper dialogue, note/book/ballot drops, quest registration; alternative rejected: new document item types. Estimate: 1700 us.
- [x] 4. Add `barricade.ts`. DOD: protected corridor room with partial metal wall and gap left passable; alternative rejected: sealing a real generator corridor. Estimate: 1600 us.
- [x] 5. Add `communal_kitchen_feud.ts`. DOD: protected kitchen POI with CITIZEN/WILD/CULTIST/LIQUIDATOR presence and two quest hooks; alternative rejected: faction enum expansion. Estimate: 2100 us.
- [x] 6. Add at least 6 named NPCs and 5 side quests via `registerSideQuest`. DOD: 6 quest NPCs and 6 side quests registered; alternative rejected: generic random quest generation. Estimate: 2600 us.
- [x] 7. Add bounded dynamic uprising hook inside `updateKvPopulation`. DOD: `tryKvSocialPressureUprising` runs only on 30s uprising tick, picks one POI, converts max 2-5 nearby non-plot citizens; alternative rejected: per-frame unrest scan. Estimate: 1500 us.
- [x] 8. Add at least 25 item drops using existing food, water, tools, notes. DOD: 38 authored drops across social POIs, all existing item IDs; alternative rejected: new item definitions. Estimate: 1200 us.
- [x] 9. Add at least 35 original dialogue lines. DOD: 42 authored PlotNpcDef dialogue/post lines; alternative rejected: procedural filler strings. Estimate: 3000 us.
- [x] 10. Ensure all POIs are reachable and do not break lifts. DOD: POIs use `findClearArea` all-wall placement plus `connectProtectedRoom`; generated after lift placement and refuses non-wall lift cells. Estimate: 1900 us.
- [x] 11. Keep spawn counts within existing caps. DOD: content adds 19 named/ambient NPCs on top of 600 initial NPCs, below 1000/1000/500 caps; runtime replenishment caps unchanged. Estimate: 900 us.
- [x] 12. README factual update. DOD: added Kvartiry architecture entries, side-quest rows, and riot-floor POI/cap facts; alternative rejected: marketing prose. Estimate: 1700 us.
- [x] 13. Build and fix own errors. DOD: `npm run build` passed after README/code/log changes; `npx tsc --noEmit` has one unrelated AG03 unused-parameter error outside AG06 scope. Estimate: 639000 us.

## Iteration Log

- Loop 0: Preflight complete. Registry/domain Windows paths are absent in this checkout; using local prompt, README, desdoc, and source as evidence. Baseline build passed in 612 ms.
- Loop 1: Tasks 1-5 implemented and build passed in 625 ms. Assignment XML re-extracted after first batch.
- Loop 2: Tasks 6-11 implemented, including lost child corner from content direction. Build passed in 622 ms. Assignment XML re-extracted after second batch.
- Loop 3: Own helper/social-pressure code reread. Found no AG06 type errors; `npx tsc --noEmit` fails only on unrelated `src/gen/living/soviet_housing_pack.ts:490`.
- Loop 4: Count audit with `rg`: 6 AG06 `registerSideQuest` calls, 6 quest NPC defs, 38 drops, 42 dialogue/post lines.
- Loop 5: Final build gate passed in 639 ms. Worktree contains many parallel-agent changes outside AG06 scope; no rollback performed.

## Social Content Counts

- POIs: ration queue, illegal print room, barricaded stairwell, communal kitchen feud, lost child corner.
- Registered quest NPCs: Галина Талонница, Дима Печатник, Карпов Баррикадный, Рая Сковородкина, Санёк Конфорка, Вера Потеряшкина.
- Side quests: `kv_ration_water`, `kv_print_notes`, `kv_barricade_tools`, `kv_kitchen_kasha`, `kv_sanek_cigs`, `kv_lost_child_rations`.
- Authored item drops: 38 total.
- Authored dialogue/post lines: 42 total.
- New recurring work: 0 per-frame; social uprising runs only inside existing 30-second uprising cadence.

## Kvartiry Generator Facts

- Phase 0 fills the 1024x1024 toroidal floor as `Cell.FLOOR` with panel/lino defaults.
- Phases 1-4 grow a wall source grid at `WALL_L = 4`, open/close doors for connectivity, then register doors.
- Phase 5 flood-fills rooms and assigns existing `RoomType` weights: living, kitchen, bathroom, smoking, storage, common, corridor, office.
- Phase 6 creates 64 zones and levels; phase 6b runs connectivity from center.
- Phase 7 places 16 up and 16 down lifts before light baking.
- Phase 9 initial population: 300 citizens, 200 wild, 100 liquidators.
- Population caps: `CITIZEN_CAP = 1000`, `WILD_CAP = 1000`, `LIQUIDATOR_CAP = 500`.
- Runtime spawning checks every `SPAWN_INTERVAL = 2.0` seconds; generic uprising check every `UPRISING_CHECK_INTERVAL = 30` seconds.
- Existing generic uprising converts unprotected nearby citizens to WILD around a random citizen and redirects nearby liquidators.

## Round 2

- [x] Prompt extracted/read from `Docs/AgentPrompts/AGENT_06_KVARTIRY_SOCIAL_CONTENT.md`.
- [x] Required source/doc preflight read: `README.md`, `architecture.md`, Kvartiry manifest/helpers/pressure, existing Kvartiry POIs, `src/data/plot.ts`, `src/systems/events.ts`.
- [x] Baseline `npm run build` passed before edits in 855 ms.
- [x] Added `src/gen/kvartiry/medicine_swap.ts`: protected `RoomType.MEDICAL` POI named `Аптечный разменник`, registered with bounded social pressure through `createSocialPoiRoom(..., pressure 1.9)`.
- [x] Added four named quest NPCs: Нина Таблеткина (`CITIZEN`), Руднев Перевязочный (`LIQUIDATOR`), Лёха Меняла (`WILD`), Серафима Шептунья (`CULTIST`).
- [x] Added four side quests: `kv_medicine_children`, `kv_liquidator_bandages`, `kv_wild_antidep_swap`, `kv_cultist_silent_pills`.
- [x] Added scarce stolen-medicine decision surface: local `pills`, `bandage`, and `antidep` drops are claimed by competing factions; giving tablets to children/cultists or bandages to liquidators consumes the same local medical stock and changes the rewarded faction relation through existing quest completion.
- [x] Visible consequence uses existing event flow: accepting/completing these side quests publishes `quest_created`/`quest_completed` events through `systems/quests.ts`.
- [x] Manifest updated via `src/gen/kvartiry/content_manifest.ts`; no Kvartiry population cap or global loop changes.
- [x] README factual update: module list, side-quest table, Kvartiry POI paragraph.
- [x] Verification: `npm run typecheck` and `npm run check` are blocked by unrelated existing `src/systems/samosbor.ts` errors (`knownSamosborTime`, aftermath variables, missing `findPlayer`, missing `applyPendingSamosborAftermath`). Final `npm run build` passed in 825 ms.
