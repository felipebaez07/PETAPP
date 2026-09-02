import { getEstablishments } from '@/lib/data';
import { FilterBar } from '@/components/directorio/filter-bar';
import { EstablishmentCard } from '@/components/directorio/establishment-card';
import { RevealItem } from '@/components/motion/reveal-item';
import { CalendarSearch } from 'lucide-react';
import { APP_NAME, PILOT_CITY, type ProviderCategory } from '@petapp/shared';

export default async function DirectorioPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; abierto24h?: string; q?: string }>;
}) {
  const params = await searchParams;
  const establishments = await getEstablishments({
    category: params.categoria as ProviderCategory | undefined,
    onlyOpen24h: params.abierto24h === '1',
    search: params.q,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8 max-w-2xl">
        <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
          Prestadores veterinarios verificados en {PILOT_CITY}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {APP_NAME} confirma que cada veterinaria o profesional de esta lista existe y atiende donde dice —
          revisa horarios reales y solicita una cita directamente.
        </p>
      </div>

      <FilterBar />

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {establishments.length} {establishments.length === 1 ? 'resultado' : 'resultados'}
        </p>
      </div>

      {establishments.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
          <CalendarSearch className="size-10 text-muted-foreground" aria-hidden />
          <p className="font-heading text-lg font-semibold text-foreground">Sin resultados por ahora</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Ajusta los filtros o intenta con otro término de búsqueda. Seguimos vinculando prestadores del piloto
            cada semana.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {establishments.map((establishment, index) => (
            <RevealItem key={establishment.id} index={index}>
              <EstablishmentCard establishment={establishment} />
            </RevealItem>
          ))}
        </div>
      )}
    </div>
  );
}
