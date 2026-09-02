import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  ListChecks,
  LogOut,
  Lock,
  Mail,
  PawPrint,
  UserRound,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { LoadingState } from '@/components/ui/LoadingState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { getCurrentUser, signInWithGoogle, type CurrentUser } from '@/lib/auth';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { APP_NAME, type UserRole } from '@petapp/shared';

type AuthMode = 'login' | 'signup';
type EntryStep = 'choice' | 'form';

const ROLE_LABELS: Record<string, string> = {
  propietario: 'Propietario/a de mascota',
  establecimiento: 'Establecimiento aliado',
  admin: 'Administrador',
};

const WELCOME_OPTIONS: {
  value: UserRole;
  icon: typeof PawPrint;
  title: string;
  description: string;
}[] = [
  {
    value: 'propietario',
    icon: PawPrint,
    title: 'Soy cuidador',
    description: 'Lleva el calendario preventivo de tus mascotas, guarda documentos y solicita citas.',
  },
  {
    value: 'establecimiento',
    icon: Building2,
    title: 'Tengo un negocio veterinario',
    description: 'Aparece en el directorio verificado y recibe solicitudes de cita de cuidadores.',
  },
];

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null | undefined>(undefined);
  const [entryStep, setEntryStep] = useState<EntryStep>('choice');
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('propietario');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function chooseRole(value: UserRole) {
    setRole(value);
    setError(null);
    setSuccess(null);
    setEntryStep('form');
  }

  function goBackToChoice() {
    setEntryStep('choice');
    setError(null);
    setSuccess(null);
  }

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

  async function handleGoogleSignIn() {
    setError(null);
    setGoogleLoading(true);
    const { error: googleError } = await signInWithGoogle();
    if (googleError) {
      setError(googleError);
      setGoogleLoading(false);
      return;
    }
    // En web, signInWithGoogle ya redirigió la página fuera de la app — nada más que hacer.
    // En nativo, si llegó hasta acá sin error, la sesión ya quedó guardada.
    if (Platform.OS !== 'web') {
      const current = await getCurrentUser();
      setUser(current);
    }
    setGoogleLoading(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
    setEmail('');
    setPassword('');
    setEntryStep('choice');
  }

  if (user === undefined) {
    return <LoadingState label="Cargando tu cuenta..." />;
  }

  if (user) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title="Perfil" subtitle={`Tu cuenta en ${APP_NAME}`} />
        <View className="gap-4 p-5">
          <View className="flex-row items-center gap-3 rounded-xl bg-card p-4 shadow-sm">
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
            <Pressable
              onPress={() => router.push('/(tabs)/mascotas')}
              accessibilityRole="button"
              className="flex-row items-center gap-3 rounded-xl bg-card p-4 shadow-sm"
            >
              <View className="h-11 w-11 items-center justify-center rounded-md bg-backgroundAlt">
                <PawPrint size={20} color="#0369A1" />
              </View>
              <View className="flex-1">
                <Text className="font-bodySemibold text-base text-foreground">Mis mascotas</Text>
                <Text className="font-body text-sm text-mutedForeground">
                  Si además tienes mascotas propias, llévalas aquí — la tab queda oculta para cuentas
                  de negocio, pero la pantalla sigue disponible.
                </Text>
              </View>
              <ChevronRight size={18} color="#64748B" />
            </Pressable>
          ) : null}

          {user.profile.role === 'establecimiento' ? (
            <View className="gap-3">
              <Text className="font-heading text-lg text-foreground">Gestionar mi negocio</Text>
              <View className="overflow-hidden rounded-xl bg-card shadow-sm">
                {[
                  { label: 'Perfil del negocio', icon: Building2, href: '/negocio-perfil' as const },
                  { label: 'Horarios', icon: Clock, href: '/negocio-horarios' as const },
                  { label: 'Servicios', icon: ListChecks, href: '/negocio-servicios' as const },
                  { label: 'Mi plan', icon: CreditCard, href: '/negocio-plan' as const },
                ].map((item, index, arr) => (
                  <Pressable
                    key={item.href}
                    onPress={() => router.push(item.href)}
                    accessibilityRole="button"
                    className={[
                      'min-h-11 flex-row items-center gap-3 px-4 py-3',
                      index < arr.length - 1 ? 'border-b border-border' : '',
                    ].join(' ')}
                  >
                    <item.icon size={20} color="#0369A1" />
                    <Text className="flex-1 font-bodyMedium text-base text-foreground">{item.label}</Text>
                    <ChevronRight size={18} color="#64748B" />
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          <Button label="Cerrar sesión" variant="outline" icon={LogOut} onPress={handleSignOut} />
        </View>
      </View>
    );
  }

  if (entryStep === 'choice') {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader
          title={`Bienvenido a ${APP_NAME}`}
          subtitle="Seguimiento preventivo, documentos y prestadores verificados en un solo lugar"
        />
        <View className="gap-3 p-5">
          {WELCOME_OPTIONS.map((option, index) => (
            <Animated.View
              key={option.value}
              entering={FadeInDown.duration(260).delay(index * 60).springify().damping(26).stiffness(220)}
            >
              <Pressable
                onPress={() => chooseRole(option.value)}
                accessibilityRole="button"
                style={({ pressed }) => (pressed ? { transform: [{ scale: 0.98 }] } : undefined)}
                className="flex-row items-center gap-4 rounded-xl bg-card p-5 shadow-sm"
              >
                <View className="h-14 w-14 items-center justify-center rounded-full bg-backgroundAlt">
                  <option.icon size={26} color="#0369A1" />
                </View>
                <View className="flex-1 gap-1">
                  <Text className="font-heading text-base text-foreground">{option.title}</Text>
                  <Text className="font-body text-sm text-mutedForeground">{option.description}</Text>
                </View>
                <ChevronRight size={20} color="#64748B" />
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </View>
    );
  }

  const chosenOption = WELCOME_OPTIONS.find((option) => option.value === role) ?? WELCOME_OPTIONS[0];

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Perfil" subtitle={`Tu cuenta en ${APP_NAME}`} />

      <Animated.View
        entering={FadeInDown.duration(240).springify().damping(22).stiffness(200)}
        className="gap-6 p-5"
      >
        <Pressable
          onPress={goBackToChoice}
          accessibilityRole="button"
          className="min-h-11 flex-row items-center gap-1.5 self-start"
        >
          <ChevronLeft size={18} color="#0369A1" />
          <Text className="font-bodyMedium text-sm text-primary">Cambiar</Text>
        </Pressable>

        <View className="flex-row items-center gap-3 rounded-xl bg-card p-4 shadow-sm">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-backgroundAlt">
            <chosenOption.icon size={24} color="#0369A1" />
          </View>
          <View className="flex-1">
            <Text className="font-heading text-base text-foreground">{chosenOption.title}</Text>
            <Text className="font-body text-sm text-mutedForeground">
              {mode === 'login' ? 'Inicia sesión en tu cuenta.' : chosenOption.description}
            </Text>
          </View>
        </View>

        <View className="gap-3">
          <View className="flex-row gap-2">
            <Chip label="Iniciar sesión" selected={mode === 'login'} onPress={() => setMode('login')} />
            <Chip label="Registrarse" selected={mode === 'signup'} onPress={() => setMode('signup')} />
          </View>

          {/* Google siempre crea/entra a una cuenta de cuidador (propietario) — no hay forma de
              pasarle el rol elegido al flujo de OAuth. Si se está registrando como empresa, se
              oculta y se explica, igual que ya hace `apps/web/src/components/panel/auth-form.tsx`. */}
          {!(mode === 'signup' && role === 'establecimiento') ? (
            <View className="gap-2">
              <Button
                label={googleLoading ? 'Redirigiendo…' : 'Continuar con Google'}
                variant="outline"
                onPress={handleGoogleSignIn}
                loading={googleLoading}
              />
              <View className="flex-row items-center gap-3">
                <View className="h-px flex-1 bg-border" />
                <Text className="font-body text-xs text-mutedForeground">o con tu correo</Text>
                <View className="h-px flex-1 bg-border" />
              </View>
            </View>
          ) : (
            <Text className="font-body text-xs text-mutedForeground">
              Con Google solo se crean cuentas de cuidador. Para registrar tu negocio, usa el formulario
              con correo abajo.
            </Text>
          )}

          {mode === 'signup' ? (
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
            <View className="flex-row items-start gap-2 rounded-xl bg-card p-3 shadow-xs">
              <AlertCircle size={16} color="#DC2626" />
              <Text className="flex-1 font-body text-sm text-destructive">{error}</Text>
            </View>
          ) : null}

          {success ? (
            <View className="flex-row items-start gap-2 rounded-xl bg-card p-3 shadow-xs">
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
      </Animated.View>
    </View>
  );
}
