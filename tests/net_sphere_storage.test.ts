import test from 'node:test';
import assert from 'node:assert/strict';
import { _test_storage } from '../src/systems/net_sphere.js';

test('net_sphere storage wrappers', async (t) => {
  await t.test('storageGet returns value if present', () => {
    const mockStorage = {
      getItem: (key: string) => (key === 'test' ? 'value' : null),
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      length: 1,
      key: () => null,
    } as unknown as Storage;
    assert.equal(_test_storage.storageGet(mockStorage, 'test'), 'value');
  });

  await t.test('storageGet returns empty string if value is null', () => {
    const mockStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      length: 0,
      key: () => null,
    } as unknown as Storage;
    assert.equal(_test_storage.storageGet(mockStorage, 'test'), '');
  });

  await t.test('storageGet returns empty string and catches error if storage throws', () => {
    const mockStorage = {
      getItem: () => {
        throw new Error('Access Denied');
      },
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      length: 0,
      key: () => null,
    } as unknown as Storage;
    assert.equal(_test_storage.storageGet(mockStorage, 'test'), '');
  });

  await t.test('storageSet catches error if storage throws', () => {
    const mockStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('Quota Exceeded');
      },
      removeItem: () => {},
      clear: () => {},
      length: 0,
      key: () => null,
    } as unknown as Storage;
    assert.doesNotThrow(() => {
      _test_storage.storageSet(mockStorage, 'test', 'value');
    });
  });

  await t.test('storageSet sets item if no error', () => {
    let setKey = '';
    let setValue = '';
    const mockStorage = {
      getItem: () => null,
      setItem: (key: string, value: string) => {
        setKey = key;
        setValue = value;
      },
      removeItem: () => {},
      clear: () => {},
      length: 0,
      key: () => null,
    } as unknown as Storage;
    _test_storage.storageSet(mockStorage, 'test', 'value');
    assert.equal(setKey, 'test');
    assert.equal(setValue, 'value');
  });
});
