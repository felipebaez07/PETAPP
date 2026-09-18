import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/config';

/**
 * Auth compartida por TODOS los endpoints del módulo de IA — hoy `/api/ai/prediagnostico` y
 * `/api/ai/transcribir` — que los llaman TANTO la web (con la sesión por cookie de siempre) COMO
 * la app móvil (que no tiene cookies de Next.js, así que manda su token de sesión de Supabase por
 * header `Authorization: Bearer <token>`).
 *
 * Extraído de `api/ai/prediagnostico/route.ts` (antes vivía solo ahí) para no duplicar esta
 * lógica en cada endpoint nuevo que necesite el mismo patrón de auth dual — el comportamiento es
 * exactamente el mismo, esto es un recorte, no un cambio.
 */
export async function getAuthenticatedClient(request: Request): Promise<{
  supabase: SupabaseClient;
  userId: string;
} | null> {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    // Mobile: valida el token con el cliente anon y lo reusa para las consultas siguientes,
    // que quedan autenticadas como ese usuario (RLS aplica normal, no es una service-role key).
    const token = authHeader.slice('Bearer '.length);
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return null;
    return { supabase, userId: data.user.id };
  }

  // Web: la sesión ya viene por cookie.
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { supabase, userId: data.user.id };
}
