# Status_MONSTER_17_PERESTANOVSHCHIK

Task: `MONSTER_17_PERESTANOVSHCHIK`

## Preflight

- Extracted the XML prompt block from `Monster_17.md` with `awk`.
- Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, and `AGENTS.md`.
- Read the required source files:
  - `src/data/procedural_floors.ts`
  - `src/gen/procedural_floor.ts`
  - `src/systems/procedural_anomalies.ts`
  - `src/gen/void/protocol_chamber.ts`
  - `src/systems/void_protocols.ts`
  - `src/systems/events.ts`

## Baseline Validation

Command:

```bash
npm run typecheck
```

Exact result: exit code `0`.

Output:

```txt
> gigahrush@1.0.0 typecheck
> tsc --noEmit
```

## Implementation

- Added `src/gen/void/perestanovshchik.ts`.
- Integrated it through `src/gen/void/content_manifest.ts`.
- Added focused coverage in `tests/monster_17_perestanovshchik.test.ts`.

Behavior:

- `perestanovshchik` / `Перестановщик` appears as a local Void topology chamber.
- The room has repeated local door/cell cues and two local `world.anomalyTeleports` pairs.
- One pair is the intended route to the anchor room; the other loops into a side room with a small `SHADOW` threat.
- A normal physical route remains connected, so disabling or avoiding the anomaly cannot softlock the floor.
- The visible anchor container carries `lift_scheme`, `void_spike`, and a note.
- Taking from the anchor container removes only this chamber's teleport links and publishes `elevator_loop_exit` with `monster`, `topology`, `teleport`, `route`, and `perestanovshchik` tags.

## Validation

Focused test:

```bash
npx tsx --test tests/monster_17_perestanovshchik.test.ts
```

Result: exit code `0`, 2 tests passed.

Current typecheck after implementation:

```bash
npm run typecheck
```

Intermediate result: exit code `2`, blocked by unrelated unused-code errors that were present outside this task at the time:

```txt
src/gen/living/samosbornyy_ostov.ts(27,7): error TS6133: 'OSTOV_TAGS' is declared but its value is never read.
src/gen/maintenance/pressovik.ts(4,18): error TS6133: 'EntityType' is declared but its value is never read.
```

Final validation:

```bash
npm run check
```

Result: exit code `0`.

Summary:

```txt
> npm run typecheck
> npm run test:unit
tests 98
pass 98
> npm run build
✓ built in 2.48s
```
