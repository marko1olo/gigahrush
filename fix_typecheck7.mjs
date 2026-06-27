import fs from 'fs';

let pop = fs.readFileSync('src/data/design_floor_population.ts', 'utf8');
pop = pop.replace("marx_10: { npcTarget: 0, monsterTarget: 'safe', monsterPlacementKind: 'safe', monsterBiasKinds: [], monsterTags: [] },\n  darkness: {", "darkness: {");
fs.writeFileSync('src/data/design_floor_population.ts', pop);

let terr = fs.readFileSync('src/data/floor_territory.ts', 'utf8');
terr = terr.replace("marx_10: shares(100, 0, 0, 0, 0),\n  darkness: shares(", "darkness: shares(");
fs.writeFileSync('src/data/floor_territory.ts', terr);
