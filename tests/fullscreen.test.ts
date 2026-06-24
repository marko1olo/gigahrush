import test from 'node:test';
import assert from 'node:assert/strict';

import { canUseMobileFullscreen, canUseNativeFullscreen, isEmbeddedViewport } from '../src/fullscreen.js';

interface FullscreenEnvOptions {
  userAgent: string;
  platform?: string;
  maxTouchPoints?: number;
  embedded?: boolean;
  crossOriginError?: boolean;
  requestFullscreen?: boolean;
}

function installFullscreenEnv(options: FullscreenEnvOptions): () => void {
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const previousNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const documentElement = options.requestFullscreen === false
    ? {}
    : { requestFullscreen: async () => {} };
  const top = {};
  const self = options.embedded ? {} : top;

  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { documentElement, fullscreenElement: null },
  });
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {
      userAgent: options.userAgent,
      platform: options.platform ?? '',
      maxTouchPoints: options.maxTouchPoints ?? 0,
    },
  });
  const mockWindow = { self, top };
  if (!options.embedded) {
    mockWindow.self = mockWindow;
    mockWindow.top = mockWindow;
  }
  if (options.crossOriginError) {
    Object.defineProperty(mockWindow, 'top', {
      get() {
        throw new Error('SecurityError: Blocked a frame with origin from accessing a cross-origin frame.');
      }
    });
  }
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: mockWindow,
  });

  return () => {
    if (previousDocument) Object.defineProperty(globalThis, 'document', previousDocument);
    else Reflect.deleteProperty(globalThis, 'document');
    if (previousNavigator) Object.defineProperty(globalThis, 'navigator', previousNavigator);
    else Reflect.deleteProperty(globalThis, 'navigator');
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow);
    else Reflect.deleteProperty(globalThis, 'window');
  };
}

test('mobile fullscreen is hidden for direct iPhone WebKit pages', () => {
  const restore = installFullscreenEnv({
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1',
    platform: 'iPhone',
  });
  try {
    assert.equal(canUseNativeFullscreen(), false);
    assert.equal(canUseMobileFullscreen(), false);
  } finally {
    restore();
  }
});

test('mobile fullscreen remains available for compatible direct pages and hidden in embeds', () => {
  let restore = installFullscreenEnv({
    userAgent: 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/125 Mobile Safari/537.36',
    platform: 'Linux armv8l',
  });
  try {
    assert.equal(canUseNativeFullscreen(), true);
    assert.equal(canUseMobileFullscreen(), true);
  } finally {
    restore();
  }

  restore = installFullscreenEnv({
    userAgent: 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/125 Mobile Safari/537.36',
    platform: 'Linux armv8l',
    embedded: true,
  });
  try {
    assert.equal(canUseNativeFullscreen(), true);
    assert.equal(canUseMobileFullscreen(), false);
  } finally {
    restore();
  }
});

test('isEmbeddedViewport returns true when accessing top throws a SecurityError', () => {
  const restore = installFullscreenEnv({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    crossOriginError: true,
  });
  try {
    assert.equal(isEmbeddedViewport(), true);
  } finally {
    restore();
  }
});

test('isEmbeddedViewport returns true when embedded', () => {
  const restore = installFullscreenEnv({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    embedded: true,
  });
  try {
    assert.equal(isEmbeddedViewport(), true);
  } finally {
    restore();
  }
});

test('isEmbeddedViewport returns false when not embedded', () => {
  const restore = installFullscreenEnv({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    embedded: false,
  });
  try {
    assert.equal(isEmbeddedViewport(), false);
  } finally {
    restore();
  }
});
