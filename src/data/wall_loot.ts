import { Tex } from '../core/types';

export interface WallDropEntry {
  itemId?: string;
  markerId?: 'HIDDEN_STASH' | 'WATER_EFFECT';
  chance: number; // 0.0 to 1.0
  amountMin: number;
  amountMax: number;
}

export type WallLootConfig = Partial<Record<Tex, WallDropEntry[]>>;

export const WALL_LOOT: WallLootConfig = {
  [Tex.CONCRETE]: [
    { itemId: 'concrete_rubble', chance: 0.70, amountMin: 1, amountMax: 2 },
    { itemId: 'rebar_piece', chance: 0.20, amountMin: 1, amountMax: 1 },
    { itemId: 'wire_coil', chance: 0.05, amountMin: 1, amountMax: 1 },
    { markerId: 'HIDDEN_STASH', chance: 0.02, amountMin: 1, amountMax: 1 },
  ],
  [Tex.PANEL]: [
    { itemId: 'concrete_rubble', chance: 0.70, amountMin: 1, amountMax: 2 },
    { itemId: 'rebar_piece', chance: 0.20, amountMin: 1, amountMax: 1 },
    { itemId: 'wire_coil', chance: 0.05, amountMin: 1, amountMax: 1 },
    { markerId: 'HIDDEN_STASH', chance: 0.02, amountMin: 1, amountMax: 1 },
  ],
  [Tex.BRICK]: [
    { itemId: 'brick_pieces', chance: 0.60, amountMin: 1, amountMax: 2 },
    { itemId: 'wire_coil', chance: 0.15, amountMin: 1, amountMax: 1 },
    { itemId: 'pipe_fragment', chance: 0.10, amountMin: 1, amountMax: 1 },
    { markerId: 'HIDDEN_STASH', chance: 0.05, amountMin: 1, amountMax: 1 },
  ],
  [Tex.METAL]: [
    { itemId: 'metal_scrap', chance: 0.50, amountMin: 2, amountMax: 2 },
    { itemId: 'electronics', chance: 0.15, amountMin: 1, amountMax: 1 },
    { itemId: 'pipe_fragment', chance: 0.20, amountMin: 1, amountMax: 1 },
  ],
  [Tex.PIPE]: [
    { itemId: 'pipe_fragment', chance: 0.60, amountMin: 2, amountMax: 2 },
    { markerId: 'WATER_EFFECT', chance: 0.30, amountMin: 1, amountMax: 1 },
  ],
  [Tex.MEAT]: [
    { itemId: 'raw_meat', chance: 0.40, amountMin: 1, amountMax: 1 },
  ],
  [Tex.GUT]: [
    { itemId: 'raw_meat', chance: 0.40, amountMin: 1, amountMax: 1 },
  ],
};
