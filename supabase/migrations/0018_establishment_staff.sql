-- PETAPP — Multi-usuario por establecimiento (módulo "Administración" de OkVet, spec.md sección
-- 25): hoy un establecimiento = un solo `owner_id`, así que no hay forma de que un veterinario
-- distinto del dueño de la cuenta atienda pacientes, cargue consultas o vea la agenda. Este
-- decisión de alcance (por defecto, no confirmada con el usuario en detalle — documentar y
-- ajustar si hace falta): el personal se agrega por email de una cuenta que YA existe en PeTech
-- (no hay flujo de invitación a alguien sin cuenta) — más simple que armar un sistema de
-- invitaciones por correo con tokens, y suficiente para un piloto.
--
-- El staff tiene acceso a las tablas OPERATIVAS del día a día (pacientes, consultas, agenda de
-- citas, próximos vencimientos) pero NO a la configuración del negocio (perfil, horarios,
-- servicios, plan) — esas siguen siendo solo del dueño. Es una frontera de alcance razonable, no
-- una limitación técnica: un auxiliar no debería poder cambiar el plan de pago del negocio.

create table public.establishment_staff (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'veterinario' check (role in ('veterinario', 'auxiliar')),
  status text not null default 'activo' check (status in ('activo', 'inactivo')),
  added_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (establishment_id, profile_id)
);

create index establishment_staff_establishment_id_idx on public.establishment_staff(establishment_id);
create index establishment_staff_profile_id_idx on public.establishment_staff(profile_id);

create trigger establishment_staff_set_updated_at
  before update on public.establishment_staff
  for each row execute function public.set_updated_at();

alter table public.establishment_staff enable row level security;

-- El dueño del establecimiento administra su propio staff (agregar, cambiar rol/status, quitar).
create policy "establishment_staff_owner_manage" on public.establishment_staff
  for all using (
    exists (select 1 from public.establishments e where e.id = establishment_id and e.owner_id = auth.uid())
    or public.is_admin()
  )
  with check (
    exists (select 1 from public.establishments e where e.id = establishment_id and e.owner_id = auth.uid())
    or public.is_admin()
  );

-- Un miembro del staff puede ver su propia fila (para saber a qué establecimiento(s) pertenece).
create policy "establishment_staff_self_read" on public.establishment_staff
  for select using (profile_id = auth.uid());

-- Función security definer (mismo patrón que pet_belongs_to_user de 0008 y
-- establishment_has_relationship_with_pet de 0013): evita evaluar la RLS de esta tabla en cascada
-- desde las policies de otras tablas que la consultan más abajo.
create or replace function public.is_active_establishment_staff(check_establishment_id uuid, check_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.establishment_staff
    where establishment_id = check_establishment_id
      and profile_id = check_user_id
      and status = 'activo'
  );
$$;

-- ============================================================================
-- Acceso operativo del staff a lo que ya existía — puramente aditivo: cada policy nueva se suma
-- con OR a las que el dueño ya tenía (0016, 0006/0001, 0013), ninguna existente se toca ni se
-- borra.
-- ============================================================================

create policy "clinical_patients_staff_full_access" on public.clinical_patients
  for all using (public.is_active_establishment_staff(establishment_id, auth.uid()))
  with check (public.is_active_establishment_staff(establishment_id, auth.uid()));

create policy "clinical_records_staff_full_access" on public.clinical_records
  for all using (public.is_active_establishment_staff(establishment_id, auth.uid()))
  with check (public.is_active_establishment_staff(establishment_id, auth.uid()));

create policy "service_requests_staff_read" on public.service_requests
  for select using (public.is_active_establishment_staff(establishment_id, auth.uid()));

create policy "service_requests_staff_update" on public.service_requests
  for update using (public.is_active_establishment_staff(establishment_id, auth.uid()))
  with check (public.is_active_establishment_staff(establishment_id, auth.uid()));

-- Igual que las de arriba: función security definer en vez de un subquery directo a
-- `establishment_staff` dentro de la policy, para no depender de en qué orden Postgres evalúa la
-- RLS de esa tabla (que también tiene RLS propia) al resolver ésta.
create or replace function public.staff_establishment_has_relationship_with_pet(check_pet_id uuid, check_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.establishment_staff es
    where es.profile_id = check_user_id
      and es.status = 'activo'
      and public.establishment_has_relationship_with_pet(check_pet_id, es.establishment_id)
  );
$$;

create policy "preventive_events_staff_read" on public.preventive_events
  for select using (public.staff_establishment_has_relationship_with_pet(pet_id, auth.uid()));

-- ============================================================================
-- Agregar personal por email — `profiles` no guarda email (vive en `auth.users`, que PostgREST no
-- expone), así que el dueño no puede buscar "por email" con una simple consulta de tabla. Esta
-- función deja hacer esa búsqueda sin exponer `auth.users` en general.
--
-- Riesgo aceptado: cualquier usuario autenticado puede usar esto para confirmar si un email tiene
-- cuenta en PeTech (enumeración de cuentas) — es el mismo trade-off que casi cualquier flujo de
-- "agregar por email" en apps B2B. No expone nada más que "existe/no existe" + el id de perfil, y
-- ese id por sí solo no da acceso a nada (la fila de `establishment_staff` sigue exigiendo que
-- quien la crea sea dueño de ese establecimiento).
-- ============================================================================

create or replace function public.find_profile_id_by_email(lookup_email text)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select p.id
  from public.profiles p
  join auth.users u on u.id = p.id
  where lower(u.email) = lower(lookup_email)
  limit 1;
$$;

revoke all on function public.find_profile_id_by_email(text) from public;
grant execute on function public.find_profile_id_by_email(text) to authenticated;
