/* Muskelklicker – detaillierte Mini-Sprites für die Imperium-Reihen.
   Jedes Geschäft: 4 Aussehen-Stufen (steigen mit dem Ausbau) × 2 Bilder (wechseln für die Animation).
   (x, y) = Mitte unten, s = Maßstab. Höhe bleibt unter ~24·s, damit die Reihen nicht überlappen. */
window.MK = window.MK || {};
(function (MK) {
const TAU = Math.PI * 2, INK = '#1a1a1a';
let ACC = null; // Akzentfarbe der aktuellen Ausbau-Stufe (Kappen, Schilder, Markisen)
const SK = ['#f1c9a5', '#d9a273', '#b07a50', '#7a4e31'];
/* ---------- Grundbausteine ---------- */
function rr(c, x, y, w, h, r, f, lw) { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); c.fillStyle = f; c.fill(); if (lw !== 0) { c.strokeStyle = INK; c.lineWidth = lw || .9; c.stroke(); } }
function ell(c, x, y, rx, ry, f, lw) { c.beginPath(); c.ellipse(x, y, Math.max(.3, rx), Math.max(.3, ry), 0, 0, TAU); c.fillStyle = f; c.fill(); if (lw !== 0) { c.strokeStyle = INK; c.lineWidth = lw || .9; c.stroke(); } }
function poly(c, pts, f, lw) { c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fillStyle = f; c.fill(); if (lw !== 0) { c.strokeStyle = INK; c.lineWidth = lw || .9; c.stroke(); } }
function ln(c, x1, y1, x2, y2, col, w) { c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); c.lineCap = 'butt'; }
function shade(c, x, y, w, h, a) { c.fillStyle = `rgba(0,0,0,${a || .18})`; c.fillRect(x + w * .64, y + .5, w * .36 - .5, h - 1); }
function shine(c, x, y, w, h) { c.fillStyle = 'rgba(255,255,255,.38)'; c.fillRect(x + w * .08, y + h * .08, Math.max(.8, w * .14), h * .5); }
function shadow(c, x, y, w) { c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(x, y + .5, w, w * .22, 0, 0, TAU); c.fill(); }
/* Haus/Box mit Kontur, Seitenschatten und Glanzkante */
function box(c, x, y, w, h, f, r) { rr(c, x, y, w, h, r || .6, f); shade(c, x, y, w, h); shine(c, x, y, w, h); }
function win(c, x, y, w, h, lit, glass) { rr(c, x, y, w, h, .4, lit ? '#ffe9a0' : (glass || '#45506a'), .6); c.fillStyle = 'rgba(255,255,255,.45)'; c.fillRect(x + w * .15, y + h * .15, w * .25, h * .5); ln(c, x + w / 2, y + .4, x + w / 2, y + h - .4, 'rgba(0,0,0,.35)', .5); }
function wheel(c, x, y, r, f) { ell(c, x, y, r, r, '#222', .8); ell(c, x, y, r * .55, r * .55, '#c9ced4', .5); const a = f ? .8 : 0; for (let i = 0; i < 3; i++) ln(c, x, y, x + Math.cos(a + i * 2.1) * r * .5, y + Math.sin(a + i * 2.1) * r * .5, '#666', .5); }
function awning(c, x, y, w, h, a, b) { b = ACC || b; const n = Math.max(3, Math.round(w / (h * 1.1))); for (let i = 0; i < n; i++) { c.fillStyle = i % 2 ? b : a; c.fillRect(x + i * w / n, y, w / n + .2, h); }
  for (let i = 0; i < n; i++) { c.fillStyle = i % 2 ? b : a; c.beginPath(); c.arc(x + (i + .5) * w / n, y + h, w / n / 2, 0, Math.PI); c.fill(); } c.strokeStyle = INK; c.lineWidth = .8; c.strokeRect(x, y, w, h); }
function sign(c, x, y, w, h, bg, txt, fg) { rr(c, x, y, w, h, .8, bg, .7); if (ACC) { c.strokeStyle = ACC; c.lineWidth = .9; c.strokeRect(x + .6, y + .6, w - 1.2, h - 1.2); } c.fillStyle = fg; c.font = `700 ${h * .72}px Arial`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, x + w / 2, y + h / 2 + .3); c.textBaseline = 'alphabetic'; }
/* Mini-Mensch mit Schuhen, Hose, Shirt, Armen, Gesicht, Haaren */
function person(c, x, y, s, o) {
  const sk = o.skin || SK[o.seed % 4], sh = o.shirt || '#5a7a4a', pa = o.pants || '#3a3f4a', hair = o.hair || ['#2a1a10', '#6b4423', '#d8b25a', '#1a1a1a'][o.seed % 4];
  const bend = o.pose === 'bend' ? (o.f ? 1 : .25) : 0, by = y - 6.2 * s, ty = by - 6.5 * s + bend * 1.6 * s, tx = x + bend * 2.4 * s;
  shadow(c, x, y, 3.6 * s);
  // Beine + Schuhe
  const step = o.pose === 'walk' ? (o.f ? 1.2 : -1.2) * s : 0;
  [-1, 1].forEach(k => { rr(c, x + k * 1.2 * s - 1 * s + (k > 0 ? step : -step) * .5, by, 2 * s, 5.6 * s, .5, pa, .6); rr(c, x + k * 1.2 * s - 1.3 * s + (k > 0 ? step : -step) * .5, y - 1.2 * s, 2.8 * s, 1.3 * s, .5, '#f2f0ea', .5); });
  // Rumpf
  c.save(); c.translate(tx, ty); c.rotate(bend * .5); rr(c, -2.6 * s, 0, 5.2 * s, 7 * s, 1.2 * s, sh, .7); c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(.9 * s, .5, 1.6 * s, 6.4 * s); c.restore();
  // Arme
  const sx = tx, sy = ty + 1.4 * s, arm = (dx, dy, k) => { ln(c, sx + k * 2.4 * s, sy, sx + k * 2.4 * s + dx, sy + dy, INK, 1.9 * s); ln(c, sx + k * 2.4 * s, sy, sx + k * 2.4 * s + dx, sy + dy, sk, 1.2 * s); };
  if (o.pose === 'carry') { arm(1.5 * s, 3 * s, 1); arm(-.6 * s, 4.5 * s, -1); }
  else if (o.pose === 'wave') { arm(.6 * s, o.f ? -4.5 * s : -3.5 * s, 1); arm(-.4 * s, 4.6 * s, -1); }
  else if (o.pose === 'lift') { const up = o.f ? -4.8 : -1.5; arm(1 * s, up * s, 1); arm(-1 * s, up * s, -1); }
  else if (o.pose === 'bend') { arm(2.2 * s, (o.f ? 5.5 : 4) * s, 1); arm(.8 * s, 4.8 * s, -1); }
  else { arm(.5 * s, 4.6 * s, 1); arm(-.5 * s, 4.6 * s, -1); }
  // Kopf
  const hx = tx + bend * 1.5 * s, hy = ty - 2.6 * s; ell(c, hx, hy, 2.4 * s, 2.5 * s, sk, .7);
  c.fillStyle = hair; c.beginPath(); c.arc(hx, hy - .3 * s, 2.45 * s, Math.PI * 1.02, Math.PI * 1.98); c.fill();
  const capC = ACC || o.cap; if (capC) { o = Object.assign({}, o, { cap: capC }); rr(c, hx - 2.5 * s, hy - 2.8 * s, 5 * s, 1.6 * s, .6 * s, o.cap, .5); c.fillStyle = o.cap; c.fillRect(hx + 1.5 * s, hy - 1.6 * s, 2.2 * s, .7 * s); }
  c.fillStyle = INK; c.fillRect(hx + .5 * s, hy - .1 * s, .6 * s, .7 * s); c.fillRect(hx - 1.2 * s, hy - .1 * s, .6 * s, .7 * s);
  return { hand: { x: sx + 3.9 * s, y: sy + 3 * s }, head: { x: hx, y: hy } };
}
const bottle = (c, x, y, s, col) => { rr(c, x - .7 * s, y - 3.2 * s, 1.4 * s, 3.2 * s, .4 * s, col, .5); c.fillStyle = col; c.fillRect(x - .35 * s, y - 4.2 * s, .7 * s, 1.1 * s); c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(x - .45 * s, y - 2.8 * s, .3 * s, 1.8 * s); };

/* ---------- Die Geschäfte ---------- */
const SPR = {
  pfand(c, x, y, s, v, f, k) {
    if (v === 0) { // Sammler mit Plastiktüte, bückt sich nach Flaschen
      const p = person(c, x - 1 * s, y, s, { pose: 'bend', f, seed: k, shirt: '#7a8a6a', pants: '#4a4a52', cap: '#3a5a3a' });
      rr(c, p.hand.x - 1.3 * s, p.hand.y - .5 * s, 3.4 * s, 4 * s, 1 * s, 'rgba(235,240,250,.95)', .6); bottle(c, p.hand.x + .4 * s, p.hand.y + .8 * s, .8 * s, '#7fd38a');
      if (!f) bottle(c, x + 5 * s, y, s, '#a7e0f0');
    } else if (v === 1) { // mit Einkaufswagen voller Flaschen
      person(c, x - 4.5 * s, y, s, { pose: 'carry', f, seed: k, shirt: '#5a7a4a', cap: '#2a4a2a' });
      const cx = x + 3 * s; poly(c, [[cx - 3.5 * s, y - 8 * s], [cx + 5 * s, y - 8 * s], [cx + 4 * s, y - 3 * s], [cx - 2.5 * s, y - 3 * s]], '#c9ced4', .8);
      for (let i = 0; i < 4; i++) ln(c, cx - 2.6 * s + i * 2 * s, y - 7.6 * s, cx - 2 * s + i * 1.8 * s, y - 3.4 * s, '#8a8f96', .4);
      ['#7fd38a', '#a7e0f0', '#c9a36b', '#7fd38a'].forEach((col, i) => bottle(c, cx - 2 * s + i * 1.9 * s, y - 7.8 * s + (f && i % 2 ? -.4 * s : 0), .85 * s, col)); wheel(c, cx - 1.8 * s, y - 1.2 * s, 1.1 * s, f); wheel(c, cx + 3 * s, y - 1.2 * s, 1.1 * s, f);
    } else if (v === 2) { // Lastenrad mit Pfandkiste
      wheel(c, x - 6 * s, y - 2.6 * s, 2.5 * s, f); wheel(c, x + 6.5 * s, y - 2.6 * s, 2.5 * s, f);
      ln(c, x - 6 * s, y - 2.6 * s, x - 1 * s, y - 6 * s, INK, 1.2 * s); ln(c, x - 1 * s, y - 6 * s, x + 2 * s, y - 2.6 * s, INK, 1.2 * s);
      box(c, x + 1.5 * s, y - 9.5 * s, 9 * s, 5.5 * s, '#2bb673'); c.fillStyle = '#fff'; c.font = `700 ${3.4 * s}px Arial`; c.textAlign = 'center'; c.fillText('♻', x + 6 * s, y - 5.6 * s);
      person(c, x - 3 * s, y - 4.5 * s, .85 * s, { pose: 'carry', f, seed: k, shirt: '#2bb673', cap: '#1a6a3a' });
    } else { // Recycling-Laster
      box(c, x - 10 * s, y - 13 * s, 13 * s, 10.5 * s, '#2bb673', .8); c.fillStyle = '#fff'; c.font = `700 ${5.5 * s}px Arial`; c.textAlign = 'center'; c.fillText(f ? '♻' : '♲', x - 3.5 * s, y - 6 * s);
      box(c, x + 3 * s, y - 10 * s, 7 * s, 7.5 * s, '#e8e6df', 1); win(c, x + 4.6 * s, y - 9 * s, 4 * s, 3 * s, false, '#8fc7ff');
      rr(c, x - 10 * s, y - 3.6 * s, 20 * s, 1.6 * s, .3, '#444', .6); wheel(c, x - 6 * s, y - 1.6 * s, 2 * s, f); wheel(c, x + 6 * s, y - 1.6 * s, 2 * s, f);
      if (f) { c.fillStyle = 'rgba(255,200,60,.9)'; c.beginPath(); c.arc(x + 10 * s, y - 5 * s, .9 * s, 0, TAU); c.fill(); }
    }
  },
  shake(c, x, y, s, v, f, k) {
    if (v === 0) { // Klapptisch mit Mixer
      ln(c, x - 5 * s, y, x - 4 * s, y - 6 * s, '#6b4a2b', .9 * s); ln(c, x + 5 * s, y, x + 4 * s, y - 6 * s, '#6b4a2b', .9 * s); rr(c, x - 7 * s, y - 7 * s, 14 * s, 1.6 * s, .4, '#c9a36b', .7);
      rr(c, x - 4 * s, y - 13 * s + (f ? -.5 * s : 0), 3.6 * s, 5.5 * s, .8, 'rgba(255,170,200,.95)', .7); rr(c, x - 4.2 * s, y - 13.8 * s + (f ? -.5 * s : 0), 4 * s, 1.2 * s, .4, '#333', .5);
      [1, 4].forEach((dx, i) => { rr(c, x + dx * s - .8 * s, y - 10 * s, 2 * s, 3 * s, .4, ['#ff8fab', '#b77a4a'][i], .5); ln(c, x + dx * s + .3 * s, y - 10 * s, x + dx * s + .9 * s, y - 12 * s, '#fff', .4 * s); });
    } else if (v === 1) { // Stand mit Schirm und Verkäufer
      person(c, x + 3 * s, y, .9 * s, { pose: f ? 'wave' : 'stand', f, seed: k, shirt: '#ff8fab' });
      box(c, x - 7 * s, y - 7 * s, 10 * s, 7 * s, '#fbf5e6'); c.fillStyle = '#ff5a8a'; c.fillRect(x - 7 * s, y - 5 * s, 10 * s, 1.2 * s);
      ln(c, x - 2 * s, y - 7 * s, x - 2 * s, y - 15 * s, '#555', .6 * s); for (let i = 0; i < 6; i++) { c.fillStyle = i % 2 ? '#fbf5e6' : '#ff5a8a'; c.beginPath(); c.moveTo(x - 2 * s, y - (f ? 19.5 : 19) * s); c.arc(x - 2 * s, y - 14 * s, 7.5 * s, Math.PI + i * Math.PI / 6, Math.PI + (i + 1) * Math.PI / 6); c.closePath(); c.fill(); }
      c.strokeStyle = INK; c.lineWidth = .7; c.beginPath(); c.arc(x - 2 * s, y - 14 * s, 7.5 * s, Math.PI, 0); c.stroke();
    } else if (v === 2) { // Food-Truck mit Klappe
      box(c, x - 10 * s, y - 13 * s, 20 * s, 10 * s, '#ff8fab', 1.2); awning(c, x - 7 * s, y - 13.5 * s, 10 * s, 2 * s, '#fbf5e6', '#ff5a8a');
      rr(c, x - 7 * s, y - 11 * s, 10 * s, 4.5 * s, .4, f ? '#fff3b0' : '#ffe08a', .6); person(c, x - 2 * s, y - 6.5 * s, .55 * s, { pose: 'stand', f, seed: k, shirt: '#fff' });
      box(c, x + 4 * s, y - 11 * s, 5 * s, 4 * s, '#8fc7ff', .4); wheel(c, x - 6 * s, y - 2 * s, 2 * s, f); wheel(c, x + 6 * s, y - 2 * s, 2 * s, f);
      sign(c, x - 9 * s, y - 17 * s, 8 * s, 2.6 * s, '#1a1a1a', 'SHAKE', '#ff8fab');
    } else { // Shake-Bar mit Neon
      box(c, x - 10 * s, y - 20 * s, 20 * s, 20 * s, '#3a2a3e', .6); win(c, x - 8 * s, y - 11 * s, 7 * s, 9 * s, true); win(c, x + 1.5 * s, y - 11 * s, 6.5 * s, 5 * s, f, '#6a4a7a');
      rr(c, x + 2.5 * s, y - 5 * s, 4.5 * s, 5 * s, .4, '#2a1a1e', .6);
      c.shadowColor = f ? '#ff5ad1' : '#ff9ae8'; c.shadowBlur = 6; sign(c, x - 8.5 * s, y - 18.5 * s, 17 * s, 4.5 * s, '#1a1018', 'SHAKE BAR', f ? '#ff5ad1' : '#ff9ae8'); c.shadowBlur = 0;
      awning(c, x - 10 * s, y - 13.6 * s, 20 * s, 2 * s, '#ff5a8a', '#fbf5e6');
    }
  },
  pt(c, x, y, s, v, f, k) {
    if (v <= 1) { // Trainer mit Klemmbrett, Kunde macht Kniebeugen (bzw. mit Kettlebell)
      const tr = person(c, x - 5 * s, y, s, { pose: 'stand', f: 0, seed: k + 1, shirt: '#f4a259', cap: '#c0601a' }); rr(c, tr.hand.x - 1.5 * s, tr.hand.y - 3 * s, 2.6 * s, 3.4 * s, .3, '#c9a36b', .5); c.fillStyle = '#fff'; c.fillRect(tr.hand.x - 1.1 * s, tr.hand.y - 2.5 * s, 1.8 * s, 2.4 * s);
      const sq = f ? .78 : 1; c.save(); c.translate(x + 4 * s, y); c.scale(1, sq); const cl = person(c, 0, 0, s, { pose: v === 1 ? 'lift' : 'stand', f, seed: k, shirt: '#555' }); c.restore();
      if (v === 1) ell(c, x + 4 * s + (f ? 0 : .5 * s), y - (f ? 16 : 12) * s * sq, 1.7 * s, 1.6 * s, '#2a2a2a', .6);
    } else if (v === 2) { // kleines Studio mit Fenster, Mensch drinnen trainiert
      box(c, x - 10 * s, y - 16 * s, 20 * s, 16 * s, '#e9d8b4'); rr(c, x - 10.5 * s, y - 17.5 * s, 21 * s, 2 * s, .4, '#c0601a', .6);
      rr(c, x - 8 * s, y - 13 * s, 10 * s, 8 * s, .4, '#fff3cf', .6); c.save(); c.beginPath(); c.rect(x - 8 * s, y - 13 * s, 10 * s, 8 * s); c.clip(); person(c, x - 3 * s, y - 4 * s, .7 * s, { pose: 'lift', f, seed: k, shirt: '#f4a259' }); c.restore();
      rr(c, x + 4 * s, y - 8 * s, 4 * s, 8 * s, .4, '#6b4a2b', .6); sign(c, x + 3 * s, y - 15.5 * s, 6 * s, 2.6 * s, '#1a1a1a', 'PT', '#f4a259');
    } else { // großes Glas-Studio
      box(c, x - 11 * s, y - 22 * s, 22 * s, 22 * s, '#d8e7f5'); for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) win(c, x - 9.5 * s + i * 6.6 * s, y - 20 * s + j * 8 * s, 5.6 * s, 6.5 * s, (i + j + f) % 2 === 0, '#8fb8e0');
      c.save(); c.beginPath(); c.rect(x - 9.5 * s, y - 12 * s, 5.6 * s, 6.5 * s); c.clip(); person(c, x - 6.7 * s, y - 5.5 * s, .5 * s, { pose: 'lift', f, seed: k, shirt: '#f4a259' }); c.restore();
      rr(c, x - 11.5 * s, y - 23.5 * s, 23 * s, 2 * s, .4, '#f4a259', .6);
    }
  },
  merch(c, x, y, s, v, f, k) {
    if (v === 0) { const p = person(c, x - 2 * s, y, s, { pose: 'carry', f, seed: k, shirt: '#5bc0be' }); // hält Shirt hoch
      poly(c, [[p.hand.x - 2 * s, p.hand.y - (f ? 6 : 5) * s], [p.hand.x + 2.5 * s, p.hand.y - (f ? 6 : 5) * s], [p.hand.x + 3.4 * s, p.hand.y - (f ? 4.6 : 3.6) * s], [p.hand.x + 2.2 * s, p.hand.y - (f ? 4 : 3) * s], [p.hand.x + 2 * s, p.hand.y], [p.hand.x - 1.6 * s, p.hand.y], [p.hand.x - 1.8 * s, p.hand.y - (f ? 4 : 3) * s], [p.hand.x - 3 * s, p.hand.y - (f ? 4.6 : 3.6) * s]], '#ff5a36', .6); }
    else if (v === 1) { // Marktstand mit Kleiderstange
      box(c, x - 8 * s, y - 7 * s, 16 * s, 7 * s, '#c9a36b'); ln(c, x - 7 * s, y - 7 * s, x - 7 * s, y - 15 * s, '#555', .6 * s); ln(c, x + 7 * s, y - 7 * s, x + 7 * s, y - 15 * s, '#555', .6 * s); ln(c, x - 7 * s, y - 14.5 * s, x + 7 * s, y - 14.5 * s, '#555', .6 * s);
      ['#ff5a36', '#5bc0be', '#ffc83d', '#2a2d36'].forEach((col, i) => { const sx = x - 5.5 * s + i * 3.7 * s, sw = (f && i % 2) ? .5 * s : 0; poly(c, [[sx - 1.5 * s + sw, y - 14 * s], [sx + 1.5 * s + sw, y - 14 * s], [sx + 1.3 * s + sw, y - 9 * s], [sx - 1.3 * s + sw, y - 9 * s]], col, .5); });
      sign(c, x - 4 * s, y - 5.5 * s, 8 * s, 2.6 * s, '#fbf5e6', '10 €', '#1a1a1a');
    } else if (v === 2) { // Laden mit Markise und Schaufenster
      box(c, x - 10 * s, y - 17 * s, 20 * s, 17 * s, '#9fd3c7'); awning(c, x - 10 * s, y - 13 * s, 20 * s, 2.2 * s, '#ff5a36', '#fbf5e6');
      rr(c, x - 8 * s, y - 9.5 * s, 9 * s, 7 * s, .4, '#e8f6ff', .6); poly(c, [[x - 6 * s, y - 8.5 * s], [x - 2 * s, y - 8.5 * s], [x - 2.4 * s, y - 4 * s], [x - 5.6 * s, y - 4 * s]], f ? '#ff5a36' : '#ffc83d', .5);
      rr(c, x + 3 * s, y - 8 * s, 4 * s, 8 * s, .4, '#2a5a58', .6); sign(c, x - 7 * s, y - 16.5 * s, 14 * s, 3 * s, '#1a1a1a', 'MERCH', '#5bc0be');
    } else { // Flagship-Store mit LED-Wand
      box(c, x - 11 * s, y - 23 * s, 22 * s, 23 * s, '#2a2d36'); rr(c, x - 9.5 * s, y - 21.5 * s, 19 * s, 6 * s, .4, f ? '#5bc0be' : '#3fa3a1', .6);
      c.fillStyle = '#ffc83d'; c.font = `700 ${3.6 * s}px Arial`; c.textAlign = 'center'; c.fillText('MUSKEL', x, y - 17.3 * s);
      rr(c, x - 9 * s, y - 13 * s, 18 * s, 11 * s, .4, '#d6f0ff', .6); for (let i = 0; i < 3; i++) poly(c, [[x - 7 * s + i * 5.5 * s, y - 12 * s], [x - 3.6 * s + i * 5.5 * s, y - 12 * s], [x - 3.9 * s + i * 5.5 * s, y - 6 * s], [x - 6.7 * s + i * 5.5 * s, y - 6 * s]], ['#ff5a36', '#ffc83d', '#5bc0be'][i], .5);
    }
  },
  coach(c, x, y, s, v, f, k) {
    if (v === 0) { // Laptop auf Kiste
      box(c, x - 6 * s, y - 5 * s, 12 * s, 5 * s, '#a07850'); poly(c, [[x - 5 * s, y - 5 * s], [x + 5 * s, y - 5 * s], [x + 6 * s, y - 6 * s], [x - 6 * s, y - 6 * s]], '#9aa0aa', .6);
      rr(c, x - 4.5 * s, y - 13 * s, 9 * s, 7 * s, .6, '#2a2d36', .7); rr(c, x - 3.8 * s, y - 12.3 * s, 7.6 * s, 5.6 * s, .3, f ? '#c9b6ff' : '#9d8df1', 0);
      person(c, x - .2 * s, y - 7 * s, .3 * s, { pose: f ? 'lift' : 'stand', f, seed: k, shirt: '#fff' });
    } else if (v === 1) { // Schreibtisch mit Monitor und Coach
      rr(c, x - 9 * s, y - 6 * s, 14 * s, 1.4 * s, .3, '#6b4a2b', .6); ln(c, x - 8 * s, y - 4.6 * s, x - 8 * s, y, '#4a3020', .8 * s); ln(c, x + 4 * s, y - 4.6 * s, x + 4 * s, y, '#4a3020', .8 * s);
      rr(c, x - 7 * s, y - 14 * s, 9 * s, 7 * s, .6, '#222', .7); rr(c, x - 6.3 * s, y - 13.3 * s, 7.6 * s, 5.6 * s, .3, f ? '#c9b6ff' : '#9d8df1', 0); ln(c, x - 2.5 * s, y - 7 * s, x - 2.5 * s, y - 6 * s, '#222', .8 * s);
      person(c, x + 6 * s, y, .9 * s, { pose: f ? 'wave' : 'stand', f, seed: k, shirt: '#9d8df1' });
    } else if (v === 2) { // Studio mit Ringlicht, Stativ und Kamera
      ln(c, x - 5 * s, y, x - 5 * s, y - 13 * s, '#444', .7 * s); c.strokeStyle = f ? '#ffffff' : '#e8e8e8'; c.lineWidth = 1.3 * s; c.beginPath(); c.arc(x - 5 * s, y - 15 * s, 3.2 * s, 0, TAU); c.stroke(); c.strokeStyle = INK; c.lineWidth = .5; c.stroke();
      if (f) { c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.arc(x - 5 * s, y - 15 * s, 5 * s, 0, TAU); c.fill(); }
      person(c, x + 3 * s, y, s, { pose: 'lift', f, seed: k, shirt: '#9d8df1' }); rr(c, x - 6.5 * s, y - 13 * s, 3 * s, 2 * s, .3, '#222', .5);
    } else { // Sende-Studio mit „LIVE“-Licht
      box(c, x - 11 * s, y - 20 * s, 22 * s, 20 * s, '#2a2d36'); rr(c, x - 9 * s, y - 17 * s, 13 * s, 10 * s, .5, f ? '#c9b6ff' : '#9d8df1', .6);
      c.save(); c.beginPath(); c.rect(x - 9 * s, y - 17 * s, 13 * s, 10 * s); c.clip(); person(c, x - 2.5 * s, y - 7 * s, .7 * s, { pose: 'wave', f, seed: k, shirt: '#ffc83d' }); c.restore();
      rr(c, x + 5.5 * s, y - 17 * s, 4 * s, 2.5 * s, .5, f ? '#ff3b3b' : '#5a1010', .5); c.fillStyle = '#fff'; c.font = `700 ${1.6 * s}px Arial`; c.textAlign = 'center'; c.fillText('LIVE', x + 7.5 * s, y - 15.3 * s);
      ln(c, x + 7.5 * s, y - 20 * s, x + 7.5 * s, y - 23 * s, '#888', .5 * s); ell(c, x + 7.5 * s, y - 23.5 * s, .8 * s, .8 * s, f ? '#ff3b3b' : '#888', .4);
    }
  },
  supp(c, x, y, s, v, f, k) {
    if (v === 0) { // Shaker mit Pulver-Wolke
      rr(c, x - 2.6 * s, y - 11 * s, 5.2 * s, 11 * s, 1 * s, '#e07a5f', .8); rr(c, x - 2.8 * s, y - 12.6 * s, 5.6 * s, 2 * s, .6, '#333', .6); c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(x - 1.8 * s, y - 9.5 * s, .7 * s, 7 * s);
      c.fillStyle = '#fff'; c.font = `700 ${2 * s}px Arial`; c.textAlign = 'center'; c.fillText('WHEY', x, y - 5 * s); if (f) for (let i = 0; i < 4; i++) ell(c, x + (i - 1.5) * 1.6 * s, y - 14 * s - (i % 2) * s, .9 * s, .9 * s, 'rgba(240,230,210,.9)', 0);
    } else if (v === 1) { // Dosen-Pyramide mit Etiketten
      const can = (cx, cy, col) => { rr(c, cx - 2 * s, cy - 5 * s, 4 * s, 5 * s, .6, col, .6); rr(c, cx - 2.1 * s, cy - 5.6 * s, 4.2 * s, 1 * s, .4, '#2a2a2a', .5); c.fillStyle = '#fff'; c.fillRect(cx - 1.4 * s, cy - 3.4 * s, 2.8 * s, 1.4 * s); };
      can(x - 4.4 * s, y, '#e07a5f'); can(x, y, '#2a2d36'); can(x + 4.4 * s, y, '#e07a5f'); can(x - 2.2 * s, y - 5.8 * s - (f ? .4 * s : 0), '#f2c14e'); can(x + 2.2 * s, y - 5.8 * s, '#e07a5f');
    } else { // Fabrik (klein / groß) mit Sägezahndach und Rauch
      const big = v === 3, w = big ? 22 : 18, h = big ? 12 : 9;
      box(c, x - w / 2 * s, y - h * s, w * s, h * s, '#d9c3a3'); const n = big ? 4 : 3; for (let i = 0; i < n; i++) poly(c, [[x - w / 2 * s + i * w / n * s, y - h * s], [x - w / 2 * s + (i + 1) * w / n * s, y - h * s], [x - w / 2 * s + (i + 1) * w / n * s, y - (h + 3) * s]], '#b89a78', .6);
      for (let i = 0; i < n; i++) win(c, x - w / 2 * s + (i + .25) * w / n * s, y - (h - 2) * s, w / n * .5 * s, 3 * s, (i + f) % 2 === 0);
      rr(c, x + (w / 2 - 6) * s, y - (h + (big ? 10 : 7)) * s, 3 * s, (big ? 10 : 7) * s, .3, '#8b5a3c', .6); if (big) rr(c, x - 3 * s, y - (h + 8) * s, 3 * s, 8 * s, .3, '#8b5a3c', .6);
      [[x + (w / 2 - 4.5) * s, y - (h + (big ? 10 : 7)) * s], big ? [x - 1.5 * s, y - (h + 8) * s] : null].filter(Boolean).forEach(([sx, sy]) => { for (let i = 0; i < 3; i++) ell(c, sx + (f ? i : i * .6) * 1.4 * s, sy - (i * 1.8 + (f ? 1 : 0)) * s, (1.3 + i * .5) * s, (1.1 + i * .4) * s, 'rgba(225,225,225,.85)', 0); });
      rr(c, x - 2 * s, y - 4 * s, 4 * s, 4 * s, .3, '#6b4a2b', .5); if (big) sign(c, x - 8 * s, y - (h - 1) * s, 6 * s, 2.4 * s, '#e07a5f', 'PUMP', '#fff');
    }
  },
  kette(c, x, y, s, v, f, k) { // Gym-Gebäude, wächst in Stufen, Hantel-Schild leuchtet
    const H = [12, 16, 20, 24][v], Wd = [14, 17, 19, 18][v];
    box(c, x - Wd / 2 * s, y - H * s, Wd * s, H * s, v === 3 ? '#3a3e4a' : '#f2c14e');
    const rows = Math.floor((H - 6) / 4.5); for (let j = 0; j < rows; j++) for (let i = 0; i < 3; i++) win(c, x - Wd / 2 * s + (1.4 + i * (Wd - 2.8) / 3) * s, y - H * s + (2 + j * 4.5) * s, ((Wd - 2.8) / 3 - 1) * s, 3 * s, (i + j + f) % 3 !== 0, v === 3 ? '#4a5a7a' : '#7a5a2a');
    rr(c, x - 2 * s, y - 4.5 * s, 4 * s, 4.5 * s, .3, '#2a1a10', .5);
    const dy = y - H * s - 3 * s, col = v === 3 ? (f ? '#ff5ad1' : '#7fe3ff') : '#1a1a1a'; if (v === 3) { c.shadowColor = col; c.shadowBlur = 6; }
    ln(c, x - 4 * s, dy, x + 4 * s, dy, col, 1 * s); rr(c, x - 6 * s, dy - 2 * s, 2 * s, 4 * s, .4, col, 0); rr(c, x + 4 * s, dy - 2 * s, 2 * s, 4 * s, .4, col, 0); c.shadowBlur = 0;
    if (v >= 1) person(c, x + (Wd / 2 + 2) * s, y, .75 * s, { pose: f ? 'walk' : 'stand', f, seed: k, shirt: '#ff5a36' });
  },
  app(c, x, y, s, v, f, k) {
    if (v <= 1) { // Handy mit App (und Benachrichtigung)
      rr(c, x - 4 * s, y - 15 * s, 8 * s, 15 * s, 1.4 * s, '#1a1a1a', .7); rr(c, x - 3.2 * s, y - 13.6 * s, 6.4 * s, 11.4 * s, .5, '#e8f3ff', 0);
      rr(c, x - 2.6 * s, y - 12.8 * s, 5.2 * s, 2 * s, .3, '#4ea8de', 0); for (let i = 0; i < 3; i++) rr(c, x - 2.6 * s, y - 10 * s + i * 2.4 * s, (f && i === 1 ? 5.2 : 3.6) * s, 1.4 * s, .3, i === 1 ? '#2bb673' : '#c9d6e6', 0);
      ell(c, x, y - 1.2 * s, .6 * s, .6 * s, '#444', 0); if (v === 1 && f) { ell(c, x + 3.8 * s, y - 15 * s, 1.6 * s, 1.6 * s, '#ff3b3b', .5); c.fillStyle = '#fff'; c.font = `700 ${1.8 * s}px Arial`; c.textAlign = 'center'; c.fillText('3', x + 3.8 * s, y - 14.3 * s); }
    } else { // Serverschrank bzw. Rechenzentrum mit blinkenden LEDs
      const n = v === 3 ? 3 : 1; for (let q = 0; q < n; q++) { const xx = x + (q - (n - 1) / 2) * 7.2 * s; box(c, xx - 3.2 * s, y - 20 * s, 6.4 * s, 20 * s, '#2a2d36');
        for (let j = 0; j < 6; j++) { rr(c, xx - 2.6 * s, y - 18.6 * s + j * 3 * s, 5.2 * s, 2.2 * s, .2, '#3a3e4a', 0); ell(c, xx + 1.6 * s, y - 17.5 * s + j * 3 * s, .5 * s, .5 * s, (j + q + f) % 3 ? '#2bff8a' : '#ff5a36', 0); } }
      if (v === 3) { ln(c, x - 11 * s, y - 20.5 * s, x + 11 * s, y - 20.5 * s, '#4ea8de', .8 * s); c.fillStyle = '#4ea8de'; c.font = `700 ${2 * s}px Arial`; c.textAlign = 'center'; c.fillText('CLOUD', x, y - 21.5 * s); }
    }
  },
  tv(c, x, y, s, v, f, k) {
    if (v === 0) { // Röhrenfernseher mit Antenne
      box(c, x - 7 * s, y - 11 * s, 14 * s, 10 * s, '#8b6b4a', 1.2); rr(c, x - 5.6 * s, y - 9.8 * s, 9 * s, 7.6 * s, 1.2, f ? '#bfe7f2' : '#86b0bc', .6); ell(c, x + 5 * s, y - 8 * s, .8 * s, .8 * s, '#333', .4); ell(c, x + 5 * s, y - 5 * s, .8 * s, .8 * s, '#333', .4);
      ln(c, x - 1 * s, y - 11 * s, x - 4 * s, y - 15 * s, '#555', .4 * s); ln(c, x + 1 * s, y - 11 * s, x + 4 * s, y - 15 * s, '#555', .4 * s); ln(c, x - 5 * s, y - 1 * s, x - 5 * s, y, '#333', .8 * s); ln(c, x + 5 * s, y - 1 * s, x + 5 * s, y, '#333', .8 * s);
      if (f) person(c, x - 1 * s, y - 3 * s, .35 * s, { pose: 'lift', f, seed: k, shirt: '#ff5a36' });
    } else if (v === 1) { // Kamera auf Stativ + Kameramann
      ln(c, x - 3 * s, y, x - 1 * s, y - 8 * s, '#333', .6 * s); ln(c, x + 1 * s, y, x - 1 * s, y - 8 * s, '#333', .6 * s); box(c, x - 4 * s, y - 12 * s, 7 * s, 4.4 * s, '#333'); ell(c, x + 4 * s, y - 9.8 * s, 1.8 * s, 1.8 * s, '#555', .6); ell(c, x + 4 * s, y - 9.8 * s, .9 * s, .9 * s, '#8fc7ff', 0);
      ell(c, x - 3 * s, y - 12.6 * s, .6 * s, .6 * s, f ? '#ff3b3b' : '#5a1010', 0); person(c, x - 7 * s, y, .85 * s, { pose: 'carry', f, seed: k, shirt: '#2a2d36', cap: '#1a1a1a' });
    } else if (v === 2) { // Übertragungswagen mit Schüssel
      box(c, x - 10 * s, y - 11 * s, 20 * s, 8.5 * s, '#e6e6ea', 1); rr(c, x - 9 * s, y - 9 * s, 8 * s, 2 * s, .3, '#ff5a36', 0); win(c, x + 5 * s, y - 10 * s, 4 * s, 3 * s, false, '#8fc7ff');
      ln(c, x - 2 * s, y - 11 * s, x - 2 * s, y - 15 * s, '#666', .6 * s); c.save(); c.translate(x - 2 * s, y - 16 * s); c.rotate(f ? -.3 : -.6); ell(c, 0, 0, 4 * s, 1.8 * s, '#f2f2f2', .6); c.restore();
      wheel(c, x - 6 * s, y - 2 * s, 2 * s, f); wheel(c, x + 6 * s, y - 2 * s, 2 * s, f);
    } else { // Fernsehturm mit Kugel und Blinklicht
      poly(c, [[x - 3 * s, y], [x + 3 * s, y], [x + 1 * s, y - 15 * s], [x - 1 * s, y - 15 * s]], '#c9ced4', .7); ell(c, x, y - 16 * s, 3.6 * s, 2.6 * s, '#b8c0cc', .7); for (let i = 0; i < 4; i++) win(c, x - 2.8 * s + i * 1.5 * s, y - 16.6 * s, 1.1 * s, 1 * s, (i + f) % 2 === 0);
      ln(c, x, y - 18.6 * s, x, y - 23.5 * s, '#888', .5 * s); ell(c, x, y - 23.8 * s, .7 * s, .7 * s, f ? '#ff3b3b' : '#5a1010', 0); if (f) { c.fillStyle = 'rgba(255,60,60,.25)'; c.beginPath(); c.arc(x, y - 23.8 * s, 2.2 * s, 0, TAU); c.fill(); }
    }
  },
  konzern(c, x, y, s, v, f, k) {
    const towers = v === 3 ? [[-5, 23], [5, 21]] : [[0, [12, 17, 23][v]]];
    towers.forEach(([dx, h], q) => { const w = v === 0 ? 14 : 9, bx = x + dx * s - w / 2 * s;
      box(c, bx, y - h * s, w * s, h * s, v >= 2 ? '#6f7d96' : '#8d99ae'); const rows = Math.floor((h - 2) / 2.6);
      for (let j = 0; j < rows; j++) for (let i = 0; i < (v === 0 ? 3 : 2); i++) { const ww = (w - 2) / (v === 0 ? 3 : 2) - .6; rr(c, bx + (1 + i * (ww + .6)) * s, y - h * s + (1.2 + j * 2.6) * s, ww * s, 1.6 * s, .2, (i * 7 + j * 3 + q + f) % 5 === 0 ? '#ffe9a0' : '#9fb8d6', 0); }
      if (v >= 2) { ln(c, x + dx * s, y - h * s, x + dx * s, y - (h + 2.5) * s, '#666', .4 * s); ell(c, x + dx * s, y - (h + 2.7) * s, .5 * s, .5 * s, f ? '#ff3b3b' : '#5a1010', 0); } });
    if (v === 0) { rr(c, x - 2 * s, y - 4 * s, 4 * s, 4 * s, .3, '#2a2d36', .5); sign(c, x - 5 * s, y - 13.6 * s, 10 * s, 2.2 * s, '#1a1a1a', 'PUMP AG', '#ffc83d'); }
    if (v === 3) { ln(c, x - 2 * s, y - 14 * s, x + 2 * s, y - 14 * s, '#c9ced4', 1.2 * s); sign(c, x - 4 * s, y - 3.2 * s, 8 * s, 2.4 * s, '#ffc83d', 'PUMP', '#1a1a1a'); }
  },
  space(c, x, y, s, v, f, k) {
    if (v <= 1) { // Rakete auf Startrampe (mit Feuer)
      ln(c, x - 6 * s, y, x - 6 * s, y - 18 * s, '#8a8f96', .8 * s); for (let j = 0; j < 4; j++) ln(c, x - 6 * s, y - (3 + j * 4) * s, x - 3 * s, y - (5 + j * 4) * s, '#8a8f96', .4 * s);
      poly(c, [[x, y - 22 * s], [x + 3.2 * s, y - 15 * s], [x + 3.2 * s, y - 5 * s], [x - 3.2 * s, y - 5 * s], [x - 3.2 * s, y - 15 * s]], '#fbf5e6', .8); poly(c, [[x - 3.2 * s, y - 9 * s], [x - 5.5 * s, y - 4 * s], [x - 3.2 * s, y - 5 * s]], '#ff5a36', .6); poly(c, [[x + 3.2 * s, y - 9 * s], [x + 5.5 * s, y - 4 * s], [x + 3.2 * s, y - 5 * s]], '#ff5a36', .6);
      ell(c, x, y - 15 * s, 1.5 * s, 1.5 * s, '#4ea8de', .6); c.fillStyle = 'rgba(255,255,255,.6)'; c.fillRect(x - .6 * s, y - 15.8 * s, .5 * s, .8 * s);
      if (v === 1 || f) { poly(c, [[x - 2.2 * s, y - 5 * s], [x + 2.2 * s, y - 5 * s], [x, y + (f ? 1 : -1.5) * s]], '#ffc83d', .5); if (f) poly(c, [[x - 1 * s, y - 5 * s], [x + 1 * s, y - 5 * s], [x, y - 1.5 * s]], '#fff3b0', 0); }
    } else if (v === 2) { // Raumstation mit Solarpaneelen
      for (let i = 0; i < 8; i++) { c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(x + ((i * 37) % 22 - 11) * s, y - ((i * 13) % 20) * s, .5 * s, .5 * s); }
      ln(c, x - 11 * s, y - 11 * s, x + 11 * s, y - 11 * s, '#8a8f96', .6 * s); box(c, x - 3 * s, y - 14 * s, 6 * s, 6 * s, '#c9ced4'); win(c, x - 1.5 * s, y - 12.5 * s, 3 * s, 2.6 * s, f);
      [-1, 1].forEach(d => { for (let i = 0; i < 2; i++) rr(c, x + d * (5 + i * 3.2) * s - 1.4 * s, y - 14.5 * s, 2.8 * s, 7 * s, .2, f ? '#4ea8de' : '#2a5a9a', .5); });
    } else { // Mondbasis mit Kuppel und Rover
      c.fillStyle = '#b9b9c2'; c.beginPath(); c.ellipse(x, y, 12 * s, 2 * s, 0, Math.PI, 0); c.fill(); ell(c, x - 6 * s, y - 1 * s, 1.2 * s, .5 * s, '#9a9aa4', 0);
      c.fillStyle = 'rgba(200,230,255,.55)'; c.beginPath(); c.arc(x - 1 * s, y - 1 * s, 8 * s, Math.PI, 0); c.fill(); c.strokeStyle = INK; c.lineWidth = .8; c.stroke();
      for (let i = -1; i <= 1; i++) ln(c, x - 1 * s + i * 4 * s, y - 1 * s, x - 1 * s + i * 2 * s, y - 8.4 * s, 'rgba(255,255,255,.6)', .4 * s); person(c, x - 1 * s, y - 1 * s, .55 * s, { pose: 'lift', f, seed: k, shirt: '#fbf5e6' });
      ln(c, x + 8 * s, y - 1 * s, x + 8 * s, y - 10 * s, '#888', .4 * s); poly(c, [[x + 8 * s, y - 10 * s], [x + 11.5 * s, y - 9 * s], [x + 8 * s, y - 8 * s]], f ? '#ff5a36' : '#ffc83d', .4);
    }
  }
};
MK.EMP_SPR = SPR;
/* Einheit mit Ausbau-Veredelung einmal in ein kleines Bild rendern und zwischenspeichern.
   u = Ausbaustufe 0..7: jede Stufe ändert etwas – Modell (v), Akzentfarbe, Sockel, Abzeichen, Glanz. */
const MATC = [null, '#9a6a3a', '#cd7f32', '#d4d8de', '#f2c230', '#cfeef7', '#8ff0ff', '#ff6ad5'];
const VOF = [0, 1, 1, 2, 2, 3, 3, 3];
const cache = new Map();
MK.empUnit = function (id, u, f, seed, s) {
  const dpr = Math.min(2, window.devicePixelRatio || 1), ss = Math.round(s * 20) / 20, key = id + '|' + u + '|' + f + '|' + (seed % 4) + '|' + ss + '|' + dpr;
  let e = cache.get(key); if (e) return e;
  const W = Math.ceil(34 * ss), H = Math.ceil(34 * ss), cv = document.createElement('canvas'); cv.width = Math.ceil(W * dpr); cv.height = Math.ceil(H * dpr);
  const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); const x = W / 2, y = H - 3 * ss, mat = MATC[u];
  // Sockel in Materialfarbe (ab Stufe 1)
  if (mat) { c.fillStyle = u === 7 ? (() => { const g = c.createLinearGradient(x - 12 * ss, 0, x + 12 * ss, 0); ['#ff5a5a', '#ffc83d', '#2bb673', '#4ea8de', '#9d8df1'].forEach((k, i) => g.addColorStop(i / 4, k)); return g; })() : mat;
    c.beginPath(); c.ellipse(x, y + .6 * ss, 11 * ss, 2.2 * ss, 0, 0, TAU); c.fill(); c.strokeStyle = INK; c.lineWidth = .7; c.stroke(); c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.ellipse(x - 4 * ss, y, 3 * ss, .7 * ss, 0, 0, TAU); c.fill(); }
  ACC = u >= 2 ? mat : null; SPR[id](c, x, y - (mat ? .8 * ss : 0), ss, VOF[u], f, seed); ACC = null;
  // Abzeichen ab Bronze, Glitzern ab Platin
  if (u >= 3) { const bx = x + 10 * ss, by = H - 27 * ss; c.fillStyle = mat; c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = (i % 2 ? 1.1 : 2.6) * ss; i ? c.lineTo(bx + Math.cos(a) * r, by + Math.sin(a) * r) : c.moveTo(bx + Math.cos(a) * r, by + Math.sin(a) * r); } c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = .6; c.stroke(); }
  if (u >= 5) for (let i = 0; i < 3; i++) { const sx = x + (i - 1) * 7 * ss + (f ? 1.5 * ss : 0), sy = H - (16 + i * 4 + (f ? 2 : 0)) * ss; c.fillStyle = '#fff'; c.fillRect(sx - .3 * ss, sy - 1.6 * ss, .6 * ss, 3.2 * ss); c.fillRect(sx - 1.6 * ss, sy - .3 * ss, 3.2 * ss, .6 * ss); }
  e = { cv, w: W, h: H, ox: x, oy: y }; if (cache.size > 900) cache.clear(); cache.set(key, e); return e;
};
})(window.MK);
