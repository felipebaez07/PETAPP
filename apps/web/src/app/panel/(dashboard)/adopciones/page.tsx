import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ADOPTION_STATUS_LABELS, SPECIES_LABELS, type AdoptionPost } from '@petapp/shared';
import { addAdoptionPost, updateAdoptionStatus } from './actions';

export default async function AdopcionesPanelPage() {
  const user = await getCurrentUser();
  if (!user?.establishment) redirect('/panel');

  const supabase = await createSupabaseServerClient();
  const { data: posts } = await supabase
    .from('adoption_posts')
    .select('*')
    .eq('establishment_id', user.establishment.id)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">Publicaciones de adopción</h1>

      <Card>
        <CardHeader>
          <CardTitle>Publicar animal en adopción</CardTitle>
          <CardDescription>Toda la información ayuda a una adopción responsable e informada.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={addAdoptionPost} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="animal_name">Nombre</Label>
                <Input id="animal_name" name="animal_name" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="species">Especie</Label>
                <select id="species" name="species" className="h-11 w-full rounded-sm border border-input bg-card px-3 text-sm">
                  {Object.entries(SPECIES_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="estimated_age">Edad aproximada</Label>
                <Input id="estimated_age" name="estimated_age" placeholder="Ej. Cachorro (3 meses)" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sex">Sexo</Label>
                <select id="sex" name="sex" className="h-11 w-full rounded-sm border border-input bg-card px-3 text-sm">
                  <option value="macho">Macho</option>
                  <option value="hembra">Hembra</option>
                  <option value="desconocido">Desconocido</option>
                </select>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Checkbox id="sterilized" name="sterilized" />
                <Label htmlFor="sterilized" className="cursor-pointer">
                  Esterilizado/a
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="vaccinated" name="vaccinated" />
                <Label htmlFor="vaccinated" className="cursor-pointer">
                  Vacunado/a
                </Label>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="health_notes">Notas de salud (opcional)</Label>
              <Textarea id="health_notes" name="health_notes" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="personality_notes">Personalidad (opcional)</Label>
              <Textarea id="personality_notes" name="personality_notes" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location_text">Ubicación (opcional)</Label>
              <Input id="location_text" name="location_text" placeholder="Ej. Ibagué, zona norte" />
            </div>
            <Button type="submit">Publicar</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tus publicaciones ({posts?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {!posts || posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no has publicado animales en adopción.</p>
          ) : (
            <ul className="space-y-3">
              {(posts as AdoptionPost[]).map((post) => (
                <li key={post.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 last:border-0">
                  <div>
                    <p className="font-medium text-foreground">{post.animal_name}</p>
                    <p className="text-sm text-muted-foreground">{SPECIES_LABELS[post.species]}</p>
                  </div>
                  <form action={updateAdoptionStatus} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={post.id} />
                    <select name="status" defaultValue={post.status} className="h-9 rounded-sm border border-input bg-card px-2 text-sm">
                      {Object.entries(ADOPTION_STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <Button type="submit" size="sm" variant="outline">
                      Actualizar
                    </Button>
                  </form>
                  <Badge variant="accent">{ADOPTION_STATUS_LABELS[post.status]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
