/** @type {import('tailwindcss').Config} */
// Tokens copiados literalmente de `design-system/petapp/MASTER.md` y
// `packages/shared/src/constants.ts` (COLORS). No se importan desde
// `@petapp/shared` porque ese paquete es TypeScript/ESM fuente sin build
// (ver package.json de packages/shared: "main": "./src/index.ts") y este
// archivo lo ejecuta Node directamente, sin pasar por Babel/Metro. Si cambian
// los tokens del design system, actualiza los tres lugares.
const COLORS = {
  primary: '#123A5C',
  primaryDark: '#0B2540',
  secondary: '#0F766E',
  accent: '#D97706',
  success: '#059669',
  background: '#F8FAFC',
  backgroundAlt: '#F0FDFA',
  foreground: '#0F172A',
  card: '#FFFFFF',
  muted: '#EDF2F5',
  mutedForeground: '#64748B',
  border: '#DCE6EA',
  destructive: '#DC2626',
};

module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './contexts/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: COLORS,
      fontFamily: {
        heading: ['Lexend_600SemiBold'],
        headingBold: ['Lexend_700Bold'],
        body: ['SourceSans3_400Regular'],
        bodyMedium: ['SourceSans3_500Medium'],
        bodySemibold: ['SourceSans3_600SemiBold'],
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
      },
    },
  },
  plugins: [],
};
