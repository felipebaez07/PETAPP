'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Borra una reseña reportada (idea 5 del banco de recomendaciones) — la policy de DELETE de
 * `establishment_reviews` ya exige `is_admin()` del lado de la base, esto es defensa en
 * profundidad. Devuelve `void` (no un `ActionResult`) porque se usa directo como `action` de un
 * `<form>` — mismo patrón que `updateVerificationStatus` de admin/aliados/actions.ts.
 */
export async function deleteReportedReview(reviewId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user || user.profile.role !== 'admin') return;

  const supabase = await createSupabaseServerClient();
  await supabase.from('establishment_reviews').delete().eq('id', reviewId);

  revalidatePath('/panel/admin/resenas');
}

/** Descarta los reportes de una reseña sin borrarla — para cuando el admin revisa y decide que
 * la reseña es legítima (no abusiva), en vez de dejarla apareciendo en esta lista para siempre. */
export async function dismissReviewReports(reviewId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user || user.profile.role !== 'admin') return;

  const supabase = await createSupabaseServerClient();
  await supabase.from('establishment_review_reports').delete().eq('review_id', reviewId);

  revalidatePath('/panel/admin/resenas');
}
