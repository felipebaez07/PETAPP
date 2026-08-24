import {
  DEMO_ADOPTION_POSTS,
  DEMO_ESTABLISHMENTS,
  DEMO_PRODUCTS,
  DEMO_FORUM_POSTS,
  type AdoptionPostWithPhotos,
  type EstablishmentWithDetails,
  type ProductWithEstablishment,
  type ForumPostWithEstablishment,
} from '@petapp/shared';
import { isSupabaseConfigured, supabase } from './supabase';

/**
 * Capa de datos de la app móvil. Mientras no exista un proyecto Supabase real
 * conectado (`isSupabaseConfigured`), sirve los fixtures de demo de
 * `@petapp/shared`; en cuanto está configurado, consulta la base real —
 * ninguna pantalla que consuma estas funciones necesita cambiar.
 */

export async function fetchEstablishments(): Promise<EstablishmentWithDetails[]> {
  if (!isSupabaseConfigured) return DEMO_ESTABLISHMENTS;

  const { data, error } = await supabase
    .from('establishments')
    .select('*, hours:establishment_hours(*), services(*), products(*)')
    .eq('is_active', true)
    .order('name');
  if (error) throw error;
  return (data ?? []) as unknown as EstablishmentWithDetails[];
}

export async function fetchEstablishmentById(
  id: string
): Promise<EstablishmentWithDetails | null> {
  if (!isSupabaseConfigured) {
    return DEMO_ESTABLISHMENTS.find((establishment) => establishment.id === id) ?? null;
  }

  const { data, error } = await supabase
    .from('establishments')
    .select('*, hours:establishment_hours(*), services(*), products(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as EstablishmentWithDetails) ?? null;
}

export async function fetchAdoptionPosts(): Promise<AdoptionPostWithPhotos[]> {
  if (!isSupabaseConfigured) return DEMO_ADOPTION_POSTS;

  const { data, error } = await supabase
    .from('adoption_posts')
    .select('*, photos:adoption_photos(*), establishment:establishments(id,name,slug,whatsapp_number)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as AdoptionPostWithPhotos[];
}

export async function fetchAdoptionPostById(id: string): Promise<AdoptionPostWithPhotos | null> {
  if (!isSupabaseConfigured) {
    return DEMO_ADOPTION_POSTS.find((post) => post.id === id) ?? null;
  }

  const { data, error } = await supabase
    .from('adoption_posts')
    .select('*, photos:adoption_photos(*), establishment:establishments(id,name,slug,whatsapp_number)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as AdoptionPostWithPhotos) ?? null;
}

export async function fetchProducts(): Promise<ProductWithEstablishment[]> {
  if (!isSupabaseConfigured) {
    return DEMO_PRODUCTS.map((product) => {
      const establishment = DEMO_ESTABLISHMENTS.find((e) => e.id === product.establishment_id);
      return {
        ...product,
        establishment: establishment
          ? {
              id: establishment.id,
              name: establishment.name,
              slug: establishment.slug,
              whatsapp_number: establishment.whatsapp_number,
              category: establishment.category,
            }
          : null,
      };
    });
  }

  const { data, error } = await supabase
    .from('products')
    .select('*, establishment:establishments(id,name,slug,whatsapp_number,category)')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ProductWithEstablishment[];
}

export async function fetchForumPosts(): Promise<ForumPostWithEstablishment[]> {
  if (!isSupabaseConfigured) {
    return DEMO_FORUM_POSTS.map((post) => {
      const establishment = DEMO_ESTABLISHMENTS.find((e) => e.id === post.establishment_id);
      return {
        ...post,
        establishment: establishment
          ? { id: establishment.id, name: establishment.name, slug: establishment.slug, category: establishment.category }
          : null,
      };
    });
  }

  const { data, error } = await supabase
    .from('forum_posts')
    .select('*, establishment:establishments(id,name,slug,category)')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ForumPostWithEstablishment[];
}
