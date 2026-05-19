# LOG MONSTER_24_PRISTAV_PUSTOTY

Implemented `pristav_pustoty` / Пристав Пустоты as a local Void chamber rule.

Files changed:

- `src/gen/void/pristav_pustoty.ts`
- `src/gen/void/content_manifest.ts`
- `tests/monster_24_pristav_pustoty.test.ts`
- `Docs/Tasks/Status_MONSTER_24_PRISTAV_PUSTOTY.md`
- `Docs/AgentLogs/LOG_MONSTER_24_PRISTAV_PUSTOTY.md`

Behavior:

- The chamber states its rule through a readable note and publishes a `stated` event before resolving any choice.
- Player choices: obey the line, pay 5 rubles, deliberately violate, or break the protocol anchor.
- Obey/payment resolve without spawning pressure; payment grants `psi_mark` if inventory allows it.
- Violation taxes only a small safe consumable/ammo item or a few rubles, never broad/unique quest inventory.
- Violation spawns `SPIRIT`/`PARAGRAPH` pressure and closes only an ordinary route door, leaving the entrance reachable.
- Anchor break grants/takes the `void_spike` from the anchor container and spawns limited `PARAGRAPH` pressure.
- Events use tags `monster`, `void`, `protocol`, `rule`, `pristav_pustoty`.

Validation:

- Baseline `npm run typecheck`: passed before edits.
- `npx tsx --test tests/monster_24_pristav_pustoty.test.ts`: passed, 3 tests.
- `npm run check`: passed; 102 unit tests and Vite build completed.
