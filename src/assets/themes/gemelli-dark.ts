import { definePreset } from '@primeuix/themes';
import { GemelliLight } from "./gemelli-light";

export const GemelliDark = definePreset(GemelliLight, {
  semantic: {
    colorScheme: {
      dark: {
        surface: {
          0:   '#020617',   // slate-950 — sfondo pagina
          50:  '#0f172a',   // slate-900
          100: '#1e293b',   // slate-800 — card surface
          200: '#334155',   // slate-700 — bordi, elevati
          300: '#475569',   // slate-600
          400: '#64748b',   // slate-500
          500: '#94a3b8',   // slate-400
          600: '#cbd5e1',   // slate-300
          700: '#e2e8f0',   // slate-200
          800: '#f1f5f9',   // slate-100
          900: '#f8fafc',   // slate-50
          950: '#ffffff'
        },
        content: {
          color:     '#e2e8f0',
          weakColor: '#94a3b8'
        },
        focusRing: {
          width: '2px',
          style: 'solid',
          color: '{primary.400}',
          offset: '0px'
        }
      }
    }
  }
});
