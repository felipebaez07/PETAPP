# Registro legal — PETAPP

Registro de temas legales detectados durante el desarrollo (skill `legal-radar`). No es asesoría
legal — cada entrada nombra el tema, estima el riesgo y deja un checklist para consultar con quien
corresponda antes de resolverlo. Se agrega, nunca se sobrescribe.

---

## LG-001

- **Detectado**: 2026-09-02, construyendo el módulo de "pre-diagnóstico" con IA (chatbot donde el
  cuidador describe síntomas de su mascota y recibe un resumen estructurado para llevar al
  veterinario).
- **Área**: Responsabilidad / ejercicio de profesión regulada.
- **Riesgo**: 🟡 medio.
- **Por qué aplica**: un resumen generado por IA sobre síntomas de un animal, aunque se llame
  explícitamente "pre-diagnóstico" y no diagnóstico, puede leerse como asesoría veterinaria si no
  queda clarísimo en la interfaz (no solo en un texto legal aparte) que no reemplaza la consulta
  con un profesional. Si un cuidador confía en el resumen en vez de buscar atención real y el
  animal sufre daño, existe un riesgo de responsabilidad para PETAPP.
- **¿Bloquea?**: No bloquea construir el módulo, pero sí condiciona el copy y el flujo (el
  disclaimer no puede ser solo letra chica).
- **Antes de qué hay que resolverlo**: antes de lanzar el módulo a usuarios reales del piloto (no
  antes de construir el prototipo).
- **Checklist de qué averiguar**:
  - Si el ejercicio de la medicina veterinaria está regulado en Colombia de forma que aplique a
    una herramienta de "resumen de síntomas" (vs. diagnóstico/tratamiento real) — consultar con un
    abogado o con la autoridad veterinaria del país, no asumir.
  - Si conviene un disclaimer de aceptación explícita (checkbox) antes de cada sesión de chat, no
    solo un texto pasivo.
- **Estado**: abierto.

## LG-002

- **Detectado**: 2026-09-02, mismo contexto.
- **Área**: Protección de datos personales (Ley 1581 de 2012, ya referenciada en
  `apps/web/src/app/politica-privacidad`).
- **Riesgo**: 🟡 medio.
- **Por qué aplica**: la conversación del chat de pre-diagnóstico va a guardar descripciones
  detalladas de la situación de la mascota (y, indirectamente, del cuidador que las escribe) —
  un nivel de detalle mayor al que ya cubre la política de privacidad actual (que habla de
  perfil/documentos básicos, no de texto libre conversacional).
- **¿Bloquea?**: No.
- **Antes de qué hay que resolverlo**: antes de lanzar el módulo — la política de privacidad debe
  actualizarse para mencionar esta categoría de dato nueva antes de que usuarios reales la generen.
- **Checklist de qué averiguar**: si el borrador actual de política de privacidad (pendiente de
  revisión legal según `docs/NEXT_STEPS.md`) necesita una sección específica para "contenido de
  conversaciones con el asistente de IA".
- **Estado**: abierto.

## LG-003

- **Detectado**: 2026-09-02, mismo contexto.
- **Área**: Transferencia internacional de datos.
- **Riesgo**: 🟡 medio.
- **Por qué aplica**: el contenido de la conversación (datos de salud del animal + lo que escribe
  el cuidador) se envía a la API de Google Gemini para procesarse — un proveedor en la nube fuera
  de Colombia. La Ley 1581 tiene requisitos específicos para transferencia internacional de datos
  personales.
- **¿Bloquea?**: No bloquea construir, pero si el país de destino/garantías de Google no cumplen el
  estándar exigido, podría exigir un mecanismo adicional (cláusulas contractuales, autorización
  explícita del titular, etc.).
- **Antes de qué hay que resolverlo**: antes de lanzar el módulo a usuarios reales.
- **Checklist de qué averiguar**: si Google Gemini API cumple los requisitos de transferencia
  internacional de la Ley 1581 para el tipo de dato que se va a enviar (salud animal, no salud
  humana — puede no aplicar con el mismo rigor, pero no asumir).
- **Estado**: abierto.

## LG-004

- **Detectado**: 2026-09-02, mismo contexto.
- **Área**: Propiedad intelectual del contenido generado por IA.
- **Riesgo**: 🟢 bajo.
- **Por qué aplica**: el resumen de pre-diagnóstico exportado a PDF es contenido generado por un
  modelo de IA de un tercero (Google). Los términos de uso de la API de Gemini definen quién puede
  usar/reutilizar ese contenido.
- **¿Bloquea?**: No.
- **Antes de qué hay que resolverlo**: no urgente — revisar si se planea algo más allá de que el
  cuidador se lleve su propio PDF (ej. si PETAPP quisiera reusar ese contenido para otro fin).
- **Checklist de qué averiguar**: términos de uso de Google Gemini API sobre contenido generado.
- **Estado**: abierto.
