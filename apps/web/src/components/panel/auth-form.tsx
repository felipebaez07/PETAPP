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
      options: { data: { full_name: fullName, role } },
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

  if (status === 'check-email') {
    return (
      <p className="rounded-md border border-success/30 bg-success/5 p-4 text-sm text-success">
        Revisa tu correo para confirmar la cuenta antes de iniciar sesión.
      </p>
    );
  }

  return (
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
      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
      <Button type="submit" disabled={status === 'submitting'} className="w-full">
        {status === 'submitting' ? 'Procesando…' : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
      </Button>
    </form>
  );
}
