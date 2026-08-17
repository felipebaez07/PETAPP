-- PetApp (nombre provisional) — Fase 1: Piloto local Ibagué
-- Esquema inicial: usuarios, mascotas, establecimientos, servicios, reservas, adopciones.
-- Alcance deliberadamente acotado a lo definido en el PDD (sección 3.1/6.3.2):
-- sin marketplace, sin pagos en línea, sin historia clínica avanzada, sin multisede.

create extension if not exists "pgcrypto";

-- ============================================================================
-- ENUMS
-- ============================================================================

create type public.user_role as enum ('propietario', 'establecimiento', 'admin');

create type public.establishment_category as enum ('veterinaria', 'comercio', 'profesional', 'fundacion');

create type public.verification_status as enum ('pendiente', 'en_revision', 'verificado', 'rechazado');

create type public.pet_species as enum ('perro', 'gato', 'otro');

create type public.pet_sex as enum ('macho', 'hembra', 'desconocido');

create type public.reservation_status as enum ('pendiente', 'confirmada', 'cancelada', 'completada', 'no_asistio');

create type public.reservation_channel as enum ('whatsapp', 'telefono', 'presencial', 'otro');

create type public.adoption_status as enum ('disponible', 'en_proceso', 'adoptado', 'retirado');

create type public.adoption_interest_status as enum ('nuevo', 'contactado', 'descartado', 'aprobado');

create type public.partner_application_status as enum ('nuevo', 'contactado', 'descartado', 'convertido');

-- ============================================================================
-- updated_at trigger helper
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- PROFILES (extiende auth.users)
-- ============================================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'propietario',
  full_name text not null,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Crea automáticamente un profile cuando se registra un usuario en auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone',
    -- nunca confiar en el valor de 'role' del cliente más allá de estas dos opciones:
    -- 'admin' solo se otorga manualmente en la base de datos, jamás vía metadata de signup.
    case
      when new.raw_user_meta_data->>'role' = 'establecimiento' then 'establecimiento'::public.user_role
      else 'propietario'::public.user_role
    end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Definida aquí (después de profiles, que consulta en su cuerpo, pero antes de
-- partner_applications_admin_read/update más abajo, que ya la usan) porque una función
-- `language sql` se valida contra el catálogo al crearla, no al ejecutarla.
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================================
-- PETS (mascotas)
-- ============================================================================

create table public.pets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  species public.pet_species not null default 'perro',
  breed text,
  sex public.pet_sex not null default 'desconocido',
  birth_date date,
  sterilized boolean not null default false,
  vaccinated boolean not null default false,
  photo_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pets_owner_id_idx on public.pets(owner_id);

create trigger pets_set_updated_at
  before update on public.pets
  for each row execute function public.set_updated_at();

-- ============================================================================
-- ESTABLISHMENTS (establecimientos aliados)
-- ============================================================================

create table public.establishments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  name text not null,
  slug text not null unique,
  category public.establishment_category not null,
  description text,
  address text,
  city text not null default 'Ibagué',
  lat double precision,
  lng double precision,
  phone text,
  whatsapp_number text,
  email text,
  website text,
  is_24_7 boolean not null default false,
  is_active boolean not null default true,
  verification_status public.verification_status not null default 'pendiente',
  verification_notes text,
  verified_at timestamptz,
  verified_by uuid references public.profiles(id) on delete set null,
  cover_image_url text,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index establishments_category_idx on public.establishments(category);
create index establishments_city_idx on public.establishments(city);
create index establishments_owner_id_idx on public.establishments(owner_id);

create trigger establishments_set_updated_at
  before update on public.establishments
  for each row execute function public.set_updated_at();

-- ============================================================================
-- ESTABLISHMENT HOURS (horarios por día de la semana)
-- ============================================================================

create table public.establishment_hours (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6), -- 0 = domingo
  open_time time,
  close_time time,
  closed boolean not null default false,
  unique (establishment_id, day_of_week)
);

-- ============================================================================
-- SERVICES (servicios ofrecidos por un establecimiento)
-- ============================================================================

create table public.services (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  name text not null,
  description text,
  price_reference text, -- texto libre en fase 1 (ej. "desde $60.000"), sin cobro en línea
  duration_minutes integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index services_establishment_id_idx on public.services(establishment_id);

-- ============================================================================
-- RESERVATIONS (reservas — gestión manual por mensajería en fase 1)
-- ============================================================================

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  pet_owner_id uuid not null references public.profiles(id) on delete cascade,
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  pet_id uuid references public.pets(id) on delete set null,
  requested_at timestamptz not null default now(),
  preferred_datetime timestamptz,
  status public.reservation_status not null default 'pendiente',
  channel public.reservation_channel not null default 'whatsapp',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reservations_pet_owner_id_idx on public.reservations(pet_owner_id);
create index reservations_establishment_id_idx on public.reservations(establishment_id);
create index reservations_status_idx on public.reservations(status);

create trigger reservations_set_updated_at
  before update on public.reservations
  for each row execute function public.set_updated_at();

-- ============================================================================
-- ADOPTION POSTS (publicaciones de adopción)
-- ============================================================================

create table public.adoption_posts (
  id uuid primary key default gen_random_uuid(),
  -- nullable: el equipo del piloto puede publicar en nombre de una fundación aliada
  -- (vía establishment_id) antes de que esa fundación tenga una cuenta propia.
  posted_by uuid references public.profiles(id) on delete set null,
  establishment_id uuid references public.establishments(id) on delete set null,
  animal_name text not null,
  species public.pet_species not null default 'perro',
  estimated_age text, -- texto libre: "cachorro", "2 años aprox."
  sex public.pet_sex not null default 'desconocido',
  sterilized boolean not null default false,
  vaccinated boolean not null default false,
  health_notes text,
  personality_notes text,
  location_text text,
  status public.adoption_status not null default 'disponible',
  cover_photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index adoption_posts_status_idx on public.adoption_posts(status);
create index adoption_posts_posted_by_idx on public.adoption_posts(posted_by);

create trigger adoption_posts_set_updated_at
  before update on public.adoption_posts
  for each row execute function public.set_updated_at();

create table public.adoption_photos (
  id uuid primary key default gen_random_uuid(),
  adoption_post_id uuid not null references public.adoption_posts(id) on delete cascade,
  photo_url text not null,
  sort_order integer not null default 0
);

create index adoption_photos_post_id_idx on public.adoption_photos(adoption_post_id);

-- ============================================================================
-- ADOPTION INTERESTS (formulario de potencial adoptante)
-- ============================================================================

create table public.adoption_interests (
  id uuid primary key default gen_random_uuid(),
  adoption_post_id uuid not null references public.adoption_posts(id) on delete cascade,
  interested_user_id uuid references public.profiles(id) on delete set null,
  full_name text not null,
  phone text not null,
  email text,
  message text,
  status public.adoption_interest_status not null default 'nuevo',
  created_at timestamptz not null default now()
);

create index adoption_interests_post_id_idx on public.adoption_interests(adoption_post_id);

-- ============================================================================
-- PARTNER APPLICATIONS (formulario público "Únete al piloto" — captura de
-- interés de negocios/fundaciones antes de tener cuenta; sirve además como
-- experimento de validación de demanda, PDD sección 11).
-- ============================================================================

create table public.partner_applications (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  category public.establishment_category not null,
  contact_name text not null,
  phone text not null,
  email text,
  address text,
  message text,
  status public.partner_application_status not null default 'nuevo',
  reviewed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.partner_applications enable row level security;

create policy "partner_applications_public_insert" on public.partner_applications
  for insert with check (true);

create policy "partner_applications_admin_read" on public.partner_applications
  for select using (public.is_admin());

create policy "partner_applications_admin_update" on public.partner_applications
  for update using (public.is_admin());

-- ============================================================================
-- RLS
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.pets enable row level security;
alter table public.establishments enable row level security;
alter table public.establishment_hours enable row level security;
alter table public.services enable row level security;
alter table public.reservations enable row level security;
alter table public.adoption_posts enable row level security;
alter table public.adoption_photos enable row level security;
alter table public.adoption_interests enable row level security;

-- PROFILES ---------------------------------------------------------------
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- USING no compara contra el valor anterior de la fila, así que por sí sola la policy
-- anterior permite que cualquier usuario se autopromueva (role = 'admin'). Se bloquea con trigger.
create or replace function public.prevent_role_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'No tienes permisos para cambiar el rol de este perfil';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_change
  before update on public.profiles
  for each row execute function public.prevent_role_change();

-- PETS ---------------------------------------------------------------------
create policy "pets_owner_full_access" on public.pets
  for all using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

-- ESTABLISHMENTS -------------------------------------------------------------
create policy "establishments_public_read_active" on public.establishments
  for select using (is_active = true or owner_id = auth.uid() or public.is_admin());

create policy "establishments_owner_update" on public.establishments
  for update using (owner_id = auth.uid() or public.is_admin());

-- Mismo problema que profiles_update_own: sin esto, el dueño de un establecimiento
-- puede auto-verificarse o auto-reactivarse llamando a update() directo con la anon key.
create or replace function public.prevent_establishment_self_verification()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() and (
    new.verification_status is distinct from old.verification_status
    or new.verified_at is distinct from old.verified_at
    or new.verified_by is distinct from old.verified_by
    or new.is_active is distinct from old.is_active
  ) then
    raise exception 'Solo un administrador puede cambiar el estado de verificación de un establecimiento';
  end if;
  return new;
end;
$$;

create trigger establishments_prevent_self_verification
  before update on public.establishments
  for each row execute function public.prevent_establishment_self_verification();

create policy "establishments_owner_insert" on public.establishments
  for insert with check (owner_id = auth.uid() or public.is_admin());

create policy "establishments_admin_delete" on public.establishments
  for delete using (public.is_admin());

-- ESTABLISHMENT_HOURS --------------------------------------------------------
create policy "hours_public_read" on public.establishment_hours
  for select using (
    exists (select 1 from public.establishments e where e.id = establishment_id and e.is_active = true)
    or exists (select 1 from public.establishments e where e.id = establishment_id and e.owner_id = auth.uid())
    or public.is_admin()
  );

create policy "hours_owner_write" on public.establishment_hours
  for all using (
    exists (select 1 from public.establishments e where e.id = establishment_id and e.owner_id = auth.uid())
    or public.is_admin()
  )
  with check (
    exists (select 1 from public.establishments e where e.id = establishment_id and e.owner_id = auth.uid())
    or public.is_admin()
  );

-- SERVICES -------------------------------------------------------------------
create policy "services_public_read" on public.services
  for select using (
    exists (select 1 from public.establishments e where e.id = establishment_id and e.is_active = true)
    or exists (select 1 from public.establishments e where e.id = establishment_id and e.owner_id = auth.uid())
    or public.is_admin()
  );

create policy "services_owner_write" on public.services
  for all using (
    exists (select 1 from public.establishments e where e.id = establishment_id and e.owner_id = auth.uid())
    or public.is_admin()
  )
  with check (
    exists (select 1 from public.establishments e where e.id = establishment_id and e.owner_id = auth.uid())
    or public.is_admin()
  );

-- RESERVATIONS ----------------------------------------------------------------
create policy "reservations_owner_or_establishment_read" on public.reservations
  for select using (
    pet_owner_id = auth.uid()
    or exists (select 1 from public.establishments e where e.id = establishment_id and e.owner_id = auth.uid())
    or public.is_admin()
  );

create policy "reservations_pet_owner_insert" on public.reservations
  for insert with check (pet_owner_id = auth.uid());

-- Solo el establecimiento (o admin) actualiza reservas hoy (ver reservas/actions.ts);
-- el propietario de la mascota no tiene ninguna acción de update en la app. Sin WITH CHECK,
-- dejar pet_owner_id aquí permitiría que el propietario forjara su propio status
-- (p. ej. marcarla como 'confirmada'/'completada') o reasignara establishment_id/service_id/pet_id.
create policy "reservations_update_establishment_or_admin" on public.reservations
  for update using (
    exists (select 1 from public.establishments e where e.id = establishment_id and e.owner_id = auth.uid())
    or public.is_admin()
  )
  with check (
    exists (select 1 from public.establishments e where e.id = establishment_id and e.owner_id = auth.uid())
    or public.is_admin()
  );

-- ADOPTION POSTS ---------------------------------------------------------------
create policy "adoption_posts_public_read" on public.adoption_posts
  for select using (true);

create policy "adoption_posts_owner_write" on public.adoption_posts
  for all using (
    posted_by = auth.uid()
    or exists (select 1 from public.establishments e where e.id = establishment_id and e.owner_id = auth.uid())
    or public.is_admin()
  )
  with check (
    posted_by = auth.uid()
    or exists (select 1 from public.establishments e where e.id = establishment_id and e.owner_id = auth.uid())
    or public.is_admin()
  );

-- ADOPTION PHOTOS ---------------------------------------------------------------
create policy "adoption_photos_public_read" on public.adoption_photos
  for select using (true);

create policy "adoption_photos_owner_write" on public.adoption_photos
  for all using (
    exists (select 1 from public.adoption_posts p where p.id = adoption_post_id and (p.posted_by = auth.uid() or public.is_admin()))
  )
  with check (
    exists (select 1 from public.adoption_posts p where p.id = adoption_post_id and (p.posted_by = auth.uid() or public.is_admin()))
  );

-- ADOPTION INTERESTS ---------------------------------------------------------------
create policy "adoption_interests_insert_anyone_authenticated" on public.adoption_interests
  for insert with check (auth.uid() is not null);

create policy "adoption_interests_read_owner_or_admin" on public.adoption_interests
  for select using (
    interested_user_id = auth.uid()
    or exists (
      select 1 from public.adoption_posts p where p.id = adoption_post_id and p.posted_by = auth.uid()
    )
    or public.is_admin()
  );

create policy "adoption_interests_update_post_owner_or_admin" on public.adoption_interests
  for update using (
    exists (
      select 1 from public.adoption_posts p where p.id = adoption_post_id and p.posted_by = auth.uid()
    )
    or public.is_admin()
  );
