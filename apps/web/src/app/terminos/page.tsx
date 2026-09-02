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
            {APP_NAME} es un piloto local en {PILOT_CITY} enfocado en seguimiento preventivo veterinario: perfil
            de mascota, calendario de vacunas y controles, documentos básicos, y un directorio de veterinarias
            y profesionales verificados con solicitud de cita directa. Es gratis para el cuidador; los
            prestadores acceden mediante un plan de suscripción (modelo B2B2C).
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">2. Alcance de esta fase</h2>
          <p className="mt-2">Durante el piloto (Fase 1), la plataforma incluye:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Perfil de mascota y calendario preventivo (vacunas, controles, desparasitación) con recordatorios.</li>
            <li>Documentos básicos de la mascota (carné de vacunación, historia clínica) guardados como enlace.</li>
            <li>Directorio verificado de veterinarias y profesionales, con filtros de horario, servicio y atención 24/7.</li>
            <li>Solicitudes de cita, coordinadas manualmente por WhatsApp con cada prestador.</li>
            <li>Plan de suscripción del prestador (básico/pro), con activación manual por el equipo del piloto.</li>
          </ul>
          <p className="mt-3">Explícitamente <strong>no</strong> incluye en esta fase:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Marketplace de productos, venta de medicamentos, foro o publicaciones de adopción.</li>
            <li>Consultas u orientación con inteligencia artificial.</li>
            <li>Pagos en línea ni cobro automatizado del plan del prestador.</li>
            <li>Subida real de archivos para documentos — por ahora se guardan como enlaces.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">3. Rol de {APP_NAME}</h2>
          <p className="mt-2">
            {APP_NAME} actúa como intermediario tecnológico entre cuidadores y prestadores. No presta
            directamente servicios veterinarios y no participa en la coordinación final de la cita, la cual
            ocurre entre el cuidador y el prestador por fuera de la plataforma (WhatsApp u otro canal
            directo). La verificación de un prestador indica que su información y existencia fueron
            confirmadas por el equipo del piloto, no una garantía sobre la calidad del servicio prestado.
            {APP_NAME} tampoco sustituye el criterio profesional de un médico veterinario: el calendario
            preventivo es una herramienta de recordatorio, no una indicación médica.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">4. Obligaciones del cuidador</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Proporcionar información veraz en tu perfil, el de tus mascotas y en cualquier formulario.</li>
            <li>Usar la plataforma únicamente para los fines descritos en estos términos.</li>
            <li>Confirmar con el prestador, y no solo con el calendario preventivo, cualquier decisión médica relevante.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">5. Obligaciones del prestador</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Mantener actualizada su información pública (horarios, servicios, contacto).</li>
            <li>Atender con razonable diligencia las solicitudes de cita recibidas a través de la plataforma.</li>
            <li>No solicitar ni intentar acceder a los datos de salud de una mascota fuera de lo que el cuidador comparta directamente al coordinar la cita.</li>
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
