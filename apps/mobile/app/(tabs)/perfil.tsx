import { AlertCircle, CheckCircle2, Lock, Mail, UserRound } from 'lucide-react-native';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

type AuthMode = 'login' | 'signup';

export default function ProfileScreen() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setSuccess(null);

    if (!email.trim() || !password) {
      setError('Ingresa tu correo y tu contraseña.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    // Fase 1: el proyecto Supabase real todavía no está provisionado. En vez
    // de lanzar una petición que va a fallar contra una URL de respaldo,
    // mostramos un mensaje claro y salimos.
    if (!isSupabaseConfigured) {
      setError(
        'Este piloto todavía no tiene el backend conectado. Muy pronto podrás iniciar sesión aquí.'
      );
      return;
    }

    setLoading(true);
    try {
      const { error: authError } =
        mode === 'login'
          ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
          : await supabase.auth.signUp({ email: email.trim(), password });

      if (authError) {
        setError(authError.message);
        return;
      }
      setSuccess(
        mode === 'login'
          ? 'Sesión iniciada correctamente.'
          : 'Cuenta creada. Revisa tu correo si se requiere confirmación.'
      );
    } catch {
      setError('No se pudo conectar. Intenta más tarde.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Perfil" subtitle="Tu cuenta en PetApp" />

      <View className="gap-6 p-5">
        <View className="flex-row items-center gap-3 rounded-md border border-border bg-card p-4">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-backgroundAlt">
            <UserRound size={24} color="#123A5C" />
          </View>
          <View className="flex-1">
            <Text className="font-heading text-base text-foreground">Propietario</Text>
            <Text className="font-body text-sm text-mutedForeground">
              Puedes gestionar tus mascotas y reservar citas con establecimientos verificados.
            </Text>
          </View>
        </View>

        <View className="gap-3">
          <View className="flex-row gap-2">
            <Chip label="Iniciar sesión" selected={mode === 'login'} onPress={() => setMode('login')} />
            <Chip label="Registrarse" selected={mode === 'signup'} onPress={() => setMode('signup')} />
          </View>

          <View className="gap-1.5">
            <Text className="font-bodySemibold text-sm text-foreground">Correo electrónico</Text>
            <View className="min-h-11 flex-row items-center gap-2 rounded-sm border border-border bg-card px-3">
              <Mail size={18} color="#64748B" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="tucorreo@ejemplo.com"
                placeholderTextColor="#64748B"
                autoCapitalize="none"
                keyboardType="email-address"
                className="min-h-11 flex-1 font-body text-base text-foreground"
              />
            </View>
          </View>

          <View className="gap-1.5">
            <Text className="font-bodySemibold text-sm text-foreground">Contraseña</Text>
            <View className="min-h-11 flex-row items-center gap-2 rounded-sm border border-border bg-card px-3">
              <Lock size={18} color="#64748B" />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor="#64748B"
                secureTextEntry
                className="min-h-11 flex-1 font-body text-base text-foreground"
              />
            </View>
          </View>

          {error ? (
            <View className="flex-row items-start gap-2 rounded-md border border-border bg-card p-3">
              <AlertCircle size={16} color="#DC2626" />
              <Text className="flex-1 font-body text-sm text-destructive">{error}</Text>
            </View>
          ) : null}

          {success ? (
            <View className="flex-row items-start gap-2 rounded-md border border-border bg-card p-3">
              <CheckCircle2 size={16} color="#059669" />
              <Text className="flex-1 font-body text-sm text-success">{success}</Text>
            </View>
          ) : null}

          <Button
            label={mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            onPress={handleSubmit}
            loading={loading}
          />
        </View>
      </View>
    </View>
  );
}
