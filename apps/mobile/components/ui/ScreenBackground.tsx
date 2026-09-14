import { Bird, Cat, Dog, Fish, PawPrint } from 'lucide-react-native';
import { useEffect } from 'react';
import { Dimensions, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SilhouetteSpec {
  Icon: typeof PawPrint;
  top: `${number}%`;
  size: number;
  duration: number;
  delay: number;
  direction: 'right' | 'left';
}

// Igual criterio que la versión web (animal-silhouettes-background.tsx): posiciones y
// velocidades fijas, no aleatorias — es una textura de fondo, no debe "saltar" en cada montaje.
const SILHOUETTES: SilhouetteSpec[] = [
  { Icon: PawPrint, top: '10%', size: 40, duration: 26000, delay: 0, direction: 'right' },
  { Icon: Bird, top: '32%', size: 32, duration: 34000, delay: 4000, direction: 'left' },
  { Icon: Cat, top: '58%', size: 44, duration: 30000, delay: 9000, direction: 'right' },
  { Icon: Fish, top: '80%', size: 34, duration: 38000, delay: 2000, direction: 'left' },
];

function Silhouette({ Icon, top, size, duration, delay, direction }: SilhouetteSpec) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      progress.value = 0.5;
      return;
    }
    progress.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false)
    );
    return () => cancelAnimation(progress);
  }, [reducedMotion, duration, delay, progress]);

  const from = direction === 'right' ? -size : SCREEN_WIDTH + size;
  const to = direction === 'right' ? SCREEN_WIDTH + size : -size;

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: from + (to - from) * progress.value }],
  }));

  return (
    <Animated.View style={[{ position: 'absolute', top }, style]}>
      <Icon size={size} color="#0F172A" strokeWidth={1.5} opacity={0.05} />
    </Animated.View>
  );
}

/**
 * Envoltorio de pantalla con siluetas de animalitos viajando lento de lado a lado detrás del
 * contenido (pedido explícito del usuario, 2026-09-14, para cuidador y establecimiento por
 * igual). A diferencia de la web, acá no hay un único punto de inserción global: cada pantalla
 * pinta su propio `bg-background` opaco (View o ScrollView raíz), así que este componente
 * reemplaza ese contenedor raíz — pantalla por pantalla — en vez de vivir una sola vez en
 * `_layout.tsx`.
 */
export function ScreenBackground({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View className="flex-1 bg-background" style={style}>
      <View className="absolute inset-0 overflow-hidden" pointerEvents="none">
        {SILHOUETTES.map((spec, index) => (
          <Silhouette key={index} {...spec} />
        ))}
      </View>
      {children}
    </View>
  );
}
