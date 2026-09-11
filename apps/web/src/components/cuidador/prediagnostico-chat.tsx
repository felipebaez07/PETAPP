'use client';

import { useId, useRef, useState, type ChangeEvent } from 'react';
import { Bot, Download, ImagePlus, Send, TriangleAlert, User, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PrediagnosticoRoadmap } from '@/components/cuidador/prediagnostico-roadmap';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { validatePhotoFile, fileExtension } from '@/lib/uploads';
import type { AiConversation, AiRoadmapItem } from '@petapp/shared';

interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
  /** Vista previa local (blob URL) de una foto adjunta a este turno — solo dura la sesión. */
  imagePreviewUrl?: string;
}

interface PrediagnosticoChatProps {
  petId: string;
  petName: string;
  /** Dueño de la mascota (auth.uid()) — primer segmento de la ruta en el bucket ai-chat-images. */
  ownerId: string;
  initialConversation: AiConversation | null;
}

export function PrediagnosticoChat({ petId, petName, ownerId, initialConversation }: PrediagnosticoChatProps) {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [draft, setDraft] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(initialConversation?.id ?? null);
  const [summary, setSummary] = useState<string | null>(initialConversation?.summary ?? null);
  const [roadmap, setRoadmap] = useState<AiRoadmapItem[] | null>(initialConversation?.roadmap ?? null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaId = useId();
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const done = Boolean(summary);

  const onPhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    setPhotoError(null);
    if (!selected) return;
    const validationError = validatePhotoFile(selected);
    if (validationError) {
      setPhotoError(validationError);
      e.target.value = '';
      return;
    }
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhoto(selected);
    setPhotoPreviewUrl(URL.createObjectURL(selected));
  };

  const removePhoto = () => {
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhoto(null);
    setPhotoPreviewUrl(null);
    setPhotoError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const send = async () => {
    const message = draft.trim();
    const pendingPhoto = photo;
    const pendingPreviewUrl = photoPreviewUrl;
    if ((!message && !pendingPhoto) || sending || done) return;
    setSending(true);
    setError(null);

    // Si hay foto, se sube ANTES de armar el turno — si la subida falla, no queremos un mensaje
    // "fantasma" en el chat sin foto real detrás.
    let imagePath: string | undefined;
    if (pendingPhoto) {
      // Bucket privado (0011_ai_chat_images.sql): la subida usa el cliente con la sesión del
      // cuidador (nunca service role) — la policy de Storage exige que el primer segmento de la
      // ruta sea su propio auth.uid().
      const supabase = createSupabaseBrowserClient();
      const ext = fileExtension(pendingPhoto, 'jpg');
      const path = `${ownerId}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('ai-chat-images')
        .upload(path, pendingPhoto, { contentType: pendingPhoto.type });
      if (uploadError) {
        setError('No se pudo subir la foto. Intenta de nuevo.');
        setSending(false);
        return;
      }
      imagePath = path;
    }

    setTurns((prev) => [...prev, { role: 'user', content: message, imagePreviewUrl: pendingPreviewUrl ?? undefined }]);
    setDraft('');
    setPhoto(null);
    setPhotoPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    try {
      const res = await fetch('/api/ai/prediagnostico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ petId, conversationId: conversationId ?? undefined, message, imagePath }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Algo salió mal, intenta de nuevo.');
        return;
      }
      setConversationId(data.conversationId);
      if (data.done) {
        setSummary(data.summary);
        setRoadmap(data.roadmap ?? null);
      } else {
        setTurns((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      }
      requestAnimationFrame(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }));
    } catch {
      setError('No se pudo conectar con el asistente. Revisa tu conexión e intenta de nuevo.');
    } finally {
      setSending(false);
    }
  };

  const startNew = () => {
    setTurns([]);
    setConversationId(null);
    setSummary(null);
    setRoadmap(null);
    setError(null);
    removePhoto();
  };

  const downloadSummary = () => {
    if (!summary) return;
    const blob = new Blob(
      [`Pre-diagnóstico para ${petName}\nGenerado por el asistente de IA de PETAPP — no es un diagnóstico real.\n\n${summary}`],
      { type: 'text/plain;charset=utf-8' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prediagnostico-${petName.toLowerCase().replace(/\s+/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (done && summary) {
    return (
      <div className="space-y-4">
        <Card className="border-secondary/30 bg-secondary/5">
          <CardContent className="space-y-3 p-5">
            <div className="flex items-start gap-2">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-secondary" aria-hidden />
              <p className="text-sm font-medium text-foreground">
                Este resumen no es un diagnóstico — es una guía para tu consulta veterinaria.
              </p>
            </div>
            <p className="whitespace-pre-wrap text-sm text-foreground/90">{summary}</p>
          </CardContent>
        </Card>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={downloadSummary} className="gap-1.5">
            <Download className="size-4" /> Descargar como texto
          </Button>
          <Button size="sm" variant="outline" onClick={startNew}>
            Empezar una nueva consulta
          </Button>
        </div>
        {roadmap && roadmap.length > 0 && conversationId && (
          <PrediagnosticoRoadmap petId={petId} conversationId={conversationId} items={roadmap} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="max-h-[60vh] min-h-[200px] space-y-4 overflow-y-auto p-4">
          {turns.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Empieza contando qué notaste en {petName}: qué síntoma, desde cuándo, y cualquier otro detalle que
              te parezca importante. También puedes adjuntar una foto.
            </p>
          )}
          {turns.map((turn, index) => (
            <div key={index} className={`flex gap-2 ${turn.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {turn.role === 'assistant' && (
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary/15">
                  <Bot className="size-4 text-secondary" aria-hidden />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                  turn.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                }`}
              >
                {turn.imagePreviewUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- blob URL local, no aplica next/image
                  <img
                    src={turn.imagePreviewUrl}
                    alt="Foto adjunta"
                    className="mb-1.5 max-h-40 w-auto rounded-md object-cover"
                  />
                )}
                {turn.content && <span>{turn.content}</span>}
              </div>
              {turn.role === 'user' && (
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15">
                  <User className="size-4 text-primary" aria-hidden />
                </div>
              )}
            </div>
          ))}
          {sending && <p className="text-sm text-muted-foreground">El asistente está escribiendo…</p>}
          <div ref={scrollRef} />
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {photoError && <p className="text-sm text-destructive">{photoError}</p>}

      {photoPreviewUrl && (
        <div className="flex items-center gap-2 rounded-md border border-border bg-card p-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- blob URL local, no aplica next/image */}
          <img src={photoPreviewUrl} alt="Foto a adjuntar" className="size-12 rounded-md object-cover" />
          <p className="flex-1 truncate text-xs text-muted-foreground">{photo?.name}</p>
          <Button type="button" variant="ghost" size="icon" aria-label="Quitar foto" onClick={removePhoto}>
            <X className="size-4" />
          </Button>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        className="flex items-end gap-2"
      >
        <label htmlFor={textareaId} className="sr-only">
          Mensaje
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={onPhotoChange}
          disabled={sending}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Adjuntar foto"
          disabled={sending}
          onClick={() => fileInputRef.current?.click()}
        >
          <ImagePlus className="size-4" />
        </Button>
        <Textarea
          id={textareaId}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder="Escribe acá…"
          rows={2}
          disabled={sending}
        />
        <Button type="submit" size="icon" disabled={sending || (!draft.trim() && !photo)} aria-label="Enviar">
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
