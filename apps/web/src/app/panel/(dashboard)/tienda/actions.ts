'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { productSchema } from '@petapp/shared';

export interface ProductActionResult {
  ok: boolean;
  error?: string;
}

function parseProductForm(formData: FormData) {
  return productSchema.safeParse({
    name: String(formData.get('name') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim(),
    category: String(formData.get('category') ?? 'otro'),
    price_reference: String(formData.get('price_reference') ?? '').trim(),
    image_url: String(formData.get('image_url') ?? '').trim(),
  });
}

function revalidateProductPaths(establishmentSlug: string) {
  revalidatePath('/panel/tienda');
  revalidatePath('/marketplace');
  revalidatePath(`/establecimientos/${establishmentSlug}`);
}

export async function addProduct(formData: FormData): Promise<ProductActionResult> {
  const user = await getCurrentUser();
  if (!user?.establishment) return { ok: false, error: 'No autorizado.' };

  const parsed = parseProductForm(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('products').insert({
    establishment_id: user.establishment.id,
    name: parsed.data.name,
    description: parsed.data.description || null,
    category: parsed.data.category,
    price_reference: parsed.data.price_reference || null,
    image_url: parsed.data.image_url || null,
  });
  if (error) return { ok: false, error: error.message };

  revalidateProductPaths(user.establishment.slug);
  return { ok: true };
}

export async function updateProduct(id: string, formData: FormData): Promise<ProductActionResult> {
  const user = await getCurrentUser();
  if (!user?.establishment) return { ok: false, error: 'No autorizado.' };
  if (!id) return { ok: false, error: 'Falta el producto a editar.' };

  const parsed = parseProductForm(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('products')
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
      category: parsed.data.category,
      price_reference: parsed.data.price_reference || null,
      image_url: parsed.data.image_url || null,
    })
    .eq('id', id)
    .eq('establishment_id', user.establishment.id);
  if (error) return { ok: false, error: error.message };

  revalidateProductPaths(user.establishment.slug);
  return { ok: true };
}

export async function deleteProduct(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user?.establishment) return;

  const id = String(formData.get('id') ?? '');
  if (!id) return;

  const supabase = await createSupabaseServerClient();
  await supabase.from('products').delete().eq('id', id).eq('establishment_id', user.establishment.id);

  revalidateProductPaths(user.establishment.slug);
}
