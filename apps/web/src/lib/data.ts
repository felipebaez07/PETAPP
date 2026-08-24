import 'server-only';
import {
  DEMO_ESTABLISHMENTS,
  DEMO_ADOPTION_POSTS,
  DEMO_PRODUCTS,
  DEMO_FORUM_POSTS,
  type EstablishmentWithDetails,
  type AdoptionPostWithPhotos,
  type EstablishmentCategory,
  type ProductWithEstablishment,
  type ProductCategory,
  type ForumPostWithEstablishment,
  type ForumPostCategory,
} from '@petapp/shared';
import { isSupabaseConfigured } from './supabase/config';
import { createSupabaseServerClient } from './supabase/server';

export interface DirectoryFilters {
  category?: EstablishmentCategory;
  onlyOpen24h?: boolean;
  search?: string;
}

/**
 * Capa de datos del directorio. Mientras no exista un proyecto Supabase real
 * conectado (ver docs/NEXT_STEPS.md), sirve los fixtures de @petapp/shared
 * para que la app sea completamente navegable hoy. El día que se conecten
 * las env vars de Supabase, esta función empieza a consultar la base real
 * sin que ninguna página tenga que cambiar.
 */
export async function getEstablishments(filters: DirectoryFilters = {}): Promise<EstablishmentWithDetails[]> {
  let results: EstablishmentWithDetails[];

  if (!isSupabaseConfigured()) {
    results = DEMO_ESTABLISHMENTS;
  } else {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('establishments')
      .select('*, hours:establishment_hours(*), services(*), products(*)')
      .eq('is_active', true)
      .order('name');
    if (error) throw error;
    results = (data ?? []) as unknown as EstablishmentWithDetails[];
  }

  return results.filter((e) => {
    if (filters.category && e.category !== filters.category) return false;
    if (filters.onlyOpen24h && !e.is_24_7) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!e.name.toLowerCase().includes(q) && !(e.description ?? '').toLowerCase().includes(q)) return false;
    }
    return true;
  });
}

export async function getEstablishmentBySlug(slug: string): Promise<EstablishmentWithDetails | null> {
  if (!isSupabaseConfigured()) {
    return DEMO_ESTABLISHMENTS.find((e) => e.slug === slug) ?? null;
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('establishments')
    .select('*, hours:establishment_hours(*), services(*), products(*)')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as EstablishmentWithDetails) ?? null;
}

export interface ProductFilters {
  category?: ProductCategory;
  search?: string;
}

export async function getProducts(filters: ProductFilters = {}): Promise<ProductWithEstablishment[]> {
  let results: ProductWithEstablishment[];

  if (!isSupabaseConfigured()) {
    results = DEMO_PRODUCTS.map((product) => {
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
  } else {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('products')
      .select('*, establishment:establishments(id,name,slug,whatsapp_number,category)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    results = (data ?? []) as unknown as ProductWithEstablishment[];
  }

  return results.filter((p) => {
    if (filters.category && p.category !== filters.category) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !(p.description ?? '').toLowerCase().includes(q)) return false;
    }
    return true;
  });
}

export interface ForumFilters {
  category?: ForumPostCategory;
}

export async function getForumPosts(filters: ForumFilters = {}): Promise<ForumPostWithEstablishment[]> {
  let results: ForumPostWithEstablishment[];

  if (!isSupabaseConfigured()) {
    results = DEMO_FORUM_POSTS.map((post) => {
      const establishment = DEMO_ESTABLISHMENTS.find((e) => e.id === post.establishment_id);
      return {
        ...post,
        establishment: establishment
          ? { id: establishment.id, name: establishment.name, slug: establishment.slug, category: establishment.category }
          : null,
      };
    });
  } else {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('forum_posts')
      .select('*, establishment:establishments(id,name,slug,category)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    results = (data ?? []) as unknown as ForumPostWithEstablishment[];
  }

  return results.filter((p) => !filters.category || p.category === filters.category);
}

export async function getAdoptionPosts(): Promise<AdoptionPostWithPhotos[]> {
  if (!isSupabaseConfigured()) {
    return DEMO_ADOPTION_POSTS;
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('adoption_posts')
    .select('*, photos:adoption_photos(*), establishment:establishments(id,name,slug,whatsapp_number)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as AdoptionPostWithPhotos[];
}

export async function getAdoptionPostById(id: string): Promise<AdoptionPostWithPhotos | null> {
  if (!isSupabaseConfigured()) {
    return DEMO_ADOPTION_POSTS.find((p) => p.id === id) ?? null;
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('adoption_posts')
    .select('*, photos:adoption_photos(*), establishment:establishments(id,name,slug,whatsapp_number)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as AdoptionPostWithPhotos) ?? null;
}
