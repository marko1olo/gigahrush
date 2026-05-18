# AG118 Slime/Cult Smoke Status

Date: 2026-05-18

## Prompt

- Extracted prompt id: `AGENT_118_SLIME_CULT_SMOKE_TEST`.
- Domain: Tests / Smoke Scenario / Integration Coverage.
- Goal: extend smoke coverage for a slime/sample path, cult conflict path, rare samosbor variant/debug force, and return to normal play.

## Preflight

- Read `README.md`: done.
- Read `architecture.md`: done.
- Read `desdoc.md` sections 17-21: done.
- Read `scripts/smoke-playability.mjs`: done.
- Read `scripts/content-audit.mjs`: done.
- Read `tests/content-registry.test.ts`: done.
- Read `package.json`: done. Current scripts are only `dev`, `build`, `preview`.
- Read active `Docs/AgentPrompts/AGENT_6*.md` through `AGENT_11*.md`: done by prompt inventory over ids/domains/goals and implementation references.

## Baseline

Command:

```txt
npm run smoke
```

Result: failed before smoke execution because `package.json` has no `smoke` script.

First relevant output:

```txt
npm error Missing script: "smoke"
```

## Implementation

- Updated `scripts/smoke-playability.mjs`.
- Added third-wave source audit behind `SMOKE_SCENARIO=third-wave`, `SMOKE_SCENARIO=slime-cult`, or `SMOKE_THIRD_WAVE=1`.
- Audit reports covered slices, explicit optional skips, and hard source failures for missing required ids/hooks.
- Browser scenario now:
  - teleports to Maintenance to force generation of wired slime/sample modules;
  - forces faction events through existing debug command 17;
  - forces rare Veretar samosbor through existing debug command 29, with cycle-command fallback;
  - teleports back to Living and verifies render/return telemetry.
- Existing blank-canvas, WebGL, thrown exception, and panel assertions remain intact.

## Current Audit Coverage

Direct third-wave smoke source audit detected:

- slime data rail with 8 sample ids and `slime_samples`;
- AG62 NII sample post;
- AG68 blue glow sealed sample path;
- AG64 green acid sample pickup path;
- AG63 brown cleanup contract route;
- AG71 slime deactivation furnace;
- AG65 white compulsion Living content;
- cult faction events `cult_liquidator_clash`, `cult_procession`, `black_hand_marks`;
- rare samosbor variants `maronary`, `istotit`, `veretar` with Veretar debug force.

## Validation

```txt
node --check scripts/smoke-playability.mjs
```

Result: passed.

```txt
npm run build
```

Result: passed. Vite built `dist/index.html`.

```txt
SMOKE_SCENARIO=third-wave node scripts/smoke-playability.mjs
```

Result: failed on runtime exception before panel/debug assertions could succeed.

First relevant failure:

```txt
ReferenceError: updateActiveFactionClashes is not defined
```

The exception originates from the faction event runtime path. This is outside AG118 write scope.

```txt
npm run smoke
npm run test:unit
npm run typecheck
npm run check
```

Result: all failed before execution because the scripts are absent from `package.json`.

```txt
npx tsc --noEmit
```

Result: failed on existing workspace errors. First relevant failures include:

- `src/gen/maintenance/pneumomail_station.ts(45,54): Expected 10-11 arguments, but got 9.`
- `src/main.ts`: missing procedural anomaly exports / unresolved names.
- `src/systems/faction_events.ts`: missing `updateActiveFactionClashes`, `countAliveIds`, `addClashChoice`, `factionClashDef`, `playerHasClashEvidence`, `publishClashPhaseEvent`, `spawnFactionEventDrops`.

```txt
node scripts/content-audit.mjs
```

Result: failed on existing content registry issues. First relevant failures:

- duplicate LIVING zone `46`;
- unimported `src/gen/maintenance/betonoed_shortcut.ts`;
- missing Chornobog docket item ids;
- content-audit does not resolve computed item keys such as `[SILVER_SLIME_SEALED_ID]`, so it also reports `slime_sample_silver` as missing.

## Status

AG118 smoke extension is implemented, but direct third-wave smoke cannot pass until the existing faction-event runtime error is fixed. Npm validation scripts also need to be restored in `package.json` by the package/script owner.
