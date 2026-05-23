import { type TitleLanguageId } from '../data/languages';

type RuntimeLocaleCatalogData = readonly [
  readonly (readonly [string, string])[],
  readonly (readonly [string, string])[],
];

interface TemplateRule {
  anchor: string;
  regex: RegExp;
  placeholders: string[];
  translation: string;
}

interface RuntimeCatalog {
  exact: Map<string, string>;
  templates: TemplateRule[];
}

declare global {
  // Injected by Vite as a compact runtime-only catalog. Node tests use the tiny fallback below.
  var __GIGAHRUSH_EN_LOCALE__: RuntimeLocaleCatalogData | undefined;
}

const CYRILLIC_RE = /[А-Яа-яЁё]/;
const CYRILLIC_GLOBAL_RE = /[А-Яа-яЁё]/g;
const TEMPLATE_PLACEHOLDER_RE = /\$\{[^}]+\}/g;
const TRANSLATION_CACHE_LIMIT = 8192;
const FALLBACK_EN_LOCALE: RuntimeLocaleCatalogData = [
  [
    ['1kpmy5f', 'Continue'],
  ],
  [
    ['Снято ${moved} руб.', 'Withdrew ${moved} rub.'],
  ],
];

let activeLanguage: TitleLanguageId = 'ru';
let englishCatalog: RuntimeCatalog | null = null;
let canvasLocalizationInstalled = false;
const translationCache = new Map<string, string>();

function sourceKey(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function splitTemplateSource(source: string): { parts: string[]; placeholders: string[] } {
  const parts: string[] = [];
  const placeholders: string[] = [];
  let last = 0;
  TEMPLATE_PLACEHOLDER_RE.lastIndex = 0;
  for (const match of source.matchAll(TEMPLATE_PLACEHOLDER_RE)) {
    parts.push(source.slice(last, match.index));
    placeholders.push(match[0]);
    last = (match.index ?? 0) + match[0].length;
  }
  parts.push(source.slice(last));
  return { parts, placeholders };
}

function templateAnchor(parts: readonly string[]): string {
  let best = '';
  for (const part of parts) {
    const clean = part.replace(/\s+/g, ' ').trim();
    if (CYRILLIC_RE.test(clean) && clean.length > best.length) best = clean;
  }
  return best;
}

function compileTemplateRule(source: string, translation: string): TemplateRule | null {
  const { parts, placeholders } = splitTemplateSource(source);
  if (placeholders.length === 0) return null;
  const anchor = templateAnchor(parts);
  if (!anchor) return null;

  let pattern = '^';
  for (let i = 0; i < placeholders.length; i++) {
    pattern += escapeRegExp(parts[i]) + '([\\s\\S]*?)';
  }
  pattern += escapeRegExp(parts[parts.length - 1]) + '$';

  return {
    anchor,
    regex: new RegExp(pattern),
    placeholders,
    translation,
  };
}

function runtimeEnglishLocaleData(): RuntimeLocaleCatalogData {
  return globalThis.__GIGAHRUSH_EN_LOCALE__ ?? FALLBACK_EN_LOCALE;
}

function buildEnglishCatalog(): RuntimeCatalog {
  const data = runtimeEnglishLocaleData();
  const exact = new Map<string, string>(data[0]);
  const templates: TemplateRule[] = [];
  const templateData = data[1];

  for (const [source, translation] of templateData) {
    const rule = compileTemplateRule(source, translation);
    if (rule) templates.push(rule);
  }

  templates.sort((a, b) => b.anchor.length - a.anchor.length);
  return { exact, templates };
}

function catalogForActiveLanguage(): RuntimeCatalog | null {
  if (activeLanguage === 'ru') return null;
  englishCatalog ??= buildEnglishCatalog();
  return englishCatalog;
}

function applyTemplateRule(text: string, rule: TemplateRule): string | null {
  if (!text.includes(rule.anchor)) return null;
  const match = rule.regex.exec(text);
  if (!match) return null;

  let out = rule.translation;
  for (let i = 0; i < rule.placeholders.length; i++) {
    out = out.split(rule.placeholders[i]).join(match[i + 1] ?? '');
  }
  return out;
}

function translateCore(text: string, catalog: RuntimeCatalog): string | null {
  const exact = catalog.exact.get(sourceKey(text));
  if (exact !== undefined) return exact;

  for (const rule of catalog.templates) {
    const translated = applyTemplateRule(text, rule);
    if (translated !== null) return translated;
  }

  return null;
}

function cyrillicSpan(text: string): { start: number; end: number } | null {
  CYRILLIC_GLOBAL_RE.lastIndex = 0;
  let first = -1;
  let last = -1;
  for (const match of text.matchAll(CYRILLIC_GLOBAL_RE)) {
    const index = match.index ?? -1;
    if (first < 0) first = index;
    last = index;
  }
  return first >= 0 && last >= first ? { start: first, end: last + 1 } : null;
}

function translateDecoratedText(text: string, catalog: RuntimeCatalog): string | null {
  const span = cyrillicSpan(text);
  if (!span || (span.start === 0 && span.end === text.length)) return null;

  const middle = text.slice(span.start, span.end);
  const translated = translateCore(middle, catalog);
  return translated === null ? null : `${text.slice(0, span.start)}${translated}${text.slice(span.end)}`;
}

export function setLocalizationLanguage(id: TitleLanguageId): void {
  activeLanguage = id === 'en' ? 'en' : 'ru';
  translationCache.clear();
}

export function getLocalizationLanguage(): TitleLanguageId {
  return activeLanguage;
}

export function translateText(input: string): string {
  const catalog = catalogForActiveLanguage();
  if (!catalog || !input || !CYRILLIC_RE.test(input)) return input;

  const cached = translationCache.get(input);
  if (cached !== undefined) return cached;

  const leading = input.match(/^\s*/)?.[0] ?? '';
  const trailing = input.match(/\s*$/)?.[0] ?? '';
  const core = input.slice(leading.length, input.length - trailing.length);
  const translated = translateCore(core, catalog) ?? translateDecoratedText(core, catalog);
  const out = translated === null ? input : `${leading}${translated}${trailing}`;

  if (translationCache.size >= TRANSLATION_CACHE_LIMIT) translationCache.clear();
  translationCache.set(input, out);
  return out;
}

function localizedCanvasText(value: unknown): string {
  return translateText(String(value));
}

export function installCanvasLocalization(): void {
  if (canvasLocalizationInstalled || typeof CanvasRenderingContext2D === 'undefined') return;
  canvasLocalizationInstalled = true;

  const proto = CanvasRenderingContext2D.prototype;
  const fillText = proto.fillText;
  const strokeText = proto.strokeText;
  const measureText = proto.measureText;

  proto.fillText = function localizedFillText(
    text: string,
    x: number,
    y: number,
    maxWidth?: number,
  ): void {
    if (maxWidth === undefined) fillText.call(this, localizedCanvasText(text), x, y);
    else fillText.call(this, localizedCanvasText(text), x, y, maxWidth);
  };

  proto.strokeText = function localizedStrokeText(
    text: string,
    x: number,
    y: number,
    maxWidth?: number,
  ): void {
    if (maxWidth === undefined) strokeText.call(this, localizedCanvasText(text), x, y);
    else strokeText.call(this, localizedCanvasText(text), x, y, maxWidth);
  };

  proto.measureText = function localizedMeasureText(text: string): TextMetrics {
    return measureText.call(this, localizedCanvasText(text));
  };
}
