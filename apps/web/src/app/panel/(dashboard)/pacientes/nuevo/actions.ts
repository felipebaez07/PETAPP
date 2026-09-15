'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { clinicalPatientSchema, type PetSpecies } from '@petapp/shared';

export interface PetSearchResult {
  id: string;
  name: string;
  species: PetSpecies;
  breed: string | null;
  owner_name: string | null;
}

interface PetSearchRow {
  id: string;
  name: string;
  species: PetSpecies;
  breed: string | null;
  owner: { full_name: string } | null;
}

/**
 * Busca mascotas ya registradas en la plataforma por nombre, para el modo "vincular mascota ya
 * registrada" de ClinicalPatientForm. La RLS de `pets` ya restringe lo que un establecimiento
 * puede ver a las mascotas con las que tiene una relación (vía `service_requests`) — no hace
 * falta (ni se puede: `pets` no tiene `establishment_id`) filtrar por establecimiento acá.
 */
export async function searchPets(query: string): Promise<PetSearchResult[]> {
  const user = await getCurrentUser();
  if (!user?.establishment) return [];

  const q = query.trim();
  if (!q) return [];

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('pets')
    .select('id, name, species, breed, owner:profiles(full_name)')
    .ilike('name', `%${q}%`)
    .limit(10);

  return ((data ?? []) as unknown as PetSearchRow[]).map((pet) => ({
    id: pet.id,
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    owner_name: pet.owner?.full_name ?? null,
  }));
}

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim();
}

/**
 * Crea la ficha de un paciente nuevo (vinculado a una mascota real o walk-in). Recibe
 * `FormData` directo desde `<form action={createClinicalPatient}>`, mismo patrón que el resto
 * de las acciones simples de este panel (ver `servicios/actions.ts`). `ClinicalPatientForm` ya
 * valida esto mismo del lado del cliente con `clinicalPatientSchema` antes de dejar que el
 * formulario se envíe — la validación de acá es defensa en profundidad, no el único lugar donde
 * se detectan errores.
 */
export async function createClinicalPatient(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user?.establishment) return;

  const petId = str(formData, 'pet_id');
  const estimatedAgeRaw = str(formData, 'estimated_age_years');

  const raw = {
    pet_id: petId || undefined,
    owner_full_name: str(formData, 'owner_full_name'),
    owner_phone: str(formData, 'owner_phone'),
    owner_document: str(formData, 'owner_document'),
    name: str(formData, 'name'),
    species: str(formData, 'species'),
    breed: str(formData, 'breed'),
    sex: str(formData, 'sex'),
    birth_date: str(formData, 'birth_date'),
    estimated_age_years: estimatedAgeRaw ? Number(estimatedAgeRaw) : undefined,
    color: str(formData, 'color'),
    origin_place: str(formData, 'origin_place'),
    microchip_number: str(formData, 'microchip_number'),
    sterilized: formData.get('sterilized') === 'on',
    allergies: str(formData, 'allergies'),
    chronic_conditions: str(formData, 'chronic_conditions'),
    notes: str(formData, 'notes'),
  };

  const parsed = clinicalPatientSchema.safeParse(raw);
  if (!parsed.success) return;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('clinical_patients')
    .insert({
      establishment_id: user.establishment.id,
      pet_id: parsed.data.pet_id || null,
      owner_full_name: parsed.data.owner_full_name || null,
      owner_phone: parsed.data.owner_phone || null,
      owner_document: parsed.data.owner_document || null,
      name: parsed.data.name,
      species: parsed.data.species,
      breed: parsed.data.breed || null,
      sex: parsed.data.sex,
      birth_date: parsed.data.birth_date || null,
      estimated_age_years: parsed.data.estimated_age_years ?? null,
      color: parsed.data.color || null,
      origin_place: parsed.data.origin_place || null,
      microchip_number: parsed.data.microchip_number || null,
      sterilized: parsed.data.sterilized,
      allergies: parsed.data.allergies || null,
      chronic_conditions: parsed.data.chronic_conditions || null,
      notes: parsed.data.notes || null,
    })
    .select('id')
    .single();

  if (error || !data) return;

  revalidatePath('/panel/pacientes');
  redirect(`/panel/pacientes/${data.id}`);
}
