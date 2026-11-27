// A sortie: its rings, the runway, the score and the moment it ends. One sortie at a time.
// Ring order is the mission; a missed ring costs the run, and the runway is the way home.

import { laySortie } from './world.js';
import { rng } from './noise.js';

export function makeSortie(seed, startZ) {
  const rand = rng(seed);
  const plan = laySortie(rand, startZ, seed);
  return {
    rings: plan.rings,
    runway: plan.runway,
    next: 0,
    score: 0,
    text: 'Follow the ridge and fly the rings in order.',
    done: false,
  };
}

/** Score a ring pass when the aircraft crosses the ring plane inside its radius. */
export function checkRings(sortie, ac, prevZ) {
  const ring = sortie.rings[sortie.next];
  if (!ring || sortie.done) return null;
  const crossed = prevZ >= ring.z && ac.z < ring.z;
  if (!crossed) return null;
  const off = Math.hypot(ac.x - ring.x, ac.y - ring.y);
  if (off > ring.r) return 'miss';
  ring.passed = true;
  sortie.next += 1;
  sortie.score += Math.max(60, 220 - Math.round(off * 4));
  sortie.text =
    sortie.next < sortie.rings.length
      ? `Ring ${sortie.next} of ${sortie.rings.length}: keep the line.`
      : 'All rings flown: set down on the runway ahead.';
  return 'pass';
}

/** Score the landing when the aircraft reaches the runway. */
export function checkRunway(sortie, ac) {
  if (sortie.done || ac.z > sortie.runway.z) return null;
  sortie.done = true;
  const off = Math.hypot(ac.x - sortie.runway.x, ac.y - sortie.runway.y);
  const ok = off < 40 && ac.speed < 190;
  sortie.score += ok ? Math.round(400 - off * 4) : 0;
  return ok ? 'landed' : 'short';
}
