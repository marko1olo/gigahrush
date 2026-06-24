const fs = require('fs');
let questsTs = fs.readFileSync('src/systems/quests.ts', 'utf8');
const newFunction = `export function getActiveQuestsCount(quests: Quest[]): number {
  let count = 0;
  for (let i = 0; i < quests.length; i++) {
    if (!quests[i].done) count++;
  }
  return count;
}

`;
questsTs = questsTs.replace("export function questIsProcedural", newFunction + "export function questIsProcedural");
fs.writeFileSync('src/systems/quests.ts', questsTs);
console.log('Patched quests.ts');
