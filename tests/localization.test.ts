import assert from 'node:assert/strict';
import test from 'node:test';
import { setLocalizationLanguage, translateText } from '../src/systems/localization';

test('localization translates exact, decorated and templated Russian UI text', () => {
  setLocalizationLanguage('en');
  assert.equal(translateText('Продолжить'), 'Continue');
  assert.equal(translateText('▶ Продолжить'), '▶ Continue');
  assert.equal(translateText('Снято 45 руб.'), 'Withdrew 45 rub.');
});

test('localization keeps Russian text when Russian is active', () => {
  setLocalizationLanguage('ru');
  assert.equal(translateText('Продолжить'), 'Продолжить');
});
