# AG37 Samosbor Aftermath Log

## 2026-05-17

Prompt: `AGENT_37_SAMOSBOR_SHELTER_AFTERMATH`

Implemented an aftermath consequence pass for samosbor:

- Expanded `SAMOSBOR_AFTERMATH_BEATS` from 9 to 23 direct beats.
- Added civil, maintenance, hell and void aftermath roles.
- Added concrete resource shifts, opened/unsealed containers, late monsters, service door faults, rumor/social pressure and faction pressure beats.
- Kept all new beats bounded with explicit floor filters, cooldowns and max-run caps.
- Improved direct aftermath event typing so shortage/container/door effects publish more specific structured events instead of all using generic `samosbor_warning`.

Validation:

- Baseline `npm run build`: passed.
- `npm run typecheck`: failed in pre-existing `src/data/contracts.ts` entries missing required `target`.
- Scoped TypeScript scan found no samosbor/AG37 errors.
- `npm run check`: failed at the same typecheck blocker before later steps.
- Post-change `npm run build`: passed.
- Post-change `npm run smoke`: passed.
