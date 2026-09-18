'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { ConsentType } from '@petapp/shared';

export interface ActionResult {
  ok: boolean;
  error?: string;
}

/**
 * `owner_consents` es append-only (0024_owner_consents.sql) — esto SIEMPRE inserta una fila
 * nueva, nunca actualiza una existente. La fila más reciente por (owner_id, consent_type) es la
 * vigente, así queda el historial completo de cuándo y cómo cambió cada consentimiento.
 */
export async function setConsent(consentType: ConsentType, granted: boolean): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || user.profile.role !== 'propietario') return { ok: false, error: 'No autorizado.' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('owner_consents').insert({
    owner_id: user.profile.id,
    consent_type: consentType,
    granted,
    method: 'panel',
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath('/cuidador/privacidad');
  return { ok: true };
}
