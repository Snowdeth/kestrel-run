// The world: a ridge valley the aircraft flies along, its ground height, and the rings that mark a sortie.
// Ground is a function of position, never a stored mesh: each new sortie reseeds the valley.

import { fbm } from './noise.js';

export const FT_PER_UNIT = 32;

/** Height of the ground in world units at (x, z): a valley floor between two rising walls. */
export function groundAt(x, z, seed) {
  const wall = Math.min(1, Math.abs(x) / 620);
  const ridge = 2 + Math.pow(wall, 1.7) * 34;
  const hills = (fbm(x * 0.0045, z * 0.0045, seed) - 0.45) * 22;
  const fine = (fbm(x * 0.02, z * 0.02, seed + 7) - 0.5) * 3.2;
  return Math.max(0.4, ridge + hills + fine);
}

/** The ground's normal-ish steepness at (x, z): 0 flat, towards 1 a wall. */
export function slopeAt(x, z, seed) {
  const d = 6;
  const dx = groundAt(x + d, z, seed) - groundAt(x - d, z, seed);
  const dz = groundAt(x, z + d, seed) - groundAt(x, z - d, seed);
  return Math.min(1, Math.hypot(dx, dz) / (d * 2) * 1.6);
}

/** A sortie's layout: the rings to fly through, in order, and the runway point at the end. */
export function laySortie(rand, startZ, seed) {
  const rings = [];
  let z = startZ - 900;
  let x = 0;
  const count = 6 + Math.floor(rand() * 4);
  for (let i = 0; i < count; i++) {
    x = Math.max(-330, Math.min(330, x + (rand() - 0.5) * 420));
    const ground = groundAt(x, z, seed);
    rings.push({ x, z, y: ground + 26 + rand() * 30, r: 17 + rand() * 5, passed: false });
    z -= 700 + rand() * 320;
  }
  return { rings, runway: { x: Math.max(-260, Math.min(260, x)), z } };
}

/** The ridge profile across the view, sampled in screen columns: the terrain's own silhouette. */
export function skyline(seed, zStart, x0, x1, columns, near) {
  const out = new Float32Array(columns);
  for (let c = 0; c < columns; c++) {
    const x = x0 + ((x1 - x0) * c) / (columns - 1);
    out[c] = groundAt(x, zStart + near, seed);
  }
  return out;
}

/** How thick the woodland is at (x, z): 0 open grass, 1 dense forest. Dry ridgelines stay bare. */
export function forestAt(x, z, seed) {
  const patch = fbm(x * 0.0032 + 40, z * 0.0032, seed + 91);
  const river = Math.abs(x - Math.sin(z * 0.0016) * 90) < 46 ? 0.15 : 1;
  return Math.max(0, (patch - 0.34) * 2.1) * river * (1 - slopeAt(x, z, seed) * 0.7);
}

/** True when a tree stands at this lattice point; the lattice keeps trees stable across frames. */
export function treeAt(x, z, seed) {
  const cell = fbm(x * 0.09, z * 0.09, seed + 13);
  return cell > 0.42 && forestAt(x, z, seed) > 0.22;
}
