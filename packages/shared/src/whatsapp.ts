/**
 * En Fase 1 las reservas se gestionan manualmente por mensajería (PDD 3.1 / 6.3).
 * En vez de un motor de reservas, generamos un enlace de WhatsApp con un
 * mensaje prellenado para que el usuario contacte directamente al aliado.
 */
export function buildWhatsAppLink(params: {
  whatsappNumber: string; // formato internacional sin '+', ej. '573001234501'
  establishmentName: string;
  serviceName?: string;
  petName?: string;
}): string {
  const { whatsappNumber, establishmentName, serviceName, petName } = params;
  const lines = [`Hola, vengo de PetApp y quisiera reservar una cita en ${establishmentName}.`];
  if (serviceName) lines.push(`Servicio de interés: ${serviceName}.`);
  if (petName) lines.push(`Mascota: ${petName}.`);
  const text = encodeURIComponent(lines.join(' '));
  const digits = whatsappNumber.replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${text}`;
}

export function buildProductInquiryWhatsAppLink(params: {
  whatsappNumber: string;
  establishmentName: string;
  productName: string;
}): string {
  const { whatsappNumber, establishmentName, productName } = params;
  const text = encodeURIComponent(
    `Hola, vengo de PetApp y quisiera preguntar por "${productName}" en ${establishmentName}.`
  );
  const digits = whatsappNumber.replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${text}`;
}

export function buildAdoptionInterestWhatsAppLink(params: {
  whatsappNumber: string;
  animalName: string;
  adopterName: string;
}): string {
  const { whatsappNumber, animalName, adopterName } = params;
  const text = encodeURIComponent(
    `Hola, soy ${adopterName}. Vi a ${animalName} en PetApp y estoy interesado/a en el proceso de adopción.`
  );
  const digits = whatsappNumber.replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${text}`;
}
