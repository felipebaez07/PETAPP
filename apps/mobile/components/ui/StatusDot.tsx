import { Text, View } from 'react-native';

interface StatusDotProps {
  open: boolean;
  openLabel?: string;
  closedLabel?: string;
}

/** Punto de estado abierto/cerrado. Verde = abierto (éxito), gris = cerrado. */
export function StatusDot({ open, openLabel = 'Abierto ahora', closedLabel = 'Cerrado' }: StatusDotProps) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View className={`h-2 w-2 rounded-full ${open ? 'bg-success' : 'bg-mutedForeground'}`} />
      <Text className={`font-bodyMedium text-sm ${open ? 'text-success' : 'text-mutedForeground'}`}>
        {open ? openLabel : closedLabel}
      </Text>
    </View>
  );
}
