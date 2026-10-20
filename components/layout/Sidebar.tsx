'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  WalletCards,
  ChartNoAxesCombined,
  SlidersHorizontal,
  Settings,
  Plus,
  RefreshCw,
  MailCheck,
  PiggyBank,
  Target,
  Repeat,
  Eye,
  EyeOff,
  Sun,
  Moon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/AppContext';
import { AppUser, getCurrentAppUser, isGuestUser } from '@/lib/api';
import { ProfileAvatar, getBannerStyle } from '@/lib/profile-avatars';
import { toggleDarkLight, togglePrivacyMode, getPrivacyMode, getSavedTheme, isDarkTheme } from '@/lib/themes';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
  { label: 'Accounts', href: '/accounts', icon: WalletCards },
  { label: 'Savings Goals', href: '/savings', icon: PiggyBank },
  { label: 'Budgets & Alerts', href: '/budgets', icon: Target },
  { label: 'Subscriptions & Bills', href: '/recurring', icon: Repeat },
  { label: 'Analytics', href: '/analytics', icon: ChartNoAxesCombined },
  { label: 'Categories', href: '/categories', icon: SlidersHorizontal },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isPrivacy, setIsPrivacy] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    setCurrentUser(getCurrentAppUser());
    setIsPrivacy(getPrivacyMode());
    const currentTheme = getSavedTheme();
    setIsDark(isDarkTheme(currentTheme));

    const handleUserUpdate = (e: any) => {
      if (e.detail) setCurrentUser(e.detail);
      else setCurrentUser(getCurrentAppUser());
    };
    const handlePrivacy = (e: any) => setIsPrivacy(e.detail);
    const handleTheme = (e: any) => {
      setIsDark(isDarkTheme(e.detail));
    };

    window.addEventListener('expense-tracker-user-updated', handleUserUpdate);
    window.addEventListener('expense-tracker-privacy-changed', handlePrivacy);
    window.addEventListener('expense-tracker-theme-changed', handleTheme);
    return () => {
      window.removeEventListener('expense-tracker-user-updated', handleUserUpdate);
      window.removeEventListener('expense-tracker-privacy-changed', handlePrivacy);
      window.removeEventListener('expense-tracker-theme-changed', handleTheme);
    };
  }, []);

  const pathname = usePathname();
  const { openAddTransaction, isSyncing, syncStatus, refreshData, syncBankEmails, settings } = useApp();

  return (
    <aside className="hidden lg:flex flex-col w-64 aurora-glass border-r border-slate-200 dark:border-slate-800/80 h-screen sticky top-0 shrink-0 z-30 select-none">
      {/* Header / Brand */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800/60 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform">
            <WalletCards className="h-5 w-5" />
          </div>
          <div>
            <span className="font-display font-bold text-slate-900 dark:text-slate-100 tracking-tight text-base block leading-tight">
              Expense Tracker
            </span>
            <span className="text-[10px] text-violet-600 dark:text-violet-400 font-semibold tracking-wider uppercase block">
              Personal Finance
            </span>
          </div>
        </Link>
      </div>

      {/* Quick Add Transaction Button */}
      <div className="p-3.5 space-y-2">
        <button
          onClick={openAddTransaction}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98] text-white font-semibold py-2.5 px-4 rounded-xl text-xs shadow-md shadow-violet-600/20 transition-all cursor-pointer group"
        >
          <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-200" />
          <span>Add Transaction</span>
        </button>

        {/* Gmail Sync (for owner) */}
        {settings.googleSheetsUrl && currentUser?.role === 'owner' && (
          <button
            onClick={() => syncBankEmails()}
            disabled={isSyncing}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-medium py-2 px-3 rounded-xl text-xs border border-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
            title="Scan Gmail for new bank transaction alert emails"
          >
            <MailCheck className={cn('w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400', isSyncing && 'animate-spin')} />
            <span>{isSyncing ? 'Scanning Gmail...' : 'Sync Bank Emails'}</span>
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto">
        <div className="px-3 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Portfolio
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group',
                isActive
                  ? 'bg-violet-50 dark:bg-violet-500/20 text-violet-700 dark:text-white font-semibold border border-violet-200 dark:border-violet-500/30 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 transition-colors',
                  isActive
                    ? 'text-violet-600 dark:text-violet-400'
                    : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'
                )}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Quick Settings Toggles Bar */}
      <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span className="text-[11px] font-medium">Quick Toggles</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => togglePrivacyMode()}
            title={isPrivacy ? 'Privacy Mode Active (Tap to show)' : 'Enable Privacy Mode (Blur amounts)'}
            className={cn(
              'p-1.5 rounded-lg transition-colors cursor-pointer',
              isPrivacy
                ? 'bg-violet-500/20 text-violet-600 dark:text-violet-300'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            {isPrivacy ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => toggleDarkLight()}
            title="Toggle Light / Dark Theme"
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-violet-600" />}
          </button>
        </div>
      </div>

      {/* Bottom Profile Banner Card */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800/60">
        <div
          className="relative overflow-hidden rounded-xl border border-white/10 shadow-xs transition-all duration-300"
          style={getBannerStyle(currentUser?.banner || 'midnight')}
        >
          <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-[2px]" />

          <div className="relative p-3 space-y-2.5 z-10 text-white">
            <div className="flex items-center justify-between text-[11px] text-white/80">
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    'w-1.5 h-1.5 rounded-full ring-2 ring-white/20',
                    isGuestUser()
                      ? 'bg-amber-400'
                      : settings.googleSheetsUrl
                      ? 'bg-emerald-400'
                      : 'bg-slate-400'
                  )}
                />
                <span className="font-medium text-[10px] tracking-wide uppercase">
                  {isGuestUser()
                    ? 'Offline'
                    : syncStatus === 'syncing'
                    ? 'Syncing…'
                    : syncStatus === 'pending'
                    ? 'Pending'
                    : settings.googleSheetsUrl
                    ? 'Synced'
                    : 'Local'}
                </span>
              </div>
              {!isGuestUser() && (
                <button
                  onClick={() => refreshData()}
                  disabled={isSyncing}
                  title="Refresh & Sync Data"
                  aria-label="Refresh Data"
                  className="p-1 text-white/70 hover:text-white hover:bg-white/15 rounded-md transition-colors cursor-pointer"
                >
                  <RefreshCw className={cn('w-3 h-3', isSyncing && 'animate-spin')} />
                </button>
              )}
            </div>

            <Link href="/settings" className="flex items-center gap-2.5 group">
              <ProfileAvatar
                avatar={currentUser?.avatar}
                presetId={currentUser?.avatarPreset}
                name={currentUser?.name}
                size="md"
                className="ring-2 ring-white/30 group-hover:ring-white/70 transition-all shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate group-hover:text-white/90">
                  {currentUser?.name || (isGuestUser() ? 'Local Account' : currentUser?.email || 'Personal Account')}
                </p>
                <p className="text-[10px] text-white/75 truncate flex items-center gap-1">
                  <span className="capitalize">{currentUser?.role === 'owner' ? '👑 Owner' : isGuestUser() ? 'Offline' : 'User'}</span>
                  <span>&bull;</span>
                  <span>{settings.currency || 'NPR'}</span>
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
