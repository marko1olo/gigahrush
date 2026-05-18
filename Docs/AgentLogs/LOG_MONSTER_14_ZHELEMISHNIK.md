# LOG_MONSTER_14_ZHELEMISHNIK

## 2026-05-18

Implemented the first-wave Желемышник as a Living cellar content module.

- `src/gen/living/zhelemishnik.ts` owns the room, NPCs, containers, guardian spawn, side quests, and local event observer.
- The player can take a safe dried edge, risk the raw guarded core, process with salt for boiled/dried reward, surrender raw zhelemish for a brown sample trace, sell raw stock into counterfeit medicine, or leave the raw patch alone.
- The guardian is a named slow `MonsterKind.POLZUN` variant placed at the raw core. It uses existing monster AI and bait behavior, so dried zhelemish/food drops can distract it.
- Runtime facts publish through existing world events: side-quest completions emit handoff/sale/cleanup events, raw core container looting emits `monster_sighted`, and killing the named guardian emits a local cleanup trace.

Baseline validation before edits:

```txt
> gigahrush@1.0.0 typecheck
> tsc --noEmit
```

Post-change validation:

- Diff whitespace check for touched Monster 14 files passed.
- `npm run typecheck` is currently blocked by unowned worktree files outside this task. Latest failure:

```txt
src/gen/maintenance/chernaya_lichinka.ts(183,102): error TS2304: Cannot find name 'TAG_WITNESS'.
```

- `npm run check` was attempted and stopped in typecheck before tests/build because of another unowned file:

```txt
src/gen/living/plombirovshchik.ts(413,30): error TS2345: Argument of type 'number | undefined' is not assignable to parameter of type 'number'.
  Type 'undefined' is not assignable to type 'number'.
```
