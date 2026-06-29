import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { scarcityBand } from '../../src/render/economy_ui';

describe('scarcityBand', () => {
  it('returns КРИЗИС for multiplier >= 2.05', () => {
    assert.deepEqual(scarcityBand(2.05), { label: 'КРИЗИС', short: 'КРЗ', color: '#f55' });
    assert.deepEqual(scarcityBand(3.0), { label: 'КРИЗИС', short: 'КРЗ', color: '#f55' });
  });

  it('returns ДЕФИЦИТ for multiplier >= 1.35 and < 2.05', () => {
    assert.deepEqual(scarcityBand(1.35), { label: 'ДЕФИЦИТ', short: 'ДФЦ', color: '#fa4' });
    assert.deepEqual(scarcityBand(2.04), { label: 'ДЕФИЦИТ', short: 'ДФЦ', color: '#fa4' });
  });

  it('returns НАПРЯЖ. for multiplier >= 1.12 and < 1.35', () => {
    assert.deepEqual(scarcityBand(1.12), { label: 'НАПРЯЖ.', short: 'НАП', color: '#dda64a' });
    assert.deepEqual(scarcityBand(1.34), { label: 'НАПРЯЖ.', short: 'НАП', color: '#dda64a' });
  });

  it('returns ИЗБЫТОК for multiplier <= 0.72', () => {
    assert.deepEqual(scarcityBand(0.72), { label: 'ИЗБЫТОК', short: 'ИЗБ', color: '#6cf' });
    assert.deepEqual(scarcityBand(0.5), { label: 'ИЗБЫТОК', short: 'ИЗБ', color: '#6cf' });
  });

  it('returns ЗАПАС for multiplier <= 0.88 and > 0.72', () => {
    assert.deepEqual(scarcityBand(0.88), { label: 'ЗАПАС', short: 'ЗАП', color: '#8cf' });
    assert.deepEqual(scarcityBand(0.73), { label: 'ЗАПАС', short: 'ЗАП', color: '#8cf' });
  });

  it('returns НОРМА for multiplier between 0.88 and 1.12', () => {
    assert.deepEqual(scarcityBand(1.0), { label: 'НОРМА', short: 'НОР', color: '#8a8' });
    assert.deepEqual(scarcityBand(0.89), { label: 'НОРМА', short: 'НОР', color: '#8a8' });
    assert.deepEqual(scarcityBand(1.11), { label: 'НОРМА', short: 'НОР', color: '#8a8' });
  });

  it('returns НОРМА for non-finite multipliers', () => {
    assert.deepEqual(scarcityBand(NaN), { label: 'НОРМА', short: 'НОР', color: '#8a8' });
    assert.deepEqual(scarcityBand(Infinity), { label: 'НОРМА', short: 'НОР', color: '#8a8' });
    assert.deepEqual(scarcityBand(-Infinity), { label: 'НОРМА', short: 'НОР', color: '#8a8' });
  });
});
