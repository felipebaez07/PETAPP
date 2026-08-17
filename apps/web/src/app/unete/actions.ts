'use server';

import { partnerApplicationSchema } from '@petapp/shared';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export interface SubmitApplicationResult {
  ok: boolean;
  error?: string;
  demo?: boolean;
}

export async function submitPartnerApplication(values: unknown): Promise<SubmitApplicationResult> {
  const parsed = partnerApplicationSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };
  }

  if (!isSupabaseConfigured()) {
    return { ok: true, demo: true };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('partner_applications').insert({
    business_name: parsed.data.business_name,
    category: parsed.data.category,
    contact_name: parsed.data.contact_name,
    phone: parsed.data.phone,
    email: parsed.data.email || null,
    address: parsed.data.address || null,
    message: parsed.data.message || null,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
