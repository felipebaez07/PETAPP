'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Search, X } from 'lucide-react';
import { clinicalPatientSchema, SPECIES_LABELS, type PetSex, type PetSpecies } from '@petapp/shared';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { createClinicalPatient, searchPets, type PetSearchResult } from '@/app/panel/(dashboard)/pacientes/nuevo/actions';

const SPECIES_OPTIONS = Object.entries(SPECIES_LABELS) as [PetSpecies, string][];

// No hay un `constants.ts` compartido para el sexo (a diferencia de especie) — se mantiene local
// acá en vez de agregarlo a packages/shared, que esta tarea dejó explícitamente fuera de alcance.
const SEX_LABELS: Record<PetSex, string> = {
  macho: 'Macho',
  hembra: 'Hembra',
  desconocido: 'Desconocido',
};
const SEX_OPTIONS = Object.entries(SEX_LABELS) as [PetSex, string][];

type Mode = 'vincular' | 'nuevo';

/**
 * Formulario de alta de paciente clínico. Sigue el patrón `<form action={serverAction}>` con
 * `FormData` que ya usa el resto del panel de establecimiento (ver `servicios/page.tsx`), pero
 * agrega una validación en el cliente con el mismo `clinicalPatientSchema` justo antes de dejar
 * que el navegador envíe el formulario — mismo criterio de "mostrar el error cerca del campo"
 * que ya usan `pet-form.tsx` y `create-establishment-form.tsx` (con react-hook-form +
 * zodResolver), adaptado a un formulario simple de FormData en vez de react-hook-form porque acá
 * la acción del servidor debe seguir aceptando `FormData` directo (pedido explícito de la
 * tarea), no un objeto ya tipado.
 */
export function ClinicalPatientForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [mode, setMode] = useState<Mode>('vincular');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PetSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPet, setSelectedPet] = useState<PetSearchResult | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [topError, setTopError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== 'vincular' || selectedPet) {
      setResults([]);
      return;
    }
    const q = query.trim();
    if (!q) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timeout = setTimeout(() => {
      searchPets(q)
        .then(setResults)
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, mode, selectedPet]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    setFieldErrors({});
    setTopError(null);

    if (mode === 'vincular' && !selectedPet) {
      e.preventDefault();
      setTopError('Selecciona una mascota antes de continuar, o cambia a "Paciente nuevo".');
      return;
    }

    const fd = new FormData(e.currentTarget);
    const estimatedAgeRaw = String(fd.get('estimated_age_years') ?? '').trim();
    const raw = {
      pet_id: String(fd.get('pet_id') ?? '').trim() || undefined,
      owner_full_name: String(fd.get('owner_full_name') ?? '').trim(),
      owner_phone: String(fd.get('owner_phone') ?? '').trim(),
      owner_document: String(fd.get('owner_document') ?? '').trim(),
      name: String(fd.get('name') ?? '').trim(),
      species: String(fd.get('species') ?? '').trim(),
      breed: String(fd.get('breed') ?? '').trim(),
      sex: String(fd.get('sex') ?? '').trim(),
      birth_date: String(fd.get('birth_date') ?? '').trim(),
      estimated_age_years: estimatedAgeRaw ? Number(estimatedAgeRaw) : undefined,
      color: String(fd.get('color') ?? '').trim(),
      origin_place: String(fd.get('origin_place') ?? '').trim(),
      microchip_number: String(fd.get('microchip_number') ?? '').trim(),
      sterilized: fd.get('sterilized') === 'on',
      allergies: String(fd.get('allergies') ?? '').trim(),
      chronic_conditions: String(fd.get('chronic_conditions') ?? '').trim(),
      notes: String(fd.get('notes') ?? '').trim(),
    };

    const parsed = clinicalPatientSchema.safeParse(raw);
    if (!parsed.success) {
      e.preventDefault();
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === 'string' && !errors[key]) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    // Válido: se deja seguir el envío nativo hacia `action={createClinicalPatient}`.
  }

  return (
    <form ref={formRef} action={createClinicalPatient} onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label>¿Cómo quieres registrar este paciente?</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          <label
            className="flex cursor-pointer items-center gap-2 rounded-sm border border-border p-2.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-muted"
          >
            <input
              type="radio"
              name="mode"
              value="vincular"
              checked={mode === 'vincular'}
              onChange={() => {
                setMode('vincular');
                setFieldErrors({});
                setTopError(null);
              }}
              className="accent-primary"
            />
            Vincular mascota ya registrada
          </label>
          <label
            className="flex cursor-pointer items-center gap-2 rounded-sm border border-border p-2.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-muted"
          >
            <input
              type="radio"
              name="mode"
              value="nuevo"
              checked={mode === 'nuevo'}
              onChange={() => {
                setMode('nuevo');
                setSelectedPet(null);
                setFieldErrors({});
                setTopError(null);
              }}
              className="accent-primary"
            />
            Paciente nuevo (sin cuenta)
          </label>
        </div>
      </div>

      {mode === 'vincular' ? (
        selectedPet ? (
          <Card>
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium text-foreground">{selectedPet.name}</p>
                <p className="text-sm text-muted-foreground">
                  {SPECIES_LABELS[selectedPet.species]}
                  {selectedPet.breed ? ` · ${selectedPet.breed}` : ''}
                  {selectedPet.owner_name ? ` · Dueño/a: ${selectedPet.owner_name}` : ''}
                </p>
              </div>
              <Button type="button" variant="ghost" size="icon" aria-label="Cambiar mascota" onClick={() => setSelectedPet(null)}>
                <X className="size-4" />
              </Button>
            </CardContent>
            <input type="hidden" name="pet_id" value={selectedPet.id} />
            <input type="hidden" name="name" value={selectedPet.name} />
            <input type="hidden" name="species" value={selectedPet.species} />
            <input type="hidden" name="breed" value={selectedPet.breed ?? ''} />
          </Card>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="pet-search">Buscar por nombre de la mascota o del dueño</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                id="pet-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ej. Luna, o el nombre del dueño"
                className="pl-9"
              />
            </div>
            {searching && <p className="text-sm text-muted-foreground">Buscando…</p>}
            {!searching && query.trim() && results.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Sin resultados. Si el dueño no tiene cuenta, cambia a &quot;Paciente nuevo&quot;.
              </p>
            )}
            {results.length > 0 && (
              <ul className="divide-y divide-border overflow-hidden rounded-md border border-border">
                {results.map((pet) => (
                  <li key={pet.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPet(pet);
                        setTopError(null);
                      }}
                      className="flex w-full items-center justify-between gap-3 p-3 text-left text-sm hover:bg-muted"
                    >
                      <span className="font-medium text-foreground">{pet.name}</span>
                      <span className="text-muted-foreground">
                        {SPECIES_LABELS[pet.species]}
                        {pet.breed ? ` · ${pet.breed}` : ''}
                        {pet.owner_name ? ` · ${pet.owner_name}` : ''}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre del paciente</Label>
              <Input id="name" name="name" placeholder="Ej. Luna" />
              {fieldErrors.name && <p className="text-sm text-destructive">{fieldErrors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="species">Especie</Label>
              <select
                id="species"
                name="species"
                defaultValue="perro"
                className="flex h-11 w-full rounded-sm border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {SPECIES_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="breed">Raza (opcional)</Label>
            <Input id="breed" name="breed" placeholder="Ej. Criollo, Labrador…" />
          </div>

          <div className="space-y-3 rounded-md border border-border p-3">
            <p className="text-sm font-medium text-foreground">Datos del dueño (sin cuenta en la plataforma)</p>
            <div className="space-y-1.5">
              <Label htmlFor="owner_full_name">Nombre completo</Label>
              <Input id="owner_full_name" name="owner_full_name" placeholder="Ej. María Torres" />
              {fieldErrors.owner_full_name && <p className="text-sm text-destructive">{fieldErrors.owner_full_name}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="owner_phone">Teléfono (opcional)</Label>
                <Input id="owner_phone" name="owner_phone" placeholder="3001234567" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="owner_document">Documento (opcional)</Label>
                <Input id="owner_document" name="owner_document" placeholder="Cédula u otro" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* `key` fuerza a React a remontar este bloque (y sus `defaultValue`/`defaultChecked`) cada
          vez que cambia la mascota vinculada o el modo — si no, cambiar de mascota seleccionada
          no actualizaría lo ya tipado en estos campos, porque `defaultValue` solo se aplica en el
          montaje inicial. */}
      <div key={mode === 'vincular' ? (selectedPet?.id ?? 'sin-seleccionar') : 'nuevo'} className="space-y-4 border-t border-border pt-4">
        <p className="text-sm font-medium text-foreground">
          Ficha clínica
          {selectedPet && (
            <span className="ml-2 font-normal text-muted-foreground">
              — precargada con lo que ya sabemos de {selectedPet.name}, edítala si hace falta
            </span>
          )}
        </p>

        <div className="space-y-1.5">
          <Label htmlFor="sex">Sexo</Label>
          <select
            id="sex"
            name="sex"
            defaultValue={selectedPet?.sex ?? 'desconocido'}
            className="flex h-11 w-full max-w-xs rounded-sm border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {SEX_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="mb-1.5 text-sm text-muted-foreground">
            Indica la fecha de nacimiento si la sabes, o una edad aproximada si no — no hace falta llenar ambas.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="birth_date">Fecha de nacimiento (opcional)</Label>
              <Input id="birth_date" name="birth_date" type="date" defaultValue={selectedPet?.birth_date ?? ''} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="estimated_age_years">Edad aproximada en años (opcional)</Label>
              <Input id="estimated_age_years" name="estimated_age_years" type="number" min="0" max="60" step="0.5" />
              {fieldErrors.estimated_age_years && (
                <p className="text-sm text-destructive">{fieldErrors.estimated_age_years}</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="color">Color (opcional)</Label>
            <Input id="color" name="color" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="origin_place">Lugar de procedencia (opcional)</Label>
            <Input id="origin_place" name="origin_place" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="microchip_number">Número de microchip (opcional)</Label>
          <Input id="microchip_number" name="microchip_number" />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox id="sterilized" name="sterilized" defaultChecked={selectedPet?.sterilized ?? false} />
          <Label htmlFor="sterilized" className="cursor-pointer">
            Esterilizado/a
          </Label>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="allergies">Alergias (opcional)</Label>
          <Textarea id="allergies" name="allergies" rows={2} placeholder="Ej. Penicilina" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="chronic_conditions">Condiciones crónicas (opcional)</Label>
          <Textarea id="chronic_conditions" name="chronic_conditions" rows={2} placeholder="Ej. Insuficiencia renal" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="notes">Notas (opcional)</Label>
          <Textarea id="notes" name="notes" rows={2} defaultValue={selectedPet?.notes ?? ''} />
        </div>
      </div>

      {topError && <p className="text-sm text-destructive">{topError}</p>}

      <Button type="submit">Crear paciente</Button>
    </form>
  );
}
