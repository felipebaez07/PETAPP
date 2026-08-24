import 'server-only';
import type { Profile, Establishment } from '@petapp/shared';
import { isSupabaseConfigured } from './supabase/config';
import { createSupabaseServerClient } from './supabase/server';

export interface CurrentUser {
  profile: Profile;
  establishment: Establishment | null;
}

/** Devuelve null si no hay backend conectado o no hay sesión activa. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return null;

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', authData.user.id).maybeSingle();
  if (!profile) return null;

  let establishment: Establishment | null = null;
  if (profile.role === 'establecimiento') {
    // .limit(1) en vez de .maybeSingle(): si por error administrativo owner_id
    // quedara vinculado a más de una fila, .maybeSingle() lanzaría un error que
    // esta función ignoraba en silencio, mostrando "sin establecimiento" en vez
    // del real. Con .limit(1) siempre se obtiene una fila determinística.
    const { data } = await supabase
      .from('establishments')
      .select('*')
      .eq('owner_id', authData.user.id)
      .limit(1);
    establishment = data?.[0] ?? null;
  }

  return { profile: profile as Profile, establishment };
}
