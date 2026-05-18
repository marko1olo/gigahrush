# Monster_08_Filtronos

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: filter/resource sabotage encounter owner.

<AGENT_PROMPT id="MONSTER_08_FILTRONOS">
PROMPT IDENTIFIED: MONSTER_08_FILTRONOS | DOMAIN: Monster Content | ITERATION: monsters.md wave 1.

## Mandatory Preflight

1. Extract this XML block by id with a CLI command.
2. Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, and `AGENTS.md`.
3. Read relevant source:
   - `src/gen/maintenance/watermeter_post.ts`
   - `src/gen/maintenance/brown_slime_cleanup.ts`
   - `src/gen/living/govnyak_smoke_den.ts`
   - `src/data/items.ts`
   - `src/systems/containers.ts`
   - `src/systems/events.ts`
4. Create `Docs/Tasks/Status_MONSTER_08_FILTRONOS.md`.
5. Append final report to `Docs/AgentLogs/LOG_MONSTER_08_FILTRONOS.md`.
6. Run baseline `npm run typecheck` and record the exact result.

## Goal

Implement `filtronos` / **Фильтронос** as a local clean-air/water-resource sabotage encounter. It should threaten preparation supplies in one POI, not globally scan inventory or containers.

## Absolute Write Scope

Owned:
- New source file: `src/gen/maintenance/filtronos.ts`
- `Docs/Tasks/Status_MONSTER_08_FILTRONOS.md`
- `Docs/AgentLogs/LOG_MONSTER_08_FILTRONOS.md`
- Optional focused test: `tests/monster_08_filtronos.test.ts`

Conditional integration:
- `src/gen/maintenance/content_manifest.ts` only with explicit manifest ownership.

Forbidden:
- Do not scan all containers or player inventory each frame.
- Do not destroy essential quest items.
- Do not create a new economy system.

## Design Contract

- id: `filtronos`
- ru_name: `Фильтронос`
- mode: A local encounter, B only later
- floors: `MAINTENANCE`, smog procedural floors, water rooms
- room/context: filter cache, watermeter, smog cleanup closet
- warning cue: sucking breath, dry puddle, filter wrappers, stale-air NPC bark
- counterplay: seal container, use gasmask before fight, distract with bad filter/govnyak, kill quickly
- failure result: local filter/water container is contaminated or guarded harder
- reward/trace: `filter_layer`, `gasmask_filter`, `filter_receipt`
- event/rumor hook: tags `monster`, `filter`, `smog`, `resource_sabotage`

## Implementation Tasks

1. Create a bounded Maintenance filter cache with one owned container.
2. Place a named threat using existing monster behavior or a local named `POLZUN`/`TVAR`/`NELYUD`.
3. Add a visible risk to the cache before opening.
4. Make the sabotage preventable: seal, distract, or clear before looting.
5. If contamination occurs, affect only the module-owned container contents.
6. Publish an event for contaminated, protected, or recovered supplies.
7. Run `npm run typecheck`; run `npm run check` if integrated.

## Done Means

- The player protects resources by planning, not by reading source code.
- Resource pressure is local and reversible or avoidable.
- No global scan or economy rewrite.
</AGENT_PROMPT>

<POLISH_MANDATE>
The monster should make filters feel valuable. Do not punish the player's whole inventory.
</POLISH_MANDATE>
