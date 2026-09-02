'use client';

import { useState, useTransition } from 'react';
import { motion } from 'motion/react';
import { FileText, ExternalLink, Loader2, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PET_DOCUMENT_TYPE_LABELS, type PetDocument } from '@petapp/shared';
import { deletePetDocument, getSignedDocumentUrl } from '@/app/cuidador/mascotas/[id]/actions';

export function DocumentRow({ document, petId }: { document: PetDocument; petId: string }) {
  const [isPending, startTransition] = useTransition();
  const [removed, setRemoved] = useState(false);
  const [opening, setOpening] = useState(false);
  const [openError, setOpenError] = useState<string | null>(null);

  const onDelete = () => {
    setRemoved(true);
    startTransition(async () => {
      await deletePetDocument(document.id, petId);
    });
  };

  // `document.storage_path` (archivo subido al bucket privado `pet-documents`): no hay una URL
  // pública fija que abrir directamente. Se pide una URL firmada de 60s bajo demanda, justo al
  // hacer click — nunca se precomputa al renderizar la lista, porque expiraría o se pagaría el
  // costo de generarla para documentos que nadie llega a abrir.
  const onOpenSigned = async () => {
    setOpening(true);
    setOpenError(null);
    const result = await getSignedDocumentUrl(document.id);
    setOpening(false);
    if (result.ok && result.url) {
      window.open(result.url, '_blank', 'noopener,noreferrer');
    } else {
      setOpenError(result.error ?? 'No se pudo abrir el documento.');
    }
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
        {openError && <p className="mt-1 text-xs text-destructive">{openError}</p>}
      </div>
      {document.document_url ? (
        <Button asChild variant="ghost" size="icon" aria-label={`Abrir ${document.title}`}>
          <a href={document.document_url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-4" />
          </a>
        </Button>
      ) : document.storage_path ? (
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Abrir ${document.title}`}
          onClick={onOpenSigned}
          disabled={opening}
        >
          {opening ? <Loader2 className="size-4 animate-spin" /> : <ExternalLink className="size-4" />}
        </Button>
      ) : null}
      <Button variant="ghost" size="icon" aria-label={`Eliminar ${document.title}`} onClick={onDelete}>
        <Trash2 className="size-4 text-destructive" />
      </Button>
    </motion.div>
  );
}
