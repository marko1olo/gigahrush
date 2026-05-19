type PrefixedFullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
  webkitRequestFullScreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
};

type PrefixedFullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  msFullscreenElement?: Element | null;
  msExitFullscreen?: () => Promise<void> | void;
};

function fullscreenDocument(): PrefixedFullscreenDocument {
  return document as PrefixedFullscreenDocument;
}

function fullscreenElement(): Element | null {
  const doc = fullscreenDocument();
  return document.fullscreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement || null;
}

function lockLandscape(): void {
  const orientation = screen.orientation as (ScreenOrientation & {
    lock?: (orientation: 'landscape') => Promise<void>;
  }) | undefined;
  if (!orientation?.lock) return;
  void orientation.lock('landscape').catch(() => {});
}

function isIosWebKit(): boolean {
  const ua = navigator.userAgent;
  const iosDevice = /iphone|ipad|ipod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return iosDevice && /applewebkit/i.test(ua);
}

async function requestNativeFullscreen(target: HTMLElement): Promise<boolean> {
  try {
    if (target.requestFullscreen) {
      await target.requestFullscreen({ navigationUI: 'hide' });
      lockLandscape();
      return true;
    }
    const prefixed = target as PrefixedFullscreenElement;
    const request = prefixed.webkitRequestFullscreen || prefixed.webkitRequestFullScreen || prefixed.msRequestFullscreen;
    if (!request) return false;
    await request.call(prefixed);
    lockLandscape();
    return true;
  } catch {
    return false;
  }
}

export function isEmbeddedViewport(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function standaloneLaunchUrl(): string {
  const url = new URL(window.location.href);
  url.searchParams.set('standalone', '1');
  return url.href;
}

export function openStandalonePage(): void {
  const url = standaloneLaunchUrl();
  try {
    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    if (opened) return;
  } catch {
    // Fall through to same-tab navigation.
  }
  try {
    window.top?.location.assign(url);
    return;
  } catch {
    window.location.assign(url);
  }
}

export function canUseMobileFullscreen(): boolean {
  if (isEmbeddedViewport() || isIosWebKit()) return false;
  const target = document.documentElement as PrefixedFullscreenElement;
  return Boolean(target.requestFullscreen || target.webkitRequestFullscreen || target.webkitRequestFullScreen || target.msRequestFullscreen);
}

export async function enterMobileFullscreen(target: HTMLElement = document.documentElement): Promise<boolean> {
  if (!canUseMobileFullscreen()) return false;
  return requestNativeFullscreen(target);
}

export async function exitMobileFullscreen(): Promise<void> {
  const doc = fullscreenDocument();
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else if (doc.webkitFullscreenElement && doc.webkitExitFullscreen) {
      await doc.webkitExitFullscreen();
    } else if (doc.msFullscreenElement && doc.msExitFullscreen) {
      await doc.msExitFullscreen();
    }
  } catch {
    // Browser fullscreen exit can reject if the user already left fullscreen.
  }
}

export function isMobileFullscreenActive(): boolean {
  return fullscreenElement() !== null;
}
