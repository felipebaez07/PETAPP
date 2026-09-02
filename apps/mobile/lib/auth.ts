import type { Establishment, Profile } from '@petapp/shared';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { isSupabaseConfigured, supabase } from './supabase';

// Cierra correctamente la pestaña/sesión del navegador de autenticación al volver a la app
// tras el redirect de Google — recomendación estándar de expo-web-browser para este flujo.
WebBrowser.maybeCompleteAuthSession();

export interface CurrentUser {
  profile: Profile;
  establishment: Establishment | null;
}

/** Equivalente móvil de apps/web/src/lib/auth.ts — sin @supabase/ssr, mismo resultado. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!isSupabaseConfigured) return null;

  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .maybeSingle();
  if (!profile) return null;

  let establishment: Establishment | null = null;
  if ((profile as Profile).role === 'establecimiento') {
    // .limit(1) en vez de .maybeSingle(): si por error administrativo owner_id quedara
    // vinculado a más de una fila, .maybeSingle() lanzaría un error que esta función
    // ignoraba en silencio, mostrando "sin establecimiento" en vez del real. Mismo fix
    // que ya tiene apps/web/src/lib/auth.ts — se había reintroducido el bug al portarlo.
    const { data } = await supabase
      .from('establishments')
      .select('*')
      .eq('owner_id', (profile as Profile).id)
      .limit(1);
    establishment = (data?.[0] as Establishment | undefined) ?? null;
  }

  return { profile: profile as Profile, establishment };
}

/**
 * Extrae los parámetros de un URL de retorno de OAuth, ya sea del fragment
 * ("#access_token=...", flujo implícito) o de la query ("?code=..."). Se parsea a mano en vez
 * de con `URL`/`URLSearchParams` porque su soporte en Hermes (el motor JS de React Native) es
 * inconsistente entre versiones — esto funciona igual en iOS, Android y web.
 */
function parseAuthParams(url: string): Record<string, string> {
  const hashIndex = url.indexOf('#');
  const queryIndex = url.indexOf('?');
  const start = hashIndex >= 0 ? hashIndex + 1 : queryIndex >= 0 ? queryIndex + 1 : -1;
  if (start === -1) return {};
  const params: Record<string, string> = {};
  for (const pair of url.slice(start).split('&')) {
    const [key, rawValue] = pair.split('=');
    if (key) params[decodeURIComponent(key)] = decodeURIComponent(rawValue ?? '');
  }
  return params;
}

/** Aplica los tokens de un URL de retorno de Google a la sesión de Supabase. */
async function completeGoogleSignIn(url: string): Promise<{ error: string | null }> {
  const params = parseAuthParams(url);
  if (params.error) return { error: params.error_description ?? params.error };
  if (!params.access_token || !params.refresh_token) {
    return { error: 'No se recibió la sesión de Google correctamente.' };
  }
  const { error } = await supabase.auth.setSession({
    access_token: params.access_token,
    refresh_token: params.refresh_token,
  });
  return { error: error?.message ?? null };
}

/**
 * Inicia sesión con Google. En web (navegador real o el export estático de la app móvil)
 * simplemente redirige la página, igual que ya hace `apps/web` — Supabase vuelve a traer al
 * usuario con los tokens en el fragment de la URL, y `app/auth-callback.tsx` los recoge.
 *
 * En nativo (iOS/Android) no hay navegador de la app que redirigir: se abre el flujo en un
 * navegador de sistema controlado (`expo-web-browser`), que intercepta el redirect a la URL
 * de esquema propio (`petapp://auth-callback`, ver `scheme` en app.json) sin salir de la app.
 *
 * Importante: este redirect por esquema propio solo lo puede capturar una build real de la
 * app (dev client o standalone) — Expo Go no es dueño del esquema `petapp://`, así que este
 * flujo no completa el regreso a la app cuando se prueba escaneando el QR de Expo Go.
 */
export async function signInWithGoogle(): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured) {
    return { error: 'Este piloto todavía no tiene el backend conectado.' };
  }

  const redirectTo =
    Platform.OS === 'web' && typeof window !== 'undefined'
      ? `${window.location.origin}/auth-callback`
      : Linking.createURL('/auth-callback');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error || !data?.url) {
    return { error: error?.message ?? 'No se pudo iniciar sesión con Google.' };
  }

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.location.assign(data.url);
    return { error: null };
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success' || !('url' in result) || !result.url) {
    return { error: 'Se canceló el inicio de sesión con Google.' };
  }
  return completeGoogleSignIn(result.url);
}

/** Usado por `app/auth-callback.tsx` para completar la sesión cuando sí hay navegación real (web). */
export { completeGoogleSignIn };
