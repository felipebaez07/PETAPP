'use server';

import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { vetVisitNoteSchema, type AiRoadmapItem } from '@petapp/shared';

export interface ActionResult {
  ok: boolean;
  error?: string;
}

/**
 * Persiste el array completo de la ruta sugerida (ya con el `status` actualizado del ítem que el
 * cuidador acaba de decidir) — más simple que un update parcial dentro del jsonb, y evita que la
 * decisión sea efímera: sin esto, "Aceptar y agendar" sí creaba el `preventive_event`, pero al
 * volver a esta pantalla la tarjeta volvía a aparecer como pendiente.
 */
export async function saveRoadmapDecision(conversationId: string, roadmap: AiRoadmapItem[]): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'No autorizado.' };

  const supabase = await createSupabaseServerClient();
  const { data: conversation } = await supabase
    .from('ai_conversations')
    .select('id, owner_id')
    .eq('id', conversationId)
    .maybeSingle();
  // La RLS de ai_conversations (owner_id = auth.uid() or is_admin()) ya lo exige del lado de la
  // base — esta verificación es defensa en profundidad, mismo criterio que assertOwnsPet en
  // ../actions.ts.
  if (!conversation || conversation.owner_id !== user.profile.id) {
    return { ok: false, error: 'No autorizado.' };
  }

  const { error } = await supabase.from('ai_conversations').update({ roadmap }).eq('id', conversationId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Cierra el círculo del pre-diagnóstico (pedido explícito del usuario, 2026-09-13): después de la
 * cita real, el cuidador cuenta acá qué le dijo/hizo el veterinario. Queda ligada a la mascota (y
 * opcionalmente a la conversación que la originó) — el backend del chat (`route.ts`) usa el
 * historial de estas notas como contexto para la próxima conversación de esa misma mascota.
 */
export async function createVetVisitNote(
  petId: string,
  note: string,
  conversationId?: string
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'No autorizado.' };

  const parsed = vetVisitNoteSchema.safeParse({ pet_id: petId, ai_conversation_id: conversationId, note });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };

  const supabase = await createSupabaseServerClient();
  const { data: pet } = await supabase.from('pets').select('id').eq('id', petId).eq('owner_id', user.profile.id).maybeSingle();
  if (!pet) return { ok: false, error: 'Esta mascota no te pertenece.' };

  const { error } = await supabase.from('vet_visit_notes').insert({
    pet_id: parsed.data.pet_id,
    owner_id: user.profile.id,
    ai_conversation_id: parsed.data.ai_conversation_id ?? null,
    note: parsed.data.note,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
