import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  children: ReactNode;
}

/** Superficie elevada del sistema de diseño: sombra suave real, sin borde (profundidad en vez de contorno). */
export function Card({ children, className, ...props }: CardProps) {
  return (
    <View className={`rounded-xl bg-card shadow-sm ${className ?? ''}`} {...props}>
      {children}
    </View>
  );
}
