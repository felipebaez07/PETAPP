// Tipos que reflejan 1:1 el esquema de supabase/migrations/0001_init.sql.
// Si el esquema cambia, este archivo debe actualizarse (o regenerarse con
// `generate_typescript_types` una vez el proyecto Supabase esté provisionado).

export type UserRole = 'propietario' | 'establecimiento' | 'admin';

export type EstablishmentCategory = 'veterinaria' | 'comercio' | 'profesional' | 'fundacion';

export type VerificationStatus = 'pendiente' | 'en_revision' | 'verificado' | 'rechazado';

export type PetSpecies = 'perro' | 'gato' | 'otro';

export type PetSex = 'macho' | 'hembra' | 'desconocido';

export type ReservationStatus = 'pendiente' | 'confirmada' | 'cancelada' | 'completada' | 'no_asistio';

export type ReservationChannel = 'whatsapp' | 'telefono' | 'presencial' | 'otro';

export type AdoptionStatus = 'disponible' | 'en_proceso' | 'adoptado' | 'retirado';

export type AdoptionInterestStatus = 'nuevo' | 'contactado' | 'descartado' | 'aprobado';

export type PartnerApplicationStatus = 'nuevo' | 'contactado' | 'descartado' | 'convertido';

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

export interface Reservation {
  id: string;
  pet_owner_id: string;
  establishment_id: string;
  service_id: string | null;
  pet_id: string | null;
  requested_at: string;
  preferred_datetime: string | null;
  status: ReservationStatus;
  channel: ReservationChannel;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdoptionPost {
  id: string;
  posted_by: string | null;
  establishment_id: string | null;
  animal_name: string;
  species: PetSpecies;
  estimated_age: string | null;
  sex: PetSex;
  sterilized: boolean;
  vaccinated: boolean;
  health_notes: string | null;
  personality_notes: string | null;
  location_text: string | null;
  status: AdoptionStatus;
  cover_photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdoptionPhoto {
  id: string;
  adoption_post_id: string;
  photo_url: string;
  sort_order: number;
}

export interface AdoptionInterest {
  id: string;
  adoption_post_id: string;
  interested_user_id: string | null;
  full_name: string;
  phone: string;
  email: string | null;
  message: string | null;
  status: AdoptionInterestStatus;
  created_at: string;
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

export interface AdoptionPostWithPhotos extends AdoptionPost {
  photos: AdoptionPhoto[];
  establishment: Pick<Establishment, 'id' | 'name' | 'slug' | 'whatsapp_number'> | null;
}
