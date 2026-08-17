import type { EstablishmentCategory, VerificationStatus, ReservationStatus, AdoptionStatus, PetSpecies } from './types';

export const APP_NAME = 'PetApp';
export const APP_TAGLINE = 'Todo lo que tu mascota necesita, en un solo lugar';
export const PILOT_CITY = 'Ibagué';

export const CATEGORY_LABELS: Record<EstablishmentCategory, string> = {
  veterinaria: 'Veterinaria',
  comercio: 'Comercio',
  profesional: 'Profesional independiente',
  fundacion: 'Fundación / Rescate',
};

export const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  pendiente: 'Pendiente de verificación',
  en_revision: 'En revisión',
  verificado: 'Verificado',
  rechazado: 'Rechazado',
};

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
  completada: 'Completada',
  no_asistio: 'No asistió',
};

export const ADOPTION_STATUS_LABELS: Record<AdoptionStatus, string> = {
  disponible: 'Disponible',
  en_proceso: 'En proceso',
  adoptado: 'Adoptado',
  retirado: 'Retirado',
};

export const SPECIES_LABELS: Record<PetSpecies, string> = {
  perro: 'Perro',
  gato: 'Gato',
  otro: 'Otro',
};

export const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'] as const;
export const DAY_LABELS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as const;

// Design tokens — deben coincidir con design-system/petapp/MASTER.md
export const COLORS = {
  primary: '#123A5C',
  primaryDark: '#0B2540',
  secondary: '#0F766E',
  accent: '#D97706',
  success: '#059669',
  background: '#F8FAFC',
  backgroundAlt: '#F0FDFA',
  foreground: '#0F172A',
  card: '#FFFFFF',
  muted: '#EDF2F5',
  mutedForeground: '#64748B',
  border: '#DCE6EA',
  destructive: '#DC2626',
} as const;
