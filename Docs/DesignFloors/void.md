# Story Anchor Brief: Пустота

Status: historical expansion brief for the existing story anchor. Current route stop: `FloorLevel.VOID` at `z=-50`. There is no shipped design-floor route id `void`; README and `src/data/procedural_floors.ts` remain source of truth.

Existing generator references: `src/gen/void/`, `Docs/Expansions/10_void_afterprotocol/`. Planning sections below describe possible route-scale expansion, not shipped design-floor route data.

## Role

Void is late-game anomaly/protocol space. It changes local rules and asks the player what they are willing to preserve. It should be sparse, legible and consequential, not a random abstract screensaver.

Primary decisions: preserve, erase, seal, copy, refuse, fight boss, accept backlash, return.

## Generation

Use current Void generator as base:

- warning cell, bottled voice, protocol chamber, borrowed light rule chamber;
- disconnected-looking but physically navigable rooms;
- strong contrast, no blank canvas failures.

## NPCs

Existing Jean/plot anchors remain. Expanded route-scale traces:

- `void_protocol_clerk`: offers one local rule contract.
- `void_borrowed_neighbor`: person/light borrowed from Living.
- `void_black_box_echo`: event trace visible for debug/lore.

## Quests

- `void_preserve_door`: preserve one room/door elsewhere with backlash.
- `void_return_voice`: decide where bottled voice belongs.
- `void_seal_trace`: prevent a bad event from spreading, but lose reward.
- `void_open_darkness`: optional post-void descent, not normal victory route.

## Systems

Use protocol contracts:

```txt
protocolId
targetKey
scope: room/door/container/route
effectState
backlashPending
```

No unbounded search for targets. Targets must come from recent interaction, debug selection or authored room ids.

## Cross-Floor Hooks

- Can preserve or corrupt a local fact from any prior floor.
- Darkness is a post-void optional route if implemented.
- Ministry/Archive can receive impossible records.
- Living hub can show a small return consequence.

## DoD

- One protocol has clear local benefit and clear backlash.
- Debug can dump active protocols and target keys.
- Return route is deterministic and safe.
