/* Muskelklicker – gemeinsame Grafiken: Geldschein & XP-Hantel (vorgerendert, scharf, schnell zu zeichnen) */
window.MK = window.MK || {};
(function (MK) {
const A = MK.Art = {}, TAU = Math.PI * 2, K = 3; // 3-fach gerendert: bleibt auch groß und auf Retina scharf
function rr(x, X, y, w, h, r) { x.beginPath(); x.moveTo(X + r, y); x.arcTo(X + w, y, X + w, y + h, r); x.arcTo(X + w, y + h, X, y + h, r); x.arcTo(X, y + h, X, y, r); x.arcTo(X, y, X + w, y, r); x.closePath(); }
/* Geldschein: grün, Tuschekante, Guilloche-Wellen, Rosette mit €-Zeichen, Wert-Ecken */
function makeBill() {
  const W = 64, H = 30, s = document.createElement('canvas'); s.width = (W + 6) * K; s.height = (H + 6) * K; const x = s.getContext('2d'); x.scale(K, K); x.translate(3, 3);
  rr(x, 0, 0, W, H, 3.5); x.fillStyle = '#141414'; x.fill();
  rr(x, 1.4, 1.4, W - 2.8, H - 2.8, 2.6); let g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#6fcf87'); g.addColorStop(.5, '#3fa860'); g.addColorStop(1, '#2b8a4c'); x.fillStyle = g; x.fill();
  x.save(); rr(x, 1.4, 1.4, W - 2.8, H - 2.8, 2.6); x.clip();
  x.strokeStyle = 'rgba(220,255,225,.28)'; x.lineWidth = .7; for (let k = 0; k < 6; k++) { x.beginPath(); for (let i = 0; i <= 64; i++) { const px = i, py = 5 + k * 4 + Math.sin(i * .32 + k * .9) * 1.6; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); }
  x.restore();
  x.strokeStyle = 'rgba(235,255,235,.75)'; x.lineWidth = .9; rr(x, 4, 3.8, W - 8, H - 7.6, 2); x.stroke();
  // Rosette mit €
  const cx = W * .5, cy = H * .5; g = x.createRadialGradient(cx - 2, cy - 2, 1, cx, cy, 9.5); g.addColorStop(0, '#f3ffe9'); g.addColorStop(1, '#bfe8c6'); x.fillStyle = g; x.beginPath(); for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, r = i % 2 ? 8.2 : 9.6; x.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } x.closePath(); x.fill(); x.strokeStyle = '#1f6b3a'; x.lineWidth = .8; x.stroke();
  x.fillStyle = '#1f6b3a'; x.font = '900 12px "Arial Black",Arial,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('€', cx, cy + .6);
  // Wert-Ecken
  x.font = '800 6.5px Arial,sans-serif'; x.fillStyle = '#eaffef'; x.textAlign = 'left'; x.fillText('100', 6, 9); x.textAlign = 'right'; x.fillText('100', W - 6, H - 8);
  // Glanzkante
  x.fillStyle = 'rgba(255,255,255,.22)'; rr(x, 2, 2, W - 4, 4, 2); x.fill();
  return { c: s, w: W + 6, h: H + 6 };
}
/* XP-Hantel: mattschwarze Scheiben, Chromgriff, warme Lichtkante (auf dunklem Gym gut sichtbar) */
function makeBell() {
  const W = 44, H = 22, s = document.createElement('canvas'); s.width = (W + 10) * K; s.height = (H + 10) * K; const x = s.getContext('2d'); x.scale(K, K); x.translate(5, 5);
  const cy = H / 2;
  let g; // nur die Hantel – kein Schimmer drumherum
  // Griff
  g = x.createLinearGradient(0, cy - 2.4, 0, cy + 2.4); g.addColorStop(0, '#f4f6f8'); g.addColorStop(.45, '#a9b0b8'); g.addColorStop(1, '#5d636b'); x.fillStyle = '#141414'; rr(x, 9, cy - 3, W - 18, 6, 2.5); x.fill(); x.fillStyle = g; rr(x, 9.8, cy - 2.2, W - 19.6, 4.4, 2); x.fill();
  x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = .5; for (let i = 15; i < W - 15; i += 2) { x.beginPath(); x.moveTo(i, cy - 2); x.lineTo(i + 1, cy + 2); x.stroke(); } // Rändel
  const plate = (px, w, h) => { x.fillStyle = '#141414'; rr(x, px - .8, cy - h / 2 - .8, w + 1.6, h + 1.6, 2.4); x.fill(); g = x.createLinearGradient(px, 0, px + w, 0); g.addColorStop(0, '#3b3e45'); g.addColorStop(.35, '#22242a'); g.addColorStop(1, '#0f1013'); x.fillStyle = g; rr(x, px, cy - h / 2, w, h, 1.8); x.fill();
    x.fillStyle = 'rgba(255,255,255,.28)'; x.fillRect(px + .6, cy - h / 2 + 1.2, .9, h - 2.4); x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(px + 1.5, cy - h / 2 + .8, w - 3, 1.1); };
  plate(3.2, 5.2, 15); plate(8.6, 3.6, 21); plate(W - 12.2, 3.6, 21); plate(W - 8.4, 5.2, 15);
  x.fillStyle = '#141414'; rr(x, 0, cy - 2.6, 3.4, 5.2, 1.2); x.fill(); rr(x, W - 3.4, cy - 2.6, 3.4, 5.2, 1.2); x.fill(); // Endkappen
  return { c: s, w: W + 10, h: H + 10 };
}
let BILL = null, BELL = null;
A.bill = () => BILL || (BILL = makeBill());
A.bell = () => BELL || (BELL = makeBell());
/* Schein zeichnen: w = Breite in px, rot = Drehung, flip = -1…1 (Flattern um die Längsachse) */
A.drawBill = function (c, x, y, w, rot, flip, alpha) { const b = A.bill(), h = w * b.h / b.w; c.save(); c.translate(x, y); c.rotate(rot || 0); c.scale(1, flip == null ? 1 : Math.max(.12, Math.abs(flip)) * (flip < 0 ? -1 : 1)); if (alpha != null) c.globalAlpha *= alpha; c.drawImage(b.c, -w / 2, -h / 2, w, h); c.restore(); };
A.drawBell = function (c, x, y, w, rot, alpha) { const b = A.bell(), h = w * b.h / b.w; c.save(); c.translate(x, y); c.rotate(rot || 0); if (alpha != null) c.globalAlpha *= alpha; c.drawImage(b.c, -w / 2, -h / 2, w, h); c.restore(); };
/* Geldbündel (Bonus zum Antippen): drei versetzte Scheine mit Banderole */
A.drawBundle = function (c, x, y, w, t) { const wob = Math.sin(t * 3) * .06; A.drawBill(c, x - 3, y + 4, w, -.18 + wob, 1); A.drawBill(c, x + 2, y + 1, w, .1 + wob, 1); A.drawBill(c, x, y - 2, w, -.04 + wob, 1);
  c.save(); c.translate(x, y - 2); c.rotate(-.04 + wob); c.fillStyle = '#ffd23f'; c.strokeStyle = '#141414'; c.lineWidth = 1.2; c.fillRect(-4, -w * .26, 8, w * .52); c.strokeRect(-4, -w * .26, 8, w * .52); c.restore(); };
})(window.MK);
