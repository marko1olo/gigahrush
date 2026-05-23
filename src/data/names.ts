/* ── NPC & monster name generation + freshNeeds ──────────────── */

import { Faction, type Needs } from '../core/types';

// ── Citizens: normal Russian names ───────────────────────────────
const CIT_M = ['Иван','Пётр','Алексей','Дмитрий','Сергей','Андрей','Николай','Михаил','Виктор','Олег','Григорий','Борис','Фёдор','Геннадий','Валерий','Юрий','Анатолий','Владимир','Константин','Евгений'];
const CIT_F = ['Мария','Анна','Елена','Ольга','Наталья','Татьяна','Ирина','Светлана','Людмила','Галина','Нина','Валентина','Екатерина','Лариса','Тамара','Зинаида','Раиса','Вера','Надежда','Любовь'];
const CIT_LAST_M = ['Иванов','Петров','Сидоров','Кузнецов','Попов','Васильев','Соколов','Михайлов','Новиков','Фёдоров','Морозов','Волков','Алексеев','Лебедев','Семёнов','Егоров','Павлов','Козлов','Степанов','Орлов'];
const CIT_LAST_F = ['Иванова','Петрова','Сидорова','Кузнецова','Попова','Васильева','Соколова','Михайлова','Новикова','Фёдорова','Морозова','Волкова','Алексеева','Лебедева','Семёнова','Егорова','Павлова','Козлова','Степанова','Орлова'];

// ── Liquidators: military ranks + surnames ───────────────────────
const LIQ_RANKS = ['Рядовой','Ефрейтор','Сержант','Ст. сержант','Лейтенант','Ст. лейтенант','Капитан','Майор','Подполковник','Полковник'];
const LIQ_LAST = ['Петренко','Бондаренко','Шевченко','Коваль','Мельник','Ткаченко','Гриценко','Кравченко','Олейник','Литвин','Сидорук','Бойко','Марченко','Поляков','Кравцов','Зайцев','Жук','Левченко','Руденко','Савченко'];

// ── Wild: nickname-based names ───────────────────────────────────
const WILD_M = ['Дима','Серый','Толик','Лёха','Колян','Жека','Саня','Вован','Макс','Костыль','Шурик','Борян'];
const WILD_F = ['Машка','Светка','Ленка','Танька','Наташка','Иришка','Зинка','Верка','Нинка','Анька'];
const WILD_NICK = ['Бетон','Шило','Гвоздь','Крыса','Дым','Штырь','Башка','Кирпич','Резак','Гайка','Труба','Ржавый','Шакал','Метла','Кабан','Цемент','Молот','Арматура','Пыль','Болт'];

// ── Cultists: eldritch names (adjective + noun) ─────────────────
const CULT_ADJ_M = ['Чёрный','Кровавый','Безглазый','Гнилый','Тёмный','Слепый','Пепельный','Утопший','Безмолвный','Ползый','Бетонный','Серебряный','Пустотный','Могильный','Хтоничный'];
const CULT_ADJ_F = ['Чёрная','Кровавая','Безглазая','Гнилая','Тёмная','Слепая','Пепельная','Утопшая','Безмолвная','Ползая','Бетонная','Серебряная','Пустотная','Могильная','Хтоничная'];
const CULT_NOUN_M = ['Идол','Коготь','Скрежет','Червь','Столп','Глаз','Рот','Клык','Зов','Дым','Прах','Камень','Шёпот','Голод'];
const CULT_NOUN_F = ['Гниль','Тень','Плоть','Яма','Пасть','Бездна','Жила','Завеса','Мгла','Тишь','Язва','Пелена','Дыра'];

function _pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

export interface NameResult { name: string; female: boolean; }

export function randomName(faction?: Faction): NameResult {
  switch (faction) {
    case Faction.LIQUIDATOR: {
      const rank = _pick(LIQ_RANKS);
      const last = _pick(LIQ_LAST);
      return { name: `${rank} ${last}`, female: false };
    }
    case Faction.WILD: {
      const female = Math.random() < 0.35;
      const first = female ? _pick(WILD_F) : _pick(WILD_M);
      const nick = _pick(WILD_NICK);
      return { name: `${first} «${nick}»`, female };
    }
    case Faction.CULTIST: {
      const female = Math.random() < 0.5;
      const adj = _pick(female ? CULT_ADJ_F : CULT_ADJ_M);
      const noun = female ? _pick(CULT_NOUN_F) : _pick(CULT_NOUN_M);
      return { name: `${adj} ${noun}`, female };
    }
    default: {
      const female = Math.random() < 0.5;
      const first = female ? _pick(CIT_F) : _pick(CIT_M);
      const last = _pick(female ? CIT_LAST_F : CIT_LAST_M);
      return { name: `${first} ${last}`, female };
    }
  }
}

// ── Helper: свежие потребности для NPC ───────────────────────────
export function freshNeeds(): Needs {
  return { food: 70 + Math.random() * 30, water: 70 + Math.random() * 30, sleep: 60 + Math.random() * 40, pee: Math.random() * 30, poo: Math.random() * 20 };
}
