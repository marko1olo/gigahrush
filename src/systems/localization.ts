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
const CYRILLIC_LETTER_RE = /[А-Яа-яЁё]/;
const LETTER_RE = /[A-Za-zА-Яа-яЁё]/;
const TEMPLATE_PLACEHOLDER_RE = /\$\{[^}]+\}|\{[A-Za-z_][A-Za-z0-9_]*\}/g;
const TRANSLATION_CACHE_LIMIT = 8192;
const COMPOSED_TEXT_MAX_LENGTH = 96;
const COMPOSED_MATCH_MAX_LENGTH = 48;
const COMPOSED_UNKNOWN_WORD_MAX = 28;
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

function applyTemplateRule(text: string, rule: TemplateRule, catalog: RuntimeCatalog): string | null {
  if (!text.includes(rule.anchor)) return null;
  const match = rule.regex.exec(text);
  if (!match) return null;

  let out = rule.translation;
  for (let i = 0; i < rule.placeholders.length; i++) {
    const value = match[i + 1] ?? '';
    const translatedValue = CYRILLIC_RE.test(value)
      ? (translateWithCatalog(value, catalog, 1) ?? value)
      : value;
    out = out.split(rule.placeholders[i]).join(translatedValue);
  }
  return out;
}

function isWordBoundary(text: string, index: number): boolean {
  if (index <= 0 || index >= text.length) return true;
  return !LETTER_RE.test(text[index - 1] ?? '') || !LETTER_RE.test(text[index] ?? '');
}

function exactTranslation(text: string, catalog: RuntimeCatalog): string | null {
  return catalog.exact.get(sourceKey(text)) ?? null;
}

function transliterateRussianWord(word: string): string {
  const pairs: Record<string, string> = {
    А: 'A', а: 'a',
    Б: 'B', б: 'b',
    В: 'V', в: 'v',
    Г: 'G', г: 'g',
    Д: 'D', д: 'd',
    Е: 'E', е: 'e',
    Ё: 'Yo', ё: 'yo',
    Ж: 'Zh', ж: 'zh',
    З: 'Z', з: 'z',
    И: 'I', и: 'i',
    Й: 'Y', й: 'y',
    К: 'K', к: 'k',
    Л: 'L', л: 'l',
    М: 'M', м: 'm',
    Н: 'N', н: 'n',
    О: 'O', о: 'o',
    П: 'P', п: 'p',
    Р: 'R', р: 'r',
    С: 'S', с: 's',
    Т: 'T', т: 't',
    У: 'U', у: 'u',
    Ф: 'F', ф: 'f',
    Х: 'Kh', х: 'kh',
    Ц: 'Ts', ц: 'ts',
    Ч: 'Ch', ч: 'ch',
    Ш: 'Sh', ш: 'sh',
    Щ: 'Shch', щ: 'shch',
    Ы: 'Y', ы: 'y',
    Э: 'E', э: 'e',
    Ю: 'Yu', ю: 'yu',
    Я: 'Ya', я: 'ya',
    Ь: '', ь: '',
    Ъ: '', ъ: '',
  };
  let out = '';
  for (const ch of Array.from(word)) out += pairs[ch] ?? ch;
  return out;
}

function canTransliterateUnknowns(text: string): boolean {
  if (text.length > 64 || /[,;:!?]/.test(text)) return false;
  const words = text.match(/[А-Яа-яЁё]+/g) ?? [];
  if (words.length === 0 || words.length > 5) return false;
  return words.every(word => /^[А-ЯЁ][А-Яа-яЁё]*$/.test(word));
}

function translateComposedText(text: string, catalog: RuntimeCatalog): string | null {
  if (text.length > COMPOSED_TEXT_MAX_LENGTH || !CYRILLIC_RE.test(text)) return null;

  const allowTransliteration = canTransliterateUnknowns(text);
  let out = '';
  let changed = false;
  let unresolvedCyrillic = false;

  for (let i = 0; i < text.length;) {
    const ch = text[i] ?? '';
    if (!CYRILLIC_LETTER_RE.test(ch) || !isWordBoundary(text, i)) {
      out += ch;
      i += 1;
      continue;
    }

    let bestEnd = -1;
    let bestTranslation = '';
    const maxEnd = Math.min(text.length, i + COMPOSED_MATCH_MAX_LENGTH);
    for (let end = maxEnd; end > i; end--) {
      if (!isWordBoundary(text, end)) continue;
      const candidate = text.slice(i, end).trimEnd();
      if (!candidate || !CYRILLIC_RE.test(candidate)) continue;
      const translated = exactTranslation(candidate, catalog);
      if (translated !== null) {
        bestEnd = i + candidate.length;
        bestTranslation = translated;
        break;
      }
    }

    if (bestEnd > i) {
      out += bestTranslation;
      i = bestEnd;
      changed = true;
      continue;
    }

    let wordEnd = i + 1;
    while (wordEnd < text.length && CYRILLIC_LETTER_RE.test(text[wordEnd] ?? '')) wordEnd++;
    const word = text.slice(i, wordEnd);
    if (allowTransliteration && word.length <= COMPOSED_UNKNOWN_WORD_MAX) {
      out += transliterateRussianWord(word);
      changed = true;
    } else {
      out += word;
      unresolvedCyrillic = true;
    }
    i = wordEnd;
  }

  if (!changed) return null;
  if (unresolvedCyrillic && CYRILLIC_RE.test(out)) return null;
  return out;
}

function translateTemplateText(text: string, catalog: RuntimeCatalog): string | null {
  for (const rule of catalog.templates) {
    const translated = applyTemplateRule(text, rule, catalog);
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

function translateDecoratedText(text: string, catalog: RuntimeCatalog, derived: boolean): string | null {
  const span = cyrillicSpan(text);
  if (!span || (span.start === 0 && span.end === text.length)) return null;

  const middle = text.slice(span.start, span.end);
  const translated = exactTranslation(middle, catalog)
    ?? (derived ? translateTemplateText(middle, catalog) : null)
    ?? (derived ? translateComposedText(middle, catalog) : null);
  return translated === null ? null : `${text.slice(0, span.start)}${translated}${text.slice(span.end)}`;
}

function translateWithCatalog(text: string, catalog: RuntimeCatalog | null, depth = 0): string | null {
  if (!catalog || !text || !CYRILLIC_RE.test(text)) return null;
  return exactTranslation(text, catalog)
    ?? translateDecoratedText(text, catalog, false)
    ?? translateTemplateText(text, catalog)
    ?? translateDecoratedText(text, catalog, true)
    ?? (depth < 2 ? translateComposedText(text, catalog) : null);
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
  const translated = translateWithCatalog(core, catalog);
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
