'use client';

import { useCallback, useState, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { PRODUCT_CATEGORY_LABELS, type ProductCategory } from '@petapp/shared';

const CATEGORIES = Object.keys(PRODUCT_CATEGORY_LABELS) as ProductCategory[];

export function ProductFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentCategory = searchParams.get('categoria') ?? '';
  const search = searchParams.get('q') ?? '';

  // Ver el comentario en components/directorio/filter-bar.tsx: input controlado,
  // resincronizado durante el render (no en un efecto) para que atrás/adelante
  // del navegador actualice el texto visible sin el reflow extra de un efecto.
  const [prevSearch, setPrevSearch] = useState(search);
  const [inputValue, setInputValue] = useState(search);
  if (search !== prevSearch) {
    setPrevSearch(search);
    setInputValue(search);
  }

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '') params.delete(key);
        else params.set(key, value);
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  return (
    <div className="flex flex-col gap-4 rounded-md border border-border bg-card p-4 sm:p-5">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={inputValue}
          placeholder="Buscar producto…"
          className="pl-9"
          onChange={(e) => {
            setInputValue(e.target.value);
            updateParams({ q: e.target.value });
          }}
          aria-label="Buscar en el marketplace"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => updateParams({ categoria: null })}
          className={cn(
            'rounded-sm px-3 py-1.5 text-sm font-medium transition-colors duration-200 cursor-pointer',
            currentCategory === '' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-border'
          )}
        >
          Todos
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => updateParams({ categoria: currentCategory === cat ? null : cat })}
            className={cn(
              'rounded-sm px-3 py-1.5 text-sm font-medium transition-colors duration-200 cursor-pointer',
              currentCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-border'
            )}
          >
            {PRODUCT_CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>
    </div>
  );
}
