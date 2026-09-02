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

export const petDocumentSchema = z.object({
  pet_id: z.string().uuid(),
  title: z.string().min(1, 'Ponle un nombre a este documento').max(120),
  // Se restringe a http(s) explícitamente: la web renderiza esto en un <a href> directo
  // (components/cuidador/document-row.tsx), y `z.string().url()` por sí solo acepta
  // esquemas como `javascript:`, que ejecutarían al hacer clic.
  document_url: z
    .string()
    .url('Debe ser una URL válida')
    .refine((url) => /^https?:\/\//i.test(url), 'El enlace debe empezar con http:// o https://'),
  document_type: z.enum(['carnet_vacunacion', 'historia_clinica', 'otro']),
});
export type PetDocumentFormValues = z.infer<typeof petDocumentSchema>;

export const providerPlanSchema = z.object({
  plan_code: z.enum(['basico', 'pro']),
  notes: z.string().max(500).optional().or(z.literal('')),
});
export type ProviderPlanFormValues = z.infer<typeof providerPlanSchema>;
