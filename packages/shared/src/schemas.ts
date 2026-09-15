import { z } from 'zod';

export const petSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(60),
  species: z.enum(['perro', 'gato', 'otro']),
  breed: z.string().max(80).optional().or(z.literal('')),
  sex: z.enum(['macho', 'hembra', 'desconocido']),
  birth_date: z.string().optional().or(z.literal('')),
  sterilized: z.boolean().default(false),
  vaccinated: z.boolean().default(false),
  notes: z.string().max(500).optional().or(z.literal('')),
});
export type PetFormValues = z.infer<typeof petSchema>;

/** Solicitud de cita del cuidador a un prestador (ex `reservationRequestSchema`). */
export const serviceRequestSchema = z.object({
  establishment_id: z.string().uuid(),
  service_id: z.string().uuid().optional(),
  pet_id: z.string().uuid().optional(),
  preferred_datetime: z.string().optional(),
  notes: z.string().max(500).optional().or(z.literal('')),
});
export type ServiceRequestValues = z.infer<typeof serviceRequestSchema>;

// Formulario público "¿Eres un prestador veterinario? Únete al piloto"
export const partnerApplicationSchema = z.object({
  business_name: z.string().min(2).max(120),
  category: z.enum(['veterinaria', 'profesional']),
  contact_name: z.string().min(2).max(100),
  phone: z.string().min(7).max(20),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().max(200).optional().or(z.literal('')),
  message: z.string().max(500).optional().or(z.literal('')),
});
export type PartnerApplicationValues = z.infer<typeof partnerApplicationSchema>;

// Mismo patrón de seguridad que `petDocumentSchema.document_url`: se restringe a http(s)
// explícitamente porque estos valores se renderizan como <Image>/enlace (tarjeta del
// directorio, ficha pública del prestador) — `z.string().url()` por sí solo acepta
// esquemas como `javascript:`, que ejecutarían al tocar/cargar la imagen. A diferencia de
// `document_url`, acá son opcionales: no todo establecimiento tiene logo o portada.
const optionalHttpUrlSchema = z
  .string()
  .url('Debe ser una URL válida')
  .refine((url) => /^https?:\/\//i.test(url), 'El enlace debe empezar con http:// o https://')
  .optional()
  .or(z.literal(''));

/**
 * Autoservicio: un usuario ya registrado con `role='establecimiento'` crea su propio negocio
 * (antes solo existía la conversión manual de una solicitud de "Únete al piloto" por un admin —
 * ver `partnerApplicationSchema` arriba, pensado para gente que TODAVÍA no tiene cuenta). El
 * negocio creado así arranca en `verification_status='pendiente'` igual que cualquier otro, sigue
 * pasando por la validación del superadmin — este formulario no evita ese paso, solo evita
 * quedar sin ningún negocio vinculado después de un registro correcto.
 */
export const createEstablishmentSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(120),
  category: z.enum(['veterinaria', 'profesional']),
  address: z.string().max(200).optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  whatsapp_number: z.string().max(20).optional().or(z.literal('')),
});
export type CreateEstablishmentValues = z.infer<typeof createEstablishmentSchema>;

export const establishmentProfileSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(120),
  description: z.string().max(500).optional().or(z.literal('')),
  address: z.string().max(200).optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  whatsapp_number: z.string().max(20).optional().or(z.literal('')),
  is_24_7: z.boolean().default(false),
  logo_url: optionalHttpUrlSchema,
  cover_image_url: optionalHttpUrlSchema,
});
export type EstablishmentProfileFormValues = z.infer<typeof establishmentProfileSchema>;

export const serviceSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(100),
  description: z.string().max(300).optional().or(z.literal('')),
  price_reference: z.string().max(60).optional().or(z.literal('')),
});
export type ServiceFormValues = z.infer<typeof serviceSchema>;

export const preventiveEventSchema = z.object({
  pet_id: z.string().uuid(),
  type: z.enum(['vacuna', 'control', 'desparasitacion', 'otro']),
  title: z.string().min(1, 'Ponle un título a este recordatorio').max(120),
  due_date: z.string().min(1, 'La fecha es obligatoria'),
  notes: z.string().max(500).optional().or(z.literal('')),
});
export type PreventiveEventFormValues = z.infer<typeof preventiveEventSchema>;

// Exactamente una fuente: un enlace externo pegado a mano (`document_url`, restringido a
// http(s) — igual que antes, se renderiza en un <a href> directo y `z.string().url()` por sí
// solo aceptaría `javascript:`) o un archivo subido a Storage (`storage_path`, lo arma la app
// después de subir el archivo, nunca lo escribe el usuario a mano). Se queda como `z.object`
// plano (sin `.refine`) a propósito: mobile hace `petDocumentSchema.omit({ pet_id: true })`, y
// `.refine()` envuelve el schema en un `ZodEffects` que ya no tiene `.omit()`. La regla de "al
// menos una fuente" la valida cada formulario según el modo (subir archivo / pegar enlace) que
// esté activo, y queda reforzada de todas formas por el CHECK de la base de datos
// (0007_pet_media_storage.sql) como última defensa.
export const petDocumentSchema = z.object({
  pet_id: z.string().uuid(),
  title: z.string().min(1, 'Ponle un nombre a este documento').max(120),
  document_url: z
    .string()
    .url('Debe ser una URL válida')
    .refine((url) => /^https?:\/\//i.test(url), 'El enlace debe empezar con http:// o https://')
    .optional()
    .or(z.literal('')),
  storage_path: z.string().min(1).optional(),
  document_type: z.enum(['carnet_vacunacion', 'historia_clinica', 'otro']),
});
export type PetDocumentFormValues = z.infer<typeof petDocumentSchema>;

/**
 * Reseña de un cuidador sobre un establecimiento (idea 3.1 del banco de ideas de
 * funcionalidades, 0012_establishment_reviews.sql). `comment` es opcional — un cuidador puede
 * calificar sin escribir nada, igual que en la mayoría de apps de reseñas.
 */
export const establishmentReviewSchema = z.object({
  establishment_id: z.string().uuid(),
  rating: z.number().int().min(1, 'Elige entre 1 y 5 estrellas').max(5),
  comment: z.string().max(500).optional().or(z.literal('')),
});
export type EstablishmentReviewFormValues = z.infer<typeof establishmentReviewSchema>;

export const providerPlanSchema = z.object({
  plan_code: z.enum(['basico', 'pro']),
  notes: z.string().max(500).optional().or(z.literal('')),
});
export type ProviderPlanFormValues = z.infer<typeof providerPlanSchema>;

/**
 * Nota de seguimiento veterinario (0014_vet_visit_notes.sql) — qué le dijo/hizo el veterinario
 * en la cita real, contado por el cuidador para que la IA lo tenga como contexto la próxima vez.
 */
export const vetVisitNoteSchema = z.object({
  pet_id: z.string().uuid(),
  ai_conversation_id: z.string().uuid().optional(),
  note: z.string().min(1, 'Contanos qué te dijo el veterinario').max(2000),
});
export type VetVisitNoteFormValues = z.infer<typeof vetVisitNoteSchema>;

/**
 * Ficha de paciente del panel de establecimiento (0016_clinical_records.sql). `pet_id` presente =
 * animal ya registrado en la plataforma, vinculado directo; ausente = paciente walk-in, y ahí
 * `owner_full_name` pasa a ser obligatorio (ver el `.refine` — es el único dato de contacto que
 * le queda al establecimiento para ese dueño sin cuenta).
 */
export const clinicalPatientSchema = z
  .object({
    pet_id: z.string().uuid().optional(),
    owner_full_name: z.string().max(120).optional().or(z.literal('')),
    owner_phone: z.string().max(40).optional().or(z.literal('')),
    owner_document: z.string().max(40).optional().or(z.literal('')),
    name: z.string().min(1, 'Ponle un nombre al paciente').max(80),
    species: z.enum(['perro', 'gato', 'otro']),
    breed: z.string().max(80).optional().or(z.literal('')),
    sex: z.enum(['macho', 'hembra', 'desconocido']),
    birth_date: z.string().optional().or(z.literal('')),
    estimated_age_years: z.coerce.number().min(0).max(60).optional(),
    color: z.string().max(80).optional().or(z.literal('')),
    origin_place: z.string().max(120).optional().or(z.literal('')),
    microchip_number: z.string().max(40).optional().or(z.literal('')),
    sterilized: z.boolean().default(false),
    allergies: z.string().max(500).optional().or(z.literal('')),
    chronic_conditions: z.string().max(500).optional().or(z.literal('')),
    notes: z.string().max(1000).optional().or(z.literal('')),
  })
  .refine((data) => Boolean(data.pet_id) || Boolean(data.owner_full_name?.trim()), {
    message: 'Si el paciente no tiene cuenta en la plataforma, el nombre del dueño es obligatorio',
    path: ['owner_full_name'],
  });
export type ClinicalPatientFormValues = z.infer<typeof clinicalPatientSchema>;

/** Una consulta (formato SOAP) para un ClinicalPatient ya creado. */
export const clinicalRecordSchema = z.object({
  visit_date: z.string().min(1),
  record_type: z.enum(['consulta_general', 'control', 'vacunacion', 'desparasitacion', 'cirugia', 'otro']).default('consulta_general'),
  reason: z.string().min(1, 'Contanos el motivo de la consulta').max(300),
  subjective: z.string().max(2000).optional().or(z.literal('')),
  weight_kg: z.coerce.number().min(0).max(500).optional(),
  temperature_c: z.coerce.number().min(20).max(45).optional(),
  heart_rate_bpm: z.coerce.number().int().min(0).max(400).optional(),
  respiratory_rate_bpm: z.coerce.number().int().min(0).max(200).optional(),
  body_condition_score: z.coerce.number().int().min(1).max(9).optional(),
  physical_exam_notes: z.string().max(2000).optional().or(z.literal('')),
  diagnosis: z.string().max(1000).optional().or(z.literal('')),
  treatment_plan: z.string().max(2000).optional().or(z.literal('')),
  medications: z.string().max(1000).optional().or(z.literal('')),
  vaccines_applied: z.string().max(500).optional().or(z.literal('')),
  follow_up_date: z.string().optional().or(z.literal('')),
});
export type ClinicalRecordFormValues = z.infer<typeof clinicalRecordSchema>;

/**
 * Documento para firma (consentimiento, remisión, orden, fórmula) de un `ClinicalPatient` ya
 * creado (0019_clinical_documents.sql). `clinical_record_id` es opcional — el establecimiento
 * puede vincularlo a una consulta puntual ya registrada, o crearlo directo sobre el paciente.
 */
export const clinicalDocumentSchema = z.object({
  clinical_record_id: z.string().uuid().optional(),
  document_type: z.enum(['consentimiento', 'remision', 'orden', 'formula', 'otro']).default('otro'),
  title: z.string().min(1, 'Ponle un título al documento').max(200),
  content: z.string().min(1, 'Escribe el contenido del documento').max(5000),
});
export type ClinicalDocumentFormValues = z.infer<typeof clinicalDocumentSchema>;

/**
 * Un turno del chat de pre-diagnóstico (POST a `/api/ai/prediagnostico`, ver
 * 0009_ai_prediagnostico.sql). `conversationId` ausente = arranca una conversación nueva para
 * `petId`; presente = continúa una ya activa. `imagePath` (0011_ai_chat_images.sql, idea 1.1 del
 * banco de ideas) es opcional: la ruta ya subida al bucket privado `ai-chat-images` de una foto
 * de síntoma — `message` puede venir vacío si el turno es solo la foto, pero al menos uno de los
 * dos tiene que estar presente (ver el `.refine` de abajo).
 */
export const aiChatMessageSchema = z
  .object({
    petId: z.string().uuid(),
    conversationId: z.string().uuid().optional(),
    message: z.string().max(2000),
    imagePath: z.string().min(1).max(300).optional(),
  })
  .refine((data) => data.message.trim().length > 0 || Boolean(data.imagePath), {
    message: 'Escribe un mensaje o adjunta una foto',
    path: ['message'],
  });
export type AiChatMessageValues = z.infer<typeof aiChatMessageSchema>;

/**
 * Valida el bloque `===RUTA===` que el modelo devuelve en texto plano (JSON dentro del
 * delimitador) — `dias` es un desplazamiento desde hoy, no una fecha absoluta, porque pedirle al
 * modelo una fecha real arriesga que invente el día de hoy; el backend hace la suma real.
 */
export const aiRoadmapItemInputSchema = z.object({
  title: z.string().min(1).max(120),
  type: z.enum(['vacuna', 'control', 'desparasitacion', 'otro']),
  dias: z.number().int().min(0).max(365),
  notes: z.string().max(300).optional().nullable(),
});
export const aiRoadmapInputSchema = z.array(aiRoadmapItemInputSchema).max(6);
export type AiRoadmapItemInput = z.infer<typeof aiRoadmapItemInputSchema>;
