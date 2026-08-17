import { redirect } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { Service } from '@petapp/shared';
import { addService, deleteService } from './actions';

export default async function ServiciosPage() {
  const user = await getCurrentUser();
  if (!user?.establishment) redirect('/panel');

  const supabase = await createSupabaseServerClient();
  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('establishment_id', user.establishment.id)
    .order('created_at');

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">Servicios</h1>

      <Card>
        <CardHeader>
          <CardTitle>Agregar servicio</CardTitle>
          <CardDescription>Se muestran en tu ficha del directorio, en el orden en que los agregues.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={addService} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre del servicio</Label>
              <Input id="name" name="name" placeholder="Ej. Consulta general" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Input id="description" name="description" placeholder="Breve detalle" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price_reference">Precio de referencia (opcional)</Label>
              <Input id="price_reference" name="price_reference" placeholder="desde $50.000" />
            </div>
            <Button type="submit">Agregar servicio</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tus servicios ({services?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {!services || services.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no has agregado servicios.</p>
          ) : (
            <ul className="divide-y divide-border">
              {(services as Service[]).map((service) => (
                <li key={service.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium text-foreground">{service.name}</p>
                    {service.description && <p className="text-sm text-muted-foreground">{service.description}</p>}
                    {service.price_reference && (
                      <p className="text-sm text-muted-foreground">{service.price_reference}</p>
                    )}
                  </div>
                  <form action={deleteService}>
                    <input type="hidden" name="id" value={service.id} />
                    <Button type="submit" variant="ghost" size="icon" aria-label={`Eliminar ${service.name}`}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
