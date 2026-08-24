'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { reservationRequestSchema } from '@petapp/shared';

export interface ReservationActionResult {
  ok: boolean;
  error?: string;
}

export async function createReservation(formData: FormData): Promise<ReservationActionResult> {
  const user = await getCurrentUser();
  if (!user || user.profile.role !== 'propietario') {
    return { ok: false, error: 'Inicia sesión como propietario/a de mascota para solicitar una reserva.' };
  }

  const serviceId = String(formData.get('service_id') ?? '').trim();
  const parsed = reservationRequestSchema.safeParse({
    establishment_id: String(formData.get('establishment_id') ?? '').trim(),
    service_id: serviceId || undefined,
    notes: String(formData.get('notes') ?? '').trim(),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('reservations').insert({
    pet_owner_id: user.profile.id,
    establishment_id: parsed.data.establishment_id,
    service_id: parsed.data.service_id || null,
    notes: parsed.data.notes || null,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath('/panel/reservas');
  return { ok: true };
}
