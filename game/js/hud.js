// The head-up display: airspeed, altitude, a compass card, the ring strip, the mission line and notes.
// Every figure comes from the aircraft state, so the panel always shows what is really happening.

import { LIMITS } from './aircraft.js';
import { feet } from './aircraft.js';

const $ = (id) => document.getElementById(id);

const CARDINALS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

/** A compact vertical tape of ticks around the current value. */
function tape(node, value, span, step, render) {
  const rows = [];
  const from = Math.floor((value - span / 2) / step) * step;
  for (let v = from; v <= value + span / 2; v += step) {
    const d = Math.abs(v - value);
    rows.push(`<i style="opacity:${Math.max(0.12, 1 - d / span)}">${render(v)}</i>`);
  }
  node.innerHTML = rows.join('');
}

/** Write the panel for this frame; `warn` is the number of advisory flags to show. */
export function paintHud(ac, mission, notes, warn) {
  const ias = Math.round(ac.speed);
  const alt = Math.max(0, feet(ac.y));
  $('ias').textContent = String(ias).padStart(3, '0');
  $('alt').textContent = String(alt).padStart(4, '0');
  $('ias').classList.toggle('hot', ias > LIMITS.ias[1] - 40 || ac.stall > 0.4);
  $('alt').classList.toggle('hot', alt < 320);

  tape($('iasTape'), ias, 60, 10, (v) => (v % 50 === 0 ? v : '·'));
  tape($('altTape'), alt, 400, 50, (v) => (v % 500 === 0 ? v / 100 : '·'));

  const deg = ((-ac.heading * 180) / Math.PI + 360) % 360;
  $('card').textContent = CARDINALS[Math.round(deg / 45) % 8];
  $('tick').textContent = String(Math.round(deg)).padStart(3, '0') + '°';

  $('strip').innerHTML = mission.rings
    .map((r, i) => `<b class="${r.passed ? 'done' : i === mission.next ? 'next' : ''}">${i + 1}</b>`)
    .join('');

  $('mission').textContent = mission.text;
  $('notes').innerHTML = notes.map((n) => `<span class="${n.bad ? 'bad' : ''}">${n.text}</span>`).join('');
  document.body.classList.toggle('alarm', warn > 0);
}
