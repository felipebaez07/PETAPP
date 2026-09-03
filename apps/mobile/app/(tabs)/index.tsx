import {
  APP_TAGLINE,
  DEMO_PREVENTIVE_EVENTS,
  type Establishment,
  type PreventiveEvent,
} from '@petapp/shared';
import { useRouter } from 'expo-router';
import {
  Building2,
  CalendarCheck2,
  CalendarClock,
  ChevronRight,
  Clock,
  CreditCard,
  ListChecks,
  PartyPopper,
  Plus,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { PreventiveEventRow } from '@/components/PreventiveEventRow';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { usePets } from '@/contexts/PetsContext';
import { getCurrentUser, type CurrentUser } from '@/lib/auth';
import { fetchPreventiveEventsForPets } from '@/lib/data';
import { formatAgendaDateTime } from '@/lib/labels';
import { supabase } from '@/lib/supabase';
import { useTabBarBottomInset } from '@/lib/tabBar';

function sortByDueDate(events: PreventiveEvent[]): PreventiveEvent[] {
  return [...events].sort((a, b) => a.due_date.localeCompare(b.due_date));
}

/**
 * "Inicio" se ramifica por rol (spec.md sección 6, punto 4): un cuidador nunca debe ver el
 * dashboard de negocio y viceversa. Sin sesión, se usa el dashboard de cuidador (como hoy
 * con datos de demo) mientras se resuelve — o si nunca hay sesión — el rol del usuario.
 */
export default function HomeScreen() {
  const [user, setUser] = useState<CurrentUser | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    function refreshUser() {
      getCurrentUser()
        .then((current) => {
          if (active) setUser(current);
        })
        .catch(() => {
          if (active) setUser(null);
        });
    }

    refreshUser();
    // "Inicio" es una tab que se monta una sola vez al abrir la app (antes de iniciar
    // sesión, si es la primera pantalla que se ve) — sin este listener, `user` quedaba
    // pegado en el estado con el que arrancó y nunca mostraba el dashboard correcto
    // después de loguearse. Mismo bug ya corregido en (tabs)/_layout.tsx y PetsContext.tsx.
    const { data: subscription } = supabase.auth.onAuthStateChange(() => refreshUser());

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  if (user === undefined) {
    return <LoadingState label="Cargando tu inicio..." />;
  }

  if (user?.profile.role === 'establecimiento') {
    return <BusinessHomeScreen establishment={user.establishment} />;
  }

  return <CuidadorHomeScreen />;
}

interface NextAppointment {
  id: string;
  preferred_datetime: string;
  pet_owner: { full_name: string } | null;
  pet: { name: string } | null;
  service: { name: string } | null;
}

/** Dashboard de negocio: resumen de solicitudes + accesos rápidos a la gestión del negocio. */
function BusinessHomeScreen({ establishment }: { establishment: Establishment | null }) {
  const router = useRouter();
  const tabBarBottomInset = useTabBarBottomInset();
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [nextAppointment, setNextAppointment] = useState<NextAppointment | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    if (!establishment) {
      setPendingCount(null);
      setNextAppointment(null);
      return;
    }

    (async () => {
      const { count, error: countError } = await supabase
        .from('service_requests')
        .select('id', { count: 'exact', head: true })
        .eq('establishment_id', establishment.id)
        .eq('status', 'pendiente');
      if (!active) return;
      if (countError) {
        Alert.alert('No se pudo cargar el resumen', countError.message);
      } else {
        setPendingCount(count ?? 0);
      }

      const { data, error } = await supabase
        .from('service_requests')
        .select('id, preferred_datetime, pet_owner:profiles(full_name), pet:pets(name), service:services(name)')
        .eq('establishment_id', establishment.id)
        .eq('status', 'confirmada')
        .not('preferred_datetime', 'is', null)
        .gte('preferred_datetime', new Date().toISOString())
        .order('preferred_datetime', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!active) return;
      if (error) {
        setNextAppointment(null);
        return;
      }
      setNextAppointment((data as unknown as NextAppointment | null) ?? null);
    })();

    return () => {
      active = false;
    };
  }, [establishment]);

  const quickLinks = [
    { label: 'Perfil del negocio', icon: Building2, href: '/negocio-perfil' as const },
    { label: 'Horarios', icon: Clock, href: '/negocio-horarios' as const },
    { label: 'Servicios', icon: ListChecks, href: '/negocio-servicios' as const },
    { label: 'Mi plan', icon: CreditCard, href: '/negocio-plan' as const },
  ];

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: tabBarBottomInset }}>
      <ScreenHeader
        title="Inicio"
        subtitle={establishment ? `Panel de ${establishment.name}` : 'Panel de tu negocio en PETAPP'}
      />

      {!establishment ? (
        <View className="p-5">
          <EmptyState
            icon={Building2}
            title="Crea el perfil de tu negocio"
            description="Tu cuenta ya está lista como prestador — solo falta este último paso para aparecer en el directorio."
            actionLabel="Crear mi negocio"
            onAction={() => router.push('/negocio-crear')}
          />
        </View>
      ) : (
        <View className="gap-5 px-5 pt-5">
          <View className="flex-row gap-3">
            <Pressable
              onPress={() => router.push('/(tabs)/agenda')}
              accessibilityRole="button"
              style={({ pressed }) => (pressed ? { transform: [{ scale: 0.97 }] } : undefined)}
              className="flex-1 gap-2 rounded-xl bg-card p-4 shadow-sm"
            >
              <View
                className="h-11 w-11 items-center justify-center rounded-md bg-backgroundAlt"
                accessible={false}
              >
                <CalendarClock size={22} color="#0369A1" />
              </View>
              <Text className="font-headingBold text-2xl tracking-tight text-foreground">{pendingCount ?? '—'}</Text>
              <Text className="font-bodyMedium text-sm text-mutedForeground">
                Solicitud{pendingCount === 1 ? '' : 'es'} pendiente{pendingCount === 1 ? '' : 's'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/(tabs)/agenda')}
              accessibilityRole="button"
              style={({ pressed }) => (pressed ? { transform: [{ scale: 0.97 }] } : undefined)}
              className="flex-1 gap-2 rounded-xl bg-card p-4 shadow-sm"
            >
              <View
                className="h-11 w-11 items-center justify-center rounded-md bg-backgroundAlt"
                accessible={false}
              >
                <CalendarCheck2 size={22} color="#0369A1" />
              </View>
              {nextAppointment === undefined ? (
                <Text className="font-body text-sm text-mutedForeground">Cargando...</Text>
              ) : nextAppointment ? (
                <>
                  <Text className="font-bodySemibold text-sm text-foreground">
                    {formatAgendaDateTime(nextAppointment.preferred_datetime)}
                  </Text>
                  <Text className="font-body text-xs text-mutedForeground" numberOfLines={1}>
                    {nextAppointment.pet_owner?.full_name ?? 'Cuidador'}
                    {nextAppointment.pet?.name ? ` · ${nextAppointment.pet.name}` : ''}
                  </Text>
                </>
              ) : (
                <Text className="font-body text-sm text-mutedForeground">Sin próxima cita</Text>
              )}
            </Pressable>
          </View>

          <View className="gap-3">
            <Text className="font-heading text-lg text-foreground">Gestionar mi negocio</Text>
            <View className="overflow-hidden rounded-xl bg-card shadow-sm">
              {quickLinks.map((item, index, arr) => (
                <Pressable
                  key={item.href}
                  onPress={() => router.push(item.href)}
                  accessibilityRole="button"
                  style={({ pressed }) => (pressed ? { backgroundColor: '#E7EEF2' } : undefined)}
                  className={[
                    'min-h-11 flex-row items-center gap-3 px-4 py-3',
                    index < arr.length - 1 ? 'border-b border-border' : '',
                  ].join(' ')}
                >
                  <item.icon size={20} color="#0369A1" />
                  <Text className="flex-1 font-bodyMedium text-base text-foreground">{item.label}</Text>
                  <ChevronRight size={18} color="#64748B" />
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

/** Dashboard de cuidador: próximos vencimientos preventivos cruzando todas sus mascotas. */
function CuidadorHomeScreen() {
  const router = useRouter();
  const tabBarBottomInset = useTabBarBottomInset();
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
      .catch(() => {
        // Sin este catch, un error de red dejaba `events` en [] y mostraba "Estás al día"
        // como si de verdad no hubiera pendientes — un falso positivo tranquilizador.
        if (active) Alert.alert('No se pudieron cargar tus recordatorios', 'Intenta de nuevo en unos segundos.');
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
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: tabBarBottomInset }}>
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
            <View
              className="h-11 w-11 items-center justify-center rounded-md bg-backgroundAlt"
              accessible={false}
            >
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
            <View
              className="h-11 w-11 items-center justify-center rounded-md bg-backgroundAlt"
              accessible={false}
            >
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
