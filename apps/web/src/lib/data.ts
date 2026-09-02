import 'server-only';
import {
  DEMO_ESTABLISHMENTS,
  type EstablishmentWithDetails,
  type ProviderCategory,
} from '@petapp/shared';
import { isSupabaseConfigured } from './supabase/config';
import { createSupabaseServerClient } from './supabase/server';

export interface DirectoryFilters {
  category?: ProviderCategory;
  onlyOpen24h?: boolean;
  search?: string;
}

/**
 * Capa de datos del directorio de prestadores. Mientras no exista un proyecto Supabase
 * real conectado (ver docs/NEXT_STEPS.md), sirve los fixtures de @petapp/shared para que
 * la app sea completamente navegable hoy. El día que se conecten las env vars de Supabase,
 * esta función empieza a consultar la base real sin que ninguna página tenga que cambiar.
 *
 * Alcance nuevo del pivot (spec.md sección 5): el directorio público solo muestra
 * prestadores veterinarios verificables (`category in ('veterinaria','profesional')`) y
 * activos — comercio/fundación quedaron fuera del alcance del piloto.
 */
export async function getEstablishments(filters: DirectoryFilters = {}): Promise<EstablishmentWithDetails[]> {
  let results: EstablishmentWithDetails[];

  if (!isSupabaseConfigured()) {
    results = DEMO_ESTABLISHMENTS;
  } else {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('establishments')
      .select('*, hours:establishment_hours(*), services(*)')
      .eq('is_active', true)
      .in('category', ['veterinaria', 'profesional'])
      .order('name');
    if (error) throw error;
    results = (data ?? []) as unknown as EstablishmentWithDetails[];
  }

  return results.filter((e) => {
    if (e.category !== 'veterinaria' && e.category !== 'profesional') return false;
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
    const found = DEMO_ESTABLISHMENTS.find((e) => e.slug === slug) ?? null;
    if (!found || (found.category !== 'veterinaria' && found.category !== 'profesional')) return null;
    return found;
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('establishments')
    .select('*, hours:establishment_hours(*), services(*)')
    .eq('slug', slug)
    .eq('is_active', true)
    .in('category', ['veterinaria', 'profesional'])
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as EstablishmentWithDetails) ?? null;
}
