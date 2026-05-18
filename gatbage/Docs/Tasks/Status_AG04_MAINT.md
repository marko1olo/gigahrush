# Status_AG04_MAINT

Agent: AGENT_04_MAINTENANCE_CONTENT_PACK
Domain: Maintenance / Heat / Water Content
Task count: 14

## Preflight
- [x] README.md read by CLI.
- [x] XML prompt extracted cover-to-cover by id.
- [x] Required source/design files read by CLI.
- [x] Baseline build recorded: `npm run build` passed, Vite 117 modules, 572 ms.
- [x] Final build recorded: `npm run build` passed, Vite 138 modules, 666 ms after polish fix.

## Mandates Identified
- Content modules must be local and additive.
- Cheap visual fakes over fluid/steam simulation.
- Maintenance must remain connected.
- No dependency on status/economy/event agents.
- No new Cell values or renderer requirements.
- Preserve lift placement and shared generator ownership.

Note: local `.agents-skills/` and `Docs/Actual Domains of Project.txt` are absent in this checkout; prompt-selected mandates are used as authoritative local registry subset.

## Tasks
- [x] 1. Document current Maintenance generation phases and safe insertion points.
- [x] 2. Add `pressure_station.ts` POI with pump room, valve corridor, and two NPCs.
- [x] 3. Add `steam_valves.ts` POI using cheap visual cues; no per-frame steam.
- [x] 4. Add `diver_cache.ts` or extend existing diver content with a second reachable flooded stash.
- [x] 5. Add `radio_repeater.ts` or `watermeter_post.ts` POI with a named quest giver.
- [x] 6. Add at least 5 side quests via `registerSideQuest`.
- [x] 7. Place at least 20 item drops across POIs using existing item ids.
- [x] 8. Spawn at least 12 monsters near risky POIs with zone-level scaling copied from local patterns.
- [x] 9. Use local helper functions for carving/room registration; do not move shared generator code.
- [x] 10. Ensure all new POIs connect to floor network and preserve lifts.
- [x] 11. Keep all new ids unique and names in Russian.
- [x] 12. Add cheap pressure state visual storytelling device.
- [x] 13. README: concise facts only.
- [x] 14. Build and fix own errors.

## Loop 1 Notes
- Started preflight. No code edits yet.
- Baseline build passed before implementation. DOD practice: fail-fast baseline before attribution. Alternative rejected: coding before knowing current build state. Estimate: 0 us/frame.

## Loop 2 Notes
- Tasks 1-5 implemented in new local modules: `content_helpers.ts`, `pressure_station.ts`, `steam_valves.ts`, `diver_cache.ts`, `watermeter_post.ts`.
- DOD practice: additive module boundaries, existing `Cell.WATER`/`Tex.PIPE`/features only, no renderer/system dependency.
- Alternative rejected: adding pressure/steam runtime systems; static POI storytelling satisfies task at 0 us/frame recurring cost.
- Microsecond estimate: generation-time only, roughly 2000-5000 us total per floor generation on low-end CPU, 0 us/frame.
- Verification: `npm run build` passed after tasks 1-5, Vite 136 modules, 620 ms.

## Loop 3 Notes
- Tasks 6-10 verified: 8 registered AG04 side quest entries; 29 explicit AG04 drops; 12 explicit AG04 risky-POI monsters; local helper module owns stamping/loot/NPC/monster utilities.
- DOD practice: copied local zone-level monster scaling path (`zoneMap` -> `zone.level` -> `randomRPG`/`scaleMonsterHp`/`scaleMonsterSpeed`).
- Alternative rejected: new quest dispatcher, new status effects, or shared generator movement; outside write scope and unnecessary for supported FETCH/KILL quests.
- Microsecond estimate: 12 extra monsters use existing AI cost only when active; spawn-time scaling under 500 us total, no custom per-frame system cost.
- Verification: bundled and executed `generateMaintenance()` 3 times via esbuild temp module; all AG04 rooms and 3 named AG04 quest NPCs appeared. `npm run build` passed, Vite 138 modules, 642 ms.

## Loop 4 Notes
- Tasks 11-14 complete: AG04 ids use `ag04_` prefix, in-game room/NPC names are Russian, pressure states are encoded in room names/layout/NPC lines, README has concise implemented facts.
- DOD practice: README updated only after implementation and verification; build run after README edit.
- Alternative rejected: broader README rewrite or design-roadmap additions; not implemented facts.
- Microsecond estimate: README/id/name work has 0 us runtime impact.
- Verification: `npm run build` passed, Vite 138 modules, 643 ms.

## Loop 5 Polish Notes
- Polish mandate read after 100% task completion.
- Anti-bloat check: no pressure/steam runtime abstractions, no timers, no renderer hooks, no new cell type.
- Defect found: one generated run isolated the diver cache. Fixed by adding local `forceConnectRoom()` corridor repair inside AG04 helper.
- Verification: `npm run build` passed, Vite 138 modules, 666 ms; 3 generated maintenance runs had all AG04 POIs reachable and 16/16 lifts reachable.

## Round 2
- [x] Prompt block `AGENT_04_MAINTENANCE_CONTENT_PACK` re-read by id; README, architecture, maintenance manifest/helpers/index, pressure/steam modules, production, and events inspected.
- [x] Baseline `npm run build` passed before edits, Vite 171 modules, 767 ms.
- [x] Added `overflow_sluice.ts`: аварийная насосная + затопленный обводной склад.
- [x] Added repair/steal/flee loop: Марфа offers pump repair, Егор frames taking tools as theft, flooded bypass contains useful supplies and local monsters.
- [x] Added 3 named NPCs: Марфа Помпова, Егор Шунтов, Тома Сливная.
- [x] Added 5 offerable side quests, all FETCH/KILL so existing side-quest runtime can emit them.
- [x] New pump room is `RoomType.PRODUCTION` and named `насосная`, so existing production resolves it as technical production and containers can seed tool supplies.
- [x] Repair completion uses the existing `quest_completed` event path with `sideQuestId: ag04_sluice_repair_pump`.
- [x] Flooded bypass uses existing `Cell.WATER`, lamps, shelf/apparatus cues, and 5 bounded nearby monsters; no per-frame scan or fluid simulation.
- [x] README updated with shipped facts: 13 side quests, 43 explicit drops, 17 local POI monsters.
- [x] Direct maintenance generation bundle found both new rooms and all 3 new NPCs.
- [!] `npm run check` blocked during typecheck by existing modified `src/systems/samosbor.ts` errors outside AG04 write scope: unused aftermath locals plus missing `findPlayer`/`applyPendingSamosborAftermath`.
- [x] Fallback verification: final `npm run build` passed, Vite 173 modules, 788 ms; `npm run smoke` passed with `hudLit=36864`, `webglLit=1024`.
