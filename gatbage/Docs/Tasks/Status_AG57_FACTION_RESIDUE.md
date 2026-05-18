# AG57 Faction Residue Status

Status: implemented

Baseline:
- `npm run build` passed before implementation.

Completed:
- Add data-defined physical residue for faction events.
- Keep residue bounded to the event center and current zone.
- Publish event context for debug summaries and rumor memory.
- Force-triggered patrol, relief caravan, tax raid, cult procession, wild looters, and liquidator sweep in a generated living floor.

Forced-event traces:
- `patrol`: cigarette drop, scuff marks, local pressure cells.
- `relief_caravan`: water/bread/bandage drops, water/chalk marks, container deposit, economy boost, local pressure cells.
- `tax_raid`: dropped raid note, bullet/blood marks, container receipt when a local container exists, economy loss, local pressure cells.
- `cult_procession`: meat rune drop, PSI/gore marks, PSI economy change, local pressure cells.
- `wild_looters`: cigarette drop, blood/scuff marks, container tag note when a local container exists, economy loss, local pressure cells.
- `liquidator_sweep`: ammo drop, bullet/scorch/blood marks, ammo economy loss, local pressure cells.

Validation:
- `npm run typecheck` passed.
- `npm run test:unit` passed.
- `npm run build` passed.
- `npm run check` reached and passed typecheck, unit tests, and build; `npm run smoke` is blocked in this environment by the existing WebGL readback check reporting `WebGL canvas appears blank (0 lit samples)` after movement.

Notes:
- The worktree had many unrelated uncommitted files before this task.
