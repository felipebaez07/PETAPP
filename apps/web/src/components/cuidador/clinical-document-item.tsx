'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Download, FileSignature, RotateCcw, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CLINICAL_DOCUMENT_TYPE_LABELS, type ClinicalDocument } from '@petapp/shared';
import {
  archiveClinicalDocumentForOwner,
  restoreClinicalDocumentForOwner,
  signClinicalDocument,
} from '@/app/cuidador/mascotas/[id]/actions';

function formatDateTime(isoStr: string): string {
  const date = new Date(isoStr);
  if (Number.isNaN(date.getTime())) return isoStr;
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Fila de un documento clínico (consentimiento, remisión, orden, fórmula) redactado por el
 * establecimiento (0019_clinical_documents.sql) — vista del cuidador. Si ya está firmado, solo
 * muestra "Firmado por X el <fecha>"; si no, ofrece un formulario mínimo (nombre + botón) para
 * "firmar" — recordatorio explícito del alcance real: esto NO es una firma electrónica con validez
 * legal plena, es solo escribir el nombre y aceptar.
 */
export function ClinicalDocumentItem({
  doc,
  defaultSignerName,
  archived = false,
}: {
  doc: ClinicalDocument;
  defaultSignerName: string;
  /** true = esta fila vive en la subsección "Documentos eliminados": muestra "Restaurar" en vez
   * de "Eliminar". Ver `archiveClinicalDocumentForOwner`/`restoreClinicalDocumentForOwner`. */
  archived?: boolean;
}) {
  const router = useRouter();
  const [signerName, setSignerName] = useState(defaultSignerName);
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSign = async (e: FormEvent) => {
    e.preventDefault();
    if (!signerName.trim()) {
      setError('Escribe tu nombre para firmar.');
      return;
    }
    setSaving(true);
    setError(null);
    const result = await signClinicalDocument(doc.id, signerName.trim());
    setSaving(false);
    if (result.ok) {
      router.refresh();
    } else {
      setError(result.error ?? 'No se pudo firmar el documento.');
    }
  };

  // "Eliminar" acá solo lo quita de la vista del cuidador (0021_clinical_documents_owner_archive.sql)
  // — el establecimiento sigue teniendo su propio registro clínico. No hace falta confirmar con un
  // window.confirm: se puede deshacer en cualquier momento desde "Documentos eliminados".
  const onToggleArchive = async () => {
    setArchiving(true);
    setError(null);
    const result = archived ? await restoreClinicalDocumentForOwner(doc.id) : await archiveClinicalDocumentForOwner(doc.id);
    if (result.ok) {
      router.refresh();
    } else {
      setArchiving(false);
      setError(result.error ?? 'No se pudo completar la acción.');
    }
  };

  return (
    <div className="space-y-2 border-b border-border py-3 last:border-0">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-foreground">{doc.title}</p>
        <Badge variant="outline">{CLINICAL_DOCUMENT_TYPE_LABELS[doc.document_type]}</Badge>
      </div>
      <p className="line-clamp-4 whitespace-pre-wrap text-sm text-foreground/90">{doc.content}</p>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <a href={`/api/documentos/${doc.id}/pdf`} target="_blank" rel="noopener noreferrer">
            <Download className="size-4" /> Descargar PDF
          </a>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={archiving}
          onClick={onToggleArchive}
          className={archived ? 'gap-1.5' : 'gap-1.5 text-destructive hover:bg-destructive/10'}
        >
          {archived ? (
            <>
              <RotateCcw className="size-4" /> Restaurar
            </>
          ) : (
            <>
              <Trash2 className="size-4" /> Eliminar
            </>
          )}
        </Button>
      </div>
      {doc.signed_at ? (
        <Badge variant="success">
          Firmado por {doc.signer_name ?? 'ti'} el {formatDateTime(doc.signed_at)}
        </Badge>
      ) : (
        <form onSubmit={onSign} className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label htmlFor={`signer-${doc.id}`}>Tu nombre</Label>
            <Input
              id={`signer-${doc.id}`}
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="Nombre completo"
              className="w-56"
            />
          </div>
          <Button type="submit" size="sm" disabled={saving} className="gap-1.5">
            <FileSignature className="size-4" /> {saving ? 'Firmando…' : 'Firmar'}
          </Button>
        </form>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
