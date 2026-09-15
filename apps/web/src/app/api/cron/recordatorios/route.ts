import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/**
 * Cron diario (ver `apps/web/vercel.json`, `0 13 * * *` UTC ≈ 8:00 a.m. Colombia, UTC-5 sin
 * horario de verano) que avisa por email a los cuidadores cuando un `preventive_event`
 * (vacuna/control/desparasitación/otro) vence en los próximos 3 días. Usa el cliente admin
 * (service role, bypassa RLS) porque este job no corre con sesión de ningún usuario — necesita
 * leer `preventive_events` de TODOS los cuidadores a la vez.
 *
 * Marca `reminder_sent_at` después de mandar el correo para no volver a mandar el mismo
 * recordatorio todos los días hasta la fecha de vencimiento (0020_preventive_events_reminder_tracking.sql).
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
  type: string;
  title: string;
  due_date: string;
  pet: { name: string; owner_id: string; profiles: { full_name: string } | null } | null;
}

function formatDueDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
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
    const todayStr = today.toISOString().slice(0, 10);
    const limitStr = inThreeDays.toISOString().slice(0, 10);

    // completed_at es nullable (0005_pivot_preventivo.sql): "no completado" es completed_at is null,
    // esta tabla nunca tuvo una columna booleana `completed`.
    const { data: events, error: queryError } = await admin
      .from('preventive_events')
      .select(
        'id, type, title, due_date, pet:pets(name, owner_id, profiles(full_name))'
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
          text: `Hola ${ownerName},\n\nTe escribimos para recordarte que ${pet.name} tiene pendiente "${event.title}" (${event.type}) con fecha de vencimiento el ${dueDateFormatted}.\n\nNo olvides agendar la cita a tiempo.\n\n— El equipo de PeTech`,
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
