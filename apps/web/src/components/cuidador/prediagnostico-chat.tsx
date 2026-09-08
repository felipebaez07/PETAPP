'use client';

import { useId, useRef, useState } from 'react';
import { Bot, Download, Send, TriangleAlert, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { AiConversation } from '@petapp/shared';

interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

interface PrediagnosticoChatProps {
  petId: string;
  petName: string;
  initialConversation: AiConversation | null;
}

export function PrediagnosticoChat({ petId, petName, initialConversation }: PrediagnosticoChatProps) {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [draft, setDraft] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(initialConversation?.id ?? null);
  const [summary, setSummary] = useState<string | null>(initialConversation?.summary ?? null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaId = useId();
  const scrollRef = useRef<HTMLDivElement>(null);

  const done = Boolean(summary);

  const send = async () => {
    const message = draft.trim();
    if (!message || sending || done) return;
    setSending(true);
    setError(null);
    setTurns((prev) => [...prev, { role: 'user', content: message }]);
    setDraft('');

    try {
      const res = await fetch('/api/ai/prediagnostico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ petId, conversationId: conversationId ?? undefined, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Algo salió mal, intenta de nuevo.');
        return;
      }
      setConversationId(data.conversationId);
      if (data.done) {
        setSummary(data.summary);
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
    setError(null);
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
              te parezca importante.
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
                {turn.content}
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
        <Button type="submit" size="icon" disabled={sending || !draft.trim()} aria-label="Enviar">
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
