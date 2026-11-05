/* Zahlen deutsch schreiben (1.234,5) – auch wenn dem Browser/der App die deutschen Sprachdaten fehlen */
(function () { try { if ((1234.5).toLocaleString('de-DE') === '1.234,5') return; } catch (e) { }
  const orig = Number.prototype.toLocaleString;
  Number.prototype.toLocaleString = function (loc, opt) { if (loc !== 'de-DE' || opt) return orig.call(this, loc, opt);
    const v = +this; if (!isFinite(v)) return String(v); const neg = v < 0, a = Math.abs(v), r = Math.round(a * 1000) / 1000;
    let [i, f] = String(r).split('.'); if (/e/.test(i)) return orig.call(this); i = i.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (neg ? '-' : '') + i + (f ? ',' + f : ''); }; })();
/* Muskelklicker – Spieldaten. Alles, was man ohne Code-Logik anpassen will, steht hier. */
window.MK = window.MK || {};
(function (MK) {

MK.MUSCLES = [
  { id: 'arme',     name: 'Arme',      unlock: 0,  col: '#ee4035' },
  { id: 'brust',    name: 'Brust',     unlock: 0,  col: '#3a86ff' },
  { id: 'beine',    name: 'Beine',     unlock: 0,  col: '#ffd23f' },
  { id: 'ausdauer', name: 'Ausdauer',  unlock: 0,  col: '#2bb673', stat: true },
  { id: 'schulter', name: 'Schultern', unlock: 8, col: '#ff8a3d' },
  { id: 'ruecken',  name: 'Rücken',    unlock: 16, col: '#8a6bff' },
  { id: 'bauch',    name: 'Bauch',     unlock: 24, col: '#ff8fb1' },
  { id: 'nacken',   name: 'Nacken',    unlock: 35, col: '#4cc9c0' }
];

/* kg: wie das Gewicht angezeigt wird (db = Kurzhantel pro Hand, bb = Langhantel gesamt, cable = Kabel/Maschine, bw = Zusatzgewicht, cardio = Stufe) */
MK.EXERCISES = [ // je Gruppe: erste Übung gratis, jede weitere braucht ihr eigenes Gerät (kaufbar ohne Level, benutzbar ab Muskel-Level)
  { id: 'curl',      g: 'arme',     name: 'Bizeps-Curls',            anim: 'curl',       eq: 'hanteln',     lv: 1,  xm: 1.0,  kg: 'db' },
  { id: 'trizeps',   g: 'arme',     name: 'Trizeps über Kopf',       anim: 'tricepsOH',  eq: 'trizepsbank', lv: 10, xm: 1.35, kg: 'db' },
  { id: 'szcurl',    g: 'arme',     name: 'SZ-Curls',                anim: 'barcurl',    eq: 'szstange',    lv: 24, xm: 1.65, kg: 'bb' },
  { id: 'liegestuetz', g: 'brust',  name: 'Liegestütze',             anim: 'pushup',     eq: null,          lv: 1,  xm: 1.0,  kg: 'bw' },
  { id: 'fly',       g: 'brust',    name: 'Butterfly',               anim: 'flySit',     eq: 'butterfly',   lv: 4,  xm: 1.15, kg: 'db' },
  { id: 'presse',    g: 'brust',    name: 'Bankdrücken',             anim: 'benchLie',   eq: 'bank',        lv: 8,  xm: 1.3,  kg: 'bb' },
  { id: 'dips',      g: 'brust',    name: 'Dips',                    anim: 'dips',       eq: 'barren',      lv: 16, xm: 1.45, kg: 'bw' },
  { id: 'crossover', g: 'brust',    name: 'Kabel-Crossover',         anim: 'crossover',  eq: 'kabel',       lv: 26, xm: 1.65, kg: 'cable' },
  { id: 'dbpress',   g: 'schulter', name: 'Kurzhantel-Drücken',      anim: 'dbpressSit', eq: 'hanteln',     lv: 1,  xm: 1.0,  kg: 'db' },
  { id: 'military',  g: 'schulter', name: 'Military Press',          anim: 'ohpress',    eq: 'langhantel',  lv: 14, xm: 1.5,  kg: 'bb' },
  { id: 'dbrow',     g: 'ruecken',  name: 'Kurzhantel-Rudern',       anim: 'dbrow',      eq: 'hanteln',     lv: 1,  xm: 1.0,  kg: 'db' },
  { id: 'klimmzug',  g: 'ruecken',  name: 'Klimmzüge',               anim: 'pullup',     eq: 'stange',      lv: 4,  xm: 1.15, kg: 'bw' },
  { id: 'latzug',    g: 'ruecken',  name: 'Latzug',                  anim: 'latpull',    eq: 'latzug',      lv: 8,  xm: 1.3,  kg: 'cable' },
  { id: 'rudern',    g: 'ruecken',  name: 'T-Bar-Rudern',            anim: 'row',        eq: 'tbar',        lv: 16, xm: 1.5,  kg: 'bb' },
  { id: 'crunch',    g: 'bauch',    name: 'Crunches',                anim: 'crunchLie',  eq: null,          lv: 1,  xm: 1.0,  kg: 'bw' },
  { id: 'plank',     g: 'bauch',    name: 'Plank (halten)',          anim: 'plank',      eq: 'matte',       lv: 5,  xm: 1.15, kg: 'bw', hold: true },
  { id: 'beinheben', g: 'bauch',    name: 'Hängendes Beinheben',     anim: 'legraise',   eq: 'haenge',      lv: 10, xm: 1.35, kg: 'bw' },
  { id: 'squat',     g: 'beine',    name: 'Kniebeugen',              anim: 'squat',      eq: null,          lv: 1,  xm: 1.0,  kg: 'bw' },
  { id: 'waden',     g: 'beine',    name: 'Wadenheben',              anim: 'calf',       eq: 'wadenblock',  lv: 8,  xm: 1.2,  kg: 'bw' },
  { id: 'bbsquat',   g: 'beine',    name: 'Langhantel-Kniebeugen',   anim: 'bbsquat',    eq: 'rack',        lv: 16, xm: 1.5,  kg: 'bb' },
  { id: 'hack',      g: 'beine',    name: 'Hackenschmidt',           anim: 'hack',       eq: 'hack',        lv: 24, xm: 1.6,  kg: 'bb' },
  { id: 'kreuzheben',g: 'beine',    name: 'Kreuzheben',              anim: 'deadlift',   eq: 'plattform',   lv: 30, xm: 1.75, kg: 'bb' },
  { id: 'shrugs',    g: 'nacken',   name: 'Shrugs',                  anim: 'shrug',      eq: 'hanteln',     lv: 1,  xm: 1.0,  kg: 'db' },
  { id: 'facepull',  g: 'nacken',   name: 'Face Pulls',              anim: 'facepull',   eq: 'seilzug',     lv: 8,  xm: 1.25, kg: 'cable' },
  { id: 'farmer',    g: 'nacken',   name: "Farmer's Walk",           anim: 'farmer',     eq: 'farmer',      lv: 14, xm: 1.45, kg: 'db' },
  { id: 'hampel',    g: 'ausdauer', name: 'Hampelmann',              anim: 'jack',       eq: null,          lv: 1,  xm: 1.0,  kg: 'cardio' },
  { id: 'seil',      g: 'ausdauer', name: 'Seilspringen',            anim: 'rope',       eq: 'seil',        lv: 5,  xm: 1.2,  kg: 'cardio' },
  { id: 'laufband',  g: 'ausdauer', name: 'Laufband',                anim: 'run',        eq: 'laufband',    lv: 12, xm: 1.45, kg: 'cardio' }
];


/* Kurzhantel-Gewichte pro Hand. Index 0 ist das Startgewicht. */
MK.WEIGHTS = [1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22.5, 25, 27.5, 30, 32.5, 35, 40, 45, 50, 55, 60];

/* Geräte im Gym. Stufe 1–4: rostig → Stahl → Chrom → Gold. Jede Stufe über 1 gibt +10 % XP auf Übungen mit dem Gerät. */
MK.EQUIP = [ // ohne Level kaufbar; Geräte für Übungen kosten mehr, je höher das Level der Übung (Preis in state.js)
  { id: 'hanteln',     name: 'Kurzhantel-Ablage',      price: 0,    desc: 'Grundausstattung' },
  { id: 'boombox',     name: 'Boombox',                price: 400,  desc: 'Antippen im Gym: Musik & Songs' },
  { id: 'kuehl',       name: 'Kühlschrank',            price: 1200, desc: 'Antippen im Gym: Essen & Meal-Prep' },
  { id: 'butterfly',   name: 'Butterfly-Maschine' }, { id: 'seil', name: 'Springseil' }, { id: 'matte', name: 'Trainingsmatte' }, { id: 'stange', name: 'Klimmzugstange' },
  { id: 'bank',        name: 'Hantelbank' }, { id: 'latzug', name: 'Latzugturm' }, { id: 'wadenblock', name: 'Wadenblock' }, { id: 'seilzug', name: 'Seilzug-Station' },
  { id: 'trizepsbank', name: 'Trizeps-Bank' }, { id: 'haenge', name: 'Hängestation' }, { id: 'laufband', name: 'Laufband' }, { id: 'langhantel', name: 'Langhantel & Scheiben' },
  { id: 'farmer',      name: 'Farmer-Griffe' }, { id: 'barren', name: 'Dip-Barren' }, { id: 'tbar', name: 'T-Bar-Ruderstation' }, { id: 'rack', name: 'Kniebeugen-Rack' },
  { id: 'szstange',    name: 'SZ-Curlstange' }, { id: 'hack', name: 'Hackenschmidt-Maschine' }, { id: 'kabel', name: 'Kabelzug' }, { id: 'plattform', name: 'Kreuzheben-Plattform' },
  { id: 'reifen',      name: 'Strongman-Reifen',       price: 40000, disc: 'reifen', desc: '+15 % Kraft beim Reifen wenden' }
];

MK.EQUIP_MULT = [1, 40, 1600, 64000, 2.56e6, 1.024e8];

/* Frühere Klick-Upgrades (Griffkraft, Fleiß, Kondition, Erholung, Technik) sind jetzt der Skillbaum-Ast „Athlet“. Im Shop gibt es nur noch Gewichte je Muskelgruppe. */
MK.UPGRADES = [];
/* ---------- Imperium: Geschäfte, die passiv Geld bringen (Cookie-Clicker-Prinzip) ----------
   Jedes weitere Stück kostet 16 % mehr. Ausbaustufen verdoppeln die Produktion. Neue Geschäfte: mit dem passenden Turnier-Titel die Lizenz kaufen (keine Level-Grenzen). */
MK.BIZ = [
  { id: 'pfand',   name: 'Pfandflaschen sammeln', icon: '🧴', cost: 15,    inc: 0.045,    req: null,           desc: 'Die Flaschen nach dem Training liegen eh rum.' },
  { id: 'shake',   name: 'Shake-Stand',           icon: '🥤', cost: 100,   inc: 0.45,     req: [{ trophy: 'verein' }], lic: 'verein',       desc: 'Schoko, Vanille, Erdbeere – und ein Hauch Kreide.' },
  { id: 'pt',      name: 'Personal Training',     icon: '📋', cost: 1100,  inc: 3.6,     req: [{ trophy: 'stadt' }], lic: 'stadt',      desc: 'Du zeigst Anfängern, wie man Curls macht.' },
  { id: 'merch',   name: 'Merch-Shop',            icon: '👕', cost: 12e3,  inc: 21.15,    req: [{ trophy: 'bank' }], lic: 'bank',    desc: 'Shirts mit deinem Gesicht. Ja, wirklich.' },
  { id: 'coach',   name: 'Online-Coaching',       icon: '💻', cost: 130e3, inc: 117,   req: [{ trophy: 'land' }], lic: 'land',      desc: 'Trainingspläne per Videocall, rund um die Uhr.' },
  { id: 'supp',    name: 'Supplement-Marke',      icon: '💊', cost: 1.4e6, inc: 630,  req: [{ trophy: 'arm' }], lic: 'arm',   desc: 'Dein eigenes Pulver. Geschmack: „Gainz“.' },
  { id: 'kette',   name: 'Gym-Kette',             icon: '🏋️', cost: 20e6,  inc: 3510,  req: [{ trophy: 'strong' }], lic: 'strong',     desc: 'In jeder Stadt ein Studio mit deinem Namen.' },
  { id: 'app',     name: 'Fitness-App',           icon: '📱', cost: 330e6, inc: 1.98e+04,  req: [{ trophy: 'dm' }], lic: 'dm',  desc: 'Millionen zählen ihre Reps mit deiner App.' },
  { id: 'tv',      name: 'Fitness-TV-Sender',     icon: '📺', cost: 5.1e9, inc: 1.17e+05, req: [{ trophy: 'em' }], lic: 'em',     desc: 'Rund um die Uhr Kniebeugen im Fernsehen.' },
  { id: 'konzern', name: 'Muskel-Konzern',        icon: '🏢', cost: 75e9,  inc: 7.2e+05, req: [{ trophy: 'wm' }], lic: 'wm',  desc: 'Börsennotiert. Die Aktie heißt PUMP.' },
  { id: 'space',   name: 'Weltraum-Gym',          icon: '🚀', cost: 1e12,  inc: 4.5e+06,  req: [{ trophy: 'olymp' }], lic: 'olymp',     desc: 'Bankdrücken in der Schwerelosigkeit. Rekord garantiert.' }
];
/* Jedes Geschäft schaltet einen Trainings-Vorteil frei: mit dem verdienten Geld baust du schneller Muskeln auf.
   Stufe n kostet Grundpreis × 3^n und braucht (n+1)×5 Stück des Geschäfts. */
MK.PERKS = {
  pfand:   { name: 'Proteinriegel vom Pfand', eff: { xpMul: 1.03 }, txt: '×1,03 XP' },
  shake:   { name: 'Gratis-Shakes',           eff: { pumpGain: .06 }, txt: 'Pump füllt sich 6 % schneller' },
  pt:      { name: 'Eigener Trainer',         eff: { xpMul: 1.04 }, txt: '×1,04 XP' },
  merch:   { name: 'Kompressionsshirts',      eff: { crit: .004 }, txt: '+0,4 % perfekte Wiederholungen' },
  coach:   { name: 'Trainingsplan-Software',  eff: { xpMul: 1.04 }, txt: '×1,04 XP' },
  supp:    { name: 'Eigene Supplements',      eff: { xpMul: 1.05, pumpMax: .03 }, txt: '×1,05 XP, +3 % Pump-Bonus' },
  kette:   { name: 'Eigene Geräte-Linie',     eff: { xpMul: 1.05 }, txt: '×1,05 XP' },
  app:     { name: 'Tracking-KI',             eff: { xpMul: 1.06, beastMul: .05 }, txt: '×1,06 XP, Beast +0,05×' },
  tv:      { name: 'Sportwissenschaftler',    eff: { xpMul: 1.06 }, txt: '×1,06 XP' },
  konzern: { name: 'Forschungslabor',         eff: { xpMul: 1.07 }, txt: '×1,07 XP' },
  space:   { name: 'Schwerelos-Training',     eff: { xpMul: 1.08 }, txt: '×1,08 XP' }
};
MK.BIZ_STEPS = [[1, 10], [5, 50], [25, 500], [50, 5e4], [100, 5e6], [150, 5e8], [200, 5e10]]; // [Anzahl, Kostenfaktor] → ×2 Produktion
MK.BIZ_UP_NAMES = ['Bessere Ausstattung', 'Stammkunden', 'Werbung', 'Zweite Filiale', 'Markenrechte', 'Weltweit', 'Legendär'];
MK.CLICK_UPS = [ // jeder Klick bringt zusätzlich X % deines Einkommens pro Sekunde
  { pct: .01, cost: 5e5, need: 'merch', name: 'Goldene Hantel' }, // „Kassen-Griff“ entfernt – heißt jetzt das Klick-Geld-Upgrade im Laden { pct: .01, cost: 5e7, need: 'coach', name: 'Geld-Bizeps' },
  { pct: .01, cost: 5e9, need: 'kette', name: 'Diamant-Griff' }, { pct: .01, cost: 5e11, need: 'tv', name: 'Midas-Curl' }, { pct: .01, cost: 5e13, need: 'konzern', name: 'Gott-Klick' }];
MK.MATERIAL = [
  { name: 'Rostig', a: '#8a5a3c', b: '#6b412a', hi: '#b07a55' },
  { name: 'Stahl',  a: '#8d939b', b: '#5f656d', hi: '#c9ced4' },
  { name: 'Chrom',  a: '#c8d2dc', b: '#7c8894', hi: '#ffffff' },
  { name: 'Gold',   a: '#e6b422', b: '#a77d0e', hi: '#fff1b0' },
  { name: 'Platin', a: '#dfe6ee', b: '#93a0ae', hi: '#ffffff' },
  { name: 'Titan',  a: '#3c424e', b: '#121419', hi: '#a9c8ff' }
];

MK.GYMS = [
  { id: 'keller', name: 'Kellerraum',   fame: 0,    price: 0,    req: [],                                         cap: 3,  fameMul: 1.0,  desc: 'Eine Glühbirne, ein Abfluss, du.' },
  { id: 'verein', name: 'Vereinsgym',   fame: 20,   price: 2500, req: [{ fame: 20 }, { trophy: 'verein' }],         cap: 7,  fameMul: 1.1,  desc: 'SV Eisen 1921. Holzboden, Wimpel, Stammgäste.' },
  { id: 'kette',  name: 'Fitnesskette', fame: 120,  price: 2e6,  req: [{ fame: 120 }, { trophy: 'stadt' }, { wins: 15 }], cap: 12, fameMul: 1.25, desc: 'Neonlicht, Spiegelwand, viele Handys.' },
  { id: 'profi',  name: 'Profi-Studio', fame: 500,  price: 2e8,  req: [{ fame: 500 }, { trophy: 'land' }, { trophy: 'strong' }], cap: 16, fameMul: 1.45, desc: 'Kreide in der Luft, nur Ernsthafte.' },
  { id: 'buehne', name: 'Die Bühne',    fame: 2000, price: 2e10, req: [{ fame: 2000 }, { trophy: 'dm' }, { trophy: 'em' }], cap: 22, fameMul: 1.7,  desc: 'Scheinwerfer, Vorhang, dein eigener Tempel.' }
];


MK.RANKS = [[0,'Lauch'],[6,'Hänfling'],[15,'Anfänger'],[30,'Gym-Gänger'],[55,'Pumper'],[90,'Breiter Typ'],[140,'Masse-Monster'],[210,'Wettkampf-Tier'],[300,'Profi'],[420,'Olympia-Anwärter'],[600,'Legende']];
MK.RANK_STAGE = [0,0,1,2,2,3,4,4,5,5,6];

MK.PRIZE = [12, 25, 50, 95, 180, 340, 640, 1200];

MK.DISC = [
  { id: 'klimm', name: 'Klimmzug-Duell', groups: { arme: .6, ruecken: .4 }, ureq: null, unit: 'Punkte', dur: 10, mult: 1,
    how: 'Schnell tippen!',
    opp: ['Kevin aus dem Kurs','Fitnessstudio-Opa','Crossfit-Chantal','Türsteher Dragan','Kletter-Kai','Landesmeister Jens','Der Schrank','Mr. Universum'],
    tw: [{ at: 2, n: 'Griffkraft', d: 'Griff leer = kurz abrutschen.' }, { at: 5, n: 'Nasse Stange', d: 'Griff leert sich schneller.' }],
    goal: [11,  15,  21,  29,  40,  37,  48,  62] },
  { id: 'drueck', name: 'Bankdrück-Duell', groups: { brust: .5, schulter: .5 }, ureq: [{ beat: ['klimm', 2] }], unit: 'Wiederholungen', dur: 15, mult: 1.2,
    how: 'Tippen drückt die Stange von der Brust nach oben.',
    opp: ['Praktikant Tobi','Bankdrück-Bernd','Hausmeister-Neffe Horst','Brustpanzer Basti','Die Presse','Gorilla-Gregor','Stahlbrust Svenja','Hydraulik-Heinz'],
    tw: [{ at: 2, n: 'Schwere Momente', d: 'Rot = doppelt so schwer.' }, { at: 5, n: 'Zittern', d: 'Rot kommt öfter.' }],
    goal: [1,  2,  3,  5,  8,  10,  16,  21] },
  { id: 'squat', name: 'Kniebeugen-Takt', groups: { beine: 1 }, ureq: [{ beat: ['drueck', 2] }], unit: 'Punkte', dur: 15, mult: 1.35,
    how: 'Tippen, wenn der Strich im Grünen ist.',
    opp: ['Spinning-Steffi','Waden-Walter','Quadrizeps-Quentin','Beintag-Bea','Säulen-Sören','Oberschenkel-Olga','Kniebeugen-König','Der Wolkenkratzer'],
    tw: [{ at: 3, n: 'Wandernde Zone', d: 'Grünes Feld wandert.' }, { at: 5, n: 'Rote Falle', d: 'Rot kostet Punkte.' }],
    goal: [12,  14,  17,  17,  20,  22,  27,  33] },
  { id: 'arm', name: 'Armdrücken', groups: { arme: .7, schulter: .3 }, ureq: [{ beat: ['klimm', 4] }, { fame: 25 }], unit: 'Sieg', dur: 20, mult: 1.5,
    how: 'Schneller tippen, als er drückt.',
    opp: ['Lkw-Lutz','Bizeps-Biggi','Hafen-Hannes','Unterarm-Uwe','Eisenhand Ella','Bär aus Bayern','Die Zange','Der Hydraulikarm'],
    tw: [{ at: 2, n: 'Nachdrücken', d: 'Er drückt in Schüben.' }, { at: 5, n: 'Zermürben', d: 'Härtere Schübe.' }],
    goal: [1, 1, 1, 1, 1, 1, 1, 1] },
  { id: 'kreuz', name: 'Kreuzheben', groups: { beine: .5, ruecken: .5 }, ureq: [{ beat: ['squat', 3] }], unit: 'Sekunden im Feld', dur: 15, mult: 1.7,
    how: 'Stange im grünen Feld halten.',
    opp: ['Rücken-Rudi','Kreuz-Klaus','Hebe-Hedwig','Granit-Gustav','Kettenkarl','Wikinger-Wiebke','Der Kran','Atlas'],
    tw: [{ at: 3, n: 'Sprünge', d: 'Feld springt.' }, { at: 6, n: 'Ermüdung', d: 'Stange wird schwerer.' }],
    goal: [10,  11,  10,  9.5,  8.5,  8,  7.5,  6.5] },
  { id: 'reifen', name: 'Reifen wenden', groups: { beine: .5, arme: .3, ruecken: .2 }, ureq: [{ beat: ['kreuz', 3] }], unit: 'Würfe', dur: 15, mult: 1.9,
    how: 'Bis 100 % hochstemmen.',
    opp: ['Bauer Bodo','Traktor-Tina','Reifen-Rainer','Schmied Sven','Bagger-Bettina','Holzfäller Henk','Der Felsbrocken','Thor aus Tostedt'],
    tw: [{ at: 2, n: 'Rutschiger Reifen', d: 'Sackt schneller ab.' }, { at: 4, n: 'Totpunkt', d: 'Mitte zählt halb.' }],
    goal: [1,  2,  2,  3,  3,  4,  6,  8] },
  { id: 'truck', name: 'Truck ziehen', groups: { ausdauer: .5, beine: .5 }, ureq: [{ beat: ['reifen', 3] }], unit: 'Meter', dur: 15, mult: 2.1,
    how: 'Tippen zieht den Truck.',
    opp: ['Spediteur Sascha','Fernfahrer Frank','Diesel-Doris','Zugmaschine Zoran','Schwerlast-Sabine','Der Autobahnkönig','Lokomotive Lars','Der Unaufhaltsame'],
    tw: [{ at: 2, n: 'Steigung', d: 'Bergauf schwerer.' }, { at: 5, n: 'Gegenwind', d: 'Böen bremsen.' }],
    goal: [9,  11,  9,  12,  15,  17,  19,  24] }
];

/* Turniere: feste Disziplinen je Runde → jedes Turnier fordert andere Muskeln. Freigeschaltet über gewonnene Duelle, Ruhm und frühere Titel.
   Wer gewinnt, bekommt einen Titel – Titel öffnen neue Geschäfte im Imperium und neue Gyms. */
MK.TOURNEYS = [
  { id: 'verein', name: 'Vereinsmeisterschaft',   title: 'Vereinsmeister',    tier: 0, list: ['klimm', 'drueck', 'klimm'],                       req: [{ beat: ['klimm', 3] }],                                  fee: 30,     reward: { money: 220,    sp: 1, dia: 1,  fame: 15 },   trophy: 'bronze' },
  { id: 'stadt',  name: 'Stadtmeisterschaft',     title: 'Stadtmeister',      tier: 1, list: ['squat', 'drueck', 'klimm'],                       req: [{ lv: 12 }, { kfa: 22 }, { fame: 35 }, { trophy: 'verein' }],                     fee: 120,    reward: { money: 700,    sp: 1, dia: 2,  fame: 35 },   trophy: 'silber' },
  { id: 'bank',   name: 'Bankdrück-Cup',          title: 'Bankdrück-König',   tier: 1, list: ['drueck', 'drueck', 'drueck'],                     req: [{ lv: 14 }, { kfa: 21 }, { beat: ['drueck', 4] }, { trophy: 'verein' }],                                fee: 200,    reward: { money: 900,    sp: 1, dia: 2,  fame: 40 },   trophy: 'silber' },
  { id: 'land',   name: 'Landesmeisterschaft',    title: 'Landesmeister',     tier: 2, list: ['squat', 'kreuz', 'drueck', 'klimm', 'squat'],     req: [{ lv: 35 }, { kfa: 19 }, { fame: 130 }, { trophy: 'stadt' }],                     fee: 400,    reward: { money: 2200,   sp: 2, dia: 3,  fame: 80 },   trophy: 'gold' },
  { id: 'arm',    name: 'Armdrück-Meisterschaft', title: 'Eisenarm',          tier: 2, list: ['arm', 'arm', 'arm', 'arm', 'arm'],                req: [{ lv: 40 }, { kfa: 20 }, { beat: ['arm', 3] }, { fame: 100 }, { trophy: 'land' }],                    fee: 700,    reward: { money: 3000,   sp: 2, dia: 3,  fame: 90 },   trophy: 'gold' },
  { id: 'strong', name: 'Strongman-Cup',          title: 'Strongman',         tier: 3, list: ['reifen', 'kreuz', 'truck', 'reifen', 'truck'],    req: [{ lv: 60 }, { kfa: 24 }, { beat: ['reifen', 3] }, { trophy: 'land' }],            fee: 1200,   reward: { money: 6000,   sp: 2, dia: 4,  fame: 150 },  trophy: 'gold' },
  { id: 'dm',     name: 'Deutsche Meisterschaft', title: 'Deutscher Meister', tier: 3, list: ['klimm', 'drueck', 'squat', 'kreuz', 'arm'],       req: [{ lv: 80 }, { kfa: 16 }, { fame: 450 }, { trophy: 'land' }],                      fee: 1500,   reward: { money: 8000,   sp: 2, dia: 5,  fame: 200 },  trophy: 'gold' },
  { id: 'em',     name: 'Europameisterschaft',    title: 'Europameister',     tier: 4, list: ['arm', 'kreuz', 'reifen', 'drueck', 'squat', 'truck', 'klimm'], req: [{ lv: 120 }, { kfa: 14 }, { fame: 1200 }, { trophy: 'dm' }, { trophy: 'strong' }], fee: 6000,   reward: { money: 30000,  sp: 3, dia: 8,  fame: 500 },  trophy: 'platin' },
  { id: 'wm',     name: 'Weltmeisterschaft',      title: 'Weltmeister',       tier: 5, list: ['klimm', 'truck', 'kreuz', 'arm', 'drueck', 'reifen', 'squat'], req: [{ lv: 180 }, { kfa: 12 }, { fame: 3000 }, { trophy: 'em' }],                       fee: 25000,  reward: { money: 120000, sp: 4, dia: 15, fame: 1500 }, trophy: 'diamant' },
  { id: 'olymp',  name: 'Mr. Olympia',            title: 'Mr. Olympia',       tier: 6, list: ['drueck', 'reifen', 'arm', 'truck', 'kreuz', 'squat', 'klimm'], req: [{ lv: 280 }, { kfa: 10 }, { fame: 8000 }, { trophy: 'wm' }, { trophy: 'arm' }, { trophy: 'bank' }], fee: 100000, reward: { money: 500000, sp: 6, dia: 30, fame: 4000 }, trophy: 'diamant' }
];
MK.TOURNEYS.forEach(T => { T.rounds = T.list.length; T.fame = (T.req.find(r => r.fame != null) || { fame: 0 }).fame; });


MK.EVENTS = [
  { name: 'Doppelte Zeit',         desc: 'Alle Runden dauern 50 % länger.',               mod: { time: 1.5 } },
  { name: 'Schwergewichts-Woche',  desc: 'Gegner sind 15 % stärker, Preise 50 % höher.',  mod: { goal: 1.15, prize: 1.5 } },
  { name: 'Turbo-Woche',           desc: 'Jeder Tipp zählt 20 % mehr.',                   mod: { power: 1.2 } },
  { name: 'Publikumswoche',        desc: 'Doppelter Ruhm für Siege.',                     mod: { fame: 2 } },
  { name: 'Glückswoche',           desc: 'Doppeltes Preisgeld.',                          mod: { prize: 2 } }
];
MK.EVENT_TOPS = ['event-flamme','event-tiger','event-blitz','event-retro','event-camo2','event-neon'];

/* ---------- Skillbaum: 9 Äste, 270 kaufbare Skills (Athlet = frühere Shop-Upgrades Griffkraft, Fleiß, Kondition, Erholung, Technik) ----------
   Jeder Ast hat eine Hauptlinie (15 Skills, Schlüssel-Skills bei 5/10/15), Seitenzweige (je 2 Skills)
   und zwischen den Ästen Brücken-Skills. Tiefer = teurer und ab höherem Gesamt-Level. */
MK.SKILL_BRANCHES = [
  { id: 'kraft', name: 'Kraft', icon: 'hantel', main: { xp: .03 }, 
    pool: [{ xp: .03 }, { g_arme: .08 }, { wXp: .008 }, { g_brust: .08 }, { g_beine: .08 }, { weakXp: .08 }, { g_ruecken: .08 }, { xp: .03 }, { g_schulter: .08 }, { wXp: .008 }, { g_bauch: .08 }, { g_nacken: .08 }, { weakXp: .08 }, { g_ausdauer: .08 }, { xp: .03 }],
    tpool: [{ wXp: .006 }, { g_arme: .06 }, { weakXp: .06 }, { g_beine: .06 }, { xp: .02 }, { g_brust: .06 }, { g_ruecken: .06 }, { wXp: .006 }, { g_schulter: .06 }, { weakXp: .06 }, { g_bauch: .06 }, { xp: .02 }, { g_nacken: .06 }, { g_ausdauer: .06 }],
    keys: [{ xp: .1 }, { wXp: .02, xp: .05 }, { xp: .12, weakXp: .15 }],
    spine: ['Kraftbasis', 'Muskelfaser', 'Grundkraft', 'Volumen', 'Hypertrophie', 'Dichte Fasern', 'Kraftreserve', 'Eisenwille', 'Schwerlast', 'Masse-Monster', 'Stahlfasern', 'Granitkörper', 'Kolossal', 'Urgewalt', 'Titan'],
    twig: ['Fokus', 'Supersatz', 'Drop-Set', 'Pyramide', 'Negativ-Wdh.', 'Zwangswdh.', 'Spannung', 'Kontraktion', 'Peak', 'Stretch', 'Pause-Wdh.', 'Teilwdh.', 'Vorermüdung', 'Volle Bewegung'] },
  { id: 'technik', name: 'Technik', icon: 'ziel', main: { crit: .006 }, 
    pool: [{ crit: .006 }, { holdXp: .1 }, { critMul: .25 }, { strainLess: .1 }, { crit: .006 }, { safeW: 1 }, { critMul: .25 }, { holdXp: .1 }, { crit: .006 }, { strainLess: .1 }, { critMul: .3 }, { crit: .006 }, { safeW: 1 }, { holdXp: .12 }, { crit: .008 }],
    tpool: [{ critMul: .2 }, { crit: .004 }, { strainLess: .08 }, { holdXp: .08 }, { critMul: .2 }, { crit: .004 }, { strainLess: .08 }, { holdXp: .08 }, { crit: .004 }, { critMul: .2 }, { strainLess: .08 }, { crit: .004 }, { holdXp: .08 }, { critMul: .25 }],
    keys: [{ crit: .02, critMul: .5 }, { safeW: 1, strainLess: .25 }, { crit: .03, critMul: 1 }],
    spine: ['Saubere Technik', 'Körpergefühl', 'Griffwechsel', 'Atmung', 'Präzision', 'Bewegungsbahn', 'Kontrolle', 'Timing', 'Feinmotorik', 'Perfektionist', 'Lehrbuch', 'Meisterschüler', 'Feinschliff', 'Instinkt', 'Großmeister'],
    twig: ['Spiegelblick', 'Daumengriff', 'Hakengriff', 'Bremsen', 'Explosiv', 'Tempo 3-1-1', 'Rumpfspannung', 'Schulterblatt', 'Fußstellung', 'Blick nach vorn', 'Lockout', 'Halten', 'Nachdruck', 'Rhythmus'] },
  { id: 'pump', name: 'Pump', icon: 'tropfen', main: { pumpGain: .04 }, 
    pool: [{ pumpGain: .04 }, { pumpMax: .04 }, { pumpDecay: .05 }, { pumpCash: .06 }, { pumpGain: .04 }, { mealDur: .1 }, { pumpMax: .05 }, { pumpDecay: .05 }, { pumpCash: .06 }, { pumpGain: .05 }, { mealDur: .1 }, { pumpMax: .05 }, { pumpDecay: .06 }, { pumpCash: .08 }, { pumpGain: .05 }],
    tpool: [{ pumpMax: .03 }, { pumpDecay: .04 }, { mealDur: .08 }, { pumpGain: .03 }, { pumpCash: .05 }, { pumpMax: .03 }, { pumpDecay: .04 }, { mealDur: .08 }, { pumpGain: .03 }, { pumpCash: .05 }, { pumpMax: .03 }, { pumpDecay: .04 }, { mealDur: .08 }, { pumpGain: .04 }],
    keys: [{ pumpMax: .15, pumpDecay: .05 }, { mealDur: .25, pumpGain: .1 }, { pumpMax: .2, pumpCash: .2 }],
    spine: ['Warm-up', 'Durchblutung', 'Blutfluss', 'Aufgepumpt', 'Pump-Tier', 'Adern', 'Glykogen', 'Volle Speicher', 'Ballon', 'Pump-König', 'Druck', 'Dauerpump', 'Prall', 'Bersten', 'Pump-Gott'],
    twig: ['Elektrolyte', 'Salz', 'Wasser', 'Kohlenhydrate', 'Kurze Pausen', 'Hohe Wdh.', 'Brennen', 'Nachbrennen', 'Isolation', 'Sätze stapeln', 'Ausharren', 'Zweiter Atem', 'Lange Luft', 'Ruhepuls'] },
  { id: 'beast', name: 'Beast', icon: 'flamme', main: { beastDur: .5 }, 
    pool: [{ beastDur: .5 }, { beastMul: .08 }, { beastCash: .1 }, { beastCrit: .01 }, { beastDur: .5 }, { pumpGain: .03 }, { beastMul: .1 }, { beastCash: .1 }, { beastDur: .6 }, { beastCrit: .012 }, { beastMul: .1 }, { pumpGain: .03 }, { beastCash: .12 }, { beastDur: .6 }, { beastCrit: .015 }],
    tpool: [{ beastMul: .06 }, { beastCash: .08 }, { beastDur: .4 }, { beastCrit: .008 }, { pumpGain: .02 }, { beastMul: .06 }, { beastCash: .08 }, { beastDur: .4 }, { beastCrit: .008 }, { pumpGain: .02 }, { beastMul: .06 }, { beastCash: .08 }, { beastDur: .4 }, { beastCrit: .01 }],
    keys: [{ beastMul: .3, beastDur: 2 }, { beastCrit: .04, beastCash: .3 }, { beastMul: .5, beastDur: 3 }],
    spine: ['Funke', 'Glut', 'Flamme', 'Wut', 'Biest', 'Brüllen', 'Raserei', 'Blutrausch', 'Inferno', 'Bestie', 'Vulkan', 'Feuersturm', 'Wildheit', 'Apokalypse', 'Urbiest'],
    twig: ['Zähne zeigen', 'Knurren', 'Schweißausbruch', 'Adrenalin', 'Tunnelblick', 'Stampfen', 'Kriegsschrei', 'Zorn', 'Unruhe', 'Hitze', 'Fieber', 'Trommeln', 'Herzrasen', 'Ekstase'] },
  { id: 'wettkampf', name: 'Wettkampf', icon: 'faust', main: { comp: .03 }, 
    pool: [{ comp: .03 }, { d_klimm: .08 }, { compFame: .06 }, { d_drueck: .08 }, { grip: .05 }, { twist: .05 }, { d_squat: .08 }, { compTime: .25 }, { d_arm: .08 }, { comp: .03 }, { d_kreuz: .08 }, { twist: .05 }, { d_reifen: .08 }, { compFame: .08 }, { d_truck: .08 }],
    tpool: [{ grip: .04 }, { compTime: .2 }, { d_klimm: .06 }, { twist: .04 }, { d_drueck: .06 }, { compFame: .05 }, { d_squat: .06 }, { grip: .04 }, { d_arm: .06 }, { compTime: .2 }, { d_kreuz: .06 }, { twist: .04 }, { d_reifen: .06 }, { d_truck: .06 }],
    keys: [{ comp: .1, compTime: 1 }, { twist: .15, compFame: .15 }, { comp: .15, twist: .12 }],
    spine: ['Wettkampfgeist', 'Lampenfieber', 'Nervenstärke', 'Siegeswille', 'Champion', 'Konter', 'Durchhalten', 'Kampfgeist', 'Ehrgeiz', 'Unbesiegbar', 'Titelverteidiger', 'Arena', 'Legende', 'Unaufhaltsam', 'Weltmeister'],
    twig: ['Eisengriff', 'Schnellkraft', 'Startschuss', 'Endspurt', 'Gegner lesen', 'Kreide', 'Ruhe bewahren', 'Konzentration', 'Taktik', 'Hebelwirkung', 'Psychospiel', 'Revanche', 'Zugabe', 'Krafttank'] },
  { id: 'geld', name: 'Imperium', icon: 'muenze', main: { bizInc: .04 },
    pool: [{ bizInc: .04 }, { bizCheap: .01 }, { offBiz: .04 }, { upCheap: .015 }, { bizInc: .04 }, { clickInc: .002 }, { lvInc: .0005 }, { bizInc: .05 }, { bizCheap: .012 }, { offBiz: .05 }, { upCheap: .02 }, { bizInc: .06 }, { clickInc: .003 }, { lvInc: .0008 }, { bizInc: .08 }],
    tpool: [{ bizCheap: .008 }, { offBiz: .03 }, { bizInc: .03 }, { upCheap: .012 }, { clickInc: .0015 }, { lvInc: .0004 }, { bizInc: .03 }, { bizCheap: .008 }, { offBiz: .03 }, { upCheap: .012 }, { bizInc: .04 }, { clickInc: .002 }, { lvInc: .0005 }, { bizInc: .05 }],
    keys: [{ bizInc: .15, offBiz: .1 }, { bizCheap: .04, upCheap: .05 }, { bizInc: .25, clickInc: .01 }],
    spine: ['Kleingewerbe', 'Gewerbeschein', 'Startkapital', 'Kundenstamm', 'Filialist', 'Franchise', 'Großhändler', 'Investor', 'Holding', 'Konzernchef', 'Aufsichtsrat', 'Börsengang', 'Monopol', 'Weltmarkt', 'Tycoon'],
    twig: ['Pfandbon', 'Stempelkarte', 'Rabattaktion', 'Werbeflyer', 'Mundpropaganda', 'Lieferdienst', 'Nachtschicht', 'Lagerhalle', 'Logistik', 'Steuerberater', 'Patent', 'Lobby', 'Aktienrückkauf', 'Goldene Bilanz'] },
  { id: 'ruhm', name: 'Ruhm', icon: 'stern', main: { fame: .04 }, 
    pool: [{ fame: .04 }, { viral: .06 }, { compFame: .05 }, { fameXp: .02 }, { crowd: 1 }, { fame: .04 }, { viral: .08 }, { fameXp: .02 }, { compFame: .06 }, { fame: .05 }, { crowd: 1 }, { viral: .08 }, { fameXp: .025 }, { compFame: .08 }, { fame: .06 }],
    tpool: [{ viral: .05 }, { crowd: 1 }, { fameXp: .015 }, { fame: .03 }, { compFame: .04 }, { viral: .05 }, { crowd: 1 }, { fameXp: .015 }, { fame: .03 }, { compFame: .04 }, { viral: .05 }, { crowd: 1 }, { fameXp: .015 }, { fame: .04 }],
    keys: [{ fame: .15, crowd: 2 }, { fameXp: .06, viral: .2 }, { fame: .2, compFame: .2 }],
    spine: ['Charisma', 'Ausstrahlung', 'Lokalgröße', 'Bekanntheit', 'Star', 'Influencer', 'Fanliebling', 'Promi', 'Vorbild', 'Ikone', 'Superstar', 'Weltstar', 'Kult', 'Mythos', 'Unsterblich'],
    twig: ['Selfie', 'Hashtag', 'Story', 'Reel', 'Autogramm', 'Fanpost', 'Interview', 'Talkshow', 'Titelbild', 'Poster', 'Werbespot', 'Kinofilm', 'Statue', 'Biografie'] },
  { id: 'glueck', name: 'Glück', icon: 'auge', main: { bonusRate: .05 }, 
    pool: [{ bonusRate: .05 }, { bonusMul: .08 }, { jackpot: .001 }, { crit: .004 }, { crit: .004 }, { bonusRate: .05 }, { jackpot: .001 }, { bonusMul: .1 }, { crit: .005 }, { crit: .005 }, { bonusRate: .06 }, { jackpot: .0015 }, { bonusMul: .12 }, { crit: .006 }, { jackpot: .002 }],
    tpool: [{ bonusMul: .06 }, { crit: .003 }, { jackpot: .0008 }, { bonusRate: .04 }, { crit: .003 }, { bonusMul: .06 }, { crit: .003 }, { jackpot: .0008 }, { bonusRate: .04 }, { crit: .003 }, { bonusMul: .06 }, { crit: .003 }, { jackpot: .001 }, { bonusRate: .05 }],
    keys: [{ bonusMul: .25, crit: .01 }, { jackpot: .004, bonusRate: .15 }, { crit: .02, jackpot: .005 }],
    spine: ['Glücksauge', 'Spürnase', 'Schatzsucher', 'Kleeblatt', 'Glückspilz', 'Fundstück', 'Hufeisen', 'Sternschnuppe', 'Jackpot', 'Goldfinger', 'Schicksal', 'Glücksritter', 'Fortuna', 'Füllhorn', 'Midas'],
    twig: ['Geldfund', 'Flaschenpost', 'Fundbüro', 'Wunschbrunnen', 'Glückskeks', 'Würfelglück', 'Losnummer', 'Talisman', 'Marienkäfer', 'Glückszahl', 'Schornsteinfeger', 'Glücksbringer', 'Regenbogen', 'Diamantader'] },
  { id: 'athlet', name: 'Athlet', icon: 'blitz', main: { allXp: .03 },
    pool: [{ allXp: .03 }, { cash: .15 }, { pumpMax: .05 }, { pumpDecay: .05 }, { crit: .006 }, { allXp: .03 }, { cash: .15 }, { pumpMax: .05 }, { pumpDecay: .05 }, { crit: .006 }, { allXp: .04 }, { cash: .2 }, { pumpMax: .06 }, { pumpDecay: .06 }, { allXp: .05 }],
    tpool: [{ cash: .1 }, { offXp: .1 }, { crit: .004 }, { pumpMax: .04 }, { allXp: .02 }, { offXp: .1 }, { pumpDecay: .04 }, { crit: .004 }, { pumpMax: .04 }, { allXp: .02 }, { offXp: .1 }, { pumpDecay: .05 }, { crit: .005 }, { offXp: .1 }], // offXp: Trainer trainiert offline mit (4 × 10 % = 40 %)
    keys: [{ allXp: .08, cash: .3 }, { pumpMax: .15, pumpDecay: .15 }, { allXp: .15, crit: .02 }],
    spine: ['Griffkraft', 'Fleiß', 'Kondition', 'Erholung', 'Technik-Drill', 'Stahlgriff', 'Arbeitstier', 'Zweite Luft', 'Regeneration', 'Saubere Form', 'Schraubstock', 'Akkordarbeit', 'Pferdelunge', 'Tiefschlaf', 'Vollathlet'],
    twig: ['Kreidehände', 'Trainer-Spätschicht', 'Ruhepuls', 'Pausenbrot', 'Zughilfe', 'Trainer-Überstunden', 'Atemtechnik', 'Faszienrolle', 'Spiegelcheck', 'Handgelenk', 'Trainer-Nachtschicht', 'Eisbad', 'Feinschliff', 'Trainer rund um die Uhr'] }
];
MK.SKILLS = (function () {
  const out = [{ id: 'start', x: 0, y: 0, name: 'Erster Schritt', desc: 'Du hast angefangen. Das ist der schwerste Teil.', cost: 0, req: [], icon: 'stern', eff: {}, lv: 0, br: null }];
  const N = MK.SKILL_BRANCHES.length, R0 = 270, STEP = 125, lvAt = d => d <= 1 ? 0 : Math.round(4 * Math.pow(d - 1, 1.42)), costAt = d => 1 + Math.floor((d - 1) / 3);
  const mul = (e, f) => Object.fromEntries(Object.entries(e).map(([k, v]) => [k, k === 'offXp' ? v : k === 'crowd' || k === 'safeW' ? Math.max(1, Math.round(v * (k === 'safeW' ? 1 : f))) : Math.round(v * f * 100000) / 100000]));
  MK.SKILL_BRANCHES.forEach((B, bi) => {
    const th0 = -Math.PI / 2 + bi * (2 * Math.PI / N);
    const pos = (r, extra) => { const th = th0 + r * .00012 + (extra || 0); return [Math.cos(th) * r, Math.sin(th) * r]; };
    let prev = 'start', ti = 0;
    for (let d = 1; d <= 15; d++) {
      const r = R0 + (d - 1) * STEP, [x, y] = pos(r), key = d % 5 === 0, id = `${B.id}-${d}`, f = 1 + (d - 1) * .06;
      out.push({ id, br: B.id, x, y, name: B.spine[d - 1], cost: costAt(d) + (key ? 2 : 0), req: [prev], icon: key ? 'krone' : B.icon, key, eff: key ? mul(B.keys[d / 5 - 1], 1 + d * .03) : mul(B.pool[d - 1], f), lv: lvAt(d), d });
      if (d % 2 === 0) { // Seitenzweig mit 2 Skills, immer in dieselbe Drehrichtung
        const side = (d / 2) % 2 ? 1 : -1, nx = -Math.sin(th0), ny = Math.cos(th0), ox = Math.cos(th0), oy = Math.sin(th0);
        for (let k = 1; k <= 2; k++) {
          const tid = `${B.id}-t${d}-${k}`, off = side * (k * 100), out2 = 30 * k;
          const tw = B.tpool[(ti * 2 + k - 1) % B.tpool.length];
          out.push({ id: tid, br: B.id, x: x + nx * off + ox * out2, y: y + ny * off + oy * out2, name: B.twig[ti * 2 + k - 1] || B.twig[(ti * 2 + k - 1) % B.twig.length], cost: costAt(d), req: [k === 1 ? id : `${B.id}-t${d}-1`], icon: B.icon, eff: mul(tw, f), lv: lvAt(d), d });
        }
        ti++;
      }
      prev = id;
    }
  });
  // Brücken zwischen benachbarten Ästen
  const BR_NAMES = ['Allrounder', 'Ganzkörper', 'Gleichgewicht', 'Synergie', 'Harmonie', 'Vielseitig', 'Brückenbauer', 'Vollendung', 'Kreisschluss'];
  MK.SKILL_BRANCHES.forEach((B, bi) => {
    const C = MK.SKILL_BRANCHES[(bi + 1) % N], th = -Math.PI / 2 + (bi + .5) * (2 * Math.PI / N), r = R0 + 8 * STEP + 40;
    const eff = {}; [B.main, C.main].forEach(e => { for (const k in e) eff[k] = (eff[k] || 0) + e[k] * 2.5; });
    out.push({ id: `br-${bi}`, br: 'bruecke', x: Math.cos(th) * r, y: Math.sin(th) * r, name: BR_NAMES[bi], cost: 4, req: [`${B.id}-9`, `${C.id}-9`], icon: 'leute', eff, lv: lvAt(9), d: 9 });
  });
  return out;
})();
const p1 = v => (Math.round(v * 1000) / 10).toLocaleString('de-DE'), n2 = v => (Math.round(v * 100) / 100).toLocaleString('de-DE'), n1 = v => (Math.round(v * 10) / 10).toLocaleString('de-DE');
MK.SKILL_EFF_TXT = {
  allXp: v => `+${p1(v)} % auf alle Muskel-XP (Griffkraft)`,
  offXp: v => `Personal Trainer trainiert offline mit: +${Math.round(v * 100)} % Tempo (bis 40 %)`,
  xp: v => `+${p1(v)} % Muskel-XP`, crit: v => `+${p1(v)} % Chance auf perfekte Wiederholungen`, critMul: v => `Perfekte Wiederholungen +${n2(v)} × XP`,
  pumpGain: v => `Pump füllt sich ${Math.round(v * 100)} % schneller`, pumpMax: v => `+${Math.round(v * 100)} % Bonus bei vollem Pump`, pumpDecay: v => `Pump fällt ${Math.round(v * 100)} % langsamer`,
  beastDur: v => `Beast-Modus +${n1(v)} s`, beastMul: v => `Beast-Modus +${n2(v)} × XP`,
  comp: v => `+${Math.round(v * 100)} % Kraft im Wettkampf`, grip: v => `+${Math.round(v * 100)} % Kraft bei Armdrücken und Kreuzheben`, compTime: v => `+${n2(v)} s Zeit im Wettkampf`,
  cash: v => `+${Math.round(v * 100)} % Geld pro Klick`, money: v => `+${Math.round(v * 100)} % Preisgeld`, shop: v => `Shop ${p1(v)} % günstiger`, sponsor: v => `+${Math.round(v * 100)} % Sponsoren-Diamanten`,
  fame: v => `+${Math.round(v * 100)} % Ruhm`, viral: v => `Virale Clips ${Math.round(v * 100)} % öfter`, crowd: v => `+${v} Zuschauer`,
  g_arme: v => `+${Math.round(v * 100)} % XP für Arme`, g_brust: v => `+${Math.round(v * 100)} % XP für Brust`, g_beine: v => `+${Math.round(v * 100)} % XP für Beine`, g_ausdauer: v => `+${Math.round(v * 100)} % XP für Ausdauer`,
  g_schulter: v => `+${Math.round(v * 100)} % XP für Schultern`, g_ruecken: v => `+${Math.round(v * 100)} % XP für Rücken`, g_bauch: v => `+${Math.round(v * 100)} % XP für Bauch`, g_nacken: v => `+${Math.round(v * 100)} % XP für Nacken`,
  wXp: v => `+${p1(v)} % XP je Gewichtsstufe (schwerer lohnt sich mehr)`, weakXp: v => `+${Math.round(v * 100)} % XP auf deine schwächste Muskelgruppe`,
  holdXp: v => `+${Math.round(v * 100)} % XP bei Halte- und Takt-Übungen`, strainLess: v => `${Math.round(v * 100)} % weniger Zerrungsrisiko`, safeW: v => `+${v} Gewichtsstufe sicher trotz schwacher Hilfsmuskeln`,
  pumpCash: v => `+${Math.round(v * 100)} % Geld, solange der Pump über der Hälfte ist`, mealDur: v => `Essen und Meal-Prep wirken ${Math.round(v * 100)} % länger`,
  beastCash: v => `+${Math.round(v * 100)} % Geld im Beast-Modus`, beastCrit: v => `+${p1(v)} % perfekte Wiederholungen im Beast-Modus`,
  d_klimm: v => `+${Math.round(v * 100)} % Kraft im Klimmzug-Duell`, d_drueck: v => `+${Math.round(v * 100)} % Kraft im Drück-Duell`, d_squat: v => `+${Math.round(v * 100)} % Kraft im Kniebeugen-Takt`, d_arm: v => `+${Math.round(v * 100)} % Kraft beim Armdrücken`,
  d_kreuz: v => `+${Math.round(v * 100)} % Kraft beim Kreuzheben`, d_reifen: v => `+${Math.round(v * 100)} % Kraft beim Reifen wenden`, d_truck: v => `+${Math.round(v * 100)} % Kraft beim Truck ziehen`,
  compFame: v => `+${Math.round(v * 100)} % Ruhm aus Wettkämpfen`, twist: v => `Duell-Kniffe (Griff, Schübe, Rutschen …) ${Math.round(v * 100)} % schwächer`,
  eqCheap: v => `Geräte ${p1(v)} % günstiger`, critCash: v => `Perfekte Wiederholungen +${n1(v)} × Geld`, offline: v => `+${Math.round(v * 100)} % Sponsoren-Diamanten, während du offline bist`,
  fameXp: v => `+${p1(v)} % XP je Zehnerstufe Ruhm (Fans motivieren)`, jackpot: v => `${p1(v)} % Chance pro Klick auf einen Geld-Jackpot (×20)`,
  bizInc: v => `+${p1(v)} % Einkommen aller Geschäfte`, bizCheap: v => `Geschäfte ${p1(v)} % günstiger`, upCheap: v => `Ausbau und Vorteile ${p1(v)} % günstiger`,
  offBiz: v => `Imperium offline +${p1(v * .1)} Prozentpunkte (höchstens 15 %)`, clickInc: v => `+${p1(v)} % des Einkommens pro Klick`, lvInc: v => `Level-Bonus +${p1(v)} % Einkommen pro Gesamt-Level zusätzlich`,
  bonusRate: v => `Bonus-Gegenstände ${Math.round(v * 100)} % öfter`, bonusMul: v => `Bonus-Gegenstände ${Math.round(v * 100)} % mehr wert`, dia: v => `${p1(v)} % Chance auf einen Diamanten bei perfekten Wiederholungen`
};
MK.SKILLS.forEach(n => { if (!n.desc) n.desc = Object.entries(n.eff).map(([k, v]) => (MK.SKILL_EFF_TXT[k] || (() => k))(v)).join(' und '); });
/* Alte Skill-IDs aus früheren Versionen → Punkte zurückerstatten */
MK.OLD_SKILL_COST = { k1: 1, k2: 1, k3: 2, k4: 2, k5: 2, k6: 2, k7: 2, k8: 3, k9: 3, k10: 4, a1: 1, a2: 1, a3: 1, a4: 2, a5: 2, a6: 2, a7: 3, a8: 3, a9: 3, a10: 4, s1: 1, s2: 1, s3: 2, s4: 2, s5: 2, s6: 2, s7: 2, s8: 3, s9: 3, s10: 4 };

/* ---------- Garderobe ----------
   req: {lv} Gesamt-Level | {m:[muskel,lv]} | {win:[disziplin,n]} | {wins} | {fame} | {trophy:id} | {event:id} ; price = € nach Freischaltung */
MK.WARD = {
  skin: { title: 'Hautton', items: [
    { id: 's1', name: 'Hell', val: '#f3cfae' }, { id: 's2', name: 'Mittel', val: '#dca57a' },
    { id: 's3', name: 'Oliv', val: '#b98559' }, { id: 's4', name: 'Dunkel', val: '#7a4e31' }, { id: 's5', name: 'Sehr dunkel', val: '#55331f' } ] },
  tan: { title: 'Bräune', items: [
    { id: 'tan0', name: 'Natürlich', val: 0 }, { id: 'tanSB', name: 'Selbstbräuner', val: .18, req: { lv: 10 }, price: 40 }, { id: 'tan1', name: 'Sommer', val: .25, req: { lv: 25 } },
    { id: 'tan2', name: 'Solarium', val: .5, req: { fame: 60 }, price: 250 }, { id: 'tan3', name: 'Wettkampf-Bräune', val: .85, req: { fame: 400 }, price: 1500 } ] },
  hairc: { title: 'Haarfarbe', items: [
    { id: 'h1', name: 'Braun', val: '#4a3020' }, { id: 'h2', name: 'Schwarz', val: '#1c1916' }, { id: 'h3', name: 'Blond', val: '#d8b25a' },
    { id: 'h4', name: 'Rot', val: '#a8452a', req: { lv: 20 } }, { id: 'h5', name: 'Platin', val: '#ece6d8', req: { lv: 60 } },
    { id: 'h6', name: 'Grau', val: '#8d8a85', req: { lv: 80 } }, { id: 'h7', name: 'Neonblau', val: '#3a86ff', req: { wins: 15 }, price: 400 } ] },
  hair: { title: 'Frisur', items: [
    { id: 'kurz', name: 'Kurz' }, { id: 'buzz', name: 'Buzzcut', req: { lv: 5 } }, { id: 'glatze', name: 'Glatze', req: { lv: 10 } },
    { id: 'undercut', name: 'Undercut', req: { lv: 18 } }, { id: 'locken', name: 'Locken', req: { wins: 3 } },
    { id: 'seiten', name: 'Seitenscheitel', req: { fame: 30 } }, { id: 'iro', name: 'Irokese', req: { win: ['squat', 3] } },
    { id: 'lang', name: 'Lange Haare', req: { lv: 70 } }, { id: 'dutt', name: 'Man Bun', req: { lv: 100 } },
    { id: 'topf', name: 'Topfschnitt' }, { id: 'wuschel', name: 'Verwuschelt' }, { id: 'mittel', name: 'Mittelscheitel', req: { lv: 4 } },
    { id: 'stachel', name: 'Stacheln', req: { lv: 12 }, price: 30 }, { id: 'fade', name: 'Fade', req: { lv: 15 }, price: 45 }, { id: 'cornrows', name: 'Cornrows', req: { lv: 22 }, price: 80 },
    { id: 'zurueck', name: 'Zurückgegelt', req: { lv: 28 }, price: 60 }, { id: 'afro', name: 'Afro', req: { lv: 30 }, price: 90 }, { id: 'pferde', name: 'Pferdeschwanz', req: { lv: 35 }, price: 70 },
    { id: 'tolle', name: 'Elvis-Tolle', req: { fame: 40 }, price: 120 }, { id: 'bob', name: 'Bob', req: { lv: 40 }, price: 90 }, { id: 'flattop', name: 'Flat-Top', req: { wins: 8 }, price: 150 },
    { id: 'zopf', name: 'Geflochtener Zopf', req: { lv: 55 }, price: 180 }, { id: 'dreads', name: 'Dreadlocks', req: { lv: 60 }, price: 220 }, { id: 'kranz', name: 'Haarkranz (Günther-Style)', req: { m: ['nacken', 10] } } ] },
  beard: { title: 'Bart', items: [
    { id: 'none', name: 'Glatt' }, { id: 'stoppel', name: 'Stoppeln', req: { lv: 8 } }, { id: 'schnauz', name: 'Schnauzer', req: { lv: 30 } },
    { id: 'ziegen', name: 'Ziegenbart', req: { wins: 6 } }, { id: 'voll', name: 'Vollbart', req: { lv: 60 } }, { id: 'wikinger', name: 'Wikingerbart', req: { win: ['kreuz', 4] } } ] },
  tattoo: { title: 'Tattoo', multi: true, items: [
    { id: 'none', name: 'Keins' }, { id: 'tribal', name: 'Tribal Oberarm', req: { m: ['arme', 15] }, price: 200 },
    { id: 'anker', name: 'Anker Unterarm', req: { lv: 45 }, price: 300 }, { id: 'brust', name: 'Schriftzug Brust', req: { m: ['brust', 25] }, price: 500 },
    { id: 'sleeve', name: 'Full Sleeve', req: { lv: 120 }, price: 2500 } ] },
  top: { title: 'Oberteil', items: [
    { id: 'tee-grau', name: 'Graues Shirt', val: '#a9a49a', cut: 'tee', fit: .22 },
    { id: 'tee-weiss', name: 'Weißes Shirt', val: '#f1efe9', cut: 'tee', fit: .3 },
    { id: 'tee-rot', name: 'Rotes Shirt', val: '#d83a32', cut: 'tee', fit: .42, req: { lv: 4 } },
    { id: 'tee-blau', name: 'Blaues Shirt', val: '#2f6fd1', cut: 'tee', fit: .5, req: { win: ['klimm', 1] } },
    { id: 'hoodie', name: 'Hoodie', val: '#3d3f45', cut: 'long', fit: .6, req: { lv: 12 }, price: 80 },
    { id: 'tank-schwarz', name: 'Tanktop schwarz', val: '#26262a', cut: 'tank', req: { lv: 22 } },
    { id: 'tank-gruen', name: 'Tanktop grün', val: '#2aa66a', cut: 'tank', req: { m: ['brust', 15] } },
    { id: 'kompr', name: 'Kompressionsshirt', val: '#1d2b44', cut: 'long', tight: true, req: { lv: 40 }, price: 350 },
    { id: 'stringer', name: 'Stringer gelb', val: '#f2c230', cut: 'stringer', req: { lv: 55 } },
    { id: 'stringer-gold', name: 'Gold-Stringer', val: '#d9a81c', cut: 'stringer', req: { lv: 160 }, price: 8000 },
    { id: 'oben-ohne', name: 'Oben ohne', val: null, cut: 'none', req: { fame: 300 } },
    { id: 'event-flamme', name: 'Event: Flammen-Shirt', val: '#e8562a', cut: 'tee', fit: .8, pat: 'flame', req: { event: 'event-flamme' } },
    { id: 'event-tiger', name: 'Event: Tiger-Tank', val: '#f08a24', cut: 'tank', pat: 'tiger', req: { event: 'event-tiger' } },
    { id: 'event-blitz', name: 'Event: Blitz-Shirt', val: '#2b2b6e', cut: 'tee', fit: .8, pat: 'bolt', req: { event: 'event-blitz' } },
    { id: 'event-retro', name: 'Event: 80er-Shirt', val: '#ff5fa2', cut: 'tee', fit: .8, pat: 'retro', req: { event: 'event-retro' } },
    { id: 'event-camo2', name: 'Event: Camo-Tank', val: '#5d6b3a', cut: 'tank', pat: 'camo', req: { event: 'event-camo2' } },
    { id: 'event-neon', name: 'Event: Neon-Stringer', val: '#2affb0', cut: 'stringer', req: { event: 'event-neon' } } ] },
  bottom: { title: 'Hose', items: [
    { id: 'b1', name: 'Jogginghose kurz', val: '#4a4640' }, { id: 'b2', name: 'Schwarze Shorts', val: '#1f1f22', req: { lv: 6 } },
    { id: 'b3', name: 'Blaue Shorts', val: '#2f5fb3', req: { lv: 14 } }, { id: 'b4', name: 'Rote Shorts', val: '#c4302a', req: { m: ['beine', 12] } },
    { id: 'b5', name: 'Tarn-Shorts', val: '#6b7a45', pat: 'camo', req: { wins: 8 }, price: 300 }, { id: 'b6', name: 'Gold-Shorts', val: '#d9a81c', req: { fame: 800 }, price: 4000 } ] },
  shoes: { title: 'Schuhe', items: [
    { id: 'sh1', name: 'Alte Turnschuhe', val: '#e8e4da', acc: '#9b968b' }, { id: 'sh2', name: 'Rote Sneaker', val: '#d83a32', acc: '#ffffff', req: { lv: 10 }, price: 60 },
    { id: 'sh3', name: 'Gewichtheberschuhe', val: '#2a2a2e', acc: '#e6b422', req: { m: ['beine', 20] }, price: 250 },
    { id: 'sh4', name: 'Neon-Läufer', val: '#2affb0', acc: '#1a1a1a', req: { m: ['ausdauer', 20] }, price: 400 },
    { id: 'sh5', name: 'Barfuß', val: null, req: { lv: 50 } } ] },
  gloves: { title: 'Handschuhe', items: [
    { id: 'none', name: 'Keine' }, { id: 'g1', name: 'Trainingshandschuhe', val: '#2a2a2e', req: { lv: 16 }, price: 70 },
    { id: 'g2', name: 'Rote Handschuhe', val: '#c4302a', req: { wins: 10 }, price: 150 }, { id: 'g3', name: 'Kreide-Hände', val: '#f4f4f0', req: { m: ['ruecken', 10] } } ] },
  head: { title: 'Kopf', items: [
    { id: 'none', name: 'Nichts' }, { id: 'band', name: 'Stirnband', val: '#d83a32', req: { lv: 14 } },
    { id: 'cap', name: 'Cap', val: '#2f5fd1', req: { lv: 24 }, price: 90 }, { id: 'capback', name: 'Cap verkehrt', val: '#26262a', req: { fame: 50 }, price: 120 },
    { id: 'beanie', name: 'Mütze', val: '#6a3d8a', req: { lv: 35 }, price: 100 }, { id: 'kopfhoerer', name: 'Kopfhörer', val: '#1a1a1a', req: { m: ['ausdauer', 15] }, price: 300 } ] },
  acc: { title: 'Extra', items: [
    { id: 'none', name: 'Nichts' }, { id: 'brille', name: 'Sonnenbrille', req: { lv: 30 }, price: 150 },
    { id: 'guertel', name: 'Gewichthebergürtel', req: { m: ['beine', 20] }, price: 400 }, { id: 'kette', name: 'Goldkette', req: { lv: 90 }, price: 2500 },
    { id: 'uhr', name: 'Sportuhr', req: { m: ['ausdauer', 10] }, price: 120 }, { id: 'handtuch', name: 'Handtuch um den Hals', req: { lv: 12 } } ] }
};
MK.WARD_ORDER = ['skin','tan','hairc','hair','beard','tattoo','top','bottom','shoes','gloves','head','acc'];
/* Outfits: keine Level-Sperren mehr – alles wird mit Geld gekauft und ist teuer. Wie weit oben ein Teil früher gesperrt war, bestimmt jetzt seinen Preis
   (tier = Gesamt-Level, ab dem man es sich ungefähr leisten kann). Nur echte Erfolge (Events, Siege, Pokale, Rivalen) bleiben zusätzlich Bedingung.
   Hautton bleibt frei wählbar, je Gruppe ist das erste Teil gratis. */
(function () {
  const SOFT = r => r && !Array.isArray(r) && (r.lv != null || r.m || r.fame != null || r.allm != null || r.kfa != null);
  const TL = r => { if (!r) return 0; if (r.lv != null) return r.lv; if (r.m) return r.m[1] * 3.4; if (r.fame != null) return 4.74 * Math.pow(r.fame, .487); if (r.allm != null) return r.allm * 8; if (r.kfa != null) return 60;
    if (r.wins != null) return 5 + r.wins * 2.5; if (r.win) return 10 + r.win[1] * 4; if (r.rival != null) return 15 + r.rival * 10; if (r.trophy) return 60; if (r.event) return 0; return 30; };
  const STANDARD = { kurz: 1, topf: 7, wuschel: 8, mittel: 9, buzz: 10, glatze: 12, seiten: 14, locken: 16 }; // Standard-Frisuren: die ersten Käufe, aber nicht sofort
  for (const g in MK.WARD) { if (g === 'skin') continue; const items = MK.WARD[g].items;
    items.forEach((it, i) => { it.oldReq = it.req; it.oldPrice = it.price; if (i === 0) { delete it.price; delete it.req; it.tier = 0; return; }
      let t = TL(it.req); if (g === 'hair' && STANDARD[it.id]) { t = STANDARD[it.id]; it.req = null; } else t = Math.max(8, t * 1.2 + 6);
      if (it.req && it.req.event) t = Math.max(t, 20);
      it.tier = t; it.price = it.price || 1; if (SOFT(it.req)) delete it.req; });
    const first = items[0], rest = items.slice(1).sort((a, b) => a.tier - b.tier); MK.WARD[g].items = [first].concat(rest); }
})();
/* Seltene Outfits: nur mit Diamanten */
MK.RARE = [
  ['top', { id: 'r-galaxie', name: 'Galaxie-Shirt', val: '#3b2a8a', cut: 'tee', fit: .85, pat: 'bolt', dia: 90 }],
  ['top', { id: 'r-diamant', name: 'Diamant-Stringer', val: '#7fe3ff', cut: 'stringer', dia: 140 }],
  ['top', { id: 'r-phoenix', name: 'Phönix-Tank', val: '#ff5a1f', cut: 'tank', pat: 'flame', dia: 180 }],
  ['bottom', { id: 'r-diashort', name: 'Diamant-Shorts', val: '#5fd3f0', dia: 80 }],
  ['shoes', { id: 'r-goldsneaker', name: 'Gold-Sneaker', val: '#e6b422', acc: '#ffffff', dia: 60 }],
  ['hairc', { id: 'r-lila', name: 'Galaxie-Lila', val: '#8a4dff', dia: 40 }]
];
MK.RARE.forEach(([g, it]) => { it.rare = true; MK.WARD[g].items.push(it); });

/* ---------- Tattoos: gibt es nur als Belohnung für Meilensteine, mehrere gleichzeitig tragbar ---------- */
MK.TATS = [
  { id: 'hantel',  name: 'Kleine Hantel (Unterarm)',  desc: '1.000 Wiederholungen',            c: S => S.stats.reps >= 1000 },
  { id: 'tribal',  name: 'Tribal (Oberarm)',          desc: 'Arme Level 15',                   c: S => S.m.arme.lv >= 15 },
  { id: 'mama',    name: 'Herz „Mama“ (Oberarm)',     desc: '7 Tage in Folge eingeloggt',      c: S => S.daily.streak >= 7 },
  { id: 'lorbeer', name: 'Lorbeer (Schulter)',        desc: 'Erstes Turnier gewonnen',         c: S => S.stats.tourneys >= 1 },
  { id: 'brust',   name: 'Schriftzug „No Pain“',      desc: 'Brust Level 25',                  c: S => S.m.brust.lv >= 25 },
  { id: 'ruecken', name: 'Flügel (Rücken)',           desc: 'Rücken Level 25 – sieh in den Spiegel', c: S => S.m.ruecken.lv >= 25 },
  { id: 'flamme',  name: 'Flammen (Wade)',            desc: 'Beine Level 30',                  c: S => S.m.beine.lv >= 30 },
  { id: 'krone',   name: 'Krone (Nacken)',            desc: 'Rivalen 3× besiegt',              c: S => S.stats.rivalWins >= 3 },
  { id: 'anker',   name: 'Anker (Unterarm)',          desc: 'Gesamt-Level 45',                 c: S => MK.totalLv() >= 45 },
  { id: 'sleeve',  name: 'Full Sleeve',               desc: 'Gesamt-Level 120',                c: S => MK.totalLv() >= 120 }
];

/* ---------- Titel unter deinem Namen ---------- */
MK.TITLES = [
  { id: 'lauch',     name: 'Frischer Lauch',      desc: 'Einfach angefangen',               c: S => true },
  { id: 'fleiss',    name: 'Fleißbienchen',       desc: '5.000 Wiederholungen',             c: S => S.stats.reps >= 5000 },
  { id: 'bizeps',    name: 'Bizeps-Baron',        desc: 'Arme Level 30',                    c: S => S.m.arme.lv >= 30 },
  { id: 'beintag',   name: 'Beintag-Überlebender',desc: 'Beine Level 30',                   c: S => S.m.beine.lv >= 30 },
  { id: 'brett',     name: 'Wandelndes Brett',    desc: 'Brust Level 40',                   c: S => S.m.brust.lv >= 40 },
  { id: 'fluegel',   name: 'Lat-Flieger',         desc: 'Rücken Level 30',                  c: S => S.m.ruecken.lv >= 30 },
  { id: 'lunge',     name: 'Eiserne Lunge',       desc: 'Ausdauer Level 30',                c: S => S.m.ausdauer.lv >= 30 },
  { id: 'brecher',   name: 'Rivalen-Brecher',     desc: 'Rivalen 5× besiegt',               c: S => S.stats.rivalWins >= 5 },
  { id: 'meme',      name: 'Internet-Legende',    desc: '10 Memes über dich',               c: S => S.stats.memes >= 10 },
  { id: 'biest',     name: 'Das Biest',           desc: '100× Beast-Modus',                 c: S => S.stats.beasts >= 100 },
  { id: 'planer',    name: 'Planer',              desc: '10 Trainingsplan-Tage geschafft',  c: S => (S.plan && S.plan.done || 0) >= 10 },
  { id: 'koch',      name: 'Meal-Prep-Meister',   desc: '10 Mahlzeiten mit 90 %+ gekocht',  c: S => (S.prep && S.prep.good || 0) >= 10 },
  { id: 'champ',     name: 'Turnier-Champion',    desc: '5 Turniere gewonnen',              c: S => S.stats.tourneys >= 5 },
  { id: 'sammler',   name: 'Kartensammler',       desc: '30 Sammelkarten',                  c: S => MK.cardCount && MK.cardCount() >= 30 },
  { id: 'balance',   name: 'Gesamtkunstwerk',     desc: 'Alle Muskelgruppen Level 40',      c: S => MK.MUSCLES.every(m => S.m[m.id].lv >= 40) },
  { id: 'legende',   name: 'Legende des Eisens',  desc: 'Rang „Legende“',                   c: S => MK.totalLv() >= 600 }
,
  ...MK.TOURNEYS.map(T => ({ id: 't_' + T.id, name: T.title, desc: T.name + ' gewinnen', c: S => !!(S.trophies && S.trophies[T.id]) }))
];

/* ---------- Trainingspläne: Tage nacheinander abarbeiten (kein Kalender) ---------- */
MK.PLANS = [
  { id: 'ppl', name: 'Push / Pull / Beine', days: [{ n: 'Push', g: ['brust', 'schulter', 'arme'] }, { n: 'Pull', g: ['ruecken', 'nacken', 'arme'] }, { n: 'Beine', g: ['beine', 'bauch', 'ausdauer'] }] },
  { id: 'ou',  name: 'Ober- / Unterkörper', days: [{ n: 'Oberkörper', g: ['brust', 'ruecken', 'schulter', 'arme'] }, { n: 'Unterkörper', g: ['beine', 'bauch', 'ausdauer'] }] },
  { id: 'gk',  name: 'Ganzkörper + Cardio', days: [{ n: 'Ganzkörper', g: ['arme', 'brust', 'beine', 'schulter', 'ruecken'] }, { n: 'Cardio & Core', g: ['ausdauer', 'bauch', 'nacken'] }] },
  { id: 'bro', name: 'Bro-Split (5 Tage)',  days: [{ n: 'Brust', g: ['brust'] }, { n: 'Rücken', g: ['ruecken', 'nacken'] }, { n: 'Schultern', g: ['schulter'] }, { n: 'Arme', g: ['arme'] }, { n: 'Beine', g: ['beine', 'bauch'] }] }
];

/* ---------- Meal-Prep: 3 Zutaten wählen, Makros treffen ---------- */
MK.FOODS = [
  { id: 'haehnchen', name: 'Hähnchen', p: 31, c: 0, f: 4 },   { id: 'reis', name: 'Reis', p: 3, c: 28, f: 0 },         { id: 'brokkoli', name: 'Brokkoli', p: 3, c: 7, f: 0 },
  { id: 'lachs', name: 'Lachs', p: 22, c: 0, f: 13 },         { id: 'eier', name: 'Eier', p: 13, c: 1, f: 10 },        { id: 'hafer', name: 'Haferflocken', p: 13, c: 59, f: 7 },
  { id: 'quark', name: 'Magerquark', p: 12, c: 4, f: 0 },     { id: 'nudeln', name: 'Nudeln', p: 13, c: 71, f: 2 },    { id: 'avocado', name: 'Avocado', p: 2, c: 9, f: 15 },
  { id: 'rind', name: 'Rinderhack', p: 20, c: 0, f: 15 },     { id: 'kartoffel', name: 'Kartoffeln', p: 2, c: 17, f: 0 }, { id: 'erdnuss', name: 'Erdnussbutter', p: 25, c: 20, f: 50 },
  { id: 'tofu', name: 'Tofu', p: 15, c: 2, f: 8 },            { id: 'banane', name: 'Banane', p: 1, c: 23, f: 0 },     { id: 'pizza', name: 'TK-Pizza', p: 9, c: 30, f: 11 },
  { id: 'thunfisch', name: 'Thunfisch', p: 26, c: 0, f: 1 },  { id: 'suesskart', name: 'Süßkartoffel', p: 2, c: 20, f: 0 }, { id: 'nuesse', name: 'Nüsse', p: 18, c: 14, f: 55 }
];
MK.PREP_GOALS = [
  { id: 'masse', name: 'Masse',      t: [.25, .55, .2], desc: 'Ab 70 %: +1 % Körperfett (mehr Gewicht, mehr XP) · ab 90 %: zusätzlich Geld' },
  { id: 'defi',  name: 'Definition', t: [.45, .35, .2], desc: 'Ab 70 %: −1 % Körperfett (für Wettkämpfe) · ab 90 %: zusätzlich Geld' }
];

/* ---------- Wer stützt wen? Zu schwere Gewichte mit schwacher Stütz-Gruppe = kleines Zerrungsrisiko ---------- */
MK.SUPPORT = { arme: ['beine'], brust: ['arme'], schulter: ['arme', 'bauch'], ruecken: ['beine'], beine: ['ruecken', 'bauch'], nacken: ['schulter'], bauch: [], ausdauer: [] };

/* ---------- Gym-Ereignisse (selten) ---------- */
MK.GYM_EVENTS = [
  { id: 'strom', name: 'Stromausfall!', desc: '+25 % XP', info: 'Im Dunkeln trainiert: +25 % XP auf jede Wiederholung', icon: '🔦', dur: 45 },
  { id: 'promi', name: 'Promi-Besuch!', desc: 'Doppelter Ruhm', info: 'Brutus Breitkreuz filmt dich: doppelter Ruhm', icon: '⭐', dur: 60 },
  { id: 'rohr',  name: 'Rohrbruch!',    desc: 'Geld in den Pfützen', info: 'Geldscheine schwimmen in den Pfützen – tipp sie an', icon: '💧', dur: 40, gym: 0 },
  { id: 'kreide', name: 'Kreide-Party!', desc: 'Perfekte Wdh. doppelt so oft', info: 'Sicherer Griff: perfekte Wiederholungen doppelt so oft', icon: '🤍', dur: 45 },
  { id: 'tv',      name: 'Fernsehteam!',    desc: '+50 % Ruhm', info: 'Du bist live im Fernsehen: +50 % Ruhm', icon: '🎥', dur: 50 },
  { id: 'shoot',   name: 'Fotoshooting!',   desc: 'Perfekte Wdh. bringen Ruhm', info: 'Jede perfekte Wiederholung wird fotografiert und bringt Ruhm', icon: '📸', dur: 45 },
  { id: 'legende', name: 'Die Legende ist da!', desc: '+30 % XP', info: 'Horst „Eiche“ Brandt schaut zu: +30 % XP', icon: '🏆', dur: 50 },
  { id: 'fans',    name: 'Fanclub zu Besuch!', desc: 'Pump hält doppelt so lang', info: 'Deine Fans feuern dich an: der Pump hält doppelt so lang', icon: '📣', dur: 45 },
  { id: 'happy',   name: 'Happy Hour!',     desc: 'Essen halb so teuer', info: 'Am Kühlschrank kostet alles nur die Hälfte', icon: '🍹', dur: 60, bar: true }
];

/* ---------- Haustiere (Premium-Währung „Diamanten“, später per Echtgeld) ---------- */
MK.PETS = [
  { id: 'mops',     name: 'Mops „Brutus“',           kind: 'mops',     col: '#d9b98a', price: 150,  eff: { xp: .05 },              desc: '+5 % XP' },
  { id: 'dackel',   name: 'Dackel „Hantelino“',      kind: 'dackel',   col: '#8a4b23', price: 220,  eff: { xp: .04, regen: .06 },  desc: '+4 % XP, Pump hält länger' },
  { id: 'bulldogge',name: 'Bulldogge „Gains“',       kind: 'bulldogge',col: '#c9a37a', price: 320,  eff: { xp: .09 },              desc: '+9 % XP' },
  { id: 'husky',    name: 'Husky „Ausdauer-Ole“',    kind: 'husky',    col: '#9aa3ad', price: 450,  eff: { xp: .05, en: 15 },      desc: '+5 % XP, +15 % Pump-Bonus' },
  { id: 'papagei',  name: 'Papagei „Coach Rio“',     kind: 'papagei',  col: '#2bb673', price: 600, eff: { xp: .06, fame: .1 },    desc: '+6 % XP, +10 % Ruhm' },
  { id: 'katze',    name: 'Katze „Miss Olympia“',    kind: 'katze',    col: '#e08a3a', price: 800, eff: { xp: .08, crit: .02 },   desc: '+8 % XP, +2 % perfekte Wdh.' }
];
MK.DIA_PACKS = [ { n: 80, price: '1,99 €' }, { n: 220, price: '4,99 €', tag: 'Beliebt' }, { n: 500, price: '9,99 €' }, { n: 1400, price: '24,99 €', tag: 'Bester Wert' } ];
/* Mitarbeiter (Echtgeld – in der Testversion nur simuliert) */
MK.STAFF = [
  { id: 'petra', name: 'Filialleiterin Petra',   icon: '👩‍💼', price: '2,99 €', eff: { bizInc: .5 },  desc: '+50 % Imperium-Einnahmen' },
  { id: 'marco', name: 'Personal Trainer Marco', icon: '🏋️', price: '3,99 €', eff: { xp: .25 },    desc: '+25 % Muskel-XP' },
  { id: 'lea',   name: 'PR-Agentin Lea',         icon: '📣', price: '2,99 €', eff: { fame: .3 },   desc: '+30 % Ruhm' },
  { id: 'klaus', name: 'Imperium-Manager Klaus', icon: '🤖', price: '4,99 €', eff: {}, desc: 'Kauft automatisch weitere Geschäfte nach – pro Geschäft einzeln an/aus' },
  { id: 'ali',   name: 'Nachtwächter Ali',       icon: '🌙', price: '1,99 €', eff: { nightX: .1 }, desc: '+10 % Offline-Einnahmen extra' }
];
/* Ernährung über den Kühlschrank: Masse → schnelleres Wachstum, Diät → niedriger KFA für Wettkämpfe */
MK.DIETS = [
  { id: 'bulk', name: 'Masse', icon: '🍔', rate: .06,  xp: .1,  desc: 'Mehr Masse = schnelleres Wachstum, KFA steigt' },
  { id: 'keep', name: 'Halten', icon: '⚖️', rate: 0,    xp: 0,   desc: 'Alles bleibt, wie es ist' },
  { id: 'cut',  name: 'Diät',  icon: '🥗', rate: -.08, xp: -.1, desc: 'KFA sinkt für Wettkämpfe, Wachstum langsamer' }
];

/* ---------- Kühlschrank ---------- */
MK.MEALS = [
  { id: 'banane',  name: 'Banane',               price: 6,   kl: 1, desc: '+25 % Pump',                                   eff: { pump: .25 } },
  { id: 'hafer',   name: 'Haferflocken',         price: 15,  kl: 1, desc: '+50 % Pump',                                   eff: { pump: .5 } },
  { id: 'shake',   name: 'Proteinshake',         price: 30,  kl: 1, desc: '+25 % XP · 3 min',                eff: { buff: { k: 'xp', v: .25, t: 180 } } },
  { id: 'energy',  name: 'Energydrink',          price: 40,  kl: 2, desc: 'Sofort Beast-Modus',                eff: { pump: 1 } },
  { id: 'huhn',    name: 'Hähnchen mit Reis',    price: 70,  kl: 2, desc: '+15 % XP, Pump hält · 6 min', eff: { buff: { k: 'meal', v: .15, t: 360 } } },
  { id: 'quark',   name: 'Magerquark',           price: 90,  kl: 3, desc: 'Pump hält · 10 min',   eff: { buff: { k: 'regen', v: 1, t: 600 } } },
  { id: 'lasagne', name: 'Omas Lasagne',         price: 160, kl: 3, desc: 'Pump voll, +30 % XP · 5 min',         eff: { pump: 1, buff: { k: 'xp2', v: .30, t: 300 } } },
  { id: 'steak',   name: 'Wettkampf-Steak',      price: 300, kl: 4, desc: '+20 % Kraft im nächsten Wettkampf',            eff: { compBuff: .2 } }
];

/* ---------- Sponsoren ---------- */
MK.SPONSORS = [ // req: alle Bedingungen müssen erfüllt sein; bonus: einmalig bei der ersten Unterschrift
  { id: 'lauch',   name: 'Lauchkraft Energy', fame: 15,   inc: 0, dph: 0.25, boost: { xp: 0.02, fame: 0.02 },  col: '#2bb673', logo: 'LAUCHKRAFT', pitch: 'Sucht ein ehrliches Vorher-Gesicht.',
    req: [{ fame: 15 }, { lv: 12 }, { wins: 3 }] },
  { id: 'peter',   name: 'Protein-Peter',     fame: 50,   inc: 0, dph: 0.4, boost: { xp: 0.03, fame: 0.03 },  col: '#d83a32', logo: 'PROTEIN PETER', pitch: 'Will Arme sehen, die nach Shake aussehen.',
    req: [{ fame: 50 }, { m: ['arme', 15] }, { m: ['brust', 12] }, { wins: 12 }], bonus: { dia: 2 } },
  { id: 'eisen',   name: 'Eisenwerk Gear',    fame: 150,  inc: 0, dph: 0.6, boost: { xp: 0.04, fame: 0.04 },    col: '#26262a', logo: 'EISENWERK', pitch: 'Nur für Leute, die echtes Eisen bewegen.',
    req: [{ fame: 150 }, { m: ['ruecken', 18] }, { m: ['beine', 20] }, { win: ['kreuz', 2] }, { trophy: 'verein' }], bonus: { dia: 3 } },
  { id: 'nordpump',name: 'NordPump',          fame: 400,  inc: 0, dph: 0.9, boost: { xp: 0.05, fame: 0.06 },   col: '#2f5fd1', logo: 'NORDPUMP', pitch: 'Braucht definierte Bauchmuskeln fürs Plakat.',
    req: [{ fame: 400 }, { kfa: 15 }, { beasts: 40 }, { trophy: 'stadt' }, { m: ['bauch', 20] }], bonus: { dia: 5 } },
  { id: 'titan',   name: 'Titan Nutrition',   fame: 1000, inc: 0, dph: 1.3, boost: { xp: 0.07, fame: 0.08 },   col: '#e6b422', logo: 'TITAN', pitch: 'Sponsert nur komplette Athleten ohne Schwachstelle.',
    req: [{ fame: 1000 }, { allm: 35 }, { trophy: 'land' }, { rival: 5 }], bonus: { dia: 8 } },
  { id: 'olymp',   name: 'Olymp Sportswear',  fame: 2500, inc: 0, dph: 2, boost: { xp: 0.1, fame: 0.12 },   col: '#7b2cbf', logo: 'OLYMP', pitch: 'Bühnenreif: Bräune, Definition, Titel.',
    req: [{ fame: 2500 }, { trophy: 'dm' }, { kfa: 10 }, { tan: 'tan3' }, { lv: 350 }], bonus: { dia: 15 } }
];

/* ---------- Musik (Boombox) ---------- */
MK.MUSIC = [
  { id: 'lofi',   name: 'Keller-Lo-Fi',      price: 0,    bl: 1, bpm: 78,  desc: 'Pump hält 5 % länger',          eff: { regen: .05 } },
  { id: 'hiphop', name: 'Old-School Hip-Hop',price: 400,  bl: 1, bpm: 92,  desc: '+5 % XP',                         eff: { xp: .05 } },
  { id: 'rock',   name: 'Gitarren-Rock',     price: 6000, bl: 2, bpm: 128, desc: 'Pump +15 % schneller', eff: { beastFill: .15 } },
  { id: 'synth',  name: '80er Synthwave',    price: 3e4,  bl: 2, bpm: 104, desc: '+10 % Ruhm',      eff: { fame: .10 } },
  { id: 'techno', name: 'Techno-Pump',       price: 5e5,  bl: 3, bpm: 132, desc: '+8 % XP, Pump +10 % schneller',           eff: { xp: .08, beastFill: .10 } },
  { id: 'epic',   name: 'Epischer Einmarsch',price: 8e6,  bl: 4, bpm: 96,  desc: '+10 % XP, +10 % Ruhm',                eff: { xp: .10, fame: .10 } }
];

/* ---------- Tägliches ---------- */
/* Meilensteine fürs insgesamt verdiente Geld: Diamanten als Belohnung */
MK.MILES = [[1e4, 1], [1e5, 2], [1e6, 5], [1e7, 5], [1e8, 8], [1e9, 15], [1e10, 10], [1e11, 12], [1e12, 30], [1e13, 15], [1e14, 20], [1e15, 50]];
/* Chef-Anzüge fürs Imperium (Outfit-Reiter): der Chef oben im Imperium trägt den gewählten Anzug */
MK.SUITS = [
  { id: 'grau', name: 'Grauer Anzug', val: '#4a4f58', tie: '#c4302a', req: { biz: ['pfand', 10] } },
  { id: 'navy', name: 'Navy-Anzug', val: '#1f2a44', tie: '#e6b422', req: { biz: ['pt', 1] } },
  { id: 'nadel', name: 'Nadelstreifen', val: '#26262c', tie: '#8a1a30', stripe: true, req: { biz: ['merch', 10] } },
  { id: 'weiss', name: 'Weißer Anzug', val: '#ecebe6', tie: '#1f1f22', req: { biz: ['supp', 1] } },
  { id: 'samt', name: 'Samt-Smoking', val: '#4a1430', tie: '#141414', bow: true, req: { biz: ['kette', 10] } },
  { id: 'gold', name: 'Gold-Anzug', val: '#c9981a', tie: '#141414', req: { biz: ['app', 1] } },
  { id: 'all', name: 'Raumfahrer-Anzug', val: '#dfe6ee', tie: '#ff5a36', space: true, req: { biz: ['space', 1] } }
];
MK.DAILY_REWARDS = [ { money: 20 }, { money: 40 }, { money: 60 }, { money: 90 }, { sp: 1 }, { money: 160 }, { money: 400, sp: 1 } ];
MK.QUEST_DAILY = [
  { k: 'reps',   name: 'Mach {n} Wiederholungen',                 base: 120 },
  { k: 'group',  name: 'Mach {n} Wiederholungen für {g}',          base: 50 },
  { k: 'wins',   name: 'Gewinne {n} Wettkämpfe',                   base: 2 },
  { k: 'crits',  name: 'Schaff {n} perfekte Wiederholungen',       base: 5 },
  { k: 'beast',  name: 'Aktiviere {n}× den Beast-Modus',           base: 2 },
  { k: 'bonus',  name: 'Sammle {n} Bonus-Gegenstände',             base: 3 },
  { k: 'earn',   name: 'Verdiene {n} € im Wettkampf',              base: 60 }
];
MK.QUEST_WEEKLY = [
  { k: 'reps',  name: 'Mach {n} Wiederholungen',     base: 1500 },
  { k: 'wins',  name: 'Gewinne {n} Wettkämpfe',      base: 12 },
  { k: 'tourney', name: 'Gewinne {n} Turnier',       base: 1 },
  { k: 'levels',name: 'Steig {n}× im Level auf',     base: 12 }
];

/* ---------- NPCs ---------- */
MK.NPCS = [
  { id: 'guenther', name: 'Hausmeister Günther', gym: 0, look: { skin: '#e2b08a', shirt: '#3d5a80', pants: '#2a2a2e', hair: '#bdb6aa', bald: true, belly: 1 }, prop: 'mop' },
  { id: 'hilde',    name: 'Studio-Oma Hilde',    gym: 1, look: { skin: '#f0c9a8', shirt: '#c45b9a', pants: '#3a3a5a', hair: '#e9e6e0', bun: true }, prop: 'band' },
  { id: 'jassi',    name: 'Influencerin Jassi',  gym: 2, look: { skin: '#c98b5f', shirt: '#ff7eb6', pants: '#1f1f22', hair: '#2a1d14', long: true }, prop: 'ring' },
  { id: 'marco',    name: 'Poser Marco',         gym: 2, look: { skin: '#b8774a', shirt: '#ffffff', pants: '#1f1f22', hair: '#1c1916', tank: true, big: 1 }, prop: 'mirror' }
];

/* Ein Rivale pro Gym – jeder stärker als der vorige */
MK.RIVALS = [
  { name: 'Dome',  full: 'Dominik „Dome“ Brecher', mul: 1.18, add: 10, look: { skin: 's2', tan: 'tan1', hairc: 'h2', hair: 'undercut', beard: 'stoppel', tattoo: 'tribal', top: 'tank-schwarz', bottom: 'b2', shoes: 'sh3', gloves: 'none', head: 'none', acc: 'kette' } },
  { name: 'Kalle', full: 'Kalle „Der Kran“ Kowalski', mul: 1.25, add: 25, look: { skin: 's1', tan: 'tan0', hairc: 'h3', hair: 'buzz', beard: 'voll', tattoo: 'anker', top: 'tee-weiss', bottom: 'b3', shoes: 'sh2', gloves: 'g1', head: 'none', acc: 'guertel' } },
  { name: 'Tyler', full: 'Tyler „Swole“ Schmitt', mul: 1.33, add: 45, look: { skin: 's2', tan: 'tan2', hairc: 'h3', hair: 'seiten', beard: 'none', tattoo: 'tribal', top: 'kompr', bottom: 'b2', shoes: 'sh4', gloves: 'none', head: 'capback', acc: 'brille' } },
  { name: 'Ivan',  full: 'Ivan „Der Bär“ Petrov', mul: 1.42, add: 80, look: { skin: 's1', tan: 'tan0', hairc: 'h2', hair: 'glatze', beard: 'wikinger', tattoo: 'sleeve', top: 'tank-schwarz', bottom: 'b2', shoes: 'sh3', gloves: 'g3', head: 'none', acc: 'guertel' } },
  { name: 'Atlas', full: 'Marcus „Atlas“ Stein', mul: 1.55, add: 130, look: { skin: 's4', tan: 'tan3', hairc: 'h2', hair: 'dutt', beard: 'stoppel', tattoo: 'brust', top: 'oben-ohne', bottom: 'b6', shoes: 'sh3', gloves: 'none', head: 'none', acc: 'kette' } }
];
Object.defineProperty(MK, 'RIVAL', { get: () => MK.RIVALS[Math.max(0, Math.min(MK.RIVALS.length - 1, MK.S ? MK.S.gym : 0))] });

/* ---------- Erfolge (Pokal-Vitrine) ---------- */
MK.ACH = [
  { id: 'rep1',    name: 'Erste Wiederholung',   desc: '1 Wiederholung',              t: 'bronze', c: S => S.stats.reps >= 1,      r: { money: 5 } },
  { id: 'rep500',  name: 'Warm geworden',        desc: '500 Wiederholungen',          t: 'bronze', c: S => S.stats.reps >= 500,    r: { money: 40 } },
  { id: 'rep5k',   name: 'Fleißbienchen',        desc: '5.000 Wiederholungen',        t: 'silber', c: S => S.stats.reps >= 5000,   r: { sp: 1 } },
  { id: 'rep25k',  name: 'Maschine',             desc: '25.000 Wiederholungen',       t: 'gold',   c: S => S.stats.reps >= 25000,  r: { sp: 1, dia: 3 } },
  { id: 'rep100k', name: 'Unermüdlich',          desc: '100.000 Wiederholungen',      t: 'platin', c: S => S.stats.reps >= 100000, r: { sp: 2, dia: 8 } },
  { id: 'lv10',    name: 'Kein Lauch mehr',      desc: 'Gesamt-Level 10',             t: 'bronze', c: S => MK.totalLv() >= 10,  r: { money: 50 } },
  { id: 'lv50',    name: 'Auf dem Weg',          desc: 'Gesamt-Level 50',             t: 'silber', c: S => MK.totalLv() >= 50,  r: { sp: 1 } },
  { id: 'lv150',   name: 'Massiv',               desc: 'Gesamt-Level 150',            t: 'gold',   c: S => MK.totalLv() >= 150, r: { sp: 2, dia: 3 } },
  { id: 'lv400',   name: 'Monument',             desc: 'Gesamt-Level 400',            t: 'platin', c: S => MK.totalLv() >= 400, r: { sp: 3, dia: 10 } },
  { id: 'bal',     name: 'Ausgewogen',           desc: 'Alle Muskelgruppen mindestens Level 10', t: 'silber', c: S => MK.MUSCLES.every(m => S.m[m.id].lv >= 10), r: { sp: 1, dia: 2 } },
  { id: 'bal2',    name: 'Gesamtkunstwerk',      desc: 'Alle Muskelgruppen mindestens Level 40', t: 'gold', c: S => MK.MUSCLES.every(m => S.m[m.id].lv >= 40), r: { sp: 2, dia: 5 } },
  { id: 'legs',    name: 'Beintag-Held',         desc: 'Beine Level 30',              t: 'silber', c: S => S.m.beine.lv >= 30,    r: { sp: 1 } },
  { id: 'arms',    name: 'Kanonenrohre',         desc: 'Arme Level 30',               t: 'silber', c: S => S.m.arme.lv >= 30,     r: { sp: 1 } },
  { id: 'cardio',  name: 'Pumpe läuft',          desc: 'Ausdauer Level 25',           t: 'silber', c: S => S.m.ausdauer.lv >= 25, r: { sp: 1 } },
  { id: 'win1',    name: 'Erster Sieg',          desc: '1 Wettkampf gewonnen',        t: 'bronze', c: S => S.stats.wins >= 1,     r: { money: 30 } },
  { id: 'win25',   name: 'Seriensieger',         desc: '25 Wettkämpfe gewonnen',      t: 'silber', c: S => S.stats.wins >= 25,    r: { sp: 1, dia: 1 } },
  { id: 'win100',  name: 'Champion',             desc: '100 Wettkämpfe gewonnen',     t: 'gold',   c: S => S.stats.wins >= 100,   r: { sp: 2, dia: 4 } },
  { id: 'alld',    name: 'Allrounder',           desc: 'In allen 7 Disziplinen gewonnen', t: 'gold', c: S => MK.DISC.every(d => S.beat[d.id] > 0), r: { sp: 2, dia: 4 } },
  { id: 'boss',    name: 'Endgegner',            desc: 'Den letzten Gegner einer Disziplin besiegt', t: 'gold', c: S => MK.DISC.some(d => S.beat[d.id] >= 8), r: { sp: 1, dia: 3 } },
  { id: 'tour1',   name: 'Pokalträger',          desc: '1 Turnier gewonnen',          t: 'silber', c: S => S.stats.tourneys >= 1, r: { dia: 2 } },
  { id: 'wm',      name: 'Weltmeister',          desc: 'Die Weltmeisterschaft gewonnen', t: 'diamant', c: S => !!S.trophies.wm, r: { sp: 5, dia: 30 } },
  { id: 'rival1',  name: 'Rivale geschlagen',    desc: 'Einen Rivalen besiegt',      t: 'silber', c: S => S.stats.rivalWins >= 1, r: { sp: 1 } },
  { id: 'rival10', name: 'Wer ist hier der Boss?', desc: 'Rivalen 10× besiegt',       t: 'gold',   c: S => S.stats.rivalWins >= 10, r: { sp: 2, dia: 5 } },
  { id: 'crit1',   name: 'Perfekt!',             desc: '1 perfekte Wiederholung',     t: 'bronze', c: S => S.stats.crits >= 1,    r: { money: 10 } },
  { id: 'crit200', name: 'Technik-Gott',         desc: '200 perfekte Wiederholungen', t: 'gold',   c: S => S.stats.crits >= 200,  r: { sp: 1, dia: 2 } },
  { id: 'beast1',  name: 'Das Biest erwacht',    desc: 'Beast-Modus ausgelöst',       t: 'bronze', c: S => S.stats.beasts >= 1,   r: { money: 20 } },
  { id: 'beast50', name: 'Dauerbiest',           desc: '50× Beast-Modus',             t: 'gold',   c: S => S.stats.beasts >= 50,  r: { sp: 1, dia: 2 } },
  { id: 'meme',    name: 'Viral (leider)',       desc: 'Als Meme im Netz gelandet',   t: 'bronze', c: S => S.stats.memes >= 1,    r: { money: 15 } },
  { id: 'viral',   name: 'Viral (endlich)',      desc: 'Ein positiver viraler Clip',  t: 'silber', c: S => S.stats.virals >= 1,   r: { sp: 1 } },
  { id: 'fame100', name: 'Lokalgröße',           desc: '100 Ruhm',                    t: 'silber', c: S => S.fame >= 100,         r: { sp: 1 } },
  { id: 'fame2k',  name: 'Berühmtheit',          desc: '2.000 Ruhm',                  t: 'gold',   c: S => S.fame >= 2000,        r: { sp: 2, dia: 5 } },
  { id: 'gym2',    name: 'Umzug',                desc: 'Ins Vereinsgym umgezogen',    t: 'bronze', c: S => S.gym >= 1,            r: { money: 50 } },
  { id: 'gym5',    name: 'Eigener Tempel',       desc: 'Die Bühne bezogen',           t: 'platin', c: S => S.gym >= 4,            r: { sp: 3, dia: 10 } },
  { id: 'gold',    name: 'Alles Gold',           desc: 'Ein Gerät auf Gold-Stufe',    t: 'gold',   c: S => Object.values(S.eq).some(l => l >= 4), r: { sp: 1, dia: 2 } },
  { id: 'pet',     name: 'Bester Freund',        desc: 'Ein Haustier im Gym',         t: 'bronze', c: S => S.pets.length >= 1,    r: { money: 50 } },
  { id: 'style',   name: 'Modebewusst',          desc: '10 Kleidungsstücke gekauft',  t: 'silber', c: S => S.bought.length >= 10, r: { dia: 2 } },
  { id: 'rich',    name: 'Gut im Geschäft',      desc: '10.000 € verdient',           t: 'silber', c: S => S.stats.earned >= 10000, r: { sp: 1 } },
  { id: 'streak7', name: 'Treue Seele',          desc: '7 Tage in Folge eingeloggt',  t: 'silber', c: S => S.daily.streak >= 7,  r: { dia: 3 } },
  { id: 'heavy',   name: 'Schwermetall',         desc: '30 kg Kurzhanteln freigeschaltet', t: 'gold', c: S => S.wset >= 14,   r: { sp: 1, dia: 2 } },
  { id: 'skill10', name: 'Talent',               desc: '10 Skills freigeschaltet',    t: 'silber', c: S => S.skills.length >= 11, r: { dia: 2 } },
  { id: 'skillall',name: 'Meister aller Klassen',desc: 'Den ganzen Skillbaum freigeschaltet', t: 'diamant', c: S => S.skills.length >= MK.SKILLS.length, r: { dia: 25 } }
];

})(window.MK);
