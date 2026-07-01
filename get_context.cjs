const fs = require('fs');

const mainTs = fs.readFileSync('src/main.ts', 'utf8');

const startTag = '/* ── Projectile update: move, collide walls + entities ────────── */';
const startIndex = mainTs.indexOf(startTag);

console.log(mainTs.substring(startIndex - 500, startIndex + 500));
