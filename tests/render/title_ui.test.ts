import test from 'node:test';
import assert from 'node:assert/strict';
import { hitTitleField, TitleLanguageHit } from '../../src/render/title_ui.js';

test('hitTitleField', async (t) => {
  await t.test('returns null when no hits are provided', () => {
    assert.equal(hitTitleField([], 0, 0), null);
  });

  await t.test('returns field when coordinates are exactly inside hit bounding box', () => {
    const hits: TitleLanguageHit[] = [
      { field: 'start', x: 10, y: 10, w: 100, h: 20 },
      { field: 'seed', x: 10, y: 40, w: 100, h: 20 }
    ];
    assert.equal(hitTitleField(hits, 15, 15), 'start');
    assert.equal(hitTitleField(hits, 10, 10), 'start');
    assert.equal(hitTitleField(hits, 110, 30), 'start');
    assert.equal(hitTitleField(hits, 15, 45), 'seed');
  });

  await t.test('returns null when coordinates are outside any hit bounding box', () => {
    const hits: TitleLanguageHit[] = [
      { field: 'start', x: 10, y: 10, w: 100, h: 20 },
    ];
    assert.equal(hitTitleField(hits, 5, 15), null); // too far left
    assert.equal(hitTitleField(hits, 115, 15), null); // too far right
    assert.equal(hitTitleField(hits, 50, 5), null); // too high
    assert.equal(hitTitleField(hits, 50, 35), null); // too low
  });

  await t.test('ignores hits without a field property', () => {
    const hits: TitleLanguageHit[] = [
      { id: 'en', x: 10, y: 10, w: 100, h: 20 } as TitleLanguageHit,
      { field: 'start', x: 10, y: 40, w: 100, h: 20 }
    ];
    assert.equal(hitTitleField(hits, 15, 15), null);
    assert.equal(hitTitleField(hits, 15, 45), 'start');
  });

  await t.test('returns first hit field if multiple hits overlap', () => {
    const hits: TitleLanguageHit[] = [
      { field: 'start', x: 10, y: 10, w: 100, h: 20 },
      { field: 'seed', x: 10, y: 10, w: 100, h: 20 }
    ];
    assert.equal(hitTitleField(hits, 15, 15), 'start');
  });
});
