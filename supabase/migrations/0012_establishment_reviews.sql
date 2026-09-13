-- PETAPP — Reseñas y calificaciones de establecimientos (idea 3.1 del banco de ideas de
-- funcionalidades). Con 27 aliados cargados y solo 2 verificados, la única señal de calidad que
-- hoy tiene el directorio es el badge "Verificado" — con la mayoría de aliados todavía sin
-- verificar, una reseña de otro cuidador que sí tuvo una cita real pesa más para decidir a quién
-- llamar. Solo puede calificar quien tuvo una `service_request` en estado `completada` con ese
-- establecimiento (chequeado en la policy de INSERT) — evita reseñas de alguien que nunca fue.
--
-- Una reseña por (cuidador, establecimiento): si el cuidador vuelve a tener otra cita completada
-- ahí, actualiza su reseña existente en vez de acumular varias — es más simple de mostrar en la
-- ficha pública (una tarjeta por cuidador, no un historial) y evita que alguien insista con la
-- misma cita para subir/bajar el promedio a punta de reseñas repetidas.

create table public.establishment_reviews (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  pet_owner_id uuid not null references public.profiles(id) on delete cascade,
  -- Guarda CUÁL cita completada habilitó la reseña — no se usa para mostrar nada todavía, pero
  -- deja trazabilidad si alguna vez hay que auditar una reseña reportada como falsa.
  service_request_id uuid references public.service_requests(id) on delete set null,
  rating smallint not null check (rating between 1 and 5),
  comment text check (char_length(comment) <= 500),
  -- Copia del nombre del cuidador AL MOMENTO de crear la reseña (ver trigger de abajo) — NO un
  -- join en vivo a `profiles`. `profiles_select_own_or_admin` (0001_init.sql) solo deja leer la
  -- propia fila o a un admin, así que un `select(*, profiles(full_name))` público devolvería
  -- `null` para el nombre de cualquier otro cuidador. Guardarlo acá evita tener que abrirle
  -- lectura pública a `profiles` (que también expondría teléfono) solo para mostrar un nombre.
  reviewer_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (establishment_id, pet_owner_id)
);

create index establishment_reviews_establishment_id_idx on public.establishment_reviews (establishment_id);

create trigger establishment_reviews_set_updated_at
  before update on public.establishment_reviews
  for each row execute function public.set_updated_at();

-- Rellena `reviewer_name` server-side en cada INSERT — así queda bien aunque el código de la app
-- se olvide de mandarlo, y sin necesidad de abrirle lectura pública a `profiles` (ver comentario
-- de la columna arriba). `security definer` para poder leer `profiles` sin pasar por su RLS.
create or replace function public.set_review_reviewer_name()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select full_name into new.reviewer_name from public.profiles where id = new.pet_owner_id;
  return new;
end;
$$;

create trigger establishment_reviews_set_reviewer_name
  before insert on public.establishment_reviews
  for each row execute function public.set_review_reviewer_name();

alter table public.establishment_reviews enable row level security;

-- Lectura pública sin sesión: son la señal de confianza de la ficha del directorio, tienen que
-- verse igual que las horas o los servicios (mismo criterio que `establishments_public_read_active`
-- en 0001_init.sql, pero sin el filtro de `is_active` porque una reseña no tiene ese concepto).
create policy "establishment_reviews_public_read" on public.establishment_reviews
  for select using (true);

-- Mismo patrón que `pet_belongs_to_user` (0008_fix_service_requests_pet_ownership_recursion.sql):
-- una función `security definer` para el chequeo de elegibilidad, en vez de una subconsulta directa
-- a `service_requests` dentro de la policy de esta tabla — evita depender de que la RLS de
-- `service_requests` deje ver esa fila en el mismo momento en que se evalúa esta policy, que es
-- exactamente el tipo de ciclo que ya rompió `0008` una vez.
create or replace function public.has_completed_service_request(check_owner_id uuid, check_establishment_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.service_requests
    where pet_owner_id = check_owner_id
      and establishment_id = check_establishment_id
      and status = 'completada'
  );
$$;

create policy "establishment_reviews_owner_insert" on public.establishment_reviews
  for insert with check (
    pet_owner_id = auth.uid()
    and public.has_completed_service_request(auth.uid(), establishment_id)
  );

-- Update (no re-chequea elegibilidad: si ya la tenía al crearla, sigue siendo su reseña de
-- siempre aunque el estado de esa cita cambiara después) y delete (dueño o admin, para moderar
-- una reseña reportada como abusiva/falsa — mismo criterio que ya usan otras tablas con
-- `public.is_admin()`).
create policy "establishment_reviews_owner_update" on public.establishment_reviews
  for update using (pet_owner_id = auth.uid());

create policy "establishment_reviews_owner_or_admin_delete" on public.establishment_reviews
  for delete using (pet_owner_id = auth.uid() or public.is_admin());
