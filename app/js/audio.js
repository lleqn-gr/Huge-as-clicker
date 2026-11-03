/* Muskelklicker – Sound-Effekte und Boombox-Musik, komplett per WebAudio erzeugt (keine Dateien nötig) */
window.MK = window.MK || {};
(function (MK) {
const A = MK.Audio = {};
let ac = null, rev = null, master, sfxG, musG, musF = null, noiseBuf, musicTimer = null, step = 0, nextT = 0;

A.unlock = function () {
  if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
  try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
  master = ac.createGain(); sfxG = ac.createGain(); musG = ac.createGain();
  noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  // Klang-Update: Kompressor gegen Übersteuern, kurzer Gym-Hall für Effekte (Fliesen, Beton)
  const comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 4; comp.attack.value = .004; comp.release.value = .18;
  try { const len = Math.round(ac.sampleRate * 1.1), ir = ac.createBuffer(2, len, ac.sampleRate); for (let ch = 0; ch < 2; ch++) { const x = ir.getChannelData(ch); for (let i = 0; i < len; i++) x[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2) * (i < 40 ? i / 40 : 1); }
    rev = ac.createConvolver(); rev.buffer = ir; const wet = ac.createGain(); wet.gain.value = .13; sfxG.connect(rev); rev.connect(wet); wet.connect(master); } catch (e) { }
  musF = ac.createBiquadFilter(); musF.type = 'lowpass'; musF.frequency.value = 20000; musF.Q.value = .7; // Beast-Modus: Musik klingt dumpf wie unter Wasser
  sfxG.connect(master); musG.connect(musF); musF.connect(master); master.connect(comp); comp.connect(ac.destination);
  document.addEventListener('visibilitychange', () => { if (!ac) return; if (document.hidden) ac.suspend(); else ac.resume(); }); // Akku: im Hintergrund schweigt alles
  A.applyVol(); A.music();
};
A.applyVol = function () { if (!ac) return; const s = MK.S.set; master.gain.value = s.vol; sfxG.gain.value = s.sfx; musG.gain.value = s.music * .55; };

function env(g, t, a, d, peak) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
function osc(type, f, t, dur, peak, dest, f2) { const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur); env(g, t, .005, dur, peak); o.connect(g); g.connect(dest || sfxG); o.start(t); o.stop(t + dur + .05); }
function noise(t, dur, peak, type, freq, q, dest) { const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = noiseBuf; f.type = type || 'bandpass'; f.frequency.value = freq || 1000; f.Q.value = q || 1; env(g, t, .004, dur, peak); s.connect(f); f.connect(g); g.connect(dest || sfxG); s.start(t, Math.random() * .5); s.stop(t + dur + .05); }

/* Metall: unharmonische Teiltöne wie bei echten Hantelscheiben – schwer = tiefer und länger */
function metal(t, f, dur, peak) { [[1, 1], [2.76, .55], [5.4, .32], [8.9, .16]].forEach(([r, a], i) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = i ? 'sine' : 'triangle'; o.frequency.value = f * r * (1 + (Math.random() - .5) * .01); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(peak * a, t + .003); g.gain.exponentialRampToValueAtTime(.0001, t + dur / (1 + i * .6)); o.connect(g); g.connect(sfxG); o.start(t); o.stop(t + dur + .05); }); }
/* Glocke/Ding: klare Teiltöne */
function bell(t, f, dur, peak) { [[1, 1], [2, .4], [3.01, .22], [4.2, .1]].forEach(([r, a]) => osc('sine', f * r, t, dur / r ** .3, peak * a)); }
/* Wasserblase */
function bubble(t, f, peak) { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 2.4, t + .06); env(g, t, .004, .07, peak); o.connect(g); g.connect(sfxG); o.start(t); o.stop(t + .1); }
/* Atemgeräusch: gefiltertes Rauschen mit weichem An- und Abschwellen */
function breath(t, dur, peak, freq, inh) {
  const src = ac.createBufferSource(), f = ac.createBiquadFilter(), f2 = ac.createBiquadFilter(), g = ac.createGain(); src.buffer = noiseBuf;
  f.type = 'bandpass'; f.frequency.setValueAtTime(freq * (inh ? .85 : 1.1), t); f.frequency.linearRampToValueAtTime(freq * (inh ? 1.15 : .8), t + dur); f.Q.value = .9; f2.type = 'lowpass'; f2.frequency.value = 3800;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + dur * (inh ? .6 : .25)); g.gain.linearRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(f2); f2.connect(g); g.connect(sfxG); src.start(t, Math.random() * .4); src.stop(t + dur + .05);
}
A.muffle = function (on) { if (!ac || !musF) return; const t = ac.currentTime; musF.frequency.cancelScheduledValues(t); musF.frequency.setValueAtTime(musF.frequency.value, t); musF.frequency.exponentialRampToValueAtTime(on ? 700 : 20000, t + (on ? .35 : .8)); };
A.play = function (name, x) {
  if (!ac || MK.S.set.sfx <= 0) return; const t = ac.currentTime;
  switch (name) {
    case 'orb': { const n = x || 0, f = 880 * Math.pow(1.0595, Math.min(14, n)); osc('sine', f, t, .07, .028, null, f * 1.5); osc('triangle', f * 2, t, .04, .01); break; } // XP-Kugel kommt an: kurzer, mit der Serie steigender Ton
    case 'coinTick': { const n = x || 0, f = 1500 * Math.pow(1.03, Math.min(14, n)); osc('square', f, t, .035, .012); osc('sine', f * 1.5, t + .025, .06, .018); break; }
    case 'thud': { const k = x || .5; osc('sine', 75, t, .22, .12 + k * .14, null, 40); noise(t, .14, .05 + k * .07, 'lowpass', 260, 1); break; } // Gewicht abgesetzt
    case 'clank': { const w = x || 0; metal(t, Math.max(180, 720 - w * 22 + Math.random() * 50), .22 + w * .02, .1); noise(t, .035, .1, 'highpass', 2600, .7); noise(t, .09, .05 + w * .004, 'lowpass', 220, 1); break; }
    case 'grunt': { const o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(130 + Math.random() * 30, t); o.frequency.exponentialRampToValueAtTime(85, t + .22);
      f.type = 'bandpass'; f.frequency.value = 600; f.Q.value = 3; env(g, t, .02, .22, .08); o.connect(f); f.connect(g); g.connect(sfxG); o.start(t); o.stop(t + .3); break; }
    case 'step': noise(t, .06, .06, 'lowpass', 400, 1); break;
    case 'whoosh': noise(t, .25, .07, 'bandpass', 1400, .6); break;
    case 'crit': osc('square', 660, t, .08, .06); osc('square', 990, t + .07, .08, .06); osc('square', 1320, t + .14, .14, .07); noise(t, .2, .06, 'highpass', 5000, 1); break;
    case 'level': [523, 659, 784, 1047].forEach((f, i) => { osc('triangle', f, t + i * .07, .3, .1); osc('sine', f * 2, t + i * .07, .18, .025); }); [523, 659, 784].forEach(f => osc('sine', f, t + .3, .7, .04)); noise(t + .28, .5, .025, 'highpass', 7000, 1); break;
    case 'coin': bell(t, 1319, .18, .06); bell(t + .07, 1760, .32, .06); break;
    case 'buy': bell(t, 880, .12, .05); bell(t + .06, 1320, .25, .05); noise(t, .05, .04, 'highpass', 4000, 1); break;
    case 'error': osc('square', 160, t, .15, .06); break;
    case 'pop': osc('sine', 520, t, .07, .09, null, 1250); osc('sine', 1600, t + .01, .03, .02); break;
    case 'cheer': { for (let i = 0; i < 3; i++) noise(t + i * .05, 1.0, .05, 'bandpass', 900 + i * 500, .8); break; }
    case 'beast': osc('sawtooth', 70, t, .7, .15, null, 40); noise(t, .6, .1, 'lowpass', 300, 1); osc('square', 220, t, .3, .05, null, 440); break;
    case 'win': [523, 659, 784, 659, 784, 1047].forEach((f, i) => { osc('square', f, t + i * .1, .18, .045); osc('triangle', f / 2, t + i * .1, .2, .05); }); [523, 659, 784, 1047].forEach(f => osc('sine', f, t + .62, .9, .035)); break;
    case 'lose': [392, 349, 311, 262].forEach((f, i) => osc('triangle', f, t + i * .16, .25, .08)); break;
    case 'tap': osc('sine', 320 + Math.random() * 60, t, .045, .055); noise(t, .02, .02, 'highpass', 3000, 1); break;
    case 'inhale': { const st = x || 0; breath(t, .32 + st * .1, .035 + st * .02, 1700, true); break; }
    case 'exhale': { const st = x || 0; breath(t, .28 + st * .12, .06 + st * .05, 950, false); if (st > .6) { const o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(115, t); o.frequency.exponentialRampToValueAtTime(90, t + .25); f.type = 'bandpass'; f.frequency.value = 500; f.Q.value = 2.5; env(g, t, .03, .22, .03 * st); o.connect(f); f.connect(g); g.connect(sfxG); o.start(t); o.stop(t + .3); } break; }
    case 'pant': { const n = Math.round(6 + (x || .5) * 14); for (let i = 0; i < n; i++) { const tt = t + i * .19, fade = 1 - i / n * .6; breath(tt, .11, .07 * fade, i % 2 ? 1600 : 1000, i % 2 === 1); } break; }
    case 'rip': { for (let i = 0; i < 7; i++) noise(t + i * .022, .05, .09, 'bandpass', 2400 + Math.random() * 2400, 2.5); break; }
    case 'power': osc('sawtooth', 120, t, .35, .08, null, 30); noise(t, .3, .06, 'lowpass', 500, 1); break;
    case 'thunder': { const s2 = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s2.buffer = noiseBuf; s2.loop = true; f.type = 'lowpass'; f.frequency.value = 180; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.18 * (x || 1), t + .08); g.gain.exponentialRampToValueAtTime(.0001, t + 2.4); s2.connect(f); f.connect(g); g.connect(sfxG); s2.start(t); s2.stop(t + 2.6); break; }
    case 'beat': osc('sine', 1200, t, .04, .05); break;
    case 'chant': { for (let i = 0; i < 3; i++) { noise(t + i * .22, .07, .07, 'bandpass', 1500, 1.2); noise(t + i * .22 + .01, .06, .05, 'bandpass', 2600, 1.5); } noise(t, .8, .035, 'bandpass', 700, .7); break; } // Klatschen im Takt + Rufen
    case 'boo': { for (let i = 0; i < 4; i++) { const o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(150 + i * 23 + Math.random() * 10, t + i * .03); o.frequency.linearRampToValueAtTime(110 + i * 15, t + .9); f.type = 'lowpass'; f.frequency.value = 520; env(g, t + i * .03, .12, .8, .018); o.connect(f); f.connect(g); g.connect(sfxG); o.start(t); o.stop(t + 1.1); } break; }
    case 'murmur': noise(t, .9, .03, 'bandpass', 600, .5); break;
    case 'meme': osc('square', 880, t, .05, .05); osc('square', 660, t + .06, .05, .05); osc('square', 990, t + .12, .1, .05); break;
    case 'bubble': for (let i = 0; i < 7; i++) bubble(t + i * .07 + Math.random() * .04, 300 + Math.random() * 500, .05); break;
    case 'labDone': for (let i = 0; i < 5; i++) bubble(t + i * .05, 400 + Math.random() * 400, .05); bell(t + .25, 1047, .5, .06); bell(t + .35, 1568, .7, .05); break;
    case 'inject': noise(t, .18, .06, 'highpass', 5000, 1.5); osc('sine', 900, t + .15, .1, .03, null, 1400); break;
    case 'psst': noise(t, .07, .05, 'bandpass', 4200, 4); noise(t + .1, .35, .05, 'bandpass', 5200, 3); break;
    case 'whistle': { const o = ac.createOscillator(), g = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain(); o.type = 'sine'; o.frequency.value = 2900; lfo.frequency.value = 38; lg.gain.value = 120; lfo.connect(lg); lg.connect(o.frequency); env(g, t, .01, .55, .08); o.connect(g); g.connect(sfxG); o.start(t); lfo.start(t); o.stop(t + .6); lfo.stop(t + .6); break; }
    case 'stamp': osc('sine', 90, t, .25, .25, null, 45); noise(t, .12, .12, 'lowpass', 600, 1); [392, 330, 262].forEach((f, i) => osc('sawtooth', f, t + .15 + i * .13, .2, .035)); break;
    case 'shuffle': noise(t, .09, .04, 'bandpass', 2400, 2); osc('sine', 1200 + Math.random() * 300, t + .03, .03, .02); break;
    case 'tick': osc('square', 2200, t, .012, .025); break;
    case 'flip': noise(t, .05, .05, 'bandpass', 3200, 1.6); break;
    case 'heart': osc('sine', 70, t, .1, .2, null, 50); osc('sine', 62, t + .14, .09, .14, null, 45); break;
    case 'sniff': for (let i = 0; i < 3; i++) noise(t + i * .08, .05, .03, 'bandpass', 2800, 2); break;
    case 'bark': { const o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(520, t); o.frequency.exponentialRampToValueAtTime(260, t + .14); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 2; env(g, t, .005, .16, .12); o.connect(f); f.connect(g); g.connect(sfxG); o.start(t); o.stop(t + .2); noise(t, .1, .05, 'bandpass', 1500, 1); break; }
    case 'gulp': osc('sine', 180, t, .09, .1, null, 90); bubble(t + .05, 300, .04); break;
    case 'cough': noise(t, .1, .08, 'bandpass', 700, 1.5); noise(t + .16, .09, .06, 'bandpass', 650, 1.5); break;
    case 'rage': { for (let i = 0; i < 3; i++) { const o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(95 + i * 13, t); o.frequency.linearRampToValueAtTime(70 + i * 9, t + .55); f.type = 'lowpass'; f.frequency.value = 900; env(g, t, .03, .55, .07); o.connect(f); f.connect(g); g.connect(sfxG); o.start(t); o.stop(t + .65); } noise(t, .5, .06, 'bandpass', 500, .8); break; }
  }
};

/* ---------- Musik ---------- */
const STY = {
  lofi:   { kick: [1,0,0,0, 0,0,1,0, 0,0,1,0, 0,0,0,0], snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], hat: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,1], bass: [45,0,0,0, 0,0,48,0, 0,0,43,0, 0,0,0,0], lead: [0,0,69,0, 0,72,0,0, 67,0,0,0, 0,0,64,0], wave: 'triangle', hatV: .02 },
  hiphop: { kick: [1,0,0,0, 0,0,0,1, 1,0,1,0, 0,0,0,0], snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1], hat: [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1], bass: [41,0,0,41, 0,0,0,0, 44,0,46,0, 0,0,0,0], lead: [65,0,0,0, 0,0,68,0, 0,0,0,0, 70,0,68,0], wave: 'square', hatV: .015 },
  rock:   { kick: [1,0,0,0, 0,0,1,0, 1,0,0,0, 0,0,1,0], snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], hat: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0], bass: [40,40,40,40, 40,40,40,40, 43,43,43,43, 45,45,43,43], lead: [64,0,67,0, 69,0,67,0, 64,0,62,0, 64,0,0,0], wave: 'sawtooth', hatV: .025 },
  synth:  { kick: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], hat: [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0], bass: [45,45,57,45, 45,45,57,45, 41,41,53,41, 43,43,55,43], lead: [69,0,72,0, 76,0,72,0, 65,0,69,0, 72,0,74,0], wave: 'sawtooth', hatV: .02 },
  techno: { kick: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], snare: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], hat: [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,1], bass: [0,0,38,0, 0,0,38,0, 0,0,38,0, 0,0,41,0], lead: [62,0,0,62, 0,0,65,0, 0,62,0,0, 69,0,0,0], wave: 'square', hatV: .03 },
  epic:   { kick: [1,0,0,0, 0,0,0,0, 1,0,1,0, 0,0,0,0], snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,1,1], hat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], bass: [38,0,0,0, 38,0,0,0, 34,0,0,0, 36,0,0,0], lead: [62,0,65,0, 69,0,0,0, 70,0,69,0, 65,0,67,0], wave: 'triangle', hatV: 0 }
};
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
function schedule() {
  if (!ac) return; const S = MK.S, on = S.music.on && S.eq.boombox && S.set.music > 0;
  if (!on) { nextT = ac.currentTime + .1; return; }
  const m = MK.MUSIC.find(x => x.id === S.music.cur) || MK.MUSIC[0], st = STY[m.id], beast = S.beastOn > 0 ? 1.12 : 1, sp = 60 / (m.bpm * beast) / 4;
  while (nextT < ac.currentTime + .25) {
    const i = step % 16, t = Math.max(nextT, ac.currentTime);
    if (st.kick[i]) { osc('sine', 130, t, .24, .5, musG, 42); noise(t, .012, .12, 'highpass', 3500, 1, musG); }
    if (st.snare[i]) { noise(t, .15, .16, 'bandpass', 1900, .9, musG); osc('triangle', 210, t, .08, .07, musG, 160); }
    if (i === 0 && st.bass.find(v => v)) { const root = st.bass.find(v => v) + 12; [0, 4, 7].forEach(iv => { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'triangle'; o.frequency.value = mtof(root + iv + ((step >> 4) % 4 === 3 ? -2 : 0)); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.018, t + sp * 4); g.gain.linearRampToValueAtTime(.0001, t + sp * 15); o.connect(g); g.connect(musG); o.start(t); o.stop(t + sp * 16); }); }
    if (st.hat[i] && st.hatV) noise(t, .03, st.hatV * 4, 'highpass', 7000, 1, musG);
    if (st.bass[i]) osc(st.wave === 'sawtooth' ? 'sawtooth' : 'triangle', mtof(st.bass[i]), t, sp * 1.8, .12, musG);
    if (st.lead[i] && (step >> 4) % 2 === 1) osc(st.wave, mtof(st.lead[i]), t, sp * 1.5, .05, musG);
    step++; nextT += sp;
  }
}
A.music = function () { if (!ac) return; if (musicTimer) clearInterval(musicTimer); nextT = ac.currentTime + .1; musicTimer = setInterval(schedule, 60); };

})(window.MK);
