import type { EstablishmentReview } from '@petapp/shared';
import { Star } from 'lucide-react-native';
import { Text, View } from 'react-native';

/** Lista de reseñas + promedio de una ficha de establecimiento — mismo criterio que la versión
 * web (`components/directorio/establishment-reviews.tsx`), lectura pública. */
export function EstablishmentReviews({ reviews }: { reviews: EstablishmentReview[] }) {
  if (reviews.length === 0) {
    return (
      <Text className="font-body text-sm text-mutedForeground">
        Todavía no hay reseñas — sé el primero en contar cómo te fue acá.
      </Text>
    );
  }

  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <View className="gap-4">
      <View className="flex-row items-center gap-2">
        <StarRating value={average} />
        <Text className="font-bodySemibold text-sm text-foreground">{average.toFixed(1)}</Text>
        <Text className="font-body text-sm text-mutedForeground">
          ({reviews.length} {reviews.length === 1 ? 'reseña' : 'reseñas'})
        </Text>
      </View>
      <View className="gap-3">
        {reviews.map((review, index) => (
          <View
            key={review.id}
            className={index > 0 ? 'gap-1 border-t border-border pt-3' : 'gap-1'}
          >
            <View className="flex-row items-center justify-between gap-2">
              <Text className="font-bodySemibold text-sm text-foreground">
                {review.reviewer_name || 'Cuidador/a'}
              </Text>
              <StarRating value={review.rating} />
            </View>
            {review.comment ? (
              <Text className="font-body text-sm text-foreground/90">{review.comment}</Text>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

function StarRating({ value }: { value: number }) {
  return (
    <View className="flex-row items-center gap-0.5" accessibilityLabel={`${value.toFixed(1)} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={14} color="#D97706" fill={n <= Math.round(value) ? '#D97706' : 'none'} />
      ))}
    </View>
  );
}
