import type { LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Image, View } from 'react-native';

interface RemoteImageProps {
  uri?: string | null;
  size: number;
  icon: LucideIcon;
  iconColor?: string;
  className?: string;
}

/**
 * Imagen remota (logo/portada) con fallback a un ícono Lucide cuando no hay URL o cuando
 * la carga falla — nunca un cuadro roto. Usado por la tarjeta del directorio, la ficha
 * pública del prestador y la previsualización del formulario de perfil del negocio.
 */
export function RemoteImage({ uri, size, icon: Icon, iconColor = '#0369A1', className }: RemoteImageProps) {
  const [failed, setFailed] = useState(false);
  const showFallback = !uri || failed;

  return (
    <View
      className={`items-center justify-center overflow-hidden rounded-md bg-backgroundAlt ${className ?? ''}`}
      style={{ width: size, height: size }}
      // Decorativo: siempre acompaña un texto (nombre del establecimiento/mascota) que ya
      // transmite la misma información — logo/portada real o el ícono de reemplazo.
      accessible={false}
    >
      {showFallback ? (
        <Icon size={Math.round(size * 0.5)} color={iconColor} />
      ) : (
        <Image
          source={{ uri }}
          style={{ width: size, height: size }}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
      )}
    </View>
  );
}
