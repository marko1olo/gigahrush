# Status_MONSTER_08_FILTRONOS

Date: 2026-05-18

## Scope

- Implemented `filtronos` / `Фильтронос` as a Maintenance-local resource sabotage encounter.
- Added new source file `src/gen/maintenance/filtronos.ts`.
- Integrated through `src/gen/maintenance/content_manifest.ts`.
- No global inventory/container scans, no economy rewrite, no quest-item destruction.

## Gameplay

- Adds `Фильтровый кэш: сухой нос`, a bounded Maintenance filter cache with one owned container.
- Spawns named `Фильтронос` using existing `POLZUN` monster behavior.
- The cache warns through room name, dry stains, smog, wrapper marks, floor loot, and a note.
- Counterplay:
  - deposit `sealant_tube` or `gasmask_filter` into the cache before looting to protect it;
  - distract the threat with `govnyak_bad_batch`, `govnyak_roll`, or `govnyak_brick`, including existing bounded bait events;
  - kill `Фильтронос` before looting to recover/protect supplies.
- If looted while the threat is alive and untreated, only the module-owned container is contaminated.
- Clean water/filter contents convert locally to lower-value dirty/partial supplies.
- Publishes structured `monster_filtronos_*` events tagged `monster`, `filter`, `smog`, and `resource_sabotage`.

## Validation

Baseline `npm run typecheck` before edits:

```txt
> gigahrush@1.0.0 typecheck
> tsc --noEmit
```

Result: passed, exit 0.

Post-integration `npm run check`:

```txt
> gigahrush@1.0.0 check
> npm run typecheck && npm run test:unit && npm run build

tests 84
pass 84
fail 0

vite v7.3.3 building client environment for production...
dist/index.html  2,442.09 kB | gzip: 724.72 kB
✓ built in 2.33s
```

Result: passed, exit 0.

Focused compile after the final observer-id guard:

```txt
./node_modules/.bin/tsc --noEmit --target ES2022 --module ESNext --moduleResolution Bundler --lib ES2022,DOM --strict --noUnusedLocals --noUnusedParameters src/gen/maintenance/filtronos.ts
```

Result: passed, exit 0.

Late direct `npm run typecheck` attempts after the passing check were blocked by unrelated concurrent files:

```txt
src/gen/living/plombirovshchik.ts(413,30): error TS2345: Argument of type 'number | undefined' is not assignable to parameter of type 'number'.
  Type 'undefined' is not assignable to type 'number'.

src/gen/maintenance/chernaya_lichinka.ts(183,102): error TS2304: Cannot find name 'TAG_WITNESS'.
```

Result: failed, exit 2, caused by unrelated untracked/concurrent files outside this task.
