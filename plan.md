1. **Analyze Requirements:**
   - **File:** `src/systems/ai/mugging_utility.ts`
   - **Function:** `scoreMuggingIntent`
   - **Requirements:**
     1. Faction check: NPC must belong to `Faction.WILD`. (Return 0 if not).
     2. Distance check: Distance to player using `getEntityIndex().queryRadiusCapped`. Let's say `MUGGING_EVAL_RADIUS = 15`. Distance should be measured properly using dx/dy wrapping logic (or simply use the queryRadius directly without wrapping yourself). The prompt says `используйте broadphase/entity_index`.
     3. Player Relation check: Player relation (`getNpcPlayerRelation(npc)`) must be `< 0`.
     4. Group check: The group must consist of `>= 3` *armed* NPCs around the player. (Query using `queryRadiusCapped`, check `faction === Faction.WILD` and `equippedCombatItemId` is weapon / ranged).
     5. Cooldown check: Check `getRecentEvents` for `mugging_start` type to enforce a cooldown (e.g., `MUGGING_COOLDOWN_SEC = 300`). Wait, I can just use `time - recent.time` but it's seconds if it's `time` (usually `state.time` is seconds).

2. **Implementation of `scoreMuggingIntent`:**
   ```typescript
   import { Faction, type Entity, type GameState } from '../../core/types';
   import { ENTITY_MASK_NPC, getEntityIndex } from '../entity_index';
   import { getNpcPlayerRelation } from '../npc_relations';
   import { getRecentEvents } from '../events';
   import { equippedCombatItemId, getWeaponStats } from '../inventory';

   const MUGGING_EVAL_RADIUS = 12;
   const MUGGING_COOLDOWN_SEC = 300;
   const MUGGING_MIN_GROUP_SIZE = 3;

   const _muggingGroupQuery: Entity[] = [];

   function isArmed(e: Entity): boolean {
     const wId = equippedCombatItemId(e);
     if (!wId) return false;
     const ws = getWeaponStats(e, wId);
     return ws.dmg > 3 || ws.isRanged;
   }

   export function scoreMuggingIntent(npc: Entity, state: GameState, player: Entity): number {
     if (npc.faction !== Faction.WILD) return 0;
     if (getNpcPlayerRelation(npc) >= 0) return 0;

     // 2. Distance check via entity_index (also used for group check)
     const index = getEntityIndex();
     const count = index.queryRadiusCapped(player.x, player.y, MUGGING_EVAL_RADIUS, _muggingGroupQuery, ENTITY_MASK_NPC, 16);

     // 4. Group size check + 2. Ensure this NPC is within the radius (implied if we check distance, or we can just see if it's in the query)
     let armedWilds = 0;
     let npcInRadius = false;

     for (let i = 0; i < count; i++) {
       const e = _muggingGroupQuery[i];
       if (e.id === npc.id) npcInRadius = true;
       if (e.faction === Faction.WILD && isArmed(e)) {
         armedWilds++;
       }
     }

     if (!npcInRadius) return 0;
     if (armedWilds < MUGGING_MIN_GROUP_SIZE) return 0;

     // 5. Cooldown check
     const recentStarts = getRecentEvents(state, { type: 'mugging_start', limit: 1 });
     if (recentStarts.length > 0 && state.time - recentStarts[0].time < MUGGING_COOLDOWN_SEC) return 0;

     return 10;
   }
   ```
