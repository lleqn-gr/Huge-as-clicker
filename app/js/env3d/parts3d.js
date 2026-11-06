/* Muskelklicker 3D-Umgebung – gemeinsame Bausteine: Formen mit Comic-Umriss, Material-Cache, gemalte Texturen */
import * as THREE from 'three';
import { toon, inked } from './toon.js';

export const BOX = new THREE.BoxGeometry(1, 1, 1), CYL = new THREE.CylinderGeometry(1, 1, 1, 20), CYL8 = new THREE.CylinderGeometry(1, 1, 1, 8), SPH = new THREE.SphereGeometry(1, 18, 12);
export const SHARED = new Set([BOX, CYL, CYL8, SPH]);
const MC = new Map();
// Toon-Material je Farbe nur einmal
export const tm = (col, o) => { const k = col + (o ? JSON.stringify(o) : ''); let m = MC.get(k); if (!m) { m = toon(col, o); MC.set(k, m); } return m; };
export const glow = col => { const k = 'glow' + col; let m = MC.get(k); if (!m) { m = new THREE.MeshBasicMaterial({ color: col }); MC.set(k, m); } return m; };
export function mesh(g, geo, m, k) { const o = k === 0 ? new THREE.Mesh(geo, m) : inked(geo, m, k || 1); o.castShadow = o.receiveShadow = true; g.add(o); return o; }
export function box(g, m, x, y, z, w, h, d, k) { const o = mesh(g, BOX, m, k); o.position.set(x, y, z); o.scale.set(w, h, d); return o; }
export function cyl(g, m, x, y, z, r, len, axis, k, geo) { const o = mesh(g, geo || CYL, m, k); o.position.set(x, y, z); o.scale.set(r, len, r); if (axis === 'x') o.rotation.z = Math.PI / 2; if (axis === 'z') o.rotation.x = Math.PI / 2; return o; }
export function ball(g, m, x, y, z, r, k) { const o = mesh(g, SPH, m, k); o.position.set(x, y, z); if (Array.isArray(r)) o.scale.set(r[0], r[1], r[2]); else o.scale.setScalar(r); return o; }
// Rohr entlang Punkten (Kabel, Leitungen)
export function tube(g, m, pts, r, k) { const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), Math.max(8, pts.length * 6), r, 6); return mesh(g, geo, m, k == null ? .5 : k); }
// Hantelscheibe (Achse x): Gummi-Scheibe mit Kragen
export function plate(g, col, x, y, z, r, w, axis) { const p = cyl(g, tm(col), x, y, z, r, w, axis || 'x', .8); cyl(g, tm('#9aa3ad'), x, y, z, r * .22, w * 1.15, axis || 'x', 0); return p; }

const TX = {};
export function canvasTex(key, w, h, paint, o) {
  if (TX[key]) return TX[key];
  const c = document.createElement('canvas'); c.width = w; c.height = h; paint(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  t.wrapS = t.wrapT = o && o.clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping; return TX[key] = t;
}
export const texMat = (key, w, h, paint, o) => { const k = 'tex:' + key; let m = MC.get(k); if (!m) { m = toon('#ffffff', Object.assign({ map: canvasTex(key, w, h, paint, o), rim: false }, o && o.mat)); MC.set(k, m); } return m; };
export function rng(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
// Bildfläche (nur Vorderseite mit Bild, Rest Rahmenfarbe) – Poster, Schilder
export function panel(g, picMat, frameMat, x, y, z, w, h, d, k) { const o = box(g, frameMat, x, y, z, w, h, d, k); o.material = [frameMat, frameMat, frameMat, frameMat, picMat, frameMat]; return o; }
