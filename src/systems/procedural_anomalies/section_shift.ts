import { Cell, EntityType, Feature, msg, type Entity, type GameState } from '../../core/types';
import { World } from '../../core/world';

interface ShiftSection {
  roomId: number;
  x: number;
  y: number;
  w: number;
  h: number;
  phase: number;
  apparatus: number;
  nextShiftAt: number;
  stableUntil: number;
  warned: boolean;
}

interface ShiftRuntime {
  sections: ShiftSection[];
  lastMsgTime: number;
}

const SECTION_SHIFT_RE = /\[section_shift:(-?\d+),(-?\d+),(\d+),(\d+),(\d+)\]/;
const runtimeByWorld = new WeakMap<World, ShiftRuntime | null>();

function initShift(world: World): ShiftRuntime | null {
  const cached = runtimeByWorld.get(world);
  if (cached !== undefined) return cached;
  const sections: ShiftSection[] = [];
  for (const room of world.rooms) {
    const match = SECTION_SHIFT_RE.exec(room.name);
    if (!match) continue;
    const x = Number(match[1]);
    const y = Number(match[2]);
    const w = Number(match[3]);
    const h = Number(match[4]);
    const phase = Number(match[5]);
    let apparatus = -1;
    for (let dy = 0; dy < h && apparatus < 0; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const ci = world.idx(x + dx, y + dy);
        if (world.features[ci] === Feature.APPARATUS) {
          apparatus = ci;
          break;
        }
      }
    }
    if (w >= 5 && h >= 5) {
      sections.push({
        roomId: room.id,
        x,
        y,
        w,
        h,
        phase,
        apparatus,
        nextShiftAt: 4 + phase * 1.7,
        stableUntil: 0,
        warned: false,
      });
    }
  }
  const runtime = sections.length > 0 ? { sections, lastMsgTime: -Infinity } : null;
  runtimeByWorld.set(world, runtime);
  return runtime;
}

function inside(world: World, section: ShiftSection, x: number, y: number): boolean {
  const dx = world.delta(section.x, x);
  const dy = world.delta(section.y, y);
  return dx >= 0 && dy >= 0 && dx < section.w && dy < section.h;
}

function isSafeDestination(world: World, x: number, y: number): boolean {
  const ci = world.idx(x, y);
  return (world.cells[ci] === Cell.FLOOR || world.cells[ci] === Cell.WATER) &&
    world.features[ci] !== Feature.LIFT_BUTTON &&
    world.hermoWall[ci] === 0 &&
    world.aptMask[ci] === 0 &&
    !world.doors.has(ci);
}

function shiftedPoint(world: World, section: ShiftSection, x: number, y: number): { x: number; y: number } {
  const localX = ((world.delta(section.x, x) % section.w) + section.w) % section.w;
  const localY = ((world.delta(section.y, y) % section.h) + section.h) % section.h;
  const sx = (localX + Math.max(2, Math.floor(section.w / 2)) + section.phase) % section.w;
  const sy = (localY + Math.max(2, Math.floor(section.h / 3)) + section.phase * 2) % section.h;
  return { x: world.wrap(section.x + sx), y: world.wrap(section.y + sy) };
}

function nearbySafe(world: World, section: ShiftSection, x: number, y: number): { x: number; y: number } | null {
  if (inside(world, section, x, y) && isSafeDestination(world, x, y)) return { x, y };
  for (let r = 1; r <= 4; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
        const tx = world.wrap(x + dx);
        const ty = world.wrap(y + dy);
        if (inside(world, section, tx, ty) && isSafeDestination(world, tx, ty)) return { x: tx, y: ty };
      }
    }
  }
  return null;
}

function tintLocal(world: World, x: number, y: number, phase: number): void {
  for (let dy = -3; dy <= 3; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      const ci = world.idx(x + dx, y + dy);
      if (world.cells[ci] === Cell.WALL || world.cells[ci] === Cell.LIFT) continue;
      world.fog[ci] = Math.max(world.fog[ci], 36 + phase * 10);
    }
  }
  world.markFogDirty();
}

export function updateSectionShiftAnomaly(world: World, player: Entity, state: GameState, dt: number): void {
  if (player.type !== EntityType.PLAYER) return;
  const runtime = initShift(world);
  if (!runtime) return;
  const px = world.wrap(Math.floor(player.x));
  const py = world.wrap(Math.floor(player.y));
  const ci = world.idx(px, py);
  const roomId = world.roomMap[ci];

  for (const section of runtime.sections) {
    if (section.roomId !== roomId || !inside(world, section, px, py)) continue;
    if (state.time < section.stableUntil) return;

    if (!section.warned) {
      section.warned = true;
      section.nextShiftAt = Math.max(section.nextShiftAt, 4.5);
      state.msgs.push(msg('Секция пола не совпадает с потолком. Через несколько секунд она сдвинется.', state.time, '#fa4'));
      return;
    }

    section.nextShiftAt -= dt;
    if (section.nextShiftAt > 0) {
      if (section.nextShiftAt < 1.1 && state.time - runtime.lastMsgTime > 2) {
        runtime.lastMsgTime = state.time;
        state.msgs.push(msg('Шов секции пошел в сторону. Можно отскочить или выключить аппарат.', state.time, '#fa4'));
      }
      return;
    }

    const shifted = shiftedPoint(world, section, px, py);
    const safe = nearbySafe(world, section, shifted.x, shifted.y);
    if (safe) {
      player.x = safe.x + 0.5;
      player.y = safe.y + 0.5;
      tintLocal(world, safe.x, safe.y, section.phase);
      state.msgs.push(msg('Комната щелкнула, и вы оказались у другого шва той же секции.', state.time, '#c8f'));
    } else {
      player.hp = Math.max(1, (player.hp ?? 100) - 4);
      state.msgs.push(msg('Секция дернулась, но не смогла вас замуровать. Ребра запомнили удар.', state.time, '#f84'));
    }
    section.nextShiftAt = 7.5 + section.phase * 1.5;
    return;
  }
}

export function tryUseSectionShiftAnomaly(world: World, _player: Entity, state: GameState, lookX: number, lookY: number): boolean {
  const runtime = initShift(world);
  if (!runtime) return false;
  const lookIdx = world.idx(Math.floor(lookX), Math.floor(lookY));
  for (const section of runtime.sections) {
    if (section.apparatus !== lookIdx) continue;
    section.stableUntil = Math.max(section.stableUntil, state.time + 45);
    section.nextShiftAt = 9;
    state.msgs.push(msg('Аппарат секции щелкнул реле. Сдвиг заморожен почти на минуту.', state.time, '#8cf'));
    return true;
  }
  return false;
}
