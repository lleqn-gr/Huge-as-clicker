/* Muskelklicker – 3D-Umgebung
   Figur, NPCs, Spiegel, Theke und die Geräte in der Hand bleiben 2D (scene.js). Hier entsteht nur der RAUM in 3D
   (Wand, Boden, Fenster, Lampen, Deko, Pokal-Regal, Poster, gekaufte Geräte) im Comic-Look (Toon-Licht, schwarze Umrisse).
   Der Raum wird EINMAL in ein Bild gerendert – neu nur, wenn sich etwas ändert (Gym-Stufe, Größe, Grafik-Stufe, Tag/Nacht,
   gekaufte Geräte, Gewichtsstufen, Pokale, Poster). scene.js zeichnet dieses Bild statt des alten 2D-Hintergrunds.
   Fenster haben kein Glas: dort bleibt das Bild durchsichtig und scene.js zeichnet darunter den EINEN gemeinsamen Himmel.

   Kamera = aus der 2D-Szene abgeleitet, damit die 2D-Figuren nicht „draufgeklebt" wirken:
   Fußpunkt (py) und Größe (pScale) der Figur → Abstand/Brennweite, Wandkante (yF) → Raumtiefe,
   Horizont aus der Größen-Staffelung der Besucher (hinten ×0,6 bei yF+16, vorne ×0,68 bei yF+41).
   Einheiten: 1 = 100 Figur-Pixel in der Spieler-Ebene. */
import * as THREE from 'three';
import { U } from './toon.js';
import { SHARED } from './parts3d.js';
import { buildRoom, roomInfo, posterList } from './rooms3d.js';
import { buildEquip, frameMat } from './equip3d.js';
import { buildVenue, buildLab } from './venues3d.js';

const MK = window.MK, E = MK.Env3D;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
let R = null, scene = null, cam = null, room = null, lastKey = '', out = null, outEq = null, res = null;

export function boot() {
  if (E.state === 'ready') return E;
  const cv = document.createElement('canvas');
  try { R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, powerPreference: 'low-power' }); }
  catch (e) { E.state = 'fail'; E.err = 'WebGL nicht verfügbar'; throw e; }
  R.setClearColor(0x000000, 0); R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFShadowMap;
  scene = new THREE.Scene(); cam = new THREE.PerspectiveCamera(40, 1, .1, 80);
  E.get = get; E.has = gym => gym >= 0 && gym <= 4; E.state = 'ready';
  E._dbg = { THREE, R, scene, cam };
  return E;
}

/* ---------- Kamera aus der 2D-Szene ---------- */
export function camFrom(L) {
  const ppu = L.pScale * 100, py = L.py, yF = L.yF;
  const cyB = (yF + 16 - .6 * py) / .4, cyF = (yF + 41 - .68 * py) / .32, cy = L.cy != null ? L.cy : clamp((cyB + cyF) / 2, L.H * .02, yF - 40);
  const d = 7, f = ppu * d, h = (py - cy) / ppu, zw = d * (py - cy) / (yF - cy);
  return { ppu, cy, d, f, h, zw, W: L.W, H: L.H };
}
function applyCam(C) { // eigene Projektion: Horizont nicht in Bildmitte, Kamera schaut waagerecht (senkrechte Kanten bleiben senkrecht wie in 2D)
  const n = .1, k = n / C.f;
  cam.position.set(0, C.h, 0); cam.rotation.set(0, 0, 0); cam.updateMatrixWorld(true);
  cam.projectionMatrix.makePerspective(-C.W / 2 * k, C.W / 2 * k, C.cy * k, -(C.H - C.cy) * k, n, 80);
  cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
}
// Bildschirm ↔ Welt (z = Abstand vor der Kamera)
const wx = (C, sx, z) => (sx - C.W / 2) * z / C.f, wy = (C, sy, z) => C.h + (C.cy - sy) * z / C.f;
const toScreen = (C, x, y, z) => ({ x: C.W / 2 + x * C.f / -z, y: C.cy + (C.h - y) * C.f / -z });

/* ---------- Licht je Raum ---------- */
function lights(g, C, gym, night) {
  const [amb, keyI, keyC] = roomInfo(gym).mood, n = night ? .72 : 1;
  g.add(new THREE.HemisphereLight(night ? '#a8b4e0' : '#fff4e2', night ? '#3a2c22' : '#6a4a30', amb * n));
  // Hauptlicht von vorne links oben (wie bei der 2D-Figur) → Schatten fallen nach hinten rechts
  const key = new THREE.DirectionalLight(keyC, keyI * (night ? .8 : 1)); key.position.set(-4, C.h + 6, 4); key.target.position.set(0, 0, -C.zw); g.add(key, key.target);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -.0005; key.shadow.normalBias = .02;
  const sc = key.shadow.camera, ext = C.zw * .95; Object.assign(sc, { left: -ext, right: ext, top: ext, bottom: -ext, near: 1, far: C.zw * 3 }); sc.updateProjectionMatrix();
  const back = new THREE.DirectionalLight(night ? '#6d84c8' : '#cfe6ff', night ? .25 : .5); back.position.set(1, C.h + 2, -C.zw - 6); g.add(back);
}

/* ---------- Geräte an den Stellplätzen aus scene.js ---------- */
function placeEquip(g, C, places, anchors) {
  places.forEach(p => { const eq = buildEquip(p.id, frameMat(p.lv), p.wg, p.lv); if (!eq) return;
    let z = C.f * C.h / Math.max(1, p.sy - C.cy); z = clamp(z, C.d + 1.2, C.zw - .55); // Tiefe aus der Bodenzeile; nie in der Wand
    eq.position.set(wx(C, p.sx, z), 0, -z); g.add(eq);
    const b = new THREE.Box3().setFromObject(eq), pts = [[b.min.x, b.min.y, b.max.z], [b.max.x, b.min.y, b.max.z], [b.min.x, b.max.y, b.max.z], [b.max.x, b.max.y, b.max.z]].map(q => toScreen(C, ...q));
    const xs = pts.map(q => q.x), ys = pts.map(q => q.y); anchors.eq.push({ id: p.id, x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) }); });
}

/* ---------- Rendern: Raum-Bild + eigene Ebenen (Geräte, Vordergrund/Theke), je Szenen-Art ein Cache ---------- */
const CACHE = {};
function render(type, key, L, C, build) {
  const ca = CACHE[type] || (CACHE[type] = { key: '', res: null, cv: {} });
  if (ca.key === key && ca.res) return ca.res;
  const t0 = performance.now();
  if (room) { scene.remove(room); room.traverse(o => { if (o.geometry && !SHARED.has(o.geometry) && !o.userData.outline && o.geometry.type !== 'LatheGeometry') o.geometry.dispose(); }); }
  room = new THREE.Group(); const B = build(); room.add(B.bg); if (B.eq) room.add(B.eq); if (B.front) room.add(B.front); B.lights(room); scene.add(room);
  applyCam(C);
  const pr = Math.min(L.dpr, L.q === 'hoch' ? 2 : 1.5);
  R.setPixelRatio(pr); R.setSize(L.W, L.H, false); R.shadowMap.enabled = L.q !== 'niedrig'; R.getDrawingBufferSize(U.uRes.value);
  U.uW.value = clamp((L.pScale || .9) * 1.9, 1.1, 2.6) * pr; // Umriss so dick wie die Linien der 2D-Figur
  const grab = name => { const c = ca.cv[name] || (ca.cv[name] = document.createElement('canvas')); c.width = R.domElement.width; c.height = R.domElement.height; const x = c.getContext('2d'); x.clearRect(0, 0, c.width, c.height); x.drawImage(R.domElement, 0, 0); return c; };
  R.render(scene, cam); const out = { cv: grab('bg') };
  // weitere Ebenen: nur diese Teile sichtbar, Hintergrund durchsichtig (Schatten/Verdeckung stecken schon im Raum-Bild)
  ['eq', 'front'].forEach(n => { const g = B[n]; if (!g || !g.children.length) return; const vis = [B.bg, B.eq, B.front].filter(Boolean).map(q => [q, q.visible]); [B.bg, B.eq, B.front].forEach(q => { if (q) q.visible = q === g; });
    R.render(scene, cam); out[n] = grab(n); vis.forEach(([q, v]) => { q.visible = v; }); });
  const a = B.anchors || {}; if (a.trophies) a.trophies = a.trophies.map(p => Object.assign(toScreen(C, p.x, p.y, p.z), { r: p.r * C.f / -p.z }));
  ca.key = key; ca.res = Object.assign(out, { win: B.wins || [], key: type + key, anchors: a });
  E.stats = { type, ms: Math.round(performance.now() - t0), calls: R.info.render.calls, tris: R.info.render.triangles, cam: C };
  return ca.res;
}
E.wx = wx; E.wy = wy;

/* ---------- Gym ---------- */
function get(L) {
  if (E.state !== 'ready' || !E.has(L.gym)) return null;
  const S = MK.S, night = !!L.night, places = (MK.Scene.eqPlaces && MK.Scene.eqPlaces()) || [], bar = S.eq.kuehl && MK.Scene.barGeom ? MK.Scene.barGeom() : null;
  const key = [L.gym, L.W, L.H, Math.round(L.yF), Math.round(L.py), L.pScale.toFixed(4), L.dpr, L.q, night ? 1 : 0, S.eq.kuehl || 0, S.fame > 40 ? 1 : 0, S.fame >= 10 ? 1 : 0,
    places.map(p => p.id + p.lv + '.' + p.wg + '@' + Math.round(p.sx) + ',' + Math.round(p.sy)).join(';'), MK.TOURNEYS.map(T => S.trophies[T.id] || 0).join(''), posterList().map(p => p.id + p.t2).join('|')].join(':');
  const C = camFrom(L);
  return render('gym', key, L, C, () => { const anchors = { eq: [], trophies: [] }, B = buildRoom(L.gym, C, L, wx, wy, anchors, bar), eq = new THREE.Group(); placeEquip(eq, C, places, anchors);
    return { bg: B.g, eq, front: B.front, wins: B.wins, anchors, lights: g => lights(g, C, L.gym, night) }; });
}

/* ---------- Duell-/Turnier-Bühne ----------
   Kämpfer stehen unten (py, Größe pScale), die Jury steht an der Bühnenkante (yF−4) mit Größe 0,42·H/440 → daraus der Horizont. */
function stageLights(g, C, v) {
  const night = v === 0 || v === 7 || v >= 3;
  g.add(new THREE.HemisphereLight(night ? '#9aa8d8' : '#fff4e2', '#3a2c22', night ? .7 : 1.1));
  const key = new THREE.DirectionalLight('#fff1d6', night ? 1.8 : 2.2); key.position.set(-3, C.h + 7, 5); key.target.position.set(0, 0, -C.zw); g.add(key, key.target);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -.0005; key.shadow.normalBias = .02; const sc = key.shadow.camera, ext = C.zw * 1.1; Object.assign(sc, { left: -ext * 1.5, right: ext * 1.5, top: ext, bottom: -ext, near: 1, far: C.zw * 3 }); sc.updateProjectionMatrix();
}
E.getStage = L => {
  if (E.state !== 'ready') return null;
  const r = (.42 * L.H / 440) / L.pScale, yJ = L.yF - 4, cy = clamp((yJ - r * L.py) / (1 - r), L.H * .02, L.yF - 30);
  const C = camFrom(Object.assign({}, L, { cy })), key = [L.v, L.W, L.H, L.dpr, L.q].join(':');
  return render('stage', key, L, C, () => { const B = buildVenue(L.v, C, L, wx, wy); return { bg: B.g, lights: g => stageLights(g, C, L.v) }; });
};
/* ---------- Labor (Dopingkontrolle) ---------- */
E.getLab = L => {
  if (E.state !== 'ready' || !(L.kind === 'lab' || L.kind === 'med')) return null;
  const yF = L.H * .62, C = camFrom({ W: L.W, H: L.H, yF, py: L.H - 20, pScale: L.H * .0034, cy: L.H * .3 }), key = [L.kind, L.W, L.H, L.dpr, L.q].join(':');
  return render('lab', key, Object.assign({ pScale: L.H * .0034 }, L), C, () => { const B = buildLab(L.kind, C, Object.assign({ yF }, L), wx, wy);
    return { bg: B.g, lights: g => { g.add(new THREE.HemisphereLight('#ffffff', '#8a9aa2', 1.25)); const k = new THREE.DirectionalLight('#ffffff', 1.8); k.position.set(-3, C.h + 6, 4); k.target.position.set(0, 0, -C.zw); k.castShadow = true; k.shadow.mapSize.set(1024, 1024); const sc = k.shadow.camera, e = C.zw; Object.assign(sc, { left: -e, right: e, top: e, bottom: -e, near: 1, far: C.zw * 3 }); sc.updateProjectionMatrix(); g.add(k, k.target); } }; });
};
