/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0F172A',
        foreground: '#F8FAFC',
        card: '#1E293B',
        muted: '#272F42',
        'muted-foreground': '#64748B',
        border: '#475569',
        accent: '#22C55E',
        destructive: '#EF4444',
        // node roles (Okabe-Ito, colorblind-safe)
        'role-entry': '#E69F00',
        'role-module': '#56B4E9',
        'role-interface': '#009E73',
        'role-method': '#CC79A7',
        'role-leaf': '#94A3B8',
      },
      fontFamily: {
        mono: ['Fira Code', 'ui-monospace', 'monospace'],
        sans: ['Fira Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
