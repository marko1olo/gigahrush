# Design Floor Implementation Contract

Status: historical planning contract. Use it for floor-agent constraints, but use `README.md`, `src/data/design_floors.ts`, `src/gen/design_floors/manifest.ts` and `src/data/procedural_floors.ts` for shipped route facts.

These docs defined the authored design-floor wave. They are not interstitial procedural floors and they are not `FloorLevel` enum facts; shipped design floors remain string-id route stops wired through the route and generator registries.

## Hard Rules

- One design floor starts as one owned TypeScript module: `src/gen/design_floors/<id>.ts`.
- If a floor grows beyond one real responsibility, convert it to `src/gen/<id>/index.ts` plus `content_manifest.ts`; do not scatter content through `main.ts`.
- The original brief assumed anchors every four z-levels with three procedural floors between them. Shipped route data now spans `z=-50..+50`, reserves even z-slots for future authored/story floors, and uses seeded procedural fallback for every unoccupied slot; use `README.md` and source for the current gap count.
- Design floor route ids are lowercase snake case and stable. Use them in quests, rumors, debug and save data.
- Every floor must have its own NPCs, at least three playable decisions and one debug entry path.
- Use existing registries and hooks first: `registerSideQuest`, content manifests, containers, contracts, rumors, events, faction/economy state.
- New `FloorLevel` enum values are integrator work. A floor agent may add content modules and data, but must not casually expand core enums.
- Use `world.idx`, `world.wrap`, `world.delta`, `world.dist` and `world.dist2` for coordinates.
- No per-frame full-world scans. Floor state updates by generation, interaction, bounded event hooks or slow ticks.
- Player-facing Russian text is normal. Keep it short and playable.

## Default Module Shape

```ts
export const DESIGN_FLOOR_ID = '<id>' as const;

export function generate<FloorName>(): FloorGeneration {
  // create World, topology, lifts, rooms, NPCs, containers, lights
}

export function register<FloorName>Content(): void {
  // side quests, rumors, documents, contract templates
}
```

The routed implementation uses string-id floor stops from `src/data/design_floors.ts`; story anchors remain `FloorLevel` stops from `src/data/procedural_floors.ts`. New floor agents should make content self-contained and provide a debug generator hook instead of adding new `FloorLevel` enum values.

## Required Gameplay Loop

Each design floor must provide this minimum loop:

1. Entry clue: rumor, contract, lift label, NPC request, document or debug command.
2. Preparation: item, weapon, document, water, filter, light, money, trust or faction pass.
3. Risk path: hostile room, social pressure, patrol, monster, hazard, anomaly or samosbor timing.
4. Decision: trade, steal, repair, escort, kill, hide, forge, expose, reroute or flee.
5. Consequence: event, reward, reputation change, container state, route unlock, scarcity, rumor or backlash.

## Debug And Verification

Every floor implementation must expose:

- force-enter debug command or debug menu row;
- route id, seed and z in debug output;
- at least one deterministic smoke path from spawn to exit;
- one test or manual checklist for softlock prevention;
- `npm run typecheck` minimum, `npm run check` for systems/render/save/generation changes.

## Route Scale

The historical examples below use planned z anchors spaced by 4. They are not the shipped source of truth: the current route spans `z=-50..+50`, keeps `LIVING` at `z=0`, and leaves unoccupied even slots as procedural fallback until authored floors claim them.

Example:

```txt
z=+22 DESIGN: raionsovet_archive
z=+21 procedural
z=+20 procedural fallback
z=+19 procedural
z=+18 DESIGN: registry_morgue
```

The exact current game route is `README.md`, `src/data/design_floors.ts` and `src/data/procedural_floors.ts`.
