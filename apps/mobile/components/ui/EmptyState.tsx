import type { LucideIcon } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { Button } from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Estado vacío real (con icono, mensaje y acción opcional), nunca una pantalla en blanco silenciosa. */
export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center gap-3 px-8 py-16">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Icon size={28} color="#64748B" />
      </View>
      <Text className="text-center font-heading text-lg text-foreground">{title}</Text>
      {description ? (
        <Text className="text-center font-body text-sm text-mutedForeground">{description}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <View className="mt-2 w-full max-w-xs">
          <Button label={actionLabel} onPress={onAction} variant="outline" />
        </View>
      ) : null}
    </View>
  );
}
