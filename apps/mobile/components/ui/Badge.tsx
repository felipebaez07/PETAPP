import type { LucideIcon } from 'lucide-react-native';
import { Text, View } from 'react-native';

export type BadgeTone = 'success' | 'muted' | 'accent' | 'secondary' | 'destructive' | 'primary';

const TONE_BG: Record<BadgeTone, string> = {
  success: 'bg-success',
  muted: 'bg-muted',
  accent: 'bg-accent',
  secondary: 'bg-secondary',
  destructive: 'bg-destructive',
  primary: 'bg-primary',
};

const TONE_TEXT: Record<BadgeTone, string> = {
  success: 'text-white',
  muted: 'text-mutedForeground',
  accent: 'text-white',
  secondary: 'text-white',
  destructive: 'text-white',
  primary: 'text-white',
};

const TONE_ICON_COLOR: Record<BadgeTone, string> = {
  success: '#FFFFFF',
  muted: '#64748B',
  accent: '#FFFFFF',
  secondary: '#FFFFFF',
  destructive: '#FFFFFF',
  primary: '#FFFFFF',
};

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  icon?: LucideIcon;
}

/**
 * Insignia sólida de una sola línea. `tone="accent"` (ámbar) debe usarse
 * únicamente en pantallas de adopción, según el sistema de diseño.
 */
export function Badge({ label, tone = 'muted', icon: Icon }: BadgeProps) {
  return (
    <View className={`flex-row items-center gap-1 self-start rounded-sm px-2 py-1 ${TONE_BG[tone]}`}>
      {Icon ? <Icon size={12} color={TONE_ICON_COLOR[tone]} /> : null}
      <Text className={`font-bodySemibold text-xs ${TONE_TEXT[tone]}`}>{label}</Text>
    </View>
  );
}
