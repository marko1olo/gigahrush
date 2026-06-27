const fs = require('fs');
let content = fs.readFileSync('src/data/items.ts', 'utf8');

if (!content.includes('ItemEquipSlot =')) {
  console.log('Cannot find ItemEquipSlot');
} else {
  content = content.replace(
    'export type ItemEquipSlot = \'weapon\' | \'tool\';',
    'export type ItemEquipSlot = \'weapon\' | \'tool\' | \'armor\';'
  );
  content = content.replace(
    '  if (def.type === ItemType.TOOL) return \'tool\';',
    '  if (def.type === ItemType.TOOL) return \'tool\';\n  if (def.type === ItemType.ARMOR) return \'armor\';'
  );
}

fs.writeFileSync('src/data/items.ts', content);
