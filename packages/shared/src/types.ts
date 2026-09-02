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

/** Documento/soporte básico de una mascota (carnet de vacunación, historia clínica, etc.). */
export interface PetDocument {
  id: string;
  pet_id: string;
  title: string;
  document_url: string;
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
