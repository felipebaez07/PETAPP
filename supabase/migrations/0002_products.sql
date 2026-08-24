-- PetApp — Fase 1.5: Marketplace de productos (catálogo, sin pasarela de pago).
-- Los aliados publican productos que venden; el comprador consulta por WhatsApp,
-- igual que reservas y adopciones — no hay carrito ni cobro en línea todavía.

create type public.product_category as enum ('alimento', 'accesorios', 'higiene', 'salud', 'otro');

create table public.products (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  name text not null,
  description text,
  category public.product_category not null default 'otro',
  price_reference text, -- texto libre, ej. "desde $30.000" — sin cobro en línea, igual que services.price_reference
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_establishment_id_idx on public.products(establishment_id);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

alter table public.products enable row level security;

create policy "products_public_read" on public.products
  for select using (
    (
      is_active = true
      and exists (select 1 from public.establishments e where e.id = establishment_id and e.is_active = true)
    )
    or exists (select 1 from public.establishments e where e.id = establishment_id and e.owner_id = auth.uid())
    or public.is_admin()
  );

create policy "products_owner_write" on public.products
  for all using (
    exists (select 1 from public.establishments e where e.id = establishment_id and e.owner_id = auth.uid())
    or public.is_admin()
  )
  with check (
    exists (select 1 from public.establishments e where e.id = establishment_id and e.owner_id = auth.uid())
    or public.is_admin()
  );
