-- PETAPP — Subida real de archivos: foto de mascota y documentos (carné, historia clínica).
-- Hasta ahora `pets.photo_url` y `pet_documents.document_url` solo aceptaban pegar una URL de
-- texto — no existía carga real de imagen/archivo en ninguna de las dos apps.
--
-- Dos buckets con nivel de privacidad distinto a propósito:
-- - `pet-photos`: público. Son fotos de mascota, no datos sensibles; público simplifica
--   mostrarlas con una URL directa sin generar URLs firmadas para algo de bajo riesgo.
-- - `pet-documents`: privado. Carné de vacunación / historia clínica son información de salud;
--   una URL pública (aunque el path sea un UUID "difícil de adivinar") sigue siendo accesible
--   por cualquiera que la obtenga — seguridad por oscuridad, no control de acceso real. Con el
--   bucket privado, solo se puede leer generando una URL firmada de corta duración a través del
--   cliente de Supabase autenticado como el dueño (o admin), reforzado además por la RLS de
--   `storage.objects` de abajo.
--
-- Convención de ruta para ambos buckets: <auth.uid()>/<pet_id>/<archivo> — las policies
-- verifican dueño comparando el primer segmento de la ruta (storage.foldername) con auth.uid().

insert into storage.buckets (id, name, public)
values ('pet-photos', 'pet-photos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('pet-documents', 'pet-documents', false)
on conflict (id) do nothing;

create policy "pet_photos_public_read" on storage.objects
  for select using (bucket_id = 'pet-photos');

create policy "pet_photos_owner_write" on storage.objects
  for insert with check (
    bucket_id = 'pet-photos' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "pet_photos_owner_update" on storage.objects
  for update using (
    bucket_id = 'pet-photos' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "pet_photos_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'pet-photos' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "pet_documents_owner_or_admin_read" on storage.objects
  for select using (
    bucket_id = 'pet-documents'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

create policy "pet_documents_owner_write" on storage.objects
  for insert with check (
    bucket_id = 'pet-documents' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "pet_documents_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'pet-documents' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- `pet_documents.document_url` pasa a ser opcional: sigue existiendo para pegar un enlace
-- externo (ej. un PDF ya alojado en otro sitio), pero un documento subido como archivo real
-- guarda su ruta de Storage en `storage_path` en vez de una URL — el bucket es privado, así
-- que no hay una URL pública fija que guardar; la app genera una URL firmada al momento de
-- mostrarlo. El check exige que venga al menos uno de los dos.
alter table public.pet_documents alter column document_url drop not null;
alter table public.pet_documents add column storage_path text;
alter table public.pet_documents add constraint pet_documents_has_source
  check (document_url is not null or storage_path is not null);
