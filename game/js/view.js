// The view from behind the windscreen: sky, a ridge horizon in layers, the sea of grass below, the rings
// and runway ahead, and the aircraft's own nose and panels in frame. Canvas 2D, no textures loaded.

import { groundAt, slopeAt, treeAt, forestAt } from './world.js';
import { paintAirframe } from './airframe.js';

const W = 960, H = 540;
const HORIZON = H * 0.44;

/** Vertical screen position of a world point, scaled by distance and pitch. */
function project(x, y, z, ac) {
  const depth = Math.max(6, z);
  const scale = 520 / depth;
  return {
    x: W / 2 + (x - ac.x) * scale,
    y: HORIZON + (ac.y - y) * scale + ac.pitch * 130 - ac.bank * 40,
    scale,
  };
}

/** Sky gradient with the sun's glow, over the whole frame. */
function paintSky(ctx, ac) {
  const sky = ctx.createLinearGradient(0, 0, 0, HORIZON + 90);
  sky.addColorStop(0, '#2d5f96');
  sky.addColorStop(0.55, '#79a9cf');
  sky.addColorStop(1, '#d9e6e2');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  const sunX = W * 0.72 - ac.heading * 180;
  const glow = ctx.createRadialGradient(sunX, HORIZON - 120, 10, sunX, HORIZON - 120, 260);
  glow.addColorStop(0, 'rgba(255,244,210,0.85)');
  glow.addColorStop(1, 'rgba(255,244,210,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
}

/** One ridge layer: a filled silhouette from the sampled skyline, hazier the further back it is. */
function ridge(ctx, seed, zBack, x0, x1, fill, columns) {
  ctx.beginPath();
  ctx.moveTo(0, H);
  for (let c = 0; c < columns; c++) {
    const x = x0 + ((x1 - x0) * c) / (columns - 1);
    const g = groundAt(x, zBack, seed);
    const sy = HORIZON + (11 - g) * 1.6;
    ctx.lineTo((W * c) / (columns - 1), sy);
  }
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

/** The ground under the aircraft: perspective bands of grass and rock with slope shading. */
function paintGround(ctx, ac, seed) {
  const bands = 26;
  for (let i = bands; i >= 1; i--) {
    const z = ac.z - i * 26;
    const near = 26 + i * 26;
    const t = 1 - i / bands;
    const x0 = ac.x - near * 1.5, x1 = ac.x + near * 1.5;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let c = 0; c <= 24; c++) {
      const x = x0 + ((x1 - x0) * c) / 24;
      const g = groundAt(x, z, seed);
      const p = project(x, g, Math.max(6, ac.z - z), ac);
      ctx.lineTo(p.x, p.y);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    const slope = slopeAt(ac.x, z, seed);
    const wood = forestAt(ac.x, z, seed);
    const green = 96 - slope * 34 - wood * 26;
    const red = 58 + slope * 44 - wood * 14;
    ctx.fillStyle = `rgb(${Math.round(red)},${Math.round(green + t * 18)},${Math.round(50 + t * 12)})`;
    ctx.fill();
    // Water where the valley floor dips close to the river line.
    if (Math.abs(groundAt(ac.x, z, seed) - 0.6) < 0.5) {
      ctx.fillStyle = 'rgba(96,152,178,0.75)';
      ctx.fill();
    }
  }
}

/** Trees on the ground rows, nearest last so they overlap correctly; size grows as they near. */
function paintTrees(ctx, ac, seed) {
  for (let i = 26; i >= 1; i--) {
    const z = ac.z - i * 26;
    const near = 26 + i * 26;
    const x0 = ac.x - near * 1.5, x1 = ac.x + near * 1.5;
    for (let c = 0; c <= 30; c++) {
      const x = x0 + ((x1 - x0) * c) / 30 + ((c * 37 + i * 11) % 23) - 11;
      if (!treeAt(x, z, seed)) continue;
      const g = groundAt(x, z, seed);
      const p = project(x, g, Math.max(6, ac.z - z), ac);
      if (p.x < -30 || p.x > W + 30) continue;
      const hgt = Math.max(1.4, p.scale * 2.6);
      ctx.fillStyle = 'rgba(24,44,30,0.92)';
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - hgt * 2.6);
      ctx.lineTo(p.x + hgt * 0.8, p.y + 0.6);
      ctx.lineTo(p.x - hgt * 0.8, p.y + 0.6);
      ctx.closePath();
      ctx.fill();
    }
  }
}

/** A ring ahead, drawn as an ellipse that widens as it nears, with a lit inner edge. */
function paintRing(ctx, ring, ac) {
  const depth = ac.z - ring.z;
  if (depth < 4) return;
  const p = project(ring.x, ring.y, depth, ac);
  if (p.scale <= 0 || p.scale > 90) return;
  const rx = ring.r * p.scale, ry = rx * 0.86;
  if (p.y > H + ry || p.y < -ry) return;
  ctx.globalAlpha = Math.min(1, 0.25 + depth / 900);
  ctx.lineWidth = Math.max(2, rx * 0.14);
  ctx.strokeStyle = ring.passed ? 'rgba(120,240,170,0.85)' : 'rgba(255,214,90,0.95)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = Math.max(1, rx * 0.05);
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y, rx * 0.86, ry * 0.86, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/** Strips of runway at the end of the sortie. */
function paintRunway(ctx, runway, ac) {
  const p = project(runway.x, groundAt(runway.x, runway.z, 1), ac.z - runway.z, ac);
  if (p.scale <= 0 || p.y > H + 200) return;
  const w = 26 * p.scale, h = 260 * p.scale;
  ctx.fillStyle = 'rgba(70,74,78,0.9)';
  ctx.fillRect(p.x - w / 2, p.y - h, w, h);
  ctx.fillStyle = 'rgba(240,240,235,0.8)';
  for (let i = 0; i < 8; i++) ctx.fillRect(p.x - 1, p.y - h + i * (h / 8), 2, h / 16);
}

/** Draw a whole frame of the view. */
export function paint(ctx, ac, seed, ring, runway) {
  paintSky(ctx, ac);
  ridge(ctx, seed, ac.z - 1500, ac.x - 1400, ac.x + 1400, 'rgba(120,140,150,0.55)', 40);
  ridge(ctx, seed, ac.z - 900, ac.x - 900, ac.x + 900, 'rgba(96,118,110,0.8)', 32);
  paintGround(ctx, ac, seed);
  paintTrees(ctx, ac, seed);
  if (runway) paintRunway(ctx, runway, ac);
  const ahead = ring.filter((r) => !r.passed && ac.z - r.z > 4).slice(0, 3);
  for (const r of ahead.reverse()) paintRing(ctx, r, ac);
  paintAirframe(ctx, ac, W, H);
}
