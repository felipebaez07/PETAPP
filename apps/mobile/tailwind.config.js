/** @type {import('tailwindcss').Config} */
// Tokens copiados literalmente de `design-system/petapp/MASTER.md` y
// `packages/shared/src/constants.ts` (COLORS). No se importan desde
// `@petapp/shared` porque ese paquete es TypeScript/ESM fuente sin build
// (ver package.json de packages/shared: "main": "./src/index.ts") y este
// archivo lo ejecuta Node directamente, sin pasar por Babel/Metro. Si cambian
// los tokens del design system, actualiza los tres lugares.
const COLORS = {
  primary: '#0369A1',
  primaryDark: '#075985',
  secondary: '#10B981',
  secondaryForeground: '#0C2233',
  accent: '#D97706',
  success: '#059669',
  background: '#F8FAFC',
  backgroundAlt: '#ECFDF5',
  foreground: '#0C2233',
  card: '#FFFFFF',
  muted: '#E7EEF2',
  mutedForeground: '#64748B',
  border: '#D6E4EA',
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
