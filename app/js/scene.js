/* Muskelklicker – Gym-Szene: Hintergrund, Geräte, Spiegel, Publikum, NPCs, Rivale, Haustier, Effekte */
window.MK = window.MK || {};
(function (MK) {
const Sc = MK.Scene = {};
const TAU = Math.PI * 2, lerp = (a, b, t) => a + (b - a) * t, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
let cv, c, W = 0, H = 0, dpr = 1;
Sc.fx = { parts: [], pops: [], bubbles: [], targets: [], shake: 0, flash: 0, flashCol: '255,210,63' };
Sc.vis = { ph: -1, rep: 0, last: 0, idle: null, idleNext: 3, blinkT: 2, blink: false, face: null, faceUntil: 0, look: { x: 0, y: 0 }, cheer: 0 };

Sc.init = function (canvas) { cv = canvas; c = cv.getContext('2d'); Sc.resize(); addEventListener('resize', Sc.resize); };
Sc.resize = function () { const r = cv.getBoundingClientRect(); dpr = Math.min(MK.ecoOn && MK.ecoOn() ? 1.6 : 2, window.devicePixelRatio || 1, MK.dprCap || 9); W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); Sc.W = W; Sc.H = H; Sc.buildCrowd(); };
Sc.ctx = () => c;

/* ---------- Geometrie ---------- */
Sc.geo = () => { const yF = H * 0.6, pScale = Math.min(H * 0.00215, W * 0.0028), px = W * 0.5, py = H - 20; const bg = Math.min(1, W / 760) * H / 440; return { yF, pScale, px, py, bg }; };

/* ---------- Farben je Gewicht ---------- */
Sc.plateCol = i => { const k = MK.WEIGHTS[i] || 1; return k >= 60 ? '#17181e' : k >= 55 ? '#d4dae2' : k <= 2 ? '#9da3a9' : k <= 6 ? '#2fa86a' : k <= 12 ? '#f2c230' : k <= 20 ? '#2f6fe0' : k <= 30 ? '#d83a32' : k <= 40 ? '#1d1d20' : '#d9a81c'; };

/* ======================================================================
   EINFACHE PERSONEN (Publikum, NPCs) – ohne Umrisse, weich schattiert
   ====================================================================== */
function cap(x1, y1, r1, x2, y2, r2, col) { c.fillStyle = col; const a = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2, cx = Math.cos(a), cy = Math.sin(a); c.beginPath(); c.moveTo(x1 + cx * r1, y1 + cy * r1); c.lineTo(x2 + cx * r2, y2 + cy * r2); c.lineTo(x2 - cx * r2, y2 - cy * r2); c.lineTo(x1 - cx * r1, y1 - cy * r1); c.fill(); c.beginPath(); c.arc(x1, y1, r1, 0, TAU); c.arc(x2, y2, r2, 0, TAU); c.fill(); }
function circ(x, y, r, col) { c.fillStyle = col; c.beginPath(); c.arc(x, y, Math.max(.1, r), 0, TAU); c.fill(); }
function ell(x, y, rx, ry, col, rot) { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), rot || 0, 0, TAU); c.fill(); }
const M = (a, b, t) => MK.Fig.mix(a, b, t);

Sc.person = function (x, y, k, L, state, t, o) {
  o = o || {};
  const big = L.big || 0, belly = L.belly || 0, sk = L.skin, shd = M(sk, '#2a1208', .3);
  const legH = 52 * k, torsoH = 50 * k, shW = (15 + big * 6) * k, hipW = (11 + belly * 3) * k, hr = 10 * k;
  const walk = state === 'walk' ? Math.sin(t * 7) : 0;
  const hipY = y - legH, shY = hipY - torsoH, headY = shY - hr - 3 * k;
  const pants = L.pants, shirt = L.shirt;
  // Schatten
  ell(x, y + 1, 18 * k, 4 * k, 'rgba(0,0,0,.18)');
  // Beine
  [-1, 1].forEach((s, i) => { const off = (i ? walk : -walk) * 6 * k; cap(x + s * 5 * k, hipY, 6 * k, x + s * 6 * k + off, y - 4 * k, 4.5 * k, pants); ell(x + s * 7 * k + off, y - 2 * k, 7 * k, 3.5 * k, '#e9e5dc'); });
  // Rumpf
  c.fillStyle = shirt; c.beginPath(); c.moveTo(x - shW, shY + 3 * k); c.quadraticCurveTo(x - shW - 2 * k, hipY - torsoH * .4, x - hipW - belly * 6 * k, hipY - 6 * k); c.lineTo(x - hipW, hipY + 4 * k); c.lineTo(x + hipW, hipY + 4 * k); c.lineTo(x + hipW + belly * 6 * k, hipY - 6 * k); c.quadraticCurveTo(x + shW + 2 * k, hipY - torsoH * .4, x + shW, shY + 3 * k); c.quadraticCurveTo(x, shY - 3 * k, x - shW, shY + 3 * k); c.fill();
  const g = c.createLinearGradient(x - shW, 0, x + shW, 0); g.addColorStop(0, 'rgba(255,255,255,.12)'); g.addColorStop(1, 'rgba(0,0,0,.2)'); c.fillStyle = g; c.fill();
  c.fillStyle = pants; c.fillRect(x - hipW - 1, hipY - 3 * k, hipW * 2 + 2, 7 * k);
  // Arme nach Zustand
  const arm = (s, ex, ey, hx, hy) => { const sx = x + s * (shW - 2 * k), sy = shY + 5 * k; const sleeve = L.tank ? sk : shirt; cap(sx, sy, 4.6 * k + big * 1.5 * k, ex, ey, 3.8 * k + big * k, sleeve); cap(ex, ey, 3.8 * k + big * k, hx, hy, 3 * k, sk); circ(hx, hy, 3.6 * k, sk); return { x: hx, y: hy }; };
  let hands = {};
  const sY = shY + 5 * k, A = (s, ax, ay, bx, by) => arm(s, x + s * ax * k, sY + ay * k, x + s * bx * k, sY + by * k);
  const wv = Math.sin(t * 9);
  switch (state) {
    case 'phone': hands.l = A(-1, 15, 20, 4, 24); hands.r = A(1, 15, 20, 4, 24); break;
    case 'watch': A(-1, 17, 18, -8, 20); A(1, 17, 18, -8, 16); break;
    case 'cheer': hands.l = A(-1, 22, -12, 26 + wv * 3, -36); hands.r = A(1, 22, -12, 26 - wv * 3, -36); break;
    case 'clap': { const cl = Math.abs(Math.sin(t * 10)) * 6; A(-1, 16, 18, 3 + cl, 12); A(1, 16, 18, 3 + cl, 12); break; }
    case 'film': hands.r = A(1, 18, 4, 10, -10); A(-1, 15, 22, 13, 40); break;
    case 'point': hands.r = A(1, 22, 6, 40, 4); A(-1, 15, 20, 10, 30); break;
    case 'laugh': A(-1, 16, 20, 2, 32); A(1, 16, 20, 2, 32); break;
    case 'flex': A(-1, 26, 0, 26, -18); A(1, 26, 0, 26, -18); break;
    case 'mop': hands.l = A(-1, 14, 20, 6, 30); hands.r = A(1, 14, 18, 8, 16); break;
    case 'walk': A(-1, 15, 22, 15 - walk * 6, 42); A(1, 15, 22, 15 + walk * 6, 42); break;
    case 'band': { const p = Math.sin(t * 3) * .5 + .5; hands.l = A(-1, 18 + p * 6, 6, 20 + p * 14, 4); hands.r = A(1, 18 + p * 6, 6, 20 + p * 14, 4); break; }
    default: A(-1, 15, 22, 14, 42); A(1, 15, 22, 14, 42);
  }
  // Kopf
  cap(x, shY + 2 * k, 4 * k + big * k, x, headY + 4 * k, 3.6 * k, sk);
  const lookX = clamp((o.lookAt != null ? o.lookAt - x : 0) / 200, -1, 1) * 2 * k, down = state === 'phone' ? 2 * k : 0;
  if (L.long) { c.fillStyle = L.hair; c.beginPath(); c.ellipse(x, headY + 6 * k, hr + 3 * k, hr + 8 * k, 0, 0, TAU); c.fill(); }
  if (L.bun) circ(x, headY - hr - 1 * k, 4.6 * k, L.hair);
  ell(x, headY, hr * .9, hr, sk);
  const hg = c.createRadialGradient(x - 3 * k, headY - 3 * k, 1, x, headY, hr); hg.addColorStop(0, 'rgba(255,255,255,.15)'); hg.addColorStop(1, 'rgba(0,0,0,.12)'); c.fillStyle = hg; c.beginPath(); c.ellipse(x, headY, hr * .9, hr, 0, 0, TAU); c.fill();
  if (o.back) { if (!L.bald) { c.fillStyle = L.hair; c.beginPath(); c.ellipse(x, headY - 1 * k, hr * .95, hr * .98, 0, 0, TAU); c.fill(); } }
  else {
    if (!L.bald) { c.fillStyle = L.hair; c.beginPath(); c.ellipse(x, headY - 3 * k, hr * .95, hr * .78, 0, Math.PI, 0); c.fill(); }
    else { c.fillStyle = L.hair; c.fillRect(x - hr * .95, headY - 2 * k, 2.5 * k, 5 * k); c.fillRect(x + hr * .95 - 2.5 * k, headY - 2 * k, 2.5 * k, 5 * k); }
    circ(x - 3.5 * k + lookX, headY + 1 * k + down, 1.1 * k, '#2a1810'); circ(x + 3.5 * k + lookX, headY + 1 * k + down, 1.1 * k, '#2a1810');
    c.strokeStyle = '#5a1a14'; c.lineWidth = 1.2 * k; c.beginPath();
    if (state === 'laugh' || state === 'cheer' || state === 'point') { c.fillStyle = '#5a1a14'; c.ellipse(x + lookX * .5, headY + 5 * k, 3 * k, 2.2 * k, 0, 0, Math.PI); c.fill(); }
    else if (state === 'watch' && o.mood > 0) { c.arc(x + lookX * .5, headY + 4 * k, 2.5 * k, .3, Math.PI - .3); c.stroke(); }
    else { c.moveTo(x - 2.4 * k + lookX * .5, headY + 5.5 * k); c.lineTo(x + 2.4 * k + lookX * .5, headY + 5.5 * k); c.stroke(); }
  }
  // Requisiten
  if (hands.r && (state === 'film' || state === 'phone')) { const h = hands.r; c.fillStyle = '#16161a'; c.fillRect(h.x - 3.5 * k, h.y - 6 * k, 7 * k, 11 * k); c.fillStyle = state === 'film' ? 'rgba(160,220,255,.9)' : 'rgba(120,180,255,.75)'; c.fillRect(h.x - 2.6 * k, h.y - 5 * k, 5.2 * k, 9 * k); if (state === 'film' && Math.sin(t * 6) > 0) circ(h.x + 2 * k, h.y - 7.5 * k, 1.4 * k, '#ff3b30'); }
  if (state === 'mop' && hands.l) { c.strokeStyle = '#8a6a44'; c.lineWidth = 2.2 * k; c.beginPath(); c.moveTo(hands.r.x, hands.r.y); c.lineTo(hands.l.x + 8 * k, y - 2 * k); c.stroke(); ell(hands.l.x + 9 * k, y - 2 * k, 9 * k, 3 * k, '#d8d2c2'); ell(x + 26 * k, y + 2 * k, 14 * k, 2.5 * k, 'rgba(120,170,200,.35)'); }
  if (state === 'band' && hands.l) { c.strokeStyle = '#ff6b6b'; c.lineWidth = 3 * k; c.beginPath(); c.moveTo(hands.l.x, hands.l.y); c.lineTo(hands.r.x, hands.r.y); c.stroke(); }
  return { head: { x, y: headY - hr }, x, y };
};

/* ======================================================================
   GERÄTE (Material je Stufe)
   ====================================================================== */
function mat(id) { const l = MK.S.eq[id] || 1; return MK.MATERIAL[clamp(l - 1, 0, MK.MATERIAL.length - 1)]; }
function metal(x, y, w, h, m, vertical) { const g = vertical ? c.createLinearGradient(x, 0, x + w, 0) : c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, m.b); g.addColorStop(.18, m.hi); g.addColorStop(.3, m.name === 'Rostig' ? m.hi : '#f4f6f8'); g.addColorStop(.42, m.a); g.addColorStop(.85, m.b); g.addColorStop(1, 'rgba(0,0,0,.6)'); c.fillStyle = g; c.fillRect(x, y, w, h); }
const EQDRAW = {
  hanteln(x, y, k) { const m = mat('hanteln'); metal(x - 46 * k, y - 46 * k, 4 * k, 46 * k, m, 1); metal(x + 42 * k, y - 46 * k, 4 * k, 46 * k, m, 1); metal(x - 48 * k, y - 46 * k, 96 * k, 4 * k, m); metal(x - 48 * k, y - 22 * k, 96 * k, 4 * k, m);
    const n = clamp(wgEq('hanteln') + 1, 1, 12); for (let i = 0; i < n; i++) { const row = i < 6 ? 0 : 1, col = i % 6, dx = x - 38 * k + col * 15.5 * k, dy = y - (row ? 50 : 26) * k, r = (3.5 + i * .35) * k, pc = Sc.plateCol(i); c.fillStyle = '#6d7076'; c.fillRect(dx - 1 * k, dy - 1 * k, 10 * k, 2 * k); circ(dx - 1 * k, dy, r, pc); circ(dx + 9 * k, dy, r, pc); } },
  seil(x, y, k) { const yy = y - 120 * k; metal(x - 2 * k, yy - 2 * k, 4 * k, 8 * k, mat('seil')); c.strokeStyle = '#2a2a2e'; c.lineWidth = 2 * k; for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(x, yy + 18 * k, (9 + i * 2) * k, (16 + i) * k, 0, 0, TAU); c.stroke(); } c.fillStyle = '#d83a32'; c.fillRect(x - 3 * k, yy + 30 * k, 6 * k, 10 * k); },
  langhantel(x, y, k) { const m = mat('langhantel'); metal(x - 2 * k, y - 60 * k, 5 * k, 60 * k, m, 1); metal(x - 14 * k, y - 4 * k, 30 * k, 4 * k, m); const n = clamp(Math.floor(wgEq('langhantel') / 2) + 1, 1, 8); for (let i = 0; i < n; i++) { prr(x + 1 * k + (i % 2 ? 6 : -6) * k, y - (10 + Math.floor(i / 2) * 14) * k, 3.5 * k, (11 - i * .5) * k, Sc.plateCol(i * 2 + 2)); }
    metal(x + 14 * k, y - 12 * k, 70 * k, 3 * k, m); prr(x + 22 * k, y - 10 * k, 3 * k, 10 * k, Sc.plateCol(Math.min(MK.WEIGHTS.length - 1, wgEq('langhantel')))); prr(x + 78 * k, y - 10 * k, 3 * k, 10 * k, Sc.plateCol(Math.min(MK.WEIGHTS.length - 1, wgEq('langhantel')))); },
  bank(x, y, k) { const m = mat('bank'); metal(x - 30 * k, y - 18 * k, 4 * k, 18 * k, m, 1); metal(x + 26 * k, y - 18 * k, 4 * k, 18 * k, m, 1); c.fillStyle = MK.S.eq.bank >= 4 ? '#2a1d0a' : '#2a2a30'; c.beginPath(); c.roundRect(x - 36 * k, y - 26 * k, 72 * k, 9 * k, 4 * k); c.fill(); c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(x - 34 * k, y - 25 * k, 68 * k, 2 * k); },
  boombox(x, y, k, t) { // größer, auf einem Hocker, anklickbar
    const S = MK.S, on = S.music.on, m = mat('boombox'), K = k * 1.75, st = Sc._boomOnBar ? 0 : 26 * k, by = y - st, song = MK.MUSIC.find(z => z.id === S.music.cur) || MK.MUSIC[0];
    if (st) { c.fillStyle = '#3a3c42'; c.fillRect(x - 18 * k, y - st, 36 * k, 4 * k); c.fillRect(x - 15 * k, y - st, 4 * k, st); c.fillRect(x + 11 * k, y - st, 4 * k, st); }
    const beat = on ? Math.max(0, Math.sin(t * song.bpm / 60 * Math.PI)) : 0, pulse = 1 + beat * .14;
    c.save(); c.translate(x, by); c.scale(1 + beat * .02, 1 - beat * .02);
    c.fillStyle = '#26262c'; c.strokeStyle = '#111'; c.lineWidth = 1.5; c.beginPath(); c.roundRect(-26 * K, -26 * K, 52 * K, 26 * K, 4 * K); c.fill(); c.stroke();
    c.strokeStyle = m.a; c.lineWidth = 2.6 * K; c.beginPath(); c.moveTo(-16 * K, -26 * K); c.lineTo(-13 * K, -33 * K); c.lineTo(13 * K, -33 * K); c.lineTo(16 * K, -26 * K); c.stroke();
    [-1, 1].forEach(s2 => { circ(s2 * 14 * K, -12 * K, 8.5 * K * pulse, '#0e0e10'); circ(s2 * 14 * K, -12 * K, 5.5 * K * pulse, '#3a3c42'); circ(s2 * 14 * K, -12 * K, 2.5 * K, m.a); });
    c.fillStyle = '#0e1a14'; c.fillRect(-6 * K, -22 * K, 12 * K, 7 * K); c.fillStyle = on ? '#2affb0' : '#3b5b4b';
    for (let i = 0; i < 4; i++) { const hgt = on ? (2 + Math.abs(Math.sin(t * 7 + i * 1.7)) * 4) * K : 1 * K; c.fillRect(-5 * K + i * 2.6 * K, -15.5 * K - hgt, 1.8 * K, hgt); }
    c.fillStyle = on ? '#d83a32' : '#555'; c.beginPath(); c.arc(0, -6 * K, 2 * K, 0, TAU); c.fill();
    c.restore();
    Sc.boomRect = { x: x - 28 * K, y: by - 36 * K, w: 56 * K, h: 36 * K + st };
    if (on && Math.random() < .05 + beat * .05) Sc.particle('note', x + rnd(-20, 20) * K, by - 34 * K);
    if (Sc.boomHint > 0) { Sc.boomHint -= 1 / 60; Sc.pill(x, by - 46 * K, on ? song.name : 'Musik aus', '', on ? '#b28cff' : '#888', on ? '♪' : '🔇'); } },
  barren(x, y, k) { const m = mat('barren'); [-1, 1].forEach(s => { metal(x + s * 16 * k - 2 * k, y - 62 * k, 4 * k, 62 * k, m, 1); }); metal(x - 22 * k, y - 64 * k, 44 * k, 4 * k, m); metal(x - 22 * k, y - 58 * k, 44 * k, 2 * k, m); },
  stange(x, y, k) { const m = mat('stange'), yy = y - 150 * k; metal(x - 42 * k, yy, 84 * k, 4 * k, m); [-1, 1].forEach(s => metal(x + s * 34 * k - 3 * k, yy - 6 * k, 6 * k, 14 * k, m, 1)); },
  kabel(x, y, k) { const m = mat('kabel'); metal(x - 18 * k, y - 140 * k, 6 * k, 140 * k, m, 1); metal(x + 12 * k, y - 140 * k, 6 * k, 140 * k, m, 1); metal(x - 18 * k, y - 142 * k, 36 * k, 6 * k, m);
    const n = clamp(Math.floor(wgEq('kabel') * .6) + 2, 2, 12); for (let i = 0; i < n; i++) { c.fillStyle = i % 2 ? '#2a2a2e' : '#34343a'; c.fillRect(x - 10 * k, y - (8 + i * 5) * k, 20 * k, 4.4 * k); } c.strokeStyle = '#1a1a1a'; c.lineWidth = 1.2 * k; c.beginPath(); c.moveTo(x, y - 138 * k); c.lineTo(x, y - (10 + n * 5) * k); c.stroke(); circ(x, y - 132 * k, 4 * k, m.b); },
  rack(x, y, k) { const m = mat('rack'); [-1, 1].forEach(s => metal(x + s * 30 * k - 3 * k, y - 130 * k, 6 * k, 130 * k, m, 1)); metal(x - 33 * k, y - 132 * k, 66 * k, 5 * k, m); metal(x - 33 * k, y - 4 * k, 66 * k, 4 * k, m);
    metal(x - 58 * k, y - 92 * k, 116 * k, 3.5 * k, MK.MATERIAL[1]); [-1, 1].forEach(s => { for (let i = 0; i < Math.min(4, 1 + Math.floor(wgEq('rack') / 4)); i++) prr(x + s * (50 + i * 4) * k, y - 90 * k, 2.2 * k, (14 - i) * k, Sc.plateCol(Math.min(MK.WEIGHTS.length - 1, wgEq('rack') - i * 2))); }); },
  laufband(x, y, k) { const m = mat('laufband'); c.fillStyle = '#1f1f24'; c.beginPath(); c.moveTo(x - 46 * k, y); c.lineTo(x + 46 * k, y); c.lineTo(x + 38 * k, y - 10 * k); c.lineTo(x - 38 * k, y - 10 * k); c.fill(); metal(x - 36 * k, y - 80 * k, 4 * k, 72 * k, m, 1); metal(x + 32 * k, y - 80 * k, 4 * k, 72 * k, m, 1);
    c.fillStyle = '#2a2a30'; c.beginPath(); c.roundRect(x - 26 * k, y - 92 * k, 52 * k, 16 * k, 3 * k); c.fill(); c.fillStyle = '#2affb0'; c.fillRect(x - 14 * k, y - 87 * k, 28 * k, 5 * k); },
  kuehl(x, y, k) { Sc.kuehlRect = { x: x - 26 * k, y: y - 108 * k, w: 52 * k, h: 110 * k }; const m = mat('kuehl'); c.fillStyle = MK.S.eq.kuehl >= 4 ? '#d9b343' : '#e8e8ea'; c.beginPath(); c.roundRect(x - 22 * k, y - 104 * k, 44 * k, 104 * k, 4 * k); c.fill(); c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(x - 22 * k, y - 66 * k, 44 * k, 2 * k); metal(x + 14 * k, y - 96 * k, 3 * k, 22 * k, m, 1); metal(x + 14 * k, y - 58 * k, 3 * k, 30 * k, m, 1); c.fillStyle = '#d83a32'; c.fillRect(x - 12 * k, y - 90 * k, 8 * k, 8 * k); },
  hack(x, y, k) { const m = mat('hack'); [-1, 1].forEach(s2 => { c.fillStyle = m.b; c.beginPath(); c.moveTo(x + s2 * 26 * k, y); c.lineTo(x + s2 * 18 * k, y - 120 * k); c.lineTo(x + s2 * 13 * k, y - 120 * k); c.lineTo(x + s2 * 21 * k, y); c.fill(); });
    c.fillStyle = '#2a2a30'; c.fillRect(x - 24 * k, y - 78 * k, 48 * k, 8 * k); c.fillRect(x - 30 * k, y - 6 * k, 60 * k, 6 * k); [-1, 1].forEach(s2 => plateSide(x + s2 * 26 * k, y - 74 * k, s2, platesFor(Math.min(50, 5 + wgEq('hack') * 2.5), .6), k, false)); },
  reifen(x, y, k) { ell(x, y - 46 * k, 18 * k, 46 * k, '#1a1a1c'); ell(x, y - 46 * k, 10 * k, 30 * k, '#2a2a2e'); c.strokeStyle = 'rgba(255,255,255,.08)'; c.lineWidth = 2 * k; for (let i = 0; i < 8; i++) { c.beginPath(); c.moveTo(x - 16 * k, y - (14 + i * 9) * k); c.lineTo(x - 11 * k, y - (14 + i * 9) * k); c.stroke(); } }
};
/* Gewichtsstufe der Muskelgruppe(n), die ein Gerät benutzen → Scheiben am Gerät wachsen mit den Upgrades */
function wgEq(id) { const gs = [...new Set(MK.EXERCISES.filter(e => e.eq === id).map(e => e.g))]; return gs.length ? Math.max(...gs.map(g => MK.wg ? MK.wg(g) : 1)) : Math.max(1, MK.S.wset || 1); }
function stackW(x, yTop, yBot, k, n) { // Gewichtsblock im Hintergrund: dicke schwarze Platten, eckig mit leicht runden Ecken
  const N = 9, ph = 6.4 * k, gap = 1.1 * k, w = 24 * k, nn = Math.max(1, Math.min(N, n));
  c.fillStyle = '#5c6068'; c.fillRect(x - w / 2 - 3 * k, yTop, 2.4 * k, yBot - yTop); c.fillRect(x + w / 2 + .6 * k, yTop, 2.4 * k, yBot - yTop);
  for (let i = 0; i < N; i++) { const yy = yBot - (i + 1) * (ph + gap), on = i >= N - nn; const g = c.createLinearGradient(0, yy, 0, yy + ph); g.addColorStop(0, on ? '#3d4048' : '#2c2e34'); g.addColorStop(.55, '#1f2126'); g.addColorStop(1, '#0f1013'); c.fillStyle = g; c.beginPath(); c.roundRect(x - w / 2, yy, w, ph, 1.6 * k); c.fill();
    c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(x - w / 2 + 1.5 * k, yy + .5, w - 3 * k, Math.max(.7, .8 * k)); }
  const ty = yBot - (N - nn + 1) * (ph + gap), top = yBot - N * (ph + gap); c.fillStyle = '#d83a32'; c.beginPath(); c.roundRect(x + w / 2 - 3 * k, ty + ph * .3, 7 * k, ph * .45, 1.2 * k); c.fill();
  c.strokeStyle = '#1a1a1a'; c.lineWidth = 1.2 * k; c.beginPath(); c.moveTo(x, yTop); c.lineTo(x, top); c.stroke(); }
let WREC = null; // während die Gewichte des Spielers gezeichnet werden: Positionen sammeln (für den Gold-Effekt genau auf dem Gewicht)
function wrec(x, y, r) { if (!WREC) return; const m = c.getTransform(); WREC.push({ x: (m.a * x + m.c * y + m.e) / dpr, y: (m.b * x + m.d * y + m.f) / dpr, r: r * Math.hypot(m.a, m.b) / dpr }); }
function platesRow(x, y, k, n, dir, wg) { wrec(x + dir * n * 2.3 * k, y, 10 * k); for (let i = 0; i < n; i++) prr(x + dir * i * 4.6 * k, y, 1.6 * k, (8 + Math.min(8, wg * .45) - i * .4) * k, Sc.plateCol(Math.max(0, Math.min(MK.WEIGHTS.length - 1, wg - i * 2)))); }
Object.assign(EQDRAW, {
  butterfly(x, y, k) { const m = mat('butterfly'), w = wgEq('butterfly'); metal(x - 30 * k, y - 120 * k, 5 * k, 120 * k, m, 1); metal(x + 25 * k, y - 120 * k, 5 * k, 120 * k, m, 1); metal(x - 32 * k, y - 122 * k, 64 * k, 5 * k, m);
    c.fillStyle = '#26262c'; c.beginPath(); c.roundRect(x - 9 * k, y - 82 * k, 18 * k, 34 * k, 4 * k); c.fill(); c.beginPath(); c.roundRect(x - 12 * k, y - 46 * k, 24 * k, 7 * k, 3 * k); c.fill(); metal(x - 2 * k, y - 40 * k, 4 * k, 40 * k, m, 1);
    [-1, 1].forEach(s2 => { c.fillStyle = '#26262c'; c.beginPath(); c.roundRect(x + s2 * 15 * k - 4 * k, y - 96 * k, 8 * k, 30 * k, 3 * k); c.fill(); }); stackW(x + 44 * k, y - 120 * k, y, k * .8, clamp(2 + Math.floor(w * .55), 2, 12)); },
  matte(x, y, k) { [0, 1, 2].forEach(i => { ell(x - 10 * k + i * 10 * k, y - 10 * k, 6 * k, 10 * k, ['#2f6fa8', '#d83a32', '#2bb673'][i]); ell(x - 10 * k + i * 10 * k, y - 10 * k, 2 * k, 4 * k, 'rgba(0,0,0,.35)'); }); metal(x - 18 * k, y - 2 * k, 36 * k, 2 * k, mat('matte')); },
  latzug(x, y, k) { const m = mat('latzug'), w = wgEq('latzug'); metal(x - 4 * k, y - 160 * k, 8 * k, 160 * k, m, 1); metal(x - 34 * k, y - 162 * k, 40 * k, 5 * k, m); c.strokeStyle = '#111'; c.lineWidth = 1.2 * k; c.beginPath(); c.moveTo(x - 30 * k, y - 157 * k); c.lineTo(x - 30 * k, y - 120 * k); c.stroke();
    metal(x - 52 * k, y - 122 * k, 44 * k, 3 * k, MK.MATERIAL[1]); c.fillStyle = '#26262c'; c.beginPath(); c.roundRect(x - 40 * k, y - 46 * k, 26 * k, 7 * k, 3 * k); c.fill(); metal(x - 30 * k, y - 40 * k, 4 * k, 40 * k, m, 1); stackW(x + 14 * k, y - 150 * k, y, k * .8, clamp(2 + Math.floor(w * .55), 2, 12)); },
  wadenblock(x, y, k) { const w = wgEq('wadenblock'); c.fillStyle = '#2a2a30'; c.beginPath(); c.roundRect(x - 26 * k, y - 12 * k, 52 * k, 12 * k, 3 * k); c.fill(); c.fillStyle = '#4fbf6a'; c.fillRect(x - 24 * k, y - 12 * k, 48 * k, 3 * k); platesRow(x - 34 * k, y - 10 * k, k * .7, clamp(1 + Math.floor(w / 4), 1, 5), -1, w); },
  seilzug(x, y, k) { const m = mat('seilzug'), w = wgEq('seilzug'); metal(x - 3 * k, y - 140 * k, 6 * k, 140 * k, m, 1); metal(x - 16 * k, y - 142 * k, 22 * k, 5 * k, m); c.strokeStyle = '#2a2a2e'; c.lineWidth = 2.4 * k; c.beginPath(); c.moveTo(x - 12 * k, y - 137 * k); c.lineTo(x - 12 * k, y - 96 * k); c.stroke();
    ell(x - 15 * k, y - 92 * k, 3 * k, 5 * k, '#d83a32'); ell(x - 9 * k, y - 92 * k, 3 * k, 5 * k, '#d83a32'); stackW(x + 16 * k, y - 132 * k, y, k * .8, clamp(2 + Math.floor(w * .55), 2, 12)); },
  trizepsbank(x, y, k) { const m = mat('trizepsbank'); metal(x - 22 * k, y - 18 * k, 4 * k, 18 * k, m, 1); metal(x + 18 * k, y - 18 * k, 4 * k, 18 * k, m, 1); c.fillStyle = '#2a2a30'; c.beginPath(); c.roundRect(x - 26 * k, y - 26 * k, 52 * k, 9 * k, 3 * k); c.fill();
    c.save(); c.translate(x + 20 * k, y - 26 * k); c.rotate(-1.35); c.beginPath(); c.roundRect(0, -4 * k, 46 * k, 9 * k, 3 * k); c.fill(); c.restore(); const w = wgEq('trizepsbank'); dumbbell(x - 34 * k, y - 6 * k, k * .8, MK.WEIGHTS[w], true, true); },
  haenge(x, y, k) { const m = mat('haenge'); [-1, 1].forEach(s2 => metal(x + s2 * 22 * k - 3 * k, y - 170 * k, 6 * k, 170 * k, m, 1)); metal(x - 28 * k, y - 172 * k, 56 * k, 5 * k, m);
    c.fillStyle = '#26262c'; c.beginPath(); c.roundRect(x - 8 * k, y - 140 * k, 16 * k, 50 * k, 4 * k); c.fill(); [-1, 1].forEach(s2 => { c.beginPath(); c.roundRect(x + s2 * 16 * k - 7 * k, y - 112 * k, 14 * k, 6 * k, 2 * k); c.fill(); }); },
  farmer(x, y, k) { const m = mat('farmer'), w = wgEq('farmer'); [-1, 1].forEach(s2 => { const xx = x + s2 * 18 * k; metal(xx - 3 * k, y - 46 * k, 6 * k, 40 * k, m, 1); metal(xx - 6 * k, y - 48 * k, 12 * k, 4 * k, m); for (let i = 0; i < clamp(1 + Math.floor(w / 3), 1, 6); i++) ell(xx, y - 8 * k - i * 3.5 * k, (10 + Math.min(6, w * .3)) * k, 2.6 * k, Sc.plateCol(Math.max(0, w - i * 2))); }); },
  tbar(x, y, k) { const m = mat('tbar'), w = wgEq('tbar'); c.save(); c.translate(x - 30 * k, y - 4 * k); c.rotate(-.35); metal(0, -2 * k, 76 * k, 4 * k, m); platesRow(66 * k, 0, k * .9, clamp(1 + Math.floor(w / 3), 1, 6), -1, w); c.restore(); c.fillStyle = '#2a2a30'; c.fillRect(x - 36 * k, y - 8 * k, 12 * k, 8 * k); },
  szstange(x, y, k) { const m = mat('szstange'), w = wgEq('szstange'); metal(x - 30 * k, y - 80 * k, 60 * k, 4 * k, MK.MATERIAL[0]); c.strokeStyle = m.a; c.lineWidth = 3 * k; c.beginPath(); c.moveTo(x - 40 * k, y - 70 * k); [-24, -16, -8, 0, 8, 16, 24].forEach((dx, i) => c.lineTo(x + dx * k, y - (70 + (i % 2 ? 4 : 0)) * k)); c.lineTo(x + 40 * k, y - 70 * k); c.stroke();
    platesRow(x - 42 * k, y - 70 * k, k * .7, clamp(1 + Math.floor(w / 4), 1, 5), -1, w); platesRow(x + 42 * k, y - 70 * k, k * .7, clamp(1 + Math.floor(w / 4), 1, 5), 1, w); },
  plattform(x, y, k) { const w = wgEq('plattform'); c.fillStyle = '#8a5a34'; c.fillRect(x - 46 * k, y - 4 * k, 92 * k, 4 * k); c.fillStyle = '#2a2a30'; c.fillRect(x - 46 * k, y - 4 * k, 18 * k, 4 * k); c.fillRect(x + 28 * k, y - 4 * k, 18 * k, 4 * k);
    metal(x - 44 * k, y - 16 * k, 88 * k, 3 * k, mat('plattform')); const n = clamp(1 + Math.floor(w / 3), 1, 6); platesRow(x - 32 * k, y - 15 * k, k * .9, n, -1, w); platesRow(x + 32 * k, y - 15 * k, k * .9, n, 1, w); }
});
const FIXED = { boombox: .905, kuehl: .968 }; // anklickbar, immer am Rand
let LAYOUT = {}, layKey = '';
function eqLayout() { const own = MK.EQUIP.filter(q => MK.S.eq[q.id] && EQDRAW[q.id] && !FIXED[q.id]).map(q => q.id), key = own.join(',') + (MK.S.eq.kuehl ? '|k' : '') + W; if (key === layKey) return LAYOUT; layKey = key; LAYOUT = {};
  // Geräte im Raum verteilt: drei Tiefen (an der Wand, Mitte, vorne), versetzt – nie hinter der Theke
  const n = own.length, x0 = .06, x1 = MK.S.eq.kuehl ? .56 : .9, DEP = [1, 0, 2, 0, 2, 1, 0, 2, 1];
  own.forEach((id, i) => { const R = MK.seedRand('eq' + id), base = n === 1 ? .5 : i / (n - 1), d = DEP[i % DEP.length], jit = (R() - .5) * Math.min(.5, 1 / Math.max(1, n - 1)) * .6;
    LAYOUT[id] = { x: x0 + (x1 - x0) * Math.max(0, Math.min(1, base + jit)), d, back: d === 0 }; });
  return LAYOUT; }
const SLOTS = { hack: .27, hanteln: .2, seil: .33, reifen: .37, bank: .43, stange: .5, langhantel: .57, laufband: .64, boombox: .69, rack: .76, barren: .83, kabel: .89, kuehl: .965 }; const SLOTS_OLD = { reifen: .03, hanteln: .1, seil: .19, langhantel: .17, bank: .27, laufband: .36, rack: .65, boombox: .58, barren: .75, stange: .83, kabel: .92, kuehl: .985 };
Sc.slotX = id => ((eqLayout()[id] || {}).x || FIXED[id] || SLOTS[id] || .5) * W;

/* ======================================================================
   TAGESZEIT (20-Minuten-Zyklus) UND WETTER
   ====================================================================== */
const CYCLE = 1200, lerpC = (a, b, t) => MK.Fig.mix(a, b, clamp(t, 0, 1));
Sc.dayPhase = () => (Date.now() / 1000 % CYCLE) / CYCLE;
Sc.dayName = () => { const p = Sc.dayPhase(); return p < .2 ? 'Morgen' : p < .5 ? 'Tag' : p < .7 ? 'Abend' : 'Nacht'; };
const WEATHER = [['sonne', 4], ['wolken', 3], ['regen', 2], ['gewitter', 1], ['schnee', 1], ['nebel', 1]];
Sc.WEATHER_NAME = { sonne: 'Sonne', wolken: 'Wolken', regen: 'Regen', gewitter: 'Gewitter', schnee: 'Schnee', nebel: 'Nebel' };
Sc.weather = () => { if (Sc.forceWeather) return Sc.forceWeather; const k = Math.floor(Date.now() / 1000 / (CYCLE / 2)), r = MK.seedRand('wx' + k)(); let x = r * WEATHER.reduce((a, w) => a + w[1], 0); for (const [w, n] of WEATHER) { x -= n; if (x <= 0) return w; } return 'sonne'; };
const SKY = [[0, '#2a3355', '#f2a37a'], [.1, '#6fa2d8', '#ffd2a1'], [.2, '#7fb8ec', '#d6ebff'], [.5, '#6fa8e2', '#d6ebff'], [.6, '#5a6fb0', '#ffb070'], [.7, '#2c2f5c', '#e07050'], [.78, '#0e1430', '#1f2850'], [.95, '#0c1228', '#1a2246'], [1, '#2a3355', '#f2a37a']];
function skyAt(p) { for (let i = 1; i < SKY.length; i++) if (p <= SKY[i][0]) { const [a, t1, b1] = SKY[i - 1], [b, t2, b2] = SKY[i], k = (p - a) / (b - a); return [lerpC(t1, t2, k), lerpC(b1, b2, k)]; } return [SKY[0][1], SKY[0][2]]; }
let flashW = 0, thunderAt = 0;
function drawWindow(x, y, w, h, t, mull, sky) {
  const p = Sc.dayPhase(), wx = Sc.weather(), [top, bot] = skyAt(p), cloudy = wx !== 'sonne', night = p > .72 && p < .97;
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  let g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, cloudy ? lerpC(top, '#7a8494', .5) : top); g.addColorStop(1, cloudy ? lerpC(bot, '#9aa2ae', .5) : bot); c.fillStyle = g; c.fillRect(x, y, w, h);
  // Sonne bzw. Mond wandern über EINEN gemeinsamen Himmel: Bei mehreren Fenstern schaut jedes auf denselben Himmel (sky = Fläche über alle Fenster),
  // die Sonne / der Mond ist also höchstens in einem Fenster zu sehen – oder gerade hinter der Wand dazwischen.
  const S2 = sky || { x, y, w, h, r: Math.min(w, h) };
  const sp = p < .7 ? p / .7 : (p - .7) / .3, bx = S2.x + S2.w * (.1 + .8 * sp), by = S2.y + S2.h * (.85 - Math.sin(sp * Math.PI) * .6), R = S2.r;
  if (!cloudy || wx === 'wolken') { if (p < .7) { circ(bx, by, R * .16, '#fff3b0'); g = c.createRadialGradient(bx, by, 1, bx, by, R * .5); g.addColorStop(0, 'rgba(255,240,170,.5)'); g.addColorStop(1, 'rgba(255,240,170,0)'); c.fillStyle = g; c.fillRect(x, y, w, h); }
    else { circ(bx, by, R * .12, '#f1efe0'); circ(bx + R * .05, by - 1, R * .1, top); } }
  if (night && !cloudy) for (let i = 0; i < 10; i++) { const sx = x + (i * 263.7 % w), sy = y + ((i * 23) % 100) / 100 * h * .7; c.fillStyle = `rgba(255,255,255,${.4 + .4 * Math.sin(t * 2 + i)})`; c.fillRect(sx, sy, 1.2, 1.2); }
  if (cloudy) { const cc = night ? 'rgba(60,66,90,.85)' : wx === 'wolken' ? 'rgba(255,255,255,.85)' : 'rgba(150,156,168,.9)';
    for (let i = 0; i < 4; i++) { const cx = x + ((t * 4 + i * w * .45) % (w * 1.6)) - w * .3, cy = y + h * (.2 + (i % 2) * .18); ell(cx, cy, w * .22, h * .1 + 2, cc); ell(cx + w * .12, cy - h * .05, w * .15, h * .1 + 2, cc); } }
  if (wx === 'regen' || wx === 'gewitter') { c.strokeStyle = 'rgba(200,220,255,.55)'; c.lineWidth = 1; c.beginPath(); for (let i = 0; i < Math.max(8, w * h / 300); i++) { const rx = x + ((i * 53.3 + t * 30) % w), ry = y + ((i * 31.7 + t * 260) % h); c.moveTo(rx, ry); c.lineTo(rx - 2, ry + 7); } c.stroke(); }
  if (wx === 'schnee') { c.fillStyle = 'rgba(255,255,255,.9)'; for (let i = 0; i < Math.max(8, w * h / 280); i++) { const sx = x + ((i * 41.3 + Math.sin(t + i) * 6) % w), sy = y + ((i * 27.1 + t * 22) % h); c.beginPath(); c.arc(sx, sy, 1.3, 0, TAU); c.fill(); } }
  if (wx === 'nebel') { c.fillStyle = 'rgba(220,224,230,.55)'; c.fillRect(x, y, w, h); }
  if (MK.S.gym >= 2 && (wx === 'regen' || wx === 'gewitter')) { // Tropfen laufen an der Scheibe herunter
    for (let i = 0; i < Math.max(6, w * h / 1600); i++) { const sx = x + ((i * 71.3) % w), sp2 = .06 + (i * 13 % 7) / 45, ph = (t * sp2 + i * .37) % 1, sy = y - 8 + ph * (h + 16), tl = 10 + (i % 4) * 6;
      const g2 = c.createLinearGradient(0, sy - tl, 0, sy); g2.addColorStop(0, 'rgba(210,228,255,0)'); g2.addColorStop(1, 'rgba(210,228,255,.45)'); c.strokeStyle = g2; c.lineWidth = 1.4; c.beginPath(); c.moveTo(sx + Math.sin(i) * 1.5, sy - tl); c.lineTo(sx, sy); c.stroke();
      ell(sx, sy, 1.7, 2.4, 'rgba(225,238,255,.75)'); c.fillStyle = 'rgba(255,255,255,.9)'; c.fillRect(sx - .8, sy - 1.4, .9, .9); }
    for (let i = 0; i < Math.max(8, w * h / 900); i++) ell(x + (i * 37.7 % w), y + (i * 53.1 % h), 1 + (i % 3) * .5, 1.2 + (i % 3) * .5, 'rgba(220,235,255,.35)'); }
  if (MK.S.gym >= 2 && wx === 'schnee') { c.fillStyle = 'rgba(255,255,255,.92)'; c.beginPath(); c.moveTo(x, y + h); for (let i = 0; i <= 12; i++) c.lineTo(x + w * i / 12, y + h - 5 - Math.sin(i * 1.7) * 2.5 - (i % 3)); c.lineTo(x + w, y + h); c.closePath(); c.fill(); // Schnee auf dem Fensterbrett
    [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].forEach(([fx, fy]) => { const g2 = c.createRadialGradient(fx, fy, 0, fx, fy, Math.min(w, h) * .35); g2.addColorStop(0, 'rgba(235,245,255,.6)'); g2.addColorStop(1, 'rgba(235,245,255,0)'); c.fillStyle = g2; c.fillRect(x, y, w, h); }); } // Eisblumen in den Ecken
  if (flashW > 0) { c.fillStyle = `rgba(240,245,255,${flashW})`; c.fillRect(x, y, w, h); }
  c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.moveTo(x + w * .15, y); c.lineTo(x + w * .35, y); c.lineTo(x + w * .1, y + h); c.lineTo(x - w * .1, y + h); c.fill();
  c.restore();
  c.strokeStyle = '#3a3c42'; c.lineWidth = 2; c.strokeRect(x, y, w, h); if (mull) { c.beginPath(); c.moveTo(x + w / 2, y); c.lineTo(x + w / 2, y + h); if (mull > 1) { c.moveTo(x, y + h / 2); c.lineTo(x + w, y + h / 2); } c.stroke(); }
  if ((wx === 'regen' || wx === 'gewitter') && c.globalAlpha === 1) { c.fillStyle = 'rgba(180,200,230,.35)'; for (let i = 0; i < 3; i++) { const dx = x + w * (.2 + i * .3), dy = y + ((t * 20 + i * 17) % h); c.beginPath(); c.ellipse(dx, dy, 1.2, 2, 0, 0, TAU); c.fill(); } }
}
function dayLight(dt, t) { // Licht über der ganzen Szene: Morgen warm, Abend orange, Nacht dunkelblau mit Lichtkegel der Gym-Lampe
  const p = Sc.dayPhase(), G = Sc.geo();
  if (p < .18) { c.fillStyle = `rgba(255,190,140,${.07 * (1 - p / .18)})`; c.fillRect(0, 0, W, H); }
  else if (p > .52 && p < .74) { c.fillStyle = `rgba(255,130,50,${.09 * Math.sin((p - .52) / .22 * Math.PI)})`; c.fillRect(0, 0, W, H); }
  if (p > .66 || p < .04) { const k = p > .66 ? clamp((p - .66) / .08, 0, 1) * (p > .95 ? clamp((1 - p) / .05 + (p < .04 ? 1 : 0), 0, 1) : 1) : clamp((.04 - p) / .04, 0, 1);
    const g = c.createRadialGradient(W * .5, H * .2, H * .2, W * .5, H * .45, H * 1.05); g.addColorStop(0, 'rgba(10,16,48,0)'); g.addColorStop(1, `rgba(10,16,48,${.42 * k})`); c.fillStyle = g; c.fillRect(0, 0, W, H); }
  // Gewitter: Blitz im Fenster und kurz im ganzen Raum, Donner kommt hinterher
  if (Sc.weather() === 'gewitter' && Math.random() < dt * .07) { flashW = .9; thunderAt = performance.now() + 600 + Math.random() * 1200; }
  if (thunderAt && performance.now() > thunderAt) { thunderAt = 0; MK.Audio.play('thunder', .7 + Math.random() * .5); }
  if (flashW > 0) { c.fillStyle = `rgba(230,236,255,${flashW * .12})`; c.fillRect(0, 0, W, H); flashW = Math.max(0, flashW - dt * 3); }
}
Sc.crowdDay = () => { const p = Sc.dayPhase(); return p < .2 ? .8 : p < .5 ? 1 : p < .72 ? 1.35 : .55; };

/* ======================================================================
   GYM-HINTERGRÜNDE
   ====================================================================== */
const GYMSTYLE = [
  { wall: ['#4c4a47', '#3a3836'], floor: ['#2b2a28', '#1f1e1c'], trim: '#5a5752', light: 'bulb', mirror: [.03, .25], mtop: .15 },
  { wall: ['#c9b48a', '#a8956c'], floor: ['#8a5f38', '#6e4a2a'], trim: '#5e4a2e', light: 'tubes', mirror: [.03, .28], mtop: .13 },
  { wall: ['#e9eef0', '#cfd8dc'], floor: ['#3d4248', '#2c3035'], trim: '#14b8a6', light: 'panels', mirror: [.03, .31], mtop: .11 },
  { wall: ['#2a2b30', '#1c1d21'], floor: ['#151517', '#0e0e10'], trim: '#d83a32', light: 'spots', mirror: [.02, .32], mtop: .09 },
  { wall: ['#3b1d2e', '#24101b'], floor: ['#2a1a12', '#1a0f0a'], trim: '#e6b422', light: 'stage', mirror: [.02, .32], mtop: .07 }
];
/* ======================================================================
   GRAFIK-UPDATE: Material-Texturen (Wand/Boden), Bodenspiegelung, Lichtquellen mit Bloom & Lichtkegeln, Staub im Licht
   Texturen werden einmal pro Größe/Gym vorgerechnet (Cache) – kostet im Spiel fast nichts.
   ====================================================================== */
const TEX = {};
function texCanvas(w, h) { const cv2 = document.createElement('canvas'); cv2.width = Math.max(1, Math.ceil(w * dpr)); cv2.height = Math.max(1, Math.ceil(h * dpr)); const x = cv2.getContext('2d'); x.scale(dpr, dpr); return [cv2, x]; }
const shadeC = (hex, f) => { const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255, m = v => Math.max(0, Math.min(255, Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f))); return `rgb(${m(r)},${m(g)},${m(b)})`; };
function noise(x, w, h, n, a, R, dark) { for (let i = 0; i < n; i++) { const v = R(); x.fillStyle = dark || v < .5 ? `rgba(0,0,0,${a * R()})` : `rgba(255,255,255,${a * .7 * R()})`; const s = R() < .9 ? 1 : 2; x.fillRect(R() * w, R() * h, s, s); } }
function blot(x, cx, cy, r, col, a) { const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, col.replace('A', a)); g.addColorStop(1, col.replace('A', 0)); x.fillStyle = g; x.fillRect(cx - r, cy - r, r * 2, r * 2); }
function floorTex(gym, yF) {
  const FH = H - yF, key = 'f' + gym + ':' + W + ':' + H + ':' + Math.round(yF) + ':' + dpr; if (TEX.floor && TEX.floor.key === key) return TEX.floor.cv;
  const [cv2, x] = texCanvas(W, FH), st = GYMSTYLE[gym], R = MK.seedRand('floor' + gym), X = (u, y) => W / 2 + u * (40 + 100 * (y / FH));
  const quad = (u0, u1, y0, y1) => { x.beginPath(); x.moveTo(X(u0, y0), y0); x.lineTo(X(u1, y0), y0); x.lineTo(X(u1, y1), y1); x.lineTo(X(u0, y1), y1); x.closePath(); };
  const rows = n => Array.from({ length: n + 1 }, (_, i) => FH * Math.pow(i / n, 1.45));
  let g = x.createLinearGradient(0, 0, 0, FH); g.addColorStop(0, st.floor[0]); g.addColorStop(1, st.floor[1]); x.fillStyle = g; x.fillRect(0, 0, W, FH);
  const U = Math.ceil(W / 80) + 6;
  if (gym === 0) { // Estrich: Flecken, Körnung, Risse, Ölfleck, Abfluss
    for (let i = 0; i < 40; i++) blot(x, R() * W, R() * FH, 20 + R() * 70, R() < .5 ? 'rgba(0,0,0,A)' : 'rgba(255,255,255,A)', .05 + R() * .05);
    noise(x, W, FH, W * FH / 18, .35, R);
    x.strokeStyle = 'rgba(0,0,0,.4)'; x.lineWidth = 1; for (let i = 0; i < 4; i++) { let px = R() * W, py = R() * FH; x.beginPath(); x.moveTo(px, py); for (let j = 0; j < 7; j++) { px += (R() - .5) * 40; py += R() * 14; x.lineTo(px, py); } x.stroke(); }
    blot(x, W * .2, FH * .7, 40, 'rgba(20,14,8,A)', .35); x.fillStyle = '#1a1a1a'; x.beginPath(); x.ellipse(W * .62, FH * .55, 12, 4, 0, 0, TAU); x.fill(); x.strokeStyle = '#555'; x.lineWidth = 1; for (let i = -2; i <= 2; i++) { x.beginPath(); x.moveTo(W * .62 + i * 4, FH * .55 - 3); x.lineTo(W * .62 + i * 4, FH * .55 + 3); x.stroke(); }
  }
  if (gym === 1 || gym === 4) { // Holzdielen (Verein: Eiche hell, Bühne: dunkles Nussholz mit Gold-Intarsie)
    const base = gym === 1 ? ['#9a6a40', '#8a5f38', '#a87448', '#7e5532'] : ['#3a2416', '#2e1c10', '#45291a', '#281809'], step = gym === 1 ? .5 : .75;
    for (let u = -U; u < U; u += step) { let y0 = 0; const seams = rows(9).filter(() => R() < .45); seams.push(FH); seams.forEach(y1 => { if (y1 - y0 < 2) return; x.fillStyle = base[Math.floor(R() * base.length)]; quad(u, u + step, y0, y1); x.fill();
        x.strokeStyle = 'rgba(0,0,0,.08)'; x.lineWidth = .7; for (let j = 0; j < 3; j++) { const f = .2 + R() * .6; x.beginPath(); x.moveTo(X(u + step * f, y0), y0); x.lineTo(X(u + step * (f + (R() - .5) * .1), y1), y1); x.stroke(); }
        x.strokeStyle = 'rgba(0,0,0,.45)'; x.lineWidth = 1; x.beginPath(); x.moveTo(X(u, y1), y1); x.lineTo(X(u + step, y1), y1); x.stroke(); y0 = y1; });
      x.strokeStyle = 'rgba(0,0,0,.5)'; x.lineWidth = 1; x.beginPath(); x.moveTo(X(u, 0), 0); x.lineTo(X(u, FH), FH); x.stroke(); }
    if (gym === 4) { x.strokeStyle = 'rgba(230,180,34,.55)'; x.lineWidth = 1.2; for (let u = -U; u < U; u += 4.5) { x.beginPath(); x.moveTo(X(u, 0), 0); x.lineTo(X(u, FH), FH); x.stroke(); } rows(5).forEach(y => { x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke(); }); }
    noise(x, W, FH, W * FH / 40, .18, R);
  }
  if (gym === 2 || gym === 3) { // Gummi-Fliesen mit Granulat
    const ys = rows(gym === 2 ? 7 : 8), tone = gym === 2 ? ['#3d4248', '#373c42', '#41464d'] : ['#161618', '#131315', '#1a1a1d'];
    for (let u = -U; u < U; u += 1) for (let i = 0; i < ys.length - 1; i++) { x.fillStyle = tone[(Math.abs(Math.round(u)) + i) % tone.length]; quad(u, u + 1, ys[i], ys[i + 1]); x.fill(); }
    for (let i = 0; i < W * FH / 30; i++) { const c0 = R(); x.fillStyle = gym === 3 && c0 < .06 ? 'rgba(216,58,50,.6)' : gym === 2 && c0 < .05 ? 'rgba(20,184,166,.5)' : c0 < .5 ? 'rgba(0,0,0,.35)' : 'rgba(255,255,255,.08)'; x.fillRect(R() * W, R() * FH, 1, 1); }
    x.strokeStyle = 'rgba(0,0,0,.55)'; x.lineWidth = 1.2; for (let u = -U; u < U; u += 1) { x.beginPath(); x.moveTo(X(u, 0), 0); x.lineTo(X(u, FH), FH); x.stroke(); } ys.forEach(y => { x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke(); });
    x.strokeStyle = 'rgba(255,255,255,.05)'; x.lineWidth = 1; ys.forEach(y => { x.beginPath(); x.moveTo(0, y + 1.2); x.lineTo(W, y + 1.2); x.stroke(); });
    if (gym === 3) { x.fillStyle = 'rgba(216,58,50,.55)'; [-1, 1].forEach(s => { x.beginPath(); x.moveTo(X(s * 3.1, 0), 0); x.lineTo(X(s * 3.2, 0), 0); x.lineTo(X(s * 3.2, FH), FH); x.lineTo(X(s * 3.1, FH), FH); x.fill(); }); }
  }
  // Tiefe: hinten dunstiger, vorne satter
  g = x.createLinearGradient(0, 0, 0, FH); g.addColorStop(0, 'rgba(0,0,0,.28)'); g.addColorStop(.35, 'rgba(0,0,0,.05)'); g.addColorStop(1, 'rgba(0,0,0,.18)'); x.fillStyle = g; x.fillRect(0, 0, W, FH);
  TEX.floor = { key, cv: cv2 }; return cv2;
}
function wallTex(gym, yF) {
  const key = 'w' + gym + ':' + W + ':' + Math.round(yF) + ':' + dpr; if (TEX.wall && TEX.wall.key === key) return TEX.wall.cv;
  const [cv2, x] = texCanvas(W, yF), R = MK.seedRand('wall' + gym);
  if (gym === 0) { // Sichtbeton mit Schalungsstößen, Ankerlöchern, feuchten Flecken unten
    for (let i = 0; i < 30; i++) blot(x, R() * W, R() * yF, 30 + R() * 80, R() < .5 ? 'rgba(0,0,0,A)' : 'rgba(255,255,255,A)', .04 + R() * .05);
    noise(x, W, yF, W * yF / 14, .3, R);
    x.strokeStyle = 'rgba(0,0,0,.18)'; x.lineWidth = 1; for (let y = yF * .33; y < yF; y += yF * .33) { x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke(); } for (let xx = 120; xx < W; xx += 240) { x.beginPath(); x.moveTo(xx, 0); x.lineTo(xx, yF); x.stroke(); }
    x.fillStyle = 'rgba(0,0,0,.35)'; for (let xx = 60; xx < W; xx += 120) for (let y = yF * .16; y < yF; y += yF * .33) { x.beginPath(); x.arc(xx, y, 2, 0, TAU); x.fill(); }
    const dg = x.createLinearGradient(0, yF * .7, 0, yF); dg.addColorStop(0, 'rgba(30,26,20,0)'); dg.addColorStop(1, 'rgba(30,26,20,.35)'); x.fillStyle = dg; x.fillRect(0, yF * .7, W, yF * .3);
  }
  if (gym === 1) { // echte Ziegel: jede Reihe versetzt, jeder Stein leicht anders, Fugen mit Licht/Schatten
    const bh = 13, bw = 34; for (let r = 0, y = 0; y < yF; r++, y += bh) for (let xx = -(r % 2) * bw / 2; xx < W; xx += bw) { const v = R(); x.fillStyle = v < .33 ? '#b08455' : v < .66 ? '#a67a4c' : '#bb8f5f'; x.fillRect(xx + 1, y + 1, bw - 2, bh - 2);
      x.fillStyle = 'rgba(255,255,255,.12)'; x.fillRect(xx + 1, y + 1, bw - 2, 1.5); x.fillStyle = 'rgba(0,0,0,.14)'; x.fillRect(xx + 1, y + bh - 2.5, bw - 2, 1.5); if (R() < .15) blot(x, xx + bw / 2, y + bh / 2, 14, 'rgba(60,30,10,A)', .2); }
    x.globalCompositeOperation = 'destination-over'; x.fillStyle = '#d8ccb0'; x.fillRect(0, 0, W, yF); x.globalCompositeOperation = 'source-over';
    noise(x, W, yF, W * yF / 30, .2, R);
  }
  if (gym === 2) { // weiße Wandpaneele mit Fugen und weichem Glanz
    for (let xx = 0; xx < W; xx += 96) { const g = x.createLinearGradient(xx, 0, xx + 96, 0); g.addColorStop(0, 'rgba(255,255,255,.35)'); g.addColorStop(.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,.05)'); x.fillStyle = g; x.fillRect(xx, 0, 96, yF); x.fillStyle = 'rgba(120,135,145,.35)'; x.fillRect(xx, 0, 1, yF); }
    x.fillStyle = 'rgba(120,135,145,.25)'; x.fillRect(0, yF * .5, W, 1);
  }
  if (gym === 3) { // Akustik-Lamellen in Anthrazit
    for (let xx = 0; xx < W; xx += 10) { const g = x.createLinearGradient(xx, 0, xx + 10, 0); g.addColorStop(0, 'rgba(255,255,255,.05)'); g.addColorStop(.6, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.35)'); x.fillStyle = g; x.fillRect(xx, 0, 10, yF * .53); }
    noise(x, W, yF, W * yF / 40, .2, R);
  }
  if (gym === 4) { // Damast-Tapete: Rauten mit Ornament, darunter Holzpaneel mit Goldleiste
    x.fillStyle = 'rgba(230,180,34,.07)'; for (let y = 0; y < yF * .72; y += 36) for (let xx = (y / 36 % 2) * 22; xx < W; xx += 44) { x.beginPath(); x.moveTo(xx, y - 14); x.quadraticCurveTo(xx + 9, y, xx, y + 14); x.quadraticCurveTo(xx - 9, y, xx, y - 14); x.fill(); x.beginPath(); x.arc(xx, y, 2.4, 0, TAU); x.fill(); }
    const pg = x.createLinearGradient(0, yF * .72, 0, yF); pg.addColorStop(0, '#2a1209'); pg.addColorStop(1, '#170905'); x.fillStyle = pg; x.fillRect(0, yF * .72, W, yF * .28);
    x.strokeStyle = 'rgba(230,180,34,.35)'; x.lineWidth = 1; for (let xx = 30; xx < W; xx += 90) x.strokeRect(xx, yF * .76, 70, yF * .19);
    x.fillStyle = '#c9971c'; x.fillRect(0, yF * .72 - 3, W, 3); x.fillStyle = 'rgba(255,240,180,.5)'; x.fillRect(0, yF * .72 - 3, W, 1);
  }
  // Licht der Deckenleuchten fällt oben am stärksten auf die Wand, nach unten und zu den Ecken weicher
  const lg = x.createLinearGradient(0, 0, 0, yF); lg.addColorStop(0, 'rgba(255,245,225,.10)'); lg.addColorStop(.5, 'rgba(0,0,0,0)'); lg.addColorStop(1, 'rgba(0,0,0,.12)'); x.fillStyle = lg; x.fillRect(0, 0, W, yF);
  [0, W].forEach(cx => blot(x, cx, yF * .5, yF * .9, 'rgba(0,0,0,A)', .28));
  TEX.wall = { key, cv: cv2 }; return cv2;
}
/* Bodenspiegelung: der Streifen über der Wandkante wird gespiegelt und blendet nach vorn aus */
const GLOSS = [.05, .16, .12, .1, .24];
function floorReflect(G) {
  const a = GLOSS[MK.S.gym] || .1; if (MK.S.set.quality === 'niedrig' || a <= 0) return;
  const m = c.getTransform(), R0 = Math.min(G.yF * .6, (H - G.yF) * .9), sx = Math.max(0, m.e), sy = Math.max(0, m.d * (G.yF - R0) + m.f), dy0 = m.d * G.yF + m.f, sw = Math.min(cv.width, m.a * W + m.e) - sx, sh = dy0 - sy;
  if (sw < 2 || sh < 2) return;
  // Leistung: Spiegelbild in halber Auflösung und nur ~12× pro Sekunde neu (die Wand darüber ändert sich kaum) – sieht weicher aus und spart das teure Zurücklesen jedes Bild
  const rw = Math.max(1, Math.ceil(sw / 2)), rh = Math.max(1, Math.ceil(sh / 2)), now = performance.now();
  if (!TEX.refl || TEX.refl.width !== rw || TEX.refl.height !== rh) { TEX.refl = document.createElement('canvas'); TEX.refl.width = rw; TEX.refl.height = rh; TEX.reflT = 0; }
  const r = TEX.refl;
  if (now - (TEX.reflT || 0) > 80) { TEX.reflT = now; const x = r.getContext('2d'); x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, rw, rh);
    x.save(); x.translate(0, rh); x.scale(1, -1); x.drawImage(cv, sx, sy, sw, sh, 0, 0, rw, rh); x.restore();
    x.globalCompositeOperation = 'destination-in'; if (!TEX.reflG || TEX.reflGh !== rh) { TEX.reflG = x.createLinearGradient(0, 0, 0, rh); TEX.reflG.addColorStop(0, 'rgba(0,0,0,1)'); TEX.reflG.addColorStop(.55, 'rgba(0,0,0,.3)'); TEX.reflG.addColorStop(1, 'rgba(0,0,0,0)'); TEX.reflGh = rh; } x.fillStyle = TEX.reflG; x.fillRect(0, 0, rw, rh); }
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = a; c.drawImage(r, 0, 0, rw, rh, sx, dy0 + 1, sw, sh); c.restore();
}
/* Lichtquellen: Glühbirne/Röhren/Panels/Spots/Bühne – mit Bloom, Lichtkegel und Staub im Licht */
const MOTES = Array.from({ length: 36 }, (_, i) => ({ u: Math.random(), v: Math.random(), s: .4 + Math.random() * 1.1, p: Math.random() * 6, sp: .006 + Math.random() * .012 }));
function lightRig(st, t, G) {
  const yF = G.yF, gym = MK.S.gym, srcs = [];
  const LA = Sc.vis.lampA || 0, lx = W * .5 + Math.sin(LA) * 40, ly = Math.cos(LA) * 40;
  if (st.light === 'bulb') { c.strokeStyle = '#222'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(W * .5, 0); c.lineTo(lx, ly); c.stroke(); circ(lx, ly + 6, 7, '#fff5c8'); } // Glühbirne pendelt
  if (st.light === 'bulb') srcs.push({ x: lx, y: ly + 6, col: '255,226,160', r: 70, cone: .55, w0: 8, sway: Math.sin(LA) * W * .2 });
  if (st.light === 'tubes') for (let i = 0; i < 3; i++) srcs.push({ x: W * (.2 + i * .3), y: 7, col: '235,245,255', r: 60, cone: .3, w0: 34, bar: 60 });
  if (st.light === 'panels') for (let i = 0; i < 4; i++) srcs.push({ x: W * (.12 + i * .25), y: 4, col: '240,250,255', r: 50, cone: .22, w0: 28, bar: 48 });
  if (st.light === 'spots') for (let i = 0; i < 4; i++) srcs.push({ x: W * (.14 + i * .24), y: 10, col: '255,236,210', r: 34, cone: .42, w0: 4, spot: 1, sway: LA * W * .08 * (i % 2 ? 1 : -1) });
  if (st.light === 'stage') { const cols = ['255,210,120', '255,120,170', '160,140,255']; for (let i = 0; i < 3; i++) srcs.push({ x: W * (.25 + i * .25), y: 12, col: cols[i], r: 40, cone: .5, w0: 5, spot: 1, sway: Math.sin(t * .5 + i * 2) * W * .08 }); }
  c.save();
  // Leuchtkörper selbst
  if (!Sc.env3dOn) srcs.forEach(s => { if (s.bar) { c.fillStyle = '#e9edf0'; c.fillRect(s.x - s.bar / 2, s.y - 3, s.bar, 4); c.fillStyle = 'rgba(255,255,255,1)'; c.fillRect(s.x - s.bar / 2 + 2, s.y, s.bar - 4, 2); }
    if (s.spot) { c.fillStyle = '#1b1b1e'; c.fillRect(s.x - 1, 0, 2, s.y - 4); c.beginPath(); c.ellipse(s.x, s.y, 8, 6, 0, 0, TAU); c.fill(); c.fillStyle = `rgb(${s.col})`; c.beginPath(); c.ellipse(s.x, s.y + 4, 5, 2.2, 0, 0, TAU); c.fill(); } });
  c.globalCompositeOperation = 'lighter';
  // Tageslicht durch die Fenster: morgens warm von links, mittags hell und steil, abends orange von rechts, nachts schwaches Mondlicht
  { const p = Sc.dayPhase(), wx = Sc.weather(); let col, a;
    if (p < .2) { col = '255,196,130'; a = .16; } else if (p < .5) { col = '255,248,225'; a = .1; } else if (p < .72) { col = '255,135,55'; a = .18; } else { col = '150,175,255'; a = .05; }
    a *= 1.6; if (wx !== 'sonne') a *= wx === 'wolken' ? .55 : .3;
    const sl = (p < .45 ? 1 : -1) * W * (p < .2 || p > .5 ? .17 : .06), fy = yF + 64;
    (Sc.windows() || []).forEach(w => { const [x, y, ww, hh] = w, g = c.createLinearGradient(0, y, 0, fy); g.addColorStop(0, `rgba(${col},${a * .55})`); g.addColorStop(.7, `rgba(${col},${a * .25})`); g.addColorStop(1, `rgba(${col},${a * .5})`);
      c.fillStyle = g; c.beginPath(); c.moveTo(x, y + hh * .1); c.lineTo(x + ww, y + hh * .1); c.lineTo(x + ww + sl, fy); c.lineTo(x + sl, fy); c.closePath(); c.fill();
      const pg = c.createLinearGradient(0, yF + 6, 0, fy + 18); pg.addColorStop(0, `rgba(${col},0)`); pg.addColorStop(.5, `rgba(${col},${a * 1.1})`); pg.addColorStop(1, `rgba(${col},0)`); c.fillStyle = pg;
      c.beginPath(); c.moveTo(x + sl * .78, yF + 6); c.lineTo(x + ww + sl * .78, yF + 6); c.lineTo(x + ww + sl * 1.15, fy + 18); c.lineTo(x + sl * 1.15, fy + 18); c.closePath(); c.fill(); }); }
  srcs.forEach(s => { // Lichtkegel
    const bx = s.x + (s.sway || 0), half = W * s.cone * .5, g = c.createLinearGradient(0, s.y, 0, yF + 40); g.addColorStop(0, `rgba(${s.col},${s.spot ? .16 : .1})`); g.addColorStop(1, `rgba(${s.col},0)`);
    c.fillStyle = g; c.beginPath(); c.moveTo(s.x - s.w0, s.y); c.lineTo(s.x + s.w0, s.y); c.lineTo(bx + half, yF + 40); c.lineTo(bx - half, yF + 40); c.closePath(); c.fill();
    if (s.spot) { const pg = c.createRadialGradient(bx, yF + 26, 2, bx, yF + 26, half * .9); pg.addColorStop(0, `rgba(${s.col},.16)`); pg.addColorStop(1, `rgba(${s.col},0)`); c.fillStyle = pg; c.save(); c.translate(bx, yF + 26); c.scale(1, .25); c.beginPath(); c.arc(0, 0, half * .9, 0, TAU); c.fill(); c.restore(); }
    // Bloom um die Lichtquelle
    const bg = c.createRadialGradient(s.x, s.y, 1, s.x, s.y, s.r); bg.addColorStop(0, `rgba(${s.col},.55)`); bg.addColorStop(.25, `rgba(${s.col},.16)`); bg.addColorStop(1, `rgba(${s.col},0)`); c.fillStyle = bg; c.fillRect(s.x - s.r, s.y - s.r, s.r * 2, s.r * 2); });
  // Staubkörnchen schweben im Licht
  if (!MK.S.set.reduce && srcs.length) MOTES.forEach((m, i) => { const s = srcs[i % srcs.length]; m.v -= m.sp * (Sc._dt || .016); if (m.v < 0) m.v += 1; const yy = s.y + m.v * (yF - s.y), half = W * s.cone * .5 * (m.v), xx = s.x + (s.sway || 0) * m.v + (m.u - .5) * 2 * (s.w0 + half) + Math.sin(t * .7 + m.p) * 6;
    c.fillStyle = `rgba(${s.col},${(.25 + .25 * Math.sin(t * 2 + m.p)) * (1 - m.v * .6)})`; c.fillRect(xx, yy, m.s, m.s); });
  c.restore();
}
/* weicher Kontaktschatten unter Geräten und Leuten */
/* ---------- Beast-Modus: Hintergrund wird grau-dunkel, Flammen-Aura hinter der Figur ---------- */
function beastBack(G, t, k) {
  c.save(); c.globalCompositeOperation = 'saturation'; c.fillStyle = `rgba(128,128,128,${.6 * k})`; c.fillRect(0, 0, W, H);
  c.globalCompositeOperation = 'multiply'; c.fillStyle = `rgba(150,60,50,${.42 * k})`; c.fillRect(0, 0, W, H);
  c.globalCompositeOperation = 'lighter'; const sc = G.pScale, cy = G.py - 150 * sc;
  { const r = 230 * sc, g = c.createRadialGradient(G.px, cy, 10 * sc, G.px, cy, r); g.addColorStop(0, `rgba(255,90,30,${.3 * k})`); g.addColorStop(.6, `rgba(255,40,10,${.12 * k})`); g.addColorStop(1, 'rgba(255,30,10,0)'); c.fillStyle = g; c.save(); c.translate(G.px, cy); c.scale(.62, 1); c.translate(-G.px, -cy); c.beginPath(); c.arc(G.px, cy, r, 0, TAU); c.fill(); c.restore(); }
  for (let i = 0; i < 9; i++) { const u = (i - 4) / 4, seed = i * 2.17, fl = Math.sin(t * 8.3 + seed) * .5 + Math.sin(t * 12.7 + seed * 1.3) * .35, h = (120 + (1 - Math.abs(u)) * 210 + fl * 70) * sc, w = (11 + (1 - Math.abs(u)) * 9) * sc, x = G.px + u * 78 * sc + Math.sin(t * 2 + seed) * 6 * sc, y0 = G.py + 2;
    const g = c.createLinearGradient(0, y0, 0, y0 - h); g.addColorStop(0, `rgba(255,170,60,${.3 * k})`); g.addColorStop(.35, `rgba(255,90,25,${.2 * k})`); g.addColorStop(1, 'rgba(255,30,10,0)'); c.fillStyle = g;
    const sw = Math.sin(t * 7 + seed) * 16 * sc; c.beginPath(); c.moveTo(x - w, y0); c.bezierCurveTo(x - w * 1.2, y0 - h * .35, x - w * .2 + sw * .4, y0 - h * .7, x + sw, y0 - h); c.bezierCurveTo(x + w * .2 + sw * .4, y0 - h * .7, x + w * 1.2, y0 - h * .35, x + w, y0); c.closePath(); c.fill(); }
  c.restore(); }
/* ---------- Körper: Schweiß spritzt & Atemstöße bei hohem Tempo, Glanzstreifen über den Muskel beim Level-up ---------- */
let swT = 0, brT = 0;
function bodyFx(R, dt, t, G) { if (!R || !R.ha || MK.S.set.reduce) return; const V = Sc.vis, it = V.intens || 0, k = G.pScale;
  if (it > .2 && !R.lie) { swT -= dt * (1 + it * 5) * (.4 + (MK.S.sweat || 0)); if (swT < 0) { swT = rnd(.25, .6); const h = Math.random() < .5 ? 'l' : 'r', e = R.el[h], a = R.ha[h], dir = h === 'l' ? -1 : 1; // Tropfen fliegen von Unterarm/Ellbogen weg
      for (let i = 0; i < 2; i++) Sc.fx.parts.push({ k: 'sweat', x: lerp(e.x, a.x, rnd(.2, .8)), y: lerp(e.y, a.y, rnd(.2, .8)), vx: dir * rnd(1.2, 2.6), vy: rnd(-2.4, -.8), life: .9, r: rnd(1.6, 2.6), rot: 0, col: '#bfe3ff' }); }
    brT -= dt; if (brT < 0 && R.head) { brT = rnd(.55, .9); const hx = R.head.x + 9 * k, hy = R.head.y + 10 * k; for (let i = 0; i < 3; i++) Sc.fx.parts.push({ k: 'breath', x: hx + i * 3, y: hy + rnd(-2, 2), vx: rnd(.5, 1.1), vy: rnd(-.15, .15), life: .8, r: (3 + i * 1.5) * k, rot: 0, col: '#fff' }); } }
  const sh = V.shineG; if (sh) { const age = (performance.now() - sh.t0) / 1000; if (age > 1.1) { V.shineG = null; return; } const u = clamp(age / .9, 0, 1), a = Math.sin(u * Math.PI);
    const seg = { arme: [[R.sh.l, R.ha.l], [R.sh.r, R.ha.r]], schulter: [[R.sh.l, R.neck], [R.sh.r, R.neck]], brust: [[R.sh.l, R.sh.r]], bauch: [[R.neck, R.hip]], ruecken: [[R.neck, R.hip], [R.sh.l, R.sh.r]], beine: [[R.hip, R.foot.l], [R.hip, R.foot.r]], nacken: [[R.neck, R.head]], ausdauer: [[R.head, R.hip], [R.hip, R.foot.l], [R.hip, R.foot.r]] }[sh.g] || [];
    c.save(); c.globalCompositeOperation = 'lighter'; seg.forEach(([A, B]) => { if (!A || !B) return; const dy = sh.g === 'brust' ? 26 * k : 0, x = lerp(A.x, B.x, u), y = lerp(A.y, B.y, u) + dy, r = 30 * k;
      const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(255,248,210,${.75 * a})`); g.addColorStop(1, 'rgba(255,230,140,0)'); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
      c.strokeStyle = `rgba(255,255,240,${.55 * a})`; c.lineWidth = 3 * k; c.lineCap = 'round'; const nx = -(B.y - A.y), ny = B.x - A.x, nl = Math.hypot(nx, ny) || 1; c.beginPath(); c.moveTo(x - nx / nl * 14 * k, y - ny / nl * 14 * k); c.lineTo(x + nx / nl * 14 * k, y + ny / nl * 14 * k); c.stroke(); star4(x + 8 * k, y - 10 * k, 3 * a + 1, `rgba(255,255,255,${a})`); }); c.restore(); } }
/* ---------- Tempo sichtbar: Bewegungsspuren an den Händen (Trainer = türkis) ---------- */
const TR = { l: [], r: [] };
function handTrails(R, dt, G) {
  const V = Sc.vis, auto = MK.trainerRate() > 0 && performance.now() - (Sc.autoT || 0) < 600, k = V.ph >= 0 ? (V.intens || 0) : 0;
  V.trK = (V.trK || 0) + (k - (V.trK || 0)) * Math.min(1, dt * 6);
  ['l', 'r'].forEach(h => { const a = TR[h]; if (R && R.ha && V.trK > .02) { a.unshift(R.ha[h].x, R.ha[h].y); if (a.length > 16) a.length = 16; } else a.length = Math.max(0, a.length - 2); });
  if (V.trK < .03 || MK.S.set.reduce) return;
  c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round'; const col = auto ? '120,230,255' : '255,240,200';
  ['l', 'r'].forEach(h => { const a = TR[h]; for (let i = 2; i < a.length; i += 2) { const f = 1 - i / a.length; c.strokeStyle = `rgba(${col},${.5 * f * V.trK})`; c.lineWidth = (2 + 9 * f) * G.pScale * 1.4; c.beginPath(); c.moveTo(a[i - 2], a[i - 1]); c.lineTo(a[i], a[i + 1]); c.stroke(); } });
  c.restore(); }
/* ---------- Neues Gewicht glüht ein paar Sekunden nach ---------- */
function newWeightGlow(R, t, G) { const V = Sc.vis; if (!V.newW || !R || !R.ha) return; const age = (performance.now() - V.newW) / 1000; if (age > 3) { V.newW = 0; return; }
  const k = (age < .2 ? age / .2 : 1) * (age > 2.2 ? (3 - age) / .8 : 1) * (.75 + Math.sin(t * 9) * .25);
  c.save(); c.globalCompositeOperation = 'lighter'; [R.ha.l, R.ha.r].forEach(p => { const r = 42 * G.pScale + 14, g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, r); g.addColorStop(0, `rgba(255,236,150,${.55 * k})`); g.addColorStop(1, 'rgba(255,200,60,0)'); c.fillStyle = g; c.fillRect(p.x - r, p.y - r, r * 2, r * 2);
    for (let i = 0; i < 4; i++) { const an = t * 2 + i * Math.PI / 2, rr = r * .75; star4(p.x + Math.cos(an) * rr, p.y + Math.sin(an) * rr, 4 + Math.sin(t * 8 + i) * 2, `rgba(255,248,210,${k})`); } });
  c.restore(); }
function star4(x, y, r, col) { c.fillStyle = col; c.beginPath(); c.moveTo(x, y - r * 2); c.lineTo(x + r * .4, y - r * .4); c.lineTo(x + r * 2, y); c.lineTo(x + r * .4, y + r * .4); c.lineTo(x, y + r * 2); c.lineTo(x - r * .4, y + r * .4); c.lineTo(x - r * 2, y); c.lineTo(x - r * .4, y - r * .4); c.closePath(); c.fill(); }
/* ---------- Trainer: Stoppuhr über ihm tickt im Takt seiner Wiederholungen ---------- */
function trainerTempo(t, G) { const tr = Sc.trainerRect; if (!tr || MK.S.set.reduce) return; const age = (performance.now() - (Sc.autoT || 0)) / 1000; if (age > 1.2) return;
  const x = tr.x + tr.w / 2, y = tr.y - 6, k = clamp(1 - age / 1.2, 0, 1), beat = Math.exp(-age * 9), r = 9 + beat * 3, rate = MK.trainerRate() * (MK.labAutoMul ? MK.labAutoMul() : 1);
  c.save(); c.globalAlpha = k; c.fillStyle = '#141414'; c.beginPath(); c.arc(x, y, r + 2.5, 0, TAU); c.fill(); c.fillStyle = '#7fe3ff'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  c.fillStyle = '#141414'; c.fillRect(x - 2, y - r - 5, 4, 4); const an = (t * rate * .5) % 1 * TAU - Math.PI / 2; c.strokeStyle = '#141414'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(an) * r * .75, y + Math.sin(an) * r * .75); c.stroke();
  for (let i = 0; i < 3; i++) { const ra = r + 6 + i * 5 + beat * 4; c.strokeStyle = `rgba(127,227,255,${(.5 - i * .14) * beat})`; c.lineWidth = 2; c.beginPath(); c.arc(x, y, ra, -Math.PI * .85, -Math.PI * .15); c.stroke(); }
  c.restore(); }
function contactShadow(x, y, rx, ry, a) { const g = c.createRadialGradient(x, y, 0, x, y, rx); g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(.6, `rgba(0,0,0,${a * .45})`); g.addColorStop(1, 'rgba(0,0,0,0)'); c.save(); c.translate(x, y); c.scale(1, ry / rx); c.translate(-x, -y); c.fillStyle = g; c.beginPath(); c.arc(x, y, rx, 0, TAU); c.fill(); c.restore(); }
/* Hintergrund-Cache: Wand, Boden, Möbel werden einmal vorgezeichnet. Pro Bild kommen nur Fenster (Wetter/Tageszeit), Neon und Vitrine dazu. */
const BGC = { key: '', cv: null, win: [] }; let WINQ = null;
function win(...a) { if (WINQ) WINQ.push(a); else drawWindow(...a); }
function neonSigns(t, G) { const S = MK.S; if (S.gym < 2) return; const bk = Sc.vis.beastK || 0, fl = bk > .3 && Math.sin(t * 31) > .2 ? .4 : 1;
  c.save(); c.globalAlpha = fl;
  if (S.gym === 2) neonText('24/7', W * .82, 104, Math.max(16, H * .045), '255,79,184', t, 2);
  if (S.gym === 3) { neonText('NO EXCUSES', W * .5, G.yF * .53, Math.max(18, H * .07), '255,60,60', t, 5); neonText('♥', W * .5 + Math.max(18, H * .07) * 3.6, G.yF * .53, Math.max(14, H * .05), '255,60,60', t * 1.3, 9); }
  if (S.gym === 4) neonText('GAINS', W * .83, G.yF * .42, Math.max(16, H * .05), '255,200,70', t, 7);
  c.restore(); }
/* 3D-Umgebung (Raum hinter der 2D-Figur): fertiges Bild aus env3d.js oder null → alte 2D-Umgebung */
function env3dFor(G) {
  const S = MK.S, E3 = MK.Env3D; if (!E3 || !S.set.env3d || S.set.quality === 'niedrig') return null;
  if (E3.state === 'idle' && E3.load) { E3.load(); return null; }
  if (E3.state !== 'ready' || !E3.has(S.gym)) return null;
  const p = Sc.dayPhase();
  try { return E3.get({ gym: S.gym, W, H, yF: G.yF, py: G.py, pScale: G.pScale, dpr, q: S.set.quality, night: p > .72 && p < .97 }); }
  catch (e) { console.error('3D-Umgebung:', e); E3.state = 'fail'; return null; }
}
function drawGym(t) {
  const S = MK.S, G = Sc.geo(), st = GYMSTYLE[S.gym], env = env3dFor(G), key = env ? env.key : [S.gym, W, H, Math.round(G.yF), dpr, S.fame > 40 ? 1 : 0].join(':');
  Sc.env3dOn = !!env;
  if (BGC.key !== key) { if (env) { BGC.cv = env.cv; BGC.win = env.win; BGC.sky = null; }
    else { const [cv2, x2] = texCanvas(W, H), c0 = c; c = x2; WINQ = []; try { drawGymStatic(t); } finally { BGC.win = WINQ; BGC.sky = null; WINQ = null; c = c0; } BGC.cv = cv2; }
    BGC.key = key; }
  if (BGC.win.length && !BGC.sky) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, r = 1e9; BGC.win.forEach(a => { x0 = Math.min(x0, a[0]); y0 = Math.min(y0, a[1]); x1 = Math.max(x1, a[0] + a[2]); y1 = Math.max(y1, a[1] + a[3]); r = Math.min(r, a[2], a[3]); });
    BGC.sky = { x: x0, y: y0, w: x1 - x0, h: y1 - y0, r }; } // ein Himmel für alle Fenster
  if (env) { // 3D: erst der gemeinsame Himmel, dann der Raum darüber (die Fenster sind im 3D-Bild durchsichtig, Rahmen & Sprossen kommen aus 3D)
    BGC.win.forEach(a => drawWindow(a[0], a[1], a[2], a[3], t, 0, BGC.sky));
    c.drawImage(BGC.cv, 0, 0, W, H); }
  else { c.drawImage(BGC.cv, 0, 0, W, H);
    BGC.win.forEach(a => drawWindow(a[0], a[1], a[2], a[3], t, a[5], BGC.sky)); }
  neonSigns(t, G);
  if (S.gym === 2) { const glow = .7 + Math.sin(t * 3) * .05; c.save(); c.shadowColor = '#14b8a6'; c.shadowBlur = 18; c.fillStyle = `rgba(20,184,166,${glow})`; c.font = `900 ${Math.max(18, H * .07)}px "Arial Black", Arial, sans-serif`; c.textAlign = 'center'; c.fillText('FIT+', W * .82, 64); c.restore(); }
  drawTrophyCase(t);
  return st;
}
Sc.windows = () => BGC.win;
function drawGymStatic(t) {
  const S = MK.S, G = Sc.geo(), st = GYMSTYLE[S.gym], yF = G.yF;
  // Wand
  let g = c.createLinearGradient(0, 0, 0, yF); g.addColorStop(0, st.wall[1]); g.addColorStop(1, st.wall[0]); c.fillStyle = g; c.fillRect(0, 0, W, yF);
  c.drawImage(wallTex(S.gym, yF), 0, 0, W, yF);
  if (S.gym === 0) { // Beton, Risse, Rohr
    c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1; c.beginPath(); c.moveTo(W * .12, 30); c.lineTo(W * .15, 70); c.lineTo(W * .13, 110); c.stroke();
    c.fillStyle = '#6b6560'; c.fillRect(0, 14, W, 9); c.fillStyle = 'rgba(255,255,255,.1)'; c.fillRect(0, 14, W, 2);
    c.fillStyle = '#2a3a44'; c.fillRect(W * .34 - 5, 20, W * .2 + 10, yF * .24 + 10); win(W * .34, 25, W * .2, yF * .24, t, 1); // Kellerfenster: breit, knapp unter der Decke
    // Wasserfleck
    ell(W * .3, yF - 40, 26, 14, 'rgba(0,0,0,.08)');
  }
  if (S.gym === 1) { // Backstein + Wimpel
    const cols = ['#d83a32', '#ffffff', '#2f6fd1']; for (let i = 0; i < 14; i++) { const x = i * W / 13; c.fillStyle = cols[i % 3]; c.beginPath(); c.moveTo(x, 18); c.lineTo(x + W / 13, 18); c.lineTo(x + W / 26, 38); c.fill(); }
    c.strokeStyle = '#5e4a2e'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, 18); c.lineTo(W, 18); c.stroke();
    c.fillStyle = '#5e4a2e'; c.font = `700 ${Math.max(10, H * .03)}px Georgia, serif`; c.textAlign = 'center'; c.fillText('SV EISEN 1921', W * .5, yF * .66);
    [.35, .515].forEach(x => { c.fillStyle = '#5e4a2e'; c.fillRect(W * x - 5, yF * .14 - 5, W * .135 + 10, yF * .38 + 10); c.fillStyle = '#efe6d2'; c.fillRect(W * x - 8, yF * .52 + 4, W * .135 + 16, 5); win(W * x, yF * .14, W * .135, yF * .38, t, 2); });
  }
  if (S.gym === 2) { // Neon + Fenster
    for (let i = 0; i < 3; i++) { c.fillStyle = '#c9d2d8'; c.fillRect(W * (.335 + i * .11) - 3, 23, W * .095 + 6, yF * .62 + 6); win(W * (.335 + i * .11), 26, W * .095, yF * .62, t, 1); }
  }
  if (S.gym === 3) { // dunkel, rote Streifen
    c.fillStyle = '#d83a32'; c.fillRect(0, yF * .55, W, 6); c.fillStyle = 'rgba(216,58,50,.4)'; c.fillRect(0, yF * .55 + 10, W, 2);
    c.fillStyle = '#0d0d10'; c.fillRect(W * .36 - 4, 18, W * .26 + 8, yF * .32 + 8); win(W * .36, 22, W * .26, yF * .32, t, 2);
    c.fillStyle = 'rgba(255,255,255,.06)'; c.font = `900 ${Math.max(22, H * .1)}px "Arial Black", Arial, sans-serif`; c.textAlign = 'center'; c.fillText('NO EXCUSES', W * .5, yF * .53);
  }
  if (S.gym === 4) { // Vorhänge, Säulen
    for (let i = 0; i < 2; i++) { const x0 = i ? W * .88 : 0; g = c.createLinearGradient(x0, 0, x0 + W * .12, 0); g.addColorStop(0, '#5a0f1f'); g.addColorStop(.5, '#8a1a30'); g.addColorStop(1, '#4a0c18'); c.fillStyle = g; c.fillRect(x0, 0, W * .12, yF); }
    [.335, .535].forEach(x => { c.fillStyle = '#c9971c'; c.fillRect(W * x - 5, 64, W * .13 + 10, yF * .5 + 8); c.fillStyle = '#1a0a10'; c.fillRect(W * x - 2, 67, W * .13 + 4, yF * .5 + 2); win(W * x, 68, W * .13, yF * .5, t, 2); });
    c.fillStyle = '#e6b422'; c.fillRect(0, 0, W, 8); c.font = `900 ${Math.max(16, H * .055)}px Georgia, serif`; c.textAlign = 'center'; c.fillStyle = 'rgba(230,180,34,.85)'; c.fillText('★ MUSKEL-TEMPEL ★', W * .5, 48);
  }
  // Poster je nach Ruhm
  if (S.gym >= 1 && S.fame > 40) { const px = W * .07, py = 70; c.fillStyle = '#f1efe9'; c.fillRect(px, py, 44, 60); c.fillStyle = '#d83a32'; c.fillRect(px + 4, py + 4, 36, 34); c.fillStyle = '#111'; c.font = '700 7px Arial'; c.textAlign = 'center'; c.fillText('DU!', px + 22, py + 50); }
  // Fußleiste + Boden
  c.fillStyle = st.trim; c.fillRect(0, yF - 7, W, 7); c.fillStyle = 'rgba(255,255,255,.22)'; c.fillRect(0, yF - 7, W, 1.2); c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(0, yF - 1.5, W, 1.5);
  c.drawImage(floorTex(S.gym, yF), 0, yF, W, H - yF);
  if (S.gym === 3) { c.fillStyle = '#3a2a1a'; c.fillRect(W * .32, H - 40, W * .36, 40); c.fillStyle = 'rgba(255,255,255,.05)'; c.fillRect(W * .32, H - 40, W * .36, 2); }
  if (S.gym === 4) { g = c.createRadialGradient(W * .5, H - 10, 10, W * .5, H - 10, W * .45); g.addColorStop(0, 'rgba(255,220,140,.35)'); g.addColorStop(1, 'rgba(255,220,140,0)'); c.fillStyle = g; c.fillRect(0, yF, W, H - yF); }
  return st;
}
/* Pokal-Vitrine an der Wand: gewonnene Turnier-Pokale stehen sichtbar im Gym */
const CASE_X = [.66, .91, .7, .7, .72], TCOL = { bronze: ['#cd7f32', '#8a5320'], silber: ['#e3e8ee', '#9aa3ad'], gold: ['#f2c230', '#a77d0e'], platin: ['#cfeef7', '#7fb7c9'], diamant: ['#8ff0ff', '#2fa9c9'] };
function drawTrophyCase(t) {
  const S = MK.S, won = MK.TOURNEYS.filter(T => S.trophies[T.id]); if (!won.length && S.fame < 10) return;
  const G = Sc.geo(), cw = Math.min(W * .14, 120), chh = G.yF * .26, x0 = W * CASE_X[S.gym] - cw / 2, y0 = G.yF * .14;
  c.fillStyle = '#4a321c'; c.fillRect(x0 - 4, y0 - 4, cw + 8, chh + 8); c.fillStyle = 'rgba(30,40,50,.55)'; c.fillRect(x0, y0, cw, chh);
  c.fillStyle = '#6b4a2b'; [.5, 1].forEach(k => c.fillRect(x0, y0 + chh * k - 3, cw, 3));
  MK.TOURNEYS.forEach((T, i) => { const n = S.trophies[T.id] || 0, col = TCOL[T.trophy], cx = x0 + cw * ((i % 3) + .5) / 3, by = y0 + chh * (i < 3 ? .5 : 1) - 3, s = chh * .0055 * (1 + T.tier * .06);
    if (!n) { c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 1; c.strokeRect(cx - 7 * s, by - 26 * s, 14 * s, 26 * s); return; }
    c.fillStyle = col[1]; c.fillRect(cx - 7 * s, by - 5 * s, 14 * s, 5 * s); c.fillRect(cx - 2 * s, by - 11 * s, 4 * s, 6 * s);
    const g = c.createLinearGradient(cx - 9 * s, 0, cx + 9 * s, 0); g.addColorStop(0, col[1]); g.addColorStop(.4, col[0]); g.addColorStop(1, col[1]); c.fillStyle = g;
    c.beginPath(); c.moveTo(cx - 9 * s, by - 26 * s); c.lineTo(cx + 9 * s, by - 26 * s); c.quadraticCurveTo(cx + 8 * s, by - 12 * s, cx, by - 11 * s); c.quadraticCurveTo(cx - 8 * s, by - 12 * s, cx - 9 * s, by - 26 * s); c.fill();
    c.strokeStyle = col[0]; c.lineWidth = 1.6 * s; [-1, 1].forEach(d => { c.beginPath(); c.arc(cx + d * 9 * s, by - 21 * s, 3.5 * s, d > 0 ? -1.4 : 1.4, d > 0 ? 1.4 : 4.6, d < 0); c.stroke(); });
    if (Math.sin(t * 2 + i * 1.7) > .93) { c.fillStyle = '#fff'; c.fillRect(cx - 4 * s, by - 24 * s, 2 * s, 2 * s); }
    if (n > 1) { c.fillStyle = '#ffd23f'; c.font = `700 ${Math.max(8, 8 * s)}px Arial`; c.textAlign = 'center'; c.fillText('×' + n, cx + 8 * s, by - 1); } });
  c.fillStyle = 'rgba(255,255,255,.1)'; c.beginPath(); c.moveTo(x0 + cw * .15, y0); c.lineTo(x0 + cw * .32, y0); c.lineTo(x0 + cw * .12, y0 + chh); c.lineTo(x0 - 2, y0 + chh); c.fill();
}
function drawMirror(st, t, playerOpts) {
  const G = Sc.geo(), x0 = W * st.mirror[0], x1 = W * st.mirror[1], top = H * (st.mtop || .1), bot = G.yF + 4, gy = MK.S.gym;
  const FR = ['#6b6560', '#6e4124', '#c9d2d8', '#0d0d10', '#c9971c'][gy] || '#6b6560', fw = gy >= 4 ? 7 : 4;
  c.fillStyle = FR; c.fillRect(x0 - fw, top - fw, x1 - x0 + fw * 2, bot - top + fw + 2);
  if (gy >= 4) { c.strokeStyle = 'rgba(255,240,180,.7)'; c.lineWidth = 1; c.strokeRect(x0 - fw + 2, top - fw + 2, x1 - x0 + fw * 2 - 4, bot - top + fw - 2); }
  const g = c.createLinearGradient(x0, top, x1, bot); g.addColorStop(0, '#9fb2bd'); g.addColorStop(.5, '#7d909b'); g.addColorStop(1, '#5d6d76'); c.fillStyle = g; c.fillRect(x0, top, x1 - x0, bot - top);
  // Spiegelbild: Rückansicht des Spielers
  c.save(); c.beginPath(); c.rect(x0, top, x1 - x0, bot - top); c.clip();
  c.fillStyle = 'rgba(40,40,40,.25)'; c.fillRect(x0, bot - (bot - top) * .25, x1 - x0, (bot - top) * .25);
  if (playerOpts && MK.S.set.quality !== 'niedrig' && !(playerOpts.pose && (playerOpts.pose.lie || playerOpts.pose.side || playerOpts.pose.mode === 'sit'))) {
    const o = Object.assign({}, playerOpts, { key: 'mirror', back: true, alpha: .85, glow: 0, reuse: Sc._fr % 3 !== 0, dpr: Math.min(1, (window.devicePixelRatio || 1) * .6) }), mx = (x0 + x1) / 2, my = bot - 6, ms = G.pScale * .62, pose = o.pose || {};
    const ex = MK.curEx(), wi = ex ? MK.wCur(ex) : 0, lay = Sc.layout(o, mx, my, ms);
    const behind = Object.assign({}, pose, { props: (pose.props || []).filter(p => !(p.k === 'bar' && p.at === 'neck')) }), onBack = Object.assign({}, pose, { props: (pose.props || []).filter(p => p.k === 'bar' && p.at === 'neck') });
    c.globalAlpha = .85; drawBgProps(lay, pose, wi, ms, mx, my); if (!pose.armsBehind) drawHandProps(lay, behind, wi, ms); c.globalAlpha = 1;
    MK.Fig.render(c, mx, my, ms, o);
    c.globalAlpha = .85; drawHandProps(lay, onBack, wi, ms); if (pose.armsBehind) drawHandProps(lay, behind, wi, ms); c.globalAlpha = 1; }
  // Leute im Raum spiegeln sich mit (Rückansicht, kleiner und höher = weiter weg im Spiegelraum)
  if (MK.S.set.quality !== 'niedrig') { const ppl = Sc.crowd.filter(p => !p.dead).concat(NPC.filter(n => n.p && Sc.npcHere(n.id)).map(n => n.p)).filter(p => p.x > x0 - 40 && p.x < x1 + 40).sort((a, b) => b.y - a.y);
    ppl.forEach(p => { const f = frameOf(p, 'bk_' + (p.curFn || 'watch:0')) || frameOf(p, 'back:0'); if (!f) return; const d = Math.max(0, p.y - G.yF), sc = Math.max(.45, .78 - d * .004), mx = p.x, my = bot - 6 - d * .5;
      c.globalAlpha = .82; c.drawImage(f.c, mx - f.ox * sc, my - f.oy * sc, f.c.width * sc, f.c.height * sc); c.globalAlpha = 1; }); }
  // Spiegelungen
  c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.moveTo(x0 + 20, top); c.lineTo(x0 + 60, top); c.lineTo(x0 + 10, bot); c.lineTo(x0 - 30, bot); c.fill();
  c.fillStyle = 'rgba(255,255,255,.07)'; c.beginPath(); c.moveTo(x1 - 80, top); c.lineTo(x1 - 60, top); c.lineTo(x1 - 110, bot); c.lineTo(x1 - 130, bot); c.fill();
  { const R = MK.seedRand('mir' + gy), n = [16, 7, 2, 0, 0][gy] || 0, mw = x1 - x0, mh = bot - top; // Fingerabdrücke & Schlieren: Keller schmutzig, oben makellos
    for (let i = 0; i < n; i++) { const fx = x0 + R() * mw, fy = top + mh * (.3 + R() * .5), r = 3 + R() * 4; c.fillStyle = 'rgba(255,255,255,.07)'; c.beginPath(); c.ellipse(fx, fy, r, r * 1.3, R(), 0, TAU); c.fill(); c.strokeStyle = 'rgba(120,110,95,.12)'; c.lineWidth = .7; for (let j = 1; j <= 3; j++) { c.beginPath(); c.ellipse(fx, fy, r * j / 3.2, r * 1.3 * j / 3.2, 0, 0, TAU); c.stroke(); } }
    if (gy <= 1) { const dg = c.createLinearGradient(0, bot - mh * .2, 0, bot); dg.addColorStop(0, 'rgba(120,105,85,0)'); dg.addColorStop(1, `rgba(120,105,85,${gy ? .14 : .3})`); c.fillStyle = dg; c.fillRect(x0, bot - mh * .2, mw, mh * .2); }
    if (gy === 0) { c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x1 - 14, top + 10); c.lineTo(x1 - 34, top + 46); c.lineTo(x1 - 20, top + 70); c.stroke(); c.fillStyle = 'rgba(80,70,60,.25)'; for (let i = 0; i < 40; i++) c.fillRect(x0 + R() * mw, top + R() * mh, 1, 1); }
    if (gy >= 4) { const ph = (t * .12) % 1.6 - .3, sx = x0 + mw * ph; const sg = c.createLinearGradient(sx - 40, 0, sx + 40, 0); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(.5, 'rgba(255,255,255,.16)'); sg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = sg; c.fillRect(x0, top, mw, mh); } }
  c.restore();
}
/* Theke rechts: moderner schwarzer Glastür-Kühlschrank dahinter, LED-Leiste, Supplements, Boombox auf dem Tresen */
/* Theke über Eck (L-Form) – pro Gym ein eigener Look: Sperrholz-Bruchbude → Vereinsholz → weiß/neon → Beton + rote LED → schwarz/gold */
const BAR_ST = [
  { fr: ['#9a7a50', '#6e5232'], sd: ['#4e3a24', '#5f4729'], top: '#b9a079', edge: '#7a6346', led: null, txt: 'rgba(48,32,14,.8)', font: '700 Spx "Comic Neue", Arial', shabby: 1 },
  { fr: ['#6e4124', '#4a2a16'], sd: ['#33200f', '#45281a'], top: '#8d5c36', edge: '#c9a25a', led: null, txt: '#ecd6a4', font: '700 Spx Georgia, serif', planks: 1 },
  { fr: ['#f6f8fa', '#d6dce3'], sd: ['#aeb7c1', '#cbd2da'], top: '#ffffff', edge: '#c3c9d0', led: '#14d8c4', txt: '#1b2c36', font: '800 Spx Arial', gloss: 1 },
  { fr: ['#525865', '#2c3038'], sd: ['#1a1c21', '#2a2d34'], top: '#c9cdd3', edge: '#9aa0a8', led: '#ff3b1f', txt: 'rgba(220,226,235,.92)', font: '700 Spx "Comic Neue", Arial', concrete: 1 },
  { fr: ['#1b1b1f', '#060607'], sd: ['#040405', '#111114'], top: '#202026', edge: '#e6b422', led: '#e6b422', txt: '#f3c84e', font: '700 Spx Georgia, serif', gold: 1 }
];
function barBox(xL, xR, yb, h, bx, by, st, K, t, seed, noSide) {
  const yt = yb - h, w = xR - xL;
  // Seitenteil (zeigt zur Raummitte)
  if (!noSide) { const sg = c.createLinearGradient(xL - bx, 0, xL, 0); sg.addColorStop(0, st.sd[0]); sg.addColorStop(1, st.sd[1]); c.fillStyle = sg;
  c.beginPath(); c.moveTo(xL, yt); c.lineTo(xL - bx, yt - by); c.lineTo(xL - bx, yb - by); c.lineTo(xL, yb); c.closePath(); c.fill(); }
  // Front
  const g2 = c.createLinearGradient(0, yt, 0, yb); g2.addColorStop(0, st.fr[0]); g2.addColorStop(1, st.fr[1]); c.fillStyle = g2; c.fillRect(xL, yt, w, h);
  c.save(); c.beginPath(); c.rect(xL, yt, w, h); c.moveTo(xL, yt); c.lineTo(xL - bx, yt - by); c.lineTo(xL - bx, yb - by); c.lineTo(xL, yb); c.closePath(); c.clip();
  if (st.shabby) { // Sperrholz: Maserung, Flicken, Gaffa-Tape, Kratzer
    c.strokeStyle = 'rgba(60,40,20,.22)'; c.lineWidth = 1; for (let i = 0; i < 9; i++) { const y = yt + 6 * K + i * (h - 10 * K) / 9; c.beginPath(); c.moveTo(xL - bx, y); for (let x = xL - bx; x < xR; x += 12 * K) c.lineTo(x, y + Math.sin(x * .07 + i + seed) * 1.6 * K); c.stroke(); }
    c.strokeStyle = 'rgba(40,26,10,.55)'; c.lineWidth = 1.2; for (let x = xL + w * .33; x < xR; x += w * .33) { c.beginPath(); c.moveTo(x, yt); c.lineTo(x, yb); c.stroke(); }
    c.fillStyle = 'rgba(160,160,165,.85)'; c.save(); c.translate(xL + w * (seed < .5 ? .14 : .5), yt + h * .5); c.rotate(.5); c.fillRect(-14 * K, -3 * K, 28 * K, 6 * K); c.rotate(-1); c.fillRect(-14 * K, -3 * K, 28 * K, 6 * K); c.restore();
    c.fillStyle = 'rgba(30,20,10,.35)'; c.beginPath(); c.ellipse(xL + w * .2, yt + h * .7, 5 * K, 3 * K, .3, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,240,210,.25)'; c.lineWidth = 1; c.beginPath(); c.moveTo(xL + w * .7, yt + h * .3); c.lineTo(xL + w * .78, yt + h * .42); c.moveTo(xL + w * .12, yt + h * .25); c.lineTo(xL + w * .2, yt + h * .3); c.stroke();
  }
  if (st.planks) { c.strokeStyle = 'rgba(20,10,4,.5)'; c.lineWidth = 1.2; for (let x = xL + 11 * K; x < xR; x += 11 * K) { c.beginPath(); c.moveTo(x, yt); c.lineTo(x, yb); c.stroke(); }
    c.fillStyle = 'rgba(255,220,170,.06)'; for (let x = xL; x < xR; x += 22 * K) c.fillRect(x + 2 * K, yt, 4 * K, h);
    c.fillStyle = '#c9a25a'; c.fillRect(xL - bx, yb - 13 * K, w + bx, 2.4 * K); }
  if (st.gloss) { const gg = c.createLinearGradient(xL, yt, xL + w * .6, yb); gg.addColorStop(0, 'rgba(255,255,255,0)'); gg.addColorStop(.45, 'rgba(255,255,255,.55)'); gg.addColorStop(.55, 'rgba(255,255,255,0)'); c.fillStyle = gg; c.fillRect(xL, yt, w, h);
    c.strokeStyle = 'rgba(120,135,150,.35)'; c.lineWidth = 1; for (let x = xL + 30 * K; x < xR; x += 30 * K) { c.beginPath(); c.moveTo(x, yt + 12 * K); c.lineTo(x, yb - 6 * K); c.stroke(); } }
  if (st.concrete) { c.fillStyle = 'rgba(255,255,255,.035)'; for (let i = 0; i < 40; i++) { const rx = xL + ((i * 97.3 + seed) % 1) * w, ry = yt + 14 * K + ((i * 61.7) % 1) * (h - 18 * K); c.fillRect(rx, ry, 3 * K, 1.2 * K); } }
  if (st.gold) { c.strokeStyle = 'rgba(230,180,34,.55)'; c.lineWidth = 1; for (let x = xL + 16 * K; x < xR; x += 16 * K) { c.beginPath(); c.moveTo(x, yt + 14 * K); c.lineTo(x, yb - 8 * K); c.stroke(); }
    const gs = ((t * .15 + seed) % 1.4) - .2, gg = c.createLinearGradient(xL, 0, xR, 0); gg.addColorStop(Math.max(0, Math.min(1, gs - .08)), 'rgba(255,215,90,0)'); gg.addColorStop(Math.max(0, Math.min(1, gs)), 'rgba(255,215,90,.18)'); gg.addColorStop(Math.max(0, Math.min(1, gs + .08)), 'rgba(255,215,90,0)'); c.fillStyle = gg; c.fillRect(xL, yt, w, h); }
  c.restore();
  c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(xL, yb - 4 * K, w, 4 * K); // Sockel
  if (st.led) { c.fillStyle = st.led; c.shadowColor = st.led; c.shadowBlur = 12 * K; c.fillRect(xL, yt + 9 * K, w, 2.6 * K); c.beginPath(); c.moveTo(xL, yt + 9 * K); c.lineTo(xL - bx, yt - by + 9 * K); c.lineTo(xL - bx, yt - by + 11.6 * K); c.lineTo(xL, yt + 11.6 * K); c.fill(); c.shadowBlur = 0;
    c.globalAlpha = .13; c.fillRect(xL, yt + 11.6 * K, w, 10 * K); c.globalAlpha = 1; }
  // Platte oben
  c.fillStyle = st.top; c.beginPath(); c.moveTo(xL - 2 * K, yt); c.lineTo(xR, yt); c.lineTo(xR - bx, yt - by); c.lineTo(xL - bx - 2 * K, yt - by); c.closePath(); c.fill();
  const tg = c.createLinearGradient(0, yt - by, 0, yt); tg.addColorStop(0, st.gold ? 'rgba(255,230,160,.12)' : 'rgba(255,255,255,.5)'); tg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = tg; c.fill();
  if (st.shabby) { c.strokeStyle = 'rgba(90,60,30,.45)'; c.lineWidth = 1.2; c.beginPath(); c.ellipse(xL + w * .45 - bx * .5, yt - by * .5, 4 * K, 1.6 * K, 0, 0, TAU); c.stroke(); }
  c.fillStyle = st.edge; c.fillRect(xL - 2 * K, yt, w + 2 * K, 6 * K); c.fillStyle = st.gold ? 'rgba(255,240,180,.8)' : 'rgba(255,255,255,.55)'; c.fillRect(xL - 2 * K, yt, w + 2 * K, 1.2 * K);
  c.fillStyle = st.edge; c.beginPath(); c.moveTo(xL - 2 * K, yt); c.lineTo(xL - bx - 2 * K, yt - by); c.lineTo(xL - bx - 2 * K, yt - by + 6 * K); c.lineTo(xL - 2 * K, yt + 6 * K); c.fill();
}
let barP = null;
function drawBarkeeper(x, y, G, t, dt, K) {
  const S = MK.S, lv = Math.max(1, Math.round((1 + Math.min(150, MK.totalLv() * .12 + S.gym * 12)) / 4) * 4 - 3), k = K * .415;
  if (!barP || barP.lvB !== lv || barP.gym !== S.gym || Math.abs(barP.k - k) > .01) {
    const tops = ['tee-grau', 'tee-weiss', 'tank-gruen', 'tank-schwarz', 'stringer-gold'], L = MK.Fig.resolveLook({ skin: 's2', tan: lv > 60 ? 'tan2' : 'tan0', hairc: 'h4', hair: lv > 40 ? 'fade' : 'wuschel', beard: lv > 25 ? 'stoppel' : 'none', tattoo: lv > 90 ? 'tribal' : 'none', top: tops[S.gym] || 'tee-grau', bottom: 'b1', shoes: 'sh1', gloves: 'none', head: lv < 12 ? 'capback' : 'none', acc: 'none' });
    barP = { npc: 'bar', lvB: lv, gym: S.gym, fem: false, L, lv: Object.fromEntries(MK.MUSCLES.map(m => [m.id, lv])), post: Math.min(1, .05 + lv / 120), belly: 0, k, kAt: G.pScale, fr: {}, q: {}, side: -1, t: 0 };
  }
  const p = barP; p.x = x; p.y = y; p.t += dt;
  const o = Sc.barOrder; let fn;
  if (o && o.t > 2.2 && o.t < 3.9) fn = 'shake:' + (Math.floor(p.t * 9) % 2);
  else if (o && o.t >= 3.9 && o.t < 5) fn = 'serve:0';
  else { const cyc = Math.floor(p.t / 4) % 5; fn = cyc === 2 ? 'shake:' + (Math.floor(p.t * 7) % 2) : cyc === 4 ? 'watch:0' : 'wipe:' + (Math.floor(p.t * 2.6) % 2); }
  const f = frameOf(p, fn) || frameOf(p, 'watch:0') || Object.values(p.fr)[0]; if (!f) return;
  drawFrame(p, f); if (p.topW) Sc.npcPos.bar = { x: p.topW.x, y: p.topW.y };
}
function drawBar(G, k, t) {
  const K = k * 1.85, x1 = W + 6, cw = Math.min(W * .3, 260 * K), x0 = x1 - cw, yB = G.yF + 16, fh0 = 60 * K, yT = yB - fh0, dx = 22 * K, dd = 16 * K, lvl = MK.S.eq.kuehl || 1;
  const st = BAR_ST[Math.min(BAR_ST.length - 1, MK.S.gym)] || BAR_ST[3], lw = cw * .2, Fx = cw * .17, Fy = Fx * dd / dx, now = performance.now(), dt = Math.min(.1, (now - (Sc._barT || now)) / 1000); Sc._barT = now;
  const yF2 = yB + Fy, yt2 = yF2 - fh0, Dp = Fy + dd, Dx = Dp * dx / dd; // Front liegt vorn im Raum, der Schenkel läuft an der linken Seite nach hinten bis zur Wand
  Sc.barX0 = x0 - dx; Sc.barY = yF2; Sc.barSpot = { x: x0 + Fx - Dx * .4 - 18 * K, y: yF2 - Dp * .4 + 6 * K };
  if (Sc.barOrder) { Sc.barOrder.t += dt; if (Sc.barOrder.t > 12) Sc.barOrder = null; }
  // Kühlschrank an der Wand hinter der Theke
  const fw = 60 * K, fh = 128 * K, fx = x0 + cw * .44 - fw / 2 - dx * .6, fy = G.yF - 6 - fh;
  c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(fx + 7 * K, fy + 7 * K, fw, fh);
  const gf = c.createLinearGradient(fx, 0, fx + fw, 0); gf.addColorStop(0, '#2a2d33'); gf.addColorStop(.5, '#16181c'); gf.addColorStop(1, '#0b0c0e'); c.fillStyle = gf; c.beginPath(); c.roundRect(fx, fy, fw, fh, 3 * K); c.fill();
  c.fillStyle = '#0b0c0e'; c.beginPath(); c.moveTo(fx + fw, fy + 2 * K); c.lineTo(fx + fw + 8 * K, fy + 7 * K); c.lineTo(fx + fw + 8 * K, fy + fh + 2 * K); c.lineTo(fx + fw, fy + fh); c.fill(); // Seite
  const gx = fx + 5 * K, gy = fy + 14 * K, gw = fw - 10 * K, gh = fh - 22 * K, inn = c.createLinearGradient(0, gy, 0, gy + gh); inn.addColorStop(0, '#e6f6ff'); inn.addColorStop(1, '#9fc8e6'); c.fillStyle = inn; c.fillRect(gx, gy, gw, gh);
  const rows = 5, rh = gh / rows, cols = ['#ff5a36', '#2bb673', '#3a86ff', '#ffc83d', '#ff8fb1', '#f2f2f2', '#7b2cbf', '#1fb5d6'];
  for (let r = 0; r < rows; r++) { const sy = gy + (r + 1) * rh; c.fillStyle = 'rgba(255,255,255,.9)'; c.fillRect(gx, sy - 1.4 * K, gw, 1.4 * K); const n = 5 + (lvl > 1 ? 1 : 0);
    for (let i = 0; i < n; i++) { const bw = gw / n * .62, bx = gx + (i + .2) * gw / n, tall = (r + i) % 3 === 0, bh = rh * (tall ? .72 : .55); c.fillStyle = cols[(r * 3 + i) % cols.length]; c.beginPath(); c.roundRect(bx, sy - 1.4 * K - bh, bw, bh, 1.2 * K); c.fill(); if (tall) { c.fillStyle = '#222'; c.fillRect(bx + bw * .3, sy - 1.4 * K - bh - 2 * K, bw * .4, 2 * K); } c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(bx + bw * .15, sy - 1.4 * K - bh * .85, bw * .18, bh * .6); } }
  c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.moveTo(gx, gy); c.lineTo(gx + gw * .35, gy); c.lineTo(gx, gy + gh * .55); c.fill();
  c.strokeStyle = '#3a3d44'; c.lineWidth = 2 * K; c.strokeRect(gx, gy, gw, gh); c.fillStyle = '#c9ced4'; c.fillRect(gx + gw - 5 * K, gy + gh * .35, 2 * K, gh * .3);
  c.fillStyle = lvl >= 4 ? '#e6b422' : '#1fb5d6'; c.shadowColor = c.fillStyle; c.shadowBlur = 8 * K; c.fillRect(fx + 6 * K, fy + 5 * K, fw - 12 * K, 3 * K); c.shadowBlur = 0;
  Sc.kuehlRect = { x: fx, y: fy, w: fw, h: fh };
  if (st.shabby) { c.strokeStyle = 'rgba(30,30,30,.8)'; c.lineWidth = 1; c.beginPath(); c.moveTo(fx + fw * .7, fy - 40 * K); c.lineTo(fx + fw * .7, fy - 12 * K); c.stroke(); const gl = c.createRadialGradient(fx + fw * .7, fy - 8 * K, 1, fx + fw * .7, fy - 8 * K, 40 * K); gl.addColorStop(0, 'rgba(255,230,150,.45)'); gl.addColorStop(1, 'rgba(255,230,150,0)'); c.fillStyle = gl; c.fillRect(fx + fw * .7 - 40 * K, fy - 48 * K, 80 * K, 80 * K); circ(fx + fw * .7, fy - 8 * K, 4 * K, '#ffe9a8'); }
  // Barkeeper hinter dem Tresen
  drawBarkeeper(x0 + cw * .7 - dx * .5, yF2 - dd * .6, G, t, dt, K);
  // Bodenschatten
  c.fillStyle = 'rgba(0,0,0,.42)'; c.beginPath(); c.moveTo(x0 + Fx - Dx - 8 * K, yF2 - Dp + 2 * K); c.lineTo(x0 + Fx - 8 * K, yF2 + 9 * K); c.lineTo(x1, yF2 + 9 * K); c.lineTo(x1, yF2 - dd); c.closePath(); c.fill();
  // Langer Teil vorn + Schenkel nach hinten zur Wand (über Eck)
  barBox(x0 + Fx + lw, x1, yF2, fh0, dx, dd, st, K, t, .1, true);
  c.fillStyle = st.txt; c.font = st.font.replace('S', Math.round(15 * K)); c.textAlign = 'center'; c.textBaseline = 'middle'; if (st.gold) { c.shadowColor = 'rgba(230,180,34,.7)'; c.shadowBlur = 8 * K; }
  c.fillText(MK.GYMS[MK.S.gym].name, x0 + Fx + lw + (cw - Fx - lw) * .5, yt2 + fh0 * .6); c.shadowBlur = 0; c.textBaseline = 'alphabetic';
  const onTop = (fxp, dep) => ({ x: x0 + cw * fxp - dx * dep, y: yt2 - dd * dep });
  [[.84, .5, '#f4efe4', '#3a86ff', 0], [.92, .35, '#26262c', '#c9ced4', 1]].forEach(([fxp, dep, body, lid, big]) => { const p = onTop(fxp, dep), bh = (big ? 26 : 18) * K, bw2 = (big ? 17 : 12) * K;
    c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(p.x + 3 * K, p.y, bw2 * .6, 2.5 * K, 0, 0, TAU); c.fill();
    c.fillStyle = body; c.beginPath(); c.roundRect(p.x - bw2 / 2, p.y - bh, bw2, bh, 2.5 * K); c.fill(); c.fillStyle = lid; c.fillRect(p.x - bw2 / 2, p.y - bh, bw2, 4 * K); c.fillRect(p.x - bw2 / 2, p.y - bh * .55, bw2, bh * .25); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(p.x - bw2 * .35, p.y - bh * .9, bw2 * .15, bh * .7); });
  barBox(x0 + Fx, x0 + Fx + lw, yF2, fh0, Dx, Dp, st, K, t, .6);
  // Bestellter Shake steht vorn auf der Platte bereit
  if (Sc.barOrder && Sc.barOrder.t > 4.2 && Sc.barOrder.t < 5.6) { const sx = x0 + Fx + lw * .5 - Dx * .2, sy = yt2 - Dp * .2; c.fillStyle = '#f4efe4'; c.beginPath(); c.roundRect(sx - 4 * K, sy - 14 * K, 8 * K, 14 * K, 2 * K); c.fill(); c.fillStyle = '#ee4035'; c.fillRect(sx - 4 * K, sy - 14 * K, 8 * K, 3 * K); }
  // Boombox auf dem Schenkel (Ecke)
  if (MK.S.eq.boombox) { Sc._boomOnBar = true; EQDRAW.boombox(x0 + Fx + lw * .5 - Dx * .62, yt2 - Dp * .62 + 2, k * 1.0, t); Sc._boomOnBar = false; }
}
function drawEquipment(t) {
  const G = Sc.geo(), k = G.bg * .9;
  // drei Tiefen (Wand, Raummitte, vorne), hinten zuerst – und nie hinter der Theke: rechter Rand endet vor ihr
  const L = eqLayout(), DY = [-8, 10, 27], DS = [.8, .92, 1.04], barL = MK.S.eq.kuehl ? (Sc.barX0 || W * .66) - 8 * k : W + 999;
  Object.keys(L).sort((a, b) => L[a].d - L[b].d).forEach(id => { const d = L[id].d, kk = k * DS[d], y = G.yF + DY[d], x = Math.min(L[id].x * W, barL - 62 * kk); contactShadow(x, y + 1, 52 * kk, 7 * kk, .45); EQDRAW[id](x, y, kk, t); });
  if (MK.S.eq.kuehl) drawBar(G, k, t); else if (MK.S.eq.boombox) { Sc._boomOnBar = false; EQDRAW.boombox(FIXED.boombox * W, G.yF + 6, k, t); }
}

/* ======================================================================
   MENSCHEN IM GYM: Zuschauer, NPCs, Rivale – echte Figuren als vorgezeichnete Sprites
   ====================================================================== */
const spriteQ = [];
function frameOf(p, fr) { const f = p.fr[fr]; if (f) return f; if (!p.q[fr]) { p.q[fr] = 1; spriteQ.push([p, fr]); } return null; }
function buildSprites(ms) { const t0 = performance.now(); while (spriteQ.length && performance.now() - t0 < ms) { const [p, fr] = spriteQ.shift(); if (!p.dead && !p.fr[fr]) p.fr[fr] = renderFrame(p, fr); } }
function renderFrame(p, fr) {
  const isBk = fr.startsWith('bk_'); if (isBk) fr = fr.slice(3); // Spiegelbild: gleiche Pose von hinten
  const k = p.k, w = Math.ceil((p.npc === 'trainer' ? 300 : 230) * k), h = Math.ceil(440 * k), cv2 = document.createElement('canvas'); cv2.width = w; cv2.height = h;
  const x2 = cv2.getContext('2d'), ox = w / 2, oy = h - 10 * k, F = MK.Fig.poses;
  const D = MK.Fig.dims(p.lv, p.post, 0, null, { fem: p.fem, plain: true, belly: p.belly });
  const [name, n] = fr.split(':'), ph = +n || 0, arm = p.side > 0 ? 'l' : 'r'; // Arm, der zum Spieler zeigt
  let pose = { face: 'neutral' }, face = null, back = false, prop = null;
  if (name.startsWith('du_')) { const pn = name.slice(3); pose = F[pn]([.05, .5, .95, .5][ph % 4], 0, D, { rep: 0 }); face = pose.face; if ((pose.props || []).some(q => q.k === 'db')) prop = 'db'; }
  else switch (name) {
    case 'walk': pose = F.walk(0, ph / 6, D); break;
    case 'phone': pose = F.i_phone(.5, 0, D); prop = 'phone'; break;
    case 'film': pose = { arms: { [arm]: { t: [D.shH * .3 + 12, -10 + ph * 3], b: 'down' } }, look: { x: p.side > 0 ? -1 : 1, y: 0 } }; prop = 'phone'; break;
    case 'point': pose = { arms: { [arm]: { a: [1.35 + ph * .1, 1.42 + ph * .1] } }, look: { x: p.side > 0 ? -1 : 1, y: 0 } }; face = 'proud'; break;
    case 'laugh': pose = { arms: { l: { t: [8, 60 + ph * 3], b: 'out' }, r: { t: [8, 60 + ph * 3], b: 'out' } }, head: { y: ph * 2 } }; face = 'proud'; break;
    case 'clap': pose = { arms: { l: { t: [ph ? 4 : 13, 34], b: 'down' }, r: { t: [ph ? 4 : 13, 34], b: 'down' } }, look: { x: p.side > 0 ? -1 : 1, y: 0 } }; face = 'proud'; break;
    case 'cheer': pose = F.cheer(0, ph * .25, D); face = 'proud'; break;
    case 'watch': pose = { arms: { l: { t: [D.shH + 4, 52], b: 'out' }, r: { t: [D.shH + 4, 52], b: 'out' } }, look: { x: p.side > 0 ? -1 : 1, y: 0 } }; break;
    case 'curl': pose = F.curl(Math.sin(ph / 6 * Math.PI), 0, D); prop = 'db'; break;
    case 'lateral': pose = F.lateral(ph ? .85 : .05, 0, D); prop = 'db'; break;
    case 'flex': pose = F.flex(0, 0, D); back = true; break;
    case 'pose': // Posing: Doppelbizeps vorne, Lat-Spread, Seit-Bizeps, Doppelbizeps hinten (je 2 Bilder: anspannen/locker)
      if (ph % 4 === 0) { pose = F.flex(0, 0, D); face = 'proud'; }
      else if (ph % 4 === 1) { pose = { arms: { l: { t: [D.shH + 6, 50], b: 'out' }, r: { t: [D.shH + 6, 50], b: 'out' } }, head: { y: -1 } }; face = 'effort'; }
      else if (ph % 4 === 2) { pose = { arms: { l: { a: [1.45, 3.0], fx: .55, flex: 1 }, r: { t: [8, 40], b: 'down' } } }; face = 'proud'; }
      else { pose = F.flex(0, 0, D); back = true; }
      if (ph >= 4) { pose = { arms: { l: { t: [D.shH + 2, 58], b: 'out' }, r: { t: [D.shH + 2, 58], b: 'out' } } }; face = 'neutral'; } break;
    case 'ready': { const up = ph === 1 ? 1 : 0; pose = { arms: { l: { t: [D.shH * .55 + 4, lerp(30, 6, up)], b: 'down', zf: .3 }, r: { t: [D.shH * .55 + 4, lerp(30, 6, up)], b: 'down', zf: .3 } }, legs: { l: { d: .12 }, r: { d: .12 } }, look: { x: 1, y: 0 }, head: { x: 2 } }; face = up ? 'focus' : 'neutral';
      if (ph === 2) { pose.arms = { l: { t: [D.shH * .55 + 4, 30], b: 'down', zf: .3 }, r: { a: [1.2, 2.7], fx: .6 } }; face = 'proud'; } break; }
    case 'order': pose = { arms: { r: { a: [1.3 + ph * .22, 1.4 + ph * .5] }, l: { t: [D.shH + 4, 52], b: 'out' } }, look: { x: 1, y: -.3 }, head: { x: 2 } }; face = ph ? 'proud' : 'neutral'; break;
    case 'drink': pose = F.i_drink(ph ? .42 : .04, 0, D); pose.props = []; face = ph ? 'drink' : 'proud'; prop = 'cup'; break;
    case 'wipe': pose = { arms: { r: { t: [ph ? D.shH + 22 : 2, 40], b: 'down', zf: .4 }, l: { t: [D.shH * .4 + 8, 44], b: 'down', zf: .3 } }, look: { x: 0, y: .6 }, head: { y: 3 } }; prop = 'rag'; break;
    case 'shake': pose = { arms: { r: { t: [10, ph ? -8 : 16], b: 'out' }, l: { t: [D.shH + 4, 52], b: 'out' } }, look: { x: 1, y: 0 } }; face = 'focus'; prop = 'shaker'; break;
    case 'serve': pose = { arms: { r: { a: [1.2, 1.35] }, l: { t: [D.shH + 4, 52], b: 'out' } }, look: { x: -1, y: 0 } }; face = 'proud'; prop = 'cup'; break;
    case 'back': pose = { arms: { l: { t: [D.shH + 4, 52], b: 'out' }, r: { t: [D.shH + 4, 52], b: 'out' } } }; back = true; break;
    case 'tsit': { pose = { mode: 'sit', hipY: -52, thighF: .3, shinF: .82, spread: 10, lean: .05, look: { x: 1, y: .1 }, head: { x: 5 } };
      if (ph === 1) pose.arms = { l: { t: [D.shH * .3 + 6, 38], b: 'down', zf: .4 }, r: { t: [D.shH * .3 + 2, 34], b: 'down', zf: .5 } };
      else if (ph === 2) pose.arms = { l: { t: [D.shH * .3 + 6, 38], b: 'down', zf: .4 }, r: { a: [1.25, 1.35] } };
      else pose.arms = { l: { t: [D.shH * .3 + 6, 38], b: 'down', zf: .4 }, r: { t: [D.shH + 6, 50], b: 'out' } };
      face = ph === 2 ? 'proud' : 'focus'; prop = 'clip'; break; }
    case 'mop': pose = F.walk(0, ph / 6, D); pose.arms = { l: { t: [6, 40], b: 'down' }, r: { t: [14, 20], b: 'down' } }; break;
  }
  if (isBk) { back = true; prop = null; }
  const o = { key: 'spr', lv: p.lv, L: p.L, pose, posture: p.post, fem: p.fem, plain: true, belly: p.belly, dpr: 1, back, face: face || pose.face };
  const R = MK.Fig.render(x2, ox, oy, k, o);
  if (prop === 'phone') { const hd = R.ha[name === 'film' ? arm : 'r']; x2.fillStyle = '#16161a'; x2.fillRect(hd.x - 3.5 * k, hd.y - 9 * k, 7 * k, 12 * k); x2.fillStyle = 'rgba(140,200,255,.9)'; x2.fillRect(hd.x - 2.6 * k, hd.y - 8 * k, 5.2 * k, 10 * k); }
  if (prop === 'cup' || prop === 'shaker') { const hd = R.ha.r, big = prop === 'shaker'; x2.fillStyle = big ? '#26262c' : '#f4efe4'; x2.beginPath(); x2.roundRect(hd.x - (big ? 4.5 : 4) * k, hd.y - (big ? 18 : 13) * k, (big ? 9 : 8) * k, (big ? 18 : 13) * k, 2 * k); x2.fill(); x2.fillStyle = big ? '#c9ced4' : '#2bb673'; x2.fillRect(hd.x - (big ? 4.5 : 4) * k, hd.y - (big ? 18 : 13) * k, (big ? 9 : 8) * k, 3 * k); if (!big) { x2.strokeStyle = '#ddd'; x2.lineWidth = 1.2 * k; x2.beginPath(); x2.moveTo(hd.x + 1 * k, hd.y - 13 * k); x2.lineTo(hd.x + 3 * k, hd.y - 19 * k); x2.stroke(); } }
  if (prop === 'clip') { const hd = R.ha.l; x2.save(); x2.translate(hd.x + 2 * k, hd.y - 6 * k); x2.rotate(-.25); x2.fillStyle = '#7a5530'; x2.beginPath(); x2.roundRect(-9 * k, -12 * k, 18 * k, 24 * k, 2 * k); x2.fill(); x2.fillStyle = '#f6f2e8'; x2.fillRect(-7 * k, -9 * k, 14 * k, 19 * k); x2.fillStyle = '#9aa0a8'; x2.fillRect(-4 * k, -13 * k, 8 * k, 4 * k); x2.strokeStyle = 'rgba(40,40,60,.5)'; x2.lineWidth = .8 * k; for (let i = 0; i < 4; i++) { x2.beginPath(); x2.moveTo(-5 * k, (-5 + i * 4) * k); x2.lineTo(5 * k, (-5 + i * 4) * k); x2.stroke(); } x2.restore(); }
  if (prop === 'rag') { const hd = R.ha.r; x2.fillStyle = '#e9e3d4'; x2.beginPath(); x2.moveTo(hd.x - 7 * k, hd.y - 1 * k); x2.lineTo(hd.x + 8 * k, hd.y - 3 * k); x2.lineTo(hd.x + 6 * k, hd.y + 5 * k); x2.lineTo(hd.x - 6 * k, hd.y + 6 * k); x2.closePath(); x2.fill(); }
  if (prop === 'db') ['l', 'r'].forEach(h => dumbbell(R.ha[h].x, R.ha[h].y + 2 * k, k * .9, p.dbKg || 6, false, false));
  return { c: cv2, ox, oy, top: R.top, ha: R.ha };
}
/* 3D-Umgebung: weicher Silhouetten-Schatten einer 2D-Figur auf dem Boden. Licht kommt (wie im 3D-Raum) von vorne links oben,
   also fällt der Schatten nach hinten rechts: Figur am Fußpunkt flach auf den Boden gekippt und geschert. Silhouette in ¼ Auflösung = weich. */
function figShadow(img, dx, dy, dw, dh, fx, fy, a, cache) {
  if (!Sc.env3dOn || MK.S.set.quality === 'niedrig' || !img || !dw || !dh) return;
  let s = cache && cache._sh;
  if (!s) { const w = Math.max(6, Math.round(dw / 4)), h = Math.max(6, Math.round(dh / 4)); s = cache ? document.createElement('canvas') : (Sc._shBuf || (Sc._shBuf = document.createElement('canvas')));
    if (s.width !== w || s.height !== h) { s.width = w; s.height = h; } const x = s.getContext('2d'); x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, w, h); x.drawImage(img, 0, 0, w, h);
    x.globalCompositeOperation = 'source-in'; x.fillStyle = '#1c1208'; x.fillRect(0, 0, w, h); if (cache) cache._sh = s; }
  c.save(); c.globalAlpha = a; c.translate(fx, fy); c.transform(1, 0, -.5, .26, 0, 0); c.drawImage(s, dx - fx, dy - fy, dw, dh); c.restore();
}
function drawFrame(p, f, alpha) { if (!f) return false; if (alpha == null) figShadow(f.c, p.x - f.ox, p.y - f.oy, f.c.width, f.c.height, p.x, p.y, .22, f); if (alpha != null) c.globalAlpha = alpha; c.drawImage(f.c, p.x - f.ox, p.y - f.oy); c.globalAlpha = 1; p.topW = { x: p.x - f.ox + f.top.x, y: p.y - f.oy + f.top.y }; p.haW = { l: { x: p.x - f.ox + f.ha.l.x, y: p.y - f.oy + f.ha.l.y }, r: { x: p.x - f.ox + f.ha.r.x, y: p.y - f.oy + f.ha.r.y } }; return true; }
function shadowAt(p) { contactShadow(p.x, p.y + 1, 38 * p.k, 7 * p.k, .38); }

const SKINS = ['s1', 's2', 's3', 's4', 's5'], TOPS_M = ['tee-rot', 'tee-blau', 'tee-grau', 'tee-weiss', 'tank-schwarz', 'tank-gruen', 'hoodie', 'kompr'], TOPS_F = ['tank-schwarz', 'tee-weiss', 'hoodie', 'kompr', 'tank-gruen'];
const BRA = ['#ff5fa2', '#7b2cbf', '#14b8a6', '#26262a', '#ff8a3d'];
function randomPerson(r) {
  const fem = r() < .42, pick2 = a => a[Math.floor(r() * a.length)], W2 = MK.WARD;
  const ids = { skin: pick2(SKINS), tan: 'tan0', hairc: pick2(['h1', 'h2', 'h3', 'h4', 'h6']), hair: fem ? pick2(['lang', 'dutt', 'lang', 'pferde', 'bob', 'zopf', 'afro', 'mittel']) : pick2(['kurz', 'buzz', 'glatze', 'undercut', 'locken', 'seiten', 'fade', 'stachel', 'cornrows', 'flattop', 'afro', 'dreads', 'zurueck', 'wuschel', 'kranz']),
    beard: fem ? 'none' : pick2(['none', 'none', 'stoppel', 'voll', 'schnauz']), tattoo: 'none', top: pick2(fem ? TOPS_F : TOPS_M), bottom: pick2(['b1', 'b2', 'b3']), shoes: pick2(['sh1', 'sh2', 'sh3', 'sh4']), gloves: 'none', head: r() < .2 ? pick2(['cap', 'capback', 'beanie', 'kopfhoerer']) : 'none', acc: 'none' };
  const L = MK.Fig.resolveLook(ids); if (fem && r() < .5) L.top = { val: pick2(BRA), cut: 'bra' };
  const base = 1 + Math.floor(Math.pow(r(), 1.6) * 70), lv = Object.fromEntries(MK.MUSCLES.map(m => [m.id, Math.max(1, base * (.7 + r() * .6))]));
  return { fem, L, lv, post: .3 + r() * .6, belly: r() < .2 ? 3 + r() * 4 : 0 };
}
Sc.crowd = []; let spawnT = 6, crowdInit = false, pidN = 0;
const crowdCap = () => { const S = MK.S, gym = MK.GYMS[S.gym], bo = MK.bonus().crowd || 0; return Math.min(gym.cap + bo, Math.floor(Math.sqrt(S.fame) * .75) + bo); };
function laneOf(front) { const G = Sc.geo(); return front ? { y: G.yF + 34 + Math.random() * 14, f: .68 } : { y: G.yF + 12 + Math.random() * 8, f: .6 }; }
function freeSpot(k) { for (let i = 0; i < 20; i++) { const x = (Math.random() < .5 ? .05 + Math.random() * .3 : .65 + Math.random() * .3) * W; if (Sc.barX0 && x > Sc.barX0 - 50 * k) continue; if (Sc.crowd.every(p => !p.watch || Math.abs((p.stopX || p.x) - x) > 70 * k)) return x; } return null; }
function newPerson(watch, place) {
  const G = Sc.geo(), r = MK.seedRand('p' + (pidN++) + ':' + Date.now()), base = randomPerson(r), ln = laneOf(Math.random() < .5), k = G.pScale * ln.f;
  const dir = Math.random() < .5 ? 1 : -1, p = Object.assign(base, { id: pidN, k, kAt: G.pScale, y: ln.y, dir, x: dir > 0 ? -60 * k : W + 60 * k, speed: (50 + Math.random() * 30) * k, mode: 'walk', wph: Math.random(), fr: {}, q: {}, watch, t: 0 });
  if (watch) { const sx = freeSpot(k); if (sx == null) { p.watch = false; } else { p.stopX = sx; if (place) { p.x = sx; p.mode = 'stay'; p.stayT = 20 + Math.random() * 40; } } }
  p.side = (p.stopX || p.x) < G.px ? -1 : 1;
  const st = MK.stage(); p.acts = !p.watch ? [] : st <= 1 ? [['point', 'laugh', 'film'][Math.floor(Math.random() * 3)]] : st <= 3 ? [['clap', 'film', 'watch'][Math.floor(Math.random() * 3)]] : [['cheer', 'clap', 'film'][Math.floor(Math.random() * 3)]];
  if (!p.watch && Math.random() < .5) p.phoneWalk = true;
  Sc.crowd.push(p); return p;
}
Sc.buildCrowd = function () { if (!W) return; const G = Sc.geo(); Sc.crowd.forEach(p => { if (Math.abs(p.kAt - G.pScale) > .01) { p.dead = true; } }); Sc.crowd = Sc.crowd.filter(p => !p.dead); NPC.forEach(n => { n.p = null; }); rivalP = null; };
Sc.crowdSay = p => { const t = performance.now(); if (t < (Sc._sayT || 0) || MK.Comp && MK.Comp.cur) return; Sc._sayT = t + 7000; const i = Sc.crowd.indexOf(p), st = MK.stage(); if (i >= 0) Sc.say(i, MK.pickLine(MK.LINES.stage[st], 'st' + st), 3.6); };
Sc.fillCrowd = n => { for (let i = 0; i < n; i++) newPerson(true, true); };
function updateCrowd(dt) {
  const S = MK.S, st = MK.stage(), cap = crowdCap();
  if (S.set.npc === false) { Sc.crowd.length = 0; return; }
  if (!crowdInit) { crowdInit = true; for (let i = 0; i < Math.min(cap, 2); i++) newPerson(true, true); }
  const watchers = Sc.crowd.filter(p => p.watch).length;
  // Am Anfang kommt nur selten mal jemand vorbei, mit Ruhm werden es langsam mehr
  // nie zu voll: ein paar Leute gleichzeitig, aber mit Ruhm kommen sie öfter vorbei
  const maxOn = Math.max(1, Math.min(7, Math.round((1.5 + Math.min(4, Math.sqrt(S.fame) * .14) + S.gym * .3) * Sc.crowdDay()))), walkers = Sc.crowd.filter(p => !p.watch).length;
  if ((spawnT -= dt) < 0) {
    spawnT = Math.max(3.5, (40 + Math.random() * 30) / (1 + Math.sqrt(S.fame) / 4));
    const wantWatch = watchers < Math.min(cap, 3) && Math.random() < .35 + st * .08;
    if (Sc.crowd.length < maxOn && (wantWatch || walkers < Math.max(1, Math.ceil(maxOn / 3)))) { const np = newPerson(wantWatch, false);
      if (!wantWatch && S.eq.kuehl && Sc.barSpot && !Sc.crowd.some(q => q.barSt) && Math.random() < .55) { np.barSt = 'go'; np.dir = 1; np.x = -60 * np.k; np.phoneWalk = false; np.y0 = Sc.barSpot.y; } }
  }
  Sc.crowd.forEach(p => {
    p.t += dt;
    if (p.y0 == null) p.y0 = p.y; { const inBar = !p.barSt && MK.S.eq.kuehl && Sc.barX0 && p.x > Sc.barX0 - 46 * p.k, ty = p.barSt && Sc.barSpot ? Sc.barSpot.y : inBar ? Math.max(p.y0, Sc.barY + 14 * p.k) : p.y0; p.y += (ty - p.y) * Math.min(1, dt * 4); } // um die Theke herum, nicht durch sie
    if (p.barSt && p.barSt !== 'go') { p.bt = (p.bt || 0) + dt; // an der Theke: bestellen → warten → trinken → gehen
      if (p.barSt === 'order' && p.bt > 2.2) p.barSt = 'wait';
      if (p.barSt === 'wait' && p.bt > 5) { p.barSt = 'drink'; if (Math.random() < .35) Sc.say('bar', pick(['Bitte, ein Shake!', 'Läuft!', 'Wohl bekommt’s!', 'Extra Protein drin.']), 2); }
      if (p.barSt === 'drink' && p.bt > 10) { p.barSt = null; p.mode = 'walk'; p.dir = -1; p.cup = true; p.y0 = laneOf(true).y; }
      return; }
    if (p.barSt === 'go' && Sc.barSpot && p.x >= Sc.barSpot.x - 30 * p.k) { p.barSt = 'order'; p.mode = 'bar'; p.bt = 0; p.side = 1; Sc.barOrder = { p, t: 0 }; }
    if (p.mode === 'walk') { p.x += p.dir * p.speed * dt; p.wph = (p.wph + dt * p.speed / (55 * p.k)) % 1;
      if (p.watch && p.stopX != null && Math.abs(p.x - p.stopX) < p.speed * dt * 1.5) { p.mode = 'stay'; p.stayT = 6 + Math.random() * 7; if (Math.random() < .7) Sc.crowdSay(p); }
      if (!p.watch && !p.said && st >= 2 && Math.abs(p.x - Sc.geo().px) < 70 * p.k && Math.random() < .5) { p.said = 1; Sc.crowdSay(p); } // im Vorbeigehen ein Lob
      if (p.x < -120 * p.k || p.x > W + 120 * p.k) p.dead = true; }
    else if (p.mode === 'stay') { p.stayT -= dt; if (p.stayT < 0) { p.mode = 'walk'; p.watch = false; p.stopX = null; } }
  });
  Sc.crowd = Sc.crowd.filter(p => !p.dead);
}
function personFrameName(p) {
  if (p.barSt === 'order') return 'order:' + (Math.floor(p.t * 2.5) % 2);
  if (p.barSt === 'wait') return 'watch:0';
  if (p.barSt === 'drink') return 'drink:' + (Math.floor(p.t * .8) % 2);
  if (p.mode === 'walk') return 'walk:' + Math.floor(p.wph * 6);
  let a = p.acts[0] || 'watch';
  if (Sc.vis.cheer > 0 && MK.stage() >= 2) a = 'cheer';
  const two = { point: 1, laugh: 1, clap: 1, cheer: 1, film: 1 }[a]; return a + ':' + (two ? Math.floor(p.t * (a === 'clap' ? 5 : 2.2)) % 2 : 0);
}
function drawPerson(p) {
  const fn = personFrameName(p); p.curFn = fn; let f = frameOf(p, fn);
  if (!f) { f = frameOf(p, p.mode === 'walk' ? 'walk:0' : 'watch:0') || Object.values(p.fr)[0]; }
  if (!f) return; shadowAt(p); drawFrame(p, f);
  if (p.cup && p.mode === 'walk' && p.haW) { const h = p.haW.r; c.fillStyle = '#f4efe4'; c.fillRect(h.x - 3 * p.k, h.y - 10 * p.k, 6 * p.k, 10 * p.k); c.fillStyle = '#2bb673'; c.fillRect(h.x - 3 * p.k, h.y - 10 * p.k, 6 * p.k, 2 * p.k); }
  if (p.phoneWalk && p.mode === 'walk' && p.haW) { const h = p.haW.r; c.fillStyle = '#16161a'; c.fillRect(h.x - 3 * p.k, h.y - 9 * p.k, 6 * p.k, 10 * p.k); }
}

/* ---------- Besucher: kommen rein, bleiben eine Weile, gehen wieder (nur Hausmeister, Barkeeper und Kevin sind immer da) ---------- */
const VIS = {};
Sc.npcHere = id => { if (id === 'guenther') return MK.S.set.npc !== false && (!Sc.guHere || Sc.guHere()); if (id === 'bar' || id === 'partner') return MK.S.set.npc !== false; const v = VIS[id]; return !!v && v.st === 'on' && MK.S.set.npc !== false; };
function visit(id, p, dt, tx, offR, onR) { let v = VIS[id]; if (!v) v = VIS[id] = { st: 'off', t: rnd(offR[0] * .25, offR[0]) };
  if (MK.S.set.npc === false) { v.st = 'off'; return false; }
  v.t -= dt; const sp = 75 * p.k;
  if (v.st === 'off') { if (v.t > 0) return false; v.st = 'in'; v.side = tx < W / 2 ? -1 : 1; p.x = v.side < 0 ? -70 * p.k : W + 70 * p.k; }
  if (v.st === 'in') { const d = tx - p.x; p.dirW = Math.sign(d) || 1; p.x += Math.sign(d) * Math.min(Math.abs(d), sp * dt); p.wph = ((p.wph || 0) + dt * 1.4) % 1; if (Math.abs(d) < 2) { v.st = 'on'; v.t = rnd(onR[0], onR[1]); } return 'walk'; }
  if (v.st === 'on') { p.x = tx; if (v.t < 0) v.st = 'out'; return 'on'; }
  if (v.st === 'out') { const ex = v.side < 0 ? -80 * p.k : W + 80 * p.k, d = ex - p.x; p.x += Math.sign(d) * Math.min(Math.abs(d), sp * dt); p.wph = ((p.wph || 0) + dt * 1.4) % 1; if (Math.abs(d) < 2) { v.st = 'off'; v.t = rnd(offR[0], offR[1]); return false; } return 'walk'; }
  return false; }
/* ---------- NPCs ---------- */
Sc.npcPos = {};
const NPC = [
  { id: 'guenther', gym: 0, lane: 0, f: .62, look: { skin: 's1', tan: 'tan0', hairc: 'h6', hair: 'glatze', beard: 'schnauz', tattoo: 'none', top: 'tee-blau', bottom: 'b2', shoes: 'sh1', gloves: 'none', head: 'none', acc: 'none' }, lv: 3, belly: 7, post: .15, beh: 'mop' },
  { id: 'hilde', gym: 1, lane: 0, f: .6, fem: true, look: { skin: 's1', tan: 'tan0', hairc: 'h5', hair: 'dutt', beard: 'none', tattoo: 'none', top: 'tee-weiss', bottom: 'b2', shoes: 'sh2', gloves: 'none', head: 'none', acc: 'none' }, topCol: '#c45b9a', lv: 4, belly: 2, post: .1, beh: 'lateral', x: .33 },
  { id: 'jassi', gym: 2, lane: 1, f: .66, fem: true, look: { skin: 's3', tan: 'tan1', hairc: 'h2', hair: 'lang', beard: 'none', tattoo: 'none', top: 'tank-schwarz', bottom: 'b2', shoes: 'sh4', gloves: 'none', head: 'none', acc: 'none' }, bra: '#ff5fa2', lv: 18, post: .9, beh: 'film', x: .74 },
  { id: 'marco', gym: 2, lane: 1, f: .68, look: { skin: 's3', tan: 'tan2', hairc: 'h2', hair: 'undercut', beard: 'stoppel', tattoo: 'tribal', top: 'oben-ohne', bottom: 'b2', shoes: 'sh3', gloves: 'none', head: 'none', acc: 'kette' }, lv: 75, post: 1, beh: 'flex', x: .16 }
];
Sc.npcDef = id => NPC.find(n => n.id === id);
function npcPerson(n) {
  const G = Sc.geo(), ln = n.lane ? G.yF + 40 : G.yF + 16, k = G.pScale * n.f, L = MK.Fig.resolveLook(n.look);
  if (n.topCol) L.top = { val: n.topCol, cut: 'tee' }; if (n.bra) L.top = { val: n.bra, cut: 'bra' };
  return { npc: n.id, fem: !!n.fem, L, lv: Object.fromEntries(MK.MUSCLES.map(m => [m.id, n.lv])), post: n.post, belly: n.belly || 0, k, kAt: G.pScale, y: ln, x: (n.x || .1) * W, dir: 1, speed: 26 * k, wph: 0, fr: {}, q: {}, side: (n.x || .1) < .5 ? -1 : 1, t: 0, dbKg: 2 };
}
// Günther ist meistens da, macht aber ab und zu Pause (geht raus und kommt wieder)
const GU = { st: 'on', t: rnd(120, 240) };
function guStep(p, dt) { GU.t -= dt;
  if (GU.st === 'on' && GU.t < 0) { GU.st = 'leave'; p.dir = p.x < W / 2 ? -1 : 1; }
  if (GU.st === 'leave') { p.x += p.dir * 75 * p.k * dt; if (p.x < -60 * p.k || p.x > W + 60 * p.k) { GU.st = 'off'; GU.t = rnd(18, 40); } return 'walk'; }
  if (GU.st === 'off') { if (GU.t < 0) { GU.st = 'back'; p.dir = Math.random() < .5 ? 1 : -1; p.x = p.dir > 0 ? -50 * p.k : W + 50 * p.k; GU.tx = rnd(W * .2, W * .7); } return 'off'; }
  if (GU.st === 'back') { p.x += p.dir * 75 * p.k * dt; if ((p.dir > 0 && p.x >= GU.tx) || (p.dir < 0 && p.x <= GU.tx)) { GU.st = 'on'; GU.t = rnd(120, 260); } return 'walk'; }
  return 'on'; }
Sc.guHere = () => GU.st === 'on' || GU.st === 'back';
function drawNPCs(t, dt, G, lane) {
  const S = MK.S;
  NPC.forEach(n => {
    if (S.gym < n.gym || n.lane !== lane) return;
    if (!n.p) n.p = npcPerson(n); const p = n.p; p.t += dt;
    if (MK.S.set.npc === false) return;
    let fn = 'watch:0', vs = null;
    if (n.beh !== 'mop') { const tx = n.beh === 'lateral' && S.eq.laufband ? Sc.slotX('laufband') : (n.x || .1) * W; vs = visit(n.id, p, dt, tx, [140, 300], [40, 80]); if (!vs) return; if (vs === 'walk') fn = 'walk:' + Math.floor(p.wph * 6); }
    if (n.beh === 'mop') { const gs = guStep(p, dt); if (gs === 'off') { delete Sc.npcPos.guenther; Sc.guRect = null; return; } if (gs === 'walk') { p.wph = (p.wph + dt * 1.4) % 1; fn = 'walk:' + Math.floor(p.wph * 6); } }
    if (n.beh === 'mop' && GU.st === 'on') { p.x += p.dir * p.speed * dt; p.wph = (p.wph + dt * .5) % 1; if (p.x > (MK.S.eq.kuehl && Sc.barX0 ? Sc.barX0 - 40 * p.k : W * .94)) p.dir = -1; if (p.x < W * .06) p.dir = 1; fn = 'mop:' + Math.floor(p.wph * 6); }
    if (vs === 'walk') {} else if (n.beh === 'lateral') { if (S.eq.laufband) { p.x = Sc.slotX('laufband'); p.wph = (p.wph + dt * .9) % 1; fn = 'walk:' + Math.floor(p.wph * 6); } else { p.x = n.x * W; fn = 'lateral:' + (Math.floor(p.t * 1.1) % 2); } }
    if (vs === 'walk') {} else if (n.beh === 'film') { p.x = n.x * W; fn = 'film:' + (Math.floor(p.t * .8) % 2); }
    if (vs === 'walk') {} else if (n.beh === 'flex') { p.x = n.x * W; fn = 'flex:0'; }
    p.curFn = fn; const f = frameOf(p, fn) || Object.values(p.fr)[0]; if (!f) return;
    shadowAt(p); drawFrame(p, f);
    if (n.beh === 'mop' && p.topW) Sc.guRect = { x: p.x - 30 * p.k, y: p.topW.y - 8 * p.k, w: 60 * p.k, h: p.y - p.topW.y + 10 * p.k };
    if (n.beh === 'mop' && p.haW && GU.st === 'on') { const a = p.haW.l, b2 = p.haW.r, fx = p.x + 22 * p.k * p.dir; c.strokeStyle = '#8a6a44'; c.lineWidth = 3 * p.k; c.beginPath(); c.moveTo(b2.x, b2.y - 6 * p.k); c.lineTo(fx, p.y - 3 * p.k); c.stroke(); ell(fx, p.y - 3 * p.k, 13 * p.k, 4 * p.k, '#d8d2c2'); ell(fx - 16 * p.k * p.dir, p.y + 2, 22 * p.k, 4 * p.k, 'rgba(120,170,200,.3)'); }
    if (n.beh === 'film' && vs === 'on') { c.strokeStyle = '#444'; c.lineWidth = 2; c.beginPath(); c.moveTo(p.x + 40 * p.k, p.y); c.lineTo(p.x + 40 * p.k, p.y - 230 * p.k); c.stroke(); c.strokeStyle = 'rgba(255,255,240,.95)'; c.lineWidth = 5 * p.k; c.beginPath(); c.arc(p.x + 40 * p.k, p.y - 248 * p.k, 18 * p.k, 0, TAU); c.stroke(); }
    if (p.topW) Sc.npcPos[n.id] = { x: p.topW.x, y: p.topW.y };
  });
}
/* ---------- Trainingspartner Kevin (aus dem Klimmzug-Duell) ---------- */
let partnerP = null, spotK = null;
Sc.heavy = ex => !!(ex && MK.exOpen(ex) && ex.kg === 'bb' && ex.anim !== 'benchLie' && MK.S.partner && MK.S.partner.lv);
const DUET = { arme: 'hammer', brust: 'fly', schulter: 'lateral', beine: 'squat', ruecken: 'frontraise', nacken: 'shrug', bauch: 'jack', ausdauer: 'jack' };
function drawPartner(t, dt, G) {
  const S = MK.S; if (!S.partner || !S.partner.lv) { Sc.partnerTop = null; return; }
  const lv = 6 + S.partner.lv * 11; // jede Stufe deutlich muskulöser
  if (!partnerP || partnerP.lvl !== lv || Math.abs(partnerP.kAt - G.pScale) > .01) { const k = G.pScale * .66;
    partnerP = { npc: 'partner', lvl: lv, fem: false, L: MK.Fig.resolveLook({ skin: 's2', tan: S.partner.lv >= 8 ? 'tan2' : 'tan0', hairc: 'h3', hair: 'locken', beard: S.partner.lv >= 5 ? 'stoppel' : 'none', tattoo: 'none', top: S.partner.lv >= 12 ? 'stringer' : S.partner.lv >= 4 ? 'tank-schwarz' : 'tee-blau', bottom: 'b3', shoes: 'sh2', gloves: 'none', head: 'band', acc: 'none' }), lv: Object.fromEntries(MK.MUSCLES.map(m => [m.id, lv])), post: Math.min(1, .5 + S.partner.lv * .05), belly: 0, k, kAt: G.pScale, y: G.yF + 38, x: W * .3, fr: {}, q: {}, side: -1, t: 0 }; }
  const p = partnerP; p.x = W * .3; p.t += dt;
  if (Sc._spotLast) { Sc.partnerTop = null; return; } // steht gerade als Spotter hinter der Bank
  // Schwere Langhantel-Übung gewählt: Kevin stellt sich sofort direkt neben dich und sichert
  const exH = MK.curEx();
  if (Sc.heavy(exH)) {
    if (!spotK || spotK.lvl !== lv || Math.abs(spotK.kAt - G.pScale) > .01) spotK = Object.assign({}, partnerP, { npc: 'spotK', k: G.pScale * .93, kAt: G.pScale, fr: {}, q: {}, side: -1 });
    const s2 = spotK; s2.x = G.px - 148 * G.pScale; s2.y = G.py - 4 * G.pScale; s2.t = (s2.t || 0) + dt;
    if (Sc._heavyId !== exH.id) { Sc._heavyId = exH.id; setTimeout(() => Sc.say('partner', pick(['Ich sichere dich!', 'Schwer? Ich pass auf.', 'Ich steh direkt neben dir.', 'Los, ich bin da!', 'Rücken gerade, ich hab dich.']), 2.6), 250); }
    const busy = Sc.vis.ph >= 0, fr = 'ready:' + (busy ? 1 : (Math.floor(s2.t * .5) % 3 === 2 ? 2 : 0)), f = frameOf(s2, fr) || frameOf(s2, 'ready:0'); if (!f) return;
    shadowAt(s2); drawFrame(s2, f); if (s2.topW) { Sc.partnerTop = { x: s2.topW.x, y: s2.topW.y }; if (MK.duetOn()) Sc.pill(s2.x, Math.min(H - 14, s2.y + 18 * G.pScale), 'Duett', '+25 %', '#5be38a', '🤝'); }
    return; }
  Sc._heavyId = null;
  // Duett: Kevin macht dieselbe Muskelgruppe mit (4 Bilder im Takt)
  if (MK.duetOn()) { const ex = MK.curEx(), pn = DUET[ex ? ex.g : 'arme'] || 'curl', ph = Math.floor(p.t * 3.2) % 4, f = frameOf(p, 'du_' + pn + ':' + ph) || frameOf(p, 'du_' + pn + ':0');
    if (f) { shadowAt(p); drawFrame(p, f); if (p.topW) { Sc.partnerTop = { x: p.topW.x, y: p.topW.y }; Sc.pill(p.x, Math.min(H - 14, p.y + 18 * G.pScale), 'Duett', '+25 %', '#5be38a', '🤝'); } return; } }
  // Posing-Zyklus: jede Pose 3 s, dabei anspannen/locker im Wechsel (2 Bilder)
  const cyc = Math.floor(p.t / 3) % 4, tense = Math.floor(p.t * 1.6) % 2 === 0, fr = 'pose:' + (tense ? cyc : 4);
  const f = frameOf(p, fr) || frameOf(p, 'pose:4') || Object.values(p.fr)[0]; if (!f) return;
  shadowAt(p); drawFrame(p, f); if (p.topW) Sc.partnerTop = { x: p.topW.x, y: p.topW.y };
}
/* ---------- Personal Trainer: sitzt vorne links auf einem Stuhl, schaut dir zu, macht Notizen ---------- */
let trP = null;
function drawTrainer(t, dt, G) { const S = MK.S, lv = MK.trainerRate(); if (!lv || MK.Comp.cur) return;
  const k = G.pScale * 1.05; if (!trP || Math.abs(trP.kAt - G.pScale) > .01) trP = { npc: 'trainer', fem: false, L: MK.Fig.resolveLook({ skin: 's3', tan: 'tan1', hairc: 'h6', hair: 'buzz', beard: 'voll', tattoo: 'none', top: 'kompr', bottom: 'b2', shoes: 'sh2', gloves: 'none', head: 'capback', acc: 'none' }), lv: Object.fromEntries(MK.MUSCLES.map(m => [m.id, 55])), post: .85, belly: 1, k, kAt: G.pScale, fr: {}, q: {}, side: -1, t: 0 };
  const p = trP; p.t += dt; p.x = Math.max(52 * k, Math.min(W * .16, G.px - 260 * G.pScale)); p.y = Math.min(H - 4, G.py + 12 * G.pScale); // groß, vorne links in der Ecke
  // Stuhl (Seitenansicht schräg): Sitzfläche auf Hüfthöhe, Lehne hinten
  const sy = p.y - 52 * k, cx = p.x; contactShadow(cx, p.y + 2, 48 * k, 8 * k, .45);
  const chrome = (x0, y0, w, h) => { const gg = c.createLinearGradient(x0, 0, x0 + w, 0); gg.addColorStop(0, '#6b7079'); gg.addColorStop(.4, '#e3e7ec'); gg.addColorStop(1, '#5a5e66'); c.fillStyle = gg; c.fillRect(x0, y0, w, h); };
  const g2 = c.createLinearGradient(0, sy - 96 * k, 0, sy - 20 * k); g2.addColorStop(0, '#d83a32'); g2.addColorStop(1, '#8a1f1a'); c.fillStyle = g2; c.beginPath(); c.roundRect(cx - 40 * k, sy - 98 * k, 80 * k, 70 * k, 10 * k); c.fill(); c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(cx - 34 * k, sy - 94 * k, 68 * k, 4 * k);
  chrome(cx - 44 * k, sy - 30 * k, 4 * k, 30 * k); chrome(cx + 40 * k, sy - 30 * k, 4 * k, 30 * k);
  [-1, 1].forEach(s => { chrome(cx + s * 38 * k - 2.5 * k, sy + 4 * k, 5 * k, p.y - sy - 4 * k); c.fillStyle = '#1a1a1e'; c.fillRect(cx + s * 38 * k - 5 * k, p.y - 3 * k, 10 * k, 3 * k); });
  const busy = Sc.vis.ph >= 0, ph = busy && Math.floor(p.t * 1.2) % 3 === 0 ? 2 : Math.floor(p.t / 2.5) % 4 === 1 ? 1 : 0;
  const g3 = c.createLinearGradient(0, sy - 4 * k, 0, sy + 6 * k); g3.addColorStop(0, '#565a65'); g3.addColorStop(1, '#25272d'); c.fillStyle = g3; c.beginPath(); c.roundRect(cx - 44 * k, sy - 3 * k, 88 * k, 10 * k, 4 * k); c.fill(); c.fillStyle = '#d83a32'; c.beginPath(); c.roundRect(cx - 42 * k, sy - 6 * k, 84 * k, 6 * k, 3 * k); c.fill();
  const f = frameOf(p, 'tsit:' + ph) || frameOf(p, 'tsit:0'); if (!f) return; drawFrame(p, f);
  if (p.topW) { Sc.trainerRect = { x: p.x - 60 * k, y: p.topW.y - 10 * k, w: 120 * k, h: p.y - p.topW.y + 12 * k }; } } // kein Text unter ihm – Stufe & Tempo stehen in seinem Menü
/* ---------- Gym-Ereignisse ---------- */
let promiP = null;
/* Neue Gym-Ereignisse: Fernsehteam, Fotoshooting, Legende, Fanclub, Happy Hour */
const EVP = {}, LOOK0 = { skin: 's2', tan: 'tan0', hairc: 'h1', hair: 'kurz', beard: 'none', tattoo: 'none', top: 'tee-grau', bottom: 'b1', shoes: 'sh1', gloves: 'none', head: 'none', acc: 'none' };
/* Ereignis-Leute nie in die Theke und nicht ins Gerät, an dem du gerade trainierst */
function freeX(xf, G) { let x = xf * W; const pad = 150 * G.pScale, barL = MK.S.eq.kuehl && Sc.barX0 ? Sc.barX0 - 45 * G.pScale : W - 30;
  if (x > barL) x = barL; if (Math.abs(x - G.px) < pad) x = x < G.px || G.px + pad > barL ? G.px - pad : G.px + pad; return Math.max(30, Math.min(barL, x)); }
function evPerson(key, look, lv, xf, G, o) { let p = EVP[key]; o = o || {};
  if (!p || Math.abs(p.kAt - G.pScale) > .01) { const k = G.pScale * (o.f || .68); p = EVP[key] = { npc: key, fem: !!o.fem, L: MK.Fig.resolveLook(Object.assign({}, LOOK0, look)), lv: Object.fromEntries(MK.MUSCLES.map(m => [m.id, lv])), post: o.post == null ? .7 : o.post, belly: o.belly || 0, k, kAt: G.pScale, y: G.yF + (o.dy == null ? 40 : o.dy), x: W * xf, fr: {}, q: {}, side: xf > .5 ? 1 : -1, t: 0 }; if (o.bra) p.L.top = { val: o.bra, cut: 'bra' }; }
  p.x = freeX(xf, G); return p; }
/* Ab und zu trainiert hinten jemand mit (vereinzelt, damit es nicht voll wirkt) */
function drawTrainee(t, dt, G) { const looks = [{ hair: 'buzz', hairc: 'h2', top: 'tank-schwarz', bottom: 'b2' }, { hair: 'pferde', hairc: 'h4', top: 'tee-rot', bottom: 'b2' }, { hair: 'locken', hairc: 'h3', top: 'tee-weiss', bottom: 'b1' }], li = MK.S.gym % looks.length;
  const p = evPerson('trainee' + li, looks[li], 18 + MK.S.gym * 8, .32, G, { fem: li === 1, dy: 18 }); const tx = p.x; if (p._x != null) p.x = p._x; p.dbKg = 6 + MK.S.gym * 2;
  const vs = visit('trainee', p, dt, tx, [80, 170], [30, 60]); p._x = p.x; if (!vs) return; p.t += dt;
  const f = frameOf(p, vs === 'walk' ? 'walk:' + Math.floor((p.wph || 0) * 6) : 'curl:' + (Math.floor(p.t * 3.2) % 6)) || Object.values(p.fr)[0]; if (!f) return; shadowAt(p); drawFrame(p, f); }
function evDraw(p, fn, dt) { p.t += dt; const f = frameOf(p, fn) || Object.values(p.fr)[0]; if (!f) return false; shadowAt(p); drawFrame(p, f); return true; }
/* ======================================================================
   GYM-EREIGNISSE: Kulissen & Effekte (hinten = vor der Figur gezeichnet, vorne = danach)
   ====================================================================== */
const EVS = { id: null, p: [], t: 0 };
function evState(id) { if (EVS.id !== id) { EVS.id = id; EVS.p = []; EVS.t = 0; EVS.n = 0; } return EVS; }
function evParts(dt, draw) { const P = EVS.p; for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; p.life -= dt * (p.dec || 1); if (p.life <= 0) { P.splice(i, 1); continue; } p.vx = (p.vx || 0) * Math.exp(-dt * (p.drag || 0)); p.vy = (p.vy || 0) * Math.exp(-dt * (p.drag || 0)) + (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.vr) p.rot = (p.rot || 0) + p.vr * dt; draw(p); } if (P.length > 400) P.splice(0, P.length - 400); }
const glowDot = (x, y, r, rgb, a) => { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); };
function inkBox(x, y, w, h, r, fill, lw) { rrPath(x, y, w, h, r); c.fillStyle = fill; c.fill(); c.lineWidth = lw || 2; c.strokeStyle = '#141414'; c.stroke(); }
// Messing-Pfosten mit Samtkordel (Promi)
function stanchion(x, y, k) { ell(x, y + 2 * k, 11 * k, 3.5 * k, 'rgba(0,0,0,.35)'); const g = c.createLinearGradient(x - 3 * k, 0, x + 3 * k, 0); g.addColorStop(0, '#8a6312'); g.addColorStop(.45, '#ffe28a'); g.addColorStop(1, '#a87a16'); c.fillStyle = g; c.fillRect(x - 2.6 * k, y - 46 * k, 5.2 * k, 46 * k); ell(x, y, 9 * k, 3 * k, '#c9971c'); circ(x, y - 48 * k, 4.6 * k, '#ffd86a'); circ(x - 1.4 * k, y - 49.5 * k, 1.6 * k, '#fff6cf'); }
function rope(x1, y1, x2, y2, sag, k) { c.strokeStyle = '#5e0d1c'; c.lineWidth = 5 * k; c.lineCap = 'round'; c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo((x1 + x2) / 2, Math.max(y1, y2) + sag, x2, y2); c.stroke(); c.strokeStyle = '#b3203a'; c.lineWidth = 3 * k; c.stroke(); c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 1 * k; c.beginPath(); c.moveTo(x1, y1 - 1 * k); c.quadraticCurveTo((x1 + x2) / 2, Math.max(y1, y2) + sag - 1.2 * k, x2, y2 - 1 * k); c.stroke(); }
// Gelbes Warnschild (Rohrbruch)
function wetSign(x, y, k, t) { const wob = Math.sin(t * 1.3) * .02; c.save(); c.translate(x, y); c.rotate(wob); ell(0, 2 * k, 22 * k, 4 * k, 'rgba(0,0,0,.3)');
  c.fillStyle = '#e8b81c'; c.strokeStyle = '#141414'; c.lineWidth = 2; c.beginPath(); c.moveTo(-18 * k, 0); c.lineTo(-7 * k, -62 * k); c.lineTo(7 * k, -62 * k); c.lineTo(18 * k, 0); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = '#ffd94a'; c.beginPath(); c.moveTo(-14 * k, -4 * k); c.lineTo(-6 * k, -58 * k); c.lineTo(6 * k, -58 * k); c.lineTo(14 * k, -4 * k); c.closePath(); c.fill();
  c.fillStyle = '#141414'; c.beginPath(); c.moveTo(0, -50 * k); c.lineTo(9 * k, -34 * k); c.lineTo(-9 * k, -34 * k); c.closePath(); c.fill(); c.fillStyle = '#ffd94a'; c.font = `900 ${10 * k}px Arial`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('!', 0, -39 * k);
  c.fillStyle = '#141414'; circ(-3 * k, -26 * k, 2.2 * k, '#141414'); c.lineWidth = 1.8 * k; c.beginPath(); c.moveTo(-3 * k, -24 * k); c.lineTo(2 * k, -17 * k); c.lineTo(-4 * k, -11 * k); c.moveTo(2 * k, -17 * k); c.lineTo(7 * k, -13 * k); c.moveTo(-1 * k, -21 * k); c.lineTo(-8 * k, -18 * k); c.stroke(); // ausrutschendes Männchen
  c.font = `900 ${5.6 * k}px Arial`; c.fillText('RUTSCHGEFAHR', 0, -6 * k); c.restore(); }
// Neon-Schrift: weißer Kern, farbiger Glanz, einzelner Buchstabe flackert
function neonText(txt, x, y, size, rgb, t, seed) { c.save(); c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `900 ${size}px "Arial Black", Arial`; c.lineJoin = 'round';
  const fl = Math.sin(t * 23 + seed) > .93 ? .35 : 1; c.globalCompositeOperation = 'lighter'; c.shadowColor = `rgba(${rgb},${.9 * fl})`; c.shadowBlur = size * .9; c.strokeStyle = `rgba(${rgb},${.85 * fl})`; c.lineWidth = size * .16; c.strokeText(txt, x, y); c.shadowBlur = size * .35; c.lineWidth = size * .06; c.strokeStyle = `rgba(255,245,250,${fl})`; c.strokeText(txt, x, y); c.restore(); }

const EVBACK = {
  strom(dt, t, G) { /* Notbeleuchtung im Hintergrund */ },
  promi(dt, t, G) { const k = G.pScale, y0 = G.py + 4, x1 = G.px; // roter Teppich bis zu dir, mit Goldkante und Kordeln
    c.save(); const g = c.createLinearGradient(0, G.yF + 20, 0, y0 + 30); g.addColorStop(0, '#7a0f1f'); g.addColorStop(1, '#c41e3a'); c.fillStyle = g;
    c.beginPath(); c.moveTo(-10, y0 + 26 * k); c.lineTo(x1 - 70 * k, y0 + 18 * k); c.lineTo(x1 - 60 * k, y0 - 10 * k); c.lineTo(-10, y0 - 22 * k); c.closePath(); c.fill();
    c.strokeStyle = '#e6b422'; c.lineWidth = 2.5 * k; c.beginPath(); c.moveTo(-10, y0 + 24 * k); c.lineTo(x1 - 70 * k, y0 + 16 * k); c.moveTo(-10, y0 - 20 * k); c.lineTo(x1 - 60 * k, y0 - 8 * k); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.08)'; c.lineWidth = 1; for (let i = 1; i < 6; i++) { const u = i / 6, yy = lerp(y0 - 20 * k, y0 + 24 * k, u); c.beginPath(); c.moveTo(-10, yy); c.lineTo(x1 - 66 * k, lerp(y0 - 8 * k, y0 + 16 * k, u)); c.stroke(); } c.restore();
    const sx = [W * .1, W * .26]; sx.forEach(x => stanchion(x, y0 - 24 * k, k * .9)); rope(sx[0], y0 - 24 * k - 44 * k * .9, sx[1], y0 - 24 * k - 44 * k * .9, 12 * k, k * .9); },
  rohr(dt, t, G) { const S2 = evState('rohr'), k = G.pScale; // Pfützen mit Spiegelung und Wellenringen, Eimer, Warnschild
    const pd = [[.22, 2, 70], [.55, 12, 90], [.8, 5, 60]];
    pd.forEach(([x, dy, r], i) => { const px = W * x, py = G.py - 2 + dy * k * .4, rx = r * k, ry = 8 * k + 2; const g = c.createRadialGradient(px, py, 2, px, py, rx); g.addColorStop(0, 'rgba(185,222,248,.62)'); g.addColorStop(.8, 'rgba(120,170,210,.42)'); g.addColorStop(1, 'rgba(120,170,210,0)'); c.save(); c.translate(px, py); c.scale(1, ry / rx); c.translate(-px, -py); c.fillStyle = g; c.beginPath(); c.arc(px, py, rx, 0, TAU); c.fill(); c.restore();
      ell(px - rx * .3, py - ry * .25, rx * .35, ry * .18, 'rgba(255,255,255,.28)'); });
    S2.rip = S2.rip || []; if (Math.random() < dt * 5) { const [x, dy, r] = pick(pd); S2.rip.push({ x: W * x + rnd(-.5, .5) * r * k, y: G.py - 2 + dy * k * .4 + rnd(-3, 3), a: 0 }); }
    S2.rip = S2.rip.filter(o => (o.a += dt * .9) < 1); S2.rip.forEach(o => { c.strokeStyle = `rgba(220,240,255,${(1 - o.a) * .7})`; c.lineWidth = 1.2; c.beginPath(); c.ellipse(o.x, o.y, 4 + o.a * 26 * k, (4 + o.a * 26 * k) * .22, 0, 0, TAU); c.stroke(); });
    const bx = W * .66, by = G.py - 4; ell(bx, by + 2, 18 * k, 4 * k, 'rgba(0,0,0,.35)'); // Eimer unter dem Leck
    const bg = c.createLinearGradient(bx - 14 * k, 0, bx + 14 * k, 0); bg.addColorStop(0, '#2b6fb5'); bg.addColorStop(.4, '#5aa2e6'); bg.addColorStop(1, '#1f4f86'); c.fillStyle = bg; c.strokeStyle = '#141414'; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(bx - 15 * k, by - 30 * k); c.lineTo(bx + 15 * k, by - 30 * k); c.lineTo(bx + 12 * k, by); c.lineTo(bx - 12 * k, by); c.closePath(); c.fill(); c.stroke(); ell(bx, by - 30 * k, 15 * k, 4 * k, '#1d3f66'); ell(bx, by - 29 * k, 12 * k, 2.8 * k, 'rgba(150,200,240,.85)');
    c.strokeStyle = '#141414'; c.lineWidth = 1.4; c.beginPath(); c.arc(bx, by - 30 * k, 15 * k, Math.PI * 1.05, Math.PI * 1.95, false); c.stroke();
    wetSign(W * .4, G.py + 6, k * .95, t); },
  kreide(dt, t, G) { const k = G.pScale; // Kreideschale auf Ständer + weiße Handabdrücke
    const x = G.px - 120 * k, y = G.py; ell(x, y + 2, 16 * k, 4 * k, 'rgba(0,0,0,.35)'); c.fillStyle = '#3a3c42'; c.fillRect(x - 2.5 * k, y - 70 * k, 5 * k, 70 * k); ell(x, y, 13 * k, 3.5 * k, '#2a2b30');
    c.fillStyle = '#6b6f78'; c.strokeStyle = '#141414'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x - 22 * k, y - 76 * k); c.quadraticCurveTo(x, y - 58 * k, x + 22 * k, y - 76 * k); c.closePath(); c.fill(); c.stroke();
    ell(x, y - 77 * k, 20 * k, 5 * k, '#f4f2ec'); [[-8, -80], [4, -82], [10, -79], [-2, -84]].forEach(([dx, dy]) => circ(x + dx * k, y + dy * k, 4.5 * k, '#ffffff'));
    if (Math.random() < dt * 2) Sc.particle('chalk', x + rnd(-10, 10) * k, y - 86 * k, 1);
    c.save(); c.globalAlpha = .55; [[.3, 6, .3], [.42, 14, -.5], [.72, 4, .2], [.6, 16, .9]].forEach(([fx, dy, r]) => { const hx = W * fx, hy = G.py + dy * k * .5; c.save(); c.translate(hx, hy); c.rotate(r); c.scale(1, .35); c.fillStyle = '#f7f5ef'; ell(0, 0, 7 * k, 9 * k, '#f7f5ef'); for (let i = 0; i < 5; i++) { const a = -1.2 + i * .45; ell(Math.sin(a) * 9 * k, -Math.cos(a) * 11 * k, 2 * k, 4 * k, '#f7f5ef', a); } c.restore(); }); c.restore(); },
  tv(dt, t, G) { const k = G.pScale, x = Math.min(W - 40 * k, G.px + 230 * k), y = G.py + 2; // Studiolicht auf Stativ mit Lichtkegel zu dir
    c.save(); c.globalCompositeOperation = 'lighter'; const lx = x - 6 * k, ly = y - 168 * k, g = c.createLinearGradient(lx, ly, G.px, G.py - 140 * k); g.addColorStop(0, 'rgba(255,240,205,.35)'); g.addColorStop(1, 'rgba(255,240,205,0)'); c.fillStyle = g;
    c.beginPath(); c.moveTo(lx, ly - 14 * k); c.lineTo(G.px - 70 * k, G.py - 290 * k); c.lineTo(G.px - 60 * k, G.py + 10); c.lineTo(lx, ly + 14 * k); c.closePath(); c.fill(); c.restore();
    c.strokeStyle = '#1b1b1f'; c.lineWidth = 2.4 * k; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 160 * k); c.moveTo(x - 20 * k, y); c.lineTo(x, y - 40 * k); c.lineTo(x + 20 * k, y); c.stroke();
    c.save(); c.translate(x, y - 168 * k); c.rotate(-.32); inkBox(-16 * k, -14 * k, 30 * k, 28 * k, 4 * k, '#26272c', 1.8); c.fillStyle = '#fff3d0'; c.fillRect(-18 * k, -10 * k, 4 * k, 20 * k); glowDot(-20 * k, 0, 26 * k, '255,240,200', .55);
    c.fillStyle = '#141414'; [[-1, -1], [-1, 1]].forEach(([, s]) => { c.beginPath(); c.moveTo(-16 * k, s * 14 * k); c.lineTo(-30 * k, s * 20 * k); c.lineTo(-30 * k, s * 16 * k); c.lineTo(-16 * k, s * 10 * k); c.closePath(); c.fill(); }); c.restore();
    c.strokeStyle = '#141414'; c.lineWidth = 2 * k; c.beginPath(); c.moveTo(x, y - 6 * k); c.bezierCurveTo(x - 40 * k, y + 14 * k, W * .3, y + 4 * k, W * .14, y + 12 * k); c.stroke(); }, // Kabel zur Kamera
  shoot(dt, t, G) { const k = G.pScale, x0 = G.px - 100 * k, x1 = G.px + 100 * k, top = G.py - 330 * k; // Fotohintergrund (Papierrolle) + Klebe-Markierung
    c.save(); const g = c.createLinearGradient(0, top, 0, G.py); g.addColorStop(0, '#aeb8c6'); g.addColorStop(.7, '#d5dbe3'); g.addColorStop(1, '#b7bfca'); c.fillStyle = g; c.beginPath(); c.moveTo(x0, top); c.lineTo(x1, top); c.lineTo(x1, G.py - 30 * k); c.quadraticCurveTo(x1, G.py + 6, x1 + 26 * k, G.py + 14 * k); c.lineTo(x0 - 26 * k, G.py + 14 * k); c.quadraticCurveTo(x0, G.py + 6, x0, G.py - 30 * k); c.closePath(); c.fill();
    { const rg = c.createRadialGradient(G.px, G.py - 170 * k, 20 * k, G.px, G.py - 170 * k, 210 * k); rg.addColorStop(0, 'rgba(255,255,255,0)'); rg.addColorStop(1, 'rgba(60,70,90,.32)'); c.fillStyle = rg; c.fill(); } // Studio-Verlauf
    c.fillStyle = 'rgba(0,0,0,.06)'; c.fillRect(x0, top, 10 * k, G.py - top - 30 * k); c.fillRect(x1 - 10 * k, top, 10 * k, G.py - top - 30 * k);
    c.fillStyle = '#2a2b30'; c.fillRect(x0 - 16 * k, top - 8 * k, x1 - x0 + 32 * k, 7 * k); ell(x0 - 16 * k, top - 4.5 * k, 4 * k, 5 * k, '#141414'); ell(x1 + 16 * k, top - 4.5 * k, 4 * k, 5 * k, '#141414'); c.restore();
    c.strokeStyle = '#ee4035'; c.lineWidth = 3 * k; c.beginPath(); c.moveTo(G.px - 10 * k, G.py + 8 * k); c.lineTo(G.px + 10 * k, G.py + 14 * k); c.moveTo(G.px + 10 * k, G.py + 8 * k); c.lineTo(G.px - 10 * k, G.py + 14 * k); c.stroke(); },
  legende(dt, t, G) { const p = EVP.legende; if (!p) return; const k = G.pScale; // goldener Spot + Pokal auf Säule
    c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createLinearGradient(0, 0, 0, p.y); g.addColorStop(0, 'rgba(255,214,90,.0)'); g.addColorStop(.3, 'rgba(255,214,90,.18)'); g.addColorStop(1, 'rgba(255,214,90,.32)'); c.fillStyle = g;
    c.beginPath(); c.moveTo(p.x - 12 * k, 0); c.lineTo(p.x + 12 * k, 0); c.lineTo(p.x + 80 * k, p.y + 6); c.lineTo(p.x - 80 * k, p.y + 6); c.closePath(); c.fill(); c.restore();
    ell(p.x, p.y + 4, 84 * k, 14 * k, 'rgba(255,214,90,.25)');
    const tx = p.x + 78 * k, ty = p.y; ell(tx, ty + 2, 16 * k, 4 * k, 'rgba(0,0,0,.35)'); inkBox(tx - 11 * k, ty - 50 * k, 22 * k, 50 * k, 2 * k, '#f2efe6', 1.6); c.fillStyle = '#d9d4c6'; c.fillRect(tx - 11 * k, ty - 50 * k, 4 * k, 50 * k);
    const cy = ty - 50 * k; c.fillStyle = '#c9971c'; c.strokeStyle = '#141414'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(tx - 10 * k, cy - 30 * k); c.quadraticCurveTo(tx - 10 * k, cy - 12 * k, tx, cy - 10 * k); c.quadraticCurveTo(tx + 10 * k, cy - 12 * k, tx + 10 * k, cy - 30 * k); c.closePath(); c.fill(); c.stroke();
    c.fillRect(tx - 2 * k, cy - 10 * k, 4 * k, 6 * k); inkBox(tx - 7 * k, cy - 5 * k, 14 * k, 5 * k, 1, '#a87a16', 1.2); c.strokeStyle = '#c9971c'; c.lineWidth = 2.2 * k; c.beginPath(); c.arc(tx - 11 * k, cy - 24 * k, 5 * k, Math.PI * .5, Math.PI * 1.5); c.arc(tx + 11 * k, cy - 24 * k, 5 * k, Math.PI * 1.5, Math.PI * .5); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(tx - 6 * k, cy - 27 * k, 2 * k, 12 * k); if (Math.sin(t * 2.3) > .7) star4(tx + 5 * k, cy - 26 * k, 2.6 * k, 'rgba(255,250,220,.95)'); },
  fans(dt, t, G) { const a = EVP.fan0, b = EVP.fan2; if (!a || !b) return; const k = G.pScale; // Luftballons am Geländer
    const bx = Math.max(a.x, b.x) + 40 * k, by = G.py - 10 * k; [['#ee4035', -10, 0], ['#ffffff', 6, .6], ['#ee4035', 18, 1.3], ['#ffd23f', 2, 2.1]].forEach(([col, dx, ph]) => { const sw = Math.sin(t * 1.4 + ph) * 6 * k, x = bx + dx * k + sw, y = by - (150 + Math.abs(dx) * 1.5) * k + Math.sin(t * 2 + ph) * 3 * k;
      c.strokeStyle = 'rgba(30,30,30,.7)'; c.lineWidth = 1; c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx + sw * .5, (by + y) / 2, x, y + 18 * k); c.stroke();
      c.fillStyle = col; c.strokeStyle = '#141414'; c.lineWidth = 1.6; c.beginPath(); c.ellipse(x, y, 13 * k, 16 * k, 0, 0, TAU); c.fill(); c.stroke(); c.beginPath(); c.moveTo(x - 3 * k, y + 18 * k); c.lineTo(x, y + 15 * k); c.lineTo(x + 3 * k, y + 18 * k); c.closePath(); c.fill(); c.stroke();
      ell(x - 4.5 * k, y - 6 * k, 3 * k, 5 * k, 'rgba(255,255,255,.55)', -.4); if (col !== '#ffffff') { c.fillStyle = 'rgba(255,255,255,.85)'; c.font = `900 ${9 * k}px Arial`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('♥', x + 2 * k, y + 3 * k); } }); },
  happy(dt, t, G) { const k = G.pScale; // Lichterkette + Discokugel mit wandernden Lichtpunkten
    const n = 14; c.strokeStyle = '#1b1b1f'; c.lineWidth = 1.5; c.beginPath(); for (let i = 0; i <= n; i++) { const x = W * i / n, y = 18 + Math.sin(i / n * Math.PI * 3) * 6 + 10; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
    for (let i = 0; i <= n; i++) { const x = W * i / n, y = 18 + Math.sin(i / n * Math.PI * 3) * 6 + 14, on = Math.sin(t * 3 + i * 1.7) > -.3, col = ['255,90,170', '255,214,90', '90,220,255', '140,255,140'][i % 4]; c.fillStyle = on ? `rgb(${col})` : `rgba(${col},.35)`; c.beginPath(); c.ellipse(x, y, 3.2, 4.4, 0, 0, TAU); c.fill(); if (on) { c.save(); c.globalCompositeOperation = 'lighter'; glowDot(x, y, 14, col, .5); c.restore(); } }
    const dx = W * .5, dy = 70 * k + 20; c.strokeStyle = '#2a2a2e'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(dx, 0); c.lineTo(dx, dy - 18 * k); c.stroke();
    c.save(); c.beginPath(); c.arc(dx, dy, 18 * k, 0, TAU); c.clip(); c.fillStyle = '#8f96a3'; c.fillRect(dx - 20 * k, dy - 20 * k, 40 * k, 40 * k);
    for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) { const u = (i + (t * 1.2 % 1)) * 4.4 * k, v = j * 4.4 * k, sh = .5 + .5 * Math.sin(i * 1.3 + j * 2.1 + t * 4); c.fillStyle = `rgb(${150 + sh * 105},${155 + sh * 100},${170 + sh * 85})`; c.fillRect(dx + u - 2 * k, dy + v - 2 * k, 3.6 * k, 3.6 * k); }
    c.restore(); c.strokeStyle = '#141414'; c.lineWidth = 1.5; c.beginPath(); c.arc(dx, dy, 18 * k, 0, TAU); c.stroke();
    c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 12; i++) { const a = t * .6 + i * TAU / 12, rr = W * .32 + Math.sin(i * 3.1) * W * .1, x = dx + Math.cos(a) * rr, y = dy + 60 * k + Math.abs(Math.sin(a * 1.3 + i)) * (G.yF - dy), col = ['255,90,170', '90,220,255', '255,214,90'][i % 3]; glowDot(x, y, 9, col, .55); } c.restore(); }
};
const EVFRONT = {
  strom(dt, t, G) { const S2 = evState('strom'), k = G.pScale;
    // Taschenlampe (Günther) – Lichtkegel schwenkt langsam über die Szene, mit Staub darin
    const gr = Sc.guRect, hx = gr ? gr.x + gr.w * .75 : W * .08, hy = gr ? gr.y + gr.h * .42 : G.yF - 40, aim = Math.atan2(G.py - 180 * k - hy, G.px - hx) + Math.sin(t * .7) * .28;
    c.save(); c.globalCompositeOperation = 'lighter'; const L = Math.max(W, H) * .9, sp = .2; const g = c.createRadialGradient(hx, hy, 4, hx, hy, L); g.addColorStop(0, 'rgba(255,248,215,.55)'); g.addColorStop(.5, 'rgba(255,240,200,.16)'); g.addColorStop(1, 'rgba(255,240,200,0)'); c.fillStyle = g;
    c.beginPath(); c.moveTo(hx, hy); c.arc(hx, hy, L, aim - sp, aim + sp); c.closePath(); c.fill();
    for (let i = 0; i < 18; i++) { const u = ((t * .05 + i * .137) % 1), d = 40 + u * L * .55, a = aim + Math.sin(i * 7.3) * sp * .8, x = hx + Math.cos(a) * d, y = hy + Math.sin(a) * d + Math.sin(t + i) * 4; circ(x, y, 1.1, `rgba(255,250,230,${.5 * (1 - u)})`); }
    c.restore(); circ(hx, hy, 4, '#fff8d8');
    // Rundumleuchte (Notlicht) oben links
    const bx = 46, by = 22, a = t * 4.2; inkBox(bx - 9, by - 2, 18, 8, 2, '#2a2b30', 1.4); c.fillStyle = 'rgba(255,120,30,.9)'; c.beginPath(); c.arc(bx, by - 2, 8, Math.PI, 0); c.fill(); c.strokeStyle = '#141414'; c.lineWidth = 1.4; c.stroke();
    c.save(); c.globalCompositeOperation = 'lighter'; const g2 = c.createRadialGradient(bx, by, 2, bx, by, W * .55); g2.addColorStop(0, 'rgba(255,110,30,.45)'); g2.addColorStop(1, 'rgba(255,110,30,0)'); c.fillStyle = g2; c.beginPath(); c.moveTo(bx, by); c.arc(bx, by, W * .55, a, a + .5); c.closePath(); c.fill();
    c.fillStyle = `rgba(255,90,20,${.06 + Math.max(0, Math.cos(a)) * .07})`; c.fillRect(0, 0, W, H); c.restore();
    // Funken aus der kaputten Deckenlampe
    if (Math.random() < dt * .9) { const sx = W * .5 + rnd(-20, 20); for (let i = 0; i < 9; i++) S2.p.push({ x: sx, y: 44, vx: rnd(-80, 80), vy: rnd(-40, 40), g: 420, life: 1, dec: rnd(1.1, 1.8), drag: .6 }); }
    evParts(dt, p => { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(255,${200 + p.life * 50},120,${p.life})`; c.lineWidth = 1.6; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * .03, p.y - p.vy * .03); c.stroke(); c.restore(); });
    // kurzes Aufflackern: das Licht will zurück
    S2.t -= dt; if (S2.t < 0) { S2.t = rnd(5, 9); S2.fl = .35; } if (S2.fl > 0) { S2.fl -= dt; if (Math.sin(S2.fl * 60) > .2) { c.fillStyle = 'rgba(255,245,220,.16)'; c.fillRect(0, 0, W, H); } }
    // Notausgang-Schild mit Männchen
    const ex = Math.round(W * .5 - 150), ey = 10; c.save(); c.globalCompositeOperation = 'lighter'; glowDot(ex + 43, ey + 11, 60, '40,230,120', .35); c.restore(); inkBox(ex, ey, 86, 22, 3, '#17c46a', 1.6);
    c.fillStyle = '#eafff2'; c.fillRect(ex + 4, ey + 4, 16, 14); c.strokeStyle = '#17c46a'; c.lineWidth = 2; c.beginPath(); circ(ex + 12, ey + 6.5, 1.8, '#17c46a'); c.moveTo(ex + 12, ey + 8.5); c.lineTo(ex + 10, ey + 13); c.lineTo(ex + 7, ey + 17); c.moveTo(ex + 10, ey + 13); c.lineTo(ex + 14, ey + 17); c.moveTo(ex + 11.5, ey + 10); c.lineTo(ex + 16, ey + 9); c.stroke();
    c.fillStyle = '#04120a'; c.font = '900 10px Arial'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText('NOTAUSGANG', ex + 23, ey + 11.5); },
  promi(dt, t, G) { const S2 = evState('promi'), k = G.pScale; // Handys der Fans recken sich vom unteren Rand, Blitzlichter mit Stern
    for (let i = 0; i < 3; i++) { const x = W * [.05, .9, .97][i] + Math.sin(t * .8 + i) * 8, y = H - 8 + Math.sin(t * 1.7 + i * 2) * 5 - 26 * k, s = k * 1.1; c.save(); c.translate(x, y); c.rotate(Math.sin(t + i) * .12);
      c.fillStyle = '#d6a77a'; c.strokeStyle = '#141414'; c.lineWidth = 1.4; c.beginPath(); c.roundRect(-9 * s, 6 * s, 18 * s, 40 * s, 6 * s); c.fill(); c.stroke();
      inkBox(-11 * s, -22 * s, 22 * s, 36 * s, 3 * s, '#1b1c20', 1.4); const flash = Math.sin(t * 2.3 + i * 2.7) > .96; c.fillStyle = flash ? '#ffffff' : '#3d6fd6'; c.fillRect(-9 * s, -19 * s, 18 * s, 29 * s); if (!flash) { c.fillStyle = '#ffd23f'; c.fillRect(-9 * s, -2 * s, 18 * s, 3 * s); circ(6 * s, -16 * s, 1.6 * s, '#ff3b3b'); } c.restore();
      if (flash) { c.save(); c.globalCompositeOperation = 'lighter'; glowDot(x, y - 6 * k, 70, '255,255,255', .8); star4(x, y - 6 * k, 6, 'rgba(255,255,255,.95)'); c.restore(); } }
    const p = promiP; if (p && p.topW && Math.random() < dt * 4) S2.p.push({ x: p.x + rnd(-40, 40) * k, y: p.topW.y + rnd(0, 120) * k, vy: -20, life: 1, dec: 1.4 });
    evParts(dt, q => { c.save(); c.globalCompositeOperation = 'lighter'; star4(q.x, q.y, 3 * q.life + 1, `rgba(255,236,150,${q.life})`); c.restore(); }); },
  rohr(dt, t, G) { const S2 = evState('rohr'), k = G.pScale; // geplatztes Rohr an der Decke mit Wasserstrahl, Tropfen in den Eimer, Spritzer
    const py = 62, px0 = W * .5, px1 = W; const g = c.createLinearGradient(0, py - 9, 0, py + 9); g.addColorStop(0, '#9aa0a8'); g.addColorStop(.4, '#e3e7ec'); g.addColorStop(1, '#5a5e66'); c.fillStyle = g; c.fillRect(px0, py - 8, px1 - px0, 16); c.strokeStyle = '#141414'; c.lineWidth = 1.5; c.strokeRect(px0, py - 8, px1 - px0, 16);
    [px0 + 20, W * .78, W * .95].forEach(x => { inkBox(x - 6, py - 11, 12, 22, 2, '#7d838c', 1.4); });
    const cx = W * .66; c.fillStyle = '#141414'; c.beginPath(); c.moveTo(cx - 8, py + 8); c.lineTo(cx - 2, py + 2); c.lineTo(cx + 3, py + 9); c.lineTo(cx + 9, py + 4); c.lineTo(cx + 7, py + 9); c.closePath(); c.fill(); // Riss
    for (let i = 0; i < 4; i++) S2.p.push({ k: 'j', x: cx + rnd(-3, 3), y: py + 8, vx: rnd(-150, -60), vy: rnd(-30, 40), g: 520, life: 1, dec: rnd(1, 1.4) });
    if (Math.random() < dt * 3) S2.p.push({ k: 'd', x: cx + rnd(-2, 2), y: py + 10, vx: 0, vy: 30, g: 700, life: 2, dec: 1 });
    evParts(dt, q => { if (q.k === 'd' && q.y > G.py - 34 * k) { q.life = 0; for (let i = 0; i < 5; i++) EVS.p.push({ k: 's', x: q.x, y: q.y, vx: rnd(-70, 70), vy: rnd(-140, -60), g: 600, life: .5, dec: 2 }); return; }
      if (q.k === 'j' && q.y > G.py) { q.life = 0; return; }
      c.fillStyle = q.k === 's' ? `rgba(200,230,255,${q.life * 1.6})` : 'rgba(170,215,250,.85)'; c.beginPath(); c.ellipse(q.x, q.y, q.k === 'j' ? 2.2 : 1.8, q.k === 'j' ? 2.2 : 3, Math.atan2(q.vy, q.vx), 0, TAU); c.fill(); });
    c.save(); c.globalCompositeOperation = 'lighter'; glowDot(cx - 20, py + 30, 46, '170,215,250', .22); c.restore(); }, // Sprühnebel
  kreide(dt, t, G) { const S2 = evState('kreide'), k = G.pScale; // Kreidenebel zieht durch, Wölkchen von den Händen, Glitzern
    c.save(); for (let i = 0; i < 3; i++) { const y = G.py - (60 + i * 90) * k, x = ((t * (12 + i * 5) + i * 300) % (W + 400)) - 200, g = c.createRadialGradient(x, y, 10, x, y, 220 * k); g.addColorStop(0, 'rgba(255,255,255,.13)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.save(); c.translate(x, y); c.scale(2.2, .5); c.translate(-x, -y); c.beginPath(); c.arc(x, y, 220 * k, 0, TAU); c.fill(); c.restore(); } c.restore();
    S2.t -= dt; const R = Sc.lastPlayer; if (S2.t < 0 && R && R.ha && performance.now() - Sc.vis.last < 1500) { S2.t = rnd(1.4, 2.6); [R.ha.l, R.ha.r].forEach(h => { for (let i = 0; i < 7; i++) S2.p.push({ x: h.x, y: h.y, vx: rnd(-40, 40), vy: rnd(-40, 10), life: 1, dec: .7, r: rnd(5, 12) * k, drag: 2 }); }); }
    evParts(dt, q => { q.r += dt * 18 * k; c.fillStyle = `rgba(255,255,255,${q.life * .35})`; c.beginPath(); c.arc(q.x, q.y, q.r, 0, TAU); c.fill(); });
    c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 10; i++) { const x = (i * 97.3 + t * 9) % W, y = G.yF - 40 + ((i * 53.7 + t * 6) % (G.py - G.yF + 40)), a = Math.max(0, Math.sin(t * 3 + i * 2)); if (a > .6) star4(x, y, 1.6, `rgba(255,255,255,${(a - .6) * 2})`); } c.restore(); },
  tv(dt, t, G) { const x = Math.round(W * .5 - 150), y = 10, on = Math.sin(t * 3) > -.6; // ON-AIR-Schild
    c.save(); if (on) { c.globalCompositeOperation = 'lighter'; glowDot(x + 40, y + 12, 70, '255,50,50', .35); c.globalCompositeOperation = 'source-over'; }
    inkBox(x, y, 80, 24, 4, on ? '#d81f1f' : '#5a1212', 1.8); c.fillStyle = on ? '#fff' : '#d9a0a0'; c.font = '900 13px "Arial Black", Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('ON AIR', x + 40, y + 12.5); c.restore(); },
  shoot(dt, t, G) { const S2 = evState('shoot'); S2.t -= dt; // Blitz: Softbox flammt auf, kurzer Weißblitz, „Klick“-Stern an der Kamera
    if (S2.t < 0) { S2.t = rnd(1.6, 3.2); S2.fl = 1; MK.Audio.play('tap'); }
    if (S2.fl > 0) { S2.fl = Math.max(0, S2.fl - dt * 5); c.save(); c.globalCompositeOperation = 'lighter'; const k = G.pScale, sx = W * .1, sy = G.yF + 30 - 190 * k; glowDot(sx, sy, 160 * k, '255,255,255', .7 * S2.fl); c.fillStyle = `rgba(255,255,255,${.22 * S2.fl})`; c.fillRect(0, 0, W, H);
      const ph = EVP.photo; if (ph && ph.haW) { const h = ph.haW.r; star4(h.x, h.y - 8 * ph.k, 7 * S2.fl + 2, `rgba(255,255,255,${S2.fl})`); } c.restore(); } },
  legende(dt, t, G) { const S2 = evState('legende'), p = EVP.legende; if (!p) return; const k = G.pScale; if (Math.random() < dt * 6) S2.p.push({ x: p.x + rnd(-70, 70) * k, y: p.y - rnd(0, 230) * k, vy: -14, life: 1, dec: .9 });
    evParts(dt, q => { c.save(); c.globalCompositeOperation = 'lighter'; star4(q.x, q.y, 2.6 * q.life + .8, `rgba(255,226,120,${q.life})`); c.restore(); }); },
  fans(dt, t, G) { const S2 = evState('fans'), a = EVP.fan1, k = G.pScale; S2.t -= dt; // Konfetti-Kanone und Herzen
    if (S2.t < 0 && a && a.topW) { S2.t = rnd(3.5, 5.5); MK.Audio.play('pop'); for (let i = 0; i < 40; i++) S2.p.push({ k: 'c', x: a.x, y: a.topW.y - 10 * k, vx: rnd(-60, 260), vy: rnd(-420, -220), g: 380, drag: 1.2, life: 1, dec: .45, rot: rnd(0, 6), vr: rnd(-10, 10), col: pick(['#ee4035', '#ffffff', '#ffd23f', '#3a86ff']) }); }
    if (a && a.topW && Math.random() < dt * 2) S2.p.push({ k: 'h', x: a.x + rnd(-60, 60) * k, y: a.topW.y, vy: -36, vx: rnd(-10, 10), life: 1, dec: .5 });
    evParts(dt, q => { if (q.k === 'h') { c.fillStyle = `rgba(238,64,53,${q.life})`; c.font = `${14 * k + 4}px Arial`; c.textAlign = 'center'; c.fillText('♥', q.x + Math.sin(q.life * 9) * 6, q.y); return; } c.save(); c.translate(q.x, q.y); c.rotate(q.rot || 0); c.scale(1, Math.cos((q.rot || 0) * 2)); c.fillStyle = q.col; c.fillRect(-3.5, -2, 7, 4); c.restore(); }); },
  happy(dt, t, G) { const r = Sc.kuehlRect; if (!r) return; const k = G.pScale, x = r.x - 86 * k, y = r.y + 40 * k; // Neon-Schild an der Wand neben dem Kühlschrank + Cocktails
    c.save(); inkBox(x - 70 * k, y - 22 * k, 140 * k, 40 * k, 6 * k, '#16121c', 2); c.restore();
    neonText('HAPPY', x, y - 9 * k, Math.max(11, 15 * k), '255,79,184', t, 1); neonText('HOUR', x, y + 8 * k, Math.max(10, 13 * k), '90,220,255', t, 4);
    [-1, 1].forEach((s, i) => { const gx = r.x + r.w / 2 + s * (r.w / 2 + 16 * k), gy = r.y + r.h; c.save(); c.translate(gx, gy); ell(0, 1, 9 * k, 2.4 * k, 'rgba(0,0,0,.3)');
      c.fillStyle = 'rgba(255,255,255,.35)'; c.strokeStyle = '#141414'; c.lineWidth = 1.2; c.fillRect(-1, -14 * k, 2, 14 * k); c.beginPath(); c.moveTo(-10 * k, -30 * k); c.lineTo(10 * k, -30 * k); c.lineTo(0, -14 * k); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = i ? '#ff5aa0' : '#ffb627'; c.beginPath(); c.moveTo(-7 * k, -27 * k); c.lineTo(7 * k, -27 * k); c.lineTo(0, -16 * k); c.closePath(); c.fill(); circ(6 * k, -30 * k, 3.4 * k, '#7ad35a');
      c.strokeStyle = '#ee4035'; c.lineWidth = 1.6 * k; c.beginPath(); c.moveTo(-3 * k, -24 * k); c.lineTo(-8 * k, -38 * k); c.stroke(); c.restore(); }); }
};
const EVDRAW = {
  tv(dt, t, G) { const cam = evPerson('tvcam', { hair: 'buzz', hairc: 'h2', beard: 'voll', top: 'hoodie', bottom: 'b2', head: 'capback' }, 20, .2, G, { belly: 4 });
    if (evDraw(cam, 'film:0', dt) && cam.haW) { const h = cam.haW.l, k = cam.k; c.save(); c.translate(h.x, h.y - 6 * k); c.fillStyle = '#1b1c20'; c.beginPath(); c.roundRect(-30 * k, -16 * k, 46 * k, 26 * k, 4 * k); c.fill(); c.fillStyle = '#2c2e34'; c.fillRect(16 * k, -10 * k, 16 * k, 16 * k);
      c.fillStyle = '#0c0d10'; c.beginPath(); c.arc(34 * k, -2 * k, 9 * k, 0, TAU); c.fill(); c.fillStyle = 'rgba(120,160,255,.6)'; c.beginPath(); c.arc(34 * k, -2 * k, 5 * k, 0, TAU); c.fill(); c.fillStyle = Math.sin(t * 6) > 0 ? '#ff2a2a' : '#5a0d0d'; c.beginPath(); c.arc(-24 * k, -10 * k, 2.5 * k, 0, TAU); c.fill(); c.restore(); }
    const mic = evPerson('tvmic', { hair: 'zurueck', hairc: 'h3', top: 'tee-weiss', bottom: 'b2' }, 10, .78, G, { dy: 46 });
    if (evDraw(mic, 'watch:0', dt) && mic.haW) { const h = mic.haW.l, tx = G.px + 40 * G.pScale, ty = G.py - 300 * G.pScale; c.strokeStyle = '#3a3c42'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(h.x, h.y); c.lineTo(tx, ty); c.stroke(); c.fillStyle = '#6b6f78'; c.beginPath(); c.ellipse(tx, ty + 8, 7, 14, -.5, 0, TAU); c.fill(); }
    Sc.pill(cam.x, Math.min(H - 14, cam.y + 16 * G.pScale), 'LIVE', 'Fernsehteam', '#ff3b3b', '●'); },
  shoot(dt, t, G) { const k = G.pScale; const sx = W * .1, sy = G.yF + 30; c.strokeStyle = '#2a2a2e'; c.lineWidth = 2; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx, sy - 170 * k); c.moveTo(sx - 16 * k, sy); c.lineTo(sx, sy - 30 * k); c.lineTo(sx + 16 * k, sy); c.stroke();
    c.save(); c.translate(sx, sy - 190 * k); c.rotate(.35); const g = c.createLinearGradient(-26 * k, 0, 26 * k, 0); g.addColorStop(0, '#d8dde3'); g.addColorStop(.5, '#ffffff'); g.addColorStop(1, '#cfd5db'); c.fillStyle = '#1b1c20'; c.fillRect(-30 * k, -22 * k, 60 * k, 44 * k); c.fillStyle = g; c.fillRect(-26 * k, -18 * k, 52 * k, 36 * k); c.restore();
    const ph = evPerson('photo', { hair: 'dutt', hairc: 'h4', top: 'tank-schwarz', bottom: 'b2', acc: 'brille' }, 12, .24, G, { fem: true, bra: '#26262a' });
    if (evDraw(ph, 'film:' + (Math.floor(t * 1.5) % 2), dt) && ph.haW) { const h = ph.haW.r, kk = ph.k; c.fillStyle = '#16171b'; c.beginPath(); c.roundRect(h.x - 9 * kk, h.y - 14 * kk, 18 * kk, 12 * kk, 2 * kk); c.fill(); c.fillStyle = '#2d3036'; c.beginPath(); c.arc(h.x + 9 * kk, h.y - 8 * kk, 5 * kk, 0, TAU); c.fill(); } },
  legende(dt, t, G) { const p = evPerson('legende', { skin: 's2', tan: 'tan2', hairc: 'h6', hair: 'kranz', beard: 'voll', top: 'stringer', bottom: 'b1', shoes: 'sh3', acc: 'kette' }, 130, .2, G, { post: 1, f: .72 });
    const cyc = Math.floor(p.t / 3) % 4, tense = Math.floor(p.t * 1.6) % 2 === 0;
    if (evDraw(p, 'pose:' + (tense ? cyc : 4), dt)) Sc.pill(p.x, Math.min(H - 14, p.y + 16 * G.pScale), 'Horst „Eiche“ Brandt', 'Legende', '#e6b422', '🏆'); },
  fans(dt, t, G) { const xs = [.1, .17, .24], looks = [{ hair: 'lang', hairc: 'h3', top: 'tee-rot' }, { hair: 'locken', hairc: 'h2', top: 'tee-rot' }, { hair: 'pferde', hairc: 'h4', top: 'tee-rot' }];
    const ps = xs.map((x, i) => { const p = evPerson('fan' + i, looks[i], 8 + i * 6, x, G, { fem: i !== 1, dy: 48 + (i % 2) * 6 }); evDraw(p, (i === 1 ? 'clap:' : 'cheer:') + (Math.floor(t * (i === 1 ? 5 : 2.4)) % 2), dt); return p; });
    const a = ps[0].topW, b = ps[2].topW; if (a && b) { const y = Math.min(a.y, b.y) - 26 * G.pScale + Math.sin(t * 4) * 3, x0 = a.x - 10, x1 = b.x + 10; c.strokeStyle = '#6a4a2a'; c.lineWidth = 3; c.beginPath(); c.moveTo(x0 + 12, y + 26); c.lineTo(x0 + 12, y + 60); c.moveTo(x1 - 12, y + 26); c.lineTo(x1 - 12, y + 60); c.stroke();
      c.fillStyle = '#fffdf3'; c.strokeStyle = '#141414'; c.lineWidth = 2; c.beginPath(); c.roundRect(x0, y, x1 - x0, 28, 3); c.fill(); c.stroke(); c.fillStyle = '#d83a32'; c.font = `900 ${Math.max(11, 14 * G.pScale)}px "Arial Black", Arial`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('WIR ❤ DICH!', (x0 + x1) / 2, y + 15); c.textBaseline = 'alphabetic'; } },
  happy() {} // Neon-Schild jetzt in EVFRONT.happy
};
/* Laufendes Ereignis: kurze Info unten im Bild – was passiert, was es bringt, wie lange noch */
function eventBanner(G) { const id = MK.gev(); if (!id) return; const e = MK.GYM_EVENTS.find(x => x.id === id); if (!e) return; const left = Math.max(0, Math.ceil((MK.S.gev.until - Date.now()) / 1000));
  c.save(); const txt = e.info || e.desc, fT = '800 12.5px system-ui,Arial', fI = '600 12px system-ui,Arial'; c.font = fT; const w1 = c.measureText(e.name.replace('!', '')).width; c.font = fI; const w2 = c.measureText(txt).width;
  const w = Math.min(W - 16, 46 + w1 + 14 + w2 + 54), h = 30, x0 = Math.round((W - w) / 2), y0 = Math.round(H - h - 10);
  c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 8; rrPath(x0, y0, w, h, 8); c.fillStyle = 'rgba(14,16,26,.86)'; c.fill(); c.shadowColor = 'transparent';
  c.strokeStyle = '#ffd23f'; c.lineWidth = 1.5; rrPath(x0 + .5, y0 + .5, w - 1, h - 1, 7.5); c.stroke();
  const fr = left / e.dur; c.fillStyle = 'rgba(255,210,63,.85)'; c.fillRect(x0 + 8, y0 + h - 4, (w - 16) * fr, 2);
  c.textBaseline = 'middle'; c.textAlign = 'left'; let cx = x0 + 10; c.font = '15px system-ui'; c.fillText(e.icon || '⚡', cx, y0 + h / 2); cx += 24;
  c.font = fT; c.fillStyle = '#ffd23f'; c.fillText(e.name.replace('!', ''), cx, y0 + h / 2); cx += w1 + 12; c.font = fI; c.fillStyle = '#e9ecf4';
  c.save(); c.beginPath(); c.rect(cx, y0, x0 + w - 50 - cx, h); c.clip(); c.fillText(txt, cx, y0 + h / 2); c.restore();
  c.textAlign = 'right'; c.font = '800 12px system-ui'; c.fillStyle = '#fff'; c.fillText(left + ' s', x0 + w - 10, y0 + h / 2); c.restore(); }
function drawGymEvent(dt, t, G) {
  const e = MK.gev(); if (!e) return;
  if (e === 'promi') { if (!promiP || Math.abs(promiP.kAt - G.pScale) > .01) { const k = G.pScale * .7;
      promiP = { npc: 'promi', fem: false, L: MK.Fig.resolveLook({ skin: 's3', tan: 'tan3', hairc: 'h2', hair: 'seiten', beard: 'stoppel', tattoo: 'sleeve', top: 'stringer-gold', bottom: 'b6', shoes: 'sh3', gloves: 'none', head: 'none', acc: 'brille' }), lv: Object.fromEntries(MK.MUSCLES.map(m => [m.id, 160])), post: 1, belly: 0, k, kAt: G.pScale, y: G.yF + 46, x: W * .7, fr: {}, q: {}, side: 1, t: 0 }; }
    const p = promiP; p.x = freeX(.7, G); p.t += dt; const f = frameOf(p, 'film:' + (Math.floor(p.t * .8) % 2)) || Object.values(p.fr)[0];
    if (f) { shadowAt(p); drawFrame(p, f); if (p.topW) { Sc.pill(p.x, Math.min(H - 14, p.y + 16 * G.pScale), 'Brutus Breitkreuz', 'Promi', '#ffd23f', '★'); Sc.npcPos.promi = p.topW; } }
    if (Math.random() < dt * 3) { const fx = rnd(W * .05, W * .95), fy = rnd(G.yF - 40, G.yF + 40); const g = c.createRadialGradient(fx, fy, 1, fx, fy, 30); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(fx - 30, fy - 30, 60, 60); } }
  // Rohrbruch: Pfützen, Eimer & Schild hinten (EVBACK), Rohr & Wasser vorne (EVFRONT)
  if (EVDRAW[e]) EVDRAW[e](dt, t, G);
  if (e === 'kreide' && Math.random() < dt * 1.5) Sc.particle('chalk', rnd(W * .1, W * .9), rnd(G.yF - 60, G.py - 40), 3);
  if (e === 'strom') { const cx = G.px, cy = G.py - 140 * G.pScale, g = c.createRadialGradient(cx, cy, 70 * G.pScale, cx, cy, 260 * G.pScale); g.addColorStop(0, 'rgba(4,6,14,0)'); g.addColorStop(1, 'rgba(4,6,14,.86)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  }
  if (EVFRONT[e]) EVFRONT[e](dt, t, G);
}
/* ---------- Anzeigen am Spieler: Halten (Plank) und Takt (Seilspringen) ---------- */
/* Kleines Glas-Badge statt freischwebender Schrift: Icon · Titel · Wert */
Sc.pill = function (x, y, title, val, col, icon) {
  c.save(); c.textBaseline = 'middle'; c.textAlign = 'left';
  const fT = '700 11px system-ui,Arial', fV = '800 11px system-ui,Arial'; c.font = fT; const wT = c.measureText(title).width; c.font = fV; const wV = val ? c.measureText(val).width : 0;
  const iw = icon ? 16 : 0, w = 14 + iw + wT + (val ? 8 + wV : 0), h = 20; let x0 = Math.round(Math.max(4, Math.min(W - w - 4, x - w / 2))); const y0 = Math.round(y - h / 2);
  c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = 6; c.shadowOffsetY = 2; rrPath(x0, y0, w, h, 10); c.fillStyle = 'rgba(14,16,26,.82)'; c.fill(); c.shadowColor = 'transparent';
  c.lineWidth = 1; c.strokeStyle = col; c.globalAlpha = .7; rrPath(x0 + .5, y0 + .5, w - 1, h - 1, 9.5); c.stroke(); c.globalAlpha = 1;
  let cx = x0 + 7; if (icon) { c.font = '11px system-ui,Arial'; c.fillText(icon, cx, y0 + h / 2 + .5); cx += iw; }
  c.font = fT; c.fillStyle = '#e9ecf4'; c.fillText(title, cx, y0 + h / 2 + .5); cx += wT;
  if (val) { cx += 8; c.font = fV; c.fillStyle = col; c.fillText(val, cx, y0 + h / 2 + .5); }
  c.restore();
};
function hud(ex, t, G) {
  const V = Sc.vis;
  if (ex.hold) { const k = Math.min(1, (V.hold || 0) / 30), act = performance.now() - V.last < 1100, x = G.px - 70, y = G.py - 175 * G.pScale - 30;
    rrPath(x, y, 140, 10, 5); c.fillStyle = 'rgba(12,14,22,.72)'; c.fill(); if (k > .02) { rrPath(x + 2, y + 2, 136 * k, 6, 3); c.fillStyle = act ? '#2bb673' : '#ee4035'; c.fill(); }
    Sc.pill(G.px, y - 12, act ? 'Halten' : (V.last ? 'Spannung weg' : 'Tippen zum Halten'), act ? '×' + MK.fmt1(1 + k) : (V.last ? 'weitertippen!' : ''), act ? '#2bb673' : '#ff8a5c', act ? '⏱' : '👆'); }
  if (ex.anim === 'rope') { const ph = Sc.beatPh(performance.now()), x = G.px + 130 * G.pScale, y = G.py - 250 * G.pScale, r = 10 + 26 * (1 - ph), on = ph < .12 || ph > .9;
    c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, 10, 0, TAU); c.stroke(); c.strokeStyle = on ? '#2affb0' : 'rgba(255,210,63,.8)'; c.lineWidth = 3; c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();
    c.fillStyle = on ? '#2affb0' : '#fff'; c.font = '700 14px Arial'; c.textAlign = 'center'; c.fillText('♪', x, y + 5); if ((V.rhy || 0) > 1) { c.font = '700 11px Arial'; c.fillText('×' + V.rhy, x, y + 26); } }
  const st = MK.strainG && MK.strainG(); if (st === ex.g) { Sc.pill(G.px, G.py + 14, 'Zerrung', '½ XP', '#ff7a6b', '🩹'); }
}
/* ---------- Rivale Dome ---------- */
let rivalP = null;
function drawRival(t, dt, G) {
  const S = MK.S, lvl = Math.floor(1 + S.rival.tot / 8);
  if (!rivalP || rivalP.lvl !== lvl || rivalP.gym !== S.gym || Math.abs(rivalP.kAt - G.pScale) > .01) {
    const k = G.pScale * .68; rivalP = { npc: 'rival', lvl, gym: S.gym, fem: false, L: MK.Fig.resolveLook(MK.RIVAL.look), lv: Object.fromEntries(MK.MUSCLES.map(m => [m.id, lvl])), post: .8, belly: 0, k, kAt: G.pScale, y: G.yF + 44, x: W * .88, fr: {}, q: {}, side: 1, t: 0, dbKg: 6 + lvl * .25 > 10 ? Math.min(40, 6 + lvl * .25) : 8 };
  }
  const p = rivalP; p.t += dt; const vs = visit('rival', p, dt, W * (MK.S.eq.kuehl ? .6 : .86), [150, 320], [45, 80]); if (!vs) return; // der Rivale schaut nur ab und zu vorbei
  const f = frameOf(p, vs === 'walk' ? 'walk:' + Math.floor(p.wph * 6) : 'curl:' + (Math.floor(p.t * 4.5) % 6)) || Object.values(p.fr)[0]; if (!f) return;
  shadowAt(p); drawFrame(p, f); if (p.topW) Sc.npcPos.rival = { x: p.topW.x, y: p.topW.y };
}
/* ---------- Haustier: detailliert gezeichnet, schaut zum Spieler, atmet, wedelt, freut sich mit; Stufe 2 = Bandana, Stufe 3 = Goldhalsband ---------- */
const PETDEF = {
  mops:      { L: 30, H: 17, leg: 10, head: 13, snout: 4,  ear: 'fold',  tail: 'curl',  mask: '#2a1d14', belly: .18 },
  dackel:    { L: 48, H: 13, leg: 7,  head: 11, snout: 11, ear: 'long',  tail: 'thin',  mask: null, belly: .1 },
  bulldogge: { L: 34, H: 21, leg: 10, head: 15, snout: 4,  ear: 'rose',  tail: 'stub',  mask: '#3a2a20', belly: .25, jowl: 1 },
  husky:     { L: 42, H: 17, leg: 19, head: 13, snout: 9,  ear: 'erect', tail: 'fluffy', mask: null, belly: .7, white: 1, eye: '#5fb6ff' },
  katze:     { L: 34, H: 13, leg: 13, head: 11, snout: 2,  ear: 'cat',   tail: 'cat',   mask: null, belly: .2, stripes: 1, eye: '#9bd34a' }
};
function drawPet(t, G) {
  const S = MK.S; if (!S.pet) return; const p = MK.PETS.find(x => x.id === S.pet); if (!p) return;
  const lvP = (S.petLv && S.petLv[p.id]) || 1, k = G.pScale * .9 * (1 + (lvP - 1) * .06), x = G.px + 125 * G.pScale, y = G.py - 2;
  const busy = Sc.vis.ph >= 0, cheer = Sc.vis.cheer > 0, jump = cheer ? -Math.abs(Math.sin(t * 7)) * 14 * k : 0, blink = (t % 4.3) < .13;
  contactShadow(x, y + 1, (p.kind === 'papagei' ? 18 : 30) * k, 5 * k, .35);
  c.save(); c.translate(x, y + jump); c.scale(-1, 1); // schaut nach links zum Spieler
  if (p.kind === 'papagei') drawParrot(p, k, t, busy, cheer, blink, lvP); else drawQuad(p, PETDEF[p.kind], k, t, busy, cheer, blink, lvP);
  c.restore();
  Sc.npcPos.pet = { x, y: y - (p.kind === 'papagei' ? 110 : 60) * k };
  if (lvP >= 3 && Math.random() < .06) Sc.particle('spark', x + rnd(-20, 20) * k, y - rnd(20, 50) * k, 1);
}
function furGrad(col, y0, y1, belly) { const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, M(col, '#ffffff', .22)); g.addColorStop(.45, col); g.addColorStop(1, M(col, belly ? '#ffffff' : '#000000', belly ? .35 : .28)); return g; }
function drawQuad(p, d, k, t, busy, cheer, blink, lvP) {
  const col = p.col, ink = M(col, '#000000', .55), dark = M(col, '#000000', .3), L = d.L * k, Hb = d.H * k, leg = d.leg * k, by = Math.sin(t * 2.2) * .7 * k, wag = Math.sin(t * (cheer ? 26 : busy ? 14 : 6));
  const bodyY = -leg - Hb * .5 + by, legW = Math.max(3.2 * k, Hb * .42), step = busy ? Math.sin(t * 10) * 1.5 * k : 0;
  const legAt = (lx, far, ph) => { const x0 = lx, top = bodyY + Hb * .2, lift = far ? 0 : ph; c.fillStyle = far ? M(col, '#000000', .32) : M(col, '#000000', .12); c.beginPath(); c.roundRect(x0 - legW / 2, top, legW, -top - lift, legW * .45); c.fill();
    c.fillStyle = far ? M(col, '#000000', .38) : M(col, d.white ? '#ffffff' : '#000000', .15); c.beginPath(); c.ellipse(x0 + legW * .25, -lift - legW * .25, legW * .62, legW * .32, 0, 0, TAU); c.fill(); };
  // hintere Beine (weiter weg)
  legAt(-L * .3 + 3 * k, 1, 0); legAt(L * .3 + 3 * k, 1, 0);
  // Schwanz
  const tx = -L * .5, ty = bodyY - Hb * .15; c.lineCap = 'round'; c.strokeStyle = col;
  if (d.tail === 'curl') { c.lineWidth = 4.2 * k; c.beginPath(); c.arc(tx - 2 * k, ty - 6 * k, 5 * k, Math.PI * .2 + wag * .3, Math.PI * 1.9 + wag * .3); c.stroke(); }
  else if (d.tail === 'stub') { c.lineWidth = 4.5 * k; c.beginPath(); c.moveTo(tx + 2 * k, ty); c.lineTo(tx - 5 * k, ty - 4 * k + wag * 2 * k); c.stroke(); }
  else if (d.tail === 'fluffy') { c.fillStyle = col; c.beginPath(); c.moveTo(tx + 3 * k, ty - 2 * k); c.quadraticCurveTo(tx - 16 * k, ty - 8 * k + wag * 3 * k, tx - 8 * k, ty - 22 * k + wag * 4 * k); c.quadraticCurveTo(tx - 2 * k, ty - 14 * k, tx + 4 * k, ty + 3 * k); c.fill(); c.fillStyle = M(col, '#ffffff', .55); c.beginPath(); c.ellipse(tx - 9 * k, ty - 19 * k + wag * 4 * k, 3 * k, 4.5 * k, .5, 0, TAU); c.fill(); }
  else if (d.tail === 'cat') { c.lineWidth = 3.4 * k; c.beginPath(); c.moveTo(tx + 2 * k, ty); c.bezierCurveTo(tx - 14 * k, ty - 4 * k, tx - 6 * k + wag * 4 * k, ty - 26 * k, tx - 14 * k + wag * 5 * k, ty - 34 * k); c.stroke(); }
  else { c.lineWidth = 2.6 * k; c.beginPath(); c.moveTo(tx + 2 * k, ty); c.quadraticCurveTo(tx - 10 * k, ty - 4 * k, tx - 16 * k, ty - 10 * k + wag * 5 * k); c.stroke(); }
  // Körper
  const body = new Path2D(); body.ellipse(0, bodyY, L * .5, Hb * .5, 0, 0, TAU); body.ellipse(L * .3, bodyY - Hb * .05, Hb * .58, Hb * .58, 0, 0, TAU);
  c.strokeStyle = rgbaS(ink, .55); c.lineWidth = 2.2 * k; c.stroke(body); c.fillStyle = furGrad(col, bodyY - Hb * .6, bodyY + Hb * .6, d.white); c.fill(body);
  c.save(); c.clip(body); if (d.white) { c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.ellipse(L * .05, bodyY + Hb * .45, L * .45, Hb * .38, 0, 0, TAU); c.fill(); }
  if (d.stripes) { c.strokeStyle = rgbaS(M(col, '#000000', .45), .55); c.lineWidth = 2.2 * k; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(i * L * .13, bodyY - Hb * .55); c.quadraticCurveTo(i * L * .13 + 3 * k, bodyY - Hb * .1, i * L * .13 - 1 * k, bodyY + Hb * .15); c.stroke(); } }
  c.strokeStyle = rgbaS(M(col, '#ffffff', .45), .5); c.lineWidth = .9 * k; for (let i = 0; i < 9; i++) { const fx = -L * .4 + i * L * .1; c.beginPath(); c.moveTo(fx, bodyY - Hb * .42); c.lineTo(fx + 2.5 * k, bodyY - Hb * .3); c.stroke(); }
  c.restore();
  // vordere Beine
  legAt(-L * .3, 0, step > 0 ? step : 0); legAt(L * .3, 0, step < 0 ? -step : 0);
  // Kopf
  const hr = d.head * k, hx = L * .48 + hr * .55, hy = bodyY - Hb * .55 - hr * .45 + (busy ? Math.sin(t * 10) * 1 * k : Math.sin(t * 1.3) * .8 * k), tilt = cheer ? Math.sin(t * 6) * .15 : Math.sin(t * .7) * .06;
  c.save(); c.translate(hx, hy); c.rotate(tilt);
  // Ohren hinten
  if (d.ear === 'long') { c.fillStyle = dark; c.beginPath(); c.ellipse(-hr * .45, hr * .35, hr * .38, hr * .85, .25 + wag * .05, 0, TAU); c.fill(); }
  const head = new Path2D(); head.ellipse(0, 0, hr, hr * .92, 0, 0, TAU); c.fillStyle = furGrad(col, -hr, hr, d.white); c.fill(head);
  const sn = d.snout * k, sx = hr * .7 + sn * .5, sy = hr * .3; const snout = new Path2D(); snout.ellipse(sx, sy, hr * .42 + sn * .5, hr * .42, .1, 0, TAU);
  c.fillStyle = d.mask ? d.mask : M(col, '#ffffff', d.white ? .6 : .18); c.fill(snout);
  if (d.white) { c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.ellipse(hr * .1, hr * .35, hr * .55, hr * .45, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(hr * .25, -hr * .25, hr * .18, hr * .12, 0, 0, TAU); c.fill(); }
  if (d.mask) { c.fillStyle = rgbaS(d.mask, .55); c.beginPath(); c.ellipse(hr * .35, -hr * .1, hr * .38, hr * .3, 0, 0, TAU); c.fill(); }
  if (d.jowl) { c.fillStyle = M(d.mask, '#000000', .2); c.beginPath(); c.ellipse(sx - sn * .1, sy + hr * .35, hr * .35, hr * .22, 0, 0, TAU); c.fill(); }
  c.strokeStyle = rgbaS(ink, .5); c.lineWidth = 1 * k; c.stroke(head);
  // Augen
  const ex = hr * .35, ey = -hr * .15; if (blink) { c.strokeStyle = '#1a1210'; c.lineWidth = 1.4 * k; c.beginPath(); c.moveTo(ex - 2.6 * k, ey); c.lineTo(ex + 2.6 * k, ey); c.stroke(); }
  else { c.fillStyle = '#fff'; c.beginPath(); c.ellipse(ex, ey, 3.1 * k, 3.4 * k, 0, 0, TAU); c.fill(); c.fillStyle = d.eye || '#3a2414'; c.beginPath(); c.arc(ex + .8 * k, ey + .2 * k, 2.3 * k, 0, TAU); c.fill(); c.fillStyle = '#0d0a08'; c.beginPath(); c.arc(ex + 1 * k, ey + .3 * k, 1.2 * k, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(ex + .2 * k, ey - .8 * k, .8 * k, 0, TAU); c.fill(); }
  // Nase, Maul, Zunge
  const nx = sx + hr * .3 + sn * .45, ny = sy - hr * .12; c.fillStyle = '#16100c'; c.beginPath(); c.ellipse(nx, ny, (d.ear === 'cat' ? 1.6 : 2.8) * k, (d.ear === 'cat' ? 1.2 : 2) * k, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.arc(nx - .8 * k, ny - .6 * k, .7 * k, 0, TAU); c.fill();
  c.strokeStyle = '#1a1210'; c.lineWidth = .9 * k; c.beginPath(); c.moveTo(nx - .5 * k, ny + 1.8 * k); c.quadraticCurveTo(nx - 4 * k, ny + 5.5 * k, nx - 8 * k, ny + 3.5 * k); c.stroke();
  if ((busy || cheer) && d.ear !== 'cat') { c.fillStyle = '#e8657a'; c.beginPath(); c.ellipse(nx - 4.5 * k, ny + 6.5 * k + Math.sin(t * 12) * .6 * k, 2.2 * k, 3.6 * k, .2, 0, TAU); c.fill(); }
  if (d.ear === 'cat') { c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = .6 * k; for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(nx - 1 * k, ny + 1 * k); c.lineTo(nx + 9 * k, ny + i * 3 * k); c.stroke(); } }
  // Ohren vorne
  c.fillStyle = dark;
  if (d.ear === 'erect' || d.ear === 'cat') [-.15, .25].forEach((o, i) => { c.fillStyle = i ? col : dark; c.beginPath(); c.moveTo(-hr * .55 + o * hr, -hr * .55); c.lineTo(-hr * .35 + o * hr, -hr * 1.45 - (cheer ? 2 * k : 0)); c.lineTo(-hr * .02 + o * hr, -hr * .75); c.closePath(); c.fill(); if (i) { c.fillStyle = '#e9a4a4'; c.beginPath(); c.moveTo(-hr * .45 + o * hr, -hr * .7); c.lineTo(-hr * .33 + o * hr, -hr * 1.2); c.lineTo(-hr * .12 + o * hr, -hr * .8); c.closePath(); c.fill(); } });
  if (d.ear === 'fold') { c.beginPath(); c.ellipse(-hr * .55, -hr * .55, hr * .3, hr * .22, -.6 + wag * .04, 0, TAU); c.fill(); }
  if (d.ear === 'rose') { c.beginPath(); c.ellipse(-hr * .6, -hr * .62, hr * .26, hr * .18, -.9, 0, TAU); c.fill(); }
  if (d.ear === 'long') { c.beginPath(); c.ellipse(-hr * .3, hr * .2, hr * .32, hr * .8, .15 + wag * .04, 0, TAU); c.fill(); c.strokeStyle = rgbaS(ink, .4); c.lineWidth = .8 * k; c.stroke(); }
  c.restore();
  // Halsband / Aufwertung: gebogenes Band um den Hals, Marke hängt vorne
  const cx2 = L * .44 + hr * .15, cy2 = bodyY - Hb * .42, nr = Math.max(Hb * .34, hr * .5), band = lvP >= 3 ? '#e6b422' : '#d83a32';
  c.save(); c.translate(cx2, cy2); c.rotate(-.55); c.lineCap = 'round';
  c.strokeStyle = M(band, '#000000', .35); c.lineWidth = 4.2 * k; c.beginPath(); c.ellipse(0, 0, nr * .45, nr, 0, -Math.PI / 2, Math.PI / 2); c.stroke();
  c.strokeStyle = band; c.lineWidth = 3 * k; c.stroke(); c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = .8 * k; c.beginPath(); c.ellipse(-.6 * k, -.6 * k, nr * .45, nr, 0, -Math.PI / 2.4, Math.PI / 3); c.stroke();
  const tgx = nr * .45, tgy = nr * .2;
  if (lvP >= 3) { c.fillStyle = '#7fe3ff'; c.beginPath(); c.moveTo(tgx, tgy); c.lineTo(tgx + 3 * k, tgy + 3.5 * k); c.lineTo(tgx, tgy + 7 * k); c.lineTo(tgx - 3 * k, tgy + 3.5 * k); c.closePath(); c.fill(); c.fillStyle = 'rgba(255,255,255,.8)'; c.fillRect(tgx - .6 * k, tgy + 1.6 * k, 1.2 * k, 1.2 * k); }
  else { c.fillStyle = '#f2c230'; c.beginPath(); c.arc(tgx + .5 * k, tgy + 3 * k, 2.2 * k, 0, TAU); c.fill(); }
  c.restore();
  if (lvP === 2) { c.save(); c.translate(cx2 + 2 * k, cy2 + 2 * k); c.fillStyle = '#2f6fd1'; c.beginPath(); c.moveTo(-3 * k, -2 * k); c.lineTo(7 * k, -1 * k); c.lineTo(3 * k, 10 * k); c.closePath(); c.fill(); c.fillStyle = 'rgba(255,255,255,.75)'; [[1, 1], [3.5, 4]].forEach(([a, b2]) => { c.beginPath(); c.arc(a * k, b2 * k, .9 * k, 0, TAU); c.fill(); }); c.restore(); }
}
function drawParrot(p, k, t, busy, cheer, blink, lvP) {
  const col = p.col, bob = Math.sin(t * (busy ? 9 : 2)) * 1.6 * k, fl = cheer ? Math.sin(t * 30) : 0;
  c.fillStyle = '#6a4a2a'; c.fillRect(-2.5 * k, -64 * k, 5 * k, 64 * k); c.beginPath(); c.roundRect(-20 * k, -66 * k, 40 * k, 5 * k, 2 * k); c.fill(); c.fillStyle = '#4a3420'; c.fillRect(-12 * k, -3 * k, 24 * k, 3 * k);
  const by = -86 * k + bob; c.fillStyle = '#d83a32'; c.beginPath(); c.moveTo(-4 * k, by + 12 * k); c.lineTo(-9 * k, by + 40 * k); c.lineTo(-2 * k, by + 38 * k); c.lineTo(2 * k, by + 12 * k); c.fill(); // Schwanzfedern
  c.fillStyle = '#2f6fd1'; c.beginPath(); c.moveTo(-1 * k, by + 14 * k); c.lineTo(-4 * k, by + 36 * k); c.lineTo(1 * k, by + 34 * k); c.fill();
  const body = new Path2D(); body.ellipse(0, by, 10 * k, 17 * k, -.15, 0, TAU); c.fillStyle = furGrad(col, by - 17 * k, by + 17 * k); c.fill(body); c.strokeStyle = rgbaS(M(col, '#000000', .55), .5); c.lineWidth = 1 * k; c.stroke(body);
  c.save(); c.translate(-3 * k, by - 2 * k); c.rotate(-.25 - fl * .6); c.fillStyle = M(col, '#000000', .25); c.beginPath(); c.ellipse(-3 * k, 6 * k, 6 * k, 14 * k, .2, 0, TAU); c.fill(); c.fillStyle = '#2f6fd1'; c.beginPath(); c.ellipse(-4 * k, 14 * k, 4 * k, 6 * k, .2, 0, TAU); c.fill();
  c.strokeStyle = rgbaS('#000000', .25); c.lineWidth = .7 * k; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-8 * k, i * 4 * k); c.lineTo(1 * k, i * 4 * k + 3 * k); c.stroke(); } c.restore();
  const hy = by - 19 * k; const head = new Path2D(); head.arc(2 * k, hy, 8.5 * k, 0, TAU); c.fillStyle = furGrad(col, hy - 9 * k, hy + 9 * k); c.fill(head);
  c.fillStyle = '#f2c230'; c.beginPath(); c.arc(2 * k, hy - 5 * k, 5 * k, Math.PI, TAU); c.fill(); // gelber Scheitel
  c.fillStyle = '#fff'; c.beginPath(); c.arc(5 * k, hy - 1 * k, 3.6 * k, 0, TAU); c.fill(); if (!blink) { c.fillStyle = '#111'; c.beginPath(); c.arc(5.8 * k, hy - 1 * k, 1.7 * k, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(5.2 * k, hy - 1.8 * k, .6 * k, 0, TAU); c.fill(); }
  c.fillStyle = '#2b2b30'; c.beginPath(); c.moveTo(9 * k, hy - 2 * k); c.quadraticCurveTo(17 * k, hy - 1 * k, 13 * k, hy + 7 * k); c.quadraticCurveTo(12 * k, hy + 2 * k, 9 * k, hy + 3 * k); c.closePath(); c.fill(); c.fillStyle = '#4a4a52'; c.beginPath(); c.moveTo(9 * k, hy + 3 * k); c.lineTo(13 * k, hy + 5 * k); c.lineTo(9 * k, hy + 6 * k); c.fill();
  c.fillStyle = '#c8a070'; [-3, 3].forEach(o => { c.beginPath(); c.ellipse(o * k, -64 * k, 2.4 * k, 1.6 * k, 0, 0, TAU); c.fill(); });
  if (lvP >= 2) { c.fillStyle = lvP >= 3 ? '#e6b422' : '#d83a32'; c.beginPath(); c.roundRect(-5 * k, hy + 6 * k, 12 * k, 3 * k, 1.5 * k); c.fill(); }
}
const rgbaS = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
/* ======================================================================
   REQUISITEN AM SPIELER
   ====================================================================== */
/* ---------- Gewichte: aus echten Scheiben zusammengesetzt, jede Stufe sieht schwerer aus ---------- */
const PLATES = [[25, '#d83a32', 22, 5.6], [20, '#2f6fe0', 22, 5], [15, '#f2c230', 19.5, 4.4], [10, '#2fa86a', 17, 3.8], [5, '#f1efe9', 12.5, 3], [2.5, '#26262a', 9.5, 2.5], [1.25, '#b8bcc2', 7.5, 2]];
function platesFor(kg, scale) { const out = []; let r = kg; for (const [w, col, rad, th] of PLATES) { while (r >= w - .01 && out.length < 7) { out.push({ w, col, rad: rad * (scale || 1), th: th * (scale || 1) }); r -= w; } } return out; }
const plMix = (a, b, t) => { const f = h => { if (h.length === 4) h = '#' + [...h.slice(1)].map(x => x + x).join(''); return [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); }, A = f(a), B = f(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
function prr(x, y, rx, ry, col) { rrPath(x - rx * 1.6, y - ry, rx * 3.2, ry * 2, rx * 1.4); c.fillStyle = col; c.fill(); c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 1; c.stroke(); }
let PLV = 0; // Level des aktuell gezeichneten Gewichts → Scheiben-Effekte
function rrPath(x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r); c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath(); }
Sc.plateFxLv = () => PLV;
function plateSide(x, y, dir, plates, k, vert) { // Scheiben von innen nach außen, Kante: Rechteck mit runden Enden, Effekte je Level
  const lv = PLV, t = performance.now() / 1000; let off = 0;
  plates.forEach((p0, i) => { const p = lv >= 20 ? Object.assign({}, p0, { col: lv >= 21 ? '#17181e' : '#d4dae2' }) : p0, tw = p.th * 2, cx = x + (vert ? 0 : dir * (off + tw / 2) * k), cy = y + (vert ? dir * (off + tw / 2) * k : 0);
    const w = (vert ? p.rad * 2 : tw) * k + (vert ? 0 : 1), h = (vert ? tw : p.rad * 2) * k + (vert ? 1 : 0), x0 = cx - w / 2, y0 = cy - h / 2, rr = (vert ? h : w) * .42;
    c.save();
    if (lv >= 12) { c.shadowColor = lv >= 21 ? 'rgba(140,175,255,.9)' : lv >= 20 ? 'rgba(235,242,255,.9)' : lv >= 19 ? 'rgba(255,205,90,.9)' : p.col; c.shadowBlur = (4 + Math.sin(t * 3 + i) * 2 + Math.min(8, (lv - 12) * .8)) * k; }
    const g = vert ? c.createLinearGradient(x0, 0, x0 + w, 0) : c.createLinearGradient(0, y0, 0, y0 + h);
    g.addColorStop(0, plMix(p.col, '#ffffff', .25)); g.addColorStop(.45, p.col); g.addColorStop(1, plMix(p.col, '#000000', .35));
    c.fillStyle = g; rrPath(x0, y0, w, h, rr); c.fill(); c.restore();
    c.save(); rrPath(x0, y0, w, h, rr); c.clip();
    // Kantenlicht (Chrom-Rand ab Lv 5)
    c.fillStyle = 'rgba(255,255,255,' + (lv >= 4 ? .42 : .22) + ')'; if (vert) c.fillRect(x0, y0, w, Math.max(1, h * .22)); else c.fillRect(x0, y0, Math.max(1, w * .22), h);
    // Rille (Griffloch-Andeutung)
    c.fillStyle = 'rgba(0,0,0,.22)'; if (vert) c.fillRect(cx - w * .08, y0, w * .16, h); else c.fillRect(x0, cy - h * .08, w, h * .16);
    // Glanz-Sweep ab Lv 9
    if (lv >= 8) { const ph = ((t * .6 + i * .13) % 1.6) - .3, sw = c.createLinearGradient(vert ? x0 : 0, vert ? 0 : y0, vert ? x0 + w : 0, vert ? 0 : y0 + h);
      const cl = v => Math.max(0, Math.min(1, v)); sw.addColorStop(cl(ph - .12), 'rgba(255,255,255,0)'); sw.addColorStop(cl(ph), 'rgba(255,255,255,.55)'); sw.addColorStop(cl(ph + .12), 'rgba(255,255,255,0)'); c.fillStyle = sw; c.fillRect(x0, y0, w, h); }
    c.restore();
    c.lineWidth = Math.max(.8, .9 * k); c.strokeStyle = lv >= 21 ? '#8fa8ff' : lv >= 20 ? '#ffffff' : lv >= 16 ? '#e8c35a' : 'rgba(20,20,20,.8)'; if (lv >= 16) c.lineWidth = Math.max(1.1, 1.3 * k); rrPath(x0, y0, w, h, rr); c.stroke();
    // Funken ab Lv 20 (astral)
    if (lv >= 19 && i === plates.length - 1) for (let j = 0; j < 3; j++) { const a = t * 2.2 + j * 2.1, sx = cx + Math.cos(a) * (vert ? p.rad : tw * .9) * k, sy = cy + Math.sin(a) * (vert ? tw * .9 : p.rad) * k, r = (1 + Math.sin(t * 6 + j) * .5 + .6) * k;
      c.fillStyle = lv >= 21 ? 'rgba(170,200,255,.95)' : lv >= 20 ? 'rgba(255,255,255,.95)' : 'rgba(255,215,110,.95)'; c.beginPath(); c.arc(sx, sy, r, 0, TAU); c.fill(); }
    off += tw + .3; });
  return off;
}
/* Kurzhantel: bis 10 kg Gummi-Hexhantel (wächst), darüber Scheibenhantel mit sichtbar mehr Scheiben */
function dumbbell(x, y, k, kg, vert, big) {
  if (typeof kg !== 'number') kg = big ? 14 : 8;
  c.save(); c.translate(x, y); if (vert) c.rotate(Math.PI / 2);
  if (WREC) { const L2 = (kg <= 10 ? 16 + kg * .6 : 13 + kg * .12 + 10) * k / 2; wrec(-L2, 0, 9 * k); wrec(L2, 0, 9 * k); }
  if (kg <= 10) {
    const s = (4.2 + 2.6 * Math.cbrt(kg)) * k, len = (16 + kg * .6) * k;
    c.fillStyle = '#9ca1a8'; c.fillRect(-len / 2, -1.7 * k, len, 3.4 * k);
    [-1, 1].forEach(d => { c.save(); c.translate(d * len / 2, 0); c.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + Math.PI / 6; c.lineTo(Math.cos(a) * s * .5, Math.sin(a) * s); } c.closePath();
      c.fillStyle = '#2b2b30'; c.fill(); c.strokeStyle = '#111'; c.lineWidth = .9 * k; c.stroke(); c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(-s * .4, -s * .7, s * .2, s * 1.1); c.restore(); });
    c.fillStyle = '#f2c230'; c.font = `700 ${Math.max(5, 4.5 * k)}px Arial`; c.textAlign = 'center'; c.textBaseline = 'middle'; if (k > .8) c.fillText(String(kg).replace('.', ','), len / 2, 0);
  } else {
    const side = (kg - 2.5) / 2, pl = platesFor(side, .62 * (1 + kg / 55)).map(p => Object.assign(p, { th: p.th * (2 + kg / 40) })), len = (13 + kg * .12) * k; // schwere Hanteln: deutlich größere, dickere Scheiben
    c.fillStyle = '#c3c7cc'; c.fillRect(-len / 2 - 3 * k, -1.8 * k, len + 6 * k, 3.6 * k);
    [-1, 1].forEach(d => { const w = plateSide(d * len / 2, 0, d, pl, k, false); c.fillStyle = '#c3c7cc'; c.fillRect(d > 0 ? len / 2 + w * k : -len / 2 - w * k - 3 * k, -1.6 * k, 3 * k, 3.2 * k); });
  }
  c.restore();
}
/* Langhantel: kgSide = Last pro Seite. Stange 20 kg, Scheiben nach Gewicht. */
function barbell(x1, y1, x2, y2, k, kgSide, extra, bend) {
  if (typeof kgSide !== 'number') kgSide = Math.max(2.5, MK.WEIGHTS[Math.min(MK.WEIGHTS.length - 1, MK.S.wset)]);
  const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2, pl = platesFor(kgSide, 1 + Math.min(.35, kgSide / 120)).map(p => Object.assign(p, { th: p.th * 1.6 })), pw = pl.reduce((a, p) => a + p.th * 2 + .3, 0) * k;
  const sleeve = Math.max(Math.abs(x2 - x1) / 2 + 16 * k, (extra || 0) * k * .7), half = sleeve + 4 * k + pw + 10 * k, bd = bend || 0;
  // Stange als Kurve: in der Mitte gehalten, die Enden hängen unter dem Gewicht durch
  c.strokeStyle = '#8a8d94'; c.lineWidth = 3.8 * k; c.beginPath(); c.moveTo(cx - half, cy + bd); c.quadraticCurveTo(cx, cy - bd * .9, cx + half, cy + bd); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 1 * k; c.beginPath(); c.moveTo(cx - half, cy + bd - 1.4 * k); c.quadraticCurveTo(cx, cy - bd * .9 - 1.4 * k, cx + half, cy + bd - 1.4 * k); c.stroke();
  [-1, 1].forEach(d => { const yE = cy + bd * .75, ang = d * Math.atan2(bd * 1.6, half); c.save(); c.translate(cx + d * sleeve, yE); c.rotate(ang); c.translate(-(cx + d * sleeve), -yE);
    c.fillStyle = '#b8bcc2'; c.fillRect(d > 0 ? cx + sleeve : cx - sleeve - 4 * k, yE - 4.5 * k, 4 * k, 9 * k);
    const st = cx + d * (sleeve + 4 * k), w = plateSide(st, yE, d, pl, k, false) * k; wrec(st + d * w / 2, yE, Math.max(10 * k, w));
    c.fillStyle = '#d6d9dd'; c.fillRect(d > 0 ? st + w : st - w - 3 * k, yE - 3 * k, 3 * k, 6 * k); c.restore(); });
}
/* Kabelturm mit Gewichtsstapel: je schwerer, desto mehr Platten hängen am Bolzen */
function cableStack(x, yTop, yBot, k, wi, lift) { // Gewichtsblock: dicke schwarze Platten, eckig mit leicht runden Ecken
  const w = 48 * k, n = 11, used = Math.min(n, 2 + Math.round(wi * .5)), ph = Math.max(5, Math.min(15 * k, (yBot - yTop - 70 * k) / n * .72)), gap = 1.8 * k, ly = lift * 36 * k, rx = w / 2 + 6 * k;
  [-1, 1].forEach(s2 => { const g = c.createLinearGradient(x + s2 * rx - 3 * k, 0, x + s2 * rx + 3 * k, 0); g.addColorStop(0, '#5a5e66'); g.addColorStop(.4, '#c9ced4'); g.addColorStop(1, '#4a4d55'); c.fillStyle = g; c.fillRect(x + s2 * rx - 2.5 * k, yTop, 5 * k, yBot - yTop); });
  c.fillStyle = '#2a2b30'; c.beginPath(); c.roundRect(x - rx - 6 * k, yTop - 4 * k, (rx + 6 * k) * 2, 9 * k, 3 * k); c.fill(); c.fillRect(x - rx - 8 * k, yBot - 6 * k, (rx + 8 * k) * 2, 6 * k);
  c.fillStyle = '#9ca1a8'; c.beginPath(); c.arc(x, yTop + 10 * k, 6 * k, 0, TAU); c.fill(); c.fillStyle = '#3a3c42'; c.beginPath(); c.arc(x, yTop + 10 * k, 2.4 * k, 0, TAU); c.fill();
  // wie an der echten Maschine: leichteste Platte oben, schwerste unten. Der Stift steckt in Platte Nr. „used“ – genau die Platten darüber werden nach oben gezogen.
  const stackTop = yBot - 8 * k - n * (ph + gap); let topY = stackTop;
  for (let i = n - 1; i >= 0; i--) { const on = i < used, y = stackTop + i * (ph + gap) - (on ? ly : 0); if (i === 0) topY = y;
    const g = c.createLinearGradient(0, y, 0, y + ph); g.addColorStop(0, on ? '#3b3d45' : '#2e3036'); g.addColorStop(.5, on ? '#23252b' : '#1d1f24'); g.addColorStop(1, '#121317'); c.fillStyle = g; c.beginPath(); c.roundRect(x - w / 2, y, w, ph, Math.min(2.2 * k, ph / 3)); c.fill();
    c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(x - w / 2 + 2 * k, y + .6, w - 4 * k, Math.max(.8, .9 * k));
    c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(x - 2.2 * k, y, 4.4 * k, ph); // Führungsloch
    c.fillStyle = on ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.25)'; c.font = `700 ${Math.max(5, ph * .55)}px Arial`; c.textAlign = 'left'; c.textBaseline = 'middle'; if (ph > 6) c.fillText(String((i + 1) * 5), x - w / 2 + 3 * k, y + ph * .55);
    if (i === used - 1) { c.fillStyle = '#d83a32'; c.beginPath(); c.roundRect(x + w / 2 - 4 * k, y + ph * .3, 9 * k, ph * .4, 1.5 * k); c.fill(); } }
  c.textBaseline = 'alphabetic'; wrec(x, stackTop + (used / 2) * (ph + gap) - ly, w * .55);
  c.strokeStyle = '#111'; c.lineWidth = 1.2 * k; c.beginPath(); c.moveTo(x, yTop + 10 * k); c.lineTo(x, topY); c.stroke();
}
function drawBgProps(R, pose, wi, sc, wx, wy) {
  const G0 = Sc.geo(), G = { px: wx == null ? G0.px : wx, py: wy == null ? G0.py : wy };
  (pose.props || []).forEach(p => {
    if (p.k === 'pullbar') { const y = G.py + p.y * sc; c.fillStyle = '#888c94'; c.fillRect(G.px - 120 * sc, y - 3 * sc, 240 * sc, 6 * sc); c.fillStyle = '#555'; c.fillRect(G.px - 124 * sc, y - 140 * sc, 6 * sc, 146 * sc); c.fillRect(G.px + 118 * sc, y - 140 * sc, 6 * sc, 146 * sc); }
    if (p.k === 'dipbars') { const y = G.py + p.y * sc; [-1, 1].forEach(s => { const x = G.px + s * (R.D.shH + 12) * sc; c.fillStyle = '#7a7d84'; c.fillRect(x - 3 * sc, y, 6 * sc, -p.y * sc); c.fillStyle = '#888c94'; c.fillRect(x - 6 * sc, y - 3 * sc, 12 * sc, 6 * sc); }); }
    if (p.k === 'bench' && p.lie && R.piv) { const P = R.piv, L = 170 * sc, w = 21 * sc;
      c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(P.x - 60 * sc, G.py - 4 * sc, 150 * sc, 12 * sc, 0, 0, TAU); c.fill();
      c.fillStyle = '#55585f'; [[P.x - L + 12 * sc], [P.x + 26 * sc]].forEach(([x]) => { c.fillRect(x - 4 * sc, P.y, 8 * sc, G.py - P.y); c.fillRect(x - 16 * sc, G.py - 6 * sc, 32 * sc, 6 * sc); });
      [-1, 1].forEach(s2 => { c.fillStyle = '#6d7076'; c.fillRect(P.x - L - 8 * sc, P.y + s2 * 62 * sc - 4 * sc, 8 * sc, G.py - P.y - s2 * 62 * sc + 4 * sc); c.fillStyle = '#9ca1a8'; c.fillRect(P.x - L - 14 * sc, P.y + s2 * 62 * sc - 10 * sc, 18 * sc, 6 * sc); });
      c.fillStyle = '#26262c'; c.beginPath(); c.roundRect(P.x - L, P.y - w, L + 40 * sc, w * 2, 9 * sc); c.fill(); c.fillStyle = 'rgba(255,255,255,.1)'; c.fillRect(P.x - L + 6 * sc, P.y - w + 3 * sc, L + 28 * sc, 4 * sc); return; }
    if (p.k === 'mat') { const x0 = G.px - 215 * sc, x1 = G.px + 185 * sc, y0 = G.py - 66 * sc, y1 = G.py + 12 * sc; // starr: immer dieselbe Größe und Lage, egal welche Pose
      c.fillStyle = '#2f6fa8'; c.beginPath(); c.moveTo(x0 + 10 * sc, y0); c.lineTo(x1 - 10 * sc, y0); c.lineTo(x1, y1); c.lineTo(x0, y1); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,255,255,.12)'; for (let i = 1; i < 4; i++) { const yy = y0 + (y1 - y0) * i / 4; c.fillRect(x0 + 6 * sc, yy, x1 - x0 - 12 * sc, 1.5); } c.fillStyle = '#244f78'; c.fillRect(x0, y1, x1 - x0, 5 * sc); return; }
    if (p.k === 'bench') { const y = R.hip.y + 16 * sc; c.fillStyle = '#2a2a30'; c.beginPath(); c.roundRect(G.px - 60 * sc, y - 4 * sc, 120 * sc, 12 * sc, 5 * sc); c.fill(); c.fillStyle = '#6d7076'; c.fillRect(G.px - 50 * sc, y + 8 * sc, 6 * sc, G.py - y - 8 * sc); c.fillRect(G.px + 44 * sc, y + 8 * sc, 6 * sc, G.py - y - 8 * sc); }
    if ((p.k === 'cable' || p.k === 'latbar' || p.k === 'rope') && (!p.h || p.h === 'l')) { // Kabelzug: Seil läuft über echte Umlenkrollen zum Gewichtsblock
      const lift = Sc.vis.ph >= 0 ? Math.sin(Sc.vis.ph * Math.PI) : 0, top = G.py - 380 * sc, pulY = top + 10 * sc, rr = 7 * sc;
      const pulley = (x, y) => { c.fillStyle = '#2a2b30'; c.beginPath(); c.arc(x, y, rr + 1.5 * sc, 0, TAU); c.fill(); c.fillStyle = '#b8bcc2'; c.beginPath(); c.arc(x, y, rr, 0, TAU); c.fill(); c.fillStyle = '#3a3c42'; c.beginPath(); c.arc(x, y, 2.4 * sc, 0, TAU); c.fill(); };
      const cab = pts => { c.strokeStyle = 'rgba(18,18,20,.92)'; c.lineWidth = Math.max(1.3, 1.8 * sc); c.lineJoin = 'round'; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach(q => c.lineTo(q[0], q[1])); c.stroke(); };
      if (p.k === 'cable') { // zwei Türme links und rechts, Seil kommt oben aus der Rolle
        cableStack(G.px - 220 * sc, top, G.py, sc, wi, lift); cableStack(G.px + 220 * sc, top, G.py, sc, wi, lift);
        [['l', -1], ['r', 1]].forEach(([h, d]) => { const H = R.ha[h], x = G.px + d * 220 * sc - d * 30 * sc; c.fillStyle = '#2a2b30'; c.fillRect(Math.min(x, G.px + d * 220 * sc), pulY - 3 * sc, 30 * sc, 6 * sc); pulley(x, pulY); cab([[H.x, H.y], [x - d * rr * .7, pulY + rr * .7]]); }); }
      if (p.k === 'latbar') { // Turm rechts, Ausleger mit Rolle genau über dem Kopf
        const tx = G.px + 170 * sc, H = R.ha, mx = (H.l.x + H.r.x) / 2, my = Math.min(H.l.y, H.r.y);
        cableStack(tx, top, G.py, sc, wi, lift);
        const g = c.createLinearGradient(0, pulY - 8 * sc, 0, pulY + 8 * sc); g.addColorStop(0, '#4a4d55'); g.addColorStop(.5, '#2c2e34'); g.addColorStop(1, '#1d1e22'); c.fillStyle = g; c.beginPath(); c.roundRect(G.px - 20 * sc, pulY - 8 * sc, tx - G.px + 20 * sc, 16 * sc, 3 * sc); c.fill();
        c.fillStyle = '#2a2b30'; c.fillRect(G.px - 6 * sc, pulY + 6 * sc, 12 * sc, 10 * sc);
        pulley(G.px, pulY + 14 * sc); pulley(tx, pulY);
        cab([[mx, my], [G.px, pulY + 14 * sc + rr]]); cab([[G.px + rr, pulY + 14 * sc], [G.px + rr, pulY - rr * .2], [tx - rr, pulY - rr * .2]]); }
      if (p.k === 'rope') { // Face Pull: Rolle vorne am Turm auf Kopfhöhe, Seil läuft am Turm hoch
        const tx = G.px + 170 * sc, py0 = R.head.y + 6 * sc, H = R.ha, mx = (H.l.x + H.r.x) / 2, my = (H.l.y + H.r.y) / 2;
        cableStack(tx, top, G.py, sc, wi, lift);
        c.fillStyle = '#2a2b30'; c.fillRect(tx - 34 * sc, py0 - 5 * sc, 20 * sc, 10 * sc); pulley(tx - 34 * sc, py0);
        cab([[mx, my], [tx - 34 * sc - rr * .3, py0 + rr * .9]]); cab([[tx - 34 * sc, py0 - rr], [tx - 34 * sc, pulY], [tx - rr, pulY - rr * .2]]); pulley(tx, pulY); } }
    if (p.k === 'hack') { const y0 = R.sh.l.y, kg = MK.WEIGHTS[wi], pl = platesFor(kg, 1);
      c.fillStyle = '#4a4d55'; [-1, 1].forEach(s2 => { c.beginPath(); c.moveTo(G.px + s2 * 70 * sc, G.py); c.lineTo(G.px + s2 * 62 * sc, G.py - 380 * sc); c.lineTo(G.px + s2 * 54 * sc, G.py - 380 * sc); c.lineTo(G.px + s2 * 62 * sc, G.py); c.fill(); });
      c.fillStyle = '#2a2a30'; c.fillRect(G.px - 66 * sc, y0 - 10 * sc, 132 * sc, 12 * sc);
      [-1, 1].forEach(s2 => { c.fillStyle = '#9ca1a8'; c.fillRect(G.px + s2 * 66 * sc - (s2 < 0 ? 26 * sc : 0), y0 - 7 * sc, 26 * sc, 6 * sc); plateSide(G.px + s2 * 72 * sc, y0 - 4 * sc, s2, pl, sc, false); });
      c.fillStyle = '#2a2a30'; c.fillRect(G.px - 60 * sc, G.py - 8 * sc, 120 * sc, 8 * sc); }
    if (p.k === 'flymachine') { const lift0 = Sc.vis.ph >= 0 ? Math.sin(Sc.vis.ph * Math.PI) : 0, tx = G.px + 150 * sc, top = G.py - 360 * sc; cableStack(tx, top, G.py, sc, wi, lift0);
      // Butterfly-Maschine: Rückenpolster, Querträger mit zwei Drehpunkten, Hebelarme bis zu den Griffen, Seil zum Gewichtsblock
      const ty = Math.min(R.sh.l.y, R.sh.r.y) - 64 * sc, metal = (x0, y0, x1, y1, w) => { c.strokeStyle = '#2a2b30'; c.lineWidth = w + 2.5 * sc; c.lineCap = 'round'; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.strokeStyle = '#8f949c'; c.lineWidth = w; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.lineCap = 'butt'; };
      c.fillStyle = '#2b2c31'; c.beginPath(); c.roundRect(G.px - 9 * sc, ty, 18 * sc, R.hip.y - ty + 20 * sc, 4 * sc); c.fill();
      c.fillStyle = '#1d1e22'; c.beginPath(); c.roundRect(G.px - 30 * sc, R.hip.y - 120 * sc, 60 * sc, 100 * sc, 10 * sc); c.fill();
      metal(G.px - 40 * sc, ty, tx, ty, 7 * sc);
      [['l', -1], ['r', 1]].forEach(([h, d]) => { const H = R.ha[h], pvx = G.px + d * 34 * sc; metal(pvx, ty + 4 * sc, H.x, H.y - 4 * sc, 6 * sc); c.fillStyle = '#c9ced4'; c.beginPath(); c.arc(pvx, ty + 4 * sc, 5 * sc, 0, TAU); c.fill(); });
      c.strokeStyle = 'rgba(18,18,20,.9)'; c.lineWidth = Math.max(1.3, 1.6 * sc); c.beginPath(); c.moveTo(G.px + 34 * sc, ty - 2 * sc); c.lineTo(tx, ty - 2 * sc); c.stroke(); }
    if (p.k === 'flymachine') { const top = R.sh.l.y - 70 * sc; c.fillStyle = '#3a3c42'; c.fillRect(R.hip.x - 26 * sc, top, 52 * sc, R.hip.y - top); ['l', 'r'].forEach(h => { const e = R.el[h] || R.ha[h], hd = R.ha[h]; c.fillStyle = '#26262c'; c.beginPath(); c.roundRect(Math.min(e.x, hd.x) - 7 * sc, Math.min(e.y, hd.y) - 6 * sc, Math.abs(e.x - hd.x) + 14 * sc, Math.abs(e.y - hd.y) + 12 * sc, 6 * sc); c.fill(); }); }
    if (p.k === 'rack') { const m = mat('rack'), xo = (R.D.shH + 58) * sc, top = G.py - 330 * sc; [-1, 1].forEach(s2 => { metal(G.px + s2 * xo - 4 * sc, top, 8 * sc, G.py - top, m, 1); c.fillStyle = '#2a2a30'; c.fillRect(G.px + s2 * xo - (s2 > 0 ? 14 : 2) * sc, G.py - 268 * sc, 16 * sc, 5 * sc); c.fillRect(G.px + s2 * (xo - 4 * sc) - (s2 > 0 ? 0 : 30 * sc), G.py - 120 * sc, 30 * sc, 4 * sc); });
      metal(G.px - xo - 4 * sc, top, xo * 2 + 8 * sc, 6 * sc, m); }
    if (p.k === 'step') { const y0 = G.py - 11 * sc; c.fillStyle = '#2a2a30'; c.beginPath(); c.roundRect(G.px - 62 * sc, y0, 124 * sc, 11 * sc, 3 * sc); c.fill(); c.fillStyle = '#4fbf6a'; c.fillRect(G.px - 60 * sc, y0, 120 * sc, 3 * sc); c.fillStyle = '#1c1c20'; c.fillRect(G.px - 58 * sc, G.py - 2 * sc, 12 * sc, 2 * sc); c.fillRect(G.px + 46 * sc, G.py - 2 * sc, 12 * sc, 2 * sc); }
    if (p.k === 'harness') { c.strokeStyle = '#3a2a1a'; c.lineWidth = 3 * sc; c.beginPath(); c.moveTo(R.hip.x, R.hip.y - 20 * sc); c.lineTo(R.hip.x - 260 * sc, R.hip.y + 10 * sc); c.stroke(); }
  });
}
/* ---------- Requisiten in der Seitenansicht (Schrägprojektion: Tiefe läuft nach rechts oben) ---------- */
function zOff(d, sc) { const Z = MK.Fig.ZV; return { x: Z.x * d * sc, y: Z.y * d * sc }; }
function box3(x0, y0, x1, y1, d0, d1, sc, top, front, side) { // Quader: x/y in Weltkoordinaten (Vorderkante), Tiefe d0..d1
  const a = zOff(d0, sc), b = zOff(d1, sc);
  c.fillStyle = side; c.beginPath(); c.moveTo(x1 + a.x, y0 + a.y); c.lineTo(x1 + b.x, y0 + b.y); c.lineTo(x1 + b.x, y1 + b.y); c.lineTo(x1 + a.x, y1 + a.y); c.fill();
  c.fillStyle = top; c.beginPath(); c.moveTo(x0 + a.x, y0 + a.y); c.lineTo(x1 + a.x, y0 + a.y); c.lineTo(x1 + b.x, y0 + b.y); c.lineTo(x0 + b.x, y0 + b.y); c.fill();
  c.fillStyle = front; c.fillRect(x0 + a.x, y0 + a.y, x1 - x0, y1 - y0);
}
function plateFace(x, y, p, k, dark) { const r = p.rad * k; c.fillStyle = dark ? MK.Fig.mix(p.col, '#000000', .3) : p.col; c.strokeStyle = 'rgba(20,20,20,.8)'; c.lineWidth = Math.max(.8, k); c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.stroke();
  if (!dark) { c.strokeStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.arc(x, y, r * .72, 0, TAU); c.stroke(); c.fillStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.arc(x - r * .3, y - r * .3, r * .32, 0, TAU); c.fill(); c.fillStyle = '#9ca1a8'; c.beginPath(); c.arc(x, y, Math.max(1.5, 3 * k), 0, TAU); c.fill(); } }
function sideBar(R, wi, sc, pass, at) { // Langhantel von schräg vorne: Scheiben als Kreise, die Stange läuft in die Tiefe
  const kg = Math.max(2.5, MK.WEIGHTS[Math.min(MK.WEIGHTS.length - 1, wi)]), pl = platesFor(kg, 1), n = R.ha.r, f = R.ha.l, C = at ? R.Wd(at) : { x: (n.x + f.x) / 2, y: (n.y + f.y) / 2 }, gp = R.D.shH + 13;
  const P0 = d => { const z = zOff(d, sc); return { x: C.x + z.x, y: C.y + z.y }; }, inner = gp + 18;
  if (pass === 'back') {
    const e1 = P0(inner + 60), e2 = P0(-(inner + 60)); c.strokeStyle = '#8a8d94'; c.lineWidth = 4 * sc; c.lineCap = 'round'; c.beginPath(); c.moveTo(e1.x, e1.y); c.lineTo(e2.x, e2.y); c.stroke(); c.lineCap = 'butt';
    let d = inner; const pos = pl.map(p => { const at = d + p.th / 2; d += p.th + .4; return at; });
    for (let i = pl.length - 1; i >= 0; i--) { const q = P0(pos[i] + pl[i].th / 2), q2 = P0(pos[i] - pl[i].th / 2); plateFace(q.x, q.y, pl[i], sc, true); plateFace(q2.x, q2.y, pl[i], sc, false); }
    const cl = P0(inner - 3); c.fillStyle = '#b8bcc2'; c.beginPath(); c.arc(cl.x, cl.y, 5 * sc, 0, TAU); c.fill(); return;
  }
  const cl = P0(-(inner - 3)); c.fillStyle = '#b8bcc2'; c.beginPath(); c.arc(cl.x, cl.y, 5 * sc, 0, TAU); c.fill();
  const s1 = P0(-gp + 4), s2 = P0(-(inner + 60)); c.strokeStyle = '#8a8d94'; c.lineWidth = 4 * sc; c.lineCap = 'round'; c.beginPath(); c.moveTo(s1.x, s1.y); c.lineTo(s2.x, s2.y); c.stroke(); c.lineCap = 'butt';
  let d = inner; pl.forEach(p => { const a = P0(-(d)), b = P0(-(d + p.th)); plateFace(a.x, a.y, p, sc, true); plateFace(b.x, b.y, p, sc, false); d += p.th + .4; });
}
let spotP = null;
function spotter(R, sc, wi) { // Trainingskumpel steht hinter der Bank und sichert die Stange
  const S = MK.S, J = R.J; Sc._spotNow = true;
  if (S.partner && S.partner.lv && partnerP) { const id = 'kevin' + partnerP.lvl; if (!spotP || spotP.id !== id) spotP = { id, L: partnerP.L, lv: partnerP.lv, belly: 0, post: partnerP.post }; }
  else { const id = S.gym >= 2 ? 'marco' : 'guenther', n = NPC.find(x => x.id === id); if (!spotP || spotP.id !== id) spotP = { id, L: MK.Fig.resolveLook(n.look), lv: Object.fromEntries(MK.MUSCLES.map(m => [m.id, n.lv])), belly: n.belly || 0, post: n.post }; }
  const base = R.Wd({ x: J.S.x - 58, y: 0 }), z = zOff(46, sc), px = base.x + z.x, py = base.y + z.y, ss = sc * .92;
  const C = { x: (R.ha.r.x + R.ha.l.x) / 2, y: (R.ha.r.y + R.ha.l.y) / 2 }, lx = (C.x - px) / ss, ly = (C.y - py) / ss;
  const pose = { arms: { l: { w: [12 - lx, ly + 6], b: 'down' }, r: { w: [lx + 12, ly + 6], b: 'down' } }, head: { y: 5 }, look: { x: 1, y: 1 }, face: wi >= 10 ? 'focus' : 'neutral' };
  c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(px, py + 1, 30 * ss, 6 * ss, 0, 0, TAU); c.fill();
  MK.Fig.render(c, px, py, ss, { key: 'spot', lv: spotP.lv, L: spotP.L, pose, posture: spotP.post, plain: true, belly: spotP.belly, breath: 0 });
}
function drawSideBg(R, pose, wi, sc, ex) {
  const J = R.J, Wd = R.Wd, D = R.D;
  // Schatten am Boden
  const sx0 = Wd({ x: J.head.c.x - 20, y: 0 }), sx1 = Wd({ x: J.leg.n.A.x + 20, y: 0 }); c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.ellipse((sx0.x + sx1.x) / 2, sx0.y - 2 * sc, (sx1.x - sx0.x) / 2 + 10 * sc, 10 * sc, 0, 0, TAU); c.fill();
  (pose.props || []).forEach(p => {
    if (p.k === 'smat') { const a = Wd({ x: -150, y: -4 }), b = Wd({ x: 200, y: 0 }); // Matte liegt fest: gleiche Größe und Lage, egal was die Figur macht
      box3(a.x, a.y, b.x, b.y, -26, 26, sc, '#2f6fa8', '#244f78', '#1d4062'); c.fillStyle = 'rgba(255,255,255,.1)'; for (let i = 1; i < 4; i++) { const z = zOff(-26 + i * 13, sc); c.fillRect(a.x + z.x + 4, a.y + z.y, b.x - a.x - 8, 1.2); } }
    if (p.k === 'sbench') {
      const pad = -60, x0 = J.S.x - 50, x1 = J.H.x + 30, A = Wd({ x: x0, y: pad }), B = Wd({ x: x1, y: pad + 10 }), hw = 16;
      if (!Sc._noSpot && (wi >= 6 || Sc.vis.lastRep || (MK.S.partner && MK.S.partner.lv))) spotter(R, sc, wi);
      // Ablage (Hantelständer) am Kopfende
      [46, -46].forEach(d => { const base = Wd({ x: J.S.x - 6, y: 0 }), z = zOff(d, sc), top = Wd({ x: 0, y: -178 }).y; c.fillStyle = d > 0 ? '#4a4d55' : '#5a5d65'; c.fillRect(base.x + z.x - 3 * sc, top + z.y, 6 * sc, base.y - top); c.fillStyle = '#2a2a30'; c.fillRect(base.x + z.x - 7 * sc, top + z.y + 16 * sc, 12 * sc, 4 * sc); c.fillRect(base.x + z.x - 14 * sc, base.y + z.y - 4 * sc, 28 * sc, 4 * sc); });
      // Beine der Bank
      [[x0 + 24], [x1 - 16]].forEach(([xx]) => { const t = Wd({ x: xx, y: pad + 10 }), f = Wd({ x: xx, y: 0 }); c.fillStyle = '#55585f'; c.fillRect(t.x - 4 * sc, t.y, 8 * sc, f.y - t.y); const z1 = zOff(-hw, sc), z2 = zOff(hw, sc); c.strokeStyle = '#6d7076'; c.lineWidth = 5 * sc; c.beginPath(); c.moveTo(f.x + z1.x, f.y + z1.y - 2); c.lineTo(f.x + z2.x, f.y + z2.y - 2); c.stroke(); });
      box3(A.x, A.y, B.x, B.y, -hw, hw, sc, '#34343c', '#26262c', '#1c1c22'); c.fillStyle = 'rgba(255,255,255,.08)'; const zz = zOff(-hw, sc); c.fillRect(A.x + zz.x + 3, A.y + zz.y + 2, B.x - A.x - 6, 2);
    }
    if (p.k === 'sbar') sideBar(R, wi, sc, 'back', p.at);
  });
}
function drawSideFront(R, pose, wi, sc, ex) {
  (pose.props || []).forEach(p => { if (p.k === 'sbar') sideBar(R, wi, sc, 'front', p.at); });
  const hp = (pose.props || []).filter(p => p.k === 'phone' || p.k === 'bottle'); if (hp.length) drawHandProps(R, { props: hp }, wi, sc);
  // Zusatzgewicht: Scheibe auf der Brust (Crunch) oder auf dem Rücken (Plank, Liegestütze)
  if (ex && ex.kg === 'bw' && wi > 0 && R.kind !== 'bench') { const J = R.J, pl = platesFor(MK.WEIGHTS[wi], 1)[0] || { rad: 8, col: '#b8bcc2', th: 3 }, t = R.kind === 'crunch' ? .74 : .62;
    const sideN = R.kind === 'crunch' ? 1 : -1, q = J.ax(t), dd = 13 + R.D.gB * 6, pt = R.Wd({ x: q.x + J.n.x * dd * sideN, y: q.y + J.n.y * dd * sideN });
    // Hantelscheiben flach auf dem Rücken: von der Seite als Rechteck mit runden Kanten, gestapelt
    const pls = platesFor(MK.WEIGHTS[wi], 1).slice(0, 3); c.save(); c.translate(pt.x, pt.y); c.rotate(Math.atan2(J.u.y, J.u.x)); wrec(0, -8 * sc, 16 * sc); let off = 0;
    pls.forEach((q, i) => { const w = q.rad * 2 * sc, h = Math.max(4, q.th * 1.7 * sc), y0 = -sideN * off - (sideN > 0 ? 0 : h); const g = c.createLinearGradient(0, y0, 0, y0 + h); g.addColorStop(0, plMix(q.col, '#ffffff', .3)); g.addColorStop(.5, q.col); g.addColorStop(1, plMix(q.col, '#000000', .35));
      rrPath(-w / 2, y0, w, h, h * .45); c.fillStyle = g; c.fill(); c.strokeStyle = 'rgba(20,20,20,.85)'; c.lineWidth = 1; c.stroke(); c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(-2.5 * sc, y0, 5 * sc, h); off += h + .5; });
    c.restore(); }
}
/* ---------- Essen & Trinken: eigene Animation und eigenes Modell je Gericht ---------- */
const DRINKS = { shake: 1, energy: 1 }, BOWLS = { hafer: 'bowl', huhn: 'box', prep: 'box', quark: 'tub', lasagne: 'plate', steak: 'plate' };
Sc.eat = function (id) { const V = Sc.vis; V.eat = { id, p: 0, d: DRINKS[id] ? 2.4 : 3 }; V.idle = null; V.ph = -1; };
MK.Fig.poses.i_eat = (p, ph, D, x) => { const id = x.food, drink = !!DRINKS[id], two = !!BOWLS[id];
  const k = Math.sin(Math.min(1, p * 1.15) * Math.PI) ** .7, bite = drink ? 0 : Math.max(0, Math.sin(p * Math.PI * 6)) * .25 * k;
  const r = { t: [lerp(D.shH + 6, two ? 4 : 6, k), lerp(54, (drink ? -19 : -11) + bite * 16, k)], b: 'down', zf: .78 * k }; // Ellbogen zeigt nach unten zur Kamera – nie quer über die Brust oder nach oben
  const pose = { arms: { r }, head: { y: drink ? -2.5 * k : 1.5 * bite }, look: { x: 0, y: drink ? -k * .8 : .35 * k }, face: drink ? (k > .55 ? 'drink' : 'neutral') : (bite > .1 ? 'drink' : k > .4 ? 'proud' : 'neutral') };
  if (two) pose.arms.l = { t: [lerp(D.shH + 6, D.shH * .25 + 6, k), lerp(54, 22, k)], b: 'down', zf: .5 * k };
  pose.props = [{ k: 'food', food: id, h: 'r', tilt: drink ? k : 0, p, k2: k }]; if (two) pose.props.push({ k: 'dish', food: id, h: 'l', p, k2: k });
  return pose; };
function foodProp(pr, H, sc, R) { const h = H[pr.h], s = sc, id = pr.food, eaten = Math.min(3, Math.floor(pr.p * 6 / 2)); c.save(); c.translate(h.x, h.y); c.lineJoin = 'round';
  const out = (col, w) => { c.strokeStyle = col || 'rgba(20,16,12,.85)'; c.lineWidth = (w || 1.1) * s; c.stroke(); };
  if (pr.k === 'dish') { const kind = BOWLS[id]; c.translate(4 * s, -2 * s);
    if (kind === 'bowl') { c.fillStyle = '#e9e2d0'; c.beginPath(); c.ellipse(0, -2 * s, 15 * s, 4 * s, 0, 0, TAU); c.fill(); const g = c.createLinearGradient(0, -2 * s, 0, 10 * s); g.addColorStop(0, '#f6f2ea'); g.addColorStop(1, '#bfb6a2'); c.fillStyle = g; c.beginPath(); c.moveTo(-15 * s, -2 * s); c.quadraticCurveTo(-13 * s, 10 * s, 0, 10 * s); c.quadraticCurveTo(13 * s, 10 * s, 15 * s, -2 * s); c.closePath(); c.fill(); out();
      c.fillStyle = '#d9b874'; c.beginPath(); c.ellipse(0, -2.5 * s, 13 * s, 3.2 * s, 0, 0, TAU); c.fill(); c.fillStyle = '#b8443a'; [[-5, -3], [3, -2], [7, -3.5], [-1, -1.8]].forEach(([a, b]) => { c.beginPath(); c.arc(a * s, b * s, 1.4 * s, 0, TAU); c.fill(); }); c.fillStyle = '#3b5bd6'; c.beginPath(); c.arc(-8 * s, -2.4 * s, 1.3 * s, 0, TAU); c.fill(); }
    if (kind === 'box') { c.fillStyle = '#1d1e22'; c.beginPath(); c.roundRect(-17 * s, -6 * s, 34 * s, 14 * s, 3 * s); c.fill(); c.fillStyle = '#f2efe6'; c.beginPath(); c.roundRect(-15 * s, -5 * s, 15 * s, 8 * s, 2 * s); c.fill(); c.fillStyle = 'rgba(0,0,0,.08)'; for (let i = 0; i < 9; i++) c.fillRect((-14 + (i * 5) % 13) * s, (-4 + (i * 3) % 6) * s, 1.4 * s, .8 * s);
      c.fillStyle = '#d8a35a'; for (let i = 0; i < 3; i++) { c.beginPath(); c.roundRect((1 + i * 4.6) * s, (-5 + i * .3) * s, 4 * s, 7 * s, 1.5 * s); c.fill(); c.fillStyle = 'rgba(120,60,20,.6)'; c.fillRect((1.8 + i * 4.6) * s, -3 * s, 2.4 * s, .8 * s); c.fillStyle = '#d8a35a'; }
      c.fillStyle = '#2f8a3e'; [[-12, 3], [-7, 4]].forEach(([a, b]) => { c.beginPath(); c.arc(a * s, b * s, 2.4 * s, 0, TAU); c.fill(); }); }
    if (kind === 'tub') { const g = c.createLinearGradient(-9 * s, 0, 9 * s, 0); g.addColorStop(0, '#dfe5ec'); g.addColorStop(.5, '#ffffff'); g.addColorStop(1, '#c9d1da'); c.fillStyle = g; c.beginPath(); c.moveTo(-10 * s, -6 * s); c.lineTo(10 * s, -6 * s); c.lineTo(8 * s, 9 * s); c.lineTo(-8 * s, 9 * s); c.closePath(); c.fill(); out('rgba(40,60,90,.6)', .8);
      c.fillStyle = '#2f6fd1'; c.fillRect(-9 * s, -1 * s, 18 * s, 5 * s); c.fillStyle = '#fff'; c.font = `800 ${3.6 * s}px Arial`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('QUARK', 0, 1.6 * s); c.fillStyle = '#fbfbf7'; c.beginPath(); c.ellipse(0, -6 * s, 10 * s, 2.4 * s, 0, 0, TAU); c.fill(); }
    if (kind === 'plate') { c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(1 * s, 2 * s, 19 * s, 5 * s, 0, 0, TAU); c.fill(); const g = c.createRadialGradient(-4 * s, -2 * s, 1, 0, 0, 19 * s); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#d6d2c8'); c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, 18 * s, 4.6 * s, 0, 0, TAU); c.fill(); out('rgba(90,85,75,.6)', .8);
      if (id === 'lasagne') { const left = 1 - eaten * .22; c.save(); c.translate(-2 * s, -3 * s); for (let i = 0; i < 5; i++) { c.fillStyle = i % 2 ? '#c2412a' : '#f0c85a'; c.fillRect(-9 * s, (-i * 2.2) * s, 18 * s * left, 2.3 * s); } c.fillStyle = '#e8a33a'; c.fillRect(-9 * s, -11.5 * s, 18 * s * left, 1.6 * s); c.fillStyle = '#7a3a12'; for (let i = 0; i < 5; i++) c.fillRect((-8 + i * 3.6) * s * left, -11.6 * s, 1.4 * s, 1 * s); c.restore(); c.fillStyle = '#2f8a3e'; c.beginPath(); c.ellipse(11 * s, -1.5 * s, 2.4 * s, 1.4 * s, .4, 0, TAU); c.fill(); }
      if (id === 'steak') { const left = 1 - eaten * .2; c.save(); c.translate(-2 * s, -2.5 * s); c.fillStyle = '#5a2412'; c.beginPath(); c.ellipse(0, 0, 11 * s * left, 4 * s, -.1, 0, TAU); c.fill(); c.fillStyle = '#8a3a1c'; c.beginPath(); c.ellipse(-.5 * s, -.8 * s, 10 * s * left, 3 * s, -.1, 0, TAU); c.fill();
        c.strokeStyle = '#2a0f06'; c.lineWidth = 1 * s; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo((i * 3.4 - 2) * s * left, -3 * s); c.lineTo((i * 3.4 + 1) * s * left, 1.4 * s); c.stroke(); } c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.ellipse(-3 * s, -2 * s, 3 * s, .8 * s, 0, 0, TAU); c.fill(); c.restore();
        c.fillStyle = '#f2c230'; c.beginPath(); c.ellipse(11 * s, -1.5 * s, 3.4 * s, 1.6 * s, 0, 0, TAU); c.fill(); } }
    c.restore(); return; }
  // Hand-Seite: was zum Mund geht
  if (id === 'banane') { const left = 1 - eaten * .25; c.rotate(-1.1); const L = 26 * s * left;
    c.fillStyle = '#f2d23a'; c.beginPath(); c.moveTo(0, 2 * s); c.quadraticCurveTo(L * .5, -9 * s, L, -4 * s); c.quadraticCurveTo(L * .5, -2 * s, 0, 6 * s); c.closePath(); c.fill(); out('rgba(120,90,10,.8)', .9);
    c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.moveTo(3 * s, 1.5 * s); c.quadraticCurveTo(L * .5, -6.5 * s, L * .9, -4.5 * s); c.lineTo(L * .85, -5.8 * s); c.quadraticCurveTo(L * .5, -8 * s, 3 * s, .2 * s); c.fill();
    if (eaten) { c.fillStyle = '#fff6d6'; c.beginPath(); c.ellipse(L, -4 * s, 2.4 * s, 3 * s, .5, 0, TAU); c.fill(); [-1, 1].forEach(sd => { c.fillStyle = '#e8c22e'; c.beginPath(); c.moveTo(L * .7, -5 * s); c.quadraticCurveTo(L * .85 + sd * 3 * s, -11 * s + sd * 6 * s, L * .7 + sd * 8 * s, -2 * s + sd * 8 * s); c.lineTo(L * .65, -2 * s); c.closePath(); c.fill(); out('rgba(120,90,10,.7)', .7); }); }
    c.fillStyle = '#5a4220'; c.beginPath(); c.arc(-1 * s, 4 * s, 1.6 * s, 0, TAU); c.fill(); }
  else if (id === 'shake') { c.rotate(-.35 - pr.tilt * 2); const g = c.createLinearGradient(-6 * s, 0, 6 * s, 0); g.addColorStop(0, '#16171b'); g.addColorStop(.35, '#3a3d45'); g.addColorStop(1, '#0d0e11'); c.fillStyle = g; c.beginPath(); c.roundRect(-6 * s, -20 * s, 12 * s, 26 * s, 3 * s); c.fill();
    c.fillStyle = 'rgba(200,225,255,.35)'; c.fillRect(-4 * s, -14 * s, 8 * s, 15 * s); c.fillStyle = '#9a6a42'; const lvl = 1 - pr.p * .8; c.fillRect(-4 * s, (-14 + 15 * (1 - lvl)) * s, 8 * s, 15 * lvl * s); c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(-3.4 * s, -13 * s, 1.4 * s, 12 * s);
    c.fillStyle = '#d83a32'; c.beginPath(); c.roundRect(-6.5 * s, -24 * s, 13 * s, 5 * s, 1.5 * s); c.fill(); c.fillStyle = '#2a2b30'; c.fillRect(-2 * s, -27 * s, 4 * s, 3.5 * s); c.fillStyle = '#fff'; c.font = `900 ${3 * s}px Arial`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('WHEY', 0, 3 * s); }
  else if (id === 'energy') { c.rotate(-.35 - pr.tilt * 2.1); const g = c.createLinearGradient(-5 * s, 0, 5 * s, 0); g.addColorStop(0, '#0f2a1a'); g.addColorStop(.4, '#2affb0'); g.addColorStop(.6, '#18c27a'); g.addColorStop(1, '#0a3a24'); c.fillStyle = g; c.beginPath(); c.roundRect(-5 * s, -19 * s, 10 * s, 24 * s, 1.5 * s); c.fill();
    const m = c.createLinearGradient(-5 * s, 0, 5 * s, 0); m.addColorStop(0, '#8d939b'); m.addColorStop(.5, '#f2f4f6'); m.addColorStop(1, '#7c838c'); c.fillStyle = m; c.fillRect(-4.6 * s, -21 * s, 9.2 * s, 2.6 * s); c.fillRect(-4.6 * s, 4 * s, 9.2 * s, 2 * s);
    c.fillStyle = '#141414'; c.beginPath(); c.moveTo(1 * s, -15 * s); c.lineTo(-3 * s, -6 * s); c.lineTo(0, -6 * s); c.lineTo(-1 * s, 1 * s); c.lineTo(3 * s, -9 * s); c.lineTo(0, -9 * s); c.closePath(); c.fill(); }
  else { // Löffel / Gabel mit einem Bissen
    c.rotate(-.9); const fork = id === 'huhn' || id === 'prep' || id === 'lasagne' || id === 'steak', m = c.createLinearGradient(0, -1 * s, 0, 1 * s); m.addColorStop(0, '#f2f4f6'); m.addColorStop(1, '#8d939b');
    c.fillStyle = m; c.fillRect(-2 * s, -.9 * s, 18 * s, 1.8 * s);
    if (fork) { [-2, 0, 2].forEach(o => c.fillRect(16 * s, (o - .4) * s, 6 * s, .9 * s)); } else { c.beginPath(); c.ellipse(19 * s, 0, 4.4 * s, 2.8 * s, 0, 0, TAU); c.fill(); }
    if (pr.k2 > .5 && Math.sin(pr.p * Math.PI * 6) < .6) { const col = { hafer: '#d9b874', quark: '#fbfbf7', huhn: '#d8a35a', prep: '#d8a35a', lasagne: '#c2412a', steak: '#8a3a1c' }[id] || '#d9b874'; c.fillStyle = col; c.beginPath(); c.ellipse(20 * s, -1.6 * s, 3.6 * s, 2.4 * s, 0, 0, TAU); c.fill(); out('rgba(0,0,0,.35)', .6); } }
  c.restore(); }
const propLayer = (p, pose) => p.k === 'jumprope' ? ((((p.ph % 1) + 1) % 1) >= .5 ? 'back' : 'front') : (pose.armsBehind && (p.k === 'db' || p.k === 'bar')) ? 'back' : 'front';
function drawHandProps(R, pose, wi, sc, layer) {
  const kg = MK.WEIGHTS[Math.max(0, Math.min(MK.WEIGHTS.length - 1, wi))], col = kg;
  (pose.props || []).forEach(p => { if (layer && propLayer(p, pose) !== layer) return;
    const H = R.ha;
    if (p.k === 'dbfloor') { const fy = Sc.geo().py, ft = R.foot || { l: { x: R.hip.x - 20 * sc }, r: { x: R.hip.x + 20 * sc } }, x = p.h === 'c' ? (ft.l.x + ft.r.x) / 2 : ft[p.h].x + (p.h === 'l' ? -26 : 26) * sc; dumbbell(x, fy - 5 * sc, sc, col, false, p.big); return; }
    if (p.k === 'db' && R.lie) { dumbbell(H[p.h].x, H[p.h].y, sc * (R.hs[p.h] || 1), kg, p.o !== 'v', p.big); return; }
    if (p.k === 'db') { if (p.h === 'c') dumbbell((H.l.x + H.r.x) / 2, (H.l.y + H.r.y) / 2 + 2 * sc, sc, col, p.o === 'v', p.big); else dumbbell(H[p.h].x, H[p.h].y + 2 * sc, sc * (R.hs[p.h] || 1), col, p.o === 'v', p.big); }
    if (p.k === 'bar' && R.lie) { const a = Math.atan2(H.r.y - H.l.y, H.r.x - H.l.x), d = Math.hypot(H.r.x - H.l.x, H.r.y - H.l.y), mx = (H.l.x + H.r.x) / 2, my = (H.l.y + H.r.y) / 2, hs = ((R.hs.l || 1) + (R.hs.r || 1)) / 2;
      c.save(); c.translate(mx, my); c.rotate(a); barbell(-d / 2, 0, d / 2, 0, sc * hs, kg, p.w * 60); c.restore(); return; }
    if (p.k === 'bar') { if (p.at === 'neck') barbell(R.sh.l.x - 30 * sc, R.neck.y - 4 * sc, R.sh.r.x + 30 * sc, R.neck.y - 4 * sc, sc, kg, 0, Math.min(1, kg / 45) * 4 * sc);
      else { const big = (platesFor(kg, 1)[0] || { rad: 8 }).rad * sc, fy = Sc.geo().py - big - 1; let y = H.l.y + 2 * sc; if (p.floor && y > fy) y = fy;
        barbell(H.l.x, y, H.r.x, y, sc, kg, p.w * 60, p.bend != null ? Math.min(1, kg / 40) * 7 * sc * clamp(p.bend * 1.5, 0, 1) : 0); } }
    if (p.k === 'latbar') { c.fillStyle = '#7a7d84'; c.fillRect(H.l.x - 30 * sc, H.l.y - 2 * sc, H.r.x - H.l.x + 60 * sc, 4 * sc); }
    if (p.k === 'cable') { circ(H[p.h].x, H[p.h].y + 2 * sc, 5 * sc, '#2a2a2e'); }
    if (p.k === 'flymachine') ['l', 'r'].forEach(h => { c.fillStyle = '#1d1e22'; c.beginPath(); c.roundRect(H[h].x - 3.5 * sc, H[h].y - 16 * sc, 7 * sc, 30 * sc, 3 * sc); c.fill(); c.fillStyle = 'rgba(255,255,255,.15)'; c.fillRect(H[h].x - 2 * sc, H[h].y - 14 * sc, 1.5 * sc, 26 * sc); });
    if (p.k === 'rope') { c.strokeStyle = '#2a2a2e'; c.lineWidth = 3 * sc; c.beginPath(); c.moveTo(H[p.h].x, H[p.h].y); c.lineTo(H[p.h].x + (p.h === 'l' ? 6 : -6) * sc, H[p.h].y + 12 * sc); c.stroke(); }
    if (p.k === 'jumprope') { const ph = p.ph, up = Math.cos(ph * TAU); const top = R.top.y - 20 * sc, bot = R.foot.l.y + 4 * sc, y = lerp(bot, top, (up + 1) / 2);
      c.strokeStyle = 'rgba(30,30,30,.85)'; c.lineWidth = 2; c.beginPath(); c.moveTo(H.l.x, H.l.y); c.quadraticCurveTo((H.l.x + H.r.x) / 2, y + (y - H.l.y) * .4, H.r.x, H.r.y); c.stroke(); circ(H.l.x, H.l.y, 3 * sc, '#d83a32'); circ(H.r.x, H.r.y, 3 * sc, '#d83a32'); }
    if (p.k === 'food' || p.k === 'dish') { foodProp(p, H, sc, R); return; }
    if (p.k === 'bottle') { const h = H[p.h]; c.save(); c.translate(h.x, h.y); c.rotate(-.3 - p.tilt * 2.2); c.fillStyle = 'rgba(80,170,255,.85)'; c.fillRect(-4 * sc, -16 * sc, 8 * sc, 22 * sc); c.fillStyle = '#222'; c.fillRect(-3 * sc, -20 * sc, 6 * sc, 5 * sc); c.restore(); }
    if (p.k === 'towel') { const h = H[p.h]; ell(h.x, h.y - 2 * sc, 10 * sc, 6 * sc, '#f1efe9'); c.fillStyle = '#d83a32'; c.fillRect(h.x - 8 * sc, h.y + 1 * sc, 16 * sc, 2 * sc); }
    if (p.k === 'phone' && p.flat) { const h = H[p.h]; c.fillStyle = '#16161a'; c.fillRect(h.x - 9 * sc, h.y - 4 * sc, 18 * sc, 5 * sc); c.fillStyle = 'rgba(120,190,255,.9)'; c.fillRect(h.x - 8 * sc, h.y + .5 * sc, 16 * sc, 1.6 * sc); return; }
    if (p.k === 'phone') { const h = H[p.h]; c.fillStyle = '#16161a'; c.fillRect(h.x - 5 * sc, h.y - 10 * sc, 10 * sc, 16 * sc); c.fillStyle = 'rgba(120,190,255,.85)'; c.fillRect(h.x - 4 * sc, h.y - 9 * sc, 8 * sc, 13 * sc); }
  });
}

/* ======================================================================
   EFFEKTE
   ====================================================================== */
Sc.particle = function (k, x, y, n) {
  if (MK.S.set.quality === 'niedrig' && k !== 'confetti') n = Math.ceil((n || 1) / 3);
  for (let i = 0; i < (n || 1); i++) {
    const p = { k, x, y, vx: rnd(-1, 1), vy: rnd(-2, -.5), life: 1, r: rnd(2, 4), rot: rnd(0, 6), col: '#fff' };
    if (k === 'chalk') { p.vx = rnd(-1.5, 1.5); p.vy = rnd(-1.2, -.2); p.r = rnd(3, 8); }
    if (k === 'sweat') { p.vx = rnd(-1.5, 1.5); p.vy = rnd(-2.5, -1); p.col = '#9fd3ff'; }
    if (k === 'confetti') { p.vx = rnd(-3, 3); p.vy = rnd(-6, -2); p.col = pick(['#ffd23f', '#ee4035', '#3a86ff', '#2bb673', '#ff8fb1', '#ffffff']); p.r = rnd(3, 6); }
    if (k === 'coin') { p.vx = rnd(-2.4, 2.4); p.vy = rnd(-4.5, -2); p.col = '#3fa860'; }
    if (k === 'spark') { const a = rnd(0, TAU), sp = rnd(2, 6); p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp; p.col = pick(['#ffd23f', '#ff8a3d', '#ffffff']); p.r = rnd(1.5, 3); }
    if (k === 'note') { p.vx = rnd(-.3, .3); p.vy = -.6; p.col = '#2affb0'; }
    if (k === 'fire') { p.vx = rnd(-.6, .6); p.vy = rnd(-2.2, -1); p.col = pick(['#ff4d2e', '#ff8a3d', '#ffd23f']); p.r = rnd(3, 6); }
    Sc.fx.parts.push(p);
  }
};
Sc.pop = function (txt, x, y, opt) { const near = Sc.fx.pops.filter(p => !p.word && (p.age || 0) < .3 && Math.abs(p.x - x) < 70 && Math.abs((p.y0 != null ? p.y0 : p.y) - y) < 30).length; if (Sc.fx.pops.length > 60) Sc.fx.pops.splice(0, Sc.fx.pops.length - 60);
  Sc.fx.pops.push(Object.assign({ txt, x: x + (near % 2 ? 18 : -18) * Math.min(1, near), y: y - near * 22, life: 1, word: false, col: '#ffd23f', rot: rnd(-.2, .2) }, opt || {})); };
Sc.burst = function (txt, col) { const G = Sc.geo(); Sc.fx.pops.push({ txt, x: G.px + (Math.random() < .5 ? -1 : 1) * rnd(90, Math.max(100, W * .3)), y: rnd(H * .18, H * .42), life: 1, word: true, col: col || pick(['#ffd23f', '#ee4035', '#3a86ff', '#2bb673']), rot: rnd(-.25, .25) }); };
Sc.say = function (who, txt, dur) {
  if (!txt) return; const B = Sc.fx.bubbles; if (B.length >= 1) B.shift();
  B.push({ who, txt, life: dur || 4.5, max: dur || 4.5 });
};
function speakerPos(who) {
  if (who === 'player') { const G = Sc.geo(); return { x: G.px, y: Sc.lastPlayer ? Sc.lastPlayer.top.y : H * .2 }; }
  if (typeof who === 'number' && Sc.crowd[who]) { const p = Sc.crowd[who]; return p.topW ? { x: p.topW.x, y: p.topW.y } : { x: p.x, y: p.y - 300 * p.k }; }
  if (who === 'stageCrowd') return { x: W * (.2 + (Sc.fx.bubbles.length % 3) * .3), y: H * .8 };
  if (who === 'partner' && Sc.partnerTop) return Sc.partnerTop;
  if (Sc.npcPos[who]) return Sc.npcPos[who];
  return { x: W * .5, y: H * .15 };
}
function drawBubbles(dt) {
  const B = Sc.fx.bubbles; c.font = `700 ${Math.max(11, Math.min(14, H * .032))}px "Comic Neue", "Comic Sans MS", sans-serif`;
  B.forEach((b, i) => {
    b.life -= dt; const p = speakerPos(b.who); const a = Math.min(1, b.life * 2, (b.max - b.life) * 4);
    const maxW = Math.min(230, W * .5), words = b.txt.split(' '), lines = []; let ln = '';
    words.forEach(w => { const t = ln ? ln + ' ' + w : w; if (c.measureText(t).width > maxW) { lines.push(ln); ln = w; } else ln = t; }); lines.push(ln);
    const lh = Math.max(13, Math.min(17, H * .038)), bw = Math.max(...lines.map(l => c.measureText(l).width)) + 18, bh = lines.length * lh + 10;
    let bx = clamp(p.x - bw / 2, 6, W - bw - 6), by = clamp(p.y - bh - 16 - i * 4, 6, H - bh - 30);
    c.globalAlpha = Math.max(0, a);
    c.fillStyle = '#ffffff'; c.strokeStyle = '#141414'; c.lineWidth = 2.5;
    c.beginPath(); c.roundRect(bx, by, bw, bh, 10); c.fill(); c.stroke();
    const tx = clamp(p.x, bx + 14, bx + bw - 14); c.beginPath(); c.moveTo(tx - 7, by + bh - 1); c.lineTo(tx + 1, by + bh + 12); c.lineTo(tx + 7, by + bh - 1); c.fill(); c.beginPath(); c.moveTo(tx - 7, by + bh); c.lineTo(tx + 1, by + bh + 12); c.lineTo(tx + 7, by + bh); c.stroke();
    c.fillStyle = '#141414'; c.textAlign = 'left'; c.textBaseline = 'top'; lines.forEach((l, j) => c.fillText(l, bx + 9, by + 6 + j * lh));
    c.globalAlpha = 1;
  });
  Sc.fx.bubbles = B.filter(b => b.life > 0);
}
function drawParts(dt) {
  const P = Sc.fx.parts;
  P.forEach(p => {
    p.x += p.vx * dt * 60; p.y += p.vy * dt * 60; p.life -= dt * (p.k === 'breath' ? 1.3 : p.k === 'chalk' ? .9 : p.k === 'confetti' ? .35 : p.k === 'gconf' ? .55 : p.k === 'ring' ? 2.4 : p.k === 'dust' ? 1.1 : p.k === 'gstar' ? 1.6 : .8); p.rot += dt * 5;
    if (p.k === 'sweat' || p.k === 'coin' || p.k === 'confetti') p.vy += dt * 9; if (p.k === 'chalk') { const f = Math.exp(-dt * 1.8); p.vx *= f; p.vy *= f; p.r += dt * 6; }
    if (p.k === 'gconf') { const f = Math.exp(-dt * 1.4); p.vx *= f; p.vy = p.vy * f + dt * 11; p.rot += dt * 7; }
    if (p.k === 'gstar') { const f = Math.exp(-dt * 3.2); p.vx *= f; p.vy = p.vy * f + dt * 3; }
    if (p.k === 'dust') { const f = Math.exp(-dt * 2.4); p.vx *= f; p.vy *= f; p.r += dt * 14; }
    c.globalAlpha = Math.max(0, p.life);
    if (p.k === 'ring') { const u = 1 - p.life, e = 1 - Math.pow(1 - u, 3), r = p.r + (p.R - p.r) * e; c.strokeStyle = `rgba(${p.col},${p.life * .7})`; c.lineWidth = 2 + p.life * 5; c.beginPath(); if (p.round) c.arc(p.x, p.y, r, 0, TAU); else c.ellipse(p.x, p.y, r, r * .22, 0, 0, TAU); c.stroke(); return; }
    if (p.k === 'breath') { p.r += dt * 16; c.fillStyle = `rgba(255,255,255,${p.life * .3})`; c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.fill(); return; }
    if (p.k === 'dust') { c.fillStyle = 'rgba(205,195,180,.32)'; c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.fill(); return; }
    if (p.k === 'gconf') { c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.scale(1, Math.cos(p.rot * 1.7)); c.fillStyle = p.col; c.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); c.restore(); return; }
    if (p.k === 'gstar') { c.save(); c.globalCompositeOperation = 'lighter'; star4(p.x, p.y, p.r * (.4 + p.life * .6), `rgba(255,240,180,${p.life})`); c.restore(); return; }
    if (p.k === 'chalk') { c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.fill(); }
    else if (p.k === 'confetti') { c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.fillStyle = p.col; c.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); c.restore(); }
    else if (p.k === 'coin') { MK.Art.drawBill(c, p.x, p.y, 19, Math.sin(p.rot * .7) * .5, Math.cos(p.rot * 1.3)); } // Geld fliegt als Schein
    else if (p.k === 'note') { c.fillStyle = p.col; c.font = '700 14px Arial'; c.fillText('♪', p.x, p.y); }
    else if (p.k === 'sweat') { c.fillStyle = p.col; c.beginPath(); c.ellipse(p.x, p.y, p.r * .7, p.r, 0, 0, TAU); c.fill(); }
    else { c.fillStyle = p.col; c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.fill(); }
  });
  c.globalAlpha = 1;
  Sc.fx.parts = P.filter(p => p.life > 0 && p.y < H + 20);
  if (Sc.fx.parts.length > 300) Sc.fx.parts.splice(0, Sc.fx.parts.length - 300);
}
function star(x, y, r, col) { c.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, rr = i % 2 ? r * .62 : r; c.lineTo(x + Math.cos(a) * rr * 1.25, y + Math.sin(a) * rr); } c.closePath(); c.fillStyle = col; c.fill(); c.lineWidth = 3; c.strokeStyle = '#141414'; c.stroke(); }
const popIn = u => { u = clamp(u, 0, 1); const c1 = 2.2, c3 = c1 + 1; return u <= 0 ? .3 : .3 + .7 * (1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2)); }; // klein → kurz zu groß → normal
function drawPops(dt) {
  const P = Sc.fx.pops; c.textAlign = 'center'; c.textBaseline = 'middle';
  P.forEach(p => {
    p.life -= dt * (p.word ? .9 : 1.25); p.age = (p.age || 0) + dt; if (p.y0 == null) p.y0 = p.y;
    const pin = popIn(p.age / (p.word ? .26 : .2));
    if (p.word) p.y = p.y0 - (1 - Math.exp(-p.age * 2.2)) * 26; else p.y = p.y0 - (1 - Math.exp(-p.age * 3.4)) * 74;
    c.globalAlpha = clamp(p.life * 2.6, 0, 1) * clamp(p.age / .06, 0, 1);
    if (p.word) { c.save(); c.translate(p.x, p.y); c.rotate(p.rot * (1.6 - .6 * Math.min(1, p.age * 4))); const s2 = pin * (1 + Math.max(0, p.age - .26) * .12) * .66; c.scale(s2, s2); star(0, 0, 40, p.col); c.font = '30px Bangers, Impact, sans-serif'; c.lineWidth = 5; c.strokeStyle = '#141414'; c.strokeText(p.txt, 0, 2); c.fillStyle = '#fff'; c.fillText(p.txt, 0, 2); c.restore(); }
    else { c.save(); c.translate(p.x, p.y); c.scale(pin, pin); c.font = `${p.big ? 30 : 22}px Bangers, Impact, sans-serif`; c.lineWidth = 4; c.strokeStyle = '#141414'; c.strokeText(p.txt, 0, 0); c.fillStyle = p.col; c.fillText(p.txt, 0, 0); c.restore(); }
  });
  c.globalAlpha = 1;
  Sc.fx.pops = P.filter(p => p.life > 0);
}

/* Bonus-Gegenstände */
const TGT = [
  { k: 'protein', w: 30, name: 'Proteinflasche', col: '#3a86ff' }, { k: 'coin', w: 30, name: 'Geldbündel', col: '#3fa860' },
  { k: 'star', w: 18, name: 'XP-Stern', col: '#ff8a3d' }, { k: 'towel', w: 15, name: 'Handtuch', col: '#f1efe9' }, { k: 'dia', w: 0, name: 'Diamant', col: '#7fe3ff' }
];
Sc.spawnTarget = function (kind) { const tw = TGT.reduce((a, t) => a + t.w, 0); let r = Math.random() * tw, T = TGT[0]; for (const t of TGT) { r -= t.w; if (r <= 0) { T = t; break; } } if (kind) T = TGT.find(t => t.k === kind) || T;
  Sc.fx.targets.push({ T, x: rnd(W * .12, W * .88), y: rnd(H * .18, H * .55), life: 8, ph: rnd(0, 6) }); };
function drawTargets(dt, t) {
  Sc.fx.targets.forEach(g => {
    g.life -= dt; const y = g.y + Math.sin(t * 3 + g.ph) * 6, s = Math.min(1, (8 - g.life) * 4) * (g.life < 1.5 ? .6 + Math.sin(t * 20) * .4 : 1);
    c.save(); c.translate(g.x, y); c.scale(s, s);
    const gl = c.createRadialGradient(0, 0, 2, 0, 0, 30); gl.addColorStop(0, 'rgba(255,255,255,.75)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gl; c.beginPath(); c.arc(0, 0, 30, 0, TAU); c.fill();
    const k = g.T.k;
    if (k === 'protein') { c.fillStyle = '#3a86ff'; c.beginPath(); c.roundRect(-9, -14, 18, 26, 4); c.fill(); c.fillStyle = '#f1efe9'; c.fillRect(-9, -4, 18, 8); c.fillStyle = '#222'; c.fillRect(-6, -19, 12, 6); }
    if (k === 'coin') { MK.Art.drawBundle(c, 0, 0, 34, t); }
    if (k === 'star') { c.fillStyle = '#ff8a3d'; c.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU - Math.PI / 2, r = i % 2 ? 6 : 14; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.fill(); c.fillStyle = '#fff'; c.font = '700 8px Arial'; c.textAlign = 'center'; c.fillText('XP', 0, 3); }
    if (k === 'towel') { c.fillStyle = '#f1efe9'; c.beginPath(); c.roundRect(-14, -9, 28, 18, 3); c.fill(); c.fillStyle = '#d83a32'; c.fillRect(-14, 4, 28, 3); }
    if (k === 'dia') { c.fillStyle = '#7fe3ff'; c.beginPath(); c.moveTo(0, -14); c.lineTo(12, -3); c.lineTo(0, 14); c.lineTo(-12, -3); c.closePath(); c.fill(); c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.moveTo(0, -14); c.lineTo(5, -3); c.lineTo(-5, -3); c.fill(); }
    c.restore(); g.dy = y;
  });
  Sc.fx.targets = Sc.fx.targets.filter(g => g.life > 0);
}
Sc.hitTarget = function (x, y) { const T = Sc.fx.targets; for (let i = 0; i < T.length; i++) { const g = T[i]; if (Math.hypot(g.x - x, (g.dy || g.y) - y) < 34) { T.splice(i, 1); return g; } } return null; };

/* ======================================================================
   SPIELER-PARAMETER
   ====================================================================== */
/* Flüssiges Wachstum: Anzeige folgt Level + XP-Anteil weich, dazu kurzer Pump im trainierten Muskel */
Sc.updateBody = function (dt) {
  const V = Sc.vis, ex = MK.lvExact(); V.disp = V.disp || {}; V.dv = V.dv || {}; V.pump = V.pump || {};
  if (V.growHold) { for (const k in ex) { V.disp[k] = V.growHold[k] != null ? V.growHold[k] : ex[k]; V.dv[k] = 0; } return; }
  const slow = V.grow && performance.now() < V.grow, st = slow ? 18 : 55, dm = slow ? 5.6 : 10.5, n = Math.max(1, Math.ceil(dt / .016)), h = dt / n;
  for (const k in ex) { const cur = V.disp[k];
    if (cur == null || (!slow && Math.abs(cur - ex[k]) > 25)) { V.disp[k] = ex[k]; V.dv[k] = 0; }
    else for (let i = 0; i < n; i++) { V.dv[k] = (V.dv[k] || 0) + ((ex[k] - V.disp[k]) * st - (V.dv[k] || 0) * dm) * h; V.disp[k] += V.dv[k] * h; }
    V.pump[k] = Math.max(0, (V.pump[k] || 0) - dt * .06); }
};
Sc.playerOpts = function (pose, t) {
  const S = MK.S, V = Sc.vis, lv = V.disp ? Object.assign({}, V.disp) : MK.lvExact();
  const sp = S.sponsor ? MK.SPONSORS.find(x => x.id === S.sponsor) : null;
  let face = null;
  if (V.face && performance.now() < V.faceUntil) face = V.face;
  else if (V.ph < 0 && !V.idle && S.sweat > .85) face = 'tired';
  // Anstrengung: wie schwer ist das Gewicht für dich, wie müde bist du, wackelt es?
  const ex = MK.curEx(); let ratio = 0, unsafe = 0;
  if (ex && MK.exOpen(ex) && ex.kg !== 'cardio') { const wi = MK.wCur(ex), mx = Math.max(1, MK.wMax(ex)); ratio = ex.kg === 'bw' ? .35 + wi / mx * .4 : wi / mx; unsafe = MK.unsafe && MK.unsafe(ex) ? .2 : 0; }
  const la = Math.max(0, 1 - MK.totalLv() / 45), exert = Math.min(1, ratio * .7 + (V.fatigue || 0) * .45 + unsafe + la * .25 + (V.lastRep ? .35 : 0) + (V.intens || 0) * .35);
  const L = MK.Fig.resolveLook(MK.lookView ? MK.lookView() : S.look); L.tats = MK.tatsView ? MK.tatsView() : MK.tatsOn();
  const sfx = MK.labSide ? MK.labSide() : null; if (sfx && sfx.synth) { lv.arme = (lv.arme || 1) + 32; lv.schulter = (lv.schulter || 1) + 12; } // Synthol: Arme sofort riesig
  let pump = V.pump; if (ex && V.flex) { pump = Object.assign({}, V.pump); const fx = V.flex * (.55 + Math.min(.5, ratio * .5)); pump[ex.g] = (pump[ex.g] || 0) + fx; if (ex.g === 'brust' || ex.g === 'schulter') pump.arme = (pump.arme || 0) + fx * .35; }
  return { key: 'player', lv, pump, sfx, L, pose, posture: MK.rankIdx() / 10, breath: (V.pantUntil && performance.now() < V.pantUntil) ? Math.sin(t * 16) * 1.6 : Math.sin(t * 1.6), sweat: S.sweat, shine: Math.max(S.sweat * .8, S.beastOn > 0 ? .6 : 0),
    glow: S.beastOn > 0 ? .8 + Math.sin(t * 8) * .2 : 0, blink: V.blink, face, sponsor: sp ? sp.logo : null, exert,
    flush: Math.min(1, S.pump * .45 + (V.intens || 0) * .45 + (S.beastOn > 0 ? .35 : 0) + (V.ph >= 0 ? exert * .3 : 0) + (sfx && sfx.red ? sfx.red * .6 : 0)), fatAdd: MK.fatAdd ? MK.fatAdd() : 0, strain: MK.strainG ? MK.strainG() : null };
};
const STATIC = { flySit: 1, benchLie: 1, flyLie: 1, crunchLie: 1, twistSit: 1, dbpressSit: 1, latpull: 1, hack: 1, plank: 1, pushup: 1, pushupEng: 1, pushupClap: 1 }; // Übungen im Liegen/Sitzen: kein Aufstehen zwischendurch
function tremor(p, k, t) { const j = Math.sin(t * 47) * 1.8 * k + Math.sin(t * 31) * k;
  if (p.side) { ['n', 'f'].forEach(s => { const a = p.side.arms && p.side.arms[s]; if (a) a.hand = { x: a.hand.x + j * .7, y: a.hand.y + j }; }); return; }
  if (p.arms) Object.values(p.arms).forEach(a => { if (a.t) a.t = [a.t[0] + j * .6, a.t[1] + j]; else if (a.w) a.w = [a.w[0] + j * .6, a.w[1] + j]; else if (a.a) a.a = [a.a[0] + j * .012, a.a[1] + j * .02]; }); }
Sc.isStatic = () => { const ex = MK.curEx(); return !!(ex && MK.exOpen(ex) && STATIC[ex.anim]); };

/* ---------- Ruhe: Startposition der Übung halten, Pausen-Animationen aus genau dieser Position ---------- */
const TWO_HAND = { bar: 1, latbar: 1, rope: 1, cable: 1, hack: 1, rack: 1, flymachine: 1, jumprope: 1, harness: 1 };
Sc.idleClass = pose => {
  if (!pose) return 'stand';
  if (pose.side) return { bench: 'bench', crunch: 'crunch', plank: 'plank', push: 'plank' }[pose.side.kind] || 'plank';
  if (pose.mode === 'hang') return (pose.props || []).some(p => p.k === 'dipbars') ? 'support' : 'hang';
  if ((pose.props || []).some(p => TWO_HAND[p.k])) return 'locked';
  if (pose.mode === 'sit' || (pose.legs && pose.legs.l && pose.legs.l.d > .8)) return 'sit';
  return 'stand';
};
const IDLE_POOL = {
  stand: ['i_look', 'i_drink', 'i_towel', 'i_stretch', 'i_phone', 'i_flexpeek', 'i_shake', 'i_neck', 'i_scratch', 'i_selfie'],
  tired: ['i_yawn', 'i_towel', 'i_drink', 'i_shake'],
  sit: ['i_drink', 'i_phone', 'i_look', 'i_neck', 'i_scratch', 'i_towel', 'i_selfie'],
  locked: ['i_look', 'i_neck', 'x_breathe'],
  hang: ['h_phone', 'h_drink', 'h_swing', 'h_look', 'h_wave'],
  support: ['h_swing', 'h_look', 'x_breathe'],
  bench: ['l_phone', 'l_phone', 'l_stretch', 'l_drink', 'l_look'],
  crunch: ['c_phone', 'c_phone', 'c_stretch', 'l_look'],
  plank: ['p_look', 'p_shake', 'p_look']
};
Sc.idlePool = (cls, tired) => (tired && (cls === 'stand' || cls === 'sit') ? IDLE_POOL.tired : IDLE_POOL[cls] || IDLE_POOL.stand);
const ease = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
const envOf = p => ease(Math.min(p / .18, (1 - p) / .18, 1));
const lp = (a, b, k) => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k });
const torsoL = D => D.torso * .84 - D.slump * 3;
function sideArms(base, fn, env) { // neue Handziele für die Seitenansicht, weich eingeblendet
  const sd = Object.assign({}, base.side), arms = {};
  ['n', 'f'].forEach(k => { const a = sd.arms[k], tg = fn(k, a); arms[k] = tg ? Object.assign({}, a, { hand: lp(a.hand, tg.hand, env), pref: env > .5 && tg.pref ? tg.pref : a.pref, grip: tg.grip != null ? a.grip + (tg.grip - a.grip) * env : a.grip, uz: (a.uz || 0) * (1 - env) }) : a; });
  sd.arms = arms; return sd;
}
function applyIdle(base, id, p, D) {
  const env = envOf(p), out = Object.assign({}, base); out.face = 'neutral';
  const k1 = ease(Math.sin(p * Math.PI) * 1.6); // für Trinken/Schauen: in der Mitte am stärksten
  if (id.startsWith('i_') || id === 'x_breathe') { // Ruhe-Animation im Stehen/Sitzen, mit der Startposition verschmolzen
    if (id === 'x_breathe') { out.shrug = (base.shrug || 0) + Math.max(0, Math.sin(p * Math.PI * 3)) * .35 * env; out.head = { y: -Math.max(0, Math.sin(p * Math.PI * 3)) * 1.5 }; out.face = Math.sin(p * Math.PI * 3) > .6 ? 'blink' : 'neutral'; return out; }
    const ip = MK.Fig.poses[id](p, p, D, {});
    if (ip.arms) { out.arms = Object.assign({}, base.arms || {}); const freed = [];
      for (const k in ip.arms) { out.arms[k] = { blend: { a: (base.arms || {})[k] || null, b: ip.arms[k], k: env } }; freed.push(k); }
      out.props = (base.props || []).map(pr => pr.k === 'db' && (freed.includes(pr.h) || pr.h === 'c') && env > .3 ? Object.assign({}, pr, { k: 'dbfloor' }) : pr).concat(ip.props || []);
      out.armsBehind = false; }
    else out.props = (base.props || []).concat(ip.props || []);
    if (ip.head) out.head = ip.head; if (ip.look) out.look = ip.look; if (ip.face) out.face = ip.face;
    if (!base.mode && !base.legs) { if (ip.toe) out.toe = ip.toe; if (ip.footY) out.footY = ip.footY; }
    return out; }
  if (id.startsWith('h_')) { // hängend an der Stange / gestützt am Barren
    const A = base.arms || {}, sw = Math.sin(p * Math.PI * 2 * 1.5);
    if (id === 'h_phone') { out.arms = Object.assign({}, A, { r: { blend: { a: A.r, b: { t: [16, 4], b: 'down', zf: .4 }, k: env } } }); out.props = (base.props || []).concat(env > .45 ? [{ k: 'phone', h: 'r' }] : []); out.look = { x: 0, y: .75 * env }; out.head = { y: 2.5 * env }; out.bodyX = sw * 2.2 * env; }
    if (id === 'h_drink') { const kk = ease(Math.min(1, Math.max(0, (p - .2) / .25)) * Math.min(1, Math.max(0, (.85 - p) / .2))); out.arms = Object.assign({}, A, { r: { blend: { a: A.r, b: { t: [lerp(16, 7, kk), lerp(10, -24, kk)], b: 'down', zf: .55 * kk }, k: env } } }); out.props = (base.props || []).concat(env > .45 ? [{ k: 'bottle', h: 'r', tilt: kk }] : []); out.look = { x: 0, y: -kk }; out.face = kk > .6 ? 'drink' : 'neutral'; out.bodyX = sw * 1.5 * env; }
    if (id === 'h_wave') { out.arms = Object.assign({}, A, { l: { blend: { a: A.l, b: { t: [42 + Math.sin(p * 28) * 8, -46], b: 'out' }, k: env } } }); out.look = { x: -1, y: 0 }; out.face = 'proud'; out.bodyX = -sw * 2 * env; }
    if (id === 'h_swing') { out.raise = (base.raise || 0) + (Math.sin(p * Math.PI * 4) * .5 + .5) * .3 * env; out.look = { x: Math.sin(p * Math.PI * 2) > 0 ? 1 : -1, y: 0 }; }
    if (id === 'h_look') { const x = Math.sin(p * Math.PI * 2); out.head = { x: x * 2 }; out.look = { x: x > .3 ? 1 : x < -.3 ? -1 : 0, y: 0 }; }
    return out; }
  if (base.side && (id.startsWith('l_') || id.startsWith('c_'))) { // Rücken auf Bank oder Matte
    const sd = base.side; let S = sd.S; if (!S) { const L = torsoL(D); S = { x: sd.hip.x + Math.cos(sd.ang) * L, y: sd.hip.y + Math.sin(sd.ang) * L }; }
    const reach = (D.U + D.F) * .82;
    if (id === 'l_phone' || id === 'c_phone') { const wob = Math.sin(p * 9) * 1.2; out.side = sideArms(base, k => ({ hand: { x: S.x - 16 + (k === 'f' ? 3 : 0), y: S.y - reach * .66 + wob }, pref: { x: .25, y: 1 }, grip: 3 }), env); out.props = (base.props || []).map(pr => pr.k === 'sbar' ? Object.assign({}, pr, { at: { x: S.x - 6, y: -164 } }) : pr).concat(env > .4 ? [{ k: 'phone', h: 'r', flat: 1 }] : []); out.look = { x: 0, y: -1 }; out.headTilt = 0; out.armsBehind = false; }
    if (id === 'l_stretch' || id === 'c_stretch') { out.side = sideArms(base, k => ({ hand: { x: S.x - reach * 1.05 - (k === 'f' ? 4 : 0), y: S.y - 6 }, pref: { x: .2, y: -1 }, grip: 6 }), env); out.props = (base.props || []).map(pr => pr.k === 'sbar' ? Object.assign({}, pr, { at: { x: S.x - 6, y: -164 } }) : pr); out.face = env > .6 ? 'yawn' : 'neutral'; out.armsBehind = false; }
    if (id === 'l_drink') { const kk = ease(Math.min(1, Math.max(0, (p - .25) / .2)) * Math.min(1, Math.max(0, (.8 - p) / .2))); out.side = sideArms(base, k => k === 'n' ? { hand: { x: S.x - 14 - kk * 10, y: S.y - lerp(reach * .75, 22, kk) }, pref: { x: .3, y: 1 }, grip: 0 } : null, env); out.props = (base.props || []).map(pr => pr.k === 'sbar' ? Object.assign({}, pr, { at: { x: S.x - 6, y: -164 } }) : pr).concat(env > .4 ? [{ k: 'bottle', h: 'r', tilt: .6 + kk * .8 }] : []); out.face = kk > .6 ? 'drink' : 'neutral'; }
    if (id === 'l_look') { out.side = Object.assign({}, base.side, { headTilt: (base.side.headTilt || 0) + Math.sin(p * Math.PI * 2) * .22 * env }); }
    return out; }
  if (base.side && id.startsWith('p_')) { // Plank / Liegestütz
    if (id === 'p_look') out.side = Object.assign({}, base.side, { headTilt: (base.side.headTilt || 0) - Math.sin(p * Math.PI) * .35 * env });
    if (id === 'p_shake') { const w = Math.sin(p * 40) * 3; out.side = sideArms(base, (k, a) => k === 'n' ? { hand: { x: a.hand.x + 8, y: a.hand.y - 16 + w } } : null, env); }
    return out; }
  return out;
}
Sc.currentPose = function (t) { const p = poseNow(t), sd = MK.labSide && MK.labSide(), V = Sc.vis; // Nebenwirkung Zittern, Wutanfall
  if (p && sd && sd.shake > .1) tremor(p, sd.shake * .55, t); if (p && performance.now() < (V.rageUntil || 0)) tremor(p, 1.3, t); return p; };
function poseNow(t) {
  const V = Sc.vis, ex = MK.curEx(), D = MK.Fig.dims(Object.fromEntries(MK.MUSCLES.map(m => [m.id, MK.S.m[m.id].lv])), MK.rankIdx() / 10, 0);
  if (V.eat && V.ph < 0) return MK.Fig.poses.i_eat(V.eat.p, 0, D, { food: V.eat.id });
  // Plank: wer nicht tippt, liegt flach auf dem Boden – jeder Tipp drückt wieder hoch
  if (ex && ex.hold) { const nw = performance.now(), dtp = Math.min(.1, (nw - (V.pdnT || nw)) / 1000), tgt = V.ph < 0 && (!V.last || nw - V.last > 900) ? 1 : 0; V.pdnT = nw; V.pdn = V.pdn == null ? 1 : V.pdn + (tgt - V.pdn) * Math.min(1, dtp * (tgt ? 3 : 9)); } else V.pdn = 0;
  if (V.ph >= 0 && ex) { const tt = Math.sin(V.ph * Math.PI), sh = V.lastRep ? 1 : Math.max(0, (V.fatigue || 0) - .55) * 1.6, x = { rep: V.rep, shake: ex.hold ? Math.min(1, (V.hold || 0) / 50) : 0, down: ex.hold ? V.pdn : 0 };
    const p = MK.Fig.poses[ex.anim](tt, V.ph, D, x); if (sh > 0) tremor(p, sh, t); return p; }
  if (!ex || !MK.exOpen(ex)) { if (V.idle && MK.Fig.poses[V.idle.n] && V.idle.n.startsWith('i_')) return MK.Fig.poses[V.idle.n](V.idle.p, V.idle.p, D, {}); return { face: 'neutral' }; }
  // Startposition halten (an der Stange hängen, auf der Bank liegen, Hanteln in der Hand …)
  const xo = { rep: V.rep };
  if (ex.hold) { xo.shake = Math.min(1, (V.hold || 0) / 50); xo.down = V.pdn; }
  const base = MK.Fig.poses[ex.anim](0, 0, D, xo); base.face = 'neutral';
  if (base.mode === 'hang' && base.look) base.look = { x: 0, y: -.2 };
  V.cls = Sc.idleClass(base);
  if (V.idle && V.idle.ex === ex.id) return applyIdle(base, V.idle.n, V.idle.p, D);
  return base;
};

/* ======================================================================
   HAUPT-ZEICHNEN (Gym)
   ====================================================================== */
Sc.drawGym = function (dt, t) {
  if (!c) return; Sc._fr = (Sc._fr || 0) + 1;
  Sc._spotLast = !!Sc._spotNow && !!(MK.S.partner && MK.S.partner.lv); Sc._spotNow = false;
  const V = Sc.vis, G = Sc.geo();
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  Sc._dt = dt; { const o = Sc.shakeOff(dt); if (o) { c.translate(o.x, o.y); c.translate(W / 2, H / 2); c.rotate(o.r); c.translate(-W / 2, -H / 2); } }
  // Kamera: kurzer Zoom bei perfekter Wiederholung, leicht näher im Beast-Modus
  const cam = Sc.cam, zt = 1 + (MK.S.beastOn > 0 ? .045 : 0); { const n = Math.max(1, Math.ceil(dt / .012)), h = dt / n; for (let i = 0; i < n; i++) { cam.v += ((zt - cam.z) * 170 - cam.v * 15) * h; cam.z += cam.v * h; } if (cam.z < 1) { cam.z = 1; cam.v = Math.max(0, cam.v); } } // Feder: Zoom schießt kurz rein und federt weich zurück
  cam.cx = G.px; cam.cy = G.py - 150 * G.pScale; if (MK.S.set.reduce) cam.z = 1;
  if (cam.z > 1.001) { c.translate(cam.cx, cam.cy); c.scale(cam.z, cam.z); c.translate(-cam.cx, -cam.cy); }
  // Animationszustand
  if (V.ph >= 0) { V.spdS = V.lastRep ? 1.35 : 2.9; // immer gleich schnell – ganze Wiederholungen
    V.ph += dt * V.spdS;
    if (V.ph >= 1) { const an = (MK.curEx() || {}).anim;
      if (V.more > 0 && CYC[an]) { V.more--; V.ph -= 1; }
      else if (V.queue > 0) { V.queue--; V.ph = Math.min(.2, V.ph - 1) + .0001; V.rep = V.qRep; V.lastRep = false; Sc.impact(); }
      else { V.ph = -1; V.lastRep = false; V.more = 0; Sc.impact(); } } }
  // Intensität aus dem Klicktempo: klingt ab, wenn man aufhört
  if (performance.now() - (V.last || 0) > 450) V.rateS = Math.max(0, (V.rateS || 0) - dt * 3.5);
  V.intens = clamp(((V.rateS || 0) - 2.2) / 4.5, 0, 1);
  // Muskel spannt sich oben an und federt beim Ablassen nach (Feder mit wenig Dämpfung)
  { const ft = V.ph >= 0 ? Math.sin(V.ph * Math.PI) : 0, n = Math.max(1, Math.ceil(dt / .01)), h = dt / n; V.flex = V.flex || 0; V.flexV = V.flexV || 0; for (let i = 0; i < n; i++) { V.flexV += ((ft - V.flex) * 230 - V.flexV * 8) * h; V.flex += V.flexV * h; } }
  // Hängelampe pendelt nach schweren Wiederholungen
  { V.lampA = V.lampA || 0; V.lampV = V.lampV || 0; const n = Math.max(1, Math.ceil(dt / .016)), h = dt / n; for (let i = 0; i < n; i++) { V.lampV += (-V.lampA * 11 - V.lampV * .9) * h; V.lampA += V.lampV * h; } }
  V.beastK = (V.beastK || 0) + ((MK.S.beastOn > 0 ? 1 : 0) - (V.beastK || 0)) * Math.min(1, dt * 3);
  V.fatigue = Math.max(0, (V.fatigue || 0) - dt * (performance.now() - V.last > 1500 ? .18 : 0));
  V.blinkT -= dt; if (V.blinkT < 0) { V.blink = !V.blink; V.blinkT = V.blink ? .12 : rnd(2, 5); }
  V.cheer = Math.max(0, V.cheer - dt);
  if (V.ph < 0) {
    if (V.idle) { V.idle.p += dt / V.idle.d; if (V.idle.p >= 1) { V.idle = null; V.idleNext = rnd(2.5, 6); } }
    else if (MK.S.set.reduce ? false : (V.idleNext -= dt) < 0 && performance.now() - V.last > 2500) { const ex0 = MK.curEx(), pool = Sc.idlePool(V.cls || 'stand', MK.S.sweat > .8); let n = pick(pool); if (n === V.lastIdle) n = pick(pool); V.lastIdle = n;
      V.idle = { n, p: 0, d: /phone|selfie/.test(n) ? rnd(3.5, 5.5) : rnd(2.4, 4), ex: ex0 ? ex0.id : null }; }
  }
  if (V.eat) { V.eat.p += dt / V.eat.d; if (V.eat.p >= 1) V.eat = null; }
  Sc.updateBody(dt);
  const pose = Sc.currentPose(t);
  const opts = Sc.playerOpts(pose, t);
  // Stillstand: Figur nur neu zeichnen, wenn sich wirklich etwas ändert – Atmen läuft über eine winzige Sprite-Skalierung
  const still = V.ph < 0 && !V.idle && !V.eat && !(MK.S.beastOn > 0) && !(V.pantUntil && performance.now() < V.pantUntil);
  if (still) { opts.breath = 0; opts.breathK = Math.sin(t * 1.6); const lvs = Object.values(opts.lv).reduce((a, v) => a + v, 0);
    opts.sig = [JSON.stringify(pose), opts.face, opts.blink, Math.round(lvs * 4), Math.round(opts.sweat * 10), Math.round((opts.pump && typeof opts.pump === 'object' ? Object.values(opts.pump).reduce((a, v) => a + v, 0) : +opts.pump || 0) * 5), Math.round(opts.flush * 5), Math.round(opts.fatAdd * 60), Math.round(opts.exert * 4), opts.strain, opts.sponsor, opts.sfx ? Object.entries(opts.sfx).map(([k, v]) => k + Math.round(v * 8)).join() : '', JSON.stringify(MK.lookView ? MK.lookView() : MK.S.look), (opts.L.tats || []).join(), MK.S.gym].join('|'); }
  opts.reuse = still && Math.abs(V.flex || 0) < .004 && Math.abs(V.flexV || 0) < .01;
  if (pose.lie) { const bench = (pose.props || []).some(p => p.k === 'bench'); opts.pivot = { x: G.px + (bench ? 34 : 24) * G.pScale, y: G.py - (bench ? 66 : 38) * G.pScale }; }
  const st = drawGym(t);
  drawMirror(st, t, opts);
  drawEquipment(t);
  floorReflect(G);
  lightRig(st, t, G);
  updateCrowd(dt);
  buildSprites(MK.S.set.quality === 'niedrig' ? 3 : 7);
  // hintere Reihe → vordere Reihe, nach Tiefe sortiert
  const mid = G.yF + 30, crowdS = Sc.crowd.slice().sort((a, b) => a.y - b.y);
  drawNPCs(t, dt, G, 0);
  if (!MK.gev() && MK.S.gym >= 1) drawTrainee(t, dt, G);
  crowdS.forEach(p => { if (p.y < mid) drawPerson(p); });
  drawNPCs(t, dt, G, 1);
  crowdS.forEach(p => { if (p.y >= mid) drawPerson(p); });
  PLV = 0; drawRival(t, dt, G);
  Sc.trainerRect = null;
  drawPartner(t, dt, G);
  // Spieler
  const ex = MK.curEx(), wi = ex ? MK.wCur(ex) : 0; PLV = wi;
  { const ge = MK.gev(); if (ge && EVBACK[ge]) EVBACK[ge](dt, t, G); }
  if (V.beastK > .02) beastBack(G, t, V.beastK);
  { const R0 = Sc.lastPlayer, V0 = Sc.vis; let sx = G.px, rx = 82 * G.pScale, a = .5;
    if (R0 && R0.foot) { const fl = R0.foot.l, fr = R0.foot.r, lift = Math.max(0, G.py - Math.max(fl.y, fr.y)); sx = (fl.x + fr.x) / 2; rx = Math.max(60 * G.pScale, Math.abs(fl.x - fr.x) * .7 + 50 * G.pScale); if (R0.lie) { sx = R0.hip.x; rx = 120 * G.pScale; } a = .5 * clamp(1 - lift / (180 * G.pScale), .3, 1); rx *= 1 - Math.min(.4, lift / (500 * G.pScale)); }
    const sk = 1 - Math.exp(-dt * 18); V0.shX = V0.shX == null ? sx : V0.shX + (sx - V0.shX) * sk; V0.shR = V0.shR == null ? rx : V0.shR + (rx - V0.shR) * sk; V0.shA = V0.shA == null ? a : V0.shA + (a - V0.shA) * sk;
    contactShadow(V0.shX, G.py + 2, V0.shR, 12 * G.pScale * (V0.shR / (82 * G.pScale)) ** .5, V0.shA); } // Schatten läuft mit
  if (Sc.env3dOn && !pose.side && !pose.lie) { const sp = MK.Fig.sprite('player'); if (sp && Math.abs(sp.fy - G.py) < 2) figShadow(sp.cv, sp.x, sp.y, sp.w, sp.h, G.px, G.py + 1, .26); } // Figur wirft Schatten auf den 3D-Boden
  if (ex && ex.anim === 'run' && (V.ph >= 0 || true) && MK.exOpen(ex)) { EQDRAW.laufband(G.px, G.py + 6, G.pScale * 2.3, t); }
  const lay = Sc.layout(opts, G.px, G.py, G.pScale);
  let R;
  const WA = []; WREC = WA; // Gewichtspositionen für den Gold-Effekt mitschreiben (nicht die Figur selbst)
  if (pose.side) { drawSideBg(lay, pose, wi, G.pScale, ex); WREC = null; R = MK.Fig.render(c, G.px, G.py, G.pScale, opts); WREC = WA; drawSideFront(R, pose, wi, G.pScale, ex); }
  else { drawBgProps(lay, pose, wi, G.pScale, G.px, G.py); drawHandProps(lay, pose, wi, G.pScale, 'back'); WREC = null; R = MK.Fig.render(c, G.px, G.py, G.pScale, opts); WREC = WA; drawHandProps(R, pose, wi, G.pScale, 'front'); extraWeight(R, ex, wi, G.pScale, pose); }
  WREC = null; Sc.wPts = WA;
  Sc.lastPlayer = R;
  handTrails(R, dt, G);
  bodyFx(R, dt, t, G);
  drawTrainer(t, dt, G);
  if (!pose.side && !pose.lie) sweatGlints(R, t, G);
  drawPet(t, G);
  drawGymEvent(dt, t, G);
  dayLight(dt, t);
  lookPass(G);
  eventBanner(G);
  if (ex && MK.exOpen(ex)) hud(ex, t, G);
  // Beast-Feuer
  if (MK.S.beastOn > 0 && Math.random() < .5) Sc.particle('fire', G.px + rnd(-60, 60) * G.pScale, G.py - rnd(0, 200) * G.pScale);
  drawTargets(dt, t);
  drawParts(dt);
  drawPops(dt);
  drawBubbles(dt);
  // Beast-Vignette / Blitz
  if (V.beastK > .02) { const ph = (t / .56) % 1, beat = Math.exp(-ph * 9) + .65 * Math.exp(-Math.max(0, ph - .17) * 11) * (ph > .17 ? 1 : 0), a = V.beastK * (.2 + beat * .22);
    const g = c.createRadialGradient(W / 2, H / 2, H * (.36 - beat * .06), W / 2, H / 2, H * .92); g.addColorStop(0, 'rgba(255,40,20,0)'); g.addColorStop(1, `rgba(200,20,10,${a})`); c.fillStyle = g; c.fillRect(0, 0, W, H); }
  if (Sc.fx.flash > 0) { c.fillStyle = `rgba(${Sc.fx.flashCol},${Sc.fx.flash * .35})`; c.fillRect(0, 0, W, H); Sc.fx.flash = Math.max(0, Sc.fx.flash - dt * 2); }
  drawIris(dt, G);
};
/* Szenenwechsel: runde Blende schließt sich um die Figur, kurz Name des neuen Gyms, öffnet sich wieder */
let IRIS = null;
Sc.iris = function (name, mid, end) { const I = IRIS = { t: 0, name, mid, end, done: false }; setTimeout(() => { if (IRIS === I) { if (!I.done) { I.done = true; mid && mid(); } IRIS = null; end && end(); } }, 2600); }; // Sicherheitsnetz, falls das Gym gerade nicht gezeichnet wird
function drawIris(dt, G) { if (!IRIS) return; const I = IRIS; I.t += dt; const cx = G.px, cy = G.py - 150 * G.pScale, R = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) + 20;
  let r; if (I.t < .5) { const u = I.t / .5; r = R * (1 - u * u * u); } else if (I.t < .95) { r = 0; if (!I.done) { I.done = true; try { I.mid && I.mid(); } catch (e) { } } } else { const u = Math.min(1, (I.t - .95) / .55); r = R * (1 - Math.pow(1 - u, 3)); }
  c.save(); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.fillStyle = '#141414'; c.beginPath(); c.rect(0, 0, W, H); if (r > 1) c.arc(cx, cy, r, 0, TAU, true); c.fill('evenodd');
  if (r > 1) { c.strokeStyle = '#ffd23f'; c.lineWidth = 5; c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.stroke(); }
  if (I.t > .45 && I.t < 1.15) { const a = Math.min(1, (I.t - .45) / .12) * Math.min(1, (1.15 - I.t) / .15); c.globalAlpha = a; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `${Math.max(22, H * .08)}px Bangers, Impact, sans-serif`; c.lineWidth = 6; c.strokeStyle = '#000'; c.strokeText(I.name.toUpperCase(), W / 2, H / 2); c.fillStyle = '#ffd23f'; c.fillText(I.name.toUpperCase(), W / 2, H / 2);
    c.font = '700 13px system-ui,Arial'; c.fillStyle = '#fff'; c.fillText('Umzug ins neue Gym', W / 2, H / 2 + Math.max(22, H * .08) * .8); }
  c.restore(); if (I.t > 1.5) { IRIS = null; try { I.end && I.end(); } catch (e) { } } }
/* Licht & Farbe wie gerendert: Kontaktschatten an der Wandkante, weicher Lichtkegel auf dem Spieler, Vignette, leichte Farbkorrektur */
let LP = null;
function lookPass(G) {
  if (!LP || LP.W !== W || LP.H !== H || LP.px !== G.px || LP.yF !== G.yF) {
    const ao = c.createLinearGradient(0, G.yF - 26, 0, G.yF + 40); ao.addColorStop(0, 'rgba(0,0,0,0)'); ao.addColorStop(.4, 'rgba(0,0,0,.28)'); ao.addColorStop(.48, 'rgba(0,0,0,.34)'); ao.addColorStop(1, 'rgba(0,0,0,0)');
    const sp = c.createRadialGradient(G.px, G.py - H * .3, 10, G.px, G.py - H * .2, Math.max(W, H) * .62); sp.addColorStop(0, 'rgba(255,236,205,.55)'); sp.addColorStop(.45, 'rgba(128,128,128,.0)'); sp.addColorStop(1, 'rgba(0,0,10,.75)');
    const vg = c.createRadialGradient(W / 2, H * .45, Math.min(W, H) * .35, W / 2, H * .5, Math.max(W, H) * .78); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(8,6,18,.42)');
    const tp = c.createLinearGradient(0, 0, 0, H); tp.addColorStop(0, 'rgba(255,214,160,.10)'); tp.addColorStop(.6, 'rgba(0,0,0,0)'); tp.addColorStop(1, 'rgba(40,60,120,.12)');
    LP = { W, H, px: G.px, yF: G.yF, ao, sp, vg, tp }; }
  c.save();
  c.fillStyle = LP.ao; c.fillRect(0, G.yF - 26, W, 66);
  c.globalCompositeOperation = 'soft-light'; c.fillStyle = LP.sp; c.fillRect(0, 0, W, H);
  c.globalCompositeOperation = 'overlay'; c.fillStyle = LP.tp; c.fillRect(0, 0, W, H);
  c.globalCompositeOperation = 'source-over'; c.fillStyle = LP.vg; c.fillRect(0, 0, W, H);
  c.restore();
}
/* Schweiß glänzt: wandernde Glanzlichter auf freier Haut, ab und zu läuft ein Tropfen runter */
function sweatGlints(R, t, G) {
  const S = MK.S, sw = S.sweat || 0; if (sw < .25 || !R || MK.S.set.quality === 'niedrig') return;
  const L = MK.Fig.resolveLook(S.look), cut = L.top ? L.top.cut : 'none', k = G.pScale, a0 = Math.min(1, (sw - .25) * 1.6);
  const segs = []; ['l', 'r'].forEach(h => { if (!['tee', 'long', 'hoodie'].includes(cut)) segs.push([R.sh[h], R.el[h]]); if (!['long', 'hoodie'].includes(cut)) segs.push([R.el[h], R.ha[h]]); });
  if (cut === 'none' || cut === 'stringer') segs.push([R.neck, R.hip]);
  c.save(); c.globalCompositeOperation = 'lighter';
  segs.forEach(([A, B], i) => { const dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy) || 1, ang = Math.atan2(dy, dx); let nx = -dy / len, ny = dx / len; if (nx * -.6 + ny * -.8 < 0) { nx = -nx; ny = -ny; }
    [.3, .62].forEach((u, j) => { const sh = Math.sin(t * 2.2 + i * 1.7 + j * 2) , al = a0 * (.32 + .22 * sh), px = A.x + dx * (u + sh * .04) + nx * 5 * k, py = A.y + dy * (u + sh * .04) + ny * 5 * k;
      const g = c.createRadialGradient(px, py, 0, px, py, 6 * k); g.addColorStop(0, `rgba(255,255,255,${al})`); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g;
      c.save(); c.translate(px, py); c.rotate(ang); c.scale(1.8, .55); c.beginPath(); c.arc(0, 0, 6 * k, 0, TAU); c.fill(); c.restore(); }); });
  c.restore();
  if (sw > .5) segs.slice(0, 4).forEach(([A, B], i) => { const ph = (t * .22 + i * .31) % 1; if (ph > .7) return; const u = ph / .7, x = A.x + (B.x - A.x) * u, y = A.y + (B.y - A.y) * u + 2 * k;
    c.fillStyle = 'rgba(200,230,255,.75)'; c.beginPath(); c.ellipse(x, y, 1.4 * k, 2 * k, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,.9)'; c.fillRect(x - .5 * k, y - 1.2 * k, .8 * k, .8 * k); });
}
/* ---------- Umkleide: eigene Ansicht für Outfits – große Figur auf einem Podest, Vorhänge, Spot ---------- */
let WARDT = { spin: 0 };
Sc.wardSpin = () => { WARDT.hold = true; MK.Audio.play('pop'); }; Sc.wardRelease = () => { if (WARDT.hold) { WARDT.hold = false; MK.Audio.play('pop'); } }; // gedrückt halten = Rückansicht, solange der Finger drauf ist
Sc.drawWard = function (dt, t) {
  if (!c) return; c.setTransform(dpr, 0, 0, dpr, 0, 0);
  let g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2b2236'); g.addColorStop(1, '#14111c'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  // Vorhänge links/rechts mit Falten
  [0, 1].forEach(side => { const x0 = side ? W * .82 : 0, w = W * .18; for (let i = 0; i < 7; i++) { const fx = x0 + i * w / 7, gg = c.createLinearGradient(fx, 0, fx + w / 7, 0); gg.addColorStop(0, '#5a1428'); gg.addColorStop(.5, '#8f2440'); gg.addColorStop(1, '#4a0f20'); c.fillStyle = gg; c.fillRect(fx, 0, w / 7 + 1, H); }
    c.fillStyle = '#c9971c'; c.fillRect(x0, 0, w, 6); });
  c.fillStyle = '#c9971c'; c.fillRect(0, 0, W, 8);
  // Boden + Podest
  const fy = H * .82; g = c.createLinearGradient(0, fy, 0, H); g.addColorStop(0, '#3a2a24'); g.addColorStop(1, '#1d1512'); c.fillStyle = g; c.fillRect(0, fy, W, H - fy);
  const k = Math.min(W / 700, H / 520), px = W / 2, py = fy + 6 * k;
  c.fillStyle = '#1b1b20'; c.beginPath(); c.ellipse(px, py + 8 * k, 150 * k, 26 * k, 0, 0, TAU); c.fill(); g = c.createLinearGradient(0, py - 18 * k, 0, py + 8 * k); g.addColorStop(0, '#e6c060'); g.addColorStop(1, '#9a7418');
  c.fillStyle = g; c.beginPath(); c.ellipse(px, py - 4 * k, 150 * k, 24 * k, 0, 0, TAU); c.fill(); c.fillStyle = '#2a2a30'; c.beginPath(); c.ellipse(px, py - 8 * k, 140 * k, 20 * k, 0, 0, TAU); c.fill();
  // Spot von oben
  c.save(); c.globalCompositeOperation = 'lighter'; g = c.createLinearGradient(0, 0, 0, py); g.addColorStop(0, 'rgba(255,240,210,.28)'); g.addColorStop(1, 'rgba(255,240,210,.05)'); c.fillStyle = g;
  c.beginPath(); c.moveTo(px - 30 * k, 0); c.lineTo(px + 30 * k, 0); c.lineTo(px + 170 * k, py); c.lineTo(px - 170 * k, py); c.closePath(); c.fill(); c.restore();
  // Figur (zeigt die Vorschau aus der Garderobe)
  const back = !!WARDT.hold;
  const sc = Math.min(H * .8 / 300, W * .6 / 220), o = Sc.playerOpts({ face: 'proud' }, t); o.key = 'ward'; o.back = back; o.reuse = false; o.breath = Math.sin(t * 1.6); o.glow = 0; o.sweat = 0; o.shine = 0;
  contactShadow(px, py - 8 * k, 90 * sc, 14 * sc, .5);
  MK.Fig.render(c, px, py - 8 * k, sc, o);
  // Hinweis
  c.font = '700 12px system-ui,Arial'; c.textAlign = 'center'; c.fillStyle = 'rgba(255,255,255,.6)'; c.fillText(U_HINT(), W / 2, H - 12);
  drawParts(dt); drawPops(dt);
};
const U_HINT = () => (MK.UI && MK.UI.preview) ? 'Anprobe – kaufen unten in der Kasse · Gedrückt halten = von hinten' : 'Teil antippen zum Anprobieren · Gedrückt halten = von hinten';
Sc.fxDraw = dt => { drawParts(dt); drawPops(dt); };
Sc.cam = { z: 1, v: 0, kick: 0, cx: 0, cy: 0 };
Sc.zoomKick = k => { Sc.cam.v = Math.min(2.2, (Sc.cam.v || 0) + k * 14); };
/* Wackeln: weiche Schwingung, klingt exponentiell aus (statt nervösem Zufall pro Bild) */
let shT = 0;
Sc.shakeOff = function (dt) { const on = MK.S.set.shake, s = Sc.fx.shake; Sc.fx.shake = Math.max(0, s * Math.exp(-dt * 6.5) - dt * 1.5); if (!on || s <= .05) return null; shT += dt;
  return { x: s * (Math.sin(shT * 43) * .62 + Math.sin(shT * 27 + 1.3) * .38), y: s * (Math.sin(shT * 37 + .7) * .6 + Math.sin(shT * 21 + 2.1) * .4) * .75, r: s * .0016 * Math.sin(shT * 29) }; };
Sc.unzoom = (x, y) => { const z = Sc.cam.z; return z > 1.001 ? { x: Sc.cam.cx + (x - Sc.cam.cx) / z, y: Sc.cam.cy + (y - Sc.cam.cy) / z } : { x, y }; };
/* Takt fürs Seilspringen: folgt der Boombox, sonst 100 Schläge pro Minute */
Sc.bpm = () => { const S = MK.S; if (S.music.on && S.eq.boombox) { const m = MK.MUSIC.find(z => z.id === S.music.cur); if (m) return m.bpm < 90 ? m.bpm * 1.5 : m.bpm; } return 100; };
Sc.beatPh = now => { const per = 60 / Sc.bpm(); return ((now / 1000) / per) % 1; };
Sc.beatErr = now => { const ph = Sc.beatPh(now), per = 60 / Sc.bpm(); return Math.min(ph, 1 - ph) * per; };
Sc.layout = function (o, wx, wy, scale) {
  if (o.pose && o.pose.side) return MK.Fig.sideLayout(o, wx, wy, scale);
  const pose = o.pose || {}, D = MK.Fig.dims(o.lv, o.posture || 0, o.breath || 0), J = MK.Fig.skeleton(D, pose);
  const rot = pose.lie ? (o.rot != null ? o.rot : -Math.PI / 2) : 0, piv = rot ? (o.pivot || { x: wx, y: wy - 60 * scale }) : null, cs = Math.cos(rot), sn = Math.sin(rot);
  const Wp = rot ? p => { const dx = (p.x - J.hipX) * scale, dy = (p.y - J.hipY) * scale; return { x: piv.x + dx * cs - dy * sn, y: piv.y + dx * sn + dy * cs }; } : p => ({ x: wx + p.x * scale, y: wy + p.y * scale });
  return { rot, lie: !!pose.lie, piv, D, J, el: { l: Wp(J.el.l), r: Wp(J.el.r) }, hip: Wp({ x: J.hipX, y: J.hipY }), ha: { l: Wp(J.ha.l), r: Wp(J.ha.r) }, sh: { l: Wp(J.sh.l), r: Wp(J.sh.r) }, head: Wp(J.head), neck: Wp({ x: J.shX, y: J.shY - 4 }), top: Wp({ x: J.head.x, y: J.head.y - D.headRy }), foot: { l: Wp(J.foot.l), r: Wp(J.foot.r) }, hs: J.hs };
};
const ALT = { altcurl: 1, lunge: 1, twist: 1, twistSit: 1 }, CYC = { farmer: 1, rope: 1, run: 1 };
Sc.startRep = function (repN) { const V = Sc.vis, now = performance.now(), ex = MK.curEx(), an = ex && ex.anim;
  // Klicktempo (nur für Effekte wie Schweiß, rotes Gesicht, Hecheln – nicht für die Bewegung)
  const iv = V.last ? Math.max(.03, (now - V.last) / 1000) : 1; V.rateS = V.rateS == null ? 1 / iv : V.rateS + (Math.min(14, 1 / iv) - V.rateS) * .3;
  V.eat = null; V.idle = null; V.last = now; V.idleNext = rnd(3, 6);
  if (V.ph >= 0 && V.ph < 1) { // läuft gerade: die Wiederholung wird immer ganz zu Ende geführt, die nächste startet direkt danach
    if (CYC[an]) V.more = Math.min(1, (V.more || 0) + 1); else { V.queue = Math.min(1, (V.queue || 0) + 1); V.qRep = repN; }
    return; }
  V.ph = 0.0001; V.rep = repN; V.more = 0; V.queue = 0; };
/* Schweres Gewicht abgesetzt: Staubring am Boden, Lampe pendelt, kurzes Wackeln */
let impT = 0;
Sc.impact = function (scale) { const ex = MK.curEx(); if (!ex || !MK.exOpen(ex) || ex.kg === 'cardio') return; const now = performance.now(); if (now - impT < 170) return;
  const wi = MK.wCur(ex), k = clamp((wi - 5) / 13, 0, 1) * (scale || 1); if (k < .06) return; impT = now;
  const G = Sc.geo(), V = Sc.vis; Sc.fx.parts.push({ k: 'ring', x: G.px, y: G.py + 3, vx: 0, vy: 0, life: 1, r: 14 * G.pScale, R: (70 + 80 * k) * G.pScale, rot: 0, col: '255,255,255' });
  for (let i = 0; i < 4 + Math.round(k * 8); i++) { const d = i % 2 ? 1 : -1; Sc.fx.parts.push({ k: 'dust', x: G.px + d * rnd(10, 60) * G.pScale, y: G.py + rnd(-2, 4), vx: d * rnd(.6, 2.2), vy: rnd(-.7, -.15), life: 1, r: rnd(5, 10) * G.pScale, rot: 0, col: '#fff' }); }
  Sc.fx.shake = Math.max(Sc.fx.shake, 1.2 + k * 4.5); V.lampV += (Math.random() < .5 ? -1 : 1) * (.35 + k * 1.1); V.flick = Math.max(V.flick || 0, k);
  MK.Audio.play('thud', k); };
/* Neues Gewicht gekauft: Gold-Feuerwerk um die Hanteln, die kurz nachglühen */
Sc.newWeightFx = function () { const V = Sc.vis; V.newW = performance.now();
  const pts = Sc.weightPage(); if (pts.length) { const seen = []; pts.forEach(p => { if (seen.some(q => Math.hypot(q.x - p.x, q.y - p.y) < 26)) return; seen.push(p); MK.Fx.burst(p.x, p.y, { gold: true, size: Math.min(1.3, .7 + p.r / 40) }); }); MK.Fx.weightGlow(2.8); }
  Sc.burst('NEUES GEWICHT!', '#ffd23f'); Sc.fx.flash = .5; Sc.fx.flashCol = '255,214,80'; Sc.zoomKick(.05); MK.Audio.play('level'); };
/* Gewichtspositionen (vom letzten Bild) in Bildschirm-Koordinaten */
Sc.weightPage = function () { const r = cv.getBoundingClientRect(), k = r.width / W, R = Sc.lastPlayer; let P = Sc.wPts || []; if (!P.length && R) P = R.lie || (R.hip && R.neck && Math.abs(R.hip.y - R.neck.y) < 60) ? [{ x: (R.hip.x + R.neck.x) / 2, y: (R.hip.y + R.neck.y) / 2 - 10, r: 16 }] : [R.ha.l, R.ha.r].map(h => ({ x: h.x, y: h.y, r: 12 })); return P.map(p => ({ x: r.left + p.x * k, y: r.top + p.y * k, r: p.r * k })); };
Sc.setFace = function (f, ms) { Sc.vis.face = f; Sc.vis.faceUntil = performance.now() + ms; };
Sc.snapshot = function () { try { return cv.toDataURL('image/jpeg', .8); } catch (e) { return null; } };

/* ======================================================================
   WETTKAMPF-BÜHNE (Jury, Publikum, Konfetti)
   ====================================================================== */
/* Wettkampf-Schauplätze: je weiter du bist, desto größer und hochwertiger – am Ende im All */
Sc.VENUES = ['Hinterhof', 'Vereinsheim', 'Stadthalle', 'Landesarena', 'Nationalarena', 'Europa-Stadion', 'WM-Megastadion', 'Raumstation Orbit'];
function venueBg(v, t, yF, st) {
  let g;
  const crowdRows = (n, y0, y1, cols, a) => { for (let r = 0; r < n; r++) { const y = lerp(y0, y1, r / Math.max(1, n - 1)), k = .6 + r / n * .6; for (let i = 0; i < W / (12 * k); i++) { const x = i * 12 * k + (r % 2) * 6 * k, bob = (st.cheer ? Math.abs(Math.sin(t * 8 + i + r)) * 3 : 0); c.fillStyle = `rgba(${cols[(i + r) % cols.length]},${a})`; c.beginPath(); c.arc(x, y - bob, 3.4 * k, 0, TAU); c.fill(); c.fillRect(x - 3.5 * k, y + 2 * k - bob, 7 * k, 6 * k); if ((i * 7 + r) % 23 === 0 && Math.sin(t * 4 + i) > .7) { c.fillStyle = 'rgba(255,255,255,.9)'; c.fillRect(x - 1, y - 8 * k, 2, 3); } } } };
  const beams = (cols, n, sp) => { for (let i = 0; i < n; i++) { const x0 = W * (i + .5) / n, ang = Math.sin(t * sp + i * 1.7) * .5; c.save(); c.translate(x0, 0); c.rotate(ang); g = c.createLinearGradient(0, 0, 0, yF); g.addColorStop(0, `rgba(${cols[i % cols.length]},.35)`); g.addColorStop(1, `rgba(${cols[i % cols.length]},0)`); c.fillStyle = g; c.beginPath(); c.moveTo(-6, 0); c.lineTo(6, 0); c.lineTo(60, yF); c.lineTo(-60, yF); c.fill(); c.restore(); } };
  if (v === 0) { // Hinterhof: Ziegelwand, Graffiti, eine Glühbirne
    c.fillStyle = '#4a2f26'; c.fillRect(0, 0, W, yF); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1.5;
    for (let y = 0; y < yF; y += 14) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); for (let x = (y / 14) % 2 * 18; x < W; x += 36) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 14); c.stroke(); } }
    c.font = `${H * .09}px Bangers, Impact`; c.textAlign = 'center'; c.fillStyle = 'rgba(80,220,140,.5)'; c.save(); c.translate(W * .2, yF * .55); c.rotate(-.1); c.fillText('PUMP!', 0, 0); c.restore(); c.fillStyle = 'rgba(255,90,160,.45)'; c.save(); c.translate(W * .82, yF * .4); c.rotate(.12); c.fillText('NO PAIN', 0, 0); c.restore();
    g = c.createRadialGradient(W / 2, 30, 4, W / 2, 30, H * .5); g.addColorStop(0, 'rgba(255,230,160,.45)'); g.addColorStop(1, 'rgba(255,230,160,0)'); c.fillStyle = g; c.fillRect(0, 0, W, yF); c.fillStyle = '#fff3c0'; c.beginPath(); c.arc(W / 2, 30, 6, 0, TAU); c.fill();
    c.fillStyle = '#5a5a5e'; c.fillRect(0, yF, W, H - yF);
  } else if (v === 1) { // Vereinsheim: Holzwand, Wimpelkette
    c.fillStyle = '#8a5a34'; c.fillRect(0, 0, W, yF); for (let x = 0; x < W; x += 28) { c.fillStyle = x / 28 % 2 ? 'rgba(0,0,0,.08)' : 'rgba(255,255,255,.04)'; c.fillRect(x, 0, 28, yF); }
    for (let k = 0; k < 2; k++) for (let i = 0; i < 16; i++) { const x = i * W / 15, y = 40 + k * 46 + Math.sin(i / 15 * Math.PI) * 18; c.fillStyle = ['#ff5a36', '#ffc83d', '#2f80ff', '#2bb673'][(i + k) % 4]; c.beginPath(); c.moveTo(x - 8, y); c.lineTo(x + 8, y); c.lineTo(x, y + 14); c.fill(); }
    crowdRows(2, yF - 30, yF - 12, ['60,40,30', '90,60,40'], .8); c.fillStyle = '#6b4a2b'; c.fillRect(0, yF, W, H - yF);
  } else if (v === 2) { // Stadthalle: roter Vorhang
    g = c.createLinearGradient(0, 0, 0, yF); g.addColorStop(0, '#2a0a14'); g.addColorStop(1, '#5a1426'); c.fillStyle = g; c.fillRect(0, 0, W, yF);
    for (let i = 0; i < 18; i++) { const x = i * W / 17; g = c.createLinearGradient(x - W / 34, 0, x + W / 34, 0); g.addColorStop(0, 'rgba(0,0,0,.25)'); g.addColorStop(.5, 'rgba(255,255,255,.05)'); g.addColorStop(1, 'rgba(0,0,0,.25)'); c.fillStyle = g; c.fillRect(x - W / 34, 0, W / 17, yF); }
    c.fillStyle = '#e6b422'; c.fillRect(0, 0, W, 6); g = c.createLinearGradient(0, yF, 0, H); g.addColorStop(0, '#4a3020'); g.addColorStop(1, '#2a1a10'); c.fillStyle = g; c.fillRect(0, yF, W, H - yF);
  } else if (v <= 6) { // Arenen: Tribünen, LED-Wand, Lichtkegel – wird mit jeder Stufe größer und bunter
    const pal = [[], [], [], ['#141a3a', '#2a2f6a'], ['#1a1a1a', '#3a1010'], ['#0e1a3a', '#1a3a7a'], ['#120a2a', '#3a1060']][v];
    g = c.createLinearGradient(0, 0, 0, yF); g.addColorStop(0, pal[0]); g.addColorStop(1, pal[1]); c.fillStyle = g; c.fillRect(0, 0, W, yF);
    crowdRows(3 + v, yF * (.62 - v * .06), yF - 10, v === 4 ? ['30,30,30', '200,40,40', '230,190,40'] : v === 5 ? ['40,70,170', '230,200,60', '220,220,230'] : ['120,120,200', '200,120,220', '90,200,230', '230,230,90'], .9);
    const sw = W * (.28 + v * .03), sx = W / 2 - sw / 2, sy = 14; c.fillStyle = '#0a0a0e'; c.fillRect(sx - 4, sy - 4, sw + 8, yF * .32 + 8);
    g = c.createLinearGradient(sx, 0, sx + sw, 0); g.addColorStop(0, '#1e3a8a'); g.addColorStop(.5, '#7c3aed'); g.addColorStop(1, '#0ea5e9'); c.fillStyle = g; c.globalAlpha = .55 + .2 * Math.sin(t * 2); c.fillRect(sx, sy, sw, yF * .32); c.globalAlpha = 1;
    if (v === 4) { [['#141414', 0], ['#dd0000', 1], ['#ffcc00', 2]].forEach(([col, k]) => { c.fillStyle = col; c.fillRect(8, 20 + k * 10, 34, 10); c.fillRect(W - 42, 20 + k * 10, 34, 10); }); }
    if (v === 5) for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; c.fillStyle = '#ffcc00'; c.beginPath(); c.arc(W * .1 + Math.cos(a) * 18, 46 + Math.sin(a) * 18, 2.6, 0, TAU); c.fill(); }
    if (v === 6) { c.strokeStyle = 'rgba(120,220,255,.5)'; c.lineWidth = 1.5; const gx = W * .12, gy = 50; c.beginPath(); c.arc(gx, gy, 22, 0, TAU); c.stroke(); c.beginPath(); c.ellipse(gx, gy, 22 * Math.abs(Math.cos(t)), 22, 0, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(gx - 22, gy); c.lineTo(gx + 22, gy); c.stroke(); }
    beams(v >= 5 ? ['255,80,200', '80,200,255', '255,230,80', '120,255,160'] : ['255,240,200'], 3 + v, .6 + v * .1);
    g = c.createLinearGradient(0, yF, 0, H); g.addColorStop(0, v >= 5 ? '#1a1a2a' : '#2a2a30'); g.addColorStop(1, '#0e0e12'); c.fillStyle = g; c.fillRect(0, yF, W, H - yF);
    if (v >= 5 && Math.random() < .08) Sc.particle('confetti', rnd(0, W), 0, 6);
  } else { // Raumstation: Erde im Hintergrund, Sterne, Metallplattform
    c.fillStyle = '#05060f'; c.fillRect(0, 0, W, H); for (let i = 0; i < 80; i++) { const x = (i * 97.13 % 1) * W, y = (i * 61.7 % 1) * yF; c.fillStyle = `rgba(255,255,255,${.4 + .4 * Math.sin(t * 2 + i)})`; c.fillRect(x, y, 1.6, 1.6); }
    const ex = W * .72, ey = yF * 1.05, er = W * .42; g = c.createRadialGradient(ex - er * .3, ey - er * .3, er * .1, ex, ey, er); g.addColorStop(0, '#5fb3ff'); g.addColorStop(.7, '#1d5fbf'); g.addColorStop(1, '#0b2a5a'); c.fillStyle = g; c.beginPath(); c.arc(ex, ey, er, 0, TAU); c.fill();
    c.save(); c.beginPath(); c.arc(ex, ey, er, 0, TAU); c.clip(); c.fillStyle = 'rgba(80,170,90,.75)'; for (let i = 0; i < 6; i++) { const a = t * .03 + i; c.beginPath(); c.ellipse(ex + Math.cos(a) * er * .6, ey - er * .3 + Math.sin(i * 2) * er * .3, er * .22, er * .12, a, 0, TAU); c.fill(); } c.restore();
    c.strokeStyle = 'rgba(140,200,255,.35)'; c.lineWidth = 8; c.beginPath(); c.arc(ex, ey, er + 6, 0, TAU); c.stroke();
    c.fillStyle = '#8a929e'; c.fillRect(0, yF, W, H - yF); c.fillStyle = '#5c636e'; for (let x = 0; x < W; x += 40) c.fillRect(x, yF, 2, H - yF); c.fillStyle = 'rgba(80,220,255,.6)'; c.fillRect(0, yF, W, 3);
  }
  // Banner mit Titel und Schauplatz
  c.fillStyle = '#141414'; c.fillRect(W * .25, 18, W * .5, 34); c.fillStyle = '#ffd23f'; c.font = `${Math.max(16, H * .05)}px Bangers, Impact, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(st.title || 'WETTKAMPF', W / 2, 36);
  c.fillStyle = 'rgba(255,255,255,.75)'; c.font = '700 11px Arial'; c.fillText('📍 ' + Sc.VENUES[v], W / 2, 60); c.textBaseline = 'alphabetic';
  // Scheinwerfer auf die Bühne
  [[.3, '255,240,200'], [.7, '255,240,200']].forEach(([x, col], i) => { const sx = W * x + Math.sin(t * .7 + i) * 20; g = c.createRadialGradient(sx, H - 30, 10, sx, H - 30, H * .55); g.addColorStop(0, `rgba(${col},.28)`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.fillRect(0, 0, W, H); });
}
Sc.drawStage = function (dt, t, st) {
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  { const o = Sc.shakeOff(dt); if (o) c.translate(o.x, o.y); }
  const yF = H * .64, v = clamp(st.venue || 0, 0, 7); let g;
  venueBg(v, t, yF, st);
  // Jury (hinten Mitte)
  const jy = yF - 4; c.fillStyle = '#1a1a1e'; c.fillRect(W * .36, jy - 26, W * .28, 26); c.fillStyle = '#e6b422'; c.fillRect(W * .36, jy - 26, W * .28, 3);
  [.41, .5, .59].forEach((x, i) => { Sc.person(W * x, jy - 4, .42 * H / 440, { skin: ['#dca57a', '#b98559', '#f3cfae'][i], shirt: '#26262a', pants: '#26262a', hair: ['#1c1916', '#8d8a85', '#4a3020'][i], bald: i === 1 }, 'watch', t + i, { lookAt: W / 2 });
    if (st.scores) { c.fillStyle = '#fff'; c.fillRect(W * x - 12, jy - 70, 24, 18); c.fillStyle = '#141414'; c.font = '700 13px Arial'; c.fillText(st.scores[i], W * x, jy - 61); } });
  // Publikum (Silhouetten vorne unten) – reagiert live: Jubel bei Führung, Buhrufe bei Rückstand
  const n = clamp(6 + Math.floor(Math.sqrt(MK.S.fame)), 6, 30), mood = st.mood || 0, cheer = st.cheer || (mood > .25 ? mood : 0);
  for (let i = 0; i < n; i++) { const x = (i + .5) / n * W, y = H + 6, bob = cheer ? Math.abs(Math.sin(t * 8 + i)) * 8 : Math.sin(t + i) * 1.5;
    c.fillStyle = 'rgba(10,6,8,.92)'; c.beginPath(); c.arc(x, y - 30 - bob, 11, 0, TAU); c.fill(); c.beginPath(); c.ellipse(x, y - 4 - bob, 18, 18, 0, Math.PI, 0); c.fill();
    if (cheer && i % 2) { c.strokeStyle = 'rgba(10,6,8,.92)'; c.lineWidth = 6; c.beginPath(); c.moveTo(x - 10, y - 20 - bob); c.lineTo(x - 18, y - 52 - bob); c.moveTo(x + 10, y - 20 - bob); c.lineTo(x + 18, y - 52 - bob); c.stroke(); }
    if (i % 5 === 2 && Math.sin(t * 3 + i) > .6) { c.fillStyle = 'rgba(255,255,255,.8)'; c.fillRect(x - 3, y - 58 - bob, 6, 9); } }
  if (st.draw) st.draw(c, W, H, yF, t);
  chants(dt, st, mood);
  drawParts(dt); drawPops(dt); drawBubbles(dt);
  if (Sc.fx.flash > 0) { c.fillStyle = `rgba(${Sc.fx.flashCol},${Sc.fx.flash * .35})`; c.fillRect(0, 0, W, H); Sc.fx.flash = Math.max(0, Sc.fx.flash - dt * 2); }
};
/* Sprechchöre und Zurufe aus dem Publikum */
const CH = { lead: ['HAU REIN!', 'JAAA!', 'WEITER SO!', 'STARK!', 'MASCHINE!', '#R! #R!'], even: ['LOS!', 'OOOH!', 'SPANNEND!', 'KOMM!'], behind: ['BUUUH!', 'SCHNELLER!', 'KOMM SCHON!', 'LAAAHM!', 'AUFWACHEN!'],
  win: ['ZUGABE!', 'CHAMPION!', '#R! #R!', 'JAAAAA!'], lose: ['BUUUH!', 'NÄCHSTES MAL!', 'OOOH …'] };
let chT = 1.2, chL = [], chEnd = null;
function chants(dt, st, mood) {
  const res = st.result || null; if (res !== chEnd) { chEnd = res; chT = .3; if (!res) chL = []; }
  if ((st.running || res) && (chT -= dt) < 0) {
    const k = res ? res : mood > .2 ? 'lead' : mood < -.2 ? 'behind' : 'even', rk = MK.rankName().toUpperCase(), txt = pick(CH[k]).replace(/#R/g, rk);
    chT = res ? rnd(1.2, 2) : rnd(1.8, 3); chL.push({ txt, x: rnd(W * .12, W * .88), y: H - rnd(60, 90), life: 1.8, bad: k === 'behind' || k === 'lose' });
    MK.Audio.play(k === 'behind' || k === 'lose' ? 'boo' : k === 'even' ? 'murmur' : 'chant'); }
  chL = chL.filter(q => (q.life -= dt) > 0);
  chL.forEach(q => { q.y -= dt * 14; c.save(); c.globalAlpha = Math.min(1, q.life * 1.6); c.font = `${Math.max(16, H * .045)}px Bangers, Impact, sans-serif`; c.textAlign = 'center'; c.lineWidth = 4; c.strokeStyle = '#141414'; c.strokeText(q.txt, q.x, q.y); c.fillStyle = q.bad ? '#ff8a7a' : '#ffe27a'; c.fillText(q.txt, q.x, q.y); c.restore(); });
}
function extraWeight(R, ex, wi, sc, pose) {
  if (!ex || ex.kg !== 'bw' || wi <= 0) return; const kg = MK.WEIGHTS[wi];
  if (['pullup', 'dips', 'legraise'].includes(ex.anim) && !(pose && pose.mode === 'hang')) { const pl = platesFor(kg, 1)[0] || { rad: 8, col: '#b8bcc2' }, x = R.foot.r.x + 34 * sc, y = R.foot.r.y - pl.rad * sc;
    wrec(x, y, pl.rad * sc); c.fillStyle = pl.col; c.strokeStyle = '#141414'; c.lineWidth = 1; c.beginPath(); c.ellipse(x, y, pl.rad * sc * .8, pl.rad * sc, -.15, 0, TAU); c.fill(); c.stroke(); c.fillStyle = '#26262a'; c.beginPath(); c.arc(x, y, 2.5 * sc, 0, TAU); c.fill(); return; }
  if (['pullup', 'dips', 'legraise'].includes(ex.anim)) { const hx = R.hip.x, hy = R.hip.y + 10 * sc, py2 = hy + 34 * sc, pl = platesFor(kg, 1)[0] || { rad: 8, col: '#b8bcc2' };
    c.strokeStyle = '#6d7076'; c.lineWidth = 2 * sc; c.setLineDash([3 * sc, 2 * sc]); c.beginPath(); c.moveTo(hx - 10 * sc, hy - 12 * sc); c.lineTo(hx, py2 - pl.rad * sc); c.lineTo(hx + 10 * sc, hy - 12 * sc); c.stroke(); c.setLineDash([]);
    c.fillStyle = pl.col; c.strokeStyle = '#141414'; c.lineWidth = 1; c.beginPath(); c.arc(hx, py2, pl.rad * sc, 0, TAU); c.fill(); c.stroke(); c.fillStyle = '#26262a'; c.beginPath(); c.arc(hx, py2, 3 * sc, 0, TAU); c.fill(); }
  else if (['squat', 'lunge', 'calf'].includes(ex.anim)) ['l', 'r'].forEach(h => dumbbell(R.ha[h].x, R.ha[h].y + 2 * sc, sc, kg, true, false));
  else if (ex.anim === 'crunch') { const pl = platesFor(kg, 1)[0] || { rad: 8, col: '#b8bcc2' }, x = R.neck.x, y = R.neck.y + 30 * sc; c.fillStyle = pl.col; c.strokeStyle = '#141414'; c.lineWidth = 1; c.beginPath(); c.arc(x, y, pl.rad * sc, 0, TAU); c.fill(); c.stroke(); c.fillStyle = '#26262a'; c.beginPath(); c.arc(x, y, 3 * sc, 0, TAU); c.fill(); }
}
Sc.drawFighterSide = function (o, x, y, sc, pose, wi) { const lay = Sc.layout(o, x, y, sc); Sc._noSpot = 1; drawSideBg(lay, pose, wi || 0, sc, null); const R = MK.Fig.render(c, x, y, sc, o); drawSideFront(R, pose, wi || 0, sc, null); Sc._noSpot = 0; return R; };
Sc.drawFighter = function (o, x, y, sc, pose, wi) { const lay = Sc.layout(o, x, y, sc); drawBgProps(lay, pose, wi || 0, sc, x, y); drawHandProps(lay, pose, wi || 0, sc, 'back'); const R = MK.Fig.render(c, x, y, sc, o); drawHandProps(R, pose, wi || 0, sc, 'front'); return R; };
Sc.oppLook = function (seed) { const r = MK.seedRand('opp' + seed), W2 = MK.WARD, p = g => W2[g].items[Math.floor(r() * W2[g].items.length)].id;
  return { skin: p('skin'), tan: p('tan'), hairc: p('hairc'), hair: p('hair'), beard: p('beard'), tattoo: r() < .4 ? p('tattoo') : 'none', top: ['tee-rot', 'tee-blau', 'tank-schwarz', 'tank-gruen', 'stringer', 'kompr', 'tee-weiss', 'hoodie'][Math.floor(r() * 8)], bottom: p('bottom'), shoes: 'sh' + (1 + Math.floor(r() * 4)), gloves: 'none', head: r() < .3 ? p('head') : 'none', acc: r() < .3 ? p('acc') : 'none' }; };
Sc.NPC = NPC; Sc.EQDRAW = EQDRAW; Sc.person2 = Sc.person; Sc.dumbbell = dumbbell; Sc.barbell = barbell; Sc.circ = circ; Sc.ell = ell;

})(window.MK);
