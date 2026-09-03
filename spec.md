# PETAPP — Spec viva del rework (seguimiento preventivo + directorio veterinario)

> **Cómo usar este documento:** es la guía única de lo que se está construyendo. Cada tarea nueva que
> surja se agrega en la sección de su fase con `- [ ]`. Cuando se termina y se verifica, se marca
> `- [x]` y se le agrega una nota corta `(hecho: <fecha>, <commit o archivo clave>)`. No se borran
> tareas completadas — quedan como historial de qué se decidió y cuándo. Si una tarea se descarta,
> se dice explícitamente por qué (`descartado: ...`) en vez de borrarla.
>
> Última actualización: 2026-09-02.

## 0. Por qué existe este documento

El 2026-09-01 se recibió el documento de negocio `PETAPP: plataforma nacional de seguimiento
preventivo y acceso a servicios veterinarios` (Torres, Barrios, Báez — propuesta a la Ing. Sindy
Vergara). Ese documento **redefine el producto** respecto a lo que había en el repo hasta el commit
`8382ec8`: pasa de un marketplace/directorio/foro/adopciones genérico a una plataforma enfocada
exclusivamente en:

1. Perfil de mascota.
2. Calendario preventivo (vacunas, controles, desparasitación).
3. Recordatorios.
4. Documentos básicos (soportes).
5. Directorio de prestadores veterinarios **verificados**.
6. Solicitud de cita (B2B2C: gratis para el cuidador, suscripción para el prestador).

Decisión confirmada con el usuario (2026-09-01): **reemplazo completo**, no adición. Marketplace,
tienda, foro y adopciones salen del alcance del producto. El código de esas features no se borra de
la historia de git (queda recuperable), pero se retira de la navegación, del schema activo y de la
UI de ambas apps.

Fuente de verdad de negocio: `petappxd.pdf` (aportado por el usuario, no versionado en el repo —
considerar copiarlo a `docs/` si se quiere referenciar más adelante). Fuente de verdad de diseño:
`design-system/petapp/MASTER.md` (paleta azul clínico + menta, tipografía Lexend/Source Sans 3 —
**se conserva sin cambios**, ya encaja con el posicionamiento clínico/confiable del nuevo enfoque).

## 1. Qué se mantiene tal cual

- Nombre de marca: se fija como **PETAPP** (mayúsculas, ya no "provisional") — `APP_NAME` en
  `packages/shared/src/constants.ts`.
- Design system completo (`design-system/petapp/MASTER.md`): colores, tipografía, radios, sombras,
  anti-patrones. No hay motivo de negocio para cambiarlo; el documento nuevo pide "profesional,
  clínico, riguroso", que es exactamente la categoría "Trust & Authority" ya definida.
- Stack: Next.js 16 (web) + Expo Router (mobile) + Supabase + `@petapp/shared`. No se cambia de
  stack, solo de alcance de producto.
- Autenticación (email/password + Google en web), `profiles` con roles `propietario` /
  `establecimiento` / `admin` — el modelo de roles ya sirve para B2B2C (cuidador vs. prestador).
- `pets`, `establishments`, `establishment_hours`, `services` — se conservan como base y se
  reutilizan/extienden (ver sección 3).

## 2. Qué sale del alcance (se retira, no se borra del historial)

| Feature vieja | Tablas | Rutas web | Pantallas mobile |
|---|---|---|---|
| Marketplace / tienda | `products` | `/marketplace`, `/panel/tienda` | `mi-tienda.tsx`, tab "Comunidad" (parte productos) |
| Foro / muro de anuncios | `forum_posts` | `/foro`, `/panel/foro` | `mi-foro.tsx`, tab "Comunidad" (parte foro) |
| Adopciones | `adoption_posts`, `adoption_photos`, `adoption_interests` | `/adopciones`, `/adopciones/[id]`, `/panel/(dashboard)/adopciones` | `(tabs)/adopciones.tsx`, `adopciones/[id].tsx`, `negocio-adopciones.tsx` |
| Establecimientos no veterinarios (comercio/fundación) | filas de `establishments` con `category in ('comercio','fundacion')` | — | — |

Regla de decisión: si el documento de negocio no lo nombra como una de las 6 funciones del MVP
(sección 0) o como parte del flujo B2B2C alrededor de ellas, no entra en el alcance actual.
Los centros de adopción (CAPA) se mantienen **solo como referencia informativa** (ubicación,
requisitos, contacto) dentro de la ficha del directorio si aplica — no como operación propia.

## 3. Modelo de datos — plan de migración

Migración nueva: `supabase/migrations/0005_pivot_preventivo.sql`.

- [x] Deprecar marketplace/foro/adopciones — revisado con la skill `db-guardian`: como no se pudo confirmar el conteo de filas del proyecto Supabase remoto desde este entorno, se aplicó **expand/contract** en vez de `DROP` directo: `alter table ... rename to zz_deprecated_<tabla>_20260901` para `products`, `forum_posts`, `adoption_posts`, `adoption_photos`, `adoption_interests`. Cero pérdida de datos, reversible con un rename de vuelta (hecho: 2026-09-01, `0005_pivot_preventivo.sql`)
- [ ] **Fase "contract" pendiente**: una vez confirmado que no hace falta nada de esas tablas (o tras exportarlas si se quiere conservar histórico), escribir `0006_drop_deprecated.sql` con el `DROP TABLE`/`DROP TYPE` real. No antes de al menos un ciclo de backup/confirmación del usuario.
- [x] Ocultar (no borrar) establecimientos `comercio`/`fundacion` existentes: `update establishments set is_active = false where category in ('comercio','fundacion')` — reversible, conserva datos del seed de Ibagué (hecho: 2026-09-01)
- [x] Renombrar `reservations` → `service_requests` (`alter table ... rename to`) para que el nombre respete el lenguaje del negocio ("solicitud de cita") — **debe aplicarse junto con el despliegue del código que ya usa `service_requests`**, no antes, porque el código viejo en producción todavía hace `.from('reservations')` (hecho: 2026-09-01)
- [x] Nueva tabla `preventive_events` (calendario preventivo): `pet_id`, `type` (`vacuna`/`control`/`desparasitacion`/`otro`), `title`, `due_date`, `completed_at`, `reminder_sent_at`, `notes` + RLS por dueño de mascota (hecho: 2026-09-01)
- [x] Nueva tabla `pet_documents` (documentos/soportes básicos): `pet_id`, `title`, `document_url`, `document_type` + RLS por dueño de mascota (hecho: 2026-09-01)
- [x] Nueva tabla `provider_plans` (plan B2B del prestador): `establishment_id`, `plan_code` (`basico`/`pro`), `status` (`prueba`/`activa`/`pausada`/`cancelada`), trigger que impide que el propio prestador se auto-active el plan (mismo patrón que `prevent_establishment_self_verification`) (hecho: 2026-09-01)
- [x] Aplicar `0005_pivot_preventivo.sql` sobre el proyecto Supabase real (`nnsjospqprfygmxnlszb`) — aplicada manualmente por el usuario vía SQL Editor (hecho: 2026-09-01). En el primer intento falló el paso 2 (`establishments_prevent_self_verification` bloqueaba el `UPDATE` porque el SQL Editor no tiene `auth.uid()`); se corrigió desactivando el trigger puntualmente para ese `UPDATE` (commit `1f55f99`) y se re-corrió el archivo completo con éxito.
- [ ] Regenerar tipos con `generate_typescript_types` (o mantener el mapeo manual en `packages/shared/src/types.ts`, que ya se actualizó a mano) — pendiente, opcional mientras el mapeo manual siga sincronizado.
- [ ] Conectar las variables de entorno reales (`NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`) en el deploy de Vercel — ya es seguro hacerlo, el esquema remoto ya tiene `service_requests`/`preventive_events`/`pet_documents`/`provider_plans`.

## 4. Paquete compartido (`packages/shared`)

- [x] `types.ts`: quitar tipos de `Product`, `ForumPost`, `AdoptionPost`/`AdoptionPhoto`/`AdoptionInterest`; renombrar `Reservation` → `ServiceRequest`; agregar `PreventiveEvent`, `PetDocument`, `ProviderPlan` (hecho: 2026-09-01)
- [x] `constants.ts`: `APP_NAME = 'PETAPP'`, nuevo `APP_TAGLINE` alineado al problema central del árbol de problemas ("Seguimiento preventivo, documentos y prestadores verificados en un solo lugar"), labels nuevos para tipo de evento preventivo, tipo de documento y plan de prestador; se quitan labels de producto/foro/adopción (hecho: 2026-09-01)
- [x] `schemas.ts` (zod): esquemas nuevos `preventiveEventSchema`, `petDocumentSchema`, `serviceRequestSchema` (ex-reservationSchema), `providerPlanSchema`; se retiran los de producto/foro/adopción (hecho: 2026-09-01)
- [x] `demoData.ts`: reemplazar `DEMO_PRODUCTS`/`DEMO_FORUM_POSTS`/`DEMO_ADOPTION_POSTS` por `DEMO_PREVENTIVE_EVENTS`, `DEMO_PET_DOCUMENTS`; `DEMO_ESTABLISHMENTS` filtrado a veterinaria/profesional (hecho: 2026-09-01)
- [x] `whatsapp.ts`: adaptar el mensaje prellenado de "reserva" a "solicitud de cita" (hecho: 2026-09-01)

## 5. Rediseño Web (`apps/web`)

IA nueva del sitio público:

```
/                     Home: propuesta de valor preventiva + CTA cuidador + CTA prestador (piloto Ibagué)
/directorio           (antes /establecimientos, listado) — solo veterinaria/profesional, verificados primero
/directorio/[slug]    Ficha del prestador: horarios, servicios, botón "Solicitar cita"
/unete                Formulario "¿Eres un prestador veterinario? Únete al piloto" (se mantiene, copy actualizado)
/politica-privacidad, /terminos   Se mantienen
```

Panel SaaS del prestador (`/panel/(dashboard)`):

```
/panel/(dashboard)/                Resumen: solicitudes pendientes, próximos vencimientos reportados por cuidadores
/panel/(dashboard)/perfil          Igual que hoy (datos del prestador)
/panel/(dashboard)/horarios        Igual que hoy
/panel/(dashboard)/servicios       Igual que hoy
/panel/(dashboard)/solicitudes     (antes /reservas) — solicitudes de cita de cuidadores
/panel/(dashboard)/plan            NUEVO — plan actual (básico/pro), estado, cómo pasar a pago (manual en piloto)
/panel/(dashboard)/admin/aliados       Igual que hoy, pero solo prestadores veterinaria/profesional
/panel/(dashboard)/admin/solicitudes   Igual que hoy
```

Vista de cuidador en web (nueva — hoy el cuidador solo tenía "reservar", no gestión de mascota):

```
/cuidador/mascotas            Lista de mascotas propias (crear/editar)
/cuidador/mascotas/[id]       Ficha: datos + calendario preventivo + documentos
```

Tareas:

- [x] Quitar del navbar público (`components/site/navbar.tsx`) los links a `/marketplace`, `/foro`, `/adopciones`; agregar `/directorio` como link principal (hecho: 2026-09-01, `components/site/navbar.tsx`, `components/site/footer.tsx` — navbar ahora usa el material translúcido del addendum de motion en vez del `bg-card/95` plano anterior, y muestra "Mis mascotas" solo a usuarios con rol `propietario`)
- [x] Borrar rutas: `app/marketplace/`, `app/foro/`, `app/adopciones/`, `app/panel/(dashboard)/tienda/`, `app/panel/(dashboard)/foro/`, `app/panel/(dashboard)/adopciones/` y sus componentes (`components/marketplace/`, `components/foro/`, `components/adopciones/`) (hecho: 2026-09-01, borrado con `git rm -r` — queda recuperable del historial; también se borraron `components/panel/product-form.tsx`, `product-row.tsx`, `forum-post-form.tsx`, `forum-post-row.tsx` por ser exclusivos de esas pantallas)
- [x] Renombrar `app/establecimientos/` → `app/directorio/` (rutas y referencias internas); filtrar por `category in ('veterinaria','profesional')` (hecho: 2026-09-01, `app/directorio/page.tsx`, `app/directorio/[slug]/{page.tsx,actions.ts}`, `lib/data.ts`, `components/directorio/{filter-bar,establishment-card}.tsx` — el `git mv` de directorios falló por un lock de un proceso `next dev` activo en Windows, así que se recreó el contenido en la ruta nueva y se borró la vieja con `git rm -r`; también se filtró `admin/aliados` a las mismas dos categorías)
- [x] Renombrar `app/panel/(dashboard)/reservas/` → `app/panel/(dashboard)/solicitudes/`, adaptar a `service_requests` (hecho: 2026-09-01, `app/panel/(dashboard)/solicitudes/{page.tsx,actions.ts}`; el formulario de solicitud del directorio se renombró a `components/directorio/service-request-form.tsx` y ahora deja elegir una de las mascotas propias del cuidador, no solo el servicio)
- [x] Nueva página `app/panel/(dashboard)/plan/page.tsx` + `actions.ts` (leer/crear `provider_plans`) (hecho: 2026-09-01, `app/panel/(dashboard)/plan/{page.tsx,actions.ts}`, `components/panel/plan-form.tsx` — la acción nunca envía `status`/`activated_at`/`activated_by`, solo `plan_code`/`notes`, respetando el trigger `prevent_provider_plan_self_activation` sin necesidad de bordearlo)
- [x] Nuevas rutas `app/cuidador/mascotas/page.tsx` y `app/cuidador/mascotas/[id]/page.tsx` con formularios de mascota, calendario preventivo (CRUD `preventive_events`) y documentos (hecho: 2026-09-01, `app/cuidador/{layout.tsx,mascotas/page.tsx,mascotas/actions.ts,mascotas/[id]/page.tsx,mascotas/[id]/actions.ts}`, componentes en `components/cuidador/*` — documentos usan `document_url` como input de URL/enlace, **no hay subida de archivos real todavía** (queda explícito en el formulario y en backlog, sección 9); descartado explícitamente usar Supabase Storage en esta pasada por alcance/tiempo)
- [x] Reescribir copy de `app/page.tsx` (home) siguiendo el problema/solución/perfil del documento (hecho: 2026-09-01, `app/page.tsx` — hero con doble CTA, problema, 5 pasos del customer journey, para cuidadores, para prestadores, piloto Ibagué con las 3 cifras citadas)
- [x] Actualizar `app/politica-privacidad` y `app/terminos` para reflejar que se maneja información de salud animal y documentos (no comercio) (hecho: 2026-09-01, ajuste de copy únicamente, sin tocar la estructura legal ni agregar cláusulas nuevas)
- [x] `npm run typecheck` en verde después de los cambios (hecho: 2026-09-01 — `apps/web` y `packages/shared` en verde; `apps/mobile` falla con 2 errores preexistentes de tipado de rutas en `app/(tabs)/index.tsx` y `components/PetCard.tsx` (`` `/mascotas/${string}` `` no asignable a las rutas tipadas de Expo Router) que no se tocaron por estar fuera de este alcance — ver backlog sección 9)

Motion: todas las pantallas nuevas usan los springs literales del addendum de MASTER.md vía
`lib/motion.ts` (`SPRING_DEFAULT`/`SPRING_SHEET`/`SPRING_GESTURE`) y `components/motion/{reveal-item,fade-in-section}.tsx`,
con fallback a cross-fade en `prefers-reduced-motion` (`useReducedMotion` de la librería `motion`,
agregada como dependencia nueva de `apps/web`). El check de "vacuna completada" en
`components/cuidador/preventive-event-row.tsx` usa `SPRING_GESTURE` (bounce leve) como micro-delight,
tal como pide el addendum.

Pendiente honesto de esta pasada (no se alcanzó a hacer, no se maquilla):

- [ ] El resumen del panel del prestador (`/panel/(dashboard)`) NO muestra "próximos vencimientos
  reportados por cuidadores" como describía la IA original de esta sección — la policy RLS de
  `preventive_events` (0005_pivot_preventivo.sql) solo da acceso al dueño de la mascota o a un admin,
  sin ninguna relación que exponga esos datos a un prestador. Mostrarlo requeriría una migración nueva
  (p. ej. una policy que dé lectura al prestador solo para mascotas con una `service_request` confirmada
  con él) — se dejó como placeholder honesto en la UI en vez de bordear RLS con un query con más
  privilegios. Ver tarea nueva en sección 9.
- [ ] No se tocó `apps/mobile` (fuera de alcance de esta tarea) — sus 2 errores de typecheck
  preexistentes (rutas `/mascotas/[id]` sin tipar en Expo Router) siguen pendientes.

## 6. Rediseño Mobile (`apps/mobile`)

Tabs nuevos (`app/(tabs)/_layout.tsx`):

```
Inicio      (antes index) — resumen: próximos vencimientos, accesos rápidos
Mascotas    (se mantiene, se le agrega el calendario preventivo y documentos por mascota)
Directorio  (antes "Comunidad", ahora solo prestadores veterinarios verificados)
Perfil      (se mantiene)
```

Tareas:

- [x] Borrar `app/(tabs)/adopciones.tsx`, `app/adopciones/[id].tsx`, `app/mi-tienda.tsx`, `app/mi-foro.tsx`, `app/negocio-adopciones.tsx`, `components/AdoptionCard.tsx`, `components/ProductCard.tsx`, `components/ForumPostCard.tsx` (hecho: 2026-09-01)
- [x] Renombrar `app/(tabs)/comunidad.tsx` → `app/(tabs)/directorio.tsx`; reutiliza `EstablishmentCard.tsx` filtrando veterinaria/profesional, con chip "Verificados" y verificados primero en el orden (hecho: 2026-09-01, `app/(tabs)/directorio.tsx`)
- [x] Renombrar `app/negocio-reservas.tsx` → `app/negocio-solicitudes.tsx`, adaptado a `service_requests` (hecho: 2026-09-01, `app/negocio-solicitudes.tsx`)
- [x] Nueva pantalla `app/negocio-plan.tsx`: el dueño elige `plan_code`/deja `notes`, nunca envía `status`/`activated_*` — respeta el trigger `prevent_provider_plan_self_activation` (hecho: 2026-09-01, `app/negocio-plan.tsx`)
- [x] Nueva pantalla `app/mascotas/[id].tsx`: ficha con datos de la mascota + calendario preventivo (CRUD `preventive_events`, estados próximo/vencido/completado) + documentos (CRUD `pet_documents`, `document_url` como texto/URL) (hecho: 2026-09-01, `app/mascotas/[id].tsx`)
- [x] Nuevos componentes `components/PreventiveEventRow.tsx`, `components/PetDocumentRow.tsx` (hecho: 2026-09-01)
- [x] Actualizar `app/(tabs)/index.tsx` (Inicio) para mostrar próximos vencimientos preventivos cruzando todas las mascotas del usuario, ordenados por fecha, con badge de vencidos y accesos rápidos — es la pantalla con más protagonismo visual del "momento decisivo" (hecho: 2026-09-01, `app/(tabs)/index.tsx`)
- [x] Tabs nuevos `app/(tabs)/_layout.tsx`: Inicio/Mascotas/Directorio/Perfil (hecho: 2026-09-01)
- [x] `app/(tabs)/mascotas.tsx`: cada `PetCard` navega a `mascotas/[id]` (hecho: 2026-09-01, `components/PetCard.tsx`)
- [x] Revisado `lib/labels.ts` y `contexts/PetsContext.tsx`: ninguno de los dos referenciaba tipos retirados (`Product`/`ForumPost`/`AdoptionPost`/`Reservation`), no requirieron cambios (hecho: 2026-09-01)
- [x] Adicional no listado originalmente pero necesario para que compile: reescrito `lib/data.ts` (quitó `fetchProducts`/`fetchForumPosts`/`fetchAdoptionPosts*`, agregó `fetchPreventiveEventsByPet`, `fetchPreventiveEventsForPets`, `fetchPetDocumentsByPet`, filtró `fetchEstablishments` a veterinaria/profesional); actualizado `app/establecimiento/[id].tsx` (quitó sección de productos y `buildProductInquiryWhatsAppLink`, renombró el flujo de "reserva" a "solicitud de cita" contra `service_requests`); actualizado `app/_layout.tsx` (Stack screens) y `app/(tabs)/perfil.tsx` (enlaces del panel de negocio) (hecho: 2026-09-01)
- [x] `npm run typecheck` en verde en las 3 workspaces (`apps/web`, `apps/mobile`, `packages/shared`) después de los cambios (hecho: 2026-09-01)

### 6.1 Ronda de pulido/funcionalidad nueva (solo mobile, pedido 2026-09-01)

Cinco pedidos concretos del dueño del proyecto, solo para `apps/mobile` (y `packages/shared`
donde hizo falta un campo opcional aditivo). No requirió ninguna migración nueva — todo tenía
soporte en `0001_init.sql`/`0005_pivot_preventivo.sql` ya aplicadas.

- [x] **Selector de fecha real** para `due_date` del calendario preventivo, en vez de texto libre
  "AAAA-MM-DD". Nuevo componente `components/ui/DatePickerField.tsx` (nativo, con
  `@react-native-community/datetimepicker` instalado vía `npx expo install`, mismo shape de props
  que `FormTextField`/`ChipSelectField`) + `components/ui/DatePickerField.web.tsx` (variante web con
  `<input type="date">`, resuelta automáticamente por Metro en `expo export --platform web` gracias
  a la extensión `.web.tsx` — no hizo falta ningún `Platform.select` en el sitio de uso). Usado en
  `app/mascotas/[id].tsx` (hecho: 2026-09-01, `components/ui/DatePickerField.{tsx,web.tsx}`,
  `app/mascotas/[id].tsx`). Verificado con `npx expo export --platform web` (19 rutas, sin errores).
- [x] **Historial del cuidador por mascota**: `app/mascotas/[id].tsx` ahora separa el calendario
  preventivo en dos secciones — "Pendientes" (próximo/vencido, orden por fecha más cercana) e
  "Historial" (`completed_at` no nulo, más recientes primero) — en vez de una sola lista mezclada.
  Mismo patrón de animación existente (`FadeInDown.springify().damping(26).stiffness(220)`, stagger
  de 35ms, tope de 8 filas por sección) (hecho: 2026-09-01, `app/mascotas/[id].tsx`).
- [x] **Agenda del prestador**: nueva tab "Agenda" (`app/(tabs)/agenda.tsx`, renombrada desde
  `app/negocio-solicitudes.tsx`) con una sección "Próximas citas confirmadas" que agrupa por día
  las `service_requests` con `status='confirmada'` y `preferred_datetime` no nulo (más próximas
  primero), mostrando hora, cuidador, mascota y servicio por fila; debajo se conserva la lista
  completa de solicitudes tal como estaba (con los chips de cambio de estado) (hecho: 2026-09-01,
  `app/(tabs)/agenda.tsx`, helpers `formatAgendaDateHeader`/`formatAgendaTime`/`formatAgendaDateTime`
  en `lib/labels.ts`).
- [x] **Dos interfaces separadas (cuidador vs. empresa)**: `app/(tabs)/_layout.tsx` lee el rol con
  `getCurrentUser()` y oculta/muestra tabs con `href: null` (patrón documentado de Expo Router para
  tabs condicionales, sin desmontar rutas) — cuidador/sin sesión ve Inicio/Mascotas/Directorio/Perfil,
  empresa ve Inicio/Agenda/Directorio/Perfil. "Inicio" se ramifica dentro del mismo
  `app/(tabs)/index.tsx` en `CuidadorHomeScreen` (el dashboard de siempre) y `BusinessHomeScreen`
  (nuevo: conteo de solicitudes pendientes, próxima cita confirmada, accesos rápidos a Perfil del
  negocio/Horarios/Servicios/Plan) — nunca se mezclan (hecho: 2026-09-01, `app/(tabs)/_layout.tsx`,
  `app/(tabs)/index.tsx`). Se quitó el link redundante "Solicitudes de cita" del panel de
  `app/(tabs)/perfil.tsx` porque ahora es la tab "Agenda" directamente.
- [x] **Personalización de marca del negocio**: `establishmentProfileSchema`
  (`packages/shared/src/schemas.ts`) extendido con `logo_url`/`cover_image_url`, opcionales,
  restringidos a `http(s)://` con el mismo patrón de seguridad de `petDocumentSchema.document_url`
  (evita XSS vía esquema `javascript:` al renderizarse como `<Image>`) — aditivo, no rompe
  `apps/web` (confirmado con `npm run typecheck`, las 3 workspaces en verde). Nuevo componente
  `components/ui/RemoteImage.tsx` (imagen remota con fallback a ícono Lucide si no hay URL o si
  falla la carga). Campos "Logo (URL)" y "Foto de portada (URL)" con vista previa agregados a
  `app/negocio-perfil.tsx`; logo reflejado en `components/EstablishmentCard.tsx` (tarjeta del
  directorio) y en `app/establecimiento/[id].tsx` (ficha pública, además de un banner opcional con
  `cover_image_url` si existe) (hecho: 2026-09-01).

Pendiente honesto de esta ronda (no se alcanzó a hacer, no se maquilla):

- [x] (2026-09-01) La agenda del prestador dependía de que `service_requests.preferred_datetime`
  tuviera un valor, y ningún formulario lo pedía. Resuelto: `app/establecimiento/[id].tsx` ahora
  incluye "Fecha y hora preferida (opcional)" con `DatePickerField` en `mode="datetime"` (ISO
  completo, no solo fecha) y lo manda en el `insert` de `service_requests`. `DatePickerField` ganó
  soporte para `mode="datetime"` en las tres plataformas (iOS: control inline nativo; Android: dos
  pasos encadenados fecha→hora, porque el picker nativo no combina ambos en un solo diálogo; web:
  `<input type="datetime-local">` con conversión explícita a hora local). De paso se corrigió un bug
  de zona horaria en el agrupado por día de la agenda (usaba `.slice(0,10)` sobre el ISO en UTC, que
  en Colombia -UTC-5- corría al día siguiente cualquier cita entre las 7pm y medianoche local; nuevo
  helper `localDateKey()` en `lib/labels.ts`) (hecho: 2026-09-01, commit `b110c61`).
- [ ] (2026-09-01) El picker nativo de fecha en iOS usa `display="inline"` con un botón "Listo" para
  cerrarlo (el modo `"default"` de iOS no es un modal flotante fuera de un `Modal` propio) — no se
  probó en un dispositivo/simulador iOS real dentro de esta tarea (solo se verificó que compila y
  que el export web sigue funcionando); revisar la UX exacta la primera vez que se corra en iOS.
- [ ] (2026-09-01) La subida real de logo/portada de archivo (no URL) sigue pendiente, igual que la
  de `pet_documents` — mismo criterio ya anotado en el resto del backlog (sección 9): evaluar
  Supabase Storage con policies por dueño del establecimiento.
- [ ] (2026-09-01) El resumen de negocio (`BusinessHomeScreen` en `app/(tabs)/index.tsx`) no se
  probó contra el proyecto Supabase real con datos de `service_requests` confirmadas — se verificó
  que compila y que el flujo de demo/sin-sesión sigue cayendo al dashboard de cuidador, pero no hubo
  forma de correr la app en un dispositivo/emulador dentro de este entorno para confirmar
  visualmente las dos tarjetas de resumen contra datos reales.

### 6.2 Auditoría de consistencia visual/UX de mobile (2026-09-02)

Auditoría completa de `apps/mobile/app/` contra el checklist de `design-system/petapp/MASTER.md`
(iconografía, estados vacíos/carga/error, motion, feedback táctil, accesibilidad, badges, paridad
con web) más verificación con lectura de código de los cinco cambios recientes descritos al usuario.
Se corrigió todo lo que se encontró mal en vez de solo reportarlo.

**Bug real encontrado y corregido (no solo de estilo):** `app/negocio-horarios.tsx` se quedaba
colgado en el spinner de carga para siempre si la cuenta no era de negocio — el guard
`establishment === undefined || days.length === 0` nunca deja de ser cierto en ese caso porque
`days` solo se llena dentro del `if (user?.establishment)`, así que la rama "Solo para cuentas de
negocio" nunca se alcanzaba. Corregido separando los tres guards (`establishment === undefined` →
cargando cuenta; `establishment === null` → empty state; `days.length === 0` → cargando horarios,
ya con `establishment` resuelto) (hecho: 2026-09-02, `app/negocio-horarios.tsx`).

**Estados de error silenciosos corregidos** (fetch que fallaba y caía a "no tienes cuenta de
negocio" o a datos de demo en vez de avisar, mismo antipatrón ya corregido una vez en la sección
8.3 y reintroducido en estos puntos): se agregó `Alert.alert('No se pudo cargar tu cuenta',
'Intenta de nuevo en unos segundos.')` en el `.catch()` de `getCurrentUser()` de
`app/(tabs)/agenda.tsx`, `app/negocio-horarios.tsx`, `app/negocio-servicios.tsx`,
`app/negocio-perfil.tsx` y `app/negocio-plan.tsx`. También `contexts/PetsContext.tsx` no tenía
ningún `.catch()` en la carga de `pets` — un error de red dejaba al propietario viendo las
mascotas de demo (`Max`/`Mishi`) en silencio en vez de las suyas; se agregó manejo de `error` y
`.catch()` con el mismo aviso (hecho: 2026-09-02).

**Consistencia de badges corregida:** `components/EstablishmentCard.tsx` reinventaba el badge de
"Verificado" con un `<View>`+`<Text>` suelto en vez de usar `components/ui/Badge.tsx`, mientras que
`app/establecimiento/[id].tsx` (la ficha del mismo establecimiento) sí usaba `Badge` — dos
implementaciones visuales distintas para el mismo estado. `components/PreventiveEventRow.tsx`
tenía el mismo problema con el estado próximo/vencido/completado (punto de color + texto suelto en
vez de `Badge`). Ambos ahora usan `Badge` con los tonos ya definidos (`success`/`secondary`/
`destructive`) (hecho: 2026-09-02).

**Feedback táctil agregado** a `Pressable`s que no tenían ninguna respuesta visual en
`onPressIn`/`style={({pressed}) => ...}` (checklist "tarjetas, botones custom, filas de lista"):
el toggle "Mis mascotas" y la lista "Gestionar mi negocio" de `app/(tabs)/perfil.tsx`, la lista de
accesos rápidos de `BusinessHomeScreen` en `app/(tabs)/index.tsx`, el botón "+" de
`app/(tabs)/mascotas.tsx`, el botón de eliminar servicio de `app/negocio-servicios.tsx`, los
botones de eliminar de `components/PetCard.tsx`/`PetDocumentRow.tsx`/`PreventiveEventRow.tsx`, el
selector de `components/ui/DatePickerField.tsx` (campo y botón "Listo" de iOS) y el componente
compartido `components/ui/Chip.tsx` (afecta todos los filtros/selectores de la app de una sola vez)
(hecho: 2026-09-02).

**Motion faltante agregado:** la lista de documentos en `app/mascotas/[id].tsx` no tenía animación
de entrada (aparecía de golpe) mientras que la lista de eventos preventivos en la misma pantalla sí
la tenía — se agregó el mismo `FadeInDown.duration(240).delay(index*35).springify().damping(26)
.stiffness(220)` con tope de 8 filas (hecho: 2026-09-02).

**Verificado, sin cambios necesarios:**
- Botón "Continuar con Google" en `app/(tabs)/perfil.tsx`: se oculta exactamente cuando
  `mode === 'signup' && role === 'establecimiento'` (línea ~330), con el copy explicativo
  correspondiente cuando está oculto. Bien integrado visualmente.
- `DatePickerField` se usa exactamente en los 3 lugares correctos (`mascotas/[id].tsx` → `due_date`,
  `mascotas/nueva.tsx` → `birth_date`, `establecimiento/[id].tsx` → `preferred_datetime` en
  `mode="datetime"`) — se buscó con Grep cualquier `FormTextField` sobre un campo de fecha y no
  apareció ninguno.
- El botón "Mis mascotas" en el menú de negocio de `perfil.tsx` navega a `/(tabs)/mascotas` (tab
  oculta con `href: null` pero ruta siempre registrada, patrón ya usado por el resto de la app) y no
  rompe el layout del resto del menú — visualmente es una tarjeta más, consistente con el resto.
- Cero emojis como ícono en toda `apps/mobile/app` (buscado con Grep por rango Unicode de emoji).
- Estados vacíos, de carga y de error de `(tabs)/directorio.tsx` y `establecimiento/[id].tsx` ya
  estaban bien resueltos (EmptyState explícito para error de carga, no solo un `Alert`).

**Pendiente honesto (no corregido en esta pasada):**
- [ ] La barra de tabs (`app/(tabs)/_layout.tsx`) inicializa `isBusiness = false` de forma síncrona
  y solo lo corrige tras que `getCurrentUser()` resuelve — para una cuenta de negocio esto significa
  un parpadeo real y visible: la tab "Mascotas" aparece primero y cambia a "Agenda" un instante
  después. Es un efecto secundario del mismo patrón ya documentado a propósito en la sección 6.1
  (tabs condicionales con `href: null`, sin caché síncrona del rol). Arreglarlo de raíz requeriría
  cachear el rol de forma síncrona (p. ej. `AsyncStorage` o mantener la sesión en un contexto
  cargado antes del primer render) — se dejó fuera de esta pasada por el riesgo de tocar el flujo
  de autenticación sin poder probarlo en un dispositivo real dentro de este entorno.
- [ ] No se tocó el "check con spring de rebote leve" (`ZoomIn` en `PreventiveEventRow.tsx`) ni la
  paleta de colores — ya cumplían el addendum de Motion & Materials tal cual estaba.
- [ ] No se corrió la app en un dispositivo/emulador real para confirmar visualmente los cambios de
  esta pasada (mismo límite que ya reconoce la sección 6.1) — se verificó con `npm run typecheck`
  (3 workspaces en verde) y `npx expo export --platform web` (20 rutas, sin errores) únicamente.

## 7. Despliegue

Decisión (2026-09-01): Vercel, importando el repo de GitHub (`felipebaez07/PETAPP`) directamente —
sin CLI. Requiere que el usuario haga login en vercel.com con su cuenta (el agente no puede completar
ese OAuth). Pasos exactos:

- [ ] **Web**: en vercel.com → "Add New Project" → importar `felipebaez07/PETAPP` → Root Directory =
  `apps/web` (Vercel detecta Next.js solo). Variables de entorno: `NEXT_PUBLIC_SUPABASE_URL` y
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` (copiarlas de `apps/web/.env.local`, no se versionan). Primer
  deploy recomendado **sin** esas variables (modo demo con datos de ejemplo) para revisar el
  rediseño sin depender del estado de la migración remota — ver el punto de abajo.
- [ ] **Mobile (vista previa en navegador)**: verificado que `npx expo export --platform web` genera
  un bundle estático limpio en `apps/mobile/dist` (18 rutas, sin errores, `dist/` ya está en
  `.gitignore`). Segundo proyecto en Vercel → mismo repo → Root Directory = `apps/mobile` → Build
  Command `npx expo export --platform web` → Output Directory `dist`. Dará una URL navegable de la
  app móvil (React Native Web) sin necesitar cuenta de Expo/EAS ni instalar Expo Go. Para la app
  nativa real (build instalable) sí hace falta `eas build`, que requiere cuenta Expo aparte — queda
  para cuando se necesite probar en un dispositivo físico.
- [ ] **Orden importante con Supabase**: el proyecto real (`nnsjospqprfygmxnlszb`) todavía tiene el
  esquema viejo (`reservations`, `products`, `forum_posts`, `adoption_*` sin renombrar). Si se
  conectan las variables de entorno reales antes de aplicar `0005_pivot_preventivo.sql`, las
  pantallas nuevas que leen `service_requests`/`preventive_events`/`pet_documents`/`provider_plans`
  van a fallar. Aplicar la migración (SQL Editor de Supabase) **antes** de pasar el deploy de web a
  modo real, o mantenerlo en modo demo hasta ese momento.
- [x] **Web desplegada**: https://petapp-web-topaz.vercel.app (Vercel, proyecto `felipebaez07`, Root Directory `apps/web`, con las variables reales conectadas). Verificado el 2026-09-01: `/directorio` (14 prestadores veterinaria/profesional, todos "Pendiente de verificación" — correcto, nadie ha sido contactado todavía) y `/panel/login` cargan sin errores contra el Supabase real ya migrado (hecho: 2026-09-01).
- [ ] Documentar aquí la URL de mobile-web una vez desplegado.

## 8. Validación (del documento de negocio, sección VIII)

Estas tareas no son de código, pero quedan trackeadas porque condicionan si se sigue invirtiendo en
funciones nuevas (Tabla V del PDF — condiciones de avance):

- [ ] 12 entrevistas a cuidadores (criterio: ≥8 relatan dificultad reciente y concreta con varios canales)
- [ ] 6 entrevistas B2B a prestadores (criterio: ≥3 aceptan evaluar oferta, ≥2 un piloto pagado)
- [ ] Prueba de usabilidad con 5 cuidadores (criterio: ≥4 completan perfil+fecha+solicitud sin ayuda)
- [ ] Piloto operativo 50–100 cuidadores / 5–8 prestadores (criterio: retención 4 semanas ≥30%, ≥60% solicitudes con respuesta, ≥3 prestadores pagan o firman intención)

## 8.1 Login con Google en mobile (2026-09-01)

- [x] `signInWithGoogle()` en `lib/auth.ts` (web: redirect de página; nativo: `expo-web-browser` +
  esquema propio `petapp://`, sin dependencias nuevas), pantalla `app/auth-callback.tsx`, botón en
  `(tabs)/perfil.tsx` (oculto al registrarse como empresa, igual que la web) (hecho: 2026-09-01,
  commit `24711bf`).
- [ ] **Pendiente del usuario, bloqueante**: agregar en Supabase Dashboard → Authentication → URL
  Configuration → Redirect URLs (además de lo ya pedido para la web):
  - `petapp://**` (esquema nativo de la app — mobile real)
  - `https://petapp-web-ezpl.vercel.app/**` (la vista web de prueba de mobile, dominio distinto al
    de la web principal)
  Sin esto, Supabase ignora el `redirectTo` que manda la app y cae al "Site URL" — que es
  exactamente el síntoma de "me redirige a localhost" que se reportó también en la web principal:
  ese fix (sección 7 de este documento) tampoco quedó aplicado todavía.
- [ ] No probado en un dispositivo real (dev client/standalone) — el regreso vía esquema propio
  (`petapp://`) no lo captura Expo Go, solo una build real de la app. Verificar cuando exista esa
  build.

## 8.2 Cuenta super-admin (2026-09-01)

- [x] Se creó una cuenta dedicada de administración (`super@superadminpetapp.com`, correo propio
  del piloto, no ligada a Google) y se promovió a `role = 'admin'` en `profiles` vía SQL Editor.
  El mismo gotcha del trigger `establishments_prevent_self_verification` (sección 7) aplica aquí:
  `profiles_prevent_role_change` también bloquea el `UPDATE` sin sesión de admin activa, así que
  la consulta de promoción desactiva/reactiva ese trigger puntualmente. Verificado con `role='admin'`
  en la base real (hecho: 2026-09-01).
- Con esta cuenta ya se puede entrar a `/panel/admin/aliados` (verificar/rechazar prestadores) y
  `/panel/admin/solicitudes` (convertir solicitudes de "Únete al piloto" en establecimientos reales).
- [ ] Pendiente: mismo panel de admin todavía no existe en mobile (decisión 2026-09-01: no hace
  falta por ahora, la web alcanza para administrar el piloto).

## 8.3 Revisión de código de toda la sesión (2026-09-02)

Se corrió la skill `code-review` (nivel alto) sobre todo el diff del pivot (`8382ec8..HEAD`,
114 archivos). Encontró 10 bugs reales, los 10 corregidos (hecho: 2026-09-02, commit `bacfdb8`):

- [x] **Seguridad (IDOR)**: `service_requests` aceptaba cualquier `pet_id` sin validar dueño —
  corregido en la app (`directorio/[slug]/actions.ts`) y en RLS (`0006_service_request_pet_ownership.sql`,
  necesario porque mobile inserta directo desde el cliente).
- [x] `seed.sql` truncaba tablas renombradas por 0005, rompía `supabase db reset`.
- [x] Formulario "Únete al piloto" seguía ofreciendo categorías que el schema ya rechaza, sin mostrar el error.
- [x] `apps/mobile/lib/auth.ts` reintrodujo el bug de `.maybeSingle()` que web ya había evitado.
- [x] Bug de zona horaria (UTC vs. local) reimplementado mal e independiente en 3 lugares —
  nuevo helper compartido `todayLocalDateString()` en `packages/shared/src/utils.ts`.
- [x] Fecha de nacimiento en `pet-card.tsx` (web) se mostraba un día antes siempre.
- [x] Dos fetches sin `.catch()` en mobile escondían errores de red como estados vacíos.
- [x] Barra de tabs de mobile no escuchaba `onAuthStateChange`, quedaba con el rol anterior tras cambiar de cuenta.

- [x] `0006_service_request_pet_ownership.sql` aplicada en el proyecto real vía SQL Editor —
  el hueco de seguridad del `pet_id` en `service_requests` queda cerrado también en producción
  (hecho: 2026-09-02).

## 9. Backlog / ideas que van surgiendo

(Agregar aquí cualquier tarea nueva que salga en el camino, con fecha.)

- [x] (2026-09-02) **Bug crítico en producción**: `/cuidador/mascotas` y `/cuidador/mascotas/[id]`
  devolvían 500 en Vercel ("Functions cannot be passed directly to Client Components") desde el
  commit `4e5c1c7`. Causa: `pet-card.tsx` y `mascotas/[id]/page.tsx` (Server Components) le pasaban
  `icon={PawPrint}` — la referencia al componente de `lucide-react` — a `RemoteImage` (`'use client'`).
  Una referencia a componente no es serializable a través del límite servidor/cliente de RSC; un
  elemento JSX ya renderizado sí. **`tsc --noEmit` no detecta este error** — es una regla de runtime
  de React Server Components, no de tipos — por eso pasó el typecheck sin problema el día anterior y
  solo se vio al desplegar de verdad. Lección: para páginas que cruzan el límite Server/Client
  Component, correr `npm run build` (Next build real) antes de dar por bueno un cambio, no solo
  `tsc --noEmit`. Corregido: `RemoteImage.icon` pasó de tipo `LucideIcon` a `ReactNode` (hecho:
  2026-09-02, commit `4b4a6b6`, encontrado con logs reales de Vercel que el usuario copió del
  dashboard).

- [x] (2026-09-02) **Bug real encontrado probando en producción**: el registro con `role='establecimiento'`
  guardaba bien el rol, pero en web el botón "Continuar con Google" seguía visible/activo incluso con esa
  categoría elegida (solo había una advertencia de letra chica) — a diferencia de mobile, que sí lo oculta.
  Corregido: se oculta el botón de Google en `auth-form.tsx` cuando `mode==='registro' && role==='establecimiento'`,
  igual que ya hacía mobile (hecho: 2026-09-02).
- [x] (2026-09-02) **Bug real, la causa de fondo de "me registro como veterinario pero no veo el menú
  correspondiente"**: no existía ninguna forma de que una cuenta `establecimiento` recién registrada
  creara su propio `establishments` — la única vía era "Únete al piloto" + conversión manual de un admin,
  pensado para gente sin cuenta. Corregido en web (commit `4027cd9`) y mobile (commit `66da595`):
  autoservicio de creación de negocio, queda en `verification_status='pendiente'` como cualquier otro.
- [x] (2026-09-02) **Bug real**: en `/panel/admin/aliados`, tras darle "Actualizar" a un negocio, el
  badge de estado se actualizaba bien pero el `<select>` de abajo seguía mostrando el valor viejo.
  Causa: `<select defaultValue={...}>` es un input no controlado — React solo aplica `defaultValue` al
  montar, no en cada re-render, así que tras `revalidatePath` el mismo nodo DOM no recogía el valor
  nuevo aunque el prop sí hubiera cambiado. Corregido con `key={establishment.verification_status}`
  para forzar el remonte cuando el estado real cambia (hecho: 2026-09-02, commit `56ae798`).
- [x] (2026-09-02) **Bug de seguridad/RLS real, encontrado probando "Solicitar cita" con una mascota
  seleccionada**: "infinite recursion detected in policy for relation 'service_requests'". Causa: la
  policy de `0006_service_request_pet_ownership.sql` (INSERT en `service_requests`, verifica dueño
  consultando `pets`) y la policy `pets_read_via_reservation` de `0004_bugfixes.sql` (agosto 2026, en
  `pets`, consulta `service_requests` para que un establecimiento vea la mascota de quien le reservó)
  se disparan una a la otra en bucle — ninguna de las dos es incorrecta por separado, el ciclo solo
  aparece al combinarlas y no se detecta leyendo el SQL, solo ejecutándolo de verdad. Corregido con
  `supabase/migrations/0008_fix_service_requests_pet_ownership_recursion.sql`: función `security definer`
  `pet_belongs_to_user()` (mismo patrón que `is_admin()`) para que el chequeo de dueño no vuelva a
  disparar la RLS de `pets` (hecho: 2026-09-02, aplicada en el proyecto real).

- [ ] (2026-09-01) Migración nueva para exponer "próximos vencimientos" al prestador en su resumen del
  panel: una policy de RLS en `preventive_events` que dé `select` a un `establecimiento` únicamente para
  mascotas con al menos una `service_request` en estado `confirmada`/`completada` con ese establecimiento.
  Hoy el resumen del panel (`app/panel/(dashboard)/page.tsx`) deja un placeholder explicando por qué no
  está — no se bordeó RLS con una key de más privilegios para resolverlo rápido.
- [ ] (2026-09-01) Subida real de archivos para `pet_documents` (hoy es un input de URL/enlace) — evaluar
  Supabase Storage con policies por dueño de mascota, análogas a las de la tabla.
- [ ] (2026-09-01) `apps/mobile` tiene 2 errores de typecheck preexistentes (no introducidos por este
  trabajo, que fue solo de `apps/web`): `app/(tabs)/index.tsx:126` y `components/PetCard.tsx:16` — una
  ruta `` `/mascotas/${string}` `` no coincide con las rutas tipadas que genera Expo Router. Parece un
  WIP a medio terminar del pivot mobile (ya existe `app/(tabs)/directorio.tsx` sin commitear). Revisar
  cuando se retome el rediseño de mobile (spec.md sección 6).
- [ ] (2026-09-01) `AuthForm` (`components/panel/auth-form.tsx`) sigue creando cuentas con
  correo/contraseña o Google sin distinguir el flujo de "Soy cuidador" vs. "Soy prestador" desde el CTA
  del home (`/panel/registro` siempre abre el mismo formulario con el radio ya en "cuidador/a" por
  defecto). Si se quiere una landing de registro específica por rol, falta un `?rol=` en la URL que
  preseleccione la opción — no se hizo por alcance/tiempo de esta tarea.

- [ ] (2026-09-01) **Bug de tooling, no de producto**: `.expo/types/router.d.ts` (typed routes de expo-router en `apps/mobile`) no reconoce `app/mascotas/[id].tsx` como ruta dinámica después de `npx expo export` — la queda como string literal en vez de plantilla `${string}`, mientras que `establecimiento/[id]` sí se reconoce bien. El archivo generado también lista rutas de `apps/web` (Next.js) mezcladas, lo que sugiere que el escaneo de typed routes está cruzando directorios del monorepo más allá de `apps/mobile/app`. Se dejó un cast puntual (`as any`) en las dos llamadas a `router.push(`/mascotas/${id}`)` (`components/PetCard.tsx`, `app/(tabs)/index.tsx`) para no bloquear el typecheck. Pendiente: investigar la configuración de `watchFolders`/rootDir de Metro en el monorepo y quitar el cast cuando se resuelva.
- [ ] (2026-09-01) La ficha de mascota (`app/mascotas/[id].tsx`) y el resumen de Inicio distinguen demo vs. real por el flag `isDemo` de `PetsContext` (no por `isSupabaseConfigured`), porque las mascotas de ejemplo (`demo-pet-1`/`demo-pet-2`) no son UUIDs válidos y romperían cualquier consulta real. Si en el futuro se agrega un modo "invitado con Supabase conectado pero sin sesión todavía", revisar que esta distinción se mantenga correcta.
- [ ] (2026-09-01) `app/(tabs)/index.tsx` solo muestra los primeros 6 vencimientos pendientes (cruzando todas las mascotas) sin paginación ni un "ver todos" hacia una vista de calendario completa — suficiente para el piloto, pero si el número de mascotas/eventos crece conviene una pantalla dedicada de calendario.
- [ ] (2026-09-01) El "check con spring de rebote leve" del addendum de Motion se implementó con la animación `entering` de Reanimated (`ZoomIn.springify()`) al montar el ícono de completado; el gesto de swipe-con-momentum mencionado en el mismo addendum ("swipe para completar recordatorio") no se implementó porque `react-native-gesture-handler` no es dependencia del proyecto todavía — si se quiere ese gesto, agregar la dependencia de forma deliberada (requiere rebuild nativo) en una tarea aparte.
- [ ] (2026-09-01) Documentos de mascota siguen siendo solo enlace/URL de texto (`pet_documents.document_url`), tal como pide el alcance actual — subida real de archivo a Supabase Storage queda pendiente para una fase posterior (ya anotado como tarea explícita en la sección de la web, sección 5).

## 10. Subida real de archivos en web (foto de mascota y documentos, 2026-09-02)

Base de esta ronda: commit `33f0f36` ("Base para subida real de fotos") ya había dejado la
migración `supabase/migrations/0007_pet_media_storage.sql` escrita (dos buckets — `pet-photos`
público, `pet-documents` privado — con policies por dueño usando la convención de ruta
`<auth.uid()>/<pet_id>/<archivo>`) y el tipo `PetDocument`/`petDocumentSchema` ya soportando
`storage_path` además de `document_url`. Esta ronda fue solo `apps/web` (mobile queda pendiente,
ver más abajo): conectar esa base con UI real de carga de archivos.

- [x] **Foto de mascota** — `components/cuidador/pet-form.tsx` ahora tiene un `<input type="file"
  accept="image/*">` con vista previa (object URL) antes de guardar, validado en el cliente con
  el nuevo helper `lib/uploads.ts` (`validatePhotoFile`: debe ser `image/*` y ≤5MB — no confía
  solo en el atributo `accept` del input). Flujo de creación: primero se crea la fila en `pets`
  sin foto vía la Server Action existente `createPet` (sin tocar su firma), y solo entonces,
  con el `pet_id` real ya conocido, se sube el archivo desde el navegador
  (`createSupabaseBrowserClient()`, sesión del usuario, nunca service role) a
  `pet-photos/<ownerId>/<petId>/photo.<ext>`, se obtiene la URL pública con `getPublicUrl` y se
  actualiza `pets.photo_url` con un `update` directo desde el cliente — permitido por la policy
  `pets_owner_full_access` ya existente (RLS por `owner_id = auth.uid()`), no hizo falta una
  Server Action nueva para ese último paso. Si la subida falla, la mascota queda creada sin foto
  y se avisa en vez de bloquear el flujo completo. `ownerId` se pasa como prop desde el Server
  Component (`app/cuidador/mascotas/page.tsx` → `AddPetPanel` → `PetForm`) en vez de pedirlo al
  cliente de Supabase, para no depender de una llamada extra a `auth.getUser()` en el navegador
  (hecho: 2026-09-02, `components/cuidador/pet-form.tsx`, `components/cuidador/add-pet-panel.tsx`,
  `app/cuidador/mascotas/page.tsx`, `lib/uploads.ts`).
- [x] **Mostrar la foto** — nuevo componente `components/ui/remote-image.tsx` (equivalente web de
  `apps/mobile/components/ui/RemoteImage.tsx`: `<img>` con fallback a un ícono Lucide si no hay
  URL o si falla la carga, nunca un cuadro roto; se usa `<img>` nativo en vez de `next/image`
  porque el dominio de Storage varía por proyecto de Supabase). Usado en
  `components/cuidador/pet-card.tsx` (48px, junto al nombre) y en el header de
  `app/cuidador/mascotas/[id]/page.tsx` (64px) — no existía ningún lugar donde `pet.photo_url` se
  renderizara antes de esta ronda (hecho: 2026-09-02).
- [x] **Documento de mascota** — `components/cuidador/add-document-panel.tsx` tiene ahora un
  toggle "Subir un archivo" / "Pegar un enlace". Modo archivo: `<input type="file" accept="image/*,
  application/pdf">` validado con `validateDocumentFile` (imagen o PDF, ≤10MB), se sube a
  `pet-documents/<ownerId>/<petId>/<uuid>.<ext>` (bucket privado) y se guarda `storage_path`
  (no una URL) en `pet_documents`, con `document_url` en `null`. Modo enlace: exactamente el
  comportamiento anterior (`document_url` pegado a mano, `storage_path` en `null`). La Server
  Action `createPetDocument` (`app/cuidador/mascotas/[id]/actions.ts`) ahora inserta también
  `storage_path` (antes se ignoraba aunque el schema ya lo tenía) y rechaza explícitamente el
  caso "ninguno de los dos" antes de tocar la base — la app valida "al menos uno" porque
  `petDocumentSchema` deja ambos campos opcionales a nivel de zod a propósito (mobile hace
  `.omit()` sobre el mismo schema), reforzado como última defensa por el `CHECK
  pet_documents_has_source` de la migración 0007 (hecho: 2026-09-02).
- [x] **Abrir un documento subido** — `components/cuidador/document-row.tsx` distingue tres
  casos: `document_url` (enlace externo, como antes, `<a target="_blank">` directo),
  `storage_path` (archivo subido) y ninguno de los dos (fila sin botón de abrir, no debería
  pasar por el CHECK de la base pero el componente no asume). Para `storage_path` se agregó la
  Server Action `getSignedDocumentUrl(documentId)` en `[id]/actions.ts`: busca el documento,
  **verifica que pertenece a una mascota del usuario autenticado con el mismo patrón
  `assertOwnsPet` ya usado en el resto del archivo** (además de la RLS de `pet_documents`, que
  ya lo exige del lado de la base — esta es una segunda barrera explícita, no un reemplazo), y
  recién entonces llama `createSignedUrl(path, 60)` (60 segundos). El botón "Abrir" llama a esta
  acción bajo demanda al hacer click y solo entonces hace `window.open(url, '_blank')` — no se
  precomputa ninguna URL firmada al renderizar la lista completa (hecho: 2026-09-02).
- [x] Todo el acceso a Storage sigue el mismo principio que el resto del proyecto: siempre con
  el cliente que lleva la sesión del usuario (`createSupabaseBrowserClient()` en el navegador
  para las subidas, `createSupabaseServerClient()` en la Server Action de URL firmada), nunca
  una service-role key — las policies de `storage.objects` de 0007 son las que de verdad deciden
  quién puede leer/escribir cada archivo (hecho: 2026-09-02).
- [x] `npm run typecheck` en verde en las 3 workspaces después de estos cambios; no se tocó
  `packages/shared` (los tipos/schemas que hacían falta ya estaban ahí desde la base del
  commit `33f0f36`) (hecho: 2026-09-02).

**Pendiente honesto de esta ronda (no se alcanzó a hacer o no se pudo probar, no se maquilla):**

- [x] `0007_pet_media_storage.sql` aplicada por el usuario en el proyecto Supabase real vía SQL
  Editor (hecho: 2026-09-02) — los buckets `pet-photos`/`pet-documents` y sus policies ya existen
  en producción. Sigue pendiente probar el flujo end-to-end en el navegador real (siguiente ítem).
- [ ] No se probó en un navegador real ningún paso del flujo (seleccionar archivo, ver la vista
  previa, que la subida realmente llegue al bucket, que la URL firmada realmente abra el PDF/
  imagen) — este entorno no tiene forma de correr `next dev` y hacer click a través de la UI.
  Primera vez que se use en real, revisar sobre todo: (a) que el `contentType` que manda
  `.upload()` sea el que Supabase Storage espera para que el navegador abra el PDF/imagen en vez
  de forzar la descarga, (b) que 60 segundos de validez de la URL firmada alcancen en una
  conexión lenta entre el click y que el navegador termine de abrir la pestaña nueva.
- [ ] No se implementó edición de foto para una mascota ya existente — `PetForm` hoy solo se usa
  en modo creación (`AddPetPanel`), no hay un flujo de "editar mascota" en la web todavía (no
  existía antes de esta ronda tampoco), así que cambiar la foto de una mascota ya creada no tiene
  UI por ahora.

## 12. Subida real de archivos en mobile (foto de mascota y documentos, 2026-09-02)

Puerto a `apps/mobile` de la sección 10 (que había sido solo `apps/web`). Misma base ya
aplicada en producción (`0007_pet_media_storage.sql`, dos buckets — `pet-photos` público,
`pet-documents` privado — con policies por dueño usando `<auth.uid()>/<pet_id>/<archivo>`).
No se tocó `apps/web`, `packages/shared` ni `supabase/` — no hizo falta ningún campo ni
migración nueva, la base de la sección 10 ya alcanzaba para mobile.

- [x] **Diferencia real con web, investigada antes de escribir código**: el navegador sube el
  `File` del `<input>` directo; React Native no tiene un `File`/`Blob` completo equivalente.
  El patrón usado (documentado por Supabase para Expo/React Native) es leer el URI local del
  picker con `fetch(uri).arrayBuffer()` — Expo soporta `fetch` sobre URIs `file://`/
  `content://`/`blob:` locales — y subir ese `ArrayBuffer` a `storage.from(bucket).upload()`.
  Nuevo `apps/mobile/lib/uploads.ts`: `validatePhotoAsset`/`validateDocumentAsset` (mismos
  límites que web: imagen ≤5MB para foto, imagen o PDF ≤10MB para documento — revisa
  `mimeType`/`size` real del asset, no confía en lo que el picker "debería" filtrar),
  `pickImageFromLibrary` (pide permiso con `ImagePicker.requestMediaLibraryPermissionsAsync()`
  y avisa con `Alert.alert` si se deniega, en vez de fallar en silencio), `pickDocumentFile`
  (`expo-document-picker`, admite `image/*` y `application/pdf`), `uploadFileToBucket` y
  helpers de nombre de archivo (hecho: 2026-09-02).
- [x] Instalado `expo-image-picker` y `expo-document-picker` con `npx expo install` (versiones
  correctas para SDK 57: `~57.0.15` y `~57.0.1`). Agregado el plugin `expo-image-picker` a
  `app.json` con `photosPermission` en español (texto que verá el usuario de iOS al pedir
  permiso de fotos) — `expo-document-picker` no necesitó entrada en `plugins`, no pide ningún
  permiso de Info.plist para el selector de archivos del sistema (hecho: 2026-09-02,
  `apps/mobile/app.json`).
- [x] **Foto de mascota al crear** (`app/mascotas/nueva.tsx`): círculo de vista previa +
  botón "Elegir foto (opcional)"/"Cambiar foto". Igual que web: primero se crea la mascota
  (`usePets().addPet`, ya existente), y solo con el `pet_id` real devuelto se sube el archivo
  a `pet-photos/<pet.owner_id>/<pet.id>/photo.<ext>` y se hace `update` de `pets.photo_url`
  con la URL pública (`getPublicUrl`, bucket público). En modo demo (`isDemo`, sin
  `auth.uid()` real) la foto simplemente no se sube — la mascota queda creada igual. Si la
  subida falla, se avisa y la mascota queda guardada sin foto, sin bloquear el flujo (hecho:
  2026-09-02, `app/mascotas/nueva.tsx`).
- [x] **Cambiar foto desde la ficha de una mascota ya existente** — el pedido original lo
  dejaba opcional/"si el tiempo lo permite"; se hizo. En `app/mascotas/[id].tsx` la foto del
  header ahora es tocable (`RemoteImage` + badge de cámara), sube a la misma ruta con
  `upsert: true` (reemplaza la foto anterior) y refleja el cambio al instante con una función
  nueva `updatePetPhoto(id, url)` agregada a `PetsContext` (evita recargar todas las mascotas
  solo para ver la foto nueva). En modo demo, tocarla muestra un aviso pidiendo iniciar sesión
  en vez de intentar subir sin `auth.uid()` real (hecho: 2026-09-02, `contexts/PetsContext.tsx`,
  `app/mascotas/[id].tsx`).
- [x] **Mostrar la foto** — `components/PetCard.tsx` ahora usa `RemoteImage` (ya existía,
  compartido con logo/portada de negocio) con `uri={pet.photo_url}` y fallback al ícono de
  especie, en vez de mostrar siempre el ícono. Mismo componente reutilizado en el header de
  `app/mascotas/[id].tsx` (hecho: 2026-09-02).
- [x] **Documento de mascota** — en `app/mascotas/[id].tsx`, el formulario de "agregar
  documento" ahora tiene un toggle con `Chip` ("Subir un archivo" / "Pegar un enlace"), igual
  patrón que el toggle de web. Modo archivo: dos botones ("Elegir imagen" vía
  `expo-image-picker`, "Elegir PDF" vía `expo-document-picker`, ambos guardan el mismo estado
  de archivo elegido) — se sube a `pet-documents/<pet.owner_id>/<pet.id>/<id-corto>.<ext>`
  (bucket privado) y se guarda el **path** en `pet_documents.storage_path`, dejando
  `document_url` en `null`. Modo enlace: exactamente el comportamiento anterior (`document_url`
  a mano). En modo demo, el modo archivo muestra un aviso ("inicia sesión para subir un
  archivo real") en vez de fingir una subida que no existe (hecho: 2026-09-02).
- [x] **Abrir un documento subido** — `components/PetDocumentRow.tsx` ya no ignora
  `storage_path` (antes tenía un comentario "queda pendiente" y no hacía nada al tocarlo si
  no había `document_url`). Ahora, al tocar la fila: si hay `document_url` lo abre directo
  (como antes); si hay `storage_path`, pide una URL firmada de 60s **en ese momento** (nunca
  precalculada al renderizar la lista) con la función nueva `getSignedPetDocumentUrl(documentId,
  petId)` de `apps/mobile/lib/data.ts`, y recién con esa URL llama `openExternalUrl`. Como
  mobile no tiene servidor intermedio (a diferencia de la Server Action `getSignedDocumentUrl`
  de web), la verificación de dueño ocurre en la misma consulta: el `select` filtra por `id`
  **y** `pet_id` a la vez, y la RLS de `pet_documents` (solo el dueño de la mascota puede leer
  sus filas) deniega cualquier documento ajeno — si no hay fila, no se genera ninguna URL;
  nunca se acepta un `storage_path` arbitrario que no venga de una fila que el usuario pudo
  leer (hecho: 2026-09-02, `components/PetDocumentRow.tsx`, `lib/data.ts`).
- [x] Todo el acceso a Storage sigue con el cliente `supabase` de sesión del usuario (el mismo
  cliente único de `lib/supabase.ts`, nunca una service-role key) — las policies de
  `storage.objects` de 0007 son las que de verdad deciden quién puede leer/escribir cada
  archivo (hecho: 2026-09-02).
- [x] `npm run typecheck` en verde en las 3 workspaces y `npx expo export --platform web`
  sin errores dentro de `apps/mobile` (20 rutas, misma cantidad que antes de esta ronda) —
  confirmado que `expo-image-picker`/`expo-document-picker` no rompen el bundle web (ambos
  tienen soporte web propio, no hizo falta ningún archivo `.web.tsx` ni `Platform.select`
  para las funciones de picker) (hecho: 2026-09-02).

**Pendiente honesto de esta ronda (no se alcanzó a hacer o no se pudo probar, no se maquilla):**

- [ ] No se probó en un dispositivo/simulador real ningún paso del flujo (pedir permiso de
  galería, elegir imagen/PDF, que la subida realmente llegue al bucket, que la URL firmada
  realmente abra el documento) — este entorno no tiene forma de correr la app nativa. Cuando
  se pruebe por primera vez, revisar sobre todo: (a) que `fetch(uri).arrayBuffer()` funcione
  igual en Android que en iOS para URIs `content://` (el comportamiento de `fetch` sobre URIs
  locales puede variar entre engines/versión de Expo — es el punto más frágil de todo este
  cambio, al no poder probarlo aquí), (b) que el permiso de galería se pida y deniegue
  correctamente en ambas plataformas, (c) que `expo-document-picker` en Android realmente deje
  elegir tanto imágenes como PDFs con el filtro `['image/*', 'application/pdf']`.
- [ ] `expo export --platform web` no ejecuta los config plugins de `app.json` (esos solo
  aplican en `expo prebuild`/build nativo), así que agregar el plugin `expo-image-picker` con
  `photosPermission` en español no se pudo verificar de forma end-to-end en este entorno —
  solo se confirmó que el JSON es válido. Revisar el texto del permiso la primera vez que se
  genere un build nativo (iOS pedirá ese texto exacto al usuario).
- [ ] No se implementó borrado del archivo en Storage al eliminar una mascota o un documento
  (mismo pendiente ya anotado para web en la sección 10) — un documento o foto reemplazada
  deja el archivo anterior huérfano en el bucket hasta limpieza manual o una pasada futura.
  `upsert: true` en la foto de mascota sobrescribe el archivo en la misma ruta (mismo nombre
  `photo.<ext>`), así que ahí no se acumula basura salvo que cambie la extensión entre subidas
  (ej. de `.jpg` a `.png` dejaría el `.jpg` viejo huérfano) — no se resolvió por alcance.
- [ ] El id corto de nombre de archivo (`generateFileId()` en `lib/uploads.ts`, basado en
  `Date.now()`+`Math.random()`) no es criptográficamente aleatorio como el `crypto.randomUUID()`
  que usa web — se prefirió no agregar `expo-crypto` como dependencia nueva solo para esto.
  No es un problema de seguridad (el control de acceso real lo da la policy de Storage sobre
  el prefijo `<auth.uid()>/<pet_id>/`, no que el nombre de archivo sea impredecible), pero si
  se agrega `expo-crypto` más adelante por otro motivo, conviene migrar a `Crypto.randomUUID()`
  por prolijidad.
- [x] (2026-09-02) `apps/mobile` seguía exactamente igual que esta ronda de web (fuera de
  alcance explícito de esa tarea): la foto de mascota y los documentos en mobile solo usaban
  campos de URL/enlace de texto. Portado el mismo patrón (picker + Storage) a mobile — ver
  sección 12. Sigue pendiente el logo/portada de negocio en mobile (no era parte de este pedido).
- [ ] No se agregó borrado del archivo en Storage al eliminar una mascota o un documento
  (`deletePetDocument`, `deletePreventiveEvent` etc. solo borran la fila de la base) — un
  documento eliminado deja su archivo huérfano en el bucket `pet-documents` hasta que se limpie
  a mano o se agregue esa lógica en una pasada futura. No se pidió explícitamente en el alcance
  de esta tarea y no se resolvió por no ampliar el riesgo sin poder probarlo.

## 11. Pulido visual "Apple-like" en mobile (2026-09-02)

Pedido explícito del dueño del proyecto: pasada de pulido de profundidad/materiales, jerarquía,
tipografía y accesibilidad en `apps/mobile`, **sin tocar ni un color de marca** (azul clínico
`#0369A1` + menta `#10B981` de `design-system/petapp/MASTER.md` intactos, confirmado). Se apoyó
en el addendum "Motion & Materials" del mismo MASTER.md y en un hallazgo de accesibilidad de la
skill `ui-ux-pro-max` (`app-interface.csv`). Cinco frentes:

- [x] **Tab bar con material translúcido real** (`app/(tabs)/_layout.tsx`): antes era opaca
  (`backgroundColor: COLORS.card` + `borderTopWidth: 1`). Se instaló `expo-blur`
  (`npx expo install expo-blur`, resuelto solo en `apps/mobile`, sin tocar `apps/web` ni
  `supabase/`) y se agregó `tabBarBackground: () => <BlurView intensity={80} tint="light"
  style={StyleSheet.absoluteFill} />` con `tabBarStyle: { position: 'absolute', borderTopWidth: 0,
  elevation: 0, ... }` — este fork interno de `@react-navigation/bottom-tabs` que trae
  `expo-router` (vendido en `node_modules/expo-router/build/react-navigation/bottom-tabs`, no
  hay dependencia directa a `@react-navigation/bottom-tabs` en el proyecto) ya pone
  `backgroundColor: 'transparent'` automáticamente en cuanto `tabBarBackground` no es `null`, así
  que no hizo falta forzarlo a mano. `expo-blur` tiene implementación web propia
  (`BlurView.web.tsx`, usa `backdrop-filter` CSS) — Metro la resuelve sola vía `.web.tsx`, igual
  que el patrón ya usado en `DatePickerField.web.tsx`, sin necesitar ningún `Platform.select` en
  el sitio de uso (hecho: 2026-09-02, `app/(tabs)/_layout.tsx`).
  - Efecto secundario del `position: 'absolute'`: la tab bar deja de reservar su propio espacio
    en el layout, así que el contenido de cada tab podía terminar tapado por el blur flotante.
    Se agregó `lib/tabBar.ts` (`TAB_BAR_HEIGHT` + hook `useTabBarBottomInset()`, que suma el alto
    fijo de la barra + `useSafeAreaInsets().bottom` + un respiro de 16px) y se aplicó como
    `paddingBottom` del `contentContainerStyle` en las 4 pantallas de tabs
    (`(tabs)/index.tsx` — ambas variantes cuidador/negocio —, `(tabs)/agenda.tsx`,
    `(tabs)/mascotas.tsx`, `(tabs)/directorio.tsx`). `(tabs)/perfil.tsx` no tenía ningún
    `ScrollView` (todo su contenido vivía en un `View` fijo) — se le agregó `ScrollView` en sus
    tres variantes (sesión activa, elección de rol, formulario de login/registro) para poder
    aplicar el mismo padding; antes de este cambio, un menú de negocio largo ya corría el riesgo
    de quedar cortado por el borde inferior de la pantalla sin poder hacer scroll, y con la barra
    flotante ese riesgo se volvía peor (hecho: 2026-09-02, `lib/tabBar.ts`, `app/(tabs)/perfil.tsx`
    y los 4 archivos de tabs mencionados).
  - No se implementó ninguna transición de scroll-edge (opcional según el addendum) — el chrome
    flotante ya se ve bien tanto sobre contenido claro como sobre el header azul de cada pantalla
    sin ella.
  - `prefers-reduced-transparency`: no existe una API directa equivalente en React Native; se
    verificó que el texto de las tabs (`tabBarActiveTintColor`/`tabBarInactiveTintColor`) usa
    colores sólidos, no depende de la transparencia para ser legible, así que no hacía falta un
    fallback adicional.
- [x] **Tipografía — tracking negativo en headings grandes**: `components/ui/ScreenHeader.tsx`
  ya tenía `tracking-tight` en su título (`text-3xl`), pero tres headings grandes sueltos no lo
  tenían y quedaban con el tracking por defecto (más "espaciado", menos premium): el contador de
  solicitudes pendientes en `(tabs)/index.tsx` (`text-2xl`), el nombre de la mascota en
  `app/mascotas/[id].tsx` (`text-xl`) y el nombre del establecimiento en
  `app/establecimiento/[id].tsx` (`text-2xl`). Se agregó `tracking-tight` a los tres (mapea al
  `-0.025em` de la escala default de Tailwind, que NativeWind resuelve a un valor absoluto en px
  según el `fontSize` de cada `Text` — mismo mecanismo que ya usaba `ScreenHeader` sin problema)
  (hecho: 2026-09-02). El texto de cuerpo no se tocó (se queda con tracking normal, tal como pide
  el addendum). Confirmado además que la escala de tamaños de `tailwind.config.js` no sobreescribe
  `fontSize` (usa los defaults de Tailwind: `text-sm` 14px / `text-base` 16px), cumpliendo el
  mínimo de MASTER.md sin necesitar cambios.
- [x] **Accesibilidad — íconos decorativos marcados como no accesibles**: se agregó
  `accessible={false}` a los `View` contenedor de íconos puramente decorativos que acompañan un
  texto que ya describe lo mismo (el ejemplo citado, "PawPrint/Building2 genérico al lado de un
  título"): el ícono de especie en `components/PetCard.tsx` y `app/mascotas/[id].tsx`, el ícono
  de tipo de documento en `components/PetDocumentRow.tsx`, el ícono `PawPrint` de las citas de
  `(tabs)/agenda.tsx`, los cuatro íconos de accesos rápidos/resumen en `(tabs)/index.tsx`
  (`CalendarClock`, `CalendarCheck2`, `Plus`, `Building2`), el ícono `PawPrint` del acceso "Mis
  mascotas" en `(tabs)/perfil.tsx`, y el logo/portada (o su ícono de reemplazo) de
  `components/ui/RemoteImage.tsx` — este último siempre aparece junto al nombre del
  establecimiento/mascota, así que es redundante en las tres pantallas donde se usa. **No se tocó**
  ningún ícono que sea el único indicativo de una acción (los botones de eliminar ya tenían
  `accessibilityLabel` propio en el `Pressable` padre, igual que el checkbox de completar de
  `PreventiveEventRow`) (hecho: 2026-09-02). Confirmado con Grep: cero usos de
  `allowFontScaling={false}` en toda la app (Dynamic Type nunca se bloquea). Revisado el
  espaciado táctil entre elementos tocables adyacentes (filas de chips, botones de accesos
  rápidos, menús) — ya usaban `gap-2` o más en todos los casos encontrados, no se necesitó
  ningún cambio.
- [x] **Motion — transiciones entre pantallas**: confirmado con Grep que ninguna `Stack.Screen`
  de `app/_layout.tsx` (ni de ningún otro `_layout.tsx`) desactiva la animación nativa
  (`animation: 'none'` no aparece en ningún lado); el Stack sigue usando las transiciones nativas
  de iOS/Android sin reinventarlas con Reanimated. La única pantalla modal
  (`mascotas/nueva.tsx`, `presentation: 'modal'`) es la única con `presentation:` distinto del
  default, y React Navigation ya la abre/cierra por el mismo eje sin overrides adicionales — no
  hizo falta ningún cambio en este frente, solo la verificación.
- [x] **Profundidad — revisión de sombras dobles**: se revisó `components/ui/Card.tsx` y todos
  sus usos (además de los `View` con `shadow-sm`/`shadow-xs` que replican el mismo patrón visual
  sin pasar por el componente, ej. `EstablishmentCard`, `PetCard`, filas de horarios/servicios) —
  en ningún caso una fila con su propia sombra vive anidada dentro de otro contenedor con sombra
  propia; los "contenedores tabla" (horarios, servicios) usan un solo `shadow-sm` externo con
  filas internas separadas por `border-b`, no por sombras repetidas, y las filas de listas
  (`PetCard`, `PreventiveEventRow`, `PetDocumentRow`, `EstablishmentCard`) son siempre hermanas
  directas de un `Animated.View`/`Pressable`, nunca hijas de otro `View` con sombra. No se
  encontró ningún caso real de sombra doble apilada — no se necesitó ningún cambio de código en
  este frente, solo la verificación explícita.

**Verificación de esta pasada:** `npm run typecheck` en verde en las 3 workspaces
(`apps/web`, `apps/mobile`, `packages/shared`) y `npx expo export --platform web` dentro de
`apps/mobile` sin errores (20 rutas, igual cantidad que antes de esta pasada) — confirmado que
`expo-blur` no rompe el bundle web gracias a su implementación `.web.tsx` nativa.

**Pendiente honesto de esta pasada:**

- [ ] No se probó en un dispositivo/simulador real (mismo límite ya reconocido en secciones
  anteriores de mobile) — no hay forma de confirmar visualmente en este entorno que el blur se
  vea bien en iOS/Android nativos (solo se verificó `expo export --platform web`, donde el blur
  usa `backdrop-filter` de CSS en vez del blur nativo real). En Android además, `expo-blur` solo
  hace blur real de verdad (vía `RenderNode`) en Android 12+; en versiones anteriores cae a un
  overlay semitransparente sin difuminado real — sigue siendo un material translúcido coherente
  con el addendum, pero no es blur gaussiano de verdad ahí. Revisar la primera vez que se corra
  en un dispositivo/emulador real.
- [ ] El respiro de `useTabBarBottomInset()` (16px) es un valor fijo elegido a criterio, no
  medido contra el resultado real en pantalla — si en un dispositivo real se ve muy justo o
  demasiado holgado, ajustar ese número en `lib/tabBar.ts` en vez de tocar cada pantalla.
  `(tabs)/perfil.tsx` ahora tiene `ScrollView` en sus tres variantes, pero no se verificó
  visualmente que el contenido más largo (menú de negocio completo) efectivamente haga scroll
  sin cortes en un dispositivo real.
- [ ] La revisión de "espaciado táctil ≥8dp" e "íconos decorativos" fue manual sobre los
  patrones más comunes de la app (chips, accesos rápidos, avatares de ícono); no se hizo una
  auditoría exhaustiva de cada `Pressable` de cada pantalla — es posible que quede algún caso
  suelto no cubierto por los patrones revisados.
- [ ] No se tocó `packages/shared` — ningún ajuste de este alcance lo necesitó.

## 13. Autoservicio para crear el negocio en mobile (2026-09-02)

Mismo bug real ya corregido en `apps/web` (commit `4027cd9`), portado a `apps/mobile`: una cuenta
que se registra correctamente con `role='establecimiento'` no tenía ninguna forma de crear su
propio negocio (`establishments` row) — la única vía era el formulario público "Únete al piloto"
+ conversión manual de un admin, pensado para gente sin cuenta todavía. El resultado: un prestador
se registraba bien, iniciaba sesión, y todas las pantallas de negocio le mostraban "Solo para
cuentas de negocio" (`negocio-perfil.tsx`, `negocio-horarios.tsx`, `negocio-servicios.tsx`,
`negocio-plan.tsx`, `(tabs)/agenda.tsx`) o "Contacta al equipo de PETAPP para activarlo"
(`(tabs)/index.tsx`) — dos situaciones distintas (rol equivocado vs. rol correcto sin negocio
todavía) con un solo mensaje confuso, interpretable como "me logueó como cuidador".

- [x] Nueva pantalla `app/negocio-crear.tsx`: mismo patrón que `create-establishment-form.tsx` de
  web pero adaptado a cliente directo (mobile no tiene Server Actions) — `react-hook-form` +
  `zodResolver(createEstablishmentSchema)` (reutilizado tal cual de `packages/shared`, no se
  duplicó), campos nombre/`FormTextField`, categoría/`ChipSelectField` (limitada a
  veterinaria/profesional), dirección, teléfono, whatsapp. Al enviar: genera un slug único
  (query previa a `establishments` por `slug`, sufijo aleatorio de 4 caracteres si ya existe,
  mismo criterio que `createOwnEstablishment` en web) e inserta directo con
  `supabase.from('establishments').insert(...)` (`owner_id`, `city: 'Ibagué'`,
  `verification_status` en su default `'pendiente'` — sigue pasando por la validación del
  superadmin, este fix no se la salta). Registrada en `app/_layout.tsx`
  (hecho: 2026-09-02, `app/negocio-crear.tsx`, `app/_layout.tsx`).
- [x] `(tabs)/index.tsx` (`BusinessHomeScreen`): el `EmptyState` de "sin negocio" ya no dice
  "Contacta al equipo de PETAPP para activarlo" (ya no es cierto) — ahora invita a crear el
  negocio con un botón que navega a `negocio-crear` (hecho: 2026-09-02).
- [x] `negocio-perfil.tsx`, `negocio-horarios.tsx`, `negocio-servicios.tsx`, `negocio-plan.tsx`,
  `(tabs)/agenda.tsx`: cada uno ahora guarda también si el usuario tiene `role==='establecimiento'`
  (antes solo guardaban `establishment`/`establishmentId`, sin el rol) y diferencia dos casos donde
  antes había uno solo: rol equivocado → se mantiene "Solo para cuentas de negocio" (con "Volver");
  rol `establecimiento` sin negocio vinculado → nuevo mensaje "Todavía no has creado tu negocio"
  con acción a `negocio-crear` (hecho: 2026-09-02).
- [x] No se tocó `apps/web`, `supabase/` ni la RLS — la policy `establishments_owner_insert`
  (`for insert with check (owner_id = auth.uid() or public.is_admin())`, ya en `0001_init.sql`)
  ya permite este insert directo desde el cliente mobile, no hizo falta ninguna migración nueva.

**Verificación de esta pasada:** `npm run typecheck` en verde en las 3 workspaces y
`npx expo export --platform web` sin errores dentro de `apps/mobile` (21 rutas, una más que antes
de esta pasada por `negocio-crear`). Nota de entorno: el typecheck falló en el primer intento
porque `.expo/types/router.d.ts` (tipos de rutas de Expo Router, generado, gitignored) estaba
desactualizado — no incluía `negocio-crear` todavía. Se regeneró corriendo `npx expo start --web`
brevemente en segundo plano hasta que el archivo se actualizó, y recién ahí el typecheck pasó
limpio; esto es un artefacto local de este entorno, no algo que necesite acción en el repo (se
regenera solo la próxima vez que cualquiera corra `expo start`).

**Pendiente honesto de esta pasada:**

- [ ] No se probó en un dispositivo/simulador real el flujo completo (crear el negocio, ver que
  aparece de inmediato en el resto de pantallas de negocio y en `(tabs)/index.tsx`, ver que
  aparece en el directorio como "Pendiente de verificación") — mismo límite ya reconocido en
  secciones anteriores de mobile, este entorno no tiene forma de correr la app nativa.
- [ ] `negocio-crear.tsx` no revalida ni refresca ningún estado global después de crear el
  negocio (a diferencia de web, que usa `revalidatePath`) — se apoya en que cada pantalla vuelve a
  llamar `getCurrentUser()` en su propio `useEffect` al montarse, así que `router.replace('/(tabs)')`
  basta para que el dashboard de negocio recargue con el negocio recién creado. No se verificó en
  un dispositivo real que la navegación por defecto de Expo Router realmente desmonte/remonte la
  tab de inicio en todos los casos (ej. si el usuario ya tenía esa tab activa en memoria).
