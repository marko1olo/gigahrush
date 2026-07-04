import { Tex, EntityType, type GameState, type Entity, msg, Cell, W } from '../core/types';
import { Spr } from '../render/sprite_index';
import type { World } from '../core/world';
import { WALL_LOOT } from '../data/wall_loot';
import { xorshift32 } from '../core/rand';
import { generateContainerLoot } from './procedural_loot';

export function rollWallDrops(
  world: World,
  entities: Entity[],
  nextEntityId: { v: number },
  state: GameState,
  texture: Tex,
  cellIdx: number
): void {
  let entries = WALL_LOOT[texture];

  if (false /* exposed_pipes tag check not implemented directly on world.tags yet, needs room.tags check if added later */) {
    entries = [
      { itemId: 'wire_coil', chance: 0.40, amountMin: 2, amountMax: 2 },
      { itemId: 'electronics', chance: 0.20, amountMin: 1, amountMax: 1 },
      { itemId: 'pipe_fragment', chance: 0.30, amountMin: 1, amountMax: 1 },
    ];
  }

  if (!entries) return;

  const rng = xorshift32(state.tick ^ cellIdx);
  const cx = (cellIdx % W) + 0.5;
  const cy = Math.floor(cellIdx / W) + 0.5;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (rng() < entry.chance) {
      if (entry.markerId === 'HIDDEN_STASH') {
        const amount = Math.floor(rng() * 3) + 1;
        const rollItems = [];
        for (let j = 0; j < amount; j++) {
            rollItems.push(rng());
        }
        const loot = generateContainerLoot(['valuable'], undefined, state.currentFloor, rollItems);

        if (loot.length > 0) {
          state.msgs.push(msg('Вы нашли замурованный тайник!', state.time, '#ff0'));

          const dropId = nextEntityId.v++;
          entities.push({
            id: dropId,
            type: EntityType.ITEM_DROP,
            x: cx,
            y: cy,
            angle: rng() * Math.PI * 2,
            pitch: 0,
            alive: true,
            speed: 0,
            sprite: Spr.ITEM_DROP,
            inventory: loot,
          });
        }
      } else if (entry.markerId === 'WATER_EFFECT') {
        world.cells[cellIdx] = Cell.WATER;
      } else {
        const amount = entry.amountMin + Math.floor(rng() * (entry.amountMax - entry.amountMin + 1));
        const dropId = nextEntityId.v++;
        entities.push({
          id: dropId,
          type: EntityType.ITEM_DROP,
          x: cx,
          y: cy,
          angle: rng() * Math.PI * 2,
          pitch: 0,
          alive: true,
          speed: 0,
          sprite: Spr.ITEM_DROP,
          inventory: [{ defId: entry.itemId!, count: amount }],
        });
      }
    }
  }
}
