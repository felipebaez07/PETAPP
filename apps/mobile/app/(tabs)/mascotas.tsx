import type { Pet } from '@petapp/shared';
import { useRouter } from 'expo-router';
import { PawPrint, Plus } from 'lucide-react-native';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';

import { PetCard } from '@/components/PetCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { usePets } from '@/contexts/PetsContext';

export default function PetsScreen() {
  const { pets, loading, isDemo, deletePet } = usePets();
  const router = useRouter();

  function confirmDelete(pet: Pet) {
    Alert.alert('Eliminar mascota', `¿Eliminar a ${pet.name} de tu lista?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          const ok = await deletePet(pet.id);
          if (!ok) Alert.alert('No se pudo eliminar', 'Intenta de nuevo en unos segundos.');
        },
      },
    ]);
  }

  if (loading) {
    return <LoadingState label="Cargando tus mascotas..." />;
  }

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

      {isDemo ? (
        <Text className="px-5 pt-3 font-body text-xs text-mutedForeground">
          Inicia sesión para guardar tus mascotas de verdad — estas son solo de ejemplo.
        </Text>
      ) : null}

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
          renderItem={({ item }) => <PetCard pet={item} onDelete={confirmDelete} />}
          contentContainerStyle={{ padding: 20 }}
        />
      )}
    </View>
  );
}
