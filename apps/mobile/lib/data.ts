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

/**
 * Genera una URL firmada (60s) para abrir un documento subido al bucket privado
 * `pet-documents`. No hay servidor intermedio en mobile (a diferencia de la Server Action
 * `getSignedDocumentUrl` de `apps/web`), así que la verificación de dueño ocurre en esta
 * misma llamada: el `select` filtra por `id` **y** `pet_id` a la vez, y la RLS de
 * `pet_documents` (solo el dueño de la mascota puede leer sus filas) ya deniega cualquier
 * documento que no sea del usuario autenticado — si no hay fila, no se genera ninguna URL.
 * Nunca se acepta un `storage_path` que no venga de una fila que el usuario pudo leer.
 */
export async function getSignedPetDocumentUrl(
  documentId: string,
  petId: string
): Promise<{ url: string | null; error: string | null }> {
  if (!isSupabaseConfigured) {
    return { url: null, error: 'No disponible en modo demo.' };
  }

  const { data: doc, error: fetchError } = await supabase
    .from('pet_documents')
    .select('storage_path')
    .eq('id', documentId)
    .eq('pet_id', petId)
    .maybeSingle();
  if (fetchError || !doc?.storage_path) {
    return { url: null, error: 'Documento no encontrado.' };
  }

  const { data, error } = await supabase.storage.from('pet-documents').createSignedUrl(doc.storage_path, 60);
  if (error || !data) {
    return { url: null, error: error?.message ?? 'No se pudo generar el enlace.' };
  }
  return { url: data.signedUrl, error: null };
}
