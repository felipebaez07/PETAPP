import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL } from './config';

/**
 * ⚠️ SOLO SERVIDOR — NUNCA importar este archivo desde un Client Component ni desde
 * cualquier código que pueda terminar empaquetado para el navegador. Este cliente usa la
 * `SUPABASE_SERVICE_ROLE_KEY`, que salta por completo la RLS de todas las tablas: cualquier
 * fuga al bundle del cliente expondría acceso total a la base de datos de todos los usuarios.
 * `import 'server-only'` de arriba hace que el build falle si algo del lado del cliente
 * intenta importarlo (mismo patrón que `src/lib/auth.ts`).
 *
 * Uso previsto: jobs de servidor sin sesión de usuario (cron, workers) que necesitan leer/
 * escribir across todos los usuarios, o resolver el email de un usuario con
 * `admin.auth.admin.getUserById(userId)` — el email vive en `auth.users`, no en `profiles`
 * (limitación ya conocida en este codebase, no un descuido a "arreglar" agregando una
 * columna de email a `profiles`).
 */

let cachedClient: SupabaseClient | null = null;

export function createSupabaseAdminClient(): SupabaseClient {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !serviceRoleKey) {
    throw new Error(
      'Supabase admin no está configurado (faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).'
    );
  }
  if (cachedClient) return cachedClient;
  cachedClient = createClient(SUPABASE_URL, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cachedClient;
}
