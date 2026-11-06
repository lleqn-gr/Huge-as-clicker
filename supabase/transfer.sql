-- Muskelklicker – Online-Speicher für „Spielstand übertragen"
-- Einmal komplett im Supabase „SQL Editor" ausführen (Run).
--
-- Sicherheit:
--  * Die Tabelle ist für die App NICHT direkt lesbar oder beschreibbar (Row Level Security an, keine Regeln, Rechte entzogen).
--  * Die App darf nur zwei Funktionen aufrufen:
--      send_save(daten)  → legt den Stand ab und gibt einen 6-Zeichen-Code zurück
--      get_save(code)    → gibt den Stand EINMAL zurück (danach gelöscht), nur innerhalb von 15 Minuten
--  * Man kann also keine Liste aller Spielstände abrufen und keinen fremden Stand verändern.
--  * Alte Einträge (> 15 Minuten) werden bei jedem Senden automatisch gelöscht.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.transfers (
  code       text primary key,
  data       text not null,
  created_at timestamptz not null default now()
);
alter table public.transfers enable row level security;
revoke all on table public.transfers from anon, authenticated;

create or replace function public.send_save(p_data text)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  abc constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';   -- ohne 0/O, 1/I/L (gut lesbar)
  c text;
  b bytea;
begin
  if p_data is null or length(p_data) < 10 or length(p_data) > 3000000 then
    raise exception 'Ungültiger Spielstand';
  end if;
  delete from public.transfers where created_at < now() - interval '15 minutes';
  loop
    b := gen_random_bytes(6);
    c := '';
    for i in 0..5 loop
      c := c || substr(abc, 1 + (get_byte(b, i) % length(abc)), 1);
    end loop;
    begin
      insert into public.transfers(code, data) values (c, p_data);
      exit;
    exception when unique_violation then
      -- Code schon vergeben → neuen würfeln
    end;
  end loop;
  return c;
end;
$$;

create or replace function public.get_save(p_code text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare d text;
begin
  delete from public.transfers
   where code = upper(trim(p_code))
     and created_at > now() - interval '15 minutes'
  returning data into d;
  return d;   -- null = Code falsch oder abgelaufen
end;
$$;

revoke all on function public.send_save(text) from public;
revoke all on function public.get_save(text)  from public;
grant execute on function public.send_save(text) to anon, authenticated;
grant execute on function public.get_save(text)  to anon, authenticated;
