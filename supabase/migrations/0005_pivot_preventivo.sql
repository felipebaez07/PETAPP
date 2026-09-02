-- PETAPP — Fase 2: pivot a seguimiento preventivo + directorio veterinario verificado.
-- Motivo: rework de producto (ver spec.md sección 0-3) a partir del documento de negocio
-- "PETAPP: plataforma nacional de seguimiento preventivo y acceso a servicios veterinarios"
-- (2026-09-01). Decisión confirmada: reemplazo completo de marketplace/foro/adopciones,
-- no adición. Esta migración es destructiva para esas tres features — se deja pendiente de
-- aplicar manualmente sobre el proyecto Supabase real (ver spec.md sección 7).

-- ============================================================================
-- 1. DEPRECAR MARKETPLACE, FORO Y ADOPCIONES — EXPAND/CONTRACT, FASE "EXPAND"
-- Revisión con db-guardian (2026-09-01): no hay forma de confirmar desde aquí cuántas
-- filas reales tienen estas tablas en el proyecto Supabase conectado (nnsjospqprfygmxnlszb),
-- así que un DROP directo viola la regla de no asumir que una tabla está vacía. En vez de
-- borrar, se renombran fuera del esquema activo — mismo efecto de sacarlas de circulación,
-- cero pérdida de datos, reversible con un simple rename de vuelta. El DROP real (fase
-- "contract") queda como tarea pendiente en spec.md, para una migración aparte una vez
-- se confirme que no hace falta recuperar nada de ahí. Los tipos enum NO se borran porque
-- las tablas renombradas siguen usándolos.
-- ============================================================================

alter table if exists public.products rename to zz_deprecated_products_20260901;
alter table if exists public.forum_posts rename to zz_deprecated_forum_posts_20260901;
alter table if exists public.adoption_interests rename to zz_deprecated_adoption_interests_20260901;
alter table if exists public.adoption_photos rename to zz_deprecated_adoption_photos_20260901;
alter table if exists public.adoption_posts rename to zz_deprecated_adoption_posts_20260901;

-- ============================================================================
-- 2. OCULTAR (NO BORRAR) ESTABLECIMIENTOS FUERA DEL NUEVO ALCANCE
-- El directorio ahora es exclusivamente veterinaria/profesional. Se ocultan las filas
-- comercio/fundacion en vez de borrarlas: son datos reales investigados (seed de Ibagué)
-- y la decisión de producto puede revisarse; is_active=false ya está soportado por el
-- RLS existente (establishments_public_read_active).
-- ============================================================================

update public.establishments
set is_active = false
where category in ('comercio', 'fundacion') and is_active = true;

-- ============================================================================
-- 3. RENOMBRAR RESERVATIONS -> SERVICE_REQUESTS
-- El nombre "solicitud de cita" es el que usa el negocio; las policies y el trigger
-- de updated_at siguen apuntando a la misma tabla (Postgres no las rompe al renombrar),
-- solo quedan con nombres heredados de "reservations" — se documenta aquí para quien
-- lea pg_policies y se pregunte por qué no coinciden con el nombre de la tabla.
-- ============================================================================

alter table public.reservations rename to service_requests;
alter index reservations_pkey rename to service_requests_pkey;
alter index reservations_pet_owner_id_idx rename to service_requests_pet_owner_id_idx;
alter index reservations_establishment_id_idx rename to service_requests_establishment_id_idx;
alter index reservations_status_idx rename to service_requests_status_idx;
alter trigger reservations_set_updated_at on public.service_requests rename to service_requests_set_updated_at;

-- ============================================================================
-- 4. CALENDARIO PREVENTIVO
-- ============================================================================

create type public.preventive_event_type as enum ('vacuna', 'control', 'desparasitacion', 'otro');

create table public.preventive_events (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  type public.preventive_event_type not null default 'otro',
  title text not null,
  due_date date not null,
  completed_at timestamptz,
  reminder_sent_at timestamptz,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index preventive_events_pet_id_idx on public.preventive_events(pet_id);
create index preventive_events_due_date_idx on public.preventive_events(due_date);

create trigger preventive_events_set_updated_at
  before update on public.preventive_events
  for each row execute function public.set_updated_at();

alter table public.preventive_events enable row level security;

create policy "preventive_events_owner_full_access" on public.preventive_events
  for all using (
    exists (select 1 from public.pets p where p.id = pet_id and p.owner_id = auth.uid())
    or public.is_admin()
  )
  with check (
    exists (select 1 from public.pets p where p.id = pet_id and p.owner_id = auth.uid())
    or public.is_admin()
  );

-- ============================================================================
-- 5. DOCUMENTOS BÁSICOS (SOPORTES)
-- ============================================================================

create type public.pet_document_type as enum ('carnet_vacunacion', 'historia_clinica', 'otro');

create table public.pet_documents (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  title text not null,
  document_url text not null,
  document_type public.pet_document_type not null default 'otro',
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index pet_documents_pet_id_idx on public.pet_documents(pet_id);

alter table public.pet_documents enable row level security;

create policy "pet_documents_owner_full_access" on public.pet_documents
  for all using (
    exists (select 1 from public.pets p where p.id = pet_id and p.owner_id = auth.uid())
    or public.is_admin()
  )
  with check (
    exists (select 1 from public.pets p where p.id = pet_id and p.owner_id = auth.uid())
    or public.is_admin()
  );

-- ============================================================================
-- 6. PLAN B2B DEL PRESTADOR
-- Fase piloto: sin pasarela de pago (igual que el resto del sistema). El prestador
-- puede elegir/solicitar un plan; solo un admin puede marcarlo como 'activa' tras
-- confirmar el pago manualmente (mismo patrón que prevent_establishment_self_verification).
-- ============================================================================

create type public.provider_plan_code as enum ('basico', 'pro');
create type public.provider_plan_status as enum ('prueba', 'activa', 'pausada', 'cancelada');

create table public.provider_plans (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null unique references public.establishments(id) on delete cascade,
  plan_code public.provider_plan_code not null default 'basico',
  status public.provider_plan_status not null default 'prueba',
  notes text,
  activated_by uuid references public.profiles(id) on delete set null,
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger provider_plans_set_updated_at
  before update on public.provider_plans
  for each row execute function public.set_updated_at();

alter table public.provider_plans enable row level security;

create policy "provider_plans_owner_or_admin_read" on public.provider_plans
  for select using (
    exists (select 1 from public.establishments e where e.id = establishment_id and e.owner_id = auth.uid())
    or public.is_admin()
  );

create policy "provider_plans_owner_insert" on public.provider_plans
  for insert with check (
    exists (select 1 from public.establishments e where e.id = establishment_id and e.owner_id = auth.uid())
    or public.is_admin()
  );

-- El dueño puede cambiar de plan_code/notes libremente, pero no auto-activarse.
create or replace function public.prevent_provider_plan_self_activation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() and (
    new.status is distinct from old.status
    or new.activated_at is distinct from old.activated_at
    or new.activated_by is distinct from old.activated_by
  ) then
    raise exception 'Solo un administrador puede activar o cambiar el estado de un plan';
  end if;
  return new;
end;
$$;

create policy "provider_plans_owner_update" on public.provider_plans
  for update using (
    exists (select 1 from public.establishments e where e.id = establishment_id and e.owner_id = auth.uid())
    or public.is_admin()
  )
  with check (
    exists (select 1 from public.establishments e where e.id = establishment_id and e.owner_id = auth.uid())
    or public.is_admin()
  );

create trigger provider_plans_prevent_self_activation
  before update on public.provider_plans
  for each row execute function public.prevent_provider_plan_self_activation();
