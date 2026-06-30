import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { drawTitleScreen, hitTitleField } from '../../src/render/title_ui';

const createMockCtx = (w = 1280, h = 720) => {
  return {
    canvas: { width: w, height: h },
    fillStyle: '',
    strokeStyle: '',
    font: '',
    textAlign: '',
    textBaseline: '',
    globalAlpha: 1,
    lineWidth: 1,
    lineCap: 'butt',

    fillRect: () => {},
    strokeRect: () => {},
    fillText: () => {},
    save: () => {},
    restore: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {},
    fill: () => {},
    closePath: () => {},
    measureText: (text: string) => ({ width: text.length * 10 }),
  } as unknown as CanvasRenderingContext2D;
};

test('drawTitleScreen language mode', () => {
  const ctx = createMockCtx();
  const hits = drawTitleScreen(ctx, {
    mode: 'language',
    languageId: 'ru',
    setupRows: [],
    mobile: false,
  });
  assert.ok(Array.isArray(hits));
  assert.ok(hits.length > 0); // language chips + start button
});

test('drawTitleScreen language mode (mobile)', () => {
  const ctx = createMockCtx();
  const hits = drawTitleScreen(ctx, {
    mode: 'language',
    languageId: 'en',
    setupRows: [],
    mobile: true,
  });
  assert.ok(Array.isArray(hits));
  assert.ok(hits.length > 0);
});

test('drawTitleScreen setup mode', () => {
  const ctx = createMockCtx();
  const hits = drawTitleScreen(ctx, {
    mode: 'setup',
    languageId: 'ru',
    setupRows: [
      { field: 'name', label: 'Name', value: 'Test', selected: true, hint: 'hint' },
      { field: 'start', label: 'Start', value: 'GO', selected: false },
    ],
  });
  assert.ok(Array.isArray(hits));
  assert.ok(hits.length > 0);
  assert.ok(hits.some(h => h.field === 'name'));
  assert.ok(hits.some(h => h.field === 'start'));
});

test('drawTitleScreen layout edge cases (small resolution)', () => {
  const ctx = createMockCtx(320, 240);
  const hits = drawTitleScreen(ctx, {
    mode: 'setup',
    languageId: 'en',
    setupRows: [
      { field: 'start', label: 'Start', value: 'GO', selected: true },
      { field: 'addNpc', label: 'Add NPC', value: 'Yes', selected: false },
    ],
  });
  assert.ok(hits.length > 0);
});

test('drawTitleScreen setup layout with many rows', () => {
  const ctx = createMockCtx(1920, 1080);
  const rows = Array(10).fill(null).map((_, i) => ({
    field: 'name' as const,
    label: `Row ${i}`,
    value: 'test',
    selected: i === 0,
  }));
  const hits = drawTitleScreen(ctx, {
    mode: 'setup',
    languageId: 'en',
    setupRows: rows,
  });
  assert.equal(hits.length, 10);
});

test('hitTitleField', () => {
  const hits = [
    { field: 'start', x: 10, y: 10, w: 100, h: 20 },
    { field: 'name', x: 10, y: 40, w: 100, h: 20 },
  ] as any;
  assert.equal(hitTitleField(hits, 50, 20), 'start');
  assert.equal(hitTitleField(hits, 50, 50), 'name');
  assert.equal(hitTitleField(hits, 0, 0), null);
});