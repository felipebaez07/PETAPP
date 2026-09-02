# PETAPP — Spec viva del rework (seguimiento preventivo + directorio veterinario)

> **Cómo usar este documento:** es la guía única de lo que se está construyendo. Cada tarea nueva que
> surja se agrega en la sección de su fase con `- [ ]`. Cuando se termina y se verifica, se marca
> `- [x]` y se le agrega una nota corta `(hecho: <fecha>, <commit o archivo clave>)`. No se borran
> tareas completadas — quedan como historial de qué se decidió y cuándo. Si una tarea se descarta,
> se dice explícitamente por qué (`descartado: ...`) en vez de borrarla.
>
> Última actualización: 2026-09-01.

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

- [ ] (2026-09-01) La agenda del prestador (`app/(tabs)/agenda.tsx`) depende de que
  `service_requests.preferred_datetime` tenga un valor — hoy ningún formulario mobile permite al
  cuidador proponer fecha/hora al solicitar cita (`app/establecimiento/[id].tsx` solo manda
  `service_id`/`pet_id`/`notes`), así que en la práctica la sección "Próximas citas confirmadas"
  quedará vacía hasta que (a) se agregue un selector de fecha/hora deseada al formulario de
  solicitud, o (b) el prestador la fije manualmente en algún flujo nuevo. No se hizo por estar fuera
  del alcance literal de los 5 pedidos (que era mostrar la agenda a partir de datos ya existentes,
  no agregar un campo nuevo al formulario de solicitud) — queda como tarea natural de seguimiento.
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

## 9. Backlog / ideas que van surgiendo

(Agregar aquí cualquier tarea nueva que salga en el camino, con fecha.)

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
