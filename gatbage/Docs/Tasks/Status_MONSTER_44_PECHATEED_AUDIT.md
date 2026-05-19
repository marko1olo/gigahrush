# MONSTER_44_PECHATEED_AUDIT Status

Status: complete

## Preflight

- Extracted `<AGENT_PROMPT id="MONSTER_44_PECHATEED_AUDIT">` from `Monster_44.md` with `awk`.
- Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, and `AGENTS.md`.
- Read required source: `src/entities/pechateed.ts`, `src/entities/monster.ts`, `src/data/monster_ecology.ts`, `src/systems/ai/monster.ts`, and `src/gen/ministry/inspection_archive.ts`.
- Baseline command: `npm run typecheck`
- Baseline result: exit 0

```text
> gigahrush@1.0.0 typecheck
> tsc --noEmit
```

## Audit Notes

- Current shared AI already preserves the document-hunter identity: PECHATEED uses a wider range for document-like inventory and a shorter fallback range for empty-handed targets.
- Document-like detection checks notes, keys, and document terms in item name/description; this was reviewed read-only per scope.
- The Inspection Archive already provides a reachable Ministry encounter, a kill quest, and tempting document drops behind a locked gate.
- Shared ecology already covers civil floors, office/common/smoking/corridor rooms, `ecology_pechateed_docs`, and rare `ink_bottle` / `blank_form` drops.

## Changes

- Adjusted local PECHATEED stats in `src/entities/pechateed.ts`: slightly slower and slower-attacking, with a small damage bump so caught paper carriers feel punished while kiting remains fair.
- Aligned local floors with civil-floor ecology order.
- Sharpened local `counterplay` to say exactly what the player can do: drop/avoid extra papers, blanks and keys, then kite through angles.
- Sharpened local `lootHint` around chewed forms, ink, and rare blank forms.
- Improved sprite readability with stronger ink text lines, red stamp/mouth marks, tooth pixels, and ragged paper edges.
- Added `tests/monster_44_pechateed_audit.test.ts` for the local document-hunter contract and nonblank paper/stamp sprite cues.

## Shared Diff Requests

None. `src/systems/ai/monster.ts`, `src/data/monster_ecology.ts`, and `src/gen/ministry/inspection_archive.ts` stayed read-only.

## Validation

- Post-change `npm run typecheck`: exit 0.
- Post-change `npm run test:unit -- tests/monster_44_pechateed_audit.test.ts`: exit 0. The package script expands `tests/*.test.ts`, so the full unit suite ran; 73 tests passed.
- `npm run check`: not run; full unit suite and typecheck passed, and the change is limited to one local monster definition/sprite plus a focused test and prompt docs.
