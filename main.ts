// Kestrel Run's entrypoint (Node 22, standard library only).
//
// The game is the static game/ folder beside this file: game/index.html and its ES modules, drawn
// by the browser's own canvas with no library and no network request. This program is only the
// hand-in: it assembles /output, guards the judge's limits, and writes the dossier the judge reads.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, existsSync, mkdirSync, readdirSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The scorer's caps, from reference/gate.json. The first shapes the dossier's text budget; the rest
// refuse here what the scorer would refuse later, so a passing build is a passable entry.
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

/** Fail the build with one clear line, rather than handing in an entry the scorer rejects. */
function guard(ok: boolean, why: string): void {
  if (!ok) {
    console.error(`kestrel-run: ${why}`);
    process.exit(1);
  }
}

/** Every file under a root, with its size, walked without following links. */
function walk(root: string, prefix = ''): { path: string; bytes: number }[] {
  const found: { path: string; bytes: number }[] = [];
  for (const name of readdirSync(join(root, prefix), { withFileTypes: true })) {
    const path = prefix ? `${prefix}/${name.name}` : name.name;
    const full = join(root, path);
    if (name.isDirectory()) found.push(...walk(root, path));
    else found.push({ path, bytes: statSync(full).size });
  }
  return found;
}

mkdirSync(out, { recursive: true });
const shots = join(out, 'screenshots');
mkdirSync(shots, { recursive: true });

// game/: a flat copy of the static files, then the two caps the scorer counts on it.
const files = walk(join(here, 'game'));
guard(files.length <= CAPS.game_max_files, `${files.length} files in game/, limit ${CAPS.game_max_files}`);
guard(
  files.reduce((sum, f) => sum + f.bytes, 0) <= CAPS.game_max_bytes,
  'game/ is over its byte budget',
);
for (const f of files) {
  guard(`${f.path.split(sep).join('/')}`.length <= CAPS.game_path_max_bytes, `game/ path too long: ${f.path}`);
}
for (const f of files) {
  mkdirSync(join(out, 'game', ...f.path.split('/').slice(0, -1)), { recursive: true });
  copyFileSync(join(here, 'game', ...f.path.split('/')), join(out, 'game', ...f.path.split('/')));
}

// screenshots/: the cover first by name, so number the files and cap them both ways.
if (existsSync(join(here, 'screenshots'))) {
  const pictures = readdirSync(join(here, 'screenshots'))
    .filter((n) => /\.(png|jpe?g)$/i.test(n))
    .sort();
  guard(pictures.length > 0, 'no screenshots found');
  guard(pictures.length <= CAPS.screenshots.max, `${pictures.length} screenshots, limit ${CAPS.screenshots.max}`);
  for (const [i, name] of pictures.entries()) {
    const full = join(here, 'screenshots', name);
    guard(statSync(full).size <= CAPS.screenshots.max_bytes, `screenshot too heavy: ${name}`);
    const target = join(shots, `${String(i + 1).padStart(2, '0')}-${name.replace(/^\d+-/, '')}`);
    copyFileSync(full, target);
    renameSync(target, target);
  }
}

writeFileSync(join(out, 'dossier.json'), buildDossier(out, CAPS));
console.log(`kestrel-run: handed in ${files.length} game files and the screenshots`);
