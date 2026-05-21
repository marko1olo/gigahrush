/* ── Tiny shared randomness utilities ─────────────────────────── */
/*   Use these instead of inlining `Math.floor(Math.random()*…)`. */
/*   Keeps call-sites short and search-friendly.                  */

/** Random non-negative integer seed in [0, 99999), suitable for
 *  decals, mark stamping and other procedural variation. */
export function randSeed(): number {
  return Math.floor(Math.random() * 99999);
}

/** Inclusive integer in [a, b]. */
export function irand(a: number, b: number): number {
  return a + Math.floor(Math.random() * (b - a + 1));
}

/** Stable 32-bit hash for string ids and procedural route keys. */
export function hashSeed(text: string, seed = 0): number {
  let h = (0x811c9dc5 ^ seed) >>> 0;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** Tiny deterministic PRNG, suitable for generation-time choices. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Run Math.random-based generators under a local deterministic seed. */
export function withSeededRandom<T>(seed: number, fn: () => T): T {
  const oldRandom = Math.random;
  Math.random = seededRandom(seed);
  try {
    return fn();
  } finally {
    Math.random = oldRandom;
  }
}
