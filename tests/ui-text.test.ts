import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { fitText, setUiTextTime, wrapTextLines } from '../src/render/ui_text';

const ctx = {
  font: '10px monospace',
  measureText(text: string) {
    return { width: text.length * 10 } as TextMetrics;
  },
} as CanvasRenderingContext2D;

test('overwide fitted text scrolls instead of gaining ellipsis', () => {
  const text = 'ABCDEFGHIJ';
  setUiTextTime(0);
  const first = fitText(ctx, text, 30);
  setUiTextTime(1.1);
  const moved = fitText(ctx, text, 30);

  assert.equal(first, 'ABC');
  assert.notEqual(moved, first);
  assert.equal(moved.includes('...'), false);
});

test('wrapped text does not append ellipsis when line budget is exhausted', () => {
  setUiTextTime(0);
  const lines = wrapTextLines(ctx, 'alpha beta gamma delta', 50, 1);

  assert.deepEqual(lines, ['alpha']);
});
