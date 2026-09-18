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

## LG-005

- **Detectado**: 2026-09-09, al cambiar el motor de IA del módulo de pre-diagnóstico de Google
  Gemini a Groq (ver `spec.md`, sección 16) y agregar la foto de síntoma en el chat.
- **Área**: Transferencia internacional de datos (continuación de LG-003) + categoría de dato
  nueva.
- **Riesgo**: 🟡 medio.
- **Por qué aplica**: LG-003 evaluaba el envío de la conversación de texto a Google Gemini. Ese
  procesador cambió a Groq (empresa con sede en EE. UU., igual que Google) — el análisis de
  transferencia internacional de LG-003 hay que rehacerlo contra el proveedor correcto, no asumir
  que lo ya escrito para Gemini aplica igual a Groq. Además, ahora también se puede enviar una
  **foto** de la mascota (posible dato de salud animal, más sensible que el texto libre que ya
  cubría LG-002) al mismo tercero para su análisis.
- **¿Bloquea?**: No bloquea construir — el módulo de foto ya está implementado —, pero sí condiciona
  el lanzamiento a usuarios reales del piloto, igual que LG-001/002/003.
- **Antes de qué hay que resolverlo**: antes de lanzar el módulo (foto incluida) a usuarios reales.
- **Checklist de qué averiguar**:
  - Si Groq cumple los requisitos de transferencia internacional de la Ley 1581 para el tipo de
    dato que se le manda (texto conversacional + ahora también imágenes).
  - Si la política de privacidad (ya pendiente de actualizar por LG-002) debe nombrar
    explícitamente "fotos enviadas al asistente de IA" como categoría de dato, no solo "texto de
    la conversación".
  - Política de retención/uso de datos de Groq sobre las imágenes que procesa (si las guarda para
    entrenar modelos, por cuánto tiempo, etc.) — no asumir que es igual a la de Google.
- **Estado**: abierto.

## LG-006

- **Detectado**: 2026-09-15, analizando el software competidor OkVet como referencia para mejorar
  el panel de establecimientos/veterinarias (módulo "Facturación y marketing" de OkVet: factura
  electrónica conectada a la DIAN, pagos bancarios, campañas de SMS/WhatsApp). Es una idea a
  futuro que salió de ese análisis — no hay nada de esto construido en PeTech todavía.
- **Área**: Pagos / facturación electrónica / tributario + marketing por WhatsApp.
- **Riesgo**: 🔴 alto (si se construye).
- **Por qué aplica**: en Colombia, la facturación electrónica ante la DIAN tiene requisitos
  técnicos y de habilitación específicos (no es simplemente generar un PDF) — es el tipo de
  decisión estructural (a nombre de quién factura, quién es responsable tributario frente a la
  DIAN: ¿PeTech como intermediario, o cada establecimiento directamente?) que hay que resolver
  antes de construir encima, no después. Además, cobrar con pasarela de pagos añade requisitos de
  seguridad/PCI y de a quién pertenece el dinero que entra. Las campañas de WhatsApp/SMS
  segmentadas caen bajo habeas data/antispam (consentimiento del propietario para recibir
  marketing, no solo notificaciones transaccionales).
- **¿Bloquea?**: No bloquea nada hoy — no se ha construido nada de este módulo. Si más adelante se
  decide construirlo, sí bloquea empezar sin antes resolver quién factura y dónde vive el dinero.
- **Antes de qué hay que resolverlo**: antes de escribir cualquier código de facturación
  electrónica o de integración con una pasarela de pagos — es de las primeras preguntas a resolver
  en esa conversación, no algo para decidir a medio camino.
- **Checklist de qué averiguar**:
  - Si PeTech facturaría en nombre propio (intermediario) o si cada establecimiento se habilita
    como facturador electrónico independiente ante la DIAN.
  - Requisitos de habilitación de facturación electrónica de la DIAN para el modelo que se elija.
  - Si una pasarela de pagos (ej. Wompi, PayU, Mercado Pago) ya resuelve el aspecto tributario/PCI,
    o si hace falta contratar aparte.
  - Consentimiento explícito y opt-out para marketing por WhatsApp/SMS (distinto del consentimiento
    ya necesario para notificaciones transaccionales como recordatorios de citas).
- **Estado**: abierto.

## LG-007

- **Detectado**: 2026-09-17, diseñando (todavía no construido, solo propuesta) un módulo de
  teleconsulta veterinaria por videollamada — incluye la posibilidad de generar fórmulas/recetas
  (0019_clinical_documents.sql, ya existe) desde una consulta remota, sin examen físico presencial.
- **Área**: Ejercicio de profesión regulada / telemedicina veterinaria.
- **Riesgo**: 🟡 medio (si se construye).
- **Por qué aplica**: la medicina veterinaria es una profesión regulada — algunos actos (sobre todo
  prescribir ciertos medicamentos, o procedimientos que exigen examen físico directo) pueden tener
  restricciones sobre si se pueden realizar/autorizar de forma remota. No es lo mismo una
  teleconsulta de orientación/seguimiento que una que termine en una fórmula médica sin haber
  revisado físicamente al paciente.
- **¿Bloquea?**: No bloquea nada hoy — es solo una propuesta de diseño, nada construido. Si se
  decide avanzar, sí condiciona qué se puede ofrecer por teleconsulta (ej. ¿solo orientación/
  seguimiento, o también fórmulas?) antes de habilitarlo.
- **Antes de qué hay que resolverlo**: antes de permitir que una teleconsulta genere una fórmula/
  receta sin una consulta presencial previa registrada para ese mismo caso.
- **Checklist de qué averiguar**:
  - Si el ejercicio de la medicina veterinaria en Colombia distingue (como sí hacen varias
    regulaciones de telemedicina humana) entre consulta remota de orientación/seguimiento vs. la
    que habilita prescribir sin examen físico previo.
  - Si existe algún gremio o entidad veterinaria colombiana con una postura pública sobre
    telemedicina veterinaria a la que consultar directamente.
- **Estado**: abierto.

## LG-008

- **Detectado**: 2026-09-17, especificación formal del usuario para "recordatorios automáticos de
  servicios recurrentes" (baño, spa, corte de pelo/uñas, limpieza dental) + "jornadas y campañas"
  del prestador Pro. Todavía no construido — es la fase de modelo de datos, antes de escribir
  código. Refina/precisa LG-006 (que ya cubría marketing por WhatsApp/SMS en términos generales)
  con una distinción legal concreta que el propio usuario aportó, citando la Ley 1581 de 2012.
- **Área**: Habeas data / consentimiento — distinción entre continuidad del servicio y comunicación
  comercial.
- **Riesgo**: 🟡 medio.
- **Por qué aplica**: según el propio usuario, un recordatorio del servicio de la mascota en su
  propia veterinaria (ej. "tu perro cumple 6 semanas desde el último baño acá") es continuidad de
  un servicio ya contratado, pero una campaña dirigida (ej. "jornada de vacunación este sábado") es
  comunicación comercial y exige autorización previa, expresa y separada, con opción de retiro —
  dos consentimientos distintos, no uno solo, cada uno con su propio registro de cuándo y cómo se
  otorgó o revocó.
- **¿Bloquea?**: No bloquea nada hoy — nada construido todavía. Si se avanza, sí condiciona el
  diseño desde el modelo de datos (no se puede agregar el consentimiento comercial "después", tiene
  que existir antes de que la primera campaña pueda enviarse).
- **Antes de qué hay que resolverlo**: antes de que cualquier campaña real le llegue a un cuidador
  — la campaña debe excluir automáticamente a quien no tenga el consentimiento comercial vigente
  (regla explícita del propio usuario, ya incorporada al diseño propuesto).
- **Checklist de qué averiguar**:
  - Si el mecanismo técnico propuesto (registro append-only de otorgamiento/revocación por tipo de
    consentimiento) cumple el estándar de "autorización previa, expresa e informada" que exige la
    Ley 1581 — esto lo debería confirmar alguien con conocimiento legal real, no solo el diseño
    técnico.
  - Si el consentimiento de "recordatorios de servicio" puede asumirse por defecto (continuidad del
    servicio) o si igual requiere algún tipo de aviso al momento del registro, aunque no requiera
    autorización expresa separada.
- **Estado**: abierto.

## LG-009

- **Detectado**: 2026-09-18, el usuario pidió publicar una página pública `/planes` con precios
  reales en pesos colombianos (Camada $79.000/mes, Manada $149.000/mes) y su lista de features.
- **Área**: Protección al consumidor / información de precios; publicidad de features no
  construidas.
- **Riesgo**: 🟡 medio.
- **Por qué aplica**: (1) mostrar un precio público en Colombia normalmente exige que sea el precio
  final que el cliente paga (impuestos incluidos si aplican) y no puede ser engañoso — no se sabe
  todavía si $79.000/$149.000 ya incluyen IVA u otros cargos. (2) el feature Pro "una jornada o
  campaña al mes" se anuncia como si ya funcionara, pero el motor de envío de campañas (Paso 5 del
  módulo de recordatorios/campañas, ver spec.md sección 30) **todavía no está construido** — solo
  existe el modelo de datos. Publicitar una función que no funciona hoy es el riesgo concreto,
  independiente de cualquier norma puntual.
- **¿Bloquea?**: No bloquea publicar la página — no es 🔴 estructural. Sí condiciona el texto: la
  página no debería prometer "una campaña al mes" en presente si todavía no se puede usar.
- **Antes de qué hay que resolverlo**: antes de que un prestador real pague el plan Pro esperando
  poder crear una campaña y no pueda.
- **Checklist de qué averiguar**:
  - Si $79.000/$149.000 son precios finales (con IVA si aplica) o antes de impuestos — quién lo
    confirma con contabilidad/quien maneje lo tributario.
  - Si conviene marcar el feature de campañas como "próximamente" en la página pública hasta que el
    Paso 5 esté construido, o si se prioriza construirlo antes de publicar la página.
- **Estado**: abierto.
