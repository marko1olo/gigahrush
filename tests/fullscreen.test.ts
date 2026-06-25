import test from 'node:test';
import assert from 'node:assert/strict';

import { canUseMobileFullscreen, canUseNativeFullscreen, enterNativeFullscreen } from '../src/fullscreen';

interface FullscreenEnvOptions {
  userAgent: string;
  platform?: string;
  maxTouchPoints?: number;
  embedded?: boolean;
  requestFullscreen?: boolean;
  rejectFullscreen?: boolean;
}

function installFullscreenEnv(options: FullscreenEnvOptions): () => void {
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const previousNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const documentElement = options.requestFullscreen === false
    ? {}
    : { requestFullscreen: async () => {
        if (options.rejectFullscreen) throw new Error('Fullscreen request denied');
      } };
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
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { self, top },
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

test('native fullscreen handles rejection gracefully', async () => {
  const restore = installFullscreenEnv({
    userAgent: 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/125 Mobile Safari/537.36',
    platform: 'Linux armv8l',
    rejectFullscreen: true,
  });
  try {
    const result = await enterNativeFullscreen();
    assert.equal(result, false);
  } finally {
    restore();
  }
});
