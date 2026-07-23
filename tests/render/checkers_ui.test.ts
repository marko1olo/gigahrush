import { test } from 'node:test';
import * as assert from 'node:assert';
import { drawCheckersInterface } from '../../src/render/checkers_ui';
import { CheckersSnapshot } from '../../src/systems/checkers';
import { Entity } from '../../src/core/world';

// Mock CanvasRenderingContext2D
class MockCanvasRenderingContext2D {
  canvas = { width: 800, height: 600 };
  save() {}
  restore() {}
  beginPath() {}
  arc() {}
  fill() {}
  fillRect() {}
  stroke() {}
  strokeRect() {}
  fillText() {}
  measureText() { return { width: 10 }; }

  // Properties
  fillStyle = '';
  strokeStyle = '';
  lineWidth = 1;
  textAlign = '';
  textBaseline = '';
  font = '';
}

test('drawCheckersInterface smoke test', () => {
  const ctx = new MockCanvasRenderingContext2D() as unknown as CanvasRenderingContext2D;
  const snapshot: CheckersSnapshot = {
    open: true,
    npcId: 1,
    npcName: 'Test NPC',
    stakeRubles: 100,
    pieces: [],
    phase: 'player_turn',
    winner: 'none',
    message: '',
    log: [],
    cursorX: 0,
    cursorY: 0
  };

  // Ensure it doesn't throw
  assert.doesNotThrow(() => {
    drawCheckersInterface(ctx, snapshot, 0, 0, 800, 600, 1, 1, 0);
  });
});
