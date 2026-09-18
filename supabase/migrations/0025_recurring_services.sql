-- PETAPP — Modelo de datos de "Recordatorios automáticos de servicios recurrentes" (spec formal
-- del usuario, 2026-09-17). El EVENTO en sí sigue viviendo en `preventive_events`
-- (0005_pivot_preventivo.sql, ya extendida con los tipos de estética en 0022) — lo que faltaba
-- era el lugar para las REGLAS que generan esos eventos solas.
--
-- También agrega `establishment_has_active_pro()` — la comprobación de plan real que pidió el
-- usuario explícitamente ("no una bandera suelta"): toda escritura de sugerencias de intervalo del
-- prestador (regla 2 de la funcionalidad) queda protegida por esta función en la propia policy de
-- la base de datos, no solo en la interfaz.

create or replace function public.establishment_has_active_pro(check_establishment_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.provider_plans
    where establishment_id = check_establishment_id
      and plan_code = 'pro'
      and status = 'activa'
  );
$$;

-- ============================================================================
-- Regla 1 — el cuidador define la frecuencia aproximada por servicio, en semanas. Puede dejarla
-- vacía (interval_weeks null = "sin frecuencia definida todavía", no genera nada), editarla y
-- desactivarla (active = false) en cualquier momento, sin pasar por el prestador.
-- ============================================================================

create table public.pet_service_recurrences (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  service_type public.preventive_event_type not null,
  interval_weeks integer check (interval_weeks is null or interval_weeks > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Una sola regla por mascota+tipo de servicio — editar es UPDATE, no otra fila.
  unique (pet_id, service_type)
);

create index pet_service_recurrences_pet_id_idx on public.pet_service_recurrences(pet_id);

create trigger pet_service_recurrences_set_updated_at
  before update on public.pet_service_recurrences
  for each row execute function public.set_updated_at();

alter table public.pet_service_recurrences enable row level security;

create policy "pet_service_recurrences_owner_full_access" on public.pet_service_recurrences
  for all using (public.pet_belongs_to_user(pet_id, auth.uid()) or public.is_admin())
  with check (public.pet_belongs_to_user(pet_id, auth.uid()) or public.is_admin());

-- ============================================================================
-- Regla 5 (obligatoria) — el cuidador puede silenciar un servicio concreto, o TODOS los
-- recordatorios de una clínica puntual, desde su propia ficha. El prestador no puede leer ni tocar
-- esta tabla — no hay ninguna policy que se lo permita.
-- ============================================================================

create table public.pet_service_mutes (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  scope text not null check (scope in ('service', 'establishment')),
  -- Exactamente uno de los dos según el alcance — el CHECK de abajo lo exige.
  service_type public.preventive_event_type,
  establishment_id uuid references public.establishments(id) on delete cascade,
  created_at timestamptz not null default now(),

  constraint pet_service_mutes_scope_shape check (
    (scope = 'service' and service_type is not null and establishment_id is null)
    or (scope = 'establishment' and establishment_id is not null and service_type is null)
  )
);

create index pet_service_mutes_pet_id_idx on public.pet_service_mutes(pet_id);
create index pet_service_mutes_establishment_id_idx on public.pet_service_mutes(establishment_id);

alter table public.pet_service_mutes enable row level security;

create policy "pet_service_mutes_owner_full_access" on public.pet_service_mutes
  for all using (public.pet_belongs_to_user(pet_id, auth.uid()) or public.is_admin())
  with check (public.pet_belongs_to_user(pet_id, auth.uid()) or public.is_admin());

-- ============================================================================
-- Regla 2 — el prestador Pro configura, una sola vez, sus intervalos sugeridos por servicio,
-- opcionalmente diferenciados por tamaño o tipo de pelaje. Son solo SUGERENCIA para el cuidador
-- (lectura pública), nunca se imponen — la regla del cuidador (arriba) es la que de verdad genera
-- recordatorios.
-- ============================================================================

create table public.establishment_service_intervals (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  service_type public.preventive_event_type not null,
  interval_weeks integer not null check (interval_weeks > 0),
  pet_size public.pet_size,
  coat_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index establishment_service_intervals_establishment_id_idx
  on public.establishment_service_intervals(establishment_id);

create trigger establishment_service_intervals_set_updated_at
  before update on public.establishment_service_intervals
  for each row execute function public.set_updated_at();

alter table public.establishment_service_intervals enable row level security;

create policy "establishment_service_intervals_public_read" on public.establishment_service_intervals
  for select using (true);

-- Escritura solo con Pro activo de verdad (`establishment_has_active_pro`, no un `plan_code` sin
-- verificar) — mismo criterio de configuración-solo-dueño que perfil/horarios/servicios/plan.
create policy "establishment_service_intervals_pro_owner_write" on public.establishment_service_intervals
  for all using (
    public.is_admin()
    or (
      exists (select 1 from public.establishments e where e.id = establishment_id and e.owner_id = auth.uid())
      and public.establishment_has_active_pro(establishment_id)
    )
  )
  with check (
    public.is_admin()
    or (
      exists (select 1 from public.establishments e where e.id = establishment_id and e.owner_id = auth.uid())
      and public.establishment_has_active_pro(establishment_id)
    )
  );
