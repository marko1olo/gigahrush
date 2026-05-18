# LOG_EXP09_404

## 2026-05-17

What was wrong: EXP09 had only the high-level `expansion.md`. It did not yet have a phased implementation plan, bounded content manifest or explicit integration contract. Without those, a future code pass could overbuild numbered floors as permanent enums, make 404 look like a bug, create direct dependencies on metro/archive/market systems or strand saves inside a temporary pocket.

What was done: Created `Docs/Expansions/09_elevator_loop_404/implementation_plan.md`, `content_manifest.md` and `integration_contract.md`. Created `Docs/Tasks/Status_EXP09_404.md` and `Docs/AgentLogs/Rationale_EXP09_404.md`. This log records the final report in the required agent-log path.

Cinematic Cheats used: 404 is a small deterministic pocket, not a real new floor. The map lies through labels and markers, while collision remains truthful. Empty queue content is audio/text/NPC-dot fakery, not crowd simulation. Elevator anomaly is an interaction/event resolve, not frame polling. Ultra polish spends budget on blank indicators, wrong chimes, repeated signs and HUD-map contradiction inside the pocket only.

Exact Microseconds saved: Avoided permanent numbered-floor simulation and global anomaly polling estimated at 100-1000 us/frame in naive designs. MVP inactive cost specified as 0 us/frame. Low-tier entry resolve specified as <100 us. Middle-tier instance creation specified as 100-300 us. High-tier rare entry/exit event specified as <500 us. Optional hook checks are event-bound only.

Key decisions: 404 is the only playable MVP. 556/777/1337 are reserved defs until 404 proves the loop. No `FloorLevel.NUMBERED_404` for MVP. One active `floorInstance` stores seed, flags, rewards and last stable floor/position. Save/load fallback returns to stable coordinates if def/generator is missing. Map distortion never changes collision. Rewards are one-shot and modest. Metro/archive/market/void hooks are optional.

Verification: Read relevant sections of `README.md`, `desdoc.md`, root `expansion.md`, `Docs/Expansions/INDEX.md` and EXP09 `expansion.md`. No code files, root docs, README, desdoc, index, or other expansion folders were edited. Build was not run because the change is documentation-only.

