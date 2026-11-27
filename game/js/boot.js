// Boot: the render loop, the key map, the brief and the end of a sortie. Seeds come from the URL so a
// screenshot run and a play run can be the same valley.

import { makeAircraft, steer, fly, feet, LIMITS } from './aircraft.js';
import { makeSortie, checkRings, checkRunway } from './sortie.js';
import { paint } from './view.js';
import { paintHud } from './hud.js';
import { groundAt, slopeAt } from './world.js';

const canvas = document.getElementById('sea');
const ctx = canvas.getContext('2d');
const banner = document.getElementById('banner');
const brief = document.getElementById('brief');

const KEYMAP = {
  ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
  KeyA: 'left', KeyD: 'right', KeyW: 'up', KeyS: 'down',
  ShiftLeft: 'faster', ShiftRight: 'faster', ControlLeft: 'slower', ControlRight: 'slower',
};

const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed') || 1);
const shot = params.get('shot');

const keys = new Set();
let ac, sortie, prevZ, raf, running = false, clock = 0;

addEventListener('keydown', (e) => {
  const k = KEYMAP[e.code];
  if (k) { keys.add(k); e.preventDefault(); }
  if (e.code === 'Space' && !running) begin();
});
addEventListener('keyup', (e) => {
  const k = KEYMAP[e.code];
  if (k) keys.delete(k);
});

/** Reset the aircraft and the sortie and start the clock. */
function begin() {
  ac = makeAircraft(seed);
  sortie = makeSortie(seed, ac.z);
  prevZ = ac.z;
  running = true;
  clock = 0;
  brief.classList.add('hidden');
  banner.classList.remove('show');
}

/** Advisory notes for the panel, worst first. */
function notesFor(ground) {
  const out = [];
  const clearance = ac.y - ground;
  if (clearance < 6) out.push({ text: 'PULL UP', bad: true });
  else if (clearance < 14) out.push({ text: 'low', bad: true });
  if (ac.stall > 0.35) out.push({ text: 'STALL', bad: true });
  if (ac.speed > LIMITS.ias[1] - 40) out.push({ text: 'overspeed', bad: true });
  if (ac.fuel < 25) out.push({ text: `fuel ${Math.round(ac.fuel)}%`, bad: true });
  const slope = slopeAt(ac.x, ac.z, seed);
  if (slope > 0.6) out.push({ text: 'ridge', bad: false });
  out.push({ text: `G ${ac.gForce.toFixed(1)}`, bad: false });
  return out;
}

/** One frame: steer, fly, score, paint. */
function frame(now) {
  const dt = Math.min(0.05, (now - (frame.last || now)) / 1000);
  frame.last = now;
  if (running) {
    clock += dt;
    steer(ac, keys, dt);
    prevZ = ac.z;
    const ground = fly(ac, dt, seed);
    const ring = checkRings(sortie, ac, prevZ);
    if (ring === 'miss') { sortie.text = `Ring ${sortie.next + 1} missed - fly the next one.`; sortie.next += 1; }
    const land = checkRunway(sortie, ac);
    if (land) finish(land);
    if (ac.fuel <= 0 && ground + 1.3 >= ac.y) finish('out');
    paint(ctx, ac, seed, sortie.rings, sortie.runway);
    const notes = notesFor(ground);
    paintHud(ac, sortie, notes, notes.filter((n) => n.bad).length);
  }
  raf = requestAnimationFrame(frame);
}

/** End the sortie and show what it scored. */
function finish(kind) {
  running = false;
  const title = kind === 'landed' ? 'LANDED' : kind === 'short' ? 'MISSED THE STRIP' : 'OUT OF FUEL';
  banner.textContent = `${title}  ·  ${sortie.score} pts  ·  ${Math.round(clock)}s`;
  banner.classList.add('show');
  setTimeout(() => {
    brief.querySelector('h1').textContent = `${title}`;
    brief.querySelector('p').textContent = `Sortie scored ${sortie.score} points in ${Math.round(clock)} seconds. Press Space to fly the ridge again.`;
    brief.classList.remove('hidden');
  }, 2200);
}

/** Skip the countdown the screenshot mode uses to reach a scene. */
function fastForward(seconds) {
  for (let t = 0; t < seconds; t += 1 / 60) {
    steer(ac, keys, 1 / 60);
    prevZ = ac.z;
    const ground = fly(ac, 1 / 60, seed);
    checkRings(sortie, ac, prevZ);
    if (ground + 1.3 >= ac.y) ac.y = ground + 2;
  }
}

if (shot) {
  begin();
  if (shot === 'ring') { keys.add('faster'); fastForward(6); }
  if (shot === 'ridge') { keys.add('right'); fastForward(4); keys.delete('right'); fastForward(1.2); }
  if (shot === 'final') { keys.add('faster'); fastForward(9); }
  document.body.classList.add('shot');
} else {
  brief.innerHTML = `
    <h1>KESTREL RUN</h1>
    <p>Fly the ridge at low level and take the rings in order. Watch the fuel, keep the speed off the stall
       and put the aircraft on the strip at the end.</p>
    <p class="keys">Arrow or WASD: bank and pitch · Shift: throttle up · Ctrl: throttle back · Space: start</p>`;
}

requestAnimationFrame(frame);
