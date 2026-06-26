import { GameState } from '../core/types';
import { NpcInteractionContext } from './npc_interaction_options';

export interface ArenaOverlaySnapshot {
  open: boolean;
  selection: number; // 0 for bet, 1 for fight
}

export const arenaRuntime = {
  open: false,
  selection: 0,
};

export function isArenaOverlayOpen(): boolean {
  return arenaRuntime.open;
}

export function openArena(ctx: NpcInteractionContext): void {
  arenaRuntime.open = true;
  arenaRuntime.selection = 0;
  ctx.state.showNpcMenu = false;
  ctx.state.paused = true;
}

export function closeArena(): void {
  arenaRuntime.open = false;
}

export function moveArenaSelection(delta: number): void {
  arenaRuntime.selection += delta;
  if (arenaRuntime.selection < 0) arenaRuntime.selection = 0;
  if (arenaRuntime.selection > 1) arenaRuntime.selection = 1;
}

export function activateArenaSelection(_ctx: { state: GameState }): void {
  // Placeholder for now
  closeArena();
}

export function getArenaOverlaySnapshot(): ArenaOverlaySnapshot {
  return {
    open: arenaRuntime.open,
    selection: arenaRuntime.selection,
  };
}
