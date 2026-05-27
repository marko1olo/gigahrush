# Sprite Items

Active planning package for replacing generic yellow item drops with procedural item-specific sprites.

This directory contains 50 parallel bundle tasks covering all 431 current item plans, plus a manifest and an integration orchestrator. It is active domain documentation, not an agent log or shipped-behavior source of truth.

Use `sprite_item_000_manifest.md` to assign future parallel GPT-5.5 workers. Each `sprite_item_bundle_NNN.md` owns 8-9 item ids and should remain independent until the orchestrator merges implementation changes. The old single-item `sprite_item_NNN.md` files were removed after their contents were moved into the bundle files.
