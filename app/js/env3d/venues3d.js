/* Muskelklicker 3D-Umgebung – Duell-/Turnier-Schauplätze und Labor.
   Schauplätze (venue 0–7 wie in scene.js): Hinterhof, Vereinsheim, Stadthalle, vier Arenen, Raumstation.
   3D: Bühne/Boden, Rückwand, Ränge, Vorhang, LED-Wand-Rahmen, Traverse mit Scheinwerfern.
   2D (live, scene.js): Publikum, Lichtstrahlen, LED-Leuchten, Konfetti, Sterne/Erde, Jury, Kämpfer.
   Labor (Dopingkontrolle, lab.js): Fliesen, Laborbank mit Kolben, Abzug, Regal, Zentrifuge. */
import * as THREE from 'three';
import { tm, glow, box, cyl, ball, tube, panel, texMat, rng, mesh } from './parts3d.js';
import { inked } from './toon.js';

const MK = window.MK;
const tex = (k, w, h, f, rep) => { const m = texMat(k, w, h, f); return m; };
const planeWall = (g, m, halfW, topY, z, tw, th) => { const geo = new THREE.PlaneGeometry(halfW * 2, topY); const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * halfW * 2 / tw, uv.getY(i) * topY / th);
  const w = new THREE.Mesh(geo, m); w.position.set(0, topY / 2, z); w.receiveShadow = true; g.add(w); return w; };
const planeFloor = (g, m, halfW, zw, tw, th) => { const len = zw + 2, geo = new THREE.PlaneGeometry(halfW * 2, len); const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * halfW * 2 / tw, uv.getY(i) * len / th);
  const f = new THREE.Mesh(geo, m); f.rotation.x = -Math.PI / 2; f.position.z = -zw + len / 2; f.receiveShadow = true; g.add(f); return f; };

const PT = {
  brickD(x, w, h) { const R = rng(21); x.fillStyle = '#2e1c16'; x.fillRect(0, 0, w, h); const rows = 8, bh = h / rows, bw = w / 4;
    for (let r = 0; r < rows; r++) for (let i = -1; i < 5; i++) { const ox = (r % 2) * bw / 2, v = R(); x.fillStyle = v < .5 ? '#4a2f26' : '#55362b'; x.fillRect(i * bw + ox + 3, r * bh + 3, bw - 6, bh - 6); } },
  asphalt(x, w, h) { const R = rng(4); x.fillStyle = '#55565a'; x.fillRect(0, 0, w, h); for (let i = 0; i < 8000; i++) { x.fillStyle = R() < .5 ? 'rgba(0,0,0,.25)' : 'rgba(255,255,255,.08)'; x.fillRect(R() * w, R() * h, 2, 2); }
    x.strokeStyle = 'rgba(0,0,0,.4)'; x.lineWidth = 2; for (let i = 0; i < 3; i++) { let px = R() * w, py = R() * h; x.beginPath(); x.moveTo(px, py); for (let j = 0; j < 6; j++) { px += (R() - .5) * 60; py += R() * 30; x.lineTo(px, py); } x.stroke(); } },
  graffiti(x, w, h) { x.clearRect(0, 0, w, h); x.font = `${h * .55}px Bangers, Impact, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = 10; x.strokeStyle = 'rgba(10,30,20,.7)'; x.save(); x.translate(w * .3, h * .5); x.rotate(-.1); x.strokeText('PUMP!', 0, 0); x.fillStyle = 'rgba(80,220,140,.85)'; x.fillText('PUMP!', 0, 0); x.restore();
    x.fillStyle = 'rgba(255,90,160,.8)'; x.save(); x.translate(w * .78, h * .5); x.rotate(.15); x.beginPath(); x.moveTo(0, h * .3); x.bezierCurveTo(-h * .5, 0, -h * .25, -h * .35, 0, -h * .12); x.bezierCurveTo(h * .25, -h * .35, h * .5, 0, 0, h * .3); x.fill(); x.restore(); },
  boards(x, w, h) { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#7e5130' : '#8a5a34'; x.fillRect(i * w / 8, 0, w / 8, h); x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(i * w / 8, 0, 3, h); } },
  wood(x, w, h) { const R = rng(9); for (let i = 0; i < 4; i++) { let y = 0; while (y < h) { const l = h * (.3 + R() * .4); x.fillStyle = ['#6b4a2b', '#5f4126', '#77522f'][Math.floor(R() * 3)]; x.fillRect(i * w / 4, y, w / 4, l); x.fillStyle = 'rgba(0,0,0,.4)'; x.fillRect(i * w / 4, y + l - 3, w / 4, 3); y += l; } x.fillStyle = 'rgba(0,0,0,.5)'; x.fillRect(i * w / 4, 0, 3, h); } },
  stage(x, w, h) { x.fillStyle = '#1c1c22'; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(255,255,255,.05)'; for (let i = 0; i < 8; i++) x.fillRect(0, i * h / 8, w, 2); x.fillStyle = 'rgba(0,0,0,.4)'; x.fillRect(0, 0, 3, h); },
  metal(x, w, h) { x.fillStyle = '#8a929e'; x.fillRect(0, 0, w, h); x.fillStyle = '#5c636e'; x.fillRect(0, 0, w, 4); x.fillRect(0, 0, 4, h); x.fillStyle = 'rgba(255,255,255,.12)'; x.fillRect(4, 4, w, 3);
    x.fillStyle = 'rgba(0,0,0,.25)'; [[.15, .15], [.85, .15], [.15, .85], [.85, .85]].forEach(([u, v]) => { x.beginPath(); x.arc(u * w, v * h, 6, 0, 7); x.fill(); }); },
  tiles(x, w, h, col) { x.fillStyle = col || '#d6e4e9'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 4; for (let i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(0, i * h / 4); x.lineTo(w, i * h / 4); x.stroke(); x.beginPath(); x.moveTo(i * w / 4, 0); x.lineTo(i * w / 4, h); x.stroke(); }
    x.strokeStyle = 'rgba(0,0,0,.08)'; x.lineWidth = 2; for (let i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(0, i * h / 4 + 3); x.lineTo(w, i * h / 4 + 3); x.stroke(); } }
};

/* ---------- Schauplätze ---------- */
export function buildVenue(v, C, L, wx, wy) {
  const g = new THREE.Group(), zW = -C.zw, halfW = wx(C, C.W + 60, C.zw) + 2, topY = wy(C, -30, C.zw) + 1;
  const tiers = (n, y0, y1, cols) => { // Ränge: Stufen, deren Oberkante dort liegt, wo scene.js das Publikum zeichnet
    for (let r = 0; r < n; r++) { const sy = y0 + (y1 - y0) * r / Math.max(1, n - 1) + 8, z = C.zw - .6 - (n - 1 - r) * .7, Y = wy(C, sy, z); if (Y <= .05) continue;
      box(g, tm(cols[r % cols.length]), 0, Y / 2, -z, halfW * 2, Y, .7, r === n - 1 ? 1 : .6); box(g, tm('#141418'), 0, Y + .02, -z + .3, halfW * 2, .04, .1, 0); } };
  const truss = (y, col) => { const Y = wy(C, y, C.zw - 1.5), z = -(C.zw - 1.5); box(g, tm('#2a2a30'), 0, Y, z, halfW * 2, .12, .12); box(g, tm('#2a2a30'), 0, Y - .25, z, halfW * 2, .05, .05, .5);
    for (let x = -halfW + .5; x < halfW; x += .5) box(g, tm('#2a2a30'), x, Y - .12, z, .03, .26, .03, 0);
    const n = 6; for (let i = 0; i < n; i++) { const x = wx(C, C.W * (i + .5) / n, C.zw - 1.5), can = cyl(g, tm('#1b1b1e'), x, Y - .28, z + .05, .13, .26, null, .8); can.rotation.x = .5; cyl(g, glow(col || '#fff2d0'), x, Y - .38, z + .14, .1, .02, null, 0).rotation.x = .5; } };
  if (v === 0) { // Hinterhof
    planeWall(g, tex('brickD', 512, 512, PT.brickD), halfW, topY, zW, 2, 1.6); planeFloor(g, tex('asphalt', 512, 512, PT.asphalt), halfW, C.zw, 3, 3);
    const gm = new THREE.MeshBasicMaterial({ map: texMat('graf', 1024, 256, PT.graffiti).map, transparent: true, depthWrite: false }); const gp = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.5), gm); gp.position.set(wx(C, C.W * .35, C.zw), wy(C, L.yF * .55, C.zw), zW + .01); g.add(gp);
    const xd = wx(C, C.W * .86, C.zw - .7); box(g, tm('#2f6b3a'), xd, .6, zW + .7, 1.6, 1.2, 1); box(g, tm('#245530'), xd, 1.24, zW + .65, 1.66, .08, 1.06); [-1, 1].forEach(s => cyl(g, tm('#1d1f24'), xd + s * .6, .1, zW + 1.15, .1, .06, 'x', .5));
    [.08, .16].forEach((fx, i) => cyl(g, tm('#6b7078'), wx(C, C.W * fx, C.zw - .5), .4, zW + .5 + i * .3, .28, .8, null, .8)); box(g, tm('#a8794a'), wx(C, C.W * .24, C.zw - .5), .1, zW + .6, 1, .2, .8);
    tube(g, tm('#1a1a1a'), [[-halfW, wy(C, 10, C.zw - 1), zW + 1], [0, wy(C, 22, C.zw - 1), zW + 1], [halfW, wy(C, 12, C.zw - 1), zW + 1]], .012, 0); ball(g, glow('#fff3c0'), wx(C, C.W / 2, C.zw - 1), wy(C, 30, C.zw - 1), zW + 1, .08, 0); }
  if (v === 1) { // Vereinsheim
    planeWall(g, tex('boards', 512, 512, PT.boards), halfW, topY, zW, 2.4, 3); planeFloor(g, tex('woodV', 512, 1024, PT.wood), halfW, C.zw, 1.4, 4);
    tiers(2, L.yF - 30, L.yF - 12, ['#8a6640', '#9a7450']);
    [0, 1].forEach(k => { const z = zW + .5 + k * .2, cols = ['#ff5a36', '#ffc83d', '#2f80ff', '#2bb673'], n = 16;
      for (let i = 0; i < n; i++) { const sx = i * C.W / 15, sy = 40 + k * 46 + Math.sin(i / 15 * Math.PI) * 18, tri = new THREE.Mesh(new THREE.ConeGeometry(.16, .32, 3), tm(cols[(i + k) % 4])); tri.rotation.z = Math.PI; tri.position.set(wx(C, sx, -z), wy(C, sy + 7, -z), z); g.add(tri); } }); }
  if (v === 2) { // Stadthalle: roter Vorhang
    const n = 30, w = halfW * 2 / n; for (let i = 0; i < n; i++) cyl(g, tm(i % 2 ? '#5a1426' : '#7a1c34'), -halfW + (i + .5) * w, topY / 2, zW + (i % 2 ? -.05 : .05), w * .62, topY, null, i % 2 ? 0 : .7);
    box(g, tm('#e6b422', { emissive: '#4a3505' }), 0, wy(C, 3, C.zw - .3), zW + .3, halfW * 2, .25, .1); planeFloor(g, tex('woodS', 512, 1024, PT.wood), halfW, C.zw, 1.4, 4);
    box(g, tm('#3a2414'), 0, .04, zW + .4, halfW * 2, .08, .6, .6); }
  if (v >= 3 && v <= 6) { // Arenen
    const pal = [null, null, null, ['#141a3a', '#2a2f6a'], ['#1a1a1a', '#3a1010'], ['#0e1a3a', '#1a3a7a'], ['#120a2a', '#3a1060']][v];
    box(g, tm(pal[0], { rim: false }), 0, topY / 2, zW - .1, halfW * 2, topY, .1, 0);
    tiers(3 + v, L.yF * (.62 - v * .06), L.yF - 10, v === 4 ? ['#2a2a2e', '#3a1414'] : ['#20244a', '#2a2f5a', '#1a1e3a']);
    const sw = C.W * (.28 + v * .03), sx = C.W / 2 - sw / 2, z = C.zw - 2.4, x0 = wx(C, sx, z), x1 = wx(C, sx + sw, z), yT = wy(C, 14, z), yB = wy(C, 14 + L.yF * .32, z);
    box(g, tm('#0a0a0e'), (x0 + x1) / 2, (yT + yB) / 2, -z - .08, x1 - x0 + .25, yT - yB + .25, .12); box(g, tm('#05060a', { rim: false }), (x0 + x1) / 2, (yT + yB) / 2, -z, x1 - x0, yT - yB, .02, 0);
    [-1, 1].forEach(s => cyl(g, tm('#2a2a30'), (s < 0 ? x0 : x1) + s * .1, yT + 1, -z - .1, .02, 2, null, .4));
    truss(6, v >= 5 ? '#ffd0f0' : '#fff2d0');
    planeFloor(g, tex('stage', 512, 512, PT.stage), halfW, C.zw, 2, 2);
    box(g, glow(['', '', '', '#5a6cff', '#ff3b1f', '#ffcc00', '#c050ff'][v]), 0, .02, zW + .02, halfW * 2, .04, .04, 0); }
  if (v === 7) { // Raumstation: nur Plattform + Geländer (Sterne und Erde zeichnet scene.js dahinter)
    planeFloor(g, tex('metalP', 256, 256, PT.metal), halfW, C.zw, 1.2, 1.2);
    box(g, glow('#50dcff'), 0, .03, zW + .05, halfW * 2, .05, .05, 0);
    for (let x = -halfW + .4; x < halfW; x += 1.2) cyl(g, tm('#5c636e'), x, .45, zW + .1, .03, .9, null, .5); [.85, .45].forEach(y => cyl(g, tm('#8a929e'), 0, y, zW + .1, .025, halfW * 2, 'x', .5)); }
  return { g };
}

/* ---------- Labor (Dopingkontrolle) ---------- */
const flaskPts = [[0, 0], [.42, 0], [.44, .04], [.18, .62], [.16, 1], [.2, 1.04], [0, 1.04]].map(([x, y]) => new THREE.Vector2(x, y));
let FLASK = null; const flask = () => FLASK || (FLASK = new THREE.LatheGeometry(flaskPts, 18));
export function buildLab(kind, C, L, wx, wy) {
  const g = new THREE.Group(), zW = -C.zw, halfW = wx(C, C.W + 60, C.zw) + 2, topY = wy(C, -30, C.zw) + 1, med = kind === 'med';
  planeWall(g, tex('tiles' + kind, 512, 512, (x, w, h) => PT.tiles(x, w, h, med ? '#cfe3ea' : '#d6e4e9')), halfW, topY, zW, 1.2, 1.2);
  planeFloor(g, tex('labF', 512, 512, (x, w, h) => PT.tiles(x, w, h, '#c9d3d6')), halfW, C.zw, 1, 1);
  box(g, tm('#6e7e86'), 0, .07, zW + .03, halfW * 2, .14, .06);
  // Laborbank an der Wand: Unterschränke, Arbeitsplatte, Kolben mit leuchtender Flüssigkeit
  const zb = zW + .45, x0 = wx(C, C.W * .05, C.zw - .45), x1 = wx(C, C.W * .62, C.zw - .45), wb = x1 - x0, cx = (x0 + x1) / 2;
  box(g, tm('#e9eef0'), cx, .42, zb, wb, .84, .8); for (let i = 0; i < Math.floor(wb / .6); i++) { box(g, tm('#cfd8dc'), x0 + .3 + i * .6, .42, zb + .41, .52, .7, .02, .5); box(g, tm('#8a939a'), x0 + .3 + i * .6, .7, zb + .43, .2, .03, .03, 0); }
  box(g, tm('#2c3a44'), cx, .87, zb, wb + .1, .06, .86);
  const LQ = ['#2bb673', '#3a86ff', '#ff5a36', '#ffc83d', '#c050ff', '#1fb5d6'], R = rng(kind === 'med' ? 3 : 8);
  for (let i = 0; i < Math.floor(wb / .35); i++) { const x = x0 + .25 + i * .35 + (R() - .5) * .08, s = .14 + R() * .1, col = LQ[i % LQ.length];
    if (i % 4 === 3) { box(g, tm('#5c636e'), x, .95, zb, .26, .04, .14); for (let k = 0; k < 4; k++) { cyl(g, tm('#dff4ff', { rim: false }), x - .09 + k * .06, 1.05, zb, .02, .22, null, .4); cyl(g, glow(LQ[(i + k) % 6]), x - .09 + k * .06, 1.0, zb, .018, .1, null, 0); } continue; }
    const f = inked(flask(), tm('#e8f6ff', { rim: false }), .6); f.position.set(x, .9, zb + (R() - .5) * .3); f.scale.set(s, s * 1.3, s); f.castShadow = true; g.add(f);
    const lq = new THREE.Mesh(flask(), glow(col)); lq.position.copy(f.position); lq.scale.set(s * .92, s * .55, s * .92); g.add(lq); }
  // Abzug (große Glas-Haube) rechts von der Bank
  { const x = wx(C, C.W * .74, C.zw - .5), w = 1.5, H = 2.3; box(g, tm('#e9eef0'), x, .45, zW + .5, w, .9, .9); box(g, tm('#dfe5e8'), x, H - .3, zW + .45, w, .6, .8); [-1, 1].forEach(s => box(g, tm('#dfe5e8'), x + s * w / 2, 1.4, zW + .5, .08, 1.2, .9));
    const gl = new THREE.Mesh(new THREE.BoxGeometry(w - .1, 1.1, .02), new THREE.MeshBasicMaterial({ color: '#bfe6ff', transparent: true, opacity: .35 })); gl.position.set(x, 1.45, zW + .95); g.add(gl);
    cyl(g, tm('#9aa3ad'), x, H + .3, zW + .4, .18, .6, null, .6); ball(g, glow('#7fe3ff'), x, 1.0, zW + .6, .12, 0); }
  // Regal mit Flaschen und Zentrifuge
  { const x = wx(C, C.W * .9, C.zw - .3), Y = wy(C, L.yF * .3, C.zw - .3); [0, .45].forEach(dy => box(g, tm('#9aa3ad'), x, Y - dy, zW + .2, 1.1, .04, .35)); for (let i = 0; i < 5; i++) cyl(g, tm(LQ[i]), x - .4 + i * .2, Y + .14, zW + .2, .05, .24, null, .5); for (let i = 0; i < 4; i++) box(g, tm('#5a3a2a'), x - .35 + i * .22, Y - .45 + .15, zW + .2, .14, .26, .14, .5); }
  { const x = wx(C, C.W * .5, C.zw - .45); cyl(g, tm('#dfe5e8'), x, 1.05, zb, .26, .3, null, .8); cyl(g, tm('#3a86ff'), x, 1.22, zb, .24, .04, null, .5); box(g, glow('#2bb673'), x, 1.05, zb + .26, .1, .05, .01, 0); }
  // Deckenlampen
  { const lg = new THREE.Group(); g.add(lg); [.25, .75].forEach(fx => { const z = (C.d + C.zw) * .5, x = wx(C, C.W * fx, z), Y = wy(C, 8, z); box(lg, tm('#f1f4f6'), x, Y, -z, 1.4, .06, .4); box(lg, glow('#ffffff'), x, Y - .035, -z, 1.3, .01, .3, 0); }); lg.traverse(o => { o.castShadow = false; }); }
  if (med) { const x = wx(C, C.W * .25, C.zw * .9); box(g, tm('#e9eef0'), x, .35, -C.zw * .9, 1.6, .7, .7); box(g, tm('#9ad3e8'), x, .74, -C.zw * .9, 1.6, .12, .7); }
  return { g };
}
