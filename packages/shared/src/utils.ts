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

export function formatPhoneForDisplay(phone: string | null | undefined): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('57')) {
    const local = digits.slice(2);
    return `+57 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
  }
  return phone;
}
