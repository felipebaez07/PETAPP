import Link from 'next/link';
import { Cake, PawPrint, ShieldCheck, Syringe } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RemoteImage } from '@/components/ui/remote-image';
import { SPECIES_LABELS, type Pet } from '@petapp/shared';

export function PetCard({ pet, pendingCount }: { pet: Pet; pendingCount: number }) {
  return (
    <Link href={`/cuidador/mascotas/${pet.id}`} className="block group">
      <Card className="h-full group-hover:shadow-md group-hover:-translate-y-0.5">
        <CardContent className="flex flex-col gap-3 p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <RemoteImage
                src={pet.photo_url}
                size={48}
                icon={<PawPrint className="size-6 text-secondary" aria-hidden />}
                alt={pet.name}
              />
              <div>
                <h3 className="font-heading text-base font-semibold text-foreground">{pet.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {SPECIES_LABELS[pet.species]}
                  {pet.breed ? ` · ${pet.breed}` : ''}
                </p>
              </div>
            </div>
            {pendingCount > 0 && (
              <Badge variant="accent">
                {pendingCount} {pendingCount === 1 ? 'pendiente' : 'pendientes'}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {pet.birth_date && (
              <span className="inline-flex items-center gap-1">
                {/* "T00:00:00" sin "Z": si se parsea "2026-09-01" a secas, JS lo toma como
                    medianoche UTC, que en Colombia (UTC-5) muestra el día anterior siempre,
                    no solo en un caso límite de hora — encontrado en revisión de código. */}
                <Cake className="size-3.5" /> {new Date(`${pet.birth_date}T00:00:00`).toLocaleDateString('es-CO')}
              </span>
            )}
            {pet.vaccinated && (
              <span className="inline-flex items-center gap-1 text-success">
                <Syringe className="size-3.5" /> Vacunas al día
              </span>
            )}
            {pet.sterilized && (
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="size-3.5" /> Esterilizado/a
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
