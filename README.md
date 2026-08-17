# PetApp (nombre provisional) — Plataforma de Bienestar Animal, Fase 1 · Piloto Ibagué

Monorepo con las dos superficies de producto de la Fase 1 descritas en el PDD: una **app móvil** para
propietarios de mascotas y un **panel web (SaaS)** para establecimientos aliados y administración del
piloto, sobre un **backend compartido en Supabase**.

## Estructura

```
petapp/
├── apps/
│   ├── mobile/     # Expo + Expo Router + NativeWind — app para propietarios
│   └── web/        # Next.js (App Router) + Tailwind v4 — directorio público + panel SaaS + admin
├── packages/
│   └── shared/     # Tipos, esquemas zod, constantes, helpers de WhatsApp, datos de demo — @petapp/shared
├── supabase/
│   ├── migrations/ # Esquema SQL (tablas, enums, RLS) — supabase/migrations/0001_init.sql
│   └── seed.sql    # Datos de ejemplo (10 aliados + 4 publicaciones de adopción ficticias)
├── design-system/  # Sistema de diseño (paleta, tipografía, guías) — design-system/petapp/MASTER.md
└── docs/
    └── NEXT_STEPS.md  # Qué falta y qué se necesita del equipo/negocio para pasar de demo a real
```

## Stack

- **Backend**: Supabase (Postgres + Auth + RLS + Storage). Ver esquema completo en `supabase/migrations/0001_init.sql`.
- **Web (SaaS + directorio público)**: Next.js 16 (App Router, Server Actions), Tailwind CSS v4, componentes
  propios estilo shadcn/ui sobre Radix, `@supabase/ssr`.
- **Móvil**: Expo SDK 57, Expo Router, NativeWind v4, `lucide-react-native`.
- **Compartido**: `@petapp/shared` (workspace package, TypeScript puro sin paso de build) con tipos que
  reflejan 1:1 el esquema de la base de datos, validaciones `zod`, y los helpers de WhatsApp que
  implementan el flujo de reservas manuales de la Fase 1.

## Modo demo (estado actual)

**Todavía no hay un proyecto Supabase real conectado.** Mientras no se definan `NEXT_PUBLIC_SUPABASE_URL` /
`NEXT_PUBLIC_SUPABASE_ANON_KEY` (web) y `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` (móvil),
ambas apps sirven los datos de ejemplo de `@petapp/shared` (`DEMO_ESTABLISHMENTS`, `DEMO_ADOPTION_POSTS`) —
la app es completamente navegable y demostrable hoy, pero sin persistencia real ni autenticación funcional.
Ver `docs/NEXT_STEPS.md` para lo que falta para pasar a producción real.

## Cómo correr cada app

```bash
npm install                 # una sola vez, en la raíz — instala todo el monorepo

npm run dev:web             # http://localhost:3000 — directorio público + panel SaaS + admin
npm run dev:mobile          # abre Expo Dev Tools (Expo Go, simulador, o navegador con `w`)

npm run typecheck           # valida los tres paquetes (web, mobile, shared)
```

## Diseño

El sistema de diseño completo (paleta navy/teal, tipografía Lexend + Source Sans 3, reglas de
componentes y anti-patrones) está en `design-system/petapp/MASTER.md`. Es una anulación deliberada de un
estilo "claymorphism" que una herramienta de recomendación automática sugirió por defecto — se rechazó
explícitamente porque este producto maneja decisiones de salud animal y suscripciones B2B, y debe verse
profesional y confiable, no infantil.
