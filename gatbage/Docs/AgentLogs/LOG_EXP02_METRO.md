# LOG_EXP02_METRO

## 2026-05-17

What was wrong: EXP02 had only the high-level `expansion.md`. It did not yet have a phased implementation plan, bounded content manifest or explicit integration contract. Without those, future code agents could overbuild a permanent metro floor, create direct dependencies on numbered floors/archive/market systems, or make wrong exits feel like broken teleports.

What was done: Created `Docs/Expansions/02_metro_error_line/implementation_plan.md`, `content_manifest.md` and `integration_contract.md`. Created `Docs/Tasks/Status_EXP02_METRO.md` and `Docs/AgentLogs/Rationale_EXP02_METRO.md`. This log records the final report in the required agent-log path.

Cinematic Cheats used: Metro travel is specified as deterministic route state plus timer, not physical rail simulation. Crowds are capped NPCs plus text/sound/silhouettes. Ultra visuals are fake parallax, flicker and brightness pulses, not simulated tunnels. Wrong-exit horror is driven by warning content, route seed and log evidence.

Exact Microseconds saved: Avoided continuous rail/tunnel/path simulation estimated at 100-500 us per frame in naive designs. MVP idle metro cost specified as 0 us. Active route timer specified as 0-10 us per tick. Arrival resolve specified as 20-60 us per resolve. Train hub target specified as 0.03-0.08 ms while active, with 0 us inactive. Route availability recalculation limited to route selection, samosbor start/end or debug events.

Key decisions: No `FloorLevel.METRO` for MVP. Stations are pockets or floor-instance hooks. Метрошники are `occupation/tag: metro`, not a full global faction. Wrong exits require warning ids and post-fact log. Debug must reproduce normal route, wrong exit, station closure, token gating and route risk breakdown. Future numbered floors are optional hooks; depot is the fallback wrong-exit target.

Verification: Read relevant sections of `README.md`, `desdoc.md`, root `expansion.md`, `Docs/Expansions/INDEX.md` and EXP02 `expansion.md`. No code files, root docs, README, desdoc, index, or other expansion folders were edited. Build was not run because the change is documentation-only.
