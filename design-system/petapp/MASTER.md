# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/petapp/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** PetApp (nombre provisional)
**Generated:** 2026-08-17
**Category:** Directory / Booking / Marketplace — Trust & Authority (curated override, not the raw `--design-system` match)

**Why overridden:** the automatic match defaulted to "Claymorphism" (playful, kids/mascot-app style) because the query contained "pet". The source business documents (PDD, Scope Canvas, propuesta) already establish a **professional, trust-first** visual identity — dark navy headers, teal-green section accents, plain sans-serif body text, formal tables. This platform brokers veterinary/health decisions and B2B SaaS subscriptions, so it must read as credible and calm, not toylike. Claymorphism is rejected as an anti-pattern here.

**Palette v2 (current):** the original navy+teal palette below was replaced with a clinical-blue + mint-green palette (same "Trust & Authority" category, same anti-patterns) after an explicit request for "blanco, verde menta, azules — profundidad, rigor, estilo profesional." Chosen using validated Tailwind-scale swatches (via the ui-ux-pro-max palette database) rather than freehand hex, structured by semantic role per the `impeccable` skill's colorize methodology. `accent` (amber, adoption-only) and `destructive` (red) are intentionally unchanged — they're separate, already-validated semantic decisions, not part of the brand-hue refresh.

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| Primary (Clinical Blue) | `#0369A1` | `--color-primary` | Headers, nav, primary buttons, links |
| On Primary | `#FFFFFF` | `--color-on-primary` | Text/icons on blue |
| Primary Dark | `#075985` | `--color-primary-dark` | Hover/active state, dark-mode surfaces |
| Secondary (Mint) | `#10B981` | `--color-secondary` | Section accents, secondary buttons, active nav |
| On Secondary | `#0C2233` | `--color-on-secondary` | Text on mint — mint is too light for white text at AA |
| Accent (Amber) | `#D97706` | `--color-accent` | Adoption / social-impact CTAs only (semantic: "warm, human") — unchanged |
| On Accent | `#FFFFFF` | `--color-on-accent` | Text on amber |
| Success / Verified | `#059669` | `--color-success` | "Verificado" badge, active/open status — deeper green than `secondary` so brand ≠ status |
| Background | `#F8FAFC` | `--color-background` | App background |
| Background Alt | `#ECFDF5` | `--color-background-alt` | Mint-tinted section background |
| Foreground | `#0C2233` | `--color-foreground` | Primary text — deep blue-charcoal instead of neutral slate, for brand cohesion |
| Card | `#FFFFFF` | `--color-card` | Card surfaces |
| Muted | `#E7EEF2` | `--color-muted` | Subtle fills, chips, skeletons |
| Muted Foreground | `#64748B` | `--color-muted-foreground` | Secondary/help text |
| Border | `#D6E4EA` | `--color-border` | Dividers, input borders |
| Destructive | `#DC2626` | `--color-destructive` | Errors, cancel actions — unchanged |
| On Destructive | `#FFFFFF` | `--color-on-destructive` | Text on red |
| Ring | `#0369A1` | `--color-ring` | Focus ring |

**Semantic rule:** blue+mint = trust/clinical surfaces (directorio, reservas, perfiles, SaaS dashboard, marketplace, foro). Amber is reserved *exclusively* for adoption/social-impact content so it reads as a distinct emotional register, never used for generic CTAs.

**Dark mode:** background → `#0A1520`, card → `#0F1F2B`, foreground → `#E7F2EF`, border → `#1C3340`, muted → `#142430`, muted-foreground → `#93A2B8`; `primary` brightens to `#38BDF8` and `secondary` to `#34D399` so both stay legible on a dark surface (a straight lightness bump of the light-mode hex would under-contrast).

### Typography

- **Heading Font:** Lexend (600/700) — geometric, high-legibility, built for reading-accessibility research; also doubles as the "authority" voice for section titles.
- **Body Font:** Source Sans 3 (400/500/600) — neutral, highly legible at small sizes, wide language/glyph support.
- **Mood:** clear, calm, accessible, professional, never twee.
- **Google Fonts CSS:**
```css
@import url('https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700&family=Source+Sans+3:wght@400;500;600;700&display=swap');
```
- **Tailwind:** `fontFamily: { heading: ['Lexend', 'sans-serif'], body: ['Source Sans 3', 'sans-serif'] }`
- **Scale:** base 16px / 1rem, line-height 1.5 body / 1.25 headings. h1 32–40px, h2 24–28px, h3 20px, body 16px, small/help 14px — never below 12px.

### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` | Tight gaps (icon+label) |
| `--space-sm` | `8px` | Inline spacing |
| `--space-md` | `16px` | Standard padding |
| `--space-lg` | `24px` | Section padding |
| `--space-xl` | `32px` | Large gaps |
| `--space-2xl` | `48px` | Section margins |
| `--space-3xl` | `64px` | Hero padding (web only) |

### Radius & Shadow

- Radius: `--radius-sm 8px` (inputs/chips), `--radius-md 12px` (cards), `--radius-lg 16px` (modals/sheets). No claymorphism-style 30–50px blob radii.
- Shadows: flat/minimal — `--shadow-sm 0 1px 2px rgba(15,23,42,0.06)`, `--shadow-md 0 4px 10px rgba(15,23,42,0.08)`, `--shadow-lg 0 12px 24px rgba(15,23,42,0.12)`. No multi-layer clay stacks, no glow/blur glass effects.

---

## Style Guidelines

**Style:** Trust & Authority + Minimalism / Flat Design (override of the auto-suggested Claymorphism).

**Keywords:** flat, calm, verified, credible, accessible, clinical-but-warm, data-forward.

**Best for:** health/booking directories, B2B SaaS dashboards, civic-adjacent platforms (CAPA, fundaciones) where misplaced playfulness undermines trust.

**Key effects allowed:** subtle 150–250ms transitions, 1–2px hover lift on cards, skeleton loading states, verified-badge micro-icon (shield/check, Lucide `ShieldCheck` or `BadgeCheck`), status dots (green=abierto/24h, gray=cerrado). No bounce/spring/squish, no gradients as primary decoration (a soft navy→teal gradient is allowed *only* in the hero background, nowhere else), no floating blobs, no heavy blur/glass.

### Page Pattern — Directory / Listing (web) + Filter-heavy list (mobile)

- **Conversion strategy:** search + filters *is* the primary action, not a decorative hero. Filters: horario, distancia, servicio, atención 24/7 — always visible, never buried in a menu on desktop; a bottom sheet on mobile.
- **Section order (web home/directory):** 1) Search + filter bar, 2) Category chips (veterinaria / comercio / profesional / fundación), 3) Results grid with verified badge + status + distance, 4) Map toggle, 5) "¿Tienes un negocio? Únete al piloto" CTA (secondary, not competing with search).
- **Establishment detail:** header (name, category, verified badge, status), horarios table, servicios list, ubicación/map, botón primario "Reservar por WhatsApp" (deep link, since reservations are manual in Fase 1) — this button uses `--color-secondary` (teal), not amber.
- **Mascota profile:** photo, especie/raza/edad, ficha médica básica (vacunas, esterilización), owned by propietario only.
- **Adoption listing:** uses the amber accent sparingly (tag/badge only) inside an otherwise navy/teal shell — keeps social warmth without breaking system consistency.

---

## Component Specs (Tailwind/shadcn tokens — web)

```css
:root {
  --color-primary: #0369A1;
  --color-primary-dark: #075985;
  --color-secondary: #10B981;
  --color-secondary-foreground: #0C2233;
  --color-accent: #D97706;
  --color-success: #059669;
  --color-background: #F8FAFC;
  --color-background-alt: #ECFDF5;
  --color-foreground: #0C2233;
  --color-card: #FFFFFF;
  --color-muted: #E7EEF2;
  --color-muted-foreground: #64748B;
  --color-border: #D6E4EA;
  --color-destructive: #DC2626;
  --color-ring: #0369A1;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
}
.dark {
  --color-background: #0A1520;
  --color-card: #0F1F2B;
  --color-foreground: #E7F2EF;
  --color-border: #1C3340;
  --color-muted: #142430;
  --color-muted-foreground: #93A2B8;
  --color-primary: #38BDF8;
  --color-secondary: #34D399;
}
```

Buttons: primary = clinical-blue fill / white text, 8–12px radius, 150–200ms transition, hover = primary-dark, focus-visible ring in `--color-ring`. Secondary/outline = mint border+text (dark text if filled — mint is too light for white text), transparent fill. Destructive = red fill for cancel/delete confirmations only. Never use emoji as icons — Lucide icon set throughout (web and RN via `lucide-react` / `lucide-react-native`).

---

## Anti-Patterns (Do NOT Use)

- ❌ Claymorphism / clay shadows / squish-on-press / floating blobs (rejected override — see note above)
- ❌ Playful mascot illustration style as the primary visual language
- ❌ Emojis as icons
- ❌ Generic/unverified-looking listings (every establishment card must show verification state explicitly)
- ❌ Hiding filters behind a secondary menu on desktop
- ❌ Low-contrast text, missing focus states, missing `cursor-pointer` on clickable elements
- ❌ Amber/accent color used outside adoption/social-impact context

---

## Motion & Materials (addendum 2026-09-01 — guía `apple-design`)

Aplica al rediseño del pivot preventivo (web Next.js/Motion y mobile Expo/Reanimated). Objetivo:
pulido, seguro, cálido — nunca clínico-frío ni juguetón/rebotoso.

**Springs por defecto (no `ease`/`keyframes` fijos en nada que el usuario pueda tocar/arrastrar):**

| Interacción | Damping | Response/duración | Web (Motion) | Mobile (Reanimated) |
|---|---|---|---|---|
| Aparecer/mover por defecto (cards, modales, navegación) | Crítico (sin rebote) | 0.3–0.4s | `{ type:'spring', bounce:0, duration:0.35 }` | `withSpring(v,{damping:26,stiffness:220,mass:1})` |
| Sheet/bottom-sheet/drawer (filtros, "Solicitar cita") | Ligero rebote | 0.3s | `{ type:'spring', bounce:0.15, duration:0.3 }` | `withSpring(v,{damping:18,stiffness:180})` |
| Gesto con momentum (swipe para completar recordatorio, arrastrar para reordenar) | Rebote leve, solo si hubo velocidad de gesto | 0.3–0.4s | `{ type:'spring', bounce:0.2, duration:0.35 }`, con `velocity` del gesto | `withSpring(v,{damping:14,stiffness:160})` tomando `event.velocityY/X` |

- **Feedback en el press, no en el release**: `active:` / `Pressable onPressIn` escala a `0.97` en ≤100ms — nunca esperar al `onPress`.
- **Nunca animar algo arrastrable con `transition` CSS o `Animated.timing`** — deben poder soltarse e invertirse a mitad de gesto (interruptibilidad).
- **Listas que aparecen** (calendario preventivo, directorio, mascotas): fade + `translateY` de 8–12px, 200–300ms, stagger de 30–50ms por fila, tope de las primeras 8 filas (después sin stagger, para no sentirse lento).
- **Transiciones de pantalla**: entrar y salir por el mismo eje (push/pop simétrico); un sheet que sube se cierra bajando por el mismo camino, nunca por otro lado.
- **Materiales translúcidos**: solo en chrome flotante con contenido debajo (tab bar mobile, header sticky web) — `backdrop-filter: blur(20px) saturate(180%)` sobre `rgba(255,255,255,0.7)` en light / `rgba(10,21,32,0.75)` en dark. Nunca apilar dos superficies translúcidas. El texto sobre un fondo translúcido va en `--color-foreground` sólido, nunca gris apagado.
- **`prefers-reduced-motion`**: reemplazar todo spring/slide por cross-fade de opacidad, 150–200ms, sin overshoot. En mobile, leer `AccessibilityInfo.isReduceMotionEnabled()` y aplicar el mismo criterio.
- **Micro-delight con propósito, no decorativo**: una vacuna marcada como completada dispara un check con spring de rebote leve (sensación de logro/alivio, coherente con el "espacio seguro" del producto) — no confeti ni sonidos, solo motion + color `--color-success`.

## Pre-Delivery Checklist

- [ ] No emojis used as icons (Lucide only)
- [ ] `cursor-pointer` on all clickable elements (web)
- [ ] Hover/press states with 150–300ms transitions
- [ ] Text contrast ≥ 4.5:1 in both light and dark mode
- [ ] Visible focus states for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px (web); safe-area insets respected (mobile)
- [ ] Verified/status badges present on every establishment card and detail view
- [ ] Amber accent only appears in adoption/social-impact contexts
