'use client';

import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Botón "Imprimir" para la vista imprimible de un documento clínico
 * (`pacientes/[id]/documentos/[documentId]/page.tsx`). Sin librería de PDF — este código no tiene
 * ninguna, y `window.print()` alcanza: el propio diálogo de impresión del navegador ya ofrece
 * "Guardar como PDF". `print:hidden` se encarga de que el botón mismo no aparezca en el papel.
 */
export function PrintButton() {
  return (
    <Button onClick={() => window.print()} size="sm" className="gap-1.5 print:hidden">
      <Printer className="size-4" /> Imprimir
    </Button>
  );
}
