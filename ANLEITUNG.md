# Muskelklicker – Windows-App

**Ordner-Inhalt**
- `app/` – das Spiel selbst. Bei jedem Spiel-Update wird nur dieser Ordner ausgetauscht.
- `main.js` – startet das Spielfenster und sucht nach Updates.
- `package.json` – Name, Version und Bau-Einstellungen.
- `build/` – App-Symbol.
- `.github/workflows/build.yml` – GitHub baut damit bei jedem Hochladen automatisch eine neue `.exe`.

**Update veröffentlichen**
1. Neuen `app`-Ordner von Claude entpacken.
2. Im Ordner `Muskelklicker` (GitHub Desktop) den alten `app`-Ordner löschen.
3. Den neuen `app`-Ordner an dieselbe Stelle kopieren.
4. In GitHub Desktop unten links eine kurze Zusammenfassung eintippen und **Commit to main** klicken.
5. Oben **Push origin** klicken.
6. Etwa 5–8 Minuten warten. Alle installierten Apps melden sich dann mit „Update bereit“.

**Tasten in der App**
- F11: Vollbild
- F5: neu laden
- F12: Entwicklerwerkzeuge
