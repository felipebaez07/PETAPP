import { notFound } from 'next/navigation';
import { MapPin, Phone, MessageCircle } from 'lucide-react';
import { getEstablishmentBySlug } from '@/lib/data';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { VerifiedBadge } from '@/components/directorio/verified-badge';
import { OpenStatus } from '@/components/directorio/open-status';
import { HoursTable } from '@/components/directorio/hours-table';
import { ServiceRequestForm } from '@/components/directorio/service-request-form';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Pet } from '@petapp/shared';
import {
  CATEGORY_LABELS,
  buildWhatsAppLink,
  buildGoogleMapsLink,
  formatPhoneForDisplay,
} from '@petapp/shared';

export default async function EstablishmentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const establishment = await getEstablishmentBySlug(slug);
  if (!establishment) notFound();
  const viewer = await getCurrentUser();

  let pets: Pet[] = [];
  if (viewer?.profile.role === 'propietario') {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.from('pets').select('*').eq('owner_id', viewer.profile.id).order('name');
    pets = (data ?? []) as Pet[];
  }

  const whatsappLink = establishment.whatsapp_number
    ? buildWhatsAppLink({
        whatsappNumber: establishment.whatsapp_number,
        establishmentName: establishment.name,
      })
    : null;
  const mapsLink = buildGoogleMapsLink(establishment);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="secondary">{CATEGORY_LABELS[establishment.category]}</Badge>
            <VerifiedBadge status={establishment.verification_status} />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">{establishment.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4" />
              {establishment.address ?? establishment.city}
            </span>
            <OpenStatus hours={establishment.hours} is24h={establishment.is_24_7} />
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <a href={mapsLink} target="_blank" rel="noopener noreferrer">
              <MapPin /> Ver en Google Maps
            </a>
          </Button>
          {establishment.phone && (
            <Button asChild variant="outline">
              <a href={`tel:${establishment.phone}`}>
                <Phone /> Llamar
              </a>
            </Button>
          )}
          {whatsappLink && (
            <Button asChild variant="secondary">
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle /> Escribir por WhatsApp
              </a>
            </Button>
          )}
        </div>
      </div>

      {establishment.description && (
        <p className="mb-8 max-w-2xl text-foreground/90">{establishment.description}</p>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Horarios</CardTitle>
          </CardHeader>
          <CardContent>
            <HoursTable hours={establishment.hours} is24h={establishment.is_24_7} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Servicios</CardTitle>
          </CardHeader>
          <CardContent>
            {establishment.services.length === 0 ? (
              <p className="text-sm text-muted-foreground">Este prestador aún no ha publicado servicios.</p>
            ) : (
              <ul className="divide-y divide-border">
                {establishment.services.map((service) => (
                  <li key={service.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                    <div>
                      <p className="font-medium text-foreground">{service.name}</p>
                      {service.description && <p className="text-muted-foreground">{service.description}</p>}
                    </div>
                    {service.price_reference && (
                      <span className="whitespace-nowrap text-muted-foreground">{service.price_reference}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {viewer?.profile.role === 'propietario' && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Solicitar cita</CardTitle>
          </CardHeader>
          <CardContent>
            <ServiceRequestForm establishmentId={establishment.id} services={establishment.services} pets={pets} />
          </CardContent>
        </Card>
      )}

      {establishment.phone && (
        <p className="mt-6 text-sm text-muted-foreground">Teléfono: {formatPhoneForDisplay(establishment.phone)}</p>
      )}
    </div>
  );
}
