import { Link, Stack } from 'expo-router';
import { SearchX } from 'lucide-react-native';
import { Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'No encontrado' }} />
      <View className="flex-1 items-center justify-center gap-3 bg-background px-8">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-muted">
          <SearchX size={28} color="#64748B" />
        </View>
        <Text className="text-center font-heading text-lg text-foreground">
          Esta pantalla no existe
        </Text>
        <Text className="text-center font-body text-sm text-mutedForeground">
          Puede que el enlace esté roto o la página se haya movido.
        </Text>
        <Link href="/" className="mt-2 font-bodySemibold text-base text-secondary">
          Volver al directorio
        </Link>
      </View>
    </>
  );
}
