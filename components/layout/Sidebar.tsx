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
import { ProfileAvatar } from '@/lib/profile-avatars';
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
    <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-screen sticky top-0 shrink-0 z-30 select-none">
      {/* Header / Brand */}
      <div className="p-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="h-9 w-9 rounded-lg bg-slate-900 dark:bg-slate-100 flex items-center justify-center text-white dark:text-slate-900 shadow-xs group-hover:scale-105 transition-transform">
            <WalletCards className="h-5 w-5" />
          </div>
          <div>
            <span className="font-display font-semibold text-slate-900 dark:text-slate-100 tracking-tight text-base block leading-tight">
              Expense Tracker
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-normal block">
              Financial cockpit
            </span>
          </div>
        </Link>
      </div>

      {/* Quick Add Transaction Button */}
      <div className="p-3.5 space-y-2">
        <button
          onClick={openAddTransaction}
          className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-violet-600 dark:hover:bg-violet-500 active:scale-[0.98] text-white font-medium py-2.5 px-4 rounded-lg text-xs shadow-xs transition-colors cursor-pointer group"
        >
          <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-200" />
          <span>Add transaction</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        <div className="px-3 py-1.5 text-xs font-medium text-slate-400 dark:text-slate-500">
          Navigation
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                isActive
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
              )}
            >
              <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500')} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User & Global Controls Footer */}
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between px-2">
          {/* User Profile */}
          <div className="flex items-center gap-2 min-w-0">
            <ProfileAvatar
              avatar={currentUser?.avatar}
              presetId={currentUser?.avatarPreset || 'default'}
              name={currentUser?.name || 'User'}
              size="sm"
            />
            <div className="min-w-0">
              <span className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate block">
                {currentUser?.name || 'Guest User'}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block capitalize">
                {isGuestUser() ? 'Guest preview' : currentUser?.role || 'User'}
              </span>
            </div>
          </div>

          {/* Quick Utility Toggles */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => togglePrivacyMode()}
              aria-label={isPrivacy ? 'Disable privacy mode' : 'Enable privacy mode'}
              title={isPrivacy ? 'Privacy mode on' : 'Privacy mode off'}
              className={cn(
                'p-1.5 rounded-md transition-colors cursor-pointer',
                isPrivacy
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              )}
            >
              {isPrivacy ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => toggleDarkLight()}
              aria-label="Toggle theme"
              title="Toggle theme"
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md transition-colors cursor-pointer"
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
