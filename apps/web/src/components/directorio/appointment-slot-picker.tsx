'use client';

import { useId, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { appointmentSlotHours, formatAppointmentSlotLabel, todayLocalDateString } from '@petapp/shared';
import { Label } from '@/components/ui/label';
import { SPRING_SHEET, REDUCED_MOTION_TRANSITION } from '@/lib/motion';

/**
 * Reemplaza el `<input type="datetime-local">` de "reloj completo" por día + franjas de una hora
 * (pedido explícito: nada de elegir cualquier minuto, solo bloques como "1:00 p. m. – 2:00 p. m.").
 * Sigue guardando el mismo string local "AAAA-MM-DDTHH:mm" en el input oculto
 * `preferred_datetime_local` que el `onSubmit` de `ServiceRequestForm` ya sabe leer y redondear —
 * cero cambios en esa lógica, solo en el widget que arma el valor.
 */
export function AppointmentSlotPicker() {
  const [date, setDate] = useState('');
  const [hour, setHour] = useState<number | null>(null);
  const dateId = useId();
  const reduceMotion = useReducedMotion();

  const value = date && hour !== null ? `${date}T${String(hour).padStart(2, '0')}:00` : '';

  return (
    <div className="space-y-2">
      <Label htmlFor={dateId}>Fecha y hora preferida (opcional)</Label>
      <input
        id={dateId}
        type="date"
        min={todayLocalDateString()}
        value={date}
        onChange={(e) => {
          setDate(e.target.value);
          setHour(null);
        }}
        className="w-full rounded-sm border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <AnimatePresence initial={false}>
        {date && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={reduceMotion ? REDUCED_MOTION_TRANSITION : SPRING_SHEET}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-3">
              {appointmentSlotHours().map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHour((prev) => (prev === h ? null : h))}
                  className={`rounded-sm border px-2 py-2 text-xs font-medium transition-colors duration-150 ${
                    hour === h
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input bg-card text-foreground hover:bg-muted'
                  }`}
                >
                  {formatAppointmentSlotLabel(h)}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <input type="hidden" name="preferred_datetime_local" value={value} />
      <p className="text-xs text-muted-foreground">Si no eliges una, coordinamos por WhatsApp.</p>
    </div>
  );
}
