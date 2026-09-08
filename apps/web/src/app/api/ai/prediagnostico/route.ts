import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/config';
import {
  aiChatMessageSchema,
  aiRoadmapInputSchema,
  todayLocalDateString,
  type AiMessage,
  type AiRoadmapItem,
  type PetSpecies,
} from '@petapp/shared';

/**
 * Backend único del módulo de pre-diagnóstico — lo llaman TANTO la web (con la sesión por
 * cookie de siempre) COMO la app móvil (que no tiene cookies de Next.js, así que manda su token
 * de sesión de Supabase por header `Authorization: Bearer <token>`). Nunca se llama a Gemini
 * desde el cliente directo — la API key vive solo acá, en el servidor.
 *
 * Ver docs/legal/registro-legal.md (LG-001 a LG-004): esto NUNCA genera un diagnóstico real, el
 * prompt de sistema lo deja explícito y el formato de respuesta lo refuerza.
 */

const MAX_TURNS_BEFORE_HINT = 8; // evita conversaciones eternas sin llegar a un resumen

async function getAuthenticatedClient(request: Request): Promise<{
  supabase: SupabaseClient;
  userId: string;
} | null> {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    // Mobile: valida el token con el cliente anon y lo reusa para las consultas siguientes,
    // que quedan autenticadas como ese usuario (RLS aplica normal, no es una service-role key).
    const token = authHeader.slice('Bearer '.length);
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return null;
    return { supabase, userId: data.user.id };
  }

  // Web: la sesión ya viene por cookie.
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { supabase, userId: data.user.id };
}

function buildSystemPrompt(pet: { name: string; species: PetSpecies; breed: string | null; birth_date: string | null }): string {
  return `Eres el asistente de pre-diagnóstico de PETAPP, una app de seguimiento preventivo veterinario. Tu único trabajo es ayudar a un cuidador a describir con claridad la situación de su mascota, para armar un resumen que él lleve a un veterinario de verdad.

REGLAS ABSOLUTAS (nunca las rompas):
- NUNCA das un diagnóstico. NUNCA dices qué enfermedad podría tener el animal. NUNCA recomiendas medicamentos, dosis, ni tratamientos de ningún tipo.
- Si algo en la descripción suena a EMERGENCIA (dificultad para respirar, sangrado abundante, convulsiones, no poder pararse, hinchazón repentina del abdomen, posible intoxicación, golpe de calor, trauma severo), tu ÚNICA respuesta es decirle que busque atención veterinaria de urgencia AHORA MISMO — no sigas haciendo preguntas de rutina.
- Si el cuidador pide directamente un diagnóstico o tratamiento, recuérdale amablemente que no puedes darlo y que es justo para eso que existe este resumen para el veterinario.

CÓMO CONVERSAR:
- Haces una o dos preguntas de seguimiento por turno (no un cuestionario largo de una vez): qué síntomas nota, desde cuándo, si ha empeorado, cómo está el apetito/la energía/la hidratación, y cualquier otro dato relevante.
- Tono cálido y claro, nunca alarmista ni frío.

DATOS YA REGISTRADOS DE LA MASCOTA (no los vuelvas a preguntar):
- Nombre: ${pet.name}
- Especie: ${pet.species}
- Raza: ${pet.breed ?? 'no registrada'}
- Fecha de nacimiento: ${pet.birth_date ?? 'no registrada'}
- Fecha de hoy: ${todayLocalDateString()}

CUÁNDO CERRAR: en cuanto sientas que ya tienes lo suficiente (normalmente entre 3 y 6 intercambios), en vez de seguir preguntando, responde ÚNICAMENTE con este formato exacto, sin nada de texto antes o después:

===RESUMEN===
[Resumen estructurado en español: síntomas reportados, desde cuándo, cómo ha evolucionado, contexto relevante de la mascota, y qué le convendría preguntar/revisar al veterinario. Termina siempre con una línea que diga explícitamente: "Este resumen no es un diagnóstico — es una guía para tu consulta veterinaria."]
===FIN===
===RUTA===
[Array JSON de 1 a 4 objetos, cada uno con esta forma exacta: {"title": "...", "type": "vacuna"|"control"|"desparasitacion"|"otro", "dias": <entero, días desde hoy>, "notes": "..."}. Son SIEMPRE próximos pasos/recordatorios (ej. "Consulta veterinaria por los síntomas reportados" con dias:0 o 1, "Control de seguimiento si no mejora" con dias:7) — NUNCA un medicamento, dosis o tratamiento. Si la situación suena urgente, el primer ítem debe ser la consulta veterinaria con dias:0. JSON válido, sin comentarios ni texto extra dentro de este bloque.]
===FIN_RUTA===

Mientras sigas conversando (no hayas llegado a ese punto), responde en texto plano normal, sin esos marcadores.`;
}

function parseRoadmap(rawJson: string): AiRoadmapItem[] | null {
  try {
    const parsed = aiRoadmapInputSchema.safeParse(JSON.parse(rawJson));
    if (!parsed.success) return null;
    const today = todayLocalDateString();
    return parsed.data.map((item) => ({
      title: item.title,
      type: item.type,
      due_date: addDaysToDateString(today, item.dias),
      notes: item.notes ?? null,
    }));
  } catch {
    return null;
  }
}

// Aritmética en UTC sobre los componentes de la fecha (nunca `new Date("Y-M-D")` a secas ni
// `toISOString()`): evita el mismo corrimiento de un día por zona horaria ya documentado en
// `todayLocalDateString` de este mismo paquete — acá no involucra hora local en ningún momento,
// solo suma días sobre una fecha que ya es un string.
function addDaysToDateString(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const result = new Date(Date.UTC(year, month - 1, day + days));
  const y = result.getUTCFullYear();
  const m = String(result.getUTCMonth() + 1).padStart(2, '0');
  const d = String(result.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function POST(request: Request) {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    return NextResponse.json({ error: 'El módulo de IA todavía no está configurado.' }, { status: 503 });
  }

  const auth = await getAuthenticatedClient(request);
  if (!auth) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  const { supabase, userId } = auth;

  const rawBody = await request.json().catch(() => null);
  const parsed = aiChatMessageSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Faltan datos.' }, { status: 400 });
  }
  const { petId, message } = parsed.data;
  let conversationId = parsed.data.conversationId ?? null;

  // La RLS de `pets` ya solo deja ver mascotas propias — este select además confirma que la
  // mascota existe y trae el contexto que va al prompt de sistema.
  const { data: pet } = await supabase
    .from('pets')
    .select('id, name, species, breed, birth_date, owner_id')
    .eq('id', petId)
    .maybeSingle();
  if (!pet || pet.owner_id !== userId) {
    return NextResponse.json({ error: 'Esta mascota no te pertenece.' }, { status: 403 });
  }

  // Conversación existente o nueva — la RLS de ai_conversations ya exige owner_id = auth.uid().
  let history: AiMessage[] = [];
  if (conversationId) {
    const { data: existing } = await supabase
      .from('ai_conversations')
      .select('id, status')
      .eq('id', conversationId)
      .eq('owner_id', userId)
      .maybeSingle();
    if (!existing) return NextResponse.json({ error: 'Conversación no encontrada.' }, { status: 404 });
    if (existing.status === 'completada') {
      return NextResponse.json({ error: 'Esta conversación ya se cerró con un resumen.' }, { status: 409 });
    }
    const { data: messages } = await supabase
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    history = (messages as AiMessage[] | null) ?? [];
  } else {
    const { data: created, error: createError } = await supabase
      .from('ai_conversations')
      .insert({ pet_id: petId, owner_id: userId })
      .select('id')
      .single();
    if (createError || !created) {
      return NextResponse.json({ error: createError?.message ?? 'No se pudo iniciar la conversación.' }, { status: 500 });
    }
    conversationId = created.id;
  }

  // Guarda el mensaje del usuario antes de llamar a Gemini — si la llamada falla, el turno del
  // usuario no se pierde (puede reintentar sin repetir lo que ya escribió).
  await supabase.from('ai_messages').insert({ conversation_id: conversationId, role: 'user', content: message });

  const ai = new GoogleGenAI({ apiKey: geminiApiKey });
  const systemPrompt = buildSystemPrompt(pet);
  const turnCountHint =
    history.length >= MAX_TURNS_BEFORE_HINT
      ? '\n\n(Ya llevas varios intercambios — si tienes información razonable, cierra ahora con el formato de resumen en vez de seguir preguntando.)'
      : '';

  const contents = [
    ...history.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
    { role: 'user', parts: [{ text: message }] },
  ];

  let replyText: string;
  try {
    const result = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: { systemInstruction: systemPrompt + turnCountHint },
    });
    replyText = result.text ?? '';
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'No se pudo contactar al asistente.' },
      { status: 502 }
    );
  }

  if (!replyText) {
    return NextResponse.json({ error: 'El asistente no devolvió una respuesta.' }, { status: 502 });
  }

  await supabase.from('ai_messages').insert({ conversation_id: conversationId, role: 'assistant', content: replyText });

  const summaryMatch = replyText.match(/===RESUMEN===([\s\S]*?)===FIN===/);
  if (summaryMatch) {
    const summary = summaryMatch[1].trim();
    const roadmapMatch = replyText.match(/===RUTA===([\s\S]*?)===FIN_RUTA===/);
    const roadmap = roadmapMatch ? parseRoadmap(roadmapMatch[1].trim()) : null;
    await supabase
      .from('ai_conversations')
      .update({ status: 'completada', summary, roadmap })
      .eq('id', conversationId);
    return NextResponse.json({ conversationId, summary, roadmap, done: true });
  }

  return NextResponse.json({ conversationId, reply: replyText, done: false });
}
