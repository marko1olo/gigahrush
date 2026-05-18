# Rationale_EXP04_HEAT

Agent: EXP04_HEAT  
Domain: Expansion 04 Heatline Zero  
Started: 2026-05-17

## Decision 1: Maintenance Pocket Before Heat Floor

Problem: The expansion fantasy points at a heat floor, but root expansion rules and index acceptance require a playable loop before a permanent new floor. A floor-first plan would create generator, navigation, renderer, save, and content dependencies during parallel work.

Solution: Define Heatline Zero as a compact `MAINTENANCE` pocket for MVP: entry sluice, main heat node, steam corridor, asbestos storage, emergency shower, pressure dispatch, optional old boiler branch, and fog-choked bypass.

Rejected Alternatives: A new `src/gen/heat/index.ts` floor was rejected for MVP because it expands surface area before proving valves, steam, and fog suppression. A purely static lore room was rejected because the index says MVP requires input, risk, decision, result, consequence, and debug visibility.

Scalability potential: Low uses 3-5 nodes in one pocket. Middle uses 5-8 nodes with rare linked updates. High adds NPC route awareness and faction pressure. Ultra adds visual/audio overkill without changing logic truth.

Hardware Impact: On i3/MX350-class silicon, the pocket design keeps heat idle cost at 0 or near 0 us/frame and confines active work to direct node links. On top-tier hardware, saved CPU budget buys steam visuals, condensation, pulsing lamps, and richer audio without new simulation.

## Decision 2: Discrete Heat Nodes Instead Of Fluid Simulation

Problem: Steam, pressure, and heat can easily become a hidden engineering simulator with per-cell temperature, pipe propagation, and expensive fog coupling. That violates the project's predictability and frame-time rules.

Solution: Use static `HeatNodeDef` and bounded `HeatNodeRuntime` with pressure `0..3`, heat `0..3`, valve state, cooldowns, and direct linked-node updates only.

Rejected Alternatives: Continuous pressure floats, flood-fill pipe networks, and per-cell heat maps were rejected. Standard Unity-like physics or particle-driven truth was also rejected because this TypeScript raycaster game needs cheap data and deterministic player feedback.

Scalability potential: Low updates only on interaction. Middle adds rare ticks. High lets NPC and monster systems consume room flags and noise events. Ultra spends only on visuals.

Hardware Impact: Direct linked-node updates are estimated below 20 us per valve action, with no idle scan. That preserves low-end frame budget and leaves high-end machines free for cosmetic density.

## Decision 3: Renderer-Safe Steam As Cinematic Cheat

Problem: Steam must sell danger, but renderer work may be owned by other agents and a particle/volumetric system would be excessive for MVP.

Solution: Define one-way `HeatVisualRequest` with tiered fallbacks: HUD text, lamp tint, alpha strips, wall-column noise, heat haze, condensation, and layered audio. Logic state remains authoritative.

Rejected Alternatives: Volumetric steam, renderer-owned damage, particle collision, and per-pixel fluid state were rejected. They are expensive, fragile, and unnecessary for the MVP loop.

Scalability potential: Low remains readable through text and tint. Middle adds strips. High adds haze and decals. Ultra adds dense cosmetic steam while using the same heat-node truth.

Hardware Impact: Low-end devices avoid new draw-heavy effects. MX350-class hardware can show strips/tint cheaply. High-end devices can spend GPU/CPU budget on visual overkill without changing gameplay or saves.

## Decision 4: Fog Suppression As Temporary Request

Problem: Heat must interact with samosbor fog, but it cannot become a global anti-fog exploit or directly mutate another agent's fog internals.

Solution: Define `HeatFogRequest` with room id, center, radius, strength, start/end time, and `mode: 'suppress_only'`. Fog systems may consume it through an adapter. The request never changes zone ownership, boss state, or global samosbor capture.

Rejected Alternatives: Direct writes into samosbor state, permanent fog deletion, and zone cleansing by valve were rejected. They would break the main antagonist and cross-agent boundaries.

Scalability potential: Low burns a tiny visible window. Middle applies a small radius. High lets NPC/faction systems comment on temporary safe routes. Ultra only adds richer fog/steam visuals.

Hardware Impact: Low-end implementation can affect a short bounded cell list under roughly 25 us per vent event. High-end visual shimmer can approach the 0.1 ms suspicion line only as cosmetic work, not core logic.

## Decision 5: Debug And Black-Box Telemetry As DOD

Problem: Heat bugs will be state bugs: wrong valve, invisible steam, fog not returning, or pressure stuck at an impossible level. Without debug, failures become subjective reports.

Solution: Make `heat:list`, `heat:nearest`, `heat:set-valve`, `heat:vent`, `heat:cool-all`, and `heat:dump` part of the contract. Define a fixed 300-entry `HeatTelemetryEntry` ring for node id hash, room, pressure, heat, valve state, player room, fog hash, and flags.

Rejected Alternatives: Balancing first and adding debug later was rejected. Chat reports were rejected as evidence because the required evidence must live on disk.

Scalability potential: Low records transitions only. Middle records active hazards in the heat pocket. High and ultra can record richer visual flags while keeping the buffer fixed.

Hardware Impact: Transition-only telemetry costs 0 us on idle frames and about one fixed assignment per recorded transition. Even on low-end silicon this is negligible; on top-tier machines it provides enough evidence for aggressive visual tuning.
