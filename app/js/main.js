/* Muskelklicker – Start, Eingabe, Spielschleife, Zeitgeber */
window.MK = window.MK || {};
(function (MK) {
const $ = id => document.getElementById(id);
const rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
const Sc = MK.Scene, U = MK.UI;

function boot() {
  MK.load(); const S = MK.S;
  if (S.upRefundNew) { const r = S.upRefundNew; delete S.upRefundNew; setTimeout(() => MK.UI.toast(`Neu: Griffkraft & Co. sind jetzt im Skillbaum – ${MK.fmt(r)} € zurück!`, 'big'), 1800); }
  MK.ensureQuests();
  const off = MK.offline();
  Sc.init($('cv')); MK.Fx.init();
  MK.Comp.init($('comp'));
  U.initLayout(); U.tabs(); MK.guideInit && MK.guideInit(); U.training(); U.refresh();
  bind(); events(); U.offline(off);
  if (S.verSeen !== 6) { const isNew = !S.stats || !S.stats.reps; S.verSeen = 6; if (!isNew) setTimeout(() => U.toast('Update: Power-Anzeige, Technik-Stufen ×2, Gewichte ×1,3 je Stufe, Offline-Training & flüssigere Animationen!', 'big'), off ? 4200 : 2600); }
  // Erste Sprüche: Günther begrüßt
  setTimeout(() => Sc.say('guenther', MK.pickLine(MK.LINES.npc.guenther[npcPhase()], 'ng' + npcPhase()), 4), 1200);
  if (document.fonts) document.fonts.ready.then(() => Sc.resize());
  requestAnimationFrame(loop);
}

/* ---------- Eingabe ---------- */
let empDrag = null;
/* Großer Bildschirm: alles automatisch hochskalieren (Zoom), damit das Spiel den Platz nutzt. Handy bleibt unverändert. */
function fitScreen() { const app = document.querySelector('.app'), de = document.documentElement; if (!app) return;
  if (innerWidth <= 900) { app.style.zoom = ''; de.style.removeProperty('--vh'); de.style.removeProperty('--appw'); return; }
  const z = Math.max(1, Math.min(2.4, innerWidth / 1320, innerHeight / 930));
  app.style.zoom = z; de.style.setProperty('--vh', (innerHeight / 100 / z) + 'px'); de.style.setProperty('--appw', Math.round(Math.max(1280, Math.min(1640, innerWidth / z - 40))) + 'px');
  Sc.resize && Sc.resize(); }
addEventListener('resize', fitScreen);
function bind() {
  fitScreen();
  const cv = $('cv');
  cv.addEventListener('pointerdown', e => {
    e.preventDefault(); MK.Audio.unlock();
    if (MK.Comp.cur) { if (!MK.Comp.cur.finished) MK.Comp.tap(); return; }
    const r = cv.getBoundingClientRect(), q = Sc.unzoom(e.clientX - r.left, e.clientY - r.top), x = q.x, y = q.y;
    if (U.view && U.view() === 'biz') { empDrag = { y: e.clientY, sy: e.clientY, x, yy: y, moved: false }; return; }
    if (U.tab && U.tab() === 'ward') { Sc.wardSpin(); return; }
    const g = Sc.hitTarget(x, y); if (g) return collect(g);
    if (!MK.touchUI()) { // PC: Dinge in der Szene direkt anklicken. Handy: dafür gibt es runde Knöpfe am Bühnenrand (sceneBtns)
    const gR = Sc.guRect; if (gR && x >= gR.x && x <= gR.x + gR.w && y >= gR.y && y <= gR.y + gR.h) { return MK.bribeOpen(); } // Hausmeister Günther antippen
    const bR = Sc.boomRect; if (bR && MK.S.eq.boombox && x >= bR.x && x <= bR.x + bR.w && y >= bR.y && y <= bR.y + bR.h) { MK.Audio.play('pop'); return U.openExtra('music'); }
    const tR = Sc.trainerRect; if (tR && MK.trainerRate() && x >= tR.x && x <= tR.x + tR.w && y >= tR.y && y <= tR.y + tR.h) { MK.Audio.play('pop'); return U.openExtra('trainer'); }
    const kR = Sc.kuehlRect; if (kR && MK.S.eq.kuehl && x >= kR.x && x <= kR.x + kR.w && y >= kR.y && y <= kR.y + kR.h) { MK.Audio.play('pop'); return U.openExtra('fridge'); }
    }
    rep(x, y);
  });
  cv.addEventListener('pointermove', e => { if (!empDrag) return; const d = empDrag.y - e.clientY; if (Math.abs(e.clientY - empDrag.sy) > 8) empDrag.moved = true; if (empDrag.moved) Sc.empireScroll(d); empDrag.y = e.clientY; });
  cv.addEventListener('contextmenu', e => e.preventDefault()); // langes Drücken öffnet kein Menü
  const wrel = () => Sc.wardRelease && Sc.wardRelease(); cv.addEventListener('pointerleave', wrel); addEventListener('pointerup', wrel); addEventListener('pointercancel', wrel);
  cv.addEventListener('pointerup', () => { if (!empDrag) return; const d = empDrag; empDrag = null; if (d.moved) return; const id = Sc.empireHit(d.x, d.yy); if (id) U.openBiz(id); else rep(d.x, d.yy); });
  cv.addEventListener('pointercancel', () => { empDrag = null; });
  cv.addEventListener('wheel', e => { if (U.view && U.view() === 'biz' && !MK.Comp.cur) { e.preventDefault(); Sc.empireScroll(e.deltaY); } }, { passive: false });
  addEventListener('keydown', e => {
    if (e.code !== 'Space' || /input|textarea|select|button/i.test(e.target.tagName)) return;
    e.preventDefault(); if (e.repeat) return; // Gedrückthalten zählt nicht – jede Wiederholung ist ein eigener Tastendruck
    MK.Audio.unlock();
    if (MK.Comp.cur) MK.Comp.keyTap(); else rep();
  });
  $('spBtn').onclick = () => U.openSkills(); $('dshopBtn').onclick = () => U.openExtra('dshop'); $('labBtn').onclick = () => U.openExtra('lab');
  $('skClose').onclick = () => { $('skills').hidden = true; };
    addEventListener('keydown', e => { if (e.key === 'Escape') $('skills').hidden = true; });
  // Tab im Hintergrund: speichern, Zeichnen ruht. Beim Zurückkommen läuft die Zeit als Offline-Fortschritt nach (wie beim Neustart).
  addEventListener('visibilitychange', () => { if (document.hidden) { MK.save(); return; } const off = MK.offline(); if (off) { U.offline(off); MK.save(); } last = performance.now(); });
  addEventListener('beforeunload', MK.save);
  addEventListener('pagehide', MK.save);
}

/* ---------- Wiederholung ---------- */
let lowWarn = 0, streak = 0, lastRepT = 0, lastBreath = 0, breathIn = false, holdC = 0, rhyC = 0, warnT = 0;
function rep(x, y) {
  const S = MK.S, ex0 = MK.curEx(), now0 = performance.now();
  let extra = 1, tag = null;
  // Plank: im Takt weitertippen hält die Spannung (bis ×2), Pause = von vorn
  if (ex0 && ex0.hold && MK.exOpen(ex0)) { holdC = now0 - lastRepT < 1100 ? holdC + 1 : 0; extra *= 1 + Math.min(1, holdC / 30); Sc.vis.hold = holdC; }
  // Seilspringen: im Takt der Musik tippen
  if (ex0 && ex0.anim === 'rope' && MK.exOpen(ex0)) { const e = Sc.beatErr(now0); if (e < .1) { rhyC++; extra *= 1.4 + Math.min(.6, rhyC * .04); tag = rhyC > 2 ? 'TAKT ×' + rhyC : 'TAKT!'; } else { if (rhyC > 3) tag = 'RAUS!'; rhyC = 0; } Sc.vis.rhy = rhyC; }
  // Satz: jede 12. Wiederholung einer Serie ist die letzte – langsam, zittrig, mit Bonus
  const nStreak = now0 - lastRepT < 1000 ? streak + 1 : 1, last = nStreak % 12 === 0 && !(ex0 && (ex0.hold || ex0.kg === 'cardio'));
  if (last) extra *= 1.6;
  const r = MK.doRep(extra);
  if (r.fail === 'locked') { // Übung nicht verfügbar → klar sagen, was fehlt
    if (performance.now() - lowWarn > 2500) { lowWarn = performance.now(); const ex = MK.curEx(); const q = ex && ex.eq && !S.eq[ex.eq] ? MK.EQUIP.find(e => e.id === ex.eq) : null;
      U.toast(q ? `Braucht: ${q.name}` : 'Wähle eine Übung'); MK.Audio.play('error'); }
    return; }
  if (r.fail) return;
  Sc.startRep(S.stats.reps); if (MK._auto) Sc.autoT = performance.now(); else MK.Fx.lastTap = performance.now();
  if (last) { Sc.vis.lastRep = true; if (Sc.vis.ph < 0) Sc.vis.ph = .0001; } // letzte Wdh. im Satz: langsam, ohne die laufende Bewegung abzubrechen
  Sc.vis.fatigue = Math.min(1, nStreak / 45);
  Sc.vis.pump = Sc.vis.pump || {}; Sc.vis.pump[r.ex.g] = Math.min(1, (Sc.vis.pump[r.ex.g] || 0) + .045 + r.wi * .004);
  const G = Sc.geo(), ex = r.ex, heavy = r.wi >= 8;
  const hx = x != null ? x : G.px + rnd(-40, 40), hy = y != null ? y : G.py - 200 * G.pScale;
  const px = hx + rnd(-20, 20); Sc.pop('+' + MK.fmtS(r.xp) + ' XP', px, hy, { col: S.beastOn > 0 ? '#ff6b3d' : '#ffd23f', big: r.crit });
  { const P = MK.Fx.fromScene(px, hy - 8); MK.Fx.orb('xp', r.xp, P.x, P.y, { g: ex.g, auto: MK._auto }); } // XP-Kugel: sammelt sich, fliegt in der Pause in den Balken
  if (ex.kg === 'cardio') MK.Audio.play('step'); else MK.Audio.play('clank', r.wi);
  if (heavy && Math.random() < .35) MK.Audio.play('grunt');
  if (['bb', 'cable'].includes(ex.kg) || r.wi >= 6) Sc.particle('chalk', G.px + rnd(-60, 60) * G.pScale, G.py - rnd(140, 240) * G.pScale, 2);
  if (S.sweat > .5 && Math.random() < .3) Sc.particle('sweat', G.px + rnd(-20, 20) * G.pScale, G.py - 270 * G.pScale, 2);
  if (r.crit) { Sc.burst(pick(['PERFEKT!', 'SAUBER!', 'WUMMS!', 'ZACK!'])); Sc.zoomKick(.07); Sc.particle('spark', hx, hy, 18); MK.Audio.play('crit'); Sc.vis.cheer = 1.2; Sc.fx.flash = .5; Sc.fx.flashCol = '255,210,63'; if (Math.random() < .02) speakSit('crit'); }
  else if (S.stats.reps % 11 === 0 && Math.random() < .5) Sc.burst(pick(['PUMP!', 'UFF!', 'HAU REIN!', 'POW!']));
  if (r.cash) { const cx = hx + rnd(-30, 30); Sc.pop('+' + MK.fmtS(r.cash) + ' €', cx, hy + 26, { col: '#7CFC8A' }); const P = MK.Fx.fromScene(cx, hy + 20); MK.Fx.orb('coin', r.cash, P.x, P.y, { auto: MK._auto }); }
  if (tag) Sc.pop(tag, G.px + rnd(-50, 50), G.py - 260 * G.pScale, { col: tag === 'RAUS!' ? '#ee4035' : '#7fe3ff' });
  if (last) { Sc.burst('LETZTE!', '#ff8a3d'); MK.Audio.play('grunt'); setTimeout(() => { Sc.pop('Satz geschafft!', G.px, G.py - 300 * G.pScale, { col: '#2bb673', big: 1 }); }, 650); }
  if (r.unsafe && now0 - warnT > 9000) { warnT = now0; const w = MK.weak(ex); Sc.pop('Wackelig!', G.px + 60, G.py - 230 * G.pScale, { col: '#ee4035' }); if (w && Math.random() < .5) { const sp = speaker(); if (sp != null) Sc.say(sp, MK.pickLine(MK.LINES.strain[ex.g] || MK.LINES.strain.arme, 'stw' + ex.g), 3.5); } }
  // Atmung im Takt: abwechselnd ein/aus, schwere Gewichte = stärker gepresst
  const now = performance.now(); streak = now - lastRepT < 1000 ? streak + 1 : 1; lastRepT = now;
  if (now - lastBreath > 620) { lastBreath = now; breathIn = !breathIn; MK.Audio.play(breathIn ? 'inhale' : 'exhale', Math.min(1, r.wi / 14 + streak / 200)); }
  if (S.stats.reps === 5) U.tutEvent('reps5');
  if (S.stats.reps % 6 === 0) U.quick();
}
/* Boombox antippen: Aus → Song 1 → Song 2 … → Aus */
function boombox() {
  const S = MK.S, own = MK.MUSIC.filter(m => S.music.owned.includes(m.id) && S.eq.boombox >= m.bl);
  if (!S.music.on) { S.music.on = true; S.music.cur = own[0].id; }
  else { const i = own.findIndex(m => m.id === S.music.cur); if (i < own.length - 1) S.music.cur = own[i + 1].id; else S.music.on = false; }
  MK.dirty(); MK.Audio.music(); MK.Audio.play('pop'); Sc.boomHint = 2.5;
  U.toast(S.music.on ? '♪ ' + MK.MUSIC.find(m => m.id === S.music.cur).name : 'Musik aus'); MK.save();
}
function collect(g) {
  const S = MK.S, b = MK.bonus(), mul = 1 + (b.bonusMul || 0), k = g.T.k; let msg = '';
  if (k === 'protein') { const e = .2 * mul; S.pump = Math.min(.99, S.pump + e); msg = `+${Math.round(e * 100)} % Pump`; }
  if (k === 'coin') { const m = Math.round((5 + MK.totalLv() * 1.5 + MK.income() * 15) * mul); MK.earn(m, true); msg = `+${MK.fmt(m)} €`; Sc.particle('coin', g.x, g.y, 8); MK.Audio.play('coin'); }
  if (k === 'star') { const ex = MK.curEx(); if (ex) { const xp = MK.need(S.m[ex.g].lv, ex.g) * .15 * mul; MK.gain(ex.g, xp); msg = `+${MK.fmt(xp)} XP`; } }
  if (k === 'towel') { S.sweat = 0; const f = MK.addFame(1 * mul); msg = `Frisch! +${MK.fmt1(f)} Ruhm`; }
  if (k === 'dia') { S.dia += Math.round(1 * mul); msg = '+' + Math.round(mul) + ' 💎'; }
  S.stats.bonus++; MK.track('bonus', 1);
  Sc.pop(msg, g.x, g.y, { col: '#7fe3ff', big: 1 }); Sc.particle('spark', g.x, g.y, 12); if (k !== 'coin') MK.Audio.play('pop');
  U.quick();
}

/* ---------- Sprüche-Takt ---------- */
const npcPhase = () => { const st = MK.stage(); return st <= 1 ? 0 : st <= 3 ? 1 : 2; };
function speakSit(k) { const sp = speaker(); if (sp != null) Sc.say(sp, MK.pickLine(MK.LINES.sit[k], 's' + k), 3.5); }
function speaker() {
  const S = MK.S, opts = [];
  Sc.crowd.forEach((p, i) => { if (p.mode === 'stay') opts.push(i); });
  MK.NPCS.forEach(n => { if (S.gym >= n.gym && Sc.npcHere(n.id)) opts.push(n.id); });
  return opts.length ? pick(opts) : null;
}
function imbalance() {
  const S = MK.S, open = MK.MUSCLES.filter(m => MK.groupOpen(m.id) && (m.unlock === 0 || S.m[m.id].lv > 1 || MK.totalLv() > m.unlock + 12));
  if (open.length < 3) return null;
  const avg = open.reduce((a, m) => a + S.m[m.id].lv, 0) / open.length; if (avg < 5) return null;
  const low = open.filter(m => S.m[m.id].lv < avg * .55).sort((a, b) => S.m[a.id].lv - S.m[b.id].lv);
  if (low.length) return low[0].id;
  if (open.every(m => S.m[m.id].lv >= avg * .8)) return 'balanced';
  return null;
}
let labT = 1, trAcc = 0, autoT = 1, lastSp = null, lineT = 45, memeT = 50, bonusT = 18, achT = 2, saveT = 5, uiT = 0, rivalT = 20, gevT = rnd(420, 780), ripT = 3, pLineT = 40;
function schedulers(dt) {
  if (lastSp === null) lastSp = MK.S.sp;
  const S = MK.S, st = MK.stage(), b = MK.bonus();
  // Sprüche (nicht während eines Wettkampfs)
  if (!MK.Comp.cur && (lineT -= dt) < 0) {
    lineT = rnd(75, 140);
    const imb = imbalance(), npcs = MK.NPCS.filter(n => S.gym >= n.gym && Sc.npcHere(n.id)), r = Math.random();
    if (imb && r < .35) { const sp = speaker(); if (sp != null) Sc.say(sp, imb === 'balanced' ? MK.pickLine(MK.LINES.balanced, 'bal') : MK.pickLine(MK.LINES.imb[imb], 'imb' + imb), 4.5); }
    else if (r < .6 && npcs.length) { const n = pick(npcs), ph = npcPhase(); Sc.say(n.id, MK.pickLine(MK.LINES.npc[n.id][ph], 'n' + n.id + ph), 4.5); }
    else if (r < .75 && Sc.npcHere('rival')) { const diff = S.rival.tot / Math.max(1, MK.totalLv()); const k = diff > 1.1 ? 'taunt' : diff > .9 ? 'even' : 'behind'; Sc.say('rival', MK.pickLine(MK.LINES.rival[k], 'r' + k), 4); }
    else if (Sc.crowd.some(p => p.mode === 'stay')) { const ws = Sc.crowd.map((p, i) => p.mode === 'stay' ? i : -1).filter(i => i >= 0); Sc.say(ws[Math.floor(Math.random() * ws.length)], MK.pickLine(MK.LINES.stage[st], 'st' + st), 4.5); }
    else if (npcs.length && Sc.npcHere('guenther')) { Sc.say('guenther', MK.pickLine(MK.LINES.npc.guenther[npcPhase()], 'ng' + npcPhase()), 4.5); }
    if (S.sweat > .75 && Math.random() < .04) setTimeout(() => speakSit('sweat'), 1500);
    if (S.music.on && S.eq.boombox && Math.random() < .015) setTimeout(() => speakSit('music'), 2500);
    if (S.pet && Math.random() < .02) setTimeout(() => speakSit('pet'), 2000);
    const ex = MK.curEx(); if (ex && ex.kg === 'cardio' && Math.random() < .02) setTimeout(() => speakSit('cardio'), 1000);
  }
  // Memes / virale Clips
  if (!MK.Comp.cur && (memeT -= dt * (1 + (b.viral || 0))) < 0) {
    memeT = rnd(70, 140);
    const filming = Sc.crowd.some(p => p.mode === 'stay' && (p.acts[0] === 'film' || p.acts[0] === 'point')) || S.gym >= 2;
    if (filming && performance.now() - Sc.vis.last < 20000) {
      const viral = st >= 3 || (st === 2 && Math.random() < .5);
      const cap = pick(viral ? MK.LINES.viral : MK.LINES.memes), fame = MK.addFame(viral ? 5 + st * 4 : 1 + st);
      if (viral) S.stats.virals++; else S.stats.memes++;
      U.meme(viral ? 'viral' : 'meme', cap, fame); MK.Audio.play('meme'); U.quick();
    }
  }
  // Bonus-Gegenstände (beim Rohrbruch liegen Münzen in den Pfützen)
  const gv = MK.gev();
  if ((bonusT -= dt * (1 + (b.bonusRate || 0)) * (gv === 'rohr' ? 6 : 1)) < 0) { bonusT = rnd(25, 45); if (performance.now() - Sc.vis.last < 30000) Sc.spawnTarget(gv === 'rohr' ? 'coin' : null); }
  // Trainingspartner trainiert mit, solange du aktiv bist
  // Kevin trainiert ab und zu mit: 25 s Duett, +25 % XP
  if (S.partner.lv && !MK.Comp.cur) { const nowD = Date.now(), D2 = S.duet; if (!D2.next) D2.next = nowD + 40e3;
    if (!MK.duetOn() && nowD > D2.next && performance.now() - Sc.vis.last < 8000 && U.view() !== 'biz') { D2.until = nowD + 25e3; D2.next = nowD + rnd(90, 160) * 1000; Sc.burst('DUETT! +25 % XP', '#7CFC8A'); MK.Audio.play('cheer'); MK.dirty(); if ((pLineT -= 1) < 0) { pLineT = 2; setTimeout(() => Sc.say('partner', MK.pickLine(MK.LINES.partner, 'pt'), 3), 600); } } }
  // Seltene Gym-Ereignisse
  if (!MK.Comp.cur && !gv && (gevT -= dt) < 0) { gevT = rnd(540, 960); if (performance.now() - Sc.vis.last < 20000 && MK.totalLv() >= 5) MK.startGymEvent(); }
  // Shirt spannt zu sehr → Naht reißt (einmal pro Oberteil)
  if ((ripT -= dt) < 0) { ripT = 3; const L = MK.Fig.resolveLook(S.look), D = MK.Fig.dims(MK.lvExact(), 0, 0); if (L.top && L.top.id && !S.ripSeen[L.top.id] && MK.Fig.stretchOf(D, L.top) > 1) { S.ripSeen[L.top.id] = 1; MK.Audio.play('rip'); U.toast('Ratsch! ' + L.top.name + ' ist zu klein', 'big'); const sp = speaker(); if (sp != null) Sc.say(sp, MK.pickLine(MK.LINES.rip, 'rip'), 4); } }
  // Rivale fordert heraus
  if ((rivalT -= dt) < 0) { rivalT = 5; U.rivalBanner(Date.now() > S.rival.next && !MK.Comp.cur && S.stats.reps > 120 && MK.unl('rival')); }
  // Skillpunkt-Meldung, egal woher der Punkt kommt
  if (S.sp > lastSp && !MK.Comp.cur && $('skills').hidden && $('offl').hidden) { U.spPop(S.sp - lastSp); lastSp = S.sp; } else if (S.sp < lastSp) lastSp = S.sp;
  // Nach langer Klickserie: kurz hecheln
  if (streak >= 30 && performance.now() - lastRepT > 1300 && !MK.Comp.cur) { const st = Math.min(1, streak / 160); MK.Audio.play('pant', st); Sc.vis.pantUntil = performance.now() + 1800 + st * 2400; Sc.setFace('tired', 1800 + st * 2400); streak = 0; }
  if ((achT -= dt) < 0) { achT = 2; MK.checkAch(); MK.ensureQuests(); }
  if ((labT -= dt) < 0) { labT = 1; MK.labSecond && MK.labSecond(1); MK.guideTick && MK.guideTick(); }
  if ((saveT -= dt) < 0) { saveT = 5; MK.save(); }
  // Personal Trainer: Wiederholungen automatisch, nur für die gerade gewählte Gruppe
  { const rate = MK.S.trainer.off ? 0 : MK.trainerRate() * (MK.labAutoMul ? MK.labAutoMul() : 1), ex = MK.curEx(); if (rate && !MK.Comp.cur && ex && MK.exOpen(ex) && !document.hidden && !Sc.vis.eat) { trAcc += dt * rate; let n = 0; MK._auto = true; try { while (trAcc >= 1 && n < 12) { trAcc -= 1; n++; rep(); } } finally { MK._auto = false; } } else trAcc = 0; }
  if ((autoT -= dt) < 0) { autoT = 1; const n = MK.autoUpgrade(); if (n) { MK.dirty && MK.dirty(); if (U.view && U.view() === 'biz') U.refresh(); } }
  if ((uiT -= dt) < 0) { uiT = .25; U.quick(); }
}

/* ---------- Ereignisse ---------- */
function events() {
  MK.on('levelup', d => { const m = MK.MUSCLES.find(x => x.id === d.g); Sc.vis.shineG = { g: d.g, t0: performance.now() }; Sc.burst('LEVEL UP!', '#2bb673'); Sc.fx.flash = 1; Sc.fx.flashCol = '255,210,63'; MK.Audio.play('level'); Sc.vis.cheer = 2; Sc.setFace('proud', 1400);
    U.toast(`${m.name} Level ${d.lv}!`); Sc.particle('spark', Sc.geo().px, Sc.H * .45, 20); U.training(); });
  MK.on('rank', name => { U.toast(`Neuer Rang: ${name}! +1 Skillpunkt`, 'big'); Sc.burst(name.toUpperCase() + '!', '#ff8fb1'); Sc.particle('confetti', Sc.W / 2, Sc.H * .3, 60); MK.Audio.play('cheer'); MK.Scene.buildCrowd(); });
  MK.on('sp', () => U.quick());
  // Technik-Meilenstein: ×2 XP auf die ganze Muskelgruppe
  MK.on('tech', d => { const m = MK.MUSCLES.find(x => x.id === d.ex.g), nm = MK.techName(d.lv - 1); Sc.burst('TECHNIK ' + nm.toUpperCase() + '!', '#ffd23f'); Sc.fx.flash = .8; Sc.fx.flashCol = '255,214,80'; Sc.zoomKick(.08);
    Sc.particle('confetti', Sc.W / 2, Sc.H * .3, 50); MK.Audio.play('level'); Sc.vis.cheer = 2.5; Sc.setFace('proud', 1600);
    U.toast(`${d.ex.name}: Technik ${nm}! ${m.name} ×2 XP (jetzt ×${MK.fmtS(d.mul)})`, 'big'); U.training(); const b = document.querySelector(`[data-ex="${d.ex.id}"]`); if (b) { b.classList.remove('techup'); void b.offsetWidth; b.classList.add('techup'); const a = MK.Fx.at(b); if (a) MK.Fx.burst(a.x, a.y, { gold: true, size: 1.2 }); } });
  // Gewicht gekauft: in die zuletzt genutzte Übung dieser Muskelgruppe wechseln, mit dem neuen Gewicht – dann Gold genau auf den Hanteln
  MK.on('wg', d => { const S = MK.S; if (MK.Comp.cur) return; const ex = MK.exById(S.ex[d.g]); const ex2 = ex && MK.exOpen(ex) ? ex : MK.EXERCISES.find(e => e.g === d.g && MK.exOpen(e));
    if (ex2) { S.g = d.g; S.ex[d.g] = ex2.id; S.w[ex2.id] = null; U.training(); Sc.vis.ph = -1; Sc.vis.idle = null; }
    if (U.view() === 'gym') setTimeout(() => Sc.newWeightFx(), 90); });
  // Jeder Geld-Kauf: Münzen fliegen vom Geld zum gedrückten Knopf, dann Gold-Konfetti
  MK.on('spent', n => { const b = MK.Fx.lastBtn; if (b && performance.now() - MK.Fx.lastBtnT < 900 && b.isConnected) { const big = Math.min(2, .8 + Math.log10(1 + n) * .1); MK.Fx.buy(b, { n: Math.round(5 + Math.min(9, Math.log10(1 + n) * 1.1)), big }); } });
  MK.on('beastEnd', () => { U.quick(); MK.Audio.muffle(false); });
  const bump = () => { const ch = document.getElementById('money').closest('.chip'); ch.classList.remove('bump'); void ch.offsetWidth; ch.classList.add('bump'); };
  MK.on('biz', e => { bump(); Sc.pop('+' + e.n + '× ' + e.B.icon, Sc.W * .5, Sc.H * .3, { col: '#c9b6ff', big: 1 }); });
  MK.on('bizUp', u => { bump(); Sc.burst(u.kind === 'click' ? 'KLICK-POWER!' : '×2 ' + u.B.icon, '#a78bfa'); Sc.particle('confetti', Sc.W / 2, Sc.H * .3, 30); });
  MK.on('photo', () => { Sc.fx.flash = .7; Sc.fx.flashCol = '255,255,255'; Sc.pop('📸 +Ruhm', Sc.W * .3, Sc.H * .35, { col: '#ffd23f' }); });
  MK.on('jackpot', v => { Sc.burst('JACKPOT!', '#ffd23f'); Sc.particle('coin', Sc.W / 2, Sc.H * .45, 24); MK.Audio.play('coin'); });
  MK.on('diaDrop', k => { Sc.pop('+' + (k || 1) + ' 💎', Sc.W * .5, Sc.H * .4, { col: '#7fd3ff', big: 1 }); MK.Audio.play('crit'); });
  MK.on('beast', () => { Sc.burst('BEAST MODE!', '#ee4035'); Sc.fx.flash = 1; Sc.fx.flashCol = '255,60,30'; MK.Audio.play('beast'); MK.Audio.muffle(true); Sc.zoomKick(.1); Sc.fx.shake = 6; Sc.vis.cheer = 3; if (Math.random() < .15) speakSit('beast'); });
  MK.on('ach', a => { U.toast(`🏆 Erfolg: ${a.name} · ${MK.rewardText(a.r)}`, 'big'); MK.Audio.play('level'); });
  MK.on('questDone', q => { U.toast('Aufgabe erledigt: ' + q.name); U.refresh(); });
  MK.on('fame', () => { const S = MK.S, n = Math.floor(Math.sqrt(S.fame) * .9); if (n !== MK._lastCrowdN) { MK._lastCrowdN = n; Sc.buildCrowd(); } });
  MK.on('compStart', c => { $('spPop').hidden = true; $('stage').classList.add('competing'); MK.Fx.flush(); U.vsIntro && U.vsIntro(c); });
  MK.on('compClose', () => { $('stage').classList.remove('competing'); U.refresh(); U.training(); const r = MK.Comp.lastRes; if (r && r.show) { r.show = false; setTimeout(() => MK.resultCard(r), 90); } });
  MK.on('compEnd', () => U.quick());
  MK.on('mile', m => { U.toast(`Meilenstein: ${MK.fmt(m.v)} € verdient! +${MK.fmt(m.d * 20)} Ruhm`, 'big'); MK.Audio.play('level'); Sc.particle('confetti', Sc.W / 2, Sc.H * .3, 40); });
  // Turniersieg & Titel zeigt jetzt die Ergebnis-Einblendung im Gym
  MK.on('newTitle', T => {});
  MK.on('eventWon', ev => { U.toast('Wochen-Event gewonnen! Neues Outfit', 'big'); });
  MK.on('skill', () => MK.Scene.buildCrowd());
  MK.on('strain', st => { const m = MK.MUSCLES.find(x => x.id === st.g), w = MK.MUSCLES.find(x => x.id === st.by); U.toast(`Zerrung! ${m.name} halbe XP – trainier ${w.name}`, 'big'); MK.Audio.play('error'); Sc.setFace('sad', 2000); Sc.fx.shake = 5; U.weight(); });
  MK.on('tattoo', t => { U.toast(`Neues Tattoo verdient: ${t.name}!`, 'big'); MK.Audio.play('level'); Sc.particle('spark', Sc.geo().px, Sc.H * .4, 16); });
  MK.on('planDay', d => { U.toast(`Trainingsplan: ${d.day.n}-Tag geschafft! ${MK.rewardText(d.rew)}`, 'big'); Sc.particle('confetti', Sc.W / 2, Sc.H * .3, 40); MK.Audio.play('win'); U.training(); });
  MK.on('wchDone', w => { U.toast('Wochen-Challenge geschafft!', 'big'); MK.Audio.play('win'); U.refresh(); });
  MK.on('gymEvent', e => { U.toast(`${e.name} ${e.desc}`, 'big'); MK.Audio.play(e.id === 'strom' ? 'power' : 'cheer'); const sp = e.id === 'rohr' ? 'guenther' : speaker(); if (sp != null) setTimeout(() => Sc.say(sp, MK.pickLine(MK.LINES.gev[e.id], 'gev' + e.id), 4), 900); if (e.id === 'kreide') Sc.particle('chalk', Sc.W / 2, Sc.H * .5, 30); });
  MK.on('labDone', d => { const it = MK.LAB.find(x => x.id === d.id); U.toast(`⚗️ ${it.name} ${d.lv === 1 ? 'erforscht' : 'Stufe ' + d.lv} – Reinheit ${Math.round(MK.labPur(d.id) * 100)} %`, 'big'); MK.Audio.play('labDone'); if (U.tab && U.tab() === 'lab') U.refresh(); MK.save(); });
  MK.on('labTake', id => { Sc.fx.flash = .4; Sc.fx.flashCol = '170,120,255'; Sc.burst(MK.LAB.find(x => x.id === id).name.toUpperCase() + '!', MK.LAB.find(x => x.id === id).col); });
  MK.on('labOff', id => { U.toast(`${MK.LAB.find(x => x.id === id).name} wirkt nicht mehr`); if (U.tab && U.tab() === 'lab') U.refresh(); });
  MK.on('rage', () => { Sc.burst('WUTANFALL!', '#a64dff'); Sc.fx.shake = 9; Sc.setFace('angry', 2200); MK.Audio.play('rage'); Sc.vis.rageUntil = performance.now() + 2200; });
  MK.on('newRival', R => { U.toast(`Neuer Rivale: ${R.full}`, 'big'); setTimeout(() => Sc.say('rival', MK.pickLine(MK.LINES.rival.taunt, 'rt'), 4), 1500); });
}

/* ---------- Weicher Wechsel Gym ↔ Imperium/Umkleide ----------
   Die Bühne gleitet von der alten auf die neue Höhe, das alte Bild blendet über dem neuen aus – kein Springen, kein Flackern. */
let morphT = 0;
function morphStage(apply) {
  const st = $('stage'), cv = $('cv'), view = $('view');
  if (MK.S.set.reduce || matchMedia('(prefers-reduced-motion: reduce)').matches || !st.offsetHeight) { apply(); return; }
  const h0 = st.offsetHeight, ch = cv.clientHeight, cw = cv.clientWidth;
  const snap = document.createElement('canvas'); snap.width = cv.width; snap.height = cv.height; try { snap.getContext('2d').drawImage(cv, 0, 0); } catch (e) { }
  snap.className = 'morphsnap'; snap.style.width = cw + 'px'; snap.style.height = ch + 'px'; view.appendChild(snap);
  apply();
  const h1 = st.offsetHeight; clearTimeout(morphT);
  st.style.transition = 'none'; st.style.height = h0 + 'px'; void st.offsetHeight;
  st.style.transition = 'height .34s cubic-bezier(.22,.9,.28,1)'; st.style.height = h1 + 'px';
  st.classList.add('morphing'); requestAnimationFrame(() => snap.classList.add('out'));
  morphT = setTimeout(() => { st.style.transition = ''; st.style.height = ''; st.classList.remove('morphing'); snap.remove(); Sc.resize(); }, 380);
}

/* ---------- Schleife ---------- */
let last = performance.now();
/* Akku: Bildrate passend zur Lage – Wettkampf und aktives Training flüssig, Leerlauf sparsam */
MK.fpsTarget = function () { const S = MK.S, nowp = performance.now(), V = Sc.vis;
  if (S.set.eco !== true) return 0; // 0 = jedes Bild des Bildschirms (60/90/120 Hz)
  const active = MK.Comp.cur || nowp - (V.last || 0) < 6000 || V.ph >= 0 || V.eat || S.beastOn > 0 || nowp - (MK._touchT || 0) < 3000 || (V.trK || 0) > .02;
  return active ? 0 : 30; };
const COARSE = matchMedia('(pointer: coarse)'); MK.ecoOn = () => { const v = MK.S.set.eco; return v == null ? COARSE.matches : !!v; }; // nur noch für die Bildschärfe (Auflösung), nicht für die Bildrate
/* Dynamische Auflösung: wird ein Bild zu teuer, sinkt kurz die Schärfe – die Bildrate bleibt flüssig */
let costE = 8, slowT = 0, fastT = 0;
function perfGuard(ms, dt) { costE += (ms - costE) * Math.min(1, dt * 4);
  if (costE > 13) { slowT += dt; fastT = 0; if (slowT > 1.5) { slowT = 0; const cur = MK.dprCap || Math.min(2, devicePixelRatio || 1); if (cur > 1.05) { MK.dprCap = Math.max(1, cur - .25); Sc.resize(); } } }
  else if (costE < 6 && MK.dprCap) { fastT += dt; slowT = 0; if (fastT > 6) { fastT = 0; MK.dprCap = MK.dprCap + .25 >= Math.min(2, devicePixelRatio || 1) ? null : MK.dprCap + .25; Sc.resize(); } }
  else { slowT = Math.max(0, slowT - dt); } }
addEventListener('pointerdown', () => { MK._touchT = performance.now(); }, { passive: true });
function loop(now) {
  if (document.hidden) { last = now; requestAnimationFrame(loop); return; }
  const fpsT = MK.fpsTarget(); if (fpsT && now - last < 1000 / fpsT - 3) { requestAnimationFrame(loop); return; }
  const dt = Math.min(.1, (now - last) / 1000); last = now; const t = now / 1000, c0 = performance.now();
  if (MK.DT && MK.DT.cur) { MK.tick(dt); MK.Fx.tick(dt); schedulers(dt); requestAnimationFrame(loop); return; } // Dopingkontrolle zeichnet selbst
  MK.tick(dt);
  const emp = !MK.Comp.cur && U.view && U.view() === 'biz'; if ($('stage').classList.contains('empire') !== emp) morphStage(() => { $('stage').classList.toggle('empire', emp); document.body.classList.toggle('empview', emp); Sc.resize(); });
  const wv = !MK.Comp.cur && U.tab && U.tab() === 'ward'; if ($('stage').classList.contains('wardview') !== wv) morphStage(() => { $('stage').classList.toggle('wardview', wv); document.body.classList.toggle('wardbody', wv); Sc.resize(); });
  if (MK.Comp.cur) MK.Comp.tick(dt, t); else if (emp) Sc.drawEmpire(dt, t); else if (wv) Sc.drawWard(dt, t); else Sc.drawGym(dt, t);
  perfGuard(performance.now() - c0, dt);
  MK.Fx.tick(dt);
  schedulers(dt); sceneBtns(dt, emp || wv);
  requestAnimationFrame(loop);
}

/* ---------- Handy: Gym-Dinge als kleine runde Knöpfe am Bühnenrand ----------
   Auf Touch-Geräten / schmalen Bildschirmen sind Kühlschrank, Boombox, Trainer und Hausmeister in der Szene NICHT anklickbar
   (sonst trifft man sie beim Trainieren aus Versehen) – die ganze Bühne ist Trainings-Fläche. Am PC bleibt alles wie gehabt. */
MK.touchUI = () => innerWidth <= 900 || !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
const SB_ICON = { gu: '<path d="M15 2.5l-5 12.5M5.5 15h8l2 6.5H3.5z"/>', music: '<rect x="3" y="7" width="18" height="12" rx="2"/><circle cx="8" cy="13" r="2.6"/><circle cx="16" cy="13" r="2.6"/><path d="M8 7V4h8v3"/>',
  fridge: '<path d="M7 3h10v18H7zM7 10h10M10 6v2M10 13v3"/>', trainer: '<circle cx="12" cy="5.5" r="2.5"/><path d="M6 21l2-9h8l2 9M8 12l-3-3M16 12l3-3"/>' };
const SB_NAME = { gu: 'Hausmeister', music: 'Musik', fridge: 'Küche', trainer: 'Trainer' };
let sbT = 0, sbKey = null;
function sceneBtns(dt, off) {
  if ((sbT -= dt) > 0) return; sbT = .3;
  const el = $('sceneBtns'); if (!el) return;
  const S = MK.S, on = MK.touchUI() && !off && !MK.Comp.cur;
  const L = on ? [Sc.guRect && 'gu', S.eq.boombox && Sc.boomRect && 'music', S.eq.kuehl && Sc.kuehlRect && 'fridge', MK.trainerRate() && Sc.trainerRect && 'trainer'].filter(Boolean) : [];
  const key = L.join(); if (key === sbKey) return; sbKey = key;
  el.innerHTML = L.map(id => `<button class="sbtn" data-sb="${id}" aria-label="${SB_NAME[id]}" title="${SB_NAME[id]}"><svg viewBox="0 0 24 24" aria-hidden="true">${SB_ICON[id]}</svg></button>`).join('');
  el.hidden = !L.length;
}
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-sb]'); if (!b) return; MK.Audio.unlock(); const id = b.dataset.sb;
  if (id === 'gu') return MK.bribeOpen(); MK.Audio.play('pop'); U.openExtra(id); });

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(window.MK);
