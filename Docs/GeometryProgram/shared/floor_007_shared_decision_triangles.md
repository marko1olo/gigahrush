# Shared Tool: Decision Triangle Placement

Purpose: generic placement of risk, reward and escape points around POIs.

Use cases:

- toll gates
- archive stashes
- anomaly controls
- bridge repair points
- shelter routes
- factory sabotage rooms

Inputs:

- reachable candidate cells
- room/zone tags
- protected masks
- desired distance bands
- optional visibility cues

Scoring:

```txt
score =
  room_match
+ zone_match
+ distance_band
+ visibility_cue
+ exit_separation
- cluster_penalty
- spawn_camping_penalty
- protected_penalty
```

Bounds:

- sample 100-300 reachable candidates
- greedy max-min spacing
- respect 32x32 bucket caps

Validation:

- risk, reward and escape not colocated
- escape point can reach lift/shelter
- protected cells avoided
