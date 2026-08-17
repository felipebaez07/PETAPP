export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Mientras el proyecto Supabase real no esté provisionado (ver docs/NEXT_STEPS.md),
 * la app funciona en "modo demo": la capa de datos (src/lib/data.ts) sirve los
 * fixtures de @petapp/shared en lugar de consultar la base de datos real.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}
