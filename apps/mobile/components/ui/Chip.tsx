import type { LucideIcon } from 'lucide-react-native';
import { Pressable, Text } from 'react-native';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: LucideIcon;
}

/** Chip de filtro/selección. Radio 8px (sm) según el design system, nunca pill gigante. */
export function Chip({ label, selected, onPress, icon: Icon }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={`min-h-11 flex-row items-center gap-1.5 rounded-sm border px-3 ${
        selected ? 'border-primary bg-primary' : 'border-border bg-card'
      }`}
    >
      {Icon ? <Icon size={14} color={selected ? '#FFFFFF' : '#64748B'} /> : null}
      <Text className={`font-bodyMedium text-sm ${selected ? 'text-white' : 'text-foreground'}`}>{label}</Text>
    </Pressable>
  );
}
