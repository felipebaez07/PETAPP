import Link from 'next/link';
import {
  HeartPulse,
  UserPlus,
  CalendarCheck2,
  Search,
  Send,
  ShieldCheck,
  FileStack,
  MapPinned,
  Stethoscope,
  Users,
  BadgeCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FadeInSection } from '@/components/motion/fade-in-section';
import { APP_NAME, PILOT_CITY } from '@petapp/shared';

const STEPS = [
  {
    icon: HeartPulse,
    title: 'Una necesidad concreta',
    description: 'Tu mascota necesita una vacuna, un control o una desparasitación — y quieres tenerlo bajo control.',
  },
  {
    icon: UserPlus,
    title: 'Creas su perfil',
    description: 'Registras a tu mascota una sola vez: especie, edad, esterilización, esquema de vacunación.',
  },
  {
    icon: CalendarCheck2,
    title: 'Haces seguimiento',
    description: 'Un calendario preventivo con recordatorios te avisa qué viene y qué ya se venció, sin depender de la memoria.',
  },
  {
    icon: Search,
    title: 'Buscas un prestador',
    description: `Consultas el directorio de veterinarias y profesionales verificados en ${PILOT_CITY}, con horarios reales.`,
  },
  {
    icon: Send,
    title: 'Solicitas la cita',
    description: 'Envías la solicitud directo desde la ficha del prestador — sin cadenas de mensajes perdidas.',
  },
];

const CAREGIVER_BENEFITS = [
  { icon: HeartPulse, text: 'Calendario preventivo con vacunas, controles y desparasitación por mascota.' },
  { icon: FileStack, text: 'Carné de vacunación e historia clínica guardados, sin buscar en el chat de WhatsApp.' },
  { icon: ShieldCheck, text: 'Directorio de prestadores verificados — nadie inventado, nadie sin revisar.' },
];

const PROVIDER_BENEFITS = [
  { icon: BadgeCheck, text: 'Perfil verificado en el directorio, con horarios y servicios reales.' },
  { icon: Send, text: 'Solicitudes de cita directas, sin depender de que te encuentren por casualidad.' },
  { icon: Users, text: 'Onboarding gratuito durante el piloto — plan de pago solo cuando decidas escalar.' },
];

const PILOT_STATS = [
  { value: '91.835', label: `Animales de compañía estimados en ${PILOT_CITY}` },
  { value: '66,3%', label: 'Cobertura estimada de atención preventiva' },
  { value: '11 / 32', label: 'Puesto de Ibagué entre capitales del país' },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero — único lugar del sitio con gradiente decorativo, por regla del design system */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-secondary/80 text-primary-foreground">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
            <MapPinned className="size-3.5" /> Piloto en {PILOT_CITY}
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl font-heading text-4xl font-bold sm:text-5xl">
            El seguimiento preventivo de tu mascota, en un solo lugar
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-primary-foreground/90 sm:text-lg">
            Perfil de mascota, calendario de vacunas y controles, documentos guardados y un directorio de
            veterinarias y profesionales verificados — para que nada se te pase y encuentres atención confiable
            cuando la necesitas.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" variant="secondary">
              <Link href="/panel/registro">Soy cuidador</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white/10"
            >
              <Link href="/unete">Soy prestador veterinario, únete al piloto</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Problema */}
      <FadeInSection className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
          Cuidar preventivamente a una mascota es más difícil de lo que debería
        </h2>
        <p className="mt-4 text-muted-foreground">
          Las fechas de vacunación se olvidan entre chats de WhatsApp, papeles físicos y recordatorios sueltos.
          Encontrar un prestador confiable toma vueltas — recomendaciones sin verificar, negocios que ya cerraron,
          horarios que no eran ciertos. {APP_NAME} nace para cerrar esa brecha en {PILOT_CITY}, donde la cobertura
          de atención preventiva sigue por debajo de lo deseable (ver cifras del piloto más abajo).
        </p>
      </FadeInSection>

      {/* Cómo funciona */}
      <FadeInSection className="bg-background-alt py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="text-center font-heading text-2xl font-bold text-foreground sm:text-3xl">Cómo funciona</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map((step, index) => (
              <Card key={step.title} className="relative">
                <CardContent className="flex flex-col gap-3 p-5">
                  <span className="font-heading text-xs font-semibold text-secondary">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <step.icon className="size-6 text-primary" aria-hidden />
                  <p className="font-heading text-sm font-semibold text-foreground">{step.title}</p>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </FadeInSection>

      {/* Para cuidadores */}
      <FadeInSection className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-secondary">Para cuidadores</span>
            <h2 className="mt-2 font-heading text-2xl font-bold text-foreground sm:text-3xl">
              Todo el historial preventivo de tu mascota, siempre a mano
            </h2>
            <p className="mt-3 text-muted-foreground">
              Gratis para siempre. Sin costo oculto, sin límite de mascotas durante el piloto.
            </p>
            <Button asChild className="mt-6">
              <Link href="/panel/registro">Crear mi cuenta de cuidador</Link>
            </Button>
          </div>
          <div className="space-y-4">
            {CAREGIVER_BENEFITS.map((benefit) => (
              <Card key={benefit.text}>
                <CardContent className="flex items-start gap-3 p-4">
                  <benefit.icon className="mt-0.5 size-5 shrink-0 text-secondary" aria-hidden />
                  <p className="text-sm text-foreground/90">{benefit.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </FadeInSection>

      {/* Para prestadores */}
      <FadeInSection className="bg-background-alt py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="order-2 space-y-4 lg:order-1">
              {PROVIDER_BENEFITS.map((benefit) => (
                <Card key={benefit.text}>
                  <CardContent className="flex items-start gap-3 p-4">
                    <benefit.icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                    <p className="text-sm text-foreground/90">{benefit.text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="order-1 lg:order-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-primary">Para prestadores</span>
              <h2 className="mt-2 font-heading text-2xl font-bold text-foreground sm:text-3xl">
                Visibilidad verificada y solicitudes directas de cuidadores
              </h2>
              <p className="mt-3 text-muted-foreground">
                Modelo B2B2C: gratis para el cuidador, plan de suscripción para tu negocio cuando decidas
                escalar — sin pagos obligatorios durante el piloto.
              </p>
              <Button asChild variant="secondary" className="mt-6">
                <Link href="/unete">Únete al piloto</Link>
              </Button>
            </div>
          </div>
        </div>
      </FadeInSection>

      {/* Piloto en Ibagué */}
      <FadeInSection className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-secondary">
            <Stethoscope className="size-3.5" /> El piloto
          </span>
          <h2 className="mt-2 font-heading text-2xl font-bold text-foreground sm:text-3xl">
            Empezamos por {PILOT_CITY}, con datos reales
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            {PILOT_CITY} tiene una población animal significativa y una brecha de cobertura preventiva medible —
            el punto de partida ideal para validar el modelo antes de escalar a otras ciudades.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {PILOT_STATS.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-6 text-center">
                <p className="font-heading text-3xl font-bold text-primary">{stat.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </FadeInSection>

      {/* CTA final */}
      <FadeInSection className="border-t border-border bg-card py-16">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 text-center sm:px-6">
          <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
            ¿Listo/a para empezar?
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/panel/registro">Soy cuidador</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/unete">Soy prestador veterinario, únete al piloto</Link>
            </Button>
          </div>
        </div>
      </FadeInSection>
    </div>
  );
}
