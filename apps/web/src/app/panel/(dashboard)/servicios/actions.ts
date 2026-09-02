'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function addService(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user?.establishment) return;

  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const price_reference = String(formData.get('price_reference') ?? '').trim();
  if (!name) return;

  const supabase = await createSupabaseServerClient();
  await supabase.from('services').insert({
    establishment_id: user.establishment.id,
    name,
    description: description || null,
    price_reference: price_reference || null,
  });

  revalidatePath('/panel/servicios');
  revalidatePath(`/directorio/${user.establishment.slug}`);
}

export async function deleteService(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user?.establishment) return;

  const id = String(formData.get('id') ?? '');
  if (!id) return;

  const supabase = await createSupabaseServerClient();
  await supabase.from('services').delete().eq('id', id).eq('establishment_id', user.establishment.id);

  revalidatePath('/panel/servicios');
  revalidatePath(`/directorio/${user.establishment.slug}`);
}
