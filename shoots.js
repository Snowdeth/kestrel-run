// Take the entry's screenshots: serve game/, open it in the browser in each scene, save a PNG, then close.
// Run with the server's port: node shoots.js --port 8099

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const port = process.argv.includes('--port') ? process.argv[process.argv.indexOf('--port') + 1] : '8099';
const scene = [
  { name: '1-cover.png', query: '?shot=ring&seed=7' },
  { name: '2-ridge.png', query: '?shot=ridge&seed=4' },
  { name: '3-final.png', query: '?shot=final&seed=9' },
];

const shotsDir = join(import.meta.dirname, 'screenshots');
mkdirSync(shotsDir, { recursive: true });

const CDP = 'http://127.0.0.1:9222';
const call = async (method, params, id) => {
  const res = await fetch(`${CDP}/json/${method}`);
  return res.json().catch(() => null);
};

const tabs = await (await fetch(`${CDP}/json/list`)).json();
const tab = tabs.find((t) => t.type === 'page');
if (!tab) {
  console.error('no browser tab on 9222');
  process.exit(1);
}

/** Open the game, wait for a paint, then save the viewport. */
for (const s of scene) {
  const url = `http://127.0.0.1:${port}/index.html${s.query}`;
  await fetch(`${CDP}/json/new?${url}`);
  await new Promise((r) => setTimeout(r, 2500));
  const list = await (await fetch(`${CDP}/json/list`)).json();
  const page = list.find((t) => t.type === 'page' && t.url.includes('index.html'));
  if (!page) { console.error('page missing for', s.name); continue; }
  const shotRes = await fetch(`${CDP}/json/wait/do`);
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let n = 0;
  ws.send(JSON.stringify({ id: ++n, method: 'Page.captureScreenshot', params: { format: 'png' } }));
  const png = await new Promise((resolve) => {
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id === n && msg.result) resolve(Buffer.from(msg.result.data, 'base64'));
    });
  });
  ws.close();
  if (png) {
    writeFileSync(join(shotsDir, s.name), png);
    console.log('wrote', s.name, png.length, 'bytes');
  }
  await fetch(`${CDP}/json/close/${page.id}`);
}
