'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export interface DayInput {
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  closed: boolean;
}

export async function updateHours(days: DayInput[], is24h: boolean): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user?.establishment) return { ok: false, error: 'No autorizado.' };

  const supabase = await createSupabaseServerClient();

  // `is_24_7` vive en `establishments`, no en `establishment_hours` — el usuario buscaba este
  // toggle en la página de Horarios (donde tiene más sentido a simple vista) y solo existía en
  // "Perfil del negocio". Se guarda desde acá también, sin duplicar la columna.
  const { error: is24hError } = await supabase
    .from('establishments')
    .update({ is_24_7: is24h })
    .eq('id', user.establishment.id);
  if (is24hError) return { ok: false, error: is24hError.message };

  const rows = days.map((d) => ({
    establishment_id: user.establishment!.id,
    day_of_week: d.day_of_week,
    open_time: d.closed ? null : d.open_time,
    close_time: d.closed ? null : d.close_time,
    closed: d.closed,
  }));

  const { error } = await supabase
    .from('establishment_hours')
    .upsert(rows, { onConflict: 'establishment_id,day_of_week' });

  if (error) return { ok: false, error: error.message };

  revalidatePath('/panel/horarios');
  revalidatePath('/panel/perfil');
  revalidatePath('/directorio');
  revalidatePath(`/directorio/${user.establishment.slug}`);
  return { ok: true };
}
