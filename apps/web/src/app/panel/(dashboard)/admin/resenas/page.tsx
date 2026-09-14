import { redirect } from 'next/navigation';
import { TriangleAlert } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { EstablishmentReview } from '@petapp/shared';
import { deleteReportedReview, dismissReviewReports } from './actions';

interface ReportedReview extends EstablishmentReview {
  report_count: number;
  establishment_name: string;
}

export default async function AdminResenasPage() {
  const user = await getCurrentUser();
  if (!user || user.profile.role !== 'admin') redirect('/panel');

  const supabase = await createSupabaseServerClient();

  // PostgREST no arma un GROUP BY desde el cliente — con la escala del piloto, es más simple
  // traer todos los reportes y contar del lado de la app que armar una vista/RPC solo para esto.
  const { data: reports } = await supabase.from('establishment_review_reports').select('review_id');
  const counts = new Map<string, number>();
  for (const r of reports ?? []) counts.set(r.review_id, (counts.get(r.review_id) ?? 0) + 1);
  const reviewIds = [...counts.keys()];

  let reviews: ReportedReview[] = [];
  if (reviewIds.length > 0) {
    const { data } = await supabase
      .from('establishment_reviews')
      .select('*, establishment:establishments(name)')
      .in('id', reviewIds);
    reviews = ((data ?? []) as unknown as (EstablishmentReview & { establishment: { name: string } | null })[])
      .map((r) => ({ ...r, report_count: counts.get(r.id) ?? 0, establishment_name: r.establishment?.name ?? '—' }))
      .sort((a, b) => b.report_count - a.report_count);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-foreground">Reseñas reportadas</h1>
        <Badge variant="outline">{reviews.length} reportadas</Badge>
      </div>

      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ninguna reseña tiene reportes pendientes de revisar.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
                <div>
                  <CardTitle className="text-base">{review.establishment_name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {review.reviewer_name || 'Cuidador/a'} ·{' '}
                    {'★'.repeat(review.rating)}
                    {'☆'.repeat(5 - review.rating)}
                  </p>
                </div>
                <Badge variant="accent">
                  <TriangleAlert className="size-3.5" /> {review.report_count}{' '}
                  {review.report_count === 1 ? 'reporte' : 'reportes'}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                {review.comment && <p className="text-sm text-foreground/90">{review.comment}</p>}
                <div className="flex gap-2">
                  <form action={deleteReportedReview.bind(null, review.id)}>
                    <Button type="submit" variant="destructive" size="sm">
                      Borrar reseña
                    </Button>
                  </form>
                  <form action={dismissReviewReports.bind(null, review.id)}>
                    <Button type="submit" variant="outline" size="sm">
                      Descartar reportes (dejar la reseña)
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
