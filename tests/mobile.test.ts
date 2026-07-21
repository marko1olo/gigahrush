import test from 'node:test';
import * as assert from 'node:assert/strict';

import { shouldUseTouchControls, createMobileControls, type MobileControlsContext, type MobileControls } from '../src/mobile';
import { type InputState } from '../src/core/types';

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

test('createMobileControls: Lifecycle and interface methods', () => {
  const restoreEnv = installMobileEnv({ userAgent: 'Mozilla/5.0 (Mobile)', maxTouchPoints: 10, innerWidth: 800, innerHeight: 600 });
  const restoreDOM = installDOMEnv();

  try {
    const input = createMockInputState();
    let gestures = 0;

    const controls = createMobileControls(input, {
      onGesture: () => gestures++,
      onMenu: () => {},
      onConfirm: () => {},
      onClose: () => {},
    });

    // Test isEnabled
    assert.equal(controls.isEnabled(), true);

    // Test updateContext
    const context: MobileControlsContext = {
      started: true,
      menuOpen: false,
      canInteract: false,
      gameOver: false,
    };
    controls.updateContext(context);

    // Ensure getElementsByClassName exists for mock finding (simple polyfill on our mockDocument if not added)
    // Actually, we can use an internal handle, or we can just patch mockDocument body to allow finding nodes by class name
    // Since our mock is basic, we will extract the mock movePad element via capturing it from document.createElement.

    // Wait, the test setup already created the controls, the nodes are inside document.body.
    // Let's use the created elements from our classList store in mock Document to find it.
    // To make it robust without modifying the class, we can modify the mock to store created nodes, or we can just access it.
    controls.resetInput();
    assert.equal(input.touch.moveX, 0);
    assert.equal(input.touch.moveY, 0);
    assert.equal(input.touch.lookX, 0);
    assert.equal(input.touch.lookY, 0);
    assert.equal(input.touch.active, false);

    // Test destroy
    controls.destroy();
  } finally {
    restoreDOM();
    restoreEnv();
  }
});

test('createMobileControls: isEnabled returns false on non-mobile environment', () => {
  const restoreEnv = installMobileEnv({ userAgent: 'Mozilla/5.0 (Windows)', maxTouchPoints: 0, innerWidth: 1920, innerHeight: 1080 });
  const restoreDOM = installDOMEnv();

  try {
    const input = createMockInputState();

    const controls = createMobileControls(input, {
      onGesture: () => {},
      onMenu: () => {},
      onConfirm: () => {},
      onClose: () => {},
    });

    assert.equal(controls.isEnabled(), false);
    controls.destroy();
  } finally {
    restoreDOM();
    restoreEnv();
  }
});

function installDOMEnv(): () => void {
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');

  const mockListeners: { e: string; cb: any }[] = [];

  const mockCreatedElements: any[] = [];
  const mockDocument = {
    documentElement: {
      requestFullscreen: () => Promise.resolve(),
    },
    createElement: (tag: string) => {
      const classListStore = new Set<string>();
      const elementObj = {
        type: '',
        className: '',
        textContent: '',
        setAttribute: () => {},
        getAttribute: () => null,
        toggleAttribute: () => {},
        append: () => {},
        addEventListener: function (this: any, e: string, cb: any) {
          if (!this.mockListeners) this.mockListeners = [];
          this.mockListeners.push({ e, cb });
        },
        removeEventListener: () => {},
        dispatchEvent: function (this: any, event: any) {
          if (!this.mockListeners) return;
          for (const l of this.mockListeners) {
            if (l.e === event.type) l.cb.call(this, event);
          }
        },
        classList: {
          toggle: (cls: string, force?: boolean) => {
            if (force === true) classListStore.add(cls);
            else if (force === false) classListStore.delete(cls);
            else {
              if (classListStore.has(cls)) classListStore.delete(cls);
              else classListStore.add(cls);
            }
          },
          remove: (cls: string) => classListStore.delete(cls),
          add: (cls: string) => classListStore.add(cls),
          contains: (cls: string) => classListStore.has(cls),
        },
        style: { setProperty: () => {}, transform: '' },
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
        setPointerCapture: () => {},
        releasePointerCapture: () => {},
        hasPointerCapture: () => false,
        dataset: {},
        hidden: false,
        remove: () => {},
      };
      mockCreatedElements.push(elementObj);
      return elementObj;
    },
    body: {
      append: () => {},
      classList: {
        toggle: () => {},
        remove: () => {},
        add: () => {},
      },
    },
    addEventListener: () => {},
    removeEventListener: () => {},
  };

  const mockWindow = {
    addEventListener: () => {},
    removeEventListener: () => {},
    matchMedia: () => ({ matches: false }),
    innerWidth: 1000,
    innerHeight: 1000,
    visualViewport: {
      addEventListener: () => {},
      removeEventListener: () => {},
      width: 1000,
      height: 1000,
    },
  };

  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: mockDocument,
  });

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: mockWindow,
  });

  // Expose created elements for tests
  (globalThis as any)._mockCreatedElements = mockCreatedElements;

  return () => {
    delete (globalThis as any)._mockCreatedElements;
    if (previousDocument) Object.defineProperty(globalThis, 'document', previousDocument);
    else Reflect.deleteProperty(globalThis, 'document');

    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow);
    else Reflect.deleteProperty(globalThis, 'window');
  };
}

function createMockInputState(): InputState {
  return {
    fwd: false, back: false, left: false, right: false,
    strafeL: false, strafeR: false,
    sprint: false, attack: false, interact: false, pickup: false, reload: false,
    interactHeld: false, map: false, mapLegend: false, inv: false,
    invUp: false, invDn: false, invLeft: false, invRight: false,
    use: false, escape: false, questLog: false, mouseAttack: false, mouseUse: false,
    menuAccept: false, menuClose: false, menuWheel: 0, textInput: '',
    attrStr: false, attrAgi: false, attrInt: false, debugScreen: false,
    pee: false, drop: false, factionMenu: false, logMenu: false, help: false, sleep: false,
    controls: false, uiSettings: false, controlEdit: false, controlReset: false, controlClose: false,
    mouse: { dx: 0, dy: 0, locked: false },
    touch: { moveX: 0, moveY: 0, lookX: 0, lookY: 0, active: false }
  };
}

test('shouldUseTouchControls: Android user agent returns true', () => {
  const restore = installMobileEnv({
    userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G981B)',
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

test('shouldUseTouchControls: iPad user agent (case-insensitive) returns true', () => {
  const restore = installMobileEnv({
    userAgent: 'Mozilla/5.0 (IPAD; CPU OS 13_3 like Mac OS X)',
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

test('shouldUseTouchControls: Generic mobile user agent returns true', () => {
  const restore = installMobileEnv({
    userAgent: 'Mozilla/5.0 (Mobile; rv:78.0)',
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

test('shouldUseTouchControls: Desktop with touch and compact width but large height returns true', () => {
  const restore = installMobileEnv({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    maxTouchPoints: 10,
    hasOntouchstart: false,
    innerWidth: 800,
    innerHeight: 1200,
  });
  try {
    assert.equal(shouldUseTouchControls(), true);
  } finally {
    restore();
  }
});

test('shouldUseTouchControls: Desktop with touch and large width but compact height returns true', () => {
  const restore = installMobileEnv({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    maxTouchPoints: 10,
    hasOntouchstart: false,
    innerWidth: 1200,
    innerHeight: 800,
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

test('shouldUseTouchControls: Touch capable and exact 900px boundary viewport returns false', () => {
  const restore = installMobileEnv({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    maxTouchPoints: 10,
    hasOntouchstart: false,
    innerWidth: 900,
    innerHeight: 1080,
  });
  try {
    assert.equal(shouldUseTouchControls(), false);
  } finally {
    restore();
  }
});

test('shouldUseTouchControls: Touch capable and exact 900px boundary on height returns false', () => {
  const restore = installMobileEnv({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    maxTouchPoints: 10,
    hasOntouchstart: false,
    innerWidth: 1080,
    innerHeight: 900,
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
