import type { ProceduralAnomalyGenContext } from './common';
import { applyBadAppleWorld } from './bad_apple_world';
import { applyCementMemory } from './cement_memory';
import { applyConveyorSorter } from './conveyor_sorter';
import { applyConwayLife } from './conway_life';
import { applyFractalFloor } from './fractal_floor';
import { applyLivingTunnels } from './living_tunnels';
import { applyMirrorRun } from './mirror_run';
import { applyRadioChess } from './radio_chess';
import { applySectionShift } from './section_shift';
import { applyWallSnake } from './wall_snake';
import { applyZombieApocalypse } from './zombie_apocalypse';

export function applyProceduralAnomalyProfile(ctx: ProceduralAnomalyGenContext): void {
  switch (ctx.spec.anomalyId) {
    case 'fractal_floor':
      applyFractalFloor(ctx);
      break;
    case 'mirror_run':
      applyMirrorRun(ctx);
      break;
    case 'radio_chess':
      applyRadioChess(ctx);
      break;
    case 'cement_memory':
      applyCementMemory(ctx);
      break;
    case 'conveyor_sorter':
      applyConveyorSorter(ctx);
      break;
    case 'wall_snake':
      applyWallSnake(ctx);
      break;
    case 'living_tunnels':
      applyLivingTunnels(ctx);
      break;
    case 'section_shift':
      applySectionShift(ctx);
      break;
    case 'conway_life':
      applyConwayLife(ctx);
      break;
    case 'bad_apple_world':
      applyBadAppleWorld(ctx);
      break;
    case 'zombie_apocalypse':
      applyZombieApocalypse(ctx);
      break;
  }
}
