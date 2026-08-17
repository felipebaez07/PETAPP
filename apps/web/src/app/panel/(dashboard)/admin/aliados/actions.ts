'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { VerificationStatus } from '@petapp/shared';

export async function updateVerificationStatus(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user || user.profile.role !== 'admin') return;

  const id = String(formData.get('id') ?? '');
  const status = formData.get('status') as VerificationStatus | null;
  if (!id || !status) return;

  const supabase = await createSupabaseServerClient();
  await supabase
    .from('establishments')
    .update({
      verification_status: status,
      verified_at: status === 'verificado' ? new Date().toISOString() : null,
      verified_by: status === 'verificado' ? user.profile.id : null,
    })
    .eq('id', id);

  revalidatePath('/panel/admin/aliados');
  revalidatePath('/');
}
