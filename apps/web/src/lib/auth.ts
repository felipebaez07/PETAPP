import 'server-only';
import type { Profile, Establishment } from '@petapp/shared';
import { isSupabaseConfigured } from './supabase/config';
import { createSupabaseServerClient } from './supabase/server';

export interface CurrentUser {
  profile: Profile;
  establishment: Establishment | null;
  /**
   * `true` si `establishment` es el que esta persona es dueña; `false` si lo ve porque es
   * personal del establecimiento (`establishment_staff`, 0018_establishment_staff.sql) de otro
   * dueño. El personal tiene acceso operativo (pacientes, consultas, agenda) pero las pantallas
   * de configuración del negocio (perfil, horarios, servicios, plan) deben seguir revisando esto
   * y ocultarse/bloquearse para quien no es dueño.
   */
  isEstablishmentOwner: boolean;
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
  let isEstablishmentOwner = false;

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
    if (data?.[0]) {
      establishment = data[0];
      isEstablishmentOwner = true;
    }
  }

  // No es dueño de ningún establecimiento (o su cuenta ni siquiera tiene role='establecimiento' —
  // el personal contratado puede seguir siendo una cuenta 'propietario' normal): revisa si es
  // personal activo de alguno.
  if (!establishment) {
    const { data } = await supabase
      .from('establishment_staff')
      .select('establishment:establishments(*)')
      .eq('profile_id', authData.user.id)
      .eq('status', 'activo')
      .limit(1);
    const staffEstablishment = (data?.[0] as { establishment: Establishment } | undefined)?.establishment;
    if (staffEstablishment) {
      establishment = staffEstablishment;
      isEstablishmentOwner = false;
    }
  }

  return { profile: profile as Profile, establishment, isEstablishmentOwner };
}
