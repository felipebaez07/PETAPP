'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { ReservationStatus } from '@petapp/shared';

export async function updateReservationStatus(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user?.establishment) return;

  const id = String(formData.get('id') ?? '');
  const status = formData.get('status') as ReservationStatus | null;
  if (!id || !status) return;

  const supabase = await createSupabaseServerClient();
  await supabase.from('reservations').update({ status }).eq('id', id).eq('establishment_id', user.establishment.id);

  revalidatePath('/panel/reservas');
}
