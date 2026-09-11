// Tipos que reflejan 1:1 el esquema de supabase/migrations/0001_init.sql +
// 0005_pivot_preventivo.sql. Si el esquema cambia, este archivo debe actualizarse
// (o regenerarse con `generate_typescript_types` una vez la migración esté aplicada
// sobre el proyecto Supabase real).

export type UserRole = 'propietario' | 'establecimiento' | 'admin';

// 'comercio' y 'fundacion' se conservan en el tipo porque filas históricas del seed
// de Ibagué todavía las usan (ver 0005_pivot_preventivo.sql, quedaron con is_active=false),
// pero el directorio y los formularios nuevos solo ofrecen 'veterinaria' | 'profesional'.
export type EstablishmentCategory = 'veterinaria' | 'comercio' | 'profesional' | 'fundacion';
export type ProviderCategory = Extract<EstablishmentCategory, 'veterinaria' | 'profesional'>;

export type VerificationStatus = 'pendiente' | 'en_revision' | 'verificado' | 'rechazado';

export type PetSpecies = 'perro' | 'gato' | 'otro';

export type PetSex = 'macho' | 'hembra' | 'desconocido';

export type ServiceRequestStatus = 'pendiente' | 'confirmada' | 'cancelada' | 'completada' | 'no_asistio';

export type ServiceRequestChannel = 'whatsapp' | 'telefono' | 'presencial' | 'otro';

export type PartnerApplicationStatus = 'nuevo' | 'contactado' | 'descartado' | 'convertido';

export type PreventiveEventType = 'vacuna' | 'control' | 'desparasitacion' | 'otro';

export type PetDocumentType = 'carnet_vacunacion' | 'historia_clinica' | 'otro';

export type ProviderPlanCode = 'basico' | 'pro';

export type ProviderPlanStatus = 'prueba' | 'activa' | 'pausada' | 'cancelada';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Pet {
  id: string;
  owner_id: string;
  name: string;
  species: PetSpecies;
  breed: string | null;
  sex: PetSex;
  birth_date: string | null;
  sterilized: boolean;
  vaccinated: boolean;
  photo_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Establishment {
  id: string;
  owner_id: string | null;
  name: string;
  slug: string;
  category: EstablishmentCategory;
  description: string | null;
  address: string | null;
  city: string;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  whatsapp_number: string | null;
  email: string | null;
  website: string | null;
  is_24_7: boolean;
  is_active: boolean;
  verification_status: VerificationStatus;
  verification_notes: string | null;
  verified_at: string | null;
  verified_by: string | null;
  cover_image_url: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface EstablishmentHours {
  id: string;
  establishment_id: string;
  day_of_week: number; // 0 = domingo ... 6 = sábado
  open_time: string | null;
  close_time: string | null;
  closed: boolean;
}

export interface Service {
  id: string;
  establishment_id: string;
  name: string;
  description: string | null;
  price_reference: string | null;
  duration_minutes: number | null;
  is_active: boolean;
  created_at: string;
}

/** Solicitud de cita del cuidador a un prestador (ex `Reservation`, tabla `service_requests`). */
export interface ServiceRequest {
  id: string;
  pet_owner_id: string;
  establishment_id: string;
  service_id: string | null;
  pet_id: string | null;
  requested_at: string;
  preferred_datetime: string | null;
  status: ServiceRequestStatus;
  channel: ServiceRequestChannel;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** Evento del calendario preventivo de una mascota (vacuna, control, desparasitación). */
export interface PreventiveEvent {
  id: string;
  pet_id: string;
  type: PreventiveEventType;
  title: string;
  due_date: string;
  completed_at: string | null;
  reminder_sent_at: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Documento/soporte básico de una mascota (carnet de vacunación, historia clínica, etc.).
 * Exactamente una de las dos fuentes está presente: `document_url` (enlace externo pegado a
 * mano) o `storage_path` (archivo subido al bucket privado `pet-documents` de Supabase Storage
 * — sin URL pública fija; la app genera una URL firmada al mostrarlo). Ver 0007_pet_media_storage.sql.
 */
export interface PetDocument {
  id: string;
  pet_id: string;
  title: string;
  document_url: string | null;
  storage_path: string | null;
  document_type: PetDocumentType;
  uploaded_by: string | null;
  created_at: string;
}

/** Plan B2B del prestador (suscripción del piloto — sin pasarela de pago todavía). */
export interface ProviderPlan {
  id: string;
  establishment_id: string;
  plan_code: ProviderPlanCode;
  status: ProviderPlanStatus;
  notes: string | null;
  activated_by: string | null;
  activated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PartnerApplication {
  id: string;
  business_name: string;
  category: EstablishmentCategory;
  contact_name: string;
  phone: string;
  email: string | null;
  address: string | null;
  message: string | null;
  status: PartnerApplicationStatus;
  reviewed_by: string | null;
  created_at: string;
}

// Vistas compuestas usadas en UI (join de establecimiento + horarios + servicios)
export interface EstablishmentWithDetails extends Establishment {
  hours: EstablishmentHours[];
  services: Service[];
}

export interface PetWithDetails extends Pet {
  preventive_events: PreventiveEvent[];
  documents: PetDocument[];
}

export type AiConversationStatus = 'activa' | 'completada';
export type AiMessageRole = 'user' | 'assistant';

export type AiRoadmapItemStatus = 'pending' | 'accepted' | 'dismissed';

/**
 * Un ítem de la ruta de seguimiento sugerida por el modelo al cerrar la conversación
 * (0010_ai_prediagnostico_roadmap.sql) — siempre un recordatorio/próximo paso (agendar consulta,
 * control de seguimiento), NUNCA un tratamiento o medicación. `due_date` ya viene calculado por el
 * backend (hoy + los días que sugirió el modelo), listo para crear un `PreventiveEvent` si el
 * cuidador lo acepta. `status` empieza `undefined` (equivale a "pending") cuando el modelo recién
 * lo sugiere — la UI lo actualiza y lo vuelve a guardar en `ai_conversations.roadmap` en cuanto el
 * cuidador decide algo, para que la decisión sobreviva un refresh/otra visita (antes era efímera:
 * "aceptar" sí agendaba el recordatorio, pero al volver a esta pantalla la tarjeta volvía a
 * mostrarse como pendiente — riesgo real de agendar el mismo recordatorio dos veces).
 */
export interface AiRoadmapItem {
  title: string;
  type: PreventiveEventType;
  due_date: string;
  notes: string | null;
  status?: AiRoadmapItemStatus;
}

/**
 * Sesión de chat de pre-diagnóstico (0009_ai_prediagnostico.sql). `summary` es el resumen
 * estructurado final exportable a PDF — null mientras la conversación sigue activa. Esto NUNCA
 * es un diagnóstico real, es un resumen de síntomas para llevar al veterinario (ver
 * docs/legal/registro-legal.md LG-001). `roadmap` (0010) es la sugerencia de próximos pasos tal
 * como la propuso el modelo — las decisiones del cuidador sobre cada ítem (aceptar/modificar) se
 * reflejan creando filas reales en `preventive_events`, no acá.
 */
export interface AiConversation {
  id: string;
  pet_id: string;
  owner_id: string;
  status: AiConversationStatus;
  summary: string | null;
  roadmap: AiRoadmapItem[] | null;
  created_at: string;
  updated_at: string;
}

export interface AiMessage {
  id: string;
  conversation_id: string;
  role: AiMessageRole;
  content: string;
  /** Ruta en el bucket privado `ai-chat-images` de una foto adjunta a este turno (0011), o null. */
  image_path: string | null;
  created_at: string;
}
