# Online-Speicher für „Spielstand übertragen“ (Supabase, kostenlos)

Einmal einrichten, ca. 10 Minuten. Danach funktioniert in allen Versionen (Browser, Handy, Windows-App):
Optionen → Spielstand → **Senden** (zeigt 6 Zeichen) → auf dem anderen Gerät **Empfangen** → Code eintippen.

## 1. Konto und Projekt anlegen
1. https://supabase.com öffnen → **Start your project** → mit GitHub anmelden.
2. **New project** → Name z. B. `muskelklicker`, Datenbank-Passwort erzeugen lassen (gut aufheben, wird für das Spiel nicht gebraucht),
   Region **Central EU (Frankfurt)**, Plan **Free** → **Create new project**. Ein bis zwei Minuten warten.

## 2. Datenbank vorbereiten
1. Links **SQL Editor** → **New query**.
2. Den kompletten Inhalt von `supabase/transfer.sql` hineinkopieren → **Run**. Es sollte „Success“ erscheinen.

## 3. Adresse und öffentlichen Schlüssel ins Spiel eintragen
1. Links **Project Settings** (Zahnrad) → **Data API**: die **Project URL** kopieren (`https://….supabase.co`).
2. **Project Settings → API Keys**: den **Publishable key** (`sb_publishable_…`) kopieren.
   (Bei älteren Projekten heißt er **anon public** und beginnt mit `eyJ…`.)
   **Niemals** den `secret`- bzw. `service_role`-Schlüssel nehmen!
3. In `app/js/cloud-config.js` eintragen:
   ```js
   MK.CLOUD = {
     url: 'https://DEINPROJEKT.supabase.co',
     key: 'sb_publishable_…'
   };
   ```
4. Committen. Der öffentliche Schlüssel darf ins öffentliche Repo: Die Datenbank erlaubt damit nur die zwei Funktionen
   `send_save` und `get_save` – niemand kann damit Spielstände auflisten, ändern oder löschen.

## Gut zu wissen
- Ein Code gilt 15 Minuten und kann nur **einmal** eingelöst werden, danach ist der Stand vom Server gelöscht.
- Der kostenlose Plan pausiert ein Projekt nach ca. 1 Woche ohne Nutzung. Dann im Supabase-Dashboard auf **Restore** klicken.
- Ohne Internet / ohne Einrichtung geht immer: **Als Datei speichern** → Datei aufs andere Gerät → **Datei laden**.
