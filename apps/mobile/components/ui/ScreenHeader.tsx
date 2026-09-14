import { COLORS } from '@petapp/shared';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  /**
   * El sistema de diseño reserva el degradé decorativo para un solo "momento hero" por
   * pantalla (misma regla que ya sigue el hero de la landing web) — no todas las pestañas lo
   * llevan, solo las de descubrimiento (Directorio, Mis mascotas) lo piden explícitamente.
   */
  gradient?: boolean;
}

/** Barra superior usada en cada pestaña (los Stacks internos usan el header nativo). */
export function ScreenHeader({ title, subtitle, right, gradient = false }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  const content = (
    <View className="flex-row items-center justify-between gap-3 px-5 pb-4">
      <View className="flex-1">
        <Text className="font-headingBold text-3xl leading-9 tracking-tight text-white">{title}</Text>
        {subtitle ? <Text className="mt-1 font-body text-sm leading-5 text-white/80">{subtitle}</Text> : null}
      </View>
      {right ? <View>{right}</View> : null}
    </View>
  );

  if (gradient) {
    return (
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top + 12 }}
      >
        {content}
      </LinearGradient>
    );
  }

  return (
    <View className="bg-primary" style={{ paddingTop: insets.top + 12 }}>
      {content}
    </View>
  );
}
