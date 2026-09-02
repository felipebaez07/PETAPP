'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { petSchema, type PetFormValues } from '@petapp/shared';

export interface PetActionResult {
  ok: boolean;
  error?: string;
  id?: string;
}

export async function createPet(values: PetFormValues): Promise<PetActionResult> {
  const user = await getCurrentUser();
  if (!user || user.profile.role !== 'propietario') return { ok: false, error: 'No autorizado.' };

  const parsed = petSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('pets')
    .insert({
      owner_id: user.profile.id,
      name: parsed.data.name,
      species: parsed.data.species,
      breed: parsed.data.breed || null,
      sex: parsed.data.sex,
      birth_date: parsed.data.birth_date || null,
      sterilized: parsed.data.sterilized,
      vaccinated: parsed.data.vaccinated,
      notes: parsed.data.notes || null,
    })
    .select('id')
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath('/cuidador/mascotas');
  return { ok: true, id: data.id };
}
