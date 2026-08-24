import type { Establishment, Profile } from '@petapp/shared';
import { isSupabaseConfigured, supabase } from './supabase';

export interface CurrentUser {
  profile: Profile;
  establishment: Establishment | null;
}

/** Equivalente móvil de apps/web/src/lib/auth.ts — sin @supabase/ssr, mismo resultado. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!isSupabaseConfigured) return null;

  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .maybeSingle();
  if (!profile) return null;

  let establishment: Establishment | null = null;
  if ((profile as Profile).role === 'establecimiento') {
    const { data } = await supabase
      .from('establishments')
      .select('*')
      .eq('owner_id', (profile as Profile).id)
      .maybeSingle();
    establishment = (data as Establishment | null) ?? null;
  }

  return { profile: profile as Profile, establishment };
}
