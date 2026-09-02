import Link from 'next/link';
import { APP_NAME, PILOT_CITY } from '@petapp/shared';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="font-heading font-semibold text-foreground">{APP_NAME}</p>
          <p className="text-sm text-muted-foreground">
            Piloto local en {PILOT_CITY} · Fase 1. Seguimiento preventivo y directorio veterinario verificado.
          </p>
        </div>
        <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
          <Link href="/directorio" className="hover:text-foreground">
            Directorio
          </Link>
          <Link href="/unete" className="hover:text-foreground">
            Soy prestador, únete al piloto
          </Link>
          <Link href="/politica-privacidad" className="hover:text-foreground">
            Política de datos
          </Link>
          <Link href="/terminos" className="hover:text-foreground">
            Términos de uso
          </Link>
        </div>
      </div>
    </footer>
  );
}
