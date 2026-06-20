const fs = require('fs');

// Revert pathfinding.ts
const path1 = '/Users/jirnyak/Mirror/gigahrush/src/systems/ai/pathfinding.ts';
let code1 = fs.readFileSync(path1, 'utf8');

code1 = code1.replace(
  /export function entityDangerBias[\s\S]*?export function wanderNearby/,
  'export function wanderNearby'
);

code1 = code1.replace(
  /export function wanderNearby\(world: World, e: Entity\): void \{[\s\S]*?ai\.pi = 0;\n\}/,
  `export function wanderNearby(world: World, e: Entity): void {
  const ai = e.ai!;
  for (let attempt = 0; attempt < ROUTINE_WANDER_ATTEMPTS; attempt++) {
    const wx = Math.floor(e.x) + Math.floor(Math.random() * 20 - 10);
    const wy = Math.floor(e.y) + Math.floor(Math.random() * 20 - 10);
    const tx = world.wrap(wx);
    const ty = world.wrap(wy);
    if (world.solid(tx, ty)) continue;

    const status = tryAssignPathToCell(world, e, tx, ty);
    if (status !== 'not_found') return;
  }

  ai.path = [];
  ai.pi = 0;
}`
);

code1 = code1.replace(
  /export function wanderInRoom\(world: World, e: Entity\): void \{[\s\S]*?\}\n\n\/\* ── Helper: wander far/,
  `export function wanderInRoom(world: World, e: Entity): void {
  const room = world.roomAt(e.x, e.y);
  if (!room || room.w < 3 || room.h < 3) return;
  for (let attempt = 0; attempt < ROUTINE_WANDER_ATTEMPTS; attempt++) {
    const rx = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
    const ry = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
    if (!world.solid(rx, ry)) {
      const status = tryAssignPathToCell(world, e, rx, ry);
      if (status !== 'not_found') return;
    }
  }
}\n\n/* ── Helper: wander far`
);

fs.writeFileSync(path1, code1);

// Revert npc_fsm.ts
const path2 = '/Users/jirnyak/Mirror/gigahrush/src/systems/ai/npc_fsm.ts';
let code2 = fs.readFileSync(path2, 'utf8');

code2 = code2.replace(
  /factionPenalty: friendly \? 0 : 18,\n    danger: world.dangerField \? world.dangerField\[Math.floor\(room.y \+ room.h\/2\) \* 1024 \+ Math.floor\(room.x \+ room.w\/2\)\] \/ 255 : 0,/g,
  'factionPenalty: friendly ? 0 : 18,'
);

fs.writeFileSync(path2, code2);
