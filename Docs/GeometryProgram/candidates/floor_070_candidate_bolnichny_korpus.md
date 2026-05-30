# Candidate Floor: `bolnichny_korpus`

Priority: required first-wave candidate.

Recommended form: authored design floor.

Status: implemented as authored design floor `bolnichny_korpus` at `z=+16`.

Base floor: `FloorLevel.KVARTIRY`. The implementation uses converted residential wards, patient queues and apartment-band ventilation as the route fantasy; Ministry-style pressure is represented through quarantine papers, locked pharmacy access and audits.

Fantasy: hospital, quarantine and triage block where medicine, infection and permissions shape route choices.

Algorithm stack:

- ward clusters
- infection Voronoi cells
- locked clean corridors
- ventilation graph
- cold/warm shells

Implementation files:

- `src/gen/design_floors/bolnichny_korpus.ts`
- `src/data/design_floors.ts`
- `src/gen/design_floors/manifest.ts`
- optional population profile

Required structures:

- triage entrance
- clean loop
- infected wards
- pharmacy
- ventilation bypass
- quarantine checkpoint

Gameplay decisions:

- steal medicine
- forge clearance
- escort infected NPC
- choose which ward gets treatment
- expose contaminated papers

Validation:

- clean and dirty routes both reachable
- pharmacy gated but reachable
- quarantine cannot block both lifts
- no infection refill
