import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { drawFastElevatorOverlay } from '../../src/render/fast_elevator_ui';
import type { FastElevatorOverlaySnapshot } from '../../src/systems/fast_elevator';
import type { Entity } from '../../src/core/types';
import { makeTestPlayer } from '../helpers';

// Mock Canvas for createElement
class FakeCanvas {
  width = 0;
  height = 0;
  getContext(type: string) {
    if (type === '2d') {
      return new CanvasStubContext(this.width, this.height);
    }
    return null;
  }
}

// Global mocks required for UI tests
const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
const originalImageData = Object.getOwnPropertyDescriptor(globalThis, 'ImageData');

Object.defineProperty(globalThis, 'document', {
  configurable: true,
  value: {
    createElement(tag: string) {
      if (tag === 'canvas') return new FakeCanvas();
      return {};
    }
  }
});

Object.defineProperty(globalThis, 'ImageData', {
  configurable: true,
  value: class ImageData {
    data: Uint8ClampedArray;
    width: number;
    height: number;
    constructor(width: number, height: number) {
      this.width = width;
      this.height = height;
      this.data = new Uint8ClampedArray(width * height * 4);
    }
  }
});


class CanvasStubContext {
  readonly canvas: { width: number; height: number };
  readonly pathFills: string[] = [];
  readonly texts: string[] = [];
  fillStyle: string | CanvasGradient | CanvasPattern = '#000';
  strokeStyle: string | CanvasGradient | CanvasPattern = '#000';
  lineWidth = 1;
  globalAlpha = 1;
  font = '';
  imageSmoothingEnabled = false;
  textBaseline: CanvasTextBaseline = 'alphabetic';
  textAlign: CanvasTextAlign = 'left';
  shadowColor = 'transparent';
  shadowBlur = 0;

  constructor(width = 800, height = 600) {
    this.canvas = { width, height };
  }

  measureText(text: string): TextMetrics { return { width: text.length * 7 } as TextMetrics; }
  fillText(text: string, _x: number, _y: number): void { this.texts.push(text); }
  fillRect(_x: number, _y: number, _w: number, _h: number): void {}
  strokeRect(_x: number, _y: number, _w: number, _h: number): void {}
  beginPath(): void {}
  moveTo(_x: number, _y: number): void {}
  lineTo(_x: number, _y: number): void {}
  closePath(): void {}
  stroke(): void {}
  fill(): void { this.pathFills.push(String(this.fillStyle)); }
  save(): void {}
  restore(): void {}
  drawImage(..._args: unknown[]): void {}
  createImageData(w: number, h: number): ImageData { return new globalThis.ImageData(w, h); }
  putImageData(_data: ImageData, _dx: number, _dy: number): void {}
}

test('drawFastElevatorOverlay renders without errors with standard snapshot', () => {
  const ctx = new CanvasStubContext(800, 600);
  const player = makeTestPlayer({ id: 1, x: 10, y: 10 });
  const snapshot: FastElevatorOverlaySnapshot = {
    open: true,
    selectedIndex: 0,
    availableFloors: [1, 2, 3],
    floorLabels: ['Этаж 1', 'Этаж 2', 'Этаж 3'],
    message: ''
  };

  assert.doesNotThrow(() => {
    drawFastElevatorOverlay(
      ctx as unknown as CanvasRenderingContext2D,
      1,
      1,
      0,
      snapshot,
      player as Entity
    );
  });

  assert.ok(ctx.texts.length > 0, 'Should render some text');
  assert.ok(ctx.texts.some(t => t.includes('СКОРОСТНОЙ ЛИФТ')), 'Should render the title');
  assert.ok(ctx.texts.some(t => t.includes('Этаж 1')), 'Should render floor label');
});

test('drawFastElevatorOverlay renders without errors with error message', () => {
  const ctx = new CanvasStubContext(800, 600);
  const player = makeTestPlayer({ id: 1, x: 10, y: 10 });
  const snapshot: FastElevatorOverlaySnapshot = {
    open: true,
    selectedIndex: 0,
    availableFloors: [1],
    floorLabels: ['Этаж 1'],
    message: 'ДОСТУП НЕДОСТУПНО'
  };

  assert.doesNotThrow(() => {
    drawFastElevatorOverlay(
      ctx as unknown as CanvasRenderingContext2D,
      1,
      1,
      0,
      snapshot,
      player as Entity
    );
  });

  assert.ok(ctx.texts.some(t => t.includes('ДОСТУП НЕДОСТУПНО')), 'Should render the error message');
});

test('drawFastElevatorOverlay renders without errors with empty floors', () => {
  const ctx = new CanvasStubContext(800, 600);
  const player = makeTestPlayer({ id: 1, x: 10, y: 10 });
  const snapshot: FastElevatorOverlaySnapshot = {
    open: true,
    selectedIndex: 0,
    availableFloors: [],
    floorLabels: [],
    message: ''
  };

  assert.doesNotThrow(() => {
    drawFastElevatorOverlay(
      ctx as unknown as CanvasRenderingContext2D,
      1,
      1,
      0,
      snapshot,
      player as Entity
    );
  });

  assert.ok(ctx.texts.some(t => t.includes('СКОРОСТНОЙ ЛИФТ')), 'Should still render the UI frame');
});

// Cleanup
import { after } from 'node:test';

after(() => {
  if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument);
  else Reflect.deleteProperty(globalThis, 'document');

  if (originalImageData) Object.defineProperty(globalThis, 'ImageData', originalImageData);
  else Reflect.deleteProperty(globalThis, 'ImageData');
});
