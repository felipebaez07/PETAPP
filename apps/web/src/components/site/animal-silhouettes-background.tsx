import { Bird, Cat, Dog, Fish, PawPrint } from 'lucide-react';

interface Silhouette {
  Icon: typeof PawPrint;
  top: string;
  size: number;
  duration: string;
  delay: string;
  direction: 'right' | 'left';
}

// Posiciones/velocidades fijas (no aleatorias en cada render): en un server component esto se
// serializa una sola vez, así que un `Math.random()` por request haría que el layout "saltara"
// en cada navegación en vez de sentirse como una sola textura de fondo continua.
const SILHOUETTES: Silhouette[] = [
  { Icon: PawPrint, top: '8%', size: 56, duration: '85s', delay: '0s', direction: 'right' },
  { Icon: Bird, top: '22%', size: 44, duration: '110s', delay: '-20s', direction: 'left' },
  { Icon: Cat, top: '40%', size: 64, duration: '95s', delay: '-45s', direction: 'right' },
  { Icon: Fish, top: '58%', size: 48, duration: '120s', delay: '-10s', direction: 'left' },
  { Icon: Dog, top: '74%', size: 60, duration: '100s', delay: '-60s', direction: 'right' },
  { Icon: PawPrint, top: '90%', size: 36, duration: '75s', delay: '-30s', direction: 'left' },
];

/**
 * Textura de fondo decorativa — siluetas de animalitos viajando lento de lado a lado, detrás de
 * todo el contenido, en cada pantalla de la app (pedido explícito del usuario, 2026-09-14). Vive
 * en el layout raíz (`app/layout.tsx`) así que no hay que agregarla pantalla por pantalla.
 *
 * Muy baja opacidad (5%) y `pointer-events-none`: es textura, no puede competir con el contenido
 * ni interceptar clics. La animación (`@keyframes drift-right/left` en globals.css) se apaga con
 * `prefers-reduced-motion` — quedan las siluetas fijas en vez de desaparecer del todo.
 */
export function AnimalSilhouettesBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {SILHOUETTES.map(({ Icon, top, size, duration, delay, direction }, index) => (
        <Icon
          key={index}
          className={`absolute text-foreground/[0.05] ${direction === 'right' ? 'animate-drift-right' : 'animate-drift-left'}`}
          style={{ top, width: size, height: size, animationDuration: duration, animationDelay: delay }}
        />
      ))}
    </div>
  );
}
