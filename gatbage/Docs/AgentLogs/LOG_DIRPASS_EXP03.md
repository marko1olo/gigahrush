# LOG DIRPASS_EXP03

## 2026-05-17 Director Hook Pass

What was wrong: `03_raionsovet_archive` had document/access/archive contracts, but no local implementation-ready contract explaining how `00_samosbor_director` should schedule Raionsovet beats. Without this, future implementation would likely hardcode director behavior or mutate document state outside EXP03 ownership.

What was done: Added `Docs/Expansions/03_raionsovet_archive/director_hooks.md`. It defines `raionsovet_archive` signals, ten `exp03.*` beats, act gates, cooldowns, max-runs, effect requests, chain slots, trace payload fields, debug validation and Math LOD. Updated local `integration_contract.md` with a `Director Integration` section. Created status and rationale files.

Cinematic cheats used: Document corruption is represented by flags like `wet`, `stamp_damaged`, `warped` and `false_order`, not simulated paper decay. Archive errors use reliability labels like `stale` and `future_dated`, not a live database rewrite. Loudspeaker false orders are one-zone one-shot effects, not global AI state.

Exact microseconds saved: Documentation pass adds 0 us/frame. Future contract avoids per-frame scans and targets rare-tick or interaction-only work. Estimated avoided cost versus naive inventory/archive polling is all steady-state frame time: 0 us/frame instead of suspicious recurring work.

Verification: Static docs checked against local EXP03 package and director foundation docs. No source code changed; no build/typecheck run.
