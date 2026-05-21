# Design Floor: Темная пересадка

Status: implemented authored route floor. Route id: `dark_metro`. Anchor: `z=-32`. Base floor: `MAINTENANCE`. Shipped HUD name: `Темная пересадка`.

Owned file: `src/gen/design_floors/dark_metro.ts`. Existing references: `Docs/Expansions/02_metro_error_line/`, `src/gen/maintenance/metro_error_line.ts`. Planning sections below may predate the routed train implementation; verify exact train behavior against source.

## Role

This is the "all gloomy floors" anchor before Hell: metro-like underpasses, wrong platforms, light failure, sealed shops, echoing tunnels and routes that almost work.

Primary decisions: take shortcut, wait for wrong train, light a route, rescue stranded NPC, fight in darkness, abandon cargo.

## Generation

- Station hall, platform, underpass, service kiosk, signal room, blind tunnel, maintenance exit.
- Darkness limits visibility but should not make the game unreadable.
- Use lights as landmarks and resources.
- Wrong route effects must be deterministic and physically clued.

## NPCs

- `dark_metro_dispatcher_nora`: controls false departures.
- `dark_metro_stranded_liquidator`: injured guide/reward source.
- `dark_metro_child_omen_misha`: omen-only trace if reused from metro docs; never danger bait.
- `dark_metro_lamp_vendor`: sells or scams light sources.

## Quests

- `dark_metro_light_platform`: restore lights or keep darkness for stealth.
- `dark_metro_wrong_train`: choose risky shortcut to another design floor.
- `dark_metro_rescue_stranded`: escort NPC to lit exit.
- `dark_metro_signal_box`: repair/sabotage route signal for Market/Service.

## Systems

State:

```txt
platformLight: off/weak/on
wrongRouteArmed: routeId | none
strandedNpcState
signalBoxState
```

No moving train simulation in MVP. A train is a room/transition event.

## Cross-Floor Hooks

- Manhattan Crossroads can open an underpass entry.
- Collectors and Service Floor repair light/signal.
- Market 88 uses metro routes for smuggling.
- Hell may leak into blind tunnel after late plot.

## DoD

- Darkness is scary but readable.
- Wrong route has a clue and a safe fallback.
- At least one shortcut has real cost/consequence.
