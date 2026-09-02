'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';
import { SPRING_DEFAULT, REDUCED_MOTION_TRANSITION } from '@/lib/motion';

/** Sección que aparece al hacer scroll — fade + translateY sutil, una sola vez. */
export function FadeInSection({ children, className }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.section
      className={className}
      initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={reduceMotion ? REDUCED_MOTION_TRANSITION : SPRING_DEFAULT}
    >
      {children}
    </motion.section>
  );
}
