'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { providerPlanSchema } from '@petapp/shared';

export interface PlanActionResult {
  ok: boolean;
  error?: string;
}

/**
 * El prestador solo puede elegir `plan_code` y dejar una nota de intención de pago.
 * NUNCA se envían `status`/`activated_at`/`activated_by` desde aquí: el trigger
 * `prevent_provider_plan_self_activation` (0005_pivot_preventivo.sql) rechaza cualquier
 * intento de cambiarlos sin ser admin, y esta acción respeta esa regla por diseño, no solo
 * porque el trigger la bloquearía — no hay service role de por medio, todo corre con RLS.
 */
export async function updateProviderPlan(formData: FormData): Promise<PlanActionResult> {
  const user = await getCurrentUser();
  if (!user?.establishment) return { ok: false, error: 'No autorizado.' };

  const parsed = providerPlanSchema.safeParse({
    plan_code: String(formData.get('plan_code') ?? ''),
    notes: String(formData.get('notes') ?? '').trim(),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };

  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from('provider_plans')
    .select('id')
    .eq('establishment_id', user.establishment.id)
    .maybeSingle();

  const error = existing
    ? (
        await supabase
          .from('provider_plans')
          .update({ plan_code: parsed.data.plan_code, notes: parsed.data.notes || null })
          .eq('id', existing.id)
      ).error
    : (
        await supabase.from('provider_plans').insert({
          establishment_id: user.establishment.id,
          plan_code: parsed.data.plan_code,
          notes: parsed.data.notes || null,
        })
      ).error;

  if (error) return { ok: false, error: error.message };

  revalidatePath('/panel/plan');
  return { ok: true };
}
