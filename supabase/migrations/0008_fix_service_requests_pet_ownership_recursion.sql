-- PETAPP — Corrige "infinite recursion detected in policy for relation 'service_requests'",
-- reportado por el usuario probando "Solicitar cita" en producción el 2026-09-02.
--
-- Causa: `0006_service_request_pet_ownership.sql` agregó una policy de INSERT en
-- `service_requests` que verifica al dueño de la mascota consultando `pets` directamente. Pero
-- `0004_bugfixes.sql` (agosto 2026) ya tenía una policy en `pets` ("pets_read_via_reservation")
-- que consulta `service_requests` para dejarle ver la mascota a un establecimiento con una
-- solicitud relacionada. Esto arma un ciclo:
--   insertar en service_requests → evalúa RLS de pets (para el chequeo de dueño) →
--   evalúa pets_read_via_reservation → vuelve a evaluar RLS de service_requests → ...
-- Ninguna de las dos migraciones era incorrecta por separado; el ciclo solo aparece al
-- combinarlas, y no se detecta con una simple lectura del SQL — solo al ejecutarlo de verdad.
--
-- Fix: mover el chequeo de dueño de mascota a una función `security definer` (mismo patrón ya
-- usado por `is_admin()` en 0001_init.sql). Una función `security definer` corre con los
-- privilegios de su dueño (el rol `postgres`, que tiene `BYPASSRLS`), así que su consulta
-- interna a `pets` no vuelve a disparar la RLS de `pets` — rompe el ciclo sin quitarle
-- protección a nada.

create or replace function public.pet_belongs_to_user(check_pet_id uuid, check_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.pets where id = check_pet_id and owner_id = check_user_id
  );
$$;

drop policy "reservations_pet_owner_insert" on public.service_requests;

create policy "reservations_pet_owner_insert" on public.service_requests
  for insert with check (
    pet_owner_id = auth.uid()
    and (pet_id is null or public.pet_belongs_to_user(pet_id, auth.uid()))
  );
