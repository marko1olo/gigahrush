# LOG_MONSTER_15_SAMOSBORNYY_OSTOV

Implemented `samosbornyy_ostov` as a local corpse/loot-risk aftermath scene on LIVING zone 64.

Files changed by this task:

- `src/gen/living/samosbornyy_ostov.ts`
- `src/gen/living/content_manifest.ts`
- `tests/monster_15_samosbornyy_ostov.test.ts`
- `Docs/Tasks/Status_MONSTER_15_SAMOSBORNYY_OSTOV.md`
- `Docs/AgentLogs/LOG_MONSTER_15_SAMOSBORNYY_OSTOV.md`

Baseline `npm run typecheck` passed before edits with exact output:

```txt
> gigahrush@1.0.0 typecheck
> tsc --noEmit
```

The encounter uses existing systems only: side-effect Living content registration, item drops, containers, side quests, structured quest/container events, and the existing `ZOMBIE` monster kind. It does not alter global corpse behavior, item drops, AI, or shared loot systems.

Player-facing decisions:

- Inspect and take the safe supply at the door.
- Read/report the warning note to the liquidator.
- Bring fuel for safe disposal.
- Deposit fuel into the tagged brazier for a burn/disposal event.
- Open the hermetic corpse bay and risk the too-clean corpse loot.
- Poke or shoot the local `Самосборный Остов` from range after deliberately opening the bay.

Focused test:

```txt
npx tsx --test tests/monster_15_samosbornyy_ostov.test.ts
```

Result: pass.

Post-change validation:

```txt
npm run typecheck
npm run check
```

Result: both passed. `npm run check` completed typecheck, 100 passing unit tests, and production build.
