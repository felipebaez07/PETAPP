'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { clinicalRecordSchema } from '@petapp/shared';

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
