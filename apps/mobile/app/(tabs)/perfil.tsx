import { AlertCircle, CheckCircle2, LogOut, Lock, Mail, Megaphone, Store, UserRound } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { LoadingState } from '@/components/ui/LoadingState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { getCurrentUser, type CurrentUser } from '@/lib/auth';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { UserRole } from '@petapp/shared';

type AuthMode = 'login' | 'signup';

const ROLE_LABELS: Record<string, string> = {
  propietario: 'Propietario/a de mascota',
  establecimiento: 'Establecimiento aliado',
  admin: 'Administrador',
};

const SIGNUP_ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'propietario', label: 'Soy propietario/a de mascota' },
  { value: 'establecimiento', label: 'Tengo un negocio o fundación aliada' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null | undefined>(undefined);
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('propietario');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getCurrentUser()
      .then((current) => {
        if (active) setUser(current);
      })
      .catch(() => {
        // Si falla la carga de sesión, se cae al formulario de login en vez de
        // quedar la pantalla congelada en el spinner para siempre.
        if (active) setUser(null);
      });
    return () => {
      active = false;
    };
  }, []);

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
    if (mode === 'signup' && !fullName.trim()) {
      setError('Ingresa tu nombre completo.');
      return;
    }

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
          : await supabase.auth.signUp({
              email: email.trim(),
              password,
              options: { data: { full_name: fullName.trim(), role } },
            });

      if (authError) {
        setError(authError.message);
        return;
      }

      const current = await getCurrentUser();
      if (current) {
        setUser(current);
      } else {
        setSuccess('Cuenta creada. Revisa tu correo si se requiere confirmación.');
      }
    } catch {
      setError('No se pudo conectar. Intenta más tarde.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
    setEmail('');
    setPassword('');
  }

  if (user === undefined) {
    return <LoadingState label="Cargando tu cuenta..." />;
  }

  if (user) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title="Perfil" subtitle="Tu cuenta en PetApp" />
        <View className="gap-4 p-5">
          <View className="flex-row items-center gap-3 rounded-md border border-border bg-card p-4">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-backgroundAlt">
              <UserRound size={24} color="#0369A1" />
            </View>
            <View className="flex-1">
              <Text className="font-heading text-base text-foreground">{user.profile.full_name}</Text>
              <Text className="font-body text-sm text-mutedForeground">
                {ROLE_LABELS[user.profile.role] ?? user.profile.role}
              </Text>
            </View>
          </View>

          {user.profile.role === 'establecimiento' ? (
            <>
              <Button label="Mi tienda" icon={Store} onPress={() => router.push('/mi-tienda')} />
              <Button label="Mi foro" variant="secondary" icon={Megaphone} onPress={() => router.push('/mi-foro')} />
            </>
          ) : null}

          <Button label="Cerrar sesión" variant="outline" icon={LogOut} onPress={handleSignOut} />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Perfil" subtitle="Tu cuenta en PetApp" />

      <View className="gap-6 p-5">
        <View className="flex-row items-center gap-3 rounded-md border border-border bg-card p-4">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-backgroundAlt">
            <UserRound size={24} color="#0369A1" />
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

          {mode === 'signup' ? (
            <>
              <View className="gap-1.5">
                <Text className="font-bodySemibold text-sm text-foreground">Nombre completo</Text>
                <View className="min-h-11 flex-row items-center gap-2 rounded-sm border border-border bg-card px-3">
                  <UserRound size={18} color="#64748B" />
                  <TextInput
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Tu nombre"
                    placeholderTextColor="#64748B"
                    autoCapitalize="words"
                    className="min-h-11 flex-1 font-body text-base text-foreground"
                  />
                </View>
              </View>

              <View className="gap-1.5">
                <Text className="font-bodySemibold text-sm text-foreground">¿Cómo usarás PetApp?</Text>
                <View className="gap-2">
                  {SIGNUP_ROLE_OPTIONS.map((option) => (
                    <Chip
                      key={option.value}
                      label={option.label}
                      selected={role === option.value}
                      onPress={() => setRole(option.value)}
                    />
                  ))}
                </View>
              </View>
            </>
          ) : null}

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
