/* Muskelklicker 3D-Umgebung – gekaufte Geräte als 3D-Modelle (Comic, einfache Formen).
   Jedes Gerät steht im Ursprung auf dem Boden und schaut zur Kamera (+z). Größen in Einheiten (1 = 100 Figur-Pixel).
   Rahmenfarbe = Material-Stufe aus dem Shop (Rostig … Titan), Scheiben = aktuelle Gewichtsstufe (Farben wie in 2D). */
import * as THREE from 'three';
import { tm, box, cyl, ball, tube, plate, CYL8 } from './parts3d.js';

const MK = window.MK;
const pc = i => MK.Scene.plateCol(Math.max(0, Math.min(MK.WEIGHTS.length - 1, i)));
const PAD = '#2a2a30', PADG = '#3a2a12';
const pad = lv => tm(lv >= 4 ? PADG : PAD);

// Langhantel mit Scheiben (Achse x), n Scheiben je Seite nach Gewichtsstufe
function barbell(g, x, y, z, len, wg, met) {
  cyl(g, tm('#c9d0d8'), x, y, z, .022, len, 'x', .5);
  const n = Math.max(1, Math.min(5, Math.ceil(wg / 4)));
  [-1, 1].forEach(s => { for (let i = 0; i < n; i++) { const r = .2 - i * .025; plate(g, pc(Math.max(0, wg - i * 3)), x + s * (len / 2 - .18 - i * .065), y, z, r, .055); } cyl(g, met, x + s * (len / 2 - .05), y, z, .035, .12, 'x', .5); });
}

// Umlenkrolle: Seil + Griff zeichnet scene.js live (schwingt leicht)
const pulley = (g, x, y, z, len) => { const m = new THREE.Object3D(); m.position.set(x, y, z); m.userData.pulley = len; g.add(m); };
export const EQ3 = {
  hanteln(g, F, wg) { // Hantelablage, Kurzhanteln werden mit der Gewichtsstufe größer und mehr
    const w = 1.5; [-1, 1].forEach(s => box(g, F, s * w / 2, .4, 0, .07, .8, .45));
    box(g, F, 0, .42, .06, w, .05, .2); box(g, F, 0, .74, -.08, w, .05, .2);
    const n = Math.max(2, Math.min(12, wg + 1));
    for (let i = 0; i < n; i++) { const row = i < 6 ? 0 : 1, col = i % 6, x = -w / 2 + .14 + col * (w - .28) / 5, y = row ? .8 : .5, z = row ? -.08 : .06, r = .055 + i * .005;
      cyl(g, tm('#c9d0d8'), x, y, z, .015, .17, 'x', .4); [-1, 1].forEach(s => cyl(g, tm(pc(i)), x + s * .1, y, z, r, .05, 'x', .7)); }
  },
  seil(g, F) { // Ständer mit aufgehängtem Springseil
    cyl(g, F, 0, .7, 0, .03, 1.4, null, .7); box(g, F, 0, .02, 0, .4, .04, .3); cyl(g, F, 0, 1.38, .08, .02, .18, 'z', .5);
    for (let i = 0; i < 3; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(.17 + i * .03, .012, 6, 24), tm('#2a2a2e')); t.position.set(0, 1.18 - i * .02, .14); t.scale.y = 1.6; g.add(t); }
    [-1, 1].forEach(s => cyl(g, tm('#d83a32'), s * .08, .88, .15, .025, .18, null, .5));
  },
  langhantel(g, F, wg) { // Scheibenbaum + Langhantel am Boden
    cyl(g, F, -.35, .55, 0, .035, 1.1, null, .7); box(g, F, -.35, .03, 0, .5, .06, .5);
    const n = Math.max(1, Math.min(6, Math.floor(wg / 2) + 1)); for (let i = 0; i < n; i++) { const y = .25 + (i % 3) * .3, s = i < 3 ? 1 : -1; cyl(g, F, -.35 + s * .06, y, 0, .015, .12, 'x', 0); plate(g, pc(Math.max(0, wg - i)), -.35 + s * .13, y, 0, .2 - i * .015, .05); }
    barbell(g, .45, .2, .25, 1.5, wg, F);
  },
  bank(g, F, wg, lv) { // Hantelbank
    [-1, 1].forEach(s => { box(g, F, s * .42, .2, 0, .06, .4, .32); box(g, F, s * .42, .02, 0, .1, .04, .42); });
    box(g, pad(lv), 0, .45, 0, 1.15, .1, .3);
  },
  barren(g, F) { // Dip-Barren
    [-1, 1].forEach(s => { [-1, 1].forEach(t => cyl(g, F, s * .28, .6, t * .3, .03, 1.2, null, .6)); cyl(g, tm('#c9d0d8'), s * .28, 1.2, 0, .028, .75, 'z', .5); box(g, F, s * .28, .02, 0, .1, .04, .7); });
  },
  stange(g, F) { // Klimmzugstange als Rahmen
    [-1, 1].forEach(s => { box(g, F, s * .6, 1.15, 0, .08, 2.3, .08); box(g, F, s * .6, .03, 0, .12, .06, .7); box(g, F, s * .6, .7, -.25, .06, 1.2, .06).rotation.x = .38; });
    cyl(g, tm('#c9d0d8'), 0, 2.22, .04, .03, 1.3, 'x', .5); box(g, F, 0, 2.3, 0, 1.3, .07, .07);
  },
  kabel(g, F) { // Kabelzug-Station (zwei Türme)
    [-1, 1].forEach(s => { box(g, F, s * .7, 1.2, 0, .14, 2.4, .14); box(g, tm('#9aa3ad'), s * .7, .45, .1, .12, .6, .06); for (let i = 0; i < 5; i++) box(g, tm('#1d1f24'), s * .7, .2 + i * .1, .14, .14, .07, .04, 0);
      cyl(g, tm('#c9d0d8'), s * .7, 2.2, .12, .06, .05, 'z', .5); pulley(g, s * .7, 2.17, .16, 1.1); });
    box(g, F, 0, 2.42, 0, 1.55, .1, .12); box(g, F, 0, .03, 0, 1.6, .06, .5);
  },
  rack(g, F, wg) { // Kniebeugen-Rack mit Langhantel
    const w = 1.25, d = .9, H = 2.2;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => box(g, F, sx * w / 2, H / 2, sz * d / 2, .08, H, .08));
    [-1, 1].forEach(sz => box(g, F, 0, H, sz * d / 2, w + .08, .08, .08)); [-1, 1].forEach(sx => box(g, F, sx * w / 2, H, 0, .08, .08, d));
    [-1, 1].forEach(sx => box(g, tm('#1d1f24'), sx * w / 2, 1.25, d / 2 + .05, .05, .05, .12));
    barbell(g, 0, 1.31, d / 2 + .08, 1.9, wg, F); box(g, tm('#1d1f24'), 0, .015, 0, w + .4, .03, d + .3, 0);
  },
  laufband(g, F) { // Laufband
    box(g, tm('#1d1f24'), 0, .12, .2, .62, .14, 1.4); box(g, tm('#3a3d44'), 0, .2, .2, .5, .02, 1.25, 0);
    [-1, 1].forEach(s => box(g, F, s * .3, .7, -.42, .06, 1.15, .06).rotation.x = -.15); box(g, F, 0, 1.25, -.5, .7, .08, .1);
    const scr = box(g, tm('#141414'), 0, 1.34, -.48, .42, .2, .06); scr.rotation.x = -.5; box(g, tm('#7fe3ff', { emissive: '#1a6f88' }), 0, 1.35, -.45, .34, .13, .01, 0).rotation.x = -.5;
  },
  hack(g, F, wg, lv) { // Hackenschmidt: schräger Schlitten
    const grp = new THREE.Group(); g.add(grp); grp.rotation.x = -.6;
    [-1, 1].forEach(s => box(grp, F, s * .38, .9, 0, .08, 1.9, .08)); box(grp, pad(lv), 0, 1.1, .1, .5, .9, .1); box(grp, pad(lv), 0, 1.65, .1, .4, .2, .12);
    box(g, F, 0, .04, .2, .9, .08, 1.2); box(g, tm('#3a3d44'), 0, .15, .55, .6, .04, .45); [-1, 1].forEach(s => plate(g, pc(wg), s * .5, .5, -.1, .2, .06));
  },
  reifen(g) { // großer Reifen, stehend
    const t = new THREE.Mesh(new THREE.TorusGeometry(.48, .22, 12, 28), tm('#1d1f24')); t.position.set(0, .7, 0); t.castShadow = true; g.add(t);
    const o = new THREE.Mesh(new THREE.TorusGeometry(.48, .22, 12, 28), new THREE.MeshBasicMaterial({ color: '#141414', side: THREE.BackSide })); o.scale.setScalar(1.025); t.add(o);
    cyl(g, tm('#3a3d44'), 0, .7, 0, .3, .3, 'z', .5);
  },
  butterfly(g, F, wg, lv) { // Butterfly: Sitz, Rückenpolster, zwei Arme, Gewichtsturm
    box(g, F, 0, 1.1, -.35, .5, 2.2, .14); box(g, pad(lv), 0, .5, .05, .45, .1, .4); box(g, pad(lv), 0, 1.05, -.2, .42, .75, .1);
    [-1, 1].forEach(s => { box(g, F, s * .45, 1.25, -.05, .06, .9, .06); box(g, pad(lv), s * .52, 1.2, .05, .1, .45, .14); });
    for (let i = 0; i < 6; i++) box(g, tm('#1d1f24'), 0, .25 + i * .08, -.48, .36, .06, .1, 0); box(g, F, 0, .04, 0, .9, .08, 1);
  },
  matte(g) { // Matte ausgerollt + Rolle
    box(g, tm('#2f6fd1'), 0, .012, .1, .65, .025, 1.4, .5); cyl(g, tm('#2bb673'), .55, .1, -.2, .1, .62, 'z', .7);
  },
  latzug(g, F, wg, lv) { // Latzug-Turm
    box(g, F, 0, 1.2, -.3, .16, 2.4, .16); box(g, F, 0, 2.4, -.05, .14, .1, .6); cyl(g, tm('#c9d0d8'), 0, 2.33, .22, .06, .05, 'z', .5);
    tube(g, tm('#141414'), [[0, 2.3, .24], [0, 1.9, .25]], .008); cyl(g, tm('#c9d0d8'), 0, 1.9, .25, .02, 1.1, 'x', .5);
    box(g, pad(lv), 0, .5, .25, .45, .1, .4); box(g, F, 0, .25, .25, .08, .45, .08); box(g, pad(lv), 0, .72, .48, .4, .08, .08);
    for (let i = 0; i < 6; i++) box(g, tm('#1d1f24'), 0, .25 + i * .08, -.42, .36, .06, .1, 0); box(g, F, 0, .04, 0, .7, .08, 1);
  },
  wadenblock(g, F) { // Wadenblock: Keil + Haltegriff
    const w = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, .7, 3), tm('#3a3d44')); w.rotation.z = Math.PI / 2; w.position.set(0, .12, .1); w.castShadow = true; g.add(w);
    [-1, 1].forEach(s => box(g, F, s * .3, .6, -.15, .05, 1.2, .05)); cyl(g, tm('#c9d0d8'), 0, 1.15, -.15, .025, .65, 'x', .5);
  },
  seilzug(g, F) { // einzelner Seilzug-Turm mit Griff
    box(g, F, 0, 1.15, 0, .5, 2.3, .14); box(g, tm('#9aa3ad'), 0, .5, .1, .3, .7, .06); for (let i = 0; i < 6; i++) box(g, tm('#1d1f24'), 0, .2 + i * .1, .14, .34, .07, .04, 0);
    cyl(g, tm('#c9d0d8'), 0, 1.4, .12, .06, .05, 'z', .5); pulley(g, 0, 1.37, .16, .45);
    box(g, F, 0, .03, 0, .7, .06, .5);
  },
  trizepsbank(g, F, wg, lv) { // Curl-/Trizepsbank mit Schrägpolster
    box(g, F, 0, .35, 0, .08, .7, .08); box(g, pad(lv), 0, .65, -.2, .45, .08, .3); const p = box(g, pad(lv), 0, .9, .08, .45, .08, .45); p.rotation.x = .7;
    box(g, F, 0, .03, 0, .5, .06, .7); [-1, 1].forEach(s => cyl(g, F, s * .25, 1.05, .25, .02, .2, null, .5));
  },
  haenge(g, F, wg, lv) { // Hängestation (Captain's Chair)
    [-1, 1].forEach(s => { box(g, F, s * .35, 1.1, -.2, .08, 2.2, .08); box(g, F, s * .35, .03, 0, .1, .06, .8); box(g, pad(lv), s * .3, 1.45, .1, .1, .08, .45); });
    box(g, pad(lv), 0, 1.25, -.17, .45, .55, .08); [-1, 1].forEach(s => cyl(g, tm('#c9d0d8'), s * .3, 2.15, 0, .025, .5, 'z', .5));
  },
  farmer(g, F, wg) { // Farmer-Griffe mit Scheiben
    [-1, 1].forEach(s => { const x = s * .35; box(g, F, x, .12, 0, .06, .06, 1); box(g, F, x, .22, 0, .05, .2, .05); cyl(g, tm('#c9d0d8'), x, .32, 0, .025, .3, 'z', .5); [-1, 1].forEach(t => plate(g, pc(wg), x, .2, t * .45, .2, .05, 'z')); });
  },
  tbar(g, F, wg) { // T-Bar-Rudern: Stange schräg am Boden mit Scheiben
    box(g, tm('#1d1f24'), 0, .02, 0, .8, .04, 1.4, 0); const st = cyl(g, tm('#c9d0d8'), 0, .3, .05, .025, 1.3, null, .5); st.rotation.x = 1.15;
    plate(g, pc(wg), 0, .48, .5, .22, .06, 'z'); plate(g, pc(Math.max(0, wg - 2)), 0, .45, .44, .18, .05, 'z'); box(g, F, 0, .06, -.55, .2, .12, .2); cyl(g, tm('#c9d0d8'), 0, .6, .62, .02, .4, 'x', .5);
  },
  szstange(g, F, wg) { // kleine Ablage mit SZ-Stange
    [-1, 1].forEach(s => { box(g, F, s * .45, .45, 0, .06, .9, .06); box(g, F, s * .45, .03, 0, .1, .06, .45); box(g, F, s * .45, .9, .06, .06, .06, .14); });
    barbell(g, 0, .96, .1, 1.2, Math.max(0, wg - 2), F);
  },
  plattform(g, F, wg) { // Kreuzheben-Plattform mit Langhantel
    box(g, tm('#8a5f38'), 0, .025, 0, 1.3, .05, 1.3, .5); [-1, 1].forEach(s => box(g, tm('#1d1f24'), s * .82, .025, 0, .35, .05, 1.3, .5));
    barbell(g, 0, .22, .1, 2, wg, F);
  }
};

export function buildEquip(id, F, wg, lv) { const g = new THREE.Group(); const f = EQ3[id]; if (!f) return null; f(g, F, wg || 0, lv || 1); g.userData.eq = id; return g; }
export const frameMat = lv => { const M = MK.MATERIAL[Math.max(0, Math.min(MK.MATERIAL.length - 1, (lv || 1) - 1))]; return tm(M.a); };
export { CYL8 };
