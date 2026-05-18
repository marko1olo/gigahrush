# AG60 Second-Wave QA Log

Date: 2026-05-17

## Scope

Ran second-wave content QA for `AGENT_60_SECOND_WAVE_QA_README`.

Read source-of-truth and context files:

- `README.md`
- `architecture.md`
- `desdoc.md`
- all active `Docs/AgentPrompts/AGENT_*.md`
- existing AG3x-AG5x status files found under `Docs/Tasks/`
- `scripts/content-audit.mjs`
- `tests/content-registry.test.ts`
- `package.json`

Baseline prompt scan command:

```bash
find Docs/AgentPrompts -maxdepth 1 -name 'AGENT_*.md' | sort
```

Active prompt count: 30 (`AGENT_31` through `AGENT_60`).

## Audit Result

`node scripts/content-audit.mjs` passed.

Counts:

- plot NPC ids: 119 (9 base + 110 side-effect registered)
- plot chain steps: 16
- side quest steps: 130
- contracts: 60
- item ids: 191
- monster kinds: 22
- monster registry entries: 22
- monster variants: 20
- rumors: 208
- hell manifest entries: 5
- kvartiry manifest entries: 16
- living manifest entries: 14
- maintenance manifest entries: 20
- ministry manifest entries: 12
- void manifest entries: 3

Unimported content modules: none detected.

Errors: none.

## Fixes

- Updated `scripts/content-audit.mjs` so `registerZoneContent()` labels passed via top-level string constants are resolved in audit output.
- Updated `tests/content-registry.test.ts` to validate `RumorDef.reveals` whether it is a single reveal or an array, including exact monster ecology reveal coverage.
- Updated `tests/data-ids.test.ts` to keep strict monster-kind indexing typed.
- Updated `README.md` shipped facts for current content counts, floor content, rumors, contracts, item ids, and debug command count.

## Validation

- `node scripts/content-audit.mjs`: pass.
- `npm run typecheck`: pass.
- `npm run test:unit`: pass in the main workspace after waiting for shared `.test-build` activity to clear.
- `npm run check`: pass in isolated snapshot `/tmp/gigahrush-ag60-check`, created from the current workspace to avoid active shared `.test-build` contention. This ran typecheck, unit tests, build, and smoke.

Smoke line from the passing check:

```txt
Smoke playability passed at http://127.0.0.1:64213/; expedition=off; hudLit=6131, hudCenterLit=1205, sceneLit=202137
```

## Blocked Or Risky

Main-workspace final `npm run check` was skipped because other active Codex jobs continued running `npm run check`, `npm run test:unit`, smoke, and `.test-build` tests in the same checkout. A direct AG60 unit attempt initially failed only at cleanup with:

```txt
rm: .test-build/src/render: Directory not empty
rm: .test-build/src: Directory not empty
rm: .test-build: Directory not empty
```

The retry passed once the shared test process cleared. No unresolved registry/import/reference failures remain from the AG60 audit.
