// Valores literales del addendum "Motion & Materials" de design-system/petapp/MASTER.md
// (2026-09-01) — no inventar springs nuevos, reutilizar estos donde aplique.
import type { Transition, Variants } from 'motion/react';

/** Aparecer/mover por defecto: cards, modales, navegación. Sin rebote. */
export const SPRING_DEFAULT: Transition = { type: 'spring', bounce: 0, duration: 0.35 };

/** Sheet / bottom-sheet / drawer: rebote ligero. */
export const SPRING_SHEET: Transition = { type: 'spring', bounce: 0.15, duration: 0.3 };

/** Gesto con momentum (swipe, drag-to-reorder): rebote leve, solo con velocidad de gesto. */
export const SPRING_GESTURE: Transition = { type: 'spring', bounce: 0.2, duration: 0.35 };

/** Cross-fade sin overshoot para `prefers-reduced-motion` (reemplaza cualquier spring/slide). */
export const REDUCED_MOTION_TRANSITION: Transition = { duration: 0.18, ease: 'linear' };

/**
 * Item de una lista que aparece (calendario preventivo, directorio, mascotas):
 * fade + translateY 8-12px, stagger 30-50ms, tope de las primeras 8 filas.
 */
export function listItemVariants(index: number): Variants {
  const delay = Math.min(index, 7) * 0.04;
  return {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { ...SPRING_DEFAULT, duration: 0.25, delay },
    },
  };
}
