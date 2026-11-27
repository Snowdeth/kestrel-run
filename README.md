# Kestrel Run

[![make.fun · best-flight-game-20261126-0057](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=kestrel_run)

[![rank](https://make.fun/badge/best-flight-game-20261126-0057/Snowdeth/kestrel-run/rank.svg)](https://make.fun/bounty/best-flight-game-20261126-0057/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=kestrel_run)

[![reward](https://make.fun/badge/best-flight-game-20261126-0057/Snowdeth/kestrel-run/reward.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=kestrel_run)

A low-level ridge flight for the browser. Fly the valley, take the rings in order, watch the fuel, and
put the aircraft down on the strip at the end.

## Playing it

Serve `game/` with any static server and open `index.html` in desktop Chrome. Nothing is fetched over the
network: the terrain, the sky, the aircraft and the instruments are all drawn by the game's own code.

- Arrow keys or WASD: bank and pitch
- Shift: throttle up, Ctrl: throttle back
- Space: start a sortie

## How it is built

Plain ES modules, no engine and no build step.

- `game/js/boot.js` — the loop, the key map, the brief and the end of a sortie
- `game/js/aircraft.js` — the flight model: throttle lag, lift falling off with pitch, the ridge bite
- `game/js/world.js` — the valley, its height field, the woodland and the sortie's rings
- `game/js/view.js` — sky, ridge layers, ground, trees, rings, runway
- `game/js/airframe.js` — the cowling, propeller and lit panels in frame
- `game/js/hud.js`, `game/js/hud.css` — airspeed, altitude, compass, ring strip and advisories
- `game/js/noise.js` — seeded value noise, so a sortie's valley repeats from its seed
- `game/js/sortie.js` — ring scoring and the landing

`main.ts` copies `game/` and `screenshots/` to `/output` and writes the dossier the judge reads.

## Screenshots

Taken from the game's own render: the ridge run, a banked turn over the treeline, and the runway ahead.

MIT.
