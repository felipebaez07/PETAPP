-- PetApp — Foro/muro de anuncios: promociones, anuncios, noticias y lugares.
-- Solo los aliados (establecimiento/fundación) publican; se ve al instante,
-- sin cola de aprobación — el admin puede ocultar/borrar después si hace
-- falta, igual que el resto del piloto confía en cuentas ya autenticadas.
-- Las publicaciones de adopción NO se tocan — siguen siendo su propio flujo.

create type public.forum_post_category as enum ('promocion', 'anuncio', 'noticia', 'lugar');

create table public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  category public.forum_post_category not null default 'anuncio',
  title text not null,
  body text not null,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index forum_posts_establishment_id_idx on public.forum_posts(establishment_id);
create index forum_posts_category_idx on public.forum_posts(category);

create trigger forum_posts_set_updated_at
  before update on public.forum_posts
  for each row execute function public.set_updated_at();

alter table public.forum_posts enable row level security;

create policy "forum_posts_public_read" on public.forum_posts
  for select using (
    (
      is_active = true
      and exists (select 1 from public.establishments e where e.id = establishment_id and e.is_active = true)
    )
    or exists (select 1 from public.establishments e where e.id = establishment_id and e.owner_id = auth.uid())
    or public.is_admin()
  );

create policy "forum_posts_owner_write" on public.forum_posts
  for all using (
    exists (select 1 from public.establishments e where e.id = establishment_id and e.owner_id = auth.uid())
    or public.is_admin()
  )
  with check (
    exists (select 1 from public.establishments e where e.id = establishment_id and e.owner_id = auth.uid())
    or public.is_admin()
  );
