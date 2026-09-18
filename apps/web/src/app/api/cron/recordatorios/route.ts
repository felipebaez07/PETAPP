import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { PREVENTIVE_EVENT_TYPE_LABELS, type PreventiveEventType } from '@petapp/shared';

/**
 * Cron diario (ver `apps/web/vercel.json`, `0 13 * * *` UTC ≈ 8:00 a.m. Colombia, UTC-5 sin
 * horario de verano) que avisa por email a los cuidadores cuando un `preventive_event`
 * (vacuna/control/desparasitación/otro/estética) vence en los próximos 3 días. Usa el cliente
 * admin (service role, bypassa RLS) porque este job no corre con sesión de ningún usuario —
 * necesita leer `preventive_events` de TODOS los cuidadores a la vez.
 *
 * Marca `reminder_sent_at` después de mandar el correo para no volver a mandar el mismo
 * recordatorio todos los días hasta la fecha de vencimiento (0020_preventive_events_reminder_tracking.sql).
 *
 * Antes de esa parte (que ya existía) corre un paso nuevo — "generación" (spec formal de
 * "recordatorios automáticos de servicios recurrentes", 0025_recurring_services.sql): por cada
 * `pet_service_recurrences` activa con `interval_weeks` definido, calcula si ya pasó ese tiempo
 * desde el último `service_request` completado de ese tipo, y si nadie lo silenció
 * (`pet_service_mutes`) ni ya existe un recordatorio pendiente del mismo tipo, crea un
 * `preventive_events` nuevo a nombre del establecimiento que atendió esa vez
 * (`generated_by_establishment_id`, 0027). El evento recién creado entra en la misma ventana de
 * envío de abajo en la misma corrida — no hace falta esperar al día siguiente.
 */

// Vercel invoca las rutas de cron con este header — es el mecanismo oficial de autenticación
// de Vercel Cron (no inventar otro esquema). Cualquier otro caller que no lo mande, 401.
function isAuthorizedCronRequest(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${cronSecret}`;
}

interface DueEventRow {
  id: string;
  pet_id: string;
  type: string;
  title: string;
  due_date: string;
  pet: { name: string; owner_id: string; profiles: { full_name: string } | null } | null;
  establishment: { slug: string } | null;
}

interface ActiveRecurrenceRow {
  id: string;
  pet_id: string;
  service_type: PreventiveEventType;
  interval_weeks: number;
}

interface CompletedServiceRequestRow {
  establishment_id: string;
  updated_at: string;
  services: { service_type: PreventiveEventType | null } | null;
}

interface PetMuteRow {
  scope: 'service' | 'establishment';
  service_type: PreventiveEventType | null;
  establishment_id: string | null;
}

function formatDueDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
}

function toDateOnlyString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Regla 3 de la spec: recorre las reglas de recurrencia activas y crea un `preventive_events`
 * nuevo cuando ya se cumplió el intervalo desde el último servicio de ese tipo completado — nunca
 * si no hay historial (no hay de dónde calcular "próximo"), si está silenciado, o si ya hay uno
 * pendiente del mismo tipo para esa mascota (evita duplicados en corridas sucesivas).
 */
async function generateDueRecurringReminders(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  today: Date
): Promise<{ generated: number }> {
  const { data: recurrences, error: recurrencesError } = await admin
    .from('pet_service_recurrences')
    .select('id, pet_id, service_type, interval_weeks')
    .eq('active', true)
    .not('interval_weeks', 'is', null);

  if (recurrencesError) {
    console.error('[cron/recordatorios] Error consultando pet_service_recurrences:', recurrencesError);
    return { generated: 0 };
  }

  let generated = 0;

  for (const recurrence of (recurrences ?? []) as ActiveRecurrenceRow[]) {
    const { data: completedRequests, error: completedError } = await admin
      .from('service_requests')
      .select('establishment_id, updated_at, services(service_type)')
      .eq('pet_id', recurrence.pet_id)
      .eq('status', 'completada')
      .order('updated_at', { ascending: false });

    if (completedError) {
      console.error('[cron/recordatorios] Error consultando service_requests para', recurrence.pet_id, completedError);
      continue;
    }

    const lastCompleted = ((completedRequests ?? []) as unknown as CompletedServiceRequestRow[]).find(
      (row) => row.services?.service_type === recurrence.service_type
    );
    // Sin un servicio completado antes de este tipo, no hay base para calcular "próximo" —
    // regla explícita: "si no hay historial, no se genera nada".
    if (!lastCompleted) continue;

    const nextDue = new Date(lastCompleted.updated_at);
    nextDue.setDate(nextDue.getDate() + recurrence.interval_weeks * 7);
    if (nextDue > today) continue;

    const { data: mutes, error: mutesError } = await admin
      .from('pet_service_mutes')
      .select('scope, service_type, establishment_id')
      .eq('pet_id', recurrence.pet_id);

    if (mutesError) {
      console.error('[cron/recordatorios] Error consultando pet_service_mutes para', recurrence.pet_id, mutesError);
      continue;
    }

    const isMuted = ((mutes ?? []) as PetMuteRow[]).some(
      (mute) =>
        (mute.scope === 'service' && mute.service_type === recurrence.service_type) ||
        (mute.scope === 'establishment' && mute.establishment_id === lastCompleted.establishment_id)
    );
    if (isMuted) continue;

    const { data: existingPending, error: pendingError } = await admin
      .from('preventive_events')
      .select('id')
      .eq('pet_id', recurrence.pet_id)
      .eq('type', recurrence.service_type)
      .is('completed_at', null)
      .maybeSingle();

    if (pendingError) {
      console.error('[cron/recordatorios] Error revisando duplicados para', recurrence.pet_id, pendingError);
      continue;
    }
    if (existingPending) continue;

    const dueDate = nextDue > today ? nextDue : today; // ya vencido — que caiga en la ventana de "hoy"
    const label = PREVENTIVE_EVENT_TYPE_LABELS[recurrence.service_type] ?? recurrence.service_type;

    const { error: insertError } = await admin.from('preventive_events').insert({
      pet_id: recurrence.pet_id,
      type: recurrence.service_type,
      title: `Es hora de: ${label}`,
      due_date: toDateOnlyString(dueDate),
      generated_by_establishment_id: lastCompleted.establishment_id,
    });

    if (insertError) {
      console.error('[cron/recordatorios] Error creando recordatorio recurrente para', recurrence.pet_id, insertError);
      continue;
    }

    generated++;
  }

  return { generated };
}

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY no está configurada.' }, { status: 503 });
  }

  try {
    const admin = createSupabaseAdminClient();
    const resend = new Resend(resendApiKey);

    const today = new Date();
    const inThreeDays = new Date(today);
    inThreeDays.setDate(inThreeDays.getDate() + 3);
    const todayStr = toDateOnlyString(today);
    const limitStr = toDateOnlyString(inThreeDays);

    const { generated } = await generateDueRecurringReminders(admin, today);

    // completed_at es nullable (0005_pivot_preventivo.sql): "no completado" es completed_at is null,
    // esta tabla nunca tuvo una columna booleana `completed`.
    const { data: events, error: queryError } = await admin
      .from('preventive_events')
      .select(
        'id, pet_id, type, title, due_date, pet:pets(name, owner_id, profiles(full_name)), establishment:establishments!generated_by_establishment_id(slug)'
      )
      .is('completed_at', null)
      .is('reminder_sent_at', null)
      .gte('due_date', todayStr)
      .lte('due_date', limitStr);

    if (queryError) {
      console.error('[cron/recordatorios] Error consultando preventive_events:', queryError);
      return NextResponse.json({ error: 'No se pudo consultar los recordatorios.' }, { status: 500 });
    }

    const rows = (events ?? []) as unknown as DueEventRow[];

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const event of rows) {
      const pet = event.pet;
      if (!pet) {
        console.warn('[cron/recordatorios] Evento sin mascota asociada, se salta:', event.id);
        skipped++;
        continue;
      }

      const { data: userData, error: userError } = await admin.auth.admin.getUserById(pet.owner_id);
      const email = userData?.user?.email;
      if (userError || !email) {
        console.warn('[cron/recordatorios] Cuidador sin email, se salta:', pet.owner_id, userError);
        skipped++;
        continue;
      }

      const ownerName = pet.profiles?.full_name ?? 'hola';
      const dueDateFormatted = formatDueDate(event.due_date);

      // Regla 4: si este recordatorio lo generó el motor de recurrencias (viene con el
      // establecimiento que atendió la vez anterior), el correo lleva un link directo a la ficha
      // de ese prestador con la mascota y el servicio ya preseleccionados en el formulario
      // (`directorio/[slug]/page.tsx` resuelve `?mascota=`/`?servicio=` contra datos reales).
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://petapp-web-topaz.vercel.app';
      const bookingLink = event.establishment
        ? `${siteUrl}/directorio/${event.establishment.slug}?mascota=${encodeURIComponent(
            event.pet_id
          )}&servicio=${encodeURIComponent(event.type)}`
        : null;

      try {
        await resend.emails.send({
          // Remitente de prueba de Resend — no requiere verificar un dominio propio, pero solo
          // entrega al correo con el que te registraste en Resend (útil para probar el flujo
          // completo, no para mandarle recordatorios reales a cualquier cuidador). Cuando haya un
          // dominio propio verificado en el dashboard de Resend, cambiar esto a algo como
          // 'PeTech <recordatorios@tudominio.co>'.
          from: 'PeTech <onboarding@resend.dev>',
          to: email,
          subject: `Recordatorio: ${pet.name} tiene "${event.title}" pronto`,
          text: `Hola ${ownerName},\n\nTe escribimos para recordarte que ${pet.name} tiene pendiente "${event.title}" (${event.type}) con fecha de vencimiento el ${dueDateFormatted}.\n\nNo olvides agendar la cita a tiempo.${
            bookingLink ? `\n\nAgendar directamente: ${bookingLink}` : ''
          }\n\n— El equipo de PeTech`,
        });

        const { error: updateError } = await admin
          .from('preventive_events')
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq('id', event.id);

        if (updateError) {
          console.error('[cron/recordatorios] Enviado pero no se pudo marcar reminder_sent_at:', event.id, updateError);
          failed++;
        } else {
          sent++;
        }
      } catch (sendError) {
        console.error('[cron/recordatorios] Error enviando email para el evento', event.id, sendError);
        failed++;
      }
    }

    return NextResponse.json({
      generated,
      found: rows.length,
      sent,
      skipped,
      failed,
    });
  } catch (err) {
    console.error('[cron/recordatorios] Error inesperado:', err);
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }
}
