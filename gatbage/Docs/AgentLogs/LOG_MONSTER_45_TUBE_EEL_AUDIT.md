# LOG_MONSTER_45_TUBE_EEL_AUDIT

## 2026-05-18

Prompt: `MONSTER_45_TUBE_EEL_AUDIT`

Baseline `npm run typecheck`: exit 0.

Audit result:

- `TUBE_EEL` already uses the local `waterStrider` metadata and the generic monster AI applies water/dry movement multipliers.
- Maintenance `water_bridge` already gives a reachable encounter where dry bridge routing is the intended answer.
- Shared AI, ecology, and generator files did not require edits and were kept read-only.

Implemented:

- `src/entities/tube_eel.ts`: lowered base durability/speed/damage so dry ground is clearer counterplay while water remains threatening through the existing multiplier.
- `src/entities/tube_eel.ts`: updated counterplay and loot hint text to name dry edge/bridge fighting and rusty pipe loot.
- `tests/monster_45_tube_eel_audit.test.ts`: added a focused local metadata test for the water ambusher contract.

Validation:

- `npx tsx --test tests/monster_45_tube_eel_audit.test.ts`: exit 0.
- Post-change `npm run typecheck`: exit 2, blocked by unrelated untracked `src/gen/void/perestanovshchik.ts` unused locals `Cell` and `TAGS`.
- `npm run check`: skipped because typecheck is blocked before broader checks can run.
