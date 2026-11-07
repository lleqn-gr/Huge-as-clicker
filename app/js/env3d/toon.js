/* Muskelklicker 3D-Umgebung – Comic-Look: Toon-Material mit harten Lichtstufen, Randlicht und schwarzen Umrisslinien.
   Alles wird einmal gebaut und danach nur noch wiederverwendet (keine neuen Materialien pro Bild). */
import * as THREE from 'three';

// Gemeinsame Werte für alle Shader (ein Objekt → ein Update wirkt überall)
export const U = {
  uRes: { value: new THREE.Vector2(1, 1) },   // Bildgröße in Pixeln (für gleich dicke Linien)
  uW: { value: 2.2 },                           // Linienstärke in Pixeln
  uRim: { value: .32 },                          // Stärke des Randlichts
  uRimCol: { value: new THREE.Color('#ffd9a0') },
  uZB: { value: .0025 }                         // Umriss-Tiefenversatz (Figur)
};

// Drei harte Lichtstufen: Schatten, Halbton, Licht
let GRAD = null;
export function gradient() {
  if (GRAD) return GRAD;
  GRAD = new THREE.DataTexture(new Uint8Array([72, 72, 72, 255, 160, 160, 160, 255, 255, 255, 255, 255]), 3, 1, THREE.RGBAFormat);
  GRAD.minFilter = GRAD.magFilter = THREE.NearestFilter; GRAD.generateMipmaps = false; GRAD.needsUpdate = true;
  return GRAD;
}

const rimPatch = sh => {
  sh.uniforms.uRim = U.uRim; sh.uniforms.uRimCol = U.uRimCol;
  sh.fragmentShader = 'uniform float uRim;\nuniform vec3 uRimCol;\n' + sh.fragmentShader.replace('#include <dithering_fragment>',
    '{ vec3 vd = normalize(vViewPosition); float fr = 1.0 - clamp(dot(normal, vd), 0.0, 1.0); gl_FragColor.rgb += uRimCol * smoothstep(0.6, 0.66, fr) * uRim; }\n#include <dithering_fragment>');
};

/* Comic-Schattierung für die Figur: EIN Hauptlicht, genau 3 harte Stufen (Licht · Halbton · farbiger Schatten),
   warmes Randlicht und ein kleiner harter Glanzpunkt. Ersetzt die normale Beleuchtung (mehrere Lichter = zu viele Stufen). */
export const CEL = {
  uKey: { value: new THREE.Vector3(.42, .72, .55).normalize() },  // Lichtrichtung (Welt): von oben rechts vorne
  uMid: { value: new THREE.Vector3(.84, .78, .82) },                // Faktor Halbton (linear)
  uShd: { value: new THREE.Vector3(.5, .42, .52) },                 // Faktor Schatten (leicht violett → Comic-Look)
  uSpec: { value: .13 }
};
export const CEL_FN = `uniform vec3 uKey, uMid, uShd; uniform float uSpec;
vec3 celShade(vec3 base, vec3 n, vec3 vd, float specK, float rimK, vec3 rimCol) {
  vec3 L = normalize((viewMatrix * vec4(uKey, 0.0)).xyz);
  float d = dot(n, L), w = max(fwidth(d), 1e-3);
  float a = smoothstep(.22 - w, .22 + w, d), b = smoothstep(-.18 - w, -.18 + w, d);
  vec3 c = base * mix(uShd, mix(uMid, vec3(1.04), a), b);
  vec3 h = normalize(L + vd); float s = dot(n, h), ws = max(fwidth(s), 1e-3);
  c += vec3(1.0, .97, .9) * smoothstep(.972 - ws, .972 + ws, s) * specK * uSpec;
  float fr = 1.0 - clamp(dot(n, vd), 0.0, 1.0), wf = max(fwidth(fr), 1e-3);
  c += rimCol * smoothstep(.62 - wf, .62 + wf, fr) * rimK * (.45 + .55 * b);
  return c;
}`;
const glf = v => typeof v === 'string' ? v : v.toFixed(2);
export function celPatch(sh, o) {
  o = o || {};
  Object.assign(sh.uniforms, CEL, { uRim: U.uRim, uRimCol: U.uRimCol });
  sh.fragmentShader = 'uniform float uRim; uniform vec3 uRimCol;\n' + CEL_FN + '\n' + sh.fragmentShader.replace('#include <opaque_fragment>',
    `outgoingLight = celShade(diffuseColor.rgb, normal, normalize(vViewPosition), ${glf(o.spec ?? 1)}, uRim * ${glf(o.rim ?? 1)}, uRimCol) + totalEmissiveRadiance;
${o.after || ''}
#include <opaque_fragment>`);
}
// einfaches Material mit Comic-Schattierung (Haare, Augenbrauen …)
export function cel(color, o) {
  o = o || {};
  const m = new THREE.MeshToonMaterial({ color, gradientMap: gradient() });
  m.onBeforeCompile = sh => celPatch(sh, o); m.customProgramCacheKey = () => 'mk-cel-' + (o.spec ?? 1) + '-' + (o.rim ?? 1);
  if (o.emissive) m.emissive = new THREE.Color(o.emissive);
  return m;
}

// Toon-Material (Farbe kann später geändert werden: mat.color.set(...))
export function toon(color, o) {
  o = o || {};
  const m = new THREE.MeshToonMaterial({ color, gradientMap: gradient(), map: o.map || null });
  if (o.rim !== false) { m.onBeforeCompile = rimPatch; m.customProgramCacheKey = () => 'mk-toon-rim'; }
  if (o.emissive) m.emissive = new THREE.Color(o.emissive);
  return m;
}

// Umriss: Rückseiten der Form, im Bild nach außen geschoben → überall gleich dicke Comic-Linie
const OUT_VS = `uniform vec2 uRes; uniform float uW; uniform float uK;
void main() {
  vec4 p0 = vec4(position, 1.0); vec3 n0 = normal;
  #ifdef USE_INSTANCING
  p0 = instanceMatrix * p0; n0 = mat3(instanceMatrix) * n0;
  #endif
  vec4 mv = modelViewMatrix * p0;
  vec3 n = normalize(normalMatrix * n0);
  vec4 clip = projectionMatrix * mv;
  vec2 d = (projectionMatrix * vec4(n, 0.0)).xy; float l = length(d); d = l > 1e-5 ? d / l : vec2(0.0);
  clip.xy += d * uW * uK * 2.0 * clip.w / uRes;
  gl_Position = clip;
}`;
const OUT_FS = `uniform vec3 uCol; void main() { gl_FragColor = vec4(uCol, 1.0); }`;
const OUTS = new Map();
export function outlineMat(k, col) {
  const key = (k || 1) + ':' + (col || '#141414'); let m = OUTS.get(key); if (m) return m;
  m = new THREE.ShaderMaterial({ uniforms: { uRes: U.uRes, uW: U.uW, uK: { value: k || 1 }, uCol: { value: new THREE.Color(col || '#141414') } }, vertexShader: OUT_VS, fragmentShader: OUT_FS, side: THREE.BackSide });
  OUTS.set(key, m); return m;
}

// Form + Umriss in einem: gibt das sichtbare Mesh zurück, der Umriss hängt als Kind daran
export function inked(geo, mat, k) {
  const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true;
  const o = new THREE.Mesh(geo, outlineMat(k)); o.castShadow = false; o.receiveShadow = false; o.raycast = () => {}; o.userData.outline = true;
  m.add(o); return m;
}

/* ---------- Einfacher Cartoon-Look (ab Figur v3): flache Farben, genau EINE harte Schattenkante, leichtes Randlicht ----------
   flat(color)  → einfarbiges Teil (Haut, Haare, Schuhe …)
   zone(glsl)   → Teil mit Kleidungs-Zonen: der GLSL-Schnipsel setzt aus der Objekt-Position vP die Farbe `base` und eine Comic-Linie `ink` */
export const FLAT = {
  uKey: CEL.uKey,
  uShd: { value: new THREE.Vector3(.7, .64, .78) },  // Schattenfarbe = Grundfarbe × leicht violett
  uRimF: { value: .16 }
};
const FLAT_FN = `uniform vec3 uKey, uShd; uniform float uRimF, uTh;
vec3 flatShade(vec3 base, vec3 n, vec3 vd) {
  vec3 L = normalize((viewMatrix * vec4(uKey, 0.0)).xyz);
  float d = dot(n, L), w = max(fwidth(d), 1e-3);
  vec3 c = base * mix(uShd, vec3(1.0), smoothstep(uTh - w, uTh + w, d));
  float fr = 1.0 - clamp(dot(n, vd), 0.0, 1.0), wf = max(fwidth(fr), 1e-3);
  return c + vec3(1.0, .93, .8) * smoothstep(.7 - wf, .7 + wf, fr) * uRimF * step(0.0, d);
}
float inkEdge(float f, float k) { float w = max(fwidth(f), 1e-4) * k; return 1.0 - smoothstep(w * .5, w * 1.5, abs(f)); }
`;
function flatPatch(sh, zoneCode, uni, th) {
  Object.assign(sh.uniforms, FLAT, uni || {}); sh.uniforms.uTh = { value: th == null ? -.22 : th };
  if (zoneCode) sh.vertexShader = 'varying vec3 vP;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvP = position;');
  sh.fragmentShader = FLAT_FN + (zoneCode ? 'varying vec3 vP;\n' + zoneCode.head : '') + '\n' + sh.fragmentShader
    .replace('#include <color_fragment>', '#include <color_fragment>\n' + (zoneCode ? `vec3 base = diffuseColor.rgb; float ink = 0.0;\n${zoneCode.body}\ndiffuseColor.rgb = base;` : 'float ink = 0.0;'))
    .replace('#include <opaque_fragment>', `outgoingLight = flatShade(diffuseColor.rgb, normal, normalize(vViewPosition)) + totalEmissiveRadiance;
outgoingLight = mix(outgoingLight, vec3(.02), clamp(ink, 0.0, 1.0) * .9);
#include <opaque_fragment>`);
}
let flatN = 0;
export function flat(color, o) {
  o = o || {};
  const m = new THREE.MeshToonMaterial({ color, gradientMap: gradient() });
  m.onBeforeCompile = sh => flatPatch(sh, null, null, o.th); m.customProgramCacheKey = () => 'mk-flat1' + (o.th == null ? '' : o.th);
  if (o.emissive) m.emissive = new THREE.Color(o.emissive);
  return m;
}
export function zone(code, uni, color, th) {
  const m = new THREE.MeshToonMaterial({ color: color || '#ffffff', gradientMap: gradient() }), id = 'mk-zone-' + (code.id || ++flatN);
  m.onBeforeCompile = sh => flatPatch(sh, code, uni, th); m.customProgramCacheKey = () => id; m.userData.uni = uni;
  return m;
}
