# Muskelklicker – Projektwissen für Claude Code

Deutsches Gym-Klicker-/Idle-Spiel im Comic-Stil. Spieler: Leon (Entwickler, kein Programmierer – erklär Dinge einfach, auf Deutsch).
Antworte immer auf Deutsch. Im Spiel selbst: **wenig Text**, kurze Wörter, keine Romane.

## Aufbau des Repos
```
app/                  ← das Spiel (wird 1:1 in die Windows-App gepackt)
  index.html          ← HTML + komplettes CSS, lädt alle js/*.js der Reihe nach (klassische <script>, KEINE Module)
  js/*.js             ← Spiel-Code, alles im globalen Namespace window.MK
  fonts/              ← Schriften lokal (Bangers, Barlow, Barlow Condensed, Comic Neue) – App muss offline laufen
  icons/              ← App-Symbole
main.js               ← Electron-Hauptprozess (Fenster, Auto-Update via electron-updater)
package.json          ← Electron + electron-builder Konfiguration
build/                ← icon.ico / icon.png für den Installer
.github/workflows/build.yml ← baut bei Push auf main automatisch die .exe und veröffentlicht sie als GitHub-Release
```

## WICHTIG: Releases
- **Jeder Push auf `main` erzeugt sofort eine neue Version, die alle Spieler automatisch bekommen.**
- Große/unfertige Arbeit deshalb IMMER auf einem eigenen Branch (z. B. `3d-update`). Erst nach Leons OK nach `main` mergen.
- Versionsnummer zählt der Workflow selbst hoch – `package.json`-Version nicht anfassen.
- `build.yml`, `main.js`, `package.json` nur ändern, wenn es wirklich nötig ist, und dann erklären warum.
- Spielstände liegen im localStorage (`MK.save`/`MK.load`, Schlüssel in state.js). Nie Spielstände kaputt machen: neue Felder in `MK.fresh()` + Migration in `MK.ensureNew()`.

## Dateien in app/js (Ladereihenfolge)
| Datei | Inhalt |
|---|---|
| data.js | Alle Inhalte: Muskelgruppen (MK.MUSCLES), Übungen (MK.EXERCISES), Geräte, Geschäfte (MK.BIZ), Outfits, Skillbaum … |
| lines.js | Sprüche der Figur |
| art.js | Vorgerenderte Sprites: Geldschein, XP-Hantel (MK.Art) |
| state.js | Spielstand, alle Formeln, Kernlogik (Rep, Tick, Offline, Kaufen, Speichern) |
| figure.js | 2D-Figur von vorne (Muskelprofile je Körperteil, wachsen mit Level) |
| hair.js | Frisuren |
| side.js | 2D-Seitenansicht für Liegeübungen (Bankdrücken, Crunches, Plank …) |
| scene.js | Gym-Szene auf Canvas 2D: Hintergrund, Geräte, Spiegel, NPCs, Rivale, Rep-Animation, Partikel |
| empire_sprites.js / empire.js | Imperium-Ansicht (Stadt von oben + Reihen je Geschäft) |
| audio.js | Sound & Musik, komplett per WebAudio erzeugt |
| minigames.js | Duelle, Turniere, Rivale |
| lab.js | Labor, Dopingkontrolle, Mini-Spiele |
| guide.js | Freischalt-Führung, Ergebnis-Einblendungen |
| ui.js | Alle Reiter/Shops/Optionen (HTML-Strings), Toasts, Popups |
| fx.js | Effekt-Ebene über der Seite (#fxl): XP-Hanteln & Geldscheine fliegen, rollende Zähler |
| main.js | Start, Eingabe, Spielschleife, Ansicht wechseln (morphStage Gym ↔ Imperium) |

Kommunikation zwischen Teilen: `MK.on(name, fn)` / `MK.emit(name, data)`.

## Spielregeln, die gelten müssen
- **XP-Formel:** Idle-Formel, erste Wiederholung gibt 1 XP. Benötigte XP pro Level stehen in einer vorberechneten Tabelle je Muskelgruppe (`MK.need(lv, g)`). Gewichtsstufen wirken als Faktor (`MK.W_FAC = 1.3`).
- **Preise:** `kosten = basis × rate^anzahl`, danach IMMER `MK.nice()` (2 gültige Stellen aufrunden, unter 100 auf 5er). Laborzeiten mit `MK.niceTime()`.
- **Wiederholungen:** immer komplette Bewegung, feste Geschwindigkeit (~2,9 Reps/s) mit Warteschlange. Schnelles Klicken zeigt man über Effekte (Schweiß, rot werden, Hecheln), nicht über halbe Reps.
- **Pump** füllt sich nur durch eigenes Klicken, nicht durch den Trainer.
- In Imperium und Skillbaum fliegen keine Geldscheine/Hanteln.
- Shop-/Reiter-Bereich: **kein Comic-Look** (Barlow-Schriften, klare Karten). Comic-Look nur in der Bühne und bei großen Momenten.
- Knöpfe haben einen 3D-Drück-Effekt. An/Aus-Schalter: Knopf exakt mittig.

## 3D-Richtung (Plan: 3D-UPDATE-PLAN.md, Branch `3d-umgebung`)
- **Figur, NPCs, Rivale, Haustier und die Geräte, an denen trainiert wird, bleiben 2D.** Nur die **Umgebungen** werden 3D (Gym-Räume, Bühnen, Theken, Hintergrund-Geräte, Fenster/Himmel). Die alte 3D-Figur (Branch `3d-update`) wird nicht weiterverfolgt.
- Code: `app/js/env3d/` (ES-Module, Three.js lokal in `app/vendor`). Der Raum wird einmal in ein Bild gerendert, scene.js zeichnet es statt des 2D-Hintergrunds (neu nur bei Gym-Stufe, Größe, Grafik-Stufe, Tag/Nacht).
- Kamera wird aus der 2D-Szene abgeleitet (Fußpunkt, Figurengröße, Wandkante yF, Größen-Staffelung der Besucher) – damit 2D-Figuren nicht „draufgeklebt“ wirken.
- Fenster sind im 3D-Bild durchsichtig; dahinter zeichnet scene.js den **einen** gemeinsamen Himmel (ein Mond/eine Sonne).
- Optionen: „Umgebung 3D/2D“ (`S.set.env3d`). 2D bleibt Rückfall (ohne WebGL, Grafik „niedrig“, Räume ohne 3D-Version).

## Leistung (wichtig auch für 3D)
- Muss auf Handys flüssig laufen. Es gibt `MK.dprCap` (dynamische Auflösung), Einstellung „Grafik: hoch/mittel/niedrig“ und „Akku sparen“.
- Teure Dinge vorrendern/cachen, nichts pro Frame neu erzeugen, Canvas ausblenden wenn nichts passiert.

## Testen
- Lokal starten: im Ordner `app` → `npx serve .` (oder `python -m http.server 8123`) und im Browser öffnen.
- Für Screenshots/automatische Tests Playwright verwenden (Desktop 1280×800 und iPhone-Größe). Vor jedem Commit: keine Fehler in der Konsole.
- Als App testen: `npm install` und `npm start` im Repo-Hauptordner.

## Stil der Zusammenarbeit
- Leon will Schritt-für-Schritt-Erklärungen, wenn er selbst etwas tun muss (wo klicken, was herunterladen).
- Nach jedem größeren Schritt: kurz zeigen/beschreiben, was sich geändert hat, und einen Screenshot machen.

Eingerichtet für Claude Code
