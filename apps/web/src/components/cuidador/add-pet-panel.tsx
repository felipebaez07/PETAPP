'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PetForm } from './pet-form';
import { SPRING_SHEET } from '@/lib/motion';

export function AddPetPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-6">
      {!open && (
        <Button onClick={() => setOpen(true)} variant="secondary" className="gap-1.5">
          <Plus className="size-4" /> Agregar mascota
        </Button>
      )}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={SPRING_SHEET}
            className="overflow-hidden"
          >
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle>Nueva mascota</CardTitle>
                <Button variant="ghost" size="icon" aria-label="Cerrar" onClick={() => setOpen(false)}>
                  <X className="size-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <PetForm onDone={() => setOpen(false)} />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
