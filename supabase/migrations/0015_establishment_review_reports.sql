-- PETAPP — Moderación básica de reseñas (idea 5 del banco de recomendaciones, 2026-09-13): hasta
-- ahora no había forma de reportar una reseña abusiva/falsa desde la UI, solo un admin con acceso
-- directo a Supabase podía borrarla.
--
-- Tabla separada (no una columna en establishment_reviews) a propósito: reportar es una acción de
-- CUALQUIER cuidador autenticado sobre la reseña de OTRO — si fuera una columna en
-- establishment_reviews, la policy de UPDATE tendría que abrirse a cualquiera (no solo al dueño de
-- la reseña), y Postgres RLS no puede restringir el UPDATE a una sola columna sin arriesgar que
-- alguien también edite `rating`/`comment` de la reseña ajena. Con una tabla aparte, insertar un
-- reporte no exige ni un permiso de escritura sobre la reseña misma.

create table public.establishment_review_reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.establishment_reviews(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  -- Un cuidador no puede reportar la misma reseña dos veces — evita que un solo usuario infle el
  -- conteo de reportes para forzar el borrado de una reseña que no le gusta.
  unique (review_id, reporter_id)
);

create index establishment_review_reports_review_id_idx on public.establishment_review_reports(review_id);
create index establishment_review_reports_reporter_id_idx on public.establishment_review_reports(reporter_id);

alter table public.establishment_review_reports enable row level security;

create policy "establishment_review_reports_insert_own" on public.establishment_review_reports
  for insert with check (reporter_id = auth.uid());

-- Solo un admin puede ver/gestionar los reportes — un cuidador normal no necesita ver quién
-- reportó qué, solo confirmar que su propio reporte se envió (la respuesta del insert le alcanza).
create policy "establishment_review_reports_admin_read" on public.establishment_review_reports
  for select using (public.is_admin());

create policy "establishment_review_reports_admin_delete" on public.establishment_review_reports
  for delete using (public.is_admin());
