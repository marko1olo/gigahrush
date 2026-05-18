# Rationale AG21 VOIDPROTOCOL

The implementation keeps VOID afterprotocols local and inspectable instead of turning them into a global late-game rules engine.

## Decisions

- `src/data/void_protocols.ts` is data-only. Definitions carry scope, duration, cooldown and short concrete lines.
- `src/systems/void_protocols.ts` uses module-level bounded state because the prompt owned scope did not include `core/types.ts` or save-shape changes.
- Protocol effects mutate only the player room, nearby doors, nearby entities or a local drop. There is no ambient global scan.
- Protocol start/end/backlash facts publish through the existing world event store with `void_protocol_*` event strings and `void_protocol` tags.
- The VOID chamber is generated through `src/gen/void/content_manifest.ts`, leaving `src/gen/void/index.ts` with one local hook.
- Debug uses the existing menu command pattern and `DEBUG_COMMAND_COUNT`; no new DOM or console UI was added.

## Content Tone

Protocol lines avoid explaining samosbor or the final truth. They describe observed local consequences: silence, wrong access, false record, memory echo, PSI recoil, corrupted room name and spirit toll.

## Tradeoffs

- Protocol state is not save-persistent in this slice. That avoids editing `GameState` and normalization outside the prompt write scope.
- End events are resolved when protocol helpers are called; there is no new game-loop tick integration.
- Existing world-log text does not special-case VOID protocol events, so debug/event views are the primary inspection path.
