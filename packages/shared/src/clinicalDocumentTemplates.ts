import type { ClinicalDocumentType } from './types';

/**
 * Plantillas por tipo de documento (0019_clinical_documents.sql) — pedido explícito del usuario:
 * en vez de un solo campo de texto libre, cada tipo pide solo lo que le hace falta (lo demás —
 * paciente, dueño, veterinario, fecha — ya se conoce y se rellena solo). Puramente de UI/lógica de
 * composición: NO cambia el esquema, `clinical_documents.content` sigue siendo un solo texto —
 * esto solo arma ese texto de forma consistente en vez de dejarlo en blanco.
 *
 * 'otro' queda deliberadamente sin plantilla (sigue siendo el textarea libre de siempre) — es la
 * válvula de escape para lo que no encaja en los otros cuatro tipos.
 */
export interface ClinicalDocumentTemplateField {
  key: string;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  required?: boolean;
}

export const CLINICAL_DOCUMENT_TEMPLATE_FIELDS: Record<ClinicalDocumentType, ClinicalDocumentTemplateField[]> = {
  consentimiento: [
    {
      key: 'procedimiento',
      label: 'Procedimiento o tratamiento a realizar',
      placeholder: 'Ej. Esterilización quirúrgica (ovariohisterectomía)',
      multiline: true,
      required: true,
    },
    {
      key: 'riesgos',
      label: 'Riesgos explicados al propietario',
      placeholder: 'Ej. Riesgos anestésicos generales, sangrado, infección post-quirúrgica',
      multiline: true,
      required: true,
    },
    { key: 'observaciones', label: 'Observaciones adicionales (opcional)', multiline: true },
  ],
  remision: [
    {
      key: 'motivo_remision',
      label: 'Motivo de la remisión',
      placeholder: 'Ej. Sospecha de patología cardíaca, requiere ecocardiograma',
      multiline: true,
      required: true,
    },
    {
      key: 'destino',
      label: 'Remitido a (especialista o clínica destino)',
      placeholder: 'Ej. Dr. Pérez — Cardiología veterinaria',
      required: true,
    },
    { key: 'resumen_clinico', label: 'Resumen clínico relevante', multiline: true },
  ],
  orden: [
    {
      key: 'examenes_solicitados',
      label: 'Exámenes o estudios solicitados',
      placeholder: 'Ej. Hemograma completo, radiografía de tórax',
      multiline: true,
      required: true,
    },
    { key: 'indicacion_clinica', label: 'Indicación clínica / motivo', multiline: true },
  ],
  formula: [
    {
      key: 'medicamentos',
      label: 'Medicamentos (nombre, dosis, vía, frecuencia, duración)',
      placeholder: 'Ej. Amoxicilina 250mg, 1 tableta vía oral cada 12h por 7 días',
      multiline: true,
      required: true,
    },
    { key: 'indicaciones', label: 'Indicaciones adicionales para el propietario', multiline: true },
  ],
  otro: [],
};

export interface ClinicalDocumentComposeContext {
  patientName: string;
  speciesLabel: string;
  breed: string | null;
  sexLabel: string;
  ownerName: string;
  vetName: string;
  establishmentName: string;
  dateLabel: string;
  /** Fecha/diagnóstico/tratamiento de la consulta vinculada, si el documento se generó desde una. */
  linkedVisitDateLabel?: string | null;
  linkedDiagnosis?: string | null;
  linkedTreatmentPlan?: string | null;
}

const CONSENT_STATEMENT =
  'Yo, como propietario/a del paciente arriba descrito, declaro haber sido informado/a por el ' +
  'veterinario tratante sobre el procedimiento propuesto, sus riesgos y alternativas, y autorizo ' +
  'su realización.';

function buildHeader(context: ClinicalDocumentComposeContext): string {
  const lines = [
    `Paciente: ${context.patientName} (${context.speciesLabel}${context.breed ? `, ${context.breed}` : ''}, ${context.sexLabel})`,
    `Propietario/a: ${context.ownerName}`,
    `Veterinario/a: ${context.vetName}`,
    `Establecimiento: ${context.establishmentName}`,
    `Fecha: ${context.dateLabel}`,
  ];
  if (context.linkedVisitDateLabel) {
    lines.push(`Consulta relacionada: ${context.linkedVisitDateLabel}`);
    if (context.linkedDiagnosis) lines.push(`Diagnóstico de esa consulta: ${context.linkedDiagnosis}`);
    if (context.linkedTreatmentPlan) lines.push(`Plan de tratamiento de esa consulta: ${context.linkedTreatmentPlan}`);
  }
  return lines.join('\n');
}

/**
 * Arma el `content` final a partir de las respuestas de la plantilla + los datos ya conocidos del
 * paciente/consulta. Para `otro`, `fieldAnswers` no se usa — se espera que el llamador ya tenga el
 * texto libre y solo quiera el encabezado (o directamente no llame a esta función y guarde el
 * texto tal cual, como hacía antes de esta plantilla).
 */
export function composeClinicalDocumentContent(
  documentType: ClinicalDocumentType,
  fieldAnswers: Record<string, string>,
  context: ClinicalDocumentComposeContext
): string {
  const header = buildHeader(context);
  const fields = CLINICAL_DOCUMENT_TEMPLATE_FIELDS[documentType];

  const sections = fields
    .map((field) => {
      const value = (fieldAnswers[field.key] ?? '').trim();
      if (!value) return null;
      return `${field.label}:\n${value}`;
    })
    .filter((section): section is string => section !== null);

  const parts = [header, ...sections];

  if (documentType === 'consentimiento') {
    parts.push(CONSENT_STATEMENT);
  }

  return parts.join('\n\n');
}
