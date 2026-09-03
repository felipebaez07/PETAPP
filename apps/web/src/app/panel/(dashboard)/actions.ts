'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createEstablishmentSchema, type CreateEstablishmentValues } from '@petapp/shared';
import { slugify } from '@petapp/shared';

export interface CreateEstablishmentResult {
  ok: boolean;
  error?: string;
}

/**
 * Autoservicio para una cuenta `establecimiento` recién registrada que todavía no tiene ningún
 * negocio vinculado (ver `!user.establishment` en `panel/(dashboard)/page.tsx`) — antes la única
 * vía era el formulario público "Únete al piloto" + conversión manual de un admin, pensado para
 * gente sin cuenta todavía. Este negocio arranca en `verification_status='pendiente'` (el
 * default de la columna) — sigue pasando por la validación del superadmin igual que cualquier
 * otro, esto solo evita que un registro correcto quede sin nada que gestionar.
 */
export async function createOwnEstablishment(values: CreateEstablishmentValues): Promise<CreateEstablishmentResult> {
  const user = await getCurrentUser();
  if (!user || user.profile.role !== 'establecimiento') {
    return { ok: false, error: 'Solo cuentas de negocio pueden crear un perfil de prestador.' };
  }
  if (user.establishment) {
    return { ok: false, error: 'Tu cuenta ya tiene un negocio vinculado.' };
  }

  const parsed = createEstablishmentSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };

  const supabase = await createSupabaseServerClient();

  // El slug debe ser único (`establishments.slug` tiene `unique`) — si el nombre elegido ya
  // generó un slug existente, se le agrega un sufijo corto en vez de fallar con un error crudo
  // de constraint que el usuario no entendería.
  const baseSlug = slugify(parsed.data.name);
  let slug = baseSlug;
  const { data: existing } = await supabase.from('establishments').select('slug').eq('slug', slug).maybeSingle();
  if (existing) slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

  const { error } = await supabase.from('establishments').insert({
    owner_id: user.profile.id,
    name: parsed.data.name,
    slug,
    category: parsed.data.category,
    city: 'Ibagué',
    address: parsed.data.address || null,
    phone: parsed.data.phone || null,
    whatsapp_number: parsed.data.whatsapp_number || null,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath('/panel');
  revalidatePath('/directorio');
  return { ok: true };
}
