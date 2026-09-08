-- PETAPP — Módulo de pre-diagnóstico con IA: el cuidador describe la situación de su mascota por
-- chat, recibe un resumen estructurado (NUNCA un diagnóstico real) para llevar al veterinario.
-- Ver docs/legal/registro-legal.md (LG-001 a LG-004) para las consideraciones legales anotadas.
--
-- Dos tablas: `ai_conversations` (una por sesión de chat, guarda el resumen final una vez
-- generado) y `ai_messages` (cada turno de la conversación). Mismo patrón de RLS ya usado para
-- `preventive_events`/`pet_documents`: solo el dueño de la mascota (o admin) puede leer/escribir.

create type public.ai_conversation_status as enum ('activa', 'completada');
create type public.ai_message_role as enum ('user', 'assistant');

create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  status public.ai_conversation_status not null default 'activa',
  -- Resumen estructurado final (el "pre-diagnóstico" exportable a PDF) — null mientras la
  -- conversación sigue activa, se llena cuando el modelo decide que ya tiene suficiente
  -- información para armarlo.
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ai_conversations_pet_id_idx on public.ai_conversations(pet_id);
create index ai_conversations_owner_id_idx on public.ai_conversations(owner_id);

create trigger ai_conversations_set_updated_at
  before update on public.ai_conversations
  for each row execute function public.set_updated_at();

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  role public.ai_message_role not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index ai_messages_conversation_id_idx on public.ai_messages(conversation_id);

alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;

-- `owner_id` ya viene desnormalizado en ai_conversations (en vez de solo pet_id + join a pets)
-- para evitar el mismo tipo de ciclo de RLS que ya se encontró y corrigió en
-- 0008_fix_service_requests_pet_ownership_recursion.sql — comparar owner_id = auth.uid()
-- directamente no dispara una evaluación de RLS de otra tabla.
create policy "ai_conversations_owner_full_access" on public.ai_conversations
  for all using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

create policy "ai_messages_owner_full_access" on public.ai_messages
  for all using (
    exists (
      select 1 from public.ai_conversations c
      where c.id = conversation_id and (c.owner_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.ai_conversations c
      where c.id = conversation_id and (c.owner_id = auth.uid() or public.is_admin())
    )
  );
