# Status MONSTER_06_KABELNIK

Prompt: `MONSTER_06_KABELNIK`
Date: 2026-05-18

## Preflight

- XML block extracted with `awk '/<AGENT_PROMPT id="MONSTER_06_KABELNIK">/{flag=1} flag{print} /<\/AGENT_PROMPT>/{flag=0}' Monster_06.md`.
- Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, `AGENTS.md`, and the requested source files.
- Baseline `npm run typecheck`:

```txt
> gigahrush@1.0.0 typecheck
> tsc --noEmit

Result: PASS, exit code 0
```

## Implementation

- Done: `src/gen/maintenance/kabelnik.ts` adds a generator-local industrial cable/tether room.
- Done: `src/gen/maintenance/content_manifest.ts` integrates the room into Maintenance generation with a narrow import/call.
- The encounter uses a named `LAMPOVY` body (`Кабельник`) and a sparse `cell_hazards` cable line for bounded runtime behavior.
- Trigger/escape/disable telemetry uses existing `hazard_trapped`, `hazard_escaped`, and `hazard_cleaned` events with `monster`, `tether`, `electric`, `industrial`, `maintenance` tags. Threat clear still uses the existing kill event for the named monster body.
- Counterplay: visible blue cable marks, upper/lower bypass lanes, `cleaning_kit`/fire hazard cleanup, and local tech loot (`wire_coil`, `fuse`, `circuit_board`, `rubber_strip`).

## Validation

- Post-change `npm run typecheck`:

```txt
> gigahrush@1.0.0 typecheck
> tsc --noEmit

Result: PASS, exit code 0
```

- `npm run check`:

```txt
> gigahrush@1.0.0 check
> npm run typecheck && npm run test:unit && npm run build

> gigahrush@1.0.0 typecheck
> tsc --noEmit

src/gen/void/perestanovshchik.ts(5,3): error TS6133: 'Cell' is declared but its value is never read.
src/gen/void/perestanovshchik.ts(31,7): error TS6133: 'TAGS' is declared but its value is never read.

Result: FAIL, exit code 2
```

`npm run check` did not reach `test:unit` or `build`. The blocking errors are in an unrelated untracked Void module outside the `MONSTER_06_KABELNIK` write scope.
