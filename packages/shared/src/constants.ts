import type {
  EstablishmentCategory,
  VerificationStatus,
  ServiceRequestStatus,
  PetSpecies,
  PreventiveEventType,
  PetDocumentType,
  ProviderPlanCode,
  ProviderPlanStatus,
} from './types';

export const APP_NAME = 'PETAPP';
export const APP_TAGLINE = 'Seguimiento preventivo, documentos y prestadores verificados en un solo lugar';
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

export const SERVICE_REQUEST_STATUS_LABELS: Record<ServiceRequestStatus, string> = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
  completada: 'Completada',
  no_asistio: 'No asistió',
};

export const SPECIES_LABELS: Record<PetSpecies, string> = {
  perro: 'Perro',
  gato: 'Gato',
  otro: 'Otro',
};

export const PREVENTIVE_EVENT_TYPE_LABELS: Record<PreventiveEventType, string> = {
  vacuna: 'Vacuna',
  control: 'Control',
  desparasitacion: 'Desparasitación',
  otro: 'Otro',
};

export const PET_DOCUMENT_TYPE_LABELS: Record<PetDocumentType, string> = {
  carnet_vacunacion: 'Carné de vacunación',
  historia_clinica: 'Historia clínica',
  otro: 'Otro',
};

export const PROVIDER_PLAN_CODE_LABELS: Record<ProviderPlanCode, string> = {
  basico: 'Básico',
  pro: 'Pro',
};

export const PROVIDER_PLAN_STATUS_LABELS: Record<ProviderPlanStatus, string> = {
  prueba: 'En prueba',
  activa: 'Activa',
  pausada: 'Pausada',
  cancelada: 'Cancelada',
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
