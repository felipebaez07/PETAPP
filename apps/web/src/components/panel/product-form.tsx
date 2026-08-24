'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { PRODUCT_CATEGORY_LABELS, type Product, type ProductCategory } from '@petapp/shared';
import { addProduct, updateProduct } from '@/app/panel/(dashboard)/tienda/actions';

const CATEGORY_OPTIONS = Object.entries(PRODUCT_CATEGORY_LABELS) as [ProductCategory, string][];

export function ProductForm({ product, onDone }: { product?: Product; onDone?: () => void }) {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('saving');
    setErrorMessage(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = product ? await updateProduct(product.id, formData) : await addProduct(formData);
    if (result.ok) {
      setStatus('idle');
      router.refresh();
      if (product) {
        onDone?.();
      } else {
        form.reset();
      }
    } else {
      setErrorMessage(result.error ?? 'No se pudo guardar.');
      setStatus('error');
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Nombre del producto</Label>
        <Input id="name" name="name" defaultValue={product?.name} placeholder="Ej. Concentrado premium x 15kg" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">Descripción (opcional)</Label>
        <Textarea id="description" name="description" defaultValue={product?.description ?? ''} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="category">Categoría</Label>
          <select
            id="category"
            name="category"
            defaultValue={product?.category ?? 'otro'}
            className="w-full rounded-sm border border-border bg-card px-3 py-2 text-sm text-foreground"
          >
            {CATEGORY_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="price_reference">Precio de referencia (opcional)</Label>
          <Input
            id="price_reference"
            name="price_reference"
            defaultValue={product?.price_reference ?? ''}
            placeholder="desde $30.000"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="image_url">URL de imagen (opcional)</Label>
        <Input id="image_url" name="image_url" type="url" defaultValue={product?.image_url ?? ''} placeholder="https://..." />
      </div>
      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={status === 'saving'}>
          {status === 'saving' ? 'Guardando…' : product ? 'Guardar cambios' : 'Agregar producto'}
        </Button>
        {product && onDone && (
          <Button type="button" variant="outline" onClick={onDone}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
