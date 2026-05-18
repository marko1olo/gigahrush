# Status FLOOR18_HELL

Date: 2026-05-18
Prompt: `Docs/DesignFloors/AgentPrompts/floor18_hell.md`

## Scope

- Added an additive Hell module: `src/gen/hell/choir_tax.ts`.
- Wired it through `src/gen/hell/content_manifest.ts`.
- No core enum, plot-chain, renderer, main loop, or shared system edits.

## Implemented Slice

- Major encounter: `Налоговый хор мясного порога`.
- Approaches: break the signal idol, pay cult tax with raw meat, steal/fight for the PSI cache, or use the lit flee route and extract the last liquidator by message.
- NPCs/traces: burned guide Арсений, cult taxman Пахом, last liquidator Шрамко, meat choir notes.
- Quests: altar/signal break, cult tax, PSI cache, last-liquidator extraction.
- Events: quest completion publishes existing `quest_completed`; the module also publishes a tagged Hell outcome event for proof/ritual/extraction/cache/tax outcomes.

## Caps

- Added monsters: 8 maximum.
- Added cultist guards: 3 maximum.
- Added quest NPCs: 3 maximum.
- Added container reward claims: 1 owner cache.
- Added quest reward claims: 4 side quests, each once per save.
- No repeating spawners, timers, or farm loops were added.

## Validation

- Baseline `npm run build`: passed before edits.
- Final `npm run check`: passed.
