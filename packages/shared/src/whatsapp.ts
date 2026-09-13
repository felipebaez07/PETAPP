import { APP_NAME } from './constants';

/**
 * En el piloto, la confirmación final de una solicitud de cita puede reforzarse
 * por mensajería directa. En vez de un motor de reservas con pago en línea,
 * generamos un enlace de WhatsApp con un mensaje prellenado para que el
 * cuidador pueda contactar directamente al prestador si lo necesita.
 */
export function buildWhatsAppLink(params: {
  whatsappNumber: string; // formato internacional sin '+', ej. '573001234501'
  establishmentName: string;
  serviceName?: string;
  petName?: string;
}): string {
  const { whatsappNumber, establishmentName, serviceName, petName } = params;
  const lines = [`Hola, vengo de ${APP_NAME} y quisiera solicitar una cita en ${establishmentName}.`];
  if (serviceName) lines.push(`Servicio de interés: ${serviceName}.`);
  if (petName) lines.push(`Mascota: ${petName}.`);
  const text = encodeURIComponent(lines.join(' '));
  const digits = whatsappNumber.replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${text}`;
}

/**
 * Enlace de WhatsApp "para compartir" — sin número de destino. WhatsApp abre su propio
 * selector de contacto/chat, así el cuidador elige a quién mandárselo (su veterinaria de
 * confianza, que no siempre es un aliado verificado del directorio con `whatsapp_number`
 * cargado). Se usa para el resumen del chat de pre-diagnóstico (idea 1.2 del banco de ideas):
 * a diferencia de `buildWhatsAppLink`, acá no hace falta un establecimiento ya vinculado.
 */
export function buildWhatsAppShareLink(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
