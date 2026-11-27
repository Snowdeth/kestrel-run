// Seeded randomness and a value-noise field, so a run's terrain repeats from its seed.
// Nothing here throws anything away: every hill comes back the same for the same point.

const LATTICE = 256;
const MASK = LATTICE - 1;

/** A small deterministic hash in [0,1) from three integers. */
function hash(x, y, seed) {
  let h = x * 374761393 + y * 668265263 + seed * 1442695041;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Smoothstep between 0 and 1. */
function fade(t) {
  return t * t * (3 - 2 * t);
}

/** Value noise in [0,1) at (x,y) for this seed: four lattice corners, smoothed. */
export function noise2(x, y, seed) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const a = hash(xi & MASK, yi & MASK, seed);
  const b = hash((xi + 1) & MASK, yi & MASK, seed);
  const c = hash(xi & MASK, (yi + 1) & MASK, seed);
  const d = hash((xi + 1) & MASK, (yi + 1) & MASK, seed);
  const u = fade(xf), v = fade(yf);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}

/** Fractal noise: four octaves, each half the weight and twice the frequency. */
export function fbm(x, y, seed) {
  let sum = 0, amp = 0.5, freq = 1, norm = 0;
  for (let o = 0; o < 4; o++) {
    sum += noise2(x * freq, y * freq, seed + o * 31) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

/** A seeded generator for mission layout and clouds. */
export function rng(seed) {
  let s = seed >>> 0 || 1;
  return function next() {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}
