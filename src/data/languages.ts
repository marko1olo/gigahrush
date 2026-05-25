export type TitleLanguageId = 'ru' | 'en';
export type TitleFlagKind = 'soviet' | 'british_empire';

export interface TitleLanguageDef {
  id: TitleLanguageId;
  code: string;
  name: string;
  title: string;
  subtitle: string;
  nameLabel: string;
  namePlaceholder: string;
  seedLabel: string;
  seedPlaceholder: string;
  startPrompt: string;
  languageHint: string;
  mobileHint: string;
  desktopHint: (move: string, interact: string) => string;
  desktopCombatHint: (attack: string, fullscreen: string, controls: string, ui: string) => string;
  flag: TitleFlagKind;
}

export const TITLE_LANGUAGES: readonly TitleLanguageDef[] = [
  {
    id: 'ru',
    code: 'RU',
    name: 'Русский',
    title: 'ГИГАХРУЩ',
    subtitle: 'бесконечный бетонный лабиринт',
    nameLabel: 'НЕТ-ИМЯ',
    namePlaceholder: 'введите имя',
    seedLabel: 'СИД',
    seedPlaceholder: 'пусто = случайный',
    startPrompt: 'Введите имя и нажмите ENTER',
    languageHint: 'TAB поле  |  ←/→ язык',
    mobileHint: 'Тап — начать  |  ДЕЙСТ — действие  |  КАРТ/ЗАД/UI — рельса',
    desktopHint: (move, interact) => `Клик захватывает курсор перед стартом  |  ${move} — движение  |  ${interact} — действие`,
    desktopCombatHint: (attack, fullscreen, controls, ui) => `ЛКМ/${attack} — атака  |  ${fullscreen} — полный экран  |  ${controls} — клавиши  |  ${ui} — интерфейс`,
    flag: 'soviet',
  },
  {
    id: 'en',
    code: 'ENG',
    name: 'English',
    title: 'GIGAHRUSH',
    subtitle: 'endless concrete labyrinth',
    nameLabel: 'NET-NAME',
    namePlaceholder: 'enter name',
    seedLabel: 'SEED',
    seedPlaceholder: 'blank = random',
    startPrompt: 'Enter name and press ENTER',
    languageHint: 'TAB field  |  ←/→ language',
    mobileHint: 'Tap — start  |  ACT — interact  |  MAP/QUEST/UI — rail',
    desktopHint: (move, interact) => `Click captures cursor before start  |  ${move} — move  |  ${interact} — action`,
    desktopCombatHint: (attack, fullscreen, controls, ui) => `LMB/${attack} — attack  |  ${fullscreen} — fullscreen  |  ${controls} — keys  |  ${ui} — interface`,
    flag: 'british_empire',
  },
];

export function normalizeTitleLanguageId(value: unknown): TitleLanguageId {
  return TITLE_LANGUAGES.some(def => def.id === value) ? value as TitleLanguageId : 'ru';
}

export function titleLanguageDef(id: TitleLanguageId): TitleLanguageDef {
  return TITLE_LANGUAGES.find(def => def.id === id) ?? TITLE_LANGUAGES[0];
}

export function nextTitleLanguageId(id: TitleLanguageId, dir: number): TitleLanguageId {
  const current = TITLE_LANGUAGES.findIndex(def => def.id === id);
  const start = current >= 0 ? current : 0;
  const next = (start + TITLE_LANGUAGES.length + Math.sign(dir || 1)) % TITLE_LANGUAGES.length;
  return TITLE_LANGUAGES[next].id;
}
