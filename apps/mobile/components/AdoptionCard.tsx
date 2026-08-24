import { ADOPTION_STATUS_LABELS, SPECIES_LABELS, type AdoptionPostWithPhotos } from '@petapp/shared';
import { useRouter } from 'expo-router';
import { Cat, Dog, MapPin, PawPrint } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { Badge, type BadgeTone } from './ui/Badge';

const SPECIES_ICON = { perro: Dog, gato: Cat, otro: PawPrint } as const;

const STATUS_TONE: Record<AdoptionPostWithPhotos['status'], BadgeTone> = {
  disponible: 'accent', // único uso permitido del ámbar: contenido de adopción
  en_proceso: 'secondary',
  adoptado: 'muted',
  retirado: 'muted',
};

export function AdoptionCard({ post }: { post: AdoptionPostWithPhotos }) {
  const router = useRouter();
  const SpeciesIcon = SPECIES_ICON[post.species];

  return (
    <Pressable
      onPress={() => router.push(`/adopciones/${post.id}`)}
      accessibilityRole="button"
      className="mb-3 flex-row gap-3 rounded-md border border-border bg-card p-4"
    >
      <View className="h-16 w-16 items-center justify-center rounded-md bg-backgroundAlt">
        <SpeciesIcon size={28} color="#059669" />
      </View>

      <View className="flex-1 gap-1.5">
        <View className="flex-row items-center justify-between gap-2">
          <Text className="flex-1 font-heading text-base text-foreground" numberOfLines={1}>
            {post.animal_name}
          </Text>
          <Badge label={ADOPTION_STATUS_LABELS[post.status]} tone={STATUS_TONE[post.status]} />
        </View>

        <Text className="font-body text-sm text-mutedForeground">
          {SPECIES_LABELS[post.species]}
          {post.estimated_age ? ` · ${post.estimated_age}` : ''}
        </Text>

        {post.location_text ? (
          <View className="flex-row items-center gap-1">
            <MapPin size={13} color="#64748B" />
            <Text className="flex-1 font-body text-xs text-mutedForeground" numberOfLines={1}>
              {post.location_text}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
