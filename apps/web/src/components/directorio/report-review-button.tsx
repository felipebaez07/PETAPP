'use client';

import { useState } from 'react';
import { Flag } from 'lucide-react';
import { reportEstablishmentReview } from '@/app/directorio/[slug]/actions';

/** Botón chico de "Reportar" por reseña (idea 5 del banco de recomendaciones) — moderación
 * básica: cualquier cuidador puede marcar una reseña de otro como abusiva/falsa, un admin la
 * revisa en /panel/admin/resenas. No borra ni edita nada de la reseña misma. */
export function ReportReviewButton({ reviewId }: { reviewId: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');

  if (state === 'sent') {
    return <span className="text-xs text-muted-foreground">Reportada, gracias</span>;
  }

  return (
    <button
      type="button"
      disabled={state === 'sending'}
      onClick={async () => {
        setState('sending');
        await reportEstablishmentReview(reviewId);
        setState('sent');
      }}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
    >
      <Flag className="size-3" aria-hidden /> Reportar
    </button>
  );
}
