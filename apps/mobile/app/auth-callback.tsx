import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { completeGoogleSignIn } from '@/lib/auth';

/**
 * Destino del redirect de Google en el flujo web (navegador real o el export estático de la
 * app móvil, ver `lib/auth.ts` → `signInWithGoogle`). En nativo, `expo-web-browser` intercepta
 * el redirect a `petapp://auth-callback` antes de que la app navegue aquí de verdad — esta
 * pantalla solo se monta en la práctica en la variante web.
 */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const ranOnce = useRef(false);

  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;

    if (typeof window === 'undefined') return;

    completeGoogleSignIn(window.location.href).then((result) => {
      if (result.error) {
        setError(result.error);
        return;
      }
      router.replace('/(tabs)/perfil');
    });
  }, [router]);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-background p-6">
        <Text className="text-center font-body text-sm text-destructive">{error}</Text>
        <Button label="Volver" variant="outline" onPress={() => router.replace('/(tabs)/perfil')} />
      </View>
    );
  }

  return <LoadingState label="Iniciando sesión con Google..." />;
}
