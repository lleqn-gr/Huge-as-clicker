# Muskelklicker – 3D-Umgebungen (Plan für Claude Code)

**Neue Richtung (ersetzt den alten Plan):** Die Figur, alle NPCs, der Rivale, das Haustier und die Geräte,
an denen die Figur direkt trainiert (Hantel, Bank, Stange), **bleiben 2D** wie bisher (figure.js, side.js, scene.js).
In **3D** mit Three.js kommen nur die **Umgebungen**:
- Gym-Räume (alle Stufen)
- Bühnen
- Theken
- Hintergrund-Geräte
- Fenster und Himmel

Die 3D-Figur aus dem alten Prototyp wird **nicht** weiterverfolgt.

## Stil
- Comic-3D, passend zur 2D-Figur: flache, kräftige Farben, 2–3 harte Lichtstufen, schwarze Umrisse in derselben Strichstärke wie die 2D-Figur.
- Etwas vereinfachte, leicht überzeichnete Formen.
- Die 2D-Figuren dürfen nie „draufgeklebt“ wirken:
  - Perspektive, Bodenlinie, Horizont und Lichtrichtung müssen zur 2D-Figur passen.
  - Die Figuren bekommen weiche Schatten auf dem 3D-Boden.

## Grundregeln
1. Arbeiten auf dem Branch **`3d-umgebung`**. Er wird von `main` erstellt, nachdem die Verbesserungen dort gemergt sind. Den Three.js-Unterbau (app/vendor, Renderer-Grundgerüst, Toon-Material, Umrisse) aus dem Branch `3d-update` übernehmen; die 3D-Figur nicht.
2. Three.js lokal in `app/vendor`. Kein CDN, alles muss offline laufen.
3. **Ebenen:**
   - 3D-Hintergrund (Raum)
   - 2D-Ebene (Figur, NPCs, Trainingsgeräte, Partikel – wie bisher scene.js)
   - 3D-Vordergrund, nur wo nötig: Thekenfront, Bühnenrand, Geländer
4. **Leistung:** Jede Umgebung wird einmal in eine Textur/ein Bild gerendert. scene.js zeichnet dieses Bild statt des bisherigen 2D-Hintergrunds. Neu rendern nur bei Änderungen (Gym-Stufe, Tageszeit, Grafik-Stufe, Fenstergröße). Optional bei Grafik „hoch“: leichte Live-Bewegung (Parallax beim Klicken, Staubkörnchen im Licht, flackernde Neonröhre).
5. Optionen → Grafik: **Umgebung 3D / 2D**. Die alte 2D-Umgebung bleibt als Rückfall und wird automatisch genommen, wenn WebGL fehlt.
6. Spiellogik und Spielstand nicht verändern.
7. Nach jeder Phase:
   - Playwright-Screenshots (PC 1280×800 und iPhone-Größe), jeweils 3D und 2D
   - Konsole fehlerfrei
   - Commit auf `3d-umgebung`
   - kurze Zusammenfassung auf Deutsch

## Phase 1 – Prototyp: Vereinsgym
- Der erste Gym-Raum in 3D: Boden, Wände, Fenster mit **einem** gemeinsamen Himmel, Spiegelwand, Hintergrund-Geräte (Rack, Kabelzug, Hantelablage), Poster, Lampen.
- 2D-Figur und NPCs stehen sauber im Raum: passende Perspektive, Schatten auf dem Boden.
- Der Spiegel zeigt weiterhin die 2D-Spiegelung wie bisher.
- Leon vergleicht 3D/2D und gibt Feedback, bevor Phase 2 startet.

## Phase 2 – Alle Gym-Stufen
- Jede Gym-Stufe als eigener Raum mit eigener Stimmung (vom einfachen Vereinsgym bis zum Luxus-Gym).
- Beim Gym-Wechsel: kurze, weiche Überblendung.

## Phase 3 – Bühnen & Theken
- Wettkampf-/Turnier-Bühnen in 3D mit Scheinwerfern, Vorhang und Publikumsbereich (Publikum bleibt 2D).
- Theken (Bar/Shake-Bar, Shop, Labor-Tresen usw.) als 3D mit Vordergrund-Ebene, damit 2D-NPCs **hinter** der Theke stehen.
- Alles, was man anklicken kann (Kühlschrank, Boombox …), behält seine Klickflächen – auch auf dem Handy wie im Branch `verbesserungen` gelöst.

## Phase 4 – Licht & Atmosphäre
- Tageszeit nach echter Uhrzeit: Licht durch die Fenster, abends Lampen an, nachts Neon.
- Genau **ein** Mond bzw. **eine** Sonne, an der richtigen Stelle im richtigen Fenster.
- Beast-Modus: Raumlicht färbt sich, kurzes Aufleuchten.
- Kauf neuer Geräte: kurzer Glanz im Raum.

## Phase 5 – Feinschliff & Leistung
- Grafik-Stufen:
  - hoch: Live-Effekte, volle Auflösung
  - mittel: nur vorgerendert
  - niedrig: 2D-Umgebung
- Ladezeit prüfen.
- Auf Handy und in der App (`npm start`) testen.

## Phase 6 – Veröffentlichen (nur nach Leons OK)
- `3d-umgebung` nach `main` mergen und pushen.
- Für die Web-Version den Ordner `app/` als ZIP bereitstellen.
