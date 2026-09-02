'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { ServiceRequestStatus } from '@petapp/shared';

export async function updateServiceRequestStatus(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user?.establishment) return;

  const id = String(formData.get('id') ?? '');
  const status = formData.get('status') as ServiceRequestStatus | null;
  if (!id || !status) return;

  const supabase = await createSupabaseServerClient();
  await supabase
    .from('service_requests')
    .update({ status })
    .eq('id', id)
    .eq('establishment_id', user.establishment.id);

  revalidatePath('/panel/solicitudes');
}
