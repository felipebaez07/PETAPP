import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Pressable, Text, type GestureResponderEvent } from 'react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'accent' | 'ghost';
type ButtonSize = 'md' | 'lg';

const VARIANT_STYLES: Record<
  ButtonVariant,
  { container: string; text: string; contentColor: string; pressedBackgroundColor: string }
> = {
  primary: {
    container: 'bg-primary',
    text: 'text-white',
    contentColor: '#FFFFFF',
    pressedBackgroundColor: '#075985',
  },
  secondary: {
    // El menta (#10B981) es demasiado claro para texto/ícono blanco encima — pasa a texto oscuro.
    container: 'bg-secondary',
    text: 'text-secondaryForeground',
    contentColor: '#0C2233',
    pressedBackgroundColor: '#047857',
  },
  accent: {
    container: 'bg-accent',
    text: 'text-white',
    contentColor: '#FFFFFF',
    pressedBackgroundColor: '#B45309',
  },
  outline: {
    // Usa `success` (más oscuro que `secondary`) en vez del menta plano: el menta como
    // borde/texto sobre blanco no alcanza el contraste mínimo de 3:1.
    container: 'border border-success bg-transparent',
    text: 'text-success',
    contentColor: '#059669',
    pressedBackgroundColor: '#ECFDF5',
  },
  ghost: {
    container: 'bg-transparent',
    text: 'text-primary',
    contentColor: '#0369A1',
    pressedBackgroundColor: '#E7EEF2',
  },
};

interface ButtonProps {
  label: string;
  onPress?: (event: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  testID?: string;
}

/** Botón base del sistema de diseño. Sin bounce/squish: solo cambia de tono al presionar. */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  disabled = false,
  loading = false,
  fullWidth = true,
  testID,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const styles = VARIANT_STYLES[variant];
  const sizeClasses = size === 'lg' ? 'px-5 py-4' : 'px-4 py-3';

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      style={({ pressed }) =>
        pressed && !isDisabled ? { backgroundColor: styles.pressedBackgroundColor } : undefined
      }
      className={[
        'min-h-11 flex-row items-center justify-center gap-2 rounded-md',
        sizeClasses,
        fullWidth ? 'w-full' : '',
        styles.container,
        isDisabled ? 'opacity-50' : '',
      ].join(' ')}
    >
      {loading ? (
        <ActivityIndicator color={styles.contentColor} />
      ) : (
        <>
          {Icon ? <Icon size={20} color={styles.contentColor} /> : null}
          <Text className={`font-bodySemibold text-base ${styles.text}`}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}
