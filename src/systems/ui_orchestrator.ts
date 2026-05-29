export interface UiElementDef {
  id: string;
  group: string;
  label: string;
  defaultEnabled: boolean;
  locked?: boolean;
}

export const UI_ELEMENT_DEFS = [
  { id: 'bottom_tabs', group: 'Основа', label: 'Нижние табы', defaultEnabled: true, locked: false },
  { id: 'weapon_panel', group: 'Бой', label: 'Оружие и инструмент', defaultEnabled: true, locked: false },
  { id: 'crosshair', group: 'Бой', label: 'Прицел и цель', defaultEnabled: true, locked: false },
  { id: 'interaction_prompt', group: 'Бой', label: 'Подсказка действия', defaultEnabled: true, locked: false },
  { id: 'damage_feedback', group: 'Опасность', label: 'Урон и сон', defaultEnabled: true, locked: true },
  { id: 'hazard_warning', group: 'Опасность', label: 'Предупреждения угроз', defaultEnabled: true, locked: false },
  { id: 'messages', group: 'Инфо', label: 'Стенографическая сводка', defaultEnabled: false, locked: false },
  { id: 'location_panel', group: 'Инфо', label: 'Время, зона, комната', defaultEnabled: false, locked: false },
  { id: 'minimap', group: 'Карта', label: 'Миникарта', defaultEnabled: true, locked: false },
  { id: 'route_hints', group: 'Навигация', label: 'Маршрут и VOID', defaultEnabled: false, locked: false },
  { id: 'caravan_hints', group: 'Навигация', label: 'Караванные метки', defaultEnabled: false, locked: false },
  { id: 'status_hints', group: 'Состояние', label: 'Статусы и мутации', defaultEnabled: false, locked: false },
  { id: 'anomaly_hints', group: 'Аномалии', label: 'Смог и аномальные индикаторы', defaultEnabled: false, locked: false },
  { id: 'fps_counter', group: 'Отладка', label: 'FPS в левом углу', defaultEnabled: false, locked: false },
  { id: 'screen_fx', group: 'Экран', label: 'Нейрошум и помехи', defaultEnabled: false, locked: false },
  { id: 'samosbor_text', group: 'Системное', label: 'Текст самосбора', defaultEnabled: true, locked: true },
  { id: 'credits', group: 'Системное', label: 'Титры и финальные экраны', defaultEnabled: true, locked: true },
] as const satisfies readonly UiElementDef[];

export type UiElementId = typeof UI_ELEMENT_DEFS[number]['id'];
export const MOUSE_LOOK_SENSITIVITY_DEFAULT = 1.3;
export const MOUSE_LOOK_SENSITIVITY_MIN = 0.5;
export const MOUSE_LOOK_SENSITIVITY_MAX = 2.5;
export const MOUSE_LOOK_SENSITIVITY_STEP = 0.1;
export const MOBILE_LOOK_SENSITIVITY_DEFAULT = 0.5;
export const MOBILE_LOOK_SENSITIVITY_MIN = 0.25;
export const MOBILE_LOOK_SENSITIVITY_MAX = 1.5;
export const MOBILE_LOOK_SENSITIVITY_STEP = 0.25;
export const CAMERA_FOV_DEFAULT_DEGREES = 90;
export const CAMERA_FOV_MIN_DEGREES = 60;
export const CAMERA_FOV_MAX_DEGREES = 110;
export const CAMERA_FOV_STEP_DEGREES = 5;

type UiSettings = Record<UiElementId, boolean> & {
  mouseLookSensitivity: number;
  mobileLookSensitivity: number;
  cameraFovDegrees: number;
};

export interface UiPresetDef {
  id: string;
  label: string;
  hint: string;
  enabled: readonly UiElementId[];
}

export const UI_PRESETS = [
  {
    id: 'off',
    label: 'Выкл всё',
    hint: 'Только обязательные системные сигналы.',
    enabled: [],
  },
  {
    id: 'novice',
    label: 'Новичок',
    hint: 'Первый запуск: бой, угрозы, миникарта и чистый экран.',
    enabled: [
      'bottom_tabs',
      'weapon_panel',
      'crosshair',
      'interaction_prompt',
      'damage_feedback',
      'hazard_warning',
      'minimap',
    ],
  },
  {
    id: 'minimal',
    label: 'Минимум',
    hint: 'Нижние показатели, действие и базовая опасность.',
    enabled: [
      'bottom_tabs',
      'interaction_prompt',
      'damage_feedback',
      'hazard_warning',
      'minimap',
    ],
  },
  {
    id: 'combat',
    label: 'Бой',
    hint: 'Оружие, прицел, урон и ближайшие угрозы.',
    enabled: [
      'bottom_tabs',
      'weapon_panel',
      'crosshair',
      'interaction_prompt',
      'damage_feedback',
      'hazard_warning',
      'messages',
      'minimap',
    ],
  },
  {
    id: 'route',
    label: 'Маршрут',
    hint: 'Лифты, маршрутные подсказки и базовая карта.',
    enabled: [
      'bottom_tabs',
      'interaction_prompt',
      'damage_feedback',
      'hazard_warning',
      'messages',
      'minimap',
      'route_hints',
    ],
  },
  {
    id: 'full',
    label: 'Полный',
    hint: 'Все игровые поверхности кроме отладки.',
    enabled: [
      'bottom_tabs',
      'weapon_panel',
      'crosshair',
      'interaction_prompt',
      'damage_feedback',
      'hazard_warning',
      'messages',
      'location_panel',
      'minimap',
      'route_hints',
      'caravan_hints',
      'status_hints',
      'anomaly_hints',
      'screen_fx',
    ],
  },
] as const satisfies readonly UiPresetDef[];

export type UiPresetId = typeof UI_PRESETS[number]['id'];
export const DEFAULT_UI_PRESET_ID: UiPresetId = 'novice';
export type UiSettingsView = 'interface' | 'graphics';

const MOBILE_SETTINGS_ROWS = [
  { kind: 'mobile_sensitivity', id: 'mobile_look_sensitivity', group: 'Мобилка', label: 'Чувствительность обзора' },
] as const;

const GRAPHICS_SETTINGS_ROWS = [
  { kind: 'camera_fov', id: 'camera_fov', group: 'Графика', label: 'FOV / угол обзора' },
] as const;

export type UiSettingsRow =
  | { kind: 'preset'; preset: typeof UI_PRESETS[number] }
  | { kind: 'element'; element: typeof UI_ELEMENT_DEFS[number] }
  | typeof GRAPHICS_SETTINGS_ROWS[number]
  | typeof MOBILE_SETTINGS_ROWS[number];

const UI_STORAGE_KEY = 'gigahrush_ui_orchestrator_v6';

const defsById = new Map<UiElementId, typeof UI_ELEMENT_DEFS[number]>(
  UI_ELEMENT_DEFS.map(def => [def.id, def]),
);
const presetsById = new Map<UiPresetId, typeof UI_PRESETS[number]>(
  UI_PRESETS.map(preset => [preset.id, preset]),
);

let settings = loadUiSettings();

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function settingsFromEnabledIds(enabledIds: readonly UiElementId[]): UiSettings {
  const enabled = new Set<UiElementId>(enabledIds);
  const out = {} as UiSettings;
  for (const def of UI_ELEMENT_DEFS) out[def.id] = def.locked || enabled.has(def.id);
  out.mouseLookSensitivity = MOUSE_LOOK_SENSITIVITY_DEFAULT;
  out.mobileLookSensitivity = MOBILE_LOOK_SENSITIVITY_DEFAULT;
  out.cameraFovDegrees = CAMERA_FOV_DEFAULT_DEGREES;
  return out;
}

function defaultUiSettings(): UiSettings {
  return settingsFromEnabledIds(presetsById.get(DEFAULT_UI_PRESET_ID)?.enabled ?? []);
}

function normalizeUiSettings(raw: unknown): UiSettings {
  const out = defaultUiSettings();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  const src = raw as Record<string, unknown>;
  for (const def of UI_ELEMENT_DEFS) {
    if (def.locked) {
      out[def.id] = true;
      continue;
    }
    const value = src[def.id];
    if (typeof value === 'boolean') out[def.id] = value;
  }
  out.mouseLookSensitivity = normalizeMouseLookSensitivity(src.mouseLookSensitivity);
  out.mobileLookSensitivity = normalizeMobileLookSensitivity(src.mobileLookSensitivity);
  out.cameraFovDegrees = normalizeCameraFovDegrees(src.cameraFovDegrees);
  return out;
}

function normalizeMouseLookSensitivity(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return MOUSE_LOOK_SENSITIVITY_DEFAULT;
  const clamped = Math.max(MOUSE_LOOK_SENSITIVITY_MIN, Math.min(MOUSE_LOOK_SENSITIVITY_MAX, value));
  const stepped = Math.round(clamped / MOUSE_LOOK_SENSITIVITY_STEP) * MOUSE_LOOK_SENSITIVITY_STEP;
  return Math.round(stepped * 100) / 100;
}

function mouseLookSensitivityStepIndex(value: number): number {
  const steps = Math.round((MOUSE_LOOK_SENSITIVITY_MAX - MOUSE_LOOK_SENSITIVITY_MIN) / MOUSE_LOOK_SENSITIVITY_STEP) + 1;
  const normalized = normalizeMouseLookSensitivity(value);
  return Math.max(0, Math.min(steps - 1, Math.round((normalized - MOUSE_LOOK_SENSITIVITY_MIN) / MOUSE_LOOK_SENSITIVITY_STEP)));
}

function normalizeMobileLookSensitivity(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return MOBILE_LOOK_SENSITIVITY_DEFAULT;
  const clamped = Math.max(MOBILE_LOOK_SENSITIVITY_MIN, Math.min(MOBILE_LOOK_SENSITIVITY_MAX, value));
  const stepped = Math.round(clamped / MOBILE_LOOK_SENSITIVITY_STEP) * MOBILE_LOOK_SENSITIVITY_STEP;
  return Math.round(stepped * 100) / 100;
}

function mobileLookSensitivityStepIndex(value: number): number {
  const steps = Math.round((MOBILE_LOOK_SENSITIVITY_MAX - MOBILE_LOOK_SENSITIVITY_MIN) / MOBILE_LOOK_SENSITIVITY_STEP) + 1;
  const normalized = normalizeMobileLookSensitivity(value);
  return Math.max(0, Math.min(steps - 1, Math.round((normalized - MOBILE_LOOK_SENSITIVITY_MIN) / MOBILE_LOOK_SENSITIVITY_STEP)));
}

function normalizeCameraFovDegrees(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return CAMERA_FOV_DEFAULT_DEGREES;
  const clamped = Math.max(CAMERA_FOV_MIN_DEGREES, Math.min(CAMERA_FOV_MAX_DEGREES, value));
  const stepped = Math.round(clamped / CAMERA_FOV_STEP_DEGREES) * CAMERA_FOV_STEP_DEGREES;
  return Math.round(stepped);
}

function cameraFovStepIndex(value: number): number {
  const steps = Math.round((CAMERA_FOV_MAX_DEGREES - CAMERA_FOV_MIN_DEGREES) / CAMERA_FOV_STEP_DEGREES) + 1;
  const normalized = normalizeCameraFovDegrees(value);
  return Math.max(0, Math.min(steps - 1, Math.round((normalized - CAMERA_FOV_MIN_DEGREES) / CAMERA_FOV_STEP_DEGREES)));
}

function loadUiSettings(): UiSettings {
  const s = storage();
  if (!s) return defaultUiSettings();
  try {
    return normalizeUiSettings(JSON.parse(s.getItem(UI_STORAGE_KEY) ?? 'null'));
  } catch {
    return defaultUiSettings();
  }
}

function saveUiSettings(): void {
  const s = storage();
  if (!s) return;
  try {
    s.setItem(UI_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // The in-memory settings still apply if browser storage is blocked.
  }
}

export function uiElementEnabled(id: UiElementId): boolean {
  const def = defsById.get(id);
  if (def?.locked) return true;
  return settings[id] ?? def?.defaultEnabled ?? false;
}

export function setUiElementEnabled(id: UiElementId, enabled: boolean): boolean {
  const def = defsById.get(id);
  if (!def) return false;
  if (def.locked) {
    settings[id] = true;
    saveUiSettings();
    return true;
  }
  settings[id] = enabled;
  saveUiSettings();
  return settings[id];
}

export function toggleUiElement(id: UiElementId): boolean {
  return setUiElementEnabled(id, !uiElementEnabled(id));
}

export function resetUiElement(id: UiElementId): boolean {
  const def = defsById.get(id);
  if (!def) return false;
  settings[id] = def.locked ? true : def.defaultEnabled;
  saveUiSettings();
  return settings[id];
}

export function resetUiSettings(): void {
  settings = defaultUiSettings();
  saveUiSettings();
}

export function applyUiPreset(id: UiPresetId): boolean {
  const preset = presetsById.get(id);
  if (!preset) return false;
  const mouseSensitivity = mouseLookSensitivity();
  const sensitivity = mobileLookSensitivity();
  const fov = cameraFovDegrees();
  settings = settingsFromEnabledIds(preset.enabled);
  settings.mouseLookSensitivity = mouseSensitivity;
  settings.mobileLookSensitivity = sensitivity;
  settings.cameraFovDegrees = fov;
  saveUiSettings();
  return true;
}

export function mouseLookSensitivity(): number {
  settings.mouseLookSensitivity = normalizeMouseLookSensitivity(settings.mouseLookSensitivity);
  return settings.mouseLookSensitivity;
}

export function adjustMouseLookSensitivity(deltaSteps: number): number {
  const steps = Math.round((MOUSE_LOOK_SENSITIVITY_MAX - MOUSE_LOOK_SENSITIVITY_MIN) / MOUSE_LOOK_SENSITIVITY_STEP) + 1;
  const current = mouseLookSensitivityStepIndex(mouseLookSensitivity());
  const next = Math.max(0, Math.min(steps - 1, current + Math.trunc(deltaSteps)));
  settings.mouseLookSensitivity = Math.round((MOUSE_LOOK_SENSITIVITY_MIN + next * MOUSE_LOOK_SENSITIVITY_STEP) * 100) / 100;
  saveUiSettings();
  return settings.mouseLookSensitivity;
}

export function resetMouseLookSensitivity(): number {
  settings.mouseLookSensitivity = MOUSE_LOOK_SENSITIVITY_DEFAULT;
  saveUiSettings();
  return settings.mouseLookSensitivity;
}

export function mobileLookSensitivity(): number {
  settings.mobileLookSensitivity = normalizeMobileLookSensitivity(settings.mobileLookSensitivity);
  return settings.mobileLookSensitivity;
}

export function adjustMobileLookSensitivity(deltaSteps: number): number {
  const steps = Math.round((MOBILE_LOOK_SENSITIVITY_MAX - MOBILE_LOOK_SENSITIVITY_MIN) / MOBILE_LOOK_SENSITIVITY_STEP) + 1;
  const current = mobileLookSensitivityStepIndex(mobileLookSensitivity());
  const next = (current + Math.trunc(deltaSteps) + steps) % steps;
  settings.mobileLookSensitivity = Math.round((MOBILE_LOOK_SENSITIVITY_MIN + next * MOBILE_LOOK_SENSITIVITY_STEP) * 100) / 100;
  saveUiSettings();
  return settings.mobileLookSensitivity;
}

export function resetMobileLookSensitivity(): number {
  settings.mobileLookSensitivity = MOBILE_LOOK_SENSITIVITY_DEFAULT;
  saveUiSettings();
  return settings.mobileLookSensitivity;
}

export function cameraFovDegrees(): number {
  settings.cameraFovDegrees = normalizeCameraFovDegrees(settings.cameraFovDegrees);
  return settings.cameraFovDegrees;
}

export function cameraFovRadians(): number {
  return cameraFovDegrees() * Math.PI / 180;
}

export function cameraPlaneLen(): number {
  return Math.tan(cameraFovRadians() * 0.5);
}

export function adjustCameraFov(deltaSteps: number): number {
  const steps = Math.round((CAMERA_FOV_MAX_DEGREES - CAMERA_FOV_MIN_DEGREES) / CAMERA_FOV_STEP_DEGREES) + 1;
  const current = cameraFovStepIndex(cameraFovDegrees());
  const next = (current + Math.trunc(deltaSteps) + steps) % steps;
  settings.cameraFovDegrees = CAMERA_FOV_MIN_DEGREES + next * CAMERA_FOV_STEP_DEGREES;
  saveUiSettings();
  return settings.cameraFovDegrees;
}

export function resetCameraFov(): number {
  settings.cameraFovDegrees = CAMERA_FOV_DEFAULT_DEGREES;
  saveUiSettings();
  return settings.cameraFovDegrees;
}

export function activeUiPresetId(): UiPresetId | undefined {
  for (const preset of UI_PRESETS) {
    const enabled = new Set<UiElementId>(preset.enabled);
    let matches = true;
    for (const def of UI_ELEMENT_DEFS) {
      if (def.locked) continue;
      if (uiElementEnabled(def.id) !== enabled.has(def.id)) {
        matches = false;
        break;
      }
    }
    if (matches) return preset.id;
  }
  return undefined;
}

export function uiSettingsRowCount(view: UiSettingsView = 'interface'): number {
  if (view === 'graphics') return GRAPHICS_SETTINGS_ROWS.length;
  return UI_PRESETS.length + UI_ELEMENT_DEFS.length + MOBILE_SETTINGS_ROWS.length;
}

export function uiSettingsRowAt(index: number, view: UiSettingsView = 'interface'): UiSettingsRow | undefined {
  if (index < 0) return undefined;
  if (view === 'graphics') return GRAPHICS_SETTINGS_ROWS[index];
  if (index < UI_PRESETS.length) return { kind: 'preset', preset: UI_PRESETS[index] };
  const element = UI_ELEMENT_DEFS[index - UI_PRESETS.length];
  if (element) return { kind: 'element', element };
  return MOBILE_SETTINGS_ROWS[index - UI_PRESETS.length - UI_ELEMENT_DEFS.length];
}
