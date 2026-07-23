import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { drawComputerOverlay } from '../../src/render/computer_ui';
import type { ComputerOverlaySnapshot } from '../../src/systems/computers';

// Mock ImageData
class MockImageData {
  data: Uint8ClampedArray;
  constructor(public width: number, public height: number) {
    this.data = new Uint8ClampedArray(width * height * 4);
  }
}
(global as any).ImageData = MockImageData;

// Mock document for drawStaticNoise which uses document.createElement('canvas')
const mockCanvas = {
  width: 1,
  height: 1,
  getContext: () => ({
    createImageData: (w: number, h: number) => new MockImageData(w, h),
    putImageData: () => {},
  }),
};
(global as any).document = {
  createElement: (tag: string) => {
    if (tag === 'canvas') return mockCanvas;
    return {};
  }
};

class CanvasStubContext {
  canvas = { width: 800, height: 600 };
  fillStyle: string = '';
  strokeStyle: string = '';
  textAlign: string = '';
  textBaseline: string = '';
  font: string = '';
  globalAlpha: number = 1;
  lineWidth: number = 1;

  calls: any[] = [];

  measureText(text: string): { width: number } {
    return { width: text.length * 5 };
  }

  fillRect(x: number, y: number, w: number, h: number): void {
    this.calls.push({ type: 'fillRect', x, y, w, h, fillStyle: this.fillStyle });
  }

  strokeRect(x: number, y: number, w: number, h: number): void {
    this.calls.push({ type: 'strokeRect', x, y, w, h, strokeStyle: this.strokeStyle });
  }

  fillText(text: string, x: number, y: number): void {
    this.calls.push({ type: 'fillText', text, x, y, fillStyle: this.fillStyle, font: this.font, textAlign: this.textAlign, textBaseline: this.textBaseline });
  }

  save(): void {
    this.calls.push({ type: 'save' });
  }

  restore(): void {
    this.calls.push({ type: 'restore' });
  }

  beginPath(): void { this.calls.push({ type: 'beginPath' }); }
  closePath(): void { this.calls.push({ type: 'closePath' }); }
  moveTo(x: number, y: number): void { this.calls.push({ type: 'moveTo', x, y }); }
  lineTo(x: number, y: number): void { this.calls.push({ type: 'lineTo', x, y }); }
  stroke(): void { this.calls.push({ type: 'stroke' }); }
  fill(): void { this.calls.push({ type: 'fill' }); }

  drawImage(): void { this.calls.push({ type: 'drawImage' }); }

  getImageData(x: number, y: number, w: number, h: number): MockImageData {
    return new MockImageData(w, h);
  }
  putImageData(): void {}
  createImageData(w: number, h: number): MockImageData {
    return new MockImageData(w, h);
  }
}

test('drawComputerOverlay', async (t) => {
  await t.test('Draws without crashing', () => {
    const ctx = new CanvasStubContext() as unknown as CanvasRenderingContext2D;
    const computer: ComputerOverlaySnapshot = {
      open: true,
      terminalIdx: 0,
      label: 'GIGATerminal',
      pageIndex: 0,
      pageCount: 1,
      title: 'Welcome',
      lines: ['Booting...', 'System ready.'],
      copied: false,
      copyLabel: 'Download',
      rewardRubles: 500,
      message: 'Connection secure',
    };

    assert.doesNotThrow(() => {
      drawComputerOverlay(ctx, 1, 1, 0, computer);
    });
  });

  await t.test('Renders multiline text correctly', () => {
    const ctx = new CanvasStubContext() as unknown as CanvasRenderingContext2D;
    const computer: ComputerOverlaySnapshot = {
      open: true,
      terminalIdx: 0,
      label: 'GIGATerminal',
      pageIndex: 0,
      pageCount: 1,
      title: 'Welcome',
      lines: ['Booting...', 'System ready.', 'Line 3', 'Line 4', 'Line 5'],
      copied: false,
      copyLabel: 'Download',
      rewardRubles: 500,
      message: 'Connection secure',
    };

    drawComputerOverlay(ctx, 1, 1, 0, computer);
    const stub = ctx as unknown as CanvasStubContext;

    // Check that some lines are rendered
    const textCalls = stub.calls.filter(c => c.type === 'fillText');
    assert.ok(textCalls.some(c => c.text === 'Booting...'), 'Should render first line');
    assert.ok(textCalls.some(c => c.text === 'System ready.'), 'Should render second line');
  });

  await t.test('Renders copied state correctly', () => {
    const ctx = new CanvasStubContext() as unknown as CanvasRenderingContext2D;
    const computer: ComputerOverlaySnapshot = {
      open: true,
      terminalIdx: 0,
      label: 'GIGATerminal',
      pageIndex: 0,
      pageCount: 1,
      title: 'Welcome',
      lines: [],
      copied: true,
      copyLabel: 'Download',
      rewardRubles: 500,
      message: '',
    };

    drawComputerOverlay(ctx, 1, 1, 0, computer);
    const stub = ctx as unknown as CanvasStubContext;

    const textCalls = stub.calls.filter(c => c.type === 'fillText');
    assert.ok(textCalls.some(c => c.text === 'Данные уже скопированы.'), 'Should show already copied message');
  });
});
