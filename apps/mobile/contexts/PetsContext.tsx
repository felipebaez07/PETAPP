import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import type { Pet, PetFormValues } from '@petapp/shared';

// Fase 1: no hay backend conectado todavía, así que las mascotas del
// propietario viven en memoria durante la sesión (se pierden al recargar).
// Cuando el proyecto Supabase esté provisionado, este provider debe:
//   1) cargar `pets` con un SELECT filtrado por owner_id = usuario autenticado, y
//   2) reemplazar `addPet` por un INSERT en la tabla `pets`
//      (ver supabase/migrations/0001_init.sql), manteniendo la misma firma
//      para no tocar las pantallas que lo consumen.
const DEMO_OWNER_ID = 'demo-owner-propietario';

function seedPets(): Pet[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'demo-pet-1',
      owner_id: DEMO_OWNER_ID,
      name: 'Max',
      species: 'perro',
      breed: 'Criollo',
      sex: 'macho',
      birth_date: '2022-03-10',
      sterilized: true,
      vaccinated: true,
      photo_url: null,
      notes: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'demo-pet-2',
      owner_id: DEMO_OWNER_ID,
      name: 'Mishi',
      species: 'gato',
      breed: 'Mestizo',
      sex: 'hembra',
      birth_date: null,
      sterilized: false,
      vaccinated: true,
      photo_url: null,
      notes: null,
      created_at: now,
      updated_at: now,
    },
  ];
}

interface PetsContextValue {
  pets: Pet[];
  addPet: (values: PetFormValues) => Pet;
}

const PetsContext = createContext<PetsContextValue | null>(null);

export function PetsProvider({ children }: { children: ReactNode }) {
  const [pets, setPets] = useState<Pet[]>(seedPets);

  const addPet = useCallback((values: PetFormValues): Pet => {
    const now = new Date().toISOString();
    const pet: Pet = {
      id: `local-${Date.now()}`,
      owner_id: DEMO_OWNER_ID,
      name: values.name,
      species: values.species,
      breed: values.breed ? values.breed : null,
      sex: values.sex,
      birth_date: values.birth_date ? values.birth_date : null,
      sterilized: values.sterilized,
      vaccinated: values.vaccinated,
      photo_url: null,
      notes: values.notes ? values.notes : null,
      created_at: now,
      updated_at: now,
    };
    setPets((prev) => [pet, ...prev]);
    return pet;
  }, []);

  const value = useMemo<PetsContextValue>(() => ({ pets, addPet }), [pets, addPet]);

  return <PetsContext.Provider value={value}>{children}</PetsContext.Provider>;
}

export function usePets(): PetsContextValue {
  const ctx = useContext(PetsContext);
  if (!ctx) {
    throw new Error('usePets debe usarse dentro de <PetsProvider>');
  }
  return ctx;
}
