/* Muskelklicker – Seitenansicht, leicht schräg von vorne oben.
   Für alles, was man im Liegen oder auf dem Boden macht: Bankdrücken, Crunches, Plank, Liegestütze.
   Gleiche Bauweise wie die Frontfigur: Glieder mit Muskelprofil, verschmolzene Silhouette, nur außen eine feine Kontur.
   Die abgewandte Körperseite (hinterer Arm, hinteres Bein) liegt eine Ebene dahinter und ist etwas dunkler. */
window.MK = window.MK || {};
(function (MK) {
const Fig = MK.Fig, hp = Fig._h;
const { limb, smoothClosed, ellP, circP, inkFill, curve, line, glow, fd, mix, rgba, lerp, clamp, P, mid, TAU, canv, OX, OY, BW, BH, TINK } = hp;
const add = (a, b) => P(a.x + b.x, a.y + b.y), sub = (a, b) => P(a.x - b.x, a.y - b.y), mul = (a, k) => P(a.x * k, a.y * k);
const len = a => Math.hypot(a.x, a.y), nrm = a => { const l = len(a) || 1; return P(a.x / l, a.y / l); }, dot = (a, b) => a.x * b.x + a.y * b.y;
const rot = (a, r) => P(a.x * Math.cos(r) - a.y * Math.sin(r), a.x * Math.sin(r) + a.y * Math.cos(r));
const sideOf = (A, B, d) => { const dx = B.x - A.x, dy = B.y - A.y, l = Math.hypot(dx, dy) || 1; return ((-dy / l) * d.x + (dx / l) * d.y) >= 0 ? 1 : -1; };
const ZV = Fig.ZV = P(.12, -.3); // Tiefenrichtung: weiter hinten = etwas höher und weiter rechts

/* Gelenk in der Mitte (Ellbogen/Knie) mit bevorzugter Knickrichtung */
function ik2(A, T, L1, L2, pref) {
  const d = sub(T, A), dl = clamp(len(d), Math.abs(L1 - L2) + 1, L1 + L2 - .4), u = nrm(d), T2 = add(A, mul(u, dl));
  const a = Math.acos(clamp((L1 * L1 + dl * dl - L2 * L2) / (2 * L1 * dl), -1, 1)), b = Math.atan2(u.y, u.x);
  const m1 = P(A.x + Math.cos(b + a) * L1, A.y + Math.sin(b + a) * L1), m2 = P(A.x + Math.cos(b - a) * L1, A.y + Math.sin(b - a) * L1);
  return { m: dot(sub(m1, A), pref) >= dot(sub(m2, A), pref) ? m1 : m2, e: T2 };
}

/* Rumpf im Profil: Abstand der Vorderseite (Brust/Bauch) und Rückseite (Rücken/Po) von der Wirbelachse, t = 0 Hüfte … 1 Schulter */
function offs(D) {
  const f = D.fat, sl = D.slump;
  return {
    F: [[-.16, 4 + D.tR0 * .3], [-.06, Math.max(6 + f * 2, D.tR0 * .8)], [.06, Math.max(7 + f * 7, D.tR0 * .6)], [.25, 7.5 + f * 12 + D.la * 1.5], [.45, 7.5 + f * 6 + D.gB * 1.2], [.6, 9 + D.gB * 6 + f * 2], [.76, 11 + D.gB * 11 + f * 2], [.9, 10.5 + D.gB * 8], [1.0, 8], [1.08, D.neckR * .75]],
    B: [[-.16, 6 + D.gL * 2], [-.06, 9.5 + D.gL * 4.5 + f * 3], [.08, 7.5 + D.gL * 2 + f], [.26, 5.5 + D.gR * 1.5 + f], [.48, 7 + D.gR * 4 + f], [.68, 8.5 + D.gR * 5 + sl * 1.5], [.86, 9 + D.gR * 3 + D.gN * 3 + sl * 3], [1.0, 8 + D.gN * 3.5 + sl * 2], [1.08, D.neckR * .85]]
  };
}
const at = (K, t) => { if (t <= K[0][0]) return K[0][1]; for (let i = 1; i < K.length; i++) if (t <= K[i][0]) { const [t0, v0] = K[i - 1], [t1, v1] = K[i]; return lerp(v0, v1, (t - t0) / (t1 - t0)); } return K[K.length - 1][1]; };
const torsoLen = D => D.torso * .84 - D.slump * 3;

/* ---------- Skelett ---------- */
Fig.sideJ = function (D, sp) {
  const H = sp.hip, Lt = torsoLen(D);
  const u = sp.S ? nrm(sub(sp.S, H)) : P(Math.cos(sp.ang), Math.sin(sp.ang));
  const S = add(H, mul(u, Lt)), n = mul(P(-u.y, u.x), sp.front || 1), ax = t => add(H, mul(u, t * Lt));
  const tilt = sp.headTilt || 0, sb = D.headRx / 17.5;
  let hc = add(add(S, mul(u, D.neckL + D.headRy * .82)), mul(n, 1.5 + D.slump * 3)); hc = add(S, rot(sub(hc, S), tilt));
  if (sp.rest != null) { const back = add(hc, mul(rot(n, tilt), -17.5 * sb)); if (back.y > sp.rest) hc = add(hc, P(0, sp.rest - back.y)); }
  const Sj = add(S, mul(u, -7)), dS = D.shH * .9, dH = D.hipH * .95;
  const arm = (d, spec) => { const sh = add(Sj, mul(ZV, d * dS)), T = add(spec.hand, mul(ZV, d * (spec.grip != null ? spec.grip : dS))), uz = spec.uz || 0;
    const r = ik2(sh, T, D.U * (1 - uz * .55), D.F, spec.pref || n); return { S: sh, E: add(r.m, mul(ZV, d * D.U * uz * .35)), Hd: r.e }; };
  const leg = (d, spec) => { const hpos = add(H, mul(ZV, d * dH)), A = add(spec.ankle, mul(ZV, d * dH * (spec.spread || 1))); const r = ik2(hpos, A, D.thigh, D.shin, spec.pref || P(0, -1)); return { H: hpos, K: r.m, A: r.e, toe: nrm(spec.toe || P(1, 0)) }; };
  const A = sp.arms || {}, Lg = sp.legs || {};
  return { H, S, Sj, u, n, Lt, ax, kind: sp.kind, head: { c: hc, u: rot(u, tilt), n: rot(n, tilt) },
    arm: { n: arm(-1, A.n), f: arm(1, A.f || A.n) }, leg: { n: leg(-1, Lg.n), f: leg(1, Lg.f || Lg.n) } };
};

/* ---------- Posen ---------- */
const PO = Fig.poses;
const backAt = (D, t) => at(offs(D).B, t), frontAt = (D, t) => at(offs(D).F, t);
const face = t => t > .4 ? 'strain' : 'focus';
// Bankdrücken: Rücken auf der Bank, Füße fest auf dem Boden, Stange über der Brust. t = 0 Arme gestreckt, 1 Stange an der Brust
PO.benchLie = (t, ph, D) => {
  const pad = -60, hy = pad - backAt(D, -.06) * .9, Lt = torsoLen(D), sy = pad - backAt(D, .8) * .93;
  const hip = P(48, hy), S = P(hip.x - Math.sqrt(Math.max(1, Lt * Lt - (sy - hy) ** 2)), sy);
  const chest = S.y - frontAt(D, .8) - 3, top = P(S.x + 12, S.y - 8 - (D.U + D.F) * .94), bot = P(S.x + 15, Math.min(chest - 6, S.y + 7 - D.F * .9));
  const hand = P(lerp(top.x, bot.x, t), lerp(top.y, bot.y, t)), pref = P(.55, 1), grip = D.shH + 13, uz = t * .8;
  return { side: { kind: 'bench', hip, S, front: 1, rest: pad, headTilt: -.05, arms: { n: { hand, pref, grip, uz }, f: { hand, pref, grip, uz } },
    legs: { n: { ankle: P(hip.x + 68, -9), toe: P(1, .04), pref: P(.25, -1) }, f: { ankle: P(hip.x + 72, -9), toe: P(1, .04), pref: P(.25, -1), spread: 1.4 } } },
    props: [{ k: 'sbench' }, { k: 'sbar' }], face: face(t), look: { x: 0, y: -1 } };
};
PO.flyLie = PO.benchLie;
// Crunches: auf der Matte, Knie angewinkelt, Hände am Hinterkopf, Oberkörper rollt ein
PO.crunchLie = (t, ph, D) => {
  const mat = -6, hip = P(34, mat - backAt(D, -.06) * .88), a = t * .62, u = P(-Math.cos(a), -Math.sin(a)), n = P(-u.y, u.x);
  const S = add(hip, mul(u, torsoLen(D))), hc = add(add(S, mul(u, D.neckL + D.headRy * .82)), mul(n, 1.5));
  const hand = add(add(hc, mul(n, -D.headRx * .7)), mul(u, -3)), pref = add(n, mul(u, -.5));
  return { side: { kind: 'crunch', hip, ang: Math.atan2(u.y, u.x), front: 1, rest: mat, headTilt: t * .25, arms: { n: { hand, pref, grip: D.headRx * .85 }, f: { hand, pref, grip: D.headRx * .85 } },
    legs: { n: { ankle: P(hip.x + 76, -11), toe: P(1, .05), pref: P(0, -1) }, f: { ankle: P(hip.x + 79, -11), toe: P(1, .05), pref: P(0, -1), spread: 1.6 } } },
    armsBehind: true, props: [{ k: 'smat' }], face: face(t), look: { x: 0, y: -1 } };
};
// Plank: Unterarme auf der Matte, Körper eine Linie. x.shake = Zittern, wenn man lange hält
function lineBody(D, Sj, fl, hipLift) {
  const Lt = torsoLen(D), A = P(Sj.x + 7 + Lt + D.thigh + D.shin - 4, fl - 11), u = nrm(sub(Sj, A)), S = add(Sj, mul(u, 7));
  let hip = sub(S, mul(u, Lt)); if (hipLift) hip = add(hip, P(0, -hipLift));
  return { S, hip, A };
}
PO.plank = (t, ph, D, x) => { // x.down: 0 = Plank halten, 1 = flach auf dem Boden liegen (wenn man nicht tippt)
  const fl = -6, dn = clamp((x && x.down) || 0, 0, 1), sh = ((x && x.shake) || 0) * (1 - dn), jit = sh ? Math.sin(performance.now() / 1000 * 41) * sh * 1.6 : 0;
  const E = P(-62, fl - D.fR0 - .5), up = P(E.x + 3, E.y - D.U + 3 + jit), low = P(E.x + 3 + D.U * .35, fl - 9 - D.gB * 4 - D.fat * 7);
  const Sj = P(lerp(up.x, low.x, dn), lerp(up.y, low.y, dn)), b = lineBody(D, Sj, fl, (t * 7) * (1 - dn));
  const hUp = P(E.x - D.F + 5, fl - D.handR * .8), hDn = P(Sj.x - (D.U + D.F) * .86, fl - D.handR * .8), hand = P(lerp(hUp.x, hDn.x, dn), lerp(hUp.y, hDn.y, dn)), pref = dn > .5 ? P(0, -1) : P(.3, 1);
  return { side: { kind: 'plank', hip: b.hip, S: b.S, front: -1, headTilt: .14, arms: { n: { hand, pref, grip: D.shH * .75 }, f: { hand, pref, grip: D.shH * .75 } },
    legs: { n: { ankle: b.A, toe: P(.3, 1), pref: P(0, 1) }, f: { ankle: add(b.A, P(2, 0)), toe: P(.3, 1), pref: P(0, 1) } } },
    props: [{ k: 'smat' }], face: dn > .6 ? 'tired' : sh > .4 ? 'strain' : 'focus', look: { x: 0, y: 1 } };
};
// Liegestütze: normal, eng (Hände unter der Brust) oder mit Klatschen (Hände verlassen kurz den Boden)
PO.pushup = (t, ph, D, x) => {
  const v = (x && x.v) || 'normal', fl = -6;
  const air = v === 'klatsch' && ph > .5 ? Math.sin((ph - .5) / .5 * Math.PI) : 0;
  const top = fl - (D.U + D.F) * .93 - D.handR * .5, bot = fl - 25 - D.fat * 8 - D.gB * 4;
  const Sj = P(-56 - t * 16, lerp(top, bot, t) - air * 24), b = lineBody(D, Sj, fl, 0);
  const n = mul(P(-nrm(sub(b.S, b.hip)).y, nrm(sub(b.S, b.hip)).x), -1);
  let hand = P(v === 'eng' ? -50 : -54, fl - D.handR * .7); if (air) hand = P(lerp(hand.x, Sj.x + 6, air * .8), lerp(hand.y, Sj.y + 30, air * .8));
  const pref = v === 'eng' ? P(.8, -1) : P(.55, -1), grip = v === 'eng' ? 4 : D.shH + 9, uz = v === 'eng' ? 0 : t * .4;
  return { side: { kind: 'push', hip: b.hip, S: b.S, front: -1, headTilt: .1, arms: { n: { hand, pref, grip, uz }, f: { hand, pref, grip, uz } },
    legs: { n: { ankle: b.A, toe: P(.3, 1), pref: n }, f: { ankle: add(b.A, P(2, 0)), toe: P(.3, 1), pref: n } } },
    props: [{ k: 'smat' }], face: face(t), look: { x: 0, y: 1 }, air };
};
PO.pushupEng = (t, ph, D, x) => PO.pushup(t, ph, D, Object.assign({}, x, { v: 'eng' }));
PO.pushupClap = (t, ph, D, x) => PO.pushup(t, ph, D, Object.assign({}, x, { v: 'klatsch' }));

/* ---------- Geometrie ---------- */
function torsoPath(J, O, iF, iB, t0, t1) {
  const pts = [], N = 14, st = (t1 - t0) / N;
  for (let i = 0; i <= N; i++) { const t = t0 + i * st, a = J.ax(t), b = at(O.B, t) + (typeof iB === 'function' ? iB(t) : iB); pts.push([a.x - J.n.x * b, a.y - J.n.y * b]); }
  const cut = (t, k) => { const a = J.ax(t), b = at(O.B, t) + (typeof iB === 'function' ? iB(t) : iB), f = at(O.F, t) + (typeof iF === 'function' ? iF(t) : iF); for (let j = 1; j <= 3; j++) { const w = k ? j / 4 : 1 - j / 4, o = lerp(-b, f, w); pts.push([a.x + J.n.x * o, a.y + J.n.y * o]); } };
  cut(t1, 1);
  for (let i = N; i >= 0; i--) { const t = t0 + i * st, a = J.ax(t), f = at(O.F, t) + (typeof iF === 'function' ? iF(t) : iF); pts.push([a.x + J.n.x * f, a.y + J.n.y * f]); }
  cut(t0, 0);
  return smoothClosed(pts);
}
// Kopf im Profil (a = Richtung Scheitel, b = Richtung Gesicht)
const HEAD = [[0, -17.5], [9, -16.5], [17, -11], [20.5, -2], [19, 7], [14.5, 13], [10.5, 15], [8, 14.6], [6, 16.2], [3, 19.2], [1.2, 17.4], [0, 16.4], [-2.5, 16.8], [-4.2, 16], [-6, 15.4], [-9, 15.8], [-13, 13.4], [-14.4, 9], [-13.2, 4], [-10.5, -1], [-8, -10], [-4.5, -15.5]];
function headW(D, Hh) { const sa = D.headRy / 20.5, sb = D.headRx / 17.5; return (a, b) => add(add(Hh.c, mul(Hh.u, a * sa)), mul(Hh.n, b * sb)); }
function headPath(D, Hh) { const W = headW(D, Hh), f = D.fat; return smoothClosed(HEAD.map(([a, b]) => { if (a < -8 && b > 0) b += f * 2.5; if (a < -12 && b > 5) a -= f * 1.5; const p = W(a, b); return [p.x, p.y]; })); }

function legGeo(D, J, lg, L) {
  const { H, K, A, toe } = lg, th = sub(K, H), sh = sub(A, K);
  const straight = Math.abs(th.x * sh.y - th.y * sh.x) / ((len(th) * len(sh)) || 1) < .18;
  const qs = straight ? sideOf(H, K, toe) : -sideOf(H, K, sh), cs = -sideOf(K, A, toe);
  const thigh = limb(H, K, D.tR0 * .72, D.tR1, [{ t: .42, a: D.quad, w: .3, side: qs }, { t: .55, a: D.add * .7 + 1.5, w: .28, side: -qs }, { t: .82, a: D.vmo * .6, w: .14, side: qs }]);
  const calf = limb(K, add(A, mul(nrm(sub(K, A)), 2)), D.cR0, D.cR1, [{ t: .3, a: D.calf, w: .22, side: cs }, { t: .25, a: D.calf * .3, w: .2, side: -cs }]);
  const c1 = P(toe.y, -toe.x), upv = dot(c1, sub(K, A)) > 0 ? c1 : mul(c1, -1), B0 = add(A, mul(upv, -7)), FW = (a, b) => add(add(B0, mul(toe, a)), mul(upv, b));
  const paths = [thigh.path, calf.path, circP(K.x, K.y, D.tR1 * .98), circP(A.x, A.y, D.cR1 + .3)];
  if (!L.shoes) paths.push(smoothClosed([FW(-7, 1), FW(18, .5), FW(22, 2.6), FW(17, 5.5), FW(6, 8.5), FW(-3, 9), FW(-8, 5)].map(p => [p.x, p.y])));
  return { H, K, A, toe, thigh, calf, qs, cs, FW, paths };
}
function armGeo(D, J, ar) {
  const { S, E, Hd } = ar, up = sub(E, S), fo = sub(Hd, E);
  const bend = clamp(Math.acos(clamp(dot(nrm(up), nrm(fo)), -1, 1)) / 2.4, 0, 1);
  const bs = bend < .14 ? sideOf(S, E, J.u) : sideOf(S, E, fo);
  const upper = limb(S, E, D.uR0, D.uR1, [{ t: .06, a: D.delt * .55, w: .16, side: 0 }, { t: .55 + .06 * bend, a: D.bi * (.62 + .55 * bend), w: .22, side: bs }, { t: .36, a: D.tri * (1 - .2 * bend), w: .24, side: -bs }, { t: .52, a: D.bi * (.22 + .25 * bend), w: .26, side: -bs }]);
  const si = sideOf(E, Hd, sub(S, E)) || 1;
  const fore = limb(E, Hd, D.fR0, D.fR1, [{ t: .22, a: D.brach, w: .24, side: -si }, { t: .3, a: D.brach * .6, w: .22, side: si }]);
  const ua = nrm(up), dc = add(S, mul(ua, D.delt * .3 + 2)), drx = D.delt * .6 + 4, dry = Math.max(D.uR0 * .9, D.uR0 * .45 + D.delt * .4 + 2);
  const delt = ellP(dc.x, dc.y, drx, dry, Math.atan2(ua.y, ua.x));
  const f2 = nrm(fo), hd = add(Hd, mul(f2, D.handR * .45)), hand = ellP(hd.x, hd.y, D.handR * 1.1, D.handR * .86, Math.atan2(f2.y, f2.x));
  return { S, E, Hd, hd, upper, fore, bs, si, bend, dc, ua, drx, dry, f2, paths: [upper.path, fore.path, circP(E.x, E.y, D.fR0 * .95), delt, hand] };
}
function geoSide(D, J, L) {
  const G = { far: [], body: [], arm: [], O: offs(D) };
  G.torso = torsoPath(J, G.O, 0, 0, -.16, 1.08); G.body.push(G.torso);
  const hb = add(J.head.c, mul(J.head.u, -D.headRy * .5));
  G.neck = limb(add(J.S, mul(J.n, -1)), add(hb, mul(J.head.n, -2.5)), D.neckR + 1, D.neckR * .92, []); G.body.push(G.neck.path);
  G.head = headPath(D, J.head); G.body.push(G.head);
  G.legN = legGeo(D, J, J.leg.n, L); G.legF = legGeo(D, J, J.leg.f, L);
  G.body.push(...G.legN.paths); G.far.push(...G.legF.paths);
  G.armN = armGeo(D, J, J.arm.n); G.armF = armGeo(D, J, J.arm.f);
  G.arm.push(...G.armN.paths); G.far.push(...G.armF.paths);
  // Kleidung gehört zur Silhouette (weites Lauch-Shirt, Shorts)
  const T = L.top, la = D.la;
  G.st = T && (T.cut === 'tee' || T.cut === 'long') ? Fig.stretchOf(D, T) : 0;
  if (T && T.cut !== 'none') {
    const baggy = la > .12 && (T.cut === 'tee' || T.cut === 'long'), t0 = (T.cut === 'bra' ? .55 : -.03 + G.st * .05) - (baggy ? la * .06 : 0);
    const iF = t => (T.tight ? .4 : 1.3) + (baggy ? la * 5 * clamp((1.02 - t) * 2, 0, 1) : 0), iB = t => (T.tight ? .4 : 1.2) + (baggy ? la * 2.5 : 0);
    G.shirt = torsoPath(J, G.O, iF, iB, t0, T.cut === 'bra' ? .95 : 1.03); G.body.push(G.shirt);
  }
  { const sp = [torsoPath(J, G.O, t => t > 0 ? 1 : 2, t => t > 0 ? .8 : 2, -.19, .07)]; [['legN', 'body'], ['legF', 'far']].forEach(([k, dst]) => { const lg = G[k], th = lg.thigh, pts = []; for (let i = 0; i <= 8; i++) { const q = th.at(i / 8 * .47, 1, -1.6); pts.push([q.x, q.y]); } for (let i = 8; i >= 0; i--) { const q = th.at(i / 8 * .47, -1, -1.6); pts.push([q.x, q.y]); } const p = smoothClosed(pts); G[k].shorts = p; G[k].hem = [lg.thigh.at(.47, 1, -1.6), lg.thigh.at(.47, -1, -1.6)]; G[dst].push(p); });
    G.shorts = sp[0]; G.body.push(sp[0]); }
  return G;
}

/* ---------- Schattierung ---------- */
function topLight(c, J) { const g = c.createLinearGradient(0, J.S.y - 150, 0, 4); g.addColorStop(0, 'rgba(255,255,255,.16)'); g.addColorStop(.55, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(40,15,5,.22)'); c.fillStyle = g; c.fillRect(-220, -480, 440, 520); }
function torsoShade(c, D, J, G, shd) {
  const O = G.O, Fp = (t, ins) => add(J.ax(t), mul(J.n, at(O.F, t) - (ins || 0))), Bp = (t, ins) => sub(J.ax(t), mul(J.n, at(O.B, t) - (ins || 0)));
  // Brust: Unterkante und Licht
  const pA = .1 + .4 * D.gB;
  curve(c, Fp(.63, .5), mid(Fp(.66, 4 + D.gB * 5), J.ax(.7), .3), Fp(.86, 3 + D.gB * 8), 1.4 + 1.4 * D.gB, shd, pA);
  glow(c, Fp(.8, 4 + D.gB * 4).x, Fp(.8, 4 + D.gB * 4).y, 8 + D.gB * 6, '#ffffff', .06 + .14 * D.gB);
  // Bauchmuskeln an der Vorderkante – nur mit wenig Körperfett
  const ab = D.gC * (.25 + .75 * D.def);
  for (let i = 0; i < 4; i++) { const t = .2 + i * .1, ra = ab * fd(ab, .04 + i * .14, .2 + i * .16); if (ra > .02) curve(c, Fp(t, .2), Fp(t + .02, 3), Fp(t + .01, 6), 1.3, shd, ra * .5); }
  // Sägemuskel, Lat, Rückenstrecker, Po
  for (let i = 0; i < 3; i++) { const a2 = fd(D.gB + D.gR, .35 + i * .15, .55 + i * .15) * .35 * (.3 + .7 * D.def), t = .66 - i * .05; curve(c, mid(Fp(t), Bp(t), .3), mid(Fp(t - .03), Bp(t - .03), .45), mid(Fp(t - .05), Bp(t - .05), .55), 1.2, shd, a2); }
  curve(c, Bp(.8, 2), Bp(.6, 4 + D.gR * 3), Bp(.36, 2.5), 2 + 1.5 * D.gR, shd, .06 + .3 * D.gR);
  curve(c, Bp(.32, 2), Bp(.18, 3), Bp(.05, 2), 2, shd, fd(D.gR, .25, .6) * .25);
  glow(c, Bp(-.06, 4).x, Bp(-.06, 4).y, 8 + D.gL * 3, '#ffffff', .05 + .1 * D.gL);
  curve(c, Bp(.08, 1), mid(Bp(-.02, 3), J.ax(-.02), .4), Bp(-.15, 1), 1.4, shd, .1 + .15 * D.gL);
  if (D.gB < .18) for (let i = 0; i < 3; i++) curve(c, Fp(.56 + i * .04, .3), mid(Fp(.55 + i * .04), Bp(.55 + i * .04), .25), mid(Fp(.53 + i * .04), Bp(.53 + i * .04), .45), 1.1, shd, (.18 - D.gB) * 1.2);
  if (D.belly > 2) curve(c, Fp(.08, .5), Fp(.18, 3), Fp(.32, .5), 1.8, shd, clamp((D.belly - 2) / 5, 0, .3));
  // Schlüsselbein und Hals
  curve(c, Fp(.98, 1), mid(Fp(.98), Bp(.98), .3), mid(Fp(1), Bp(1), .55), 1.2, shd, .2);
  curve(c, add(J.S, mul(J.n, D.neckR * .5)), mid(J.S, J.head.c, .45), add(mid(J.S, J.head.c, .8), mul(J.head.n, D.neckR * .3)), 1.2, shd, .06 + .2 * D.gN);
}
function legShade(c, D, lg, shd) {
  const th = lg.thigh, ca = lg.calf, o = lg.qs, o2 = lg.cs;
  curve(c, th.at(.12, o, 3), th.at(.45, o, 5 + D.quad * .4), th.at(.82, o, 3), 1.4 + D.gL, shd, .06 + .35 * D.gL);
  glow(c, th.at(.42, o, D.quad * .6 + 4).x, th.at(.42, o, D.quad * .6 + 4).y, D.tR0 * .7, '#ffffff', .06 + .12 * D.gL);
  curve(c, th.at(.25, -o, 2), th.at(.55, -o, D.add * .4 + 3), th.at(.85, -o, 2), 1.2, shd, .05 + .25 * D.gL);
  curve(c, th.axis(.15), th.axis(.5), mid(th.axis(.85), th.at(.85, o, 2), .5), 1.1, shd, fd(D.gL, .4, .8) * .25);
  curve(c, ca.at(.08, o2, 2), ca.at(.3, o2, D.calf * .5 + 2), ca.at(.58, o2, 1), 1.2 + D.gL, shd, .06 + .35 * D.gL);
  glow(c, ca.at(.28, o2, D.calf * .5 + 2).x, ca.at(.28, o2, D.calf * .5 + 2).y, D.cR0 + D.calf * .5, '#ffffff', .05 + .12 * D.gL);
  curve(c, ca.axis(.1), ca.axis(.3), ca.axis(.5), 1, shd, fd(D.gL, .45, .8) * .22);
  const kp = th.at(.97, o, 1); glow(c, kp.x, kp.y, D.tR1 * .8, '#ffffff', .12);
}
function armShade(c, D, a, shd) {
  const up = a.upper, fo = a.fore, bs = a.bs, si = a.si;
  glow(c, a.dc.x, a.dc.y - 2, a.drx * .8, '#ffffff', .08 + .2 * D.gS);
  c.strokeStyle = rgba(shd, .08 + .38 * D.gS); c.lineWidth = 1.4 + D.gS; c.beginPath(); c.ellipse(a.dc.x, a.dc.y, a.drx, a.dry, Math.atan2(a.ua.y, a.ua.x), -1.1, 1.1); c.stroke();
  const pk = up.at(.55 + .05 * a.bend, bs, D.bi * .55 + 1.5); glow(c, pk.x, pk.y, D.bi * .9 + 3.5, '#ffffff', .07 + .22 * D.gA);
  curve(c, up.at(.7, bs, 0), up.at(.86, bs, D.bi * .25 + 1), mid(up.axis(.98), up.at(.98, bs, 0), .4), 1.3 + D.gA, shd, .08 + .4 * D.gA);
  curve(c, up.at(.2, -bs, 2), up.at(.42, -bs, D.tri * .7 + 2), up.at(.72, -bs, 1.5), 1.2 + .8 * D.gA, shd, .06 + .3 * D.gA);
  curve(c, up.at(.3, -bs, D.tri * .35 + 1), up.at(.5, -bs, D.tri * .45 + 1.5), up.at(.62, -bs, 1), .9, shd, fd(D.gA, .32, .6) * .26);
  glow(c, fo.at(.24, -si, D.brach * .5 + 2).x, fo.at(.24, -si, D.brach * .5 + 2).y, D.fR0 + 2, '#ffffff', .06 + .15 * D.gA);
  curve(c, fo.at(.06, -si, 2), fo.at(.3, -si, D.brach * .6 + 2), fo.at(.62, -si, 1.5), 1.2, shd, .05 + .28 * D.gA);
  const vA = D.gA + D.pmA * .35;
  glow(c, a.E.x, a.E.y, D.fR0, shd, .1); glow(c, a.hd.x - 1.5, a.hd.y - 1.5, D.handR, '#ffffff', .12);
  for (let i = -1; i <= 1; i++) { const nn = P(-a.f2.y, a.f2.x), o = mul(nn, i * D.handR * .42), p1 = add(add(a.hd, o), mul(a.f2, D.handR * .15)), p2 = add(add(a.hd, o), mul(a.f2, D.handR * .6)); line(c, p1.x, p1.y, p2.x, p2.y, 1, shd, .35); }
}

/* ---------- Kleidung ---------- */
function shirtFill(c, D, J, G, L, o) {
  const T = L.top; if (!G.shirt) return;
  const col = T.val, dk = mix(col, '#000000', .45);
  c.fillStyle = T.pat === 'camo' ? hp.camo(c) : col; c.fill(G.shirt);
  c.save(); c.clip(G.shirt);
  const g = c.createLinearGradient(0, J.S.y - 40, 0, J.H.y + 40); g.addColorStop(0, 'rgba(255,255,255,.14)'); g.addColorStop(1, 'rgba(0,0,0,.2)'); c.fillStyle = g; c.fillRect(-220, -480, 440, 520);
  const O = G.O, Fp = (t, ins) => add(J.ax(t), mul(J.n, at(O.F, t) + 1 - (ins || 0))), Bp = (t, ins) => sub(J.ax(t), mul(J.n, at(O.B, t) + 1 - (ins || 0)));
  if (T.tight || G.st > .2) curve(c, Fp(.63, .5), mid(Fp(.66, 4 + D.gB * 5), J.ax(.7), .3), Fp(.86, 3 + D.gB * 8), 1.6, '#000000', .1 + .1 * D.gB);
  // Falten am Lauch-Shirt, Zugfalten bei engem Shirt
  if (D.la > .12) for (let i = 0; i < 3; i++) curve(c, Fp(.05 + i * .12, -2), mid(Fp(.1 + i * .12), J.ax(.1 + i * .12), .4), mid(Fp(.16 + i * .12), Bp(.16 + i * .12), .5), 1.2, '#000000', .12 * D.la);
  if (G.st > .1) for (let i = 0; i < 3; i++) curve(c, mid(Fp(.92), Bp(.92), .5), mid(Fp(.86 - i * .06), J.ax(.86 - i * .06), .5), Fp(.82 - i * .08, 1), 1, '#000000', Math.min(.2, .05 + G.st * .12));
  // Schweiß: Achsel/Kragen → Brustbein → großflächig
  const sw = o.sweat || 0, swc = mix(col, '#000000', .5);
  if (sw > .2) { const p = mid(Fp(.86), Bp(.86), .55); glow(c, p.x, p.y, 6 + sw * 8, swc, Math.min(.38, (sw - .2) * 1.2)); const q = Fp(1.01, 2); glow(c, q.x, q.y, 5 + sw * 4, swc, Math.min(.3, (sw - .2))); }
  if (sw > .4) { c.strokeStyle = rgba(swc, Math.min(.34, (sw - .4) * 1.1)); c.lineWidth = 5 + sw * 6; c.beginPath(); const a1 = Fp(.95, 3), a2 = Fp(.55, 3); c.moveTo(a1.x, a1.y); c.lineTo(a2.x, a2.y); c.stroke(); }
  if (sw > .6) { const p = Bp(.6, 4); glow(c, p.x, p.y, 14 + sw * 8, swc, Math.min(.28, (sw - .6) * 1.1)); }
  if (sw > .82) { c.fillStyle = rgba(swc, (sw - .82) * .7); c.fillRect(-220, -480, 440, 520); }
  c.restore();
  c.strokeStyle = rgba(dk, .8); c.lineWidth = 1.1; c.stroke(G.shirt);
  if (o.sponsor) { const p = mid(Fp(.72, 6), J.ax(.72), .3); c.save(); c.translate(p.x, p.y); c.rotate(Math.atan2(J.u.y, J.u.x) + Math.PI); c.fillStyle = Fig.lum(col) > .55 ? 'rgba(17,17,17,.8)' : 'rgba(255,255,255,.85)'; c.font = '800 6px "Arial Narrow", Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(o.sponsor, 0, 0); c.restore(); }
}
function shortsFill(c, D, G, L, which) {
  const col = L.bottom.val, dk = mix(col, '#000000', .45), fill = L.bottom.pat === 'camo' ? hp.camo(c) : col;
  c.fillStyle = fill; if (which === 'body') { c.fill(G.shorts); c.fill(G.legN.shorts); } else c.fill(G.legF.shorts);
  const h = (which === 'body' ? G.legN : G.legF).hem; line(c, h[0].x, h[0].y, h[1].x, h[1].y, 1.4, dk, .7);
  if (which === 'body') { const a = G.legN.thigh.at(.2, 1, -2), b = G.legN.thigh.at(.2, -1, -2); curve(c, a, mid(a, b), b, 1, dk, .25); }
}
function sleeves(c, D, a, L, G) {
  const T = L.top; if (!T || (T.cut !== 'tee' && T.cut !== 'long')) return;
  const st = G.st || 0, col = T.val, dk = mix(col, '#000000', .45), up = a.upper, ts = T.cut === 'long' ? 1 : .58 - Math.min(1, st) * .13, ex = D.la > .12 ? 2.5 + 2 * D.la : T.tight ? .3 : 1.6 - Math.min(1, st) * 1.7;
  const pts = []; for (let i = 0; i <= 8; i++) { const p = up.at(i / 8 * ts, 1, -ex); pts.push([p.x, p.y]); } for (let i = 8; i >= 0; i--) { const p = up.at(i / 8 * ts, -1, -ex); pts.push([p.x, p.y]); }
  c.fillStyle = T.pat === 'camo' ? hp.camo(c) : col; c.fill(smoothClosed(pts)); c.fill(circP(a.S.x, a.S.y, up.wAt(.04, 1) + ex));
  if (T.cut === 'long') { const fe = .86 - Math.min(1, st) * .22, fp = []; for (let i = 0; i <= 8; i++) { const p = a.fore.at(i / 8 * fe, 1, -1.5); fp.push([p.x, p.y]); } for (let i = 8; i >= 0; i--) { const p = a.fore.at(i / 8 * fe, -1, -1.5); fp.push([p.x, p.y]); } c.fill(smoothClosed(fp)); c.fill(circP(a.E.x, a.E.y, D.fR0 + 1.5)); }
  const h1 = up.at(ts, 1, -ex), h2 = up.at(ts, -1, -ex); if (T.cut !== 'long') line(c, h1.x, h1.y, h2.x, h2.y, 1.3, dk, .8);
  if (st > .15) for (let i = 0; i < 2; i++) curve(c, up.at(ts - .02, a.bs, 1), up.at(ts - .14 - i * .06, a.bs, D.bi * .3 + 1), up.at(ts - .28 - i * .06, -a.bs, 1), .9, '#000000', Math.min(.25, st * .16));
}
function shoe(c, D, lg, L, col) {
  const sh = L.shoes; if (!sh) return; const W = lg.FW;
  const p = smoothClosed([W(-9, 0), W(22, 0), W(25, 2.6), W(23, 6.5), W(12, 8.5), W(6, 12), W(-1, 14.5), W(-8, 12.5), W(-10, 5)].map(q => [q.x, q.y]));
  inkFill(c, [p], col || sh.val, mix(sh.val, '#000000', .55), .9);
  const s0 = W(-9.5, 1.2), s1 = W(24, 1.2); line(c, s0.x, s0.y, s1.x, s1.y, 2.6, sh.acc, .95);
  const l1 = W(8, 9.5), l2 = W(14, 7.5), l3 = W(4, 11), l4 = W(10, 9); line(c, l1.x, l1.y, l2.x, l2.y, 1.2, sh.acc, .9); line(c, l3.x, l3.y, l4.x, l4.y, 1.2, sh.acc, .9);
  const g = W(4, 10); glow(c, g.x, g.y, 6, '#ffffff', .22);
}
function sock(c, D, lg) { if (D.la < .35) return; const ca = lg.calf, top = ca.axis(.55); c.fillStyle = '#f3f1ea'; c.fill(limb(top, lg.A, D.cR0 + 3, D.cR1 + 3, []).path); const a = ca.at(.6, 1, -3.5), b = ca.at(.6, -1, -3.5), a2 = ca.at(.66, 1, -3.5), b2 = ca.at(.66, -1, -3.5); line(c, a.x, a.y, b.x, b.y, 1.6, '#c8402e', .9); line(c, a2.x, a2.y, b2.x, b2.y, 1.6, '#2f5fb3', .9); }
function armTats(c, D, a, L) {
  const T = L.tats || []; if (!T.length) return; const up = a.upper, fo = a.fore;
  if (T.includes('sleeve')) { c.fillStyle = rgba(TINK, .2); c.fill(up.path); c.fill(fo.path); }
  if (T.includes('tribal') || T.includes('sleeve')) { c.strokeStyle = rgba(TINK, .7); c.lineWidth = 1.8; c.beginPath(); for (let i = 0; i <= 8; i++) { const t = .3 + i * .045, p = up.at(t, i % 2 ? 1 : -1, up.wAt(t, i % 2 ? 1 : -1) * .35); i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y); } c.stroke(); }
  if (T.includes('anker') || T.includes('hantel')) { const p = fo.axis(.45); c.strokeStyle = rgba(TINK, .65); c.lineWidth = 1.3; c.beginPath(); c.arc(p.x, p.y, 3.5, 0, TAU); c.stroke(); }
}

/* ---------- Kopf: Gesicht, Haare, Bart, Kopfbedeckung ---------- */
function headFeatures(c, D, J, L, o, pose, sk, ink) {
  const Hh = J.head, W = headW(D, Hh), dk = '#2a1810';
  let ex = o.face || pose.face || 'neutral'; if (o.blink && (ex === 'neutral' || ex === 'focus')) ex = 'blink';
  if (o.exert != null && ex === 'strain') ex = o.exert < .3 ? 'effort' : o.exert > .72 ? 'max' : 'strain';
  // Ohr
  const e = W(-1, -3), ea = Math.atan2(Hh.u.y, Hh.u.x); c.fillStyle = sk; c.strokeStyle = rgba(ink, .7); c.lineWidth = .9; c.beginPath(); c.ellipse(e.x, e.y, 5.2 * D.headRy / 20.5, 3.6, ea, 0, TAU); c.fill(); c.stroke();
  glow(c, e.x, e.y, 2.4, '#7a3a20', .3);
  // Auge
  const ec = W(8.6, 12.4);
  if (ex === 'blink' || ex === 'strain' || ex === 'max' || ex === 'drink') { const a1 = W(10, 10.6), a2 = W(7.6, 14); curve(c, a1, W(8.2, 12), a2, ex === 'max' ? 2.2 : 1.6, dk, .9); if (ex === 'max') { const q1 = W(9.6, 9.6), q2 = W(11, 8.6); line(c, q1.x, q1.y, q2.x, q2.y, .9, dk, .5); } }
  else { const ry = ex === 'effort' || ex === 'tired' ? 1.3 : 2.1; c.fillStyle = '#fbf8f2'; c.beginPath(); c.ellipse(ec.x, ec.y, ry, 2.6, ea, 0, TAU); c.fill(); const pu = add(ec, mul(Hh.n, 1.1)); c.fillStyle = '#3a2416'; c.beginPath(); c.arc(pu.x, pu.y, Math.min(1.5, ry * .8), 0, TAU); c.fill(); }
  // Augenbraue
  const bL = { effort: .9, strain: 1.2, max: 1.8, focus: .5 }[ex] || 0, b1 = W(12 - bL, 9.6), b2 = W(12.3 - bL * .4, 14.6);
  c.strokeStyle = mix(L.hairc, '#000000', .3); c.lineWidth = 2 + D.gT * .8; c.beginPath(); c.moveTo(b1.x, b1.y); c.lineTo(b2.x, b2.y); c.stroke();
  // Nasenflügel, Mund
  curve(c, W(2.6, 15.6), W(1.4, 14.2), W(1.6, 16.6), 1.1, '#6a2a10', .5);
  if (ex === 'strain' || ex === 'max') { const m = smoothClosed([W(-2.4, 16.8), W(-3.2, 12.2), W(-5.6, 12.4), W(-5.8, 16.4)].map(p => [p.x, p.y])); c.fillStyle = '#5a1a14'; c.fill(m); const t1 = W(-3, 16.4), t2 = W(-5.4, 16.2); line(c, t1.x, t1.y, t2.x, t2.y, 2, '#f6f2ea', 1); }
  else if (ex === 'proud' || ex === 'smile') curve(c, W(-3.6, 16.4), W(-5, 13.6), W(-2.6, 12.4), 1.5, '#6a2418', .8);
  else { const m1 = W(-4, 16.3), m2 = W(-3.5, ex === 'effort' ? 12.6 : 13.2); line(c, m1.x, m1.y, m2.x, m2.y, ex === 'effort' ? 2 : 1.5, '#6a2418', .75); }
  const fl = Math.max(o.flush || 0, ex === 'max' ? .8 : ex === 'strain' ? .35 : 0); if (fl > .05) { const ch = W(-1, 10); glow(c, ch.x, ch.y, 6, '#e2433a', fl * .3); }
  if (ex === 'max') { const v1 = W(16, 14), v2 = W(13, 15.5); curve(c, v1, W(14.5, 13), v2, 1.1, '#7a3a8a', .4); }
  // Bart
  const bd = L.beard; if (bd && bd !== 'none') {
    const hc = mix(L.hairc, '#000000', .1), hi = mix(L.hairc, '#000000', .5), poly = a => smoothClosed(a.map(([x, y]) => { const p = W(x, y); return [p.x, p.y]; }));
    const full = [[-5.6, -6], [-10.8, -1.8], [-14, 3.6], [-15.3, 9], [-14, 14.4], [-9.8, 16.9], [-6.4, 16.3], [-5.6, 13.4], [-7.4, 10], [-7.4, 4.4], [-5.2, -.6], [-3.2, -4.6]];
    if (bd === 'stoppel') { c.fillStyle = rgba(L.hairc, .3); c.fill(poly(full)); }
    else { const ps = []; if (bd === 'voll' || bd === 'wikinger') { const f2 = full.map(([x, y]) => [x < -12 && y > 5 ? x - (bd === 'wikinger' ? 9 : 1.5) : x, y]); ps.push(poly(f2)); }
      if (bd === 'ziegen') ps.push(poly([[-6, 13], [-8.6, 16.6], [-15.4, 15], [-15.6, 9.6], [-10.6, 10.8]]));
      if (bd !== 'ziegen' || true) ps.push(poly([[-.6, 16.4], [-1.6, 18.4], [-3.2, 17.4], [-2.6, 13.4], [-.8, 13.8]]));
      inkFill(c, ps, hc, hi, .8); if (bd === 'wikinger') { const r = W(-21, 13); c.fillStyle = '#c9a227'; c.fillRect(r.x - 2.5, r.y - 2.5, 5, 5); } }
  }
  // Haare
  hairSide(c, D, Hh, L, W);
  // Kopfbedeckung und Extras am Kopf
  const hw = L.head;
  if (hw && hw !== 'none') { const col = L.headCol || '#333', hi = mix(col, '#000000', .5), poly = a => smoothClosed(a.map(([x, y]) => { const p = W(x, y); return [p.x, p.y]; }));
    if (hw === 'band') inkFill(c, [poly([[16.4, 12.2], [19.6, 8.6], [21.8, -2], [19, -11.5], [15.2, -14], [12.4, -14.6], [15.6, -10.6], [17.6, -2], [16, 7.4], [12.8, 13.4]])], col, hi, .8);
    if (hw === 'cap' || hw === 'capback') { const ps = [poly([[13, 14.8], [19.4, 9], [22.6, -2], [19.8, -12.5], [11, -18.6], [3.5, -19.2], [3, -15], [10, -14], [15, -9], [16, 3], [13.6, 11]])]; ps.push(poly(hw === 'cap' ? [[13.6, 13.4], [12.4, 27], [10.6, 27.4], [10.8, 13.2]] : [[6, -17.6], [4.2, -28], [2.4, -28.2], [2.4, -17]])); inkFill(c, ps, col, hi, .85); }
    if (hw === 'beanie') { inkFill(c, [poly([[12.6, 15], [20, 9], [24, -2], [21, -13.6], [11, -20], [2, -20], [1.4, -16], [11, -14], [15.6, -8], [16.6, 3], [14, 12]])], col, hi, .85); const r1 = W(12.6, 15), r2 = W(2, -18); line(c, r1.x, r1.y, r2.x, r2.y, 4, mix(col, '#000', .2), .6); }
    if (hw === 'kopfhoerer') { const ep = W(-1, -3); c.strokeStyle = hi; c.lineWidth = 3.4; c.beginPath(); const q1 = W(-1, -3), q2 = W(24, -2), q3 = W(-1, -3); c.moveTo(q1.x, q1.y); c.quadraticCurveTo(q2.x, q2.y, q3.x + .1, q3.y); c.stroke(); inkFill(c, [ellP(ep.x, ep.y, 7, 5.2, Math.atan2(Hh.u.y, Hh.u.x))], col, hi, .8); }
  }
  if (L.acc === 'brille') { const g = W(8.6, 12.6); c.fillStyle = 'rgba(15,15,20,.92)'; c.beginPath(); c.ellipse(g.x, g.y, 3.2, 3, Math.atan2(Hh.u.y, Hh.u.x), 0, TAU); c.fill(); const t1 = W(9.6, 10), t2 = W(1, -1); line(c, t1.x, t1.y, t2.x, t2.y, 1.3, '#111', .9); }
}
function hairSide(c, D, Hh, L, W) {
  const st = L.hair; if (!st || st === 'glatze') { const g = W(16, 2); glow(c, g.x, g.y, 7, '#ffffff', .35); return; }
  const hc = L.hairc, hi = mix(hc, '#000000', .45), poly = a => smoothClosed(a.map(([x, y]) => { const p = W(x, y); return [p.x, p.y]; }));
  const cap = (v, front) => [[front ? 16.6 : 15, front ? 13.8 : 11], [19.5 + v * .4, 8], [21.5 + v, -2], [18 + v, -12 - v * .5], [9.5, -17.5 - v], [0, -18.5 - v], [-6, -16.5 - v * .5], [-6.6, -14], [0, -15], [8, -14.5], [14, -9], [16.5, -1], [16, 6], [14, 11]];
  const ps = [];
  // Seitenfläche des Kopfes: Schläfe, Koteletten vor dem Ohr, um das Ohr herum bis in den Nacken – sonst wirkt die Seite kahl
  const SIDE = [[15, 13.5], [10, 11.5], [6, 6], [-4.5, 5.6], [-5.6, 2.4], [2, 1.7], [5.6, -.8], [5.8, -5.6], [2.2, -8.6], [-5, -8.8], [-9.4, -10.4], [-10.4, -15], [-6, -18.6], [2, -20.2], [11, -17.2], [18, -10], [20.6, -1], [19.2, 8]];
  const COVER = [[15, 13.5], [10, 11.8], [4, 9.5], [-7, 8], [-13, 3], [-15, -6], [-12.5, -15.5], [-6, -19], [2, -20.6], [11, -17.6], [18.4, -10], [21, -1], [19.4, 8]];
  const shaved = ['buzz', 'undercut', 'iro', 'fade', 'flattop'].includes(st), long = ['lang', 'bob', 'dreads', 'afro'].includes(st);
  if (shaved) { c.fillStyle = rgba(hc, st === 'buzz' ? .85 : .38); c.fill(poly(SIDE)); c.fill(poly(cap(.5, false))); if (st === 'buzz') { glow(c, W(19, -3).x, W(19, -3).y, 9, '#ffffff', .12); return; } }
  else if (st !== 'kranz') ps.push(poly(long ? COVER : SIDE));
  if (st === 'kurz') ps.push(poly([[16.8, 14.4], [18.6, 11], [20.4, 9.6], [22.4, 3], [23.4, -3.6], [21.2, -9], [18.6, -14.4], [9.5, -19.6], [0, -20.6], [-6.4, -17.4], [-6.6, -14], [0, -15], [8, -14.5], [14, -9], [16.5, -1], [16, 6], [14.4, 11]]));
  if (st === 'seiten') ps.push(poly(cap(3.6, true).map(([a, b], i) => i < 3 ? [a + 1, b + 2] : [a, b])));
  if (st === 'undercut') ps.push(poly([[16, 13.6], [21, 9.4], [25, 0], [22, -9.4], [14, -13], [12, -9], [15.6, -1], [15.6, 7]]));
  if (st === 'iro') ps.push(poly([[17, 7], [27, 4], [24, -1], [29, -5], [24, -9], [27, -14], [19, -15.6], [13, -14], [17, -6], [17.8, 2]]));
  if (st === 'locken') { ps.push(poly(cap(2.2, true))); for (let a = -150; a <= 80; a += 26) { const r = a * Math.PI / 180, x = Math.sin(r) * 20, y = -Math.cos(r) * 20 * .95; ps.push(circP(W(x * .9 + 2, y).x, W(x * .9 + 2, y).y, 5)); } }
  if (st === 'lang') ps.push(poly(cap(3, true)));
  if (st === 'dutt') { ps.push(poly(cap(1.6, true))); const b = W(12, -18); ps.push(circP(b.x, b.y, 7.5)); }
  // Hängende Haare fallen in Weltrichtung nach unten – egal ob du stehst, liegst oder im Liegestütz bist
  const behind = [], hang = (u, n, len, r0, r1, sway) => { const A = W(u, n), B = P(A.x + (sway || 0), A.y + len); behind.push(limb(A, B, r0, r1, []).path); return B; };
  if (st === 'topf') ps.push(poly([[11.6, 16.4], [15, 18.6], [19.4, 15], [22.4, 3], [21.6, -9], [18.6, -14.4], [9.5, -19.6], [0, -20.4], [-6, -17.8], [-7.2, -14], [0, -15], [8, -14.5], [12, -11], [13.4, -4], [12.4, 4], [11, 12]]));
  if (st === 'stachel') { ps.push(poly(cap(1, true))); const sp = []; for (let k = 0; k <= 14; k++) { const f = (70 - k * 12) * Math.PI / 180, r = k % 2 ? 29 : 20.5; sp.push([r * Math.cos(f), r * Math.sin(f)]); }
    for (let k = 14; k >= 0; k -= 2) { const f = (70 - k * 12) * Math.PI / 180; sp.push([15 * Math.cos(f), 15 * Math.sin(f)]); } const pth = new Path2D(); sp.forEach(([u, n], k) => { const q = W(u, n); k ? pth.lineTo(q.x, q.y) : pth.moveTo(q.x, q.y); }); pth.closePath(); ps.push(pth); }
  if (st === 'tolle') { ps.push(poly(cap(1.4, true))); ps.push(poly([[17, 15], [23, 21], [28.5, 18], [30, 9], [27, 1], [21, -3], [19, 6]])); }
  if (st === 'fade' || st === 'flattop') { c.fillStyle = rgba(hc, .38); c.fill(poly(cap(.5, false))); ps.push(poly(st === 'flattop' ? [[16.6, 13], [28, 13], [29, -14], [17, -16], [14, -10], [16.5, -1], [16, 6]] : [[16.6, 13.4], [21.6, 9], [23.4, -2], [20.4, -10.6], [14.6, -12.6], [16.6, 0]])); }
  if (st === 'afro') ps.push(poly([[14, 15.5], [24, 19], [33, 9], [35.5, -6], [30, -21], [16, -31], [0, -32], [-12, -27], [-17, -17], [-8.5, -14.5], [0, -15], [8, -14.5], [14, -9], [16.5, -1], [16, 6]]));
  if (st === 'pferde') { ps.push(poly(cap(1.6, true))); const B = hang(9, -18.5, 26, 5.5, 3.2, -3); ps.push(circP(W(9, -18.5).x, W(9, -18.5).y, 5)); }
  if (st === 'zopf') { ps.push(poly(cap(1.6, true))); const A = W(9, -18.5); for (let i = 0; i < 6; i++) { const q = P(A.x + (i % 2 ? 1.6 : -1.6), A.y + 2 + i * 5.6); behind.push(ellP(q.x, q.y, 4.4 - i * .3, 3.6, i % 2 ? .6 : -.6)); } }
  if (st === 'bob') { ps.push(poly(cap(3, true))); ps.push(poly([[2, -18], [-8, -21], [-16, -18], [-17.5, -8], [-14, -4], [-8, -9], [-2, -12]])); }
  if (st === 'lang') { [[-6, -14, 34, 9, 6, -2], [-11, -4, 30, 7, 5, 2], [0, -19, 30, 7, 5, -4]].forEach(([u, n, l, r0, r1, sw]) => hang(u, n, l, r0, r1, sw)); }
  if (st === 'dreads') { ps.push(poly(cap(2.2, true))); [[14, -14], [8, -18], [1, -20], [-5, -18]].forEach(([u, n], i) => hang(u, n, 30 - i * 2, 3, 2.4, (i - 1.5) * 2)); }
  if (st === 'mittel') ps.push(poly([[12.4, 16.6], [16, 19.4], [20.6, 13], [22.6, 2], [21.4, -9], [18.4, -14.4], [9.5, -19.4], [0, -20.4], [-6.4, -17.4], [-6.6, -14], [0, -15], [8, -14.5], [12.6, -9], [14.6, -1], [13.8, 8]]));
  if (st === 'zurueck') { ps.push(poly(cap(1.4, false))); }
  if (st === 'kranz') { ps.push(poly([[6, -10], [6.5, -17.5], [0, -20], [-6.4, -17.4], [-7.4, -12], [-3, -9], [1, -11]])); }
  if (st === 'wuschel') { ps.push(poly(cap(2.2, true))); [[23, 6, 5], [24, -4, 6], [21, -13, 5.5], [14, -19, 5.5], [5, -21, 5]].forEach(([u, n, r]) => { const q = W(u, n); ps.push(circP(q.x, q.y, r)); }); }
  if (st === 'cornrows') ps.push(poly(cap(.8, false)));
  if (!ps.length) ps.push(poly(cap(2.5, true)));
  if (behind.length) { c.save(); c.globalCompositeOperation = 'destination-over'; inkFill(c, behind, hc, hi, .9); c.restore(); }
  inkFill(c, ps, hc, hi, .9);
  c.save(); const cl = new Path2D(); ps.forEach(q => cl.addPath(q)); c.clip(cl);
  if (st === 'afro' || st === 'locken') for (let i = 0; i < 60; i++) { const a = i * 2.39996, r = Math.sqrt(i / 60) * 30, q = W(4 + Math.cos(a) * r, -6 + Math.sin(a) * r); glow(c, q.x, q.y, 2.6, i % 2 ? '#ffffff' : '#000000', .13); }
  if (st === 'cornrows' || st === 'zurueck') for (let k = 0; k < 5; k++) { const q1 = W(17 - k * 1.5, 10 - k * 4), q2 = W(20 - k * 1.2, -6 - k * 3), q3 = W(4 - k * 2, -17); curve(c, q1, q2, q3, st === 'cornrows' ? 1.4 : 1, st === 'cornrows' ? hi : '#ffffff', st === 'cornrows' ? .6 : .28); }
  c.restore();
  if (st === 'kranz') { const g = W(16, 2); glow(c, g.x, g.y, 7, '#ffffff', .35); }
  const g = W(19, -3); glow(c, g.x, g.y, 9, '#ffffff', .2);
}

/* ---------- Zeichnen ---------- */
Fig.sideLayout = function (o, wx, wy, scale) {
  const D = Fig.dims(o.lv, o.posture || 0, o.breath || 0, o.pump, { fem: o.fem, plain: o.plain, belly: o.belly, fatAdd: o.fatAdd }), J = Fig.sideJ(D, o.pose.side);
  return pack(D, J, wx, wy, scale, o.pose);
};
function pack(D, J, wx, wy, scale, pose) {
  const Wd = p => P(wx + p.x * scale, wy + p.y * scale);
  return { side: true, rot: 0, lie: true, D, J, scale, wx, wy, kind: J.kind, head: Wd(J.head.c), top: Wd(add(J.head.c, mul(J.head.u, D.headRy + 4))), hip: Wd(J.H), S: Wd(J.S),
    ha: { l: Wd(J.arm.f.Hd), r: Wd(J.arm.n.Hd) }, el: { l: Wd(J.arm.f.E), r: Wd(J.arm.n.E) }, sh: { l: Wd(J.arm.f.S), r: Wd(J.arm.n.S) }, neck: Wd(J.S),
    foot: { l: Wd(J.leg.f.A), r: Wd(J.leg.n.A) }, hs: { l: 1, r: 1 }, props: pose.props || [], Wd };
}
Fig.renderSide = function (ctx, wx, wy, scale, o) {
  const dpr = o.dpr || Math.min(MK.ecoOn && MK.ecoOn() ? 1.6 : 2, window.devicePixelRatio || 1, MK.dprCap || 9), s = scale * dpr, pose = o.pose;
  const D = Fig.dims(o.lv, o.posture || 0, o.breath || 0, o.pump, { fem: o.fem, plain: o.plain, belly: o.belly, fatAdd: o.fatAdd });
  const J = Fig.sideJ(D, pose.side), L = o.L, { sk, shd, ink, shine: tShine } = Fig.skin(L, D, o), OW = 1.15, G = geoSide(D, J, L);
  const fsk = mix(sk, '#3a1606', .12);
  const [cF, F] = canv(o.key + 'sF', s), [cX, X] = canv(o.key + 'sX', s), [cA, A] = canv(o.key + 'sA', s), [cB, B] = canv(o.key + 'sB', s);
  const shine = Math.max(o.shine || 0, tShine || 0);
  // Ebene hinten: abgewandter Arm und abgewandtes Bein
  inkFill(X, G.far, fsk, ink, OW);
  X.globalCompositeOperation = 'source-atop'; topLight(X, J); legShade(X, D, G.legF, shd); armShade(X, D, G.armF, shd); sock(X, D, G.legF); shortsFill(X, D, G, L, 'far'); sleeves(X, D, G.armF, L, G);
  if (L.gloves) { X.fillStyle = L.gloves; X.beginPath(); X.ellipse(G.armF.hd.x, G.armF.hd.y, D.handR * 1.3, D.handR * 1.1, 0, 0, TAU); X.fill(); }
  X.fillStyle = 'rgba(25,10,4,.13)'; X.fillRect(-220, -480, 440, 520); X.globalCompositeOperation = 'source-over';
  shoe(X, D, G.legF, L, L.shoes ? mix(L.shoes.val, '#000000', .12) : null);
  // Ebene Körper: Rumpf, Kopf, vorderes Bein
  inkFill(A, G.body, sk, ink, OW);
  A.globalCompositeOperation = 'source-atop'; topLight(A, J); torsoShade(A, D, J, G, shd); legShade(A, D, G.legN, shd);
  if ((L.tats || []).includes('flamme')) { const ca = G.legN.calf, b = ca.at(.6, G.legN.cs, 3), t2 = ca.at(.28, G.legN.cs, 2); A.fillStyle = rgba('#c4501a', .55); A.beginPath(); A.moveTo(b.x - 3, b.y); A.quadraticCurveTo(t2.x - 4, (b.y + t2.y) / 2, t2.x, t2.y); A.quadraticCurveTo(t2.x + 4, (b.y + t2.y) / 2, b.x + 3, b.y); A.fill(); }
  sock(A, D, G.legN); shortsFill(A, D, G, L, 'body'); shirtFill(A, D, J, G, L, o);
  if (shine > .05) { const p = add(J.ax(.78), mul(J.n, at(G.O.F, .78) - 3)); glow(A, p.x, p.y, 9, '#ffffff', shine * .3); }
  A.globalCompositeOperation = 'source-over';
  shoe(A, D, G.legN, L);
  if (L.acc === 'guertel') { const p1 = sub(J.ax(.08), mul(J.n, at(G.O.B, .08) + 2)), p2 = add(J.ax(.08), mul(J.n, at(G.O.F, .08) + 2)); A.strokeStyle = '#5a3418'; A.lineWidth = 11; A.beginPath(); A.moveTo(p1.x, p1.y); A.lineTo(p2.x, p2.y); A.stroke(); A.fillStyle = '#d9b343'; A.fillRect(p2.x - 4, p2.y - 5, 6, 10); }
  // Ebene vorderer Arm
  inkFill(B, G.arm, sk, ink, OW);
  B.globalCompositeOperation = 'source-atop'; topLight(B, J); armShade(B, D, G.armN, shd); armTats(B, D, G.armN, L); sleeves(B, D, G.armN, L, G);
  if (L.gloves) { B.fillStyle = L.gloves; B.beginPath(); B.ellipse(G.armN.hd.x, G.armN.hd.y, D.handR * 1.3, D.handR * 1.1, 0, 0, TAU); B.fill(); }
  if (shine > .05) { const p = G.armN.upper.at(.5, G.armN.bs, D.bi * .5); glow(B, p.x, p.y, D.bi + 3, '#ffffff', shine * .35); }
  B.globalCompositeOperation = 'source-over';
  if (L.acc === 'uhr') { const p = G.armN.fore.axis(.86); B.fillStyle = '#1a1a1a'; B.beginPath(); B.ellipse(p.x, p.y, 3, D.fR1 + 1.8, Math.atan2(G.armN.f2.y, G.armN.f2.x), 0, TAU); B.fill(); }
  // Zusammensetzen
  F.setTransform(1, 0, 0, 1, 0, 0); F.drawImage(cX, 0, 0);
  if (pose.armsBehind) { F.drawImage(cB, 0, 0); F.drawImage(cA, 0, 0); } else { F.drawImage(cA, 0, 0); F.drawImage(cB, 0, 0); }
  F.setTransform(s, 0, 0, s, OX * s, OY * s);
  headFeatures(F, D, J, L, o, pose, sk, ink);
  if (L.acc === 'handtuch') { const O = G.O, Fp = (t, off) => add(J.ax(t), mul(J.n, at(O.F, t) + off)), nk = add(J.S, mul(J.u, 5));
    const band = limb(sub(nk, mul(J.n, D.neckR * .95)), add(nk, mul(J.n, D.neckR * 1.05)), 3.4, 3.4, []).path, parts = [band];
    if (J.n.y < .3) { const q = []; for (let i = 0; i <= 6; i++) { const p = Fp(.98 - i * .07, 1); q.push([p.x, p.y]); } for (let i = 6; i >= 0; i--) { const p = Fp(.98 - i * .07, 4.6); q.push([p.x, p.y]); } parts.push(smoothClosed(q)); }
    else { const A0 = Fp(.95, 2); parts.push(limb(A0, P(A0.x + 2, A0.y + 24), 4, 4.6, []).path); }
    inkFill(F, parts, '#f7f5ef', '#b9b3a5', .75); }
  if (L.acc === 'kette') { const p = add(J.S, mul(J.n, D.neckR * .6)); F.strokeStyle = '#e6b422'; F.lineWidth = 2; F.beginPath(); F.ellipse(p.x, p.y, 4, 7, Math.atan2(J.u.y, J.u.x), 0, TAU); F.stroke(); }
  if ((o.sweat || 0) > .08) { const W = headW(D, J.head), g = W(15, 10); glow(F, g.x, g.y, 7, '#ffffff', Math.min(.35, o.sweat * .45)); if (o.sweat > .45) { const t = performance.now() / 1000; for (let i = 0; i < 2; i++) { const ph = (t * .7 + i * .5) % 1, p0 = W(12 - i * 6, 15); F.fillStyle = 'rgba(160,210,255,.85)'; F.beginPath(); F.ellipse(p0.x + J.head.n.x * ph * 14, p0.y + J.head.n.y * ph * 14 + ph * 10, 1.4, 2.2, 0, 0, TAU); F.fill(); } } }
  const out = c2 => { c2.save(); if (o.glow) { c2.shadowColor = o.glowCol || 'rgba(255,70,40,.9)'; c2.shadowBlur = 18 * scale * o.glow; } if (o.alpha != null) c2.globalAlpha = o.alpha; c2.drawImage(cF, wx - OX * scale, wy - OY * scale, BW * scale, BH * scale); c2.restore(); };
  out(ctx); const RES = pack(D, J, wx, wy, scale, pose); Fig._last[o.key] = { out, R: RES, wx, wy, scale }; return RES;
};

})(window.MK);
