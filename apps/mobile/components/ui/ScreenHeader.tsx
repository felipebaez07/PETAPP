import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}

/** Barra superior navy usada en cada pestaña (los Stacks internos usan el header nativo). */
export function ScreenHeader({ title, subtitle, right }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="bg-primary px-5 pb-4" style={{ paddingTop: insets.top + 12 }}>
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Text className="font-headingBold text-3xl leading-9 tracking-tight text-white">{title}</Text>
          {subtitle ? <Text className="mt-1 font-body text-sm leading-5 text-white/80">{subtitle}</Text> : null}
        </View>
        {right ? <View>{right}</View> : null}
      </View>
    </View>
  );
}
