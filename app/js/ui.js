/* Muskelklicker – Oberfläche: Training, Reiter, Skillbaum, Tutorial, Meldungen */
window.MK = window.MK || {};
(function (MK) {
const U = MK.UI = {};
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let tab = 'comp', optTab = 'set';

/* ---------- Meldungen ---------- */
let toastT;
U.toast = function (msg, kind) { const t = $('toast'); t.textContent = msg; t.className = 'toast show ' + (kind || ''); clearTimeout(toastT); toastT = setTimeout(() => t.className = 'toast', 2600); };

/* ---------- Kaufknöpfe live: grau wenn etwas fehlt, Tipp darauf erklärt was ---------- */
U.buyState = function (b) {
  const S = MK.S, pr = +b.dataset.pr, dia = b.dataset.cur === 'dia', have = dia ? S.dia : S.money;
  if (b.dataset.need) return b.dataset.need;
  if (have < pr) return dia ? `Dir fehlen noch ${MK.fmt(pr - have)} 💎` : `Dir fehlen noch ${MK.fmt(pr - have)} €${b.dataset.what ? ' für ' + b.dataset.what : ''}`;
  return '';
};
U.liveBuy = function () {
  document.querySelectorAll('#pane [data-pr]').forEach(b => { const why = U.buyState(b), off = !!why;
    if (b.classList.contains('off') !== off) { b.classList.toggle('off', off); b.setAttribute('aria-disabled', off); }
    const card = b.closest('.card'); if (!card) return; let m = card.querySelector(':scope > .miss');
    if (!m) { m = document.createElement('p'); m.className = 'miss'; card.appendChild(m); }
    if (m.textContent) m.textContent = ''; }); // keine „Dir fehlen noch“-Zeilen: grauer Knopf reicht, Tippen erklärt es
};
/* ---------- Kopfzeile & Balken ---------- */
const setT = (id, v) => { const e = $(id); if (e && e._t !== v) { e._t = v; e.textContent = v; } }, setW = (id, v) => { const e = $(id); if (e && e._w !== v) { e._w = v; e.style.width = v; } }, setH = (el, v) => { if (el && el._h !== v) { el._h = v; el.innerHTML = v; } };
U.quick = function () {
  const S = MK.S;
  U.liveBuy(); MK.labUi && MK.labUi();
  { const inc = MK.income(); setT('mps', inc > 0 ? '+' + (inc < 10 ? MK.fmt1(inc) : MK.fmt(inc)) + ' €/s' : 'Geld'); }
  const bd = $('bizDot'); if (bd) bd.hidden = !MK.BIZ.some(B => MK.bizOpen(B) && S.money >= MK.bizCost(B, 1)) && !MK.bizUps().some(u => u.ok && S.money >= u.cost) && !MK.BIZ.some(B => MK.bizCount(B.id) >= MK.perkNeed(B.id) && S.money >= MK.perkCost(B.id)); setT('dia', MK.fmt(S.dia)); setT('sp', MK.fmt(S.sp)); setT('fame', MK.fmt(S.fame));
  $('spBtn').classList.toggle('glow', S.sp > 0 && MK.SKILLS.some(n => MK.skillAvail(n.id) && S.sp >= n.cost));
  setW('bst', Math.round(S.pump * 100) + '%'); $('bstBar').classList.toggle('on', S.beastOn > 0); $('bstBar').classList.toggle('cd', S.beastOn <= 0 && S.beastCd > 0);
  setT('bstTxt', S.beastOn <= 0 && S.beastCd > 0 ? `Beast lädt · ${Math.ceil(S.beastCd)} s · ×${MK.fmt1(MK.pumpMul())} XP & Geld` : S.beastOn > 0 ? `BEAST MODE · ${Math.ceil(S.beastOn)} s · ×${MK.fmt1(MK.pumpMul() * (2 + MK.bonus().beastMul))}` : `×${MK.fmt1(MK.pumpMul())} XP & Geld`);
  setT('rank', MK.rankName()); setT('ttl', `${MK.fmt1(MK.bodyKg())} kg · ${MK.kfaCached()} % KFA`);
  const ex = MK.curEx(); if (ex) { const m = S.m[ex.g]; setT('xpTxt', `${MK.MUSCLES.find(x => x.id === ex.g).name} Lv ${m.lv} · ${MK.fmt(m.xp)} / ${MK.fmt(MK.need(m.lv, ex.g))} XP`); }
  const th = MK.dailyTheme(), wx = MK.Scene.weather(); setT('theme', (th ? `${th.name} +10 % · ` : '') + MK.Scene.WEATHER_NAME[wx]);
  // „Nächstes Ziel“-Leiste entfernt
  $('shopDot').hidden = !MK.canBuySomething();
  const now = Date.now(), buffs = S.buffs.filter(b => b.until > now), sec = u => Math.ceil((u - now) / 1000) + ' s';
  let bh = buffs.map(b => `<span>${{ xp: 'Shake', xp2: 'Lasagne', meal: 'Mahlzeit', regen: 'Quark', prep: 'Meal-Prep' }[b.k] || 'Bonus'} ${sec(b.until)}</span>`).join('');
  if (S.cut && S.cut.until > now) bh += `<span>Definition ${sec(S.cut.until)}</span>`;
  const ge = MK.gev(); if (ge) bh += `<span class="ev">${MK.GYM_EVENTS.find(e => e.id === ge).name.replace('!', '')} ${sec(S.gev.until)}</span>`;
  if (MK.duetOn()) bh += `<span>Duett mit Kevin ${sec(S.duet.until)}</span>`;
  if (MK.strainG()) bh += `<span class="bad">Zerrung ${sec(S.strain.until)}</span>`;
  if (tab === 'biz' && bizN === 'max' && performance.now() - (U._bizT || 0) > 1500) { U._bizT = performance.now(); const P2 = $('pane'), sc = P2.scrollTop; paneBiz(P2); P2.scrollTop = sc; }
  if (bh !== U._bh) { U._bh = bh; $('buffs').innerHTML = bh; }
  const pd = MK.planDay(), ps = $('planStrip'); if (ps) { if (pd) { ps.hidden = false; const h2 = `<b>Plan: ${pd.day.n}-Tag</b> <span>${S.plan.p} / ${pd.quota} Wdh. · +15 % XP auf ${pd.day.g.map(g => MK.MUSCLES.find(m => m.id === g).name).join(', ')}</span><i style="width:${Math.min(100, S.plan.p / pd.quota * 100)}%"></i>`; if (ps._h !== h2) { ps._h = h2; ps.innerHTML = h2; } } else ps.hidden = true; }
  document.querySelectorAll('[data-tbar]').forEach(i => { const id = i.dataset.tbar, r = (S.stats.byEx || {})[id] || 0, tl = MK.techLvOf(r), lo = tl ? MK.TECH_T(tl - 1) : 0, hi = MK.TECH_T(tl), w = Math.min(100, (r - lo) / (hi - lo) * 100).toFixed(1) + '%'; if (i._w !== w) { i._w = w; i.style.width = w; } const n = document.querySelector(`[data-tnum="${id}"]`); if (n) { const t = `${MK.fmtS(Math.floor(r))}/${MK.fmtS(hi)}`; if (n._t !== t) { n._t = t; n.textContent = t; } } });
  document.querySelectorAll('[data-gchip]').forEach(b => { const g = b.dataset.gchip; const m = S.m[g]; const sm = b.querySelector('i'); if (sm) { const w = (m.xp / MK.need(m.lv, g) * 100).toFixed(1) + '%'; if (sm._w !== w) { sm._w = w; sm.style.width = w; } } const lv = b.querySelector('small'); if (lv && MK.groupOpen(g)) { const v = 'Lv ' + m.lv; if (lv._t !== v) { lv._t = v; lv.textContent = v; } const seen = (U._lvSeen = U._lvSeen || {}); if (seen[g] != null && m.lv > seen[g]) { lv.classList.remove('lvpop'); b.classList.remove('lvflash'); void lv.offsetWidth; lv.classList.add('lvpop'); b.classList.add('lvflash'); } seen[g] = m.lv; } });
};

/* ---------- Training: Gruppen, Übungen, Gewicht ---------- */
U.training = function () {
  const S = MK.S;
  $('groups').innerHTML = MK.MUSCLES.map(m => { const open = MK.groupOpen(m.id);
    const pdd = MK.planDay(), inP = pdd && pdd.day.g.includes(m.id);
    return `<button class="gchip ${inP ? 'plan' : ''}" data-gchip="${m.id}" style="--c:${m.col}" aria-pressed="${S.g === m.id}" ${open ? '' : 'disabled'}><b>${m.name}</b><small>${open ? 'Lv ' + S.m[m.id].lv : 'ab Lv ' + m.unlock}</small><span class="mini"><i></i></span></button>`; }).join('');
  $('groups').querySelectorAll('[data-gchip]').forEach(b => b.onclick = () => { S.g = b.dataset.gchip; MK.Audio.play('pop'); U.training(); });
  const exs = MK.EXERCISES.filter(e => e.g === S.g);
  if (!MK.exOpen(MK.curEx())) { const first = exs.find(MK.exOpen); if (first) S.ex[S.g] = first.id; }
  $('exs').innerHTML = exs.map(e => { const open = MK.exOpen(e); let why = '';
    if (!open) { if (S.m[e.g].lv < e.lv) why = `ab Lv ${e.lv}`; else if (e.eq && !S.eq[e.eq]) why = 'braucht ' + MK.EQUIP.find(q => q.id === e.eq).name; }
    const tl = MK.techLv(e.id), stars = tl ? '★'.repeat(Math.min(4, tl)) + (tl > 4 ? ' ' + MK.techName(tl - 1) : '') : '';
    return `<button class="exchip" data-ex="${e.id}" aria-pressed="${S.ex[S.g] === e.id}" ${open ? '' : 'disabled'}><b>${e.name}</b>${open ? `<span class="tch">${stars || 'Technik'}<em data-tnum="${e.id}"></em></span><span class="tbar"><i data-tbar="${e.id}"></i></span>` : `<small>${why}</small>`}</button>`; }).join('');
  $('exs').querySelectorAll('[data-ex]').forEach(b => b.onclick = () => { S.ex[S.g] = b.dataset.ex; MK.Audio.play('pop'); U.training(); });
  U.weight();
};
U.weight = function () {
  const S = MK.S, ex = MK.curEx(); if (!ex || !MK.exOpen(ex)) { $('wsel').innerHTML = '<p class="hint">Keine Übung verfügbar.</p>'; return; }
  const wi = MK.wCur(ex), mx = MK.wMax(ex), xp = MK.xpPerRep(ex, wi);
  $('wsel').innerHTML = `<button class="wbtn" id="wMinus" ${wi <= 0 ? 'disabled' : ''} aria-label="Leichter">−</button>
    <div class="winfo"><b>${MK.wLabel(ex, wi)}</b><small>${MK.fmtS(xp)} XP je Wdh.${MK.techCount(ex.g) ? `<span class="wtech">Technik ×${MK.fmtS(MK.techMul(ex.g))}</span>` : ''}</small></div>
    <button class="wbtn" id="wPlus" ${wi >= mx ? 'disabled' : ''} aria-label="Schwerer">+</button>
    <p class="wnext">${ex.g === 'ausdauer' ? (() => { const E = MK.endur(); return `🫁 Kondition für Duelle: +${Math.round(E.time * 100)} % Zeit · Griff hält ${Math.round((E.grip - 1) * 100)} % länger ${ib('Jedes Ausdauer-Level: +1,5 % Zeit in allen Duellen (max. +75 %), dein Griff beim Klimmzug-Duell leert sich langsamer und erholt sich schneller. Außerdem hält der Pump länger.')}`; })() : wi >= mx ? 'Schwerer: ' + MK.wNextReq(ex) : ''}</p>${(() => { const w = MK.weak(ex); if (!w || wi <= w.max) return ''; const gm = MK.MUSCLES.find(m => m.id === w.g);
      return `<p class="wwarn">⚠ Zerrungsgefahr (${gm.name} zu schwach) · sicher bis ${MK.wLabel(ex, w.max)}</p>`; })()}${ex.hold ? '<p class="whint">Gleichmäßig weitertippen: bis ×2 XP.</p>' : ex.anim === 'rope' ? '<p class="whint">Im Takt tippen: bis ×2 XP.</p>' : ''}`;
  $('wMinus').onclick = () => { S.w[ex.id] = Math.max(0, wi - 1); U.weight(); MK.Audio.play('clank', 0); };
  $('wPlus').onclick = () => { S.w[ex.id] = Math.min(mx, wi + 1); U.weight(); MK.Audio.play('clank', 4); };
};

/* ---------- Reiter ---------- */
U.tabs = function () {
  new MutationObserver(() => U.liveBuy()).observe($('pane'), { childList: true, subtree: true });
  $('pane').addEventListener('click', e => { const b = e.target.closest('[data-pr].off'); if (!b) return; e.stopPropagation(); e.preventDefault(); const why = U.buyState(b); if (why) { U.toast(why); MK.Audio.play('error'); } else { b.classList.remove('off'); b.click(); } }, true);
  document.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { go(b.dataset.tab); });
  // Wischen zwischen den Seiten (links/rechts), Hoch/Runter bleibt Scrollen
  const P = $('pane'); let sx = 0, sy = 0, st = 0, on = false;
  P.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && e.button !== 0) return; if (e.target.closest('input,textarea,select')) return; sx = e.clientX; sy = e.clientY; st = performance.now(); on = true; });
  P.addEventListener('pointerup', e => { if (!on) return; on = false; const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.6 && performance.now() - st < 800) { const vis = tabList(), i = vis.indexOf(tab), j = i + (dx < 0 ? 1 : -1); if (j >= 0 && j < vis.length) { go(vis[j], dx < 0 ? 'sl' : 'sr'); P._swiped = performance.now(); } } });
  P.addEventListener('pointercancel', () => { on = false; });
  P.addEventListener('click', e => { if (P._swiped && performance.now() - P._swiped < 300) { e.stopPropagation(); e.preventDefault(); } }, true);
};
const mobile = () => matchMedia('(max-width:900px)').matches;
const tabList = () => [...document.querySelectorAll('[data-tab]')].filter(b => getComputedStyle(b).display !== 'none').map(b => b.dataset.tab);
function go(t, anim) { document.querySelectorAll('.tab.extra').forEach(b => { if (b.dataset.tab !== t) b.remove(); }); // Küche/Shop/Trainer verschwinden, sobald man woanders hin wechselt
  const vis = tabList(); if (!anim) anim = vis.indexOf(t) > vis.indexOf(tab) ? 'sl' : 'sr'; tab = t; U.renderTab(); MK.Audio.play('pop'); const P = $('pane'); P.classList.remove('sl', 'sr'); void P.offsetWidth; P.classList.add(anim); }
/* Marker gleitet unter den aktiven Reiter */
U.tabMark = function () { const T = document.querySelector('.tabs'); if (!T) return; let m = T.querySelector('.tabmark'); if (!m) { m = document.createElement('i'); m.className = 'tabmark'; T.prepend(m); T.classList.add('marked'); }
  const b = T.querySelector('.tab[aria-selected="true"]'); if (!b || !b.offsetWidth) { m.style.width = '0px'; return; } m.style.width = b.offsetWidth + 'px'; m.style.transform = `translateX(${b.offsetLeft}px)`; };
addEventListener('resize', () => U.tabMark());
U.renderTab = function () {
  const P = $('pane'), tr = $('train');
  if (!mobile() && tab === 'train') tab = 'comp';
  const lockF = MK.tabFeature && MK.tabFeature(tab), locked = lockF && !MK.unl(lockF.id);
  if (tr.parentNode === P) $('stage').appendChild(tr); // Trainingsbereich zurück unter die Bühne
  document.querySelectorAll('[data-tab]').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === tab));
  requestAnimationFrame(U.tabMark);
  P.classList.toggle('wardmode', tab === 'ward');
  if (tab === 'train') { P.innerHTML = ''; P.appendChild(tr); }
  else if (locked) MK.paneTeaser(P, lockF);
  else (({ comp: paneComp, biz: paneBiz, shop: paneShop, gym: paneGym, fridge: paneFridge, music: paneMusic, dshop: paneDShop, trainer: paneTrainer, ward: paneWard, daily: paneDaily, troph: paneTroph, opt: paneOpt })[tab] || (MK.EXTRA_PANES || {})[tab] || paneComp)(P);
  if (!locked && MK.introBox) MK.introBox(P, tab);
  const fresh = !(P._keep && P._keep[0] === tab);
  P.scrollTop = fresh ? 0 : P._keep[1];
  if (fresh && tab !== 'train' && !(MK.S.set && MK.S.set.reduce)) { let i = 0; [...P.children].forEach(el => { el.style.setProperty('--i', Math.min(14, i++)); }); P.classList.remove('stag'); void P.offsetWidth; P.classList.add('stag'); clearTimeout(P._stagT); P._stagT = setTimeout(() => P.classList.remove('stag'), 1100); }
  const dq = MK.S.quests; const due = [...(dq.list || []), ...(dq.wlist || [])].some(q => q.done && !q.claimed) || MK.S.daily.claimedDay !== MK.today() || (MK.S.wch && MK.S.wch.done && !MK.S.wch.claimed);
  $('dailyDot').hidden = !due;
  U.liveBuy();
};
U.refresh = () => { const P = $('pane'); P._keep = [tab, P.scrollTop]; U.quick(); U.renderTab(); P._keep = null; };
U.initLayout = function () { if (mobile()) tab = 'train'; let was = mobile(); addEventListener('resize', () => { const m = mobile(); if (m !== was) { was = m; if (m) tab = 'train'; U.renderTab(); } }); };

/* Info-Knopf: kurze Erklärung erst auf Antippen */
const ib = t => `<button class="ib" data-info="${esc(t)}" aria-label="Info">i</button>`;
U.info = function (btn) { let pop = document.getElementById('infoPop'); if (!pop) { pop = document.createElement('div'); pop.id = 'infoPop'; document.body.appendChild(pop); pop.onclick = () => { pop.hidden = true; }; }
  if (!pop.hidden && pop._b === btn) { pop.hidden = true; return; } pop._b = btn; pop.textContent = btn.dataset.info; pop.hidden = false;
  const r = btn.getBoundingClientRect(), w = Math.min(280, innerWidth - 20); pop.style.width = w + 'px'; pop.style.left = Math.max(10, Math.min(innerWidth - w - 10, r.left + r.width / 2 - w / 2)) + 'px';
  const ph = pop.offsetHeight; pop.style.top = (r.bottom + 8 + ph > innerHeight ? r.top - ph - 8 : r.bottom + 8) + 'px'; MK.Audio.play('tap'); };
document.addEventListener('click', e => { const b = e.target.closest('[data-info]'); if (b) { e.stopPropagation(); e.preventDefault(); U.info(b); return; } const pop = document.getElementById('infoPop'); if (pop && !pop.hidden && !e.target.closest('#infoPop')) pop.hidden = true; }, true);
/* Symbole je Muskelgruppe (statt überall einer Hantel) */
const GICON = {
 arme: "<path d=\"M10 7c1-2 6-2 8 0 1.5 1.5 1.5 4 .5 5.5L20 21c4-5 13-5 17 1 3 4 3 10-1 14-2 2-5 3-8 3H14c-5 0-8-4-7-9L8.5 13c-1-2-.5-4.5 1.5-6z\"/><path d=\"M20 21c-1 5 1 9 5 11M12 12h6\"/>",
 brust: "<path d=\"M24 13c-4-3-11-3.6-15 .4-2.6 2.6-2.6 8.2-.4 12.4 2.4 4.6 9.4 6.6 15.4 2.6 6 4 13 2 15.4-2.6 2.2-4.2 2.2-9.8-.4-12.4-4-4-11-3.4-15-.4z\"/><path d=\"M24 13v15M14 22c2.5 1.6 5.5 1.8 8 .6M34 22c-2.5 1.6-5.5 1.8-8 .6\"/>",
 beine: "<path d=\"M17 5h12c1 7 0 12-2 17 2 4 3 9 2 14l-.5 4H35c1.5 0 2 2 1 3H22l.5-6c-2-4-2-9-1-13-3-5-4.5-12-4.5-19z\"/><path d=\"M22 24c1.5.8 3.5.8 5 0\"/>",
 schulter: "<path d=\"M6 9h36M9 5v8M39 5v8M15 9l2 12M33 9l-2 12\"/><circle cx=\"24\" cy=\"16.5\" r=\"4\"/><path d=\"M16 22c2-1.2 4.6-1.6 8-1.6s6 .4 8 1.6l-2 18H18z\"/>",
 ruecken: "<path d=\"M9 10c5 2.4 10 3.4 15 3.4S34 12.4 39 10c1.8 6.4.6 12-3.6 17L30 39H18l-5.4-12C8.4 22 7.2 16.4 9 10z\"/><path d=\"M24 14v25M14 18c3 4.6 6.6 7 10 7s7-2.4 10-7\"/>",
 bauch: "<path d=\"M15 6h18c1.6 0 3 1.4 3 3v26c0 4-5.4 7-12 7s-12-3-12-7V9c0-1.6 1.4-3 3-3z\"/><path d=\"M24 7v33M13 15.5h22M13 24.5h22M14 33h20\"/>",
 nacken: "<circle cx=\"24\" cy=\"12\" r=\"6.5\"/><path d=\"M19.5 18v4.6c-4 2-9.6 3.4-13.6 5.2C4 28.8 3.4 31.4 4.6 34h38.8c1.2-2.6.6-5.2-1.3-6.2-4-1.8-9.6-3.2-13.6-5.2V18\"/><path d=\"M12 26.6c3.4 0 6.6 1.6 8.4 4M36 26.6c-3.4 0-6.6 1.6-8.4 4\"/>"
};
/* Bedingungen als Häkchen-Liste */
const reqList = (req, cls) => `<ul class="skreq ${cls || 'light'}">${[].concat(req || []).map(r => { const m = MK.reqMet(r), hv = MK.reqHave(r); return `<li class="${m ? 'ok' : 'no'}">${m ? '✓' : '✗'} ${MK.reqText(r)}${!m && hv != null ? ` <small>(du: ${typeof hv === 'number' ? MK.fmt(hv) : hv})</small>` : ''}</li>`; }).join('')}</ul>`;
const GN = id => MK.MUSCLES.find(m => m.id === id).name;
const focusOf = discs => { const w = {}; discs.forEach(id => { const d = MK.DISC.find(x => x.id === id); for (const g in d.groups) w[g] = (w[g] || 0) + d.groups[g]; }); const tot = Object.values(w).reduce((a, b) => a + b, 0);
  return Object.entries(w).sort((a, b) => b[1] - a[1]).map(([g, v]) => `${GN(g)} ${Math.round(v / tot * 100)} %`).join(' · '); };
/* --- Wettkampf --- */
function paneComp(P) {
  const S = MK.S, ev = MK.Comp.weekEvent(), evDone = S.event.week === MK.week() && S.event.done, b = MK.bonus();
  const tired = false;
  const rv = S.rival, pl = MK.totalLv(), ready = Date.now() > rv.next;
  let h = '';
  const tans = MK.WARD.tan.items.filter(it => MK.reqMet(it.req) && (!it.price || S.bought.includes(it.id + 'tan')));
  h += `<div class="card tanc"><div class="row"><div><h4>Wettkampf-Bräune</h4><p><b>+${Math.round((MK.Fig.resolveLook(Object.assign({}, S.look, S.compTan ? { tan: S.compTan } : {})).tan || 0) * 35)} % Ruhm</b></p></div>
    <select id="compTan" aria-label="Wettkampf-Bräune">${['', ...tans.map(t => t.id)].map(id => `<option value="${id}" ${(S.compTan || '') === id ? 'selected' : ''}>${id ? MK.WARD.tan.items.find(x => x.id === id).name : 'wie im Gym'}</option>`).join('')}</select></div></div>`;
  if (MK.unl('rival')) h += `<div class="card rival"><div class="row"><div><h4>Rivale: ${MK.RIVAL.full}</h4><p>Level ${Math.floor(rv.tot)} · du ${pl} · Bilanz ${rv.wins}:${rv.losses}</p></div>
    <button class="btn" data-act="rival" ${ready && !tired ? '' : 'disabled'}>${ready ? 'Duell' : 'Trainiert …'}</button></div></div>`;
  if (!MK.unl('rival')) {} else if (!MK.eventOpen()) h += `<div class="card event locked"><h4>Wochen-Event</h4><p>Ab Gesamt-Level 8</p></div>`;
  else h += `<div class="card event"><div class="row"><div><h4>Wochen-Event: ${ev.name}</h4><p>${ev.desc} · Outfit, 10 💎, 1 SP</p></div>
    <button class="btn alt" data-act="event" ${evDone || (!ev.mod.free && tired) ? 'disabled' : ''}>${evDone ? 'Geschafft' : 'Starten'}</button></div></div>`;
  h += `<h3 class="sh">Duelle ${ib('Je stärker die Muskeln, die zählen, desto leichter. Besiegte Gegner öffnen neue Duelle und Turniere.')}</h3>`;
  MK.DISC.forEach(d => {
    const open = MK.discOpen(d), i = Math.min(S.beat[d.id], 7), done = S.beat[d.id] >= 8;
    const prize = Math.round(MK.PRIZE[i] * d.mult * (1 + b.money) * (done ? .5 : 1) + MK.income() * (30 + i * 20)), tw = (d.tw || []).filter(x => i >= x.at);
    const info = `${d.how} Ziel: ${d.id === 'arm' ? 'Sieg' : d.goal[i] + ' ' + d.unit}. Preis: ${MK.fmt(prize)} €. Zählt: ${focusOf([d.id])}.${tw.length ? ' Kniffe: ' + tw.map(x => x.n + ' – ' + x.d).join(' ') : ''}`;
    const pips = `<span class="pips">${Array.from({ length: 8 }, (_, k) => `<i class="${k < S.beat[d.id] ? 'on' : ''}"></i>`).join('')}</span>`;
    h += `<div class="card disc ${open ? '' : 'locked'}"><div class="row"><div><h4>${d.name} ${ib(info)}</h4>${pips}
      ${open ? `<p class="small">${d.opp[i]} · 💪 ${MK.fmt1(MK.discPower(d))}</p>` : `<p class="small noc">🔒 ${[].concat(d.ureq).filter(r => !MK.reqMet(r)).map(MK.reqText).join(' · ')}</p>`}</div>
      ${open ? `<button class="btn" data-disc="${d.id}">Los</button>` : ''}</div></div>`;
  });
  if (!MK.unl('tourney')) h += `<div class="card tourney locked"><h4>🔒 Turniere</h4><p class="small noc">Klimmzug-Duell: 2 Gegner besiegen</p></div>`;
  else h += `<h3 class="sh">Turniere ${ib('Gewinnen = Titel. Titel öffnen neue Geschäfte im Imperium und neue Gyms. Jedes Turnier fordert andere Muskeln und einen niedrigen Körperfettanteil.')}</h3>`;
  if (MK.unl('tourney')) MK.TOURNEYS.forEach(T => { const ok = MK.tourOk(T), won = S.trophies[T.id] || 0, opens = [...MK.BIZ.filter(B => B.lic === T.id).map(B => B.icon + ' ' + B.name), ...MK.GYMS.filter(g => (g.req || []).some(r => r.trophy === T.id)).map(g => g.name)];
    const hidden = !ok && !won && T.req.some(r => r.trophy && !MK.reqMet(r) && !MK.reqMet(MK.TOURNEYS.find(x => x.id === r.trophy).req)); void hidden; // Turniere: alle sichtbar
    const info = `Runden: ${T.list.map(id => MK.DISC.find(d => d.id === id).name).join(' → ')}. Zählt: ${focusOf(T.list)}. Gewinn: ${MK.rewardText(MK.tourReward(T))}${opens.length ? '. Öffnet: ' + opens.join(', ') : ''}.`;
    const miss = T.req.filter(r => !MK.reqMet(r));
    h += `<div class="card tourney ${ok ? '' : 'locked'}"><div class="row"><div><h4>${T.name} ${won ? `<small>🏆×${won}</small>` : ''} ${ib(info)}</h4><p class="small">🏅 ${T.title}</p>
      ${miss.length ? `<p class="small noc">🔒 ${miss.map(r => { const hv = MK.reqHave(r); return MK.reqText(r).replace(/ \(.*\)$/, '') + (hv != null ? ` (${hv})` : ''); }).join(' · ')}</p>` : ''}</div>
      ${ok ? `<button class="btn alt" data-tour="${T.id}" data-pr="${MK.tourFee(T)}" data-what="das Startgeld">${MK.fmt(MK.tourFee(T))} €</button>` : ''}</div></div>`; });
  P.innerHTML = h;
  const ct = P.querySelector('#compTan'); if (ct) ct.onchange = () => { S.compTan = ct.value || null; MK.save(); MK.Audio.play('pop'); };
  P.querySelectorAll('[data-disc]').forEach(b => b.onclick = () => { const d = b.dataset.disc; if (MK.Comp.single(d, Math.min(S.beat[d], 7))) U.afterCompStart(); });
  P.querySelectorAll('[data-tour]').forEach(b => b.onclick = () => { if (MK.Comp.tourney(b.dataset.tour)) U.afterCompStart(); else { const T = MK.TOURNEYS.find(x => x.id === b.dataset.tour); U.toast(!MK.tourOk(T) ? 'Noch nicht freigeschaltet: ' + T.req.filter(r => !MK.reqMet(r)).map(MK.reqText).join(', ') : `Dir fehlen noch ${MK.fmt(MK.tourFee(T) - S.money)} €`); } });
  const ea = P.querySelector('[data-act="event"]'); if (ea) ea.onclick = () => { if (MK.Comp.event()) U.afterCompStart(); };
  const ra = P.querySelector('[data-act="rival"]'); if (ra) ra.onclick = () => { if (MK.Comp.rival()) U.afterCompStart(); };
}
U.afterCompStart = () => { if (!mobile()) $('stage').scrollIntoView({ behavior: 'smooth', block: 'start' }); U.quick(); };

/* --- Imperium (Cookie-Clicker-Prinzip) --- */
let bizN = 1, bizStat = false; const bizOpenSet = new Set();
/* Imperium-Statistik: Einkommen der letzten Stunden (log. Skala) und Anteil je Geschäft */
function bizStats() {
  const S = MK.S, pts = S.hist.mins.filter(m => m[3] != null).slice(-360), W = 320, Hh = 110, own = MK.BIZ.filter(B => MK.bizCount(B.id) > 0), tot = MK.income() || 1;
  let h = '<div class="charts">';
  if (pts.length > 1) { const t0 = pts[0][0], t1 = pts[pts.length - 1][0], lg = v => Math.log10(Math.max(.1, v)), l0 = Math.floor(Math.min(...pts.map(p => lg(p[3])))), l1 = Math.max(l0 + 1, Math.ceil(lg(Math.max(...pts.map(p => p[3])))));
    const X = t => 52 + (t - t0) / Math.max(1, t1 - t0) * (W - 60), Y = v => Hh - 20 - (lg(v) - l0) / (l1 - l0) * (Hh - 32), hrs = (t1 - t0) / 36e5;
    h += `<figure><figcaption>Einkommen pro Sekunde · letzte ${hrs >= 1 ? MK.fmt1(hrs) + ' h' : Math.max(1, Math.round(hrs * 60)) + ' min'}</figcaption><svg viewBox="0 0 ${W} ${Hh}"><line x1="52" y1="${Hh - 20}" x2="${W - 8}" y2="${Hh - 20}" class="ax"/>
      <text x="48" y="${Y(Math.pow(10, l1)) + 4}" class="tk" text-anchor="end">${MK.fmt(Math.pow(10, l1))}</text><text x="48" y="${Hh - 16}" class="tk" text-anchor="end">${MK.fmt(Math.pow(10, l0))}</text>
      <polyline points="${pts.map(p => X(p[0]).toFixed(1) + ',' + Y(p[3]).toFixed(1)).join(' ')}" class="ln"/></svg></figure>`; }
  else h += '<figure><figcaption>Einkommen pro Sekunde</figcaption><p class="hint">Füllt sich beim Spielen.</p></figure>';
  if (own.length) { const COLS = { pfand: '#2f6f45', shake: '#ff8fab', pt: '#f4a259', merch: '#5bc0be', coach: '#9d8df1', supp: '#e07a5f', kette: '#f2c14e', app: '#4ea8de', tv: '#b8c0cc', konzern: '#8d99ae', space: '#3d405b' };
    const rows = own.map(B => ({ B, v: MK.bizRate(B) })).sort((a, b) => b.v - a.v);
    h += `<figure><figcaption>Anteil am Einkommen</figcaption><div class="share">${rows.map(r => `<i style="width:${(r.v / tot * 100).toFixed(2)}%;background:${COLS[r.B.id]}" title="${esc(r.B.name)}"></i>`).join('')}</div>
      <table class="stats"><tbody>${rows.map(r => `<tr><td><span class="swb" style="background:${COLS[r.B.id]}"></span>${r.B.icon} ${esc(r.B.name)}</td><td>${Math.round(r.v / tot * 100)} % · ${MK.fmt(r.v)} €/s</td></tr>`).join('')}</tbody></table></figure>`; }
  return h + '</div>';
}
U.view = () => (tab === 'biz' ? 'biz' : 'gym'); U.tab = () => tab;
U.openBiz = id => { bizOpenSet.add(id); if (tab !== 'biz') go('biz'); const P = $('pane'); paneBiz(P); U.liveBuy(); const el = P.querySelector(`[data-bopen="${id}"]`); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); MK.Audio.play('pop'); };
function paneBiz(P) {
  const S = MK.S, inc = MK.income(), cp = MK.clickPct(), xm = MK.bonus().xpMul || 1, f = v => v < 10 ? MK.fmt1(v) : MK.fmt(v);
  let h = `<div class="biztop"><div><small>Einkommen</small><b>${f(inc)} €/s</b></div><div><small>Muskel-Turbo</small><b>×${MK.fmt1(xm)} XP</b></div><div><small>Level-Bonus</small><b>+${Math.round(MK.totalLv() * (1 + (MK.bonus().lvInc || 0) * 100))} %</b></div></div>
    ${(() => { const M = MK.MILES[S.mile]; if (!M) return ''; const prev = S.mile ? MK.MILES[S.mile - 1][0] : 0, k = Math.max(0, Math.min(1, Math.log10(Math.max(1, S.stats.earned) / Math.max(1, prev)) / Math.log10(M[0] / Math.max(1, prev))));
      return `<div class="mile"><span>Meilenstein: <b>${MK.fmt(M[0])} €</b> verdient → +${M[1] * 20} Ruhm</span><i style="width:${Math.round(k * 100)}%"></i></div>`; })()}
    <div class="buyn">Kaufen: ${[1, 10, 100, 'max'].map(n => `<button class="opt" data-bizn="${n}" aria-pressed="${bizN === n}">${n === 'max' ? 'Max' : '×' + n}</button>`).join('')}<button class="opt stbtn" data-bstat="1" aria-pressed="${bizStat}">📊 Statistik</button></div>
    ${bizStat ? bizStats() : ''}`;
  { const ol = S.offLv || 0, mx = ol >= MK.OFF_MAX, oc = MK.offCost();
    h += `<div class="card clickup"><div class="row"><div><h4>🌙 Nachtschicht ${ib('Was dein Imperium verdient, während das Spiel zu ist. Start 5 %, jede Stufe +1 %, höchstens 15 %.')}</h4><p class="small">Offline ${Math.round(MK.offRate() * 100)} % · Stufe ${ol}/${MK.OFF_MAX}</p></div>${mx ? '<span class="tag">Max</span>' : `<button class="btn" data-off="1" data-pr="${oc}">${MK.fmt(oc)} €</button>`}</div></div>`; }
  const cu = MK.CLICK_UPS[S.clickUp];
  if (cu) { const ok = MK.bizCount(cu.need) >= 1, c = Math.ceil(cu.cost * MK.shopMul());
    h += `<div class="card clickup ${ok ? '' : 'locked'}"><div class="row"><div><h4>🖱️ ${cu.name}</h4><p>Klick bringt +${Math.round(cu.pct * 100)} % deines €/s${ok ? '' : ' · 🔒 ' + MK.BIZ.find(B => B.id === cu.need).name}</p></div>${ok ? `<span class="bbtns"><button class="btn" data-bup="click:${S.clickUp}" data-pr="${c}">${MK.fmt(c)} €</button><button class="btn dia" data-bupd="click:${S.clickUp}" data-pr="${MK.diaPrice(cu.cost)}" data-cur="dia">${MK.diaPrice(cu.cost)} 💎</button></span>` : '<span class="tag soon">Bald</span>'}</div></div>`; }
  MK.BIZ.forEach((B, i) => { const open = MK.bizOpen(B), o = MK.bizCount(B.id);
    if (!open) return;
    const n = bizN === 'max' ? Math.max(1, MK.bizMaxN(B)) : bizN, c = MK.bizCost(B, n), each = B.inc * MK.bizMul(B.id) * MK.incMul(), isOpen = bizOpenSet.has(B.id);
    const ups = MK.bizUps().filter(u => u.kind === 'biz' && u.B.id === B.id), nextUp = ups[0], P2 = MK.PERKS[B.id], pl = MK.perkLv(B.id);
    const badge = (nextUp && nextUp.ok ? 1 : 0) + (o >= MK.perkNeed(B.id) ? 1 : 0);
    h += `<div class="card biz ${isOpen ? 'open' : ''}"><div class="row bizhead" data-bopen="${B.id}"><div><h4><span class="bico">${B.icon}</span> ${B.name} <small class="own">${o}</small>${badge ? '<span class="bdot"></span>' : ''}</h4>
      <p class="pw">je ${f(each)} €/s${o ? ` · zusammen ${f(MK.bizRate(B))} €/s` : ''}${MK.bizMul(B.id) > 1 ? ` · ×${MK.bizMul(B.id)}` : ''}${pl ? ` · Vorteil Stufe ${pl}` : ''}</p></div>
      <span class="bbtns col"><button class="btn" data-biz="${B.id}" data-pr="${c}">${bizN === 'max' ? `Max (${n})` : n > 1 ? '×' + n : 'Kaufen'}<br><small>${MK.fmt(c)} €</small></button>${(() => { const mx = bizN === 'max', dn = mx ? MK.bizDiaMaxN(B) : bizN, dc = MK.bizDiaCost(B, Math.max(1, dn)); return `<button class="btn dia sm" data-bizd="${B.id}" data-pr="${dc}" data-cur="dia">${mx ? `Max (${dn}) · ` : dn > 1 ? '×' + dn + ' · ' : ''}${MK.fmt(dc)} 💎</button>`; })()}<label class="autob" title="Auto-Kauf"><span class="sw2 mini"><input type="checkbox" data-autob="${B.id}" ${(S.staff || []).includes('klaus') && (S.autoBiz || {})[B.id] ? 'checked' : ''}><span></span></span><small>Auto</small></label></span></div>`;
    if (isOpen) {
      h += `<div class="bizbody">`;
      if (nextUp) { const uc = Math.ceil(nextUp.cost * MK.shopMul() * MK.upDisc()); h += `<div class="bline"><div><b>Ausbau: ${MK.BIZ_UP_NAMES[MK.BIZ_STEPS.findIndex(st => st[0] === nextUp.need)]}</b><small>×2 Einkommen · ab ${nextUp.need} Stück</small></div>${nextUp.ok ? `<span class="bbtns"><button class="btn" data-bup="${nextUp.id}" data-pr="${uc}">${MK.fmt(uc)} €</button><button class="btn dia" data-bupd="${nextUp.id}" data-pr="${MK.diaPrice(nextUp.cost)}" data-cur="dia">${MK.diaPrice(nextUp.cost)} 💎</button></span>` : '<span class="tag soon">Bald</span>'}</div>`; }
      const pc = MK.perkCost(B.id), pok = o >= MK.perkNeed(B.id);
      h += `<div class="bline perk"><div><b>💪 ${P2.name} <small>Stufe ${pl}</small></b><small>${P2.txt} je Stufe · ab ${MK.perkNeed(B.id)} Stück</small></div>${pok ? `<span class="bbtns"><button class="btn" data-perk="${B.id}" data-pr="${pc}">${MK.fmt(pc)} €</button><button class="btn dia" data-perkd="${B.id}" data-pr="${MK.diaPrice(pc)}" data-cur="dia">${MK.diaPrice(pc)} 💎</button></span>` : '<span class="tag soon">Bald</span>'}</div></div>`;
    }
    h += '</div>'; });
  // Upgrades: neue Geschäfte über Turnier-Titel (keine Level-Grenzen)
  const lic = MK.BIZ.filter(B => !MK.bizOpen(B));
  if (lic.length) { h += '<h3 class="sh">Neue Geschäfte ' + ib('Turniere gewinnen → Titel → Lizenz kaufen. Keine Level-Grenzen.') + '</h3>';
    lic.slice(0, 1).forEach(B => { const ok = MK.licOk(B), pr = MK.licPrice(B);
      const reqs = [].concat(B.req || [{ trophy: B.lic }]), money = S.money >= pr;
      h += `<div class="card biz lic ${ok ? '' : 'locked'}"><div class="row"><div><h4><span class="bico">${B.icon}</span> ${B.name} ${ib(B.desc + ' Je Stück ' + MK.fmt1(B.inc * MK.incMul()) + ' €/s.')}</h4><p class="small"><b>Anforderungen:</b></p>${reqList(reqs, 'lic')}<ul class="skreq lic"><li class="${money ? 'ok' : 'no'}">${money ? '✓' : '✗'} Lizenz ${MK.fmt(pr)} €${money ? '' : ` <small>(du: ${MK.fmt(S.money)} €)</small>`}</li></ul></div>
        ${ok ? `<button class="btn" data-lic="${B.id}" data-pr="${pr}" data-what="die Lizenz">Lizenz<br><small>${MK.fmt(pr)} €</small></button>` : '<span class="tag soon">🔒</span>'}</div></div>`; }); }
  P.innerHTML = h;
  P.querySelectorAll('[data-off]').forEach(b => b.onclick = () => { if (MK.buyOff()) { MK.Audio.play('level'); U.toast(`Nachtschicht: offline ${Math.round(MK.offRate() * 100)} %`, 'big'); re(); } });
  P.querySelectorAll('[data-lic]').forEach(b => b.onclick = () => { if (MK.buyLic(b.dataset.lic)) { const B = MK.BIZ.find(x => x.id === b.dataset.lic); MK.Audio.play('level'); U.toast(`Lizenz: ${B.icon} ${B.name} – jetzt kaufen!`, 'big'); bizOpenSet.add(B.id); re(); } });
  const re = () => { const sc = P.scrollTop; paneBiz(P); P.scrollTop = sc; U.liveBuy(); U.quick(); MK.save(); };
  P.querySelectorAll('[data-bizn]').forEach(b => b.onclick = () => { bizN = b.dataset.bizn === 'max' ? 'max' : +b.dataset.bizn; re(); });
  P.querySelectorAll('[data-bstat]').forEach(b => b.onclick = () => { bizStat = !bizStat; MK.Audio.play('pop'); re(); });
  P.querySelectorAll('[data-bopen]').forEach(b => b.onclick = e => { if (e.target.closest('button, label, input')) return; const id = b.dataset.bopen; bizOpenSet.has(id) ? bizOpenSet.delete(id) : bizOpenSet.add(id); MK.Audio.play('pop'); re(); });
  P.querySelectorAll('[data-autob]').forEach(b => b.onchange = () => { const id = b.dataset.autob;
    if (!(S.staff || []).includes('klaus')) { b.checked = true; setTimeout(() => { b.checked = false; }, 380); MK.Audio.play('error'); U.toast('Kaufe Manager Klaus im Shop, um Auto-Kauf freizuschalten', 'big'); return; }
    S.autoBiz = S.autoBiz || {}; S.autoBiz[id] = b.checked; MK.Audio.play('pop'); U.toast(`${MK.BIZ.find(x => x.id === id).name}: Auto-Kauf ${b.checked ? 'an' : 'aus'}`); MK.save(); });
  P.querySelectorAll('[data-bizd]').forEach(b => b.onclick = () => { if (MK.buyBizDia(b.dataset.bizd, bizN)) { MK.Audio.play('buy'); re(); } else { U.toast(`Dir fehlen noch ${+b.dataset.pr - S.dia} 💎 – Diamanten gibt's im Shop`); MK.Audio.play('error'); } });
  P.querySelectorAll('[data-biz]').forEach(b => b.onclick = () => { if (MK.buyBiz(b.dataset.biz, bizN)) { MK.Audio.play('buy'); re(); } });
  P.querySelectorAll('[data-bup]').forEach(b => b.onclick = () => { if (MK.buyBizUp(b.dataset.bup)) { MK.Audio.play('level'); U.toast('Ausbau gekauft!', 'big'); re(); } });
  const noDia = pr => { U.toast(`Dir fehlen noch ${pr - S.dia} 💎 – Diamanten gibt's im Shop`); MK.Audio.play('error'); };
  P.querySelectorAll('[data-bupd]').forEach(b => b.onclick = () => { if (MK.buyBizUpDia(b.dataset.bupd)) { MK.Audio.play('level'); U.toast('Ausbau mit Diamanten gekauft!', 'big'); re(); } else noDia(+b.dataset.pr); });
  P.querySelectorAll('[data-perkd]').forEach(b => b.onclick = () => { if (MK.buyPerkDia(b.dataset.perkd)) { MK.Audio.play('level'); U.toast('Vorteil mit Diamanten verbessert!', 'big'); re(); } else noDia(+b.dataset.pr); });
  P.querySelectorAll('[data-perk]').forEach(b => b.onclick = () => { if (MK.buyPerk(b.dataset.perk)) { MK.Audio.play('level'); const P3 = MK.PERKS[b.dataset.perk]; U.toast(`${P3.name} Stufe ${MK.perkLv(b.dataset.perk)}: ${P3.txt}`, 'big'); re(); } });
}
/* --- Shop --- */
function paneShop(P) {
  const S = MK.S, sm = MK.shopMul();
  let h = '';
  { const n = S.cashLv || 0, mx = n >= MK.CASH_MAX, pr = mx ? 0 : MK.cashCost(n);
    h += `<h3 class="sh">Kassengriff ${ib('Geld, das jede eigene Wiederholung bringt. Wächst nur mit diesen Upgrades – nicht automatisch. Pump, Beast-Modus und perfekte Wiederholungen vervielfachen es.')}</h3>
    <div class="card cashc"><div class="cashart" aria-hidden="true"><i></i><i></i><i></i></div><div class="cashinfo"><b>${n ? MK.cashName(n - 1) : 'Kassengriff noch nicht verbessert'}</b>
      <p><span class="cnow">${MK.fmtS(MK.cashVal(n))} €</span> pro Klick${mx ? '' : ` <span class="cnext">→ ${MK.fmtS(MK.cashVal(n + 1))} €</span>`}</p></div>
      ${mx ? '<span class="tag">Max</span>' : `<button class="btn ok" data-cashup="1" data-pr="${pr}" data-what="den Kassengriff">Stufe ${n + 1}<br><small>${MK.fmt(pr)} €</small></button>`}</div>`; }
  h += `<h3 class="sh">Gewichte ${ib('Jede Stufe schwerer = ×1,3 XP pro Wiederholung. Keine Level-Grenze – aber sind die Hilfsmuskeln zu schwach, wird es wackelig (Zerrung).')}</h3><div class="wgrid">`;
  MK.MUSCLES.filter(m => !m.stat).forEach(m => { const st = MK.wgStatus(m.id), cur = st.cur, exs = MK.EXERCISES.filter(e => e.g === m.id && e.kg !== 'cardio'), kinds = [];
    exs.forEach(e => { if (!kinds.some(k => k.kg === e.kg)) kinds.push(e); });
    const KN = { db: 'Kurzhantel', bb: 'Langhantel', cable: 'Kabel', bw: 'Zusatz' }, one = (e, i) => `${KN[e.kg]} ${MK.wLabel(e, i).replace(' je Hand', '').replace('Körpergewicht', '±0 kg')}`;
    const lbl = i => kinds.slice(0, 2).map(e => one(e, i)).join(' · ');
    const tierBar = `<span class="wbar">${Array.from({ length: 19 }, (_, i) => `<i style="${i < cur ? `background:${MK.Scene.plateCol(i + 1)}` : ''}"></i>`).join('')}</span>`;
    const svg = `<svg class="gico" viewBox="0 0 48 48" aria-hidden="true" style="--c:${m.col}"><circle class="bg" cx="24" cy="24" r="22.5"/><g transform="translate(4.8 4.8) scale(.8)">${GICON[m.id]}</g></svg>${tierBar}`;
    h += `<div class="card wgc ${st.st === 'buy' ? 'can' : ''}" style="--c:${m.col}"><div class="wgtop"><b>${m.name}</b><span class="wtier">${MK.WG_TIERS[cur]}</span></div>${svg}
      <p class="wkg"><b>${lbl(cur)}</b></p>
      ${st.st === 'max' ? '<span class="tag">Max</span>' : st.st === 'buy' ? `<button class="btn ok wide" data-wg="${m.id}" data-pr="${st.price}" data-what="die nächsten Gewichte">Schwerer · ${MK.fmt(st.price)} €</button>` : `<button class="btn wide off" data-pr="${st.price}" data-need="Gewichte ${esc(st.why)}">🔒 ${st.why}</button>`}</div>`; });
  h += '</div>';
  // Trainingspartner: teure Stufen, wird muskulöser, Boost auf alle Muskelgruppen
  h += '<h3 class="sh">Partner</h3>';
  { const tl = MK.trainerRate(), tc = MK.trainerCost(tl);
    h += `<div class="card up"><div class="row"><div><h4>📋 Personal Trainer ${tl ? `<small>Stufe ${tl}</small>` : ''}</h4><p>${tl ? `${tl} Wiederholung${tl > 1 ? 'en' : ''} pro Sekunde automatisch` : 'Trainiert automatisch mit dir'} ${ib('Er sitzt im Gym neben dir und macht automatisch Wiederholungen – immer nur für die Muskelgruppe, die du gerade ausgewählt hast. Antippen im Gym: Trainer-Seite mit Upgrades.')}</p></div>
      ${tl ? `<button class="btn alt" data-trgo="1">Öffnen</button>` : `<button class="btn ok" data-trbuy="1" data-pr="${tc}">Einstellen ${MK.fmt(tc)} €</button>`}</div></div>`; }
  if (!MK.partnerOpen()) h += `<div class="card up locked"><h4>Trainingspartner Kevin</h4><p>🔒 Kevin im Klimmzug-Duell schlagen · Level 15</p></div>`;
  else { const pl = S.partner.lv, pc = MK.partnerCost(pl), mx = pl >= MK.PARTNER_MAX;
    h += `<div class="card up"><div class="row"><div><h4>Trainingspartner Kevin ${pl ? `<small>Stufe ${pl}</small>` : ''}</h4><p>×${MK.fmt1(MK.partnerMul())} XP ${ib('Jede Stufe ×1,07 XP auf alles. Ab und zu Duett: +25 % XP. Sichert dich bei Langhantel-Übungen.')}</p></div>
    ${mx ? '<span class="tag">Max</span>' : `<button class="btn ok" data-partner="1" data-pr="${pc}">${pl ? 'Stufe ' + (pl + 1) : 'Einladen'} ${MK.fmt(pc)} €</button>`}</div></div>`; }
  // Geräte: alles sofort kaufbar, die Übung dazu geht ab ihrem Muskel-Level
  h += `<h3 class="sh">Geräte ${ib('Jedes Gerät schaltet eine Übung frei. Kaufen geht immer – trainieren erst ab dem Muskel-Level. Material-Upgrade: +10 % XP je Stufe.')}</h3>`;
  const eqs = MK.EQUIP.filter(q => !q.disc || MK.discOpen(MK.DISC.find(d => d.id === q.disc))).map(q => { const u = MK.eqUses(q); return { q, st: MK.eqStatus(q), u, lk: !!u.length && !S.eq[q.id] && !u.some(e => MK.groupOpen(e.g)) }; }).sort((a, b) => a.lk - b.lk || (a.st.st === 'owned') - (b.st.st === 'owned') || (a.u[0] ? a.u[0].lv : 0) - (b.u[0] ? b.u[0].lv : 0));
  eqs.forEach(({ q, st, u, lk }) => { if (lk) { const m = MK.MUSCLES.find(x => x.id === u[0].g); // Muskelgruppe noch zu: Gerät grau, nicht kaufbar
      h += `<div class="card eq locked"><div class="row"><div><h4>${q.name}</h4><p>${u[0].name} · <span class="noc">🔒 ${m.name} ab Gesamt-Level ${m.unlock}</span></p></div><span class="tag soon">🔒</span></div></div>`; return; }
    const l = S.eq[q.id] || 0, max = l >= MK.MATERIAL.length, pr = MK.eqPrice(q, l), e = u[0], ready = !e || S.m[e.g].lv >= e.lv;
    const sub = e ? `${e.name} · <span class="${ready ? 'okc' : 'noc'}">${GN(e.g)} Lv ${e.lv}</span>` : q.desc;
    h += `<div class="card eq ${l ? '' : 'new'}"><div class="row"><div><h4>${q.name} ${l ? `<small class="mat m${l}">${MK.MATERIAL[l - 1].name}</small>` : ''}</h4><p>${sub}</p></div>
    ${max ? `<span class="tag">${MK.MATERIAL[MK.MATERIAL.length - 1].name}</span>` : `<button class="btn ${l ? 'alt' : ''}" data-eq="${q.id}" data-pr="${pr}">${l ? '⬆ ' : ''}${MK.fmt(pr)} €</button>`}</div></div>`; });
  // Sponsoren
  h += `<h3 class="sh">Sponsoren ${ib('Ein Vertrag gleichzeitig. Bringt langsam Diamanten (auch offline) und einen kleinen XP- und Ruhm-Bonus.')}</h3>`;
  MK.SPONSORS.forEach(sp => { const ok = MK.sponsorOk(sp), act = S.sponsor === sp.id, inc = sp.inc * (1 + MK.bonus().sponsor), had = (S.sponsored || []).includes(sp.id);
    const list = sp.req.map(r => { const m = MK.reqMet(r), hv = MK.reqHave(r); return `<li class="${m ? 'ok' : 'no'}">${m ? '✓' : '✗'} ${MK.reqText(r)}${!m && hv != null ? ` <small>(du: ${hv})</small>` : ''}</li>`; }).join('');
    h += `<div class="card spon ${act ? 'act' : ''} ${ok || act ? '' : 'locked'}" style="--sc:${sp.col}"><div class="row"><div><h4><span class="logo" style="background:${sp.col}">${sp.logo}</span> ${sp.name}</h4><p class="pitch">${sp.pitch}</p><div class="perks"><span>💎 ${MK.fmt1(sp.dph * (1 + MK.bonus().sponsor))} / Std</span><span>+${Math.round(sp.boost.xp * 100)} % XP</span><span>+${Math.round(sp.boost.fame * 100)} % Ruhm</span>${sp.bonus && !had ? `<span class="gift">🎁 ${MK.rewardText(sp.bonus)}</span>` : ''}</div></div>
      ${act ? `<button class="btn ok" data-spon="${sp.id}">Aktiv</button>` : `<button class="btn" data-spon="${sp.id}" data-pr="0" ${ok ? '' : `data-need="${esc('Noch nicht erfüllt: ' + sp.req.filter(r => !MK.reqMet(r)).map(MK.reqText).join(', '))}"`}>Unterschreiben</button>`}</div>
      ${act ? '' : `<ul class="skreq light">${list}</ul>`}</div>`; });
  h += `<div class="card"><div class="row"><div><h4>💎 Haustiere & Diamanten</h4><p class="small">Jetzt im Shop oben neben deinen Diamanten.</p></div><button class="btn dia" data-goshop="1">Zum Shop</button></div></div>`;
  P.innerHTML = h;
  const buy = (pr, fn, msg) => { if (!MK.spend(pr)) { U.toast(`Dir fehlen noch ${MK.fmt(pr - S.money)} €`); MK.Audio.play('error'); return; } fn(); MK.dirty(); MK.Audio.play('buy'); U.toast(msg); MK.Scene.particle('coin', MK.Scene.W / 2, MK.Scene.H / 2, 8); U.refresh(); U.training(); MK.save(); };
  P.querySelectorAll('[data-cashup]').forEach(b => b.onclick = () => { if (!MK.buyCash()) { U.toast(`Dir fehlen noch ${MK.fmt(MK.cashCost(S.cashLv || 0) - S.money)} €`); MK.Audio.play('error'); return; } MK.Audio.play('buy'); U.toast(`Kassengriff Stufe ${S.cashLv}: jetzt ${MK.fmtS(MK.clickCash())} € pro Klick`); U.refresh(); MK.save(); });
  P.querySelectorAll('[data-wg]').forEach(b => b.onclick = () => { const g = b.dataset.wg, m = MK.MUSCLES.find(x => x.id === g); if (!MK.buyWg(g)) { U.toast(`Dir fehlen noch ${MK.fmt(MK.wgStatus(g).price - S.money)} €`); MK.Audio.play('error'); return; }
    MK.dirty(); MK.Audio.play('clank', 6); MK.Audio.play('buy'); const ex = MK.EXERCISES.find(e => e.g === g && e.kg === 'db') || MK.EXERCISES.find(e => e.g === g); U.toast(`${m.name}: neue Scheiben – bis ${MK.wLabel(ex, MK.wg(g))}!`, 'big');
    MK.Scene.particle('coin', MK.Scene.W / 2, MK.Scene.H / 2, 10); U.refresh(); U.training(); MK.save(); });
  P.querySelectorAll('[data-eq]').forEach(b => b.onclick = () => { const id = b.dataset.eq, q = MK.EQUIP.find(x => x.id === id), l = S.eq[id] || 0; buy(+b.dataset.pr, () => { S.eq[id] = l + 1; if (id === 'boombox') MK.Audio.music(); }, l ? `${q.name}: ${MK.MATERIAL[l].name}!` : q.id === 'kuehl' ? 'Kühlschrank steht im Gym – antippen!' : q.id === 'boombox' ? 'Boombox steht im Gym – antippen!' : `${q.name} gekauft`); });
  P.querySelectorAll('[data-meal]').forEach(b => b.onclick = () => { const m = MK.MEALS.find(x => x.id === b.dataset.meal); buy(+b.dataset.pr, () => eat(m), m.name + ' gegessen'); });
  P.querySelectorAll('[data-mtog]').forEach(b => b.onclick = () => { S.music.on = !S.music.on; MK.dirty(); U.refresh(); });
  P.querySelectorAll('[data-mplay]').forEach(b => b.onclick = () => { S.music.cur = b.dataset.mplay; S.music.on = true; MK.dirty(); MK.Audio.music(); U.refresh(); });
  P.querySelectorAll('[data-mbuy]').forEach(b => b.onclick = () => { const id = b.dataset.mbuy; buy(+b.dataset.pr, () => { S.music.owned.push(id); S.music.cur = id; S.music.on = true; MK.Audio.music(); }, 'Neuer Song!'); });
  P.querySelectorAll('[data-trbuy]').forEach(b => b.onclick = () => buy(MK.trainerCost(0), () => { MK.S.trainer.lv = 1; }, 'Dein Personal Trainer ist da!'));
  P.querySelectorAll('[data-trgo]').forEach(b => b.onclick = () => U.openExtra('trainer'));
  P.querySelectorAll('[data-partner]').forEach(b => b.onclick = () => buy(MK.partnerCost(S.partner.lv), () => { S.partner.lv++; }, S.partner.lv ? 'Kevin trainiert jetzt härter!' : 'Kevin trainiert jetzt mit dir!'));
  bindPrep(P);
  P.querySelectorAll('[data-spon]').forEach(b => b.onclick = () => { const id = b.dataset.spon; if (S.sponsor === id) { S.sponsor = null; U.toast('Vertrag gekündigt'); } else { const r = MK.signSponsor(id); if (!r) return; const sp = MK.SPONSORS.find(x => x.id === id); U.toast(r === 'first' && sp.bonus ? `${sp.name} unterschrieben! Bonus: ${MK.rewardText(sp.bonus)}` : `${sp.name} unterschrieben!`, 'big'); MK.Scene.particle('confetti', MK.Scene.W / 2, MK.Scene.H * .3, 40); } MK.Audio.play('buy'); U.refresh(); MK.save(); });
  P.querySelectorAll('[data-goshop]').forEach(b => b.onclick = () => U.openExtra('dshop'));
}
/* Meal-Prep: Ziel wählen, 3 von 6 Zutaten, Makros treffen */
function prepCard() {
  const S = MK.S, P = S.prep, offer = MK.prepOffer(), G = MK.PREP_GOALS.find(g => g.id === P.goal), sc = MK.prepScore(P.pick, P.goal), left = MK.prepLeft(), ready = left > 0, kfa = MK.kfa();
  const bar = (r, t) => `<div class="mac">${['Eiweiß', 'Kohlenhydrate', 'Fett'].map((n, i) => `<div><span>${n}</span><b><i style="width:${Math.round(r[i] * 100)}%"></i><em style="left:${Math.round(t[i] * 100)}%"></em></b><small>${Math.round(r[i] * 100)} % / Ziel ${Math.round(t[i] * 100)} %</small></div>`).join('')}</div>`;
  const pct = Math.round(sc.sc * 100), tier = P.pick.length < 3 ? '' : pct >= 90 ? 'g90' : pct >= 70 ? 'g70' : 'g0';
  return `<div class="card prep"><h4>Meal-Prep ${ib('Wähle Masse oder Definition und 3 Zutaten, die die Makros treffen. Ab 70 %: ±1 % Körperfett. Ab 90 %: zusätzlich Geld (wächst mit deinem Level). Eine Kombi mit über 90 % gibt es immer. 3 Mal pro 5 Minuten. Ohne Kochen passiert nichts von allein.')}</h4>
    <div class="prepstat"><span>KFA <b>${kfa} %</b></span><span>Gewicht <b>${MK.fmt1(MK.bodyKg())} kg</b></span>${(() => { const x = Math.max(-.12, Math.min(.2, (kfa - 18) * .015)); return `<span>Masse-Effekt <b class="${x >= 0 ? 'okc' : 'noc'}">${x >= 0 ? '+' : '−'}${Math.round(Math.abs(x) * 100)} % XP</b></span>`; })()}</div>
    <div class="opts">${MK.PREP_GOALS.map(g => `<button class="opt" data-goal="${g.id}" aria-pressed="${P.goal === g.id}">${g.id === 'masse' ? '🍔' : '🥗'} ${g.name}</button>`).join('')}</div><p class="small">${G.desc}</p>
    <div class="opts">${offer.map(id => { const F = MK.FOODS.find(x => x.id === id); return `<button class="opt" data-food="${id}" aria-pressed="${P.pick.includes(id)}">${F.name}<small>${F.p}/${F.c}/${F.f}</small></button>`; }).join('')}</div>
    ${bar(sc.r, G.t)}<div class="row"><p class="small">${P.pick.length < 3 ? `Noch ${3 - P.pick.length} Zutat${3 - P.pick.length > 1 ? 'en' : ''}` : `Treffer: <b class="${tier}">${pct} %</b> ${pct >= 90 ? `→ ${P.goal === 'masse' ? '+' : '−'}1 % KFA + ${MK.fmt(MK.prepReward())} €` : pct >= 70 ? `→ ${P.goal === 'masse' ? '+' : '−'}1 % KFA` : '→ keine Wirkung'}`}</p>
    <button class="btn ok" id="cook" ${ready && P.pick.length === 3 ? '' : 'disabled'}>${ready ? `Kochen <small>(${left}/3)</small>` : 'Wieder in ' + Math.max(1, Math.ceil((MK.prepNext() - Date.now()) / 60000)) + ' min'}</button></div></div>`;
}
function bindPrep(P) {
  const S = MK.S, re = () => { const el = P.querySelector('.prep'); if (el) { el.outerHTML = prepCard(); bindPrep(P); } };
  P.querySelectorAll('[data-goal]').forEach(b => b.onclick = () => { S.prep.goal = b.dataset.goal; MK.Audio.play('tap'); re(); });
  P.querySelectorAll('[data-food]').forEach(b => b.onclick = () => { const id = b.dataset.food, pk = S.prep.pick, i = pk.indexOf(id); if (i >= 0) pk.splice(i, 1); else if (pk.length < 3) pk.push(id); MK.Audio.play('tap'); re(); });
  const ck = P.querySelector('#cook'); if (ck) ck.onclick = () => { const r = MK.cook(); if (!r) return; MK.Audio.play(r.money ? 'win' : 'buy'); MK.Scene.setFace('proud', 1500); MK.Scene.eat && MK.Scene.eat('prep');
    U.toast(`${Math.round(r.sc * 100)} % getroffen – ${r.fat ? `${r.fat > 0 ? '+' : '−'}1 % Körperfett` : 'keine Wirkung'}${r.money ? ` · +${MK.fmt(r.money)} €` : ''}`, r.sc >= .9 ? 'big' : ''); if (r.money) MK.Scene.particle('coin', MK.Scene.W / 2, MK.Scene.H / 2, 10); MK.save(); U.refresh(); U.quick(); };
}
function eat(m) { const S = MK.S, e = m.eff; if (e.pump) { S.pump = Math.min(1, S.pump + e.pump); if (S.beastCd > 0) S.pump = Math.min(.97, S.pump); if (S.pump >= 1 && S.beastOn <= 0) { S.beastOn = 10 + MK.bonus().beastDur; S.stats.beasts++; MK.emit('beast'); } } if (e.compBuff) S.compBuff = e.compBuff;
  if (e.buff) { S.buffs = S.buffs.filter(b => b.k !== e.buff.k); S.buffs.push({ k: e.buff.k, v: e.buff.v, until: Date.now() + e.buff.t * 1000 * (1 + MK.bonus().mealDur) }); } MK.Scene.eat(m.id); }

/* --- Gym: Umzug mit Anforderungen und Vorteilen --- */
function paneGym(P) {
  const S = MK.S, sm = MK.shopMul(); let h = `<h3 class="sh">Dein Gym ${ib('Größere Gyms bringen mehr Ruhm pro Sieg, mehr Zuschauer und einen neuen Rivalen.')}</h3>`;
  MK.GYMS.forEach((g, i) => { const cur = i === S.gym, past = i < S.gym, next = i === S.gym + 1, ok = MK.gymOk(g), pr = MK.nice(g.price * sm);
    const perks = `<div class="gperks"><span>⭐ +${Math.round((g.fameMul - 1) * 100)} % Ruhm</span><span>👥 ${g.cap}</span><span>🥊 ${MK.RIVALS[i] ? MK.RIVALS[i].name : '–'}</span></div>`;
    h += `<div class="card gymc ${cur ? 'cur' : past ? 'past' : next ? '' : 'locked'}"><div class="row"><div><h4>${g.name} ${cur ? '<small class="newtag">Hier</small>' : past ? '<small>✓</small>' : ''} ${ib(g.desc)}</h4>${perks}
      ${!cur && !past ? reqList(g.req) : ''}</div>
      ${next ? `<button class="btn alt" data-gym="${i}" data-pr="${pr}" ${ok ? '' : `data-need="${esc('Noch nicht erfüllt: ' + g.req.filter(r => !MK.reqMet(r)).map(MK.reqText).join(', '))}"`}>${MK.fmt(pr)} €</button>` : ''}</div></div>`; });
  P.innerHTML = h;
  P.querySelectorAll('[data-gym]').forEach(b => b.onclick = () => { const ng = MK.GYMS[S.gym + 1], pr = MK.nice(ng.price * sm); if (!MK.gymOk(ng)) return; if (!MK.spend(pr)) { U.toast(`Dir fehlen noch ${MK.fmt(pr - S.money)} €`); MK.Audio.play('error'); return; }
    MK.save(); MK.Audio.play('whoosh'); // kleiner Szenenwechsel: Blende schließt sich um dich, öffnet sich im neuen Gym
    MK.Scene.iris(ng.name, () => { S.gym++; MK.dirty(); MK.Scene.buildCrowd(); MK.Audio.play('level'); U.refresh(); MK.save(); }, () => { MK.Scene.particle('confetti', MK.Scene.W / 2, MK.Scene.H * .3, 50); U.toast(`Willkommen im ${ng.name}!`, 'big'); }); });
}
/* --- Kühlschrank (nur über den Kühlschrank im Gym) --- */
function paneFridge(P) {
  const S = MK.S; let h = `<h3 class="sh">Kühlschrank ${ib('Essen gibt kurze Boni. Meal-Prep: Ziel wählen, 3 Zutaten, Makros treffen. Mehr Gerichte mit höherer Kühlschrank-Stufe (Laden → Geräte).')}</h3>`;
  h += prepCard();
  MK.MEALS.forEach(m => { const ok = S.eq.kuehl >= m.kl, pr = MK.mealPrice(m);
    h += `<div class="card meal ${ok ? '' : 'locked'}"><div class="row"><div><h4>${m.name}</h4><p class="small">${ok ? m.desc : '🔒 Kühlschrank ' + MK.MATERIAL[m.kl - 1].name}</p></div>${ok ? `<button class="btn ok" data-meal="${m.id}" data-pr="${pr}">${MK.fmt(pr)} €</button>` : ''}</div></div>`; });
  P.innerHTML = h; bindPrep(P);
  P.querySelectorAll('[data-meal]').forEach(b => b.onclick = () => { const m = MK.MEALS.find(x => x.id === b.dataset.meal), pr = +b.dataset.pr; if (!MK.spend(pr)) { U.toast(`Dir fehlen noch ${MK.fmt(pr - S.money)} €`); MK.Audio.play('error'); return; } eat(m); MK.dirty(); MK.Audio.play('buy'); U.toast(m.name + ' 😋'); U.refresh(); MK.save(); });
}
function buyRare(g, id) { const S = MK.S, it = MK.WARD[g].items.find(i => i.id === id); if (!it) return false; if (S.dia < it.dia) { U.toast(`Dir fehlen noch ${it.dia - S.dia} 💎`); MK.Audio.play('error'); return false; }
  S.dia -= it.dia; S.bought.push(id + g); S.look[g] = id; MK.Audio.play('buy'); MK.Scene.setFace('proud', 1200); U.toast(it.name + ' gehört dir!', 'big'); U.quick(); MK.save(); return true; }
/* Echtgeld-Käufe sind noch nicht eingebaut: Antippen bewirkt nichts */
function testBuy() { }
/* --- Diamanten-Shop (oben neben den Diamanten) --- */
function paneDShop(P) {
  const S = MK.S; let h = `<div class="dsh-top"><b>💎 ${MK.fmt(S.dia)}</b><small>Diamanten verdienst du über Sponsoren und Erfolge</small></div>`;
  h += `<h3 class="sh">Diamanten ${ib('Echtgeld-Käufe kommen später.')}</h3><div class="packs">${MK.DIA_PACKS.map((p, i) => `<div class="pack">${p.tag ? `<em>${p.tag}</em>` : ''}<b>${MK.fmt(p.n)} 💎</b><button class="btn" data-pack="${i}">${p.price}</button></div>`).join('')}</div>`;
  h += `<h3 class="sh">Mitarbeiter ${ib('Dauerhaft angestellt. Echtgeld-Käufe kommen später.')}</h3>`;
  MK.STAFF.forEach(st => { const own = S.staff.includes(st.id); h += `<div class="card"><div class="row"><div><h4>${st.icon} ${st.name}</h4><p>${st.desc}</p></div>${own ? '<span class="tag">Angestellt</span>' : `<button class="btn" data-staff="${st.id}">${st.price}</button>`}</div></div>`; });
  h += `<h3 class="sh">Haustiere ${ib('Ein Haustier begleitet dich ins Gym und gibt dauerhaft Boni.')}</h3>`;
  MK.PETS.forEach(p => { const own = S.pets.includes(p.id), act = S.pet === p.id;
    const pl = MK.petLv(p.id), up = MK.PET_UP[pl];
    h += `<div class="card pet"><div class="row"><div><h4>${p.name} ${own ? `<span class="stars">${'★'.repeat(pl)}${'☆'.repeat(3 - pl)}</span>` : ''}</h4><p>${MK.petDesc(p, own ? pl : 1)}${own && pl < 3 ? ` <small class="next">→ Stufe ${pl + 1}: ${MK.petDesc(p, pl + 1)}</small>` : ''}</p></div><span class="bbtns col">${own ? `<button class="btn ${act ? 'ok' : ''}" data-pet="${p.id}">${act ? 'Im Gym' : 'Mitnehmen'}</button>${pl < 3 ? `<button class="btn dia sm" data-petup="${p.id}" data-pr="${up}" data-cur="dia">Aufwerten · ${up} 💎</button>` : '<span class="tag">Max</span>'}` : `<button class="btn dia" data-petbuy="${p.id}" data-pr="${p.price}" data-cur="dia">${p.price} 💎</button>`}</span></div></div>`; });
  h += `<h3 class="sh">Seltene Outfits</h3><div class="opts">${MK.RARE.map(([g, it]) => { const own = S.bought.includes(it.id + g), sw = typeof it.val === 'string' ? `<span class="sw" style="--s:${it.val}"></span>` : '';
    return own ? `<button class="opt" aria-pressed="${S.look[g] === it.id}" data-rwear="${g}|${it.id}">${sw}${it.name}</button>` : `<button class="opt buy rare" data-dbuy="${g}|${it.id}">${sw}${it.name} · ${it.dia} 💎</button>`; }).join('')}</div>`;
  P.innerHTML = h;
  const re = () => { const sc = P.scrollTop; paneDShop(P); P.scrollTop = sc; U.quick(); };
  P.querySelectorAll('[data-pack]').forEach(b => b.onclick = () => { const pk = MK.DIA_PACKS[+b.dataset.pack]; testBuy(`${MK.fmt(pk.n)} Diamanten`, pk.price, () => { S.dia += pk.n; U.toast(`+${MK.fmt(pk.n)} 💎 (Testkauf)`, 'big'); MK.Scene.particle('spark', MK.Scene.W / 2, MK.Scene.H * .4, 24); }); re(); });
  P.querySelectorAll('[data-staff]').forEach(b => b.onclick = () => { const st = MK.STAFF.find(x => x.id === b.dataset.staff); testBuy(st.name, st.price, () => { S.staff.push(st.id); MK.incomeDirty && MK.incomeDirty(); U.toast(`${st.icon} ${st.name} ist jetzt im Team!`, 'big'); }); re(); });
  P.querySelectorAll('[data-pet]').forEach(b => b.onclick = () => { S.pet = S.pet === b.dataset.pet ? null : b.dataset.pet; MK.dirty(); re(); MK.save(); });
  P.querySelectorAll('[data-petup]').forEach(b => b.onclick = () => { const id = b.dataset.petup; if (MK.upPet(id)) { const p = MK.PETS.find(x => x.id === id); MK.Audio.play('level'); U.toast(`${p.name}: Stufe ${MK.petLv(id)}!`, 'big'); MK.Scene.particle('spark', MK.Scene.W * .6, MK.Scene.H * .6, 20); re(); MK.save(); } else { U.toast(`Dir fehlen noch ${+b.dataset.pr - S.dia} 💎`); MK.Audio.play('error'); } });
  P.querySelectorAll('[data-petbuy]').forEach(b => b.onclick = () => { const p = MK.PETS.find(x => x.id === b.dataset.petbuy); if (S.dia < p.price) { U.toast(`Dir fehlen noch ${p.price - S.dia} 💎`); MK.Audio.play('error'); return; } S.dia -= p.price; S.pets.push(p.id); S.pet = p.id; MK.dirty(); MK.Audio.play('buy'); U.toast(p.name + ' wohnt jetzt in deinem Gym!', 'big'); re(); MK.save(); });
  P.querySelectorAll('[data-dbuy]').forEach(b => b.onclick = () => { const [g, id] = b.dataset.dbuy.split('|'); if (buyRare(g, id)) re(); });
  P.querySelectorAll('[data-rwear]').forEach(b => b.onclick = () => { const [g, id] = b.dataset.rwear.split('|'); S.look[g] = S.look[g] === id ? MK.WARD[g].items[0].id : id; MK.Audio.play('pop'); re(); MK.save(); });
}
/* --- Personal Trainer: Stufe (Wdh./s) und XP pro Muskelgruppe --- */
function paneTrainer(P) {
  const S = MK.S, lv = MK.trainerRate(), mx = lv >= MK.TRAINER_MAX, cost = MK.trainerCost(lv), cur = MK.curEx();
  let h = `<h3 class="sh">Personal Trainer ${ib('Er trainiert automatisch die Muskelgruppe, die du gerade ausgewählt hast – nie alle auf einmal. Seine Upgrades erhöhen nur die automatischen XP. Deine eigenen Klicks levelst du wie bisher über die Gewichte im Laden.')}</h3>`;
  { const am = MK.labAutoMul ? MK.labAutoMul() : 1, wi = cur && MK.exOpen(cur) ? MK.wCur(cur) : 0, xps = cur && MK.exOpen(cur) ? lv * am * MK.xpPerRep(cur, wi) * MK.trainerGMul(cur.g) * (MK.labXpMul ? MK.labXpMul() : 1) : 0;
    h += `<label class="autorow trsw"><span class="sw2"><input type="checkbox" id="trOn" ${S.trainer.off ? '' : 'checked'}><span></span></span><b>${S.trainer.off ? 'Trainer macht Pause' : 'Trainer trainiert mit'}</b></label>`;
    h += `<div class="trhead"><div><small>Level</small><b>${lv}</b></div><div><small>Wdh. pro Sekunde</small><b>${lv * am}${am > 1 ? ' ⚡' : ''}</b></div><div><small>Auto-XP pro Sekunde</small><b>${S.trainer.off ? '–' : MK.fmtS(xps)}</b></div></div>`; }
  h += `<div class="card up"><div class="row"><div><h4>Tempo <small>Stufe ${lv}/${MK.TRAINER_MAX}</small></h4><p><b>${lv}</b> Wiederholung${lv === 1 ? '' : 'en'} pro Sekunde${cur ? ` · trainiert gerade: <b>${MK.MUSCLES.find(m => m.id === cur.g).name}</b>` : ''}</p>
    <div class="trbar"><i style="width:${lv / MK.TRAINER_MAX * 100}%"></i></div></div>${mx ? '<span class="tag">Max</span>' : `<button class="btn ok" data-trup="1" data-pr="${cost}">Stufe ${lv + 1}<br><small>${MK.fmt(cost)} €</small></button>`}</div></div>`;
  h += `<h3 class="sh">Muskelgruppen ${ib('Jede Stufe: +15 % XP für die automatischen Wiederholungen des Trainers in dieser Muskelgruppe. Deine eigenen Klicks bleiben unverändert.')}</h3>`;
  MK.MUSCLES.forEach(m => { const gl = MK.trainerGLv(m.id), pr = MK.trainerGCost(m.id), act = cur && cur.g === m.id;
    h += `<div class="card trg ${act ? 'act' : ''}" style="--mc:${m.col}"><div class="row"><div><h4>${m.name} <small>Stufe ${gl}</small>${act ? ' <span class="tag">aktiv</span>' : ''}</h4><p class="small">+${gl * 15} % Auto-XP → nächste Stufe +${(gl + 1) * 15} %</p></div><button class="btn" data-trg="${m.id}" data-pr="${pr}">${MK.fmt(pr)} €</button></div></div>`; });
  P.innerHTML = h;
  const re = () => { const sc = P.scrollTop; paneTrainer(P); P.scrollTop = sc; U.liveBuy(); U.quick(); MK.save(); };
  { const t = $('trOn'); if (t) t.onchange = () => { S.trainer.off = !t.checked; MK.Audio.play('pop'); U.toast(S.trainer.off ? 'Trainer macht Pause' : 'Trainer trainiert wieder mit'); MK.save(); U.refresh(); }; }
  P.querySelectorAll('[data-trup]').forEach(b => b.onclick = () => { if (MK.buyTrainer()) { MK.Audio.play('level'); U.toast(`Trainer Stufe ${MK.trainerRate()}: ${MK.trainerRate()} Wdh./s`, 'big'); re(); } else { U.toast(`Dir fehlen noch ${MK.fmt(+b.dataset.pr - S.money)} €`); MK.Audio.play('error'); } });
  P.querySelectorAll('[data-trg]').forEach(b => b.onclick = () => { if (MK.buyTrainerG(b.dataset.trg)) { MK.Audio.play('buy'); re(); } else { U.toast(`Dir fehlen noch ${MK.fmt(+b.dataset.pr - S.money)} €`); MK.Audio.play('error'); } });
}
/* --- Musik (nur über die Boombox im Gym) --- */
function paneMusic(P) {
  const S = MK.S, sm = MK.shopMul(); let h = `<div class="card"><div class="row"><div><h4>Boombox</h4><p class="small">${S.music.on ? '♪ ' + MK.MUSIC.find(x => x.id === S.music.cur).name : 'Aus'}</p></div><button class="btn" data-mtog="1">${S.music.on ? 'Aus' : 'An'}</button></div></div>`;
  MK.MUSIC.forEach(m => { const own = S.music.owned.includes(m.id), ok = S.eq.boombox >= m.bl, pr = MK.nice(m.price * sm), on = S.music.cur === m.id && S.music.on;
    h += `<div class="card ${ok ? '' : 'locked'}"><div class="row"><div><h4>${on ? '♪ ' : ''}${m.name}</h4><p class="small">${ok ? m.desc : '🔒 Boombox ' + MK.MATERIAL[m.bl - 1].name}</p></div>
      ${own ? `<button class="btn ${on ? 'ok' : ''}" data-mplay="${m.id}">${on ? '♪' : '▶'}</button>` : ok ? `<button class="btn alt" data-mbuy="${m.id}" data-pr="${pr}">${MK.fmt(pr)} €</button>` : ''}</div></div>`; });
  P.innerHTML = h;
  const re = () => { MK.dirty(); MK.Audio.music(); paneMusic(P); U.liveBuy(); MK.save(); };
  P.querySelectorAll('[data-mtog]').forEach(b => b.onclick = () => { S.music.on = !S.music.on; re(); });
  P.querySelectorAll('[data-mplay]').forEach(b => b.onclick = () => { S.music.cur = b.dataset.mplay; S.music.on = true; re(); });
  P.querySelectorAll('[data-mbuy]').forEach(b => b.onclick = () => { const id = b.dataset.mbuy, pr = +b.dataset.pr; if (!MK.spend(pr)) { U.toast(`Dir fehlen noch ${MK.fmt(pr - S.money)} €`); return; } S.music.owned.push(id); S.music.cur = id; S.music.on = true; MK.Audio.play('buy'); re(); });
}
/* Extra-Reiter, die nur aus dem Gym heraus aufgehen (Kühlschrank, Boombox) */
const EXTRA = { trainer: { name: 'Trainer', icon: '<path d="M6 3h10v18H6zM9 1h4v4H9zM8 9h6M8 13h6M8 17h4"/>' }, dshop: { name: 'Shop', icon: '<path d="M6 3h12l4 6-10 12L2 9zM2 9h20M9 3l3 18M15 3l-3 18"/>' }, fridge: { name: 'Küche', icon: '<path d="M7 3h10v18H7zM7 10h10M10 6v2M10 13v3"/>' }, music: { name: 'Musik', icon: '<path d="M9 18V5l11-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zM20 16a3 3 0 11-6 0 3 3 0 016 0z"/>' } };
U.openExtra = function (id) {
  document.querySelectorAll('.tab.extra').forEach(b => { if (b.dataset.tab !== id) b.remove(); });
  let b = document.querySelector(`.tab.extra[data-tab="${id}"]`);
  if (!b) { const E2 = EXTRA[id] || (MK.EXTRA_DEFS || {})[id]; b = document.createElement('button'); b.className = 'tab extra'; b.setAttribute('role', 'tab'); b.dataset.tab = id;
    b.innerHTML = `<svg class="ti" viewBox="0 0 24 24" aria-hidden="true">${E2.icon}</svg><span>${E2.name}</span><span class="xclose" aria-label="Schließen">×</span>`;
    document.querySelector('.tabs').appendChild(b);
    b.onclick = e => { if (e.target.closest('.xclose')) { b.remove(); if (tab === id) go(mobile() ? 'train' : 'comp'); return; } go(id); }; }
  go(id); if (mobile()) document.querySelector('.side').scrollIntoView({ behavior: 'smooth', block: 'end' });
};
/* --- Garderobe: Kategorien, gleichmäßiges Raster mit Vorschaubildern. Antippen = anprobieren (Vorschau im Gym), Kaufen erst im Feld unten rechts --- */
const WCATS = [['top', 'Oberteil'], ['bottom', 'Hose'], ['shoes', 'Schuhe'], ['gloves', 'Handschuhe'], ['head', 'Kopf'], ['acc', 'Extras'], ['hair', 'Frisur'], ['hairc', 'Haarfarbe'], ['beard', 'Bart'], ['skin', 'Haut'], ['tan', 'Bräune'], ['tattoo', 'Tattoos']]; // Anzug-Reiter entfernt
let wardCat = 'top', wardSel = null; U.preview = null;
MK.lookView = () => { const S = MK.S; if (!U.preview || !U.tab || U.tab() !== 'ward' || U.preview.g === 'tattoo' || U.preview.g === 'suit') return S.look; return Object.assign({}, S.look, { [U.preview.g]: U.preview.id }); };
MK.tatsView = () => { const on = MK.tatsOn(); if (U.preview && U.preview.g === 'tattoo' && U.tab && U.tab() === 'ward' && !on.includes(U.preview.id)) return on.concat(U.preview.id); return on; };
const wItem = (g, id) => g === 'tattoo' ? MK.TATS.find(t => t.id === id) : g === 'suit' ? MK.SUITS.find(s => s.id === id) : MK.WARD[g].items.find(i => i.id === id);
function wState(g, it) { const S = MK.S;
  if (g === 'tattoo') { const got = S.tats.got.includes(it.id); return { owned: got, met: got, worn: S.tats.on.includes(it.id) }; }
  if (g === 'suit') { const ok = MK.suitOk(it), cur = MK.suitCur(); return { owned: ok, met: ok, worn: !!cur && cur.id === it.id }; }
  const first = MK.WARD[g].items[0] === it, owned = g === 'skin' || first || (!it.price && !it.dia) || S.bought.includes(it.id + g);
  return { owned, met: it.dia ? true : MK.reqMet(it.req), worn: S.look[g] === it.id, gemOnly: !!it.dia }; }
/* Vorschaubild: Figur mit dem Teil rendern und passend ausschneiden (einmal je Look gecacht) */
const THC = {};
function thumbKey(g, id) { const S = MK.S, L = S.look; return [g, id, L.skin, L.hairc, L.hair, L.tan, L.top, Math.round(MK.totalLv() / 15)].join('|'); }
function renderThumb(g, id) { const k = thumbKey(g, id); if (THC[k]) return THC[k];
  const S = MK.S, look = Object.assign({}, S.look); let tats = MK.tatsOn();
  if (g === 'tattoo') { look.top = 'oben-ohne'; tats = [id]; } else look[g] = id;
  if (g === 'gloves') look.top = S.look.top;
  const L = MK.Fig.resolveLook(look); L.tats = tats;
  const cv = document.createElement('canvas'); cv.width = 380; cv.height = 860; const c = cv.getContext('2d');
  const R = MK.Fig.render(c, 190, 840, 1.7, { key: 'thumb', lv: MK.lvExact(), L, pose: { face: 'neutral' }, posture: MK.rankIdx() / 10, breath: 0, dpr: 1 });
  let cx, cy, sz; const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  if (['hair', 'beard', 'head'].includes(g) || (g === 'acc' && id === 'brille')) { cx = R.head.x; cy = R.head.y - 8; sz = 120; }
  else if (g === 'shoes') { const f = mid(R.foot.l, R.foot.r); cx = f.x; cy = f.y - 18; sz = 150; }
  else if (g === 'bottom' || (g === 'acc' && id === 'guertel')) { cx = R.hip.x; cy = R.hip.y + 30; sz = 210; }
  else if (g === 'gloves' || (g === 'acc' && id === 'uhr')) { cx = R.ha.r.x; cy = R.ha.r.y - 10; sz = 110; }
  else if (g === 'tattoo') { cx = R.neck.x; cy = R.neck.y + 80; sz = 260; }
  else { cx = R.neck.x; cy = R.neck.y + 62; sz = 230; }
  const o = document.createElement('canvas'); o.width = o.height = 120; const oc = o.getContext('2d'); oc.drawImage(cv, cx - sz / 2, cy - sz / 2, sz, sz, 0, 0, 120, 120);
  return (THC[k] = o.toDataURL()); }
function thumbHtml(g, it) {
  if (g === 'skin' || g === 'hairc' || g === 'suit') return `<span class="swb" style="--s:${it.val}"></span>`;
  if (g === 'tan') { const sk = MK.Fig.resolveLook(Object.assign({}, MK.S.look, { tan: it.id })), col = MK.Fig.skin(sk, MK.Fig.dims(MK.lvExact(), 0, 0), {}).sk; return `<span class="swb" style="--s:${col}"></span>`; }
  if (it.id === 'none' && g !== 'hair') return '<span class="none">–</span>';
  const k = thumbKey(g, it.id); return THC[k] ? `<img alt="" src="${THC[k]}">` : `<span class="ld" data-th="${g}|${it.id}"></span>`; }
function paneWard(P) {
  const S = MK.S, g = wardCat, list = g === 'tattoo' ? MK.TATS : g === 'suit' ? MK.SUITS : MK.WARD[g].items;
  let h = `<div class="wcats">${WCATS.map(([id, n]) => `<button class="opt" data-wcat="${id}" aria-pressed="${id === g}">${n}</button>`).join('')}</div>`;
  if (g === 'suit') h += '<p class="small wnote">Der Anzug ist dein Outfit im Imperium. Neue Anzüge gibt es über Geschäfte.</p>';
  if (g === 'tattoo') h += '<p class="small wnote">Tattoos verdienst du dir. Mehrere gleichzeitig möglich.</p>';
  h += `<div class="wscroll"><div class="wtgrid">${list.map(it => { const st = wState(g, it), sel = wardSel && wardSel.g === g && wardSel.id === it.id;
    const mark = st.worn ? '<i class="ck">✓</i>' : !st.owned ? (st.gemOnly ? '<i class="gm">💎</i>' : !st.met ? '<i class="lk">🔒</i>' : '') : '';
    return `<button class="wt ${st.worn ? 'on' : ''} ${sel ? 'sel' : ''} ${!st.owned && !st.met ? 'lock' : ''}" data-wt="${g}|${it.id}"><span class="th">${thumbHtml(g, it)}</span><span class="nm">${esc(it.name)}</span>${mark}</button>`; }).join('')}</div></div>`;
  if (wardSel && wardSel.g === g) { const it = wItem(g, wardSel.id), st = wState(g, it); let act = '';
    if (g === 'tattoo') act = st.owned ? `<button class="btn ok" data-wtat="${it.id}">${st.worn ? 'Ablegen' : 'Tragen'}</button>` : `<p class="small noc">🔒 ${esc(it.desc)}</p>`;
    else if (g === 'suit') act = st.owned ? (st.worn ? '<span class="tag">Trägst du</span>' : `<button class="btn ok" data-wsuit="${it.id}">Anziehen</button>`) : `<p class="small noc">🔒 ${esc(MK.reqText(it.req))}</p>`;
    else if (st.owned) act = st.worn ? '<span class="tag">Trägst du</span>' : `<button class="btn ok" data-wwear="1">Anziehen</button>`;
    else if (!st.met) act = `<p class="small noc">🔒 Freischalten: ${esc(MK.reqText(it.req))}</p>`;
    else { const pe = MK.wardPrice(it), pd = MK.wardDia(it); act = `${st.gemOnly ? '' : `<button class="btn" data-wbuy="money" data-pr="${pe}">Kaufen · ${MK.fmt(pe)} €</button>`}<button class="btn dia" data-wbuy="dia" data-pr="${pd}" data-cur="dia">Kaufen · ${pd} 💎</button>`; }
    h += `<div class="wbuy"><button class="wx" data-wclose="1" aria-label="Auswahl schließen">×</button><small>${WCATS.find(c => c[0] === g)[1]}${st.gemOnly ? ' · selten' : ''}</small><h4>${esc(it.name)}</h4><div class="wact">${act}</div></div>`; }
  else h += `<div class="wbuy empty"><small>Kasse</small><h4>Nichts ausgewählt</h4><p class="small">Tippe ein Teil an, um es anzuprobieren.</p></div>`;
  P.innerHTML = h;
  const re = () => { const ws = P.querySelector('.wscroll'), sc = ws ? ws.scrollTop : 0; paneWard(P); const w2 = P.querySelector('.wscroll'); if (w2) w2.scrollTop = sc; };
  P.querySelectorAll('[data-wcat]').forEach(b => b.onclick = () => { wardCat = b.dataset.wcat; wardSel = null; U.preview = null; MK.Audio.play('pop'); paneWard(P); });
  P.querySelectorAll('[data-wt]').forEach(b => b.onclick = () => { const [g2, id] = b.dataset.wt.split('|'); if (wardSel && wardSel.g === g2 && wardSel.id === id) return;
    wardSel = { g: g2, id }; U.preview = g2 === 'suit' ? null : { g: g2, id }; MK.Audio.play('pop'); MK.Scene.setFace('proud', 900); re(); });
  P.querySelectorAll('[data-wclose]').forEach(b => b.onclick = () => { wardSel = null; U.preview = null; re(); });
  P.querySelectorAll('[data-wwear]').forEach(b => b.onclick = () => { S.look[wardSel.g] = wardSel.id; MK.Audio.play('pop'); MK.Scene.setFace('proud', 1200); wardSel = null; U.preview = null; re(); MK.save(); });
  P.querySelectorAll('[data-wtat]').forEach(b => b.onclick = () => { const id = b.dataset.wtat, on = S.tats.on, i = on.indexOf(id); if (i >= 0) on.splice(i, 1); else on.push(id); MK.Audio.play('pop'); re(); MK.save(); });
  P.querySelectorAll('[data-wsuit]').forEach(b => b.onclick = () => { S.suit = b.dataset.wsuit; MK.Audio.play('pop'); re(); MK.save(); });
  P.querySelectorAll('[data-wbuy]').forEach(b => b.onclick = () => { const it = wItem(wardSel.g, wardSel.id), pr = +b.dataset.pr, dia = b.dataset.wbuy === 'dia';
    if (dia) { if (S.dia < pr) { U.toast(`Dir fehlen noch ${pr - S.dia} 💎`); MK.Audio.play('error'); return; } S.dia -= pr; }
    else if (!MK.spend(pr)) { U.toast(`Dir fehlen noch ${MK.fmt(pr - S.money)} €`); MK.Audio.play('error'); return; }
    S.bought.push(it.id + wardSel.g); S.look[wardSel.g] = it.id; MK.Audio.play('buy'); MK.Scene.setFace('proud', 1400); U.toast(it.name + ' gekauft!', 'big'); wardSel = null; U.preview = null; U.quick(); re(); MK.save(); });
  // Vorschaubilder nach und nach erzeugen, damit nichts ruckelt
  const todo = [...P.querySelectorAll('[data-th]')]; const step = () => { const el = todo.shift(); if (!el) return; if (el.isConnected) { const [g2, id] = el.dataset.th.split('|'); try { const src = renderThumb(g2, id); const img = new Image(); img.alt = ''; img.src = src; el.replaceWith(img); } catch (e) { } } setTimeout(step, 0); }; setTimeout(step, 30);
}

/* --- Täglich --- */
function paneDaily(P) {
  const S = MK.S; MK.ensureQuests();
  const today = MK.today(), claimed = S.daily.claimedDay === today;
  const yest = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); })();
  const streakNow = claimed ? S.daily.streak : (S.daily.claimedDay === yest || S.daily.claimedDay === '' ? S.daily.streak : 0);
  const dayIdx = claimed ? (S.daily.streak - 1) % 7 : streakNow % 7;
  let h = `<h3 class="sh">Tägliche Belohnung <small>Serie: ${S.daily.streak} Tage</small></h3><div class="cal">` + MK.DAILY_REWARDS.map((r, i) => {
    const st = i < dayIdx || (claimed && i === dayIdx) ? 'done' : i === dayIdx ? 'now' : '';
    return `<div class="day ${st}"><small>Tag ${i + 1}</small><b>${MK.rewardText(MK.dailyReward(r))}</b></div>`; }).join('') + `</div>
    <button class="btn ok wide" id="claimDay" ${claimed ? 'disabled' : ''}>${claimed ? 'Morgen wieder!' : 'Belohnung abholen'}</button>`;
    const qrow = (q, i, w) => `<div class="card quest ${q.done ? 'done' : ''}"><div class="row"><div><h4>${q.name}</h4><div class="qbar"><i style="width:${q.p / q.n * 100}%"></i></div><p>${MK.fmt(q.p)} / ${MK.fmt(q.n)} · ${MK.rewardText(q.rew)}</p></div>
    <button class="btn ok" data-q="${w}|${i}" ${q.done && !q.claimed ? '' : 'disabled'}>${q.claimed ? 'Erledigt' : 'Abholen'}</button></div></div>`;
  h += '<h3 class="sh">Trainingsplan</h3>';
  if (!MK.planOpen()) h += '<div class="card locked"><h4>Trainingsplan</h4><p>🔒 Gesamt-Level 12</p></div>';
  else { const pd = MK.planDay();
    h += `<div class="card plan"><p>+15 % XP auf die Tagesmuskeln · 7 Stempel = 3 💎 + 1 SP</p><div class="opts">${MK.PLANS.map(p => `<button class="opt" data-plan="${p.id}" aria-pressed="${S.plan.id === p.id}">${p.name}</button>`).join('')}</div>`;
    if (pd) h += `<h4>Heute: ${pd.day.n}-Tag <small>(Tag ${pd.idx + 1} von ${pd.n})</small></h4><p>${pd.day.g.map(g => MK.MUSCLES.find(m => m.id === g).name).join(', ')}</p><div class="qbar"><i style="width:${Math.min(100, S.plan.p / pd.quota * 100)}%"></i></div><p>${S.plan.p} / ${pd.quota} Wdh.</p>
      <div class="stamps">${Array.from({ length: 7 }, (_, i) => `<span class="${i < S.plan.stamps ? 'on' : ''}"></span>`).join('')}</div>`;
    h += '</div>'; }
  MK.ensureWch(); const W2 = S.wch, wg = MK.MUSCLES.find(m => m.id === W2.g);
  h += `<h3 class="sh">Wochen-Challenge</h3><div class="card quest ${W2.done ? 'done' : ''}"><div class="row"><div><h4>${MK.fmt(W2.n)} Wiederholungen für ${wg.name}</h4><div class="qbar"><i style="width:${W2.p / W2.n * 100}%"></i></div><p>${MK.fmt(W2.p)} / ${MK.fmt(W2.n)} · ${MK.rewardText(W2.rew)}</p></div>
    <button class="btn ok" id="wchBtn" ${W2.done && !W2.claimed ? '' : 'disabled'}>${W2.claimed ? 'Erledigt' : 'Abholen'}</button></div></div>`;
  h += '<h3 class="sh">Tagesaufgaben</h3>' + S.quests.list.map((q, i) => qrow(q, i, 'd')).join('');
  h += '<h3 class="sh">Wochenaufgaben</h3>' + S.quests.wlist.map((q, i) => qrow(q, i, 'w')).join('');
  P.innerHTML = h;
  P.querySelectorAll('[data-plan]').forEach(b => b.onclick = () => { if (S.plan.id !== b.dataset.plan) { S.plan.id = b.dataset.plan; S.plan.day = 0; S.plan.p = 0; } MK.Audio.play('pop'); U.refresh(); U.training(); MK.save(); });
  const wb = $('wchBtn'); if (wb) wb.onclick = () => { if (!S.wch.done || S.wch.claimed) return; S.wch.claimed = true; MK.reward(S.wch.rew); MK.Audio.play('coin'); U.toast('Wochen-Challenge: ' + MK.rewardText(S.wch.rew), 'big'); U.refresh(); MK.save(); };
  $('claimDay').onclick = () => { if (S.daily.claimedDay === today) return; S.daily.streak = streakNow + 1; S.daily.claimedDay = today; const r = MK.dailyReward(MK.DAILY_REWARDS[(S.daily.streak - 1) % 7]); MK.reward(r); MK.Audio.play('coin'); U.toast('Abgeholt: ' + MK.rewardText(r)); MK.Scene.particle('coin', MK.Scene.W / 2, MK.Scene.H / 2, 12); U.refresh(); MK.save(); };
  P.querySelectorAll('[data-q]').forEach(b => b.onclick = () => { const [w, i] = b.dataset.q.split('|'), q = (w === 'd' ? S.quests.list : S.quests.wlist)[+i]; if (!q.done || q.claimed) return; q.claimed = true; MK.reward(q.rew); MK.Audio.play('coin'); U.toast('Belohnung: ' + MK.rewardText(q.rew)); U.refresh(); MK.save(); });
}

/* --- Pokale --- */
function paneTroph(P) {
  const S = MK.S, got = MK.ACH.filter(a => S.ach[a.id]).length;
  let h = `<h3 class="sh">Turnier-Pokale</h3><div class="shelf">` + MK.TOURNEYS.map(T => { const n = S.trophies[T.id] || 0;
    return `<div class="trophy ${n ? T.trophy : 'empty'}"><svg viewBox="0 0 40 48" aria-hidden="true"><path d="M10 4h20v10c0 8-4 14-10 14S10 22 10 14z"/><path d="M10 8H4c0 7 3 11 7 11M30 8h6c0 7-3 11-7 11" fill="none" stroke-width="3"/><rect x="17" y="27" width="6" height="8"/><rect x="11" y="35" width="18" height="6" rx="1"/></svg><small>${T.name}</small><b>${n ? '×' + n : '–'}</b></div>`; }).join('') + '</div>';
  h += `<h3 class="sh">Erfolge <small>${got} / ${MK.ACH.length}</small></h3><div class="achs">` + MK.ACH.map(a => { const ok = !!S.ach[a.id];
    return `<div class="ach ${ok ? a.t : 'locked'}" title="${esc(a.desc)}"><span class="medal"></span><div><b>${a.name}</b><small>${a.desc}${ok ? '' : ' · ' + MK.rewardText(a.r)}</small></div></div>`; }).join('') + '</div>';
  h += `<h3 class="sh">Titel</h3><div class="opts">` + MK.TITLES.map(t => { const ok = MK.titleOk(t.id);
    return ok ? `<button class="opt" data-title="${t.id}" aria-pressed="${S.title === t.id}">${t.name}</button>` : `<button class="opt locked" data-lock="${esc(t.desc)}">🔒 ${t.name}</button>`; }).join('') + '</div>';
  const cards = MK.cards(), gotN = cards.filter(c => c.got).length, RAR = ['Gewöhnlich', 'Selten', 'Episch', 'Legendär'];
  h += `<h3 class="sh">Sammelkarten <small>${gotN} / ${cards.length}</small></h3><div class="cards">` + cards.map(c => c.got
    ? `<div class="gcard r${c.rar}"><img data-card="${c.id}" alt=""><b>${esc(c.name)}</b><small>${esc(c.sub)}</small><em>${RAR[c.rar]}</em></div>`
    : `<div class="gcard locked"><span>?</span><b>???</b><small>${esc(c.sub)}</small></div>`).join('') + '</div>';
  P.innerHTML = h;
  P.querySelectorAll('[data-title]').forEach(b => b.onclick = () => { S.title = b.dataset.title; MK.Audio.play('pop'); U.quick(); paneTroph(P); MK.save(); });
  P.querySelectorAll('[data-lock]').forEach(b => b.onclick = () => U.toast('Freischalten: ' + b.dataset.lock));
  const imgs = [...P.querySelectorAll('img[data-card]')]; let i = 0; const step = () => { const t0 = performance.now(); while (i < imgs.length && performance.now() - t0 < 12) { const im = imgs[i++]; im.src = cardImg(cards.find(c => c.id === im.dataset.card)); } if (i < imgs.length) requestAnimationFrame(step); }; step();
}
const cardCache = {};
function cardImg(c) {
  if (cardCache[c.id]) return cardCache[c.id];
  const cv = document.createElement('canvas'); cv.width = 120; cv.height = 150; const x = cv.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 150); g.addColorStop(0, ['#e9e4d6', '#cfe3ff', '#e5d2ff', '#ffe7a6'][c.rar]); g.addColorStop(1, '#ffffff'); x.fillStyle = g; x.fillRect(0, 0, 120, 150);
  let o;
  if (c.kind === 'opp') { const oo = MK.Comp.oppOpts(c.seed, c.idx); o = Object.assign(oo, { pose: { face: 'proud', arms: { l: { a: [1.45, 3.0], fx: .55, flex: 1 }, r: { a: [1.45, 3.0], fx: .55, flex: 1 } } } }); }
  else if (c.kind === 'rival') o = { lv: Object.fromEntries(MK.MUSCLES.map(m => [m.id, c.lvl])), L: MK.Fig.resolveLook(Object.assign({}, c.look, { tan: 'tan3' })), posture: 1, pose: { face: 'proud' } };
  else { const n = MK.Scene.NPC.find(z => z.id === c.npc); const L = MK.Fig.resolveLook(n.look); if (n.topCol) L.top = { val: n.topCol, cut: 'tee' }; if (n.bra) L.top = { val: n.bra, cut: 'bra' }; o = { lv: Object.fromEntries(MK.MUSCLES.map(m => [m.id, n.lv])), L, posture: n.post, fem: !!n.fem, belly: n.belly || 0, plain: true, pose: { face: 'neutral' } }; }
  MK.Fig.render(x, 60, 146, .4, Object.assign(o, { key: 'card', dpr: 1, breath: 0 }));
  return (cardCache[c.id] = cv.toDataURL('image/png'));
}

/* --- Optionen (Einstellungen, Statistik, Spielstand) --- */
function paneOpt(P) {
  const S = MK.S, st = S.stats;
  let h = `<div class="subtabs">${[['set', 'Einstellungen'], ['stat', 'Statistik'], ['save', 'Spielstand']].map(([k, n]) => `<button data-ot="${k}" aria-selected="${optTab === k}">${n}</button>`).join('')}</div>`;
  if (optTab === 'set') {
    const sl = (id, lab, v) => `<label class="slider"><span>${lab}</span><input type="range" id="${id}" min="0" max="1" step="0.05" value="${v}"><b>${Math.round(v * 100)} %</b></label>`;
    h += sl('vVol', 'Gesamtlautstärke', S.set.vol) + sl('vMus', 'Musik', S.set.music) + sl('vSfx', 'Effekte', S.set.sfx);
    h += `<label class="sel"><span>Grafik</span><select id="vQ">${['hoch', 'mittel', 'niedrig'].map(q => `<option ${S.set.quality === q ? 'selected' : ''}>${q}</option>`).join('')}</select></label>
    <label class="autorow"><span class="sw2"><input type="checkbox" id="vEco" ${MK.ecoOn() ? 'checked' : ''}><span></span></span><b>Akku sparen</b> ${ib('Etwas geringere Auflösung, nichts läuft im Hintergrund (auf dem Handy standardmäßig an). Schaltest du es selbst ein, zeichnet das Spiel im Leerlauf zusätzlich weniger Bilder – beim Spielen bleibt es immer flüssig.')}</label>
      <label class="chk"><input type="checkbox" id="vRed" ${S.set.reduce ? 'checked' : ''}> Weniger Animationen</label>
      <label class="chk"><input type="checkbox" id="vNpc" ${S.set.npc !== false ? 'checked' : ''}> Leute & NPCs im Gym ${ib('Aus: keine Besucher, kein Rivale, kein Hausmeister. Kevin und der Barkeeper bleiben.')}</label>
      <label class="chk"><input type="checkbox" id="vShk" ${S.set.shake ? 'checked' : ''}> Wackeln bei schweren Gewichten</label>
      <div class="term"><div class="termhead">&gt;_ Terminal</div><div class="termlog" id="tLog">${(U._tlog || ['Code eingeben …']).map(l => `<div>${esc(l)}</div>`).join('')}</div>
        <form id="tForm" class="termrow"><span>&gt;</span><input id="tIn" inputmode="numeric" autocomplete="off" spellcheck="false" maxlength="12" aria-label="Code"><button class="btn" type="submit">OK</button></form></div>
      ${MK.pwa && !MK.pwa.standalone ? '<button class="btn alt wide" id="vApp">📲 Als App installieren</button>' : ''}
      <button class="btn wide" id="vTut">Erklärungen noch mal zeigen</button>
      <button class="btn danger wide" id="vRst">Neu starten</button>`;
  }
  if (optTab === 'stat') {
    const hrs = st.play / 3600, row = (a, b) => `<tr><td>${a}</td><td>${b}</td></tr>`;
    h += `<table class="stats"><tbody>${row('Spielzeit', hrs >= 1 ? MK.fmt1(hrs) + ' h' : Math.round(st.play / 60) + ' min')}${row('Wiederholungen', MK.fmt(st.reps))}${row('Perfekte Wiederholungen', MK.fmt(st.crits))}${row('Beast-Modus', MK.fmt(st.beasts) + '×')}
      ${row('Level-Aufstiege', MK.fmt(st.levels))}${row('Siege / Niederlagen', `${MK.fmt(st.wins)} / ${MK.fmt(st.losses)}`)}${row('Turniersiege', MK.fmt(st.tourneys))}${row('Siege gegen Rivalen', MK.fmt(st.rivalWins))}
      ${row('Geld verdient', MK.fmt(st.earned) + ' €')}${row('Geld ausgegeben', MK.fmt(st.spent) + ' €')}${row('Ruhm', MK.fmt(S.fame))}${row('Memes / virale Clips', `${st.memes} / ${st.virals}`)}${row('Bonus-Gegenstände', MK.fmt(st.bonus))}</tbody></table>
      <h3 class="sh">Wiederholungen je Muskelgruppe</h3><table class="stats"><tbody>${MK.MUSCLES.map(m => row(`${m.name} (Lv ${S.m[m.id].lv})`, MK.fmt(st.byG[m.id] || 0))).join('')}</tbody></table>`;
    h = h.replace('<table class="stats">', charts() + '<table class="stats">');
  }
  if (optTab === 'save') h += paneSave();
  P.innerHTML = h;
  P.querySelectorAll('[data-ot]').forEach(b => b.onclick = () => { optTab = b.dataset.ot; paneOpt(P); });
  if (optTab === 'set') {
    [['vVol', 'vol'], ['vMus', 'music'], ['vSfx', 'sfx']].forEach(([id, k]) => { const i = $(id); i.oninput = () => { S.set[k] = +i.value; i.nextElementSibling.textContent = Math.round(i.value * 100) + ' %'; MK.Audio.unlock(); MK.Audio.applyVol(); }; i.onchange = MK.save; });
    $('vQ').onchange = e => { S.set.quality = e.target.value; MK.save(); };
    $('vEco').onchange = e => { S.set.eco = e.target.checked; MK.save(); MK.Scene.resize(); };
    $('vRed').onchange = e => { S.set.reduce = e.target.checked; MK.save(); };
    $('vNpc').onchange = e => { S.set.npc = e.target.checked; MK.save(); MK.Scene.buildCrowd(); };
    $('vShk').onchange = e => { S.set.shake = e.target.checked; MK.save(); };
    const tf = P.querySelector('#tForm'); if (tf) tf.onsubmit = e => { e.preventDefault(); const inp = P.querySelector('#tIn'), code = inp.value.trim(); inp.value = ''; const log = U._tlog = (U._tlog || []).filter(l => l !== 'Code eingeben …'); log.push('> ' + (code || ' '));
      if (code === '0001') { MK.earn(5e10, true); S.fame += 250; MK.emit('fame', 250); MK.MUSCLES.forEach(m => { S.m[m.id].lv += 30; S.m[m.id].xp = 0; }); { const due = Math.floor(MK.totalLv() / 4); if (due > S.spLv) { S.sp += due - S.spLv; S.spLv = due; } const ri = MK.rankIdx(); if (ri > S.rankSeen) { S.sp += ri - S.rankSeen; S.rankSeen = ri; } } MK.dirty(); MK.incomeDirty(); MK.checkAch(); MK.save();
        MK.DISC.forEach(d => { S.beat[d.id] = 8; S.wins[d.id] = Math.max(S.wins[d.id] || 0, 8); }); MK.TOURNEYS.forEach(T => { S.trophies[T.id] = Math.max(1, S.trophies[T.id] || 0); }); S.stats.wins = Math.max(S.stats.wins, 80); S.stats.tourneys = Math.max(S.stats.tourneys, MK.TOURNEYS.length); MK.checkAch(); MK.save();
        log.push('✓ +50 Mrd € · +250 Ruhm · Muskeln +30 Level · alle Wettkämpfe gewonnen'); MK.Audio.play('level'); MK.Scene.fx.flash = 1; MK.Scene.particle('confetti', MK.Scene.W / 2, MK.Scene.H * .3, 60); U.toast('Test-Code: +50 Mrd € · +250 Ruhm · Muskeln +30 · alle Titel', 'big'); U.training(); }
      else if (code === '0002') { S.dia += 1000; log.push('✓ +1.000 💎'); MK.Audio.play('level'); MK.Scene.particle('spark', MK.Scene.W / 2, MK.Scene.H * .4, 30); U.toast('Test-Code: +1.000 💎', 'big'); U.quick(); MK.save(); }
      else { log.push('✗ Unbekannter Code'); MK.Audio.play('error'); }
      while (log.length > 6) log.shift(); U.refresh(); setTimeout(() => { const ni = document.getElementById('tIn'); if (ni) ni.focus(); }, 30); };
    const va = $('vApp'); if (va) va.onclick = () => { const P2 = MK.pwa; if (P2.prompt) { P2.prompt.prompt(); P2.prompt.userChoice.then(c => { if (c.outcome === 'accepted') U.toast('App wird installiert'); P2.prompt = null; U.refresh(); }); return; }
      const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      U.toast(ios ? 'Safari: Teilen-Knopf ⬆︎ → „Zum Home-Bildschirm“' : 'Browser-Menü ⋮ → „App installieren“ / „Zum Startbildschirm“', 'big'); };
    $('vTut').onclick = () => { S.intro = {}; MK.save(); U.toast('Die Erklärungen erscheinen wieder in den Reitern'); U.refresh(); };
    let armed2 = false; $('vRst').onclick = () => { const b = $('vRst'); if (!armed2) { armed2 = true; b.textContent = 'Wirklich? Alles wird gelöscht – nochmal tippen'; setTimeout(() => { armed2 = false; const b2 = $('vRst'); if (b2) b2.textContent = 'Neu starten'; }, 4000); return; }
      MK.reset(); MK.Scene.buildCrowd(); U.training(); U.refresh(); U.tutorial(); U.toast('Neuer Spielstand'); };
  }
  if (optTab === 'save') bindSave(P);
}

/* ---------- Spielstand übertragen: kurzer Code (online), Datei (ohne Internet), Sicherung, langer Code ---------- */
const XF = { mode: null, code: null, until: 0, busy: false, err: '', confirm: null, inp: '' };
const XI = { up: '<path d="M12 19V5M6 11l6-6 6 6"/>', down: '<path d="M12 5v14M6 13l6 6 6-6"/>', file: '<path d="M6 3h8l4 4v14H6zM14 3v4h4"/>', save: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>', open: '<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>', undo: '<path d="M9 7L4 12l5 5M4 12h11a5 5 0 010 10h-2"/>' };
const xi = k => `<svg class="xfi" viewBox="0 0 24 24" aria-hidden="true">${XI[k]}</svg>`;
const xfInfo = d => `<b>Lv ${MK.fmt(d.lv)}</b><span>${MK.fmt(d.money)} €</span><span>${MK.fmt(d.dia)} 💎</span>`;
const xfDate = t => t ? new Date(t).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
function paneSave() {
  const T = MK.Transfer, on = T.online(), bak = T.backup();
  let h = `<h3 class="sh">Spielstand übertragen</h3>`;
  if (XF.confirm) { const a = T.describeNow(), b = T.describe(XF.confirm.d);
    return h + `<div class="xf-card xf-warn"><b class="xf-t">Dein aktueller Stand wird ersetzt</b>
      <div class="xf-cmp"><div><small>Jetzt hier</small>${xfInfo(a)}</div><div class="xf-arrow" aria-hidden="true">→</div><div><small>Neu${b.when ? ' · ' + xfDate(b.when) : ''}</small>${xfInfo(b)}</div></div>
      <p class="hint">Der jetzige Stand bleibt als Sicherung erhalten.</p>
      <div class="xf-row"><button class="btn ok" id="xfYes">Ersetzen</button><button class="btn xf-ghost" id="xfNo">Abbrechen</button></div></div>`; }
  h += `<div class="xf-row xf-modes"><button class="xf-mode" data-xm="send" aria-pressed="${XF.mode === 'send'}">${xi('up')}<span>Senden</span></button><button class="xf-mode" data-xm="recv" aria-pressed="${XF.mode === 'recv'}">${xi('down')}<span>Empfangen</span></button></div>`;
  if (XF.mode && !on) h += `<div class="xf-card"><p class="hint">Online-Übertragung ist noch nicht eingerichtet. Nimm solange die Datei (unten).</p></div>`;
  else if (XF.mode === 'send') {
    if (XF.busy) h += `<div class="xf-card"><p class="hint">Wird hochgeladen …</p></div>`;
    else if (XF.code && Date.now() < XF.until) h += `<div class="xf-card"><small class="xf-l">Dein Code</small><div class="xf-code" aria-label="Code ${XF.code.split('').join(' ')}">${XF.code.slice(0, 3)}<i></i>${XF.code.slice(3)}</div>
      <p class="hint">Auf dem anderen Gerät: <b>Optionen → Spielstand → Empfangen</b>. Gültig noch <b id="xfLeft"></b>, einmal einlösbar.</p><button class="btn alt wide" id="xfNew">Neuen Code</button></div>`;
    else h += `<div class="xf-card"><p class="hint">${XF.code ? 'Der Code ist abgelaufen.' : 'Erzeugt einen kurzen Code für das andere Gerät.'}</p><button class="btn wide" id="xfNew">Code erzeugen</button></div>`;
  } else if (XF.mode === 'recv') h += `<div class="xf-card"><label class="xf-l" for="xfIn">Code vom anderen Gerät</label>
      <form id="xfForm" class="xf-row"><input id="xfIn" class="xf-in" maxlength="7" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABC123" value="${esc(XF.inp)}"><button class="btn ok" type="submit" ${XF.busy ? 'disabled' : ''}>${XF.busy ? '…' : 'Laden'}</button></form></div>`;
  if (XF.err) h += `<p class="xf-err" role="alert">${esc(XF.err)}</p>`;
  h += `<h3 class="sh">Ohne Internet</h3><div class="xf-row"><button class="btn alt" id="xfDl">${xi('save')}Als Datei speichern</button><button class="btn alt" id="xfUp">${xi('open')}Datei laden</button></div>
    <input type="file" id="xfFile" accept=".json,application/json,text/plain" hidden>`;
  if (bak) h += `<h3 class="sh">Sicherung</h3><div class="xf-card xf-bak"><div><small>Vorheriger Stand · ${xfDate(bak.t)}</small><div class="xf-inf">${xfInfo(bak.info)}</div></div><button class="btn xf-ghost" id="xfRestore">${xi('undo')}Zurückholen</button></div>`;
  h += `<details class="xf-old"><summary>Langer Code (alt)</summary><textarea id="exp" readonly rows="3"></textarea><button class="btn wide" id="cpy">Code kopieren</button>
    <textarea id="imp" rows="3" placeholder="Code hier einfügen" aria-label="Code einfügen"></textarea><button class="btn alt wide" id="impBtn">Spielstand laden</button></details>`;
  return h;
}
let xfTimer = 0;
function bindSave(P) {
  const T = MK.Transfer, re = () => paneOpt(P);
  const ask = (text, src) => { try { XF.confirm = { d: T.parse(text), text, src }; XF.err = ''; } catch (e) { XF.err = 'Das ist kein gültiger Spielstand.'; } re(); };
  P.querySelectorAll('[data-xm]').forEach(b => b.onclick = () => { XF.mode = XF.mode === b.dataset.xm ? null : b.dataset.xm; XF.err = ''; re(); if (XF.mode === 'recv') setTimeout(() => { const i = $('xfIn'); if (i) i.focus(); }, 30); });
  const nw = $('xfNew'); if (nw) nw.onclick = () => { XF.busy = true; XF.err = ''; re();
    T.send().then(r => { XF.code = r.code; XF.until = r.until; MK.Audio.play('pop'); }, e => { XF.err = 'Senden hat nicht geklappt. Internet an?'; console.warn(e); }).finally(() => { XF.busy = false; if (P.isConnected) re(); }); };
  const f = $('xfForm'); if (f) { const i = $('xfIn'); i.oninput = () => { const v = T.cleanCode(i.value); XF.inp = v; if (i.value !== v) i.value = v; };
    f.onsubmit = e => { e.preventDefault(); const code = T.cleanCode(i.value); if (code.length !== 6) { XF.err = 'Der Code hat 6 Zeichen.'; re(); return; }
      XF.busy = true; XF.err = ''; re();
      T.fetch(code).then(d => { if (!d) { XF.err = 'Code falsch oder abgelaufen (15 Minuten, nur einmal).'; return; } XF.inp = ''; ask(d, 'code'); }, e => { XF.err = 'Laden hat nicht geklappt. Internet an?'; console.warn(e); })
        .finally(() => { XF.busy = false; if (P.isConnected) re(); }); }; }
  const y = $('xfYes'); if (y) y.onclick = () => { try { T.apply(XF.confirm.text); XF.confirm = null; XF.mode = null; MK.Audio.play('level'); U.toast('Spielstand geladen – weiter geht’s!', 'big'); MK.Scene.buildCrowd(); U.training(); U.refresh(); } catch (e) { XF.confirm = null; XF.err = 'Das ist kein gültiger Spielstand.'; re(); } };
  const n = $('xfNo'); if (n) n.onclick = () => { XF.confirm = null; re(); };
  $('xfDl') && ($('xfDl').onclick = () => { const name = T.download(); U.toast('Gespeichert: ' + name); });
  const fi = $('xfFile'); $('xfUp') && ($('xfUp').onclick = () => fi.click());
  if (fi) fi.onchange = () => { const file = fi.files && fi.files[0]; if (!file) return; T.readFile(file).then(t => ask(t, 'file'), () => { XF.err = 'Datei konnte nicht gelesen werden.'; re(); }); };
  let armed = false; const rs = $('xfRestore'); if (rs) rs.onclick = () => { if (!armed) { armed = true; rs.lastChild.textContent = 'Sicher? Nochmal tippen'; setTimeout(() => { armed = false; if (rs.isConnected) rs.lastChild.textContent = 'Zurückholen'; }, 4000); return; }
    if (T.restore()) { U.toast('Vorheriger Stand ist zurück', 'big'); MK.Scene.buildCrowd(); U.training(); U.refresh(); } };
  // langer Code (alt)
  const ex = $('exp'); if (ex) { P.querySelector('.xf-old').addEventListener('toggle', () => { ex.value = MK.exportSave(); }, { once: true });
    $('cpy').onclick = () => { ex.value = ex.value || MK.exportSave(); const ok = () => U.toast('Kopiert'); try { navigator.clipboard.writeText(ex.value).then(ok, () => { ex.select(); U.toast('Markiert – jetzt kopieren'); }); } catch (e) { ex.select(); U.toast('Markiert – jetzt kopieren'); } };
    $('impBtn').onclick = () => ask($('imp').value, 'long'); }
  // Restzeit des Codes
  clearInterval(xfTimer); const left = $('xfLeft');
  if (left) { const tick = () => { const s = Math.max(0, Math.round((XF.until - Date.now()) / 1000)); if (!left.isConnected) { clearInterval(xfTimer); return; } if (!s) { clearInterval(xfTimer); re(); return; } left.textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') + ' min'; }; tick(); xfTimer = setInterval(tick, 1000); }
}

/* Graphen: Gesamt-Level der letzten Stunden, Wiederholungen pro Tag, Muskel-Balance */
function charts() {
  const S = MK.S, H = S.hist, W = 320, Hh = 120;
  let out = '<div class="charts">';
  const mins = H.mins.slice(-180); if (mins.length > 1) { const t0 = mins[0][0], t1 = mins[mins.length - 1][0], l0 = Math.min(...mins.map(m => m[1])), l1 = Math.max(...mins.map(m => m[1]), l0 + 1);
    const X = t => 30 + (t - t0) / Math.max(1, t1 - t0) * (W - 40), Y = l => Hh - 22 - (l - l0) / (l1 - l0) * (Hh - 36);
    out += `<figure><figcaption>Gesamt-Level (letzte ${Math.max(1, Math.round((t1 - t0) / 60000))} min)</figcaption><svg viewBox="0 0 ${W} ${Hh}"><line x1="30" y1="${Hh - 22}" x2="${W - 8}" y2="${Hh - 22}" class="ax"/><text x="26" y="${Y(l1) + 4}" class="tk" text-anchor="end">${l1}</text><text x="26" y="${Hh - 18}" class="tk" text-anchor="end">${l0}</text>
      <polyline points="${mins.map(m => X(m[0]).toFixed(1) + ',' + Y(m[1]).toFixed(1)).join(' ')}" class="ln"/></svg></figure>`; }
  else out += '<figure><figcaption>Gesamt-Level</figcaption><p class="hint">Füllt sich beim Spielen.</p></figure>';
  const days = []; for (let i = 13; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; days.push([d, (H.days[k] || {}).reps || 0]); }
  const mx = Math.max(1, ...days.map(d => d[1])), bw = (W - 40) / 14;
  out += `<figure><figcaption>Wiederholungen pro Tag (14 Tage)</figcaption><svg viewBox="0 0 ${W} ${Hh}"><line x1="30" y1="${Hh - 22}" x2="${W - 8}" y2="${Hh - 22}" class="ax"/><text x="26" y="20" class="tk" text-anchor="end">${MK.fmt(mx)}</text>
    ${days.map(([d, n], i) => `<rect x="${(32 + i * bw).toFixed(1)}" y="${(Hh - 22 - n / mx * (Hh - 40)).toFixed(1)}" width="${(bw - 4).toFixed(1)}" height="${(n / mx * (Hh - 40)).toFixed(1)}" rx="2" class="${i === 13 ? 'ctoday' : 'cbar'}"><title>${d.toLocaleDateString('de-DE')}: ${n}</title></rect>${i % 2 === 1 ? `<text x="${(32 + i * bw + bw / 2 - 2).toFixed(1)}" y="${Hh - 8}" class="tk" text-anchor="middle">${d.getDate()}.</text>` : ''}`).join('')}</svg></figure>`;
  const ms = MK.MUSCLES, cx = 160, cy = 118, R = 84, top = Math.max(2, ...ms.map(m => S.m[m.id].lv)), pt = (i, r) => { const a = -Math.PI / 2 + i * Math.PI * 2 / ms.length; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
  out += `<figure><figcaption>Muskel-Balance</figcaption><svg viewBox="0 0 320 236">${[.33, .66, 1].map(k => `<polygon points="${ms.map((m, i) => pt(i, R * k).map(v => v.toFixed(1)).join(',')).join(' ')}" class="grid"/>`).join('')}
    <polygon points="${ms.map((m, i) => pt(i, R * S.m[m.id].lv / top).map(v => v.toFixed(1)).join(',')).join(' ')}" class="area"/>${ms.map((m, i) => { const [x, y] = pt(i, R + 16); return `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" class="tk" text-anchor="middle">${m.name} ${S.m[m.id].lv}</text>`; }).join('')}</svg></figure>`;
  return out + '</div>';
}

/* ---------- Skillbaum ---------- */
const ICON = {
  stern: 'M12 2l3 7h7l-5.5 4.5 2 7.5-6.5-4.5L5.5 21l2-7.5L2 9h7z', hantel: 'M2 10h3v4H2zM5 8h3v8H5zM8 11h8v2H8zM16 8h3v8h-3zM19 10h3v4h-3z',
  ziel: 'M12 3a9 9 0 110 18 9 9 0 010-18zm0 4a5 5 0 100 10 5 5 0 000-10zm0 3a2 2 0 110 4 2 2 0 010-4z', blitz: 'M13 2L4 14h6l-2 8 10-13h-6z',
  faust: 'M7 9h10a2 2 0 012 2v5a5 5 0 01-5 5h-4a5 5 0 01-5-5v-5a2 2 0 012-2zm1-4h8v3H8z', uhr: 'M12 3a9 9 0 110 18 9 9 0 010-18zm-1 4v6l5 3 1-2-4-2V7z',
  krone: 'M3 18h18l-1-10-5 4-3-6-3 6-5-4z', herz: 'M12 21s-8-5-8-11a4.5 4.5 0 018-3 4.5 4.5 0 018 3c0 6-8 11-8 11z', tropfen: 'M12 2s7 8 7 13a7 7 0 01-14 0c0-5 7-13 7-13z',
  blatt: 'M5 19C5 9 11 4 20 4c0 9-5 15-15 15zm0 0l9-9', flamme: 'M12 2c1 4 6 6 6 12a6 6 0 01-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-4 0-6 1-9z',
  muenze: 'M12 3a9 9 0 110 18 9 9 0 010-18zm2.5 5.5A4 4 0 008 11h6v2H8a4 4 0 006.5 2.5', kamera: 'M4 7h4l2-2h4l2 2h4v12H4zm8 3a3.5 3.5 0 100 7 3.5 3.5 0 000-7z',
  auge: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zm10-3a3 3 0 100 6 3 3 0 000-6z', leute: 'M8 11a3 3 0 110-6 3 3 0 010 6zm8 0a3 3 0 110-6 3 3 0 010 6zM2 20c0-4 3-6 6-6s6 2 6 6zm10 0c0-2-1-4-2-5 1-.6 3-1 6-1 3 0 6 2 6 6z'
};
let skSel = null, view = null;
const SKS = 1; // Weltkoordinaten kommen direkt aus den Daten (Mittelpunkt = Start)
const BR = Object.fromEntries(MK.SKILL_BRANCHES.map(b => [b.id, b.name])); BR.bruecke = 'Brücke';
const bounds = () => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; const S = MK.S; MK.SKILLS.filter(n => S.skills.includes(n.id) || n.req.some(r => S.skills.includes(r))).forEach(n => { x0 = Math.min(x0, n.x); y0 = Math.min(y0, n.y); x1 = Math.max(x1, n.x); y1 = Math.max(y1, n.y); }); return { x0: x0 - 90, y0: y0 - 90, x1: x1 + 90, y1: y1 + 90 }; };
U.openSkills = function () {
  const box = $('skills'); box.hidden = false; skSel = skSel || (MK.SKILLS.find(n => MK.skillAvail(n.id)) || MK.SKILLS[1]).id;
  if (!view) { initMap(); }
  U.drawSkills(); fit(true); MK.Audio.play('whoosh'); if (!SKY.raf) SKY.raf = requestAnimationFrame(skyLoop);
};
function apply() { const tf = `translate(${view.x},${view.y}) scale(${view.k})`; $('skG').setAttribute('transform', tf); const f = $('skFx'); if (f) f.setAttribute('transform', tf); }
/* Weltall-Hintergrund: Sternenfeld, Nebel und Sternbilder aus dem Gym (Hantel, Kettlebell, Bizeps, Shaker), leicht funkelnd und mit Parallaxe */
const SKY = { cv: null, star: null, tw: [], raf: 0 };
function skyBuild(w, h) { const d = Math.min(2, devicePixelRatio || 1), cv = document.createElement('canvas'), Wd = Math.round(w * 1.6), Hd = Math.round(h * 1.6); cv.width = Wd * d; cv.height = Hd * d; const c = cv.getContext('2d'); c.scale(d, d);
  const r = MK.seedRand('sky2'); c.fillStyle = '#03030a'; c.fillRect(0, 0, Wd, Hd);
  // ferne, dezente Nebel
  [['#3b1a66', .32], ['#0d3a5a', .3], ['#5a1a4a', .2], ['#1a1a6e', .28], ['#2a1660', .25], ['#0c4a4a', .16]].forEach(([col, a]) => { const x = r() * Wd, y = r() * Hd, rr = (.12 + r() * .2) * Math.max(Wd, Hd), g = c.createRadialGradient(x, y, 0, x, y, rr); g.addColorStop(0, col + Math.round(a * 255).toString(16).padStart(2, '0')); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, Wd, Hd); });
  // Milchstraßen-Band aus winzigen Sternen
  for (let i = 0; i < Wd * Hd / 260; i++) { const u = r(), x = u * Wd, y = Hd * (.3 + u * .35) + (r() + r() + r() - 1.5) * Hd * .12; c.fillStyle = `rgba(200,210,255,${.15 + r() * .35})`; c.fillRect(Math.round(x * d) / d, Math.round(y * d) / d, 1 / d, 1 / d); }
  // knackscharfe Sterne: viele winzige Pixel, einige helle mit Kreuz-Zacken
  for (let i = 0; i < Wd * Hd / 380; i++) { const x = Math.round(r() * Wd * d) / d, y = Math.round(r() * Hd * d) / d, hue = [215, 45, 0, 270, 190][Math.floor(r() * 5)], s = r() < .85 ? 1 / d : r() < .7 ? 1 : 1.5; c.fillStyle = `hsla(${hue},70%,${85 + r() * 15}%,${.45 + r() * .55})`; c.fillRect(x, y, s, s); }
  for (let i = 0; i < Wd * Hd / 22000; i++) { const x = Math.round(r() * Wd) + .5, y = Math.round(r() * Hd) + .5, L = 3 + r() * 5, col = ['#ffffff', '#cfe0ff', '#ffe9c4', '#e4d4ff'][Math.floor(r() * 4)];
    c.fillStyle = col; c.fillRect(x - .75, y - .75, 1.5, 1.5); c.globalAlpha = .55; c.fillRect(x - L, y - .25, L * 2, .5); c.fillRect(x - .25, y - L, .5, L * 2); c.globalAlpha = 1; }
  // Fiktive Gym-Sternbilder (mit Augenzwinkern), klar verbunden und beschriftet
  const CONST = [
    { n: 'Große Hantel', p: [[0, 10], [0, 50], [16, 0], [16, 60], [16, 30], [104, 30], [104, 0], [104, 60], [120, 10], [120, 50]], l: [[0, 1], [0, 2], [1, 3], [2, 3], [4, 5], [6, 7], [6, 8], [7, 9], [8, 9]] },
    { n: 'Der Lauch', p: [[40, 120], [40, 60], [40, 40], [22, 0], [36, 4], [52, 2], [66, 10], [34, 120], [46, 120]], l: [[7, 8], [7, 1], [8, 1], [1, 2], [2, 3], [2, 4], [2, 5], [2, 6]] },
    { n: 'Bizeps Major', p: [[0, 90], [70, 92], [92, 70], [86, 40], [66, 24], [56, 0], [38, 4], [40, 30], [30, 54], [6, 62]], l: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 0]] },
    { n: 'Kleiner Shaker', p: [[12, 20], [48, 20], [44, 100], [16, 100], [8, 10], [52, 10], [34, 10], [42, -14]], l: [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [4, 0], [5, 1], [6, 7]] },
    { n: 'Kettlebell', p: [[30, 0], [58, 0], [74, 18], [14, 18], [2, 50], [14, 80], [44, 92], [74, 80], [86, 50]], l: [[0, 1], [1, 2], [0, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 2]] },
    { n: 'Cheat-Day-Pizza', p: [[0, 0], [100, 0], [50, 90], [30, 18], [64, 22], [48, 50]], l: [[0, 1], [1, 2], [2, 0]], dots: [3, 4, 5] },
    { n: 'Der Pumper', p: [[50, 18], [50, 70], [20, 44], [8, 14], [80, 44], [92, 14], [34, 116], [66, 116], [50, 4]], l: [[8, 0], [0, 1], [0, 2], [2, 3], [0, 4], [4, 5], [1, 6], [1, 7]], head: 8 },
    { n: 'Proteinriegel', p: [[0, 0], [120, 0], [120, 30], [0, 30], [24, 0], [96, 30]], l: [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5]] }
  ];
  const cols = 4, rows = 3, cells = []; for (let i = 0; i < cols * rows; i++) cells.push(i); for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [cells[i], cells[j]] = [cells[j], cells[i]]; }
  c.font = '700 11px system-ui, Arial'; c.textAlign = 'center';
  for (let k = 0; k < CONST.length; k++) { const C = CONST[k], cell = cells[k], cx = (cell % cols + .25 + r() * .4) * Wd / cols, cy = (Math.floor(cell / cols) + .25 + r() * .4) * Hd / rows, sc = 1.2 + r() * .4, ang = (r() - .5) * .5;
    const xs = C.p.map(q => q[0]), ys = C.p.map(q => q[1]), mx = (Math.min(...xs) + Math.max(...xs)) / 2, my = (Math.min(...ys) + Math.max(...ys)) / 2;
    const P2 = C.p.map(([x, y]) => { x -= mx; y -= my; return [cx + (x * Math.cos(ang) - y * Math.sin(ang)) * sc, cy + (x * Math.sin(ang) + y * Math.cos(ang)) * sc]; });
    c.strokeStyle = 'rgba(160,185,255,.55)'; c.lineWidth = 1.2; C.l.forEach(([a, b]) => { c.beginPath(); c.moveTo(P2[a][0], P2[a][1]); c.lineTo(P2[b][0], P2[b][1]); c.stroke(); });
    if (C.head != null) { c.beginPath(); c.arc(P2[C.head][0], P2[C.head][1] + 4 * sc, 9 * sc, 0, Math.PI * 2); c.stroke(); }
    P2.forEach(([x, y], i) => { const big = i % 3 === 0, g = c.createRadialGradient(x, y, 0, x, y, big ? 5 : 3.5); g.addColorStop(0, 'rgba(190,210,255,.55)'); g.addColorStop(1, 'rgba(160,190,255,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, big ? 5 : 3.5, 0, Math.PI * 2); c.fill(); c.fillStyle = (C.dots || []).includes(i) ? '#ffb38a' : '#ffffff'; c.beginPath(); c.arc(x, y, big ? 1.7 : 1.2, 0, Math.PI * 2); c.fill(); });
    const by = Math.max(...P2.map(q => q[1])); c.fillStyle = 'rgba(185,205,255,.7)'; c.fillText(C.n.toUpperCase().split('').join(' '), cx, by + 16); }
  SKY.star = cv; SKY.W = Wd; SKY.H = Hd; SKY.tw = Array.from({ length: 90 }, () => ({ x: r() * Wd, y: r() * Hd, s: .6 + r() * .9, p: r() * 6, f: .4 + r() * 1.6 })); }
function skyLoop() { const box = $('skills'), cv = $('skBg'); if (box.hidden) { SKY.raf = 0; return; }
  const w = cv.clientWidth, h = cv.clientHeight, d = Math.min(2, devicePixelRatio || 1); if (cv.width !== Math.round(w * d) || cv.height !== Math.round(h * d)) { cv.width = Math.round(w * d); cv.height = Math.round(h * d); }
  if (!SKY.star || SKY.W < w * 1.5 || SKY.H < h * 1.5) skyBuild(w, h);
  const c = cv.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0); c.imageSmoothingEnabled = false; const px = Math.round(view ? ((view.x * .05) % (SKY.W - w) + (SKY.W - w)) % (SKY.W - w) : 0), py = Math.round(view ? ((view.y * .05) % (SKY.H - h) + (SKY.H - h)) % (SKY.H - h) : 0);
  c.drawImage(SKY.star, px * d, py * d, w * d, h * d, 0, 0, w, h);
  const t = performance.now() / 1000; SKY.tw.forEach(s => { const x = Math.round(s.x - px) + .5, y = Math.round(s.y - py) + .5; if (x < 0 || y < 0 || x > w || y > h) return; const a = .5 + .5 * Math.sin(t * s.f + s.p); c.fillStyle = `rgba(255,255,255,${.3 + a * .7})`; c.fillRect(x - s.s / 2, y - s.s / 2, s.s, s.s); if (a > .8) { const L = s.s * 4 * (a - .8) * 5; c.globalAlpha = (a - .8) * 4; c.fillRect(x - L, y - .25, L * 2, .5); c.fillRect(x - .25, y - L, .5, L * 2); c.globalAlpha = 1; } });
  SKY.raf = requestAnimationFrame(skyLoop); }
/* Astral-Chronos: lila-blauer Puls, Uhr-Ring tickt in 12 Schritten, Sternenbahn dreht gegenläufig, ein Trabant kreist */
function chronos(x, y, r, seed) { const r1 = r + 12, r2 = r + 24, c1 = 2 * Math.PI * r1, tick = c1 / 12, d = 10 + (Math.abs(seed) % 5), steps = Array.from({ length: 13 }, (_, i) => `${i * 30} ${x} ${y}`).join(';');
  return `<circle class="halo" cx="${x}" cy="${y}" r="${r + 8}"><animate attributeName="opacity" values=".25;.7;.25" dur="4.5s" repeatCount="indefinite"/></circle>`
    + `<circle class="tick" cx="${x}" cy="${y}" r="${r1}" stroke-dasharray="2.5 ${(tick - 2.5).toFixed(2)}"><animateTransform attributeName="transform" type="rotate" values="${steps}" calcMode="discrete" dur="12s" repeatCount="indefinite"/></circle>`
    + `<circle class="orb" cx="${x}" cy="${y}" r="${r2}"><animateTransform attributeName="transform" type="rotate" from="360 ${x} ${y}" to="0 ${x} ${y}" dur="${d * 4}s" repeatCount="indefinite"/></circle>`
    + `<g><animateTransform attributeName="transform" type="rotate" from="0 ${x} ${y}" to="360 ${x} ${y}" dur="${d}s" repeatCount="indefinite"/><circle class="sat" cx="${x + r2}" cy="${y}" r="3.5"/><circle class="sat2" cx="${x - r2}" cy="${y}" r="2"/></g>`; }
function nextSkill(n) { const S = MK.S, d = q => Math.hypot(q.x - n.x, q.y - n.y), open = q => !S.skills.includes(q.id) && MK.skillReachable(q.id);
  const kids = MK.SKILLS.filter(q => q.req.includes(n.id) && open(q)), same = kids.filter(q => q.br === n.br);
  const pick = arr => arr.sort((a, b) => (MK.skillAvail(b.id) - MK.skillAvail(a.id)) || d(a) - d(b))[0];
  return pick(same.length ? same : kids) || pick(MK.SKILLS.filter(q => q.br === n.br && open(q))) || null; }
function panTo(q) { const r = $('skSvg').getBoundingClientRect(), tx = r.width / 2 - q.x * view.k, ty = (r.height - 150) / 2 - q.y * view.k + 50, x0 = view.x, y0 = view.y, t0 = performance.now();
  const step = now => { const f = Math.min(1, (now - t0) / 350), e = 1 - Math.pow(1 - f, 3); view.x = x0 + (tx - x0) * e; view.y = y0 + (ty - y0) * e; apply(); if (f < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }
function fit(focus) { const r = $('skSvg').getBoundingClientRect(), B = bounds();
  if (focus) { const n = MK.SKILLS.find(x => x.id === skSel) || MK.SKILLS[0]; view.k = r.width < 700 ? .3 : .38; view.x = r.width / 2 - n.x * view.k; view.y = (r.height - 150) / 2 - n.y * view.k + 50; }
  else { view.k = Math.max(.08, Math.min(r.width / (B.x1 - B.x0), (r.height - 170) / (B.y1 - B.y0))); view.x = r.width / 2 - (B.x0 + B.x1) / 2 * view.k; view.y = 65 + (r.height - 170) / 2 - (B.y0 + B.y1) / 2 * view.k; }
  apply(); }
function zoomAt(f, cx, cy) { const k2 = Math.max(.08, Math.min(2.5, view.k * f)); f = k2 / view.k; view.x = cx - (cx - view.x) * f; view.y = cy - (cy - view.y) * f; view.k = k2; apply(); }
function initMap() {
  view = { x: 0, y: 0, k: 1 };
  const svg = $('skSvg'), pts = new Map(); let moved = 0, pinch = null, downNode = null;
  const pos = e => { const r = svg.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  svg.addEventListener('pointerdown', e => { svg.setPointerCapture(e.pointerId); pts.set(e.pointerId, pos(e)); moved = 0; downNode = e.target.closest ? e.target.closest('[data-sk]') : null;
    if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) }; } svg.classList.add('drag'); });
  svg.addEventListener('pointermove', e => { if (!pts.has(e.pointerId)) return; const p = pos(e), o = pts.get(e.pointerId);
    if (pts.size === 1) { view.x += p.x - o.x; view.y += p.y - o.y; moved += Math.abs(p.x - o.x) + Math.abs(p.y - o.y); apply(); }
    pts.set(e.pointerId, p);
    if (pts.size === 2 && pinch) { const [a, b] = [...pts.values()], d = Math.hypot(a.x - b.x, a.y - b.y); zoomAt(d / pinch.d, (a.x + b.x) / 2, (a.y + b.y) / 2); pinch.d = d; moved = 99; } });
  const up = e => { if (!pts.has(e.pointerId)) return; pts.delete(e.pointerId); if (pts.size < 2) pinch = null;
    if (!pts.size) { svg.classList.remove('drag'); if (moved < 8 && downNode) { skSel = downNode.dataset.sk; U.drawSkills(); MK.Audio.play('tap'); } downNode = null; } };
  svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
  svg.addEventListener('wheel', e => { e.preventDefault(); const p = pos(e); zoomAt(Math.exp(-e.deltaY * .0015), p.x, p.y); }, { passive: false });
  $('skIn').onclick = () => { const r = svg.getBoundingClientRect(); zoomAt(1.3, r.width / 2, r.height / 2); };
  $('skOut').onclick = () => { const r = svg.getBoundingClientRect(); zoomAt(1 / 1.3, r.width / 2, r.height / 2); };
  $('skFit').onclick = () => fit(false);
  addEventListener('resize', () => { if (!$('skills').hidden) fit(); });
  addEventListener('keydown', e => { if ($('skills').hidden) return; if (e.key === '+' || e.key === '=') $('skIn').onclick(); if (e.key === '-') $('skOut').onclick(); });
}
U.drawSkills = function () {
  const S = MK.S, g = $('skG'), X = n => n.x * SKS, Y = n => n.y * SKS;
  // Stück für Stück: sichtbar ist nur, was du hast, und der jeweils nächste Skill daneben
  const vis = n => S.skills.includes(n.id) || n.req.some(r => S.skills.includes(r));
  { const cur = MK.SKILLS.find(x => x.id === skSel); if (!cur || !vis(cur)) skSel = 'start'; }
  let h = '';
  MK.SKILLS.forEach(n => n.req.forEach(r => { const p = MK.SKILLS.find(x => x.id === r); if (!vis(n) || !vis(p)) return; const on = S.skills.includes(n.id) && S.skills.includes(r), av = S.skills.includes(r);
    h += `<line x1="${X(p)}" y1="${Y(p)}" x2="${X(n)}" y2="${Y(n)}" class="ln ${on ? 'on' : av ? 'av' : ''}"/>`; }));
  MK.SKILL_BRANCHES.forEach((B, i) => { const th = -Math.PI / 2 + i * Math.PI * 2 / MK.SKILL_BRANCHES.length, own = MK.SKILLS.filter(n => n.br === B.id && S.skills.includes(n.id)).length;
    const deg = th * 180 / Math.PI, flip = Math.cos(th) < -0.01, rot = flip ? deg + 180 : deg, ri = 168, ro = 2190;
    h += `<text transform="translate(${Math.cos(th) * ri},${Math.sin(th) * ri}) rotate(${rot})" y="6" class="bri">${B.name.toUpperCase()}</text>`;
    h += `<text x="${Math.cos(th) * ro}" y="${Math.sin(th) * ro + 14}" class="br">${B.name.toUpperCase()}</text><text x="${Math.cos(th) * ro}" y="${Math.sin(th) * ro + 46}" class="nm">${own} / ${MK.SKILLS.filter(n => n.br === B.id).length} Skills</text>`; });
  MK.SKILLS.forEach(n => { if (!vis(n)) return; const got = S.skills.includes(n.id), av = MK.skillAvail(n.id), ml = MK.skillMinLv(n.id), cls = got ? 'got' : av ? 'av' : 'lock', r = n.id === 'start' ? 56 : n.key ? 48 : 38;
    if (!got && ml > MK.totalLv()) h += `<text x="${X(n)}" y="${Y(n) - r - 10}" class="nm lvreq">ab Lv ${ml}</text>`;
    const sp = n.key || n.br === 'bruecke' || n.id === 'start'; // besondere Stufen mit Titel: spektral schimmernd und animiert
    h += `<g class="node ${cls} ${sp ? 'spec' : ''} ${skSel === n.id ? 'sel' : ''}" data-sk="${n.id}">${sp ? chronos(X(n), Y(n), r, n.x) : ''}<circle class="core" cx="${X(n)}" cy="${Y(n)}" r="${r}"/><path d="${ICON[n.icon] || ICON.stern}" transform="translate(${X(n) - 24},${Y(n) - 24}) scale(2)"/></g>
      <text x="${X(n)}" y="${Y(n) + r + (sp ? 34 : 22)}" class="nm ${got ? 'got' : ''} ${sp ? 'spec' : ''}">${esc(n.name)}</text>`; });
  g.innerHTML = h;
  $('skPts').textContent = S.sp; { const t = $('skTl'); if (t) t.textContent = MK.totalLv(); }
  const n = MK.SKILLS.find(x => x.id === skSel), got = S.skills.includes(n.id), av = MK.skillAvail(n.id), ml = MK.skillMinLv(n.id), lvOk = MK.totalLv() >= ml;
  $('skInfo').innerHTML = `${n.br ? `<span class="br2">${BR[n.br].toUpperCase()}</span>` : ''}<h4>${n.name}</h4><p>${n.desc}</p>
    ${got ? '<span class="acq">ERWORBEN</span>' : (() => { const con = MK.skillReachable(n.id), spOk = S.sp >= n.cost, it = (ok, t) => `<li class="${ok ? 'ok' : 'no'}">${ok ? '✓' : '✗'} ${t}</li>`;
      return `<ul class="skreq">${it(con, 'Neben einem freien Skill')}${it(lvOk, `Gesamt-Level ${ml} (du: ${MK.totalLv()})`)}${it(spOk, `${n.cost} SP (du: ${S.sp})`)}</ul>
      <button class="btn ok" id="skBuy" ${av && spOk ? '' : 'disabled'}>${av && spOk ? 'Freischalten' : 'Noch gesperrt'}</button>`; })()}`;
  const b = $('skBuy'); if (b) b.onclick = () => { if (MK.buySkill(n.id)) { MK.dirty(); MK.Audio.play('pop'); // keine Meldung über dem Knopf – die Energie im Baum zeigt den Kauf
      // direkt zum nächsten Punkt im selben Strang springen, damit man durchkaufen kann
      const nx = nextSkill(n); if (nx) { skSel = nx.id; panTo(nx); } U.drawSkills(); skFlow(n); // sofort weiter: nächster Skill ist direkt gewählt, die Energie läuft nebenher
      U.quick(); MK.save(); } };
};

/* Energie fließt lila glitzernd vom Vorgänger in den neuen Skill – eigene Ebene, blockiert nichts */
const FLOWS = []; let flowRaf = 0;
function skFlow(n) { const X = q => q.x * SKS, Y = q => q.y * SKS, r = n.id === 'start' ? 56 : n.key ? 48 : 38, now = performance.now();
  n.req.forEach(id => { const p = MK.SKILLS.find(x => x.id === id); if (p) FLOWS.push({ x1: X(p), y1: Y(p), x2: X(n), y2: Y(n), r, t0: now, g: [] }); });
  setTimeout(() => MK.Audio.play('level'), 380); if (!flowRaf) flowRaf = requestAnimationFrame(flowLoop); }
const star4p = (x, y, s) => `M${x},${y - s * 2}L${x + s * .4},${y - s * .4}L${x + s * 2},${y}L${x + s * .4},${y + s * .4}L${x},${y + s * 2}L${x - s * .4},${y + s * .4}L${x - s * 2},${y}L${x - s * .4},${y - s * .4}Z`;
function flowLoop(now) { const fx = $('skFx'); if (!fx || $('skills').hidden) { FLOWS.length = 0; if (fx) fx.innerHTML = ''; flowRaf = 0; return; }
  let h = '';
  for (let i = FLOWS.length - 1; i >= 0; i--) { const F = FLOWS[i], a = (now - F.t0) / 1000, u = Math.min(1, a / .42), e = 1 - Math.pow(1 - u, 3), hx = F.x1 + (F.x2 - F.x1) * e, hy = F.y1 + (F.y2 - F.y1) * e;
    const fade = a < .42 ? 1 : Math.max(0, 1 - (a - .42) / .6);
    if (a < 1.2) for (let k = 0; k < 3; k++) { const v = Math.random() * e, nx = -(F.y2 - F.y1), ny = F.x2 - F.x1, nl = Math.hypot(nx, ny) || 1, off = (Math.random() - .5) * 30; F.g.push({ x: F.x1 + (F.x2 - F.x1) * v + nx / nl * off, y: F.y1 + (F.y2 - F.y1) * v + ny / nl * off, s: 3 + Math.random() * 5, t0: now, l: .45 + Math.random() * .4 }); }
    if (fade > 0) h += `<line class="fl" x1="${F.x1}" y1="${F.y1}" x2="${hx}" y2="${hy}" opacity="${fade}"/><line class="fc" x1="${F.x1}" y1="${F.y1}" x2="${hx}" y2="${hy}" opacity="${fade * (.6 + Math.sin(now / 40) * .4)}"/>`;
    if (a < .5) h += `<circle class="hd" cx="${hx}" cy="${hy}" r="${15 + Math.sin(now / 50) * 3}"/>`;
    if (a > .38 && a < 1.15) { const b = (a - .38) / .77; h += `<circle class="ha" cx="${F.x2}" cy="${F.y2}" r="${F.r * 1.2}" opacity="${Math.sin(b * Math.PI)}"/><circle class="bu" cx="${F.x2}" cy="${F.y2}" r="${F.r * (1 + b * 1.6)}" opacity="${1 - b}"/>`; }
    F.g = F.g.filter(q => (now - q.t0) / 1000 < q.l); F.g.forEach(q => { const k = (now - q.t0) / 1000 / q.l, tw = .5 + .5 * Math.sin(now / 35 + q.x); h += `<path class="gl" d="${star4p(q.x, q.y, q.s * (1 - k * .6))}" opacity="${(1 - k) * tw}"/>`; });
    if (a > 1.2 && !F.g.length) FLOWS.splice(i, 1); }
  fx.innerHTML = h; flowRaf = FLOWS.length ? requestAnimationFrame(flowLoop) : 0; if (!FLOWS.length) fx.innerHTML = ''; }
/* ---------- Skillpunkt-Meldung ---------- */
U.spPop = function (n) { // kleine Karte am Rand statt Fenster über dem ganzen Bild
  const box = $('spPop'); const tot = MK.S.sp; box.hidden = false; box.className = 'spcard'; box.classList.remove('out');
  { const rv = $('rivalB'); box.style.top = rv && !rv.hidden ? (rv.offsetTop + rv.offsetHeight + 6) + 'px' : ''; } // unter der Duell-Karte, nicht drüber
  box.innerHTML = `<div class="sp-ic"><i></i><b>${tot}</b></div><div class="sp-txt"><small>${n > 1 ? n + ' neue Skillpunkte' : 'Neuer Skillpunkt'}</small><b>Skillbaum wartet</b><div class="rv-act"><button class="btn ok sm" id="spGo">Öffnen</button><button class="ghost sm" id="spLater">Später</button></div></div><i class="rv-time"></i>`;
  const close = () => { box.classList.add('out'); setTimeout(() => { box.hidden = true; box.classList.remove('out'); }, 300); };
  $('spGo').onclick = () => { box.hidden = true; U.openSkills(); }; $('spLater').onclick = close;
  clearTimeout(box._t); box._t = setTimeout(() => { if (!box.hidden) close(); }, 9000); MK.Audio.play('pop');
};


/* ---------- Tutorial ---------- */
const TUT = [
  { t: 'Moin, ich bin Günther. Tipp auf dich – mach fünf Wiederholungen.', wait: 'reps5' },
  { t: 'Schnell tippen füllt den Pump: mehr XP und Geld. Voll = Beast-Modus.' },
  { t: 'Unten wählst du Muskel, Übung und Gewicht. Mehr Muskelgruppen öffnen sich mit deinem Gesamt-Level.' },
  { t: 'Alles Weitere – Laden, Duelle, Imperium – schaltet sich nach und nach frei. Ich sag dir Bescheid. Und jetzt: pumpen, Junge!' }
];
U.tutorial = function () { const b = $('tut'); if (b) b.hidden = true; }; U._oldTutorial = function () {
  const S = MK.S, box = $('tut');
  if (S.tut >= TUT.length) { box.hidden = true; return; }
  const st = TUT[S.tut]; box.hidden = false;
  box.innerHTML = `<div class="tt"><b>Hausmeister Günther</b><p>${st.t}</p></div><div class="tb">${st.wait ? '' : `<button class="btn ok" id="tutNext">${S.tut === TUT.length - 1 ? 'Los geht’s' : 'Weiter'}</button>`}<button class="ghost" id="tutSkip">Überspringen</button></div>`;
  const n = $('tutNext'); if (n) n.onclick = () => { S.tut++; U.tutorial(); MK.save(); };
  $('tutSkip').onclick = () => { S.tut = TUT.length; U.tutorial(); MK.save(); };
};
U.tutEvent = function () {}; U._oldTutEvent = function (k) { const S = MK.S; if (S.tut >= TUT.length) return; const st = TUT[S.tut]; if (st.wait === k) { S.tut++; U.tutorial(); MK.save(); } };

/* ---------- Karten: Meme, Offline, Rivale ---------- */
U.meme = function (kind, cap, fame) {
  const img = MK.Scene.snapshot(), box = $('meme');
  box.hidden = false; box.className = 'meme ' + kind;
  const likes = MK.fmt(Math.round((kind === 'viral' ? 20000 : 800) * (1 + Math.random() * 4)));
  box.innerHTML = `<div class="mhead"><span class="av"></span><b>${kind === 'viral' ? '@gymtok' : '@lauch_memes'}</b><small>${kind === 'viral' ? 'geht gerade viral' : 'neues Meme über dich'}</small></div>
    <div class="mimg">${img ? `<img src="${img}" alt="">` : ''}<span class="top">${esc(cap[0])}</span><span class="bot">${esc(cap[1])}</span></div>
    <div class="mfoot">♥ ${likes} · +${MK.fmt1(fame)} Ruhm</div>`;
  clearTimeout(U._memeT); U._memeT = setTimeout(() => { box.hidden = true; }, 5200);
  box.onclick = () => { box.hidden = true; };
};
/* ---------- Duell-Intro: geteiltes Bild, beide Figuren, VS knallt rein ---------- */
U.vsIntro = function (c) {
  if (!c || (MK.S.set && MK.S.set.reduce)) return; const view = $('view'); let el = $('vsIntro'); if (el) el.remove();
  el = document.createElement('div'); el.id = 'vsIntro';
  const fig = (o, key, flip) => { const cv = document.createElement('canvas'); cv.width = 300; cv.height = 520; const x = cv.getContext('2d');
    try { const D = MK.Fig.dims(o.lv, o.posture || 0, 0); MK.Fig.render(x, 150, 510, 1.45, Object.assign({}, o, { key, pose: MK.Fig.poses.flex(0, 0, D), breath: 0, dpr: 1, reuse: false, glow: 0 })); } catch (e) { }
    if (flip) cv.style.transform = 'scaleX(-1)'; return cv; };
  const L = document.createElement('div'); L.className = 'side l'; L.appendChild(fig(c.me, 'vsP')); L.insertAdjacentHTML('beforeend', '<div class="nm">Du</div>');
  const R = document.createElement('div'); R.className = 'side r'; R.appendChild(fig(c.opp, 'vsO', true)); R.insertAdjacentHTML('beforeend', `<div class="nm">${esc(c.oppName)}</div>`);
  el.appendChild(L); el.appendChild(R); el.insertAdjacentHTML('beforeend', `<div class="vs">VS</div><div class="disc">${esc(c.d.name)}</div>`);
  view.appendChild(el); c.introUntil = performance.now() + 1500;
  MK.Audio.play('whoosh'); setTimeout(() => { MK.Audio.play('stamp'); MK.Scene.fx.shake = 7; }, 380);
  setTimeout(() => { if (el.isConnected) el.remove(); }, 2250);
};
/* ---------- Rückkehr-Szene: Figur pumpt sich auf, Zahlen zählen hoch, „Einsammeln“ ---------- */
U.offline = function (r) {
  if (!r) return; const S = MK.S, box = $('offl'), m = Math.round(r.dt / 60), Sc = MK.Scene, F = MK.Fx;
  const rows = [];
  if (r.xp) rows.push({ k: 'pw', t: `💪 Power – Trainer lief mit ${Math.round(r.pct * 100)} %`, from: 0, to: r.after.power - r.before.power, fmt: MK.fmtS, pre: '+' });
  if (r.xp && r.lvTo > r.before.lvl) rows.push({ t: `${MK.MUSCLES.find(x => x.id === r.g).name}: Level`, from: r.before.lvl, to: r.lvTo, fmt: v => Math.floor(v), pre: '', lv: true });
  if (r.reps) rows.push({ t: 'Wiederholungen vom Trainer', from: 0, to: r.reps, fmt: v => MK.fmtS(Math.floor(v)), pre: '+' });
  if (r.biz) rows.push({ t: 'Imperium', from: 0, to: r.biz, fmt: v => MK.fmtS(v) + ' €', pre: '+' });
  if (r.dia) rows.push({ t: 'Sponsor', from: 0, to: r.dia, fmt: v => Math.floor(v) + ' 💎', pre: '+' });
  (r.tech || []).forEach(tc => rows.push({ t: `Technik ${MK.techName(tc.lv - 1)}: ${tc.ex.name}`, from: 0, to: 2, fmt: v => '×' + Math.round(v), pre: '' }));
  if (r.rival) rows.push({ t: `${MK.RIVAL.name} hat trainiert`, from: 0, to: r.rival, fmt: v => MK.fmt1(v) + ' Level', pre: '+' });
  if (!rows.length) return;
  const grow = !!r.xp && Sc && Sc.vis;
  if (grow) Sc.vis.growHold = r.before.lv; // Figur sieht erst aus wie beim Verlassen
  F.hold.money = r.money0; if (r.xp) F.hold.power = r.before.power; F.snapCounters();
  box.className = 'back'; box.hidden = false;
  box.innerHTML = `<h4>Willkommen zurück!</h4><div class="osub">Du warst ${m >= 60 ? MK.fmt1(m / 60) + ' h' : m + ' min'} weg${r.xp ? ' – dein Trainer hat weitergemacht' : ''}</div>
    ${rows.map((x, i) => `<div class="orow ${x.k || ''}" style="--i:${i}"><span>${x.t}</span><b data-ocnt="${i}">${x.pre}${x.fmt(x.from)}</b></div>`).join('')}
    <button class="btn ok collect" id="offOk">Einsammeln</button>`;
  // Zahlen zählen hoch (weich abbremsend)
  const t0 = performance.now(), dur = 1300; let raf;
  const step = () => { const now = performance.now(); rows.forEach((x, i) => { const u = Math.min(1, Math.max(0, (now - t0 - 250 - i * 120) / dur)), e = 1 - Math.pow(1 - u, 3), el = box.querySelector(`[data-ocnt="${i}"]`); if (el) { const v = x.from + (x.to - x.from) * e, tx = x.lv ? `${x.from} → ${Math.floor(v)}` : x.pre + x.fmt(v); if (el._t !== tx) { el._t = tx; el.textContent = tx; } } });
    if (now - t0 < dur + 250 + rows.length * 120 + 50 && !box.hidden) raf = requestAnimationFrame(step); };
  raf = requestAnimationFrame(step);
  $('offOk').onclick = () => { MK.Audio.unlock(); cancelAnimationFrame(raf); MK.Audio.play('win');
    const ok = $('offOk'), a = F.at(ok);
    if (a) { F.burst(a.x, a.y, { gold: true, size: 1.4 }); // Münzen & Kugeln fliegen in die Anzeigen
      const nC = r.money0 != null && S.money > r.money0 ? 12 : 0; for (let i = 0; i < nC; i++) F.orb('coin', (S.money - r.money0) / nC, a.x + (Math.random() - .5) * 60, a.y - 10, { auto: true, force: true });
      if (r.xp) for (let i = 0; i < 14; i++) F.orb('xp', 0.0001, a.x + (Math.random() - .5) * 60, a.y - 10, { g: r.g, auto: true, force: true }); }
    F.hold.money = null; F.hold.power = null;
    if (grow) { Sc.vis.growHold = null; Sc.vis.grow = performance.now() + 2600; Sc.setFace('proud', 2600); Sc.vis.cheer = 3; setTimeout(() => { Sc.burst('AUFGEPUMPT!', '#ffd23f'); Sc.particle('confetti', Sc.W / 2, Sc.H * .3, 50); MK.Audio.play('level'); }, 350); }
    box.classList.add('out'); setTimeout(() => { box.hidden = true; box.className = ''; }, 340); };
};
U.rivalBanner = function (show) {
  const b = $('rivalB'); if (!show) { if (!b.hidden) { b.classList.add('out'); setTimeout(() => { b.hidden = true; b.classList.remove('out'); }, 300); } return; }
  if (!b.hidden) return;
  const R = MK.RIVAL, S = MK.S, line = MK.pickLine(MK.LINES.rival.challenge, 'rc');
  b.hidden = false; b.className = 'rvcard';
  b.innerHTML = `<div class="rv-face"><canvas width="132" height="132"></canvas><span class="rv-vs">VS</span></div>
    <div class="rv-txt"><small>Herausforderung</small><b>${esc(R.full || R.name)}</b><span>„${esc(line)}“</span>
    <div class="rv-act"><button class="btn ok sm" id="rvGo">Annehmen</button><button class="ghost sm" id="rvNo">Später</button></div></div><i class="rv-time"></i>`;
  // Porträt: Rivale einmal klein rendern und den Kopf ausschneiden
  try { const big = document.createElement('canvas'); big.width = 300; big.height = 520; const bx = big.getContext('2d'), lvl = Math.floor(1 + S.rival.tot / 8);
    const o = { key: 'rvface', lv: Object.fromEntries(MK.MUSCLES.map(m => [m.id, lvl])), L: MK.Fig.resolveLook(R.look), posture: .8, breath: 0, dpr: 1, reuse: false, pose: { face: 'angry' } };
    const Rr = MK.Fig.render(bx, 150, 505, 1.5, o), hx = Rr.head.x, hy = Rr.head.y + 14, sz = 130, cx = b.querySelector('canvas').getContext('2d');
    cx.drawImage(big, hx - sz / 2, hy - sz / 2, sz, sz, 0, 0, 132, 132); } catch (e) { }
  MK.Audio.play('whoosh');
  const close = later => { U.rivalBanner(false); if (later) S.rival.next = Date.now() + 12 * 60e3; };
  $('rvGo').onclick = () => { close(); if (MK.Comp.rival()) U.afterCompStart(); else U.toast('Gerade nicht möglich'); };
  $('rvNo').onclick = () => close(true);
  clearTimeout(b._t); b._t = setTimeout(() => { if (!b.hidden) close(true); }, 25000); // verschwindet von allein, kommt später wieder
};


})(window.MK);
