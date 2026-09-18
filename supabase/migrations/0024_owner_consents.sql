-- PETAPP — Consentimientos del cuidador, requisito legal explícito del usuario (ver
-- docs/legal/registro-legal.md, LG-008, y LG-006): la Ley 1581 de 2012 distingue "continuidad del
-- servicio" (un recordatorio de la vacuna/baño de tu propia mascota en tu propia veterinaria) de
-- "comunicación comercial" (una campaña/jornada) — dos consentimientos separados, cada uno con su
-- propio registro de cuándo y cómo se otorgó o revocó, no una sola bandera.
--
-- Diseño: tabla APPEND-ONLY — nunca se actualiza ni se borra una fila. Para revocar, se inserta
-- una fila nueva con `granted = false`; la fila más reciente por (owner_id, consent_type) es la
-- que manda. Así queda el historial completo, no solo el estado actual — exactamente lo que pide
-- el requisito legal ("registro de cuándo y cómo se otorgó o revocó cada uno").

create type public.consent_type as enum ('recordatorios_servicio', 'comunicaciones_comerciales');

create table public.owner_consents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  consent_type public.consent_type not null,
  granted boolean not null,
  -- Cómo se otorgó/revocó (pedido explícito: "registro de cuándo y cómo") — 'registro' = al
  -- crear la cuenta, 'panel' = cambiado a mano después desde su configuración de privacidad.
  method text not null default 'panel' check (method in ('registro', 'panel')),
  created_at timestamptz not null default now()
);

create index owner_consents_owner_id_idx on public.owner_consents(owner_id);
-- Para el patrón de consulta real: "la fila más reciente de este owner+tipo".
create index owner_consents_lookup_idx on public.owner_consents(owner_id, consent_type, created_at desc);

alter table public.owner_consents enable row level security;

create policy "owner_consents_owner_read" on public.owner_consents
  for select using (owner_id = auth.uid() or public.is_admin());

create policy "owner_consents_owner_insert" on public.owner_consents
  for insert with check (owner_id = auth.uid());

-- Sin policy de UPDATE/DELETE a propósito — es append-only, ni el propio dueño puede editar o
-- borrar una fila de consentimiento ya registrada, solo agregar una nueva que la reemplace en
-- vigencia.

-- `security definer` para que se pueda llamar desde cualquier policy/función que necesite saber
-- "¿este cuidador tiene tal consentimiento vigente?" sin duplicar la subconsulta en cada lugar.
--
-- El `coalesce` final es la regla legal en código: sin ninguna fila todavía,
-- 'recordatorios_servicio' se asume otorgado (continuidad de un servicio ya contratado, no exige
-- autorización previa expresa) — 'comunicaciones_comerciales' NUNCA se asume, sin fila es `false`
-- (opt-in puro, exige autorización previa y expresa).
create or replace function public.has_active_consent(check_owner_id uuid, check_type public.consent_type)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (
      select granted from public.owner_consents
      where owner_id = check_owner_id and consent_type = check_type
      order by created_at desc
      limit 1
    ),
    check_type = 'recordatorios_servicio'
  );
$$;
