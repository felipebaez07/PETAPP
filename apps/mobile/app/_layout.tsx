import '../global.css';

import { Lexend_600SemiBold, Lexend_700Bold } from '@expo-google-fonts/lexend';
import {
  SourceSans3_400Regular,
  SourceSans3_500Medium,
  SourceSans3_600SemiBold,
} from '@expo-google-fonts/source-sans-3';
import { COLORS } from '@petapp/shared';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PetsProvider } from '@/contexts/PetsContext';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// Evita que el splash screen se oculte antes de que las fuentes carguen.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Lexend_600SemiBold,
    Lexend_700Bold,
    SourceSans3_400Regular,
    SourceSans3_500Medium,
    SourceSans3_600SemiBold,
  });

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <PetsProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: COLORS.primary },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: { fontFamily: 'Lexend_600SemiBold', fontSize: 17 },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: COLORS.background },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth-callback" options={{ headerShown: false }} />
          <Stack.Screen name="establecimiento/[id]" options={{ title: 'Establecimiento' }} />
          <Stack.Screen
            name="mascotas/nueva"
            options={{ title: 'Agregar mascota', presentation: 'modal' }}
          />
          <Stack.Screen name="mascotas/[id]" options={{ title: 'Mascota' }} />
          <Stack.Screen name="negocio-perfil" options={{ title: 'Perfil del negocio' }} />
          <Stack.Screen name="negocio-horarios" options={{ title: 'Horarios' }} />
          <Stack.Screen name="negocio-servicios" options={{ title: 'Servicios' }} />
          {/* Antes "negocio-solicitudes" (Stack): ahora vive como tab "Agenda" en (tabs)/agenda.tsx,
              visible solo para cuentas de establecimiento (ver (tabs)/_layout.tsx). */}
          <Stack.Screen name="negocio-plan" options={{ title: 'Mi plan' }} />
          <Stack.Screen name="+not-found" options={{ title: 'No encontrado' }} />
        </Stack>
      </PetsProvider>
    </SafeAreaProvider>
  );
}
