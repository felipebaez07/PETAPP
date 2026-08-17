import type { Pet } from '@petapp/shared';
import { Cat, CheckCircle2, Dog, PawPrint, XCircle } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { formatPetAge, SEX_LABELS } from '@/lib/labels';

const SPECIES_ICON = { perro: Dog, gato: Cat, otro: PawPrint } as const;

export function PetCard({ pet }: { pet: Pet }) {
  const SpeciesIcon = SPECIES_ICON[pet.species];

  return (
    <View className="mb-3 gap-3 rounded-md border border-border bg-card p-4">
      <View className="flex-row items-center gap-3">
        <View className="h-12 w-12 items-center justify-center rounded-md bg-backgroundAlt">
          <SpeciesIcon size={24} color="#0F766E" />
        </View>
        <View className="flex-1">
          <Text className="font-heading text-base text-foreground">{pet.name}</Text>
          <Text className="font-body text-sm text-mutedForeground">
            {pet.breed ? `${pet.breed} · ` : ''}
            {SEX_LABELS[pet.sex]}
          </Text>
        </View>
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
    </View>
  );
}
