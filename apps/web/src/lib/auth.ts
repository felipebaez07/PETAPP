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
    const { data } = await supabase
      .from('establishments')
      .select('*')
      .eq('owner_id', authData.user.id)
      .maybeSingle();
    establishment = data ?? null;
  }

  return { profile: profile as Profile, establishment };
}
