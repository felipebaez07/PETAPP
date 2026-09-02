// Validación client-side de archivos antes de subirlos a Supabase Storage. No es la única
// defensa (las policies de `storage.objects` en 0007_pet_media_storage.sql son las que de
// verdad controlan quién puede escribir dónde), pero evita que el usuario suba por error un
// archivo del tipo/tamaño equivocado y desperdicie ancho de banda antes de que el bucket lo
// rechace. `accept` en el <input> es solo una sugerencia del navegador — un usuario puede
// forzar otro tipo de archivo, así que esto revisa el `file.type` real igualmente.

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5MB
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024; // 10MB

export function validatePhotoFile(file: File): string | null {
  if (!file.type.startsWith('image/')) return 'La foto debe ser una imagen (JPG, PNG, WebP…).';
  if (file.size > MAX_PHOTO_BYTES) return 'La foto no puede pesar más de 5MB.';
  return null;
}

export function validateDocumentFile(file: File): string | null {
  const isImage = file.type.startsWith('image/');
  const isPdf = file.type === 'application/pdf';
  if (!isImage && !isPdf) return 'El archivo debe ser una imagen o un PDF.';
  if (file.size > MAX_DOCUMENT_BYTES) return 'El archivo no puede pesar más de 10MB.';
  return null;
}

/** Extensión segura para el path de Storage a partir del nombre original del archivo. */
export function fileExtension(file: File, fallback = 'bin'): string {
  const parts = file.name.split('.');
  if (parts.length < 2) return fallback;
  const ext = parts.pop()!.toLowerCase().replace(/[^a-z0-9]/g, '');
  return ext || fallback;
}
