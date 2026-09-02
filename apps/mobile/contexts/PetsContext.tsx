import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Alert } from 'react-native';

import type { Pet, PetFormValues } from '@petapp/shared';
import { getCurrentUser } from '@/lib/auth';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

// Sin sesión real (o sin Supabase conectado), las mascotas viven en memoria
// durante la sesión, a modo de demo navegable. En cuanto hay un propietario
// autenticado, este provider carga y persiste contra la tabla `pets` real
// (supabase/migrations/0001_init.sql), sin que las pantallas que lo consumen
// necesiten saber la diferencia.
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
  loading: boolean;
  isDemo: boolean;
  addPet: (values: PetFormValues) => Promise<Pet | null>;
  deletePet: (id: string) => Promise<boolean>;
}

const PetsContext = createContext<PetsContextValue | null>(null);

export function PetsProvider({ children }: { children: ReactNode }) {
  const [pets, setPets] = useState<Pet[]>(seedPets);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    getCurrentUser()
      .then(async (user) => {
        if (!active || !user) return;
        setOwnerId(user.profile.id);
        const { data, error } = await supabase
          .from('pets')
          .select('*')
          .eq('owner_id', user.profile.id)
          .order('created_at', { ascending: false });
        if (!active) return;
        if (error) {
          // Sin este catch, un error de red dejaba `pets` en el seed de demo sin avisar,
          // como si de verdad no hubiera mascotas guardadas para este propietario.
          Alert.alert('No se pudieron cargar tus mascotas', 'Intenta de nuevo en unos segundos.');
          return;
        }
        setPets((data as Pet[] | null) ?? []);
      })
      .catch(() => {
        if (active) Alert.alert('No se pudo cargar tu cuenta', 'Intenta de nuevo en unos segundos.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const addPet = useCallback(
    async (values: PetFormValues): Promise<Pet | null> => {
      if (ownerId) {
        const { data, error } = await supabase
          .from('pets')
          .insert({
            owner_id: ownerId,
            name: values.name,
            species: values.species,
            breed: values.breed || null,
            sex: values.sex,
            birth_date: values.birth_date || null,
            sterilized: values.sterilized,
            vaccinated: values.vaccinated,
            notes: values.notes || null,
          })
          .select()
          .single();
        if (error || !data) return null;
        setPets((prev) => [data as Pet, ...prev]);
        return data as Pet;
      }

      // Sin sesión de propietario real: queda solo en memoria, como demo.
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
    },
    [ownerId]
  );

  const deletePet = useCallback(
    async (id: string): Promise<boolean> => {
      if (ownerId) {
        const { error } = await supabase.from('pets').delete().eq('id', id).eq('owner_id', ownerId);
        if (error) return false;
      }
      setPets((prev) => prev.filter((pet) => pet.id !== id));
      return true;
    },
    [ownerId]
  );

  const value = useMemo<PetsContextValue>(
    () => ({ pets, loading, isDemo: !ownerId, addPet, deletePet }),
    [pets, loading, ownerId, addPet, deletePet]
  );

  return <PetsContext.Provider value={value}>{children}</PetsContext.Provider>;
}

export function usePets(): PetsContextValue {
  const ctx = useContext(PetsContext);
  if (!ctx) {
    throw new Error('usePets debe usarse dentro de <PetsProvider>');
  }
  return ctx;
}
