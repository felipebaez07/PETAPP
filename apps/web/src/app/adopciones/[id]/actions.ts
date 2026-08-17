'use server';

import { adoptionInterestSchema } from '@petapp/shared';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export interface SubmitInterestResult {
  ok: boolean;
  error?: string;
  demo?: boolean;
}

export async function submitAdoptionInterest(
  adoptionPostId: string,
  values: unknown
): Promise<SubmitInterestResult> {
  const parsed = adoptionInterestSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };
  }

  if (!isSupabaseConfigured()) {
    // Modo demo: no hay base de datos real conectada todavía. El flujo se
    // considera completo del lado del usuario (ver docs/NEXT_STEPS.md) — el
    // contacto real ocurre por el enlace de WhatsApp que se muestra después.
    return { ok: true, demo: true };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('adoption_interests').insert({
    adoption_post_id: adoptionPostId,
    full_name: parsed.data.full_name,
    phone: parsed.data.phone,
    email: parsed.data.email || null,
    message: parsed.data.message || null,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
