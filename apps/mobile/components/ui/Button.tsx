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
    pressedBackgroundColor: '#0B2540',
  },
  secondary: {
    container: 'bg-secondary',
    text: 'text-white',
    contentColor: '#FFFFFF',
    pressedBackgroundColor: '#0B5B54',
  },
  accent: {
    container: 'bg-accent',
    text: 'text-white',
    contentColor: '#FFFFFF',
    pressedBackgroundColor: '#B45309',
  },
  outline: {
    container: 'border border-secondary bg-transparent',
    text: 'text-secondary',
    contentColor: '#0F766E',
    pressedBackgroundColor: '#F0FDFA',
  },
  ghost: {
    container: 'bg-transparent',
    text: 'text-primary',
    contentColor: '#123A5C',
    pressedBackgroundColor: '#EDF2F5',
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
