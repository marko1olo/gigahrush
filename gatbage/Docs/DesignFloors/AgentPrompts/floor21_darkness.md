# FLOOR21_DARKNESS

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: authored Darkness design floor.

<AGENT_PROMPT id="FLOOR21_DARKNESS">
PROMPT IDENTIFIED: FLOOR21_DARKNESS | DOMAIN: Design floor / Post-Void darkness / Light resource | ITERATION: floor-wave-1.

## Mandatory Preflight

1. Read `README.md`, `architecture.md`, `desdoc.md`, `Docs/DesignFloors/INDEX.md`, `Docs/DesignFloors/floor_contract.md`, `Docs/DesignFloors/darkness.md`.
2. Read references: `src/gen/void/index.ts`, `src/render/webgl.ts`, `src/render/hud_fx.ts`, `src/render/map_ui.ts`, `src/entities/shadow.ts`.
3. Create `Docs/Tasks/Status_FLOOR21_DARKNESS.md`.
4. Append final report to `Docs/AgentLogs/LOG_FLOOR21_DARKNESS.md`.
5. Run baseline `npm run build`.

## Goal

Implement a small post-Void anti-floor where light is a resource, rooms are revealed by illumination and one preserved name/fact can return to the world.

## Absolute Write Scope

Owned:
- New `src/gen/design_floors/darkness.ts`
- Optional local darkness data file
- `Docs/Tasks/Status_FLOOR21_DARKNESS.md`
- `Docs/AgentLogs/LOG_FLOOR21_DARKNESS.md`

Forbidden:
- Do not make the canvas blank or unreadable.
- Do not implement global darkness over all floors in MVP.
- Do not edit final victory flow.
- Do not add unbounded shadow spawns.

## Implementation Tasks

1. Export `generateDarknessDesignFloor()`.
2. Stamp a small authored layout with hidden/revealed room labels.
3. Add NPCs/quests for lamp survival, name recovery, shadow toll and return trace.
4. Store local state: light budget, revealed room ids, preserved name id, toll state.
5. Publish one return trace event for Living/Ministry/Yakov future hooks.
6. Run `npm run typecheck`; run `npm run check` if render/map behavior changes.

## Done Means

Darkness is playable, readable, and uses light for at least two meaningful choices.
</AGENT_PROMPT>

<POLISH_MANDATE>
The floor may be dark, but it must never look broken. Add minimum navigation contrast before adding more horror.
</POLISH_MANDATE>

