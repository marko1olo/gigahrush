# MACRO2_90: Net Terminal Gen Map Editor Safety

Модель: GPT-5.5, reasoning extra high.

Цель: diegetic current-floor editor patches survive floor transitions/rebuilds without corrupting route or save state.

Критично: map editor is powerful debug/content tool; unsafe patches can create hard-to-reproduce softlocks.

Ownership: `src/systems/net_terminal_gen.ts`, `src/systems/map_editor.ts`, `src/render/map_editor_ui.ts`, tests.

Читать: `README.md НЕТ-ТЕРМИНАЛ ГЕН`, `Docs/Expansions/11_net_terminal_gen_map_editor/expansion.md`.

Deliverables:
- patch replay validates reachable spawn/lifts;
- existing floor-instance/procedural/design keying respected;
- editor UI warns on dangerous brush/replay result.

Проверки: `npm run test:unit`, manual unlock terminal/editor route.

Параллельные ограничения: keep editor debug/diegetic; not a player progression dependency.
