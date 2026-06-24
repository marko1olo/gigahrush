const fs = require('fs');

let content = fs.readFileSync('src/gen/kvartiry/index.ts', 'utf8');

content = content.replace(
  "  const spawnPt = locateSpawnPoint(world);\n  spawnX = spawnPt.spawnX;\n  spawnY = spawnPt.spawnY;",
  "  const spawnPt = locateSpawnPoint(world);\n  let spawnX = spawnPt.spawnX;\n  let spawnY = spawnPt.spawnY;"
);

fs.writeFileSync('src/gen/kvartiry/index.ts', content);
console.log('Success');
