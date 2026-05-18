# Rationale_EXP06_SCHOOL

## Decision 1: Registry Missing, Mandates Still Applied

Problem: The instruction required reading `.agents-skills/`, but `/Users/jirnyak/Mirror/gigahrush/.agents-skills` does not exist.

Solution: Used direct filesystem evidence, recorded absence, and applied relevant mandates from the user-provided AGENTS block: domain boundary, simultaneous execution, cinematic cheat, frame-time dictatorship, Math LOD, Black Box, file-based reporting.

Rejected Alternatives: Inventing mandate names or reading unrelated agent files would create fake compliance. Standard "continue silently" was rejected because the missing registry affects authorization evidence.

Scalability potential: Low devices get bounded group logic and no crowd sim; middle gets two to three groups; high gets social/event consequences; ultra spends saved cycles on visual density and sound, not more AI.

Hardware Impact: On i3/MX350-class hardware, avoiding per-child crowd AI can save hundreds of microseconds during evacuation spikes and prevents frame-time cliffs.

## Decision 2: School As LIVING POI, Not New Floor

Problem: Expansion 06 has school fantasy, but the expansion index forbids marking a big floor before playable room/pocket MVP.

Solution: `implementation_plan.md` locks MVP to one large `LIVING` POI or pocket via zone-content style integration. New `FloorLevel.SCHOOL` is explicitly rejected until the loop is proven.

Rejected Alternatives: A full school floor would multiply generation, navigation, save/load and debug scope before the mechanic exists. A pure note/quest-only school was also rejected because it would not satisfy playable evacuation.

Scalability potential: Low uses one POI and one group; middle adds route branches; high adds parent/faction reactions; ultra adds denser props and soundscape without changing logic class.

Hardware Impact: One POI keeps generation and runtime local. Expected runtime overhead outside active events is effectively zero; active event tick target stays below 50-200 us depending tier.

## Decision 3: Grouped Evacuation Instead Of Per-Child NPC Simulation

Problem: The fantasy demands children evacuating, but individual NPC pathfinding for a class would fight existing A-Life and scale badly.

Solution: `integration_contract.md` defines `SchoolEvacGroupState` with count, panic, route state and leader. Only key NPC like Pasha or Nina are normal entities; class groups are aggregates.

Rejected Alternatives: Standard Unity/crowd-style individual agents, per-child BFS, collision steering, or a new A-Life goal were rejected because the project is TypeScript raycaster with preallocated BFS and strict frame budget.

Scalability potential: Low: one group and one route. Middle: three groups and alternate route. High: event/memory consumers. Ultra: visual crowd clusters and audio while logic remains aggregate.

Hardware Impact: On i3/MX350, replacing 12-25 pathing NPC with one aggregate avoids repeated BFS and collision checks. Estimated saved time during active evacuation: 500 us or more in worst crowd cases.

## Decision 4: Precomputed Room Routes

Problem: Evacuation needs route choice and blocked doors, but dynamic pathfinding every tick is unnecessary.

Solution: Routes are small arrays of room/door nodes generated with the school POI. Fallback allows one BFS per group per event, never per frame.

Rejected Alternatives: Generic pathfinding each tick was too expensive and harder to debug. Pure teleport outcome was too fake because the player needs decisions around doors and route risk.

Scalability potential: Low has a single route. Middle adds one alternate. High/ultra can add route risk overlays, not more algorithmic complexity.

Hardware Impact: Precomputed route node advancement is constant-time. Expected event tick cost is tens of microseconds, dominated by event publication and debug formatting only when requested.

## Decision 5: Micro-Perks Are Local, Small, And Bounded

Problem: Lessons must reward players without turning the school into a superhero tutorial or global samosbor predictor.

Solution: Manifest defines tiny perks: earlier school warning, faster school hermetic interaction, reduced school panic, emergency ration wait, radio false/silent classification.

Rejected Alternatives: Combat boosts, permanent speed, global fog immunity and guaranteed samosbor prediction were rejected because they damage survival horror and global balance.

Scalability potential: Low devices pay no extra cost except simple condition checks. Middle/high can expose more feedback and dialogue. Ultra can visualize lesson consequences with posters/journal changes.

Hardware Impact: Integer flag checks are negligible, estimated under 5 us per active event tick.

## Decision 6: Debug And Black Box Are First-Class

Problem: Group evacuation can fail from route ids, door state, panic thresholds or world regeneration. Without telemetry, failure would be ambiguous.

Solution: Plan and contract require debug commands plus a 300-entry fixed circular telemetry buffer for future code, dumped to `Docs/AgentLogs/Dump_EXP06_SCHOOL.bin` on impossible state.

Rejected Alternatives: Relying on HUD logs or ad hoc console messages was rejected because they cannot reconstruct route/panic/door history.

Scalability potential: Low keeps compact telemetry. Middle/high/ultra add more fields only if fixed-size and bounded. Visual overkill remains cosmetic.

Hardware Impact: Fixed buffer writes are predictable and cheap. Estimated cost is about 5 us per active tick, with no allocation spikes.

## Decision 7: Documentation-Only Work Keeps README Untouched

Problem: User explicitly forbade editing code, README, desdoc, root expansion, index and other expansion folders.

Solution: Created only files in `Docs/Expansions/06_obzh_school/**`, `Docs/Tasks/Status_EXP06_SCHOOL.md`, `Docs/AgentLogs/Rationale_EXP06_SCHOOL.md`, and `Docs/AgentLogs/LOG_EXP06_SCHOOL.md`.

Rejected Alternatives: Updating index or README would violate scope. Implementing code would collide with other agents and exceed requested planning work.

Scalability potential: Clean scoped docs let future implementation split by contracts without cross-agent merge damage.

Hardware Impact: No runtime impact because no code changed.

