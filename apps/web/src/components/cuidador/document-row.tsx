'use client';

import { useState, useTransition } from 'react';
import { motion } from 'motion/react';
import { FileText, ExternalLink, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PET_DOCUMENT_TYPE_LABELS, type PetDocument } from '@petapp/shared';
import { deletePetDocument } from '@/app/cuidador/mascotas/[id]/actions';

export function DocumentRow({ document, petId }: { document: PetDocument; petId: string }) {
  const [isPending, startTransition] = useTransition();
  const [removed, setRemoved] = useState(false);

  const onDelete = () => {
    setRemoved(true);
    startTransition(async () => {
      await deletePetDocument(document.id, petId);
    });
  };

  if (removed) return null;

  return (
    <motion.div
      layout
      animate={{ opacity: isPending ? 0.6 : 1 }}
      className="flex items-center gap-3 border-b border-border py-3 last:border-0"
    >
      <FileText className="size-5 shrink-0 text-primary" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">{document.title}</p>
        <Badge variant="outline">{PET_DOCUMENT_TYPE_LABELS[document.document_type]}</Badge>
      </div>
      {document.document_url ? (
        <Button asChild variant="ghost" size="icon" aria-label={`Abrir ${document.title}`}>
          <a href={document.document_url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-4" />
          </a>
        </Button>
      ) : null}
      {/* document.storage_path (archivo subido a Storage, bucket privado): abrirlo requiere
          generar una URL firmada — queda pendiente de implementar la subida real de archivos. */}
      <Button variant="ghost" size="icon" aria-label={`Eliminar ${document.title}`} onClick={onDelete}>
        <Trash2 className="size-4 text-destructive" />
      </Button>
    </motion.div>
  );
}
