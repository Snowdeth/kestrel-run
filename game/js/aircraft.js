// The aircraft: its state, the controls that bend it, and the forces that bring it back.
// Flight model is arcade but honest: throttle lags, the nose drops in a stall, and the ridge bites.

import { groundAt, FT_PER_UNIT } from './world.js';

export const LIMITS = { ias: [78, 340], alt: 240, sink: 34, bank: 1.15 };

/** A fresh aircraft on the runway, pointed down the valley. */
export function makeAircraft(seed) {
  return {
    x: 0, z: 0, y: groundAt(0, 0, seed) + 4,
    speed: 96, throttle: 0.55, bank: 0, pitch: 0, heading: 0,
    fuel: 100, damage: 0, stall: 0, gForce: 1, seaLevel: false,
  };
}

/** Turn the key state into control deflections at this frame's timestep. */
export function steer(ac, keys, dt) {
  const roll = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0);
  const pull = (keys.has('down') ? 1 : 0) - (keys.has('up') ? 1 : 0);
  ac.bank += (roll * 1.0 - ac.bank) * Math.min(1, dt * 3.4);
  ac.pitch += (pull * 0.5 - ac.pitch) * Math.min(1, dt * 2.6);
  if (keys.has('faster')) ac.throttle = Math.min(1, ac.throttle + dt * 0.55);
  if (keys.has('slower')) ac.throttle = Math.max(0, ac.throttle - dt * 0.7);
}

/** Advance the aircraft one step: throttle to speed, turn from bank, climb from pitch, ridge collision. */
export function fly(ac, dt, seed) {
  const target = LIMITS.ias[0] + (LIMITS.ias[1] - LIMITS.ias[0]) * ac.throttle;
  ac.speed += (target - ac.speed) * Math.min(1, dt * 0.42);

  // Lift falls away as the nose points up or the aircraft slows; below flying speed it drops.
  const lift = Math.max(0, 1 - Math.abs(ac.pitch) * 0.35);
  const flying = ac.speed / LIMITS.ias[0];
  ac.stall = flying < 1 ? Math.min(1, ac.stall + dt * 1.6) : Math.max(0, ac.stall - dt * 1.2);

  const turnRate = (ac.bank / LIMITS.bank) * (0.85 + ac.speed / 420);
  ac.heading += turnRate * dt * 1.35;

  const climb = ac.pitch * ac.speed * 0.14 * lift * (1 - ac.stall);
  const sink = ac.stall * 18 + (1 - lift) * 4;
  ac.y += (climb - sink) * dt;

  ac.x += Math.sin(ac.heading) * ac.speed * dt * -1;
  ac.z -= Math.cos(ac.heading) * ac.speed * dt;

  ac.gForce = 1 + Math.abs(ac.bank) * 1.6 + Math.abs(ac.pitch) * 1.2;
  ac.fuel = Math.max(0, ac.fuel - dt * (0.25 + ac.throttle * 0.85));
  if (ac.fuel === 0) ac.throttle = Math.max(0, ac.throttle - dt * 0.4);

  ac.seaLevel = false;
  const ground = groundAt(ac.x, ac.z, seed);
  if (ac.y <= ground + 1.2) {
    ac.y = ground + 1.2;
    ac.seaLevel = true;
  }
  return ground;
}

/** Feet for the altimeter, from world units. */
export function feet(units) {
  return Math.round(units * FT_PER_UNIT);
}
