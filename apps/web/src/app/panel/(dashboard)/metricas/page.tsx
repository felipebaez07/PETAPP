import { redirect } from 'next/navigation';
import { BarChart3, Star } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { ServiceRequestStatus } from '@petapp/shared';

/** Estados en los que una solicitud ya se resolvió — `pendiente`/`confirmada` todavía pueden
 * cambiar, así que no cuentan para la tasa de conversión (ver bloque 2 más abajo). */
const TERMINAL_STATUSES: ServiceRequestStatus[] = ['completada', 'cancelada', 'no_asistio'];

interface ServiceRequestRow {
  created_at: string;
  status: ServiceRequestStatus;
}

interface MonthBucket {
  key: string;
  label: string;
  count: number;
}

/** "AAAA-MM" en hora LOCAL del servidor — mismo criterio ya usado en el panel (ver
 * `todayLocalDateString` en packages/shared/src/utils.ts y `localDateKey` en solicitudes/page.tsx):
 * componentes locales de `Date`, nunca `toISOString()`. */
function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(date: Date): string {
  const label = date.toLocaleDateString('es-CO', { month: 'short' }).replace(/\.$/, '');
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Construye los 6 baldes de mes (el actual + los 5 anteriores, de más viejo a más nuevo) y cuenta
 * cuántas filas cayeron en cada uno. Agregación en JS sobre las filas ya traídas — misma filosofía
 * que ya usa solicitudes/page.tsx para su agenda por día, no hace falta SQL de agregación acá. */
function buildMonthBuckets(rows: { created_at: string }[]): MonthBucket[] {
  const now = new Date();
  const buckets: MonthBucket[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ key: monthKey(d), label: monthLabel(d), count: 0 });
  }
  for (const row of rows) {
    const created = new Date(row.created_at);
    if (Number.isNaN(created.getTime())) continue;
    const bucket = buckets.find((b) => b.key === monthKey(created));
    if (bucket) bucket.count += 1;
  }
  return buckets;
}

/** Alto de la barra como % del máximo de la serie — con un piso del 6% para que un mes con pocas
 * citas siga siendo visible (una barra de 1px de alto sería indistinguible de "sin datos"). */
function barHeightPercent(count: number, max: number): number {
  if (max <= 0 || count <= 0) return 0;
  return Math.max((count / max) * 100, 6);
}

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value.toFixed(1)} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`size-4 ${n <= Math.round(value) ? 'fill-accent text-accent' : 'fill-none text-muted-foreground'}`}
        />
      ))}
    </div>
  );
}

export default async function MetricasPage() {
  const user = await getCurrentUser();
  if (!user?.establishment || !user.isEstablishmentOwner) redirect('/panel');

  const supabase = await createSupabaseServerClient();
  const establishmentId = user.establishment.id;

  const [{ data: requestsData }, { data: reviewsData }, { data: patientsData }, { data: recordsData }] = await Promise.all([
    supabase.from('service_requests').select('created_at, status').eq('establishment_id', establishmentId),
    supabase.from('establishment_reviews').select('rating').eq('establishment_id', establishmentId),
    supabase.from('clinical_patients').select('id, created_at').eq('establishment_id', establishmentId),
    supabase.from('clinical_records').select('clinical_patient_id').eq('establishment_id', establishmentId),
  ]);

  const requests = (requestsData ?? []) as ServiceRequestRow[];
  const reviews = (reviewsData ?? []) as { rating: number }[];
  const patients = (patientsData ?? []) as { id: string; created_at: string }[];
  const records = (recordsData ?? []) as { clinical_patient_id: string }[];

  // 1. Citas por mes (últimos 6 meses).
  const monthBuckets = buildMonthBuckets(requests);
  const maxMonthCount = Math.max(0, ...monthBuckets.map((b) => b.count));

  // 2. Tasa de conversión: solo sobre solicitudes que ya llegaron a un estado terminal.
  const terminalRequests = requests.filter((r) => TERMINAL_STATUSES.includes(r.status));
  const completedCount = terminalRequests.filter((r) => r.status === 'completada').length;
  const conversionRate =
    terminalRequests.length > 0 ? Math.round((completedCount / terminalRequests.length) * 100) : null;

  // 3. Calificación promedio.
  const averageRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null;

  // 4. Pacientes nuevos este mes vs. recurrentes (2+ consultas en clinical_records).
  const currentMonthKey = monthKey(new Date());
  const newPatientsThisMonth = patients.filter((p) => monthKey(new Date(p.created_at)) === currentMonthKey).length;

  const visitCountByPatient = new Map<string, number>();
  for (const record of records) {
    visitCountByPatient.set(record.clinical_patient_id, (visitCountByPatient.get(record.clinical_patient_id) ?? 0) + 1);
  }
  const recurringPatients = patients.filter((p) => (visitCountByPatient.get(p.id) ?? 0) >= 2).length;
  const totalPatients = patients.length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">Métricas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Desempeño de {user.establishment.name} — todo lo de abajo se calcula solo con datos de tu propio
          establecimiento.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card className="sm:col-span-2">
          <CardHeader className="flex-row items-start gap-2 space-y-0">
            <BarChart3 className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <div>
              <CardTitle className="text-base">Citas por mes</CardTitle>
              <CardDescription>Solicitudes de cita recibidas en los últimos 6 meses.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 items-end gap-2 sm:gap-4">
              {monthBuckets.map((bucket) => (
                <div key={bucket.key} className="flex flex-col items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">{bucket.count}</span>
                  <div className="flex h-40 w-full items-end justify-center">
                    <div
                      className="w-full max-w-10 rounded-t-md bg-primary transition-all"
                      style={{ height: `${barHeightPercent(bucket.count, maxMonthCount)}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{bucket.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tasa de conversión</CardTitle>
            <CardDescription>
              De las solicitudes que ya se resolvieron, cuántas terminaron en cita completada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {conversionRate === null ? (
              <p className="text-sm text-muted-foreground">Todavía no hay suficientes datos.</p>
            ) : (
              <div>
                <p className="font-heading text-3xl font-bold text-foreground">{conversionRate}%</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {completedCount} de {terminalRequests.length} solicitudes resueltas terminaron en cita completada.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Calificación promedio</CardTitle>
            <CardDescription>Promedio de las reseñas que te dejaron los cuidadores.</CardDescription>
          </CardHeader>
          <CardContent>
            {averageRating === null ? (
              <p className="text-sm text-muted-foreground">Todavía no tienes reseñas.</p>
            ) : (
              <div className="flex items-center gap-2">
                <StarRating value={averageRating} />
                <span className="font-heading text-2xl font-bold text-foreground">{averageRating.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">
                  ({reviews.length} {reviews.length === 1 ? 'reseña' : 'reseñas'})
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pacientes nuevos este mes</CardTitle>
            <CardDescription>Pacientes registrados en el mes calendario actual.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl font-bold text-foreground">{newPatientsThisMonth}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pacientes recurrentes</CardTitle>
            <CardDescription>Con 2 o más consultas registradas, sobre el total de tus pacientes.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl font-bold text-foreground">
              {recurringPatients}{' '}
              <span className="text-base font-normal text-muted-foreground">de {totalPatients}</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              &quot;Recurrente&quot; = un paciente que volvió a tener al menos una consulta después de la primera.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
