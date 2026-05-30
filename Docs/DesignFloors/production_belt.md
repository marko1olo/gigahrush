# Design Floor: Производственный пояс

Status: implemented authored route floor. Route id: `production_belt`. Anchor: `z=-14`. Base floor: `MAINTENANCE`. Shipped HUD name: `Производственный пояс`.

Owned file: `src/gen/design_floors/production_belt.ts`. Existing references: `src/systems/production.ts`, `src/data/factories.ts`, `src/gen/maintenance/concentrate_press.ts`. Planning sections below may predate the routed implementation; verify exact factory behavior against source.

## Role

The production belt is where the megastructure turns scarcity into work. It should give concrete reasons to carry parts, repair machines, steal output, escort workers and choose between quality and quantity.

Primary decisions: repair, sabotage, work a shift, steal output, reroute supply, protect worker, fight automata.

## Generation

- Factory lines, press rooms, loading docks, locker rooms, foreman office, broken conveyor corridors.
- Full-floor expansion paints static tensor conveyor spines as floor route lines through the dock loops and vertical tare lifts.
- Machine clusters register bounded static hazard fields with visible yellow fog/scorch cues and route cues back to lit shelter/bypass rooms.
- Output containers must be physically reachable and contested.
- Machines are static/interactive features, not simulated belts per frame.
- Use production/storage/office/corridor room types.

## NPCs

- `prod_foreman_galina`: assigns shifts and output quotas.
- `prod_mechanic_rustam`: repair path and tool trade.
- `prod_worker_egor`: wants sabotage to stop dangerous quota.
- `prod_auditor_bot`: robot/official hybrid checkpoint.

## Quests

- `prod_restore_line`: bring parts, repair machine, output container unlocks.
- `prod_steal_crate`: steal from owner container with witness/raid risk.
- `prod_bad_batch`: choose to ship bad product to Market/Living or expose it.
- `prod_worker_escort`: escort worker through machine hazard during warning.

## Systems

Use existing production/economy abstractions:

- factory id;
- input resource ids;
- output item/container ids;
- cooldown/last output;
- defect flag.

No live conveyor physics.

## Samosbor

Production aftermath can create defects, machine jams, robot hostility, fire/steam rooms or valuable abandoned output. Active phase should shut some lines and make shelters scarce.

## Cross-Floor Hooks

- Market 88 consumes output and bad batch rumors.
- Living/Kvartiry scarcity reacts to production failures.
- Service Floor repairs machinery power.
- Ministry demands quota paperwork.

## DoD

- One factory line produces tangible output into a container.
- Player can choose legal work, theft or sabotage.
- Production state changes economy/rumor/quest in a bounded way.
