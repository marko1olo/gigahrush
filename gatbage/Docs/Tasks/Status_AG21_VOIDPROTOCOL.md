# Status AG21 VOIDPROTOCOL

Date: 2026-05-17

## Preflight

- Extracted prompt block: `AGENT_21_VOID_AFTERPROTOCOL`.
- Read required docs/source: `README.md`, `architecture.md`, `Docs/Expansions/10_void_afterprotocol/expansion.md`, `src/gen/void/index.ts`, `src/entities/creator.ts`, `src/entities/spirit.ts`, `src/systems/psi.ts`, `src/systems/events.ts`, `src/data/plot.ts`.
- Baseline `npm run build`: passed before implementation.

## Implemented

- Added `src/data/void_protocols.ts` with 7 local protocol definitions.
- Added `src/systems/void_protocols.ts` with bounded module state for owned protocols, cooldowns, active marks and traces.
- Added VOID protocol events through `publishEvent()` using `void_protocol_*` runtime event tags.
- Added `src/gen/void/protocol_chamber.ts` and `src/gen/void/content_manifest.ts`.
- Hooked VOID content from `src/gen/void/index.ts`.
- Added debug command `VOID: форс/список`.
- Updated `README.md` shipped facts.

## Validation

- Baseline build: passed.
- Post-change `npm run build`: passed.
- Final standalone `npm run typecheck`: passed.
- Final `npm run check`: typecheck passed, then `test:unit` compilation stopped because `tests/events-economy.test.ts` imports missing `offerNpcContract` from `src/systems/contracts`; no AG21 file was reported.

## Notes

- Protocol state is bounded and local; no per-frame full-world scan was added.
- The P-46 chamber demonstrates protocol-adjacent consequences through a note, a toll spirit, a hostile paragraph and a false tenant.
