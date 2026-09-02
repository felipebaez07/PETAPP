'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';
import { listItemVariants, REDUCED_MOTION_TRANSITION } from '@/lib/motion';

/**
 * Envoltorio para filas de listas que aparecen (calendario preventivo, directorio,
 * mascotas, documentos): fade + translateY, stagger de 30-50ms con tope de 8 filas
 * (design-system/petapp/MASTER.md, addendum "Motion & Materials"). Con
 * `prefers-reduced-motion`, cae a un cross-fade simple sin desplazamiento.
 */
export function RevealItem({
  index,
  children,
  className,
  as: Component = 'div',
}: {
  index: number;
  children: ReactNode;
  className?: string;
  as?: 'div' | 'li';
}) {
  const reduceMotion = useReducedMotion();
  const MotionComponent = Component === 'li' ? motion.li : motion.div;

  if (reduceMotion) {
    return (
      <MotionComponent
        className={className}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={REDUCED_MOTION_TRANSITION}
      >
        {children}
      </MotionComponent>
    );
  }

  return (
    <MotionComponent
      className={className}
      initial="hidden"
      animate="visible"
      variants={listItemVariants(index)}
    >
      {children}
    </MotionComponent>
  );
}
