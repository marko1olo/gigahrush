import { test } from "node:test";
import * as assert from "node:assert/strict";
import {
  seededRandom,
  withSeededRandom,
  xorshift32,
  SeedRng,
  randSeed,
  irand,
  irandFrom,
  pickFrom,
  shuffleWith,
  hashSeed,
  secureRandom,
} from "../src/core/rand";

test("seededRandom produces deterministic values when overriding Math.random", () => {
  const originalRandom = Math.random;

  try {
    const seed = 12345;
    const rng = seededRandom(seed);

    // Assign to Math.random to verify deterministic values can be consumed from Math.random
    Math.random = rng;

    const val1_1 = Math.random();
    const val1_2 = Math.random();

    assert.notEqual(val1_1, val1_2, "Successive values should differ");

    const rng2 = seededRandom(seed);
    Math.random = rng2;

    const val2_1 = Math.random();
    const val2_2 = Math.random();

    assert.equal(
      val1_1,
      val2_1,
      "First random value should match for same seed",
    );
    assert.equal(
      val1_2,
      val2_2,
      "Second random value should match for same seed",
    );
  } finally {
    Math.random = originalRandom;
  }
});

test("withSeededRandom overwrites and restores Math.random", () => {
  const originalRandom = Math.random;

  const seed = 54321;
  const values1: number[] = [];

  withSeededRandom(seed, () => {
    assert.notEqual(
      Math.random,
      originalRandom,
      "Math.random should be overridden",
    );
    values1.push(Math.random());
    values1.push(Math.random());
  });

  assert.equal(
    Math.random,
    originalRandom,
    "Math.random should be restored after execution",
  );

  const values2: number[] = [];
  withSeededRandom(seed, () => {
    values2.push(Math.random());
    values2.push(Math.random());
  });

  assert.deepEqual(
    values1,
    values2,
    "Math.random should produce deterministic values under the same seed",
  );
});

test("withSeededRandom restores Math.random even if an error is thrown", () => {
  const originalRandom = Math.random;
  const seed = 999;

  assert.throws(() => {
    withSeededRandom(seed, () => {
      assert.notEqual(
        Math.random,
        originalRandom,
        "Math.random should be overridden",
      );
      throw new Error("Test error");
    });
  }, /Test error/);

  assert.equal(
    Math.random,
    originalRandom,
    "Math.random should be restored even after error",
  );
});

test("xorshift32 produces deterministic pseudo-random values", () => {
  const rng1 = xorshift32(123);
  const rng2 = xorshift32(123);
  const rng3 = xorshift32(456);

  const val1_1 = rng1();
  const val1_2 = rng1();

  const val2_1 = rng2();
  const val2_2 = rng2();

  const val3_1 = rng3();

  assert.equal(val1_1, val2_1, "Same seed should produce same first value");
  assert.equal(val1_2, val2_2, "Same seed should produce same second value");
  assert.notEqual(
    val1_1,
    val3_1,
    "Different seeds should generally produce different values",
  );

  assert.ok(val1_1 >= 0 && val1_1 < 1, "Value should be in range [0, 1)");
  assert.ok(val1_2 >= 0 && val1_2 < 1, "Value should be in range [0, 1)");
});

test("SeedRng produces deterministic state and methods behave correctly", () => {
  const rng1 = new SeedRng(999);
  const rng2 = new SeedRng(999);

  assert.equal(rng1.seed, 999, "Seed should be exposed");

  assert.equal(
    rng1.nextU32(),
    rng2.nextU32(),
    "nextU32 should be deterministic",
  );
  assert.equal(rng1.random(), rng2.random(), "random should be deterministic");

  const rng3 = new SeedRng(12345);
  const intVal = rng3.int(10, 20);
  assert.ok(intVal >= 10 && intVal <= 20, "int should respect bounds");
  assert.ok(Number.isInteger(intVal), "int should be an integer");

  const floatVal = rng3.float(5.5, 10.5);
  assert.ok(floatVal >= 5.5 && floatVal < 10.5, "float should respect bounds");

  // Chance
  const rng4 = new SeedRng(111);
  const chances = [rng4.chance(0.5), rng4.chance(0.5), rng4.chance(0.5)];
  assert.ok(
    chances.some((c) => c === true) || chances.some((c) => c === false),
    "chance should return boolean",
  ); // Just a sanity check it returns bools

  assert.equal(rng4.chance(0), false, "chance(0) is always false");
  assert.equal(rng4.chance(1), true, "chance(1) is always true");

  // Pick
  const rng5 = new SeedRng(222);
  const items = ["a", "b", "c", "d"];
  const picked = rng5.pick(items);
  assert.ok(
    items.includes(picked),
    "pick should return an element from the array",
  );

  // Shuffle
  const rng6 = new SeedRng(333);
  const originalItems = [1, 2, 3, 4, 5];
  const shuffledItems = rng6.shuffle([...originalItems]);

  assert.equal(
    shuffledItems.length,
    originalItems.length,
    "shuffle should not change array length",
  );
  assert.notDeepEqual(
    shuffledItems,
    originalItems,
    "shuffle should (usually) change element order",
  );
  assert.deepEqual(
    [...shuffledItems].sort(),
    [...originalItems].sort(),
    "shuffle should retain all elements",
  );
});

test("randSeed produces a value in [0, 99999) using Math.random", () => {
  const originalRandom = Math.random;
  try {
    Math.random = () => 0; // Minimum possible
    assert.equal(randSeed(), 0, "Should be 0 when Math.random is 0");

    Math.random = () => 0.9999999999999999; // Maximum possible (<1)
    assert.equal(
      randSeed(),
      99998,
      "Should be 99998 when Math.random is close to 1",
    );
  } finally {
    Math.random = originalRandom;
  }
});

test("irand produces an inclusive integer in [a, b] using Math.random", () => {
  const originalRandom = Math.random;
  try {
    Math.random = () => 0;
    assert.equal(
      irand(5, 10),
      5,
      "Should be lower bound when Math.random is 0",
    );

    Math.random = () => 0.9999999999999999;
    assert.equal(
      irand(5, 10),
      10,
      "Should be upper bound when Math.random is close to 1",
    );

    Math.random = () => 0.5;
    assert.equal(
      irand(5, 10),
      8,
      "Should be in middle when Math.random is 0.5",
    ); // 5 + floor(0.5 * 6) = 5 + 3 = 8
  } finally {
    Math.random = originalRandom;
  }
});

test("irandFrom produces an inclusive integer in [a, b] from a RandomSource", () => {
  const rand0 = () => 0;
  assert.equal(
    irandFrom(rand0, 5, 10),
    5,
    "Should be lower bound when source is 0",
  );

  const randMax = () => 0.9999999999999999;
  assert.equal(
    irandFrom(randMax, 5, 10),
    10,
    "Should be upper bound when source is close to 1",
  );

  const randMid = () => 0.5;
  assert.equal(
    irandFrom(randMid, 5, 10),
    8,
    "Should be in middle when source is 0.5",
  );
});

test("pickFrom picks an element using a RandomSource", () => {
  const items = ["a", "b", "c", "d"];

  const rand0 = () => 0;
  assert.equal(
    pickFrom(rand0, items),
    "a",
    "Should pick first item when source is 0",
  );

  const randMax = () => 0.9999999999999999;
  assert.equal(
    pickFrom(randMax, items),
    "d",
    "Should pick last item when source is close to 1",
  );

  const randMid = () => 0.5;
  assert.equal(
    pickFrom(randMid, items),
    "c",
    "Should pick middle item when source is 0.5",
  ); // floor(0.5 * 4) = 2 -> 'c'
});

test("shuffleWith shuffles an array using a RandomSource", () => {
  // Use a predictable pseudo-random generator
  const rng1 = xorshift32(111);
  const arr1 = [1, 2, 3, 4, 5];
  const shuffled1 = shuffleWith(rng1, [...arr1]);

  const rng2 = xorshift32(111);
  const arr2 = [1, 2, 3, 4, 5];
  const shuffled2 = shuffleWith(rng2, [...arr2]);

  assert.deepEqual(
    shuffled1,
    shuffled2,
    "Should shuffle deterministically with same source",
  );

  // Basic shuffle checks
  assert.equal(shuffled1.length, arr1.length, "Length should be unchanged");
  assert.deepEqual(
    [...shuffled1].sort(),
    [...arr1].sort(),
    "Elements should be unchanged",
  );
});

test("hashSeed generates a stable 32-bit hash for a string and seed", () => {
  const hash1 = hashSeed("hello world", 0);
  const hash2 = hashSeed("hello world", 0);
  const hash3 = hashSeed("hello world", 123);
  const hash4 = hashSeed("different text", 0);

  assert.equal(
    hash1,
    hash2,
    "Hash should be deterministic for same string and seed",
  );
  assert.notEqual(hash1, hash3, "Hash should differ for different seeds");
  assert.notEqual(hash1, hash4, "Hash should differ for different strings");

  assert.ok(Number.isInteger(hash1), "Hash should be an integer");
  assert.ok(
    hash1 >= 0 && hash1 <= 4294967295,
    "Hash should be a 32-bit unsigned integer",
  );
});

test("secureRandom generates a cryptographic random float in [0, 1)", () => {
  // Store the original global crypto to restore it later
  const originalCrypto = global.crypto;

  try {
    // Mock crypto.getRandomValues
    let mockValues: number[] = [];
    Object.defineProperty(globalThis, "crypto", {
      value: {
        getRandomValues: (array: Uint32Array) => {
          if (mockValues.length > 0) {
            array[0] = mockValues.shift()!;
          }
          return array;
        },
      },
      writable: true,
      configurable: true,
    });

    // Test with 0
    mockValues = [0];
    assert.equal(
      secureRandom(),
      0,
      "Should return 0 when getRandomValues sets 0",
    );

    // Test with max uint32
    mockValues = [4294967295];
    const val = secureRandom();
    assert.ok(
      val > 0.9999999 && val < 1,
      "Should return near 1 when getRandomValues sets max uint32",
    );

    // Test with middle value
    mockValues = [2147483648];
    assert.equal(
      secureRandom(),
      0.5,
      "Should return 0.5 when getRandomValues sets half max uint32",
    );
  } finally {
    global.crypto = originalCrypto;
  }
});
