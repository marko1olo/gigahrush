# LOG MONSTER_43_LAMPOVY_AUDIT

2026-05-18

- Audited existing Ламповый implementation as a light-fed threat.
- Confirmed the current AI hook is `lampPowered` damage scaling near `Feature.LAMP`, not speed/pathfinding.
- Updated `src/entities/lampovy.ts` inside owned scope to make the monster less dependent on generic chase speed and more legible as a lamp-radius threat.
- Added `tests/monster_43_lampovy_audit.test.ts` to guard the light-context identity and floor coverage.
- Verification passed: baseline `npm run typecheck`, post-change `npm run typecheck`, and post-change `npm run test:unit`.
- Shared-file follow-up: mirror the sharper counterplay into `monster_ecology.ts` and consider a warning event under lamp context when those files are reassigned.
