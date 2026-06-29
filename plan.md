1. **Goal**: Address the code health issue described in `src/systems/ai/combat.ts:519`. The comment reads:
   `// TODO: [TEMPORARY SOLUTION] NPCs need ammo to shoot but they do not consume it, to prevent burning through their supply.`
   The requested action is to fix the temporary solution by making NPCs properly consume ammo when they fire projectiles.

2. **Analysis**:
   - In `src/systems/ai/combat.ts`, the `npcCommitRangedShot` function handles NPCs firing ranged weapons.
   - For regular ranged weapons, there is a check: `if (ws.ammoType && e.inventory?.some(s => s.defId === ws.ammoType && s.count > 0) !== true) return false;`
   - However, the ammo is never removed from the NPC's inventory.
   - The project has an existing function `removeItem(e: Entity, defId: string, count: number): boolean` in `src/systems/inventory.ts` that safely removes items from an entity's inventory.
   - We need to import `removeItem` in `src/systems/ai/combat.ts` and call it inside `npcCommitRangedShot` right after confirming that the NPC has ammo.
   - `npcAutoEquipBestWeapon` is already correctly checking `hasAmmo` and is called by the combat AI when a weapon fails to shoot (`npcCommitRangedShot` returns false or similar logic in `updateNpcCombat`), so the AI will naturally switch to a fallback weapon (like melee) if they run out of ammo.

3. **Execution Plan**:
   - Update imports in `src/systems/ai/combat.ts` to include `removeItem` from `../inventory`.
   - Update `npcCommitRangedShot` in `src/systems/ai/combat.ts` to consume ammo.
   - Ensure the TODO comment is removed.
   - Complete pre-commit steps.
   - Submit changes.
