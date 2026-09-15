import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { CLINICAL_DOCUMENT_TYPE_LABELS, type ClinicalDocumentType } from '@petapp/shared';

/**
 * Documento PDF real (pedido explícito del usuario: no solo "Guardar como PDF" del navegador vía
 * `window.print()`, sino un botón de descarga que sirva desde el panel del establecimiento Y desde
 * la vista del cuidador). Usa la API de `@react-pdf/renderer` (Document/Page/View/Text/Image de
 * ESTA librería, no elementos de DOM normales) — se renderiza a PDF real con `renderToBuffer` en
 * `app/api/documentos/[documentId]/pdf/route.ts`.
 *
 * Deliberadamente NO reusa componentes de `@/components/ui/*` (Card, Badge, etc.) — esos son JSX
 * de DOM/Tailwind, incompatibles con el motor de layout de react-pdf.
 */

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontSize: 10.5,
    fontFamily: 'Helvetica',
    color: '#0C2233',
  },
  letterheadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  logo: {
    width: 48,
    height: 48,
    objectFit: 'contain',
  },
  establishmentName: {
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    color: '#0369A1',
  },
  establishmentMeta: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 1,
  },
  hr: {
    borderBottomWidth: 1,
    borderBottomColor: '#D6E4EA',
    marginVertical: 14,
  },
  docTypeLabel: {
    fontSize: 8.5,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 3,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 10,
  },
  infoBlock: {
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  infoLabel: {
    fontFamily: 'Helvetica-Bold',
    width: 90,
  },
  infoValue: {
    flex: 1,
  },
  body: {
    marginTop: 4,
  },
  bodyParagraph: {
    marginBottom: 6,
    lineHeight: 1.5,
  },
  signatureArea: {
    marginTop: 32,
  },
  signatureLine: {
    marginTop: 28,
    borderTopWidth: 1,
    borderTopColor: '#0C2233',
    width: 260,
    paddingTop: 4,
    fontSize: 9,
    color: '#64748B',
  },
  signedText: {
    fontSize: 10,
  },
});

function formatDateTime(isoStr: string): string {
  const date = new Date(isoStr);
  if (Number.isNaN(date.getTime())) return isoStr;
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
}

export interface ClinicalDocumentPdfProps {
  title: string;
  documentType: ClinicalDocumentType;
  content: string;
  createdAt: string;
  signerName: string | null;
  signedAt: string | null;
  patientName: string;
  speciesLabel: string;
  breed: string | null;
  sexLabel: string;
  ownerName: string;
  establishmentName: string;
  establishmentAddress: string | null;
  establishmentPhone: string | null;
  establishmentLogoUrl: string | null;
}

export function ClinicalDocumentPdf({
  title,
  documentType,
  content,
  createdAt,
  signerName,
  signedAt,
  patientName,
  speciesLabel,
  breed,
  sexLabel,
  ownerName,
  establishmentName,
  establishmentAddress,
  establishmentPhone,
  establishmentLogoUrl,
}: ClinicalDocumentPdfProps) {
  const paragraphs = content.split('\n');

  return (
    <Document title={title}>
      <Page size="A4" style={styles.page}>
        {/* Membrete del establecimiento — "como si fuera un documento con formato de la empresa
            vinculada", pedido explícito del usuario. */}
        <View style={styles.letterheadRow}>
          {establishmentLogoUrl && <Image src={establishmentLogoUrl} style={styles.logo} />}
          <View>
            <Text style={styles.establishmentName}>{establishmentName}</Text>
            {establishmentAddress && <Text style={styles.establishmentMeta}>{establishmentAddress}</Text>}
            {establishmentPhone && <Text style={styles.establishmentMeta}>Tel. {establishmentPhone}</Text>}
          </View>
        </View>
        <View style={styles.hr} />

        <Text style={styles.docTypeLabel}>{CLINICAL_DOCUMENT_TYPE_LABELS[documentType]}</Text>
        <Text style={styles.title}>{title}</Text>

        <View style={styles.infoBlock}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Paciente:</Text>
            <Text style={styles.infoValue}>
              {patientName} ({speciesLabel}
              {breed ? `, ${breed}` : ''}, {sexLabel})
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Propietario/a:</Text>
            <Text style={styles.infoValue}>{ownerName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha:</Text>
            <Text style={styles.infoValue}>{formatDateTime(createdAt)}</Text>
          </View>
        </View>

        <View style={styles.hr} />

        <View style={styles.body}>
          {paragraphs.map((line, index) => (
            <Text key={index} style={styles.bodyParagraph}>
              {line.length > 0 ? line : ' '}
            </Text>
          ))}
        </View>

        <View style={styles.hr} />

        <View style={styles.signatureArea}>
          {signedAt ? (
            <Text style={styles.signedText}>
              Firmado por {signerName ?? 'el dueño'} el {formatDateTime(signedAt)}.
            </Text>
          ) : (
            <View style={styles.signatureLine}>
              <Text>Firma del propietario</Text>
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
}
