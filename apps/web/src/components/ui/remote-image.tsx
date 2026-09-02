'use client';

import { useState, type ReactNode } from 'react';

interface RemoteImageProps {
  src?: string | null;
  size: number;
  /**
   * Ícono de respaldo ya renderizado (ej. `<PawPrint className="size-6" aria-hidden />`), NO
   * el componente en sí. Pasar el componente (`icon={PawPrint}`) desde un Server Component
   * revienta en producción con "Functions cannot be passed directly to Client Components" —
   * una referencia a un componente de `lucide-react` (hecho con `forwardRef`) no es
   * serializable a través del límite servidor/cliente, un elemento JSX ya renderizado sí.
   */
  icon: ReactNode;
  alt: string;
  className?: string;
}

/**
 * Imagen remota (foto de mascota, logo/portada de establecimiento) con fallback a un ícono
 * cuando no hay URL o cuando la carga falla — nunca un cuadro roto. Equivalente web de
 * `apps/mobile/components/ui/RemoteImage.tsx`. Se usa `<img>` nativo en vez de `next/image`
 * porque las URLs vienen de Supabase Storage (dominio variable por proyecto) y no vale la pena
 * configurar `remotePatterns` para un caso de bajo riesgo visual.
 */
export function RemoteImage({ src, size, icon, alt, className }: RemoteImageProps) {
  const [failed, setFailed] = useState(false);
  const showFallback = !src || failed;

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted ${className ?? ''}`}
      style={{ width: size, height: size }}
    >
      {showFallback ? (
        icon
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- dominio externo variable, ver comentario arriba
        <img
          src={src ?? undefined}
          alt={alt}
          width={size}
          height={size}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
