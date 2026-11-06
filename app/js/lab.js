/* Muskelklicker – Labor (Mittel erforschen, verbessern, nehmen), Dopingkontrolle vor Turnieren (8 Mini-Spiele) und Hausmeister Günthers Bestechung */
window.MK = window.MK || {};
(function (MK) {
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t, rnd = (a, b) => a + Math.random() * (b - a), TAU = Math.PI * 2;
const pick = a => a[Math.floor(Math.random() * a.length)];
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
const LAB_MAX = 10;

/* ---------- Mittel ---------- */
// base: Preis fürs Erforschen, danach ×3 je Stufe. eff(lv) = Text der Wirkung auf dieser Stufe
MK.LAB = [
  { id: 'testo',   name: 'Testo',         col: '#ff5a36', base: 1500,   icon: 'syringe', fx: 'Pickel',         eff: lv => `×${MK.fmt1(1.6 + .14 * lv)} Muskel-XP`, long: 'Alle Wiederholungen bringen deutlich mehr XP – du levelst viel schneller.' },
  { id: 'clen',    name: 'Clenbuterol',   col: '#2ec5ff', base: 4000,   icon: 'pill',    fx: 'Zittern',        eff: lv => `KFA sinkt ${MK.fmt1(.6 + .12 * lv)}/min`, long: 'Dein Körperfett schmilzt, solange es wirkt. Perfekt vor Turnieren mit KFA-Grenze.' },
  { id: 'epo',     name: 'EPO',           col: '#e23b7a', base: 9000,   icon: 'drop',    fx: 'Rotes Gesicht',  eff: lv => `+${20 + 4 * lv} % Duellzeit`, long: 'Mehr Ausdauer: Duelle dauern länger und dein Pump fällt langsamer ab.' },
  { id: 'beta',    name: 'Betablocker',   col: '#3ccf8e', base: 20000,  icon: 'pill',    fx: 'Müde Augen',     eff: lv => `+${25 + 3 * lv} % grüne Zone`, long: 'Ruhige Hand: grüne Felder in den Duellen werden größer, der Strich wird langsamer.' },
  { id: 'stim',    name: 'Stimulanzien',  col: '#ffc83d', base: 45000,  icon: 'bolt',    fx: 'Zappelig',       eff: lv => `Trainer ×2 · ${Math.round((150 + 18 * lv) / 60 * 10) / 10} min`, long: 'Rausch: Die Autoklicker deines Trainers laufen doppelt so schnell. Braucht einen Personal Trainer.' },
  { id: 'tren',    name: 'Tren',          col: '#a64dff', base: 120000, icon: 'syringe', fx: 'Wutanfälle',     eff: lv => `Gegner −${12 + lv} %`, long: 'Wut-Modus: Gegner in Duellen werden schwächer. Aber ab und zu kriegst du einen Wutanfall.' },
  { id: 'synthol', name: 'Synthol',       col: '#ff8fb1', base: 60000,  icon: 'syringe', fx: 'Beulen-Arme',    eff: lv => `+${30 + 4 * lv} % Ruhm · nur Optik`, long: 'Nur Optik: Arme sofort riesig, mehr Zuschauer und Ruhm. Kampfrichter beim Posing finden es weniger gut.' }
];
const L = id => MK.LAB.find(x => x.id === id);
const ICONS = {
  syringe: '<path d="M14 3l7 7M17.5 6.5L9 15l-3 1 1-3 8.5-8.5M12 6l6 6M4 20l3-3"/>',
  pill: '<rect x="3" y="8" width="18" height="8" rx="4" transform="rotate(-35 12 12)"/><path d="M9.5 15.5l5-7"/>',
  drop: '<path d="M12 3c3.5 4.6 6 7.8 6 11a6 6 0 01-12 0c0-3.2 2.5-6.4 6-11z"/>',
  bolt: '<path d="M13 2L5 13h6l-1 9 8-11h-6z"/>'
};

const S = () => MK.S;
function ensure() { const s = S(); if (!s.lab) s.lab = { r: {}, job: null, on: {}, end: {} }; if (!s.lab.end) s.lab.end = {}; if (s.bribe == null) s.bribe = 0; if (!s.stats.caught) s.stats.caught = 0; if (!s.stats.clean) s.stats.clean = 0; return s.lab; }
MK.labLv = id => ensure().r[id] || 0;
MK.labPur = id => { const lv = MK.labLv(id); return lv ? Math.min(.95, .35 + .06 * lv) : 0; };
MK.labCost = id => { const lv = MK.labLv(id); return MK.nice(L(id).base * Math.pow(3, lv) * MK.shopMul()); };
MK.labTime = id => { const lv = MK.labLv(id); return MK.niceTime(lv ? 90 * Math.pow(2.1, lv) : 90); }; // glatte Zeiten
MK.labDoseCost = id => MK.nice(L(id).base * .12 * (1 + MK.labLv(id) * .25) * MK.shopMul());
MK.labDur = id => MK.niceTime(150 + 18 * MK.labLv(id));
MK.labOn = id => { const l = ensure(); return (l.on[id] || 0) > Date.now(); };
MK.labActive = () => MK.LAB.filter(x => MK.labOn(x.id)).map(x => x.id);
MK.labSkipCost = () => { const j = ensure().job; if (!j) return 0; const min = Math.max(0, (j.until - Date.now()) / 60000); return Math.max(1, Math.ceil(Math.pow(min, .85) / 3) + 1); };
MK.labStart = function (id) { const l = ensure(); if (l.job || MK.labLv(id) >= LAB_MAX) return false; const c = MK.labCost(id); if (!MK.spend(c)) return false; l.job = { id, until: Date.now() + MK.labTime(id) * 1000, to: MK.labLv(id) + 1, dur: MK.labTime(id) }; MK.dirty && MK.dirty(); return true; };
MK.labSkip = function () { const l = ensure(), s = S(); if (!l.job) return false; const c = MK.labSkipCost(); if (s.dia < c) return false; s.dia -= c; l.job.until = Date.now(); MK.labTick(); return true; };
MK.labTick = function () { const l = ensure(); if (l.job && Date.now() >= l.job.until) { const j = l.job; l.r[j.id] = j.to; l.job = null; MK.emit('labDone', { id: j.id, lv: j.to }); return true; } return false; };
MK.labTake = function (id) { const l = ensure(); if (!MK.labLv(id) || MK.labOn(id)) return false; if (id === 'stim' && !MK.trainerRate()) return 'trainer'; if (!MK.spend(MK.labDoseCost(id))) return false; l.on[id] = Date.now() + MK.labDur(id) * 1000; l.end[id] = l.on[id]; MK.emit('labTake', id); return true; };

/* ---------- Wirkungen ---------- */
const lv = id => MK.labOn(id) ? MK.labLv(id) : -1;
MK.labXpMul = () => { const t = lv('testo'); return t >= 0 ? 1.6 + .14 * t : 1; };
MK.labAutoMul = () => lv('stim') >= 0 ? 2 : 1;
MK.labFameMul = () => { const t = lv('synthol'); return t >= 0 ? 1.3 + .04 * t : 1; };
MK.labPumpDecay = () => lv('epo') >= 0 ? .6 : 1;
MK.labDuel = function () { const e = lv('epo'), b = lv('beta'), t = lv('tren');
  return { time: e >= 0 ? 1 + .2 + .04 * e : 1, zone: b >= 0 ? 1.25 + .03 * b : 1, slow: b >= 0 ? .85 : 1, opp: t >= 0 ? 1 - (.12 + .01 * t) : 1, rage: t >= 0 ? (1 - MK.labPur('tren')) * .5 + .1 : 0, synth: lv('synthol') >= 0 }; };
// Nebenwirkungen: stark bei unreinem Stoff, klingen nach dem Absetzen in ~2 Minuten ab
MK.labSide = function () { const l = ensure(), now = Date.now(), o = {};
  const k = id => { if (!MK.labLv(id)) return 0; const a = MK.labOn(id) ? 1 : Math.max(0, 1 - (now - (l.end[id] || 0)) / 120000); return clamp(a * (1 - MK.labPur(id)) * 1.6, 0, 1); };
  o.acne = k('testo'); o.shake = Math.max(k('clen'), k('stim') * .8); o.red = Math.max(k('epo'), k('tren')); o.sleepy = k('beta'); o.synth = MK.labOn('synthol') ? 1 : 0; o.rage = k('tren');
  for (const x in o) if (o[x] < .04) delete o[x]; return Object.keys(o).length ? o : null; };
// läuft jede Sekunde
let rageT = 30;
MK.labSecond = function (dt) { const l = ensure(); MK.labTick();
  const c = lv('clen'); if (c >= 0) S().fatOff = Math.max(-10, (S().fatOff || 0) - (.6 + .12 * c) / 60 * dt);
  // Tren: ab und zu ein Wutanfall im Gym
  const sd = MK.labSide(); if (sd && sd.rage && !MK.Comp.cur && (rageT -= dt) < 0) { rageT = rnd(35, 70); if (Math.random() < .35 + sd.rage * .5) MK.emit('rage'); }
  // Wirkung vorbei?
  MK.LAB.forEach(x => { if (l.on[x.id] && l.on[x.id] <= Date.now()) { l.on[x.id] = 0; MK.emit('labOff', x.id); } });
};

/* ---------- Kontrolle: Schwierigkeit ---------- */
MK.labNeedsTest = () => MK.labActive().length > 0;
MK.labCheck = function (tier) { const act = MK.labActive(); if (!act.length) return null;
  const worst = Math.min(...act.map(MK.labPur)), d = clamp(.08 + (tier || 0) * .05 + (act.length - 1) * .1 + (1 - worst) * .8, 0, 1);
  const wl = Math.min(...act.map(MK.labLv)), buf = wl >= 8 ? 3 : wl >= 4 ? 2 : 1; // immer mindestens ein Fehler erlaubt
  return { d, stufe: 1 + Math.round(d * 9), buf, act }; };

/* ======================================================================
   DOPINGKONTROLLE: 8 Mini-Spiele auf eigener Leinwand über dem Gym
   ====================================================================== */
const DT = MK.DT = { cur: null };
const GAMES = [
  { id: 'tubes',  name: 'Röhrchen-Hütchenspiel', how: 'Merk dir dein Röhrchen (rot) – er mischt. Danach antippen!' },
  { id: 'dog',    name: 'Spürhund-Versteck',      how: 'Tippe eine Pille, dann ein Versteck. Alle weg, bevor der Dackel da ist!' },
  { id: 'poker',  name: 'Pokerface',              how: 'Finger drauf halten – loslassen, wenn die Nadel im grünen Feld ist.' },
  { id: 'rlgl',   name: 'Rotlicht-Grünlicht',     how: 'Gedrückt halten = schleichen. Sofort loslassen, wenn er sich umdreht!' },
  { id: 'pulse',  name: 'Puls-Rhythmus',          how: 'Tippe genau, wenn der Herzschlag im Ring ist. Bleib ruhig!' },
  { id: 'water',  name: 'Wasser-Exe',             how: 'Nach oben wischen = ein Schluck. Alle Flaschen leer, bevor die Zeit um ist!' },
  { id: 'memory', name: 'Etiketten-Memory',       how: 'Merk dir die Etiketten, dann finde alle Paare.' }
];
DT.GAMES = GAMES;
let ov = null, cvs = null, cx = null, Wd = 0, Hd = 0, dpr = 1, raf = 0, lastT = 0;
function overlay() {
  if (ov && ov.isConnected) return ov;
  ov = document.createElement('div'); ov.id = 'dtest'; ov.className = 'dtest'; ov.hidden = true;
  ov.innerHTML = '<canvas></canvas><div class="dt-panel" hidden></div><div class="dt-hud"></div>';
  $('view').appendChild(ov); cvs = ov.querySelector('canvas'); cx = cvs.getContext('2d');
  const pos = e => { const r = cvs.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  cvs.addEventListener('pointerdown', e => { e.preventDefault(); MK.Audio.unlock(); const g = DT.cur; if (!g || !g.live) return; cvs.setPointerCapture && cvs.setPointerCapture(e.pointerId); const p = pos(e); g.ptr = { x: p.x, y: p.y, sx: p.x, sy: p.y, t: performance.now() }; g.impl.down && g.impl.down(g, p.x, p.y); });
  cvs.addEventListener('pointermove', e => { const g = DT.cur; if (!g || !g.live || !g.ptr) return; const p = pos(e); g.ptr.x = p.x; g.ptr.y = p.y; g.impl.move && g.impl.move(g, p.x, p.y); });
  const up = e => { const g = DT.cur; if (!g || !g.live || !g.ptr) return; const p = pos(e), pr = g.ptr; g.ptr = null; g.impl.up && g.impl.up(g, p.x, p.y, pr); };
  cvs.addEventListener('pointerup', up); cvs.addEventListener('pointercancel', up);
  return ov;
}
function size() { const r = ov.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1); Wd = r.width; Hd = r.height; cvs.width = Math.round(Wd * dpr); cvs.height = Math.round(Hd * dpr); }
const FONT = n => `${n}px Bangers, Impact, "Arial Black", sans-serif`;
function txt(s, x, y, n, col, al, stroke) { cx.font = FONT(n); cx.textAlign = al || 'center'; cx.textBaseline = 'middle'; if (stroke !== false) { cx.lineWidth = Math.max(3, n * .16); cx.strokeStyle = '#141414'; cx.lineJoin = 'round'; cx.strokeText(s, x, y); } cx.fillStyle = col || '#fff'; cx.fillText(s, x, y); cx.textBaseline = 'alphabetic'; }
function small(s, x, y, n, col, al) { cx.font = `700 ${n}px system-ui, -apple-system, Arial, sans-serif`; cx.textAlign = al || 'center'; cx.textBaseline = 'middle'; cx.fillStyle = col || '#fff'; cx.fillText(s, x, y); cx.textBaseline = 'alphabetic'; }
function rrect(x, y, w, h, r, fill, stroke, lw) { cx.beginPath(); cx.roundRect(x, y, w, h, r); if (fill) { cx.fillStyle = fill; cx.fill(); } if (stroke) { cx.strokeStyle = stroke; cx.lineWidth = lw || 3; cx.stroke(); } }
/* ======================= Zeichen-Baukasten für die Kontroll-Spiele ======================= */
const INK = '#141414';
const lg = (x0, y0, x1, y1, stops) => { const g = cx.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
const rg = (x, y, r0, r1, stops) => { const g = cx.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
function ell(x, y, rx, ry, fill, stroke, lw, rot) { cx.beginPath(); cx.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), rot || 0, 0, TAU); if (fill) { cx.fillStyle = fill; cx.fill(); } if (stroke) { cx.strokeStyle = stroke; cx.lineWidth = lw || 2.5; cx.stroke(); } }
function path(pts, fill, stroke, lw, close) { cx.beginPath(); cx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) cx.lineTo(pts[i][0], pts[i][1]); if (close !== false) cx.closePath(); if (fill) { cx.fillStyle = fill; cx.fill(); } if (stroke) { cx.strokeStyle = stroke; cx.lineWidth = lw || 2.5; cx.lineJoin = 'round'; cx.stroke(); } }
function shadow(x, y, rx, ry, a) { ell(x, y, rx, ry, `rgba(0,0,0,${a || .3})`); }
// Szene: Rückwand, Sockelleiste, Boden in Perspektive, Licht von oben, Vignette. Wird je Größe zwischengespeichert.
const SCN = {};
function scene(kind) {
  { const E3 = MK.Env3D, S = MK.S; // Labor als 3D-Raum (Option „Umgebung 3D“), sonst wie bisher 2D
    if (E3 && S.set.env3d && S.set.quality !== 'niedrig' && (kind === 'lab' || kind === 'med')) { if (E3.state === 'idle' && E3.load) E3.load();
      if (E3.state === 'ready' && !E3.slow && E3.getLab) { let r = null; try { r = E3.getLab({ kind, W: Wd, H: Hd, dpr, q: S.set.quality }); } catch (e) { console.error('3D-Labor:', e); }
        if (r) { cx.fillStyle = '#c9d3d6'; cx.fillRect(0, 0, Wd, Hd); cx.drawImage(r.cv, 0, 0, Wd, Hd); return; } } } }
  const key = kind + Wd + 'x' + Hd + dpr; let c2 = SCN[key];
  if (!c2) { c2 = document.createElement('canvas'); c2.width = cvs.width; c2.height = cvs.height; const o = cx; cx = c2.getContext('2d'); cx.setTransform(dpr, 0, 0, dpr, 0, 0); drawScene(kind); cx = o; SCN[key] = c2; }
  cx.drawImage(c2, 0, 0, Wd, Hd); }
const THEMES = { lab: ['#d6e4e9', '#a9bfc8', '#6e7e86', '#c9d3d6'], room: ['#c9b79c', '#9c8669', '#5b4a3a', '#8a7c6c'], dark: ['#3a3f52', '#262a37', '#15171f', '#2e3240'], studio: ['#5a1f33', '#2d0f1b', '#170710', '#3a1424'], hall: ['#b9c4b2', '#8b9886', '#4c5848', '#7d8a7a'], med: ['#cfe3ea', '#9dbac6', '#5d7782', '#b6cdd5'] };
function drawScene(kind) { const T = THEMES[kind] || THEMES.lab, fy = Hd * .62;
  cx.fillStyle = lg(0, 0, 0, fy, [[0, T[0]], [1, T[1]]]); cx.fillRect(0, 0, Wd, fy);
  // Wandfliesen / Paneele
  if (kind === 'lab' || kind === 'med') { cx.strokeStyle = 'rgba(255,255,255,.35)'; cx.lineWidth = 1; for (let y = 8; y < fy; y += 22) { cx.beginPath(); cx.moveTo(0, y); cx.lineTo(Wd, y); cx.stroke(); } for (let y = 8, r = 0; y < fy; y += 22, r++) for (let x = (r % 2) * 16; x < Wd; x += 32) { cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x, y + 22); cx.stroke(); } }
  if (kind === 'room' || kind === 'hall') { for (let x = 0; x < Wd; x += 46) { cx.fillStyle = 'rgba(0,0,0,.06)'; cx.fillRect(x, 0, 2, fy); cx.fillStyle = 'rgba(255,255,255,.08)'; cx.fillRect(x + 2, 0, 1, fy); } }
  if (kind === 'studio') { for (let x = 0; x < Wd; x += 18) { cx.fillStyle = lg(x, 0, x + 18, 0, [[0, 'rgba(0,0,0,.35)'], [.5, 'rgba(255,255,255,.07)'], [1, 'rgba(0,0,0,.35)']]); cx.fillRect(x, 0, 18, fy); } }
  // Poster an der Wand
  if (kind !== 'studio' && kind !== 'dark' && kind !== 'hall') { const px = Wd * .08, py = fy * .18, pw = Math.min(70, Wd * .12), ph = pw * 1.3; cx.save(); cx.translate(px + pw / 2, py + ph / 2); cx.rotate(-.04); rrect(-pw / 2, -ph / 2, pw, ph, 3, '#fffaf0', INK, 2.5); rrect(-pw / 2 + 5, -ph / 2 + 5, pw - 10, ph * .45, 2, '#c1121f'); txt('NO', 0, -ph / 2 + 5 + ph * .17, pw * .3, '#fff'); txt('DOPING', 0, -ph / 2 + 5 + ph * .34, pw * .2, '#fff', 'center', false);
    for (let i = 0; i < 4; i++) rrect(-pw / 2 + 8, ph * .05 + i * 7, pw - 16 - (i % 2) * 14, 3, 1, 'rgba(0,0,0,.25)'); cx.restore(); }
  // Sockelleiste + Boden
  cx.fillStyle = T[2]; cx.fillRect(0, fy - 7, Wd, 7); cx.fillStyle = 'rgba(255,255,255,.18)'; cx.fillRect(0, fy - 7, Wd, 1.5);
  cx.fillStyle = lg(0, fy, 0, Hd, [[0, T[3]], [1, T[2]]]); cx.fillRect(0, fy, Wd, Hd - fy);
  cx.strokeStyle = 'rgba(0,0,0,.14)'; cx.lineWidth = 1.2; const vx = Wd / 2; for (let i = -12; i <= 12; i++) { cx.beginPath(); cx.moveTo(vx + i * Wd * .06, fy); cx.lineTo(vx + i * Wd * .22, Hd); cx.stroke(); }
  for (let k = 1; k < 7; k++) { const y = fy + (Hd - fy) * Math.pow(k / 7, 1.6); cx.beginPath(); cx.moveTo(0, y); cx.lineTo(Wd, y); cx.stroke(); }
  // Licht von oben + Vignette
  cx.fillStyle = rg(Wd / 2, -Hd * .1, 10, Hd * 1.1, [[0, 'rgba(255,248,225,.35)'], [.6, 'rgba(255,248,225,.06)'], [1, 'rgba(255,248,225,0)']]); cx.fillRect(0, 0, Wd, Hd);
  cx.fillStyle = rg(Wd / 2, Hd / 2, Math.min(Wd, Hd) * .35, Math.max(Wd, Hd) * .8, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.5)']]); cx.fillRect(0, 0, Wd, Hd); }
function table(x, y, w, h, wood) { const top = wood !== false ? ['#b07a4a', '#8a5a33', '#5e3c20'] : ['#e4e9ec', '#b9c2c8', '#7d878e'];
  shadow(x + w / 2, y + h + 26, w * .52, 10, .25);
  [[x + 14, y + h], [x + w - 26, y + h]].forEach(([lx, ly]) => { cx.fillStyle = lg(lx, 0, lx + 12, 0, [[0, top[2]], [.5, top[1]], [1, top[2]]]); cx.fillRect(lx, ly - 2, 12, 28); cx.strokeStyle = INK; cx.lineWidth = 2; cx.strokeRect(lx, ly - 2, 12, 28); });
  rrect(x, y + h - 10, w, 12, 4, top[2], INK, 2.5);
  cx.beginPath(); cx.roundRect(x, y, w, h - 6, 6); cx.fillStyle = lg(0, y, 0, y + h, [[0, top[0]], [1, top[1]]]); cx.fill(); cx.strokeStyle = INK; cx.lineWidth = 3; cx.stroke();
  if (wood !== false) { cx.save(); cx.clip(); cx.strokeStyle = 'rgba(60,30,10,.18)'; cx.lineWidth = 1.2; for (let i = 0; i < 6; i++) { cx.beginPath(); const yy = y + 6 + i * (h - 12) / 6; cx.moveTo(x, yy); for (let xx = x; xx <= x + w; xx += 20) cx.lineTo(xx, yy + Math.sin(xx * .05 + i) * 2); cx.stroke(); } cx.restore(); }
  cx.fillStyle = 'rgba(255,255,255,.22)'; cx.fillRect(x + 6, y + 3, w - 12, 2); }
// Kontrolleur: Uniform, Abzeichen, Krawatte, Brille, Schnauzer. mood: neutral|sus|angry|happy, back = Rückansicht
function inspector(x, y, s, o) { o = o || {}; const mood = o.mood || 'neutral', lk = o.look || 0; cx.save(); cx.translate(x, y); cx.scale(s, s);
  // Rumpf
  path([[-46, 70], [-40, 18], [-22, 6], [22, 6], [40, 18], [46, 70]], lg(-46, 0, 46, 0, [[0, '#14254a'], [.5, '#1f3a6b'], [1, '#14254a']]), INK, 3);
  if (!o.back) { path([[-12, 6], [0, 24], [12, 6]], '#f4f4f0', INK, 2); path([[-4, 12], [4, 12], [6, 40], [0, 48], [-6, 40]], '#c1121f', INK, 2); path([[-22, 6], [-6, 30], [-12, 56]], null, 'rgba(0,0,0,.35)', 2, false); path([[22, 6], [6, 30], [12, 56]], null, 'rgba(0,0,0,.35)', 2, false);
    ell(-26, 30, 7, 8, '#e8b931', INK, 2); txt('★', -26, 30, 9, '#7a5a00', 'center', false); rrect(14, 24, 22, 9, 2, '#fff', INK, 1.5); small('KONTR.', 25, 28.5, 5.5, INK); }
  else { rrect(-30, 22, 60, 16, 3, 'rgba(255,255,255,.9)', INK, 1.5); small('DOPING-KONTROLLE', 0, 30, 7, '#14254a'); }
  // Hals + Kopf
  rrect(-8, -6, 16, 14, 4, '#e8b994', INK, 2);
  ell(0, -26, 22, 25, lg(-20, -50, 20, 0, [[0, '#f6cfa8'], [1, '#d9a27a']]), INK, 3);
  if (o.back) { cx.fillStyle = '#6b5a4a'; cx.beginPath(); cx.ellipse(0, -14, 21, 12, 0, 0, Math.PI); cx.fill(); ell(-6, -38, 7, 4, 'rgba(255,255,255,.35)', null, 0, -.4); cx.restore(); return; }
  ell(-21, -24, 4, 7, '#e8b994', INK, 2); ell(21, -24, 4, 7, '#e8b994', INK, 2);
  cx.fillStyle = '#6b5a4a'; [-1, 1].forEach(d => { cx.beginPath(); cx.ellipse(d * 18, -30, 5, 9, d * .2, 0, TAU); cx.fill(); });
  ell(-7, -44, 8, 4, 'rgba(255,255,255,.4)', null, 0, -.3);
  // Brille + Augen
  [-1, 1].forEach(d => { ell(d * 9, -28, 7.5, 6.5, 'rgba(210,235,255,.55)', INK, 2.2); ell(d * 9 + lk * 2.2, -27.5, 2.2, mood === 'angry' ? 1.6 : 2.4, INK); ell(d * 9 + lk * 2.2 + .8, -28.5, .8, .8, '#fff'); });
  cx.strokeStyle = INK; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(-2, -28); cx.lineTo(2, -28); cx.stroke();
  // Augenbrauen je Laune
  cx.lineWidth = 3; cx.strokeStyle = '#4a3a2a'; cx.beginPath();
  if (mood === 'angry') { cx.moveTo(-16, -40); cx.lineTo(-4, -35); cx.moveTo(16, -40); cx.lineTo(4, -35); }
  else if (mood === 'sus') { cx.moveTo(-16, -37); cx.lineTo(-4, -37); cx.moveTo(16, -42); cx.lineTo(4, -38); }
  else { cx.moveTo(-16, -38); cx.lineTo(-4, -39); cx.moveTo(16, -38); cx.lineTo(4, -39); } cx.stroke();
  // Nase, Schnauzer, Mund
  path([[0, -24], [-3, -15], [2, -14]], '#e2a985', INK, 1.6, false);
  cx.fillStyle = '#5b4632'; cx.beginPath(); cx.moveTo(-12, -9); cx.quadraticCurveTo(-6, -15, 0, -11); cx.quadraticCurveTo(6, -15, 12, -9); cx.quadraticCurveTo(6, -7, 0, -9); cx.quadraticCurveTo(-6, -7, -12, -9); cx.fill();
  cx.strokeStyle = INK; cx.lineWidth = 2; cx.beginPath(); if (mood === 'happy') cx.arc(0, -6, 5, .2, Math.PI - .2); else if (mood === 'angry') { cx.moveTo(-5, -3); cx.lineTo(5, -3); } else { cx.moveTo(-4, -4); cx.quadraticCurveTo(0, -5, 4, -4); } cx.stroke();
  // Arme mit Handschuhen
  (o.hands || []).forEach(h => { const hx = (h[0] - x) / s, hy = (h[1] - y) / s, shx = hx < 0 ? -36 : 36; cx.strokeStyle = INK; cx.lineWidth = 15; cx.lineCap = 'round'; cx.beginPath(); cx.moveTo(shx, 22); cx.quadraticCurveTo((hx + shx) / 2 + shx * .3, (hy + 22) / 2 + 10, hx, hy); cx.stroke(); cx.strokeStyle = '#1f3a6b'; cx.lineWidth = 11; cx.stroke(); cx.lineCap = 'butt';
    ell(hx, hy, 9, 8, '#7fd3ff', INK, 2.2); ell(hx - 3, hy - 3, 3, 2, 'rgba(255,255,255,.6)'); });
  if (o.clip) { cx.save(); cx.translate(34, 34); cx.rotate(-.2); rrect(-12, -16, 24, 32, 3, '#9a6a3a', INK, 2); rrect(-9, -11, 18, 24, 1, '#fff'); rrect(-5, -19, 10, 6, 2, '#b8bcc2', INK, 1.5); for (let i = 0; i < 4; i++) cx.fillStyle = 'rgba(0,0,0,.3)', cx.fillRect(-7, -7 + i * 5, 12 - (i % 2) * 4, 1.5); cx.restore(); }
  cx.restore(); }
// Spieler als Comicfigur (Oberkörper): Shirt, kräftige Arme, Gesicht mit Stimmung
function athlete(x, y, s, o) { o = o || {}; cx.save(); cx.translate(x, y); cx.scale(s, s); const sk = ['#f3cfae', '#d9a47c'];
  path([[-54, 80], [-50, 24], [-28, 8], [28, 8], [50, 24], [54, 80]], lg(-54, 0, 54, 0, [[0, '#c4302a'], [.5, '#ee4035'], [1, '#c4302a']]), INK, 3);
  rrect(-10, -4, 20, 16, 5, sk[1], INK, 2); ell(0, -24, 24, 27, lg(-20, -50, 20, 0, [[0, sk[0]], [1, sk[1]]]), INK, 3);
  cx.fillStyle = '#4a2c1a'; cx.beginPath(); cx.ellipse(0, -42, 24, 13, 0, Math.PI, TAU); cx.fill(); for (let i = -3; i <= 3; i++) path([[i * 7 - 4, -48], [i * 7, -58 + Math.abs(i)], [i * 7 + 4, -48]], '#4a2c1a', null, 0);
  const tw = o.twitch || 0; [-1, 1].forEach(d => { const shut = d > 0 && tw > .6; ell(d * 9, -27, 6, shut ? 1 : 5, '#fff', INK, 1.8); if (!shut) ell(d * 9 + (o.look || 0) * 2, -26.5, 2.4, 2.6, INK); });
  cx.strokeStyle = '#4a2c1a'; cx.lineWidth = 3; cx.beginPath(); cx.moveTo(-15, -37 - tw * 2); cx.lineTo(-4, -35); cx.moveTo(15, -37 + tw * 3); cx.lineTo(4, -35); cx.stroke();
  cx.strokeStyle = INK; cx.lineWidth = 2.2; cx.beginPath(); if (o.mood === 'happy') cx.arc(0, -11, 7, .2, Math.PI - .2); else if (o.mood === 'scared') { ell(0, -9, 4, 5, '#5a1a14'); } else { cx.moveTo(-6, -9); cx.lineTo(6, -9 + tw * 3); } cx.stroke();
  if (o.sweat) for (let i = 0; i < 3; i++) { const sx = 22 - i * 4, sy = -40 + i * 9 + ((performance.now() / 18 + i * 30) % 20); ell(sx, sy, 2.4, 3.6, 'rgba(120,200,255,.9)', INK, 1); }
  if (o.red) ell(0, -18, 18, 10, `rgba(230,60,50,${o.red * .35})`);
  cx.restore(); }
function heartIcon(x, y, r, full, beat) { const k = beat || 1; cx.save(); cx.translate(x, y); cx.scale(k, k); cx.beginPath(); cx.moveTo(0, r * .9); cx.bezierCurveTo(-r * 1.4, -r * .1, -r * .7, -r * 1.2, 0, -r * .45); cx.bezierCurveTo(r * .7, -r * 1.2, r * 1.4, -r * .1, 0, r * .9); cx.closePath();
  cx.fillStyle = full ? lg(0, -r, 0, r, [[0, '#ff6b6b'], [1, '#c1121f']]) : '#3a3d47'; cx.fill(); cx.strokeStyle = INK; cx.lineWidth = 2.2; cx.stroke(); if (full) ell(-r * .35, -r * .35, r * .22, r * .14, 'rgba(255,255,255,.6)', null, 0, -.6); cx.restore(); }
function hearts(g) { if (!g.buf) return; for (let i = 0; i < g.buf; i++) heartIcon(Wd - 20 - i * 26, 24, 10, i >= g.errs); }
function timer(frac, col) { const w = Math.min(Wd * .62, 380), x = (Wd - w) / 2 + 12, y = 14, f = clamp(frac, 0, 1);
  rrect(x, y, w, 16, 8, 'rgba(0,0,0,.45)', INK, 2.5); if (f > 0) { cx.save(); cx.beginPath(); cx.roundRect(x + 2, y + 2, (w - 4) * f, 12, 6); cx.clip(); cx.fillStyle = lg(0, y, 0, y + 16, [[0, f < .25 ? '#ff8a6b' : col || '#ffd86b'], [1, f < .25 ? '#c1121f' : '#d9941a']]); cx.fillRect(x, y, w, 16); cx.fillStyle = 'rgba(255,255,255,.35)'; cx.fillRect(x, y + 3, w, 3); cx.restore(); }
  ell(x - 6, y + 8, 13, 13, '#fffaf0', INK, 2.5); rrect(x - 9, y - 9, 6, 5, 1, '#c9ced4', INK, 1.5); cx.strokeStyle = INK; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(x - 6, y + 8); const a = -Math.PI / 2 + (1 - f) * TAU; cx.lineTo(x - 6 + Math.cos(a) * 8, y + 8 + Math.sin(a) * 8); cx.stroke(); }
function caption(s, y) { cx.font = '800 13px system-ui, -apple-system, Arial'; const w = cx.measureText(s).width + 26; rrect(Wd / 2 - w / 2, y - 14, w, 28, 14, 'rgba(255,250,240,.95)', INK, 2.5); small(s, Wd / 2, y, 13, INK); }
function bubble(x, y, w, h, s, tail) { rrect(x - w / 2, y - h / 2, w, h, 12, '#fff', INK, 3); path([[x + (tail || -.2) * w, y + h / 2 - 2], [x + (tail || -.2) * w + 10, y + h / 2 + 14], [x + (tail || -.2) * w + 18, y + h / 2 - 2]], '#fff', null); cx.strokeStyle = INK; cx.lineWidth = 3; cx.beginPath(); cx.moveTo(x + (tail || -.2) * w, y + h / 2); cx.lineTo(x + (tail || -.2) * w + 10, y + h / 2 + 14); cx.lineTo(x + (tail || -.2) * w + 18, y + h / 2); cx.stroke(); small(s, x, y, 13, INK); }
// Gegenstände
function capsule(x, y, r, rot, col, hl) { cx.save(); cx.translate(x, y); cx.rotate(rot || 0); const w = r * 2.4, h = r;
  cx.beginPath(); cx.roundRect(-w / 2, -h / 2, w, h, h / 2); cx.fillStyle = lg(0, -h / 2, 0, h / 2, [[0, '#ffffff'], [1, '#c9ced4']]); cx.fill(); cx.save(); cx.clip(); cx.fillStyle = lg(0, -h / 2, 0, h / 2, [[0, col], [1, '#7a1010']]); cx.fillRect(0, -h / 2, w / 2, h); cx.restore();
  cx.strokeStyle = INK; cx.lineWidth = 2; cx.stroke(); cx.beginPath(); cx.moveTo(0, -h / 2); cx.lineTo(0, h / 2); cx.stroke(); cx.fillStyle = 'rgba(255,255,255,.7)'; cx.fillRect(-w / 2 + h * .4, -h * .3, w * .7, h * .16);
  if (hl) { cx.strokeStyle = '#ffc83d'; cx.lineWidth = 3; cx.beginPath(); cx.roundRect(-w / 2 - 5, -h / 2 - 5, w + 10, h + 10, h / 2 + 5); cx.stroke(); } cx.restore(); }
const ITEMS = {
  sock: (s) => { path([[-6, -20], [6, -20], [7, 6], [16, 10], [16, 20], [-2, 20], [-7, 12]], '#f2f2f2', INK, 2.5); for (let i = 0; i < 3; i++) { cx.fillStyle = i % 2 ? '#ee4035' : '#2f5fd1'; cx.fillRect(-6, -18 + i * 5, 12.5, 3); } },
  shaker: () => { rrect(-11, -14, 22, 34, 4, lg(-11, 0, 11, 0, [[0, '#2a2b30'], [.4, '#4a4d55'], [1, '#1d1e22']]), INK, 2.5); rrect(-12, -22, 24, 9, 3, '#ff5a36', INK, 2.5); rrect(-4, -27, 8, 6, 2, '#1d1e22', INK, 2); rrect(-8, -4, 16, 10, 2, '#ffc83d'); small('PRO', 0, 1, 7, INK); },
  dumbbell: () => { rrect(-14, -2.5, 28, 5, 2, '#b8bcc2', INK, 2); [-1, 1].forEach(d => { rrect(d * 14 - (d > 0 ? 0 : 7), -11, 7, 22, 2, '#2a2b30', INK, 2); rrect(d * 20 - (d > 0 ? 0 : 5), -8, 5, 16, 2, '#3a3c42', INK, 2); }); },
  shoe: () => { path([[-18, 12], [-18, -2], [-6, -6], [2, -14], [10, -12], [12, 2], [20, 6], [20, 12]], '#fafafa', INK, 2.5); cx.fillStyle = '#2f5fd1'; cx.beginPath(); cx.moveTo(-8, 2); cx.lineTo(4, -6); cx.lineTo(8, 4); cx.closePath(); cx.fill(); rrect(-19, 10, 40, 5, 2, '#2a2b30', INK, 2); },
  towel: () => { rrect(-18, -12, 36, 26, 4, '#f1efe9', INK, 2.5); cx.fillStyle = '#ee4035'; cx.fillRect(-18, 4, 36, 4); for (let i = -14; i <= 14; i += 4) { cx.fillStyle = 'rgba(0,0,0,.08)'; cx.fillRect(i, -10, 1.5, 22); } },
  bag: () => { cx.strokeStyle = INK; cx.lineWidth = 3; cx.beginPath(); cx.arc(0, -10, 9, Math.PI, TAU); cx.stroke(); rrect(-20, -10, 40, 26, 8, lg(0, -10, 0, 16, [[0, '#3a4e8a'], [1, '#22305a']]), INK, 2.5); rrect(-14, -4, 28, 4, 2, '#ffc83d'); },
  cap: () => { cx.beginPath(); cx.ellipse(0, 4, 17, 15, 0, Math.PI, TAU); cx.closePath(); cx.fillStyle = '#2f5fd1'; cx.fill(); cx.strokeStyle = INK; cx.lineWidth = 2.5; cx.stroke(); path([[4, 4], [24, 6], [24, 10], [2, 9]], '#1d3f99', INK, 2.5); ell(0, -11, 2, 1.5, '#1d3f99'); }
};
const ITEM_KEYS = Object.keys(ITEMS);
function item(k, x, y, sc) { cx.save(); cx.translate(x, y); cx.scale(sc || 1, sc || 1); ITEMS[k](); cx.restore(); }
// Dackel „Kommissar Rex“: läuft, schnüffelt, wedelt
function dog(x, y, s, t, sniff, dir) { cx.save(); cx.translate(x, y); cx.scale(s * (dir || -1), s); const wk = Math.sin(t * 14), body = '#9a5a2a', dark = '#6a3a18';
  shadow(0, 30, 52, 6, .3);
  [[-30, 1], [-20, -1], [22, 1], [32, -1]].forEach(([lx, ph], i) => { const a = wk * ph * .4; cx.save(); cx.translate(lx, 14); cx.rotate(a); rrect(-4.5, 0, 9, 16, 4, i % 2 ? dark : body, INK, 2); cx.restore(); });
  cx.save(); cx.translate(-44, -2); cx.rotate(-.6 + Math.sin(t * 18) * .35); rrect(-3, -22, 6, 24, 3, body, INK, 2); cx.restore(); // Schwanz wedelt
  rrect(-46, -8, 92, 30, 15, lg(0, -8, 0, 22, [[0, '#b8723a'], [1, '#7a4220']]), INK, 3);
  cx.fillStyle = 'rgba(255,220,180,.25)'; cx.fillRect(-36, 10, 70, 5); rrect(26, -12, 12, 26, 4, '#c1121f', INK, 2); ell(35, 14, 4, 4, '#e8b931', INK, 1.5); // Halsband
  cx.save(); cx.translate(48, -12 + (sniff ? Math.sin(t * 40) * 1.5 : 0)); ell(0, 0, 17, 14, lg(0, -14, 0, 14, [[0, '#c27c42'], [1, '#8a4c24']]), INK, 3); path([[8, -6], [30, 2], [30, 9], [8, 10]], '#b06a34', INK, 3); ell(31, 4, 4.5, 4, INK); ell(30, 2.6, 1.6, 1, '#888');
    ell(6, -4, 3, 3.4, '#fff', INK, 1.5); ell(7, -3.6, 1.6, 1.8, INK); cx.save(); cx.translate(-6, -4); cx.rotate(.3 + Math.sin(t * 7) * .15); rrect(-6, -2, 12, 26, 6, dark, INK, 2.5); cx.restore();
    if (sniff) { cx.strokeStyle = 'rgba(255,255,255,.8)'; cx.lineWidth = 2; for (let i = 0; i < 3; i++) { const r2 = 6 + ((t * 30 + i * 6) % 18); cx.beginPath(); cx.arc(36, 3, r2, -.6, .6); cx.stroke(); } } cx.restore();
  cx.restore(); }
// Teströhrchen mit Glanz, Flüssigkeit, Deckel und Barcode-Etikett
function tube(x, y, w, h, capCol, liq, label, tilt) { cx.save(); cx.translate(x, y); cx.rotate(tilt || 0); shadow(0, h / 2 + 4, w * .7, 4, .3);
  cx.beginPath(); cx.moveTo(-w / 2, -h / 2); cx.lineTo(-w / 2, h / 2 - w / 2); cx.arc(0, h / 2 - w / 2, w / 2, Math.PI, 0, true); cx.lineTo(w / 2, -h / 2); cx.closePath();
  cx.fillStyle = 'rgba(220,240,255,.28)'; cx.fill(); cx.save(); cx.clip(); const ly = -h / 2 + h * .38; cx.fillStyle = lg(-w / 2, 0, w / 2, 0, [[0, liq[1]], [.5, liq[0]], [1, liq[1]]]); cx.fillRect(-w / 2, ly, w, h); ell(0, ly, w / 2, 2.5, liq[0]);
    for (let i = 0; i < 3; i++) ell(-w * .15 + i * w * .15, ly + 12 + ((performance.now() / 30 + i * 40) % (h * .5)), 1.4, 1.4, 'rgba(255,255,255,.6)'); cx.restore();
  cx.strokeStyle = INK; cx.lineWidth = 2.5; cx.stroke(); cx.fillStyle = 'rgba(255,255,255,.55)'; cx.fillRect(-w / 2 + 3, -h / 2 + 4, 3, h - w);
  if (label) { rrect(-w / 2 + 1, -h / 2 + h * .2, w - 2, 14, 1, '#fffaf0', INK, 1.2); cx.fillStyle = INK; for (let i = 0; i < 7; i++) cx.fillRect(-w / 2 + 4 + i * (w - 8) / 7, -h / 2 + h * .2 + 3, (i % 3 ? 1 : 2), 8); }
  rrect(-w / 2 - 3, -h / 2 - 12, w + 6, 14, 3, lg(0, -h / 2 - 12, 0, -h / 2 + 2, [[0, capCol[0]], [1, capCol[1]]]), INK, 2.5); for (let i = 0; i < 4; i++) { cx.fillStyle = 'rgba(0,0,0,.2)'; cx.fillRect(-w / 2 + 1 + i * (w + 2) / 4, -h / 2 - 10, 1.5, 10); }
  cx.restore(); }
function pop(g, s, x, y, col) { (g.pops = g.pops || []).push({ s, x, y, col: col || '#fff', t: 0 }); }
function drawPops(g, dt) { if (!g.pops) return; g.pops = g.pops.filter(p => (p.t += dt) < 1); g.pops.forEach(p => { cx.globalAlpha = 1 - p.t; txt(p.s, p.x, p.y - p.t * 40, 26, p.col); cx.globalAlpha = 1; }); }
function err(g, msg) { g.errs++; MK.Audio.play('error'); pop(g, msg || 'Mist!', Wd / 2, Hd * .45, '#ff5a36'); g.shake = .35; if (g.errs > g.buf) end(g, false); }
function end(g, win) { if (!g.live) return; g.live = false; g.win = win; setTimeout(() => result(g), win ? 500 : 650); MK.Audio.play(win ? 'win' : 'stamp'); }

/* ---- 1 Röhrchen ---- */
const TUBE_CAPS = [['#ff7b6b', '#c1121f'], ['#8fb2ff', '#2f5fd1'], ['#7be0a9', '#1e8a52'], ['#ffe07a', '#d99a14'], ['#d4a6ff', '#7b4cf0']];
const G_tubes = { init(g) { const d = g.d; g.n = d < .35 ? 3 : d < .7 ? 4 : 5; g.swaps = Math.round(4 + d * 5); g.sd = Math.max(.3, .65 - d * .3) + (d >= .67 ? .06 : 0); g.slot = [...Array(g.n).keys()]; g.mine = 0; g.ph = 'show'; g.t0 = 1.6; g.seq = []; g.wrong = [];
    for (let i = 0; i < g.swaps; i++) { const a = Math.floor(Math.random() * g.n); let b = Math.floor(Math.random() * (g.n - 1)); if (b >= a) b++; g.seq.push([a, b]); } g.si = 0; g.st = 0; },
  sx(g, s) { const w = Math.min(Wd * .66, 440); return Wd / 2 - w / 2 + w * (s + .5) / g.n; },
  ty() { return Hd * .66; },
  tick(g, dt) { if (g.ph === 'show') { if ((g.t0 -= dt) < 0) { g.ph = 'mix'; MK.Audio.play('shuffle'); } return; }
    if (g.ph === 'mix') { g.st += dt / g.sd; if (g.st >= 1) { const [a, b] = g.seq[g.si]; const ia = g.slot.indexOf(a), ib = g.slot.indexOf(b); g.slot[ia] = b; g.slot[ib] = a; g.st = 0; g.si++; if (g.si < g.seq.length) MK.Audio.play('shuffle'); else g.ph = 'pick'; } } },
  draw(g) { scene('lab'); const ty = this.ty(), tw = Math.min(Wd * .78, 520);
    // Kontrolleur hinter dem Tisch, Hände an den Röhrchen, die gerade getauscht werden
    const pos = [], hands = []; for (let i = 0; i < g.n; i++) { let x = this.sx(g, g.slot[i]), y = ty, lift = 0;
      if (g.ph === 'mix' && g.si < g.seq.length) { const [a, b] = g.seq[g.si]; if (g.slot[i] === a || g.slot[i] === b) { const to = g.slot[i] === a ? b : a, k = (1 - Math.cos(g.st * Math.PI)) / 2; x = lerp(this.sx(g, g.slot[i]), this.sx(g, to), k); lift = Math.sin(k * Math.PI) * 36 * (g.slot[i] === a ? 1 : -.4); y -= lift; hands.push([x, y - 46]); } }
      pos.push([x, y, lift]); }
    const is = Math.min(1.05, Hd / 330); inspector(Wd / 2, ty - 92 * is, is, { mood: g.ph === 'pick' ? 'sus' : 'happy', look: Math.sin(g.t * 5), hands });
    table(Wd / 2 - tw / 2, ty + 34, tw, 34, false);
    // Ständer
    rrect(Wd / 2 - tw * .42, ty + 22, tw * .84, 12, 3, lg(0, ty + 22, 0, ty + 34, [[0, '#d6dbe0'], [1, '#8a9096']]), INK, 2.5);
    pos.forEach(([x, y, lift], i) => { const show = g.ph === 'show' || g.ph === 'done', mine = i === g.mine; tube(x, y, 26, 82, show && mine ? TUBE_CAPS[0] : ['#c9ced4', '#7d858e'], ['#ffe27a', '#e0a619'], true, lift ? Math.sin(g.t * 20) * .05 : 0);
      if (show && mine) { txt('DEINS', x, y - 66, 18, '#ff5a36'); path([[x - 7, y - 56], [x + 7, y - 56], [x, y - 48]], '#ff5a36', INK, 2); }
      if (g.wrong.includes(i)) { cx.strokeStyle = '#c1121f'; cx.lineWidth = 6; cx.beginPath(); cx.moveTo(x - 16, y - 16); cx.lineTo(x + 16, y + 16); cx.moveTo(x + 16, y - 16); cx.lineTo(x - 16, y + 16); cx.stroke(); } });
    hearts(g); caption(g.ph === 'show' ? 'Merk dir dein Röhrchen!' : g.ph === 'mix' ? 'Er mischt …' : g.ph === 'pick' ? 'Welches ist deins? Antippen!' : 'Getauscht!', Hd * .93); },
  down(g, x, y) { if (g.ph !== 'pick') return; let best = -1, bd = 1e9; for (let i = 0; i < g.n; i++) { const d = Math.abs(this.sx(g, g.slot[i]) - x); if (d < bd) { bd = d; best = i; } } if (bd > 50 || g.wrong.includes(best)) return;
    if (best === g.mine) { g.ph = 'done'; MK.Audio.play('crit'); pop(g, 'Getauscht!', Wd / 2, Hd * .4, '#3ccf8e'); end(g, true); } else { g.wrong.push(best); err(g, 'Falsches Röhrchen!'); } } };

/* ---- 2 Spürhund ---- */
const PILL_COL = ['#ee4035', '#2f5fd1', '#7b4cf0', '#1e8a52', '#d99a14', '#ff5fa2'];
const G_dog = { init(g) { const d = g.d; g.n = 2 + Math.round(d * 3); g.m = Math.min(ITEM_KEYS.length, g.n + 2); g.T = (12 - d * 3.5) * (d >= .67 ? 1.2 : 1); /* rote Ampel: etwas mehr Zeit */ g.tl = g.T; g.pills = []; g.sel = -1; g.full = [];
    for (let i = 0; i < g.n; i++) g.pills.push({ x: rnd(.2, .8), y: rnd(.36, .5), r: rnd(-.8, .8), c: PILL_COL[i % PILL_COL.length], hid: -1 }); g.spots = ITEM_KEYS.slice().sort(() => Math.random() - .5).slice(0, g.m); },
  sp(g, i) { const w = Math.min(Wd * .9, 600); return { x: Wd / 2 - w / 2 + w * (i + .5) / g.m, y: Hd * .82 }; },
  tick(g, dt) { g.tl -= dt; if (Math.random() < dt * 1.2) MK.Audio.play('sniff'); if (g.tl <= 0 && g.live) { const left = g.pills.filter(p => p.hid < 0).length; if (!left) return end(g, true); MK.Audio.play('bark'); g.errs = left; pop(g, `Wuff! ${left} gefunden`, Wd / 2, Hd * .4, '#ff5a36'); end(g, left <= g.buf); } },
  draw(g) { scene('room'); const tx = Wd * .14, tw = Wd * .72, ty = Hd * .3, th = Hd * .26;
    table(tx, ty, tw, th, true);
    g.pills.forEach((p, i) => { if (p.hid >= 0) return; capsule(Wd * p.x, Hd * p.y, 9, p.r, p.c, i === g.sel); });
    // Verstecke auf dem Boden
    g.spots.forEach((k, i) => { const p = this.sp(g, i), full = g.full.includes(i), hl = g.sel >= 0 && !full; ell(p.x, p.y + 22, 30, 8, 'rgba(0,0,0,.25)');
      if (hl) { ell(p.x, p.y, 34 + Math.sin(g.t * 8) * 2, 30, 'rgba(255,200,61,.25)', '#ffc83d', 3); }
      item(k, p.x, p.y, Math.min(1.25, Wd / 420)); if (full) { ell(p.x + 20, p.y - 20, 10, 10, '#3ccf8e', INK, 2); txt('✓', p.x + 20, p.y - 20, 14, '#fff', 'center', false); } });
    // Dackel kommt näher
    const prog = 1 - g.tl / g.T, dx = lerp(Wd + 70, Wd * .62, prog), ds = Math.min(1, Hd / 380); dog(dx, Hd * .66, ds, g.t, true, -1);
    if (prog > .2) bubble(dx - 10, Hd * .66 - 64 * ds, 86, 26, '*schnüffel*', .2);
    timer(g.tl / g.T, '#7be0a9'); hearts(g); caption(g.sel >= 0 ? 'Jetzt ein Versteck antippen' : 'Pille antippen', Hd * .22); },
  down(g, x, y) { let hit = -1; g.pills.forEach((p, i) => { if (p.hid < 0 && Math.hypot(Wd * p.x - x, Hd * p.y - y) < 30) hit = i; }); if (hit >= 0) { g.sel = hit; MK.Audio.play('tap'); return; }
    if (g.sel < 0) return; for (let i = 0; i < g.m; i++) { const p = this.sp(g, i); if (Math.abs(p.x - x) < 34 && Math.abs(p.y - y) < 34) { if (g.full.includes(i)) { MK.Audio.play('error'); return; } g.pills[g.sel].hid = i; g.full.push(i); g.sel = -1; MK.Audio.play('pop'); if (g.pills.every(q => q.hid >= 0)) { pop(g, 'Alles versteckt!', Wd / 2, Hd * .4, '#3ccf8e'); end(g, true); } return; } } } };

/* ---- 3 Pokerface ---- */
const QUESTIONS = ['Nehmen Sie irgendwas?', 'Was ist in der Flasche?', 'Woher kommen die Muskeln?', 'Sind das Ihre Pillen?', 'Schon mal von EPO gehört?', 'Warum schwitzen Sie so?', 'Wer ist Ihr Lieferant?'];
const G_poker = { init(g) { const d = g.d; g.rounds = 3; g.r = 0; g.w = Math.max(.15, .34 - d * .16); g.v = .5 + d * .6; this.next(g); },
  next(g) { g.q = pick(QUESTIONS); g.n = 0; g.hold = false; g.g0 = rnd(.42, .86 - g.w); g.cool = .5; g.tw = 0; },
  tick(g, dt) { g.cool -= dt; g.tw = Math.max(0, g.tw - dt); if (g.hold) { g.n += dt * g.v * (1 + g.n * .8); if (g.n >= 1) { g.hold = false; g.tw = .8; err(g, 'Gezuckt!'); if (g.live) this.next(g); } } },
  draw(g) { scene('dark'); const sw = Math.sin(g.t * 1.4) * .12, lx = Wd / 2 + Math.sin(sw) * 60;
    // Pendelnde Verhörlampe mit Lichtkegel
    cx.strokeStyle = '#111'; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(Wd / 2, 0); cx.lineTo(lx, 46); cx.stroke();
    cx.fillStyle = rg(lx, 60, 10, Hd * .9, [[0, 'rgba(255,240,190,.55)'], [1, 'rgba(255,240,190,0)']]); cx.beginPath(); cx.moveTo(lx - 18, 56); cx.lineTo(lx - Wd * .42, Hd); cx.lineTo(lx + Wd * .42, Hd); cx.lineTo(lx + 18, 56); cx.closePath(); cx.fill();
    path([[lx - 22, 60], [lx - 10, 42], [lx + 10, 42], [lx + 22, 60]], '#2a2b30', INK, 2.5); ell(lx, 60, 18, 5, '#fff6c8');
    const s = Math.min(1.1, Hd / 300), tw = (g.hold ? g.n : 0) * 1.2 + g.tw * 2;
    athlete(Wd * .27 + Math.sin(g.t * 50) * tw * 3, Hd * .58, s, { twitch: Math.min(1, tw), sweat: g.hold && g.n > .5 || g.tw > 0, red: g.n, mood: g.tw > 0 ? 'scared' : null, look: 1 });
    inspector(Wd * .74, Hd * .58, s, { mood: g.tw > 0 ? 'angry' : 'sus', look: -1, clip: true });
    table(Wd * .08, Hd * .7, Wd * .84, Hd * .16, true);
    bubble(Wd * .66, Hd * .2, Math.min(Wd * .5, 240), 34, g.q, -.1);
    // Lügen-O-Meter: Zeiger auf einer Skala, grünes Feld = ruhig loslassen
    const gx = Wd / 2, gy = Hd * .94, R = Math.min(Wd * .2, Hd * .3); cx.save(); cx.beginPath(); cx.arc(gx, gy, R + 10, Math.PI, TAU); cx.closePath(); cx.fillStyle = lg(0, gy - R, 0, gy, [[0, '#fffaf0'], [1, '#e9e0cc']]); cx.fill(); cx.strokeStyle = INK; cx.lineWidth = 3; cx.stroke();
    const ang = v => Math.PI + v * Math.PI; cx.lineWidth = 12; cx.strokeStyle = '#ddd'; cx.beginPath(); cx.arc(gx, gy, R - 4, Math.PI, TAU); cx.stroke();
    cx.strokeStyle = '#3ccf8e'; cx.beginPath(); cx.arc(gx, gy, R - 4, ang(g.g0), ang(g.g0 + g.w)); cx.stroke(); cx.strokeStyle = '#ff5a36'; cx.beginPath(); cx.arc(gx, gy, R - 4, ang(.9), TAU); cx.stroke();
    for (let i = 0; i <= 10; i++) { const a = ang(i / 10); cx.strokeStyle = INK; cx.lineWidth = i % 5 ? 1.5 : 2.5; cx.beginPath(); cx.moveTo(gx + Math.cos(a) * (R - 16), gy + Math.sin(a) * (R - 16)); cx.lineTo(gx + Math.cos(a) * (R - 10), gy + Math.sin(a) * (R - 10)); cx.stroke(); }
    const na = ang(clamp(g.n, 0, 1)); cx.strokeStyle = '#c1121f'; cx.lineWidth = 4; cx.lineCap = 'round'; cx.beginPath(); cx.moveTo(gx, gy); cx.lineTo(gx + Math.cos(na) * (R - 8), gy + Math.sin(na) * (R - 8)); cx.stroke(); cx.lineCap = 'butt'; ell(gx, gy, 7, 7, INK); small('NERVOSITÄT', gx, gy - R * .42, 9, INK); cx.restore();
    hearts(g); small(`Runde ${Math.min(g.r + 1, g.rounds)} / ${g.rounds}`, 52, 24, 13, '#fff');
    small(g.hold ? 'Im Grünen loslassen!' : 'Finger drauf halten', Wd / 2, Hd * .94 - Math.min(Wd * .2, Hd * .3) * .68, 11, '#c1121f'); },
  down(g) { if (g.cool > 0) return; g.hold = true; g.n = 0; MK.Audio.play('heart'); },
  up(g) { if (!g.hold) return; g.hold = false; if (g.n >= g.g0 && g.n <= g.g0 + g.w) { g.r++; MK.Audio.play('crit'); pop(g, 'Eiskalt!', Wd * .27, Hd * .3, '#3ccf8e'); if (g.r >= g.rounds) end(g, true); else this.next(g); } else { g.tw = .8; err(g, 'Gezuckt!'); if (g.live) this.next(g); } } };

/* ---- 4 Glücksrad ---- */
const GOOD = ['Zahnpasta meiner Oma', 'Hustensaft!', 'Zu viel Spinat', 'Mein Zwilling war\'s', 'Kreatin-Allergie', 'Bio-Brokkoli', 'Muttermilch-Shake'], BAD = ['Ähm …', 'Kein Kommentar', 'War das Testo?', 'Ups', 'Ich muss weg'];
const G_wheel = { init(g) { const d = g.d; g.seg = 10; g.good = Math.max(2, Math.round(g.seg * (.6 - d * .4))); g.w = 2.6 + d * 4.2; this.fill(g); },
  fill(g) { const arr = Array(g.seg).fill(0); let k = 0; while (k < g.good) { const i = Math.floor(Math.random() * g.seg); if (!arr[i]) { arr[i] = 1; k++; } } g.arr = arr; g.lab = arr.map(v => v ? pick(GOOD) : pick(BAD)); g.a = Math.random() * TAU; g.v = g.w; g.stop = false; g.wait = 0; g.flap = 0; },
  tick(g, dt) { const prev = Math.floor(g.a / (TAU / g.seg)); g.a += g.v * dt; g.flap = Math.max(0, g.flap - dt * 6); if (Math.floor(g.a / (TAU / g.seg)) !== prev) { MK.Audio.play('tick'); g.flap = 1; } if (g.stop) { g.v = Math.max(0, g.v - g.dec * dt); if (g.v === 0 && g.wait === 0) { g.wait = .01; this.land(g); } } },
  land(g) { const seg = TAU / g.seg, rel = ((-Math.PI / 2 - g.a) % TAU + TAU) % TAU, i = Math.floor(rel / seg) % g.seg; g.res = i;
    if (g.arr[i]) { pop(g, '„' + g.lab[i] + '“', Wd / 2, Hd * .14, '#3ccf8e'); end(g, true); } else { err(g, '„' + g.lab[i] + '“'); if (g.live) setTimeout(() => { if (g.live) this.fill(g); }, 900); } },
  draw(g) { scene('studio'); const r = Math.min(Wd * .3, Hd * .34), x = Wd / 2, y = Hd * .5, seg = TAU / g.seg;
    // Scheinwerfer
    [[.12, -.3], [.88, .3]].forEach(([sx, a]) => { cx.save(); cx.translate(Wd * sx, 0); cx.rotate(a + Math.sin(g.t + sx * 9) * .08); cx.fillStyle = lg(0, 0, 0, Hd, [[0, 'rgba(255,240,200,.35)'], [1, 'rgba(255,240,200,0)']]); cx.beginPath(); cx.moveTo(-8, 0); cx.lineTo(-Wd * .16, Hd); cx.lineTo(Wd * .16, Hd); cx.lineTo(8, 0); cx.fill(); cx.restore(); });
    // Ständer
    path([[x - 12, y], [x + 12, y], [x + 40, Hd * .95], [x - 40, Hd * .95]], lg(x - 40, 0, x + 40, 0, [[0, '#6b7079'], [.5, '#d6dbe0'], [1, '#5a5e66']]), INK, 3); rrect(x - 70, Hd * .93, 140, 12, 4, '#2a2b30', INK, 2.5);
    shadow(x + 6, y + 8, r + 8, r + 8, .35);
    ell(x, y, r + 16, r + 16, lg(x - r, y - r, x + r, y + r, [[0, '#ffe27a'], [.5, '#c99a10'], [1, '#7a5a00']]), INK, 3);
    for (let i = 0; i < 20; i++) { const a = i / 20 * TAU + g.t * .5, on = (i + Math.floor(g.t * 8)) % 3 === 0; ell(x + Math.cos(a) * (r + 8), y + Math.sin(a) * (r + 8), 4, 4, on ? '#fffbe0' : '#a0781a', INK, 1); if (on) ell(x + Math.cos(a) * (r + 8), y + Math.sin(a) * (r + 8), 9, 9, 'rgba(255,250,200,.25)'); }
    for (let i = 0; i < g.seg; i++) { const a0 = g.a + i * seg, a1 = a0 + seg; cx.beginPath(); cx.moveTo(x, y); cx.arc(x, y, r, a0, a1); cx.closePath();
      const gc = g.arr[i] ? (i % 2 ? ['#56e0a0', '#1e8a52'] : ['#7be0a9', '#2fae74']) : (i % 2 ? ['#ff8a6b', '#c1121f'] : ['#ff6b4a', '#d9442b']); cx.fillStyle = rg(x, y, 0, r, [[0, gc[0]], [1, gc[1]]]); cx.fill(); cx.strokeStyle = INK; cx.lineWidth = 2.5; cx.stroke();
      const ang = a0 + seg / 2, flip = Math.cos(ang) < 0; cx.save(); cx.translate(x, y); cx.rotate(ang + (flip ? Math.PI : 0)); cx.font = `800 ${Math.max(9, r * .075)}px system-ui, Arial`; cx.fillStyle = '#fff'; cx.strokeStyle = 'rgba(0,0,0,.55)'; cx.lineWidth = 2.5; cx.textAlign = flip ? 'left' : 'right'; const tx2 = flip ? -(r - 10) : r - 10, s2 = g.lab[i].slice(0, 18); cx.strokeText(s2, tx2, 4); cx.fillText(s2, tx2, 4); cx.restore(); }
    cx.fillStyle = rg(x - r * .3, y - r * .3, 0, r * 1.1, [[0, 'rgba(255,255,255,.28)'], [.5, 'rgba(255,255,255,0)']]); cx.beginPath(); cx.arc(x, y, r, 0, TAU); cx.fill();
    ell(x, y, r * .17, r * .17, rg(x - 6, y - 6, 2, r * .17, [[0, '#fff3b0'], [1, '#c99a10']]), INK, 3); small('DK', x, y, r * .1, INK);
    cx.save(); cx.translate(x, y - r - 12); cx.rotate(g.flap * .35); path([[-13, -12], [13, -12], [0, 18]], lg(-13, 0, 13, 0, [[0, '#fff'], [1, '#c9ced4']]), INK, 3); cx.restore();
    const is = Math.min(.8, Hd / 420); inspector(Wd * .86, Hd * .66, is, { mood: g.v < .5 ? 'sus' : 'neutral', look: -1, clip: true });
    hearts(g); caption(g.stop ? '…' : 'Tippen = Stopp', Hd * .06 + 20); },
  down(g) { if (g.stop || g.wait) return; g.stop = true; g.dec = g.v / rnd(.45, .7); MK.Audio.play('tap'); } };

/* ---- 5 Rotlicht-Grünlicht ---- */
function sneaker(x, y, s, t, mode) { cx.save(); cx.translate(x, y); cx.scale(s, s); shadow(0, 0, 26, 5, .35);
  const wk = mode === 'walk' ? Math.sin(t * 12) : 0, crouch = mode === 'walk' ? 8 : mode === 'freeze' ? 0 : 4;
  [[-1, wk], [1, -wk]].forEach(([d, a]) => { cx.save(); cx.translate(d * 7, -34 + crouch); cx.rotate(a * .5); rrect(-5, 0, 10, 30, 4, '#2a2b30', INK, 2); rrect(-7, 28, 16, 7, 3, '#fafafa', INK, 2); cx.restore(); });
  cx.save(); cx.translate(0, -34 + crouch); cx.rotate(mode === 'walk' ? .25 : 0);
  rrect(-16, -40, 32, 42, 10, lg(-16, 0, 16, 0, [[0, '#c4302a'], [.5, '#ee4035'], [1, '#c4302a']]), INK, 2.5);
  [[-1, 1], [1, -1]].forEach(([d, ph]) => { cx.save(); cx.translate(d * 14, -34); cx.rotate(d * .3 + (mode === 'walk' ? Math.sin(t * 12) * .4 * ph : 0) + (mode === 'freeze' ? d * 1.3 : 0)); rrect(-5, 0, 10, 30, 5, '#f0c29a', INK, 2); cx.restore(); });
  ell(0, -54, 15, 16, lg(0, -70, 0, -38, [[0, '#f6cfa8'], [1, '#d9a27a']]), INK, 2.5); cx.fillStyle = '#4a2c1a'; cx.beginPath(); cx.ellipse(0, -62, 15, 9, 0, Math.PI, TAU); cx.fill();
  const scared = mode === 'freeze' || mode === 'caught'; [-1, 1].forEach(d => { ell(d * 5 + 3, -55, 3.2, scared ? 4 : 2.8, '#fff', INK, 1.2); ell(d * 5 + 4, -54.5, 1.4, 1.6, INK); });
  if (scared) ell(3, -45, 3, 3.5, '#5a1a14'); else { cx.strokeStyle = INK; cx.lineWidth = 1.6; cx.beginPath(); cx.moveTo(-1, -46); cx.lineTo(7, -46); cx.stroke(); }
  cx.restore(); cx.restore(); }
const G_rlgl = { init(g) { const d = g.d; g.p = 0; g.T = (17 - d * 2) * (d >= .67 ? 1.2 : 1); g.tl = g.T; g.grace = Math.max(.22, .48 - d * .22); g.warn = Math.max(.3, .85 - d * .45); g.fake = d > .7; g.st = 'away'; g.stt = rnd(1.4, 2.6); g.hold = false; g.caughtT = 0; },
  tick(g, dt) { g.tl -= dt; g.stt -= dt; g.caughtT = Math.max(0, g.caughtT - dt);
    if (g.hold && g.caughtT <= 0) { g.p = Math.min(1, g.p + dt * .17); g.walk = (g.walk || 0) + dt * 6; if (g.p >= 1) { pop(g, 'Durch!', Wd / 2, Hd * .4, '#3ccf8e'); end(g, true); return; } }
    if (g.st === 'away' && g.stt <= 0) { g.st = 'warn'; g.stt = g.warn; MK.Audio.play('cough'); g.isFake = g.fake && Math.random() < .3; }
    else if (g.st === 'warn' && g.stt <= 0) { if (g.isFake) { g.st = 'away'; g.stt = rnd(.8, 1.8); } else { g.st = 'look'; g.stt = rnd(1.1, 2); g.lookT = 0; } }
    else if (g.st === 'look') { g.lookT += dt; if (g.hold && g.lookT > g.grace && g.caughtT <= 0) { g.caughtT = 1; g.p = Math.max(0, g.p - .2); err(g, 'Erwischt!'); } if (g.stt <= 0) { g.st = 'away'; g.stt = rnd(1.2, 3); } }
    if (g.tl <= 0 && g.live) { err(g, 'Zeit um!'); if (g.live) end(g, false); } },
  draw(g) { scene('hall'); const fy = Hd * .82, look = g.st === 'look';
    // Spinde an der Wand
    const lw = Math.max(34, Wd / 16); for (let x = 0; x < Wd * .78; x += lw) { rrect(x + 2, Hd * .2, lw - 4, Hd * .4, 3, lg(x, 0, x + lw, 0, [[0, '#5d7da8'], [.5, '#7b9cc6'], [1, '#4f6e96']]), INK, 2); for (let i = 0; i < 3; i++) rrect(x + lw * .3, Hd * .24 + i * 5, lw * .4, 2, 1, 'rgba(0,0,0,.35)'); ell(x + lw - 9, Hd * .42, 2, 4, '#c9ced4', INK, 1); }
    // Ausgang
    rrect(Wd * .8, Hd * .14, Wd * .16, Hd * .48, 4, '#2a2b30', INK, 3); rrect(Wd * .81, Hd * .16, Wd * .14, 16, 2, '#1e8a52'); small('AUSGANG', Wd * .88, Hd * .16 + 8, 9, '#fff');
    // Ampel
    const ax = Wd / 2, ay = 58; rrect(ax - 52, ay - 19, 104, 38, 10, '#1d1e22', INK, 3); rrect(ax - 4, ay - 30, 8, 12, 2, '#3a3c42', INK, 2); [['#ff3b2f', look], ['#ffc83d', g.st === 'warn'], ['#3ccf8e', g.st === 'away']].forEach(([c2, on], i) => { const lx = ax - 31 + i * 31; if (on) ell(lx, ay, 21, 21, 'rgba(255,255,255,.16)'); ell(lx, ay, 12, 12, on ? c2 : '#3a3d47', INK, 2); if (on) ell(lx - 3, ay - 4, 3.5, 2.2, 'rgba(255,255,255,.75)'); });
    // Kontrolleur am Ende des Gangs
    const ks = Math.min(.9, Hd / 360); inspector(Wd * .74, fy - 74 * ks, ks, { mood: look ? 'angry' : 'neutral', back: !look && g.st !== 'warn', look: -1, clip: look });
    if (g.st === 'warn') bubble(Wd * .74, fy - 170 * ks, 90, 28, g.isFake ? 'Hm …?' : 'Räusper …', .1);
    // du
    const px = lerp(Wd * .08, Wd * .6, g.p), mode = g.caughtT > 0 ? 'caught' : g.hold ? 'walk' : look ? 'freeze' : 'idle'; sneaker(px, fy, Math.min(1.1, Hd / 320), g.t, mode);
    if (g.caughtT > 0) txt('!', px, fy - 120, 34, '#ff3b2f');
    rrect(Wd * .08, fy + 16, Wd * .52, 8, 4, 'rgba(0,0,0,.35)'); rrect(Wd * .08, fy + 16, Wd * .52 * g.p, 8, 4, '#3ccf8e');
    timer(g.tl / g.T, '#7be0a9'); hearts(g); caption(g.hold ? 'Schleichen …' : 'Halten zum Schleichen', Hd * .95); },
  down(g) { g.hold = true; }, up(g) { g.hold = false; } };

/* ---- 6 Puls ---- */
function seg7(s, x, y, h, col) { cx.font = `800 ${h}px ui-monospace, Menlo, Consolas, monospace`; cx.textAlign = 'right'; cx.textBaseline = 'middle'; cx.fillStyle = 'rgba(60,207,142,.15)'; cx.fillText('888', x, y); cx.fillStyle = col; cx.shadowColor = col; cx.shadowBlur = 8; cx.fillText(s, x, y); cx.shadowBlur = 0; cx.textBaseline = 'alphabetic'; }
const G_pulse = { init(g) { const d = g.d; g.bpm = 62 + d * 28; g.tol = Math.max(.11, .2 - d * .07) + (d >= .67 ? .02 : 0); g.N = 12; g.k = 0; g.meter = .35 - g.buf * .1; g.next = 1.4; g.t2 = 0; g.change = d > .75; g.hit = new Set(); },
  tick(g, dt) { g.t2 += dt; const per = 60 / (g.bpm * (g.change && g.k >= 6 ? 1.22 : 1));
    if (g.t2 > g.next + g.tol) { if (!g.hit.has(g.k)) { g.meter += .17; MK.Audio.play('error'); pop(g, 'Verpasst', Wd / 2, Hd * .3, '#ff5a36'); } g.k++; g.next += per; if (g.k >= g.N) { g.meter < 1 ? end(g, true) : end(g, false); } }
    if (g.t2 >= g.next - .02 && g.played !== g.k) { g.played = g.k; MK.Audio.play('heart'); }
    g.meter = Math.max(0, g.meter - dt * .02); if (g.meter >= 1 && g.live) end(g, false); },
  draw(g) { scene('med'); const per = 60 / g.bpm;
    // Monitor
    const mw = Math.min(Wd * .86, 560), mh = Math.min(Hd * .62, 300), mx = (Wd - mw) / 2, my = Hd * .14;
    rrect(mx - 10, my - 10, mw + 20, mh + 34, 14, lg(0, my, 0, my + mh, [[0, '#e9edf0'], [1, '#aab3ba']]), INK, 3); rrect(mx, my, mw, mh, 8, '#06140f', INK, 2.5);
    cx.save(); cx.beginPath(); cx.roundRect(mx, my, mw, mh, 8); cx.clip();
    cx.strokeStyle = 'rgba(60,207,142,.12)'; cx.lineWidth = 1; for (let x = mx; x < mx + mw; x += 20) { cx.beginPath(); cx.moveTo(x, my); cx.lineTo(x, my + mh); cx.stroke(); } for (let y = my; y < my + mh; y += 20) { cx.beginPath(); cx.moveTo(mx, y); cx.lineTo(mx + mw, y); cx.stroke(); }
    const cy = my + mh * .55, cxm = mx + mw * .5, sp = mw * .3 / per; cx.strokeStyle = '#3cff8f'; cx.lineWidth = 3; cx.shadowColor = '#3cff8f'; cx.shadowBlur = 10; cx.beginPath();
    for (let x = mx; x <= mx + mw; x += 3) { const tt = g.t2 + (x - cxm) / sp; let y = cy; for (let b = g.k - 1; b < g.k + 6; b++) { const bt = g.next + (b - g.k) * per, dd = tt - bt; if (Math.abs(dd) < .09) { const u = (dd + .09) / .18; y = cy - (u < .3 ? Math.sin(u / .3 * Math.PI) * 10 : u < .55 ? -Math.sin((u - .3) / .25 * Math.PI * 2) * mh * .32 : Math.sin((u - .55) / .45 * Math.PI) * 14); } } x === mx ? cx.moveTo(x, y) : cx.lineTo(x, y); } cx.stroke(); cx.shadowBlur = 0;
    // Zielring
    const near = Math.abs(g.t2 - g.next) < g.tol; cx.strokeStyle = near ? '#ffe27a' : 'rgba(255,226,122,.6)'; cx.lineWidth = near ? 5 : 3; cx.beginPath(); cx.arc(cxm, cy, 26 + g.tol * 110, 0, TAU); cx.stroke();
    seg7(String(Math.round(g.bpm * (g.change && g.k >= 6 ? 1.22 : 1) + g.meter * 40)), mx + mw - 14, my + 28, 30, g.meter > .7 ? '#ff5a4a' : '#3cff8f'); small('BPM', mx + mw - 14 - 70, my + 28, 11, '#3cff8f', 'right');
    small(`${Math.min(g.k + 1, g.N)} / ${g.N}`, mx + 40, my + 22, 13, '#3cff8f');
    cx.restore();
    const beat = 1 + Math.max(0, .25 - Math.abs(g.t2 - g.next)) * 1.4; heartIcon(mx + 30, my + mh - 30, 14, true, beat);
    // Pulsbalken unter dem Monitor
    const bw = mw * .6, bx = (Wd - bw) / 2, by = my + mh + 6; small('PULS', bx - 26, by + 6, 10, INK); rrect(bx, by, bw, 12, 6, '#1d1e22', INK, 2); rrect(bx + 2, by + 2, (bw - 4) * clamp(g.meter, 0, 1), 8, 4, lg(bx, 0, bx + bw, 0, [[0, '#3ccf8e'], [.6, '#ffc83d'], [1, '#ff3b2f']]));
    hearts(g); caption('Tippen, wenn der Schlag im Ring ist', Hd * .95); },
  down(g) { if (!g.live) return; const dd = Math.abs(g.t2 - g.next); if (dd <= g.tol && !g.hit.has(g.k)) { g.hit.add(g.k); g.meter = Math.max(0, g.meter - .08); pop(g, 'Ruhig', Wd / 2, Hd * .3, '#3ccf8e'); MK.Audio.play('tap'); } else { g.meter += .14; MK.Audio.play('error'); } } };

/* ---- 7 Wasser ---- */
function bottle(x, y, w, h, fill, act, tilt, t) { cx.save(); cx.translate(x, y); cx.rotate(tilt || 0); shadow(0, h / 2 + 4, w * .7, 4, .3);
  const body = () => { cx.beginPath(); cx.moveTo(-w * .22, -h / 2); cx.lineTo(-w * .22, -h / 2 + h * .1); cx.quadraticCurveTo(-w / 2, -h / 2 + h * .18, -w / 2, -h / 2 + h * .3); cx.lineTo(-w / 2, h / 2 - 6); cx.quadraticCurveTo(-w / 2, h / 2, -w / 2 + 6, h / 2); cx.lineTo(w / 2 - 6, h / 2); cx.quadraticCurveTo(w / 2, h / 2, w / 2, h / 2 - 6); cx.lineTo(w / 2, -h / 2 + h * .3); cx.quadraticCurveTo(w / 2, -h / 2 + h * .18, w * .22, -h / 2 + h * .1); cx.lineTo(w * .22, -h / 2); cx.closePath(); };
  body(); cx.fillStyle = 'rgba(210,235,255,.35)'; cx.fill(); cx.save(); cx.clip(); const wy = h / 2 - (h * .82) * fill; cx.fillStyle = lg(-w / 2, 0, w / 2, 0, [[0, 'rgba(40,150,230,.85)'], [.5, 'rgba(90,190,255,.85)'], [1, 'rgba(30,130,210,.85)']]); cx.beginPath(); cx.moveTo(-w, wy); for (let xx = -w; xx <= w; xx += 4) cx.lineTo(xx, wy + Math.sin(xx * .25 + t * 6) * 2); cx.lineTo(w, h); cx.lineTo(-w, h); cx.closePath(); cx.fill();
    for (let i = -2; i <= 2; i++) { cx.fillStyle = 'rgba(0,0,0,.08)'; cx.fillRect(-w / 2, h * .08 + i * h * .1, w, 2); } cx.restore();
  body(); cx.strokeStyle = act ? '#ffc83d' : INK; cx.lineWidth = act ? 4 : 2.5; cx.stroke(); cx.fillStyle = 'rgba(255,255,255,.5)'; cx.fillRect(-w / 2 + 4, -h / 2 + h * .32, 3, h * .58);
  rrect(-w / 2 + 1, -h / 2 + h * .42, w - 2, h * .2, 2, '#fffaf0', INK, 1.5); small('AQUA', 0, -h / 2 + h * .52, Math.max(7, w * .22), '#1590b0');
  rrect(-w * .26, -h / 2 - 10, w * .52, 12, 3, lg(0, -h / 2 - 10, 0, -h / 2 + 2, [[0, '#8fd6ff'], [1, '#2e7fc0']]), INK, 2); cx.restore(); }
const G_water = { init(g) { const d = g.d; g.n = 2 + Math.round(d * 2); g.sips = 3; g.T = (11 - d * 1.5) * (d >= .67 ? 1.2 : 1); g.tl = g.T; g.b = Array(g.n).fill(g.sips); g.cur = 0; },
  tick(g, dt) { g.tl -= dt; g.tilt = Math.max(0, (g.tilt || 0) - dt * 3); if (g.tl <= 0 && g.live) { const left = g.b.filter(v => v > 0).length; if (left > g.buf) end(g, false); else end(g, true); } },
  draw(g) { scene('lab'); const is = Math.min(.95, Hd / 360); inspector(Wd * .82, Hd * .5, is, { mood: 'sus', look: -1, clip: true });
    const tw = Math.min(Wd * .86, 560), tx = Wd / 2 - tw / 2 - Wd * .05, ty = Hd * .62; table(tx, ty, tw, 40, true);
    // Urinbecher (leer) und Flaschen
    const w = Math.min(Wd * .66, 420), x0 = tx + 20, bw = Math.min(42, w / g.n * .5), bh = Math.min(120, Hd * .3);
    g.b.forEach((v, i) => { const x = x0 + w * (i + .5) / g.n, act = i === g.cur && g.live; bottle(x, ty - bh / 2 + 2 - (act ? (g.tilt || 0) * 20 : 0), bw, bh, v / g.sips, act, act ? -(g.tilt || 0) * .6 : 0, g.t); if (v === 0) { ell(x + bw * .5, ty - bh - 4, 11, 11, '#3ccf8e', INK, 2); txt('✓', x + bw * .5, ty - bh - 4, 14, '#fff', 'center', false); } });
    // Wisch-Hinweis
    const ax = Wd * .5, ay = Hd * .9 - ((g.t * 50) % 26); cx.strokeStyle = 'rgba(255,255,255,.9)'; cx.lineWidth = 5; cx.lineCap = 'round'; cx.beginPath(); cx.moveTo(ax, ay + 14); cx.lineTo(ax, ay - 12); cx.moveTo(ax - 10, ay - 2); cx.lineTo(ax, ay - 12); cx.lineTo(ax + 10, ay - 2); cx.stroke(); cx.lineCap = 'butt';
    timer(g.tl / g.T, '#8fd6ff'); hearts(g); caption('Nach oben wischen = Schluck', Hd * .96); },
  up(g, x, y, pr) { if (!pr) return; if (pr.sy - y > 35 && Math.abs(x - pr.sx) < 140) { if (g.cur >= g.n) return; g.b[g.cur]--; g.tilt = 1; MK.Audio.play('gulp'); if (g.b[g.cur] <= 0) { g.cur++; if (g.cur >= g.n) { pop(g, 'Verdünnt!', Wd / 2, Hd * .3, '#3ccf8e'); end(g, true); } } } else MK.Audio.play('tap'); } };

/* ---- 8 Memory ---- */
const LBL = ['A-7', 'B-3', 'C-9', 'D-1', 'E-5', 'F-2', 'G-8'], LCOL = ['#ee4035', '#2f8bff', '#1fbf73', '#e8a514', '#9b5cff', '#ff5fa2', '#4cc9c0'];
const G_memory = { init(g) { const d = g.d; g.p = 3 + Math.round(d * 2); g.prev = 5; g.miss = Math.max(2, 5 - Math.round(d * 2)); /* 5 Sekunden zum Merken */ g.missC = 0;
    const deck = []; for (let i = 0; i < g.p; i++) deck.push(i, i); deck.sort(() => Math.random() - .5); g.cards = deck.map(v => ({ v, up: true, got: false, f: 1 })); g.ph = 'show'; g.open = []; },
  lay(g) { const n = g.cards.length, cols = n <= 6 ? 3 : 4, rows = Math.ceil(n / cols), cw = Math.min(78, (Wd * .8) / cols - 10), ch = Math.min(cw * 1.3, (Hd * .64) / rows - 10); return { cols, cw, ch, x0: Wd / 2 - (cols * (cw + 10)) / 2 + 5, y0: Hd * .22 }; },
  tick(g, dt) { g.cards.forEach(c => { const tg = c.up || c.got ? 1 : 0; c.f += (tg - c.f) * Math.min(1, dt * 14); });
    if (g.ph === 'show' && (g.prev -= dt) <= 0) { g.ph = 'play'; g.cards.forEach(c => c.up = false); MK.Audio.play('flip'); } if (g.ph === 'wait' && (g.wt -= dt) <= 0) { g.open.forEach(i => g.cards[i].up = false); g.open = []; g.ph = 'play'; } },
  draw(g) { scene('lab'); const Lo = this.lay(g), rows = Math.ceil(g.cards.length / Lo.cols);
    // Probentablett
    rrect(Lo.x0 - 16, Lo.y0 - 16, Lo.cols * (Lo.cw + 10) + 22, rows * (Lo.ch + 10) + 22, 14, lg(0, Lo.y0, 0, Lo.y0 + rows * Lo.ch, [[0, '#e4e9ec'], [1, '#aab3ba']]), INK, 3);
    g.cards.forEach((c, i) => { const x = Lo.x0 + (i % Lo.cols) * (Lo.cw + 10), y = Lo.y0 + Math.floor(i / Lo.cols) * (Lo.ch + 10), k = c.f * 2 - 1, sx = Math.abs(k); cx.save(); cx.translate(x + Lo.cw / 2, y + Lo.ch / 2); cx.scale(Math.max(.04, sx), 1); const w = Lo.cw, h = Lo.ch;
      shadow(2, h / 2 + 3, w * .45, 4, .25);
      if (k > 0) { rrect(-w / 2, -h / 2, w, h, 8, c.got ? '#e3f8ec' : '#fffaf0', c.got ? '#1e8a52' : INK, 3); rrect(-w / 2 + 6, -h / 2 + 6, w - 12, h * .2, 3, LCOL[c.v]); small('PROBE', 0, -h / 2 + 6 + h * .1, Math.max(8, w * .12), '#fff');
        tube(0, h * .04, w * .16, h * .26, [LCOL[c.v], LCOL[c.v]], ['#ffe27a', '#e0a619'], false);
        small(LBL[c.v], 0, h * .32, Math.max(10, w * .17), INK); cx.fillStyle = INK; for (let b = 0; b < 12; b++) cx.fillRect(-w * .36 + b * w * .06, h * .4, b % 3 ? 1 : 2, 5); }
      else { rrect(-w / 2, -h / 2, w, h, 8, lg(0, -h / 2, 0, h / 2, [[0, '#3a5aa8'], [1, '#22346a']]), INK, 3); cx.strokeStyle = 'rgba(255,255,255,.18)'; cx.lineWidth = 2; for (let j = -3; j <= 3; j++) { cx.beginPath(); cx.moveTo(-w / 2 + 4, j * 10); cx.lineTo(w / 2 - 4, j * 10 + 12); cx.stroke(); } ell(0, 0, w * .22, w * .22, '#ffc83d', INK, 2.5); txt('DK', 0, 1, w * .18, INK, 'center', false); }
      cx.restore(); });
    hearts(g); caption(g.ph === 'show' ? `Merk dir die Etiketten! ${Math.ceil(g.prev)} s` : `Fehlversuche frei: ${Math.max(0, g.miss + g.buf - g.missC)}`, Hd * .1); },
  down(g, x, y) { if (g.ph !== 'play') return; const Lo = this.lay(g); g.cards.forEach((c, i) => { const cx0 = Lo.x0 + (i % Lo.cols) * (Lo.cw + 10), cy0 = Lo.y0 + Math.floor(i / Lo.cols) * (Lo.ch + 10); if (x >= cx0 && x <= cx0 + Lo.cw && y >= cy0 && y <= cy0 + Lo.ch && !c.up && !c.got && g.ph === 'play') { c.up = true; g.open.push(i); MK.Audio.play('flip');
      if (g.open.length === 2) { const [a, b] = g.open; if (g.cards[a].v === g.cards[b].v) { g.cards[a].got = g.cards[b].got = true; g.open = []; MK.Audio.play('crit'); if (g.cards.every(q => q.got)) { pop(g, 'Getauscht!', Wd / 2, Hd * .5, '#3ccf8e'); end(g, true); } } else { g.missC++; g.ph = 'wait'; g.wt = .7; if (g.missC > g.miss + g.buf) { g.errs = g.buf + 1; MK.Audio.play('error'); end(g, false); } else MK.Audio.play('error'); } } } }); } };
const IMPL = { tubes: G_tubes, dog: G_dog, poker: G_poker, wheel: G_wheel, rlgl: G_rlgl, pulse: G_pulse, water: G_water, memory: G_memory };

/* ---------- Ablauf ---------- */
const ampel = d => d < .34 ? 'g' : d < .67 ? 'y' : 'r';
// opts: { tier, practice, kind, d, buf, onEnd(win) }
DT.run = function (opts) {
  overlay(); const chk = opts.d != null ? { d: opts.d, stufe: 1 + Math.round(opts.d * 9), buf: opts.buf || 0, act: MK.labActive() } : (MK.labCheck(opts.tier) || { d: .3, stufe: 3, buf: 0, act: [] });
  const G0 = opts.kind ? GAMES.find(x => x.id === opts.kind) : pick(GAMES);
  const g = DT.cur = { id: G0.id, d: chk.d, buf: chk.buf, errs: 0, t: 0, live: false, opts, def: G0, impl: IMPL[G0.id] };
  ov.hidden = false; size(); MK.Audio.play('whistle');
  const pnl = ov.querySelector('.dt-panel'); pnl.hidden = false; const a = ampel(chk.d);
  pnl.innerHTML = `<div class="dt-card"><h3>${opts.practice ? 'Probelauf' : 'Dopingkontrolle!'}</h3>
    <div class="dt-amp"><i class="${a === 'r' ? 'on r' : ''}"></i><i class="${a === 'y' ? 'on y' : ''}"></i><i class="${a === 'g' ? 'on g' : ''}"></i><span>Stufe <b>${chk.stufe}</b>/10</span></div>
    <p class="dt-g"><b>${G0.name}</b><br>${G0.how}</p>
    ${chk.act.length ? `<p class="dt-s">Im Blut: ${chk.act.map(id => L(id).name + ' ' + Math.round(MK.labPur(id) * 100) + ' %').join(' · ')}</p>` : ''}
    ${g.buf ? `<p class="dt-s">Fehler-Puffer: ${'❤️'.repeat(g.buf)}</p>` : ''}
    <button class="btn ok" id="dtGo">Los!</button></div>`;
  $('dtGo').onclick = () => { pnl.hidden = true; g.impl.init(g); g.live = true; lastT = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); };
};
function loop(now) { const g = DT.cur; if (!g) return; const dt = Math.min(.05, (now - lastT) / 1000); lastT = now; g.t += dt;
  if (g.live) g.impl.tick(g, dt); cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (g.shake > 0) { g.shake -= dt; cx.translate(Math.sin(g.t * 70) * 6 * g.shake, 0); }
  g.impl.draw.call(g.impl, g); drawPops(g, dt);
  if (!g.live && g.win != null) { cx.save(); cx.translate(Wd / 2, Hd / 2); cx.rotate(-.18); const s = Math.min(1, (g.t - (g.endT || (g.endT = g.t))) * 6), k = 1 + (1 - s) * 1.5; cx.scale(k, k); txt(g.win ? 'SAUBER!' : 'POSITIV!', 0, 0, 64, g.win ? '#3ccf8e' : '#ff3b2f'); cx.restore(); }
  raf = requestAnimationFrame(loop); }
function result(g) { const pnl = ov.querySelector('.dt-panel'), o = g.opts; pnl.hidden = false;
  if (!o.practice) { if (g.win) S().stats.clean++; else S().stats.caught++; }
  pnl.innerHTML = `<div class="dt-card ${g.win ? 'w' : 'l'}"><h3>${g.win ? 'Sauber!' : 'Positiv!'}</h3><p>${o.practice ? (g.win ? 'Bestanden – im Ernstfall wärst du drin.' : 'Durchgefallen – im Ernstfall wärst du raus.') : g.win ? 'Der Kontrolleur winkt dich durch. Viel Erfolg!' : 'Raus aus dem Turnier. Keine Sperre – aber das Startgeld ist weg.'}</p><button class="btn ${g.win ? 'ok' : ''}" id="dtOk">${!o.practice && g.win ? 'Zum Turnier' : 'Weiter'}</button></div>`;
  $('dtOk').onclick = () => { DT.close(); o.onEnd && o.onEnd(g.win); }; }
DT.close = function () { cancelAnimationFrame(raf); DT.cur = null; if (ov) { ov.hidden = true; ov.querySelector('.dt-panel').hidden = true; } };
addEventListener('resize', () => { if (DT.cur && ov && !ov.hidden) size(); });

/* ======================================================================
   HAUSMEISTER GÜNTHER: „Psst … ich kenn da jemanden in der Jury“
   ====================================================================== */
MK.bribePrice = function () { const open = MK.TOURNEYS.filter(T => MK.tourOk(T)), top = open.length ? Math.max(...open.map(T => MK.tourFee(T))) : 500;
  return { money: MK.nice(Math.max(25000, top * 8 + MK.income() * 1200 + MK.S.money * .04) * MK.shopMul()), dia: Math.max(40, Math.round(30 + MK.totalLv() / 6)) }; };
let bp = null;
function guentherPortrait(cv) { const c = cv.getContext('2d'), n = MK.Scene.npcDef && MK.Scene.npcDef('guenther'); if (!n) return;
  const Lk = MK.Fig.resolveLook(n.look), lvv = Object.fromEntries(MK.MUSCLES.map(m => [m.id, n.lv])); c.clearRect(0, 0, cv.width, cv.height);
  const D = MK.Fig.dims(lvv, n.post, 0, null, { plain: true, belly: n.belly });
  const pose = { arms: { r: { t: [3, -14], b: 'down', zf: .8 }, l: { t: [D.shH + 4, 52], b: 'out' } }, look: { x: -.6, y: 0 }, head: { x: -2, y: 1 } };
  const gr = c.createRadialGradient(cv.width / 2, cv.height * .35, 10, cv.width / 2, cv.height / 2, cv.width * .7); gr.addColorStop(0, '#ffe9b0'); gr.addColorStop(1, '#b8874a'); c.fillStyle = gr; c.fillRect(0, 0, cv.width, cv.height);
  const sc = cv.height / 92; MK.Fig.render(c, cv.width / 2 + 6, cv.height * .38 + 262 * sc, sc, { key: 'gport', lv: lvv, L: Lk, pose, posture: n.post, belly: n.belly, plain: true, dpr: 1, face: 'proud' }); }
MK.bribeOpen = function () { const s = S(); ensure(); if (MK.Comp.cur || DT.cur) return;
  if (!bp) { bp = document.createElement('div'); bp.id = 'bribe'; bp.className = 'bribe'; $('view').appendChild(bp); }
  const pr = MK.bribePrice(), has = s.bribe > 0;
  bp.innerHTML = `<button class="bx" aria-label="Schließen">×</button><div class="bp-row"><div class="bp-pic"><canvas width="220" height="220"></canvas><span class="psst">Psst …</span></div>
    <div class="bp-txt"><h4>Hausmeister Günther</h4><p>${has ? '„Läuft. Der Richter schuldet mir noch was. Dein nächstes Turnier ist sicher.“' : '„Ich kenn da wen in der Jury. Ein kleiner Umschlag … und beim nächsten Turnier kommst du rein. Egal, was im Becher ist.“'}</p>
    ${has ? '<p class="bp-ok">✓ Richter bestochen – gilt fürs nächste Turnier</p>' : `<div class="bp-btns"><button class="btn" data-bribe="money" data-pr="${pr.money}">${MK.fmt(pr.money)} €</button><button class="btn dia" data-bribe="dia" data-pr="${pr.dia}" data-cur="dia">${pr.dia} 💎</button></div>`}</div></div>`;
  bp.hidden = false; MK.Audio.play('psst'); guentherPortrait(bp.querySelector('canvas'));
  bp.querySelector('.bx').onclick = () => { bp.hidden = true; };
  bp.querySelectorAll('[data-bribe]').forEach(b => b.onclick = () => { const dia = b.dataset.bribe === 'dia';
    if (dia) { if (s.dia < pr.dia) { MK.UI.toast(`Dir fehlen noch ${pr.dia - s.dia} 💎`); MK.Audio.play('error'); return; } s.dia -= pr.dia; }
    else if (!MK.spend(pr.money)) { MK.UI.toast(`Dir fehlen noch ${MK.fmt(pr.money - s.money)} €`); MK.Audio.play('error'); return; }
    s.bribe = 1; MK.Audio.play('coin'); MK.UI.toast('Umschlag übergeben. Günther zwinkert.', 'big'); MK.save(); MK.UI.quick(); MK.bribeOpen(); }); };
MK.bribeClose = () => { if (bp) bp.hidden = true; };

/* ======================================================================
   LABOR-SEITE (Reiter)
   ====================================================================== */
const mmss = s => { s = Math.max(0, Math.ceil(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return h ? `${h}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}` : `${m}:${String(x).padStart(2, '0')}`; };
MK.mmss = mmss;
const ib = t => `<button class="ib" type="button" data-info="${esc(t)}" aria-label="Info">i</button>`;
function paneLab(P) { const s = S(), l = ensure(), j = l.job, act = MK.labActive(), chk = MK.labCheck(3);
  let h = `<h3 class="sh">Labor ${ib('Mittel einmal erforschen, dann verbessern. Höhere Stufe = stärkere Wirkung und mehr Reinheit. Reinheit macht Dopingkontrollen vor Turnieren leichter und Nebenwirkungen seltener. Forschung braucht Zeit – mit Diamanten geht es sofort.')}</h3>`;
  if (j) { const it = L(j.id), left = (j.until - Date.now()) / 1000, k = 1 - left / j.dur;
    h += `<div class="card lab job" style="--lc:${it.col}"><div class="row"><div><h4>⚗️ ${it.name} → Stufe ${j.to}</h4><p class="small">noch <b data-labt>${mmss(left)}</b></p><div class="lbar"><i data-labk style="width:${Math.round(k * 100)}%"></i></div></div>
      <button class="btn dia" data-labskip="1" data-pr="${MK.labSkipCost()}" data-cur="dia">Sofort · ${MK.labSkipCost()} 💎</button></div></div>`; }
  h += `<div class="card lab info"><p class="small">${act.length ? `💉 Im Blut: <b>${act.map(id => L(id).name).join(', ')}</b> → vor jedem Turnier <b>Dopingkontrolle</b>${chk ? ` (ca. Stufe ${chk.stufe}/10)` : ''}` : 'Nichts im Blut – keine Kontrolle vor Turnieren.'}${s.bribe ? ' · <b class="okc">Richter bestochen ✓</b>' : ''}</p>
    <div class="bbtns"><button class="btn alt sm" data-labtest="1">Probelauf Kontrolle</button></div></div>`;
  MK.LAB.forEach(it => { const lv = MK.labLv(it.id), on = MK.labOn(it.id), pur = MK.labPur(it.id), cost = lv < LAB_MAX ? MK.labCost(it.id) : 0, tm = MK.labTime(it.id), busy = !!j, mine = j && j.id === it.id;
    const icon = `<svg class="lico" viewBox="0 0 24 24" aria-hidden="true">${ICONS[it.icon]}</svg>`;
    h += `<div class="card lab ${lv ? '' : 'new'} ${on ? 'on' : ''}" style="--lc:${it.col}"><div class="row"><div><h4>${icon} ${it.name} ${lv ? `<small>Stufe ${lv}/${LAB_MAX}</small>` : ''} ${ib(it.long + ' Nebenwirkung: ' + it.fx + ' (verschwindet nach dem Absetzen).')}</h4>
      <p class="pw">${lv ? it.eff(lv) : 'Noch nicht erforscht'}</p>
      ${lv ? `<div class="pur"><span>Reinheit</span><b style="--p:${Math.round(pur * 100)}%"><i></i></b><em>${Math.round(pur * 100)} %</em></div>` : ''}
      ${on ? `<p class="small okc">wirkt noch <b data-labon="${it.id}">${mmss((l.on[it.id] - Date.now()) / 1000)}</b></p>` : ''}</div>
      <span class="bbtns col">${lv < LAB_MAX ? `<button class="btn ${lv ? 'alt' : ''}" data-labres="${it.id}" data-pr="${cost}" ${busy ? 'disabled' : ''}>${mine ? 'Läuft …' : busy ? 'Labor belegt' : lv ? 'Verbessern' : 'Erforschen'}<br><small>${MK.fmt(cost)} € · ${mmss(tm)}</small></button>` : '<span class="tag">Max</span>'}
      ${lv ? `<button class="btn ok" data-labtake="${it.id}" data-pr="${MK.labDoseCost(it.id)}" ${on ? 'disabled' : ''}>${on ? 'Wirkt' : 'Nehmen'}<br><small>${MK.fmt(MK.labDoseCost(it.id))} € · ${Math.round(MK.labDur(it.id) / 6) / 10} min</small></button>` : ''}</span></div></div>`; });
  P.innerHTML = h;
  const re = () => { const sc = P.scrollTop; paneLab(P); P.scrollTop = sc; MK.UI.liveBuy && MK.UI.liveBuy(); MK.UI.quick(); MK.save(); };
  P.querySelectorAll('[data-labres]').forEach(b => b.onclick = () => { const id = b.dataset.labres; if (MK.labStart(id)) { MK.Audio.play('bubble'); MK.UI.toast(`${L(id).name}: Forschung gestartet`); re(); } else { MK.UI.toast(ensure().job ? 'Im Labor läuft schon eine Forschung' : `Dir fehlen noch ${MK.fmt(MK.labCost(id) - s.money)} €`); MK.Audio.play('error'); } });
  P.querySelectorAll('[data-labtake]').forEach(b => b.onclick = () => { const id = b.dataset.labtake, r = MK.labTake(id); if (r === true) { MK.Audio.play('inject'); MK.UI.toast(`${L(id).name} wirkt – ${L(id).eff(MK.labLv(id))}`, 'big'); re(); } else if (r === 'trainer') { MK.UI.toast('Erst einen Personal Trainer einstellen (Laden)'); MK.Audio.play('error'); } else { MK.UI.toast(`Dir fehlen noch ${MK.fmt(MK.labDoseCost(id) - s.money)} €`); MK.Audio.play('error'); } });
  P.querySelectorAll('[data-labskip]').forEach(b => b.onclick = () => { const c = MK.labSkipCost(); if (MK.labSkip()) { MK.Audio.play('level'); re(); } else { MK.UI.toast(`Dir fehlen noch ${c - s.dia} 💎`); MK.Audio.play('error'); } });
  P.querySelectorAll('[data-labtest]').forEach(b => b.onclick = () => { if (MK.Comp.cur) return; DT.run({ practice: true, tier: 2 }); if (matchMedia('(max-width:900px)').matches) $('stage').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
}
MK.EXTRA_PANES = Object.assign(MK.EXTRA_PANES || {}, { lab: paneLab });
MK.EXTRA_DEFS = Object.assign(MK.EXTRA_DEFS || {}, { lab: { name: 'Labor', icon: '<path d="M9.5 3h5M10.5 3v5.5L5 18.5A1.8 1.8 0 006.6 21h10.8a1.8 1.8 0 001.6-2.5L13.5 8.5V3M7.6 14h8.8"/>' } });
// Live-Zähler auf der Labor-Seite und im Kopf
MK.labUi = function () { const l = ensure(), j = l.job, el = $('labTxt'), btn = $('labBtn');
  if (el) { const act = MK.labActive().length, v = j ? mmss((j.until - Date.now()) / 1000) : act ? act + ' aktiv' : 'Bereit'; if (el._t !== v) { el._t = v; el.textContent = v; } }
  if (btn) { btn.classList.toggle('busy', !!j); }
  const P = $('pane'); if (!P) return; const t = P.querySelector('[data-labt]'); if (t && j) { t.textContent = mmss((j.until - Date.now()) / 1000); const k = P.querySelector('[data-labk]'); if (k) k.style.width = Math.round((1 - (j.until - Date.now()) / 1000 / j.dur) * 100) + '%'; }
  P.querySelectorAll('[data-labon]').forEach(e => { const u = l.on[e.dataset.labon]; e.textContent = mmss(((u || 0) - Date.now()) / 1000); }); };
})(window.MK);
