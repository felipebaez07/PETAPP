import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

/**
 * En nativo, `AsyncStorage` habla directo con el módulo nativo y es seguro
 * usarlo tal cual. En web, `AsyncStorage` cae a un shim que asume que existe
 * `window.localStorage` — asunción que se rompe durante el prerenderizado
 * estático de Expo Router (`expo export --platform web`), que ejecuta cada
 * pantalla una vez en Node, sin `window`. Este adaptador evita ese crash
 * devolviendo valores vacíos cuando no hay `window` (SSR/export) y usando
 * `localStorage` real cuando sí lo hay (navegador real).
 */
const webSafeStorage = {
  getItem: (key: string) => Promise.resolve(typeof window === 'undefined' ? null : window.localStorage.getItem(key)),
  setItem: (key: string, value: string) => {
    if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
    return Promise.resolve();
  },
  removeItem: (key: string) => {
    if (typeof window !== 'undefined') window.localStorage.removeItem(key);
    return Promise.resolve();
  },
};

const authStorage = Platform.OS === 'web' ? webSafeStorage : AsyncStorage;

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * `true` cuando el piloto tiene un proyecto Supabase real conectado (Fase 1
 * todavía no lo tiene, ver PDD). Las pantallas deben revisar esta bandera
 * antes de intentar una llamada real y mostrar un mensaje amigable en vez de
 * lanzar una petición que fallará.
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Cliente de Supabase para la app móvil. Si las variables de entorno
 * `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` no están
 * definidas (caso actual del piloto), usamos valores de respaldo con forma
 * válida para que `createClient` no lance una excepción al importar este
 * módulo. Revisa `isSupabaseConfigured` antes de usar `supabase` para nada
 * que dependa de una conexión real.
 */
export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-anon-key',
  {
    auth: {
      storage: authStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
