const fs = require('fs');

let mainTs = fs.readFileSync('src/main.ts', 'utf8');

const startTag = '/* ── Projectile update: move, collide walls + entities ────────── */';
const endTag = '/* ── Explosion (grenade / BFG) — AoE damage + scorch decals ──── */';

const startIndex = mainTs.indexOf(startTag);
const endIndex = mainTs.indexOf(endTag);

if (startIndex === -1 || endIndex === -1) {
  console.log('Error: tags not found');
  process.exit(1);
}

const replacement = fs.readFileSync('replacement.ts', 'utf8');

mainTs = mainTs.substring(0, startIndex) + replacement + '\n' + mainTs.substring(endIndex);

fs.writeFileSync('src/main.ts', mainTs);
console.log('Patched main.ts');
