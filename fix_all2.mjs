import fs from 'fs';
let tut = fs.readFileSync('src/gen/design_floors/tutorialapartments.ts', 'utf8');
tut = tut.replace("import('../../core/types').Cell.DOOR", "2 /* Cell.DOOR */");
tut = tut.replace("import { RoomType, Tex, type Entity, EntityType, Faction, Occupation } from '../../core/types';", "import { RoomType, Tex, type Entity, EntityType, Faction, Occupation, Cell } from '../../core/types';");
tut = tut.replace("2 /* Cell.DOOR */", "Cell.DOOR");
tut = tut.replace("import { World }", "// import { World }");
fs.writeFileSync('src/gen/design_floors/tutorialapartments.ts', tut);
