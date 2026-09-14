-- PETAPP — Deja que un prestador vea los preventive_events de sus pacientes (para mostrar
-- "próximos vencimientos" en su panel), pendiente desde hace varias rondas (spec.md, backlog
-- original sección 9). Hoy `preventive_events` solo tiene una policy (`preventive_events_owner_full_access`,
-- 0005_pivot_preventivo.sql) que deja ver la fila al dueño de la mascota — ningún establecimiento
-- puede leerla nunca, ni con una cita confirmada.
--
-- Mismo patrón que `pet_belongs_to_user` (0008_fix_service_requests_pet_ownership_recursion.sql)
-- y `has_completed_service_request` (0012_establishment_reviews.sql): una función `security
-- definer` para el chequeo de elegibilidad, en vez de una subconsulta directa a
-- `service_requests` dentro de esta policy — evita el mismo ciclo de recursión de RLS que ya
-- rompió `0008` una vez (una policy de `pets` consultando `service_requests` mientras una policy
-- de `service_requests` consultaba `pets`, directo, sin pasar por una función).
--
-- Solo cuenta una relación 'confirmada' o 'completada' (no 'pendiente'/'cancelada'/'no_asistio') —
-- mismo criterio que ya usan `panel/(dashboard)/page.tsx` y `has_completed_service_request` para
-- decidir qué cuenta como "este prestador de verdad atendió o va a atender a esta mascota".
--
-- Puramente aditiva: no toca la policy existente del dueño ni ninguna fila. Postgres OR-ea
-- policies permisivas del mismo comando (SELECT), así que esto solo agrega acceso.

create or replace function public.establishment_has_relationship_with_pet(check_pet_id uuid, check_establishment_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.service_requests
    where pet_id = check_pet_id
      and establishment_id = check_establishment_id
      and status in ('confirmada', 'completada')
  );
$$;

create policy "preventive_events_establishment_read" on public.preventive_events
  for select using (
    exists (
      select 1 from public.establishments e
      where e.owner_id = auth.uid()
        and public.establishment_has_relationship_with_pet(pet_id, e.id)
    )
  );
