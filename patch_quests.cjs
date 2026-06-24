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

let mainTs = fs.readFileSync('src/main.ts', 'utf8');

// Add import
mainTs = mainTs.replace("  updateKillQuestPressure,\n}", "  updateKillQuestPressure,\n  getActiveQuestsCount,\n}");

// Replace usages
mainTs = mainTs.replace(/const total = state\.quests\.filter\(q => !q\.done\)\.length;/g, "const total = getActiveQuestsCount(state.quests);");
mainTs = mainTs.replace(/const totalQ = state\.quests\.filter\(q => !q\.done\)\.length;/g, "const totalQ = getActiveQuestsCount(state.quests);");

// there are also cases where we filter and then only check the length. Let's find those.
// actually, for this specific task, the prompt says "File: src/main.ts:6366, Issue: Repeated filter over quests array in frame processing. Rationale: Can be cached or maintaining an active quests count instead of recomputing it."

fs.writeFileSync('src/main.ts', mainTs);
console.log('Patched');
