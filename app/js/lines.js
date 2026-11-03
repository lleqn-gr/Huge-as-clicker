/* Muskelklicker – Sprüche. Je höher das Stadium, desto positiver. Neue Sprüche einfach in die Listen schreiben. */
window.MK = window.MK || {};
(function (MK) {

MK.LINES = {
/* Allgemeine Kommentare aus dem Publikum, nach Stadium (0 = Lauch … 6 = Legende) */
stage: [
 [ // 0 – Lauch
  'Der braucht Anlauf, um die Hantel anzuschauen.', 'Ich hab Nudeln gesehen, die mehr Biss haben.', 'Bei dem Wind draußen sollte er Steine in die Taschen packen.', 'Der trainiert seit einer Stunde und die Hantel ist noch nicht mal warm.', 'Sein Pump ist so unsichtbar wie sein Bizeps.', 'Ist das ein Bodybuilder oder ein Fahrradständer?', 'Ich glaube, die Kurzhantel trainiert gerade ihn.', 'Der passt durch den Briefschlitz. Quer.', 'Wenn der niest, fliegt er rückwärts aus dem Gym.', 'Seine Venen haben sich noch nicht getraut.', 'Er hebt so schwer, wie ich atme.', 'Der Typ braucht ’ne Genehmigung, um überhaupt Hantel zu sagen.', 'Der isst bestimmt Salat mit Pinzette.', 'Sein Proteinshake ist Leitungswasser mit Hoffnung.', 'Er macht Bizeps-Curls und der Bizeps macht Pause.', 'Spannend. Wie ein Grashalm beim Bankdrücken.', 'Der würde bei einem Kissenkampf verlieren. Gegen das Kissen.', 'Mit dem Arm kann man Briefe öffnen.', 'Ich hab Kleiderbügel mit breiteren Schultern im Schrank.', 'Er ist der Grund, warum es 1-kg-Hanteln gibt.', 'Seine Muskeln sind auf Wartungsmodus.', 'Wenn er sich hinter die Langhantel stellt, sieht man ihn nicht mehr.', 'Der hat beim Armdrücken gegen ein Brötchen verloren.', 'Er schwitzt. Wovon genau?', 'Sieht aus, als hätte jemand einem Schnürsenkel Turnschuhe angezogen.', 'Der Lauch ist zurück. Die Hanteln haben Angst. Vor Langeweile.', 'Sein Sixpack ist noch im Lieferstau.', 'Der Spiegel sucht ihn auch noch.', 'Ich wette, sein Fitness-Tracker zählt nur Seufzer.', 'Der hat sich beim Schuhebinden gezerrt, oder?', 'Er nennt es Aufwärmen. Ich nenn es Schwanken.', 'Die Hantelablage ist muskulöser als er.', 'Er zieht sich das Shirt aus und das Shirt ist enttäuscht.', 'Der Hausmeister-Mopp hat mehr Volumen.', 'Hut ab, er hat die Tür zum Gym allein aufbekommen.',
  'Ist das ein Mensch oder ein Kleiderbügel?', 'Der hebt die Hantel, oder die Hantel ihn?', 'Wer hat den Lauch reingelassen?',
  'Bruder, die 1-kg-Hantel zittert vor Angst. Um dich.', 'Ich hab schon dickere Strohhalme gesehen.', 'Der Typ hat Arme wie Spaghetti al dente.',
  'Ruft mal wer seine Mutti an?', 'Ich glaub, der hat sich im Raum geirrt. Yoga ist oben.', 'Sein Schatten ist breiter als er.',
  'Nicht so fest pusten, sonst fliegt er weg.', 'Ist das sein erster Tag? Sein erstes Jahr? Sein erstes Leben?', 'Der Wind von der Lüftung schiebt ihn rum.',
  'Er schwitzt schon beim Hinsehen.', 'Ich hab Zahnstocher mit mehr Masse.', 'Der muss zweimal im Raum stehen, damit er einen Schatten wirft.',
  'Hantel heben, Hantel fallen lassen, Hantel suchen. Klassiker.', 'Wenn er sich seitlich stellt, ist er weg.', 'Die Hose hält nur aus Höflichkeit.',
  'Okay, er gibt sich Mühe. Das muss man ihm lassen. Mehr aber nicht.', 'Sein Bizeps hat noch Babyspeck. Ohne Speck.', 'Mach mal Platz, der braucht die ganze Ecke zum Umfallen.',
  'Da läuft ein Strich mit Kopf rum.', 'Er erinnert mich an eine Gurke, die Sport macht.', 'Hat jemand einen Bleistift mit Schuhen gesehen?'
 ],
 [ // 1 – Hänfling / Anfänger
  'Okay, der Strohhalm hat jetzt Rillen.', 'Er sieht nicht mehr ganz so durchsichtig aus.', 'Die Hantel zittert jetzt weniger als er. Fortschritt!', 'Aus dem Lauch wird langsam eine Lauchstange.', 'Er hat einen Muskel gefunden und ist sehr stolz darauf.', 'Sein T-Shirt hat zum ersten Mal Kontakt mit Schultern.', 'Der schafft schon zwei Wiederholungen am Stück. Respekt.', 'Er ist jetzt offiziell breiter als sein Handtuch.', 'Kleine Schritte. Ganz kleine. Aber Schritte.', 'Der Spiegel erkennt ihn jetzt wieder.', 'Sein Bizeps hat sich gemeldet. Leise.', 'Okay, der Wind muss sich jetzt etwas mehr anstrengen.', 'Er trainiert, als würde es um sein Leben gehen. Tut es vielleicht auch.', 'Gestern Spaghetti, heute Penne.', 'Er hebt jetzt Sachen, die man auch sieht.',
  'Moment, ist der Lauch dicker geworden?', 'Na also, da tut sich was. Ganz langsam.', 'Er kommt jeden Tag. Das muss man ihm lassen.',
  'Die Arme sind jetzt Fettuccine statt Spaghetti.', 'Ich seh einen Muskel. Glaub ich. Kann auch ein Schatten sein.', 'Immerhin fällt er nicht mehr um beim Hinsetzen.',
  'Er hebt jetzt sogar die 4 kg. Respekt. Ein kleiner.', 'Hey, nicht schlecht für einen Anfänger.', 'Bleib dran, Kleiner!',
  'Wird langsam. Ganz, ganz langsam.', 'Der Typ zieht das echt durch.', 'Letzte Woche Lauch, diese Woche Frühlingszwiebel.',
  'Sein Shirt sitzt jetzt fast.', 'Okay, ich nehm ein bisschen was zurück.', 'Er hat eine Form! Keine schöne. Aber eine Form.',
  'Fleißig ist er ja.', 'Ich wette, in einem Jahr redet keiner mehr über den Lauch.', 'Die Technik wird besser. Ehrlich.',
  'Der schwitzt jetzt richtig. Das ist ein gutes Zeichen.', 'Ich hab ihn heut schon dreimal gesehen. Was macht der hier?'
 ],
 [ // 2 – Gym-Gänger / Pumper
  'Okay, der Junge baut auf.', 'Man sieht echt, dass er trainiert.', 'Die Schultern kommen langsam.',
  'Gute Form, saubere Wiederholungen.', 'Der ist kein Lauch mehr. Der ist ein Lauch mit Plan.', 'Mit dem könnte man mal zusammen trainieren.',
  'Der zieht durch, jeden Tag. Disziplin.', 'Sieh dir die Arme an! Die waren mal Strohhalme.', 'Das Shirt spannt. Das ist neu.',
  'Ich glaub, der hat sein Ding gefunden.', 'Hey, kannst du mir mal deinen Trainingsplan zeigen?', 'Respekt, Mann.',
  'Der Typ ist motiviert ohne Ende.', 'Langsam wird das richtig ordentlich.', 'Wenn der so weitermacht …',
  'Von null auf Gym-Gänger. Stark.', 'Der hat das Pumpen verstanden.', 'Saubere Haltung, gefällt mir.',
  'Ich trainier ab jetzt auch öfter. Wegen dem.', 'Wo trainierst du sonst so? Ach, nur hier? Krass.'
 ],
 [ // 3 – Breiter Typ
  'Boah, ist der breit geworden!', 'Der passt kaum noch durch die Tür.', 'Ey, guck dir den an!',
  'Das ist doch nicht mehr der Lauch von früher?!', 'Der hat sich komplett verwandelt.', 'Ich will auch so aussehen.',
  'Was isst der? Zement?', 'Seine Arme sind dicker als meine Beine.', 'Der wird mal richtig was.',
  'Kann ich ein Foto mit dir machen?', 'Alter, diese Schultern!', 'So sieht Disziplin aus.',
  'Der Typ ist eine Inspiration, ehrlich.', 'Wahnsinn, wie der sich entwickelt hat.', 'Der Spiegel muss sich langsam Sorgen machen.',
  'Wenn der reinkommt, wird’s leise.', 'Der hebt jetzt Sachen, die ich nicht mal schieben kann.', 'Die Hantel sieht in seiner Hand aus wie Spielzeug.',
  'Den will ich nicht beim Armdrücken treffen.', 'Ich hab ihn schon als Lauch gekannt. Ich schwör.'
 ],
 [ // 4 – Masse-Monster / Wettkampf-Tier
  'MONSTER!', 'Das ist kein Mensch mehr, das ist eine Maschine!', 'Leute, macht Platz!',
  'Ich hab Gänsehaut beim Zugucken.', 'Wie viel wiegt der? Zwei Kühlschränke?', 'Der Boden zittert bei jeder Wiederholung.',
  'Komm schon, noch eine!', 'Der ist auf einem anderen Level.', 'Der gewinnt doch alles!',
  'Der Typ ist eine Legende in diesem Gym.', 'Ich hab ihn auf Insta gesehen!', 'Diese Masse … unglaublich.',
  'Der Hausmeister hat extra den Boden verstärkt.', 'Wenn er atmet, ändert sich der Luftdruck.', 'Der ist das Ziel. Für jeden hier.',
  'Ich trainier nur hier, um ihn zu sehen.', 'Selbst seine Schatten haben Muskeln.', 'Der Spiegel braucht ein Weitwinkelobjektiv.',
  'Wie kann man sich SO verändern?', 'Er hat mal mit 1 kg angefangen. Ich war dabei!'
 ],
 [ // 5 – Profi / Olympia-Anwärter
  'Das ist ein Profi. Ein echter Profi.', 'Ich darf im selben Raum trainieren wie er. Wahnsinn.', 'Olympia, wir kommen!',
  'Darf ich dein Handtuch haben? Für immer?', 'Der ist schöner als jede Statue.', 'Lebende Anatomiestunde.',
  'Der Kerl ist ein Kunstwerk.', 'Ich hab für heute frei genommen, nur um ihn zu sehen.', 'Jede Faser sichtbar. Wahnsinn.',
  'Da steht die Zukunft des Bodybuildings.', 'Autogramm, bitte! Auf meinen Arm!', 'Selbst die Hanteln sind stolz, von ihm gehoben zu werden.',
  'Er ist der Grund, warum ich hier bin.', 'Ich hab ein Poster von ihm. Zwei sogar.', 'Gänsehaut. Jedes Mal.',
  'Der Mann hat das Gym verändert.', 'Wie ein griechischer Gott mit Pump.', 'Diese Symmetrie … perfekt.',
  'Ich glaub, ich weine gleich.', 'Wir sind Zeugen von Geschichte.'
 ],
 [ // 6 – Legende
  'LE-GEN-DE! LE-GEN-DE!', 'Er ist es wirklich!', 'Ich hab die Legende gesehen! Live!',
  'Vom Lauch zur Legende. Die größte Geschichte des Eisensports.', 'Wenn er hebt, steht die Welt still.', 'Ich erzähl das noch meinen Enkeln.',
  'Der Mann, der Mythos, die Masse.', 'Alles, was wir hier machen, hat er erfunden.', 'Selbst die Schwerkraft macht für ihn Pause.',
  'Unsterblich. Einfach unsterblich.', 'Sein Name steht über der Tür. Muss er auch.', 'Wir sind nicht würdig!',
  'Ich hab sein Shirt gekauft. Und seine Schuhe. Und seine Hantel.', 'Es gibt ein Davor und ein Danach. Und das ist er.', 'Er ist der Grund, warum es Gyms gibt.',
  'Ich hab den Boden geküsst, auf dem er stand.', 'Danke für alles, Legende!', 'Das größte Comeback aller Zeiten: vom Lauch zum König.'
 ]
],
/* Wenn eine Muskelgruppe deutlich hinterherhängt */
imb: {
 beine: ['Hat da jemand den Beintag geschwänzt?', 'Oben Schrank, unten Zahnstocher.', 'Der läuft auf Streichhölzern.', 'Hühnerbeine! Gack gack!',
   'Bruder, deine Beine haben angerufen. Die fühlen sich vernachlässigt.', 'Der Oberkörper wird bald umkippen.', 'Kniebeugen sind nicht verboten, weißt du?',
   'Glühbirne auf zwei Stäbchen.', 'Wie ein Kühlschrank auf Kugelschreibern.', 'Die Beine sind noch im Lauch-Modus.', 'Pass auf, dass der Wind dich nicht umpustet. Von unten.',
   'Wer braucht schon Beine, wenn man Arme hat? Genau: jeder.'],
 arme: ['Breiter Körper, Ärmchen wie ein T-Rex.', 'Die Arme passen nicht zum Rest.', 'Mach mal Curls, du Dinosaurier.', 'Kann der überhaupt seine Wasserflasche heben?',
   'Großer Rumpf, kleine Ärmchen. Süß irgendwie.', 'Seine Arme sind noch beim Aufwärmen.', 'Bizeps im Urlaub?', 'Der winkt wie ein Pinguin.',
   'Mit den Ärmchen kannst du nicht mal einen Einkaufswagen schieben.', 'Arme vergessen? Passiert den Besten.'],
 brust: ['Wo ist die Brust? Vermisstenanzeige raus!', 'Flach wie ein Bügelbrett.', 'Die Brust hat noch nicht mitbekommen, dass trainiert wird.', 'Bankdrücken soll Wunder wirken, hab ich gehört.',
   'Breite Arme, Brust wie ein Brett.', 'Der Brustkorb ruft um Hilfe.', 'Mehr Brust wagen!', 'Das Shirt hängt vorne noch durch.'],
 schulter: ['Die Schultern hängen wie ein nasser Pulli.', 'Kleiderbügel ohne Schultern, das geht nicht.', 'Schulterdrücken? Nie gehört?', 'Sieht aus wie eine Flasche. Oben schmal.',
   'Wo hören die Arme auf und fangen die Schultern an?', 'Die Schultern sind noch beim Frühstück.', 'Mehr Breite oben, bitte!', 'Der braucht dringend Seitheben.'],
 bauch: ['Sixpack? Eher ein Fass ohne Boden.', 'Der Bauch hat das Training noch nicht mitbekommen.', 'Crunches würden helfen. Nur so ein Tipp.', 'Starke Arme, weicher Bauch.',
   'Sein Sixpack ist noch im Kühlschrank.', 'Der Bauch macht Home-Office.', 'Der Rumpf wackelt wie Wackelpudding.', 'Ohne Bauchmuskeln keine Haltung, Bruder.'],
 ruecken: ['Von vorne Hulk, von hinten Hühnchen.', 'Guck mal in den Spiegel. Von hinten.', 'Der Rücken ist ein unbeschriebenes Blatt.', 'Klimmzüge sind auch Training, weißt du?',
   'Breite Brust, schmaler Rücken. Ein Schrank ohne Rückwand.', 'Der braucht ein V. Hat aber ein I.', 'Der Rücken ist noch im Lauch-Modus.', 'Von hinten sieht der aus wie früher.'],
 nacken: ['Der Kopf steckt auf einem Strohhalm.', 'Kein Nacken, nur Hals. Viel Hals.', 'Wo ist der Nacken? Gibt’s den noch?', 'Breit gebaut, aber Hals wie eine Giraffe.',
   'Shrugs, Bruder. Shrugs.', 'Der Kopf wackelt beim Heben.', 'Schrank mit Bleistift als Hals.', 'Ein Bulle braucht einen Stiernacken!'],
 ausdauer: ['Drei Wiederholungen und schon aus der Puste?', 'Der schnauft wie eine alte Dampflok.', 'Große Muskeln, kleine Lunge.', 'Bisschen Cardio würde nicht schaden.',
   'Der braucht nach der Treppe eine Pause.', 'Masse ohne Ausdauer ist wie ein Sportwagen ohne Tank.', 'Der ist schon wieder platt.', 'Hampelmann soll helfen. Wirklich.']
},
balanced: ['Ausgewogen von Kopf bis Fuß. Sehr gut.', 'Keine Schwachstelle. Gar keine.', 'Der hat an alles gedacht. Sogar an die Beine!', 'Perfekte Proportionen.',
  'Der trainiert ehrlich alles. Respekt.', 'So sieht ein vernünftiger Trainingsplan aus.', 'Keine Hühnerbeine, kein T-Rex. Alles im Gleichgewicht.'],

/* NPCs: [früh, mittel, spät] */
npc: {
 guenther: [
  ['Pass auf, der Abfluss da hinten ist kaputt.', 'Mach nicht so viel Lärm, oben wohnt Frau Krüger.', 'Früher war das hier ein Weinkeller. Jetzt ist es ein Lauchkeller.',
   'Wenn du was kaputt machst, zahlst du.', 'Ich wisch hier seit 31 Jahren. So einen wie dich hab ich selten gesehen. Leider.', 'Trink Wasser, Junge. Du siehst durchsichtig aus.'],
  ['Na, wirst ja langsam was.', 'Der Boden hält das schon aus. Noch.', 'Ich hab dir die Hanteln mal geputzt. Nicht dass du dich daran gewöhnst.',
   'Früher hab ich auch trainiert. 1979. Gute Zeit.', 'Du bist der einzige, der hier freiwillig schwitzt.', 'Wenn du so weitermachst, brauchst du ein größeres Gym.'],
  ['Ich hab’s immer gewusst. Seit dem ersten Tag.', 'Ich putz deinen Schweiß mit Stolz weg.', 'Der Junge aus dem Keller! Mein Junge!',
   'Ich hab ein Foto von dir aufgehängt. In der Besenkammer. Ehrenplatz.', 'Ich erzähl jedem, dass ich dich entdeckt hab.', 'Ich wisch heute extra gründlich. Für dich.']
 ],
 hilde: [
  ['Ach Gottchen, Junge, du musst mehr essen!', 'Soll ich dir eine Stulle schmieren?', 'Mein Enkel ist breiter als du. Der ist neun.',
   'Ich hab heute schon 3 km gelaufen. Und du?', 'Nicht so hastig, Kind. Atmen!', 'Meine Handtasche wiegt mehr als deine Hantel.'],
  ['Na guck mal, da wird ja was draus!', 'Jetzt siehst du schon gesünder aus.', 'Ich back dir am Sonntag einen Kuchen. Mit Proteinpulver.',
   'Du erinnerst mich an meinen Herbert. Der war auch so fleißig.', 'Toll machst du das!', 'Das ist ja ein richtiger Mann geworden.'],
  ['Mein Lieblingssportler!', 'Ich hab allen Damen im Kaffeekränzchen von dir erzählt.', 'So ein stattlicher junger Mann!',
   'Darf ich mal fühlen? Huch, wie Stein!', 'Ich bin so stolz auf dich, als wärst du mein Enkel.', 'Herbert hätte dich geliebt.']
 ],
 jassi: [
  ['OMG, Leute, guckt euch den an. Content!', 'Das wird mein nächstes Reel. Sorry, nicht sorry.', 'POV: Du siehst ihn zum ersten Mal Hanteln halten.',
   'Ich film das nur für die Wissenschaft.', 'Hashtag Lauchlife.', 'Leute, kommentiert mal, was er falsch macht.'],
  ['Okay, krass, der hat sich echt verändert. Meine Follower lieben ihn.', 'Glow-up des Jahres, ganz ehrlich.', 'Darf ich dich für meinen Kanal filmen? Ganz offiziell?',
   'Dein Before-After geht gerade richtig viral!', 'Leute, das ist echt Motivation pur.', 'Ich tag dich, okay?'],
  ['Kollab? Bitte sag ja!', 'Du hast mehr Follower als ich. Wie ist das passiert?', 'Meine Community will nur noch dich sehen.',
   'Ich filme Geschichte, Leute!', 'Brand-Deal für uns beide? Ich frag mal rum.', 'Du bist der Content, ich bin nur die Kamera.']
 ],
 marco: [
  ['Bro, du blockierst den Spiegel.', 'Ich trainier seit 12 Jahren. Du seit 12 Minuten.', 'Alles Genetik, Bro. Und du hast keine.',
   'Lass mich mal kurz posen. Danke.', 'Kleiner Tipp: Lass es.', 'Haha, der Lauch!'],
  ['Hm. Gar nicht so schlecht, Bro.', 'Okay, du darfst kurz in den Spiegel gucken.', 'Wer hat dir das beigebracht? Ich? Ja, sicher ich.',
   'Wir sollten mal zusammen trainieren. Damit du lernst.', 'Nicht übel. Aber meine Pump ist besser.', 'Respekt, Bro. Ein bisschen.'],
  ['Bro … bring mir das bei.', 'Ich geb zu: Du bist breiter als ich.', 'Der Spiegel gehört jetzt dir, Bro.',
   'Ich hab mein Profilbild geändert. Jetzt bist du drauf.', 'Ich war immer dein größter Fan. Immer!', 'Wenn ich groß bin, will ich so sein wie du.']
 ]
},

/* Rivale Dome */
rival: {
 taunt: ['Na, Lauch? Schon müde?', 'Ich hab heute schon das Doppelte gemacht.', 'Deine Pump ist meine Aufwärmphase.', 'Brauchst du Stützräder?',
   'Ich bin dir immer einen Schritt voraus.', 'Hier trainiert nur einer richtig. Rate mal wer.', 'Gib’s auf, ich bin schneller.', 'Trainierst du oder machst du Pause?'],
 even: ['Hm. Du holst auf.', 'Nicht schlecht. Für dich.', 'Glaub nicht, dass du mich einholst.', 'Okay, du bist kein Lauch mehr. Zufrieden?',
   'Wir sind gleich auf. Noch.', 'Du hast trainiert, was?', 'Respekt. Aber nur ein kleines bisschen.'],
 behind: ['Wie hast du das gemacht?!', 'Ich trainier ab jetzt doppelt.', 'Zeig mir deinen Plan, ich zahl auch.', 'Ich geb nicht auf!',
   'Du bist jetzt der Maßstab, Mann.', 'Irgendwann krieg ich dich wieder.', 'Ich hab Respekt. Echten.'],
 challenge: ['Duell. Jetzt. Du gegen mich.', 'Lass uns klären, wer hier der Boss ist.', 'Ich fordere dich heraus!', 'Komm her, wir messen uns.'],
 lost: ['Das war Glück!', 'Revanche! Sofort!', 'Ich hatte heute keinen guten Tag.', 'Okay … du warst besser.'],
 won: ['Hab ich doch gesagt.', 'Vielleicht nächstes Mal, Lauch.', 'Zu langsam, zu schwach.', 'Trainier erst mal ordentlich.']
},

/* Situationen */
sit: {
 lowEnergy: ['Der ist komplett durch.', 'Mach mal Pause, Junge!', 'Der schnauft wie ein Walross.', 'Trink was, Mann!', 'Gleich kippt er um.', 'Akku leer.'],
 beast: ['BEAST MODE!', 'Guckt euch das an!', 'Der ist nicht zu stoppen!', 'Was geht denn jetzt ab?!', 'Der dreht durch!', 'Feuer frei!'],
 crit: ['Perfekte Wiederholung!', 'Saubere Technik!', 'Wie aus dem Lehrbuch!', 'Das war schön!', 'Volltreffer!', 'Wow, die saß!'],
 sweat: ['Der läuft aus.', 'Handtuch! Schnell!', 'Da kann man drin baden.', 'Der schwitzt für drei.', 'Rutschgefahr!'],
 heavy: ['Das Gewicht ist zu schwer für den!', 'Uff, der übernimmt sich.', 'Ganz schön mutig.', 'Respekt fürs Gewicht!'],
 cardio: ['Lauf, Forrest, lauf!', 'Der hat ja doch Kondition.', 'Cardio! Selten gesehen hier.', 'Der hüpft wie ein Gummiball.'],
 win: ['Gewonnen! Gewonnen!', 'Er hat’s geschafft!', 'Sieger!', 'Was für ein Kampf!', 'Unser Mann!'],
 loss: ['Kopf hoch, nächstes Mal!', 'Knapp vorbei.', 'Das wird schon.', 'Der andere war heute stärker.', 'Trainier weiter!'],
 pet: ['Wie süß ist das denn?', 'Der Hund trainiert mit!', 'Gym-Hund! Ich liebe es.', 'Selbst das Tier hat mehr Disziplin als ich.'],
 music: ['Guter Song!', 'Mach lauter!', 'Das pusht richtig.', 'Bei dem Beat heb ich auch mehr.']
},

/* Memes, die anfangs entstehen (oben / unten) */
/* Wettkampf: blass gegen gebräunte Gegner */
pale: ['Ist der aus Käse?', 'Der leuchtet ja im Scheinwerfer!', 'Sonnenbrille auf, der Typ blendet!', 'Bruder, warst du mal draußen?', 'Ein Joghurt hat mehr Farbe.', 'Mozzarella auf zwei Beinen!',
  'Gegen den Gegner sieht der aus wie eine Kerze.', 'Hat der Schnee zu Hause?', 'Weiß wie die Wand im Keller.', 'Der braucht dringend Selbstbräuner.', 'Kalkweiß, aber motiviert.', 'Ich seh die Adern durch – leider nicht die Muskeln.'],
/* Zerrung durch zu schwere Gewichte mit schwacher Stütze */
strain: { arme: ['Die Arme können das, die Beine nicht. Wackelig!', 'Ohne stabile Beine kippst du mit der Hantel um.'], brust: ['Die Brust will, der Trizeps sagt nein.', 'Zu schwer für deine Arme, Junge.'],
  schulter: ['Rumpf und Arme müssen mithalten!', 'Überkopf ohne stabilen Bauch? Gefährlich.'], ruecken: ['Rudern aus schwachen Beinen? Das zwickt.', 'Erst Beine, dann das Gewicht!'],
  beine: ['Ohne starken Rücken geht das ins Kreuz.', 'Der untere Rücken meldet sich.'], nacken: ['Die Schultern sind noch nicht so weit.', 'Ruhig, der Nacken zwickt.'] },
/* Shirt platzt */
rip: ['Dein Shirt hat gerade aufgegeben.', 'Ratsch! Die Naht ist durch.', 'Das Shirt war mal ein Size M. Jetzt ist es ein Lappen.', 'Zeit für neue Klamotten, Großer.', 'Hörst du das? Das ist dein Ärmel.'],
/* Trainingspartner Kevin */
partner: ['Komm, noch drei!', 'Ich hab dich, Bro!', 'Gemeinsam schaffen wir das.', 'Nicht schlappmachen!', 'Ich spür schon den Pump.', 'Weißt du noch, als du mich im Klimmzug-Duell geschlagen hast?',
  'Heute Beintag? Nein? Okay.', 'Ein Satz noch, dann Shake.', 'Du wirst immer breiter, echt jetzt.', 'Ich zähl mit: eins, zwei, viele!'],
/* Gym-Ereignisse */
gev: { strom: ['Wer hat das Licht ausgemacht?!', 'Taschenlampen raus, weiter geht’s!', 'Im Dunkeln wachsen die Muskeln schneller. Sagt man.'],
  promi: ['Ist das … Brutus Breitkreuz?!', 'Der Brutus filmt dich gerade!', 'Autogramm! Autogramm!'], rohr: ['Günther! Das Rohr!', 'Hier schwimmen ja Geldscheine im Wasser!', 'Wasserrohrbruch – trainieren wir halt barfuß.'],
  kreide: ['Kreide-Party! Alle Hände weiß!', 'Hier staubt’s ja richtig.', 'Gripp wie ein Schraubstock heute.'],
  tv: ['Wir sind live! Lächeln!', 'Kamera läuft – zeig, was du hast!', 'Heute Abend bist du im Fernsehen!'],
  shoot: ['Halt! Genau so! Klick!', 'Mehr Pump fürs Foto!', 'Das wird ein Cover, ich schwör.'],
  legende: ['Horst „Eiche“ Brandt persönlich!', 'Der hat schon gepumpt, als es noch keine Hanteln gab.', 'Die Legende nickt dir zu!'],
  fans: ['Wir lieben dich!', 'Noch eine Wiederholung! Für uns!', 'Autogramm auf meinen Arm, bitte!'],
  happy: ['Happy Hour! Alles halber Preis!', 'Shakes für alle!', 'Jetzt schnell den Kühlschrank plündern.'] },
memes: [
 ['Wenn du zum ersten Mal ins Gym gehst', 'und die Hantel gewinnt'], ['Ich nach einer Woche Training', 'genau so'], ['POV: Du bist die 1-kg-Hantel', 'und hast Angst um ihn'],
 ['Er: „Ich bin im Bulk“', 'Der Bulk:'], ['Wenn Mutti sagt, du sollst mehr essen', 'und du es nicht tust'], ['Fitness-Influencer 2026', 'Budget-Version'],
 ['Strohhalm geht ins Gym', 'und wird ein dickerer Strohhalm'], ['Gym-Ausweis: aktiv', 'Muskeln: in Bearbeitung'], ['Wenn der Wind von der Lüftung kommt', 'Abflug in 3 … 2 …'],
 ['Hantel: 1 kg', 'Gesicht: 200 kg'], ['Ich nach 3 Wiederholungen', 'Ich nach 4 Wiederholungen: ☠'], ['Wenn du denkst, du bist breit', 'aber der Spiegel lacht'],
 ['Kleiderbügel-Challenge', 'gewonnen'], ['Er schwört, dass er trainiert', 'Beweislage: dünn'], ['Wenn die Proteinpackung größer ist', 'als du selbst']
],
viral: [
 ['Vom Lauch zum Biest', 'in Rekordzeit'], ['Diese Verwandlung', 'macht süchtig'], ['Kommentare: „Fake!“', 'Er: hebt einfach weiter'],
 ['Disziplin', 'sieht so aus'], ['Er wurde ausgelacht', 'jetzt lacht keiner mehr'], ['Das Gym hält den Atem an', 'jedes Mal'],
 ['Motivation des Tages', 'ist dieser Typ'], ['Gestern Meme', 'heute Vorbild']
]
};

/* Spruch auswählen: bevorzugt noch nie gelesene, sonst die am längsten nicht gesehenen. */
MK.pickLine = function (list, key) {
  if (!list || !list.length) return null;
  const S = MK.S; S.lseen = S.lseen || {};
  let best = [], bestN = Infinity;
  list.forEach((txt, i) => { const n = S.lseen[key + i] || 0; if (n < bestN) { bestN = n; best = [i]; } else if (n === bestN) best.push(i); });
  const i = best[Math.floor(Math.random() * best.length)];
  S.lseen[key + i] = (S.lseen[key + i] || 0) + 1;
  return list[i];
};

})(window.MK);
