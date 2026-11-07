/* Muskelklicker – Online-Speicher für „Spielstand übertragen" (Supabase).
   Hier stehen NUR die öffentlichen Werte (Projekt-Adresse + öffentlicher „publishable"/„anon"-Schlüssel).
   Die sind absichtlich öffentlich: Die Datenbank erlaubt damit nur die zwei Funktionen send_save / get_save (siehe supabase/transfer.sql).
   Leer lassen = Online-Übertragung aus, die Datei-Lösung funktioniert trotzdem. */
window.MK = window.MK || {};
MK.CLOUD = {
  url: 'https://dgvodswimhbidhvxdhqw.supabase.co',
  key: 'sb_publishable_yXSGgs87o4qTY8jX-gv7_A_teRV3GLW'    // öffentlicher Schlüssel (sb_publishable_… oder anon-Key eyJ…) – NIE den service_role / secret Key!
};
