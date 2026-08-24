import type { EstablishmentCategory, VerificationStatus, ReservationStatus, AdoptionStatus, PetSpecies, ProductCategory, ForumPostCategory } from './types';

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

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  alimento: 'Alimento',
  accesorios: 'Accesorios',
  higiene: 'Higiene y cuidado',
  salud: 'Salud y bienestar',
  otro: 'Otro',
};

export const FORUM_CATEGORY_LABELS: Record<ForumPostCategory, string> = {
  promocion: 'Promoción',
  anuncio: 'Anuncio',
  noticia: 'Noticia',
  lugar: 'Lugar',
};

export const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'] as const;
export const DAY_LABELS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as const;

// Design tokens — deben coincidir con design-system/petapp/MASTER.md (paleta v2: azul clínico + menta)
export const COLORS = {
  primary: '#0369A1',
  primaryDark: '#075985',
  secondary: '#10B981',
  secondaryForeground: '#0C2233',
  accent: '#D97706',
  success: '#059669',
  background: '#F8FAFC',
  backgroundAlt: '#ECFDF5',
  foreground: '#0C2233',
  card: '#FFFFFF',
  muted: '#E7EEF2',
  mutedForeground: '#64748B',
  border: '#D6E4EA',
  destructive: '#DC2626',
} as const;
