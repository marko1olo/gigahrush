# Кремниевый НЕТ-колодец

Status: shipped routed design floor.

## Route Facts

- Route id: `silicon_net_well`
- z: `-22`
- Base floor: `FloorLevel.MAINTENANCE`
- Generator: `src/gen/design_floors/silicon_net_well.ts`
- Debug teleport: generated from `DESIGN_FLOOR_ROUTES`

## Contract

Кремниевый НЕТ-колодец is a maintenance-side route stop between the Service Floor and Collectors. It is an authored BLAME-inspired pocket with Sibo, a cyborg scientist, administrators, silicon-life guardians, NЕТ terminals and the GBE source/reward.

The floor must stay a routed design floor, not a new `FloorLevel`.

## Play Surface

- Help Sibo feed the NЕТ branch and receive the `gravity_beam_emitter`.
- Steal the GBE from the locked vault and risk losing loot/access when firing it.
- Give the cyborg scientist to administrators through the local kill quest.
- Use NЕТ terminals: normal access opens the editor path; failed special-console hacks spawn one Safeguard and put the terminal on cooldown.
- Fight or avoid silicon-life guardians represented by existing monster kinds plus Safeguard.

## Runtime Hooks

- NЕТ terminals are placed by `systems/net_terminal_gen.ts` through the `design:silicon_net_well` floor profile.
- Failed silicon-console hacks publish `net_terminal_hack_failed` with tags including `net`, `hack_failed`, `safeguard` and `silicon_net_well`.
- The GBE is generic weapon content: item data in `data/items.ts`, weapon stats in `data/weapons.ts`, effect in `systems/weapon_beams.ts`.

## Verification

- Teleport to `silicon_net_well`.
- Confirm both lifts are reachable.
- Interact with a special НЕТ-КОЛОДЕЦ terminal without НЕТ-ГЕН until a failed hack spawns a Safeguard and cooldown message.
- Get or steal the GBE, equip energy cells, fire it at a wall/target, and verify cells/entities are removed without a full-world scan.
