-- PETAPP — Sistema de historia clínica para establecimientos/veterinarias (pedido explícito del
-- usuario, 2026-09-15): ficha de paciente + consultas en formato SOAP (el estándar real que usan
-- los veterinarios: Subjetivo/Objetivo/Assessment/Plan), ligadas al establecimiento que las crea.
-- Dos tablas nuevas, puramente aditivas — nada existente se toca.
--
-- Paciente "walk-in" (decisión confirmada con el usuario, 2026-09-15): si el dueño del animal no
-- tiene cuenta en la plataforma, sus datos de contacto se guardan como texto plano dentro de
-- clinical_patients (owner_full_name/owner_phone/owner_document) en vez de crearle un profile —
-- para no mezclar datos que ese dueño nunca consintió tener en una cuenta. Si el animal SÍ está
-- registrado en la plataforma, pet_id se vincula directo y esos tres campos quedan null.
--
-- Mismo patrón de RLS ya usado en el resto del esquema: `owner_id = auth.uid()` vía
-- `establishments.owner_id` para que cada establecimiento solo vea lo suyo (esto es lo que
-- resuelve la persistencia pedida: cada vez que el establecimiento entra, sus pacientes ya
-- registrados siguen ahí). Cuando el paciente está vinculado a una mascota real, se espeja
-- 0013_preventive_events_establishment_read.sql en la otra dirección: el dueño de la mascota
-- obtiene acceso de solo lectura a la ficha clínica oficial — cierra el círculo del "seguimiento
-- de citas" ya armado en 0014_vet_visit_notes.sql.

create table public.clinical_patients (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  pet_id uuid references public.pets(id) on delete set null,

  -- Solo se usan cuando pet_id es null (paciente walk-in, sin cuenta en la plataforma).
  owner_full_name text,
  owner_phone text,
  owner_document text,

  -- Signalment — el punto de vista clínico del establecimiento. Si pet_id está vinculado, puede
  -- diferir levemente de lo que el cuidador puso en `pets` (ej. peso actualizado en la última
  -- consulta) en vez de forzar una sincronización que no viene al caso acá.
  name text not null,
  species public.pet_species not null default 'perro',
  breed text,
  sex public.pet_sex not null default 'desconocido',
  birth_date date,
  estimated_age_years numeric(4,1),
  color text,
  origin_place text,
  microchip_number text,
  sterilized boolean not null default false,
  allergies text,
  chronic_conditions text,
  photo_url text,
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint clinical_patients_owner_source check (
    pet_id is not null or owner_full_name is not null
  )
);

create index clinical_patients_establishment_id_idx on public.clinical_patients(establishment_id);
create index clinical_patients_pet_id_idx on public.clinical_patients(pet_id);

create trigger clinical_patients_set_updated_at
  before update on public.clinical_patients
  for each row execute function public.set_updated_at();

alter table public.clinical_patients enable row level security;

create policy "clinical_patients_establishment_full_access" on public.clinical_patients
  for all using (
    exists (select 1 from public.establishments e where e.id = establishment_id and e.owner_id = auth.uid())
    or public.is_admin()
  )
  with check (
    exists (select 1 from public.establishments e where e.id = establishment_id and e.owner_id = auth.uid())
    or public.is_admin()
  );

-- Reusa pet_belongs_to_user() (security definer, 0008) en vez de una subconsulta directa a
-- `pets` — mismo motivo que ahí: evita cualquier ciclo de recursión de RLS.
create policy "clinical_patients_pet_owner_read" on public.clinical_patients
  for select using (
    pet_id is not null and public.pet_belongs_to_user(pet_id, auth.uid())
  );

create table public.clinical_records (
  id uuid primary key default gen_random_uuid(),
  clinical_patient_id uuid not null references public.clinical_patients(id) on delete cascade,
  establishment_id uuid not null references public.establishments(id) on delete cascade,

  visit_date date not null default current_date,
  reason text not null,

  -- Formato SOAP.
  subjective text,
  weight_kg numeric(6,2),
  temperature_c numeric(4,1),
  heart_rate_bpm integer,
  respiratory_rate_bpm integer,
  body_condition_score smallint check (body_condition_score between 1 and 9),
  physical_exam_notes text,
  diagnosis text,
  treatment_plan text,
  medications text,
  vaccines_applied text,
  follow_up_date date,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index clinical_records_clinical_patient_id_idx on public.clinical_records(clinical_patient_id);
create index clinical_records_establishment_id_idx on public.clinical_records(establishment_id);
create index clinical_records_visit_date_idx on public.clinical_records(visit_date);

create trigger clinical_records_set_updated_at
  before update on public.clinical_records
  for each row execute function public.set_updated_at();

alter table public.clinical_records enable row level security;

create policy "clinical_records_establishment_full_access" on public.clinical_records
  for all using (
    exists (select 1 from public.establishments e where e.id = establishment_id and e.owner_id = auth.uid())
    or public.is_admin()
  )
  with check (
    exists (select 1 from public.establishments e where e.id = establishment_id and e.owner_id = auth.uid())
    or public.is_admin()
  );

-- Función security definer en vez de un join directo a clinical_patients + pets dentro de la
-- policy: mismo motivo que establishment_has_relationship_with_pet() en 0013 — evita evaluar la
-- RLS de otra tabla en cascada durante el chequeo de esta.
create or replace function public.clinical_record_visible_to_pet_owner(check_clinical_patient_id uuid, check_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.clinical_patients cp
    join public.pets p on p.id = cp.pet_id
    where cp.id = check_clinical_patient_id and p.owner_id = check_user_id
  );
$$;

create policy "clinical_records_pet_owner_read" on public.clinical_records
  for select using (
    public.clinical_record_visible_to_pet_owner(clinical_patient_id, auth.uid())
  );
