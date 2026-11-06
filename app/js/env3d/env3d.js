/* Muskelklicker – 3D-Umgebung (Phase 1: Vereinsgym)
   Figur, NPCs, Spiegel, Theke und Trainingsgeräte bleiben 2D (scene.js). Hier entsteht nur der RAUM in 3D:
   Wand, Boden, Fenster, Lampen, Wimpel, Hintergrund-Geräte – im Comic-Look (Toon-Licht, schwarze Umrisse).
   Der Raum wird EINMAL in ein Bild gerendert (nur neu bei Gym-Stufe, Größe, Grafik-Stufe, Tag/Nacht) –
   scene.js zeichnet dieses Bild statt des alten 2D-Hintergrunds. Kostet im laufenden Spiel also fast nichts.
   Fenster haben kein Glas: dort bleibt das Bild durchsichtig und scene.js zeichnet darunter den EINEN gemeinsamen Himmel.

   Kamera = aus der 2D-Szene abgeleitet, damit die 2D-Figuren nicht „draufgeklebt" wirken:
   - Fußpunkt der Figur (py) und ihre Größe (pScale) legen Abstand und Brennweite fest,
   - die Wandkante (yF) legt die Raumtiefe fest,
   - der Horizont kommt aus der Größen-Staffelung der Besucher (hinten ×0,6 / vorne ×0,68 bei yF+16 / yF+41).
   Einheiten: 1 = 100 Figur-Pixel (so groß ist die Figur in der Spieler-Ebene). */
import * as THREE from 'three';
import { U, toon, inked } from './toon.js';

const MK = window.MK, E = MK.Env3D;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
let R = null, scene = null, cam = null, room = null, lastKey = '', out = null, wins = [];
const TEX = {};

export function boot() {
  if (E.state === 'ready') return E;
  const cv = document.createElement('canvas');
  try { R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: false, powerPreference: 'low-power' }); }
  catch (e) { E.state = 'fail'; E.err = 'WebGL nicht verfügbar'; throw e; }
  R.setClearColor(0x000000, 0); R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFShadowMap;
  scene = new THREE.Scene();
  cam = new THREE.PerspectiveCamera(40, 1, .1, 80);
  E.get = get; E.state = 'ready'; E.has = gym => gym === 1;
  E._dbg = { THREE, R, scene, cam }; // nur für Tests
  return E;
}

/* ---------- Kamera aus der 2D-Szene ---------- */
function camFrom(L) {
  const ppu = L.pScale * 100, py = L.py, yF = L.yF;
  const cyB = (yF + 16 - .6 * py) / .4, cyF = (yF + 41 - .68 * py) / .32;
  const cy = clamp((cyB + cyF) / 2, L.H * .02, yF - 40);
  const d = 7, f = ppu * d, h = (py - cy) / ppu, zw = d * (py - cy) / (yF - cy);
  return { ppu, cy, d, f, h, zw, W: L.W, H: L.H };
}
function applyCam(C) { // eigene Projektion: Horizont liegt nicht in der Bildmitte, Kamera schaut waagerecht (senkrechte Kanten bleiben senkrecht wie in 2D)
  const n = .1, k = n / C.f;
  cam.position.set(0, C.h, 0); cam.rotation.set(0, 0, 0); cam.updateMatrixWorld(true);
  cam.projectionMatrix.makePerspective(-C.W / 2 * k, C.W / 2 * k, C.cy * k, -(C.H - C.cy) * k, n, 80);
  cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
}
// Bildschirm-Punkt → Welt in Tiefe z (Abstand vor der Kamera)
const wx = (C, sx, z) => (sx - C.W / 2) * z / C.f, wy = (C, sy, z) => C.h + (C.cy - sy) * z / C.f;

/* ---------- Texturen (einmal gemalt) ---------- */
function canvasTex(key, w, h, paint, srgb = true) {
  if (TEX[key]) return TEX[key];
  const c = document.createElement('canvas'); c.width = w; c.height = h; paint(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return TEX[key] = t;
}
function rng(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
// Ziegel: 4 Steine breit, 8 Reihen hoch = 2 × 1,6 Einheiten
const brick = (x, w, h) => { const R = rng(11); x.fillStyle = '#d8ccb0'; x.fillRect(0, 0, w, h); const rows = 8, bh = h / rows, bw = w / 4;
  for (let r = 0; r < rows; r++) for (let i = -1; i < 5; i++) { const ox = (r % 2) * bw / 2, v = R(); x.fillStyle = v < .33 ? '#b08455' : v < .66 ? '#a67a4c' : '#bb8f5f';
    const X = i * bw + ox + 3, Y = r * bh + 3, ww = bw - 6, hh = bh - 6; x.fillRect(X, Y, ww, hh);
    x.fillStyle = 'rgba(255,255,255,.13)'; x.fillRect(X, Y, ww, 3); x.fillStyle = 'rgba(0,0,0,.14)'; x.fillRect(X, Y + hh - 4, ww, 4);
    if (R() < .18) { x.fillStyle = 'rgba(70,35,12,.12)'; x.beginPath(); x.ellipse(X + ww * R(), Y + hh / 2, ww * .3, hh * .35, 0, 0, Math.PI * 2); x.fill(); } } };
// Holzdielen: 4 Dielen nebeneinander (je 0,35 E.), 4 Einheiten lang, Stöße versetzt
const planks = (x, w, h) => { const R = rng(5), base = ['#9a6a40', '#8a5f38', '#a87448', '#7e5532'], n = 4, pw = w / n;
  for (let i = 0; i < n; i++) { let y = -R() * h * .5; while (y < h) { const len = h * (.35 + R() * .45); x.fillStyle = base[Math.floor(R() * base.length)]; x.fillRect(i * pw, y, pw, len);
      x.strokeStyle = 'rgba(0,0,0,.09)'; x.lineWidth = 2; for (let j = 0; j < 3; j++) { const fx = i * pw + pw * (.2 + R() * .6); x.beginPath(); x.moveTo(fx, y); x.lineTo(fx + (R() - .5) * 6, y + len); x.stroke(); }
      x.fillStyle = 'rgba(0,0,0,.45)'; x.fillRect(i * pw, y + len - 3, pw, 3); y += len; }
    x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(i * pw, 0, 3, h); x.fillStyle = 'rgba(255,255,255,.07)'; x.fillRect(i * pw + 3, 0, 2, h); } };
const sign = (x, w, h) => { x.fillStyle = '#6b4a2b'; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(255,255,255,.08)'; for (let i = 0; i < 6; i++) x.fillRect(0, i * h / 6, w, 2);
  x.strokeStyle = '#3a2614'; x.lineWidth = 8; x.strokeRect(4, 4, w - 8, h - 8);
  x.fillStyle = '#f2e3bf'; x.font = `700 ${h * .5}px Georgia, serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('SV EISEN 1921', w / 2, h * .54); };
const poster = (x, w, h) => { x.fillStyle = '#f1efe9'; x.fillRect(0, 0, w, h); x.fillStyle = '#d83a32'; x.fillRect(w * .1, h * .08, w * .8, h * .56);
  x.fillStyle = '#f1efe9'; x.beginPath(); x.arc(w * .5, h * .26, w * .13, 0, Math.PI * 2); x.fill(); x.fillRect(w * .3, h * .38, w * .4, h * .2); x.fillRect(w * .16, h * .38, w * .68, h * .07);
  x.fillStyle = '#141414'; x.font = `900 ${h * .13}px Arial Black, Arial, sans-serif`; x.textAlign = 'center'; x.fillText('DU!', w / 2, h * .84); };

/* ---------- Bausteine ---------- */
const MAT = {};
function mats() { if (MAT.ok) return MAT; MAT.ok = 1;
  MAT.wall = toon('#ffffff', { map: canvasTex('brick', 512, 512, brick), rim: false });
  MAT.floor = toon('#ffffff', { map: canvasTex('planks', 512, 1024, planks), rim: false });
  MAT.plaster = toon('#e4d7b9', { rim: false }); MAT.wood = toon('#5e4a2e'); MAT.woodL = toon('#8a6640'); MAT.sill = toon('#efe6d2');
  MAT.metal = toon('#2c2f36'); MAT.steel = toon('#9aa3ad'); MAT.chrome = toon('#c9d0d8'); MAT.red = toon('#d83a32'); MAT.blue = toon('#2f6fd1'); MAT.white = toon('#f4f1ea');
  MAT.pil = toon('#ad7f50'); MAT.pilD = toon('#8f6640'); MAT.mortar = toon('#d8ccb0', { rim: false });
  MAT.rubber = toon('#1d1f24'); MAT.lamp = toon('#e9edf0'); MAT.glow = new THREE.MeshBasicMaterial({ color: '#fffbe8' });
  MAT.sign = toon('#ffffff', { map: canvasTex('sign', 1024, 160, sign), rim: false }); MAT.poster = toon('#ffffff', { map: canvasTex('poster', 256, 360, poster), rim: false });
  MAT.sign.map.wrapS = MAT.sign.map.wrapT = THREE.ClampToEdgeWrapping; MAT.poster.map.wrapS = MAT.poster.map.wrapT = THREE.ClampToEdgeWrapping;
  return MAT; }
const BOX = new THREE.BoxGeometry(1, 1, 1), CYL = new THREE.CylinderGeometry(1, 1, 1, 18), CYL8 = new THREE.CylinderGeometry(1, 1, 1, 8);
function box(g, m, x, y, z, w, h, d, k) { const o = k === 0 ? new THREE.Mesh(BOX, m) : inked(BOX, m, k || 1); o.position.set(x, y, z); o.scale.set(w, h, d); o.castShadow = o.receiveShadow = true; g.add(o); return o; }
function cyl(g, m, x, y, z, r, len, axis, k, geo) { const o = inked(geo || CYL, m, k || 1); o.position.set(x, y, z); o.scale.set(r, len, r); if (axis === 'x') o.rotation.z = Math.PI / 2; if (axis === 'z') o.rotation.x = Math.PI / 2; o.castShadow = o.receiveShadow = true; g.add(o); return o; }

/* ---------- Vereinsgym ---------- */
function buildVerein(C, L) {
  const M = mats(), g = new THREE.Group(), zW = -C.zw;
  const topY = wy(C, -20, C.zw) + .5, halfW = wx(C, C.W + 40, C.zw) + 1;
  wins = [];
  // Fenster wie in 2D: [x-Anteil, Breite] an der Wand, oben yF·0,14, Höhe yF·0,38
  const WIN = [.35, .515].map(fx => { const sx0 = L.W * fx, sy0 = L.yF * .14, sw = L.W * .135, sh = L.yF * .38;
    wins.push([sx0, sy0, sw, sh, 0, 0]);
    return { x0: wx(C, sx0, C.zw), x1: wx(C, sx0 + sw, C.zw), y1: wy(C, sy0, C.zw), y0: wy(C, sy0 + sh, C.zw) }; });
  // Rückwand mit Fensterlöchern (Ziegel-Textur in Welt-Einheiten)
  { const s = new THREE.Shape(); s.moveTo(-halfW, 0); s.lineTo(halfW, 0); s.lineTo(halfW, topY); s.lineTo(-halfW, topY); s.closePath();
    WIN.forEach(w => { const p = new THREE.Path(); p.moveTo(w.x0, w.y0); p.lineTo(w.x0, w.y1); p.lineTo(w.x1, w.y1); p.lineTo(w.x1, w.y0); p.closePath(); s.holes.push(p); });
    const geo = new THREE.ShapeGeometry(s); const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 2, uv.getY(i) / 1.6);
    const wall = new THREE.Mesh(geo, M.wall); wall.position.z = zW; wall.receiveShadow = true; g.add(wall); }
  // Fenster: Laibung (Tiefe), Holzrahmen, Fensterbank, Sprossen – Glas gibt es nicht, dahinter zeichnet scene.js den Himmel
  WIN.forEach(w => { const dep = .32, cx = (w.x0 + w.x1) / 2, cyy = (w.y0 + w.y1) / 2, ww = w.x1 - w.x0, wh = w.y1 - w.y0, t = .09;
    box(g, M.plaster, cx, w.y0 - .005, zW - dep / 2, ww, .01, dep, 0); box(g, M.plaster, cx, w.y1 + .005, zW - dep / 2, ww, .01, dep, 0);
    box(g, M.plaster, w.x0 - .005, cyy, zW - dep / 2, .01, wh, dep, 0); box(g, M.plaster, w.x1 + .005, cyy, zW - dep / 2, .01, wh, dep, 0);
    // Rahmen außen auf der Wand
    box(g, M.wood, cx, w.y1 + t / 2, zW + .03, ww + t * 2, t, .07); box(g, M.wood, cx, w.y0 - t / 2, zW + .03, ww + t * 2, t, .07);
    box(g, M.wood, w.x0 - t / 2, cyy, zW + .03, t, wh, .07); box(g, M.wood, w.x1 + t / 2, cyy, zW + .03, t, wh, .07);
    box(g, M.sill, cx, w.y0 - t - .03, zW + .1, ww + t * 3.4, .06, .26);
    // Sprossen (Kreuz) hinten in der Laibung
    const zg = zW - dep + .03; box(g, M.wood, cx, cyy, zg, .05, wh, .04, .7); box(g, M.wood, cx, cyy, zg, ww, .05, .04, .7);
    box(g, M.wood, cx, w.y0 + .025, zg, ww, .05, .04, .7); box(g, M.wood, cx, w.y1 - .025, zg, ww, .05, .04, .7); });
  // Fußleiste
  box(g, M.wood, 0, .07, zW + .03, halfW * 2, .14, .06);
  // Deckenbalken oben an der Wand (man sieht seine Unterseite → Tiefe) und gemauerte Pfeiler links/rechts der Fenster
  { const yb = wy(C, 7, C.zw - .3), yt = topY + .3; box(g, M.woodL, 0, (yb + yt) / 2, zW + .3, halfW * 2, yt - yb, .6); }
  { const pw = .42, pd = .24, x0 = WIN[0].x0 - .55, x1 = WIN[1].x1 + .55, Hp = wy(C, 7, C.zw - .3);
    [x0, x1].forEach(x => { box(g, M.pil, x, Hp / 2, zW + pd / 2, pw, Hp, pd); box(g, M.pilD, x, .35, zW + pd / 2 + .02, pw + .08, .7, pd + .06); // Sockel
      for (let y = .9; y < Hp - .2; y += .42) box(g, M.mortar, x, y, zW + pd + .003, pw, .025, .006, 0); }); }
  // Boden: Dielen laufen in die Tiefe
  { const len = C.zw + 2, geo = new THREE.PlaneGeometry(halfW * 2, len); const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * halfW * 2 / 1.4, uv.getY(i) * len / 4);
    const fl = new THREE.Mesh(geo, M.floor); fl.rotation.x = -Math.PI / 2; fl.position.z = zW + len / 2; fl.receiveShadow = true; g.add(fl); }
  // Vereinsschild zwischen Fenstern und Boden (wie „SV EISEN 1921" in 2D)
  { const sy = L.yF * .66, Y = wy(C, sy, C.zw), wv = wx(C, L.W * .5 + L.W * .11, C.zw) * 2, hv = wv * 160 / 1024;
    const s = box(g, M.sign, 0, Y, zW + .05, wv, hv, .06, .8); s.material = [M.wood, M.wood, M.wood, M.wood, M.sign, M.wood]; }
  // Wimpelkette: hängt leicht durch, vor der Wand
  { const z = zW + .35, sy = 22, n = Math.ceil(halfW * 2 / .5), cols = [M.red, M.white, M.blue], tri = new THREE.BufferGeometry();
    tri.setAttribute('position', new THREE.Float32BufferAttribute([-.21, 0, 0, 0, -.36, 0, .21, 0, 0], 3)); tri.computeVertexNormals();
    const Y0 = wy(C, sy, C.zw - .35), pts = [];
    for (let i = 0; i <= n; i++) { const u = i / n, x = -halfW + u * halfW * 2, sag = Math.sin(((x / (halfW * 2 / 3)) % 1 + 1) % 1 * Math.PI) * .22; pts.push(new THREE.Vector3(x, Y0 - sag, z)); }
    const line = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n * 3, .012, 5), M.metal); g.add(line);
    pts.forEach((p, i) => { if (i === n) return; const q = pts[i + 1], m = inked(tri, cols[i % 3], .7); m.material = cols[i % 3]; m.position.set((p.x + q.x) / 2, (p.y + q.y) / 2, z); m.rotation.z = Math.atan2(q.y - p.y, q.x - p.x); m.rotation.x = -.18; m.castShadow = true; g.add(m); });
    tri.computeBoundingSphere(); }
  // Hintergrund-Geräte (an der Wand, links neben den Fenstern bzw. darunter – nicht dort, wo 2D-Spiegel und Theke stehen)
  // Kabelzug-Turm zwischen Spiegel (bis 0,28·W) und linkem Fenster (ab 0,35·W)
  { const x = wx(C, L.W * .3, C.zw - .55), z = zW + .55, H = 2.5, w = .62;
    box(g, M.metal, x - w / 2, H / 2, z, .09, H, .09); box(g, M.metal, x + w / 2, H / 2, z, .09, H, .09); box(g, M.metal, x, H, z, w + .09, .09, .2); box(g, M.metal, x, .04, z, w + .3, .08, .5);
    box(g, M.steel, x, .55, z - .04, w * .55, .7, .12); for (let i = 0; i < 6; i++) box(g, M.rubber, x, .28 + i * .1, z + .03, w * .5, .07, .1, .5);
    cyl(g, M.chrome, x, 1.6, z + .02, .012, 1.9, null, .5); cyl(g, M.chrome, x, H - .05, z + .07, .06, .05, 'z', .6); cyl(g, M.rubber, x, 1.05, z + .14, .05, .26, 'x', .6); }
  // Hantelablage unter den Fenstern: zweistöckig, Kurzhanteln mit runden Gummi-Köpfen
  { const x0 = wx(C, L.W * .39, C.zw - .45), x1 = wx(C, L.W * .61, C.zw - .45), z = zW + .45, wd = x1 - x0, cx = (x0 + x1) / 2;
    [-1, 1].forEach(s => { box(g, M.metal, cx + s * wd / 2, .33, z, .08, .66, .5); });
    box(g, M.metal, cx, .36, z - .08, wd, .05, .22); box(g, M.metal, cx, .64, z - .14, wd, .05, .2);
    const DB = [['#2f6fd1', .07], ['#d83a32', .075], ['#2bb673', .08], ['#f2c230', .085], ['#1d1f24', .09], ['#1d1f24', .095]];
    const n = Math.max(4, Math.min(8, Math.floor(wd / .32)));
    for (let r = 0; r < 2; r++) for (let i = 0; i < n; i++) { const [col, rr] = DB[(i + r * 2) % DB.length], px = x0 + (i + .5) * wd / n, py = r ? .72 : .44, pz = z - (r ? .14 : .08), m = MAT['c' + col] || (MAT['c' + col] = toon(col));
      cyl(g, M.chrome, px, py, pz, .018, .16, 'x', .4); [-1, 1].forEach(s => cyl(g, m, px + s * .1, py, pz, rr, .06, 'x', .7)); } }
  // Kniebeugen-Rack rechts (nur wenn rechts keine Theke steht – die bleibt 2D)
  if (!MK.S.eq.kuehl) { const x = wx(C, L.W * .82, C.zw - .9), z = zW + .9, H = 2.3, w = 1.25, dp = .9;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => box(g, M.red, x + sx * w / 2, H / 2, z + sz * dp / 2, .08, H, .08));
    [-1, 1].forEach(sz => box(g, M.red, x, H, z + sz * dp / 2, w + .08, .08, .08)); [-1, 1].forEach(sx => box(g, M.red, x + sx * w / 2, H, z, .08, .08, dp));
    [-1, 1].forEach(sx => box(g, M.metal, x + sx * w / 2, 1.25, z + dp / 2 + .05, .05, .05, .12));
    cyl(g, M.chrome, x, 1.32, z + dp / 2 + .08, .02, w + .6, 'x', .5); [-1, 1].forEach(s => { cyl(g, M.rubber, x + s * (w / 2 + .18), 1.32, z + dp / 2 + .08, .2, .07, 'x'); cyl(g, M.rubber, x + s * (w / 2 + .26), 1.32, z + dp / 2 + .08, .15, .06, 'x'); });
    box(g, M.rubber, x, .015, z, w + .4, .03, dp + .3, 0); }
  // Poster vorne am linken Pfeiler (ab etwas Ruhm, wie in 2D)
  if (MK.S.fame > 40) { const x = WIN[0].x0 - .55, Y = 3.1, zp = zW + .25; box(g, M.wood, x, Y, zp, .4, .54, .02); const p = box(g, M.poster, x, Y, zp + .015, .34, .48, .01, 0); p.material = [M.white, M.white, M.white, M.white, M.poster, M.white]; }
  // Hängelampen (Röhren) dort, wo scene.js ihr Licht/Bloom zeichnet: x = 0,2 / 0,5 / 0,8 · W, y ≈ 9 px
  const zl = (C.d + C.zw) * .55;
  [.2, .5, .8].forEach(fx => { const x = wx(C, L.W * fx, zl), Y = wy(C, 9, zl), lw = Math.min(1.3, wx(C, L.W * fx + 30, zl) - x) * 2;
    box(g, M.lamp, x, Y + .03, -zl, lw, .06, .16); const tube = new THREE.Mesh(BOX, M.glow); tube.position.set(x, Y - .01, -zl); tube.scale.set(lw * .92, .03, .1); g.add(tube);
    [-1, 1].forEach(s => cyl(g, M.metal, x + s * lw * .35, Y + 1.5, -zl, .006, 3, null, .3, CYL8)); });
  return g;
}

/* ---------- Licht ---------- */
function lights(g, C, night) {
  const hemi = new THREE.HemisphereLight(night ? '#9aa8d8' : '#fff4e2', night ? '#3a2c22' : '#6a4a30', night ? .75 : 1.15); g.add(hemi);
  // Hauptlicht von vorne links oben (wie die Lichtrichtung der 2D-Figur) → Schatten fallen nach hinten rechts
  const key = new THREE.DirectionalLight(night ? '#ffe2b8' : '#fff1d6', night ? 1.6 : 2.2); key.position.set(-4, C.h + 6, 4); key.target.position.set(0, 0, -C.zw); g.add(key, key.target);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -.0005; key.shadow.normalBias = .02; key.shadow.radius = 3;
  const sc = key.shadow.camera, ext = C.zw * .9; Object.assign(sc, { left: -ext, right: ext, top: ext, bottom: -ext, near: 1, far: C.zw * 3 }); sc.updateProjectionMatrix();
  // Tageslicht durchs Fenster (von hinten) – kühl, leicht
  const back = new THREE.DirectionalLight(night ? '#6d84c8' : '#cfe6ff', night ? .25 : .55); back.position.set(1, C.h + 2, -C.zw - 6); g.add(back);
}

/* ---------- Ein Bild für die aktuelle Größe/Stufe ---------- */
function get(L) {
  if (E.state !== 'ready' || !E.has(L.gym)) return null;
  const night = !!L.night, key = [L.gym, L.W, L.H, Math.round(L.yF), Math.round(L.py), L.pScale.toFixed(4), L.dpr, L.q, night ? 1 : 0, MK.S.eq.kuehl ? 1 : 0, MK.S.fame > 40 ? 1 : 0].join(':');
  if (key === lastKey && out) return { cv: out, win: wins, key };
  const t0 = performance.now(), C = camFrom(L);
  if (room) { scene.remove(room); room.traverse(o => { if (o.geometry && o.geometry !== BOX && o.geometry !== CYL && o.geometry !== CYL8 && !o.userData.outline) o.geometry.dispose(); if (o.isMaterial) o.dispose(); }); }
  room = new THREE.Group(); room.add(buildVerein(C, L)); lights(room, C, night); scene.add(room);
  applyCam(C);
  const pr = Math.min(L.dpr, L.q === 'hoch' ? 2 : 1.5);
  R.setPixelRatio(pr); R.setSize(L.W, L.H, false); R.shadowMap.enabled = L.q !== 'niedrig'; R.getDrawingBufferSize(U.uRes.value);
  U.uW.value = clamp(L.pScale * 1.9, 1.1, 2.6) * pr; // Umriss so dick wie die Linien der 2D-Figur
  R.render(scene, cam);
  if (!out) out = document.createElement('canvas');
  out.width = R.domElement.width; out.height = R.domElement.height; const x = out.getContext('2d'); x.clearRect(0, 0, out.width, out.height); x.drawImage(R.domElement, 0, 0);
  lastKey = key; E.stats = { ms: Math.round(performance.now() - t0), calls: R.info.render.calls, tris: R.info.render.triangles, cam: C };
  return { cv: out, win: wins, key };
}
