# Design Floor: Крыша

Status: implemented authored route floor. Route id: `roof`. Anchor: `z=+50`. Base floor: `MINISTRY`. Shipped HUD name: `Крыша`.

Owned file: `src/gen/design_floors/roof.ts`. Route integration: `src/data/design_floors.ts`, `src/gen/design_floors/manifest.ts`, `src/gen/design_floors/full_floor.ts`. Renderer hook: generic dynamic ceiling texture slot in `src/render/webgl.ts`.

## Role

The roof is a special authored floor where the building finally pretends to have an outside. It is not safe. It offers antennas, ventilation, sniper lines, weather lies, falling debris and the first visible hint that the sky above the Gigahrush is procedural machinery.

Primary decisions: repair antenna, steal signal gear, expose false weather, escort a technician, shoot through long sightlines, hide from an overhead samosbor, flee into service hatches.

## Required Visual Feature

The ceiling texture is dynamic sky:

- source texture target: `1024x1024` pixel-art sky texture;
- procedural clouds via cheap diffusion/blur cellular simulation over local `16x16` chunks, updated at a low rate, not per ray;
- time-of-day lighting tint affects floor ambient light, fog and distant cloud color;
- clouds must be readable as pixel clouds, not smooth gradient or static blue fill;
- the whole ceiling acts as an even sky light source; do not solve roof visibility by placing lamps;
- the provider exports ambient and fog tints; the renderer consumes them through the generic dynamic sky path;
- no network assets.

Implementation exposes `RoofSkyTextureProvider`. The raycaster only knows about a generic dynamic ceiling texture hook.

## Generation

Topology is open but bounded:

- concrete roof slabs as large rooms with low parapet walls;
- antenna clusters, ventilation houses, water tanks, broken skylights and lift machine exits;
- no full empty 1024x1024 plane; use roof islands connected by service walkways;
- long sightlines are valuable, but use fog and obstacles to keep combat readable;
- place at least two down routes: normal lift and maintenance hatch.
- the current build registers one wind route cue from the roof entry toward the sealed ventilation shelter.

Textures: concrete, metal, dark service doors, optional new procedural sky ceiling. Floor can reuse concrete plus tar-paper variants until new texture ids exist.

## NPCs

Minimum named NPCs:

- `roof_meteorologist_varvara`: sells weather/samosbor timing hints, may lie under Ministry pressure.
- `roof_rigger_senya`: repairs antennas, needs cable and medicine.
- `roof_sniper_kadyr`: blocks open lanes unless bribed, fought or exposed.
- `roof_cloud_witness`: quiet citizen who saw clouds repeat.

## Quests

- `roof_repair_antenna`: fetch wire/energy cell, restore signal, unlock one rumor channel.
- `roof_false_weather_report`: steal or forge weather sheet for Ministry or citizens.
- `roof_sniper_line`: reroute across roof by bribing, killing or darkening a sniper nest.
- `roof_cloud_sample`: bring Yakov a printed cloud frame after a sky glitch.

## Samosbor

Roof samosbor is sky-first: clouds freeze, light desaturates, siren becomes wind. Shelter is ventilation sheds and hermetic stairheads. Being in open sky during active phase increases ranged monster/eye/spirit pressure.

Aftermath can leave ash marks, broken antenna output, false day/night tint or a rare clean-water collection.

## Cross-Floor Hooks

- Antenna Court receives signal quality from roof repairs.
- Ministry can suppress or demand false roof reports.
- Market 88 pays for weather/signal access.
- Darkness can later corrupt the sky texture into a no-sky variant.

## DoD

- Debug can force-enter roof and cycle sky time.
- Dynamic sky is visible, nonblank and bounded in update cost.
- Player can reach one antenna, one shelter and one exit without knowing source code.
- At least one quest changes a signal/weather state and publishes an event.
