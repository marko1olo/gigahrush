import {
  type Entity,
  type GameState,
  type WorldContainer,
} from '../core/types';
import { bankingForSave } from './banking';
import { alifeForSave } from './alife';
import { economyForSave } from './economy';
import { trimEventHistoryForSave } from './events';
import { floorInstanceStateForSave } from './floor_instances';
import { liftArachnaStateForSave } from './lift_arachna';
import { mapEditorPatchStateForSave } from './map_editor';
import { netTerminalGenStateForSave } from './net_terminal_gen';
import { productionForSave } from './production';
import { floorRunStateForSave } from './procedural_floors';
import { buildSavePayload, type SavePayload } from './save_payload';
import { stockMarketForSave } from './stock_market';

export const SAVE_SHAPE_VERSION = 6;
export type SaveShapeVersionStatus = 'missing' | 'old' | 'current' | 'newer' | 'invalid';

export interface SaveRuntimeExtras {
  voidReturnPortal?: unknown;
  voidEntryFromFloor?: unknown;
}

export type GameSavePayload = SavePayload & { version: number };

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function saveShapeVersionStatus(input: unknown): SaveShapeVersionStatus {
  if (!isRecord(input)) return 'invalid';
  const version = input.version;
  if (version === undefined) return 'missing';
  if (typeof version !== 'number' || !Number.isFinite(version)) return 'invalid';
  const normalized = Math.floor(version);
  if (normalized !== version || normalized < 0) return 'invalid';
  if (normalized < SAVE_SHAPE_VERSION) return 'old';
  if (normalized > SAVE_SHAPE_VERSION) return 'newer';
  return 'current';
}

export function saveShapeVersionSupported(input: unknown): boolean {
  return saveShapeVersionStatus(input) === 'current';
}

export function createGameSavePayload(
  player: Entity,
  state: GameState,
  containers: readonly WorldContainer[],
  extras: SaveRuntimeExtras = {},
): GameSavePayload {
  const payload = buildSavePayload({
    player,
    state,
    containers,
    sections: {
      floorRun: floorRunStateForSave(state),
      floorInstances: floorInstanceStateForSave(state),
      voidReturnPortal: extras.voidReturnPortal,
      voidEntryFromFloor: extras.voidEntryFromFloor,
      liftArachna: liftArachnaStateForSave(state),
      alife: alifeForSave(state),
      netTerminalGen: netTerminalGenStateForSave(state),
      mapEditorPatches: mapEditorPatchStateForSave(state),
      worldEvents: trimEventHistoryForSave(state),
      economy: economyForSave(state),
      banking: bankingForSave(state),
      stockMarket: stockMarketForSave(state),
      production: productionForSave(state),
    },
  });
  return {
    version: SAVE_SHAPE_VERSION,
    ...payload,
  };
}
