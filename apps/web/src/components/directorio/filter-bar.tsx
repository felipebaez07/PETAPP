'use client';

import { useCallback, useState, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { CATEGORY_LABELS, type ProviderCategory } from '@petapp/shared';

// El directorio público solo ofrece las categorías del alcance nuevo (spec.md sección 5):
// veterinaria y profesional independiente. Comercio/fundación quedaron fuera del piloto.
const CATEGORIES: ProviderCategory[] = ['veterinaria', 'profesional'];

export function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentCategory = searchParams.get('categoria') ?? '';
  const only24h = searchParams.get('abierto24h') === '1';
  const search = searchParams.get('q') ?? '';

  // Input controlado, no `defaultValue`: sin esto, navegar con atrás/adelante
  // cambia la URL (y los resultados) pero el texto visible en la caja se queda
  // congelado en lo último que se tecleó, porque defaultValue solo se aplica
  // al montar. Se resincroniza durante el render (no en un efecto) cuando
  // `search` cambia por una causa externa — patrón recomendado por React para
  // "ajustar estado cuando cambia un prop" sin el reflow extra de un efecto.
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
    <div className="flex flex-col gap-4 rounded-xl bg-card p-4 shadow-sm sm:p-5">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={inputValue}
          placeholder="Buscar por nombre, servicio o zona…"
          className="pl-9"
          onChange={(e) => {
            setInputValue(e.target.value);
            updateParams({ q: e.target.value });
          }}
          aria-label="Buscar en el directorio"
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
            {CATEGORY_LABELS[cat]}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <Checkbox
            id="filter-24h"
            checked={only24h}
            onCheckedChange={(checked) => updateParams({ abierto24h: checked ? '1' : null })}
          />
          <Label htmlFor="filter-24h" className="cursor-pointer select-none">
            Solo atención 24/7
          </Label>
        </div>
      </div>
    </div>
  );
}
