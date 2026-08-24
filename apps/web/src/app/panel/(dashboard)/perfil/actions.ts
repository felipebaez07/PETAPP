'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export interface UpdateProfileResult {
  ok: boolean;
  error?: string;
}

export async function updateEstablishmentProfile(formData: FormData): Promise<UpdateProfileResult> {
  const user = await getCurrentUser();
  if (!user?.establishment) return { ok: false, error: 'No autorizado.' };

  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const address = String(formData.get('address') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();
  const whatsapp_number = String(formData.get('whatsapp_number') ?? '').trim();
  const is_24_7 = formData.get('is_24_7') === 'on';

  if (!name) return { ok: false, error: 'El nombre es obligatorio.' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('establishments')
    .update({
      name,
      description: description || null,
      address: address || null,
      phone: phone || null,
      whatsapp_number: whatsapp_number || null,
      is_24_7,
    })
    .eq('id', user.establishment.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/panel');
  revalidatePath('/');
  revalidatePath(`/establecimientos/${user.establishment.slug}`);
  return { ok: true };
}
