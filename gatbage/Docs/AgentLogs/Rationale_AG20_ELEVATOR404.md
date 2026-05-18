# Rationale_AG20_ELEVATOR404

## Scope

Problem: Numbered elevator floors can easily become enum spam or hidden full floor generators.  
Solution: Represent numbered floors as metadata records with `baseFloor`, display number, seed tag, risk and route weight. Runtime state stores at most one active instance and reuses the existing base generator.  
Rejected Alternatives: `FloorLevel.F404`, one generator per number, or pre-generating pockets in the background.  
Hardware Impact: Inactive cost is 0 us/frame. Route resolution runs only when the player uses a lift.

## Route Behavior

Problem: The elevator should feel uncertain without making normal travel unreliable.  
Solution: Normal transitions remain the default. Anomaly chance starts low, rises during samosbor, has a 90-second cooldown and redirects only the transition target.  
Rejected Alternatives: Per-frame lift polling or frequent forced anomalies.  
Hardware Impact: One random roll and weighted pick per lift interaction.

## Save/Load

Problem: Existing saves know only `currentFloor`.  
Solution: Store optional `floorInstances` state outside `GameState` typing via a normalized extension. Missing or invalid state clears to a stable floor; active valid instances load through their `baseFloor`.  
Rejected Alternatives: Changing `FloorLevel` or requiring a save version bump.  
Hardware Impact: Bounded normalization copies 8 discovery flags at load/save only.

## Player Feedback

Problem: A wrong elevator route can look like a bug.  
Solution: The arrival message, HUD floor label, minimap/full-map labels and debug overlay all show the active numbered instance. The route also publishes `elevator_anomaly` / `elevator_loop_exit` events and seeds nearby NPC memory with existing lift/floor rumors.  
Rejected Alternatives: Silent redirects or map distortion without labels.  
Hardware Impact: HUD checks a tiny optional state object; no world scans. Rumor spread scans entities only on anomaly, capped at 8 remembered NPCs.
