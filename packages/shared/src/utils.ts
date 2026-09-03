import { DAY_LABELS_SHORT } from './constants';
import type { EstablishmentHours } from './types';

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/** Distancia aproximada en km entre dos coordenadas (fórmula de Haversine). */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

/** ¿Está abierto ahora mismo, dado su horario semanal? */
export function isOpenNow(hours: EstablishmentHours[], is24h: boolean, now: Date = new Date()): boolean {
  if (is24h) return true;
  const today = hours.find((h) => h.day_of_week === now.getDay());
  if (!today || today.closed || !today.open_time || !today.close_time) return false;
  const [openH, openM] = today.open_time.split(':').map(Number);
  const [closeH, closeM] = today.close_time.split(':').map(Number);
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;
  return minutesNow >= openMinutes && minutesNow <= closeMinutes;
}

export function formatHoursSummary(hours: EstablishmentHours[], is24h: boolean): string {
  if (is24h) return 'Abierto 24/7';
  const open = hours.filter((h) => !h.closed);
  if (open.length === 0) return 'Horario no disponible';
  return open
    .sort((a, b) => a.day_of_week - b.day_of_week)
    .map((h) => `${DAY_LABELS_SHORT[h.day_of_week]} ${h.open_time?.slice(0, 5)}–${h.close_time?.slice(0, 5)}`)
    .join(' · ');
}

/** Link de búsqueda de Google Maps para un lugar — no requiere API key ni coordenadas geocodificadas. */
export function buildGoogleMapsLink(place: { name: string; address?: string | null; city: string }): string {
  const query = place.address ? `${place.name}, ${place.address}, ${place.city}` : `${place.name}, ${place.city}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/**
 * "AAAA-MM-DD" de la fecha local de HOY. Nunca usar `new Date().toISOString().slice(0, 10)`
 * para esto: da la fecha en UTC, que en zonas horarias negativas (ej. Colombia, UTC-5) queda
 * un día atrás durante buena parte de la noche local — un evento con `due_date` de hoy se
 * marcaría "vencido" horas antes de estarlo de verdad. Encontrado en revisión de código
 * (2026-09-02), reimplementado independientemente (y mal) en mobile y web.
 */
export function todayLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Redondea una fecha al bloque de 30 minutos más cercano (ej. 10:42 → 10:30, 10:46 → 11:00).
 * El atributo HTML `step` de `<input type="datetime-local">` no basta por sí solo: algunos
 * navegadores (Safari incluido, confirmado probando) no restringen el selector visual a los
 * pasos de 30 minutos aunque el `step` esté puesto — solo lo validarían al enviar el formulario,
 * y de forma inconsistente. Redondear el valor elegido, sin importar qué muestre el picker,
 * garantiza el intervalo de 30 minutos en cualquier navegador.
 */
export function roundToNearestHalfHour(date: Date): Date {
  const halfHourMs = 30 * 60 * 1000;
  return new Date(Math.round(date.getTime() / halfHourMs) * halfHourMs);
}

export function formatPhoneForDisplay(phone: string | null | undefined): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('57')) {
    const local = digits.slice(2);
    return `+57 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
  }
  return phone;
}
