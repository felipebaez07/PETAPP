'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { preventiveEventSchema, petDocumentSchema, type PreventiveEventFormValues, type PetDocumentFormValues } from '@petapp/shared';

export interface ActionResult {
  ok: boolean;
  error?: string;
}

/**
 * Todas las acciones de este archivo confirman primero que la mascota pertenece al
 * usuario autenticado antes de tocar `preventive_events`/`pet_documents`. La policy RLS
 * de esas tablas (0005_pivot_preventivo.sql) ya lo exige del lado de la base de datos —
 * esta verificación es defensa en profundidad, no un reemplazo de RLS, y usa el cliente
 * con la sesión del usuario en todo momento (nunca service role).
 */
async function assertOwnsPet(petId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user || user.profile.role !== 'propietario') return { ok: false, error: 'No autorizado.' };
  const supabase = await createSupabaseServerClient();
  const { data: pet } = await supabase.from('pets').select('id').eq('id', petId).eq('owner_id', user.profile.id).maybeSingle();
  if (!pet) return { ok: false, error: 'Esta mascota no te pertenece.' };
  return { ok: true };
}

export async function createPreventiveEvent(values: PreventiveEventFormValues): Promise<ActionResult> {
  const parsed = preventiveEventSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };

  const owns = await assertOwnsPet(parsed.data.pet_id);
  if (!owns.ok) return owns;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('preventive_events').insert({
    pet_id: parsed.data.pet_id,
    type: parsed.data.type,
    title: parsed.data.title,
    due_date: parsed.data.due_date,
    notes: parsed.data.notes || null,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/cuidador/mascotas/${parsed.data.pet_id}`);
  return { ok: true };
}

export async function togglePreventiveEventCompleted(
  eventId: string,
  petId: string,
  completed: boolean
): Promise<ActionResult> {
  const owns = await assertOwnsPet(petId);
  if (!owns.ok) return owns;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('preventive_events')
    .update({ completed_at: completed ? new Date().toISOString() : null })
    .eq('id', eventId)
    .eq('pet_id', petId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/cuidador/mascotas/${petId}`);
  return { ok: true };
}

export async function deletePreventiveEvent(eventId: string, petId: string): Promise<ActionResult> {
  const owns = await assertOwnsPet(petId);
  if (!owns.ok) return owns;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('preventive_events').delete().eq('id', eventId).eq('pet_id', petId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/cuidador/mascotas/${petId}`);
  return { ok: true };
}

export async function createPetDocument(values: PetDocumentFormValues): Promise<ActionResult> {
  const parsed = petDocumentSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };

  const owns = await assertOwnsPet(parsed.data.pet_id);
  if (!owns.ok) return owns;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('pet_documents').insert({
    pet_id: parsed.data.pet_id,
    title: parsed.data.title,
    document_url: parsed.data.document_url,
    document_type: parsed.data.document_type,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/cuidador/mascotas/${parsed.data.pet_id}`);
  return { ok: true };
}

export async function deletePetDocument(documentId: string, petId: string): Promise<ActionResult> {
  const owns = await assertOwnsPet(petId);
  if (!owns.ok) return owns;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('pet_documents').delete().eq('id', documentId).eq('pet_id', petId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/cuidador/mascotas/${petId}`);
  return { ok: true };
}
