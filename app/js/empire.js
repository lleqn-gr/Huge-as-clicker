/* Muskelklicker – Imperium-Ansicht.
   Oben (1/3): Mini-Stadt von oben mit Vierteln je Geschäft. Sie wächst und zoomt heraus: Block → Stadtteil → Stadt → Großstadt → Land → Erde → All.
   Unten (2/3): eine Reihe je Geschäft (wie Cookie Clicker). Jedes Stück ist eine kleine Figur mit 2 Bildern im Wechsel.
   Jede Ausbaustufe wertet die Reihe sichtbar auf: neues Aussehen der Figuren, edlerer Hintergrund, Rahmen von Rost bis Regenbogen. */
window.MK = window.MK || {};
(function (MK) {
const Sc = MK.Scene, TAU = Math.PI * 2, rnd = (a, b) => a + Math.random() * (b - a), clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
const INK = '#141414';
const mixC = (a, b, t) => { const p = h0 => { const h = h0.length === 4 ? '#' + [...h0.slice(1)].map(ch => ch + ch).join('') : h0; return [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); }, P2 = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), A = p(a), Bc = p(b); return '#' + A.map((v, i) => Math.round(v + (Bc[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
const COL = { pfand: '#2f6f45', shake: '#ff8fab', pt: '#f4a259', merch: '#5bc0be', coach: '#9d8df1', supp: '#e07a5f', kette: '#f2c14e', app: '#4ea8de', tv: '#b8c0cc', konzern: '#8d99ae', space: '#3d405b' };
const FRAME = ['#6b4a2b', '#8b5a2b', '#cd7f32', '#c9ced4', '#e6b422', '#bfe7f2', '#7fe3ff', null]; // null = Regenbogen
const MAT = ['Rostig', 'Holz', 'Bronze', 'Silber', 'Gold', 'Platin', 'Diamant', 'Legendär'];
const STAGES = ['Dein Block', 'Stadtteil', 'Stadt', 'Großstadt', 'Deutschland', 'Die Welt', 'Das All'];
const E = { scroll: 0, scrollT: 0, focus: null, flash: {}, coins: [], grow: {}, rain: {}, bills: [], stage: -1, stageAnim: 0, rows: [], hit: [], drag: null };

const upsOf = id => MK.S.bizUp.filter(u => u.startsWith(id + ':')).length; // gekaufte Ausbaustufen 0..7
const lookOf = u => Math.min(3, Math.floor((u + 1) / 2)); // Aussehen der Figuren: 0..3 (ändert sich mit jedem 2. Ausbau)

MK.on('biz', e => { E.focus = e.B.id; E.scrollT = 3; E.flash[e.B.id] = 1; const n = MK.bizCount(e.B.id), now = performance.now(); for (let k = Math.max(n - e.n, n - 6); k < n; k++) E.grow[e.B.id + ':' + k] = now + (k - Math.max(n - e.n, n - 6)) * 140; }); // neue Einheiten werden sichtbar gebaut
MK.on('bizUp', u => { if (u.B) { E.focus = u.B.id; E.scrollT = 3; E.flash[u.B.id] = 1.6; E.rain[u.B.id] = 1.8; } }); // ×2: Geldscheine regnen über der Reihe
MK.on('perk', p => { E.focus = p.id; E.scrollT = 3; E.flash[p.id] = 1.2; });

/* ---------- kleine Zeichen-Helfer ---------- */
const R = (c, x, y, w, h, col, ink) => { c.fillStyle = col; c.fillRect(x, y, w, h); if (ink !== false) { c.strokeStyle = INK; c.lineWidth = 1.2; c.strokeRect(x, y, w, h); } };
const O = (c, x, y, r, col, ink) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, Math.max(.5, r), 0, TAU); c.fill(); if (ink !== false) { c.strokeStyle = INK; c.lineWidth = 1.1; c.stroke(); } };
const T = (c, x1, y1, x2, y2, x3, y3, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineTo(x3, y3); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.1; c.stroke(); };
function guy(c, x, y, s, shirt, f, bend, extra) { // Mini-Person: Kopf, Körper, Beine; bend = vorgebeugt
  const lean = bend ? (f ? .55 : .1) : 0, hx = x + lean * 5 * s, hy = y - 13 * s + lean * 4 * s;
  c.strokeStyle = INK; c.lineWidth = 1.6 * s; c.beginPath(); c.moveTo(x - 1.6 * s, y); c.lineTo(x - .8 * s, y - 5 * s); c.moveTo(x + 1.6 * s, y); c.lineTo(x + .8 * s, y - 5 * s); c.stroke();
  c.fillStyle = shirt; c.beginPath(); c.moveTo(x - 2.4 * s, y - 5 * s); c.lineTo(hx - 2.4 * s, hy + 2.5 * s); c.lineTo(hx + 2.4 * s, hy + 2.5 * s); c.lineTo(x + 2.4 * s, y - 5 * s); c.closePath(); c.fill(); c.stroke();
  O(c, hx, hy, 2.4 * s, '#e0ac7e'); if (extra) extra(hx, hy);
}

const SPR = new Proxy({}, { get: (_, k) => MK.EMP_SPR[k] });
// Reihen-Hintergründe: werden mit dem Ausbau edler (dreckig → sauber → Licht → Glanz)
function rowBg(c, B, x, y, w, h, u, t) {
  const base = COL[B.id]; c.fillStyle = base; c.globalAlpha = .28 + u * .05; c.fillRect(x, y, w, h); c.globalAlpha = 1;
  if (u <= 1) { c.fillStyle = 'rgba(60,40,20,.12)'; for (let i = 0; i < w; i += 23) c.fillRect(x + i, y + h * .55 + (i % 3), 9, 3); }
  if (u >= 2) { c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 1; for (let i = 0; i < w; i += 18) { c.beginPath(); c.moveTo(x + i, y); c.lineTo(x + i, y + h); c.stroke(); } }
  if (u >= 4) { const g = c.createLinearGradient(x, y, x, y + h); g.addColorStop(0, 'rgba(255,255,255,.22)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(x, y, w, h); }
  if (u >= 6) for (let i = 0; i < 6; i++) { const sx = x + ((t * 30 + i * 97) % w), sy = y + 4 + (i * 13) % (h - 8); c.fillStyle = `rgba(255,255,220,${.5 + .5 * Math.sin(t * 5 + i)})`; c.fillRect(sx, sy, 2, 2); }
  // Detail-Update: Rückwand mit Licht von oben, Boden mit Fliesenfugen, Deckenlampen mit warmem Lichtkegel
  { const fy = y + h * .64, g = c.createLinearGradient(0, y, 0, fy); g.addColorStop(0, 'rgba(255,255,255,.08)'); g.addColorStop(1, 'rgba(0,0,0,.08)'); c.fillStyle = g; c.fillRect(x, y, w, fy - y);
    const g2 = c.createLinearGradient(0, fy, 0, y + h); g2.addColorStop(0, 'rgba(0,0,0,.18)'); g2.addColorStop(1, 'rgba(0,0,0,.32)'); c.fillStyle = g2; c.fillRect(x, fy, w, y + h - fy);
    c.fillStyle = 'rgba(255,255,255,.07)'; c.fillRect(x, fy, w, 1.2); c.strokeStyle = 'rgba(255,255,255,.05)'; c.lineWidth = 1; c.beginPath(); for (let i = 0; i < w + 40; i += 34) { c.moveTo(x + i, fy); c.lineTo(x + i - 14, y + h); } c.stroke();
    if (u >= 1) for (let i = 60; i < w; i += 150) { const lx = x + i, lg = c.createRadialGradient(lx, y + 2, 1, lx, y + 2, h * .9); lg.addColorStop(0, 'rgba(255,236,190,.22)'); lg.addColorStop(1, 'rgba(255,236,190,0)'); c.fillStyle = lg; c.fillRect(lx - h, y, h * 2, h); c.fillStyle = 'rgba(255,240,200,.85)'; c.fillRect(lx - 6, y + 1, 12, 2.5); } }
  c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x, y + h - 3, w, 3); // Boden-Kante
}
function frame(c, x, y, w, h, u, t) {
  const col = FRAME[u]; c.lineWidth = u >= 4 ? 3.5 : 2.5;
  if (col) c.strokeStyle = col; else { const g = c.createLinearGradient(x, 0, x + w, 0); ['#ff5a5a', '#ffc83d', '#2bb673', '#4ea8de', '#9d8df1'].forEach((k, i) => g.addColorStop((i / 4 + t * .2) % 1, k)); c.strokeStyle = g; }
  c.strokeRect(x + 1, y + 1, w - 2, h - 2);
}

/* ---------- Organische Stadt (einmal erzeugt, immer gleich) ---------- */
const CITY = (() => {
  const r = MK.seedRand('muskelstadt2'), roads = [], bld = [], parks = [], trees = [];
  const mk = (pts, kind) => { let len = 0; const seg = []; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); seg.push(l); len += l; } return { pts, seg, len, kind }; };
  function roadAtRaw(rd, d) { let i = 0; while (i < rd.seg.length - 1 && d > rd.seg[i]) { d -= rd.seg[i]; i++; } const a = rd.pts[i], b = rd.pts[i + 1] || a, t = rd.seg[i] ? Math.min(1, d / rd.seg[i]) : 0; return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, a: Math.atan2(b.y - a.y, b.x - a.x) }; }
  // Fluss (läuft quer durch, leicht geschwungen)
  const river = []; for (let i = 0; i <= 60; i++) { const t = i / 60, x = -900 + t * 1800; river.push({ x, y: Math.sin(t * 4.4 + .9) * 80 + Math.sin(t * 11) * 14 + 70 }); }
  const riverY = x => { const t = clamp((x + 900) / 1800, 0, 1); return Math.sin(t * 4.4 + .9) * 80 + Math.sin(t * 11) * 14 + 70; };
  const inRiver = (x, y, m) => Math.abs(y - riverY(x)) < 17 + (m || 0);
  // Belegungsraster: Straßen und Parks reservieren Fläche, damit nichts überlappt
  const occ = new Map(), ck = (x, y) => Math.floor(x / 8) + ',' + Math.floor(y / 8);
  const mark = (x, y, rad, tag) => { for (let dx = -rad; dx <= rad; dx += 8) for (let dy = -rad; dy <= rad; dy += 8) if (dx * dx + dy * dy <= rad * rad) occ.set(ck(x + dx, y + dy), tag); };
  const free = (x, y, rad) => { for (let dx = -rad; dx <= rad; dx += 6) for (let dy = -rad; dy <= rad; dy += 6) if (occ.has(ck(x + dx, y + dy))) return false; return true; };
  // Parks: nie im Fluss, nicht im Zentrum
  for (let n = 0; parks.length < 8 && n < 400; n++) { const a = r() * TAU, d = 90 + r() * 380, x = Math.cos(a) * d * 1.25, y = Math.sin(a) * d * .85, pr = 20 + r() * 26; if (inRiver(x, y, pr + 12) || parks.some(p => Math.hypot(p.x - x, p.y - y) < p.r + pr + 30)) continue; parks.push({ x, y, r: pr }); }
  const inPark = (x, y, m) => parks.some(p => Math.hypot(p.x - x, p.y - y) < p.r + (m || 0));
  // Straßen: Hauptachsen (dürfen den Fluss per Brücke queren), Ring, dann Seitenstraßen, die an Fluss und Park enden
  const grow = (x, y, ang, len, wob, step, kind, stopRiver) => { const pts = [{ x, y }]; let a = ang; for (let d = 0; d < len; d += step) { a += (r() - .5) * wob; let nx = x + Math.cos(a) * step, ny = y + Math.sin(a) * step; if (kind === 'main' && inRiver(nx, ny, 6) && Math.abs(Math.sin(a)) < .75) { a += (ny < riverY(nx) ? -1 : 1) * .5; nx = x + Math.cos(a) * step; ny = y + Math.sin(a) * step; } if ((stopRiver && inRiver(nx, ny, 4)) || (kind !== 'main' && inPark(nx, ny, 4))) break; x = nx; y = ny; pts.push({ x, y }); } return pts; };
  for (let k = 0; k < 5; k++) roads.push(mk(grow(0, 0, k / 5 * TAU + r() * .5, 720, .28, 22, 'main', false), 'main'));
  const ring = (rad, sx, sy, n) => { const pts = []; for (let i = 0; i <= n; i++) { const a = i / n * TAU, rr = rad + Math.sin(a * 3) * rad * .1; pts.push({ x: Math.cos(a) * rr * sx, y: Math.sin(a) * rr * sy }); } return pts; };
  [-1, 1].forEach(sd => { const pts = []; for (let x = -620; x <= 620; x += 20) pts.push({ x, y: riverY(x) + sd * 30 }); roads.push(mk(pts, 'main')); }); // Uferstraßen auf beiden Seiten
  const mains = roads.slice();
  mains.forEach(rd => { for (let d = 30; d < rd.len; d += 38 + r() * 45) { const p = roadAtRaw(rd, d), side = r() < .5 ? 1 : -1, pts = grow(p.x, p.y, p.a + side * (Math.PI / 2 + (r() - .5) * .6), 50 + r() * 110, .45, 14, 'side', true); if (pts.length > 2) roads.push(mk(pts, 'side')); } });
  roads.forEach(rd => { for (let d = 0; d <= rd.len; d += 6) { const p = roadAtRaw(rd, d); mark(p.x, p.y, rd.kind === 'main' ? 9 : 6, 'road'); } });
  parks.forEach(p => mark(p.x, p.y, p.r + 2, 'park'));
  // Gebäude an den Straßen: Größe und Art je Zone (Innenstadt groß, Wohngebiet klein, Gewerbe am Fluss)
  roads.forEach(rd => { for (let d = 6; d < rd.len; d += 12 + r() * 8) { const p = roadAtRaw(rd, d); [-1, 1].forEach(sd => { const dist = Math.hypot(p.x, p.y), zone = dist < 130 ? 'city' : (Math.abs(p.y - riverY(p.x)) < 70 && p.x > 60) ? 'ind' : 'res';
    const w = zone === 'city' ? 14 + r() * 10 : zone === 'ind' ? 16 + r() * 12 : 8 + r() * 6, h = zone === 'city' ? 12 + r() * 8 : zone === 'ind' ? 11 + r() * 8 : 7 + r() * 5;
    const off = (rd.kind === 'main' ? 9 : 6) + h / 2 + 2, x = p.x - Math.sin(p.a) * off * sd, y = p.y + Math.cos(p.a) * off * sd, rad = Math.max(w, h) / 2;
    if (inRiver(x, y, rad + 3) || !free(x, y, rad - 1)) return; mark(x, y, rad + 1, 'b'); bld.push({ x, y, w, h, a: p.a, d: dist, zone, tone: Math.floor(r() * 5), garden: zone === 'res' && r() < .5 }); }); } });
  parks.forEach(p => { for (let i = 0; i < 16; i++) { const a = r() * TAU, d = Math.sqrt(r()) * (p.r - 4); trees.push({ x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d, r: 2.8 + r() * 2.8 }); } });
  for (let i = 0; i < 900 && trees.length < 420; i++) { const a = r() * TAU, d = 60 + r() * 700, x = Math.cos(a) * d * 1.25, y = Math.sin(a) * d * .85; if (inRiver(x, y, 8) || !free(x, y, 5)) continue; mark(x, y, 4, 't'); trees.push({ x, y, r: 2.2 + r() * 2.2, out: true }); }
  const fields = []; for (let n = 0; fields.length < 46 && n < 900; n++) { const a = r() * TAU, d = 280 + r() * 520, x = Math.cos(a) * d * 1.3, y = Math.sin(a) * d * .9, w = 40 + r() * 60, h = 25 + r() * 40; if (inRiver(x, y, Math.max(w, h) / 2 + 6)) continue; fields.push({ x, y, w, h, a: r() * .6 - .3, c: ['#c9d47a', '#a8c46a', '#d9c77a', '#9cbf6a'][Math.floor(r() * 4)] }); }
  // Viertel mit Sinn: Shake am Park, Supplement-Fabrik im Gewerbe, Merch/Gym/Konzern in der Innenstadt, TV und Raketenstart draußen
  const cen = z => { const L = bld.filter(b => b.zone === z); return L[Math.floor(r() * L.length)] || { x: 0, y: 0 }; };
  const resB = bld.filter(b => b.zone === 'res').sort((a, b) => a.d - b.d), pick = i => resB[Math.min(resB.length - 1, i)] || { x: 0, y: 0 };
  const P0 = parks.slice().sort((a, b) => Math.hypot(a.x, a.y) - Math.hypot(b.x, b.y))[0] || { x: 80, y: -60, r: 20 };
  const dcMap = { pfand: pick(20), shake: { x: P0.x + P0.r + 12, y: P0.y }, pt: pick(60), merch: cen('city'), coach: pick(120), supp: cen('ind'), kette: cen('city'), app: cen('city'), tv: { x: -420, y: -230 }, konzern: { x: 8, y: -14 }, space: { x: 560, y: -300 } };
  const dc = MK.BIZ.map(B => ({ x: dcMap[B.id].x, y: dcMap[B.id].y }));
  const cars = []; roads.forEach(rd => { if (rd.kind === 'main') return; for (let d = 14; d < rd.len - 6; d += 9 + r() * 14) { if (r() > .45) continue; const p = roadAtRaw(rd, d), sd = r() < .5 ? 1 : -1; cars.push({ x: p.x - Math.sin(p.a) * 2.4 * sd, y: p.y + Math.cos(p.a) * 2.4 * sd, a: p.a, col: ['#d83a32', '#2f6fd1', '#f2f2f2', '#2a2a2e', '#ffc83d', '#2bb673', '#9aa0a8'][Math.floor(r() * 7)] }); } });
  return { roads, bld, parks, trees, river, dc, fields, roadAtRaw, riverY, cars };
})();
const roadAt = (rd, d) => CITY.roadAtRaw(rd, clamp(d, 0, rd.len));
const ROOF = { city: ['#9aa1ab', '#b6bcc4', '#8a929c', '#c9ccd2', '#7d8590'], res: ['#c2603e', '#a8503a', '#b8704a', '#8f4a36', '#c98a5a'], ind: ['#9a9a92', '#8a8d84', '#a9a69a', '#7f827a', '#b0aea2'] };
let cityC = null;
/* ======================= Stadt-Grafik: Texturen, Straßen, Gebäude ======================= */
const TEX = (() => { const cache = {}; const mk = (k, sz, fn) => (c) => { if (!cache[k]) { const cv = document.createElement('canvas'); cv.width = cv.height = sz; fn(cv.getContext('2d'), sz); cache[k] = cv; } return c.createPattern(cache[k], 'repeat'); };
  const rnd2 = MK.seedRand('tex');
  return {
    grass: mk('grass', 96, (g, n) => { g.fillStyle = '#8fbf62'; g.fillRect(0, 0, n, n); for (let i = 0; i < 900; i++) { const v = rnd2(); g.fillStyle = v < .33 ? 'rgba(70,120,40,.18)' : v < .66 ? 'rgba(190,225,120,.16)' : 'rgba(120,160,70,.14)'; g.fillRect(rnd2() * n, rnd2() * n, 1 + rnd2() * 2, 1 + rnd2() * 2); } }),
    asphalt: mk('asph', 48, (g, n) => { g.fillStyle = '#44484f'; g.fillRect(0, 0, n, n); for (let i = 0; i < 500; i++) { g.fillStyle = rnd2() < .5 ? 'rgba(0,0,0,.18)' : 'rgba(255,255,255,.07)'; g.fillRect(rnd2() * n, rnd2() * n, 1, 1); } }),
    walk: mk('walk', 16, (g, n) => { g.fillStyle = '#d9d2c3'; g.fillRect(0, 0, n, n); g.strokeStyle = 'rgba(0,0,0,.09)'; g.lineWidth = 1; g.strokeRect(.5, .5, 8, 8); g.strokeRect(8.5, 8.5, 8, 8); }),
    water: mk('water', 64, (g, n) => { const gr = g.createLinearGradient(0, 0, n, n); gr.addColorStop(0, '#3f86c9'); gr.addColorStop(1, '#3478b8'); g.fillStyle = gr; g.fillRect(0, 0, n, n); g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 1.2; for (let i = 0; i < 9; i++) { const x = rnd2() * n, y = rnd2() * n; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 3, y - 1.5, x + 7, y); g.stroke(); } })
  }; })();
const pathOf = (c, pts) => { c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); };
function drawGround(c, R) {
  // sanfte Hügel-Schattierung und Felder
  for (let i = 0; i < 14; i++) { const r0 = MK.seedRand('hill' + i), x = (r0() - .5) * 1600, y = (r0() - .5) * 1000, rr = 120 + r0() * 220, g = c.createRadialGradient(x, y, 0, x, y, rr); g.addColorStop(0, r0() < .5 ? 'rgba(60,110,40,.16)' : 'rgba(220,240,160,.14)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
  CITY.fields.forEach(f => { if (Math.hypot(f.x, f.y) < R * .95) return; c.save(); c.translate(f.x, f.y); c.rotate(f.a);
    c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(-f.w / 2 + 2, -f.h / 2 + 2, f.w, f.h);
    const g = c.createLinearGradient(-f.w / 2, 0, f.w / 2, 0); g.addColorStop(0, f.c); g.addColorStop(1, mixC(f.c, '#000000', .12)); c.fillStyle = g; c.fillRect(-f.w / 2, -f.h / 2, f.w, f.h);
    c.strokeStyle = mixC(f.c, '#000000', .22); c.lineWidth = 1; for (let k = -f.w / 2 + 3; k < f.w / 2; k += 4.5) { c.beginPath(); c.moveTo(k, -f.h / 2 + 1); c.lineTo(k, f.h / 2 - 1); c.stroke(); }
    c.strokeStyle = '#4c7f34'; c.lineWidth = 2.4; c.strokeRect(-f.w / 2, -f.h / 2, f.w, f.h); c.restore(); });
}
function drawRiver(c) {
  c.lineCap = 'round'; c.lineJoin = 'round';
  c.strokeStyle = '#d8c79a'; c.lineWidth = 46; pathOf(c, CITY.river); c.stroke();          // Sandufer
  c.strokeStyle = '#bfae7f'; c.lineWidth = 40; c.stroke();
  c.strokeStyle = '#2e6aa6'; c.lineWidth = 35; c.stroke();                               // tiefes Wasser
  c.strokeStyle = TEX.water(c); c.lineWidth = 30; c.stroke();
  c.strokeStyle = 'rgba(160,215,255,.35)'; c.lineWidth = 10; c.stroke();                  // Strömung in der Mitte
  c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1.2; c.setLineDash([10, 22]); c.lineDashOffset = 0; c.stroke(); c.setLineDash([]);
}
function drawRoads(c, R) {
  const vis = (rd, p) => Math.hypot(p.x, p.y) < R * (rd.kind === 'main' ? 1.6 : 1.08);
  const segs = rd => { const out = []; let cur = []; rd.pts.forEach(p => { if (vis(rd, p)) cur.push(p); else { if (cur.length > 1) out.push(cur); cur = []; } }); if (cur.length > 1) out.push(cur); return out; };
  c.lineCap = 'round'; c.lineJoin = 'round';
  const pass = (fn) => CITY.roads.forEach(rd => segs(rd).forEach(pts => fn(rd, pts, rd.kind === 'main')));
  pass((rd, pts, m) => { c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = m ? 21 : 15; c.save(); c.translate(1.5, 2); pathOf(c, pts); c.stroke(); c.restore(); }); // Schatten
  pass((rd, pts, m) => { c.strokeStyle = '#a8a294'; c.lineWidth = m ? 20 : 14; pathOf(c, pts); c.stroke(); });   // Bordstein
  pass((rd, pts, m) => { c.strokeStyle = TEX.walk(c); c.lineWidth = m ? 18.5 : 12.5; pathOf(c, pts); c.stroke(); }); // Gehweg
  pass((rd, pts, m) => { c.strokeStyle = '#2f3237'; c.lineWidth = m ? 13 : 8.4; pathOf(c, pts); c.stroke(); });
  pass((rd, pts, m) => { c.strokeStyle = TEX.asphalt(c); c.lineWidth = m ? 12 : 7.6; pathOf(c, pts); c.stroke(); });   // Asphalt
  pass((rd, pts, m) => { if (!m) return; c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = .7; c.setLineDash([5, 5]); pathOf(c, pts); c.stroke(); c.setLineDash([]); // Mittelstreifen + Randlinien
    [-1, 1].forEach(sd => { c.save(); c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = .5; c.beginPath(); pts.forEach((p, i) => { const q = pts[Math.min(pts.length - 1, i + 1)], o = pts[Math.max(0, i - 1)], a = Math.atan2(q.y - o.y, q.x - o.x), x = p.x - Math.sin(a) * 5 * sd, y = p.y + Math.cos(a) * 5 * sd; i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke(); c.restore(); }); });
  // Zebrastreifen, wo Seitenstraßen beginnen
  CITY.roads.forEach(rd => { if (rd.kind === 'main' || !vis(rd, rd.pts[0])) return; const p = CITY.roadAtRaw(rd, 9); c.save(); c.translate(p.x, p.y); c.rotate(p.a); c.fillStyle = 'rgba(255,255,255,.85)'; for (let i = -3; i <= 3; i++) c.fillRect(-2, i * 1.1 - .35, 4, .7); c.restore(); });
  // Brücken über den Fluss: Fahrbahn mit Geländer und Schatten aufs Wasser
  CITY.roads.forEach(rd => { if (rd.kind !== 'main') return; for (let k = 1; k < rd.pts.length; k++) { const a = rd.pts[k - 1], b = rd.pts[k], mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2; if (!vis(rd, a) || Math.abs(my - CITY.riverY(mx)) > 22) continue;
      const ang = Math.atan2(b.y - a.y, b.x - a.x), L = Math.hypot(b.x - a.x, b.y - a.y) + 6; c.save(); c.translate(mx, my); c.rotate(ang);
      c.fillStyle = 'rgba(0,30,60,.35)'; c.fillRect(-L / 2 + 2, -8, L, 18); c.fillStyle = '#8f9399'; c.fillRect(-L / 2, -9, L, 18); c.fillStyle = TEX.asphalt(c); c.fillRect(-L / 2, -6.5, L, 13);
      c.fillStyle = '#c9ccd1'; c.fillRect(-L / 2, -9, L, 1.6); c.fillRect(-L / 2, 7.4, L, 1.6); c.fillStyle = '#6d7076'; for (let x = -L / 2; x < L / 2; x += 4) { c.fillRect(x, -9.6, .8, 1.2); c.fillRect(x, 8.4, .8, 1.2); }
      c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = .7; c.setLineDash([5, 5]); c.beginPath(); c.moveTo(-L / 2, 0); c.lineTo(L / 2, 0); c.stroke(); c.setLineDash([]); c.restore(); } });
  // Laternen an den Hauptstraßen
  CITY.roads.forEach(rd => { if (rd.kind !== 'main') return; for (let d = 14; d < rd.len; d += 34) { const p = CITY.roadAtRaw(rd, d); if (Math.hypot(p.x, p.y) > R * 1.3 || Math.abs(p.y - CITY.riverY(p.x)) < 24) continue; const x = p.x - Math.sin(p.a) * 8.5, y = p.y + Math.cos(p.a) * 8.5;
      c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(x + 1.6, y + 1.2, 1.4, .8, 0, 0, TAU); c.fill(); c.fillStyle = '#4a4d55'; c.beginPath(); c.arc(x, y, .9, 0, TAU); c.fill(); c.fillStyle = '#fff3c4'; c.beginPath(); c.arc(x, y - .2, .45, 0, TAU); c.fill(); } });
}
function drawParks(c, R) {
  CITY.parks.forEach(p => { if (Math.hypot(p.x, p.y) > R * 1.15) return;
    const g = c.createRadialGradient(p.x - p.r * .3, p.y - p.r * .3, 0, p.x, p.y, p.r); g.addColorStop(0, '#a6d77a'); g.addColorStop(1, '#78b452'); c.fillStyle = g; c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.fill();
    c.strokeStyle = '#5f9a44'; c.lineWidth = 1.6; c.stroke();
    c.strokeStyle = '#e4d6a8'; c.lineWidth = 2.6; c.beginPath(); c.arc(p.x, p.y, p.r * .58, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(p.x - p.r, p.y); c.lineTo(p.x + p.r, p.y); c.stroke();
    const w = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * .22); w.addColorStop(0, '#9fd6ff'); w.addColorStop(1, '#3f86c9'); c.fillStyle = '#c8c2b2'; c.beginPath(); c.arc(p.x, p.y, p.r * .25, 0, TAU); c.fill(); c.fillStyle = w; c.beginPath(); c.arc(p.x, p.y, p.r * .2, 0, TAU); c.fill();
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(p.x, p.y, 1, 0, TAU); c.fill();
    [.3, 1.9, 3.6, 5.1].forEach(an => { const x = p.x + Math.cos(an) * p.r * .72, y = p.y + Math.sin(an) * p.r * .72; c.save(); c.translate(x, y); c.rotate(an + Math.PI / 2); c.fillStyle = '#8a5a34'; c.fillRect(-2, -.6, 4, 1.2); c.restore(); }); });
}
function drawTree(c, tr) {
  const r = tr.r, x = tr.x, y = tr.y, dk = tr.out ? '#3f7a2f' : '#3a7a2c';
  c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(x + r * .55, y + r * .45, r * 1.05, r * .8, .4, 0, TAU); c.fill();
  [[-.35, .15, .75], [.35, .2, .7], [0, -.25, .85]].forEach(([dx, dy, k]) => { const cx = x + dx * r, cy = y + dy * r, rr = r * k, g = c.createRadialGradient(cx - rr * .35, cy - rr * .4, rr * .1, cx, cy, rr);
    g.addColorStop(0, '#9ad36a'); g.addColorStop(.6, tr.out ? '#5f9a44' : '#4f8f3a'); g.addColorStop(1, dk); c.fillStyle = g; c.beginPath(); c.arc(cx, cy, rr, 0, TAU); c.fill(); });
}
function parkedCar(c, car) { c.save(); c.translate(car.x, car.y); c.rotate(car.a); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(-2.6, -1.1, 5.6, 2.8); c.fillStyle = car.col; c.beginPath(); c.roundRect ? c.roundRect(-2.8, -1.4, 5.6, 2.8, .8) : c.rect(-2.8, -1.4, 5.6, 2.8); c.fill();
  c.fillStyle = 'rgba(40,60,80,.8)'; c.fillRect(-1.2, -1.1, 2.6, 2.2); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(-1, -1.1, 1, .5); c.restore(); }
/* Quader von schräg oben: Dach oben, Südwand darunter sichtbar (fest im Bild, nicht mitgedreht) */
function block(c, x, y, w, d, h, col, o) { o = o || {};
  const top = y - h, wall = mixC(col, '#000000', .18), wallD = mixC(col, '#000000', .34), roof = o.roof || mixC(col, '#ffffff', .12);
  c.fillStyle = 'rgba(0,0,0,.24)'; c.beginPath(); c.moveTo(x - w / 2, y + d / 2); c.lineTo(x + w / 2, y + d / 2); c.lineTo(x + w / 2 + h * .55, y + d / 2 - h * .25); c.lineTo(x + w / 2 + h * .55, y - d / 2 - h * .25); c.lineTo(x + w / 2, y - d / 2); c.closePath(); c.fill(); // Schlagschatten
  const gw = c.createLinearGradient(0, top + d / 2, 0, y + d / 2); gw.addColorStop(0, wall); gw.addColorStop(1, wallD); c.fillStyle = gw; c.fillRect(x - w / 2, top + d / 2, w, h);   // Fassade
  if (o.win !== false) { const fl = Math.max(1, Math.floor(h / (o.fh || 3.2))), cols = Math.max(1, Math.floor(w / (o.fw || 3))); for (let i = 0; i < fl; i++) for (let j = 0; j < cols; j++) { const wx = x - w / 2 + (j + .5) * w / cols - .7, wy = top + d / 2 + (i + .3) * h / fl;
      c.fillStyle = o.glass ? ((i + j) % 3 ? 'rgba(150,200,240,.85)' : 'rgba(220,240,255,.95)') : ((i * 7 + j * 3) % 5 ? '#4f6584' : '#ffe9a0'); c.fillRect(wx, wy, o.glass ? w / cols - .4 : 1.4, o.glass ? h / fl * .6 : 1.3); } }
  if (o.door) { c.fillStyle = o.door; c.fillRect(x - 1.1, y + d / 2 - 2.4, 2.2, 2.4); }
  const gr = c.createLinearGradient(x - w / 2, top - d / 2, x + w / 2, top + d / 2); gr.addColorStop(0, mixC(roof, '#ffffff', .18)); gr.addColorStop(1, mixC(roof, '#000000', .08)); c.fillStyle = gr; c.fillRect(x - w / 2, top - d / 2, w, d); // Dach
  c.strokeStyle = 'rgba(20,20,20,.55)'; c.lineWidth = .5; c.strokeRect(x - w / 2, top - d / 2, w, d + h); c.beginPath(); c.moveTo(x - w / 2, top + d / 2); c.lineTo(x + w / 2, top + d / 2); c.stroke();
  return { top, x, y, w, d };
}
function gable(c, x, y, w, d, h, wallC, roofC) { // Haus mit Satteldach (First quer)
  const b = block(c, x, y, w, d, h, wallC, { roof: wallC, fh: 3.4, fw: 3.4, door: '#6b4423' });
  const t = b.top, rh = Math.min(4.5, d * .6); c.fillStyle = mixC(roofC, '#000000', .25); c.beginPath(); c.moveTo(x - w / 2 - .6, t + d / 2); c.lineTo(x + w / 2 + .6, t + d / 2); c.lineTo(x + w / 2 + .6, t - rh * .2); c.lineTo(x - w / 2 - .6, t - rh * .2); c.fill();
  const g = c.createLinearGradient(0, t - d / 2 - rh, 0, t); g.addColorStop(0, mixC(roofC, '#ffffff', .15)); g.addColorStop(1, roofC); c.fillStyle = g; c.beginPath(); c.moveTo(x - w / 2 - .6, t - rh * .2); c.lineTo(x + w / 2 + .6, t - rh * .2); c.lineTo(x + w / 2 + .3, t - d / 2 - rh * .6); c.lineTo(x - w / 2 - .3, t - d / 2 - rh * .6); c.fill();
  c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = .35; for (let k = 1; k < 4; k++) { const yy = t - rh * .2 - (d / 2 + rh * .4) * k / 4; c.beginPath(); c.moveTo(x - w / 2, yy); c.lineTo(x + w / 2, yy); c.stroke(); }
  c.strokeStyle = 'rgba(20,20,20,.55)'; c.lineWidth = .5; c.beginPath(); c.moveTo(x - w / 2 - .6, t - rh * .2); c.lineTo(x - w / 2 - .3, t - d / 2 - rh * .6); c.lineTo(x + w / 2 + .3, t - d / 2 - rh * .6); c.lineTo(x + w / 2 + .6, t - rh * .2); c.stroke();
  return b;
}
function drawHouse(c, b) {
  const r = MK.seedRand('h' + Math.round(b.x) + ',' + Math.round(b.y)), w = Math.max(b.w, b.h) * .95, d = Math.min(b.w, b.h) * .85;
  if (b.zone === 'res') { const walls = ['#efe2c8', '#e8d5b5', '#f3ece0', '#d9c7a8', '#e6dccb'], roofs = ['#b3523a', '#9a4632', '#7c5a48', '#b86b40', '#5d6470'];
    if (b.garden) { c.fillStyle = '#a3d37c'; c.fillRect(b.x - w / 2 - 2, b.y - d / 2 - 1, w + 4, d + 5); c.strokeStyle = '#6f9a4a'; c.lineWidth = .6; c.strokeRect(b.x - w / 2 - 2, b.y - d / 2 - 1, w + 4, d + 5); }
    gable(c, b.x, b.y, w, d, 3.6 + r() * 1.6, walls[b.tone], roofs[(b.tone + 2) % 5]); return; }
  if (b.zone === 'ind') { const B2 = block(c, b.x, b.y, w, d, 5 + r() * 2, '#a9a69a', { fh: 5, fw: 5 }), t = B2.top; c.fillStyle = 'rgba(0,0,0,.15)'; for (let k = 0; k < 4; k++) c.fillRect(b.x - w / 2 + k * w / 4 + w / 8, t - d / 2, w / 8, d);
    c.fillStyle = '#7a7d84'; c.fillRect(b.x + w * .3, t - d * .3 - 5, 1.6, 5); return; }
  const hgt = 8 + r() * 16 + (1 - Math.min(1, b.d / 130)) * 10, cols = ['#c9ccd2', '#b9c3cf', '#d6d0c4', '#aeb6c2', '#cfd6dd'];
  const B2 = block(c, b.x, b.y, w * .9, d * .9, hgt, cols[b.tone], { glass: r() < .4, fh: 3, fw: 2.8 }); const t = B2.top;
  c.fillStyle = '#d6d9dd'; c.fillRect(b.x - w * .2, t - d * .25, 2.4, 1.8); c.fillRect(b.x + w * .1, t - d * .1, 2.4, 1.8); if (r() < .3) { c.fillStyle = '#7cb85a'; c.fillRect(b.x - w * .38, t - d * .38, w * .3, d * .3); }
}
/* Gebäude je Geschäft – passend zur Größe: Pfand = Mini-Bude, Konzern = Wolkenkratzer */
function drawBizBuilding(c, b, B) {
  const u = MK.S.bizUp.filter(x => x.startsWith(B.id + ':')).length, x = b.x, y = b.y, col = COL[B.id], r = MK.seedRand('b' + Math.round(x) + Math.round(y)), gold = u >= 5;
  const awn = (x0, y0, w0) => { const n = Math.max(3, Math.round(w0 / 1.6)); for (let i = 0; i < n; i++) { c.fillStyle = i % 2 ? '#ffffff' : col; c.beginPath(); c.moveTo(x0 + i * w0 / n, y0); c.lineTo(x0 + (i + 1) * w0 / n, y0); c.lineTo(x0 + (i + 1) * w0 / n, y0 + 1.6); c.arc(x0 + (i + .5) * w0 / n, y0 + 1.6, w0 / n / 2, 0, Math.PI); c.fill(); } };
  switch (B.id) {
    case 'pfand': { // kleine Holzbude mit Pfandkisten
      const t = block(c, x, y, 5, 4, 3, '#a8763f', { win: false, roof: col }).top; awn(x - 2.8, t + 2, 5.6);
      [[-4, 1], [3.6, 1.6]].forEach(([dx, dy]) => { c.fillStyle = '#2f6f45'; c.fillRect(x + dx - 1, y + dy - 1, 2, 1.6); c.fillStyle = '#9fe0b0'; for (let i = 0; i < 3; i++) c.fillRect(x + dx - .8 + i * .6, y + dy - 1.6, .35, .7); }); break; }
    case 'shake': { // Stand mit Sonnenschirm
      block(c, x, y, 5.5, 3.6, 2.6, '#ffe0ea', { win: false, roof: '#fff' }); const g = c.createRadialGradient(x - 1, y - 7, .5, x, y - 6, 5); g.addColorStop(0, '#fff'); g.addColorStop(1, col);
      c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x + 2, y - .5, 4.5, 2, 0, 0, TAU); c.fill(); c.fillStyle = g; c.beginPath(); c.ellipse(x, y - 6.2, 4.6, 2.4, 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = .5; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; c.beginPath(); c.moveTo(x, y - 6.2); c.lineTo(x + Math.cos(a) * 4.6, y - 6.2 + Math.sin(a) * 2.4); c.stroke(); } break; }
    case 'pt': { const t = block(c, x, y, 9, 6, 4.2, '#f4e1c6', { glass: true, fh: 4, fw: 4.4, roof: '#6d7076', door: col }).top; c.fillStyle = col; c.fillRect(x - 3.5, t + 2.2, 7, 1.4); break; }
    case 'merch': { const t = block(c, x, y, 10, 7, 7, '#e9e4dc', { fh: 3.4, fw: 2.6, roof: '#8d939b', door: '#222' }).top; awn(x - 5, y - 3.2, 10); c.fillStyle = col; c.fillRect(x - 4, t + 3.6, 8, 1.6); c.fillStyle = '#fff'; c.fillRect(x - 3.4, t + 4.1, 6.8, .5); break; }
    case 'coach': { block(c, x, y, 9, 8, 12 + u, '#5a7aa8', { glass: true, fh: 2.6, fw: 3, door: '#222' }); break; }
    case 'supp': { const t = block(c, x, y, 13, 9, 6, '#d7c9b8', { fh: 3, fw: 4 }).top; [[-4, 0], [-1, 0]].forEach(([dx]) => { c.fillStyle = '#b8bcc2'; c.beginPath(); c.ellipse(x + 8 + dx * 1.2, y - 5, 2, 1, 0, 0, TAU); c.fill(); c.fillRect(x + 6 + dx * 1.2, y - 5, 4, 5); });
      c.fillStyle = '#8a4a36'; c.fillRect(x - 4, t - 9, 1.8, 9); c.fillRect(x - 1, t - 7, 1.8, 7); c.fillStyle = 'rgba(240,240,240,.85)'; [[-3.1, t - 11, 2.2], [-1.8, t - 13.5, 2.8], [.1, t - 9, 2]].forEach(([dx, yy, rr]) => { c.beginPath(); c.arc(x + dx, yy, rr, 0, TAU); c.fill(); });
      c.fillStyle = col; c.fillRect(x - 6, t + 1.6, 12, 1.4); break; }
    case 'kette': { const t = block(c, x, y, 12, 9, 8, '#2b2d34', { glass: true, fh: 4, fw: 3, door: col, roof: '#3a3d45' }).top; c.fillStyle = col; c.fillRect(x - 3, t - 1, 6, .9); c.fillRect(x - 3.8, t - 2, 1.2, 3); c.fillRect(x + 2.6, t - 2, 1.2, 3); c.fillStyle = col; c.fillRect(x - 6, t + 4.4, 12, 1); break; }
    case 'app': { const h = 24 + u * 2, t = block(c, x, y, 8, 8, h, '#4ea8de', { glass: true, fh: 2.4, fw: 2.6 }).top; c.strokeStyle = '#ddd'; c.lineWidth = .6; c.beginPath(); c.moveTo(x + 2, t - 4); c.lineTo(x + 2, t - 11); c.stroke(); c.fillStyle = '#ff3b3b'; c.beginPath(); c.arc(x + 2, t - 11, .7, 0, TAU); c.fill(); break; }
    case 'tv': { const t = block(c, x, y, 11, 8, 6, '#b8c0cc', { fh: 3, fw: 3.6, door: '#222' }).top; [[-3, 0], [2.5, 1]].forEach(([dx, dy]) => { c.fillStyle = '#f2f2f2'; c.beginPath(); c.ellipse(x + dx, t - 1.8 + dy, 2.2, 1.3, -.5, 0, TAU); c.fill(); c.strokeStyle = '#666'; c.lineWidth = .4; c.stroke(); }); break; }
    case 'konzern': { const h1 = 22 + u * 3; block(c, x, y, 12, 10, h1 * .55, '#5f6b7a', { glass: true, fh: 2.6, fw: 3 }); const t = block(c, x, y - 1, 8, 7, h1, '#7d8a9a', { glass: true, fh: 2.4, fw: 2.6 }).top; c.fillStyle = '#ffc83d'; c.fillRect(x - 3, t + 2, 6, 1.2); break; }
    default: { block(c, x, y, 10, 8, 6, col, { door: '#222' }); }
  }
  if (gold) { c.fillStyle = 'rgba(255,215,90,.9)'; c.beginPath(); c.arc(x + 5, y + 3, .9, 0, TAU); c.fill(); }
}
function tvTower(c, x, y) { c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 34, y - 12); c.lineTo(x + 36, y - 9); c.lineTo(x + 2, y + 2); c.fill();
  const g = c.createLinearGradient(x - 2, 0, x + 2, 0); g.addColorStop(0, '#f2f2f2'); g.addColorStop(1, '#a9aeb5'); c.fillStyle = g; c.beginPath(); c.moveTo(x - 2.6, y); c.lineTo(x + 2.6, y); c.lineTo(x + 1, y - 46); c.lineTo(x - 1, y - 46); c.fill();
  c.fillStyle = '#c9ced4'; c.beginPath(); c.arc(x, y - 36, 4.4, 0, TAU); c.fill(); c.fillStyle = '#5d7da8'; c.fillRect(x - 4.2, y - 36.6, 8.4, 1.4); c.strokeStyle = '#888'; c.lineWidth = .5; c.beginPath(); c.moveTo(x, y - 46); c.lineTo(x, y - 56); c.stroke(); c.fillStyle = '#ff3b3b'; c.beginPath(); c.arc(x, y - 56, .9, 0, TAU); c.fill(); }
function launchPad(c, x, y) { c.fillStyle = '#9aa0a8'; c.beginPath(); c.arc(x, y, 22, 0, TAU); c.fill(); c.strokeStyle = '#ffc83d'; c.lineWidth = 1.4; c.setLineDash([3, 3]); c.beginPath(); c.arc(x, y, 18, 0, TAU); c.stroke(); c.setLineDash([]);
  c.fillStyle = '#6d7076'; c.fillRect(x + 6, y - 34, 2.4, 34); c.fillStyle = '#f2f2f2'; c.beginPath(); c.moveTo(x - 3, y); c.lineTo(x + 3, y); c.lineTo(x + 3, y - 26); c.quadraticCurveTo(x, y - 34, x - 3, y - 26); c.closePath(); c.fill(); c.strokeStyle = '#555'; c.lineWidth = .5; c.stroke();
  c.fillStyle = '#ff5a36'; c.beginPath(); c.moveTo(x - 3, y - 2); c.lineTo(x - 6, y + 1); c.lineTo(x - 3, y - 6); c.fill(); c.beginPath(); c.moveTo(x + 3, y - 2); c.lineTo(x + 6, y + 1); c.lineTo(x + 3, y - 6); c.fill(); }
function cityCache(W, H, st) {
  const counts = MK.BIZ.map(B => MK.bizCount(B.id)), total = counts.reduce((a, b) => a + b, 0), dpr = Math.min(3, (window.devicePixelRatio || 1) * 1.6); // hoch aufgelöst, wird nur bei Änderungen neu gezeichnet
  const R = clamp(70 + Math.sqrt(total) * 24, 70, 640), sc = Math.max(H / (R * 1.5), W / (R * 3.1)) * (st >= 4 ? .32 : 1), keyS = [W, H, st, counts.join('.'), MK.S.bizUp.length].join('|');
  if (cityC && cityC.key === keyS) return cityC;
  const cv = cityC && cityC.cv || document.createElement('canvas'); cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.fillStyle = TEX.grass(c); c.fillRect(0, 0, W, H); c.imageSmoothingQuality = 'high';
  c.translate(W / 2, H / 2); c.scale(sc, sc);
  if (st >= 4) { // Land: Nachbarstädte und Autobahnen
    const rr = MK.seedRand('land'); for (let k = 0; k < 9; k++) { const a = k / 9 * TAU + rr() * .4, d = R * 2.2 + rr() * R * 1.6, tx = Math.cos(a) * d * 1.3, ty = Math.sin(a) * d * .85, tr = R * (.18 + rr() * .25);
      c.strokeStyle = '#6d7176'; c.lineWidth = 14; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(tx * .5 + (rr() - .5) * R, ty * .5 + (rr() - .5) * R, tx, ty); c.stroke(); c.strokeStyle = '#f0e08a'; c.lineWidth = 2; c.setLineDash([16, 14]); c.stroke(); c.setLineDash([]);
      for (let i = 0; i < 70; i++) { const aa = rr() * TAU, dd = Math.sqrt(rr()) * tr; c.fillStyle = ROOF.res[i % 5]; c.save(); c.translate(tx + Math.cos(aa) * dd, ty + Math.sin(aa) * dd * .8); c.rotate(rr()); c.fillRect(-9, -7, 18, 14); c.restore(); } } }
  const owner = new Map(); MK.BIZ.forEach((B, bi) => { const n = Math.min(counts[bi], 80); if (!n) return; const ctr = CITY.dc[bi]; CITY.bld.filter(b => b.d < R && !owner.has(b)).map(b => [b, Math.hypot(b.x - ctr.x, b.y - ctr.y)]).sort((a, b) => a[1] - b[1]).slice(0, n).forEach(([b]) => owner.set(b, bi)); });
  drawGround(c, R);
  drawRiver(c);
  drawRoads(c, R);
  drawParks(c, R);
  // Bäume und Gebäude gemeinsam nach Tiefe (y) sortiert → richtige Überdeckung wie in einem Aufbauspiel
  const items = []; CITY.trees.forEach(tr => { if (!tr.out && Math.hypot(tr.x, tr.y) > R * 1.15) return; items.push({ y: tr.y, f: () => drawTree(c, tr) }); });
  CITY.bld.forEach(b => { if (b.d > R) return; const bi = owner.get(b); items.push({ y: b.y, f: () => bi != null ? drawBizBuilding(c, b, MK.BIZ[bi]) : drawHouse(c, b) }); });
  CITY.cars.forEach(car => { if (Math.hypot(car.x, car.y) > R) return; items.push({ y: car.y - 1, f: () => parkedCar(c, car) }); });
  items.sort((p1, p2) => p1.y - p2.y).forEach(it => it.f());
  // Wahrzeichen
  if (counts[MK.BIZ.findIndex(B => B.id === 'tv')]) { const p = CITY.dc[MK.BIZ.findIndex(B => B.id === 'tv')]; tvTower(c, p.x + 30, p.y + 10); }
  if (counts[MK.BIZ.findIndex(B => B.id === 'space')]) { const p = CITY.dc[MK.BIZ.findIndex(B => B.id === 'space')]; launchPad(c, p.x, p.y); }
  // 8) Viertel-Markierungen
  MK.BIZ.forEach((B, bi) => { if (!counts[bi]) return; const p = CITY.dc[bi]; c.save(); c.translate(p.x, p.y); c.scale(1 / sc * (st >= 4 ? .75 : 1), 1 / sc * (st >= 4 ? .75 : 1)); c.fillStyle = 'rgba(20,20,20,.82)'; c.beginPath(); c.arc(0, -11, 9, 0, TAU); c.fill(); c.strokeStyle = COL[B.id]; c.lineWidth = 2; c.stroke(); c.beginPath(); c.moveTo(-4, -4); c.lineTo(4, -4); c.lineTo(0, 2); c.fill(); c.font = '10px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(B.icon, 0, -11); c.restore(); });
  // Licht-Ebene für die Nacht (Fenster, Laternen, Neon der eigenen Geschäfte) und nasse Straßen bei Regen
  const lv = cityC && cityC.lv || document.createElement('canvas'), wv = cityC && cityC.wv || document.createElement('canvas'); [lv, wv].forEach(k => { k.width = cv.width; k.height = cv.height; });
  const l = lv.getContext('2d'), w = wv.getContext('2d'); [l, w].forEach(k => { k.setTransform(dpr, 0, 0, dpr, 0, 0); k.translate(W / 2, H / 2); k.scale(sc, sc); });
  const rl = MK.seedRand('lights');
  CITY.bld.forEach(b => { if (b.d > R) return; const bi = owner.get(b), n = b.zone === 'city' ? 4 : b.zone === 'ind' ? 1 : 2;
    l.save(); l.translate(b.x, b.y); l.rotate(b.a);
    if (bi != null) { l.strokeStyle = COL[MK.BIZ[bi].id]; l.lineWidth = 2.2; l.shadowColor = COL[MK.BIZ[bi].id]; l.shadowBlur = 6; l.strokeRect(-b.w / 2, -b.h / 2, b.w, b.h); l.shadowBlur = 0; }
    for (let i = 0; i < n; i++) if (rl() < .7) { l.fillStyle = b.zone === 'city' ? 'rgba(200,230,255,.9)' : 'rgba(255,220,140,.95)'; l.fillRect(-b.w / 2 + 2 + rl() * (b.w - 5), -b.h / 2 + 2 + rl() * (b.h - 5), 2.2, 2.2); }
    l.restore(); });
  CITY.roads.forEach(rd => { if (rd.kind !== 'main') return; for (let d = 10; d < rd.len; d += 34) { const p = CITY.roadAtRaw(rd, d); if (Math.hypot(p.x, p.y) > R * 1.4) continue; const g = l.createRadialGradient(p.x, p.y, 0, p.x, p.y, 9); g.addColorStop(0, 'rgba(255,214,120,.8)'); g.addColorStop(1, 'rgba(255,214,120,0)'); l.fillStyle = g; l.beginPath(); l.arc(p.x, p.y, 9, 0, TAU); l.fill(); } });
  CITY.roads.forEach(rd => { const main = rd.kind === 'main'; w.strokeStyle = 'rgba(210,228,255,.35)'; w.lineWidth = main ? 3 : 2; w.setLineDash([5, 9]); w.beginPath(); let on = false; rd.pts.forEach(p => { if (Math.hypot(p.x, p.y) > R * (main ? 1.6 : 1.08)) { on = false; return; } on ? w.lineTo(p.x + 1.5, p.y - 1) : w.moveTo(p.x + 1.5, p.y - 1); on = true; }); w.stroke(); w.setLineDash([]); });
  cityC = { key: keyS, cv, sc, R, total, lv, wv }; return cityC;
}
/* ---------- Tageszeit und Wetter über der Stadt (gleicher 20-Minuten-Takt wie im Gym) ---------- */
function nightK() { const p = Sc.dayPhase(); return p > .66 ? clamp((p - .66) / .08, 0, 1) * (p > .95 ? clamp((1 - p) / .05, 0, 1) : 1) : p < .04 ? clamp((.04 - p) / .04, 0, 1) * .6 : 0; }
function skyFx(c, x0, y0, W, H, t, C) {
  const p = Sc.dayPhase(), wx = Sc.weather(), nk = E.night = nightK(), wet = wx === 'regen' || wx === 'gewitter';
  if (p > .52 && p < .74) { c.fillStyle = `rgba(255,130,50,${.14 * Math.sin((p - .52) / .22 * Math.PI)})`; c.fillRect(x0, y0, W, H); }
  if (p < .16) { c.fillStyle = `rgba(255,190,140,${.12 * (1 - p / .16)})`; c.fillRect(x0, y0, W, H); }
  if (wet || wx === 'wolken' || wx === 'nebel') { c.fillStyle = wet ? 'rgba(60,75,100,.22)' : 'rgba(120,130,145,.12)'; c.fillRect(x0, y0, W, H); }
  if (wet && C.wv) { c.globalAlpha = .9 - nk * .4; c.drawImage(C.wv, x0, y0, W, H); c.globalAlpha = 1; }
  if (nk > 0) { c.fillStyle = `rgba(10,16,48,${.62 * nk})`; c.fillRect(x0, y0, W, H); if (C.lv) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = nk * (.85 + .15 * Math.sin(t * 3)); c.drawImage(C.lv, x0, y0, W, H); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; } }
  if (wet) { c.strokeStyle = 'rgba(200,220,255,.45)'; c.lineWidth = 1; c.beginPath(); for (let i = 0; i < 70; i++) { const rx = x0 + ((i * 53.3 + t * 40) % W), ry = y0 + ((i * 31.7 + t * 300) % H); c.moveTo(rx, ry); c.lineTo(rx - 3, ry + 9); } c.stroke(); }
  if (wx === 'gewitter' && Math.sin(t * 1.3) > .995) { c.fillStyle = 'rgba(235,240,255,.5)'; c.fillRect(x0, y0, W, H); }
  if (wx === 'schnee') { c.fillStyle = 'rgba(255,255,255,.9)'; for (let i = 0; i < 60; i++) { const sx = x0 + ((i * 41.3 + Math.sin(t + i) * 8) % W), sy = y0 + ((i * 27.1 + t * 26) % H); c.fillRect(sx, sy, 2, 2); } }
  if (wx === 'nebel') { c.fillStyle = 'rgba(225,228,234,.35)'; c.fillRect(x0, y0, W, H); }
}
/* ---------- Der Chef: deine Figur im Anzug, rechts unten über der Stadt ---------- */
let bossC = null, bossT = 0;
function bossSprite(h) {
  const S = MK.S, suit = MK.suitCur(), lv = MK.lvExact(), key = [Math.round(h), suit ? suit.id : '-', JSON.stringify(S.look), MK.MUSCLES.map(m => Math.floor(lv[m.id] * 2)).join('.')].join('|');
  if (bossC && (bossC.key === key || performance.now() - bossT < 4000)) return bossC; bossT = performance.now();
  const k = h / 430, w = Math.ceil(200 * k), hh = Math.ceil(440 * k), dpr = Math.min(2, window.devicePixelRatio || 1), cv = bossC && bossC.cv || document.createElement('canvas'); cv.width = w * dpr; cv.height = hh * dpr;
  const x = cv.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, cv.width, cv.height); x.scale(dpr, dpr);
  const L = MK.Fig.resolveLook(S.look); L.tats = MK.tatsOn ? MK.tatsOn() : L.tats;
  if (suit) { L.top = { id: 'suit-' + suit.id, val: suit.val, cut: 'long', fit: .75, suit: true, tie: suit.tie, stripe: suit.stripe, bow: suit.bow, space: suit.space }; L.bottom = { val: suit.val, long: true }; L.shoes = { val: '#141414', acc: '#3a3a3e' }; L.gloves = null; if (L.head !== 'none') L.head = 'none'; if (L.acc === 'handtuch' || L.acc === 'guertel') L.acc = 'none'; }
  const D = MK.Fig.dims(lv, MK.rankIdx() / 10, 0), pose = { arms: { l: { t: [D.shH + 6, 50], b: 'out' }, r: { t: [D.shH + 6, 50], b: 'out' } }, head: { y: -1 } };
  MK.Fig.render(x, w / 2, hh - 10 * k, k, { key: 'boss', lv, L, pose, posture: MK.rankIdx() / 10, face: 'proud', dpr, plain: false });
  bossC = { key, cv, w, h: hh }; return bossC;
}
function drawBoss(c, W, mapH, t) {
  const h = Math.min(mapH * .82, W < 600 ? 120 : 160), B = bossSprite(h), x = W - B.w * .8, y = mapH - B.h + 4 + Math.sin(t * 1.6) * .8;
  c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(x + B.w / 2, mapH - 6, B.w * .3, 5, 0, 0, TAU); c.fill();
  c.drawImage(B.cv, x, y, B.w, B.h);
  c.fillStyle = 'rgba(20,20,20,.82)'; c.fillRect(x + B.w * .2, mapH - 20, B.w * .6, 15); c.fillStyle = '#ffc83d'; c.font = '700 10px Arial'; c.textAlign = 'center'; c.fillText('CHEF', x + B.w / 2, mapH - 9);
}
/* ---------- Nachrichten-Ticker zwischen Stadt und Reihen ---------- */
const NEWS = [
  [() => true, () => 'Muskelstadt: Bürgermeister trainiert ab sofort Beine'], [() => true, () => 'Studie: Wer klickt, wächst'], [() => true, () => 'Proteinpreise steigen – Sportler horten Shakes'],
  [() => true, () => 'Hausmeister Günther: „Früher war mehr Kreide“'], [() => true, () => `Umfrage: ${Math.min(99, 3 + Math.round(Math.sqrt(MK.S.fame) * 2))} % kennen deinen Bizeps`],
  [() => MK.bizCount('pfand') > 0, () => `Pfand-Imperium sammelt ${MK.fmt(MK.bizCount('pfand') * 120)} Flaschen am Tag`], [() => MK.bizCount('shake') > 0, () => 'Shake-Stand testet neue Sorte: „Kreide-Vanille“'],
  [() => MK.bizCount('pt') > 0, () => 'Personal Training: Anfänger lernen endlich Curls'], [() => MK.bizCount('merch') > 0, () => 'Shirt mit deinem Gesicht wieder ausverkauft'],
  [() => MK.bizCount('coach') > 0, () => 'Online-Coaching: Videocall um 3 Uhr nachts – Kunde zufrieden'], [() => MK.bizCount('supp') > 0, () => 'Supplement „Gainz“ jetzt in jedem Supermarkt'],
  [() => MK.bizCount('kette') > 0, () => `Gym-Kette eröffnet Filiale Nr. ${MK.bizCount('kette') + 1}`], [() => MK.bizCount('app') > 0, () => 'App-Charts: deine Fitness-App auf Platz 1'],
  [() => MK.bizCount('tv') > 0, () => 'Quote: Kniebeugen-Show schlägt Fußball'], [() => MK.bizCount('konzern') > 0, () => `Börse: Aktie PUMP steigt um ${2 + Math.floor(Math.random() * 14)} %`],
  [() => MK.bizCount('space') > 0, () => 'Rakete gestartet: Bankdrücken in der Schwerelosigkeit'],
  [() => MK.income() > 0, () => { const B = MK.BIZ.filter(x => MK.bizCount(x.id) > 0).sort((a, b) => MK.bizRate(b) - MK.bizRate(a))[0]; return B ? `${B.name} bringt jetzt ${MK.fmt(MK.bizRate(B))} € pro Sekunde` : 'Wirtschaft ruhig'; }],
  [() => { const B = MK.BIZ.find(x => MK.bizCount(x.id) === 0); return B && !MK.bizOpen(B); }, () => `Gerücht: ${MK.BIZ.find(x => MK.bizCount(x.id) === 0).name} sucht einen Besitzer`],
  [() => MK.S.mile < MK.MILES.length, () => `Fast geschafft: ${MK.fmt(MK.MILES[MK.S.mile][0])} € Gesamtumsatz in Sicht`],
  [() => ['regen', 'gewitter'].includes(Sc.weather()), () => 'Regen über Muskelstadt: Laufbänder ausgebucht'], [() => nightK() > .5, () => 'Nachtschicht: Shake-Stand hat rund um die Uhr offen'],
  [() => MK.S.rival.wins > 0, () => `Rivale ${MK.RIVAL.name} kündigt Revanche an`], [() => MK.S.stats.tourneys > 0, () => `Pokal Nr. ${MK.S.stats.tourneys} steht in deiner Vitrine`],
  [() => MK.S.partner.lv > 0, () => `Trainingspartner Kevin: „Ich spür schon den Pump“`], [() => MK.totalLv() > 100, () => 'Fitnessmagazin: Wer ist dieser Typ mit den Schultern?']
];
const TK = { x: 0, txt: '', w: 0 };
function ticker(c, W, y, h, dt) {
  c.fillStyle = '#141414'; c.fillRect(0, y, W, h); c.font = '700 11.5px Arial'; c.textBaseline = 'middle';
  if (!TK.txt || TK.x < -TK.w - 20) { const ok = NEWS.filter(n => { try { return n[0](); } catch (e) { return false; } }); let txt = ''; try { txt = ok[Math.floor(Math.random() * ok.length)][1](); } catch (e) { txt = 'Muskelstadt pumpt weiter'; } TK.txt = txt; TK.w = c.measureText(txt).width; TK.x = W; }
  TK.x -= dt * 48; c.save(); c.beginPath(); c.rect(52, y, W - 52, h); c.clip(); c.fillStyle = '#fbf5e6'; c.textAlign = 'left'; c.fillText(TK.txt, TK.x, y + h / 2 + 1); c.restore();
  c.fillStyle = '#ff5a36'; c.fillRect(0, y, 48, h); c.fillStyle = '#fff'; c.textAlign = 'center'; c.fillText('NEWS', 24, y + h / 2 + 1); c.textBaseline = 'alphabetic';
}
/* ---------- 3D-Mini-Stadt (Option „Umgebung 3D“): isometrisch, Autos, Lichter, Zoom-Stufen mit Kamerafahrt ----------
   Höchstens 30 Bilder/s; dazwischen wird das letzte Bild wiederverwendet. Beim Betreten: Kamerafahrt aus dem Gym-Fenster. */
function city3d(c, x0, y0, W, H, st) {
  const E3 = MK.Env3D, S = MK.S; if (!E3 || !S.set.env3d || S.set.quality === 'niedrig') return false;
  if (E3.state === 'idle' && E3.load) { E3.load(); return false; } if (E3.state !== 'ready' || E3.slow || !E3.city) return false;
  const now = performance.now(), enter = now - (E.last3d || -1e9) > 1200; E.last3d = now;
  const cv = E.cityCv || (E.cityCv = document.createElement('canvas'));
  if (enter || now - (E.city3dT || 0) > (S.set.quality === 'hoch' ? 33 : 50) || cv.width === 0) {
    let r = null; try { r = E3.city({ W, H, st, dpr: c.canvas.width / Sc.W, q: S.set.quality, reduce: S.set.reduce, enter }); } catch (e) { console.error('3D-Stadt:', e); E3.city = null; return false; }
    if (!r) return false; E.city3dT = now; E.fly = r.fly; E.lvl3d = r.stage; if (cv.width !== r.cv.width || cv.height !== r.cv.height) { cv.width = r.cv.width; cv.height = r.cv.height; } const x = cv.getContext('2d'); x.clearRect(0, 0, cv.width, cv.height); x.drawImage(r.cv, 0, 0); }
  c.drawImage(cv, x0, y0, W, H);
  // Blick aus dem Gym-Fenster: Fensterrahmen fliegt beim Betreten nach außen weg
  const f = E.fly || 0; if (f > .02 && !S.set.reduce) { const k = 1 + (1 - f) * 2.6, cx = x0 + W / 2, cy = y0 + H / 2, w = W * .62 * k, h = H * .9 * k, t = Math.max(8, 14 * k);
    c.save(); c.globalAlpha = Math.min(1, f * 1.6); c.fillStyle = '#5e4a2e'; c.beginPath(); c.rect(x0 - 10, y0 - 10, W + 20, H + 20); c.rect(cx - w / 2, cy - h / 2, w, h); c.fill('evenodd');
    c.fillRect(cx - t / 4, cy - h / 2, t / 2, h); c.fillRect(cx - w / 2, cy - t / 4, w, t / 2); c.strokeStyle = INK; c.lineWidth = 3; c.strokeRect(cx - w / 2, cy - h / 2, w, h); c.restore(); }
  return true;
}
/* ---------- Oberes Drittel: Mini-Stadt, die herauszoomt ---------- */
function stageOf() { const types = MK.BIZ.filter(B => MK.bizCount(B.id) > 0).length; return types <= 2 ? 0 : types <= 4 ? 1 : types <= 6 ? 2 : types <= 7 ? 3 : types <= 9 ? 4 : types <= 10 ? 5 : 6; }
function cityMap(c, x0, y0, W, H, t, st) {
  const own = MK.BIZ.filter(B => MK.bizCount(B.id) > 0), cx = x0 + W / 2, cy = y0 + H / 2;
  c.save(); c.beginPath(); c.rect(x0, y0, W, H); c.clip();
  const zoomAnim = E.stageAnim > 0 ? 1 + E.stageAnim * .8 : 1; // beim Stufen-Sprung: Kamera zieht raus
  if (city3d(c, x0, y0, W, H, st)) { /* 3D-Mini-Stadt gezeichnet */ }
  else if (st <= 4) { // Stadt (bzw. Land mit Nachbarstädten) von oben: organisch, gecacht; Autos fahren live
    const C = cityCache(W, H, st); c.drawImage(C.cv, x0, y0, W, H);
    const sc = C.sc, ox = x0 + W / 2, oy = y0 + H / 2, nCars = Math.min(60, 6 + C.total / 4);
    for (let i = 0; i < nCars; i++) { const rd = CITY.roads[i % CITY.roads.length], L = rd.len, d = ((t * (14 + (i % 5) * 5) + i * 137) % L), p = roadAt(rd, i % 2 ? d : L - d);
      if (Math.hypot(p.x, p.y) > C.R * 1.05) continue; const X = ox + p.x * sc, Y = oy + p.y * sc; if (X < x0 || X > x0 + W || Y < y0 || Y > y0 + H) continue;
      c.save(); c.translate(X, Y); c.rotate(p.a + (i % 2 ? 0 : Math.PI)); c.fillStyle = ['#ff5a36', '#ffc83d', '#fbf5e6', '#4ea8de', '#2bb673'][i % 5]; c.fillRect(-2.2, -1.2, 4.4, 2.4); c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(-.6, -1.2, 1.4, 2.4);
      if (E.night > .3) { c.fillStyle = `rgba(255,240,170,${E.night * .8})`; c.beginPath(); c.moveTo(2.2, -1); c.lineTo(9, -3.5); c.lineTo(9, 3.5); c.lineTo(2.2, 1); c.fill(); } c.restore(); }
    skyFx(c, x0, y0, W, H, t, C);
  } else if (st <= 5) { // Land bzw. Welt: abstrakte Karte mit leuchtenden Städten
    c.fillStyle = st === 4 ? '#5aa0d8' : '#0b1d3a'; c.fillRect(x0, y0, W, H);
    if (st === 4) { c.fillStyle = '#9cc77a'; c.beginPath(); const pts = [[.42, .05], [.6, .1], [.66, .3], [.63, .55], [.68, .8], [.55, .95], [.4, .9], [.33, .7], [.36, .45], [.3, .25]]; pts.forEach(([px, py], i) => { const X = x0 + W * (.15 + px * .7), Y = y0 + H * py; i ? c.lineTo(X, Y) : c.moveTo(X, Y); }); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke(); }
    else { const r = Math.min(W, H) * .44; c.fillStyle = '#2a6fbf'; c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.fill(); c.save(); c.clip(); c.fillStyle = '#7fb069'; for (let i = 0; i < 7; i++) { const a = t * .15 + i * .9; c.beginPath(); c.ellipse(cx + Math.cos(a) * r * .7, cy + Math.sin(i * 1.7) * r * .5, r * .28, r * .16, a, 0, TAU); c.fill(); } c.restore(); c.strokeStyle = 'rgba(140,200,255,.6)'; c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, r + 2, 0, TAU); c.stroke(); }
    own.forEach((B, i) => { const a = i * 2.39996, rr = Math.min(W, H) * (.08 + .32 * ((i * .61) % 1)), px = cx + Math.cos(a + (st === 5 ? t * .15 : 0)) * rr * (st === 4 ? .6 : 1), py = cy + Math.sin(a) * rr * .8, n = MK.bizCount(B.id);
      const g = c.createRadialGradient(px, py, 0, px, py, 6 + Math.min(14, Math.sqrt(n) * 1.6)); g.addColorStop(0, 'rgba(255,240,160,.95)'); g.addColorStop(1, 'rgba(255,240,160,0)'); c.fillStyle = g; c.beginPath(); c.arc(px, py, 6 + Math.min(14, Math.sqrt(n) * 1.6), 0, TAU); c.fill(); O(c, px, py, 2.6, COL[B.id]); });
    // Lieferrouten
    c.strokeStyle = 'rgba(255,200,80,.45)'; c.setLineDash([4, 4]); c.lineDashOffset = -t * 12; c.lineWidth = 1.5; c.beginPath(); own.forEach((B, i) => { const a = i * 2.39996, rr = Math.min(W, H) * (.08 + .32 * ((i * .61) % 1)), px = cx + Math.cos(a + (st === 5 ? t * .15 : 0)) * rr * (st === 4 ? .6 : 1), py = cy + Math.sin(a) * rr * .8; i ? c.lineTo(px, py) : c.moveTo(px, py); }); c.stroke(); c.setLineDash([]);
  } else { // All: Sterne, kleine Erde, Raumstation im Orbit
    c.fillStyle = '#05060f'; c.fillRect(x0, y0, W, H); for (let i = 0; i < 60; i++) { c.fillStyle = `rgba(255,255,255,${.4 + .4 * Math.sin(t * 2 + i)})`; c.fillRect(x0 + (i * 97.1 % 1) * W, y0 + (i * 61.3 % 1) * H, 1.5, 1.5); }
    const r = H * .3; c.fillStyle = '#2a6fbf'; c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.fill(); c.fillStyle = '#7fb069'; c.beginPath(); c.ellipse(cx - r * .2, cy - r * .1, r * .35, r * .2, .5, 0, TAU); c.fill();
    const a = t * .5, sx = cx + Math.cos(a) * r * 2, sy = cy + Math.sin(a) * r * .9; c.strokeStyle = 'rgba(255,255,255,.2)'; c.beginPath(); c.ellipse(cx, cy, r * 2, r * .9, 0, 0, TAU); c.stroke(); SPR.space(c, sx, sy + 8, .7, 2, Math.floor(t * 2) % 2, 0);
  }
  c.restore();
  // Beschriftung der Zoom-Stufe
  if (E.stageAnim > 0) { c.fillStyle = `rgba(255,255,255,${E.stageAnim * .5})`; c.fillRect(x0, y0, W, H); c.font = '24px Bangers, Impact'; c.textAlign = 'center'; c.lineWidth = 5; c.strokeStyle = INK; c.strokeText('NEUE STUFE: ' + STAGES[st].toUpperCase(), cx, cy); c.fillStyle = '#ffc83d'; c.fillText('NEUE STUFE: ' + STAGES[st].toUpperCase(), cx, cy); }
}

/* ---------- Hauptzeichnung ---------- */
/* Baustelle: Gerüst, Kran mit Haken, Einheit wächst von unten mit kleinem Nachfedern, Staub am Ende */
function buildSite(c, x, y, e, u, t, rowTop) { const fit = Math.min(.82, Math.max(.35, (y - (rowTop == null ? y - 999 : rowTop) - 4) / (e.h + 30)));
  const h = e.h, w = Math.max(e.w * .8, 14), x0 = x - w / 2 - 3, top = y - h - 6;
  const grow = u < .15 ? 0 : (() => { const v = Math.min(1, (u - .15) / .7); return v < 1 ? 1 - Math.pow(1 - v, 3) * Math.cos(v * 5) : 1; })();
  if (grow > 0) { c.save(); c.beginPath(); c.rect(x - e.w, y - h * Math.min(1.08, grow) - 2, e.w * 2, h * 1.2); c.clip(); c.drawImage(e.cv, x - e.ox, y - e.oy + h * (1 - Math.min(1, grow)) * .25, e.w, e.h); c.restore(); }
  c.save(); c.translate(x, y); c.scale(fit, fit); c.translate(-x, -y); // Gerüst & Kran bleiben in der eigenen Zeile
  const a = u < .8 ? 1 : 1 - (u - .8) / .2; c.save(); c.globalAlpha = Math.max(0, a);
  c.strokeStyle = '#e8a23a'; c.lineWidth = 1.4; for (let i = 0; i <= 2; i++) { const px = x0 + i * (w + 6) / 2; c.beginPath(); c.moveTo(px, y); c.lineTo(px, top); c.stroke(); } // Gerüst
  for (let j = 1; j <= 3; j++) { const py = y - (y - top) * j / 3; c.beginPath(); c.moveTo(x0, py); c.lineTo(x0 + w + 6, py); c.stroke(); }
  c.strokeStyle = 'rgba(232,162,58,.6)'; c.beginPath(); c.moveTo(x0, y); c.lineTo(x0 + w + 6, top); c.stroke();
  const cx = x + w / 2 + 6, ct = top - 14, sw = Math.sin(t * 2.4) * 6; c.strokeStyle = '#ffd23f'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx, y); c.lineTo(cx, ct); c.lineTo(cx - w - 14, ct); c.stroke(); // Kran
  c.strokeStyle = '#141414'; c.lineWidth = .8; c.beginPath(); c.moveTo(cx - w * .6 + sw, ct); c.lineTo(cx - w * .6 + sw, ct + 10 + u * 8); c.stroke(); c.fillStyle = '#7d838c'; c.fillRect(cx - w * .6 + sw - 3, ct + 10 + u * 8, 6, 4);
  c.restore(); c.restore(); if (u > .78 && u < .82 && Math.random() < .5) E.coins.push({ x: x + (Math.random() - .5) * w, y: y - 4, vy: -20, life: .5 }); }
Sc.drawEmpire = function (dt, t) {
  const c = Sc.ctx(); if (!c) return; const W = Sc.W, H = Sc.H, dpr = c.canvas.width / W;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.fillStyle = '#1e2027'; c.fillRect(0, 0, W, H);
  const use3 = E.lvl3d != null && performance.now() - (E.last3d || -1e9) < 1500, st = use3 ? E.lvl3d : stageOf(); if (E.stage >= 0 && st > E.stage) { E.stageAnim = 1; MK.Audio.play('level'); } E.stage = st; E.stageAnim = Math.max(0, E.stageAnim - dt * .5);
  const mapH = Math.round(H * .34), tkH = 20; cityMap(c, 0, 0, W, mapH, t, st);
  c.fillStyle = INK; c.fillRect(0, mapH, W, 3); ticker(c, W, mapH + 3, tkH, dt);
  // Reihen
  const own = MK.BIZ.filter(B => MK.bizCount(B.id) > 0), next = MK.BIZ.find(B => MK.bizCount(B.id) === 0 && MK.bizOpen(B)), list = own.slice(); if (next) list.push(next);
  const top = mapH + 3 + tkH, area = H - top, rh = Math.max(46, Math.min(120, area / Math.max(1, list.length))), total = list.length * rh, maxScroll = Math.max(0, total - area);
  // Scrollen: nach Kauf zur Reihe, sonst langsam durchlaufen; Mausrad/Ziehen setzt manuell
  if (E.scrollT > 0 && E.focus) { const i = list.findIndex(B => B.id === E.focus); if (i >= 0) E.target = clamp(i * rh - area / 2 + rh / 2, 0, maxScroll); E.scrollT -= dt; }
  else if (E.manualT > 0) E.manualT -= dt; else E.target = maxScroll * (.5 - .5 * Math.cos(t * .08));
  E.scroll += ((E.target || 0) - E.scroll) * Math.min(1, dt * 3); E.scroll = clamp(E.scroll, 0, maxScroll); E.max = maxScroll;
  c.save(); c.beginPath(); c.rect(0, top, W, area); c.clip();
  E.hit = [];
  list.forEach((B, i) => { const y = top + i * rh - E.scroll; if (y > H || y + rh < top) return; const n = MK.bizCount(B.id), u = upsOf(B.id), v = lookOf(u), labelW = 4;
    E.hit.push({ id: B.id, y0: y, y1: y + rh });
    if (!n) { c.fillStyle = 'rgba(255,255,255,.05)'; c.fillRect(0, y, W, rh); c.strokeStyle = 'rgba(255,255,255,.25)'; c.setLineDash([5, 4]); c.strokeRect(4, y + 3, W - 8, rh - 6); c.setLineDash([]); c.fillStyle = 'rgba(255,255,255,.7)'; c.font = '700 12px Arial'; c.textAlign = 'center'; c.fillText(`${B.icon} ${B.name} – noch frei. Kauf das erste!`, W / 2, y + rh / 2 + 4); return; }
    rowBg(c, B, 0, y, W, rh, u, t);
    // Figuren: rücken zusammen, je mehr es werden
    const gx = 64, gw = W - gx - 8, s = clamp(rh / 30, .9, 2.2), unitW = 22 * s, maxShow = Math.max(1, Math.floor(gw / (unitW * .32))), shown = Math.min(n, maxShow), sp = Math.min(unitW * 1.1, gw / shown);
    const us = s * (shown > 40 ? .85 : 1), nowp = performance.now(); for (let k = 0; k < shown; k++) { const ux = gx + k * sp + sp / 2, uy = y + rh - 4 - (k % 2) * Math.min(4, rh * .06), f = Math.floor(t * 2 + k * .37) % 2, e = MK.empUnit(B.id, u, f, k, us);
      const gk = B.id + ':' + (n - shown + k), g0 = E.grow[gk]; if (g0) { const age = (nowp - g0) / 1000; if (age < 0) { buildSite(c, ux, uy, e, 0, t, y); continue; } if (age < 1.5) { buildSite(c, ux, uy, e, age / 1.5, t, y); continue; } delete E.grow[gk]; }
      c.drawImage(e.cv, ux - e.ox, uy - e.oy, e.w, e.h); }
    if (E.rain[B.id] > 0) { E.rain[B.id] -= dt; if (Math.random() < dt * 22) E.bills.push({ x: gx + Math.random() * gw, y: y - 6, vy: 40 + Math.random() * 40, vx: (Math.random() - .5) * 30, sp: Math.random() * 6, life: 1.4, y1: y + rh - 6 }); }
    // kleines Schild: Symbol ×Anzahl (Farbe des Rands = Ausbau-Material)
    { const bw = 54, bh = 20, bx = 6, by2 = y + 5; c.fillStyle = 'rgba(20,20,20,.85)'; c.beginPath(); c.roundRect ? c.roundRect(bx, by2, bw, bh, 6) : c.rect(bx, by2, bw, bh); c.fill(); c.strokeStyle = FRAME[u] || '#ff5ad1'; c.lineWidth = 2; c.stroke();
      c.font = '13px sans-serif'; c.textAlign = 'left'; c.fillStyle = '#fff'; c.fillText(B.icon, bx + 4, by2 + 15); c.fillStyle = '#ffc83d'; c.font = '14px Bangers, Impact, sans-serif'; c.fillText('×' + n, bx + 22, by2 + 15); }
    frame(c, 0, y, W, rh, u, t);
    // Münzen aus der Reihe
    E['c' + B.id] = (E['c' + B.id] || 0) - dt * (.5 + Math.min(3, n / 15)); if (E['c' + B.id] < 0) { E['c' + B.id] = 1; E.coins.push({ x: gx + rnd(0, Math.min(gw, shown * sp)), y: y + rh * .4, vy: -48, life: 1.2 }); }
    if (E.flash[B.id] > 0) { c.fillStyle = `rgba(255,236,150,${E.flash[B.id] * .45})`; c.fillRect(0, y, W, rh); E.flash[B.id] -= dt; }
  });
  E.coins = E.coins.filter(m => (m.life -= dt) > 0); E.coins.forEach(m => { m.vy *= Math.exp(-dt * 1.6); m.y += m.vy * dt; m.sp = (m.sp || Math.random() * 6) + dt * 8; const sx = Math.max(.2, Math.abs(Math.cos(m.sp))), a = Math.min(1, m.life * 1.5) * Math.min(1, (1.2 - m.life) * 8);
    c.globalAlpha = a; MK.Art.drawBill(c, m.x, m.y, 15, Math.sin(m.sp * .4) * .35, Math.cos(m.sp * .6));
    if (m.life < .35 && !m.sparked) { m.sparked = 1; m.spk = .35; } if (m.spk > 0) { m.spk -= dt; const r = (1 - m.spk / .35) * 7; c.strokeStyle = `rgba(255,220,120,${m.spk * 2})`; c.lineWidth = 1.2; c.beginPath(); c.moveTo(m.x - r, m.y); c.lineTo(m.x + r, m.y); c.moveTo(m.x, m.y - r); c.lineTo(m.x, m.y + r); c.stroke(); } c.globalAlpha = 1; }); // Geldscheine flattern, steigen weich auf und funkeln am Ende
  E.bills = E.bills.filter(b => (b.life -= dt) > 0 && b.y < b.y1); E.bills.forEach(b => { b.sp += dt * 7; b.vy = Math.min(140, b.vy + dt * 90); b.x += (b.vx + Math.sin(b.sp) * 30) * dt; b.y += b.vy * dt; c.globalAlpha = Math.min(1, b.life * 2); MK.Art.drawBill(c, b.x, b.y, 20, Math.sin(b.sp) * .6, Math.cos(b.sp * 1.3)); c.globalAlpha = 1; });
  c.restore();
  if (maxScroll > 0) { const bh = area * area / total, by = top + (E.scroll / maxScroll) * (area - bh); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(W - 4, by, 3, bh); }
  if (Sc.fxDraw) Sc.fxDraw(dt);
};
/* Eingaben in der Imperium-Ansicht: Antippen einer Reihe öffnet das Geschäft, Ziehen/Mausrad scrollt */
Sc._cityDebug = (W, H, st) => cityCache(W, H, st).cv;
Sc.empireHit = (x, y) => { const h = E.hit.find(r => y >= r.y0 && y <= r.y1); return h ? h.id : null; };
Sc.empireScroll = d => { E.target = clamp((E.target != null ? E.target : E.scroll) + d, 0, E.max || 0); E.manualT = 8; };
})(window.MK);
