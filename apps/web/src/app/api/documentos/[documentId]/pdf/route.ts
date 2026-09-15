import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ClinicalDocumentPdf } from '@/lib/pdf/clinical-document-pdf';
import { SPECIES_LABELS, type ClinicalDocument, type PetSex, type PetSpecies } from '@petapp/shared';

// react-pdf necesita APIs de Node (Buffer, streams, fuentes) — no corre en el Edge runtime.
export const runtime = 'nodejs';

// Ver el mismo comentario en pacientes/[id]/page.tsx: no hay un `constants.ts` compartido para
// el sexo, se mantiene local acá.
const SEX_LABELS: Record<PetSex, string> = {
  macho: 'Macho',
  hembra: 'Hembra',
  desconocido: 'Desconocido',
};

interface ClinicalDocumentPdfRow extends ClinicalDocument {
  clinical_patient: {
    name: string;
    species: PetSpecies;
    breed: string | null;
    sex: PetSex;
    owner_full_name: string | null;
    pet: { owner: { full_name: string } | null } | null;
  } | null;
  establishment: {
    name: string;
    address: string | null;
    phone: string | null;
    logo_url: string | null;
  } | null;
}

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'documento'
  );
}

/**
 * Descarga un documento clínico (consentimiento/remisión/orden/fórmula) como PDF real — pedido
 * explícito del usuario, distinto de `window.print()`. Se usa el cliente de Supabase con la
 * SESIÓN normal (no el admin) a propósito: la RLS de `clinical_documents` (0019_clinical_documents.sql)
 * ya deja pasar exactamente a quien debe poder ver este documento — dueño/personal del
 * establecimiento (policies `..._establishment_full_access` / `..._staff_full_access`) o el dueño
 * de la mascota (`clinical_documents_pet_owner_read`) — así que basta con dejar que la propia
 * consulta filtrada por RLS decida; si no devuelve nada, es 404 en vez de una fuga de información
 * sobre si el documento existe o no.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await params;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('clinical_documents')
    .select(
      '*, clinical_patient:clinical_patients(name, species, breed, sex, owner_full_name, pet:pets(owner:profiles(full_name))), establishment:establishments(name, address, phone, logo_url)'
    )
    .eq('id', documentId)
    .maybeSingle();

  if (!data) {
    return new NextResponse('Documento no encontrado', { status: 404 });
  }

  const doc = data as unknown as ClinicalDocumentPdfRow;
  if (!doc.clinical_patient || !doc.establishment) {
    return new NextResponse('Documento no encontrado', { status: 404 });
  }

  const ownerName =
    doc.clinical_patient.pet?.owner?.full_name ?? doc.clinical_patient.owner_full_name ?? 'Sin registrar';

  const buffer = await renderToBuffer(
    ClinicalDocumentPdf({
      title: doc.title,
      documentType: doc.document_type,
      content: doc.content,
      createdAt: doc.created_at,
      signerName: doc.signer_name,
      signedAt: doc.signed_at,
      patientName: doc.clinical_patient.name,
      speciesLabel: SPECIES_LABELS[doc.clinical_patient.species],
      breed: doc.clinical_patient.breed,
      sexLabel: SEX_LABELS[doc.clinical_patient.sex],
      ownerName,
      establishmentName: doc.establishment.name,
      establishmentAddress: doc.establishment.address,
      establishmentPhone: doc.establishment.phone,
      establishmentLogoUrl: doc.establishment.logo_url,
    })
  );

  const filename = `${slugify(doc.title)}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
