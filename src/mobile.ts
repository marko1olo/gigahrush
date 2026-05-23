import { type InputState } from './core/types';
import {
  canUseMobileFullscreen,
  enterMobileFullscreen,
  exitMobileFullscreen,
  isEmbeddedViewport,
  isMobileFullscreenActive,
  openStandalonePage,
} from './fullscreen';
import { isStandaloneDisplay } from './pwa';
import { getLocalizationLanguage } from './systems/localization';

export type MobileMenuId = 'inventory' | 'map' | 'quests' | 'log' | 'factions' | 'net' | 'menu' | 'debug';

interface MobileText {
  ru: string;
  en: string;
}

interface MobileActionBase {
  label: MobileText;
  ariaLabel: MobileText;
}

interface MobileMenuAction extends MobileActionBase {
  kind: 'menu';
  id: MobileMenuId;
}

interface MobileInputAction extends MobileActionBase {
  kind: 'input';
  input: BooleanInputKey;
  hold?: boolean;
}

export interface MobileControlsContext {
  started: boolean;
  menuOpen: boolean;
  canInteract: boolean;
  gameOver: boolean;
}

export interface MobileControls {
  isEnabled(): boolean;
  refresh(): void;
  updateContext(context: MobileControlsContext): void;
  destroy(): void;
}

interface MobileControlsOptions {
  onGesture(): void;
  onMenu(menu: MobileMenuId): void;
  onConfirm(): void;
  onClose(): void;
}

type BooleanInputKey = {
  [K in keyof InputState]: InputState[K] extends boolean ? K : never;
}[keyof InputState];

type MobileAction = MobileMenuAction | MobileInputAction;

const MOBILE_ACTIONS: readonly MobileAction[] = [
  { kind: 'menu', id: 'inventory', label: { ru: 'ИНВ', en: 'INV' }, ariaLabel: { ru: 'Открыть инвентарь', en: 'Open inventory' } },
  { kind: 'menu', id: 'map', label: { ru: 'КАРТА', en: 'MAP' }, ariaLabel: { ru: 'Открыть карту', en: 'Open map' } },
  { kind: 'menu', id: 'quests', label: { ru: 'ЗАД', en: 'QUEST' }, ariaLabel: { ru: 'Открыть задания', en: 'Open quests' } },
  { kind: 'menu', id: 'log', label: { ru: 'ЖУРН', en: 'LOG' }, ariaLabel: { ru: 'Открыть журнал сообщений', en: 'Open message log' } },
  { kind: 'menu', id: 'factions', label: { ru: 'ФРАК', en: 'FACT' }, ariaLabel: { ru: 'Открыть фракции', en: 'Open factions' } },
  { kind: 'menu', id: 'net', label: { ru: 'НЕТ', en: 'NET' }, ariaLabel: { ru: 'Открыть НЕТ-СФЕРУ', en: 'Open Net Sphere' } },
  { kind: 'menu', id: 'menu', label: { ru: 'МЕНЮ', en: 'MENU' }, ariaLabel: { ru: 'Открыть меню сохранения', en: 'Open save menu' } },
  { kind: 'input', input: 'attack', hold: true, label: { ru: 'БОЙ', en: 'FIRE' }, ariaLabel: { ru: 'Атака', en: 'Attack' } },
  { kind: 'input', input: 'interact', hold: true, label: { ru: 'ДЕЙСТ', en: 'ACT' }, ariaLabel: { ru: 'Взаимодействие', en: 'Interact' } },
  { kind: 'input', input: 'use', hold: true, label: { ru: 'ИНСТР', en: 'TOOL' }, ariaLabel: { ru: 'Использовать инструмент', en: 'Use tool' } },
  { kind: 'input', input: 'sleep', hold: true, label: { ru: 'СОН', en: 'SLEEP' }, ariaLabel: { ru: 'Спать, удерживать', en: 'Sleep, hold' } },
  { kind: 'input', input: 'pee', hold: true, label: { ru: 'ПИС', en: 'PEE' }, ariaLabel: { ru: 'Пописать', en: 'Pee' } },
  { kind: 'input', input: 'controls', label: { ru: 'КЛАВ', en: 'KEYS' }, ariaLabel: { ru: 'Открыть экран клавиш', en: 'Open controls screen' } },
  { kind: 'input', input: 'drop', label: { ru: 'СБРОС', en: 'DROP' }, ariaLabel: { ru: 'Выбросить или перенести вправо', en: 'Drop or move right' } },
  { kind: 'input', input: 'attrStr', label: { ru: 'СИЛ', en: 'STR' }, ariaLabel: { ru: 'Очко в силу', en: 'Spend point on strength' } },
  { kind: 'input', input: 'attrAgi', label: { ru: 'ЛОВ', en: 'AGI' }, ariaLabel: { ru: 'Очко в ловкость', en: 'Spend point on agility' } },
  { kind: 'input', input: 'attrInt', label: { ru: 'ИНТ', en: 'INT' }, ariaLabel: { ru: 'Очко в интеллект', en: 'Spend point on intellect' } },
  { kind: 'menu', id: 'debug', label: { ru: 'ОТЛ', en: 'DBG' }, ariaLabel: { ru: 'Открыть отладочное меню', en: 'Open debug menu' } },
];

function mobileText(text: MobileText): string {
  return getLocalizationLanguage() === 'en' ? text.en : text.ru;
}

function shouldUseTouchControls(): boolean {
  const ua = navigator.userAgent;
  const mobileUa = /android|iphone|ipad|ipod|mobile/i.test(ua);
  const touchCapable = navigator.maxTouchPoints > 0 || 'ontouchstart' in globalThis;
  const compactViewport = Math.min(window.innerWidth, window.innerHeight) < 900;
  return mobileUa || (touchCapable && compactViewport);
}

function capturePointer(target: EventTarget | null, pointerId: number): void {
  if (target instanceof HTMLElement) {
    target.setPointerCapture(pointerId);
  }
}

function releasePointer(target: EventTarget | null, pointerId: number): void {
  if (target instanceof HTMLElement && target.hasPointerCapture(pointerId)) {
    target.releasePointerCapture(pointerId);
  }
}

function makeButton(className: string, label: string, ariaLabel: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  button.setAttribute('aria-label', ariaLabel);
  return button;
}

export function createMobileControls(input: InputState, options: MobileControlsOptions): MobileControls {
  const root = document.createElement('div');
  root.className = 'mobile-controls';
  root.setAttribute('aria-hidden', 'false');

  const rotate = document.createElement('div');
  rotate.className = 'mobile-rotate';
  rotate.textContent = mobileText({ ru: 'Поверните телефон горизонтально', en: 'Rotate phone landscape' });

  const movePad = makeButton('mobile-pad mobile-pad--move', '', 'Джойстик движения');
  const moveThumb = document.createElement('span');
  moveThumb.className = 'mobile-pad-thumb';
  movePad.append(moveThumb);

  const lookPad = makeButton('mobile-pad mobile-pad--look', '', 'Джойстик камеры');
  const lookThumb = document.createElement('span');
  lookThumb.className = 'mobile-pad-thumb';
  lookPad.append(lookThumb);

  const interact = makeButton('mobile-interact', 'E', mobileText({ ru: 'Взаимодействие', en: 'Interact' }));
  const fire = makeButton('mobile-fire-zone', '', mobileText({ ru: 'Атака', en: 'Attack' }));
  const fullscreen = makeButton('mobile-fullscreen', 'FULL', mobileText({ ru: 'Полный экран', en: 'Fullscreen' }));

  const actionRail = document.createElement('div');
  actionRail.className = 'mobile-menu-rail';
  const actionUp = makeButton('mobile-menu-btn', '▲', mobileText({ ru: 'Действие выше', en: 'Previous action' }));
  const actionSelect = makeButton('mobile-menu-btn mobile-menu-select', mobileText(MOBILE_ACTIONS[0].label), mobileText(MOBILE_ACTIONS[0].ariaLabel));
  const actionDown = makeButton('mobile-menu-btn', '▼', mobileText({ ru: 'Действие ниже', en: 'Next action' }));
  actionRail.append(actionUp, actionSelect, actionDown);

  root.append(rotate, fire, fullscreen, movePad, lookPad, interact, actionRail);
  document.body.append(root);

  let enabled = false;
  let selectedAction = 0;
  let movePointer = -1;
  let lookPointer = -1;
  let firePointer = -1;
  let actionPointer = -1;
  let heldActionInput: BooleanInputKey | null = null;
  let moveActive = false;
  let lookActive = false;
  let context: MobileControlsContext = {
    started: false,
    menuOpen: false,
    canInteract: false,
    gameOver: false,
  };
  const pulseTimers = new Map<BooleanInputKey, ReturnType<typeof setTimeout>>();

  const setBool = (key: BooleanInputKey, value: boolean): void => {
    (input as unknown as Record<BooleanInputKey, boolean>)[key] = value;
  };

  const setActionInput = (key: BooleanInputKey, value: boolean): void => {
    if (key === 'interact') {
      input.interact = value ? !input.interactHeld : false;
      input.interactHeld = value;
      return;
    }
    setBool(key, value);
  };

  const pulse = (key: BooleanInputKey): void => {
    setActionInput(key, true);
    const old = pulseTimers.get(key);
    if (old) clearTimeout(old);
    pulseTimers.set(key, setTimeout(() => {
      setActionInput(key, false);
      pulseTimers.delete(key);
    }, 90));
  };

  const releaseHeldAction = (): void => {
    if (!heldActionInput) return;
    setActionInput(heldActionInput, false);
    heldActionInput = null;
    actionPointer = -1;
  };

  const updateTouchActive = (): void => {
    input.touch.active = moveActive || lookActive;
  };

  const clearTouchInput = (): void => {
    input.touch.moveX = 0;
    input.touch.moveY = 0;
    input.touch.lookX = 0;
    input.touch.lookY = 0;
    input.touch.active = false;
    input.mouseAttack = false;
    releaseHeldAction();
    for (const action of MOBILE_ACTIONS) {
      if (action.kind === 'input') setActionInput(action.input, false);
    }
    moveActive = false;
    lookActive = false;
    movePointer = -1;
    lookPointer = -1;
    firePointer = -1;
    moveThumb.style.transform = '';
    lookThumb.style.transform = '';
  };

  const updateLocalizedText = (): void => {
    rotate.textContent = mobileText({ ru: 'Поверните телефон горизонтально', en: 'Rotate phone landscape' });
    movePad.setAttribute('aria-label', mobileText({ ru: 'Джойстик движения', en: 'Movement stick' }));
    lookPad.setAttribute('aria-label', mobileText({ ru: 'Джойстик камеры', en: 'Camera stick' }));
    interact.setAttribute('aria-label', mobileText({ ru: 'Взаимодействие', en: 'Interact' }));
    fire.setAttribute('aria-label', mobileText({ ru: 'Атака', en: 'Attack' }));
    actionUp.setAttribute('aria-label', mobileText(context.menuOpen ? { ru: 'Меню выше', en: 'Menu up' } : { ru: 'Действие выше', en: 'Previous action' }));
    actionDown.setAttribute('aria-label', mobileText(context.menuOpen ? { ru: 'Меню ниже', en: 'Menu down' } : { ru: 'Действие ниже', en: 'Next action' }));
  };

  const updateSelectedLabel = (): void => {
    const action = MOBILE_ACTIONS[selectedAction];
    actionSelect.textContent = context.menuOpen
      ? (context.gameOver ? 'R' : mobileText({ ru: 'ЗАКР', en: 'CLOSE' }))
      : mobileText(action.label);
    actionSelect.setAttribute(
      'aria-label',
      context.menuOpen
        ? (context.gameOver ? mobileText({ ru: 'Перезапуск', en: 'Restart' }) : mobileText({ ru: 'Закрыть меню', en: 'Close menu' }))
        : mobileText(action.ariaLabel),
    );
  };

  const updateFullscreenUi = (): void => {
    const standalone = isStandaloneDisplay();
    const embedded = isEmbeddedViewport();
    const nativeFullscreen = canUseMobileFullscreen();
    const active = isMobileFullscreenActive();
    const mode = standalone ? 'standalone' : embedded ? 'direct' : nativeFullscreen ? (active ? 'exit' : 'native') : 'hidden';
    fullscreen.dataset.fullscreenMode = mode;
    fullscreen.hidden = standalone || (!embedded && !nativeFullscreen);
    fullscreen.textContent = embedded ? '↗' : (active ? 'EXIT' : 'FULL');
    fullscreen.setAttribute(
      'aria-label',
      embedded
        ? mobileText({ ru: 'Открыть игру отдельной страницей', en: 'Open game in a separate page' })
        : (isMobileFullscreenActive()
          ? mobileText({ ru: 'Выйти из полного экрана', en: 'Exit fullscreen' })
          : mobileText({ ru: 'Полный экран', en: 'Fullscreen' })),
    );
  };

  const setEnabled = (next: boolean): void => {
    enabled = next;
    root.toggleAttribute('hidden', !enabled);
    document.body.classList.toggle('mobile-controls-on', enabled);
    if (!enabled) clearTouchInput();
    updateSelectedLabel();
    updateFullscreenUi();
  };

  const refreshClasses = (): void => {
    const portrait = window.innerHeight > window.innerWidth;
    root.classList.toggle('is-started', context.started);
    root.classList.toggle('is-menu-open', context.menuOpen);
    root.classList.toggle('can-interact', context.canInteract);
    root.classList.toggle('is-game-over', context.gameOver);
    root.classList.toggle('is-portrait', portrait);
    updateLocalizedText();
    updateSelectedLabel();
    updateFullscreenUi();
  };

  const refresh = (): void => {
    setEnabled(shouldUseTouchControls());
    refreshClasses();
  };

  const resetPad = (kind: 'move' | 'look'): void => {
    if (kind === 'move') {
      input.touch.moveX = 0;
      input.touch.moveY = 0;
      moveThumb.style.transform = '';
      moveActive = false;
    } else {
      input.touch.lookX = 0;
      input.touch.lookY = 0;
      lookThumb.style.transform = '';
      lookActive = false;
    }
    updateTouchActive();
  };

  const updatePad = (el: HTMLElement, thumb: HTMLElement, kind: 'move' | 'look', e: PointerEvent): void => {
    const rect = el.getBoundingClientRect();
    const radius = Math.max(1, Math.min(rect.width, rect.height) * 0.42);
    const dx = e.clientX - (rect.left + rect.width * 0.5);
    const dy = e.clientY - (rect.top + rect.height * 0.5);
    const len = Math.hypot(dx, dy);
    const scale = len > radius ? radius / len : 1;
    const nx = (dx * scale) / radius;
    const ny = (dy * scale) / radius;
    thumb.style.transform = `translate(${nx * 34}%, ${ny * 34}%)`;
    if (kind === 'move') {
      input.touch.moveX = nx;
      input.touch.moveY = -ny;
      moveActive = true;
    } else {
      input.touch.lookX = nx;
      input.touch.lookY = ny;
      lookActive = true;
    }
    updateTouchActive();
  };

  const bindPad = (el: HTMLButtonElement, thumb: HTMLElement, kind: 'move' | 'look'): void => {
    const pointerDown = (e: PointerEvent): void => {
      if (!enabled || !context.started || context.menuOpen || context.gameOver) return;
      e.preventDefault();
      e.stopPropagation();
      options.onGesture();
      if (kind === 'move') movePointer = e.pointerId; else lookPointer = e.pointerId;
      capturePointer(el, e.pointerId);
      updatePad(el, thumb, kind, e);
    };
    const pointerMove = (e: PointerEvent): void => {
      const activePointer = kind === 'move' ? movePointer : lookPointer;
      if (e.pointerId !== activePointer) return;
      e.preventDefault();
      updatePad(el, thumb, kind, e);
    };
    const pointerEnd = (e: PointerEvent): void => {
      const activePointer = kind === 'move' ? movePointer : lookPointer;
      if (e.pointerId !== activePointer) return;
      e.preventDefault();
      releasePointer(el, e.pointerId);
      if (kind === 'move') movePointer = -1; else lookPointer = -1;
      resetPad(kind);
    };
    el.addEventListener('pointerdown', pointerDown);
    el.addEventListener('pointermove', pointerMove);
    el.addEventListener('pointerup', pointerEnd);
    el.addEventListener('pointercancel', pointerEnd);
    el.addEventListener('lostpointercapture', pointerEnd);
  };

  const holdInteractButton = (el: HTMLButtonElement): void => {
    let interactPointer = -1;
    el.addEventListener('pointerdown', e => {
      if (!enabled || !context.started) return;
      e.preventDefault();
      e.stopPropagation();
      options.onGesture();
      if (context.menuOpen) {
        options.onConfirm();
        return;
      }
      interactPointer = e.pointerId;
      capturePointer(el, e.pointerId);
      input.interact = true;
      input.interactHeld = true;
    });
    const pointerEnd = (e: PointerEvent): void => {
      if (e.pointerId !== interactPointer) return;
      e.preventDefault();
      releasePointer(el, e.pointerId);
      interactPointer = -1;
      input.interact = false;
      input.interactHeld = false;
    };
    el.addEventListener('pointerup', pointerEnd);
    el.addEventListener('pointercancel', pointerEnd);
    el.addEventListener('lostpointercapture', pointerEnd);
  };

  const actionNav = (dir: number): void => {
    options.onGesture();
    if (context.menuOpen) {
      pulse(dir < 0 ? 'invUp' : 'invDn');
    } else {
      selectedAction = (selectedAction + MOBILE_ACTIONS.length + dir) % MOBILE_ACTIONS.length;
      updateSelectedLabel();
    }
  };

  const actionConfirm = (e: PointerEvent): void => {
    options.onGesture();
    if (context.gameOver) {
      pulse('use');
    } else if (context.menuOpen) {
      options.onClose();
    } else {
      const action = MOBILE_ACTIONS[selectedAction];
      if (action.kind === 'menu') {
        options.onMenu(action.id);
      } else if (action.hold) {
        actionPointer = e.pointerId;
        heldActionInput = action.input;
        capturePointer(actionSelect, e.pointerId);
        setActionInput(action.input, true);
      } else {
        pulse(action.input);
      }
    }
  };

  bindPad(movePad, moveThumb, 'move');
  bindPad(lookPad, lookThumb, 'look');
  holdInteractButton(interact);

  fullscreen.addEventListener('pointerdown', e => {
    if (!enabled || isStandaloneDisplay()) return;
    e.preventDefault();
    e.stopPropagation();
    if (isEmbeddedViewport()) {
      options.onGesture();
      openStandalonePage();
      return;
    }
    if (!canUseMobileFullscreen()) return;
    if (isMobileFullscreenActive()) {
      options.onGesture();
      void exitMobileFullscreen().finally(updateFullscreenUi);
    } else {
      const pending = enterMobileFullscreen();
      options.onGesture();
      void pending.finally(updateFullscreenUi);
    }
  });

  fire.addEventListener('pointerdown', e => {
    if (!enabled || !context.started || context.menuOpen || context.gameOver) return;
    e.preventDefault();
    e.stopPropagation();
    options.onGesture();
    firePointer = e.pointerId;
    capturePointer(fire, e.pointerId);
    input.mouseAttack = true;
  });
  const endFire = (e: PointerEvent): void => {
    if (e.pointerId !== firePointer) return;
    e.preventDefault();
    releasePointer(fire, e.pointerId);
    firePointer = -1;
    input.mouseAttack = false;
  };
  fire.addEventListener('pointerup', endFire);
  fire.addEventListener('pointercancel', endFire);
  fire.addEventListener('lostpointercapture', endFire);

  actionUp.addEventListener('pointerdown', e => {
    if (!enabled || !context.started) return;
    e.preventDefault();
    e.stopPropagation();
    actionNav(-1);
  });
  actionDown.addEventListener('pointerdown', e => {
    if (!enabled || !context.started) return;
    e.preventDefault();
    e.stopPropagation();
    actionNav(1);
  });
  actionSelect.addEventListener('pointerdown', e => {
    if (!enabled || !context.started) return;
    e.preventDefault();
    e.stopPropagation();
    actionConfirm(e);
  });
  const actionEnd = (e: PointerEvent): void => {
    if (e.pointerId !== actionPointer) return;
    e.preventDefault();
    releasePointer(actionSelect, e.pointerId);
    releaseHeldAction();
  };
  actionSelect.addEventListener('pointerup', actionEnd);
  actionSelect.addEventListener('pointercancel', actionEnd);
  actionSelect.addEventListener('lostpointercapture', actionEnd);

  const onResize = (): void => refresh();
  window.addEventListener('resize', onResize);
  window.visualViewport?.addEventListener('resize', onResize);
  window.visualViewport?.addEventListener('scroll', onResize);
  document.addEventListener('fullscreenchange', onResize);
  document.addEventListener('webkitfullscreenchange', onResize);
  refresh();

  return {
    isEnabled: () => enabled,
    refresh,
    updateContext(next: MobileControlsContext): void {
      context = next;
      refreshClasses();
    },
    destroy(): void {
      for (const timer of pulseTimers.values()) clearTimeout(timer);
      window.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('scroll', onResize);
      document.removeEventListener('fullscreenchange', onResize);
      document.removeEventListener('webkitfullscreenchange', onResize);
      document.body.classList.remove('mobile-controls-on');
      root.remove();
    },
  };
}
