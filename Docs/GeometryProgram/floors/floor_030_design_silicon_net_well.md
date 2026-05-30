# Design Floor: `silicon_net_well`

Route: z=-22, base `MAINTENANCE`, role "NET access, silicon life, rare weapon".

Primary source:

- `src/gen/design_floors/silicon_net_well.ts`
- `Docs/DesignFloors/silicon_net_well.md`
- `Docs/DesignFloors/rework_floor_15_silicon_net_well.md`

Safe improvement target:

- Radial NET pods, crystal corridors, well shaft and vault shell.
- Hilbert/circuit traces between terminals.
- Gray-Scott/crystal bands for silicon life zones.

Implementation notes:

- Hack backlash cooldown-bounded.
- GBE remains bounded beam deletion.
- No network dependency; local game works offline.

Required decisions:

- Help Sibo.
- Steal GBE.
- Betray scientist.
- Hack terminal.
- Provoke or avoid Safeguard.

Validation:

- `npm run typecheck`
- `npm run test:generation`
- `npm run check`
