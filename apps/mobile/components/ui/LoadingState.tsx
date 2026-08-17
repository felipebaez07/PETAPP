import { ActivityIndicator, Text, View } from 'react-native';

export function LoadingState({ label = 'Cargando...' }: { label?: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 py-16">
      <ActivityIndicator size="large" color="#123A5C" />
      <Text className="font-body text-sm text-mutedForeground">{label}</Text>
    </View>
  );
}
