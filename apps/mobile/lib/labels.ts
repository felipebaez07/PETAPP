import type { PetSex } from '@petapp/shared';

// Etiquetas de UI que no forman parte de `@petapp/shared` porque son
// específicas de cómo las presenta esta app (no del esquema de datos).
export const SEX_LABELS: Record<PetSex, string> = {
  macho: 'Macho',
  hembra: 'Hembra',
  desconocido: 'Sexo desconocido',
};

/** Convierte una fecha de nacimiento (YYYY-MM-DD) en un texto de edad legible. */
export function formatPetAge(birthDate: string | null): string {
  if (!birthDate) return 'Fecha de nacimiento no registrada';

  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return 'Fecha de nacimiento no registrada';

  const now = new Date();
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months -= 1;
  if (months < 0) return 'Fecha de nacimiento no registrada';
  if (months < 1) return 'Recién nacido/a';
  if (months < 12) return `${months} ${months === 1 ? 'mes' : 'meses'}`;

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (remainingMonths === 0) return `${years} ${years === 1 ? 'año' : 'años'}`;
  return `${years} ${years === 1 ? 'año' : 'años'} y ${remainingMonths} ${remainingMonths === 1 ? 'mes' : 'meses'}`;
}
