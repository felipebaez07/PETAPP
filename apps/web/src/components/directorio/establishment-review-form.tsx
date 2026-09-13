'use client';

import { useState } from 'react';
import { CheckCircle2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { upsertEstablishmentReview } from '@/app/directorio/[slug]/actions';
import type { EstablishmentReview } from '@petapp/shared';

/**
 * Formulario para dejar/editar una reseña (idea 3.1 del banco de ideas). Solo se muestra si el
 * llamador (`page.tsx`) ya confirmó que el cuidador tuvo una cita `completada` con este
 * establecimiento — la policy de INSERT en Supabase es la defensa real, esto es solo para no
 * mostrarle el formulario a quien de todas formas no podría enviarlo.
 */
export function EstablishmentReviewForm({
  establishmentId,
  establishmentSlug,
  existingReview,
}: {
  establishmentId: string;
  establishmentSlug: string;
  existingReview: EstablishmentReview | null;
}) {
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [status, setStatus] = useState<'idle' | 'saving' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (rating < 1) {
      setStatus('error');
      setErrorMessage('Elige entre 1 y 5 estrellas.');
      return;
    }
    setStatus('saving');
    setErrorMessage(null);
    const formData = new FormData(e.currentTarget);
    formData.set('rating', String(rating));
    const result = await upsertEstablishmentReview(formData);
    if (!result.ok) {
      setStatus('error');
      setErrorMessage(result.error ?? 'Algo salió mal, intenta de nuevo.');
      return;
    }
    setStatus('sent');
  };

  if (status === 'sent') {
    return (
      <div className="flex items-start gap-2.5 rounded-md border border-success/30 bg-success/5 p-3 text-sm text-success">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p>{existingReview ? 'Tu reseña se actualizó.' : '¡Gracias por tu reseña! Ya se ve en esta ficha.'}</p>
      </div>
    );
  }

  const shownRating = hoverRating || rating;

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-3">
      <input type="hidden" name="establishment_id" value={establishmentId} />
      <input type="hidden" name="establishment_slug" value={establishmentSlug} />

      <div>
        <Label className="mb-1.5 block">Tu calificación</Label>
        <div className="flex items-center gap-1" role="radiogroup" aria-label="Calificación de 1 a 5 estrellas">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={`${value} estrella${value === 1 ? '' : 's'}`}
              onMouseEnter={() => setHoverRating(value)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(value)}
              className="p-0.5"
            >
              <Star
                className={`size-6 ${
                  value <= shownRating ? 'fill-accent text-accent' : 'fill-none text-muted-foreground'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="review-comment" className="mb-1.5 block">
          Comentario (opcional)
        </Label>
        <Textarea
          id="review-comment"
          name="comment"
          defaultValue={existingReview?.comment ?? ''}
          maxLength={500}
          rows={3}
          placeholder="¿Cómo te fue en tu cita? Esto le sirve a otros cuidadores."
        />
      </div>

      {status === 'error' && errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

      <Button type="submit" size="sm" disabled={status === 'saving'}>
        {existingReview ? 'Actualizar reseña' : 'Publicar reseña'}
      </Button>
    </form>
  );
}
