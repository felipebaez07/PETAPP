import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConsentToggle } from '@/components/cuidador/consent-toggle';

/**
 * Requisito legal explícito (LG-008, docs/legal/registro-legal.md): dos consentimientos
 * separados, con su propio registro de cuándo/cómo se otorgó o revocó cada uno
 * (0024_owner_consents.sql). Sin esta pantalla, "comunicaciones_comerciales" nunca podría
 * otorgarse (nace en `false`, opt-in puro) — es lo que habilita que exista el público objetivo de
 * cualquier campaña más adelante.
 */
export default async function PrivacidadPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/panel/login');
  if (user.profile.role !== 'propietario') redirect('/cuidador/mascotas');

  const supabase = await createSupabaseServerClient();
  const [{ data: serviceConsent }, { data: commercialConsent }] = await Promise.all([
    supabase.rpc('has_active_consent', { check_owner_id: user.profile.id, check_type: 'recordatorios_servicio' }),
    supabase.rpc('has_active_consent', { check_owner_id: user.profile.id, check_type: 'comunicaciones_comerciales' }),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Privacidad y comunicaciones</h1>
        <p className="mt-1 text-sm text-muted-foreground">Controla qué avisos quieres recibir de tus establecimientos.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tus permisos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ConsentToggle
            consentType="recordatorios_servicio"
            label="Recordatorios de servicios de mis mascotas"
            description="Avisos de vacunas, baños u otros servicios recurrentes vencidos en los establecimientos que ya han atendido a tu mascota. Activado por defecto, como continuidad de un servicio ya contratado — puedes desactivarlo cuando quieras."
            initialGranted={Boolean(serviceConsent)}
          />
          <ConsentToggle
            consentType="comunicaciones_comerciales"
            label="Comunicaciones comerciales y campañas"
            description="Jornadas y promociones de establecimientos donde ya has tenido citas. No se activa hasta que tú lo autorices a propósito, y puedes retirarlo en cualquier momento."
            initialGranted={Boolean(commercialConsent)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
