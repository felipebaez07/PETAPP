'use server';

import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { AiRoadmapItem } from '@petapp/shared';

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
