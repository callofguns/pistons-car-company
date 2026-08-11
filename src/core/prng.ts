/**
 * A tiny seeded PRNG (mulberry32) so competitor volume and rumor selection are reproducible
 * across a session/tests, the same way the C# port used `new Random(seed)`. Not cryptographic -
 * purely for deterministic-enough game flavor.
 */
export function createRng(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function randInt(rng: () => number, minInclusive: number, maxExclusive: number): number {
  return Math.floor(rng() * (maxExclusive - minInclusive)) + minInclusive
}
