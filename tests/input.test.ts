import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { bindInput, createInput } from '../src/input.js';
import { beginControlCapture, getControlCaptureAction, controlBindings, cancelControlCapture } from '../src/systems/controls.js';

function installInputDom() {

  const preventDefault = () => {};
  const stopImmediatePropagation = () => {};

  const documentListeners: Record<string, Function[]> = {};
  const documentMock = {
    addEventListener: (type: string, listener: Function) => {
      if (!documentListeners[type]) documentListeners[type] = [];
      documentListeners[type].push(listener);
    },
    removeEventListener: (type: string, listener: Function) => {
      if (documentListeners[type]) {
        documentListeners[type] = documentListeners[type].filter(l => l !== listener);
      }
    },
    pointerLockElement: null,
    hidden: false,
    dispatch: (type: string, event: any = {}) => {
      event.preventDefault = event.preventDefault || preventDefault;
      event.stopImmediatePropagation = event.stopImmediatePropagation || stopImmediatePropagation;
      if (documentListeners[type]) {
        for (const listener of documentListeners[type]) listener(event);
      }
    }
  };

  const canvasListeners: Record<string, Function[]> = {};
  const canvasMock = {
    addEventListener: (type: string, listener: Function) => {
      if (!canvasListeners[type]) canvasListeners[type] = [];
      canvasListeners[type].push(listener);
    },
    removeEventListener: (type: string, listener: Function) => {
      if (canvasListeners[type]) {
        canvasListeners[type] = canvasListeners[type].filter(l => l !== listener);
      }
    },
    requestCount: 0,
    requestPointerLock: function() {
      this.requestCount++;
      return Promise.resolve();
    },
    dispatch: (type: string, event: any = {}) => {
      event.preventDefault = event.preventDefault || preventDefault;
      event.stopImmediatePropagation = event.stopImmediatePropagation || stopImmediatePropagation;
      if (canvasListeners[type]) {
        for (const listener of canvasListeners[type]) listener(event);
      }
    }
  };

  const windowListeners: Record<string, Function[]> = {};
  const windowMock = {
    addEventListener: (type: string, listener: Function) => {
      if (!windowListeners[type]) windowListeners[type] = [];
      windowListeners[type].push(listener);
    },
    removeEventListener: (type: string, listener: Function) => {
      if (windowListeners[type]) {
        windowListeners[type] = windowListeners[type].filter(l => l !== listener);
      }
    },
    dispatch: (type: string, event: any = {}) => {
      event.preventDefault = event.preventDefault || preventDefault;
      event.stopImmediatePropagation = event.stopImmediatePropagation || stopImmediatePropagation;
      if (windowListeners[type]) {
        for (const listener of windowListeners[type]) listener(event);
      }
    }
  };

  const previousDocument = globalThis.document;
  const previousWindow = globalThis.window;

  Object.defineProperty(globalThis, 'document', { value: documentMock, configurable: true });
  Object.defineProperty(globalThis, 'window', { value: windowMock, configurable: true });

  return {
    document: documentMock,
    canvas: canvasMock,
    window: windowMock,
    restore: () => {
      if (previousDocument) Object.defineProperty(globalThis, 'document', { value: previousDocument, configurable: true });
      else Reflect.deleteProperty(globalThis, 'document');

      if (previousWindow) Object.defineProperty(globalThis, 'window', { value: previousWindow, configurable: true });
      else Reflect.deleteProperty(globalThis, 'window');
    }
  };
}

function keyboardEvent(type: string, code: string, key: string, mods: any = {}): any {
  return {
    type, code, key, ...mods
  };
}

function mouseEvent(type: string, button: number = 0, movementX: number = 0, movementY: number = 0): any {
  return {
    type, button, movementX, movementY
  };
}

test('bindInput attaches and detaches event listeners', () => {
  const env = installInputDom();
  try {
    const input = createInput();
    const unbind = bindInput(input, env.canvas as any);

    // Test that down sets an input
    env.document.dispatch('keydown', keyboardEvent('keydown', 'KeyW', 'w'));
    assert.equal(input.fwd, true);

    unbind();

    // Test that events no longer update input state
    env.document.dispatch('keyup', keyboardEvent('keyup', 'KeyW', 'w'));
    assert.equal(input.fwd, true); // It should not have been unset
  } finally {
    env.restore();
  }
});

test('captureTextInput works when enabled', () => {
  const env = installInputDom();
  try {
    const input = createInput();
    const unbind = bindInput(input, env.canvas as any, {
      shouldCaptureTextInput: () => true
    });

    env.document.dispatch('keydown', keyboardEvent('keydown', 'KeyA', 'a'));
    assert.equal(input.textInput, 'a');

    env.document.dispatch('keydown', keyboardEvent('keydown', 'KeyB', 'b'));
    assert.equal(input.textInput, 'ab');

    env.document.dispatch('keydown', keyboardEvent('keydown', 'Backspace', 'Backspace'));
    assert.equal(input.textInput, 'ab\b');

    unbind();
  } finally {
    env.restore();
  }
});

test('captureTextInput is ignored with modifiers', () => {
  const env = installInputDom();
  try {
    const input = createInput();
    const unbind = bindInput(input, env.canvas as any, {
      shouldCaptureTextInput: () => true
    });

    env.document.dispatch('keydown', keyboardEvent('keydown', 'KeyA', 'a', { ctrlKey: true }));
    assert.equal(input.textInput, '');

    unbind();
  } finally {
    env.restore();
  }
});

test('onFullscreenToggle is called', () => {
  const env = installInputDom();
  try {
    const input = createInput();
    let toggled = false;
    const unbind = bindInput(input, env.canvas as any, {
      onFullscreenToggle: () => { toggled = true; }
    });

    env.document.dispatch('keydown', keyboardEvent('keydown', 'F11', 'F11'));
    assert.equal(toggled, true);

    unbind();
  } finally {
    env.restore();
  }
});

test('blur event clears input state', () => {
  const env = installInputDom();
  try {
    const input = createInput();
    const unbind = bindInput(input, env.canvas as any);

    env.document.dispatch('keydown', keyboardEvent('keydown', 'KeyW', 'w'));
    assert.equal(input.fwd, true);

    env.window.dispatch('blur');
    assert.equal(input.fwd, false);

    unbind();
  } finally {
    env.restore();
  }
});

test('visibilitychange hidden clears input state', () => {
  const env = installInputDom();
  try {
    const input = createInput();
    const unbind = bindInput(input, env.canvas as any);

    env.document.dispatch('keydown', keyboardEvent('keydown', 'KeyW', 'w'));
    assert.equal(input.fwd, true);

    env.document.hidden = true;
    env.document.dispatch('visibilitychange');
    assert.equal(input.fwd, false);

    unbind();
  } finally {
    env.restore();
  }
});

test('mouse movement tracking', () => {
  const env = installInputDom();
  try {
    const input = createInput();
    const unbind = bindInput(input, env.canvas as any, {
      shouldHandleGameplayPointer: () => true
    });

    env.document.pointerLockElement = env.canvas as any;

    env.document.dispatch('mousemove', mouseEvent('mousemove', 0, 10, 20));
    assert.equal(input.mouse.dx, 10);
    assert.equal(input.mouse.dy, 20);

    unbind();
  } finally {
    env.restore();
  }
});

test('mouse wheel events on menu', () => {
  const env = installInputDom();
  try {
    const input = createInput();
    const unbind = bindInput(input, env.canvas as any, {
      shouldHandleMenuWheel: () => true
    });

    env.document.dispatch('wheel', { type: 'wheel', deltaY: 100 });
    assert.equal(input.menuWheel, 1);

    env.document.dispatch('wheel', { type: 'wheel', deltaY: -100 });
    assert.equal(input.menuWheel, 0);

    unbind();
  } finally {
    env.restore();
  }
});

test('captureTextInput handles Delete key', () => {
  const env = installInputDom();
  try {
    const input = createInput();
    const unbind = bindInput(input, env.canvas as any, {
      shouldCaptureTextInput: () => true
    });

    env.document.dispatch('keydown', keyboardEvent('keydown', 'Delete', 'Delete'));
    assert.equal(input.textInput, '\x7f');

    unbind();
  } finally {
    env.restore();
  }
});




test('control capture handles code correctly', () => {
  const env = installInputDom();
  try {
    const input = createInput();
    const unbind = bindInput(input, env.canvas as any);

    beginControlCapture('quests');

    env.document.dispatch('keydown', keyboardEvent('keydown', 'KeyJ', 'j'));

    // We expect KeyJ to be bound to 'quests' now, and capture action should be null
    assert.deepEqual([...controlBindings('quests')].includes('KeyJ'), true);
    assert.equal(getControlCaptureAction(), null);

    cancelControlCapture();
    unbind();
  } finally {
    env.restore();
  }
});



test('control action match does prevent default', () => {
  const env = installInputDom();
  try {
    const input = createInput();
    const unbind = bindInput(input, env.canvas as any);

    // F1 is bound to 'help' by default
    let prevented = false;
    const ev = keyboardEvent('keydown', 'F1', 'F1');
    ev.preventDefault = () => { prevented = true; };
    env.document.dispatch('keydown', ev);

    assert.equal(input.help, true);
    assert.equal(prevented, true);

    unbind();
  } finally {
    env.restore();
  }
});
