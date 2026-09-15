import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Download } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { PrintButton } from '@/components/panel/print-button';
import { CLINICAL_DOCUMENT_TYPE_LABELS, type ClinicalDocument, type Establishment } from '@petapp/shared';

interface ClinicalDocumentRow extends ClinicalDocument {
  clinical_patient: { name: string } | null;
}

function formatDateTime(isoStr: string): string {
  const date = new Date(isoStr);
  if (Number.isNaN(date.getTime())) return isoStr;
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Vista imprimible de un solo documento (consentimiento, remisión, orden, fórmula) para que el
 * establecimiento le entregue una copia física al dueño. El botón "Imprimir" (`PrintButton`) solo
 * llama a `window.print()` (el propio "Guardar como PDF" del navegador cubre ese caso); el botón
 * "Descargar PDF" en cambio pega contra `/api/documentos/[documentId]/pdf`, que sí genera un PDF
 * real con `@react-pdf/renderer`. `print:hidden` en el layout del panel (`(dashboard)/layout.tsx`)
 * oculta la barra lateral al imprimir, para que quede solo esto. El membrete de acá abajo (nombre/
 * dirección/teléfono/logo del establecimiento) es solo para la vista en pantalla/impresión — el
 * PDF descargable arma su propio membrete por separado en `lib/pdf/clinical-document-pdf.tsx`.
 */
export default async function ClinicalDocumentPrintPage({
  params,
}: {
  params: Promise<{ id: string; documentId: string }>;
}) {
  const { id, documentId } = await params;
  const user = await getCurrentUser();
  if (!user?.establishment) redirect('/panel');

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('clinical_documents')
    .select('*, clinical_patient:clinical_patients(name)')
    .eq('id', documentId)
    .eq('clinical_patient_id', id)
    .eq('establishment_id', user.establishment.id)
    .maybeSingle();

  if (!data) notFound();
  const doc = data as unknown as ClinicalDocumentRow;
  const establishment: Establishment = user.establishment;

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between gap-3 print:hidden">
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link href={`/panel/pacientes/${id}`}>
            <ArrowLeft className="size-4" /> Volver al paciente
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" className="gap-1.5 print:hidden">
            <a href={`/api/documentos/${doc.id}/pdf`} target="_blank" rel="noopener noreferrer">
              <Download className="size-4" /> Descargar PDF
            </a>
          </Button>
          <PrintButton />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-8 print:border-0 print:p-0 print:shadow-none">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          {establishment.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element -- vista de impresión/PDF-adjacente, no hace falta next/image acá.
            <img src={establishment.logo_url} alt={establishment.name} className="h-12 w-auto" />
          )}
          <div>
            <p className="font-heading text-base font-semibold text-foreground">{establishment.name}</p>
            {establishment.address && <p className="text-xs text-muted-foreground">{establishment.address}</p>}
            {establishment.phone && <p className="text-xs text-muted-foreground">Tel. {establishment.phone}</p>}
          </div>
        </div>

        <p className="mt-6 text-xs uppercase tracking-wide text-muted-foreground">
          {CLINICAL_DOCUMENT_TYPE_LABELS[doc.document_type]}
        </p>
        <h1 className="font-heading text-2xl font-bold text-foreground">{doc.title}</h1>
        <div className="mt-2 space-y-0.5 text-sm text-muted-foreground">
          <p>Paciente: {doc.clinical_patient?.name ?? 'Sin registrar'}</p>
          <p>Fecha: {formatDateTime(doc.created_at)}</p>
        </div>

        <hr className="my-6 border-border" />

        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{doc.content}</p>

        <hr className="my-6 border-border" />

        {doc.signed_at ? (
          <p className="text-sm text-foreground/90">
            Firmado por <span className="font-medium">{doc.signer_name ?? 'el dueño'}</span> el{' '}
            {formatDateTime(doc.signed_at)}.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Pendiente de firma.</p>
        )}
      </div>
    </div>
  );
}
