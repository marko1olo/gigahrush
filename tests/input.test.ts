import { test, afterEach } from "node:test";
import * as assert from "node:assert/strict";
import { bindInput, createInput } from "../src/input";
import {
  beginControlCapture,
  resetAllControlBindings,
} from "../src/systems/controls";

afterEach(() => {
  resetAllControlBindings();
});

class FakeEventTarget {
  public readonly listeners = new Map<
    string,
    Set<EventListenerOrEventListenerObject>
  >();
  private readonly listeners = new Map<
    string,
    Set<EventListenerOrEventListenerObject>
  >();

  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
  ): void {
    if (!listener) return;
    let set = this.listeners.get(type);
    if (!set) {
      set = new Set();
      this.listeners.set(type, set);
    }
    set.add(listener);
  }

  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
  ): void {
    if (!listener) return;
    this.listeners.get(type)?.delete(listener);
  }

  dispatch(type: string, event: Event = new Event(type)): void {
    for (const listener of this.listeners.get(type) ?? []) {
      if (typeof listener === "function") listener.call(this, event);
      else listener.handleEvent(event);
    }
  }
}

class FakeDocument extends FakeEventTarget {
  hidden = false;
  pointerLockElement: Element | null = null;
}

class FakeWindow extends FakeEventTarget {}

class FakeCanvas extends FakeEventTarget {
  requestCount = 0;
  requestPointerLock(): void {
    this.requestCount++;
  }
}

function installInputDom(): {
  canvas: FakeCanvas;
  document: FakeDocument;
  window: FakeWindow;
  restore: () => void;
} {
  const doc = new FakeDocument();
  const win = new FakeWindow();
  const canvas = new FakeCanvas(doc);
  const previousDocument = Object.getOwnPropertyDescriptor(
    globalThis,
    "document",
  );
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: doc,
  });
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: win,
  });
  return {
    canvas,
    document: doc,
    window: win,
    restore: () => {
      if (previousDocument)
        Object.defineProperty(globalThis, "document", previousDocument);
      else Reflect.deleteProperty(globalThis, "document");
      if (previousWindow)
        Object.defineProperty(globalThis, "window", previousWindow);
      else Reflect.deleteProperty(globalThis, "window");
    },
  };
}

function keyboardEvent(
  type: string,
  code: string,
  key: string,
  ctrlKey = false,
  metaKey = false,
  altKey = false,
): KeyboardEvent {
  const event = new Event(type, { cancelable: true }) as KeyboardEvent;
  Object.defineProperty(event, "code", { value: code });
  Object.defineProperty(event, "key", { value: key });
  Object.defineProperty(event, "ctrlKey", { value: ctrlKey });
  Object.defineProperty(event, "metaKey", { value: metaKey });
  Object.defineProperty(event, "altKey", { value: altKey });
  return event;
}

test("createInput returns an initial InputState with correct default values", () => {
  const input = createInput();

  assert.deepEqual(input, {
    fwd: false,
    back: false,
    left: false,
    right: false,
    strafeL: false,
    strafeR: false,
    sprint: false,
    attack: false,
    interact: false,
    interactHeld: false,
    pickup: false,
    reload: false,
    map: false,
    mapLegend: false,
    inv: false,
    invUp: false,
    invDn: false,
    invLeft: false,
    invRight: false,
    use: false,
    escape: false,
    questLog: false,
    mouseAttack: false,
    mouseUse: false,
    menuAccept: false,
    menuClose: false,
    menuWheel: 0,
    textInput: "",
    attrStr: false,
    attrAgi: false,
    attrInt: false,
    debugScreen: false,
    pee: false,
    drop: false,
    factionMenu: false,
    logMenu: false,
    help: false,
    sleep: false,
    controls: false,
    uiSettings: false,
    controlEdit: false,
    controlReset: false,
    controlClose: false,
    mouse: { dx: 0, dy: 0, locked: false },
    touch: { moveX: 0, moveY: 0, lookX: 0, lookY: 0, active: false },
  });
});

test("createInput returns a fresh instance each time", () => {
  const input1 = createInput();
  const input2 = createInput();

  assert.notEqual(input1, input2);
  assert.notEqual(input1.mouse, input2.mouse);
  assert.notEqual(input1.touch, input2.touch);
});

test("bindInput attaches and detaches event listeners", () => {
  const env = installInputDom();
  try {
    const input = createInput();
    const unbind = bindInput(input, env.canvas as unknown as HTMLCanvasElement);

    // Verify listeners are attached
    assert.equal((env.document as any).listeners.get("keydown")?.size, 1);
    assert.equal((env.window as any).listeners.get("blur")?.size, 1);
    assert.equal((env.canvas as any).listeners.get("mousedown")?.size, 1);

    unbind();

    // Verify listeners are removed
    assert.equal((env.document as any).listeners.get("keydown")?.size, 0);
    assert.equal((env.window as any).listeners.get("blur")?.size, 0);
    assert.equal((env.canvas as any).listeners.get("mousedown")?.size, 0);
  } finally {
    env.restore();
  }
});

test("bindInput captures keys into boolean flags", () => {
  const env = installInputDom();
  try {
    const input = createInput();
    const unbind = bindInput(input, env.canvas as unknown as HTMLCanvasElement);

    env.document.dispatch("keydown", keyboardEvent("keydown", "KeyW", "w"));
    assert.equal(input.fwd, true);

    env.document.dispatch("keyup", keyboardEvent("keyup", "KeyW", "w"));
    assert.equal(input.fwd, false);

    unbind();
  } finally {
    env.restore();
  }
});

test("bindInput triggers onFullscreenToggle on matching action", () => {
  const env = installInputDom();
  try {
    let toggled = false;
    const input = createInput();
    const unbind = bindInput(
      input,
      env.canvas as unknown as HTMLCanvasElement,
      {
        onFullscreenToggle: () => {
          toggled = true;
        },
      },
    );

    // F11 is the default fullscreen key
    env.document.dispatch("keydown", keyboardEvent("keydown", "F11", "F11"));
    assert.equal(toggled, true);

    unbind();
  } finally {
    env.restore();
  }
});

test("bindInput consumes keys when capturing a control binding", () => {
  const env = installInputDom();
  try {
    const input = createInput();
    const unbind = bindInput(input, env.canvas as unknown as HTMLCanvasElement);

    beginControlCapture("quests");

    // Key presses should be consumed by the capture action, not trigger input states
    env.document.dispatch("keydown", keyboardEvent("keydown", "KeyW", "w"));

    assert.equal(input.fwd, false);

    unbind();
  } finally {
    env.restore();
  }
});

test("bindInput handles text capture", () => {
  const env = installInputDom();
  try {
    const input = createInput();
    const unbind = bindInput(
      input,
      env.canvas as unknown as HTMLCanvasElement,
      {
        shouldCaptureTextInput: () => true,
      },
    );

    // Standard characters
    env.document.dispatch("keydown", keyboardEvent("keydown", "KeyA", "a"));
    env.document.dispatch("keydown", keyboardEvent("keydown", "KeyB", "b"));
    assert.equal(input.textInput, "ab");

    // Ignore modifiers
    env.document.dispatch(
      "keydown",
      keyboardEvent("keydown", "KeyC", "c", true, false, false),
    );
    env.document.dispatch(
      "keydown",
      keyboardEvent("keydown", "KeyC", "c", false, true, false),
    );
    env.document.dispatch(
      "keydown",
      keyboardEvent("keydown", "KeyC", "c", false, false, true),
    );
    assert.equal(input.textInput, "ab");

    // Backspace
    env.document.dispatch(
      "keydown",
      keyboardEvent("keydown", "Backspace", "Backspace"),
    );
    assert.equal(input.textInput, "ab");

    // Delete
    env.document.dispatch(
      "keydown",
      keyboardEvent("keydown", "Delete", "Delete"),
    );
    assert.equal(input.textInput, "ab");

    unbind();
  } finally {
    env.restore();
  }
});

test("bindInput text capture limits to 64 characters", () => {
  const env = installInputDom();
  try {
    const input = createInput();
    const unbind = bindInput(
      input,
      env.canvas as unknown as HTMLCanvasElement,
      {
        shouldCaptureTextInput: () => true,
      },
    );

    for (let i = 0; i < 70; i++) {
      env.document.dispatch("keydown", keyboardEvent("keydown", "KeyX", "x"));
    }

    assert.equal(input.textInput.length, 64);

    unbind();
  } finally {
    env.restore();
  }
});

test("bindInput clearLostInputState triggers on blur and visibility change", () => {
  const env = installInputDom();
  try {
    const input = createInput();
    const unbind = bindInput(input, env.canvas as unknown as HTMLCanvasElement);

    // Setup some state
    env.document.dispatch("keydown", keyboardEvent("keydown", "KeyW", "w"));
    input.textInput = "test";
    input.menuAccept = true;
    assert.equal(input.fwd, true);

    // Trigger blur on window
    env.window.dispatch("blur", new Event("blur"));
    env.document.dispatch("blur", new Event("blur"));
    assert.equal(input.fwd, false);
    assert.equal(input.textInput, "");
    assert.equal(input.menuAccept, false);

    // Setup some state again
    env.document.dispatch("keydown", keyboardEvent("keydown", "KeyA", "a"));
    assert.equal(input.strafeL, true);

    // Trigger visibility change with document.hidden = true
    env.document.hidden = true;
    env.document.dispatch("visibilitychange", new Event("visibilitychange"));
    assert.equal(input.strafeL, false);

    unbind();
  } finally {
    env.restore();
  }
});
