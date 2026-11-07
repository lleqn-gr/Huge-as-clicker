/* Muskelklicker 3D – Imperium: Mini-Stadt, die mit JEDEM Kauf wächst.
   Ebenen: Block → Stadt (pro Kauf ein Gebäude des Geschäfts) → Land (pro Kauf eine neue Stadt)
           → Erde (pro Kauf ein neues Land) → All (pro Kauf ein neuer Planet).
   Füllt das Gezeigte den Bildausschnitt, zoomt die Kamera weich heraus. Neues „ploppt" kurz hoch.
   Die Stadt ist natürlich und etwas zufällig (geschwungene Straßen, Ringe, Fluss, Parks, unregelmäßiger Rand),
   aber FEST: der Zufall hängt am Spielstand (S.created) – gleicher Spielstand = gleiche Stadt.
   Leistung: Gebäude, Häuser, Bäume, Autos, Länder, Planeten als InstancedMesh (wenige Zeichenaufrufe),
   Obergrenzen je Ebene, Matrizen nur bei Änderungen neu; gerendert nur solange das Imperium sichtbar ist. */
import * as THREE from 'three';
import { tm, glow, box, cyl, ball, canvasTex, rng } from './parts3d.js';
import { inked, toon, outlineMat, U } from './toon.js';

const MK = window.MK;
const COL = { pfand: '#2f6f45', shake: '#ff8fab', pt: '#f4a259', merch: '#5bc0be', coach: '#9d8df1', supp: '#e07a5f', kette: '#f2c14e', app: '#4ea8de', tv: '#b8c0cc', konzern: '#8d99ae', space: '#3d405b' };
const CITY_CAP = 150, LAND_CAP = 60, EARTH_CAP = 160, SPACE_CAP = 600;
export const LEVEL_STAGE = [0, 2, 4, 5, 6]; // Ebene → Index der Stufen-Namen in empire.js (Block, Stadt, Land, Welt, All)
const upsOf = id => MK.S.bizUp.filter(u => u.startsWith(id + ':')).length;
const TAU = Math.PI * 2, clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const UPV = new THREE.Vector3(0, 1, 0);
let S = null;

/* ---------- Hilfen ---------- */
function instInked(geo, mat, n, k) { // Instanzen mit Comic-Umriss (der Umriss teilt sich die Matrizen)
  const m = new THREE.InstancedMesh(geo, mat, n); m.count = 0; m.castShadow = m.receiveShadow = true; m.frustumCulled = false;
  const o = new THREE.InstancedMesh(geo, outlineMat(k || 1), n); o.instanceMatrix = m.instanceMatrix; o.count = 0; o.frustumCulled = false; m.add(o); m.userData.ol = o; return m; }
const setCount = (m, n) => { m.count = n; if (m.userData.ol) m.userData.ol.count = n; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; };
function ribbon(pts, w, y) { const pos = [], idx = [];
  for (let i = 0; i < pts.length; i++) { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]; let dx = b[0] - a[0], dz = b[1] - a[1]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
    pos.push(pts[i][0] - dz * w / 2, y, pts[i][1] + dx * w / 2, pts[i][0] + dz * w / 2, y, pts[i][1] - dx * w / 2); if (i) { const k = (i - 1) * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g; }
function merge(geos) { const pos = [], idx = []; let off = 0; geos.forEach(g => { const p = g.attributes.position.array, ix = g.index.array; for (let i = 0; i < p.length; i++) pos.push(p[i]); for (let i = 0; i < ix.length; i++) idx.push(ix[i] + off); off += p.length / 3; g.dispose(); });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g; }
const flatMat = col => { const m = toon(col, { rim: false }); m.side = THREE.DoubleSide; return m; };
const distPts = (x, z, pts) => { let d = 1e9; for (const p of pts) { const q = (p[0] - x) ** 2 + (p[1] - z) ** 2; if (q < d) d = q; } return Math.sqrt(d); };
function winTex(lit) { return canvasTex('cwin' + lit, 64, 128, (x, w, h) => { x.fillStyle = lit ? '#000' : '#e8e2d4'; x.fillRect(0, 0, w, h); const R = rng(lit ? 5 : 6);
  for (let r = 0; r < 8; r++) for (let i = 0; i < 4; i++) { const on = R() < .65; x.fillStyle = lit ? (on ? (R() < .5 ? '#ffe9a0' : '#cfe8ff') : '#000') : '#5a7488'; x.fillRect(4 + i * 15, 4 + r * 15.5, 10, 10); } }); }
function signTex(B) { return canvasTex('csign' + B.id, 256, 96, (x, w, h) => { x.fillStyle = '#141414'; x.fillRect(0, 0, w, h); x.strokeStyle = COL[B.id]; x.lineWidth = 8; x.strokeRect(4, 4, w - 8, h - 8);
  x.font = '56px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(B.icon, w * .2, h * .55); x.fillStyle = '#fff'; x.font = `700 ${h * .32}px Arial`; x.fillText(B.name.split(' ')[0].slice(0, 9), w * .6, h * .55); }, { clamp: true }); }
const winMat = () => { const m = new THREE.MeshToonMaterial({ color: '#ffffff', map: winTex(false).clone(), emissive: '#ffffff', emissiveMap: winTex(true).clone(), emissiveIntensity: 0 });
  m.map.wrapS = m.map.wrapT = m.emissiveMap.wrapS = m.emissiveMap.wrapT = THREE.RepeatWrapping; m.map.needsUpdate = m.emissiveMap.needsUpdate = true; return m; };

/* ---------- Stadtplan (fest aus dem Spielstand) ---------- */
function layout(seed) {
  const R = rng(seed), RAD = 46, p1 = R() * TAU, p2 = R() * TAU, a0 = R() * TAU;
  const edge = a => RAD * (.74 + .16 * Math.sin(a * 3 + p1) + .1 * Math.sin(a * 5 + p2));
  const roads = [];
  const nMain = 5 + Math.floor(R() * 2);
  for (let i = 0; i < nMain; i++) { const a = a0 + i * TAU / nMain + (R() - .5) * .5, ph = R() * 6, pts = [];
    for (let d = 4; d <= edge(a) * 1.08; d += 2) { const w = Math.sin(d * .09 + ph) * .38 * (d / RAD); pts.push([Math.cos(a + w) * d, Math.sin(a + w) * d]); } roads.push({ pts, w: 2.4, main: 1 }); }
  [.42, .78].forEach(k => { const pts = [], ph = R() * 6; for (let t = 0; t <= TAU + .001; t += .07) { const rr = k * edge(t) * (1 + .05 * Math.sin(t * 7 + ph)); pts.push([Math.cos(t) * rr, Math.sin(t) * rr]); } roads.push({ pts, w: 2, ring: 1 }); });
  const ra = R() * Math.PI, rph = R() * 6, river = []; for (let d = -RAD * 1.6; d <= RAD * 1.6; d += 2) { const o = Math.sin(d * .06 + rph) * 7 + RAD * .55; river.push([Math.cos(ra) * d - Math.sin(ra) * o, Math.sin(ra) * d + Math.cos(ra) * o]); }
  const parks = []; for (let i = 0; i < 5; i++) { const a = R() * TAU, d = (.25 + R() * .5) * edge(a); parks.push({ x: Math.cos(a) * d, z: Math.sin(a) * d, r: 3 + R() * 3 }); }
  const roadPts = roads.flatMap(r => r.pts.map(p => [p[0], p[1], r.w]));
  const nearRoad = (x, z, m) => roadPts.some(p => (p[0] - x) ** 2 + (p[1] - z) ** 2 < (p[2] / 2 + m) ** 2);
  const lots = [];
  roads.forEach(rd => { for (let j = 1; j < rd.pts.length - 1; j += 2) { const p = rd.pts[j], q = rd.pts[j + 1]; let tx = q[0] - p[0], tz = q[1] - p[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
    [-1, 1].forEach(sd => { const off = rd.w / 2 + 2 + R() * .7, x = p[0] - tz * sd * off, z = p[1] + tx * sd * off, d = Math.hypot(x, z), a = Math.atan2(z, x);
      if (d < 7 || d > edge(a) || distPts(x, z, river) < 5.2 || parks.some(k => Math.hypot(k.x - x, k.z - z) < k.r + 1.6) || nearRoad(x, z, 1.1) || lots.some(o => (o.x - x) ** 2 + (o.z - z) ** 2 < 10.2)) return;
      lots.push({ x, z, d, a, rot: Math.atan2(tx, tz) + (R() - .5) * .25, w: 2 + R() * .9, dp: 2 + R() * .8, r: R() }); }); } });
  lots.sort((A, B) => A.d - B.d);
  const nb = MK.BIZ.length, dist = MK.BIZ.map(() => []);
  lots.forEach(o => { const s = Math.floor((((o.a - a0) % TAU) + TAU) % TAU / (TAU / nb)); dist[Math.min(nb - 1, s)].push(o); });
  const trees = []; for (let i = 0; i < 900 && trees.length < 320; i++) { const a = R() * TAU, d = Math.sqrt(R()) * edge(a) * 1.3, x = Math.cos(a) * d, z = Math.sin(a) * d, inPark = parks.some(k => Math.hypot(k.x - x, k.z - z) < k.r);
    if (!inPark && R() < .5) continue; if (d < 6 || nearRoad(x, z, .8) || distPts(x, z, river) < 3.4 || lots.some(o => (o.x - x) ** 2 + (o.z - z) ** 2 < 4.5)) continue; trees.push([x, z, .7 + R() * .6]); }
  return { R, RAD, edge, roads, river, parks, lots, dist, trees, a0 };
}

/* ---------- Hauptgebäude je Geschäft (erster Kauf, wächst mit dem Ausbau) ---------- */
function hero(B, u) {
  const g = new THREE.Group(), C = tm(COL[B.id]), DARK = tm('#2c2f36'), signM = new THREE.MeshBasicMaterial({ map: signTex(B) }), lit = [];
  if (u === 0) { box(g, tm('#f1ece2'), 0, .7, 0, 2.4, 1.4, 1.8); box(g, C, 0, 1.55, .6, 2.7, .12, 1.1).rotation.x = .25; const s = new THREE.Mesh(new THREE.BoxGeometry(1.8, .55, .05), signM); s.position.set(0, 1.85, .2); g.add(s); }
  else if (u <= 2) { box(g, C, 0, 1.3, 0, 4, 2.6, 3.4); box(g, tm('#bfe6ff', { emissive: '#203a50' }), 0, 1, 1.71, 3.2, 1.4, .04, 0); const s = new THREE.Mesh(new THREE.BoxGeometry(3, .9, .08), signM); s.position.set(0, 2.9, .4); g.add(s); }
  else { const h = u <= 4 ? 4 + u * 1.2 : 8 + (u - 5) * 3, m = winMat(); lit.push(m); m.map.repeat.set(2, Math.round(h / 1.5)); m.emissiveMap.repeat.copy(m.map.repeat); const b = box(g, u <= 4 ? C : tm('#9fb3c8'), 0, h / 2, 0, 4, h, 4); b.material = [m, m, DARK, DARK, m, m];
    box(g, C, 0, h + .25, 0, 4.2, .5, 4.2); const s = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.1, .1), signM); s.position.set(0, h + 1.1, 1.6); g.add(s); if (u >= 5) { cyl(g, DARK, 1.2, h + 1.5, -1.2, .05, 2.2, null, .5); ball(g, glow('#ff4040'), 1.2, h + 2.65, -1.2, .12, 0); } }
  if (B.id === 'tv' && u >= 1) { cyl(g, tm('#c9ced4'), 3.2, 4, -2.6, .18, 8, null, .7); ball(g, tm('#c9ced4'), 3.2, 7.6, -2.6, .8, .7); }
  if (B.id === 'space') { cyl(g, tm('#f4f1ea'), -2.6, 1.6, 2.4, .35, 3, null, .8); const nose = inked(new THREE.ConeGeometry(.35, .8, 14), tm('#d83a32'), .8); nose.position.set(-2.6, 3.5, 2.4); g.add(nose); }
  g.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; }); g.userData.lit = lit; g.scale.setScalar(.72); return g;
}

/* ---------- Szene aufbauen (einmal je Spielstand) ---------- */
function build(seed) {
  const L = layout(seed), R = L.R, scene = new THREE.Scene(), cam = new THREE.OrthographicCamera(-10, 10, 10, -10, -400, 800);
  const hemi = new THREE.HemisphereLight('#fff4e2', '#5a6a40', 1.1), sun = new THREE.DirectionalLight('#fff1d6', 2); sun.position.set(-30, 50, 20); sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 220 }); sun.shadow.camera.updateProjectionMatrix(); scene.add(hemi, sun, sun.target);
  const city = new THREE.Group(), land = new THREE.Group(), globe = new THREE.Group(), space = new THREE.Group(); scene.add(city, land, globe, space);
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), tm('#7fb069', { rim: false })); grass.rotation.x = -Math.PI / 2; grass.receiveShadow = true; scene.add(grass);
  city.add(new THREE.Mesh(ribbon(L.river, 6, .03), flatMat('#4f8fc9')));
  L.parks.forEach(k => { const p = new THREE.Mesh(new THREE.CircleGeometry(k.r, 24), flatMat('#6aa357')); p.rotation.x = -Math.PI / 2; p.position.set(k.x, .02, k.z); city.add(p); });
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(6, 32), flatMat('#d9cfbb')); plaza.rotation.x = -Math.PI / 2; plaza.position.y = .025; city.add(plaza);
  cyl(city, tm('#c9c3b5'), 0, .25, 0, 1.6, .5, null, .7); ball(city, glow('#7fd0ff'), 0, .55, 0, [1.3, .12, 1.3], 0);
  const roadM = new THREE.Mesh(merge(L.roads.map(r => ribbon(r.pts, r.w, .04))), flatMat('#5a5d63')); roadM.receiveShadow = true; city.add(roadM);
  city.add(new THREE.Mesh(merge(L.roads.filter(r => r.main).map(r => ribbon(r.pts, .12, .05))), flatMat('#f0e08a')));
  L.roads.forEach(r => r.pts.forEach((p, j) => { if (j % 2 === 0 && distPts(p[0], p[1], L.river) < 3) box(city, tm('#9a8f7a'), p[0], .12, p[1], r.w + .8, .2, r.w + .8, .4); })); // Brücken
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3();
  const tr = instInked(new THREE.SphereGeometry(1, 8, 6), tm('#2f7a3a'), L.trees.length, .6);
  L.trees.forEach(([x, z, s], i) => { m4.compose(ps.set(x, 1 + s * .6, z), q.identity(), sc.set(s, s * 1.15, s)); tr.setMatrixAt(i, m4); }); setCount(tr, L.trees.length); city.add(tr);
  const lampPos = []; L.roads.filter(r => r.main).forEach(r => r.pts.forEach((p, j) => { if (j % 4 === 2) lampPos.push([p[0] + 1.5, p[1] + 1.5]); }));
  const lampOn = new THREE.MeshBasicMaterial({ color: '#fff3c0', transparent: true, opacity: 0 }), lb = new THREE.InstancedMesh(new THREE.SphereGeometry(.22, 8, 6), lampOn, Math.max(1, lampPos.length));
  lampPos.forEach(([x, z], i) => { m4.compose(ps.set(x, 1.7, z), q.identity(), sc.set(1, 1, 1)); lb.setMatrixAt(i, m4); }); lb.count = lampPos.length; lb.frustumCulled = false; city.add(lb);
  // Gebäude je Geschäft als Instanzen: Wände mit Fenstern + Dach in Geschäftsfarbe
  const wall = winMat(); wall.map.repeat.set(1, 2); wall.emissiveMap.repeat.set(1, 2);
  const bodyG = new THREE.BoxGeometry(1, 1, 1); bodyG.translate(0, .5, 0);
  const biz = MK.BIZ.map((B, i) => { const n = Math.max(1, L.dist[i].length), body = instInked(bodyG, wall, n), roof = instInked(bodyG, tm(COL[B.id]), n, .6), base = new THREE.Color(COL[B.id]);
    for (let k = 0; k < n; k++) body.setColorAt(k, new THREE.Color('#ffffff').lerp(base, .15 + ((L.dist[i][k] || { r: .5 }).r) * .3)); city.add(body, roof); return { body, roof, shown: 0, u: -1, h: 1, hero: null, heroSig: '', pop: new Map() }; });
  // Autos
  const NC = 34, carM = instInked(new THREE.BoxGeometry(1, .45, .55), tm('#ffffff'), NC, .5), cars = [], cc = ['#ff5a36', '#ffc83d', '#fbf5e6', '#4ea8de', '#2bb673', '#9d8df1'].map(c => new THREE.Color(c));
  for (let i = 0; i < NC; i++) { const rd = L.roads[i % L.roads.length]; cars.push({ rd, s: R() * (rd.pts.length - 1), v: 1.4 + R() * 1.6, dir: R() < .5 ? 1 : -1, side: R() < .5 ? .5 : -.5 }); carM.setColorAt(i, cc[i % cc.length]); }
  setCount(carM, NC); city.add(carM);
  // Land: Nachbarstädte (je Kauf eine) + Autobahnen
  const towns = []; for (let i = 0; i < LAND_CAP; i++) { const a = i * 2.39996 + (R() - .5) * .6, d = 82 + Math.sqrt(i) * 34 + R() * 14, x = Math.cos(a) * d, z = Math.sin(a) * d, houses = [];
    const n = 9 + Math.floor(R() * 8), rr = 8 + R() * 6; for (let k = 0; k < n; k++) { const aa = R() * TAU, dd = Math.sqrt(R()) * rr; houses.push([x + Math.cos(aa) * dd, z + Math.sin(aa) * dd, 2 + R() * (k < 2 ? 10 : 5), R() * TAU]); } towns.push({ x, z, houses, rr }); }
  let hi = 0; towns.forEach(w => { w.h0 = hi; hi += w.houses.length; });
  const townM = instInked(bodyG, tm('#efe6d4'), hi, .5), townRoof = new THREE.InstancedMesh(new THREE.ConeGeometry(.75, .7, 4), tm('#ffffff'), hi); townRoof.frustumCulled = false; townRoof.count = 0;
  const roofCols = ['#c4553a', '#5a6f8a', '#7a5a3a', '#4a7a5a', '#8a3a3a'].map(c => new THREE.Color(c)); for (let k = 0; k < hi; k++) townRoof.setColorAt(k, roofCols[k % 5]);
  const hw = new THREE.Mesh(new THREE.BufferGeometry(), flatMat('#6d7176')); land.add(townM, townRoof, hw);
  // Erde: Länder als leuchtende Flecken
  const earthTex = canvasTex('earth', 512, 256, (x, w, h) => { x.fillStyle = '#2a6fbf'; x.fillRect(0, 0, w, h); const r = rng(3); x.fillStyle = '#7fb069'; for (let i = 0; i < 14; i++) { x.beginPath(); x.ellipse(r() * w, h * (.2 + r() * .6), 20 + r() * 60, 12 + r() * 30, r() * 3, 0, 7); x.fill(); } x.fillStyle = '#f4f7fa'; x.fillRect(0, 0, w, 14); x.fillRect(0, h - 14, w, 14); });
  const earth = inked(new THREE.SphereGeometry(10, 40, 28), new THREE.MeshToonMaterial({ map: earthTex }), 1); globe.add(earth);
  const countries = new THREE.InstancedMesh(new THREE.CylinderGeometry(.9, .9, .12, 6), new THREE.MeshBasicMaterial({ color: '#ffe9a0' }), EARTH_CAP); countries.count = 0; countries.frustumCulled = false; earth.add(countries);
  const cPos = []; for (let i = 0; i < EARTH_CAP; i++) { const y = 1 - 2 * (((i + .5) * .618034 + R() * .03) % 1), rr = Math.sqrt(Math.max(0, 1 - y * y)), th = i * 2.39996; cPos.push(new THREE.Vector3(Math.cos(th) * rr, y, Math.sin(th) * rr).normalize()); }
  // All: Planeten
  const plM = instInked(new THREE.SphereGeometry(1, 16, 12), tm('#ffffff'), SPACE_CAP, .6), pl = [], pc = ['#e07a5f', '#f2c14e', '#9d8df1', '#5bc0be', '#c9ced4', '#ff8fab'].map(c => new THREE.Color(c));
  for (let i = 0; i < SPACE_CAP; i++) { pl.push({ r: 18 + Math.sqrt(i) * 5.5, a: R() * TAU, y: (R() - .5) * 4, s: .5 + R() * 1.6, v: .05 + R() * .1 }); plM.setColorAt(i, pc[i % pc.length]); } space.add(plM);
  const sp = new Float32Array(900 * 3), r2 = rng(9); for (let i = 0; i < 900; i++) { const v = new THREE.Vector3().setFromSphericalCoords(260 + r2() * 80, Math.acos(2 * r2() - 1), r2() * TAU); sp.set([v.x, v.y, v.z], i * 3); }
  globe.add(new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)), new THREE.PointsMaterial({ color: '#ffffff', size: 1.4, sizeAttenuation: false })));
  return { L, scene, cam, hemi, sun, city, land, globe, space, earth, biz, wall, lampOn, cars, carM, towns, townM, townRoof, hw, countries, cPos, plM, pl, grass, shown: { towns: 0, countries: 0, planets: 0 }, pops: [], cur: null, fly: 0, level: -1 };
}

/* ---------- je Bild ---------- */
const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), sv = new THREE.Vector3(), pv = new THREE.Vector3();
const popK = t0 => { const a = (performance.now() - t0) / 1000; if (a >= .9) return 1; if (a < .12) return Math.max(.05, a / .12 * 1.3); return 1 + .3 * Math.exp(-(a - .12) * 5) * Math.cos((a - .12) * 16); };
function townHouses(w, s) { w.houses.forEach((hh, k) => { q4.setFromAxisAngle(UPV, hh[3]); m4.compose(pv.set(hh[0], 0, hh[1]), q4, sv.set(3.2 * s, hh[2] * s, 3.2 * s)); S.townM.setMatrixAt(w.h0 + k, m4);
  m4.compose(pv.set(hh[0], hh[2] * s + .7 * s, hh[1]), q4, sv.set(3 * s, 2 * s, 3 * s)); S.townRoof.setMatrixAt(w.h0 + k, m4); }); S.townM.instanceMatrix.needsUpdate = S.townRoof.instanceMatrix.needsUpdate = true; }
function bizInst(b, o, k, s) { const h = b.h * (.7 + o.r * .7); q4.setFromAxisAngle(UPV, o.rot);
  m4.compose(pv.set(o.x, 0, o.z), q4, sv.set(o.w * s, h * s, o.dp * s)); b.body.setMatrixAt(k, m4); m4.compose(pv.set(o.x, h * s, o.z), q4, sv.set(o.w * 1.08 * s, .3 * s, o.dp * 1.08 * s)); b.roof.setMatrixAt(k, m4); }

export function cityFrame(R, L) {
  const seed = Math.floor(((MK.S.created || 1) % 2147483646) + 1);
  if (!S || S.seed !== seed) { S = build(seed); S.seed = seed; }
  const now = performance.now(), dt = Math.min(.1, (now - (S.last || now)) / 1000); S.last = now;
  const counts = MK.BIZ.map(B => MK.bizCount(B.id)), N = counts.reduce((a, b) => a + b, 0);
  const level = N <= CITY_CAP ? (N <= 12 ? 0 : 1) : N <= CITY_CAP + LAND_CAP ? 2 : N <= CITY_CAP + LAND_CAP + EARTH_CAP ? 3 : 4;
  const fresh = S.level < 0; S.level = level;
  let ext = 9;
  // ---- Stadt: pro Kauf ein Gebäude im Bezirk des Geschäfts ----
  MK.BIZ.forEach((B, bi) => { const b = S.biz[bi], D = S.L.dist[bi], n = counts[bi], u = upsOf(B.id);
    const hs = n ? 'u' + u : ''; if (b.heroSig !== hs) { if (b.hero) S.city.remove(b.hero); b.hero = null; b.heroSig = hs;
      if (n && D[0]) { b.hero = hero(B, u); b.hero.position.set(D[0].x, 0, D[0].z); b.hero.rotation.y = D[0].rot; S.city.add(b.hero); if (!fresh) S.pops.push({ o: b.hero, t0: now, s: .72 }); } }
    if (n && D[0]) ext = Math.max(ext, D[0].d + 5);
    const want = Math.max(0, Math.min(n - 1, D.length - 1));
    if (want !== b.shown || b.u !== u) { b.h = [1.2, 1.6, 2.4, 3.4, 4.6, 6, 7.5, 9][Math.min(7, u)];
      for (let k = 0; k < want; k++) { bizInst(b, D[k + 1], k, 1); if (k >= b.shown && !fresh) b.pop.set(k, now); }
      b.shown = want; b.u = u; setCount(b.body, want); setCount(b.roof, want); }
    if (want) ext = Math.max(ext, D[want].d + 4);
    if (b.pop.size) { b.pop.forEach((t0, k) => { bizInst(b, D[k + 1], k, popK(t0)); if (now - t0 > 900) b.pop.delete(k); }); b.body.instanceMatrix.needsUpdate = b.roof.instanceMatrix.needsUpdate = true; } });
  // ---- Land: pro weiterem Kauf eine Stadt ----
  const nTowns = clamp(N - CITY_CAP, 0, LAND_CAP);
  if (nTowns !== S.shown.towns) { let nh = 0; for (let i = 0; i < nTowns; i++) { const w = S.towns[i]; townHouses(w, 1); nh = w.h0 + w.houses.length; if (i >= S.shown.towns && !fresh) S.pops.push({ town: w, t0: now }); }
    setCount(S.townM, nh); S.townRoof.count = nh; S.townRoof.instanceMatrix.needsUpdate = true; if (S.townRoof.instanceColor) S.townRoof.instanceColor.needsUpdate = true; S.shown.towns = nTowns;
    if (S.hw.geometry) S.hw.geometry.dispose(); const rr = rng(77);
    S.hw.geometry = nTowns ? merge(S.towns.slice(0, nTowns).map(w => { const pts = [], a = Math.atan2(w.z, w.x), d0 = S.L.edge(a) * .9, d1 = Math.hypot(w.x, w.z) - w.rr, ph = rr() * 6; for (let d = d0; d <= d1; d += 4) { const o = Math.sin(d * .03 + ph) * 6; pts.push([Math.cos(a) * d - Math.sin(a) * o, Math.sin(a) * d + Math.cos(a) * o]); } return ribbon(pts.length > 1 ? pts : [[0, 0], [w.x, w.z]], 2.6, .06); })) : new THREE.BufferGeometry(); }
  if (level >= 1) ext = Math.max(ext, S.L.RAD * (level >= 2 ? 1.1 : .2));
  if (nTowns) ext = Math.max(ext, ...S.towns.slice(0, nTowns).map(t => Math.hypot(t.x, t.z) + t.rr + 8));
  // ---- Erde: pro weiterem Kauf ein Land ----
  const nC = clamp(N - CITY_CAP - LAND_CAP, 0, EARTH_CAP);
  if (nC !== S.shown.countries) { for (let i = 0; i < nC; i++) { const p = S.cPos[i]; q4.setFromUnitVectors(UPV, p); m4.compose(pv.copy(p).multiplyScalar(10.02), q4, sv.set(1, 1, 1)); S.countries.setMatrixAt(i, m4); if (i >= S.shown.countries && !fresh) S.pops.push({ country: i, t0: now }); }
    S.countries.count = nC; S.countries.instanceMatrix.needsUpdate = true; S.shown.countries = nC; }
  // ---- All: pro weiterem Kauf ein Planet ----
  const nP = clamp(N - CITY_CAP - LAND_CAP - EARTH_CAP, 0, SPACE_CAP);
  if (nP !== S.shown.planets) { for (let i = S.shown.planets; i < nP; i++) if (!fresh) S.pops.push({ planet: i, t0: now }); S.shown.planets = nP; setCount(S.plM, nP); }
  if (nP && level === 4) { const t = now / 1000; for (let i = 0; i < nP; i++) { const p = S.pl[i], a = p.a + t * p.v, pp = S.pops.find(o => o.planet === i), s = p.s * (pp ? popK(pp.t0) : 1); m4.compose(pv.set(Math.cos(a) * p.r, p.y, Math.sin(a) * p.r), q4.identity(), sv.set(s, s, s)); S.plM.setMatrixAt(i, m4); } S.plM.instanceMatrix.needsUpdate = true; }
  // übrige Ploppen
  S.pops = S.pops.filter(o => { const s = popK(o.t0);
    if (o.o) o.o.scale.setScalar(o.s * s);
    if (o.town) townHouses(o.town, s);
    if (o.country != null) { const p = S.cPos[o.country]; q4.setFromUnitVectors(UPV, p); m4.compose(pv.copy(p).multiplyScalar(10.02), q4, sv.set(s * 1.3, 1 + (s - 1) * 4, s * 1.3)); S.countries.setMatrixAt(o.country, m4); S.countries.instanceMatrix.needsUpdate = true; }
    return now - o.t0 <= 900; });
  // ---- Tag/Nacht nach echter Uhrzeit ----
  const p = MK.Scene.dayPhase(), nk = p > .66 ? Math.min(1, (p - .66) / .08) * (p > .95 ? Math.min(1, (1 - p) / .05) : 1) : p < .04 ? (.04 - p) / .04 * .6 : 0, eve = p > .52 && p < .74;
  S.hemi.color.set(nk > .5 ? '#8a98c8' : eve ? '#ffd2b0' : '#fff4e2'); S.hemi.intensity = 1.1 - nk * .55; S.sun.intensity = 2 - nk * 1.5; S.sun.color.set(eve ? '#ffb070' : '#fff1d6');
  S.lampOn.opacity = nk; S.wall.emissiveIntensity = nk * 1.1; S.biz.forEach(b => b.hero && b.hero.userData.lit.forEach(m => { m.emissiveIntensity = nk * 1.2; }));
  // ---- Autos ----
  if (level <= 2) { S.cars.forEach((c, i) => { const P = c.rd.pts, n = P.length; c.s += c.dir * c.v * dt * (L.reduce ? 0 : 1);
      if (c.s >= n - 1) { if (c.rd.ring) c.s -= n - 1; else { c.s = n - 1.01; c.dir = -1; } } if (c.s < 0) { if (c.rd.ring) c.s += n - 1; else { c.s = 0; c.dir = 1; } }
      const j = Math.min(n - 2, Math.floor(c.s)), f = c.s - j, a = P[j], b = P[j + 1], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, yaw = Math.atan2(-dz, dx) + (c.dir < 0 ? Math.PI : 0), off = c.side * c.dir;
      q4.setFromAxisAngle(UPV, yaw); m4.compose(pv.set(a[0] + dx * f - dz / l * off, .3, a[1] + dz * f + dx / l * off), q4, sv.set(1, 1, 1)); S.carM.setMatrixAt(i, m4); }); S.carM.instanceMatrix.needsUpdate = true; }
  // ---- Kamera: weich herauszoomen, wenn das Gezeigte den Ausschnitt füllt ----
  const globeOn = level >= 3, aspect = L.W / L.H;
  const target = level === 4 ? 26 + Math.sqrt(nP) * 6.2 : level === 3 ? 16 : Math.max(5.5, ext * 1.15 / aspect, ext * .48);
  if (!S.cur) S.cur = { r: target, globe: globeOn };
  if (S.cur.globe !== globeOn) { S.cur.globe = globeOn; S.cur.r = target * (globeOn ? .5 : 1.6); }
  S.cur.r += (target - S.cur.r) * Math.min(1, dt * 1.5);
  if (L.enter) S.fly = 1;
  const fly = S.fly = Math.max(0, S.fly - dt / 1.6), fk = fly * fly * (3 - 2 * fly), r = S.cur.r * (1 - fk * .55);
  S.city.visible = S.land.visible = S.grass.visible = !globeOn; S.globe.visible = globeOn; S.space.visible = level === 4;
  const cam = S.cam; cam.left = -r * aspect; cam.right = r * aspect; cam.top = r; cam.bottom = -r; cam.updateProjectionMatrix();
  if (globeOn) { S.earth.rotation.y = now / 1000 * .06; cam.position.set(60, 28, 60); cam.lookAt(0, 0, 0); S.sun.position.set(-30, 30, 40); }
  else { const pitch = .62 - fk * .5, yaw = Math.PI / 4 + fk * .5, d = 300; cam.position.set(Math.sin(yaw) * Math.cos(pitch) * d, Math.sin(pitch) * d * (1 - fk * .6) + fk * 1.2, Math.cos(yaw) * Math.cos(pitch) * d); cam.lookAt(0, fk * 2, 0); S.sun.position.set(-30, 50, 20); }
  // ---- Rendern ----
  const pr = Math.min(L.dpr, L.q === 'hoch' ? 1.5 : 1);
  if (R.getPixelRatio() !== pr) R.setPixelRatio(pr); const sz = R.getSize(new THREE.Vector2()); if (sz.x !== L.W || sz.y !== L.H) R.setSize(L.W, L.H, false);
  R.getDrawingBufferSize(U.uRes.value); U.uW.value = 1.3 * pr;
  R.shadowMap.enabled = L.q === 'hoch' && level <= 1; S.sun.castShadow = R.shadowMap.enabled; R.setClearColor(globeOn ? '#05060f' : '#7fb069', 1);
  R.render(S.scene, cam); R.setClearColor(0x000000, 0);
  return { cv: R.domElement, fly, level, stage: LEVEL_STAGE[level], N };
}
