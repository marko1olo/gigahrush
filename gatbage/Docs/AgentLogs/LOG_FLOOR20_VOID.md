# LOG FLOOR20 VOID

## 2026-05-18

Prompt: `FLOOR20_VOID`

Implemented a bounded Void protocol-backlash content slice:

- Added `src/gen/void/trace_seal_protocol.ts`.
- Imported it from `src/gen/void/content_manifest.ts`.
- Added `Черный ящик подъезда`, a small authored Void room near the entry path.
- Added a protocol clerk and borrowed neighbor as local plot-registered NPCs with short talk lines and no side quests.
- Added a black-box trace container that records an authored target key instead of searching the world.
- Added one local protocol branch set, `trace_seal` / `Запечатать след`:
  - seal form: preserves/seals the local target door, publishes obtain/start/backlash events, closes one local backlash door, spawns one Paragraph, and applies small nonlethal damage;
  - erase form: erases local trace apparatus, opens the target door, publishes events, and applies short PSI confusion.
- Stored the branch result on container tags so the choice is bounded and not repeatable through both forms.

Validation:

- Baseline `npm run build`: passed.
- Post-change `npm run build`: passed.
- `npx tsc --noEmit --noUnusedLocals false --noUnusedParameters false`: passed.
- `npm run typecheck`: blocked by unrelated `src/gen/design_floors/chthonic_attic.ts(273,9)` unused local `evidenceDoor`.
- `npm run check`: blocked at the same typecheck error before unit tests, build, and smoke.
- Standalone `npm run smoke`: passed (`hudLit=6253`, `hudCenterLit=128`, `sceneLit=202147`).

Scope notes:

- Touched only one new Void content module, `src/gen/void/content_manifest.ts`, and the required FLOOR20 status/log docs.
- Did not alter final victory, Creator, `FloorLevel`, samosbor, save/load, or shared protocol runtime.
