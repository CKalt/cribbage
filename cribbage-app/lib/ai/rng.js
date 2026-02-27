// Seeded PRNG for deterministic AI decisions
// Uses mulberry32 — fast, well-distributed 32-bit PRNG

function mulberry32(seed) {
  return function() {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

let _rng = Math.random;

/**
 * Seed the AI random number generator.
 * Pass a number for deterministic output, or null to use Math.random.
 */
export function seedRng(seed) {
  _rng = seed != null ? mulberry32(seed) : Math.random;
}

/**
 * Get the next random number from the AI RNG.
 * In production (unseeded), this is just Math.random().
 * In test/harness mode (seeded), this is deterministic.
 */
export function aiRandom() {
  return _rng();
}
