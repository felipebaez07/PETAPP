import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CATEGORY_LABELS, type PartnerApplication } from '@petapp/shared';
import { ConvertApplicationButton } from '@/components/panel/convert-application-button';

const STATUS_LABELS: Record<PartnerApplication['status'], string> = {
  nuevo: 'Nueva',
  contactado: 'Contactado',
  descartado: 'Descartado',
  convertido: 'Convertido en aliado',
};

export default async function AdminSolicitudesPage() {
  const user = await getCurrentUser();
  if (!user || user.profile.role !== 'admin') redirect('/panel');

  const supabase = await createSupabaseServerClient();
  const { data: applications } = await supabase
    .from('partner_applications')
    .select('*')
    .order('created_at', { ascending: false });

  const rows = (applications ?? []) as PartnerApplication[];
  const pendingCount = rows.filter((a) => a.status === 'nuevo').length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Solicitudes de &quot;Únete al piloto&quot;</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Convertir una solicitud crea el establecimiento en el directorio (sin dueño vinculado todavía y sin
            verificar) — vincula la cuenta del negocio y verifícalo después desde &quot;Verificar aliados&quot;.
          </p>
        </div>
        <Badge variant="outline">{pendingCount} nuevas</Badge>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no ha llegado ninguna solicitud.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((application) => (
            <Card key={application.id}>
              <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
                <div>
                  <CardTitle className="text-base">{application.business_name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {CATEGORY_LABELS[application.category]} · {application.contact_name} · {application.phone}
                  </p>
                </div>
                <Badge variant={application.status === 'convertido' ? 'success' : 'outline'}>
                  {STATUS_LABELS[application.status]}
                </Badge>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <p className="max-w-md text-sm text-muted-foreground">{application.message}</p>
                {application.status !== 'convertido' && (
                  <ConvertApplicationButton applicationId={application.id} />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
