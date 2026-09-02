import type { PetSex } from '@petapp/shared';

// Etiquetas de UI que no forman parte de `@petapp/shared` porque son
// específicas de cómo las presenta esta app (no del esquema de datos).
export const SEX_LABELS: Record<PetSex, string> = {
  macho: 'Macho',
  hembra: 'Hembra',
  desconocido: 'Sexo desconocido',
};

/** Convierte una fecha de nacimiento (YYYY-MM-DD) en un texto de edad legible. */
export function formatPetAge(birthDate: string | null): string {
  if (!birthDate) return 'Fecha de nacimiento no registrada';

  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return 'Fecha de nacimiento no registrada';

  const now = new Date();
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months -= 1;
  if (months < 0) return 'Fecha de nacimiento no registrada';
  if (months < 1) return 'Recién nacido/a';
  if (months < 12) return `${months} ${months === 1 ? 'mes' : 'meses'}`;

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (remainingMonths === 0) return `${years} ${years === 1 ? 'año' : 'años'}`;
  return `${years} ${years === 1 ? 'año' : 'años'} y ${remainingMonths} ${remainingMonths === 1 ? 'mes' : 'meses'}`;
}

/**
 * Clave de fecha LOCAL ("AAAA-MM-DD") a partir de un ISO completo — para agrupar por día en
 * la agenda. Debe ser la fecha local, no `iso.slice(0, 10)`: ese slice toma el día en UTC, que
 * en Colombia (UTC-5) queda mal para cualquier cita entre las 7pm y la medianoche local (cae
 * en el día siguiente en UTC).
 */
export function localDateKey(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso.slice(0, 10);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Encabezado de sección de la agenda del prestador, ej. "Lunes 8 de septiembre". Recibe una clave de `localDateKey`. */
export function formatAgendaDateHeader(dateKey: string): string {
  // Se parsea con hora local explícita (sin "Z"): un "AAAA-MM-DD" a secas se interpreta como
  // medianoche UTC, que en Colombia (UTC-5) muestra el día anterior — el mismo bug que evita
  // `localDateKey` al generar la clave.
  const date = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateKey;
  const label = date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * Hora de una cita en formato "3:00 p.m." — se calcula a mano en vez de con
 * `toLocaleTimeString` porque Hermes no siempre trae datos ICU completos para
 * formatear hora con am/pm en es-CO de forma consistente entre plataformas.
 */
export function formatAgendaTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'p.m.' : 'a.m.';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${hours}:${String(minutes).padStart(2, '0')} ${period}`;
}

/** Fecha + hora de una cita en una sola línea, ej. "Lun 8 sept · 3:00 p.m.". */
export function formatAgendaDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const dayLabel = date.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });
  const capitalized = (dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)).replace(',', '');
  return `${capitalized} · ${formatAgendaTime(iso)}`;
}
