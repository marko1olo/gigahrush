# Design Floor: Служебный этаж

Status: implemented authored route floor. Route id: `service_floor`. Anchor: `z=-18`. Base floor: `MAINTENANCE`. Shipped HUD name: `Служебный этаж`.

Owned file: `src/gen/design_floors/service_floor.ts`. Planning sections below may predate the routed implementation; verify exact lift, power and access behavior against source.

## Role

The Service Floor is the practical backstage: lift machines, staff corridors, breaker rooms, janitor offices, ventilation, route switches and maintenance ledgers. It is less flooded than Collectors and less factory-like than Production.

Primary decisions: repair lift, reroute floor access, steal keys, hide in staff route, restore power, silence alarm, fight service automata.

## Generation

- Long staff corridors with locked side rooms.
- Lift machine hall, breaker room, janitor depot, ventilation junction, staff canteen.
- Multiple lift exits can be physically near but access-gated.
- Doors and keys matter; avoid huge open arenas.

## NPCs

- `service_liftmaster_boris`: can reroute or fix lift access.
- `service_janitor_nadya`: knows hidden doors and cleaning supply containers.
- `service_electrician_roma`: breaker repairs, electric samosbor hints.
- `service_locked_out_clerk`: ties back to Ministry/Bureau.

## Quests

- `service_fix_lift_machine`: repair with parts from Production/Collectors.
- `service_steal_master_key`: steal/earn key with witness risk.
- `service_reroute_raid`: change which floor a raid reaches first.
- `service_restore_lights`: power up one dark route, attracting light-fed monsters.

## Systems

State should modify route/access flags, not teleport logic directly:

```txt
service.liftMachineState
service.masterKeyKnown
service.powerZones[]
service.rerouteFlags[]
```

Integrator-owned lift system consumes these flags.

## Samosbor

Service Floor samosbor disables doors/lights and may trap the player between staff rooms. Good preparation creates safer routes; bad repair creates sparks, noise or wrong-floor exits.

## Cross-Floor Hooks

- Production and Collectors provide parts.
- Manhattan Crossroads traffic lights can be repaired from here.
- Market 88/Floor 69 raids can be rerouted.
- Dark Metro and Darkness consume light/power state.

## DoD

- One repair changes a route or access flag visible outside the floor.
- Master key cannot open everything; it must be scoped.
- No direct `main.ts` lift hack by content agent.
