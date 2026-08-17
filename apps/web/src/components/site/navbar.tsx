import Link from 'next/link';
import { PawPrint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { APP_NAME } from '@petapp/shared';

const NAV_LINKS = [
  { href: '/', label: 'Directorio' },
  { href: '/adopciones', label: 'Adopciones' },
  { href: '/unete', label: 'Únete al piloto' },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-heading text-lg font-bold text-primary">
          <PawPrint className="size-6" />
          {APP_NAME}
        </Link>
        <nav className="hidden items-center gap-6 sm:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/panel/login">Ingresar</Link>
          </Button>
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/panel/registro">Registrar mi negocio</Link>
          </Button>
        </div>
      </div>
      <nav className="flex items-center gap-4 overflow-x-auto border-t border-border px-4 py-2 sm:hidden">
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="whitespace-nowrap text-sm font-medium text-muted-foreground">
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
