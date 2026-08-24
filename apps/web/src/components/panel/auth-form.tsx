'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { APP_NAME, type UserRole } from '@petapp/shared';

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'establecimiento', label: 'Tengo un negocio o fundación aliada' },
  { value: 'propietario', label: 'Soy propietario/a de mascota' },
];

export function AuthForm({ mode }: { mode: 'login' | 'registro' }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('establecimiento');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error' | 'check-email'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  if (!isSupabaseConfigured()) {
    return (
      <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Esta sección requiere un proyecto Supabase conectado. Todavía estamos en modo de demostración — ver{' '}
        <code className="rounded bg-muted px-1 py-0.5">docs/NEXT_STEPS.md</code>.
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage(null);
    const supabase = createSupabaseBrowserClient();

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setErrorMessage(error.message);
        setStatus('error');
        return;
      }
      router.push('/panel');
      router.refresh();
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setErrorMessage(error.message);
      setStatus('error');
      return;
    }
    if (data.session) {
      router.push('/panel');
      router.refresh();
      return;
    }
    setStatus('check-email');
  };

  const onGoogleClick = async () => {
    setGoogleLoading(true);
    setErrorMessage(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setErrorMessage(error.message);
      setGoogleLoading(false);
    }
    // Si no hay error, signInWithOAuth ya redirigió el navegador a Google.
  };

  if (status === 'check-email') {
    return (
      <p className="rounded-md border border-success/30 bg-success/5 p-4 text-sm text-success">
        Revisa tu correo para confirmar la cuenta antes de iniciar sesión.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        disabled={googleLoading}
        onClick={onGoogleClick}
      >
        <GoogleIcon />
        {googleLoading ? 'Redirigiendo…' : 'Continuar con Google'}
      </Button>
      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
      {mode === 'registro' && (
        <p className="text-center text-xs text-muted-foreground">
          Con Google se crea una cuenta de propietario/a de mascota. Si tienes un negocio o fundación
          aliada, usa el registro con correo abajo para indicarlo.
        </p>
      )}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        o con tu correo
        <span className="h-px flex-1 bg-border" />
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
      {mode === 'registro' && (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Nombre completo</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>¿Cómo usarás {APP_NAME}?</Label>
            <div className="space-y-2">
              {ROLE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-2 rounded-sm border border-border p-2.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-muted"
                >
                  <input
                    type="radio"
                    name="role"
                    value={option.value}
                    checked={role === option.value}
                    onChange={() => setRole(option.value)}
                    className="accent-primary"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>
        </>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
      </div>
      <Button type="submit" disabled={status === 'submitting'} className="w-full">
        {status === 'submitting' ? 'Procesando…' : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
      </Button>
      </form>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 6.293C4.672 4.166 6.656 2.58 9 2.58z"
      />
    </svg>
  );
}
