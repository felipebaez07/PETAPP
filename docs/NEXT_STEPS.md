# Qué falta y qué se necesita del equipo/negocio

Este documento resume, con honestidad, qué parte del piloto ya es real (código funcional, probado
contra un proyecto Supabase real) y qué parte sigue esperando decisiones o insumos que solo el equipo
del proyecto puede dar.

## 1. Backend real (Supabase) — ya conectado

Hay un proyecto Supabase real conectado (`nnsjospqprfygmxnlszb`, región us-west-2), con el esquema
completo aplicado: `supabase/migrations/0001_init.sql` (tablas, enums, RLS), `0002_products.sql`
(marketplace), `0003_forum.sql` (foro/muro de anuncios) y `0004_bugfixes.sql` (correcciones de RLS
encontradas en la auditoría de bugs — ver punto 8). **Antes de dar por cerrado este punto, confirma que
las cuatro migraciones estén aplicadas en orden en el SQL Editor del proyecto** (revísalas con
`select * from supabase_migrations.schema_migrations` si tienes la CLI, o simplemente re-corre las que
falten).

Login con Google también está conectado (Supabase Auth → Google provider, con las credenciales de
Google Cloud Console ya configuradas) — solo para la web por ahora; en mobile queda como siguiente paso
(requiere `expo-auth-session` y deep linking, un flujo distinto al de la web).

## 2. Los aliados piloto reales

`supabase/seed.sql` ya tiene **27 negocios y organizaciones reales de Ibagué** (veterinarias, petshops,
profesionales independientes, fundaciones), investigados y con fuente documentada en
`docs/CANDIDATOS_ALIADOS_IBAGUE.md` — **pero ninguno ha sido contactado ni ha dado su consentimiento**
para aparecer como aliado. Todos quedan con `verification_status = 'pendiente'` a propósito. El equipo
del piloto debe:

1. Contactar a cada uno (la lista con teléfonos está en `docs/CANDIDATOS_ALIADOS_IBAGUE.md`).
2. Una vez acepten, vincular su cuenta real: desde `/panel/admin/solicitudes` (si llegaron por el
   formulario "Únete al piloto") o directamente actualizando `owner_id` en la tabla `establishments`.
3. Marcarlos como `verificado` desde `/panel/admin/aliados`.

## 3. Identidad de marca

- Nombre "PetApp" sigue siendo provisional.
- Logo real pendiente (favicon/splash siguen siendo placeholders).
- **Paleta de color — actualizada (v2):** se cambió de navy+teal a azul clínico (`#0369A1`) + verde menta
  (`#10B981`) + blanco, a pedido explícito, documentada en `design-system/petapp/MASTER.md`. El ámbar
  (adopciones) y el rojo (errores) no cambiaron — son decisiones semánticas separadas de la paleta de marca.

## 4. Política de tratamiento de datos y términos de uso (Ley 1581 de 2012)

Sin cambios — borrador en `/politica-privacidad` y `/terminos`, falta razón social/correo real y revisión
legal antes de ser vinculante.

## 5. Despliegue

Ninguna de las dos apps está desplegada todavía; ambas corren solo en local (`npm run dev:web`,
`npm run dev:mobile`). Web candidata natural a Vercel; mobile necesita `eas build` + cuenta Expo.

## 6. Confirmación de correo en signup

Sigue como decisión pendiente del equipo (Authentication → Providers → Email → "Confirm email" en el
dashboard de Supabase). Hoy está desactivado para poder probar sin fricción.

## 7. Marketplace y Foro — nuevos, sin pasarela de pago

- **Marketplace** (`/marketplace`, panel `/panel/tienda`, mobile pestaña "Comunidad"): las tiendas
  publican productos con precio de referencia; el comprador pregunta por WhatsApp. Sin carrito ni cobro
  en línea todavía — cuando se quiera evaluar pagos reales, las opciones típicas para Colombia son
  Wompi, PayU, Mercado Pago o ePayco (decisión pendiente, no implementada).
- **Foro** (`/foro`, panel `/panel/foro`, mobile pestaña "Comunidad"): los aliados publican promociones,
  anuncios, noticias o lugares. Se ve al instante (sin cola de aprobación); un admin puede ocultar/borrar
  después si hace falta. Las publicaciones de adopción siguen siendo su propio flujo, sin fusionar.

## 8. Auditoría de bugs (agosto 2026) — corregidos

Se corrió una auditoría exhaustiva (búsqueda + verificación adversarial) que encontró 20 bugs reales;
los 20 quedaron corregidos, entre ellos:

- RLS: un establecimiento no podía ver el perfil/mascota de quien le reservó (`0004_bugfixes.sql`).
- RLS: el formulario público de "interesado en adopción" fallaba para visitantes sin sesión (`0004_bugfixes.sql`).
- El registro desde mobile no mandaba nombre ni rol — ninguna cuenta de negocio podía crearse desde el celular.
- Faltaba el flujo real para que un propietario cree una reserva desde la app (antes solo existía el
  esquema/RLS, sin ninguna pantalla que lo usara) — ya está en la ficha de cada establecimiento (web y mobile).
- Una solicitud de "Únete al piloto" no tenía ningún camino, ni manual ni por UI, para convertirse en un
  establecimiento real — ahora existe `/panel/admin/solicitudes`.
- Varias pantallas de mobile se quedaban colgadas en el spinner de carga para siempre si fallaba la red
  (sin manejo de error) — corregido en Perfil, Adopciones, ficha de establecimiento y ficha de adopción.

## Lo que ya funciona hoy

- Directorio público con filtros, ficha de establecimiento (mapa, horarios, servicios, productos,
  solicitud de reserva, WhatsApp), con los 27 aliados reales (pendientes de verificación).
- Marketplace y Foro (ver punto 7), en web y mobile.
- Login con email/contraseña y con Google (web); email/contraseña con selección de rol (mobile).
- Mascotas conectadas de verdad a Supabase desde la app móvil (antes solo vivían en memoria).
- Panel SaaS completo (perfil, horarios, servicios, tienda, foro, reservas, publicaciones de adopción) y
  paneles de admin (verificación de aliados, solicitudes de alianza).
- Reservas: el propietario puede solicitar desde la app (web o mobile) y el aliado la ve en su panel.
