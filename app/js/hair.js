/* ======================================================================
   HAARE 2.0 – aus einzelnen Strähnen statt aus 3 Flächen
   Jede Frisur = dunkle Grundmasse, die eng am Schädel sitzt + viele spitz zulaufende Strähnen,
   die vom Wirbel/Scheitel zum Haaransatz laufen. Dazu Glanzband, Schatten am Haaransatz, ausgefranste Spitzen.
   Koordinaten in Kopf-Einheiten: (u, v) → x = cx + u·a, y = cy + v·b (Schädelmitte, Halbachsen).
   ====================================================================== */
(function (MK) {
'use strict';
const F = MK.Fig, Hh = F._h, { mix, rgba, glow, TAU } = Hh;

function rng(seed) { let s = seed >>> 0 || 1; return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const hash = str => { let h = 2166136261; for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

/* Strähne: quadratische Kurve, an der Wurzel breit, zur Spitze hin spitz */
function sliver(c, x0, y0, qx, qy, x1, y1, w, col) {
  const N = 7, L = [], R = [];
  for (let i = 0; i <= N; i++) { const t = i / N, mt = 1 - t, x = mt * mt * x0 + 2 * mt * t * qx + t * t * x1, y = mt * mt * y0 + 2 * mt * t * qy + t * t * y1;
    const dx = 2 * mt * (qx - x0) + 2 * t * (x1 - qx), dy = 2 * mt * (qy - y0) + 2 * t * (y1 - qy), l = Math.hypot(dx, dy) || 1, ww = w * .5 * (1 - Math.pow(t, 1.7)) + .12;
    L.push(x - dy / l * ww, y + dx / l * ww); R.push(x + dy / l * ww, y - dx / l * ww); }
  c.fillStyle = col; c.beginPath(); c.moveTo(L[0], L[1]); for (let i = 2; i < L.length; i += 2) c.lineTo(L[i], L[i + 1]); for (let i = R.length - 2; i >= 0; i -= 2) c.lineTo(R[i], R[i + 1]); c.closePath(); c.fill();
}
function along(pts, u) { u = Math.max(0, Math.min(1, u)) * (pts.length - 1); const i = Math.min(pts.length - 2, Math.floor(u)), f = u - i; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f]; }

function makeCtx(c, H, L, D, J, style, back) {
  const hc = L.hairc, R = rng(hash(style + (back ? 'b' : 'f'))), a = H.a, b = H.b, cx = H.cx, cy = H.cy;
  const X = u => cx + u * a, Y = v => cy + v * b, Q = (u, v) => [X(u), Y(v)];
  const pal = { base: mix(hc, '#000000', .38), dark: mix(hc, '#000000', .2), mid: hc, lite: mix(hc, '#fff1d6', .13), hi: mix(hc, '#fff1d6', .28) };
  const K = { c, H, L, D, J, R, a, b, cx, cy, X, Y, Q, pal, hc, skin: L.skin || '#e0b08a' };
  /* Strähnenbündel: Wurzeln entlang roots, Spitzen entlang tips (beide in Kopf-Einheiten), Bogen nach außen (bulge) */
  K.band = (roots, tips, n, w, bulge, o) => { o = o || {}; n = Math.round(n * 1.5); w *= .62; const tj = o.tipJ == null ? .05 : o.tipJ, rj = o.rootJ == null ? .03 : o.rootJ, uj = o.uJ == null ? .04 : o.uJ;
    const pass = (k, wm, pick) => { for (let i = 0; i < n * k; i++) { const u = (i + R()) / (n * k), r0 = along(roots, u), t0 = along(tips, u + (R() - .5) * uj);
        const rx = X(r0[0] + (R() - .5) * rj), ry = Y(r0[1] + (R() - .5) * rj), tx = X(t0[0] + (R() - .5) * tj * .6), ty = Y(t0[1] + (R() - .2) * tj);
        const mx = (rx + tx) / 2, my = (ry + ty) / 2, ox = mx - cx, oy = my - (cy + (o.cyOff || 0) * b), ol = Math.hypot(ox, oy) || 1, d = Math.hypot(tx - rx, ty - ry), bg = (bulge + (R() - .5) * .08) * d;
        const qx = mx + ox / ol * bg + (o.curlX || 0) * d * (R() - .5), qy = my + oy / ol * bg;
        sliver(c, rx, ry, qx, qy, tx, ty, w * wm * (.75 + R() * .5), pick(u, mx, my)); } };
    const lit = (u, x, y) => (x - cx) / a * -.6 + (y - cy) / b * -.8; // > 0: Lichtseite oben links
    pass(.6, 1.7, () => pal.base);
    pass(1, 1, (u, x, y) => { const l = lit(u, x, y) + (R() - .5) * .5; return l > .55 ? pal.lite : l > -.2 ? pal.mid : pal.dark; });
    if (!o.noHi) pass(.18, .5, (u, x, y) => lit(u, x, y) > .3 ? pal.hi : pal.lite);
  };
  /* Grundmasse: Bogen über den Schädel (mit Volumen) + Haaransatz zurück */
  K.capPoly = (hl, vol, from, to) => { const p = new Path2D(); const r = 1 + vol, t0 = from == null ? Math.PI - .2 : from, t1 = to == null ? TAU + .2 : to;
    for (let i = 0; i <= 24; i++) { const t = t0 + (t1 - t0) * i / 24, x = cx + Math.cos(t) * a * r, y = cy + Math.sin(t) * b * r; i ? p.lineTo(x, y) : p.moveTo(x, y); }
    for (let i = hl.length - 1; i >= 0; i--) p.lineTo(X(hl[i][0]), Y(hl[i][1])); p.closePath(); return p; };
  K.poly = pts => { const p = new Path2D(); pts.forEach((q, i) => i ? p.lineTo(X(q[0]), Y(q[1])) : p.moveTo(X(q[0]), Y(q[1]))); p.closePath(); return p; };
  K.fill = (path, col) => { c.fillStyle = col || pal.base; c.fill(path); };
  /* rasierte Partie: Hautton + feine Stoppeln */
  K.stubble = (path, dens, alpha) => { c.save(); c.clip(path); c.fillStyle = rgba(hc, alpha == null ? .32 : alpha); c.fill(path);
    c.strokeStyle = rgba(mix(hc, '#000000', .2), .55); c.lineWidth = .55; c.beginPath();
    for (let i = 0; i < dens; i++) { const u = (R() - .5) * 2.4, v = -1.3 + R() * 1.6, x = X(u), y = Y(v), ang = Math.atan2(y - Y(-1.4), x - cx) + (R() - .5) * .6; c.moveTo(x, y); c.lineTo(x + Math.cos(ang) * 1.2, y + Math.sin(ang) * 1.2); }
    c.stroke(); c.restore(); };
  /* Glanzband quer über die Wölbung + dunkle Unterseite: liegt über allem, nur innerhalb der Haare */
  K.sheen = (clip, vTop, strength) => { c.save(); c.clip(clip); const s = strength == null ? 1 : strength;
    c.globalCompositeOperation = 'soft-light'; const g = c.createLinearGradient(0, Y(vTop == null ? -1.25 : vTop), 0, Y(.4)); g.addColorStop(0, 'rgba(255,255,255,.5)'); g.addColorStop(.45, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,.55)'); c.fillStyle = g; c.fillRect(X(-2), Y(-2.2), a * 4, b * 4);
    c.globalCompositeOperation = 'source-over'; c.strokeStyle = rgba('#ffffff', .16 * s); c.lineWidth = b * .18; c.lineCap = 'round'; c.beginPath(); c.ellipse(cx - a * .1, cy - b * .05, a * .86, b * .9, 0, Math.PI * 1.15, Math.PI * 1.62); c.stroke();
    c.strokeStyle = rgba('#ffffff', .1 * s); c.lineWidth = b * .07; c.beginPath(); c.ellipse(cx - a * .1, cy - b * .05, a * .74, b * .78, 0, Math.PI * 1.2, Math.PI * 1.55); c.stroke(); c.restore(); };
  /* weicher Schatten der Haare auf Stirn und Schläfen */
  K.lineShadow = hl => { for (let i = 0; i < hl.length; i++) { const [u, v] = hl[i]; glow(c, X(u), Y(v) + 2, 4.5, '#3a1a08', .13); } };
  /* einzelne Büschel (Pony, Spitzen, Wirbel) */
  K.tufts = (list, w) => list.forEach(([u0, v0, u1, v1, bu], i) => { const x0 = X(u0), y0 = Y(v0), x1 = X(u1), y1 = Y(v1), qx = (x0 + x1) / 2 + (bu || 0) * a, qy = (y0 + y1) / 2;
    sliver(c, x0, y0, qx, qy, x1, y1, w * 1.5, pal.base); sliver(c, x0, y0, qx, qy, x1, y1, w, i % 3 ? pal.mid : pal.lite); sliver(c, x0 - .3, y0 - .3, qx - .3, qy - .3, x1, y1, w * .3, rgba(pal.hi, .6)); });
  /* Locke: kleine Spirale mit Licht oben */
  K.curl = (u, v, r, tone) => { const x = X(u), y = Y(v), rr = r * a; c.fillStyle = pal.base; c.beginPath(); c.arc(x, y, rr * 1.12, 0, TAU); c.fill();
    c.fillStyle = tone || pal.mid; c.beginPath(); c.arc(x, y, rr, 0, TAU); c.fill();
    c.strokeStyle = pal.dark; c.lineWidth = Math.max(.6, rr * .22); c.beginPath(); for (let i = 0; i <= 14; i++) { const t = i / 14 * TAU * 1.4 + u * 5, q = rr * (.85 - i / 14 * .6); i ? c.lineTo(x + Math.cos(t) * q, y + Math.sin(t) * q) : c.moveTo(x + Math.cos(t) * q, y + Math.sin(t) * q); } c.stroke();
    c.strokeStyle = rgba(pal.hi, .7); c.lineWidth = Math.max(.5, rr * .2); c.beginPath(); c.arc(x - rr * .1, y - rr * .1, rr * .6, Math.PI * 1.1, Math.PI * 1.6); c.stroke(); };
  /* Zopf-/Cornrow-Glied */
  K.link = (x, y, ang, s) => { c.save(); c.translate(x, y); c.rotate(ang); c.fillStyle = pal.base; c.beginPath(); c.ellipse(0, 0, s * 1.15, s * .7, 0, 0, TAU); c.fill();
    c.fillStyle = pal.mid; c.beginPath(); c.ellipse(0, -s * .05, s, s * .55, 0, 0, TAU); c.fill(); c.strokeStyle = rgba(pal.hi, .6); c.lineWidth = s * .18; c.beginPath(); c.ellipse(0, -s * .1, s * .65, s * .3, 0, Math.PI * 1.1, Math.PI * 1.8); c.stroke(); c.restore(); };
  K.chain = (pts, s, step) => { let prev = null; for (let i = 0; i <= 40; i++) { const p = along(pts, i / 40), x = X(p[0]), y = Y(p[1]); if (prev && Math.hypot(x - prev[0], y - prev[1]) < step) continue; const nx = along(pts, Math.min(1, i / 40 + .03)); K.link(x, y, Math.atan2(Y(nx[1]) - y, X(nx[0]) - x) + (i % 2 ? .35 : -.35), s); prev = [x, y]; } };
  return K;
}

/* Standard-Linien */
const HL = [[-1.0, .18], [-.99, -.2], [-.85, -.44], [-.5, -.55], [-.15, -.6], [.15, -.6], [.5, -.55], [.85, -.44], [.99, -.2], [1.0, .18]];
const CR = [[-.95, -.3], [-.8, -.8], [-.4, -1.02], [0, -1.08], [.4, -1.02], [.8, -.8], [.95, -.3]];
const sideL = hl => hl.slice(0, Math.ceil(hl.length / 2)), sideR = hl => hl.slice(Math.floor(hl.length / 2));

const FRONT = {
  kurz(K) { const hl = [[-1.0, .14], [-.98, -.22], [-.82, -.38], [-.5, -.41], [-.15, -.47], [.2, -.4], [.55, -.45], [.86, -.36], [.99, -.18], [1.0, .14]];
    K.lineShadow(hl); const cap = K.capPoly(hl, .14); K.fill(cap);
    K.band(CR, hl, 46, 3.4, .2, { tipJ: .08 });
    K.tufts([[-.55, -.75, -.68, -.36, -.05], [-.25, -.8, -.38, -.4, -.05], [.05, -.82, -.05, -.42, -.04], [.35, -.8, .26, -.38, -.04], [.62, -.72, .55, -.4, -.03], [-.8, -.6, -.92, -.3, -.03], [.85, -.6, .93, -.28, .02]], 3.2);
    K.tufts([[-.5, -1.0, -.62, -1.2, -.05], [-.15, -1.06, -.2, -1.26, 0], [.2, -1.05, .28, -1.24, .04], [.55, -.98, .72, -1.14, .05]], 3.4);
    K.sheen(cap); return cap; },
  buzz(K) { const hl = [[-1.0, .1], [-.98, -.3], [-.8, -.5], [-.4, -.6], [0, -.63], [.4, -.6], [.8, -.5], [.98, -.3], [1.0, .1]]; const cap = K.capPoly(hl, .035);
    K.stubble(cap, 520, .62); K.sheen(cap, -1.1, .5); return cap; },
  undercut(K) { const cap = K.capPoly(HL, .03); K.stubble(cap, 380, .3);
    const top = [[-.82, -.6], [-.92, -.92], [-.62, -1.2], [-.1, -1.34], [.45, -1.33], [.9, -1.18], [1.08, -.92], [.98, -.7], [.6, -.66], [.1, -.72], [-.4, -.66]], tp = K.poly(top); K.fill(tp);
    K.band([[-.8, -.64], [-.3, -.7], [.3, -.72], [.85, -.68]], [[-.65, -1.2], [-.05, -1.33], [.5, -1.32], [1.05, -.95]], 34, 3.8, .28, { tipJ: .06 });
    K.tufts([[.7, -1.1, 1.12, -.86, .06], [.5, -1.2, .95, -1.16, .03], [-.6, -.95, -.92, -.84, -.03]], 3.6); K.sheen(tp, -1.35); return tp; },
  seiten(K) { const hl = [[-1.0, .15], [-.99, -.2], [-.88, -.34], [-.62, -.38], [-.3, -.46], [.05, -.56], [.32, -.64], [.6, -.56], [.88, -.42], [.99, -.2], [1.0, .15]];
    K.lineShadow(hl); const cap = K.capPoly(hl, .16); K.fill(cap);
    const part = [[.4, -1.1], [.38, -.66]];
    K.band([[.4, -1.1], [.4, -.95], [.39, -.8], [.38, -.68]], hl.slice(0, 7), 48, 3.4, .24, { tipJ: .06, uJ: .02 });
    K.band(part, hl.slice(6).reverse(), 20, 3, .14, { tipJ: .05 });
    K.tufts([[-.1, -.78, -.45, -.4, -.04], [.1, -.76, -.15, -.48, -.03], [-.4, -.7, -.72, -.36, -.04]], 3.2);
    K.c.strokeStyle = rgba(mix(K.skin, '#7a4a30', .3), .8); K.c.lineWidth = .9; K.c.beginPath(); K.c.moveTo(K.X(.41), K.Y(-1.1)); K.c.quadraticCurveTo(K.X(.42), K.Y(-.9), K.X(.39), K.Y(-.7)); K.c.stroke();
    K.sheen(cap); return cap; },
  locken(K) { const hl = HL.map(([u, v]) => [u, v + .02]); K.lineShadow(hl); const cap = K.capPoly(hl, .2); K.fill(cap);
    const pts = []; for (let t = Math.PI - .15; t <= TAU + .15; t += .2) pts.push([Math.cos(t) * 1.12, Math.sin(t) * 1.12, .2]);
    for (let t = Math.PI + .25; t <= TAU - .25; t += .26) pts.push([Math.cos(t) * .82, Math.sin(t) * .86, .19]);
    for (let u = -.75; u <= .76; u += .25) pts.push([u, -.52 - Math.abs(u) * .05, .17]);
    pts.forEach(([u, v, r], i) => K.curl(u, v, r * (.9 + K.R() * .25), (u * -.6 + v * -.8) > .5 ? K.pal.lite : i % 3 ? K.pal.mid : K.pal.dark));
    K.sheen(cap, -1.3, .7); return cap; },
  iro(K) { const cap = K.capPoly(HL, .03); K.stubble(cap, 380, .28);
    const spikes = [[-.28, -1.35], [-.18, -1.62], [-.06, -1.78], [.06, -1.8], [.18, -1.66], [.28, -1.4]];
    const base = K.poly([[-.3, -.62], [-.32, -1.02], [0, -1.08], [.32, -1.02], [.3, -.62]]); K.fill(base);
    spikes.forEach(([u, v], i) => { const x0 = K.X(u * .8), y0 = K.Y(-.95); for (let k = 0; k < 5; k++) { const j = (k - 2) * .025, w = 6.5 - k * .6;
      sliver(K.c, x0 + j * K.a, y0, K.X(u * .9 + j) , K.Y((v - .95) / 2 - .5), K.X(u + j * .6), K.Y(v + (k % 2 ? .06 : 0)), w, k === 0 ? K.pal.base : k === 4 ? K.pal.hi : k % 2 ? K.pal.mid : K.pal.lite); } });
    K.band([[-.28, -.66], [.28, -.66]], [[-.28, -1.0], [.28, -1.0]], 12, 3, .1, { tipJ: .02 }); return base; },
  lang(K) { const hl = [[-1.0, .2], [-.97, -.2], [-.8, -.42], [-.45, -.56], [-.1, -.7], [0, -.78], [.1, -.7], [.45, -.56], [.8, -.42], [.97, -.2], [1.0, .2]];
    const sh = (K.J.shY + 12 - K.cy) / K.b; K.lineShadow(hl); const cap = K.capPoly(hl, .14); K.fill(cap);
    K.band([[0, -1.1], [-.05, -.82]], [[-1.12, -.3], [-.85, -.48]], 26, 3.4, .2, { tipJ: .03 }); K.band([[0, -1.1], [.05, -.82]], [[1.12, -.3], [.85, -.48]], 26, 3.4, .2, { tipJ: .03 });
    [-1, 1].forEach(s => { const lock = K.poly([[s * .98, -.45], [s * 1.18, .2], [s * 1.22, sh * .6], [s * 1.12, sh], [s * .9, sh * .95], [s * .86, .4], [s * .9, -.2]]); K.fill(lock);
      K.band([[s * .95, -.45], [s * 1.1, -.35], [s * 1.18, -.2]], [[s * .88, sh * .92], [s * 1.05, sh * 1.04], [s * 1.2, sh * .88]], 18, 3.2, .1, { tipJ: .18, cyOff: 1, curlX: .25 }); });
    K.sheen(cap); return cap; },
  dutt(K) { const hl = HL; K.lineShadow(hl); const cap = K.capPoly(hl, .07); K.fill(cap);
    K.band([[-.95, -.6], [-.7, -1.0], [-.3, -1.12], [0, -1.14], [.3, -1.12], [.7, -1.0], [.95, -.6]], hl.slice(1, -1), 44, 2.4, .14, { tipJ: .015 });
    K.sheen(cap, -1.15); return cap; },
  topf(K) { const hl = [[-1.05, .22], [-1.04, -.28], [-.6, -.32], [-.2, -.34], [.2, -.34], [.6, -.32], [1.04, -.28], [1.05, .22]];
    K.lineShadow(hl); const cap = K.capPoly(hl, .17); K.fill(cap);
    K.band([[-.95, -.4], [-.8, -.85], [-.4, -1.06], [0, -1.1], [.4, -1.06], [.8, -.85], [.95, -.4]], hl, 60, 3.3, .2, { tipJ: .01, uJ: .02 });
    K.c.strokeStyle = rgba(K.pal.base, .9); K.c.lineWidth = 1.4; K.c.beginPath(); hl.forEach(([u, v], i) => i ? K.c.lineTo(K.X(u), K.Y(v)) : K.c.moveTo(K.X(u), K.Y(v))); K.c.stroke();
    K.sheen(cap); return cap; },
  wuschel(K) { const hl = [[-1.0, .16], [-.98, -.24], [-.8, -.4], [-.45, -.4], [-.1, -.5], [.3, -.42], [.62, -.48], [.88, -.36], [.99, -.2], [1.0, .16]];
    K.lineShadow(hl); const cap = K.capPoly(hl, .2); K.fill(cap); K.band(CR, hl, 40, 3.6, .26, { tipJ: .12, curlX: .5 });
    const t = []; for (let i = 0; i < 11; i++) { const ang = Math.PI + .2 + i / 10 * (Math.PI - .4) + (K.R() - .5) * .15, r0 = .95, r1 = 1.2 + K.R() * .12, sw = (K.R() - .5) * .7; t.push([Math.cos(ang) * r0, Math.sin(ang) * r0, Math.cos(ang + sw) * r1, Math.sin(ang + sw) * r1, (K.R() - .5) * .3]); }
    K.tufts(t, 4.5); K.tufts([[-.4, -.75, -.6, -.36, -.1], [0, -.8, .1, -.4, .12], [.4, -.75, .3, -.38, -.1]], 3.4); K.sheen(cap); return cap; },
  mittel(K) { const hl = [[-1.0, .2], [-.98, -.16], [-.86, -.34], [-.6, -.4], [-.3, -.55], [-.06, -.74], [.06, -.74], [.3, -.55], [.6, -.4], [.86, -.34], [.98, -.16], [1.0, .2]];
    K.lineShadow(hl); const cap = K.capPoly(hl, .16); K.fill(cap);
    K.band([[-.02, -1.1], [-.03, -.8]], [[-1.05, -.1], [-.4, -.48]], 32, 3.4, .26, { tipJ: .05 }); K.band([[.02, -1.1], [.03, -.8]], [[1.05, -.1], [.4, -.48]], 32, 3.4, .26, { tipJ: .05 });
    K.tufts([[-.08, -.82, -.36, -.42, -.08], [.08, -.82, .36, -.42, .08]], 3.6); K.sheen(cap); return cap; },
  stachel(K) { const hl = HL; K.lineShadow(hl); const cap = K.capPoly(hl, .08); K.fill(cap);
    K.band(CR, hl, 30, 3, .16, { tipJ: .04 });
    const t = []; for (let i = 0; i < 10; i++) { const ang = Math.PI + .35 + i / 9 * (Math.PI - .7) + (K.R() - .5) * .1, r1 = 1.3 + K.R() * .16; t.push([Math.cos(ang) * .78, Math.sin(ang) * .78, Math.cos(ang - .12) * r1, Math.sin(ang - .12) * r1, -.04]); }
    K.tufts(t, 7.5); K.tufts([[-.4, -.6, -.5, -.3, 0], [0, -.65, .02, -.34, 0], [.4, -.6, .5, -.3, 0]], 4.5); K.sheen(cap, -1.2, .7); return cap; },
  fade(K) { const cap = K.capPoly(HL, .03); K.stubble(cap, 460, .3);
    K.c.save(); K.c.clip(cap); const g = K.c.createLinearGradient(0, K.Y(-.4), 0, K.Y(.2)); g.addColorStop(0, rgba(K.hc, .4)); g.addColorStop(1, rgba(K.hc, 0)); K.c.fillStyle = g; K.c.fillRect(K.X(-1.2), K.Y(-.6), K.a * 2.4, K.b); K.c.restore();
    const top = [[-.84, -.56], [-.9, -.9], [-.5, -1.16], [0, -1.22], [.5, -1.16], [.9, -.9], [.84, -.56], [.4, -.62], [0, -.6], [-.4, -.62]], tp = K.poly(top); K.fill(tp);
    K.band([[-.8, -.9], [-.4, -1.12], [0, -1.18], [.4, -1.12], [.8, -.9]], [[-.82, -.58], [-.4, -.62], [0, -.58], [.4, -.62], [.82, -.58]], 40, 2.8, .12, { tipJ: .05 });
    K.tufts([[-.3, -.8, -.36, -.5, 0], [.1, -.82, .06, -.52, 0], [.45, -.78, .4, -.52, 0]], 2.8); K.sheen(tp, -1.25); return tp; },
  cornrows(K) { const cap = K.capPoly(HL, .04); K.stubble(cap, 220, .3);
    for (let k = -3; k <= 3; k++) { const u = k * .27; K.chain([[u * 1.05, -.56], [u * 1.02, -.8], [u * .85, -1.0], [u * .6, -1.1]], 2.6, 3.4); } K.sheen(cap, -1.1, .6); return cap; },
  zurueck(K) { const hl = [[-1.0, .12], [-.98, -.3], [-.82, -.52], [-.45, -.64], [0, -.68], [.45, -.64], [.82, -.52], [.98, -.3], [1.0, .12]];
    K.lineShadow(hl); const cap = K.capPoly(hl, .12); K.fill(cap);
    K.band([[-.98, -.7], [-.8, -1.0], [-.45, -1.14], [0, -1.16], [.45, -1.14], [.8, -1.0], [.98, -.7]], hl.slice(1, -1), 56, 2.6, .14, { tipJ: .01, uJ: .01, noHi: true });
    const c = K.c; c.save(); c.clip(cap); for (let k = -3; k <= 3; k++) { c.strokeStyle = rgba('#ffffff', k < 0 ? .38 : .18); c.lineWidth = 1.1; c.beginPath(); c.moveTo(K.X(k * .22), K.Y(-.66)); c.quadraticCurveTo(K.X(k * .26), K.Y(-1.0), K.X(k * .3), K.Y(-1.16)); c.stroke(); } c.restore();
    K.sheen(cap, -1.2, 1.4); return cap; },
  afro(K) { const hl = HL.map(([u, v]) => [u, v + .04]); K.lineShadow(hl); const cap = K.capPoly(hl, .3); K.fill(cap);
    for (let i = 0; i < 26; i++) { const t = Math.PI + .1 + i / 25 * (Math.PI - .2); K.curl(Math.cos(t) * .98, Math.sin(t) * .98 + .02, .13, i % 2 ? K.pal.mid : K.pal.dark); }
    for (let u = -.8; u <= .81; u += .2) K.curl(u, -.5 - Math.abs(u) * .08, .12, K.pal.mid);
    return cap; },
  pferde(K) { const hl = HL; K.lineShadow(hl); const cap = K.capPoly(hl, .08); K.fill(cap);
    K.band([[-.95, -.6], [-.6, -1.04], [-.3, -1.12], [0, -1.14], [.3, -1.12], [.6, -1.04], [.95, -.6]], hl.slice(1, -1), 46, 2.5, .14, { tipJ: .015 });
    K.c.strokeStyle = rgba(mix(K.skin, '#7a4a30', .3), .7); K.c.lineWidth = .8; K.c.beginPath(); K.c.moveTo(K.X(-.28), K.Y(-1.1)); K.c.quadraticCurveTo(K.X(-.3), K.Y(-.9), K.X(-.25), K.Y(-.62)); K.c.stroke();
    K.sheen(cap, -1.15); return cap; },
  tolle(K) { const cap = K.capPoly(HL, .06); K.fill(cap, K.pal.dark); K.band(CR, HL, 26, 2.4, .12, { tipJ: .02, noHi: true });
    const q = [[-.75, -.58], [-.98, -1.0], [-.62, -1.45], [.05, -1.68], [.72, -1.5], [1.02, -1.1], [.75, -.82], [.4, -.95], [0, -.72], [-.4, -.62]], qp = K.poly(q); K.fill(qp);
    K.band([[-.72, -.6], [-.35, -.64], [0, -.7], [.4, -.88], [.72, -.82]], [[-.75, -1.3], [-.3, -1.6], [.15, -1.66], [.65, -1.5], [1.0, -1.1]], 40, 3.8, .3, { tipJ: .04 });
    K.tufts([[.55, -1.4, .98, -1.02, .1], [.2, -1.55, .7, -1.45, .02]], 3.6); K.sheen(qp, -1.7, 1.2); return qp; },
  bob(K) { const hl = [[-1.0, .2], [-.98, -.18], [-.8, -.36], [-.4, -.38], [0, -.4], [.3, -.48], [.6, -.6], [.85, -.5], [.98, -.2], [1.0, .2]];
    K.lineShadow(hl); const cap = K.capPoly(hl, .18); K.fill(cap);
    K.band([[.55, -1.12], [.5, -.82]], hl.slice(0, 7), 40, 3.4, .22, { tipJ: .03 }); K.band([[.55, -1.12], [.52, -.84]], hl.slice(6).reverse(), 14, 3.2, .16, { tipJ: .03 });
    [-1, 1].forEach(s => { const lock = K.poly([[s * .96, -.4], [s * 1.2, .1], [s * 1.22, .9], [s * 1.12, 1.08], [s * .9, 1.06], [s * .88, .3], [s * .9, -.2]]); K.fill(lock);
      K.band([[s * .95, -.45], [s * 1.12, -.2]], [[s * .9, 1.06], [s * 1.18, 1.06]], 14, 3.2, .05, { tipJ: .01, cyOff: .6 }); });
    K.sheen(cap); return cap; },
  flattop(K) { const cap = K.capPoly(HL, .03); K.stubble(cap, 400, .3);
    const top = [[-.94, -.48], [-1.0, -1.32], [-.94, -1.44], [.94, -1.44], [1.0, -1.32], [.94, -.48], [.5, -.58], [0, -.55], [-.5, -.58]], tp = K.poly(top); K.fill(tp);
    K.band([[-.92, -.55], [-.5, -.6], [0, -.57], [.5, -.6], [.92, -.55]], [[-.96, -1.42], [-.5, -1.44], [0, -1.44], [.5, -1.44], [.96, -1.42]], 50, 2.6, 0, { tipJ: .0, rootJ: .02 });
    K.c.fillStyle = rgba(K.pal.lite, .55); K.c.fillRect(K.X(-.94), K.Y(-1.44), K.a * 1.88, 2); K.sheen(tp, -1.45, .8); return tp; },
  zopf(K) { return FRONT.pferde(K); },
  dreads(K) { const hl = HL; K.lineShadow(hl); const cap = K.capPoly(hl, .15); K.fill(cap);
    const sh = (K.J.shY + 6 - K.cy) / K.b;
    [[-.75, -.7, -1.18, sh * .92], [-.5, -.82, -1.05, sh], [.5, -.82, 1.05, sh], [.75, -.7, 1.18, sh * .9], [-.9, -.4, -1.25, sh * .7], [.9, -.4, 1.25, sh * .72]].forEach(([u0, v0, u1, v1]) => dread(K, u0, v0, u1, v1, 2.8));
    [-1, 1].forEach(s => { for (let k = 0; k < 4; k++) dread(K, s * (.08 + k * .07), -1.04 + k * .03, s * (.55 + k * .16), -.62 + k * .07, 2.6); });
    return cap; },
  kranz(K) { K.c.save(); K.c.beginPath(); K.c.ellipse(K.cx, K.cy, K.a, K.b + 1, 0, 0, TAU); K.c.clip(); glow(K.c, K.X(-.3), K.Y(-.75), K.a * .45, '#ffffff', .38); K.c.restore(); [-1, 1].forEach(s => { const p = K.poly([[s * .86, -.5], [s * 1.06, -.4], [s * 1.08, .05], [s * 1.0, .3], [s * .9, .2], [s * .88, -.2]]); K.fill(p);
      K.band([[s * .88, -.48], [s * 1.04, -.4]], [[s * .92, .24], [s * 1.04, .22]], 10, 2.8, .05, { tipJ: .03 }); });
    return null; },
  glatze(K) { K.c.save(); K.c.beginPath(); K.c.ellipse(K.cx, K.cy, K.a, K.b + 1, 0, 0, TAU); K.c.clip(); glow(K.c, K.X(-.3), K.Y(-.72), K.a * .5, '#ffffff', .42); glow(K.c, K.X(.45), K.Y(-.4), K.a * .3, '#ffffff', .12); K.c.restore(); return null; }
};
function dread(K, u0, v0, u1, v1, w) { const c = K.c, x0 = K.X(u0), y0 = K.Y(v0), x1 = K.X(u1), y1 = K.Y(v1), qx = (x0 + x1) / 2 + (u1 - u0) * K.a * .2, qy = (y0 + y1) / 2;
  c.lineCap = 'round'; c.strokeStyle = K.pal.base; c.lineWidth = w * 1.5; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(qx, qy, x1, y1); c.stroke();
  c.strokeStyle = K.pal.mid; c.lineWidth = w; c.stroke(); c.strokeStyle = rgba(K.pal.base, .8); c.lineWidth = .7;
  for (let i = 1; i < 12; i++) { const t = i / 12, mt = 1 - t, x = mt * mt * x0 + 2 * mt * t * qx + t * t * x1, y = mt * mt * y0 + 2 * mt * t * qy + t * t * y1, dx = 2 * mt * (qx - x0) + 2 * t * (x1 - qx), dy = 2 * mt * (qy - y0) + 2 * t * (y1 - qy), l = Math.hypot(dx, dy) || 1;
    c.beginPath(); c.moveTo(x - dy / l * w * .5, y + dx / l * w * .5); c.lineTo(x + dy / l * w * .5 + dx / l * 1.2, y - dx / l * w * .5 + dy / l * 1.2); c.stroke(); }
  c.strokeStyle = rgba(K.pal.hi, .5); c.lineWidth = w * .3; c.beginPath(); c.moveTo(x0 - w * .2, y0); c.quadraticCurveTo(qx - w * .2, qy, x1 - w * .2, y1); c.stroke(); }

/* Was hinter Kopf und Körper liegt (lange Haare, Bob-Rückseite, Afro, Dutt, Zopf) */
const BEHIND = {
  lang(K) { const sh = (K.J.shY + 18 - K.cy) / K.b, p = K.poly([[-1.05, -.6], [-1.3, .3], [-1.35, sh * .8], [-1.15, sh], [1.15, sh], [1.35, sh * .8], [1.3, .3], [1.05, -.6], [0, -1.12]]); K.fill(p);
    K.band([[-1.0, -.6], [-.5, -1.0], [0, -1.12], [.5, -1.0], [1.0, -.6]], [[-1.3, sh * .85], [-.6, sh * 1.02], [0, sh * .98], [.6, sh * 1.02], [1.3, sh * .85]], 40, 4, .05, { tipJ: .2 }); },
  bob(K) { const p = K.poly([[-1.12, -.4], [-1.25, .5], [-1.18, 1.1], [1.18, 1.1], [1.25, .5], [1.12, -.4], [0, -1.15]]); K.fill(p);
    K.band([[-1.1, -.4], [0, -1.12], [1.1, -.4]], [[-1.2, 1.1], [0, 1.1], [1.2, 1.1]], 30, 4, .06, { tipJ: .01 }); },
  afro(K) { const c = K.c; c.fillStyle = K.pal.base; c.beginPath(); c.ellipse(K.cx, K.cy - K.b * .2, K.a * 1.6, K.b * 1.48, 0, 0, TAU); c.fill();
    const R2 = rng(77); for (let i = 0; i < 70; i++) { const ang = i * 2.39996, rr = Math.sqrt((i + .5) / 70) * 1.42; const u = Math.cos(ang) * rr, v = -.2 + Math.sin(ang) * rr * .92; K.curl(u, v, .15 + R2() * .05, (u * -.6 + v * -.8) > .6 ? K.pal.lite : i % 3 ? K.pal.mid : K.pal.dark); }
    for (let i = 0; i < 40; i++) { const t = i / 40 * TAU; K.curl(Math.cos(t) * 1.5, -.2 + Math.sin(t) * 1.38, .14, i % 2 ? K.pal.mid : K.pal.dark); } },
  dutt(K) { const c = K.c, x = K.cx, y = K.Y(-1.28), r = K.a * .42; c.fillStyle = K.pal.base; c.beginPath(); c.arc(x, y, r * 1.1, 0, TAU); c.fill();
    for (let i = 0; i < 18; i++) { const a0 = i / 18 * TAU; sliver(c, x + Math.cos(a0) * r * .2, y + Math.sin(a0) * r * .2, x + Math.cos(a0 + .9) * r * .9, y + Math.sin(a0 + .9) * r * .9, x + Math.cos(a0 + 1.9) * r * .95, y + Math.sin(a0 + 1.9) * r * .95, 3, (Math.cos(a0 + 1.4) * -.6 + Math.sin(a0 + 1.4) * -.8) > .2 ? K.pal.lite : K.pal.mid); }
    c.fillStyle = '#26262a'; c.beginPath(); c.ellipse(x, y + r * .95, r * .55, r * .2, 0, 0, TAU); c.fill(); },
  pferde(K) { const sh = (K.J.shY + 16 - K.cy) / K.b, p = K.poly([[.55, -.7], [.95, -.4], [1.18, .3], [1.12, sh], [.92, sh * .95], [.85, .3], [.6, -.35]]); K.fill(p);
    K.band([[.6, -.65], [.9, -.4]], [[.92, sh * .95], [1.12, sh]], 16, 3.2, .1, { tipJ: .1 }); },
  zopf(K) { const sh = (K.J.shY + 22 - K.cy) / K.b; K.chain([[.75, -.55], [1.05, .1], [1.12, sh * .5], [1.05, sh]], K.a * .2, K.a * .26); },
  dreads(K) { const sh = (K.J.shY + 14 - K.cy) / K.b; for (let i = 0; i < 9; i++) { const u = -.9 + i * .225; dread(K, u, -.9, u * 1.35, sh * (.9 + (i % 3) * .06), 3); } }
};

/* Rückansicht (Spiegel): Haare decken den Hinterkopf bis zum Nacken */
function backView(K, st) {
  const shaved = ['undercut', 'iro', 'fade', 'flattop', 'cornrows', 'buzz'].includes(st);
  if (st === 'glatze') { glow(K.c, K.X(.3), K.Y(-.7), K.a * .5, '#ffffff', .35); return; }
  if (st === 'kranz') { const p = K.poly([[-1.06, -.35], [-1.0, .45], [0, .62], [1.0, .45], [1.06, -.35], [.7, -.1], [0, 0], [-.7, -.1]]); K.fill(p); K.band([[-1, -.3], [0, -.05], [1, -.3]], [[-1, .45], [0, .62], [1, .45]], 22, 3, .05); return; }
  const nape = [[-1.02, .25], [-.75, .55], [-.3, .66], [0, .68], [.3, .66], [.75, .55], [1.02, .25]];
  const cap = K.capPoly(nape, shaved ? .03 : .14, Math.PI - .25, TAU + .25);
  if (shaved) { K.stubble(cap, 420, st === 'buzz' ? .6 : .3); if (st === 'cornrows') for (let k = -3; k <= 3; k++) K.chain([[k * .18, -1.08], [k * .26, -.4], [k * .3, .55]], 2.6, 3.4); }
  else { K.fill(cap); K.band([[-.5, -1.05], [0, -1.12], [.5, -1.05]], nape, 50, 3.4, .18, { tipJ: .07 }); }
  if (['undercut', 'fade', 'flattop', 'iro'].includes(st)) { const top = st === 'iro' ? K.poly([[-.25, -.7], [-.3, -1.1], [0, -1.6], [.3, -1.1], [.25, -.7]]) : K.poly([[-.86, -.55], [-.92, -.95], [-.5, -1.2], [.5, -1.2], [.92, -.95], [.86, -.55], [0, -.62]]);
    K.fill(top); K.band([[-.8, -.6], [0, -.66], [.8, -.6]], [[-.85, -.95], [0, -1.18], [.85, -.95]], 26, 3, .12, { tipJ: .03 }); }
  if (st === 'lang' || st === 'dreads') { const sh = (K.J.shY + 18 - K.cy) / K.b; const p = K.poly([[-1.05, -.2], [-1.25, sh], [1.25, sh], [1.05, -.2]]); K.fill(p);
    if (st === 'lang') K.band([[-1, -.3], [0, .2], [1, -.3]], [[-1.2, sh], [0, sh * 1.03], [1.2, sh]], 40, 4, .04, { tipJ: .18 }); else for (let i = 0; i < 10; i++) { const u = -.9 + i * .2; dread(K, u, -.3, u * 1.25, sh, 3); } }
  if (st === 'bob') { const p = K.poly([[-1.15, -.3], [-1.2, 1.05], [1.2, 1.05], [1.15, -.3]]); K.fill(p); K.band([[-1.1, -.3], [0, 0], [1.1, -.3]], [[-1.2, 1.05], [0, 1.05], [1.2, 1.05]], 30, 4, .03, { tipJ: .01 }); }
  if (st === 'pferde') { const sh = (K.J.shY + 20 - K.cy) / K.b; K.fill(K.poly([[-.18, .2], [-.3, sh * .7], [0, sh], [.3, sh * .7], [.18, .2]])); K.band([[-.15, .2], [.15, .2]], [[-.2, sh * .9], [.2, sh * .9]], 14, 3.2, .1, { tipJ: .1 }); K.link(K.cx, K.Y(.18), 0, 3.5); }
  if (st === 'zopf') { const sh = (K.J.shY + 26 - K.cy) / K.b; K.chain([[0, .15], [0, sh * .5], [0, sh]], K.a * .2, K.a * .26); }
  if (st === 'dutt') BEHIND.dutt(K);
  if (st === 'afro') { BEHIND.afro(K); }
  if (st === 'locken') for (let t = Math.PI - .3; t <= TAU + .3; t += .22) K.curl(Math.cos(t) * 1.1, Math.sin(t) * 1.1, .2);
  if (st === 'stachel') { const t = []; for (let i = 0; i < 13; i++) { const ang = Math.PI + .25 + i / 12 * (Math.PI - .5); t.push([Math.cos(ang) * .8, Math.sin(ang) * .8, Math.cos(ang) * 1.4, Math.sin(ang) * 1.4, 0]); } K.tufts(t, 6); }
  K.sheen(cap, -1.15, .7);
}

const SIDEB = ['kurz', 'topf', 'mittel', 'seiten', 'wuschel', 'stachel', 'tolle', 'locken', 'zurueck', 'pferde', 'zopf', 'kranz'];
/* Einstieg: ersetzt das alte drawHair */
F.hair = function (c, H, L, D, J, back, which) {
  const st = L.hair || 'kurz'; const K = makeCtx(c, H, L, D, J, st, back);
  c.save(); c.lineJoin = 'round';
  if (which === 'back') { if (back) { if (st === 'afro') BEHIND.afro(K); } else if (BEHIND[st]) BEHIND[st](K); c.restore(); return; }
  if (back) backView(K, st); else { if (FRONT[st]) FRONT[st](K); else FRONT.kurz(K);
    if (SIDEB.includes(st)) [-1, 1].forEach(s => { for (let i = 0; i < 4; i++) { const u0 = s * (.93 + i * .015), x0 = K.X(u0), y0 = K.Y(-.2 + i * .03); sliver(c, x0, y0, K.X(s * (.95 + i * .01)), K.Y(.08), K.X(s * (.9 + i * .02)), K.Y(.36 - i * .02), 2.2, i ? K.pal.mid : K.pal.base); } }); }
  c.restore();
};
})(window.MK);
