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

/** Corrige una mascota ya registrada (pedido explícito: "si la agregué mal, editar su contenido"). */
export async function updatePet(petId: string, values: PetFormValues): Promise<PetActionResult> {
  const user = await getCurrentUser();
  if (!user || user.profile.role !== 'propietario') return { ok: false, error: 'No autorizado.' };

  const parsed = petSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('pets')
    .update({
      name: parsed.data.name,
      species: parsed.data.species,
      breed: parsed.data.breed || null,
      sex: parsed.data.sex,
      birth_date: parsed.data.birth_date || null,
      sterilized: parsed.data.sterilized,
      vaccinated: parsed.data.vaccinated,
      notes: parsed.data.notes || null,
    })
    .eq('id', petId)
    .eq('owner_id', user.profile.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/cuidador/mascotas');
  revalidatePath(`/cuidador/mascotas/${petId}`);
  return { ok: true, id: petId };
}

/**
 * Elimina una mascota completa. `preventive_events`/`pet_documents`/`ai_conversations`/
 * `vet_visit_notes` se borran en cascada solos (`on delete cascade`, ver sus migraciones); si algún
 * establecimiento la tiene vinculada como paciente de su historia clínica
 * (`clinical_patients.pet_id`), esa vinculación quedaría en null en vez de borrarse — pero
 * `clinical_patients` exige tener `pet_id` O `owner_full_name` (0016_clinical_records.sql), así
 * que si nunca se guardó un `owner_full_name` (el caso normal cuando sí hay pet_id), el `DELETE`
 * rompería esa restricción a mitad de camino. Se revisa antes de intentarlo, en vez de dejar que
 * el error crudo de la base de datos llegue sin explicación.
 */
export async function deletePet(petId: string): Promise<PetActionResult> {
  const user = await getCurrentUser();
  if (!user || user.profile.role !== 'propietario') return { ok: false, error: 'No autorizado.' };

  const supabase = await createSupabaseServerClient();

  const { data: linkedPatient } = await supabase
    .from('clinical_patients')
    .select('id')
    .eq('pet_id', petId)
    .maybeSingle();
  if (linkedPatient) {
    return {
      ok: false,
      error:
        'Esta mascota tiene una historia clínica en un establecimiento veterinario y no se puede eliminar todavía. Pídele al establecimiento que la desvincule primero.',
    };
  }

  const { error } = await supabase.from('pets').delete().eq('id', petId).eq('owner_id', user.profile.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/cuidador/mascotas');
  return { ok: true };
}
