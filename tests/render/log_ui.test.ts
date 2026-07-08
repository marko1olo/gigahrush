import test from 'node:test';
import assert from 'node:assert';
import { drawLogMenu } from '../../src/render/log_ui';
import { GameState } from '../../src/core/types';

class CanvasStubContext {
  canvas = { width: 1920, height: 1080 };
  fillStyle = '';
  strokeStyle = '';
  font = '';
  textBaseline = '';
  calls: string[] = [];

  save() { this.calls.push('save'); }
  restore() { this.calls.push('restore'); }
  fillRect(x: number, y: number, w: number, h: number) { this.calls.push(`fillRect ${x} ${y} ${w} ${h}`); }
  strokeRect(x: number, y: number, w: number, h: number) { this.calls.push(`strokeRect ${x} ${y} ${w} ${h}`); }
  fillText(text: string, x: number, y: number) { this.calls.push(`fillText '${text}' ${x} ${y}`); }
  beginPath() { this.calls.push('beginPath'); }
  moveTo(x: number, y: number) { this.calls.push(`moveTo ${x} ${y}`); }
  lineTo(x: number, y: number) { this.calls.push(`lineTo ${x} ${y}`); }
  stroke() { this.calls.push('stroke'); }
  measureText(text: string) { return { width: text.length * 10 }; }
}

test('drawLogMenu with empty log', (t) => {
  const ctx = new CanvasStubContext() as unknown as CanvasRenderingContext2D;
  const state = {
    time: 100,
    msgLog: [],
    logScroll: 0,
  } as unknown as GameState;

  // Provide mock for document to avoid errors in imported fitTextStable
  global.document = {
    createElement: () => ({ getContext: () => ({ measureText: () => ({ width: 10 }) }) })
  } as any;

  drawLogMenu(ctx, state, 1, 1);
  const stub = ctx as unknown as CanvasStubContext;

  assert.ok(stub.calls.includes('save'));
  assert.ok(stub.calls.some(c => c.startsWith('fillText \'СТЕНОГРАФИЧЕСКАЯ СВОДКА')));
  assert.ok(stub.calls.includes("fillText 'Пусто.' 12 34"));
  assert.ok(stub.calls.includes('restore'));
});

test('drawLogMenu with items', (t) => {
  const ctx = new CanvasStubContext() as unknown as CanvasRenderingContext2D;
  const state = {
    time: 100,
    msgLog: [
      { text: 'Entry 1', color: '#fff', day: 1, hour: 12, minute: 30 },
      { text: 'Entry 2', color: '#fff', day: 1, hour: 13, minute: 0 }
    ],
    logScroll: 0,
  } as unknown as GameState;

  drawLogMenu(ctx, state, 1, 1);
  const stub = ctx as unknown as CanvasStubContext;

  // Checking that it draws actual log entries
  assert.ok(stub.calls.some(c => c.includes('Entry 1')));
  assert.ok(stub.calls.some(c => c.includes('Entry 2')));
});
