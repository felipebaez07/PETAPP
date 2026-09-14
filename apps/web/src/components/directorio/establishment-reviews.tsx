import { Star } from 'lucide-react';
import type { EstablishmentReview } from '@petapp/shared';
import { ReportReviewButton } from './report-review-button';

/**
 * Lista de reseñas + promedio de una ficha del directorio (idea 3.1 del banco de ideas). Server
 * component en sí mismo (los datos ya vienen leídos con lectura pública) — el botón de reportar
 * de cada fila es la única parte interactiva, aislada en su propio client component.
 * `viewerId` oculta el botón en la propia reseña del cuidador (no tiene sentido reportarse a
 * uno mismo) y en general cuando no hay sesión.
 */
export function EstablishmentReviews({ reviews, viewerId }: { reviews: EstablishmentReview[]; viewerId: string | null }) {
  if (reviews.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Todavía no hay reseñas — sé el primero en contar cómo te fue acá.
      </p>
    );
  }

  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <StarRating value={average} />
        <span className="text-sm font-medium text-foreground">{average.toFixed(1)}</span>
        <span className="text-sm text-muted-foreground">
          ({reviews.length} {reviews.length === 1 ? 'reseña' : 'reseñas'})
        </span>
      </div>
      <ul className="space-y-3 divide-y divide-border">
        {reviews.map((review) => (
          <li key={review.id} className="pt-3 first:pt-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-foreground">{review.reviewer_name || 'Cuidador/a'}</span>
              <StarRating value={review.rating} />
            </div>
            {review.comment && <p className="mt-1 text-sm text-foreground/90">{review.comment}</p>}
            {viewerId && viewerId !== review.pet_owner_id && (
              <div className="mt-1.5">
                <ReportReviewButton reviewId={review.id} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value.toFixed(1)} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`size-3.5 ${n <= Math.round(value) ? 'fill-accent text-accent' : 'fill-none text-muted-foreground'}`} />
      ))}
    </div>
  );
}
