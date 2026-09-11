-- PETAPP — Foto de síntoma en el chat de pre-diagnóstico (idea 1.1 del banco de ideas de
-- funcionalidades, construida junto con el cambio de motor de IA de Gemini a Groq). El
-- cuidador puede adjuntar una foto (una herida, un sarpullido, el ojo irritado) a un mensaje del
-- chat; el modelo la usa como contexto adicional para hacer mejores preguntas de seguimiento —
-- nunca cambia la regla de "nunca diagnostica" del prompt de sistema (ver
-- docs/legal/registro-legal.md LG-001, que ya cubre este módulo en general).
--
-- Bucket privado, mismo patrón que `pet-documents` (0007_pet_media_storage.sql): es información
-- de salud de la mascota, no debe quedar accesible por una URL pública aunque el path sea un
-- UUID difícil de adivinar — seguridad por oscuridad no es control de acceso real. Convención de
-- ruta: <auth.uid()>/<archivo> (no hace falta anidar por conversación: cada archivo ya es único
-- por UUID y solo su dueño puede leerlo/escribirlo, igual que en pet-photos/pet-documents).

insert into storage.buckets (id, name, public)
values ('ai-chat-images', 'ai-chat-images', false)
on conflict (id) do nothing;

create policy "ai_chat_images_owner_or_admin_read" on storage.objects
  for select using (
    bucket_id = 'ai-chat-images'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

create policy "ai_chat_images_owner_write" on storage.objects
  for insert with check (
    bucket_id = 'ai-chat-images' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "ai_chat_images_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'ai-chat-images' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Guarda qué foto (si la hubo) vino con cada turno del chat — nullable, la mayoría de turnos no
-- traen imagen. RLS de `ai_messages` (0009) ya cubre esta columna nueva sin cambios: la policy
-- filtra por fila, no por columna.
alter table public.ai_messages add column image_path text;
