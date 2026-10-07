import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        wf: {
          red: 'var(--wf-red)',
          'red-dark': 'var(--wf-red-dark)',
          gold: 'var(--wf-gold)',
          purple: 'var(--wf-purple)',
          'purple-soft': 'var(--wf-purple-soft)',
          amber: 'var(--wf-amber)',
          'amber-soft': 'var(--wf-amber-soft)',
          ink: 'var(--wf-ink)',
          'gray-700': 'var(--wf-gray-700)',
          'gray-300': 'var(--wf-gray-300)',
          cream: 'var(--wf-cream)',
          white: 'var(--wf-white)',
        },
        ok: 'var(--ok)',
        warn: 'var(--warn)',
        err: 'var(--err)',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        phone: '0 25px 50px -12px rgb(0 0 0 / 0.35)',
      },
    },
  },
  plugins: [],
} satisfies Config;
