# Rationale AG19 Metro Error Line

Date: 2026-05-17

## Decisions

- Metro is a maintenance POI plus route panels, not a new generated floor. This keeps the MVP inside the existing floor manifest and avoids a transport engine.
- Route selection happens only on `E` interaction with a route panel. There is no per-frame scan and no global metro simulation.
- Floor travel uses existing neighboring floor transitions from `MAINTENANCE` to `LIVING` or `HELL`. Local destinations use existing room-pocket placement on the same floor.
- Wrong stops are resolved at departure. `lift_scheme` and `clean_health_cert` lower risk; active samosbor raises it.
- Events use the existing structured event store. Rumors are static data in `data/rumors.ts`.

## Tradeoffs

- The station does not support a route menu. The player chooses by looking at one of four route panels and pressing `E`, matching the current canvas interaction style.
- Routes are intentionally adjacent-floor or local-pocket only. That keeps integration minimal and avoids replacing lifts.
- Cooldown is module-level runtime state, not saved. This is acceptable for the MVP because it does not alter save shape and only throttles repeated interaction.

## Boundaries Kept

- No `FloorLevel.METRO`.
- No moving train entities.
- No new renderer, UI framework, physics, or imported dependency.
- `main.ts` only received a narrow generic route-panel hook and an optional arrival override for existing floor transition code.
