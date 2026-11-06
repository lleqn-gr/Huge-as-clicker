/* Muskelklicker – Figur.
   Jedes Körperteil ist ein anatomisches Profil entlang des Knochens: Grundbreite plus einzelne Muskelwölbungen
   (Bizeps, Trizeps, Schulter, Quadrizeps, Wade …), die an ihrer Stelle wachsen. Alle Teile einer Ebene werden zu einer
   Silhouette verschmolzen und bekommen nur außen eine feine Kontur – keine Trennstriche zwischen Körperteilen. */
window.MK = window.MK || {};
(function (MK) {
const Fig = MK.Fig = {};
const TAU = Math.PI * 2;

/* ---------- Farb-Helfer ---------- */
const hexRgb = h => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const rgbHex = (r, g, b) => '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => { const A = hexRgb(a), B = hexRgb(b); return rgbHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); };
const rgba = (h, a) => { const c = hexRgb(h); return `rgba(${c[0]},${c[1]},${c[2]},${Math.max(0, Math.min(1, a))})`; };
const lum = h => { const c = hexRgb(h); return (c[0] * .299 + c[1] * .587 + c[2] * .114) / 255; };
Fig.mix = mix; Fig.rgba = rgba; Fig.lum = lum;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
/* Wachstum: am Anfang deutlich, später langsamer, hört nie auf. lv darf Kommazahl sein (Level + XP-Anteil) → flüssig */
const grow = (lv, k) => { const x = Math.max(0, lv - 1); return (1 - Math.exp(-x / (k || 38))) + x * 0.0018; }; // jedes Level sichtbar
Fig.grow = grow;

/* ---------- Leinwand-Pool ---------- */
const BW = 420, BH = 500, OX = 210, OY = 470;
const pool = {};
function canv(key, s) {
  const w = Math.ceil(BW * s), h = Math.ceil(BH * s);
  let c = pool[key]; if (!c) c = pool[key] = document.createElement('canvas');
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  const x = c.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.clearRect(0, 0, w, h);
  x.setTransform(s, 0, 0, s, OX * s, OY * s); x.lineJoin = 'round'; x.lineCap = 'round';
  return [c, x];
}

/* ---------- Pfade ---------- */
function smoothClosed(pts) {
  const p = new Path2D(), n = pts.length; p.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < n; i++) { const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    p.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]); }
  p.closePath(); return p;
}
const ellP = (x, y, rx, ry, rot) => { const p = new Path2D(); p.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), rot || 0, 0, TAU); return p; };
const circP = (x, y, r) => ellP(x, y, r, r);
/* Glied mit Muskelprofil. bumps: {t: Lage 0..1, a: Höhe, w: Breite, side: 1 = linke Normale, -1 = rechte, 0 = beide} */
function limb(A, B, r0, r1, bumps, noCapA) {
  const dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len, N = 32;
  const wAt = (t, side) => { let w = lerp(r0, r1, t); for (const b of bumps) { if (b.side === 0 || b.side === side) { if (b.r) { const d = (t - b.t) / (t < b.t ? (b.wa || b.w) : (b.wb || b.w)); if (Math.abs(d) < 1) w += b.a * Math.pow(Math.cos(d * Math.PI / 2), b.r); } else w += b.a * Math.exp(-(((t - b.t) / b.w) ** 2)); } } return w; };
  const Lp = [], Rp = [];
  for (let i = 0; i <= N; i++) { const t = i / N, px = A.x + dx * t, py = A.y + dy * t, wl = wAt(t, 1), wr = wAt(t, -1); Lp.push([px + nx * wl, py + ny * wl]); Rp.push([px - nx * wr, py - ny * wr]); }
  const edge = new Path2D(); [Lp, Rp].forEach(side => { edge.moveTo(side[2][0], side[2][1]); for (let i = 3; i <= N - 2; i++) edge.lineTo(side[i][0], side[i][1]); });
  // runde Enden statt flacher Kappen: keine Ecken, die an Gelenken als Zacken herausstehen
  const ux = dx / len, uy = dy / len, cap = (C, wl, wr, dir) => { const out = []; for (let k = 1; k <= 3; k++) { const th = k / 4 * Math.PI, w = lerp(wl, wr, k / 4), cs = Math.cos(th), sn = Math.sin(th);
    out.push([C.x + nx * w * cs + ux * w * sn * dir * .9, C.y + ny * w * cs + uy * w * sn * dir * .9]); } return out; };
  const Bc = cap({ x: B.x, y: B.y }, wAt(1, 1), wAt(1, -1), 1), Ac = cap({ x: A.x, y: A.y }, wAt(0, -1), wAt(0, 1), -1).map(q => q);
  // Ac geht von rechts (−n) nach links (+n): Kosinus-Vorzeichen drehen
  const Ac2 = []; for (let k = 1; k <= 3; k++) { const th = k / 4 * Math.PI, w = lerp(wAt(0, -1), wAt(0, 1), k / 4); Ac2.push([A.x - nx * w * Math.cos(th) - ux * w * Math.sin(th) * .9, A.y - ny * w * Math.cos(th) - uy * w * Math.sin(th) * .9]); }
  const path = smoothClosed(Lp.concat(Bc, Rp.slice().reverse(), noCapA ? [] : Ac2));
  const axis = t => ({ x: A.x + dx * t, y: A.y + dy * t });
  const at = (t, side, inset) => { const w = wAt(t, side) - (inset || 0), p = axis(t); return { x: p.x + nx * w * side, y: p.y + ny * w * side }; };
  return { path, edge, at, axis, nx, ny, len, A, B, wAt };
}
const sideOut = (A, B, s) => { const dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy) || 1; return (-dy / len) * s >= 0 ? 1 : -1; };
/* Silhouette: erst alle Konturen, dann alle Füllungen → nur der äußere Rand bleibt als feine Linie */
function inkFill(c, paths, fill, ink, w) { c.strokeStyle = ink; c.lineWidth = w * 2; for (const p of paths) c.stroke(p); c.fillStyle = fill; for (const p of paths) c.fill(p); }
function bez(c, p1, c1, c2, p2, w, col, a) { if (a <= 0.005) return; c.strokeStyle = rgba(col, a); c.lineWidth = w; c.beginPath(); c.moveTo(p1.x, p1.y); c.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, p2.x, p2.y); c.stroke(); }
/* Volumen wie gerendert: Licht von oben links – helle Bahn auf der Lichtseite, Kernschatten auf der Gegenseite, Reflexlicht ganz am Rand */
function formShade(c, L, shd, k) { if (!L || !L.at) return; k = k == null ? 1 : k;
  const m = L.axis(.5), pa = L.at(.5, 1, 0), lit = ((pa.x - m.x) * -.6 + (pa.y - m.y) * -.8) > 0 ? 1 : -1;
  const band = (side, f, wf, col, a) => { c.strokeStyle = rgba(col, a * k); c.lineCap = 'round'; c.beginPath(); for (let i = 1; i <= 9; i++) { const t = .06 + i / 10 * .86, ax = L.axis(t), e = L.at(t, side, 0), w = Math.hypot(e.x - ax.x, e.y - ax.y), q = { x: ax.x + (e.x - ax.x) * f, y: ax.y + (e.y - ax.y) * f }; if (i === 1) { c.lineWidth = Math.max(1, w * wf); c.moveTo(q.x, q.y); } else c.lineTo(q.x, q.y); } c.stroke(); };
  band(-lit, .62, .75, shd, .24); band(-lit, .9, .22, '#ffffff', .07); band(lit, .4, .55, '#ffffff', .16); band(lit, .5, .16, '#ffffff', .14); }
function curve(c, p1, cp, p2, w, col, a) { if (a <= 0.005) return; c.strokeStyle = rgba(col, a); c.lineWidth = w; c.beginPath(); c.moveTo(p1.x, p1.y); c.quadraticCurveTo(cp.x, cp.y, p2.x, p2.y); c.stroke(); }
function line(c, x1, y1, x2, y2, w, col, a) { if (a <= 0.005) return; c.strokeStyle = rgba(col, a); c.lineWidth = w; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); }
/* Leistung: weiche Lichtpunkte als vorgerenderte Sprites (pro Farbe einmal) statt ~80 neuer Verläufe pro Bild – gleiches Aussehen */
const GLOWS = new Map();
function glowSpr(col) { let g = GLOWS.get(col); if (g) return g; g = document.createElement('canvas'); g.width = g.height = 128; const x = g.getContext('2d'), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, rgba(col, 1)); gr.addColorStop(1, rgba(col, 0)); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); GLOWS.set(col, g); if (GLOWS.size > 64) GLOWS.delete(GLOWS.keys().next().value); return g; }
function glow(c, x, y, r, col, a) { if (a <= 0.005) return; r = Math.max(1, r); const ga = c.globalAlpha; c.globalAlpha = ga * Math.min(1, a); c.drawImage(glowSpr(col), x - r, y - r, r * 2, r * 2); c.globalAlpha = ga; }
const P = (x, y) => ({ x, y });
const fd = (v, a, b) => clamp((v - a) / (b - a), 0, 1); // Stufe: blendet ein Detail zwischen a und b ein
const mid = (a, b, t) => ({ x: lerp(a.x, b.x, t == null ? .5 : t), y: lerp(a.y, b.y, t == null ? .5 : t) });

/* ---------- Körpermaße ---------- */
Fig.dims = function (lv, posture, breath, pump, opt) {
  opt = opt || {};
  pump = pump || {};
  const g = k => grow(lv[k] || 1) + (pump[k] || 0) * 0.06;
  const gA = g('arme'), gB = g('brust'), gL = g('beine'), gS = g('schulter'), gC = g('bauch'), gR = g('ruecken'), gN = g('nacken'), gE = g('ausdauer');
  const tot = Object.values(lv).reduce((a, v) => a + Math.max(0, v - 1), 0), gT = grow(tot / 6 + 1);
  const p = clamp(posture, 0, 1), br = 1 + (breath || 0) * 0.015;
  const la = opt.plain ? 0 : clamp(1 - tot / 45, 0, 1); // „Lauch-Faktor“: schäbige Klamotten, Haltung, Bäuchlein – verschwindet bis Gesamt-Level 45
  // Körperfett: Ausdauer verbrennt es, Bauchtraining und Gesamtmasse helfen ein bisschen. Lauch = skinny-fat.
  const fat = clamp(.6 - .5 * gE - .14 * gC - .08 * gT + (opt.belly || 0) * .05 + (opt.fatAdd || 0), .04, .78), sl = (1 - p) * (.6 + la * .6);
  const D = {
    gA, gB, gL, gS, gC, gR, gN, gE, gT, p, la, fat, def: clamp(1.45 - fat * 2.6, 0, 1), pmA: (pump.arme || 0), pmB: (pump.brust || 0),
    thigh: 64, shin: 62, U: 50, F: 46, torso: 96 + 4 * gT, neckL: 12.5 - 4.5 * gN - fat * 2.4, headRx: 17.5 + fat * 2.6, headRy: 20.5,
    hipH: 10.5 + 4 * gL, stance: 10.5 + 9 * p + 6 * gL,
    shH: 18 + 6.5 * gS + 4 * gB + 3.5 * gR - sl * 1.6, delt: 3.6 + 7.5 * gS + 1.2 * gA, trap: 1 + 8.5 * gN + 2 * gS,
    chestH: (15.5 + 11.5 * gB + 3 * gR - sl * 1.1 + fat * 3) * br, latH: (14.5 + 15 * gR + 3 * gB + fat * 3.2) * br, waistH: 13 + 1.5 * gB + 1.5 * gL + 1.2 * gR - .8 * gC + fat * 6,
    neckR: 4.8 + 5.5 * gN + 1.2 * gT + fat * 1.6,
    uR0: 4.2 + 3.2 * gA + 1.5 * gS + fat * 2.2, uR1: 3.2 + 1.8 * gA + fat * .8, bi: .5 + 9.5 * gA, tri: .4 + 6.5 * gA,
    fR0: 3.8 + 4.8 * gA + (pump.arme || 0) * .8 + fat * 1, fR1: 2.6 + 2.3 * gA, brach: .4 + 7.5 * gA, handR: 5.6 + 2 * gA,
    tR0: 7.5 + 6.5 * gL + fat * 3.6, tR1: 5 + 3.4 * gL + fat * 1.4, quad: .6 + 11 * gL, vmo: .3 + 6 * gL, add: .8 + 4 * gL,
    cR0: 4.6 + 2.8 * gL + fat * 1.2, cR1: 2.9 + 1 * gL, calf: .5 + 7.5 * gL,
    armOut: .07 + .2 * gR + .08 * gA + .05 * gS + .04 * gB + fat * .03 - sl * .03, slump: sl, belly: fat * 10.5 + la * 1.2 + (opt.belly || 0) * .6, handle: Math.max(0, fat - .2) * 12
  };
  if (opt.fem) { // weibliche Variante: schmalere Schultern und Taille, breitere Hüfte, feinerer Kopf
    Object.assign(D, { fem: 1, shH: D.shH - 2.5, chestH: D.chestH - 1.5, latH: D.latH - 2.5, waistH: D.waistH - 2.2, hipH: D.hipH + 2.6, tR0: D.tR0 + 1.6, delt: D.delt * .8, trap: D.trap * .5,
      neckR: D.neckR - 1, uR0: D.uR0 - .5, bi: D.bi * .6, fR0: D.fR0 - .4, fR1: D.fR1 - .3, handR: D.handR - .7, headRx: D.headRx - 1, headRy: D.headRy - .6, thigh: D.thigh - 2, shin: D.shin - 2, torso: D.torso - 5 }); D.gT *= .4;
  }
  return D;
};

/* ---------- Skelett ---------- */
function ik(S, T, U, F, s, bend) {
  const dx = T.x - S.x, dy = T.y - S.y; let d = Math.hypot(dx, dy); d = clamp(d, Math.abs(U - F) + 1, U + F - 0.6);
  const base = Math.atan2(dy, dx), a = Math.acos(clamp((U * U + d * d - F * F) / (2 * U * d), -1, 1));
  const e1 = { x: S.x + Math.cos(base + a) * U, y: S.y + Math.sin(base + a) * U }, e2 = { x: S.x + Math.cos(base - a) * U, y: S.y + Math.sin(base - a) * U };
  let e;
  if (bend === 'down') e = e1.y + s * e1.x * .35 > e2.y + s * e2.x * .35 ? e1 : e2; // unten, im Zweifel eher außen else if (bend === 'up') e = e1.y < e2.y ? e1 : e2;
  else if (bend === 'in') e = e1.x * s < e2.x * s ? e1 : e2; else e = e1.x * s > e2.x * s ? e1 : e2;
  return { el: e, ha: { x: S.x + Math.cos(base) * d, y: S.y + Math.sin(base) * d } };
}
Fig.skeleton = function (D, P) {
  const J = { knee: {}, foot: {}, hip: {}, sh: {}, el: {}, ha: {}, hs: {}, zf: {} };
  const legs = P.legs || {}, mode = P.mode || 'ground';
  const sides = [['l', -1], ['r', 1]];
  if (mode === 'ground') {
    let hy = 0;
    sides.forEach(([k, s]) => {
      const L = legs[k] || {}, d = L.d || 0, kk = L.k || 0, lift = L.lift || 0;
      const foot = { x: s * (D.stance + (P.stanceAdd || 0)) + s * (L.fx || 0), y: (P.footY || 0) - lift * 12 - (P.toe || 0) * 8 };
      const ka = kk * 0.55, shinV = D.shin * (1 - d * 0.3 - lift * 0.25);
      const knee = { x: foot.x + s * Math.sin(ka) * D.shin * 0.9, y: foot.y - Math.cos(ka) * shinV };
      const hx = s * D.hipH, tv = D.thigh * (1 - d * 0.78), dx = hx - knee.x;
      const y = knee.y - Math.sqrt(Math.max(16, tv * tv - dx * dx));
      J.foot[k] = foot; J.knee[k] = knee; hy += y / 2;
    });
    J.hipY = hy;
  } else if (mode === 'sit') { // Sitzen/Liegen mit Knien zur Kamera (verkürzt)
    J.hipY = P.hipY;
    sides.forEach(([k, s]) => { const sp = P.spread || 0;
      const knee = { x: s * (D.hipH + 3 + sp), y: J.hipY + D.thigh * (P.thighF == null ? .3 : P.thighF) };
      const foot = { x: s * (D.hipH + 5 + sp * 1.4), y: knee.y + D.shin * (P.shinF == null ? .4 : P.shinF) };
      J.knee[k] = knee; J.foot[k] = foot; });
  } else {
    J.hipY = P.hipY;
    const raise = P.raise || 0, bb = P.bendBack || 0;
    sides.forEach(([k, s]) => {
      const knee = { x: s * (D.hipH + 1), y: J.hipY + D.thigh * (1 - raise * 0.85) };
      const foot = { x: s * (D.hipH + 0.5), y: knee.y + D.shin * (1 - raise * 0.55 - bb * 0.6) };
      J.knee[k] = knee; J.foot[k] = foot;
    });
  }
  const bx = P.bodyX || 0, dy = P.dy || 0;
  J.hipX = bx;
  sides.forEach(([k, s]) => { J.hip[k] = { x: bx + s * D.hipH, y: J.hipY }; });
  const lean = P.lean || 0, tw = P.twist || 0;
  J.shX = bx + tw * 7; J.shY = J.hipY - D.torso * (1 - lean * 0.3) + D.slump * 4;
  J.armsY = J.shY + 8 - (P.shrug || 0) * 9 + D.slump * 2;
  const hd = P.head || {};
  J.head = { x: J.shX + (hd.x || 0), y: J.shY - D.neckL - D.headRy + D.slump * 6 + lean * 11 + (hd.y || 0), tilt: hd.tilt || 0 };
  const arms = P.arms || {};
  sides.forEach(([k, s]) => {
    const k0 = k, sp = arms[k] || { a: [D.armOut, D.armOut * 0.55 + 0.04] };
    const S = { x: J.shX + s * D.shH * (1 + s * tw * 0.12), y: J.armsY };
    const zf = sp.zf || 0, U = D.U * (1 - zf * 0.55), F = D.F * (1 - zf * 0.55);
    let el, ha;
    if (sp.blend) { // weicher Übergang zwischen zwei Armhaltungen (für Ruhe-Animationen aus der Startposition)
      const A = sp.blend.a || { a: [D.armOut, D.armOut * 0.55 + 0.04] }, B = sp.blend.b, k = clamp(sp.blend.k, 0, 1), zf2 = lerp(A.zf || 0, B.zf || 0, k), U2 = D.U * (1 - zf2 * 0.55), F2 = D.F * (1 - zf2 * 0.55);
      const hand = q => { if (q.a) { const fx = q.fx == null ? 1 : q.fx, ux = q.ux == null ? 1 : q.ux, e = { x: S.x + s * Math.sin(q.a[0]) * U2 * ux, y: S.y + Math.cos(q.a[0]) * U2 }; return { x: e.x + s * Math.sin(q.a[1]) * F2 * fx, y: e.y + Math.cos(q.a[1]) * F2 }; }
        return q.w ? { x: s * q.w[0] + bx, y: q.w[1] } : { x: J.shX + s * q.t[0], y: J.shY + q.t[1] }; };
      const h1 = hand(A), h2 = hand(B), r = ik(S, { x: lerp(h1.x, h2.x, k), y: lerp(h1.y, h2.y, k) }, U2, F2, s, (k < .5 ? A.b : B.b) || 'out');
      el = r.el; ha = r.ha; J.sh[k0] = S; J.el[k0] = el; J.ha[k0] = ha; J.hs[k0] = 1 + zf2 * 0.55; J.zf[k0] = zf2; J.flex = J.flex || {}; J.flex[k0] = lerp(A.flex || 0, B.flex || 0, k); return;
    }
    if (sp.a) {
      const u = sp.a[0], f = sp.a[1], fx = sp.fx == null ? 1 : sp.fx, ux = sp.ux == null ? 1 : sp.ux;
      el = { x: S.x + s * Math.sin(u) * U * ux, y: S.y + Math.cos(u) * U };
      ha = { x: el.x + s * Math.sin(f) * F * fx, y: el.y + Math.cos(f) * F };
    } else {
      const T = sp.w ? { x: s * sp.w[0] + bx, y: sp.w[1] } : { x: J.shX + s * sp.t[0], y: J.shY + sp.t[1] };
      const r = ik(S, T, U, F, s, sp.b || 'out'); el = r.el; ha = r.ha;
    }
    J.sh[k] = S; J.el[k] = el; J.ha[k] = ha; J.hs[k] = 1 + zf * 0.55; J.zf[k] = zf; J.flex = J.flex || {}; J.flex[k] = sp.flex || 0;
  });
  // dy verschiebt alles
  if (dy) {
    const sh = o => { o.y += dy; };
    ['knee', 'foot', 'hip', 'sh', 'el', 'ha'].forEach(g => Object.values(J[g]).forEach(sh));
    J.hipY += dy; J.shY += dy; J.armsY += dy; J.head.y += dy;
  }
  return J;
};

/* ---------- Posen & Animationen ----------
   Jede Funktion bekommt t (0→1→0 innerhalb einer Wiederholung), ph (Phase 0..1), D (Maße), x (Extras) */
const rest = D => ({ a: [D.armOut, D.armOut * 0.55 + 0.04] });
const PO = Fig.poses = {
  stand: (t, ph, D) => ({ face: 'neutral' }),
  curl: (t, ph, D) => { const f = lerp(0.12, 2.55, t); const a = { a: [D.armOut * 0.6 + .06, f], fx: 0.62, flex: t }; return { arms: { l: a, r: a }, props: [{ k: 'db', h: 'l', o: 'h' }, { k: 'db', h: 'r', o: 'h' }], face: t > .35 ? 'strain' : 'focus' }; },
  hammer: (t, ph, D) => { const f = lerp(0.1, 2.7, t); const a = { a: [D.armOut * 0.35, f], fx: 0.2, flex: t }; return { arms: { l: a, r: a }, props: [{ k: 'db', h: 'l', o: 'v' }, { k: 'db', h: 'r', o: 'v' }], face: t > .35 ? 'strain' : 'focus' }; },
  altcurl: (t, ph, D, x) => { const side = (x.rep || 0) % 2 ? 'l' : 'r', o = side === 'l' ? 'r' : 'l'; const A = {}; A[side] = { a: [D.armOut * 0.5, lerp(0.12, 2.8, t)], fx: 0.35, flex: t }; A[o] = { a: [D.armOut * 0.5, 0.12] }; return { arms: A, head: { x: (side === 'l' ? -3 : 3) * t }, look: { x: side === 'l' ? -1 : 1, y: 0 }, props: [{ k: 'db', h: 'l', o: 'h' }, { k: 'db', h: 'r', o: 'h' }], face: t > .4 ? 'strain' : 'focus' }; },
  tricepsOH: (t, ph, D) => { const y = lerp(-D.U - D.F + 14, -34, t); const a = { t: [7, y], b: 'up' }; return { arms: { l: a, r: a }, armsBehind: t > 0.45, props: [{ k: 'db', h: 'c', o: 'v', big: 1 }], face: t > .4 ? 'strain' : 'focus', head: { y: 2 * t } }; },
  barcurl: (t, ph, D) => { const f = lerp(0.1, 2.6, t); const a = { a: [D.armOut * 0.3 + 0.06, f], fx: 0.45, flex: t }; return { arms: { l: a, r: a }, props: [{ k: 'bar', w: 1.05 }], face: t > .35 ? 'strain' : 'focus' }; },
  fly: (t, ph, D) => { const a = { t: [lerp(D.shH + D.U + D.F - 26, 12, t), lerp(14, 34, t)], b: 'down', zf: t * 0.35 }; return { arms: { l: a, r: a }, props: [{ k: 'db', h: 'l', o: 'v' }, { k: 'db', h: 'r', o: 'v' }], face: t > .4 ? 'strain' : 'focus' }; },
  dips: (t, ph, D) => { const hip = -118 - 18 + t * 30; const sh = hip - D.torso; const a = { w: [D.shH + 12, -150], b: 'out' }; return { mode: 'hang', hipY: hip, bendBack: .8, arms: { l: a, r: a }, props: [{ k: 'dipbars', y: -150 }], face: t > .4 ? 'strain' : 'focus' }; },
  crossover: (t, ph, D) => { const a = { t: [lerp(D.shH + 48, -2, t), lerp(-34, 52, t)], b: 'out', zf: t * 0.25 }; return { arms: { l: a, r: a }, props: [{ k: 'cable', h: 'l' }, { k: 'cable', h: 'r' }], face: t > .4 ? 'strain' : 'focus' }; },
  chestpress: (t, ph, D) => { const a = { t: [lerp(D.shH + 10, D.shH - 6, t), lerp(26, 18, t)], b: 'down', zf: t * 0.85 }; return { legs: { l: { d: .92, k: .35 }, r: { d: .92, k: .35 } }, arms: { l: a, r: a }, props: [{ k: 'bench' }, { k: 'db', h: 'l', o: 'h' }, { k: 'db', h: 'r', o: 'h' }], face: t > .4 ? 'strain' : 'focus' }; },
  dbpress: (t, ph, D) => { const a = { t: [lerp(D.shH + 10, D.shH - 4, t), lerp(-6, -D.U - D.F + 14, t)], b: 'out' }; return { arms: { l: a, r: a }, props: [{ k: 'db', h: 'l', o: 'h' }, { k: 'db', h: 'r', o: 'h' }], face: t > .4 ? 'strain' : 'focus' }; },
  lateral: (t, ph, D) => { const u = lerp(D.armOut, 1.52, t); const a = { a: [u, u + 0.08] }; return { arms: { l: a, r: a }, props: [{ k: 'db', h: 'l', o: 'v' }, { k: 'db', h: 'r', o: 'v' }], face: t > .4 ? 'strain' : 'focus', shrug: t * .15 }; },
  frontraise: (t, ph, D) => { const a = { t: [D.shH - 6, lerp(D.U + D.F - 6, 8, t)], b: 'down', zf: Math.sin(t * Math.PI / 2) * 0.8 }; return { arms: { l: a, r: a }, props: [{ k: 'db', h: 'l', o: 'h' }, { k: 'db', h: 'r', o: 'h' }], face: t > .4 ? 'strain' : 'focus' }; },
  ohpress: (t, ph, D) => { const a = { t: [D.shH + 14, lerp(-4, -D.U - D.F + 12, t)], b: 'out' }; return { arms: { l: a, r: a }, props: [{ k: 'bar', w: 1.7 }], face: t > .3 ? 'strain' : 'focus', head: { y: t * 2 } }; },
  pullup: (t, ph, D) => { const hip = -132 - t * 52, bar = -318; const a = { w: [D.shH + 16, bar], b: 'out' }; return { mode: 'hang', hipY: hip, arms: { l: a, r: a }, props: [{ k: 'pullbar', y: bar }], face: t > .3 ? 'strain' : 'focus', look: { x: 0, y: -1 } }; },
  latpull: (t, ph, D) => { const a = { t: [D.shH + 30, lerp(-D.U - D.F + 12, -10, t)], b: 'out' }; return { legs: { l: { d: .92, k: .3 }, r: { d: .92, k: .3 } }, arms: { l: a, r: a }, props: [{ k: 'latbar' }, { k: 'bench' }], face: t > .4 ? 'strain' : 'focus' }; },
  row: (t, ph, D) => { const a = { t: [D.shH - 2, lerp(D.U + D.F - 18, 34, t)], b: 'out', zf: 0.15 }; return { lean: .75, legs: { l: { d: .3, k: .1 }, r: { d: .3, k: .1 } }, arms: { l: a, r: a }, props: [{ k: 'bar', w: 1.2 }], face: t > .4 ? 'strain' : 'focus', look: { x: 0, y: -1 } }; },
  crunch: (t, ph, D) => { const a = { t: [D.shH * 0.45, -40 + t * 10], b: 'out' }; return { lean: t * 0.85, legs: { l: { d: .15 }, r: { d: .15 } }, arms: { l: a, r: a }, armsBehind: true, face: t > .4 ? 'strain' : 'focus', look: { x: 0, y: 1 } }; },
  legraise: (t, ph, D) => { const bar = -318; const a = { w: [D.shH + 16, bar], b: 'out' }; return { mode: 'hang', hipY: -132, raise: t, arms: { l: a, r: a }, props: [{ k: 'pullbar', y: bar }], face: t > .4 ? 'strain' : 'focus' }; },
  twist: (t, ph, D, x) => { const dir = (x.rep || 0) % 2 ? 1 : -1, tw = dir * t; const cx = tw * 30, cy = -96 - 128; const l = { w: [-(cx) + 6, cy + 40 - 128 * 0], b: 'down' }; return { twist: tw, legs: { l: { d: .35, k: .2 }, r: { d: .35, k: .2 } }, arms: { l: { t: [-cx + 8, 44], b: 'down' }, r: { t: [cx + 8, 44], b: 'down' } }, props: [{ k: 'db', h: 'c', o: 'v', big: 1 }], face: t > .4 ? 'strain' : 'focus', look: { x: dir, y: 0 } }; },
  squat: (t, ph, D) => { const a = { t: [D.shH - 4, lerp(D.U + D.F - 8, 10, t)], b: 'down', zf: t * 0.75 }; return { legs: { l: { d: t * .95, k: t * .6 }, r: { d: t * .95, k: t * .6 } }, arms: { l: a, r: a }, face: t > .4 ? 'strain' : 'focus' }; },
  lunge: (t, ph, D, x) => { const fr = (x.rep || 0) % 2 ? 'l' : 'r', bk = fr === 'l' ? 'r' : 'l'; const L = {}; L[fr] = { d: t * .9, k: .15 }; L[bk] = { d: t * .55, k: -.05, fx: -4 }; const a = { t: [D.waistH + 7, D.torso - 16], b: 'out' }; return { legs: L, arms: { l: a, r: a }, face: t > .4 ? 'strain' : 'focus' }; },
  calf: (t, ph, D) => { const a = { t: [D.waistH + 7, D.torso - 16], b: 'out' }; return { toe: t * 1.3, footY: -11, arms: { l: a, r: a }, props: [{ k: 'step' }], face: t > .5 ? 'strain' : 'focus' }; },
  hack: (t, ph, D) => { const a = { t: [D.shH - 1, -3], b: 'down' }; return { legs: { l: { d: t * .9, k: t * .5 }, r: { d: t * .9, k: t * .5 } }, lean: -.05, arms: { l: a, r: a }, props: [{ k: 'hack' }], face: t > .3 ? 'strain' : 'focus' }; },
  benchLie: (t, ph, D) => { const a = { t: [lerp(D.shH + 14, D.shH - 1, t), lerp(26, 9, t)], b: 'down', zf: .15 + t * .8 }; return { lie: 1, mode: 'sit', hipY: -120, thighF: .5, shinF: .34, spread: 16, arms: { l: a, r: a }, props: [{ k: 'bench', lie: 1 }, { k: 'bar', w: 1.7 }], face: t > .4 ? 'strain' : 'focus' }; },
  flySit: (t, ph, D) => { const u = lerp(1.55, 1.05, t), a = { a: [u, 3.05], zf: t * .7 }; return { legs: { l: { d: .92, k: .3 }, r: { d: .92, k: .3 } }, arms: { l: a, r: a }, props: [{ k: 'bench' }, { k: 'flymachine' }], face: t > .4 ? 'strain' : 'focus' }; },
  dbrow: (t, ph, D) => { const a = { t: [D.shH - 2, lerp(D.U + D.F - 18, 30, t)], b: 'out', zf: .15 }; return { lean: .7, legs: { l: { d: .3, k: .1 }, r: { d: .3, k: .1 } }, arms: { l: a, r: a }, props: [{ k: 'db', h: 'l', o: 'h' }, { k: 'db', h: 'r', o: 'h' }], face: t > .4 ? 'strain' : 'focus', look: { x: 0, y: -1 } }; },
  flyLie: (t, ph, D) => { const a = { t: [lerp(D.shH + D.U + D.F - 22, D.shH - 3, t), lerp(16, 8, t)], b: 'down', zf: t * .75 }; return { lie: 1, mode: 'sit', hipY: -120, thighF: .5, shinF: .34, spread: 16, arms: { l: a, r: a }, props: [{ k: 'bench', lie: 1 }, { k: 'db', h: 'l', o: 'h' }, { k: 'db', h: 'r', o: 'h' }], face: t > .4 ? 'strain' : 'focus' }; },
  crunchLie: (t, ph, D) => { const a = { t: [D.shH * .45, -40 + t * 8], b: 'out' }; return { lie: 1, mode: 'sit', hipY: -120, thighF: .34 - t * .04, shinF: .26, spread: 6, lean: t * .55, arms: { l: a, r: a }, armsBehind: true, props: [{ k: 'mat', lie: 1 }], face: t > .4 ? 'strain' : 'focus', look: { x: 0, y: 1 } }; },
  twistSit: (t, ph, D, x) => { const dir = (x.rep || 0) % 2 ? 1 : -1, tw = dir * t, cx = tw * 26; return { mode: 'sit', hipY: -34, thighF: .26, shinF: .44, spread: 6, twist: tw, lean: .22, arms: { l: { t: [-cx + 10, 46], b: 'down' }, r: { t: [cx + 10, 46], b: 'down' } }, props: [{ k: 'mat' }, { k: 'db', h: 'c', o: 'v', big: 1 }], face: t > .4 ? 'strain' : 'focus', look: { x: dir, y: 0 } }; },
  dbpressSit: (t, ph, D) => { const a = { t: [lerp(D.shH + 10, D.shH - 4, t), lerp(-6, -D.U - D.F + 14, t)], b: 'out' }; return { legs: { l: { d: .92, k: .3 }, r: { d: .92, k: .3 } }, arms: { l: a, r: a }, props: [{ k: 'bench' }, { k: 'db', h: 'l', o: 'h' }, { k: 'db', h: 'r', o: 'h' }], face: t > .4 ? 'strain' : 'focus' }; },
  bbsquat: (t, ph, D) => { const a = { t: [D.shH + 22, -7], b: 'down' }; return { legs: { l: { d: t * .95, k: t * .65 }, r: { d: t * .95, k: t * .65 } }, arms: { l: a, r: a }, props: [{ k: 'rack' }, { k: 'bar', w: 1.9, at: 'neck' }], face: t > .3 ? 'strain' : 'focus' }; },
  deadlift: (t, ph, D) => { const u = 1 - t; const a = { a: [0.04, 0.04] }; return { lean: u * .6, legs: { l: { d: u * .62, k: u * .25 }, r: { d: u * .62, k: u * .25 } }, arms: { l: a, r: a }, props: [{ k: 'bar', w: 1.8, bend: t, floor: 1 }], face: t > .2 && t < .9 ? 'strain' : 'focus', look: { x: 0, y: -u } }; },
  shrug: (t, ph, D) => ({ shrug: t, arms: { l: { a: [0.08, 0.08] }, r: { a: [0.08, 0.08] } }, props: [{ k: 'db', h: 'l', o: 'h' }, { k: 'db', h: 'r', o: 'h' }], face: t > .4 ? 'strain' : 'focus' }),
  facepull: (t, ph, D) => { const a = { t: [lerp(D.shH - 10, D.shH * 0.6, t), lerp(14, -30, t)], b: 'up', zf: lerp(0.8, 0.1, t) }; return { arms: { l: a, r: a }, props: [{ k: 'rope', h: 'l' }, { k: 'rope', h: 'r' }], face: t > .4 ? 'strain' : 'focus' }; },
  farmer: (t, ph, D) => { const w = Math.sin(ph * TAU); return { shrug: .2, legs: { l: { lift: Math.max(0, w) * .6 }, r: { lift: Math.max(0, -w) * .6 } }, bodyX: w * 2, arms: { l: { a: [0.1, 0.1] }, r: { a: [0.1, 0.1] } }, props: [{ k: 'db', h: 'l', o: 'h', big: 1 }, { k: 'db', h: 'r', o: 'h', big: 1 }], face: 'strain' }; },
  jack: (t, ph, D) => { const u = lerp(D.armOut, 2.85, t); const a = { a: [u, u + .1] }; return { stanceAdd: t * 24, footY: -Math.sin(t * Math.PI) * 10, arms: { l: a, r: a }, face: 'focus' }; },
  rope: (t, ph, D) => { const a = { t: [D.shH + 14, 62 + Math.sin(ph * TAU) * 4], b: 'out' }; return { footY: -Math.abs(Math.sin(ph * Math.PI)) * 14, arms: { l: a, r: a }, props: [{ k: 'jumprope', ph }], face: 'focus' }; },
  run: (t, ph, D) => { const w = Math.sin(ph * TAU); return { legs: { l: { lift: Math.max(0, w) * 1.2, d: Math.max(0, w) * .3 }, r: { lift: Math.max(0, -w) * 1.2, d: Math.max(0, -w) * .3 } }, footY: -Math.abs(w) * 3, arms: { l: { a: [0.18, 1.7 + w * .6], fx: .5 }, r: { a: [0.18, 1.7 - w * .6], fx: .5 } }, face: 'focus' }; },
  // Wettkampf
  armwrestle: (t, ph, D, x) => { const s = x.side || 1, k = s > 0 ? 'r' : 'l', o = s > 0 ? 'l' : 'r'; const A = {}; A[k] = { w: [x.reach || 70, -168 - (x.bal || 0) * 26], b: 'down', zf: .2 }; A[o] = { t: [D.shH * 0.4, 52], b: 'down' }; return { legs: { l: { d: .3 }, r: { d: .3 } }, lean: .25, arms: A, face: x.face || 'strain' }; },
  tire: (t, ph, D) => { const a = { t: [D.shH - 4, lerp(D.U + D.F - 10, -10, t)], b: 'down', zf: .4 }; return { legs: { l: { d: (1 - t) * .8, k: .35 }, r: { d: (1 - t) * .8, k: .35 } }, lean: (1 - t) * .4, arms: { l: a, r: a }, face: 'strain' }; },
  truck: (t, ph, D) => { const w = Math.sin(ph * TAU); const a = { t: [D.shH * 0.5, 4], b: 'down' }; return { lean: .45, legs: { l: { lift: Math.max(0, w) * .7, d: .35 }, r: { lift: Math.max(0, -w) * .7, d: .35 } }, arms: { l: a, r: a }, props: [{ k: 'harness' }], face: 'strain' }; },
  pressHold: (t, ph, D, x) => { const h = x.h || 0; const a = { t: [D.shH + 14, lerp(-4, -D.U - D.F + 12, h)], b: 'out' }; return { arms: { l: a, r: a }, props: [{ k: 'bar', w: 1.7 }], face: 'strain' }; },
  liftHold: (t, ph, D, x) => { const u = 1 - (x.h || 0); const a = { a: [0.04, 0.04] }; return { lean: u * .6, legs: { l: { d: u * .62, k: u * .25 }, r: { d: u * .62, k: u * .25 } }, arms: { l: a, r: a }, props: [{ k: 'bar', w: 1.8 }], face: 'strain' }; },
  flex: (t, ph, D) => { const a = { a: [1.45, 3.0], fx: .55, flex: 1 }; return { arms: { l: a, r: a }, face: 'proud' }; },
  cheer: (t, ph, D) => { const a = { a: [2.6 + Math.sin(ph * TAU) * .15, 2.9] }; return { arms: { l: a, r: a }, footY: -Math.abs(Math.sin(ph * TAU)) * 8, face: 'proud' }; },
  sad: (t, ph, D) => ({ head: { y: 6 }, arms: { l: { a: [0.05, 0.05] }, r: { a: [0.05, 0.05] } }, face: 'sad', look: { x: 0, y: 1 }, slumpAdd: 1 }),
  // Idle
  i_look: (p, ph, D) => { const x = Math.sin(p * TAU) ; return { head: { x: x * 2 }, look: { x: x > .3 ? 1 : x < -.3 ? -1 : 0, y: 0 } }; },
  i_drink: (p, ph, D) => { const k = Math.sin(Math.min(1, p * 1.2) * Math.PI); return { arms: { r: { t: [lerp(D.shH + 6, 7, k), lerp(54, -22, k)], b: 'down', zf: .62 * k } }, head: { y: -2 * k }, props: [{ k: 'bottle', h: 'r', tilt: k }], face: k > .6 ? 'drink' : 'neutral', look: { x: 0, y: -k } }; },
  i_towel: (p, ph, D) => { const k = Math.sin(Math.min(1, p * 1.1) * Math.PI); const wob = Math.sin(p * 30) * 7 * k; return { arms: { r: { t: [lerp(D.shH + 6, wob, k), lerp(54, -44, k)], b: 'out' } }, props: [{ k: 'towel', h: 'r' }], face: k > .5 ? 'blink' : 'neutral' }; },
  i_stretch: (p, ph, D) => { const k = Math.sin(p * Math.PI); const a = { a: [lerp(D.armOut, 2.95, k), lerp(0.1, 3.05, k)] }; return { arms: { l: a, r: a }, toe: k * .4, face: k > .5 ? 'yawn' : 'neutral' }; },
  i_phone: (p, ph, D) => { const k = Math.min(1, Math.sin(p * Math.PI) * 2); return { arms: { r: { t: [lerp(D.shH + 6, 10, k), lerp(54, 26, k)], b: 'down', zf: .3 * k }, l: { t: [lerp(D.shH + 6, 4, k), lerp(54, 30, k)], b: 'down', zf: .2 * k } }, head: { y: 4 * k }, look: { x: 0, y: k }, props: k > .2 ? [{ k: 'phone', h: 'r' }] : [], face: 'neutral' }; },
  i_flexpeek: (p, ph, D) => { const k = Math.sin(p * Math.PI); return { arms: { r: { a: [lerp(D.armOut, 1.45, k), lerp(0.1, 3, k)], fx: .55, flex: k } }, head: { x: 3 * k }, look: { x: 1, y: -k * .3 }, face: k > .5 ? 'proud' : 'neutral' }; },
  i_shake: (p, ph, D) => { const w = Math.sin(p * 60) * .12 * Math.sin(p * Math.PI); const a = { a: [D.armOut + w, D.armOut + w * 2] }; return { arms: { l: a, r: a }, footY: -Math.abs(Math.sin(p * 30)) * 2, face: 'neutral' }; },
  i_neck: (p, ph, D) => ({ head: { x: Math.cos(p * TAU) * 3, y: Math.sin(p * TAU) * 2 + 1 }, face: 'blink' }),
  i_scratch: (p, ph, D) => { const k = Math.sin(Math.min(1, p * 1.2) * Math.PI); return { arms: { l: { t: [lerp(D.shH + 6, 8, k), lerp(54, -48 + Math.sin(p * 40) * 3, k)], b: 'out' } }, look: { x: -1, y: -.5 }, face: 'neutral' }; },
  i_selfie: (p, ph, D) => { const k = Math.min(1, Math.sin(p * Math.PI) * 1.8); return { arms: { r: { t: [lerp(D.shH + 6, 20, k), lerp(54, -36, k)], b: 'out', zf: .25 * k }, l: { a: [lerp(D.armOut, 1.45, k), lerp(0.1, 3, k)], fx: .55, flex: k } }, look: { x: .4, y: -.4 * k }, head: { x: 1.5 * k }, props: k > .3 ? [{ k: 'phone', h: 'r' }] : [], face: k > .5 ? 'proud' : 'neutral' }; },
  walk: (t, ph, D) => { const w = Math.sin(ph * TAU); return { legs: { l: { lift: Math.max(0, w) * .55, d: Math.max(0, w) * .12 }, r: { lift: Math.max(0, -w) * .55, d: Math.max(0, -w) * .12 } }, footY: -Math.abs(w) * 1.5, arms: { l: { a: [D.armOut + w * .22, D.armOut + w * .22 + .18] }, r: { a: [D.armOut - w * .22, D.armOut - w * .22 + .18] } }, face: 'neutral' }; },
  i_yawn: (p, ph, D) => { const k = Math.sin(p * Math.PI); return { arms: { l: { a: [D.armOut + k * .4, D.armOut + k * 1.2] }, r: { t: [lerp(D.shH + 6, 7, k), lerp(54, -16, k)], b: 'down', zf: .55 * k } }, head: { y: -2 * k }, face: k > .3 ? 'yawn' : 'tired' }; }
};
Fig.IDLE = ['i_look', 'i_drink', 'i_towel', 'i_stretch', 'i_phone', 'i_flexpeek', 'i_shake', 'i_neck', 'i_scratch'];

/* ---------- Geometrie aller Körperteile ---------- */
function headGeo(D, J) { const hx = J.head.x, hy = J.head.y; return { hx, hy, cx: hx, cy: hy - 3, a: D.headRx, b: D.headRy - 1.5, rx: D.headRx, ry: D.headRy, jw: D.headRx * .78 + 3.5 * D.gT + 1.5 * D.gN + D.fat * 4.2, chin: 5 + 3.5 * D.gT + D.fat * 3 }; }
function torsoPts(D, J) {
  const x = J.shX, y = J.shY, hx = J.hipX, hy = J.hipY, nk = D.neckR, tr = D.trap, b = D.belly;
  const side = s => [[x + s * (nk + 1), y - tr - 4], [x + s * (nk + 6 + tr * .45), y - tr * .55 - 1], [x + s * (D.shH - 2), y + 1], [x + s * (D.shH + .5), y + 9], [x + s * Math.max(D.chestH + 1, D.shH - 2 + 2.5 * D.gB), y + 21], [x + s * Math.max(D.latH, D.shH - 3.5 + 3 * D.gR), y + 35],
    [lerp(hx, x, .35) + s * (D.waistH + 1 + b * .7), lerp(hy, y, .35)], [hx + s * (D.waistH + b * .3 + D.handle), hy - 12], [hx + s * (D.hipH + D.tR0 * .55), hy + 2], [hx + s * D.hipH * .3, hy + 14]];
  return side(-1).concat(side(1).reverse());
}
function buildGeo(D, J, L, back) {
  const G = { body: [], arms: [], leg: {}, arm: {}, H: headGeo(D, J) };
  [['l', -1], ['r', 1]].forEach(([k, s]) => {
    const h = P(J.hip[k].x, J.hip[k].y + 2), kn = J.knee[k], f = J.foot[k], an = P(f.x, f.y - 7);
    const os = sideOut(h, kn, s), os2 = sideOut(kn, an, s);
    const thigh = limb(h, kn, D.tR0, D.tR1, [{ t: .42, a: D.quad, w: .3, side: os }, { t: .22, a: D.add, w: .28, side: -os }, { t: .78, a: D.vmo, w: .17, side: -os }, { t: .97, a: 1 + 1.5 * D.gL, w: .12, side: 0 }]);
    const calf = limb(kn, an, D.cR0, D.cR1, [{ t: .3, a: D.calf, w: .25, side: -os2 }, { t: .26, a: D.calf * .7, w: .24, side: os2 }, { t: .02, a: .8 + 1.2 * D.gL, w: .1, side: 0 }]);
    G.leg[k] = { h, kn, f, an, thigh, calf, os, os2, s };
    G.body.push(thigh.path, calf.path, circP(kn.x, kn.y, D.tR1 * .98), circP(an.x, an.y, D.cR1 + .3));
    if (!L.shoes) G.body.push(ellP(f.x + s * 3, f.y - 3.5, 9.5, 4.2));
  });
  G.tor = torsoPts(D, J); G.torso = smoothClosed(G.tor); G.body.push(G.torso);
  G.stretch = (L.top && (L.top.cut === 'tee' || L.top.cut === 'long')) ? Fig.stretchOf(D, L.top) : 0;
  G.torsoEdge = new Path2D(); [G.tor.slice(1, 9), G.tor.slice(11, 19)].forEach(side => { side.forEach((q, i) => i ? G.torsoEdge.lineTo(q[0], q[1]) : G.torsoEdge.moveTo(q[0], q[1])); });
  G.neck = limb(P(J.shX, J.shY + 2), P(J.head.x, J.head.y + 9), D.neckR + 1, D.neckR * .92, []); G.body.push(G.neck.path);
  const H = G.H;
  G.cran = ellP(H.cx, H.cy, H.a, H.b);
  G.jaw = smoothClosed([[H.hx - H.a + .5, H.hy - 5], [H.hx - H.jw, H.hy + H.ry * .5], [H.hx - H.chin, H.hy + H.ry * .97], [H.hx + H.chin, H.hy + H.ry * .97], [H.hx + H.jw, H.hy + H.ry * .5], [H.hx + H.a - .5, H.hy - 5], [H.hx, H.hy - 9]]);
  G.ears = [ellP(H.hx - H.a + .2, H.hy + 1.5, 3.4, 5.6), ellP(H.hx + H.a - .2, H.hy + 1.5, 3.4, 5.6)];
  G.body.push(G.cran, G.jaw, ...G.ears);
  // Lauch: zu weites Shirt gehört zur Silhouette
  G.baggy = D.la > .12 && L.top && (L.top.cut === 'tee' || L.top.cut === 'long');
  if (G.baggy) { const x = J.shX, y = J.shY, hx = J.hipX, hy = J.hipY, w = D.la;
    G.bag = smoothClosed([[x - D.chestH - 1, y + 16], [x - D.chestH - 3 - 4 * w, y + 46], [hx - D.waistH - 4 - 6 * w, hy + 9 * w], [hx + D.waistH + 4 + 6 * w, hy + 9 * w], [x + D.chestH + 3 + 4 * w, y + 46], [x + D.chestH + 1, y + 16], [x, y + 10]]);
    G.body.push(G.bag); }
  // Shorts (locker, gehört zur Silhouette)
  { const hy = J.hipY, hx = J.hipX, ww = Math.max(D.waistH + 1.5 + D.belly * .3, D.hipH + D.tR0 * .5), pts = [[hx - ww, hy - 15], [hx + ww, hy - 15]];
    const hem = (k, t) => { const g = G.leg[k], c = g.thigh.axis(t), wo = g.thigh.wAt(t, g.os) + 1.4, wi = g.thigh.wAt(t, -g.os) + 1.2;
      return { o: [c.x + g.thigh.nx * wo * g.os, c.y + g.thigh.ny * wo * g.os], i: [c.x - g.thigh.nx * wi * g.os, c.y - g.thigh.ny * wi * g.os] }; };
    const r = hem('r', .47), l = hem('l', .47);
    // Shorts aus einem Guss: Bund → Außenseite rechts → Saum → Innenseite → Schritt → links zurück (folgt jedem Oberschenkel)
    const sw = Math.max(ww, D.hipH + D.tR0 * .98 + 2), q = [[hx - ww, hy - 15], [hx + ww, hy - 15], [hx + sw + .5, hy - 4]];
    const side = (k, t, outer) => { const g = G.leg[k], p = g.thigh.at(t, outer ? g.os : -g.os, outer ? -1.7 : -1.3); return [p.x, p.y]; };
    for (let i = 0; i <= 6; i++) q.push(side('r', .04 + i / 6 * .43, true));
    q.push(side('r', .47, false));
    { const a1 = side('r', .47, false), a2 = side('l', .47, false); q.push([(a1[0] + a2[0]) / 2, Math.max(hy + 12, Math.max(a1[1], a2[1]) + 1)]); }
    q.push(side('l', .47, false));
    for (let i = 0; i <= 6; i++) q.push(side('l', .47 - i / 6 * .43, true));
    q.push([hx - sw - .5, hy - 4]);
    G.shortsParts = [smoothClosed(q)]; G.shorts = G.shortsParts[0];
    G.shortsHem = { l, r };
    if (L.bottom && L.bottom.long) { // Anzughose: lange Hosenbeine bis zum Knöchel, je Bein ein Rohr
      const hemL = {}; ['l', 'r'].forEach(k => { const g = G.leg[k], o = g.os, o2 = g.os2, pts = [];
        for (let i = 0; i <= 6; i++) { const p = g.thigh.at(.3 + i / 6 * .7, o, -2.2); pts.push([p.x, p.y]); }
        for (let i = 1; i <= 6; i++) { const p = g.calf.at(i / 6 * .9, o2, -2.4); pts.push([p.x, p.y]); }
        for (let i = 6; i >= 1; i--) { const p = g.calf.at(i / 6 * .9, -o2, -2.2); pts.push([p.x, p.y]); }
        for (let i = 6; i >= 0; i--) { const p = g.thigh.at(.3 + i / 6 * .7, -o, -2); pts.push([p.x, p.y]); }
        G.shortsParts.push(smoothClosed(pts)); const a = g.calf.at(.9, o2, -2.4), b = g.calf.at(.9, -o2, -2.2); hemL[k] = { o: [a.x, a.y], i: [b.x, b.y] }; });
      G.shortsHem = hemL; }
    G.body.push(...G.shortsParts); }
  // Arme
  [['l', -1], ['r', 1]].forEach(([k, s]) => {
    const S = J.sh[k], E = J.el[k], Hd = J.ha[k], hs = J.hs[k] || 1, fl = (J.flex && J.flex[k]) || 0;
    const ux = E.x - S.x, uy = E.y - S.y, ul = Math.hypot(ux, uy) || 1, fx = Hd.x - E.x, fy = Hd.y - E.y, fln = Math.hypot(fx, fy) || 1;
    const bend = clamp(Math.acos(clamp((ux * fx + uy * fy) / (ul * fln), -1, 1)) / 2.4, 0, 1);
    const nx = -uy / ul, ny = ux / ul;
    let bs = (fx * nx + fy * ny) >= 0 ? 1 : -1; if (bend < .14) bs = (J.shX - S.x) * nx + 0 * ny >= 0 ? 1 : -1;
    const biA = D.bi * (.62 + .55 * bend + .3 * fl), triA = D.tri * (1 - .2 * bend);
    const sOff = Math.min(ul * .16, (D.delt * .55 + 2 + 2.5 * (1 - D.gS)) * .8), S2 = P(S.x + ux / ul * sOff, S.y + uy / ul * sOff); // Arm-Ansatz liegt unter der Schulterkappe → keine Ecken an Schulter/Achsel
    const upper = limb(S2, E, D.uR0, Math.max(D.uR1, D.fR0 * .86), [{ t: .14, a: D.delt * .5, w: .2, side: 0 }, { t: .5 + .04 * bend, a: biA * 1.15, wa: .42, wb: .42, w: .42, r: .5, side: bs }, { t: .42, a: triA * 1.08, wa: .4, wb: .5, w: .45, r: .6, side: -bs }, { t: .97, a: D.brach * .35, w: .1, side: 0 }], false);
    const n2x = -fy / fln, n2y = fx / fln; let si = ((S.x - E.x) * n2x + (S.y - E.y) * n2y) >= 0 ? 1 : -1; if (bend < .14) si = (J.shX - E.x) * n2x >= 0 ? 1 : -1;
    const fore = limb(E, Hd, D.fR0, D.fR1 * Math.min(1.3, hs), [{ t: .2, a: D.brach * (1.05 - .35 * fl), wa: .3, wb: .62, w: .5, r: .7, side: -si }, { t: .26, a: D.brach * (.8 - .3 * fl), wa: .3, wb: .55, w: .45, r: .75, side: si }]);
    const upperAt = (t, side) => { const w = upper.wAt(t, side) - .7, ax = upper.axis(t); return { x: ax.x + upper.nx * w * side, y: ax.y + upper.ny * w * side }; };
    const da = Math.atan2(uy, ux), dOff = D.delt * .55 + 2 + 2.5 * (1 - D.gS), dc = P(S.x + ux / ul * dOff, S.y + uy / ul * dOff - 1);
    const dRy = Math.max(D.uR0 + .4, D.uR0 * .6 + D.delt * .62 + 1.2), dRx = D.delt * 1.25 + 3.5;
    // Schulterkappe als Tropfen, der tangential in den Oberarm übergeht (statt Ellipse mit Kerbe am Ansatz)
    const eX = ux / ul, eY = uy / ul, nX = -eY, nY = eX, tEnd = clamp((dOff + dRx * 1.05) / ul, .3, .66);
    const delt = new Path2D(); { const q1 = upperAt(tEnd, 1), q2 = upperAt(tEnd, -1), c1 = { x: dc.x + nX * dRy, y: dc.y + nY * dRy }, c2 = { x: dc.x - nX * dRy, y: dc.y - nY * dRy };
      const L1 = Math.max(2, ((q1.x - c1.x) * eX + (q1.y - c1.y) * eY) * .5), L2 = Math.max(2, ((q2.x - c2.x) * eX + (q2.y - c2.y) * eY) * .5);
      delt.moveTo(q1.x, q1.y); delt.bezierCurveTo(q1.x - eX * L1, q1.y - eY * L1, c1.x + eX * L1, c1.y + eY * L1, c1.x, c1.y);
      delt.ellipse(dc.x, dc.y, dRx, dRy, da, Math.PI / 2, Math.PI * 1.5, false);
      delt.bezierCurveTo(c2.x + eX * L2, c2.y + eY * L2, q2.x - eX * L2, q2.y - eY * L2, q2.x, q2.y); delt.closePath(); }
    const hd = P(Hd.x + fx / fln * D.handR * .4 * hs, Hd.y + fy / fln * D.handR * .4 * hs), ha = Math.atan2(fy, fx);
    const tSide = (J.shX - Hd.x) * n2x >= 0 ? 1 : -1;
    const hand = ellP(hd.x, hd.y, D.handR * 1.05 * hs, D.handR * .9 * hs, ha), thumb = circP(hd.x + n2x * D.handR * .8 * tSide * hs - fx / fln * 1.5, hd.y + n2y * D.handR * .8 * tSide * hs - fy / fln * 1.5, D.handR * .42 * hs);
    G.arm[k] = { S, E, Hd, hd, upper, fore, bs, si, bend, delt: { c: dc, a: da, r: D.delt, rx: dRx, ry: dRy, path: delt }, ha, tSide, n2x, n2y, s, hs };
    G.arms.push(upper.path, fore.path, circP(E.x, E.y, D.fR0 * .95), delt, hand, thumb);
    if (!J.armsUp || !J.armsUp[k]) G.body.push(delt);
    if (G.baggy) { const m = mid(S, E, L.top.cut === 'long' ? 1 : .6); G.arms.push(limb(S, m, D.uR0 + 2.5 + 1.5 * D.la, D.uR1 + 3.5 + 2 * D.la, [], false).path); } // runde Schulterkuppe statt flacher Kante
  });
  return G;
}

/* Weiche Ebene: einmal leicht weichgezeichnet (formt runde Übergänge), darüber eine schwache scharfe Kopie für etwas Zeichnung */
const SOFT_K = 2.6; // Schattierung in reduzierter Auflösung malen und hochziehen = weiche Übergänge, kostet weniger als scharf
function softPaste(dst, src) {
  dst.save(); dst.setTransform(1, 0, 0, 1, 0, 0); dst.imageSmoothingEnabled = true; dst.imageSmoothingQuality = 'low';
  dst.drawImage(src, 0, 0, src.width * SOFT_K, src.height * SOFT_K); dst.restore();
}
/* ---------- Muskelzeichnung (Ebene A: Rumpf, Beine) ---------- */
function rim(c, path, col, w, a) { c.strokeStyle = rgba(col, a); c.lineWidth = w; c.stroke(path); }
function lightPass(c, J) {
  const g = c.createLinearGradient(J.shX - 110, 0, J.shX + 110, 0);
  g.addColorStop(0, 'rgba(255,255,255,.12)'); g.addColorStop(.45, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(40,15,5,.2)');
  c.fillStyle = g; c.fillRect(-220, -480, 440, 520);
}
function frontTorso(c, D, J, G, shd, hil) {
  const x = J.shX, y = J.shY, hx = J.hipX, hy = J.hipY;
  if (D.fem) { rim(c, G.torsoEdge, shd, 8, .14); [-1, 1].forEach(s => { glow(c, x + s * D.chestH * .42, y + 23, 8, '#ffffff', .12); curve(c, P(x + s * 2, y + 30), P(x + s * D.chestH * .45, y + 36), P(x + s * (D.chestH - 1), y + 27), 1.6, shd, .3); }); glow(c, x, hy - 22, D.waistH, '#ffffff', .06); c.fillStyle = rgba(shd, .5); c.beginPath(); c.ellipse(x, hy - 13, 1.3, 2, 0, 0, TAU); c.fill(); return; }
  rim(c, G.torsoEdge, shd, 9, .16);
  // Brust: zwei schwere Platten – Unterkante tief und fast waagerecht, harter Schatten darunter, Licht oben auf der Wölbung
  [-1, 1].forEach(s => {
    const lo = y + 33 + 13 * D.gB, a = .12 + .45 * D.gB, sx = x + s * 1.5, sy = y + 21 + 9 * D.gB, ex = x + s * (D.chestH + 1.5), ey = y + 19 + 7 * D.gB;
    const c1 = P(x + s * D.chestH * .28, lo + 2), c2 = P(x + s * D.chestH * .86, lo + 1);
    bez(c, P(sx, sy + 3), P(c1.x, c1.y + 4), P(c2.x, c2.y + 4), P(ex, ey + 4), 3 + 6 * D.gB, shd, .06 + .26 * D.gB); // Schlagschatten unter der Brust
    bez(c, P(sx, sy), c1, c2, P(ex, ey), 1.4 + 1.8 * D.gB, shd, a); // Unterkante
    glow(c, x + s * D.chestH * .44, y + 15 + 5 * D.gB, D.chestH * .62, '#ffffff', .07 + .2 * D.gB); // Licht oben
    glow(c, x + s * D.chestH * .55, lo - 5, D.chestH * .4, shd, .04 + .14 * D.gB); // untere Rundung
    glow(c, x + s * (D.chestH * .9), y + 22 + 5 * D.gB, D.chestH * .32, shd, .03 + .12 * D.gB); // Außenseite
    curve(c, P(x + s * 4, y + 3), P(x + s * D.shH * .5, y + 1 - D.gB * 2), P(x + s * (D.shH - 4), y + 2), 1.4, shd, .22 - .12 * D.gB); // Schlüsselbein
    curve(c, P(x + s * (D.neckR + 1), y - D.trap * .8 - 2), P(x + s * (D.neckR + 5 + D.trap * .3), y - D.trap * .2), P(x + s * (D.shH - 5), y + 1), 1.6, shd, .08 + .3 * D.gN); // Trapez
    curve(c, P(x + s * (D.chestH + .5), y + 24), P(x + s * (D.latH + 1), y + 40), P(x + s * (D.waistH + 1), hy - 16), 2 + 2 * D.gR, shd, .06 + .3 * D.gR); // Lat
    for (let i = 0; i < 4; i++) { const a2 = fd(D.gB + D.gR, .35 + i * .14, .55 + i * .14) * .4 * (.3 + .7 * D.def); curve(c, P(x + s * (D.chestH - 1), y + 30 + i * 5.5), P(x + s * (D.chestH - 5), y + 32 + i * 5.5), P(x + s * (D.chestH - 7.5), y + 36 + i * 5.5), 1.3, shd, a2); } // Sägemuskel Zacke für Zacke
    for (let i = 0; i < 4; i++) { const a2 = fd(D.gB + D.pmB * .3, .45 + i * .08, .7 + i * .08) * .16; curve(c, P(x + s * 3, y + 14 + i * 4), P(x + s * D.chestH * .45, y + 12 + i * 5), P(x + s * (D.chestH - 2), y + 15 + i * 2), .9, shd, a2 * .45); } // Brustfasern
    glow(c, x + s * (D.neckR + 6), y - D.trap * .45, D.trap * .8 + 3, '#ffffff', fd(D.gN, .25, .7) * .14); // Trapez-Kuppe
    if (D.gB < .18) for (let i = 0; i < 4; i++) { const yy = y + 34 + i * 6.5; curve(c, P(x + s * D.chestH * .85, yy), P(x + s * D.chestH * .45, yy + 3.5), P(x + s * 5, yy + 1.5), 1.2, shd, (.18 - D.gB) * 1.3); } // Rippen
  });
  line(c, x, y + 9, x, y + 30 + 12 * D.gB, 1.4 + 1.2 * D.gB, shd, .05 + .32 * D.gB);
  glow(c, x - D.chestH * .35, y + 26, D.chestH * 1.05, '#ffffff', .08); glow(c, x + D.latH * .85, y + 46, D.latH * .75, shd, .16); glow(c, x, hy - 6, D.waistH * 1.1, shd, .08); // Rumpf-Volumen: Licht links oben, Kernschatten rechts/unten
  // Skinny-fat: weiche Brust ohne Muskelkante, Speckfalte an der Hüfte
  const soft = clamp((D.fat - .3) * 2.2, 0, 1) * clamp(1 - D.gB * 2.2, 0, 1);
  if (soft > .02) [-1, 1].forEach(s => { curve(c, P(x + s * 4, y + 31), P(x + s * D.chestH * .55, y + 38 + soft * 3), P(x + s * (D.chestH - 1), y + 30), 1.6, shd, soft * .32); glow(c, x + s * D.chestH * .5, y + 27, D.chestH * .5, '#ffffff', soft * .1); });
  if (D.handle > .3) [-1, 1].forEach(s => curve(c, P(x + s * (D.waistH - 3), hy - 22), P(x + s * (D.waistH + D.handle * .6), hy - 14), P(x + s * (D.waistH - 2), hy - 7), 1.5, shd, Math.min(.35, D.handle * .06)));
  // Bauch – Muskeln zeichnen sich erst ab, wenn das Körperfett sinkt
  const ab = D.gC * (.25 + .75 * D.def) + D.def * D.def * .32 * (1 - Math.min(1, D.gC)); // wenig Körperfett: Bauchmuskeln zeichnen sich ab
  // Neue Zwischenstufen: Sägezahnmuskel an den Rippen, Leistenlinie (V) und Brust-Unterkante werden nach und nach sichtbar
  { const sv = fd(D.gB + D.gR, .7, 1.25) * (.25 + .75 * D.def); if (sv > .02) [-1, 1].forEach(s => { for (let i = 0; i < 3; i++) { const yy = y + 38 + i * 6.5 + D.gB * 2, xx = x + s * (D.chestH - 2 - i * .8); curve(c, P(xx, yy), P(xx - s * 3.5, yy + 1.6), P(xx - s * 6.5, yy + 4.2), 1.2, shd, sv * fd(sv, i * .12, .25 + i * .15) * .3); } }); }
  { const vl = fd(D.gC + D.def * .6, .55, 1.2) * D.def; if (vl > .02) [-1, 1].forEach(s => curve(c, P(x + s * (D.waistH - 2), hy - 14), P(x + s * (D.waistH * .55), hy - 2), P(x + s * 4, hy + 8), 1.4, shd, vl * .3)); }
  { const pk = fd(D.gB, .35, .9); if (pk > .02) [-1, 1].forEach(s => curve(c, P(x + s * 3, y + 30 + D.gB * 4), P(x + s * D.chestH * .55, y + 36 + D.gB * 5), P(x + s * (D.chestH - 1.5), y + 26 + D.gB * 3), 1.3, shd, pk * .22)); }
  if (ab > .02) {
    line(c, x, y + 44, x, hy - 9, 1.8, shd, ab * .5);
    const top = y + 42 + D.gB * 3, rows = 4, step = (hy - 12 - top) / rows;
    for (let r = 0; r < rows; r++) { const yy = top + (r + 1) * step - 2, ra = ab * fd(ab, .04 + r * .14, .2 + r * .16); if (ra <= 0) continue;
      [-1, 1].forEach(s => { curve(c, P(x + s * 2, yy), P(x + s * 7, yy - 2.2), P(x + s * (11 + 3 * ab), yy - .5), 1.4 + .6 * ab, shd, ra * .5); glow(c, x + s * 6, yy - step * .5, step * .55, '#ffffff', ra * .16); }); }
    [-1, 1].forEach(s => { for (let i = 0; i < 3; i++) { const a2 = fd(ab, .5 + i * .1, .8 + i * .1) * .3; curve(c, P(x + s * (D.latH - 6), y + 50 + i * 8), P(x + s * (D.latH - 9), y + 53 + i * 8), P(x + s * (D.waistH + 1), y + 57 + i * 8), 1.2, shd, a2); } });
    [-1, 1].forEach(s => curve(c, P(x + s * (D.latH - 3), y + 46), P(x + s * (D.waistH - 2), hy - 18), P(x + s * 6, hy + 4), 2.2, shd, ab * .3 + D.gR * .1));
  }
  if (D.belly > 1.5) { const bA = clamp((D.belly - 1.5) / 4, 0, 1); glow(c, x, hy - 20, D.waistH, '#ffffff', bA * .1); curve(c, P(x - D.waistH * .8, hy - 5), P(x, hy + 3 + D.belly * .3), P(x + D.waistH * .8, hy - 5), 2.4, shd, bA * .32); }
  c.fillStyle = rgba(shd, .55); c.beginPath(); c.ellipse(x, hy - 13, 1.4, 2.2, 0, 0, TAU); c.fill();
  // Hals
  [-1, 1].forEach(s => curve(c, P(J.head.x + s * (D.neckR * .8), J.head.y + D.headRy + 1), P(J.shX + s * (D.neckR * .55), J.shY - 5), P(J.shX + s * 2, J.shY + 3), 1.3, shd, .05 + .22 * D.gN));
  // Zwischenstufe: hoher Trapez – Lichtkante oben, Schattenkehle am Halsansatz
  [-1, 1].forEach(s => { glow(c, x + s * (D.neckR + 4), y - D.trap * .65, D.trap * .55 + 2, '#ffffff', fd(D.gN, .5, .9) * .14); curve(c, P(x + s * (D.neckR - .5), y - D.trap * .5), P(x + s * (D.neckR + 1.5), y - 2), P(x + s * (D.neckR + 4), y + 4), 1.2, shd, fd(D.gN, .55, .9) * .26); });
  // Zwischenstufe: schräge Bauchmuskeln wölben sich neben dem Sixpack, Lat wirft unter der Achsel Schatten
  [-1, 1].forEach(s => { glow(c, x + s * (D.waistH + 1), hy - 30, D.waistH * .45, '#ffffff', fd(D.gC, .35, .75) * .12);
    curve(c, P(x + s * (D.waistH + 2), hy - 44), P(x + s * (D.waistH + 4), hy - 30), P(x + s * (D.waistH - 1), hy - 16), 1.3, shd, fd(D.gC * D.def, .3, .65) * .28);
    glow(c, x + s * (D.latH - 4), y + 30, D.latH * .28, shd, fd(D.gR, .4, .8) * .2); });
  // Neue Zwischenstufen: obere Brustkante (Schlüsselbein-Anteil), Kopfnicker am Hals, Becken-V unter dem Bauch
  [-1, 1].forEach(s => {
    curve(c, P(x + s * 3, y + 9 + 2 * D.gB), P(x + s * D.chestH * .5, y + 6 + D.gB * 1.5), P(x + s * (D.chestH - 3), y + 10), 1.2, shd, fd(D.gB, .45, .8) * .22);
    glow(c, x + s * D.chestH * .42, y + 9, D.chestH * .3, '#ffffff', fd(D.gB, .5, .85) * .1);
    curve(c, P(J.head.x + s * 4, J.head.y + D.headRy - 2), P(J.shX + s * (D.neckR * .35), J.shY - 8), P(J.shX + s * 1.5, J.shY + 1), 1.1, shd, fd(D.gN, .35, .7) * .26);
    curve(c, P(x + s * (D.waistH - 3), hy - 18), P(x + s * (D.waistH * .55), hy - 6), P(x + s * 3, hy + 6), 1.3, shd, fd(D.gC * D.def, .3, .6) * .3);
    // Stufe 18: Brust-Delta-Furche (Brust und Schulter trennen sich), Brustbein-Rinne vertieft sich, Innenkante der Brust glänzt
    curve(c, P(x + s * (D.chestH - 4), y + 6), P(x + s * (D.chestH + 1), y + 13), P(x + s * (D.chestH + 2), y + 22), 1.2, shd, fd(D.gB + D.gS, .7, 1.4) * .3);
    glow(c, x + s * 4.5, y + 18 + 3 * D.gB, 4 + D.gB * 2, '#ffffff', fd(D.gB, .55, .9) * .12);
    // Stufe 18: Sägemuskel und Lat greifen ineinander – kleine Lichtpunkte zwischen den Zacken
    for (let i = 0; i < 3; i++) glow(c, x + s * (D.chestH - 4.5), y + 33 + i * 5.5, 2.4, '#ffffff', fd(D.gB + D.gR, .9 + i * .12, 1.3 + i * .12) * .14 * (.3 + .7 * D.def));
  });
  line(c, x, y + 13, x, y + 22 + 8 * D.gB, 1.2, shd, fd(D.gB, .6, .95) * .22);
}
function backTorso(c, D, J, G, shd) {
  const x = J.shX, y = J.shY, hy = J.hipY;
  rim(c, G.torsoEdge, shd, 9, .16);
  line(c, x, y + 2, x, hy + 6, 2.4, shd, .18 + .2 * D.gR);
  [-1, 1].forEach(s => {
    curve(c, P(x + s * 5, y + 12), P(x + s * D.chestH * .7, y + 30), P(x + s * 9, y + 50), 2.4, shd, .1 + .3 * D.gR);
    curve(c, P(x + s * (D.chestH - 1), y + 26), P(x + s * D.latH * .75, y + 56), P(x + s * 5, hy - 12), 2.5 + 2 * D.gR, shd, .06 + .35 * D.gR);
    glow(c, x + s * D.latH * .55, y + 40, D.latH * .5, '#ffffff', .04 + .12 * D.gR);
    curve(c, P(x + s * (D.neckR + 1), y - D.trap * .8), P(x + s * 16, y + 6), P(x + s * 6, y + 30), 2.4, shd, .08 + .3 * D.gN);
    curve(c, P(x + s * (D.chestH - 2), y + 16), P(x + s * (D.chestH - 8), y + 22), P(x + s * (D.chestH * .45), y + 26), 1.2, shd, fd(D.gR, .35, .65) * .3); // Teres
    line(c, x + s * 5, y + 54, x + s * 4, hy - 4, 3, shd, fd(D.gR, .3, .6) * .2); // Rückenstrecker
    for (let i = 0; i < 3; i++) curve(c, P(x + s * 3, hy - 22 + i * 6), P(x + s * 9, hy - 25 + i * 6), P(x + s * 15, hy - 30 + i * 6), 1.1, shd, fd(D.gR, .6 + i * .08, .9 + i * .08) * .25); // Tannenbaum
    // Neue Stufen von hinten: Rautenmuskel, Untergrätenmuskel („Rückenaugen“), hinterer Schulterkopf, Lat-Flügel unten
    curve(c, P(x + s * 3, y + 6), P(x + s * 12, y + 14), P(x + s * 6, y + 34), 1.3, shd, fd(D.gR, .2, .5) * .26);
    { const ex = x + s * D.chestH * .55, ey = y + 24; glow(c, ex, ey, 7 + D.gR * 4, '#ffffff', fd(D.gR, .3, .7) * .14); c.strokeStyle = rgba(shd, fd(D.gR, .4, .8) * .28); c.lineWidth = 1.1; c.beginPath(); c.ellipse(ex, ey, 6 + D.gR * 3.5, 4 + D.gR * 2, s * .5, 0, TAU); c.stroke(); }
    curve(c, P(x + s * (D.latH - 2), y + 42), P(x + s * (D.latH - 6), y + 54), P(x + s * (D.waistH + 2), hy - 20), 1.4, shd, fd(D.gR, .5, .9) * .3);
    glow(c, x + s * (D.shH - 3), y + 6, 7 + D.gS * 3, '#ffffff', fd(D.gS, .25, .6) * .14);
    if (D.handle > .3) curve(c, P(x + s * (D.waistH - 4), hy - 20), P(x + s * (D.waistH + D.handle * .5), hy - 13), P(x + s * (D.waistH - 3), hy - 6), 1.5, shd, Math.min(.3, D.handle * .05));
  });
  // Wirbelsäulen-Rinne wird mit dem Rücken tiefer
  glow(c, x, y + 46, 5 + D.gR * 4, shd, .05 + .14 * D.gR);
}
function legShade(c, D, G, shd, back) {
  ['l', 'r'].forEach(k => {
    const g = G.leg[k], th = g.thigh, ca = g.calf, o = g.os, o2 = g.os2; formShade(c, th, shd); formShade(c, ca, shd);
    rim(c, th.edge, shd, 7, .15); rim(c, ca.edge, shd, 6, .15);
    if (back) { // Rückseite: Beinbeuger teilen sich, Wade als Herz mit zwei Köpfen
      curve(c, th.axis(.15), th.axis(.5), th.axis(.85), 1.4, shd, .05 + .3 * D.gL); glow(c, th.at(.45, o, D.quad * .4 + 3).x, th.at(.45, o, D.quad * .4 + 3).y, D.tR0 * .6, '#ffffff', .05 + .1 * D.gL);
      const c1 = ca.axis(.28); glow(c, c1.x, c1.y, D.cR0 + D.calf * .6, '#ffffff', .06 + .14 * D.gL);
      curve(c, ca.axis(.1), ca.axis(.25), ca.axis(.42), 1.2, shd, .04 + .3 * D.gL); curve(c, ca.at(.45, o2, 1), ca.axis(.5), ca.at(.45, -o2, 1), 1.3, shd, .04 + .32 * D.gL);
      const kn = g.kn; curve(c, P(kn.x - 4, kn.y + 1), P(kn.x, kn.y + 3), P(kn.x + 4, kn.y + 1), 1, shd, .15); return; }
    curve(c, th.at(.12, o, 3), th.at(.45, o, 5 + D.quad * .4), th.at(.82, o, 3), 1.4 + D.gL, shd, .06 + .35 * D.gL);        // Außenschwung Quadrizeps
    curve(c, th.at(.58, -o, 4), th.at(.8, -o, D.vmo * .8 + 3), th.at(.95, 0 || -o, 2), 1.4 + D.gL, shd, .06 + .4 * D.gL);  // Tropfenmuskel
    curve(c, th.axis(.1), th.axis(.4), mid(th.axis(.7), th.at(.7, -o, 3)), 1.2, shd, .04 + .2 * D.gL);
    glow(c, th.at(.42, o, D.quad * .6 + 4).x, th.at(.42, o, D.quad * .6 + 4).y, D.tR0 * .7, '#ffffff', .06 + .12 * D.gL);
    curve(c, th.at(.2, o, 2 + D.quad * .3), th.at(.5, o, D.quad * .9 + 4), th.at(.88, o, 4), 1.2, shd, fd(D.gL, .3, .65) * .32); // Außenkopf
    curve(c, th.at(.06, o, 3), th.axis(.5), th.at(.9, -o, 2), 1.1, shd, fd(D.gL, .5, .85) * .22); // Schneidermuskel
    curve(c, ca.at(.12, o2, 2), ca.at(.3, o2, D.calf * .4 + 2), ca.at(.5, o2, 1), 1.1, shd, fd(D.gL, .25, .55) * .3); curve(c, ca.axis(.08), ca.axis(.25), ca.axis(.45), 1, shd, fd(D.gL, .45, .8) * .25); // Waden-Karo
    const kn = g.kn; glow(c, kn.x - 1, kn.y - 2, D.tR1 * .9, '#ffffff', .1); curve(c, P(kn.x - 3.5, kn.y - 5), P(kn.x, kn.y - 8), P(kn.x + 3.5, kn.y - 5), 1, shd, .1); // Kniescheibe
    curve(c, ca.at(.08, -o2, 2), ca.at(.32, -o2, D.calf * .5 + 2), ca.at(.58, -o2, 1), 1.2 + D.gL, shd, .06 + .35 * D.gL);   // Wade innen
    glow(c, ca.at(.28, -o2, D.calf * .5 + 2).x, ca.at(.28, -o2, D.calf * .5 + 2).y, D.cR0 + D.calf * .5, '#ffffff', .05 + .12 * D.gL);
    // Stufe 18: gerader Schenkelmuskel als Lichtstreifen, Adduktoren-Schatten innen, Schollenmuskel unter der Wade
    { const r1 = th.axis(.3), r2 = th.axis(.62); glow(c, lerp(r1.x, r2.x, .5), lerp(r1.y, r2.y, .5), D.tR0 * .35, '#ffffff', fd(D.gL, .55, .9) * .12); }
    curve(c, th.at(.08, -o, 2), th.at(.22, -o, D.quad * .3 + 3), th.at(.42, -o, 2), 1.2, shd, fd(D.gL, .4, .75) * .26);
    curve(c, ca.at(.5, o2, 1.5), ca.at(.62, o2, D.calf * .25 + 1.5), ca.at(.75, o2, 1), 1, shd, fd(D.gL, .6, .9) * .24);
  });
}
function socks(c, D, G) {
  if (D.la < .35) return;
  ['l', 'r'].forEach(k => { const g = G.leg[k], top = g.calf.axis(.5);
    c.fillStyle = '#f3f1ea'; c.fill(limb(top, g.an, D.cR0 + 3, D.cR1 + 3, []).path); c.fill(circP(g.an.x, g.an.y, D.cR1 + 3));
    line(c, top.x - 9, top.y + 3, top.x + 9, top.y + 3, 1.6, '#c8402e', .9); line(c, top.x - 9, top.y + 6.5, top.x + 9, top.y + 6.5, 1.6, '#2f5fb3', .9);
    line(c, top.x - 9, top.y, top.x + 9, top.y, 1, '#9c9a92', .7); });
}

/* ---------- Arme (Ebene B) ---------- */
function armShade(c, D, G, shd, back) {
  ['l', 'r'].forEach(k => {
    const a = G.arm[k], up = a.upper, fo = a.fore, bs = a.bs, si = a.si; formShade(c, up, shd); formShade(c, fo, shd);
    rim(c, up.edge, shd, 6, .16); rim(c, fo.edge, shd, 5, .16);
    // Schulterkappe: Licht + Trennlinie zum Oberarm
    const dc = a.delt.c; glow(c, dc.x - 2, dc.y - 3, a.delt.r * 1.1, '#ffffff', .08 + .2 * D.gS);
    c.strokeStyle = rgba(shd, .05 + .22 * D.gS); c.lineWidth = 2 + 2 * D.gS; c.beginPath(); c.ellipse(dc.x, dc.y, a.delt.rx * .96, a.delt.ry * .96, a.delt.a, -.9, .9); c.stroke();
    if (!back) {
      // Bizeps: Lichtkuppe auf dem Muskelbauch, Schatten am Ansatz Richtung Ellbogen
      const pk = up.at(.5 + .04 * a.bend, bs, D.bi * .7 + 2);
      glow(c, pk.x, pk.y, D.bi * 1.15 + 4, '#ffffff', .08 + .24 * D.gA);
      curve(c, up.at(.76, bs, 0), up.at(.9, bs, D.bi * .45 + 1), mid(up.axis(.99), up.at(.99, bs, 0), .35), 1.6 + 1.6 * D.gA, shd, .1 + .42 * D.gA); // Falte Bizeps/Unterarm
      glow(c, up.at(.8, bs, D.bi * .3).x, up.at(.8, bs, D.bi * .3).y, D.bi * .5 + 2, shd, .05 + .16 * D.gA);
    }
    { const e2 = up.at(.22, bs, D.delt * .2);
      curve(c, P(dc.x, dc.y - a.delt.ry * .6), P(dc.x + (e2.x - dc.x) * .3, dc.y), e2, 1.1, shd, fd(D.gS, .3, .65) * .32); // vorderer/seitlicher Schulterkopf
      curve(c, up.at(.34, bs, D.bi * .7), up.at(.5, bs, D.bi * .95), up.at(.68, bs, D.bi * .6), 1, shd, back ? 0 : fd(D.gA, .4, .75) * .2); // zwei Bizepsköpfe
      curve(c, up.at(.75, -bs, 1.5), up.at(.88, -bs, 3), up.at(.98, -bs, 1.5), 1.1, shd, fd(D.gA, .25, .55) * .3); } // Brachialis
    // Trizeps (Hufeisen) – von hinten deutlich, als U mit Sehnenplatte
    curve(c, up.at(.2, -bs, 2), up.at(.42, -bs, D.tri * .7 + 2), up.at(.72, -bs, 1.5), 1.2 + .8 * D.gA, shd, .06 + .3 * D.gA);
    if (back) { const tp = up.axis(.68); curve(c, up.at(.4, bs, 1), mid(tp, up.at(.7, bs, 0), .4), up.at(.4, -bs, 1), 1.4, shd, .06 + .34 * D.gA); glow(c, up.axis(.4).x, up.axis(.4).y, D.tri + 3, '#ffffff', .05 + .16 * D.gA); }
    // neue Zwischenstufen: Trizeps-Außenkopf trennt sich, Sehnenplatte am Ellbogen, Unterarm-Beuger/Strecker teilen sich
    curve(c, up.at(.3, -bs, D.tri * .35 + 1), up.at(.5, -bs, D.tri * .45 + 1.5), up.at(.62, -bs, 1), .9, shd, fd(D.gA, .32, .6) * .26);
    glow(c, up.at(.8, -bs, 1).x, up.at(.8, -bs, 1).y, D.tri * .45 + 2, '#ffffff', fd(D.gA, .45, .8) * .1);
    curve(c, fo.at(.1, si * .3, 1), fo.axis(.35), fo.at(.6, -si * .3, 1), .9, shd, fd(D.gA, .38, .7) * .22);
    glow(c, dc.x - (a.delt.rx * .3), dc.y + a.delt.ry * .25, a.delt.rx * .6, '#ffffff', fd(D.gS, .5, .85) * .1); // hinterer Schulterkopf glänzt separat
    // Stufe 18: Bizeps-Spitze bekommt einen eigenen Glanzpunkt, Oberarmspeichenmuskel trennt sich am Unterarm
    if (!back) { const pk2 = up.at(.5, bs, D.bi * .75 + 1.5); glow(c, pk2.x, pk2.y, D.bi * .35 + 2, '#ffffff', fd(D.gA, .6, .95) * .16); }
    curve(c, fo.at(.04, si, 1.5), fo.at(.2, si, D.brach * .4 + 1.5), fo.at(.42, si, 1), 1, shd, fd(D.gA, .5, .85) * .24);
    // Unterarm
    glow(c, fo.at(.24, -si, D.brach * .5 + 2).x, fo.at(.24, -si, D.brach * .5 + 2).y, D.fR0 + 2, '#ffffff', .06 + .15 * D.gA);
    curve(c, fo.at(.06, -si, 2), fo.at(.3, -si, D.brach * .6 + 2), fo.at(.62, -si, 1.5), 1.2, shd, .05 + .28 * D.gA);
    // Ellbogen + Hand
    glow(c, a.E.x, a.E.y, D.fR0, shd, .1);
    const hd = a.hd; glow(c, hd.x - 1.5, hd.y - 1.5, D.handR * a.hs, '#ffffff', .12);
    for (let i = -1; i <= 1; i++) { const ox = a.n2x * i * D.handR * .45 * a.hs, oy = a.n2y * i * D.handR * .45 * a.hs, dx = Math.cos(a.ha) * D.handR * .55 * a.hs, dy = Math.sin(a.ha) * D.handR * .55 * a.hs; line(c, hd.x + ox + dx * .3, hd.y + oy + dy * .3, hd.x + ox + dx, hd.y + oy + dy, 1, shd, .35); }
  });
}
/* Adern: scharf auf der Armebene, erhaben (Schatten + Lichtkante), ab hohem Level sichtbar, beim Pump dicker und deutlicher */
function veins(c, D, G, sk, back) {
  const pm = Math.min(1.2, D.pmA || 0), vA = D.gA * (.55 + .45 * D.def) + pm * .45; if (vA < .32) return;
  const col = mix(sk, '#34508f', .42), hi = mix(sk, '#ffffff', .4), s1 = Math.min(1, (vA - .32) * 1.5), w0 = .8 + .6 * s1 + pm * .7;
  const Q = (L, t, side, f) => mid(L.at(t, side, 0), L.axis(t), f);
  const path = pts => { c.beginPath(); c.moveTo(pts[0].x, pts[0].y); for (let i = 1; i < pts.length - 1; i++) { const m = mid(pts[i], pts[i + 1], .5); c.quadraticCurveTo(pts[i].x, pts[i].y, m.x, m.y); } const L = pts[pts.length - 1]; c.lineTo(L.x, L.y); };
  const draw = (pts, w, a) => { if (a <= .01) return; c.lineCap = 'round'; c.lineJoin = 'round';
    c.save(); c.translate(.6, .8); path(pts); c.strokeStyle = rgba('#000000', a * .22); c.lineWidth = w + .7; c.stroke(); c.restore();
    path(pts); c.strokeStyle = rgba(col, a); c.lineWidth = w; c.stroke();
    c.save(); c.translate(-.35, -.45); path(pts); c.strokeStyle = rgba(hi, a * .75); c.lineWidth = w * .4; c.stroke(); c.restore(); };
  ['l', 'r'].forEach(k => { const a = G.arm[k], fo = a.fore, up = a.upper, si = a.si, bs = a.bs;
    draw([Q(fo, .93, si, .55), Q(fo, .74, si, .32), Q(fo, .55, si, .5), Q(fo, .34, si, .3), Q(fo, .1, si, .45)], w0, .3 + .4 * s1);
    if (vA > .5) draw([Q(fo, .55, si, .5), Q(fo, .42, -si, .9), Q(fo, .22, -si, .55), Q(fo, .06, -si, .7)], w0 * .8, (.2 + .35 * s1) * Math.min(1, (vA - .5) * 3));
    if (!back && vA > .58) draw([Q(up, .95, bs, .62), Q(up, .72, bs, .42), Q(up, .5, bs, .58), Q(up, .3, bs, .4)], w0 * .9, (.2 + .35 * s1) * Math.min(1, (vA - .58) * 3));
    if (!back && vA > .85) draw([Q(up, .3, bs, .4), Q(up, .18, bs, .7), Q(up, .06, bs, .55)], w0 * .7, .25 * Math.min(1, (vA - .85) * 3)); });
}
/* Tattoos: mehrere gleichzeitig, jedes an seiner Stelle. layer 'arm' = Arme, 'body' = Rumpf/Beine */
const TINK = '#1e2a3a';
function tattoos(c, D, G, L, layer, back) {
  const T = L.tats || []; if (!T.length) return;
  const has = id => T.includes(id), ink = TINK;
  if (layer === 'arm') {
    const ar = G.arm.r, al = G.arm.l;
    if (has('sleeve')) { c.fillStyle = rgba(ink, .2); c.fill(ar.upper.path); c.fill(ar.fore.path); }
    if (has('tribal') || has('sleeve')) { const up = ar.upper; c.strokeStyle = rgba(ink, .7); c.lineWidth = 1.8; c.beginPath();
      for (let i = 0; i <= 8; i++) { const t = .3 + i * .045, p = up.at(t, i % 2 ? 1 : -1, up.wAt(t, i % 2 ? 1 : -1) * .35); i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y); } c.stroke(); }
    if ((has('anker') || has('sleeve')) && !back) { const p = ar.fore.axis(.45); c.strokeStyle = rgba(ink, .7); c.lineWidth = 1.4; c.beginPath(); c.moveTo(p.x, p.y - 6); c.lineTo(p.x, p.y + 5); c.moveTo(p.x - 3.5, p.y - 3); c.lineTo(p.x + 3.5, p.y - 3); c.stroke(); c.beginPath(); c.arc(p.x, p.y + 1, 4.5, .3, Math.PI - .3); c.stroke(); }
    if (has('mama')) { const p = al.upper.at(.5, al.bs, D.bi * .3); c.fillStyle = rgba('#c4302a', .75); c.beginPath(); c.moveTo(p.x, p.y + 4); c.bezierCurveTo(p.x - 7, p.y - 1, p.x - 3, p.y - 7, p.x, p.y - 3); c.bezierCurveTo(p.x + 3, p.y - 7, p.x + 7, p.y - 1, p.x, p.y + 4); c.fill();
      c.fillStyle = rgba('#f1efe9', .8); c.fillRect(p.x - 6, p.y - 1.5, 12, 3.2); c.fillStyle = rgba(ink, .9); c.font = '700 3px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('MAMA', p.x, p.y + .2); }
    if (has('hantel') && !back) { const p = al.fore.axis(.5), a = Math.atan2(al.fore.B.y - al.fore.A.y, al.fore.B.x - al.fore.A.x); c.save(); c.translate(p.x, p.y); c.rotate(a + Math.PI / 2); c.fillStyle = rgba(ink, .75); c.fillRect(-4, -.6, 8, 1.2); c.fillRect(-5, -2.2, 1.6, 4.4); c.fillRect(3.4, -2.2, 1.6, 4.4); c.restore(); }
    if (has('lorbeer')) { const d = al.delt.c; c.strokeStyle = rgba('#2f6a3a', .7); c.lineWidth = 1.1; for (let i = 0; i < 5; i++) { const an = Math.PI * .65 + i * .32, x = d.x + Math.cos(an) * 5, y = d.y + Math.sin(an) * 5; c.beginPath(); c.ellipse(x, y, 2.2, 1, an + 1.2, 0, TAU); c.stroke(); } }
    return;
  }
  const x = G.H.hx;
  if (has('brust') && !back) { c.fillStyle = 'rgba(30,42,58,.55)'; c.font = 'italic 700 7px Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; const J = G.J; c.fillText('No Pain', J.shX - D.chestH * .45, J.shY + 22); }
  if (has('ruecken') && back) { const J = G.J, y = J.shY + 14; c.strokeStyle = rgba(ink, .55); c.lineWidth = 1.2; [-1, 1].forEach(s => { for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(J.shX + s * 3, y + i * 4); c.quadraticCurveTo(J.shX + s * (12 + i * 3), y - 6 + i * 3, J.shX + s * (D.chestH - 2 - i * 2), y + 4 + i * 6); c.stroke(); } }); }
  if (has('krone') && back) { const J = G.J, y = J.shY - D.trap * .6 - 2; c.fillStyle = rgba(ink, .6); c.beginPath(); c.moveTo(J.shX - 5, y + 3); c.lineTo(J.shX - 5, y - 2); c.lineTo(J.shX - 2.5, y + .5); c.lineTo(J.shX, y - 3); c.lineTo(J.shX + 2.5, y + .5); c.lineTo(J.shX + 5, y - 2); c.lineTo(J.shX + 5, y + 3); c.closePath(); c.fill(); }
  if (has('flamme')) { const ca = G.leg.r.calf; c.fillStyle = rgba('#c4501a', .6); for (let i = 0; i < 3; i++) { const b = ca.at(.62, i - 1 ? 1 : -1, 3), t = ca.axis(.25 + i * .04); c.beginPath(); c.moveTo(b.x - 2.5 + i * 2.5, b.y); c.quadraticCurveTo(b.x - 4 + i * 2.5, (b.y + t.y) / 2, t.x - 1 + i * 2, t.y); c.quadraticCurveTo(b.x + 1 + i * 2.5, (b.y + t.y) / 2, b.x + 2.5 + i * 2.5, b.y); c.fill(); } }
}

/* ---------- Kleidung ---------- */
let camoPat = null;
function camo(c) { if (!camoPat) { const cc = document.createElement('canvas'); cc.width = cc.height = 40; const g = cc.getContext('2d'); g.fillStyle = '#6b7a45'; g.fillRect(0, 0, 40, 40);
  [['#4a5530', 8, 10, 9], ['#8f8a5a', 28, 24, 10], ['#3b3a2a', 30, 6, 6], ['#4a5530', 12, 32, 8]].forEach(([f, x, y, r]) => { g.fillStyle = f; g.beginPath(); g.ellipse(x, y, r, r * .7, .5, 0, 7); g.fill(); }); camoPat = cc; }
  return c.createPattern(camoPat, 'repeat'); }
function drawShorts(c, D, J, G, L) {
  const col = L.bottom.val, dk = mix(col, '#000000', .45), hy = J.hipY;
  c.fillStyle = L.bottom.pat === 'camo' ? camo(c) : col; G.shortsParts.forEach(q => c.fill(q));
  const g = c.createLinearGradient(J.hipX - 40, 0, J.hipX + 40, 0); g.addColorStop(0, 'rgba(255,255,255,.1)'); g.addColorStop(1, 'rgba(0,0,0,.2)'); c.fillStyle = g; G.shortsParts.forEach(q => c.fill(q));
  ['l', 'r'].forEach(k => { const h = G.shortsHem[k]; line(c, h.o[0], h.o[1], h.i[0], h.i[1], 1.6, dk, .9); });
  c.fillStyle = rgba(dk, .5); c.fillRect(J.hipX - D.waistH - 4, hy - 15, D.waistH * 2 + 8, 3.5);
  line(c, J.hipX, hy - 11, J.hipX, hy + 13, 1.2, dk, .5);
  ['l', 'r'].forEach(k => { const h = G.shortsHem[k]; line(c, h.o[0], h.o[1] - 2.5, h.i[0], h.i[1] - 2.5, 1.2, dk, .35); });
  if (L.bottom.long) ['l', 'r'].forEach(k => { const g = G.leg[k]; curve(c, g.thigh.axis(.5), g.thigh.axis(1), g.calf.axis(.88), 1, dk, .35); });
  if (D.la > .3) { curve(c, P(J.hipX - D.waistH, hy - 8), P(J.hipX - 6, hy - 2), P(J.hipX - 3, hy + 10), 1.2, dk, .3); curve(c, P(J.hipX + D.waistH, hy - 6), P(J.hipX + 7, hy), P(J.hipX + 4, hy + 12), 1.2, dk, .3); }
}
function topPts(D, J, G, cut) {
  const x = J.shX, y = J.shY, hx = J.hipX, hy = J.hipY, nk = D.neckR, tr = D.trap, t = G.tor, n = t.length, half = n / 2;
  const hemY = hy - 2 + (G.baggy ? 9 * D.la : 0) - (G.stretch || 0) * 6;
  // Saum so breit wie der Körper an dieser Höhe – sonst schaut seitlich Haut heraus
  const p7 = t[7], p8 = t[8], k = clamp((hemY - p7[1]) / (p8[1] - p7[1]), 0, 1), bodyW = lerp(Math.abs(p7[0] - hx), Math.abs(p8[0] - hx), k);
  const wwW = D.waistH + 1 + (G.baggy ? 6 * D.la : 0) + D.handle * .6, ww = Math.max(wwW, bodyW + 1.6);
  if (cut === 'tee' || cut === 'long') {
    // Schulternaht folgt dem Trapez bis an den Hals – sonst schaut der Nacken seitlich heraus
    // Breiter Halsausschnitt: der ganze Hals samt Trapez-Ansatz passt hindurch, das Shirt beginnt erst auf der Schulterschräge (leicht darüber, damit keine Haut übersteht)
    const L = t.slice(1, 8).map(q => q.slice()), R = t.slice(n - 8, n - 1).map(q => q.slice()); L[0][1] -= 2.6; R[R.length - 1][1] -= 2.6;
    const t0 = t[0], t1 = t[1], u0 = t[n - 1], u1 = t[n - 2], f = .62, cl = [lerp(t0[0], t1[0], f), lerp(t0[1], t1[1], f) - 2.2], cr = [lerp(u0[0], u1[0], f), lerp(u0[1], u1[1], f) - 2.2];
    const dip = y - tr * .3 + 5;
    return [cl].concat(L, [[hx - ww - 1, hemY], [hx + ww + 1, hemY]], R, [cr, [x + nk * .95, dip - 2], [x, dip + 1.5], [x - nk * .95, dip - 2]]);
  }
  if (cut === 'tank') return [[x - nk - 6, y - tr * .5 - 1], [x - nk - 2, y - tr * .5], [x - 4, y + 15], [x + 4, y + 15], [x + nk + 2, y - tr * .5], [x + nk + 6, y - tr * .5 - 1],
    [x + D.chestH * .8, y + 26], [x + D.latH - .5, y + 40], [hx + wwW, hy - 12], [hx + ww + .5, hemY], [hx - ww - .5, hemY], [hx - wwW, hy - 12], [x - D.latH + .5, y + 40], [x - D.chestH * .8, y + 26]];
  if (cut === 'bra') return [[x - nk - 5, y - tr * .5 - 1], [x - nk - 1, y - tr * .5], [x - 3, y + 16], [x + 3, y + 16], [x + nk + 1, y - tr * .5], [x + nk + 5, y - tr * .5 - 1], [x + D.chestH * .85, y + 24], [x + D.chestH + 1, y + 37], [x - D.chestH - 1, y + 37], [x - D.chestH * .85, y + 24]];
  if (cut === 'stringer') return [[x - nk - 3, y - tr * .5], [x - nk - 1, y - tr * .5 + 1], [x - 5, y + 30], [x + 5, y + 30], [x + nk + 1, y - tr * .5 + 1], [x + nk + 3, y - tr * .5],
    [x + D.chestH * .45, y + 40], [hx + wwW - 1, hy - 12], [hx + ww, hemY], [hx - ww, hemY], [hx - wwW + 1, hy - 12], [x - D.chestH * .45, y + 40]];
  return null;
}
function drawTop(c, D, J, G, L, back, o) {
  const T = L.top; if (!T || T.cut === 'none') return;
  const pts = topPts(D, J, G, T.cut); if (!pts) return;
  const path = T.cut === 'tank' || T.cut === 'stringer' || T.cut === 'bra' ? (() => { const p = new Path2D(); pts.forEach((q, i) => i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])); p.closePath(); return p; })() : smoothClosed(pts);
  const col = T.val, dk = mix(col, '#000000', .45), x = J.shX, y = J.shY, hy = J.hipY;
  const full = new Path2D(path); if (G.baggy && (T.cut === 'tee' || T.cut === 'long') && G.bag) full.addPath(G.bag);
  c.save(); c.fillStyle = col; c.fill(path); if (G.baggy && G.bag && (T.cut === 'tee' || T.cut === 'long')) c.fill(G.bag); c.clip(full, 'nonzero');
  if (T.pat === 'flame') { c.fillStyle = '#ffd23f'; for (let i = -4; i <= 4; i++) { c.beginPath(); c.moveTo(x + i * 12 - 7, hy + 4); c.quadraticCurveTo(x + i * 12 - 9, hy - 30, x + i * 12, hy - 46 - (i % 2) * 10); c.quadraticCurveTo(x + i * 12 + 3, hy - 22, x + i * 12 + 7, hy + 4); c.fill(); } }
  if (T.pat === 'tiger') { c.fillStyle = 'rgba(30,20,10,.75)'; for (let i = 0; i < 6; i++) { const yy = y + 18 + i * 13; c.beginPath(); c.moveTo(x - 60, yy); c.quadraticCurveTo(x - 20, yy + 5, x - 30, yy + 9); c.lineTo(x - 60, yy + 4); c.fill(); c.beginPath(); c.moveTo(x + 60, yy + 4); c.quadraticCurveTo(x + 20, yy + 9, x + 30, yy + 13); c.lineTo(x + 60, yy + 8); c.fill(); } }
  if (T.pat === 'bolt') { c.fillStyle = '#ffd23f'; c.beginPath(); c.moveTo(x + 4, y + 14); c.lineTo(x - 10, y + 44); c.lineTo(x, y + 44); c.lineTo(x - 6, y + 70); c.lineTo(x + 12, y + 36); c.lineTo(x + 2, y + 36); c.closePath(); c.fill(); }
  if (T.pat === 'retro') ['#2ec4d6', '#7b2cbf', '#ffd23f'].forEach((cc, i) => { c.fillStyle = cc; c.fillRect(x - 80, y + 40 + i * 7, 160, 4); });
  if (T.pat === 'camo') { c.fillStyle = camo(c); c.fillRect(x - 90, y - 20, 180, 150); }
  if (T.suit) suitFront(c, D, J, T, back);
  const g = c.createLinearGradient(x - D.latH - 6, 0, x + D.latH + 6, 0); g.addColorStop(0, 'rgba(255,255,255,.14)'); g.addColorStop(.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,.24)');
  c.fillStyle = g; c.fillRect(x - 110, y - 30, 220, hy - y + 60);
  const tight = T.tight ? 1 : G.baggy ? .15 : .45;
  if (!back) {
    [-1, 1].forEach(s => { const lo = y + 33 + 13 * D.gB; bez(c, P(x + s * 1.5, y + 21 + 9 * D.gB), P(x + s * D.chestH * .28, lo + 2), P(x + s * D.chestH * .86, lo + 1), P(x + s * (D.chestH + 1.5), y + 19 + 7 * D.gB), 2, '#000000', (.05 + .24 * D.gB) * tight); glow(c, x + s * D.chestH * .45, y + 16 + 4 * D.gB, D.chestH * .55, '#ffffff', (.05 + .12 * D.gB) * tight); });
    if (T.tight && D.gC > .1) { for (let r = 0; r < 3; r++) line(c, x - 12, y + 52 + r * 10, x + 12, y + 52 + r * 10, 1.6, '#000000', D.gC * .2); line(c, x, y + 44, x, hy - 8, 1.6, '#000000', D.gC * .2); }
    if (o.sponsor && T.cut !== 'stringer') { c.fillStyle = lum(col) > .55 ? 'rgba(17,17,17,.85)' : 'rgba(255,255,255,.9)'; c.font = '800 ' + (6.5 + D.gB * 2) + 'px "Arial Narrow", Arial, sans-serif'; c.textAlign = 'center'; c.fillText(o.sponsor, x, y + 46 + D.gB * 5); }
    if (D.la > .4) { c.fillStyle = rgba('#6e4218', .35 * D.la); c.beginPath(); c.ellipse(x + 8, y + 40, 4.5, 3.2, .4, 0, TAU); c.fill(); c.beginPath(); c.ellipse(x + 11, y + 44, 2.2, 1.8, 0, 0, TAU); c.fill(); }
  } else if (o.sponsor) { c.fillStyle = lum(col) > .55 ? 'rgba(17,17,17,.8)' : 'rgba(255,255,255,.85)'; c.font = '800 9px "Arial Narrow", Arial, sans-serif'; c.textAlign = 'center'; c.fillText(o.sponsor, x, y + 30); }
  // Falten
  const fa = G.baggy ? .16 : T.tight ? .04 : .1;
  curve(c, P(x - D.waistH - 2, hy - 2), P(x - 9, hy - 14), P(x - 3, hy - 28), 1.2, '#000000', fa); curve(c, P(x + D.waistH + 2, hy - 4), P(x + 10, hy - 16), P(x + 5, hy - 32), 1.2, '#000000', fa);
  if (G.baggy) for (let i = 0; i < 3; i++) curve(c, P(x - 14 + i * 13, hy + 6 * D.la), P(x - 11 + i * 13, hy - 10), P(x - 13 + i * 13, hy - 24), 1.2, '#000000', .1 * D.la);
  // Schweiß in Stufen: Achseln und Kragen → Brustbein → Bauch/Rücken → alles dunkel
  const sw0 = o.sweat || 0, swc = mix(col, '#000000', .5);
  if (sw0 > .2) { const a = Math.min(.38, (sw0 - .2) * 1.2); [-1, 1].forEach(s => glow(c, x + s * (D.chestH + 1), y + 24, 6 + sw0 * 7, swc, a)); c.strokeStyle = rgba(swc, a * .8); c.lineWidth = 3; c.beginPath(); c.ellipse(x, y - D.trap * .45 + 1, D.neckR + 4, 5, 0, back ? Math.PI : 0, back ? TAU : Math.PI); c.stroke(); }
  if (sw0 > .4) { const a = Math.min(.34, (sw0 - .4) * 1.1); if (!back) { c.fillStyle = rgba(swc, a); c.beginPath(); c.ellipse(x, y + 26 + sw0 * 6, 4 + sw0 * 4, 10 + sw0 * 12, 0, 0, TAU); c.fill(); [-1, 1].forEach(s => glow(c, x + s * D.chestH * .5, y + 34 + 6 * D.gB, 7 + sw0 * 4, swc, a * .7)); } else { c.fillStyle = rgba(swc, a); c.beginPath(); c.moveTo(x - 20, y + 6); c.quadraticCurveTo(x, y + 14, x + 20, y + 6); c.lineTo(x + 5, y + 30 + sw0 * 30); c.lineTo(x - 5, y + 30 + sw0 * 30); c.closePath(); c.fill(); } }
  if (sw0 > .6) { const a = Math.min(.28, (sw0 - .6) * 1.1); glow(c, x, back ? y + 62 : hy - 22, 12 + sw0 * 9, swc, a); }
  if (sw0 > .82) { c.fillStyle = rgba(swc, (sw0 - .82) * .7); c.fillRect(x - 110, y - 30, 220, hy - y + 60); }
  // Shirt spannt: Zugfalten von den Achseln zur Brustmitte, Saum rutscht hoch
  const st = G.stretch || 0;
  if (st > .1 && !back) [-1, 1].forEach(s => { for (let i = 0; i < 3; i++) curve(c, P(x + s * (D.chestH + 1), y + 17 + i * 3), P(x + s * D.chestH * .55, y + 18 + i * 6), P(x + s * 5, y + 14 + i * 9), 1, '#000000', Math.min(.22, .05 + st * .13) * (1 - i * .2)); });
  if (st > .1) for (let i = -1; i <= 1; i++) curve(c, P(x + i * 9 - 5, hy - 4 - st * 6), P(x + i * 9, hy - 7 - st * 6), P(x + i * 9 + 5, hy - 4 - st * 6), 1, '#000000', st * .14);
  c.restore();
  c.strokeStyle = rgba(dk, .85); c.lineWidth = 1.1; c.stroke(path); if (G.baggy && G.bag && (T.cut === 'tee' || T.cut === 'long')) { c.save(); c.clip(G.bag); c.restore(); }
  if (T.cut === 'tee' || T.cut === 'long') { c.fillStyle = rgba(dk, .35); c.beginPath(); c.ellipse(x, y - D.trap * .45 + 1, D.neckR + 3, 4, 0, 0, Math.PI); c.fill(); }
}
/* Anzug: Hemd-Ausschnitt, Revers, Krawatte bzw. Fliege, Knöpfe, Einstecktuch (Nadelstreifen optional) */
function suitFront(c, D, J, T, back) {
  const x = J.shX, y = J.shY, nk = D.neckR, tr = D.trap, hy = J.hipY, dk = mix(T.val, '#000000', .35), lt = mix(T.val, '#ffffff', .12);
  if (T.stripe) { c.strokeStyle = 'rgba(255,255,255,.13)'; c.lineWidth = .7; for (let i = -16; i <= 16; i++) { c.beginPath(); c.moveTo(x + i * 5, y - 30); c.lineTo(x + i * 5, hy + 20); c.stroke(); } }
  if (back) { line(c, x, y + 10, x, hy + 4, 1, dk, .5); return; }
  if (T.space) { line(c, x, y - tr * .4, x, hy + 2, 2.2, '#9aa3ad', .9); c.fillStyle = '#2f5fb3'; c.beginPath(); c.arc(x - D.chestH * .55, y + 22, 6, 0, TAU); c.fill(); c.fillStyle = '#ff5a36'; c.fillRect(x - D.chestH * .55 - 5, y + 21, 10, 2); c.fillStyle = '#c4302a'; c.fillRect(x + D.chestH * .4, y + 16, 9, 6); return; }
  const vy = y + 34 + D.gB * 4;
  c.fillStyle = '#f4f2ec'; c.beginPath(); c.moveTo(x - nk - 1, y - tr * .5); c.lineTo(x + nk + 1, y - tr * .5); c.lineTo(x, vy); c.closePath(); c.fill();
  if (T.bow) { c.fillStyle = T.tie; c.beginPath(); c.moveTo(x, y - tr * .3 + 3); c.lineTo(x - 7, y - tr * .3 - 1); c.lineTo(x - 7, y - tr * .3 + 7); c.closePath(); c.moveTo(x, y - tr * .3 + 3); c.lineTo(x + 7, y - tr * .3 - 1); c.lineTo(x + 7, y - tr * .3 + 7); c.closePath(); c.fill(); }
  else { c.fillStyle = T.tie; c.beginPath(); c.moveTo(x - 3, y - tr * .4); c.lineTo(x + 3, y - tr * .4); c.lineTo(x + 2, y - tr * .4 + 5); c.lineTo(x + 4.5, vy - 4); c.lineTo(x, vy + 2); c.lineTo(x - 4.5, vy - 4); c.lineTo(x - 2, y - tr * .4 + 5); c.closePath(); c.fill(); line(c, x - 2, y - tr * .4 + 5, x + 2, y - tr * .4 + 5, .8, '#000000', .3); }
  [-1, 1].forEach(sd => { c.fillStyle = lt; c.beginPath(); c.moveTo(x + sd * (nk + 1), y - tr * .5); c.lineTo(x + sd * (nk + 9), y + 4); c.lineTo(x + sd * (nk + 5), y + 9); c.lineTo(x + sd * (nk + 12), y + 14); c.lineTo(x + sd * 1.5, vy + 2); c.closePath(); c.fill(); c.strokeStyle = rgba(dk, .8); c.lineWidth = .9; c.stroke(); });
  line(c, x + 1, vy + 2, x + 3, hy + 4, 1, dk, .7); [vy + 14, vy + 28].forEach(by => { c.fillStyle = dk; c.beginPath(); c.arc(x + 2.2, by, 1.6, 0, TAU); c.fill(); });
  c.fillStyle = '#f4f2ec'; const px = x - D.chestH * .62, py = y + 24; c.beginPath(); c.moveTo(px - 5, py); c.lineTo(px + 5, py); c.lineTo(px + 2, py - 4); c.lineTo(px - 1, py - 2); c.lineTo(px - 3, py - 4); c.closePath(); c.fill(); line(c, px - 7, py, px + 7, py, .9, dk, .7);
}
function drawSleeves(c, D, G, L, sk, skInk) {
  const T = L.top; if (!T || (T.cut !== 'tee' && T.cut !== 'long')) return;
  const col = T.val, dk = mix(col, '#000000', .45);
  ['l', 'r'].forEach(k => {
    const st = G.stretch || 0, a = G.arm[k], up = a.upper, ts = T.cut === 'long' ? 1 : .58 - Math.min(1, st) * .13, extra = G.baggy ? 2.5 + 2 * D.la : T.tight ? .3 : 1.6 - Math.min(1, st) * 1.7;
    // Ärmel = Arm-Silhouette (Oberarm + Schulterkappe), am Saum weich gebogen abgeschnitten → keine Ecken an Schulter und Saum
    const dc = a.delt.c, dp = a.delt.path, ux0 = up.A.x - up.B.x, uy0 = up.A.y - up.B.y, ul0 = Math.hypot(ux0, uy0) || 1, ux = ux0 / ul0, uy = uy0 / ul0, nx = up.nx, ny = up.ny;
    const hemT = Math.min(.999, ts), hA = up.at(hemT, 1, -.2), hB = up.at(hemT, -1, -.2), hC = up.axis(Math.min(1.05, hemT + .07)), R1 = 260, R2 = 420, hc = up.axis(hemT);
    const clip = new Path2D(); clip.moveTo(hc.x + nx * R1, hc.y + ny * R1); clip.lineTo(hA.x + nx * 3, hA.y + ny * 3); clip.lineTo(hA.x, hA.y); clip.quadraticCurveTo(hC.x, hC.y, hB.x, hB.y); clip.lineTo(hB.x - nx * 3, hB.y - ny * 3);
    clip.lineTo(hc.x - nx * R1, hc.y - ny * R1); clip.lineTo(hc.x - nx * R1 + ux * R2, hc.y - ny * R1 + uy * R2); clip.lineTo(hc.x + nx * R1 + ux * R2, hc.y + ny * R1 + uy * R2); clip.closePath();
    const fillC = T.pat === 'camo' ? camo(c) : col, ex2 = Math.max(0, extra);
    c.save(); c.clip(clip); c.lineJoin = 'round';
    if (G.baggy || D.la > .25) { // schmale Arme: Ärmel als weiche, runde Form mit Schulterkuppe statt dicker Kontur (keine Ecken)
      const pts = [], c0 = G.baggy ? a.S : up.axis(0), r0 = Math.max(up.wAt(0, 1) + ex2 + 1, G.baggy ? D.uR0 + 3.4 + 1.5 * D.la : 0);
      for (let i = 10; i >= 0; i--) { const q = up.at(hemT * i / 10, 1, -ex2); pts.push([q.x, q.y]); }
      for (let i = 1; i < 12; i++) { const th = i / 12 * Math.PI, dx = nx * Math.cos(th) + ux * Math.sin(th) * 1.05, dy = ny * Math.cos(th) + uy * Math.sin(th) * 1.05; pts.push([c0.x + dx * r0, c0.y + dy * r0]); }
      for (let i = 0; i <= 10; i++) { const q = up.at(hemT * i / 10, -1, -ex2); pts.push([q.x, q.y]); }
      pts.push([hC.x, hC.y]); const sp = smoothClosed(pts);
      c.strokeStyle = rgba(dk, .7); c.lineWidth = 2.2; c.stroke(sp); c.fillStyle = fillC; c.fill(sp); c.fill(dp); }
    else { if (ex2 > .2) { c.strokeStyle = rgba(dk, .75); c.lineWidth = ex2 * 2 + 2.2; c.stroke(up.path); c.stroke(dp); c.strokeStyle = fillC; c.lineWidth = ex2 * 2; c.stroke(up.path); c.stroke(dp); }
      c.fillStyle = fillC; c.fill(up.path); c.fill(dp); }
    c.restore();
    const sl = null;
    if (T.cut === 'long' && T.suit && !T.space) { const fe = .86 - Math.min(1, st) * .22, q1 = a.fore.at(fe + .03, 1, -.5), q2 = a.fore.at(fe + .03, -1, -.5); line(c, q1.x, q1.y, q2.x, q2.y, 3, '#f4f2ec', 1); }
    if (T.cut === 'long') { const fe = .86 - Math.min(1, st) * .22, fp = []; for (let i = 0; i <= 8; i++) { const p = a.fore.at(i / 8 * fe, 1, -1.5); fp.push([p.x, p.y]); } for (let i = 8; i >= 0; i--) { const p = a.fore.at(i / 8 * fe, -1, -1.5); fp.push([p.x, p.y]); } c.fill(smoothClosed(fp)); c.fill(circP(a.E.x, a.E.y, D.fR0 + 1.5)); }
    glow(c, dc.x - 3, dc.y - 4, a.delt.r + 3, '#ffffff', .05);
    if (T.tight) glow(c, up.at(.5, a.bs, D.bi * .5).x, up.at(.5, a.bs, D.bi * .5).y, D.bi + 3, '#ffffff', .1 + D.gA * .15);
    if (T.cut !== 'long') { const e1 = up.at(hemT, 1, -ex2 - .2), e2 = up.at(hemT, -1, -ex2 - .2); c.strokeStyle = rgba(dk, .8); c.lineWidth = 1.3; c.beginPath(); c.moveTo(e1.x, e1.y); c.quadraticCurveTo(hC.x, hC.y, e2.x, e2.y); c.stroke();
      const f1 = up.at(hemT - .05, 1, -ex2 + .6), f2 = up.at(hemT - .05, -1, -ex2 + .6), fc = up.axis(hemT + .01); c.strokeStyle = rgba(dk, .25); c.lineWidth = .9; c.beginPath(); c.moveTo(f1.x, f1.y); c.quadraticCurveTo(fc.x, fc.y, f2.x, f2.y); c.stroke(); }
    curve(c, up.at(ts * .55, 1, 1), up.at(ts * .75, 0 || 1, 4), up.at(ts * .9, 1, 2), 1, '#000000', G.baggy ? .2 : .1);
    if (st > .15) for (let i = 0; i < 3; i++) curve(c, up.at(ts - .02, a.bs, 1), up.at(ts - .12 - i * .05, a.bs, D.bi * .3 + 1), up.at(ts - .26 - i * .06, -a.bs, 1), .9, '#000000', Math.min(.25, st * .16));
    if (st > 1 && k === 'r' && sk) { const p0 = up.at(.12, a.bs, 1.5), p1 = up.at(.32, a.bs, 1), m = mid(p0, p1); c.fillStyle = sk; c.beginPath(); c.ellipse(m.x, m.y, 3 + (st - 1) * 8, 2 + (st - 1) * 4, Math.atan2(p1.y - p0.y, p1.x - p0.x), 0, TAU); c.fill();
      c.strokeStyle = rgba(dk, .9); c.lineWidth = 1; c.beginPath(); for (let i = 0; i <= 6; i++) { const q = mid(p0, p1, i / 6); c.lineTo(q.x + (i % 2 ? 2 : -2), q.y + (i % 2 ? -1.5 : 1.5)); } c.stroke(); }
  });
}

/* ---------- Gesicht ---------- */
function face(c, D, H, L, o, pose) {
  const hx = H.hx, hy = H.hy, lk = pose.look || o.lookDir || { x: 0, y: 0 };
  let ex = o.face || pose.face || 'neutral';
  if (o.blink && (ex === 'neutral' || ex === 'focus' || ex === 'proud')) ex = 'blink';
  // Anstrengung in Stufen: leicht = konzentriert, schwer = Zähne, Maximum = Augen zu, roter Kopf, Ader auf der Stirn
  if (o.exert != null && ex === 'strain') ex = o.exert < .3 ? 'effort' : o.exert > .72 ? 'max' : 'strain';
  const brow = mix(L.hairc, '#000000', .3), ink = '#2a1810', eyeY = hy - 1, ed = 7.2, fem = !!D.fem;
  glow(c, hx - ed, eyeY, 6, '#5a2a10', .08); glow(c, hx + ed, eyeY, 6, '#5a2a10', .08);
  if (D.la > .2) [-1, 1].forEach(s => curve(c, P(hx + s * ed - 3.5, eyeY + 3.6), P(hx + s * ed, eyeY + 5.6), P(hx + s * ed + 3.5, eyeY + 3.6), 1.5, '#6a3a50', .35 * D.la));
  const eye = x => {
    if (ex === 'blink' || ex === 'drink') return curve(c, P(x - 3.5, eyeY), P(x, eyeY + 1.6), P(x + 3.5, eyeY), 1.6, ink, .9);
    if (ex === 'strain') return curve(c, P(x - 4, eyeY - 1), P(x, eyeY + 2.5), P(x + 4, eyeY - 1), 1.8, ink, .9);
    if (ex === 'max') { curve(c, P(x - 4.2, eyeY + .5), P(x, eyeY - 2.2), P(x + 4.2, eyeY + .5), 2.2, ink, .95); const o2 = x < hx ? -1 : 1; line(c, x + o2 * 5, eyeY - 1, x + o2 * 7.5, eyeY - 2.5, .9, ink, .5); line(c, x + o2 * 5, eyeY + 1, x + o2 * 7.5, eyeY + 1.6, .9, ink, .5); return; }
    if (ex === 'yawn') return curve(c, P(x - 3.5, eyeY + 1), P(x, eyeY - 1), P(x + 3.5, eyeY + 1), 1.6, ink, .9);
    const h = ex === 'tired' ? 1.6 : ex === 'shock' ? 3.6 : ex === 'effort' ? 1.9 : 2.7;
    c.fillStyle = '#fbf8f2'; c.beginPath(); c.ellipse(x, eyeY, 3.6, h, 0, 0, TAU); c.fill(); c.strokeStyle = rgba(ink, .5); c.lineWidth = .8; c.stroke();
    c.fillStyle = '#3a2416'; c.beginPath(); c.arc(x + clamp(lk.x, -1, 1) * 1.3, eyeY + clamp(lk.y, -1, 1) * .9, Math.min(1.9, h - .2), 0, TAU); c.fill();
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(x + clamp(lk.x, -1, 1) * 1.3 + .6, eyeY - .6 + clamp(lk.y, -1, 1) * .9, .55, 0, TAU); c.fill();
    if (ex === 'tired') { c.fillStyle = mix(L.skin, '#000000', .1); c.fillRect(x - 4, eyeY - 4, 8, 3.2); }
  };
  eye(hx - ed); eye(hx + ed);
  const bA = { neutral: 0, angry: 1, focus: .25, effort: .42, strain: .5, max: .7, proud: -.1, smile: -.1, sad: -.4, tired: -.25, shock: -.3, blink: 0, yawn: -.3, drink: -.2 }[ex] || 0;
  if (fem && ex !== 'blink' && ex !== 'strain') [-1, 1].forEach(s => { line(c, hx + s * (ed + 3), eyeY - 2, hx + s * (ed + 5.2), eyeY - 3.6, 1.1, ink, .9); line(c, hx + s * (ed + 1.5), eyeY - 2.8, hx + s * (ed + 3), eyeY - 4.6, 1, ink, .8); });
  c.strokeStyle = brow; c.lineWidth = fem ? 1.4 : 2.1 + D.gT * .9;
  [-1, 1].forEach(s => { c.beginPath(); c.moveTo(hx + s * (ed - 4), eyeY - 6 + Math.max(0, bA) * 2.5 + Math.min(0, bA) * -1); c.lineTo(hx + s * (ed + 4), eyeY - 6.5 - bA * 2.5 + (ex === 'sad' ? 2 : 0)); c.stroke(); });
  curve(c, P(hx + 1.5, hy + 1.5), P(hx + 3.4, hy + 7), P(hx + .3, hy + 8.4), 1.4, '#6a2a10', .4);
  glow(c, hx - 1, hy + 6, 3.5, '#ffffff', .14);
  const my = hy + 12.5;
  const fl = Math.max(o.flush || 0, ex === 'max' ? .8 : ex === 'strain' ? .35 : 0); if (fl > .05) [-1, 1].forEach(s => glow(c, hx + s * 9.5, hy + 7, 5.5, '#e2433a', fl * .3));
  if (ex === 'max') { glow(c, hx, hy - 6, 15, '#e2433a', .14); c.strokeStyle = rgba('#7a3a8a', .4); c.lineWidth = 1.2; c.beginPath(); c.moveTo(hx + 5, hy - 15); c.quadraticCurveTo(hx + 3, hy - 12, hx + 6, hy - 10); c.quadraticCurveTo(hx + 8, hy - 8, hx + 5.5, hy - 6); c.stroke();
    c.fillStyle = '#5a1a14'; c.beginPath(); c.ellipse(hx, my, 7, 3.8, 0, 0, TAU); c.fill(); c.fillStyle = '#f6f2ea'; c.fillRect(hx - 6, my - 2.2, 12, 4.4); line(c, hx - 5.8, my, hx + 5.8, my, .8, '#9a8a80', .9); for (let i = -2; i <= 2; i++) line(c, hx + i * 2.4, my - 2, hx + i * 2.4, my + 2, .5, '#b8aa9e', .8); }
  else if (ex === 'effort') { curve(c, P(hx - 4.8, my + .8), P(hx, my - .8), P(hx + 4.8, my + .8), 2.1, '#6a2418', .85); line(c, hx - 5.5, my + 1.4, hx - 4.6, my + .6, 1, '#6a2418', .5); line(c, hx + 5.5, my + 1.4, hx + 4.6, my + .6, 1, '#6a2418', .5); }
  else if (ex === 'strain' || ex === 'angry') { c.fillStyle = '#5a1a14'; c.beginPath(); c.ellipse(hx, my, 5.6, 3, 0, 0, TAU); c.fill(); c.fillStyle = '#f6f2ea'; c.fillRect(hx - 4.8, my - 1.6, 9.6, 3.2); line(c, hx - 4.6, my, hx + 4.6, my, .7, '#9a8a80', .9); glow(c, hx - 9, hy + 7, 5, '#e2433a', .18); glow(c, hx + 9, hy + 7, 5, '#e2433a', .18); }
  else if (ex === 'proud' || ex === 'smile') { c.fillStyle = '#5a1a14'; c.beginPath(); c.moveTo(hx - 6, my - 1.5); c.quadraticCurveTo(hx, my + 6, hx + 6, my - 1.5); c.closePath(); c.fill(); c.fillStyle = '#f6f2ea'; c.fillRect(hx - 4.5, my - 1.4, 9, 1.8); }
  else if (ex === 'sad') curve(c, P(hx - 5, my + 2), P(hx, my - 2), P(hx + 5, my + 2), 1.8, '#5a1a14', .8);
  else if (ex === 'tired') { c.fillStyle = '#5a1a14'; c.beginPath(); c.ellipse(hx, my + .5, 2.6, 2.2, 0, 0, TAU); c.fill(); }
  else if (ex === 'yawn' || ex === 'shock') { c.fillStyle = '#5a1a14'; c.beginPath(); c.ellipse(hx, my + 1, 3.6, 5, 0, 0, TAU); c.fill(); }
  else if (ex === 'drink') { c.fillStyle = '#5a1a14'; c.beginPath(); c.ellipse(hx, my, 2.4, 1.6, 0, 0, TAU); c.fill(); }
  else if (fem) { c.fillStyle = '#c4505a'; c.beginPath(); c.ellipse(hx, my + .6, 4, 1.8, 0, 0, TAU); c.fill(); line(c, hx - 4, my + .4, hx + 4, my + .4, .8, '#7a2a30', .7); }
  else curve(c, P(hx - 4.5, my), P(hx, my + (ex === 'focus' ? 0 : 1.6)), P(hx + 4.5, my), 1.6, '#6a2418', .75);
  // Ohr-Innenseite
  [-1, 1].forEach(s => glow(c, hx + s * (H.a - .2), hy + 1.5, 2.6, '#7a3a20', .25));
}

/* Nebenwirkungen aus dem Labor (Comic-Stil): Pickel, roter Kopf, Augenringe */
const ACNE = [[-.55, -.35], [.5, -.42], [-.25, .25], [.62, .18], [-.68, .12], [.3, .5], [-.1, -.62], [.15, -.3], [-.42, .52], [.45, -.05], [.02, .66], [-.62, -.08], [.7, -.25], [.22, .14]];
function sideFx(c, D, J, H, f) {
  if (f.red) glow(c, H.hx, H.hy + 2, H.a * 1.25, '#e2433a', .3 * f.red);
  if (f.sleepy) [-1, 1].forEach(s => { glow(c, H.hx + s * 7.2, H.hy + 3.2, 4.2, '#4a2a50', .32 * f.sleepy); curve(c, P(H.hx + s * 7.2 - 3, H.hy + 2.4), P(H.hx + s * 7.2, H.hy + 4.4), P(H.hx + s * 7.2 + 3, H.hy + 2.4), .9, '#5a3a60', .45 * f.sleepy); });
  if (f.acne) { const n = Math.round(3 + f.acne * 11); for (let i = 0; i < n; i++) { const q = ACNE[i % ACNE.length], x = H.hx + q[0] * H.a * .86, y = H.hy - 1 + q[1] * H.b * .78, r = .9 + (i % 3) * .35;
      c.fillStyle = 'rgba(214,72,60,.85)'; c.beginPath(); c.arc(x, y, r + .5, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,230,200,.9)'; c.beginPath(); c.arc(x - .2, y - .3, r * .45, 0, TAU); c.fill(); }
    [-1, 1].forEach(s => { for (let i = 0; i < Math.round(f.acne * 5); i++) { const x = J.shX + s * (D.shH * .45 + i * 3.2), y = J.shY + 6 + (i % 2) * 4; c.fillStyle = 'rgba(214,72,60,.75)'; c.beginPath(); c.arc(x, y, 1.1, 0, TAU); c.fill(); } }); }
}

/* ---------- Haare: sitzen fest auf dem Schädel ---------- */
function capPath(H, vol, sd, lineY, dip, skew) {
  const p = new Path2D(), a = H.a, b = H.b, cx = H.cx, cy = H.cy;
  p.ellipse(cx, cy, a + vol, b + vol, 0, Math.PI - sd, TAU + sd, false);
  const ty = cy + Math.sin(sd) * b;
  p.lineTo(cx + Math.cos(sd) * (a - .5), ty);
  p.quadraticCurveTo(cx + a * .55, cy - b * lineY + dip * .3, cx + (skew || 0), cy - b * lineY + dip);
  p.quadraticCurveTo(cx - a * .55, cy - b * lineY + dip * .3, cx - Math.cos(sd) * (a - .5), ty);
  p.closePath(); return p;
}
function spikes(H, r0, r1, n) { const p = new Path2D();
  for (let i = 0; i <= n * 2; i++) { const ang = Math.PI + .3 + i * (Math.PI - .6) / (n * 2), r = i % 2 ? r1 : r0, x = H.cx + Math.cos(ang) * H.a * r, y = H.cy + Math.sin(ang) * H.b * r; i ? p.lineTo(x, y) : p.moveTo(x, y); }
  p.lineTo(H.cx + H.a * .8, H.cy - H.b * .5); p.lineTo(H.cx - H.a * .8, H.cy - H.b * .5); p.closePath(); return p; }
function hairPaths(H, st, back, D, J) {
  const a = H.a, b = H.b, cx = H.cx, cy = H.cy, out = { main: [], shaved: null, back: [], part: null };
  if (st === 'glatze') return out;
  const Q = (px, py) => [cx + px * a, cy + py * b];
  if (back) {
    const p = new Path2D(); p.ellipse(cx, cy, a + 2, b + 2, 0, Math.PI - .55, TAU + .55, false); p.quadraticCurveTo(cx, cy + b * .9, cx - Math.cos(.55) * (a + 2), cy + Math.sin(.55) * (b + 2)); p.closePath();
    if (st === 'undercut' || st === 'iro') { out.shaved = p; const q = new Path2D(); q.ellipse(cx, cy, a + 2.5, b + 3, 0, Math.PI + .5, TAU - .5, false); q.closePath(); out.main.push(q); }
    else out.main.push(p);
    const Q = (px, py) => [cx + px * a, cy + py * b], sY = J.shY;
    if (st === 'lang') { out.main.push(smoothClosed([[cx - a - 3, cy - 4], [cx - a - 5.5, H.hy + H.ry * .6], [cx - a - 4, sY + 4], [cx - a * .55, sY + 19], [cx, sY + 15], [cx + a * .55, sY + 19], [cx + a + 4, sY + 4], [cx + a + 5.5, H.hy + H.ry * .6], [cx + a + 3, cy - 4], [cx, cy - b - 3]])); out.strands = 1; }
    if (st === 'bob') out.main.push(smoothClosed([Q(-1.12, -.2), Q(-1.22, .75), Q(-1.02, 1.12), Q(0, 1.02), Q(1.02, 1.12), Q(1.22, .75), Q(1.12, -.2), Q(0, -1.15)]));
    if (st === 'afro') { out.main.length = 0; out.main.push(ellP(cx, cy - b * .22, a * 1.58, b * 1.45)); out.curly = 1; }
    if (st === 'pferde' || st === 'zopf') { const top = P(cx, cy - b * .35), n = st === 'zopf' ? 6 : 1;
      if (st === 'pferde') out.main.push(smoothClosed([[cx - 4, cy - b * .3], [cx - 7.5, cy + b * .5], [cx - 5, sY + 14], [cx, sY + 22], [cx + 5, sY + 14], [cx + 7.5, cy + b * .5], [cx + 4, cy - b * .3]]));
      else for (let i = 0; i < n; i++) { const yy = cy + b * .1 + i * ((sY + 24 - cy - b * .1) / n); out.main.push(ellP(cx + (i % 2 ? 1.6 : -1.6), yy, 5.4 - i * .35, 5.2, i % 2 ? .5 : -.5)); }
      out.main.push(ellP(top.x, top.y + 2, 5.5, 3.5)); }
    if (st === 'dreads') for (let k = -4; k <= 4; k++) { const x0 = cx + k * a * .24, x1 = cx + k * a * .33; out.main.push(limb(P(x0, cy - b * .3), P(x1, sY + 14 - Math.abs(k) * 2), 3, 2.6, []).path); }
    if (st === 'kranz') { out.main.length = 0; const q = new Path2D(); q.ellipse(cx, cy, a + 1.5, b + 1.5, 0, -.25, Math.PI + .25, false); q.ellipse(cx, cy + 2, a - 2.5, b * .62, 0, Math.PI + .2, -.2, true); q.closePath(); out.main.push(q); }
    if (st === 'flattop' || st === 'fade') { out.main.length = 0; out.shaved = p; out.main.push(st === 'flattop' ? smoothClosed([Q(-.95, -.5), Q(-1.0, -1.38), Q(-.92, -1.48), Q(.92, -1.48), Q(1.0, -1.38), Q(.95, -.5), Q(0, -.62)]) : smoothClosed([Q(-.8, -.55), Q(-.84, -.95), Q(-.4, -1.13), Q(.4, -1.13), Q(.84, -.95), Q(.8, -.55), Q(0, -.6)])); }
    if (st === 'stachel') out.main.push(spikes(H, 1.0, 1.3, 9));
    if (st === 'cornrows') out.rows = 'back';
    if (st === 'dutt') out.main.push(circP(cx, cy - b - 4, 7.5));
    if (st === 'locken') for (let ang = Math.PI - .5; ang <= TAU + .5; ang += .32) out.main.push(circP(cx + Math.cos(ang) * (a + 1.5), cy + Math.sin(ang) * (b + 1.5), 5.4));
    return out;
  }
  switch (st) {
    case 'kurz': out.main.push(smoothClosed([[cx - a - .5, cy + 4], [cx - a - 3, cy - b * .35], [cx - a * .78 - 1.5, cy - b - 1.5], [cx - a * .3, cy - b - 4.5], [cx + a * .15, cy - b - 3.5], [cx + a * .55, cy - b - 3.8], [cx + a + 2.5, cy - b * .55],
        [cx + a + 2, cy + 1], [cx + a + .3, cy + 4], [cx + a - 1.2, cy - b * .15], [cx + a * .62, cy - b * .5], [cx + a * .32, cy - b * .3], [cx + a * .05, cy - b * .5], [cx - a * .25, cy - b * .26], [cx - a * .5, cy - b * .46], [cx - a * .75, cy - b * .3], [cx - a + 1.2, cy - b * .1]])); break;
    case 'buzz': out.main.push(capPath(H, 1, .2, .55, 0, 0)); break;
    case 'undercut': out.shaved = capPath(H, .7, .3, .55, 0, 0);
      out.main.push(smoothClosed([[cx - a * .9, cy - b * .4], [cx - a - .5, cy - b * .85], [cx - a * .5, cy - b - 5], [cx + 4, cy - b - 6.5], [cx + a + 1.5, cy - b - 2], [cx + a + 1.5, cy - b * .45], [cx + a * .45, cy - b * .6], [cx - a * .2, cy - b * .5]])); break;
    case 'seiten': out.main.push(capPath(H, 3.8, .4, .5, 5.5, -5)); out.part = [P(cx + a * .4, cy - b - 3.5), P(cx + a * .3, cy - b * .55)]; break;
    case 'locken': out.main.push(capPath(H, 2.5, .4, .5, 0, 0)); for (let ang = Math.PI - .25; ang <= TAU + .25; ang += .3) out.main.push(circP(cx + Math.cos(ang) * (a + 2), cy + Math.sin(ang) * (b + 2), 5.2)); break;
    case 'iro': out.shaved = capPath(H, .7, .3, .55, 0, 0);
      { const p = new Path2D(); [[cx - 7, cy - b + 6], [cx - 9, cy - b - 4], [cx - 5.5, cy - b - 1], [cx - 4.5, cy - b - 11], [cx - 1.5, cy - b - 2], [cx, cy - b - 14], [cx + 2, cy - b - 2], [cx + 5, cy - b - 11], [cx + 5.5, cy - b - 1], [cx + 9, cy - b - 4], [cx + 7, cy - b + 6]].forEach((q, i) => i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])); p.closePath(); out.main.push(p); } break;
    case 'lang': out.back.push(smoothClosed([[cx - a - 4, cy], [cx - a - 5.5, H.hy + H.ry * .7], [cx - a - 2.5, J.shY + 16], [cx + a + 2.5, J.shY + 16], [cx + a + 5.5, H.hy + H.ry * .7], [cx + a + 4, cy], [cx, cy - b - 3]]));
      out.main.push(capPath(H, 3.5, .5, .52, 0, 0));
      [-1, 1].forEach(s => out.main.push(smoothClosed([[cx + s * (a + 3.5), cy - 2], [cx + s * (a + 4.5), H.hy + H.ry * .78], [cx + s * (a - 1), H.hy + H.ry * .52], [cx + s * (a - 2.5), cy + 2]]))); break;
    case 'dutt': out.back.push(circP(cx, cy - b - 5, 7.5)); out.main.push(capPath(H, 1.6, .2, .55, 0, 0)); break;
    case 'topf': out.main.push(smoothClosed([Q(-1.08, .22), Q(-1.13, -.35), Q(-.86, -1.0), Q(0, -1.17), Q(.86, -1.0), Q(1.13, -.35), Q(1.08, .22), Q(.94, .24), Q(.9, -.22), Q(.45, -.27), Q(0, -.24), Q(-.45, -.27), Q(-.9, -.22), Q(-.94, .24)])); break;
    case 'stachel': out.main.push(capPath(H, 1, .25, .55, 0, 0), spikes(H, 1.0, 1.32, 11)); break;
    case 'tolle': out.main.push(capPath(H, 1.4, .3, .55, 0, 0), smoothClosed([Q(-.72, -.58), Q(-.92, -1.0), Q(-.45, -1.42), Q(.25, -1.6), Q(.88, -1.32), Q(1.02, -.88), Q(.62, -.72), Q(.2, -.95), Q(-.3, -.78)])); break;
    case 'fade': out.shaved = capPath(H, .6, .35, .55, 0, 0); out.main.push(smoothClosed([Q(-.8, -.55), Q(-.86, -.95), Q(-.4, -1.14), Q(.3, -1.16), Q(.86, -.95), Q(.82, -.55), Q(.4, -.63), Q(0, -.58), Q(-.4, -.63)])); break;
    case 'flattop': out.shaved = capPath(H, .6, .35, .55, 0, 0); out.main.push(smoothClosed([Q(-.95, -.45), Q(-1.0, -1.38), Q(-.9, -1.48), Q(.9, -1.48), Q(1.0, -1.38), Q(.95, -.45), Q(.5, -.56), Q(0, -.52), Q(-.5, -.56)])); break;
    case 'afro': out.back.push(ellP(cx, cy - b * .22, a * 1.58, b * 1.45)); out.main.push(capPath(H, 3, .15, .55, 0, 0)); out.curly = 1; break;
    case 'pferde': case 'zopf': out.main.push(capPath(H, 1.6, .3, .58, 3, -3)); out.part = [Q(-.3, -1.08), Q(-.25, -.6)].map(q => P(q[0], q[1])); break;
    case 'bob': out.back.push(smoothClosed([Q(-1.12, -.2), Q(-1.24, .8), Q(-1.0, 1.12), Q(1.0, 1.12), Q(1.24, .8), Q(1.12, -.2), Q(0, -1.15)]));
      out.main.push(capPath(H, 3, .45, .42, 2, 0)); [-1, 1].forEach(sd => out.main.push(smoothClosed([Q(sd * 1.1, -.25), Q(sd * 1.2, .8), Q(sd * 1.0, 1.1), Q(sd * .86, .9), Q(sd * .9, .05)]))); break;
    case 'dreads': out.main.push(capPath(H, 2.4, .4, .5, 0, 0)); for (let k = 0; k < 3; k++) [-1, 1].forEach(sd => { out.back.push(limb(P(cx + sd * (a * .55 + k * 4), cy - b * .6), P(cx + sd * (a + 3 + k * 3), J.shY + 10 - k * 3), 3, 2.6, []).path); });
      [-1, 1].forEach(sd => out.main.push(limb(P(cx + sd * (a - 1), cy - b * .2), P(cx + sd * (a + 2.5), H.hy + H.ry * 1.05), 3, 2.6, []).path)); break;
    case 'mittel': out.main.push(smoothClosed([Q(-1.05, .3), Q(-1.13, -.42), Q(-.8, -1.02), Q(-.12, -1.14), Q(0, -.98), Q(.12, -1.14), Q(.8, -1.02), Q(1.13, -.42), Q(1.05, .3), Q(.9, .26), Q(.76, -.26), Q(.36, -.46), Q(.06, -.86), Q(-.06, -.86), Q(-.36, -.46), Q(-.76, -.26), Q(-.9, .26)])); break;
    case 'zurueck': out.main.push(capPath(H, 2, .22, .72, 0, 0)); out.slick = 1; break;
    case 'kranz': [-1, 1].forEach(sd => out.main.push(smoothClosed([Q(sd * 1.02, -.42), Q(sd * 1.12, .05), Q(sd * 1.06, .3), Q(sd * .93, .25), Q(sd * .9, -.3)]))); break;
    case 'wuschel': out.main.push(capPath(H, 2.2, .35, .5, 3, 4)); [[-.75, -1.0, 5], [-.35, -1.22, 6], [.1, -1.28, 6.5], [.55, -1.15, 5.5], [.9, -.85, 5], [-1.0, -.6, 4.5], [.3, -.62, 4]].forEach(([u, v, r]) => out.main.push(circP(cx + u * a, cy + v * b, r))); break;
    case 'cornrows': out.main.push(capPath(H, .9, .25, .58, 0, 0)); out.rows = 'front'; break;
  }
  return out;
}
function drawHair(c, H, L, D, J, back, which) {
  if (Fig.hair) return Fig.hair(c, H, L, D, J, back, which);
  const hp = hairPaths(H, L.hair, back, D, J), hc = L.hairc, ink = mix(hc, '#000000', .45);
  if (which === 'back') { if (hp.back.length) { inkFill(c, hp.back, hc, ink, .9); if (hp.curly) { c.save(); const cl = new Path2D(); hp.back.forEach(p => cl.addPath(p)); c.clip(cl); for (let i = 0; i < 90; i++) { const ang = i * 2.39996, rr = Math.sqrt(i / 90) * H.a * 1.6; glow(c, H.cx + Math.cos(ang) * rr, H.cy - H.b * .22 + Math.sin(ang) * rr * .92, 3, i % 2 ? '#ffffff' : '#000000', .13); } c.restore(); } } return; }
  if (hp.shaved) { c.fillStyle = rgba(hc, .38); c.fill(hp.shaved); }
  if (L.hair === 'buzz') { c.fillStyle = rgba(hc, .85); hp.main.forEach(p => c.fill(p)); c.strokeStyle = rgba(ink, .4); c.lineWidth = .8; hp.main.forEach(p => c.stroke(p)); return; }
  if (!hp.main.length) { if (L.hair === 'glatze') glow(c, H.cx - 6, H.cy - 10, 8, '#ffffff', .4); return; }
  inkFill(c, hp.main, hc, ink, .9);
  c.save(); const clip = new Path2D(); hp.main.forEach(p => clip.addPath(p)); c.clip(clip);
  const g = c.createLinearGradient(H.cx - 20, H.cy - 30, H.cx + 20, H.cy); g.addColorStop(0, 'rgba(255,255,255,.25)'); g.addColorStop(.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,.25)'); c.fillStyle = g; c.fillRect(H.cx - 40, H.cy - 50, 80, 70);
  for (let i = 0; i < 5; i++) curve(c, P(H.cx - 12 + i * 6, H.cy - H.b - 1), P(H.cx - 10 + i * 6 + 3, H.cy - H.b * .8), P(H.cx - 11 + i * 6 + 2, H.cy - H.b * .55), .8, ink, .25);
  c.restore();
  if (hp.part) line(c, hp.part[0].x, hp.part[0].y, hp.part[1].x, hp.part[1].y, 1.2, ink, .7);
  // Koteletten vor den Ohren (nicht bei rasierten, langen oder Glatze-Varianten)
  if (!back && ['kurz', 'topf', 'mittel', 'seiten', 'wuschel', 'stachel', 'tolle', 'locken', 'zurueck', 'pferde', 'zopf', 'cornrows'].includes(L.hair)) [-1, 1].forEach(sd => { const x0 = H.hx + sd * (H.a - 2.6); c.fillStyle = hc; c.beginPath(); c.moveTo(x0 - sd * 1.6, H.cy + 1); c.lineTo(x0 + sd * 1.4, H.cy + 1); c.lineTo(x0 + sd * 1.1, H.hy + 6); c.lineTo(x0 - sd * .6, H.hy + 5); c.closePath(); c.fill(); });
  // Strukturen: Locken-Tupfen, Cornrows, gegelter Glanz, Strähnen
  c.save(); const clip2 = new Path2D(); hp.main.forEach(p => clip2.addPath(p)); c.clip(clip2);
  if (hp.curly) for (let i = 0; i < 70; i++) { const ang = i * 2.39996, rr = Math.sqrt(i / 70) * H.a * 1.55; glow(c, H.cx + Math.cos(ang) * rr, H.cy - H.b * .25 + Math.sin(ang) * rr * .92, 2.6, i % 2 ? '#ffffff' : '#000000', .12); }
  if (hp.rows) for (let k = -3; k <= 3; k++) { const x0 = H.cx + k * H.a * .26; if (hp.rows === 'front') curve(c, P(x0, H.cy - H.b * .55), P(x0 + k * .8, H.cy - H.b * .95), P(H.cx + k * 2, H.cy - H.b - 2), 1.4, ink, .6); else curve(c, P(H.cx + k * 2, H.cy - H.b - 2), P(x0 * 1 + k * 1.5, H.cy - H.b * .2), P(H.cx + k * H.a * .2, H.cy + H.b * .55), 1.4, ink, .6); }
  if (hp.slick) for (let k = -2; k <= 2; k++) curve(c, P(H.cx + k * 5, H.cy - H.b * .7), P(H.cx + k * 5.5, H.cy - H.b * 1.05), P(H.cx + k * 6.5, H.cy - H.b - 1), 1, '#ffffff', .28);
  if (hp.strands) for (let k = -3; k <= 3; k++) curve(c, P(H.cx + k * 3, H.cy - H.b), P(H.cx + k * 5, H.cy + H.b * .5), P(H.cx + k * 6.5, J.shY + 14), 1, ink, .3);
  c.restore();
}
function drawBeard(c, H, L, D, back) {
  if (back || !L.beard || L.beard === 'none' || L.beard === 'stoppel') return;
  const hc = mix(L.hairc, '#000000', .1), ink = mix(L.hairc, '#000000', .5), x = H.hx, y = H.hy, ps = [];
  if (L.beard === 'schnauz') ps.push(smoothClosed([[x - 8, y + 11.5], [x - 4, y + 8.5], [x, y + 9.5], [x + 4, y + 8.5], [x + 8, y + 11.5], [x, y + 11]]));
  if (L.beard === 'ziegen') { ps.push(smoothClosed([[x - 5.5, y + 15.5], [x + 5.5, y + 15.5], [x + 3, y + H.ry + 7], [x - 3, y + H.ry + 7]])); ps.push(smoothClosed([[x - 7, y + 11.5], [x - 3.5, y + 9], [x + 3.5, y + 9], [x + 7, y + 11.5], [x, y + 10.8]])); }
  if (L.beard === 'voll' || L.beard === 'wikinger') { const len = L.beard === 'wikinger' ? 17 : 5;
    ps.push(smoothClosed([[x - H.a + 1, y + 1], [x - H.jw - 1.5, y + H.ry * .52], [x - H.chin - 2, y + H.ry + 2 + len * .5], [x, y + H.ry + 4 + len], [x + H.chin + 2, y + H.ry + 2 + len * .5], [x + H.jw + 1.5, y + H.ry * .52], [x + H.a - 1, y + 1],
      [x + H.a - 4, y + 4], [x + 8, y + 11], [x + 5, y + 16.5], [x, y + 17.5], [x - 5, y + 16.5], [x - 8, y + 11], [x - H.a + 4, y + 4]]));
    ps.push(smoothClosed([[x - 8, y + 12], [x - 4, y + 8.6], [x + 4, y + 8.6], [x + 8, y + 12], [x, y + 10.8]])); }
  inkFill(c, ps, hc, ink, .8);
  if (L.beard === 'wikinger') { c.fillStyle = '#c9a227'; c.fillRect(x - 3, y + H.ry + 12, 6, 3); }
}
function headwear(c, H, L, D, back) {
  const h = L.head; if (!h || h === 'none') return;
  const col = L.headCol || '#333', ink = mix(col, '#000000', .5), a = H.a, b = H.b, cx = H.cx, cy = H.cy;
  if (h === 'band') { const p = new Path2D(); p.moveTo(cx - a - 1.5, cy - b * .3); p.quadraticCurveTo(cx, cy - b * .55, cx + a + 1.5, cy - b * .3); p.lineTo(cx + a + 1.2, cy - b * .3 + 6); p.quadraticCurveTo(cx, cy - b * .55 + 6, cx - a - 1.2, cy - b * .3 + 6); p.closePath(); inkFill(c, [p], col, ink, .8); }
  if (h === 'cap' || h === 'capback') { // Baseball-Cap: 6 Felder mit Nähten, Luftlöcher, Knopf, Logo, gebogener Schirm mit Schatten
    const fwd = (h === 'cap') !== back, rim = cy - b * .42, top = cy - b - 5.5, wR = a + 3.8, hi = mix(col, '#ffffff', .28), lo = mix(col, '#000000', .32);
    if (!fwd) { const bk = new Path2D(); bk.moveTo(cx - wR - 7, rim - 1); bk.quadraticCurveTo(cx, rim - 6, cx + wR + 7, rim - 1); bk.quadraticCurveTo(cx, rim + 1.5, cx - wR - 7, rim - 1); bk.closePath(); inkFill(c, [bk], lo, ink, .7); } // Schirm hinten: nur die Spitzen ragen seitlich raus
    const d = new Path2D(); d.moveTo(cx - wR, rim + 1); d.bezierCurveTo(cx - wR - 1.5, cy - b * .95, cx - a * .62, top, cx, top); d.bezierCurveTo(cx + a * .62, top, cx + wR + 1.5, cy - b * .95, cx + wR, rim + 1); d.quadraticCurveTo(cx, rim - 2.5, cx - wR, rim + 1); d.closePath();
    const g = c.createLinearGradient(cx - a * .7, top, cx + a * .8, rim + 2); g.addColorStop(0, hi); g.addColorStop(.45, col); g.addColorStop(1, lo);
    inkFill(c, [d], g, ink, .85);
    c.save(); c.clip(d);
    glow(c, cx - a * .35, top + b * .35, a * .75, '#ffffff', .22); // Glanz
    [[-.48, .9], [0, 1.1], [.48, .9]].forEach(([k, w]) => bez(c, P(cx, top + .5), P(cx + k * a * .55, top + 1), P(cx + k * a * 1.05, rim - b * .35), P(cx + k * a * 1.12, rim + 1), w, '#000000', .3)); // Nähte
    [[-.48, .9], [.48, .9]].forEach(([k]) => bez(c, P(cx + 1, top + 1), P(cx + k * a * .55 + 1, top + 1.5), P(cx + k * a * 1.05 + 1, rim - b * .35), P(cx + k * a * 1.12 + 1, rim + 1), .6, '#ffffff', .18));
    c.fillStyle = rgba(ink, .55); [-1, 1].forEach(sd => { c.beginPath(); c.arc(cx + sd * a * .74, top + b * .42, 1.05, 0, TAU); c.fill(); }); // Luftlöcher
    if (fwd) { const lg = mix(col, '#ffffff', .82); c.fillStyle = rgba(lg, .95); c.beginPath(); c.roundRect(cx - 5.5, rim - b * .38, 11, 6.2, 1.6); c.fill(); c.fillStyle = rgba(ink, .9); c.font = '700 5.2px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('MK', cx, rim - b * .38 + 3.3); c.textBaseline = 'alphabetic'; } // Logo vorne
    else { const op = new Path2D(); op.ellipse(cx, rim + 1.5, 6.5, 5.5, 0, Math.PI, TAU); op.closePath(); c.fillStyle = rgba(lo, .9); c.fill(op); c.fillStyle = mix(col, '#000000', .55); c.fillRect(cx - 7.5, rim - 3.2, 15, 2.6); c.fillStyle = rgba('#ffffff', .35); for (let i = -2; i <= 2; i++) { c.beginPath(); c.arc(cx + i * 2.6, rim - 1.9, .55, 0, TAU); c.fill(); } } // Snapback-Verschluss
    c.restore();
    line(c, cx - wR + 1, rim + .6, cx + wR - 1, rim + .6, 1.1, ink, .35); // Schweißband-Kante
    c.fillStyle = mix(col, '#000000', .2); c.beginPath(); c.ellipse(cx, top + .4, 2.2, 1.5, 0, 0, TAU); c.fill(); c.strokeStyle = rgba(ink, .7); c.lineWidth = .6; c.stroke(); // Knopf
    if (fwd) { // Schirm: Oberseite gewölbt, Unterseite dunkel, wirft Schatten auf die Stirn
      const sh = new Path2D(); sh.ellipse(cx, rim + 6.5, a * .95, 4.2, 0, 0, Math.PI); c.save(); c.globalAlpha = .28; c.fillStyle = '#000000'; c.filter = 'none'; c.fill(sh); c.restore();
      const br = new Path2D(); br.moveTo(cx - a - 8, rim + 1.2); br.bezierCurveTo(cx - a * .6, rim - 2.2, cx + a * .6, rim - 2.2, cx + a + 8, rim + 1.2); br.bezierCurveTo(cx + a * .7, rim + 8.2, cx - a * .7, rim + 8.2, cx - a - 8, rim + 1.2); br.closePath();
      const bg = c.createLinearGradient(0, rim - 2, 0, rim + 8); bg.addColorStop(0, hi); bg.addColorStop(.55, col); bg.addColorStop(1, lo); inkFill(c, [br], bg, ink, .85);
      const ub = new Path2D(); ub.moveTo(cx - a - 6, rim + 2.6); ub.bezierCurveTo(cx - a * .7, rim + 7.6, cx + a * .7, rim + 7.6, cx + a + 6, rim + 2.6); ub.bezierCurveTo(cx + a * .7, rim + 8.4, cx - a * .7, rim + 8.4, cx - a - 6, rim + 2.6); c.fillStyle = rgba(mix(col, '#000000', .6), .85); c.fill(ub);
      bez(c, P(cx - a - 4, rim + 1.6), P(cx - a * .5, rim - .9), P(cx + a * .5, rim - .9), P(cx + a + 4, rim + 1.6), .6, '#000000', .3); bez(c, P(cx - a * .8, rim + 3.4), P(cx - a * .4, rim + 5.2), P(cx + a * .4, rim + 5.2), P(cx + a * .8, rim + 3.4), .6, '#ffffff', .25); }
  }
  if (h === 'beanie') { const d = new Path2D(); d.ellipse(cx, cy - 1, a + 4.5, b + 6, 0, Math.PI + .02, TAU - .02, false); d.closePath(); const band = new Path2D(); band.rect(cx - a - 5, cy - 7, a * 2 + 10, 7);
    inkFill(c, [d, band], col, ink, .85); c.fillStyle = mix(col, '#000000', .15); c.fill(band); for (let i = -3; i <= 3; i++) line(c, cx + i * 4.5, cy - 6, cx + i * 4.5, cy - 1, 1, ink, .4); glow(c, cx - 6, cy - b * .7, 10, '#ffffff', .15); }
  if (h === 'kopfhoerer') { c.strokeStyle = ink; c.lineWidth = 4.4; c.beginPath(); c.ellipse(cx, cy, a + 4, b + 4, 0, Math.PI * 1.04, Math.PI * 1.96); c.stroke(); c.strokeStyle = col; c.lineWidth = 3; c.stroke();
    inkFill(c, [ellP(cx - a - 1.5, H.hy + 1, 4.5, 7.5), ellP(cx + a + 1.5, H.hy + 1, 4.5, 7.5)], col, ink, .8); }
}
function extras(c, D, J, G, L, back) {
  const a = L.acc, H = G.H;
  if (a === 'brille' && !back) { const y = H.hy - 4; c.fillStyle = 'rgba(15,15,20,.92)'; [[-13, 10.5], [2.5, 10.5]].forEach(([dx, w]) => { c.beginPath(); c.roundRect ? c.roundRect(H.hx + dx, y, w, 7, 2.5) : c.rect(H.hx + dx, y, w, 7); c.fill(); }); c.fillRect(H.hx - 3, y + 1, 6, 1.6); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(H.hx - 11, y + 1, 3, 1.5); c.fillRect(H.hx + 4.5, y + 1, 3, 1.5); }
  if (a === 'kette' && back) { c.strokeStyle = '#e6b422'; c.lineWidth = 2; c.beginPath(); c.ellipse(J.shX, J.shY - D.trap * .6 - 2, D.neckR + 2, 4, 0, .1, Math.PI - .1); c.stroke(); c.fillStyle = '#ffd96a'; c.fillRect(J.shX - 2, J.shY - D.trap * .6 + 1, 4, 3); }
  if (a === 'kette' && !back) { c.strokeStyle = '#e6b422'; c.lineWidth = 2.2; c.beginPath(); c.ellipse(J.shX, J.shY - 2, D.neckR + 5, 11 + D.gB * 4, 0, .15, Math.PI - .15); c.stroke(); c.fillStyle = '#ffd96a'; c.beginPath(); c.arc(J.shX, J.shY + 9 + D.gB * 4, 2.6, 0, TAU); c.fill(); }
  if (a === 'guertel') { const hy = J.hipY, p = new Path2D(); p.rect(J.hipX - D.waistH - 3, hy - 23, D.waistH * 2 + 6, 13); inkFill(c, [p], '#5a3418', '#2a1408', .7); c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(J.hipX - D.waistH - 3, hy - 23, D.waistH * 2 + 6, 3); if (!back) { c.fillStyle = '#d9b343'; c.fillRect(J.hipX - 6, hy - 22, 12, 11); c.fillStyle = '#5a3418'; c.fillRect(J.hipX - 3, hy - 19, 6, 5); } }
  if (a === 'uhr') { const ar = G.arm.l, p = ar.fore.axis(.86); c.fillStyle = '#1a1a1a'; c.beginPath(); c.ellipse(p.x, p.y, D.fR1 + 1.8, 3, Math.atan2(ar.fore.ny, ar.fore.nx), 0, TAU); c.fill(); c.fillStyle = '#2affb0'; c.beginPath(); c.arc(p.x, p.y, 1.5, 0, TAU); c.fill(); }

}
/* Handtuch: liegt weich auf den Trapezmuskeln, beide Enden fallen über die Brust – passt sich Brustbreite und Nacken an */
const TW = '#f7f5ef', TWI = '#b9b3a5';
function towel(c, D, J, back) {
  const x = J.shX, y = J.shY, nk = D.neckR, tr = D.trap, top = y - tr * .72 - 1, cw = 6.5 + D.chestH * .16;
  if (back) { const p = smoothClosed([[x - nk - cw * .9, y + 4], [x - nk - 2, top - 1], [x, top - 3.5], [x + nk + 2, top - 1], [x + nk + cw * .9, y + 4], [x + nk + 1, top + 5], [x, top + 3], [x - nk - 1, top + 5]]);
    inkFill(c, [p], TW, TWI, .7); for (let k = -2; k <= 2; k++) line(c, x + k * (nk * .45), top - 1.5, x + k * (nk * .5), top + 3.5, .8, TWI, .35); return; }
  const len = 30 + D.gB * 9, ps = [], ends = [];
  [-1, 1].forEach((s, i) => { const L = len + (i ? 5 : 0), inX = x + s * (nk * .35 + D.gB * 1.5), outX = x + s * (nk + cw + D.gB * 2);
    ps.push(smoothClosed([[x + s * (nk - 1.5), top - 1], [x + s * (nk + cw * .7), top + 1.5], [outX + s * 1.5, y + 9], [outX, y + L * .62], [outX - s * 1.2, y + L], [inX + s * .5, y + L - 1.5], [inX - s * .5, y + L * .5], [x + s * (nk - 2.5), y + 3]]));
    ends.push([inX, outX, y + L]); });
  inkFill(c, ps, TW, TWI, .75);
  c.save(); const cl = new Path2D(); ps.forEach(p => cl.addPath(p)); c.clip(cl);
  ends.forEach(([a1, b1, ly]) => { c.fillStyle = 'rgba(216,58,50,.9)'; c.fillRect(Math.min(a1, b1) - 2, ly - 8, Math.abs(b1 - a1) + 4, 2.4); c.fillRect(Math.min(a1, b1) - 2, ly - 4.5, Math.abs(b1 - a1) + 4, 1.2);
    for (let k = 1; k < 4; k++) { const xx = lerp(a1, b1, k / 4); line(c, xx, y - 2, xx + (b1 - a1) * .05, ly - 10, .7, TWI, .3); } });
  glow(c, x - nk - cw * .5, y + 12, cw, '#ffffff', .25); glow(c, x + nk + cw * .6, y + 18, cw * 1.2, '#7a7468', .12);
  c.restore();
}
function shoes(c, D, G, L) {
  const sh = L.shoes; if (!sh) return;
  ['l', 'r'].forEach(k => { const g = G.leg[k], f = g.f, s = g.s, x = f.x + s * 3, w = 12 + D.gL * 2.5;
    const p = smoothClosed([[x - w, f.y], [x + w, f.y], [x + w + .5, f.y - 4], [x + s * 6, f.y - 9 - D.gL], [x - s * 7, f.y - 10.5 - D.gL], [x - w, f.y - 5]]);
    inkFill(c, [p], sh.val, mix(sh.val, '#000000', .55), .9);
    c.fillStyle = sh.acc; c.fillRect(x - w, f.y - 2.5, w * 2, 2.5);
    line(c, x - s * 2, f.y - 9, x + s * 4, f.y - 7.5, 1.2, sh.acc, .9); line(c, x - s * 3.5, f.y - 7, x + s * 2.5, f.y - 5.5, 1.2, sh.acc, .9);
    glow(c, x - 4, f.y - 8, 6, '#ffffff', .25); });
}
function sweatDrops(c, H, sw) {
  const t = performance.now() / 1000; c.fillStyle = 'rgba(160,210,255,.85)';
  for (let i = 0; i < 3; i++) { const ph = (t * .8 + i * .37) % 1; if (ph > .8) continue; const x = H.hx + (i - 1) * 11, y = H.hy - 8 + ph * 26;
    c.beginPath(); c.moveTo(x, y - 3.5); c.quadraticCurveTo(x + 2.6, y + 1, x, y + 2); c.quadraticCurveTo(x - 2.6, y + 1, x, y - 3.5); c.fill(); }
}

/* ---------- Haut: Lauch ist käsig, Bräune macht dunkler, Pump und Anstrengung röten ---------- */
Fig.skin = function (L, D, o) {
  let sk = L.skin; const tan = L.tan || 0;
  if (D.la > .05 && tan < .2) sk = mix(sk, '#fbf2e6', D.la * .22 * (1 - tan * 4));
  // Bräune wirkt auf jedem Hautton: helle Haut wird bronze, dunkle Haut tiefer und satter. Bei allen: mehr Kontrast und Glanz.
  const lu = lum(L.skin);
  if (tan) { const tg = mix('#a85a26', '#3e1a08', clamp((.75 - lu) * 1.6, 0, 1)); sk = mix(sk, tg, tan * (lu > .45 ? .55 : .5)); }
  const fl = clamp((o && o.flush) || 0, 0, 1); if (fl > .02) sk = mix(sk, '#e0625a', fl * .13);
  return { sk, shd: mix(sk, lu < .45 ? '#0e0401' : '#3a1606', .42 + tan * .2), ink: mix(sk, '#24100a', .62), shine: tan > .1 ? tan * (.42 + .35 * clamp(.7 - lu, 0, 1)) : 0 };
};
/* Wie stark spannt das Oberteil? 0 = sitzt, 1 = spannt richtig, >1 = Naht reißt */
Fig.stretchOf = function (D, T) { if (!T || T.fit == null || D.la > .3) return 0; const size = D.gB * .35 + D.gA * .25 + D.gS * .25 + D.gR * .15; return clamp((size - T.fit) / .22, 0, 1.4); };
function sweatFace(c, H, sw) { // Schweiß auf der Stirn – zuerst Glanz, dann einzelne Perlen
  if (sw < .08) return; glow(c, H.hx - 2, H.hy - 13, 9, '#ffffff', Math.min(.35, sw * .45));
  const B = [[-8, -11], [6, -13], [11, -5], [-12, -4], [1, -15], [-4, -8]], n = Math.min(B.length, 1 + Math.floor(sw * 6));
  for (let i = 0; i < n; i++) { const x = H.hx + B[i][0], y = H.hy + B[i][1]; c.fillStyle = 'rgba(170,215,255,.85)'; c.beginPath(); c.moveTo(x, y - 2.2); c.quadraticCurveTo(x + 1.8, y + .8, x, y + 1.6); c.quadraticCurveTo(x - 1.8, y + .8, x, y - 2.2); c.fill(); c.fillStyle = 'rgba(255,255,255,.9)'; c.fillRect(x - .6, y - .6, .9, .9); }
}

/* Zerrung: Tape oder Bandage an der überlasteten Stelle */
function strainTape(c, D, J, G, g, back) {
  const band = (A, B, w, col) => { c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'butt'; c.beginPath(); c.moveTo(A.x, A.y); c.lineTo(B.x, B.y); c.stroke(); c.lineCap = 'round'; };
  const kt = '#2f8ad8', kt2 = '#ff5fa2';
  if (g === 'arme') { const f = G.arm.r.fore; [.38, .5].forEach(t => band(f.at(t, 1, -1.2), f.at(t, -1, -1.2), 4.2, '#f4f1ea')); }
  if (g === 'beine') { const k = G.leg.r.kn; c.fillStyle = '#f4f1ea'; c.beginPath(); c.ellipse(k.x, k.y, D.tR1 + 2.5, 6.5, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 1; c.stroke(); }
  if (g === 'schulter') { const d = G.arm.r.delt.c; band(P(d.x - 4, d.y - 8), P(d.x + 2, d.y + 9), 3, kt); band(P(d.x + 4, d.y - 7), P(d.x - 3, d.y + 8), 3, kt2); }
  if (g === 'brust' && !back) { const x = J.shX + D.chestH * .5, y = J.shY + 16; band(P(x - 8, y - 3), P(x + 8, y + 5), 3, kt); band(P(x - 6, y + 6), P(x + 7, y - 4), 3, kt2); }
  if (g === 'ruecken' && back) { const x = J.shX, y = J.hipY - 26; [-1, 1].forEach(s => band(P(x + s * 6, y - 14), P(x + s * 6, y + 12), 3.2, s < 0 ? kt : kt2)); }
  if (g === 'nacken') [-1, 1].forEach(s => band(P(J.shX + s * (D.neckR - 1), J.shY - D.neckL - 2), P(J.shX + s * (D.neckR + 5), J.shY - 2), 2.6, kt));
}

/* ---------- Haupt-Zeichenfunktion ---------- */
const LAST = {}; Fig._last = LAST;
/* o.reuse: das zuletzt gerenderte Bild dieser Figur erneut zeichnen statt alles neu zu berechnen (spart viel Zeit in ruhigen Momenten) */
Fig.render = function (ctx, wx, wy, scale, o) {
  const L0 = LAST[o.key]; if (o.reuse && L0 && L0.wx === wx && L0.wy === wy && L0.scale === scale && L0.sig === o.sig) { L0.out(ctx, o.breathK); return L0.R; }
  if (o.pose && o.pose.side) return Fig.renderSide(ctx, wx, wy, scale, o);
  const dpr = o.dpr || Math.min(MK.ecoOn && MK.ecoOn() ? 1.6 : 2, window.devicePixelRatio || 1, MK.dprCap || 9), s = scale * dpr;
  const D = Fig.dims(o.lv, o.posture || 0, o.breath || 0, o.pump, { fem: o.fem, plain: o.plain, belly: o.belly, fatAdd: o.fatAdd });
  const pose = o.pose || {};
  if (pose.slumpAdd) D.slump = Math.min(1.4, D.slump + pose.slumpAdd * .4);
  const J = Fig.skeleton(D, pose), L = o.L, back = !!o.back;
  const G = buildGeo(D, J, L, back), H = G.H;
  const [cF, F] = canv(o.key + 'F', s), [cA, A] = canv(o.key + 'A', s), [cB, B] = canv(o.key + 'B', s);
  const { sk, shd, ink, shine: tShine } = Fig.skin(L, D, o), OW = .9;
  if (tShine) o = Object.assign({}, o, { shine: Math.max(o.shine || 0, tShine) }); // Bräune glänzt – auf dunkler Haut sieht man vor allem den Glanz

  /* Ebene A: Beine, Rumpf, Hals, Kopf */
  inkFill(A, G.body, sk, ink, OW);
  A.globalCompositeOperation = 'source-atop';
  lightPass(A, J);
  /* Muskeln werden auf eine eigene Ebene gemalt und weichgezeichnet: weiche Übergänge statt Striche */
  const [cS, Sh] = canv(o.key + 'S', s / SOFT_K);
  if (!back) frontTorso(Sh, D, J, G, shd); else backTorso(Sh, D, J, G, shd);
  legShade(Sh, D, G, shd, back);
  glow(Sh, H.hx - 5, H.hy - 8, 14, '#ffffff', .1); glow(Sh, H.hx + 9, H.hy + 8, 12, shd, .12);
  softPaste(A, cS);
  G.J = J; tattoos(A, D, G, L, 'body', back);
  if (L.beard === 'stoppel' && !back) { A.fillStyle = rgba(L.hairc, .3); A.fill(smoothClosed([[H.hx - H.a + 1, H.hy + 1], [H.hx - H.jw, H.hy + H.ry * .5], [H.hx - H.chin, H.hy + H.ry * .97], [H.hx + H.chin, H.hy + H.ry * .97], [H.hx + H.jw, H.hy + H.ry * .5], [H.hx + H.a - 1, H.hy + 1], [H.hx + 6, H.hy + 10], [H.hx - 6, H.hy + 10]])); }
  socks(A, D, G);
  drawShorts(A, D, J, G, L);
  drawTop(A, D, J, G, L, back, o);
  if (o.shine > .05) { [-1, 1].forEach(sd => { glow(A, J.shX + sd * D.chestH * .4, J.shY + 18, 8, '#ffffff', o.shine * .3); glow(A, J.shX + sd * 8, J.shY + 58, 6, '#ffffff', o.shine * .2); }); glow(A, H.hx - 6, H.hy - 10, 7, '#ffffff', o.shine * .3); }
  A.globalCompositeOperation = 'source-over';

  /* Ebene B: Arme */
  inkFill(B, G.arms, sk, ink, OW);
  B.globalCompositeOperation = 'source-atop';
  B.fillStyle = 'rgba(255,255,255,.05)'; B.fillRect(-220, -480, 440, 520);
  { const [cS2, Sh2] = canv(o.key + 'S', s / SOFT_K); armShade(Sh2, D, G, shd, back); softPaste(B, cS2); }
  veins(B, D, G, sk, back);
  tattoos(B, D, G, L, 'arm', back);
  drawSleeves(B, D, G, L, sk, ink);
  if (L.gloves) ['l', 'r'].forEach(k => { const a = G.arm[k]; B.fillStyle = L.gloves; B.beginPath(); B.ellipse(a.hd.x, a.hd.y, D.handR * 1.3 * a.hs, D.handR * 1.15 * a.hs, a.ha, 0, TAU); B.fill(); });
  if (o.shine > .05) ['l', 'r'].forEach(k => { const a = G.arm[k], p = a.upper.at(.5, a.bs, D.bi * .5); glow(B, p.x, p.y, D.bi + 3, '#ffffff', o.shine * .35); });
  // Übergang Schulter → Rumpf: Armebene läuft zum Nacken hin weich aus, darunter liegt dieselbe Schulter in der Körperebene
  if (!(L.top && (L.top.cut === 'tee' || L.top.cut === 'long' || L.top.cut === 'hoodie'))) { B.globalCompositeOperation = 'destination-out';
  ['l', 'r'].forEach(k => { const a = G.arm[k], S0 = a.S, dx = J.shX - S0.x, dy = (J.shY - 6) - S0.y, dl = Math.hypot(dx, dy) || 1, r = a.delt.ry * 1.1 + 2;
    const cx0 = S0.x + dx / dl * r * .55, cy0 = S0.y + dy / dl * r * .55 - 2, gr = B.createRadialGradient(cx0, cy0, 0, cx0, cy0, r);
    gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(.45, 'rgba(0,0,0,.8)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); B.fillStyle = gr; B.beginPath(); B.arc(cx0, cy0, r, 0, TAU); B.fill(); }); }
  B.globalCompositeOperation = 'source-over';

  /* Zusammensetzen */
  drawHair(F, H, L, D, J, back, 'back');
  F.setTransform(1, 0, 0, 1, 0, 0);
  // Von hinten liegen Arme, die vor dem Körper arbeiten, hinter dem Rumpf (und umgekehrt)
  const armsBack = back ? !pose.armsBehind : !!pose.armsBehind;
  if (armsBack) { F.drawImage(cB, 0, 0); F.drawImage(cA, 0, 0); } else { F.drawImage(cA, 0, 0); F.drawImage(cB, 0, 0); }
  F.setTransform(s, 0, 0, s, OX * s, OY * s);
  if (L.acc === 'handtuch') towel(F, D, J, back);
  if (!back) { face(F, D, H, L, o, pose); sweatFace(F, H, o.sweat || 0); if (o.sfx) sideFx(F, D, J, H, o.sfx); }
  drawBeard(F, H, L, D, back);
  drawHair(F, H, L, D, J, back, 'main');
  headwear(F, H, L, D, back);
  extras(F, D, J, G, L, back);
  shoes(F, D, G, L);
  if (o.strain) strainTape(F, D, J, G, o.strain, back);
  if (o.sweat > .45 && !back) sweatDrops(F, H, o.sweat);

  const rot = pose.lie ? (o.rot != null ? o.rot : -Math.PI / 2) : 0, piv = rot ? (o.pivot || { x: wx, y: wy - 60 * scale }) : null;
  const out = (c2, bk) => { c2.save();
    if (bk) { const ay = wy, sy = 1 + bk * .006, sx = 1 + bk * .004; c2.translate(wx, ay); c2.scale(sx, sy); c2.translate(-wx, -ay); } // Atmen: Sprite hebt/weitet sich minimal
    if (o.glow) { c2.shadowColor = o.glowCol || 'rgba(255,70,40,.9)'; c2.shadowBlur = 18 * scale * o.glow; }
    if (o.alpha != null) c2.globalAlpha = o.alpha;
    if (rot) { c2.translate(piv.x, piv.y); c2.rotate(rot); c2.drawImage(cF, -(OX + J.hipX) * scale, -(OY + J.hipY) * scale, BW * scale, BH * scale); }
    else c2.drawImage(cF, wx - OX * scale, wy - OY * scale, BW * scale, BH * scale);
    c2.restore(); };
  out(ctx, o.breathK);
  const cs = Math.cos(rot), sn = Math.sin(rot), W = rot ? p => { const dx = (p.x - J.hipX) * scale, dy = (p.y - J.hipY) * scale; return { x: piv.x + dx * cs - dy * sn, y: piv.y + dx * sn + dy * cs }; } : p => ({ x: wx + p.x * scale, y: wy + p.y * scale });
  const RES = { rot, lie: !!pose.lie, D, J, scale, head: W(J.head), top: W({ x: J.head.x, y: J.head.y - D.headRy - 6 }), hip: W({ x: J.hipX, y: J.hipY }), ha: { l: W(G.arm.l.hd), r: W(G.arm.r.hd) }, el: { l: W(J.el.l), r: W(J.el.r) }, sh: { l: W(J.sh.l), r: W(J.sh.r) }, neck: W({ x: J.shX, y: J.shY - 4 }), foot: { l: W(J.foot.l), r: W(J.foot.r) }, hs: J.hs, props: pose.props || [] };
  LAST[o.key] = { out, R: RES, wx, wy, scale, sig: o.sig, spr: rot ? null : { cv: cF, x: wx - OX * scale, y: wy - OY * scale, w: BW * scale, h: BH * scale, fy: wy } }; return RES;
};
/* zuletzt gezeichnetes Figurenbild (für Schatten auf dem 3D-Boden) */
Fig.sprite = key => { const L0 = LAST[key]; return L0 && L0.spr; };

/* Werkzeuge für die Seitenansicht (side.js) */
Fig._h = { limb, smoothClosed, ellP, circP, inkFill, curve, line, glow, fd, mix, rgba, lerp, clamp, P, mid, TAU, rim, canv, camo, sweatFace, sweatDrops, OX, OY, BW, BH, TINK };

/* ---------- Look auflösen (IDs → Farben/Objekte) ---------- */
Fig.resolveLook = function (look) {
  const W = MK.WARD, f = (g, id) => W[g].items.find(i => i.id === id) || W[g].items[0];
  const top = f('top', look.top), bottom = f('bottom', look.bottom), shoes = f('shoes', look.shoes), gl = f('gloves', look.gloves), hd = f('head', look.head);
  return {
    skin: f('skin', look.skin).val, skinT: f('skin', look.skin).val, tan: f('tan', look.tan).val || 0, hairc: f('hairc', look.hairc).val, hair: look.hair,
    beard: look.beard, tattoo: look.tattoo, tats: look.tats || (look.tattoo && look.tattoo !== 'none' ? [look.tattoo] : []), top, bottom, shoes: shoes.val ? shoes : null, gloves: gl.val || null, head: hd.id, headCol: hd.val, acc: look.acc
  };
};

})(window.MK);
