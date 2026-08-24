'use client';

import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PRODUCT_CATEGORY_LABELS, type Product } from '@petapp/shared';
import { deleteProduct } from '@/app/panel/(dashboard)/tienda/actions';
import { ProductForm } from './product-form';

export function ProductRow({ product }: { product: Product }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="py-4">
        <ProductForm product={product} onDone={() => setEditing(false)} />
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div>
        <p className="font-medium text-foreground">{product.name}</p>
        <p className="text-xs text-muted-foreground">{PRODUCT_CATEGORY_LABELS[product.category]}</p>
        {product.description && <p className="text-sm text-muted-foreground">{product.description}</p>}
        {product.price_reference && <p className="text-sm text-muted-foreground">{product.price_reference}</p>}
      </div>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Editar ${product.name}`}
          onClick={() => setEditing(true)}
        >
          <Pencil className="size-4" />
        </Button>
        <form action={deleteProduct}>
          <input type="hidden" name="id" value={product.id} />
          <Button type="submit" variant="ghost" size="icon" aria-label={`Eliminar ${product.name}`}>
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </form>
      </div>
    </li>
  );
}
