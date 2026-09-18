import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PetForm } from '@/components/cuidador/pet-form';
import type { Pet } from '@petapp/shared';

export default async function EditarMascotaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect('/panel/login');

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from('pets').select('*').eq('id', id).eq('owner_id', user.profile.id).maybeSingle();
  if (!data) notFound();
  const pet = data as Pet;

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6">
      <Link
        href={`/cuidador/mascotas/${pet.id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Volver a {pet.name}
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Editar a {pet.name}</CardTitle>
          <CardDescription>Corrige cualquier dato que haya quedado mal la primera vez.</CardDescription>
        </CardHeader>
        <CardContent>
          <PetForm ownerId={user.profile.id} pet={pet} />
        </CardContent>
      </Card>
    </div>
  );
}
