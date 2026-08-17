import { useRouter } from 'expo-router';
import { PawPrint, Plus } from 'lucide-react-native';
import { FlatList, Pressable, View } from 'react-native';

import { PetCard } from '@/components/PetCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { usePets } from '@/contexts/PetsContext';

export default function PetsScreen() {
  const { pets } = usePets();
  const router = useRouter();

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title="Mascotas"
        subtitle={pets.length === 1 ? '1 mascota registrada' : `${pets.length} mascotas registradas`}
        right={
          <Pressable
            onPress={() => router.push('/mascotas/nueva')}
            accessibilityRole="button"
            accessibilityLabel="Agregar mascota"
            className="h-11 w-11 items-center justify-center rounded-md bg-white/15"
          >
            <Plus size={22} color="#FFFFFF" />
          </Pressable>
        }
      />

      {pets.length === 0 ? (
        <EmptyState
          icon={PawPrint}
          title="Aún no has agregado mascotas"
          description="Registra a tu mascota para llevar su ficha básica de salud."
          actionLabel="Agregar mi primera mascota"
          onAction={() => router.push('/mascotas/nueva')}
        />
      ) : (
        <FlatList
          data={pets}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PetCard pet={item} />}
          contentContainerStyle={{ padding: 20 }}
        />
      )}
    </View>
  );
}
