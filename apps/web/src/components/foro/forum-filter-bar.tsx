'use client';

import { useCallback, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { FORUM_CATEGORY_LABELS, type ForumPostCategory } from '@petapp/shared';

const CATEGORIES = Object.keys(FORUM_CATEGORY_LABELS) as ForumPostCategory[];

export function ForumFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentCategory = searchParams.get('categoria') ?? '';

  const setCategory = useCallback(
    (value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null) params.delete('categoria');
      else params.set('categoria', value);
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => setCategory(null)}
        className={cn(
          'rounded-sm px-3 py-1.5 text-sm font-medium transition-colors duration-200 cursor-pointer',
          currentCategory === '' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-border'
        )}
      >
        Todas
      </button>
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => setCategory(currentCategory === cat ? null : cat)}
          className={cn(
            'rounded-sm px-3 py-1.5 text-sm font-medium transition-colors duration-200 cursor-pointer',
            currentCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-border'
          )}
        >
          {FORUM_CATEGORY_LABELS[cat]}
        </button>
      ))}
    </div>
  );
}
