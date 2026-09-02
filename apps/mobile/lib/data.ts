import {
  DEMO_ESTABLISHMENTS,
  DEMO_PET_DOCUMENTS,
  DEMO_PREVENTIVE_EVENTS,
  type EstablishmentWithDetails,
  type PetDocument,
  type PreventiveEvent,
} from '@petapp/shared';
import { isSupabaseConfigured, supabase } from './supabase';

/**
 * Capa de datos de la app móvil. Mientras no exista un proyecto Supabase real
 * conectado (`isSupabaseConfigured`), sirve los fixtures de demo de
 * `@petapp/shared`; en cuanto está configurado, consulta la base real —
 * ninguna pantalla que consuma estas funciones necesita cambiar.
 */

export async function fetchEstablishments(): Promise<EstablishmentWithDetails[]> {
  if (!isSupabaseConfigured) return DEMO_ESTABLISHMENTS;

  const { data, error } = await supabase
    .from('establishments')
    .select('*, hours:establishment_hours(*), services(*)')
    .eq('is_active', true)
    .in('category', ['veterinaria', 'profesional'])
    .order('name');
  if (error) throw error;
  return (data ?? []) as unknown as EstablishmentWithDetails[];
}

export async function fetchEstablishmentById(
  id: string
): Promise<EstablishmentWithDetails | null> {
  if (!isSupabaseConfigured) {
    return DEMO_ESTABLISHMENTS.find((establishment) => establishment.id === id) ?? null;
  }

  const { data, error } = await supabase
    .from('establishments')
    .select('*, hours:establishment_hours(*), services(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as EstablishmentWithDetails) ?? null;
}

/** Eventos del calendario preventivo de una mascota puntual (ficha de mascota). */
export async function fetchPreventiveEventsByPet(petId: string): Promise<PreventiveEvent[]> {
  if (!isSupabaseConfigured) {
    return DEMO_PREVENTIVE_EVENTS.filter((event) => event.pet_id === petId);
  }

  const { data, error } = await supabase
    .from('preventive_events')
    .select('*')
    .eq('pet_id', petId)
    .order('due_date', { ascending: true });
  if (error) throw error;
  return (data ?? []) as PreventiveEvent[];
}

/**
 * Eventos del calendario preventivo de todas las mascotas de un propietario, para el
 * resumen de "Inicio" (el momento decisivo del customer journey: volver cuando el
 * recordatorio es pertinente). Recibe los ids de mascota ya cargados por `PetsContext`
 * en vez de resolverlos aquí, para no duplicar esa consulta.
 */
export async function fetchPreventiveEventsForPets(petIds: string[]): Promise<PreventiveEvent[]> {
  if (petIds.length === 0) return [];

  if (!isSupabaseConfigured) {
    return DEMO_PREVENTIVE_EVENTS.filter((event) => petIds.includes(event.pet_id));
  }

  const { data, error } = await supabase
    .from('preventive_events')
    .select('*')
    .in('pet_id', petIds)
    .order('due_date', { ascending: true });
  if (error) throw error;
  return (data ?? []) as PreventiveEvent[];
}

export async function fetchPetDocumentsByPet(petId: string): Promise<PetDocument[]> {
  if (!isSupabaseConfigured) {
    return DEMO_PET_DOCUMENTS.filter((document) => document.pet_id === petId);
  }

  const { data, error } = await supabase
    .from('pet_documents')
    .select('*')
    .eq('pet_id', petId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as PetDocument[];
}
