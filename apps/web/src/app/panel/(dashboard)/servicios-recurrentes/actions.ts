'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { establishmentServiceIntervalSchema } from '@petapp/shared';

/**
 * Sugerencias de intervalo del prestador Pro (0025_recurring_services.sql, regla 2). Mismo
 * convenio `Promise<void>` + `<form action={...}>` de `servicios/actions.ts` — el establecimiento
 * ya usa este patrón para su CRUD más parecido.
 *
 * El re-chequeo de `isEstablishmentOwner && isPro` de acá es el gate real: la pantalla
 * (`page.tsx`) ya oculta el formulario cuando no es Pro, pero eso es solo para que no se pueda ni
 * intentar — quien de verdad protege la escritura es esto + la policy
 * `establishment_service_intervals_pro_owner_write` de la base (que revisa
 * `establishment_has_active_pro` de nuevo, del lado de la base de datos).
 */
export async function createServiceInterval(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user?.establishment || !user.isEstablishmentOwner || !user.isPro) return;

  const petSizeRaw = String(formData.get('pet_size') ?? '').trim();
  const coatTypeRaw = String(formData.get('coat_type') ?? '').trim();

  const parsed = establishmentServiceIntervalSchema.safeParse({
    service_type: String(formData.get('service_type') ?? '').trim(),
    interval_weeks: String(formData.get('interval_weeks') ?? '').trim(),
    pet_size: petSizeRaw || undefined,
    coat_type: coatTypeRaw || undefined,
  });
  if (!parsed.success) return;

  const supabase = await createSupabaseServerClient();
  await supabase.from('establishment_service_intervals').insert({
    establishment_id: user.establishment.id,
    service_type: parsed.data.service_type,
    interval_weeks: parsed.data.interval_weeks,
    pet_size: parsed.data.pet_size ?? null,
    coat_type: parsed.data.coat_type || null,
  });

  revalidatePath('/panel/servicios-recurrentes');
}

export async function deleteServiceInterval(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user?.establishment || !user.isEstablishmentOwner || !user.isPro) return;

  const id = String(formData.get('id') ?? '');
  if (!id) return;

  const supabase = await createSupabaseServerClient();
  await supabase
    .from('establishment_service_intervals')
    .delete()
    .eq('id', id)
    .eq('establishment_id', user.establishment.id);

  revalidatePath('/panel/servicios-recurrentes');
}
