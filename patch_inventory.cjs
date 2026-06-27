const fs = require('fs');

let content = fs.readFileSync('src/systems/inventory.ts', 'utf8');

// Add equip armor logic to item consumption? Or just add armor to ItemEquipSlot
// Let's modify src/data/items.ts first.
