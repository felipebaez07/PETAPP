'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { serviceRequestSchema } from '@petapp/shared';

export interface ServiceRequestActionResult {
  ok: boolean;
  error?: string;
}

/** Crea una solicitud de cita de un cuidador a un prestador (tabla `service_requests`). */
export async function createServiceRequest(formData: FormData): Promise<ServiceRequestActionResult> {
  const user = await getCurrentUser();
  if (!user || user.profile.role !== 'propietario') {
    return { ok: false, error: 'Inicia sesión como cuidador/a para solicitar una cita.' };
  }

  const serviceId = String(formData.get('service_id') ?? '').trim();
  const petId = String(formData.get('pet_id') ?? '').trim();
  const parsed = serviceRequestSchema.safeParse({
    establishment_id: String(formData.get('establishment_id') ?? '').trim(),
    service_id: serviceId || undefined,
    pet_id: petId || undefined,
    notes: String(formData.get('notes') ?? '').trim(),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('service_requests').insert({
    pet_owner_id: user.profile.id,
    establishment_id: parsed.data.establishment_id,
    service_id: parsed.data.service_id || null,
    pet_id: parsed.data.pet_id || null,
    notes: parsed.data.notes || null,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath('/panel/solicitudes');
  return { ok: true };
}
