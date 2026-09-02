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
  const lines = [`Hola, vengo de PETAPP y quisiera solicitar una cita en ${establishmentName}.`];
  if (serviceName) lines.push(`Servicio de interés: ${serviceName}.`);
  if (petName) lines.push(`Mascota: ${petName}.`);
  const text = encodeURIComponent(lines.join(' '));
  const digits = whatsappNumber.replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${text}`;
}
