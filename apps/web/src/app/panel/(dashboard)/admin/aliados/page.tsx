import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VerifiedBadge } from '@/components/directorio/verified-badge';
import { CATEGORY_LABELS, VERIFICATION_LABELS, type Establishment } from '@petapp/shared';
import { updateVerificationStatus } from './actions';

export default async function AdminAliadosPage() {
  const user = await getCurrentUser();
  if (!user || user.profile.role !== 'admin') redirect('/panel');

  const supabase = await createSupabaseServerClient();
  // Solo prestadores veterinaria/profesional — comercio/fundación quedaron fuera del
  // alcance del piloto (spec.md sección 5) y ya están ocultos con is_active=false.
  const { data: establishments } = await supabase
    .from('establishments')
    .select('*')
    .in('category', ['veterinaria', 'profesional'])
    .order('created_at', { ascending: false });

  const rows = (establishments ?? []) as Establishment[];
  const pendingCount = rows.filter((e) => e.verification_status !== 'verificado').length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-foreground">Verificación de aliados</h1>
        <Badge variant="outline">{pendingCount} pendientes</Badge>
      </div>

      <div className="space-y-3">
        {rows.map((establishment) => (
          <Card key={establishment.id}>
            <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
              <div>
                <CardTitle className="text-base">{establishment.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {CATEGORY_LABELS[establishment.category]} · {establishment.address ?? establishment.city}
                </p>
              </div>
              <VerifiedBadge status={establishment.verification_status} />
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {establishment.phone && `Tel: ${establishment.phone}`}
              </p>
              <form action={updateVerificationStatus} className="flex items-center gap-2">
                <input type="hidden" name="id" value={establishment.id} />
                <select
                  key={establishment.verification_status}
                  name="status"
                  defaultValue={establishment.verification_status}
                  className="h-9 rounded-sm border border-input bg-card px-2 text-sm"
                >
                  {Object.entries(VERIFICATION_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <Button type="submit" size="sm">
                  Actualizar
                </Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
