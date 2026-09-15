-- PETAPP — Documentos para firma (módulo "Seguimiento y documentos" de OkVet, spec.md sección
-- 25): consentimientos, remisiones, órdenes y fórmulas ligadas a una consulta o directamente a un
-- paciente. Puramente aditiva.
--
-- IMPORTANTE — alcance real de "firma" en esta primera versión: esto NO es una firma electrónica
-- con validez legal plena (eso implica un proveedor certificado, sello de tiempo, etc. — sería su
-- propio tema legal aparte). Acá "firmar" es que el dueño (o quien reciba el documento) escriba su
-- nombre y acepte, con fecha/hora — el mismo nivel de "aceptación" que un formulario web normal,
-- útil como registro pero no como prueba jurídica reforzada. Documentarlo así evita venderlo como
-- algo que no es.

create type public.clinical_document_type as enum (
  'consentimiento',
  'remision',
  'orden',
  'formula',
  'otro'
);

create table public.clinical_documents (
  id uuid primary key default gen_random_uuid(),
  clinical_patient_id uuid not null references public.clinical_patients(id) on delete cascade,
  clinical_record_id uuid references public.clinical_records(id) on delete set null,
  establishment_id uuid not null references public.establishments(id) on delete cascade,

  document_type public.clinical_document_type not null default 'otro',
  title text not null,
  content text not null check (char_length(content) between 1 and 5000),

  signer_name text,
  signed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index clinical_documents_clinical_patient_id_idx on public.clinical_documents(clinical_patient_id);
create index clinical_documents_clinical_record_id_idx on public.clinical_documents(clinical_record_id);
create index clinical_documents_establishment_id_idx on public.clinical_documents(establishment_id);

create trigger clinical_documents_set_updated_at
  before update on public.clinical_documents
  for each row execute function public.set_updated_at();

alter table public.clinical_documents enable row level security;

create policy "clinical_documents_establishment_full_access" on public.clinical_documents
  for all using (
    exists (select 1 from public.establishments e where e.id = establishment_id and e.owner_id = auth.uid())
    or public.is_admin()
  )
  with check (
    exists (select 1 from public.establishments e where e.id = establishment_id and e.owner_id = auth.uid())
    or public.is_admin()
  );

-- Personal del establecimiento (0018_establishment_staff.sql) tiene el mismo acceso completo que
-- el dueño sobre los documentos — son quienes normalmente los redactan.
create policy "clinical_documents_staff_full_access" on public.clinical_documents
  for all using (public.is_active_establishment_staff(establishment_id, auth.uid()))
  with check (public.is_active_establishment_staff(establishment_id, auth.uid()));

-- El dueño de la mascota puede leer (y "firmar", vía update acotado a solo esos dos campos desde
-- la propia acción del servidor) el documento que le corresponde — mismo patrón espejo que
-- clinical_records_pet_owner_read (0016).
create or replace function public.clinical_document_visible_to_pet_owner(check_clinical_patient_id uuid, check_user_id uuid)
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

create policy "clinical_documents_pet_owner_read" on public.clinical_documents
  for select using (
    public.clinical_document_visible_to_pet_owner(clinical_patient_id, auth.uid())
  );

-- Firmar = el dueño solo puede llenar signer_name/signed_at de un documento suyo que todavía no
-- tenía firma — no puede reescribir el contenido ni re-firmar algo ya firmado (evita que el
-- cuidador "cambie de opinión" borrando su propia firma, o edite lo que el establecimiento redactó).
create policy "clinical_documents_pet_owner_sign" on public.clinical_documents
  for update using (
    public.clinical_document_visible_to_pet_owner(clinical_patient_id, auth.uid())
    and signed_at is null
  )
  with check (
    public.clinical_document_visible_to_pet_owner(clinical_patient_id, auth.uid())
  );
