# Qué falta y qué se necesita del equipo/negocio

Este documento resume, con honestidad, qué parte del piloto ya es real (código funcional) y qué parte
sigue en modo demo esperando decisiones o credenciales que solo el equipo del proyecto puede dar.

## 1. Backend real (Supabase) — bloqueante para todo lo demás

Hoy no hay ningún proyecto Supabase conectado (la cuenta conectada a esta sesión no tiene organizaciones).
El esquema completo ya está escrito y listo para aplicar: `supabase/migrations/0001_init.sql` (tablas,
enums, Row Level Security) y `supabase/seed.sql` (10 aliados y 4 publicaciones de adopción de ejemplo,
**ficticios** — deben reemplazarse por los aliados reales antes de salir a producción).

Dos caminos, cualquiera de los dos funciona:

- **Opción A — más rápida**: crea una cuenta/organización en [supabase.com](https://supabase.com) (tiene
  plan gratuito, suficiente para todo el piloto) y autoriza la conexión de Supabase con Claude desde la
  configuración de conectores de claude.ai. Con eso puedo crear el proyecto, aplicar el esquema y dejar
  todo conectado directamente.
- **Opción B**: crea tú mismo el proyecto en supabase.com, corre las migraciones (`supabase db push` con
  la CLI, o pega el contenido de `0001_init.sql` y `seed.sql` en el SQL Editor del panel de Supabase), y
  pásame la **Project URL** y la **anon key** (Settings → API). Con eso completo los `.env.local` de
  ambas apps (`apps/web/.env.example` y `apps/mobile/.env.example` ya indican qué variables van).

Sin esto, ambas apps seguirán funcionando en **modo demo** (datos de ejemplo, sin autenticación real,
sin persistencia) — es una app real y navegable, pero nadie puede realmente registrarse ni guardar datos.

## 2. Los ~10 aliados piloto reales

El PDD (sección 6.1) pide vincular veterinarias, comercios y al menos una fundación reales de Ibagué.
`supabase/seed.sql` tiene datos ficticios de referencia (nombres, horarios, servicios) que solo sirven
para probar la UI. Necesito de ustedes, por cada aliado real:

- Nombre, categoría (veterinaria / comercio / profesional / fundación), dirección, ciudad.
- Teléfono y **número de WhatsApp** en formato internacional (ej. `573001234567`) — es el canal real de
  reserva en esta fase.
- Horarios de atención (o si atienden 24/7).
- Servicios que ofrecen, con precio de referencia si quieren mostrarlo.

## 3. Identidad de marca

El nombre "PetApp" es provisional (así lo dice el propio PDD). Falta:

- Nombre definitivo.
- Logo real. Hoy la web tiene un favicon placeholder propio (huella sobre navy, `apps/web/src/app/icon.svg`)
  y la app móvil todavía usa los íconos/splash por defecto de la plantilla de Expo — ambos deben
  reemplazarse por el logo definitivo (ícono, splash, adaptive icon de Android).
- Paleta de color: ya está definida y documentada en `design-system/petapp/MASTER.md` (navy + teal,
  ámbar reservado para adopciones) — es una decisión de diseño ya tomada, pero avísenme si quieren
  cambiarla antes de que se propague a más pantallas.

## 4. Política de tratamiento de datos y términos de uso (Ley 1581 de 2012)

Ya existe un primer borrador, publicado en `/politica-privacidad` y `/terminos` (enlazado desde el
footer), con un aviso visible de "borrador para revisión". **No debe tratarse como vinculante todavía**:
falta completar la razón social/nombre legal y el correo de contacto (marcados entre corchetes en el
propio texto), y lo ideal es que un abogado lo revise antes del lanzamiento real con los aliados.

## 5. Despliegue

Ninguna de las dos apps está desplegada todavía; ambas corren solo en local.

- **Web**: el candidato natural es Vercel (soporte nativo de Next.js, despliegue en minutos). Puedo
  configurarlo si me dan (o me piden crear) una cuenta/proyecto.
- **Móvil**: para pruebas reales con los aliados se necesita `eas build` (Expo Application Services) y
  distribución interna (TestFlight en iOS, Internal Testing en Play Store, o directamente Expo Go durante
  el piloto). Requiere una cuenta Expo (gratuita para empezar) y, para iOS, una cuenta de Apple Developer
  de pago si se quiere ir más allá de Expo Go.

## 6. Configuración de autenticación en Supabase (una vez exista el proyecto)

Decisión pendiente: ¿el registro de nuevos aliados/propietarios requiere confirmación por correo antes de
poder ingresar? El código ya maneja ambos casos (`apps/web/src/components/panel/auth-form.tsx`), pero el
comportamiento real depende de la configuración de Auth del proyecto Supabase (Authentication → Providers
→ Email, opción "Confirm email").

## Lo que ya funciona hoy, sin depender de nada de lo anterior

- Directorio público con filtros (categoría, 24/7, búsqueda), ficha de establecimiento, reserva por
  WhatsApp — con los 10 aliados de ejemplo.
- Listado y detalle de adopciones, con formulario de interesado/a.
- Formulario público "Únete al piloto".
- Panel SaaS completo (perfil, horarios, servicios, reservas, publicaciones de adopción) y panel de
  verificación de aliados para admin — con código real contra Supabase, listo para funcionar en cuanto
  exista el proyecto (punto 1).
- App móvil con las mismas 4 secciones (Directorio, Mascotas, Adopciones, Perfil) sobre los mismos datos
  de ejemplo, verificada con `npx expo export --platform web` sin errores.
