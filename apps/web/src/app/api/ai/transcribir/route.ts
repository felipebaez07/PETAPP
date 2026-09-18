import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { getAuthenticatedClient } from '@/lib/ai-request-auth';

/**
 * Transcribe un audio corto (voz del cuidador) a texto con Whisper de Groq, para precargar el
 * cuadro de mensaje del chat de pre-diagnóstico — nunca se auto-envía, el cuidador siempre revisa
 * y edita antes de mandar (mismo patrón "componer, revisar, enviar" del resto de la app). Esto es
 * un endpoint sin estado: el audio no se guarda en ningún lado, solo entra, se transcribe, y sale
 * el texto. Lo llaman TANTO la web (sesión por cookie) COMO la app móvil (Bearer token) —
 * `getAuthenticatedClient` (extraído de `api/ai/prediagnostico/route.ts`) protege esta llamada
 * paga de un uso anónimo indebido.
 */
const TRANSCRIPTION_MODEL = 'whisper-large-v3-turbo';

// Mismo tope que usa el resto de la app para adjuntos "pesados" (documentos, ver
// apps/web/src/lib/uploads.ts MAX_DOCUMENT_BYTES) — de sobra para una nota de voz de hasta un
// minuto (el corte de seguridad del lado del cliente), y evita abuso del endpoint.
const MAX_AUDIO_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    return NextResponse.json({ error: 'El módulo de IA todavía no está configurado.' }, { status: 503 });
  }

  const auth = await getAuthenticatedClient(request);
  if (!auth) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'No se pudo leer el audio enviado.' }, { status: 400 });
  }

  const audio = formData.get('audio');
  if (!(audio instanceof File) || audio.size === 0) {
    return NextResponse.json({ error: 'Falta el audio a transcribir.' }, { status: 400 });
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: 'La nota de voz no puede pesar más de 10MB.' }, { status: 400 });
  }

  try {
    const groq = new Groq({ apiKey: groqApiKey });
    const transcription = await groq.audio.transcriptions.create({
      file: audio,
      model: TRANSCRIPTION_MODEL,
      language: 'es',
    });
    return NextResponse.json({ text: transcription.text });
  } catch (err) {
    // eslint-disable-next-line no-console -- sin esto el error real nunca aparece en los logs de
    // Vercel (el catch lo convierte en un mensaje genérico para el usuario).
    console.error('[transcribir] Groq error:', err);
    return NextResponse.json({ error: 'No se pudo transcribir el audio. Intenta de nuevo.' }, { status: 502 });
  }
}
