-- PETAPP — Seguimiento veterinario: después de la cita real (fuera de la app), el cuidador
-- vuelve y le cuenta a la IA qué le dijo/hizo el veterinario. Cierra el círculo del
-- pre-diagnóstico (idea explícita del usuario, 2026-09-13): la próxima vez que abra un chat de
-- pre-diagnóstico nuevo para la misma mascota, el backend le da a la IA el historial de visitas
-- anteriores (resúmenes de pre-diagnóstico completados + estas notas) como contexto, en vez de
-- que cada conversación empiece de cero sin memoria de las citas pasadas.
--
-- Privado del cuidador — a diferencia de `preventive_events` (0013), acá NO hay lectura para el
-- establecimiento: son notas personales de seguimiento, no algo que el prestador necesite ver.
-- `owner_id` desnormalizado (en vez de resolver el dueño solo a través de `pet_id`), mismo motivo
-- que `ai_conversations` (0009): comparar `owner_id = auth.uid()` directo evita el ciclo de
-- recursión de RLS ya corregido una vez en 0008.

create table public.vet_visit_notes (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  -- Si esta nota es el cierre de un chat de pre-diagnóstico puntual, queda linkeada acá — nullable
  -- porque el cuidador también puede agregar una nota de seguimiento suelta, sin partir de un
  -- chat previo (ej. una cita de rutina que nunca empezó como pre-diagnóstico).
  ai_conversation_id uuid references public.ai_conversations(id) on delete set null,
  note text not null check (char_length(note) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index vet_visit_notes_pet_id_idx on public.vet_visit_notes(pet_id);
create index vet_visit_notes_owner_id_idx on public.vet_visit_notes(owner_id);
create index vet_visit_notes_ai_conversation_id_idx on public.vet_visit_notes(ai_conversation_id);

create trigger vet_visit_notes_set_updated_at
  before update on public.vet_visit_notes
  for each row execute function public.set_updated_at();

alter table public.vet_visit_notes enable row level security;

-- FOR ALL a propósito (no 4 policies separadas): la condición es idéntica en los 4 comandos,
-- mismo patrón ya usado en ai_conversations/pets de este repo.
create policy "vet_visit_notes_owner_full_access" on public.vet_visit_notes
  for all using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());
