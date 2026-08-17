import {
  DEMO_ADOPTION_POSTS,
  DEMO_ESTABLISHMENTS,
  type AdoptionPostWithPhotos,
  type EstablishmentWithDetails,
} from '@petapp/shared';

/**
 * Capa de datos de la app móvil.
 *
 * Hoy el proyecto Supabase real todavía no está provisionado (ver PDD /
 * NEXT_STEPS), así que estas funciones devuelven los datos de demostración
 * de `@petapp/shared` (los mismos que alimentan `supabase/seed.sql`). Se
 * exponen como `async` a propósito, para que las pantallas ya consuman esta
 * capa como si fuera una consulta remota (loading/error reales) y el día que
 * se conecte Supabase baste con reemplazar el cuerpo de cada función por un
 * `supabase.from(...)` usando el cliente de `lib/supabase.ts`, sin tocar los
 * componentes que las consumen.
 */

export async function fetchEstablishments(): Promise<EstablishmentWithDetails[]> {
  return DEMO_ESTABLISHMENTS;
}

export async function fetchEstablishmentById(
  id: string
): Promise<EstablishmentWithDetails | null> {
  return DEMO_ESTABLISHMENTS.find((establishment) => establishment.id === id) ?? null;
}

export async function fetchAdoptionPosts(): Promise<AdoptionPostWithPhotos[]> {
  return DEMO_ADOPTION_POSTS;
}

export async function fetchAdoptionPostById(id: string): Promise<AdoptionPostWithPhotos | null> {
  return DEMO_ADOPTION_POSTS.find((post) => post.id === id) ?? null;
}
