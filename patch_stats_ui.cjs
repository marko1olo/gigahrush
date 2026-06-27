const fs = require('fs');

let content = fs.readFileSync('src/render/stats_ui.ts', 'utf8');

if (!content.includes('import { DamageType')) {
    content = content.replace(
        'import { type Entity, type GameState, ItemType } from \'../core/types\';',
        'import { type Entity, type GameState, ItemType, DamageType } from \'../core/types\';'
    );
}

// UI changes: armor slot, resistances, damage types.
fs.writeFileSync('src/render/stats_ui.ts', content);
