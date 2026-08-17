import { AlertTriangle } from 'lucide-react';
import { APP_NAME, PILOT_CITY } from '@petapp/shared';

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-start gap-3 rounded-md border border-accent/30 bg-accent/5 p-4">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-accent" />
        <p className="text-sm text-foreground">
          <strong>Borrador para revisión.</strong> Primer borrador de términos de uso del piloto (Fase 1).
          No reemplaza asesoría legal. Los datos entre corchetes deben completarse antes de publicarlo
          como vinculante.
        </p>
      </div>

      <h1 className="font-heading text-3xl font-bold text-foreground">Términos de uso</h1>
      <p className="mt-2 text-sm text-muted-foreground">Versión piloto, Fase 1 — {PILOT_CITY}</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground/90">
        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">1. Qué es {APP_NAME}</h2>
          <p className="mt-2">
            {APP_NAME} (nombre provisional) es un piloto local en {PILOT_CITY} que conecta a propietarios de
            mascotas con veterinarias, comercios, profesionales y fundaciones aliadas mediante un
            directorio verificado, perfiles de mascotas, solicitudes de reserva y publicaciones de
            adopción.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">2. Alcance de esta fase</h2>
          <p className="mt-2">Durante el piloto (Fase 1), la plataforma incluye:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Directorio verificado con filtros de horario, distancia, servicio y atención 24/7.</li>
            <li>Perfiles de mascotas del usuario propietario.</li>
            <li>Solicitudes de reserva, coordinadas manualmente por WhatsApp con cada aliado.</li>
            <li>Publicaciones de adopción y formulario de interesado/a.</li>
          </ul>
          <p className="mt-3">Explícitamente <strong>no</strong> incluye en esta fase:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Marketplace de productos ni venta de medicamentos.</li>
            <li>Consultas u orientación con inteligencia artificial.</li>
            <li>Pagos en línea, comisiones automatizadas o domicilios.</li>
            <li>Compraventa de animales — solo adopción responsable.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">3. Rol de {APP_NAME}</h2>
          <p className="mt-2">
            {APP_NAME} actúa como intermediario tecnológico entre usuarios y aliados. No presta directamente
            servicios veterinarios, no vende productos y no participa en la coordinación final de citas o
            adopciones, la cual ocurre entre el usuario y el aliado por fuera de la plataforma (WhatsApp u
            otro canal directo). La verificación de un aliado indica que su información y existencia fueron
            confirmadas por el equipo del piloto, no una garantía sobre la calidad del servicio prestado.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">4. Obligaciones del usuario</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Proporcionar información veraz en tu perfil, el de tus mascotas y en cualquier formulario.</li>
            <li>Usar la plataforma únicamente para los fines descritos en estos términos.</li>
            <li>En caso de adopción, actuar de buena fe frente a la fundación o rescatista aliado.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">5. Obligaciones del aliado</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Mantener actualizada su información pública (horarios, servicios, contacto).</li>
            <li>Atender con razonable diligencia las solicitudes recibidas a través de la plataforma.</li>
            <li>En el caso de fundaciones, publicar información veraz sobre el estado de salud y personalidad de los animales en adopción.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">6. Emergencias</h2>
          <p className="mt-2">
            {APP_NAME} no sustituye la atención veterinaria profesional. Ante una emergencia, contacta
            directamente al centro de atención 24/7 más cercano o a la línea de atención local que
            corresponda.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">7. Tratamiento de datos personales</h2>
          <p className="mt-2">
            El uso de la plataforma implica la aceptación de nuestra{' '}
            <a href="/politica-privacidad" className="font-medium text-primary hover:underline">
              Política de tratamiento de datos personales
            </a>
            , conforme a la Ley 1581 de 2012.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">8. Contacto</h2>
          <p className="mt-2">
            Para preguntas sobre estos términos, escribe a <span className="font-medium">[correo de contacto pendiente]</span>.
          </p>
        </section>
      </div>
    </div>
  );
}
