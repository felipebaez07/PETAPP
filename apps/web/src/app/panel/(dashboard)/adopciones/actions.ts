'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { adoptionPostSchema, type AdoptionStatus } from '@petapp/shared';

export async function addAdoptionPost(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user?.establishment) return;

  const raw = {
    animal_name: String(formData.get('animal_name') ?? ''),
    species: String(formData.get('species') ?? 'perro'),
    estimated_age: String(formData.get('estimated_age') ?? ''),
    sex: String(formData.get('sex') ?? 'desconocido'),
    sterilized: formData.get('sterilized') === 'on',
    vaccinated: formData.get('vaccinated') === 'on',
    health_notes: String(formData.get('health_notes') ?? ''),
    personality_notes: String(formData.get('personality_notes') ?? ''),
    location_text: String(formData.get('location_text') ?? ''),
  };
  const parsed = adoptionPostSchema.safeParse(raw);
  if (!parsed.success) return;

  const supabase = await createSupabaseServerClient();
  await supabase.from('adoption_posts').insert({
    establishment_id: user.establishment.id,
    posted_by: user.profile.id,
    animal_name: parsed.data.animal_name,
    species: parsed.data.species,
    estimated_age: parsed.data.estimated_age || null,
    sex: parsed.data.sex,
    sterilized: parsed.data.sterilized,
    vaccinated: parsed.data.vaccinated,
    health_notes: parsed.data.health_notes || null,
    personality_notes: parsed.data.personality_notes || null,
    location_text: parsed.data.location_text || null,
  });

  revalidatePath('/panel/adopciones');
  revalidatePath('/adopciones');
}

export async function updateAdoptionStatus(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user?.establishment) return;

  const id = String(formData.get('id') ?? '');
  const status = formData.get('status') as AdoptionStatus | null;
  if (!id || !status) return;

  const supabase = await createSupabaseServerClient();
  await supabase.from('adoption_posts').update({ status }).eq('id', id).eq('establishment_id', user.establishment.id);

  revalidatePath('/panel/adopciones');
  revalidatePath('/adopciones');
}
