'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { forumPostSchema } from '@petapp/shared';

export interface ForumActionResult {
  ok: boolean;
  error?: string;
}

function parseForumForm(formData: FormData) {
  return forumPostSchema.safeParse({
    title: String(formData.get('title') ?? '').trim(),
    body: String(formData.get('body') ?? '').trim(),
    category: String(formData.get('category') ?? 'anuncio'),
    image_url: String(formData.get('image_url') ?? '').trim(),
  });
}

function revalidateForumPaths() {
  revalidatePath('/panel/foro');
  revalidatePath('/foro');
}

export async function addForumPost(formData: FormData): Promise<ForumActionResult> {
  const user = await getCurrentUser();
  if (!user?.establishment) return { ok: false, error: 'No autorizado.' };

  const parsed = parseForumForm(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('forum_posts').insert({
    establishment_id: user.establishment.id,
    category: parsed.data.category,
    title: parsed.data.title,
    body: parsed.data.body,
    image_url: parsed.data.image_url || null,
  });
  if (error) return { ok: false, error: error.message };

  revalidateForumPaths();
  return { ok: true };
}

export async function updateForumPost(id: string, formData: FormData): Promise<ForumActionResult> {
  const user = await getCurrentUser();
  if (!user?.establishment) return { ok: false, error: 'No autorizado.' };
  if (!id) return { ok: false, error: 'Falta la publicación a editar.' };

  const parsed = parseForumForm(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('forum_posts')
    .update({
      category: parsed.data.category,
      title: parsed.data.title,
      body: parsed.data.body,
      image_url: parsed.data.image_url || null,
    })
    .eq('id', id)
    .eq('establishment_id', user.establishment.id);
  if (error) return { ok: false, error: error.message };

  revalidateForumPaths();
  return { ok: true };
}

export async function deleteForumPost(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user?.establishment) return;

  const id = String(formData.get('id') ?? '');
  if (!id) return;

  const supabase = await createSupabaseServerClient();
  await supabase.from('forum_posts').delete().eq('id', id).eq('establishment_id', user.establishment.id);

  revalidateForumPaths();
}
