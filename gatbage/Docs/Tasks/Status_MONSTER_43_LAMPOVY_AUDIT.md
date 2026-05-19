# Status MONSTER_43_LAMPOVY_AUDIT

Date: 2026-05-18

## Preflight

- Extracted `MONSTER_43_LAMPOVY_AUDIT` from `Monster_43.md`.
- Read required docs: `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, `AGENTS.md`.
- Read required source: `src/entities/lampovy.ts`, `src/entities/monster.ts`, `src/data/monster_ecology.ts`, `src/systems/ai/monster.ts`, `src/gen/maintenance/paritel_steam_bridge.ts`.
- Baseline `npm run typecheck`: pass.

## Audit

- `LAMPOVY` already uses `aiFlags: ['lampPowered']`.
- Current shared AI multiplier in `src/systems/ai/monster.ts` is damage-only: `1.35` within radius `3` of `Feature.LAMP`, otherwise `0.9`.
- Floors remain `LIVING`, `KVARTIRY`, `MINISTRY`, `MAINTENANCE`; this matches lit civil/industrial spaces and the existing Paritel bridge encounter.
- Stats were tuned toward light-context danger instead of chase identity: speed reduced to `1.75`, base damage raised to `11`, so the lamp multiplier is the threat spike while dark/covered play is still survivable.
- Counterplay now explicitly teaches leaving the lamp radius or breaking line/fixture context where a local encounter supports light control.
- Loot hint now matches the implemented ecology drops better: lamp/glass/ozone with rare lamp or fuse.

## Integrator Notes

- No shared AI edit was made because the prompt write scope marks shared files read-only.
- If an integrator owns `src/systems/ai/monster.ts`, Ламповый readability could be improved by publishing a local warning/log event when the player is first attacked under a lamp.
- If an integrator owns `src/data/monster_ecology.ts`, mirror the sharper three-cell/fixture counterplay text there so ecology event data and rumors carry the same lesson.

## Validation

- Post-change `npm run typecheck`: pass.
- Post-change `npm run test:unit`: pass, including `tests/monster_43_lampovy_audit.test.ts`.
