'use client';

export interface ThemeOption {
  id: string;
  name: string;
  tag: string;
  badge?: string;
  description: string;
  accent: string;
  previewBg: string;
  previewCard: string;
  previewText: string;
  previewMuted: string;
  previewBorder: string;
  incomeColor: string;
  expenseColor: string;
  isDark: boolean;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'paper',
    name: 'Paper Ledger',
    tag: 'Archival Journal',
    badge: 'Tactile Vibe',
    description: 'Warm cream parchment with fountain-pen charcoal ink and vintage brass accents',
    accent: '#b45309',
    previewBg: '#fbf9f4',
    previewCard: '#ffffff',
    previewText: '#23211e',
    previewMuted: '#78716c',
    previewBorder: '#e6dfcf',
    incomeColor: '#15803d',
    expenseColor: '#b91c1c',
    isDark: false,
  },
  {
    id: 'default',
    name: 'Clean Slate',
    tag: 'Swiss Accounting',
    badge: 'Classic Light',
    description: 'High-contrast snow-white canvas with precision typography and balanced slate',
    accent: '#6366f1',
    previewBg: '#f8fafc',
    previewCard: '#ffffff',
    previewText: '#0f172a',
    previewMuted: '#64748b',
    previewBorder: '#e2e8f0',
    incomeColor: '#10b981',
    expenseColor: '#f43f5e',
    isDark: false,
  },
  {
    id: 'aurora-dark',
    name: 'Executive Obsidian',
    tag: 'Wall Street Terminal',
    badge: 'Obsidian Matte',
    description: 'Deep matte obsidian canvas with graphite cards and electric violet accents',
    accent: '#8b5cf6',
    previewBg: '#090d16',
    previewCard: '#101623',
    previewText: '#f8fafc',
    previewMuted: '#94a3b8',
    previewBorder: 'rgba(255, 255, 255, 0.1)',
    incomeColor: '#10b981',
    expenseColor: '#f43f5e',
    isDark: true,
  },
  {
    id: 'midnight',
    name: 'Nordic Cyan',
    tag: 'Modern Fintech',
    badge: 'High Contrast',
    description: 'Deep oceanic navy with crisp arctic cyan highlights and high luminosity',
    accent: '#38bdf8',
    previewBg: '#060b14',
    previewCard: '#0c1524',
    previewText: '#f0f6fc',
    previewMuted: '#8b9bb4',
    previewBorder: 'rgba(56, 189, 248, 0.2)',
    incomeColor: '#34d399',
    expenseColor: '#fb7185',
    isDark: true,
  },
  {
    id: 'emerald',
    name: 'Forest Terminal',
    tag: 'Hedge Fund Desk',
    badge: 'Bloomberg Vibe',
    description: 'Trading desk aesthetic with deep pine canvas and luminous cyber emerald',
    accent: '#10b981',
    previewBg: '#02140e',
    previewCard: '#052319',
    previewText: '#ecfdf5',
    previewMuted: '#6ee7b7',
    previewBorder: 'rgba(16, 185, 129, 0.22)',
    incomeColor: '#10b981',
    expenseColor: '#f87171',
    isDark: true,
  },
  {
    id: 'amber',
    name: 'Obsidian Gold',
    tag: 'Private Vault',
    badge: 'Prestige Luxe',
    description: 'Swiss private banking luxury with basalt canvas and champagne gold accents',
    accent: '#f59e0b',
    previewBg: '#0d0a06',
    previewCard: '#18130b',
    previewText: '#fefce8',
    previewMuted: '#d4b584',
    previewBorder: 'rgba(245, 158, 11, 0.25)',
    incomeColor: '#22c55e',
    expenseColor: '#ef4444',
    isDark: true,
  },
  {
    id: 'sand',
    name: 'Desert Sand',
    tag: 'Terracotta Ledger',
    badge: 'Warm Earth',
    description: 'Dune-toned warm sand parchment with rich terracotta ink and desert stone accents',
    accent: '#c2410c',
    previewBg: '#f7f3ec',
    previewCard: '#ffffff',
    previewText: '#292524',
    previewMuted: '#78716c',
    previewBorder: '#e7dfd4',
    incomeColor: '#16a34a',
    expenseColor: '#dc2626',
    isDark: false,
  },
  {
    id: 'matcha',
    name: 'Matcha Botanical',
    tag: 'Mindful Finance',
    badge: 'Zen Sage',
    description: 'Serene organic sage cream canvas with deep bamboo charcoal ink and moss accents',
    accent: '#15803d',
    previewBg: '#f4f6f1',
    previewCard: '#ffffff',
    previewText: '#1c241d',
    previewMuted: '#627063',
    previewBorder: '#dbe2d8',
    incomeColor: '#16a34a',
    expenseColor: '#e11d48',
    isDark: false,
  },
  {
    id: 'carbon',
    name: 'Monochrome Carbon',
    tag: 'Minimalist Ledger',
    badge: 'Pure Black',
    description: 'High-contrast pitch-black OLED canvas with silver typography and titanium lines',
    accent: '#ffffff',
    previewBg: '#050505',
    previewCard: '#0f0f10',
    previewText: '#ffffff',
    previewMuted: '#a1a1aa',
    previewBorder: 'rgba(255, 255, 255, 0.14)',
    incomeColor: '#4ade80',
    expenseColor: '#f87171',
    isDark: true,
  },
  {
    id: 'rose-gold',
    name: 'Rose Gold Vault',
    tag: 'Prestige Reserve',
    badge: 'Luxe Copper',
    description: 'Deep espresso bronze canvas with warm brushed rose gold and champagne borders',
    accent: '#fb7185',
    previewBg: '#110a0c',
    previewCard: '#1d1216',
    previewText: '#fff1f2',
    previewMuted: '#fda4af',
    previewBorder: 'rgba(251, 113, 133, 0.22)',
    incomeColor: '#34d399',
    expenseColor: '#fb7185',
    isDark: true,
  },
  {
    id: 'cobalt',
    name: 'Royal Treasury',
    tag: 'Central Banking',
    badge: 'Cobalt Sapphire',
    description: 'Sovereign deep sapphire navy canvas with vibrant royal cobalt blue and crisp silver',
    accent: '#3b82f6',
    previewBg: '#050c1e',
    previewCard: '#0a1633',
    previewText: '#f0f9ff',
    previewMuted: '#93c5fd',
    previewBorder: 'rgba(59, 130, 246, 0.24)',
    incomeColor: '#38bdf8',
    expenseColor: '#f43f5e',
    isDark: true,
  },
];

export function isDarkTheme(themeId: string): boolean {
  if (themeId === 'aurora-light') return false;
  const theme = THEME_OPTIONS.find((t) => t.id === themeId);
  return theme ? theme.isDark : true;
}

export function getSavedTheme(): string {
  if (typeof window === 'undefined') return 'aurora-dark';
  return localStorage.getItem('expense-tracker-theme') || 'aurora-dark';
}

export function applyTheme(themeId: string): void {
  if (typeof window === 'undefined') return;
  // Map legacy aurora-light to paper
  const resolvedId = themeId === 'aurora-light' ? 'paper' : themeId;
  const theme = THEME_OPTIONS.find((t) => t.id === resolvedId) || THEME_OPTIONS[0];
  document.documentElement.setAttribute('data-theme', theme.id);
  if (theme.isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  localStorage.setItem('expense-tracker-theme', theme.id);
  window.dispatchEvent(new CustomEvent('expense-tracker-theme-changed', { detail: theme.id }));
}

export function toggleDarkLight(): string {
  const current = getSavedTheme();
  const currentlyDark = isDarkTheme(current);
  // Toggle between Paper (warm light) and Executive Obsidian (dark)
  const nextTheme = currentlyDark ? 'paper' : 'aurora-dark';
  applyTheme(nextTheme);
  return nextTheme;
}

export function initTheme(): void {
  if (typeof window === 'undefined') return;
  const saved = getSavedTheme();
  applyTheme(saved);

  // Initialize privacy mode class
  if (getPrivacyMode()) {
    document.documentElement.classList.add('privacy-blur');
  } else {
    document.documentElement.classList.remove('privacy-blur');
  }
}

// ================= PRIVACY MODE =================
export function getPrivacyMode(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('expense-tracker-privacy-mode') === 'true';
}

export function setPrivacyMode(enabled: boolean): boolean {
  if (typeof window === 'undefined') return enabled;
  localStorage.setItem('expense-tracker-privacy-mode', enabled ? 'true' : 'false');
  if (enabled) {
    document.documentElement.classList.add('privacy-blur');
  } else {
    document.documentElement.classList.remove('privacy-blur');
  }
  window.dispatchEvent(new CustomEvent('expense-tracker-privacy-changed', { detail: enabled }));
  return enabled;
}

export function togglePrivacyMode(): boolean {
  const current = getPrivacyMode();
  return setPrivacyMode(!current);
}
