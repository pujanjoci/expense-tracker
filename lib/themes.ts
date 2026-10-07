'use client';

export interface ThemeOption {
  id: string;
  name: string;
  description: string;
  accent: string;
  previewBg: string;
  previewCard: string;
  isDark: boolean;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'default',
    name: 'Clean Slate (Light)',
    description: 'Crisp executive light layout with balanced slate contrast',
    accent: '#0f172a',
    previewBg: '#f8fafc',
    previewCard: '#ffffff',
    isDark: false,
  },
  {
    id: 'midnight',
    name: 'Midnight Obsidian (Dark)',
    description: 'High-contrast sleek dark mode with slate & obsidian depth',
    accent: '#6366f1',
    previewBg: '#090d16',
    previewCard: '#0f172a',
    isDark: true,
  },
  {
    id: 'emerald',
    name: 'Cyber Emerald',
    description: 'Modern financial dark theme with vivid emerald & mint accents',
    accent: '#10b981',
    previewBg: '#021812',
    previewCard: '#042f24',
    isDark: true,
  },
  {
    id: 'sapphire',
    name: 'Royal Sapphire',
    description: 'Electric cobalt and oceanic deep blue aesthetic',
    accent: '#38bdf8',
    previewBg: '#031326',
    previewCard: '#082649',
    isDark: true,
  },
  {
    id: 'amber',
    name: 'Obsidian Gold Luxe',
    description: 'Luxury metallic warm gold accents over deep obsidian surfaces',
    accent: '#f59e0b',
    previewBg: '#120f06',
    previewCard: '#221a08',
    isDark: true,
  },
];

export function getSavedTheme(): string {
  if (typeof window === 'undefined') return 'default';
  return localStorage.getItem('expense-tracker-theme') || 'default';
}

export function applyTheme(themeId: string): void {
  if (typeof window === 'undefined') return;
  const theme = THEME_OPTIONS.find((t) => t.id === themeId) || THEME_OPTIONS[0];
  document.documentElement.setAttribute('data-theme', theme.id);
  if (theme.isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  localStorage.setItem('expense-tracker-theme', theme.id);
  window.dispatchEvent(new CustomEvent('expense-tracker-theme-changed', { detail: theme.id }));
}

export function initTheme(): void {
  if (typeof window === 'undefined') return;
  const saved = getSavedTheme();
  applyTheme(saved);
}
