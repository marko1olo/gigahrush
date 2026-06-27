const fs = require('fs');

const content = fs.readFileSync('src/render/stats_ui.ts', 'utf8');

console.log(content.match(/function inventoryEquipmentLines/g));
console.log(content.match(/interface EquipmentLine/g));
