/* Muskelklicker – Spielstand, Formeln, Kernlogik */
window.MK = window.MK || {};
(function (MK) {
const KEY = 'muskelklicker_v3';

/* ---------- Ereignisse ---------- */
const ev = {};
MK.on = (n, f) => { (ev[n] = ev[n] || []).push(f); };
MK.emit = (n, d) => { (ev[n] || []).forEach(f => { try { f(d); } catch (e) { console.error(e); } }); };

/* ---------- Datum-Helfer ---------- */
const pad = n => String(n).padStart(2, '0');
MK.today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
MK.week = () => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7); const w1 = new Date(d.getFullYear(), 0, 4); return d.getFullYear() + '-W' + (1 + Math.round(((d - w1) / 864e5 - 3 + (w1.getDay() + 6) % 7) / 7)); };
MK.seedRand = seed => { let h = 2166136261; for (const ch of seed) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; }; };

/* ---------- Neuer Spielstand ---------- */
MK.fresh = () => ({
  v: 3, created: Date.now(), money: 0, dia: 0, sp: 0, fame: 0, gym: 0,
  m: Object.fromEntries(MK.MUSCLES.map(m => [m.id, { lv: 1, xp: 0 }])),
  g: 'arme', ex: { arme: 'curl', brust: 'liegestuetz', beine: 'squat', ausdauer: 'hampel', schulter: 'dbpress', bauch: 'crunch', ruecken: 'klimmzug', nacken: 'shrugs' },
  w: {}, wset: 1, wg: Object.fromEntries(MK.MUSCLES.filter(m => !m.stat).map(m => [m.id, 1])), eq: { hanteln: 1 },
  look: { skin: 's1', tan: 'tan0', hairc: 'h1', hair: 'kurz', beard: 'none', tattoo: 'none', top: 'tee-grau', bottom: 'b1', shoes: 'sh1', gloves: 'none', head: 'none', acc: 'none' },
  up: {}, cents: 0, bought: [], seen: [], skills: ['start'], spLv: 0, rankSeen: 0,
  pets: [], pet: null, buffs: [], compBuff: 0,
  music: { owned: ['lofi'], cur: 'lofi', on: true }, sponsor: null, biz: {}, bizUp: [], clickUp: 0, perk: {},
  beat: Object.fromEntries(MK.DISC.map(d => [d.id, 0])), wins: Object.fromEntries(MK.DISC.map(d => [d.id, 0])),
  trophies: {}, ach: {}, events: [],
  daily: { last: '', streak: 0, claimedDay: '' }, quests: { day: '', list: [], week: '', wlist: [] }, event: { week: '', done: false, round: 0 },
  rival: { gym: 0, tot: 8, wins: 0, losses: 0, next: Date.now() + 10 * 60e3 },
  stats: { reps: 0, crits: 0, beasts: 0, bonus: 0, wins: 0, losses: 0, earned: 0, spent: 0, play: 0, tourneys: 0, memes: 0, virals: 0, rivalWins: 0, levels: 0, best: 0, byG: {} },
  pump: 0, beast: 0, beastOn: 0, sweat: 0, tut: 0,
  set: { vol: .8, music: .45, sfx: .8, quality: 'hoch', reduce: false, shake: true },
  lseen: {}, last: Date.now()
});

MK.load = function () {
  let S = MK.fresh();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) S = MK.merge(S, JSON.parse(raw));
  } catch (e) { }
  // Skills aus älteren Versionen in Punkte umwandeln
  const known = new Set(MK.SKILLS.map(n => n.id)); let refund = 0;
  S.skills = (S.skills || ['start']).filter(id => { if (known.has(id)) return true; refund += MK.OLD_SKILL_COST[id] || 1; return false; });
  if (!S.skills.includes('start')) S.skills.unshift('start'); if (refund) { S.sp += refund; S.refunded = refund; }
  if (S.pump == null) S.pump = 0;
  MK.S = S; MK.ensureNew();
  return S;
};
MK.merge = function (f, d) {
  const out = Object.assign({}, f, d);
  ['m', 'ex', 'w', 'wg', 'eq', 'up', 'biz', 'perk', 'look', 'music', 'beat', 'wins', 'trophies', 'ach', 'daily', 'quests', 'event', 'rival', 'stats', 'set', 'lseen'].forEach(k => { out[k] = Object.assign({}, f[k], d[k] || {}); });
  MK.MUSCLES.forEach(m => { if (!out.m[m.id]) out.m[m.id] = { lv: 1, xp: 0 }; });
  out.stats.byG = Object.assign({}, (d.stats && d.stats.byG) || {});
  return out;
};
MK.save = function () { const S = MK.S; if (!S) return; S.last = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } };
MK.exportSave = () => { MK.save(); return btoa(unescape(encodeURIComponent(JSON.stringify(MK.S)))); };
MK.importSave = str => { const d = JSON.parse(decodeURIComponent(escape(atob(str.trim())))); if (!d || !d.m) throw new Error('Kein gültiger Spielstand'); MK.S = MK.merge(MK.fresh(), d); MK.ensureNew(); MK.save(); return true; };
MK.reset = () => { try { localStorage.removeItem('mk_intro_done'); } catch (e) { } MK.S = MK.fresh(); MK.ensureNew(); MK.save(); }; // Neustart: Einführung läuft wieder

/* ---------- Grundwerte ---------- */
/* Glatte Zahlen: immer AUFrunden – unter 10 auf ganze, unter 100 auf Fünfer, darüber auf 2 Stellen (739 → 740, 1.088 → 1.100, 28.786 → 29.000).
   2 Stellen weichen höchstens ~10 % von der Formel ab; auf 1 Stelle (800/1.000) gerundet wären Sprünge bis +100 % möglich (z. B. 1,01 Mio → 2 Mio) und die Kurve würde holprig. */
MK.nice = x => { if (!(x > 0)) return 0; if (x < 10) return Math.max(1, Math.ceil(x - 1e-9)); if (x < 100) return Math.ceil(x / 5 - 1e-9) * 5; const e = Math.pow(10, Math.floor(Math.log10(x)) - 1); return Math.ceil(x / e - 1e-9) * e; };
/* Glatte Zeiten (Sekunden): bis 10 min auf 30 s, bis 1 h auf 5 min, darüber auf 15 min */
MK.niceTime = s => s <= 60 ? Math.ceil(s / 15) * 15 : s <= 600 ? Math.ceil(s / 30) * 30 : s <= 3600 ? Math.ceil(s / 300) * 300 : Math.ceil(s / 900) * 900;
/* ---------- XP-Rechnung (Idle-Formel) ----------
   Produktion = Grundwert × Gewicht-Faktor (×1,3 je Stufe) × Technik (×2 je Meilenstein) × Boni
   Damit das Tempo gleich langsam bleibt, wächst der Bedarf je Level genau um den Faktor, um den ein
   typischer Spieler auf diesem Level stärker geworden ist (Modell unten). Wer mehr Gewichte kauft oder mehr
   Technik sammelt, ist schneller – Käufe lohnen sich spürbar. */
MK.XP_BASE = 1 / 1.3; MK.W_FAC = 1.3; // so bringt die erste Wiederholung genau 1 XP (Startgewicht ist Stufe 1)
MK.needOld = lv => 70 * Math.pow(lv, 2.3) * Math.pow(1.075, lv);
MK.TECH_T = i => i < 4 ? [100, 500, 2000, 10000][i] : 10000 * Math.pow(5, i - 3); // 100 / 500 / 2.000 / 10.000, danach Meister-Stufen ×5
MK.TECH_NAMES = ['Bronze', 'Silber', 'Gold', 'Platin', 'Meister I', 'Meister II', 'Meister III', 'Meister IV', 'Meister V', 'Meister VI', 'Meister VII', 'Meister VIII'];
MK.techName = i => MK.TECH_NAMES[i] || 'Meister ' + (i - 3);
MK.techLvOf = r => { let i = 0; while (r >= MK.TECH_T(i)) i++; return i; };
MK.techLv = id => MK.techLvOf(((MK.S.stats || {}).byEx || {})[id] || 0);
MK.techCount = g => MK.EXERCISES.reduce((a, e) => a + (e.g === g ? MK.techLv(e.id) : 0), 0);
MK.techMul = g => Math.pow(2, MK.techCount(g));
const NEEDT = {};
(function buildNeed() { // Modell eines typischen Spielers je Muskelgruppe: trainiert immer die neueste Übung, kauft Gewichte ~ Level × 0,55
  MK.MUSCLES.forEach(m => { const exs = MK.EXERCISES.filter(e => e.g === m.id).sort((a, b) => a.lv - b.lv), cardio = exs[0] && exs[0].kg === 'cardio';
    const reps = {}, t = [0]; exs.forEach(e => reps[e.id] = 0);
    for (let lv = 1; lv <= 400; lv++) {
      const w = Math.min(MK.WEIGHTS.length - 1, cardio ? Math.floor(lv / 3) : lv * .55), cur = exs.filter(e => e.lv <= lv).pop() || exs[0];
      const M = exs.reduce((a, e) => a + MK.techLvOf(reps[e.id]), 0);
      const scale = MK.XP_BASE * Math.pow(MK.W_FAC, w) / (1 + .32 * w) * Math.pow(2, M);
      t[lv] = MK.nice(MK.needOld(lv) * scale); // glatt aufgerundet
      reps[cur.id] += MK.needOld(lv) / ((1 + .32 * w) * cur.xm * 1.6); // so viele Wdh. bräuchte man auf diesem Level (alte Rechnung)
    }
    NEEDT[m.id] = t; });
})();
MK.need = (lv, g) => { const t = NEEDT[g || 'arme']; return lv < t.length ? t[lv] : MK.nice(t[t.length - 1] * Math.pow(1.3, lv - t.length + 1)); };
/* Power = alle jemals gesammelten Muskel-XP (wird beim Training live hochgezählt) */
const CUM = {}; MK.cumNeed = (g, lv) => { const c = CUM[g] || (CUM[g] = [0, 0]); for (let l = c.length; l <= lv; l++) c[l] = c[l - 1] + MK.need(l - 1, g); return c[lv]; };
MK.power = () => MK.MUSCLES.reduce((a, m) => { const x = MK.S.m[m.id]; return a + MK.cumNeed(m.id, x.lv) + x.xp; }, 0);
MK.lvExact = () => Object.fromEntries(MK.MUSCLES.map(m => { const x = MK.S.m[m.id]; return [m.id, x.lv + Math.min(.999, x.xp / MK.need(x.lv, m.id))]; }));
MK.totalLv = () => MK.MUSCLES.reduce((a, m) => a + MK.S.m[m.id].lv - 1, 0);
MK.rankIdx = () => { const t = MK.totalLv(); let r = 0; MK.RANKS.forEach(([n], i) => { if (t >= n) r = i; }); return r; };
MK.rankName = () => MK.RANKS[MK.rankIdx()][1];
MK.stage = () => MK.RANK_STAGE[MK.rankIdx()];
MK.groupOpen = id => MK.totalLv() >= MK.MUSCLES.find(m => m.id === id).unlock;
MK.exById = id => MK.EXERCISES.find(e => e.id === id);
MK.exOpen = e => MK.groupOpen(e.g) && MK.S.m[e.g].lv >= e.lv && (!e.eq || (MK.S.eq[e.eq] || 0) > 0);
MK.curEx = () => MK.exById(MK.S.ex[MK.S.g]);
const BIGN = [[1e33, 'Qtd'], [1e30, 'Quint'], [1e27, 'Qrd'], [1e24, 'Qua'], [1e21, 'Trd'], [1e18, 'Trio'], [1e15, 'Brd'], [1e12, 'Bio'], [1e9, 'Mrd'], [1e6, 'Mio']];
MK.fmt = n => { if (!isFinite(n)) return '∞'; n = Math.floor(n); for (const [v, nm] of BIGN) if (n >= v) { const x = n / v; return x.toFixed(x < 10 ? 2 : x < 100 ? 1 : 0).replace('.', ',') + ' ' + nm; } return n.toLocaleString('de-DE'); };
MK.fmt1 = n => (Math.round(n * 10) / 10).toLocaleString('de-DE');
/* Kurz für schnelle Zahlen (XP-Pops, Power): 12,4 Tsd · 3,20 Mio */
MK.fmtS = n => { if (!isFinite(n)) return '∞'; if (n < 100) return MK.fmt1(n); if (n < 1e4) return Math.round(n).toLocaleString('de-DE'); if (n < 1e6) { const x = n / 1e3; return x.toFixed(x < 100 ? 1 : 0).replace('.', ',') + ' Tsd'; } return MK.fmt(n); };

/* ---------- Boni sammeln (Skills, Haustier, Musik, Buffs) ---------- */
let _bc = null, _bt = 0;
MK.dirty = () => { _bc = null; };
MK.bonus = function () { const n = performance.now(); if (_bc && n - _bt < 250) return _bc; _bt = n; return (_bc = MK.bonusCalc()); };
MK.bonusCalc = function () {
  const S = MK.S, b = { xp: 0, crit: 0, critMul: 0, comp: 0, grip: 0, compTime: 0, pumpMax: 0, pumpDecay: 0, pumpGain: 0, beastDur: 0, beastMul: 0, offline: 0, fame: 0, money: 0, cash: 0, viral: 0, bonusRate: 0, bonusMul: 0, sponsor: 0, crowd: 0, shop: 0, dia: 0, bizInc: 0, bizCheap: 0, upCheap: 0, offBiz: 0, clickInc: 0, lvInc: 0, wXp: 0, weakXp: 0, holdXp: 0, strainLess: 0, safeW: 0, pumpCash: 0, mealDur: 0, beastCash: 0, beastCrit: 0, compFame: 0, twist: 0, eqCheap: 0, critCash: 0, fameXp: 0, jackpot: 0 };
  const ALIAS = { regen: 'pumpDecay', en: 'pumpMax', beastFill: 'pumpGain' }, SCALE = { en: .01 };
  const add = e => { for (const k in e) { const kk = ALIAS[k] || k; b[kk] = (b[kk] || 0) + e[k] * (SCALE[k] || 1); } };
  S.skills.forEach(id => { const n = MK.SKILLS.find(x => x.id === id); if (n) add(n.eff); });
  if (S.pet) { const p = MK.PETS.find(x => x.id === S.pet); if (p) { const f = 1 + .5 * (MK.petLv(p.id) - 1), e2 = {}; for (const kk in p.eff) e2[kk] = p.eff[kk] * f; add(e2); } }
  if (S.sponsor) { const sp = MK.SPONSORS.find(x => x.id === S.sponsor); if (sp && sp.boost) add(sp.boost); }
  (S.staff || []).forEach(id => { const st = MK.STAFF.find(x => x.id === id); if (st) add(st.eff); });
  b.xp += MK.kfaXp(); // mehr Körperfett = mehr Masse = mehr Muskel-XP (spürbar, aber moderat)
  if (S.music.on && S.eq.boombox) { const m = MK.MUSIC.find(x => x.id === S.music.cur); if (m) add(m.eff); }
  const now = Date.now();
  S.buffs = S.buffs.filter(x => x.until > now);
  b.xpMul = 1 + (b.allXp || 0); // Griffkraft (Skillbaum) wirkt auf alle XP
  for (const id in (S.perk || {})) { const P = MK.PERKS[id], L = S.perk[id]; if (!P || !L) continue; for (const k in P.eff) { if (k === 'xpMul') b.xpMul = (b.xpMul || 1) * Math.pow(P.eff[k], L); else b[k] = (b[k] || 0) + P.eff[k] * L; } }
  b.xpMul = (b.xpMul || 1) * MK.partnerMul();
  if (MK.gev && MK.gev() === 'kreide') b.crit += .03 + b.crit;
  if (MK.duetOn && MK.duetOn()) b.xp += .25;
  S.buffs.forEach(x => { if (x.k === 'xp' || x.k === 'xp2' || x.k === 'prep') b.xp += x.v; if (x.k === 'meal') { b.xp += x.v; b.pumpDecay += .5; } if (x.k === 'regen') b.pumpDecay += x.v; });
  return b;
};
/* ---------- Pump statt Energie ----------
   Jeder Klick füllt den Pump. Je voller, desto mehr XP und Geld pro Klick. Voll = Beast-Modus.
   Wer aufhört, verliert langsam Pump – Klicken ist aber nie gesperrt. Ausdauer macht den Pump stärker und stabiler. */
MK.pumpMax = () => .6 + Math.min(.9, (MK.S.m.ausdauer.lv - 1) * .012) + MK.bonus().pumpMax;            // Bonus bei vollem Pump (+60 % … )
MK.pumpMul = () => 1 + MK.S.pump * MK.pumpMax();
MK.pumpDecay = () => .07 * (1 - Math.min(.85, MK.bonus().pumpDecay + (MK.S.m.ausdauer.lv - 1) * .005)) * (MK.gev && MK.gev() === 'fans' ? .5 : 1) * (MK.labPumpDecay ? MK.labPumpDecay() : 1);
MK.pumpGain = fast => (fast ? .019 : .0075) * (1 + MK.bonus().pumpGain); // Beast-Modus braucht jetzt deutlich mehr schnelle Wiederholungen
MK.BEAST_CD = 60; // danach 60 s Abklingzeit
MK.energyMax = () => 100; MK.regen = () => 0;
MK.gymObj = () => MK.GYMS[MK.S.gym];
MK.fameMul = () => (1 + MK.bonus().fame) * MK.gymObj().fameMul * (MK.gev && MK.gev() === 'promi' ? 2 : MK.gev && MK.gev() === 'tv' ? 1.5 : 1) * (MK.labFameMul ? MK.labFameMul() : 1);
MK.shopMul = () => 1 - Math.min(.35, MK.bonus().shop);

/* Tagesthema: eine Muskelgruppe bekommt +10 % */
MK.dailyTheme = () => { const open = MK.MUSCLES.filter(m => MK.groupOpen(m.id)); const r = MK.seedRand('theme' + MK.today()); return open[Math.floor(r() * open.length)]; };

/* ---------- Gewichte ---------- */
/* Gewichte werden je Muskelgruppe im Shop freigekauft (S.wg[g] = höchste gekaufte Stufe). Heben darfst du sie, sobald die Gruppe stark genug ist. */
MK.wg = g => { const S = MK.S; S.wg = S.wg || {}; return S.wg[g] == null ? 1 : S.wg[g]; };
MK.wMax = ex => { const S = MK.S, lv = S.m[ex.g].lv; if (ex.kg === 'cardio') return Math.min(MK.WEIGHTS.length - 1, Math.floor(lv / 3)); return Math.max(0, MK.wg(ex.g)); }; // gekaufte Gewichte darfst du immer nehmen – zu schwere Hilfsmuskeln machen es aber wackelig
MK.wCur = ex => Math.min(MK.S.w[ex.id] == null ? MK.wMax(ex) : MK.S.w[ex.id], MK.wMax(ex));
MK.wLabel = (ex, i) => { const k = MK.WEIGHTS[i];
  if (ex.kg === 'db') return MK.fmt1(k) + ' kg je Hand';
  if (ex.kg === 'bb') return MK.fmt1(20 + k * 2) + ' kg';
  if (ex.kg === 'cable') return MK.fmt1(k * 2.5) + ' kg';
  if (ex.kg === 'bw') return i === 0 ? 'Körpergewicht' : '+' + MK.fmt1(k) + ' kg';
  return 'Stufe ' + (i + 1); };
MK.wNextReq = ex => ex.kg === 'cardio' ? `${MK.MUSCLES.find(m => m.id === ex.g).name} Level ${(MK.wMax(ex) + 1) * 3}` : 'Gewichte-Upgrade im Laden';
MK.eqMul = ex => ex.eq ? 1 + 0.1 * Math.max(0, (MK.S.eq[ex.eq] || 1) - 1) : 1;
MK.weakestG = () => { const S = MK.S; let w = null; MK.MUSCLES.forEach(m => { if (MK.groupOpen(m.id) && (!w || S.m[m.id].lv < S.m[w].lv)) w = m.id; }); return w; };
MK.xpPerRep = (ex, wi) => { const b = MK.bonus(); // kein Tages-/Wetterbonus mehr
  const sk = 1 + b.xp + (b['g_' + ex.g] || 0) + b.wXp * wi + (b.weakXp && MK.weakestG() === ex.g ? b.weakXp : 0) + (b.holdXp && (ex.hold || ex.anim === 'rope') ? b.holdXp : 0) + b.fameXp * Math.log10(1 + MK.S.fame);
  return MK.XP_BASE * Math.pow(MK.W_FAC, wi) * MK.techMul(ex.g) * ex.xm * MK.eqMul(ex) * sk * (b.xpMul || 1); };

/* ---------- XP / Level ---------- */
MK.gain = function (gid, xp, silent) {
  const S = MK.S, m = S.m[gid]; m.xp += xp; let ups = 0;
  while (m.xp >= MK.need(m.lv, gid)) { m.xp -= MK.need(m.lv, gid); m.lv++; ups++; }
  if (!silent && MK.xpRate) MK.xpRate(xp);
  if (ups) {
    S.stats.levels += ups; MK.track('levels', ups);
    const tl = MK.totalLv(), spDue = Math.floor(tl / 4);
    if (spDue > S.spLv) { S.sp += spDue - S.spLv; S.spLv = spDue; if (!silent) MK.emit('sp'); }
    const ri = MK.rankIdx();
    if (ri > S.rankSeen) { S.rankSeen = ri; S.sp += 1; if (!silent) MK.emit('rank', MK.RANKS[ri][1]); }
    if (!silent) MK.emit('levelup', { g: gid, lv: m.lv });
  }
  return ups;
};

/* Eine Wiederholung ausführen. Rückgabe: Infos für Effekte */
let lastRep = 0;
MK.doRep = function (extra) {
  const S = MK.S, ex = MK.curEx(); if (!ex || !MK.exOpen(ex)) return { fail: 'locked' };
  const wi = MK.wCur(ex);
  const b = MK.bonus(), now = performance.now(), fast = now - (MK._lastManual || 0) < 420; lastRep = now; if (!MK._auto) MK._lastManual = now; // Pump zählt nur eigene Klicks
  const mul = MK.pumpMul() * (S.beastOn > 0 ? 2 + b.beastMul : 1);
  let xp = MK.xpPerRep(ex, wi) * mul * (extra || 1);
  // Trainingsplan, Gym-Ereignis, Zerrung
  const pd = MK.planDay(), inPlan = pd && pd.day.g.includes(ex.g); if (inPlan) xp *= 1.15;
  if (MK.gev() === 'strom') xp *= 1.25; if (MK.gev() === 'legende') xp *= 1.3;
  const wk = MK.weak(ex), uns = wk && wi > wk.max;
  if (uns && !MK.strainG() && !(S.strain && Date.now() - S.strain.until < 180e3) && Math.random() < Math.min(.012, .0025 * (wi - wk.max)) * Math.max(.25, 1 - b.strainLess)) { S.strain = { g: ex.g, by: wk.g, until: Date.now() + 75e3 }; MK.emit('strain', S.strain); }
  if (MK.strainG() === ex.g) xp *= .5;
  if (MK._auto) xp *= MK.trainerGMul(ex.g);
  if (MK.labXpMul) xp *= MK.labXpMul(); // Testo // Trainer-Upgrades zählen nur für seine automatischen Wiederholungen
  if (inPlan) { S.plan.p++; if (S.plan.p >= pd.quota) MK.planComplete(pd); }
  if (S.wch && S.wch.g === ex.g && !S.wch.done) { S.wch.p++; if (S.wch.p >= S.wch.n) { S.wch.done = true; MK.emit('wchDone', S.wch); } }
  { const d = MK.today(), H = S.hist.days; (H[d] = H[d] || { reps: 0, tl: MK.totalLv() }).reps++; }
  const crit = Math.random() < 0.03 + b.crit + (S.beastOn > 0 ? b.beastCrit : 0);
  if (crit) { xp *= 5 + b.critMul; S.stats.crits++; MK.track('crits', 1); if (MK.gev() === 'shoot') { MK.addFame(1 + MK.totalLv() / 200); MK.emit('photo'); } }
  if (S.beastOn <= 0 && !MK._auto) { S.pump = Math.min((S.beastCd || 0) > 0 ? .97 : 1, S.pump + MK.pumpGain(fast)); if (S.pump >= 1) { S.beastOn = 10 + b.beastDur; S.stats.beasts++; MK.track('beast', 1); MK.emit('beast'); } }
  S.beast = S.pump;
  S.stats.reps++; S.stats.byG[ex.g] = (S.stats.byG[ex.g] || 0) + 1; S.stats.byEx = S.stats.byEx || {}; { const r0 = S.stats.byEx[ex.id] || 0; S.stats.byEx[ex.id] = r0 + 1; if (r0 + 1 >= MK.TECH_T(MK.techLvOf(r0))) MK.emit('tech', { ex, lv: MK.techLvOf(r0 + 1), mul: MK.techMul(ex.g) }); }
  MK.track('reps', 1); MK.track('group', 1, ex.g);
  // Geld pro Klick: wächst mit Gewicht, Übung und dem Upgrade „Fleiß“
  let cash = MK.clickCash() * (1 + (b.cash || 0) + (S.pump > .5 ? b.pumpCash : 0) + (S.beastOn > 0 ? b.beastCash : 0)) * mul * (crit ? 3 + b.critCash : 1);
  cash += MK.income() * MK.clickPct() * (crit ? 3 : 1);
  if (b.jackpot && Math.random() < b.jackpot) { cash *= 20; MK.emit('jackpot', cash); }
  const before = Math.floor(S.cents); S.cents += cash; const whole = Math.floor(S.cents) - before;
  if (whole > 0) { MK.earn(whole, true); }
  S.sweat = Math.min(1, S.sweat + 0.006 * (1 + wi * .15));
  const ups = MK.gain(ex.g, xp);
  return { xp, crit, ups, ex, wi, cash: whole, mul, unsafe: uns, inPlan };
};

/* ---------- Tick (pro Frame) ---------- */
MK.tick = function (dt) {
  { const inc = MK.income(); if (inc > 0) MK.earn(inc * dt, true); }
  const S = MK.S;
  if (S.beastCd > 0) S.beastCd = Math.max(0, S.beastCd - dt);
  if (S.beastOn > 0) { S.beastOn -= dt; S.pump = 1; if (S.beastOn <= 0) { S.beastOn = 0; S.pump = .35; S.beastCd = MK.BEAST_CD; MK.emit('beastEnd'); } }
  else if (performance.now() - (MK._lastManual || 0) > 1500) S.pump = Math.max(0, S.pump - dt * MK.pumpDecay());
  S.beast = S.pump;
  S.sweat = Math.max(0, S.sweat - dt * 0.004);
  S.stats.play += dt;
  // Sponsor
  if (S.sponsor) { const sp = MK.SPONSORS.find(x => x.id === S.sponsor); if (sp) MK.diaTick(sp.dph / 3600 * dt * (1 + MK.bonus().sponsor)); }
  // Rivale wächst
  // Neues Gym → neuer, stärkerer Rivale
  if ((S.rival.gym || 0) !== S.gym) { const R = MK.RIVAL; S.rival = { gym: S.gym, tot: Math.max(8, MK.totalLv() * R.mul * .92 + R.add * .6), wins: 0, losses: 0, next: Date.now() + 8 * 60e3 }; MK.emit('newRival', R); }
  const R = MK.RIVAL, cap = MK.totalLv() * R.mul + R.add; if (S.rival.tot < cap) S.rival.tot = Math.min(cap, S.rival.tot + dt / 80);
  if ((histT -= dt) < 0) { histT = 60; const H = S.hist; H.mins.push([Date.now(), MK.totalLv(), S.stats.reps, Math.round(MK.income() * 100) / 100]); if (H.mins.length > 480) H.mins.splice(0, H.mins.length - 480);
    const d = MK.today(); (H.days[d] = H.days[d] || { reps: 0 }).tl = MK.totalLv(); const ks = Object.keys(H.days).sort(); while (ks.length > 60) delete H.days[ks.shift()]; }
};
let histT = 3;
/* ---------- Imperium ---------- */
MK.bizCount = id => MK.S.biz[id] || 0;
/* Offline-Ertrag des Imperiums: 5 % Grundwert (wie Cookie Clicker), per Nachtschicht-Manager bis 15 % */
MK.OFF_MAX = 10; MK.offRate = () => Math.min(.15, .05 + (MK.S.offLv || 0) * .01 + (MK.bonus().offBiz || 0) * .1) + (MK.bonus().nightX || 0);
MK.offCost = () => MK.nice(2000 * Math.pow(5, MK.S.offLv || 0) * MK.shopMul());
MK.buyOff = () => { const S = MK.S; if ((S.offLv || 0) >= MK.OFF_MAX || !MK.spend(MK.offCost())) return false; S.offLv = (S.offLv || 0) + 1; return true; };
MK.bizDisc = () => 1 - Math.min(.5, MK.bonus().bizCheap || 0); MK.upDisc = () => 1 - Math.min(.5, MK.bonus().upCheap || 0);
const BG = MK.BIZ_GROW = 1.16; // jedes weitere Stück 16 % teurer
MK.bizCost = (B, n) => { const o = MK.bizCount(B.id); n = n || 1; return MK.nice(B.cost * Math.pow(BG, o) * (Math.pow(BG, n) - 1) / (BG - 1) * MK.shopMul() * MK.bizDisc()); };
MK.bizMaxN = B => { const S = MK.S, o = MK.bizCount(B.id), c0 = B.cost * Math.pow(BG, o) * MK.shopMul() * MK.bizDisc(); return Math.max(0, Math.floor(Math.log(S.money * (BG - 1) / c0 + 1) / Math.log(BG))); };
MK.bizOpen = B => !B.lic || (MK.S.bizLic || []).includes(B.id); // Lizenz gekauft?
MK.licOk = B => MK.reqMet(B.req); // passender Titel vorhanden
MK.licPrice = B => MK.nice(B.cost * 12 * MK.shopMul());
MK.buyLic = function (id) { const S = MK.S, B = MK.BIZ.find(x => x.id === id); if (!B || MK.bizOpen(B) || !MK.licOk(B) || !MK.spend(MK.licPrice(B))) return false; S.bizLic = S.bizLic || []; S.bizLic.push(id); MK.emit('lic', B); return true; };
MK.bizMul = id => Math.pow(2, MK.S.bizUp.filter(u => u.startsWith(id + ':')).length);
MK.incMul = () => (1 + MK.totalLv() * (.005 + (MK.bonus().lvInc || 0))) * (1 + (MK.bonus().bizInc || 0)); // jedes Gesamt-Level: +0,5 % Einkommen – Training zahlt sich aus
MK.bizRate = B => B.inc * MK.bizCount(B.id) * MK.bizMul(B.id) * MK.incMul();
let _incT = 0, _inc = 0;
MK.income = () => { const n = performance.now(); if (n - _incT > 200) { _incT = n; _inc = MK.BIZ.reduce((a, B) => a + MK.bizRate(B), 0); } return _inc; };
MK.incomeDirty = () => { _incT = 0; };
MK.buyBiz = function (id, n) { const S = MK.S, B = MK.BIZ.find(x => x.id === id); if (!B || !MK.bizOpen(B)) return false; n = n === 'max' ? MK.bizMaxN(B) : n; if (n < 1) return false; while (n > 1 && MK.bizCost(B, n) > S.money) n--; // Aufrunden kann „Max“ um eins zu viel machen
  const c = MK.bizCost(B, n); if (!MK.spend(c)) return false; S.biz[id] = MK.bizCount(id) + n; MK.incomeDirty(); MK.emit('biz', { B, n }); return true; };
/* Geschäfte auch mit Diamanten: pro Stück je nach Preis 1 bis ~30 💎 */
MK.bizDiaUnit = c => Math.max(1, Math.round(Math.pow(Math.log10(Math.max(10, c)), 1.3)));
MK.bizDiaCost = (B, n) => { let s = 0; for (let k = 0; k < n; k++) s += MK.bizDiaUnit(MK.bizCost(B, k + 1) - MK.bizCost(B, k)); return s; };
MK.bizDiaMaxN = B => { const S = MK.S; let n = 0, s = 0; while (n < 100) { const d = MK.bizDiaUnit(MK.bizCost(B, n + 1) - MK.bizCost(B, n)); if (s + d > S.dia) break; s += d; n++; } return n; };
MK.buyBizDia = function (id, n) { const S = MK.S, B = MK.BIZ.find(x => x.id === id); if (!B || !MK.bizOpen(B)) return false; n = n === 'max' ? MK.bizDiaMaxN(B) : n; if (n < 1) return false;
  const d = MK.bizDiaCost(B, n); if (S.dia < d) return false; S.dia -= d; S.biz[id] = MK.bizCount(id) + n; MK.incomeDirty(); MK.emit('biz', { B, n }); return true; };
/* Manager Klaus: kauft bei jedem Geschäft mit eingeschaltetem Auto-Kauf weitere Stück nach (nur die Anzahl, keine Upgrades) */
MK.autoUpgrade = function () { const S = MK.S; if (!(S.staff || []).includes('klaus')) return 0; const on = S.autoBiz || {}; let bought = 0;
  MK.BIZ.filter(B => on[B.id] && MK.bizOpen(B)).sort((a, b) => MK.bizCost(a, 1) - MK.bizCost(b, 1)).forEach(B => { for (let k = 0; k < 3; k++) { if (S.money < MK.bizCost(B, 1) || !MK.buyBiz(B.id, 1)) break; bought++; } });
  return bought; };
MK.bizUps = function () { const S = MK.S, out = [];
  MK.BIZ.forEach((B, bi) => MK.BIZ_STEPS.forEach(([need, f], i) => { const id = B.id + ':' + i; if (S.bizUp.includes(id)) return; out.push({ id, B, need, cost: B.cost * f, name: `${B.name}: ${MK.BIZ_UP_NAMES[i]}`, ok: MK.bizCount(B.id) >= need, kind: 'biz' }); }));
  MK.CLICK_UPS.forEach((u, i) => { if (S.clickUp > i) return; out.push({ id: 'click:' + i, cost: u.cost, name: u.name, need: 1, needB: u.need, ok: MK.bizCount(u.need) >= 1 && S.clickUp === i, kind: 'click', pct: u.pct }); });
  return out.sort((a, b) => a.cost - b.cost); };
MK.buyBizUp = function (id) { const S = MK.S, u = MK.bizUps().find(x => x.id === id); if (!u || !u.ok || !MK.spend(Math.ceil(u.cost * MK.shopMul() * MK.upDisc()))) return false;
  if (u.kind === 'click') S.clickUp++; else S.bizUp.push(id); MK.incomeDirty(); MK.emit('bizUp', u); return true; };
MK.perkLv = id => MK.S.perk[id] || 0;
MK.perkCost = id => { const B = MK.BIZ.find(x => x.id === id); return MK.nice(B.cost * 8 * Math.pow(3, MK.perkLv(id)) * MK.shopMul() * MK.upDisc()); };
MK.perkNeed = id => (MK.perkLv(id) + 1) * 5;
MK.buyPerk = function (id) { const S = MK.S; if (MK.bizCount(id) < MK.perkNeed(id) || !MK.spend(MK.perkCost(id))) return false; S.perk[id] = MK.perkLv(id) + 1; MK.dirty && MK.dirty(); MK.emit('perk', { id, lv: S.perk[id] }); return true; };
/* Geld pro eigenem Klick: wächst nur über die Laden-Upgrades „Klick-Geld“ (Idle-Formel: Preis × 2,7 je Stufe) */
MK.CASH_MAX = 40;
MK.cashVal = n => .25 * (1 + n) * Math.pow(1.25, n);
MK.clickCash = () => MK.cashVal(MK.S.cashLv || 0);
MK.cashCost = n => MK.nice(40 * Math.pow(2.7, n) * MK.shopMul());
MK.cashName = n => 'Kassengriff Stufe ' + (n + 1);
MK.buyCash = function () { const S = MK.S, n = S.cashLv || 0; if (n >= MK.CASH_MAX || !MK.spend(MK.cashCost(n))) return false; S.cashLv = n + 1; MK.emit('cashUp', S.cashLv); return true; };
MK.clickPct = () => MK.CLICK_UPS.slice(0, MK.S.clickUp).reduce((a, u) => a + u.pct, 0) + (MK.bonus().clickInc || 0);
MK.earn = function (n, passive) { const S = MK.S; S.money += n; S.stats.earned += n; if (!passive) MK.track('earn', n); };
MK.spend = function (n) { const S = MK.S; if (S.money < n) return false; S.money -= n; S.stats.spent += n; if (n > 0) MK.emit('spent', n); return true; };
MK.addFame = function (n) { const S = MK.S, v = n * MK.fameMul(); S.fame += v; MK.emit('fame', v); return v; };

/* ---------- Offline-Fortschritt ---------- */
MK.offline = function () {
  const S = MK.S, dt = Math.min((Date.now() - (S.last || Date.now())) / 1000, 8 * 3600);
  if (dt < 30) return null;
  const b = MK.bonus(), r = { dt, money0: S.money };
  S.pump = 0;
  if (S.sponsor) { const sp = MK.SPONSORS.find(x => x.id === S.sponsor); if (sp) { const d0 = S.dia; MK.diaTick(sp.dph / 3600 * dt * (1 + b.sponsor) * Math.min(1, .5 + b.offline)); r.dia = S.dia - d0; } }
  { const inc = MK.income(); if (inc > 0) { const m = inc * dt * MK.offRate(); MK.earn(m, true); r.money = (r.money || 0) + m; r.biz = m; } } // Imperium läuft offline mit halber Kraft
  // Personal Trainer trainiert offline mit (Skillbaum „Trainer-…“, bis 40 % Tempo)
  { const pct = Math.min(.4, b.offXp || 0), rate = S.trainer && S.trainer.off ? 0 : MK.trainerRate(), ex = MK.curEx();
    if (pct > 0 && rate > 0 && ex && MK.exOpen(ex)) {
      const wi = MK.wCur(ex), g = ex.g, m = S.m[g], tot = rate * dt * pct, N = 24; let left = tot, xpSum = 0, ups = 0;
      r.before = { lv: MK.lvExact(), power: MK.power(), lvl: m.lv, g }; r.tech = [];
      S.stats.byEx = S.stats.byEx || {};
      for (let i = 0; i < N && left > 0; i++) { const n = Math.min(left, tot / N); left -= n;
        const xp = MK.xpPerRep(ex, wi) * MK.trainerGMul(g) * n; xpSum += xp;
        const r0 = S.stats.byEx[ex.id] || 0, r1 = r0 + n, t0 = MK.techLvOf(r0), t1 = MK.techLvOf(r1); S.stats.byEx[ex.id] = r1; if (t1 > t0) r.tech.push({ ex, lv: t1 });
        ups += MK.gain(g, xp, true); }
      S.stats.reps += Math.floor(tot); S.stats.byG[g] = (S.stats.byG[g] || 0) + Math.floor(tot);
      r.xp = xpSum; r.reps = tot; r.g = g; r.ups = ups; r.lvTo = m.lv; r.pct = pct; r.after = { lv: MK.lvExact(), power: MK.power() }; } }
  S.sweat = 0; S.beast = 0; S.beastOn = 0; S.pump = 0;
  const cap = MK.totalLv() * MK.RIVAL.mul + MK.RIVAL.add; const rv = Math.min(cap, S.rival.tot + dt / 400) - S.rival.tot; if (rv > 0) { S.rival.tot += rv; r.rival = rv; }
  return r;
};

/* ---------- Aufgaben ---------- */
MK.ensureQuests = function () {
  const S = MK.S, day = MK.today(), wk = MK.week(), tl = MK.totalLv();
  MK.ensureWch();
  if (S.quests.day !== day) {
    const r = MK.seedRand('q' + day), pool = MK.QUEST_DAILY.slice(), list = [];
    const open = MK.MUSCLES.filter(m => MK.groupOpen(m.id));
    while (list.length < 3 && pool.length) {
      const q = pool.splice(Math.floor(r() * pool.length), 1)[0];
      const n = Math.max(1, Math.round(q.base * (q.k === 'wins' || q.k === 'beast' ? 1 + tl / 150 : 1 + tl / 40)));
      const g = q.k === 'group' ? open[Math.floor(r() * open.length)].id : null;
      list.push({ k: q.k, name: q.name.replace('{n}', MK.fmt(n)).replace('{g}', g ? MK.MUSCLES.find(m => m.id === g).name : ''), n, g, p: 0, done: false, claimed: false,
        rew: list.length === 2 ? { money: MK.nice(25 + tl * 4 + MK.income() * 45), fame: 5 } : { money: MK.nice(25 + tl * 4 + MK.income() * 30) } });
    }
    S.quests.day = day; S.quests.list = list;
  }
  if (S.quests.week !== wk) {
    const r = MK.seedRand('w' + wk), pool = MK.QUEST_WEEKLY.slice(), list = [];
    while (list.length < 2 && pool.length) { const q = pool.splice(Math.floor(r() * pool.length), 1)[0]; const n = Math.max(1, Math.round(q.base * (q.k === 'tourney' ? 1 : 1 + tl / 80)));
      list.push({ k: q.k, name: q.name.replace('{n}', MK.fmt(n)), n, p: 0, done: false, claimed: false, rew: { money: MK.nice(150 + tl * 15 + MK.income() * 300), sp: 1 } }); }
    S.quests.week = wk; S.quests.wlist = list;
  }
};
MK.track = function (k, n, g) {
  const S = MK.S; if (!S.quests) return;
  [...(S.quests.list || []), ...(S.quests.wlist || [])].forEach(q => {
    if (q.k !== k || q.done) return; if (q.g && q.g !== g) return;
    q.p = Math.min(q.n, q.p + n); if (q.p >= q.n) { q.done = true; MK.emit('questDone', q); }
  });
};
MK.reward = function (r) { const S = MK.S; if (!r) return; if (r.money) MK.earn(r.money, true); if (r.dia) S.dia += r.dia; if (r.sp) S.sp += r.sp; if (r.fame) MK.addFame(r.fame); };
MK.rewardText = r => [r.money ? MK.fmt(r.money) + ' €' : '', r.dia ? r.dia + ' 💎' : '', r.sp ? r.sp + ' SP' : '', r.fame ? '+' + MK.fmt(r.fame) + ' Ruhm' : ''].filter(Boolean).join(' · ');

/* ---------- Erfolge ---------- */
MK.checkAch = function () {
  const S = MK.S, got = [];
  MK.ACH.forEach(a => { if (!S.ach[a.id]) { let ok = false; try { ok = a.c(S); } catch (e) { } if (ok) { S.ach[a.id] = Date.now(); MK.reward(a.r); got.push(a); } } });
  got.forEach(a => MK.emit('ach', a));
  MK.checkTats(); MK.checkMiles();
};

/* ---------- Freischaltungen der Garderobe ---------- */
MK.reqMet = function (r) {
  if (!r) return true; if (Array.isArray(r)) return r.every(MK.reqMet); const S = MK.S; if (r.biz) return MK.bizCount(r.biz[0]) >= r.biz[1];
  if (r.lv != null) return MK.totalLv() >= r.lv; if (r.m) return S.m[r.m[0]].lv >= r.m[1];
  if (r.beat) return (S.beat[r.beat[0]] || 0) >= r.beat[1]; if (r.win) return S.wins[r.win[0]] >= r.win[1]; if (r.wins != null) return S.stats.wins >= r.wins;
  if (r.fame != null) return S.fame >= r.fame; if (r.event) return S.events.includes(r.event); if (r.trophy) return !!S.trophies[r.trophy];
  if (r.kfa != null) return MK.kfa() <= r.kfa; if (r.beasts != null) return S.stats.beasts >= r.beasts; if (r.rival != null) return S.stats.rivalWins >= r.rival;
  if (r.allm != null) return MK.MUSCLES.every(m => S.m[m.id].lv >= r.allm); if (r.tan) return S.bought.includes(r.tan + 'tan');
  return true;
};
MK.reqText = function (r) {
  if (Array.isArray(r)) return r.filter(x => !MK.reqMet(x)).map(MK.reqText).join(', ') || r.map(MK.reqText).join(', ');
  if (r.biz) return `${r.biz[1]}× ${MK.BIZ.find(B => B.id === r.biz[0]).name}`;
  if (r.lv != null) return `Gesamt-Level ${r.lv}`; if (r.m) return `${MK.MUSCLES.find(m => m.id === r.m[0]).name} Level ${r.m[1]}`;
  if (r.win) return `${r.win[1]}× ${MK.DISC.find(d => d.id === r.win[0]).name} gewinnen`; if (r.wins != null) return `${r.wins} Wettkämpfe gewinnen`;
  if (r.fame != null) return `${MK.fmt(r.fame)} Ruhm`; if (r.event) return 'Nur über ein Wochen-Event';
  if (r.beat) { const d = MK.DISC.find(x => x.id === r.beat[0]); return `${d.name}: ${r.beat[1]} Gegner besiegt`; }
  if (r.trophy) { const T = MK.TOURNEYS.find(t => t.id === r.trophy); return `Titel „${T.title}“ (${T.name})`; } if (r.kfa != null) return `Körperfett höchstens ${r.kfa} %`;
  if (r.beasts != null) return `${r.beasts}× Beast-Modus`; if (r.rival != null) return `${r.rival} Siege gegen Rivalen`; if (r.allm != null) return `Alle Muskelgruppen Level ${r.allm}`;
  if (r.tan) { const t = MK.WARD.tan.items.find(x => x.id === r.tan); return `Bräune „${t ? t.name : r.tan}“ gekauft`; } return '';
};
/* Fortschritt einer Bedingung als „hast / brauchst“ */
MK.reqHave = function (r) { const S = MK.S; if (r.biz) return MK.bizCount(r.biz[0]); if (r.beat) return S.beat[r.beat[0]] || 0;
  if (r.lv != null) return MK.totalLv(); if (r.m) return S.m[r.m[0]].lv; if (r.win) return S.wins[r.win[0]]; if (r.wins != null) return S.stats.wins; if (r.fame != null) return Math.floor(S.fame);
  if (r.kfa != null) return MK.kfa() + ' %'; if (r.beasts != null) return S.stats.beasts; if (r.rival != null) return S.stats.rivalWins; if (r.allm != null) return Math.min(...MK.MUSCLES.map(m => S.m[m.id].lv)); return null;
};
MK.sponsorOk = sp => (sp.req || [{ fame: sp.fame }]).every(MK.reqMet);
MK.signSponsor = function (id) { const S = MK.S, sp = MK.SPONSORS.find(x => x.id === id); if (!sp || !MK.sponsorOk(sp)) return false;
  S.sponsor = id; S.sponsored = S.sponsored || []; let first = false; if (!S.sponsored.includes(id)) { S.sponsored.push(id); first = true; if (sp.bonus) MK.reward(sp.bonus); } return first ? 'first' : true;
};

/* ---------- Skillbaum ---------- */
MK.skillAvail = id => { const n = MK.SKILLS.find(x => x.id === id); return !MK.S.skills.includes(id) && n.req.some(r => MK.S.skills.includes(r)); };
MK.buySkill = id => { const S = MK.S, n = MK.SKILLS.find(x => x.id === id); if (!MK.skillAvail(id) || S.sp < n.cost) return false; S.sp -= n.cost; S.skills.push(id); MK.emit('skill', n); return true; };

/* ---------- Wettkampf-Kraft ---------- */
/* Ausdauer = Wettkampf-Kondition: längere Duelle, Griff hält länger und erholt sich schneller */
MK.endur = () => { const A = Math.max(0, (MK.S.m.ausdauer.lv || 1) - 1); return { time: Math.min(.75, A * .015), grip: 1 + A * .08, reg: 1 + A * .04, lv: A + 1 }; };
MK.discPower = function (d) {
  const S = MK.S, b = MK.bonus(); let lv = 0;
  for (const g in d.groups) lv += (S.m[g].lv - 1) * d.groups[g];
  let p = (1 + lv * 0.07) * (1 + S.wset * 0.025) * (1 + b.comp + (b['d_' + d.id] || 0)) * (1 + S.compBuff);
  if (d.id === 'arm' || d.id === 'kreuz') p *= 1 + b.grip;
  if (d.id === 'reifen' && S.eq.reifen) p *= 1.15;
  return p;
};
MK.discOpen = d => MK.reqMet(d.ureq);
MK.gymOk = g => MK.reqMet(g.req);
MK.tourOk = T => MK.reqMet(T.req);

})(window.MK);

/* ======================================================================
   ROTER FADEN: Was ist wann sinnvoll? (Shop-Freigaben, Skill-Stufen, nächstes Ziel)
   ====================================================================== */
(function (MK) {
const gname = id => MK.MUSCLES.find(m => m.id === id).name;
/* Gerät: erst kaufbar, wenn es (fast) sofort etwas freischaltet */
MK.eqUses = q => MK.EXERCISES.filter(e => e.eq === q.id);
MK.eqStatus = function (q) { // jedes Gerät ist sofort kaufbar – benutzen darfst du die Übung erst ab ihrem Muskel-Level
  const S = MK.S; if (S.eq[q.id]) return { st: 'owned' };
  const uses = MK.eqUses(q); return { st: 'buy', uses: uses.map(e => e.name), lv: uses.length ? Math.min(...uses.map(e => e.lv)) : 0 };
};
MK.eqBase = q => { if (q.price != null) return q.price || 40; const lv = Math.min(...MK.eqUses(q).map(e => e.lv).concat([60])); return MK.nice(120 * Math.pow(1.28, lv) + MK.expInc(lv * 4.5) * 45); };
MK.eqPrice = (q, l) => MK.nice((1 - Math.min(.5, MK.bonus().eqCheap || 0)) * MK.eqBase(q) * MK.EQUIP_MULT[l] * MK.shopMul() * (l === 0 ? 1 : 1.5) + (l > 0 && q.price === 0 ? 60 * MK.EQUIP_MULT[l] : 0));
/* Gewichte je Muskelgruppe: nächste Stufe kaufbar, sobald die Gruppe sie auch heben darf */
MK.WG_TIERS = ['Plastik', 'Plastik', 'Gummi', 'Gummi', 'Gusseisen', 'Gusseisen', 'Stahl', 'Stahl', 'Stahl', 'Chrom', 'Chrom', 'Chrom', 'Kalibriert', 'Kalibriert', 'Kalibriert', 'Wettkampf', 'Wettkampf', 'Olymp', 'Titan', 'Gold', 'Platin', 'Obsidian'];
MK.wgGroups = () => MK.MUSCLES.filter(m => !m.stat && MK.groupOpen(m.id));
MK.wgPrice = (g, n) => { const M = MK.MUSCLES.find(x => x.id === g); return MK.nice(60 * Math.pow(3.4, n - 1) * (1 + M.unlock / 20) * MK.shopMul()); };
MK.wgStatus = function (g) { // keine Level-Grenzen: jede Stufe ist sofort kaufbar
  const cur = MK.wg(g), n = cur + 1; if (n >= MK.WEIGHTS.length) return { st: 'max', cur };
  return { st: 'buy', cur, n, price: MK.wgPrice(g, n) };
};
MK.buyWg = function (g) { const S = MK.S, st = MK.wgStatus(g); if (st.st !== 'buy' || !MK.spend(st.price)) return false;
  const old = MK.wg(g); S.wg[g] = st.n; MK.EXERCISES.filter(e => e.g === g && S.w[e.id] != null && S.w[e.id] >= old).forEach(e => { S.w[e.id] = null; }); // wer am Limit trainiert hat, bekommt gleich das neue Gewicht
  S.wset = Math.max(...Object.values(S.wg)); MK.emit('wg', { g, n: st.n }); return true; };
/* Skillbaum: tiefere Skills brauchen ein Mindest-Level */
const SK_LV = [0, 0, 4, 10, 18, 30, 48, 70];
let depth = null;
MK.skillMinLv = function (id) {
  if (!depth) { depth = { start: 0 }; let ch = true; while (ch) { ch = false; MK.SKILLS.forEach(n => { if (depth[n.id] != null) return; const ds = n.req.map(r => depth[r]).filter(v => v != null); if (ds.length) { depth[n.id] = Math.min(...ds) + 1; ch = true; } }); } }
  const n = MK.SKILLS.find(x => x.id === id); if (n && n.lv != null) return n.lv; let lv = SK_LV[Math.min(SK_LV.length - 1, depth[id] || 0)];
  return lv;
};
const baseAvail = MK.skillAvail;
MK.skillAvail = id => baseAvail(id) && MK.totalLv() >= MK.skillMinLv(id);
MK.skillReachable = id => baseAvail(id);
MK.eventOpen = () => MK.totalLv() >= 8;
/* Nächste Ziele, sortiert nach Gesamt-Level */
MK.nextGoals = function () {
  const S = MK.S, tl = MK.totalLv(), out = [];
  MK.MUSCLES.forEach(m => { if (m.unlock > tl) out.push({ lv: m.unlock, txt: `Neue Muskelgruppe: ${m.name}` }); });
  if (tl < 8) out.push({ lv: 8, txt: 'Wochen-Event' });
  const nr = MK.RANKS.find(([n]) => n > tl); if (nr) out.push({ lv: nr[0], txt: `Rang „${nr[1]}“ + 1 Skillpunkt` });
  out.sort((a, b) => a.lv - b.lv);
  const ex = MK.curEx(); let gx = null;
  if (ex) { const nx = MK.EXERCISES.filter(e => e.g === ex.g && e.lv > S.m[ex.g].lv).sort((a, b) => a.lv - b.lv)[0]; if (nx) gx = { lv: nx.lv, txt: `${gname(ex.g)} Level ${nx.lv}: ${nx.name}` }; }
  const T = MK.TOURNEYS.find(x => !S.trophies[x.id] && MK.tourOk(x)) || MK.TOURNEYS.find(x => !S.trophies[x.id]); let tour = null;
  if (T) { const miss = T.req.filter(r => !MK.reqMet(r)); tour = { txt: miss.length ? `Für ${T.name}: ${MK.reqText(miss[0])}` : `${T.name} bereit → Titel „${T.title}“` }; }
  return { total: out, group: tour || gx, tl };
};
/* Gibt es gerade etwas Sinnvolles, das du dir leisten kannst? */
MK.canBuySomething = function () {
  const S = MK.S, sm = MK.shopMul();
  if (MK.BIZ.some(B => MK.bizOpen(B) && S.money >= MK.bizCost(B, 1))) return true;
  if (MK.EQUIP.some(q => MK.eqStatus(q).st === 'buy' && MK.eqUses(q).some(e => S.m[e.g].lv >= e.lv - 2) && S.money >= MK.eqPrice(q, 0))) return true;
  if (MK.wgGroups().some(m => { const w = MK.wgStatus(m.id); return w.st === 'buy' && S.money >= w.price; })) return true;
  return false;
};
})(window.MK);

/* ======================================================================
   NEUE SYSTEME: Tattoos, Zerrung, Trainingsplan, Meal-Prep, Wochen-Challenge, Partner, Ereignisse, Verlauf, Titel, Karten
   ====================================================================== */
(function (MK) {
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
/* Haustiere aufwerten: Stufe 2 und 3 (je +50 % Wirkung) */
MK.PET_UP = [0, 150, 400];
MK.petLv = id => (MK.S.petLv && MK.S.petLv[id]) || 1;
MK.petDesc = (p, lv) => { const f = 1 + .5 * ((lv || MK.petLv(p.id)) - 1), e = p.eff, out = []; if (e.xp) out.push(`+${Math.round(e.xp * f * 100)} % XP`); if (e.fame) out.push(`+${Math.round(e.fame * f * 100)} % Ruhm`); if (e.crit) out.push(`+${MK.fmt1(e.crit * f * 100)} % perfekte Wdh.`); if (e.en) out.push(`+${Math.round(e.en * f)} % Pump-Bonus`); if (e.regen) out.push(`Pump hält ${Math.round(e.regen * f * 100)} % länger`); return out.join(', '); };
MK.upPet = function (id) { const S = MK.S, lv = MK.petLv(id); if (lv >= 3 || !S.pets.includes(id)) return false; const c = MK.PET_UP[lv]; if (S.dia < c) return false; S.dia -= c; S.petLv = S.petLv || {}; S.petLv[id] = lv + 1; MK.dirty(); return true; };
/* Personal Trainer: trainiert automatisch die gerade gewählte Muskelgruppe (Stufe = Wiederholungen pro Sekunde, max. 10) */
MK.TRAINER_MAX = 10;
MK.trainerCost = lv => MK.nice(15000 * Math.pow(7, lv) * MK.shopMul()); // lv = aktuelle Stufe → Preis für die nächste
MK.trainerRate = () => (MK.S.trainer && MK.S.trainer.lv) || 0;
MK.trainerGLv = g => ((MK.S.trainer && MK.S.trainer.g) || {})[g] || 0;
MK.trainerGCost = g => { const M = MK.MUSCLES.find(m => m.id === g); return MK.nice(2500 * Math.pow(3.2, MK.trainerGLv(g)) * (1 + M.unlock / 20) * MK.shopMul()); };
MK.trainerGMul = g => 1 + .15 * MK.trainerGLv(g);
MK.buyTrainer = function () { const S = MK.S, lv = MK.trainerRate(); if (lv >= MK.TRAINER_MAX || !MK.spend(MK.trainerCost(lv))) return false; S.trainer.lv = lv + 1; MK.dirty(); return true; };
MK.buyTrainerG = function (g) { const S = MK.S; if (!MK.trainerRate() || !MK.spend(MK.trainerGCost(g))) return false; S.trainer.g[g] = MK.trainerGLv(g) + 1; MK.dirty(); return true; };
MK.ensureNew = function () {
  { const S1 = MK.S; if (!S1.trainer) S1.trainer = { lv: 0, g: {} }; if (!S1.trainer.g) S1.trainer.g = {}; }
  { const S0 = MK.S; if (!S0.diet) S0.diet = 'keep'; if (S0.fatOff == null) S0.fatOff = 0; if (!S0.staff) S0.staff = []; if (S0.diaAcc == null) S0.diaAcc = 0; if (!S0.ecoMig) { S0.ecoMig = 1; } }
  const S = MK.S;
  S.tats = S.tats || { got: [], on: [] };
  if (!S.tats.migr) { S.tats.migr = 1; const old = S.look.tattoo; if (old && old !== 'none' && !S.tats.got.includes(old)) { S.tats.got.push(old); S.tats.on.push(old); } }
  S.plan = Object.assign({ id: null, day: 0, p: 0, done: 0, stamps: 0 }, S.plan || {});
  S.prep = Object.assign({ next: 0, goal: 'masse', offer: [], pick: [], good: 0, made: 0, log: [] }, S.prep || {}); if (S.prep.goal !== 'masse' && S.prep.goal !== 'defi') S.prep.goal = 'masse'; S.prep.log = S.prep.log || [];
  S.wch = S.wch || {}; S.partner = Object.assign({ lv: 0 }, S.partner || {}); S.hist = Object.assign({ days: {}, mins: [] }, S.hist || {});
  S.wg = S.wg || {}; if (!S.wgMig) { S.wgMig = 1; MK.MUSCLES.forEach(m => { if (!m.stat) S.wg[m.id] = Math.max(S.wg[m.id] || 1, S.wset || 1); }); } // altes Hantel-Set → Gewichte je Muskelgruppe
  if (S.up && Object.keys(S.up).length && !S.upRefund) { // alte Klick-Upgrades sind jetzt im Skillbaum → ausgegebenes Geld zurück
    const OLD = { kraft: [15, 2.6], fleiss: [20, 2.4], kondition: [40, 2.6], erholung: [50, 2.6], technik: [100, 3.5] }; let ref = 0;
    for (const id in S.up) { const o = OLD[id]; if (!o) continue; for (let l = 0; l < S.up[id]; l++) ref += Math.round(o[0] * Math.pow(o[1], l)); }
    S.up = {}; S.upRefund = Math.max(1, ref); S.money += ref; S.upRefundNew = ref; }
  if (!S.wardMig) { S.wardMig = 1; for (const g in MK.WARD) MK.WARD[g].items.forEach(it => { // was schon frei war, bleibt dir
      if (!it.price || S.bought.includes(it.id + g)) return; if ((!it.oldPrice && it.oldReq && MK.reqMet(it.oldReq)) || S.look[g] === it.id) S.bought.push(it.id + g); }); }
  if (!S.bizLic) S.bizLic = MK.BIZ.filter(B => B.lic && (S.biz[B.id] || 0) > 0).map(B => B.id); // wer ein Geschäft schon hat, behält die Lizenz
  if (!S.eqMig) { S.eqMig = 1; const L = g => S.m[g].lv, give = id => { S.eq[id] = S.eq[id] || 1; }; // Umbau Übungen/Geräte: was du schon nutzen konntest, bleibt nutzbar
    if (S.eq.langhantel) ['tbar', 'plattform', 'szstange'].forEach(give); if (S.eq.kabel) ['latzug', 'seilzug'].forEach(give); if (S.eq.stange) give('haenge');
    if (L('brust') >= 4) give('butterfly'); if (L('arme') >= 10) give('trizepsbank'); if (L('bauch') >= 5) give('matte'); if (L('beine') >= 8) give('wadenblock'); if (L('nacken') >= 14) give('farmer'); }
  MK.MUSCLES.forEach(m => { if (!MK.exById(S.ex[m.id])) S.ex[m.id] = MK.EXERCISES.find(e => e.g === m.id).id; });
  if (!S.cuMig) { S.cuMig = 1; if ((S.clickUp || 0) >= 1) { S.clickUp--; S.money += 5e3; } } // altes Imperium-Upgrade „Kassen-Griff“ entfernt: Geld zurück
  if (S.cashLv == null) { const ws = Math.max(1, S.wset || 1), old = .15 * (1 + .3 * ws); let n = 0; while (n < 10 && MK.cashVal(n) < old) n++; S.cashLv = S.stats && S.stats.reps > 0 ? n : 0; } // bisheriges Klick-Geld bleibt erhalten
  if (S.xpMig && !S.xpMig2) { S.xpMig2 = 1; MK.MUSCLES.forEach(m => { const x = S.m[m.id]; if (x) x.xp = Math.min(MK.need(x.lv, m.id) * .999, (x.xp || 0) / 13); }); } // Grundwert 10 → 1/1,3
  if (!S.xpMig) { S.xpMig2 = 1; S.xpMig = 1; MK.MUSCLES.forEach(m => { const x = S.m[m.id]; if (x) x.xp = Math.min(.999, (x.xp || 0) / MK.needOld(x.lv)) * MK.need(x.lv, m.id); }); } // neue XP-Rechnung: Fortschritt im Level bleibt gleich
  S.title = S.title || 'lauch'; S.mile = S.mile || 0; S.duet = Object.assign({ until: 0, next: 0 }, S.duet || {}); if (S.suit === undefined) S.suit = null; S.ripSeen = S.ripSeen || {}; S.rivBeat = S.rivBeat || {};
};
/* Tattoos */
MK.checkTats = function () { const S = MK.S, got = []; MK.TATS.forEach(t => { if (!S.tats.got.includes(t.id) && t.c(S)) { S.tats.got.push(t.id); S.tats.on.push(t.id); got.push(t); } }); got.forEach(t => MK.emit('tattoo', t)); };
MK.tatsOn = () => MK.S.tats.on.filter(id => MK.S.tats.got.includes(id));
/* Körperfett-Bonus durch Definition-Essen */
MK.fatAdd = () => (MK.S.fatOff || 0) / 28;
/* Ernährung: KFA-Verschiebung in Prozentpunkten (−8 … +14). Masse über dem Normalwert gibt XP-Bonus. */
MK.massBonus = () => 0;
let KFAC = { t: 0, v: 18 }; MK.kfaCached = () => { const n = performance.now(); if (n - KFAC.t > 700) { KFAC = { t: n, v: MK.kfa() }; } return KFAC.v; };
MK.kfaXp = () => Math.max(-.12, Math.min(.2, (MK.kfaCached() - 18) * .015)); // KFA 10 % → −12 % XP, KFA 30 % → +18 % XP
/* Körpergewicht: Magermasse wächst mit den Muskeln, dazu das Fett */
MK.bodyKg = () => { const lean = 52 + 58 * (1 - Math.exp(-MK.totalLv() / 420)); return lean / (1 - MK.kfa() / 100); };
MK.dietTick = function (dt) { const S = MK.S, d = MK.DIETS.find(x => x.id === (S.diet || 'keep')); if (!d) return; let f = S.fatOff || 0;
  if (d.rate) f += d.rate * dt / 60; else f += (0 - f) * Math.min(1, dt / 60 * .003); S.fatOff = Math.max(-8, Math.min(14, f)); };
/* Diamanten aus Sponsoren tröpfeln langsam rein */
MK.diaTick = function (n) { const S = MK.S; S.diaAcc = (S.diaAcc || 0) + n; if (S.diaAcc >= 1) { const k = Math.floor(S.diaAcc); S.diaAcc -= k; S.dia += k; MK.emit('diaDrop', k); } };
/* Imperium-Upgrades alternativ mit Diamanten: deutlich weniger als in € – aber Diamanten sind knapp */
MK.diaPrice = cost => Math.max(5, Math.round(Math.pow(Math.log10(Math.max(10, cost)), 1.55)));
MK.buyBizUpDia = function (id) { const S = MK.S, u = MK.bizUps().find(x => x.id === id); if (!u || !u.ok) return false; const dp = MK.diaPrice(u.cost); if (S.dia < dp) return false; S.dia -= dp;
  if (u.kind === 'click') S.clickUp++; else S.bizUp.push(id); MK.incomeDirty(); MK.emit('bizUp', u); return true; };
MK.buyPerkDia = function (id) { const S = MK.S; if (MK.bizCount(id) < MK.perkNeed(id)) return false; const dp = MK.diaPrice(MK.perkCost(id)); if (S.dia < dp) return false; S.dia -= dp; S.perk[id] = MK.perkLv(id) + 1; MK.dirty && MK.dirty(); MK.emit('perk', { id, lv: S.perk[id] }); return true; };
MK.kfa = () => { const lv = MK.lvExact(), D = MK.Fig.dims(lv, MK.rankIdx() / 10, 0, null, { fatAdd: MK.fatAdd() }); return Math.round(8 + D.fat * 28); };
/* Stütz-Muskeln: zu schwer für die schwächste Stütz-Gruppe = wackelig */
MK.weak = ex => { if (!ex || ex.kg === 'cardio') return null; const S = MK.S, sup = (MK.SUPPORT[ex.g] || []).filter(g => MK.groupOpen(g)); if (!sup.length) return null;
  let w = sup[0]; sup.forEach(g => { if (S.m[g].lv < S.m[w].lv) w = g; }); return { g: w, max: Math.floor(S.m[w].lv / 3) + 3 + Math.floor(MK.bonus().safeW || 0) }; };
MK.unsafe = ex => { const w = MK.weak(ex); return !!(w && MK.wCur(ex) > w.max); };
MK.strainG = () => { const s = MK.S.strain; return s && s.until > Date.now() ? s.g : null; };
/* Trainingsplan: Tage nacheinander, Fortschritt zählt nur mit den Muskelgruppen des Tages */
MK.planOpen = () => MK.totalLv() >= 12;
MK.planDay = function () {
  const S = MK.S; if (!S.plan || !S.plan.id || !MK.planOpen()) return null; const P = MK.PLANS.find(p => p.id === S.plan.id); if (!P) return null;
  const days = P.days.map(d => ({ n: d.n, g: d.g.filter(g => MK.groupOpen(g)) })).filter(d => d.g.length); if (!days.length) return null;
  const idx = S.plan.day % days.length; return { plan: P, day: days[idx], idx, n: days.length, quota: Math.round(50 + MK.totalLv() * .8) };
};
MK.planComplete = function (pd) {
  const S = MK.S, tl = MK.totalLv(), rew = { money: MK.nice(40 + tl * 4 + MK.income() * 40) }; S.plan.p = 0; S.plan.day++; S.plan.done++; S.plan.stamps++;
  if (S.plan.stamps >= 7) { S.plan.stamps = 0; rew.fame = 20; rew.sp = 1; }
  MK.reward(rew); MK.emit('planDay', { day: pd.day, rew });
};
/* Meal-Prep */
MK.prepOpen = () => !!MK.S.eq.kuehl;
/* Meal-Prep: 3 Mal pro 5 Minuten. Es gibt immer eine Kombi mit mindestens 90 %. */
MK.PREP_WIN = 5 * 60e3; MK.PREP_MAX = 3;
MK.prepLog = () => { const P = MK.S.prep, now = Date.now(); P.log = (P.log || []).filter(t => now - t < MK.PREP_WIN); return P.log; };
MK.prepLeft = () => MK.PREP_MAX - MK.prepLog().length;
MK.prepReady = () => MK.prepLeft() > 0;
MK.prepNext = () => { const L = MK.prepLog(); return L.length ? Math.min(...L) + MK.PREP_WIN : Date.now(); };
MK.prepReward = () => MK.nice(40 + MK.totalLv() * 6 + MK.income() * 60);
const PREPC = {};
MK.prepCombos = goal => { if (PREPC[goal]) return PREPC[goal]; const ids = MK.FOODS.map(f => f.id), out = [];
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) for (let k = j + 1; k < ids.length; k++) { const c = [ids[i], ids[j], ids[k]]; if (MK.prepScore(c, goal).sc >= .9) out.push(c); }
  return (PREPC[goal] = out); };
MK.prepOffer = function () { const S = MK.S, key = S.prep.made + ':' + S.prep.goal; if (!S.prep.offer.length || S.prep.offerT !== key) { const r = MK.seedRand('prep' + key + S.created), C = MK.prepCombos(S.prep.goal), sure = C[Math.floor(r() * C.length)] || [], pool = MK.FOODS.map(f => f.id).filter(id => !sure.includes(id)), out = sure.slice();
    while (out.length < 6) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]); for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; } S.prep.offer = out; S.prep.offerT = key; S.prep.pick = []; } return S.prep.offer; };
MK.prepScore = function (pick, goal) {
  if (!pick.length) return { r: [0, 0, 0], sc: 0 }; let p = 0, c = 0, f = 0;
  pick.forEach(id => { const F = MK.FOODS.find(x => x.id === id); p += F.p * 4; c += F.c * 4; f += F.f * 9; });
  const tot = p + c + f || 1, r = [p / tot, c / tot, f / tot], t = MK.PREP_GOALS.find(g => g.id === goal).t, err = Math.abs(r[0] - t[0]) + Math.abs(r[1] - t[1]) + Math.abs(r[2] - t[2]);
  return { r, sc: pick.length < 3 ? 0 : clamp(1 - err / 1.2, 0, 1) };
};
MK.cook = function () {
  const S = MK.S, P = S.prep, { sc } = MK.prepScore(P.pick, P.goal); if (P.pick.length < 3 || !MK.prepReady()) return null;
  const res = { sc, fat: 0, money: 0 };
  if (sc >= .7) { res.fat = P.goal === 'masse' ? 1 : -1; S.fatOff = Math.max(-12, Math.min(15, (S.fatOff || 0) + res.fat)); }
  if (sc >= .9) { res.money = MK.prepReward(); MK.earn(res.money, true); P.good++; }
  MK.prepLog().push(Date.now()); P.made++; P.pick = []; MK.dirty(); return res;
};
/* Wochen-Challenge: immer die schwächste offene Muskelgruppe */
MK.ensureWch = function () { const S = MK.S, wk = MK.week(); if (S.wch.week === wk) return; const open = MK.MUSCLES.filter(m => MK.groupOpen(m.id) && !m.stat);
  const low = open.slice().sort((a, b) => S.m[a.id].lv - S.m[b.id].lv)[0] || MK.MUSCLES[0], tl = MK.totalLv();
  S.wch = { week: wk, g: low.id, n: Math.round(300 + tl * 5), p: 0, done: false, claimed: false, rew: { sp: 1, fame: 25, money: MK.nice(200 + tl * 20 + MK.income() * 300) } }; };
/* Trainingspartner Kevin trainiert mit, solange du aktiv bist */
MK.partnerOpen = () => MK.S.beat.klimm >= 1 && MK.totalLv() >= 15;
MK.PARTNER_MAX = 25;
MK.partnerCost = lv => MK.nice(1500 * Math.pow(3.2, lv)); // teuer: jede Stufe ×3,2
MK.partnerMul = () => Math.pow(1.07, (MK.S.partner && MK.S.partner.lv) || 0);
let pT = 0;
MK.partnerTick = function (dt, active) {
  return null; // Kevin gibt jetzt einen festen Boost auf alle Muskelgruppen (MK.partnerMul)
  const P = MK.S.partner; if (!P.lv || !active) return null; pT += dt; if (pT < Math.max(.9, 2.6 - P.lv * .17)) return null; pT = 0;
  const ex = MK.curEx(); if (!ex || !MK.exOpen(ex)) return null; const xp = MK.xpPerRep(ex, MK.wCur(ex)) * MK.pumpMul() * (.22 + P.lv * .03); MK.gain(ex.g, xp); return { xp, g: ex.g };
};
/* Gym-Ereignisse */
MK.gev = () => { const e = MK.S && MK.S.gev; return e && e.until > Date.now() ? e.id : null; };
MK.startGymEvent = function () { const S = MK.S, pool = MK.GYM_EVENTS.filter(e => (e.gym == null || e.gym === S.gym) && (!e.bar || S.eq.kuehl)), e = pool[Math.floor(Math.random() * pool.length)]; S.gev = { id: e.id, until: Date.now() + e.dur * 1000 }; MK.dirty(); MK.emit('gymEvent', e); return e; };
/* Titel und Sammelkarten */
MK.titleOk = id => { const t = MK.TITLES.find(x => x.id === id); try { return !!(t && t.c(MK.S)); } catch (e) { return false; } };
MK.titleName = () => { const t = MK.TITLES.find(x => x.id === MK.S.title); return t && MK.titleOk(t.id) ? t.name : MK.TITLES[0].name; };
MK.cards = function () {
  const S = MK.S, out = [];
  MK.NPCS.forEach(n => out.push({ id: 'npc-' + n.id, kind: 'npc', name: n.name, sub: MK.GYMS[n.gym].name, rar: 0, got: S.gym >= n.gym, npc: n.id }));
  MK.RIVALS.forEach((r, i) => out.push({ id: 'riv-' + i, kind: 'rival', name: r.full, sub: 'Rivale · ' + MK.GYMS[i].name, rar: 3, got: !!S.rivBeat[i], look: r.look, lvl: 20 + i * 25 }));
  MK.DISC.forEach(d => d.opp.forEach((o, i) => out.push({ id: 'opp-' + d.id + i, kind: 'opp', name: o, sub: d.name + ' · Gegner ' + (i + 1), rar: i < 3 ? 0 : i < 6 ? 1 : i < 7 ? 2 : 3, got: S.beat[d.id] > i, seed: d.id + i, idx: i })));
  return out;
};
MK.cardCount = () => MK.cards().filter(c => c.got).length;
/* ---------- Preise passend zum Spielfortschritt ----------
   Erwartetes Einkommen je Gesamt-Level (aus der Spiel-Simulation). Einmalkäufe kosten damit etwa 1–2 Minuten Einkommen zum Zeitpunkt der Freischaltung. */
const EXP_INC = [[0, 0.08], [10, 0.8], [21, 7.6], [34, 68], [47, 320], [56, 1200], [73, 7200], [88, 1.6e+04], [104, 2.8e+04], [117, 4.8e+04], [136, 1.28e+05], [170, 6e+05], [230, 6e+06], [300, 6e+07], [450, 4e+09], [600, 4e+11]]; // nach der Imperium-Bremse (Okt. 2026) etwa 40 % der früheren Werte
MK.expInc = tl => { for (let i = 1; i < EXP_INC.length; i++) if (tl <= EXP_INC[i][0]) { const [a, va] = EXP_INC[i - 1], [b, vb] = EXP_INC[i], k = (tl - a) / (b - a); return Math.pow(10, Math.log10(va) + (Math.log10(vb) - Math.log10(va)) * k); } return EXP_INC[EXP_INC.length - 1][1]; };
MK.reqTL = r => { if (!r) return 0; if (r.beat) return 8 + r.beat[1] * 4; if (Array.isArray(r)) return Math.max(0, ...r.map(MK.reqTL)); if (r.lv != null) return r.lv; if (r.m) return r.m[1] * 3; if (r.fame != null) return 4.74 * Math.pow(r.fame, .487);
  if (r.wins != null) return 5 + r.wins * 2.5; if (r.win) { const d = MK.DISC.find(x => x.id === r.win[0]); return 10 + r.win[1] * 3; } if (r.allm != null) return r.allm * 8; if (r.rival != null) return 15 + r.rival * 10;
  if (r.trophy) { const T = MK.TOURNEYS.find(x => x.id === r.trophy); return T ? 4.74 * Math.pow(T.fame, .487) : 60; } if (r.biz) return 0; return 30; };
MK.wardPrice = it => it.price ? MK.nice(Math.max(150, 60 + MK.expInc(it.tier || 0) * 420 + (it.oldPrice || 0) * 4) * (1 + Math.max(0, (it.tier || 0) - 15) / 45) * MK.shopMul()) : 0;
MK.wardDia = it => it.dia || Math.max(4, Math.round(Math.pow(Math.log10(Math.max(10, MK.wardPrice(it))), 1.7))); // ≈ 7 Minuten Einkommen zu dem Zeitpunkt, an dem das Teil früher freigeschaltet wurde
MK.tourFee = T => MK.nice(T.fee + MK.income() * 30 * (T.tier + 1));
MK.tourReward = T => Object.assign({}, T.reward, { money: MK.nice(T.reward.money + MK.income() * 300 * (T.tier + 1)) });
MK.mealPrice = m => MK.nice((m.price * (1 + MK.totalLv() / 100) + MK.income() * m.price / 2) * MK.shopMul() * (MK.gev && MK.gev() === 'happy' ? .5 : 1));
MK.dailyReward = r => r.money ? Object.assign({}, r, { money: MK.nice(r.money + MK.income() * 60) }) : r;
/* ---------- Meilensteine: insgesamt verdientes Geld ---------- */
MK.checkMiles = function () { const S = MK.S; while (S.mile < MK.MILES.length && S.stats.earned >= MK.MILES[S.mile][0]) { const [v, d] = MK.MILES[S.mile]; MK.addFame(d * 20); S.mile++; MK.emit('mile', { v, d }); } };
/* ---------- Kevin trainiert mit (Duett) ---------- */
MK.duetOn = () => !!(MK.S && MK.S.duet && MK.S.duet.until > Date.now());
/* ---------- Chef-Anzug fürs Imperium ---------- */
MK.suitOk = s => MK.reqMet(s.req);
MK.suitCur = () => { const S = MK.S, s = MK.SUITS.find(x => x.id === S.suit); return s && MK.suitOk(s) ? s : MK.SUITS.filter(MK.suitOk).pop() || null; };
})(window.MK);
