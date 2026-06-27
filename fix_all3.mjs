import fs from 'fs';

// 1. Fix tutorial room connection
let tut = `import { RoomType, Tex, type Entity, EntityType, Faction, Occupation, Cell } from '../../core/types';
import { World } from '../../core/world';
import { stampRoom, protectRoom } from '../shared';

export function generateTutorialApartmentsDesignFloor(world: World, entities: Entity[], nextId: {v: number}, startX: number, startY: number) {
  let nextRoomId = world.rooms.length;

  const aptW = 12;
  const aptH = 12;

  // Find clear position near start room
  let aptX = startX + 5;
  let aptY = startY + 5;

  function areaClear(bx: number, by: number, fw: number, fh: number): boolean {
    for (let dy = -1; dy <= fh; dy++)
      for (let dx = -1; dx <= fw; dx++)
        if (world.aptMask[world.idx((bx + dx + 1024) % 1024, (by + dy + 1024) % 1024)]) return false;
    return true;
  }

  let found = false;
  for (let r = 2; r < 50 && !found; r++) {
    for (let dy = -r; dy <= r && !found; dy++) {
      for (let dx = -r; dx <= r && !found; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
        const tx = (startX + dx + 1024) % 1024;
        const ty = (startY + dy + 1024) % 1024;
        if (areaClear(tx, ty, aptW, aptH)) {
          aptX = tx; aptY = ty; found = true;
        }
      }
    }
  }

  const room = stampRoom(world, nextRoomId++, RoomType.LIVING, aptX, aptY, aptW, aptH, -1);
  room.name = 'Учебная квартира';
  room.wallTex = Tex.PANEL;
  room.floorTex = Tex.F_CONCRETE;
  protectRoom(world, aptX, aptY, aptW, aptH, Tex.PANEL, Tex.F_CONCRETE);

  // Door connecting roughly to outside
  const doorIdx = world.idx(aptX, aptY + Math.floor(aptH / 2));
  world.cells[doorIdx] = Cell.DOOR;
  world.wallTex[doorIdx] = Tex.DOOR_WOOD;
  world.floorTex[doorIdx] = Tex.F_CONCRETE;

  // Spawn 3 peaceful neighbors
  for (let i = 0; i < 3; i++) {
    entities.push({
      id: nextId.v++,
      type: EntityType.NPC,
      x: aptX + 2 + i * 2,
      y: aptY + 2 + i * 2,
      angle: Math.PI / 2,
      pitch: 0,
      alive: true,
      speed: 1.0,
      hp: 80,
      maxHp: 80,
      faction: Faction.CITIZEN,
      occupation: Occupation.HOUSEWIFE,
      sprite: Occupation.HOUSEWIFE,
      playerRelation: 1, // Minimum friendly threshold
    });
  }

  const spawnX = aptX + 1;
  const spawnY = aptY + 1;

  return { spawnX, spawnY };
}
`;
fs.writeFileSync('src/gen/design_floors/tutorialapartments.ts', tut);

// Fix living index
let index = fs.readFileSync('src/gen/living/index.ts', 'utf8');
const logic = `  /* ── A1_c: Tutorial Residents ─────────────── */
  generateTutorialApartmentsDesignFloor(world, entities, { v: nextId }, startRoom.spawnX, startRoom.spawnY);
  nextId = entities.reduce((mx, e) => Math.max(mx, e.id), nextId) + 1;`;
index = index.replace("  /* ── A1b: Yakov's lab", logic + "\n\n  /* ── A1b: Yakov's lab");

const importStr = "import { generateTutorialApartmentsDesignFloor } from '../design_floors/tutorialapartments';\n";
if (!index.includes("import { generateTutorialApartmentsDesignFloor }")) {
  index = index.replace("import { generateTutorRoom } from './tutor_room';", "import { generateTutorRoom } from './tutor_room';\n" + importStr);
}
fs.writeFileSync('src/gen/living/index.ts', index);


// 2. Fix hostility check
let npcR = fs.readFileSync('src/systems/npc_relations.ts', 'utf8');
const replacementR = `export function isNpcPlayerHostile(npc: Entity): boolean {
  const rel = getNpcPlayerRelation(npc);
  // Tutorial residents from marx_10 become hostile if their relation drops below 0.
  // Their initial playerRelation is set to 1 in tutorialapartments.ts.
  if (npc.playerRelation !== undefined && npc.playerRelation < 1 && npc.maxHp === 80) {
    return rel < 0;
  }
  return rel <= HOSTILE_RELATION_THRESHOLD;
}`;
npcR = npcR.replace(/export function isNpcPlayerHostile\(npc: Entity\): boolean \{[\s\S]*?return rel <= HOSTILE_RELATION_THRESHOLD;\n\}/, replacementR);
fs.writeFileSync('src/systems/npc_relations.ts', npcR);

// 3. Fix main urination penalty
let main = fs.readFileSync('src/main.ts', 'utf8');
const mainStr = `function applyUrinationPenalty(dt: number): void {
  const room = world.roomAt(player.x, player.y);
  if (room && room.type === RoomType.BATHROOM) return; // toilet — no penalty

  const ownerFaction = territoryFactionAt(world, player.x, player.y);
  if (ownerFaction === null) return;

  // Immediate penalty when urination starts
  if (!_urinePenaltyStarted) {
    _urinePenaltyStarted = true;
    addFactionRel(ownerFaction, Faction.PLAYER, -1);
    addFactionRel(Faction.PLAYER, ownerFaction, -1);
    addKarma(player, -1);
    state.msgs.push(msg('Местные недовольны...', state.time, '#f84'));

    // Apply specific penalty (-5) to nearby NPCs manually since urination_public is not a registered event.
    for (const e of entities) {
      if (!e.alive || e.type !== EntityType.NPC) continue;
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      if (dx * dx + dy * dy < 25 * 25) { // Radius 25
        if (e.playerRelation !== undefined) {
          e.playerRelation -= 5;
        }
      }
    }
  }

  // Ongoing penalty: -1 per game minute (= per real second)
  _urinePenaltyAccum += dt;
  if (_urinePenaltyAccum >= 1.0) {
    _urinePenaltyAccum -= 1.0;
    addFactionRel(ownerFaction, Faction.PLAYER, -1);
    addFactionRel(Faction.PLAYER, ownerFaction, -1);
  }
}`;
main = main.replace(/function applyUrinationPenalty\(dt: number\): void \{[\s\S]*?addFactionRel\(Faction.PLAYER, ownerFaction, -1\);\n  \}\n\}/, mainStr);
fs.writeFileSync('src/main.ts', main);
