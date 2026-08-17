import { Alert, Linking } from 'react-native';

/**
 * Abre una URL externa (wa.me, tel:, etc.) mostrando una alerta amigable en
 * vez de lanzar una excepción si el dispositivo no puede manejarla (por
 * ejemplo, WhatsApp no instalado, o `expo start --web` sin soporte de
 * `tel:`).
 */
export async function openExternalUrl(
  url: string,
  errorMessage = 'No se pudo abrir el enlace. Verifica que tengas la app necesaria instalada.'
): Promise<void> {
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert('No se pudo abrir', errorMessage);
      return;
    }
    await Linking.openURL(url);
  } catch {
    Alert.alert('No se pudo abrir', errorMessage);
  }
}
