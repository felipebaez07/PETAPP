import type { Pet } from '@petapp/shared';
import { useRouter } from 'expo-router';
import { Cat, CheckCircle2, ChevronRight, Dog, PawPrint, Trash2, XCircle } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { formatPetAge, SEX_LABELS } from '@/lib/labels';

const SPECIES_ICON = { perro: Dog, gato: Cat, otro: PawPrint } as const;

export function PetCard({ pet, onDelete }: { pet: Pet; onDelete?: (pet: Pet) => void }) {
  const router = useRouter();
  const SpeciesIcon = SPECIES_ICON[pet.species];

  return (
    <Pressable
      // `.expo/types/router.d.ts` no reconoce `mascotas/[id]` como ruta dinámica en este
      // monorepo (típegen de expo-router cruza rutas de apps/web) — cast puntual mientras
      // se investiga, ver spec.md backlog.
      onPress={() => router.push(`/mascotas/${pet.id}` as any)}
      accessibilityRole="button"
      accessibilityLabel={`Ver ficha de ${pet.name}`}
      style={({ pressed }) => (pressed ? { transform: [{ scale: 0.98 }] } : undefined)}
      className="mb-3 gap-3 rounded-xl bg-card p-4 shadow-sm"
    >
      <View className="flex-row items-center gap-3">
        <View
          className="h-12 w-12 items-center justify-center rounded-md bg-backgroundAlt"
          accessible={false}
        >
          <SpeciesIcon size={24} color="#059669" />
        </View>
        <View className="flex-1">
          <Text className="font-heading text-base text-foreground">{pet.name}</Text>
          <Text className="font-body text-sm text-mutedForeground">
            {pet.breed ? `${pet.breed} · ` : ''}
            {SEX_LABELS[pet.sex]}
          </Text>
        </View>
        {onDelete ? (
          <Pressable
            onPress={() => onDelete(pet)}
            accessibilityRole="button"
            accessibilityLabel={`Eliminar ${pet.name}`}
            hitSlop={8}
            style={({ pressed }) => (pressed ? { opacity: 0.6 } : undefined)}
            className="h-9 w-9 items-center justify-center rounded-sm"
          >
            <Trash2 size={18} color="#DC2626" />
          </Pressable>
        ) : null}
        <ChevronRight size={18} color="#64748B" />
      </View>

      <Text className="font-body text-sm text-mutedForeground">{formatPetAge(pet.birth_date)}</Text>

      <View className="flex-row flex-wrap gap-2">
        <View className="flex-row items-center gap-1 rounded-sm bg-muted px-2 py-1">
          {pet.sterilized ? (
            <CheckCircle2 size={14} color="#059669" />
          ) : (
            <XCircle size={14} color="#64748B" />
          )}
          <Text className={`font-bodyMedium text-xs ${pet.sterilized ? 'text-success' : 'text-mutedForeground'}`}>
            {pet.sterilized ? 'Esterilizado' : 'No esterilizado'}
          </Text>
        </View>
        <View className="flex-row items-center gap-1 rounded-sm bg-muted px-2 py-1">
          {pet.vaccinated ? (
            <CheckCircle2 size={14} color="#059669" />
          ) : (
            <XCircle size={14} color="#64748B" />
          )}
          <Text className={`font-bodyMedium text-xs ${pet.vaccinated ? 'text-success' : 'text-mutedForeground'}`}>
            {pet.vaccinated ? 'Vacunado' : 'Sin vacunas registradas'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
