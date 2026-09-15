'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { clinicalPatientSchema, type PetSex, type PetSpecies } from '@petapp/shared';

export interface PetSearchResult {
  id: string;
  name: string;
  species: PetSpecies;
  breed: string | null;
  sex: PetSex;
  birth_date: string | null;
  sterilized: boolean;
  notes: string | null;
  owner_name: string | null;
}

interface PetSearchRow {
  id: string;
  name: string;
  species: PetSpecies;
  breed: string | null;
  sex: PetSex;
  birth_date: string | null;
  sterilized: boolean;
  notes: string | null;
  owner: { full_name: string } | null;
}

const PET_SEARCH_COLUMNS = 'id, name, species, breed, sex, birth_date, sterilized, notes, owner:profiles(full_name)';
// `!inner` en vez del embed normal: sin esto, filtrar por `owner.full_name` no restringe las
// filas de `pets` que vuelven (PostgREST solo filtraría el contenido embebido, no la fila base),
// así que la búsqueda "por dueño" devolvería todas las mascotas en vez de solo las que calzan.
const PET_SEARCH_COLUMNS_OWNER_JOIN =
  'id, name, species, breed, sex, birth_date, sterilized, notes, owner:profiles!inner(full_name)';

function toResult(pet: PetSearchRow): PetSearchResult {
  return {
    id: pet.id,
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    sex: pet.sex,
    birth_date: pet.birth_date,
    sterilized: pet.sterilized,
    notes: pet.notes,
    owner_name: pet.owner?.full_name ?? null,
  };
}

/**
 * Busca mascotas ya registradas en la plataforma, para el modo "vincular mascota ya registrada"
 * de ClinicalPatientForm. Busca tanto por nombre de la mascota como por nombre del dueño — un
 * mismo nombre de mascota ("Roco", "Max") se repite muchísimo entre pacientes distintos, mientras
 * que un dueño tiene pocas mascotas, así que buscar por dueño encuentra el paciente correcto más
 * rápido (pedido explícito del usuario, 2026-09-15). Son dos consultas separadas en vez de un
 * `.or()` porque el filtro por nombre del dueño cae en la tabla `profiles` unida (`owner`), y
 * PostgREST no soporta esa combinación en un solo `.or()` de forma confiable — se corren en
 * paralelo y se combinan acá, dedupe por id.
 *
 * La RLS de `pets` ya restringe lo que un establecimiento puede ver a las mascotas con las que
 * tiene una relación (vía `service_requests`) — no hace falta (ni se puede: `pets` no tiene
 * `establishment_id`) filtrar por establecimiento acá.
 */
export async function searchPets(query: string): Promise<PetSearchResult[]> {
  const user = await getCurrentUser();
  if (!user?.establishment) return [];

  const q = query.trim();
  if (!q) return [];

  const supabase = await createSupabaseServerClient();
  const [byName, byOwner] = await Promise.all([
    supabase.from('pets').select(PET_SEARCH_COLUMNS).ilike('name', `%${q}%`).limit(10),
    supabase
      .from('pets')
      .select(PET_SEARCH_COLUMNS_OWNER_JOIN)
      .ilike('owner.full_name', `%${q}%`)
      .limit(10),
  ]);

  const rows = [...(byName.data ?? []), ...(byOwner.data ?? [])] as unknown as PetSearchRow[];
  const seen = new Map<string, PetSearchResult>();
  for (const pet of rows) {
    if (!seen.has(pet.id)) seen.set(pet.id, toResult(pet));
  }
  return [...seen.values()].slice(0, 10);
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
