# LOG AG21 VOIDPROTOCOL

## 2026-05-17

- Added 7 VOID protocol definitions in `src/data/void_protocols.ts`.
- Added bounded local protocol runtime in `src/systems/void_protocols.ts`.
- Added P-46 protocol chamber generation under `src/gen/void/`.
- Hooked VOID content through `src/gen/void/content_manifest.ts`.
- Added debug command `VOID: форс/список` for grant/apply/list.
- Updated README facts for floors, VOID generation, protocol files and event publication.
- Baseline `npm run build` passed before changes.
- Post-change `npm run build` passed.
- Final standalone `npm run typecheck` passed.
- Final `npm run check` got through typecheck and stopped in `test:unit` compilation because `tests/events-economy.test.ts` imports missing `offerNpcContract` from `src/systems/contracts`.
