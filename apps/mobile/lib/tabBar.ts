import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Alto fijo de `tabBarStyle` en `app/(tabs)/_layout.tsx` (sin contar el safe-area inferior).
 * Desde que la tab bar es un material translúcido flotante (`position: 'absolute'`, ver
 * addendum "Motion & Materials" de `design-system/petapp/MASTER.md`), el contenido de cada
 * pantalla de tab ya no reserva espacio para ella automáticamente — hay que agregarlo a mano
 * como padding inferior para que la última fila de cada lista no quede tapada por el blur.
 */
export const TAB_BAR_HEIGHT = 60;

/** Padding inferior recomendado para el `contentContainerStyle` de un ScrollView/FlatList
 * dentro de una pantalla de tab: alto de la barra + safe-area + un respiro extra. */
export function useTabBarBottomInset(extra = 16): number {
  const insets = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + insets.bottom + extra;
}
