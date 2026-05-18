# AG53 Hell Altar Arena Status

- Prompt: `AGENT_53_HELL_ALTAR_ARENA`
- XML block: extracted by id from `Docs/AgentPrompts/AGENT_53_HELL_ALTAR_ARENA.md`
- Baseline: `npm run build` passed before source edits
- Scope: new Hell altar arena module, Hell content manifest registration, contract/rumor data, final log
- Hard cap target: no runtime wave spawner; encounter enemies are generation-time only

## Progress

- Preflight docs and required source files read.
- Implemented `src/gen/hell/altar_arena.ts`.
- Registered the arena in `src/gen/hell/content_manifest.ts`.
- Added `hell_altar_nightmare` contract and two altar rumors/leads.
- Compiled Hell generator check: altar room exists with 1 closed door, 9 monsters, 4 cultists, 1 reward drop.
- Encounter cap: 9 monsters total; no Matka or runtime spawner, so the encounter cannot grow new monsters.
- Validation: `npm run typecheck` passed.
- Validation: `npm run check` passed typecheck, unit tests and build, then failed smoke because the living-floor WebGL canvas sampled blank (`0 lit samples`) and the inventory panel pixel delta did not reach threshold. Re-running `npm run smoke` reproduced the same renderer/startup failure.
