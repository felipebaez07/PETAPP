import type { EstablishmentReview } from '@petapp/shared';
import { Flag, Star } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { supabase } from '@/lib/supabase';

/** Lista de reseñas + promedio de una ficha de establecimiento — mismo criterio que la versión
 * web (`components/directorio/establishment-reviews.tsx`), lectura pública. `viewerId` oculta el
 * botón de reportar en la propia reseña del cuidador y en general cuando no hay sesión. */
export function EstablishmentReviews({ reviews, viewerId }: { reviews: EstablishmentReview[]; viewerId: string | null }) {
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
            {viewerId && viewerId !== review.pet_owner_id ? (
              <ReportButton reviewId={review.id} />
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

function ReportButton({ reviewId }: { reviewId: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');

  if (state === 'sent') {
    return <Text className="font-body text-xs text-mutedForeground">Reportada, gracias</Text>;
  }

  return (
    <Pressable
      disabled={state === 'sending'}
      onPress={async () => {
        setState('sending');
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('establishment_review_reports').insert({ review_id: reviewId, reporter_id: user.id });
        }
        setState('sent');
      }}
      className="flex-row items-center gap-1 self-start"
      style={({ pressed }) => (pressed ? { opacity: 0.6 } : undefined)}
    >
      <Flag size={12} color="#64748B" />
      <Text className="font-body text-xs text-mutedForeground">Reportar</Text>
    </Pressable>
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
