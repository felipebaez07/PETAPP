# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/petapp/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** PetApp (nombre provisional)
**Generated:** 2026-08-17
**Category:** Directory / Booking / Marketplace — Trust & Authority (curated override, not the raw `--design-system` match)

**Why overridden:** the automatic match defaulted to "Claymorphism" (playful, kids/mascot-app style) because the query contained "pet". The source business documents (PDD, Scope Canvas, propuesta) already establish a **professional, trust-first** visual identity — dark navy headers, teal-green section accents, plain sans-serif body text, formal tables. This platform brokers veterinary/health decisions and B2B SaaS subscriptions, so it must read as credible and calm, not toylike. Claymorphism is rejected as an anti-pattern here.

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| Primary (Navy) | `#123A5C` | `--color-primary` | Headers, nav, primary buttons, links |
| On Primary | `#FFFFFF` | `--color-on-primary` | Text/icons on navy |
| Primary Dark | `#0B2540` | `--color-primary-dark` | Hover/active state, dark-mode surfaces |
| Secondary (Teal) | `#0F766E` | `--color-secondary` | Section accents, secondary buttons, active nav |
| On Secondary | `#FFFFFF` | `--color-on-secondary` | Text on teal |
| Accent (Amber) | `#D97706` | `--color-accent` | Adoption / social-impact CTAs only (semantic: "warm, human") |
| On Accent | `#FFFFFF` | `--color-on-accent` | Text on amber |
| Success / Verified | `#059669` | `--color-success` | "Verificado" badge, active/open status |
| Background | `#F8FAFC` | `--color-background` | App background |
| Background Alt | `#F0FDFA` | `--color-background-alt` | Teal-tinted section background |
| Foreground | `#0F172A` | `--color-foreground` | Primary text |
| Card | `#FFFFFF` | `--color-card` | Card surfaces |
| Muted | `#EDF2F5` | `--color-muted` | Subtle fills, chips, skeletons |
| Muted Foreground | `#64748B` | `--color-muted-foreground` | Secondary/help text |
| Border | `#DCE6EA` | `--color-border` | Dividers, input borders |
| Destructive | `#DC2626` | `--color-destructive` | Errors, cancel actions |
| On Destructive | `#FFFFFF` | `--color-on-destructive` | Text on red |
| Ring | `#123A5C` | `--color-ring` | Focus ring |

**Semantic rule:** navy+teal = trust/clinical surfaces (directorio, reservas, perfiles, SaaS dashboard). Amber is reserved *exclusively* for adoption/social-impact content so it reads as a distinct emotional register, never used for generic CTAs.

**Dark mode:** background → `#0B1220`, card → `#111C2E`, foreground → `#E6EDF3`, border → `#1E2E42`, keep primary/secondary/accent hexes but raise lightness ~8% for AA contrast on dark surfaces.

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
  --color-primary: #123A5C;
  --color-primary-dark: #0B2540;
  --color-secondary: #0F766E;
  --color-accent: #D97706;
  --color-success: #059669;
  --color-background: #F8FAFC;
  --color-background-alt: #F0FDFA;
  --color-foreground: #0F172A;
  --color-card: #FFFFFF;
  --color-muted: #EDF2F5;
  --color-muted-foreground: #64748B;
  --color-border: #DCE6EA;
  --color-destructive: #DC2626;
  --color-ring: #123A5C;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
}
.dark {
  --color-background: #0B1220;
  --color-card: #111C2E;
  --color-foreground: #E6EDF3;
  --color-border: #1E2E42;
  --color-muted: #16233A;
  --color-muted-foreground: #93A2B8;
}
```

Buttons: primary = navy fill / white text, 8–12px radius, 150–200ms transition, hover = primary-dark, focus-visible ring in `--color-ring`. Secondary/outline = teal border+text, transparent fill. Destructive = red fill for cancel/delete confirmations only. Never use emoji as icons — Lucide icon set throughout (web and RN via `lucide-react` / `lucide-react-native`).

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
