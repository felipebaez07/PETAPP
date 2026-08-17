import { ShieldCheck, MessageCircleHeart, TrendingUp } from 'lucide-react';
import { PartnerApplicationForm } from '@/components/unete/partner-application-form';
import { Card, CardContent } from '@/components/ui/card';
import { PILOT_CITY } from '@petapp/shared';

const BENEFITS = [
  {
    icon: ShieldCheck,
    title: 'Onboarding gratuito',
    description: 'Perfil verificado sin costo durante todo el piloto — sin letras pequeñas.',
  },
  {
    icon: MessageCircleHeart,
    title: 'Reservas directas',
    description: 'Recibe solicitudes de clientes por WhatsApp, sin cambiar tu forma de trabajar.',
  },
  {
    icon: TrendingUp,
    title: 'Visibilidad real',
    description: 'Aparece en el directorio verificado que están usando propietarios de mascotas en la ciudad.',
  },
];

export default function PartnerApplicationPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <h1 className="font-heading text-3xl font-bold text-foreground">Únete al piloto en {PILOT_CITY}</h1>
          <p className="mt-3 text-muted-foreground">
            Estamos vinculando un primer grupo de veterinarias, comercios, profesionales y fundaciones aliadas. Sin
            costo durante el piloto, con acompañamiento del equipo.
          </p>
          <div className="mt-6 space-y-4">
            {BENEFITS.map((benefit) => (
              <Card key={benefit.title}>
                <CardContent className="flex items-start gap-3 p-4">
                  <benefit.icon className="mt-0.5 size-5 shrink-0 text-secondary" />
                  <div>
                    <p className="font-medium text-foreground">{benefit.title}</p>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card className="lg:col-span-3">
          <CardContent className="p-6">
            <PartnerApplicationForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
