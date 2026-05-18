# AG91 Maronary Shaving Status

## Preflight

- Prompt: `AGENT_91_MARONARY_SHAVING_ITEM`, extracted from `Docs/AgentPrompts/AGENT_91_MARONARY_SHAVING_ITEM.md`.
- Read: `README.md`, `architecture.md`, `desdoc.md` section 16.3, `maronary.md`, `src/data/items.ts`, `src/data/rumors.ts`, `src/systems/inventory.ts`, `src/systems/containers.ts`, `src/systems/events.ts`.
- Baseline `npm run typecheck`: failed before TypeScript because `package.json` does not define a `typecheck` script.

## Implementation Notes

- Updated `maronary_shaving` value/text/tags as contraband evidence, science reagent, and cult-relevant sample.
- Added rare container sources through low-chance safe and secret-stash entries, plus a debug grant command.
- Kept the existing Maronary aftermath residue drop as an additional source when that variant runs.
- Added handoff outcomes through NPC trade:
  - Yakov/scientist buyers pay, improve scientist relation, and make the transaction suspicious.
  - Cult buyers pay more, improve cult relation, and cost scientist trust.
  - Ministry-floor officials/directors/secretaries treat it as a green-incident confession.
  - Ordinary buyers still buy it, but the event is logged as a suspicious sale.
- Added inventory destruction by using the item: consumes the shaving, publishes a destroy event, and applies bounded optional cost (`-6` PSI, or `-2` HP without RPG stats).
- Added a hidden/contraband container deposit outcome for putting the shaving into secret/trash containers.
- Added event/rumeur bridges for acquire, handoff/sale, destruction, and hidden outcomes.

## Validation

- Baseline `npm run typecheck`: failed because `package.json` has no `typecheck` script.
- Required `npm run check`: failed because `package.json` has no `check` script.
- `npx tsc --noEmit`: blocked by pre-existing dirty-tree errors outside AG91 scope, including unresolved names in `src/main.ts`, unused imports in several systems, and missing functions in `src/systems/faction_events.ts`.
- `npm run build`: blocked by an unrelated missing export, `proceduralAnomalyInteractionTargetId`, imported by `src/render/hud.ts` from `src/systems/procedural_anomalies.ts`.
