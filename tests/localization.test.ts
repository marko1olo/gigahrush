import assert from 'node:assert/strict';
import test from 'node:test';
import { setLocalizationLanguage, translateText } from '../src/systems/localization';

function sourceKey(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

function exact(source: string, translation: string): [string, string] {
  return [sourceKey(source), translation];
}

globalThis.__GIGAHRUSH_EN_LOCALE__ = [
  [
    exact('Продолжить', 'Continue'),
    exact('Иван', 'Ivan'),
    exact('Петрова', 'Petrova'),
    exact('Чёрный', 'Black'),
    exact('Идол', 'Idol'),
    exact('Этаж 69: работница', 'Floor 69: worker'),
    exact('на северо-востоке', 'to the north-east'),
  ],
  [
    ['Снято ${moved} руб.', 'Withdrew ${moved} rub.'],
    ['${value} руб.', '${value} rub.'],
    ['Сумма: ${money}', 'Amount: ${money}'],
    ['${name} вписан в ведомость.', '${name} was entered in the roster.'],
    ['Этаж ${label}', 'Floor ${label}'],
    ['Найди его {dir}.', 'Find him {dir}.'],
  ],
];

test('localization translates exact, decorated and templated Russian UI text', () => {
  setLocalizationLanguage('en');
  assert.equal(translateText('Продолжить'), 'Continue');
  assert.equal(translateText('▶ Продолжить'), '▶ Continue');
  assert.equal(translateText('Снято 45 руб.'), 'Withdrew 45 rub.');
});

test('localization translates composed procedural names and template values', () => {
  setLocalizationLanguage('en');
  assert.equal(translateText('Иван Петрова'), 'Ivan Petrova');
  assert.equal(translateText('Чёрный Идол'), 'Black Idol');
  assert.equal(translateText('Сумма: 45 руб.'), 'Amount: 45 rub.');
  assert.equal(translateText('Иван Петрова вписан в ведомость.'), 'Ivan Petrova was entered in the roster.');
});

test('localization prefers specific decorated procedural names over broad templates', () => {
  setLocalizationLanguage('en');
  assert.equal(translateText('Этаж 69: работница 12'), 'Floor 69: worker 12');
});

test('localization handles authored brace placeholders with generated directions', () => {
  setLocalizationLanguage('en');
  assert.equal(translateText('Найди его на северо-востоке.'), 'Find him to the north-east.');
});

test('localization keeps Russian text when Russian is active', () => {
  setLocalizationLanguage('ru');
  assert.equal(translateText('Продолжить'), 'Продолжить');
});
