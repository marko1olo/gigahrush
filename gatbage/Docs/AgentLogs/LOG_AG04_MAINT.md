# AG04 Maintenance Content Pack Report - 2026-05-17

What was wrong:
- Maintenance layer had pipes, canals, generic rooms, existing special NPCs, but no focused pressure/heat/water bureaucracy content pack.
- Existing side quest runtime supports FETCH/KILL side quests only; TALK/VISIT side quest data can be registered but is not offered without a quest-system change outside AG04 write scope.
- Initial polish connectivity test found one generated layout where the diver cache was isolated.

What was done:
- Added `src/gen/maintenance/content_helpers.ts` with local POI stamping, loot, NPC, monster, and forced room-network repair helpers.
- Added `pressure_station.ts`: насосная давления, valve corridor, Борис Давленко, Раиса Клапанная.
- Added `steam_valves.ts`: static steam/heat corridor, Лидия Паровая.
- Added `diver_cache.ts`: second reachable flooded diver stash.
- Added `watermeter_post.ts`: водомерный пост, Сава Водомер, Практикантка Неля.
- Wired all AG04 generators from `src/gen/maintenance/index.ts` at Phase 14e, after zones exist and before final connectivity.
- Registered 8 AG04 side quest definitions, with 6 currently offerable FETCH/KILL quests under the existing side-quest dispatcher.
- Placed 29 explicit item drops using existing item ids.
- Spawned 12 explicit risky-POI monsters with existing zone-level RPG scaling.
- Updated README Maintenance facts only.

Cinematic cheats used:
- Pressure state is room names, lamp layout, water puddles, pipe/metal texture choice, machine/apparatus placement, and NPC lines.
- Steam is implied by lamps, wet floor cells, text, and encounter placement. No particles, no pressure sim, no per-frame update.
- Flooding uses existing `Cell.WATER` and `Tex.F_WATER`; no fluid pressure, propagation, or renderer requirement.

Exact microseconds saved:
- Real pressure/steam/fluid update loop rejected: estimated 100-400 us/frame saved on i3/MX350 versus a naive per-frame cell/particle simulation.
- Static POI storytelling cost: 0 us/frame.
- AG04 generation additions: estimated 2500-7000 us once per maintenance generation, including room reservation, forced connection, loot/NPC/monster creation.
- `forceConnectRoom()` polish fix: estimated below 200 us once per maintenance generation, 0 us/frame.
- Monster scaling for 12 POI monsters: estimated below 500 us once at generation, then normal existing AI cost only.

Verification:
- Baseline `npm run build`: pass, Vite 117 modules, 572 ms.
- Mid-loop builds: pass, Vite 136/138 modules.
- Final/polish `npm run build`: pass, Vite 138 modules, 666 ms.
- Generated maintenance 3 times through a temp esbuild bundle. All AG04 POIs reachable from spawn after polish; 16/16 lifts reachable in all 3 runs.

Residual constraint:
- TALK/VISIT side quest definitions are registered as requested, but current `src/systems/quests.ts` side-quest offer path only emits FETCH/KILL. AG04 did not edit that system because it is outside absolute write scope.

# AG04 Maintenance Content Pack Round 2 Report - 2026-05-17

What was added:
- Added `src/gen/maintenance/overflow_sluice.ts`.
- Wired `generateOverflowSluice()` from `src/gen/maintenance/content_manifest.ts`.
- Added two connected POI rooms: `Аварийная насосная: ручной ремонт` and `Затопленный обводной склад: пломба сорвана`.
- Added 3 named NPCs: Марфа Помпова, Егор Шунтов, Тома Сливная.
- Added 5 side quests: pump repair, tube-eel removal, clamp/tool looting, lampovy removal, and power-panel restart.
- Added 14 explicit item drops and 5 bounded local monsters, bringing AG04 totals to 13 side quests, 43 drops, and 17 POI monsters.

Gameplay hooks:
- Repair path: `ag04_sluice_repair_pump` consumes `door_kit`; completion publishes the existing `quest_completed` event.
- Steal path: the flooded storage room exposes useful tools/energy supplies and Egor frames taking them as unauthorized salvage.
- Flee path: the wet bypass has readable `Cell.WATER` lanes, lamps, and nearby TUBE_EEL/LAMPOVY/POLZUN/SBORKA pressure.
- Production/container hook: the pump room is `RoomType.PRODUCTION` and includes `насосная`, so existing production sees it as technical production and room containers can hold tool supplies.

Cinematic cheats used:
- No pressure, steam, flooding, theft, or repair simulation loop was added.
- Water hazard readability is static: wet floor cells, dry strip, lamps, machines, apparatus, and NPC lines.
- Monster risk is generation-time only through `spawnMonstersNear()`.

Verification:
- Baseline `npm run build`: pass, Vite 171 modules, 767 ms.
- Direct esbuild maintenance-generation bundle: pass; both new rooms and all 3 new NPCs appeared.
- Final `npm run build`: pass, Vite 173 modules, 788 ms.
- `npm run smoke`: pass, `hudLit=36864`, `webglLit=1024`.
- `npm run check`: blocked at `npm run typecheck` by pre-existing modified `src/systems/samosbor.ts` errors outside AG04 write scope: unused aftermath locals and missing `findPlayer`/`applyPendingSamosborAftermath`.
