# Rationale_AG04_MAINT

## Preflight Decisions
Problem: Agent prompt requires local registry/domain docs that are not present in this checkout.
Solution: Use the prompt-selected mandates as the authoritative maintenance subset and keep edits inside explicit write scope.
Rejected Alternatives: Blocking on absent Windows paths or editing outside scope; both would stop additive content work without evidence.
Scalability potential: Low/Middle/High/Ultra all benefit from static POI content with no new runtime system.
Hardware Impact: i3/MX350 estimate 0.00 ms/frame added before coding; content is generated once, not simulated per frame.

## Loop 2 Decisions
Problem: Maintenance needs pressure/heat/water content without owning renderer, statuses, or event systems.
Solution: Add static POIs using room names, `Feature.LAMP`, `Feature.MACHINE`, `Feature.APPARATUS`, `Cell.WATER`, and NPC quest text as cheap pressure-state devices.
Rejected Alternatives: Real steam particles, pressure fields, valve state machines, or new `Cell` values. Those would add per-frame cost and violate write scope.
Scalability potential: Low uses the same static tiles and no update loop; Middle/High/Ultra can later spend saved cycles on lighting/post FX without changing POI data.
Hardware Impact: i3/MX350 estimate 0.00 ms/frame recurring; one-time generation cost estimated under 0.005 ms amortized over a 60 FPS minute.

Problem: New rooms must not sever the maintenance network or overwrite lifts.
Solution: Stamp only into clear wall space, call local connection helpers and rely on the existing final `ensureConnectivity()` pass.
Rejected Alternatives: Direct edits to shared maze phases or lift placement. Too much blast radius with other agents active.
Scalability potential: Low/Middle/High/Ultra all keep deterministic connectivity repair and avoid dependency on future pathing work.
Hardware Impact: Connectivity cost already exists; AG04 adds a handful of rooms before that pass, estimated negligible compared with the full 1024x1024 BFS.

## Loop 3 Decisions
Problem: Side quest content must exist without changing `src/systems/quests.ts`.
Solution: Register AG04 quest entries through existing `registerSideQuest`; keep currently offerable runtime work to supported FETCH/KILL paths while storing TALK/VISIT data entries for the requested relay/flooded-room beats.
Rejected Alternatives: Editing quest system to add side TALK/VISIT dispatch. That violates the absolute write scope and risks other agents' quest work.
Scalability potential: Low/Middle gets concrete supported quests now; High/Ultra can later activate TALK/VISIT side quest entries with a system-side dispatcher without changing this content pack.
Hardware Impact: Quest definitions are static arrays; 0.00 ms/frame.

Problem: POI monsters must scale with local maintenance danger.
Solution: Use `zoneMap` and `zone.level`, then existing `randomRPG`, `scaleMonsterHp`, and `scaleMonsterSpeed`.
Rejected Alternatives: Fixed monster stats. That ignores local RPG scaling and makes danger inconsistent.
Scalability potential: Low zones stay survivable, Middle/High/Ultra zones automatically buy harder fights with existing RPG math.
Hardware Impact: 12 explicit monsters add existing AI cost only as normal entities; no custom scanner or per-frame controller added.

Problem: Large POIs may not fit in untouched wall pockets because the maintenance maze carves every six cells.
Solution: Prefer clear wall pockets, then reserve no-lift/no-protected rectangles and rely on the final connectivity repair.
Rejected Alternatives: Blind overwrite fallback or moving lift placement. Blind overwrite can hit lifts; lift edits are outside scope.
Scalability potential: Low/Middle/High/Ultra generation remains robust under random layouts.
Hardware Impact: Reservation scan is generation-time only; estimated below 5000 us worst case on low-end CPU.

## Loop 4 Decisions
Problem: Documentation must report implemented facts only.
Solution: Add one concise README bullet under Maintenance generation with POI names, quest definition count, explicit drop count, monster count, and no real-time steam/fluid simulation.
Rejected Alternatives: Rewriting the whole maintenance section or adding roadmap mechanics. Those would create fake scope.
Scalability potential: Low/Middle/High/Ultra documentation remains factual; future renderer/system work can extend it later.
Hardware Impact: 0.00 ms/frame.

Problem: ID/name collisions are likely with many agents.
Solution: Prefix all new quest/NPC ids with `ag04_`; keep visible NPC and room names in Russian.
Rejected Alternatives: Generic ids like `pressure_boris` or editing central registries. Prefixing is enough and local.
Scalability potential: Low/Middle/High/Ultra all benefit from collision-free content registration.
Hardware Impact: 0.00 ms/frame.

## Loop 5 Polish Decisions
Problem: Polish connectivity test found the diver cache isolated in one generated maintenance layout.
Solution: Add local `forceConnectRoom()` in `content_helpers.ts`, called after every AG04 stamped room. It carves the shortest no-lift path from the room border to an existing unprotected walkable tile before the global connectivity pass.
Rejected Alternatives: Editing shared `ensureConnectivity()`, moving lift placement, or trusting the global pass without evidence. Shared edits are outside scope; the failed test proved trust was not enough.
Scalability potential: Low devices get reliable reachability with a tiny generation-time carve; Middle/High/Ultra preserve the same topology and can layer visuals later.
Hardware Impact: Generation-time scan over four 80-cell rays per AG04 room; estimated below 200 us total on i3/MX350, 0.00 ms/frame.

Problem: Polish mandate required removing overbuilt pressure abstractions.
Solution: Kept pressure/steam as static cinematic cheats only: no update loop, no pressure state object, no particle system, no renderer hook.
Rejected Alternatives: Adding dynamic valves or steam emitters. They would spend frame time without creating necessary gameplay in this write scope.
Scalability potential: Low/Middle get stable cheap visual readability; High/Ultra can later add optional visual overkill from renderer-owned systems.
Hardware Impact: 0.00 ms/frame.
