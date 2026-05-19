# LOG_MONSTER_26_SBORKA_AUDIT

## 2026-05-18

Prompt: `MONSTER_26_SBORKA_AUDIT`

Baseline `npm run typecheck`: exit 0.

Audit result:

- SBORKA already fit the requested gameplay role numerically: fast, weak, low damage, high panic/ammo pressure.
- Shared ecology/bait systems already expose the intended counterplay through food/govnyak bait and non-VOID floor placement.
- No shared files required edits.

Implemented:

- `src/entities/sborka.ts`: added local floor/counterplay/loot metadata and `foodBait` flag.
- `src/entities/sborka.ts`: improved procedural sprite readability as a small jagged scrap creature without changing role or stats.

Validation:

- Post-change `npm run typecheck`: exit 0.
- `npm run check`: skipped because only local entity definition/sprite and docs were changed.
