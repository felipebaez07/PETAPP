import { AlertTriangle } from 'lucide-react';
import { APP_NAME, PILOT_CITY } from '@petapp/shared';

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-start gap-3 rounded-md border border-accent/30 bg-accent/5 p-4">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-accent" />
        <p className="text-sm text-foreground">
          <strong>Borrador para revisión.</strong> Este texto es un primer borrador preparado para el piloto,
          basado en la Ley 1581 de 2012 (Habeas Data). No ha sido revisado por un abogado ni por el equipo
          legal del proyecto, y los datos marcados entre corchetes deben completarse antes de publicarlo
          como vinculante.
        </p>
      </div>

      <h1 className="font-heading text-3xl font-bold text-foreground">Política de tratamiento de datos personales</h1>
      <p className="mt-2 text-sm text-muted-foreground">Última actualización: [fecha] — Versión piloto, Fase 1</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground/90">
        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">1. Responsable del tratamiento</h2>
          <p className="mt-2">
            [Razón social / nombre legal pendiente de definir], operando la plataforma {APP_NAME} (nombre
            provisional) como piloto local en {PILOT_CITY}, es responsable del tratamiento de los datos
            personales recolectados a través de la aplicación web y móvil, de conformidad con la Ley 1581
            de 2012, el Decreto 1377 de 2013 y demás normas que las modifiquen o complementen.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">2. Datos que recolectamos</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Datos de contacto: nombre completo, teléfono, correo electrónico.</li>
            <li>Datos de establecimientos aliados: nombre del negocio, dirección, horarios, servicios, WhatsApp.</li>
            <li>Datos de mascotas: nombre, especie, raza, sexo, fecha de nacimiento, estado de esterilización/vacunación.</li>
            <li>
              Contenido de formularios: solicitudes de reserva, mensajes de interés de adopción y
              solicitudes de alianza (&quot;Únete al piloto&quot;).
            </li>
            <li>Datos de autenticación (correo y contraseña cifrada) para quienes crean una cuenta.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">3. Finalidad del tratamiento</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Operar el directorio verificado y facilitar el contacto entre usuarios y establecimientos.</li>
            <li>Verificar la identidad y legitimidad de los establecimientos aliados.</li>
            <li>Gestionar perfiles de mascotas y publicaciones de adopción.</li>
            <li>Registrar solicitudes de reserva para medir volumen y calidad del servicio (Fase 1: la coordinación real ocurre por WhatsApp, no dentro de la plataforma).</li>
            <li>Contactar a quienes solicitan vincularse como aliados o adoptar un animal.</li>
            <li>Medir indicadores del piloto (sección 9 del Plan de Desarrollo del Proyecto) de forma agregada.</li>
          </ul>
          <p className="mt-2">
            En esta fase <strong>no</strong> se realizan pagos en línea ni se comparten datos con
            marketplaces de terceros — esas funciones están fuera de alcance del piloto (ver Términos de
            uso).
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">4. Derechos del titular</h2>
          <p className="mt-2">Como titular de los datos, tienes derecho a:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Conocer, actualizar y rectificar tus datos personales.</li>
            <li>Solicitar prueba de la autorización otorgada.</li>
            <li>Ser informado sobre el uso que se ha dado a tus datos.</li>
            <li>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC) por infracciones a la ley.</li>
            <li>Revocar la autorización y/o solicitar la supresión de tus datos, cuando no exista un deber legal o contractual de conservarlos.</li>
            <li>Acceder de forma gratuita a tus datos personales.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">5. Cómo ejercer tus derechos</h2>
          <p className="mt-2">
            Puedes ejercer tus derechos escribiendo a <span className="font-medium">[correo de contacto pendiente]</span>{' '}
            indicando tu nombre completo, el derecho que deseas ejercer y una descripción de tu solicitud.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">6. Almacenamiento y seguridad</h2>
          <p className="mt-2">
            Los datos se almacenan en infraestructura de base de datos con controles de acceso por rol y
            cifrado en tránsito. Se conservan durante la vigencia del piloto y el tiempo adicional que
            exija la ley o que sea razonable para fines de soporte y auditoría.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">7. Cambios a esta política</h2>
          <p className="mt-2">
            Esta política podrá actualizarse a medida que el piloto avance hacia las siguientes fases del
            modelo de negocio. Notificaremos cambios sustanciales dentro de la misma plataforma.
          </p>
        </section>
      </div>
    </div>
  );
}
