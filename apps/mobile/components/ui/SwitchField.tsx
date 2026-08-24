import { Pressable, Switch, Text, View } from 'react-native';

interface SwitchFieldProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

/** Fila de toggle (usada para "Esterilizado"/"Vacunado" en el formulario de mascota). */
export function SwitchField({ label, description, value, onValueChange }: SwitchFieldProps) {
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      className="min-h-11 flex-row items-center justify-between gap-3 rounded-sm border border-border bg-card px-3 py-3"
    >
      <View className="flex-1">
        <Text className="font-bodyMedium text-sm text-foreground">{label}</Text>
        {description ? (
          <Text className="mt-0.5 font-body text-xs text-mutedForeground">{description}</Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#D6E4EA', true: '#10B981' }}
        thumbColor="#FFFFFF"
      />
    </Pressable>
  );
}
