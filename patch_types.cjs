const fs = require('fs');

let content = fs.readFileSync('src/core/types.ts', 'utf8');

// Add DamageType enum if it doesn't exist
if (!content.includes('export enum DamageType')) {
  content = content.replace(
    'export enum ItemType',
    'export enum DamageType { FIRE = "fire", ENERGY = "energy", PSI = "psi", KINETIC = "kinetic", SHOT = "shot" }\n\nexport enum ItemType'
  );
}

// Add resistances and damageType to ItemDef
if (!content.includes('resistances?: Record')) {
  content = content.replace(
    '  stack?: number;',
    '  stack?: number;\n  damageType?: DamageType; // For weapons\n  resistances?: Record<DamageType, number>; // For armor\n'
  );
}

// Add armor slot to Entity
if (!content.includes('armor?: string;')) {
  content = content.replace(
    '  tool?: string;              // equipped tool def id',
    '  tool?: string;              // equipped tool def id\n  armor?: string;             // equipped armor def id'
  );
}

fs.writeFileSync('src/core/types.ts', content);
