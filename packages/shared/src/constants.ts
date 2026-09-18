import type {
  EstablishmentCategory,
  VerificationStatus,
  ServiceRequestStatus,
  PetSpecies,
  PreventiveEventType,
  PetDocumentType,
  ProviderPlanCode,
  ProviderPlanStatus,
  ClinicalRecordType,
  ClinicalDocumentType,
  PetSize,
  ConsentType,
} from './types';

export const APP_NAME = 'PeTech';
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
  bano: 'Baño',
  spa: 'Spa',
  corte_pelo: 'Corte de pelo',
  corte_unas: 'Corte de uñas',
  limpieza_dental: 'Limpieza dental',
};

/** Los 5 tipos de estética/cuidado recurrente de PREVENTIVE_EVENT_TYPE_LABELS, aparte de los 4
 * originales del calendario preventivo (vacuna/control/desparasitación/otro) — útil para filtrar
 * el selector a solo estos en las pantallas de "servicios recurrentes". */
export const GROOMING_SERVICE_TYPES = ['bano', 'spa', 'corte_pelo', 'corte_unas', 'limpieza_dental'] as const;

export const PET_SIZE_LABELS: Record<PetSize, string> = {
  pequeno: 'Pequeño',
  mediano: 'Mediano',
  grande: 'Grande',
};

export const CONSENT_TYPE_LABELS: Record<ConsentType, string> = {
  recordatorios_servicio: 'Recordatorios de servicios de mis mascotas',
  comunicaciones_comerciales: 'Comunicaciones comerciales y campañas',
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

// Nombres de marca definidos por el negocio (2026-09-18) para la página pública de precios —
// "Plan Básico · Camada" / "Plan Pro · Manada". `PROVIDER_PLAN_CODE_LABELS` de arriba sigue siendo
// el nombre corto que ya se usa en el panel (badges, el radio-select de /panel/plan); este es el
// nombre temático que se le suma al lado, no un reemplazo.
export const PROVIDER_PLAN_MARKETING_NAMES: Record<ProviderPlanCode, string> = {
  basico: 'Camada',
  pro: 'Manada',
};

// Precios mensuales reales entregados por el negocio (2026-09-18), en pesos colombianos. Sin
// pasarela de pago en este piloto (ver PlanForm) — este número es lo que se publica, no algo que
// hoy se cobre automáticamente.
export const PROVIDER_PLAN_MONTHLY_PRICE_COP: Record<ProviderPlanCode, number> = {
  basico: 79000,
  pro: 149000,
};

// Features públicas por plan (2026-09-18) para la página /planes. OJO: no todas están reforzadas
// técnicamente todavía — "métricas de desempeño" (`/panel/metricas`) y "documentos y
// consentimientos firmados" (`clinical_documents`) hoy están disponibles para cualquier
// establecimiento sin importar su plan, y el tope de "hasta 2 usuarios" de Camada no se hace
// cumplir en el código. Ver LG-009 en docs/legal/registro-legal.md.
export const PROVIDER_PLAN_FEATURES: Record<ProviderPlanCode, string[]> = {
  basico: [
    'Perfil verificado en el directorio',
    'Bandeja de solicitudes de cita',
    'Redirección a WhatsApp',
    'Vencimientos preventivos de sus pacientes',
    'Hasta 2 usuarios del equipo',
    'Soporte por correo',
  ],
  pro: [
    'Recordatorios automáticos de servicios recurrentes (baño, spa, corte, uñas, dental)',
    'Una jornada o campaña al mes a sus propios pacientes',
    'Destacado en el directorio y sello de respuesta rápida',
    'Métricas de desempeño',
    'Documentos y consentimientos firmados',
    'Usuarios y sedes ilimitados',
    'Soporte prioritario',
  ],
};

export const PROVIDER_PLAN_STATUS_LABELS: Record<ProviderPlanStatus, string> = {
  prueba: 'En prueba',
  activa: 'Activa',
  pausada: 'Pausada',
  cancelada: 'Cancelada',
};

export const CLINICAL_RECORD_TYPE_LABELS: Record<ClinicalRecordType, string> = {
  consulta_general: 'Consulta general',
  control: 'Control / evolución',
  vacunacion: 'Vacunación',
  desparasitacion: 'Desparasitación',
  cirugia: 'Cirugía',
  otro: 'Otro',
};

export const CLINICAL_DOCUMENT_TYPE_LABELS: Record<ClinicalDocumentType, string> = {
  consentimiento: 'Consentimiento',
  remision: 'Remisión',
  orden: 'Orden',
  formula: 'Fórmula',
  otro: 'Otro',
};

export const DAY_LABELS =['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'] as const;
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
