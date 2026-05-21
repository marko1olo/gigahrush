# Design Floor: Темный отсек

Status: implemented authored route floor. Route id: `darkness`. Anchor: `z=-50`. Base floor: `VOID`. Shipped HUD name: `Темный отсек`.

Owned file: `src/gen/design_floors/darkness.ts`. Planning sections below preserve the original `Тьма` brief; shipped route display is `Темный отсек`.

## Role

Darkness is not just a darker Void. It is the anti-floor after the Void: labels fail, light becomes inventory, rooms are known only when lit, and the player must choose what to illuminate. It should be optional or late, not required for normal first victory.

Primary decisions: spend light, carry or abandon NPC, reveal route or loot, fight shadows, preserve one memory, flee before lights die.

## Generation

- Small authored layout, not huge maze.
- Rooms exist physically but names/map details are hidden until lit.
- Use dark textures, sparse lights, high-contrast silhouettes.
- Avoid total black unreadability; keep a minimum navigational horizon.

## NPCs

- `darkness_lamp_bearer_nika`: can carry light but panics.
- `darkness_name_lost`: NPC whose name exists only under light.
- `darkness_shadow_collector`: trades light for route hint.
- `darkness_return_trace`: proof that Darkness touched another floor.

## Quests

- `darkness_keep_lamp_alive`: manage limited light through rooms.
- `darkness_find_name`: reveal and preserve one NPC/name/record.
- `darkness_shadow_toll`: pay light, fight or take longer route.
- `darkness_return_with_trace`: bring a mark back to Living/Yakov/Ministry.

## Systems

State is local and compact:

```txt
lightBudget
revealedRoomIds[]
preservedNameId
shadowTollState
```

Do not implement global darkness over all floors in MVP. Cross-floor effects are events/flags/readables only.

## Samosbor

Darkness samosbor is inverted: siren may be silent, and light failure is the warning. Shelter works only if lit or previously revealed. Aftermath can erase one map label or create one dark rumor elsewhere.

## Cross-Floor Hooks

- Void can open Darkness and carry protocol backlash.
- Roof sky can become no-sky if Darkness trace returns.
- Ministry/Archive labels and names can fail.
- Living gets a limited, readable post-return consequence.

## DoD

- Darkness is playable without making the screen blank.
- Light is a resource with at least two uses.
- One preserved/revealed thing changes a later floor fact.
