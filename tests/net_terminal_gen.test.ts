import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { currentNetTerminalGenFloorKey } from '../src/systems/net_terminal_gen';
import { GameState, FloorLevel } from '../src/core/types';

describe('net_terminal_gen', () => {
  describe('currentNetTerminalGenFloorKey', () => {
    it('should return floor instance world key when active', () => {
      const state = {
        floorInstances: {
          current: {
            id: 'loop_404',
            fromFloor: FloorLevel.LIVING,
            intendedFloor: FloorLevel.LIVING,
            returnFloor: FloorLevel.LIVING,
            seed: 123
          }
        }
      } as unknown as GameState;

      const result = currentNetTerminalGenFloorKey(state);
      assert.equal(result, 'floor_instance:loop_404');
    });

    it('should return route key for entry when no floor instance is active', () => {
      const state = {
        floorInstances: {
          current: null
        },
        floorRun: {
          currentZ: 0
        },
        currentFloor: FloorLevel.LIVING
      } as unknown as GameState;

      const result = currentNetTerminalGenFloorKey(state);
      assert.equal(typeof result, 'string');
      assert.ok(result.length > 0);
      assert.equal(result, 'story:living');
    });
  });
});
