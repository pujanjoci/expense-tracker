import React from 'react';

export interface AvatarOption {
  id: string;
  name: string;
  category: string;
  gradient: string;
  borderColor: string;
  renderIcon: (props: { className?: string }) => React.ReactElement;
}

export const PROFILE_AVATAR_OPTIONS: AvatarOption[] = [
  {
    id: 'default',
    name: 'Modern Minimalist (Default)',
    category: 'Essential',
    gradient: 'from-slate-800 via-indigo-900 to-slate-950',
    borderColor: 'border-indigo-500/50',
    renderIcon: ({ className = 'w-5 h-5 text-indigo-300' }) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    id: 'executive',
    name: 'Executive Suited',
    category: 'Professional',
    gradient: 'from-slate-900 via-slate-800 to-zinc-950',
    borderColor: 'border-slate-500/50',
    renderIcon: ({ className = 'w-5 h-5 text-slate-300' }) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="10" cy="7" r="3.5" />
        <path d="M14 11l4 2.5-1.5 4.5" />
        <path d="M12 15l2-2" />
      </svg>
    ),
  },
  {
    id: 'wealth',
    name: 'Wealth Crest',
    category: 'Finance',
    gradient: 'from-amber-900 via-yellow-700 to-amber-950',
    borderColor: 'border-amber-400/50',
    renderIcon: ({ className = 'w-5 h-5 text-amber-300' }) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M6 3h12l4 6-10 12L2 9z" />
        <path d="M11 3v6" />
        <path d="M2 9h20" />
      </svg>
    ),
  },
  {
    id: 'cyber',
    name: 'Tech Specialist',
    category: 'Modern',
    gradient: 'from-cyan-950 via-blue-900 to-indigo-950',
    borderColor: 'border-cyan-400/50',
    renderIcon: ({ className = 'w-5 h-5 text-cyan-300' }) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect width="18" height="12" x="3" y="4" rx="2" />
        <line x1="2" x2="22" y1="20" y2="20" />
        <path d="m8 9 2 2-2 2" />
        <line x1="12" x2="16" y1="13" y2="13" />
      </svg>
    ),
  },
  {
    id: 'emerald',
    name: 'Emerald Investor',
    category: 'Growth',
    gradient: 'from-emerald-950 via-teal-900 to-slate-950',
    borderColor: 'border-emerald-400/50',
    renderIcon: ({ className = 'w-5 h-5 text-emerald-300' }) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 2v20" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    id: 'crown',
    name: 'Royalty Club',
    category: 'Premium',
    gradient: 'from-purple-950 via-violet-900 to-slate-950',
    borderColor: 'border-purple-400/50',
    renderIcon: ({ className = 'w-5 h-5 text-purple-300' }) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
      </svg>
    ),
  },
  {
    id: 'phoenix',
    name: 'Solar Flare',
    category: 'Energy',
    gradient: 'from-rose-950 via-orange-900 to-amber-950',
    borderColor: 'border-orange-400/50',
    renderIcon: ({ className = 'w-5 h-5 text-orange-300' }) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    id: 'shield',
    name: 'Titanium Guardian',
    category: 'Security',
    gradient: 'from-zinc-900 via-neutral-800 to-stone-950',
    borderColor: 'border-zinc-400/50',
    renderIcon: ({ className = 'w-5 h-5 text-zinc-300' }) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
];

export interface BannerPreset {
  id: string;
  name: string;
  gradientClass: string;
  previewBg: string;
}

export const PROFILE_BANNER_PRESETS: BannerPreset[] = [
  {
    id: 'midnight',
    name: 'Midnight Obsidian',
    gradientClass: 'bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900',
    previewBg: 'linear-gradient(to right, #020617, #1e1b4b, #0f172a)',
  },
  {
    id: 'emerald',
    name: 'Emerald Forest',
    gradientClass: 'bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-950',
    previewBg: 'linear-gradient(to right, #022c22, #134e4a, #020617)',
  },
  {
    id: 'sunset',
    name: 'Sunset Gold',
    gradientClass: 'bg-gradient-to-r from-amber-950 via-rose-950 to-slate-900',
    previewBg: 'linear-gradient(to right, #451a03, #4c0519, #0f172a)',
  },
  {
    id: 'nebula',
    name: 'Cosmic Nebula',
    gradientClass: 'bg-gradient-to-r from-purple-950 via-fuchsia-950 to-slate-950',
    previewBg: 'linear-gradient(to right, #3b0764, #701a75, #020617)',
  },
  {
    id: 'cyber',
    name: 'Cyber Horizon',
    gradientClass: 'bg-gradient-to-r from-cyan-950 via-blue-950 to-slate-950',
    previewBg: 'linear-gradient(to right, #083344, #172554, #020617)',
  },
  {
    id: 'titanium',
    name: 'Monochrome Titanium',
    gradientClass: 'bg-gradient-to-r from-zinc-900 via-neutral-900 to-black',
    previewBg: 'linear-gradient(to right, #18181b, #171717, #000000)',
  },
];

export function getBannerClass(bannerId?: string): string {
  const found = PROFILE_BANNER_PRESETS.find((b) => b.id === bannerId);
  return found ? found.gradientClass : PROFILE_BANNER_PRESETS[0].gradientClass;
}

export function getBannerStyle(bannerIdOrUrl?: string): React.CSSProperties {
  if (!bannerIdOrUrl) return {};
  if (bannerIdOrUrl.startsWith('data:image') || bannerIdOrUrl.startsWith('http')) {
    return {
      backgroundImage: `url(${bannerIdOrUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }
  const found = PROFILE_BANNER_PRESETS.find((b) => b.id === bannerIdOrUrl);
  if (found) {
    return { background: found.previewBg };
  }
  return {};
}

interface ProfileAvatarProps {
  avatar?: string;
  presetId?: string;
  name?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function ProfileAvatar({
  avatar,
  presetId,
  name,
  className = '',
  size = 'md',
}: ProfileAvatarProps) {
  // Size classes
  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  }[size];

  // 1. Custom uploaded image
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name || 'User Profile'}
        className={`${sizeClasses} rounded-full object-cover border border-white/20 shadow-xs shrink-0 ${className}`}
      />
    );
  }

  // 2. Custom icon preset or default
  const targetId = presetId || 'default';
  const option = PROFILE_AVATAR_OPTIONS.find((opt) => opt.id === targetId) || PROFILE_AVATAR_OPTIONS[0];

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4.5 h-4.5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  }[size];

  return (
    <div
      className={`${sizeClasses} rounded-full bg-gradient-to-br ${option.gradient} border ${option.borderColor} flex items-center justify-center shadow-xs shrink-0 ${className}`}
      title={option.name}
    >
      {option.renderIcon({ className: iconSizes })}
    </div>
  );
}
