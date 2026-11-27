/** The panel's own dial: a needle on a scale, as the aircraft reads it. */
function dial(ctx, cx, cy, r, value, label, tint) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = '#0e1418';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = tint;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI * 0.75 + (Math.PI * 1.5 * i) / 10;
    ctx.strokeStyle = i % 5 === 0 ? tint : 'rgba(200,220,225,0.4)';
    ctx.lineWidth = i % 5 === 0 ? 1.6 : 0.8;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r * 0.74, Math.sin(a) * r * 0.74);
    ctx.lineTo(Math.cos(a) * r * 0.94, Math.sin(a) * r * 0.94);
    ctx.stroke();
  }
  const a = Math.PI * 0.75 + Math.PI * 1.5 * Math.max(0, Math.min(1, value));
  ctx.strokeStyle = '#ffe9b8';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(a) * r * 0.78, Math.sin(a) * r * 0.78);
  ctx.stroke();
  ctx.fillStyle = tint;
  ctx.beginPath();
  ctx.arc(0, 0, 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(210,232,236,0.85)';
  ctx.font = '7px ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(label, 0, r * 0.52);
  ctx.restore();
}

/** The two lit instrument panels: the left amber engine set, the right cyan flight set. */
function paintPanels(ctx, ac, W) {
  for (const side of [-1, 1]) {
    const cx = W / 2 + side * 262;
    ctx.fillStyle = '#1b2329';
    ctx.beginPath();
    ctx.roundRect(cx - 132, -128, 264, 108, 14);
    ctx.fill();
    ctx.strokeStyle = side > 0 ? 'rgba(127,212,230,0.75)' : 'rgba(230,178,94,0.75)';
    ctx.lineWidth = 2;
    ctx.stroke();
    const tint = side > 0 ? '#7fd4e6' : '#e6b25e';
    if (side < 0) {
      dial(ctx, cx - 62, -74, 26, ac.fuel / 100, 'FUEL', tint);
      dial(ctx, cx + 4, -74, 26, ac.throttle, 'PWR', tint);
      dial(ctx, cx + 70, -74, 26, ac.damage / 100, 'DMG', tint);
    } else {
      dial(ctx, cx - 62, -74, 26, (ac.speed - 60) / 300, 'IAS', tint);
      dial(ctx, cx + 4, -74, 26, Math.min(1, ac.y / 260), 'ALT', tint);
      dial(ctx, cx + 70, -74, 26, Math.abs(ac.bank) / 1.2, 'BANK', tint);
    }
  }
}

/** The aircraft in frame: cowling, propeller arc, windscreen pillars and panels, banked with the controls. */
export function paintAirframe(ctx, ac, W, H) {
  const tilt = ac.bank * 42;
  const bob = Math.sin(performance.now() / 900) * 1.4;
  ctx.save();
  ctx.translate(W / 2 - tilt * 0.22, H + bob);

  // Cowling: a wide shoulder either side, dropping off the frame.
  ctx.beginPath();
  ctx.moveTo(-60, -118);
  ctx.quadraticCurveTo(W / 2, -244, W + 60, -118);
  ctx.lineTo(W + 60, 20);
  ctx.lineTo(-60, 20);
  ctx.closePath();
  const skin = ctx.createLinearGradient(0, -244, 0, 20);
  skin.addColorStop(0, '#4c565f');
  skin.addColorStop(0.5, '#39424a');
  skin.addColorStop(1, '#232a30');
  ctx.fillStyle = skin;
  ctx.fill();
  ctx.strokeStyle = '#161c21';
  ctx.lineWidth = 5;
  ctx.stroke();

  // Panel line and rivets, so the cowling reads as built rather than painted.
  ctx.strokeStyle = 'rgba(160,178,188,0.28)';
  ctx.lineWidth = 1.2;
  for (const y of [-176, -150]) {
    ctx.beginPath();
    ctx.moveTo(-40, y + 22);
    ctx.quadraticCurveTo(W / 2, y - 78, W + 40, y + 22);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(190,205,212,0.35)';
  for (let i = -54; i <= 54; i += 12) {
    ctx.beginPath();
    ctx.arc(W / 2 + i * 2.4, -160 + Math.abs(i) * 0.55, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Nose and spinner, with the propeller spinning as a soft disc.
  ctx.fillStyle = '#2b333a';
  ctx.beginPath();
  ctx.moveTo(W / 2 - 30, -206);
  ctx.lineTo(W / 2 + 30, -206);
  ctx.lineTo(W / 2 + 18, -262);
  ctx.lineTo(W / 2 - 18, -262);
  ctx.closePath();
  ctx.fill();
  const spin = (performance.now() / 1000) * (6 + ac.throttle * 22);
  ctx.save();
  ctx.translate(W / 2, -258);
  ctx.globalAlpha = 0.16 + ac.throttle * 0.18;
  ctx.fillStyle = '#dfe9ec';
  ctx.beginPath();
  ctx.ellipse(0, 0, 64, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = '#1d2328';
  for (const off of [0, Math.PI]) {
    const a = spin + off;
    ctx.save();
    ctx.rotate(a * 0.06);
    ctx.beginPath();
    ctx.ellipse(Math.cos(a) * 28, Math.sin(a) * 3.4, 30, 2.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // Windscreen pillars.
  ctx.fillStyle = '#5b666e';
  ctx.beginPath();
  ctx.moveTo(-60, -118);
  ctx.lineTo(132, -206);
  ctx.lineTo(164, -184);
  ctx.lineTo(26, -104);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(W + 60, -118);
  ctx.lineTo(W - 132, -206);
  ctx.lineTo(W - 164, -184);
  ctx.lineTo(W - 26, -104);
  ctx.closePath();
  ctx.fill();

  paintPanels(ctx, ac, W);
  ctx.restore();
}
