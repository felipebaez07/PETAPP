'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export interface ActionResult {
  ok: boolean;
  error?: string;
}

/**
 * Agrega personal por email (0018_establishment_staff.sql): no hay flujo de invitación a alguien
 * sin cuenta — la persona ya tiene que estar registrada en PeTech. `find_profile_id_by_email` es
 * una función `security definer` porque `profiles` no guarda email (vive en `auth.users`, que
 * PostgREST no expone directo).
 */
export async function addStaff(email: string, role: 'veterinario' | 'auxiliar'): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user?.establishment || !user.isEstablishmentOwner) return { ok: false, error: 'No autorizado.' };

  const trimmedEmail = email.trim();
  if (!trimmedEmail) return { ok: false, error: 'Ingresa un correo.' };

  const supabase = await createSupabaseServerClient();
  const { data: profileId, error: rpcError } = await supabase.rpc('find_profile_id_by_email', {
    lookup_email: trimmedEmail,
  });
  if (rpcError) return { ok: false, error: 'No se pudo buscar esa cuenta. Intenta de nuevo.' };
  if (!profileId) {
    return { ok: false, error: 'No existe ninguna cuenta de PeTech con ese correo — pídele que se registre primero.' };
  }
  if (profileId === user.profile.id) return { ok: false, error: 'Ya eres dueño de este establecimiento.' };

  const { error } = await supabase.from('establishment_staff').insert({
    establishment_id: user.establishment.id,
    profile_id: profileId,
    role,
    added_by: user.profile.id,
  });
  if (error) {
    // 23505 = unique_violation (establishment_id, profile_id) — ya es parte del equipo.
    if (error.code === '23505') return { ok: false, error: 'Esa persona ya es parte de tu equipo.' };
    return { ok: false, error: 'No se pudo agregar. Intenta de nuevo.' };
  }

  revalidatePath('/panel/personal');
  return { ok: true };
}

export async function updateStaffStatus(staffId: string, status: 'activo' | 'inactivo'): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user?.establishment || !user.isEstablishmentOwner) return { ok: false, error: 'No autorizado.' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('establishment_staff')
    .update({ status })
    .eq('id', staffId)
    .eq('establishment_id', user.establishment.id);
  if (error) return { ok: false, error: 'No se pudo actualizar.' };

  revalidatePath('/panel/personal');
  return { ok: true };
}

export async function removeStaff(staffId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user?.establishment || !user.isEstablishmentOwner) return { ok: false, error: 'No autorizado.' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('establishment_staff')
    .delete()
    .eq('id', staffId)
    .eq('establishment_id', user.establishment.id);
  if (error) return { ok: false, error: 'No se pudo quitar.' };

  revalidatePath('/panel/personal');
  return { ok: true };
}
