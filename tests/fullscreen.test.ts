import test from 'node:test';
import assert from 'node:assert/strict';

import { canUseMobileFullscreen, canUseNativeFullscreen, standaloneLaunchUrl, enterNativeFullscreen } from '../src/fullscreen';

interface FullscreenEnvOptions {
  userAgent: string;
  platform?: string;
  maxTouchPoints?: number;
  embedded?: boolean;
  requestFullscreen?: boolean;
  href?: string;
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
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { self, top, location: { href: options.href || 'https://example.com/' } },
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


test('standaloneLaunchUrl appends standalone query parameter', () => {
  let restore = installFullscreenEnv({
    userAgent: 'Mozilla/5.0',
    href: 'https://example.com/game',
  });
  try {
    assert.equal(standaloneLaunchUrl(), 'https://example.com/game?standalone=1');
  } finally {
    restore();
  }

  restore = installFullscreenEnv({
    userAgent: 'Mozilla/5.0',
    href: 'https://example.com/game?foo=bar',
  });
  try {
    assert.equal(standaloneLaunchUrl(), 'https://example.com/game?foo=bar&standalone=1');
  } finally {
    restore();
  }

  restore = installFullscreenEnv({
    userAgent: 'Mozilla/5.0',
    href: 'https://example.com/game?standalone=0',
  });
  try {
    assert.equal(standaloneLaunchUrl(), 'https://example.com/game?standalone=1');
  } finally {
    restore();
  }
});

test('enterNativeFullscreen returns false when requestFullscreen throws', async () => {
  const restore = installFullscreenEnv({
    userAgent: 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/125 Mobile Safari/537.36',
    platform: 'Linux armv8l',
  });
  const previousScreen = Object.getOwnPropertyDescriptor(globalThis, 'screen');
  Object.defineProperty(globalThis, 'screen', {
    configurable: true,
    value: { orientation: {} },
  });

  try {
    const mockTarget = {
      requestFullscreen: async () => {
        throw new Error('Fullscreen request denied');
      }
    } as unknown as HTMLElement;

    const result = await enterNativeFullscreen(mockTarget);
    assert.equal(result, false);
  } finally {
    if (previousScreen) Object.defineProperty(globalThis, 'screen', previousScreen);
    else Reflect.deleteProperty(globalThis, 'screen');
    restore();
  }
});

test('enterNativeFullscreen returns false when prefixed requestFullscreen throws', async () => {
  const restore = installFullscreenEnv({
    userAgent: 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/125 Mobile Safari/537.36',
    platform: 'Linux armv8l',
  });
  const previousScreen = Object.getOwnPropertyDescriptor(globalThis, 'screen');
  Object.defineProperty(globalThis, 'screen', {
    configurable: true,
    value: { orientation: {} },
  });

  try {
    const mockTarget = {
      webkitRequestFullscreen: async () => {
        throw new Error('Prefixed fullscreen request denied');
      }
    } as unknown as HTMLElement;

    const result = await enterNativeFullscreen(mockTarget);
    assert.equal(result, false);
  } finally {
    if (previousScreen) Object.defineProperty(globalThis, 'screen', previousScreen);
    else Reflect.deleteProperty(globalThis, 'screen');
    restore();
  }
});

test('enterNativeFullscreen returns true when requestFullscreen succeeds', async () => {
  const restore = installFullscreenEnv({
    userAgent: 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/125 Mobile Safari/537.36',
    platform: 'Linux armv8l',
  });
  const previousScreen = Object.getOwnPropertyDescriptor(globalThis, 'screen');
  Object.defineProperty(globalThis, 'screen', {
    configurable: true,
    value: { orientation: {} },
  });

  try {
    const mockTarget = {
      requestFullscreen: async () => {}
    } as unknown as HTMLElement;

    const result = await enterNativeFullscreen(mockTarget);
    assert.equal(result, true);
  } finally {
    if (previousScreen) Object.defineProperty(globalThis, 'screen', previousScreen);
    else Reflect.deleteProperty(globalThis, 'screen');
    restore();
  }
});

test('enterNativeFullscreen returns true when prefixed requestFullscreen succeeds', async () => {
  const restore = installFullscreenEnv({
    userAgent: 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/125 Mobile Safari/537.36',
    platform: 'Linux armv8l',
  });
  const previousScreen = Object.getOwnPropertyDescriptor(globalThis, 'screen');
  Object.defineProperty(globalThis, 'screen', {
    configurable: true,
    value: { orientation: {} },
  });

  try {
    const mockTarget = {
      webkitRequestFullscreen: async () => {}
    } as unknown as HTMLElement;

    const result = await enterNativeFullscreen(mockTarget);
    assert.equal(result, true);
  } finally {
    if (previousScreen) Object.defineProperty(globalThis, 'screen', previousScreen);
    else Reflect.deleteProperty(globalThis, 'screen');
    restore();
  }
});
