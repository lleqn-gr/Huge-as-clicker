/* Muskelklicker – Spielstand übertragen zwischen Geräten
   1) Online mit kurzem Code: „Senden" lädt den Stand hoch und zeigt 6 Zeichen (15 Minuten gültig, nur einmal abrufbar),
      „Empfangen" holt ihn mit dem Code. Speicher: Supabase (cloud-config.js), nur über zwei abgesicherte Funktionen.
   2) Ohne Internet: Spielstand als Datei speichern / laden.
   Vor jedem Ersetzen wird der bisherige Stand als Sicherung behalten (wiederherstellbar). */
window.MK = window.MK || {};
(function (MK) {
'use strict';
const BAK = 'muskelklicker_v3_bak', CODE_LEN = 6, VALID_MIN = 15;
const T = MK.Transfer = {};

T.online = () => !!(MK.CLOUD && MK.CLOUD.url && MK.CLOUD.key);
// Codes bestehen nur aus gut lesbaren Zeichen (ohne 0/O, 1/I/L)
T.cleanCode = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LEN);

function rpc(fn, body) {
  const C = MK.CLOUD, h = { 'Content-Type': 'application/json', apikey: C.key };
  if (/^eyJ/.test(C.key)) h.Authorization = 'Bearer ' + C.key; // alter anon-Key (JWT); neue publishable Keys brauchen nur „apikey"
  const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null, to = ctl && setTimeout(() => ctl.abort(), 15000);
  return fetch(C.url.replace(/\/+$/, '') + '/rest/v1/rpc/' + fn, { method: 'POST', headers: h, body: JSON.stringify(body), signal: ctl && ctl.signal })
    .then(r => r.ok ? r.json() : r.text().then(t => { throw new Error('Server ' + r.status + ': ' + t.slice(0, 120)); }))
    .finally(() => to && clearTimeout(to));
}

/* ---- Senden: gibt { code, until } zurück ---- */
T.send = () => { if (!T.online()) return Promise.reject(new Error('offline-config'));
  const data = MK.exportSave();
  return rpc('send_save', { p_data: data }).then(code => { if (typeof code !== 'string' || code.length !== CODE_LEN) throw new Error('Kein Code erhalten'); return { code, until: Date.now() + VALID_MIN * 60e3 }; }); };

/* ---- Empfangen: gibt den Spielstand-Text zurück (oder null, wenn Code falsch/abgelaufen) ---- */
T.fetch = code => { if (!T.online()) return Promise.reject(new Error('offline-config'));
  return rpc('get_save', { p_code: T.cleanCode(code) }).then(d => (typeof d === 'string' && d.length ? d : null)); };

/* ---- Spielstand lesen (Code-Text oder Datei-Inhalt) → Objekt, ohne etwas zu ändern ---- */
T.parse = text => { text = String(text || '').trim(); let d;
  if (text[0] === '{') { d = JSON.parse(text); if (d && d.muskelklicker && d.save) d = d.save; }
  else d = JSON.parse(decodeURIComponent(escape(atob(text))));
  if (!d || typeof d !== 'object' || !d.m) throw new Error('Kein gültiger Spielstand'); return d; };
// kurze Beschreibung zum Vergleichen vor dem Ersetzen
T.describe = d => { const lv = Object.values(d.m || {}).reduce((a, x) => a + ((x && x.lv) || 1), 0);
  return { lv, money: +d.money || 0, dia: +d.dia || 0, when: +d.last || 0 }; };
T.describeNow = () => { MK.save(); return T.describe(MK.S); };

/* ---- Ersetzen: alten Stand als Sicherung behalten, dann neuen laden ---- */
T.apply = text => { const d = T.parse(text);
  MK.save(); try { localStorage.setItem(BAK, JSON.stringify({ t: Date.now(), raw: JSON.stringify(MK.S) })); } catch (e) { }
  MK.S = MK.merge(MK.fresh(), d); MK.ensureNew(); MK.save(); return true; };
T.backup = () => { try { const b = JSON.parse(localStorage.getItem(BAK) || 'null'); return b && b.raw ? { t: b.t, info: T.describe(JSON.parse(b.raw)) } : null; } catch (e) { return null; } };
T.restore = () => { const b = JSON.parse(localStorage.getItem(BAK) || 'null'); if (!b || !b.raw) return false;
  const cur = (MK.save(), JSON.stringify(MK.S)); // Tausch: der aktuelle Stand wird zur neuen Sicherung
  MK.S = MK.merge(MK.fresh(), JSON.parse(b.raw)); MK.ensureNew(); MK.save();
  try { localStorage.setItem(BAK, JSON.stringify({ t: Date.now(), raw: cur })); } catch (e) { } return true; };

/* ---- Datei ---- */
T.download = () => { MK.save();
  const txt = JSON.stringify({ muskelklicker: 1, saved: new Date().toISOString(), save: MK.S }), d = new Date(), p = n => String(n).padStart(2, '0');
  const name = `muskelklicker-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.json`;
  const url = URL.createObjectURL(new Blob([txt], { type: 'application/json' })), a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000); return name; };
T.readFile = file => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(r.error); r.readAsText(file); });

})(window.MK);
