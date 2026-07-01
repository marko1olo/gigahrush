import test from 'node:test';
import assert from 'node:assert/strict';

import { createMobileControls, shouldUseTouchControls } from '../src/mobile';
import { createInput } from '../src/input';

class FakeDOMTokenList {
  classes = new Set<string>();
  toggle(token: string, force?: boolean) {
    if (force === undefined) {
      if (this.classes.has(token)) this.classes.delete(token);
      else this.classes.add(token);
    } else {
      if (force) this.classes.add(token);
      else this.classes.delete(token);
    }
  }
  add(token: string) { this.classes.add(token); }
  remove(token: string) { this.classes.delete(token); }
  contains(token: string) { return this.classes.has(token); }
}

class FakeHTMLElement {
  tagName: string;
  className = '';
  textContent = '';
  type = '';
  attributes = new Map<string, string>();
  children: FakeHTMLElement[] = [];
  dataset: Record<string, string> = {};
  classList = new FakeDOMTokenList();
  hidden = false;
  style = {
    transform: '',
    setProperty(key: string, value: string) {
      (this as any)[key] = value;
    }
  };

  constructor(tagName: string) {
    this.tagName = tagName;
  }

  setAttribute(key: string, value: string) {
    this.attributes.set(key, value);
  }
  getAttribute(key: string) {
    return this.attributes.get(key) ?? null;
  }
  hasAttribute(key: string) {
    return this.attributes.has(key);
  }
  toggleAttribute(name: string, force?: boolean) {
    if (force === undefined) force = !this.attributes.has(name);
    if (force) this.attributes.set(name, '');
    else this.attributes.delete(name);
  }
  append(...nodes: FakeHTMLElement[]) {
    this.children.push(...nodes);
  }
  remove() {}
  addEventListener(type: string, listener: any) {}
  removeEventListener(type: string, listener: any) {}
  getBoundingClientRect() { return { left: 0, top: 0, width: 100, height: 100 }; }
  setPointerCapture() {}
  releasePointerCapture() {}
  hasPointerCapture() { return false; }
}

interface MobileEnvOptions {
  userAgent: string;
  maxTouchPoints?: number;
  hasOntouchstart?: boolean;
  innerWidth?: number;
  innerHeight?: number;
}

function installMobileEnv(options: MobileEnvOptions): () => void {
  const previousNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const hadOntouchstart = 'ontouchstart' in globalThis;
  const previousOntouchstart = Object.getOwnPropertyDescriptor(globalThis, 'ontouchstart');

  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {
      userAgent: options.userAgent,
      maxTouchPoints: options.maxTouchPoints ?? 0,
    },
  });

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      innerWidth: options.innerWidth ?? 1920,
      innerHeight: options.innerHeight ?? 1080,
    },
  });

  if (options.hasOntouchstart) {
    Object.defineProperty(globalThis, 'ontouchstart', {
      configurable: true,
      value: null,
    });
  } else {
    Reflect.deleteProperty(globalThis, 'ontouchstart');
  }

  return () => {
    if (previousNavigator) Object.defineProperty(globalThis, 'navigator', previousNavigator);
    else Reflect.deleteProperty(globalThis, 'navigator');

    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow);
    else Reflect.deleteProperty(globalThis, 'window');

    if (hadOntouchstart && previousOntouchstart) {
      Object.defineProperty(globalThis, 'ontouchstart', previousOntouchstart);
    } else {
      Reflect.deleteProperty(globalThis, 'ontouchstart');
    }
  };
}

test('shouldUseTouchControls: Mobile user agent always returns true', () => {
  const restore = installMobileEnv({
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
    maxTouchPoints: 0,
    hasOntouchstart: false,
    innerWidth: 1920,
    innerHeight: 1080,
  });
  try {
    assert.equal(shouldUseTouchControls(), true);
  } finally {
    restore();
  }
});

function installMobileDom(options?: { userAgent?: string; innerWidth?: number; innerHeight?: number }): { body: FakeHTMLElement; restore: () => void } {
  const previousHTMLElement = Object.getOwnPropertyDescriptor(globalThis, 'HTMLElement');
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const previousNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');

  Object.defineProperty(globalThis, 'HTMLElement', { value: FakeHTMLElement, configurable: true });

  const body = new FakeHTMLElement('body');
  const doc = {
    createElement: (tag: string) => new FakeHTMLElement(tag),
    body,
    documentElement: new FakeHTMLElement('html'),
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  Object.defineProperty(globalThis, 'document', { value: doc, configurable: true });

  Object.defineProperty(globalThis, 'window', {
    value: {
      innerWidth: options?.innerWidth ?? 1920,
      innerHeight: options?.innerHeight ?? 1080,
      addEventListener: () => {},
      removeEventListener: () => {},
      visualViewport: null,
    },
    configurable: true,
  });

  Object.defineProperty(globalThis, 'navigator', {
    value: {
      userAgent: options?.userAgent ?? 'test',
      maxTouchPoints: 0,
    },
    configurable: true,
  });

  return {
    body,
    restore: () => {
      if (previousHTMLElement) Object.defineProperty(globalThis, 'HTMLElement', previousHTMLElement);
      else Reflect.deleteProperty(globalThis, 'HTMLElement');
      if (previousDocument) Object.defineProperty(globalThis, 'document', previousDocument);
      else Reflect.deleteProperty(globalThis, 'document');
      if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow);
      else Reflect.deleteProperty(globalThis, 'window');
      if (previousNavigator) Object.defineProperty(globalThis, 'navigator', previousNavigator);
      else Reflect.deleteProperty(globalThis, 'navigator');
    },
  };
}

test('createMobileControls: creates and appends the mobile-controls container', () => {
  const { body, restore } = installMobileDom();
  try {
    const input = createInput();
    const controls = createMobileControls(input, {
      onGesture: () => {},
      onMenu: () => {},
      onConfirm: () => {},
      onClose: () => {},
    });

    assert.equal(body.children.length, 1);
    const root = body.children[0];
    assert.equal(root.className, 'mobile-controls');
    assert.equal(root.getAttribute('aria-hidden'), 'false');

    assert.ok(root.children.length >= 7);

    assert.equal(controls.isEnabled(), false);

    controls.destroy();
    assert.equal(body.classList.contains('mobile-controls-on'), false);
  } finally {
    restore();
  }
});

test('createMobileControls: toggles visibility correctly when calling refresh', () => {
  const { body, restore } = installMobileDom({
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
    innerWidth: 375,
    innerHeight: 812,
  });

  try {
    const input = createInput();
    const controls = createMobileControls(input, {
      onGesture: () => {},
      onMenu: () => {},
      onConfirm: () => {},
      onClose: () => {},
    });

    assert.equal(controls.isEnabled(), true);
    assert.equal(body.classList.contains('mobile-controls-on'), true);

    const root = body.children[0];
    assert.equal(root.hasAttribute('hidden'), false);

    controls.destroy();
  } finally {
    restore();
  }
});

test('createMobileControls: updates context and refreshes classes', () => {
  const { body, restore } = installMobileDom();
  try {
    const input = createInput();
    const controls = createMobileControls(input, {
      onGesture: () => {},
      onMenu: () => {},
      onConfirm: () => {},
      onClose: () => {},
    });

    const root = body.children[0];
    assert.equal(root.classList.contains('is-started'), false);

    controls.updateContext({
      started: true,
      menuOpen: false,
      canInteract: true,
      gameOver: false,
    });

    assert.equal(root.classList.contains('is-started'), true);
    assert.equal(root.classList.contains('can-interact'), true);
    assert.equal(root.classList.contains('is-menu-open'), false);

    controls.destroy();
  } finally {
    restore();
  }
});

test('shouldUseTouchControls: Desktop with touch and compact viewport returns true', () => {
  const restore = installMobileEnv({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    maxTouchPoints: 10,
    hasOntouchstart: false,
    innerWidth: 800,
    innerHeight: 600,
  });
  try {
    assert.equal(shouldUseTouchControls(), true);
  } finally {
    restore();
  }
});

test('shouldUseTouchControls: Desktop with touch but large viewport returns false', () => {
  const restore = installMobileEnv({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    maxTouchPoints: 10,
    hasOntouchstart: false,
    innerWidth: 1920,
    innerHeight: 1080,
  });
  try {
    assert.equal(shouldUseTouchControls(), false);
  } finally {
    restore();
  }
});

test('shouldUseTouchControls: Desktop without touch but compact viewport returns false', () => {
  const restore = installMobileEnv({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    maxTouchPoints: 0,
    hasOntouchstart: false,
    innerWidth: 800,
    innerHeight: 600,
  });
  try {
    assert.equal(shouldUseTouchControls(), false);
  } finally {
    restore();
  }
});

test('shouldUseTouchControls: Touch capability from ontouchstart with compact viewport returns true', () => {
  const restore = installMobileEnv({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    maxTouchPoints: 0,
    hasOntouchstart: true,
    innerWidth: 800,
    innerHeight: 600,
  });
  try {
    assert.equal(shouldUseTouchControls(), true);
  } finally {
    restore();
  }
});
