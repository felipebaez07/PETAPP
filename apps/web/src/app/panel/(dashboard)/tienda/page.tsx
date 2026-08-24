import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductForm } from '@/components/panel/product-form';
import { ProductRow } from '@/components/panel/product-row';
import type { Product } from '@petapp/shared';

export default async function TiendaPage() {
  const user = await getCurrentUser();
  if (!user?.establishment) redirect('/panel');

  const supabase = await createSupabaseServerClient();
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('establishment_id', user.establishment.id)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Tienda</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Publica productos para que los propietarios de mascotas los vean en el marketplace y te
          pregunten por WhatsApp. Es un catálogo — todavía no hay carrito ni cobro en línea.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agregar producto</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tus productos ({products?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {!products || products.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no has agregado productos.</p>
          ) : (
            <ul className="divide-y divide-border">
              {(products as Product[]).map((product) => (
                <ProductRow key={product.id} product={product} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
