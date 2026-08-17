import { getEstablishments } from '@/lib/data';
import { FilterBar } from '@/components/directorio/filter-bar';
import { EstablishmentCard } from '@/components/directorio/establishment-card';
import { APP_NAME, PILOT_CITY, type EstablishmentCategory } from '@petapp/shared';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; abierto24h?: string; q?: string }>;
}) {
  const params = await searchParams;
  const establishments = await getEstablishments({
    category: params.categoria as EstablishmentCategory | undefined,
    onlyOpen24h: params.abierto24h === '1',
    search: params.q,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8 max-w-2xl">
        <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
          Encuentra atención veterinaria confiable en {PILOT_CITY}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {APP_NAME} centraliza veterinarias, comercios, profesionales y fundaciones verificadas de {PILOT_CITY}, con
          horarios reales y reserva directa por WhatsApp.
        </p>
      </div>

      <FilterBar />

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {establishments.length} {establishments.length === 1 ? 'resultado' : 'resultados'}
        </p>
      </div>

      {establishments.length === 0 ? (
        <div className="mt-8 rounded-md border border-dashed border-border p-10 text-center">
          <p className="font-heading text-lg font-semibold text-foreground">Sin resultados</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ajusta los filtros o intenta con otro término de búsqueda.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {establishments.map((establishment) => (
            <EstablishmentCard key={establishment.id} establishment={establishment} />
          ))}
        </div>
      )}
    </div>
  );
}
