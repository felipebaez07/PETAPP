-- PETAPP — Modelo de datos de "Jornadas y campañas" (spec formal del usuario, 2026-09-17).
-- Solo el modelo — el motor que arma el público objetivo y manda las campañas es lógica de
-- servidor (Paso 5 del orden acordado), no vive en esta migración.
--
-- El público objetivo NO se materializa en una tabla de destinatarios: se calcula en la propia
-- consulta cada vez que se envía (pedido explícito, regla 2: "aplicada en la consulta de datos, no
-- solo en la interfaz") — cruzando quién ya es paciente de este establecimiento, el consentimiento
-- comercial vigente (`has_active_consent`, 0024) y los filtros permitidos. Esta migración solo d
-- deja las columnas para esos filtros (regla 3) y la tabla de REGISTRO de a quién se le mandó
-- (`campaign_sends`, para las métricas de la regla 6) — no una lista de a quién SE LE VA a mandar.

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  title text not null,
  description text,
  service_type public.preventive_event_type,
  starts_on date,
  ends_on date,
  max_capacity integer check (max_capacity is null or max_capacity > 0),

  -- Filtros de segmentación permitidos (regla 3) — deliberadamente NO hay ninguna columna de
  -- ubicación exacta del cuidador, el propio requisito lo prohíbe. "Vencimiento próximo de un
  -- servicio" y "última visita" no son columnas acá: se calculan contra `preventive_events` y
  -- `service_requests` en el momento de armar el público objetivo, no se guardan de antemano.
  species_filter public.pet_species,
  pet_size_filter public.pet_size,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index campaigns_establishment_id_idx on public.campaigns(establishment_id);

create trigger campaigns_set_updated_at
  before update on public.campaigns
  for each row execute function public.set_updated_at();

alter table public.campaigns enable row level security;

create policy "campaigns_owner_read" on public.campaigns
  for select using (
    exists (select 1 from public.establishments e where e.id = establishment_id and e.owner_id = auth.uid())
    or public.is_admin()
  );

-- Escritura solo con Pro activo — el tope de "una campaña por prestador por mes calendario"
-- (regla 4) se revisa en la acción del servidor con un `count()` antes del INSERT, no acá: una
-- policy de RLS no es un buen lugar para expresar "cuántas filas ya existen este mes" (subconsulta
-- costosa evaluada en cada intento) y la acción de todas formas necesita ese conteo para poder
-- mostrarle al usuario el mensaje de cuándo se libera.
create policy "campaigns_pro_owner_write" on public.campaigns
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

-- ============================================================================
-- Registro de a quién se le mandó cada campaña — para las métricas de la regla 6 (alcance,
-- apertura, solicitudes generadas). No decide a quién se le manda (eso es la consulta del motor de
-- envío, con el consentimiento y los filtros ya aplicados) — solo dice a quién YA se le mandó.
-- ============================================================================

create table public.campaign_sends (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  pet_owner_id uuid not null references public.profiles(id) on delete cascade,
  sent_at timestamptz not null default now(),
  opened_at timestamptz,
  service_request_id uuid references public.service_requests(id) on delete set null,

  -- No se le manda la misma campaña dos veces al mismo cuidador.
  unique (campaign_id, pet_owner_id)
);

create index campaign_sends_campaign_id_idx on public.campaign_sends(campaign_id);
create index campaign_sends_pet_owner_id_idx on public.campaign_sends(pet_owner_id);
create index campaign_sends_service_request_id_idx on public.campaign_sends(service_request_id);

alter table public.campaign_sends enable row level security;

create policy "campaign_sends_establishment_read" on public.campaign_sends
  for select using (
    exists (
      select 1 from public.campaigns c
      join public.establishments e on e.id = c.establishment_id
      where c.id = campaign_id and e.owner_id = auth.uid()
    )
    or public.is_admin()
  );

-- El propio cuidador puede ver que le llegó una campaña — solo lectura de sus propias filas.
create policy "campaign_sends_owner_read" on public.campaign_sends
  for select using (pet_owner_id = auth.uid());

-- Solo el establecimiento dueño de la campaña (y con Pro activo) puede insertar registros de
-- envío — el motor de envío corre con la sesión del propio dueño del establecimiento.
create policy "campaign_sends_establishment_insert" on public.campaign_sends
  for insert with check (
    exists (
      select 1 from public.campaigns c
      join public.establishments e on e.id = c.establishment_id
      where c.id = campaign_id and e.owner_id = auth.uid() and public.establishment_has_active_pro(c.establishment_id)
    )
  );

-- El establecimiento puede marcar `opened_at`/`service_request_id` (actualizar sus propios
-- envíos), para las métricas de la regla 6.
create policy "campaign_sends_establishment_update" on public.campaign_sends
  for update using (
    exists (
      select 1 from public.campaigns c
      join public.establishments e on e.id = c.establishment_id
      where c.id = campaign_id and e.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.campaigns c
      join public.establishments e on e.id = c.establishment_id
      where c.id = campaign_id and e.owner_id = auth.uid()
    )
  );
