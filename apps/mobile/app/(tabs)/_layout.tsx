import { COLORS } from '@petapp/shared';
import { Tabs } from 'expo-router';
import { Building2, CalendarClock, Home, PawPrint, UserRound } from 'lucide-react-native';
import { useEffect, useState } from 'react';

import { getCurrentUser } from '@/lib/auth';

/**
 * Dos interfaces distintas en la misma app (spec.md sección 6, punto 4): un cuidador
 * (`propietario`) ve Inicio/Mascotas/Directorio/Perfil; una empresa (`establecimiento`) ve
 * Inicio/Agenda/Directorio/Perfil — un negocio no necesariamente tiene mascotas propias, así
 * que la tab "Mascotas" no tiene sentido para ese rol, y a cambio gana "Agenda"
 * ((tabs)/agenda.tsx, antes negocio-solicitudes.tsx).
 *
 * Ambas rutas ("mascotas" y "agenda") quedan siempre registradas como pantallas — se ocultan
 * de la barra con `href: null` en vez de desmontarse, que es el patrón que documenta Expo
 * Router para tabs condicionales (no reestructurar archivos por rol, eso rompe el historial
 * de navegación). Sin sesión (o mientras se resuelve el rol), se usa el set de cuidador, que
 * es como se comporta hoy con datos de demo.
 */
export default function TabLayout() {
  const [isBusiness, setIsBusiness] = useState(false);

  useEffect(() => {
    let active = true;
    getCurrentUser()
      .then((user) => {
        if (active) setIsBusiness(user?.profile.role === 'establecimiento');
      })
      .catch(() => {
        if (active) setIsBusiness(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.secondary,
        tabBarInactiveTintColor: COLORS.mutedForeground,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 60,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontFamily: 'SourceSans3_600SemiBold',
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="mascotas"
        options={{
          title: 'Mascotas',
          tabBarIcon: ({ color, size }) => <PawPrint color={color} size={size} />,
          href: isBusiness ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'Agenda',
          tabBarIcon: ({ color, size }) => <CalendarClock color={color} size={size} />,
          href: isBusiness ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="directorio"
        options={{
          title: 'Directorio',
          tabBarIcon: ({ color, size }) => <Building2 color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
