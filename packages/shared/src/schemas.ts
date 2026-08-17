import { z } from 'zod';

export const petSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(60),
  species: z.enum(['perro', 'gato', 'otro']),
  breed: z.string().max(80).optional().or(z.literal('')),
  sex: z.enum(['macho', 'hembra', 'desconocido']),
  birth_date: z.string().optional().or(z.literal('')),
  sterilized: z.boolean().default(false),
  vaccinated: z.boolean().default(false),
  notes: z.string().max(500).optional().or(z.literal('')),
});
export type PetFormValues = z.infer<typeof petSchema>;

export const adoptionInterestSchema = z.object({
  full_name: z.string().min(2, 'Ingresa tu nombre completo').max(100),
  phone: z
    .string()
    .min(7, 'Ingresa un número de contacto válido')
    .max(20),
  email: z.string().email('Correo inválido').optional().or(z.literal('')),
  message: z.string().max(500).optional().or(z.literal('')),
});
export type AdoptionInterestFormValues = z.infer<typeof adoptionInterestSchema>;

export const reservationRequestSchema = z.object({
  establishment_id: z.string().uuid(),
  service_id: z.string().uuid().optional(),
  pet_id: z.string().uuid().optional(),
  preferred_datetime: z.string().optional(),
  notes: z.string().max(500).optional().or(z.literal('')),
});
export type ReservationRequestValues = z.infer<typeof reservationRequestSchema>;

// Formulario público "Únete al piloto" (solicitud de alianza, sección 6.1/12 del PDD)
export const partnerApplicationSchema = z.object({
  business_name: z.string().min(2).max(120),
  category: z.enum(['veterinaria', 'comercio', 'profesional', 'fundacion']),
  contact_name: z.string().min(2).max(100),
  phone: z.string().min(7).max(20),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().max(200).optional().or(z.literal('')),
  message: z.string().max(500).optional().or(z.literal('')),
});
export type PartnerApplicationValues = z.infer<typeof partnerApplicationSchema>;

export const adoptionPostSchema = z.object({
  animal_name: z.string().min(1).max(60),
  species: z.enum(['perro', 'gato', 'otro']),
  estimated_age: z.string().max(60).optional().or(z.literal('')),
  sex: z.enum(['macho', 'hembra', 'desconocido']),
  sterilized: z.boolean().default(false),
  vaccinated: z.boolean().default(false),
  health_notes: z.string().max(500).optional().or(z.literal('')),
  personality_notes: z.string().max(500).optional().or(z.literal('')),
  location_text: z.string().max(120).optional().or(z.literal('')),
});
export type AdoptionPostFormValues = z.infer<typeof adoptionPostSchema>;
