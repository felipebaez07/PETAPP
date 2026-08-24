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
│   ├── migrations/ # Esquema SQL (tablas, enums, RLS): 0001_init, 0002_products, 0003_forum, 0004_bugfixes
│   └── seed.sql    # 27 aliados reales de Ibagué (pendientes de verificación, ver docs/NEXT_STEPS.md) + demo de adopciones
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

## Estado actual

Hay un proyecto Supabase real conectado (`NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` en
web, `EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_ANON_KEY` en mobile) con las cuatro migraciones
aplicadas y 27 aliados reales de Ibagué (sin verificar todavía). Si algún `.env.local` no está presente,
ambas apps caen automáticamente al modo demo (`DEMO_ESTABLISHMENTS`, `DEMO_PRODUCTS`, `DEMO_FORUM_POSTS`,
`DEMO_ADOPTION_POSTS` de `@petapp/shared`) para seguir siendo navegables sin backend. Login con Google
conectado en web. Ver `docs/NEXT_STEPS.md` para el detalle de qué falta y qué se corrigió.

## Cómo correr cada app

```bash
npm install                 # una sola vez, en la raíz — instala todo el monorepo

npm run dev:web             # http://localhost:3000 — directorio público + panel SaaS + admin
npm run dev:mobile          # abre Expo Dev Tools (Expo Go, simulador, o navegador con `w`)

npm run typecheck           # valida los tres paquetes (web, mobile, shared)
```

## Diseño

El sistema de diseño completo (paleta azul clínico + verde menta + blanco — v2, ver más abajo —,
tipografía Lexend + Source Sans 3, reglas de componentes y anti-patrones) está en
`design-system/petapp/MASTER.md`. Es una anulación deliberada de un estilo "claymorphism" que una
herramienta de recomendación automática sugirió por defecto — se rechazó explícitamente porque este
producto maneja decisiones de salud animal y suscripciones B2B, y debe verse profesional y confiable,
no infantil. La paleta se actualizó de navy+teal a azul+menta a pedido explícito, manteniendo la misma
categoría de estilo (Trust & Authority) y los mismos anti-patrones.
