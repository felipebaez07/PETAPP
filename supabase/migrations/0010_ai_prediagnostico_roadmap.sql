-- PETAPP — Ruta de seguimiento sugerida al cerrar el chat de pre-diagnóstico (0009_ai_prediagnostico.sql).
-- Además del resumen en texto libre para el veterinario, el modelo ahora también sugiere una lista
-- corta de próximos pasos (ej. "agendar consulta", "control de seguimiento en 7 días") — nunca
-- tratamientos ni medicación, ver docs/legal/registro-legal.md (LG-001). El cuidador decide en la UI
-- si acepta cada ítem (se crea como fila real en `preventive_events`, ya existente), lo modifica antes
-- de aceptar, o solo lo deja anotado acá sin agendar nada.
--
-- Se guarda tal cual la sugirió el modelo (no lo que el cuidador termine aceptando/editando) — es un
-- registro de qué se sugirió, no el estado de las decisiones; esas decisiones viven donde siempre han
-- vivido las tareas preventivas reales: en `preventive_events`.

alter table public.ai_conversations
  add column roadmap jsonb;
