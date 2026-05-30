# Design Floor: `communal_ring`

Route: z=+4, base `KVARTIRY`, role "social bypass and communal ring".

Primary source:

- `src/gen/design_floors/communal_ring.ts`
- `Docs/DesignFloors/communal_ring.md`
- `Docs/DesignFloors/rework_floor_10_communal_ring.md`

Safe improvement target:

- Ring corridor, through-flats, shared services and courtyard void.
- Domestic service loop grammar around kitchen, water, pantry and smoking rooms.
- Potts grievance domains.

Implementation notes:

- Distinct from `KVARTIRY`: more ring/social bypass, less raw dense wall grid.
- No background refill.
- Protect service loops after samosbor/rebuild.

Required decisions:

- Clean.
- Steal.
- Trade.
- Hide.
- Expose notice.
- Repair primus/water.

Validation:

- `npm run typecheck`
- `npm run test:generation`
- `npm run check`
