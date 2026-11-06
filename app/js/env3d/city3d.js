/* Muskelklicker 3D – Imperium: isometrische Mini-Stadt (live gerendert, nur solange das Imperium sichtbar ist).
   - Jedes Geschäft hat einen eigenen Block mit einem Gebäude, das mit den Ausbauten wächst:
     Bude → Laden → Haus → Hochhaus (Höhe zusätzlich mit der Anzahl). Beim Kauf „ploppt" es kurz hoch.
   - Autos fahren auf den Straßen, Laternen und Fenster leuchten abends (Tag/Nacht nach echter Uhrzeit).
   - Zoom-Stufen wie in 2D: Block → Stadtteil → Stadt → Großstadt → Land → Erde → All, mit weicher Kamerafahrt.
   - Übergang Gym → Imperium: Kamera startet tief zwischen den Häusern (Blick aus dem Gym-Fenster) und steigt hoch.
   Leistung: wenige Zeichenaufrufe (Häuser/Bäume/Autos als InstancedMesh), Auflösung auf dem Handy reduziert, max. 30 Bilder/s. */
import * as THREE from 'three';
import { tm, glow, box, cyl, ball, panel, canvasTex, rng } from './parts3d.js';
import { inked, U } from './toon.js';

const MK = window.MK;
const COL = { pfand: '#2f6f45', shake: '#ff8fab', pt: '#f4a259', merch: '#5bc0be', coach: '#9d8df1', supp: '#e07a5f', kette: '#f2c14e', app: '#4ea8de', tv: '#b8c0cc', konzern: '#8d99ae', space: '#3d405b' };
const BLK = 8, ROAD = 2.2, CELL = BLK + ROAD, N = 9; // 9×9 Blöcke
const upsOf = id => MK.S.bizUp.filter(u => u.startsWith(id + ':')).length;
// Blöcke in einer Spirale um die Mitte – Geschäft i bekommt Block i
const SPIRAL = (() => { const out = [[0, 0]]; let x = 0, y = 0, dx = 1, dy = 0, len = 1; while (out.length < N * N) { for (let k = 0; k < 2; k++) { for (let i = 0; i < len; i++) { x += dx; y += dy; if (Math.abs(x) <= 4 && Math.abs(y) <= 4) out.push([x, y]); } [dx, dy] = [-dy, dx]; } len++; } return out; })();
const blockPos = ([i, j]) => [i * CELL, j * CELL];
const BIZ_BLOCK = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]; // Spiral-Index je Geschäft (Mitte bleibt Platz/Park)

let S = null; // Zustand der Stadt-Szene
function winTex(lit) { return canvasTex('cwin' + lit, 64, 128, (x, w, h) => { x.fillStyle = lit ? '#000' : '#cfd8e0'; x.fillRect(0, 0, w, h); const R = rng(lit ? 5 : 6);
  for (let r = 0; r < 8; r++) for (let i = 0; i < 4; i++) { const on = R() < .65; x.fillStyle = lit ? (on ? (R() < .5 ? '#ffe9a0' : '#cfe8ff') : '#000') : '#5a7488'; x.fillRect(4 + i * 15, 4 + r * 15.5, 10, 10); } }); }
function signTex(B) { return canvasTex('csign' + B.id, 256, 96, (x, w, h) => { x.fillStyle = '#141414'; x.fillRect(0, 0, w, h); x.strokeStyle = COL[B.id]; x.lineWidth = 8; x.strokeRect(4, 4, w - 8, h - 8);
  x.font = '56px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(B.icon, w * .2, h * .55); x.fillStyle = '#fff'; x.font = `700 ${h * .32}px Arial`; x.fillText(B.name.split(' ')[0].slice(0, 9), w * .6, h * .55); }, { clamp: true }); }

/* ---------- ein Geschäfts-Gebäude je nach Ausbau ---------- */
function bizBuilding(B, n, u) {
  const g = new THREE.Group(), col = COL[B.id], C = tm(col), WALL = tm('#f1ece2'), DARK = tm('#2c2f36');
  const lit = new THREE.MeshToonMaterial({ color: '#ffffff', map: winTex(false).clone(), emissive: '#ffffff', emissiveMap: winTex(true).clone(), emissiveIntensity: 0 }); lit.map.needsUpdate = lit.emissiveMap.needsUpdate = true; g.userData.lit = [lit];
  const signM = new THREE.MeshBasicMaterial({ map: signTex(B) }), hMul = 1 + Math.log2(1 + n) * .12;
  if (u === 0) { // Bude: kleiner Stand mit gestreiftem Vordach
    box(g, WALL, 0, .7, 0, 2.4, 1.4, 1.8); box(g, C, 0, 1.55, .6, 2.7, .12, 1.1).rotation.x = .25; box(g, DARK, 0, .55, .92, 2, .5, .05, 0);
    const s = new THREE.Mesh(new THREE.BoxGeometry(1.8, .55, .05), signM); s.position.set(0, 1.85, .2); g.add(s); }
  else if (u <= 2) { // Laden: Schaufenster, Schild, Markise
    const h = 2.6 * hMul; box(g, C, 0, h / 2, 0, 4, h, 3.6); box(g, tm('#bfe6ff', { emissive: '#203a50' }), 0, 1, 1.81, 3.2, 1.4, .04, 0); box(g, C, 0, 2.1, 2.1, 3.8, .1, .7).rotation.x = .3;
    const s = new THREE.Mesh(new THREE.BoxGeometry(3, .9, .08), signM); s.position.set(0, h + .3, .4); g.add(s); box(g, DARK, 0, h + .02, 0, 4.1, .08, 3.7, 0); }
  else if (u <= 4) { // Haus mit mehreren Etagen
    const h = (4 + u) * hMul, m = [C, C, DARK, DARK, lit, lit]; const b = box(g, C, 0, h / 2, 0, 4.4, h, 4.2); b.material = m; lit.map.repeat.set(2, Math.max(1, Math.round(h / 1.6))); lit.emissiveMap.repeat.copy(lit.map.repeat); lit.map.wrapS = lit.map.wrapT = lit.emissiveMap.wrapS = lit.emissiveMap.wrapT = THREE.RepeatWrapping;
    const s = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1, .1), signM); s.position.set(0, h + .7, 0); g.add(s); [-1, 1].forEach(k => box(g, DARK, k * 1.3, h + .2, 0, .08, .5, .08, 0)); }
  else { // Hochhaus
    const h = (7 + (u - 5) * 2.5) * hMul, m = [lit, lit, DARK, DARK, lit, lit]; const b = box(g, tm('#9fb3c8'), 0, h / 2, 0, 4, h, 4); b.material = m;
    lit.map.repeat.set(2, Math.round(h / 1.4)); lit.emissiveMap.repeat.copy(lit.map.repeat); lit.map.wrapS = lit.map.wrapT = lit.emissiveMap.wrapS = lit.emissiveMap.wrapT = THREE.RepeatWrapping;
    box(g, C, 0, h + .25, 0, 4.2, .5, 4.2); const s = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.1, .1), signM); s.position.set(0, h + 1.1, 1.6); g.add(s);
    cyl(g, DARK, 1.2, h + 1.5, -1.2, .05, 2.2, null, .5); ball(g, glow('#ff4040'), 1.2, h + 2.65, -1.2, .12, 0); }
  // Wahrzeichen
  if (B.id === 'tv' && u >= 1) { cyl(g, tm('#c9ced4'), 3.2, 4, -2.6, .18, 8, null, .7); ball(g, tm('#c9ced4'), 3.2, 7.6, -2.6, .8, .7); cyl(g, tm('#d83a32'), 3.2, 8.9, -2.6, .05, 1.6, null, .5); }
  if (B.id === 'space') { cyl(g, tm('#9aa0a8'), -2.6, .05, 2.4, 1.3, .1, null, .5); cyl(g, tm('#f4f1ea'), -2.6, 1.6, 2.4, .35, 3, null, .8); const nose = inked(new THREE.ConeGeometry(.35, .8, 14), tm('#d83a32'), .8); nose.position.set(-2.6, 3.5, 2.4); g.add(nose); }
  g.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  g.userData.h = g.children.reduce((a, o) => Math.max(a, o.position.y), 0);
  return g;
}

/* ---------- Szene aufbauen (einmal; Gebäude werden bei Änderungen ausgetauscht) ---------- */
function build() {
  const scene = new THREE.Scene(), cam = new THREE.OrthographicCamera(-10, 10, 10, -10, -200, 400);
  const hemi = new THREE.HemisphereLight('#fff4e2', '#5a6a40', 1.1), sun = new THREE.DirectionalLight('#fff1d6', 2); sun.position.set(-30, 50, 20); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 200 }); sun.shadow.camera.updateProjectionMatrix(); scene.add(hemi, sun, sun.target);
  const city = new THREE.Group(); scene.add(city);
  // Boden: Gras, Straßen-Raster, Gehwege
  const span = N * CELL; const grass = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), tm('#7fb069', { rim: false })); grass.rotation.x = -Math.PI / 2; grass.receiveShadow = true; city.add(grass);
  const roadM = tm('#55585e', { rim: false }), walkM = tm('#c9c3b5', { rim: false }), lineM = glow('#f0e08a');
  for (let k = 0; k <= N; k++) { const p = (k - N / 2) * CELL; [0, 1].forEach(dir => { const r = new THREE.Mesh(new THREE.BoxGeometry(dir ? ROAD : span, .02, dir ? span : ROAD), roadM); r.position.set(dir ? p : 0, .01, dir ? 0 : p); r.receiveShadow = true; city.add(r);
    const l = new THREE.Mesh(new THREE.BoxGeometry(dir ? .08 : span, .025, dir ? span : .08), lineM); l.position.set(dir ? p : 0, .02, dir ? 0 : p); city.add(l); }); }
  SPIRAL.forEach(b => { const [x, z] = blockPos(b); const w = new THREE.Mesh(new THREE.BoxGeometry(BLK, .06, BLK), walkM); w.position.set(x, .03, z); w.receiveShadow = true; city.add(w); });
  // Wohnhäuser (Instanzen), Bäume, Laternen, Autos
  const R = rng(42), houses = [], trees = [], lamps = [];
  SPIRAL.forEach((b, bi) => { if (bi <= 11) return; const [x, z] = blockPos(b); for (let i = 0; i < 4; i++) { const hx = x + (i % 2 ? 1.9 : -1.9), hz = z + (i < 2 ? -1.9 : 1.9); if (R() < .82) houses.push([hx, hz, 1.2 + R() * (Math.hypot(x, z) < 20 ? 4 : 2), bi]); else trees.push([hx, hz]); } });
  SPIRAL.forEach((b, bi) => { const [x, z] = blockPos(b); [[-1, -1], [1, 1]].forEach(([sx, sz]) => lamps.push([x + sx * (BLK / 2 + .2), z + sz * (BLK / 2 + .2), bi])); if (bi === 0) for (let i = 0; i < 6; i++) trees.push([x + Math.cos(i) * 2.5, z + Math.sin(i) * 2.5]); });
  const hm = new THREE.InstancedMesh(new THREE.BoxGeometry(3, 1, 3), tm('#efe6d4'), houses.length), roofM = new THREE.InstancedMesh(new THREE.ConeGeometry(2.4, 1.3, 4), tm('#c4553a'), houses.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3(), roofCols = ['#c4553a', '#5a6f8a', '#7a5a3a', '#4a7a5a', '#8a3a3a'].map(c => new THREE.Color(c));
  houses.forEach(([x, z, h], i) => { m4.compose(ps.set(x, h / 2, z), q.identity(), sc.set(1, h, 1)); hm.setMatrixAt(i, m4); m4.compose(ps.set(x, h + .65, z), q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 4), sc.set(1, 1, 1)); roofM.setMatrixAt(i, m4); roofM.setColorAt(i, roofCols[i % 5]); });
  hm.castShadow = hm.receiveShadow = roofM.castShadow = true; city.add(hm, roofM);
  const tr = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), tm('#2f7a3a'), trees.length), trk = new THREE.InstancedMesh(new THREE.CylinderGeometry(.15, .15, 1, 6), tm('#6b4a2b'), trees.length);
  trees.forEach(([x, z], i) => { const s = .8 + R() * .5; m4.compose(ps.set(x, 1.2 + s * .5, z), q.identity(), sc.set(s, s * 1.1, s)); tr.setMatrixAt(i, m4); m4.compose(ps.set(x, .5, z), q.identity(), sc.set(1, 1, 1)); trk.setMatrixAt(i, m4); });
  tr.castShadow = trk.castShadow = true; city.add(tr, trk);
  const lampOn = new THREE.MeshBasicMaterial({ color: '#fff3c0', transparent: true, opacity: 0 }), lp = new THREE.InstancedMesh(new THREE.CylinderGeometry(.06, .06, 1.6, 5), tm('#2c2f36'), lamps.length), lb = new THREE.InstancedMesh(new THREE.SphereGeometry(.18, 8, 6), lampOn, lamps.length);
  lamps.forEach(([x, z], i) => { m4.compose(ps.set(x, .8, z), q.identity(), sc.set(1, 1, 1)); lp.setMatrixAt(i, m4); m4.compose(ps.set(x, 1.65, z), q.identity(), sc.set(1, 1, 1)); lb.setMatrixAt(i, m4); }); city.add(lp, lb);
  // Autos: fahren auf den Straßen hin und her (Spuren je Richtung)
  const NC = 26, carM = new THREE.InstancedMesh(new THREE.BoxGeometry(1, .45, .55), tm('#ffffff'), NC), carTop = new THREE.InstancedMesh(new THREE.BoxGeometry(.55, .3, .5), tm('#1d1f24'), NC), cars = [];
  const cc = ['#ff5a36', '#ffc83d', '#fbf5e6', '#4ea8de', '#2bb673', '#9d8df1'].map(c => new THREE.Color(c));
  for (let i = 0; i < NC; i++) { const dir = i % 2, lane = Math.floor(R() * (N + 1)), p = (lane - N / 2) * CELL, sign = R() < .5 ? 1 : -1; cars.push({ dir, p: p + sign * .45, sign, s: R() * span, v: 3 + R() * 3 }); carM.setColorAt(i, cc[i % cc.length]); }
  carM.castShadow = true; city.add(carM, carTop);
  // Land: Nachbarstädte + Autobahnen (ab Stufe 4); Erde und All (Stufe 5/6)
  const land = new THREE.Group(); city.add(land); { const rr = rng(7), towns = new THREE.InstancedMesh(new THREE.BoxGeometry(2, 1, 2), tm('#e9e2d2'), 9 * 60); let k = 0;
    for (let t = 0; t < 9; t++) { const a = t / 9 * Math.PI * 2 + rr() * .4, d = 130 + rr() * 90, tx = Math.cos(a) * d, tz = Math.sin(a) * d;
      const hw = new THREE.Mesh(new THREE.BoxGeometry(d, .05, 2.6), roadM); hw.position.set(tx / 2, .02, tz / 2); hw.rotation.y = -a; land.add(hw);
      for (let i = 0; i < 60; i++) { const aa = rr() * Math.PI * 2, dd = Math.sqrt(rr()) * 22, h = 1 + rr() * 5; m4.compose(ps.set(tx + Math.cos(aa) * dd, h / 2, tz + Math.sin(aa) * dd), q.identity(), sc.set(1, h, 1)); towns.setMatrixAt(k++, m4); } }
    land.add(towns); }
  const globe = new THREE.Group(); scene.add(globe); globe.visible = false;
  { const earthTex = canvasTex('earth', 512, 256, (x, w, h) => { x.fillStyle = '#2a6fbf'; x.fillRect(0, 0, w, h); const r = rng(3); x.fillStyle = '#7fb069'; for (let i = 0; i < 14; i++) { x.beginPath(); x.ellipse(r() * w, h * (.2 + r() * .6), 20 + r() * 60, 12 + r() * 30, r() * 3, 0, 7); x.fill(); } x.fillStyle = '#f4f7fa'; x.fillRect(0, 0, w, 14); x.fillRect(0, h - 14, w, 14); });
    const e = inked(new THREE.SphereGeometry(10, 40, 28), new THREE.MeshToonMaterial({ map: earthTex }), 1); globe.add(e); globe.userData.earth = e;
    const dots = new THREE.InstancedMesh(new THREE.SphereGeometry(.35, 8, 6), glow('#ffe9a0'), 40); for (let i = 0; i < 40; i++) { const u = i * 2.39996, v = Math.acos(1 - 2 * ((i * .618) % 1)); m4.compose(ps.setFromSphericalCoords(10.1, v, u), q.identity(), sc.set(1, 1, 1)); dots.setMatrixAt(i, m4); } e.add(dots); globe.userData.dots = dots;
    const st = new THREE.Group(); box(st, tm('#c9ced4'), 0, 0, 0, 2.4, .6, .6); [-1, 1].forEach(s => box(st, tm('#2f6fd1', { emissive: '#0a2a6a' }), s * 2.4, 0, 0, 2.2, .05, 1.2, .6)); globe.add(st); globe.userData.station = st;
    const sp = new Float32Array(600 * 3), r2 = rng(9); for (let i = 0; i < 600; i++) { const v = new THREE.Vector3().setFromSphericalCoords(150 + r2() * 50, Math.acos(2 * r2() - 1), r2() * Math.PI * 2); sp.set([v.x, v.y, v.z], i * 3); }
    const stars = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)), new THREE.PointsMaterial({ color: '#ffffff', size: 1.4, sizeAttenuation: false })); globe.add(stars); globe.userData.stars = stars; }
  return { scene, cam, hemi, sun, city, land, globe, cars, carM, carTop, span, lampOn, bld: {}, sig: {}, pop: {}, cur: null, fly: 0 };
}

/* ---------- Kamera je Zoom-Stufe ---------- */
const VIEW = [ { r: 11, mode: 'city' }, { r: 18, mode: 'city' }, { r: 28, mode: 'city' }, { r: 42, mode: 'city' }, { r: 150, mode: 'land' }, { r: 16, mode: 'globe' }, { r: 40, mode: 'globe' } ];
export function cityFrame(R, L) {
  if (!S) { S = build(); MK.on('biz', e => { S.pop[e.B.id] = performance.now(); }); }
  const now = performance.now(), dt = Math.min(.1, (now - (S.last || now)) / 1000); S.last = now;
  // Gebäude aktualisieren, wenn sich Anzahl oder Ausbau ändert
  MK.BIZ.forEach((B, i) => { const n = MK.bizCount(B.id), u = upsOf(B.id), sig = n ? u + ':' + Math.round(Math.log2(1 + n) * 3) : '';
    if (S.sig[B.id] === sig) return; S.sig[B.id] = sig; const old = S.bld[B.id]; if (old) { S.city.remove(old); old.traverse(o => { if (o.geometry && o.geometry.type !== 'BoxGeometry') o.geometry.dispose(); }); delete S.bld[B.id]; }
    if (!n) return; const g = bizBuilding(B, n, u), [x, z] = blockPos(SPIRAL[BIZ_BLOCK[i]]); g.position.set(x, 0, z); g.rotation.y = (i % 4) * Math.PI / 2 * 0 + Math.PI * .0; S.city.add(g); S.bld[B.id] = g;
    // Filialen: kleine Kopien rund um den Block (zeigen die Anzahl)
    const sm = Math.min(6, Math.floor(Math.log2(1 + n))); for (let k = 0; k < sm; k++) { const a = k / 6 * Math.PI * 2 + .4, f = box(g, tm(COL[B.id]), Math.cos(a) * 3.2, .35, Math.sin(a) * 3.2, .7, .7, .7, .6); f.castShadow = true; } });
  // Tag/Nacht nach echter Uhrzeit (gleiche Phase wie im Gym)
  const p = MK.Scene.dayPhase(), nk = p > .66 ? Math.min(1, (p - .66) / .08) * (p > .95 ? Math.min(1, (1 - p) / .05) : 1) : p < .04 ? (.04 - p) / .04 * .6 : 0;
  S.hemi.color.set(nk > .5 ? '#8a98c8' : p > .52 && p < .74 ? '#ffd2b0' : '#fff4e2'); S.hemi.intensity = 1.1 - nk * .55; S.sun.intensity = 2 - nk * 1.5; S.sun.color.set(p > .52 && p < .74 ? '#ffb070' : '#fff1d6');
  S.lampOn.opacity = nk; Object.values(S.bld).forEach(g => (g.userData.lit || []).forEach(m => { m.emissiveIntensity = nk * 1.2; }));
  // Autos
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), ps = new THREE.Vector3(), sc = new THREE.Vector3(1, 1, 1), half = S.span / 2;
  S.cars.forEach((c, i) => { c.s = (c.s + c.v * dt * (L.reduce ? 0 : 1)) % S.span; const t = c.sign > 0 ? c.s - half : half - c.s, x = c.dir ? c.p : t, z = c.dir ? t : c.p, yaw = c.dir ? (c.sign > 0 ? -Math.PI / 2 : Math.PI / 2) : (c.sign > 0 ? 0 : Math.PI);
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw); m4.compose(ps.set(x, .3, z), q, sc); S.carM.setMatrixAt(i, m4); m4.compose(ps.set(x - Math.cos(yaw) * .05, .62, z + Math.sin(yaw) * .05), q, sc); S.carTop.setMatrixAt(i, m4); });
  S.carM.instanceMatrix.needsUpdate = S.carTop.instanceMatrix.needsUpdate = true;
  // Hochploppen beim Kauf (Feder)
  Object.entries(S.pop).forEach(([id, t0]) => { const g = S.bld[id], a = (now - t0) / 1000; if (!g || a > 1) { if (g) g.scale.set(1, 1, 1); delete S.pop[id]; return; }
    const k = a < .12 ? a / .12 * .35 : .35 * Math.exp(-(a - .12) * 5) * Math.cos((a - .12) * 16); g.scale.set(1 - k * .3, 1 + k, 1 - k * .3); });
  // Kamera: weich zur Zoom-Stufe, beim Betreten aus dem „Gym-Fenster" hoch
  const V = VIEW[Math.max(0, Math.min(6, L.st))]; if (!S.cur) S.cur = { r: V.r, mode: V.mode };
  if (L.enter) S.fly = 1;
  if (V.mode !== S.cur.mode) { const toGlobe = V.mode === 'globe', fromGlobe = S.cur.mode === 'globe'; S.cur.mode = V.mode; if (toGlobe !== fromGlobe) S.cur.r = V.r * (toGlobe ? .45 : 1.8); } // Wechsel Stadt ↔ Erde während des Stufen-Blitzes
  S.cur.r += (V.r - S.cur.r) * Math.min(1, dt * 1.6);
  const fly = S.fly = Math.max(0, S.fly - dt / 1.6), fk = fly * fly * (3 - 2 * fly), aspect = L.W / L.H, r = S.cur.r * (1 - fk * .55);
  const globeOn = S.cur.mode === 'globe'; S.city.visible = !globeOn; S.globe.visible = globeOn; S.land.visible = S.cur.mode === 'land' || S.cur.r > 60;
  const cam = S.cam; cam.left = -r * aspect; cam.right = r * aspect; cam.top = r; cam.bottom = -r; cam.updateProjectionMatrix();
  if (globeOn) { const g = S.globe.userData, t = now / 1000; g.earth.rotation.y = t * .08; g.station.position.set(Math.cos(t * .5) * 15, Math.sin(t * .5) * 4, Math.sin(t * .5) * 15); g.station.rotation.y = -t * .5; cam.position.set(40, 18, 40); cam.lookAt(0, 0, 0); S.sun.position.set(-30, 30, 40); }
  else { const pitch = .62 - fk * .5, yaw = Math.PI / 4 + fk * .5, d = 120; cam.position.set(Math.sin(yaw) * Math.cos(pitch) * d, Math.sin(pitch) * d * (1 - fk * .6) + fk * 1.2, Math.cos(yaw) * Math.cos(pitch) * d); cam.lookAt(0, fk * 2, 0); S.sun.position.set(-30, 50, 20); }
  // Rendern
  const pr = Math.min(L.dpr, L.q === 'hoch' ? 1.5 : 1);
  if (R.getPixelRatio() !== pr) R.setPixelRatio(pr); const sz = R.getSize(new THREE.Vector2()); if (sz.x !== L.W || sz.y !== L.H) R.setSize(L.W, L.H, false);
  R.getDrawingBufferSize(U.uRes.value); U.uW.value = 1.4 * pr;
  R.shadowMap.enabled = L.q === 'hoch'; R.setClearColor(globeOn ? '#05060f' : '#7fb069', 1);
  R.render(S.scene, cam); R.setClearColor(0x000000, 0);
  return { cv: R.domElement, fly };
}
