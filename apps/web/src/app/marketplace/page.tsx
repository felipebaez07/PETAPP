import { getProducts } from '@/lib/data';
import { ProductFilterBar } from '@/components/marketplace/product-filter-bar';
import { ProductCard } from '@/components/marketplace/product-card';
import { APP_NAME, PILOT_CITY, type ProductCategory } from '@petapp/shared';

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; q?: string }>;
}) {
  const params = await searchParams;
  const products = await getProducts({
    category: params.categoria as ProductCategory | undefined,
    search: params.q,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8 max-w-2xl">
        <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">Marketplace</h1>
        <p className="mt-3 text-muted-foreground">
          Productos de las tiendas aliadas de {APP_NAME} en {PILOT_CITY}. Es un catálogo — para comprar,
          escribe directo al aliado por WhatsApp; todavía no hay carrito ni pago en línea.
        </p>
      </div>

      <ProductFilterBar />

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {products.length} {products.length === 1 ? 'producto' : 'productos'}
        </p>
      </div>

      {products.length === 0 ? (
        <div className="mt-8 rounded-md border border-dashed border-border p-10 text-center">
          <p className="font-heading text-lg font-semibold text-foreground">Sin resultados</p>
          <p className="mt-1 text-sm text-muted-foreground">Ajusta los filtros o intenta con otro término de búsqueda.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
