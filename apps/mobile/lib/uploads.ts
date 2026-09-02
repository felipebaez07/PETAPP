import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

import { supabase } from './supabase';

// Subida real de foto de mascota y documentos a Supabase Storage
// (supabase/migrations/0007_pet_media_storage.sql) desde React Native/Expo.
//
// Diferencia real y conocida frente a `apps/web/src/lib/uploads.ts`: en el navegador,
// `@supabase/supabase-js` recibe directamente el `File` del `<input type="file">`. React
// Native no tiene un `File`/`Blob` completo — no hay forma de leer el URI local del picker
// con un `Blob` confiable en todos los entornos. El patrón documentado por Supabase para
// Expo/React Native (y el que se usa acá) es leer el URI con `fetch(uri).arrayBuffer()`
// —Expo soporta `fetch` sobre URIs locales `file://`/`content://`/`blob:`— y subir ese
// `ArrayBuffer`, que sí acepta `storage.from(bucket).upload()` en cualquier entorno.

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5MB
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024; // 10MB

/** Forma común de un archivo elegido, venga de expo-image-picker o expo-document-picker. */
export interface PickedFile {
  uri: string;
  mimeType: string | null;
  /** `null` cuando el picker no informó el tamaño — no todos los orígenes lo dan. */
  size: number | null;
  name: string | null;
}

/**
 * Validación en el cliente antes de subir. No es la única defensa (las policies de
 * `storage.objects` de 0007_pet_media_storage.sql son las que de verdad deciden quién puede
 * escribir dónde), pero evita gastar ancho de banda con un tipo/tamaño equivocado. El picker
 * "debería" devolver el tipo correcto según lo pedido, pero no se confía solo en eso: se
 * revisa el `mimeType` real igual que hace la versión web con `file.type`.
 */
export function validatePhotoAsset(file: PickedFile): string | null {
  if (!file.mimeType || !file.mimeType.startsWith('image/')) {
    return 'La foto debe ser una imagen (JPG, PNG, WebP...).';
  }
  if (file.size != null && file.size > MAX_PHOTO_BYTES) return 'La foto no puede pesar más de 5MB.';
  return null;
}

export function validateDocumentAsset(file: PickedFile): string | null {
  const isImage = file.mimeType?.startsWith('image/') ?? false;
  const isPdf = file.mimeType === 'application/pdf';
  if (!isImage && !isPdf) return 'El archivo debe ser una imagen o un PDF.';
  if (file.size != null && file.size > MAX_DOCUMENT_BYTES) return 'El archivo no puede pesar más de 10MB.';
  return null;
}

/** Extensión segura para el path de Storage a partir del nombre original del archivo. */
export function fileExtensionFromName(name: string | null | undefined, fallback = 'bin'): string {
  if (!name) return fallback;
  const parts = name.split('.');
  if (parts.length < 2) return fallback;
  const ext = parts.pop()!.toLowerCase().replace(/[^a-z0-9]/g, '');
  return ext || fallback;
}

/**
 * Id corto para nombrar archivos subidos y evitar colisiones entre documentos de una misma
 * mascota. No es una clave de seguridad — el control de acceso real lo dan las policies de
 * Storage sobre el prefijo `<auth.uid()>/<pet_id>/`, no que el nombre del archivo sea
 * impredecible.
 */
export function generateFileId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Pide permiso de galería y abre el selector de imágenes. Devuelve `null` si el usuario
 * cancela o si no concede el permiso — en ese segundo caso muestra un aviso claro en vez de
 * fallar en silencio.
 */
export async function pickImageFromLibrary(): Promise<PickedFile | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert(
      'Permiso necesario',
      'PETAPP necesita acceso a tus fotos para elegir una imagen. Actívalo desde los ajustes del dispositivo.'
    );
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
  });
  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    mimeType: asset.mimeType ?? 'image/jpeg',
    size: asset.fileSize ?? null,
    name: asset.fileName ?? null,
  };
}

/**
 * Selector de archivos (imagen o PDF) para documentos — a diferencia de la galería, permite
 * elegir un PDF guardado en el dispositivo, además de imágenes.
 */
export async function pickDocumentFile(): Promise<PickedFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['image/*', 'application/pdf'],
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    mimeType: asset.mimeType ?? null,
    size: asset.size ?? null,
    name: asset.name ?? null,
  };
}

/**
 * Sube un archivo local a un bucket de Supabase Storage con el cliente autenticado del
 * usuario (nunca service role) — las policies de `storage.objects` de
 * 0007_pet_media_storage.sql son las que de verdad controlan quién puede escribir en `path`.
 */
export async function uploadFileToBucket(
  bucket: string,
  path: string,
  file: PickedFile
): Promise<{ error: string | null }> {
  try {
    const response = await fetch(file.uri);
    const arrayBuffer = await response.arrayBuffer();
    const { error } = await supabase.storage.from(bucket).upload(path, arrayBuffer, {
      upsert: true,
      contentType: file.mimeType ?? 'application/octet-stream',
    });
    return { error: error?.message ?? null };
  } catch {
    return { error: 'No se pudo subir el archivo. Intenta de nuevo.' };
  }
}
