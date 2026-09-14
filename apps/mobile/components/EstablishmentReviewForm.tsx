import { establishmentReviewSchema, type EstablishmentReview } from '@petapp/shared';
import { CircleCheck, Star } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

const reviewFieldsSchema = establishmentReviewSchema.omit({ establishment_id: true });
type ReviewFormValues = z.infer<typeof reviewFieldsSchema>;

/**
 * Formulario para dejar/editar una reseña (idea 3.1 del banco de ideas, mismo patrón que la
 * versión web) — solo se muestra si el llamador (`establecimiento/[id].tsx`) ya confirmó que el
 * cuidador tuvo una cita `completada` acá. La policy de INSERT en Supabase es la defensa real,
 * esto es solo para no mostrarle el formulario a quien de todas formas no podría enviarlo.
 */
export function EstablishmentReviewForm({
  establishmentId,
  ownerId,
  existingReview,
}: {
  establishmentId: string;
  ownerId: string;
  existingReview: EstablishmentReview | null;
}) {
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [comment, setComment] = useState(existingReview?.comment ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    const parsed = reviewFieldsSchema.safeParse({ rating, comment: comment.trim() });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Datos inválidos.');
      return;
    }
    setSaving(true);
    setError(null);
    const { error: upsertError } = await supabase.from('establishment_reviews').upsert(
      {
        establishment_id: establishmentId,
        pet_owner_id: ownerId,
        rating: parsed.data.rating,
        comment: parsed.data.comment || null,
      },
      { onConflict: 'establishment_id,pet_owner_id' }
    );
    setSaving(false);
    if (upsertError) {
      setError('No se pudo guardar la reseña. Intenta de nuevo.');
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <View className="flex-row items-start gap-2 rounded-xl border border-success/30 bg-success/5 p-3">
        <CircleCheck size={16} color="#059669" />
        <Text className="flex-1 font-body text-sm text-success">
          {existingReview ? 'Tu reseña se actualizó.' : '¡Gracias por tu reseña! Ya se ve en esta ficha.'}
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-3 rounded-xl bg-card p-4 shadow-sm">
      <Text className="font-heading text-base text-foreground">
        {existingReview ? 'Edita tu reseña' : 'Deja tu reseña'}
      </Text>
      <View className="flex-row items-center gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <Pressable
            key={value}
            onPress={() => setRating(value)}
            hitSlop={6}
            accessibilityRole="radio"
            accessibilityState={{ checked: rating === value }}
            accessibilityLabel={`${value} estrella${value === 1 ? '' : 's'}`}
          >
            <Star size={28} color="#D97706" fill={value <= rating ? '#D97706' : 'none'} />
          </Pressable>
        ))}
      </View>
      <View className="min-h-11 rounded-sm border border-border bg-background px-3 py-2">
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="¿Cómo te fue en tu cita? Esto le sirve a otros cuidadores (opcional)"
          placeholderTextColor="#64748B"
          multiline
          maxLength={500}
          className="font-body text-base text-foreground"
        />
      </View>
      {error ? <Text className="font-body text-sm text-destructive">{error}</Text> : null}
      <Button
        label={existingReview ? 'Actualizar reseña' : 'Publicar reseña'}
        onPress={handleSubmit}
        loading={saving}
      />
    </View>
  );
}
