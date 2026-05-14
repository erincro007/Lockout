export const THEMES = {
  blue:   { label: 'Cobalt', accent: '#2D5BFF', hover: '#1E45DB', muted: '#EBF0FF', gradFrom: '#2D5BFF', gradTo: '#4A6FFF' },
  pink:   { label: 'Rose',   accent: '#EC4899', hover: '#DB2777', muted: '#FCE7F3', gradFrom: '#EC4899', gradTo: '#F472B6' },
  purple: { label: 'Violet', accent: '#8B5CF6', hover: '#7C3AED', muted: '#EDE9FE', gradFrom: '#8B5CF6', gradTo: '#A78BFA' },
  red:    { label: 'Crimson',accent: '#DC2626', hover: '#B91C1C', muted: '#FEE2E2', gradFrom: '#DC2626', gradTo: '#F87171' },
  green:  { label: 'Emerald',accent: '#10B981', hover: '#059669', muted: '#D1FAE5', gradFrom: '#10B981', gradTo: '#34D399' },
} as const;

export type ThemeKey = keyof typeof THEMES;

export function applyTheme(key: ThemeKey) {
  const t = THEMES[key];
  const r = document.documentElement.style;
  r.setProperty('--accent', t.accent);
  r.setProperty('--accent-hover', t.hover);
  r.setProperty('--accent-muted', t.muted);
  r.setProperty('--accent-grad-from', t.gradFrom);
  r.setProperty('--accent-grad-to', t.gradTo);
}
