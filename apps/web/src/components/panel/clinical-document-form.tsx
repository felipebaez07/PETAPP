'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  CLINICAL_DOCUMENT_TYPE_LABELS,
  CLINICAL_DOCUMENT_TEMPLATE_FIELDS,
  composeClinicalDocumentContent,
  type ClinicalDocumentComposeContext,
  type ClinicalDocumentType,
  type ClinicalRecord,
} from '@petapp/shared';
import { createClinicalDocument } from '@/app/panel/(dashboard)/pacientes/[id]/actions';

const DOCUMENT_TYPE_OPTIONS = Object.entries(CLINICAL_DOCUMENT_TYPE_LABELS) as [ClinicalDocumentType, string][];

function formatDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
}

interface ClinicalDocumentFormProps {
  patientId: string;
  patientName: string;
  speciesLabel: string;
  breed: string | null;
  sexLabel: string;
  ownerName: string;
  establishmentName: string;
  vetName: string;
  /** Fecha de hoy ya formateada en el servidor — evita calcular "hoy" en un componente cliente,
   * lo que podría desalinear el render de servidor y de cliente (hidratación). */
  todayLabel: string;
  records: ClinicalRecord[];
}

/**
 * Formulario "Nuevo documento" del panel de establecimiento (0019_clinical_documents.sql),
 * extraído de `pacientes/[id]/page.tsx` a componente cliente para poder armar el `content` final
 * ANTES de enviar — pedido explícito del usuario: cada tipo de documento pide solo lo específico
 * (ver `CLINICAL_DOCUMENT_TEMPLATE_FIELDS` en `@petapp/shared`) y autocompleta el resto
 * (paciente/dueño/veterinario/establecimiento/fecha, y los datos de la consulta vinculada si la
 * hay) usando `composeClinicalDocumentContent`. Sigue posteando a la MISMA acción de servidor sin
 * cambios (`createClinicalDocument`, ver actions.ts) — el `content` compuesto viaja como un campo
 * de formulario normal, más.
 *
 * 'otro' se queda deliberadamente sin plantilla: un solo textarea libre, igual que antes.
 */
export function ClinicalDocumentForm({
  patientId,
  patientName,
  speciesLabel,
  breed,
  sexLabel,
  ownerName,
  establishmentName,
  vetName,
  todayLabel,
  records,
}: ClinicalDocumentFormProps) {
  const [documentType, setDocumentType] = useState<ClinicalDocumentType>('otro');
  const [recordId, setRecordId] = useState('');
  const [fieldAnswers, setFieldAnswers] = useState<Record<string, string>>({});
  const [content, setContent] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const templateFields = CLINICAL_DOCUMENT_TEMPLATE_FIELDS[documentType];

  const selectedRecord = useMemo(() => records.find((r) => r.id === recordId) ?? null, [records, recordId]);

  const context: ClinicalDocumentComposeContext = useMemo(
    () => ({
      patientName,
      speciesLabel,
      breed,
      sexLabel,
      ownerName,
      vetName,
      establishmentName,
      dateLabel: todayLabel,
      linkedVisitDateLabel: selectedRecord ? formatDate(selectedRecord.visit_date) : null,
      linkedDiagnosis: selectedRecord?.diagnosis ?? null,
      linkedTreatmentPlan: selectedRecord?.treatment_plan ?? null,
    }),
    [patientName, speciesLabel, breed, sexLabel, ownerName, vetName, establishmentName, todayLabel, selectedRecord]
  );

  // Recalcula la "Vista previa" cada vez que cambia el tipo de documento, alguna respuesta de
  // plantilla, o la consulta vinculada — el veterinario puede seguir editando el textarea de
  // vista previa a mano, pero un cambio real en estos campos vuelve a componer el texto (pisando
  // esa edición manual), que es el comportamiento esperado: "cambiaste el dato, se recalcula".
  // Para 'otro' (sin plantilla) esto no corre — se deja el textarea libre tal cual, sin pasar por
  // `composeClinicalDocumentContent`.
  useEffect(() => {
    if (templateFields.length === 0) return;
    setContent(composeClinicalDocumentContent(documentType, fieldAnswers, context));
  }, [documentType, fieldAnswers, context, templateFields]);

  function onDocumentTypeChange(next: ClinicalDocumentType) {
    setDocumentType(next);
    setFieldAnswers({});
    setFieldErrors({});
    if (next === 'otro') setContent('');
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    setFieldErrors({});
    const missing: Record<string, string> = {};
    for (const field of templateFields) {
      if (field.required && !(fieldAnswers[field.key] ?? '').trim()) {
        missing[field.key] = 'Este campo es obligatorio';
      }
    }
    if (Object.keys(missing).length > 0) {
      e.preventDefault();
      setFieldErrors(missing);
    }
    // Válido: se deja seguir el envío nativo hacia `action={createClinicalDocument}`.
  }

  return (
    <form action={createClinicalDocument} onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="clinical_patient_id" value={patientId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="doc-title">Título</Label>
          <Input id="doc-title" name="title" required placeholder="Ej. Consentimiento de cirugía" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="document_type">Tipo</Label>
          <select
            id="document_type"
            name="document_type"
            value={documentType}
            onChange={(e) => onDocumentTypeChange(e.target.value as ClinicalDocumentType)}
            className="flex h-11 w-full rounded-sm border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {DOCUMENT_TYPE_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {records.length > 0 && (
        <div className="space-y-1.5">
          <Label htmlFor="clinical_record_id">Vincular a una consulta (opcional)</Label>
          <select
            id="clinical_record_id"
            name="clinical_record_id"
            value={recordId}
            onChange={(e) => setRecordId(e.target.value)}
            className="flex h-11 w-full max-w-md rounded-sm border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Sin vincular</option>
            {records.map((record) => (
              <option key={record.id} value={record.id}>
                {formatDate(record.visit_date)} — {record.reason}
              </option>
            ))}
          </select>
        </div>
      )}

      {templateFields.length > 0 ? (
        <div className="space-y-4 rounded-md border border-border p-3">
          <p className="text-sm font-medium text-foreground">
            Datos específicos de {CLINICAL_DOCUMENT_TYPE_LABELS[documentType].toLowerCase()}
            <span className="ml-2 font-normal text-muted-foreground">
              — lo demás (paciente, dueño, veterinario, establecimiento, fecha) se completa solo
            </span>
          </p>
          {templateFields.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label htmlFor={`field-${field.key}`}>
                {field.label}
                {field.required && <span className="text-destructive"> *</span>}
              </Label>
              {field.multiline ? (
                <Textarea
                  id={`field-${field.key}`}
                  rows={3}
                  placeholder={field.placeholder}
                  value={fieldAnswers[field.key] ?? ''}
                  onChange={(e) => setFieldAnswers((prev) => ({ ...prev, [field.key]: e.target.value }))}
                />
              ) : (
                <Input
                  id={`field-${field.key}`}
                  placeholder={field.placeholder}
                  value={fieldAnswers[field.key] ?? ''}
                  onChange={(e) => setFieldAnswers((prev) => ({ ...prev, [field.key]: e.target.value }))}
                />
              )}
              {fieldErrors[field.key] && <p className="text-sm text-destructive">{fieldErrors[field.key]}</p>}
            </div>
          ))}

          <div className="space-y-1.5">
            <Label htmlFor="doc-content">Vista previa (puedes editarla antes de guardar)</Label>
            <Textarea
              id="doc-content"
              name="content"
              rows={10}
              required
              maxLength={5000}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label htmlFor="doc-content">Contenido</Label>
          <Textarea
            id="doc-content"
            name="content"
            rows={6}
            required
            maxLength={5000}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
      )}

      <Button type="submit">Guardar documento</Button>
    </form>
  );
}
