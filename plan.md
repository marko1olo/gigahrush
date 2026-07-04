1. **Define Data for Characters (src/data/plot_characters.ts):**
   - Create `src/data/plot_characters.ts` exporting `CHAR_HERO` and `CHAR_VILLAIN` per the spec:
     ```typescript
     export interface NpcTemplate {
       id: string;
       name: string;
       sprite: string;
       health: number;
       faction: string;
       flags: string[];
       dialogId?: string;
     }

     export const CHAR_HERO: NpcTemplate = {
       id: 'char_hero_artem',
       name: 'Артем (Герой)',
       sprite: 'hero_unique', // We may need to map this to a number or string depending on how it's used
       health: 200,
       faction: 'resistance',
       flags: ['IMMORTAL', 'PLOT_CRITICAL'],
       dialogId: 'hero_intro_dialog'
     };

     export const CHAR_VILLAIN: NpcTemplate = {
       id: 'char_villain_kombinat',
       name: 'Глава Комбината',
       sprite: 'villain_suit',
       health: 500,
       faction: 'kombinat',
       flags: ['IMMORTAL', 'PLOT_CRITICAL', 'HOSTILE_LATER']
     };
     ```

2. **Spawn Logic (src/gen/plot_spawns.ts):**
   - Create `src/gen/plot_spawns.ts`.
   - Implement `spawnPlotCharacter` and a placeholder `NpcRole.CINEMATIC_ACTOR` enum or type, as `NpcRole` isn't in `src/core/types.ts`. I will define `NpcRole` enum in `src/core/types.ts` since the prompt explicitly uses `npc.role = NpcRole.CINEMATIC_ACTOR;`. Also, `npc.plotId` will be used to track the id, though `plotNpcId` is the actual field name in `Entity`. Wait, the prompt says `npc.plotId = template.id`, so I will add `plotId?: string` to `Entity` in `src/core/types.ts` as well as `role?: NpcRole`. I will also add `NpcRole` enum with `CINEMATIC_ACTOR`.

3. **Scene Script (src/data/scenes_manifest.ts):**
   - Create `src/data/scenes_manifest.ts` defining `SCENE_CONFRONTATION_1` with the array of steps.

4. **Combat Invulnerability (src/systems/combat.ts):**
   - Modify `applyHitStaggerAndKnockback` or `calculateDamage` in `src/systems/combat.ts` or both. Wait, `calculateDamage` doesn't have access to the NPC template flags. I'll need to fetch the template flags or store `flags?: string[]` on `Entity`. Actually, I can just store `flags: string[]` on `Entity` when spawning in `spawnPlotCharacter`.
   - In `calculateDamage` (or before subtracting `hp`), if `target.flags?.includes('IMMORTAL') || target.flags?.includes('PLOT_CRITICAL')`, return 0 or do not subtract HP. Let's add `flags?: string[]` to `Entity` in `src/core/types.ts`.
   - Modify `calculateDamage` to return 0 if these flags are present:
     ```typescript
     if (target.flags && (target.flags.includes('IMMORTAL') || target.flags.includes('PLOT_CRITICAL'))) {
       return 0;
     }
     ```

5. **Completeness & pre-commit steps:**
   - Execute `npm run typecheck` and `npm run test:unit`.
   - Run `pre_commit_instructions` tool to make sure proper testing, verifications, reviews and reflections are done.
