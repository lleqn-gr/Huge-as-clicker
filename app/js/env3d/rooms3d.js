/* Muskelklicker 3D-Umgebung – die fünf Gym-Räume (Keller, Verein, Fitnesskette, Profi-Studio, Tempel).
   Fenster, Spiegel, Pokal-Regal und Lampen sitzen an denselben Bildschirm-Stellen wie in der 2D-Szene,
   damit Himmel (2D), Spiegel (2D), Licht-Effekte (2D) und Klickflächen genau passen.
   wx/wy rechnen einen Bildschirm-Punkt in einer Tiefe in Welt-Koordinaten um (siehe env3d.js). */
import * as THREE from 'three';
import { tm, glow, box, cyl, ball, tube, panel, canvasTex, texMat, rng, mesh, BOX, CYL8 } from './parts3d.js';
import { inked } from './toon.js';

const MK = window.MK;

/* ---------- Texturen ---------- */
const P = {
  brick(x, w, h) { const R = rng(11); x.fillStyle = '#d8ccb0'; x.fillRect(0, 0, w, h); const rows = 8, bh = h / rows, bw = w / 4;
    for (let r = 0; r < rows; r++) for (let i = -1; i < 5; i++) { const ox = (r % 2) * bw / 2, v = R(); x.fillStyle = v < .33 ? '#b08455' : v < .66 ? '#a67a4c' : '#bb8f5f';
      const X = i * bw + ox + 3, Y = r * bh + 3, ww = bw - 6, hh = bh - 6; x.fillRect(X, Y, ww, hh); x.fillStyle = 'rgba(255,255,255,.13)'; x.fillRect(X, Y, ww, 3); x.fillStyle = 'rgba(0,0,0,.14)'; x.fillRect(X, Y + hh - 4, ww, 4); } },
  concrete(x, w, h) { const R = rng(3); x.fillStyle = '#77726b'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { x.fillStyle = R() < .5 ? `rgba(0,0,0,${.03 + R() * .05})` : `rgba(255,255,255,${.03 + R() * .04})`; x.beginPath(); x.arc(R() * w, R() * h, 20 + R() * 70, 0, 7); x.fill(); }
    for (let i = 0; i < 9000; i++) { x.fillStyle = R() < .5 ? 'rgba(0,0,0,.18)' : 'rgba(255,255,255,.1)'; x.fillRect(R() * w, R() * h, 1.5, 1.5); }
    x.strokeStyle = 'rgba(0,0,0,.2)'; x.lineWidth = 2; x.strokeRect(1, 1, w - 2, h - 2); x.fillStyle = 'rgba(0,0,0,.35)'; [[.25, .25], [.75, .25], [.25, .75], [.75, .75]].forEach(([u, v]) => { x.beginPath(); x.arc(u * w, v * h, 4, 0, 7); x.fill(); }); },
  concreteF(x, w, h) { P.concrete(x, w, h); x.fillStyle = 'rgba(20,14,8,.25)'; x.beginPath(); x.ellipse(w * .3, h * .6, 60, 30, 0, 0, 7); x.fill(); },
  planks(x, w, h, base) { const R = rng(5), n = 4, pw = w / n; base = base || ['#9a6a40', '#8a5f38', '#a87448', '#7e5532'];
    for (let i = 0; i < n; i++) { let y = -R() * h * .5; while (y < h) { const len = h * (.35 + R() * .45); x.fillStyle = base[Math.floor(R() * base.length)]; x.fillRect(i * pw, y, pw, len);
        x.strokeStyle = 'rgba(0,0,0,.09)'; x.lineWidth = 2; for (let j = 0; j < 3; j++) { const fx = i * pw + pw * (.2 + R() * .6); x.beginPath(); x.moveTo(fx, y); x.lineTo(fx + (R() - .5) * 6, y + len); x.stroke(); }
        x.fillStyle = 'rgba(0,0,0,.45)'; x.fillRect(i * pw, y + len - 3, pw, 3); y += len; }
      x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(i * pw, 0, 3, h); x.fillStyle = 'rgba(255,255,255,.07)'; x.fillRect(i * pw + 3, 0, 2, h); } },
  walnut(x, w, h) { P.planks(x, w, h, ['#3a2416', '#2e1c10', '#45291a', '#281809']); x.fillStyle = 'rgba(230,180,34,.55)'; x.fillRect(0, 0, 3, h); x.fillRect(0, h / 2, w, 3); },
  panels(x, w, h) { x.fillStyle = '#e9eef0'; x.fillRect(0, 0, w, h); const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(255,255,255,.45)'); g.addColorStop(.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,.05)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(120,135,145,.45)'; x.fillRect(0, 0, 3, h); x.fillRect(0, h - 3, w, 3); },
  rubber(x, w, h, spk) { const R = rng(7); x.fillStyle = spk === 'r' ? '#161618' : '#3d4248'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 6000; i++) { const c0 = R(); x.fillStyle = spk === 'r' && c0 < .05 ? 'rgba(216,58,50,.7)' : spk === 't' && c0 < .05 ? 'rgba(20,184,166,.7)' : c0 < .5 ? 'rgba(0,0,0,.35)' : 'rgba(255,255,255,.08)'; x.fillRect(R() * w, R() * h, 2, 2); }
    x.fillStyle = 'rgba(0,0,0,.6)'; x.fillRect(0, 0, w, 3); x.fillRect(0, 0, 3, h); x.fillStyle = 'rgba(255,255,255,.06)'; x.fillRect(3, 3, w, 2); },
  lamella(x, w, h) { x.fillStyle = '#1f2025'; x.fillRect(0, 0, w, h); for (let i = 0; i < 16; i++) { const X = i * w / 16, g = x.createLinearGradient(X, 0, X + w / 16, 0); g.addColorStop(0, '#34353b'); g.addColorStop(.6, '#25262b'); g.addColorStop(1, '#111114'); x.fillStyle = g; x.fillRect(X + 1, 0, w / 16 - 2, h); } },
  damask(x, w, h) { x.fillStyle = '#3b1d2e'; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(230,180,34,.16)';
    for (let r = 0; r < 4; r++) for (let i = 0; i < 4; i++) { const cx = (i + (r % 2) * .5) * w / 4, cy = (r + .5) * h / 4; x.beginPath(); x.moveTo(cx, cy - 26); x.quadraticCurveTo(cx + 16, cy, cx, cy + 26); x.quadraticCurveTo(cx - 16, cy, cx, cy - 26); x.fill(); x.beginPath(); x.arc(cx, cy, 4, 0, 7); x.fill(); } }
};
const TEXW = { brick: [2, 1.6], concrete: [2.4, 2.4], panels: [1.6, 6], lamella: [1.6, 4], damask: [1.4, 1.4] };
const TEXF = { planks: [1.4, 4], concreteF: [3, 3], rubber: [1, 1], rubberR: [1, 1], walnut: [1.4, 4] };
function wallMat(k) { return texMat('w' + k, 512, 512, P[k]); }
function floorMat(k) { return texMat('f' + k, 512, k === 'planks' || k === 'walnut' ? 1024 : 512, k === 'rubber' ? (x, w, h) => P.rubber(x, w, h, 't') : k === 'rubberR' ? (x, w, h) => P.rubber(x, w, h, 'r') : P[k]); }

/* ---------- Raum-Daten (Werte wie in scene.js / drawGymStatic) ---------- */
const ROOMS = [
  { wall: 'concrete', floor: 'concreteF', trim: '#5a5752', frame: '#2a3a44', light: 'bulb', mood: [.85, 1.6, '#ffe2b0'],
    wins: L => [[L.W * .34, 25, L.W * .2, L.yF * .24, 1]], mirror: [.03, .25], case: .66, slots: [[.6, .2], [.84, .22]] },
  { wall: 'brick', floor: 'planks', trim: '#5e4a2e', frame: '#5e4a2e', light: 'tubes', mood: [1.15, 2.2, '#fff1d6'],
    wins: L => [.35, .515].map(fx => [L.W * fx, L.yF * .14, L.W * .135, L.yF * .38, 2]), mirror: [.03, .28], case: .91, slots: [[.72, .16], [.8, .5]] },
  { wall: 'panels', floor: 'rubber', trim: '#14b8a6', frame: '#c9d2d8', light: 'panels', mood: [1.35, 2.1, '#f2f8ff'],
    wins: L => [0, 1, 2].map(i => [L.W * (.335 + i * .11), 26, L.W * .095, L.yF * .62, 1]), mirror: [.03, .31], case: .7, slots: [[.88, .2]] },
  { wall: 'lamella', floor: 'rubberR', trim: '#d83a32', frame: '#0d0d10', light: 'spots', mood: [.7, 2.4, '#ffe8d0'],
    wins: L => [[L.W * .36, 22, L.W * .26, L.yF * .32, 2]], mirror: [.02, .32], case: .7, slots: [[.86, .2], [.66, .66]] },
  { wall: 'damask', floor: 'walnut', trim: '#c9971c', frame: '#c9971c', light: 'stage', mood: [.85, 2, '#ffe6b8'],
    wins: L => [.335, .535].map(fx => [L.W * fx, 68, L.W * .13, L.yF * .5, 2]), mirror: [.02, .32], case: .72, slots: [[.8, .18]] }
];
export const roomInfo = gym => ROOMS[gym];

/* ---------- Fenster: Laibung, Rahmen, Bank, Sprossen (ohne Glas) ---------- */
function windowParts(g, w, zW, frameCol, mull, gym) {
  const M = tm(frameCol), pl = tm(gym === 4 ? '#2a1209' : gym === 3 ? '#1a1a1e' : gym === 2 ? '#dfe5e8' : '#e4d7b9', { rim: false });
  const dep = gym === 2 ? .2 : .32, cx = (w.x0 + w.x1) / 2, cy = (w.y0 + w.y1) / 2, ww = w.x1 - w.x0, wh = w.y1 - w.y0, t = gym === 2 ? .06 : .09;
  box(g, pl, cx, w.y0 - .005, zW - dep / 2, ww, .01, dep, 0); box(g, pl, cx, w.y1 + .005, zW - dep / 2, ww, .01, dep, 0);
  box(g, pl, w.x0 - .005, cy, zW - dep / 2, .01, wh, dep, 0); box(g, pl, w.x1 + .005, cy, zW - dep / 2, .01, wh, dep, 0);
  box(g, M, cx, w.y1 + t / 2, zW + .03, ww + t * 2, t, .07); box(g, M, cx, w.y0 - t / 2, zW + .03, ww + t * 2, t, .07);
  box(g, M, w.x0 - t / 2, cy, zW + .03, t, wh, .07); box(g, M, w.x1 + t / 2, cy, zW + .03, t, wh, .07);
  if (gym === 1 || gym === 4) box(g, tm(gym === 4 ? '#c9971c' : '#efe6d2'), cx, w.y0 - t - .03, zW + .1, ww + t * 3.4, .06, .26);
  const zg = zW - dep + .03; box(g, M, cx, w.y0 + .025, zg, ww, .05, .04, .7); box(g, M, cx, w.y1 - .025, zg, ww, .05, .04, .7);
  if (mull >= 1) box(g, M, cx, cy, zg, .05, wh, .04, .7); if (mull >= 2) box(g, M, cx, cy, zg, ww, .05, .04, .7);
  if (gym === 0) for (let i = 1; i < 5; i++) cyl(g, tm('#3a3d44'), w.x0 + ww * i / 5, cy, zW - .05, .012, wh, null, .4); // Kellergitter
}

/* ---------- Poster (ändern sich mit Erfolgen) ---------- */
export function posterList() { const S = MK.S, st = S.stats, out = [];
  if ((st.tourneys || 0) >= 1) out.push({ id: 'champ', t1: 'CHAMPION', t2: (st.tourneys > 1 ? st.tourneys + '× ' : '') + 'Turniersieger', bg: '#1d1f24', fg: '#f2c230', ic: 'cup' });
  if ((st.rivalWins || 0) >= 1) out.push({ id: 'rival', t1: 'RIVALE', t2: 'besiegt' + (st.rivalWins > 1 ? ' ×' + st.rivalWins : ''), bg: '#d83a32', fg: '#fff', ic: 'fist' });
  const rec = [1e6, 1e5, 1e4, 1000].find(n => (st.reps || 0) >= n); if (rec) out.push({ id: 'rek' + rec, t1: 'REKORD', t2: MK.fmt(rec) + ' Wdh.', bg: '#2f6fd1', fg: '#fff', ic: 'star' });
  if ((st.beasts || 0) >= 25) out.push({ id: 'beast', t1: 'BEAST', t2: 'MODE', bg: '#141414', fg: '#ff5a1f', ic: 'flame' });
  if (S.fame > 40) out.push({ id: 'du', t1: 'DU!', t2: 'Trainier hart', bg: '#f1efe9', fg: '#d83a32', ic: 'arm' });
  return out; }
function posterPaint(p) { return (x, w, h) => { x.fillStyle = p.bg; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(255,255,255,.25)'; x.lineWidth = 6; x.strokeRect(10, 10, w - 20, h - 20);
  x.fillStyle = p.fg; x.strokeStyle = p.fg; x.lineWidth = 12; x.lineCap = x.lineJoin = 'round'; const cx = w / 2, cy = h * .36;
  if (p.ic === 'cup') { x.beginPath(); x.moveTo(cx - 50, cy - 50); x.lineTo(cx + 50, cy - 50); x.quadraticCurveTo(cx + 46, cy + 20, cx, cy + 26); x.quadraticCurveTo(cx - 46, cy + 20, cx - 50, cy - 50); x.fill(); x.fillRect(cx - 8, cy + 24, 16, 26); x.fillRect(cx - 34, cy + 48, 68, 14); [-1, 1].forEach(s => { x.beginPath(); x.arc(cx + s * 52, cy - 26, 18, s > 0 ? -1.6 : 1.6, s > 0 ? 1.6 : 4.7, s < 0); x.stroke(); }); }
  if (p.ic === 'fist') { x.beginPath(); x.roundRect(cx - 44, cy - 34, 88, 64, 18); x.fill(); x.fillStyle = p.bg; for (let i = 0; i < 3; i++) x.fillRect(cx - 22 + i * 22, cy - 34, 4, 30); x.fillStyle = p.fg; x.fillRect(cx - 26, cy + 26, 52, 40); }
  if (p.ic === 'star') { x.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 26 : 60; x.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } x.closePath(); x.fill(); }
  if (p.ic === 'flame') { x.beginPath(); x.moveTo(cx, cy - 64); x.quadraticCurveTo(cx + 60, cy, cx + 30, cy + 50); x.quadraticCurveTo(cx, cy + 30, cx - 30, cy + 50); x.quadraticCurveTo(cx - 60, cy, cx, cy - 64); x.fill(); }
  if (p.ic === 'arm') { x.beginPath(); x.arc(cx, cy - 18, 26, 0, 7); x.fill(); x.fillRect(cx - 30, cy + 8, 60, 46); x.fillRect(cx - 62, cy + 8, 124, 16); }
  x.textAlign = 'center'; x.fillStyle = p.fg; x.font = `900 ${h * .13}px "Arial Black", Arial, sans-serif`; x.fillText(p.t1, cx, h * .78); x.font = `700 ${h * .065}px Arial, sans-serif`; x.fillText(p.t2, cx, h * .88); }; }

/* ---------- Pokal-Regal: alle Turniere, gewonnene Pokale glänzen ---------- */
const TCOL = { bronze: ['#cd7f32', '#8a5320'], silber: ['#e3e8ee', '#9aa3ad'], gold: ['#f2c230', '#a77d0e'], platin: ['#cfeef7', '#7fb7c9'], diamant: ['#8ff0ff', '#2fa9c9'] };
let CUP = null;
function cupGeo() { if (CUP) return CUP; const pts = [[0, 0], [.42, 0], [.42, .08], [.14, .12], [.1, .3], [.12, .36], [.46, .5], [.5, 1], [.44, 1], [.4, .55], [0, .5]].map(([x, y]) => new THREE.Vector2(x, y)); CUP = new THREE.LatheGeometry(pts, 22); return CUP; }
function trophyShelf(g, C, L, gym, wx, wy, zW, anchors) {
  const S = MK.S, cx = L.W * ROOMS[gym].case, cw = Math.min(L.W * .14, 120), sy0 = L.yF * .14, chh = L.yF * .26;
  if (!MK.TOURNEYS.some(T => S.trophies[T.id]) && S.fame < 10) return;
  const z = zW + .22, x0 = wx(C, cx - cw / 2, C.zw - .22), x1 = wx(C, cx + cw / 2, C.zw - .22), yT = wy(C, sy0, C.zw - .22), yB = wy(C, sy0 + chh, C.zw - .22), W = x1 - x0, H = yT - yB, xc = (x0 + x1) / 2;
  const wood = tm('#4a321c'), back = tm('#24303a', { rim: false });
  box(g, back, xc, (yT + yB) / 2, zW + .02, W, H, .04, 0); box(g, wood, xc, yT + .04, z - .1, W + .12, .08, .4); box(g, wood, xc, yB - .04, z - .1, W + .12, .08, .4);
  [-1, 1].forEach(s => box(g, wood, xc + s * (W / 2 + .03), (yT + yB) / 2, z - .1, .06, H + .16, .4)); box(g, wood, xc, yB + H / 2, z - .1, W, .04, .36, .6);
  const n = MK.TOURNEYS.length, per = Math.ceil(n / 2);
  MK.TOURNEYS.forEach((T, i) => { const row = i < per ? 1 : 0, col = i % per, x = x0 + W * (col + .5) / per, y = row ? yB + H / 2 + .02 : yB + .02, won = S.trophies[T.id] || 0, sc = Math.min(W / per * .42, H / 2 * .62) * (1 + T.tier * .04);
    if (!won) { box(g, tm('#2f3a44', { rim: false }), x, y + .015, z - .05, sc * .7, .03, sc * .5, 0); return; }
    const col2 = TCOL[T.trophy] || TCOL.gold, cup = inked(cupGeo(), tm(col2[0], { emissive: col2[1] }), .7); cup.position.set(x, y, z - .05); cup.scale.setScalar(sc); cup.castShadow = true; g.add(cup);
    box(g, glow('#ffffff'), x - sc * .2, y + sc * .72, z - .05 + sc * .45, sc * .06, sc * .3, .005, 0);
    if (won > 1) for (let k = 1; k < Math.min(3, won); k++) { const c2 = inked(cupGeo(), tm(col2[0], { emissive: col2[1] }), .5); c2.position.set(x + (k % 2 ? 1 : -1) * sc * .55, y, z - .15); c2.scale.setScalar(sc * .6); g.add(c2); }
    anchors.trophies.push({ x, y: y + sc * .7, z: z - .05, r: sc }); });
}

/* ---------- Raum bauen ---------- */
export function buildRoom(gym, C, L, wx, wy, anchors) {
  const R = ROOMS[gym], g = new THREE.Group(), zW = -C.zw;
  const topY = wy(C, -20, C.zw) + .5, halfW = wx(C, C.W + 40, C.zw) + 1.5, wins = [];
  const WIN = R.wins(L).map(([sx, sy, sw, sh, mull]) => { wins.push([sx, sy, sw, sh, 0, 0]); return { x0: wx(C, sx, C.zw), x1: wx(C, sx + sw, C.zw), y1: wy(C, sy, C.zw), y0: wy(C, sy + sh, C.zw), mull }; });
  // Rückwand mit Fensterlöchern
  { const s = new THREE.Shape(); s.moveTo(-halfW, 0); s.lineTo(halfW, 0); s.lineTo(halfW, topY); s.lineTo(-halfW, topY); s.closePath();
    WIN.forEach(w => { const p = new THREE.Path(); p.moveTo(w.x0, w.y0); p.lineTo(w.x0, w.y1); p.lineTo(w.x1, w.y1); p.lineTo(w.x1, w.y0); p.closePath(); s.holes.push(p); });
    const geo = new THREE.ShapeGeometry(s), uv = geo.attributes.uv, [tw, th] = TEXW[R.wall]; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / tw, uv.getY(i) / th);
    const wall = new THREE.Mesh(geo, wallMat(R.wall)); wall.position.z = zW; wall.receiveShadow = true; g.add(wall); }
  WIN.forEach(w => windowParts(g, w, zW, R.frame, w.mull, gym));
  // Boden
  { const len = C.zw + 2, geo = new THREE.PlaneGeometry(halfW * 2, len), uv = geo.attributes.uv, [tw, th] = TEXF[R.floor];
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * halfW * 2 / tw, uv.getY(i) * len / th);
    const fl = new THREE.Mesh(geo, floorMat(R.floor)); fl.rotation.x = -Math.PI / 2; fl.position.z = zW + len / 2; fl.receiveShadow = true; g.add(fl); }
  box(g, tm(R.trim), 0, .07, zW + .03, halfW * 2, .14, .06);
  // ---- je Raum eigene Stimmung ----
  if (gym === 0) { // Keller: Rohr unter der Decke, Wasserfleck, Abfluss, Kisten
    const yp = wy(C, 18, C.zw - .25); cyl(g, tm('#6b6560'), 0, yp, zW + .25, .07, halfW * 2, 'x', .8); for (let x = -halfW + 1; x < halfW; x += 2.2) box(g, tm('#4a4743'), x, yp + .09, zW + .15, .06, .18, .2, .5);
    const xd = wx(C, L.W * .62, C.zw * .75); cyl(g, tm('#1a1a1a'), xd, .004, -C.zw * .75, .16, .01, null, 0);
    const xc = wx(C, L.W * .9, C.zw - .5); box(g, tm('#8a6a44'), xc, .25, zW + .5, .55, .5, .5); box(g, tm('#7a5c3a'), xc + .1, .7, zW + .45, .45, .4, .4); }
  if (gym === 1) { // Verein: Pfeiler, Deckenbalken, Wimpel, Vereinsschild, Sprossenwand
    const yb = wy(C, 7, C.zw - .3); box(g, tm('#8a6640'), 0, (yb + topY + .3) / 2, zW + .3, halfW * 2, topY + .3 - yb, .6);
    [WIN[0].x0 - .55, WIN[1].x1 + .55].forEach(x => { box(g, tm('#ad7f50'), x, yb / 2, zW + .12, .42, yb, .24); box(g, tm('#8f6640'), x, .35, zW + .14, .5, .7, .3); for (let y = .9; y < yb - .2; y += .42) box(g, tm('#d8ccb0', { rim: false }), x, y, zW + .243, .42, .025, .006, 0); });
    pennants(g, C, wy, halfW, zW); const sy = L.yF * .66, Y = wy(C, sy, C.zw), wv = wx(C, L.W * .61, C.zw) * 2;
    panel(g, texMat('sign', 1024, 160, signPaint('SV EISEN 1921'), { clamp: true }), tm('#5e4a2e'), 0, Y, zW + .05, wv, wv * 160 / 1024, .06, .8);
    const xs = wx(C, L.W * .315, C.zw - .2); [-1, 1].forEach(s => box(g, tm('#a8794a'), xs + s * .28, 1.25, zW + .14, .07, 2.5, .07)); for (let y = .25; y < 2.45; y += .24) cyl(g, tm('#c9a06a'), xs, y, zW + .14, .022, .56, 'x', .5); }
  if (gym === 2) { // Kette: türkise Linie, Pflanze, Uhr
    box(g, tm('#14b8a6', { emissive: '#0a5f55' }), 0, wy(C, L.yF * .5, C.zw), zW + .01, halfW * 2, .05, .02, 0);
    const xp = wx(C, L.W * .325, C.zw - .4); cyl(g, tm('#e9eef0'), xp, .25, zW + .4, .2, .5, null, .8); for (let i = 0; i < 7; i++) ball(g, tm(i % 2 ? '#2bb673' : '#1f8f55'), xp + Math.sin(i * 2.4) * .18, .7 + (i % 3) * .2, zW + .4 + Math.cos(i * 2.4) * .12, .17, .7);
    const xc2 = wx(C, L.W * .94, C.zw), yc = wy(C, L.yF * .22, C.zw); cyl(g, tm('#ffffff'), xc2, yc, zW + .04, .28, .05, 'z', .8); box(g, tm('#141414'), xc2, yc + .08, zW + .08, .025, .16, .01, 0); box(g, tm('#141414'), xc2 + .06, yc, zW + .08, .12, .025, .01, 0); }
  if (gym === 3) { // Profi: rote Streifen, Hebe-Plattform vorne, Kreide-Schale
    const yr = wy(C, L.yF * .55, C.zw); box(g, tm('#d83a32', { emissive: '#4a0e0b' }), 0, yr, zW + .02, halfW * 2, .1, .04, 0); box(g, tm('#d83a32'), 0, yr - .17, zW + .02, halfW * 2, .03, .03, 0);
    { const zf = C.d * .92, xa = wx(C, L.W * .32, zf), xb = wx(C, L.W * .68, zf); box(g, tm('#3a2a1a'), (xa + xb) / 2, .02, -zf, xb - xa, .04, 1.6, .6); box(g, tm('#5a4128'), (xa + xb) / 2, .03, -zf, (xb - xa) * .5, .04, 1.6, .4); }
    [-1, 1].forEach(s => box(g, tm('#d83a32', { rim: false }), s * 3.1, .005, zW + C.zw / 2, .08, .01, C.zw, 0));
    const xk = wx(C, L.W * .9, C.zw - .5); cyl(g, tm('#3a3d44'), xk, .45, zW + .5, .05, .9, null, .6); cyl(g, tm('#c9d0d8'), xk, .92, zW + .5, .26, .12, null, .8); ball(g, tm('#ffffff'), xk, .96, zW + .5, [.22, .06, .22], 0); }
  if (gym === 4) { // Tempel: Holzvertäfelung mit Goldleiste, Vorhänge, Goldband, Titel
    const yp = wy(C, L.yF * .72, C.zw); box(g, tm('#2a1209'), 0, yp / 2, zW + .06, halfW * 2, yp, .1); box(g, tm('#c9971c', { emissive: '#4a3505' }), 0, yp, zW + .12, halfW * 2, .06, .06);
    for (let x = -halfW + .6; x < halfW; x += 1.6) box(g, tm('#3a1a0c'), x, yp * .5, zW + .12, 1.2, yp * .6, .02, .5);
    box(g, tm('#e6b422', { emissive: '#5a4208' }), 0, wy(C, 4, C.zw - .1), zW + .1, halfW * 2, .2, .1);
    const tw = wx(C, L.W * .5 + L.W * .2, C.zw) * 2; panel(g, texMat('tempel', 1024, 128, signPaint('★ MUSKEL-TEMPEL ★', '#1a0a10', '#e6b422'), { clamp: true }), tm('#c9971c'), 0, wy(C, 40, C.zw), zW + .06, tw, tw * 128 / 1024, .06, .8);
    [[0, .12], [.88, 1]].forEach(([a, b]) => curtain(g, wx(C, L.W * a, C.zw - .5), wx(C, L.W * b, C.zw - .5), topY, zW + .5)); }
  // Lampen dort, wo scene.js ihr Licht zeichnet
  lamps(g, C, L, R.light, wx, wy);
  // Poster
  const posters = posterList(); R.slots.forEach(([fx, fy], i) => { const p = posters[i]; if (!p) return; const x = wx(C, L.W * fx, C.zw), Y = wy(C, L.yF * fy, C.zw) - .4;
    panel(g, texMat('poster:' + p.id + p.t2, 256, 360, posterPaint(p), { clamp: true }), tm('#141414'), x, Y, zW + .03, .48, .67, .02, .7); });
  trophyShelf(g, C, L, gym, wx, wy, zW, anchors);
  return { g, wins };
}
const signPaint = (txt, bg, fg) => (x, w, h) => { x.fillStyle = bg || '#6b4a2b'; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(255,255,255,.08)'; for (let i = 0; i < 6; i++) x.fillRect(0, i * h / 6, w, 2);
  x.strokeStyle = fg ? 'rgba(230,180,34,.6)' : '#3a2614'; x.lineWidth = 8; x.strokeRect(4, 4, w - 8, h - 8);
  x.fillStyle = fg || '#f2e3bf'; x.font = `700 ${h * .5}px Georgia, serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, w / 2, h * .54); };
function pennants(g, C, wy, halfW, zW) {
  const z = zW + .35, n = Math.ceil(halfW * 2 / .5), cols = [tm('#d83a32'), tm('#f4f1ea'), tm('#2f6fd1')], tri = new THREE.BufferGeometry();
  tri.setAttribute('position', new THREE.Float32BufferAttribute([-.21, 0, 0, 0, -.36, 0, .21, 0, 0], 3)); tri.computeVertexNormals();
  const Y0 = wy(C, 22, C.zw - .35), pts = [];
  for (let i = 0; i <= n; i++) { const x = -halfW + i / n * halfW * 2, sag = Math.sin(((x / (halfW * 2 / 3)) % 1 + 1) % 1 * Math.PI) * .22; pts.push([x, Y0 - sag, z]); }
  tube(g, tm('#2c2f36'), pts, .012, 0);
  pts.forEach((p, i) => { if (i === n) return; const q = pts[i + 1], m = inked(tri, cols[i % 3], .7); m.position.set((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, z); m.rotation.z = Math.atan2(q[1] - p[1], q[0] - p[0]); m.rotation.x = -.18; m.castShadow = true; g.add(m); });
}
function curtain(g, xa, xb, top, z) { // samtiger Vorhang aus Falten
  const n = Math.max(3, Math.round((xb - xa) / .28)), m = tm('#8a1a30'), m2 = tm('#5a0f1f');
  for (let i = 0; i < n; i++) cyl(g, i % 2 ? m2 : m, xa + (i + .5) * (xb - xa) / n, top / 2, z + (i % 2 ? -.06 : 0), (xb - xa) / n * .62, top, null, i % 2 ? 0 : .8);
}
function lamps(g, C, L, type, wx, wy) {
  const zl = (C.d + C.zw) * .55, at = (fx, sy) => [wx(C, L.W * fx, zl), wy(C, sy, zl)];
  if (type === 'tubes') [.2, .5, .8].forEach(fx => { const [x, Y] = at(fx, 9), lw = Math.min(1.3, (wx(C, L.W * fx + 30, zl) - x) * 2);
    box(g, tm('#e9edf0'), x, Y + .03, -zl, lw, .06, .16); box(g, glow('#fffbe8'), x, Y - .01, -zl, lw * .92, .03, .1, 0); [-1, 1].forEach(s => cyl(g, tm('#2c2f36'), x + s * lw * .35, Y + 1.5, -zl, .006, 3, null, .3, CYL8)); });
  if (type === 'panels') [0, 1, 2, 3].forEach(i => { const [x, Y] = at(.12 + i * .25, 5), lw = Math.min(1.2, (wx(C, L.W * (.12 + i * .25) + 24, zl) - x) * 2);
    box(g, tm('#f1f4f6'), x, Y + .04, -zl, lw, .05, .6); box(g, glow('#f6fbff'), x, Y + .01, -zl, lw * .9, .02, .5, 0); });
  if (type === 'spots' || type === 'stage') { const xs = type === 'spots' ? [.14, .38, .62, .86] : [.25, .5, .75], cols = ['#ffd27a', '#ff8ab0', '#a08cff'];
    xs.forEach((fx, i) => { const [x, Y] = at(fx, type === 'spots' ? 10 : 12); cyl(g, tm('#1b1b1e'), x, Y + 1, -zl, .015, 2, null, .3, CYL8); const can = cyl(g, tm('#1b1b1e'), x, Y + .05, -zl, .12, .22, null, .8); can.rotation.x = .35;
      cyl(g, glow(type === 'stage' ? cols[i % 3] : '#fff0d0'), x, Y - .06, -zl + .04, .09, .02, null, 0).rotation.x = .35; }); }
  if (type === 'bulb') { const [x, Y] = at(.5, 0); cyl(g, tm('#222'), x, Y + .05, -zl, .06, .08, null, .5); }
}
