/* Muskelklicker – Wettkämpfe: 7 Disziplinen, Turniere, Wochen-Event, Rivalen-Duell */
window.MK = window.MK || {};
(function (MK) {
const C = MK.Comp = { cur: null };
const tri = u => 1 - Math.abs((((u % 2) + 2) % 2) - 1); // Strich läuft gleichmäßig hin und her
const TAU = Math.PI * 2, clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t, rnd = (a, b) => a + Math.random() * (b - a);
let el = null;
C.init = function (overlay) { el = overlay; };

/* ---------- Gegner-Figur ---------- */
/* Gegner kommen immer mit Wettkampf-Bräune – wer blass antritt, fällt auf */
function oppOpts(seed, idx, look) {
  const lvl = 2 + idx * 13, lv = Object.fromEntries(MK.MUSCLES.map(m => [m.id, lvl * (0.8 + (MK.seedRand(seed + m.id)() * .4))]));
  const lk = Object.assign({}, look || MK.Scene.oppLook(seed), { tan: idx < 4 ? 'tan2' : 'tan3' });
  return { key: 'opp', lv, L: MK.Fig.resolveLook(lk), posture: Math.min(1, idx / 7 + .2), breath: 0 };
}
C.oppOpts = oppOpts;
function playerOpts() { const S = MK.S, lv = MK.lvExact(); const sp = S.sponsor ? MK.SPONSORS.find(x => x.id === S.sponsor) : null;
  const L = MK.Fig.resolveLook(Object.assign({}, S.look, S.compTan ? { tan: S.compTan } : {})); L.tats = MK.tatsOn();
  return { key: 'pcomp', lv, L, posture: MK.rankIdx() / 10, sweat: S.sweat, sponsor: sp ? sp.logo : null, fatAdd: MK.fatAdd() }; }

/* ---------- Start ---------- */
// cfg: { disc, idx, kind:'single'|'tourney'|'event'|'rival', name, round, rounds, mod, onEnd }
C.start = function (cfg) {
  const S = MK.S, d = MK.DISC.find(x => x.id === cfg.disc), mod = cfg.mod || {}, b = MK.bonus(), LD = MK.labDuel ? MK.labDuel() : { time: 1, zone: 1, slow: 1, opp: 1, rage: 0 };
  const goalMul = (mod.goal || 1) * (cfg.goalMul || 1) * LD.opp; // Tren: Gegner schwächer
  const P = MK.discPower(d) * (mod.power || 1);
  const EN = MK.endur(), timed = true, dur = (d.dur + (b.compTime || 0)) * (mod.time || 1) * (1 + EN.time) * LD.time; // EPO: längere Duelle
  const c = C.cur = { cfg, d, idx: cfg.idx, P, dur, goal: d.id === 'arm' ? 1 : Math.round(d.goal[cfg.idx] * goalMul * 10) / 10, score: 0, running: false, end: 0, finished: false, t: 0,
    ph: -1, rep: 0, oph: 0, opp: oppOpts(cfg.seed || (d.id + cfg.idx), cfg.idx, cfg.look), oppName: cfg.name || d.opp[cfg.idx], me: playerOpts(),
    // Disziplin-Zustand
    p: 0, combo: 0, zx: .45, zw: .16, mk: 0, canHit: true, inZ: false, bal: 0, h: .2, band: .5, prog: 0, lastTap: 0, v: 0, dist: 0, flips: 0, oppProg: 0, cheer: 0, scores: null };
  const I = c.idx, TW = 1 - Math.min(.6, b.twist || 0); c.twk = TW; c.tw = (d.tw || []).filter(x => I >= x.at); const has = n => c.tw.some(x => x.n === n); c.has = has;
  if (d.id === 'klimm') { c.grip = 1; c.slip = 0; c.gDrain = has('Griffkraft') ? (.04 + .006 * I) * (has('Nasse Stange') ? 1.4 : 1) / Math.pow(P, .15) * TW / EN.grip : 0; c.gReg = (has('Nasse Stange') ? .35 : .5) * EN.reg; }
  if (d.id === 'squat') { c.zw = Math.max(.11, .2 - I * .008) + Math.min(.07, (P - 1) * .012); c.zw = Math.min(.42, c.zw * LD.zone); c.speed = (.5 + .06 * I) * LD.slow; c.mk = Math.random(); c.drift = has('Wandernde Zone') ? .05 + .012 * I : 0; c.zdir = 1; c.trap = has('Rote Falle'); placeZone(c); }
  if (d.id === 'drueck') { c.heavy = 0; c.heavyT = rnd(2, 3.5); }
  if (d.id === 'arm') { c.surge = 0; c.surgeT = rnd(2.5, 4); }
  if (d.id === 'kreuz') { c.jumpT = rnd(2.5, 4); c.boff = 0; }
  if (d.id === 'truck') { c.windT = rnd(3, 5); c.slope = 0; }
  if (d.id === 'drueck') { c.grav = (.06 + .045 * c.idx) * goalMul; }
  if (d.id === 'arm') { c.oppRate = .2 * Math.pow(1.35, c.idx) * [1, 1, .735, .698, .663, .463, .488, .488][c.idx] * goalMul; } // per Simulation abgestimmt: mit der passenden Kraft gewinnt man ~3 von 4
  if (d.id === 'kreuz') { c.grav = .35 + c.idx * .03; c.bspeed = (.5 + c.idx * .05) * LD.slow; c.bw = Math.min(.45, (.22 - c.idx * .004 + Math.min(.1, (P - 1) * .025)) * LD.zone); }
  c.rage = LD.rage; c.rageT = rnd(3, 5); c.raging = 0; c.synth = !!LD.synth;
  if (d.id === 'reifen') { c.tg = .035 * P / (1 + c.idx * .18); c.slipK = has('Rutschiger Reifen') ? .25 + .07 * I * TW : .25; }
  MK.Scene.fx.parts = []; MK.Scene.fx.pops = []; MK.Scene.fx.bubbles = [];
  { const S2 = MK.S, k2 = cfg.kind; let v = Math.min(4, S2.gym + (c.idx >= 7 ? 1 : 0));
    if (k2 === 'tourney') { const T = MK.TOURNEYS.find(x => x.name === cfg.tname) ; v = T ? Math.min(6, T.tier + 1) : v; if (T && T.id === 'wm' && cfg.round === cfg.rounds - 1) v = 7; }
    if (k2 === 'event') v = Math.min(6, Math.max(2, v + 1));
    if ((k2 === 'single' || k2 === 'rival') && MK.bizCount && MK.bizCount('space') > 0) v = 7;
    c.venue = v; }
  buildHUD(c);
  if ((c.me.L.tan || 0) < .3 && Math.random() < .55) setTimeout(() => { if (C.cur === c) MK.Scene.say('stageCrowd', MK.pickLine(MK.LINES.pale, 'pale'), 3.5); }, 900);
  MK.emit('compStart', c);
};
function placeZone(c) { c.zx = .08 + Math.random() * (.84 - c.zw);
  if (c.trap) { c.tw2 = .07; let t = 0; for (let k = 0; k < 12; k++) { t = .06 + Math.random() * (.88 - c.tw2); if (t + c.tw2 < c.zx - .03 || t > c.zx + c.zw + .03) break; } c.tx = t; } }

function buildHUD(c) {
  const k = c.cfg, roundTxt = k.rounds ? ` · Runde ${k.round + 1}/${k.rounds}` : '';
  el.hidden = false;
  el.innerHTML = `<div class="c-top"><div class="c-who"><b>Du</b><span>vs.</span><b>${c.oppName}</b></div><div class="c-sub">${c.d.name}${roundTxt}</div></div>
  <div class="c-score"><span id="cS">0</span><small>/ ${c.d.id === 'arm' ? 'Arm auf den Tisch' : MK.fmt1(c.goal) + ' ' + c.d.unit}</small></div>
  <div class="c-time pulse" id="cT">Erster Tipp startet die Uhr · ${Math.round(c.dur)} s</div>
  <div class="c-lvl">Gegner ${c.idx + 1} von 8${c.tw.length ? ' · ' + c.tw.map(x => '<b>' + x.n + '</b>').join(' · ') : ''}</div>
  <div class="c-how">${c.d.how}${c.tw.map(x => `<br><b>${x.n}:</b> ${x.d}`).join('')}<br><small>🫁 Ausdauer Lv ${MK.endur().lv}: +${Math.round(MK.endur().time * 100)} % Zeit${c.d.id === 'klimm' ? ` · Griff hält ${Math.round((MK.endur().grip - 1) * 100)} % länger` : ''}</small></div>
  `; // kein Tipp-Knopf mehr: das ganze Bild zählt
}
C.keyTap = () => { if (C.cur && !C.cur.finished) C.tap(); };

/* ---------- Tippen ---------- */
C.tap = function () {
  const c = C.cur; if (!c || c.finished) return;
  MK.Audio.unlock();
  if (c.introUntil && performance.now() < c.introUntil) return; // VS-Intro läuft noch
  if (!c.running) { c.running = true; c.end = performance.now() + c.dur * 1000; const how = el.querySelector('.c-how'); if (how) how.hidden = true; const T0 = document.getElementById('cT'); if (T0) { T0.classList.remove('pulse'); void T0.offsetWidth; T0.classList.add('go'); } }
  const id = c.d.id, P = c.P, Sc = MK.Scene, G = { x: Sc.W * .3, y: Sc.H * .5 };
  if (c.raging > 0) { MK.Audio.play('error'); return; } // Wutanfall: Tippen zählt gerade nicht
  c.lastTap = performance.now(); c.rep++;
  if (id === 'klimm') { if (c.slip > 0) { MK.Audio.play('error'); return; }
    c.score += .25 * P; if (c.ph < 0 || c.ph >= 1) c.ph = .0001; else c.q = 1; MK.Audio.play('tap');
    if (c.gDrain) { c.grip -= c.gDrain; if (c.grip <= 0) { c.grip = 0; c.slip = .75; Sc.pop('Abgerutscht!', G.x, G.y - 40, { col: '#ee4035' }); MK.Audio.play('whoosh'); } } }
  if (id === 'drueck') { c.p += .05 * P; if (c.p >= 1) { c.p = 0; c.score++; Sc.pop('+1', G.x, G.y, { big: 1 }); MK.Audio.play('clank', 6); Sc.fx.shake = 4; Sc.particle('chalk', G.x, G.y - 60, 6); } else MK.Audio.play('tap'); }
  if (id === 'squat' && c.trap) { const x = tri(c.mk); if (x >= c.tx && x <= c.tx + c.tw2) { c.combo = 0; c.score = Math.max(0, c.score - 1); Sc.pop('Falle! −1', G.x, G.y - 40, { col: '#ee4035' }); MK.Audio.play('error'); showScore(c); return; } }
  if (id === 'squat') { const x = tri(c.mk), hit = x >= c.zx && x <= c.zx + c.zw;
    if (hit && c.canHit) { c.combo++; const add = Math.pow(P, .8) * Math.min(2, 1 + c.combo * .1); c.score += add; c.canHit = false; placeZone(c); if (c.ph < 0 || c.ph >= 1) c.ph = .0001; else c.q = 1; Sc.pop(c.combo > 1 ? 'Combo ×' + c.combo : 'Treffer!', G.x, G.y - 40, { col: '#2bb673' }); MK.Audio.play('clank', 2); }
    else { c.combo = 0; Sc.pop('Daneben!', G.x, G.y - 40, { col: '#ee4035' }); MK.Audio.play('error'); } }
  if (id === 'arm') { c.bal += .05 * Math.pow(P, .7); MK.Audio.play('grunt'); }
  if (id === 'kreuz') { c.h = Math.min(1, c.h + .11 * Math.min(3, Math.pow(P, .5))); MK.Audio.play('tap'); }
  if (id === 'reifen') { c.prog += c.tg * (c.has('Totpunkt') && c.prog > .45 && c.prog < .65 ? .5 : 1); MK.Audio.play('tap'); if (c.prog >= 1) { c.prog = 0; c.flips++; c.score = c.flips; Sc.fx.shake = 8; MK.Audio.play('clank', 10); Sc.particle('chalk', Sc.W * .5, Sc.H * .8, 14); Sc.pop('Wurf!', Sc.W * .5, Sc.H * .5, { big: 1 }); } }
  if (id === 'truck') { c.v += .2 * Math.pow(P, .6); c.ph = (c.ph < 0 ? 0 : c.ph); MK.Audio.play('step'); }
  showScore(c);
  if (c.d.id !== 'arm' && c.score >= c.goal - 1e-6) C.finish(); // Ziel erreicht = sofort gewonnen, nicht erst die Zeit ablaufen lassen
};
function showScore(c) { const s = document.getElementById('cS'); if (s) s.textContent = c.d.id === 'arm' ? Math.round((c.bal + 1) * 50) + ' %' : MK.fmt1(c.score); }

/* ---------- Tick ---------- */
C.tick = function (dt, t) {
  const c = C.cur; if (!c) return;
  c.t += dt;
  if (c.ph >= 0) { c.ph += dt * 4; if (c.ph >= 1) { if (c.q) { c.q = 0; c.ph = .0001; } else c.ph = -1; } } // immer ganze Wiederholungen
  c.oph = (c.oph + dt * (0.9 + c.idx * .12)) % 1;
  if (c.running && !c.finished) {
    const id = c.d.id;
    const runT = c.dur - (c.end - performance.now()) / 1000;
    if (id === 'klimm') { c.slip = Math.max(0, c.slip - dt); if (c.slip <= 0) c.grip = Math.min(1, c.grip + c.gReg * dt); }
    if (id === 'drueck') { if (c.has('Schwere Momente')) { c.heavyT -= dt; c.heavy -= dt; if (c.heavyT <= 0 && c.heavy <= 0) { const z = c.has('Zittern'); c.heavy = z ? 1.2 : .8; c.heavyT = z ? rnd(1.6, 2.8) : rnd(2.6, 4.2); MK.Audio.play('grunt'); } }
      c.p = Math.max(0, c.p - c.grav * (c.heavy > 0 ? 1 + 1.2 * c.twk : 1) * dt); }
    if (id === 'squat' && c.drift) { c.zx += c.drift * c.zdir * dt; if (c.zx < .04) { c.zx = .04; c.zdir = 1; } if (c.zx > .96 - c.zw) { c.zx = .96 - c.zw; c.zdir = -1; } }
    if (id === 'arm' && c.has('Nachdrücken')) { c.surgeT -= dt; c.surge -= dt; if (c.surgeT <= 0 && c.surge <= 0) { const z = c.has('Zermürben'); c.surge = z ? 1.5 : .9; c.surgeT = rnd(2.5, 4.5); MK.Audio.play('grunt'); } }
    if (id === 'kreuz') { if (c.has('Sprünge')) { c.jumpT -= dt; if (c.jumpT <= 0) { c.boff = rnd(-.16, .16); c.jumpT = rnd(2.4, 3.8); MK.Audio.play('whoosh'); } } if (c.has('Ermüdung')) c.gEx = 1 + Math.max(0, runT) / c.dur * .7; }
    if (id === 'truck') { if (c.has('Steigung')) c.slope = Math.max(0, Math.sin(c.dist * .45 - 1)); if (c.has('Gegenwind')) { c.windT -= dt; if (c.windT <= 0) { c.v *= .5; c.windT = rnd(2.8, 4.5); MK.Scene.pop('Böe!', MK.Scene.W * .5, MK.Scene.H * .35, { col: '#7fd3ff' }); MK.Audio.play('whoosh'); } } }
    if (id === 'squat') { c.mk += c.speed * dt; const x = tri(c.mk), inZ = x >= c.zx && x <= c.zx + c.zw; if (inZ && !c.inZ) c.canHit = true; c.inZ = inZ; }
    if (id === 'arm') { c.bal -= c.oppRate * (1 + Math.sin(c.t * 2.3) * .35) * (c.surge > 0 ? 1 + (c.has('Zermürben') ? 1.8 : 1.2) * c.twk : 1) * dt; if (c.bal >= 1 || c.bal <= -1) { c.bal = clamp(c.bal, -1, 1); return C.finish(); } showScore(c); }
    if (id === 'kreuz') { c.h = Math.max(0, c.h - c.grav * (c.gEx || 1) * dt); c.band = clamp(.5 + Math.sin(c.t * c.bspeed) * (c.boff ? .2 : .3) + c.boff, .12, .88); if (Math.abs(c.h - c.band) < c.bw / 2) { c.score += dt; } showScore(c); }
    if (id === 'reifen') { if (performance.now() - c.lastTap > (c.slipK > .25 ? 220 : 300)) c.prog = Math.max(0, c.prog - dt * c.slipK); }
    if (id === 'truck') { c.v *= Math.exp(-(1.5 + c.slope * 1.6) * dt); c.dist += c.v * dt; c.score = c.dist; c.ph = (c.ph < 0 ? 0 : c.ph + c.v * dt * .4) % 1; showScore(c); }
    if (c.rage) { c.raging = Math.max(0, c.raging - dt); if ((c.rageT -= dt) < 0) { c.rageT = rnd(3.5, 6.5); if (Math.random() < c.rage) { c.raging = .9; MK.Scene.pop('WUTANFALL!', MK.Scene.W * .3, MK.Scene.H * .42, { col: '#a64dff', big: 1 }); MK.Audio.play('rage'); MK.Scene.fx.shake = 6; } } }
    c.oppProg = Math.min(1, c.oppProg + dt / c.dur * (.85 + Math.sin(c.t * 1.3) * .1));
    if (id !== 'arm' && c.score >= c.goal - 1e-6) return C.finish();
    const left = c.end - performance.now();
    const T = document.getElementById('cT'); if (T) { T.textContent = Math.max(0, left / 1000).toFixed(1).replace('.', ',') + ' s'; const hot = left < 3000; if (T.classList.contains('pulse') !== hot) T.classList.toggle('pulse', hot); }
    if (left <= 0) C.finish();
  }
  const myP = c.d.id === 'arm' ? (c.bal + 1) / 2 : c.score / Math.max(.1, c.goal), mood = c.running && !c.finished ? clamp((myP - c.oppProg * (c.d.id === 'arm' ? 0 : 1) - (c.d.id === 'arm' ? .5 : 0)) * 2.2, -1, 1) : 0;
  MK.Scene.drawStage(dt, t, { venue: c.venue, title: c.d.name.toUpperCase(), cheer: c.cheer > 0 ? 1 : 0, mood, running: c.running && !c.finished, result: c.finished ? (c.win ? 'win' : 'lose') : null, scores: c.scores, draw: (cx, W, H, yF, t2) => drawDisc(c, cx, W, H, yF, t2) });
  c.cheer = Math.max(0, c.cheer - dt);
};

/* ---------- Disziplin zeichnen ---------- */
function drawDisc(c, cx, W, H, yF, t) {
  const Sc = MK.Scene, sc = Math.min(H * .00175, W * .0022), py = H - 26, id = c.d.id, P = MK.Fig.poses;
  const meD = MK.Fig.dims(c.me.lv, c.me.posture, 0), opD = MK.Fig.dims(c.opp.lv, c.opp.posture, 0);
  const myT = c.ph >= 0 ? Math.sin(c.ph * Math.PI) : 0, opT = Math.sin(c.oph * Math.PI);
  let mp, op, mx = W * .28, ox = W * .62;
  const res = c.finished ? (c.win ? 'win' : 'lose') : null;
  if (res) { mp = res === 'win' ? P.cheer(0, (t * .8) % 1, meD) : P.sad(0, 0, meD); op = res === 'win' ? P.sad(0, 0, opD) : P.cheer(0, (t * .8) % 1, opD); }
  else if (id === 'klimm') { mp = P.pullup(myT, 0, meD); op = P.pullup(opT, 0, opD); }
  else if (id === 'drueck') { mx = W * .2; ox = W * .6; mp = P.benchLie(1 - c.p, 0, meD); op = P.benchLie(1 - (Math.sin(t * 1.4) + 1) / 2, 0, opD); } // Bankdrücken: wirklich auf der Bank liegend
  else if (id === 'squat') { mp = P.bbsquat(myT, 0, meD); op = P.bbsquat(opT, 0, opD); }
  else if (id === 'arm') { mx = W * .4; ox = W * .6; const reach = (W * .1) / sc; mp = P.armwrestle(0, 0, meD, { side: 1, reach, bal: c.bal }); op = P.armwrestle(0, 0, opD, { side: -1, reach, bal: -c.bal }); }
  else if (id === 'kreuz') { mp = P.liftHold(0, 0, meD, { h: c.h }); op = P.liftHold(0, 0, opD, { h: .5 + Math.sin(t * 1.2) * .3 }); }
  else if (id === 'reifen') { mx = W * .38; mp = P.tire(c.prog, 0, meD); }
  else if (id === 'truck') { mx = W * .3; mp = P.truck(0, c.ph < 0 ? 0 : c.ph, meD); }
  // Gegner
  if (op) { const o = Object.assign({}, c.opp, { pose: op }); o.L = c.opp.L; (op.side ? Sc.drawFighterSide : Sc.drawFighter)(o, ox, py, sc, op, Math.min(MK.WEIGHTS.length - 1, 3 + c.idx * 2)); }
  // Disziplin-Props hinter dem Spieler
  if (id === 'truck') drawTruck(cx, W, H, py, sc, c, t);
  if (id === 'arm') { cx.fillStyle = '#5a3a22'; cx.fillRect(W * .42, py - 150 * sc, W * .16, 12 * sc); cx.fillStyle = '#3a2614'; cx.fillRect(W * .49, py - 138 * sc, W * .02, 138 * sc); }
  // Spieler
  const me = Object.assign({}, c.me, { pose: mp, glow: MK.S.beastOn > 0 ? .7 : 0 });
  (mp.side ? Sc.drawFighterSide : Sc.drawFighter)(me, mx, py, sc, mp, Math.min(MK.WEIGHTS.length - 1, MK.S.wset));
  if (id === 'reifen') drawTire(cx, W, H, py, sc, c, mx);
  // Anzeigen im Bild
  if (id === 'drueck') { meterV(cx, W * .06, H * .3, 22, H * .45, c.p, c.heavy > 0 ? '#ee4035' : '#3a86ff', c.heavy > 0 ? 'SCHWER!' : 'Stange'); }
  if (id === 'klimm' && c.gDrain) meterV(cx, W * .06, H * .3, 22, H * .45, c.grip, c.slip > 0 ? '#ee4035' : c.grip < .3 ? '#ff8a3d' : '#7fd3ff', c.slip > 0 ? 'RUTSCHT' : 'Griff');
  if (id === 'arm' && c.surge > 0) { cx.fillStyle = '#ee4035'; cx.font = '24px Bangers, Impact, sans-serif'; cx.textAlign = 'center'; cx.fillText('ER DRÜCKT NACH!', W / 2, Math.max(190, H * .4)); }
  if (id === 'truck' && c.slope > .3) { cx.fillStyle = '#ffd23f'; cx.font = '22px Bangers, Impact, sans-serif'; cx.textAlign = 'center'; cx.fillText('STEIGUNG!', W / 2, Math.max(196, H * .41)); }
  if (id === 'reifen' && c.has('Totpunkt')) { cx.fillStyle = 'rgba(238,64,53,.35)'; cx.fillRect(W * .06, H * .3 + H * .45 * (1 - .65), 22, H * .45 * .2); }
  if (id === 'kreuz') { meterV(cx, W * .06, H * .3, 26, H * .45, c.h, '#ffd23f', 'Höhe', { band: c.band, bw: c.bw }); }
  if (id === 'reifen') meterV(cx, W * .06, H * .3, 22, H * .45, c.prog, '#ff8a3d', 'Reifen');
  if (id === 'squat') { const tw = Math.min(W * .7, 420), tx = (W - tw) / 2, ty = Math.max(205, H * .44); cx.fillStyle = 'rgba(255,255,255,.9)'; cx.fillRect(tx, ty, tw, 26); cx.fillStyle = '#2bb673'; cx.fillRect(tx + c.zx * tw, ty, c.zw * tw, 26); if (c.trap) { cx.fillStyle = '#ee4035'; cx.fillRect(tx + c.tx * tw, ty, c.tw2 * tw, 26); } const x = tri(c.mk); cx.fillStyle = '#141414'; cx.fillRect(tx + x * tw - 3, ty - 8, 6, 42); cx.strokeStyle = '#141414'; cx.lineWidth = 3; cx.strokeRect(tx, ty, tw, 26);
    if (c.combo > 1) { cx.fillStyle = '#ffd23f'; cx.font = '22px Bangers, Impact, sans-serif'; cx.textAlign = 'center'; cx.fillText('Combo ×' + c.combo, W / 2, ty + 50); } }
  if (id === 'arm') { const bw = Math.min(W * .6, 360), bx = (W - bw) / 2, by = Math.max(205, H * .44); cx.fillStyle = '#ee4035'; cx.fillRect(bx, by, bw, 18); cx.fillStyle = '#3a86ff'; cx.fillRect(bx, by, bw * (c.bal + 1) / 2, 18); cx.strokeStyle = '#141414'; cx.lineWidth = 3; cx.strokeRect(bx, by, bw, 18); cx.fillStyle = '#fff'; cx.fillRect(bx + bw / 2 - 1.5, by - 6, 3, 30); }
  if (id === 'truck') { const bw = Math.min(W * .6, 360), bx = (W - bw) / 2, by = Math.max(210, H * .44); cx.fillStyle = 'rgba(255,255,255,.9)'; cx.fillRect(bx, by, bw, 14); cx.fillStyle = '#2bb673'; cx.fillRect(bx, by, bw * Math.min(1, c.dist / c.goal), 14); cx.fillStyle = '#ee4035'; cx.fillRect(bx + bw * c.oppProg - 2, by - 6, 4, 26); cx.strokeStyle = '#141414'; cx.lineWidth = 3; cx.strokeRect(bx, by, bw, 14);
    cx.fillStyle = '#fff'; cx.font = '700 12px Arial'; cx.textAlign = 'left'; cx.fillText('Gegner', bx + bw * c.oppProg + 6, by - 4); }
  if (id === 'reifen' || id === 'truck') { cx.fillStyle = 'rgba(255,255,255,.85)'; cx.font = '700 12px Arial'; cx.textAlign = 'center'; cx.fillText(c.oppName + ': ' + MK.fmt1(c.goal * c.oppProg) + ' ' + c.d.unit, W * .5, Math.max(240, H * .52)); }
}
function meterV(cx, x, y, w, h, v, col, label, band) {
  cx.fillStyle = 'rgba(255,255,255,.9)'; cx.fillRect(x, y, w, h);
  if (band) { cx.fillStyle = 'rgba(43,182,115,.85)'; cx.fillRect(x, y + h * (1 - band.band - band.bw / 2), w, h * band.bw); cx.fillStyle = '#141414'; cx.fillRect(x - 6, y + h * (1 - v) - 2, w + 12, 4); }
  else { cx.fillStyle = col; cx.fillRect(x, y + h * (1 - v), w, h * v); }
  cx.strokeStyle = '#141414'; cx.lineWidth = 3; cx.strokeRect(x, y, w, h);
  cx.fillStyle = '#fff'; cx.font = '700 11px Arial'; cx.textAlign = 'center'; cx.fillText(label, x + w / 2, y + h + 14);
}
function drawTire(cx, W, H, py, sc, c, mx) {
  const x = mx + 70 * sc, ang = c.prog * Math.PI / 2;
  cx.save(); cx.translate(x, py - 6 * sc); cx.rotate(-ang);
  cx.fillStyle = '#1a1a1c'; cx.beginPath(); cx.ellipse(40 * sc, 0, 80 * sc, 22 * sc, 0, 0, TAU); cx.fill();
  cx.fillStyle = '#2a2a2e'; cx.beginPath(); cx.ellipse(40 * sc, -4 * sc, 48 * sc, 11 * sc, 0, 0, TAU); cx.fill();
  cx.strokeStyle = 'rgba(255,255,255,.08)'; cx.lineWidth = 3 * sc; for (let i = 0; i < 12; i++) { cx.beginPath(); cx.moveTo(-36 * sc + i * 13 * sc, 14 * sc); cx.lineTo(-30 * sc + i * 13 * sc, 20 * sc); cx.stroke(); }
  cx.restore();
}
function drawTruck(cx, W, H, py, sc, c, t) {
  const off = (c.dist * 40) % 80;
  cx.fillStyle = 'rgba(255,255,255,.12)'; for (let x = -off; x < W; x += 80) cx.fillRect(x, py + 2, 40, 4);
  const tx = W * .62, ty = py;
  cx.fillStyle = '#d83a32'; cx.beginPath(); cx.roundRect(tx, ty - 120 * sc, 150 * sc, 92 * sc, 8 * sc); cx.fill();
  cx.fillStyle = '#e8e8ea'; cx.fillRect(tx + 150 * sc, ty - 90 * sc, 110 * sc, 62 * sc);
  cx.fillStyle = 'rgba(140,200,240,.8)'; cx.fillRect(tx + 20 * sc, ty - 104 * sc, 60 * sc, 34 * sc);
  cx.fillStyle = '#ffd23f'; cx.fillRect(tx + 6 * sc, ty - 40 * sc, 20 * sc, 8 * sc);
  [tx + 40 * sc, tx + 120 * sc, tx + 210 * sc].forEach(x => { cx.save(); cx.translate(x, ty - 18 * sc); cx.rotate(c.dist * 2); cx.fillStyle = '#1a1a1c'; cx.beginPath(); cx.arc(0, 0, 20 * sc, 0, TAU); cx.fill(); cx.fillStyle = '#8a8d94'; cx.fillRect(-8 * sc, -2 * sc, 16 * sc, 4 * sc); cx.restore(); });
  cx.strokeStyle = '#3a2a1a'; cx.lineWidth = 3 * sc; cx.beginPath(); cx.moveTo(W * .3, py - 120 * sc); cx.lineTo(tx, ty - 40 * sc); cx.stroke();
}

/* ---------- Ende ---------- */
C.finish = function () {
  const c = C.cur; if (!c || c.finished) return;
  c.finished = true; c.running = false;
  const openBefore = MK.DISC.filter(MK.discOpen).map(x => x.id), tourBefore = MK.TOURNEYS.filter(MK.tourOk).map(x => x.id);
  const S = MK.S, d = c.d, k = c.cfg, mod = k.mod || {}, b = MK.bonus();
  const win = d.id === 'arm' ? c.bal > 0 : c.score >= c.goal - 1e-6;
  c.win = win;
  S.compBuff = 0;
  let money = 0, fame = 0;
  if (k.kind === 'single') {
    const first = S.beat[d.id] <= c.idx;
    const base = MK.PRIZE[c.idx] * d.mult * (1 + b.money) * (mod.prize || 1);
    money = win ? (first ? base : base / 2) : base * .05;
    if (win) { S.wins[d.id]++; if (first) S.beat[d.id] = Math.max(S.beat[d.id], c.idx + 1); fame = (2 + c.idx * 3) * d.mult * (first ? 1 : .3); }
  } else if (k.kind === 'rival') {
    if (win) { money = MK.PRIZE[c.idx] * 1.5; fame = 10 + c.idx * 6; S.stats.rivalWins++; S.rival.wins++; S.rivBeat[S.gym] = (S.rivBeat[S.gym] || 0) + 1; } else S.rival.losses++;
  } else {
    if (win) { fame = (2 + c.idx * 2) * (mod.fame || 1); S.wins[d.id]++; }
  }
  if (win && money) money += MK.income() * (30 + c.idx * 20) * (k.kind === 'rival' ? 1.5 : 1); // Preisgeld wächst mit deinem Imperium mit
  money = Math.round(money);
  if (money) { MK.earn(money); MK.Scene.particle('coin', MK.Scene.W * .3, MK.Scene.H * .5, 14); }
  const tanB = (c.me.L.tan || 0) * .35; // Bühnenpräsenz: Bräune bringt Ruhm – unabhängig vom Hautton
  let fameGot = fame ? MK.addFame(fame * (mod.fame || 1) * (1 + b.compFame + tanB)) : 0;
  if (win) { S.stats.wins++; MK.track('wins', 1); c.cheer = 3; c.scores = [0, 0, 0].map(() => Math.max(3, Math.min(10, rnd(7.6, 9.6) + tanB * 1.4 - (c.synth ? 1.6 : 0)))).map(v => (Math.round(v * 10) / 10).toLocaleString('de-DE')); MK.Scene.particle('confetti', MK.Scene.W / 2, MK.Scene.H * .3, 80); MK.Scene.fx.flash = 1; MK.Audio.play('win'); MK.Audio.play('cheer'); }
  else { S.stats.losses++; MK.Audio.play('lose'); }
  MK.Scene.say('player', MK.pickLine(MK.LINES.sit[win ? 'win' : 'loss'], win ? 'sw' : 'sl'), 3);
  // Rivale reagiert
  if (k.kind === 'rival') setTimeout(() => MK.Scene.say('player', MK.RIVAL.name + ': ' + MK.pickLine(MK.LINES.rival[win ? 'lost' : 'won'], win ? 'rl' : 'rw'), 3.5), 900);
  { // Ergebnis für die Einblendung im Gym (bei Turnieren erst am Ende der Serie)
    const unlocks = [...MK.DISC.filter(x => MK.discOpen(x) && !openBefore.includes(x.id)).map(x => 'Duell „' + x.name + '“'), ...MK.TOURNEYS.filter(x => MK.tourOk(x) && !tourBefore.includes(x.id)).map(x => 'Turnier „' + x.name + '“')];
    const g = Object.entries(d.groups).sort((a, b) => b[1] - a[1])[0], tip = `Tipp: ${MK.MUSCLES.find(m => m.id === g[0]).name} trainieren – zählt hier am meisten.`;
    const series = k.kind === 'tourney' || k.kind === 'event', endOfSeries = !series || !win || !k.next;
    if (series && C.lastRes && C.lastRes.sid === k.sid) { C.lastRes.money += money; C.lastRes.fame += fameGot; C.lastRes.unlocks.push(...unlocks); Object.assign(C.lastRes, { win, round: k.round, rounds: k.rounds, tip, show: endOfSeries }); }
    else C.lastRes = { sid: k.sid, kind: k.kind, win, disc: d.name, opp: c.oppName, money, fame: fameGot, unlocks, tip, tname: k.tname, round: k.round, rounds: k.rounds, show: endOfSeries }; }
  const next = k.next && win;
  const tw = win ? 'Gewonnen!' : 'Verloren!';
  const rew = [money ? `+${MK.fmt(money)} €` : '', fameGot ? `+${MK.fmt1(fameGot)} Ruhm${tanB > .01 ? ` (Bräune +${Math.round(tanB * 100)} %)` : ''}` : ''].filter(Boolean).join(' · ');
  el.innerHTML = `<div class="c-res ${win ? 'w' : 'l'}"><h3>${tw}</h3><div class="c-big">${d.id === 'arm' ? (win ? 'Arm auf dem Tisch!' : 'Dein Arm liegt unten') : MK.fmt1(c.score) + ' / ' + MK.fmt1(c.goal)}</div>
    <p>${rew || (win ? '' : 'Trainier weiter und versuch es nochmal.')}</p>${k.extraMsg && win ? `<p>${k.extraMsg}</p>` : ''}
    <button class="btn ok" id="cOk">${next ? 'Nächste Runde' : 'Weiter'}</button></div>`;
  document.getElementById('cOk').onclick = () => { const cb = k.onEnd; if (next) { k.next(); } else { C.close(); } if (cb) cb(win, c); };
  MK.checkAch(); MK.save(); MK.emit('compEnd', c);
};
C.close = function () { C.cur = null; el.hidden = true; el.innerHTML = ''; MK.emit('compClose'); };
C.abort = function () { if (!C.cur) return; C.close(); };

/* ---------- Einstiege ---------- */
const ENERGY = 15;
C.canAfford = () => true; // Wettkämpfe kosten keine Energie mehr
C.single = function (discId, idx) {
  const S = MK.S, d = MK.DISC.find(x => x.id === discId);
  C.start({ disc: discId, idx, kind: 'single' }); return true;
};
C.tourney = function (tid) {
  const S = MK.S, T = MK.TOURNEYS.find(x => x.id === tid);
  if (!MK.tourOk(T) || !MK.spend(MK.tourFee(T))) return false;
  const list = T.list.slice();
  const go = () => runSeries({ list, base: T.tier, name: T.name, kind: 'tourney', onWin: () => { const first = !S.trophies[T.id]; S.trophies[T.id] = (S.trophies[T.id] || 0) + 1; if (first) { S.title = 't_' + T.id; MK.emit('newTitle', T); } S.stats.tourneys++; MK.track('tourney', 1); const rw = MK.tourReward(T); MK.reward(rw); if (C.lastRes) Object.assign(C.lastRes, { title: first ? T.title : null, reward: MK.rewardText(rw), opens: first ? [...MK.BIZ.filter(B => B.lic === T.id).map(B => B.icon + ' ' + B.name), ...MK.GYMS.filter(x => (x.req || []).some(r => r.trophy === T.id)).map(x => x.name)] : [] }); MK.emit('trophy', Object.assign({}, T, { reward: rw })); } });
  // Dopingkontrolle: nur wer etwas im Blut hat. Bestochener Richter = garantiert rein.
  if (MK.labNeedsTest && MK.labNeedsTest()) {
    if (S.bribe > 0) { S.bribe = 0; MK.UI.toast('Der Kampfrichter schaut weg … Günther hat geliefert.', 'big'); MK.Audio.play('psst'); go(); }
    else MK.DT.run({ tier: T.tier, onEnd: win => { if (win) go(); else { MK.UI.toast(`Positiv! ${T.name} ohne dich – Startgeld weg, aber keine Sperre.`, 'big'); MK.save(); MK.UI.refresh(); } } });
  } else go();
  return true;
};
C.event = function () {
  const S = MK.S, ev = C.weekEvent();
  if (!MK.eventOpen() || (S.event.week === MK.week() && S.event.done)) return false;
  const open = MK.DISC.filter(MK.discOpen), r = MK.seedRand('ev' + MK.week());
  const list = [0, 1, 2].map(() => open[Math.floor(r() * open.length)].id);
  const tier = clamp(Math.floor(MK.totalLv() / 45), 0, 5);
  runSeries({ list, base: tier, name: 'Wochen-Event', kind: 'event', mod: ev.mod, onWin: () => { S.event = { week: MK.week(), done: true }; if (!S.events.includes(ev.top)) S.events.push(ev.top); MK.reward({ fame: 30, money: 300 + MK.totalLv() * 10, sp: 1 }); MK.emit('eventWon', ev); } });
  return true;
};
C.weekEvent = function () { const r = MK.seedRand('event' + MK.week()); const e = MK.EVENTS[Math.floor(r() * MK.EVENTS.length)]; const top = MK.EVENT_TOPS[Math.floor(r() * MK.EVENT_TOPS.length)]; return Object.assign({ top }, e); };
function runSeries(o) {
  let round = 0; const sid = Date.now() + Math.random(); C.lastRes = null;
  const go = () => {
    const idx = clamp(o.base + round, 0, 7), last = round === o.list.length - 1;
    C.start({ disc: o.list[round], idx, kind: o.kind, tname: o.name, mod: o.mod, round, rounds: o.list.length, sid: sid, name: MK.DISC.find(d => d.id === o.list[round]).opp[idx],
      next: last ? null : () => { round++; go(); }, extraMsg: last ? '🏆 Turniersieg!' : null,
      onEnd: (win) => { if (win && last) o.onWin(); } });
  };
  go();
}
C.rival = function () {
  const S = MK.S;
  const open = MK.DISC.filter(MK.discOpen), d = open[Math.floor(Math.random() * open.length)];
  const idx = clamp(Math.floor(S.rival.tot / 32) + S.gym, 0, 7);
  S.rival.next = Date.now() + rnd(18, 28) * 60e3;
  C.start({ disc: d.id, idx, kind: 'rival', name: MK.RIVAL.full, look: MK.RIVAL.look, seed: 'rival' + S.gym });
  return true;
};

})(window.MK);
