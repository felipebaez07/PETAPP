'use client';

import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';

interface RemoteImageProps {
  src?: string | null;
  size: number;
  icon: LucideIcon;
  alt: string;
  className?: string;
}

/**
 * Imagen remota (foto de mascota, logo/portada de establecimiento) con fallback a un ícono
 * Lucide cuando no hay URL o cuando la carga falla — nunca un cuadro roto. Equivalente web de
 * `apps/mobile/components/ui/RemoteImage.tsx`. Se usa `<img>` nativo en vez de `next/image`
 * porque las URLs vienen de Supabase Storage (dominio variable por proyecto) y no vale la pena
 * configurar `remotePatterns` para un caso de bajo riesgo visual.
 */
export function RemoteImage({ src, size, icon: Icon, alt, className }: RemoteImageProps) {
  const [failed, setFailed] = useState(false);
  const showFallback = !src || failed;

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted ${className ?? ''}`}
      style={{ width: size, height: size }}
    >
      {showFallback ? (
        <Icon className="text-secondary" style={{ width: size * 0.5, height: size * 0.5 }} aria-hidden />
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
