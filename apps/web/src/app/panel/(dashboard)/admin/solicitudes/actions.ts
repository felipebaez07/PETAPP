'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { slugify } from '@petapp/shared';

export interface ConvertResult {
  ok: boolean;
  error?: string;
}

/**
 * Crea la fila de `establishments` a partir de una solicitud de "Únete al
 * piloto" ya aprobada. Queda sin owner_id (se vincula después, a mano, desde
 * "Verificar aliados") y is_active/verification_status en sus valores por
 * defecto ('pendiente') — esto es intencional: convertir la solicitud es
 * apenas el primer paso, no reemplaza la verificación real.
 */
export async function convertApplicationToEstablishment(formData: FormData): Promise<ConvertResult> {
  const user = await getCurrentUser();
  if (!user || user.profile.role !== 'admin') return { ok: false, error: 'No autorizado.' };

  const id = String(formData.get('id') ?? '');
  if (!id) return { ok: false, error: 'Falta la solicitud.' };

  const supabase = await createSupabaseServerClient();
  const { data: application, error: fetchError } = await supabase
    .from('partner_applications')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (fetchError) return { ok: false, error: fetchError.message };
  if (!application) return { ok: false, error: 'La solicitud ya no existe.' };

  const slug = `${slugify(application.business_name)}-${id.slice(0, 6)}`;

  const { error: insertError } = await supabase.from('establishments').insert({
    name: application.business_name,
    slug,
    category: application.category,
    address: application.address || null,
    city: 'Ibagué',
    phone: application.phone,
    email: application.email || null,
  });
  if (insertError) return { ok: false, error: insertError.message };

  const { error: updateError } = await supabase
    .from('partner_applications')
    .update({ status: 'convertido', reviewed_by: user.profile.id })
    .eq('id', id);
  if (updateError) return { ok: false, error: updateError.message };

  revalidatePath('/panel/admin/solicitudes');
  revalidatePath('/panel/admin/aliados');
  revalidatePath('/');
  return { ok: true };
}
