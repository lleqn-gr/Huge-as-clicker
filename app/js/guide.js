/* Muskelklicker – Führung durchs Spiel: Funktionen schalten sich nach und nach frei (mit kurzer Einführung),
   und nach jedem Duell/Turnier eine Ergebnis-Einblendung im Gym */
window.MK = window.MK || {};
(function (MK) {
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);

/* ---------- Freischaltungen: schnell, aber eins nach dem anderen ---------- */
// tab = Reiter, els = Elemente in der Kopfzeile, where = Bereich innerhalb eines Reiters
const F = MK.FEATURES = [
  { id: 'shop', how: ["Mehr Gewicht = mehr XP pro Wiederholung", "Geräte schalten neue Übungen frei", "Tipp: Kauf jetzt das nächste Gewicht für deine Arme"],    tab: 'shop',  name: 'Laden',       txt: 'Hier kaufst du schwerere Gewichte und neue Geräte. Mehr Gewicht = mehr XP pro Wiederholung.', h: S => `noch ${Math.max(0, 15 - S.stats.reps)} Wiederholungen`, c: S => S.stats.reps >= 15 },
  { id: 'comp', how: ["Je stärker die passenden Muskeln, desto leichter", "Ziel erreicht = sofort gewonnen", "Jeder besiegte Gegner öffnet den nächsten – und neue Duelle"],    tab: 'comp',  name: 'Duelle',      txt: 'Kevin aus dem Kurs wartet auf dich. Duelle bringen Geld und Ruhm. Je stärker die passenden Muskeln, desto leichter.', h: S => `noch ${Math.max(0, 45 - S.stats.reps)} Wiederholungen`, c: S => S.stats.reps >= 45 || MK.totalLv() >= 6 },
  { id: 'skill', how: ["Für Level-ups gibt es Skillpunkte", "Skills geben dauerhafte Boni: mehr XP, mehr Geld, mehr Glück"],   els: ['spBtn'], name: 'Skillbaum', txt: 'Für Level gibt es Skillpunkte. Im Skillbaum machst du dich dauerhaft stärker.', h: () => 'ersten Skillpunkt sammeln (Level aufsteigen)', c: S => S.sp > 0 || S.skills.length > 1 },
  { id: 'biz', how: ["Kauf Geschäfte – sie verdienen jede Sekunde Geld", "Mehr Stück vom selben Geschäft = Ausbau ×2", "Neue Geschäfte gibt es über Turnier-Titel"],     tab: 'biz',   name: 'Imperium',    txt: 'Dein erstes Geschäft: Pfandflaschen sammeln. Geschäfte verdienen Geld – auch wenn du gerade nicht trainierst.', h: () => 'erstes Duell gewinnen', c: S => S.stats.wins >= 1 },
  { id: 'fame', how: ["Ruhm gibt es für Siege, Memes und virale Clips", "Mehr Ruhm = mehr Zuschauer im Gym", "Ruhm öffnet Turniere, Sponsoren und bessere Gyms"],    els: ['fame'], name: 'Ruhm',       txt: 'Ruhm gibt es für Siege und virale Clips. Er öffnet Turniere, Sponsoren und neue Gyms.', h: () => 'erstes Duell gewinnen', c: S => S.fame >= 1 },
  { id: 'troph', how: ["Erfolge bringen Belohnungen", "Hier siehst du alle Pokale aus Turnieren"],   tab: 'troph', name: 'Pokale',      txt: 'Hier sammelst du Erfolge und Pokale – jeder bringt eine Belohnung.', h: S => `${Math.max(0, 2 - S.stats.wins)} Duell-Siege fehlen`, c: S => S.stats.wins >= 2 },
  { id: 'tourney', how: ["Mehrere Runden hintereinander, Startgeld nötig", "Sieg = Titel – Titel öffnen neue Geschäfte und Gyms", "Achte auf die Körperfett-Grenze (KFA)"], where: 'comp', name: 'Turniere',   txt: 'Turniere bestehen aus mehreren Runden. Wer gewinnt, bekommt einen Titel – Titel öffnen neue Geschäfte und Gyms.', h: S => `Klimmzug-Duell: ${Math.max(0, 2 - (S.beat.klimm || 0))} Gegner fehlen`, c: S => (S.beat.klimm || 0) >= 2 },
  { id: 'ward', how: ["Kleidung, Frisur, Bart, Bräune", "Bräune bringt im Wettkampf extra Ruhm", "Gedrückt halten auf der Figur = Rückansicht"],    tab: 'ward',  name: 'Outfit',      txt: 'Klamotten, Frisur, Bräune. Bräune bringt im Wettkampf extra Ruhm.', h: S => `${Math.max(0, 3 - S.stats.wins)} Siege oder 500 €`, c: S => S.stats.wins >= 3 || S.money >= 500 },
  { id: 'daily', how: ["Täglicher Login-Bonus", "Tagesaufgaben und eine Wochen-Challenge"],   tab: 'daily', name: 'Täglich',     txt: 'Jeden Tag neue Aufgaben, eine Login-Belohnung und eine Wochen-Challenge.', h: () => `Gesamt-Level 10 (du: ${MK.totalLv()})`, c: S => MK.totalLv() >= 10 },
  { id: 'gym', how: ["Gym ausbauen und Ausstattung verbessern", "Später in größere Gyms umziehen"],     tab: 'gym',   name: 'Gym',         txt: 'Rüste dein Gym auf und zieh später in bessere Gyms um – mit mehr Zuschauern und mehr Ruhm.', h: S => `${Math.max(0, 4 - S.stats.wins)} Siege oder ein Turniertitel`, c: S => S.stats.wins >= 4 || Object.keys(S.trophies || {}).length >= 1 },
  { id: 'dia', how: ["Diamanten sind die seltene Währung", "Im Shop: Haustiere, Helfer, Diamant-Pakete"],     els: ['dia', 'dshopBtn'], name: 'Diamanten & Shop', txt: 'Diamanten sind die seltene Währung. Im Shop gibt es Haustiere, Helfer und Diamant-Pakete.', h: S => `ersten Diamanten finden oder ${Math.max(0, 5 - S.stats.wins)} Siege`, c: S => S.dia > 0 || S.stats.wins >= 5 },
  { id: 'rival', how: ["Dein Rivale fordert dich regelmäßig heraus", "Jede Woche ein Event mit Outfit als Preis"],   where: 'comp', name: 'Rivale & Wochen-Event', txt: 'Dein Rivale fordert dich jetzt regelmäßig heraus – und jede Woche gibt es ein Event mit Outfit als Preis.', h: () => `Gesamt-Level 16 (du: ${MK.totalLv()}) oder Vereinsmeister`, c: S => MK.totalLv() >= 16 || !!(S.trophies || {}).verein },
  { id: 'lab', how: ["Mittel erforschen, verbessern, nehmen", "Höhere Reinheit = leichtere Dopingkontrolle", "Vor Turnieren wird kontrolliert, wenn etwas wirkt"],     els: ['labBtn'], name: 'Labor', txt: 'Im Labor erforschst du Mittel, mit denen du schneller wirst. Aber Achtung: Wer etwas im Blut hat, muss vor Turnieren zur Dopingkontrolle.', h: () => 'Titel „Vereinsmeister“ holen', c: S => !!(S.trophies || {}).verein }
];
MK.unl = id => { const S = MK.S; return !S || !S.unl || !!S.unl[id]; };
const elOf = id => { const e = $(id); return e ? (e.closest('.chip') || e) : null; };
MK.applyUnl = function () { F.forEach(f => { const on = MK.unl(f.id);
  if (f.tab) document.querySelectorAll(`.tab[data-tab="${f.tab}"]`).forEach(b => b.classList.toggle('locked', !on));
  (f.els || []).forEach(id => { const e = elOf(id); if (e) e.classList.toggle('locked', !on); }); }); };
const queue = []; let showing = false;
MK.guideInit = function () { const S = MK.S;
  // Auch bestehende Spielstände bekommen alles einmal Schritt für Schritt gezeigt (Fortschritt bleibt erhalten)
  if (S.unlV !== 2) { S.unlV = 2; S.unl = {}; S.intro = {}; }
  if (!S.intro) S.intro = {};
  MK.applyUnl();
  document.addEventListener('click', e => { const b = e.target.closest('.tab.newt'); if (b) b.classList.remove('newt'); const c = e.target.closest('.chip.newt'); if (c) c.classList.remove('newt'); }, true); };
let gap = 0;
/* Einführung nur einmal: wurde alles schon einmal gezeigt (oder dieser Spielstand ist durch), schalten Funktionen still frei */
MK.introDone = () => { const S = MK.S; if (S && S.introAll) return true; try { return localStorage.getItem('mk_intro_done') === '1'; } catch (e) { return false; } };
function introCheckAll() { const S = MK.S; if (!S.introAll && F.every(f => S.unl[f.id])) { S.introAll = 1; try { localStorage.setItem('mk_intro_done', '1'); } catch (e) { } } }
MK.guideTick = function () { const S = MK.S; if (!S || !S.unl) return;
  introCheckAll();
  if (MK.introDone()) { let ch = false; F.forEach(f => { if (!S.unl[f.id] && f.c(S)) { S.unl[f.id] = true; if (S.intro) S.intro[f.id] = 1; mark(f); ch = true; } }); if (ch) { MK.applyUnl(); MK.save(); MK.UI.refresh(); } queue.length = 0; }
  // erst freischalten, wenn es gezeigt wird – immer eins nach dem anderen
  F.forEach(f => { if (!S.unl[f.id] && !queue.includes(f) && f.c(S)) queue.push(f); });
  if (gap > 0) { gap--; return; }
  const rc = $('resCard'), free = !showing && !MK.Comp.cur && !(MK.DT && MK.DT.cur) && $('skills').hidden && (!rc || rc.hidden) && $('offl').hidden;
  if (free && queue.length) show(queue.shift()); else { newsCheck(); if (free && news.length) showNews(news.shift()); } };
/* ---------- Große Neuigkeiten: neue Muskelgruppe, Übung, Gym, Geschäft, Turnier – gleiches Popup mit „Ansehen“ ---------- */
const news = [];
function newsList() { const S = MK.S, out = [], go = t => () => { const b = document.querySelector(`.tab[data-tab="${t}"]`); if (b) b.click(); if (matchMedia('(max-width:900px)').matches) { const sd = document.querySelector('.side'); if (sd) sd.scrollIntoView({ behavior: 'smooth', block: 'end' }); } };
  MK.MUSCLES.forEach(m => { if (m.unlock > 0 && MK.groupOpen(m.id)) out.push({ k: 'g:' + m.id, name: `Neue Muskelgruppe: ${m.name}`, txt: `Ab jetzt kannst du ${m.name} trainieren. Jede Gruppe zählt für andere Duelle.`, how: ['Neue Übungen und eigene Gewichte', 'Eigene Technik-Stufen (×2 XP)'], go: () => { S.g = m.id; MK.UI.training(); } }); });
  MK.EXERCISES.forEach(e => { const grpOk = MK.groupOpen(e.g), lvOk = S.m[e.g].lv >= e.lv; if (!grpOk || !lvOk || e.lv <= 1) return; const has = !e.eq || S.eq[e.eq];
    out.push({ k: 'e:' + e.id, name: `Neue Übung: ${e.name}`, txt: has ? `Bringt ×${MK.fmt1(e.xm)} XP pro Wiederholung und eigene Technik-Stufen.` : `Ab jetzt möglich – du brauchst noch das passende Gerät aus dem Gym-Reiter.`, how: [`×${MK.fmt1(e.xm)} XP pro Wiederholung`, 'Technik-Stufen geben der ganzen Gruppe ×2 XP'], go: has ? () => { S.g = e.g; S.ex[e.g] = e.id; MK.UI.training(); } : go('gym') }); });
  const ng = MK.GYMS[S.gym + 1]; if (ng && MK.gymOk(ng)) out.push({ k: 'gym:' + (S.gym + 1), name: `Neues Gym: ${ng.name}`, txt: 'Du darfst umziehen: mehr Zuschauer, mehr Ruhm, neue Ausstattung.', how: ['Umzug im Gym-Reiter', 'Neuer Rivale wartet dort'], go: go('gym') });
  MK.BIZ.forEach(B => { if (B.req && !MK.bizOpen(B) && MK.reqMet(B.req)) out.push({ k: 'b:' + B.id, name: `Neues Geschäft: ${B.name}`, txt: B.desc || 'Ein neues Geschäft ist verfügbar.', how: ['Lizenz im Imperium kaufen', 'Verdient Geld – auch offline'], go: go('biz') }); });
  (MK.TOURNEYS || []).forEach(T => { const rq = (T.req || []).filter(r => r.kfa == null); if (rq.length && MK.reqMet(rq) && !(S.trophies && S.trophies[T.id])) out.push({ k: 't:' + T.id, name: `Neues Turnier: ${T.name}`, txt: `Gewinne und werde ${T.title || 'Champion'}. Titel öffnen neue Geschäfte und Gyms.`, how: ['Mehrere Runden hintereinander', 'Startgeld: ' + MK.fmt(T.fee || 0) + ' €'], go: go('comp') }); });
  return out; }
let nT = 0;
function newsCheck() { const S = MK.S; if (!MK.unl('shop')) return; if ((nT -= 1) > 0) return; nT = 2;
  const L = newsList(); if (!S.news) { S.news = {}; L.forEach(n => S.news[n.k] = 1); return; } // bestehende Spielstände: was schon da ist, nicht nochmal melden
  L.forEach(n => { if (!S.news[n.k] && !news.some(x => x.k === n.k)) news.push(n); }); }
function showNews(n) { showing = true; MK.S.news[n.k] = 1; MK.save(); let box = $('unlPop'); if (!box) { box = document.createElement('div'); box.id = 'unlPop'; box.className = 'unlpop'; $('view').appendChild(box); }
  box.innerHTML = `<div class="ub nb">NEU VERFÜGBAR</div><h4>${esc(n.name)}</h4><p>${esc(n.txt)}</p>${n.how ? `<ul class="uhow">${n.how.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
    <div class="row2"><button class="btn ok" id="unlGo">Ansehen</button><button class="ghost" id="unlLater">Später</button></div>`;
  box.hidden = false; box.classList.remove('in'); void box.offsetWidth; box.classList.add('in'); MK.Audio.play('level'); MK.Scene.particle && MK.Scene.particle('confetti', MK.Scene.W / 2, MK.Scene.H * .3, 24);
  const done = () => { box.hidden = true; showing = false; gap = 2; };
  $('unlLater').onclick = done; $('unlGo').onclick = () => { done(); try { n.go(); } catch (e) { } }; }
function mark(f) { if (f.tab) document.querySelectorAll(`.tab[data-tab="${f.tab}"]`).forEach(b => b.classList.add('newt')); (f.els || []).forEach(id => { const e = elOf(id); if (e) e.classList.add('newt'); }); if (f.where) document.querySelectorAll(`.tab[data-tab="${f.where}"]`).forEach(b => b.classList.add('newt')); }
function show(f) { showing = true; MK.S.unl[f.id] = true; MK.applyUnl(); MK.save(); MK.UI.refresh(); mark(f); let box = $('unlPop'); if (!box) { box = document.createElement('div'); box.id = 'unlPop'; box.className = 'unlpop'; $('view').appendChild(box); }
  const n = F.filter(x => MK.S.unl[x.id]).length;
  box.innerHTML = `<div class="ub">NEU FREIGESCHALTET</div><h4>${esc(f.name)}</h4><p><b>Günther:</b> ${esc(f.txt)}</p>${f.how ? `<ul class="uhow">${f.how.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}<div class="uprog"><i style="width:${Math.round(n / F.length * 100)}%"></i><span>${n} / ${F.length} entdeckt</span></div>
    <div class="row2"><button class="btn ok" id="unlGo">Ansehen</button><button class="ghost" id="unlLater">Später</button></div>`;
  box.hidden = false; box.classList.remove('in'); void box.offsetWidth; box.classList.add('in');
  MK.Audio.play('level'); MK.Scene.particle && MK.Scene.particle('confetti', MK.Scene.W / 2, MK.Scene.H * .3, 30);
  const done = () => { box.hidden = true; showing = false; gap = 1; };
  $('unlLater').onclick = done;
  $('unlGo').onclick = () => { done(); const t = f.tab || f.where; if (t) { const b = document.querySelector(`.tab[data-tab="${t}"]`); if (b) b.click(); if (matchMedia('(max-width:900px)').matches) document.querySelector('.side').scrollIntoView({ behavior: 'smooth', block: 'end' }); }
    else if (f.els) { const e = $(f.els[f.els.length - 1]); if (e && e.tagName === 'BUTTON') e.click(); } }; }

/* Einführung oben im Reiter, bis „Verstanden“ */
MK.introBox = function (P, tab) { const S = MK.S; if (!S.intro || MK.introDone()) return; const fs = F.filter(f => (f.tab === tab || f.where === tab) && MK.unl(f.id) && f.how && !S.intro[f.id]); if (!fs.length) return;
  const f = fs[0], d = document.createElement('div'); d.className = 'how intro'; d.innerHTML = `<b>So funktioniert: ${esc(f.name)}</b><ol>${f.how.map(x => `<li>${esc(x)}</li>`).join('')}</ol><button class="btn ok sm" type="button">Verstanden</button>`;
  P.prepend(d); d.querySelector('button').onclick = () => { S.intro[f.id] = 1; MK.save(); d.remove(); MK.introBox(P, tab); }; };
/* Platzhalter-Seite: was als Nächstes kommt */
MK.paneTeaser = function (P, f) { const S = MK.S, next = F.filter(x => !MK.unl(x.id)).slice(0, 4);
  P.innerHTML = `<h3 class="sh">${f ? esc(f.name) + ' – bald' : 'Gleich geht’s los'}</h3><div class="how"><b>Günther sagt:</b> Erst mal trainieren! Neue Bereiche schalten sich nach und nach frei.</div>` +
    next.map(x => `<div class="card locked"><div class="row"><div><h4>🔒 ${esc(x.name)}</h4><p class="small">${esc(x.h ? x.h(S) : '')}</p></div></div></div>`).join(''); };
MK.tabFeature = t => F.find(f => f.tab === t);

/* ---------- Ergebnis-Einblendung nach Duell / Turnier ---------- */
MK.resultCard = function (r) { if (!r) return; let box = $('resCard'); if (!box) { box = document.createElement('div'); box.id = 'resCard'; $('view').appendChild(box); }
  const W = r.win, lines = [];
  if (r.reward) lines.push(`<span class="rc-r">${esc(r.reward)}</span>`); else { if (r.money) lines.push(`<span class="rc-m">+${MK.fmt(r.money)} €</span>`); if (r.fame) lines.push(`<span class="rc-f">+${MK.fmt1(r.fame)} Ruhm</span>`); }
  const sub = r.kind === 'tourney' ? (W ? `${esc(r.tname)} gewonnen!` : `${esc(r.tname)} · ausgeschieden in Runde ${r.round + 1}/${r.rounds}`) : r.kind === 'event' ? (W ? 'Wochen-Event gewonnen!' : `Wochen-Event · Runde ${r.round + 1}/${r.rounds}`) : `${esc(r.disc)} · gegen ${esc(r.opp)}`;
  box.className = 'rescard ' + (W ? 'w' : 'l');
  box.innerHTML = `<div class="rc-burst${W && r.kind === 'tourney' ? ' long' : ''}">${W ? (r.kind === 'tourney' ? 'TURNIERSIEG!' : 'GEWONNEN!') : 'VERLOREN'}</div><p class="rc-sub">${sub}</p>
    ${lines.length ? `<div class="rc-row">${lines.join('')}</div>` : ''}
    ${r.title ? `<div class="rc-title">🏅 Neuer Titel: <b>„${esc(r.title)}“</b></div>` : ''}
    ${r.opens && r.opens.length ? `<p class="rc-un">Öffnet: ${r.opens.map(esc).join(', ')}</p>` : ''}
    ${r.unlocks && r.unlocks.length ? `<p class="rc-un">Neu: ${r.unlocks.map(esc).join(', ')}</p>` : ''}
    ${!W && r.tip ? `<p class="rc-tip">${esc(r.tip)}</p>` : ''}<small>Tippen zum Schließen</small>`;
  box.hidden = false; box.classList.remove('in'); void box.offsetWidth; box.classList.add('in');
  if (W) { MK.Scene.particle('confetti', MK.Scene.W / 2, MK.Scene.H * .25, r.title ? 90 : 50); MK.Audio.play(r.title ? 'win' : 'cheer'); MK.Scene.vis.cheer = 3; MK.Scene.setFace('proud', 2500); }
  else { MK.Audio.play('lose'); MK.Scene.setFace('sad', 2000); }
  clearTimeout(box._t); box._t = setTimeout(() => { box.hidden = true; }, r.title ? 7000 : 4500);
  box.onclick = () => { box.hidden = true; }; };
})(window.MK);
