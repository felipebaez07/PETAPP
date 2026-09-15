'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { clinicalPatientSchema, clinicalRecordSchema } from '@petapp/shared';

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim();
}

function num(formData: FormData, key: string): number | undefined {
  const raw = str(formData, key);
  return raw ? Number(raw) : undefined;
}

/**
 * Agrega una consulta (formato SOAP) a un paciente ya existente. Recibe `FormData` directo desde
 * `<form action={addClinicalRecord}>`, mismo patrón simple que el resto de acciones de este
 * panel (ver `servicios/actions.ts`) — a diferencia de `createClinicalPatient`, este formulario
 * no tiene un modo "vincular/nuevo" que pedir validar en el cliente antes de enviar, así que no
 * hace falta esa capa extra: si algo no pasa el schema, la acción simplemente no inserta nada
 * (igual criterio que `addService`).
 */
export async function addClinicalRecord(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user?.establishment) return;

  const clinicalPatientId = str(formData, 'clinical_patient_id');
  if (!clinicalPatientId) return;

  // Confirma que el paciente le pertenece a este establecimiento antes de insertar la consulta
  // — la RLS de `clinical_records` (0016_clinical_records.sql) ya lo exige del lado de la base
  // de datos, esto es defensa en profundidad.
  const supabase = await createSupabaseServerClient();
  const { data: patient } = await supabase
    .from('clinical_patients')
    .select('id')
    .eq('id', clinicalPatientId)
    .eq('establishment_id', user.establishment.id)
    .maybeSingle();
  if (!patient) return;

  const raw = {
    visit_date: str(formData, 'visit_date'),
    record_type: str(formData, 'record_type') || undefined,
    reason: str(formData, 'reason'),
    subjective: str(formData, 'subjective'),
    weight_kg: num(formData, 'weight_kg'),
    temperature_c: num(formData, 'temperature_c'),
    heart_rate_bpm: num(formData, 'heart_rate_bpm'),
    respiratory_rate_bpm: num(formData, 'respiratory_rate_bpm'),
    body_condition_score: num(formData, 'body_condition_score'),
    physical_exam_notes: str(formData, 'physical_exam_notes'),
    diagnosis: str(formData, 'diagnosis'),
    treatment_plan: str(formData, 'treatment_plan'),
    medications: str(formData, 'medications'),
    vaccines_applied: str(formData, 'vaccines_applied'),
    follow_up_date: str(formData, 'follow_up_date'),
  };

  const parsed = clinicalRecordSchema.safeParse(raw);
  if (!parsed.success) return;

  const { error } = await supabase.from('clinical_records').insert({
    clinical_patient_id: clinicalPatientId,
    establishment_id: user.establishment.id,
    visit_date: parsed.data.visit_date,
    record_type: parsed.data.record_type,
    reason: parsed.data.reason,
    subjective: parsed.data.subjective || null,
    weight_kg: parsed.data.weight_kg ?? null,
    temperature_c: parsed.data.temperature_c ?? null,
    heart_rate_bpm: parsed.data.heart_rate_bpm ?? null,
    respiratory_rate_bpm: parsed.data.respiratory_rate_bpm ?? null,
    body_condition_score: parsed.data.body_condition_score ?? null,
    physical_exam_notes: parsed.data.physical_exam_notes || null,
    diagnosis: parsed.data.diagnosis || null,
    treatment_plan: parsed.data.treatment_plan || null,
    medications: parsed.data.medications || null,
    vaccines_applied: parsed.data.vaccines_applied || null,
    follow_up_date: parsed.data.follow_up_date || null,
  });
  if (error) return;

  revalidatePath(`/panel/pacientes/${clinicalPatientId}`);
}

/**
 * Corrige la ficha de un paciente ya creado (pedido explícito del usuario: "que lo digite mal
 * algún dato" — un typo en la primera carga no debería quedar pegado para siempre). No permite
 * cambiar `pet_id` (vincular/desvincular una mascota es una operación distinta, fuera de alcance
 * acá) — se reusa `clinicalPatientSchema` completando `pet_id`/`owner_full_name` con lo que el
 * paciente ya tenía, para que el `.refine` de "pet_id o owner_full_name" siga cumpliéndose aunque
 * este formulario no edite esos dos campos cuando el paciente ya está vinculado a una mascota.
 */
export async function updateClinicalPatient(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user?.establishment) return;

  const id = str(formData, 'id');
  if (!id) return;

  const supabase = await createSupabaseServerClient();
  const { data: current } = await supabase
    .from('clinical_patients')
    .select('id, pet_id, owner_full_name')
    .eq('id', id)
    .eq('establishment_id', user.establishment.id)
    .maybeSingle();
  if (!current) return;

  const estimatedAgeRaw = str(formData, 'estimated_age_years');
  const raw = {
    pet_id: current.pet_id ?? undefined,
    owner_full_name: current.pet_id ? current.owner_full_name ?? undefined : str(formData, 'owner_full_name'),
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

  const { error } = await supabase
    .from('clinical_patients')
    .update({
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
    .eq('id', id)
    .eq('establishment_id', user.establishment.id);
  if (error) return;

  revalidatePath(`/panel/pacientes/${id}`);
  revalidatePath('/panel/pacientes');
  redirect(`/panel/pacientes/${id}`);
}

/**
 * Borra un paciente completo (pedido explícito del usuario: animales viejos o que ya no hacen
 * parte del establecimiento). `on delete cascade` en `clinical_records.clinical_patient_id`
 * (0016_clinical_records.sql) ya se encarga de borrar también todas sus consultas — no hace falta
 * borrarlas acá aparte. Esto NO borra la mascota de `pets` ni nada del lado del cuidador, solo la
 * ficha clínica que lleva este establecimiento.
 */
export async function deleteClinicalPatient(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user?.establishment) return;

  const id = str(formData, 'id');
  if (!id) return;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('clinical_patients')
    .delete()
    .eq('id', id)
    .eq('establishment_id', user.establishment.id);
  if (error) return;

  revalidatePath('/panel/pacientes');
  redirect('/panel/pacientes');
}
