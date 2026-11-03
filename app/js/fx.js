/* Muskelklicker – Effekt-Ebene über der ganzen Seite:
   XP-Kugeln & Münzen (sammeln sich beim Klicken, fliegen in den Pausen in Balken/Geld),
   Kauf-Münzen (Geld → Gekauftes) mit Gold-Konfetti, rollende Zähler (Geld, Power, XP/s, XP-Balken).
   Alles läuft zeitbasiert pro Bild (dt) – flüssig bei jeder Bildrate. */
window.MK = window.MK || {};
(function (MK) {
const F = MK.Fx = {};
const TAU = Math.PI * 2, rnd = (a, b) => a + Math.random() * (b - a), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const $ = id => document.getElementById(id);
let cv = null, c = null, dpr = 1, W = 0, H = 0, wasLive = false;
const orbs = [], parts = [];
F.pend = { money: 0, xp: {} };
F.lastTap = 0;

/* ---------- Grundlagen ---------- */
F.init = function () {
  cv = document.createElement('canvas'); cv.id = 'fxl'; cv.setAttribute('aria-hidden', 'true'); document.body.appendChild(cv);
  c = cv.getContext('2d'); resize(); addEventListener('resize', () => { resize(); F._cvR = null; }); addEventListener('scroll', () => { F._cvR = null; }, { passive: true });
  buildSprites();
  // Knöpfe: gedrückt = kurz platt, beim Loslassen federn sie zurück (CSS „scale“)
  document.addEventListener('pointerdown', e => { const b = e.target.closest('button,.btn,[data-pr]'); if (b) { F.lastBtn = b; F.lastBtnT = performance.now(); } }, true);
  // Druck-Zauber: Welle ab der Druckstelle, beim Loslassen läuft ein Glanz über den Knopf
  document.addEventListener('pointerdown', e => { const b = e.target.closest('.btn'); if (!b || b.disabled) return; const r = b.getBoundingClientRect(), sp = document.createElement('span'); sp.className = 'rip'; sp.style.setProperty('--rx', (e.clientX - r.left) + 'px'); sp.style.setProperty('--ry', (e.clientY - r.top) + 'px'); b.appendChild(sp); setTimeout(() => sp.remove(), 520); b.classList.remove('rel'); }, true);
  const rel = e => { const b = e.target.closest && e.target.closest('.btn'); if (!b) return; b.classList.remove('rel'); void b.offsetWidth; b.classList.add('rel'); setTimeout(() => b.classList.remove('rel'), 520); };
  document.addEventListener('pointerup', rel, true);
};
function resize() { if (!cv) return; dpr = Math.min(1.5, window.devicePixelRatio || 1); /* Effekt-Ebene: 1,5× reicht für kleine Teile und spart viel Füllrate */ W = innerWidth; H = innerHeight; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
const SPR = {};
function sprite(key, r, fn) { const s = document.createElement('canvas'), k = 2; s.width = s.height = Math.ceil(r * 2 * k); const x = s.getContext('2d'); x.scale(k, k); x.translate(r, r); fn(x); SPR[key] = { c: s, r }; }
function buildSprites() {
  sprite('xp', 16, x => { let g = x.createRadialGradient(0, 0, 0, 0, 0, 16); g.addColorStop(0, 'rgba(255,255,235,1)'); g.addColorStop(.22, 'rgba(255,226,90,1)'); g.addColorStop(.5, 'rgba(255,170,40,.55)'); g.addColorStop(1, 'rgba(255,140,20,0)'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, 16, 0, TAU); x.fill(); });
  sprite('glow', 16, x => { const g = x.createRadialGradient(0, 0, 0, 0, 0, 16); g.addColorStop(0, 'rgba(255,240,170,.9)'); g.addColorStop(1, 'rgba(255,200,60,0)'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, 16, 0, TAU); x.fill(); });
  sprite('coin', 9, x => { x.fillStyle = '#a77d0e'; x.beginPath(); x.arc(0, 0, 9, 0, TAU); x.fill(); const g = x.createLinearGradient(-8, -8, 8, 8); g.addColorStop(0, '#fff1b0'); g.addColorStop(.45, '#f2c230'); g.addColorStop(1, '#c9971c'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, 7.6, 0, TAU); x.fill();
    x.strokeStyle = 'rgba(122,90,10,.75)'; x.lineWidth = 1.4; x.beginPath(); x.arc(0, 0, 5.2, 0, TAU); x.stroke(); x.fillStyle = 'rgba(255,255,255,.85)'; x.beginPath(); x.ellipse(-2.6, -3, 2.2, 1.2, -.6, 0, TAU); x.fill(); });
}

/* ---------- Koordinaten ---------- */
// Punkt in der Gym-Szene (Canvas-Koordinaten) → Bildschirm
F.fromScene = function (x, y) {
  const el = $('cv'), Sc = MK.Scene; if (!el || !Sc || !Sc.W) return { x, y };
  const now = performance.now(); if (!F._cvR || now - F._cvRt > 250) { F._cvR = el.getBoundingClientRect(); F._cvRt = now; } // Rechteck zwischenspeichern statt bei jeder Kugel neu messen
  const r = F._cvR, k = r.width / Sc.W, cam = Sc.cam; let X = x, Y = y;
  if (cam && cam.z > 1.001) { X = cam.cx + (x - cam.cx) * cam.z; Y = cam.cy + (y - cam.cy) * cam.z; }
  return { x: r.left + X * k, y: r.top + Y * k };
};
F.at = function (el) { if (!el) return null; const r = el.getBoundingClientRect(); if (!r.width && !r.height) return null; return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height, r }; };
const vis = p => p && p.x > -60 && p.y > -60 && p.x < W + 60 && p.y < H + 60;
// Ziel einer Kugel: XP → Ende der XP-Füllung, Geld → Geld-Anzeige oben
function targetOf(k) {
  if (k === 'xp') { const b = $('xpBarW'); const a = F.at(b); if (!a || a.r.bottom < 0 || a.r.top > H) return null; const f = clamp(F.barShown || 0, .03, .97); return { x: a.r.left + a.r.width * f, y: a.y, el: b }; }
  const m = $('money'), ch = m && m.closest('.chip'); const a = F.at(ch); if (!a || a.r.bottom < 0) return null; return { x: a.x - a.w * .25, y: a.y, el: ch };
}
function gatherPt() { const Sc = MK.Scene; if (!Sc || !Sc.geo) return null; const G = Sc.geo(); return F.fromScene(G.px + 95 * G.pScale, G.py - 300 * G.pScale); }

/* ---------- XP-Kugeln & Münzen ---------- */
// k: 'xp' | 'coin', v: Wert, (x,y) Bildschirm, opt: { g, auto }
F.orb = function (k, v, x, y, opt) {
  opt = opt || {}; if (!cv || !(v > 0)) return;
  if (!opt.force && ((MK.UI && MK.UI.view && MK.UI.view() !== 'gym') || !document.getElementById('skills').hidden || (MK.UI && MK.UI.tab && MK.UI.tab() === 'ward'))) return; // Imperium, Skillbaum, Umkleide: nichts fliegt durchs Bild
  if (k === 'xp') F.pend.xp[opt.g] = (F.pend.xp[opt.g] || 0) + v; else F.pend.money += v;
  // zu viele unterwegs → in eine vorhandene Kugel gleicher Art einrechnen (wird etwas größer)
  const same = orbs.filter(o => o.k === k && o.g === opt.g && !o.done);
  if (orbs.length > 120 && same.length) { const o = same[Math.floor(Math.random() * same.length)]; o.v += v; o.sz = Math.min(2.2, o.sz + .08); return; }
  const a = rnd(-Math.PI * .9, -Math.PI * .1), sp = rnd(140, 320);
  const o = { k, v, g: opt.g, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, st: opt.auto ? 'wait' : 'gather', delay: opt.auto ? rnd(.08, .2) : 0, sz: k === 'xp' ? rnd(.85, 1.1) : 1, spin: rnd(0, TAU), tr: [], seed: rnd(0, TAU) };
  orbs.push(o);
};
function launch(o, delay) {
  const T = targetOf(o.k); if (!T) { arrive(o, true); return; }
  o.st = 'fly'; o.t = -delay; o.sx = o.x; o.sy = o.y; o.tx = T.x + rnd(-6, 6); o.ty = T.y + rnd(-3, 3); o.el = T.el;
  const dx = o.tx - o.sx, dy = o.ty - o.sy, d = Math.hypot(dx, dy) || 1;
  // Bogen: leicht nach oben/außen ausholen, dann ins Ziel „gesaugt“
  const side = (o.seed % 2 > 1 ? 1 : -1), bend = clamp(d * .35, 40, 220);
  o.cx = o.sx + dx * .35 - dy / d * bend * side + (o.vx || 0) * .12; o.cy = o.sy + dy * .35 + dx / d * bend * side * .4 - bend * .5 + (o.vy || 0) * .12;
  o.dur = clamp(.42 + d / 1900, .45, .95);
}
let sndT = 0, sndN = 0;
function arrive(o, silent) {
  o.done = true;
  if (o.k === 'xp') { F.pend.xp[o.g] = Math.max(0, (F.pend.xp[o.g] || 0) - o.v); F.barKick = Math.min(1, (F.barKick || 0) + .35); }
  else { F.pend.money = Math.max(0, F.pend.money - o.v); F.moneyKick = Math.min(1, (F.moneyKick || 0) + .4); }
  if (silent) return;
  for (let i = 0; i < 3; i++) parts.push({ k: 'spark', x: o.tx, y: o.ty, vx: rnd(-90, 90), vy: rnd(-120, 20), life: 1, dec: rnd(2.6, 3.6), r: rnd(1.5, 3), col: o.k === 'xp' ? '255,220,90' : '255,236,150' });
  if (o.el) { o.el.classList.remove('hit'); void o.el.offsetWidth; o.el.classList.add('hit'); }
  const now = performance.now(); if (now - sndT > 55) { sndN = now - sndT < 400 ? Math.min(14, sndN + 1) : 0; sndT = now; MK.Audio && MK.Audio.play(o.k === 'xp' ? 'orb' : 'coinTick', sndN); }
}
// Alles sofort einsammeln (z. B. Wettkampf startet)
F.flush = function () { orbs.forEach(o => { if (!o.done) arrive(o, true); }); orbs.length = 0; };

/* ---------- Kaufen: Münzen fliegen vom Geld zum Gekauften, dann Gold-Konfetti ---------- */
let buys = [];
F.buy = function (toEl, opt) {
  opt = opt || {}; if (!cv) return;
  const T = F.at(toEl); const m = $('money'), S0 = F.at(m && m.closest('.chip'));
  if (!T || !vis(T)) return;
  const now = performance.now(); let B = buys.find(b => b.el === toEl && now - b.t0 < 450);
  if (B) { B.extra = Math.min(8, B.extra + 2); B.big = Math.min(2.2, B.big + .25); B.n += 2; B.t0 = now; spawnCoins(B, 2, S0, T); return; } // gleiche Stelle mehrmals schnell gekauft: Strom wird dichter, Knall größer
  B = { el: toEl, pt: { x: T.x, y: T.y }, t0: now, n: opt.n || 7, got: 0, big: opt.big || 1, extra: 0 };
  buys.push(B); if (buys.length > 12) buys.shift();
  if (!S0 || !vis(S0)) { F.burst(T.x, T.y, { gold: true, size: B.big }); return; }
  spawnCoins(B, B.n, S0, T);
};
function spawnCoins(B, n, S0, T) {
  const live = orbs.filter(o => o.k === 'buy').length; n = Math.min(n, Math.max(1, 70 - live));
  for (let i = 0; i < n; i++) { const o = { k: 'buy', B, x: S0.x + rnd(-12, 12), y: S0.y + rnd(-6, 6), vx: rnd(-60, 60), vy: rnd(-160, -60), t: 0, st: 'wait', delay: i * .045, sz: 1, spin: rnd(0, TAU), tr: [], seed: rnd(0, TAU) };
    orbs.push(o); }
}
// Ziel eines Kaufs: der Knopf, falls er noch da ist – sonst die Stelle, an der er war (die Liste wird nach dem Kauf neu aufgebaut)
function buyPt(B) { if (B.el && B.el.isConnected) { const a = F.at(B.el); if (a) { B.pt = { x: a.x, y: a.y }; return a; } } return B.pt; }
function buyArrive(o) {
  o.done = true; const B = o.B; B.got++;
  for (let i = 0; i < 2; i++) parts.push({ k: 'spark', x: o.tx, y: o.ty, vx: rnd(-80, 80), vy: rnd(-110, 10), life: 1, dec: rnd(2.8, 3.6), r: rnd(1.5, 2.6), col: '255,226,120' });
  const now = performance.now(); if (now - sndT > 45) { sndT = now; sndN = Math.min(14, sndN + 1); MK.Audio && MK.Audio.play('coinTick', sndN); }
  if (B.got >= B.n && !B.boomed) { B.boomed = true; const T = buyPt(B); if (T) { F.burst(T.x, T.y, { gold: true, size: B.big }); const el = B.el && B.el.isConnected ? B.el : (document.elementFromPoint(T.x, T.y) || {}).closest && document.elementFromPoint(T.x, T.y).closest('button,.btn'); if (el) { el.classList.remove('bought'); void el.offsetWidth; el.classList.add('bought'); const card = el.closest('.card'); if (card) { card.classList.remove('bought'); void card.offsetWidth; card.classList.add('bought'); } } } }
}
// Gold-Konfetti / Feuerwerk an einer Bildschirmstelle
F.burst = function (x, y, opt) {
  opt = opt || {}; const s = opt.size || 1, n = Math.round(26 * s), cols = opt.gold ? ['#ffd23f', '#f2c230', '#fff1b0', '#e6b422', '#ffffff', '#ffb627'] : ['#ffd23f', '#ee4035', '#3a86ff', '#2bb673', '#ff8fb1', '#ffffff'];
  if (parts.length > 500) parts.splice(0, parts.length - 400);
  for (let i = 0; i < n; i++) { const a = rnd(0, TAU), sp = rnd(160, 420) * Math.sqrt(s);
    parts.push({ k: 'conf', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 120, life: 1, dec: rnd(.7, 1.1), w: rnd(4, 8), h: rnd(2.5, 4.5), rot: rnd(0, TAU), vr: rnd(-12, 12), col: cols[i % cols.length], flip: rnd(0, TAU) }); }
  for (let i = 0; i < Math.round(10 * s); i++) { const a = i / Math.round(10 * s) * TAU, sp = rnd(220, 380) * s; parts.push({ k: 'star', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, dec: rnd(1.6, 2.2), r: rnd(3, 5), col: '255,236,150' }); }
  parts.push({ k: 'ring', x, y, life: 1, dec: 2.2, r: 8, R: 70 * s, col: '255,214,80' });
  parts.push({ k: 'flash', x, y, life: 1, dec: 4, R: 46 * s });
};

/* Neues Gewicht glüht golden nach – folgt den Gewichten, auch während sie sich bewegen */
let wg = { until: 0, t0: 0 };
F.weightGlow = function (sec) { wg = { until: performance.now() + sec * 1000, t0: performance.now(), dur: sec }; };
function drawWeightGlow(now) { if (now > wg.until || !MK.Scene || !MK.Scene.weightPage) return false; const pts = MK.Scene.weightPage(), age = (now - wg.t0) / 1000, k = Math.min(1, age / .2) * Math.min(1, (wg.until - now) / 700);
  c.globalCompositeOperation = 'lighter'; pts.forEach((p, i) => { const r = Math.max(22, p.r * 1.7) * (1 + Math.sin(age * 8 + i) * .08), g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, r); g.addColorStop(0, `rgba(255,236,150,${.55 * k})`); g.addColorStop(.6, `rgba(255,200,60,${.18 * k})`); g.addColorStop(1, 'rgba(255,190,40,0)'); c.fillStyle = g; c.beginPath(); c.arc(p.x, p.y, r, 0, TAU); c.fill();
    for (let j = 0; j < 3; j++) { const an = age * 2.4 + j * TAU / 3 + i, rr = r * .78, sx = p.x + Math.cos(an) * rr, sy = p.y + Math.sin(an) * rr, ss = (3 + Math.sin(age * 9 + j) * 1.4) * k; c.fillStyle = `rgba(255,248,215,${k})`; c.beginPath(); c.moveTo(sx, sy - ss * 2); c.lineTo(sx + ss * .45, sy - ss * .45); c.lineTo(sx + ss * 2, sy); c.lineTo(sx + ss * .45, sy + ss * .45); c.lineTo(sx, sy + ss * 2); c.lineTo(sx - ss * .45, sy + ss * .45); c.lineTo(sx - ss * 2, sy); c.lineTo(sx - ss * .45, sy - ss * .45); c.closePath(); c.fill(); } });
  c.globalCompositeOperation = 'source-over'; return true; }

/* ---------- Bild für Bild ---------- */
F.tick = function (dt) {
  if (!cv) return;
  const now = performance.now(), comp = MK.Comp && MK.Comp.cur;
  if (comp && orbs.some(o => o.k !== 'buy')) { orbs.filter(o => o.k !== 'buy').forEach(o => { if (!o.done) arrive(o, true); }); for (let i = orbs.length - 1; i >= 0; i--) if (orbs[i].done) orbs.splice(i, 1); }
  // Pause beim Klicken (oder zu viele gesammelt) → gesammelte Kugeln losschicken
  const gath = orbs.filter(o => o.st === 'gather');
  if (gath.length && (now - F.lastTap > 520 || gath.length > 34)) { const many = gath.length > 34; gath.sort((a, b) => a.t - b.t).forEach((o, i) => launch(o, i * (many ? .018 : .032))); }
  const G = gath.length ? gatherPt() : null;
  orbs.forEach(o => {
    o.t += dt; o.spin += dt * 9;
    if (o.st === 'wait') { o.vx *= Math.exp(-dt * 5); o.vy = o.vy * Math.exp(-dt * 5) + 200 * dt; o.x += o.vx * dt; o.y += o.vy * dt; if (o.t >= o.delay) { if (o.k === 'buy') { const T = buyPt(o.B); if (T) { o.st = 'fly'; o.t = 0; o.sx = o.x; o.sy = o.y; o.tx = T.x + rnd(-8, 8); o.ty = T.y + rnd(-5, 5); o.el = null; const dx = o.tx - o.sx, dy = o.ty - o.sy, d = Math.hypot(dx, dy) || 1; o.cx = o.sx + dx * .5 + rnd(-.25, .25) * d; o.cy = Math.min(o.sy, o.ty) - clamp(d * .25, 40, 160); o.dur = clamp(.4 + d / 2200, .42, .8); } else buyArrive(o); } else launch(o, 0); } }
    else if (o.st === 'gather' && G) { // um einen Punkt neben der Figur schweben, leicht kreisen
      const dx = G.x - o.x, dy = G.y - o.y, d = Math.hypot(dx, dy) || 1, orbit = 1 / (1 + d * .02);
      o.vx += (dx * 14 - dy * 9 * orbit) * dt; o.vy += (dy * 14 + dx * 9 * orbit) * dt; const damp = Math.exp(-dt * 3.2); o.vx *= damp; o.vy *= damp;
      o.x += o.vx * dt; o.y += o.vy * dt; }
    else if (o.st === 'fly' && o.t > 0) {
      const u = clamp(o.t / o.dur, 0, 1), e = u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; // sanft los, schnell ins Ziel, weich ankommen
      const a = 1 - e; o.x = a * a * o.sx + 2 * a * e * o.cx + e * e * o.tx; o.y = a * a * o.sy + 2 * a * e * o.cy + e * e * o.ty;
      if (u >= 1) { if (o.k === 'buy') buyArrive(o); else arrive(o); } }
    o.tr.unshift(o.x, o.y); if (o.tr.length > 10) o.tr.length = 10;
  });
  for (let i = orbs.length - 1; i >= 0; i--) if (orbs[i].done) orbs.splice(i, 1);
  parts.forEach(p => { p.life -= dt * p.dec;
    if (p.k === 'conf') { p.vx *= Math.exp(-dt * 1.6); p.vy = p.vy * Math.exp(-dt * 1.6) + 520 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.flip += dt * 9; }
    else if (p.k === 'spark' || p.k === 'star') { p.vx *= Math.exp(-dt * 3); p.vy = p.vy * Math.exp(-dt * 3) + 240 * dt; p.x += p.vx * dt; p.y += p.vy * dt; } });
  for (let i = parts.length - 1; i >= 0; i--) if (parts[i].life <= 0 || parts[i].y > H + 40) parts.splice(i, 1);
  draw();
  rollTick(dt);
};
function draw() {
  const live = orbs.length || parts.length || performance.now() < wg.until;
  if (!live) { if (wasLive) { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height); wasLive = false; cv.style.visibility = 'hidden'; } return; } // leere Ebene gar nicht erst zusammensetzen lassen
  if (!wasLive) cv.style.visibility = 'visible';
  wasLive = true; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height); c.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (!(MK.Comp && MK.Comp.cur) && MK.UI && MK.UI.view && MK.UI.view() === 'gym') drawWeightGlow(performance.now());
  // Flugspuren
  c.globalCompositeOperation = 'lighter';
  orbs.forEach(o => { if (false && o.k === 'xp' && o.tr.length >= 6) { c.strokeStyle = 'rgba(255,200,60,.22)'; c.lineWidth = 4 * o.sz; c.lineCap = 'round'; c.beginPath(); c.moveTo(o.tr[0], o.tr[1]); for (let i = 2; i < o.tr.length; i += 2) c.lineTo(o.tr[i], o.tr[i + 1]); c.stroke(); } });
  c.globalCompositeOperation = 'source-over';
  orbs.forEach(o => { if (o.k !== 'xp') return; const pul = 1 + Math.sin(o.spin * .7 + o.seed) * .06; MK.Art.drawBell(c, o.x, o.y, 30 * o.sz * pul, o.seed + o.spin * .22); }); // XP = kleine schwarze Hanteln
  c.globalCompositeOperation = 'lighter';
  parts.forEach(p => { if (p.k === 'flash') { const s = SPR.glow, r = p.R * (1.4 - p.life * .4); c.globalAlpha = Math.max(0, p.life); c.drawImage(s.c, p.x - r, p.y - r, r * 2, r * 2); c.globalAlpha = 1; } });
  c.globalCompositeOperation = 'source-over';
  orbs.forEach(o => { if (o.k === 'xp') return; const n = o.tr.length >= 4 ? Math.atan2(o.tr[1] - o.tr[3], o.tr[0] - o.tr[2]) : 0, sp = o.tr.length >= 4 ? Math.hypot(o.tr[1] - o.tr[3], o.tr[0] - o.tr[2]) : 0, rot = Math.sin(o.seed + o.spin * .35) * .5 + clamp(sp / 30, 0, 1) * Math.sin(n) * .3;
    MK.Art.drawBill(c, o.x, o.y, (o.k === 'buy' ? 26 : 23) * o.sz, rot, Math.cos(o.spin * .55 + o.seed)); }); // Geld = grüne Scheine, flattern im Flug
  parts.forEach(p => { const a = Math.max(0, Math.min(1, p.life * 1.6)); c.globalAlpha = a;
    if (p.k === 'conf') { c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.scale(1, Math.cos(p.flip)); c.fillStyle = p.col; c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); c.restore(); }
    else if (p.k === 'spark') { c.fillStyle = `rgb(${p.col})`; c.beginPath(); c.arc(p.x, p.y, p.r * (.5 + p.life * .5), 0, TAU); c.fill(); }
    else if (p.k === 'star') { c.fillStyle = `rgb(${p.col})`; const r = p.r * (.4 + p.life * .6); c.beginPath(); for (let i = 0; i < 8; i++) { const an = i / 8 * TAU, rr = i % 2 ? r * .35 : r; c.lineTo(p.x + Math.cos(an) * rr, p.y + Math.sin(an) * rr); } c.fill(); }
    else if (p.k === 'ring') { const k = 1 - p.life, r = p.r + (p.R - p.r) * (1 - Math.pow(1 - k, 3)); c.strokeStyle = `rgba(${p.col},${p.life * .9})`; c.lineWidth = 3 + p.life * 4; c.beginPath(); c.arc(p.x, p.y, r, 0, TAU); c.stroke(); } });
  c.globalAlpha = 1;
}

/* ---------- Rollende Zähler ---------- */
const R = { money: null, power: null, xps: 0 }; let xpsB = new Array(20).fill(0), xpsI = 0, xpsAcc = 0, xpsT = 0;
MK.xpRate = xp => { xpsAcc += xp; };
F.hold = { money: null }; // Rückkehr-Szene: Anzeige bleibt auf dem alten Wert, bis eingesammelt wird
const setT = (el, v) => { if (el && el._t !== v) { el._t = v; el.textContent = v; } };
function roll(cur, target, dt, speed) { if (cur == null || !isFinite(cur)) return target; const d = target - cur; if (Math.abs(d) <= Math.max(.5, Math.abs(target) * 1e-6)) return target; return cur + d * (1 - Math.exp(-dt * (speed || 7))); }
const fmtMoney = v => (v >= 1e5 && v < 1e6 ? MK.fmt1(v / 1e3) + ' Tsd' : MK.fmt(v)) + ' €';
function rollTick(dt) {
  const S = MK.S; if (!S) return;
  // XP pro Sekunde: gleitendes Fenster über 5 s (Viertelsekunden-Eimer)
  xpsT += dt; while (xpsT >= .25) { xpsT -= .25; xpsB[xpsI] = xpsAcc; xpsAcc = 0; xpsI = (xpsI + 1) % xpsB.length; }
  const xps = xpsB.reduce((a, v) => a + v, 0) / 5; R.xps = roll(R.xps, xps, dt, 3);
  // Geld
  const mT = F.hold.money != null ? F.hold.money : Math.max(0, S.money - F.pend.money); const m0 = R.money; R.money = roll(R.money, mT, dt, 8);
  setT($('money'), fmtMoney(R.money));
  const mc = $('money') && $('money').closest('.chip'); if (mc) { const jump = m0 != null && mT > m0 * 1.002 + 1; mc.classList.toggle('rolling', jump); if (F.moneyKick) { F.moneyKick = Math.max(0, F.moneyKick - dt * 3); mc.style.setProperty('--k', F.moneyKick.toFixed(3)); } }
  // Power
  if (MK.power) { const pT = F.hold.power != null ? F.hold.power : MK.power() - Object.values(F.pend.xp).reduce((a, v) => a + v, 0); const p0 = R.power; R.power = roll(R.power, Math.max(0, pT), dt, 6);
    setT($('power'), MK.fmtS(R.power)); setT($('xps'), R.xps > .5 ? '+' + MK.fmtS(R.xps) + ' XP/s' : 'Power');
    const pc = $('power') && $('power').closest('.chip'); if (pc) pc.classList.toggle('rolling', p0 != null && pT > p0 * 1.0005 + 1); }
  // XP-Balken: füllt sich, wenn die Kugeln ankommen (Vorschau-Streifen zeigt, was noch unterwegs ist)
  const ex = MK.curEx && MK.curEx(); if (ex) { const m = S.m[ex.g], need = MK.need(m.lv, ex.g), pend = F.pend.xp[ex.g] || 0;
    if (F.barLv !== m.lv + ':' + ex.g) { const up = F.barLv && F.barLv.split(':')[1] === ex.g; F.barLv = m.lv + ':' + ex.g; F.barShown = up ? 0 : m.xp / need; }
    const tgt = clamp((m.xp - pend) / need, 0, 1), ghost = clamp(m.xp / need, 0, 1);
    F.barShown = roll(F.barShown, tgt, dt, 9);
    const b = $('xpBar'), gh = $('xpGhost'); if (b) { const w = `scaleX(${F.barShown.toFixed(4)})`; if (b._w !== w) { b._w = w; b.style.transform = w; } }
    if (gh) { const w = `scaleX(${ghost.toFixed(4)})`; if (gh._w !== w) { gh._w = w; gh.style.transform = w; } }
    const bw = $('xpBarW'); if (bw && F.barKick) { F.barKick = Math.max(0, F.barKick - dt * 3); bw.style.setProperty('--k', F.barKick.toFixed(3)); } }
}
F.snapCounters = () => { R.money = null; R.power = null; };
})(window.MK);
