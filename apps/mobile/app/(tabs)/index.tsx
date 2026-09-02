import { APP_TAGLINE, DEMO_PREVENTIVE_EVENTS, type PreventiveEvent } from '@petapp/shared';
import { useRouter } from 'expo-router';
import { Building2, CalendarCheck2, PartyPopper, Plus } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { PreventiveEventRow } from '@/components/PreventiveEventRow';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { usePets } from '@/contexts/PetsContext';
import { fetchPreventiveEventsForPets } from '@/lib/data';
import { supabase } from '@/lib/supabase';

function sortByDueDate(events: PreventiveEvent[]): PreventiveEvent[] {
  return [...events].sort((a, b) => a.due_date.localeCompare(b.due_date));
}

export default function HomeScreen() {
  const router = useRouter();
  const { pets, loading: loadingPets, isDemo } = usePets();
  const [events, setEvents] = useState<PreventiveEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  const petNameById = useMemo(() => new Map(pets.map((pet) => [pet.id, pet.name])), [pets]);
  const petIds = useMemo(() => pets.map((pet) => pet.id), [pets]);

  useEffect(() => {
    let active = true;
    if (loadingPets) return;

    if (petIds.length === 0) {
      setEvents([]);
      setLoadingEvents(false);
      return;
    }

    if (isDemo) {
      // Mismo motivo que en la ficha de mascota: las mascotas de demo no tienen fila
      // real en `pets`, así que este resumen nunca debe consultar el backend con sus ids.
      setEvents(sortByDueDate(DEMO_PREVENTIVE_EVENTS.filter((event) => petIds.includes(event.pet_id))));
      setLoadingEvents(false);
      return;
    }

    setLoadingEvents(true);
    fetchPreventiveEventsForPets(petIds)
      .then((data) => {
        if (active) setEvents(sortByDueDate(data));
      })
      .finally(() => {
        if (active) setLoadingEvents(false);
      });
    return () => {
      active = false;
    };
  }, [petIds, isDemo, loadingPets]);

  async function handleToggleEvent(event: PreventiveEvent) {
    const nextCompletedAt = event.completed_at ? null : new Date().toISOString();

    if (isDemo) {
      setEvents((prev) => prev.map((e) => (e.id === event.id ? { ...e, completed_at: nextCompletedAt } : e)));
      return;
    }
    const { data, error } = await supabase
      .from('preventive_events')
      .update({ completed_at: nextCompletedAt })
      .eq('id', event.id)
      .select()
      .single();
    if (error) {
      Alert.alert('No se pudo actualizar', error.message);
      return;
    }
    setEvents((prev) => prev.map((e) => (e.id === event.id ? (data as PreventiveEvent) : e)));
  }

  const pending = events.filter((event) => !event.completed_at);
  const overdueCount = pending.filter((event) => event.due_date < new Date().toISOString().slice(0, 10)).length;

  if (loadingPets || loadingEvents) {
    return <LoadingState label="Cargando tu resumen..." />;
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 32 }}>
      <ScreenHeader title="Inicio" subtitle={APP_TAGLINE} />

      {isDemo ? (
        <Text className="px-5 pt-3 font-body text-xs text-mutedForeground">
          Inicia sesión para ver tus propios recordatorios — estos son solo de ejemplo.
        </Text>
      ) : null}

      <View className="gap-3 px-5 pt-5">
        <View className="flex-row items-center justify-between">
          <Text className="font-heading text-lg text-foreground">Próximos vencimientos</Text>
          {overdueCount > 0 ? (
            <View className="rounded-sm bg-destructive px-2 py-1">
              <Text className="font-bodySemibold text-xs text-white">
                {overdueCount} vencido{overdueCount === 1 ? '' : 's'}
              </Text>
            </View>
          ) : null}
        </View>

        {pending.length === 0 ? (
          <EmptyState
            icon={PartyPopper}
            title="Estás al día"
            description="No tienes vacunas, controles ni desparasitaciones pendientes por ahora. Te avisaremos apenas se acerque la próxima."
          />
        ) : (
          <View className="gap-2.5">
            {pending.slice(0, 6).map((event, index) => (
              <Animated.View
                key={event.id}
                entering={
                  index < 8
                    ? FadeInDown.duration(260).delay(index * 40).springify().damping(26).stiffness(220)
                    : undefined
                }
              >
                {/* `mascotas/[id]` no queda tipado como ruta dinámica en este monorepo, ver PetCard.tsx */}
                <Pressable onPress={() => router.push(`/mascotas/${event.pet_id}` as any)}>
                  <PreventiveEventRow
                    event={event}
                    onToggleComplete={handleToggleEvent}
                    showPetName={petNameById.get(event.pet_id)}
                  />
                </Pressable>
              </Animated.View>
            ))}
          </View>
        )}
      </View>

      <View className="mt-8 gap-3 px-5">
        <Text className="font-heading text-lg text-foreground">Accesos rápidos</Text>
        <View className="flex-row gap-3">
          <Pressable
            onPress={() => router.push('/mascotas/nueva')}
            accessibilityRole="button"
            style={({ pressed }) => (pressed ? { transform: [{ scale: 0.97 }] } : undefined)}
            className="flex-1 items-center gap-2 rounded-xl bg-card p-4 shadow-sm"
          >
            <View className="h-11 w-11 items-center justify-center rounded-md bg-backgroundAlt">
              <Plus size={22} color="#0369A1" />
            </View>
            <Text className="text-center font-bodySemibold text-sm text-foreground">Agregar mascota</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(tabs)/directorio')}
            accessibilityRole="button"
            style={({ pressed }) => (pressed ? { transform: [{ scale: 0.97 }] } : undefined)}
            className="flex-1 items-center gap-2 rounded-xl bg-card p-4 shadow-sm"
          >
            <View className="h-11 w-11 items-center justify-center rounded-md bg-backgroundAlt">
              <Building2 size={22} color="#0369A1" />
            </View>
            <Text className="text-center font-bodySemibold text-sm text-foreground">Ver directorio</Text>
          </Pressable>
        </View>
      </View>

      {pets.length === 0 ? (
        <View className="mt-6 px-5">
          <EmptyState
            icon={CalendarCheck2}
            title="Registra tu primera mascota"
            description="Así podremos ayudarte a llevar su calendario preventivo al día."
            actionLabel="Agregar mascota"
            onAction={() => router.push('/mascotas/nueva')}
          />
        </View>
      ) : null}
    </ScrollView>
  );
}
